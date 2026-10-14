import type { Metadata } from "next";
import Link from "next/link";
import { feature } from "topojson-client";
import { geoCentroid } from "d3-geo";
import statesTopo from "us-atlas/states-10m.json";
import { distanceKm } from "@/lib/geo";
import { US_STATE_CAPITALS } from "@/data/usStateCapitals";
import { US_BLANK_MAP_STATES } from "@/data/usBlankMapStates";

export const metadata: Metadata = {
  title: "How Far Is Each State Capital From Its State Center?",
  description: "Original MapBench study ranking all 50 US state capitals by great-circle distance from the geographic centroid of their state, with method, source notes and state-map links.",
  alternates: { canonical: "/studies/state-capital-radius" },
  robots: { index: true, follow: true },
};

type StateFeature = GeoJSON.Feature<GeoJSON.Geometry, { name?: string }>;

const stateCollection = feature(statesTopo as any, (statesTopo as any).objects.states) as unknown as GeoJSON.FeatureCollection<GeoJSON.Geometry, { name?: string }>;
const stateByName = new Map((stateCollection.features as StateFeature[]).filter((f) => f.properties?.name).map((f) => [f.properties!.name!, f]));
const slugByName = new Map(US_BLANK_MAP_STATES.map((s) => [s.name, s.slug]));

const rows = US_STATE_CAPITALS.map((capital) => {
  const state = stateByName.get(capital.state);
  if (!state) return null;
  const [lng, lat] = geoCentroid(state as any);
  const km = distanceKm({ lat: capital.lat, lng: capital.lng }, { lat, lng });
  return { ...capital, centroidLat: lat, centroidLng: lng, km, slug: slugByName.get(capital.state) ?? "" };
}).filter((row): row is NonNullable<typeof row> => Boolean(row)).sort((a, b) => b.km - a.km);

const averageKm = rows.reduce((sum, row) => sum + row.km, 0) / Math.max(rows.length, 1);
const medianKm = rows.length ? [...rows].sort((a, b) => a.km - b.km)[Math.floor(rows.length / 2)].km : 0;

export default function StateCapitalRadiusStudy() {
  return (
    <div className="doc mx-auto max-w-6xl">
      <nav aria-label="Breadcrumb" className="mb-4 text-xs text-mute"><Link href="/" className="hover:text-brand-strong">Home</Link> / <Link href="/studies" className="hover:text-brand-strong">Studies</Link> / State capital geography</nav>
      <p className="font-sans text-[11px] font-extrabold uppercase tracking-[0.14em] text-brand-strong">Original MapBench study · 14 Oct 2026</p>
      <h1 className="mt-2 max-w-4xl font-display text-3xl font-bold tracking-tight sm:text-4xl">How Far Is Each US State Capital From the Geographic Center of Its State?</h1>
      <p className="mt-4 max-w-4xl text-base leading-relaxed text-mute">For each of the 50 states, MapBench calculates the geographic centroid of the Census-derived state geometry, then measures the great-circle distance from that centroid to the state-capital coordinates. This is a geometric comparison, not a claim about population balance, driving distance or political representation.</p>

      <section className="mt-8 grid gap-4 sm:grid-cols-3">
        <div className="card p-5"><div className="text-xs font-extrabold uppercase text-mute">States compared</div><div className="mt-1 font-display text-3xl font-bold">{rows.length}</div></div>
        <div className="card p-5"><div className="text-xs font-extrabold uppercase text-mute">Average separation</div><div className="mt-1 font-display text-3xl font-bold">{Math.round(averageKm)} km</div></div>
        <div className="card p-5"><div className="text-xs font-extrabold uppercase text-mute">Median separation</div><div className="mt-1 font-display text-3xl font-bold">{Math.round(medianKm)} km</div></div>
      </section>

      <section className="mt-10" aria-labelledby="ranking">
        <h2 id="ranking" className="sect-h">Ranking: capital-to-state-centroid distance</h2>
        <p className="mt-3 max-w-4xl text-sm leading-relaxed text-mute">Longer distances indicate that the capital is farther from the centroid of the generalized state polygon. Coastal shape, islands, panhandles and irregular boundaries can move a polygon centroid substantially, so the ranking should be read as a geometry study rather than a measure of accessibility.</p>
        <div className="mt-5 overflow-x-auto rounded-xl border border-line bg-card">
          <table className="tbl min-w-[760px]">
            <thead><tr><th>Rank</th><th>State</th><th>Capital</th><th className="text-right">Distance</th><th className="text-right">Capital coordinates</th></tr></thead>
            <tbody>{rows.map((row, index) => <tr key={row.state}><td>{index + 1}</td><td>{row.slug ? <Link href={`/maps/blank/us/${row.slug}`} className="font-bold text-brand-strong hover:underline">{row.state}</Link> : row.state}</td><td>{row.city}</td><td className="text-right font-semibold">{Math.round(row.km)} km</td><td className="whitespace-nowrap text-right text-xs text-mute">{row.lat.toFixed(3)}°, {row.lng.toFixed(3)}°</td></tr>)}</tbody>
          </table>
        </div>
      </section>

      <section className="mt-12 grid gap-5 lg:grid-cols-2">
        <div className="card p-6"><h2 className="font-display text-2xl font-bold">How the calculation works</h2><ol className="mt-4 list-decimal space-y-2 pl-6 text-sm leading-relaxed"><li>Load the generalized Census-derived geometry for each state.</li><li>Calculate the geographic centroid of that polygon geometry.</li><li>Use the published capital coordinate for the corresponding state.</li><li>Measure great-circle distance between the capital and centroid with the same geographic distance method used by MapBench distance tools.</li><li>Sort the 50 states from greatest separation to smallest.</li></ol></div>
        <div className="card p-6"><h2 className="font-display text-2xl font-bold">What this study does not measure</h2><ul className="mt-4 list-disc space-y-2 pl-6 text-sm leading-relaxed"><li>It does not measure driving distance or travel time.</li><li>It does not use population-weighted centers.</li><li>It does not decide whether a capital is well located for residents.</li><li>It does not use legal survey-grade state boundaries.</li><li>State polygon centroids can fall in unintuitive places for irregular or multipart geometry.</li></ul></div>
      </section>

      <section className="mt-12 rounded-xl border border-line bg-well/40 p-6"><h2 className="font-display text-2xl font-bold">Reproduce or explore the result</h2><p className="mt-3">Use the <Link href="/tools/map-radius" className="font-bold text-brand-strong hover:underline">Map Radius Tool</Link> to draw a geographic radius around any capital, the <Link href="/tools/distance-between-two-places" className="font-bold text-brand-strong hover:underline">Distance Between Two Places</Link> tool to compare coordinates, or browse the <Link href="/states" className="font-bold text-brand-strong hover:underline">US States hub</Link> for state maps and Census tools.</p><p className="mt-4 font-sans text-sm"><Link href="/methodology" className="font-extrabold text-brand-strong hover:underline">Methodology →</Link><span className="mx-2 text-mute">·</span><Link href="/data-sources" className="font-extrabold text-brand-strong hover:underline">Data sources →</Link><span className="mx-2 text-mute">·</span><Link href="/corrections" className="font-extrabold text-brand-strong hover:underline">Corrections →</Link></p></section>

      <section className="mt-12 border-t border-line pt-10"><h2 className="sect-h">Source note</h2><p className="mt-3 max-w-4xl">State geometry comes from the Census-derived <code>us-atlas</code> state dataset already used by MapBench blank maps. Capital coordinates are stored as a public reference dataset in MapBench from the Vega project&apos;s US state-capitals data. The ranking is calculated by MapBench from those inputs; no competitor ranking or percentages are copied.</p></section>
    </div>
  );
}
