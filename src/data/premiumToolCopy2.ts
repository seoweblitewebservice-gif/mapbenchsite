import type { ToolCopy } from "./toolCopy";

export const PREMIUM_TOOL_COPY_2: Record<string, ToolCopy> = {
  "driving-distance-calculator": {
    h2: "Road distance answers a transport question, not a geometry question",
    paras: [
      "Driving distance follows the road network between two places, so it can be much longer than straight-line distance. Rivers, mountain passes, limited-access roads, one-way systems and border crossings all shape the route. Use this tool when the practical question is how far a vehicle must travel rather than how far apart two coordinates are on the globe.",
      "The route depends on the underlying road data and routing profile. Temporary closures, private roads, live congestion and local restrictions may not be reflected. For logistics, compare the route with current local conditions before treating the result as an operational commitment.",
    ],
  },
  "bearing-calculator": {
    h2: "A bearing gives direction from one point to another",
    paras: [
      "A bearing is the initial direction of travel from one coordinate toward another, measured clockwise from true north. It is useful for navigation concepts, GIS checks, field orientation and comparing how two locations sit relative to each other. On long great-circle routes, the bearing can change as you travel even though the destination stays the same.",
      "Do not mix true bearing with magnetic compass heading without applying local magnetic declination. MapBench reports geographic bearing based on coordinates; a physical compass may point differently depending on location and date.",
    ],
  },
  "polygon-area-calculator": {
    h2: "Polygon area depends on the vertices you define",
    paras: [
      "A polygon area calculator measures the surface enclosed by an ordered set of points. It is useful when you already know the boundary coordinates or want a repeatable area from a traced shape. Extra vertices can improve how closely the polygon follows a curved or irregular boundary, but they do not make an uncertain source boundary legally accurate.",
      "Check point order and inspect the drawn shape before trusting the result. Crossing edges, misplaced vertices and coordinate-order mistakes can create a mathematically valid but geographically wrong polygon. Use official parcel or survey data for legal property decisions.",
    ],
  },
  "service-area-map": {
    h2: "A service area should match the rule your business actually uses",
    paras: [
      "Service areas can be defined by straight-line radius, road distance, travel time, ZIP coverage or administrative boundaries. This tool is most useful when you clearly state which model represents your operation. A circular 20-mile area is easy to communicate, but it may overstate reach across rivers or mountains and understate reach along fast highways.",
      "For customer promises, compare the planning map with real routing, staffing and delivery constraints. A service-area visualization is a screening tool unless it is backed by the exact eligibility rules used by your business system.",
    ],
  },
  "multi-radius-map": {
    h2: "Multiple radii make geographic thresholds easier to compare",
    paras: [
      "Plotting several circles around the same or different centers helps compare tiers such as 5, 10 and 25 miles, store catchments, exclusion buffers or competing facilities. The visual overlap can reveal areas served by multiple locations and places that fall outside every threshold.",
      "Each circle remains a straight-line geographic radius. Overlap does not imply equal travel time or equal population, and two same-size circles can represent very different real-world access depending on roads, terrain and settlement density.",
    ],
  },
  "cities-within-radius": {
    h2: "Cities within a radius is a proximity screen, not a complete settlement census",
    paras: [
      "This tool checks which cities in MapBench's curated city dataset fall within a chosen great-circle distance of a center point. It is useful for regional comparisons, travel brainstorming, territory research and understanding how clustered major urban centers are around a location.",
      "The result only includes cities present in the dataset and should not be read as every municipality, town or settlement inside the circle. For official demographic or planning work, use a complete authoritative place dataset for the relevant country.",
    ],
  },
  "population-within-radius": {
    h2: "Population within radius is an estimate built from the included city dataset",
    paras: [
      "This page estimates population by summing the approximate populations of curated major cities that fall inside the selected radius. It is useful for rough market-size comparisons and learning how different urban clusters change with radius size, but it is not a census-based count of every resident in the circular area.",
      "Suburbs, small municipalities, rural residents and city-boundary definitions can materially change a true population total. Treat the output as a transparent comparative estimate and use current census grids or official demographic products when decisions require complete coverage.",
    ],
  },
  "best-route-order": {
    h2: "Route optimization changes stop order to reduce unnecessary travel",
    paras: [
      "When several stops can be visited in different orders, the sequence can matter as much as the individual distances. This tool uses routing logic to find a practical order rather than forcing the stops to remain in the order entered. It is useful for errands, deliveries, site visits and simple multi-stop planning.",
      "Optimization is still constrained by the routing engine and the assumptions given to it. Time windows, loading constraints, vehicle capacity, traffic and mandatory visit order are separate logistics problems unless explicitly included, so professional fleet planning may need a richer optimization model.",
    ],
  },
  "line-of-sight-calculator": {
    h2: "Terrain line of sight is different from visual clearance in the real world",
    paras: [
      "A terrain line-of-sight calculation checks whether the elevation profile between two points rises above the modeled sight line, including Earth curvature and the documented refraction assumption. It is useful for preliminary radio, observation and terrain studies.",
      "The elevation model does not reliably include buildings, trees, towers or small local obstructions. Antenna height, vegetation growth and structure height can completely change a real link. Use the result as terrain screening, not as a certified RF or engineering path study.",
    ],
  },
  "crow-flies-distance": {
    h2: "Crow-flies distance is the shortest geographic surface distance",
    paras: [
      "Crow-flies distance ignores roads and measures the shortest great-circle separation between two points. It is valuable for comparing geographic closeness, checking regional scale and separating pure spatial distance from transport-network effects.",
      "The phrase can be misleading for practical travel: people, cars and even aircraft do not always follow the exact theoretical arc. Use road or route tools when accessibility matters, and keep crow-flies distance for the geometry question it actually answers.",
    ],
  },
  "what-country-am-i-in": {
    h2: "Country lookup depends on the coordinate and the boundary dataset",
    paras: [
      "This tool identifies the country associated with a point on the map. It is useful for checking GPS coordinates, remote locations and border context without relying only on a nearby city name or IP-based location.",
      "Border areas require caution because generalized public boundaries, disputed territories and GPS uncertainty can affect the answer. For immigration, customs, legal jurisdiction or sovereignty questions, rely on the responsible authorities rather than a general-purpose map lookup.",
    ],
  },
  "pin-drop-map": {
    h2: "A pin map is most useful when each marker has a clear meaning",
    paras: [
      "Dropping pins is a simple way to compare locations, create a visual shortlist or annotate points for a presentation. Labels, consistent categories and a deliberate map extent make the output much more useful than an unstructured collection of markers.",
      "A pin marks a coordinate, not necessarily an entrance, parcel centroid or exact address. When precision matters, verify the coordinate source and zoom in before placing or sharing the marker.",
    ],
  },
  "qibla-direction-finder": {
    h2: "Qibla direction is a great-circle bearing from your location to the Kaaba",
    paras: [
      "The Qibla direction can be calculated from latitude and longitude as the initial great-circle bearing toward the Kaaba in Makkah. This provides a geographic reference direction for a chosen coordinate and avoids relying on rough east-or-west assumptions that vary significantly around the world.",
      "A phone compass can still be affected by magnetic interference, calibration and the difference between true and magnetic north. Use the calculated bearing as the geographic reference and calibrate the physical device when aligning on site.",
    ],
  },
  "batch-geocoder": {
    h2: "Batch geocoding turns address lists into coordinates, but every match should be quality-checked",
    paras: [
      "Batch geocoding is useful when a spreadsheet or list of place names needs latitude and longitude for mapping, distance analysis or GIS work. Automated matching saves time, but ambiguous addresses, missing postal codes and similarly named places can produce plausible-looking coordinates in the wrong location.",
      "Review low-confidence or unexpected matches before using the output downstream. For large production workloads, also respect the rate limits and usage terms of the underlying geocoding service rather than treating a public endpoint as an unlimited bulk API.",
    ],
  },
  "csv-to-map": {
    h2: "A good CSV map starts with clean coordinate columns",
    paras: [
      "CSV mapping works best when each row has consistent latitude and longitude values plus an identifier or label. Before visualizing hundreds of rows, inspect a few sample points and check that latitude and longitude have not been swapped, especially when both values happen to fall inside valid numeric ranges.",
      "Mapping can reveal data-quality problems quickly: points at 0,0, repeated coordinates, impossible jumps and unexpected countries often indicate missing or misparsed values. Fix those issues before using the map to draw conclusions about clusters or coverage.",
    ],
  },
};
