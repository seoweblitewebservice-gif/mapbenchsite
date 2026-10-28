"use client";
import { useRef, useState, type ReactNode } from "react";
import type { Map as MLMap, GeoJSONSource } from "maplibre-gl";
import { distanceKm, fmt, fmtCoords, fmtDist, parseCoordPair, isValidLat, isValidLng, type LatLng } from "@/lib/geo";
import { airportRouteGraph, airportConnections, sphericalPolygonAreaKm2 } from "@/lib/mapToolData";
import { downloadText, geojsonToKml } from "@/lib/formats";
import { geolocation } from "@/lib/geocode";
import { CopyBtn, ErrorBox, Field, FileDropzone, Spinner, Stat } from "@/components/ui";
import { DynamicMap, pinElement, PlaceField, type PlaceValue } from "./shared";

/**
 * Map-data pages added for the user's list: cities in a county, boundary
 * downloads (place + country), airport route finder, an advanced embed-code
 * generator and a store locator. Boundaries come from OpenStreetMap via
 * Nominatim/Overpass; airport data from the public-domain OpenFlights set.
 */

type Mode = "county-cities" | "boundary-kml" | "boundary-country" | "airport-routes" | "advanced-embed" | "store-locator";

const PALETTE = ["#1d6e63", "#d95d32", "#2b6cb0", "#8a4f9e", "#b7791f", "#2f855a"];

function useShapeMap() {
  const mapRef = useRef<MLMap | null>(null);
  const libRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const show = (fc: any, marks: { p: LatLng; color?: string; label?: string }[] = [], fitPts?: LatLng[]) => {
    const map = mapRef.current, lib = libRef.current;
    if (!map || !lib) return;
    (map.getSource("shape") as GeoJSONSource | undefined)?.setData(fc ?? { type: "FeatureCollection", features: [] });
    markersRef.current.forEach((mk) => mk.remove());
    markersRef.current = marks.map((mk) => new lib.Marker({ element: pinElement(mk.color ?? "#1d6e63", mk.label) }).setLngLat([mk.p.lng, mk.p.lat]).addTo(map));
    const pts = fitPts ?? marks.map((x) => x.p);
    if (pts.length > 1) {
      let minLng = Infinity, maxLng = -Infinity, minLat = Infinity, maxLat = -Infinity;
      for (const p of pts) { minLng = Math.min(minLng, p.lng); maxLng = Math.max(maxLng, p.lng); minLat = Math.min(minLat, p.lat); maxLat = Math.max(maxLat, p.lat); }
      map.fitBounds([[minLng, minLat], [maxLng, maxLat]], { padding: 50, maxZoom: 12, duration: 500 });
    } else if (pts.length === 1) map.flyTo({ center: [pts[0].lng, pts[0].lat], zoom: 9, essential: true });
  };
  const el = (
    <DynamicMap center={{ lat: 30, lng: 10 }} zoom={1.8} className="tall" onReady={(map, lib) => {
      mapRef.current = map; libRef.current = lib;
      map.addSource("shape", { type: "geojson", data: { type: "FeatureCollection", features: [] } });
      map.addLayer({ id: "shape-fill", type: "fill", source: "shape", filter: ["==", ["geometry-type"], "Polygon"], paint: { "fill-color": "#1d6e63", "fill-opacity": 0.14 } });
      map.addLayer({ id: "shape-line", type: "line", source: "shape", paint: { "line-color": "#1d6e63", "line-width": 2 } });
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

interface BoundaryResult { name: string; fc: any; areaKm2: number; rings: number }

async function fetchBoundary(query: string): Promise<BoundaryResult> {
  const url = `https://nominatim.openstreetmap.org/search?format=geojson&polygon_geojson=1&limit=5&q=${encodeURIComponent(query)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("The boundary service did not answer. Try again in a moment.");
  const fc = await res.json();
  const feat = (fc.features ?? []).find((f: any) => f.geometry && (f.geometry.type === "Polygon" || f.geometry.type === "MultiPolygon"));
  if (!feat) throw new Error(`No boundary polygon was found for “${query}”. Try a more specific name, like “Austin city, Texas”.`);
  let area = 0;
  const polys = feat.geometry.type === "Polygon" ? [feat.geometry.coordinates] : feat.geometry.coordinates;
  for (const poly of polys) area += sphericalPolygonAreaKm2(poly);
  return { name: feat.properties?.display_name ?? query, fc: { type: "FeatureCollection", features: [feat] }, areaKm2: area, rings: polys.length };
}

export default function ListMapTools({ params }: { params?: Record<string, unknown> }) {
  const mode = ((params?.mode as string) ?? "county-cities") as Mode;
  switch (mode) {
    case "boundary-kml": return <BoundaryTool country={false} />;
    case "boundary-country": return <BoundaryTool country />;
    case "airport-routes": return <AirportTool />;
    case "advanced-embed": return <EmbedTool />;
    case "store-locator": return <StoreTool />;
    default: return <CountyCitiesTool />;
  }
}

/* ---------------- cities within a county ---------------- */

function CountyCitiesTool() {
  const m = useShapeMap();
  const [county, setCounty] = useState("Travis");
  const [stateCode, setStateCode] = useState("TX");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cities, setCities] = useState<{ name: string; p: LatLng }[] | null>(null);

  const run = async () => {
    setBusy(true); setError(null); setCities(null);
    try {
      if (stateCode.trim() && !/^[a-zA-Z]{2}$/.test(stateCode.trim())) throw new Error("Enter a two-letter state abbreviation.");
      const name = county.trim().toLowerCase().endsWith("county") ? county.trim() : `${county.trim()} County`;
      const stateFilter = stateCode.trim() ? `["is_in:state_code"="US-${stateCode.trim().toUpperCase()}"]` : "";
      const ql = `[out:json][timeout:90];area["boundary"="administrative"]["name"="${name.replace(/"/g, "")}"]${stateFilter}->.a;node["place"~"city|town|village"](area.a);out 300;`;
      const data = await overpass(ql);
      const found = (data.elements ?? []).filter((e: any) => e.tags?.name).map((e: any) => ({ name: e.tags.name as string, p: { lat: e.lat, lng: e.lon } as LatLng }));
      if (!found.length) throw new Error(`No county boundary or places matched “${name}”. Check the county name — a few states use parishes or boroughs instead.`);
      found.sort((a: { name: string }, b: { name: string }) => a.name.localeCompare(b.name));
      setCities(found);
      m.show(null, found.map((c: { name: string; p: LatLng }) => ({ p: c.p })), found.map((c: { name: string; p: LatLng }) => c.p));
    } catch (e: any) { setError(e?.message ?? "Search failed."); }
    setBusy(false);
  };

  return (
    <Layout map={m.el} panel={<>
      <div className="grid grid-cols-[1fr,90px] gap-2">
        <Field label="County name"><input className="input" value={county} onChange={(e) => setCounty(e.target.value)} placeholder="Travis" /></Field>
        <Field label="State"><input className="input" value={stateCode} onChange={(e) => setStateCode(e.target.value)} placeholder="TX" /></Field>
      </div>
      <button type="button" className="btn btn-primary w-full" onClick={run} disabled={busy}>{busy ? <Spinner label="Reading the county…" /> : "List cities & towns in the county"}</button>
      {error && <ErrorBox>{error}</ErrorBox>}
      {cities && (
        <div className="space-y-2">
          <Stat label="Places recorded in OpenStreetMap" value={String(cities.length)} />
          <div className="max-h-80 overflow-y-auto rounded-xl border border-line">
            <table className="tbl"><tbody>{cities.map((c, i) => <tr key={i}><td>{c.name}</td><td className="text-right font-mono text-xs">{fmtCoords(c.p)}</td></tr>)}</tbody></table>
          </div>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => downloadText("mapbench-county-cities.csv", `name,latitude,longitude\n${cities.map((c) => `"${c.name.replace(/"/g, '""')}",${c.p.lat},${c.p.lng}`).join("\n")}`, "text/csv")}>Download CSV</button>
        </div>
      )}
      <p className="text-xs text-mute">Up to 300 OSM place nodes are returned before sorting, not a complete or official list. County matching depends on OSM boundary names and state tags; some communities may be missing.</p>
    </>} />
  );
}

/* ---------------- boundary downloaders ---------------- */

const COUNTRIES = ["France", "Germany", "Spain", "Italy", "Poland", "Netherlands", "Belgium", "Austria", "Switzerland", "Portugal", "Greece", "Sweden", "Norway", "Denmark", "Finland", "Ireland", "United Kingdom", "United States", "Canada", "Mexico", "Brazil", "Australia", "Japan", "India"];

function BoundaryTool({ country }: { country: boolean }) {
  const m = useShapeMap();
  const [query, setQuery] = useState(country ? "France" : "Austin, Texas");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<BoundaryResult | null>(null);

  const run = async () => {
    setBusy(true); setError(null); setResult(null);
    try {
      const r = await fetchBoundary(query.trim());
      setResult(r);
      const feat = r.fc.features[0];
      const firstRing = feat.geometry.type === "Polygon" ? feat.geometry.coordinates[0] : feat.geometry.coordinates[0][0];
      m.show(r.fc, [], firstRing.map((c: number[]) => ({ lat: c[1], lng: c[0] })));
    } catch (e: any) { setError(e?.message ?? "Lookup failed."); }
    setBusy(false);
  };

  return (
    <Layout map={m.el} panel={<>
      {country ? (
        <Field label="Country">
          <select className="select" value={query} onChange={(e) => setQuery(e.target.value)}>{COUNTRIES.map((c) => <option key={c} value={c}>{c}</option>)}</select>
        </Field>
      ) : (
        <Field label="Place name" hint="A city, county, state or region — the more specific, the better the match.">
          <input className="input" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Austin, Texas" />
        </Field>
      )}
      <button type="button" className="btn btn-primary w-full" onClick={run} disabled={busy}>{busy ? <Spinner label="Fetching the boundary…" /> : "Get the boundary"}</button>
      {error && <ErrorBox>{error}</ErrorBox>}
      {result && (
        <div className="space-y-3 border-t border-line pt-3">
          <Stat label="Matched boundary" value={result.name.split(",").slice(0, 2).join(",")} sub={`${result.rings} polygon part${result.rings > 1 ? "s" : ""}`} />
          <Stat label="Approximate area inside the outline" value={`${fmt(result.areaKm2 * 0.386102, 0)} sq mi`} sub={`${fmt(result.areaKm2, 0)} km² — spherical estimate, not a land-area or survey measurement`} />
          <div className="flex flex-wrap gap-2">
            <button type="button" className="btn btn-primary btn-sm" onClick={() => downloadText("mapbench-boundary.kml", geojsonToKml(result.fc, result.name), "application/vnd.google-earth.kml+xml")}>Download KML</button>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => downloadText("mapbench-boundary.geojson", JSON.stringify(result.fc, null, 1), "application/geo+json")}>Download GeoJSON</button>
          </div>
          <p className="text-xs text-mute">Boundary © OpenStreetMap contributors (ODbL), served via Nominatim. Verify the matched feature and its coverage; maritime borders and disputed areas follow OSM mapping. The preview fits the first outer ring only.</p>
        </div>
      )}
    </>} />
  );
}

/* ---------------- airport route finder ---------------- */

interface Airport { id: string; name: string; city: string; iata: string; p: LatLng }
let airportsCache: Promise<Airport[]> | null = null;
let routesCache: Promise<Map<string, Set<string>>> | null = null;

function splitCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = "", inQ = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQ) {
      if (ch === '"') { if (line[i + 1] === '"') { cur += '"'; i++; } else inQ = false; }
      else cur += ch;
    } else if (ch === '"') inQ = true;
    else if (ch === ",") { out.push(cur); cur = ""; }
    else cur += ch;
  }
  out.push(cur);
  return out;
}

function loadAirports(): Promise<Airport[]> {
  if (!airportsCache) {
    airportsCache = fetch("https://raw.githubusercontent.com/jpatokal/openflights/master/data/airports.dat")
      .then((r) => { if (!r.ok) throw new Error(); return r.text(); })
      .then((text) => text.split("\n").filter(Boolean).map((line) => {
        const c = splitCsvLine(line);
        return { id: c[0], name: c[1], city: c[2], iata: c[4], p: { lat: Number(c[6]), lng: Number(c[7]) } } as Airport;
      }).filter((a) => a.iata && a.iata !== "\\N" && isValidLat(a.p.lat) && isValidLng(a.p.lng)))
      .catch((error) => { airportsCache = null; throw error; });
  }
  return airportsCache;
}

function loadRoutes(): Promise<Map<string, Set<string>>> {
  if (!routesCache) {
    routesCache = fetch("https://raw.githubusercontent.com/jpatokal/openflights/master/data/routes.dat")
      .then((r) => { if (!r.ok) throw new Error(); return r.text(); })
      .then(airportRouteGraph)
      .catch((error) => { routesCache = null; throw error; });
  }
  return routesCache;
}

function AirportTool() {
  const m = useShapeMap();
  const [from, setFrom] = useState("JFK");
  const [to, setTo] = useState("LHR");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ a: Airport; b: Airport; direct: boolean; via: Airport[] } | null>(null);

  const run = async () => {
    setBusy(true); setError(null); setResult(null);
    try {
      const [airports, routes] = await Promise.all([loadAirports(), loadRoutes()]);
      const byIata = new Map(airports.map((a) => [a.iata.toUpperCase(), a]));
      const byId = new Map(airports.map((a) => [a.id, a]));
      const a = byIata.get(from.trim().toUpperCase());
      const b = byIata.get(to.trim().toUpperCase());
      if (!a) throw new Error(`Airport code “${from}” was not found in the OpenFlights data.`);
      if (!b) throw new Error(`Airport code “${to}” was not found in the OpenFlights data.`);
      const direct = routes.get(a.id)?.has(b.id) ?? false;
      const via: Airport[] = [];
      if (!direct) {
        for (const id of airportConnections(routes, a.id, b.id)) {
          const ap = byId.get(id);
          if (ap) via.push(ap);
          if (via.length >= 8) break;
        }
      }
      setResult({ a, b, direct, via });
      const line = direct || !via.length ? [a.p, b.p] : [a.p, via[0].p, b.p];
      m.show({ type: "Feature", properties: {}, geometry: { type: "LineString", coordinates: line.map((p) => [p.lng, p.lat]) } },
        [{ p: a.p, label: "A" }, ...via.slice(0, 1).map((v) => ({ p: v.p, color: "#b7791f", label: "1" })), { p: b.p, color: "#d95d32", label: "B" }],
        line);
    } catch (e: any) { setError(e?.message ?? "Lookup failed."); }
    setBusy(false);
  };

  return (
    <Layout map={m.el} panel={<>
      <div className="grid grid-cols-2 gap-2">
        <Field label="From (IATA code)"><input className="input uppercase" value={from} onChange={(e) => setFrom(e.target.value)} maxLength={4} /></Field>
        <Field label="To (IATA code)"><input className="input uppercase" value={to} onChange={(e) => setTo(e.target.value)} maxLength={4} /></Field>
      </div>
      <button type="button" className="btn btn-primary w-full" onClick={run} disabled={busy}>{busy ? <Spinner label="Loading airport data…" /> : "Find the route"}</button>
      {error && <ErrorBox>{error}</ErrorBox>}
      {result && (
        <div className="space-y-3 border-t border-line pt-3">
          <Stat label={`${result.a.city} (${result.a.iata}) → ${result.b.city} (${result.b.iata})`} value={fmtDist(distanceKm(result.a.p, result.b.p), "mi")} sub={`${result.a.name} → ${result.b.name} · great-circle distance`} />
          {result.direct
            ? <p className="rounded-lg bg-accentsoft px-3 py-2 text-sm font-medium text-accent">✈ A non-stop route appears in the historical OpenFlights dataset.</p>
            : result.via.length
              ? <div><div className="label">One-stop options in the data (first 8)</div><div className="flex flex-wrap gap-1.5">{result.via.map((v) => <span key={v.id} className="chip">{v.city} ({v.iata})</span>)}</div></div>
              : <p className="text-sm text-mute">No non-stop or single shared one-stop route appears in the OpenFlights data for this pair.</p>}
          <p className="text-xs leading-relaxed text-mute">Route data: OpenFlights (public airport/route datasets, community maintained). The dataset is historical and not a live timetable. Confirm both legs and current availability with airlines before booking; a connection may not be bookable.</p>
        </div>
      )}
    </>} />
  );
}

/* ---------------- advanced embed generator ---------------- */

function EmbedTool() {
  const [center, setCenter] = useState<PlaceValue | null>(null);
  const [zoom, setZoom] = useState(13);
  const [w, setW] = useState(800);
  const [h, setH] = useState(450);
  const [markersText, setMarkersText] = useState("");
  const marks = markersText.split("\n").map((l) => parseCoordPair(l.trim())).filter(Boolean) as LatLng[];
  const c = center ?? { lat: 40.7128, lng: -74.006 };
  const lonSpan = ((w / 256) / Math.pow(2, zoom)) * 360;
  const latSpan = ((h / 256) / Math.pow(2, zoom)) * 360 * 0.75;
  const bbox = `${(c.lng - lonSpan / 2).toFixed(5)},${(c.lat - latSpan / 2).toFixed(5)},${(c.lng + lonSpan / 2).toFixed(5)},${(c.lat + latSpan / 2).toFixed(5)}`;
  const src = `https://www.openstreetmap.org/export/embed.html?bbox=${encodeURIComponent(bbox)}&layer=mapnik${marks.length ? `&marker=${marks[0].lat},${marks[0].lng}` : `&marker=${c.lat},${c.lng}`}`;
  const code = `<iframe width="${w}" height="${h}" frameborder="0" scrolling="no" marginheight="0" marginwidth="0" src="${src}" style="border:1px solid #ccc"></iframe>\n<br/><small><a href="https://www.openstreetmap.org/?mlat=${c.lat}&mlon=${c.lng}#map=${zoom}/${c.lat}/${c.lng}" target="_blank" rel="noopener">View larger map</a></small>`;

  return (
    <div className="grid gap-4 lg:grid-cols-[400px,1fr]">
      <div className="card order-2 space-y-4 p-4 lg:order-1">
        <PlaceField label="Map centre" value={center} onChange={setCenter} />
        <Field label={`Zoom: ${zoom}`}><input type="range" min={3} max={18} className="w-full" value={zoom} onChange={(e) => setZoom(Number(e.target.value))} /></Field>
        <div className="grid grid-cols-2 gap-2">
          <Field label="Width (px)"><input type="number" className="input" value={w} onChange={(e) => setW(Math.max(200, Number(e.target.value) || 200))} /></Field>
          <Field label="Height (px)"><input type="number" className="input" value={h} onChange={(e) => setH(Math.max(150, Number(e.target.value) || 150))} /></Field>
        </div>
        <Field label="Marker (optional, lat,lng)" hint="The OpenStreetMap embed shows one marker; it defaults to the centre.">
          <textarea className="textarea min-h-16 font-mono text-sm" value={markersText} onChange={(e) => setMarkersText(e.target.value)} placeholder="40.7580,-73.9855" />
        </Field>
        <Field label="Your embed code">
          <textarea className="textarea min-h-32 font-mono text-xs" readOnly value={code} />
        </Field>
        <CopyBtn text={code} label="Copy embed code" />
        <p className="text-xs text-mute">The embed is served by OpenStreetMap&apos;s own embed service — free to use on your site under the OSM tile policy; heavy commercial traffic should use a tile provider.</p>
      </div>
      <div className="order-1 lg:order-2">
        <div className="overflow-hidden rounded-2xl border border-line">
          <iframe title="Embed preview" width="100%" height={Math.min(h, 560)} src={src} style={{ border: 0 }} loading="lazy" />
        </div>
        <p className="mt-2 text-center text-xs text-mute">Live preview at {w}×{h} (scaled to this column).</p>
      </div>
    </div>
  );
}

/* ---------------- store locator ---------------- */

interface Store { name: string; p: LatLng }
function parseStores(text: string): Store[] {
  const out: Store[] = [];
  for (const line of text.split("\n")) {
    const parts = line.split(",").map((s) => s.trim());
    if (parts.length < 3) continue;
    const lat = Number(parts[parts.length - 2]), lng = Number(parts[parts.length - 1]);
    const name = parts.slice(0, -2).join(", ");
    if (name && parts[parts.length - 2] !== "" && parts[parts.length - 1] !== "" && isValidLat(lat) && isValidLng(lng)) out.push({ name, p: { lat, lng } });
  }
  return out;
}

function StoreTool() {
  const m = useShapeMap();
  const [text, setText] = useState("Downtown Store,40.7128,-74.0060\nUptown Store,40.7831,-73.9712\nBrooklyn Store,40.6782,-73.9442");
  const [visitor, setVisitor] = useState<PlaceValue | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rows, setRows] = useState<{ name: string; p: LatLng; d: number }[] | null>(null);
  const stores = parseStores(text);

  const locate = async (useGeo: boolean) => {
    let target: LatLng | null = visitor;
    if (useGeo) {
      setBusy(true);
      try { target = await geolocation(); } catch { target = null; }
      setBusy(false);
      if (!target) { setError("Location was not available — allow location access, or search for the visitor address instead."); return; }
    }
    if (!target) { setError("Set the visitor location first."); return; }
    if (!stores.length) { setError("Add at least one store as: Name, latitude, longitude."); return; }
    setError(null);
    const sorted = stores.map((s) => ({ ...s, d: distanceKm(target!, s.p) })).sort((a, b) => a.d - b.d);
    setRows(sorted);
    m.show(null, [{ p: target, color: "#d95d32", label: "You" }, ...sorted.slice(0, 20).map((s, i) => ({ p: s.p, color: PALETTE[i % PALETTE.length], label: String(i + 1) }))], [target, ...sorted.map((s) => s.p)]);
  };

  return (
    <Layout map={m.el} panel={<>
      <Field label="Your stores — one per line: Name, lat, lng">
        <textarea className="textarea min-h-28 font-mono text-sm" value={text} onChange={(e) => setText(e.target.value)} />
      </Field>
      <FileDropzone accept=".csv,.txt" onFile={async (f) => setText(await f.text())}><span className="text-sm">Or drop a store CSV file</span></FileDropzone>
      <PlaceField label="Visitor location (address search)" value={visitor} onChange={setVisitor} />
      <div className="flex gap-2">
        <button type="button" className="btn btn-primary flex-1" onClick={() => locate(false)} disabled={!visitor || !stores.length}>Find nearest stores</button>
        <button type="button" className="btn btn-ghost" onClick={() => locate(true)} disabled={busy}>{busy ? "…" : "📍 Use my location"}</button>
      </div>
      {error && <ErrorBox>{error}</ErrorBox>}
      {rows && (
        <div className="space-y-2">
          <Stat label="Nearest store" value={rows[0].name} sub={`${fmtDist(rows[0].d, "mi")} away, straight-line`} />
          <div className="max-h-72 overflow-y-auto rounded-xl border border-line">
            <table className="tbl"><thead><tr><th>#</th><th>Store</th><th className="text-right">Distance</th></tr></thead>
              <tbody>{rows.map((r, i) => <tr key={i}><td>{i + 1}</td><td>{r.name}</td><td className="text-right">{fmtDist(r.d, "mi")}</td></tr>)}</tbody>
            </table>
          </div>
        </div>
      )}
      <p className="text-xs leading-relaxed text-mute">Distances are straight-line from the visitor point. Your store list stays in this browser tab — nothing is uploaded — The embed generator creates a single-marker map, not a permanent multi-store locator. Address search and map tiles contact external providers.</p>
    </>} />
  );
}
