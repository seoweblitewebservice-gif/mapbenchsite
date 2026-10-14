import type { Metadata } from "next";
import Link from "next/link";
import { permanentRedirect } from "next/navigation";
import { feature } from "topojson-client";
import countriesTopo from "world-atlas/countries-110m.json";
import MapsClient from "@/components/MapsClient";
import { US_BLANK_MAP_STATES } from "@/data/usBlankMapStates";

export const metadata: Metadata = {
  title: "Free Printable Blank Maps — US States, Counties & Countries",
  description: "Free printable blank maps for all 50 US states plus DC and 170+ countries. Download county, state and country maps as SVG or PNG, or save as PDF.",
  alternates: { canonical: "/maps" },
};

function slugify(value: string) {
  return value.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

const countryFeatureCollection = feature(
  countriesTopo as any,
  (countriesTopo as any).objects.countries,
) as unknown as GeoJSON.FeatureCollection<GeoJSON.Geometry, { name?: string }>;

const COUNTRY_LINKS = Array.from(
  new Set(countryFeatureCollection.features.map((item) => item.properties?.name).filter((name): name is string => Boolean(name))),
).sort((a, b) => a.localeCompare(b));

const COUNTRY_SLUGS = new Set(COUNTRY_LINKS.map(slugify));
const STATE_BY_NAME = new Map(US_BLANK_MAP_STATES.map((state) => [state.name.toLowerCase(), state]));

const MAP_FAQS: [string, string][] = [
  ["Are these maps really free to use?", "Yes — completely free, including commercial use. The boundary data comes from Natural Earth and the US Census Bureau, both public domain, and the outlines are generated in your browser with no watermark or branding."],
  ["What's the difference between the four variants?", "Blank is a clean outline for worksheets and quizzes; Labeled adds region or country names; Colored fills each region with a soft tint for presentations; With cities overlays major-city dots from our curated dataset. Every variant downloads in both SVG and PNG."],
  ["SVG or PNG — which should I choose?", "SVG for anything printed or resized because it stays sharp at any size and remains editable. PNG is convenient for slides, documents and quick sharing. State pages also include a print option for PDF output."],
  ["Where does the boundary data come from?", "Country and world outlines use Natural Earth's public-domain dataset. US state and county-equivalent maps use public US Census cartographic geometry distributed through us-atlas."],
  ["Does every US state have its own page?", "Yes. MapBench provides a dedicated indexable page for every state plus the District of Columbia, with county-equivalent boundaries, multiple map styles and downloads."],
  ["Does every country have a separate URL?", "Yes. The country library links to a dedicated canonical blank-map page for each country represented in the bundled Natural Earth geometry."],
  ["Do I need to credit MapBench?", "No attribution is required for public-domain data. A credit line is appreciated but never obligatory."],
];

const POPULAR_MAPS: Array<{ slug: string; name: string; href: string; blurb: string }> = [
  { slug: "texas", name: "Texas", href: "/maps/blank/us/texas", blurb: "County map" },
  { slug: "california", name: "California", href: "/maps/blank/us/california", blurb: "County map" },
  { slug: "florida", name: "Florida", href: "/maps/blank/us/florida", blurb: "County map" },
  { slug: "new-york", name: "New York", href: "/maps/blank/us/new-york", blurb: "County map" },
  { slug: "india", name: "India", href: "/maps/blank/india", blurb: "Country map" },
  { slug: "japan", name: "Japan", href: "/maps/blank/japan", blurb: "Country map" },
  { slug: "france", name: "France", href: "/maps/blank/france", blurb: "Country map" },
  { slug: "united-kingdom", name: "United Kingdom", href: "/maps/blank/united-kingdom", blurb: "Country map" },
];

interface MapsPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function MapsPage({ searchParams }: MapsPageProps) {
  const params = await searchParams;
  const mapParam = Array.isArray(params.map) ? params.map[0] : params.map;

  // Historical map selector URLs used a query parameter. Dedicated map pages are
  // now the canonical destination, so consolidate the old duplicates while
  // preserving every actual map and download page.
  if (mapParam?.startsWith("c-")) {
    const slug = slugify(mapParam.slice(2));
    if (COUNTRY_SLUGS.has(slug)) permanentRedirect(`/maps/blank/${slug}`);
  }
  if (mapParam?.startsWith("s-")) {
    const state = STATE_BY_NAME.get(mapParam.slice(2).trim().toLowerCase());
    if (state) permanentRedirect(`/maps/blank/us/${state.slug}`);
  }

  return (
    <div>
      <nav aria-label="Breadcrumb" className="mb-3 text-xs text-mute">
        <Link href="/" className="hover:text-brand-strong">Home</Link> / <span className="font-semibold text-ink">Blank Maps</span>
      </nav>
      <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">Free Printable Blank Maps</h1>
      <p className="doc mt-3 max-w-3xl">
        Download printable maps for the world, all 50 US states plus DC, and 170+ countries. US state pages include county-equivalent boundaries, labeled and colored variants, SVG and PNG downloads, and browser-ready PDF printing. Country pages provide separate canonical URLs with their own map downloads and geographic reference notes.
      </p>

      <section id="popular-maps" className="mt-8" aria-labelledby="popular-maps-heading">
        <div className="max-w-3xl">
          <p className="font-sans text-[11px] font-extrabold uppercase tracking-[0.14em] text-brand-strong">Most downloaded</p>
          <h2 id="popular-maps-heading" className="mt-2 font-display text-2xl font-bold">Popular blank maps</h2>
          <p className="mt-2 text-sm leading-relaxed text-mute">The maps people download most — classroom favorites, presentation staples and quiz-night essentials. Every one prints cleanly and downloads as SVG or PNG.</p>
        </div>
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {POPULAR_MAPS.map((m) => (
            <Link key={m.slug} href={m.href} className="group overflow-hidden rounded-2xl border border-line bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-brand hover:shadow-md">
              <img src={`/map-thumbs/${m.slug}.svg`} alt={`Blank map of ${m.name}`} width={320} height={200} loading="lazy" className="aspect-[8/5] w-full object-cover" />
              <div className="flex items-center justify-between px-4 py-3">
                <div>
                  <div className="font-sans text-sm font-extrabold text-ink group-hover:text-brand-strong">{m.name}</div>
                  <div className="mt-0.5 text-[11px] font-medium text-mute">{m.blurb} · SVG · PNG · PDF</div>
                </div>
                <span className="text-lg text-brand-strong transition group-hover:translate-x-0.5" aria-hidden>→</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section id="us-states" className="mt-8 rounded-2xl border border-line bg-card p-5 sm:p-6" aria-labelledby="us-state-maps-heading">
        <div className="max-w-3xl">
          <p className="font-sans text-[11px] font-extrabold uppercase tracking-[0.14em] text-brand-strong">Dedicated indexable map pages</p>
          <h2 id="us-state-maps-heading" className="mt-2 font-display text-2xl font-bold">US State & County Blank Maps</h2>
          <p className="mt-2 text-sm leading-relaxed text-mute">Open a state to get its own printable county-equivalent map page. Louisiana uses parishes and Alaska uses boroughs and census areas, with the terminology explained on each page.</p>
        </div>
        <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {US_BLANK_MAP_STATES.map((state) => (
            <Link key={state.slug} href={`/maps/blank/us/${state.slug}`} className="rounded-lg border border-line bg-well/35 px-3 py-3 font-sans text-sm font-semibold text-ink transition hover:border-brand hover:bg-brand-soft/40 hover:text-brand-strong">
              <span className="block">{state.name}</span>
              <span className="mt-1 block text-[10px] font-medium text-mute">{state.divisionLabel} map →</span>
            </Link>
          ))}
        </div>
      </section>

      <section id="country-maps" className="mt-6 rounded-2xl border border-line bg-card p-5 sm:p-6" aria-labelledby="country-maps-heading">
        <div className="max-w-3xl">
          <p className="font-sans text-[11px] font-extrabold uppercase tracking-[0.14em] text-brand-strong">Country map library</p>
          <h2 id="country-maps-heading" className="mt-2 font-display text-2xl font-bold">Printable Country Blank Maps</h2>
          <p className="mt-2 text-sm leading-relaxed text-mute">Each country link opens a separate canonical page instead of changing only the map on this URL. Use those pages for printing, downloads, geographic reference facts and stable links.</p>
        </div>
        <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {COUNTRY_LINKS.map((name) => (
            <Link key={name} href={`/maps/blank/${slugify(name)}`} className="rounded-lg border border-line bg-well/35 px-3 py-3 font-sans text-sm font-semibold text-ink transition hover:border-brand hover:bg-brand-soft/40 hover:text-brand-strong">
              {name} <span className="text-brand-strong">→</span>
            </Link>
          ))}
        </div>
      </section>

      <div className="mt-8">
        <MapsClient />
      </div>

      <div className="doc mx-auto mt-12 max-w-3xl space-y-8">
        <section aria-labelledby="about-maps">
          <h2 id="about-maps" className="sect-h">About these blank maps</h2>
          <p>
            Every outline is generated from public geographic boundary data. Country and world shapes use Natural Earth geometry; the dedicated US state pages use US Census-derived state and county-equivalent geometry. Rendering happens in the browser with d3-geo so SVG downloads stay vector-sharp at any size and PNG exports are suitable for documents and presentations.
          </p>
          <p>
            The dedicated map URLs are designed for a specific geographic intent rather than forcing every place into one generic page. That makes it easier to bookmark, link to, print and discover the exact map you need.
          </p>
        </section>

        <section aria-labelledby="common-uses">
          <h2 id="common-uses" className="sect-h">Common uses</h2>
          <ul className="list-disc space-y-1.5 pl-6">
            <li><strong>Education:</strong> geography quizzes, fill-in-the-blank worksheets, history projects and coloring sheets.</li>
            <li><strong>Business:</strong> sales territories, franchise planning, county coverage and presentation maps.</li>
            <li><strong>Data visualization:</strong> base layers for county or country choropleth graphics.</li>
            <li><strong>Content creation:</strong> explainers, articles, slides and social graphics.</li>
            <li><strong>Personal:</strong> travel planning, custom posters and location reference sheets.</li>
          </ul>
        </section>

        <section aria-labelledby="related-map-tools">
          <h2 id="related-map-tools" className="sect-h">Related tools</h2>
          <ul className="list-disc space-y-1.5 pl-6 font-sans text-sm">
            <li><Link href="/tools/map-area-calculator" className="font-bold text-brand-strong hover:underline">Map Area Calculator</Link> — draw shapes on a live map and measure their area.</li>
            <li><Link href="/tools/us-county-demographic-explorer" className="font-bold text-brand-strong hover:underline">US County Demographic Explorer</Link> — compare Census county data on an interactive map.</li>
            <li><Link href="/tools/pin-drop-map" className="font-bold text-brand-strong hover:underline">Pin Drop Map</Link> — annotate a live map with labelled pins and export it.</li>
            <li><Link href="/tools/cities-within-radius" className="font-bold text-brand-strong hover:underline">Cities Within Radius</Link> — find cities around any location.</li>
            <li><Link href="/tools/what-county-am-i-in" className="font-bold text-brand-strong hover:underline">What County Am I In?</Link> — identify a US county and Census context for a map point.</li>
          </ul>
        </section>

        <section aria-labelledby="maps-faq">
          <h2 id="maps-faq" className="sect-h">Frequently asked questions</h2>
          <div className="mt-4 space-y-2 font-sans">
            {MAP_FAQS.map(([q, a]) => (
              <details key={q} className="card px-4 py-3">
                <summary className="cursor-pointer text-sm font-bold">{q}</summary>
                <p className="mt-2 font-serif text-sm leading-relaxed text-mute">{a}</p>
              </details>
            ))}
          </div>
        </section>
      </div>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: MAP_FAQS.map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })),
          }),
        }}
      />
    </div>
  );
}
