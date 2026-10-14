import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import MapsClient from "@/components/MapsClient";
import { geoArea, geoBounds, geoCentroid } from "d3-geo";
import { feature } from "topojson-client";
import countriesTopo from "world-atlas/countries-110m.json";

function slugify(value: string) {
  return value.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

type CountryFeature = GeoJSON.Feature<GeoJSON.Geometry, { name?: string }>;

const countries = feature(countriesTopo as any,(countriesTopo as any).objects.countries) as unknown as GeoJSON.FeatureCollection<GeoJSON.Geometry, { name?: string }>;
const countryFeatures = countries.features.filter((f) => f.properties?.name) as CountryFeature[];
const countryNames = Array.from(new Set(countryFeatures.map((f) => f.properties!.name!))).sort((a, b) => a.localeCompare(b));
function getCountryFeature(slug: string) { return countryFeatures.find((f) => slugify(f.properties!.name!) === slug); }
function countryStats(country: CountryFeature) {
  const [[west, south], [east, north]] = geoBounds(country);
  const [lon, lat] = geoCentroid(country);
  const sphericalArea = geoArea(country);
  const areaKm2 = (sphericalArea / (4 * Math.PI)) * 510072000;
  return { west, south, east, north, lon, lat, areaKm2, widthDeg: east-west, heightDeg: north-south };
}
export function generateStaticParams() { return countryNames.map((name) => ({ country: slugify(name) })); }

export async function generateMetadata({ params }: { params: Promise<{ country: string }> }): Promise<Metadata> {
  const { country } = await params;
  const mapFeature = getCountryFeature(country);
  if (!mapFeature) return { robots: { index: false, follow: false } };
  const name = mapFeature.properties!.name!;
  return {
    title: `${name} Blank Map — Printable SVG & PNG`,
    description: `Free printable ${name} blank map with SVG and high-resolution PNG exports, geographic facts, extent, centroid and source notes.`,
    alternates: { canonical: `/maps/blank/${country}` },
    robots: { index: true, follow: true },
    openGraph: {
      title: `${name} Blank Map — Printable SVG & PNG | MapBench`,
      description: `Explore and export a printable ${name} map in your browser.`,
      type: "website",
      url: `https://www.mapbench.site/maps/blank/${country}`,
    },
  };
}

export default async function CountryMapPage({ params }: { params: Promise<{ country: string }> }) {
  const { country } = await params;
  const mapFeature = getCountryFeature(country);
  if (!mapFeature) notFound();

  const name = mapFeature.properties!.name!;
  const stats = countryStats(mapFeature);
  const hemisphere = `${stats.lat >= 0 ? "Northern" : "Southern"} & ${stats.lon >= 0 ? "Eastern" : "Western"}`;
  const countryIndex = countryNames.indexOf(name);
  const relatedNames = [
    countryNames[(countryIndex + countryNames.length - 1) % countryNames.length],
    countryNames[(countryIndex + 1) % countryNames.length],
    countryNames[(countryIndex + 7) % countryNames.length],
    countryNames[(countryIndex + 19) % countryNames.length],
    countryNames[(countryIndex + 37) % countryNames.length],
    countryNames[(countryIndex + 71) % countryNames.length],
  ].filter((item, index, array) => item !== name && array.indexOf(item) === index);

  const faqs: [string,string][] = [
    [`Can I print this ${name} map?`, `Yes. Use the export controls to create a clean map for worksheets, presentations or personal reference.`],
    ["Is the outline suitable for legal boundary work?", "No. The geometry is generalized for visualization and should not be used for cadastral, legal, surveying or boundary-dispute decisions."],
    ["How is the area calculated?", "MapBench estimates spherical area from the source geometry. The result is useful for geographic context, not an official land-area statistic."],
  ];
  const jsonLd = [
    { "@context":"https://schema.org","@type":"WebPage",name:`${name} Blank Map`,description:`Free printable ${name} blank map with browser-based SVG and PNG export options.`,url:`https://www.mapbench.site/maps/blank/${country}`,dateModified:"2026-10-14",author:{"@type":"Person",name:"Aryan Khan",url:"https://www.mapbench.site/author/aryan-khan"},isPartOf:{"@type":"CollectionPage",name:"MapBench Blank Map Library",url:"https://www.mapbench.site/maps"} },
    { "@context":"https://schema.org","@type":"BreadcrumbList",itemListElement:[{"@type":"ListItem",position:1,name:"MapBench",item:"https://www.mapbench.site"},{"@type":"ListItem",position:2,name:"Blank Maps",item:"https://www.mapbench.site/maps"},{"@type":"ListItem",position:3,name:`${name} Blank Map`,item:`https://www.mapbench.site/maps/blank/${country}`}]},
    { "@context":"https://schema.org","@type":"FAQPage",mainEntity:faqs.map(([q,a])=>({"@type":"Question",name:q,acceptedAnswer:{"@type":"Answer",text:a}})) },
  ];

  return <div className="doc mx-auto max-w-5xl py-8">
    <nav aria-label="Breadcrumb" className="mb-5 text-xs text-mute"><Link href="/">Home</Link> / <Link href="/maps">Blank Maps</Link> / <span>{name}</span></nav>
    <header className="max-w-3xl"><p className="font-sans text-[11px] font-extrabold uppercase tracking-[0.14em] text-brand-strong">Printable blank map</p><h1 className="mt-2 font-display text-4xl font-bold tracking-tight">{name} Blank Map</h1><p className="mt-4 text-lg leading-relaxed text-mute">Explore a clean outline of {name}, inspect geographic reference facts, and export a map for worksheets, presentations, labeling or design work.</p><p className="mt-3 text-sm text-mute">Reference page reviewed 14 Oct 2026 by <Link href="/author/aryan-khan" className="font-semibold text-brand-strong hover:underline">Aryan Khan</Link> · <Link href="/data-sources" className="font-semibold text-brand-strong hover:underline">data sources</Link> · <Link href="/corrections" className="font-semibold text-brand-strong hover:underline">corrections</Link>.</p></header>

    <section className="mt-8"><MapsClient initialMapSlug={`c-${name}`} /></section>

    <section className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <div className="card p-4"><div className="text-xs font-extrabold uppercase text-mute">Approx. area</div><div className="mt-1 font-display text-xl font-bold">{Math.round(stats.areaKm2).toLocaleString()} km²</div></div>
      <div className="card p-4"><div className="text-xs font-extrabold uppercase text-mute">Centroid</div><div className="mt-1 font-display text-lg font-bold">{stats.lat.toFixed(2)}°, {stats.lon.toFixed(2)}°</div></div>
      <div className="card p-4"><div className="text-xs font-extrabold uppercase text-mute">Hemisphere</div><div className="mt-1 font-display text-lg font-bold">{hemisphere}</div></div>
      <div className="card p-4"><div className="text-xs font-extrabold uppercase text-mute">Extent</div><div className="mt-1 text-sm text-mute">{stats.south.toFixed(1)}°–{stats.north.toFixed(1)}° lat · {stats.west.toFixed(1)}°–{stats.east.toFixed(1)}° lon</div></div>
    </section>

    <section className="mt-12 border-t border-line pt-10"><h2 className="sect-h">Quick geographic reference</h2><div className="mt-5 grid gap-4 sm:grid-cols-2"><div className="card p-5"><h3 className="font-display text-lg font-bold">North–south span</h3><p className="mt-2 text-sm text-mute">About {Math.abs(stats.heightDeg).toFixed(1)}° of latitude in the generalized source geometry.</p></div><div className="card p-5"><h3 className="font-display text-lg font-bold">East–west span</h3><p className="mt-2 text-sm text-mute">About {Math.abs(stats.widthDeg).toFixed(1)}° of longitude in the generalized source geometry.</p></div></div><p className="mt-4 max-w-3xl text-sm text-mute">These figures describe the geometry used on this page. They are reference measurements rather than official national statistics, and longitude span is not the same as ground width because longitude scale varies with latitude.</p></section>

    <section className="mt-12 border-t border-line pt-10"><h2 className="sect-h">What this {name} blank map is useful for</h2><div className="mt-5 grid gap-4 sm:grid-cols-2"><div className="card p-5"><h3 className="font-display text-lg font-bold">Worksheets and teaching</h3><p className="mt-2 text-sm leading-relaxed text-mute">Use the {name} outline for geography exercises, labeling practice, quizzes and classroom handouts.</p></div><div className="card p-5"><h3 className="font-display text-lg font-bold">Presentations and reports</h3><p className="mt-2 text-sm leading-relaxed text-mute">Export a clean {name} base map and add locations, routes, territories or annotations for your own project.</p></div><div className="card p-5"><h3 className="font-display text-lg font-bold">Design and planning</h3><p className="mt-2 text-sm leading-relaxed text-mute">Start from a simplified country outline when you need a reusable visual rather than a detailed navigation map.</p></div><div className="card p-5"><h3 className="font-display text-lg font-bold">Geographic context</h3><p className="mt-2 text-sm leading-relaxed text-mute">The {name} extent, centroid and approximate area summaries provide quick context for the exact geometry rendered on this page.</p></div></div></section>

    <section className="mt-12 border-t border-line pt-10"><h2 className="sect-h">Related country blank maps</h2><p className="mt-3 max-w-3xl text-sm text-mute">Continue through the blank-map library without returning to a generic map selector. Each link below opens another canonical country page.</p><div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{relatedNames.map((related) => <Link key={related} href={`/maps/blank/${slugify(related)}`} className="card p-4 font-display font-bold transition hover:border-brand hover:text-brand-strong">{related} Blank Map →</Link>)}</div><p className="mt-5"><Link href="/maps#country-maps" className="font-sans text-sm font-extrabold text-brand-strong hover:underline">Browse all country maps →</Link></p></section>

    <section className="mt-12 border-t border-line pt-10"><h2 className="sect-h">Related MapBench resources</h2><div className="mt-4 flex flex-wrap gap-2"><Link href="/tools/map-area-calculator" className="btn btn-ghost">Map Area Calculator</Link><Link href="/tools/latitude-longitude-finder" className="btn btn-ghost">Latitude & Longitude Finder</Link><Link href="/guides/map-projections-explained" className="btn btn-ghost">Map Projections Guide</Link><Link href="/reference" className="btn btn-ghost">Country Reference Library</Link><Link href="/maps" className="btn btn-ghost">All Blank Maps</Link></div></section>

    <section className="mt-12 border-t border-line pt-10"><h2 className="sect-h">Accuracy and source note</h2><p className="mt-3 max-w-3xl">The outline comes from generalized public world-map geometry intended for visualization, not cadastral, legal or surveying use. Coastlines and borders are simplified at this scale, and disputed boundaries may be represented differently by official authorities. Verify official boundary questions with the relevant national or international source.</p></section>

    <section className="mt-12 border-t border-line pt-10"><h2 className="sect-h">Frequently asked questions</h2><div className="mt-5 divide-y divide-line rounded-xl border border-line bg-card">{faqs.map(([q,a])=><details key={q} className="px-5 py-4"><summary className="cursor-pointer font-semibold">{q}</summary><p className="mt-3 text-sm text-mute">{a}</p></details>)}</div></section>

    <script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(jsonLd)}} />
  </div>;
}
