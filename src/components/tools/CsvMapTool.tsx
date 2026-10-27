"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import type { Map as MLMap, GeoJSONSource } from "maplibre-gl";
import { guessLatLngCols, parseCsv, toCsv, downloadText, geojsonToKml, escapeXml, type ParsedCsv } from "@/lib/formats";
import { ErrorBox, FileDropzone, Field } from "@/components/ui";
import { DynamicMap, PALETTE } from "./shared";

const MAX_POINTS = 50000;

export default function CsvMapTool({ params }: { params?: Record<string, unknown> }) {
  const heatmap = params?.mode === "heatmap";
  const [data, setData] = useState<ParsedCsv | null>(null);
  const [latCol, setLatCol] = useState(-1);
  const [lngCol, setLngCol] = useState(-1);
  const [catCol, setCatCol] = useState(-1);
  const [labelCol, setLabelCol] = useState(-1);
  const [pasting, setPasting] = useState(false);
  const [pasteText, setPasteText] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const mapRef = useRef<MLMap | null>(null);
  const libRef = useRef<any>(null);
  const [ready, setReady] = useState(false);

  const ingest = (text: string) => {
    setErr(null);
    const parsed = parseCsv(text);
    if (!parsed.headers.length || !parsed.rows.length) {
      setErr("No rows found. Make sure the first line contains column headers.");
      return;
    }
    const guess = guessLatLngCols(parsed.headers);
    setData(parsed);
    setLatCol(guess.latCol);
    setLngCol(guess.lngCol);
    setCatCol(-1);
    setLabelCol(parsed.headers.findIndex((h) => /name|label|title/i.test(h)));
  };

  const points = useMemo(() => {
    if (!data || latCol < 0 || lngCol < 0) return [];
    const out: { lat: number; lng: number; label: string; cat: string; row: string[] }[] = [];
    for (const row of data.rows) {
      if (out.length >= MAX_POINTS) break;
      const lat = parseFloat(row[latCol]), lng = parseFloat(row[lngCol]);
      if (Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180) {
        out.push({ lat, lng, label: labelCol >= 0 ? row[labelCol] ?? "" : "", cat: catCol >= 0 ? row[catCol] ?? "" : "", row });
      }
    }
    return out;
  }, [data, latCol, lngCol, catCol, labelCol]);

  const categories = useMemo(() => {
    if (catCol < 0) return [];
    const s = new Set<string>();
    points.forEach((p) => p.cat && s.add(p.cat));
    return [...s].slice(0, 10);
  }, [points, catCol]);

  // Render
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready || !data) return;
    const features: GeoJSON.Feature[] = points.map((p, i) => ({
      type: "Feature",
      properties: {
        id: i, label: p.label, cat: p.cat,
        ...Object.fromEntries(data.headers.slice(0, 10).map((h, ci) => [`c${ci}`, String(p.row[ci] ?? "")])),
      },
      geometry: { type: "Point", coordinates: [p.lng, p.lat] },
    }));
    const src = map.getSource("csv") as GeoJSONSource | undefined;
    src?.setData({ type: "FeatureCollection", features });
    if (features.length) {
      const lngs = points.map((p) => p.lng), lats = points.map((p) => p.lat);
      map.fitBounds([[Math.min(...lngs), Math.min(...lats)], [Math.max(...lngs), Math.max(...lats)]], { padding: 55, maxZoom: 13, duration: 600 });
    }
  }, [points, ready, data]);

  const fc = (): GeoJSON.FeatureCollection => ({
    type: "FeatureCollection",
    features: points.map((p) => ({
      type: "Feature",
      properties: { name: p.label, ...(p.cat ? { category: p.cat } : {}), ...(data ? Object.fromEntries(data.headers.map((h, i) => [h, p.row[i]])) : {}) },
      geometry: { type: "Point", coordinates: [p.lng, p.lat] },
    })),
  });

  return (
    <div className="space-y-4">
      {heatmap && <p className="text-sm leading-7 text-mute">Heat intensity represents nearby point concentration on screen, not population or a normalized geographic rate. Zoom level changes the apparent pattern; exported files contain the original points, not a density raster.</p>}
      {!data && (
        <FileDropzone onFile={(f) => f.text().then(ingest)} accept=".csv,text/csv">
          <div className="mt-3 text-center">
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setPasting((v) => !v)}>{pasting ? "Hide paste box" : "…or paste CSV text"}</button>
            {pasting && (
              <div className="mt-2">
                <textarea className="textarea font-mono text-xs" rows={6} value={pasteText} onChange={(e) => setPasteText(e.target.value)} placeholder={"name,category,lat,lng\nHQ,office,40.7128,-74.006\n…"} />
                <button type="button" className="btn btn-primary btn-sm mt-2" onClick={() => ingest(pasteText)}>Map pasted CSV</button>
              </div>
            )}
          </div>
        </FileDropzone>
      )}
      {err && <ErrorBox>{err}</ErrorBox>}

      {data && (
        <>
          <div className="card grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-4">
            <Field label="Latitude column">
              <select className="select" value={latCol} onChange={(e) => setLatCol(parseInt(e.target.value))}>
                <option value={-1}>— choose —</option>
                {data.headers.map((h, i) => <option key={i} value={i}>{h}</option>)}
              </select>
            </Field>
            <Field label="Longitude column">
              <select className="select" value={lngCol} onChange={(e) => setLngCol(parseInt(e.target.value))}>
                <option value={-1}>— choose —</option>
                {data.headers.map((h, i) => <option key={i} value={i}>{h}</option>)}
              </select>
            </Field>
            <Field label="Label column (optional)">
              <select className="select" value={labelCol} onChange={(e) => setLabelCol(parseInt(e.target.value))}>
                <option value={-1}>None</option>
                {data.headers.map((h, i) => <option key={i} value={i}>{h}</option>)}
              </select>
            </Field>
            <Field label="Colour by (optional)">
              <select className="select" value={catCol} onChange={(e) => setCatCol(parseInt(e.target.value))}>
                <option value={-1}>Single colour</option>
                {data.headers.map((h, i) => <option key={i} value={i}>{h}</option>)}
              </select>
            </Field>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="chip chip-brand">{points.length.toLocaleString()} of {data.rows.length.toLocaleString()} rows mapped</span>
            {points.length < data.rows.length && <span className="chip chip-ember">{(data.rows.length - points.length).toLocaleString()} rows skipped (invalid coordinates)</span>}
            {categories.length > 0 && <span className="chip">{categories.length} categories</span>}
            <div className="ml-auto flex flex-wrap gap-2">
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => { setData(null); setErr(null); }}>Load another file</button>
              <button type="button" className="btn btn-primary btn-sm" disabled={!points.length} onClick={() => downloadText("mapforge-points.geojson", JSON.stringify(fc(), null, 2), "application/geo+json")}>Export GeoJSON</button>
              <button type="button" className="btn btn-ghost btn-sm" disabled={!points.length} onClick={() => downloadText("mapforge-points.kml", geojsonToKml(fc(), "CSV map"), "application/vnd.google-earth.kml+xml")}>KML</button>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => downloadText("mapforge.csv", toCsv(data.headers, data.rows), "text/csv")}>CSV</button>
            </div>
          </div>
        </>
      )}

      <DynamicMap center={{ lat: 25, lng: 10 }} zoom={1.6} className="tall" onReady={(map, lib) => {
        mapRef.current = map; libRef.current = lib;
        map.addSource("csv", {
          type: "geojson", data: { type: "FeatureCollection", features: [] },
          cluster: !heatmap, clusterMaxZoom: 14, clusterRadius: 46,
        });
        if (heatmap) map.addLayer({
          id: "csv-heat", type: "heatmap", source: "csv",
          paint: {
            "heatmap-weight": 1, "heatmap-intensity": 1,
            "heatmap-radius": 28, "heatmap-opacity": 0.8,
            "heatmap-color": ["interpolate", ["linear"], ["heatmap-density"], 0, "rgba(0,0,0,0)", 0.2, "#67b7dc", 0.5, "#ffffbf", 0.8, "#f46d43", 1, "#a50026"],
          },
        });
        map.addLayer({
          id: "csv-clusters", type: "circle", source: "csv", filter: ["has", "point_count"],
          paint: {
            "circle-color": ["step", ["get", "point_count"], "#479e92", 50, "#1d6e63", 200, "#14584f"],
            "circle-radius": ["step", ["get", "point_count"], 16, 50, 22, 200, 28],
            "circle-stroke-color": "#fff", "circle-stroke-width": 2,
          },
        });
        map.addLayer({
          id: "csv-cluster-count", type: "symbol", source: "csv", filter: ["has", "point_count"],
          layout: { "text-field": ["get", "point_count_abbreviated"], "text-size": 12, "text-font": ["Noto Sans Regular"] },
          paint: { "text-color": "#ffffff" },
        });
        map.addLayer({
          id: "csv-points", type: "circle", source: "csv", layout: { visibility: heatmap ? "none" : "visible" }, filter: ["!", ["has", "point_count"]],
          paint: {
            "circle-color": categories.length
              ? (["match", ["get", "cat"], ...categories.flatMap((c, i) => [c, PALETTE[i % PALETTE.length]]), "#1d6e63"] as any)
              : "#1d6e63",
            "circle-radius": 6, "circle-stroke-color": "#fff", "circle-stroke-width": 1.5,
          },
        });
        map.on("click", "csv-clusters", (e: any) => {
          const f = e.features?.[0];
          if (f) map.flyTo({ center: e.lngLat, zoom: map.getZoom() + 2, essential: true });
        });
        map.on("click", "csv-points", (e: any) => {
          const f = e.features?.[0];
          if (!f) return;
          const p = f.properties;
          const rows = data?.headers.slice(0, 10).map((h, ci) => `<tr><td style="padding:1px 8px 1px 0;color:var(--sf-mute)">${escapeXml(h)}</td><td>${escapeXml(String(p[`c${ci}`] ?? "")).slice(0, 100)}</td></tr>`).join("") ?? "";
          new lib.Popup({ maxWidth: "280px" }).setLngLat(e.lngLat).setHTML(`<div style="max-height:200px;overflow:auto"><strong>${escapeXml(String(p.label || ""))}</strong><table style="font-size:12px;margin-top:4px">${rows}</table></div>`).addTo(map);
        });
        setReady(true);
      }} />
      {categories.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {categories.map((c, i) => (
            <span key={c} className="chip"><span className="h-2.5 w-2.5 rounded-full" style={{ background: PALETTE[i % PALETTE.length] }} />{c}</span>
          ))}
        </div>
      )}
    </div>
  );
}
