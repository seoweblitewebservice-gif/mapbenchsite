import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Corrections & Change Log",
  description: "Public MapBench corrections log for factual, calculation, data-source and indexing fixes, with links to the affected pages and methodology.",
  alternates: { canonical: "/corrections" },
  robots: { index: true, follow: true },
};

type Correction = {
  date: string;
  page: string;
  href: string;
  before: string;
  after: string;
};

const CORRECTIONS: Correction[] = [
  {
    date: "14 Oct 2026",
    page: "Moonrise & Moonset",
    href: "/tools/moonrise-moonset",
    before: "The page loaded a moon-phase interface instead of a location-based moonrise and moonset workflow.",
    after: "The tool now calculates moonrise, moonset and upper transit for the selected location and date, with local-time context and moon-phase information.",
  },
  {
    date: "14 Oct 2026",
    page: "Magnetic Declination",
    href: "/tools/magnetic-declination",
    before: "The page reused a true-bearing workflow and did not calculate magnetic declination from a geomagnetic model.",
    after: "The tool now uses the British Geological Survey World Magnetic Model 2025 service and clearly separates true and magnetic bearings.",
  },
  {
    date: "14 Oct 2026",
    page: "Population Within Radius",
    href: "/tools/population-within-radius",
    before: "US results were based on a curated major-city dataset and could not represent suburban or rural population well.",
    after: "US mode now uses Census ZCTA population and housing data with ACS demographic context, while clearly describing the centroid-based approximation.",
  },
  {
    date: "14 Oct 2026",
    page: "Cities Within Radius",
    href: "/tools/cities-within-radius",
    before: "US coverage was limited to the curated world-city list.",
    after: "US mode now uses Census incorporated places and census-designated places; the global curated-city fallback remains for worldwide use.",
  },
  {
    date: "14 Oct 2026",
    page: "ZIP Codes Within Radius",
    href: "/tools/zip-codes-within-radius",
    before: "The lookup depended mainly on OpenStreetMap postcode search and could return a limited result set.",
    after: "US mode now uses Census ZIP Code Tabulation Areas with 2020 population and housing context, and explains that ZCTAs are not USPS delivery polygons.",
  },
  {
    date: "14 Oct 2026",
    page: "Indexing and locale routes",
    href: "/methodology",
    before: "Untranslated locale tool URLs could be discovered even when the underlying content fell back to English, and filtered tool-directory URLs were crawlable.",
    after: "Retired locale routes now consolidate to canonical English destinations, translated alternates were removed from the sitemap, and filtered tool-directory variants are noindex with clean category hubs used for internal linking.",
  },
];

export default function CorrectionsPage() {
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "WebPage",
      name: "MapBench Corrections & Change Log",
      url: "https://www.mapbench.site/corrections",
      description: "Public record of material factual, calculation, data-source and indexing corrections made by MapBench.",
      dateModified: "2026-10-14",
      author: { "@type": "Person", name: "Aryan Khan", url: "https://www.mapbench.site/author/aryan-khan" },
      isPartOf: { "@type": "WebSite", name: "MapBench", url: "https://www.mapbench.site" },
      about: ["editorial corrections", "geographic calculations", "data quality", "indexing quality"],
    },
    {
      "@context": "https://schema.org",
      "@type": "ItemList",
      name: "MapBench correction entries",
      numberOfItems: CORRECTIONS.length,
      itemListElement: CORRECTIONS.map((item, index) => ({
        "@type": "ListItem",
        position: index + 1,
        url: `https://www.mapbench.site${item.href}`,
        name: `${item.page} correction — ${item.date}`,
        description: item.after,
      })),
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "MapBench", item: "https://www.mapbench.site" },
        { "@type": "ListItem", position: 2, name: "Corrections & Change Log", item: "https://www.mapbench.site/corrections" },
      ],
    },
  ];

  return (
    <div className="doc mx-auto max-w-5xl">
      <nav aria-label="Breadcrumb" className="mb-4 text-xs text-mute"><Link href="/" className="hover:text-brand-strong">Home</Link> / Corrections</nav>
      <p className="font-sans text-[11px] font-extrabold uppercase tracking-[0.14em] text-brand-strong">Transparency</p>
      <h1 className="mt-2 font-display text-3xl font-bold tracking-tight sm:text-4xl">Corrections &amp; Change Log</h1>
      <p className="mt-4 max-w-3xl text-base leading-relaxed text-mute">When MapBench finds a factual, calculation, data-source or implementation error that materially changes what a page tells the user, we correct it and record the change here. Routine design polish and minor wording edits are not listed as corrections.</p>

      <div className="mt-8 overflow-x-auto rounded-xl border border-line bg-card">
        <table className="tbl min-w-[820px]">
          <thead><tr><th>Date</th><th>Page</th><th>What was wrong</th><th>What changed</th></tr></thead>
          <tbody>{CORRECTIONS.map((item) => <tr key={`${item.date}-${item.href}`}><td className="whitespace-nowrap align-top">{item.date}</td><td className="align-top"><Link href={item.href} className="font-bold text-brand-strong hover:underline">{item.page}</Link></td><td className="align-top text-sm leading-relaxed text-mute">{item.before}</td><td className="align-top text-sm leading-relaxed">{item.after}</td></tr>)}</tbody>
        </table>
      </div>

      <section className="mt-10 grid gap-4 md:grid-cols-3" aria-labelledby="correction-policy">
        <h2 id="correction-policy" className="sr-only">How MapBench handles corrections</h2>
        <article className="card p-5"><h3 className="font-display text-lg font-bold">Material errors are logged</h3><p className="mt-2 text-sm leading-relaxed text-mute">We record changes that alter a result, data source, calculation method or important factual statement. Small style edits are not presented as substantive corrections.</p></article>
        <article className="card p-5"><h3 className="font-display text-lg font-bold">Methods are rechecked</h3><p className="mt-2 text-sm leading-relaxed text-mute">A reported issue is tested against the implemented calculation and the documented source before the result or explanatory text is changed.</p></article>
        <article className="card p-5"><h3 className="font-display text-lg font-bold">Affected pages stay linked</h3><p className="mt-2 text-sm leading-relaxed text-mute">Each entry points back to the relevant tool or policy page so readers can review the corrected version, method and current limitations.</p></article>
      </section>

      <section className="mt-10 rounded-xl border border-line bg-well/40 p-6">
        <h2 className="font-display text-2xl font-bold">Report an error</h2>
        <p className="mt-3">Send the affected URL, the input or statement you believe is wrong, the expected result, and a source when one is available. We review reproducible reports against the implemented method and documented source data.</p>
        <p className="mt-4 font-sans text-sm"><Link href="/contact" className="font-extrabold text-brand-strong hover:underline">Contact MapBench →</Link><span className="mx-2 text-mute">·</span><Link href="/editorial-policy" className="font-extrabold text-brand-strong hover:underline">Editorial policy →</Link><span className="mx-2 text-mute">·</span><Link href="/methodology" className="font-extrabold text-brand-strong hover:underline">Methodology →</Link><span className="mx-2 text-mute">·</span><Link href="/data-sources" className="font-extrabold text-brand-strong hover:underline">Data sources →</Link></p>
      </section>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    </div>
  );
}
