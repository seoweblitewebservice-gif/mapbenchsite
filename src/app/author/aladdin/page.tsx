import type { Metadata } from "next";
import Link from "next/link";
import { ALL_GUIDES } from "@/data/allGuides";
import { STUDIES } from "@/data/studies";

export const metadata: Metadata = {
  title: "Aladdin — Founder & Editor of MapBench",
  description: "Meet Aladdin, founder and editor of MapBench, responsible for tool direction, geographic methodology review, editorial standards and corrections.",
  alternates: { canonical: "/author/aladdin" },
};

export default function AladdinAuthorPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    "@id": "https://www.mapbench.site/author/aladdin#person",
    name: "Aladdin",
    url: "https://www.mapbench.site/author/aladdin",
    jobTitle: "Founder & Editor of MapBench",
    worksFor: { "@type": "Organization", name: "MapBench", url: "https://www.mapbench.site" },
    knowsAbout: ["Web mapping", "Geographic calculations", "Coordinate systems", "Geodesics", "Open geographic data", "GIS file formats", "Routing concepts"],
  };

  return (
    <main className="doc mx-auto max-w-4xl py-10">
      <header className="max-w-3xl">
        <p className="font-sans text-[11px] font-extrabold uppercase tracking-[0.14em] text-brand-strong">MapBench author profile</p>
        <h1 className="mt-2 font-display text-4xl font-bold tracking-tight">Aladdin</h1>
        <p className="mt-2 font-sans text-sm font-semibold text-mute">Founder &amp; Editor of MapBench</p>
        <p className="mt-5 text-lg leading-relaxed text-mute">Aladdin leads MapBench&apos;s tool direction, editorial standards, methodology review and corrections process. His focus is practical web mapping: making geographic calculations understandable, reproducible and honest about their limitations.</p>
      </header>

      <section className="mt-10 grid gap-4 sm:grid-cols-2">
        <div className="card p-5"><h2 className="font-display text-xl font-bold">Areas of focus</h2><p className="mt-2 text-sm leading-relaxed text-mute">Coordinate systems, geodesic distance, radius and area measurement, open map data, routing concepts, GPS/map file formats, browser-based GIS workflows and geographic reference content.</p></div>
        <div className="card p-5"><h2 className="font-display text-xl font-bold">Editorial responsibility</h2><p className="mt-2 text-sm leading-relaxed text-mute">Reviews how MapBench explains formulas, source data, limitations and uncertainty. Valid factual or calculation errors are corrected through the site&apos;s published corrections policy.</p></div>
      </section>

      <section className="mt-10 border-t border-line pt-8">
        <h2 className="font-display text-2xl font-bold">How MapBench content is reviewed</h2>
        <p className="mt-3">MapBench does not treat a calculated number as automatically authoritative. Tool pages identify the method behind the result, distinguish estimates from official data, and point users to primary or professional sources when a question is legal, surveying, engineering, emergency-related or otherwise high stakes.</p>
        <p className="mt-3">For original studies, the dataset scope and ranking method are stated explicitly so readers can reproduce the analysis and understand what the result does—and does not—claim.</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link href="/methodology" className="btn btn-ghost">Methodology</Link>
          <Link href="/data-sources" className="btn btn-ghost">Data sources</Link>
          <Link href="/editorial-policy" className="btn btn-ghost">Editorial policy</Link>
        </div>
      </section>

      <section className="mt-10 border-t border-line pt-8">
        <h2 className="font-display text-2xl font-bold">Original studies</h2>
        <p className="mt-2 text-sm text-mute">Studies published under Aladdin&apos;s editorial oversight.</p>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {STUDIES.slice(0, 8).map((study) => <Link key={study.slug} href={`/studies/${study.slug}`} className="card p-4"><div className="font-display font-bold">{study.title}</div><div className="mt-1 text-xs text-mute">{study.date}</div></Link>)}
        </div>
      </section>

      <section className="mt-10 border-t border-line pt-8">
        <h2 className="font-display text-2xl font-bold">Selected guides</h2>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {ALL_GUIDES.slice(0, 6).map((guide) => <Link key={guide.slug} href={`/guides/${guide.slug}`} className="card p-4"><div className="font-display font-bold">{guide.title}</div><div className="mt-1 text-xs text-mute">{guide.readMins} min read</div></Link>)}
        </div>
      </section>

      <section className="mt-10 rounded-xl border border-line bg-well/40 p-5">
        <h2 className="font-display text-xl font-bold">Corrections and contact</h2>
        <p className="mt-2 text-sm leading-relaxed text-mute">If you find a calculation issue, source problem or factual error, contact MapBench at <a href="mailto:contact@mapbench.site" className="font-semibold text-brand-strong hover:underline">contact@mapbench.site</a>. Technical tool issues can be sent to <a href="mailto:support@mapbench.site" className="font-semibold text-brand-strong hover:underline">support@mapbench.site</a>.</p>
      </section>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    </main>
  );
}
