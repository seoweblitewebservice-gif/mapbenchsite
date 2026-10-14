import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import StateBlankMapMaker from "@/components/StateBlankMapMaker";
import { US_BLANK_MAP_STATES, US_BLANK_MAP_STATE_BY_SLUG } from "@/data/usBlankMapStates";

export function generateStaticParams() {
  return US_BLANK_MAP_STATES.map((state) => ({ state: state.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ state: string }> }): Promise<Metadata> {
  const { state: slug } = await params;
  const state = US_BLANK_MAP_STATE_BY_SLUG.get(slug);
  if (!state) return {};

  const divisionTitle = state.name === "Louisiana" ? "Parish" : state.name === "Alaska" ? "Borough & Census Area" : "County";
  const title = `Blank ${state.name} ${divisionTitle} Map — SVG, PNG & PDF`;
  const description = `Free printable ${state.name} ${state.divisionLabel} map with Census boundaries, labeled and colored variants, plus SVG, PNG and PDF-ready downloads.`;

  return {
    title,
    description,
    alternates: { canonical: `/maps/blank/us/${state.slug}` },
    robots: { index: true, follow: true },
    openGraph: {
      title: `${title} | MapBench`,
      description,
      type: "website",
      url: `https://www.mapbench.site/maps/blank/us/${state.slug}`,
    },
  };
}

export default async function StateBlankMapPage({ params }: { params: Promise<{ state: string }> }) {
  const { state: slug } = await params;
  const state = US_BLANK_MAP_STATE_BY_SLUG.get(slug);
  if (!state) notFound();

  const currentIndex = US_BLANK_MAP_STATES.findIndex((item) => item.slug === state.slug);
  const related = [
    US_BLANK_MAP_STATES[(currentIndex + US_BLANK_MAP_STATES.length - 1) % US_BLANK_MAP_STATES.length],
    US_BLANK_MAP_STATES[(currentIndex + 1) % US_BLANK_MAP_STATES.length],
    US_BLANK_MAP_STATES[(currentIndex + 7) % US_BLANK_MAP_STATES.length],
    US_BLANK_MAP_STATES[(currentIndex + 17) % US_BLANK_MAP_STATES.length],
  ].filter((item, index, array) => item.slug !== state.slug && array.findIndex((x) => x.slug === item.slug) === index);

  const divisionSingular = state.name === "Louisiana" ? "parish" : state.name === "Alaska" ? "borough or census area" : "county";
  const divisionTitle = state.name === "Louisiana" ? "Parish" : state.name === "Alaska" ? "Borough & Census Area" : "County";
  const faqs: [string, string][] = [
    [`Can I print this ${state.name} ${divisionSingular} map?`, `Yes. Download the SVG or PNG, or use your browser's print dialog to save a PDF. The blank variant is designed for worksheets, reports and labeling exercises.`],
    [`Does this ${state.name} map show official legal boundaries?`, `The page uses public US Census cartographic geometry for geographic visualization. It is useful for reference and design, but legal, surveying, election or property-boundary work should be verified against the responsible government authority.`],
    [`Can I get ${state.name} ${state.divisionLabel} with labels?`, `Yes. Switch to the labeled variant to place county-equivalent names on the map, or use the colored version for a clearer visual separation between areas.`],
    ["What is the best format for editing?", "SVG is the best option for Illustrator, Inkscape and other vector workflows because it remains sharp at any size. PNG is more convenient for slides and documents."],
  ];

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "WebPage",
      name: `Blank ${state.name} ${divisionTitle} Map`,
      description: `Printable ${state.name} ${state.divisionLabel} map with public Census geometry and downloadable map variants.`,
      url: `https://www.mapbench.site/maps/blank/us/${state.slug}`,
      author: { "@type": "Person", name: "Aryan Khan", url: "https://www.mapbench.site/author/aryan-khan" },
      isPartOf: { "@type": "WebSite", name: "MapBench", url: "https://www.mapbench.site" },
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "MapBench", item: "https://www.mapbench.site" },
        { "@type": "ListItem", position: 2, name: "Blank Maps", item: "https://www.mapbench.site/maps" },
        { "@type": "ListItem", position: 3, name: "US State Maps", item: "https://www.mapbench.site/maps#us-states" },
        { "@type": "ListItem", position: 4, name: `${state.name} ${divisionTitle} Map` },
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faqs.map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })),
    },
  ];

  return (
    <div className="doc mx-auto max-w-5xl py-8">
      <nav className="mb-5 text-xs text-mute"><Link href="/">Home</Link> / <Link href="/maps">Blank Maps</Link> / <span>{state.name}</span></nav>

      <header className="max-w-4xl">
        <p className="font-sans text-[11px] font-extrabold uppercase tracking-[0.14em] text-brand-strong">US state blank map · Census county geometry</p>
        <h1 className="mt-2 font-display text-4xl font-bold tracking-tight sm:text-5xl">Blank {state.name} {divisionTitle} Map</h1>
        <p className="mt-4 max-w-3xl text-lg leading-relaxed text-mute">Download a clean {state.name} map with {state.divisionLabel}, switch between blank, labeled, colored and city-reference versions, and export SVG or high-resolution PNG for worksheets, presentations, reports, data graphics and map design.</p>
        <p className="mt-3 text-sm text-mute">Map reference maintained by <Link href="/author/aryan-khan" className="font-semibold text-brand-strong hover:underline">Aryan Khan</Link> · geometry source documented in <Link href="/data-sources" className="font-semibold text-brand-strong hover:underline">Data Sources</Link>.</p>
      </header>

      <section className="mt-8" aria-label={`${state.name} county blank map generator`}>
        <StateBlankMapMaker stateName={state.name} stateFips={state.fips} slug={state.slug} divisionLabel={state.divisionLabel} />
      </section>

      <section className="mt-12 border-t border-line pt-10">
        <h2 className="sect-h">What this {state.name} blank map includes</h2>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <article className="card p-5"><h3 className="font-display text-lg font-bold">County-equivalent boundaries</h3><p className="mt-2 text-sm leading-relaxed text-mute">The map draws the Census county-equivalent geography for {state.name}. In most states these are counties; Louisiana uses parishes, while Alaska uses boroughs and census areas.</p></article>
          <article className="card p-5"><h3 className="font-display text-lg font-bold">Four useful map variants</h3><p className="mt-2 text-sm leading-relaxed text-mute">Use a plain outline for labeling, add names for reference, apply alternating fills for visual separation, or show major-city reference points where the city dataset has coverage.</p></article>
          <article className="card p-5"><h3 className="font-display text-lg font-bold">Vector and image downloads</h3><p className="mt-2 text-sm leading-relaxed text-mute">SVG is suited to print and design workflows because it scales without losing sharpness. PNG is ready for documents and presentations, and the print control can produce a PDF through your browser.</p></article>
          <article className="card p-5"><h3 className="font-display text-lg font-bold">Reusable geographic base layer</h3><p className="mt-2 text-sm leading-relaxed text-mute">A state-and-county outline is useful as the base layer for demographic graphics, classroom exercises, sales territories, service areas and other explanatory maps.</p></article>
        </div>
      </section>

      <section className="mt-12 border-t border-line pt-10">
        <h2 className="sect-h">How to use the {state.name} {divisionSingular} map</h2>
        <ol className="mt-5 grid gap-4 md:grid-cols-3">
          <li className="card p-5"><span className="chip">1</span><h3 className="mt-3 font-display text-lg font-bold">Choose a map style</h3><p className="mt-2 text-sm leading-relaxed text-mute">Start with blank, labeled, colored or cities depending on whether you need a worksheet, reference map or presentation graphic.</p></li>
          <li className="card p-5"><span className="chip">2</span><h3 className="mt-3 font-display text-lg font-bold">Preview the boundaries</h3><p className="mt-2 text-sm leading-relaxed text-mute">Check the state outline and county-equivalent boundaries before downloading, especially if the map will be annotated or reused in a report.</p></li>
          <li className="card p-5"><span className="chip">3</span><h3 className="mt-3 font-display text-lg font-bold">Download or print</h3><p className="mt-2 text-sm leading-relaxed text-mute">Use SVG for editing and print work, PNG for quick placement, or Print / Save as PDF for a ready-to-share page.</p></li>
        </ol>
      </section>

      <section className="mt-12 border-t border-line pt-10">
        <h2 className="sect-h">Data source, accuracy and limitations</h2>
        <p className="mt-3 max-w-4xl leading-7 text-mute">MapBench builds these state pages from public US Census cartographic boundary geometry distributed through the us-atlas project. Cartographic boundaries are simplified for mapping, which makes them appropriate for visualization, education and general geographic analysis. They should not be treated as parcel, cadastral, election-precinct or survey boundaries.</p>
        <p className="mt-3 max-w-4xl leading-7 text-mute">County names and shapes can change over time, especially for county-equivalent areas. When a project requires a legally current boundary or an official government filing, verify the result with the relevant state, county or Census source. This page is designed as a practical printable map, not an authoritative legal boundary product.</p>
      </section>

      <section className="mt-12 border-t border-line pt-10">
        <h2 className="sect-h">Related US state blank maps</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {related.map((item) => <Link key={item.slug} href={`/maps/blank/us/${item.slug}`} className="card p-4 font-display font-bold hover:border-brand hover:text-brand-strong">{item.name} {item.name === "Louisiana" ? "Parish" : item.name === "Alaska" ? "Borough" : "County"} Map →</Link>)}
        </div>
        <p className="mt-5"><Link href="/maps" className="font-sans text-sm font-extrabold text-brand-strong hover:underline">Browse all printable blank maps →</Link></p>
      </section>

      <section className="mt-12 border-t border-line pt-10">
        <h2 className="sect-h">Frequently asked questions</h2>
        <div className="mt-5 divide-y divide-line rounded-xl border border-line bg-card">
          {faqs.map(([q, a]) => <details key={q} className="px-5 py-4"><summary className="cursor-pointer font-semibold">{q}</summary><p className="mt-3 text-sm leading-relaxed text-mute">{a}</p></details>)}
        </div>
      </section>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    </div>
  );
}
