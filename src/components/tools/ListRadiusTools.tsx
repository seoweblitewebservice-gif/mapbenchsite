"use client";
import { useEffect, useRef, useState, type ReactNode } from "react";
import type { Map as MLMap, GeoJSONSource } from "maplibre-gl";
import { distanceKm, fmtCoords, fmtDist, isValidLat, isValidLng, type LatLng } from "@/lib/geo";
import { photonSearch } from "@/lib/geocode";
import { ErrorBox, Field, FileDropzone, Seg, Spinner, Stat } from "@/components/ui";
import { DynamicMap, pinElement, PlaceField, type PlaceValue } from "./shared";

/**
 * Radius / region search pages added for the user's list: places inside a
 * drawn area, ZIP codes by state/county/city, Australian postcodes by state
 * and suburb, and the nearest postcode from an uploaded list. Data:
 * OpenStreetMap (Overpass), Zippopotam.us and postcodes.io.
 */

type Mode = "area-places" | "zips-region" | "au-postcodes" | "nearest-list";

interface Hit { name: string; p: LatLng; d: number }

async function overpass(ql: string): Promise<any[]> {
  const res = await fetch("https://overpass-api.de/api/interpreter", { method: "POST", body: new URLSearchParams({ data: ql }) });
  if (res.status === 429) throw new Error("The OpenStreetMap query service is rate-limiting right now. Wait a few seconds and try again.");
  if (!res.ok) throw new Error("The OpenStreetMap query service did not answer. Try again in a moment.");
  const data = await res.json();
  return data.elements ?? [];
}

function elPoint(e: any): LatLng | null {
  if (isValidLat(e.lat) && isValidLng(e.lon)) return { lat: e.lat, lng: e.lon };
  if (isValidLat(e.center?.lat) && isValidLng(e.center?.lon)) return { lat: e.center.lat, lng: e.center.lon };
  return null;
}

function pointInPolygon(p: LatLng, poly: LatLng[]): boolean {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const xi = poly[i].lng, yi = poly[i].lat, xj = poly[j].lng, yj = poly[j].lat;
    if ((yi > p.lat) !== (yj > p.lat) && p.lng < ((xj - xi) * (p.lat - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

function useHitMap(onClick?: (p: LatLng) => void) {
  const mapRef = useRef<MLMap | null>(null);
  const libRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const show = (hits: Hit[], poly?: LatLng[]) => {
    const map = mapRef.current, lib = libRef.current;
    if (!map || !lib) return;
    markersRef.current.forEach((mk) => mk.remove());
    markersRef.current = hits.slice(0, 60).map((h) => new lib.Marker({ element: pinElement("#8a4f9e") }).setLngLat([h.p.lng, h.p.lat]).addTo(map));
    (map.getSource("poly") as GeoJSONSource | undefined)?.setData(poly && poly.length > 2
      ? { type: "Feature", properties: {}, geometry: { type: "Polygon", coordinates: [[...poly.map((p) => [p.lng, p.lat]), [poly[0].lng, poly[0].lat]]] } }
      : { type: "FeatureCollection", features: [] });
    const pts = [...hits.map((h) => h.p), ...(poly ?? [])];
    if (pts.length > 1) {
      const lngs = pts.map((p) => p.lng), lats = pts.map((p) => p.lat);
      map.fitBounds([[Math.min(...lngs), Math.min(...lats)], [Math.max(...lngs), Math.max(...lats)]], { padding: 60, maxZoom: 12, duration: 500 });
    } else if (pts.length === 1) map.flyTo({ center: [pts[0].lng, pts[0].lat], zoom: 11, essential: true });
  };
  const el = (
    <DynamicMap center={{ lat: 30, lng: 10 }} zoom={1.8} className="tall" onReady={(map, lib) => {
      mapRef.current = map; libRef.current = lib;
      map.addSource("poly", { type: "geojson", data: { type: "FeatureCollection", features: [] } });
      map.addLayer({ id: "poly-fill", type: "fill", source: "poly", paint: { "fill-color": "#1d6e63", "fill-opacity": 0.15 } });
      map.addLayer({ id: "poly-line", type: "line", source: "poly", paint: { "line-color": "#1d6e63", "line-width": 2 } });
      if (onClick) map.on("click", (e: any) => onClick({ lat: e.lngLat.lat, lng: e.lngLat.lng }));
    }} />
  );
  return { el, show, mapRef };
}

function Layout({ panel, map }: { panel: ReactNode; map: ReactNode }) {
  return (
    <div className="grid gap-4 lg:grid-cols-[400px,1fr]">
      <div className="card order-2 space-y-4 p-4 lg:order-1">{panel}</div>
      <div className="order-1 lg:order-2">{map}</div>
    </div>
  );
}

function HitList({ hits, empty }: { hits: Hit[]; empty: string }) {
  if (!hits.length) return <p className="text-sm text-mute">{empty}</p>;
  return (
    <div className="max-h-96 overflow-y-auto rounded-xl border border-line">
      <table className="tbl"><thead><tr><th>Place / code</th><th className="text-right">Distance</th></tr></thead>
        <tbody>{hits.map((h, i) => <tr key={i}><td>{h.name}</td><td className="text-right">{h.d > 0 ? fmtDist(h.d, "mi") : "—"}</td></tr>)}</tbody>
      </table>
    </div>
  );
}

export default function ListRadiusTools({ params }: { params?: Record<string, unknown> }) {
  const mode = ((params?.mode as string) ?? "area-places") as Mode;
  switch (mode) {
    case "zips-region": return <ZipsRegionTool />;
    case "au-postcodes": return <AuPostcodesTool />;
    case "nearest-list": return <NearestListTool />;
    default: return <AreaPlacesTool />;
  }
}

/* ---------------- places inside a drawn area ---------------- */

function AreaPlacesTool() {
  const [poly, setPoly] = useState<LatLng[]>([]);
  const m = useHitMap((p) => setPoly((prev) => [...prev, p]));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hits, setHits] = useState<Hit[] | null>(null);

  const showRef = useRef(m.show);
  useEffect(() => { showRef.current = m.show; });
  useEffect(() => { if (poly.length) showRef.current([], poly); }, [poly]);

  const search = async () => {
    if (poly.length < 3) { setError("Click at least three corners on the map to draw your area."); return; }
    setBusy(true); setError(null);
    try {
      const polyStr = poly.map((p) => `${p.lat} ${p.lng}`).join(" ");
      const els = await overpass(`[out:json][timeout:60];node["place"~"city|town|village"](poly:"${polyStr}");out 300;`);
      const centre = poly.reduce((acc, p) => ({ lat: acc.lat + p.lat / poly.length, lng: acc.lng + p.lng / poly.length }), { lat: 0, lng: 0 });
      const found: Hit[] = [];
      for (const e of els) {
        const p = elPoint(e);
        if (!p || !pointInPolygon(p, poly)) continue;
        found.push({ name: e.tags?.name ?? "Unnamed place", p, d: distanceKm(centre, p) });
      }
      found.sort((a, b) => a.d - b.d);
      setHits(found);
      m.show(found, poly);
    } catch (e: any) { setError(e?.message ?? "Search failed."); }
    setBusy(false);
  };

  return (
    <Layout map={m.el} panel={<>
      <p className="text-sm leading-relaxed text-mute">Click the map to draw a shape — every corner you click becomes part of the boundary. Then find the cities and towns recorded inside it.</p>
      <div className="flex items-center gap-2">
        <span className="chip chip-brand">{poly.length} corners</span>
        <button type="button" className="btn btn-ghost btn-sm" onClick={() => { setPoly([]); setHits(null); m.show([]); }}>Clear shape</button>
      </div>
      <button type="button" className="btn btn-primary w-full" onClick={search} disabled={busy || poly.length < 3}>{busy ? <Spinner label="Searching inside the shape…" /> : "Find cities & towns inside"}</button>
      {error && <ErrorBox>{error}</ErrorBox>}
      {hits && <HitList hits={hits} empty="No cities or towns are recorded inside that shape in OpenStreetMap. Small settlements may simply not be mapped yet." />}
    </>} />
  );
}

/* ---------------- ZIP codes by state / county / city ---------------- */

function ZipsRegionTool() {
  const m = useHitMap();
  const [by, setBy] = useState<"city" | "county">("city");
  const [state, setState] = useState("CA");
  const [city, setCity] = useState("Los Angeles");
  const [county, setCounty] = useState("Los Angeles");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hits, setHits] = useState<Hit[] | null>(null);
  const [note, setNote] = useState("");

  const run = async () => {
    setBusy(true); setError(null); setHits(null); setNote("");
    try {
      if (by === "city") {
        const res = await fetch(`https://api.zippopotam.us/us/${encodeURIComponent(state.trim())}/${encodeURIComponent(city.trim())}`);
        if (!res.ok) throw new Error("No ZIP codes were found for that state and city. Use the state abbreviation (CA, TX, NY…).");
        const data = await res.json();
        const places = (data.places ?? []) as Record<string, string>[];
        if (!places.length) throw new Error("No ZIP codes were found for that state and city.");
        const found = places.filter(pl => pl.latitude?.trim() && pl.longitude?.trim() && isValidLat(Number(pl.latitude)) && isValidLng(Number(pl.longitude))).map((pl) => ({ name: `${pl["post code"]} — ${pl["place name"]}, ${pl["state abbreviation"]}`, p: { lat: Number(pl.latitude), lng: Number(pl.longitude) }, d: 0 }));
        if (!found.length) throw new Error("The provider returned no usable ZIP coordinates.");
        setHits(found);
        m.show(found);
        setNote("ZIP codes and their centre points come from Zippopotam.us (USPS-derived open data). A ZIP code is a delivery route, not a boundary — the point is its representative centre.");
      } else {
        const name = county.trim().toLowerCase().endsWith("county") ? county.trim() : `${county.trim()} County`;
        const els = await overpass(`[out:json][timeout:90];area["boundary"="administrative"]["name"="${name.replace(/"/g, "")}"]->.a;nwr["addr:postcode"](area.a);out center 800;`);
        const byCode = new Map<string, Hit>();
        for (const e of els) {
          const code = e.tags?.["addr:postcode"];
          const p = elPoint(e);
          if (!code || !p) continue;
          if (!byCode.has(code)) byCode.set(code, { name: code, p, d: 0 });
        }
        const found = [...byCode.values()].sort((a, b) => a.name.localeCompare(b.name));
        if (!found.length) throw new Error(`No postal codes were found inside “${name}”. The county name must match the OpenStreetMap boundary name — try the full name your state uses.`);
        setHits(found.slice(0, 300));
        m.show(found);
        setNote("Up to 800 mapped objects are searched and up to 300 distinct codes shown. County names are not filtered by state and may combine namesakes. The sample is incomplete and is not an official USPS list.");
      }
    } catch (e: any) { setError(e?.message ?? "Search failed."); }
    setBusy(false);
  };

  return (
    <Layout map={m.el} panel={<>
      <Seg ariaLabel="Find by" value={by} onChange={(v) => setBy(v)} options={[{ value: "city", label: "By city" }, { value: "county", label: "By county" }]} />
      {by === "city" ? (
        <div className="grid grid-cols-[90px,1fr] gap-2">
          <Field label="State"><input className="input" value={state} onChange={(e) => setState(e.target.value)} placeholder="CA" /></Field>
          <Field label="City"><input className="input" value={city} onChange={(e) => setCity(e.target.value)} placeholder="Los Angeles" /></Field>
        </div>
      ) : (
        <Field label="County name"><input className="input" value={county} onChange={(e) => setCounty(e.target.value)} placeholder="Los Angeles" /></Field>
      )}
      <button type="button" className="btn btn-primary w-full" onClick={run} disabled={busy}>{busy ? <Spinner label="Collecting ZIP codes…" /> : "Find ZIP codes"}</button>
      {error && <ErrorBox>{error}</ErrorBox>}
      {hits && <HitList hits={hits} empty="" />}
      {note && <p className="text-xs leading-relaxed text-mute">{note}</p>}
    </>} />
  );
}

/* ---------------- Australian postcodes ---------------- */

function AuPostcodesTool() {
  const m = useHitMap();
  const [query, setQuery] = useState("Sydney NSW");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hits, setHits] = useState<Hit[] | null>(null);

  const run = async () => {
    setBusy(true); setError(null); setHits(null);
    try {
      const r = await photonSearch(`${query.trim()}, Australia`, 1);
      if (!r.ok || !r.results.length) throw new Error("That suburb or town was not found. Add the state (e.g. “Fremantle WA”).");
      const c = { lat: r.results[0].lat, lng: r.results[0].lng };
      const els = await overpass(`[out:json][timeout:60];nwr["addr:postcode"](around:15000,${c.lat},${c.lng});out center 800;`);
      const byCode = new Map<string, Hit>();
      for (const e of els) {
        const code = e.tags?.["addr:postcode"];
        const p = elPoint(e);
        if (!code || !p) continue;
        const d = distanceKm(c, p);
        const cur = byCode.get(code);
        if (!cur || d < cur.d) byCode.set(code, { name: `${code} — ${e.tags?.["addr:suburb"] ?? e.tags?.["addr:city"] ?? ""}`.trim(), p, d });
      }
      const found = [...byCode.values()].sort((a, b) => a.d - b.d);
      if (!found.length) throw new Error("No postcodes were collected near that place from OpenStreetMap addresses. Try the nearest larger town.");
      setHits(found);
      m.show(found);
    } catch (e: any) { setError(e?.message ?? "Search failed."); }
    setBusy(false);
  };

  return (
    <Layout map={m.el} panel={<>
      <Field label="Suburb or town + state" hint="Postcodes are collected from mapped addresses within about 9 miles (15 km) of the place.">
        <input className="input" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Fremantle WA" />
      </Field>
      <button type="button" className="btn btn-primary w-full" onClick={run} disabled={busy}>{busy ? <Spinner label="Collecting postcodes…" /> : "Find postcodes"}</button>
      {error && <ErrorBox>{error}</ErrorBox>}
      {hits && <HitList hits={hits} empty="" />}
      <p className="text-xs leading-relaxed text-mute">Australia Post holds the official postcode list. These results come from OpenStreetMap address data, so coverage can be incomplete in rural areas.</p>
    </>} />
  );
}

/* ---------------- nearest postcode from an uploaded list ---------------- */

function NearestListTool() {
  const m = useHitMap();
  const [target, setTarget] = useState<PlaceValue | null>(null);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hits, setHits] = useState<Hit[] | null>(null);

  const run = async () => {
    if (!target) { setError("Set your target point first."); return; }
    const codes = text.split(/[\n,;]+/).map((s) => s.trim()).filter(Boolean);
    if (codes.length > 50) { setError("Use at most 50 codes per run."); return; }
    if (!codes.length) { setError("Paste or upload a list of postcodes first."); return; }
    setBusy(true); setError(null); setHits(null);
    try {
      const seen = new Set<string>();
      const found: Hit[] = [];
      const uk = codes.filter((c) => /^[A-Za-z]{1,2}\d/.test(c));
      const other = codes.filter((c) => !uk.includes(c));
      if (uk.length) {
        // postcodes.io bulk lookup: results come back in the same order,
        // with result = null for codes it does not know.
        const res = await fetch("https://api.postcodes.io/postcodes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ postcodes: uk }),
        });
        if (res.ok) {
          const data = await res.json();
          (data.result ?? []).forEach((row: any, i: number) => {
            const r = row?.result;
            if (!r || !isValidLat(r.latitude) || !isValidLng(r.longitude)) return;
            const p = { lat: r.latitude, lng: r.longitude };
            found.push({ name: uk[i], p, d: distanceKm(target, p) });
          });
        }
      }
      for (const code of other) {
        const key = code.toUpperCase();
        if (seen.has(key)) continue;
        seen.add(key);
        try {
          if (/^\d{5}$/.test(code)) {
            const res = await fetch(`https://api.zippopotam.us/us/${code}`);
            if (!res.ok) continue;
            const d = await res.json();
            const pl = d.places?.[0];
            if (!pl || !pl.latitude?.trim() || !pl.longitude?.trim() || !isValidLat(Number(pl.latitude)) || !isValidLng(Number(pl.longitude))) continue;
            const p = { lat: Number(pl.latitude), lng: Number(pl.longitude) };
            found.push({ name: code, p, d: distanceKm(target, p) });
          }
        } catch { /* skip unknown codes */ }
      }
      if (!found.length) throw new Error("None of those codes could be found. UK postcodes and 5-digit US ZIP codes are supported.");
      found.sort((a, b) => a.d - b.d);
      setHits(found);
      m.show(found);
    } catch (e: any) { setError(e?.message ?? "Search failed."); }
    setBusy(false);
  };

  return (
    <Layout map={m.el} panel={<>
      <PlaceField label="Target point" value={target} onChange={setTarget} />
      <Field label="Your postcode list (paste, or upload a .txt/.csv file)">
        <textarea className="textarea min-h-28 font-mono text-sm" value={text} onChange={(e) => setText(e.target.value)} placeholder={"SW1A 1AA\n90210\nEH1 1YZ"} />
      </Field>
      <FileDropzone accept=".txt,.csv" onFile={async (f) => setText(await f.text())}>
        <span className="text-sm">Drop a list file or click to choose</span>
      </FileDropzone>
      <button type="button" className="btn btn-primary w-full" onClick={run} disabled={busy || !target}>{busy ? <Spinner label="Geocoding your list…" /> : "Find the nearest"}</button>
      {error && <ErrorBox>{error}</ErrorBox>}
      {hits && (
        <div className="space-y-3">
          <Stat label="Nearest resolved postcode" value={hits[0].name} sub={`${fmtDist(hits[0].d, "mi")} from your target (${fmtCoords(hits[0].p)})`} />
          <HitList hits={hits} empty="" />
        </div>
      )}
      <p className="text-xs text-mute">Up to 50 codes are sent to postcodes.io (UK) or Zippopotam (US), not to MapBench. Unresolved codes are omitted, so compare the results with your input. Distances are straight-line between representative points.</p>
    </>} />
  );
}
