import type { GuideBlock } from "./guides";

export const GUIDE_ENRICHMENT: Record<string, GuideBlock[]> = {
  "understanding-gps-coordinates": [
    { t: "h2", text: "A real-world example: one place, several coordinate formats" },
    { t: "p", text: "Take a point in central New York City: 40.7128, -74.0060 in decimal degrees. The same location can be written in degrees-minutes-seconds, converted to UTM for a projected grid workflow, or expressed in MGRS for grid-based navigation. None of those formats makes the underlying observation more accurate; they are different ways to encode the same location. The safest workflow is to preserve the original source coordinates, record the datum when known, and convert only for the system that needs a different notation." },
    { t: "h2", text: "Common coordinate mistakes that look plausible" },
    { t: "ul", items: [
      "Latitude and longitude swapped: a valid-looking pair can still land on another continent.",
      "Missing minus sign: western longitudes and southern latitudes can jump across the globe.",
      "DMS pasted into a decimal field: symbols and hemisphere letters may be parsed incorrectly or ignored.",
      "Wrong datum: older survey coordinates can shift when interpreted as modern WGS84 without transformation.",
      "Too much trust in decimal places: seven decimals on screen do not prove centimetre-level accuracy."
    ] },
    { t: "h2", text: "How many decimals should you actually store?" },
    { t: "p", text: "For general web mapping, five or six decimal places is usually a sensible storage choice because it preserves metre-scale numeric detail without pretending the source measurement is perfect. If the source is a phone fix uncertain by 8 metres, storing six decimals is harmless as long as you also understand the uncertainty. For surveying, engineering or legal boundary work, coordinate precision must be tied to the required datum, instrument, control network and professional workflow rather than a generic web rule." },
    { t: "note", text: "Best practice: keep the original coordinate pair, record the source and datum when known, and use a map preview as a sanity check before relying on any converted format." },
  ],
  "kml-vs-geojson-vs-gpx": [
    { t: "h2", text: "A practical decision table" },
    { t: "table", headers: ["Need", "Best starting format", "Why"], rows: [
      ["Web map features and attributes", "GeoJSON", "Simple JSON structure, flexible properties and broad web-library support"],
      ["GPS track or route exchange", "GPX", "Native structures for tracks, routes, waypoints, timestamps and elevation"],
      ["Google Earth presentation", "KML/KMZ", "Strong styling, folders, labels, overlays and familiar Earth workflows"],
      ["Long-term audit trail", "Original source file", "Conversion can remove styling, metadata or format-specific extensions"]
    ] },
    { t: "h2", text: "What usually breaks during conversion" },
    { t: "p", text: "The geometry is often the easy part. The hard part is everything wrapped around it. KML may contain style maps, icons, folder hierarchy and overlays that have no direct GeoJSON equivalent. GPX can include extensions from fitness or navigation devices that a generic converter does not understand. GeoJSON properties can be arbitrarily rich, but many target formats only have a smaller fixed vocabulary. A successful conversion therefore means more than 'the file opened'; it means checking whether the fields you care about survived." },
    { t: "h2", text: "A safer conversion workflow" },
    { t: "ul", items: [
      "Open the original file first and record feature counts, geometry types and basic bounds.",
      "Convert a copy, never the only source file.",
      "Open the converted output and compare feature counts and map extent with the original.",
      "Spot-check names, timestamps, elevation and any custom properties important to the job.",
      "Document known losses, especially style information and format-specific extensions."
    ] },
    { t: "note", text: "If a converted file is being used for analysis, verify the data fields you need rather than judging success only by whether the map looks similar." },
  ],
  "how-distance-calculation-works": [
    { t: "h2", text: "Worked example: New York to London" },
    { t: "p", text: "A straight line drawn on a flat Mercator map is not the shortest surface route between New York and London. The great-circle path bends northward on the map because the projection distorts the geometry of the sphere. A haversine calculation works from the latitude and longitude angles directly, producing the spherical surface distance without measuring screen pixels or relying on the map projection." },
    { t: "h2", text: "Why road distance is a different problem" },
    { t: "p", text: "A geodesic answers 'how far apart are these points on the Earth's surface?' A routing engine answers 'how far must a vehicle travel through this transport network?' The road answer depends on bridges, permitted roads, turns, ferries, one-way rules and the network dataset. Comparing the two can be useful: the geodesic is a theoretical lower bound, while the route reflects infrastructure." },
    { t: "h2", text: "Sources of error people often overlook" },
    { t: "ul", items: [
      "The input coordinates may be less accurate than the distance formula.",
      "A city name may resolve to a centre point that differs from the address or neighborhood you intended.",
      "A spherical result and an ellipsoidal result are not mathematically identical, especially over long routes.",
      "Map projection distortion affects visual interpretation even when the underlying distance calculation is correct."
    ] },
    { t: "h2", text: "Which method should you choose?" },
    { t: "p", text: "Use a documented spherical great-circle method for everyday worldwide comparisons when sub-percent precision is sufficient. Use ellipsoidal geodesics when the application requires higher geodetic fidelity. Use routing data when roads or travel times are the real question. And for survey, cadastral, engineering or safety-critical work, use the coordinate reference system and professional method required by that domain." },
  ],
  "crow-flies-when-it-lies": [
    { t: "h2", text: "Detour ratio: a useful way to compare straight and road distance" },
    { t: "p", text: "One practical comparison is the detour ratio: road distance divided by straight-line distance. A ratio close to 1 means the road network is relatively direct. A much larger ratio points to barriers or indirect infrastructure. The number is not a universal score because route quality, vehicle mode and road restrictions matter, but it is a useful way to compare how strongly geography and infrastructure distort travel." },
    { t: "h2", text: "Where crow-flies distance is especially misleading" },
    { t: "ul", items: [
      "Across rivers, bays and fjords where only a few bridges or ferries exist.",
      "Across mountain ranges where roads follow passes and valleys rather than direct lines.",
      "Across national borders where legal crossings are limited.",
      "Inside cities with rail yards, freeways, airports or restricted campuses that break the street network.",
      "For walking, where pedestrian access can differ greatly from vehicle access."
    ] },
    { t: "h2", text: "When the straight-line number is exactly what you want" },
    { t: "p", text: "The fact that roads are longer does not make great-circle distance inferior. Radio range, aviation-style separation, geographic clustering, nearest-neighbour analysis and some policy rules are genuinely about direct separation. The mistake is not using crow-flies distance; the mistake is answering a road or travel-time question with it without saying so." },
    { t: "note", text: "Label distance clearly when sharing results: straight-line, road distance and travel time are different measurements and can all be correct at the same time." },
  ],
  "reading-isochrones-like-a-planner": [
    { t: "h2", text: "How to read fingers, holes and flat edges" },
    { t: "p", text: "An isochrone's outline is a diagnostic picture of the network. A long narrow finger often follows a fast corridor. A notch can indicate a river, limited crossing or disconnected road segment. A suspiciously straight edge may reflect data coverage or the calculation extent rather than real accessibility. Looking at the road map underneath the polygon helps separate genuine transport structure from artifacts." },
    { t: "h2", text: "Compare multiple time bands, not just one" },
    { t: "p", text: "A single 30-minute polygon answers one question. Adding 10, 20 and 30 minute bands reveals how accessibility expands. If most new area appears between 20 and 30 minutes in one direction, that corridor may be controlled by a faster road. Nested bands also make it easier to explain trade-offs to non-technical users than a single irregular shape." },
    { t: "h2", text: "What an isochrone still does not know" },
    { t: "ul", items: [
      "Whether live congestion is worse than the routing model assumes.",
      "Whether parking, security gates or building access add time after arrival.",
      "Whether a pedestrian route is comfortable, safe or legally accessible.",
      "Whether seasonal closures, construction or temporary restrictions are missing from the network."
    ] },
    { t: "h2", text: "A reproducible planning workflow" },
    { t: "p", text: "Record the centre point, travel mode, contour times, date of analysis and routing source. Export the polygon when possible. That turns a screenshot into a reproducible planning artifact: another person can understand what assumptions produced the shape and can rerun the analysis later when roads or services change." },
  ],
  "how-accurate-is-your-gps": [
    { t: "h2", text: "Accuracy, precision and repeatability are different" },
    { t: "p", text: "Accuracy describes how close the reported point is to the true location. Precision describes how finely the number is expressed. Repeatability asks whether repeated measurements cluster together. A phone can report many decimals (high numeric precision) while still being several metres wrong (limited accuracy), and repeated fixes can wander around the true point depending on sky view and surrounding buildings." },
    { t: "h2", text: "Why cities and buildings are difficult" },
    { t: "p", text: "Satellite signals can reflect from glass and concrete before reaching the receiver, a problem known as multipath. Indoors, the device may rely more heavily on Wi-Fi and network positioning. Dense tree cover and narrow streets can also reduce the quality of the satellite geometry. That is why the same phone can produce a tight fix in an open field and a much larger uncertainty circle in a city canyon." },
    { t: "h2", text: "A practical quality check" },
    { t: "ul", items: [
      "Wait a few seconds for the location fix to settle instead of trusting the first point immediately.",
      "Look at the reported accuracy radius when the browser or device exposes one.",
      "Compare several fixes rather than assuming one reading is perfect.",
      "Inspect the pin against recognizable map features before storing or sharing it.",
      "For legal, engineering or survey work, use appropriate professional GNSS/survey equipment and controls."
    ] },
    { t: "note", text: "A coordinate can be useful without being survey-grade. The key is matching the quality of the measurement to the decision you are making." },
  ],
};
