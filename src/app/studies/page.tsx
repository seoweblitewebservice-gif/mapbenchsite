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
          <li>Coordinates and population values come from the documented MapBench major-city dataset where that dataset is used.</li>
          <li>Distances use the same WGS84 mean-sphere great-circle method documented on the Methodology page.</li>
          <li>Rankings describe the dataset, not every city on Earth.</li>
          <li>Readers can reproduce the core measurement with the linked MapBench tools.</li>
        </ul>
        <p className="mt-4 font-sans text-sm"><Link href="/methodology" className="font-extrabold text-brand-strong hover:underline">Methodology →</Link><span className="mx-2 text-mute">·</span><Link href="/data-sources" className="font-extrabold text-brand-strong hover:underline">Data sources →</Link></p>
      </section>
    </div>
  );
}
