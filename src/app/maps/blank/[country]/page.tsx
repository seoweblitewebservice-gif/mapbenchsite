import type { Metadata } from "next";
import Link from "next/link";
import MapsClient from "@/components/MapsClient";
import { geoArea, geoBounds, geoCentroid } from "d3-geo";
import { feature } from "topojson-client";
import countriesTopo from "world-atlas/countries-110m.json";

function slugify(value: string) {
  return value.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

type CountryFeature = GeoJSON.Feature<GeoJSON.Geometry, { name?: string }>;

const countries = feature(
  countriesTopo as any,
  (countriesTopo as any).objects.countries
) as unknown as GeoJSON.FeatureCollection<GeoJSON.Geometry, { name?: string }>;

const countryFeatures = countries.features.filter((f) => f.properties?.name) as CountryFeature[];
const countryNames = Array.from(new Set(countryFeatures.map((f) => f.properties!.name!))).sort((a, b) => a.localeCompare(b));

function getCountryFeature(slug: string) {
  return countryFeatures.find((f) => slugify(f.properties!.name!) === slug);
}

function countryStats(country: CountryFeature) {
  const [[west, south], [east, north]] = geoBounds(country);
  const [lon, lat] = geoCentroid(country);
  const sphericalArea = geoArea(country);
  const areaKm2 = (sphericalArea / (4 * Math.PI)) * 510072000;
  return { west, south, east, north, lon, lat, areaKm2 };
}

export function generateStaticParams() {
  return countryNames.map((name) => ({ country: slugify(name) }));
}

export async function generateMetadata({ params }: { params: Promise<{ country: string }> }): Promise<Metadata> {
  const { country } = await params;
  const name = getCountryFeature(country)?.properties?.name ?? country.replace(/-/g, " ");
  return {
    title: `${name} Blank Map — SVG & PNG`,
    description: `Free printable ${name} blank map with SVG and high-resolution PNG exports. Explore outline, labeled, colored and city map variants.`,
    alternates: { canonical: `/maps/blank/${country}` },
    robots: { index: true, follow: true },
    openGraph: {
      title: `${name} Blank Map — SVG & PNG | MapBench`,
      description: `Explore and export a printable ${name} map in your browser.`,
      type: "website",
    },
  };
}

export default async function CountryMapPage({ params }: { params: Promise<{ country: string }> }) {
  const { country } = await params;
  const mapFeature = getCountryFeature(country);

  if (!mapFeature) {
    return (
      <div className="doc mx-auto max-w-3xl py-12">
        <h1 className="font-display text-3xl font-bold">Map not found</h1>
        <p className="mt-3 text-mute">This blank-map page is not available.</p>
        <Link href="/maps" className="mt-5 inline-block font-sans text-sm font-extrabold text-brand-strong hover:underline">Browse all maps →</Link>
      </div>
    );
  }

  const name = mapFeature.properties!.name!;
  const stats = countryStats(mapFeature);
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "WebPage",
      name: `${name} Blank Map`,
      description: `Free printable ${name} blank map with browser-based SVG and PNG export options.`,
      url: `https://www.mapbench.site/maps/blank/${country}`,
      isPartOf: { "@type": "WebSite", name: "MapBench", url: "https://www.mapbench.site" },
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "MapBench", item: "https://www.mapbench.site" },
        { "@type": "ListItem", position: 2, name: "Maps", item: "https://www.mapbench.site/maps" },
        { "@type": "ListItem", position: 3, name: `${name} Blank Map` },
      ],
    },
  ];

  return (
    <div className="doc mx-auto max-w-5xl py-8">
      <nav className="mb-5 text-xs text-mute"><Link href="/">Home</Link> / <Link href="/maps">Maps</Link> / <span>{name}</span></nav>
      <header className="max-w-3xl">
        <p className="font-sans text-[11px] font-extrabold uppercase tracking-[0.14em] text-brand-strong">Printable blank map</p>
        <h1 className="mt-2 font-display text-4xl font-bold tracking-tight">{name} Blank Map</h1>
        <p className="mt-4 text-lg leading-relaxed text-mute">Explore a clean outline of {name}, inspect its geographic extent, and export a map for worksheets, presentations, labeling or design work.</p>
      </header>

      <section className="mt-8"><MapsClient initialMapSlug={`c-${name}`} /></section>

      <section className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="card p-4"><div className="text-xs font-extrabold uppercase text-mute">Approx. area</div><div className="mt-1 font-display text-xl font-bold">{Math.round(stats.areaKm2).toLocaleString()} km²</div></div>
        <div className="card p-4"><div className="text-xs font-extrabold uppercase text-mute">Centroid latitude</div><div className="mt-1 font-display text-xl font-bold">{stats.lat.toFixed(2)}°</div></div>
        <div className="card p-4"><div className="text-xs font-extrabold uppercase text-mute">Centroid longitude</div><div className="mt-1 font-display text-xl font-bold">{stats.lon.toFixed(2)}°</div></div>
        <div className="card p-4"><div className="text-xs font-extrabold uppercase text-mute">Geographic extent</div><div className="mt-1 text-sm text-mute">{stats.south.toFixed(1)}° to {stats.north.toFixed(1)}° latitude</div></div>
      </section>

      <section className="mt-12 border-t border-line pt-10">
        <h2 className="sect-h">What this blank map is useful for</h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <div className="card p-5"><h3 className="font-display text-lg font-bold">Worksheets and teaching</h3><p className="mt-2 text-sm leading-relaxed text-mute">Use the outline for geography exercises, labeling practice, quizzes and classroom handouts.</p></div>
          <div className="card p-5"><h3 className="font-display text-lg font-bold">Presentations and reports</h3><p className="mt-2 text-sm leading-relaxed text-mute">Export a clean base map and add locations, routes, territories or annotations for your own project.</p></div>
          <div className="card p-5"><h3 className="font-display text-lg font-bold">Design and planning</h3><p className="mt-2 text-sm leading-relaxed text-mute">Start from a simplified country outline when you need a reusable visual rather than a detailed navigation map.</p></div>
          <div className="card p-5"><h3 className="font-display text-lg font-bold">Geographic context</h3><p className="mt-2 text-sm leading-relaxed text-mute">The extent and centroid summaries provide quick context for where the country sits and how large its geometry is in the source dataset.</p></div>
        </div>
      </section>

      <section className="mt-12 border-t border-line pt-10">
        <h2 className="sect-h">Accuracy and source note</h2>
        <p className="mt-3 max-w-3xl">The outline comes from generalized public world-map geometry intended for visualization, not cadastral, legal or surveying use. Coastlines and borders are simplified at this scale, and disputed boundaries may be represented differently by official authorities. Verify official boundary questions with the relevant national or international source.</p>
      </section>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    </div>
  );
}
