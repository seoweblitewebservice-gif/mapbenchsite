import type { ToolCopy } from "./toolCopyTypes";

export const PREMIUM_TOOL_COPY_14: Record<string, ToolCopy> = {
  "cities-within-radius": {
    h2: "Find nearby cities with a stronger U.S. Census mode and a worldwide fallback",
    paras: [
      "A city-radius search sounds simple, but the usefulness of the answer depends heavily on the place dataset behind it. In the United States, MapBench now queries Census geography for incorporated places and Census Designated Places instead of relying only on a short list of major world cities. That means smaller suburbs, towns and named communities can appear when their Census reference point falls within the selected radius. Results include distance, population, FIPS-style identifiers and CSV export, with a population filter for narrowing the list to larger places.",
      "Outside the United States, the tool keeps a curated worldwide city dataset as a practical fallback. The page labels which mode is being used so a user does not mistake a global convenience dataset for an exhaustive national gazetteer. This distinction matters when the tool is used for sales territories, regional research, day-trip planning, branch coverage or local-market analysis: an omitted small settlement is not evidence that no settlement exists there.",
      "The radius itself is a straight geographic distance from the selected centre, not a driving-time boundary. Rivers, mountains, road networks, border crossings and traffic can make a city inside the circle much harder to reach than a farther city connected by a fast highway. For accessibility questions, compare the result with the Drive Time Map or Driving Distance Calculator rather than using radius alone as a travel promise."
    ],
  },
  "population-within-radius": {
    h2: "Population within a radius is now Census-backed in the U.S., but it remains an explicitly labelled geographic estimate",
    paras: [
      "For U.S. locations, MapBench estimates population from Census ZIP Code Tabulation Areas whose Census reference points fall inside the selected circle. That is a substantial improvement over simply adding the populations of a few nearby major cities because suburban and many rural residents are represented through ZCTA population totals. The result also reports housing units and, where recent ACS coverage is available, contextual measures such as household income, median age, home value, poverty and educational attainment.",
      "The tool deliberately does not call this an exact custom-area Census count. A ZCTA can cross the radius boundary, so including or excluding the entire area according to its reference point creates approximation error near the circle edge. The demographic summary is also based on recent ACS estimates for a bounded set of the largest included ZCTAs and displays a coverage percentage. That makes the calculation useful for exploratory market sizing and comparing candidate locations while keeping its limitations visible.",
      "For formal funding, regulatory, epidemiological or policy work, a GIS analyst would normally intersect smaller Census geographies or gridded population data with the exact circle and apply an areal or population-weighted allocation method. MapBench is designed to provide a fast, reproducible first-pass estimate and enough methodological detail for users to know when a more rigorous workflow is required."
    ],
  },
  "zip-codes-within-radius": {
    h2: "U.S. ZIP-radius searches use Census ZCTAs and clearly separate statistical geography from mail delivery",
    paras: [
      "In the United States, MapBench first searches Census ZIP Code Tabulation Areas rather than scraping a limited set of nearby address labels. Returned ZCTAs include their Census reference point, straight-line distance from the chosen centre, 2020 population and housing-unit counts, and CSV export. This gives the result a consistent statistical geography that is much more useful for demographic screening, territory comparison and local-market research than an arbitrary list capped by a geocoder response limit.",
      "A ZCTA is not an official USPS ZIP Code boundary. USPS ZIP Codes are mail-routing constructs and can include PO boxes, unique organizations and delivery patterns that do not behave like one nationwide polygon layer. Census ZCTAs are statistical approximations designed so population and housing data can be summarized geographically. MapBench keeps this distinction visible instead of presenting a ZCTA map as an authoritative USPS delivery map.",
      "The circle test uses the ZCTA reference point rather than clipping every polygon to the exact radius. That makes the result fast and reproducible, but a returned ZCTA may extend beyond the circle and a nearby area can be omitted if its reference point lies just outside. Outside the United States, the tool falls back to OpenStreetMap postcode coverage and labels that mode separately."
    ],
  },
  "us-county-demographic-explorer": {
    h2: "Compare counties with official Census boundaries and recent ACS context in one map-and-table workflow",
    paras: [
      "The U.S. County Demographic Explorer loads every county or county-equivalent in the selected state from Census TIGERweb and joins those polygons to recent American Community Survey estimates using county FIPS. The map can be coloured by population, household income, population density, poverty, educational attainment or home value, while the table can be searched and sorted independently. Clicking a county gives a focused detail panel rather than forcing the user to interpret a state-wide colour scale alone.",
      "This combination is useful for market screening, regional comparison, newsroom research, classroom work, branch planning and finding outliers before opening more detailed Census tables. FIPS identifiers make the results easier to join with other government datasets, and CSV export preserves the core metrics for spreadsheet analysis. The map is an exploratory interface, not a substitute for the underlying Census source when a decision requires margins of error or detailed demographic universes.",
      "ACS values are survey estimates collected over a multi-year period. Two counties with similar point estimates may not be statistically different once sampling uncertainty is considered, and a median household income is not a measure of total local wealth. MapBench therefore names the source vintage, keeps boundaries separate from demographic estimates, and avoids presenting the choropleth as a live or survey-grade count."
    ],
  },
  "world-time-zone-map": {
    h2: "Explore world time zones without confusing a visual offset map with exact civil-time boundaries",
    paras: [
      "The World Time Zone Map is built around an exact coordinate lookup rather than trusting a coloured stripe alone. Search a place, use GPS, enter coordinates or click anywhere on the world map and MapBench resolves that point to an IANA time-zone identifier. The page then shows current local time, date-aware UTC offset and daylight-saving status, which is more useful for scheduling and software work than storing a fixed offset such as UTC−5.",
      "Civil time-zone borders are political and often irregular. They can follow state, provincial or national boundaries and can change when governments revise time policy. For fast visual context, MapBench includes a generalized global offset surface, but that layer is explicitly labelled as generalized. The exact result to rely on is the IANA zone resolved for the selected coordinate, not the background colour at a low zoom level.",
      "IANA identifiers such as America/New_York or Asia/Kolkata also carry historical and seasonal rules that a raw UTC offset cannot represent. Two places can share the same current offset and diverge later because only one observes daylight saving time. That is why the tool links naturally to time-difference and meeting-planning tools when the real task is coordinating people rather than simply identifying a zone."
    ],
  },
  "driving-distance-calculator": {
    h2: "Road distance answers a different question from straight-line distance",
    paras: [
      "Driving distance follows a routable road network between the selected origin and destination. The result is intended for trip planning, mileage comparisons, customer visits, delivery estimates and other workflows where a straight line would ignore bridges, one-way streets, mountain passes, ferries and the actual shape of the road system. MapBench keeps the route visible on the map so an obviously wrong detour or endpoint is easier to catch before the number is reused elsewhere.",
      "The travel time is a routing estimate, not a promise of arrival time. Live traffic, temporary closures, weather, road works, vehicle restrictions, border delays and stop time can all make a real journey longer. The underlying routing service may also choose a different reasonable route from the one a local driver would prefer. For operational planning, treat duration as a baseline and add the uncertainty appropriate to the trip.",
      "When the road network is not relevant, use Distance Between Two Places for a stable great-circle baseline. When the question is how much territory can be reached in a fixed number of minutes, a Drive Time Map is more appropriate because it creates a network-based reachable area instead of measuring one destination."
    ],
  },
  "drive-time-map": {
    h2: "Drive-time areas model road accessibility, so they are usually more realistic than simple circles",
    paras: [
      "A drive-time map creates an isochrone: an area estimated to be reachable from the chosen origin within a selected amount of travel time. The shape expands along faster roads and contracts where the network is indirect or crossings are limited. That makes it useful for store catchments, service territories, home searches, commute comparisons, field operations and facility planning where a 10-mile circle would treat every direction as equally accessible.",
      "MapBench supports road-network travel rather than pretending radius and travel time are interchangeable. A river with one bridge, a mountain range, a limited-access motorway or a sparse rural network can produce a strongly asymmetric reachable area. Multiple time contours can also reveal how coverage grows from a short local trip into a broader regional catchment.",
      "The result normally represents typical/free-flow routing rather than guaranteed live traffic conditions. Rush-hour congestion, incidents, weather and road restrictions can change what is reachable at a specific moment. Use the isochrone as a planning model and check a live navigation service when an exact departure-time journey matters."
    ],
  },
  "map-radius": {
    h2: "A radius map is a geometric distance rule, not a promise about travel or serviceability",
    paras: [
      "MapBench draws a geodesic circle around the chosen centre and calculates its area and circumference. Because the boundary is defined by surface distance from one point, it is useful for rules expressed as a fixed radius: preliminary service zones, site buffers, event planning, property searches, facility comparisons and quick geographic coverage checks. Export options let the geometry move into other mapping workflows instead of remaining only a visual sketch.",
      "The key limitation is conceptual rather than mathematical: equal straight-line distance does not mean equal travel time. A point ten miles away across a river or mountain can take much longer to reach than a point farther away along a motorway. For road-based service promises or commute planning, compare the circle with a Drive Time Map. For people or ZIP areas inside the radius, use the dedicated population and ZIP-radius tools so the geographic boundary is connected to an appropriate dataset.",
      "A radius drawn on a web map is also not a legal property buffer or survey. The centre coordinate, map scale and source geometry matter, and legal setbacks can be defined by parcel lines or jurisdiction-specific rules rather than a simple point radius."
    ],
  },
  "halfway-between-two-places": {
    h2: "The geographic halfway point is a neutral starting point, not automatically the fairest meeting place",
    paras: [
      "MapBench calculates the midpoint between two selected locations on the Earth and plots it together with both endpoints. This is useful when two people, facilities or service areas need a neutral geographic reference. The midpoint is reproducible from the coordinates and does not depend on which road route happens to be chosen on a particular day.",
      "A geometric midpoint can still be a poor place to meet. It may fall in water, mountains, private land or an area with weak road access, and one traveller can have a much longer driving time even when both are the same straight-line distance away. The practical workflow is to use the midpoint as an anchor, inspect nearby towns or venues, and then compare road routes from both origins.",
      "For logistics, warehouse siting or customer-service decisions, equal travel time may be more important than equal distance. MapBench therefore keeps midpoint, driving-distance and route tools separate rather than hiding those different definitions behind one generic halfway answer."
    ],
  },
  "coordinate-converter": {
    h2: "Convert coordinates while keeping datum, order and precision visible",
    paras: [
      "Coordinate conversion is easy to get wrong because several valid formats can describe the same location and some systems reverse longitude and latitude order. MapBench converts WGS84 coordinates across decimal degrees, degrees-minutes-seconds, degrees and decimal minutes, UTM, MGRS, Geohash and Plus Code representations while keeping the selected point visible on a map. Batch conversion and CSV export make the same workflow useful for small datasets rather than only one coordinate at a time.",
      "Changing notation does not improve positional accuracy. A GPS point measured to roughly ten metres remains a roughly ten-metre observation even if it is displayed with many decimal places or encoded into a long grid string. Precision controls should therefore match the quality of the source data rather than creating false confidence through extra digits.",
      "Datum also matters. The main MapBench converter is built around WGS84, the reference used by ordinary GPS and most web maps. Coordinates from a local survey datum or projected engineering grid can shift if they are treated as WGS84 without a proper datum transformation. For professional GIS or surveying work, confirm the coordinate reference system before conversion."
    ],
  },
};
