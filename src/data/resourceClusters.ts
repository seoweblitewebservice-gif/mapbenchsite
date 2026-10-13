export interface ResourceLink {
  href: string;
  label: string;
  note: string;
  kind: "Guide" | "Study";
}

export const RESOURCE_CLUSTERS: Record<string, ResourceLink[]> = {
  radius: [
    { href: "/guides/radius-vs-drive-time-vs-straight-line-distance", label: "Radius vs. Drive Time vs. Straight-Line Distance", note: "Choose the correct geographic model before using a radius result.", kind: "Guide" },
    { href: "/studies/major-city-density-within-500km", label: "Major-City Density Within 500 km", note: "See a fixed-radius method applied across the MapBench city dataset.", kind: "Study" },
  ],
  distance: [
    { href: "/guides/how-distance-calculation-works", label: "Distance Calculation: Haversine, Geodesics & When It Matters", note: "Understand the spherical distance model, ellipsoidal alternatives and when precision matters.", kind: "Guide" },
    { href: "/guides/radius-vs-drive-time-vs-straight-line-distance", label: "Radius vs. Drive Time vs. Straight-Line Distance", note: "Understand when straight-line separation is the right metric.", kind: "Guide" },
    { href: "/studies/most-isolated-major-cities", label: "Most Isolated Major Cities", note: "A reproducible nearest-neighbour study built from great-circle distances.", kind: "Study" },
  ],
  routing: [
    { href: "/guides/radius-vs-drive-time-vs-straight-line-distance", label: "Radius vs. Drive Time vs. Straight-Line Distance", note: "Compare network travel-time models with geometric distance.", kind: "Guide" },
    { href: "/guides/how-to-choose-a-meeting-point-between-places", label: "How to Choose a Meeting Point Between Places", note: "Use route context instead of assuming the geometric midpoint is fairest.", kind: "Guide" },
    { href: "/guides/how-distance-calculation-works", label: "Distance Calculation: Haversine, Geodesics & When It Matters", note: "See why route distance and straight-line distance answer different questions.", kind: "Guide" },
  ],
  coordinates: [
    { href: "/guides/understanding-gps-coordinates", label: "Understanding GPS Coordinates: Formats, Datums and Precision", note: "Learn coordinate formats, datum differences, axis order and realistic decimal precision.", kind: "Guide" },
    { href: "/guides/map-projections-explained", label: "Map Projections Explained", note: "Learn why coordinate systems and map projections change how locations are represented.", kind: "Guide" },
    { href: "/studies/closest-major-cities-to-antipodes", label: "Cities Closest to Their Antipodes", note: "A practical example of coordinate transformation and global geometry.", kind: "Study" },
  ],
  earth: [
    { href: "/guides/map-projections-explained", label: "Map Projections Explained", note: "Understand how the curved Earth becomes a flat map and where distortion appears.", kind: "Guide" },
    { href: "/guides/how-distance-calculation-works", label: "Distance Calculation: Haversine, Geodesics & When It Matters", note: "Useful background for Earth-scale distance and curvature calculations.", kind: "Guide" },
    { href: "/studies/closest-major-cities-to-antipodes", label: "Cities Closest to Their Antipodes", note: "Explore an Earth-scale geometry question using opposite points on the globe.", kind: "Study" },
  ],
  creation: [
    { href: "/guides/map-projections-explained", label: "Map Projections Explained", note: "Pick a map representation that fits the geographic task instead of styling first.", kind: "Guide" },
  ],
  files: [
    { href: "/guides/kml-vs-geojson-vs-gpx", label: "KML vs. GeoJSON vs. GPX: Choosing the Right Map File Format", note: "Compare the strengths, losses and best uses of the most common geographic file formats.", kind: "Guide" },
    { href: "/guides/understanding-gps-coordinates", label: "Understanding GPS Coordinates: Formats, Datums and Precision", note: "Useful when file coordinates appear swapped, over-precise or tied to an unexpected datum.", kind: "Guide" },
    { href: "/guides/map-projections-explained", label: "Map Projections Explained", note: "Useful context when imported spatial files use different coordinate systems or projections.", kind: "Guide" },
  ],
  population: [
    { href: "/studies/major-city-density-within-500km", label: "Major-City Density Within 500 km", note: "See how MapBench applies a documented city dataset to a population-adjacent spatial question.", kind: "Study" },
    { href: "/studies/most-isolated-major-cities", label: "Most Isolated Major Cities", note: "Compare city spacing without confusing the dataset with a complete census of settlement.", kind: "Study" },
  ],
  location: [
    { href: "/guides/understanding-gps-coordinates", label: "Understanding GPS Coordinates: Formats, Datums and Precision", note: "Understand the coordinate conventions behind location results and GPS fixes.", kind: "Guide" },
    { href: "/guides/how-to-choose-a-meeting-point-between-places", label: "How to Choose a Meeting Point Between Places", note: "Combine location context with distance and routing when choosing a practical place.", kind: "Guide" },
  ],
  sun: [],
  lines: [
    { href: "/guides/understanding-gps-coordinates", label: "Understanding GPS Coordinates: Formats, Datums and Precision", note: "Useful background for latitude, longitude, hemispheres and geographic reference lines.", kind: "Guide" },
    { href: "/guides/how-to-measure-land-area-on-a-map", label: "How to Measure Land Area on a Map", note: "Useful context for tracing boundaries and interpreting drawn geometry.", kind: "Guide" },
  ],
  network: [
    { href: "/guides/radius-vs-drive-time-vs-straight-line-distance", label: "Radius vs. Drive Time vs. Straight-Line Distance", note: "Choose the network or geometric model that actually matches the question.", kind: "Guide" },
  ],
};

export const TOOL_RESOURCE_OVERRIDES: Record<string, ResourceLink[]> = {
  "map-area-calculator": [
    { href: "/guides/how-to-measure-land-area-on-a-map", label: "How to Measure Land Area on a Map", note: "A deeper workflow for tracing land, converting units and knowing when a map estimate is not enough.", kind: "Guide" },
  ],
  "lot-size-calculator": [
    { href: "/guides/how-to-measure-land-area-on-a-map", label: "How to Measure Land Area on a Map", note: "Practical guidance for acreage, hectares and parcel-style estimates.", kind: "Guide" },
  ],
  "polygon-area-calculator": [
    { href: "/guides/how-to-measure-land-area-on-a-map", label: "How to Measure Land Area on a Map", note: "Learn how boundary tracing affects the final polygon area.", kind: "Guide" },
  ],
  "halfway-between-two-places": [
    { href: "/guides/how-to-choose-a-meeting-point-between-places", label: "How to Choose a Meeting Point Between Places", note: "Turn a geometric midpoint into a practical meeting-location workflow.", kind: "Guide" },
  ],
  "distance-between-two-places": [
    { href: "/guides/how-distance-calculation-works", label: "Distance Calculation: Haversine, Geodesics & When It Matters", note: "See how straight-line distance is calculated on a curved Earth and where spherical approximations differ from ellipsoidal geodesics.", kind: "Guide" },
    { href: "/guides/radius-vs-drive-time-vs-straight-line-distance", label: "Radius vs. Drive Time vs. Straight-Line Distance", note: "Understand what straight-line distance means before comparing it with road travel.", kind: "Guide" },
    { href: "/studies/most-isolated-major-cities", label: "Most Isolated Major Cities", note: "See the same great-circle method used across every city pair in an original study.", kind: "Study" },
  ],
  "map-radius": [
    { href: "/guides/radius-vs-drive-time-vs-straight-line-distance", label: "Radius vs. Drive Time vs. Straight-Line Distance", note: "Learn exactly when a radius is the correct model.", kind: "Guide" },
    { href: "/studies/major-city-density-within-500km", label: "Major-City Density Within 500 km", note: "See a fixed-radius analysis applied across many cities.", kind: "Study" },
  ],
  "coordinate-converter": [
    { href: "/guides/understanding-gps-coordinates", label: "Understanding GPS Coordinates: Formats, Datums and Precision", note: "Understand coordinate notation, decimal precision and datum assumptions before converting formats.", kind: "Guide" },
    { href: "/guides/map-projections-explained", label: "Map Projections Explained", note: "Understand the difference between coordinate notation, datum and map projection.", kind: "Guide" },
    { href: "/studies/closest-major-cities-to-antipodes", label: "Cities Closest to Their Antipodes", note: "A global example of coordinate transformation and distance checking.", kind: "Study" },
  ],
  "gpx-viewer": [
    { href: "/guides/kml-vs-geojson-vs-gpx", label: "KML vs. GeoJSON vs. GPX: Choosing the Right Map File Format", note: "Understand what GPX preserves well and what can be lost when converting to other map formats.", kind: "Guide" },
  ],
  "csv-to-map": [
    { href: "/guides/understanding-gps-coordinates", label: "Understanding GPS Coordinates: Formats, Datums and Precision", note: "Check latitude/longitude order, numeric ranges and realistic precision before mapping a spreadsheet.", kind: "Guide" },
    { href: "/guides/kml-vs-geojson-vs-gpx", label: "KML vs. GeoJSON vs. GPX: Choosing the Right Map File Format", note: "See when CSV should remain tabular and when a geographic exchange format is more appropriate.", kind: "Guide" },
  ],
};
