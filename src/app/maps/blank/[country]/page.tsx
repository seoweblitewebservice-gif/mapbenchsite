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
      <div className="doc mx-auto max-w-3xl py-10">
        <h1 className="font-display text-3xl font-bold">Map not found</h1>
        <p className="mt-3 text-mute">This country map is not available in the current outline dataset.</p>
        <Link href="/maps" className="mt-5 inline-block font-bold text-brand-strong hover:underline">Browse blank maps →</Link>
      </div>
    );
  }

  const name = mapFeature.properties!.name!;
  const stats = countryStats(mapFeature);
  const related = countryNames.filter((n) => n !== name).slice(0, 8);

  const faq: [string, string][] = [
    [`Can I download a blank ${name} map?`, `Yes. Use the map controls to export printable versions where available, including vector-friendly SVG and high-resolution image formats.`],
    [`Is this ${name} map suitable for education and presentations?`, `Yes. The blank outline is intended for worksheets, presentations, labeling exercises and general geographic reference.`],
    [`Are the borders on this map legally authoritative?`, `No. The page is intended for general mapping and education. Border and territory questions should be checked against the relevant official authority.`],
  ];

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "WebPage",
      name: `${name} Blank Map`,
      url: `https://www.mapbench.site/maps/blank/${country}`,
      description: `Printable blank map of ${name} with downloadable formats and geographic context.`,
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faq.map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })),
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

      <section className="mt-8"><MapsClient initialMap={`c-${name}`} /></section>

      <section className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="card p-4"><div className="text-xs font-extrabold uppercase text-mute">Approx. area</div><div className="mt-1 font-display text-xl font-bold">{Math.round(stats.areaKm2).toLocaleString()} km²</div></div>
        <div className="card p-4"><div className="text-xs font-extrabold uppercase text-mute">Centroid latitude</div><div className="mt-1 font-display text-xl font-bold">{stats.lat.toFixed(2)}°</div></div>
        <div className="card p-4"><div className="text-xs font-extrabold uppercase text-mute">Centroid longitude</div><div className="mt-1 font-display text-xl font-bold">{stats.lon.toFixed(2)}°</div></div>
        <div className="card p-4"><div className="text-xs font-extrabold uppercase text-mute">Geographic extent</div><div className="mt-1 text-sm text-mute">{stats.south.toFixed(1)}° to {stats.north.toFixed(1)}° latitude</div></div>
      </section>

      <section className="mt-12 max-w-3xl">
        <h2 className="sect-h">How to use this blank map</h2>
        <p className="mt-3">Blank maps are useful when the geography itself should remain visible without distracting labels. Teachers can use them for country-location exercises, students can annotate regions or cities, and designers can use the outline as a base for simple thematic graphics.</p>
        <p className="mt-3">For analytical work, treat the outline as a general-purpose geographic representation rather than a cadastral or legal boundary product. Small islands and detailed coastlines may be generalized by the source dataset.</p>
      </section>

      <section className="mt-12 max-w-3xl">
        <h2 className="sect-h">Map accuracy and limitations</h2>
        <p className="mt-3">The outline is derived from a generalized world geographic dataset intended for cartography and visualization. Generalization keeps maps lightweight and readable, but it means coastlines and borders are simplified compared with high-resolution official mapping.</p>
        <p className="mt-3">For legal, diplomatic, surveying or regulatory questions, use the relevant government or authoritative geographic source.</p>
      </section>

      <section className="mt-12 max-w-3xl">
        <h2 className="sect-h">Frequently asked questions</h2>
        <div className="mt-4 space-y-4">{faq.map(([q, a]) => <div key={q} className="card p-4"><h3 className="font-bold">{q}</h3><p className="mt-2 text-sm text-mute">{a}</p></div>)}</div>
      </section>

      <section className="mt-12">
        <h2 className="sect-h">More blank maps</h2>
        <div className="mt-4 flex flex-wrap gap-2">{related.map((n) => <Link key={n} href={`/maps/blank/${slugify(n)}`} className="chip hover:border-brand">{n}</Link>)}</div>
      </section>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    </div>
  );
}
