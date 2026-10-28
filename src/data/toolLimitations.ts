/** Limitations confirmed against the currently registered workspace implementations. */
export const TOOL_WORKSPACE_LIMITATIONS: Record<string, string> = {
  "wkt-geojson-helper": "This workspace displays GeoJSON only; it does not parse or convert WKT.",
  "geojson-simplify-helper": "This workspace displays GeoJSON but does not simplify geometries, count vertices or provide a tolerance control.",
  "gpx-speed-pace-helper": "This workspace displays GPX geometry, distance and timestamp span. It does not calculate moving time, speed or pace.",
  "gars-converter": "This workspace currently converts coordinates to several common formats, but it does not encode or decode GARS references.",
  "bng-converter": "This workspace currently converts WGS84 coordinates and common global formats; it does not convert British National Grid references or perform an OSGB36 datum transformation.",
  "irish-grid-helper": "This workspace currently converts WGS84 coordinates and common global formats; it does not convert Irish Grid references or perform an Irish datum transformation.",
  "state-plane-helper": "This workspace currently converts WGS84 coordinates and common global formats; it does not convert US State Plane coordinates or apply a State Plane datum transformation.",
  "h3-index-helper": "This workspace currently converts coordinates to common formats, but it does not calculate or decode H3 cell indexes.",
  "quadkey-tile-helper": "This workspace currently converts coordinates to common formats, but it does not calculate or decode XYZ tile coordinates or quadkeys.",
  "trail-distance-estimator": "This workspace measures straight-line distance between two points; it does not measure a drawn multi-segment trail. Use a route or file tool when you need path length.",
};
