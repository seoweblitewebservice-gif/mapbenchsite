// Long-form on-page content for Coordinates and File tools (~170 words each).
export const COPY4: Record<string, { h2: string; paras: string[] }> = {
  "latitude-longitude-finder": {
    h2: "Click anywhere, read every coordinate format",
    paras: [
      "This is the platform's universal coordinate picker: click or drag on the map and the panel instantly shows the point in decimal degrees, degrees-minutes-seconds, UTM zone/easting/northing, MGRS grid reference and Open Location (Plus) Code — each with its own copy button. Zoom controls the precision you can read, and five decimals already lands within about a metre. It is the page to keep bookmarked whenever another system asks 'what are the coordinates of this spot?'",
      "Everything converts locally in your browser using standard WGS84 geodetic formulas, including the official Norway/Svalbard UTM zone exceptions, so the numbers you copy are interoperable with GPS devices, GIS software and mapping APIs. The current point lives in the URL, making any lookup shareable and reproducible — useful for property notes, field reports and support tickets. Pair it with the reverse geocoder when you also need the address, or feed the copied pair into distance, radius and elevation tools for deeper analysis.",
    ],
  },
  "gps-coordinate-lookup": {
    h2: "Making sense of coordinates from any device",
    paras: [
      "Handheld GPS units, cameras, drones and legacy datasets all emit coordinates in slightly different notations — decimal degrees, degrees with decimal minutes, full DMS with hemisphere letters, odd separators. Paste nearly any of them here and the tool parses it, validates it against WGS84 ranges, pins the exact spot on the map and presents every standard format for copying onward. A clear error message explains unparseable input instead of silently misplacing your point.",
      "The map preview is the trust layer: before you drive to a geocache, file a boundary note or trust an EXIF location, you see where the numbers actually land. Conversions — including UTM, MGRS and Plus Codes — run locally with full geodetic series, so results match professional software at the precision you entered. Nothing is uploaded; the lookup history never leaves your browser. When the point also needs a name, the coordinates-to-address tool reverse-geocodes it, and the coordinate converter handles bulkier mixed-format jobs.",
    ],
  },
  "coordinate-converter": {
    h2: "One input, every coordinate system",
    paras: [
      "Paste a coordinate in any supported notation — decimal degrees, DMS, UTM easting/northing with zone, MGRS grid reference or Plus Code — and this converter recognises the format and shows all the others simultaneously, updating on every keystroke. It is the Swiss-army page for anyone translating between worlds: GPS hobbyists (DMS), survey-adjacent work (UTM), military and search-and-rescue literature (MGRS), and shareable short codes (Plus Codes). The recognised source format is always labelled, so you know what the parser understood.",
      "All math is local and standards-based: WGS84 throughout, official UTM zone exceptions included, MGRS precision following your digit count (10 digits ≈ 1 m). Clicking the map feeds coordinates back into the input, closing the loop between visual and textual workflows. Only the map preview needs a network connection; the conversions themselves work offline. For single-direction jobs the dedicated DMS and UTM pages are leaner, and for naming the point the reverse geocoder adds the address layer.",
    ],
  },
  "dms-to-decimal": {
    h2: "Why and how to convert DMS to decimal degrees",
    paras: [
      "Degrees-minutes-seconds is the notation of paper charts, old surveys and many handheld GPS screens; decimal degrees is what every web map, API and spreadsheet wants. Paste values like 40°26'46\"N 79°58'36\"W — hemisphere letters, minus signs or mixed separators all accepted — and get clean signed decimal pairs ready to copy. The parser validates ranges (latitude ≤ 90, longitude ≤ 180) and explains failures instead of guessing.",
      "The arithmetic is the classic sexagesimal expansion — degrees plus minutes over 60 plus seconds over 3600 — with south and west becoming negative, and the page shows the mapping explicitly so students learn rather than just copy. Precision is preserved to the sub-metre level your input carries. When the source is already decimal and the destination must be chart notation, the decimal-to-DMS tool runs the conversion in reverse; for UTM, MGRS or Plus Code targets, the all-in-one converter covers the rest of the family.",
    ],
  },
  "decimal-to-dms": {
    h2: "From decimal degrees to classic chart notation",
    paras: [
      "Decimal 40.44611 becomes 40° 26' 46.00\" N in one keystroke. This tool converts decimal degrees into degrees, minutes and seconds with hemisphere letters — the notation printed on nautical charts, used in astronomy circles, and required by legacy forms and some GPS devices. Two-decimal seconds preserve roughly a third of a metre, more precision than any consumer receiver can claim, and the display keeps both the pretty string and the raw values for copying.",
      "Sign conventions are handled the way standards expect: negative latitudes become south, negative longitudes west, so there is never a minus sign and a letter competing. The converter runs entirely in your browser and pairs naturally with its inverse, the DMS-to-decimal tool, and with the all-format coordinate converter when UTM or MGRS outputs are also needed. A small reference on the page reminds you what each decimal place is worth in metres — the quickest way to choose sensible rounding for your use case.",
    ],
  },
  "utm-converter": {
    h2: "Converting between UTM grid and latitude/longitude",
    paras: [
      "Universal Transverse Mercator expresses position as zone, easting and northing in metres — the grid of field navigation, topographic sheets and much engineering work. This tool converts in both directions: paste lat/long to get zone, hemisphere, easting and northing on the WGS84 datum, or paste a UTM triple (like '32N 500000 4600000') to get decimal coordinates, with a map preview to verify visually. The full standard series is implemented, including the widened zones 31–37 around Norway and Svalbard.",
      "Because both directions use the same reference ellipsoid (WGS84, the GPS datum), round-trips are exact at display precision; if your source material is on an older local datum such as NAD27, convert datums first — a mismatch there shows up as a consistent offset, and the page says so plainly. Survey-adjacent professionals, hikers reading topographic maps, and drone operators filing in grid references are the core users. MGRS, the letter-based cousin of UTM, has its own converter one link away.",
    ],
  },
  "mgrs-converter": {
    h2: "Military Grid Reference System, both directions",
    paras: [
      "MGRS encodes a UTM position as a short, unambiguous string — zone, band letters, grid square and numeric easting/northing — where the digit count sets precision: 4 digits ≈ 1 km, 6 ≈ 100 m, 10 ≈ 1 m. Paste a reference like 33UUP 05300 21500 and the tool decodes it to decimal latitude/longitude and pins it on the map; paste coordinates and it encodes MGRS at your chosen precision. Spaces are optional, case insensitive, validation strict.",
      "The encoding implements the official column/row lettering schemes and latitude bands, so results interoperate with military, SAR and orienteering materials. The map preview is the safety net: a single mistyped letter moves you 100 km, and seeing the pin land wrong is how operators catch it. Because MGRS is notation on top of the UTM grid, the UTM converter sits one click away for the numeric view, and the coordinate converter bundles everything when you are unsure which system a source string uses.",
    ],
  },
  "plus-code-lookup": {
    h2: "Short codes for places without addresses",
    paras: [
      "Open Location Codes (Plus Codes) divide the Earth into a grid of progressively finer cells, giving every spot a short, pronounceable code like 87GVCWC8+3V — invaluable where street addressing is thin: trailheads, market stalls, rural homes, meeting points. This tool decodes any code to coordinates with the spot pinned on the map, and encodes any point — pasted coordinates or a map click — back into its code, ready to share over the phone or a radio.",
      "Codes are pure math, not a database: the alphabet and cell subdivision are an open standard, so decoding works offline and forever. The tool shows how precision scales with code length and keeps conversions local in your browser. Plus Codes complement rather than replace the classical systems — UTM for field grids, MGRS for military prose, DMS for charts — and the all-in-one converter shows all of them together. When the code's spot also needs a postal address, the reverse geocoder provides it.",
    ],
  },
  "coordinate-bearing-calculator": {
    h2: "Bearings computed straight from coordinates",
    paras: [
      "When both endpoints are raw coordinates — waypoints from a GPS, survey points, dataset rows — this tool computes the full bearing picture without detouring through place names: initial bearing, back bearing and the 16-point compass translation, all from the standard spherical azimuth formula on WGS84. Paste pairs in decimal or DMS; validation catches out-of-range values before math, and the map draws the great-circle line so the number always has a visual anchor.",
      "Initial and final bearings differ along a great circle (except on meridians and the equator), and the back bearing is computed independently rather than assumed ±180° — small rigour, real accuracy on long legs. Results are true-north based; magnetic work adds your local declination, with pointers to geomagnetic models in the methodology. Typical jobs: aiming directional antennas between two known masts, describing a survey leg, checking a drone's heading plan. Distance and midpoint for the same pair live in the sibling coordinate calculators.",
    ],
  },
  "coordinate-distance-calculator": {
    h2: "The fastest distance between two coordinate pairs",
    paras: [
      "A streamlined distance instrument for coordinate-first workflows: paste two pairs — decimal, spaced or DMS — and read the great-circle distance in a complete unit table at once, kilometres through nautical miles. There is deliberately less to click than in the place-search tools; the interface assumes you already hold the numbers and just need the geometry. Inputs are range-validated and errors explained, and the tiny map preview confirms both points landed where expected.",
      "The engine is the same haversine-on-WGS84 computation used across the platform, accurate to about 0.3% of ellipsoidal geodesics and immune to the flat-map failures that plague naive spreadsheet formulas at scale or near the poles. Everything computes locally, instantly, with no upload — suitable for checking dozens of pairs in a row while cleaning data. When endpoints are names instead of numbers, the distance-between-two-places page adds geocoding; when direction matters as much as length, the coordinate bearing calculator completes the pair.",
    ],
  },
  "coordinate-midpoint-calculator": {
    h2: "The correct midpoint between two coordinates",
    paras: [
      "Averaging latitudes and longitudes is wrong — biased on the sphere, broken across hemispheres, nonsense across the date line. This tool computes the true spherical midpoint of two coordinate pairs: the point half-way along the great-circle arc, correct everywhere on Earth. Paste both pairs in any common notation, read the midpoint in decimal and DMS, copy it onward, or open it on the map to see exactly where the balance point of your two locations falls.",
      "The result also reverse-geocodes to the nearest named place, turning abstract coordinates into a usable answer ('the midpoint is nearest to…') — and when that place is open ocean, the tool says so instead of dressing it up. All math is local and standards-based; nothing is stored. For name-based inputs the halfway-between-two-places page adds search and richer context; for the full geometry of the same pair, the coordinate distance and bearing calculators sit alongside in the coordinate family.",
    ],
  },
  "geojson-viewer": {
    h2: "Validate, inspect and convert GeoJSON privately",
    paras: [
      "Drop a .geojson file — or paste raw GeoJSON text — and this workbench validates the structure, reports the feature count by geometry type, draws everything on an interactive map and lists every feature for property inspection on click. Points, MultiPoints, lines, MultiLines, polygons, MultiPolygons and GeometryCollections are all supported, exactly per spec. Invalid JSON gets a precise, human error (trailing commas and unquoted keys are named offenders) instead of a silent failure.",
      "The privacy guarantee is architectural: parsing happens in your browser via FileReader and DOMParser, and the file never touches a server — check the network tab to verify. When you need other ecosystems, one-click exports convert to KML or GPX with names and properties preserved as far as each format allows, and GeoJSON re-download normalises what you pasted. Bounding-box zoom frames any dataset instantly. It is the first stop for QA on exports from QGIS, Mapshaper, Felt or any API you trust slightly less than you should.",
    ],
  },
  "kml-viewer": {
    h2: "Opening KML files from Google Earth and My Maps",
    paras: [
      "KML remains the export format of Google Earth, Google My Maps and a decade of saved places. Drop a .kml file here and supported placemarks, lines and polygons render on an interactive map, with some names, descriptions and ExtendedData available for inspection. The viewer has no layer visibility toggles; bounding-box zoom attempts to frame the data, and clear errors explain empty or malformed files — including the classic KMZ trap: a KMZ is a ZIP archive, so unzip first and drop the .kml inside.",
      "All parsing is local — DOMParser in your browser, nothing uploaded — which matters when the file contains client sites, survey points or unpublished plans. When the data needs to move on, one click exports GeoJSON for web GIS or GPX for devices, but conversion can omit geometry, styling, timestamps or other properties. Colours render with sensible defaults rather than mimicking Google's styling engine, and the page says so. For the reverse direction, or for track-heavy files, the sibling GPX and GeoJSON viewers complete the family.",
    ],
  },
  "gpx-viewer": {
    h2: "Tracks, waypoints and honest elevation stats",
    paras: [
      "Open a GPX file from a bike computer, hiking app, drone or handheld and the tool draws every track, route and waypoint on the map and computes the full stat sheet: total distance, elevation gain and loss, minimum and maximum elevation, and duration whenever timestamps exist. An elevation profile chart shows the shape of the day, with the same local, private parsing as the rest of the file tools — your activity never leaves the browser.",
      "Methodology notes keep the numbers honest: gain sums positive differences between consecutive trackpoints, and raw GPS elevation is noisy, so gain figures can look inflated — that is the source data, not the math. Missing timestamps are reported as missing rather than faked. Conversions export the same geometry as GeoJSON or KML, and a GPX re-download may omit timestamps and extensions, so keep the original file. Pair it with the elevation profile tool to compare a recorded track against terrain truth from the Copernicus DEM.",
    ],
  },
  "csv-to-map": {
    h2: "From spreadsheet rows to an instant map",
    paras: [
      "Upload or paste a CSV containing latitude and longitude columns and this tool maps it instantly: coordinate columns are auto-detected from headers (lat/latitude/y, lng/lon/longitude/x and friends) but always overridable by dropdown, an optional label column feeds popups and an optional category column colours the points with a legend. Marker clustering keeps tens of thousands of rows fluid, and skipped rows — invalid or out-of-range coordinates — are counted and reported rather than silently dropped.",
      "Everything runs locally: parsing, clustering, rendering, export. The result leaves your browser as GeoJSON or KML for GIS use, or back as CSV after you have confirmed which columns meant what. Typical jobs include plotting store lists, visualising sensor logs, checking a geocoding batch for offshore mistakes, and turning survey responses into a map for a report. When the data starts as GPX or KML instead, the sibling viewers convert it into the same pipeline; for hand-placed points, the pin map is the lighter instrument.",
    ],
  },
};
