"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import type { Map as MLMap, GeoJSONSource } from "maplibre-gl";
import { feature } from "topojson-client";
import { geoArea, geoIdentity, geoPath } from "d3-geo";
import {
  distanceKm, ringAreaKm2, fmt, fmtDist, EARTH_R_KM,
  type LatLng, type UnitKey,
} from "@/lib/geo";
import { downloadText, toCsv } from "@/lib/formats";
import { Field, Spinner, ErrorBox, CopyBtn, Seg } from "@/components/ui";
import { DynamicMap, PALETTE } from "./shared";

type ToolProps = { params?: Record<string, unknown> };

// ---------- Shared atlas loaders ----------
// Dynamic import keeps the bundle lean; jsdelivr is the fallback so a missing
// package file can never break the build.

function topoToFc(mod: unknown, objectName: string): GeoJSON.FeatureCollection {
  const topo = (mod as { default?: unknown }).default ?? mod;
  const t = topo as { objects: Record<string, unknown> };
  return feature(t as any, t.objects[objectName] as any) as unknown as GeoJSON.FeatureCollection;
}

async function loadWorldCountries(): Promise<GeoJSON.FeatureCollection> {
  try {
    const mod = await import("world-atlas/countries-110m.json");
    return topoToFc(mod, "countries");
  } catch {
    const res = await fetch("https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json");
    if (!res.ok) throw new Error("World map data failed to load. Check your connection and retry.");
    return topoToFc(await res.json(), "countries");
  }
}

async function loadUsCounties(): Promise<GeoJSON.FeatureCollection> {
  try {
    const mod = await import("us-atlas/counties-10m.json");
    return topoToFc(mod, "counties");
  } catch {
    const res = await fetch("https://cdn.jsdelivr.net/npm/us-atlas@3/counties-10m.json");
    if (!res.ok) throw new Error("US county boundary data failed to load. Check your connection and retry.");
    return topoToFc(await res.json(), "counties");
  }
}

function emptyFc(): GeoJSON.FeatureCollection {
  return { type: "FeatureCollection", features: [] };
}

function countryName(f: GeoJSON.Feature): string {
  const p = f.properties as { name?: string } | null;
  return p?.name ?? "Unknown region";
}

function countryKey(f: GeoJSON.Feature): string {
  return String(f.id ?? countryName(f));
}

function lineLengthKm(pts: LatLng[]): number {
  let d = 0;
  for (let i = 1; i < pts.length; i++) d += distanceKm(pts[i - 1], pts[i]);
  return d;
}

function polygonStats(pts: LatLng[]): { areaKm2: number; periKm: number } {
  const ring = pts.map((p): [number, number] => [p.lng, p.lat]);
  const areaKm2 = ringAreaKm2(ring);
  let periKm = 0;
  for (let i = 0; i < pts.length; i++) periKm += distanceKm(pts[i], pts[(i + 1) % pts.length]);
  return { areaKm2, periKm };
}

// =====================================================================
// 1. Map drawer — click to draw markers, lines, polygons, labels
// =====================================================================

type DrawMode = "marker" | "line" | "polygon" | "label";

interface DrawnShape {
  id: number;
  kind: "marker" | "line" | "polygon";
  pts: LatLng[];
  label: string;
  color: string;
}

const DRAW_MODES: { value: DrawMode; label: string }[] = [
  { value: "marker", label: "Marker" },
  { value: "line", label: "Line" },
  { value: "polygon", label: "Polygon" },
  { value: "label", label: "Label" },
];

export function MapDrawerTool({ params }: ToolProps) {
  void params;
  const [mode, setMode] = useState<DrawMode>("marker");
  const [shapes, setShapes] = useState<DrawnShape[]>([]);
  const [draft, setDraft] = useState<LatLng[]>([]);
  const [labelText, setLabelText] = useState("");
  const [colorIdx, setColorIdx] = useState(0);
  const [unit, setUnit] = useState<UnitKey>("mi");
  const mapRef = useRef<MLMap | null>(null);
  const nextId = useRef(1);
  const modeRef = useRef<DrawMode>("marker");
  const labelRef = useRef("");
  const colorRef = useRef(PALETTE[0]);
  const draftRef = useRef<LatLng[]>([]);

  useEffect(() => {
    modeRef.current = mode;
    labelRef.current = labelText;
    colorRef.current = PALETTE[colorIdx % PALETTE.length];
  }, [mode, labelText, colorIdx]);
  useEffect(() => { draftRef.current = draft; }, [draft]);

  const finishDraft = () => {
    const d = draftRef.current;
    const m = modeRef.current;
    const need = m === "polygon" ? 3 : 2;
    if (d.length < need) return;
    setShapes((s) => [...s, {
      id: nextId.current++,
      kind: m === "polygon" ? "polygon" : "line",
      pts: d,
      label: labelRef.current.trim(),
      color: colorRef.current,
    }]);
    setDraft([]);
  };

  const handleMapClick = (pt: LatLng) => {
    const m = modeRef.current;
    if (m === "marker" || m === "label") {
      setShapes((s) => [...s, {
        id: nextId.current++,
        kind: "marker",
        pts: [pt],
        label: labelRef.current.trim(),
        color: colorRef.current,
      }]);
      return;
    }
    setDraft((d) => {
      const last = d[d.length - 1];
      if (last && Math.abs(last.lat - pt.lat) < 1e-9 && Math.abs(last.lng - pt.lng) < 1e-9) return d;
      return [...d, pt];
    });
  };

  const undo = () => {
    if (draft.length > 0) setDraft((d) => d.slice(0, -1));
    else setShapes((s) => s.slice(0, -1));
  };

  const shapesFc = useMemo<GeoJSON.FeatureCollection>(() => ({
    type: "FeatureCollection",
    features: shapes.map((s): GeoJSON.Feature => {
      const coords = s.pts.map((p): [number, number] => [p.lng, p.lat]);
      const props = { color: s.color, label: s.label };
      if (s.kind === "marker") {
        return { type: "Feature", properties: props, geometry: { type: "Point", coordinates: coords[0] } };
      }
      if (s.kind === "line") {
        return { type: "Feature", properties: props, geometry: { type: "LineString", coordinates: coords } };
      }
      return { type: "Feature", properties: props, geometry: { type: "Polygon", coordinates: [[...coords, coords[0]]] } };
    }),
  }), [shapes]);

  const draftFc = useMemo<GeoJSON.FeatureCollection>(() => ({
    type: "FeatureCollection",
    features: draft.length >= 2
      ? [{ type: "Feature", properties: {}, geometry: { type: "LineString", coordinates: draft.map((p): [number, number] => [p.lng, p.lat]) } }]
      : draft.map((p): GeoJSON.Feature => ({ type: "Feature", properties: {}, geometry: { type: "Point", coordinates: [p.lng, p.lat] } })),
  }), [draft]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    (map.getSource("draw-shapes") as GeoJSONSource | undefined)?.setData(shapesFc);
    (map.getSource("draw-draft") as GeoJSONSource | undefined)?.setData(draftFc);
  }, [shapesFc, draftFc]);

  const exportGeoJson = () => {
    downloadText("mapbench-drawing.geojson", JSON.stringify(shapesFc, null, 2), "application/geo+json");
  };

  const shapeSummary = (s: DrawnShape): string => {
    if (s.kind === "line") return `Length ${fmtDist(lineLengthKm(s.pts), unit)}`;
    if (s.kind === "polygon") {
      const { areaKm2, periKm } = polygonStats(s.pts);
      const a = unit === "mi" ? areaKm2 * 0.386102 : areaKm2;
      const aLabel = unit === "mi" ? "mi²" : "km²";
      return `Area ${fmt(a)} ${aLabel} · Perimeter ${fmtDist(periKm, unit)}`;
    }
    return s.pts.length ? `${s.pts[0].lat.toFixed(4)}, ${s.pts[0].lng.toFixed(4)}` : "";
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[380px,1fr]">
      <div className="card order-2 space-y-4 p-4 lg:order-1">
        <div>
          <span className="label">Draw mode</span>
          <Seg options={DRAW_MODES} value={mode} onChange={(v) => { setMode(v); setDraft([]); }} ariaLabel="Draw mode" />
        </div>
        {(mode === "marker" || mode === "label") && (
          <Field label={mode === "label" ? "Label text" : "Marker label (optional)"}>
            <input className="input" value={labelText} onChange={(e) => setLabelText(e.target.value)} placeholder={mode === "label" ? "e.g. Base camp" : "e.g. Site A"} maxLength={60} />
          </Field>
        )}
        <div>
          <span className="label">Color</span>
          <div className="flex flex-wrap gap-1.5">
            {PALETTE.map((c, i) => (
              <button
                key={c} type="button" aria-label={`Color ${i + 1}`}
                onClick={() => setColorIdx(i)}
                className={`h-7 w-7 rounded-full border-2 ${i === colorIdx ? "border-ink" : "border-transparent"}`}
                style={{ background: c }}
              />
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="label !mb-0">Units</span>
          <Seg options={[{ value: "mi" as UnitKey, label: "Miles" }, { value: "km" as UnitKey, label: "Kilometers" }]} value={unit} onChange={setUnit} ariaLabel="Units" />
        </div>
        <p className="text-xs text-mute">
          {mode === "marker" && "Click the map to drop a marker."}
          {mode === "label" && "Click the map to place a text label."}
          {mode === "line" && "Click to add points along the line. Double-click or press Finish when done."}
          {mode === "polygon" && "Click to add corners of the polygon. Double-click or press Finish to close it."}
        </p>
        <div className="flex flex-wrap gap-2">
          {(mode === "line" || mode === "polygon") && draft.length >= (mode === "polygon" ? 3 : 2) && (
            <button type="button" className="btn btn-primary btn-sm" onClick={finishDraft}>Finish shape</button>
          )}
          <button type="button" className="btn btn-ghost btn-sm" onClick={undo} disabled={shapes.length === 0 && draft.length === 0}>Undo</button>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => { setShapes([]); setDraft([]); }} disabled={shapes.length === 0 && draft.length === 0}>Clear all</button>
          <button type="button" className="btn btn-ghost btn-sm" onClick={exportGeoJson} disabled={shapes.length === 0}>Export GeoJSON</button>
        </div>
        {shapes.length === 0 && draft.length === 0 ? (
          <p className="rounded-lg bg-well px-3 py-3 text-sm text-mute">Nothing drawn yet. Click the map to place your first mark — measurements appear live as you draw.</p>
        ) : (
          <div className="space-y-2 border-t border-line pt-3">
            <span className="label">Drawn shapes ({shapes.length})</span>
            {shapes.map((s) => (
              <div key={s.id} className="flex items-center gap-2 rounded-lg border border-line p-2 text-sm">
                <span className="h-3 w-3 shrink-0 rounded-full" style={{ background: s.color }} aria-hidden />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-xs font-semibold">{s.label || `${s.kind[0].toUpperCase()}${s.kind.slice(1)} ${s.id}`}</div>
                  <div className="truncate text-xs text-mute">{shapeSummary(s)}</div>
                </div>
                <button type="button" className="btn btn-ghost btn-sm" aria-label={`Remove shape ${s.id}`} onClick={() => setShapes((prev) => prev.filter((x) => x.id !== s.id))}>✕</button>
              </div>
            ))}
            {draft.length > 0 && (
              <p className="text-xs text-mute">Drawing in progress: {draft.length} point{draft.length === 1 ? "" : "s"} — double-click or press Finish shape.</p>
            )}
          </div>
        )}
      </div>
      <div className="order-1 lg:order-2">
        <DynamicMap
          center={{ lat: 25, lng: 10 }}
          zoom={1.6}
          className="tall"
          onReady={(map) => {
            mapRef.current = map;
            map.doubleClickZoom.disable();
            map.addSource("draw-shapes", { type: "geojson", data: emptyFc() });
            map.addSource("draw-draft", { type: "geojson", data: emptyFc() });
            map.addLayer({ id: "draw-fill", type: "fill", source: "draw-shapes", filter: ["==", ["geometry-type"], "Polygon"], paint: { "fill-color": ["get", "color"], "fill-opacity": 0.25 } });
            map.addLayer({ id: "draw-line", type: "line", source: "draw-shapes", filter: ["in", ["geometry-type"], ["literal", ["LineString", "Polygon"]]], paint: { "line-color": ["get", "color"], "line-width": 2.5 } });
            map.addLayer({ id: "draw-point", type: "circle", source: "draw-shapes", filter: ["==", ["geometry-type"], "Point"], paint: { "circle-radius": 7, "circle-color": ["get", "color"], "circle-stroke-width": 2, "circle-stroke-color": "#ffffff" } });
            map.addLayer({
              id: "draw-label", type: "symbol", source: "draw-shapes",
              filter: ["all", ["==", ["geometry-type"], "Point"], ["has", "label"], ["!=", ["get", "label"], ""]],
              layout: { "text-field": ["get", "label"], "text-size": 12, "text-offset": [0, 1.5], "text-anchor": "top" },
              paint: { "text-color": "#111827", "text-halo-color": "#ffffff", "text-halo-width": 1.5 },
            });
            map.addLayer({ id: "draft-line", type: "line", source: "draw-draft", paint: { "line-color": "#d95d32", "line-width": 2.5, "line-dasharray": [2, 2] } });
            map.addLayer({ id: "draft-point", type: "circle", source: "draw-draft", filter: ["==", ["geometry-type"], "Point"], paint: { "circle-radius": 5, "circle-color": "#d95d32", "circle-stroke-width": 2, "circle-stroke-color": "#ffffff" } });
            map.on("click", (e: unknown) => {
              const ll = (e as { lngLat: { lat: number; lng: number } }).lngLat;
              handleMapClick({ lat: ll.lat, lng: ll.lng });
            });
            map.on("dblclick", () => finishDraft());
            (map.getSource("draw-shapes") as GeoJSONSource).setData(shapesFc);
            (map.getSource("draw-draft") as GeoJSONSource).setData(draftFc);
          }}
        />
      </div>
    </div>
  );
}

// =====================================================================
// 2. Map with legend — markers + colored regions, auto-built legend
// =====================================================================

interface LegendEntry {
  id: number;
  kind: "marker" | "region";
  label: string;
  color: string;
  pts: LatLng[];
}

function encodeEntries(es: LegendEntry[]): string {
  return es
    .map((e) => [
      e.kind === "marker" ? "m" : "r",
      e.color.replace("#", ""),
      e.label.replace(/[|~]/g, "").slice(0, 60),
      e.pts.map((p) => `${p.lat.toFixed(4)},${p.lng.toFixed(4)}`).join(";"),
    ].join("|"))
    .join("~");
}

function decodeEntries(raw: string): LegendEntry[] {
  const out: LegendEntry[] = [];
  let id = 1;
  for (const chunk of raw.split("~")) {
    const parts = chunk.split("|");
    if (parts.length !== 4) continue;
    const [k, color, label, ptsRaw] = parts;
    if (k !== "m" && k !== "r") continue;
    if (!/^[0-9a-fA-F]{6}$/.test(color)) continue;
    const pts: LatLng[] = [];
    for (const pair of ptsRaw.split(";")) {
      const [la, ln] = pair.split(",").map(Number);
      if (Number.isFinite(la) && Number.isFinite(ln) && Math.abs(la) <= 90 && Math.abs(ln) <= 180) pts.push({ lat: la, lng: ln });
    }
    if (!pts.length) continue;
    if (k === "r" && pts.length < 3) continue;
    out.push({ id: id++, kind: k === "m" ? "marker" : "region", label: label || `Entry ${id}`, color: `#${color}`, pts });
  }
  return out;
}

export function MapLegendTool({ params }: ToolProps) {
  void params;
  const [entries, setEntries] = useState<LegendEntry[]>(() => {
    try {
      if (typeof window === "undefined") return [];
      const d = new URLSearchParams(window.location.search).get("d");
      return d ? decodeEntries(decodeURIComponent(d)) : [];
    } catch {
      return [];
    }
  });
  const [addingRegion, setAddingRegion] = useState(false);
  const [draft, setDraft] = useState<LatLng[]>([]);
  const [labelText, setLabelText] = useState("");
  const [colorIdx, setColorIdx] = useState(0);
  const mapRef = useRef<MLMap | null>(null);
  const nextId = useRef(1000);
  const addRef = useRef({ addingRegion: false, label: "", color: PALETTE[0] });
  const draftRef = useRef<LatLng[]>([]);

  useEffect(() => {
    addRef.current = { addingRegion, label: labelText, color: PALETTE[colorIdx % PALETTE.length] };
  }, [addingRegion, labelText, colorIdx]);
  useEffect(() => { draftRef.current = draft; }, [draft]);

  const legendFc = useMemo<GeoJSON.FeatureCollection>(() => ({
    type: "FeatureCollection",
    features: entries.map((e): GeoJSON.Feature => {
      const coords = e.pts.map((p): [number, number] => [p.lng, p.lat]);
      const props = { color: e.color, label: e.label };
      if (e.kind === "marker") {
        return { type: "Feature", properties: props, geometry: { type: "Point", coordinates: coords[0] } };
      }
      return { type: "Feature", properties: props, geometry: { type: "Polygon", coordinates: [[...coords, coords[0]]] } };
    }),
  }), [entries]);

  const draftFc = useMemo<GeoJSON.FeatureCollection>(() => ({
    type: "FeatureCollection",
    features: draft.length >= 2
      ? [{ type: "Feature", properties: {}, geometry: { type: "LineString", coordinates: draft.map((p): [number, number] => [p.lng, p.lat]) } }]
      : draft.map((p): GeoJSON.Feature => ({ type: "Feature", properties: {}, geometry: { type: "Point", coordinates: [p.lng, p.lat] } })),
  }), [draft]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    (map.getSource("legend-data") as GeoJSONSource | undefined)?.setData(legendFc);
    (map.getSource("legend-draft") as GeoJSONSource | undefined)?.setData(draftFc);
  }, [legendFc, draftFc]);

  const handleMapClick = (pt: LatLng) => {
    const st = addRef.current;
    if (!st.addingRegion) {
      const label = st.label.trim() || `Marker ${nextId.current}`;
      setEntries((es) => [...es, { id: nextId.current++, kind: "marker", label, color: st.color, pts: [pt] }]);
      return;
    }
    setDraft((d) => {
      const last = d[d.length - 1];
      if (last && Math.abs(last.lat - pt.lat) < 1e-9 && Math.abs(last.lng - pt.lng) < 1e-9) return d;
      return [...d, pt];
    });
  };

  const finishRegion = () => {
    const st = addRef.current;
    const d = draftRef.current;
    if (d.length < 3) return;
    const label = st.label.trim() || `Region ${nextId.current}`;
    setEntries((es) => [...es, { id: nextId.current++, kind: "region", label, color: st.color, pts: d }]);
    setAddingRegion(false);
    setDraft([]);
  };

  const shareLink = () => {
    if (typeof window === "undefined" || entries.length === 0) return "";
    return `${window.location.origin}${window.location.pathname}?d=${encodeURIComponent(encodeEntries(entries))}`;
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[380px,1fr]">
      <div className="card order-2 space-y-4 p-4 lg:order-1">
        <Field label="Entry label">
          <input className="input" value={labelText} onChange={(e) => setLabelText(e.target.value)} placeholder="e.g. Delivery zone" maxLength={60} />
        </Field>
        <div>
          <span className="label">Color</span>
          <div className="flex flex-wrap gap-1.5">
            {PALETTE.map((c, i) => (
              <button
                key={c} type="button" aria-label={`Color ${i + 1}`}
                onClick={() => setColorIdx(i)}
                className={`h-7 w-7 rounded-full border-2 ${i === colorIdx ? "border-ink" : "border-transparent"}`}
                style={{ background: c }}
              />
            ))}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className={`btn btn-sm ${addingRegion ? "btn-primary" : "btn-ghost"}`}
            onClick={() => { setAddingRegion((v) => !v); setDraft([]); }}
          >
            {addingRegion ? "Drawing region… (click map)" : "Draw region"}
          </button>
          {addingRegion && draft.length >= 3 && (
            <button type="button" className="btn btn-primary btn-sm" onClick={finishRegion}>Finish region</button>
          )}
          <button
            type="button" className="btn btn-ghost btn-sm"
            onClick={() => { setEntries([]); setDraft([]); setAddingRegion(false); }}
            disabled={entries.length === 0}
          >
            Clear all
          </button>
        </div>
        {!addingRegion && <p className="text-xs text-mute">Click the map to drop a marker with the label and color above.</p>}
        {addingRegion && <p className="text-xs text-mute">Click the map to trace the region outline, then press Finish region.</p>}

        <div className="border-t border-line pt-3">
          <div className="mb-2 flex items-center justify-between">
            <span className="label !mb-0">Legend ({entries.length})</span>
            {entries.length > 0 && <CopyBtn text={shareLink()} label="Copy share link" />}
          </div>
          {entries.length === 0 ? (
            <p className="rounded-lg bg-well px-3 py-3 text-sm text-mute">No entries yet. The legend builds itself as you add markers and regions.</p>
          ) : (
            <ul className="space-y-1.5">
              {entries.map((e) => (
                <li key={e.id} className="flex items-center gap-2 rounded-lg border border-line px-2.5 py-2 text-sm">
                  {e.kind === "marker" ? (
                    <span className="h-3.5 w-3.5 shrink-0 rounded-full border border-black/20" style={{ background: e.color }} aria-hidden />
                  ) : (
                    <span className="h-3.5 w-3.5 shrink-0 rounded-sm border border-black/20" style={{ background: e.color }} aria-hidden />
                  )}
                  <span className="min-w-0 flex-1 truncate">{e.label}</span>
                  <span className="shrink-0 text-[10px] font-bold uppercase tracking-wide text-mute">{e.kind}</span>
                  <button type="button" className="btn btn-ghost btn-sm" aria-label={`Remove ${e.label}`} onClick={() => setEntries((es) => es.filter((x) => x.id !== e.id))}>✕</button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
      <div className="order-1 lg:order-2">
        <DynamicMap
          center={{ lat: 25, lng: 10 }}
          zoom={1.6}
          className="tall"
          onReady={(map) => {
            mapRef.current = map;
            map.addSource("legend-data", { type: "geojson", data: emptyFc() });
            map.addSource("legend-draft", { type: "geojson", data: emptyFc() });
            map.addLayer({ id: "legend-fill", type: "fill", source: "legend-data", filter: ["==", ["geometry-type"], "Polygon"], paint: { "fill-color": ["get", "color"], "fill-opacity": 0.35 } });
            map.addLayer({ id: "legend-line", type: "line", source: "legend-data", filter: ["in", ["geometry-type"], ["literal", ["LineString", "Polygon"]]], paint: { "line-color": ["get", "color"], "line-width": 2 } });
            map.addLayer({ id: "legend-point", type: "circle", source: "legend-data", filter: ["==", ["geometry-type"], "Point"], paint: { "circle-radius": 7, "circle-color": ["get", "color"], "circle-stroke-width": 2, "circle-stroke-color": "#ffffff" } });
            map.addLayer({
              id: "legend-label", type: "symbol", source: "legend-data",
              filter: ["all", ["==", ["geometry-type"], "Point"], ["has", "label"], ["!=", ["get", "label"], ""]],
              layout: { "text-field": ["get", "label"], "text-size": 12, "text-offset": [0, 1.5], "text-anchor": "top" },
              paint: { "text-color": "#111827", "text-halo-color": "#ffffff", "text-halo-width": 1.5 },
            });
            map.addLayer({ id: "legend-draft", type: "line", source: "legend-draft", paint: { "line-color": "#d95d32", "line-width": 2, "line-dasharray": [2, 2] } });
            map.on("click", (e: unknown) => {
              const ll = (e as { lngLat: { lat: number; lng: number } }).lngLat;
              handleMapClick({ lat: ll.lat, lng: ll.lng });
            });
            (map.getSource("legend-data") as GeoJSONSource).setData(legendFc);
            (map.getSource("legend-draft") as GeoJSONSource).setData(draftFc);
          }}
        />
      </div>
    </div>
  );
}

// =====================================================================
// 3. Color a map — click countries to paint them
// =====================================================================

function nextPaletteColor(cur: string | undefined): string | null {
  if (!cur) return PALETTE[0];
  const i = PALETTE.indexOf(cur);
  return i < 0 || i >= PALETTE.length - 1 ? null : PALETTE[i + 1];
}

export function ColorMapTool({ params }: ToolProps) {
  void params;
  const [fc, setFc] = useState<GeoJSON.FeatureCollection | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [colors, setColors] = useState<Record<string, string>>({});
  const mapRef = useRef<MLMap | null>(null);

  useEffect(() => {
    let cancelled = false;
    loadWorldCountries()
      .then((data) => { if (!cancelled) { setFc(data); setLoading(false); } })
      .catch((e: unknown) => { if (!cancelled) { setError(e instanceof Error ? e.message : "Failed to load map data."); setLoading(false); } });
    return () => { cancelled = true; };
  }, []);

  const idToName = useMemo(() => {
    const m = new Map<string, string>();
    for (const f of fc?.features ?? []) m.set(countryKey(f), countryName(f));
    return m;
  }, [fc]);

  const paintedFc = useMemo<GeoJSON.FeatureCollection | null>(() => {
    if (!fc) return null;
    return {
      type: "FeatureCollection",
      features: fc.features.map((f) => ({
        ...f,
        properties: { ...(f.properties as object), mapcolor: colors[countryKey(f)] ?? null },
      })),
    };
  }, [fc, colors]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !paintedFc) return;
    (map.getSource("countries") as GeoJSONSource | undefined)?.setData(paintedFc);
  }, [paintedFc]);

  const counts = useMemo(() => {
    const c = new Map<string, number>();
    for (const col of Object.values(colors)) c.set(col, (c.get(col) ?? 0) + 1);
    return c;
  }, [colors]);

  const coloredList = useMemo(() => {
    return Object.entries(colors)
      .map(([id, color]) => ({ id, color, name: idToName.get(id) ?? id }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [colors, idToName]);

  const exportCsv = () => {
    const rows = coloredList.map((r) => [r.name, r.color]);
    downloadText("mapbench-colored-countries.csv", toCsv(["country", "color"], rows), "text/csv");
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[380px,1fr]">
      <div className="card order-2 space-y-4 p-4 lg:order-1">
        <p className="text-sm text-mute">Click any country to paint it. Keep clicking the same country to cycle through colors; one more click clears it.</p>
        <div className="flex flex-wrap gap-2">
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => setColors({})} disabled={coloredList.length === 0}>Reset</button>
          <button type="button" className="btn btn-ghost btn-sm" onClick={exportCsv} disabled={coloredList.length === 0}>Export CSV</button>
        </div>
        {loading && <Spinner label="Loading world map…" />}
        {error && <ErrorBox>{error} <button type="button" className="btn btn-ghost btn-sm ml-2" onClick={() => window.location.reload()}>Retry</button></ErrorBox>}
        {!loading && !error && (
          <>
            <div>
              <span className="label">Colors used</span>
              {coloredList.length === 0 ? (
                <p className="rounded-lg bg-well px-3 py-3 text-sm text-mute">No countries painted yet — click the map to start.</p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {PALETTE.filter((c) => counts.get(c)).map((c) => (
                    <span key={c} className="inline-flex items-center gap-1.5 rounded-full border border-line px-2.5 py-1 text-xs font-semibold">
                      <span className="h-3 w-3 rounded-full" style={{ background: c }} aria-hidden />
                      {counts.get(c)}
                    </span>
                  ))}
                </div>
              )}
            </div>
            {coloredList.length > 0 && (
              <div className="border-t border-line pt-3">
                <span className="label">Painted countries ({coloredList.length})</span>
                <ul className="max-h-64 space-y-1.5 overflow-y-auto pr-1">
                  {coloredList.map((r) => (
                    <li key={r.id} className="flex items-center gap-2 rounded-lg border border-line px-2.5 py-1.5 text-sm">
                      <span className="h-3.5 w-3.5 shrink-0 rounded-full border border-black/20" style={{ background: r.color }} aria-hidden />
                      <span className="min-w-0 flex-1 truncate">{r.name}</span>
                      <button
                        type="button" className="btn btn-ghost btn-sm" aria-label={`Clear ${r.name}`}
                        onClick={() => setColors((prev) => { const out = { ...prev }; delete out[r.id]; return out; })}
                      >✕</button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        )}
      </div>
      <div className="order-1 lg:order-2">
        <DynamicMap
          center={{ lat: 25, lng: 10 }}
          zoom={1.6}
          className="tall"
          onReady={(map) => {
            mapRef.current = map;
            map.addSource("countries", { type: "geojson", data: emptyFc() });
            map.addLayer({ id: "countries-fill", type: "fill", source: "countries", paint: { "fill-color": ["coalesce", ["get", "mapcolor"], "#dde3ea"], "fill-opacity": 0.9 } });
            map.addLayer({ id: "countries-line", type: "line", source: "countries", paint: { "line-color": "#ffffff", "line-width": 0.6 } });
            map.on("mousemove", "countries-fill", () => { map.getCanvas().style.cursor = "pointer"; });
            map.on("mouseleave", "countries-fill", () => { map.getCanvas().style.cursor = ""; });
            map.on("click", "countries-fill", (e: unknown) => {
              const feats = (e as { features?: GeoJSON.Feature[] }).features;
              const f = feats?.[0];
              if (!f) return;
              const id = countryKey(f);
              setColors((prev) => {
                const next = nextPaletteColor(prev[id]);
                const out = { ...prev };
                if (next) out[id] = next;
                else delete out[id];
                return out;
              });
            });
            if (paintedFc) (map.getSource("countries") as GeoJSONSource).setData(paintedFc);
          }}
        />
      </div>
    </div>
  );
}

// =====================================================================
// 4. US county choropleth — paste FIPS,value CSV, get a colored map
// =====================================================================

const CHORO_COLORS = ["#22c55e", "#a3e635", "#eab308", "#f97316", "#dc2626"];
const CHORO_CLASSES = 5;

interface CountyRow { fips: string; value: number }

function parseCountyCsv(text: string): { rows: CountyRow[]; errors: string[] } {
  const rows: CountyRow[] = [];
  const errors: string[] = [];
  const seen = new Set<string>();
  text.split(/\r?\n/).forEach((line, i) => {
    const t = line.trim();
    if (!t) return;
    const parts = t.split(/[,\t;]/).map((s) => s.trim());
    if (i === 0 && /fips/i.test(parts[0] ?? "")) return; // header row
    if (parts.length < 2) { errors.push(`Line ${i + 1}: expected "FIPS,value".`); return; }
    const fips = (parts[0] ?? "").replace(/\D/g, "");
    if (!/^\d{5}$/.test(fips)) { errors.push(`Line ${i + 1}: "${parts[0]}" is not a 5-digit FIPS code.`); return; }
    const value = parseFloat((parts[1] ?? "").replace(/[$,%]/g, ""));
    if (!Number.isFinite(value)) { errors.push(`Line ${i + 1}: "${parts[1]}" is not a number.`); return; }
    if (seen.has(fips)) { errors.push(`Line ${i + 1}: duplicate FIPS ${fips} — keeping the first.`); return; }
    seen.add(fips);
    rows.push({ fips, value });
  });
  return { rows, errors };
}

const SAMPLE_COUNTY_CSV = `06037,10039107
06073,3333984
06059,3164184
06001,1680435
04013,4425687
17031,5275077
36061,1628706
48201,4731145`;

function choroClass(v: number, min: number, max: number): number {
  if (!(max > min)) return 2;
  return Math.min(CHORO_CLASSES - 1, Math.floor(((v - min) / (max - min)) * CHORO_CLASSES));
}

export function CountyChoroplethTool({ params }: ToolProps) {
  void params;
  const [fc, setFc] = useState<GeoJSON.FeatureCollection | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [csv, setCsv] = useState("");
  const [selected, setSelected] = useState<{ fips: string; value: number | null } | null>(null);
  const mapRef = useRef<MLMap | null>(null);

  useEffect(() => {
    let cancelled = false;
    loadUsCounties()
      .then((data) => { if (!cancelled) { setFc(data); setLoading(false); } })
      .catch((e: unknown) => { if (!cancelled) { setError(e instanceof Error ? e.message : "Failed to load map data."); setLoading(false); } });
    return () => { cancelled = true; };
  }, []);

  const parsed = useMemo(() => parseCountyCsv(csv), [csv]);
  const valueByFips = useMemo(() => new Map(parsed.rows.map((r) => [r.fips, r.value])), [parsed]);
  const valueByFipsRef = useRef(valueByFips);
  useEffect(() => { valueByFipsRef.current = valueByFips; }, [valueByFips]);
  const stats = useMemo(() => {
    if (!parsed.rows.length) return null;
    const vals = parsed.rows.map((r) => r.value);
    const min = Math.min(...vals), max = Math.max(...vals);
    const step = (max - min) / CHORO_CLASSES;
    return { min, max, ranges: Array.from({ length: CHORO_CLASSES }, (_, i) => ({ lo: min + i * step, hi: min + (i + 1) * step, color: CHORO_COLORS[i] })) };
  }, [parsed]);

  const paintedFc = useMemo<GeoJSON.FeatureCollection | null>(() => {
    if (!fc) return null;
    return {
      type: "FeatureCollection",
      features: fc.features.map((f) => {
        const fips = String(f.id ?? "");
        const v = valueByFips.get(fips);
        const fill = v !== undefined && stats ? CHORO_COLORS[choroClass(v, stats.min, stats.max)] : null;
        return { ...f, properties: { ...(f.properties as object), fill } };
      }),
    };
  }, [fc, valueByFips, stats]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !paintedFc) return;
    (map.getSource("counties") as GeoJSONSource | undefined)?.setData(paintedFc);
  }, [paintedFc]);

  const matched = parsed.rows.length;

  return (
    <div className="grid gap-4 lg:grid-cols-[380px,1fr]">
      <div className="card order-2 space-y-4 p-4 lg:order-1">
        <Field label="County data (FIPS, value — one per line)" hint="5-digit FIPS codes, e.g. 06037 for Los Angeles County.">
          <textarea
            className="input min-h-32 font-mono text-xs"
            value={csv}
            onChange={(e) => setCsv(e.target.value)}
            placeholder={"06037,10039107\n36061,1628706"}
            spellCheck={false}
          />
        </Field>
        <div className="flex flex-wrap gap-2">
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => setCsv(SAMPLE_COUNTY_CSV)}>Load sample</button>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => { setCsv(""); setSelected(null); }} disabled={!csv}>Clear</button>
        </div>
        {parsed.errors.length > 0 && (
          <ErrorBox>
            <ul className="list-disc pl-4">
              {parsed.errors.slice(0, 5).map((e, i) => <li key={i}>{e}</li>)}
              {parsed.errors.length > 5 && <li>…and {parsed.errors.length - 5} more.</li>}
            </ul>
          </ErrorBox>
        )}
        {loading && <Spinner label="Loading US counties…" />}
        {error && <ErrorBox>{error} <button type="button" className="btn btn-ghost btn-sm ml-2" onClick={() => window.location.reload()}>Retry</button></ErrorBox>}
        {!loading && !error && (
          <>
            {stats ? (
              <div className="space-y-2">
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="rounded-lg bg-well px-2 py-2">
                    <div className="text-[10px] font-bold uppercase tracking-wide text-mute">Counties</div>
                    <div className="mt-0.5 text-sm font-bold text-ink">{fmt(matched)}</div>
                  </div>
                  <div className="rounded-lg bg-well px-2 py-2">
                    <div className="text-[10px] font-bold uppercase tracking-wide text-mute">Min</div>
                    <div className="mt-0.5 text-sm font-bold text-ink">{fmt(stats.min)}</div>
                  </div>
                  <div className="rounded-lg bg-well px-2 py-2">
                    <div className="text-[10px] font-bold uppercase tracking-wide text-mute">Max</div>
                    <div className="mt-0.5 text-sm font-bold text-ink">{fmt(stats.max)}</div>
                  </div>
                </div>
                <div>
                  <span className="label">Legend (5 equal-interval classes)</span>
                  <ul className="space-y-1">
                    {stats.ranges.map((r, i) => (
                      <li key={i} className="flex items-center gap-2 text-xs">
                        <span className="h-3.5 w-8 shrink-0 rounded-sm border border-black/20" style={{ background: r.color }} aria-hidden />
                        <span className="font-mono">{fmt(r.lo)} – {fmt(r.hi)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : (
              <p className="rounded-lg bg-well px-3 py-3 text-sm text-mute">Paste your CSV or load the sample to build the choropleth. Values are split into 5 equal-interval color classes, green (low) to red (high).</p>
            )}
            {selected && (
              <div className="rounded-lg border border-line bg-well px-3 py-2.5 text-sm">
                <span className="text-xs font-bold uppercase tracking-wide text-mute">Selected county</span>
                <div className="mt-1 font-mono font-semibold">FIPS {selected.fips}</div>
                <div className="text-mute">{selected.value !== null ? `Value: ${fmt(selected.value)}` : "No data for this county in your CSV."}</div>
              </div>
            )}
          </>
        )}
      </div>
      <div className="order-1 lg:order-2">
        <DynamicMap
          center={{ lat: 39.8, lng: -98.6 }}
          zoom={3.4}
          className="tall"
          onReady={(map) => {
            mapRef.current = map;
            map.addSource("counties", { type: "geojson", data: emptyFc() });
            map.addLayer({ id: "counties-fill", type: "fill", source: "counties", paint: { "fill-color": ["coalesce", ["get", "fill"], "rgba(148,163,184,0.18)"], "fill-opacity": 0.85 } });
            map.addLayer({ id: "counties-line", type: "line", source: "counties", paint: { "line-color": "#ffffff", "line-width": 0.4 } });
            map.on("click", "counties-fill", (e: unknown) => {
              const feats = (e as { features?: GeoJSON.Feature[] }).features;
              const f = feats?.[0];
              if (!f) return;
              const fips = String(f.id ?? "");
              const v = /^\d{5}$/.test(fips) ? valueByFipsRef.current.get(fips) ?? null : null;
              setSelected({ fips: fips || "—", value: v });
            });
            if (paintedFc) (map.getSource("counties") as GeoJSONSource).setData(paintedFc);
          }}
        />
      </div>
    </div>
  );
}

// =====================================================================
// 5. ZIP code map — plot a list of US ZIPs as dots or a heatmap
// =====================================================================

interface ZipPoint { zip: string; lat: number; lng: number; place: string }

const ZIP_CONCURRENCY = 3;
const ZIP_LIMIT = 200;

function parseZipList(text: string): { zips: string[]; invalid: string[] } {
  const zips: string[] = [];
  const invalid: string[] = [];
  const seen = new Set<string>();
  for (const raw of text.split(/[\s,;]+/)) {
    const t = raw.trim();
    if (!t) continue;
    if (/^\d{5}$/.test(t)) {
      if (!seen.has(t) && zips.length < ZIP_LIMIT) { seen.add(t); zips.push(t); }
    } else {
      invalid.push(t);
    }
  }
  return { zips, invalid };
}

export function ZipMapTool({ params }: ToolProps) {
  void params;
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [results, setResults] = useState<ZipPoint[]>([]);
  const [failed, setFailed] = useState<string[]>([]);
  const [invalid, setInvalid] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [heat, setHeat] = useState(false);
  const mapRef = useRef<MLMap | null>(null);

  const plot = async () => {
    const { zips, invalid: bad } = parseZipList(input);
    setInvalid(bad);
    if (zips.length === 0) {
      setError(bad.length > 0 ? "No valid 5-digit ZIP codes found. Check the list and try again." : "Enter at least one US ZIP code first.");
      return;
    }
    setBusy(true);
    setError(null);
    setResults([]);
    setFailed([]);
    setProgress({ done: 0, total: zips.length });
    const ok: ZipPoint[] = [];
    const badZips: string[] = [];
    const queue = [...zips];
    let done = 0;
    const bump = () => { done += 1; setProgress({ done, total: zips.length }); };
    const workers = Array.from({ length: ZIP_CONCURRENCY }, async () => {
      while (queue.length > 0) {
        const zip = queue.shift() as string;
        try {
          const res = await fetch(`https://api.zippopotam.us/us/${zip}`);
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const j = await res.json() as { places?: { "place name"?: string; state?: string; latitude?: string; longitude?: string }[] };
          const p = j.places?.[0];
          const lat = parseFloat(p?.latitude ?? "");
          const lng = parseFloat(p?.longitude ?? "");
          if (!Number.isFinite(lat) || !Number.isFinite(lng)) throw new Error("bad coords");
          ok.push({ zip, lat, lng, place: `${p?.["place name"] ?? "—"}, ${p?.state ?? "—"}` });
        } catch {
          badZips.push(zip);
        }
        bump();
      }
    });
    await Promise.all(workers);
    ok.sort((a, b) => a.zip.localeCompare(b.zip));
    setResults(ok);
    setFailed(badZips.sort());
    setBusy(false);
    if (ok.length === 0) setError("None of the ZIP codes could be located. The lookup service may be down — try again in a minute.");
    const map = mapRef.current;
    if (map && ok.length > 0) {
      const lngs = ok.map((r) => r.lng), lats = ok.map((r) => r.lat);
      map.fitBounds([[Math.min(...lngs), Math.min(...lats)], [Math.max(...lngs), Math.max(...lats)]], { padding: 60, maxZoom: 10 });
    }
  };

  const pointsFc = useMemo<GeoJSON.FeatureCollection>(() => ({
    type: "FeatureCollection",
    features: results.map((r): GeoJSON.Feature => ({
      type: "Feature",
      properties: { zip: r.zip, place: r.place },
      geometry: { type: "Point", coordinates: [r.lng, r.lat] },
    })),
  }), [results]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    (map.getSource("zips") as GeoJSONSource | undefined)?.setData(pointsFc);
  }, [pointsFc]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.getLayer("zips-heat")) return;
    map.setLayoutProperty("zips-heat", "visibility", heat ? "visible" : "none");
    map.setLayoutProperty("zips-dots", "visibility", heat ? "none" : "visible");
  }, [heat]);

  const exportCsv = () => {
    downloadText("mapbench-zip-map.csv", toCsv(["zip", "latitude", "longitude", "place"], results.map((r) => [r.zip, r.lat.toFixed(5), r.lng.toFixed(5), r.place])), "text/csv");
  };

  const pct = progress.total > 0 ? Math.round((progress.done / progress.total) * 100) : 0;

  return (
    <div className="grid gap-4 lg:grid-cols-[380px,1fr]">
      <div className="card order-2 space-y-4 p-4 lg:order-1">
        <Field label={`US ZIP codes (one per line or comma-separated, up to ${ZIP_LIMIT})`}>
          <textarea
            className="input min-h-32 font-mono text-xs"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={"90210\n10001, 60601"}
            spellCheck={false}
          />
        </Field>
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" className="btn btn-primary btn-sm" onClick={plot} disabled={busy}>
            {busy ? "Plotting…" : "Plot ZIP codes"}
          </button>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => { setInput(""); setResults([]); setFailed([]); setInvalid([]); setError(null); }} disabled={busy}>Clear</button>
          {results.length > 0 && (
            <button type="button" className={`btn btn-sm ${heat ? "btn-primary" : "btn-ghost"}`} onClick={() => setHeat((h) => !h)}>
              {heat ? "Heatmap on" : "Heatmap off"}
            </button>
          )}
          {results.length > 0 && <button type="button" className="btn btn-ghost btn-sm" onClick={exportCsv}>Export CSV</button>}
        </div>
        {busy && (
          <div className="space-y-1.5">
            <div className="h-2 overflow-hidden rounded bg-well">
              <div className="h-2 rounded bg-brand transition-all" style={{ width: `${pct}%` }} />
            </div>
            <p className="text-xs text-mute"><Spinner label={`Geocoding ${progress.done} of ${progress.total}…`} /></p>
          </div>
        )}
        {error && <ErrorBox>{error}</ErrorBox>}
        {invalid.length > 0 && (
          <p className="text-xs text-mute">Skipped {invalid.length} invalid {invalid.length === 1 ? "entry" : "entries"}: <span className="font-mono">{invalid.slice(0, 8).join(", ")}{invalid.length > 8 ? "…" : ""}</span></p>
        )}
        {!busy && (results.length > 0 || failed.length > 0) && (
          <div className="space-y-2 border-t border-line pt-3">
            <div className="grid grid-cols-2 gap-2 text-center">
              <div className="rounded-lg bg-well px-2 py-2">
                <div className="text-[10px] font-bold uppercase tracking-wide text-mute">Plotted</div>
                <div className="mt-0.5 text-sm font-bold text-ink">{results.length}</div>
              </div>
              <div className="rounded-lg bg-well px-2 py-2">
                <div className="text-[10px] font-bold uppercase tracking-wide text-mute">Not found</div>
                <div className="mt-0.5 text-sm font-bold text-ink">{failed.length}</div>
              </div>
            </div>
            {failed.length > 0 && (
              <p className="text-xs text-mute">Not found: <span className="font-mono">{failed.slice(0, 12).join(", ")}{failed.length > 12 ? "…" : ""}</span></p>
            )}
          </div>
        )}
        {!busy && results.length === 0 && failed.length === 0 && !error && (
          <p className="rounded-lg bg-well px-3 py-3 text-sm text-mute">Enter ZIP codes and press Plot. Each code is geocoded and drawn as a dot; switch on the heatmap to see density.</p>
        )}
      </div>
      <div className="order-1 lg:order-2">
        <DynamicMap
          center={{ lat: 39.8, lng: -98.6 }}
          zoom={3.4}
          className="tall"
          onReady={(map) => {
            mapRef.current = map;
            map.addSource("zips", { type: "geojson", data: emptyFc() });
            map.addLayer({
              id: "zips-heat", type: "heatmap", source: "zips",
              layout: { visibility: "none" },
              paint: { "heatmap-radius": 32, "heatmap-opacity": 0.85, "heatmap-intensity": 1 },
            });
            map.addLayer({ id: "zips-dots", type: "circle", source: "zips", paint: { "circle-radius": 6, "circle-color": "#d95d32", "circle-stroke-width": 1.5, "circle-stroke-color": "#ffffff" } });
            (map.getSource("zips") as GeoJSONSource).setData(pointsFc);
          }}
        />
      </div>
    </div>
  );
}

// =====================================================================
// 6. Country size comparison — true-scale side-by-side outlines
// =====================================================================

const SIZE_W = 340;
const SIZE_H = 220;
const SIZE_PAD = 14;

function trueAreaKm2(f: GeoJSON.Feature): number {
  return geoArea(f as any) * EARTH_R_KM * EARTH_R_KM;
}

/** Path `d` for a feature, centered in its box, using the shared scale `k`. */
function countryPathD(f: GeoJSON.Feature, k: number): string {
  const probe = geoIdentity().scale(k).translate([0, 0]);
  const b = geoPath(probe).bounds(f as any);
  const proj = geoIdentity().scale(k).translate([
    SIZE_W / 2 - (b[0][0] + b[1][0]) / 2,
    SIZE_H / 2 - (b[0][1] + b[1][1]) / 2,
  ]);
  return geoPath(proj)(f as any) ?? "";
}

export function CountrySizeTool({ params }: ToolProps) {
  void params;
  const [fc, setFc] = useState<GeoJSON.FeatureCollection | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [aName, setAName] = useState("United States of America");
  const [bName, setBName] = useState("India");

  useEffect(() => {
    let cancelled = false;
    loadWorldCountries()
      .then((data) => { if (!cancelled) { setFc(data); setLoading(false); } })
      .catch((e: unknown) => { if (!cancelled) { setError(e instanceof Error ? e.message : "Failed to load map data."); setLoading(false); } });
    return () => { cancelled = true; };
  }, []);

  const names = useMemo(() => {
    const s = new Set<string>();
    for (const f of fc?.features ?? []) s.add(countryName(f));
    return [...s].sort((a, b) => a.localeCompare(b));
  }, [fc]);

  const byName = useMemo(() => {
    const m = new Map<string, GeoJSON.Feature>();
    for (const f of fc?.features ?? []) {
      const n = countryName(f);
      if (!m.has(n)) m.set(n, f);
    }
    return m;
  }, [fc]);

  const fa = byName.get(aName.trim());
  const fb = byName.get(bName.trim());

  const render = useMemo(() => {
    if (!fa || !fb) return null;
    // One scale for both: fit the combined shapes, then reuse the scale so
    // areas on screen are directly comparable.
    const combined = { type: "FeatureCollection", features: [fa, fb] };
    const k = geoIdentity().fitSize([SIZE_W - SIZE_PAD * 2, SIZE_H - SIZE_PAD * 2], combined as any).scale();
    const areaA = trueAreaKm2(fa);
    const areaB = trueAreaKm2(fb);
    const bigIsA = areaA >= areaB;
    const ratio = bigIsA ? areaA / areaB : areaB / areaA;
    return {
      dA: countryPathD(fa, k),
      dB: countryPathD(fb, k),
      areaA, areaB,
      headline: ratio < 1.005
        ? "Almost exactly the same size."
        : `${bigIsA ? aName : bName} is ${fmt(ratio, 1)}× larger than ${bigIsA ? bName : aName}.`,
    };
  }, [fa, fb, aName, bName]);

  return (
    <div className="space-y-4">
      <div className="card grid gap-3 p-4 sm:grid-cols-[1fr,auto,1fr] sm:items-end">
        <Field label="Country A">
          <input className="input" list="sizecmp-countries" value={aName} onChange={(e) => setAName(e.target.value)} placeholder="Type to search…" />
        </Field>
        <button
          type="button" className="btn btn-ghost" aria-label="Swap countries"
          onClick={() => { setAName(bName); setBName(aName); }}
        >
          ⇄ Swap
        </button>
        <Field label="Country B">
          <input className="input" list="sizecmp-countries" value={bName} onChange={(e) => setBName(e.target.value)} placeholder="Type to search…" />
        </Field>
        <datalist id="sizecmp-countries">
          {names.map((n) => <option key={n} value={n} />)}
        </datalist>
      </div>

      {loading && <div className="card p-4"><Spinner label="Loading country shapes…" /></div>}
      {error && <ErrorBox>{error} <button type="button" className="btn btn-ghost btn-sm ml-2" onClick={() => window.location.reload()}>Retry</button></ErrorBox>}

      {!loading && !error && !render && (
        <p className="card rounded-lg p-4 text-sm text-mute">Select two valid countries above to compare their true sizes.</p>
      )}

      {!loading && !error && render && (
        <>
          <p className="text-center font-display text-xl font-bold">{render.headline}</p>
          <div className="grid gap-4 md:grid-cols-2">
            {[
              { name: aName, d: render.dA, area: render.areaA, color: "#1d6e63" },
              { name: bName, d: render.dB, area: render.areaB, color: "#d95d32" },
            ].map((c) => (
              <div key={c.name} className="card p-4">
                <div className="mb-1 flex items-baseline justify-between gap-2">
                  <h3 className="truncate font-display text-base font-bold">{c.name}</h3>
                  <span className="shrink-0 font-mono text-sm font-semibold">{fmt(c.area, 0)} km²</span>
                </div>
                <svg viewBox={`0 0 ${SIZE_W} ${SIZE_H}`} className="h-auto w-full rounded-lg bg-well" role="img" aria-label={`Approximate longitude-latitude outline of ${c.name}`}>
                  <path d={c.d} fill={c.color} fillOpacity={0.75} stroke={c.color} strokeWidth={1.2} />
                </svg>
              </div>
            ))}
          </div>
          <p className="text-center text-xs text-mute">
            The outlines use longitude and latitude coordinates, which distort on-screen area, especially at high latitudes. Compare the numerical spherical area estimates instead; boundaries are simplified.
          </p>
        </>
      )}
    </div>
  );
}
