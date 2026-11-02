import type { Metadata } from "next";
import Link from "next/link";

const BASE = "https://www.mapbench.site";

/**
 * Blank-map sub-hub. The live blank maps are already indexable at
 * /maps/blank/<country> and /maps/blank/us/<state>, so this page links to those
 * URLs rather than adding a competing copy of the same map under a second path.
 */
const BLANK_MAP_GROUPS: { title: string; note: string; links: [string, string][] }[] = [
  {
    title: "World and continental outlines",
    note: "Country outlines on a neutral projection, available blank or labelled, as SVG or PNG.",
    links: [
      ["/maps/blank/india", "Printable India outline map"],
      ["/maps/blank/canada", "Blank Canada province map"],
      ["/maps/blank/united-kingdom", "United Kingdom outline map"],
      ["/maps/blank/australia", "Australia state outline map"],
      ["/maps/blank/pakistan", "Pakistan blank map"],
      ["/maps/blank/brazil", "Brazil blank map"],
      ["/maps/blank/france", "France blank map"],
      ["/maps/blank/japan", "Japan blank map"],
      ["/maps", "World map outline library"],
    ],
  },
  {
    title: "United States: states and counties",
    note: "All fifty states plus DC, each with county-equivalent boundaries and several styles.",
    links: [
      ["/maps/blank/us/texas", "Texas county map"],
      ["/maps/blank/us/california", "California county map"],
      ["/maps/blank/us/florida", "Florida county map"],
      ["/maps/blank/us/new-york", "New York county map"],
      ["/states", "All US states and county lists"],
      ["/maps", "United States printable map library"],
    ],
  },
];

const FAQ: [string, string][] = [
  ["Are these blank maps free to print?", "Yes. Every blank and outline map is free to download, print and reuse for classroom, personal and internal business work, with no watermark and no account."],
  ["What is the difference between blank, labelled and coloured maps?", "Blank maps show region outlines only, for labelling exercises. Labelled versions add region or country names. Coloured variants fill each region with a tint for presentations. Every variant downloads as SVG or PNG."],
  ["Can I edit the map after downloading?", "Choose SVG. It stays sharp at any size and opens in Illustrator, Inkscape, Figma or any vector editor, where you can recolour regions and add your own labels."],
  ["Which projection are the world maps drawn on?", "The world outline uses the Natural Earth world geometry, displayed on a standard web-mercator view. For area comparisons that depend on projection, use the country size comparison tool instead of the printed outline."],
];

export const metadata: Metadata = {
  title: "Free Printable Blank Maps and Outline Maps",
  description:
    "Free printable blank maps and outline maps of the world, the USA, India, Canada, the UK and Australia. Clean SVG and PNG downloads, no watermark, no account.",
  keywords: ["free printable blank maps", "free printable outline maps", "blank world map", "printable country outline maps", "free svg maps"],
  alternates: { canonical: "/map-maker/blank-maps" },
};

export default function BlankMapsSubHubPage() {
  const trail = [
    { name: "Home", href: "/" },
    { name: "All tools", href: "/tools" },
    { name: "Map maker", href: "/map-maker" },
    { name: "Blank maps", href: "/map-maker/blank-maps" },
  ];

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      "@id": `${BASE}/map-maker/blank-maps#page`,
      name: "Free Printable Blank Maps",
      description: metadata.description,
      url: `${BASE}/map-maker/blank-maps`,
      isPartOf: { "@type": "WebSite", name: "MapBench", url: BASE },
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: trail.map((item, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: item.name,
        item: `${BASE}${item.href === "/" ? "" : item.href}`,
      })),
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: FAQ.map(([question, answer]) => ({ "@type": "Question", name: question, acceptedAnswer: { "@type": "Answer", text: answer } })),
    },
  ];

  return (
    <div className="doc mx-auto max-w-4xl">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />

      <nav aria-label="Breadcrumb" className="mb-5 font-sans text-xs text-mute">
        <ol className="flex flex-wrap items-center gap-1.5">
          {trail.map((item, index) => (
            <li key={item.href} className="flex items-center gap-1.5">
              {index === trail.length - 1
                ? <span aria-current="page" className="font-semibold text-ink">{item.name}</span>
                : <Link href={item.href} className="hover:text-brand-strong">{item.name}</Link>}
              {index < trail.length - 1 && <span aria-hidden>/</span>}
            </li>
          ))}
        </ol>
      </nav>

      <header className="max-w-3xl">
        <p className="font-sans text-[11px] font-extrabold uppercase tracking-[0.14em] text-brand-strong">Map maker · printable maps</p>
        <h1 className="mt-2 font-display text-4xl font-bold tracking-tight">Free Printable Blank Maps and Outline Maps</h1>
        <div className="mt-5 space-y-3.5 text-[15px] leading-relaxed text-mute sm:text-base">
          <p>
            These are working maps, not decoration: clean region outlines with no labels, no watermark and no sign-up, rendered from public geographic geometry and offered as SVG or PNG.
            Start with the{" "}
            <Link href="/tools/blank-map" className="font-semibold text-brand-strong underline decoration-brand/30 underline-offset-4 hover:decoration-brand">blank map generator</Link>{" "}
            if you want to choose a country, projection and style, or jump straight to a{" "}
            <Link href="/maps/blank/india" className="font-semibold text-brand-strong underline decoration-brand/30 underline-offset-4 hover:decoration-brand">printable India outline</Link>{" "}
            or a{" "}
            <Link href="/maps/blank/us/texas" className="font-semibold text-brand-strong underline decoration-brand/30 underline-offset-4 hover:decoration-brand">Texas county map</Link>.
          </p>
          <p>
            SVG is the right choice for anything printed or edited, because it stays sharp at any size and can be recoloured in Illustrator, Inkscape or Figma. PNG is convenient for slides and documents. If you need to measure rather than identify, the area tools in the{" "}
            <Link href="/area" className="font-semibold text-brand-strong underline decoration-brand/30 underline-offset-4 hover:decoration-brand">area and acreage hub</Link>{" "}
            will trace the same geography and give you a number.
          </p>
        </div>
      </header>

      {BLANK_MAP_GROUPS.map((group) => (
        <section key={group.title} className="mt-10" aria-labelledby={group.title.replace(/\W+/g, "-")}>
          <h2 id={group.title.replace(/\W+/g, "-")} className="sect-h">{group.title}</h2>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-mute">{group.note}</p>
          <ul className="mt-4 grid gap-2 sm:grid-cols-2">
            {group.links.map(([href, label]) => (
              <li key={href}>
                <Link href={href} className="flex items-center justify-between gap-3 rounded-xl border border-line bg-white px-4 py-3 text-sm font-semibold transition-colors hover:border-brand hover:text-brand-strong">
                  <span>{label}</span>
                  <span aria-hidden className="text-brand-strong">→</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}

      <section className="mt-12 border-t border-line pt-10" aria-labelledby="blank-more">
        <h2 id="blank-more" className="sect-h">Keep going</h2>
        <ul className="mt-4 grid gap-3 sm:grid-cols-2">
          <li>
            <Link href="/tools/printable-scale-bar-map" className="card group block h-full p-4 transition-colors hover:border-brand">
              <span className="block font-sans text-sm font-extrabold text-brand-strong">Printable map with scale →</span>
              <span className="mt-1.5 block text-sm leading-6 text-mute">Add a scale bar and frame to a printable map so distances survive the printer.</span>
            </Link>
          </li>
          <li>
            <Link href="/guides/free-printable-blank-maps-for-school-and-work" className="card group block h-full p-4 transition-colors hover:border-brand">
              <span className="block font-sans text-sm font-extrabold text-brand-strong">How to choose an outline map →</span>
              <span className="mt-1.5 block text-sm leading-6 text-mute">Outline, labelled or city variant — pick by the task, not by the prettiest preview.</span>
            </Link>
          </li>
          <li>
            <Link href="/map-maker" className="card group block h-full p-4 transition-colors hover:border-brand">
              <span className="block font-sans text-sm font-extrabold text-brand-strong">All map maker tools →</span>
              <span className="mt-1.5 block text-sm leading-6 text-mute">Pin maps, heatmaps, cluster maps, PNG export and embed generators.</span>
            </Link>
          </li>
          <li>
            <Link href="/tools/country-size-comparison" className="card group block h-full p-4 transition-colors hover:border-brand">
              <span className="block font-sans text-sm font-extrabold text-brand-strong">Country size comparison →</span>
              <span className="mt-1.5 block text-sm leading-6 text-mute">Overlay two countries at true scale to show what a printed outline hides.</span>
            </Link>
          </li>
        </ul>
      </section>

      <section className="mt-12 border-t border-line pt-10" aria-labelledby="blank-faq">
        <h2 id="blank-faq" className="sect-h">Blank map questions</h2>
        <div className="mt-4 divide-y divide-line overflow-hidden rounded-2xl border border-line bg-white">
          {FAQ.map(([question, answer]) => (
            <details key={question} className="group px-5 py-4 open:bg-well/30">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-bold marker:hidden">
                <span>{question}</span>
                <span className="text-xl font-light text-brand-strong transition-transform group-open:rotate-45" aria-hidden>+</span>
              </summary>
              <p className="max-w-3xl pt-3 text-sm leading-7 text-mute">{answer}</p>
            </details>
          ))}
        </div>
      </section>
    </div>
  );
}
