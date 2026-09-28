"use client";

import { useMemo, useState } from "react";
import { Field, Stat, ErrorBox } from "@/components/ui";

const EARTH_RADIUS_KM = 6371.0088;

const toRad = (degrees: number) => (degrees * Math.PI) / 180;
const toDeg = (radians: number) => (radians * 180) / Math.PI;
const parseNumber = (value: string) => (Number.isFinite(+value) ? +value : 0);
const formatNumber = (value: number, digits = 2) =>
  Number.isFinite(value) ? value.toFixed(digits) : "—";

function haversine(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
) {
  const p1 = toRad(a.lat);
  const p2 = toRad(b.lat);
  const dp = toRad(b.lat - a.lat);
  const dl = toRad(b.lng - a.lng);
  const h =
    Math.sin(dp / 2) ** 2 +
    Math.cos(p1) * Math.cos(p2) * Math.sin(dl / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(h));
}

function walkCoordinates(value: unknown, output: number[][] = []): number[][] {
  if (Array.isArray(value)) {
    if (
      value.length >= 2 &&
      typeof value[0] === "number" &&
      typeof value[1] === "number"
    ) {
      output.push([value[0], value[1]]);
    } else {
      value.forEach((item) => walkCoordinates(item, output));
    }
  } else if (value && typeof value === "object") {
    Object.values(value as Record<string, unknown>).forEach((item) =>
      walkCoordinates(item, output),
    );
  }
  return output;
}

function collectFeatures(value: any) {
  if (value?.type === "FeatureCollection") return value.features ?? [];
  if (value?.type === "Feature") return [value];
  if (value?.type)
    return [{ type: "Feature", properties: {}, geometry: value }];
  return [];
}

function collectSegments(coords: any, output: number[][][] = []): number[][][] {
  if (!Array.isArray(coords)) return output;
  if (
    coords.length &&
    Array.isArray(coords[0]) &&
    typeof coords[0][0] === "number"
  ) {
    output.push(coords);
  } else {
    coords.forEach((item: any) => collectSegments(item, output));
  }
  return output;
}

function sphericalRingAreaKm2(ring: number[][]) {
  if (ring.length < 3) return 0;
  let sum = 0;
  for (let i = 0; i < ring.length; i += 1) {
    const a = ring[i];
    const b = ring[(i + 1) % ring.length];
    sum +=
      toRad(b[0] - a[0]) *
      (2 + Math.sin(toRad(a[1])) + Math.sin(toRad(b[1])));
  }
  return (Math.abs(sum) * EARTH_RADIUS_KM * EARTH_RADIUS_KM) / 2;
}

type ResultCard = { label: string; value: string; sub?: string };

function TwoNumberCalculator({
  aLabel,
  bLabel,
  a0,
  b0,
  onCalculate,
}: {
  aLabel: string;
  bLabel: string;
  a0: number;
  b0: number;
  onCalculate: (a: number, b: number) => ResultCard[];
}) {
  const [a, setA] = useState(String(a0));
  const [b, setB] = useState(String(b0));
  const results = onCalculate(parseNumber(a), parseNumber(b));

  return (
    <div className="space-y-4">
      <div className="card grid gap-3 p-4 sm:grid-cols-2">
        <Field label={aLabel}>
          <input
            className="input"
            type="number"
            value={a}
            onChange={(event) => setA(event.target.value)}
          />
        </Field>
        <Field label={bLabel}>
          <input
            className="input"
            type="number"
            value={b}
            onChange={(event) => setB(event.target.value)}
          />
        </Field>
      </div>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {results.map((result) => (
          <Stat
            key={result.label}
            label={result.label}
            value={result.value}
            sub={result.sub}
          />
        ))}
      </div>
    </div>
  );
}

function CoordinateTextTool({ mode }: { mode: string }) {
  const [text, setText] = useState("40.7128, -74.0060");
  const result = useMemo(() => {
    const match = text
      .trim()
      .match(/^\s*([+-]?\d+(?:\.\d+)?)\s*[, ]\s*([+-]?\d+(?:\.\d+)?)\s*$/);
    if (!match) return null;
    const lat = +match[1];
    const lng = +match[2];
    return {
      lat,
      lng,
      valid: lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180,
    };
  }, [text]);

  return (
    <div className="space-y-3">
      <Field label="Coordinates">
        <input
          className="input"
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder="40.7128, -74.0060"
        />
      </Field>
      {result ? (
        <div className="grid gap-2 sm:grid-cols-3">
          <Stat label="Latitude" value={formatNumber(result.lat, 6)} />
          <Stat label="Longitude" value={formatNumber(result.lng, 6)} />
          <Stat
            label={
              mode === "coordinate-format-detector"
                ? "Detected format"
                : "Validation"
            }
            value={
              mode === "coordinate-format-detector"
                ? "Decimal degrees (lat, lng)"
                : result.valid
                  ? "Valid WGS84 range"
                  : "Out of range"
            }
          />
        </div>
      ) : (
        <ErrorBox>
          Enter decimal latitude and longitude separated by a comma or space.
        </ErrorBox>
      )}
    </div>
  );
}

function CoordinateMathTool({ mode }: { mode: string }) {
  if (mode === "coordinate-destination") {
    return <DestinationPointTool />;
  }

  if (mode === "coordinate-offset") {
    return (
      <TwoNumberCalculator
        aLabel="North/South offset (km)"
        bLabel="East/West offset (km)"
        a0={1}
        b0={1}
        onCalculate={(north, east) => [
          {
            label: "Approx. latitude change",
            value: `${formatNumber(north / 111.32, 6)}°`,
          },
          {
            label: "Approx. longitude change at equator",
            value: `${formatNumber(east / 111.32, 6)}°`,
          },
        ]}
      />
    );
  }

  if (mode === "lat-degree-km") {
    return (
      <TwoNumberCalculator
        aLabel="Degrees latitude"
        bLabel="Reference only"
        a0={1}
        b0={0}
        onCalculate={(degrees) => [
          {
            label: "Distance",
            value: `${formatNumber(degrees * 111.195, 3)} km`,
          },
          {
            label: "Miles",
            value: `${formatNumber(degrees * 69.093, 3)} mi`,
          },
        ]}
      />
    );
  }

  return (
    <TwoNumberCalculator
      aLabel="Degrees longitude"
      bLabel="Latitude (°)"
      a0={1}
      b0={45}
      onCalculate={(degrees, latitude) => {
        const km = degrees * 111.32 * Math.cos(toRad(latitude));
        return [
          { label: "Distance", value: `${formatNumber(Math.abs(km), 3)} km` },
          {
            label: "Miles",
            value: `${formatNumber(Math.abs(km) * 0.621371, 3)} mi`,
          },
        ];
      }}
    />
  );
}

function DestinationPointTool() {
  const [lat, setLat] = useState("40.7128");
  const [lng, setLng] = useState("-74.0060");
  const [bearing, setBearing] = useState("90");
  const [distance, setDistance] = useState("100");

  const result = useMemo(() => {
    const p1 = toRad(parseNumber(lat));
    const l1 = toRad(parseNumber(lng));
    const br = toRad(parseNumber(bearing));
    const angularDistance = parseNumber(distance) / EARTH_RADIUS_KM;
    const p2 = Math.asin(
      Math.sin(p1) * Math.cos(angularDistance) +
        Math.cos(p1) * Math.sin(angularDistance) * Math.cos(br),
    );
    const l2 =
      l1 +
      Math.atan2(
        Math.sin(br) * Math.sin(angularDistance) * Math.cos(p1),
        Math.cos(angularDistance) - Math.sin(p1) * Math.sin(p2),
      );
    return {
      lat: toDeg(p2),
      lng: ((toDeg(l2) + 540) % 360) - 180,
    };
  }, [lat, lng, bearing, distance]);

  return (
    <div className="space-y-4">
      <div className="card grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-4">
        <Field label="Start latitude">
          <input className="input" value={lat} onChange={(e) => setLat(e.target.value)} />
        </Field>
        <Field label="Start longitude">
          <input className="input" value={lng} onChange={(e) => setLng(e.target.value)} />
        </Field>
        <Field label="Bearing (°)">
          <input
            className="input"
            value={bearing}
            onChange={(e) => setBearing(e.target.value)}
          />
        </Field>
        <Field label="Distance (km)">
          <input
            className="input"
            value={distance}
            onChange={(e) => setDistance(e.target.value)}
          />
        </Field>
      </div>
      <Stat
        label="Destination coordinate"
        value={`${formatNumber(result.lat, 6)}, ${formatNumber(result.lng, 6)}`}
      />
    </div>
  );
}

function PaceTool({ mode }: { mode: string }) {
  if (mode === "hiking-time") {
    return (
      <TwoNumberCalculator
        aLabel="Distance (km)"
        bLabel="Elevation gain (m)"
        a0={10}
        b0={500}
        onCalculate={(distance, gain) => {
          const hours = distance / 5 + Math.max(0, gain) / 600;
          return [
            {
              label: "Naismith estimate",
              value: `${formatNumber(hours, 2)} h`,
              sub: "distance/5 + ascent/600",
            },
            { label: "Minutes", value: `${formatNumber(hours * 60, 0)} min` },
          ];
        }}
      />
    );
  }

  if (mode === "hiking-pace" || mode === "walking-pace") {
    return (
      <TwoNumberCalculator
        aLabel="Distance (km)"
        bLabel="Time (minutes)"
        a0={5}
        b0={60}
        onCalculate={(distance, minutes) => [
          {
            label: "Pace",
            value: distance > 0 ? `${formatNumber(minutes / distance, 2)} min/km` : "—",
          },
          {
            label: "Speed",
            value: minutes > 0 ? `${formatNumber(distance / (minutes / 60), 2)} km/h` : "—",
          },
        ]}
      />
    );
  }

  if (mode === "cycling-time") {
    return (
      <TwoNumberCalculator
        aLabel="Distance (km)"
        bLabel="Average speed (km/h)"
        a0={30}
        b0={20}
        onCalculate={(distance, speed) => [
          {
            label: "Ride time",
            value: speed > 0 ? `${formatNumber(distance / speed, 2)} h` : "—",
          },
          {
            label: "Minutes",
            value: speed > 0 ? `${formatNumber((distance / speed) * 60, 0)} min` : "—",
          },
        ]}
      />
    );
  }

  if (mode === "cycling-speed") {
    return (
      <TwoNumberCalculator
        aLabel="Distance (km)"
        bLabel="Time (minutes)"
        a0={20}
        b0={60}
        onCalculate={(distance, minutes) => [
          {
            label: "Average speed",
            value: minutes > 0 ? `${formatNumber(distance / (minutes / 60), 2)} km/h` : "—",
          },
          {
            label: "Pace",
            value: distance > 0 ? `${formatNumber(minutes / distance, 2)} min/km` : "—",
          },
        ]}
      />
    );
  }

  return (
    <TwoNumberCalculator
      aLabel="Body weight (kg)"
      bLabel="Distance (km)"
      a0={70}
      b0={5}
      onCalculate={(weight, distance) => {
        const factor = mode === "walk-calories" ? 0.55 : 0.32;
        return [
          {
            label: "Estimated calories",
            value: `${formatNumber(weight * distance * factor, 0)} kcal`,
            sub: "rough planning estimate",
          },
          {
            label: "Per km",
            value: `${formatNumber(weight * factor, 0)} kcal/km`,
          },
        ];
      }}
    />
  );
}

function LandTripTool({ mode }: { mode: string }) {
  const configs: Record<
    string,
    {
      aLabel: string;
      bLabel: string;
      a0: number;
      b0: number;
      calculate: (a: number, b: number) => ResultCard[];
    }
  > = {
    "land-cost-acre": {
      aLabel: "Total land price",
      bLabel: "Area (acres)",
      a0: 100000,
      b0: 5,
      calculate: (price, acres) => [
        { label: "Cost per acre", value: acres > 0 ? formatNumber(price / acres, 2) : "—" },
        {
          label: "Cost per hectare",
          value: acres > 0 ? formatNumber(price / (acres * 0.404686), 2) : "—",
        },
      ],
    },
    "land-cost-sqft": {
      aLabel: "Total property price",
      bLabel: "Lot area (sq ft)",
      a0: 250000,
      b0: 10000,
      calculate: (price, area) => [
        { label: "Cost per sq ft", value: area > 0 ? formatNumber(price / area, 2) : "—" },
        {
          label: "Cost per m²",
          value: area > 0 ? formatNumber(price / (area * 0.092903), 2) : "—",
        },
      ],
    },
    "trip-cost-person": {
      aLabel: "Total trip cost",
      bLabel: "People",
      a0: 600,
      b0: 4,
      calculate: (cost, people) => [
        { label: "Cost per person", value: people > 0 ? formatNumber(cost / people, 2) : "—" },
        { label: "Total", value: formatNumber(cost, 2) },
      ],
    },
    "fuel-needed": {
      aLabel: "Distance (km)",
      bLabel: "Fuel economy (L/100 km)",
      a0: 500,
      b0: 7,
      calculate: (distance, economy) => [
        { label: "Fuel needed", value: `${formatNumber((distance * economy) / 100, 2)} L` },
        {
          label: "US gallons",
          value: `${formatNumber((distance * economy) / 100 / 3.78541, 2)} gal`,
        },
      ],
    },
    "roundtrip-fuel": {
      aLabel: "One-way distance (km)",
      bLabel: "Fuel economy (L/100 km)",
      a0: 200,
      b0: 7,
      calculate: (distance, economy) => [
        { label: "Round-trip distance", value: `${formatNumber(distance * 2, 1)} km` },
        {
          label: "Fuel needed",
          value: `${formatNumber((distance * 2 * economy) / 100, 2)} L`,
        },
      ],
    },
    "liters-distance": {
      aLabel: "Distance (km)",
      bLabel: "Consumption (L/100 km)",
      a0: 300,
      b0: 8,
      calculate: (distance, economy) => [
        { label: "Liters required", value: `${formatNumber((distance * economy) / 100, 2)} L` },
      ],
    },
    "gallons-distance": {
      aLabel: "Distance (miles)",
      bLabel: "Fuel economy (MPG)",
      a0: 300,
      b0: 30,
      calculate: (distance, mpg) => [
        { label: "Gallons required", value: mpg > 0 ? `${formatNumber(distance / mpg, 2)} gal` : "—" },
      ],
    },
    "cost-mile": {
      aLabel: "Total cost",
      bLabel: "Distance (miles)",
      a0: 100,
      b0: 250,
      calculate: (cost, distance) => [
        { label: "Cost per mile", value: distance > 0 ? formatNumber(cost / distance, 3) : "—" },
      ],
    },
    "cost-km": {
      aLabel: "Total cost",
      bLabel: "Distance (km)",
      a0: 100,
      b0: 250,
      calculate: (cost, distance) => [
        { label: "Cost per km", value: distance > 0 ? formatNumber(cost / distance, 3) : "—" },
      ],
    },
    "knots-time": {
      aLabel: "Distance (nautical miles)",
      bLabel: "Speed (knots)",
      a0: 120,
      b0: 20,
      calculate: (distance, speed) => [
        { label: "Travel time", value: speed > 0 ? `${formatNumber(distance / speed, 2)} h` : "—" },
        {
          label: "Minutes",
          value: speed > 0 ? `${formatNumber((distance / speed) * 60, 0)} min` : "—",
        },
      ],
    },
  };

  const config = configs[mode];
  return (
    <TwoNumberCalculator
      aLabel={config.aLabel}
      bLabel={config.bLabel}
      a0={config.a0}
      b0={config.b0}
      onCalculate={config.calculate}
    />
  );
}

function EarthTool({ mode }: { mode: string }) {
  const configs: Record<
    string,
    {
      aLabel: string;
      bLabel: string;
      a0: number;
      b0: number;
      calculate: (a: number, b: number) => ResultCard[];
    }
  > = {
    "earth-bulge": {
      aLabel: "Chord / sightline distance (km)",
      bLabel: "Reference only",
      a0: 20,
      b0: 0,
      calculate: (distance) => {
        const half = (distance * 1000) / 2;
        const radiusM = EARTH_RADIUS_KM * 1000;
        const bulge = radiusM - Math.sqrt(radiusM ** 2 - half ** 2);
        return [
          { label: "Midpoint bulge", value: `${formatNumber(bulge, 2)} m` },
          { label: "Feet", value: `${formatNumber(bulge * 3.28084, 2)} ft` },
        ];
      },
    },
    "hidden-height": {
      aLabel: "Distance (km)",
      bLabel: "Observer height (m)",
      a0: 20,
      b0: 2,
      calculate: (distance, observerHeight) => {
        const drop = (distance * 1000) ** 2 / (2 * EARTH_RADIUS_KM * 1000);
        return [
          { label: "Curvature drop", value: `${formatNumber(drop, 2)} m` },
          {
            label: "Approx. hidden beyond observer height",
            value: `${formatNumber(Math.max(0, drop - observerHeight), 2)} m`,
          },
        ];
      },
    },
    fresnel: {
      aLabel: "Link distance (km)",
      bLabel: "Frequency (GHz)",
      a0: 10,
      b0: 5,
      calculate: (distance, frequency) => {
        const radius = 8.657 * Math.sqrt(Math.max(0, distance) / (4 * Math.max(0.001, frequency)));
        return [
          { label: "1st Fresnel radius at midpoint", value: `${formatNumber(radius, 2)} m` },
          { label: "60% clearance target", value: `${formatNumber(radius * 0.6, 2)} m` },
        ];
      },
    },
    "fresnel-clearance": {
      aLabel: "First Fresnel radius (m)",
      bLabel: "Available clearance (m)",
      a0: 10,
      b0: 6,
      calculate: (radius, clearance) => [
        { label: "Clearance", value: radius > 0 ? `${formatNumber((clearance / radius) * 100, 1)}%` : "—" },
        { label: "Typical target", value: "≥ 60%" },
      ],
    },
    "antenna-height": {
      aLabel: "Required radio horizon distance (km)",
      bLabel: "Other antenna height (m)",
      a0: 30,
      b0: 10,
      calculate: (distance, otherHeight) => {
        const needed = Math.max(0, distance / 4.12 - Math.sqrt(Math.max(0, otherHeight)));
        return [
          { label: "Required antenna 1 height", value: `${formatNumber(needed ** 2, 2)} m` },
          { label: "Model", value: "4/3-Earth horizon" },
        ];
      },
    },
    "pressure-elevation": {
      aLabel: "Elevation (m)",
      bLabel: "Sea-level pressure (hPa)",
      a0: 1000,
      b0: 1013.25,
      calculate: (height, p0) => {
        const pressure = p0 * (1 - 2.25577e-5 * height) ** 5.25588;
        return [
          { label: "Estimated pressure", value: `${formatNumber(pressure, 1)} hPa` },
          {
            label: "Percent of sea level",
            value: p0 > 0 ? `${formatNumber((pressure / p0) * 100, 1)}%` : "—",
          },
        ];
      },
    },
    "temp-elevation": {
      aLabel: "Elevation change (m)",
      bLabel: "Starting temperature (°C)",
      a0: 1000,
      b0: 20,
      calculate: (height, temperature) => [
        {
          label: "Standard lapse estimate",
          value: `${formatNumber(temperature - (height / 1000) * 6.5, 1)} °C`,
        },
        {
          label: "Temperature change",
          value: `${formatNumber(-(height / 1000) * 6.5, 1)} °C`,
        },
      ],
    },
  };

  const config = configs[mode];
  return (
    <TwoNumberCalculator
      aLabel={config.aLabel}
      bLabel={config.bLabel}
      a0={config.a0}
      b0={config.b0}
      onCalculate={config.calculate}
    />
  );
}

function GeoJsonTool({ mode }: { mode: string }) {
  const [text, setText] = useState(
    '{\n  "type": "FeatureCollection",\n  "features": []\n}',
  );

  const parsed = useMemo(() => {
    try {
      return { ok: true as const, value: JSON.parse(text) };
    } catch (error) {
      return {
        ok: false as const,
        error: error instanceof Error ? error.message : "Invalid JSON",
      };
    }
  }, [text]);

  const stats = useMemo(() => {
    if (!parsed.ok) return null;
    const features = collectFeatures(parsed.value);
    const coordinates = walkCoordinates(parsed.value);
    let lengthKm = 0;
    let areaKm2 = 0;

    for (const feature of features) {
      const geometry = feature.geometry;
      if (!geometry) continue;
      for (const segment of collectSegments(geometry.coordinates)) {
        for (let i = 1; i < segment.length; i += 1) {
          lengthKm += haversine(
            { lat: segment[i - 1][1], lng: segment[i - 1][0] },
            { lat: segment[i][1], lng: segment[i][0] },
          );
        }
        if (geometry.type === "Polygon" || geometry.type === "MultiPolygon") {
          areaKm2 += sphericalRingAreaKm2(segment);
        }
      }
    }

    const lngs = coordinates.map((coordinate) => coordinate[0]);
    const lats = coordinates.map((coordinate) => coordinate[1]);

    return {
      featureCount: features.length,
      coordinateCount: coordinates.length,
      bbox: coordinates.length
        ? [Math.min(...lngs), Math.min(...lats), Math.max(...lngs), Math.max(...lats)]
        : null,
      centroid: coordinates.length
        ? [
            lngs.reduce((sum, value) => sum + value, 0) / lngs.length,
            lats.reduce((sum, value) => sum + value, 0) / lats.length,
          ]
        : null,
      lengthKm,
      areaKm2,
    };
  }, [parsed]);

  if (mode === "geojson-format" || mode === "geojson-minify") {
    const output = parsed.ok
      ? JSON.stringify(parsed.value, null, mode === "geojson-format" ? 2 : 0)
      : "";

    return (
      <div className="space-y-3">
        <Field label="GeoJSON">
          <textarea
            className="input min-h-56 font-mono text-xs"
            value={text}
            onChange={(event) => setText(event.target.value)}
          />
        </Field>
        {parsed.ok ? (
          <Field label={mode === "geojson-format" ? "Formatted output" : "Minified output"}>
            <textarea
              readOnly
              className="input min-h-40 font-mono text-xs"
              value={output}
            />
          </Field>
        ) : (
          <ErrorBox>{parsed.error}</ErrorBox>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <Field label="GeoJSON">
        <textarea
          className="input min-h-56 font-mono text-xs"
          value={text}
          onChange={(event) => setText(event.target.value)}
        />
      </Field>
      {!parsed.ok ? (
        <ErrorBox>{parsed.error}</ErrorBox>
      ) : stats ? (
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {mode === "geojson-feature-count" && (
            <Stat label="Features" value={String(stats.featureCount)} />
          )}
          {mode === "geojson-coordinate-count" && (
            <Stat label="Coordinate pairs" value={String(stats.coordinateCount)} />
          )}
          {mode === "geojson-bbox" && (
            <Stat
              label="Bounding box"
              value={stats.bbox ? stats.bbox.map((v) => formatNumber(v, 5)).join(", ") : "—"}
            />
          )}
          {mode === "geojson-centroid" && (
            <Stat
              label="Mean coordinate centre"
              value={
                stats.centroid
                  ? `${formatNumber(stats.centroid[1], 5)}, ${formatNumber(stats.centroid[0], 5)}`
                  : "—"
              }
            />
          )}
          {mode === "geojson-area" && (
            <Stat label="Approx. polygon area" value={`${formatNumber(stats.areaKm2, 3)} km²`} />
          )}
          {mode === "geojson-length" && (
            <Stat label="Approx. line/ring length" value={`${formatNumber(stats.lengthKm, 3)} km`} />
          )}
        </div>
      ) : null}
    </div>
  );
}

async function parseGpx(file: File) {
  const text = await file.text();
  const doc = new DOMParser().parseFromString(text, "application/xml");
  if (doc.querySelector("parsererror")) throw new Error("Invalid GPX/XML file");

  const points = [...doc.querySelectorAll("trkpt,rtept")].map((point) => ({
    lat: +(point.getAttribute("lat") || 0),
    lng: +(point.getAttribute("lon") || 0),
    elevation: point.querySelector("ele")?.textContent
      ? +(point.querySelector("ele")?.textContent || 0)
      : null,
    time: point.querySelector("time")?.textContent
      ? new Date(point.querySelector("time")?.textContent || "")
      : null,
  }));

  return { doc, points };
}

function GpxTool({ mode }: { mode: string }) {
  const [data, setData] = useState<Awaited<ReturnType<typeof parseGpx>> | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = async (file?: File) => {
    if (!file) return;
    try {
      setData(await parseGpx(file));
      setError(null);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Invalid GPX");
    }
  };

  const stats = useMemo(() => {
    if (!data) return null;
    let distanceKm = 0;
    let gain = 0;
    let loss = 0;
    let maxSpeed = 0;

    for (let i = 1; i < data.points.length; i += 1) {
      const a = data.points[i - 1];
      const b = data.points[i];
      const distance = haversine(a, b);
      distanceKm += distance;

      if (a.elevation !== null && b.elevation !== null) {
        const delta = b.elevation - a.elevation;
        if (delta > 0) gain += delta;
        else loss -= delta;
      }

      if (a.time && b.time) {
        const hours = (b.time.getTime() - a.time.getTime()) / 3_600_000;
        if (hours > 0) maxSpeed = Math.max(maxSpeed, distance / hours);
      }
    }

    const times = data.points
      .map((point) => point.time?.getTime())
      .filter((value): value is number => Number.isFinite(value));
    const durationHours =
      times.length > 1 ? (Math.max(...times) - Math.min(...times)) / 3_600_000 : 0;

    return {
      distanceKm,
      gain,
      loss,
      durationHours,
      averageSpeed: durationHours > 0 ? distanceKm / durationHours : 0,
      maxSpeed,
      pointCount: data.points.length,
    };
  }, [data]);

  const downloadModified = (kind: "reverse" | "strip-time" | "strip-ele") => {
    if (!data) return;
    const clone = data.doc.cloneNode(true) as Document;

    if (kind === "reverse") {
      clone.querySelectorAll("trkseg").forEach((segment) => {
        [...segment.children].reverse().forEach((node) => segment.appendChild(node));
      });
    }
    if (kind === "strip-time") clone.querySelectorAll("time").forEach((node) => node.remove());
    if (kind === "strip-ele") clone.querySelectorAll("ele").forEach((node) => node.remove());

    const xml = new XMLSerializer().serializeToString(clone);
    const anchor = document.createElement("a");
    anchor.href = URL.createObjectURL(new Blob([xml], { type: "application/gpx+xml" }));
    anchor.download = `mapbench-${kind}.gpx`;
    anchor.click();
    URL.revokeObjectURL(anchor.href);
  };

  return (
    <div className="space-y-3">
      <Field label="GPX file">
        <input
          className="input"
          type="file"
          accept=".gpx,application/gpx+xml,application/xml,text/xml"
          onChange={(event) => load(event.target.files?.[0])}
        />
      </Field>
      {error && <ErrorBox>{error}</ErrorBox>}
      {stats && (
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {mode === "gpx-distance" && (
            <Stat label="Track distance" value={`${formatNumber(stats.distanceKm, 2)} km`} />
          )}
          {mode === "gpx-gain" && (
            <Stat label="Elevation gain" value={`${formatNumber(stats.gain, 0)} m`} />
          )}
          {mode === "gpx-loss" && (
            <Stat label="Elevation loss" value={`${formatNumber(stats.loss, 0)} m`} />
          )}
          {mode === "gpx-duration" && (
            <Stat label="Duration" value={`${formatNumber(stats.durationHours, 2)} h`} />
          )}
          {mode === "gpx-avg-speed" && (
            <Stat label="Average speed" value={`${formatNumber(stats.averageSpeed, 2)} km/h`} />
          )}
          {mode === "gpx-max-speed" && (
            <Stat label="Maximum segment speed" value={`${formatNumber(stats.maxSpeed, 2)} km/h`} />
          )}
          {mode === "gpx-point-count" && (
            <Stat label="Track / route points" value={String(stats.pointCount)} />
          )}
          {mode === "gpx-reverse" && (
            <button className="btn btn-primary" onClick={() => downloadModified("reverse")}>
              Download reversed GPX
            </button>
          )}
          {mode === "gpx-strip-time" && (
            <button className="btn btn-primary" onClick={() => downloadModified("strip-time")}>
              Download without timestamps
            </button>
          )}
          {mode === "gpx-strip-ele" && (
            <button className="btn btn-primary" onClick={() => downloadModified("strip-ele")}>
              Download without elevation
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default function LongtailTool({ params }: { params?: Record<string, unknown> }) {
  const mode = String(params?.mode || "");

  if (
    [
      "hiking-time",
      "hiking-pace",
      "walking-pace",
      "cycling-time",
      "cycling-speed",
      "walk-calories",
      "cycle-calories",
    ].includes(mode)
  ) {
    return <PaceTool mode={mode} />;
  }

  if (
    [
      "land-cost-acre",
      "land-cost-sqft",
      "trip-cost-person",
      "fuel-needed",
      "roundtrip-fuel",
      "liters-distance",
      "gallons-distance",
      "cost-mile",
      "cost-km",
      "knots-time",
    ].includes(mode)
  ) {
    return <LandTripTool mode={mode} />;
  }

  if (
    ["coordinate-destination", "coordinate-offset", "lat-degree-km", "lng-degree-km"].includes(
      mode,
    )
  ) {
    return <CoordinateMathTool mode={mode} />;
  }

  if (["coordinate-parser", "coordinate-format-detector", "latlng-validator"].includes(mode)) {
    return <CoordinateTextTool mode={mode} />;
  }

  if (mode.startsWith("geojson-")) return <GeoJsonTool mode={mode} />;
  if (mode.startsWith("gpx-")) return <GpxTool mode={mode} />;

  if (
    [
      "earth-bulge",
      "hidden-height",
      "fresnel",
      "fresnel-clearance",
      "antenna-height",
      "pressure-elevation",
      "temp-elevation",
    ].includes(mode)
  ) {
    return <EarthTool mode={mode} />;
  }

  return <ErrorBox>This calculator mode is not configured.</ErrorBox>;
}
