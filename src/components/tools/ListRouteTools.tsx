"use client";
import { useEffect, useRef, useState, type ReactNode } from "react";
import type { Map as MLMap, GeoJSONSource } from "maplibre-gl";
import { bearingBetween, destination, distanceKm, fmt, fmtCoords, fmtDist, type LatLng } from "@/lib/geo";
import { nominatimReverse, photonSearch } from "@/lib/geocode";
import { ukPostcode } from "@/lib/nationalGrid";
import { equidistanceArc } from "@/lib/equidistance";
import { route, fmtDuration, type TravelMode } from "@/lib/routing";
import { downloadText } from "@/lib/formats";
import { ErrorBox, Field, FileDropzone, Seg, Spinner, Stat } from "@/components/ui";
import { DynamicMap, pinElement, PlaceField, type PlaceValue } from "./shared";

/**
 * Route-focused pages added for the user's list: trip calculator, loop
 * generator, stage planners, equidistance line, postal-code meeting points,
 * surface/terrain analysis, elevation gain, hiking planner, roadbooks,
 * flyover and GPX performance comparison. Routing uses the site's existing
 * Valhalla/OSRM abstraction (@/lib/routing); elevations are sampled from
 * Open-Meteo.
 */

type Mode =
  | "trip" | "loop" | "stages" | "overnight" | "equidistance"
  | "postal-centroid" | "canada-centroid" | "surface" | "gain" | "hiking"
  | "roadbook" | "multi-roadbook" | "flyover" | "performance";

export default function ListRouteTools({ params }: { params?: Record<string, unknown> }) {
  const mode = ((params?.mode as string) ?? "trip") as Mode;
  switch (mode) {
    case "loop": return <LoopTool />;
    case "stages": return <StageTool driving={false} />;
    case "overnight": return <StageTool driving />;
    case "equidistance": return <EquidistanceTool />;
    case "postal-centroid": return <PostalCentroidTool canada={false} />;
    case "canada-centroid": return <PostalCentroidTool canada />;
    case "surface": return <SurfaceTool />;
    case "gain": return <GainTool hiking={false} />;
    case "hiking": return <GainTool hiking />;
    case "roadbook": return <RoadbookTool multiDay={false} />;
    case "multi-roadbook": return <RoadbookTool multiDay />;
    case "flyover": return <FlyoverTool />;
    case "performance": return <PerformanceTool />;
    default: return <TripTool />;
  }
}

/* ---------------- shared helpers ---------------- */

function useRouteMap(defaultCenter: LatLng = { lat: 30, lng: 10 }, defaultZoom = 1.8) {
  const mapRef = useRef<MLMap | null>(null);
  const libRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const draw = (line: LatLng[], marks: LatLng[]) => {
    const map = mapRef.current, lib = libRef.current;
    if (!map || !lib) return;
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = marks.map((p, i) => new lib.Marker({ element: pinElement(i === 0 ? "#1d6e63" : "#d95d32", String(i + 1)) }).setLngLat([p.lng, p.lat]).addTo(map));
    (map.getSource("rt") as GeoJSONSource | undefined)?.setData({
      type: "Feature", properties: {},
      geometry: { type: "LineString", coordinates: line.map((p) => [p.lng, p.lat]) },
    });
    const all = line.length ? line : marks;
    if (all.length > 1) {
      const lngs = all.map((p) => p.lng), lats = all.map((p) => p.lat);
      map.fitBounds([[Math.min(...lngs), Math.min(...lats)], [Math.max(...lngs), Math.max(...lats)]], { padding: 60, maxZoom: 13, duration: 500 });
    } else if (all.length === 1) map.flyTo({ center: [all[0].lng, all[0].lat], zoom: 11, essential: true });
  };
  const el = (
    <DynamicMap center={defaultCenter} zoom={defaultZoom} className="tall" onReady={(map, lib) => {
      mapRef.current = map; libRef.current = lib;
      map.addSource("rt", { type: "geojson", data: { type: "FeatureCollection", features: [] } });
      map.addLayer({ id: "rt-case", type: "line", source: "rt", paint: { "line-color": "#fff", "line-width": 7, "line-opacity": 0.9 } });
      map.addLayer({ id: "rt-line", type: "line", source: "rt", paint: { "line-color": "#1d6e63", "line-width": 4 } });
    }} />
  );
  return { el, draw, mapRef, libRef };
}

function StopsEditor({ stops, setStops, max = 12 }: { stops: (PlaceValue | null)[]; setStops: (s: (PlaceValue | null)[]) => void; max?: number }) {
  return (
    <div className="space-y-3">
      {stops.map((s, i) => (
        <div key={i} className="flex items-start gap-2">
          <span className="mt-2 h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: i === 0 ? "#1d6e63" : "#d95d32" }} aria-hidden />
          <div className="flex-1">
            <PlaceField label={i === 0 ? "Start" : i === stops.length - 1 ? "End" : `Stop ${i + 1}`} value={s} onChange={(v) => setStops(stops.map((x, j) => (j === i ? v : x)))} />
          </div>
          {stops.length > 2 && <button type="button" className="btn btn-ghost btn-sm mt-5" aria-label={`Remove stop ${i + 1}`} onClick={() => setStops(stops.filter((_, j) => j !== i))}>✕</button>}
        </div>
      ))}
      {stops.length < max && <button type="button" className="btn btn-ghost btn-sm" onClick={() => setStops([...stops, null])}>+ Add stop</button>}
    </div>
  );
}

function Layout({ panel, map }: { panel: ReactNode; map: ReactNode }) {
  return (
    <div className="grid gap-4 lg:grid-cols-[400px,1fr]">
      <div className="card order-2 space-y-4 p-4 lg:order-1">{panel}</div>
      <div className="order-1 lg:order-2">{map}</div>
    </div>
  );
}

/** Cumulative distances (km) along a shape. */
function cumulative(shape: LatLng[]): number[] {
  const out = [0];
  for (let i = 1; i < shape.length; i++) out.push(out[i - 1] + distanceKm(shape[i - 1], shape[i]));
  return out;
}

/** Point at a given cumulative distance along the shape. */
function pointAt(shape: LatLng[], cum: number[], targetKm: number): LatLng {
  for (let i = 1; i < cum.length; i++) {
    if (cum[i] >= targetKm) {
      const seg = cum[i] - cum[i - 1] || 1;
      const f = (targetKm - cum[i - 1]) / seg;
      return { lat: shape[i - 1].lat + (shape[i].lat - shape[i - 1].lat) * f, lng: shape[i - 1].lng + (shape[i].lng - shape[i - 1].lng) * f };
    }
  }
  return shape[shape.length - 1];
}

/** Sample up to n points evenly by distance along the shape. */
function resample(shape: LatLng[], n: number): LatLng[] {
  if (shape.length <= n) return shape;
  const cum = cumulative(shape);
  const total = cum[cum.length - 1];
  const out: LatLng[] = [];
  for (let i = 0; i < n; i++) out.push(pointAt(shape, cum, (total * i) / (n - 1)));
  return out;
}

async function sampleElevations(shape: LatLng[], n = 30): Promise<{ pts: LatLng[]; ele: number[] } | null> {
  try {
    const pts = resample(shape, n);
    const url = `https://api.open-meteo.com/v1/elevation?latitude=${pts.map((p) => p.lat.toFixed(5)).join(",")}&longitude=${pts.map((p) => p.lng.toFixed(5)).join(",")}`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    const ele: number[] = data.elevation ?? [];
    if (!ele.length) return null;
    return { pts, ele };
  } catch { return null; }
}

function elevGain(ele: number[]): { gain: number; loss: number } {
  let gain = 0, loss = 0;
  for (let i = 1; i < ele.length; i++) {
    const d = ele[i] - ele[i - 1];
    if (d > 0) gain += d; else loss -= d;
  }
  return { gain, loss };
}

async function placeName(p: LatLng): Promise<string> {
  const r = await nominatimReverse(p.lat, p.lng, 10);
  if (!r.ok) return fmtCoords(p);
  const a = r.result.address;
  return a.city || a.town || a.village || a.county || r.result.displayName.split(",")[0] || fmtCoords(p);
}

/* ---------------- trip calculator ---------------- */

function TripTool() {
  const m = useRouteMap();
  const [stops, setStops] = useState<(PlaceValue | null)[]>([null, null]);
  const [mpg, setMpg] = useState(35);
  const [price, setPrice] = useState(3.6);
  const [people, setPeople] = useState(1);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ distKm: number; durS: number } | null>(null);
  const valid = stops.filter(Boolean) as PlaceValue[];

  const calc = async () => {
    if (valid.length < 2) { setError("Add a start and a destination."); return; }
    setBusy(true); setError(null);
    const r = await route(valid, "driving");
    setBusy(false);
    if (!r.ok) { setError(r.message); setResult(null); return; }
    setResult({ distKm: r.distanceKm, durS: r.durationS });
    m.draw(r.shape, valid);
  };

  const miles = result ? result.distKm * 0.621371 : 0;
  const gallons = result ? miles / Math.max(1, mpg) : 0;
  const cost = gallons * price;

  return (
    <Layout map={m.el} panel={<>
      <StopsEditor stops={stops} setStops={setStops} />
      <div className="grid grid-cols-3 gap-2">
        <Field label="Fuel economy (mpg)"><input type="number" min={1} className="input" value={mpg} onChange={(e) => setMpg(Math.max(1, Number(e.target.value) || 1))} /></Field>
        <Field label="Fuel price ($/gal)"><input type="number" min={0} step={0.05} className="input" value={price} onChange={(e) => setPrice(Math.max(0, Number(e.target.value) || 0))} /></Field>
        <Field label="People splitting"><input type="number" min={1} className="input" value={people} onChange={(e) => setPeople(Math.max(1, Number(e.target.value) || 1))} /></Field>
      </div>
      <button type="button" className="btn btn-primary w-full" onClick={calc} disabled={busy}>{busy ? <Spinner label="Routing…" /> : "Calculate trip"}</button>
      {error && <ErrorBox>{error}</ErrorBox>}
      {result && (
        <div className="space-y-3 border-t border-line pt-3">
          <div className="grid grid-cols-2 gap-2">
            <Stat label="Road distance" value={fmtDist(result.distKm, "mi")} sub={fmtDist(result.distKm, "km")} />
            <Stat label="Driving time" value={fmtDuration(result.durS)} sub="free-flow, no live traffic" />
            <Stat label="Fuel needed" value={`${fmt(gallons, 1)} gal`} sub={`${fmt(gallons * 3.785, 1)} litres`} />
            <Stat label="Fuel cost" value={`$${fmt(cost, 2)}`} sub={people > 1 ? `$${fmt(cost / people, 2)} per person` : "at your price per gallon"} />
          </div>
          <p className="text-xs text-mute">Distance and time follow real roads (Valhalla/OSRM on OpenStreetMap). Fuel figures use the economy you entered — a loaded car on hills will use more.</p>
        </div>
      )}
    </>} />
  );
}

/* ---------------- loop generator ---------------- */

function LoopTool() {
  const m = useRouteMap({ lat: 39.7, lng: -105 }, 9);
  const [center, setCenter] = useState<PlaceValue | null>(null);
  const [milesTarget, setMilesTarget] = useState(5);
  const [profile, setProfile] = useState<TravelMode>("walking");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ distKm: number; durS: number; gainFt: number | null; note: string } | null>(null);

  const run = async () => {
    if (!center) { setError("Set the loop start first."); return; }
    setBusy(true); setError(null); setResult(null);
    const targetKm = milesTarget * 1.609344;
    const radiusKm = (targetKm / (2 * Math.PI)) * 1.15;
    const ring = [0, 90, 180, 270].map((b) => destination(center, b, radiusKm));
    const loopPts = [center, ...ring, center];
    const r = await route(loopPts, profile);
    let shape: LatLng[], distKm: number, durS: number, note: string;
    if (r.ok) {
      shape = r.shape; distKm = r.distanceKm; durS = r.durationS;
      note = "Routed from your start through four points around it and back. The loop length differs from the target; check access and safety before travelling.";
    } else {
      shape = loopPts;
      distKm = cumulative(shape)[shape.length - 1];
      durS = (distKm / 5) * 3600;
      note = "The routing service did not answer, so a straight-line loop is shown and the time assumes a steady 3.1 mph (5 km/h) walk.";
    }
    const s = await sampleElevations(shape, 30);
    const gainFt = s ? elevGain(s.ele).gain * 3.28084 : null;
    setResult({ distKm, durS, gainFt, note });
    m.draw(shape, [center]);
    setBusy(false);
  };

  return (
    <Layout map={m.el} panel={<>
      <PlaceField label="Loop start / centre" value={center} onChange={setCenter} />
      <Field label={`Target loop length: ${milesTarget} miles`}>
        <input type="range" min={1} max={30} step={0.5} className="w-full" value={milesTarget} onChange={(e) => setMilesTarget(Number(e.target.value))} />
      </Field>
      <Seg ariaLabel="Activity" value={profile} onChange={(v) => setProfile(v)} options={[{ value: "walking", label: "🚶 Run / walk" }, { value: "cycling", label: "🚴 Cycle" }]} />
      <button type="button" className="btn btn-primary w-full" onClick={run} disabled={busy || !center}>{busy ? <Spinner label="Building loop…" /> : "Generate loop"}</button>
      {error && <ErrorBox>{error}</ErrorBox>}
      {result && (
        <div className="space-y-3 border-t border-line pt-3">
          <div className="grid grid-cols-2 gap-2">
            <Stat label="Loop distance" value={fmtDist(result.distKm, "mi")} sub={fmtDist(result.distKm, "km")} />
            <Stat label="Estimated time" value={fmtDuration(result.durS)} />
            {result.gainFt !== null && <Stat label="Elevation gain" value={`${fmt(result.gainFt, 0)} ft`} sub="sampled along the loop" />}
          </div>
          <p className="text-xs text-mute">{result.note}</p>
        </div>
      )}
    </>} />
  );
}

/* ---------------- stage planners ---------------- */

function StageTool({ driving }: { driving: boolean }) {
  const m = useRouteMap();
  const [stops, setStops] = useState<(PlaceValue | null)[]>([null, null]);
  const [splitBy, setSplitBy] = useState<"days" | "distance">("days");
  const [days, setDays] = useState(3);
  const [maxMiles, setMaxMiles] = useState(driving ? 250 : 15);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stages, setStages] = useState<{ n: number; distKm: number; endName: string; gainFt: number | null }[] | null>(null);
  const [total, setTotal] = useState<{ distKm: number; durS: number } | null>(null);
  const valid = stops.filter(Boolean) as PlaceValue[];

  const run = async () => {
    if (valid.length < 2) { setError("Add a start and a destination."); return; }
    setBusy(true); setError(null); setStages(null);
    const r = await route(valid, driving ? "driving" : "walking");
    if (!r.ok) { setBusy(false); setError(r.message); return; }
    const cum = cumulative(r.shape);
    const totalKm = cum[cum.length - 1];
    const count = splitBy === "days" ? Math.max(1, days) : Math.max(1, Math.ceil((totalKm * 0.621371) / Math.max(1, maxMiles)));
    if (count > 100) { setBusy(false); setError("This route needs more than 100 stages. Increase the maximum distance per day."); return; }
    const bounds: number[] = [];
    for (let i = 1; i <= count; i++) bounds.push((totalKm * i) / count);
    const s = await sampleElevations(r.shape, Math.min(60, Math.max(12, count * 8)));
    const rows: { n: number; distKm: number; endName: string; gainFt: number | null }[] = [];
    let prev = 0;
    for (let i = 0; i < count; i++) {
      const endP = pointAt(r.shape, cum, bounds[i]);
      rows.push({ n: i + 1, distKm: bounds[i] - prev, endName: i === count - 1 ? (valid[valid.length - 1].label ?? "Destination") : await placeName(endP), gainFt: null });
      prev = bounds[i];
    }
    if (s) {
      // attribute elevation gain per stage by nearest sampled index
      const cumS = cumulative(s.pts);
      for (const row of rows) {
        const upto = bounds[row.n - 1];
        const segEle = s.ele.filter((_, i) => cumS[i] <= upto && (row.n === 1 || cumS[i] > bounds[row.n - 2]));
        if (segEle.length > 1) row.gainFt = elevGain(segEle).gain * 3.28084;
      }
    }
    setStages(rows);
    setTotal({ distKm: r.distanceKm, durS: r.durationS });
    m.draw(r.shape, valid);
    setBusy(false);
  };

  return (
    <Layout map={m.el} panel={<>
      <StopsEditor stops={stops} setStops={setStops} />
      <Seg ariaLabel="Split by" value={splitBy} onChange={(v) => setSplitBy(v)} options={[{ value: "days", label: "Number of days" }, { value: "distance", label: "Max per day" }]} />
      {splitBy === "days"
        ? <Field label="Days"><input type="number" min={1} max={30} className="input" value={days} onChange={(e) => setDays(Math.min(30, Math.max(1, Math.floor(Number(e.target.value) || 1))))} /></Field>
        : <Field label={driving ? "Max driving miles per day" : "Max miles per day"}><input type="number" min={1} className="input" value={maxMiles} onChange={(e) => setMaxMiles(Math.max(1, Number(e.target.value) || 1))} /></Field>}
      <button type="button" className="btn btn-primary w-full" onClick={run} disabled={busy}>{busy ? <Spinner label="Planning stages…" /> : "Plan stages"}</button>
      {error && <ErrorBox>{error}</ErrorBox>}
      {total && <p className="text-sm text-mute">Whole route: <strong className="text-ink">{fmtDist(total.distKm, "mi")}</strong> · {fmtDuration(total.durS)} {driving ? "driving" : "walking"} (free-flow).</p>}
      {stages && (
        <div className="overflow-hidden rounded-xl border border-line">
          <table className="tbl"><thead><tr><th>Day</th><th className="text-right">Distance</th><th>{driving ? "Night stop near" : "Stage ends near"}</th><th className="text-right">Climb</th></tr></thead>
            <tbody>{stages.map((s) => <tr key={s.n}><td className="font-semibold">{s.n}</td><td className="text-right">{fmtDist(s.distKm, "mi")}</td><td>{s.endName}</td><td className="text-right">{s.gainFt !== null ? `${fmt(s.gainFt, 0)} ft` : "—"}</td></tr>)}</tbody>
          </table>
        </div>
      )}
      <p className="text-xs text-mute">Stages are split by distance along the routed path. Night-stop names are the nearest recorded place to each stage end — check real lodging or campsites before you rely on them.</p>
    </>} />
  );
}

/* ---------------- equidistance line ---------------- */

function EquidistanceTool() {
  const m = useRouteMap();
  const [a, setA] = useState<PlaceValue | null>(null);
  const [b, setB] = useState<PlaceValue | null>(null);
  const [result, setResult] = useState<{ mid: LatLng; distKm: number; bearing: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const run = () => {
    if (!a || !b) return;
    const arc = equidistanceArc(a, b);
    if (!arc) { m.draw([], []); setResult(null); setError("Choose distinct, non-antipodal points; these do not define a unique midpoint and bisector."); return; }
    setError(null);
    setResult({ mid: arc.mid, distKm: arc.distance, bearing: bearingBetween(a, b) });
    m.draw(arc.line, [a, b, arc.mid]);
  };

  return (
    <Layout map={m.el} panel={<>
      <PlaceField label="Place A" value={a} onChange={setA} />
      <PlaceField label="Place B" value={b} onChange={setB} />
      <button type="button" className="btn btn-primary w-full" onClick={run} disabled={!a || !b}>Draw the equidistance line</button>
      {error && <ErrorBox>{error}</ErrorBox>}
      {result && (
        <div className="space-y-3 border-t border-line pt-3">
          <div className="grid grid-cols-2 gap-2">
            <Stat label="Distance A ↔ B" value={fmtDist(result.distKm, "mi")} sub={fmtDist(result.distKm, "km")} />
            <Stat label="Midpoint" value={fmtCoords(result.mid)} sub={`bearing A→B ${fmt(result.bearing, 1)}°`} />
          </div>
          <p className="text-xs leading-relaxed text-mute">The sampled line approximates a section of the spherical equidistance locus, not the whole locus. Distances are surface great-circle distances, not road distances or travel times. Map rendering interpolates between samples.</p>
        </div>
      )}
    </>} />
  );
}

/* ---------------- postal-code meeting points ---------------- */

async function geocodePostal(code: string, canada: boolean): Promise<LatLng | null> {
  const c = code.trim().toUpperCase();
  try {
    if (!canada && /^[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}$/.test(c)) {
      const r = await ukPostcode(c);
      return { lat: r.lat, lng: r.lng };
    }
    if (!canada && /^\d{5}$/.test(c)) {
      const res = await fetch(`https://api.zippopotam.us/us/${c}`);
      if (res.ok) {
        const d = await res.json();
        const pl = d.places?.[0];
        if (pl) return { lat: Number(pl.latitude), lng: Number(pl.longitude) };
      }
    }
    const r = await photonSearch(`${c}${canada ? ", Canada" : ""}`, 1);
    if (r.ok && r.results.length) return { lat: r.results[0].lat, lng: r.results[0].lng };
  } catch { /* fall through */ }
  return null;
}

function sphericalCentroid(pts: LatLng[]): LatLng | null {
  let x = 0, y = 0, z = 0;
  for (const p of pts) {
    const φ = (p.lat * Math.PI) / 180, λ = (p.lng * Math.PI) / 180;
    x += Math.cos(φ) * Math.cos(λ); y += Math.cos(φ) * Math.sin(λ); z += Math.sin(φ);
  }
  if (Math.hypot(x, y, z) < 1e-12 * pts.length) return null;
  const λ = Math.atan2(y, x);
  const φ = Math.atan2(z, Math.sqrt(x * x + y * y));
  return { lat: (φ * 180) / Math.PI, lng: (λ * 180) / Math.PI };
}

function PostalCentroidTool({ canada }: { canada: boolean }) {
  const m = useRouteMap();
  const [text, setText] = useState(canada ? "K1A 0B1\nM5V 1J1\nH2Y 1C6" : "10001\n90210\n60601");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ centre: LatLng; name: string; rows: { code: string; distKm: number }[] } | null>(null);

  const run = async () => {
    const codes = text.split(/[\n,;]+/).map((s) => s.trim()).filter(Boolean);
    if (codes.length > 25) { setError("Enter no more than 25 codes at a time."); return; }
    if (codes.length < 2) { setError("Enter at least two postal codes, one per line."); return; }
    setBusy(true); setError(null); setResult(null);
    const found: { code: string; p: LatLng }[] = [];
    const missed: string[] = [];
    for (const code of codes) {
      const p = await geocodePostal(code, canada);
      if (p) found.push({ code, p }); else missed.push(code);
    }
    if (found.length < 2) { setBusy(false); setError("Fewer than two of those codes could be found. Check the codes and try again."); return; }
    const centre = sphericalCentroid(found.map((f) => f.p));
    if (!centre) { setBusy(false); setError("The resolved locations do not have a unique spherical vector mean. Try a different set of locations."); return; }
    const name = await placeName(centre);
    setResult({ centre, name, rows: found.map((f) => ({ code: f.code, distKm: distanceKm(centre, f.p) })) });
    m.draw([], [...found.map((f) => f.p), centre]);
    if (missed.length) setError(`Not found and skipped: ${missed.join(", ")}`);
    setBusy(false);
  };

  return (
    <Layout map={m.el} panel={<>
      <Field label={canada ? "Canadian postal codes, one per line" : "Postal codes, one per line (US ZIP, UK and others)"}>
        <textarea className="textarea min-h-28 font-mono text-sm" value={text} onChange={(e) => setText(e.target.value)} />
      </Field>
      <button type="button" className="btn btn-primary w-full" onClick={run} disabled={busy}>{busy ? <Spinner label="Geocoding codes…" /> : "Find the meeting centre"}</button>
      {error && <ErrorBox>{error}</ErrorBox>}
      {result && (
        <div className="space-y-3 border-t border-line pt-3">
          <Stat label="Centre of gravity" value={fmtCoords(result.centre)} sub={`reverse-geocoded area: ${result.name}`} />
          <table className="tbl"><thead><tr><th>Code</th><th className="text-right">Distance to centre</th></tr></thead>
            <tbody>{result.rows.map((r, i) => <tr key={`${r.code}-${i}`}><td className="font-mono text-xs">{r.code}</td><td className="text-right">{fmtDist(r.distKm, "mi")}</td></tr>)}</tbody>
          </table>
          <p className="text-xs text-mute">The centre is the spherical vector mean of resolved locations, with one equal weight per entered code. It does not necessarily minimise average distance or travel time. Postal codes are sent to geocoding providers; check results before use.</p>
        </div>
      )}
    </>} />
  );
}

/* ---------------- surface + terrain ---------------- */

function SurfaceTool() {
  const m = useRouteMap();
  const [stops, setStops] = useState<(PlaceValue | null)[]>([null, null]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ distKm: number; surfaces: [string, number][]; roads: [string, number][]; gainFt: number | null; maxEleFt: number | null } | null>(null);
  const valid = stops.filter(Boolean) as PlaceValue[];

  const run = async () => {
    if (valid.length < 2) { setError("Add a start and a destination."); return; }
    setBusy(true); setError(null); setResult(null);
    const r = await route(valid, "driving");
    if (!r.ok) { setBusy(false); setError(r.message); return; }
    m.draw(r.shape, valid);
    try {
      const samples = resample(r.shape, 20);
      const clauses = samples.map((p) => `way["highway"](around:30,${p.lat.toFixed(5)},${p.lng.toFixed(5)});`).join("");
      const res = await fetch("https://overpass-api.de/api/interpreter", { method: "POST", body: new URLSearchParams({ data: `[out:json][timeout:60];(${clauses});out tags 400;` }) });
      if (!res.ok) throw new Error();
      const data = await res.json();
      const surf = new Map<string, number>();
      const roads = new Map<string, number>();
      for (const e of data.elements ?? []) {
        const t = e.tags ?? {};
        const s = t.surface ?? "not recorded";
        surf.set(s, (surf.get(s) ?? 0) + 1);
        const h = t.highway ?? "unknown";
        roads.set(h, (roads.get(h) ?? 0) + 1);
      }
      const top = (map: Map<string, number>): [string, number][] => [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6);
      const s2 = await sampleElevations(r.shape, 30);
      setResult({
        distKm: r.distanceKm,
        surfaces: top(surf), roads: top(roads),
        gainFt: s2 ? elevGain(s2.ele).gain * 3.28084 : null,
        maxEleFt: s2 ? Math.max(...s2.ele) * 3.28084 : null,
      });
    } catch {
      setError("The surface data service (Overpass) did not answer. The route is drawn; try again in a moment for the surface breakdown.");
    }
    setBusy(false);
  };

  return (
    <Layout map={m.el} panel={<>
      <StopsEditor stops={stops} setStops={setStops} />
      <button type="button" className="btn btn-primary w-full" onClick={run} disabled={busy}>{busy ? <Spinner label="Analysing route…" /> : "Analyse surface & terrain"}</button>
      {error && <ErrorBox>{error}</ErrorBox>}
      {result && (
        <div className="space-y-3 border-t border-line pt-3">
          <div className="grid grid-cols-2 gap-2">
            <Stat label="Route distance" value={fmtDist(result.distKm, "mi")} />
            {result.gainFt !== null && <Stat label="Elevation gain" value={`${fmt(result.gainFt, 0)} ft`} sub={result.maxEleFt !== null ? `highest point ${fmt(result.maxEleFt, 0)} ft` : undefined} />}
          </div>
          <div>
            <div className="label">Surface tags on nearby OSM ways</div>
            <table className="tbl"><tbody>{result.surfaces.map(([k, v]) => <tr key={k}><td className="capitalize">{k}</td><td className="text-right">{v}</td></tr>)}</tbody></table>
          </div>
          <div>
            <div className="label">Road types nearby</div>
            <table className="tbl"><tbody>{result.roads.map(([k, v]) => <tr key={k}><td className="capitalize">{k.replace(/_/g, " ")}</td><td className="text-right">{v}</td></tr>)}</tbody></table>
          </div>
          <p className="text-xs leading-relaxed text-mute">Counts are OpenStreetMap ways within about 100 ft (30 m) of up to 20 sampled points, limited to 400 returned ways. They can include nearby roads not on your route and are not distances or percentages. Missing surface tags are “not recorded”; verify conditions locally.</p>
        </div>
      )}
    </>} />
  );
}

/* ---------------- elevation gain + hiking planner ---------------- */

function GainTool({ hiking }: { hiking: boolean }) {
  const m = useRouteMap();
  const [stops, setStops] = useState<(PlaceValue | null)[]>([null, null]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ distKm: number; durS: number; gainFt: number; lossFt: number; minFt: number; maxFt: number; naismithH: number } | null>(null);
  const valid = stops.filter(Boolean) as PlaceValue[];

  const run = async () => {
    if (valid.length < 2) { setError("Add a start and a destination."); return; }
    setBusy(true); setError(null); setResult(null);
    const r = await route(valid, "walking");
    if (!r.ok) { setBusy(false); setError(r.message); return; }
    m.draw(r.shape, valid);
    const s = await sampleElevations(r.shape, 40);
    if (!s) { setBusy(false); setError("The elevation service did not answer, so gain cannot be calculated honestly. The route is drawn — try again in a moment."); return; }
    const { gain, loss } = elevGain(s.ele);
    const naismithH = r.distanceKm / 5 + gain / 600;
    setResult({
      distKm: r.distanceKm, durS: r.durationS,
      gainFt: gain * 3.28084, lossFt: loss * 3.28084,
      minFt: Math.min(...s.ele) * 3.28084, maxFt: Math.max(...s.ele) * 3.28084,
      naismithH,
    });
    setBusy(false);
  };

  return (
    <Layout map={m.el} panel={<>
      <StopsEditor stops={stops} setStops={setStops} />
      <button type="button" className="btn btn-primary w-full" onClick={run} disabled={busy}>{busy ? <Spinner label="Routing + sampling elevation…" /> : hiking ? "Plan the hike" : "Calculate elevation gain"}</button>
      {error && <ErrorBox>{error}</ErrorBox>}
      {result && (
        <div className="space-y-3 border-t border-line pt-3">
          <div className="grid grid-cols-2 gap-2">
            <Stat label="Route distance" value={fmtDist(result.distKm, "mi")} sub={fmtDist(result.distKm, "km")} />
            <Stat label="Walking time (router)" value={fmtDuration(result.durS)} />
            <Stat label="Elevation gain" value={`${fmt(result.gainFt, 0)} ft`} sub={`loss ${fmt(result.lossFt, 0)} ft`} />
            <Stat label="Elevation range" value={`${fmt(result.minFt, 0)}–${fmt(result.maxFt, 0)} ft`} />
          </div>
          {hiking && <Stat label="Naismith estimate" value={`${fmt(result.naismithH, 1)} h`} sub="1 h per 3.1 mi (5 km) + 1 h per 2,000 ft (600 m) climbed — a classic hill-walking rule, before breaks" />}
          <p className="text-xs text-mute">Elevations are sampled at 40 points along the routed path from Open-Meteo terrain data. Short sharp climbs between samples can be smoothed out, so treat gain as a planning figure, not a survey.</p>
        </div>
      )}
    </>} />
  );
}

/* ---------------- roadbooks ---------------- */

function RoadbookTool({ multiDay }: { multiDay: boolean }) {
  const m = useRouteMap();
  const [stops, setStops] = useState<(PlaceValue | null)[]>([null, null]);
  const [days, setDays] = useState(3);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [book, setBook] = useState<{ legs: { from: string; to: string; distKm: number; durS: number }[]; totalKm: number; totalS: number; dayRows: { n: number; distKm: number; endName: string }[] } | null>(null);
  const valid = stops.filter(Boolean) as PlaceValue[];

  const run = async () => {
    if (valid.length < 2) { setError("Add at least a start and a destination."); return; }
    setBusy(true); setError(null); setBook(null);
    const r = await route(valid, multiDay ? "walking" : "driving");
    if (!r.ok) { setBusy(false); setError(r.message); return; }
    m.draw(r.shape, valid);
    const legs = r.legs.map((l, i) => ({
      from: valid[i]?.label ?? `Stop ${i + 1}`,
      to: valid[i + 1]?.label ?? `Stop ${i + 2}`,
      distKm: l.distanceKm, durS: l.durationS,
    }));
    const dayRows: { n: number; distKm: number; endName: string }[] = [];
    if (multiDay) {
      const cum = cumulative(r.shape);
      const totalKm = cum[cum.length - 1];
      let prev = 0;
      for (let i = 1; i <= days; i++) {
        const bound = (totalKm * i) / days;
        dayRows.push({ n: i, distKm: bound - prev, endName: i === days ? (valid[valid.length - 1].label ?? "Finish") : await placeName(pointAt(r.shape, cum, bound)) });
        prev = bound;
      }
    }
    setBook({ legs, totalKm: r.distanceKm, totalS: r.durationS, dayRows });
    setBusy(false);
  };

  return (
    <Layout map={m.el} panel={<>
      <StopsEditor stops={stops} setStops={setStops} />
      {multiDay && <Field label="Days"><input type="number" min={1} max={30} className="input" value={days} onChange={(e) => setDays(Math.min(30, Math.max(1, Math.floor(Number(e.target.value) || 1))))} /></Field>}
      <button type="button" className="btn btn-primary w-full" onClick={run} disabled={busy}>{busy ? <Spinner label="Building roadbook…" /> : "Build the roadbook"}</button>
      {error && <ErrorBox>{error}</ErrorBox>}
      {book && (
        <div className="space-y-3 border-t border-line pt-3">
          <div className="grid grid-cols-2 gap-2">
            <Stat label="Total distance" value={fmtDist(book.totalKm, "mi")} sub={fmtDist(book.totalKm, "km")} />
            <Stat label="Total time" value={fmtDuration(book.totalS)} sub={multiDay ? "walking, free-flow" : "driving, free-flow"} />
          </div>
          <table className="tbl"><thead><tr><th>Leg</th><th className="text-right">Distance</th><th className="text-right">Time</th></tr></thead>
            <tbody>{book.legs.map((l, i) => <tr key={i}><td>{l.from.split(",")[0]} → {l.to.split(",")[0]}</td><td className="text-right">{fmtDist(l.distKm, "mi")}</td><td className="text-right">{fmtDuration(l.durS)}</td></tr>)}</tbody>
          </table>
          {book.dayRows.length > 0 && (
            <table className="tbl"><thead><tr><th>Day</th><th className="text-right">Distance</th><th>Ends near</th></tr></thead>
              <tbody>{book.dayRows.map((d) => <tr key={d.n}><td className="font-semibold">{d.n}</td><td className="text-right">{fmtDist(d.distKm, "mi")}</td><td>{d.endName}</td></tr>)}</tbody>
            </table>
          )}
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => window.print()}>🖨 Print / save as PDF</button>
          <p className="text-xs text-mute">Print this page to save the roadbook as a PDF. Times are free-flow estimates — weather, breaks and terrain will change your day.</p>
        </div>
      )}
    </>} />
  );
}

/* ---------------- flyover ---------------- */

function FlyoverTool() {
  const m = useRouteMap();
  const [stops, setStops] = useState<(PlaceValue | null)[]>([null, null]);
  const [busy, setBusy] = useState(false);
  const [flying, setFlying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const stopRef = useRef(false);
  const valid = stops.filter(Boolean) as PlaceValue[];

  const run = async () => {
    if (valid.length < 2) { setError("Add a start and a destination."); return; }
    setBusy(true); setError(null);
    const r = await route(valid, "driving");
    setBusy(false);
    if (!r.ok) { setError(r.message); return; }
    m.draw(r.shape, valid);
    const map = m.mapRef.current;
    if (!map) return;
    const pts = resample(r.shape, 40);
    stopRef.current = false;
    setFlying(true);
    let i = 0;
    const step = () => {
      if (stopRef.current || i >= pts.length) { setFlying(false); map.easeTo({ pitch: 0, bearing: 0, duration: 800 }); return; }
      const p = pts[i];
      const next = pts[Math.min(i + 1, pts.length - 1)];
      map.easeTo({ center: [p.lng, p.lat], zoom: 14, pitch: 60, bearing: bearingBetween(p, next), duration: 1100 });
      i += 1;
      setTimeout(step, 1150);
    };
    setTimeout(step, 600);
  };

  return (
    <Layout map={m.el} panel={<>
      <StopsEditor stops={stops} setStops={setStops} />
      <div className="flex gap-2">
        <button type="button" className="btn btn-primary flex-1" onClick={run} disabled={busy || flying}>{busy ? <Spinner label="Routing…" /> : flying ? "Flying…" : "▶ Start flyover"}</button>
        {flying && <button type="button" className="btn btn-ghost" onClick={() => { stopRef.current = true; }}>Stop</button>}
      </div>
      {error && <ErrorBox>{error}</ErrorBox>}
      <p className="text-xs leading-relaxed text-mute">The camera follows the routed path on a tilted (60°) map, turning with the road. It is a visualisation of the route, not a video render — buildings and terrain detail depend on the base map.</p>
    </>} />
  );
}

/* ---------------- GPX performance comparison ---------------- */

interface GpxStats { name: string; distKm: number; durS: number | null; gainM: number; avgHr: number | null; points: number }

function parseGpx(text: string, name: string): GpxStats | null {
  try {
    const doc = new DOMParser().parseFromString(text, "application/xml");
    if (doc.querySelector("parsererror")) return null;
    const trkpts = [...doc.getElementsByTagName("trkpt")];
    if (!trkpts.length) return null;
    let distKm = 0, gain = 0, prev: LatLng | null = null, prevEle: number | null = null;
    let firstT: number | null = null, lastT: number | null = null, hrSum = 0, hrN = 0;
    for (const pt of trkpts) {
      const p = { lat: Number(pt.getAttribute("lat")), lng: Number(pt.getAttribute("lon")) };
      if (!Number.isFinite(p.lat) || !Number.isFinite(p.lng)) continue;
      if (prev) distKm += distanceKm(prev, p);
      prev = p;
      const eleEl = pt.getElementsByTagName("ele")[0];
      const ele = eleEl ? Number(eleEl.textContent) : NaN;
      if (Number.isFinite(ele)) {
        if (prevEle !== null && ele > prevEle) gain += ele - prevEle;
        prevEle = ele;
      }
      const tEl = pt.getElementsByTagName("time")[0];
      if (tEl?.textContent) {
        const t = Date.parse(tEl.textContent);
        if (Number.isFinite(t)) { if (firstT === null) firstT = t; lastT = t; }
      }
      const all = pt.getElementsByTagName("*");
      for (let i = 0; i < all.length; i++) {
        if (all[i].localName === "hr") { const v = Number(all[i].textContent); if (Number.isFinite(v) && v > 0) { hrSum += v; hrN += 1; } }
      }
    }
    return {
      name, distKm, gainM: gain, points: trkpts.length,
      durS: firstT !== null && lastT !== null && lastT > firstT ? (lastT - firstT) / 1000 : null,
      avgHr: hrN ? hrSum / hrN : null,
    };
  } catch { return null; }
}

function PerformanceTool() {
  const [a, setA] = useState<GpxStats | null>(null);
  const [b, setB] = useState<GpxStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = (which: "a" | "b") => async (f: File) => {
    const s = parseGpx(await f.text(), f.name);
    if (!s) { setError(`“${f.name}” could not be read as a GPX track.`); return; }
    setError(null);
    if (which === "a") setA(s); else setB(s);
  };

  const pace = (s: GpxStats) => (s.durS && s.distKm > 0 ? s.durS / (s.distKm * 0.621371) : null);
  const fmtPace = (secPerMi: number | null) => {
    if (secPerMi === null || !Number.isFinite(secPerMi)) return "—";
    const mm = Math.floor(secPerMi / 60), ss = Math.round(secPerMi % 60);
    return `${mm}:${String(ss).padStart(2, "0")} /mi`;
  };

  const rows: [string, string, string][] = a && b ? [
    ["Distance", fmtDist(a.distKm, "mi"), fmtDist(b.distKm, "mi")],
    ["Moving record time", a.durS ? fmtDuration(a.durS) : "—", b.durS ? fmtDuration(b.durS) : "—"],
    ["Average pace", fmtPace(pace(a)), fmtPace(pace(b))],
    ["Elevation gain", `${fmt(a.gainM * 3.28084, 0)} ft`, `${fmt(b.gainM * 3.28084, 0)} ft`],
    ["Average heart rate", a.avgHr ? `${fmt(a.avgHr, 0)} bpm` : "not in file", b.avgHr ? `${fmt(b.avgHr, 0)} bpm` : "not in file"],
    ["Track points", String(a.points), String(b.points)],
  ] : [];

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="card space-y-3 p-4">
          <div className="label">Performance A (earlier)</div>
          <FileDropzone accept=".gpx" onFile={load("a")}><span className="text-sm">Drop a GPX file or click to choose</span></FileDropzone>
          {a && <p className="text-sm font-medium">{a.name}</p>}
        </div>
        <div className="card space-y-3 p-4">
          <div className="label">Performance B (later)</div>
          <FileDropzone accept=".gpx" onFile={load("b")}><span className="text-sm">Drop a GPX file or click to choose</span></FileDropzone>
          {b && <p className="text-sm font-medium">{b.name}</p>}
        </div>
      </div>
      {error && <ErrorBox>{error}</ErrorBox>}
      {a && b && (
        <div className="card p-4">
          <table className="tbl"><thead><tr><th>Measure</th><th>A — {a.name}</th><th>B — {b.name}</th></tr></thead>
            <tbody>{rows.map(([k, va, vb]) => <tr key={k}><td className="text-mute">{k}</td><td className="font-medium">{va}</td><td className="font-medium">{vb}</td></tr>)}</tbody>
          </table>
          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => downloadText("mapbench-performance-comparison.csv", `measure,a,b\n${rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n")}`, "text/csv")}>Download comparison CSV</button>
          </div>
          <p className="mt-3 text-xs text-mute">Both files are read locally in your browser — nothing is uploaded or stored, so “history” here means the files you keep. Pace uses the recorded track time; pauses recorded in the file count as time.</p>
        </div>
      )}
      {(!a || !b) && <p className="text-sm text-mute">Load two recordings of the same route — for example last month and today — to compare distance, pace, climb and heart rate side by side.</p>}
    </div>
  );
}
