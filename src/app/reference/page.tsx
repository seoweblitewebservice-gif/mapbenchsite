import type { Metadata } from "next";
import Link from "next/link";
import { REFERENCE_COUNTRIES } from "@/data/referenceCountries";

export const metadata: Metadata = {
  title: "Country Geography Reference — Area, Extent & Centroid",
  description: "Browse MapBench country reference pages with reproducible area, centroid, latitude/longitude extent, hemisphere and related map tools.",
  alternates: { canonical: "/reference" },
};

export default function ReferenceHub() {
  return (
    <main className="doc mx-auto max-w-5xl py-10">
      <header className="max-w-3xl">
        <p className="font-sans text-[11px] font-extrabold uppercase tracking-[0.14em] text-brand-strong">MapBench reference library</p>
        <h1 className="mt-2 font-display text-4xl font-bold tracking-tight">Country Geography Reference</h1>
        <p className="mt-4 text-lg leading-relaxed text-mute">Thirty high-interest country pages built from the same generalized public world geometry used by MapBench blank maps. Each page explains geographic extent, approximate area, centroid, hemisphere and practical interpretation.</p>
      </header>

      <section className="mt-8 rounded-xl border border-line bg-well/40 p-5">
        <h2 className="font-display text-xl font-bold">How these pages are different from an encyclopedia</h2>
        <p className="mt-2 text-sm leading-relaxed text-mute">The focus is measurable map geometry rather than general country facts. Values are calculated consistently from the source geometry so users can compare countries on the same basis. They are planning/reference values, not legal boundary or cadastral measurements.</p>
      </section>

      <section className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {REFERENCE_COUNTRIES.map((country) => (
          <Link key={country.slug} href={`/reference/${country.slug}`} className="card group p-5 transition-colors hover:border-brand">
            <h2 className="font-display text-lg font-bold group-hover:text-brand-strong">{country.name}</h2>
            <p className="mt-2 text-sm leading-relaxed text-mute">{country.focus}</p>
            <span className="mt-4 block font-sans text-sm font-extrabold text-brand-strong">Open reference →</span>
          </Link>
        ))}
      </section>

      <section className="mt-12 border-t border-line pt-8">
        <h2 className="font-display text-2xl font-bold">Source and method</h2>
        <p className="mt-3 max-w-3xl">Country geometry is read from the bundled world-atlas dataset, which is based on generalized public world boundary geometry suitable for small-scale visualization. MapBench calculates spherical area, centroid and coordinate bounds consistently from that geometry. Coastlines and borders are simplified, so official boundary questions should be checked with the relevant authority.</p>
      </section>
    </main>
  );
}
