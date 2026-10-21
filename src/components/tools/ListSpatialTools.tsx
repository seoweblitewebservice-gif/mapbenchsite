"use client";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { Map as MLMap, GeoJSONSource } from "maplibre-gl";
import { destination, distanceKm, fmt, fmtCoords, fmtDist, type LatLng } from "@/lib/geo";
import { photonSearch } from "@/lib/geocode";
import { downloadText, toCsv } from "@/lib/formats";
import { CopyBtn, ErrorBox, Field, Seg, Spinner, Stat } from "@/components/ui";
import { DynamicMap, pinElement, PlaceField, type PlaceValue } from "./shared";

/**
 * Spatial-analysis pages added for the user's list: Voronoi diagram
 * generator, buffer & overlay analysis, location suitability scoring, an
 * area dashboard, a data-collection form builder and a live GeoJSON/CSV
 * connector. Everything runs client-side on open data (OpenStreetMap via
 * Overpass, Open-Meteo elevation); the form builder keeps submissions in
 * the browser's local storage only, and says so.
 */

type Mode = "voronoi" | "buffer" | "suitability" | "dashboard" | "form-builder" | "live-connector";

const PALETTE = ["#1d6e63", "#d95d32", "#2b6cb0", "#8a4f9e", "#b7791f", "#2f855a", "#b83280", "#4a5568"];

function useFeatMap(onClick?: (p: LatLng) => void) {
  const mapRef = useRef<MLMap | null>(null);
  const libRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const show = (fc: any, marks: { p: LatLng; color?: string; label?: string }[] = [], fitPts?: LatLng[]) => {
    const map = mapRef.current, lib = libRef.current;
    if (!map || !lib) return;
    (map.getSource("feat") as GeoJSONSource | undefined)?.setData(fc ?? { type: "FeatureCollection", features: [] });
    markersRef.current.forEach((mk) => mk.remove());
    markersRef.current = marks.map((mk) => new lib.Marker({ element: pinElement(mk.color ?? "#1d6e63", mk.label) }).setLngLat([mk.p.lng, mk.p.lat]).addTo(map));
    const pts = fitPts ?? marks.map((x) => x.p);
    if (pts.length > 1) {
      const lngs = pts.map((p) => p.lng), lats = pts.map((p) => p.lat);
      map.fitBounds([[Math.min(...lngs), Math.min(...lats)], [Math.max(...lngs), Math.max(...lats)]], { padding: 50, maxZoom: 13, duration: 500 });
    } else if (pts.length === 1) map.flyTo({ center: [pts[0].lng, pts[0].lat], zoom: 11, essential: true });
  };
  const el = (
    <DynamicMap center={{ lat: 30, lng: 10 }} zoom={1.8} className="tall" onReady={(map, lib) => {
      mapRef.current = map; libRef.current = lib;
      map.addSource("feat", { type: "geojson", data: { type: "FeatureCollection", features: [] } });
      map.addLayer({ id: "feat-fill", type: "fill", source: "feat", filter: ["==", ["geometry-type"], "Polygon"], paint: { "fill-color": ["get", "color"], "fill-opacity": 0.35 } });
      map.addLayer({ id: "feat-line", type: "line", source: "feat", paint: { "line-color": ["coalesce", ["get", "color"], "#1d6e63"], "line-width": 2 } });
      map.addLayer({ id: "feat-pt", type: "circle", source: "feat", filter: ["==", ["geometry-type"], "Point"], paint: { "circle-radius": 5, "circle-color": "#d95d32", "circle-stroke-color": "#fff", "circle-stroke-width": 1.5 } });
      if (onClick) map.on("click", (e: any) => onClick({ lat: e.lngLat.lat, lng: e.lngLat.lng }));
    }} />
  );
  return { el, show };
}

function Layout({ panel, map }: { panel: ReactNode; map: ReactNode }) {
  return (
    <div className="grid gap-4 lg:grid-cols-[400px,1fr]">
      <div className="card order-2 space-y-4 p-4 lg:order-1">{panel}</div>
      <div className="order-1 lg:order-2">{map}</div>
    </div>
  );
}

async function overpass(ql: string): Promise<any> {
  const res = await fetch("https://overpass-api.de/api/interpreter", { method: "POST", body: new URLSearchParams({ data: ql }) });
  if (res.status === 429) throw new Error("The OpenStreetMap query service is rate-limiting right now. Wait a few seconds and try again.");
  if (!res.ok) throw new Error("The OpenStreetMap query service did not answer. Try again in a moment.");
  return res.json();
}

function circlePolygon(c: LatLng, radiusKm: number, stepsNum = 72): LatLng[] {
  const pts: LatLng[] = [];
  for (let i = 0; i < stepsNum; i++) pts.push(destination(c, (i * 360) / stepsNum, radiusKm));
  return pts;
}

export default function ListSpatialTools({ params }: { params?: Record<string, unknown> }) {
  const mode = ((params?.mode as string) ?? "voronoi") as Mode;
  switch (mode) {
    case "buffer": return <BufferTool />;
    case "suitability": return <SuitabilityTool />;
    case "dashboard": return <DashboardTool />;
    case "form-builder": return <FormBuilderTool />;
    case "live-connector": return <ConnectorTool />;
    default: return <VoronoiTool />;
  }
}

/* ---------------- Voronoi ---------------- */

type Pt = { x: number; y: number };
function clipBisector(poly: Pt[], keep: Pt, other: Pt): Pt[] {
  // Keep the half-plane of points closer to `keep` than to `other`.
  const mx = (keep.x + other.x) / 2, my = (keep.y + other.y) / 2;
  const dx = other.x - keep.x, dy = other.y - keep.y;
  const inside = (p: Pt) => (p.x - mx) * dx + (p.y - my) * dy <= 1e-12;
  const out: Pt[] = [];
  for (let i = 0; i < poly.length; i++) {
    const cur = poly[i], prev = poly[(i + poly.length - 1) % poly.length];
    const curIn = inside(cur), prevIn = inside(prev);
    if (curIn !== prevIn) {
      const t = ((mx - prev.x) * dx + (my - prev.y) * dy) / ((cur.x - prev.x) * dx + (cur.y - prev.y) * dy || 1e-15);
      out.push({ x: prev.x + (cur.x - prev.x) * t, y: prev.y + (cur.y - prev.y) * t });
    }
    if (curIn) out.push(cur);
  }
  return out;
}

function VoronoiTool() {
  const [seeds, setSeeds] = useState<LatLng[]>([]);
  const m = useFeatMap((p) => setSeeds((prev) => (prev.length >= 30 ? prev : [...prev, p])));

  const fc = useMemo(() => {
    if (seeds.length < 2) return null;
    const pad = 0.35;
    const minx = Math.min(...seeds.map((s) => s.lng)) - pad, maxx = Math.max(...seeds.map((s) => s.lng)) + pad;
    const miny = Math.min(...seeds.map((s) => s.lat)) - pad, maxy = Math.max(...seeds.map((s) => s.lat)) + pad;
    const features: any[] = [];
    seeds.forEach((s, i) => {
      let poly: Pt[] = [{ x: minx, y: miny }, { x: maxx, y: miny }, { x: maxx, y: maxy }, { x: minx, y: maxy }];
      seeds.forEach((o, j) => { if (i !== j) poly = clipBisector(poly, { x: s.lng, y: s.lat }, { x: o.lng, y: o.lat }); });
      if (poly.length >= 3) {
        features.push({ type: "Feature", properties: { color: PALETTE[i % PALETTE.length], site: i + 1 }, geometry: { type: "Polygon", coordinates: [[...poly.map((p) => [p.x, p.y]), [poly[0].x, poly[0].y]]] } });
      }
    });
    return { type: "FeatureCollection", features };
  }, [seeds]);

  useEffect(() => {
    if (!fc) { m.show(null, seeds.map((p) => ({ p }))); return; }
    m.show(fc, seeds.map((p, i) => ({ p, color: PALETTE[i % PALETTE.length], label: String(i + 1) })), seeds);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fc, seeds]);

  return (
    <Layout map={m.el} panel={<>
      <p className="text-sm leading-relaxed text-mute">Click the map to drop seed points (up to 30). Each coloured cell is the area closer to its seed than to any other — the classic way to draw delivery zones, service territories and nearest-facility catchments.</p>
      <div className="flex items-center gap-2">
        <span className="chip chip-brand">{seeds.length} seeds</span>
        <button type="button" className="btn btn-ghost btn-sm" onClick={() => setSeeds([])}>Clear</button>
        {seeds.length > 0 && <button type="button" className="btn btn-ghost btn-sm" onClick={() => setSeeds(seeds.slice(0, -1))}>Undo last</button>}
      </div>
      {fc && <button type="button" className="btn btn-primary btn-sm" onClick={() => downloadText("mapbench-voronoi.geojson", JSON.stringify(fc, null, 1), "application/geo+json")}>Download cells as GeoJSON</button>}
      <p className="text-xs leading-relaxed text-mute">Cells are computed in flat map coordinates, which is accurate for local areas (a city or county). For continent-scale seed sets, use a projected GIS workflow — straight lines on a world map are not true nearest-point boundaries.</p>
    </>} />
  );
}

/* ---------------- buffer & overlay ---------------- */

function BufferTool() {
  const [center, setCenter] = useState<PlaceValue | null>(null);
  const m = useFeatMap();
  const [radiusMi, setRadiusMi] = useState(5);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ towns: number; schools: number; hospitals: number; areaSqMi: number } | null>(null);

  const run = async () => {
    if (!center) { setError("Set the centre point first."); return; }
    setBusy(true); setError(null); setResult(null);
    const radiusKm = radiusMi * 1.609344;
    const ring = circlePolygon(center, radiusKm);
    const fc = { type: "Feature", properties: { color: "#1d6e63" }, geometry: { type: "Polygon", coordinates: [[...ring.map((p) => [p.lng, p.lat]), [ring[0].lng, ring[0].lat]]] } };
    m.show(fc, [{ p: center }], [center, ...ring.filter((_, i) => i % 18 === 0)]);
    try {
      const r = Math.round(radiusKm * 1000);
      const base = `around:${r},${center.lat},${center.lng}`;
      const data = await overpass(`[out:json][timeout:60];(node["place"~"city|town|village"](${base});node["amenity"="school"](${base});node["amenity"="hospital"](${base}););out 2000;`);
      let towns = 0, schools = 0, hospitals = 0;
      for (const e of data.elements ?? []) {
        if (e.tags?.place) towns++;
        else if (e.tags?.amenity === "school") schools++;
        else if (e.tags?.amenity === "hospital") hospitals++;
      }
      setResult({ towns, schools, hospitals, areaSqMi: Math.PI * radiusMi * radiusMi });
    } catch (e: any) { setError(e?.message ?? "Overlay count failed — the buffer is drawn."); }
    setBusy(false);
  };

  return (
    <Layout map={m.el} panel={<>
      <PlaceField label="Buffer centre" value={center} onChange={setCenter} />
      <Field label={`Buffer radius: ${radiusMi} miles`}>
        <input type="range" min={1} max={50} className="w-full" value={radiusMi} onChange={(e) => setRadiusMi(Number(e.target.value))} />
      </Field>
      <button type="button" className="btn btn-primary w-full" onClick={run} disabled={busy || !center}>{busy ? <Spinner label="Counting what is inside…" /> : "Draw buffer & count what's inside"}</button>
      {error && <ErrorBox>{error}</ErrorBox>}
      {result && (
        <div className="grid grid-cols-2 gap-2 border-t border-line pt-3">
          <Stat label="Buffer area" value={`${fmt(result.areaSqMi, 1)} sq mi`} />
          <Stat label="Cities & towns inside" value={String(result.towns)} />
          <Stat label="Schools inside" value={String(result.schools)} />
          <Stat label="Hospitals inside" value={String(result.hospitals)} />
        </div>
      )}
      <p className="text-xs leading-relaxed text-mute">The overlay counts features recorded in OpenStreetMap inside the circle. Counts reflect mapping completeness, not an official register.</p>
    </>} />
  );
}

/* ---------------- suitability ---------------- */

interface Candidate { name: string; p: LatLng; eleM: number | null; cityKm: number | null }

function SuitabilityTool() {
  const m = useFeatMap();
  const [anchor, setAnchor] = useState<PlaceValue | null>(null);
  const [names, setNames] = useState("Boulder, Colorado\nGolden, Colorado\nLongmont, Colorado");
  const [wAnchor, setWAnchor] = useState(50);
  const [wEle, setWEle] = useState(25);
  const [wCity, setWCity] = useState(25);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rows, setRows] = useState<(Candidate & { score: number })[] | null>(null);

  const run = async () => {
    if (!anchor) { setError("Set the anchor place (for example your office or home city)."); return; }
    const list = names.split("\n").map((s) => s.trim()).filter(Boolean).slice(0, 10);
    if (list.length < 2) { setError("List at least two candidate places, one per line."); return; }
    setBusy(true); setError(null); setRows(null);
    try {
      const cands: Candidate[] = [];
      for (const name of list) {
        const r = await photonSearch(name, 1);
        if (r.ok && r.results.length) cands.push({ name, p: { lat: r.results[0].lat, lng: r.results[0].lng }, eleM: null, cityKm: null });
      }
      if (cands.length < 2) throw new Error("Fewer than two candidates could be geocoded. Add the state or country to each name.");
      // elevations in one Open-Meteo call
      const url = `https://api.open-meteo.com/v1/elevation?latitude=${cands.map((c) => c.p.lat.toFixed(5)).join(",")}&longitude=${cands.map((c) => c.p.lng.toFixed(5)).join(",")}`;
      const er = await fetch(url);
      if (er.ok) {
        const ed = await er.json();
        (ed.elevation ?? []).forEach((v: number, i: number) => { cands[i].eleM = v; });
      }
      // distance to nearest city (Overpass, best effort per candidate)
      for (const c of cands) {
        try {
          const data = await overpass(`[out:json][timeout:30];node["place"="city"](around:80000,${c.p.lat},${c.p.lng});out 40;`);
          let best: number | null = null;
          for (const e of data.elements ?? []) {
            if (typeof e.lat === "number") { const d = distanceKm(c.p, { lat: e.lat, lng: e.lon }); if (best === null || d < best) best = d; }
          }
          c.cityKm = best;
        } catch { c.cityKm = null; }
      }
      const norm = (vals: (number | null)[], lowerBetter: boolean): number[] => {
        const nums = vals.filter((v): v is number => v !== null);
        const min = Math.min(...nums), max = Math.max(...nums);
        return vals.map((v) => {
          if (v === null) return 50;
          if (max === min) return 100;
          return lowerBetter ? 100 - ((v - min) / (max - min)) * 100 : ((v - min) / (max - min)) * 100;
        });
      };
      const sA = norm(cands.map((c) => distanceKm(anchor, c.p)), true);
      const sE = norm(cands.map((c) => c.eleM), true);
      const sC = norm(cands.map((c) => c.cityKm), true);
      const wSum = Math.max(1, wAnchor + wEle + wCity);
      const scored = cands.map((c, i) => ({ ...c, score: (sA[i] * wAnchor + sE[i] * wEle + sC[i] * wCity) / wSum })).sort((a, b) => b.score - a.score);
      setRows(scored);
      m.show(null, scored.map((c, i) => ({ p: c.p, color: i === 0 ? "#1d6e63" : "#8a4f9e", label: String(i + 1) })), [anchor, ...scored.map((c) => c.p)]);
    } catch (e: any) { setError(e?.message ?? "Scoring failed."); }
    setBusy(false);
  };

  return (
    <Layout map={m.el} panel={<>
      <PlaceField label="Anchor place (closeness is good)" value={anchor} onChange={setAnchor} />
      <Field label="Candidate places, one per line">
        <textarea className="textarea min-h-24" value={names} onChange={(e) => setNames(e.target.value)} />
      </Field>
      <div className="space-y-2">
        <Field label={`Weight — close to anchor: ${wAnchor}%`}><input type="range" min={0} max={100} className="w-full" value={wAnchor} onChange={(e) => setWAnchor(Number(e.target.value))} /></Field>
        <Field label={`Weight — lower elevation: ${wEle}%`}><input type="range" min={0} max={100} className="w-full" value={wEle} onChange={(e) => setWEle(Number(e.target.value))} /></Field>
        <Field label={`Weight — close to a city: ${wCity}%`}><input type="range" min={0} max={100} className="w-full" value={wCity} onChange={(e) => setWCity(Number(e.target.value))} /></Field>
      </div>
      <button type="button" className="btn btn-primary w-full" onClick={run} disabled={busy}>{busy ? <Spinner label="Scoring candidates…" /> : "Score & rank the candidates"}</button>
      {error && <ErrorBox>{error}</ErrorBox>}
      {rows && (
        <div className="overflow-hidden rounded-xl border border-line">
          <table className="tbl"><thead><tr><th>#</th><th>Place</th><th className="text-right">Score</th><th className="text-right">To anchor</th><th className="text-right">Elevation</th></tr></thead>
            <tbody>{rows.map((r, i) => <tr key={i}><td className="font-semibold">{i + 1}</td><td>{r.name}</td><td className="text-right font-semibold">{fmt(r.score, 0)}/100</td><td className="text-right">{anchor ? fmtDist(distanceKm(anchor, r.p), "mi") : "—"}</td><td className="text-right">{r.eleM !== null ? `${fmt(r.eleM * 3.28084, 0)} ft` : "—"}</td></tr>)}</tbody>
          </table>
        </div>
      )}
      <p className="text-xs leading-relaxed text-mute">Scores are relative among your candidates only (best-in-list = 100 on each criterion) and combine straight-line distances with Open-Meteo elevation. A structured shortlist, not a site survey — visit finalists before committing.</p>
    </>} />
  );
}

/* ---------------- area dashboard ---------------- */

function DashboardTool() {
  const m = useFeatMap();
  const [center, setCenter] = useState<PlaceValue | null>(null);
  const [radiusMi, setRadiusMi] = useState(10);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<{ label: string; value: string }[] | null>(null);

  const run = async () => {
    if (!center) { setError("Set the area centre first."); return; }
    setBusy(true); setError(null); setStats(null);
    const radiusKm = radiusMi * 1.609344;
    const ring = circlePolygon(center, radiusKm);
    m.show({ type: "Feature", properties: { color: "#2b6cb0" }, geometry: { type: "Polygon", coordinates: [[...ring.map((p) => [p.lng, p.lat]), [ring[0].lng, ring[0].lat]]] } }, [{ p: center }], [center, ...ring.filter((_, i) => i % 18 === 0)]);
    try {
      const r = Math.round(radiusKm * 1000);
      const base = `around:${r},${center.lat},${center.lng}`;
      const data = await overpass(`[out:json][timeout:60];(node["place"~"city|town|village"](${base});node["amenity"~"school|hospital|restaurant|cafe|fuel"](${base});node["tourism"="hotel"](${base}););out 3000;`);
      const counts = { towns: 0, schools: 0, hospitals: 0, food: 0, fuel: 0, hotels: 0 };
      for (const e of data.elements ?? []) {
        const t = e.tags ?? {};
        if (t.place) counts.towns++;
        else if (t.amenity === "school") counts.schools++;
        else if (t.amenity === "hospital") counts.hospitals++;
        else if (t.amenity === "restaurant" || t.amenity === "cafe") counts.food++;
        else if (t.amenity === "fuel") counts.fuel++;
        else if (t.tourism === "hotel") counts.hotels++;
      }
      let eleNote = "not available";
      try {
        const er = await fetch(`https://api.open-meteo.com/v1/elevation?latitude=${center.lat}&longitude=${center.lng}`);
        if (er.ok) { const ed = await er.json(); eleNote = `${fmt((ed.elevation?.[0] ?? 0) * 3.28084, 0)} ft at centre`; }
      } catch { /* keep fallback */ }
      setStats([
        { label: "Area", value: `${fmt(Math.PI * radiusMi * radiusMi, 1)} sq mi circle` },
        { label: "Cities & towns", value: String(counts.towns) },
        { label: "Schools", value: String(counts.schools) },
        { label: "Hospitals", value: String(counts.hospitals) },
        { label: "Restaurants & cafés", value: String(counts.food) },
        { label: "Fuel stations", value: String(counts.fuel) },
        { label: "Hotels", value: String(counts.hotels) },
        { label: "Elevation", value: eleNote },
      ]);
    } catch (e: any) { setError(e?.message ?? "Dashboard failed."); }
    setBusy(false);
  };

  return (
    <Layout map={m.el} panel={<>
      <PlaceField label="Area centre" value={center} onChange={setCenter} />
      <Field label={`Radius: ${radiusMi} miles`}><input type="range" min={2} max={30} className="w-full" value={radiusMi} onChange={(e) => setRadiusMi(Number(e.target.value))} /></Field>
      <button type="button" className="btn btn-primary w-full" onClick={run} disabled={busy || !center}>{busy ? <Spinner label="Building the dashboard…" /> : "Build the area dashboard"}</button>
      {error && <ErrorBox>{error}</ErrorBox>}
      {stats && (
        <div className="grid grid-cols-2 gap-2 border-t border-line pt-3">
          {stats.map((s) => <Stat key={s.label} label={s.label} value={s.value} />)}
        </div>
      )}
      <p className="text-xs leading-relaxed text-mute">A snapshot of what OpenStreetMap records inside the circle, plus centre elevation from Open-Meteo. Useful for a first look at an area — not a substitute for official statistics.</p>
    </>} />
  );
}

/* ---------------- form builder ---------------- */

interface FieldDef { label: string; type: "text" | "number" | "select"; options: string }
interface Submission { at: string; lat: number | null; lng: number | null; values: Record<string, string> }

const LS_KEY = "mapbench-form-builder-v1";

function FormBuilderTool() {
  const [title, setTitle] = useState("Field survey");
  const [fields, setFields] = useState<FieldDef[]>([
    { label: "Location name", type: "text", options: "" },
    { label: "Condition", type: "select", options: "Good, Fair, Poor" },
    { label: "Count", type: "number", options: "" },
  ]);
  const [values, setValues] = useState<Record<string, string>>({});
  const [subs, setSubs] = useState<Submission[]>([]);
  const [note, setNote] = useState<string | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- hydrate saved submissions once, after mount (SSR-safe)
    try { const raw = localStorage.getItem(LS_KEY); if (raw) setSubs(JSON.parse(raw)); } catch { /* ignore */ }
  }, []);

  const save = (next: Submission[]) => {
    setSubs(next);
    try { localStorage.setItem(LS_KEY, JSON.stringify(next)); } catch { /* ignore */ }
  };

  const submit = async () => {
    let lat: number | null = null, lng: number | null = null;
    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) => navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 6000 }));
      lat = pos.coords.latitude; lng = pos.coords.longitude;
    } catch { /* location stays empty, said in the note */ }
    const sub: Submission = { at: new Date().toISOString(), lat, lng, values: { ...values } };
    save([sub, ...subs]);
    setValues({});
    setNote(lat !== null ? "Submission saved with your current GPS position." : "Submission saved without a position (location was not available or not allowed).");
  };

  const exportCsv = () => {
    const header = ["submitted_at", "latitude", "longitude", ...fields.map((f) => f.label)];
    const body = subs.map((s) => [s.at, s.lat ?? "", s.lng ?? "", ...fields.map((f) => s.values[f.label] ?? "")] as (string | number)[]);
    downloadText("mapbench-form-submissions.csv", toCsv(header, body), "text/csv");
  };
  const exportGeo = () => {
    const fc = { type: "FeatureCollection", features: subs.filter((s) => s.lat !== null).map((s) => ({ type: "Feature", properties: { submitted_at: s.at, ...s.values }, geometry: { type: "Point", coordinates: [s.lng, s.lat] } })) };
    downloadText("mapbench-form-submissions.geojson", JSON.stringify(fc, null, 1), "application/geo+json");
  };

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div className="card space-y-3 p-4">
        <div className="label">1 · Design the form</div>
        <Field label="Form title"><input className="input" value={title} onChange={(e) => setTitle(e.target.value)} /></Field>
        {fields.map((f, i) => (
          <div key={i} className="grid grid-cols-[1fr,110px,1fr,auto] items-end gap-2">
            <Field label={i === 0 ? "Field label" : " "}><input className="input" value={f.label} onChange={(e) => setFields(fields.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))} /></Field>
            <Field label={i === 0 ? "Type" : " "}>
              <select className="select" value={f.type} onChange={(e) => setFields(fields.map((x, j) => (j === i ? { ...x, type: e.target.value as FieldDef["type"] } : x)))}>
                <option value="text">Text</option><option value="number">Number</option><option value="select">Choice</option>
              </select>
            </Field>
            <Field label={i === 0 ? "Choices (for Choice type)" : " "}><input className="input" value={f.options} onChange={(e) => setFields(fields.map((x, j) => (j === i ? { ...x, options: e.target.value } : x)))} placeholder="Good, Fair, Poor" /></Field>
            <button type="button" className="btn btn-ghost btn-sm" aria-label="Remove field" onClick={() => setFields(fields.filter((_, j) => j !== i))}>✕</button>
          </div>
        ))}
        <button type="button" className="btn btn-ghost btn-sm" onClick={() => setFields([...fields, { label: `Field ${fields.length + 1}`, type: "text", options: "" }])}>+ Add field</button>
      </div>

      <div className="card space-y-3 p-4">
        <div className="label">2 · Collect — “{title}” (position attached automatically when allowed)</div>
        {fields.map((f) => (
          <Field key={f.label} label={f.label}>
            {f.type === "select"
              ? <select className="select" value={values[f.label] ?? ""} onChange={(e) => setValues({ ...values, [f.label]: e.target.value })}><option value="">Choose…</option>{f.options.split(",").map((o) => o.trim()).filter(Boolean).map((o) => <option key={o} value={o}>{o}</option>)}</select>
              : <input className="input" type={f.type === "number" ? "number" : "text"} value={values[f.label] ?? ""} onChange={(e) => setValues({ ...values, [f.label]: e.target.value })} />}
          </Field>
        ))}
        <button type="button" className="btn btn-primary" onClick={submit}>Save submission</button>
        {note && <p className="text-sm text-mute">{note}</p>}
      </div>

      <div className="card space-y-3 p-4">
        <div className="label">3 · Review & export ({subs.length} saved)</div>
        {subs.length === 0 ? <p className="text-sm text-mute">No submissions yet.</p> : (
          <>
            <div className="max-h-64 overflow-y-auto rounded-xl border border-line">
              <table className="tbl"><thead><tr><th>When</th><th>Position</th>{fields.map((f) => <th key={f.label}>{f.label}</th>)}</tr></thead>
                <tbody>{subs.map((s, i) => <tr key={i}><td className="whitespace-nowrap text-xs">{s.at.slice(0, 16).replace("T", " ")}</td><td className="font-mono text-xs">{s.lat !== null ? fmtCoords({ lat: s.lat, lng: s.lng ?? 0 }) : "—"}</td>{fields.map((f) => <td key={f.label}>{s.values[f.label] ?? ""}</td>)}</tr>)}</tbody>
              </table>
            </div>
            <div className="flex flex-wrap gap-2">
              <button type="button" className="btn btn-ghost btn-sm" onClick={exportCsv}>Download CSV</button>
              <button type="button" className="btn btn-ghost btn-sm" onClick={exportGeo}>Download GeoJSON</button>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => save([])}>Clear all</button>
            </div>
          </>
        )}
        <p className="text-xs leading-relaxed text-mute">Honest limit: submissions are stored only in this browser (local storage) — there is no MapBench account or shared team inbox behind this page. For a real multi-person survey you need a hosted form backend; this builder is for solo fieldwork and prototyping.</p>
      </div>
    </div>
  );
}

/* ---------------- live connector ---------------- */

function ConnectorTool() {
  const m = useFeatMap();
  const [url, setUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<{ count: number; updatedAt: string; props: [string, string][] } | null>(null);

  const connect = async () => {
    if (!url.trim()) { setError("Paste a GeoJSON or CSV endpoint URL first."); return; }
    setBusy(true); setError(null);
    try {
      const res = await fetch(url.trim());
      if (!res.ok) throw new Error(`The endpoint answered HTTP ${res.status}.`);
      const text = await res.text();
      let fc: any = null;
      let pts: LatLng[] = [];
      if (text.trim().startsWith("{")) {
        const json = JSON.parse(text);
        fc = json.type === "Feature" ? { type: "FeatureCollection", features: [json] } : json;
        if (fc?.type !== "FeatureCollection") throw new Error("That JSON is not GeoJSON (expected a FeatureCollection).");
        for (const f of fc.features ?? []) {
          const g = f.geometry;
          if (!g) continue;
          if (g.type === "Point") pts.push({ lat: g.coordinates[1], lng: g.coordinates[0] });
          else if (g.type === "Polygon") pts.push({ lat: g.coordinates[0][0][1], lng: g.coordinates[0][0][0] });
          else if (g.type === "LineString") pts.push({ lat: g.coordinates[0][1], lng: g.coordinates[0][0] });
        }
      } else {
        // CSV with latitude/longitude columns
        const lines = text.split("\n").filter(Boolean);
        const head = lines[0].toLowerCase().split(",").map((s) => s.trim());
        const li = head.findIndex((h) => h.includes("lat"));
        const lo = head.findIndex((h) => h.includes("lon") || h.includes("lng"));
        if (li < 0 || lo < 0) throw new Error("The response was not GeoJSON, and the CSV has no latitude/longitude columns.");
        const features: any[] = [];
        for (const line of lines.slice(1)) {
          const cells = line.split(",");
          const lat = Number(cells[li]), lng = Number(cells[lo]);
          if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue;
          pts.push({ lat, lng });
          const props: Record<string, string> = {};
          head.forEach((h, i) => { props[h] = cells[i] ?? ""; });
          features.push({ type: "Feature", properties: props, geometry: { type: "Point", coordinates: [lng, lat] } });
        }
        fc = { type: "FeatureCollection", features };
      }
      const firstProps = (fc.features?.[0]?.properties ?? {}) as Record<string, unknown>;
      setInfo({ count: fc.features?.length ?? 0, updatedAt: new Date().toLocaleTimeString(), props: Object.entries(firstProps).slice(0, 6).map(([k, v]) => [k, String(v)] as [string, string]) });
      m.show(fc, [], pts.slice(0, 500));
    } catch (e: any) {
      setError(`${e?.message ?? "Connection failed."} If the endpoint blocks cross-origin requests (CORS), the data owner has to allow browser access — that cannot be bypassed from here.`);
    }
    setBusy(false);
  };

  return (
    <Layout map={m.el} panel={<>
      <Field label="Live data endpoint (GeoJSON or CSV URL)" hint="Fetched directly by your browser each time you connect or refresh.">
        <input className="input font-mono text-xs" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://example.org/data.geojson" />
      </Field>
      <div className="flex gap-2">
        <button type="button" className="btn btn-primary flex-1" onClick={connect} disabled={busy}>{busy ? <Spinner label="Fetching…" /> : info ? "↻ Refresh data" : "Connect"}</button>
        {info && <CopyBtn text={url} label="Copy endpoint URL" />}
      </div>
      <div className="flex flex-wrap gap-2">
        <button type="button" className="btn btn-ghost btn-sm" onClick={() => setUrl("https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/2.5_day.geojson")}>Example: USGS earthquakes (GeoJSON)</button>
        <button type="button" className="btn btn-ghost btn-sm" onClick={() => setUrl("https://davidmegginson.github.io/ourairports-data/airports.csv")}>Example: OurAirports (CSV)</button>
      </div>
      {error && <ErrorBox>{error}</ErrorBox>}
      {info && (
        <div className="space-y-3 border-t border-line pt-3">
          <div className="grid grid-cols-2 gap-2">
            <Stat label="Features loaded" value={String(info.count)} />
            <Stat label="Last fetched" value={info.updatedAt} />
          </div>
          {info.props.length > 0 && (
            <div><div className="label">First feature&apos;s properties</div>
              <table className="tbl"><tbody>{info.props.map(([k, v]) => <tr key={k}><td className="font-mono text-xs">{k}</td><td className="text-xs">{v}</td></tr>)}</tbody></table>
            </div>
          )}
          <p className="text-xs text-mute">“Live” here means the map re-reads the endpoint whenever you press Refresh — the freshness depends on how often the publisher updates that feed.</p>
        </div>
      )}
    </>} />
  );
}
