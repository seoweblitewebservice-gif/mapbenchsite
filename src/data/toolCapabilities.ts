/** Explicit capability boundaries for legacy URLs backed by general engines.
 * Keep these URLs alive without inventing functionality their engines lack. */
export interface CapabilityNote { available: string; unavailable: string; alternative?: string }
export const CAPABILITY_NOTES: Record<string, CapabilityNote> = {
  "tide-time-context": { available: "Solar events for a selected location and date", unavailable: "No tidal station, tidal harmonic model or tide-height forecast is queried here." },
  "weather-by-coordinates": { available: "Coordinate selection, formatting and map position", unavailable: "Live weather observations and forecasts are not included." },
  "air-quality-location": { available: "Coordinate selection and map position", unavailable: "This workspace does not query air-quality measurements or calculate an AQI." },
  "star-chart-location": { available: "Coordinates for a selected observing location", unavailable: "No star catalogue or sky-chart projection is rendered." },
  "historical-map-context": { available: "A modern coordinate map", unavailable: "No historical map layer or historical boundary date is selected." },
  "points-in-polygon-helper": { available: "Polygon drawing and area measurement", unavailable: "No separate point list is tested for polygon containment." },
  "wkt-geojson-helper": { available: "GeoJSON file viewing", unavailable: "WKT input is not parsed by this file viewer.", alternative: "wkt-validator" },
  "geojson-simplify-helper": { available: "GeoJSON geometry viewing", unavailable: "No simplification tolerance or topology-preserving simplifier is applied." },
  "distance-to-coast": { available: "Distance between two manually selected points", unavailable: "A nearest-coastline search is not performed." },
  "distance-to-poles": { available: "Distance between two selected points", unavailable: "The pole is not selected automatically; enter 90, 0 or −90, 0 as the second endpoint." },
  "fuel-stop-planner": { available: "Fuel quantity and cost for an entered trip", unavailable: "No fuel-station search or refuelling-stop optimization is performed." },
  "walk-score-radius": { available: "A geometric radius map", unavailable: "This is not the proprietary Walk Score metric and does not score pavement, crossings or pedestrian access.", alternative: "drive-time-map" },
  "ev-range-radius": { available: "A geometric circle at the selected distance", unavailable: "Battery state, elevation, charging locations and energy consumption are not modelled." },
  "delivery-radius-checker": { available: "A geometric radius around a selected centre", unavailable: "A circle does not certify road travel time or a merchant's delivery policy.", alternative: "drive-time-map" },
  "service-coverage-gap": { available: "Radius circles for visual comparison", unavailable: "No automatic uncovered-area or service-demand optimization is calculated." },
  "qr-location-helper": { available: "Coordinate formatting and external map links", unavailable: "This workspace does not generate a QR-code image." },
  "static-map-url-helper": { available: "Coordinate formatting and external map links", unavailable: "A static-image map API URL is not generated." },
  "printable-scale-bar-map": { available: "A custom pin map", unavailable: "This workspace does not calculate a calibrated print scale bar." },
};
