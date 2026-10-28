// Final editorial layer: honest limits & escalation checklists per category.
import type { CategoryId } from "@/lib/registry";

export const LIMITS: Record<CategoryId, { paras: string[]; escalate: string[] }> = {
  location: {
    paras: [
      "Every location stack has a competence boundary, and naming it is part of being trustworthy. OpenStreetMap's administrative coverage is excellent where mappers are active and thinner in rapidly changing or sparsely mapped regions; brand-new developments can lag, and disputed zones follow the community's de-facto consensus rather than arbitrating sovereignty. Postal layers add a second boundary: ZIPs and postcodes are delivery-routing systems, not geography, so PO boxes and carrier routes can legitimately disagree with the map. Indoor positioning adds a third: a browser fix can be a block off, which matters precisely at the borders where people ask these questions.",
      "None of this makes the tools unsafe to use; it makes them safe to use *knowingly*. The design response is transparency: fields stay separate so layers never blur, empty answers are shown as empty rather than guessed, accuracy context travels with GPS results, and every page names its sources. For questions where the cost of being wrong is high — a property line, a legal filing, a medical dispatch — the escalation is always the same: licensed surveys, official registers and emergency services own those answers, and a good free tool points at the door instead of pretending to be it.",
    ],
    escalate: [
      "Legal boundaries and property lines → licensed surveyor / county recorder.",
      "Mailing validity → the postal service's own address tools.",
      "Life-safety dispatch → official emergency services, never a map lookup.",
      "Bulk or production geocoding → your own Nominatim/Photon instance.",
    ],
  },
  distance: {
    paras: [
      "The honest limits here are about category, not quality: great-circle math is near-exact, but it answers 'how far over the surface', not 'how far as driven, flown or walked'. Airline distances follow airways and winds; odometers follow detours; hikers follow switchbacks. Quoting a straight-line number into a fuel budget is the classic misuse, which is why the tools keep the ladder visible — crow-flies, road, time — and label each rung. A second limit is definitional: 'city to city' means mapped centre to mapped centre, and a suburb-to-airport question is a different measurement wearing the same sentence.",
      "Within those bounds the numbers are durable: reproducible from coordinates alone, stable across tools that use the same radius convention, and accurate to a fraction of a percent of geodetic truth. The escalation path is short and rarely needed — ellipsoidal libraries (Karney's algorithms) for survey-grade millimetres, the routing engine for network truth, and the airline's schedule for invoice truth. Knowing which authority owns which number is the entire craft of distance literacy.",
    ],
    escalate: [
      "Survey-grade millimetres → ellipsoidal geodesic libraries, not sphere math.",
      "Fuel and schedule planning → road routing plus your congestion buffer.",
      "Airline invoicing → carrier distance tables (airways ≠ great circles).",
      "Legal boundary lengths → licensed survey, never a clicked polygon.",
    ],
  },
  routing: {
    paras: [
      "Routing's limits live in three places: data vintage, access reality and time modelling. The network is OpenStreetMap's current picture — new interchanges lag, private gates may be missing, seasonal ferries keep their own calendars. Access rules reflect mapped law, not today's roadworks. And durations are free-flow physics: speed limits and road classes without your city's sociology, so peak hours, weather and parking belong in your buffer, not in the engine's promise. The tools label all three limits on every result, because an unlabelled estimate is a trap.",
      "What the stack does brilliantly is the reproducible core: the same stops, mode and engine give the same route to everyone, everywhere, which makes it a superb baseline for comparison, screening and planning. Escalation is domain-specific and well understood — professional dispatch adds live traffic and driver hours; logistics tenders add contracted networks; navigation products add certified maps. A free browser tool that hands you a clean, exportable baseline with its assumptions printed is not competing with those; it is feeding them.",
    ],
    escalate: [
      "Live congestion and ETAs → traffic-aware commercial routing.",
      "Driver-hours and windows → transport-management systems.",
      "Certified navigation → licensed map products with update guarantees.",
      "Accessibility-critical walks → ground truth; curb data is still emerging everywhere.",
    ],
  },
  radius: {
    paras: [
      "Circles and polygons are geometric truths with semantic limits. A radius says nothing about rivers, one-way systems or response times; an area says nothing about what is inside it. The most expensive misuse is treating a geometric catchment as a service promise — which is why the isochrone tools exist as the temporal counterpart, and why the pages cross-link the two insistently. A second limit is resolution: drawn vertices capture the boundary you click, so curved shores want more clicks, and the perimeter grows (correctly) as you add them — the coastline paradox, politely present in every honest measurement tool.",
      "Within geometry, the numbers are exact on the sphere: areas by spherical excess, boundaries by destination math, exports with their parameters embedded. The escalation ladder is short: cadastral precision needs licensed surveys; population-inside-shapes needs census blocks; drive-time promises need the routing engine. Used as the fast, auditable, shareable geometric layer that feeds those heavier instruments, this is exactly the right tool — and it says so.",
    ],
    escalate: [
      "Cadastral/legal area → licensed survey with local datum practice.",
      "Population inside shapes → census blocks, not city-point sums.",
      "Response-time promises → isochrones plus operational buffers.",
      "Ecological boundaries → field-verified polygons, not clicked ones.",
    ],
  },
  coordinates: {
    paras: [
      "Coordinates are lossless in principle and lossy in practice, and every loss is human: swapped axes, wrong hemispheres, datum relics, precision theatre. The converters eliminate the notation problem completely — DMS, UTM, MGRS and Plus Codes are exact translations on WGS84 — but they cannot eliminate the provenance problem: a number without its datum and its source is a rumour. Old NAD27-era documents, hand-typed sheets and seven-decimal CSVs each carry their own failure signature, and the honest tool answers with validation errors and visible pins rather than silent corrections.",
      "The practical boundary is therefore organisational, not mathematical: teams that standardise storage (decimal, WGS84, sane precision) and ritualise the map check enjoy a lossless system; teams that don't accumulate expensive folklore. For work beyond consumer frames — control points, machine guidance, legal description — the escalation is geodetic: licensed surveyors, published transformations and national datums. Everything between a pasted waypoint and that door is exactly where this toolset lives.",
    ],
    escalate: [
      "Datum-critical legacy data → published grid transformations (NTv2/HTDP).",
      "Control points and machine guidance → licensed geodetic survey.",
      "Aviation/marine charts → the chart's own datum and notation, verbatim.",
      "Massive pipelines → scripted validation with rejection, not clipping.",
    ],
  },
  files: {
    paras: [
      "File formats support different combinations of geometry, timestamps, properties and styling. Converting between them can lose information, so keep the original and inspect the output before sharing or using it.",
      "Capabilities differ by workspace: check the accepted format and the operations actually offered on this page. Some tools process files locally but may request map tiles or other services over the network; large or specialised datasets may require dedicated GIS software.",
    ],
    escalate: [
      "Cadastral/legal formats → jurisdictional land-registry exports.",
      "Point clouds and rasters → desktop GIS with proper spatial indexes.",
      "Certified tracks (evidence, insurance) → chain-of-custody originals, untouched.",
      "Enterprise pipelines → scripted parsers with schema validation.",
    ],
  },
  creation: {
    paras: [
      "Custom maps inherit two honest limits: the basemap's and the message's. The basemap is OpenStreetMap's current picture with its ODbL attribution ask, and its gaps — new roads, thin rural detail — travel into every export that includes tiles. The message limit is design's classic one: a map can carry one argument well, and beyond a few dozen symbols the right instrument changes to data-driven mapping with clustering and categories. Both limits are stated where they matter, because the alternative is a beautiful figure that misleads its own author.",
      "Within those bounds the workflow is complete and durable: pins, labels, colours, tight framing, pixel-ratio PNG for the slide, GeoJSON/CSV for the record, URL-state for the living version. Escalation is gentle by design — choropleths and territory shading belong to GIS with real boundaries (the blank-map library and GeoJSON exports feed it), cartographic print production wants vector pipelines, and brand-strict design systems want tokens this tool deliberately doesn't fake.",
    ],
    escalate: [
      "Data-dense maps → CSV-to-map with clustering and category colour.",
      "Boundary shading/choropleth → GIS with census or OSM boundaries.",
      "Print cartography → vector exports into a design pipeline.",
      "Authoritative basemap gaps → local authority open data over OSM tiles.",
    ],
  },
  earth: {
    paras: [
      "Terrain intelligence carries one dominant limit: the model sees bare earth at ~90 m spacing with metres of vertical error, and is blind to canopies, walls and wires. Every downstream answer inherits it — profiles show terrain truth with noisy amplitude, line-of-sight verdicts are pending trees, horizons assume open ground, and solar radiation averages assume an unshaded panel. The second limit is temporal: climate letters and hardiness zones are thirty-year character, not this year's behaviour, and seismicity is a mood, not a hazard model. Each result here is printed with its recipe precisely so these boundaries travel with the number.",
      "The value proposition is screening-grade truth at zero cost: orientation for sites, gardens, antennas, shoots and curiosity, with the upgrade points clearly marked. When money or safety attaches to the answer — tower siting, flood insurance, structural shading, avalanche terrain — the escalation is professional: licensed survey, certified shade studies, regulatory flood determinations and geological hazard services. A good free tool makes that ladder visible instead of pretending to be the top of it.",
    ],
    escalate: [
      "Construction and tower siting → licensed topographic survey.",
      "Flood decisions → regulatory determinations (FEMA/FIRM in the US).",
      "Solar finance → certified shade and production studies.",
      "Seismic safety → national hazard models and building codes.",
    ],
  },
  sun: {
    paras: [
      "Solar arithmetic's limits are small but real: the official zenith encodes average refraction, not today's atmosphere; coordinates are rounded to your input's precision; and terrain is absent unless you add height yourself — a mountain rises the sun late and the formulas won't know. Time adds the political layer: zones and DST are human law, and western edges of big zones (Spain, western China) make solar noon wander hours from clock noon. Every output here therefore carries its convention and both clocks, because an unanchored sunrise time is an argument, not a fact.",
      "Lunar and seasonal outputs carry their own gentle limits: phase from the synodic approximation is hours-precise, which outruns every planning need but not ephemeris science; day length is geometric daylight, not sunshine, and clouds belong to climate's department. Escalation is rare and well-defined — astronomical almanacs and ephemerides for science, terrain-aware apps for mountain photography, and the tz database maintainers whenever a government invents a new DST rule at 48 hours' notice, as they delight in doing.",
    ],
    escalate: [
      "Science-grade ephemerides → astronomical almanacs/JPL horizons.",
      "Mountain sunrise/sunset → terrain-aware horizon adjustments.",
      "Legal daylight definitions → jurisdictional statutes (they vary!).",
      "PV engineering → measured irradiance, not reanalysis averages.",
    ],
  },
  lines: {
    paras: [
      "The lines' limits are philosophical more than technical: they are agreements and astronomy, not fences. The tropics and circles drift with the axial tilt's slow oscillation, so any printed latitude ages; the meridian family exposes datum choice (Greenwich brass vs WGS84 zero, ~100 m apart); and the date line is national choices zig-zagging over geometry. Tools that present these as fixed truths are quietly lying; the honest presentation prints 'current ≈' and dates its tilt.",
      "Practically, the lines are perfect calibration constants and teaching instruments, and they compose beautifully with the daylight and distance tools. There is almost nothing to escalate except expectations: border law, time-zone statute and maritime limits live in treaties and legislation, not in the graticule — and when someone asks whether their terrace is 'in the tropics' for regulatory purposes, the answer belongs to the statute book, with this page as the pleasant way to find the question.",
    ],
    escalate: [
      "Legal time zones → national statute, not meridian geometry.",
      "Maritime limits → UNCLOS and national claims, not the graticule.",
      "Survey-grade line positions → current-epoch tilt values from IERS.",
      "Border law → treaties; the map draws consensus, not verdicts.",
    ],
  },
  population: {
    paras: [
      "Population tools live closest to the honesty line, because numbers about people carry rhetorical weight. The curated snapshot used here is labelled with its vintage and definitions, publishes its ingredients for every sum, and positions itself as a lower-bound screen outside dense cores — but it remains an estimate, and metro-vs-municipal-vs-urban definitions can multiply the 'same' city's figure. Cost and density indices add compression error: one rent-inclusive number cannot hold housing policy, healthcare and taxes without losing texture. Ratios survive that compression far better than absolutes, which is why the comparisons lead with them.",
      "The escalation ladder is the product's pride rather than its shame: census bureaus own authoritative counts and blocks; statistical offices own price indices; research firms own rent-normalised granularity. A transparent estimate that screens in seconds and prints its recipe is the right first move for curiosity, comparison and shortlisting — and it says, plainly, where the money-grade answers live when the decision gets serious.",
    ],
    escalate: [
      "Funding/legal counts → census bureau tables and geographies.",
      "Relocation packages → licensed cost-of-living research.",
      "Site selection → census blocks plus mobility data.",
      "Published citations → primary sources with vintages, not snapshots.",
    ],
  },
  network: {
    paras: [
      "IP geolocation and network lookups have a hard competence boundary: they describe the network attachment, not the person or the precise street. City and region fields are database estimates that degrade under VPN, mobile, CGNAT and anycast. Treating an IP city pin as a GPS fix is the most common misuse.",
      "Within that boundary the tools are useful for triage, localisation and rough audience analysis when the limitations are stated. Escalation for high-stakes identity or location claims is always offline verification, legal process or device-level consent — never an IP database alone.",
    ],
    escalate: [
      "Legal or identity claims → due process and offline verification, not IP databases.",
      "Precise user location → browser GPS with consent, never IP alone.",
      "Abuse at scale → multiple telemetry sources and your own threat intel.",
      "Regulatory geoblocking → licensed geo databases with contractual SLAs.",
    ],
  },
};
