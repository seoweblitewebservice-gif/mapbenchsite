import type { Metadata } from "next";
import Link from "next/link";
import { CATEGORIES, TOOLS, popularTools } from "@/lib/registry";
import { ALL_GUIDES } from "@/data/allGuides";
import { STUDIES } from "@/data/studies";
import BlankMapsHomeGrid from "@/components/BlankMapsHomeGrid";
import HomeToolIndex from "@/components/HomeToolIndex";

export const metadata: Metadata = {
  title: "Free Map Tools, Geographic Calculators & Blank Maps",
  description:
    "Free browser-based map and geographic tools for distance, radius, drive time, coordinates, elevation, GPS files and printable blank maps, plus practical mapping guides.",
  alternates: { canonical: "/" },
};

const POPULAR_QUESTIONS: { q: string; href: string }[] = [
  { q: "What county am I in?", href: "/tools/what-county-am-i-in" },
  { q: "How far can I drive in 30 minutes?", href: "/tools/drive-time-map" },
  { q: "Find my current location", href: "/tools/find-my-location" },
  { q: "Distance between two cities", href: "/tools/distance-between-two-places" },
  { q: "Draw a radius on a map", href: "/tools/map-radius" },
  { q: "Measure lot size or acreage", href: "/tools/lot-size-calculator" },
  { q: "What is my latitude and longitude?", href: "/tools/latitude-longitude-finder" },
  { q: "Find ZIP codes within a radius", href: "/tools/zip-codes-within-radius" },
];

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
  const featured = (popularTools.length ? popularTools : TOOLS).slice(0, 12);

  return (
    <div className="doc">
      <section className="hero-map relative overflow-hidden border-b border-line">
        <div className="hero-map-bg" aria-hidden />
        <div className="hero-map-fade" aria-hidden />
        <div className="relative z-[1] mx-auto max-w-3xl px-4 py-14 text-center sm:py-20">
          <p className="mb-3 font-sans text-[11px] font-extrabold uppercase tracking-[0.16em] text-brand-strong">
            Free · No sign-up · Methods explained
          </p>
          <h1 className="font-display text-4xl font-bold leading-[1.12] tracking-tight text-ink sm:text-5xl md:text-[3.25rem]">
            Map Tools That Explain the Answer
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-[15px] leading-relaxed text-mute sm:text-base">
            {TOOLS.length} interactive geographic tools, printable blank maps, original geographic studies and practical mapping guides. Measure distance, compare drive time, draw radius areas, work with coordinates, inspect GPS files and understand the method behind the result.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3 font-sans">
            <Link href="/tools" className="btn btn-primary px-6 py-3 text-[15px]">Explore All {TOOLS.length} Tools</Link>
            <Link href="/studies" className="btn btn-ghost bg-card/80 px-6 py-3 text-[15px] backdrop-blur-sm">Explore Original Studies</Link>
          </div>
        </div>
      </section>

      <section aria-labelledby="popular-q" className="border-b border-line py-12">
        <div className="mx-auto max-w-3xl px-4">
          <h2 id="popular-q" className="text-center font-display text-2xl font-bold tracking-tight sm:text-[1.65rem]">Start with a real question</h2>
          <p className="mx-auto mt-3 max-w-2xl text-center text-sm leading-relaxed text-mute">MapBench is organized around tasks people actually need to solve, not just a long list of calculators.</p>
          <div className="mt-7 grid gap-3 sm:grid-cols-2">
            {POPULAR_QUESTIONS.map((item) => (
              <Link key={item.href} href={item.href} className="rounded-lg border border-line bg-card px-4 py-3.5 text-left font-sans text-sm font-semibold text-ink shadow-sm transition hover:border-brand hover:bg-brand-soft/40 hover:text-brand-strong">{item.q}</Link>
            ))}
          </div>
        </div>
      </section>

      <section aria-labelledby="featured-tools" className="mx-auto max-w-5xl px-4 py-12">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 id="featured-tools" className="sect-h">Popular map tools</h2>
            <p className="mt-3 max-w-2xl">A focused starting point for common mapping, location and geographic questions. The complete directory remains available on the tools page.</p>
          </div>
          <Link href="/tools" className="font-sans text-sm font-extrabold text-brand-strong hover:underline">Browse all {TOOLS.length} tools →</Link>
        </div>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((tool) => (
            <Link key={tool.slug} href={`/tools/${tool.slug}`} className="card group p-5 transition-colors hover:border-brand">
              <div className="font-sans text-[10px] font-extrabold uppercase tracking-wide text-mute">{CATEGORIES.find((c) => c.id === tool.category)?.label} · {tool.scope}</div>
              <h3 className="mt-2 font-display text-lg font-bold leading-snug group-hover:text-brand-strong">{tool.name}</h3>
              <p className="mt-2 text-sm leading-relaxed text-mute">{tool.short}</p>
              <span className="mt-4 block font-sans text-sm font-extrabold text-brand-strong">Open tool →</span>
            </Link>
          ))}
        </div>
      </section>

      <HomeToolIndex />

      <section aria-labelledby="categories" className="border-y border-line bg-well/40 py-12">
        <div className="mx-auto max-w-5xl px-4">
          <h2 id="categories" className="sect-h">Explore by geographic task</h2>
          <p className="mt-3 max-w-3xl">Each category groups tools that answer a related kind of question, while individual pages explain when the method is appropriate and what the result does not mean.</p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {CATEGORIES.map((cat) => {
              const count = TOOLS.filter((t) => t.category === cat.id).length;
              if (!count) return null;
              return (
                <Link key={cat.id} href={`/tools/category/${cat.id}`} className="card group p-5 transition-colors hover:border-brand">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="font-display text-lg font-bold group-hover:text-brand-strong">{cat.label}</h3>
                    <span className="chip">{count} tools</span>
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-mute">{cat.short}</p>
                  <span className="mt-3 block font-sans text-xs font-extrabold text-brand-strong">Explore category →</span>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <section aria-labelledby="why-mapbench" className="mx-auto max-w-4xl px-4 py-12">
        <h2 id="why-mapbench" className="sect-h">More than a calculator directory</h2>
        <p className="mt-3 max-w-3xl">A number without context is easy to misuse. MapBench pairs tools with explanation so you can understand what was measured, which dataset or model was used, and where the result stops being reliable.</p>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="card p-5"><h3 className="font-display text-lg font-bold">Methods explained</h3><p className="mt-2 text-sm leading-relaxed text-mute">Distance, routing, coordinate, elevation and file workflows include methodology and source context rather than presenting unexplained outputs.</p></div>
          <div className="card p-5"><h3 className="font-display text-lg font-bold">Limits shown clearly</h3><p className="mt-2 text-sm leading-relaxed text-mute">Pages distinguish geometric estimates, network travel times, public boundaries and official data so users can choose the right level of confidence.</p></div>
          <div className="card p-5"><h3 className="font-display text-lg font-bold">Practical examples</h3><p className="mt-2 text-sm leading-relaxed text-mute">Worked examples and common mistakes help connect geographic concepts to delivery zones, travel, property, GPS data, education and everyday planning.</p></div>
          <div className="card p-5"><h3 className="font-display text-lg font-bold">Open data transparency</h3><p className="mt-2 text-sm leading-relaxed text-mute">Data sources and licensing are documented so users can understand where the map, boundary, elevation or routing information comes from.</p></div>
        </div>
        <p className="mt-5 font-sans text-sm"><Link href="/methodology" className="font-extrabold text-brand-strong hover:underline">Read methodology →</Link><span className="mx-2 text-mute">·</span><Link href="/data-sources" className="font-extrabold text-brand-strong hover:underline">See data sources →</Link><span className="mx-2 text-mute">·</span><Link href="/editorial-policy" className="font-extrabold text-brand-strong hover:underline">Editorial policy →</Link></p>
      </section>

      <section aria-labelledby="blank-maps" className="border-t border-line bg-well/50 py-10">
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

      <section aria-labelledby="faq" className="border-t border-line bg-well/40 py-12">
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