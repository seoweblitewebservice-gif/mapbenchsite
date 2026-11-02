import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { toolBySlug } from "@/lib/registry";
import { BEST_OF } from "@/data/bestOf";
import { hubById, guidesForHub } from "@/lib/hubNav";

const BASE = "https://www.mapbench.site";

interface Props { params: Promise<{ slug: string }> }

export function generateStaticParams() {
  return BEST_OF.map((page) => ({ slug: page.slug.replace("/best/", "") }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const page = BEST_OF.find((item) => item.slug === `/best/${slug}`);
  if (!page) return { robots: { index: false, follow: false } };
  return {
    title: page.title,
    description: page.description,
    keywords: [page.primaryKeyword, ...page.secondaryKeywords],
    alternates: { canonical: page.slug },
    robots: { index: true, follow: true },
    openGraph: { type: "article", title: page.title, description: page.description, url: `${BASE}${page.slug}`, siteName: "MapBench" },
    twitter: { card: "summary_large_image", title: page.title, description: page.description },
  };
}

export default async function BestOfPage({ params }: Props) {
  const { slug } = await params;
  const page = BEST_OF.find((item) => item.slug === `/best/${slug}`);
  if (!page) notFound();

  const hubs = page.hubs.map((id) => hubById.get(id)).filter(Boolean);
  const trail = [
    { name: "Home", href: "/" },
    { name: "Best of", href: "/best" },
    { name: page.h1, href: page.slug },
  ];
  const guideLinks = hubs.flatMap((hub) => (hub ? guidesForHub(hub).slice(0, 1) : []));
  const seenGuides = new Set<string>();
  const uniqueGuides = guideLinks.filter((guide) => (seenGuides.has(guide.href) ? false : (seenGuides.add(guide.href), true))).slice(0, 3);

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "ItemList",
      "@id": `${BASE}${page.slug}#list`,
      name: page.h1,
      description: page.description,
      numberOfItems: page.picks.length,
      itemListOrder: "https://schema.org/ItemListOrderAscending",
      itemListElement: page.picks.map((pick, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: pick.label,
        url: `${BASE}${pick.href.startsWith("/tools/") ? pick.href : pick.href}`,
      })),
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
    ...(page.faq?.length ? [{
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: page.faq.map(([question, answer]) => ({
        "@type": "Question",
        name: question,
        acceptedAnswer: { "@type": "Answer", text: answer },
      })),
    }] : []),
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

      <header>
        <p className="font-sans text-[11px] font-extrabold uppercase tracking-[0.14em] text-brand-strong">Curated list · updated 2 November 2026</p>
        <h1 className="mt-2 font-display text-4xl font-bold tracking-tight">{page.h1}</h1>
        <p className="mt-4 text-lg leading-8 text-ink">{page.verdict}</p>
        <div className="mt-4 space-y-3 text-[15px] leading-relaxed text-mute">
          {page.intro.map((paragraph, index) => <p key={index}>{paragraph}</p>)}
        </div>
      </header>

      <ol className="mt-9 space-y-4">
        {page.picks.map((pick, index) => {
          const tool = pick.href.startsWith("/tools/") ? toolBySlug.get(pick.href.replace("/tools/", "")) : undefined;
          const hub = pick.kind === "hub" ? hubs.find((item) => item?.slug === pick.href) : undefined;
          const label = tool?.name ?? hub?.label ?? pick.label;
          return (
            <li key={pick.href} className="rounded-2xl border border-line bg-white p-5 shadow-sm">
              <div className="flex items-start gap-4">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-soft font-sans text-sm font-extrabold text-brand-strong">{index + 1}</span>
                <div className="min-w-0">
                  <h2 className="font-display text-lg font-bold leading-snug">
                    <Link href={pick.href} className="hover:text-brand-strong hover:underline">{label}</Link>
                  </h2>
                  <p className="mt-1.5 text-sm leading-7 text-mute">{pick.why}</p>
                  {pick.kind && (
                    <span className="mt-2 inline-block rounded-full border border-line bg-well/50 px-2 py-0.5 font-sans text-[10px] font-extrabold uppercase tracking-wide text-mute">
                      {pick.kind === "hub" ? "Hub" : pick.kind === "guide" ? "Guide" : "Page"}
                    </span>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ol>

      <section className="mt-10 rounded-2xl border border-line bg-well/45 p-5" aria-labelledby="best-method">
        <h2 id="best-method" className="font-display text-xl font-bold">How this list was chosen</h2>
        <p className="mt-2 text-sm leading-7 text-mute">{page.method}</p>
        <p className="mt-2 text-sm leading-7 text-mute">
          MapBench is a single site, so this is a recommendation list rather than an independent market survey. Every listed tool is free, needs no account, and publishes the method behind its result.
        </p>
      </section>

      <section className="mt-10" aria-labelledby="best-hubs">
        <h2 id="best-hubs" className="font-display text-xl font-bold">Browse the full clusters</h2>
        <ul className="mt-4 grid gap-3 sm:grid-cols-2">
          {hubs.map((hub) => hub && (
            <li key={hub.id}>
              <Link href={hub.slug} className="card group block h-full p-4 transition-colors hover:border-brand">
                <span className="block font-sans text-sm font-extrabold text-brand-strong">{hub.label} →</span>
                <span className="mt-1.5 block text-sm leading-6 text-mute">{hub.short}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {uniqueGuides.length > 0 && (
        <section className="mt-10" aria-labelledby="best-guides">
          <h2 id="best-guides" className="font-display text-xl font-bold">Read before you rely on the number</h2>
          <ul className="mt-4 space-y-3">
            {uniqueGuides.map((guide) => (
              <li key={guide.href}>
                <Link href={guide.href} className="editorial-link font-semibold">{guide.title}</Link>
                <p className="mt-1 text-sm leading-7 text-mute">{guide.note}</p>
              </li>
            ))}
          </ul>
        </section>
      )}

      {page.faq?.length ? (
        <section className="mt-10" aria-labelledby="best-faq">
          <h2 id="best-faq" className="font-display text-xl font-bold">Common questions</h2>
          <div className="mt-4 divide-y divide-line overflow-hidden rounded-2xl border border-line bg-white">
            {page.faq.map(([question, answer]) => (
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

      <p className="mt-10 font-sans text-sm">
        <Link href="/best" className="font-extrabold text-brand-strong hover:underline">All best-of lists →</Link>
        <span className="mx-2 text-mute">·</span>
        <Link href="/tools" className="font-extrabold text-brand-strong hover:underline">Browse every tool →</Link>
      </p>
    </div>
  );
}
