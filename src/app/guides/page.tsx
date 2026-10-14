import type { Metadata } from "next";
import Link from "next/link";
import { ALL_GUIDES } from "@/data/allGuides";

export const metadata: Metadata = {
  title: "Mapping Guides, Geographic Methods & Field Notes",
  description: "Practical MapBench guides that explain map measurements, coordinates, GPS files, projections, drive-time areas and real-world geographic workflows with methods, caveats and examples.",
  alternates: { canonical: "/guides" },
};

const START_HERE = [
  {
    title: "Choosing the right distance method",
    text: "Radius, straight-line distance and drive time answer different questions. Learn which one fits a delivery zone, commute, service area or geographic comparison.",
    href: "/guides/radius-vs-drive-time-vs-straight-line-distance",
  },
  {
    title: "Measuring land area responsibly",
    text: "Understand how boundary tracing, units, projection and source imagery affect acreage and parcel-area estimates.",
    href: "/guides/how-to-measure-land-area-on-a-map",
  },
  {
    title: "Understanding map projections",
    text: "Learn why every flat world map distorts something and why projection choice matters for area, shape and distance.",
    href: "/guides/map-projections-explained",
  },
];

const wordCount = (text: string) => text.trim().split(/\s+/).filter(Boolean).length;
function guideReadMins(g: (typeof ALL_GUIDES)[number]) {
  const words = g.blocks.reduce((sum, block) => {
    if (block.t === "p" || block.t === "h2" || block.t === "note") return sum + wordCount(block.text);
    if (block.t === "ul") return sum + block.items.reduce((n, item) => n + wordCount(item), 0);
    if (block.t === "table") return sum + block.headers.reduce((n, h) => n + wordCount(h), 0) + block.rows.reduce((n, row) => n + row.reduce((x, cell) => x + wordCount(cell), 0), 0);
    return sum;
  }, 0);
  return Math.max(3, Math.ceil(words / 220));
}

export default function GuidesPage() {
  return (
    <div className="doc">
      <section className="mx-auto max-w-3xl">
        <p className="font-sans text-[11px] font-extrabold uppercase tracking-[0.14em] text-brand-strong">MapBench learning center</p>
        <h1 className="mt-2 font-display text-3xl font-bold tracking-tight sm:text-4xl">Mapping Guides & Geographic Methods</h1>
        <p className="mt-4 max-w-3xl text-[15px] leading-relaxed text-mute">
          MapBench is more than a directory of calculators. These guides explain the ideas behind the tools: what a measurement really means, when a method is appropriate, where errors come from, and how to use geographic data without giving a rough estimate more certainty than it deserves.
        </p>
      </section>

      <section className="mx-auto mt-10 max-w-3xl rounded-2xl border border-line bg-well/50 p-5 sm:p-6">
        <h2 className="font-display text-xl font-bold">Start with the question, not the tool</h2>
        <p className="mt-2 text-sm leading-relaxed text-mute">
          A useful map starts by defining the decision you need to make. These three guides cover common mistakes that affect distance, area and world-map interpretation.
        </p>
        <div className="mt-5 grid gap-3 md:grid-cols-3">
          {START_HERE.map((item) => (
            <Link key={item.href} href={item.href} className="card group p-4">
              <h3 className="font-display text-[16px] font-bold leading-snug group-hover:text-brand-strong">{item.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-mute">{item.text}</p>
              <span className="mt-3 block font-sans text-xs font-extrabold text-brand-strong">Read guide →</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="mx-auto mt-12 max-w-3xl">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="font-display text-2xl font-bold tracking-tight">All guides</h2>
            <p className="mt-2 text-sm leading-relaxed text-mute">
              Practical reference articles covering coordinates, GPS formats, distance, routing, map projections and location-based workflows. Each guide links to the relevant MapBench tools.
            </p>
          </div>
          <div className="shrink-0 font-sans text-xs font-bold text-mute">{ALL_GUIDES.length} guides</div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {ALL_GUIDES.map((g) => (
            <Link key={g.slug} href={`/guides/${g.slug}`} className="card group flex flex-col p-5 transition-colors hover:border-brand">
              <div className="text-xs font-bold uppercase tracking-wide text-mute">
                {new Date(g.date).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })} · {guideReadMins(g)} min read
              </div>
              <h3 className="mt-2 font-display text-lg font-bold leading-snug group-hover:text-brand-strong">{g.title}</h3>
              <p className="mt-2 line-clamp-4 text-sm leading-relaxed text-mute">{g.description}</p>
              <span className="mt-auto pt-4 text-sm font-bold text-brand-strong">Read →</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="mx-auto mt-12 max-w-3xl border-t border-line pt-8">
        <h2 className="font-display text-xl font-bold">How MapBench approaches geographic content</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-line bg-card p-4">
            <h3 className="font-sans text-sm font-extrabold">Methods before claims</h3>
            <p className="mt-2 text-sm leading-relaxed text-mute">We explain whether a result is geodesic, road-network based, browser-derived or dependent on an external public dataset.</p>
          </div>
          <div className="rounded-xl border border-line bg-card p-4">
            <h3 className="font-sans text-sm font-extrabold">Limitations in plain language</h3>
            <p className="mt-2 text-sm leading-relaxed text-mute">A precise-looking number can still be an estimate. Guides call out uncertainty, missing traffic, imagery limitations and cases where professional data is needed.</p>
          </div>
          <div className="rounded-xl border border-line bg-card p-4">
            <h3 className="font-sans text-sm font-extrabold">Real workflows</h3>
            <p className="mt-2 text-sm leading-relaxed text-mute">Content is organized around tasks such as planning a service area, comparing routes, converting GPS data or checking a parcel estimate.</p>
          </div>
          <div className="rounded-xl border border-line bg-card p-4">
            <h3 className="font-sans text-sm font-extrabold">Open-source context</h3>
            <p className="mt-2 text-sm leading-relaxed text-mute">Where a tool depends on public geographic services or datasets, we identify them on the data-sources and methodology pages.</p>
          </div>
        </div>
        <p className="mt-5 font-sans text-sm">
          <Link href="/methodology" className="font-extrabold text-brand-strong hover:underline">Read our methodology →</Link>
          <span className="mx-2 text-mute">·</span>
          <Link href="/data-sources" className="font-extrabold text-brand-strong hover:underline">See data sources →</Link>
          <span className="mx-2 text-mute">·</span>
          <Link href="/editorial-policy" className="font-extrabold text-brand-strong hover:underline">Editorial policy →</Link>
        </p>
      </section>
    </div>
  );
}
