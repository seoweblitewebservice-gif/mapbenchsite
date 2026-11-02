/**
 * "Best free …" comparison pages.
 *
 * Each page is a curated answer, not a keyword dump: a short verdict, an
 * ordered list of MapBench tools with a sentence on when to pick each one, and
 * links to the parent hubs so the page feeds the clusters rather than
 * competing with them. `npm run audit:links` verifies every slug resolves and
 * that no tool is recommended by two best-of pages with the identical anchor.
 */
import type { HubId } from "@/data/hubs";

export interface BestOfEntry {
  /** Tool slug or absolute path (hubs, guides, blank-map sub-hub). */
  href: string;
  /** Display label. Kept unique across the page so anchors never repeat. */
  label: string;
  /** Why this one, in one or two sentences. */
  why: string;
  /** Present when the target is a hub or guide rather than a tool. */
  kind?: "hub" | "guide" | "page";
}

export interface BestOfPage {
  slug: string;
  h1: string;
  title: string;
  description: string;
  primaryKeyword: string;
  secondaryKeywords: string[];
  /** One-sentence verdict under the H1. */
  verdict: string;
  intro: string[];
  hubs: HubId[];
  picks: BestOfEntry[];
  /** How the list was chosen — keeps the page honest. */
  method: string;
  faq?: [string, string][];
}

export const BEST_OF: BestOfPage[] = [
  {
    slug: "/best/free-map-tools",
    h1: "Best Free Online Map Tools",
    title: "Best Free Online Map Tools in 2026 (No Sign-Up)",
    description:
      "The best free online map tools for distance, radius, area, routes, coordinates and map files — all browser-based, no account required.",
    primaryKeyword: "best free online map tools",
    secondaryKeywords: [
      "free map tools",
      "online map tools",
      "free online map tools",
      "free mapping tools",
      "interactive map tools",
    ],
    verdict:
      "If you only bookmark one thing, bookmark the directory; if you bookmark three, take a radius map, a distance calculator and a coordinate converter.",
    intro: [
      "There is no shortage of free map tools, which is exactly the problem: most lists are directories of directories, and half the links want an account before they will show you a circle. This page is short on purpose. It names the tools we would actually open for the six questions people bring to a map site, and links the hub behind each one so you can see the full cluster.",
      "Every pick below runs in the browser, needs no sign-up, and states the method behind its answer — spherical distance, road-network routing, Census geography or uploaded file geometry. That last part matters more than speed: a map tool that will not tell you which model produced a number is not giving you a result you can check.",
    ],
    hubs: ["distance", "radius", "area", "routes", "location", "coordinates"],
    picks: [
      { href: "/tools/map-radius", label: "Radius map tool", why: "Draw a circle around any point, with rings for 5, 10 and 25 miles and a measured area for each." },
      { href: "/tools/distance-between-two-places", label: "Two-place distance calculator", why: "Great-circle miles, kilometres and initial bearing for any pair of places, addresses or coordinates." },
      { href: "/tools/coordinate-converter", label: "GPS coordinate converter", why: "Move between decimal degrees, DMS, UTM, MGRS, Plus Codes and geohash without losing the datum." },
      { href: "/tools/map-area-calculator", label: "Area measurement tool", why: "Trace a boundary and read the enclosed area in acres, hectares, square feet or square miles." },
      { href: "/tools/drive-time-map", label: "Drive time map", why: "See everything reachable in 15, 30 or 45 minutes — the honest alternative to a radius circle." },
      { href: "/tools/kml-viewer", label: "KML and GPX viewer", why: "Open a map file locally to check the geometry before you trust it in another application." },
      { href: "/tools", label: "The full tool directory", why: "All tools grouped by hub, with a keyword search that works offline once the page has loaded.", kind: "page" },
    ],
    method:
      "Ordered by how often each cluster is used in practice, then by whether the tool answers its question without a second tool. No sponsored placements, no affiliate links, and no tool is listed that requires an account.",
    faq: [
      ["Are these tools really free?", "Yes. Every tool on MapBench is free to use without an account, an email address or a trial period. The site is supported by advertising rather than subscriptions."],
      ["Do these map tools work on a phone?", "Yes. The maps, GPS buttons and result panels are built mobile-first, and file tools accept files from the phone's own storage or sharing sheet."],
      ["Which one should I start with for a service area?", "Draw a radius map first to bound the problem geometrically, then check the same area with a drive time map. Where the two disagree is usually the real finding."],
    ],
  },
  {
    slug: "/best/free-distance-calculator",
    h1: "Best Free Distance Calculators",
    title: "Best Free Distance Calculators for Maps and Coordinates",
    description:
      "Compare free distance calculators for two places, coordinates, cities, flights and shipping — and see which measurement each one actually uses.",
    primaryKeyword: "best free distance calculator",
    secondaryKeywords: [
      "distance calculator",
      "straight line distance calculator",
      "distance between two cities",
      "distance calculator between cities",
    ],
    verdict:
      "Pick by question, not by brand: pairs of towns, many pairs at once, or coordinates you already have.",
    intro: [
      "Distance calculators disagree for a boring reason: they measure different things. A great-circle tool returns the shortest arc across the sphere, a road tool follows the network, and a flight tool adds routing and wind. None of them is wrong, and comparing two of them is often more useful than trusting either.",
      "The three below cover the everyday cases. If you need the road number instead, the driving distance calculator in the routes hub is the right instrument.",
    ],
    hubs: ["distance", "routes", "bearing-midpoint"],
    picks: [
      { href: "/tools/distance-between-two-places", label: "Distance between two places", why: "The general-purpose answer: search two places and read miles, kilometres and initial bearing." },
      { href: "/tools/crow-flies-distance", label: "As-the-crow-flies calculator", why: "The same spherical method with the maths shown, useful when the number has to be justified." },
      { href: "/tools/distance-matrix-calculator", label: "Distance matrix calculator", why: "Many origins against many destinations in one table, with CSV export." },
      { href: "/tools/flight-distance-calculator", label: "Flight distance calculator", why: "Airport-to-airport great-circle distance plus an estimated block time." },
      { href: "/tools/distance-between-cities", label: "City-to-city distances", why: "A curated list of common city pairs with reproducible coordinates." },
      { href: "/tools/shipping-distance-calculator", label: "Shipping distance calculator", why: "Nautical miles along a sea route when the cargo does not travel in a straight line." },
      { href: "/distance", label: "Every distance tool in one hub", why: "Horizon, poles, equator, coast and coordinate distances, all with the same method notes.", kind: "hub" },
    ],
    method:
      "Ranked by how directly each tool answers a single distance question without needing a second calculation. Road and flight times are listed only where the page states its routing assumptions.",
    faq: [
      ["Is straight-line distance or driving distance more accurate?", "Neither is more accurate; they measure different things. Straight-line distance is the geometric minimum and is reproducible; driving distance follows the road network and is always longer."],
      ["How accurate is a great-circle distance?", "On the WGS84 mean sphere, haversine distance differs from a full ellipsoidal geodesic by roughly 0.3% in the worst case — far smaller than the ambiguity in where a city centre is."],
    ],
  },
  {
    slug: "/best/map-radius-calculator",
    h1: "Best Free Map Radius Calculators",
    title: "Best Map Radius Calculators: Draw, Compare, Measure",
    description:
      "Draw a radius on a map, compare several rings, and turn a circle into a service area, delivery zone or population estimate.",
    primaryKeyword: "best map radius calculator",
    secondaryKeywords: [
      "radius map tool",
      "map radius calculator",
      "draw radius on map",
      "service area map",
    ],
    verdict:
      "Draw one circle to bound the question, then convert it to a drive-time area before you promise anything to a customer.",
    intro: [
      "A radius map is the fastest way to make a coverage question visible, and the easiest way to mislead yourself. Circles ignore water, bridges and hills, so a 10-mile ring and a 10-minute drive area can look nothing alike on the same street network.",
      "Use the tools below in that order: draw, compare, then translate into something travel-based. The population and ZIP tools convert the ring into the numbers people actually ask about.",
    ],
    hubs: ["radius", "routes", "area", "lookup"],
    picks: [
      { href: "/tools/map-radius", label: "Draw a radius on the map", why: "One centre, one circle, measured area and an exportable outline." },
      { href: "/tools/multi-radius-map", label: "Multiple radius map", why: "Ring 5, 10, 25 and 50 miles on the same centre to compare tiers at a glance." },
      { href: "/tools/service-area-map", label: "Service area map", why: "Turn a radius into a shareable coverage figure for a customer or a sales team." },
      { href: "/tools/drive-time-map", label: "Drive time map", why: "Replace the circle with a real network isochrone before committing to a response time." },
      { href: "/tools/population-within-radius", label: "Population within a radius", why: "Census-based population, income and age context for the area inside the ring." },
      { href: "/tools/zip-codes-within-radius", label: "ZIP codes within a radius", why: "List the ZCTAs a circle touches — useful for direct mail and territory planning." },
      { href: "/radius", label: "All radius and coverage tools", why: "Delivery radius, sales territory, buffer zones and coverage-gap analysis.", kind: "hub" },
    ],
    method:
      "Ranked by how often each step appears in a real coverage workflow: draw, compare, convert to travel time, then quantify. Population figures are labelled as Census estimates, never as live counts.",
    faq: [
      ["Is a radius map the same as a service area?", "No. A radius is geometric; a service area is usually a promise about travel. A circle is a reasonable first approximation and a poor final answer."],
      ["Can I measure the area inside the circle?", "Yes. The radius map reports the enclosed area, and the area hub converts it into acres, hectares or square feet."],
    ],
  },
  {
    slug: "/best/free-route-planner",
    h1: "Best Free Route Planners",
    title: "Best Free Route Planners with Travel Times and Stops",
    description:
      "Free route planners for drive times, multi-stop trips, walking and cycling routes, fuel costs and printable itineraries.",
    primaryKeyword: "best free route planner",
    secondaryKeywords: [
      "route planner",
      "multi stop route planner",
      "drive time calculator",
      "free route planner map",
    ],
    verdict:
      "Two stops is a calculator; more than two is an optimisation problem, and those need different tools.",
    intro: [
      "Routing engines turn a street network into a travel time. Free public engines report free-flow times from speed limits and road classes, not live congestion, so a 25-minute result is the physics of the network — add a 20 to 40 per cent buffer in dense cities and you have a plan you can defend.",
      "The list below moves from a single pair of stops, to many stops, to the money and time questions that follow a route.",
    ],
    hubs: ["routes", "distance", "radius"],
    picks: [
      { href: "/tools/drive-time-map", label: "Drive time reach map", why: "See everywhere reachable in a given number of minutes from one origin." },
      { href: "/tools/driving-distance-calculator", label: "Driving distance calculator", why: "Road miles and expected duration between two points, not the crow-flies number." },
      { href: "/tools/multi-stop-route-planner", label: "Multi-stop route planner", why: "Order several stops and export the result as GPX for a phone or satnav." },
      { href: "/tools/route-optimizer", label: "Route optimiser", why: "Reorder stops to cut backtracking when the list is long enough to matter." },
      { href: "/tools/walking-time-calculator", label: "Walking time calculator", why: "Pedestrian networks are not road networks — footways and cut-throughs change the answer." },
      { href: "/tools/fuel-cost-calculator", label: "Fuel cost calculator", why: "Turn the route distance into a fuel budget and a per-person split." },
      { href: "/routes", label: "All route and travel time tools", why: "Isochrones, trekking stages, roadbooks, delivery costing and more.", kind: "hub" },
    ],
    method:
      "Ranked by how much of a real trip plan each tool completes. All times are free-flow estimates from public routing data and are described as such on every result.",
    faq: [
      ["Do these planners use live traffic?", "No. Times are free-flow estimates derived from speed limits and road classes. Live congestion is not included, which is why a buffer is part of every honest plan."],
      ["Can I export the route to my phone?", "Yes. The multi-stop planner exports GPX, which loads in OsmAnd, Organic Maps, Garmin and most satnav applications."],
    ],
  },
  {
    slug: "/best/free-gps-tools",
    h1: "Best Free GPS and Location Tools",
    title: "Best Free GPS Tools: Location, Geocoding and GPS Files",
    description:
      "Free GPS tools to find your location, turn coordinates into addresses, geocode a list of addresses and open GPX track files.",
    primaryKeyword: "best free gps and location tools",
    secondaryKeywords: [
      "gps location finder",
      "gps coordinates finder",
      "reverse geocoding tool",
      "gpx viewer",
    ],
    verdict:
      "Finding yourself is the easy half; naming what you found, and checking a recorded track, is where the useful tools are.",
    intro: [
      "GPS tools split into two families that rarely get compared properly. The first answers 'where am I and what is this place called?' and depends on device positioning plus a geocoder. The second works on recorded files and depends on parsing rather than positioning.",
      "The list covers both, because most workflows start in one and end in the other: you record a track, then you need to know which county the endpoint fell in.",
    ],
    hubs: ["location", "coordinates", "gis-files", "time"],
    picks: [
      { href: "/tools/find-my-location", label: "Find my location", why: "Device position on a map with an accuracy estimate, correctable by clicking." },
      { href: "/tools/what-county-am-i-in", label: "What county am I in", why: "Census-verified county and FIPS from position, address or a map click." },
      { href: "/tools/reverse-geocoder", label: "Reverse geocoding tool", why: "Coordinates in, street address out, with the matched place name shown separately." },
      { href: "/tools/batch-geocoder", label: "Bulk address geocoder", why: "Paste or upload a list of addresses and get coordinates back in one pass." },
      { href: "/tools/gpx-viewer", label: "GPX track viewer", why: "Open a recorded track locally, with point counts and elevation in the browser." },
      { href: "/tools/utc-offset-by-coordinates", label: "Time zone at coordinates", why: "The offset and local time at a coordinate pair, resolved from the tz database." },
      { href: "/tools/coordinate-converter", label: "Coordinate format converter", why: "Convert between DD, DMS, UTM, MGRS, Plus Codes and geohash." },
    ],
    method:
      "Split between positioning tools and file tools, because they fail in different ways. Device positioning is limited by signal; file parsing is limited by the file.",
    faq: [
      ["Why is my GPS location slightly wrong?", "Consumer positioning is usually within a few metres outdoors and within a block indoors, where the device falls back on Wi-Fi and cell data. You can always correct the pin by clicking the map."],
      ["Is my location stored?", "No. Position data is used in the browser and, where a lookup needs a service, only the coordinate pair is sent. Nothing is retained server-side."],
    ],
  },
  {
    slug: "/best/geographic-calculators",
    h1: "Best Online Geographic Calculators",
    title: "Best Online Geographic Calculators: Distance, Bearing, Area",
    description:
      "Free geographic calculators for distance, bearing, midpoint, area and land measurement, each with the formula and the coordinate model it uses.",
    primaryKeyword: "best online geographic calculators",
    secondaryKeywords: [
      "geographic calculator",
      "geography calculator",
      "map calculator",
      "geospatial calculator",
    ],
    verdict:
      "Choose the calculator that names its model. The number matters less than knowing whether it came from a sphere, a network or a Census polygon.",
    intro: [
      "The interesting thing about geographic calculators is how often two correct tools return different numbers for the same input. That is not a bug: a bearing, a land area and a travel time are three different models of the same two points.",
      "The picks below cover the geometric core — distance, direction, midpoint and area — and each page states whether it works on a sphere, a projection or a measured polygon.",
    ],
    hubs: ["distance", "bearing-midpoint", "area", "earth"],
    picks: [
      { href: "/tools/crow-flies-distance", label: "Great-circle distance calculator", why: "The haversine baseline, with the radius and formula stated." },
      { href: "/tools/bearing-calculator", label: "Compass bearing calculator", why: "Initial and final bearing between two points, plus the compass point." },
      { href: "/tools/halfway-between-two-places", label: "Geographic midpoint calculator", why: "A true spherical midpoint rather than an average of two latitudes." },
      { href: "/tools/map-area-calculator", label: "Polygon area calculator", why: "Spherical area of a traced boundary, correct at high latitudes." },
      { href: "/tools/earth-curvature-calculator", label: "Earth curvature calculator", why: "The drop due to curvature over a distance, with the standard refraction assumption stated." },
      { href: "/tools/central-angle-from-distance-calculator", label: "Central angle calculator", why: "Convert a surface distance into the angle it subtends at Earth's centre." },
      { href: "/tools/map-scale-calculator", label: "Map scale calculator", why: "Convert between measured length on paper and ground distance." },
    ],
    method:
      "Restricted to calculators that publish their formula or model. Tools that return a number without stating whether it is spherical, projected or network-derived were left out.",
    faq: [
      ["Why do two distance calculators disagree?", "Usually different Earth models (sphere versus ellipsoid) or different endpoints for a place name. Both differences are measurable and small."],
      ["Which is best for land area?", "A spherical polygon calculation is fine for estimates. For a legal parcel area, the deed or survey is authoritative and no map tool substitutes for it."],
    ],
  },
  {
    slug: "/best/mapping-tools-for-students",
    h1: "Best Free Mapping Tools for Students and Teachers",
    title: "Free Mapping Tools for Students and Teachers",
    description:
      "Free, no-sign-up mapping tools for classrooms: blank outline maps, distance and area measurement, coordinates and file viewers for projects.",
    primaryKeyword: "free mapping tools for students",
    secondaryKeywords: [
      "free mapping tools for teachers",
      "geography tools for students",
      "blank maps for classroom",
      "free geography calculators",
    ],
    verdict:
      "Classroom-safe means no accounts, no uploads and no data collection — which narrows the field considerably.",
    intro: [
      "For a classroom the constraints matter more than the features. No student should need an email address to measure a distance, and no file should leave the device to be opened. Everything here runs in a browser tab with no account.",
      "Two categories cover most lessons: printable outline maps for worksheets, and the measurement tools that make the numbers on those worksheets mean something.",
    ],
    hubs: ["map-maker", "area", "distance", "bearing-midpoint"],
    picks: [
      { href: "/map-maker/blank-maps", label: "Printable blank maps", why: "World, USA, India, Canada, UK and Australia outlines as clean SVG or PNG with no watermark.", kind: "page" },
      { href: "/tools/map-area-calculator", label: "Measure an area on a map", why: "Trace a lake, a country or a catchment and read the area in acres, hectares or square kilometres." },
      { href: "/tools/distance-between-two-places", label: "Distance between two places", why: "A quick, reproducible way to show why flat maps distort long routes." },
      { href: "/tools/latitude-longitude-finder", label: "Latitude and longitude finder", why: "Click any point on the globe and read its coordinates in several formats at once." },
      { href: "/tools/csv-to-map", label: "Plot a spreadsheet on a map", why: "Students paste a small coordinate table and see the locations appear, without any software install." },
      { href: "/tools/country-size-comparison", label: "Country size comparison", why: "Overlay two countries at true scale to demonstrate the Greenland problem." },
      { href: "/guides/map-projections-explained", label: "Map projections explained", why: "The lesson plan behind the distortion demonstrations.", kind: "guide" },
    ],
    method:
      "Selected for zero cost, zero accounts and zero uploads. File tools read locally; location tools work without granting permission if a point is clicked on the map.",
    faq: [
      ["Do students need to create accounts?", "No. All tools are usable without an account, sign-up or email address."],
      ["Can the blank maps be printed and redistributed?", "Yes for classroom and internal use. The map geometry comes from public datasets and the pages carry the required source credit."],
    ],
  },
  {
    slug: "/best/land-measurement-tools",
    h1: "Best Free Land Measurement Tools",
    title: "Best Free Land Measurement Tools: Acres, Hectares, Lots",
    description:
      "Measure land area on a map, convert between acres, hectares and square feet, price land by area and calculate fencing, seed and soil.",
    primaryKeyword: "free land measurement tools",
    secondaryKeywords: [
      "land area calculator",
      "acreage calculator",
      "land measurement calculator",
      "measure land area on map",
    ],
    verdict:
      "Measure the boundary, convert the units, then check the number against the deed before you use it for anything that costs money.",
    intro: [
      "Land measurement questions usually arrive as 'how many acres is this?', and the honest answer starts with 'as drawn by whom?'. A map measurement is an estimate of a shape; a deed is a description of a legal boundary. The gap between them is where disputes live.",
      "The tools below cover the full practical sequence: trace the boundary, convert the result, price it, and work out the materials for the same ground.",
    ],
    hubs: ["area", "land", "radius"],
    picks: [
      { href: "/tools/map-area-calculator", label: "Measure land area on a map", why: "Trace a boundary and read the area on the sphere, so latitude does not quietly distort it." },
      { href: "/tools/acreage-map-calculator", label: "Acreage calculator", why: "The same measurement reported directly in acres and square feet." },
      { href: "/tools/rectangular-lot-acreage-calculator", label: "Lot size from dimensions", why: "Work out acreage from frontage and depth when you already have the survey numbers." },
      { href: "/tools/acres-to-hectares-converter", label: "Acres and hectares converter", why: "Convert between the two units that appear in deeds, listings and regulations." },
      { href: "/tools/land-cost-per-acre-calculator", label: "Land cost per acre", why: "Compare parcels on price per acre rather than sticker price." },
      { href: "/tools/fence-length-calculator", label: "Fence length calculator", why: "Turn the measured boundary into a fencing cost." },
      { href: "/land-calculators", label: "Farm and garden calculators", why: "Seed, fertilizer, irrigation, soil and mulch for the same measured ground.", kind: "hub" },
    ],
    method:
      "Ordered as a workflow: measure, convert, price, then build. Every area figure is a geometric estimate; deeds and surveys remain authoritative.",
    faq: [
      ["How accurate is a map acreage measurement?", "The geometry is exact for the shape you draw, and the sphere-based calculation avoids projection error. The uncertainty is in the drawn boundary, which can easily be a few metres off."],
      ["Can I use this for a property purchase?", "No. Use it for a sanity check, then confirm the area with the deed, a surveyor or the county assessor before committing money."],
    ],
  },
  {
    slug: "/best/free-gis-tools",
    h1: "Best Free GIS Tools for Beginners",
    title: "Free GIS Tools for Beginners: View, Convert, Validate",
    description:
      "Start using GIS data without installing anything: view KML, GPX and GeoJSON files, convert between formats, validate coordinates and measure geometry.",
    primaryKeyword: "free gis tools for beginners",
    secondaryKeywords: [
      "free gis tools online",
      "online gis map tools",
      "simple gis tools",
      "gis file viewer",
    ],
    verdict:
      "Before reaching for a desktop GIS, open the file in a browser viewer — most 'broken' files are a coordinate-order or delimiter problem.",
    intro: [
      "A full GIS application is the right tool for editing topology, running spatial joins and managing layers. It is the wrong tool for answering 'is this file okay?', which is the question that stops most beginners on day one.",
      "These browser tools cover that first hour: open the file, check what is in it, convert it if you need another format, and measure something to confirm the coordinates mean what you think they mean.",
    ],
    hubs: ["gis-files", "coordinates", "area"],
    picks: [
      { href: "/tools/geojson-viewer", label: "GeoJSON map viewer", why: "Drop a GeoJSON file and see the geometry, feature count and property keys." },
      { href: "/tools/kml-viewer", label: "KML file viewer", why: "Open KML or KMZ placemarks and paths without Google Earth." },
      { href: "/tools/gpx-viewer", label: "GPX file viewer", why: "Read a recorded track with timestamps, elevation and point counts." },
      { href: "/tools/geojson-validator", label: "GeoJSON validator", why: "Catch coordinate-order problems and structural errors before they reach a map library." },
      { href: "/tools/csv-to-map", label: "CSV latitude longitude mapper", why: "Turn a spreadsheet into points, with column detection you can override." },
      { href: "/tools/gpx-to-csv-converter", label: "GPX to CSV converter", why: "Get track points into a spreadsheet for analysis or a report." },
      { href: "/gis-files", label: "All GIS file tools", why: "Every viewer, validator, counter and converter, grouped by format family.", kind: "hub" },
    ],
    method:
      "Ordered by the sequence a beginner actually follows: open, verify, convert, measure. All processing happens in the browser, so nothing needs to be uploaded.",
    faq: [
      ["Do I need to install anything?", "No. These run in a modern browser and read files locally from your device."],
      ["What file format should I start with?", "GeoJSON if you are working with web maps, GPX if the data is a recorded track, and CSV if it came out of a spreadsheet. The KML vs GeoJSON vs GPX guide explains the trade-offs."],
    ],
  },
  {
    slug: "/best/coordinate-conversion-tools",
    h1: "Best Free Coordinate Conversion Tools",
    title: "Free Coordinate Conversion Tools: DD, DMS, UTM, MGRS",
    description:
      "Convert GPS coordinates between decimal degrees, DMS, UTM, MGRS, Plus Codes, geohash and British or Irish grid references, in your browser.",
    primaryKeyword: "free coordinate conversion tools",
    secondaryKeywords: [
      "gps coordinate converter",
      "latitude longitude converter",
      "coordinate format converter",
      "utm converter",
    ],
    verdict:
      "Conversion is easy; the mistakes happen before and after it. Confirm the datum and the axis order, then convert.",
    intro: [
      "Coordinate conversion looks like pure arithmetic, and it mostly is — which is why the failures are so confusing when they happen. A swapped latitude and longitude produces a perfectly valid coordinate in the wrong hemisphere, and a NAD27 value converted as if it were WGS84 shifts by tens of metres without any error message.",
      "The tools below convert in both directions and, more usefully, tell you which format they recognised in the first place.",
    ],
    hubs: ["coordinates", "location", "gis-files"],
    picks: [
      { href: "/tools/coordinate-converter", label: "GPS coordinate converter", why: "Decimal degrees, DMS, DMM, UTM, MGRS, Plus Codes and geohash in one place." },
      { href: "/tools/coordinate-parser", label: "Coordinate parser", why: "Paste an unknown pair and have the format named before conversion." },
      { href: "/tools/dms-to-decimal", label: "DMS to decimal degrees", why: "The single-step conversion for charts and legacy records." },
      { href: "/tools/utm-converter", label: "UTM converter", why: "Zone-aware UTM conversion, including the Norway and Svalbard exceptions." },
      { href: "/tools/mgrs-converter", label: "MGRS converter", why: "Military grid references with selectable precision." },
      { href: "/tools/plus-code-finder", label: "Plus Code finder", why: "Open Location Codes for places without a street address." },
      { href: "/tools/latitude-longitude-validator", label: "Coordinate validator", why: "Check ranges and signs across a list before you import it anywhere." },
    ],
    method:
      "Ranked by how often each format appears in real datasets, then by whether the tool also validates. All conversions run locally on WGS84.",
    faq: [
      ["Which coordinate format should I use?", "Decimal degrees for data and databases, DMS for anything read aloud or copied from a chart, UTM or MGRS for field work on a grid, and Plus Codes for places without addresses."],
      ["Is a conversion lossless?", "Yes at the precision you display, provided the datum is unchanged. Converting between datums is a different operation and can shift positions by tens of metres."],
    ],
  },
  {
    slug: "/best/gps-file-tools",
    h1: "Best Free GPX, GeoJSON and KML Tools Online",
    title: "Best Free GPX, GeoJSON & KML Tools Online",
    description:
      "Free online tools for GPX, GeoJSON, KML, WKT and CSV map files: view, validate, count, measure, simplify and convert — all processed locally.",
    primaryKeyword: "free gpx geojson kml tools",
    secondaryKeywords: [
      "gpx tools online",
      "geojson tools online",
      "kml tools online",
      "map data converter",
      "gps file tools",
    ],
    verdict:
      "The distinctive cluster on this site: file tools that parse in the browser and tell you what they dropped.",
    intro: [
      "Map file tools are where free sites usually cut corners, because parsing and validating is less glamorous than drawing a circle. These pages do the unglamorous work: count the features, measure the track, check the coordinate order and state exactly what a conversion loses.",
      "Everything runs locally with browser-native parsers, so a personal track log does not need to be uploaded to anything.",
    ],
    hubs: ["gis-files", "map-maker", "coordinates"],
    picks: [
      { href: "/tools/gpx-route-stats", label: "GPX route statistics", why: "Point, route and waypoint counts, distance, duration and ascent in one summary." },
      { href: "/tools/geojson-validator", label: "GeoJSON structure checker", why: "Verify the structure and coordinate ranges before a map library silently rejects it." },
      { href: "/tools/kml-path-length", label: "KML path length calculator", why: "Measure the linework inside a KML file in kilometres and miles." },
      { href: "/tools/gpx-merger", label: "Merge GPX files", why: "Combine tracks from several days or devices into one file." },
      { href: "/tools/geojson-simplify-helper", label: "GeoJSON simplifier", why: "Reduce coordinate density for web maps without breaking the shape." },
      { href: "/tools/encoded-polyline-decoder", label: "Encoded polyline decoder", why: "Turn a Google-style encoded route string back into coordinates." },
      { href: "/gis-files/geojson", label: "GeoJSON tool family", why: "Validators, formatters, counters and converters grouped by format.", kind: "page" },
      { href: "/guides/kml-vs-geojson-vs-gpx", label: "KML vs GeoJSON vs GPX", why: "Which format to keep, and what each conversion costs you.", kind: "guide" },
    ],
    method:
      "One pick per format family plus the two highest-value converters. Fidelity notes are shown on every conversion page rather than buried in documentation.",
    faq: [
      ["Are my files uploaded?", "No. Files are read in the browser with native parsers. The only network requests are for map tiles and place search."],
      ["Which format is best for a recorded track?", "GPX preserves timestamps and elevation, which is exactly what a track analysis needs. Convert to GeoJSON only when a web map needs it."],
    ],
  },
  {
    slug: "/best/printable-outline-maps",
    h1: "Best Free Printable Outline Maps",
    title: "Free Printable Outline Maps: World, USA, Country Blanks",
    description:
      "Download free printable blank and outline maps of the world, the USA, India, Canada, the UK and Australia as clean SVG or PNG for worksheets.",
    primaryKeyword: "free printable outline maps",
    secondaryKeywords: [
      "free printable blank maps",
      "blank world map",
      "printable country outline maps",
      "free svg maps",
    ],
    verdict:
      "Clean geometry, no watermark, and a format you can actually edit — the three things most free blank map sites get wrong.",
    intro: [
      "A blank map is a teaching tool and a design asset, and the requirements are different from a reference map: no clutter, no labels you did not ask for, and a vector format you can recolour. These maps are rendered from public geographic geometry and offered as SVG or PNG.",
      "If you need to measure something rather than print it, the area and distance tools in the same site will do that on the same geography.",
    ],
    hubs: ["map-maker", "area", "distance"],
    picks: [
      { href: "/maps", label: "Printable world map library", why: "Country outlines on a neutral projection, with labelled and coloured variants.", kind: "page" },
      { href: "/states", label: "State and county map index", why: "All fifty states plus the District of Columbia, each with county-level map variants.", kind: "page" },
      { href: "/maps/blank/india", label: "India outline map", why: "Country boundaries without labels, for classroom labelling exercises.", kind: "page" },
      { href: "/maps/blank/canada", label: "Canada outline map", why: "Provinces and territories as clean vector outlines.", kind: "page" },
      { href: "/maps/blank/united-kingdom", label: "United Kingdom outline map", why: "Nations and counties without annotation.", kind: "page" },
      { href: "/maps/blank/australia", label: "Australia outline map", why: "States and territories, print-ready.", kind: "page" },
      { href: "/tools/blank-map", label: "Blank map generator", why: "Pick a country, projection and style, then export SVG or PNG." },
      { href: "/map-maker", label: "Map maker tools", why: "Label, colour and export a map rather than printing an empty one.", kind: "hub" },
    ],
    method:
      "Listed by how often each map is requested for classroom use. All downloads are watermark-free and keep their source attribution in the page footer.",
    faq: [
      ["Can I use these maps in a worksheet?", "Yes. They are free for classroom, personal and internal business use; keep the attribution note with any redistributed copy."],
      ["Is there a labelled version?", "Most map pages offer both a blank outline and a labelled reference variant of the same geometry."],
    ],
  },
];

export const BEST_OF_LINKS = BEST_OF.map((page) => ({
  href: page.slug,
  label: page.h1,
  short: page.verdict,
  keyword: page.primaryKeyword,
}));
