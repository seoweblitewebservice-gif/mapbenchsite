import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import StateBlankMapMaker from "@/components/StateBlankMapMaker";
import { US_BLANK_MAP_STATES, US_BLANK_MAP_STATE_BY_SLUG } from "@/data/usBlankMapStates";
import { STATE_FACTS, fmtInt } from "@/data/stateFacts";

export function generateStaticParams() {
  return US_BLANK_MAP_STATES.map((state) => ({ state: state.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ state: string }> }): Promise<Metadata> {
  const { state: slug } = await params;
  const state = US_BLANK_MAP_STATE_BY_SLUG.get(slug);
  if (!state) return {};

  const divisionTitle = state.name === "Louisiana" ? "Parish" : state.name === "Alaska" ? "Borough & Census Area" : "County";
  const facts = STATE_FACTS[state.name] ?? { capital: "", largestCity: "", population2024: 0, landAreaSqMi: 0, counties: 0, densityPerSqMi: 0 };
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


  const divisionSingular = state.name === "Louisiana" ? "parish" : state.name === "Alaska" ? "borough or census area" : "county";
  const divisionTitle = state.name === "Louisiana" ? "Parish" : state.name === "Alaska" ? "Borough & Census Area" : "County";
  const facts = STATE_FACTS[state.name] ?? { capital: "", largestCity: "", population2024: 0, landAreaSqMi: 0, counties: 0, densityPerSqMi: 0 };
  const faqs: [string, string][] = [
    [`Can I print this ${state.name} ${divisionSingular} map?`, `Yes. Download the SVG or PNG, or use your browser's print dialog to save a PDF. The blank variant is designed for worksheets, reports and labeling exercises.`],
    [`Is this ${state.name} map really free?`, `Yes — completely free, including commercial use. The boundary geometry comes from public US Census cartographic data, and the map is generated in your browser with no watermark, no signup and no attribution required.`],
    [`Does this ${state.name} map show official legal boundaries?`, `The page uses public US Census cartographic geometry for geographic visualization. It is useful for reference and design, but legal, surveying, election or property-boundary work should be verified against the responsible government authority.`],
    [`Can I get ${state.name} ${state.divisionLabel} with labels?`, `Yes. Switch to the labeled variant to place ${divisionSingular} names on the map, or use the colored version for a clearer visual separation between areas. All four variants are generated from the same geometry, so borders line up exactly between versions.`],
    [`What is the best format for editing?`, `SVG is the best option for Illustrator, Inkscape and other vector workflows because it remains sharp at any size. PNG is more convenient for slides and documents.`],
    [`How many ${divisionSingular}s does ${state.name} have?`, `${state.name} has ${facts.counties} ${divisionSingular}s. You can count them on the blank variant — it makes a good classroom exercise.`],
    [`What is the capital of ${state.name}?`, `The capital of ${state.name} is ${facts.capital}.`],
    [`Can I use this map in a YouTube video or presentation?`, `Yes. Public-domain geometry means you can use the map in videos, thumbnails, slides and commercial presentations without permission or credit — though a credit line is always appreciated.`],
    [`What size will it print at?`, `The SVG has no fixed resolution, so it prints sharply at any size — from a worksheet to a classroom poster. For PNG, export at the highest resolution offered and avoid enlarging it beyond its native pixel size.`],
    [`Does the map include neighboring states?`, `The focus is the ${state.name} outline with its internal ${divisionSingular} boundaries. Neighboring states appear only as context where the generator includes them; for a multi-state view, open each state's page or use the national county map.`],
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

      <dl className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-line bg-card px-4 py-3"><dt className="text-[10px] font-extrabold uppercase tracking-widest text-mute">Free downloads</dt><dd className="mt-1 font-display text-base font-bold">SVG · PNG · PDF</dd></div>
        <div className="rounded-xl border border-line bg-card px-4 py-3"><dt className="text-[10px] font-extrabold uppercase tracking-widest text-mute">Map variants</dt><dd className="mt-1 font-display text-base font-bold">4 versions</dd></div>
        <div className="rounded-xl border border-line bg-card px-4 py-3"><dt className="text-[10px] font-extrabold uppercase tracking-widest text-mute">{state.divisionLabel}</dt><dd className="mt-1 font-display text-base font-bold">{facts.counties}</dd></div>
        <div className="rounded-xl border border-line bg-card px-4 py-3"><dt className="text-[10px] font-extrabold uppercase tracking-widest text-mute">License</dt><dd className="mt-1 font-display text-base font-bold">Public domain</dd></div>
      </dl>

      <nav aria-label="On this page" className="mt-6 rounded-xl border border-line bg-well/40 px-5 py-4">
        <p className="text-[11px] font-extrabold uppercase tracking-widest text-mute">On this page</p>
        <div className="mt-2 flex flex-wrap gap-x-5 gap-y-2 text-sm font-semibold">
          <a href="#about" className="text-brand-strong hover:underline">About this map</a>
          <a href="#factsheet" className="text-brand-strong hover:underline">{state.name} factsheet</a>
          <a href="#variants" className="text-brand-strong hover:underline">The 4 variants explained</a>
          <a href="#uses" className="text-brand-strong hover:underline">Common uses</a>
          <a href="#classroom" className="text-brand-strong hover:underline">Classroom ideas</a>
          <a href="#printing" className="text-brand-strong hover:underline">How to print</a>
          <a href="#all-states" className="text-brand-strong hover:underline">All 50 states</a>
          <a href="#license" className="text-brand-strong hover:underline">License</a>
          <a href="#glossary" className="text-brand-strong hover:underline">Glossary</a>
          <a href="#faq" className="text-brand-strong hover:underline">FAQ</a>
        </div>
      </nav>

      <section className="mt-8" aria-label={`${state.name} county blank map generator`}>
        <StateBlankMapMaker stateName={state.name} stateFips={state.fips} slug={state.slug} divisionLabel={state.divisionLabel} />
      </section>

      <section id="factsheet" className="mt-12 border-t border-line pt-10" aria-labelledby="factsheet-h">
        <h2 id="factsheet-h" className="sect-h">{state.name} factsheet</h2>
        <div className="mt-5 overflow-hidden rounded-xl border border-line">
          <table className="w-full text-sm">
            <tbody>
              {[["Capital", facts.capital],["Largest city", facts.largestCity],["Population (2024 est.)", fmtInt(facts.population2024)],["Land area", `${fmtInt(facts.landAreaSqMi)} sq mi`],["Population density", `${facts.densityPerSqMi.toFixed(1)} / sq mi`],[state.divisionLabel, String(facts.counties)]].map(([k, v]) => (
                <tr key={k} className="border-b border-line last:border-0 odd:bg-well/30"><td className="px-4 py-2.5 font-semibold text-ink w-44">{k}</td><td className="px-4 py-2.5 text-mute">{v}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-xs text-mute">Population: US Census Vintage 2024 estimates. Land area: US Census 2024 Gazetteer. County counts computed from Census geography.</p>
      </section>

      <section id="variants" className="mt-12 border-t border-line pt-10" aria-labelledby="variants-h">
        <h2 id="variants-h" className="sect-h">The 4 map variants explained</h2>
        <ol className="mt-5 space-y-4">
          <li className="card p-5"><h3 className="font-display text-lg font-bold">1. Blank outline</h3><p className="mt-2 text-sm leading-relaxed text-mute">Every {divisionSingular} drawn as a clean unfilled shape with a thin border. The classic worksheet version — hand it out for labeling quizzes, fill-in-the-blank exercises, or as a starting point for your own data overlay.</p></li>
          <li className="card p-5"><h3 className="font-display text-lg font-bold">2. Labeled</h3><p className="mt-2 text-sm leading-relaxed text-mute">The same outline with {divisionSingular} names placed automatically at each area's center. Use it as a reference map, or print the blank version for students and keep the labeled one as the answer key — borders line up exactly because both come from the same geometry.</p></li>
          <li className="card p-5"><h3 className="font-display text-lg font-bold">3. Colored</h3><p className="mt-2 text-sm leading-relaxed text-mute">Each {divisionSingular} filled with a soft tint so neighboring areas are visually distinct. Ideal for presentations and reports where you want a polished map without doing the coloring yourself.</p></li>
          <li className="card p-5"><h3 className="font-display text-lg font-bold">4. With cities</h3><p className="mt-2 text-sm leading-relaxed text-mute">The outline plus dots and labels for major cities, giving readers geographic anchors. Useful for travel-themed projects or any map where people need to orient themselves quickly.</p></li>
        </ol>
      </section>

      <section id="about" className="mt-12 border-t border-line pt-10">
        <h2 className="sect-h">What this {state.name} blank map includes</h2>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <article className="card p-5"><h3 className="font-display text-lg font-bold">County-equivalent boundaries</h3><p className="mt-2 text-sm leading-relaxed text-mute">The map draws the Census county-equivalent geography for {state.name}. In most states these are counties; Louisiana uses parishes, while Alaska uses boroughs and census areas.</p></article>
          <article className="card p-5"><h3 className="font-display text-lg font-bold">Four useful map variants</h3><p className="mt-2 text-sm leading-relaxed text-mute">Use a plain outline for labeling, add names for reference, apply alternating fills for visual separation, or show major-city reference points where the city dataset has coverage.</p></article>
          <article className="card p-5"><h3 className="font-display text-lg font-bold">Vector and image downloads</h3><p className="mt-2 text-sm leading-relaxed text-mute">SVG is suited to print and design workflows because it scales without losing sharpness. PNG is ready for documents and presentations, and the print control can produce a PDF through your browser.</p></article>
          <article className="card p-5"><h3 className="font-display text-lg font-bold">Reusable geographic base layer</h3><p className="mt-2 text-sm leading-relaxed text-mute">A state-and-county outline is useful as the base layer for demographic graphics, classroom exercises, sales territories, service areas and other explanatory maps.</p></article>
        </div>
      </section>

      <section className="mt-12 border-t border-line pt-10">
        <h2 className="sect-h" id="uses">How to use the {state.name} {divisionSingular} map</h2>
        <ol className="mt-5 grid gap-4 md:grid-cols-3">
          <li className="card p-5"><span className="chip">1</span><h3 className="mt-3 font-display text-lg font-bold">Choose a map style</h3><p className="mt-2 text-sm leading-relaxed text-mute">Start with blank, labeled, colored or cities depending on whether you need a worksheet, reference map or presentation graphic.</p></li>
          <li className="card p-5"><span className="chip">2</span><h3 className="mt-3 font-display text-lg font-bold">Preview the boundaries</h3><p className="mt-2 text-sm leading-relaxed text-mute">Check the state outline and county-equivalent boundaries before downloading, especially if the map will be annotated or reused in a report.</p></li>
          <li className="card p-5"><span className="chip">3</span><h3 className="mt-3 font-display text-lg font-bold">Download or print</h3><p className="mt-2 text-sm leading-relaxed text-mute">Use SVG for editing and print work, PNG for quick placement, or Print / Save as PDF for a ready-to-share page.</p></li>
        </ol>
      </section>

      <section className="mt-12 border-t border-line pt-10">
        <h2 className="sect-h" id="sources">Data source, accuracy and limitations</h2>
        <p className="mt-3 max-w-4xl leading-7 text-mute">MapBench builds these state pages from public US Census cartographic boundary geometry distributed through the us-atlas project. Cartographic boundaries are simplified for mapping, which makes them appropriate for visualization, education and general geographic analysis. They should not be treated as parcel, cadastral, election-precinct or survey boundaries.</p>
        <p className="mt-3 max-w-4xl leading-7 text-mute">County names and shapes can change over time, especially for county-equivalent areas. When a project requires a legally current boundary or an official government filing, verify the result with the relevant state, county or Census source. This page is designed as a practical printable map, not an authoritative legal boundary product.</p>
      </section>

      <section id="classroom" className="mt-12 border-t border-line pt-10">
        <h2 className="sect-h">Classroom ideas for the {state.name} blank map</h2>
        <ul className="mt-5 list-disc space-y-2.5 pl-6 text-[15px] leading-relaxed text-mute">
          <li><strong className="text-ink">Label race:</strong> print the blank version, give students 10 minutes to label as many {divisionSingular}s as they can, then reveal the labeled version to grade.</li>
          <li><strong className="text-ink">Color by region:</strong> group {divisionSingular}s into regions and have students apply a color key — a fast way to teach regional geography.</li>
          <li><strong className="text-ink">Population dots:</strong> students draw one dot per 10,000 residents in each {divisionSingular}, instantly revealing where people actually live.</li>
          <li><strong className="text-ink">News tracker:</strong> pin a {divisionSingular} on the map each week a local news story happens there; discuss the geographic pattern at term end.</li>
          <li><strong className="text-ink">Build-a-trip:</strong> plan a hypothetical road trip across {state.name} on the labeled version, marking stops {divisionSingular} by {divisionSingular}.</li>
        </ul>
      </section>

      <section id="printing" className="mt-12 border-t border-line pt-10">
        <h2 className="sect-h">How to print the {state.name} map</h2>
        <div className="mt-5 space-y-4 text-[15px] leading-relaxed text-mute">
          <p><strong className="text-ink">Easiest method (PDF):</strong> open the print dialog in your browser, choose "Save as PDF", and select "Fit to page". The map fills a US Letter or A4 sheet cleanly.</p>
          <p><strong className="text-ink">Best quality:</strong> download the SVG and print from a vector-aware program (Illustrator, Inkscape, or even a browser). Vector lines stay razor-sharp at poster size; avoid enlarging the PNG beyond its native resolution.</p>
          <p><strong className="text-ink">For worksheets:</strong> the blank variant prints well in black and white. If your copier lightens thin lines, print the SVG and bump the stroke width slightly in any vector editor first.</p>
        </div>
      </section>

      <section id="all-states" className="mt-12 border-t border-line pt-10">
        <h2 className="sect-h">All 50 states + DC blank maps</h2>
        <p className="mt-3 max-w-3xl text-sm text-mute">Every state gets the same treatment: {divisionSingular}-level boundaries, four variants, and SVG, PNG and PDF-ready downloads.</p>
        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {US_BLANK_MAP_STATES.map((item) => (
            <Link key={item.slug} href={`/maps/blank/us/${item.slug}`} className={`rounded-lg border px-3 py-2.5 text-sm font-semibold transition ${item.slug === state.slug ? "border-brand bg-brand-soft/50 text-brand-strong" : "border-line bg-well/35 text-ink hover:border-brand hover:text-brand-strong"}`}>
              {item.name}
            </Link>
          ))}
        </div>
        <p className="mt-5"><Link href="/maps" className="font-sans text-sm font-extrabold text-brand-strong hover:underline">Browse all printable blank maps →</Link></p>
      </section>

      <section id="license" className="mt-12 border-t border-line pt-10">
        <h2 className="sect-h">License & attribution</h2>
        <p className="mt-3 max-w-4xl leading-7 text-mute">All maps on this page are dedicated to the public domain under Creative Commons CC0. You can copy, modify, distribute and use them — including for commercial purposes — without asking permission and without giving credit. Attribution is appreciated but never required.</p>
        <p className="mt-3 max-w-4xl leading-7 text-mute">The underlying boundary geometry is public US Census cartographic data. MapBench generates the visible map in your browser; nothing is uploaded and no watermark is added.</p>
      </section>

      <section id="glossary" className="mt-12 border-t border-line pt-10">
        <h2 className="sect-h">Glossary</h2>
        <dl className="mt-5 space-y-4">
          {[["Blank map", "An outline map showing only the borders of regions, without any names, colors or other markings."],["County equivalent", "The Census Bureau's term for primary divisions of a state: counties in most states, parishes in Louisiana, boroughs and census areas in Alaska."],["SVG", "Scalable Vector Graphics — a text-based format that describes shapes mathematically. SVG files scale to any size without losing quality."],["PNG", "A raster image format ideal for slides, documents and quick sharing at a fixed resolution."],["Cartographic boundary", "Simplified boundary geometry designed for mapping and visualization rather than legal or surveying use."]].map(([term, def]) => (
            <div key={term} className="rounded-xl border border-line bg-card px-5 py-4"><dt className="font-display font-bold">{term}</dt><dd className="mt-1 text-sm leading-relaxed text-mute">{def}</dd></div>
          ))}
        </dl>
      </section>

      <section className="mt-12 border-t border-line pt-10">
        <h2 className="sect-h" id="faq">Frequently asked questions</h2>
        <div className="mt-5 divide-y divide-line rounded-xl border border-line bg-card">
          {faqs.map(([q, a]) => <details key={q} className="px-5 py-4"><summary className="cursor-pointer font-semibold">{q}</summary><p className="mt-3 text-sm leading-relaxed text-mute">{a}</p></details>)}
        </div>
      </section>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    </div>
  );
}
