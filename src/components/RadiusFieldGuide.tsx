import Link from "next/link";

const EXAMPLES = [
  { title: "Compare delivery coverage", radius: 3, text: "Imagine a bakery choosing between a 3-mile and a 6-mile delivery zone. Doubling the radius quadruples the geometric area; it does not simply double the workload. Check actual routes before advertising delivery times.", next: "drive-time-map", label: "Compare road-network reach" },
  { title: "Shortlist places near an office", radius: 8, text: "For a hypothetical office search, an 8-mile circle makes a useful first cut. A property inside the circle may still involve a long commute because of a river crossing, indirect roads or congestion. Use a route calculation for the final shortlist.", next: "driving-distance-calculator", label: "Estimate a route" },
  { title: "Plan an event search area", radius: 2, text: "A 2-mile buffer around a venue can help you start looking for accommodation or meeting places. The circle describes distance only: it does not confirm pedestrian access, opening hours, availability or a safe walking route.", next: "distance-between-two-places", label: "Check two locations" },
  { title: "Compare service territories", radius: 15, text: "Place a 15-mile circle around a proposed service base to compare its geometric footprint with another location. Overlapping circles are not separate markets, and adding their areas would count the overlap twice.", next: "multi-radius-map", label: "Compare multiple circles" },
];

export default function RadiusFieldGuide() {
  return <div className="radius-field-guide mt-12 space-y-12">
    <section aria-labelledby="radius-scenarios">
      <p className="text-xs font-bold uppercase tracking-widest text-brand-strong">From a circle to a decision</p>
      <h2 id="radius-scenarios" className="mt-2 text-2xl font-bold">Four practical radius-map examples</h2>
      <p className="mt-3 leading-7 text-mute">These illustrative scenarios use simple circle geometry. They are not measured customer counts, actual service territories or travel-time guarantees.</p>
      <div className="mt-5 divide-y divide-line">{EXAMPLES.map((example, i) => <article key={example.title} className="py-6">
        <h3 className="text-lg font-bold">{i + 1}. {example.title}</h3>
        <p className="mt-3 leading-7 text-mute">{example.text}</p>
        <div className="mt-4 rounded-lg border-l-4 border-brand bg-well p-4"><p className="text-xs font-bold uppercase tracking-wider text-brand-strong">Worked example</p><p className="mt-2 text-sm leading-7">A {example.radius}-mile radius has a {example.radius * 2}-mile diameter. Using πr², its approximate area is <strong>{(Math.PI * example.radius ** 2).toFixed(1)} square miles</strong>. This flat-circle approximation is useful for these small-radius comparisons, not a substitute for the map’s geographic calculation.</p></div>
        <Link href={`/tools/${example.next}`} className="mt-4 inline-block text-sm font-semibold text-brand-strong hover:underline">{example.label} →</Link>
      </article>)}</div>
    </section>
    <section aria-labelledby="radius-comparison"><h2 id="radius-comparison" className="text-2xl font-bold">Radius, route or drive-time map?</h2><p className="mt-3 leading-7 text-mute">Choose the measurement that matches your question. Equal distance does not mean equal accessibility.</p>
      <div className="mt-5 overflow-x-auto rounded-lg border border-line"><table className="w-full min-w-[520px] text-left text-sm"><caption className="sr-only">Choosing a geographic measurement</caption><thead className="bg-well"><tr><th scope="col" className="p-4">Your question</th><th scope="col" className="p-4">Use</th><th scope="col" className="p-4">Important limit</th></tr></thead><tbody className="divide-y divide-line">
        <tr><td className="p-4">What is within 10 miles?</td><td className="p-4">Radius circle</td><td className="p-4">No roads or traffic considered</td></tr>
        <tr><td className="p-4">How far is the drive?</td><td className="p-4"><Link className="text-brand-strong underline" href="/tools/driving-distance-calculator">Route distance</Link></td><td className="p-4">Depends on routing data and mode</td></tr>
        <tr><td className="p-4">What can I reach in 30 minutes?</td><td className="p-4"><Link className="text-brand-strong underline" href="/tools/drive-time-map">Drive-time area</Link></td><td className="p-4">Estimated travel time, not a promise</td></tr>
      </tbody></table></div>
    </section>
    <aside className="rounded-lg border border-line bg-well p-5"><h2 className="text-lg font-bold">Before sharing your map</h2><ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-7 text-mute"><li>Verify the centre pin and whether the input uses miles or kilometres.</li><li>Label the value as a radius, not a diameter or driving distance.</li><li>Do not treat a circle as an official boundary, hazard zone or permission to enter an area.</li><li>Check the <Link href="/methodology" className="text-brand-strong underline">methodology</Link> before using results in a report.</li></ul></aside>
  </div>;
}
