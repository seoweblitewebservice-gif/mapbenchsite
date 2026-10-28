// ~200-word original copy for the newer tools (batch A).
export const COPY6A: Record<string, { h2: string; paras: string[] }> = {
  "what-timezone-am-i-in": {
    h2: "What timezone am I in — answered without a map",
    paras: [
      "Time zones feel like they should be simple — until you land in a Spanish airport at solar midnight, or join a call from a hotel and realise your phone, the wall clock and the sunrise all disagree. This tool cuts straight to the answer: search any place, paste coordinates, or click the map, and it resolves the political time zone for that exact point using the open tz database geometry bundled right into the page. You get the IANA name that software actually uses (America/Chicago, Europe/Madrid), the live local time ticking in your browser, and the current UTC offset, including daylight-saving state.",
      "Because the boundary data is local and the clock comes from your browser's own timezone engine, the answer appears instantly with no server round-trip and no map to wait for — which is exactly why the page is deliberately map-free. Ocean points honestly return nothing, since time zones stop at coastlines. It is the right first step before booking calls, filing across states, or converting a sunrise time, and it pairs naturally with the Meeting Time Planner when more than one zone is involved.",
    ],
  },
  "what-area-code-am-i-in": {
    h2: "Finding the area codes that cover your location",
    paras: [
      "Area codes are one of the last geographies most people carry in memory, and one of the first to betray you after a move. Point this tool at any US location — search an address, click the map, use GPS — and it reverse-geocodes the state, then lists every telephone area code currently assigned to it from a clearly labelled NANPA reference snapshot. Overlays mean most states now juggle several codes, so the honest answer is a list, not a single number, and that list is what you see.",
      "The snapshot is published as a reference, with the caveat printed on the page: splits and overlays happen periodically, and carriers plus the NANPA administrator hold the authoritative live registry. For everyday needs — filling a form, checking whether an unfamiliar caller ID is plausibly local, understanding a new number after a move — the state-level list is precisely the useful truth. Outside the United States the tool says so plainly instead of stretching the concept, and every result sits one click from the state and ZIP tools for the rest of the address picture.",
    ],
  },
  "what-congressional-district-am-i-in": {
    h2: "Your congressional district, from the source of truth",
    paras: [
      "After every redistricting cycle, 'which district am I in?' becomes a genuinely hard question to answer from memory — county lines, city limits and district boundaries all ignore each other. This tool resolves it the right way: your coordinates go straight to the US Census Bureau's geocoder, which reads the current TIGER boundaries and returns the congressional district containing your point. No bundled copy of the map that can go stale, no guesswork at edges — the federal source answers directly, free and public.",
      "Enter a US address, paste coordinates, or use your phone's location; the district name comes back with the same one-request privacy model as the rest of the platform. Because districts are a US institution, points outside the fifty states and DC produce a clear explanation rather than a fabricated result. It is the civic companion to the county and state tools: the same pin that tells you your municipality can now tell you your representative's district, which is exactly the combination people need when filling forms, registering to vote, or writing to the office that actually serves their street.",
    ],
  },
  "what-school-district-am-i-in": {
    h2: "Which school district governs this address?",
    paras: [
      "School district lines are famously indifferent to the boundaries people actually talk about — they cross cities, ignore ZIP codes and occasionally split a single street. That makes them impossible to infer and easy to get wrong, which matters enormously when a house purchase, a rental or a registration depends on the answer. This tool sends your point to the US Census geocoder and returns whichever school-district geography governs it: unified, elementary or secondary, exactly as the Census publishes them.",
      "Where governance is split, you see both layers instead of a misleading single name; where a unified district covers everything, you see one clean answer. The workflow matches the rest of the location family — search, click or GPS — and the result arrives with the same transparency about its source: Census TIGER boundaries, current vintage, United States only. For families, the tool is a first look, not a final word: individual school assignment follows residence rules inside the district, and the page says so. Pair it with the county and congressional lookups to see the whole stack of lines your address lives inside.",
    ],
  },
  "nearest-airport": {
    h2: "The closest major airports to where you stand",
    paras: [
      "Not every airport is a realistic option: regional fields may lack the route you need, and the 'nearest' airport on a straight map can be the wrong side of a mountain range or a visa regime. This tool answers the practical version of the question by ranking a curated set of the world's major international hubs by great-circle distance from your point, with each result carrying its IATA code, city and a pragmatic ground-transfer estimate.",
      "Set your location by search, click or GPS and the list re-sorts instantly — suddenly the second-nearest hub with a direct rail link looks better than the closest propeller strip, which is exactly the comparison travellers need. Distances show in kilometres and the transfer column is labelled as the heuristic it is (average road speed plus overhead), with the Driving Distance tool one link away for the road-true figure. Because the dataset is curated to hubs people actually connect through, the answer stays useful rather than exhaustive — and it hands off perfectly to the Flight Time Calculator when the next question is how long the air leg will take.",
    ],
  },
  "nearest-hospital": {
    h2: "Hospitals and clinics near any point, live from the map",
    paras: [
      "Knowing where care sits relative to a home, a workplace or a travel plan is quiet preparedness — the kind of thing you want answered before you need it. This tool queries the live OpenStreetMap database for hospitals, clinics and doctors' offices within your chosen radius of any point on Earth, sorts them by straight-line distance, and shows a compass bearing with each so 'nearest' also means 'that way'. Clicking a result pans the map and pins it, turning a list into a mental map of your area's safety net.",
      "The page is honest about its nature: this is geographic awareness, not an emergency service — in an emergency you call official numbers, full stop. Coverage follows what mappers have contributed, so dense cities return rich lists and remote regions thinner ones, and widening the radius usually helps. Nothing about your location is stored; the query leaves your browser, hits the public Overpass API, and returns. It sits in a family of nearest-finders — beaches, peaks, borders, coffee — that together turn the open map into a quick answer engine for the question 'what's around here?'",
    ],
  },
  "nearest-beach": {
    h2: "How far is the sand from here?",
    paras: [
      "Some questions are practical and some are pure morale, and 'where's the nearest beach?' is both. This tool queries OpenStreetMap's mapped beaches within up to 300 km of any point, ranks them by distance with a compass bearing, and pins each one on the map so you can judge the coastline's shape before committing to a drive. Planning a weekend, choosing a base on a trip, or settling a lunchtime argument — the answer arrives in seconds and improves with a wider radius.",
      "Two honest caveats travel with the results: beaches only appear where mappers have drawn them, so coverage varies by region, and a mapped beach is geography, not a promise about swimming safety, tides or access — local signage and lifeguard advice own those calls. Inland points behave sensibly too: the tool simply reaches the coast or tells you the radius needs stretching, and some generous inland maps surface lake beaches as a bonus. Like every tool here it is free, accountless and private, and it chains nicely into the distance calculator when the follow-up question is 'okay, but how long is the drive?'",
    ],
  },
  "nearest-border-crossing": {
    h2: "The nearest way across the line",
    paras: [
      "For road-trippers, truckers and border-town residents, the nearest international crossing is a piece of infrastructure with real personality — opening hours, queues, documents — but its first fact is simply where it is. This tool queries OpenStreetMap for mapped border crossings within your radius of any point, ranked by distance and bearing, each one pinnable on the map. Because crossings are sparse by nature, the radius slider goes generous, up to 300 km, which turns the tool into a regional overview of how your country touches its neighbours.",
      "The page keeps its promises precise: geometry only. Operating hours, wait times and document rules belong to national customs agencies, and the tool says so rather than pretending otherwise. Coverage reflects mapping activity — well-crossed continents like Europe and the Americas return rich results, remote frontiers fewer. Used alongside the What Country Am I In tool and the driving calculator, it completes a small cross-border planning kit: where the line is, where it can be crossed, and how long the road between takes. All of it runs on open data, free and without an account.",
    ],
  },
  "indigenous-territory": {
    h2: "Whose land are you on?",
    paras: [
      "Every coordinate sits inside a deeper geography than the administrative one: the traditional territories of indigenous nations, which predate and outlast the county lines drawn over them. This tool resolves any point against the Native Land Digital Map and returns the territories recorded there, as a respectful starting point for learning, acknowledgement and curiosity. The answer arrives with the framing it deserves — boundaries in this map are living realities and community-sourced knowledge, not survey lines or legal determinations.",
      "Use it to write a more honest event acknowledgement, to teach the layer beneath the atlas, or simply to ask better questions about where you live. Because the source is an educational project, the page points onward to the nations' own resources rather than pretending the tool is the destination. Coverage is strongest where communities and researchers have contributed, and ocean or unmapped points return a clear, gentle nothing instead of a guess. It sits comfortably beside the country and county lookups: three answers to 'where am I?', each true at a different depth of time, and together a fuller portrait of place than any single boundary can give.",
    ],
  },
  "flight-time-calculator": {
    h2: "How long is that flight, really?",
    paras: [
      "Airline schedules hide a lot of plumbing: winds, airways, slot buffers, turnaround politics. Underneath all of it sits a clean physical baseline — the great-circle distance between two airports and the time a jet needs to fly it. This tool computes exactly that for a curated set of the world's major hubs: air distance in kilometres, miles and nautical miles, plus a gate-to-gate estimate built from an 850 km/h cruise and a 45-minute block for taxi, climb and approach, with the method printed beside the number.",
      "Pick JFK to LHR and you get roughly seven hours of still-air truth; pick Tokyo to Sydney and you feel the Pacific. The estimate is labelled as such because real schedules add the jet stream's opinion — eastbound transatlantics run short, westbound long — and airway routing rarely flies the perfect arc. That makes the tool ideal for sanity-checking a quoted schedule, comparing routing options, or satisfying the window-seat curiosity about what the planet's geometry says. It hands off cleanly to the Nearest Airport finder on one side and the nautical distance tools on the other, completing the small aviation corner of the platform.",
    ],
  },
  "isochrone-map": {
    h2: "Fifteen, thirty, forty-five minutes: see all three at once",
    paras: [
      "A single travel-time ring answers one question; three nested rings answer the real one — how reach changes as you spend more minutes. This page presets the isochrone engine to 15/30/45, drawing the genuinely network-derived reachable areas as layered polygons that stretch along fast corridors, pinch at bridges and stop at barriers. The irregularity is the information: a motorway finger at forty-five minutes that doesn't exist at fifteen is a story about your city's skeleton.",
      "These are not circles and not buffers; they come from the Valhalla routing engine tracing actual roads for the mode you choose, which is why a river with one bridge produces a comb and a grid city produces a blob. House hunters use the nesting to price commutes, clinics to picture patient access, restaurants to design delivery menus, and planners to argue about infrastructure with pictures instead of adjectives. Contours can be swapped for other presets, the polygons export as GeoJSON for reports and GIS work, and the shareable URL preserves centre, mode and times — so an isochrone, like every good map here, is a link you can send.",
    ],
  },
  "fuel-cost-calculator": {
    h2: "What will this trip actually cost in fuel?",
    paras: [
      "Distance is geography; the fuel bill is arithmetic on top of it. This tool closes the loop: set two points, fetch the real road distance from the routing engine (or switch to straight-line for a quick bound), then enter what your car and your pump actually report — consumption in L/100 km or MPG, price per litre or gallon — and read fuel burned, one-way cost and round trip. The unit toggle respects which dialect your dashboard speaks, and the conversions underneath are exact.",
      "The honesty notes are part of the result: distance follows the network, consumption follows your foot, and hills, traffic and air conditioning live in the gap between the official figure and your real one — so the page invites you to use your observed consumption, not the brochure's. That single habit turns the output from a guess into a budget. It is the companion piece to the driving distance calculator and the walking-time tool, and together they make the classic comparison — drive, share, or walk — quantifiable in money, minutes and calories. Free, private, and shareable via the URL like everything else here.",
    ],
  },
  "route-optimizer": {
    h2: "The best order for your stops, solved",
    paras: [
      "Humans are surprisingly bad at the travelling-salesman problem, and surprisingly confident about it. Type your stops in any 'logical' order and this tool shows what the routing engine knows: reordering the intermediate stops on the real road network typically shaves 15–30% off the total distance, because intuition underweights cross-town backtracking that the engine prices exactly. Your first stop stays fixed as the origin — the depot, the office, home — and the rest fall into the sequence that minimises driving.",
      "The reordered route draws on the map with the new total, so the saving is visible rather than asserted, and a quick visual scan catches the classic failure mode of bad optimisation (a criss-crossing path) before it costs you a morning. For a dozen stops the engine's heuristic is effectively optimal; the page says plainly that fleet-scale problems belong to dedicated logistics software. It is the analytical heart of the delivery planner and the multi-stop route planner, offered bare: bring your stops, leave with the order. Export happens in the sibling tools, and the shareable URL keeps the solution reproducible for whoever drives tomorrow.",
    ],
  },
  "nautical-mile-converter": {
    h2: "Nautical miles, cables and the metric world",
    paras: [
      "The nautical mile is the rare unit that is both ancient and exact: one minute of latitude, fixed internationally at precisely 1,852 metres, which is why it meshes perfectly with the coordinate grid and why charts, flights and logbooks still speak it. This converter takes any value in nautical miles, kilometres, statute miles, metres, feet or cable lengths and shows all six at once, with copy buttons and the defining facts on the page — including the cable, a tenth of a nautical mile, which survives as the unit sailors use for short ranges.",
      "Because the conversions are exact by definition, the only skill left is choosing the dialect your reader thinks in: knots and nautical miles at sea, statute miles in American prose, kilometres everywhere science happens. The page pairs naturally with the nautical distance calculator, which adds bearings and passage time between real points, and with the bearing tools that complete a marine-style fix. Like all the converters here it runs entirely in your browser — no account, no upload, no waiting — which makes it the kind of quiet utility you keep bookmarked and use far more often than you expected.",
    ],
  },
  "walking-time-calculator": {
    h2: "How long is that walk?",
    paras: [
      "A walk is distance divided by pace, and pace is more personal than people think: relaxed strolls run near 4 km/h, the average adult self-selects about 5, and a purposeful stride with somewhere to be pushes 6.5. Enter a distance in kilometres or miles, set your pace, and this tool returns the duration plus two bonus intuitions — an approximate step count from a standard stride, and a rough energy figure — turning any 'should we walk?' question into a number you can feel.",
      "The page is honest about its simplicity: straight-line distance and flat ground, with hills, crowds and crossings left to your local knowledge, and it points one click onward to the Walking Route Planner when the question needs real footways, crossings and network truth instead of arithmetic. That pairing is the design philosophy in miniature: instant estimate first, network-true figure when it matters. Commuters, dog owners, event planners and anyone weighing the bus against their legs get a ten-second answer that respects both the math and its limits — free, private, and shareable like everything on the platform.",
    ],
  },
  "what3words-converter": {
    h2: "Three-word addresses, handled honestly",
    paras: [
      "what3words has carved a niche in delivery and emergency workflows by giving every 3-metre square a memorable three-word name — and it is also a proprietary system whose API requires a licensed key. MapBench refuses to hide a shared key in the page, so this tool works the respectful way: paste your own what3words API key (it stays in your browser tab) and the official service converts your three-word address to coordinates, or skip the key entirely and use the built-in open alternative.",
      "That alternative is Plus Codes — Open Location Codes — which give any spot on Earth a short, shareable code computed by pure open math: no database, no licence, no expiry. The page encodes and decodes them on the spot, so even without a w3w key you leave with a working short-code for your location. The framing matters as much as the function: proprietary grids and open grids coexist in the real world, and a good tool tells you which is which, what each costs, and where the exits are. Coordinates from either path copy cleanly into every other tool on the platform.",
    ],
  },
  "grid-reference-converter": {
    h2: "Field grids, translated both ways",
    paras: [
      "Grid references are how land navigation talks. MGRS divides the UTM world into lettered squares with digit pairs whose count sets precision — four digits about a kilometre, ten about a metre — while plain UTM speaks zone, easting and northing in metres. This converter accepts either dialect, or decimal coordinates, and returns the whole family at once: MGRS at your chosen precision, UTM with hemisphere, and the decimal pair, all computed locally with the official lettering schemes and zone exceptions.",
      "The map preview is the trust layer, because a single mistyped letter in a grid reference moves you a hundred kilometres and looks perfectly fine in a text field. Seeing the pin land is how operators catch it. The page also teaches its own fine print: precision follows your digit count, the poles hand over to UPS beyond the UTM domain, and provenance matters — so conversions keep the original string one copy away. It completes the coordinate family alongside the DMS, UTM and Plus Code tools: one point, every notation, zero uploads, and a standing invitation to verify with your eyes before you trust with your feet.",
    ],
  },
  "address-validator": {
    h2: "From messy input to a clean, verified address",
    paras: [
      "Real-world addresses arrive damaged: transposed numbers, missing cities, legacy street names, the creative spelling of a hurried typist. This tool runs a quiet professional workflow on any of it — geocode the input as written, reverse-resolve the matched point, and return the canonical components (road, city, county, state, postcode, country) side by side with match checks that flag where your version and the mapped version disagree. The disagreement is the product: it is exactly your error queue, one row at a time.",
      "The page keeps its authority honest: OpenStreetMap is excellent geographic truth, but postal services own mailing validity, and the tool says so instead of overclaiming. Use it to clean a signup form's oddities, standardise a spreadsheet before a mail merge, verify a delivery address against its coordinates, or simply see what the canonical version of your street looks like to a map. Every component copies individually, the matched coordinates come along for downstream tools, and the whole exchange happens without storing your address — validation as a service you can trust precisely because it forgets you instantly.",
    ],
  },
  "reverse-postal-code-lookup": {
    h2: "Coordinates in, postcode out",
    paras: [
      "Sometimes the arrow points the other way: you hold a coordinate — from a photo's metadata, a GPS track, a clicked point on a map — and the form demands the postcode that covers it. This tool is the reverse direction of postal geocoding: paste or click coordinates and it returns the postcode for that point from OpenStreetMap address data, alongside the full structured breakdown so you can verify the answer against road and city before trusting it.",
      "Coverage is honest and labelled: US ZIP codes are densely mapped, much of Europe, Canada and Australia carry postcode data, and rural or unmapped points return a clear gap rather than a fabrication — silence is information too. Because postcodes are delivery-routing systems rather than perfect geography, the page repeats the small print that matters: PO boxes and carrier routes can disagree with map position, and the postal service remains the authority for mail. For everything else — datasets, forms, delivery-zone checks, curiosity — the lookup is instant, free and private, with the coordinate living only in your browser and the shareable URL.",
    ],
  },
  "meeting-time-planner": {
    h2: "When is everyone actually at work?",
    paras: [
      "Distributed teams live inside a geometry problem: five cities, five clocks, one overlapping rectangle of reasonable hours. This tool makes that rectangle visible. Add up to six participants' cities; each resolves to its IANA time zone locally, shows its live clock and UTC offset, and joins a 24-hour grid where every cell is coloured by whether that person sits inside a conventional 09:00–17:00 day. The hours where every row glows are your meeting window, stated in UTC so nobody has to do mental arithmetic at invite time.",
      "The honest details are printed alongside: the 9–17 window is a convention you can override by eye using the grid, daylight-saving transitions move the rectangle more than anyone expects (which is why the clocks are live from the tz database), and some city combinations simply have no overlap — in which case the tool says so plainly and suggests rotating the pain or splitting across days. It is the practical crown of the timezone family: one participant is a lookup, two is a difference, six is a negotiation — and a coloured grid is the only fair way to hold that negotiation.",
    ],
  },
};
