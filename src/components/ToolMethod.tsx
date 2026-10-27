import Link from "next/link";
import type { CategoryId, ToolDef } from "@/lib/registry";

/** Scope notes, not a substitute for an implementation-specific formula. */
const CHECKS: Record<CategoryId, [string, string]> = {
  location: ["Check the selected pin before reading the returned place or boundary label. Address labels, administrative areas and postal geography can disagree.", "For official jurisdiction or mailing decisions, confirm the result with the responsible local authority or postal service."],
  distance: ["Keep the endpoints and measurement mode fixed when comparing results. A surface separation, a compass bearing and a road distance are different outputs.", "A rounded coordinate or a city-centre search changes the endpoints. Do not interpret displayed decimal places as survey accuracy."],
  radius: ["Check the centre, radius or drawn vertices and the selected units. A geometric footprint does not describe which roads or entrances are accessible.", "A radius is not a travel-time guarantee. For parcel boundaries or legal land area, use an authoritative survey."],
  routing: ["Check the stop order, travel mode and whether the result is a network route or a simplified estimate. Repeat the calculation after changing any of these inputs.", "Road access, congestion and closures can change. An estimated duration is not a live arrival-time commitment."],
  coordinates: ["Record the coordinate order, signs, format and datum where specified. In GeoJSON, positions are longitude first; many input forms ask for latitude first.", "A format conversion preserves the source measurement's uncertainty. Extra digits do not improve the original GPS fix."],
  files: ["Inspect the accepted file format and the fields reported by this specific tool. Keep a copy of the original file before converting or editing it.", "File geometry and recorded timestamps can be incomplete. Verify row or point counts and inspect the exported file in your target application."],
  creation: ["Inspect the labels, map extent and export options in the workspace. Test the exported or shared version rather than assuming it matches your current screen.", "Map styling does not verify a location or grant rights to third-party data. Keep attribution with any reused basemap or dataset."],
  earth: ["Check the location, height units and any model options shown by this calculator. A terrain lookup and a geometric Earth model answer different questions.", "Local terrain, atmospheric conditions and source resolution can matter more than numerical rounding. Do not use a planning result for safety-critical work."],
  sun: ["Check the date, location and time zone together. A solar or lunar event is tied to all three, and some events do not occur at high latitudes on a given date.", "A calculated event assumes the model's horizon and atmospheric conventions. Buildings, terrain and local weather can alter what you observe."],
  lines: ["Check the coordinate and the geographic reference line being used. A named latitude or meridian is a reference, not a political boundary.", "Map projection and civil time-zone rules can differ from geometric reference lines. Use the appropriate administrative source for legal questions."],
  population: ["Check whether the result counts dataset points, administrative areas or an estimated population footprint. Record the source vintage when provided.", "Settlement points and area totals do not represent a complete count of residents inside an arbitrary shape. Survey estimates also carry uncertainty."],
  network: ["Check which IP address was queried and whether a proxy, VPN or mobile network is involved. Network registration and device position are not the same thing.", "IP geolocation is approximate and may identify a provider's infrastructure. It cannot establish a person's precise location."],
};

export default function ToolMethod({ tool }: { tool: ToolDef }) {
  const [check, limit] = CHECKS[tool.category];
  return <section id="method-and-limits" aria-labelledby="method-heading" className="mt-8 rounded-2xl border border-line bg-white p-5 sm:p-6">
    <h2 id="method-heading" className="font-display text-2xl font-bold">Method, assumptions &amp; limits</h2>
    <dl className="mt-4 space-y-4 text-sm leading-7 text-mute">
      {tool.method && <div><dt className="font-bold text-ink">This tool’s method</dt><dd>{tool.method}</dd></div>}
      <div><dt className="font-bold text-ink">Before relying on the answer</dt><dd>{check}</dd></div>
      <div><dt className="font-bold text-ink">What the result cannot establish</dt><dd>{limit}</dd></div>
    </dl>
    <p className="mt-4 text-sm leading-7 text-mute">Coverage: {tool.scope}. Search, basemap and external data requests may use third-party services; browser-based does not mean every operation is offline. Read the <Link href="/data-sources" className="font-semibold text-brand-strong hover:underline">source and licence notes</Link>, <Link href="/methodology" className="font-semibold text-brand-strong hover:underline">calculation methodology</Link> and <Link href="/privacy" className="font-semibold text-brand-strong hover:underline">privacy policy</Link>. If a result looks inconsistent, <Link href="/corrections" className="font-semibold text-brand-strong hover:underline">report a correction</Link> with the inputs and mode used.</p>
  </section>;
}
