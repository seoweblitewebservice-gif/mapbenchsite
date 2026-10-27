import type { ToolDef } from "@/lib/registry";

/** High-traffic Tier-A tools mapped to existing components. */
export const TIER_A_TOOLS: ToolDef[] = [
  {
    slug: "lot-size-calculator",
    name: "Lot Size Calculator",
    short: "Draw a property boundary and get area in acres, square feet, m² and hectares.",
    intro:
      "Trace a lot or parcel on the map to measure geodesic area — ideal for real estate, gardens and land checks.",
    category: "radius",
    scope: "Worldwide",
    component: "area",
    keywords: ["lot size calculator", "acreage calculator", "parcel area", "property size map"],
    popular: true,
    faq: [
      [
        "Survey accurate?",
        "No — this is a planning estimate from the map. Legal boundaries need a licensed surveyor or official plat.",
      ],
      ["Units?", "Area is shown in m², km², acres, hectares and related units."],
    ],
    howTo: [
      "Click the map to place each corner of the lot.",
      "Close the shape when the outline is complete.",
      "Read area and perimeter in the units you need.",
    ],
    related: ["map-area-calculator", "perimeter-calculator", "map-radius"],
    method: "Geodesic polygon area on the WGS84 ellipsoid from the vertices you draw.",
  },
  {
    slug: "qibla-direction-finder",
    name: "Qibla Direction Finder",
    short: "Find the direction to the Kaaba in Mecca from any place on Earth.",
    intro:
      "Set your location to get the great-circle bearing toward the Kaaba (Makkah) for prayer orientation.",
    category: "distance",
    scope: "Worldwide",
    component: "bearing",
    keywords: ["qibla", "qibla direction", "direction to mecca", "kaaba direction"],
    popular: true,
    faq: [
      [
        "How do I use the bearing tool for Qibla?",
        "Set your position as the start point and Mecca / the Kaaba as the end point — the initial bearing is the Qibla direction (true north).",
      ],
      [
        "Magnetic compass?",
        "The result is true (geographic) bearing. Apply local magnetic declination if using a magnetic compass.",
      ],
    ],
    howTo: [
      "Set your current location as the start point.",
      "Set Mecca (Kaaba) as the destination — search \"Kaaba\" or use coordinates about 21.4225°N, 39.8262°E.",
      "Read the initial bearing — that is the Qibla on a true-north compass.",
    ],
    related: ["bearing-calculator", "magnetic-declination", "find-my-location"],
    method: "Great-circle initial bearing from your coordinates to the Kaaba (approx. 21.4225°N, 39.8262°E).",
  },
  {
    slug: "shadow-length-calculator",
    name: "Shadow Length Calculator",
    short: "Estimate shadow length from object height and solar elevation.",
    intro:
      "Relate sun height in the sky to how long a shadow an object casts — useful for photography and site planning.",
    category: "sun",
    scope: "Worldwide",
    component: "solar",
    keywords: ["shadow-length-calculator", "sun shadow calculator", "object shadow"],
    faq: [
      [
        "Exact physics?",
        "Shadow length ≈ height / tan(solar elevation). Use solar position for elevation angle at your place and time.",
      ],
      ["Flat ground?", "Assumes level ground; slopes change real shadow length."],
    ],
    howTo: [
      "Set location and check solar position (altitude).",
      "Use height ÷ tan(altitude) for approximate shadow length when the sun is above the horizon.",
    ],
    related: ["solar-position-calculator", "sunrise-sunset-calculator", "golden-hour-calculator"],
    method: "Solar elevation from position algorithms; shadow length from basic trigonometry on flat ground.",
  },
  {
    slug: "travel-time-estimator",
    name: "Travel Time Estimator",
    short: "Estimate drive time and road distance between two places.",
    intro: "Get typical driving duration and distance along the road network for trip planning.",
    category: "routing",
    scope: "Worldwide",
    component: "route",
    keywords: ["travel time", "how long to drive", "drive time calculator", "eta calculator"],
    popular: true,
    faq: [
      ["Live traffic?", "No — free-flow style estimates. Peak hours can be longer."],
      ["Worldwide?", "Yes where OpenStreetMap road data exists."],
    ],
    howTo: ["Set origin and destination.", "Read distance and estimated travel time."],
    related: ["driving-distance-calculator", "drive-time-map", "fuel-cost-calculator"],
  },
  {
    slug: "acreage-map-calculator",
    name: "Acreage Map Calculator",
    short: "Measure acres on a map by drawing the field or plot boundary.",
    intro: "Farm and land acreage from a drawn polygon — acres and hectares side by side.",
    category: "radius",
    scope: "Worldwide",
    component: "area",
    keywords: ["acreage calculator", "acres on map", "field acreage", "hectares calculator"],
    popular: true,
    faq: [
      ["Same as lot size?", "Same measurement engine — this page is framed for farm and field acreage searches."],
      ["Legal survey?", "No — planning and estimate use only."],
    ],
    howTo: ["Outline the field on the map.", "Close the polygon.", "Read acres and hectares."],
    related: ["lot-size-calculator", "map-area-calculator", "perimeter-calculator"],
  },
];
