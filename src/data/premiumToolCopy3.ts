import type { ToolCopy } from "./toolCopy";

export const PREMIUM_TOOL_COPY_3: Record<string, ToolCopy> = {
  "shipping-distance-calculator": {
    h2: "Use shipping distance to compare corridors, not to predict arrival dates",
    paras: [
      "A shipping-distance calculation is most useful as a geographic baseline between ports, hubs or logistics points. Great-circle distance gives the shortest surface separation, which helps compare alternative corridors consistently. Actual vessel routes can be longer because of coastlines, canals, traffic-separation schemes, weather avoidance, port approach lanes and commercial scheduling.",
      "For air freight, the same distinction applies: aircraft do not always fly the exact geometric minimum because of airspace, winds, routing rules and operational constraints. Use MapBench to compare relative distance, then use carrier schedules and quoted transit times when cost or delivery commitments depend on the answer.",
    ],
  },
  "delivery-radius-checker": {
    h2: "A delivery radius is a policy boundary, not a travel-time guarantee",
    paras: [
      "This tool is useful when a business rule is written as a fixed distance from a store, kitchen, depot or service base. A customer can be geometrically inside the radius while still requiring a long drive because of rivers, limited crossings, one-way streets or motorway access. That means a radius works best for simple eligibility rules and quick screening, not for promising a specific arrival time.",
      "If operations are constrained by minutes rather than miles, compare the same origin with a drive-time map before publishing the service zone. For postcode-based order systems, use a ZIP or postal-area workflow separately because a whole postal area may only partially overlap the circle.",
    ],
  },
  "maidenhead-grid-locator": {
    h2: "Maidenhead locators describe radio grid squares, not street-level positions",
    paras: [
      "The Maidenhead Locator System compresses latitude and longitude into an alphanumeric grid reference widely used in amateur radio. Short locators describe large areas; adding more characters narrows the square. That makes the system convenient for contacts, contests, antenna direction and logging without exchanging a full coordinate pair.",
      "A locator is still an area reference rather than proof of an exact transmitter position. Keep the original GPS coordinate when precision matters, and do not confuse Maidenhead with MGRS, Plus Codes or geohash—each system has a different grid design and typical use case.",
    ],
  },
  "geohash-encoder": {
    h2: "Geohash is a spatial indexing tool, not a universal address format",
    paras: [
      "Geohash converts latitude and longitude into a compact string whose prefixes tend to group nearby cells. That property is useful for databases, caching, rough proximity filtering and partitioning location data. More characters represent a smaller cell, but increasing string length does not improve the accuracy of the coordinate that was encoded.",
      "Geohash has edge effects: two physically close points can sometimes have very different prefixes when they fall on opposite sides of a cell boundary. Use it as an indexing aid, then calculate real distance when proximity decisions matter. Plus Codes and MGRS solve related but different problems and should not be treated as interchangeable identifiers.",
    ],
  },
  "buffer-zone-map": {
    h2: "A buffer map shows distance from a feature; it does not establish a legal setback",
    paras: [
      "Buffers are useful for screening questions such as what lies within 100 metres of a site, which properties fall near a corridor, or how a notification zone looks around a facility. The geometry is straightforward: every point in the buffer lies within the chosen distance of the source feature. The legal meaning of that distance is a separate question.",
      "Environmental, planning, utility and zoning rules may define distance from a parcel line, building edge, watercourse, centreline or surveyed boundary rather than from the point you clicked. Use the map to understand scale and possible overlap, then verify the official measurement rule before treating the buffer as a compliance boundary.",
    ],
  },
  "store-locator-radius": {
    h2: "Retail radius rings are useful for screening, but road access shapes the real catchment",
    paras: [
      "Store-locator radii help compare candidate sites, visualize spacing between branches and estimate which neighbourhoods sit near a location. They are fast and consistent, which makes them useful early in site selection. A 5-mile ring, however, does not mean every customer inside it has the same access or travel time.",
      "Highways, rivers, bridges, pedestrian barriers and competing centres can make real catchments asymmetric. Use radius rings to compare geography, then add drive-time, population and competitor layers before making a leasing or territory decision.",
    ],
  },
  "competitor-distance-map": {
    h2: "Competitor spacing is only one layer of market overlap",
    paras: [
      "Measuring the distance between your location and competing sites is useful for identifying clusters, white space and possible cannibalisation. Straight-line distance provides a consistent geographic baseline, while drive time is usually closer to what a customer experiences. Two stores five miles apart can serve very different markets if a river, motorway or transit pattern separates them.",
      "Do not treat distance alone as market share. Store format, population, daytime activity, parking, transit, pricing and brand strength can matter more than the nearest competitor. Use the map as a screening tool and combine it with demand and accessibility data for commercial decisions.",
    ],
  },
  "optimal-meeting-point": {
    h2: "A mathematically central point becomes useful only after you test real access",
    paras: [
      "An optimal meeting-point workflow starts by defining what 'fair' means. Equal straight-line distance, minimum total distance, equal drive time and easiest public transport can all produce different answers. A geographic centre is objective, but it may fall somewhere inconvenient or inaccessible.",
      "Use the calculated point to narrow the search area, then compare nearby towns, stations, venues or road junctions using routing. For groups with very different transport modes, optimize around travel burden rather than map symmetry.",
    ],
  },
  "closest-facility-finder": {
    h2: "Nearest facility by straight-line distance is a fast shortlist, not always the fastest response",
    paras: [
      "This tool is useful when several depots, clinics, warehouses or service locations could handle the same destination. Straight-line distance quickly identifies the geographically closest candidates and is especially useful for large batches where a full routing call for every pair would be expensive or slow.",
      "The nearest point on the map can still be slower by road because of access restrictions, rivers, mountain passes or network layout. For dispatch, emergency planning or strict service-level decisions, validate the shortlist with road travel time before assigning the job.",
    ],
  },
  "ev-range-radius": {
    h2: "An EV range circle is an upper-bound planning sketch, not a battery guarantee",
    paras: [
      "Drawing rated vehicle range as a circle is a useful first look at how far a trip might extend from a charging point. Real energy use varies with speed, temperature, elevation, wind, cabin heating or cooling, payload and battery condition. A circular range also ignores the road network, so parts of the ring may be impossible to reach directly.",
      "For trip planning, apply a reserve instead of using 100% of the advertised range and compare the route with charging locations. Treat the radius as a visual ceiling; route-specific energy planning is the better model when arriving with a safe state of charge matters.",
    ],
  },
  "walk-score-radius": {
    h2: "Walking reach is shaped by paths and crossings, not just distance",
    paras: [
      "A walking radius gives a simple geometric view of what sits near a point, which is helpful for comparing hotels, stations, schools or neighbourhood amenities. It does not know whether there is a sidewalk, safe crossing, public entrance, steep hill or barrier between the origin and destination.",
      "Use the circle to screen nearby places, then switch to walking-route or travel-time analysis for actual access. This page does not reproduce a commercial Walk Score rating; it visualizes distance-based pedestrian reach and should be interpreted accordingly.",
    ],
  },
  "csv-latlng-validator": {
    h2: "Validate coordinates before mapping so one bad column does not corrupt the whole dataset",
    paras: [
      "Coordinate CSV files often fail for predictable reasons: latitude and longitude are swapped, western longitudes lose the minus sign, decimal separators change, headers are ambiguous, or text appears in numeric columns. A validator helps catch those problems before they turn into pins in the wrong country or rejected API requests.",
      "Check plausible ranges as well as syntax. Latitude must fall between −90 and 90 and longitude between −180 and 180, but a value can still be valid numerically and wrong for your project. Plot a sample and compare expected geography before processing the full file.",
    ],
  },
  "heatmap-from-points": {
    h2: "A heatmap reveals concentration, but visual intensity is not automatically statistical density",
    paras: [
      "Heatmaps are useful when hundreds or thousands of points make a pin map unreadable. They highlight areas where observations concentrate and can quickly reveal hotspots, corridors or gaps. The visual result depends on radius, blur, zoom and weighting settings, so two heatmaps of the same points can look different without either being mathematically wrong.",
      "Use the map for exploratory pattern recognition. If a report requires formal density estimates, significance testing or population-normalized rates, move the same dataset into GIS or statistical software and document the chosen method.",
    ],
  },
  "timezone-map-finder": {
    h2: "Time-zone boundaries are legal and administrative, not simple longitude bands",
    paras: [
      "A timezone lookup identifies the IANA zone associated with a location so software can apply the correct civil-time rules. Real zones follow national and regional decisions, so boundaries can zigzag around states, provinces and municipalities instead of following clean 15-degree longitude strips.",
      "The zone identifier is more durable than storing a current UTC offset because daylight-saving rules and legislation can change offsets over time. For scheduling systems, keep the IANA name and a timestamp rather than assuming today's offset will remain valid forever.",
    ],
  },
  "bounding-box-calculator": {
    h2: "A bounding box is a rectangular extent for search and APIs, not the true shape of the area",
    paras: [
      "Bounding boxes reduce a study area to minimum and maximum latitude and longitude. They are useful for API queries, viewport fitting, tile requests, spatial filtering and documenting the extent of a dataset. The rectangle will usually include land or features outside the actual area of interest because it describes an envelope, not a polygon boundary.",
      "Be careful around the antimeridian and near the poles, where naive minimum/maximum longitude logic can produce an unexpectedly huge box. For precise inclusion tests, use the real polygon after using the bounding box as a fast first filter.",
    ],
  },
  "qr-location-helper": {
    h2: "A location QR code is only as reliable as the coordinate or URL placed inside it",
    paras: [
      "QR codes are useful for signs, invitations, event check-ins and field labels because a phone can open a location without retyping coordinates. The important part is the payload: use a stable maps URL, decimal coordinate pair or other unambiguous location reference rather than a vague place name.",
      "Test the QR on more than one phone before printing it at scale. If the destination is privacy-sensitive, remember that the code itself visibly contains or resolves to the location and can be copied by anyone who sees it.",
    ],
  },
  "historical-map-context": {
    h2: "Historical-map matching starts with control points that still exist today",
    paras: [
      "Old maps can use obsolete projections, shifted datums and generalized roads, so they rarely line up perfectly with a modern basemap. A practical first step is to identify stable features—churches, bridges, street junctions, monuments or coastlines—and record their modern coordinates as control points.",
      "One matching landmark is not enough to georeference a whole sheet. Use several well-distributed points and specialist GIS software when spatial accuracy matters. MapBench is useful for collecting context and coordinates before that deeper alignment work.",
    ],
  },
  "peak-elevation-profile": {
    h2: "Terrain profiles show the shape of the land, but DEM resolution limits small features",
    paras: [
      "An elevation profile helps visualize climbs, descents, ridges and valleys along a route or line. It is useful for hiking, cycling, radio-path context and comparing alternative routes. The values come from a digital elevation model, so they represent sampled terrain rather than a surveyed measurement at every step.",
      "Narrow ridges, buildings, trees and small cuttings can disappear at coarse grid resolution, especially in steep terrain. Use the profile to understand broad terrain shape; engineering, construction and official elevation work require higher-resolution authoritative data.",
    ],
  },
  "school-district-context": {
    h2: "School-district context helps you find the right authority, but only the district can confirm assignment",
    paras: [
      "Address, county and nearby-school context can help narrow which school system or district website to check. Boundaries can change with rezoning, grade level, special programs, new development and annual enrollment decisions, so a general map should not be used as the final enrollment determination.",
      "For a home purchase or registration decision, use the official district locator and confirm the specific address. Nearby schools are not always the assigned schools, and postal city names do not define school-district boundaries.",
    ],
  },
  "gpx-route-stats": {
    h2: "GPX route statistics depend on the recorded points, not just the visible line",
    paras: [
      "Distance, elevation gain, duration and speed from a GPX file are derived from the points stored by the device or app. GPS noise, paused recording, sparse sampling and tunnels can all change the totals. Viewing the track on a map is an important sanity check before treating the summary as a training or route record.",
      "Elevation is especially sensitive because small vertical errors can accumulate into inflated gain. Keep the original file, inspect obvious spikes and understand whether the source used GPS altitude, barometric altitude or later elevation correction before comparing statistics across devices.",
    ],
  },
};
