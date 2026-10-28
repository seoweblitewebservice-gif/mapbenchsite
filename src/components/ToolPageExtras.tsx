import Link from "next/link";
import RadiusFieldGuide from "./RadiusFieldGuide";
import { distanceKm, fmt } from "@/lib/geo";

const PAIRS = [
  ["New York", { lat: 40.7128, lng: -74.006 }, "London", { lat: 51.5074, lng: -0.1278 }],
  ["Los Angeles", { lat: 34.0522, lng: -118.2437 }, "Tokyo", { lat: 35.6762, lng: 139.6503 }],
  ["Sydney", { lat: -33.8688, lng: 151.2093 }, "Singapore", { lat: 1.3521, lng: 103.8198 }],
  ["Paris", { lat: 48.8566, lng: 2.3522 }, "Dubai", { lat: 25.2048, lng: 55.2708 }],
  ["Delhi", { lat: 28.6139, lng: 77.209 }, "London", { lat: 51.5074, lng: -0.1278 }],
  ["New York", { lat: 40.7128, lng: -74.006 }, "Los Angeles", { lat: 34.0522, lng: -118.2437 }],
] as const;

function DistanceExtras() {
  return (
    <div className="mt-10 space-y-10">
      <section>
        <h2 className="font-display text-2xl font-bold tracking-tight">What people use a two-place distance calculator for</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-line bg-card p-4"><h3 className="font-bold">Flight planning baseline</h3><p className="mt-2 text-sm leading-7 text-mute">Great-circle distance is useful for comparing long-haul routes before looking at airline schedules. Actual flight paths can be longer because of winds, airspace restrictions and routing.</p></div>
          <div className="rounded-xl border border-line bg-card p-4"><h3 className="font-bold">Relocation and family travel</h3><p className="mt-2 text-sm leading-7 text-mute">Straight-line distance gives a stable geographic baseline between two places. For travel time, compare it with the <Link href="/tools/driving-distance-calculator" className="font-semibold text-brand-strong hover:underline">Driving Distance Calculator</Link>.</p></div>
          <div className="rounded-xl border border-line bg-card p-4"><h3 className="font-bold">Service and territory comparison</h3><p className="mt-2 text-sm leading-7 text-mute">Use direct distance to compare branches, customers or facilities consistently. For actual coverage, a <Link href="/tools/drive-time-map" className="font-semibold text-brand-strong hover:underline">Drive Time Map</Link> or <Link href="/tools/map-radius" className="font-semibold text-brand-strong hover:underline">Map Radius Tool</Link> may better match the question.</p></div>
          <div className="rounded-xl border border-line bg-card p-4"><h3 className="font-bold">Navigation and bearing checks</h3><p className="mt-2 text-sm leading-7 text-mute">The result includes the initial compass bearing and geographic midpoint. For more direction detail, use the <Link href="/tools/bearing-calculator" className="font-semibold text-brand-strong hover:underline">Bearing Calculator</Link>.</p></div>
        </div>
      </section>

      <section>
        <h2 className="font-display text-2xl font-bold tracking-tight">Common city-to-city straight-line distances</h2>
        <p className="mt-3 text-sm leading-7 text-mute">These are reproducible MapBench calculations using the same great-circle method as the tool. They are reference values, not road mileage or booked flight distance.</p>
        <div className="mt-4 overflow-x-auto rounded-xl border border-line bg-white">
          <table className="w-full min-w-[620px] text-sm">
            <thead className="bg-well/60 text-left text-[11px] uppercase tracking-wider text-mute"><tr><th className="px-4 py-3">Route</th><th className="px-4 py-3">Miles</th><th className="px-4 py-3">Kilometres</th><th className="px-4 py-3">Nautical miles</th></tr></thead>
            <tbody className="divide-y divide-line">
              {PAIRS.map(([aName, a, bName, b]) => { const km = distanceKm(a, b); return <tr key={`${aName}-${bName}`}><td className="px-4 py-3 font-semibold">{aName} → {bName}</td><td className="px-4 py-3">{fmt(km * 0.621371, 0)}</td><td className="px-4 py-3">{fmt(km, 0)}</td><td className="px-4 py-3">{fmt(km * 0.539957, 0)}</td></tr>; })}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-2xl border border-line bg-well/35 p-5 sm:p-6">
        <h2 className="font-display text-2xl font-bold tracking-tight">How the distance calculation works</h2>
        <p className="mt-3 leading-7 text-mute">MapBench calculates the central angle between the two WGS84 latitude/longitude inputs and converts that angle to surface distance using a mean Earth radius of 6,371.0088 km. This is a spherical great-circle calculation: fast, transparent and appropriate for everyday worldwide distance comparisons.</p>
        <p className="mt-3 leading-7 text-mute">It is not the same as a full ellipsoidal geodesic solver, and it is not a road-network measurement. For most everyday comparisons the difference from an ellipsoidal geodesic is small, but specialist surveying, engineering or legal work should use dedicated geodesic software and authoritative coordinates.</p>
        <p className="mt-3 text-sm text-mute">Useful next steps: <Link href="/tools/crow-flies-distance" className="font-semibold text-brand-strong hover:underline">crow-flies comparison</Link>, <Link href="/tools/halfway-between-two-places" className="font-semibold text-brand-strong hover:underline">halfway point</Link>, <Link href="/tools/distance-matrix-calculator" className="font-semibold text-brand-strong hover:underline">distance matrix</Link>, and <Link href="/guides/how-distance-calculation-works" className="font-semibold text-brand-strong hover:underline">distance calculation guide</Link>.</p>
      </section>
    </div>
  );
}

function MagneticExtras() {
  return (
    <div className="mt-10 space-y-10">
      <section>
        <h2 className="font-display text-2xl font-bold tracking-tight">What magnetic declination actually tells you</h2>
        <p className="mt-3 leading-7 text-mute">A compass points toward magnetic north, while maps and geographic bearings are usually referenced to true north. The angle between those two directions is magnetic declination, sometimes called magnetic variation. It is not a fixed number for a country or even for one city. The value depends on latitude, longitude, altitude and date because Earth&apos;s magnetic field changes both across space and through time.</p>
        <p className="mt-3 leading-7 text-mute">That distinction matters when you compare a map bearing with a physical compass. If the model reports an easterly declination, magnetic north lies east of true north; a westerly value puts it to the west. MapBench keeps the sign convention visible and includes a direct true-to-magnetic bearing converter so you do not have to remember the arithmetic while working in the field.</p>
      </section>
      <section>
        <h2 className="font-display text-2xl font-bold tracking-tight">Why the date is part of the input</h2>
        <p className="mt-3 leading-7 text-mute">Earth&apos;s core generates a magnetic field that evolves over time. A declination value copied from an old paper map can therefore be wrong today even when the coordinates are unchanged. The World Magnetic Model is periodically updated so navigation systems can estimate that changing field. This page uses the 2025 epoch model and deliberately limits the date picker to the model&apos;s intended 2025–2030 window rather than pretending a five-year model stays valid indefinitely.</p>
        <p className="mt-3 leading-7 text-mute">The page also exposes inclination, or magnetic dip, and field intensity where the upstream model provides them. Those values help explain why the magnetic field is a three-dimensional vector rather than a simple horizontal arrow. For an everyday compass correction, declination is the key result; the additional field values are useful context for technical users.</p>
      </section>
      <section className="rounded-2xl border border-line bg-well/35 p-5 sm:p-6">
        <h2 className="font-display text-2xl font-bold tracking-tight">Data source and calculation path</h2>
        <p className="mt-3 leading-7 text-mute">MapBench does not invent a local magnetic correction from longitude or a rough regional table. The selected coordinates, altitude and date are sent through a MapBench server route to the British Geological Survey World Magnetic Model web service. The returned model fields are then displayed in the tool. This keeps the model source separate from the user interface and makes the method auditable.</p>
        <p className="mt-3 leading-7 text-mute">A model result is still not the same thing as a physical compass observation. Nearby steel, reinforced concrete, vehicles, power equipment, phones, speakers and local crustal anomalies can disturb a real instrument. For safety-critical marine, aviation or surveying work, follow the relevant professional navigation standard and current official notices rather than relying on a browser calculator alone.</p>
        <p className="mt-3 text-sm text-mute">Related MapBench tools: <Link href="/tools/bearing-calculator" className="font-semibold text-brand-strong hover:underline">Bearing Calculator</Link>, <Link href="/tools/latitude-longitude-finder" className="font-semibold text-brand-strong hover:underline">Latitude &amp; Longitude Finder</Link>, and <Link href="/tools/find-my-location" className="font-semibold text-brand-strong hover:underline">Find My Location</Link>.</p>
      </section>
    </div>
  );
}

function MoonRiseSetExtras() {
  return (
    <div className="mt-10 space-y-10">
      <section>
        <h2 className="font-display text-2xl font-bold tracking-tight">Moonrise is a location problem, not just a Moon-phase problem</h2>
        <p className="mt-3 leading-7 text-mute">The Moon&apos;s phase is nearly the same for everyone on Earth at a given instant, but the time it rises and sets depends strongly on where you are. Two observers in different countries can see the same phase while having very different moonrise, moonset and sky-position times. That is why this calculator starts with an actual geographic point and resolves the point to an IANA time zone before formatting event times.</p>
        <p className="mt-3 leading-7 text-mute">For photographers, hikers, anglers and casual observers, rise and set times answer a practical question: when is the Moon likely to be above the local astronomical horizon? Upper transit adds another useful reference—the part of the day when the calculated lunar altitude is highest for the selected location.</p>
      </section>
      <section>
        <h2 className="font-display text-2xl font-bold tracking-tight">How MapBench estimates the events</h2>
        <p className="mt-3 leading-7 text-mute">The tool calculates an approximate geocentric position for the Moon from a compact lunar theory, then evaluates the Moon&apos;s apparent altitude above the horizon throughout the selected day. MapBench samples that altitude at five-minute intervals. A crossing from below 0° to above 0° is treated as moonrise; the opposite crossing is moonset. The highest sampled altitude is used as an estimate of upper transit.</p>
        <p className="mt-3 leading-7 text-mute">This approach is transparent and suitable for everyday planning, but it is intentionally described as an estimate. Professional astronomical ephemerides use more terms, topocentric parallax corrections, refraction models and finer numerical event solving. Local terrain also matters: a ridge or building can delay the moment the Moon becomes visible even when the geometric horizon event has already occurred.</p>
      </section>
      <section className="rounded-2xl border border-line bg-well/35 p-5 sm:p-6">
        <h2 className="font-display text-2xl font-bold tracking-tight">Why a day can have no moonrise or no moonset</h2>
        <p className="mt-3 leading-7 text-mute">A missing event is not necessarily a calculation failure. The Moon&apos;s orbit is tilted to the ecliptic, and its declination changes substantially through the month. At higher latitudes the Moon can stay above the horizon through an entire calendar day or remain below it for the full day. In those cases the correct planning answer can genuinely be “no rise” or “no set” within that date window.</p>
      </section>
    </div>
  );
}

function CensusCountyExtras() {
  return (
    <div className="mt-10 space-y-10">
      <section>
        <h2 className="font-display text-2xl font-bold tracking-tight">Why county lookup needs a boundary, not just an address label</h2>
        <p className="mt-3 leading-7 text-mute">A geocoder can tell you the county name attached to an address record, but that is not the same as checking the exact selected coordinate against the county polygon. Near county borders, in rural areas and around unincorporated communities, the point itself matters. MapBench therefore uses the location as a geometric query against the U.S. Census Bureau county layer and returns the official five-digit FIPS code with the highlighted county boundary.</p>
        <p className="mt-3 leading-7 text-mute">This is useful for local-market research, public-record searches, property due diligence, territory planning, court or government forms and checking whether a customer or facility really falls on one side of a county line. It also gives you a stable identifier—the FIPS code—that can be joined to other Census and government datasets without relying on county-name spelling.</p>
      </section>
      <section>
        <h2 className="font-display text-2xl font-bold tracking-tight">What the demographic cards mean</h2>
        <p className="mt-3 leading-7 text-mute">Population, income, age, home value, poverty and education figures come from American Community Survey multi-year estimates. They provide useful context about the matched county, but they are not live counts and they carry sampling uncertainty. A local administrative source, a decennial Census table or a specialized commercial dataset may use a different date, universe or definition.</p>
        <p className="mt-3 leading-7 text-mute">MapBench keeps the boundary source and demographic source visible because the two parts solve different problems: TIGERweb answers “which county contains this point?”, while ACS answers “what is the recent statistical profile of that county?” Combining them is useful, but only when that distinction remains clear.</p>
      </section>
      <section className="rounded-2xl border border-line bg-well/35 p-5 sm:p-6">
        <h2 className="font-display text-2xl font-bold tracking-tight">Use the right geography for the question</h2>
        <p className="mt-3 leading-7 text-mute">County, state and ZIP-style geography are not interchangeable. Use <Link href="/tools/what-state-am-i-in" className="font-semibold text-brand-strong hover:underline">What State Am I In?</Link> for state-level context and <Link href="/tools/what-zip-code-am-i-in" className="font-semibold text-brand-strong hover:underline">What ZIP Code Am I In?</Link> when postal/ZCTA context is the real question. For a searched street address rather than your current position, the dedicated <Link href="/tools/address-to-county-lookup" className="font-semibold text-brand-strong hover:underline">Address to County Lookup</Link> runs the same Census boundary engine.</p>
      </section>
    </div>
  );
}

function CensusStateExtras() {
  return (
    <div className="mt-10 space-y-10">
      <section>
        <h2 className="font-display text-2xl font-bold tracking-tight">A state result is more useful when you can verify the boundary</h2>
        <p className="mt-3 leading-7 text-mute">For most addresses, a state name looks obvious. The harder cases are coordinates, border areas, remote land, imported datasets and locations selected directly from a map. MapBench checks the chosen point against the Census Bureau state polygon, highlights the matched state and returns the two-digit state FIPS code. That gives the answer a geographic and machine-readable basis instead of relying only on a text label supplied by a search service.</p>
        <p className="mt-3 leading-7 text-mute">State FIPS is especially useful when you need to join the location to Census tables, government datasets, sales territories or other structured data. A state abbreviation such as CA or TX is familiar to people; the FIPS code is the stable numeric identifier used by many U.S. statistical systems.</p>
      </section>
      <section>
        <h2 className="font-display text-2xl font-bold tracking-tight">What MapBench adds beyond the state name</h2>
        <p className="mt-3 leading-7 text-mute">The result includes recent ACS context such as population, median household income, median age, median home value, poverty, education and population density. Those values make the page useful for first-pass market research and location comparison, but they should be read as survey estimates rather than live administrative counts. MapBench labels the source and avoids presenting ACS estimates as exact current totals.</p>
        <p className="mt-3 leading-7 text-mute">The map is also part of the result. If an imported coordinate was accidentally swapped, mistyped or shifted into another state, a large highlighted polygon makes that error easier to catch than a single text answer would.</p>
      </section>
      <section className="rounded-2xl border border-line bg-well/35 p-5 sm:p-6">
        <h2 className="font-display text-2xl font-bold tracking-tight">State, county and ZIP answer different questions</h2>
        <p className="mt-3 leading-7 text-mute">For local jurisdiction, continue to <Link href="/tools/what-county-am-i-in" className="font-semibold text-brand-strong hover:underline">What County Am I In?</Link>. For postal and Census ZIP geography, use <Link href="/tools/what-zip-code-am-i-in" className="font-semibold text-brand-strong hover:underline">What ZIP Code Am I In?</Link>. If you are starting with a street address, <Link href="/tools/address-to-state-lookup" className="font-semibold text-brand-strong hover:underline">Address to State Lookup</Link> is the more direct entry point.</p>
      </section>
    </div>
  );
}

function CensusZipExtras() {
  return (
    <div className="mt-10 space-y-10">
      <section>
        <h2 className="font-display text-2xl font-bold tracking-tight">ZIP Code and ZCTA are related, but they are not the same thing</h2>
        <p className="mt-3 leading-7 text-mute">USPS ZIP Codes are designed to route mail. They can represent delivery routes, groups of addresses, PO boxes and special-purpose destinations, and they are not maintained as one clean nationwide set of legal polygons. The Census Bureau created ZIP Code Tabulation Areas—ZCTAs—to approximate ZIP geography so population and housing data can be summarized spatially.</p>
        <p className="mt-3 leading-7 text-mute">That difference is easy for mapping sites to hide. MapBench does the opposite: when address data provides a postcode, the tool shows that label separately from the Census ZCTA containing the selected coordinate. If the values differ, the page calls it out instead of silently choosing one and presenting it as universal truth.</p>
      </section>
      <section>
        <h2 className="font-display text-2xl font-bold tracking-tight">Which value should you use?</h2>
        <p className="mt-3 leading-7 text-mute">For mailing, delivery eligibility or an official address correction, use USPS or the organization responsible for the address. For population, income, housing, age, education and other Census-style analysis, the ZCTA is the relevant statistical geography. The highlighted polygon on MapBench is explicitly a Census ZCTA boundary, not an official USPS delivery boundary.</p>
        <p className="mt-3 leading-7 text-mute">This distinction matters for direct-mail planning, territory analysis and local SEO research. A ZCTA is useful for comparing geographic markets, but it should not be used to promise that every address inside the polygon accepts the same mailing ZIP or that every address carrying a ZIP lies inside one simple polygon.</p>
      </section>
      <section>
        <h2 className="font-display text-2xl font-bold tracking-tight">What the Census context adds</h2>
        <p className="mt-3 leading-7 text-mute">Once the ZCTA is identified, MapBench joins it to recent ACS estimates for population, household income, age, home value, education, poverty and housing context. This turns a five-digit code into something useful for exploratory market analysis without pretending the figures are live counts. The source note remains visible next to the result so you can tell exactly what geography and vintage are being used.</p>
      </section>
      <section className="rounded-2xl border border-line bg-well/35 p-5 sm:p-6">
        <h2 className="font-display text-2xl font-bold tracking-tight">Related location checks</h2>
        <p className="mt-3 leading-7 text-mute">For many nearby postal areas at once, use <Link href="/tools/zip-codes-within-radius" className="font-semibold text-brand-strong hover:underline">ZIP Codes Within Radius</Link>. For the containing county or state, use <Link href="/tools/what-county-am-i-in" className="font-semibold text-brand-strong hover:underline">What County Am I In?</Link> or <Link href="/tools/what-state-am-i-in" className="font-semibold text-brand-strong hover:underline">What State Am I In?</Link>. If you begin with a street address, <Link href="/tools/address-to-zip-code-lookup" className="font-semibold text-brand-strong hover:underline">Address to ZIP Code Lookup</Link> leads directly into the same postcode-versus-ZCTA workflow.</p>
      </section>
    </div>
  );
}

export default function ToolPageExtras({ slug }: { slug: string }) {
  if (slug === "map-radius") return <RadiusFieldGuide />;
  if (slug === "distance-between-two-places") return <DistanceExtras />;
  if (slug === "magnetic-declination") return <MagneticExtras />;
  if (slug === "moonrise-moonset") return <MoonRiseSetExtras />;
  if (slug === "what-county-am-i-in" || slug === "address-to-county-lookup") return <CensusCountyExtras />;
  if (slug === "what-state-am-i-in" || slug === "address-to-state-lookup") return <CensusStateExtras />;
  if (slug === "what-zip-code-am-i-in" || slug === "address-to-zip-code-lookup") return <CensusZipExtras />;
  return null;
}
