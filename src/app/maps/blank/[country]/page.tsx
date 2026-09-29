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

// Keep the strongest/highest-demand country map pages indexable while the
// wider template library remains available to users and crawlable via links.
const INDEXABLE_MAPS = new Set([
  "world",
  "united-states-of-america",
  "india",
  "united-kingdom",
  "canada",
  "australia",
  "germany",
  "france",
  "brazil",
  "japan",
  "mexico",
  "spain",
  "italy",
  "china",
  "russia",
]);

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
  const indexable = INDEXABLE_MAPS.has(country);
  return {
    title: `${name} Blank Map — SVG & PNG`,
    description: `Free printable ${name} blank map with SVG and high-resolution PNG exports. Explore outline, labeled, colored and city map variants.`,
    alternates: { canonical: `/maps/blank/${country}` },
    robots: { index: indexable, follow: true },
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
      <div className="card p-6">
        Country map not found.{" "}
        <Link className="text-brand-strong underline" href="/maps">Back to maps</Link>
      </div>
    );
  }

  const name = mapFeature.properties!.name!;
  const stats = countryStats(mapFeature);
  const areaText = stats.areaKm2 >= 1000000
    ? `${(stats.areaKm2 / 1000000).toFixed(2)} million km²`
    : `${Math.round(stats.areaKm2).toLocaleString("en-US")} km²`;

  const relatedTools = [
    ["/tools/map-area-calculator", "Map Area Calculator"],
    ["/tools/distance-between-two-places", "Distance Calculator"],
    ["/tools/latitude-longitude-finder", "Latitude & Longitude Finder"],
    ["/tools/crow-flies-distance", "Great-Circle Distance"],
  ] as const;

  const pageUrl = `https://www.mapbench.site/maps/blank/${country}`;
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "WebPage",
      name: `${name} Blank Map — SVG & PNG`,
      description: `Printable ${name} outline map with browser-based SVG and PNG export options.`,
      url: pageUrl,
      isPartOf: { "@type": "WebSite", name: "MapBench", url: "https://www.mapbench.site" },
      publisher: { "@type": "Organization", name: "MapBench", url: "https://www.mapbench.site" },
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: "https://www.mapbench.site/" },
        { "@type": "ListItem", position: 2, name: "Maps", item: "https://www.mapbench.site/maps" },
        { "@type": "ListItem", position: 3, name: `${name} Blank Map`, item: pageUrl },
      ],
    },
  ];

  return (
    <div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <nav aria-label="Breadcrumb" className="mb-3 text-xs text-mute">
        <Link href="/maps" className="hover:text-brand-strong">Maps</Link> /{" "}
        <span className="font-semibold text-ink">{name}</span>
      </nav>

      <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">{name} Blank Map</h1>
      <p className="doc mt-3 max-w-3xl">
        Explore a dedicated {name} outline map for classroom worksheets, geography projects, presentations,
        printable handouts and quick reference. The map is rendered in your browser so you can switch variants
        and export the result without creating an account.
      </p>

      <div className="mt-8">
        <MapsClient initialMapSlug={slugify(name)} />
      </div>

      <section className="doc mx-auto mt-10 max-w-3xl">
        <h2 className="sect-h">About the {name} map</h2>
        <p>
          MapBench generates this country map from the bundled Natural Earth-derived country geometry used by the
          site. Because the geometry is geographic rather than a screenshot, the map can be rendered at different
          sizes and exported without depending on a remote image URL.
        </p>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <div className="card p-4"><strong>Approximate geographic area</strong><br /><span className="text-mute">{areaText}</span></div>
          <div className="card p-4"><strong>Geometry centroid</strong><br /><span className="text-mute">{stats.lat.toFixed(2)}° lat, {stats.lon.toFixed(2)}° lon</span></div>
          <div className="card p-4"><strong>Longitude span</strong><br /><span className="text-mute">{stats.west.toFixed(2)}° to {stats.east.toFixed(2)}°</span></div>
          <div className="card p-4"><strong>Latitude span</strong><br /><span className="text-mute">{stats.south.toFixed(2)}° to {stats.north.toFixed(2)}°</span></div>
        </div>

        <p className="mt-5">
          The centroid and bounding values above describe the supplied map geometry, not a legal boundary survey.
          Small islands and multipart countries can make a geometric centroid fall outside the territory itself,
          so treat it as a map-analysis reference rather than an administrative address.
        </p>

        <h2 className="sect-h mt-8">Choose the right {name} map format</h2>
        <p>
          Use the blank outline when students need to label places themselves, the labeled version for quick study,
          the colored version when regions need visual separation, and the city variant when major urban locations
          are the focus. SVG is the better choice when you need a scalable graphic for design or print; PNG is handy
          for documents, slides and quick sharing.
        </p>

        <h2 className="sect-h mt-8">Ways to use this map</h2>
        <ul>
          <li>Print an outline for geography quizzes, worksheets and classroom labeling.</li>
          <li>Use the labeled version as a quick reference while studying regional geography.</li>
          <li>Export an SVG for presentations, posters or further vector editing.</li>
          <li>Pair the map with coordinate and distance tools when planning a geography project.</li>
        </ul>

        <h2 className="sect-h mt-8">Related geographic tools</h2>
        <ul>
          {relatedTools.map(([href, label]) => (
            <li key={href}><Link href={href} className="font-bold text-brand-strong hover:underline">{label} →</Link></li>
          ))}
        </ul>

        <h2 className="sect-h mt-8">Frequently asked questions</h2>
        <h3>Can I print the {name} blank map?</h3>
        <p>Yes. SVG is designed for scalable output, while PNG is convenient when your document workflow expects a raster image.</p>
        <h3>Is this a legal boundary map?</h3>
        <p>No. It is an educational and reference map based on generalized geographic boundary data, not a cadastral or legal survey.</p>
        <h3>Do I need an account to use it?</h3>
        <p>No. The map interface and browser-based export workflow do not require an account.</p>

        <p className="mt-8">
          <Link href="/maps" className="font-bold text-brand-strong hover:underline">← Browse all country maps</Link>
        </p>
      </section>
    </div>
  );
}
