import type { ToolCopy } from "./toolCopy";

export const PREMIUM_TOOL_COPY: Record<string, ToolCopy> = {
  "map-radius": {
    h2: "What a radius map actually tells you",
    paras: [
      "A radius map answers a geometric question: what falls within a fixed straight-line distance of one point? That makes it useful for policy buffers, school or clinic catchments, retail screening, delivery rules written in miles or kilometres, and quick visual comparisons between locations. It does not model roads, bridges, congestion or terrain, so a 10-mile radius should not be interpreted as a 10-mile drive or a fixed travel-time promise.",
      "MapBench builds the circle from spherical destination calculations rather than drawing a flat-screen approximation. The practical benefit is consistency at different latitudes and map zoom levels. If your real question is 'how far can I drive in 30 minutes?', use the Drive Time Map instead; if your question is 'what is exactly 25 km from this point?', the radius tool is the right model.",
    ],
  },
  "distance-between-two-places": {
    h2: "Choose the right meaning of distance before using the number",
    paras: [
      "This calculator measures the shortest surface separation between two places using great-circle geometry. It is appropriate for geographic comparison, aviation-style crow-flight distance, rough regional scale and checking how far apart two coordinates are. It is not the same as road distance, walking distance or scheduled travel time, because transport networks rarely follow the geometric minimum.",
      "Long routes make the distinction especially important: coastlines, mountain passes, islands, border crossings and road layout can add substantial real-world distance. MapBench keeps the straight-line method explicit so you can compare it with routing tools rather than mixing two different concepts into one answer.",
    ],
  },
  "drive-time-map": {
    h2: "A drive-time map is a road-network reach model, not a circle",
    paras: [
      "Drive-time areas answer a practical accessibility question: which places are reachable from a starting point through the road network within a chosen time budget? The resulting shape can stretch along fast roads and collapse around rivers, mountains, restricted crossings or sparse networks. That is why a 30-minute drive area often looks nothing like a 30-mile or 30-km circle.",
      "The routing engine uses road-network data and free-flow assumptions; live traffic, incidents, weather and temporary closures may not be reflected. Use the result for screening, service-area planning and scenario comparison, then add operational buffers when arrival time matters. For a purely geometric rule, use Map Radius instead.",
    ],
  },
  "what-county-am-i-in": {
    h2: "County lookup is a boundary question, not just a nearby-place search",
    paras: [
      "This tool identifies the county or county-equivalent associated with a point. That is different from finding the nearest city or reading a postal address: municipal, postal and county boundaries are separate geographic layers and do not always share the same name. A location can be marketed with one city name while legally belonging to a different county jurisdiction.",
      "Boundary accuracy matters most near edges. If your GPS position is uncertain by tens or hundreds of metres, move the pin to the known property or road location before relying on the result. For taxes, deeds, permitting, court jurisdiction or other official use, verify with the relevant local government or authoritative boundary source.",
    ],
  },
  "find-my-location": {
    h2: "What 'find my location' can and cannot know",
    paras: [
      "When browser geolocation permission is available, this tool uses the device-provided position and places it on the map so you can inspect the coordinates and nearby geographic context. Device location quality varies: outdoor phones with a clear sky can be much better than laptops, indoor devices or browsers relying heavily on Wi-Fi and network signals.",
      "A VPN mainly changes network/IP location, not GPS, but privacy settings or browser restrictions can prevent precise location access and force a less accurate fallback. Always look at the map pin and reported accuracy before using the result for a boundary-sensitive question such as county, ZIP code or parcel context.",
    ],
  },
  "latitude-longitude-finder": {
    h2: "Coordinates are precise labels, but the source may not be equally accurate",
    paras: [
      "Latitude and longitude describe a position on Earth using angular coordinates. MapBench lets you find them from a map position or location lookup and presents them in a form that can be copied into GIS, GPS, mapping and data workflows. Decimal degrees are the most convenient storage format for modern web mapping, while DMS remains common in human-readable references.",
      "Do not confuse decimal places with measurement accuracy. Six decimal places can display sub-metre increments, but a phone, geocoder or hand-placed pin may be wrong by much more than that. Keep enough decimals for the workflow, but document how the coordinate was obtained when precision matters.",
    ],
  },
  "map-area-calculator": {
    h2: "Map area is only as good as the boundary you draw",
    paras: [
      "The Map Area Calculator measures the surface area enclosed by the points you trace on the map. It is useful for quick acreage, hectares, square-kilometre comparisons, fields, parks, sites and planning sketches. The mathematical area can be consistent while the real-world answer is still wrong if the drawn boundary does not match the actual property or feature.",
      "Zoom in before placing vertices and follow the visible edge carefully. Satellite or basemap imagery is not a legal cadastral survey, and generalized map layers can be offset from official parcel lines. Use MapBench for planning and estimation; use survey records or an authoritative parcel system when ownership or legal area is at stake.",
    ],
  },
  "lot-size-calculator": {
    h2: "Estimate lot size from a visible boundary, then verify legal acreage separately",
    paras: [
      "This tool is designed for people who want a quick estimate of a lot or parcel-sized area from a map. Draw the boundary and convert the result into acres, hectares, square feet or other practical units. It is especially useful for comparing listings, planning landscaping, checking rough development scale or understanding how a stated acreage looks on the ground.",
      "A map trace is not a substitute for a recorded deed, cadastral polygon or licensed survey. Fences, driveways and imagery edges may not coincide with legal ownership. If a property decision depends on a small difference in area, use the official parcel record rather than increasing map zoom and assuming that creates survey-grade accuracy.",
    ],
  },
  "zip-codes-within-radius": {
    h2: "ZIP codes within a radius combine two different geographic ideas",
    paras: [
      "This tool starts with a geometric radius and then identifies ZIP-related areas or locations that intersect or fall within that reach. It is useful for marketing lists, service planning, territory screening and answering questions such as 'which ZIP codes are near this branch?' The result should not be interpreted as a guarantee that every address in each returned ZIP is inside the radius.",
      "US ZIP Codes are postal routing constructs rather than perfectly stable administrative polygons. Different datasets may represent them through ZIP Code Tabulation Areas or other approximations. For mailing eligibility or compliance, verify individual addresses with the postal or authoritative system used by your workflow.",
    ],
  },
  "elevation-finder": {
    h2: "Elevation lookup gives terrain height, not the height of what is built there",
    paras: [
      "The Elevation Finder estimates ground elevation for a selected coordinate using a digital elevation model. It is useful for route context, hiking research, terrain comparison, basic visibility questions and understanding how locations differ vertically. The model represents terrain at a finite grid resolution rather than a survey measurement at the exact centimetre-scale point you click.",
      "Buildings, bridges, trees and small embankments may not be represented, and steep terrain can vary significantly inside one elevation grid cell. Use the value as terrain context. Engineering, flood certification, construction and legal elevation work require authoritative survey-grade data.",
    ],
  },
  "halfway-between-two-places": {
    h2: "The geographic halfway point is not automatically the fairest meeting place",
    paras: [
      "This tool finds the midpoint of the great-circle path between two locations. That is the correct geometric answer to 'what point is halfway across the Earth's surface?', but it may land in water, mountains, private land or somewhere with poor road access. It also does not guarantee equal driving times because each person may face a different road network.",
      "Use the geographic midpoint as a neutral reference, then compare nearby towns or venues with routing tools if the real goal is a fair meeting place. For two drivers, equal travel time is usually more useful than equal straight-line distance.",
    ],
  },
  "distance-matrix-calculator": {
    h2: "A distance matrix turns many pairwise comparisons into one planning table",
    paras: [
      "A distance matrix compares every origin with every destination so you can see relative separation at a glance instead of running dozens of individual calculations. It is useful for territory planning, facility screening, multi-city comparisons, logistics analysis and identifying the closest or most central candidate among several places.",
      "Interpret the matrix according to the metric being used. A straight-line matrix is excellent for geographic structure but should not be substituted for road travel time when routing matters. Also watch for duplicate or ambiguously geocoded place names; one bad location can create an entire row and column of misleading comparisons.",
    ],
  },
  "sunrise-sunset-calculator": {
    h2: "Sunrise and sunset are calculated events with a defined horizon convention",
    paras: [
      "Sunrise and sunset times depend on date, latitude, longitude and the standard definition of when the Sun's upper edge appears or disappears near the horizon. MapBench uses a documented astronomical method rather than a fixed day-length table, which is why the result changes continuously with season and location.",
      "Local terrain, tall buildings and weather can shift what you physically observe compared with the geometric horizon calculation. Time-zone and daylight-saving rules also change the clock label without changing solar geometry. Use the calculator for planning photography, outdoor activity and daylight comparison, while treating a blocked local horizon as a separate real-world factor.",
    ],
  },
  "coordinate-converter": {
    h2: "Coordinate conversion changes notation or reference grid, not the physical location",
    paras: [
      "The Coordinate Converter translates the same geographic position among common representations such as decimal degrees, DMS, UTM, MGRS and Plus Codes where supported. Conversion is useful when two systems require different formats, but it does not improve the accuracy of the original measurement. A rough coordinate remains rough after being expressed with more digits.",
      "Datum assumptions matter. GPS and modern web mapping usually use WGS84-compatible latitude and longitude, while older surveys and specialist datasets may use a different datum or projected coordinate reference system. Confirm the source CRS before treating a numeric conversion as a true spatial transformation.",
    ],
  },
  "gpx-viewer": {
    h2: "Inspect a GPX file before converting or sharing it",
    paras: [
      "GPX files can contain waypoints, routes, tracks, elevation and timestamps. A viewer is useful not only for seeing the path on a map but also for catching problems such as impossible jumps, missing segments, wrong coordinate order or a track that starts in an unexpected place. MapBench processes supported file content in the browser so the file does not need to become a hosted upload just to inspect it.",
      "Keep the original GPX even after converting to another format. Conversions can lose device-specific extensions, styling or time-related detail. If the track contains sensitive home, workplace or travel locations, review the start and end points before sharing an exported screenshot or file.",
    ],
  },
};
