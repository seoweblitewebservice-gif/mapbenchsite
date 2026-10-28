import type { Metadata } from "next";
import Link from "next/link";
import { CATEGORIES, TOOLS, toolBySlug, type ToolDef } from "@/lib/registry";
import { allGuideBySlug } from "@/data/allGuides";
import { STUDIES } from "@/data/studies";
import {
  FEATURED_SECTIONS,
  HOMEPAGE_GUIDE_SLUGS,
  POPULAR_SLUGS,
} from "@/data/homepage";
import BlankMapsHomeGrid from "@/components/BlankMapsHomeGrid";
import HomeToolFinder from "@/components/HomeToolFinder";

export const metadata: Metadata = {
  title: "Free Map Tools, Geographic Calculators & Blank Maps",
  description:
    "Free map tools: radius, distance, drive time, coordinates, counties, ZIP codes, elevation, GPS files and printable blank maps. No sign-up.",
  alternates: { canonical: "/" },
};

const HOME_FAQ: [string, string][] = [
  ["What is MapBench?", "MapBench is a free collection of interactive map tools, geographic calculators, printable blank maps, original geographic studies and practical mapping guides. Use it for distance, radius, drive time, coordinates, elevation, GPS files, location questions and more."],
  ["Are the tools really free?", "Yes. Public MapBench tools are free to use and do not require an account."],
  ["Do the tools work outside the United States?", "Most tools are worldwide. Some tools are US-focused because the underlying ZIP, county or government dataset is specific to the United States; coverage is labelled on the page."],
  ["How accurate are the calculations?", "Accuracy depends on the method and dataset. MapBench documents whether a result uses geometric distance, road-network routing, public boundaries, browser location or another source, and highlights important limitations on each tool page."],
  ["Is my location or file data stored?", "Browser-first tools keep processing local where possible. When a lookup needs an external public service, only the data needed for that request is sent. File tools are designed to process supported files locally in the browser where stated."],
];

function ToolCard({ tool }: { tool: ToolDef }) {
  const categoryLabel =
    CATEGORIES.find((category) => category.id === tool.category)?.label ??
    tool.category;
  return (
    <Link
      href={`/tools/${tool.slug}`}
      className="card group flex h-full flex-col p-5 transition-colors hover:border-brand"
    >
      <div className="font-sans text-[10px] font-extrabold uppercase tracking-[0.1em] text-mute">
        {categoryLabel}
      </div>
      <h3 className="mt-2 font-display text-[16px] font-bold leading-snug group-hover:text-brand-strong">
        {tool.name}
      </h3>
      <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-mute">
        {tool.short}
      </p>
    </Link>
  );
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
  const countFor = (id: string) =>
    TOOLS.filter((tool) => tool.category === id).length;
  const guides = HOMEPAGE_GUIDE_SLUGS.map((slug) =>
    allGuideBySlug.get(slug),
  ).filter((guide) => Boolean(guide));
  const studies = STUDIES.slice(0, 3);

  return (
    <div className="doc">
      {/* 1. Compact hero with working search across all tools */}
      <section className="hero-map relative overflow-visible border-b border-line">
        <div className="hero-map-bg" aria-hidden />
        <div className="hero-map-fade" aria-hidden />
        <div className="relative z-[1] mx-auto max-w-5xl px-4 py-10 text-center sm:py-14">
          <p className="mb-3 font-sans text-[11px] font-extrabold uppercase tracking-[0.16em] text-brand-strong">
            Free · No sign-up · Methods explained
          </p>
          <h1 className="font-display text-4xl font-bold leading-[1.12] tracking-tight text-ink sm:text-5xl">
            Free Map Tools & Printable Maps
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-[15px] leading-relaxed text-mute sm:text-base">
            {TOOLS.length} free tools for radius circles, distances, drive
            times, coordinates and printable maps. Type a task below to find
            the right one — no account required.
          </p>

          <HomeToolFinder tools={searchTools} suggested={[]} compact />
        </div>
      </section>

      {/* 2. Popular tools — exactly 8 curated cards */}
      <section aria-labelledby="popular-tools" className="mx-auto max-w-5xl px-4 pt-10">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="max-w-2xl">
            <h2 id="popular-tools" className="sect-h">Popular map tools</h2>
            <p className="mt-3">
              Start here if you are new. Each card opens a free tool, and the
              complete directory is one click away.
            </p>
          </div>
          <Link
            href="/tools"
            className="font-sans text-sm font-extrabold text-brand-strong hover:underline"
          >
            View all {TOOLS.length} tools →
          </Link>
        </div>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {popular.map((tool) => (
            <ToolCard key={tool.slug} tool={tool} />
          ))}
        </div>
      </section>

      {/* 3. Browse by category — all 12 canonical hubs */}
      <section aria-labelledby="browse-categories" className="mx-auto max-w-5xl px-4 pt-12">
        <div className="max-w-2xl">
          <h2 id="browse-categories" className="sect-h">Browse tools by task</h2>
          <p className="mt-3">
            Every tool lives in one of these {CATEGORIES.length} task hubs.
            Each hub explains the method, lists every tool and links to
            related guides.
          </p>
        </div>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {CATEGORIES.map((category) => (
            <Link
              key={category.id}
              href={`/tools/category/${category.id}`}
              className="card group flex h-full flex-col p-5 transition-colors hover:border-brand"
            >
              <div className="flex items-center justify-between gap-3">
                <h3 className="font-display text-[16px] font-bold leading-snug group-hover:text-brand-strong">
                  {category.label}
                </h3>
                <span className="chip shrink-0">
                  {countFor(category.id)} tools
                </span>
              </div>
              <p className="mt-2 line-clamp-2 flex-1 text-sm leading-relaxed text-mute">
                {category.short}
              </p>
              <span className="mt-3 font-sans text-xs font-extrabold text-brand-strong">
                Open category →
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* 4. Featured category sections — at most 3, no popular-link repeats */}
      {FEATURED_SECTIONS.map((section) => {
        const category = CATEGORIES.find((item) => item.id === section.categoryId);
        const tools = section.slugs
          .map((slug) => toolBySlug.get(slug))
          .filter((tool): tool is ToolDef => Boolean(tool));
        return (
          <section
            key={section.categoryId}
            aria-labelledby={`featured-${section.categoryId}`}
            className="mx-auto max-w-5xl px-4 pt-12"
          >
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div className="max-w-2xl">
                <p className="font-sans text-[11px] font-extrabold uppercase tracking-[0.14em] text-brand-strong">
                  {category?.label ?? section.categoryId} tools
                </p>
                <h2 id={`featured-${section.categoryId}`} className="sect-h mt-2">
                  {section.heading}
                </h2>
                <p className="mt-3">{section.blurb}</p>
              </div>
              <Link
                href={`/tools/category/${section.categoryId}`}
                className="font-sans text-sm font-extrabold text-brand-strong hover:underline"
              >
                View all {countFor(section.categoryId)} →
              </Link>
            </div>
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {tools.map((tool) => (
                <ToolCard key={tool.slug} tool={tool} />
              ))}
            </div>
          </section>
        );
      })}

      {/* 5. Printable maps — compact preview */}
      <section aria-labelledby="blank-maps" className="mt-12 border-t border-line bg-well/50 py-10">
        <div className="mx-auto max-w-5xl px-4">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div className="max-w-2xl">
              <h2 id="blank-maps" className="sect-h">Printable blank maps</h2>
              <p className="mt-3">
                Clean outline maps for worksheets, presentations and design
                work, rendered from public geographic geometry.
              </p>
            </div>
            <Link
              href="/maps"
              className="font-sans text-sm font-extrabold text-brand-strong hover:underline"
            >
              Browse all blank maps →
            </Link>
          </div>
          <div className="mt-6">
            <BlankMapsHomeGrid limit={5} />
          </div>
        </div>
      </section>

      {/* 6a. Guides — exactly 3 */}
      <section aria-labelledby="guides" className="mx-auto max-w-5xl px-4 pt-12">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="max-w-2xl">
            <h2 id="guides" className="sect-h">Learn the geography behind the tools</h2>
            <p className="mt-3">
              Short, practical guides on the methods where choosing correctly
              matters as much as the final number.
            </p>
          </div>
          <Link
            href="/guides"
            className="font-sans text-sm font-extrabold text-brand-strong hover:underline"
          >
            Read all guides →
          </Link>
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {guides.map((guide) => (
            <Link
              key={guide!.slug}
              href={`/guides/${guide!.slug}`}
              className="card group flex h-full flex-col p-5 transition-colors hover:border-brand"
            >
              <div className="font-sans text-[10px] font-extrabold uppercase tracking-[0.1em] text-mute">
                Guide · {guide!.readMins} min read
              </div>
              <h3 className="mt-2 font-display text-[16px] font-bold leading-snug group-hover:text-brand-strong">
                {guide!.title}
              </h3>
              <p className="mt-2 line-clamp-3 flex-1 text-sm leading-relaxed text-mute">
                {guide!.description}
              </p>
            </Link>
          ))}
        </div>
      </section>

      {/* 6b. Studies — exactly 3 */}
      <section aria-labelledby="studies" className="mx-auto max-w-5xl px-4 pt-12">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="max-w-2xl">
            <p className="font-sans text-[11px] font-extrabold uppercase tracking-[0.14em] text-brand-strong">
              Original MapBench research
            </p>
            <h2 id="studies" className="sect-h mt-2">
              Geographic studies with open methods
            </h2>
            <p className="mt-3">
              Small data studies built from documented MapBench datasets and
              formulas, so every ranking can be checked.
            </p>
          </div>
          <Link
            href="/studies"
            className="font-sans text-sm font-extrabold text-brand-strong hover:underline"
          >
            Browse all studies →
          </Link>
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {studies.map((study) => (
            <Link
              key={study.slug}
              href={`/studies/${study.slug}`}
              className="card group flex h-full flex-col p-5 transition-colors hover:border-brand"
            >
              <div className="font-sans text-[10px] font-extrabold uppercase tracking-[0.1em] text-mute">
                Data study · {study.date}
              </div>
              <h3 className="mt-2 font-display text-[16px] font-bold leading-snug group-hover:text-brand-strong">
                {study.title}
              </h3>
              <p className="mt-2 line-clamp-3 flex-1 text-sm leading-relaxed text-mute">
                {study.description}
              </p>
            </Link>
          ))}
        </div>
      </section>

      {/* 7. Short FAQ */}
      <section aria-labelledby="faq" className="mt-12 border-t border-line bg-well/40 py-12">
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
