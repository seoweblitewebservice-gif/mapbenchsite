"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import type { Map as MLMap, GeoJSONSource } from "maplibre-gl";
import { distanceKm, fmt, isValidLat, isValidLng, type LatLng } from "@/lib/geo";
import { geojsonLineLengthKm } from "@/lib/geojsonLineLength";
import { buildElevationProfile } from "@/lib/gpxProfile";
import { asFeatureCollection, downloadText, escapeXml, geojsonBbox, geojsonToGpx, geojsonToKml } from "@/lib/formats";
import { ErrorBox, FileDropzone, Stat, Spinner } from "@/components/ui";
import { DynamicMap } from "./shared";

// ---------- Parsers (local, never uploaded) ----------

function parseCoordsText(text: string): number[][] {
  if (!text.trim()) return [];
  return text.trim().split(/\s+/).map((t) => {
    const c = t.split(",").map((v) => v.trim() === "" ? NaN : Number(v));
    if (c.length < 2 || !c.every(Number.isFinite) || !isValidLng(c[0]) || !isValidLat(c[1])) throw new Error("KML contains invalid coordinates.");
    return c;
  });
}

export function kmlToGeoJson(text: string): GeoJSON.FeatureCollection {
  const doc = new DOMParser().parseFromString(text, "text/xml");
  if (doc.querySelector("parsererror")) throw new Error("Your file appears to contain invalid KML (XML parse error).");
  const placemarks = Array.from(doc.getElementsByTagName("Placemark"));
  if (!placemarks.length && !doc.getElementsByTagName("kml").length) throw new Error("No KML content found in this file. If it's a .kmz, unzip it first and open the .kml inside.");
  const features: GeoJSON.Feature[] = [];
  const geomFrom = (el: Element): GeoJSON.Geometry | null => {
    const tag = el.tagName;
    if (tag === "Point") {
      const c = parseCoordsText(el.getElementsByTagName("coordinates")[0]?.textContent ?? "");
      return c.length ? { type: "Point", coordinates: c[0] } : null;
    }
    if (tag === "LineString") {
      const c = parseCoordsText(el.getElementsByTagName("coordinates")[0]?.textContent ?? "");
      return c.length > 1 ? { type: "LineString", coordinates: c } : null;
    }
    if (tag === "Polygon") {
      const rings: number[][][] = [];
      const outer = el.getElementsByTagName("outerBoundaryIs")[0]?.getElementsByTagName("coordinates")[0]?.textContent;
      if (outer) rings.push(parseCoordsText(outer));
      Array.from(el.getElementsByTagName("innerBoundaryIs")).forEach((ib) => {
        const t = ib.getElementsByTagName("coordinates")[0]?.textContent;
        if (t) rings.push(parseCoordsText(t));
      });
      return rings.length ? { type: "Polygon", coordinates: rings } : null;
    }
    if (tag === "MultiGeometry") {
      const geoms = Array.from(el.children).map(geomFrom).filter(Boolean) as GeoJSON.Geometry[];
      return geoms.length ? { type: "GeometryCollection", geometries: geoms } : null;
    }
    return null;
  };
  for (const pm of placemarks) {
    const geomEls = Array.from(pm.children).filter((c) => ["Point", "LineString", "Polygon", "MultiGeometry"].includes(c.tagName));
    const geoms = geomEls.map(geomFrom).filter(Boolean) as GeoJSON.Geometry[];
    if (!geoms.length) continue;
    const props: Record<string, unknown> = {};
    props.name = pm.getElementsByTagName("name")[0]?.textContent ?? "";
    props.description = pm.getElementsByTagName("description")[0]?.textContent ?? "";
    Array.from(pm.getElementsByTagName("Data")).forEach((d) => {
      props[d.getAttribute("name") ?? "data"] = d.getElementsByTagName("value")[0]?.textContent ?? "";
    });
    const geometry = geoms.length === 1 ? geoms[0] : ({ type: "GeometryCollection", geometries: geoms } as GeoJSON.Geometry);
    features.push({ type: "Feature", properties: props, geometry });
  }
  return { type: "FeatureCollection", features };
}

interface GpxStats { distanceKm: number; gain: number; loss: number; minEle: number | null; maxEle: number | null; durationS: number | null; points: number }

export function gpxToGeoJson(text: string): { fc: GeoJSON.FeatureCollection; stats: GpxStats } {
  const doc = new DOMParser().parseFromString(text, "text/xml");
  if (doc.querySelector("parsererror")) throw new Error("Your file appears to contain invalid GPX (XML parse error).");
  if (!doc.getElementsByTagName("gpx").length) throw new Error("No GPX content found in this file.");
  const features: GeoJSON.Feature[] = [];
  const stats: GpxStats = { distanceKm: 0, gain: 0, loss: 0, minEle: null, maxEle: null, durationS: null, points: 0 };
  let minTime = Infinity, maxTime = -Infinity, timeCount = 0;

  Array.from(doc.getElementsByTagName("wpt")).forEach((w) => {
    const lat = parseFloat(w.getAttribute("lat") ?? ""), lon = parseFloat(w.getAttribute("lon") ?? "");
    if (!isValidLat(lat) || !isValidLng(lon)) return;
    const ele = parseFloat(w.getElementsByTagName("ele")[0]?.textContent ?? "");
    features.push({
      type: "Feature",
      properties: { name: w.getElementsByTagName("name")[0]?.textContent ?? "Waypoint", kind: "waypoint", ...(Number.isFinite(ele) ? { ele } : {}) },
      geometry: { type: "Point", coordinates: Number.isFinite(ele) ? [lon, lat, ele] : [lon, lat] },
    });
  });

  const processPts = (pts: Element[], asRoute: boolean) => {
    const lines: number[][][] = [];
    let coords: number[][] = [];
    let prev: LatLng | null = null, prevEle: number | null = null;
    for (const p of pts) {
      const lat = parseFloat(p.getAttribute("lat") ?? ""), lon = parseFloat(p.getAttribute("lon") ?? "");
      if (!isValidLat(lat) || !isValidLng(lon)) { if (coords.length > 1) lines.push(coords); coords = []; prev = null; prevEle = null; continue; }
      const eleT = p.getElementsByTagName("ele")[0]?.textContent;
      const ele = eleT !== undefined && eleT !== "" ? parseFloat(eleT) : NaN;
      const timeT = p.getElementsByTagName("time")[0]?.textContent;
      const time = timeT ? new Date(timeT) : null;
      if (time && !isNaN(time.getTime())) { const t = time.getTime(); minTime = Math.min(minTime, t); maxTime = Math.max(maxTime, t); timeCount++; }
      coords.push(Number.isFinite(ele) ? [lon, lat, ele] : [lon, lat]);
      const cur = { lat, lng: lon };
      if (prev && !asRoute) stats.distanceKm += distanceKm(prev, cur);
      if (asRoute && prev) stats.distanceKm += distanceKm(prev, cur);
      if (Number.isFinite(ele)) {
        stats.points++;
        if (stats.minEle === null || ele < stats.minEle) stats.minEle = ele;
        if (stats.maxEle === null || ele > stats.maxEle) stats.maxEle = ele;
        if (prevEle !== null) {
          const d = ele - prevEle;
          if (d > 0) stats.gain += d; else stats.loss += -d;
        }
        prevEle = ele;
      }
      if (!Number.isFinite(ele)) prevEle = null;
      prev = cur;
    }
    if (coords.length > 1) lines.push(coords);
    return lines;
  };

  Array.from(doc.getElementsByTagName("trk")).forEach((trk) => {
    const name = trk.getElementsByTagName("name")[0]?.textContent ?? "Track";
    const segs = Array.from(trk.getElementsByTagName("trkseg"));
    const lines = segs.flatMap((s) => processPts(Array.from(s.getElementsByTagName("trkpt")), false));
    if (!lines.length) return;
    features.push({
      type: "Feature",
      properties: { name, kind: "track" },
      geometry: lines.length === 1 ? { type: "LineString", coordinates: lines[0] } : { type: "MultiLineString", coordinates: lines },
    });
  });
  Array.from(doc.getElementsByTagName("rte")).forEach((rte) => {
    const name = rte.getElementsByTagName("name")[0]?.textContent ?? "Route";
    const lines = processPts(Array.from(rte.getElementsByTagName("rtept")), true);
    if (lines.length) features.push({ type: "Feature", properties: { name, kind: "route" }, geometry: lines.length === 1 ? { type: "LineString", coordinates: lines[0] } : { type: "MultiLineString", coordinates: lines } });
  });

  if (timeCount >= 2) stats.durationS = (maxTime - minTime) / 1000;
  return { fc: { type: "FeatureCollection", features }, stats };
}

// ---------- Elevation chart ----------
function ElevationChart({ segments }: { segments: { dist: number; ele: number }[][] }) {
  const pts = segments.flat();
  if (pts.length < 2) return null;
  const w = 560, h = 130, pad = 6;
  let min = Infinity, max = -Infinity;
  for (const p of pts) { min = Math.min(min, p.ele); max = Math.max(max, p.ele); }
  const span = Math.max(1, max - min), total = pts[pts.length - 1].dist;
  const x = (d: number) => pad + (total > 0 ? d / total : 0) * (w - pad * 2);
  const y = (e: number) => h - pad - ((e - min) / span) * (h - pad * 2);
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full" role="img" aria-label="Elevation profile by cumulative distance; gaps are not connected">
      {segments.map((segment, i) => <path key={i} d={segment.map((p, j) => `${j ? "L" : "M"}${x(p.dist).toFixed(1)},${y(p.ele).toFixed(1)}`).join(" ")} fill="none" stroke="var(--sf-brand)" strokeWidth="2" />)}
    </svg>
  );
}

// ---------- Main component ----------

type LoadState =
  | { status: "empty" }
  | { status: "error"; message: string }
  | { status: "ok"; fc: GeoJSON.FeatureCollection; sourceName: string; gpx?: GpxStats };

export default function FileViewer({ params }: { params?: Record<string, unknown> }) {
  const format = (params?.format as string) ?? "geojson";
  const [state, setState] = useState<LoadState>({ status: "empty" });
  const [pasting, setPasting] = useState(false);
  const [pasteText, setPasteText] = useState("");
  const [selected, setSelected] = useState<number | null>(null);
  const mapRef = useRef<MLMap | null>(null);
  const libRef = useRef<any>(null);
  const [mapReady, setMapReady] = useState(false);

  const loadText = (text: string, sourceName: string) => {
    try {
      if (format === "kml") {
        const fc = kmlToGeoJson(text);
        if (!fc.features.length) throw new Error("This KML file contains no visible placemarks.");
        setState({ status: "ok", fc, sourceName });
      } else if (format === "gpx") {
        const { fc, stats } = gpxToGeoJson(text);
        if (!fc.features.length) throw new Error("This GPX file contains no waypoints, tracks or routes.");
        setState({ status: "ok", fc, sourceName, gpx: stats });
      } else {
        let json: any;
        try { json = JSON.parse(text); }
        catch { throw new Error("Your file is not valid JSON — check for trailing commas or unquoted keys."); }
        const fc = asFeatureCollection(json);
        if (!fc.features.length) throw new Error("This GeoJSON contains zero features.");
        setState({ status: "ok", fc, sourceName });
      }
      setSelected(null);
    } catch (e: any) {
      setState({ status: "error", message: e?.message ?? "The file could not be parsed." });
    }
  };

  const onFile = (f: File) => {
    const reader = new FileReader();
    reader.onload = () => loadText(String(reader.result ?? ""), f.name);
    reader.onerror = () => setState({ status: "error", message: "The file could not be read from disk." });
    reader.readAsText(f);
  };

  // Render to map
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady || state.status !== "ok") return;
    const pts: GeoJSON.Feature[] = [], lines: GeoJSON.Feature[] = [], polys: GeoJSON.Feature[] = [];
    const push = (f: GeoJSON.Feature, g: any) => {
      if (!g) return;
      if (g.type === "Point" || g.type === "MultiPoint") pts.push({ ...f, geometry: g });
      else if (g.type.includes("Line")) lines.push({ ...f, geometry: g });
      else if (g.type.includes("Polygon")) polys.push({ ...f, geometry: g });
      else if (g.type === "GeometryCollection") g.geometries?.forEach((gg: any) => push(f, gg));
    };
    state.fc.features.forEach((f) => push(f, f.geometry));
    (map.getSource("fv-pts") as GeoJSONSource | undefined)?.setData({ type: "FeatureCollection", features: pts });
    (map.getSource("fv-lines") as GeoJSONSource | undefined)?.setData({ type: "FeatureCollection", features: lines });
    (map.getSource("fv-polys") as GeoJSONSource | undefined)?.setData({ type: "FeatureCollection", features: polys });
    const bbox = geojsonBbox(state.fc);
    if (bbox) map.fitBounds([[bbox[0], bbox[1]], [bbox[2], bbox[3]]], { padding: 55, maxZoom: 15, duration: 600 });
  }, [state, mapReady]);

  const showFeature = (i: number) => {
    setSelected(i);
    const map = mapRef.current, lib = libRef.current;
    const f = state.status === "ok" ? state.fc.features[i] : null;
    if (!map || !lib || !f) return;
    const g: any = f.geometry;
    const firstCoord = (gg: any): number[] | null => {
      if (!gg) return null;
      if (typeof gg.coordinates?.[0] === "number") return gg.coordinates;
      if (gg.coordinates) return firstCoord({ coordinates: gg.coordinates[0] } as any);
      if (gg.geometries) return firstCoord(gg.geometries[0]);
      return null;
    };
    const c = firstCoord(g);
    if (!c) return;
    const props = (f.properties ?? {}) as Record<string, unknown>;
    const rows = Object.entries(props).slice(0, 10).map(([k, v]) => `<tr><td style="padding:1px 8px 1px 0;color:var(--sf-mute)">${escapeXml(String(k))}</td><td>${escapeXml(String(v ?? "")).slice(0, 120)}</td></tr>`).join("");
    new lib.Popup({ closeButton: true, maxWidth: "280px" })
      .setLngLat([c[0], c[1]])
      .setHTML(`<div style="max-height:180px;overflow:auto"><table style="font-size:12px">${rows || "<tr><td>No properties</td></tr>"}</table></div>`)
      .addTo(map);
    map.panTo([c[0], c[1]], { duration: 400 });
  };

  const counts = useMemo(() => {
    if (state.status !== "ok") return null;
    const c = { Point: 0, Line: 0, Polygon: 0, other: 0 };
    const visit = (g: any) => {
      if (!g) return;
      if (g.type?.includes("Point")) c.Point++;
      else if (g.type?.includes("Line")) c.Line++;
      else if (g.type?.includes("Polygon")) c.Polygon++;
      else if (g.type === "GeometryCollection") g.geometries?.forEach(visit);
      else c.other++;
    };
    state.fc.features.forEach((f) => visit(f.geometry));
    return c;
  }, [state]);

  const gpxProfile = useMemo(() => {
    if (state.status !== "ok" || !state.gpx) return null;
    return buildElevationProfile(state.fc);
  }, [state]);

  const exportFc = state.status === "ok" ? state.fc : null;
  const lineLength = exportFc && format === "kml" ? geojsonLineLengthKm(exportFc) : null;

  return (
    <div className="space-y-4">
      {state.status !== "ok" && (
        <FileDropzone onFile={onFile} accept={format === "geojson" ? ".geojson,.json,application/geo+json,application/json" : `.${format}`}>
          {format === "geojson" && (
            <div className="mt-3 text-center" onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => setPasting((v) => !v)}>{pasting ? "Hide paste box" : "…or paste GeoJSON text"}</button>
              {pasting && (
                <div className="mt-2">
                  <textarea className="textarea font-mono text-xs" rows={6} value={pasteText} onChange={(e) => setPasteText(e.target.value)} placeholder='{"type":"FeatureCollection","features":[…]}' />
                  <button type="button" className="btn btn-primary btn-sm mt-2" onClick={() => loadText(pasteText, "pasted.geojson")}>Load pasted GeoJSON</button>
                </div>
              )}
            </div>
          )}
        </FileDropzone>
      )}
      {state.status === "error" && <ErrorBox>{state.message}</ErrorBox>}
      {state.status === "ok" && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="chip chip-brand">✓ {state.sourceName}</span>
          <span className="chip">{state.fc.features.length} feature{state.fc.features.length > 1 ? "s" : ""}</span>
          {counts && <span className="chip">{counts.Point} points · {counts.Line} lines · {counts.Polygon} polygons</span>}
          <button type="button" className="btn btn-ghost btn-sm ml-auto" onClick={() => setState({ status: "empty" })}>Load another file</button>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-[1fr,340px]">
        <DynamicMap center={{ lat: 25, lng: 10 }} zoom={1.6} className="tall" onReady={(map, lib) => {
          mapRef.current = map; libRef.current = lib;
          map.addSource("fv-polys", { type: "geojson", data: { type: "FeatureCollection", features: [] } });
          map.addSource("fv-lines", { type: "geojson", data: { type: "FeatureCollection", features: [] } });
          map.addSource("fv-pts", { type: "geojson", data: { type: "FeatureCollection", features: [] } });
          map.addLayer({ id: "fv-polys-f", type: "fill", source: "fv-polys", paint: { "fill-color": "#8a4f9e", "fill-opacity": 0.2 } });
          map.addLayer({ id: "fv-polys-l", type: "line", source: "fv-polys", paint: { "line-color": "#8a4f9e", "line-width": 1.5 } });
          map.addLayer({ id: "fv-lines", type: "line", source: "fv-lines", paint: { "line-color": "#d95d32", "line-width": 3 } });
          map.addLayer({ id: "fv-pts", type: "circle", source: "fv-pts", paint: { "circle-color": "#1d6e63", "circle-radius": 6, "circle-stroke-color": "#fff", "circle-stroke-width": 2 } });
          setMapReady(true);
        }} />
        <div className="space-y-3">
          {lineLength !== null && <Stat label="LineString length" value={`${fmt(lineLength)} km`} sub={`${fmt(lineLength * 0.621371)} mi · spherical segments; polygons excluded`} />}
          {state.status === "ok" && state.gpx && (
            <div className="grid grid-cols-2 gap-2">
              <Stat label="Distance" value={`${fmt(state.gpx.distanceKm)} km`} sub={`${fmt(state.gpx.distanceKm * 0.621371)} mi`} />
              <Stat label="Duration" value={state.gpx.durationS ? `${Math.floor(state.gpx.durationS / 3600)}h ${String(Math.round((state.gpx.durationS % 3600) / 60)).padStart(2, "0")}m` : "no timestamps"} />
              <Stat label="Elevation gain" value={state.gpx.minEle !== null ? `+${Math.round(state.gpx.gain)} m` : "no elevation"} />
              <Stat label="Elevation loss" value={state.gpx.minEle !== null ? `−${Math.round(state.gpx.loss)} m` : "—"} />
              <Stat label="Min elevation" value={state.gpx.minEle !== null ? `${Math.round(state.gpx.minEle)} m` : "—"} />
              <Stat label="Max elevation" value={state.gpx.maxEle !== null ? `${Math.round(state.gpx.maxEle)} m` : "—"} />
            </div>
          )}
          {state.status === "ok" && gpxProfile && (
            <div className="card p-3">
              <div className="label">Elevation profile</div>
              <ElevationChart segments={gpxProfile} />
              <p className="text-sm text-slate-600">Horizontal position shows cumulative distance within recorded segments; gaps and missing elevations are not connected.</p>
            </div>
          )}
          {state.status === "ok" && (
            <div className="card p-3">
              <div className="label">Features (click to inspect)</div>
              <ul className="max-h-64 space-y-1 overflow-y-auto">
                {state.fc.features.slice(0, 200).map((f, i) => {
                  const p = (f.properties ?? {}) as Record<string, unknown>;
                  return (
                    <li key={i}>
                      <button
                        type="button"
                        className={`w-full truncate rounded-md px-2 py-1.5 text-left text-sm ${selected === i ? "bg-brand-soft font-semibold" : "hover:bg-well"}`}
                        onClick={() => showFeature(i)}
                      >
                        {String(p.name || p.title || p.Name || `Feature ${i + 1}`)}
                        <span className="ml-1 text-xs text-mute">· {(f.geometry as any)?.type}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
              {state.fc.features.length > 200 && <p className="mt-1 text-xs text-mute">Showing first 200 of {state.fc.features.length}.</p>}
            </div>
          )}
          {exportFc && (
            <div className="card space-y-2 p-3">
              <div className="label">Export / convert</div>
              <div className="flex flex-wrap gap-2">
                <button type="button" className="btn btn-primary btn-sm" onClick={() => downloadText("mapbench.geojson", JSON.stringify(exportFc, null, 2), "application/geo+json")}>GeoJSON</button>
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => downloadText("mapbench.kml", geojsonToKml(exportFc, state.status === "ok" ? state.sourceName : "export"), "application/vnd.google-earth.kml+xml")}>KML</button>
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => downloadText("mapbench.gpx", geojsonToGpx(exportFc, state.status === "ok" ? state.sourceName : "export"), "application/gpx+xml")}>GPX</button>
                {format === "csv-note" && null}
              </div>
              <p className="text-xs text-mute">Parsing and conversion run locally. Export can omit styles, timestamps, extensions or geometry; keep the original and inspect the result. Map tiles are requested over the network and can reveal the viewed area.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
