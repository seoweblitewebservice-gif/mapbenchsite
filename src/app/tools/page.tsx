import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { permanentRedirect } from "next/navigation";
import ToolsDirectory from "@/components/ToolsDirectory";
import { CATEGORIES, TOOLS } from "@/lib/registry";
import { HUBS } from "@/data/hubs";
import { BEST_OF_LINKS } from "@/data/bestOf";
import { HUB_NAV, hubById, toolsInHub } from "@/lib/hubNav";
import { ALL_GUIDES } from "@/data/allGuides";

interface ToolsPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export async function generateMetadata({ searchParams }: ToolsPageProps): Promise<Metadata> {
  const params = await searchParams;
  const hasFilter = Boolean(params.cat || params.q);
  return {
    title: "Free Online Map Tools & Geographic Calculators",
    description:
      "Every free MapBench tool in one directory: distance, bearing, routes, radius, area, farm calculators, location lookups, coordinates, time zones, sun and moon, elevation, KML/GPX/GeoJSON viewers and map makers.",
    keywords: [
      "free map tools",
      "online map tools",
      "free online map tools",
      "interactive map tools",
      "free mapping tools",
      "geographic tools",
      "geographic calculator",
      "free GIS tools online",
    ],
    alternates: { canonical: "/tools" },
    robots: hasFilter ? { index: false, follow: true } : { index: true, follow: true },
  };
}

export default async function ToolsPage({ searchParams }: ToolsPageProps) {
  const params = await searchParams;
  const catParam = Array.isArray(params.cat) ? params.cat[0] : params.cat;
  const qParam = Array.isArray(params.q) ? params.q[0] : params.q;
  const category = catParam ? CATEGORIES.find((item) => item.id === catParam) : undefined;

  // Old filtered URLs were discoverable as /tools?cat=files etc. The dedicated
  // category hubs now contain stronger unique content and direct tool links, so
  // consolidate those duplicate query URLs permanently without removing tools.
  if (category && !qParam) {
    permanentRedirect(`/tools/category/${category.id}`);
  }

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      "@id": "https://www.mapbench.site/tools#page",
      name: "Free online map tools and geographic calculators",
      url: "https://www.mapbench.site/tools",
      isPartOf: { "@type": "WebSite", name: "MapBench", url: "https://www.mapbench.site" },
      mainEntity: {
        "@type": "ItemList",
        numberOfItems: HUBS.length,
        itemListElement: HUB_NAV.map((hub, index) => ({
          "@type": "ListItem",
          position: index + 1,
          name: hub.label,
          url: `https://www.mapbench.site${hub.href}`,
        })),
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: "https://www.mapbench.site/" },
        { "@type": "ListItem", position: 2, name: "All tools", item: "https://www.mapbench.site/tools" },
      ],
    },
  ];

  return (
    <div className="doc mx-auto max-w-5xl">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "&lt;") }} />

      <nav aria-label="Breadcrumb" className="mb-5 font-sans text-xs text-mute">
        <Link href="/" className="hover:text-brand-strong">Home</Link>
        <span aria-hidden className="mx-1">/</span>
        <span className="font-semibold text-ink">All tools</span>
      </nav>

      <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">Free Online Map Tools &amp; Geographic Calculators</h1>
      <div className="mt-4 max-w-3xl space-y-3 text-[15px] leading-relaxed text-mute">
        <p>
          {TOOLS.length} browser-based geographic tools, grouped into {HUBS.length} task hubs so you can tell which page is the authority for a question.
          Every tool is free, works worldwide unless it is marked as US-focused, and needs no account.
        </p>
        <p>
          Start with a hub if you know the job — <Link href="/distance" className="font-semibold text-brand-strong underline decoration-brand/30 underline-offset-4 hover:decoration-brand">distance calculators</Link>,{" "}
          <Link href="/radius" className="font-semibold text-brand-strong underline decoration-brand/30 underline-offset-4 hover:decoration-brand">radius and service area maps</Link>,{" "}
          <Link href="/coordinates" className="font-semibold text-brand-strong underline decoration-brand/30 underline-offset-4 hover:decoration-brand">coordinate converters</Link> or{" "}
          <Link href="/gis-files" className="font-semibold text-brand-strong underline decoration-brand/30 underline-offset-4 hover:decoration-brand">KML, GPX and GeoJSON tools</Link> —
          or use the search box below to filter the full directory by keyword.
        </p>
      </div>

      <div id="search-directory" className="mt-6">
        <Suspense fallback={<div className="card p-10 text-center text-sm text-mute">Loading directory…</div>}>
          <ToolsDirectory />
        </Suspense>
      </div>

      <section className="mt-12" aria-labelledby="tool-hubs">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 id="tool-hubs" className="font-display text-2xl font-bold tracking-tight">Every hub, with its tools</h2>
            <p className="mt-2 max-w-3xl text-sm leading-relaxed text-mute">
              Each hub targets one family of questions and links to every tool inside it. Nothing on this site is more than two clicks from home.
            </p>
          </div>
          <span className="font-sans text-xs font-bold text-mute">{TOOLS.length} tools · {HUBS.length} hubs</span>
        </div>

        <div className="mt-5 space-y-5">
          {HUB_NAV.map((nav) => {
            const hub = hubById.get(nav.id);
            if (!hub) return null;
            const tools = toolsInHub(nav.id);
            return (
              <section key={nav.id} aria-labelledby={`hub-${nav.id}`} className="rounded-2xl border border-line bg-white p-5 shadow-sm">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h3 id={`hub-${nav.id}`} className="font-display text-lg font-bold">
                    <Link href={nav.href} className="hover:text-brand-strong">{hub.label}</Link>
                  </h3>
                  <span className="font-sans text-xs font-bold text-mute">{tools.length} tools</span>
                </div>
                <p className="mt-1 text-sm leading-relaxed text-mute">{hub.short}</p>
                <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5">
                  {tools.map((tool) => (
                    <li key={tool.slug}>
                      <Link href={`/tools/${tool.slug}`} className="text-sm font-semibold text-brand-strong hover:underline">{tool.name}</Link>
                    </li>
                  ))}
                </ul>
                <Link href={nav.href} className="mt-3 inline-block font-sans text-xs font-extrabold text-brand-strong hover:underline">Open the {hub.label.toLowerCase()} hub →</Link>
              </section>
            );
          })}
        </div>
      </section>

      <section className="mt-12 border-t border-line pt-10" aria-labelledby="tools-categories">
        <h2 id="tools-categories" className="font-display text-2xl font-bold tracking-tight">Browse by data family</h2>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-mute">
          The original category guides group tools by the kind of dataset behind them, with methodology notes, key terms and limitations.
        </p>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {CATEGORIES.map((item) => {
            const count = TOOLS.filter((tool) => tool.category === item.id).length;
            return (
              <Link key={item.id} href={`/tools/category/${item.id}`} className="card group p-4 transition-colors hover:border-brand">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="font-display text-base font-bold group-hover:text-brand-strong">{item.label}</h3>
                  <span className="chip">{count}</span>
                </div>
                <p className="mt-2 text-sm leading-relaxed text-mute">{item.short}</p>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="mt-12 border-t border-line pt-10" aria-labelledby="tools-guides">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h2 id="tools-guides" className="font-display text-2xl font-bold tracking-tight">Learn the method behind the tool</h2>
          <Link href="/guides" className="font-sans text-sm font-extrabold text-brand-strong hover:underline">All {ALL_GUIDES.length} guides →</Link>
        </div>
        <ul className="mt-4 grid gap-2 sm:grid-cols-2">
          {ALL_GUIDES.slice(0, 8).map((guide) => (
            <li key={guide.slug}>
              <Link href={`/guides/${guide.slug}`} className="block rounded-xl border border-line bg-well/35 px-4 py-3 text-sm font-semibold transition-colors hover:border-brand hover:text-brand-strong">
                {guide.title}
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-12 border-t border-line pt-10" aria-labelledby="tools-bestof">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h2 id="tools-bestof" className="font-display text-2xl font-bold tracking-tight">Shortlists by task</h2>
          <Link href="/best" className="font-sans text-sm font-extrabold text-brand-strong hover:underline">All best-of lists →</Link>
        </div>
        <ul className="mt-4 grid gap-2 sm:grid-cols-2">
          {BEST_OF_LINKS.slice(0, 8).map((page) => (
            <li key={page.href}>
              <Link href={page.href} className="block rounded-xl border border-line bg-well/35 px-4 py-3 text-sm font-semibold transition-colors hover:border-brand hover:text-brand-strong">
                {page.label}
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
