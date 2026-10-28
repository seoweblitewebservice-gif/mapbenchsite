import type { Metadata } from "next";
import Link from "next/link";
import { CATEGORIES, TOOLS } from "@/lib/registry";
import { ALL_GUIDES } from "@/data/allGuides";
import { STUDIES } from "@/data/studies";
import BlankMapsHomeGrid from "@/components/BlankMapsHomeGrid";
import HomeToolIndex from "@/components/HomeToolIndex";
import HomeToolFinder from "@/components/HomeToolFinder";
import HomeGlobe from "@/components/HomeGlobe";

export const metadata: Metadata = {
  title: "Free Map Tools, Geographic Calculators & Blank Maps",
  description:
    "Free map tools: radius, distance, drive time, coordinates, counties, ZIP codes, elevation, GPS files and printable blank maps. No sign-up.",
  alternates: { canonical: "/" },
};

const HOME_FAQ: [string, string][] = [
  ["What is MapBench?", "MapBench is a free collection of interactive map tools, geographic calculators, printable blank maps, original geographic studies and practical mapping guides. Use it for distance, radius, drive time, coordinates, elevation, GPS files, location questions and more."],
  ["Are the tools really free?", "Yes. Public MapBench tools are free to use and do not require an account."],
  ["Do the tools work on mobile?", "Yes. MapBench is responsive and most tools work in modern mobile browsers. Location tools can use device location when you grant permission."],
  ["What data sources does MapBench use?", "MapBench uses documented public and open geographic sources including OpenStreetMap-based mapping and geocoding, public routing services, Natural Earth, US Census data and Copernicus elevation data where relevant."],
  ["Do the tools work outside the United States?", "Most tools are worldwide. Some tools are US-focused because the underlying ZIP, county or government dataset is specific to the United States; coverage is labelled on the page."],
  ["How accurate are the calculations?", "Accuracy depends on the method and dataset. MapBench documents whether a result uses geometric distance, road-network routing, public boundaries, browser location or another source, and highlights important limitations on each tool page."],
  ["Is my location or file data stored?", "Browser-first tools keep processing local where possible. When a lookup needs an external public service, only the data needed for that request is sent. File tools are designed to process supported files locally in the browser where stated."],
  ["Is MapBench suitable for legal, surveying or safety-critical decisions?", "MapBench is intended for everyday analysis, learning and planning. Official boundaries, legal descriptions, surveying, emergency decisions, engineering and regulated work should be verified with the responsible authority or a qualified professional."],
];

export default function HomePage() {
  const compact = (tool: (typeof TOOLS)[number]) => ({
    slug: tool.slug,
    name: tool.name,
    short: tool.short,
    category: tool.category,
    categoryLabel: CATEGORIES.find((category) => category.id === tool.category)?.label ?? tool.category,
    scope: tool.scope,
    keywords: tool.keywords,
  });

  const searchTools = TOOLS.map(compact);
  const suggested: ReturnType<typeof compact>[] = [];

  return (
    <div className="doc home-redesign">
      <section className="hero-map relative overflow-visible border-b border-line">
        <div className="hero-map-bg" aria-hidden />
        <div className="hero-map-fade" aria-hidden />
        <div className="home-hero-inner relative z-[1] mx-auto max-w-5xl px-4 py-14 sm:py-20"><div className="home-hero-copy">
          <p className="mb-3 font-sans text-[11px] font-extrabold uppercase tracking-[0.16em] text-brand-strong">
            Free · No sign-up · Methods explained
          </p>
          <h1 className="font-display text-4xl font-bold leading-[1.12] tracking-tight text-ink sm:text-5xl md:text-[3.25rem]">
            Free Map Tools & <span className="home-title-accent">Printable Maps</span>
          </h1>
          <p className="mx-auto mt-5 max-w-3xl text-[15px] leading-relaxed text-mute sm:text-base">
            {TOOLS.length} free tools for measuring distances, finding places, converting coordinates and making maps. Start with a question. No account required.
          </p>

          <HomeToolFinder tools={searchTools} suggested={suggested} />
        </div><div className="home-hero-art"><HomeGlobe /></div>
        </div>
      </section>

      <HomeToolIndex />

      <section aria-labelledby="blank-maps" className="home-maps border-t border-line bg-well/50 py-10">
        <div className="container-sf">
          <h2 id="blank-maps" className="sect-h">Free Printable Blank Maps</h2>
          <p className="mt-3 max-w-3xl">Clean outline maps rendered from public geographic geometry for worksheets, presentations and design work. Download available formats without watermarks.</p>
          <div className="mt-5"><BlankMapsHomeGrid /></div>
          <p className="mt-4 font-sans text-sm"><Link href="/maps" className="font-extrabold text-brand-strong hover:underline">Browse all blank maps →</Link></p>
        </div>
      </section>

      <section aria-labelledby="studies" className="border-t border-line py-12">
        <div className="mx-auto max-w-5xl px-4">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="font-sans text-[11px] font-extrabold uppercase tracking-[0.14em] text-brand-strong">Original MapBench research</p>
              <h2 id="studies" className="sect-h mt-2">Geographic studies built from transparent calculations</h2>
              <p className="mt-3 max-w-3xl">These studies use MapBench datasets and documented geographic methods to answer questions that go beyond a single calculator. Each page explains the dataset, formula, ranking method and limitations so the result can be checked rather than treated as a black box.</p>
            </div>
            <Link href="/studies" className="font-sans text-sm font-extrabold text-brand-strong hover:underline">Browse all studies →</Link>
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {STUDIES.slice(0, 3).map((study) => (
              <Link key={study.slug} href={`/studies/${study.slug}`} className="card group p-5 transition-colors hover:border-brand">
                <div className="text-[10px] font-extrabold uppercase tracking-wide text-mute">Data study · {study.date}</div>
                <h3 className="mt-2 font-display text-[17px] font-bold leading-snug group-hover:text-brand-strong">{study.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-mute">{study.description}</p>
                <span className="mt-4 block font-sans text-sm font-extrabold text-brand-strong">Read study →</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section aria-labelledby="guides" className="mx-auto max-w-5xl px-4 py-12">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div><h2 id="guides" className="sect-h">Learn the geography behind the tools</h2><p className="mt-3 max-w-3xl">Practical guides explain coordinate systems, distance methods, map files, projections, land measurement and other topics where the right method matters as much as the final number.</p></div>
          <Link href="/guides" className="font-sans text-sm font-extrabold text-brand-strong hover:underline">Read all guides →</Link>
        </div>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {ALL_GUIDES.slice(0, 6).map((g) => (
            <Link key={g.slug} href={`/guides/${g.slug}`} className="card group p-5">
              <div className="text-[10px] font-extrabold uppercase tracking-wide text-mute">{g.readMins} min read</div>
              <h3 className="mt-2 font-display text-[17px] font-bold leading-snug group-hover:text-brand-strong">{g.title}</h3>
              <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-mute">{g.description}</p>
            </Link>
          ))}
        </div>
      </section>

      <section aria-labelledby="sources" className="border-t border-line py-10">
        <div className="mx-auto max-w-3xl px-4">
          <h2 id="sources" className="sect-h">Documented data sources</h2>
          <p className="mt-3">MapBench identifies the source behind geographic results instead of hiding data provenance. Depending on the tool, sources include OpenStreetMap-based services, Valhalla/OSRM routing, US Census data, Natural Earth, Copernicus elevation data and the IANA time-zone database.</p>
          <p className="mt-3 font-sans text-sm"><Link href="/data-sources" className="font-extrabold text-brand-strong hover:underline">Full attribution, sources & licences →</Link></p>
        </div>
      </section>

      <section aria-labelledby="faq" className="home-faq border-t border-line bg-well/40 py-12">
        <div className="mx-auto max-w-3xl px-4">
          <h2 id="faq" className="sect-h">Frequently asked questions</h2>
          <div className="mt-6 divide-y divide-line rounded-xl border border-line bg-card">
            {HOME_FAQ.map(([q, a]) => (
              <details key={q} className="group px-5 py-4">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 font-sans text-[15px] font-semibold text-ink marker:content-none"><span>{q}</span><span className="shrink-0 text-lg font-light text-mute transition group-open:rotate-45">+</span></summary>
                <p className="mt-3 pr-8 font-serif text-sm leading-relaxed text-mute">{a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ "@context": "https://schema.org", "@type": "FAQPage", mainEntity: HOME_FAQ.map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })) }) }} />
    </div>
  );
}
