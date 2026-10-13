import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { feature } from "topojson-client";
import { geoArea, geoBounds, geoCentroid } from "d3-geo";
import countriesTopo from "world-atlas/countries-110m.json";
import { REFERENCE_COUNTRIES, referenceCountryBySlug } from "@/data/referenceCountries";

const world = feature(
  countriesTopo as any,
  (countriesTopo as any).objects.countries,
) as unknown as GeoJSON.FeatureCollection<GeoJSON.Geometry, { name?: string }>;

function slugify(value: string) {
  return value.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

function findFeature(slug: string) {
  const preferred = referenceCountryBySlug.get(slug);
  if (!preferred) return undefined;
  const aliases = new Set([preferred.name, preferred.name.replace("United States of America", "United States"), preferred.name.replace("South Korea", "Korea")]);
  return world.features.find((f) => {
    const name = f.properties?.name;
    return name ? aliases.has(name) || slugify(name) === slug : false;
  });
}

function stats(country: GeoJSON.Feature<GeoJSON.Geometry, { name?: string }>) {
  const [[west, south], [east, north]] = geoBounds(country);
  const [lon, lat] = geoCentroid(country);
  const areaKm2 = (geoArea(country) / (4 * Math.PI)) * 510072000;
  const latSpan = north - south;
  let lonSpan = east - west;
  if (lonSpan < 0) lonSpan += 360;
  const nsKm = latSpan * 111.195;
  const ewKm = Math.abs(lonSpan * 111.320 * Math.cos((lat * Math.PI) / 180));
  return { west, south, east, north, lon, lat, areaKm2, latSpan, lonSpan, nsKm, ewKm };
}

export function generateStaticParams() {
  return REFERENCE_COUNTRIES.map((country) => ({ country: country.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ country: string }> }): Promise<Metadata> {
  const { country } = await params;
  const meta = referenceCountryBySlug.get(country);
  if (!meta) return {};
  return {
    title: `${meta.name} Geography Reference — Area, Centroid & Extent`,
    description: `Map-based ${meta.name} geography reference with approximate area, centroid, latitude/longitude extent, hemisphere and related tools.`,
    alternates: { canonical: `/reference/${meta.slug}` },
    robots: { index: true, follow: true },
  };
}

export default async function CountryReferencePage({ params }: { params: Promise<{ country: string }> }) {
  const { country } = await params;
  const meta = referenceCountryBySlug.get(country);
  const geo = findFeature(country);
  if (!meta || !geo) notFound();
  const s = stats(geo);
  const northSouth = s.lat >= 0 ? "Northern Hemisphere" : "Southern Hemisphere";
  const eastWest = s.lon >= 0 ? "Eastern Hemisphere" : "Western Hemisphere";
  const blankMapSlug = country === "united-states" ? "united-states-of-america" : country;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: `${meta.name} Geography Reference`,
    description: `Approximate geographic area, centroid and coordinate extent for ${meta.name}.`,
    author: { "@type": "Person", name: "Aladdin", url: "https://www.mapbench.site/author/aladdin" },
    publisher: { "@type": "Organization", name: "MapBench", url: "https://www.mapbench.site" },
    mainEntityOfPage: `https://www.mapbench.site/reference/${meta.slug}`,
  };

  return (
    <article className="doc mx-auto max-w-4xl py-10">
      <nav className="mb-5 text-xs text-mute"><Link href="/">Home</Link> / <Link href="/reference">Reference</Link> / <span>{meta.name}</span></nav>
      <p className="font-sans text-[11px] font-extrabold uppercase tracking-[0.14em] text-brand-strong">Country geography reference · Edited by Aladdin</p>
      <h1 className="mt-2 font-display text-4xl font-bold tracking-tight">{meta.name}: Area, Centroid & Geographic Extent</h1>
      <p className="mt-4 text-lg leading-relaxed text-mute">A reproducible map-geometry reference for {meta.name}, focused on {meta.focus}. Values below are calculated consistently from generalized world boundary geometry.</p>

      <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="card p-5"><div className="text-xs font-extrabold uppercase text-mute">Approx. geometry area</div><div className="mt-1 font-display text-2xl font-bold">{Math.round(s.areaKm2).toLocaleString()} km²</div></div>
        <div className="card p-5"><div className="text-xs font-extrabold uppercase text-mute">Geographic centroid</div><div className="mt-1 font-display text-xl font-bold">{s.lat.toFixed(2)}°, {s.lon.toFixed(2)}°</div></div>
        <div className="card p-5"><div className="text-xs font-extrabold uppercase text-mute">Hemisphere</div><div className="mt-1 text-sm font-semibold">{northSouth}<br />{eastWest}</div></div>
        <div className="card p-5"><div className="text-xs font-extrabold uppercase text-mute">Latitude extent</div><div className="mt-1 text-sm">{s.south.toFixed(2)}° to {s.north.toFixed(2)}°</div></div>
        <div className="card p-5"><div className="text-xs font-extrabold uppercase text-mute">Longitude extent</div><div className="mt-1 text-sm">{s.west.toFixed(2)}° to {s.east.toFixed(2)}°</div></div>
        <div className="card p-5"><div className="text-xs font-extrabold uppercase text-mute">Approx. spans</div><div className="mt-1 text-sm">N–S {Math.round(s.nsKm).toLocaleString()} km<br />E–W {Math.round(s.ewKm).toLocaleString()} km</div></div>
      </section>

      <section className="mt-10 border-t border-line pt-8">
        <h2 className="font-display text-2xl font-bold">How to interpret these numbers</h2>
        <p className="mt-3">The area is derived from the generalized polygon geometry, not copied from a country fact table. The centroid is the geometric centre of that polygon representation, so it may fall away from the population centre or political capital. The north–south and east–west spans are planning-grade summaries from the coordinate bounds and centroid latitude.</p>
        <p className="mt-3">Countries with islands, overseas territory, complex coastlines or geometry crossing the antimeridian can be especially sensitive to map generalization. Use official national mapping data for legal, cadastral or high-precision work.</p>
      </section>

      <section className="mt-10 grid gap-4 sm:grid-cols-2">
        <div className="card p-5"><h2 className="font-display text-xl font-bold">Why centroid and extent matter</h2><p className="mt-2 text-sm leading-relaxed text-mute">They help with map framing, bounding boxes, regional comparison, route context, visualisation defaults and understanding how far a country stretches across latitude and longitude.</p></div>
        <div className="card p-5"><h2 className="font-display text-xl font-bold">Why the map area can differ from official figures</h2><p className="mt-2 text-sm leading-relaxed text-mute">Official area statistics can use different coastlines, inland-water rules, disputed boundaries and survey methods. A small-scale generalized world polygon is designed primarily for consistent visualization.</p></div>
      </section>

      <section className="mt-10 rounded-xl border border-line bg-well/40 p-5">
        <h2 className="font-display text-xl font-bold">Explore {meta.name} with MapBench</h2>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link href={`/maps/blank/${blankMapSlug}`} className="btn btn-ghost">Blank map</Link>
          <Link href="/tools/map-area-calculator" className="btn btn-ghost">Measure map area</Link>
          <Link href="/tools/distance-between-two-places" className="btn btn-ghost">Distance tool</Link>
          <Link href="/guides/map-projections-explained" className="btn btn-ghost">Map projections guide</Link>
        </div>
      </section>

      <section className="mt-10 border-t border-line pt-8">
        <h2 className="font-display text-2xl font-bold">Source and editorial note</h2>
        <p className="mt-3">Geometry is read from the bundled world-atlas country dataset and processed with standard d3-geo spherical functions. The page is edited by <Link href="/author/aladdin" className="font-semibold text-brand-strong hover:underline">Aladdin</Link>. The values are intended for learning, comparison and general map work rather than official boundary determination.</p>
      </section>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    </article>
  );
}
