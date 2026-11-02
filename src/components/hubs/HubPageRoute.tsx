import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { toolBySlug, type ToolDef } from "@/lib/registry";
import { hubForTool, type HubId } from "@/data/hubs";
import {
  bestOfForHub, crossHubLinks, guidesForHub, hubById, subHubsOf,
  toolCountInHub, toolsInHub,
} from "@/lib/hubNav";

const BASE = "https://www.mapbench.site";
const UPDATED = "2026-11-02";

/** Metadata for a category hub. Kept beside the route so both stay in sync. */
export function hubMetadata(id: HubId): Metadata {
  const hub = hubById.get(id);
  if (!hub) return {};
  return {
    title: hub.title,
    description: hub.description,
    keywords: [hub.primaryKeyword, ...hub.secondaryKeywords],
    alternates: { canonical: hub.slug },
    robots: { index: true, follow: true },
    openGraph: {
      type: "website",
      title: hub.title,
      description: hub.description,
      url: `${BASE}${hub.slug}`,
      siteName: "MapBench",
    },
    twitter: { card: "summary_large_image", title: hub.title, description: hub.description },
  };
}

function Breadcrumbs({ trail }: { trail: { name: string; href: string }[] }) {
  return (
    <nav aria-label="Breadcrumb" className="mb-5 font-sans text-xs text-mute">
      <ol className="flex flex-wrap items-center gap-1.5">
        {trail.map((item, index) => {
          const last = index === trail.length - 1;
          return (
            <li key={item.href} className="flex items-center gap-1.5">
              {last
                ? <span aria-current="page" className="font-semibold text-ink">{item.name}</span>
                : <Link href={item.href} className="hover:text-brand-strong">{item.name}</Link>}
              {!last && <span aria-hidden className="text-mute">/</span>}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

function HubSegments({ parts }: { parts: { t: string; l?: string }[] }) {
  return (
    <>
      {parts.map((part, index) => part.l
        ? <Link key={index} href={part.l} className="font-semibold text-brand-strong underline decoration-brand/30 underline-offset-4 hover:decoration-brand">{part.t}</Link>
        : <span key={index}>{part.t}</span>)}
    </>
  );
}

function ToolCard({ tool, note }: { tool: ToolDef; note?: string }) {
  return (
    <Link href={`/tools/${tool.slug}`} className="card group flex flex-col p-4 transition-colors hover:border-brand">
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-display text-[16px] font-bold leading-snug group-hover:text-brand-strong">{tool.name}</h3>
        {tool.popular && <span className="chip chip-brand shrink-0">Popular</span>}
      </div>
      <p className="mt-2 flex-1 text-sm leading-relaxed text-mute">{note ?? tool.short}</p>
      <span className="mt-3 text-[11px] font-extrabold uppercase tracking-wide text-mute">{tool.scope}</span>
    </Link>
  );
}

/**
 * The pillar page template: H1, breadcrumbs, keyword-led intro, a complete grid
 * of every child tool, a learn-more block for guides, cross-hub links and FAQs.
 * Every link is a real anchor in the server-rendered HTML.
 */
export default function HubPageRoute({ hubId }: { hubId: HubId }) {
  const hub = hubById.get(hubId);
  if (!hub) notFound();

  const tools = toolsInHub(hub.id);
  const top = hub.topTools.map((slug) => toolBySlug.get(slug)).filter((tool): tool is ToolDef => Boolean(tool));
  const topSlugs = new Set(top.map((tool) => tool.slug));
  const rest = tools.filter((tool) => !topSlugs.has(tool.slug));
  const guides = guidesForHub(hub);
  const crossHubs = crossHubLinks(hub.id);
  const subHubs = subHubsOf(hub.id);
  const bestOf = bestOfForHub(hub.id);
  const subHubToolSlugs = new Set(subHubs.flatMap((sub) => tools.map((tool) => tool.slug).filter((slug) => sub.match(slug))));
  const standalone = rest.filter((tool) => !subHubToolSlugs.has(tool.slug));
  const trail = [
    { name: "Home", href: "/" },
    { name: "All tools", href: "/tools" },
    { name: hub.label, href: hub.slug },
  ];

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      "@id": `${BASE}${hub.slug}#page`,
      name: hub.h1,
      description: hub.description,
      url: `${BASE}${hub.slug}`,
      inLanguage: "en",
      isPartOf: { "@type": "WebSite", name: "MapBench", url: BASE },
      dateModified: UPDATED,
      mainEntity: {
        "@type": "ItemList",
        numberOfItems: tools.length,
        itemListElement: tools.map((tool, index) => ({
          "@type": "ListItem",
          position: index + 1,
          name: tool.name,
          url: `${BASE}/tools/${tool.slug}`,
        })),
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: trail.map((item, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: item.name,
        item: item.href === hub.slug ? `${BASE}${hub.slug}` : `${BASE}${item.href === "/" ? "" : item.href}`,
      })),
    },
    ...(hub.faq?.length ? [{
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: hub.faq.map(([question, answer]) => ({
        "@type": "Question",
        name: question,
        acceptedAnswer: { "@type": "Answer", text: answer },
      })),
    }] : []),
  ];

  return (
    <div className="doc mx-auto max-w-5xl">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />

      <Breadcrumbs trail={trail} />

      <header className="max-w-3xl">
        <p className="font-sans text-[11px] font-extrabold uppercase tracking-[0.14em] text-brand-strong">
          {hub.label} · {toolCountInHub(hub.id)} free tools
        </p>
        <h1 className="mt-2 font-display text-4xl font-bold tracking-tight sm:text-[2.6rem]">{hub.h1}</h1>
        <div className="mt-5 space-y-3.5 text-[15px] leading-relaxed text-mute sm:text-base">
          {hub.intro.map((paragraph, index) => (
            <p key={index}><HubSegments parts={paragraph} /></p>
          ))}
        </div>
      </header>

      <section className="mt-10 rounded-2xl border border-brand/25 bg-brand-soft/45 p-5 sm:p-6" aria-labelledby="hub-start">
        <h2 id="hub-start" className="font-display text-xl font-bold">Start with these</h2>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-mute">
          The three tools that answer the most common question in this cluster. Each page states its method, coverage and limits.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {top.map((tool) => (
            <Link key={tool.slug} href={`/tools/${tool.slug}`} className="rounded-xl border border-line bg-white p-4 shadow-sm transition-colors hover:border-brand">
              <span className="block font-sans text-sm font-extrabold text-brand-strong">{tool.name} →</span>
              <span className="mt-1.5 block text-sm leading-6 text-mute">{tool.short}</span>
            </Link>
          ))}
        </div>
      </section>

      {subHubs.length > 0 && (
        <section className="mt-10" aria-labelledby="hub-subhubs">
          <h2 id="hub-subhubs" className="sect-h">Browse by format family</h2>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-mute">
            These sub-hubs group the micro-tools by the file type they read, which is how people usually search for them.
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {subHubs.map((sub) => (
              <Link key={sub.slug} href={sub.slug} className="card group p-4 transition-colors hover:border-brand">
                <span className="block font-display text-[16px] font-bold group-hover:text-brand-strong">{sub.label}</span>
                <span className="mt-1.5 block text-sm leading-relaxed text-mute">{hub.children?.find((child) => child.href === sub.slug)?.note ?? sub.primaryKeyword}</span>
                <span className="mt-3 block text-xs font-extrabold text-brand-strong">Open sub-hub →</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="mt-10" aria-labelledby="hub-all-tools">
        <h2 id="hub-all-tools" className="sect-h">All {hub.label.toLowerCase()} tools</h2>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-mute">
          Every tool in this cluster is linked from this page, so nothing here depends on a search box or a JavaScript menu to be reachable.
        </p>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[...top, ...standalone].map((tool) => <ToolCard key={tool.slug} tool={tool} />)}
        </div>
      </section>

      {subHubs.map((sub) => {
        const members = tools.filter((tool) => sub.match(tool.slug));
        if (!members.length) return null;
        return (
          <section key={sub.slug} className="mt-10" aria-labelledby={`sub-${sub.slug.replace(/\W+/g, "-")}`}>
            <div className="flex flex-wrap items-end justify-between gap-3">
              <h2 id={`sub-${sub.slug.replace(/\W+/g, "-")}`} className="sect-h">{sub.label}</h2>
              <Link href={sub.slug} className="font-sans text-sm font-extrabold text-brand-strong hover:underline">{sub.label} hub →</Link>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {members.map((tool) => <ToolCard key={tool.slug} tool={tool} />)}
            </div>
          </section>
        );
      })}

      {guides.length > 0 && (
        <section className="mt-12 border-t border-line pt-10" aria-labelledby="hub-learn">
          <h2 id="hub-learn" className="sect-h">Learn more about {hub.label.toLowerCase()}</h2>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-mute">
            Guides explain the method behind these numbers, the cases where it misleads, and how to choose between two tools that look interchangeable.
          </p>
          <ul className="mt-5 grid gap-4 sm:grid-cols-2">
            {guides.map((guide) => (
              <li key={guide.href}>
                <Link href={guide.href} className="card group block h-full p-4 transition-colors hover:border-brand">
                  <span className="block font-display text-[16px] font-bold leading-snug group-hover:text-brand-strong">{guide.title}</span>
                  <span className="mt-1.5 block text-sm leading-relaxed text-mute">{guide.note}</span>
                  <span className="mt-3 block text-xs font-extrabold text-brand-strong">Read the guide →</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {crossHubs.length > 0 && (
        <section className="mt-12 border-t border-line pt-10" aria-labelledby="hub-cross">
          <h2 id="hub-cross" className="sect-h">You may also need</h2>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-mute">
            These clusters answer the questions that usually follow a {hub.primaryKeyword} result.
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {crossHubs.map((other) => (
              <Link key={other.id} href={other.slug} className="rounded-xl border border-line bg-well/40 p-4 transition-colors hover:border-brand">
                <span className="block font-sans text-sm font-extrabold text-brand-strong">{other.label} →</span>
                <span className="mt-1.5 block text-sm leading-6 text-mute">{other.short}</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {bestOf.length > 0 && (
        <section className="mt-12 border-t border-line pt-10" aria-labelledby="hub-best">
          <h2 id="hub-best" className="sect-h">Best-of lists in this cluster</h2>
          <ul className="mt-4 space-y-3">
            {bestOf.map((page) => (
              <li key={page.slug}>
                <Link href={page.slug} className="editorial-link font-semibold">{page.h1}</Link>
                <p className="mt-1 text-sm leading-7 text-mute">{page.verdict}</p>
              </li>
            ))}
          </ul>
        </section>
      )}

      {hub.faq?.length ? (
        <section className="mt-12 border-t border-line pt-10" aria-labelledby="hub-faq">
          <h2 id="hub-faq" className="sect-h">Questions about {hub.label.toLowerCase()}</h2>
          <div className="mt-4 divide-y divide-line overflow-hidden rounded-2xl border border-line bg-white">
            {hub.faq.map(([question, answer]) => (
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
      ) : null}

      <section className="mt-12 rounded-xl border border-line bg-well/50 p-5">
        <h2 className="font-display text-xl font-bold">About this hub</h2>
        <p className="mt-2 text-sm leading-relaxed text-mute">
          {toolCountInHub(hub.id)} tools are grouped here because they answer the same family of questions. Every result is produced in your browser from the method stated on its own page; for legal, surveying, safety-critical or regulated decisions, verify the answer with the responsible authority.
        </p>
        <p className="mt-3 font-sans text-sm">
          <Link href="/tools" className="font-extrabold text-brand-strong hover:underline">Browse all tools →</Link>
          <span className="mx-2 text-mute">·</span>
          <Link href="/guides" className="font-extrabold text-brand-strong hover:underline">Mapping guides →</Link>
          <span className="mx-2 text-mute">·</span>
          <Link href="/methodology" className="font-extrabold text-brand-strong hover:underline">Methodology →</Link>
        </p>
      </section>
    </div>
  );
}
