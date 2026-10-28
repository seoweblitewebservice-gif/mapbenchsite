"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import type { Map as MLMap } from "maplibre-gl";
import { distanceKm, kmTo, type UnitKey } from "@/lib/geo";
import { downloadText, toCsv } from "@/lib/formats";
import { networkMatrix } from "@/lib/routingMatrix";
import type { TravelMode } from "@/lib/routing";
import { DynamicMap, PALETTE, PlaceField, pinElement, type PlaceValue } from "./shared";
import { ErrorBox, Spinner } from "@/components/ui";

const PRESETS: { label: string; points: PlaceValue[] }[] = [
  {
    label: "US cities",
    points: [
      { label: "New York", lat: 40.7128, lng: -74.006 },
      { label: "Chicago", lat: 41.8781, lng: -87.6298 },
      { label: "Los Angeles", lat: 34.0522, lng: -118.2437 },
      { label: "Houston", lat: 29.7604, lng: -95.3698 },
    ],
  },
  {
    label: "Europe",
    points: [
      { label: "London", lat: 51.5072, lng: -0.1276 },
      { label: "Paris", lat: 48.8566, lng: 2.3522 },
      { label: "Berlin", lat: 52.52, lng: 13.405 },
      { label: "Rome", lat: 41.9028, lng: 12.4964 },
    ],
  },
];

type MatrixMode = "straight" | TravelMode;
type ViewMode = "matrix" | "pairs";

export default function MatrixTool() {
  const [places, setPlaces] = useState<(PlaceValue | null)[]>([null, null]);
  const [unit, setUnit] = useState<UnitKey>("km");
  const [mode, setMode] = useState<MatrixMode>("straight");
  const [view, setView] = useState<ViewMode>("matrix");
  const [paste, setPaste] = useState("");
  const [roadDistances, setRoadDistances] = useState<(number | null)[][] | null>(null);
  const [roadDurations, setRoadDurations] = useState<(number | null)[][] | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mapRef = useRef<MLMap | null>(null);
  const libRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const requestId = useRef(0);
  const [mapReady, setMapReady] = useState(false);

  const valid = useMemo(() => places.filter(Boolean) as PlaceValue[], [places]);
  const straight = useMemo(() => valid.map((a) => valid.map((b) => distanceKm(a, b))), [valid]);
  const activeMatrix = mode === "straight" ? straight : roadDistances;

  const name = (p: PlaceValue, i: number) => p.label || `Point ${i + 1}`;
  const converted = (km: number | null) => km == null ? null : kmTo(km, unit);
  const unitLabel = unit === "mi" ? "mi" : "km";

  const stats = useMemo(() => {
    if (!activeMatrix?.length) return null;
    const vals: { d: number; i: number; j: number }[] = [];
    for (let i = 0; i < activeMatrix.length; i++) {
      for (let j = i + 1; j < activeMatrix.length; j++) {
        const d = activeMatrix[i]?.[j];
        if (typeof d === "number" && Number.isFinite(d)) vals.push({ d, i, j });
      }
    }
    if (!vals.length) return null;
    vals.sort((a, b) => a.d - b.d);
    return {
      nearest: vals[0],
      farthest: vals[vals.length - 1],
      average: vals.reduce((s, x) => s + x.d, 0) / vals.length,
      pairs: vals,
    };
  }, [activeMatrix]);

  const redraw = (points = valid) => {
    const map = mapRef.current, lib = libRef.current;
    if (!map || !lib) return;
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = points.map((p, i) => new lib.Marker({ element: pinElement(PALETTE[i % PALETTE.length], String(i + 1)) })
      .setLngLat([p.lng, p.lat]).addTo(map));
    if (points.length === 1) map.flyTo({ center: [points[0].lng, points[0].lat], zoom: 10, essential: true });
    if (points.length > 1) {
      const lngs = points.map((p) => p.lng), lats = points.map((p) => p.lat);
      map.fitBounds([[Math.min(...lngs), Math.min(...lats)], [Math.max(...lngs), Math.max(...lats)]], { padding: 55, maxZoom: 10, duration: 450 });
    }
  };

  useEffect(() => {
    if (mapReady) redraw(valid);
    // redraw reads map refs; run when the points or map readiness change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [valid, mapReady]);

  const resetRoad = () => { requestId.current++; setBusy(false); setRoadDistances(null); setRoadDurations(null); setError(null); };
  const setPoint = (i: number, v: PlaceValue | null) => {
    setPlaces((ps) => ps.map((p, j) => j === i ? v : p));
    resetRoad();
  };

  const applyPreset = (points: PlaceValue[]) => {
    setPlaces(points);
    resetRoad();
  };

  const parsePaste = () => {
    const lines = paste.split(/\n+/).map((s) => s.trim()).filter(Boolean);
    if (lines.length > 50) { setError("Import at most 50 lines; no points were imported."); return; }
    const parsed: PlaceValue[] = [];
    for (const line of lines) {
      const parts = line.split(/\s*[,;|\t]\s*/);
      let label = "";
      let lat: number, lng: number;
      if (parts.length >= 3 && parts[parts.length - 2] && parts[parts.length - 1] && Number.isFinite(Number(parts[parts.length - 2])) && Number.isFinite(Number(parts[parts.length - 1]))) {
        label = parts.slice(0, -2).join(", "); lat = Number(parts[parts.length - 2]); lng = Number(parts[parts.length - 1]);
      } else if (parts.length === 2 && parts[0] && parts[1]) {
        lat = Number(parts[0]); lng = Number(parts[1]);
      } else continue;
      if (Math.abs(lat) <= 90 && Math.abs(lng) <= 180) parsed.push({ lat, lng, label: label || `Point ${parsed.length + 1}` });
    }
    if (parsed.length !== lines.length || parsed.length < 2) { setError("Every line must contain valid coordinates; at least two lines are required. Example: Delhi, 28.6139, 77.2090"); return; }
    setPlaces(parsed); setError(null); resetRoad();
  };

  const calculateRoad = async () => {
    if (mode === "straight") return;
    if (valid.length < 2) { setError("Add at least two places."); return; }
    if (valid.length > 15) { setError("Road/walk/cycle matrices are limited to 15 points. Straight-line mode supports up to 50."); return; }
    const id = ++requestId.current;
    setBusy(true); setError(null);
    const res = await networkMatrix(valid, mode);
    if (id !== requestId.current) return;
    setBusy(false);
    if (!res.ok) { setError(res.message); setRoadDistances(null); setRoadDurations(null); return; }
    setRoadDistances(res.distancesKm); setRoadDurations(res.durationsS);
  };

  const exportWide = () => {
    if (!activeMatrix) return;
    const headers = ["From / To", ...valid.map(name)];
    const rows = valid.map((p, i) => [name(p, i), ...valid.map((_, j) => i === j ? "" : (converted(activeMatrix[i]?.[j] ?? null)?.toFixed(3) ?? ""))]);
    downloadText("mapbench-distance-matrix-wide.csv", toCsv(headers, rows as any), "text/csv");
  };

  const exportLong = () => {
    if (!activeMatrix) return;
    const rows: (string | number)[][] = [];
    for (let i = 0; i < valid.length; i++) for (let j = 0; j < valid.length; j++) {
      if (i === j) continue;
      rows.push([name(valid[i], i), name(valid[j], j), converted(activeMatrix[i]?.[j] ?? null)?.toFixed(3) ?? "", unitLabel,
        mode !== "straight" && roadDurations?.[i]?.[j] != null ? Math.round((roadDurations[i][j] as number) / 60) : ""]);
    }
    downloadText("mapbench-distance-matrix-long.csv", toCsv(["from", "to", "distance", "unit", "minutes"], rows), "text/csv");
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-[390px,1fr]">
        <div className="card order-2 space-y-4 p-4 lg:order-1">
          <div className="flex flex-wrap gap-2">
            {(["straight", "driving", "walking", "cycling"] as MatrixMode[]).map((m) => (
              <button key={m} type="button" className={`btn btn-sm ${mode === m ? "btn-primary" : "btn-ghost"}`} onClick={() => { setMode(m); resetRoad(); }}>
                {m === "straight" ? "↗ Straight line" : m === "driving" ? "🚗 Drive" : m === "walking" ? "🚶 Walk" : "🚴 Cycle"}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap gap-2">
            {PRESETS.map((p) => <button key={p.label} type="button" className="btn btn-ghost btn-sm" onClick={() => applyPreset(p.points)}>Sample: {p.label}</button>)}
          </div>

          <details className="rounded-xl border border-line bg-well/30 p-3">
            <summary className="cursor-pointer text-sm font-bold">Paste a list of coordinates</summary>
            <textarea className="textarea mt-3 min-h-28 font-mono text-xs" value={paste} onChange={(e) => setPaste(e.target.value)} placeholder={"Delhi, 28.6139, 77.2090\nMumbai, 19.0760, 72.8777\nBengaluru, 12.9716, 77.5946"} />
            <button type="button" className="btn btn-primary btn-sm mt-2" onClick={parsePaste}>Import points</button>
          </details>

          <div className="max-h-[520px] space-y-3 overflow-y-auto pr-1">
            {places.map((p, i) => (
              <div key={i} className="relative rounded-xl border border-line bg-white p-3">
                <PlaceField label={`Place ${i + 1}`} value={p} onChange={(v) => setPoint(i, v)} />
                {places.length > 2 && <button type="button" className="btn btn-ghost btn-sm mt-2" onClick={() => { const next = places.filter((_, j) => j !== i); setPlaces(next); resetRoad(); }}>Remove</button>}
              </div>
            ))}
          </div>

          <div className="flex flex-wrap gap-2">
            {places.length < 50 && <button type="button" className="btn btn-ghost btn-sm" onClick={() => setPlaces((ps) => [...ps, null])}>+ Add place</button>}
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => { setPlaces([null, null]); resetRoad(); }}>Clear all</button>
          </div>
          {mode !== "straight" && <button type="button" className="btn btn-primary w-full" disabled={busy || valid.length < 2} onClick={calculateRoad}>{busy ? <Spinner label="Building matrix…" /> : `Calculate ${mode} matrix`}</button>}
          {error && <ErrorBox>{error}</ErrorBox>}
        </div>

        <div className="order-1 space-y-3 lg:order-2">
          <DynamicMap center={{ lat: 28, lng: 10 }} zoom={1.6} className="tall" onReady={(map, lib) => {
            mapRef.current = map; libRef.current = lib; setMapReady(true);
            map.on("click", (e: any) => {
              const lat = e.lngLat.lat, lng = e.lngLat.lng;
              setPlaces((current) => {
                if (current.length >= 50) return current;
                const p: PlaceValue = { lat, lng, label: `Map point ${current.filter(Boolean).length + 1}` };
                const emptyIndex = current.findIndex((x) => !x);
                return emptyIndex >= 0 ? current.map((x, i) => i === emptyIndex ? p : x) : [...current, p];
              });
              resetRoad();
            });
          }} />
          <p className="text-xs text-mute">Click the map to add points. Search, GPS and pasted coordinates are also supported.</p>
        </div>
      </div>

      {valid.length >= 2 && (mode === "straight" || activeMatrix) && (
        <section className="card p-4 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="label !mb-0">{mode === "straight" ? "Great-circle distance matrix" : `${mode} network matrix`}</div>
              <p className="mt-1 text-sm text-mute">{valid.length} points · {valid.length * (valid.length - 1)} directed pairs</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button type="button" className={`btn btn-sm ${view === "matrix" ? "btn-primary" : "btn-ghost"}`} onClick={() => setView("matrix")}>Matrix</button>
              <button type="button" className={`btn btn-sm ${view === "pairs" ? "btn-primary" : "btn-ghost"}`} onClick={() => setView("pairs")}>Pair list</button>
              <button type="button" className={`btn btn-sm ${unit === "km" ? "btn-primary" : "btn-ghost"}`} onClick={() => setUnit("km")}>km</button>
              <button type="button" className={`btn btn-sm ${unit === "mi" ? "btn-primary" : "btn-ghost"}`} onClick={() => setUnit("mi")}>mi</button>
              <button type="button" className="btn btn-ghost btn-sm" onClick={exportWide}>Wide CSV</button>
              <button type="button" className="btn btn-ghost btn-sm" onClick={exportLong}>Long CSV</button>
            </div>
          </div>

          {stats && <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <Metric label="Nearest pair" value={`${name(valid[stats.nearest.i], stats.nearest.i)} ↔ ${name(valid[stats.nearest.j], stats.nearest.j)}`} sub={`${converted(stats.nearest.d)?.toFixed(1)} ${unitLabel}`} />
            <Metric label="Average separation" value={`${converted(stats.average)?.toFixed(1)} ${unitLabel}`} />
            <Metric label="Farthest pair" value={`${name(valid[stats.farthest.i], stats.farthest.i)} ↔ ${name(valid[stats.farthest.j], stats.farthest.j)}`} sub={`${converted(stats.farthest.d)?.toFixed(1)} ${unitLabel}`} />
          </div>}

          {view === "matrix" ? (
            <div className="mt-4 overflow-x-auto rounded-xl border border-line">
              <table className="tbl min-w-[620px]">
                <thead><tr><th></th>{valid.map((p, i) => <th key={i}>{name(p, i)}</th>)}</tr></thead>
                <tbody>{valid.map((p, i) => <tr key={i}><td className="font-semibold">{name(p, i)}</td>{valid.map((_, j) => {
                  const d = activeMatrix?.[i]?.[j] ?? null;
                  const mins = roadDurations?.[i]?.[j] != null ? Math.round((roadDurations[i][j] as number) / 60) : null;
                  return <td key={j} className={i === j ? "text-mute" : "font-medium"}>{i === j ? "—" : d == null ? "No route" : <><div>{converted(d)?.toFixed(d < 10 ? 2 : 1)} {unitLabel}</div>{mins != null && <div className="text-[10px] text-mute">{mins} min</div>}</>}</td>;
                })}</tr>)}</tbody>
              </table>
            </div>
          ) : (
            <div className="mt-4 max-h-[520px] overflow-y-auto rounded-xl border border-line">
              <table className="tbl"><thead><tr><th>From</th><th>To</th><th className="text-right">Distance</th>{mode !== "straight" && <th className="text-right">Time</th>}</tr></thead><tbody>
                {stats?.pairs.map(({ i, j, d }) => <tr key={`${i}-${j}`}><td>{name(valid[i], i)}</td><td>{name(valid[j], j)}</td><td className="text-right font-semibold">{converted(d)?.toFixed(d < 10 ? 2 : 1)} {unitLabel}</td>{mode !== "straight" && <td className="text-right text-mute">{roadDurations?.[i]?.[j] != null ? `${Math.round((roadDurations[i][j] as number) / 60)} min` : "—"}</td>}</tr>)}
              </tbody></table>
            </div>
          )}

          <p className="mt-3 text-xs leading-relaxed text-mute">Straight-line mode is calculated locally using great-circle distance. Drive/walk/cycle mode uses the public Valhalla OpenStreetMap routing service and is limited to 15 points per request.</p>
        </section>
      )}
    </div>
  );
}

function Metric({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return <div className="premium-stat"><div className="premium-stat-label">{label}</div><div className="premium-stat-value !text-lg">{value}</div>{sub && <div className="premium-stat-sub">{sub}</div>}</div>;
}
