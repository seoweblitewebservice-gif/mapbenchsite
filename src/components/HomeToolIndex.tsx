import Link from "next/link";
import { TOOLS } from "@/lib/registry";

const HOME_GROUPS = [
  {
    title: "How the location tools work",
    slugs: ["what-state-am-i-in", "what-zip-code-am-i-in", "what-country-am-i-in", "find-my-location", "latitude-longitude-finder"],
  },
  {
    title: "Distance, radius and travel tools",
    slugs: ["distance-between-two-places", "driving-distance-calculator", "drive-time-map", "map-radius", "cities-within-radius", "zip-codes-within-radius", "halfway-between-two-places", "distance-matrix-calculator"],
  },
  {
    title: "Area, elevation and time tools",
    slugs: ["map-area-calculator", "lot-size-calculator", "elevation-finder", "timezone-map-finder", "sunrise-sunset-calculator", "bearing-calculator"],
  },
  {
    title: "Map file and data tools",
    slugs: ["gpx-viewer", "kml-viewer", "geojson-viewer", "csv-to-map"],
  },
] as const;

const EXPLANATIONS: Record<string, [string, string]> = {
  "what-state-am-i-in": [
    "What State Am I In? identifies the US state or first-level region associated with a location. Use your device location, search for an address or place, or choose a position on the map. The tool is built for quick geographic confirmation, especially when you are travelling, working close to a state line, reviewing a remote property, or checking coordinates supplied by somebody else. The map remains part of the answer, which makes it easier to understand where the selected point sits relative to the surrounding area.",
    "A state lookup can be useful before checking taxes, registration rules, licensing, business requirements, shipping restrictions, school information, legal forms, or regional statistics. It is also a simple way to confirm that a geocoded address or imported coordinate landed in the expected state. Instead of forcing you to interpret latitude and longitude manually, the tool translates the point into a familiar administrative area and gives you a direct route into related MapBench location tools when you need more detail.",
  ],
  "what-zip-code-am-i-in": [
    "What ZIP Code Am I In? helps you identify the US ZIP or postal area associated with your current position or another searched location. Start with GPS, an address, a place name, or coordinates and use the map to confirm the point you are actually asking about. This is especially useful when you have recently moved, are travelling, are working at a job site, or have a location where the ZIP is not obvious from signs or surrounding addresses.",
    "ZIP information is commonly needed for online forms, deliveries, service availability, insurance quotes, local search, mailing addresses, customer records, and territory checks. A ZIP result can also help you move from a broad city-level search to a more precise local area before using another demographic or distance tool. MapBench treats the ZIP lookup as a geographic task rather than just a text search, so the selected point stays visible and can be checked before you rely on the result.",
  ],
  "what-country-am-i-in": [
    "What Country Am I In? resolves a location to its country and is useful both for your current position and for points anywhere else in the world. Search a city or address, paste coordinates, use your device location, or choose a point on the map. The result gives you a quick country-level answer without requiring you to interpret borders yourself, which is helpful for travel planning, international datasets, remote work, logistics, mapping projects, and checking coordinates received from another source.",
    "Country detection sounds simple until a point is close to a border, an island, or a location you do not recognize. Keeping the answer on an interactive map gives you visual context and makes it easier to catch an accidental coordinate swap or a location that geocoded somewhere unexpected. Once the country is known, you can continue into coordinate, distance, time-zone, or mapping tools without starting over. It is a practical first step when country context matters more than the nearest city name.",
  ],
  "find-my-location": [
    "Find My Location shows where your device is located on an interactive map and exposes the coordinates behind that position. It is meant to be more useful than a single blue dot: you can use the result as a starting point for other mapping tasks, copy the coordinates, compare the point with nearby places, or move into related county, ZIP, country, elevation, distance, and time-zone tools. If precise browser location is unavailable, MapBench can still work with searched places or coordinates.",
    "The tool is useful when you are travelling, documenting a field location, meeting someone, recording a site, checking whether another mapping app has the correct position, or simply trying to understand the latitude and longitude of where you are standing. Because location permission can be denied or inaccurate indoors, MapBench keeps alternative input methods available instead of making GPS the only path. The goal is a reusable geographic point you can verify and carry into the rest of the site.",
  ],
  "latitude-longitude-finder": [
    "Latitude and Longitude Finder turns a place, address, GPS position, or map click into coordinates you can actually use. The result is not limited to one decimal pair: the tool also presents common coordinate representations so the same point can be copied into mapping, GIS, navigation, field-work, or data-cleaning workflows. You can edit the coordinates directly, adjust precision, reverse the point back into an address when available, and keep the map synchronized with the values on screen.",
    "This is useful when a website asks for coordinates, when you need to verify a location before importing it into a file, or when somebody sends you coordinates in a format you do not normally use. A map preview is important because a syntactically valid coordinate can still be wrong if latitude and longitude were swapped or a minus sign was lost. MapBench keeps the numeric values, formatted versions, address context, and map together so mistakes are easier to spot before the coordinates are reused elsewhere.",
  ],
  "distance-between-two-places": [
    "Distance Between Two Places measures the straight-line separation between two selected locations and shows the geometry on the map. Search both places, use coordinates, GPS, or click the map to set the endpoints. The result includes more than a single number: MapBench surfaces distance in useful units, the initial direction, midpoint, final bearing, endpoint details, and map context so you can understand what the measurement represents rather than treating it like an unexplained calculator output.",
    "Straight-line distance is useful for geographic comparison, aviation-style separation, service territories, nearest-location analysis, planning, and quick checks where the road network is not the question. It should not be confused with driving distance, because roads, bridges, borders, ferries, mountains, and one-way systems can make the actual trip much longer. That distinction is why MapBench links this tool naturally with driving distance, halfway-point, bearing, radius, and distance-matrix workflows when a different definition of distance is more appropriate.",
  ],
  "driving-distance-calculator": [
    "Driving Distance Calculator estimates the road distance and travel time between places using a route rather than a straight line. Choose your origin and destination, then compare the route on the map with the geographic separation between the endpoints. This makes the result more useful for real trips, deliveries, technician visits, mileage planning, client travel, and any situation where the shape of the road network matters more than the shortest possible line across the Earth.",
    "Road distance can change because of the selected route, travel mode, road access, bridges, ferries, closures, and the routing data available at the time. For that reason, MapBench presents the route as an estimate and keeps the map visible so you can inspect whether the path looks reasonable. If you only need direct separation, the straight-line distance tool is faster and conceptually simpler. If you need reachable areas rather than one destination, the drive-time map is usually the better next step.",
  ],
  "drive-time-map": [
    "Drive Time Map answers a different question from a radius tool: instead of asking what lies a fixed number of kilometres away, it shows the area that can be reached through the road network within a selected travel time. Choose a starting location, travel mode, and time limit to build an isochrone around the point. The shape can stretch along fast roads and shrink around rivers, limited crossings, indirect streets, or other network constraints, which is exactly why it is useful.",
    "This kind of map is valuable for store catchments, home searches, delivery areas, field service planning, school or office commutes, emergency coverage, and comparing possible business locations. A 30-minute drive-time area is often much more realistic than a 20-mile circle because travel speed is not uniform in every direction. MapBench keeps the calculation visual and pairs it with related radius and distance tools so you can compare network-based accessibility with simpler geometric measures when planning a territory.",
  ],
  "map-radius": [
    "Map Radius draws one or more true geographic circles around a selected location. Search a place, use GPS, enter coordinates, or click the map, then choose the radius and unit that fit your task. The tool calculates useful circle measurements and keeps the boundary interactive so you can see exactly what falls inside or outside the chosen distance. Multiple circles and export options make it useful for more than a quick visual check.",
    "Radius maps work well for simple service zones, event buffers, property searches, facility planning, coverage comparisons, local marketing, and any rule defined as a fixed distance from a point. The important limitation is that a radius is geometric, not a travel-time promise: ten miles in a straight line may require a much longer drive. That is why MapBench separates radius, drive-time, road-distance, and population-within-radius style tasks instead of pretending they are interchangeable. Use the radius when the rule itself is based on distance.",
  ],
  "cities-within-radius": [
    "Cities Within Radius finds places that fall inside a chosen distance from a centre point. Start with a city, address, coordinate pair, or map location, set the radius, and use the returned list to explore nearby cities without manually measuring every candidate. The map makes it easier to understand direction and clustering, while the result list turns a broad circle into something you can actually use for research, planning, outreach, travel, territory design, or location comparison.",
    "The tool is useful when you want to discover nearby markets, plan day trips, build regional prospect lists, compare service areas, or understand what settlements sit around a proposed office or facility. Remember that inclusion is based on geographic distance rather than driving time, so a city inside the circle may still be inconvenient to reach by road. For logistics or commuting questions, combine this result with driving distance or drive-time tools. For postal analysis, use the ZIP-codes-within-radius tool instead.",
  ],
  "zip-codes-within-radius": [
    "ZIP Codes Within Radius finds US ZIP areas around a selected centre point and is designed for territory-style questions where a simple list is more useful than checking one ZIP at a time. Choose a location and radius, then review the matching ZIPs in geographic context. This can support direct-mail planning, local advertising, sales territory research, service coverage, franchise analysis, customer segmentation, and any workflow where postal areas are used as a practical approximation of local markets.",
    "A radius-based ZIP list should be treated as a geographic filter, not as proof that every address in every returned ZIP lies inside the circle. ZIP and ZCTA shapes can be irregular, and postal geography does not behave like neat equal-sized tiles. The map helps you understand that limitation visually. When your question is about actual travel time, switch to a drive-time map; when you need one specific postal area, use the ZIP lookup tool. MapBench keeps these related tasks separate so the measurement matches the decision.",
  ],
  "halfway-between-two-places": [
    "Halfway Between Two Places calculates the geographic midpoint between two selected locations and shows it on the map with the original endpoints. Search both places or enter coordinates, then use the midpoint as a neutral reference for meeting, comparison, or route planning. The tool is especially useful when two people are travelling from different areas and want a mathematically balanced starting point before considering roads, towns, venues, or practical travel time.",
    "A geographic midpoint is not automatically the fairest driving meeting point because road networks are uneven. A point halfway over a river, mountain, restricted area, or sparsely connected region may be mathematically correct but impractical. Use the result as a geographic anchor, then inspect nearby places or compare driving routes from both sides. That makes the tool useful for choosing meeting regions, warehouse candidates, shared service points, and other two-origin decisions while keeping the distinction between geometric halfway and equal travel time clear.",
  ],
  "distance-matrix-calculator": [
    "Distance Matrix Calculator compares many points at once instead of forcing you to run the same two-place calculation repeatedly. Add locations through search, GPS, map clicks, coordinate paste, or bulk input, then generate an N×N matrix showing how every point relates to every other point. Straight-line mode supports larger sets, while network-based travel modes can be used for smaller groups when road, walking, or cycling distance is the real question.",
    "The tool is useful for branch comparison, depot planning, field teams, multi-location businesses, classroom exercises, research datasets, candidate site screening, and finding nearest or farthest pairs. Heatmap and pair-list views make dense results easier to read, and CSV export lets you move the matrix into spreadsheets or analysis software. Because matrix size grows quickly as points are added, MapBench keeps the workflow explicit and separates straight-line calculations from routing-based results so you know exactly what kind of distance each cell represents.",
  ],
  "map-area-calculator": [
    "Map Area Calculator lets you draw a polygon directly on the map and measure the enclosed area and perimeter. It is useful when a place is not a neat rectangle and a simple length-times-width formula would be misleading. Trace a field, lot, roof footprint, site boundary, park, project zone, or other shape, then review the calculated size in practical units. Editing the polygon on the map makes it easy to refine points instead of re-entering numbers from scratch.",
    "The result is appropriate for planning and estimation, not for replacing a legal survey or cadastral measurement. Map imagery, hand-drawn vertices, coordinate accuracy, and boundary interpretation all affect the answer. Even with that limitation, a map-based area tool is extremely useful for early-stage budgeting, landscaping, agriculture, fencing, land comparison, and checking whether a claimed area is plausible. If your property is roughly rectangular, the lot-size calculator may be faster; for irregular boundaries, drawing the actual shape is usually more informative.",
  ],
  "lot-size-calculator": [
    "Lot Size Calculator turns common property dimensions into area measurements that are easier to compare. Enter the relevant lengths or area values and convert the result into units such as square metres, square feet, acres, or hectares depending on the workflow. It is aimed at quick property and land checks where you already know the dimensions and do not need to trace an irregular boundary on a map.",
    "This is useful for real-estate research, landscaping, fencing estimates, garden planning, construction discussions, comparing listings, or understanding how a quoted lot area relates to familiar units. The calculation is only as good as the dimensions you provide, and many real parcels are not perfect rectangles. If the boundary bends or follows an irregular shape, use the map area calculator instead. MapBench keeps both options available because dimension-based and polygon-based area calculations solve different versions of the same land-measurement problem.",
  ],
  "elevation-finder": [
    "Elevation Finder returns the ground elevation for a selected point and keeps the location visible on the map so you can verify exactly where the value applies. Search for a place, use your location, paste coordinates, or click the map. The result can be useful in feet and metres for travel, hiking, cycling, property research, photography, weather context, environmental work, and any task where vertical position matters alongside latitude and longitude.",
    "Elevation datasets represent terrain at a particular resolution, so the answer should not be treated like a survey-grade spot height. Buildings, bridges, cliffs, embankments, and small local features may not be captured perfectly by a terrain model. For route-based questions, an elevation profile is more useful because it shows how height changes along a path rather than at one point. For a quick location check, however, the finder gives you an immediate terrain estimate that can be copied and combined with other MapBench coordinate and location tools.",
  ],
  "timezone-map-finder": [
    "Time Zone Finder identifies the IANA time zone for a location and turns that zone into practical current-time information. Search a city or address, use GPS, paste coordinates, or click the map. The result includes the zone name, UTC offset, daylight-saving context when applicable, local time, and comparisons with other major world clocks. That makes it useful for travel, international meetings, remote teams, scheduling, customer support, shipping, and checking software or data that stores IANA zone identifiers.",
    "A time zone is more than a fixed UTC offset because daylight-saving rules can change by date and region. Two places with the same offset today may not stay aligned throughout the year. Using the actual zone identifier is therefore safer than assuming a permanent number of hours from UTC. MapBench keeps the selected location, zone, offset, map, and world-clock context together so you can verify both the geography and the time conversion before using it in a schedule or technical workflow.",
  ],
  "sunrise-sunset-calculator": [
    "Sunrise and Sunset Calculator shows how daylight changes for a chosen location and date. Search a place, use GPS, paste coordinates, or click the map, then review sunrise, sunset, solar noon, day length, and civil, nautical, and astronomical twilight. A seven-day comparison helps you see whether daylight is increasing or decreasing around the selected date, while local time-zone handling makes the result easier to use than a raw UTC-only astronomy table.",
    "The tool is useful for photography, hiking, outdoor work, travel, events, agriculture, solar planning, fishing, running, and understanding seasonal daylight. Horizon height, terrain, buildings, weather, and atmospheric refraction can make the visible Sun appear slightly earlier or later than a calculated event, so the values are best treated as astronomical estimates for the selected coordinates. For moon phases or lunar timing, use the related Moon tools; for time-zone checks, the Time Zone Finder provides the local-clock context separately.",
  ],
  "bearing-calculator": [
    "Bearing Calculator tells you the direction from one point to another and is designed to be more informative than a single compass number. Choose two locations and review the initial bearing, final bearing, midpoint context, and direction on the map. Depending on the workflow, bearings can support navigation, surveying discussions, antenna alignment, travel planning, route analysis, field work, and understanding how two places are positioned relative to one another on the globe.",
    "A bearing is not the same thing as a road direction. The shortest geodesic path can begin on one heading and finish on another because the Earth is curved, while a rhumb-line direction behaves differently again. Magnetic and true north can also differ depending on location and date. MapBench keeps the geometry visible so the number has spatial context. If you need distance as well as direction, use the Distance Between Two Places tool; if you need road instructions, a routing tool is the more appropriate choice.",
  ],
  "gpx-viewer": [
    "GPX Viewer opens GPS Exchange Format files in the browser so you can inspect tracks, routes, and waypoints on a map before deciding what to do with the data. Upload a GPX file and review the geographic content visually instead of reading raw XML. This is useful for hiking logs, cycling activities, GPS exports, field surveys, route planning, outdoor navigation, and checking whether a downloaded or shared file actually contains the path you expected.",
    "A good viewer should help you validate data, not just draw a line. MapBench surfaces useful file and geometry context and keeps conversion workflows close by when you need the same information in another mapping format. GPX can also contain timestamps, elevations, extensions, and device-specific fields, so conversion may not preserve every detail. For that reason, keep the original file as your source copy and use converted versions for downstream compatibility. KML and GeoJSON viewers are available when those formats fit the next step better.",
  ],
  "kml-viewer": [
    "KML Viewer lets you open Keyhole Markup Language files and inspect their geographic features directly on a map. KML is common in Google Earth workflows and can contain points, lines, polygons, names, folders, and styling information. Uploading the file into MapBench gives you a quick visual check of where the data sits, whether the geometry looks complete, and whether the file appears suitable for conversion or further analysis.",
    "This is useful when somebody sends you a KML or KMZ-style dataset, when you are cleaning older mapping files, or when you need to move data into a web-friendly format. KML can carry presentation features that other formats do not represent in the same way, so a converted GeoJSON or GPX file may preserve the geometry while losing some styling or hierarchy. The viewer helps you inspect the original first, which is safer than converting blindly. Keep the source file and verify important attributes after any format change.",
  ],
  "geojson-viewer": [
    "GeoJSON Viewer opens GeoJSON feature collections and individual geometries on an interactive map so you can understand a dataset before using it elsewhere. GeoJSON is widely used in web mapping because it combines geometry with flexible properties in a JSON structure. Upload or inspect the file, confirm that features appear in the expected location, and use the visual result to catch coordinate-order problems, missing features, or unexpected geometry before the file reaches another application.",
    "The tool is useful for developers, analysts, students, GIS users, and anyone exchanging geographic data between web tools. A valid JSON file can still contain wrong coordinates, inconsistent properties, or geometry that is technically valid but not what you intended. Viewing the data is therefore an important quality-control step. When you need another format, MapBench keeps KML, GPX, CSV, and conversion tools nearby, but the original GeoJSON should remain your reference copy until you have confirmed that important geometry and attributes survive the conversion.",
  ],
  "csv-to-map": [
    "CSV to Map turns rows containing coordinates into visible points so a spreadsheet can become a geographic dataset without a full GIS workflow. Upload or paste a CSV with latitude and longitude columns, inspect the points on the map, and use the result to find obvious mistakes such as swapped columns, missing values, duplicated locations, or coordinates that land far outside the expected region. This makes the tool useful for customer lists, field records, store locations, research samples, assets, and simple location inventories.",
    "CSV files are flexible, which also means column names, quoting, delimiters, and missing values can vary widely. MapBench treats mapping as a validation step rather than assuming every row is correct. Once the points look right, you can continue into other geographic formats or tools depending on what you need next. If your data already uses GeoJSON, KML, or GPX, open it in the matching viewer instead of converting unnecessarily. Keeping the original table alongside the mapped result makes later auditing much easier.",
  ],
};

export default function HomeToolIndex() {
  return (
    <section aria-labelledby="home-tool-index" className="border-t border-line py-14">
      <div className="mx-auto max-w-4xl px-4">
        <div className="max-w-3xl">
          <p className="font-sans text-[11px] font-extrabold uppercase tracking-[0.14em] text-brand-strong">How each tool works</p>
          <h2 id="home-tool-index" className="sect-h mt-2">The long version — practical tools, explained before you use them</h2>
          <p className="mt-3 text-[15px] leading-7 text-mute">If you want more than a one-line directory, this section explains what each featured MapBench tool is for, when it is useful, and what its result actually means. Open any tool directly from the link below its explanation.</p>
        </div>

        <div className="mt-10 space-y-14">
          {HOME_GROUPS.map((group) => (
            <section key={group.title}>
              <h3 className="border-b border-line pb-3 font-display text-2xl font-bold">{group.title}</h3>
              <div className="mt-7 space-y-10">
                {group.slugs.map((slug) => {
                  const tool = TOOLS.find((item) => item.slug === slug);
                  const copy = EXPLANATIONS[slug];
                  if (!tool || !copy) return null;
                  return (
                    <article key={slug} className="max-w-3xl">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="font-display text-xl font-bold leading-snug">
                          <Link href={`/tools/${slug}`} className="underline decoration-line underline-offset-4 hover:text-brand-strong hover:decoration-brand">{tool.name}</Link>
                        </h4>
                        {tool.scope === "US focused" && <span className="font-sans text-[9px] font-extrabold uppercase tracking-wide text-brand-strong">US</span>}
                      </div>
                      <p className="mt-3 text-[15px] leading-7 text-mute">{copy[0]}</p>
                      <p className="mt-3 text-[15px] leading-7 text-mute">{copy[1]}</p>
                      <Link href={`/tools/${slug}`} className="mt-3 inline-block font-sans text-[13px] font-extrabold text-brand-strong hover:underline">Open {tool.name} →</Link>
                    </article>
                  );
                })}
              </div>
            </section>
          ))}
        </div>

        <div className="mt-12 border-t border-line pt-6 text-sm text-mute">
          Looking for a more specific calculator or map? <Link href="/tools" className="font-extrabold text-brand-strong hover:underline">Browse all {TOOLS.length} MapBench tools →</Link>
        </div>
      </div>
    </section>
  );
}
