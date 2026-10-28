import type { Metadata } from "next";
import Link from "next/link";
import { feature } from "topojson-client";
import countriesTopo from "world-atlas/countries-110m.json";
import { CATEGORIES, TOOLS, toolBySlug, type ToolDef } from "@/lib/registry";
import { allGuideBySlug } from "@/data/allGuides";
import { STUDIES } from "@/data/studies";
import { US_BLANK_MAP_STATES } from "@/data/usBlankMapStates";
import { STATE_FACTS } from "@/data/stateFacts";
import {
  HOMEPAGE_COUNTRY_MAPS,
  HOMEPAGE_GUIDE_SLUGS,
  HOMEPAGE_STATE_MAP_SLUGS,
  POPULAR_QUESTIONS,
  POPULAR_SLUGS,
} from "@/data/homepage";
import HomeToolFinder from "@/components/HomeToolFinder";
import HomeToolIndex from "@/components/HomeToolIndex";

export const metadata: Metadata = {
  title: "Free Map Tools, Geographic Calculators & Blank Maps",
  description:
    "Free map tools: radius, distance, drive time, coordinates, counties, ZIP codes, elevation, GPS files and printable blank maps. No sign-up.",
  alternates: { canonical: "/" },
};

const HOME_FAQ: [string, string][] = [
  ["What is MapBench?", "MapBench is a free collection of interactive map tools, geographic calculators, printable blank maps, original geographic studies and practical mapping guides. Use it for distance, radius, drive time, coordinates, elevation, GPS files, location questions and more."],
  ["Are the tools really free?", "Yes. Public MapBench tools are free to use and do not require an account."],
  ["Do the tools work on mobile?", "Yes. MapBench is responsive and most tools work in modern mobile browsers. Location tools can use device location when you grant permission."],
  ["What data sources does MapBench use?", "MapBench uses documented public and open geographic sources including OpenStreetMap-based mapping and geocoding, public routing services, Natural Earth, US Census data and Copernicus elevation data where relevant."],
  ["Do the tools work outside the United States?", "Most tools are worldwide. Some tools are US-focused because the underlying ZIP, county or government dataset is specific to the United States; coverage is labelled on the page."],
  ["How accurate are the calculations?", "Accuracy depends on the method and dataset. MapBench documents whether a result uses geometric distance, road-network routing, public boundaries, browser location or another source, and highlights important limitations on each tool page."],
  ["Is my location or file data stored?", "Browser-first tools keep processing local where possible. When a lookup needs an external public service, only the data needed for that request is sent. File tools are designed to process supported files locally in the browser where stated."],
  ["Is MapBench suitable for legal, surveying or safety-critical decisions?", "MapBench is intended for everyday analysis, learning and planning. Official boundaries, legal descriptions, surveying, emergency decisions, engineering and regulated work should be verified with the responsible authority or a qualified professional."],
];

const DATA_SOURCES: [string, string][] = [
  ["OpenStreetMap", "Street, place and boundary data behind search, geocoding and routing."],
  ["OpenFreeMap", "Vector map tiles for the interactive maps."],
  ["Photon + Nominatim", "Place search and coordinate-to-address lookups."],
  ["Valhalla (FOSSGIS) + OSRM", "Road routing and drive-time areas on OpenStreetMap roads."],
  ["US Census Bureau", "State, county, ZIP and demographic data, including TIGER/Line geometry."],
  ["Natural Earth", "Public-domain world and country geometry for the blank maps."],
  ["Open-Meteo / Copernicus DEM", "Terrain elevation lookups."],
  ["Overpass API", "Live nearby-place queries on OpenStreetMap data."],
];

function ToolCard({ tool }: { tool: ToolDef }) {
  return (
    <Link
      href={`/tools/${tool.slug}`}
      className="card group flex h-full flex-col p-4 transition-colors hover:border-brand"
    >
      <h2 className="font-sans text-sm font-bold text-brand-strong">
        {tool.name} <span aria-hidden>↗</span>
      </h2>
      <p className="mt-2 text-xs leading-relaxed text-mute">{tool.short}</p>
    </Link>
  );
}

function formatMillions(value: number) {
  return `${(value / 1000000).toFixed(1)} million people`;
}

export default function HomePage() {
  const searchTools = TOOLS.map((tool) => ({
    slug: tool.slug,
    name: tool.name,
    short: tool.short,
    category: tool.category,
    categoryLabel:
      CATEGORIES.find((category) => category.id === tool.category)?.label ??
      tool.category,
    scope: tool.scope,
    keywords: tool.keywords,
  }));

  const popular = POPULAR_SLUGS.map((slug) => toolBySlug.get(slug)).filter(
    (tool): tool is ToolDef => Boolean(tool),
  );

  const countryFeatures = feature(
    countriesTopo as unknown as TopoJSON.Topology,
    (countriesTopo as unknown as { objects: { countries: TopoJSON.GeometryCollection } }).objects.countries,
  ) as unknown as GeoJSON.FeatureCollection<GeoJSON.Geometry, { name?: string }>;
  const countryCount = new Set(
    countryFeatures.features
      .map((item) => item.properties?.name)
      .filter((name): name is string => Boolean(name)),
  ).size;
  const mapCount = countryCount + US_BLANK_MAP_STATES.length;

  const stateBySlug = new Map(US_BLANK_MAP_STATES.map((state) => [state.slug, state]));
  const countiesFor = (name: string) => STATE_FACTS[name]?.counties ?? 0;
  const totalCounties = US_BLANK_MAP_STATES.reduce(
    (sum, state) => sum + countiesFor(state.name),
    0,
  );
  const featuredStates = [...US_BLANK_MAP_STATES]
    .sort(
      (a, b) =>
        (STATE_FACTS[b.name]?.population2024 ?? 0) -
        (STATE_FACTS[a.name]?.population2024 ?? 0),
    )
    .slice(0, 6);

  const guides = HOMEPAGE_GUIDE_SLUGS.map((slug) =>
    allGuideBySlug.get(slug),
  ).filter((guide) => Boolean(guide));
  const studies = STUDIES.slice(0, 3);

  return (
    <div className="doc">
      {/* Hero: heading, counts, working search, popular tools */}
      <section className="hero-map relative overflow-visible border-b border-line">
        <div className="hero-map-bg" aria-hidden />
        <div className="hero-map-fade" aria-hidden />
        <div className="relative z-[1] mx-auto max-w-5xl px-4 py-14 text-center sm:py-20">
          <p className="mb-3 font-sans text-[11px] font-extrabold uppercase tracking-[0.16em] text-brand-strong">
            Free · No sign-up · Methods explained
          </p>
          <h1 className="font-display text-4xl font-bold leading-[1.12] tracking-tight text-ink sm:text-5xl md:text-[3.25rem]">
            Free Map Tools & Printable Maps
          </h1>
          <p className="mx-auto mt-5 max-w-3xl text-[15px] leading-relaxed text-mute sm:text-base">
            {TOOLS.length} free, browser-based map tools and {mapCount} printable
            blank maps — no sign-up. Start with a question below.
          </p>

          <HomeToolFinder tools={searchTools} suggested={[]} compact />
        </div>
      </section>

      <section aria-label="Popular tools" className="home-shortcuts mx-auto grid max-w-5xl gap-3 px-4 py-7 sm:grid-cols-2 lg:grid-cols-4">
        {popular.map((tool) => (
          <ToolCard key={tool.slug} tool={tool} />
        ))}
      </section>

      {/* Full tool directory, category by category */}
      <HomeToolIndex />

      {/* Printable blank maps: grouped spotlights */}
      <section aria-labelledby="blank-maps" className="border-t border-line bg-well/50 py-10">
        <div className="mx-auto max-w-5xl px-4">
          <h2 id="blank-maps" className="sect-h">Printable blank maps</h2>
          <p className="mt-3 max-w-3xl">
            {mapCount} printable blank maps: {US_BLANK_MAP_STATES.length} US state
            maps with county boundaries and {countryCount} country maps. Each
            map downloads as SVG or PNG with no watermark, straight from your browser.
          </p>
          <div className="mt-6 grid gap-6 sm:grid-cols-2">
            <div>
              <h3 className="font-sans text-sm font-extrabold uppercase tracking-wide text-ink">
                US states
              </h3>
              <ul className="mt-3 space-y-2">
                {HOMEPAGE_STATE_MAP_SLUGS.map((slug) => (
                  <li key={slug}>
                    <Link
                      href={`/maps/blank/us/${slug}`}
                      className="font-serif text-[15px] font-semibold text-brand-strong hover:underline"
                    >
                      {stateBySlug.get(slug)?.name ?? slug}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="font-sans text-sm font-extrabold uppercase tracking-wide text-ink">
                Countries
              </h3>
              <ul className="mt-3 space-y-2">
                {HOMEPAGE_COUNTRY_MAPS.map((country) => (
                  <li key={country.slug}>
                    <Link
                      href={`/maps/blank/${country.slug}`}
                      className="font-serif text-[15px] font-semibold text-brand-strong hover:underline"
                    >
                      {country.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <p className="mt-6 font-sans text-sm">
            <Link href="/maps" className="font-extrabold text-brand-strong hover:underline">
              Browse all {mapCount} blank maps →
            </Link>
          </p>
        </div>
      </section>

      {/* US states and county lists */}
      <section aria-labelledby="us-states" className="border-t border-line py-10">
        <div className="mx-auto max-w-5xl px-4">
          <h2 id="us-states" className="sect-h">County lists for every US state</h2>
          <p className="mt-3 max-w-3xl">
            All 50 states plus the District of Columbia — {totalCounties.toLocaleString("en-US")} county-equivalents
            with names, Census FIPS codes and a printable county map on each state page.
          </p>
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {featuredStates.map((state) => (
              <Link
                key={state.slug}
                href={`/states/${state.slug}/counties`}
                className="card group p-4 transition-colors hover:border-brand"
              >
                <div className="font-display text-lg font-bold group-hover:text-brand-strong">
                  {state.name}
                </div>
                <div className="mt-1 text-xs leading-relaxed text-mute">
                  {countiesFor(state.name)} {state.divisionLabel} ·{" "}
                  {formatMillions(STATE_FACTS[state.name]?.population2024 ?? 0)}
                </div>
              </Link>
            ))}
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            {US_BLANK_MAP_STATES.map((state) => (
              <Link
                key={state.slug}
                href={`/states/${state.slug}/counties`}
                className="rounded-full border border-line bg-card px-3 py-1.5 font-sans text-xs font-semibold text-ink transition hover:border-brand hover:text-brand-strong"
              >
                {state.name} <span className="text-mute">{countiesFor(state.name)}</span>
              </Link>
            ))}
          </div>
          <p className="mt-4 text-xs leading-relaxed text-mute">
            Counts are Census county-equivalents, so Louisiana parishes, Alaska
            boroughs and census areas, and independent cities are included in
            their state&apos;s total. Populations are US Census Vintage 2024 estimates.
          </p>
          <p className="mt-3 font-sans text-sm">
            <Link href="/states" className="font-extrabold text-brand-strong hover:underline">
              All {US_BLANK_MAP_STATES.length} state county pages →
            </Link>
          </p>
        </div>
      </section>

      {/* Studies */}
      <section aria-labelledby="studies" className="border-t border-line py-12">
        <div className="mx-auto max-w-5xl px-4">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="font-sans text-[11px] font-extrabold uppercase tracking-[0.14em] text-brand-strong">Original MapBench research</p>
              <h2 id="studies" className="sect-h mt-2">Geographic studies built from transparent calculations</h2>
              <p className="mt-3 max-w-3xl">These studies use MapBench datasets and documented geographic methods to answer questions that go beyond a single calculator. Each page explains the dataset, formula, ranking method and limitations so the result can be checked rather than treated as a black box.</p>
            </div>
            <Link href="/studies" className="font-sans text-sm font-extrabold text-brand-strong hover:underline">Browse all studies →</Link>
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {studies.map((study) => (
              <Link key={study.slug} href={`/studies/${study.slug}`} className="card group flex h-full flex-col p-5 transition-colors hover:border-brand">
                <div className="text-[10px] font-extrabold uppercase tracking-wide text-mute">Data study · {study.date}</div>
                <h3 className="mt-2 font-display text-[17px] font-bold leading-snug group-hover:text-brand-strong">{study.title}</h3>
                <p className="mt-2 line-clamp-3 flex-1 text-sm leading-relaxed text-mute">{study.description}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Guides */}
      <section aria-labelledby="guides" className="mx-auto max-w-5xl px-4 pb-12">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div><h2 id="guides" className="sect-h">Learn the geography behind the tools</h2><p className="mt-3 max-w-3xl">Practical guides explain coordinate systems, distance methods, map files, projections, land measurement and other topics where the right method matters as much as the final number.</p></div>
          <Link href="/guides" className="font-sans text-sm font-extrabold text-brand-strong hover:underline">Read all guides →</Link>
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {guides.map((guide) => (
            <Link key={guide!.slug} href={`/guides/${guide!.slug}`} className="card group flex h-full flex-col p-5 transition-colors hover:border-brand">
              <div className="text-[10px] font-extrabold uppercase tracking-wide text-mute">{guide!.readMins} min read</div>
              <h3 className="mt-2 font-display text-[17px] font-bold leading-snug group-hover:text-brand-strong">{guide!.title}</h3>
              <p className="mt-2 line-clamp-3 flex-1 text-sm leading-relaxed text-mute">{guide!.description}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* Popular questions */}
      <section aria-labelledby="popular-questions" className="border-t border-line bg-well/50 py-10">
        <div className="mx-auto max-w-5xl px-4">
          <h2 id="popular-questions" className="sect-h">Popular questions our tools answer</h2>
          <p className="mt-3 max-w-3xl">Shortcuts for the tasks people come here to finish — each one opens the free tool or map that answers it.</p>
          <div className="mt-5 flex flex-wrap gap-2">
            {POPULAR_QUESTIONS.map((item) => (
              <Link
                key={item.href + item.question}
                href={item.href}
                className="rounded-full border border-line bg-card px-3.5 py-2 font-sans text-[13px] font-semibold text-ink transition hover:border-brand hover:text-brand-strong"
              >
                {item.question}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Data sources */}
      <section aria-labelledby="data-sources" className="border-t border-line py-10">
        <div className="mx-auto max-w-5xl px-4">
          <h2 id="data-sources" className="sect-h">Data sources</h2>
          <p className="mt-3 max-w-3xl">MapBench identifies the source behind geographic results instead of hiding data provenance. The main datasets and services are:</p>
          <ul className="mt-5 grid gap-3 sm:grid-cols-2">
            {DATA_SOURCES.map(([provider, note]) => (
              <li key={provider} className="card p-4">
                <div className="font-sans text-sm font-extrabold text-ink">{provider}</div>
                <p className="mt-1 text-sm leading-relaxed text-mute">{note}</p>
              </li>
            ))}
          </ul>
          <p className="mt-4 font-sans text-sm"><Link href="/data-sources" className="font-extrabold text-brand-strong hover:underline">Full attribution, sources & licences →</Link></p>
        </div>
      </section>

      {/* FAQ */}
      <section aria-labelledby="faq" className="border-t border-line bg-well/40 py-12">
        <div className="mx-auto max-w-3xl px-4">
          <h2 id="faq" className="sect-h">Frequently asked questions</h2>
          <div className="mt-6 divide-y divide-line rounded-xl border border-line bg-card">
            {HOME_FAQ.map(([q, a]) => (
              <details key={q} className="group px-5 py-4">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 font-sans text-[15px] font-semibold text-ink marker:content-none"><span>{q}</span><span className="shrink-0 text-lg font-light text-mute transition group-open:rotate-45">+</span></summary>
                <p className="mt-3 pr-8 font-serif text-sm leading-relaxed text-mute">{a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ "@context": "https://schema.org", "@type": "FAQPage", mainEntity: HOME_FAQ.map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })) }) }} />
    </div>
  );
}
