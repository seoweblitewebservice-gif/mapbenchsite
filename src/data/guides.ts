// Editorial guides — genuinely useful reference content, no filler.

export type GuideBlock =
  | { t: "h2"; text: string }
  | { t: "p"; text: string }
  | { t: "ul"; items: string[] }
  | { t: "note"; text: string }
  | { t: "toolbox"; slugs: string[] };

export interface Guide {
  slug: string;
  title: string;
  description: string;
  date: string;
  readMins: number;
  blocks: GuideBlock[];
}

export const GUIDES: Guide[] = [
  {
    slug: "understanding-gps-coordinates",
    title: "Understanding GPS Coordinates: Formats, Datums and Precision",
    description: "A practical guide to latitude/longitude: what decimal degrees and DMS really mean, why datums matter, and how many decimal places you actually need.",
    date: "2025-11-04",
    readMins: 7,
    blocks: [
      { t: "p", text: "Every point on Earth can be described with two angles: latitude (north–south of the Equator) and longitude (east–west of the Prime Meridian). That sounds simple, but coordinates show up in several notations, and mixing them up is a common source of 'my marker is in the ocean' errors." },
      { t: "h2", text: "Decimal degrees vs. DMS" },
      { t: "p", text: "Decimal degrees (DD) write the angle as a single number: 40.7128, −74.0060. Degrees-minutes-seconds (DMS) splits each degree into 60 minutes and each minute into 60 seconds: 40°42'46\"N, 74°00'22\"W. Both can describe the same point. Software commonly uses DD; charts, legal descriptions and older GPS workflows may use DMS." },
      { t: "ul", items: [
        "Negative latitude = south of the Equator; negative longitude = west of Greenwich in the usual signed convention.",
        "DMS hemisphere letters (N/S/E/W) carry the direction, so do not combine them with a conflicting sign.",
        "Degrees and decimal minutes (for example 40°42.768') are another format often seen in aviation and marine GPS workflows.",
      ] },
      { t: "h2", text: "How precise is precise?" },
      { t: "p", text: "One degree of latitude is about 111 km, which gives a useful rule of thumb for the numeric spacing represented by decimal places:" },
      { t: "ul", items: [
        "3 decimals ≈ 111 m of latitude",
        "4 decimals ≈ 11 m",
        "5 decimals ≈ 1.1 m of numeric precision",
        "6 decimals ≈ 0.11 m of numeric precision — usually finer than consumer positioning accuracy",
      ] },
      { t: "note", text: "Numeric precision is not the same as measurement accuracy. A phone can display six or seven decimals while the actual location fix is uncertain by several metres or more. Longitude spacing also shrinks with latitude." },
      { t: "h2", text: "Datums: WGS84 is not the only one" },
      { t: "p", text: "A geodetic datum defines the reference frame used to interpret coordinates. Modern GNSS and web-mapping workflows are commonly expressed in WGS84-compatible geographic coordinates, while older or local datasets may use systems such as NAD27 or NAD83. The same physical point can therefore have different numeric coordinates in different datums." },
      { t: "h2", text: "Practical checklist" },
      { t: "ul", items: [
        "Store coordinates with enough decimals for your workflow, but keep source accuracy metadata when it matters.",
        "Validate ranges: latitude −90…90, longitude −180…180.",
        "Watch for swapped lat/lng — GeoJSON uses [longitude, latitude] order.",
        "When copying coordinates from another service, verify the format and datum instead of assuming all systems use the same convention.",
      ] },
      { t: "toolbox", slugs: ["latitude-longitude-finder", "coordinate-converter", "gps-coordinate-lookup", "dms-to-decimal"] },
    ],
  },
  {
    slug: "kml-vs-geojson-vs-gpx",
    title: "KML vs. GeoJSON vs. GPX: Choosing the Right Map File Format",
    description: "The practical differences between three common geographic file formats — when to use each, what can be lost in conversion, and how to move between them.",
    date: "2025-10-12",
    readMins: 6,
    blocks: [
      { t: "p", text: "KML, GeoJSON and GPX overlap, but they were designed for different jobs. KML is strongly associated with Google Earth workflows, GeoJSON is common in web mapping and data exchange, and GPX is widely used for GPS tracks and waypoints. Understanding those strengths helps you choose a format before converting anything." },
      { t: "h2", text: "GeoJSON — a web-mapping favourite" },
      { t: "ul", items: [
        "Plain JSON, which is straightforward to parse and version-control.",
        "Widely supported by MapLibre, Leaflet, Mapbox and many GIS/web libraries.",
        "Feature properties can carry flexible key/value data.",
        "Modern GeoJSON uses WGS84 longitude/latitude coordinates by specification convention.",
      ] },
      { t: "h2", text: "KML — presentation and Google Earth workflows" },
      { t: "ul", items: [
        "XML-based and commonly used by Google Earth and My Maps exports.",
        "Can carry styling, folders, overlays and time information.",
        "KMZ is a compressed container that commonly wraps KML and related assets.",
        "Conversion tools may not preserve every style or extension field.",
      ] },
      { t: "h2", text: "GPX — built around GPS points, routes and tracks" },
      { t: "ul", items: [
        "Common exchange format for GPS devices and activity/navigation apps.",
        "Core structures include waypoints (wpt), tracks (trk) and routes (rte).",
        "Elevation and timestamps are commonly stored per point.",
        "GPX is not designed as a general polygon format.",
      ] },
      { t: "h2", text: "What conversion can lose" },
      { t: "p", text: "Geometry often converts cleanly between formats, but styling, arbitrary properties, timestamps or format-specific extensions may not. A polygon exported to GPX may become a boundary-like track because GPX has no native polygon object. Keep the original source file whenever the data matters so you retain an audit trail." },
      { t: "note", text: "Rule of thumb: analysis and web maps often favour GeoJSON; GPS tracks and device exchange often favour GPX; Google Earth and styled presentation workflows often favour KML." },
      { t: "toolbox", slugs: ["geojson-viewer", "kml-viewer", "gpx-viewer", "csv-to-map"] },
    ],
  },
  {
    slug: "how-distance-calculation-works",
    title: "Distance Calculation: Haversine, Geodesics & When It Matters",
    description: "Why flat map arithmetic fails over large distances, what the haversine formula does, and when a full ellipsoidal geodesic is the better choice.",
    date: "2025-09-20",
    readMins: 6,
    blocks: [
      { t: "p", text: "On a curved Earth, long-distance surface measurements cannot be treated as ordinary straight-line distances on raw latitude and longitude. The shortest surface route on a sphere follows a great-circle arc; on an ellipsoid, the equivalent problem is solved as an ellipsoidal geodesic." },
      { t: "h2", text: "The haversine formula" },
      { t: "p", text: "Haversine treats the Earth as a sphere and computes the central angle between two latitude/longitude points. Using a mean Earth radius such as 6371.0088 km makes it a practical, numerically stable approximation for many everyday mapping tasks." },
      { t: "h2", text: "The ellipsoidal reference" },
      { t: "p", text: "The Earth is better represented by an oblate ellipsoid than a perfect sphere. High-precision geodesic libraries use an ellipsoid such as WGS84 and algorithms designed for that surface. The difference from a spherical calculation depends on route, latitude and distance; for ordinary web planning it is usually small, but precision work should use an ellipsoidal method." },
      { t: "h2", text: "When the difference matters" },
      { t: "ul", items: [
        "Surveying, legal boundaries and engineering: use the required datum/CRS and professional geodesic or survey methods.",
        "Aviation and navigation: use domain-specific navigation systems, route constraints and operational data rather than a simple distance calculator alone.",
        "Web tools, rough logistics estimates and exploratory analysis: a documented spherical approximation is often sufficient when its limits are understood.",
      ] },
      { t: "note", text: "Avoid applying Pythagoras directly to raw latitude/longitude for global distances. Local planar approximations can be useful over small areas when the projection and scale are appropriate." },
      { t: "p", text: "Area calculations need the same care. For larger regions, use a geodesic or projection-aware method rather than assuming a latitude/longitude polygon is flat." },
      { t: "toolbox", slugs: ["distance-between-two-places", "great-circle-calculator", "map-area-calculator", "crow-flies-distance"] },
    ],
  },
];

export const guideBySlug = new Map(GUIDES.map((g) => [g.slug, g]));
