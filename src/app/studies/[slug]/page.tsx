import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { STUDIES, antipodeRows, density500Rows, getStudy, isolationRows } from "@/data/studies";

export function generateStaticParams() {
  return STUDIES.map((study) => ({ slug: study.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const study = getStudy(slug);
  if (!study) return {};
  return {
    title: study.title,
    description: study.description,
    alternates: { canonical: `/studies/${study.slug}` },
    openGraph: { type: "article", title: study.title, description: study.description },
  };
}

function MethodBox({ children }: { children: React.ReactNode }) {
  return <section className="rounded-xl border border-line bg-well/40 p-5"><h2 className="font-display text-2xl font-bold">Method</h2><div className="mt-3 space-y-3 text-sm leading-relaxed text-mute">{children}</div></section>;
}

export default async function StudyPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const study = getStudy(slug);
  if (!study) notFound();

  return (
    <article className="doc mx-auto max-w-4xl">
      <nav aria-label="Breadcrumb" className="mb-4 text-xs text-mute"><Link href="/" className="hover:text-brand-strong">Home</Link> / <Link href="/studies" className="hover:text-brand-strong">Studies</Link> / <span className="text-ink">{study.title}</span></nav>
      <p className="font-sans text-[11px] font-extrabold uppercase tracking-[0.14em] text-brand-strong">Original MapBench study · {study.date}</p>
      <h1 className="mt-2 font-display text-3xl font-bold tracking-tight sm:text-4xl">{study.title}</h1>
      <p className="mt-4 text-lg leading-relaxed text-mute">{study.description}</p>
      <div className="mt-6 rounded-lg border border-line bg-card p-4"><strong>Research question:</strong> {study.question}</div>

      {study.slug === "most-isolated-major-cities" && <IsolationStudy />}
      {study.slug === "major-city-density-within-500km" && <DensityStudy />}
      {study.slug === "closest-major-cities-to-antipodes" && <AntipodeStudy />}

      <section className="mt-10 border-t border-line pt-8">
        <h2 className="font-display text-2xl font-bold">Important caveat</h2>
        <p className="mt-3">This is a ranking inside MapBench&apos;s curated major-city dataset, not a complete census of every settlement on Earth. A city can rank as isolated here even when smaller cities and towns exist nearby. Population values are approximate and are not used to determine isolation or antipode distance.</p>
        <p className="mt-3">The study is useful for comparing the dataset consistently and demonstrating geographic methods. It should not be cited as an official global urban ranking without this scope note.</p>
      </section>

      <section className="mt-8 rounded-xl border border-line bg-card p-5">
        <h2 className="font-display text-xl font-bold">Reproduce the measurements</h2>
        <p className="mt-2 text-sm leading-relaxed text-mute">Use the same underlying tools to check individual pairs and explore your own examples.</p>
        <div className="mt-4 flex flex-wrap gap-2 font-sans text-sm">
          <Link href="/tools/distance-between-two-places" className="btn btn-ghost">Distance Between Two Places</Link>
          <Link href="/tools/cities-within-radius" className="btn btn-ghost">Cities Within Radius</Link>
          <Link href="/tools/antipode-finder" className="btn btn-ghost">Antipode Finder</Link>
          <Link href="/methodology" className="btn btn-ghost">Methodology</Link>
        </div>
      </section>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "Article",
        headline: study.title,
        description: study.description,
        datePublished: study.date,
        dateModified: study.date,
        author: { "@type": "Organization", name: "MapBench" },
        publisher: { "@type": "Organization", name: "MapBench", url: "https://www.mapbench.site" },
        mainEntityOfPage: `https://www.mapbench.site/studies/${study.slug}`,
      }) }} />
    </article>
  );
}

function IsolationStudy() {
  const rows = isolationRows(20);
  const top = rows[0];
  return <div className="mt-10 space-y-8">
    <section><h2 className="font-display text-2xl font-bold">What the ranking shows</h2><p className="mt-3">For each city, MapBench measures the great-circle distance to every other city in the dataset, keeps the shortest of those distances, then sorts cities from the largest nearest-neighbour distance to the smallest. A higher number means the city sits farther from its nearest peer in this dataset.</p><p className="mt-3"><strong>{top.city.name}</strong> ranks first in this dataset, with its nearest listed major-city peer being <strong>{top.nearest.name}</strong> at about <strong>{Math.round(top.km).toLocaleString("en-US")} km</strong>.</p></section>
    <StudyTable headers={["Rank", "City", "Country", "Nearest dataset city", "Distance"]} rows={rows.map((r, i) => [String(i + 1), r.city.name, r.city.country, r.nearest.name, `${Math.round(r.km).toLocaleString("en-US")} km`])} />
    <MethodBox><p>We calculate every city-to-city pair using MapBench&apos;s standard haversine great-circle function on the WGS84 mean sphere (radius 6,371.0088 km). For each origin city, only the minimum pair distance is retained.</p><p>No road distance, flight schedule or political boundary is involved. This is geometric separation between city-centre coordinates.</p></MethodBox>
  </div>;
}

function DensityStudy() {
  const rows = density500Rows(20);
  const top = rows[0];
  return <div className="mt-10 space-y-8">
    <section><h2 className="font-display text-2xl font-bold">What the ranking shows</h2><p className="mt-3">This study counts how many other cities from the same dataset fall within a 500 km great-circle radius of each city. It measures dataset clustering, not metropolitan population density.</p><p className="mt-3"><strong>{top.city.name}</strong> has the highest count in this comparison, with <strong>{top.count}</strong> other dataset cities inside 500 km.</p></section>
    <StudyTable headers={["Rank", "City", "Country", "Cities within 500 km", "Examples nearby"]} rows={rows.map((r, i) => [String(i + 1), r.city.name, r.city.country, String(r.count), r.nearestNames.join(", ") || "—"])} />
    <MethodBox><p>For each city, we calculate great-circle distance to every other dataset city and count peers at or below 500 km. The threshold is fixed for all cities.</p><p>The population sum is calculated internally as a secondary check, but the published ranking is ordered primarily by the number of nearby dataset cities.</p></MethodBox>
  </div>;
}

function AntipodeStudy() {
  const rows = antipodeRows(20);
  const top = rows[0];
  return <div className="mt-10 space-y-8">
    <section><h2 className="font-display text-2xl font-bold">What the ranking shows</h2><p className="mt-3">Every point on Earth has an antipode: the point exactly opposite it through the planet. We calculate each city&apos;s antipode, then find the nearest city in the dataset to that opposite point.</p><p className="mt-3"><strong>{top.city.name}</strong> has the closest dataset match to its antipode in this comparison: <strong>{top.nearest.name}</strong> is about <strong>{Math.round(top.km).toLocaleString("en-US")} km</strong> from the exact opposite point.</p></section>
    <StudyTable headers={["Rank", "Origin city", "Country", "Nearest city to antipode", "Miss distance"]} rows={rows.map((r, i) => [String(i + 1), r.city.name, r.city.country, `${r.nearest.name}, ${r.nearest.country}`, `${Math.round(r.km).toLocaleString("en-US")} km`])} />
    <MethodBox><p>The antipode formula flips latitude and shifts longitude by 180°, normalized back into the −180° to 180° range. We then measure great-circle distance from that antipode to every other city in the dataset and keep the nearest match.</p><p>A small miss distance does not mean the two original cities are exactly opposite each other; it means the second city lies close to the first city&apos;s exact antipodal point.</p></MethodBox>
  </div>;
}

function StudyTable({ headers, rows }: { headers: string[]; rows: string[][] }) {
  return <div className="overflow-x-auto"><table className="tbl min-w-[700px]"><thead><tr>{headers.map((h) => <th key={h}>{h}</th>)}</tr></thead><tbody>{rows.map((row, i) => <tr key={i}>{row.map((cell, j) => <td key={j}>{cell}</td>)}</tr>)}</tbody></table></div>;
}
