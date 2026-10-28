"use client";
import { useEffect, useRef, useState, type ReactNode } from "react";
import type { Map as MLMap, GeoJSONSource } from "maplibre-gl";
import { destination, distanceKm, fmt, fmtCoords, type LatLng } from "@/lib/geo";
import { geolocation } from "@/lib/geocode";
import { sumArchiveDaily } from "@/lib/archiveTotals";
import { ErrorBox, Field, Seg, Spinner, Stat } from "@/components/ui";
import { DynamicMap, pinElement, PlaceField, type PlaceValue } from "./shared";

/* ---------------- shared grid helpers ---------------- */

const MI_KM = 1.609344;
const M_TO_FT = 3.28084;
const CM_TO_IN = 0.393701;
const MM_TO_IN = 0.0393701;

interface GridSample { pt: LatLng; ring: [number, number][]; row: number; col: number }
interface Cell extends GridSample { value: number; color: string }

function offsetPoint(origin: LatLng, northKm: number, eastKm: number): LatLng {
  let p = origin;
  if (northKm !== 0) p = destination(p, northKm > 0 ? 0 : 180, Math.abs(northKm));
  if (eastKm !== 0) p = destination(p, eastKm > 0 ? 90 : 270, Math.abs(eastKm));
  return p;
}

/** n×n sample grid centred on `center`, covering spanMi × spanMi miles. */
function buildGrid(center: LatLng, spanMi: number, n: number): { samples: GridSample[]; stepKm: number } {
  const stepKm = (spanMi * MI_KM) / n;
  const half = stepKm / 2;
  const samples: GridSample[] = [];
  for (let row = 0; row < n; row++) {
    for (let col = 0; col < n; col++) {
      const north = ((n - 1) / 2 - row) * stepKm;
      const east = (col - (n - 1) / 2) * stepKm;
      const pt = offsetPoint(center, north, east);
      const corners = [
        offsetPoint(pt, half, -half), offsetPoint(pt, half, half),
        offsetPoint(pt, -half, half), offsetPoint(pt, -half, -half),
      ];
      const ring = [...corners, corners[0]].map((c) => [c.lng, c.lat] as [number, number]);
      samples.push({ pt, ring, row, col });
    }
  }
  return { samples, stepKm };
}

async function fetchElevations(points: LatLng[]): Promise<number[]> {
  const url = `https://api.open-meteo.com/v1/elevation?latitude=${points.map((p) => p.lat.toFixed(5)).join(",")}&longitude=${points.map((p) => p.lng.toFixed(5)).join(",")}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("elevation");
  const data: any = await res.json();
  const vals: number[] = data?.elevation ?? [];
  if (vals.length !== points.length || vals.some((v) => typeof v !== "number" || !Number.isFinite(v))) throw new Error("elevation");
  return vals;
}

/** Sum one daily archive variable per point, in the API's native units. */
async function fetchArchiveTotals(points: LatLng[], start: string, end: string, variable: string): Promise<number[]> {
  const url = `https://archive-api.open-meteo.com/v1/archive?latitude=${points.map((p) => p.lat.toFixed(5)).join(",")}&longitude=${points.map((p) => p.lng.toFixed(5)).join(",")}&start_date=${start}&end_date=${end}&daily=${variable}&timezone=auto`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("archive");
  const data: any = await res.json();
  const arr: any[] = Array.isArray(data) ? data : [data];
  if (arr.length !== points.length) throw new Error("archive");
  const expectedDays = Math.round((Date.parse(`${end}T00:00:00Z`) - Date.parse(`${start}T00:00:00Z`)) / 86400000) + 1;
  if (!Number.isFinite(expectedDays) || expectedDays < 1) throw new Error("invalid date range");
  return arr.map((item) => {
    const total = sumArchiveDaily(item?.daily?.[variable], expectedDays);
    if (total === null) throw new Error("incomplete archive");
    return total;
  });
}

function bandColor(value: number, min: number, max: number, colors: string[]): string {
  if (max <= min) return colors[Math.floor(colors.length / 2)];
  const i = Math.min(colors.length - 1, Math.floor(((value - min) / (max - min)) * colors.length));
  return colors[i];
}

function Legend({ items }: { items: { color: string; label: string }[] }) {
  return (
    <div>
      <span className="label">Legend</span>
      <div className="flex flex-wrap gap-1.5">
        {items.map((it, i) => (
          <span key={i} className="chip"><span className="mr-1 inline-block h-2.5 w-2.5 rounded-sm align-middle" style={{ background: it.color }} />{it.label}</span>
        ))}
      </div>
    </div>
  );
}

/** Map that draws coloured grid cells plus a centre pin, and reports clicks. */
function GridMap({ center, cells, onPick, zoom = 11 }: { center: PlaceValue | null; cells: Cell[]; onPick: (p: LatLng) => void; zoom?: number }) {
  const mapRef = useRef<MLMap | null>(null);
  const libRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const cellsRef = useRef<Cell[]>(cells);
  useEffect(() => { cellsRef.current = cells; }, [cells]);

  const draw = () => {
    const map = mapRef.current, lib = libRef.current;
    if (!map || !lib) return;
    (map.getSource("grid") as GeoJSONSource | undefined)?.setData({
      type: "FeatureCollection",
      features: cellsRef.current.map((c) => ({ type: "Feature", properties: { color: c.color, value: c.value }, geometry: { type: "Polygon", coordinates: [c.ring] } })),
    } as any);
    if (center) {
      if (!markerRef.current) markerRef.current = new lib.Marker({ element: pinElement("#d95d32") }).setLngLat([center.lng, center.lat]).addTo(map);
      else markerRef.current.setLngLat([center.lng, center.lat]);
    }
  };
  useEffect(draw, [center, cells]);

  return (
    <div className="order-1 lg:order-2">
      <DynamicMap center={center ?? { lat: 39.5, lng: -98.35 }} zoom={center ? zoom : 3} className="tall" onReady={(map, lib) => {
        mapRef.current = map; libRef.current = lib;
        map.addSource("grid", { type: "geojson", data: { type: "FeatureCollection", features: [] } });
        map.addLayer({ id: "grid-fill", type: "fill", source: "grid", paint: { "fill-color": ["get", "color"] as any, "fill-opacity": 0.62 } });
        map.addLayer({ id: "grid-line", type: "line", source: "grid", paint: { "line-color": "#ffffff", "line-width": 0.6, "line-opacity": 0.7 } });
        map.on("click", (e: any) => onPick({ lat: e.lngLat.lat, lng: e.lngLat.lng }));
        draw();
      }} />
    </div>
  );
}

/** Place search + GPS button block shared by the point-based grid tools. */
function CenterPicker({ center, setCenter, setError, label = "Centre point" }: {
  center: PlaceValue | null; setCenter: (v: PlaceValue | null) => void; setError: (m: string | null) => void; label?: string;
}) {
  return (
    <>
      <PlaceField label={label} value={center} onChange={setCenter} />
      <div className="flex items-center gap-2">
        <button type="button" className="btn btn-ghost btn-sm" onClick={async () => {
          try { const p = await geolocation(); setCenter({ ...p, label: "My location" }); setError(null); }
          catch (e: any) { setError(e?.message ?? "Geolocation failed."); }
        }}>📍 Use GPS</button>
        <span className="text-xs text-mute">…or click the map.</span>
      </div>
    </>
  );
}

const SPANS = [
  { value: "2", label: "2 mi" }, { value: "5", label: "5 mi" },
  { value: "10", label: "10 mi" }, { value: "25", label: "25 mi" },
];

/* ---------------- elevation atlas ---------------- */

const ELEV_COLORS = ["#225ea8", "#41b6c4", "#a1dab4", "#fecc5c", "#d95d32"];

function ElevationAtlas() {
  const [center, setCenter] = useState<PlaceValue | null>(null);
  const [span, setSpan] = useState("10");
  const [busy, setBusy] = useState(false);
  const requestId = useRef(0);
  const invalidate = () => { requestId.current++; setBusy(false); setCells([]); setStats(null); setError(null); };
  const [error, setError] = useState<string | null>(null);
  const [cells, setCells] = useState<Cell[]>([]);
  const [stats, setStats] = useState<{ min: number; max: number; mean: number; hi: LatLng; lo: LatLng } | null>(null);

  const run = async () => {
    if (!center) { setError("Pick a centre first — search, click the map, or use GPS."); return; }
    const id = ++requestId.current;
    setBusy(true); setError(null); setCells([]); setStats(null);
    try {
      const { samples } = buildGrid(center, parseFloat(span), 7);
      const elevs = await fetchElevations(samples.map((s) => s.pt));
      if (id !== requestId.current) return;
      const min = Math.min(...elevs), max = Math.max(...elevs);
      const mean = elevs.reduce((a, b) => a + b, 0) / elevs.length;
      setCells(samples.map((s, i) => ({ ...s, value: elevs[i], color: bandColor(elevs[i], min, max, ELEV_COLORS) })));
      setStats({ min, max, mean, hi: samples[elevs.indexOf(max)].pt, lo: samples[elevs.indexOf(min)].pt });
    } catch { if (id !== requestId.current) return; setError("The Open-Meteo elevation service didn't answer — try again shortly."); }
    setBusy(false);
  };

  const legend = stats ? ELEV_COLORS.map((color, i) => {
    const lo = stats.min + ((stats.max - stats.min) * i) / ELEV_COLORS.length;
    const hi = stats.min + ((stats.max - stats.min) * (i + 1)) / ELEV_COLORS.length;
    return { color, label: `${fmt(lo * M_TO_FT, 0)}–${fmt(hi * M_TO_FT, 0)} ft` };
  }) : [];

  return (
    <div className="grid gap-4 lg:grid-cols-[400px,1fr]">
      <div className="card order-2 space-y-4 p-4 lg:order-1">
        <CenterPicker center={center} setCenter={(v) => { setCenter(v); invalidate(); }} setError={setError} />
        <div><span className="label">Area size</span><Seg options={SPANS} value={span} onChange={(v) => { setSpan(v); invalidate(); }} ariaLabel="Area size" /></div>
        <button type="button" className="btn btn-primary w-full" onClick={run} disabled={busy}>{busy ? <Spinner label="Sampling 49 elevations…" /> : "Map the elevations"}</button>
        {error && <ErrorBox>{error}</ErrorBox>}
        {stats && (
          <>
            <div className="grid grid-cols-2 gap-2">
              <Stat label="Lowest" value={`${fmt(stats.min * M_TO_FT, 0)} ft`} sub={fmtCoords(stats.lo)} />
              <Stat label="Highest" value={`${fmt(stats.max * M_TO_FT, 0)} ft`} sub={fmtCoords(stats.hi)} />
              <Stat label="Average" value={`${fmt(stats.mean * M_TO_FT, 0)} ft`} sub="across all 49 samples" />
              <Stat label="Relief" value={`${fmt((stats.max - stats.min) * M_TO_FT, 0)} ft`} sub="highest minus lowest" />
            </div>
            <Legend items={legend} />
          </>
        )}
        <p className="text-xs text-mute">A 7 × 7 grid of real elevations from the Open-Meteo elevation API (based on terrain models such as SRTM). Each cell is coloured by its centre sample — a picture of the ground, not a survey.</p>
      </div>
      <GridMap center={center} cells={cells} onPick={(p) => { setCenter(p); invalidate(); }} />
    </div>
  );
}

/* ---------------- terrain grid (slope) ---------------- */

const SLOPE_BANDS = [
  { max: 2, color: "#a1dab4", label: "Flat · under 2%" },
  { max: 5, color: "#ffff8c", label: "Gentle · 2–5%" },
  { max: 10, color: "#fecc5c", label: "Moderate · 5–10%" },
  { max: 20, color: "#f03b20", label: "Steep · 10–20%" },
  { max: Infinity, color: "#7f0000", label: "Very steep · over 20%" },
];

function TerrainGrid() {
  const [center, setCenter] = useState<PlaceValue | null>(null);
  const [span, setSpan] = useState("5");
  const [busy, setBusy] = useState(false);
  const requestId = useRef(0);
  const invalidate = () => { requestId.current++; setBusy(false); setCells([]); setStats(null); setError(null); };
  const [error, setError] = useState<string | null>(null);
  const [cells, setCells] = useState<Cell[]>([]);
  const [stats, setStats] = useState<{ mean: number; max: number; steepPct: number } | null>(null);

  const run = async () => {
    if (!center) { setError("Pick a centre first — search, click the map, or use GPS."); return; }
    const id = ++requestId.current;
    setBusy(true); setError(null); setCells([]); setStats(null);
    try {
      const n = 9;
      const { samples, stepKm } = buildGrid(center, parseFloat(span), n);
      const elevs = await fetchElevations(samples.map((s) => s.pt));
      if (id !== requestId.current) return;
      const at = (r: number, c: number) => elevs[r * n + c];
      const out: Cell[] = [];
      for (let r = 1; r < n - 1; r++) {
        for (let c = 1; c < n - 1; c++) {
          const e = at(r, c);
          const maxDiff = Math.max(Math.abs(e - at(r - 1, c)), Math.abs(e - at(r + 1, c)), Math.abs(e - at(r, c - 1)), Math.abs(e - at(r, c + 1)));
          const slope = (maxDiff / (stepKm * 1000)) * 100;
          const band = SLOPE_BANDS.find((b) => slope < b.max) ?? SLOPE_BANDS[SLOPE_BANDS.length - 1];
          out.push({ ...samples[r * n + c], value: slope, color: band.color });
        }
      }
      const slopes = out.map((c) => c.value);
      setCells(out);
      setStats({
        mean: slopes.reduce((a, b) => a + b, 0) / slopes.length,
        max: Math.max(...slopes),
        steepPct: (slopes.filter((s) => s > 15).length / slopes.length) * 100,
      });
    } catch { if (id !== requestId.current) return; setError("The Open-Meteo elevation service didn't answer — try again shortly."); }
    setBusy(false);
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[400px,1fr]">
      <div className="card order-2 space-y-4 p-4 lg:order-1">
        <CenterPicker center={center} setCenter={(v) => { setCenter(v); invalidate(); }} setError={setError} />
        <div><span className="label">Area size</span><Seg options={SPANS} value={span} onChange={(v) => { setSpan(v); invalidate(); }} ariaLabel="Area size" /></div>
        <button type="button" className="btn btn-primary w-full" onClick={run} disabled={busy}>{busy ? <Spinner label="Sampling 81 elevations…" /> : "Map the slopes"}</button>
        {error && <ErrorBox>{error}</ErrorBox>}
        {stats && (
          <>
            <div className="grid grid-cols-2 gap-2">
              <Stat label="Average slope" value={`${fmt(stats.mean, 1)}%`} />
              <Stat label="Steepest slope" value={`${fmt(stats.max, 1)}%`} />
              <Stat label="Area over 15% slope" value={`${fmt(stats.steepPct, 0)}%`} sub="of the sampled cells" />
            </div>
            <Legend items={SLOPE_BANDS.map((b) => ({ color: b.color, label: b.label }))} />
          </>
        )}
        <p className="text-xs text-mute">Slope is worked out from a 9 × 9 elevation sample (the map shows the inner 7 × 7 cells, which have neighbours on all sides). Honest note: resolution depends on the span you pick — a wide span smooths out small steep spots. This is a sampled model, not a survey.</p>
      </div>
      <GridMap center={center} cells={cells} onPick={(p) => { setCenter(p); invalidate(); }} />
    </div>
  );
}

/* ---------------- snow & rain archive grids ---------------- */

const SNOW_COLORS = ["#eff3ff", "#bdd7e7", "#6baed6", "#3182bd", "#08519c"];
const RAIN_COLORS = ["#ffffcc", "#a1dab4", "#41b6c4", "#2c7fb8", "#253494"];

function ArchiveGrid({ kind }: { kind: "snow" | "rain" }) {
  const isSnow = kind === "snow";
  const [today] = useState(() => new Date());
  const iso = (d: Date) => d.toISOString().slice(0, 10);
  const [center, setCenter] = useState<PlaceValue | null>(null);
  const latestWinter = today.getUTCFullYear() - (today.getUTCMonth() < 3 ? 2 : 1);
  const [year, setYear] = useState(latestWinter);
  const [start, setStart] = useState(iso(new Date(today.getTime() - 89 * 86400000)));
  const [end, setEnd] = useState(iso(today));
  const [period, setPeriod] = useState("90");
  const [busy, setBusy] = useState(false);
  const requestId = useRef(0);
  const invalidate = () => { requestId.current++; setBusy(false); setCells([]); setStats(null); setError(null); };
  const [error, setError] = useState<string | null>(null);
  const [cells, setCells] = useState<Cell[]>([]);
  const [stats, setStats] = useState<{ point: number; max: number; mean: number } | null>(null);

  const run = async () => {
    if (!center) { setError("Pick a point first — search, click the map, or use GPS."); return; }
    const s = isSnow ? `${year}-12-01` : start;
    const e = isSnow ? `${year + 1}-03-31` : end;
    if (!isSnow && (!s || !e || s > e)) { setError("Pick a start date that comes before the end date."); return; }
    const id = ++requestId.current;
    setBusy(true); setError(null); setCells([]); setStats(null);
    try {
      const { samples } = buildGrid(center, 25, 5);
      const raw = await fetchArchiveTotals(samples.map((x) => x.pt), s, e, isSnow ? "snowfall_sum" : "precipitation_sum");
      if (id !== requestId.current) return;
      const totals = raw.map((v) => v * (isSnow ? CM_TO_IN : MM_TO_IN));
      const min = 0, max = Math.max(...totals, 0.01);
      const colors = isSnow ? SNOW_COLORS : RAIN_COLORS;
      setCells(samples.map((x, i) => ({ ...x, value: totals[i], color: bandColor(totals[i], min, max, colors) })));
      setStats({ point: totals[12], max, mean: totals.reduce((a, b) => a + b, 0) / totals.length });
    } catch { if (id !== requestId.current) return; setError("The archive request failed or returned missing daily values. Check the dates and try again; incomplete totals are not shown."); }
    setBusy(false);
  };

  const legendMax = stats?.max ?? 0;
  const colors = isSnow ? SNOW_COLORS : RAIN_COLORS;
  const legend = stats ? colors.map((color, i) => ({
    color, label: `${fmt((legendMax * i) / colors.length, 1)}–${fmt((legendMax * (i + 1)) / colors.length, 1)} in`,
  })) : [];

  return (
    <div className="grid gap-4 lg:grid-cols-[400px,1fr]">
      <div className="card order-2 space-y-4 p-4 lg:order-1">
        <CenterPicker center={center} setCenter={(v) => { setCenter(v); invalidate(); }} setError={setError} label="Your point" />
        {isSnow ? (
          <Field label="Winter season (starts this December)">
            <input type="number" className="input" min={1980} max={latestWinter} value={year}
              onChange={(e) => { setYear(Math.min(latestWinter, Math.max(1980, parseInt(e.target.value) || latestWinter))); invalidate(); }} />
          </Field>
        ) : (
          <>
            <div><span className="label">Quick period</span>
              <Seg options={[{ value: "30", label: "30 days" }, { value: "90", label: "90 days" }, { value: "365", label: "1 year" }]}
                value={period}
                onChange={(v) => { invalidate(); setPeriod(v); const d = parseInt(v); setEnd(iso(new Date())); setStart(iso(new Date(Date.now() - (d - 1) * 86400000))); }}
                ariaLabel="Quick period" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Start date"><input type="date" className="input" value={start} onChange={(e) => { invalidate(); setPeriod(""); setStart(e.target.value); }} /></Field>
              <Field label="End date"><input type="date" className="input" value={end} onChange={(e) => { invalidate(); setPeriod(""); setEnd(e.target.value); }} /></Field>
            </div>
          </>
        )}
        <button type="button" className="btn btn-primary w-full" onClick={run} disabled={busy}>
          {busy ? <Spinner label="Adding up the archive…" /> : isSnow ? "Map the season's snowfall" : "Map the precipitation"}
        </button>
        {error && <ErrorBox>{error}</ErrorBox>}
        {stats && (
          <>
            <div className="grid grid-cols-2 gap-2">
              <Stat label={isSnow ? "Snowfall at your point" : "Precipitation at your point"} value={`${fmt(stats.point, 1)} in`} />
              <Stat label="Wettest cell nearby" value={`${fmt(stats.max, 1)} in`} sub="highest of the 25 cells" />
              <Stat label="Area average" value={`${fmt(stats.mean, 1)} in`} sub="25 cells over about 25 miles" />
            </div>
            <Legend items={legend} />
          </>
        )}
        <p className="text-xs text-mute">
          {isSnow
            ? "This maps modelled total snowfall, not snow depth. Daily Open-Meteo archive values are summed over December 1 to March 31; missing values cause an error instead of being counted as zero."
            : "Daily total precipitation from the Open-Meteo archive is summed over your dates across a 5 × 5 grid about 25 miles wide. It includes snow water equivalent, not just rain. Model estimates and ground gauges can differ."}
        </p>
      </div>
      <GridMap center={center} cells={cells} onPick={(p) => { setCenter(p); invalidate(); }} zoom={9} />
    </div>
  );
}

/* ---------------- GPS speedometer ---------------- */

const nowMs = () => Date.now();

function GpsSpeedometer() {
  const [watching, setWatching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [speedMph, setSpeedMph] = useState<number | null>(null);
  const [speedKmh, setSpeedKmh] = useState<number | null>(null);
  const [maxMph, setMaxMph] = useState(0);
  const [distMi, setDistMi] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const watchRef = useRef<number | null>(null);
  const lastRef = useRef<{ pt: LatLng; t: number } | null>(null);
  const totalKmRef = useRef(0);
  const maxRef = useRef(0);
  const baseElapsedRef = useRef(0);
  const startStampRef = useRef<number | null>(null);

  useEffect(() => {
    if (!watching) return;
    const id = setInterval(() => {
      if (startStampRef.current) setElapsed(baseElapsedRef.current + (nowMs() - startStampRef.current) / 1000);
    }, 500);
    return () => clearInterval(id);
  }, [watching]);

  useEffect(() => () => { if (watchRef.current !== null && typeof navigator !== "undefined") navigator.geolocation?.clearWatch(watchRef.current); }, []);

  const startWatch = () => {
    setError(null);
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setError("This browser does not support geolocation, so the speedometer can't run here.");
      return;
    }
    startStampRef.current = nowMs();
    watchRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const pt = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        const now = pos.timestamp || nowMs();
        let mps: number | null = pos.coords.speed;
        if (lastRef.current) {
          const dKm = distanceKm(lastRef.current.pt, pt);
          const dt = (now - lastRef.current.t) / 1000;
          // Ignore GPS jitter: only count moves larger than the reported accuracy.
          if (dKm * 1000 > Math.max(3, (pos.coords.accuracy ?? 10) / 2)) totalKmRef.current += dKm;
          if ((mps === null || !Number.isFinite(mps)) && dt > 0) mps = (dKm * 1000) / dt;
        }
        lastRef.current = { pt, t: now };
        if (mps !== null && Number.isFinite(mps) && mps >= 0) {
          const mph = mps * 2.23694;
          setSpeedMph(mph); setSpeedKmh(mps * 3.6);
          if (mph > maxRef.current) { maxRef.current = mph; setMaxMph(mph); }
        }
        setDistMi(totalKmRef.current * 0.621371);
        setAccuracy(pos.coords.accuracy ?? null);
      },
      (err) => {
        setError(err.code === 1
          ? "Location permission was denied. Allow location for this site in your browser settings, then press Start again."
          : "Your position could not be determined. Try again outdoors with a clear view of the sky.");
        stopWatch();
      },
      { enableHighAccuracy: true, maximumAge: 1000, timeout: 20000 },
    );
    setWatching(true);
  };

  const stopWatch = () => {
    if (watchRef.current !== null && typeof navigator !== "undefined") navigator.geolocation?.clearWatch(watchRef.current);
    watchRef.current = null;
    lastRef.current = null;
    setSpeedMph(null); setSpeedKmh(null);
    if (startStampRef.current) baseElapsedRef.current += (nowMs() - startStampRef.current) / 1000;
    startStampRef.current = null;
    setWatching(false);
  };

  const clear = () => {
    totalKmRef.current = 0; maxRef.current = 0; lastRef.current = null;
    baseElapsedRef.current = 0; if (watching) startStampRef.current = nowMs();
    setSpeedMph(null); setSpeedKmh(null); setMaxMph(0); setDistMi(0); setElapsed(0); setAccuracy(null); setError(null);
  };

  const avgMph = elapsed > 5 ? (distMi / elapsed) * 3600 : 0;
  const mm = Math.floor(elapsed / 60), ss = Math.floor(elapsed % 60);

  return (
    <div className="grid gap-4 lg:grid-cols-[400px,1fr]">
      <div className="card space-y-4 p-4">
        <div className="text-center">
          <div className="text-[11px] font-bold uppercase tracking-wide text-mute">Current speed</div>
          <div className="font-display text-6xl font-bold">{speedMph !== null ? fmt(speedMph, 1) : "—"}<span className="ml-2 text-xl text-mute">mph</span></div>
          <div className="mt-1 text-sm text-mute">{speedKmh !== null ? `${fmt(speedKmh, 1)} km/h` : "Waiting for a GPS fix…"}</div>
        </div>
        <div className="flex gap-2">
          {watching
            ? <button type="button" className="btn btn-primary w-full" onClick={stopWatch}>Stop</button>
            : <button type="button" className="btn btn-primary w-full" onClick={startWatch}>Start</button>}
          <button type="button" className="btn btn-ghost" onClick={clear}>Clear</button>
        </div>
        {error && <ErrorBox>{error}</ErrorBox>}
        <p className="text-xs text-mute">Speed uses the device reading when available or estimates it from successive fixes. Distance can be affected by jitter or missed movement. This display is not a certified speedometer; do not use it while driving. The speedometer itself does not upload or save the location stream.</p>
      </div>
      <div className="grid content-start grid-cols-2 gap-2">
        <Stat label="Top speed" value={`${fmt(maxMph, 1)} mph`} />
        <Stat label="Average speed" value={`${fmt(avgMph, 1)} mph`} sub="distance ÷ time tracking was active" />
        <Stat label="Distance travelled" value={`${fmt(distMi, 2)} mi`} sub={`${fmt(distMi * 1.609344, 2)} km`} />
        <Stat label="Elapsed time" value={`${mm}:${String(ss).padStart(2, "0")}`} sub="minutes : seconds" />
        <Stat label="GPS accuracy" value={accuracy !== null ? `± ${fmt(accuracy * M_TO_FT, 0)} ft` : "—"} sub={accuracy !== null ? `± ${fmt(accuracy, 0)} m` : "no fix yet"} />
      </div>
    </div>
  );
}

/* ---------------- moon calendar ---------------- */

const SYNODIC = 29.53058867;
const NEW_MOON_2000 = Date.UTC(2000, 0, 6, 18, 14);
const PHASES = [
  { name: "New", emoji: "🌑" }, { name: "Waxing Crescent", emoji: "🌒" },
  { name: "First Quarter", emoji: "🌓" }, { name: "Waxing Gibbous", emoji: "🌔" },
  { name: "Full", emoji: "🌕" }, { name: "Waning Gibbous", emoji: "🌖" },
  { name: "Last Quarter", emoji: "🌗" }, { name: "Waning Crescent", emoji: "🌘" },
];
const MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

function moonFor(dateUtcMs: number) {
  const days = (dateUtcMs - NEW_MOON_2000) / 86400000;
  const age = ((days % SYNODIC) + SYNODIC) % SYNODIC;
  const illum = (1 - Math.cos((2 * Math.PI * age) / SYNODIC)) / 2;
  const idx = Math.min(7, Math.floor(((age + SYNODIC / 16) % SYNODIC) / (SYNODIC / 8)));
  return { age, illum, phase: PHASES[idx] };
}

function MoonCalendar() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const firstWeekday = new Date(Date.UTC(year, month, 1)).getUTCDay();
  const isToday = (d: number) => year === now.getFullYear() && month === now.getMonth() && d === now.getDate();
  const cells: ReactNode[] = [];
  for (let i = 0; i < firstWeekday; i++) cells.push(<div key={`b${i}`} />);
  for (let d = 1; d <= daysInMonth; d++) {
    const m = moonFor(Date.UTC(year, month, d, 12));
    cells.push(
      <div key={d} className={`rounded-xl border p-2 text-center ${isToday(d) ? "border-brand bg-brand-soft ring-1 ring-brand/40" : "border-line bg-white/60"}`}>
        <div className="text-xs font-bold">{d}{isToday(d) ? " · today" : ""}</div>
        <div className="my-1 text-2xl leading-none" aria-hidden>{m.phase.emoji}</div>
        <div className="text-[11px] font-semibold">{m.phase.name}</div>
        <div className="text-[11px] text-mute">{fmt(m.illum * 100, 0)}% lit</div>
      </div>,
    );
  }
  return (
    <div className="space-y-4">
      <div className="card flex flex-wrap items-end gap-3 p-4">
        <Field label="Month">
          <select className="input" value={month} onChange={(e) => setMonth(parseInt(e.target.value))}>
            {MONTH_NAMES.map((name, i) => <option key={name} value={i}>{name}</option>)}
          </select>
        </Field>
        <Field label="Year">
          <input type="number" className="input w-28" min={1950} max={2100} value={year} onChange={(e) => setYear(Math.min(2100, Math.max(1950, parseInt(e.target.value) || now.getFullYear())))} />
        </Field>
        <button type="button" className="btn btn-ghost btn-sm" onClick={() => { setYear(now.getFullYear()); setMonth(now.getMonth()); }}>This month</button>
      </div>
      <div className="card p-4">
        <div className="mb-2 grid grid-cols-7 gap-2 text-center text-[11px] font-bold uppercase tracking-wide text-mute">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => <div key={d}>{d}</div>)}
        </div>
        <div className="grid grid-cols-7 gap-2">{cells}</div>
        <p className="mt-3 text-xs text-mute">Phases are approximate mean-cycle estimates at noon UTC, anchored to January 6, 2000. Actual phase times and illumination vary from this simplified model; check a reliable ephemeris for precise dates and times.</p>
      </div>
    </div>
  );
}

/* ---------------- cicada broods + observations (GBIF) ---------------- */

interface CicadaPt extends LatLng { year?: number }

/** Periodical broods with published state ranges (USDA Forest Service /
 *  University of Connecticut brood maps, state-level simplification). */
const BROODS: { name: string; cycle: 13 | 17; last: number; states: string[] }[] = [
  { name: "Brood I (Blue Ridge)", cycle: 17, last: 2012, states: ["VA", "WV"] },
  { name: "Brood II", cycle: 17, last: 2013, states: ["CT", "MD", "NJ", "NY", "NC", "PA", "VA"] },
  { name: "Brood III (Iowan)", cycle: 17, last: 2014, states: ["IA", "IL", "MO"] },
  { name: "Brood IV (Kansan)", cycle: 17, last: 2015, states: ["IA", "KS", "MO", "NE", "OK", "TX"] },
  { name: "Brood V", cycle: 17, last: 2016, states: ["MD", "NY", "OH", "PA", "VA", "WV"] },
  { name: "Brood VI", cycle: 17, last: 2017, states: ["GA", "NC", "SC"] },
  { name: "Brood VII (Onondaga)", cycle: 17, last: 2018, states: ["NY"] },
  { name: "Brood VIII", cycle: 17, last: 2019, states: ["OH", "PA", "WV"] },
  { name: "Brood IX", cycle: 17, last: 2020, states: ["NC", "VA", "WV"] },
  { name: "Brood X (Great Eastern)", cycle: 17, last: 2021, states: ["DC", "DE", "GA", "IL", "IN", "KY", "MD", "MI", "NC", "NJ", "NY", "OH", "PA", "TN", "VA", "WV"] },
  { name: "Brood XIII (Northern Illinois)", cycle: 17, last: 2024, states: ["IA", "IL", "IN", "WI"] },
  { name: "Brood XIV", cycle: 17, last: 2025, states: ["GA", "IN", "KY", "MA", "MD", "NC", "NJ", "NY", "OH", "PA", "TN", "VA", "WV"] },
  { name: "Brood XIX (Great Southern)", cycle: 13, last: 2024, states: ["AL", "AR", "GA", "IL", "IN", "KY", "LA", "MD", "MO", "MS", "NC", "OK", "SC", "TN", "TX", "VA"] },
  { name: "Brood XXII (Baton Rouge)", cycle: 13, last: 2014, states: ["LA", "MS"] },
  { name: "Brood XXIII (Mississippi Valley)", cycle: 13, last: 2015, states: ["AR", "IL", "IN", "KY", "LA", "MO", "MS", "TN"] },
];

const STATE_ABBR: Record<string, string> = {
  alabama: "AL", arizona: "AZ", arkansas: "AR", california: "CA", colorado: "CO", connecticut: "CT", delaware: "DE",
  "district of columbia": "DC", florida: "FL", georgia: "GA", iowa: "IA", illinois: "IL", indiana: "IN", kansas: "KS",
  kentucky: "KY", louisiana: "LA", maine: "ME", maryland: "MD", massachusetts: "MA", michigan: "MI", minnesota: "MN",
  mississippi: "MS", missouri: "MO", nebraska: "NE", nevada: "NV", "new hampshire": "NH", "new jersey": "NJ",
  "new york": "NY", "north carolina": "NC", ohio: "OH", oklahoma: "OK", oregon: "OR", pennsylvania: "PA",
  "rhode island": "RI", "south carolina": "SC", tennessee: "TN", texas: "TX", utah: "UT", vermont: "VT",
  virginia: "VA", washington: "WA", "west virginia": "WV", wisconsin: "WI",
};

function nextEmergence(b: { cycle: number; last: number }): number {
  const now = new Date().getFullYear();
  let y = b.last;
  while (y <= now) y += b.cycle;
  return y;
}

function CicadaMap() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [place, setPlace] = useState<PlaceValue | null>(null);
  const [broodBusy, setBroodBusy] = useState(false);
  const [broods, setBroods] = useState<{ state: string; list: { name: string; cycle: number; next: number }[] } | null>(null);
  const [broodError, setBroodError] = useState<string | null>(null);
  const [pts, setPts] = useState<CicadaPt[]>([]);
  const [yearRange, setYearRange] = useState<string>("—");
  const mapRef = useRef<MLMap | null>(null);
  const libRef = useRef<any>(null);
  const ptsRef = useRef<CicadaPt[]>(pts);
  useEffect(() => { ptsRef.current = pts; }, [pts]);

  const draw = () => {
    const map = mapRef.current;
    if (!map) return;
    (map.getSource("cic") as GeoJSONSource | undefined)?.setData({
      type: "FeatureCollection",
      features: ptsRef.current.map((p) => ({ type: "Feature", properties: {}, geometry: { type: "Point", coordinates: [p.lng, p.lat] } })),
    } as any);
  };
  useEffect(draw, [pts]);

  const load = async () => {
    setBusy(true); setError(null);
    try {
      const res = await fetch("https://api.gbif.org/v1/occurrence/search?genus=Magicicada&hasCoordinate=true&limit=300&occurrenceStatus=PRESENT");
      if (!res.ok) throw new Error();
      const data: any = await res.json();
      const list: CicadaPt[] = (data?.results ?? [])
        .filter((r: any) => Number.isFinite(r.decimalLatitude) && Number.isFinite(r.decimalLongitude))
        .map((r: any) => ({ lat: r.decimalLatitude, lng: r.decimalLongitude, year: Number.isFinite(r.year) ? r.year : undefined }));
      if (!list.length) throw new Error();
      const years = list.map((p) => p.year).filter((y): y is number => y !== undefined);
      if (years.length) setYearRange(`${Math.min(...years)}–${Math.max(...years)}`);
      setPts(list);
    } catch { setError("The GBIF occurrence service didn't answer — try again shortly."); }
    setBusy(false);
  };

  // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time initial fetch on mount
  useEffect(() => { load(); }, []);

  const identifyBrood = async () => {
    if (!place) { setBroodError("Set a US location first."); return; }
    setBroodBusy(true); setBroodError(null); setBroods(null);
    try {
      const res = await fetch(`https://photon.komoot.io/reverse?lat=${place.lat}&lon=${place.lng}`);
      if (!res.ok) throw new Error();
      const data: any = await res.json();
      const props = data?.features?.[0]?.properties ?? {};
      const country: string = props.country ?? "";
      if (country !== "United States") throw new Error("Select a location that the geocoder identifies as being in the United States.");
      if (!props.state) throw new Error("The location service did not return a US state. Choose a different point.");
      const abbr = STATE_ABBR[(props.state ?? "").toLowerCase()] ?? (props.state ?? "").toUpperCase();
      const list = BROODS.filter((b) => b.states.includes(abbr))
        .map((b) => ({ name: b.name, cycle: b.cycle, next: nextEmergence(b) }))
        .sort((a, b) => a.next - b.next);
      setBroods({ state: props.state ?? abbr, list });
    } catch (e: any) {
      setBroodError(e?.message && (String(e.message).includes("United States") || String(e.message).includes("US state")) ? e.message : "The location lookup didn't answer — try again shortly.");
    }
    setBroodBusy(false);
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[400px,1fr]">
      <div className="card order-2 space-y-4 p-4 lg:order-1">
        <div className="space-y-3 rounded-xl border border-line p-3">
          <div className="label">Possible broods listed for a state</div>
          <PlaceField label="US location" value={place} onChange={setPlace} />
          <button type="button" className="btn btn-primary w-full" onClick={identifyBrood} disabled={broodBusy || !place}>{broodBusy ? <Spinner label="Looking up the brood…" /> : "List possible state broods"}</button>
          {broodError && <ErrorBox>{broodError}</ErrorBox>}
          {broods && (broods.list.length ? (
            <div className="space-y-2">
              <p className="text-sm font-medium">Broods in the tool’s state-level list for {broods.state}:</p>
              {broods.list.map((b) => (
                <div key={b.name} className="flex items-center justify-between gap-2 rounded-lg bg-paper px-3 py-2">
                  <span className="text-sm font-semibold">{b.name}</span>
                  <span className="chip chip-brand">{b.cycle}-year · next after this year: {b.next}</span>
                </div>
              ))}
              <p className="text-xs text-mute">Ranges are matched at state level from the published brood maps — a brood rarely covers a whole state, so treat this as “possible here” and check a county-level brood map for certainty.</p>
            </div>
          ) : (
            <p className="text-sm text-mute">No periodical brood is recorded for {broods.state}. Annual (“dog-day”) cicadas still appear every summer in most of the US — they just don&apos;t arrive in brood waves.</p>
          ))}
        </div>
        <button type="button" className="btn btn-primary w-full" onClick={load} disabled={busy}>{busy ? <Spinner label="Fetching observations…" /> : "Reload observations"}</button>
        {error && <ErrorBox>{error}</ErrorBox>}
        <div className="grid grid-cols-2 gap-2">
          <Stat label="Observations plotted" value={pts.length ? fmt(pts.length, 0) : "—"} sub="up to 300 returned records" />
          <Stat label="Years covered" value={yearRange} />
        </div>
        <p className="text-xs text-mute">These dots are recorded observations of <em>Magicicada</em> — the periodical cicadas of the eastern United States — reported to GBIF by researchers and the public. They show where cicadas have been seen, mostly in the US. This is a record of the past, not a forecast of the next emergence.</p>
      </div>
      <div className="order-1 lg:order-2">
        <DynamicMap center={{ lat: 39.5, lng: -98.35 }} zoom={4} className="tall" onReady={(map, lib) => {
          mapRef.current = map; libRef.current = lib;
          map.addSource("cic", { type: "geojson", data: { type: "FeatureCollection", features: [] } });
          map.addLayer({ id: "cic-dots", type: "circle", source: "cic", paint: { "circle-color": "#9d174d", "circle-radius": 5, "circle-stroke-color": "#fff", "circle-stroke-width": 1.2, "circle-opacity": 0.85 } });
          draw();
        }} />
      </div>
    </div>
  );
}

/* ---------------- dispatch ---------------- */

export default function ListEarthTools({ params }: { params?: Record<string, unknown> }) {
  const mode = (params?.mode as string) ?? "elevation-atlas";
  switch (mode) {
    case "terrain-grid": return <TerrainGrid />;
    case "gps-speedometer": return <GpsSpeedometer />;
    case "moon-calendar": return <MoonCalendar />;
    case "snow": return <ArchiveGrid kind="snow" />;
    case "rain": return <ArchiveGrid kind="rain" />;
    case "cicada": return <CicadaMap />;
    case "elevation-atlas":
    default: return <ElevationAtlas />;
  }
}
