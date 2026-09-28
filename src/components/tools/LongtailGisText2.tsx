"use client";

import { useMemo, useState } from "react";
import { ErrorBox, Field, Stat } from "@/components/ui";

const fmt = (value: number, digits = 5) =>
  Number.isFinite(value) ? value.toFixed(digits) : "—";

function parseWkt(text: string) {
  const type = text.trim().match(/^([A-Z]+)\s*/i)?.[1]?.toUpperCase() ?? "";
  const pairs = [...text.matchAll(/(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)/g)].map(
    (match) => [Number(match[1]), Number(match[2])] as [number, number],
  );
  const supported = [
    "POINT",
    "LINESTRING",
    "POLYGON",
    "MULTIPOINT",
    "MULTILINESTRING",
    "MULTIPOLYGON",
  ];
  return { type, pairs, valid: supported.includes(type) && pairs.length > 0 };
}

function WktTool({ mode }: { mode: string }) {
  const [text, setText] = useState(
    "LINESTRING (-74.0060 40.7128, -73.9857 40.7484)",
  );
  const parsed = useMemo(() => parseWkt(text), [text]);
  const bbox = parsed.pairs.length
    ? [
        Math.min(...parsed.pairs.map((point) => point[0])),
        Math.min(...parsed.pairs.map((point) => point[1])),
        Math.max(...parsed.pairs.map((point) => point[0])),
        Math.max(...parsed.pairs.map((point) => point[1])),
      ]
    : null;

  return (
    <div className="space-y-3">
      <Field label="WKT geometry">
        <textarea
          className="input min-h-40 font-mono text-xs"
          value={text}
          onChange={(event) => setText(event.target.value)}
        />
      </Field>
      <div className="grid gap-2 sm:grid-cols-2">
        {mode === "wkt-validator" && (
          <Stat
            label="Validation"
            value={parsed.valid ? `Valid ${parsed.type} structure` : "Invalid / unsupported WKT"}
          />
        )}
        {mode === "wkt-bbox" && (
          <Stat
            label="Bounding box"
            value={bbox ? bbox.map((value) => fmt(value)).join(", ") : "—"}
          />
        )}
        {mode === "wkt-coordinate-count" && (
          <Stat label="Coordinate pairs" value={String(parsed.pairs.length)} />
        )}
      </div>
      <p className="text-xs text-mute">
        This is a structural browser-side check for common WKT geometry types, not a full OGC
        conformance validator.
      </p>
    </div>
  );
}

function decodePolyline(encoded: string) {
  let index = 0;
  let latitude = 0;
  let longitude = 0;
  const coordinates: Array<{ lat: number; lng: number }> = [];

  const readValue = () => {
    let result = 0;
    let shift = 0;
    let byte: number;
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
  while (encoded >= 0x20) {
    output += String.fromCharCode((0x20 | (encoded & 0x1f)) + 63);
    encoded >>= 5;
  }
  return output + String.fromCharCode(encoded + 63);
}

function parseCoordinateLines(text: string) {
  return text
    .split(/\r?\n|;/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => line.split(/[ ,]+/).map(Number))
    .filter(
      (pair) =>
        pair.length >= 2 &&
        Number.isFinite(pair[0]) &&
        Number.isFinite(pair[1]) &&
        Math.abs(pair[0]) <= 90 &&
        Math.abs(pair[1]) <= 180,
    )
    .map(([lat, lng]) => ({ lat, lng }));
}

function encodePolyline(points: Array<{ lat: number; lng: number }>) {
  let lastLat = 0;
  let lastLng = 0;
  let output = "";
  for (const point of points) {
    const lat = Math.round(point.lat * 1e5);
    const lng = Math.round(point.lng * 1e5);
    output += encodeSigned(lat - lastLat);
    output += encodeSigned(lng - lastLng);
    lastLat = lat;
    lastLng = lng;
  }
  return output;
}

function PolylineTool({ mode }: { mode: string }) {
  const [text, setText] = useState(
    mode === "polyline-decode"
      ? "_p~iF~ps|U_ulLnnqC_mqNvxq`@"
      : "38.5,-120.2\n40.7,-120.95\n43.252,-126.453",
  );

  const result = useMemo(() => {
    try {
      if (mode === "polyline-decode") {
        return {
          output: decodePolyline(text)
            .map((point) => `${fmt(point.lat)}, ${fmt(point.lng)}`)
            .join("\n"),
          error: "",
        };
      }
      const points = parseCoordinateLines(text);
      if (!points.length) throw new Error("Add at least one valid latitude, longitude pair");
      return { output: encodePolyline(points), error: "" };
    } catch (error) {
      return {
        output: "",
        error: error instanceof Error ? error.message : "Invalid input",
      };
    }
  }, [mode, text]);

  return (
    <div className="space-y-3">
      <Field label={mode === "polyline-decode" ? "Encoded polyline" : "Latitude, longitude points"}>
        <textarea
          className="input min-h-36 font-mono text-xs"
          value={text}
          onChange={(event) => setText(event.target.value)}
        />
      </Field>
      {result.error ? (
        <ErrorBox>{result.error}</ErrorBox>
      ) : (
        <Field label="Output">
          <textarea readOnly className="input min-h-36 font-mono text-xs" value={result.output} />
        </Field>
      )}
    </div>
  );
}

function csvEscape(value: unknown) {
  const text = String(value ?? "");
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function parseCsvLine(line: string) {
  const cells: string[] = [];
  let current = "";
  let quoted = false;
  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (char === '"') {
      if (quoted && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        quoted = !quoted;
      }
    } else if (char === "," && !quoted) {
      cells.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  cells.push(current);
  return cells;
}

function GeoCsvTool({ mode }: { mode: string }) {
  const [text, setText] = useState(
    mode === "geojson-to-csv"
      ? '{"type":"FeatureCollection","features":[{"type":"Feature","properties":{"name":"Example"},"geometry":{"type":"Point","coordinates":[-74.006,40.7128]}}]}'
      : "name,latitude,longitude\nExample,40.7128,-74.0060",
  );

  const result = useMemo(() => {
    try {
      if (mode === "geojson-to-csv") {
        const object = JSON.parse(text);
        const features = object?.type === "FeatureCollection" ? object.features ?? [] : [];
        const pointFeatures = features.filter((feature: any) => feature?.geometry?.type === "Point");
        const propertyKeys = Array.from(
          new Set<string>(
            pointFeatures.flatMap((feature: any) => Object.keys(feature.properties ?? {})),
          ),
        );
        const header = [...propertyKeys, "latitude", "longitude"];
        const rows = pointFeatures.map((feature: any) => {
          const [lng, lat] = feature.geometry.coordinates;
          return [
            ...propertyKeys.map((key) => csvEscape(feature.properties?.[key])),
            csvEscape(lat),
            csvEscape(lng),
          ].join(",");
        });
        return { output: [header.join(","), ...rows].join("\n"), error: "" };
      }

      const lines = text.trim().split(/\r?\n/).filter(Boolean);
      if (lines.length < 2) throw new Error("CSV needs a header and at least one data row");
      const headers = parseCsvLine(lines[0]).map((header) => header.trim());
      const latIndex = headers.findIndex((header) => /^lat(itude)?$/i.test(header));
      const lngIndex = headers.findIndex((header) => /^(lng|lon|longitude)$/i.test(header));
      if (latIndex < 0 || lngIndex < 0)
        throw new Error("CSV needs latitude and longitude columns");

      const features = lines.slice(1).map((line) => {
        const cells = parseCsvLine(line);
        const lat = Number(cells[latIndex]);
        const lng = Number(cells[lngIndex]);
        if (!Number.isFinite(lat) || !Number.isFinite(lng))
          throw new Error("One or more rows contain invalid coordinates");
        const properties: Record<string, string> = {};
        headers.forEach((header, index) => {
          if (index !== latIndex && index !== lngIndex) properties[header] = cells[index] ?? "";
        });
        return {
          type: "Feature" as const,
          properties,
          geometry: { type: "Point" as const, coordinates: [lng, lat] },
        };
      });
      return {
        output: JSON.stringify({ type: "FeatureCollection", features }, null, 2),
        error: "",
      };
    } catch (error) {
      return {
        output: "",
        error: error instanceof Error ? error.message : "Invalid input",
      };
    }
  }, [mode, text]);

  return (
    <div className="space-y-3">
      <Field label={mode === "geojson-to-csv" ? "GeoJSON Point features" : "CSV with latitude/longitude columns"}>
        <textarea
          className="input min-h-52 font-mono text-xs"
          value={text}
          onChange={(event) => setText(event.target.value)}
        />
      </Field>
      {result.error ? (
        <ErrorBox>{result.error}</ErrorBox>
      ) : (
        <Field label="Converted output">
          <textarea readOnly className="input min-h-52 font-mono text-xs" value={result.output} />
        </Field>
      )}
    </div>
  );
}

export function GisText2({ mode }: { mode: string }) {
  if (["wkt-validator", "wkt-bbox", "wkt-coordinate-count"].includes(mode)) {
    return <WktTool mode={mode} />;
  }
  if (["polyline-decode", "polyline-encode"].includes(mode)) {
    return <PolylineTool mode={mode} />;
  }
  return <GeoCsvTool mode={mode} />;
}
