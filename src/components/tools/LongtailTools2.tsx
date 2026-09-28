"use client";

import { ErrorBox } from "@/components/ui";
import { GisText2 } from "./LongtailGisText2";
import { PropertyGeometry2 } from "./LongtailPropertyGeometry2";
import { TimeAstro2 } from "./LongtailTimeAstro2";

const TIME_ASTRO_MODES = [
  "unix-to-local",
  "local-to-unix",
  "utc-offset-coordinates",
  "local-time-coordinates",
  "dst-checker-coordinates",
  "working-hours-overlap",
  "time-difference-zones",
  "civil-twilight",
  "nautical-twilight",
  "astronomical-twilight",
  "solar-noon",
  "sun-altitude",
  "sun-azimuth",
  "moon-phase-date",
  "moon-age",
  "moon-illumination",
  "next-full-moon",
  "next-new-moon",
];

const GIS_TEXT_MODES = [
  "wkt-validator",
  "wkt-bbox",
  "wkt-coordinate-count",
  "polyline-decode",
  "polyline-encode",
  "geojson-to-csv",
  "csv-to-geojson",
];

const PROPERTY_GEOMETRY_MODES = [
  "fence-length",
  "rectangle-acreage",
  "crop-row-length",
  "seed-quantity",
  "fertilizer-amount",
  "irrigation-coverage",
  "sprinkler-count",
  "stock-density",
  "circle-area-radius",
  "radius-from-area",
  "circumference-radius",
  "radius-from-circumference",
  "circle-overlap",
  "polygon-area-coordinates",
  "polygon-perimeter-coordinates",
  "polygon-centroid-coordinates",
  "coordinate-bbox-generator",
  "coordinate-radius-points",
];

export default function LongtailTools2({ params }: { params?: Record<string, unknown> }) {
  const mode = String(params?.mode || "");
  if (TIME_ASTRO_MODES.includes(mode)) return <TimeAstro2 mode={mode} />;
  if (GIS_TEXT_MODES.includes(mode)) return <GisText2 mode={mode} />;
  if (PROPERTY_GEOMETRY_MODES.includes(mode)) return <PropertyGeometry2 mode={mode} />;
  return <ErrorBox>This tool mode is not configured.</ErrorBox>;
}
