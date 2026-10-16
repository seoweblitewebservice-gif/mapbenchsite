import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { feature } from "topojson-client";
import countiesTopo from "us-atlas/counties-10m.json";
import { US_BLANK_MAP_STATES, US_BLANK_MAP_STATE_BY_SLUG } from "@/data/usBlankMapStates";
import { US_STATE_CAPITALS } from "@/data/usStateCapitals";

type CountyFeature = GeoJSON.Feature<GeoJSON.Geometry, { name?: string }> & { id?: string | number };

const countyCollection = feature(
  countiesTopo as any,
  (countiesTopo as any).objects.counties,
) as unknown as GeoJSON.FeatureCollection<GeoJSON.Geometry, { name?: string }>;

const counties = countyCollection.features as CountyFeature[];
const capitalByState = new Map(US_STATE_CAPITALS.map((item) => [item.state, item.city]));

function countyId(feature: CountyFeature) {
  return String(feature.id ?? "").padStart(5, "0");
}

function countiesForState(fips: string) {
  return counties
    .filter((county) => countyId(county).startsWith(fips) && county.properties?.name)
    .map((county) => ({ id: countyId(county), name: county.properties!.name! }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function generateStaticParams() {
  return US_BLANK_MAP_STATES.map((state) => ({ state: state.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ state: string }> }): Promise<Metadata> {
  const { state: slug } = await params;
  const state = US_BLANK_MAP_STATE_BY_SLUG.get(slug);
  if (!state) return {};
  const list = countiesForState(state.fips);
  const unit = state.name === "Louisiana" ? "Parishes" : state.name === "Alaska" ? "Boroughs & Census Areas" : state.name === "District of Columbia" ? "County-Equivalent" : "Counties";
  const title = `${state.name} ${unit}: Complete List & County Map`;
  const description = `Browse all ${list.length} ${state.divisionLabel} in ${state.name}, with Census FIPS codes, a printable county map, state geography tools and related Census resources.`;
  return {
    title,
    description,
    alternates: { canonical: `/states/${state.slug}/counties` },
    robots: { index: true, follow: true },
    openGraph: {
      type: "website",
      title: `${title} | MapBench`,
      description,
      url: `https://www.mapbench.site/states/${state.slug}/counties`,
    },
  };
}

export default async function StateCountiesPage({ params }: { params: Promise<{ state: string }> }) {
  const { state: slug } = await params;
  const state = US_BLANK_MAP_STATE_BY_SLUG.get(slug);
  if (!state) notFound();

  const list = countiesForState(state.fips);
  const capital = capitalByState.get(state.name) ?? "—";
  const index = US_BLANK_MAP_STATES.findIndex((item) => item.slug === state.slug);
  const related = [
    US_BLANK_MAP_STATES[(index + US_BLANK_MAP_STATES.length - 1) % US_BLANK_MAP_STATES.length],
    US_BLANK_MAP_STATES[(index + 1) % US_BLANK_MAP_STATES.length],
    US_BLANK_MAP_STATES[(index + 9) % US_BLANK_MAP_STATES.length],
    US_BLANK_MAP_STATES[(index + 21) % US_BLANK_MAP_STATES.length],
  ].filter((item, i, arr) => item.slug !== state.slug && arr.findIndex((x) => x.slug === item.slug) === i);

  const unitLower = state.name === "Louisiana" ? "parishes" : state.name === "Alaska" ? "boroughs and census areas" : state.name === "District of Columbia" ? "county-equivalent" : "counties";
  const unitTitle = state.name === "Louisiana" ? "Parishes" : state.name === "Alaska" ? "Boroughs & Census Areas" : state.name === "District of Columbia" ? "County-Equivalent" : "Counties";

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: `${state.name} ${unitTitle}`,
      url: `https://www.mapbench.site/states/${state.slug}/counties`,
      description: `Complete Census-derived list of ${state.name} ${unitLower} with FIPS codes and related map resources.`,
      dateModified: "2026-10-14",
      author: { "@type": "Person", name: "Aryan Khan", url: "https://www.mapbench.site/author/aryan-khan" },
      isPartOf: { "@type": "WebSite", name: "MapBench", url: "https://www.mapbench.site" },
    },
    {
      "@context": "https://schema.org",
      "@type": "ItemList",
      name: `${state.name} ${unitTitle}`,
      numberOfItems: list.length,
      itemListElement: list.map((county, i) => ({
        "@type": "ListItem",
        position: i + 1,
        name: county.name,
        description: `Census county-equivalent FIPS ${county.id}`,
      })),
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "MapBench", item: "https://www.mapbench.site" },
        { "@type": "ListItem", position: 2, name: "US States", item: "https://www.mapbench.site/states" },
        { "@type": "ListItem", position: 3, name: `${state.name} ${unitTitle}` },
      ],
    },
  ];

  return (
    <div className="doc mx-auto max-w-6xl py-8">
      <nav aria-label="Breadcrumb" className="mb-5 text-xs text-mute"><Link href="/">Home</Link> / <Link href="/states">US States</Link> / <span>{state.name} {unitTitle}</span></nav>

      <header className="max-w-4xl">
        <p className="font-sans text-[11px] font-extrabold uppercase tracking-[0.14em] text-brand-strong">US state county reference · Census geography</p>
        <h1 className="mt-2 font-display text-4xl font-bold tracking-tight sm:text-5xl">{state.name} {unitTitle}: Complete List & Map</h1>
        <p className="mt-4 text-lg leading-relaxed text-mute">Browse all {list.length} {unitLower} represented in the Census-derived county geometry for {state.name}. Use the FIPS list for reference, open the printable state map, or move into MapBench&apos;s county and demographic tools for interactive analysis.</p>
        <p className="mt-3 text-sm text-mute">Reviewed 14 Oct 2026 by <Link href="/author/aryan-khan" className="font-semibold text-brand-strong hover:underline">Aryan Khan</Link> · source and boundary notes in <Link href="/data-sources" className="font-semibold text-brand-strong hover:underline">Data Sources</Link>.</p>
      </header>

      <section className="mt-8 grid gap-4 sm:grid-cols-3" aria-label={`${state.name} quick facts`}>
        <div className="card p-5"><div className="text-xs font-extrabold uppercase text-mute">{unitTitle}</div><div className="mt-1 font-display text-3xl font-bold">{list.length}</div><div className="mt-1 text-xs text-mute">Census county-equivalents in this dataset</div></div>
        <div className="card p-5"><div className="text-xs font-extrabold uppercase text-mute">State capital</div><div className="mt-1 font-display text-2xl font-bold">{capital}</div><div className="mt-1 text-xs text-mute">capital reference</div></div>
        <div className="card p-5"><div className="text-xs font-extrabold uppercase text-mute">State FIPS</div><div className="mt-1 font-display text-3xl font-bold">{state.fips}</div><div className="mt-1 text-xs text-mute">prefix used in county GEOIDs</div></div>
      </section>

      <section className="mt-8 grid gap-4 md:grid-cols-3">
        <Link href={`/maps/blank/us/${state.slug}`} className="card p-5 transition hover:border-brand"><h2 className="font-display text-lg font-bold">Printable {state.name} {unitTitle} Map</h2><p className="mt-2 text-sm leading-relaxed text-mute">Open blank, labeled and colored boundary variants, then export SVG or PNG.</p><span className="mt-3 block text-sm font-extrabold text-brand-strong">Open map →</span></Link>
        <Link href="/tools/us-county-demographic-explorer" className="card p-5 transition hover:border-brand"><h2 className="font-display text-lg font-bold">County Demographic Explorer</h2><p className="mt-2 text-sm leading-relaxed text-mute">Compare population, income, age, poverty, education and housing across counties in a selected state.</p><span className="mt-3 block text-sm font-extrabold text-brand-strong">Explore counties →</span></Link>
      </section>

      <section className="mt-12" aria-labelledby="county-list">
        <div className="flex flex-wrap items-end justify-between gap-3"><div><h2 id="county-list" className="sect-h">All {state.name} {unitTitle}</h2><p className="mt-2 max-w-3xl text-sm text-mute">The five-digit GEOID combines state FIPS {state.fips} with the three-digit county-equivalent code. Names are taken from the Census-derived geometry bundled with MapBench.</p></div><Link href={`/maps/blank/us/${state.slug}`} className="font-sans text-sm font-extrabold text-brand-strong hover:underline">View boundary map →</Link></div>
        <div className="mt-5 overflow-x-auto rounded-xl border border-line bg-card">
          <table className="tbl min-w-[620px]">
            <thead><tr><th>#</th><th>{unitTitle === "Counties" ? "County" : unitTitle.replace(/s$/, "")}</th><th>GEOID / FIPS</th></tr></thead>
            <tbody>{list.map((county, i) => <tr key={county.id}><td>{i + 1}</td><td className="font-semibold">{county.name}</td><td className="font-mono text-sm text-mute">{county.id}</td></tr>)}</tbody>
          </table>
        </div>
      </section>

      <section className="mt-12 grid gap-5 lg:grid-cols-2">
        <article className="card p-6"><h2 className="font-display text-2xl font-bold">How county-equivalents work in {state.name}</h2><p className="mt-3 text-sm leading-relaxed text-mute">Counties are the standard county-level administrative geography in most states, but Census county-equivalents also include Louisiana parishes, Alaska boroughs and census areas, independent cities in some states, and the District of Columbia. MapBench uses the Census-style county-equivalent concept so geographic lookups and FIPS references stay consistent across the country.</p></article>
        <article className="card p-6"><h2 className="font-display text-2xl font-bold">What the list does and does not tell you</h2><p className="mt-3 text-sm leading-relaxed text-mute">This page is a geographic reference list, not a legal boundary record. County names and generalized map geometry are appropriate for education, data joins and broad analysis. Election districts, parcels, municipal limits and legally current local boundaries should be verified with the responsible authority.</p></article>
      </section>

      <section className="mt-12 border-t border-line pt-10">
        <h2 className="sect-h">Related state county pages</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{related.map((item) => <Link key={item.slug} href={`/states/${item.slug}/counties`} className="card p-4 font-display font-bold transition hover:border-brand hover:text-brand-strong">{item.name} {item.name === "Louisiana" ? "Parishes" : item.name === "Alaska" ? "Boroughs" : "Counties"} →</Link>)}</div>
        <p className="mt-5 font-sans text-sm"><Link href="/states" className="font-extrabold text-brand-strong hover:underline">All US states →</Link><span className="mx-2 text-mute">·</span><Link href="/studies/state-capital-radius" className="font-extrabold text-brand-strong hover:underline">State capital study →</Link><span className="mx-2 text-mute">·</span><Link href="/corrections" className="font-extrabold text-brand-strong hover:underline">Corrections →</Link></p>
      </section>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    </div>
  );
}
