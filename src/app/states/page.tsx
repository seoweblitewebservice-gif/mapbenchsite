import type { Metadata } from "next";
import Link from "next/link";
import { US_BLANK_MAP_STATES } from "@/data/usBlankMapStates";

export const metadata: Metadata = {
  title: "US States: County Lists, Maps, Census Tools & Geographic Data",
  description: "Browse all 50 US states plus DC with dedicated county lists, printable county maps, Census tools, state lookups, demographic exploration and original MapBench studies.",
  alternates: { canonical: "/states" },
  robots: { index: true, follow: true },
};

export default function StatesPage() {
  const states = US_BLANK_MAP_STATES;
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: "US States, County Lists, Maps & Census Tools",
      url: "https://www.mapbench.site/states",
      description: "Hub for US state county reference pages, printable maps, Census tools and MapBench state research.",
      dateModified: "2026-10-14",
      author: { "@type": "Person", name: "Aryan Khan", url: "https://www.mapbench.site/author/aryan-khan" },
      isPartOf: { "@type": "WebSite", name: "MapBench", url: "https://www.mapbench.site" },
    },
    {
      "@context": "https://schema.org",
      "@type": "ItemList",
      numberOfItems: states.length,
      itemListElement: states.map((state, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: `${state.name} counties and county map`,
        url: `https://www.mapbench.site/states/${state.slug}/counties`,
      })),
    },
  ];

  return (
    <div className="doc mx-auto max-w-6xl">
      <nav aria-label="Breadcrumb" className="mb-4 text-xs text-mute"><Link href="/" className="hover:text-brand-strong">Home</Link> / States</nav>
      <p className="font-sans text-[11px] font-extrabold uppercase tracking-[0.14em] text-brand-strong">United States geography</p>
      <h1 className="mt-2 font-display text-3xl font-bold tracking-tight sm:text-4xl">US States, County Lists, Maps & Census Tools</h1>
      <p className="mt-4 max-w-3xl text-base leading-relaxed text-mute">Use this hub to move between dedicated state county-reference pages, printable county maps, Census-backed lookup tools and original MapBench research. Every state has a clean canonical county-list URL and a separate printable boundary-map URL.</p>

      <section className="mt-8 grid gap-4 md:grid-cols-3" aria-labelledby="state-tools">
        <h2 id="state-tools" className="sr-only">State tools and research</h2>
        <Link href="/tools/what-state-am-i-in" className="card p-5 transition hover:border-brand"><div className="font-display text-lg font-bold">What State Am I In?</div><p className="mt-2 text-sm text-mute">Identify a US state from GPS, an address, coordinates or a map point, with Census context.</p></Link>
        <Link href="/tools/us-county-demographic-explorer" className="card p-5 transition hover:border-brand"><div className="font-display text-lg font-bold">County Demographic Explorer</div><p className="mt-2 text-sm text-mute">Compare county population, income, age, housing, poverty and education within a selected state.</p></Link>
        <Link href="/studies/state-capital-radius" className="card p-5 transition hover:border-brand"><div className="font-display text-lg font-bold">State Capital Geography Study</div><p className="mt-2 text-sm text-mute">Compare how far each state capital sits from the geographic centroid of its state.</p></Link>
      </section>

      <section className="mt-10" aria-labelledby="all-states">
        <div className="flex flex-wrap items-end justify-between gap-3"><div><h2 id="all-states" className="sect-h">All 50 states + District of Columbia</h2><p className="mt-2 max-w-3xl text-sm text-mute">Open the county list for names and FIPS codes, or jump straight to the printable county-equivalent map for that state.</p></div><Link href="/maps" className="font-sans text-sm font-extrabold text-brand-strong hover:underline">Full blank map library →</Link></div>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {states.map((state) => (
            <article key={state.slug} className="rounded-xl border border-line bg-card p-4">
              <div className="font-display text-lg font-bold">{state.name}</div>
              <div className="mt-1 text-xs text-mute">FIPS {state.fips} · {state.divisionLabel}</div>
              <div className="mt-4 flex flex-wrap gap-2">
                <Link href={`/states/${state.slug}/counties`} className="btn btn-sm btn-primary">County list</Link>
                <Link href={`/maps/blank/us/${state.slug}`} className="btn btn-sm btn-ghost">Blank map</Link>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="mt-12 grid gap-4 sm:grid-cols-2" aria-labelledby="state-workflows">
        <h2 id="state-workflows" className="sr-only">State geography workflows</h2>
        <div className="card p-5"><h3 className="font-display text-lg font-bold">Find and compare counties</h3><p className="mt-2 text-sm leading-relaxed text-mute">Use each state&apos;s county-reference page for names and FIPS codes, <Link href="/tools/what-county-am-i-in" className="font-bold text-brand-strong hover:underline">What County Am I In?</Link> for a single point, or the <Link href="/tools/us-county-demographic-explorer" className="font-bold text-brand-strong hover:underline">County Demographic Explorer</Link> for state-wide comparison.</p></div>
        <div className="card p-5"><h3 className="font-display text-lg font-bold">Work with ZIP and population data</h3><p className="mt-2 text-sm leading-relaxed text-mute">Combine <Link href="/tools/what-zip-code-am-i-in" className="font-bold text-brand-strong hover:underline">ZIP lookup</Link>, <Link href="/tools/zip-codes-within-radius" className="font-bold text-brand-strong hover:underline">ZIPs within radius</Link> and <Link href="/tools/population-within-radius" className="font-bold text-brand-strong hover:underline">Population within radius</Link> for Census-based local context.</p></div>
      </section>

      <section className="mt-12 rounded-xl border border-line bg-well/40 p-6"><h2 className="font-display text-2xl font-bold">Sources and interpretation</h2><p className="mt-3">State and county pages use US Census-derived cartographic geometry for visualization. Demographic tools use Census and American Community Survey data where stated. MapBench distinguishes statistical geography from legal or surveying boundaries and documents approximation methods on each tool or study page.</p><p className="mt-4 font-sans text-sm"><Link href="/data-sources" className="font-extrabold text-brand-strong hover:underline">Data sources →</Link><span className="mx-2 text-mute">·</span><Link href="/methodology" className="font-extrabold text-brand-strong hover:underline">Methodology →</Link><span className="mx-2 text-mute">·</span><Link href="/corrections" className="font-extrabold text-brand-strong hover:underline">Corrections →</Link></p></section>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    </div>
  );
}
