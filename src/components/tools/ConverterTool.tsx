"use client";

import { useMemo, useRef, useState } from "react";
import type { Map as MLMap } from "maplibre-gl";
import { isValidLat, isValidLng, parseCoordPair, type LatLng } from "@/lib/geo";
import { decodePlusCode, encodePlusCode, formatDms, formatUtm, latLngToMgrs, latLngToUtm, parseDms, parseMgrs, utmToLatLng } from "@/lib/coords";
import { downloadText, toCsv } from "@/lib/formats";
import { decodeGeohash, encodeGeohash } from "@/lib/geohash";
import { CopyBtn, ErrorBox, Field } from "@/components/ui";
import { DynamicMap, pinElement } from "./shared";

type Parsed = { point: LatLng; source: string } | { error: string };
type Converted = { input: string; source: string; point: LatLng; decimal: string; dmm: string; dms: string; utm: string; mgrs: string; plus: string; geohash: string };

function formatDmm(value: number, axis: "lat" | "lng", minutePrecision = 4): string {
  const hemi = axis === "lat" ? (value >= 0 ? "N" : "S") : (value >= 0 ? "E" : "W");
  const abs = Math.abs(value);
  const deg = Math.floor(abs);
  const minutes = (abs - deg) * 60;
  return `${deg}° ${minutes.toFixed(minutePrecision)}' ${hemi}`;
}

function parseAnything(input: string): Parsed {
  const s = input.trim();
  if (!s) return { error: "Enter a coordinate in any supported format." };
  const pair = parseCoordPair(s);
  if (pair) return { point: pair, source: "decimal / DMS pair" };
  if (/^[0-9A-Z]{4,}\+?[0-9A-Z]*$/i.test(s.replace(/\s/g, ""))) {
    const p = decodePlusCode(s);
    if (p) return { point: p, source: "Plus Code" };
  }
  const mgrs = parseMgrs(s);
  if (mgrs) return { point: mgrs, source: "MGRS" };
  const um = s.match(/^(\d{1,2})\s*([NSns])?\s+(\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)$/);
  if (um) {
    const zone = parseInt(um[1], 10);
    const hemi = um[2] ? (um[2].toUpperCase() as "N" | "S") : parseFloat(um[4]) < 0 ? "S" : "N";
    const p = utmToLatLng({ zone, hemi, easting: parseFloat(um[3]), northing: parseFloat(um[4]) });
    if (p && isValidLat(p.lat) && isValidLng(p.lng)) return { point: p, source: "UTM" };
  }
  // Require at least four characters here to avoid interpreting ordinary numbers as hashes.
  const geohash = s.length >= 4 ? decodeGeohash(s) : null;
  if (geohash) return { point: geohash, source: "geohash cell centre" };
  const single = parseDms(s);
  if (single !== null && isValidLat(single)) return { point: { lat: single, lng: 0 }, source: "single DMS (assumed latitude)" };
  return { error: "No supported coordinate format was recognised. Try decimal degrees, DMS, UTM, MGRS, a Plus Code or a geohash." };
}

function convert(input: string, precision: number): Converted | null {
  const parsed = parseAnything(input);
  if (!("point" in parsed)) return null;
  const point = parsed.point;
  const utm = latLngToUtm(point);
  return {
    input,
    source: parsed.source,
    point,
    decimal: `${point.lat.toFixed(precision)}, ${point.lng.toFixed(precision)}`,
    dmm: `${formatDmm(point.lat, "lat")}, ${formatDmm(point.lng, "lng")}`,
    dms: `${formatDms(point.lat, "lat")}, ${formatDms(point.lng, "lng")}`,
    utm: utm ? formatUtm(utm) : "outside UTM range",
    mgrs: latLngToMgrs(point, Math.min(5, Math.max(1, precision - 1))) ?? "outside MGRS range",
    plus: encodePlusCode(point.lat, point.lng),
    geohash: encodeGeohash(point.lat, point.lng, Math.min(12, Math.max(5, precision + 3))),
  };
}

export default function ConverterTool({ params }: { params?: Record<string, unknown> }) {
  const focus = (params?.focus as string) ?? "all";
  const [input, setInput] = useState("48.858370, 2.294481");
  const [mode, setMode] = useState<"single" | "batch">("single");
  const [batch, setBatch] = useState("40.7128,-74.006\n51.5074,-0.1278\n35.6762,139.6503");
  const [precision, setPrecision] = useState(6);
  const [history, setHistory] = useState<string[]>([]);
  const mapRef = useRef<MLMap | null>(null);
  const libRef = useRef<any>(null);
  const markerRef = useRef<any>(null);

  const parsed = useMemo(() => parseAnything(input), [input]);
  const point = "point" in parsed ? parsed.point : null;
  const outputs = useMemo(() => point ? convert(input, precision) : null, [input, point, precision]);

  const batchRows = useMemo(() => batch.split(/\r?\n/).map((line) => line.trim()).filter(Boolean).map((line) => convert(line, precision)).filter((x): x is Converted => !!x), [batch, precision]);
  const invalidBatchCount = useMemo(() => batch.split(/\r?\n/).map((line) => line.trim()).filter(Boolean).length - batchRows.length, [batch, batchRows.length]);

  const moveMap = (p: LatLng) => {
    const map = mapRef.current, lib = libRef.current;
    if (!map || !lib) return;
    if (!markerRef.current) markerRef.current = new lib.Marker({ element: pinElement("#d95d32") }).setLngLat([p.lng, p.lat]).addTo(map);
    else markerRef.current.setLngLat([p.lng, p.lat]);
    map.flyTo({ center: [p.lng, p.lat], zoom: Math.max(map.getZoom(), 11), essential: true });
  };

  const remember = () => {
    if (!outputs) return;
    setHistory((items) => [input, ...items.filter((x) => x !== input)].slice(0, 5));
  };

  const copyAll = outputs ? [
    `Input: ${input}`,
    `Recognised as: ${outputs.source}`,
    `Decimal: ${outputs.decimal}`,
    `DMM: ${outputs.dmm}`,
    `DMS: ${outputs.dms}`,
    `UTM: ${outputs.utm}`,
    `MGRS: ${outputs.mgrs}`,
    `Geohash: ${outputs.geohash}`,
    `Plus Code: ${outputs.plus}`,
  ].join("\n") : "";

  const exportBatch = () => {
    downloadText("mapbench-coordinate-conversions.csv", toCsv(
      ["input", "source", "latitude", "longitude", "decimal", "dmm", "dms", "utm", "mgrs", "geohash", "plus_code"],
      batchRows.map((r) => [r.input, r.source, r.point.lat.toFixed(precision), r.point.lng.toFixed(precision), r.decimal, r.dmm, r.dms, r.utm, r.mgrs, r.geohash, r.plus]),
    ), "text/csv");
  };

  return (
    <div className="space-y-4">
      <p className="text-sm leading-relaxed text-mute">Geohash input resolves to the centre of its grid cell, not the original exact coordinate.</p>
      <div className="card flex flex-wrap items-center justify-between gap-3 p-3">
        <div className="premium-seg">
          <button type="button" className="premium-seg-btn" data-active={mode === "single"} onClick={() => setMode("single")}>Single coordinate</button>
          <button type="button" className="premium-seg-btn" data-active={mode === "batch"} onClick={() => setMode("batch")}>Batch convert</button>
        </div>
        <Field label="Decimal precision">
          <select className="select !w-auto" value={precision} onChange={(e) => setPrecision(Number(e.target.value))}>{[3,4,5,6,7,8].map((n) => <option key={n} value={n}>{n} decimals</option>)}</select>
        </Field>
      </div>

      {mode === "single" ? (
        <div className="grid gap-4 lg:grid-cols-[430px,1fr]">
          <div className="card order-2 space-y-4 p-4 lg:order-1">
            <div>
              <span className="label">Paste any coordinate format</span>
              <textarea
                className="textarea font-mono"
                rows={3}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={"40.7128, -74.006 · 40°26'46\"N 79°58'36\"W · 18T 583960 4507530 · 33UUP 05300 21500 · 87GVCWC8+3V"}
              />
            </div>
            {"error" in parsed && <ErrorBox>{parsed.error}</ErrorBox>}
            {point && outputs && (
              <>
                <div className="text-xs text-mute">Recognised as <strong className="text-ink">{outputs.source}</strong>. Every format below updates instantly.</div>
                <div className="space-y-2">
                  <Row label="Decimal degrees (DD)" value={outputs.decimal} highlight={focus === "all" || focus === "decimal"} />
                  <Row label="Degrees + decimal minutes (DMM)" value={outputs.dmm} highlight={focus === "dmm"} />
                  <Row label="Degrees / minutes / seconds (DMS)" value={outputs.dms} highlight={focus === "dms" || focus === "decimal"} />
                  <Row label="UTM (WGS84)" value={outputs.utm} highlight={focus === "utm"} />
                  <Row label="MGRS" value={outputs.mgrs} highlight={focus === "mgrs"} />
                  <Row label="Geohash" value={outputs.geohash} highlight={focus === "geohash"} />
                  <Row label="Plus Code" value={outputs.plus} highlight={focus === "pluscode"} />
                </div>
                <div className="flex flex-wrap gap-2">
                  <button type="button" className="btn btn-primary btn-sm" onClick={() => { moveMap(point); remember(); }}>Show on map</button>
                  <CopyBtn text={copyAll} label="Copy all formats" />
                </div>
              </>
            )}
            {history.length > 0 && (
              <div className="border-t border-line pt-3">
                <div className="label">Recent conversions</div>
                <div className="flex flex-wrap gap-2">{history.map((item) => <button key={item} type="button" className="btn btn-ghost btn-sm font-mono" onClick={() => setInput(item)}>{item}</button>)}</div>
              </div>
            )}
          </div>
          <div className="order-1 lg:order-2">
            <DynamicMap center={point ?? { lat: 25, lng: 10 }} zoom={point ? 11 : 1.6} className="tall" onReady={(map, lib) => {
              mapRef.current = map; libRef.current = lib;
              if (point) markerRef.current = new lib.Marker({ element: pinElement("#d95d32") }).setLngLat([point.lng, point.lat]).addTo(map);
              map.on("click", (e: any) => setInput(`${e.lngLat.lat.toFixed(precision)}, ${e.lngLat.lng.toFixed(precision)}`));
            }} />
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="card p-4">
            <Field label="One coordinate per line" hint="Mix decimal, DMS, UTM, MGRS, Plus Codes and geohashes in the same batch. A geohash decodes to its cell centre.">
              <textarea className="textarea min-h-48 font-mono text-xs" value={batch} onChange={(e) => setBatch(e.target.value)} />
            </Field>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="chip chip-brand">{batchRows.length} valid</span>
              {invalidBatchCount > 0 && <span className="chip chip-ember">{invalidBatchCount} unrecognised</span>}
              <button type="button" className="btn btn-primary btn-sm" disabled={!batchRows.length} onClick={exportBatch}>Export CSV</button>
            </div>
          </div>
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="tbl min-w-[1320px]">
                <thead><tr><th>#</th><th>Input</th><th>Detected</th><th>Decimal</th><th>DMM</th><th>DMS</th><th>UTM</th><th>MGRS</th><th>Geohash</th><th>Plus Code</th></tr></thead>
                <tbody>{batchRows.map((r, i) => <tr key={`${r.input}-${i}`}><td>{i + 1}</td><td className="font-mono text-xs">{r.input}</td><td>{r.source}</td><td className="font-mono text-xs">{r.decimal}</td><td className="font-mono text-xs">{r.dmm}</td><td className="font-mono text-xs">{r.dms}</td><td className="font-mono text-xs">{r.utm}</td><td className="font-mono text-xs">{r.mgrs}</td><td className="font-mono text-xs">{r.geohash}</td><td className="font-mono text-xs">{r.plus}</td></tr>)}</tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Row({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={`flex items-center justify-between gap-2 rounded-lg border px-3 py-2 ${highlight ? "border-brand bg-brand-soft" : "border-line bg-well"}`}>
      <div className="min-w-0"><div className="text-[10px] font-bold uppercase tracking-wide text-mute">{label}</div><div className="break-all font-mono text-sm font-semibold">{value}</div></div>
      <CopyBtn text={value} label="" />
    </div>
  );
}
