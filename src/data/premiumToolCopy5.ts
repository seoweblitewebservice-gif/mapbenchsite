import type { ToolCopy } from "./toolCopy";

export const PREMIUM_TOOL_COPY_5: Record<string, ToolCopy> = {
  "circle-area-from-radius": {
    h2: "Circle area is simple math, but the units decide whether the answer is useful",
    paras: [
      "For a radius r, circle area is πr² and circumference is 2πr. The formula is exact for a flat geometric circle, so the main source of mistakes is usually unit handling rather than the equation itself. A radius entered in metres produces square metres for area; a radius entered in feet produces square feet.",
      "For small site plans, gardens, sprinklers and classroom geometry, the flat-circle model is appropriate. For very large radii drawn on Earth, use a map-radius or geodesic tool because a geographic circle follows the curved surface rather than a flat plane.",
    ],
  },
  "radius-from-circle-area": {
    h2: "Recovering radius from area is exact only when the shape is actually circular",
    paras: [
      "If a known area truly represents a circle, radius is √(area/π). This is useful for converting a stated coverage area into an equivalent radius or checking whether a circular design matches a target area.",
      "Do not use the result as the radius of an irregular parcel, service area or drive-time zone. In those cases the calculation gives an equivalent-circle radius: a useful comparison number, but not the real distance from centre to boundary.",
    ],
  },
  "circle-circumference-from-radius": {
    h2: "Circumference from radius is a perimeter calculation, not a map distance",
    paras: [
      "The circumference of a flat circle is 2πr and the diameter is 2r. The result is useful for edging, fencing, circular tracks, tanks and other planar designs where the boundary is genuinely circular.",
      "When the circle covers many kilometres on a map, Earth curvature changes the geometry. Use spherical or geodesic radius tools for geographic work rather than treating a large mapped circle as ordinary plane geometry.",
    ],
  },
  "radius-from-circumference": {
    h2: "A measured circumference can reveal radius when the boundary is truly circular",
    paras: [
      "Radius is circumference divided by 2π. This conversion is useful when the perimeter is known but the centre-to-edge distance is not, such as a circular feature measured around its outside edge.",
      "Real objects and land boundaries are rarely perfect circles. Measurement noise, irregular edges and unit mistakes can make the derived radius look more precise than the source measurement deserves, so round the result to a realistic precision.",
    ],
  },
  "equal-circle-overlap-calculator": {
    h2: "Circle overlap is useful for coverage planning, but real service areas rarely behave like perfect circles",
    paras: [
      "For two circles with the same radius, overlap depends only on the radius and the distance between centres. The standard lens-area equation gives both the intersection area and the share of each circle that is duplicated. That makes the tool useful for sprinkler layouts, radio-style coverage sketches and repeated service-radius planning.",
      "A geometric overlap does not prove duplicated real-world service. Roads, terrain, walls, demand and administrative borders can make two equal map circles perform very differently. Use the overlap percentage as a spatial baseline, then add the real constraint that matters to the project.",
    ],
  },
  "nautical-twilight-calculator": {
    h2: "Nautical twilight marks a solar-angle convention, not a guarantee of visible horizon conditions",
    paras: [
      "Nautical twilight is conventionally defined while the Sun is between 6° and 12° below the horizon. The calculator uses the 12° boundary to estimate nautical dawn and dusk for the selected coordinates and date.",
      "Cloud, terrain, haze and artificial light can change what an observer actually sees. High latitudes can also have dates when the Sun never crosses the required angle, so a missing event can be a real astronomical outcome rather than a calculation failure.",
    ],
  },
  "astronomical-twilight-calculator": {
    h2: "Astronomical twilight uses the Sun at 18° below the horizon",
    paras: [
      "Astronomical dawn and dusk are conventionally tied to a solar zenith of 108°, meaning the Sun is 18° below the horizon. The definition is useful for astronomy planning because the sky is normally close to fully dark beyond that boundary when light pollution and moonlight are low.",
      "The geometric event does not account for local cloud, terrain or urban skyglow. Near the poles, astronomical twilight may persist all night or fail to occur for parts of the year because the Sun never reaches the required altitude.",
    ],
  },
  "solar-noon-calculator": {
    h2: "Solar noon is when the Sun is highest locally, not necessarily 12:00 on the clock",
    paras: [
      "Solar noon is the moment the Sun crosses the local meridian and reaches its daily maximum altitude. Clock noon can differ because time zones cover wide longitude ranges and civil clocks may include daylight-saving adjustments.",
      "This calculator provides an astronomical planning estimate. For shadow-sensitive surveying, high-precision solar engineering or professional observatory work, use an authoritative ephemeris and include elevation, atmospheric refraction and the exact time standard required by the project.",
    ],
  },
  "sun-altitude-calculator": {
    h2: "Sun altitude tells you how high the Sun sits above or below the horizon",
    paras: [
      "Solar altitude is the vertical angle of the Sun relative to the observer's ideal horizon: 0° at the horizon, positive above it and negative below it. It is useful for photography, shading, daylight studies and understanding how solar geometry changes through a day.",
      "The calculated geometric altitude may differ slightly from the apparent position near the horizon because the atmosphere refracts light. Buildings, mountains and trees can also block the Sun even when the mathematical altitude is positive.",
    ],
  },
  "sun-azimuth-calculator": {
    h2: "Sun azimuth gives compass direction, while altitude gives height",
    paras: [
      "Solar azimuth describes the Sun's horizontal compass direction at the selected place and time. Used together with altitude, it provides a practical two-angle description of where the Sun appears in the sky.",
      "Check the convention before copying azimuth into another system because some technical references measure angles from south rather than north. MapBench presents a compass-style direction and should be paired with local obstruction information for real shading or panel-placement decisions.",
    ],
  },
  "moon-phase-by-date": {
    h2: "Moon phase by date is a cycle estimate, not a precision lunar ephemeris",
    paras: [
      "The familiar phase names—new, first quarter, full and last quarter—describe positions within the approximately 29.53-day synodic cycle. This tool estimates where a selected date falls in that cycle and translates the result into a familiar phase label.",
      "Mean-cycle calculations are excellent for planning and education but can differ from an astronomical ephemeris by hours around exact phase events. Use an observatory-grade source when exact conjunction or opposition time matters.",
    ],
  },
  "moon-age-calculator": {
    h2: "Moon age counts days through the synodic cycle",
    paras: [
      "Lunar age is the approximate number of days since the most recent mean new moon. An age near zero is close to new moon, around 7.4 days is near first quarter, around 14.8 days is near full moon and roughly 22.1 days is near last quarter.",
      "Because the Moon's actual orbit is not uniform, a mean synodic cycle is an approximation rather than a replacement for a high-precision ephemeris. It is most useful for quick planning, teaching and comparing dates.",
    ],
  },
  "moon-illumination-calculator": {
    h2: "Illumination percentage describes the lit fraction, not how bright the Moon will look",
    paras: [
      "Moon illumination estimates what percentage of the visible lunar disc is lit by the Sun. The number follows the phase geometry and is useful for photography, night-sky planning and understanding where a date sits between new and full moon.",
      "Perceived brightness is not proportional to illumination percentage. Atmospheric conditions, lunar altitude, distance and the Moon's reflective geometry all influence how bright it appears from the ground.",
    ],
  },
  "next-full-moon-calculator": {
    h2: "The next full moon estimate follows the mean lunar cycle",
    paras: [
      "A full moon occurs when the Moon is approximately opposite the Sun as seen from Earth. This tool advances through the mean synodic cycle to estimate the next full-moon date after the selected starting point.",
      "For casual planning, the estimate is useful and easy to reproduce. Exact full-moon time can shift relative to a mean-cycle model, so astronomical observations, tides or time-critical events should use a current ephemeris.",
    ],
  },
  "next-new-moon-calculator": {
    h2: "The next new moon estimate is useful for planning dark-sky periods",
    paras: [
      "New moon occurs near solar-lunar conjunction, when the illuminated side is mostly turned away from Earth. A mean-cycle estimate helps identify upcoming dark-moon periods for stargazing, photography and calendar planning.",
      "The exact astronomical event depends on the real lunar orbit, so professional astronomy should use an ephemeris rather than a fixed 29.53-day cycle alone. Weather and local light pollution remain separate factors in actual sky darkness.",
    ],
  },
  "wkt-validator": {
    h2: "WKT validation should catch structure problems before geometry enters a GIS pipeline",
    paras: [
      "Well-Known Text represents geometry as readable text such as POINT, LINESTRING and POLYGON. A basic validator is useful for spotting malformed geometry names, broken parentheses and coordinate structures before data reaches a database, map renderer or spatial API.",
      "A structurally valid WKT string can still be geographically wrong. Axis order, coordinate reference system and units are normally supplied outside the bare geometry text, so validate those assumptions separately when exchanging data between systems.",
    ],
  },
  "wkt-bounding-box": {
    h2: "A WKT bounding box is a fast extent check before deeper spatial analysis",
    paras: [
      "The bounding box reports minimum and maximum X and Y values found in the geometry. That makes it useful for quickly checking whether a geometry falls in the expected region, creating map viewports or filtering data before a more expensive geometry operation.",
      "The box is only an envelope. It can include large areas not actually covered by the geometry, and X/Y may represent longitude/latitude, metres or another coordinate system depending on the source CRS.",
    ],
  },
  "wkt-coordinate-counter": {
    h2: "Coordinate count is a useful complexity signal, but not a measure of geometric quality",
    paras: [
      "Counting WKT coordinate pairs helps estimate geometry complexity, compare simplified versions and identify unexpectedly large features before import. A polygon with thousands of vertices may be expensive to render or transfer even if its geographic footprint is small.",
      "More coordinates do not automatically mean more accuracy. Repeated points, oversampling and noisy digitization can inflate vertex count without improving the underlying shape, so combine the count with visual inspection and simplification tests.",
    ],
  },
  "encoded-polyline-decoder": {
    h2: "Polyline decoding restores route points from a compact transport string",
    paras: [
      "Google-style encoded polylines compress latitude and longitude by rounding coordinates, storing differences between consecutive points and encoding those differences into printable characters. Decoding reverses that process so the route can be inspected, converted or plotted.",
      "Standard encoded polylines commonly use five decimal places, so the decoded coordinates should not be treated as survey-grade originals. Also confirm which polyline precision a source uses because some APIs use six decimals or a related variant.",
    ],
  },
  "encoded-polyline-encoder": {
    h2: "Polyline encoding trades coordinate verbosity for compact route transport",
    paras: [
      "Encoding a sequence of points into a polyline is useful for URLs, APIs and route payloads where raw JSON coordinate arrays are unnecessarily large. The algorithm rounds coordinates, stores point-to-point deltas and converts them into a compact character string.",
      "Encoding is intentionally lossy at the selected precision. Preserve the original coordinates when they matter, and document whether the receiving system expects polyline5, polyline6 or another variation before exchanging data.",
    ],
  },
};
