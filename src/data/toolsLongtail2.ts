import type { ToolDef } from "@/lib/registry";

function keywords(primary: string, extras: string[] = []) {
  const base = [
    primary,
    `${primary} online`,
    `free ${primary}`,
    `${primary} calculator`,
    `${primary} tool`,
    `how to calculate ${primary}`,
    `${primary} formula`,
    `${primary} map tool`,
    `${primary} converter`,
    `${primary} estimate`,
    `${primary} measurement`,
    `${primary} checker`,
    `${primary} planner`,
    `${primary} worldwide`,
    `${primary} no signup`,
    ...extras,
  ];
  return Array.from(new Set(base)).slice(0, 15);
}

function makeTool(
  slug: string,
  name: string,
  short: string,
  category: ToolDef["category"],
  mode: string,
  method: string,
  related: string[],
  extraKeywords: string[] = [],
): ToolDef {
  return {
    slug,
    name,
    short,
    intro: `${name} is built for one specific calculation rather than a generic map page. Enter the requested values, review the result immediately, and use the method note to understand what the number represents.`,
    category,
    scope: "Worldwide",
    component: "longtail2",
    props: { mode },
    keywords: keywords(name.toLowerCase(), extraKeywords),
    faq: [
      ["What does this tool calculate?", short],
      ["Do I need an account?", "No. The calculator works without creating an account."],
      ["Can I use the result for professional work?", "Use it for planning and analysis. Survey, engineering, legal, or safety-critical work should be verified against the appropriate professional standard or authoritative dataset."],
    ],
    howTo: ["Enter the requested values.", "Review the calculated output.", "Check the method and assumptions before using the result in a decision."],
    related,
    method,
  };
}

export const LONGTAIL_TOOLS_2: ToolDef[] = [
  makeTool("fence-length-calculator","Fence Length Calculator","Calculate the perimeter and fence length for a rectangular plot.","radius","fence-length","Perimeter = 2 × (length + width).",["map-area-calculator","lot-size-calculator"],["property fence calculator","plot perimeter calculator"]),
  makeTool("rectangular-lot-acreage-calculator","Rectangular Lot Acreage Calculator","Convert rectangular lot dimensions into square feet, acres and hectares.","radius","rectangle-acreage","Area = length × width, then converted to acres and hectares.",["lot-size-calculator","map-area-calculator"],["lot acres calculator","land acreage calculator"]),
  makeTool("crop-row-length-calculator","Crop Row Length Calculator","Estimate row count and total crop-row length from field dimensions and row spacing.","radius","crop-row-length","Rows are estimated from field width divided by row spacing; total row length is row count × field length.",["map-area-calculator","rectangular-lot-acreage-calculator"],["farm row calculator","row spacing calculator"]),
  makeTool("seed-quantity-per-acre-calculator","Seed Quantity Per Acre Calculator","Estimate total seed required from acreage and a seeding rate.","radius","seed-quantity","Seed required = area × seeding rate.",["rectangular-lot-acreage-calculator","crop-row-length-calculator"],["seed rate calculator","seeding rate per acre"]),
  makeTool("fertilizer-amount-calculator","Fertilizer Amount Calculator","Estimate fertilizer quantity from field acreage and application rate.","radius","fertilizer-amount","Fertilizer required = area × application rate, with pound-to-kilogram conversion.",["rectangular-lot-acreage-calculator","seed-quantity-per-acre-calculator"],["fertilizer per acre calculator","application rate calculator"]),
  makeTool("irrigation-coverage-calculator","Irrigation Coverage Calculator","Calculate ideal circular sprinkler coverage from spray radius.","radius","irrigation-coverage","Ideal coverage uses circle area πr² and does not model wind, pressure loss, obstacles or overlap.",["map-radius","sprinkler-count-calculator"],["sprinkler coverage area","irrigation radius calculator"]),
  makeTool("sprinkler-count-calculator","Sprinkler Count Calculator","Estimate the number of sprinklers needed for a field using radius and overlap allowance.","radius","sprinkler-count","Effective coverage per sprinkler is circular area adjusted by the chosen overlap allowance.",["irrigation-coverage-calculator","map-area-calculator"],["how many sprinklers do i need","irrigation sprinkler planner"]),
  makeTool("grazing-stock-density-calculator","Grazing Stock Density Calculator","Calculate animals per acre and acres available per animal.","radius","stock-density","Stock density is animals divided by pasture area; this is an arithmetic density, not a carrying-capacity recommendation.",["rectangular-lot-acreage-calculator","map-area-calculator"],["animals per acre calculator","pasture stocking density"]),

  makeTool("circle-area-from-radius","Circle Area From Radius Calculator","Calculate circle area and circumference from radius.","radius","circle-area-radius","Area = πr²; circumference = 2πr.",["map-radius","radius-from-circle-area"],["area of circle from radius","circle area formula"]),
  makeTool("radius-from-circle-area","Radius From Circle Area Calculator","Find circle radius and diameter from a known area.","radius","radius-from-area","Radius = √(area / π).",["circle-area-from-radius","map-radius"],["radius given area","circle radius from area"]),
  makeTool("circle-circumference-from-radius","Circle Circumference From Radius","Calculate circumference and diameter from circle radius.","radius","circumference-radius","Circumference = 2πr; diameter = 2r.",["circle-area-from-radius","radius-from-circumference"],["circumference calculator radius","circle perimeter calculator"]),
  makeTool("radius-from-circumference","Radius From Circumference Calculator","Find circle radius and diameter from circumference.","radius","radius-from-circumference","Radius = circumference / (2π).",["circle-circumference-from-radius","map-radius"],["find radius from circumference","circle radius calculator"]),
  makeTool("equal-circle-overlap-calculator","Equal Circle Overlap Calculator","Calculate overlap area and percentage for two equal-radius circles.","radius","circle-overlap","Uses the standard two-equal-circle lens-area equation from radius and centre separation.",["map-radius","multi-radius-map"],["two circle overlap area","circle intersection area calculator"]),

  makeTool("polygon-area-from-coordinates","Polygon Area From Coordinates","Estimate polygon area from pasted latitude/longitude vertices.","coordinates","polygon-area-coordinates","Coordinates are locally projected around their mean latitude and measured with a planar shoelace approximation suitable for modest-size shapes.",["map-area-calculator","polygon-perimeter-from-coordinates"],["lat long polygon area","gps coordinates area calculator"]),
  makeTool("polygon-perimeter-from-coordinates","Polygon Perimeter From Coordinates","Estimate polygon perimeter from pasted coordinate vertices.","coordinates","polygon-perimeter-coordinates","Vertices are locally projected and consecutive segment lengths are summed around the closed polygon.",["polygon-area-from-coordinates","perimeter-calculator"],["coordinate perimeter calculator","lat long perimeter"]),
  makeTool("polygon-centroid-from-coordinates","Polygon Centroid From Coordinates","Estimate the geometric centroid of a coordinate polygon.","coordinates","polygon-centroid-coordinates","Uses the polygon centroid equation on a local equirectangular projection.",["polygon-area-from-coordinates","latitude-longitude-finder"],["polygon center coordinates","centroid lat long calculator"]),
  makeTool("coordinate-bounding-box-generator","Coordinate Bounding Box Generator","Generate north, south, east and west bounds from a coordinate list.","coordinates","coordinate-bbox-generator","Bounds are the minimum and maximum latitude and longitude values in the supplied coordinate set.",["bounding-box-calculator","polygon-area-from-coordinates"],["lat long bounding box","coordinates bbox generator"]),
  makeTool("coordinate-radius-points-generator","Coordinate Radius Points Generator","Generate evenly spaced latitude/longitude points around a radius circle.","coordinates","coordinate-radius-points","Uses great-circle destination-point equations from a centre, distance and evenly spaced bearings.",["map-radius","coordinate-destination-calculator"],["points around circle coordinates","radius coordinate generator"]),

  makeTool("unix-timestamp-to-local-time","Unix Timestamp to Local Time Converter","Convert a Unix timestamp to a selected IANA time zone.","location","unix-to-local","The timestamp is interpreted as Unix seconds and formatted using browser IANA time-zone rules.",["time-zone-converter","local-time-to-unix-timestamp"],["epoch to local time","unix time converter"]),
  makeTool("local-time-to-unix-timestamp","Local Time to Unix Timestamp","Convert a wall-clock date and time in an IANA time zone into Unix seconds.","location","local-to-unix","Iteratively resolves the selected IANA zone offset for the requested wall-clock time.",["unix-timestamp-to-local-time","time-zone-converter"],["local time to epoch","date to unix timestamp"]),
  makeTool("utc-offset-by-coordinates","UTC Offset by Coordinates","Find the IANA time zone and UTC offset for latitude/longitude on a selected date.","location","utc-offset-coordinates","Coordinates are mapped to an IANA zone, then the browser's time-zone database supplies the date-specific offset.",["time-zone-converter","latitude-longitude-finder"],["timezone by coordinates","utc offset lat long"]),
  makeTool("local-time-by-coordinates","Local Time by Coordinates","Resolve coordinates to a time zone and show local clock time for a reference instant.","location","local-time-coordinates","Latitude/longitude is mapped to IANA time zone rules before formatting the reference instant.",["utc-offset-by-coordinates","time-zone-converter"],["local time latitude longitude","time at coordinates"]),
  makeTool("dst-checker-by-coordinates","DST Checker by Coordinates","Check whether daylight-saving time is active for coordinates on a selected date.","location","dst-checker-coordinates","The coordinate time zone's selected-date offset is compared with its winter/summer standard-offset pattern.",["utc-offset-by-coordinates","time-zone-converter"],["daylight saving by location","is dst active"]),
  makeTool("working-hours-overlap-calculator","Working Hours Overlap Calculator","Find overlapping work hours between two IANA time zones.","location","working-hours-overlap","Both work windows are translated to a common time-zone frame using current IANA offsets.",["time-zone-converter","time-difference-between-timezones"],["timezone work overlap","remote team meeting hours"]),
  makeTool("time-difference-between-timezones","Time Difference Between Time Zones","Calculate the offset difference between two IANA time zones for a chosen date.","location","time-difference-zones","Difference = zone B UTC offset − zone A UTC offset for the selected date.",["working-hours-overlap-calculator","time-zone-converter"],["timezone difference calculator","hours difference between time zones"]),

  makeTool("civil-twilight-calculator","Civil Twilight Calculator","Calculate approximate civil dawn and dusk for coordinates and date.","sun","civil-twilight","Uses the standard solar-event algorithm at a 96° zenith (Sun 6° below the horizon).",["sunrise-sunset-calculator","nautical-twilight-calculator"],["civil dawn time","civil dusk calculator"]),
  makeTool("nautical-twilight-calculator","Nautical Twilight Calculator","Calculate approximate nautical dawn and dusk for coordinates and date.","sun","nautical-twilight","Uses the standard solar-event algorithm at a 102° zenith (Sun 12° below the horizon).",["civil-twilight-calculator","astronomical-twilight-calculator"],["nautical dawn calculator","nautical dusk time"]),
  makeTool("astronomical-twilight-calculator","Astronomical Twilight Calculator","Calculate approximate astronomical dawn and dusk for coordinates and date.","sun","astronomical-twilight","Uses the standard solar-event algorithm at a 108° zenith (Sun 18° below the horizon).",["nautical-twilight-calculator","sunrise-sunset-calculator"],["astronomical dawn calculator","astronomical dusk time"]),
  makeTool("solar-noon-calculator","Solar Noon Calculator","Estimate solar noon from sunrise and sunset geometry for coordinates and date.","sun","solar-noon","Approximates solar noon as the midpoint between calculated sunrise and sunset in UTC.",["sunrise-sunset-calculator","sun-altitude-calculator"],["sun at highest point time","local solar noon"]),
  makeTool("sun-altitude-calculator","Sun Altitude Calculator","Estimate the Sun's altitude above or below the horizon for coordinates and UTC time.","sun","sun-altitude","Uses a NOAA-style solar-position calculation based on Julian time, declination, equation of time and hour angle.",["sun-azimuth-calculator","solar-noon-calculator"],["solar elevation angle","sun height calculator"]),
  makeTool("sun-azimuth-calculator","Sun Azimuth Calculator","Estimate the Sun's compass azimuth for coordinates and UTC time.","sun","sun-azimuth","Uses a NOAA-style solar-position calculation to derive azimuth from solar declination and hour angle.",["sun-altitude-calculator","sun-position"],["solar azimuth angle","sun direction calculator"]),

  makeTool("moon-phase-by-date","Moon Phase by Date","Estimate the Moon's phase name for a selected date.","sun","moon-phase-date","Uses mean synodic-month age from a reference new-moon epoch.",["moon-phase-calendar","moon-age-calculator"],["what moon phase on date","lunar phase calculator"]),
  makeTool("moon-age-calculator","Moon Age Calculator","Estimate lunar age in days since the most recent mean new moon.","sun","moon-age","Moon age is calculated modulo the mean 29.530588853-day synodic month.",["moon-phase-by-date","moon-illumination-calculator"],["lunar age days","days since new moon"]),
  makeTool("moon-illumination-calculator","Moon Illumination Calculator","Estimate the illuminated fraction of the Moon for a selected date.","sun","moon-illumination","Illumination is approximated from mean lunar phase angle using the synodic cycle.",["moon-age-calculator","moon-phase-by-date"],["moon percent illuminated","lunar illumination calculator"]),
  makeTool("next-full-moon-calculator","Next Full Moon Calculator","Estimate the date of the next mean full moon after a selected date.","sun","next-full-moon","Advances through the mean synodic cycle to the 50% lunar-age point.",["moon-phase-by-date","next-new-moon-calculator"],["when is next full moon","full moon date calculator"]),
  makeTool("next-new-moon-calculator","Next New Moon Calculator","Estimate the date of the next mean new moon after a selected date.","sun","next-new-moon","Advances to the next start of the mean 29.530588853-day synodic cycle.",["moon-phase-by-date","next-full-moon-calculator"],["when is next new moon","new moon date calculator"]),

  makeTool("wkt-validator","WKT Validator","Check basic Well-Known Text geometry type and coordinate structure.","files","wkt-validator","Parses supported WKT geometry names and extracts numeric coordinate pairs for a structural sanity check.",["geojson-validator","wkt-bounding-box"],["well known text validator","validate wkt geometry"]),
  makeTool("wkt-bounding-box","WKT Bounding Box Calculator","Calculate a bounding box from WKT coordinate pairs.","files","wkt-bbox","Extracts WKT coordinate pairs and returns minimum/maximum X and Y values.",["wkt-validator","bounding-box-calculator"],["wkt bbox","wkt extent calculator"]),
  makeTool("wkt-coordinate-counter","WKT Coordinate Counter","Count coordinate pairs in a WKT geometry string.","files","wkt-coordinate-count","Extracts numeric X/Y coordinate pairs from supported WKT geometry text.",["wkt-validator","geojson-coordinate-counter"],["count wkt points","wkt vertices counter"]),
  makeTool("encoded-polyline-decoder","Encoded Polyline Decoder","Decode a Google-style encoded polyline into latitude/longitude points.","files","polyline-decode","Implements the standard 5-decimal encoded-polyline delta and variable-length integer algorithm.",["encoded-polyline-encoder","gpx-viewer"],["google polyline decoder","decode route polyline"]),
  makeTool("encoded-polyline-encoder","Encoded Polyline Encoder","Encode latitude/longitude points into Google-style polyline text.","files","polyline-encode","Rounds coordinates to 5 decimals, delta-encodes them and applies the standard variable-length polyline encoding.",["encoded-polyline-decoder","coordinate-parser"],["google polyline encoder","encode lat long polyline"]),
  makeTool("geojson-to-csv-converter","GeoJSON to CSV Converter","Convert GeoJSON Point features and properties into CSV rows.","files","geojson-to-csv","Exports Point-feature properties plus latitude and longitude columns; non-Point geometries are intentionally skipped.",["csv-to-geojson-converter","geojson-viewer"],["convert geojson points to csv","geojson csv export"]),
  makeTool("csv-to-geojson-converter","CSV to GeoJSON Converter","Convert CSV rows with latitude/longitude columns into GeoJSON Point features.","files","csv-to-geojson","Recognizes latitude and longitude headers and maps remaining CSV columns to GeoJSON feature properties.",["geojson-to-csv-converter","csv-to-map"],["csv lat long to geojson","spreadsheet to geojson"]),
];
