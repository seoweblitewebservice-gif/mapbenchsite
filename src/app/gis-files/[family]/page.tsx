import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { hubById, subHubBySlug, toolsInSubHub, guidesForHub } from "@/lib/hubNav";

const BASE = "https://www.mapbench.site";

interface Props { params: Promise<{ family: string }> }

export function generateStaticParams() {
  return ["geojson", "gpx", "other"].map((family) => ({ family }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { family } = await params;
  const sub = subHubBySlug.get(`/gis-files/${family}`);
  if (!sub) return { robots: { index: false, follow: false } };
  return {
    title: sub.title,
    description: sub.description,
    keywords: [sub.primaryKeyword, ...sub.secondaryKeywords],
    alternates: { canonical: sub.slug },
    robots: { index: true, follow: true },
    openGraph: { type: "website", title: sub.title, description: sub.description, url: `${BASE}${sub.slug}`, siteName: "MapBench" },
  };
}

function Segments({ parts }: { parts: { t: string; l?: string }[] }) {
  return <>{parts.map((part, i) => part.l
    ? <Link key={i} href={part.l} className="font-semibold text-brand-strong underline decoration-brand/30 underline-offset-4 hover:decoration-brand">{part.t}</Link>
    : <span key={i}>{part.t}</span>)}</>;
}

export default async function GisFamilyPage({ params }: Props) {
  const { family } = await params;
  const sub = subHubBySlug.get(`/gis-files/${family}`);
  if (!sub) notFound();
  const parent = hubById.get(sub.parent);
  if (!parent) notFound();
  const tools = toolsInSubHub(sub);
  const guides = guidesForHub(parent).slice(0, 3);
  const siblings = ["geojson", "gpx", "other"]
    .map((slug) => subHubBySlug.get(`/gis-files/${slug}`))
    .filter((item) => item && item.slug !== sub.slug);

  const trail = [
    { name: "Home", href: "/" },
    { name: "All tools", href: "/tools" },
    { name: parent.label, href: parent.slug },
    { name: sub.label, href: sub.slug },
  ];

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      "@id": `${BASE}${sub.slug}#page`,
      name: sub.h1,
      description: sub.description,
      url: `${BASE}${sub.slug}`,
      isPartOf: { "@type": "WebSite", name: "MapBench", url: BASE },
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
        item: `${BASE}${item.href === "/" ? "" : item.href}`,
      })),
    },
  ];

  return (
    <div className="doc mx-auto max-w-5xl">
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
        <p className="font-sans text-[11px] font-extrabold uppercase tracking-[0.14em] text-brand-strong">{sub.label} · {tools.length} tools</p>
        <h1 className="mt-2 font-display text-4xl font-bold tracking-tight">{sub.h1}</h1>
        <div className="mt-5 space-y-3.5 text-[15px] leading-relaxed text-mute sm:text-base">
          {sub.intro.map((paragraph, index) => <p key={index}><Segments parts={paragraph} /></p>)}
        </div>
      </header>

      <section className="mt-10" aria-labelledby="family-tools">
        <h2 id="family-tools" className="sect-h">All {sub.label.toLowerCase()}</h2>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-mute">
          Every tool in this family, each linked directly. Files are read in your browser; nothing is uploaded.
        </p>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {tools.map((tool) => (
            <Link key={tool.slug} href={`/tools/${tool.slug}`} className="card group flex flex-col p-4 transition-colors hover:border-brand">
              <h3 className="font-display text-[16px] font-bold leading-snug group-hover:text-brand-strong">{tool.name}</h3>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-mute">{tool.short}</p>
              <span className="mt-3 text-[11px] font-extrabold uppercase tracking-wide text-mute">{tool.scope}</span>
            </Link>
          ))}
        </div>
      </section>

      {siblings.length > 0 && (
        <section className="mt-12 border-t border-line pt-10" aria-labelledby="family-siblings">
          <h2 id="family-siblings" className="sect-h">Other file families</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {siblings.map((sibling) => sibling && (
              <Link key={sibling.slug} href={sibling.slug} className="card group p-4 transition-colors hover:border-brand">
                <span className="block font-sans text-sm font-extrabold text-brand-strong">{sibling.label} →</span>
                <span className="mt-1.5 block text-sm leading-6 text-mute">{sibling.description}</span>
              </Link>
            ))}
            <Link href={parent.slug} className="card group p-4 transition-colors hover:border-brand">
              <span className="block font-sans text-sm font-extrabold text-brand-strong">All {parent.label.toLowerCase()} →</span>
              <span className="mt-1.5 block text-sm leading-6 text-mute">Viewers, converters and the parent hub for this family.</span>
            </Link>
          </div>
        </section>
      )}

      {guides.length > 0 && (
        <section className="mt-12 border-t border-line pt-10" aria-labelledby="family-guides">
          <h2 id="family-guides" className="sect-h">Learn more</h2>
          <ul className="mt-4 space-y-3">
            {guides.map((guide) => (
              <li key={guide.href}>
                <Link href={guide.href} className="editorial-link font-semibold">{guide.title}</Link>
                <p className="mt-1 text-sm leading-7 text-mute">{guide.note}</p>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
