/**
 * Topic-cluster (hub-and-spoke) taxonomy for the public tool directory.
 *
 * Why this file exists
 * --------------------
 * The site previously exposed twelve editorial *categories*. They were useful
 * for browsing but did not line up with search intent: several categories
 * mixed two or three distinct jobs (area + farm calculators inside "Radius &
 * Area", time zones inside "Location", admin boundaries inside
 * "Coordinates"), which made it hard for a crawler — or a reader — to tell
 * which page is the authority for a term.
 *
 * A hub is a pillar page: one search intent, one page, one keyword family.
 * Every tool is assigned to exactly one hub (its parent). Hubs link down to
 * every child, children link up to the hub, sideways to siblings and across to
 * related hubs. Guides and best-of pages sit at the same level as hubs and
 * push readers into the matching tools.
 *
 * Membership rules are declarative (category + slug patterns) with explicit
 * overrides for the handful of tools whose placement is not obvious from the
 * name. `npm run audit:links` prints the resolved assignment so the rules stay
 * auditable.
 */
import type { CategoryId, ToolDef } from "@/lib/registry";

export type HubId =
  | "distance"
  | "bearing-midpoint"
  | "routes"
  | "radius"
  | "area"
  | "land"
  | "location"
  | "coordinates"
  | "time"
  | "sun-moon"
  | "lookup"
  | "earth"
  | "gis-files"
  | "map-maker";

/** A paragraph of intro copy that can carry inline links. */
export interface HubSegment { t: string; l?: string }

export interface HubDef {
  id: HubId;
  /** Public path. Top-level, short and keyword-led; nested sub-hubs live under it. */
  slug: string;
  /** Navigation / card label. */
  label: string;
  /** H1. Unique across the site. */
  h1: string;
  /** <title> without the brand suffix. */
  title: string;
  /** Meta description, under ~158 characters. */
  description: string;
  /** The broad head term this pillar targets. Never reused on another page. */
  primaryKeyword: string;
  /** Close variants used in subheads, intro copy and FAQs. */
  secondaryKeywords: string[];
  /** One line, used in cards, footer and cross-hub blocks. */
  short: string;
  /** 150–250 words in two or three paragraphs; first paragraph links the top tools. */
  intro: HubSegment[][];
  /** Three tools that deserve the first click, in order. */
  topTools: string[];
  /** Guides that support this cluster. */
  guides: string[];
  /** Hubs to link to from the "you may also need" block. */
  crossHubs: HubId[];
  /** Sub-hubs (GIS file families, blank maps). */
  children?: { href: string; label: string; note: string }[];
  /** FAQ shown at the foot of the pillar page. */
  faq?: [string, string][];
  /** Optional tone for the hub card. */
  tone?: string;
}

export const HUBS: HubDef[] = [
  {
    id: "distance",
    slug: "/distance",
    label: "Distance Calculators",
    h1: "Distance Calculators for Any Two Points",
    title: "Distance Calculators: Straight-Line, Flight, Matrix & More",
    description:
      "Free distance calculators for two places, coordinates, cities, flights, shipping routes and distance to the coast, poles or equator. Great-circle math, no sign-up.",
    primaryKeyword: "distance calculators",
    secondaryKeywords: [
      "map distance calculator",
      "distance between two places",
      "straight line distance calculator",
      "distance between two locations",
      "great circle distance calculator",
      "distance calculator between cities",
    ],
    short: "Straight-line, flight, shipping and city-to-city distances.",
    intro: [
      [
        { t: "These distance calculators answer one question in a dozen ways: how far apart are two points? Start with the " },
        { t: "distance between two places", l: "/tools/distance-between-two-places" },
        { t: " calculator if you just need the number between two towns or addresses, use the " },
        { t: "straight-line distance calculator", l: "/tools/crow-flies-distance" },
        { t: " when you want the crow-flies figure with an explanation of the method, or open the " },
        { t: "distance matrix calculator", l: "/tools/distance-matrix-calculator" },
        { t: " when you need many origin–destination pairs at once." },
      ],
      [
        { t: "Every result on this page is a geometric measurement on the WGS84 sphere — a great-circle arc, not a road. That is deliberate: geometric distance is the stable baseline you can reproduce, compare and check. When the real question is about travel, pair a result here with the " },
        { t: "driving distance calculator", l: "/tools/driving-distance-calculator" },
        { t: " or a drive-time map, which follow the road network instead. The gap between the two numbers is often the most useful thing you learn." },
      ],
      [
        { t: "Coverage is worldwide and every calculator states its method and units. Areas of the world with sparse place data are better served by entering coordinates directly — the " },
        { t: "latitude and longitude finder", l: "/tools/latitude-longitude-finder" },
        { t: " gives you a coordinate pair to paste in." },
      ],
    ],
    topTools: ["distance-between-two-places", "distance-matrix-calculator", "flight-distance-calculator"],
    guides: [
      "/guides/how-distance-calculation-works",
      "/guides/straight-line-distance-vs-road-distance",
      "/guides/crow-flies-when-it-lies",
      "/guides/quiet-math-of-horizons",
    ],
    crossHubs: ["routes", "bearing-midpoint", "radius"],
    tone: "#b45309",
  },
  {
    id: "bearing-midpoint",
    slug: "/bearing-midpoint",
    label: "Bearing & Midpoint",
    h1: "Bearing Calculator, Midpoint & Meeting Point Tools",
    title: "Bearing & Midpoint Tools: Compass Direction and Halfway Points",
    description:
      "Find the compass bearing, the geographic midpoint and the fairest meeting point between two or more places. Free map tools with explained spherical math.",
    primaryKeyword: "bearing and midpoint tools",
    secondaryKeywords: [
      "geographic midpoint calculator",
      "compass direction finder",
      "halfway between two places",
      "meeting point finder",
      "compass bearing calculator",
      "find midpoint between two locations",
    ],
    short: "Compass direction, halfway points and fair meeting spots.",
    intro: [
      [
        { t: "Direction and midpoint questions look simple until you try them on a globe. Use the " },
        { t: "bearing calculator", l: "/tools/bearing-calculator" },
        { t: " to get the initial and final compass heading between two coordinates, the " },
        { t: "halfway-between-two-places tool", l: "/tools/halfway-between-two-places" },
        { t: " for the true geographic midpoint, and the " },
        { t: "meeting point finder", l: "/tools/optimal-meeting-point" },
        { t: " when the goal is the fairest spot for several people rather than the strict centre of the geometry." },
      ],
      [
        { t: "A great-circle bearing is not a constant heading. On a long route the direction you steer changes as you cross meridians, which is why the initial and final bearings differ and why intercontinental flight paths curve on a flat map. MapBench reports both, plus the compass point, rather than presenting one number as the whole answer. The same geometry explains why averaging two latitudes and longitudes is not the midpoint — it distorts with distance and breaks across the date line." },
      ],
      [
        { t: "Map scale belongs to this cluster too: if you are measuring on paper rather than on screen, the " },
        { t: "map scale calculator", l: "/tools/map-scale-calculator" },
        { t: " converts between measured length, ground distance and the scale ratio. For distances rather than directions, start from the " },
        { t: "distance calculators", l: "/distance" },
        { t: " hub." },
      ],
    ],
    topTools: ["bearing-calculator", "halfway-between-two-places", "optimal-meeting-point"],
    guides: [
      "/guides/how-to-choose-a-meeting-point-between-places",
      "/guides/understanding-gps-coordinates",
    ],
    crossHubs: ["distance", "routes", "location"],
    tone: "#9d174d",
  },
  {
    id: "routes",
    slug: "/routes",
    label: "Routes & Travel Time",
    h1: "Route Planners, Drive Time & Travel Time Tools",
    title: "Route Planners, Drive Time Maps & Travel Time Calculators",
    description:
      "Plan routes, estimate drive, walk and cycle times, compare multi-stop trips, map drive-time areas and work out fuel costs. Free, no account needed.",
    primaryKeyword: "route and travel time tools",
    secondaryKeywords: [
      "travel time calculator",
      "drive time calculator",
      "driving time calculator",
      "multi stop route planner",
      "isochrone map",
      "travel time estimator",
    ],
    short: "Routes, drive times, isochrones and trip costs.",
    intro: [
      [
        { t: "Routing turns a road network into an answer. Start with the " },
        { t: "driving distance calculator", l: "/tools/driving-distance-calculator" },
        { t: " for road miles between two places, open the " },
        { t: "drive time map", l: "/tools/drive-time-map" },
        { t: " to see everywhere reachable in a given number of minutes, or build an itinerary with the " },
        { t: "multi-stop route planner", l: "/tools/multi-stop-route-planner" },
        { t: " when you have more than two stops to order." },
      ],
      [
        { t: "Route results are network results, so they behave differently from circles and straight lines: they stretch along fast corridors, pinch at bridges and rivers, and grow when the only crossing is far away. Times come from a public routing engine working on OpenStreetMap data and are free-flow estimates built from speed limits and road classes — not live traffic. A 25-minute result is the physics of the network; rush hour adds the rest, so plan appointments with a buffer of roughly 20–40% in dense cities." },
      ],
      [
        { t: "Walking, cycling and hiking modes use genuinely different networks, which is why the same pair of points can produce three different times. For trip budgeting, the fuel cost calculator and fuel stop planner sit in this cluster; for the geometric baseline behind any route, compare against the " },
        { t: "distance calculators", l: "/distance" },
        { t: " or a " },
        { t: "radius map", l: "/radius" },
        { t: " when reach really is circular." },
      ],
    ],
    topTools: ["drive-time-map", "driving-distance-calculator", "multi-stop-route-planner"],
    guides: [
      "/guides/radius-vs-drive-time-vs-straight-line-distance",
      "/guides/drive-time-map-vs-radius-circle",
      "/guides/reading-isochrones-like-a-planner",
      "/guides/road-trip-with-free-map-tools",
    ],
    crossHubs: ["distance", "radius", "time"],
    tone: "#9d174d",
  },
  {
    id: "radius",
    slug: "/radius",
    label: "Radius & Service Area",
    h1: "Radius Map Tools and Service Area Calculators",
    title: "Radius Map Tools: Draw a Radius Around a Location",
    description:
      "Draw a radius on a map, compare multiple rings, build delivery and service area maps, and count the population inside a circle. Free online radius tools.",
    primaryKeyword: "radius map tools",
    secondaryKeywords: [
      "map radius calculator",
      "draw radius on map",
      "radius around a point",
      "distance radius map",
      "service area map",
      "delivery radius calculator",
    ],
    short: "Draw radius rings, delivery areas and coverage maps.",
    intro: [
      [
        { t: "A radius map answers \"what is inside this distance?\" in one glance. Begin with the " },
        { t: "map radius tool", l: "/tools/map-radius" },
        { t: " to draw a circle around any location, add rings with the " },
        { t: "multiple radius map", l: "/tools/multi-radius-map" },
        { t: " when you need 5, 10 and 25 miles side by side, or open the " },
        { t: "service area map", l: "/tools/service-area-map" },
        { t: " to turn a radius into something a customer or a sales team can read." },
      ],
      [
        { t: "Circles are geometric: they ignore water, roads and hills. That makes them honest for policy radii, franchise territories and coverage audits, and misleading for response promises, because a 10-mile circle around a depot with one bridge is not a 10-mile service area. When reach depends on travel, compare with a drive-time area from the " },
        { t: "routes hub", l: "/routes" },
        { t: " — the difference between the circle and the isochrone is usually the finding, not a technicality." },
      ],
      [
        { t: "This cluster also covers the demographic question that normally follows: how many people, ZIP codes or cities fall inside the ring. Population-within-radius runs on Census geography for the United States and is labelled as an estimate; for the land inside the same circle, use the " },
        { t: "area calculators", l: "/area" },
        { t: " hub." },
      ],
    ],
    topTools: ["map-radius", "multi-radius-map", "population-within-radius"],
    guides: [
      "/guides/draw-radius-on-google-maps",
      "/guides/radius-vs-drive-time-vs-straight-line-distance",
      "/guides/drive-time-map-vs-radius-circle",
    ],
    crossHubs: ["area", "distance", "map-maker", "lookup"],
    tone: "#4d7c0f",
  },
  {
    id: "area",
    slug: "/area",
    label: "Area & Acreage",
    h1: "Map Area, Land Area and Acreage Calculators",
    title: "Map Area & Acreage Calculators: Acres, Hectares, Sq Ft",
    description:
      "Measure area on a map, calculate acreage from a boundary, and convert between acres, hectares, square feet, square miles and square kilometres.",
    primaryKeyword: "area and acreage tools",
    secondaryKeywords: [
      "map area calculator",
      "acreage calculator",
      "measure area on map",
      "land area calculator",
      "calculate area on map",
      "acres to hectares",
    ],
    short: "Measure land on a map and convert between area units.",
    intro: [
      [
        { t: "Area is the measurement people most often get wrong on a map, because it depends on the shape you trace and the projection behind the drawing. Start with the " },
        { t: "map area calculator", l: "/tools/map-area-calculator" },
        { t: " to trace a boundary and read the enclosed area, use the " },
        { t: "acreage calculator", l: "/tools/acreage-map-calculator" },
        { t: " when the answer should be in acres, and convert between units with the " },
        { t: "acres to hectares converter", l: "/tools/acres-to-hectares-converter" },
        { t: " when the figure has to travel." },
      ],
      [
        { t: "MapBench computes polygon area on the sphere rather than on the flattened screen, so a plot near the Arctic is not quietly understated the way a pixel-area measurement would understate it. What the geometry cannot know is where the legal parcel edge actually runs: fences, deed lines, easements and survey monuments are authoritative, and a drawn polygon is an estimate. Trace at a sensible zoom, compare with the deed area, and treat a large disagreement as a prompt to check the boundary rather than the units." },
      ],
      [
        { t: "For the practical questions around land, use the " },
        { t: "farm, garden and fencing calculators", l: "/land-calculators" },
        { t: " for seed, soil, fence posts and irrigation. For circular ground, the " },
        { t: "radius hub", l: "/radius" },
        { t: " covers circle area and radius-from-area conversions, and uploaded geometry can be measured with the " },
        { t: "GeoJSON area calculator", l: "/tools/geojson-area-calculator" },
        { t: " instead of being drawn by hand." },
      ],
    ],
    topTools: ["map-area-calculator", "acreage-map-calculator", "acres-to-hectares-converter"],
    guides: [
      "/guides/how-to-measure-land-area-on-a-map",
      "/guides/map-projections-explained",
      "/guides/free-printable-blank-maps-for-school-and-work",
    ],
    crossHubs: ["land", "radius", "gis-files", "map-maker"],
    tone: "#4d7c0f",
  },
  {
    id: "land",
    slug: "/land-calculators",
    label: "Farm & Garden",
    h1: "Farm, Garden and Fencing Calculators",
    title: "Farm, Garden & Fencing Calculators for Real Land",
    description:
      "Fence length and post counts, field and row layout, seed and fertilizer quantities, irrigation coverage, soil, mulch and garden bed calculators.",
    primaryKeyword: "farm and garden calculators",
    secondaryKeywords: [
      "field area calculator",
      "fence length calculator",
      "fence post calculator",
      "seed quantity per acre calculator",
      "fertilizer calculator by area",
      "mulch volume calculator",
    ],
    short: "Fencing, seed, soil, irrigation and field layout maths.",
    intro: [
      [
        { t: "These calculators take a measured field or garden bed and turn it into materials. Start with the " },
        { t: "field area calculator", l: "/tools/acreage-map-calculator" },
        { t: " if you still need the size, price the boundary with the " },
        { t: "fence length calculator", l: "/tools/fence-length-calculator" },
        { t: " and the " },
        { t: "fence post count calculator", l: "/tools/fence-post-count-calculator" },
        { t: ", then move on to seed, soil and irrigation once the ground is defined." },
      ],
      [
        { t: "The arithmetic here is mostly multiplication, and that is exactly where the mistakes happen: mixing acres with hectares, applying a per-square-metre rate to a per-square-foot plan, or buying for the net planted area while fencing the gross boundary. Each page shows the unit it expects and the formula it applies, so a result can be checked by hand rather than trusted blindly. Coverage figures for irrigation and sprinklers are spacing calculations, not pressure calculations — pipe diameter, flow rate and pressure loss belong to a proper irrigation design." },
      ],
      [
        { t: "Area measurement itself lives in the " },
        { t: "area and acreage hub", l: "/area" },
        { t: ", including polygon tracing and unit conversion. For layout questions about rows and plant counts, the crop row length and plants-per-row tools complete the set." },
      ],
    ],
    topTools: ["fence-length-calculator", "fence-post-count-calculator", "mulch-volume-calculator"],
    guides: ["/guides/how-to-measure-land-area-on-a-map"],
    crossHubs: ["area", "radius"],
    tone: "#4d7c0f",
  },
  {
    id: "location",
    slug: "/location",
    label: "Location & Geocoding",
    h1: "Location Finders and Geocoding Tools",
    title: "Location Finder & Geocoding Tools: Where Am I, County, ZIP",
    description:
      "Find your location on a map, answer what county, city, state or ZIP code you are in, reverse geocode coordinates and geocode addresses in bulk.",
    primaryKeyword: "location and geocoding tools",
    secondaryKeywords: [
      "find my location on map",
      "what county am i in",
      "what zip code am i in",
      "reverse geocoder",
      "address to coordinates",
      "batch geocoder",
    ],
    short: "Where am I, and what is this place called?",
    intro: [
      [
        { t: "Location questions come in two directions. Starting from yourself or a pin, the " },
        { t: "find my location tool", l: "/tools/find-my-location" },
        { t: " puts you on the map and the " },
        { t: "what county am I in", l: "/tools/what-county-am-i-in" },
        { t: " lookup names the containing administrative areas. Starting from an address, the " },
        { t: "address to coordinates", l: "/tools/address-to-coordinates" },
        { t: " geocoder converts text into a point, and the reverse geocoder goes back the other way." },
      ],
      [
        { t: "The recurring lesson in this cluster is that a place has several correct names. Your mailing city follows postal routes, your legal city follows municipal boundaries, your county follows a third geometry, and ZIP codes are delivery routes rather than tidy polygons. MapBench shows these layers separately instead of collapsing them into one confident label, and flags the U.S. results that are verified against Census boundaries with a FIPS code. Near a border, drag the pin a few metres and watch the answer change: that flicker is information about where the line really is." },
      ],
      [
        { t: "Positioning accuracy matters as much as naming. Outdoors a phone fix is often within a few metres; indoors it can be off by a block, which is enough to change a county. You can always correct a GPS result by clicking the map. For coordinate formats and conversions, continue to the " },
        { t: "coordinates hub", l: "/coordinates" },
        { t: "; for time zones at a point, use the " },
        { t: "time hub", l: "/time" },
        { t: "." },
      ],
    ],
    topTools: ["find-my-location", "what-county-am-i-in", "reverse-geocoder"],
    guides: [
      "/guides/what-county-am-i-in-how-it-works",
      "/guides/find-my-location-gps-vs-ip-vs-vpn",
      "/guides/how-accurate-is-browser-geolocation",
      "/guides/where-am-i-five-answers",
    ],
    crossHubs: ["time", "lookup", "gis-files"],
    tone: "#1d6e63",
  },
  {
    id: "coordinates",
    slug: "/coordinates",
    label: "Coordinates",
    h1: "Coordinate Finders, Converters and Format Tools",
    title: "GPS Coordinate Tools: Find, Convert, Validate, Project",
    description:
      "Find latitude and longitude, convert between decimal, DMS, UTM, MGRS, Plus Codes and geohash, validate coordinates and work with map tiles and projections.",
    primaryKeyword: "coordinate tools",
    secondaryKeywords: [
      "latitude longitude finder",
      "gps coordinates finder",
      "decimal degrees to dms",
      "utm converter",
      "mgrs converter",
      "coordinate format detector",
    ],
    short: "Find, convert, validate and project coordinates.",
    intro: [
      [
        { t: "Coordinates are only useful when the notation survives the trip between systems. Use the " },
        { t: "latitude and longitude finder", l: "/tools/latitude-longitude-finder" },
        { t: " to get a point from a map or a search, the " },
        { t: "coordinate converter", l: "/tools/coordinate-converter" },
        { t: " to move between decimal degrees, DMS, UTM, MGRS, Plus Codes and geohash, and the " },
        { t: "coordinate parser", l: "/tools/coordinate-parser" },
        { t: " when a pasted pair does not announce which format it is in." },
      ],
      [
        { t: "Almost every coordinate bug is one of three mistakes: swapped latitude and longitude (GeoJSON is longitude first), a datum mismatch such as NAD27 against WGS84, or false precision — seven decimals imply a survey the original device never performed. The tools here make each of those visible instead of silently fixing them: the parser names the format it recognised, the converter keeps the units labelled, and the precision tool explains what each decimal place represents in metres. Numeric precision is not measurement accuracy, and this cluster keeps the two apart." },
      ],
      [
        { t: "For turning coordinates into human answers, jump to " },
        { t: "location and geocoding", l: "/location" },
        { t: "; for measuring real ground distances between points, use the " },
        { t: "distance calculators", l: "/distance" },
        { t: " or the " },
        { t: "bearing and midpoint tools", l: "/bearing-midpoint" },
        { t: ". Map-tile and projection helpers sit further down this page." },
      ],
    ],
    topTools: ["latitude-longitude-finder", "coordinate-converter", "coordinate-parser"],
    guides: [
      "/guides/understanding-gps-coordinates",
      "/guides/how-to-find-latitude-longitude-of-any-place",
      "/guides/what-are-plus-codes-open-location-code",
      "/guides/map-projections-explained",
    ],
    crossHubs: ["location", "distance", "gis-files", "map-maker"],
    tone: "#0e7490",
  },
  {
    id: "time",
    slug: "/time",
    label: "Time Zones",
    h1: "Time Zone Calculator and Conversion Tools",
    title: "Time Zone Tools: Converters, Offsets and Meeting Planners",
    description:
      "Convert times between time zones, find the time zone at any coordinates, check daylight saving, and plan meetings across working hours.",
    primaryKeyword: "time zone tools",
    secondaryKeywords: [
      "timezone calculator",
      "time zone difference calculator",
      "timezone finder by location",
      "utc offset by coordinates",
      "meeting time planner",
      "daylight saving time checker",
    ],
    short: "Offsets, conversions and cross-time-zone planning.",
    intro: [
      [
        { t: "Time-zone questions are really location questions with an arithmetic layer. Convert a single moment with the " },
        { t: "time zone converter", l: "/tools/timezone-converter" },
        { t: " see the whole world at once on the " },
        { t: "world time zone map", l: "/tools/world-time-zone-map" },
        { t: " and find the offset at a specific point with " },
        { t: "UTC offset by coordinates", l: "/tools/utc-offset-by-coordinates" },
        { t: " when you have latitude and longitude but no city name." },
      ],
      [
        { t: "Offsets are not fixed numbers. They change with daylight saving, and the rules that decide when are political: countries shift them, regions opt out, and some zones are not whole hours from UTC. MapBench resolves offsets from the IANA time-zone database in your browser, which is why the same coordinates can return different offsets in January and July. For anything scheduled or contractual, treat a converted time as a planning aid and confirm the rules with the authority that governs them." },
      ],
      [
        { t: "Planning across zones adds the human constraint: 9 to 5 in one place is rarely a civilised hour in another. The meeting time planner and working-hours overlap calculator show the overlap directly. Sun-driven scheduling lives in the " },
        { t: "sun and moon hub", l: "/sun-moon" },
        { t: ", and coordinate work belongs to the " },
        { t: "coordinates hub", l: "/coordinates" },
        { t: "." },
      ],
    ],
    topTools: ["timezone-converter", "world-time-zone-map", "meeting-time-planner"],
    guides: ["/guides/find-my-location-gps-vs-ip-vs-vpn"],
    crossHubs: ["location", "sun-moon"],
    tone: "#475569",
  },
  {
    id: "sun-moon",
    slug: "/sun-moon",
    label: "Sun & Moon",
    h1: "Sunrise, Sunset and Moon Calculators",
    title: "Sunrise, Sunset & Moon Tools: Daylight, Twilight, Moon Phase",
    description:
      "Calculate sunrise, sunset, day length, twilight, solar noon, sun position, moonrise and moon phase for any location and date.",
    primaryKeyword: "sun and moon tools",
    secondaryKeywords: [
      "moon phase calculator by location",
      "day length calculator",
      "daylight hours calculator",
      "solar noon calculator",
      "moonrise calculator",
      "sun position calculator",
    ],
    short: "Sunrise, sunset, daylight, twilight and moon times.",
    intro: [
      [
        { t: "Sun and moon times depend on three inputs at once: location, date and time zone. Start with the " },
        { t: "sunrise and sunset calculator", l: "/tools/sunrise-sunset-calculator" },
        { t: " for the headline pair, use the " },
        { t: "day length calculator", l: "/tools/day-length-calculator" },
        { t: " when the total hours of light matter more than the clock times, and open the " },
        { t: "moon rise and set calculator", l: "/tools/moonrise-moonset" },
        { t: " for the lunar equivalent." },
      ],
      [
        { t: "The calculations follow the NOAA solar algorithm using the standard 90.833° zenith for sunrise and sunset, which accounts for atmospheric refraction and the sun's apparent radius. That convention is why the horizon looks slightly wrong in a valley but right on a sea horizon, and why a calculated moonset can be a few minutes out where terrain intrudes. Above the polar circles some events simply do not occur on a given date; the tools say so rather than inventing a time." },
      ],
      [
        { t: "Photographers tend to want golden hour, civil twilight and shadow length rather than the sunrise minute itself — those are handled by the corresponding pages below. For the clock side of the same problem, including offsets and daylight-saving rules, use the " },
        { t: "time zone hub", l: "/time" },
        { t: "; for terrain and elevation context at the same location, the " },
        { t: "elevation tools", l: "/earth" },
        { t: " are a useful companion." },
      ],
    ],
    topTools: ["sunrise-sunset-calculator", "moon-phase-calculator", "golden-hour-calculator"],
    guides: ["/guides/chasing-golden-hour", "/guides/full-moon-moonrise-times"],
    crossHubs: ["time", "location", "earth"],
    tone: "#a16207",
  },
  {
    id: "lookup",
    slug: "/lookup",
    label: "Boundaries & Lookups",
    h1: "Boundary Lookups, District Maps and Place Data",
    title: "Boundary & Place Lookups: Counties, ZIP, Districts, Area Codes",
    description:
      "Look up ZIP code boundaries, counties, school and congressional districts, area codes, continents, islands, weather and air quality for a location.",
    primaryKeyword: "boundary lookup tools",
    secondaryKeywords: [
      "zip code boundary map",
      "county boundary map",
      "area code finder",
      "school district map",
      "congressional district map",
      "continent finder",
    ],
    short: "Administrative boundaries and place-data lookups.",
    intro: [
      [
        { t: "This cluster answers \"which official area is this point inside?\" for the boundaries that are not enough like a county to live in the location hub. Use the " },
        { t: "ZIP code boundary viewer", l: "/tools/zip-code-boundary-viewer" },
        { t: " to see a ZCTA polygon, the " },
        { t: "area code finder", l: "/tools/area-code-finder" },
        { t: " for telephone regions, and the " },
        { t: "county boundary viewer", l: "/tools/county-boundary-viewer" },
        { t: " when you want to trace an edge rather than just name it." },
      ],
      [
        { t: "Administrative geography is layered, and the layers are built for different purposes: Census ZCTAs approximate postal delivery, school districts follow elected or appointed boards, congressional districts change every cycle, and area codes are telephone routing artefacts that no longer map cleanly onto places. A point can sit inside several of these at once, and the labels can disagree near edges. Each page names its dataset and vintage so you can tell which layer answered, and none of them should be used as a substitute for an official determination." },
      ],
      [
        { t: "If you need the containing county or state from your own position, start with " },
        { t: "location and geocoding", l: "/location" },
        { t: " instead. Radial analysis around one of these boundaries belongs to " },
        { t: "radius and service areas", l: "/radius" },
        { t: ", and mapping them yourself is covered by the " },
        { t: "map maker tools", l: "/map-maker" },
        { t: "." },
      ],
    ],
    topTools: ["zip-code-boundary-viewer", "area-code-finder", "county-boundary-viewer"],
    guides: ["/guides/what-county-am-i-in-how-it-works", "/guides/compare-cities-like-an-analyst"],
    crossHubs: ["location", "radius", "map-maker"],
    tone: "#1d6e63",
  },
  {
    id: "earth",
    slug: "/earth",
    label: "Elevation & Terrain",
    h1: "Elevation Finders and Earth Geometry Calculators",
    title: "Elevation Finder & Earth Geometry Calculators",
    description:
      "Find elevation at any coordinates, read terrain profiles, and calculate horizon distance, earth curvature, line of sight, slope and atmospheric effects.",
    primaryKeyword: "elevation and terrain tools",
    secondaryKeywords: [
      "elevation calculator",
      "elevation map",
      "topographic map tools",
      "horizon distance calculator",
      "earth curvature calculator",
      "line of sight calculator",
    ],
    short: "Elevation at a point, plus curvature, slope and visibility math.",
    intro: [
      [
        { t: "Terrain questions start with a height. Use the " },
        { t: "elevation finder", l: "/tools/elevation-finder" },
        { t: " to read the ground elevation at a coordinate or address, the " },
        { t: "elevation profile", l: "/tools/elevation-profile" },
        { t: " when the shape of the ground along a route matters more than one number, and the " },
        { t: "horizon distance calculator", l: "/tools/horizon-distance" },
        { t: " once observer height enters the problem." },
      ],
      [
        { t: "Elevation data is a model, not a survey. Public terrain datasets sample the ground at a fixed resolution, so a value at a point is an interpolation between samples; cliffs, cuttings, bridges and buildings are smoothed away or misrepresented. That resolution is usually finer than the error in the question you are asking, but it matters for line-of-sight calculations and for anything engineering-adjacent. Visibility results here also assume a standard atmospheric refraction coefficient, which the page states, and they cannot know about trees, structures or weather." },
      ],
      [
        { t: "For sun angles at the same spot, including shadow length and golden hour, continue to the " },
        { t: "sun and moon hub", l: "/sun-moon" },
        { t: "; for distance along a route rather than through the air, use the " },
        { t: "distance calculators", l: "/distance" },
        { t: ". Elevation profiles inside GPX files are handled by the " },
        { t: "GIS file tools", l: "/gis-files" },
        { t: "." },
      ],
    ],
    topTools: ["elevation-finder", "elevation-profile", "horizon-distance"],
    guides: ["/guides/find-elevation-on-google-maps", "/guides/quiet-math-of-horizons"],
    crossHubs: ["distance", "lookup", "sun-moon"],
    tone: "#155e75",
  },
  {
    id: "gis-files",
    slug: "/gis-files",
    label: "GIS Files",
    h1: "KML, GPX, GeoJSON and CSV Map File Tools",
    title: "Free GIS File Tools: KML, GPX, GeoJSON & CSV Viewers",
    description:
      "View, validate, convert and analyse KML, KMZ, GPX, GeoJSON, WKT and CSV files in your browser. No upload to a server, no account, no install.",
    primaryKeyword: "gis file tools",
    secondaryKeywords: [
      "map data converter",
      "kml viewer",
      "gpx viewer",
      "geojson viewer",
      "free gis tools online",
      "convert gpx to csv",
    ],
    short: "Open, check, convert and measure map files locally.",
    intro: [
      [
        { t: "This is the cluster to start with when you have a file rather than a coordinate. Open it with the " },
        { t: "KML viewer", l: "/tools/kml-viewer" },
        { t: ", the " },
        { t: "GPX viewer", l: "/tools/gpx-viewer" },
        { t: " or the " },
        { t: "GeoJSON viewer", l: "/tools/geojson-viewer" },
        { t: ", plot a spreadsheet with the " },
        { t: "CSV to map converter", l: "/tools/csv-to-map" },
        { t: ", and move between formats with the converters in the three sub-hubs below." },
      ],
      [
        { t: "Files are parsed in your browser with native readers, so a track log does not have to leave your device to be counted, measured or converted. That constraint shapes what the tools do: they report what they can verify — point counts, bounding boxes, coordinate order, timestamp spans, elevation gain — and they say plainly where a conversion is lossy. KML styling and GroundOverlays do not survive a trip into GeoJSON, and a GPX file has no concept of polygons. Converting is a decision about what you are willing to lose, so each converter lists its edge cases." },
      ],
      [
        { t: "The three sub-hubs group the micro-tools by format family, because that is how people search: " },
        { t: "GeoJSON tools", l: "/gis-files/geojson" },
        { t: ", " },
        { t: "GPX tools", l: "/gis-files/gpx" },
        { t: " and " },
        { t: "CSV, KML, WKT and polyline tools", l: "/gis-files/other" },
        { t: ". For the concepts behind the formats, read the " },
        { t: "KML vs GeoJSON vs GPX guide", l: "/guides/kml-vs-geojson-vs-gpx" },
        { t: "." },
      ],
    ],
    topTools: ["kml-viewer", "gpx-viewer", "geojson-viewer"],
    guides: [
      "/guides/kml-vs-geojson-vs-gpx",
      "/guides/gps-file-workflows",
      "/guides/understanding-gps-coordinates",
    ],
    crossHubs: ["map-maker", "coordinates", "area", "distance"],
    children: [
      { href: "/gis-files/geojson", label: "GeoJSON tools", note: "Validate, format, simplify and measure GeoJSON." },
      { href: "/gis-files/gpx", label: "GPX tools", note: "Track statistics, elevation gain, speed and merging." },
      { href: "/gis-files/other", label: "CSV, KML, WKT & polyline", note: "Spreadsheets, placemarks and encoded geometry." },
    ],
    tone: "#6d28d9",
  },
  {
    id: "map-maker",
    slug: "/map-maker",
    label: "Map Maker",
    h1: "Map Maker, Pin Maps and Printable Map Tools",
    title: "Map Maker Tools: Pin Maps, Heatmaps and Printable Maps",
    description:
      "Create a pin map, heatmap or cluster map from your own points, export a map as PNG, embed it, and print blank outline maps with a scale.",
    primaryKeyword: "map maker tools",
    secondaryKeywords: [
      "custom map maker",
      "map creator online",
      "pin map maker",
      "create heatmap from csv",
      "printable map maker",
      "download map as png",
    ],
    short: "Build, style, export and print your own maps.",
    intro: [
      [
        { t: "Map making here means turning your own locations into something readable. Start with the " },
        { t: "pin map maker", l: "/tools/pin-map-maker" },
        { t: " for labelled points, use the " },
        { t: "cluster map", l: "/tools/cluster-map-from-points" },
        { t: " when the points are too dense to label individually, and open the " },
        { t: "heatmap tool", l: "/tools/heatmap-from-points" },
        { t: " when density rather than identity is the message." },
      ],
      [
        { t: "A good map carries one message. Pins for places, polygons for areas, rings for reach — when a single figure needs all three, it usually needs two figures. Colour should encode category rather than decoration, labels should carry identity, and the viewport should crop tightly to the subject. Every export leaves with OpenStreetMap attribution attached, because basemap imagery is licensed data even when the tool is free; the printable maps and PNG exports keep that credit visible rather than hidden in a corner." },
      ],
      [
        { t: "Export twice where it matters: an image for the slide and a data file for the record, so the map can be corrected later instead of redrawn. For the geometry behind a map, the " },
        { t: "area calculators", l: "/area" },
        { t: " measure what you draw and the " },
        { t: "radius tools", l: "/radius" },
        { t: " draw reach; for formats and files, continue to the " },
        { t: "GIS file hub", l: "/gis-files" },
        { t: ". Printable outline maps live under " },
        { t: "blank maps", l: "/map-maker/blank-maps" },
        { t: "." },
      ],
    ],
    topTools: ["pin-map-maker", "heatmap-from-points", "blank-map"],
    guides: [
      "/guides/free-printable-blank-maps-for-school-and-work",
      "/guides/map-projections-explained",
    ],
    crossHubs: ["gis-files", "radius", "area", "coordinates"],
    children: [
      { href: "/map-maker/blank-maps", label: "Blank & outline maps", note: "Printable world, USA, India, Canada, UK and Australia outlines." },
    ],
    tone: "#c2410c",
  },
];

export const hubById = new Map(HUBS.map((hub) => [hub.id, hub]));

// ---------------------------------------------------------------------------
// Membership
// ---------------------------------------------------------------------------

/**
 * Explicit placements. Only tools whose hub is not obvious from their category
 * and name belong here; everything else resolves through the rules below.
 */
const OVERRIDES: Record<string, HubId> = {
  // Straight-line / global distance rather than routes, bearings or land.
  "horizon-distance": "distance",
  "nearest-airport": "distance",
  "airport-midpoint-by-coordinates": "bearing-midpoint",
  "qibla-direction-finder": "bearing-midpoint",
  "magnetic-declination": "bearing-midpoint",
  "true-north-vs-magnetic": "bearing-midpoint",
  "equidistance-line-finder": "bearing-midpoint",
  "distance-to-poles": "distance",
  "distance-to-coast": "distance",
  "distance-to-equator": "distance",

  // Farm / garden / fencing.
  "fence-length-calculator": "land",
  "fence-post-count-calculator": "land",
  "crop-row-length-calculator": "land",
  "seed-quantity-per-acre-calculator": "land",
  "fertilizer-amount-calculator": "land",
  "fertilizer-by-area-calculator": "land",
  "irrigation-coverage-calculator": "land",
  "irrigation-flow-volume-calculator": "land",
  "irrigation-water-depth-calculator": "land",
  "sprinkler-count-calculator": "land",
  "grazing-stock-density-calculator": "land",
  "soil-volume-calculator": "land",
  "mulch-volume-calculator": "land",
  "mulch-volume-by-area-calculator": "land",
  "garden-bed-area-calculator": "land",
  "plants-per-row-calculator": "land",
  "plants-per-field-calculator": "land",
  "rows-per-field-calculator": "land",
  "field-coverage-time-calculator": "land",
  "mowing-time-calculator": "land",

  // Area, acreage and unit conversion.
  "lot-size-calculator": "area",
  "rectangular-lot-acreage-calculator": "area",
  "lot-width-from-area-depth": "area",
  "lot-depth-from-area-width": "area",
  "square-acreage-from-perimeter": "area",
  "square-perimeter-from-area": "area",
  "land-cost-per-acre-calculator": "area",
  "land-cost-per-square-foot": "area",
  "polygon-area-from-coordinates": "area",
  "perimeter-calculator": "area",
  "square-miles-calculator": "area",
  "center-of-polygon": "area",

  // Time zone and clock tools that live in the location data today.
  "what-timezone-am-i-in": "time",
  "timezone-map-finder": "time",
  "timezone-converter": "time",
  "world-clock-map": "time",
  "time-zone-converter": "time",
  "time-difference-between-timezones": "time",
  "meeting-time-planner": "time",
  "working-hours-overlap-calculator": "time",
  "daylight-saving-checker": "time",
  "dst-checker-by-coordinates": "time",
  "utc-offset-by-coordinates": "time",
  "local-time-by-coordinates": "time",
  "unix-timestamp-to-local-time": "time",
  "local-time-to-unix-timestamp": "time",
  "longitude-time-zone-estimator": "time",
  "world-time-zone-map": "time",

  // Administrative boundary and place-data lookups.
  "us-county-demographic-explorer": "lookup",
  "census-geography-finder": "lookup",
  "zip-codes-by-state-county-city": "lookup",
  "city-comparison-tool": "lookup",
  "cost-of-living-compare": "lookup",
  "population-density-compare": "lookup",
  "australia-postcodes-by-state-suburb": "lookup",
  "antipode-finder": "lookup",
  "hemisphere-finder": "lookup",
  "continent-finder": "lookup",
  "ocean-or-land-checker": "lookup",
  "island-finder-context": "lookup",
  "indigenous-lands-map": "lookup",
  "area-code-finder": "lookup",
  "phone-area-code-map": "lookup",
  "zip-code-boundary-viewer": "lookup",
  "county-boundary-viewer": "lookup",
  "school-district-context": "lookup",
  "congressional-district-context": "lookup",
  "district-finder-by-coordinates": "lookup",
  "parish-finder-by-coordinates": "lookup",
  "national-park-finder": "lookup",
  "geographic-center-finder": "lookup",
  "weather-by-coordinates": "lookup",
  "air-quality-location": "lookup",
  "equator-finder": "lookup",
  "tropics-finder": "lookup",
  "prime-meridian-finder": "lookup",
  "international-date-line": "lookup",
  "arctic-circle": "lookup",
  "antarctic-circle": "lookup",
  "distance-from-equator-calculator": "lookup",
  "distance-from-prime-meridian-calculator": "lookup",
  "distance-from-tropic-of-cancer": "lookup",
  "distance-from-tropic-of-capricorn": "lookup",
  "distance-from-arctic-circle": "lookup",
  "distance-from-antarctic-circle": "lookup",
  "latitude-band-finder": "lookup",

  // Elevation, terrain and earth geometry.
  "elevation-finder": "earth",
  "my-elevation": "earth",
  "elevation-profile": "earth",
  "peak-elevation-profile": "earth",
  "world-elevation-atlas": "earth",
  "terrain-elevation-grid-map": "earth",
  "map-tunnel": "earth",
  "watershed-finder": "earth",
  "flood-zone-check": "earth",
  "recent-earthquakes-map": "earth",
  "snowfall-map": "earth",
  "world-rainfall-map": "earth",
  "cicada-emergence-map": "earth",
  "climate-zone-finder": "earth",
  "plant-hardiness-zone": "earth",
  "air-pressure-by-elevation": "earth",
  "pressure-altitude-calculator": "earth",
  "boiling-point-by-elevation-calculator": "earth",
  "temperature-change-by-elevation": "earth",
  "temperature-lapse-rate-calculator": "earth",
  "vertical-speed-calculator": "earth",

  // Coordinate formats and projection maths.
  "polygon-centroid-from-coordinates": "coordinates",
  "polygon-perimeter-from-coordinates": "coordinates",
  "random-location-generator": "map-maker",
  "star-chart-location": "sun-moon",

  // Files that are really map-building steps.
  "heatmap-from-points": "map-maker",
  "cluster-map-from-points": "map-maker",
  "photo-to-route-mapper": "gis-files",
  "route-performance-history-comparison": "routes",
  "gpx-heart-rate-analyzer": "gis-files",

  // Location / nearby services.
  "nearby-places-finder": "location",
  "cities-in-a-county-finder": "lookup",
  "cities-within-radius": "radius",
  "zip-codes-within-radius": "radius",
  "population-within-radius": "radius",
  "cities-within-drawn-area-finder": "radius",

  // Small creation tools that belong with the map makers.
  "country-size-comparison": "map-maker",
  "color-a-map": "map-maker",
  "county-choropleth": "map-maker",
  "zip-code-map": "map-maker",
  "map-with-legend": "map-maker",
  "voronoi-map-generator": "map-maker",
  "store-locator-map-builder": "map-maker",
  "spatial-dashboard-builder": "map-maker",
  "live-spatial-data-connector": "map-maker",
  "map-data-collection-form-builder": "map-maker",
  "historical-map-context": "map-maker",

  // --- refinements after the first resolution pass -----------------------------
  "driving-distance-calculator": "routes",
  "walking-calories-distance": "routes",
  "cycling-calories-distance": "routes",
  "liters-needed-for-distance": "routes",
  "gallons-needed-for-distance": "routes",
  "shipping-time-calculator": "routes",
  "ship-speed-distance-time-calculator": "routes",
  "delivery-fee-by-distance-calculator": "routes",
  "courier-distance-charge-calculator": "routes",
  "trip-distance-per-day-calculator": "routes",
  "route-distance-percentage-calculator": "routes",
  "trip-time-buffer-calculator": "routes",
  "gps-speedometer-online": "routes",
  "route-elevation-gain-calculator": "routes",
  "hiking-route-planner-with-elevation": "routes",
  "central-angle-from-distance-calculator": "earth",
  "antenna-height-distance-calculator": "earth",
  "earth-circumference-at-latitude": "earth",
  "sunrise-direction-compass": "sun-moon",
  "web-mercator-scale-factor-calculator": "coordinates",
  "coordinate-radius-points-generator": "coordinates",
  "coordinates-to-address": "location",
  "city-from-coordinates": "location",
  "country-from-coordinates": "location",
  "state-from-coordinates": "location",
  "find-municipality-by-coordinates": "location",
  "coordinates-lookup-tool": "location",
  "os-grid-reference-distance-calculator": "distance",
  "circle-area-from-radius": "area",
  "radius-from-circle-area": "area",
  "circle-circumference-from-radius": "area",
  "radius-from-circumference": "area",
  "equal-circle-overlap-calculator": "area",
};

/**
 * Slug patterns, applied only inside the categories where a single category
 * genuinely spans several hubs (radius holds area and farm tools, location
 * holds time-zone and administrative lookups, and so on). The first match wins.
 */
const SCOPED_PATTERNS: { category: CategoryId; test: RegExp; hub: HubId }[] = [
  // Distance & Bearing holds three different jobs.
  { category: "distance", test: /bearing|midpoint|meeting|halfway|compass|scale|qibla/, hub: "bearing-midpoint" },
  // "Radius & Area" is the widest category: farm maths, land area, unit
  // conversion and true radius/coverage tools all live in it.
  { category: "radius", test: /fence|seed|fertiliz|irrigation|sprinkler|soil|mulch|garden|plants-per|rows-per|row-length|grazing|mowing|field/, hub: "land" },
  { category: "radius", test: /radius|service-area|territory|catchment|delivery|buffer|coverage|store-locator|walk-score|walk-reach|ev-range/, hub: "radius" },
  { category: "radius", test: /acre|hectare|square-|lot-|area|perimeter|polygon/, hub: "area" },
  // Location holds time-zone tools and administrative lookups.
  { category: "location", test: /timezone|time-zone|time-difference|utc|unix|dst|clock|timestamp/, hub: "time" },
  { category: "location", test: /area-code|zip-code-boundary|county-boundary|district|parish|park|center|weather|air-quality|indigenous|census/, hub: "lookup" },
];

/**
 * Default hub for each editorial category. Category is the primary signal:
 * a "routing" tool is a route tool unless an override says otherwise, which
 * keeps the taxonomy predictable as new tools are registered.
 */
const CATEGORY_DEFAULT: Record<CategoryId, HubId> = {
  distance: "distance",
  routing: "routes",
  radius: "radius",
  coordinates: "coordinates",
  location: "location",
  files: "gis-files",
  creation: "map-maker",
  earth: "earth",
  sun: "sun-moon",
  lines: "lookup",
  population: "lookup",
  network: "location",
};

/** Resolve the hub a tool belongs to. Always returns a hub. */
export function hubForTool(tool: Pick<ToolDef, "slug" | "category">): HubId {
  const override = OVERRIDES[tool.slug];
  if (override) return override;
  for (const rule of SCOPED_PATTERNS) {
    if (rule.category === tool.category && rule.test.test(tool.slug)) return rule.hub;
  }
  return CATEGORY_DEFAULT[tool.category];
}



// ---------------------------------------------------------------------------
// GIS file sub-hubs
// ---------------------------------------------------------------------------

export interface SubHub {
  slug: string;
  parent: HubId;
  label: string;
  h1: string;
  title: string;
  description: string;
  primaryKeyword: string;
  secondaryKeywords: string[];
  intro: HubSegment[][];
  match: (slug: string) => boolean;
}

export const SUBHUBS: SubHub[] = [
  {
    slug: "/gis-files/geojson",
    parent: "gis-files",
    label: "GeoJSON tools",
    h1: "GeoJSON Validator, Converter and Analysis Tools",
    title: "GeoJSON Tools: Validate, Format, Convert and Measure",
    description:
      "Check that a GeoJSON file is valid, count features and coordinates, format or minify it, compute a bounding box, area or centroid, and convert to CSV.",
    primaryKeyword: "geojson tools",
    secondaryKeywords: [
      "geojson validator",
      "geojson formatter",
      "geojson to csv converter",
      "geojson area calculator",
      "geojson bounding box",
      "geojson feature counter",
    ],
    intro: [
      [
        { t: "GeoJSON is the format most web maps speak, and most of the practical work is checking that a file is what it claims to be. Start with the " },
        { t: "GeoJSON validator", l: "/tools/geojson-validator" },
        { t: " for structure and coordinate-order problems, then use the " },
        { t: "feature counter", l: "/tools/geojson-feature-counter" },
        { t: " or " },
        { t: "bounding box calculator", l: "/tools/geojson-bounding-box-calculator" },
        { t: " to see whether the geometry and the numbers agree with what you expected." },
      ],
      [
        { t: "These tools read files locally in the browser and report what they can measure: geometry types, property keys, coordinate counts, extents and areas on the sphere. They are deliberately narrow. A validator confirms structure and coordinate ranges, not topological sense — a polygon can be perfectly valid GeoJSON and still be self-intersecting or wrapped around the planet. When a conversion is involved, the tool states what it drops, because GeoJSON has no styling, no timestamps and no notion of a route." },
      ],
      [
        { t: "For tracks rather than features, the " },
        { t: "GPX tools", l: "/gis-files/gpx" },
        { t: " handle distance, elevation and speed. For spreadsheets and placemarks, see " },
        { t: "CSV, KML and WKT tools", l: "/gis-files/other" },
        { t: ". To measure an area you want to draw rather than upload, the " },
        { t: "map area calculator", l: "/tools/map-area-calculator" },
        { t: " in the area hub is the right instrument." },
      ],
    ],
    match: (slug) => /geojson/.test(slug) || slug === "csv-to-geojson-converter",
  },
  {
    slug: "/gis-files/gpx",
    parent: "gis-files",
    label: "GPX tools",
    h1: "GPX Track Analysis and Conversion Tools",
    title: "GPX Tools: Track Stats, Elevation Gain, Speed & Merge",
    description:
      "Analyse GPX files in your browser: point, route and waypoint counts, track distance, elevation gain and loss, duration, average and maximum speed, merging.",
    primaryKeyword: "gpx tools",
    secondaryKeywords: [
      "gpx track distance calculator",
      "elevation gain calculator",
      "gpx to csv converter",
      "merge gpx files online",
      "gpx viewer",
      "gpx average speed calculator",
    ],
    intro: [
      [
        { t: "A GPX file is a log of where you went, and almost every question about it is one of four numbers: distance, ascent, duration and speed. Open the file in the " },
        { t: "GPX route statistics", l: "/tools/gpx-route-stats" },
        { t: " tool for a summary, check the elapsed distance with the " },
        { t: "GPX track distance calculator", l: "/tools/gpx-track-distance-calculator" },
        { t: ", and look at climbing with the " },
        { t: "elevation gain calculator", l: "/tools/gpx-elevation-gain-calculator" },
        { t: "." },
      ],
      [
        { t: "The numbers depend on threshold choices that are easy to hide and worth showing. Elevation gain sums every upward step above a noise threshold, so a barometric track and a GPS-derived track of the same walk produce different totals; distance sums segment-by-segment and is sensitive to wandering fixes when you stood still. These pages state the method they use and keep the raw file untouched, so a disagreement between two tools can be traced to a threshold rather than an error." },
      ],
      [
        { t: "Files are read locally — nothing is uploaded. When you need a different format, the " },
        { t: "GPX to CSV converter", l: "/tools/gpx-to-csv-converter" },
        { t: " produces a spreadsheet of points, and the " },
        { t: "GPX merger", l: "/tools/gpx-merger" },
        { t: " joins tracks from separate days or devices. The " },
        { t: "GeoJSON sub-hub", l: "/gis-files/geojson" },
        { t: " covers the web-mapping side." },
      ],
    ],
    match: (slug) => /gpx/.test(slug),
  },
  {
    slug: "/gis-files/other",
    parent: "gis-files",
    label: "CSV, KML & WKT",
    h1: "CSV, KML, WKT and Polyline Tools",
    title: "CSV, KML, WKT & Polyline Tools for Map Data",
    description:
      "Validate and de-duplicate coordinate CSVs, count rows and columns, measure KML paths and placemarks, check WKT geometry and decode encoded polylines.",
    primaryKeyword: "kml csv wkt tools",
    secondaryKeywords: [
      "csv coordinate validator",
      "kml path length calculator",
      "wkt validator",
      "encoded polyline decoder",
      "csv row counter",
      "kml placemark counter",
    ],
    intro: [
      [
        { t: "Not every map dataset arrives as a proper GIS file. Spreadsheets, Keyhole placemarks, WKT strings and Google's encoded polylines all carry geometry in their own way. Check a coordinate table with the " },
        { t: "CSV coordinate validator", l: "/tools/csv-coordinate-validator" },
        { t: " and the " },
        { t: "CSV row counter", l: "/tools/csv-row-counter" },
        { t: ", measure a path drawn in KML with the " },
        { t: "KML path length calculator", l: "/tools/kml-path-length" },
        { t: ", and decode a route string with the " },
        { t: "encoded polyline decoder", l: "/tools/encoded-polyline-decoder" },
        { t: "." },
      ],
      [
        { t: "The most common failure in this family is silent: a column that looks like latitude but holds longitude, a header row counted as data, a blank coordinate parsed as zero, or a WKT polygon whose rings are not closed. Each tool reports the specific rows or coordinates it rejected instead of quietly dropping them, because a map that is missing features without saying so is worse than an error message. WKT validation covers structure and balance; it is not a geometry engine and will not tell you whether a polygon crosses itself." },
      ],
      [
        { t: "For JSON-based geometry, the " },
        { t: "GeoJSON sub-hub", l: "/gis-files/geojson" },
        { t: " has the equivalent checks, and for recorded tracks the " },
        { t: "GPX tools", l: "/gis-files/gpx" },
        { t: " cover distance, elevation and speed. To plot a sanitised CSV on a map, use the " },
        { t: "CSV to map converter", l: "/tools/csv-to-map" },
        { t: "." },
      ],
    ],
    match: (slug) =>
      !/geojson|gpx/.test(slug) &&
      /csv|kml|wkt|polyline/.test(slug),
  },
];

export const subHubBySlug = new Map(SUBHUBS.map((sub) => [sub.slug, sub]));

export const subHubsByParent = (parent: HubId) => SUBHUBS.filter((sub) => sub.parent === parent);
