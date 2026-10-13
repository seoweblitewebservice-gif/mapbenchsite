import type { Guide } from "./guides";

export const GUIDES5: Guide[] = [
  {
    slug: "radius-vs-drive-time-vs-straight-line-distance",
    title: "Radius vs. Drive Time vs. Straight-Line Distance: Which Map Should You Use?",
    description: "A practical guide to choosing between a radius circle, road travel-time map and straight-line distance so your result matches the real question you are trying to answer.",
    date: "2026-10-13",
    readMins: 9,
    blocks: [
      { t: "p", text: "A 10-mile radius, a 20-minute drive-time area and a 10-mile road route can all look very different on the same map. They answer different questions. Choosing the wrong measurement is one of the easiest ways to make a map look precise while answering the wrong problem." },
      { t: "h2", text: "Use a radius when distance from one point is the rule" },
      { t: "p", text: "A radius map draws a geographic circle around a center point. Every point on the circle is approximately the same surface distance from the center. Radius maps are useful when the rule itself is distance-based: a delivery policy within 15 miles, a search area around a tower, a school assignment buffer, a rough service territory or a visual comparison between two fixed distances." },
      { t: "ul", items: [
        "Best for: fixed-distance policies, simple coverage zones and quick geographic comparisons.",
        "Not the same as: driving distance, walking distance or travel time.",
        "Main limitation: the circle ignores roads, rivers, mountains, ferries, border crossings and traffic conditions."
      ] },
      { t: "h2", text: "Use drive time when accessibility matters" },
      { t: "p", text: "A drive-time map, also called an isochrone, follows the road network and estimates the area reachable within a selected travel time. A 30-minute drive may extend far along a highway but remain small across a river with few bridges. That irregular shape is often exactly what a planner needs." },
      { t: "ul", items: [
        "Best for: store catchments, commute zones, emergency planning, field-service coverage and meeting-location decisions.",
        "Interpret the result as an estimate, not a guarantee. Public routing engines generally model roads and typical speeds rather than live minute-by-minute traffic.",
        "Always state the travel mode and time assumption when sharing the map."
      ] },
      { t: "h2", text: "Use straight-line distance for geographic separation" },
      { t: "p", text: "Straight-line or great-circle distance measures the shortest surface path between two locations without following roads. It is often called 'as the crow flies' distance. It is useful for geographic analysis, aviation-style separation, comparing locations consistently, radio-range approximations and any task where the road network is irrelevant." },
      { t: "h2", text: "A worked example" },
      { t: "p", text: "Imagine a customer is 8 miles from a shop in straight-line distance. If a river lies between them and the nearest bridge is several miles away, the road trip could be 14 miles and 25 minutes. A 10-mile radius would include the customer, while a 15-minute drive-time map might exclude them. Neither result is wrong; each describes a different relationship." },
      { t: "h2", text: "A simple decision rule" },
      { t: "ul", items: [
        "If your policy says 'within X miles of this point,' start with a radius.",
        "If the question is 'who can reach this place in X minutes,' use a drive-time map.",
        "If you are comparing pure geographic separation, use straight-line distance.",
        "If money or legal eligibility depends on the result, verify the official rule and data source instead of relying on a generic web map alone."
      ] },
      { t: "note", text: "A good map starts with the decision you need to make. Pick the measurement only after defining that decision." },
      { t: "toolbox", slugs: ["map-radius", "drive-time-map", "crow-flies-distance", "distance-between-two-places"] }
    ]
  },
  {
    slug: "how-to-measure-land-area-on-a-map",
    title: "How to Measure Land Area on a Map: Acres, Hectares and Square Feet",
    description: "Learn how map-based area measurement works, how to trace a parcel more accurately, how acres and hectares relate, and when an online estimate is not enough.",
    date: "2026-10-12",
    readMins: 10,
    blocks: [
      { t: "p", text: "Online area tools are useful for estimating the size of yards, fields, roofs, parking lots and parcels, but the result depends on the boundary you draw. The calculation can be mathematically correct while the estimate is still wrong because the traced boundary does not match the legal or physical property line." },
      { t: "h2", text: "Start with the boundary, not the unit" },
      { t: "p", text: "Zoom in until corners, fences, roads or parcel edges are easy to distinguish. Place points at every meaningful change in direction instead of using only four broad corners on an irregular shape. More points do not automatically make a result better, but enough points are needed to follow curves and angled boundaries." },
      { t: "ul", items: [
        "Trace the same visible edge consistently — for example the fence line, not sometimes the fence and sometimes the road centerline.",
        "For long curved boundaries, add intermediate points so the polygon follows the curve instead of cutting across it.",
        "Avoid using shadows, tree lines or image seams as property boundaries unless you know they match the real boundary.",
        "Record the source and date of the imagery when the estimate matters."
      ] },
      { t: "h2", text: "Common area units" },
      { t: "ul", items: [
        "1 acre = 43,560 square feet.",
        "1 hectare = 10,000 square metres.",
        "1 square kilometre = 100 hectares.",
        "1 square mile = 640 acres."
      ] },
      { t: "p", text: "Unit conversion is straightforward, but it does not improve the underlying geometry. Converting an inaccurate boundary from square feet to acres only changes the label on the same inaccurate estimate." },
      { t: "h2", text: "Why map projection and Earth curvature matter" },
      { t: "p", text: "Latitude and longitude are angular coordinates on a curved Earth. Large polygons should not be treated as if those coordinates were ordinary x/y values on a flat sheet. Good geographic area tools use geodesic or projection-aware calculations so the reported area remains meaningful across latitude and scale." },
      { t: "h2", text: "Example: estimating a residential lot" },
      { t: "p", text: "Suppose a lot appears roughly rectangular but one rear corner angles inward. Drawing a simple rectangle may overstate the area. Trace the four main corners plus the angled section, close the polygon and compare the result in square feet and acres. If the estimate is for landscaping or rough planning, this may be sufficient. If it is for a sale, setback dispute, construction permit or legal boundary, use the recorded survey or a licensed professional." },
      { t: "h2", text: "When an online measurement is not enough" },
      { t: "ul", items: [
        "Property ownership and boundary disputes.",
        "Survey-grade engineering or construction staking.",
        "Legal descriptions, easements and title work.",
        "Any decision where a small boundary error has material financial or safety consequences."
      ] },
      { t: "note", text: "Treat web-map area as an estimate unless the boundary itself comes from an authoritative surveyed dataset." },
      { t: "toolbox", slugs: ["map-area-calculator", "lot-size-calculator"] }
    ]
  },
  {
    slug: "how-to-choose-a-meeting-point-between-places",
    title: "How to Choose a Fair Meeting Point Between Two or More Places",
    description: "A practical guide to geographic midpoints, travel-time fairness and choosing a meeting location that works in the real world rather than only on a straight-line map.",
    date: "2026-10-11",
    readMins: 8,
    blocks: [
      { t: "p", text: "The geographic midpoint between two people is not always the fairest place to meet. A mountain range, river crossing, highway network or city congestion can make equal straight-line distance very unequal in travel time. The best meeting point depends on what 'fair' means for the people involved." },
      { t: "h2", text: "Three different meanings of halfway" },
      { t: "ul", items: [
        "Geographic midpoint: the location halfway between coordinates on the Earth's surface.",
        "Equal driving distance: a place where each traveler covers roughly the same road distance.",
        "Equal travel time: a place where estimated journey times are similar, which is often the most practical definition for a real meeting."
      ] },
      { t: "h2", text: "When a geographic midpoint is useful" },
      { t: "p", text: "A geographic midpoint is a clean starting point. It works well for understanding the spatial center between two locations, choosing a neutral search area or comparing alternatives before road conditions are considered. It is also useful when the travelers are not using roads, such as for certain geographic or aviation analyses." },
      { t: "h2", text: "Why the nearest town to the midpoint may still be a poor choice" },
      { t: "p", text: "A midpoint can fall in farmland, water or an inaccessible area. Even when a town is nearby, one traveler may have a direct motorway while the other must use slower local roads. A practical workflow is to find the midpoint, identify several towns or venues around it, then compare actual route distance and travel time from each origin." },
      { t: "h2", text: "A better workflow for two travelers" },
      { t: "ul", items: [
        "Find the geographic midpoint to define the search area.",
        "List two to five realistic towns, stations, cafes or landmarks near that area.",
        "Compare road distance or drive time from both origins to each candidate.",
        "Prefer a place with safe access, parking or transit rather than chasing perfect mathematical equality.",
        "Check opening hours and current traffic separately before leaving."
      ] },
      { t: "h2", text: "What changes with three or more starting points" },
      { t: "p", text: "With several people, there is no single universally fair center. You might minimize the total distance traveled, minimize the longest individual journey, or weight locations by the number of people traveling from each origin. Those are different optimization goals. State the goal before deciding what 'central' means." },
      { t: "note", text: "For social plans, a slightly imperfect midpoint with good transport and useful amenities is usually better than an exact midpoint that is difficult to reach." },
      { t: "toolbox", slugs: ["distance-between-two-places", "distance-matrix-calculator", "drive-time-map"] }
    ]
  },
  {
    slug: "map-projections-explained",
    title: "Map Projections Explained: Why Every Flat World Map Distorts Something",
    description: "Understand why flat maps change area, shape, distance or direction, why Mercator looks the way it does, and how to choose a projection for the job.",
    date: "2026-10-10",
    readMins: 10,
    blocks: [
      { t: "p", text: "The Earth is curved and a screen is flat. Turning one into the other requires a map projection, and every projection introduces distortion. There is no single flat world map that preserves area, shape, direction and distance everywhere at the same time." },
      { t: "h2", text: "What a projection is doing" },
      { t: "p", text: "A projection is a mathematical transformation from geographic coordinates on a sphere or ellipsoid to positions on a flat plane. Different transformations preserve different properties. The right projection therefore depends on what you want the map to communicate or measure." },
      { t: "h2", text: "Four properties people often confuse" },
      { t: "ul", items: [
        "Area: whether regions keep their correct relative size.",
        "Shape: whether small local shapes and angles are preserved.",
        "Distance: whether scale is accurate between selected points or along selected lines.",
        "Direction: whether bearings are represented correctly from particular locations or along particular paths."
      ] },
      { t: "h2", text: "Why Mercator enlarges high latitudes" },
      { t: "p", text: "Mercator is conformal: it preserves local angles and shapes well enough to be extremely useful for navigation and web maps. The trade-off is area distortion that grows toward the poles. Greenland therefore appears far larger relative to equatorial regions than it is in reality. This is not an error in the software; it is a known property of the projection." },
      { t: "h2", text: "Equal-area maps answer a different question" },
      { t: "p", text: "An equal-area projection preserves relative area, making it better for choropleth maps and comparisons where size matters. Shapes may look stretched, especially away from the projection's favored regions. That visual distortion is the trade-off for preserving area." },
      { t: "h2", text: "Projection choice for measurement" },
      { t: "p", text: "For global point-to-point distance, calculating a geodesic directly on a spherical or ellipsoidal Earth avoids relying on screen distance. For local engineering or GIS work, a suitable projected coordinate reference system can make planar measurements practical within its designed region. For worldwide thematic maps, an equal-area world projection may be the more honest visual choice." },
      { t: "h2", text: "A practical checklist" },
      { t: "ul", items: [
        "Do not estimate real-world size by comparing how large countries look on a Mercator map.",
        "Do not measure long global distances with a ruler against pixels on a web map.",
        "For analysis, document the coordinate reference system or geodesic method you used.",
        "For communication, choose the projection whose preserved property matches the story you are telling."
      ] },
      { t: "note", text: "Projection distortion is unavoidable; unexplained projection choice is avoidable. Good maps make the trade-off clear." },
      { t: "toolbox", slugs: ["distance-between-two-places", "great-circle-calculator", "map-area-calculator"] }
    ]
  }
];
