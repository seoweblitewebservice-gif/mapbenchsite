import type { ToolCopy } from "./toolCopy";

export const PREMIUM_TOOL_COPY_4: Record<string, ToolCopy> = {
  "fence-length-calculator": {
    h2: "Fence length starts with perimeter, but installation planning needs more than the formula",
    paras: [
      "For a rectangular plot, fence length is simply the perimeter: twice the sum of length and width. That makes this calculator useful for rough material planning, quote comparisons and checking whether a supplier estimate is in the right range. The arithmetic is exact for the dimensions entered; the real uncertainty is whether those dimensions match the boundary that will actually be fenced.",
      "Gates, setbacks, curved edges, shared boundaries, slopes and corners can change material needs. Use this result as a baseline, then add gate openings and a practical waste allowance before ordering posts, panels or wire. For irregular land, trace the boundary with a map-area or perimeter tool instead of forcing it into a rectangle.",
    ],
  },
  "rectangular-lot-acreage-calculator": {
    h2: "Rectangular acreage is reliable only when the lot really behaves like a rectangle",
    paras: [
      "This calculator converts entered length and width into square feet, acres and hectares. It is useful for quick comparisons of listings, fields, building sites and yard sizes where the dimensions are already known. Because the math is just length × width, it can be more transparent than estimating area by eye from a map.",
      "Real parcels often taper, curve or include exclusions. Do not use a rectangular approximation for a legal acreage claim unless the recorded geometry actually supports it. If the boundary is irregular, trace the polygon or use official cadastral measurements instead.",
    ],
  },
  "crop-row-length-calculator": {
    h2: "Crop-row length turns field dimensions into a planting workload estimate",
    paras: [
      "This tool estimates how many rows fit across a field and the combined row length using field width, field length and row spacing. That is useful for planning seed, irrigation line, cultivation passes and labour. The result assumes straight, evenly spaced rows running the full field length.",
      "Headlands, access lanes, turning space, obstacles and irregular boundaries reduce usable row length in real fields. Treat the result as a planning ceiling, then adjust for the layout you actually intend to plant.",
    ],
  },
  "seed-quantity-per-acre-calculator": {
    h2: "Seed quantity is area multiplied by rate; choosing the rate is the agronomic decision",
    paras: [
      "The calculator multiplies acreage by the seeding rate you provide, making it useful for converting recommendations into a total order quantity. It is especially helpful when comparing different field sizes or seed-rate scenarios without redoing the arithmetic by hand.",
      "The tool does not decide the correct seeding rate for a crop, variety, germination percentage, row spacing or local conditions. Use agronomic guidance or supplier recommendations for the rate itself, and include a small practical margin only when your planting method justifies it.",
    ],
  },
  "fertilizer-amount-calculator": {
    h2: "Fertilizer quantity is simple arithmetic; application rate is the part that must be justified",
    paras: [
      "This page converts a per-acre application rate into a total fertilizer quantity for the entered field size. It is useful for procurement, rough job planning and comparing scenarios. The calculation can be exact while the agronomic recommendation is still wrong if the chosen rate does not match soil tests, crop needs or product concentration.",
      "Check whether your rate refers to product weight or nutrient content such as nitrogen. Those are not interchangeable. For regulated or commercial application, follow the product label, agronomic advice and local requirements rather than treating the calculator as a recommendation engine.",
    ],
  },
  "irrigation-coverage-calculator": {
    h2: "Sprinkler radius describes ideal geometry, not uniform real-world watering",
    paras: [
      "A circular sprinkler footprint is easy to calculate from spray radius using πr². That gives a useful first estimate of theoretical coverage and helps compare sprinkler heads or rough field layouts. Real irrigation design intentionally overlaps patterns because the edge of a spray circle usually receives less water than the centre.",
      "Wind, water pressure, nozzle choice, slope and obstacles can distort coverage substantially. Use the geometric area for planning, then verify manufacturer spacing guidance and field performance before assuming the whole circle receives equal application.",
    ],
  },
  "sprinkler-count-calculator": {
    h2: "Sprinkler count is a layout estimate built on effective overlap, not just total area",
    paras: [
      "This calculator estimates how many sprinklers are needed by comparing field area with an overlap-adjusted circular coverage area. It is useful for rough budgeting and comparing design options. The overlap input matters because irrigation systems rarely place circles edge-to-edge without loss of uniformity.",
      "A real layout also depends on pressure, nozzle precipitation rate, wind exposure, field shape and pipe capacity. Treat the result as a count estimate and use manufacturer spacing tables or irrigation design guidance for final placement.",
    ],
  },
  "grazing-stock-density-calculator": {
    h2: "Animals per acre is a density calculation, not a carrying-capacity recommendation",
    paras: [
      "The calculator expresses stocking density as animals per acre and acres per animal. That makes it useful for comparing paddocks, recording current use and communicating how concentrated a group of animals is at a particular moment.",
      "Sustainable carrying capacity depends on forage type, rainfall, season, soil, animal class, rotation and management objectives. Do not use arithmetic density alone to decide how many animals a pasture can support over time; use local grazing guidance and monitor forage condition.",
    ],
  },
  "polygon-area-from-coordinates": {
    h2: "Coordinate-based polygon area depends on vertex quality as much as the area formula",
    paras: [
      "This tool converts a list of latitude/longitude vertices into an approximate polygon area. It is useful when you already have coordinate points from GPS, a survey sketch or another dataset and want a quick independent check without opening desktop GIS.",
      "Vertex order matters: points should follow the boundary in sequence rather than jumping across the shape. For very large areas or shapes crossing the antimeridian, local planar approximations become less appropriate and a full geodesic GIS calculation is preferable. Legal parcel area should always come from authoritative records or survey data.",
    ],
  },
  "polygon-perimeter-from-coordinates": {
    h2: "Perimeter from coordinates measures the path you supplied, not an unseen boundary between points",
    paras: [
      "The calculator joins consecutive coordinate vertices and sums the segment lengths around the closed polygon. It is useful for fence estimates, site boundaries and validating coordinate lists. A sparse list can cut across curves or bends, so the calculated perimeter may be shorter than the real edge.",
      "Add vertices where the boundary changes direction meaningfully, but avoid adding noisy GPS points that zigzag around a straight edge. For legal or construction work, use survey-grade boundary data rather than consumer GPS traces.",
    ],
  },
  "polygon-centroid-from-coordinates": {
    h2: "A geometric centroid is the balance point of the polygon, not necessarily a useful real-world centre",
    paras: [
      "The centroid is a mathematically defined centre based on polygon geometry. It is useful for labels, map symbols, rough representative coordinates and some spatial workflows. Concave or highly irregular shapes can produce a centroid that lies outside the visible polygon or in an impractical location.",
      "Do not confuse centroid with population centre, travel-time centre or best facility location. Those require different weighting or network models. Use the centroid when you specifically need the geometric centre of the shape.",
    ],
  },
  "coordinate-bounding-box-generator": {
    h2: "A coordinate bounding box is a fast spatial envelope, not a substitute for the original shape",
    paras: [
      "This tool reads a coordinate list and returns north, south, east and west limits. Bounding boxes are widely used for map viewports, API queries, data downloads and first-pass spatial filtering because they are simple to store and compare.",
      "The rectangle usually includes space outside the actual geometry. Be especially careful with data near the antimeridian, where naive minimum and maximum longitude values can create a box spanning most of the planet. Use the real polygon for precise inclusion tests.",
    ],
  },
  "coordinate-radius-points-generator": {
    h2: "Generated radius points approximate a geodesic circle one bearing at a time",
    paras: [
      "The tool generates evenly spaced coordinates at a fixed surface distance from a centre point. This is useful for creating circle polygons, test datasets, API inputs or custom map overlays where you need the actual vertices rather than only a rendered circle.",
      "More vertices make the polygon look smoother but also increase file size and processing cost. For small web maps, dozens of points are usually enough; for analytical work, record the centre, radius and method so the shape can be reproduced rather than relying only on exported vertices.",
    ],
  },
  "unix-timestamp-to-local-time": {
    h2: "A Unix timestamp is one instant; the displayed clock time depends on the chosen zone",
    paras: [
      "Unix time counts seconds from the standard epoch and does not itself contain a timezone. Converting it to local time applies the selected IANA timezone rules to that single instant, including daylight-saving rules that were in effect on that date.",
      "Use the timezone identifier rather than a fixed UTC offset when historical or future dates matter. Offsets such as UTC−5 can change seasonally, while an IANA zone such as America/New_York carries the rule history needed for correct conversion.",
    ],
  },
  "local-time-to-unix-timestamp": {
    h2: "Converting local clock time to Unix time requires resolving the timezone rule for that date",
    paras: [
      "A wall-clock time like 09:00 is ambiguous until a timezone and date are attached. This converter resolves the selected IANA timezone and returns the corresponding Unix timestamp, which is useful for APIs, logs, scheduling systems and database storage.",
      "Daylight-saving transitions create edge cases: some local times occur twice when clocks move back, while others never occur when clocks jump forward. For production scheduling systems, preserve the timezone name alongside the timestamp so ambiguous cases can be audited.",
    ],
  },
  "utc-offset-by-coordinates": {
    h2: "Coordinates identify a timezone first; the UTC offset is then date-specific",
    paras: [
      "This tool maps latitude and longitude to an IANA timezone and then calculates that zone's UTC offset for the selected date. That distinction matters because civil time is political: neighbouring locations at similar longitudes can legally use different offsets.",
      "Do not store the current offset as a permanent property of a place. Daylight-saving changes and legislation can alter it. Store the timezone identifier and calculate the offset for the instant you actually need.",
    ],
  },
  "local-time-by-coordinates": {
    h2: "Local time at coordinates is a timezone lookup plus a clock conversion",
    paras: [
      "The geographic step identifies which civil timezone applies to the coordinate; the time step formats the selected instant using that zone's rules. This is useful for travel planning, distributed teams, event data and checking remote locations without guessing from longitude.",
      "Border areas deserve extra care because timezone boundaries can follow administrative decisions rather than straight geographic lines. If a specific facility or municipality matters, verify the local authority's current time practice.",
    ],
  },
  "dst-checker-by-coordinates": {
    h2: "DST status is tied to a timezone and date, not simply to latitude or country",
    paras: [
      "The checker determines the timezone for the coordinate and evaluates whether daylight-saving time appears active on the selected date. This is useful for scheduling and explaining why a location's UTC offset changes during the year.",
      "Rules can change with legislation, sometimes on short notice. The result depends on the timezone database available to the browser or runtime, so mission-critical scheduling systems should keep their timezone data current and preserve the IANA zone identifier.",
    ],
  },
  "working-hours-overlap-calculator": {
    h2: "Work-hour overlap is a scheduling window, not a guarantee of equal inconvenience",
    paras: [
      "This tool converts two work windows into a common timeline and shows when they overlap. It is useful for remote teams, client calls and recurring meetings across timezones. Because the calculation uses timezone rules, the overlap can shift when one region enters or leaves daylight-saving time before the other.",
      "A technically available slot can still be unfair if the same person always takes an early or late meeting. For recurring global teams, rotate inconvenient slots and recheck the overlap around seasonal clock changes.",
    ],
  },
  "time-difference-between-timezones": {
    h2: "Timezone difference is date-dependent whenever daylight-saving rules differ",
    paras: [
      "The difference between two named timezones is not always a fixed number of hours throughout the year. Regions can change clocks on different dates, use different DST policies or stop observing DST altogether. This calculator evaluates the selected date rather than assuming a permanent offset gap.",
      "For travel, calls and event publishing, always attach a date to the comparison. Saying two cities are 'nine hours apart' without the date can become wrong a few weeks later even though neither city moved.",
    ],
  },
  "civil-twilight-calculator": {
    h2: "Civil twilight marks a solar-angle threshold, not the exact moment useful light ends everywhere",
    paras: [
      "Civil twilight is commonly defined while the Sun's centre is between the horizon and 6° below it. The calculation is useful for photography, outdoor activity, aviation-style references and comparing seasonal light windows across locations.",
      "Mountains, buildings, cloud and local horizon obstruction change what you actually see. Treat the calculated dawn and dusk as standard geometric events; field conditions decide how bright the scene feels at that moment.",
    ],
  },
};
