// Composable editorial blocks per category: practical tips, glossary and
// data-vintage notes. Assembled into each tool page's long-form guide.
import type { CategoryId } from "@/lib/registry";

export const CATEGORY_TIPS: Record<CategoryId, string[]> = {
  location: [
    "Prefer clicking the map over typing when you can: a placed pin is unambiguous, while a mistyped address can silently resolve to the wrong Springfield. When you must type, include the country for common town names and drop apartment numbers if the street fails — geocoders match best on street + city.",
    "Treat postal and administrative answers as different datasets. A 'wrong' city result is frequently a correct administrative answer disagreeing with a postal habit. If a form demands the mailing version, your postal service is authoritative; if it demands legal boundaries, the administrative layer is.",
    "Check accuracy before trusting a GPS-derived answer: indoors, browser positioning can be off by blocks, which flips counties near borders. Zoom the map and nudge the pin by hand when the stakes are real — the tools here let every GPS result be corrected with a click.",
  ],
  distance: [
    "Always confirm which distance you need before quoting one: straight-line for physical questions, road distance for driving, and network time for schedules. The three can differ by half again in mountainous or island geography, and quoting the wrong one is the most common distance mistake in reports.",
    "Remember that bearings are true-north by default. If you are transferring a bearing to a magnetic compass, add (or subtract) your local declination — it exceeds 10° in many inhabited regions and flips hemispheres of behaviour.",
    "Use the midpoint tool instead of averaging coordinates when splitting journeys: latitude/longitude averages distort over long legs and fail across the date line, while the spherical midpoint follows the actual path the distance was measured along.",
  ],
  routing: [
    "Add a congestion buffer to any free-flow travel time: 20–40% in peak urban areas is a sane rule of thumb, and the interface labels its times as free-flow for exactly this reason. For appointments, plan with the buffer; for physics, trust the raw number.",
    "Place route endpoints on roads, not rooftops. Routing engines snap points to the nearest drivable way, and a point in a river or a courtyard can snap somewhere surprising — nudging the pin to the nearest street makes results stable and explainable.",
    "When optimising many stops, keep the true origin first and let the engine order the rest; then sanity-check the result visually. Optimizers minimise distance, not your time windows — hard appointments still belong in manual order.",
  ],
  radius: [
    "Decide geometric vs temporal reach before drawing anything: a 10 km circle and a 15-minute drive area answer different questions, and in car-dependent geography they barely overlap in shape. Circles for policy radii, isochrones for response promises.",
    "Verify areas against a known object first — measure a football pitch or a city block you know — and you'll calibrate your eye for what a hectare or acre looks like at your zoom. The map preview is the unit your intuition trusts.",
    "When exporting polygons for reports, store the radius and unit in the feature properties (the exports here do). Future-you, reopening the file in a GIS, will otherwise have to re-derive what the circle meant.",
  ],
  coordinates: [
    "Adopt one storage format — decimal degrees, WGS84, five or six decimals — for every dataset you own, and convert at the edges for display. Mixed notations in one column are the root of nearly every coordinate bug.",
    "Sanity-check every pasted pair by eye on a map before using it: latitude/longitude swaps land you in the ocean so reliably that 'the Null Island bug' has a name. A two-second visual check costs nothing and catches most transcription errors.",
    "Match precision to source: consumer GPS earns about five decimals; quoting six or seven implies a survey you didn't do. Rounding deliberately is honesty, not loss.",
  ],
  files: [
    "Keep the original file even after converting: GPX→GeoJSON drops timestamps' context, KML→GeoJSON drops styling, and every pipeline has a lossy edge. Originals are cheap; re-acquisition is not.",
    "Validate before trusting exports from unfamiliar tools — open them in a local viewer and check feature counts, bounding boxes and a few property rows. A wrong-axis or swapped-coordinate export is far easier to catch on a map than in a spreadsheet.",
    "For big CSVs, fix the coordinate columns first and map a sample before mapping everything: auto-detection is good but not magical, and one swapped column renders a beautiful map of the wrong ocean.",
  ],
  creation: [
    "Limit each map to one message: pins for places, polygons for areas, rings for reach. When a single figure needs all three, it usually needs two figures instead.",
    "Choose colour for category, not decoration: two or three high-contrast hues read instantly; a rainbow reads as noise. Labels carry identity, colour carries grouping, and the viewport should crop tightly to the subject.",
    "Export twice: an image for the slide and a data format (GeoJSON/CSV) for the record. The image communicates; the data survives editing, and the pair keeps your map honest and reusable.",
  ],
  earth: [
    "Remember that elevation models see bare terrain: no buildings, no forest canopy. A line-of-sight 'clear' verdict can still be blocked by a wood, and a horizon distance assumes open ground — treat results as the terrain baseline, then add land cover from local knowledge.",
    "Include your height inputs explicitly (eye height, mast height, deck level) when sharing visibility results: the same hill answers differently for a child, an adult and a 10 m antenna, and unstated heights make numbers unreproducible.",
    "Treat climate and hardiness outputs as 30-year character, not this year's weather: a zone tells you what winters usually allow, and microclimates — walls, slopes, urban heat — shift a real garden half a zone either way.",
  ],
  sun: [
    "Convert solar times to local clock times deliberately: the sun keeps astronomical time, while governments keep political time, and the gap between them is large in many countries. State both when sharing results.",
    "For photography, plan around sun altitude, not clock time: golden hour is an altitude band, so its clock time migrates with the seasons even at a fixed place — the calculator's windows handle that for you.",
    "When comparing day length across a year, remember the curve is your latitude's signature: near-equatorial sites hover at twelve hours while high latitudes swing wildly. Choose expectations by latitude, not by calendar folklore.",
  ],
  lines: [
    "Use the lines as calibration for other tools: the Equator's 40,075 km circumference is the yardstick that makes great-circle distances legible, and the polar circles make daylight calculators' extremes make sense.",
    "When teaching or writing about meridians, keep datum stories handy — Greenwich's brass line versus the GPS zero, a hundred metres east — because they illustrate, memorably, that coordinate systems are human agreements measured very precisely.",
    "Click along a highlighted line and read coordinates back: watching latitude hold at 23.44° while longitude sweeps the planet turns an abstract parallel into a place you have walked, cursor-first.",
  ],
  population: [
    "State the vintage and definition with every population number you reuse: metro vs municipal vs urban-area figures for the same city differ by multiples, and unstated definitions are how bad comparisons spread.",
    "Use radius sums as lower bounds in rural regions: curated major-city datasets capture the big dots, not the in-between settlement. For funding or legal work, move to census geometry; for screening and comparison, the transparent estimate wins on speed.",
    "Compare with ratios, not differences: density and cost indices are snapshots, and the relationship between two cities is far more stable than either absolute value. That stability is what makes quick comparisons legitimate.",
  ],
  network: [
    "Treat IP geolocation as an estimate of the network, not a precise physical address. VPNs, mobile carriers, proxies and corporate gateways can place an IP far from the actual device.",
    "Use browser GPS when you need device-level location and permission is available; use IP lookup when you need public network context such as ISP, ASN or approximate region.",
    "IP assignments and geolocation databases change. Record the lookup time and source when network location is used for analysis or troubleshooting.",
  ],
};

export const CATEGORY_GLOSSARY: Record<CategoryId, [string, string][]> = {
  location: [
    ["Reverse geocoding", "Translating coordinates into the nearest human-readable address or administrative area."],
    ["Administrative boundary", "The legally defined polygon for a country, state, county or municipality."],
    ["Postal vs administrative city", "Mailing city follows postal routes; legal city follows municipal boundaries — they can differ."],
    ["Accuracy radius", "The device-reported uncertainty of a GPS/network position, in metres."],
  ],
  distance: [
    ["Great circle", "A circle centred on Earth's centre; its arcs are the shortest surface paths."],
    ["Haversine", "The standard stable formula for great-circle distance on a sphere."],
    ["Initial bearing", "Compass angle from true north at departure along a great circle."],
    ["Geodesic", "The ellipsoid-true shortest path; haversine approximates it within ~0.3%."],
  ],
  routing: [
    ["Isochrone", "The reachable-area polygon for a given travel time from a start point."],
    ["Costing model", "The routing engine's mode profile (auto, pedestrian, bicycle) with its speeds and rules."],
    ["Free-flow time", "Travel time from speed limits and road classes, without congestion."],
    ["Travelling-salesman ordering", "Reordering stops to minimise total route distance."],
  ],
  radius: [
    ["Spherical cap", "The true shape of a radius circle on a globe."],
    ["Spherical excess", "The method for exact polygon areas on a sphere."],
    ["Catchment", "The area or population served from a centre, geometric or temporal."],
    ["Perimeter", "The summed great-circle length of a drawn boundary."],
  ],
  coordinates: [
    ["Datum", "The reference shape model (WGS84 for GPS) that coordinates are angles against."],
    ["DMS", "Degrees-minutes-seconds notation; 1° = 60′ = 3600″."],
    ["UTM", "Metre-based zone/easting/northing grid on the WGS84 ellipsoid."],
    ["Plus Code", "Open Location Code: keyless short codes for any spot, by open math."],
  ],
  files: [
    ["GeoJSON", "JSON geographic format; the web-mapping native dialect."],
    ["KML", "XML format from the Google Earth era, with styling and ExtendedData."],
    ["GPX", "GPS exchange format: waypoints, tracks, routes, elevation, timestamps."],
    ["Bounding box", "The minimal rectangle enclosing a dataset; the instant sanity check."],
  ],
  creation: [
    ["Viewport framing", "Cropping the map tightly to the subject so the message fills the frame."],
    ["Cluster marker", "A grouped dot representing many nearby points at low zoom."],
    ["Share-state URL", "Encoding the whole map configuration in the link itself."],
    ["Pixel-ratio export", "PNG export at device resolution for crisp slides and print."],
  ],
  earth: [
    ["DEM", "Digital elevation model: a grid of terrain heights, e.g. Copernicus GLO-90."],
    ["Refraction coefficient", "The standard 0.13 factor bending sightlines over the curvature."],
    ["Antipode", "The diametrically opposite point; latitude flips, longitude shifts 180°."],
    ["Köppen class", "The letter-code climate system from temperature/precipitation thresholds."],
  ],
  sun: [
    ["Declination", "The sun's latitude-equivalent angle, ±23.44° across the year."],
    ["Equation of time", "The sundial-vs-clock correction from orbit eccentricity and tilt."],
    ["Civil twilight", "Sun between 0° and −6°: usable outdoor light without lamps."],
    ["Synodic month", "The 29.53-day new-moon-to-new-moon cycle behind phases."],
  ],
  lines: [
    ["Axial tilt", "Earth's 23.44° lean; the single number behind tropics, circles and seasons."],
    ["Parallel", "A constant-latitude circle; only the Equator is a great circle."],
    ["Meridian", "A constant-longitude half-circle from pole to pole."],
    ["Precession", "The slow wobble that ages constellation names like 'Capricorn'."],
  ],
  population: [
    ["Vintage", "The year a dataset snapshot describes; always cite it."],
    ["Municipal vs metro", "City limits vs the wider economic region; populations differ by multiples."],
    ["Cost index", "Rent-inclusive price level relative to a baseline city (here, NYC = 100)."],
    ["Density", "People per unit area; the ratio-stable texture of a city."],
  ],
  network: [
    ["Public IP", "An Internet-routable address visible to external services."],
    ["ASN", "Autonomous System Number identifying a network operator or routing organization."],
    ["IP geolocation", "An estimate of the geographic area associated with an IP address."],
    ["Carrier-grade NAT", "A network setup where many customer devices share public IPv4 addresses."],
  ],
};

export const CATEGORY_DATA_NOTE: Record<CategoryId, string> = {
  location: "Positions are resolved with OpenStreetMap Nominatim/Photon (ODbL) and, for US districts, the Census Bureau geocoder. Nothing is stored server-side; the only outgoing request per lookup carries the coordinate pair itself.",
  distance: "Distances and bearings use haversine great-circle math on the WGS84 mean sphere (R = 6371.0088 km), accurate to ~0.3% of ellipsoidal geodesics; the methodology page documents the full recipe.",
  routing: "Routes and isochrones come from the FOSSGIS Valhalla engine on OpenStreetMap data (OSRM fallback for driving). Durations are free-flow estimates and are labelled as such on every result.",
  radius: "Circle boundaries are placed vertex-by-vertex by spherical destination math; polygon areas use spherical excess on the WGS84 sphere — both remain correct at high latitudes where flat formulas fail.",
  coordinates: "All conversions (DMS, UTM with Norway/Svalbard exceptions, MGRS, Plus Codes) run locally on WGS84 with standard geodetic series; round-trips are exact at display precision.",
  files: "Parsing uses browser-native readers (FileReader, DOMParser, JSON.parse); files never leave the device. Format fidelity notes accompany every export button.",
  creation: "Map imagery derives from OpenStreetMap via OpenFreeMap (ODbL attribution applies to reused basemap images); your pins and labels live only in the share URL.",
  earth: "Elevation and radiation use Open-Meteo's open API on Copernicus/ERA5 datasets; visibility math adds standard refraction (k = 0.13). US hydrology/flood layers come from USGS and FEMA public services.",
  sun: "Solar times use the NOAA algorithm with the 90.833° official zenith; lunar phase uses the synodic cycle. Timezone geometry comes from the open tz database resolved locally in your browser.",
  lines: "Line positions follow the current axial tilt (23.437°); basemap © OpenStreetMap contributors. Facts cite standard astronomical and geodetic references.",
  population: "Population and place tools may use different data sources and reference periods. Check the specific source and vintage shown for each result; official US population counts are available from the Census Bureau.",
  network: "Public IP metadata is supplied by the IP lookup service and represents an approximate network location; VPNs, proxies, mobile networks and reassignment can reduce geographic accuracy.",
};
