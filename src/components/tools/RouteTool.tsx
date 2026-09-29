"use client";
import { useEffect, useRef, useState } from "react";
import type { Map as MLMap, GeoJSONSource } from "maplibre-gl";
import { fmtDist, type LatLng } from "@/lib/geo";
import { route, optimizedOrder, fmtDuration, type RouteResult, type TravelMode } from "@/lib/routing";
import { downloadText, geojsonToGpx } from "@/lib/formats";
import { readUrlParams, syncUrl, Seg, Spinner, ErrorBox, Stat } from "@/components/ui";
import { DynamicMap, pinElement, PlaceField, type PlaceValue } from "./shared";

const MODES: { value: TravelMode; label: string }[] = [
  { value: "driving", label: "🚗 Drive" },
  { value: "walking", label: "🚶 Walk" },
  { value: "cycling", label: "🚴 Cycle" },
];

export default function RouteTool({ params }: { params?: Record<string, unknown> }) {
  const multi = !!params?.multi;
  const optimize = !!params?.optimize;
  const compare = !!params?.compare;
  const [mode, setMode] = useState<TravelMode>((params?.mode as TravelMode) ?? "driving");
  const [stops, setStops] = useState<PlaceValue[]>(() => {
    const p = readUrlParams().get("stops");
    if (p) {
      const pts = p.split(";").map((s) => s.split(",")).map(([a, b]) => ({ lat: parseFloat(a), lng: parseFloat(b) }))
        .filter((x) => Number.isFinite(x.lat) && Number.isFinite(x.lng));
      if (pts.length >= 2) return pts;
    }
    return multi || compare ? [null as any, null as any] : [null as any, null as any];
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<RouteResult | null>(null);
  const [compareResults, setCompareResults] = useState<Partial<Record<TravelMode, RouteResult>>>({});
  const mapRef = useRef<MLMap | null>(null);
  const libRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);

  const setStop = (i: number, v: PlaceValue | null) => setStops((s) => s.map((x, j) => (j === i ? v : x)) as PlaceValue[]);
  const valid = stops.filter(Boolean) as PlaceValue[];

  useEffect(() => {
    if (valid.length >= 2) syncUrl({ stops: valid.map((s) => `${s.lat.toFixed(5)},${s.lng.toFixed(5)}`).join(";"), mode });
  }, [valid.length, mode]); // eslint-disable-line react-hooks/exhaustive-deps

  const draw = (res: RouteResult | null) => {
    const map = mapRef.current, lib = libRef.current;
    if (!map || !lib) return;
    markersRef.current.forEach((m) => m.remove()); markersRef.current = [];
    valid.forEach((s, i) => markersRef.current.push(new lib.Marker({ element: pinElement(i === 0 ? "#1d6e63" : "#d95d32", String(i + 1)) }).setLngLat([s.lng, s.lat]).addTo(map)));
    const src = map.getSource("route") as GeoJSONSource | undefined;
    if (res) {
      src?.setData({ type: "Feature", properties: {}, geometry: { type: "LineString", coordinates: res.shape.map((p) => [p.lng, p.lat]) } });
      const lats = res.shape.map((p) => p.lat), lngs = res.shape.map((p) => p.lng);
      map.fitBounds([[Math.min(...lngs), Math.min(...lats)], [Math.max(...lngs), Math.max(...lats)]], { padding: 60, maxZoom: 14, duration: 600 });
    } else src?.setData({ type: "FeatureCollection", features: [] });
  };

  const calc = async (m: TravelMode = mode) => {
    if (valid.length < 2) { setError("Add at least two stops."); return; }
    setBusy(true); setError(null);
    const r = await route(valid, m);
    setBusy(false);
    if (!r.ok) { setError(r.message); setResult(null); draw(null); return; }
    setResult(r); draw(r);
  };

  const calcCompare = async () => {
    if (valid.length < 2) { setError("Add a start and destination."); return; }
    setBusy(true); setError(null); setCompareResults({});
    const acc: Partial<Record<TravelMode, RouteResult>> = {};
    for (const m of ["driving", "walking", "cycling"] as TravelMode[]) {
      const r = await route(valid, m);
      if (r.ok) { acc[m] = r; setCompareResults({ ...acc }); if (m === "driving") draw(r); }
    }
    setBusy(false);
    if (!acc.driving && !acc.walking && !acc.cycling) setError("Routing is unavailable right now — please try again shortly.");
  };

  const doOptimize = async () => {
    if (valid.length < 3) { setError("Add at least three stops to optimize."); return; }
    setBusy(true); setError(null);
    const r = await optimizedOrder(valid, mode);
    setBusy(false);
    if (!r.ok) { setError(r.message); return; }
    setStops(r.ordered);
    setResult(r.result); draw(r.result);
  };

  const exportGpx = () => {
    if (!result) return;
    const fc: GeoJSON.FeatureCollection = {
      type: "FeatureCollection",
      features: [
        ...valid.map((s, i) => ({ type: "Feature" as const, properties: { name: `Stop ${i + 1}` }, geometry: { type: "Point" as const, coordinates: [s.lng, s.lat] } })),
        { type: "Feature" as const, properties: { name: "Route" }, geometry: { type: "LineString" as const, coordinates: result.shape.map((p) => [p.lng, p.lat]) } },
      ],
    };
    downloadText("mapbench-route.gpx", geojsonToGpx(fc, "MapBench route"), "application/gpx+xml");
  };

  useEffect(() => { draw(result); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [stops.length]);

  return (
    <div className="grid gap-4 lg:grid-cols-[400px,1fr]">
      <div className="card order-2 space-y-4 p-4 lg:order-1">
        {!compare && <Seg options={MODES} value={mode} onChange={(m) => { setMode(m); if (result) calc(m); }} ariaLabel="Travel mode" />}
        <div className="space-y-3">
          {stops.map((s, i) => (
            <div key={i} className="flex items-start gap-2">
              <span className="mt-2 h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: i === 0 ? "#1d6e63" : "#d95d32" }} aria-hidden />
              <div className="flex-1"><PlaceField label={i === 0 ? "Start" : multi ? `Stop ${i + 1}` : "Destination"} value={s} onChange={(v) => setStop(i, v)} /></div>
              {(multi || stops.length > 2) && stops.length > 2 && <button type="button" className="btn btn-ghost btn-sm mt-5" aria-label={`Remove stop ${i + 1}`} onClick={() => setStops((s2) => s2.filter((_, j) => j !== i))}>✕</button>}
            </div>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          {multi && stops.length < 12 && <button type="button" className="btn btn-ghost btn-sm" onClick={() => setStops((s) => [...s, null as any])}>+ Add stop</button>}
          <button type="button" className="btn btn-ghost btn-sm" disabled={valid.length < 2 || valid.length !== stops.length} onClick={() => setStops([...valid.reverse()] as PlaceValue[])}>Reverse</button>
          {(multi || optimize) && <button type="button" className="btn btn-ghost btn-sm" onClick={doOptimize} disabled={busy}>⚡ Optimize order</button>}
        </div>
        <button type="button" className="btn btn-primary w-full" onClick={compare ? calcCompare : () => calc()} disabled={busy}>
          {busy ? <Spinner label="Routing…" /> : compare ? "Calculate all modes" : "Calculate route"}
        </button>
        {error && <ErrorBox>{error}</ErrorBox>}

        {compare ? (
          <div className="space-y-2">
            {(["driving", "walking", "cycling"] as TravelMode[]).map((m) => {
              const r = compareResults[m];
              return <div key={m} className="flex items-center justify-between rounded-lg border border-line px-3 py-2.5 text-sm"><span className="font-semibold capitalize">{m}</span>{r ? <span className="text-mute">{fmtDist(r.distanceKm, "km")} · <strong className="text-ink">{fmtDuration(r.durationS)}</strong></span> : <span className="text-mute">—</span>}</div>;
            })}
          </div>
        ) : result && (
          <div className="space-y-3 border-t border-line pt-3">
            <div className="grid grid-cols-2 gap-2">
              <Stat label="Road distance" value={fmtDist(result.distanceKm, "km")} sub={fmtDist(result.distanceKm, "mi")} />
              <Stat label="Est. travel time" value={fmtDuration(result.durationS)} sub={`via ${result.provider === "valhalla" ? "Valhalla" : "OSRM"} · free-flow`} />
            </div>
            {multi && result.legs.length > 1 && (
              <details>
                <summary className="cursor-pointer text-sm font-semibold text-brand-strong">Per-leg breakdown</summary>
                <table className="tbl mt-2"><thead><tr><th>Leg</th><th className="text-right">Distance</th><th className="text-right">Time</th></tr></thead><tbody>{result.legs.map((l, i) => <tr key={i}><td className="text-mute">{i + 1} → {i + 2}</td><td className="text-right">{fmtDist(l.distanceKm, "km")}</td><td className="text-right">{fmtDuration(l.durationS)}</td></tr>)}</tbody></table>
              </details>
            )}
            <div className="flex flex-wrap gap-2"><button type="button" className="btn btn-primary btn-sm" onClick={exportGpx}>Export GPX</button></div>
            <p className="text-xs text-mute">Times are free-flow estimates from the road network — not live traffic.</p>
          </div>
        )}
      </div>
      <div className="order-1 lg:order-2">
        <DynamicMap center={{ lat: 30, lng: 0 }} zoom={1.6} className="tall" onReady={(map, lib) => {
          mapRef.current = map; libRef.current = lib;
          map.addSource("route", { type: "geojson", data: { type: "FeatureCollection", features: [] } });
          map.addLayer({ id: "route-case", type: "line", source: "route", paint: { "line-color": "#fff", "line-width": 7, "line-opacity": 0.9 } });
          map.addLayer({ id: "route-line", type: "line", source: "route", paint: { "line-color": "#1d6e63", "line-width": 4 } });
        }} />
      </div>
    </div>
  );
}
