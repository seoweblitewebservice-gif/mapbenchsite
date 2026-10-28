// Long-form on-page content for Location tools (~170 words each, original copy).
export const COPY1: Record<string, { h2: string; paras: string[] }> = {
  "find-my-location": {
    h2: "How the Find My Location tool works",
    paras: [
      "Find My Location answers the simplest and most common map question of all: where exactly am I right now? When you press the button, your browser's built-in geolocation service combines GPS, Wi-Fi and cell-tower signals to estimate your position, and the page drops a pin on an interactive map at those coordinates. Immediately afterwards a single reverse-geocoding request translates the raw latitude and longitude into a readable address with street, city, county, state, postcode and country fields. You can copy any of these values, share the link, or jump straight into a related tool such as the county finder or the coordinate converter.",
      "Privacy is the core design rule here. Your position is handled entirely inside your browser tab: nothing is written to a database, no account is involved, and the only network request carries the coordinates themselves to a public OpenStreetMap reverse geocoder. If you prefer not to share your position at all, you can click anywhere on the map instead and every feature keeps working. Accuracy typically ranges from a few metres outdoors with GPS to a few hundred metres indoors, where the browser falls back to network-based positioning.",
    ],
  },
  "what-county-am-i-in": {
    h2: "How to find what county you are in",
    paras: [
      "This tool resolves any position to its administrative county in seconds, using boundary data contributed by the OpenStreetMap community. Press the GPS button to use your live position, click any point on the map, or paste coordinates from a photo, a deed, or a dataset — the reverse geocoder returns the county together with the city, state and country for context, each in its own field so you can copy exactly the piece you need. Because the underlying boundaries are mapped administrative relations rather than postal approximations, results stay correct near confusing metro borders where postal cities and counties disagree.",
      "The same workflow works worldwide: outside the United States the county field reports the equivalent second-level administration — a district, province subdivision or municipality — making the tool useful for travellers, genealogy researchers, process servers, real-estate due diligence and anyone filling forms that demand a county. Coverage is excellent across the US, including Alaska boroughs, Louisiana parishes and Virginia independent cities. Where a remote area has no mapped boundary the tool says so honestly instead of guessing, and you can fall back to the state or country lookup for a coarser but reliable answer.",
    ],
  },
  "what-city-am-i-in": {
    h2: "How to find what city you are in",
    paras: [
      "What City Am I In resolves your position — or any point you click — to the incorporated city, town or municipality that governs it, using OpenStreetMap administrative boundaries rather than postal shortcuts. That distinction matters: mailing addresses frequently cite a neighbouring postal city, while taxes, voting, permits and local rules follow the true municipality. The result panel separates city from suburb and neighbourhood, so residents of unincorporated areas or large metro districts immediately see both the governing municipality and the local area name people actually use.",
      "Use the GPS button for a one-tap answer, click the map to test any spot, or paste decimal or DMS coordinates copied from another source. Travellers can verify where a hotel really sits, drivers can check which city's traffic rules apply, and data analysts can clean location columns by reverse-geocoding sample points. Because the lookup is administrative, border-adjacent addresses resolve to the legally correct city even when the mailing address says otherwise. When a rural point has no municipality, the tool transparently reports the county or district instead, and every result can be copied or shared as a link.",
    ],
  },
  "what-state-am-i-in": {
    h2: "How to find what state you are in",
    paras: [
      "Near a border, on a road trip, or checking a dataset? This tool resolves any point on Earth to its first-level administrative region: a US state, or the equivalent province, Land, département or region anywhere else. It uses OpenStreetMap's administrative boundary relations, which follow official state lines to metre-level accuracy, so results stay trustworthy exactly where people get confused — metro areas that span states, river borders, and exclaves. One click on the GPS button answers for your live position; clicking the map or pasting coordinates answers for any place you care about.",
      "The result appears as its own field alongside county, city and country, so you can copy precisely what a form, a tax filing or a shipping rule needs. For logistics and sales teams, the tool is a fast sanity check on territory assignments; for students it is a live atlas exercise. State abbreviations, time zones and postal conventions deliberately stay out of scope here to keep the answer authoritative — pair it with the What Country tool for the sovereign level, or the county tool for the level below. Everything runs in your browser and nothing is stored.",
    ],
  },
  "what-country-am-i-in": {
    h2: "How to find what country you are in",
    paras: [
      "This tool resolves any position to its sovereign country and shows the ISO country code alongside the name — the exact pair developers, customs paperwork and shipping systems ask for. Border regions, islands, enclaves and coastal waters are where naive answers fail, so the lookup uses OpenStreetMap boundary polygons rather than coarse bounding boxes: click a point in Baarle-Hertog or on the Spain–Gibraltar fringe and the result follows the mapped de facto administration. Use the GPS button for your own position, click the map to explore, or paste coordinates from any source.",
      "Practical uses range from the everyday to the technical: verifying which country a server-room address sits in, checking roaming behaviour near borders, teaching geography with a live atlas, or cleaning international address data. Points in international waters honestly return no country, while territorial seas usually resolve to the coastal state. The tool reports the community-mapped consensus in disputed zones and never pretends to arbitrate sovereignty. Like every MapBench tool it is free, needs no account, processes your click locally, and makes a single public reverse-geocoding call to label the point.",
    ],
  },
  "what-zip-code-am-i-in": {
    h2: "How to find what ZIP code you are in",
    paras: [
      "Enter a position and this tool returns the postal code that covers it, reading postcodes from OpenStreetMap address data. US ZIP codes are densely mapped, so results inside cities are typically correct to the street segment; much of Europe, Canada, Australia and other postcode-publishing countries are covered too, which makes the same page useful as a general postcode finder. Use the GPS button for your live position, click the map, or paste latitude and longitude — the postcode appears as its own copyable field together with the full address breakdown for verification.",
      "A word on honesty: ZIP codes are a delivery-routing system, not a geographic one, so PO boxes, carrier routes and newly developed blocks can disagree with map-based lookups. If a rural point returns no postcode, the nearest named town's code is the best available estimate and the tool says so rather than inventing a value. For shipping labels always trust your postal service; for everything else — filling forms, validating datasets, estimating delivery zones, checking which rate area an address falls in — this lookup is fast, free and private, with no uploads and no account.",
    ],
  },
  "reverse-geocoder": {
    h2: "How reverse geocoding turns coordinates into an address",
    paras: [
      "Reverse geocoding is the translation step between machine coordinates and human addresses, and this tool gives you the full structured result: house number and road, suburb, city, county, state, postcode and country, each returned as a separate field. Paste decimal degrees or DMS from a GPS track, a photo's EXIF data, a wildlife sighting or a spreadsheet row; click the map; or drop a pin anywhere. The lookup runs against Nominatim, the community reverse geocoder for OpenStreetMap, which resolves to the nearest mappable address feature.",
      "Structured fields are what make the tool genuinely useful: copy just the county for a form, just the postcode for a delivery check, or the full formatted line for a report. Precision follows your input — five decimals is about a metre — while the resolved address granularity follows what is mapped: dense urban blocks resolve to buildings, rural points to roads or settlements. Because Nominatim is a shared public resource the tool queries it sparingly, one point per lookup, and never batches or stores your coordinates. For large automated jobs, the methodology page explains how to run your own instance.",
    ],
  },
  "coordinates-to-address": {
    h2: "From latitude and longitude to a readable address",
    paras: [
      "Every coordinate pair describes one unique spot on Earth, but humans think in addresses. This tool bridges the two: paste any latitude/longitude pair — decimal degrees like 40.7128, -74.0060 or DMS like 40°26'46\"N — and it returns the closest postal address, displayed both as a full line and as structured components you can copy individually. The map recentres on your point so you can visually verify the result before trusting it, which is exactly the workflow photographers, drone pilots, field scientists and delivery dispatchers need when reconciling GPS records with paperwork.",
      "Because the conversion is powered by OpenStreetMap's Nominatim engine, coverage is worldwide and continuously improved by mappers: street-level detail in cities, settlement-level in remote regions. The tool validates your input first — latitudes beyond ±90 or longitudes beyond ±180 are rejected with a clear message instead of a silent wrong answer — and the resulting link stores your coordinates in the URL so a colleague can reopen the exact same lookup. Nothing is uploaded or stored server-side; the only outgoing request carries the coordinates you asked about.",
    ],
  },
  "address-to-coordinates": {
    h2: "How to geocode an address into GPS coordinates",
    paras: [
      "Geocoding is the forward direction of the address/coordinate bridge: type any address, landmark or place name and receive precise decimal latitude and longitude, pinned on the map and ready to copy into GPS devices, spreadsheets or API calls. Suggestions stream in as you type from the Photon geocoder, an OpenStreetMap-based service tuned for fast type-ahead search, so typos and partial addresses still land on the right feature. Each result shows its full disambiguation line — street, city, country — so 'Springfield' never silently picks the wrong state.",
      "Typical jobs include programming a satnav, anchoring a delivery note, tagging a property listing, planning a meet-up, or seeding the distance and radius tools with exact endpoints. Because results are coordinates on the WGS84 datum, they drop directly into every other MapBench tool and into consumer GPS ecosystems. Accuracy follows the query: house-number addresses usually resolve within tens of metres, city queries to the settlement centre. The service is free and keyless for interactive use; for production-scale geocoding the fair-use notes on our data sources page explain how to stay a good citizen.",
    ],
  },
  "place-lookup": {
    h2: "Looking up any place on Earth",
    paras: [
      "Place Lookup is a gazetteer for the planet: search millions of OpenStreetMap features — cities, villages, neighbourhoods, airports, parks, peaks, stations, landmarks — and jump the map straight to the one you mean. Unlike a plain search box, every result keeps its coordinates front and centre, so the page doubles as a quick coordinate source for other workflows: copy the pair into a route planner, a radius tool or a dataset without leaving the browser tab.",
      "The suggestion list shows the full disambiguation line for each match, which is the difference between finding Cambridge in England and Cambridge in Massachusetts on the first try. Once a place is selected the map flies to it, the coordinates lock into the URL for sharing, and related tools are one click away — distance from here, radius around here, elevation here, sunrise here. Coverage inherits OpenStreetMap's breadth: excellent for inhabited places worldwide, thinner for unnamed wilderness. Like the rest of the platform, the lookup is free, accountless and private: your query goes only to the public geocoder.",
    ],
  },
  "nearby-places-finder": {
    h2: "Finding what's around any point, live",
    paras: [
      "Pick a category — food and drink, health, fuel, money, groceries, parking, lodging or education — set a centre by GPS, search or map click, choose a radius, and this tool queries OpenStreetMap live through the public Overpass API. Results come back sorted by straight-line distance with a compass bearing for each, so you can tell not just what is near but which way and roughly how far. Clicking a result pans the map and opens its name, making the list a practical orientation tool in an unfamiliar neighbourhood.",
      "Because the data is live community-mapped data, you get real amenities — pharmacies, ATMs, supermarkets, schools — not a static directory that rots. Coverage is strongest in mapped urban areas; if a query returns little, widening the radius or choosing a broader category usually helps, and the tool says so plainly when the map simply has nothing there. Rate limits on the shared Overpass service are respected with clear, friendly error messages instead of spinners. Every search runs from your browser; nothing about your position is stored by us.",
    ],
  },
};
