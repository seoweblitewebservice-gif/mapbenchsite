import type { Metadata } from "next";
import Link from "next/link";
import { ALL_GUIDES } from "@/data/allGuides";
import { STUDIES } from "@/data/studies";
import { TOOLS } from "@/lib/registry";

const LINKEDIN = "https://www.linkedin.com/in/aryan-khan-b77438438/";

export const metadata: Metadata = {
  title: "Aryan Khan — Founder & Editor of MapBench",
  description: "Meet Aryan Khan, founder and editor of MapBench, responsible for tool direction, geographic methodology review, editorial standards and corrections.",
  alternates: { canonical: "/author/aryan-khan" },
};

export default function AryanKhanAuthorPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    "@id": "https://www.mapbench.site/author/aryan-khan#person",
    name: "Aryan Khan",
    url: "https://www.mapbench.site/author/aryan-khan",
    sameAs: [LINKEDIN],
    jobTitle: "Founder & Editor of MapBench",
    worksFor: { "@type": "Organization", name: "MapBench", url: "https://www.mapbench.site" },
    knowsAbout: ["Web mapping", "Geographic calculations", "Coordinate systems", "Geodesics", "Open geographic data", "GIS file formats", "Routing concepts"],
  };

  return (
    <main className="doc mx-auto max-w-4xl py-10">
      <nav aria-label="Breadcrumb" className="mb-6 text-xs text-mute"><Link href="/">Home</Link> / <Link href="/about">About</Link> / <span>Aryan Khan</span></nav>

      <header className="max-w-3xl">
        <p className="font-sans text-[11px] font-extrabold uppercase tracking-[0.14em] text-brand-strong">MapBench author profile</p>
        <h1 className="mt-2 font-display text-4xl font-bold tracking-tight sm:text-5xl">Aryan Khan</h1>
        <p className="mt-2 font-sans text-sm font-semibold text-mute">Founder &amp; Editor of MapBench</p>
        <p className="mt-5 text-lg leading-relaxed text-mute">Aryan Khan leads MapBench&apos;s product direction, editorial standards, methodology review and corrections process. His work focuses on making geographic tools useful for ordinary questions while keeping the calculation method, source data and limitations visible.</p>
        <div className="mt-5 flex flex-wrap gap-2">
          <a href={LINKEDIN} target="_blank" rel="me noopener noreferrer" className="btn btn-primary">LinkedIn profile ↗</a>
          <Link href="/about" className="btn btn-ghost">About MapBench</Link>
          <Link href="/contact" className="btn btn-ghost">Contact</Link>
        </div>
      </header>

      <section className="mt-10 grid gap-4 sm:grid-cols-3">
        <div className="card p-5"><div className="text-[10px] font-extrabold uppercase tracking-wide text-mute">Interactive tools</div><div className="mt-1 font-display text-3xl font-bold">{TOOLS.length}</div><p className="mt-2 text-sm text-mute">Map and geography utilities maintained across MapBench.</p></div>
        <div className="card p-5"><div className="text-[10px] font-extrabold uppercase tracking-wide text-mute">Published guides</div><div className="mt-1 font-display text-3xl font-bold">{ALL_GUIDES.length}</div><p className="mt-2 text-sm text-mute">Long-form practical explanations tied to real mapping tasks.</p></div>
        <div className="card p-5"><div className="text-[10px] font-extrabold uppercase tracking-wide text-mute">Original studies</div><div className="mt-1 font-display text-3xl font-bold">{STUDIES.length}</div><p className="mt-2 text-sm text-mute">Reproducible geographic comparisons with stated methods.</p></div>
      </section>

      <section className="mt-10 border-t border-line pt-8">
        <h2 className="font-display text-2xl font-bold">What he works on</h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <div className="card p-5"><h3 className="font-display text-xl font-bold">Tool design and usefulness</h3><p className="mt-2 text-sm leading-relaxed text-mute">MapBench tools are reviewed as practical workflows, not isolated formulas. Inputs, map interaction, outputs, exports and explanatory text are improved together so a user can understand both the answer and how it was produced.</p></div>
          <div className="card p-5"><h3 className="font-display text-xl font-bold">Method and source review</h3><p className="mt-2 text-sm leading-relaxed text-mute">Distance, area, routing, coordinates, elevation, time-zone and file-processing pages are checked against the method implemented in code and the documented upstream dataset or service.</p></div>
          <div className="card p-5"><h3 className="font-display text-xl font-bold">Readable geographic content</h3><p className="mt-2 text-sm leading-relaxed text-mute">Guides are written around real decisions and common mistakes. The aim is to explain enough context for a reader to choose the right tool rather than pad a page to a target word count.</p></div>
          <div className="card p-5"><h3 className="font-display text-xl font-bold">Corrections and limitations</h3><p className="mt-2 text-sm leading-relaxed text-mute">Estimates are labelled as estimates, public boundaries are not presented as legal surveys, and high-stakes use is directed to official or qualified professional sources when appropriate.</p></div>
        </div>
      </section>

      <section className="mt-10 border-t border-line pt-8">
        <h2 className="font-display text-2xl font-bold">How MapBench content is reviewed</h2>
        <p className="mt-3">A calculated number is not treated as automatically authoritative. Tool pages explain the method behind the result, distinguish estimates from official data, and identify important limits. Original studies state dataset scope and ranking logic so the analysis can be checked instead of treated as a black box.</p>
        <div className="mt-4 flex flex-wrap gap-2"><Link href="/methodology" className="btn btn-ghost">Methodology</Link><Link href="/data-sources" className="btn btn-ghost">Data sources</Link><Link href="/editorial-policy" className="btn btn-ghost">Editorial policy</Link></div>
      </section>

      <section className="mt-10 border-t border-line pt-8">
        <h2 className="font-display text-2xl font-bold">Selected guides</h2>
        <p className="mt-2 text-sm text-mute">Long-form MapBench articles edited under Aryan&apos;s editorial responsibility.</p>
        <div className="mt-5 space-y-6">
          {ALL_GUIDES.slice(0, 8).map((guide) => <article key={guide.slug} className="border-b border-line pb-5"><h3 className="font-display text-lg font-bold"><Link href={`/guides/${guide.slug}`} className="underline decoration-line underline-offset-4 hover:text-brand-strong">{guide.title}</Link></h3><p className="mt-2 text-sm leading-6 text-mute">{guide.description}</p><Link href={`/guides/${guide.slug}`} className="mt-2 inline-block text-xs font-extrabold text-brand-strong hover:underline">Read guide →</Link></article>)}
        </div>
      </section>

      <section className="mt-10 border-t border-line pt-8">
        <h2 className="font-display text-2xl font-bold">Original studies</h2>
        <p className="mt-2 text-sm text-mute">MapBench studies published under Aryan Khan&apos;s editorial oversight.</p>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">{STUDIES.map((study) => <Link key={study.slug} href={`/studies/${study.slug}`} className="card p-4"><div className="font-display font-bold">{study.title}</div><div className="mt-1 text-xs text-mute">{study.date}</div></Link>)}</div>
      </section>

      <section className="mt-10 rounded-xl border border-line bg-well/40 p-5">
        <h2 className="font-display text-xl font-bold">Corrections and contact</h2>
        <p className="mt-2 text-sm leading-relaxed text-mute">If you find a calculation issue, source problem or factual error, email <a href="mailto:contact@mapbench.site" className="font-semibold text-brand-strong hover:underline">contact@mapbench.site</a>. Technical tool issues can be sent to <a href="mailto:support@mapbench.site" className="font-semibold text-brand-strong hover:underline">support@mapbench.site</a>.</p>
      </section>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    </main>
  );
}
