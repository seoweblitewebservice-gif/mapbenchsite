import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import ToolMethod from "@/components/ToolMethod";
import MatrixTool from "@/components/tools/MatrixTool";
import { Spinner } from "@/components/ui";
import { toolBySlug, type ToolDef } from "@/lib/registry";

/**
 * Dedicated page for the Distance Matrix Calculator — pilot restructure.
 * The tool component (MatrixTool) is used exactly as-is; only the page
 * structure around it is defined here. All other tool pages continue to
 * use the shared src/app/tools/[tool] route.
 */

const SLUG = "distance-matrix-calculator";
const ABSOLUTE_URL = `https://www.mapbench.site/tools/${SLUG}`;
const tool = toolBySlug.get(SLUG)!;

export const metadata: Metadata = {
  title: { absolute: "Distance Matrix Calculator — Pairwise Distances · MapBench" },
  description:
    "Distance Matrix Calculator: build a pairwise distance table for up to 50 places — straight-line or driving, in miles and km, with CSV export. Free.",
  keywords: ["distance matrix calculator", "distance matrix", "pairwise distance", "distance table", "multiple locations distance"],
  alternates: { canonical: `/tools/${SLUG}` },
  robots: { index: true, follow: true },
  openGraph: {
    type: "website",
    title: "Distance Matrix Calculator — Pairwise Distances · MapBench",
    description:
      "Distance Matrix Calculator: build a pairwise distance table for up to 50 places — straight-line or driving, in miles and km, with CSV export. Free.",
    url: `/tools/${SLUG}`,
    siteName: "MapBench",
  },
  twitter: {
    card: "summary_large_image",
    title: "Distance Matrix Calculator — Pairwise Distances · MapBench",
    description:
      "Distance Matrix Calculator: build a pairwise distance table for up to 50 places — straight-line or driving, in miles and km, with CSV export. Free.",
  },
};

/** Visible FAQ text and FAQPage JSON-LD are generated from this one list,
 *  so the two can never drift apart. */
const FAQS: [string, string][] = [
  [
    "How many places can I add to the matrix?",
    "Up to 50 places in straight-line mode — that is 1,225 unique pairs. The drive, walk and cycle modes are limited to 15 places, because every cell needs its own routed network calculation.",
  ],
  [
    "Is this driving distance or straight-line distance?",
    "Both are available. Straight-line (great-circle) distance is the default and is calculated instantly in your browser. Switch to Drive, Walk or Cycle mode and press the calculate button to fill the same matrix with road-network distances and travel times.",
  ],
  [
    "How accurate are the straight-line distances?",
    "They use the haversine formula on a sphere with a mean Earth radius of 6,371.0088 km, which agrees with an ellipsoidal geodesic to within about 0.3% for most pairs. The result is also only as accurate as the coordinates of the places you enter.",
  ],
  [
    "Can I export the matrix?",
    "Yes. The Wide CSV button downloads the matrix as a grid with place labels across the top and side; the Long CSV button downloads one row per pair, with a minutes column added in the drive, walk and cycle modes. Distances follow the unit (km or mi) you have selected.",
  ],
  [
    "Can I use coordinates instead of place names?",
    "Yes. Search for a place, click the map, use your device location where offered, or open \u201CPaste a list of coordinates\u201D and import one place per line in the form: Name, latitude, longitude.",
  ],
  [
    "Is the matrix symmetric?",
    "In straight-line mode, yes — the distance from A to B always equals B to A, and the diagonal is empty. In the drive, walk and cycle modes a cell can differ by direction, because one-way streets and turn restrictions make some routes directional.",
  ],
  [
    "Does the calculator work out the best order to visit the places?",
    "No. The matrix tells you how far apart every pair is; it does not sequence a trip. For stop ordering, use the Multi-Stop Route Planner — a matrix like this one is the input that route-optimization tools reason over.",
  ],
  [
    "Should I read the table in miles or kilometres?",
    "Whichever your work uses — the km/mi toggle switches the matrix, the pair list and the CSV export together. On this page, US examples are written miles first and European examples kilometres first.",
  ],
  [
    "Can I mix US and European cities in one matrix?",
    "Yes, the calculator works worldwide and places from different continents can share one matrix. Straight-line mode handles any combination; the drive, walk and cycle modes need a routable land connection, so a transatlantic pair will honestly report \u201CNo route\u201D.",
  ],
  [
    "Why is the road distance longer than the straight-line distance?",
    "Roads follow the available network — terrain, rivers, bridges and restrictions — while the straight line is the geometric minimum between two points. European road networks and US interstates both make the driven distance longer than the crow-flies figure; the gap is information, not an error.",
  ],
  [
    "Is anything I enter uploaded or stored?",
    "Straight-line distances are calculated locally in your browser and nothing is stored. The drive, walk and cycle modes send the coordinates to the public Valhalla routing service (built on OpenStreetMap data) to compute the network matrix.",
  ],
];

/** Popular pairs — computed with the tool's own formula (haversine,
 *  R = 6,371.0088 km; miles = km × 0.6213711922) from city-centre
 *  coordinates, so every figure is reproducible in the tool itself. */
const PAIRS: { from: string; to: string; mi: string; km: string }[] = [
  { from: "New York", to: "Chicago", mi: "711", km: "1,144" },
  { from: "New York", to: "Los Angeles", mi: "2,446", km: "3,936" },
  { from: "Chicago", to: "Los Angeles", mi: "1,742", km: "2,804" },
  { from: "Dallas", to: "Houston", mi: "225", km: "362" },
  { from: "New York", to: "Miami", mi: "1,092", km: "1,758" },
  { from: "London", to: "Paris", mi: "213", km: "344" },
  { from: "Paris", to: "Berlin", mi: "545", km: "878" },
  { from: "London", to: "Berlin", mi: "579", km: "932" },
  { from: "Madrid", to: "Barcelona", mi: "314", km: "505" },
  { from: "Rome", to: "Vienna", mi: "475", km: "764" },
];

const RELATED_SLUGS = ["distance-between-two-places", "crow-flies-distance", "driving-distance-calculator", "multi-stop-route-planner"];
const MORE_SLUGS = ["distance-between-cities", "distance-between-zip-codes", "flight-distance-calculator", "halfway-between-two-places", "bearing-calculator", "map-radius"];

function ToolCards({ slugs }: { slugs: string[] }) {
  const tools = slugs.map((s) => toolBySlug.get(s)).filter((t): t is ToolDef => !!t);
  return (
    <div className="mt-4 grid gap-3 sm:grid-cols-2">
      {tools.map((r) => (
        <Link key={r.slug} href={`/tools/${r.slug}`} className="card group rounded-xl p-4 transition-all hover:-translate-y-0.5 hover:border-brand hover:shadow-md">
          <div className="text-sm font-bold group-hover:text-brand-strong">{r.name}</div>
          <div className="mt-1 line-clamp-2 text-xs leading-relaxed text-mute">{r.short}</div>
          <span className="mt-2 block text-xs font-extrabold text-brand-strong">Open tool →</span>
        </Link>
      ))}
    </div>
  );
}

export default function DistanceMatrixCalculatorPage() {
  const author = {
    "@type": "Person",
    "@id": "https://www.mapbench.site/author/aryan-khan#person",
    name: "Aryan Khan",
    url: "https://www.mapbench.site/author/aryan-khan",
    sameAs: ["https://www.linkedin.com/in/aryan-khan-b77438438/"],
  };
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      "@id": `${ABSOLUTE_URL}#tool`,
      name: tool.name,
      description: tool.short,
      url: ABSOLUTE_URL,
      applicationCategory: "UtilitiesApplication",
      operatingSystem: "Any (web browser)",
      isAccessibleForFree: true,
      browserRequirements: "Requires JavaScript and HTML5",
      inLanguage: "en",
      offers: { "@type": "Offer", price: "0", priceCurrency: "USD", availability: "https://schema.org/InStock" },
      featureList: [
        "Straight-line, driving, walking and cycling distance matrices",
        "Up to 50 places in straight-line mode, 15 in network modes",
        "Matrix and pair-list views in miles or kilometres",
        "Wide and long CSV export",
      ],
      author,
      provider: { "@type": "Organization", name: "MapBench", url: "https://www.mapbench.site", logo: { "@type": "ImageObject", url: "https://www.mapbench.site/icon.svg" } },
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: FAQS.map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })),
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: "https://www.mapbench.site/" },
        { "@type": "ListItem", position: 2, name: "Tools", item: "https://www.mapbench.site/tools" },
        { "@type": "ListItem", position: 3, name: "Distance & Bearing", item: "https://www.mapbench.site/tools/category/distance" },
        { "@type": "ListItem", position: 4, name: "Distance Matrix Calculator", item: ABSOLUTE_URL },
      ],
    },
  ];

  return (
    <div className="tool-editorial">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />

      {/* 1. Breadcrumb */}
      <nav aria-label="Breadcrumb" className="mb-4 text-xs text-mute">
        <ol className="flex flex-wrap items-center gap-1.5">
          <li><Link href="/" className="hover:text-brand-strong">Home</Link></li>
          <li aria-hidden>/</li>
          <li><Link href="/tools" className="hover:text-brand-strong">Tools</Link></li>
          <li aria-hidden>/</li>
          <li><Link href="/tools/category/distance" className="hover:text-brand-strong">Distance &amp; Bearing</Link></li>
          <li aria-hidden>/</li>
          <li aria-current="page" className="font-semibold text-ink">Distance Matrix Calculator</li>
        </ol>
      </nav>

      {/* 2. H1 + one-line description + byline */}
      <section className="relative mb-5 overflow-hidden rounded-2xl border border-line bg-gradient-to-br from-white via-white to-brand-soft/35 p-5 shadow-[0_12px_36px_rgba(15,23,42,0.06)] sm:p-7">
        <div className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-brand-soft/70 blur-3xl" />
        <div className="relative max-w-3xl">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-brand/20 bg-brand-soft px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-[0.14em] text-brand-strong">Interactive tool</span>
            <span className="rounded-full border border-line bg-white/80 px-2.5 py-1 text-[10px] font-bold text-mute">Distance &amp; Bearing</span>
          </div>
          <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">Distance Matrix Calculator</h1>
          <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-mute">{tool.short}</p>
          <p className="mt-3 text-xs text-mute">
            By <Link href="/author/aryan-khan" className="font-semibold text-brand-strong hover:underline">Aryan Khan</Link>, Founder &amp; Editor · Updated October 21, 2026
          </p>
          <div className="mt-4 flex flex-wrap gap-2 text-xs text-mute">
            <span className="rounded-lg border border-line bg-white/80 px-2.5 py-1.5">✓ No account required</span>
            <span className="rounded-lg border border-line bg-white/80 px-2.5 py-1.5">✓ {tool.scope}</span>
            <span className="rounded-lg border border-line bg-white/80 px-2.5 py-1.5">✓ Shareable results</span>
          </div>
        </div>
      </section>




      {/* 3. Tool card (tool component unchanged) + plain-language summary */}
      <section className="relative overflow-hidden rounded-2xl border border-line bg-white shadow-[0_14px_42px_rgba(15,23,42,0.07)]">
        <div className="flex items-center justify-between border-b border-line bg-gradient-to-r from-well/60 to-white px-4 py-3 sm:px-5">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-soft text-brand-strong" aria-hidden>⌁</span>
            <div>
              <div className="text-xs font-extrabold uppercase tracking-[0.12em] text-ink">Tool workspace</div>
              <div className="text-[11px] text-mute">Set your inputs, inspect the map and read the result</div>
            </div>
          </div>
          <div className="hidden items-center gap-2 text-[11px] text-mute sm:flex"><span className="h-2 w-2 rounded-full bg-emerald-500" />Ready</div>
        </div>
        <div className="p-4 sm:p-5 lg:p-6">
          <Suspense fallback={<div className="flex h-80 items-center justify-center"><Spinner label="Loading tool…" /></div>}>
            <MatrixTool />
          </Suspense>
        </div>
      </section>
      <p className="mt-3 text-sm leading-relaxed text-mute">
        In plain terms, with the built-in <strong>US cities</strong> sample loaded: the closest pair is New York ↔ Chicago at approx. 711 miles
        (1,144 km), and the farthest pair is New York ↔ Los Angeles at approx. 2,446 miles (3,936 km) — every other pair falls between those two.
      </p>

      <div className="editorial-body mx-auto mt-8 max-w-3xl">
        <nav aria-label="On this page" className="rounded-xl border border-line bg-white px-4 py-3 shadow-sm">
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
            <span className="font-extrabold text-ink">On this page</span>
            <a href="#how-to-use" className="font-semibold text-brand-strong hover:underline">How to use</a>
            <a href="#use-cases" className="font-semibold text-brand-strong hover:underline">Uses &amp; examples</a>
            <a href="#popular-table" className="font-semibold text-brand-strong hover:underline">Popular city pairs</a>
            <a href="#tool-guide" className="font-semibold text-brand-strong hover:underline">How it is calculated</a>
            <a href="#faq" className="font-semibold text-brand-strong hover:underline">FAQ</a>
            <a href="#related-tools" className="font-semibold text-brand-strong hover:underline">Related tools</a>
            <a href="#trust" className="font-semibold text-brand-strong hover:underline">Sources &amp; trust</a>
          </div>
        </nav>



        {/* 5. How to use */}
        <section id="how-to-use" aria-labelledby="howto" className="mt-8 rounded-2xl border border-line bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-4">
            <div className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-brand-strong">Simple workflow</div>
            <h2 id="howto" className="mt-1 font-display text-2xl font-bold">How to use the distance matrix calculator</h2>
            <p className="mt-2 text-sm leading-relaxed text-mute">
              A matrix answers a different question from a single distance: not “how far is A from B?” but “how far is everything
              from everything else?”. Build it once, and the comparisons you actually need — closest, farthest, most central — are
              already on the page.
            </p>
          </div>
          <p id="quick-answer" className="workflow-answer mb-5">A distance matrix compares every pair in a list of places. Use straight-line mode for geographic separation or a routing mode for network distance. Read both directions when routes are directional, and keep the selected units with any exported table.</p>
          <ol className="grid gap-3 md:grid-cols-3">
            <li className="flex gap-3 rounded-xl border border-line bg-well/35 p-4 text-sm leading-relaxed text-mute">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand text-xs font-extrabold text-white">1</span>
              <span className="pt-1">Add your places: search by name, click the map, load a sample, or paste a list of coordinates — up to 50 in straight-line mode.</span>
            </li>
            <li className="flex gap-3 rounded-xl border border-line bg-well/35 p-4 text-sm leading-relaxed text-mute">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand text-xs font-extrabold text-white">2</span>
              <span className="pt-1">Choose a mode — straight line, drive, walk or cycle — and, for the network modes, press the calculate button.</span>
            </li>
            <li className="flex gap-3 rounded-xl border border-line bg-well/35 p-4 text-sm leading-relaxed text-mute">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand text-xs font-extrabold text-white">3</span>
              <span className="pt-1">Read the matrix or the pair list in miles or kilometres, check the nearest and farthest pairs, then download Wide or Long CSV.</span>
            </li>
          </ol>
        </section>

        {/* 6. Use cases + worked examples */}
        <section id="use-cases" aria-labelledby="uses" className="mt-10">
          <h2 id="uses" className="font-display text-2xl font-bold tracking-tight">What people use a distance matrix for</h2>
          <p className="mt-3 leading-7 text-mute">
            A distance matrix compares every origin with every destination so you can see relative separation at a glance instead
            of running dozens of individual calculations. It is the right instrument when a single distance is not the question —
            comparing candidate warehouse sites against several markets, clustering field samples, checking which branches are
            closest to which customers, or building an origin–destination table for a class exercise.
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-line bg-card p-4">
              <h3 className="font-bold">Logistics and delivery planning</h3>
              <p className="mt-2 text-sm leading-7 text-mute">Sketch which depots can serve which cities before committing to routed schedules. The straight-line matrix is the fast first pass; run the critical pairs in drive mode, or through the <Link href="/tools/driving-distance-calculator" className="font-semibold text-brand-strong hover:underline">Driving Distance Calculator</Link>, before promising delivery windows.</p>
            </div>
            <div className="rounded-xl border border-line bg-card p-4">
              <h3 className="font-bold">Choosing a warehouse or store location</h3>
              <p className="mt-2 text-sm leading-7 text-mute">Put each candidate site in the matrix alongside your markets and read down its column: the candidate with the lowest total and worst-case distances is usually the one worth a site visit. A matrix makes that comparison visible instead of anecdotal.</p>
            </div>
            <div className="rounded-xl border border-line bg-card p-4">
              <h3 className="font-bold">Franchise and territory planning</h3>
              <p className="mt-2 text-sm leading-7 text-mute">Check how far apart existing and proposed territories sit, spot two outlets quietly competing for the same town, and keep new locations a defensible distance from established ones — in the US Midwest or across European regions alike.</p>
            </div>
            <div className="rounded-xl border border-line bg-card p-4">
              <h3 className="font-bold">Multi-city trips, teaching and research</h3>
              <p className="mt-2 text-sm leading-7 text-mute">Plan the shape of a multi-city business trip or road trip before sequencing it, or use the matrix as clean origin–destination data in a geography lesson or study. Export the CSV and the same numbers drop straight into a spreadsheet or notebook.</p>
            </div>
          </div>

          <h2 id="worked-examples" className="mt-8 font-display text-2xl font-bold">Worked examples</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <div className="rounded-2xl border border-brand/25 bg-brand-soft/40 p-5">
              <div className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-brand-strong">Example · United States</div>
              <p className="mt-2 text-sm leading-7 text-mute">
                Load the tool&apos;s built-in <strong>US cities</strong> sample (New York, Chicago, Los Angeles, Houston) and the
                six unique pairs read: New York ↔ Chicago <strong>711.0 miles (1,144.3 km)</strong>, Chicago ↔ Houston{" "}
                <strong>941.9 miles (1,515.8 km)</strong>, New York ↔ Houston <strong>1,417.6 miles (2,281.3 km)</strong>,
                Los Angeles ↔ Houston <strong>1,370.9 miles (2,206.3 km)</strong>, Chicago ↔ Los Angeles{" "}
                <strong>1,742.3 miles (2,804.0 km)</strong> and New York ↔ Los Angeles <strong>2,445.6 miles (3,935.8 km)</strong>.
                Closest pair: New York ↔ Chicago. Farthest pair: New York ↔ Los Angeles. Every figure is reproducible in the tool
                itself — press “Sample: US cities” and compare.
              </p>
            </div>
            <div className="rounded-2xl border border-brand/25 bg-brand-soft/40 p-5">
              <div className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-brand-strong">Example · Europe</div>
              <p className="mt-2 text-sm leading-7 text-mute">
                The built-in <strong>Europe</strong> sample (London, Paris, Berlin, Rome) gives: London ↔ Paris{" "}
                <strong>343.5 km (213.5 miles)</strong>, Paris ↔ Berlin <strong>877.5 km (545.2 miles)</strong>, London ↔ Berlin{" "}
                <strong>931.6 km (578.8 miles)</strong>, Paris ↔ Rome <strong>1,105.3 km (686.8 miles)</strong>, Berlin ↔ Rome{" "}
                <strong>1,182.5 km (734.8 miles)</strong> and London ↔ Rome <strong>1,433.8 km (890.9 miles)</strong>. Closest pair:
                London ↔ Paris. Farthest pair: London ↔ Rome. Distances are straight-line; the driven routes are longer, because
                European road networks, like US interstates, cannot follow the geometric minimum.
              </p>
            </div>
          </div>
        </section>

        {/* 7. Popular city pairs */}
        <section id="popular-table" aria-labelledby="pairs" className="mt-10">
          <h2 id="pairs" className="font-display text-2xl font-bold tracking-tight">Popular city pairs</h2>
          <p className="mt-3 text-sm leading-7 text-mute">
            Straight-line distances between city centres, computed with this tool&apos;s own formula (haversine, mean Earth radius
            6,371.0088 km) and rounded to the nearest mile and kilometre — approx. values for planning and comparison, not road
            mileage. Type any pair into the calculator above to reproduce it.
          </p>
          <div className="mt-4 overflow-x-auto rounded-xl border border-line bg-white">
            <table className="w-full min-w-[620px] text-sm">
              <thead className="bg-well/60 text-left text-[11px] uppercase tracking-wider text-mute">
                <tr>
                  <th scope="col" className="px-4 py-3">From</th>
                  <th scope="col" className="px-4 py-3">To</th>
                  <th scope="col" className="px-4 py-3">Miles</th>
                  <th scope="col" className="px-4 py-3">Kilometres</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {PAIRS.map((p) => (
                  <tr key={`${p.from}-${p.to}`}>
                    <td className="px-4 py-3 font-semibold">{p.from}</td>
                    <td className="px-4 py-3 font-semibold">{p.to}</td>
                    <td className="px-4 py-3">{p.mi}</td>
                    <td className="px-4 py-3">{p.km}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* 8. How the distances are calculated */}
        <section id="tool-guide" aria-labelledby="calc" className="mt-10 rounded-2xl border border-line bg-well/35 p-5 sm:p-6">
          <h2 id="calc" className="font-display text-2xl font-bold tracking-tight">How the distances are calculated</h2>
          <p className="mt-3 leading-7 text-mute">
            For every pair of places, the straight-line mode converts both coordinates to radians and applies the haversine
            formula on a sphere with a mean Earth radius of <strong>R = 6,371.0088 km</strong>:
          </p>
          <p className="mt-3 rounded-xl border border-line bg-white px-4 py-3 font-mono text-sm leading-7 text-ink">
            a = sin²(Δφ/2) + cos φ₁ · cos φ₂ · sin²(Δλ/2)<br />
            c = 2 · atan2(√a, √(1 − a))<br />
            d = R · c
          </p>
          <p className="mt-3 leading-7 text-mute">
            Here φ is latitude, λ is longitude and Δ is the difference between the two points. Haversine stays numerically stable
            for very small distances, where the simpler spherical law of cosines loses precision. Because the Earth is an oblate
            ellipsoid rather than a perfect sphere, a haversine result differs from a full ellipsoidal geodesic by about 0.3% at
            most for typical pairs — immaterial for planning, comparison and teaching, and the reason the matrix can be computed
            instantly for up to 50 places. Interpret the matrix according to the metric being used: a straight-line matrix is
            excellent for geographic structure, but it should not be substituted for road travel time when routing matters. Also
            watch for duplicate or ambiguously geocoded place names; one bad location creates an entire misleading row and column.
          </p>
          <p className="mt-3 leading-7 text-mute">
            The drive, walk and cycle modes are different by design: coordinates are sent to the Valhalla routing engine running
            on OpenStreetMap data, which assembles each cell from real road segments and returns both distance and duration.
          </p>
          <p className="mt-3 leading-7 text-mute">
            <strong>When to use something else:</strong> for an exact road itinerary with turn-by-turn legs, use the{" "}
            <Link href="/tools/driving-distance-calculator" className="font-semibold text-brand-strong hover:underline">Driving Distance Calculator</Link>{" "}
            or the routing mode here; for surveying, engineering or legal work, use dedicated ellipsoidal geodesic software and
            authoritative coordinates; and for airline mileage, remember that carriers credit their own programme rules rather
            than any calculator&apos;s great-circle figure.
          </p>
        </section>

        {/* 9. Related tools and resources (prose) */}
        <section aria-labelledby="related-resources" className="mt-10">
          <h2 id="related-resources" className="font-display text-2xl font-bold tracking-tight">Related tools and resources</h2>
          <p className="mt-3 leading-7 text-mute">
            When the question narrows to a single pair, the{" "}
            <Link href="/tools/distance-between-two-places" className="font-semibold text-brand-strong hover:underline">Distance Between Two Places calculator</Link>{" "}
            adds the bearing and midpoint that a matrix cell leaves out. The{" "}
            <Link href="/tools/crow-flies-distance" className="font-semibold text-brand-strong hover:underline">As the Crow Flies Distance tool</Link>{" "}
            makes the straight-line idea explicit for one origin and destination, while the{" "}
            <Link href="/tools/driving-distance-calculator" className="font-semibold text-brand-strong hover:underline">Driving Distance Calculator</Link>{" "}
            follows the road network when the driven figure is the one that matters. Once a matrix has shown you the shape of a
            trip, the{" "}
            <Link href="/tools/multi-stop-route-planner" className="font-semibold text-brand-strong hover:underline">Multi-Stop Route Planner</Link>{" "}
            turns the same places into an ordered route. For the full reasoning behind spherical distance — including where the
            simpler formulas break — read our{" "}
            <Link href="/guides/how-distance-calculation-works" className="font-semibold text-brand-strong hover:underline">guide to how distance calculation works</Link>.
          </p>
        </section>

        {/* 10. FAQ */}
        <ToolMethod tool={tool} />

        <section id="faq" aria-labelledby="faq-heading" className="mt-10">
          <div className="max-w-3xl">
            <div className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-brand-strong">Common questions</div>
            <h2 id="faq-heading" className="mt-1 font-display text-2xl font-bold">Frequently asked questions</h2>
            <p className="mt-2 text-sm leading-relaxed text-mute">Clear answers about the calculation, accuracy and appropriate use.</p>
          </div>
          <div className="mt-4 divide-y divide-line overflow-hidden rounded-2xl border border-line bg-white shadow-sm">
            {FAQS.map(([q, a]) => (
              <details key={q} className="group px-5 py-4 open:bg-well/30">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-bold marker:hidden">
                  <span>{q}</span>
                  <span className="text-xl font-light text-brand-strong transition-transform group-open:rotate-45" aria-hidden>+</span>
                </summary>
                <p className="max-w-3xl pt-3 text-sm leading-7 text-mute">{a}</p>
              </details>
            ))}
          </div>
        </section>

        {/* 11. Data sources and methodology */}
        <section id="trust" className="mt-10">
          <div className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-brand-strong">How this page is maintained</div>
          <h2 className="mt-1 font-display text-2xl font-bold">Sources, methodology &amp; editorial trust</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl border border-line bg-white p-5 shadow-sm">
              <div className="label">Data &amp; privacy</div>
              <ul className="mt-3 space-y-2 text-sm leading-relaxed text-mute">
                <li>✓ Browser-first processing where supported</li>
                <li>✓ External sources are documented</li>
                <li>✓ No account required for public tools</li>
                <li>✓ <Link href="/data-sources" className="font-semibold text-brand-strong hover:underline">Review data sources</Link></li>
              </ul>
            </div>
            <div className="rounded-2xl border border-line bg-white p-5 shadow-sm">
              <div className="label">Method &amp; review</div>
              <p className="mt-3 text-sm leading-relaxed text-mute">Calculations are documented with their assumptions, limitations and source context rather than presented as unexplained answers.</p>
              <div className="mt-3 flex flex-wrap gap-x-3 gap-y-2 text-sm">
                <Link href="/methodology" className="font-semibold text-brand-strong hover:underline">Methodology</Link>
                <Link href="/editorial-policy" className="font-semibold text-brand-strong hover:underline">Editorial policy</Link>
              </div>
            </div>
            <div className="rounded-2xl border border-line bg-white p-5 shadow-sm">
              <div className="label">Editor &amp; category</div>
              <p className="mt-3 text-sm leading-relaxed text-mute">Reviewed and maintained by <Link href="/author/aryan-khan" className="font-semibold text-brand-strong hover:underline">Aryan Khan</Link>, Founder &amp; Editor of MapBench.</p>
              <div className="mt-3 flex items-center gap-2 text-sm font-bold">
                <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: "#b45309" }} />
                Distance &amp; Bearing
              </div>
              <Link href="/tools/category/distance" className="mt-3 inline-block text-sm font-bold text-brand-strong hover:underline">Browse all Distance &amp; Bearing →</Link>
            </div>
          </div>
        </section>

        {/* 12. Card grids — no duplicates between the two grids */}
        <section id="more-tools" className="mt-10" aria-labelledby="more">
          <div className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-brand-strong">Keep measuring</div>
          <h2 id="more" className="mt-1 font-display text-2xl font-bold">More free tools</h2>
          <ToolCards slugs={MORE_SLUGS} />
        </section>

        <section id="related-tools" className="mt-10" aria-labelledby="related">
          <div className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-brand-strong">Continue your workflow</div>
          <h2 id="related" className="mt-1 font-display text-2xl font-bold">Related tools for Distance Matrix Calculator</h2>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-mute">These tools answer adjacent geographic questions with a different method or dataset, so you can compare results instead of forcing one calculator to answer every question.</p>
          <ToolCards slugs={RELATED_SLUGS} />
        </section>
      </div>
    </div>
  );
}
