"use client";

import { useMemo, useState } from "react";
import { downloadText, toCsv } from "@/lib/formats";
import { CopyBtn, ErrorBox, Field, Stat } from "@/components/ui";

const fmt = (value: number, digits = 5) => Number.isFinite(value) ? value.toFixed(digits) : "—";

type Pair = [number, number];

function bboxOfPairs(pairs: Pair[]) {
  if (!pairs.length) return null;
  const xs = pairs.map((point) => point[0]);
  const ys = pairs.map((point) => point[1]);
  return {
    west: Math.min(...xs), south: Math.min(...ys), east: Math.max(...xs), north: Math.max(...ys),
  };
}

function parseWkt(text: string) {
  const trimmed = text.trim();
  const type = trimmed.match(/^([A-Z]+)\s*/i)?.[1]?.toUpperCase() ?? "";
  const pairs = [...trimmed.matchAll(/(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)/g)].map(
    (match) => [Number(match[1]), Number(match[2])] as Pair,
  );
  const supported = ["POINT", "LINESTRING", "POLYGON", "MULTIPOINT", "MULTILINESTRING", "MULTIPOLYGON"];
  const parenBalance = [...trimmed].reduce((n, c) => n + (c === "(" ? 1 : c === ")" ? -1 : 0), 0);
  const valid = supported.includes(type) && pairs.length > 0 && parenBalance === 0 && !/NaN|Infinity/i.test(trimmed);
  return { type, pairs, valid, supported: supported.includes(type), parenBalance };
}

const WKT_EXAMPLES = {
  POINT: "POINT (-74.0060 40.7128)",
  LINESTRING: "LINESTRING (-74.0060 40.7128, -73.9857 40.7484, -73.9712 40.7831)",
  POLYGON: "POLYGON ((-74.0100 40.7000, -73.9800 40.7000, -73.9800 40.7250, -74.0100 40.7250, -74.0100 40.7000))",
};

function WktTool({ mode }: { mode: string }) {
  const [text, setText] = useState(WKT_EXAMPLES.LINESTRING);
  const parsed = useMemo(() => parseWkt(text), [text]);
  const bbox = useMemo(() => bboxOfPairs(parsed.pairs), [parsed.pairs]);
  const coordsCsv = useMemo(() => toCsv(["index", "x_or_longitude", "y_or_latitude"], parsed.pairs.map((p, i) => [String(i + 1), String(p[0]), String(p[1])])), [parsed.pairs]);

  const status = !parsed.supported
    ? "Unsupported geometry type"
    : parsed.parenBalance !== 0
      ? "Unbalanced parentheses"
      : parsed.valid ? `Valid ${parsed.type} structure` : "Invalid WKT structure";

  return (
    <div className="space-y-4">
      <div className="card p-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            {Object.entries(WKT_EXAMPLES).map(([label, value]) => <button key={label} type="button" className="btn btn-ghost btn-sm" onClick={() => setText(value)}>{label}</button>)}
          </div>
          <div className="flex flex-wrap gap-2">
            <CopyBtn text={text} label="Copy WKT" />
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => downloadText("mapbench-geometry.wkt", text, "text/plain")}>Download WKT</button>
          </div>
        </div>
        <div className="mt-3">
          <Field label="WKT geometry" hint="Browser-side structural inspection for common WKT geometry types.">
            <textarea className="textarea min-h-44 font-mono text-xs" value={text} onChange={(event) => setText(event.target.value)} spellCheck={false} />
          </Field>
        </div>
      </div>

      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Geometry type" value={parsed.type || "—"} />
        <Stat label="Coordinate pairs" value={String(parsed.pairs.length)} />
        <Stat label="Structure" value={status} />
        <Stat label="Parentheses" value={parsed.parenBalance === 0 ? "Balanced" : `Off by ${parsed.parenBalance}`} />
      </div>

      {bbox && (
        <div className="card p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div><div className="label !mb-0">Bounding box</div><div className="mt-1 font-mono text-sm">{fmt(bbox.west)}, {fmt(bbox.south)}, {fmt(bbox.east)}, {fmt(bbox.north)}</div></div>
            <div className="flex gap-2"><CopyBtn text={`${bbox.west}, ${bbox.south}, ${bbox.east}, ${bbox.north}`} label="Copy bbox" /><button type="button" className="btn btn-ghost btn-sm" onClick={() => downloadText("mapbench-wkt-coordinates.csv", coordsCsv, "text/csv")}>Coordinates CSV</button></div>
          </div>
          <div className="mt-3 grid gap-2 sm:grid-cols-2"><Stat label="X / longitude span" value={fmt(bbox.east - bbox.west, 6)} /><Stat label="Y / latitude span" value={fmt(bbox.north - bbox.south, 6)} /></div>
        </div>
      )}

      {mode === "wkt-validator" && !parsed.valid && <ErrorBox>{status}. This checker intentionally does not claim full OGC conformance.</ErrorBox>}
      {mode === "wkt-bbox" && !bbox && <ErrorBox>No coordinate pairs were found.</ErrorBox>}
      {mode === "wkt-coordinate-count" && parsed.pairs.length === 0 && <ErrorBox>No coordinate pairs were found.</ErrorBox>}
      <p className="text-xs leading-relaxed text-mute">This is a structural browser-side check for common WKT geometry types. It does not validate topology, ring orientation, CRS metadata or every OGC WKT edge case.</p>
    </div>
  );
}

function decodePolyline(encoded: string) {
  let index = 0, latitude = 0, longitude = 0;
  const coordinates: Array<{ lat: number; lng: number }> = [];
  const readValue = () => {
    let result = 0, shift = 0, byte: number;
    do {
      if (index >= encoded.length) throw new Error("Incomplete encoded polyline");
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);
    return result & 1 ? ~(result >> 1) : result >> 1;
  };
  while (index < encoded.length) {
    latitude += readValue();
    longitude += readValue();
    coordinates.push({ lat: latitude / 1e5, lng: longitude / 1e5 });
  }
  return coordinates;
}

function encodeSigned(value: number) {
  let encoded = value < 0 ? ~(value << 1) : value << 1;
  let output = "";
  while (encoded >= 0x20) { output += String.fromCharCode((0x20 | (encoded & 0x1f)) + 63); encoded >>= 5; }
  return output + String.fromCharCode(encoded + 63);
}

function parseCoordinateLines(text: string) {
  return text.split(/\r?\n|;/).map((line) => line.trim()).filter(Boolean).map((line) => line.split(/[ ,]+/).map(Number)).filter((pair) => pair.length >= 2 && Number.isFinite(pair[0]) && Number.isFinite(pair[1]) && Math.abs(pair[0]) <= 90 && Math.abs(pair[1]) <= 180).map(([lat, lng]) => ({ lat, lng }));
}

function encodePolyline(points: Array<{ lat: number; lng: number }>) {
  let lastLat = 0, lastLng = 0, output = "";
  for (const point of points) {
    const lat = Math.round(point.lat * 1e5), lng = Math.round(point.lng * 1e5);
    output += encodeSigned(lat - lastLat) + encodeSigned(lng - lastLng);
    lastLat = lat; lastLng = lng;
  }
  return output;
}

function PolylineTool({ mode }: { mode: string }) {
  const [text, setText] = useState(mode === "polyline-decode" ? "_p~iF~ps|U_ulLnnqC_mqNvxq`@" : "38.5,-120.2\n40.7,-120.95\n43.252,-126.453");
  const result = useMemo(() => {
    try {
      const points = mode === "polyline-decode" ? decodePolyline(text) : parseCoordinateLines(text);
      if (!points.length) throw new Error("Add valid coordinate data.");
      const output = mode === "polyline-decode" ? points.map((p) => `${fmt(p.lat)}, ${fmt(p.lng)}`).join("\n") : encodePolyline(points);
      const pairs = points.map((p) => [p.lng, p.lat] as Pair);
      return { points, output, bbox: bboxOfPairs(pairs), error: "" };
    } catch (error) {
      return { points: [] as Array<{lat:number;lng:number}>, output: "", bbox: null, error: error instanceof Error ? error.message : "Invalid input" };
    }
  }, [mode, text]);

  const outputCsv = toCsv(["index", "latitude", "longitude"], result.points.map((p, i) => [String(i + 1), String(p.lat), String(p.lng)]));

  return (
    <div className="space-y-4">
      <div className="card p-4">
        <Field label={mode === "polyline-decode" ? "Encoded polyline" : "Latitude, longitude points"}>
          <textarea className="textarea min-h-40 font-mono text-xs" value={text} onChange={(event) => setText(event.target.value)} spellCheck={false} />
        </Field>
      </div>
      {result.error ? <ErrorBox>{result.error}</ErrorBox> : <>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          <Stat label="Points" value={String(result.points.length)} />
          <Stat label="Input characters" value={String(text.length)} />
          <Stat label="Output characters" value={String(result.output.length)} />
          <Stat label="Compression view" value={mode === "polyline-encode" && text.length ? `${fmt((1 - result.output.length / text.length) * 100, 1)}% shorter` : "Decoded coordinates"} />
        </div>
        {result.bbox && <div className="card p-3 text-xs text-mute"><strong className="text-ink">Bounds:</strong> {fmt(result.bbox.west)}, {fmt(result.bbox.south)} → {fmt(result.bbox.east)}, {fmt(result.bbox.north)}</div>}
        <div className="card p-4">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2"><div className="label !mb-0">Output</div><div className="flex gap-2"><CopyBtn text={result.output} label="Copy output" />{mode === "polyline-decode" && <button type="button" className="btn btn-ghost btn-sm" onClick={() => downloadText("mapbench-polyline-points.csv", outputCsv, "text/csv")}>CSV</button>}<button type="button" className="btn btn-ghost btn-sm" onClick={() => downloadText(mode === "polyline-decode" ? "mapbench-decoded-polyline.txt" : "mapbench-encoded-polyline.txt", result.output, "text/plain")}>TXT</button></div></div>
          <textarea readOnly className="textarea min-h-40 font-mono text-xs" value={result.output} />
        </div>
      </>}
    </div>
  );
}

function csvEscape(value: unknown) {
  const text = String(value ?? "");
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function parseCsvLine(line: string) {
  const cells: string[] = [];
  let current = "", quoted = false;
  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (char === '"') {
      if (quoted && line[i + 1] === '"') { current += '"'; i += 1; } else quoted = !quoted;
    } else if (char === "," && !quoted) { cells.push(current); current = ""; } else current += char;
  }
  cells.push(current);
  return cells;
}

function GeoCsvTool({ mode }: { mode: string }) {
  const [text, setText] = useState(mode === "geojson-to-csv"
    ? '{"type":"FeatureCollection","features":[{"type":"Feature","properties":{"name":"Example"},"geometry":{"type":"Point","coordinates":[-74.006,40.7128]}}]}'
    : "name,latitude,longitude\nExample,40.7128,-74.0060");

  const result = useMemo(() => {
    try {
      if (mode === "geojson-to-csv") {
        const object = JSON.parse(text);
        const features = object?.type === "FeatureCollection" ? object.features ?? [] : [];
        const pointFeatures = features.filter((feature: any) => feature?.geometry?.type === "Point" && Array.isArray(feature.geometry.coordinates));
        const skipped = features.length - pointFeatures.length;
        const propertyKeys = Array.from(new Set<string>(pointFeatures.flatMap((feature: any) => Object.keys(feature.properties ?? {}))));
        const header = [...propertyKeys, "latitude", "longitude"];
        const rows = pointFeatures.map((feature: any) => {
          const [lng, lat] = feature.geometry.coordinates;
          return [...propertyKeys.map((key) => csvEscape(feature.properties?.[key])), csvEscape(lat), csvEscape(lng)].join(",");
        });
        return { output: [header.join(","), ...rows].join("\n"), count: pointFeatures.length, skipped, columns: header.length, error: "" };
      }

      const lines = text.trim().split(/\r?\n/).filter(Boolean);
      if (lines.length < 2) throw new Error("CSV needs a header and at least one data row");
      const headers = parseCsvLine(lines[0]).map((header) => header.trim());
      const latIndex = headers.findIndex((header) => /^lat(itude)?$/i.test(header));
      const lngIndex = headers.findIndex((header) => /^(lng|lon|longitude)$/i.test(header));
      if (latIndex < 0 || lngIndex < 0) throw new Error("CSV needs latitude and longitude columns");

      let skipped = 0;
      const features = lines.slice(1).flatMap((line) => {
        const cells = parseCsvLine(line);
        const lat = Number(cells[latIndex]), lng = Number(cells[lngIndex]);
        if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) { skipped += 1; return []; }
        const properties: Record<string, string> = {};
        headers.forEach((header, index) => { if (index !== latIndex && index !== lngIndex) properties[header] = cells[index] ?? ""; });
        return [{ type: "Feature" as const, properties, geometry: { type: "Point" as const, coordinates: [lng, lat] } }];
      });
      return { output: JSON.stringify({ type: "FeatureCollection", features }, null, 2), count: features.length, skipped, columns: headers.length, error: "" };
    } catch (error) {
      return { output: "", count: 0, skipped: 0, columns: 0, error: error instanceof Error ? error.message : "Invalid input" };
    }
  }, [mode, text]);

  const extension = mode === "geojson-to-csv" ? "csv" : "geojson";
  const mime = mode === "geojson-to-csv" ? "text/csv" : "application/geo+json";

  return (
    <div className="space-y-4">
      <div className="card p-4">
        <Field label={mode === "geojson-to-csv" ? "GeoJSON Point features" : "CSV with latitude/longitude columns"}>
          <textarea className="textarea min-h-56 font-mono text-xs" value={text} onChange={(event) => setText(event.target.value)} spellCheck={false} />
        </Field>
      </div>
      {result.error ? <ErrorBox>{result.error}</ErrorBox> : <>
        <div className="grid gap-2 sm:grid-cols-3"><Stat label="Converted records" value={String(result.count)} /><Stat label="Skipped records" value={String(result.skipped)} /><Stat label="Detected columns" value={String(result.columns)} /></div>
        {result.skipped > 0 && <div className="rounded-xl border border-line bg-well/50 px-3 py-2 text-xs text-mute">Invalid coordinates or unsupported non-Point geometries were skipped rather than silently converted incorrectly.</div>}
        <div className="card p-4">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2"><div className="label !mb-0">Converted output</div><div className="flex gap-2"><CopyBtn text={result.output} label="Copy output" /><button type="button" className="btn btn-primary btn-sm" onClick={() => downloadText(`mapbench-converted.${extension}`, result.output, mime)}>Download {extension.toUpperCase()}</button></div></div>
          <textarea readOnly className="textarea min-h-56 font-mono text-xs" value={result.output} />
        </div>
      </>}
    </div>
  );
}

export function GisText2({ mode }: { mode: string }) {
  if (["wkt-validator", "wkt-bbox", "wkt-coordinate-count"].includes(mode)) return <WktTool mode={mode} />;
  if (["polyline-decode", "polyline-encode"].includes(mode)) return <PolylineTool mode={mode} />;
  return <GeoCsvTool mode={mode} />;
}
