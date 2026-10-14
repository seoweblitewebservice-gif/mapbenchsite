import type { Metadata } from "next";
import Link from "next/link";
import { STUDIES } from "@/data/studies";

export const metadata: Metadata = {
  title: "Original Geographic Studies & Data Notes",
  description: "Original MapBench geographic studies built from transparent datasets and reproducible calculations, with methods, caveats and supporting tools.",
  alternates: { canonical: "/studies" },
};

export default function StudiesPage() {
  return (
    <div className="doc mx-auto max-w-5xl">
      <nav aria-label="Breadcrumb" className="mb-4 text-xs text-mute">
        <Link href="/" className="hover:text-brand-strong">Home</Link> / Studies
      </nav>
      <p className="font-sans text-[11px] font-extrabold uppercase tracking-[0.14em] text-brand-strong">MapBench research</p>
      <h1 className="mt-2 font-display text-3xl font-bold tracking-tight sm:text-4xl">Original Geographic Studies</h1>
      <p className="mt-4 max-w-3xl text-base leading-relaxed text-mute">
        These studies use MapBench&apos;s own documented datasets and geographic calculations to answer questions that are easier to understand when the full method is visible. Each page shows the ranking, the formula, the dataset scope and the important limitations.
      </p>

      <section className="mt-8 rounded-2xl border border-brand/25 bg-brand-soft/35 p-6">
        <p className="font-sans text-[10px] font-extrabold uppercase tracking-[0.14em] text-brand-strong">Featured US geography study</p>
        <h2 className="mt-2 font-display text-2xl font-bold">How Far Is Each State Capital From the Geographic Center of Its State?</h2>
        <p className="mt-3 max-w-3xl text-sm leading-relaxed text-mute">A 50-state comparison using Census-derived state geometry, geographic centroids and great-circle distance from each capital. Every state row links to its dedicated county map.</p>
        <div className="mt-4 flex flex-wrap gap-3"><Link href="/studies/state-capital-radius" className="btn btn-primary">Read the state capital study →</Link><Link href="/states" className="btn btn-ghost">Browse US states</Link></div>
      </section>

      <div className="mt-8 grid gap-5 md:grid-cols-3">
        {STUDIES.map((study) => (
          <Link key={study.slug} href={`/studies/${study.slug}`} className="card group p-5 transition-colors hover:border-brand">
            <div className="text-[10px] font-extrabold uppercase tracking-wide text-mute">Original study · {study.date}</div>
            <h2 className="mt-2 font-display text-xl font-bold leading-snug group-hover:text-brand-strong">{study.title}</h2>
            <p className="mt-3 text-sm leading-relaxed text-mute">{study.description}</p>
            <span className="mt-5 block font-sans text-sm font-extrabold text-brand-strong">Read study →</span>
          </Link>
        ))}
      </div>

      <section className="mt-10 rounded-xl border border-line bg-well/40 p-6">
        <h2 className="font-display text-2xl font-bold">How MapBench studies are built</h2>
        <p className="mt-3">The goal is not to turn rough datasets into dramatic claims. We publish only questions the available data can answer transparently, show the exact comparison method, and separate dataset-based rankings from official statistics.</p>
        <ul className="mt-4 list-disc space-y-2 pl-6">
          <li>Coordinates and population values come from the documented MapBench datasets identified on each study.</li>
          <li>Distances use the same great-circle methods documented on the Methodology page where that method applies.</li>
          <li>Rankings describe the stated dataset and geometry, not facts beyond that dataset.</li>
          <li>Readers can reproduce or explore the core measurement with linked MapBench tools and reference pages.</li>
        </ul>
        <p className="mt-4 font-sans text-sm"><Link href="/methodology" className="font-extrabold text-brand-strong hover:underline">Methodology →</Link><span className="mx-2 text-mute">·</span><Link href="/data-sources" className="font-extrabold text-brand-strong hover:underline">Data sources →</Link><span className="mx-2 text-mute">·</span><Link href="/corrections" className="font-extrabold text-brand-strong hover:underline">Corrections →</Link></p>
      </section>
    </div>
  );
}
