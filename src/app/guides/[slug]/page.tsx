import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { type GuideBlock } from "@/data/guides";
import { ALL_GUIDES, allGuideBySlug } from "@/data/allGuides";
import { toolBySlug } from "@/lib/registry";

interface Props { params: Promise<{ slug: string }> }

export function generateStaticParams() {
  return ALL_GUIDES.map((g) => ({ slug: g.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const g = allGuideBySlug.get(slug);
  if (!g) return {};
  return {
    title: g.title,
    description: g.description,
    alternates: { canonical: `/guides/${g.slug}` },
    robots: { index: true, follow: true },
    openGraph: { title: g.title, description: g.description, type: "article", url: `/guides/${g.slug}`, siteName: "MapBench" },
    twitter: { card: "summary", title: g.title, description: g.description },
  };
}

const words = (s: string) => s.trim().split(/\s+/).filter(Boolean).length;

function Block({ b }: { b: GuideBlock }) {
  switch (b.t) {
    case "h2": return <h2>{b.text}</h2>;
    case "p": return <p>{b.text}</p>;
    case "ul": return <ul>{b.items.map((i) => <li key={i}>{i}</li>)}</ul>;
    case "note":
      return <aside className="my-4 rounded-xl border border-brand/30 bg-brand-soft px-4 py-3 text-sm leading-relaxed text-brand-strong"><strong>Note: </strong>{b.text}</aside>;
    case "toolbox": {
      const tools = b.slugs.map((s) => toolBySlug.get(s)).filter(Boolean);
      return (
        <div className="my-5 rounded-xl border border-line bg-card p-4 font-sans">
          <div className="text-[11px] font-extrabold uppercase tracking-widest text-mute">Tools used in this post</div>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            {tools.map((t) => (
              <a key={t!.slug} href={`/tools/${t!.slug}`} className="group rounded-lg border border-line px-3 py-2 hover:border-brand">
                <span className="block text-sm font-extrabold group-hover:text-brand-strong">→ {t!.name}</span>
                <span className="mt-0.5 line-clamp-1 block text-xs text-mute">{t!.short}</span>
              </a>
            ))}
          </div>
        </div>
      );
    }
  }
}

export default async function GuidePage({ params }: Props) {
  const { slug } = await params;
  const g = allGuideBySlug.get(slug);
  if (!g) notFound();

  const bodyWords = g.blocks.reduce((acc, b) => {
    if (b.t === "p" || b.t === "h2" || b.t === "note") return acc + words(b.text);
    if (b.t === "ul") return acc + b.items.reduce((a, i) => a + words(i), 0);
    return acc;
  }, 0);

  const toolboxSlugs = g.blocks.filter((b) => b.t === "toolbox").flatMap((b) => (b as { slugs: string[] }).slugs);
  const related = ALL_GUIDES.filter((x) => x.slug !== slug && x.blocks.some((b) => b.t === "toolbox" && b.slugs.some((s) => toolboxSlugs.includes(s))));
  const guideUrl = `https://www.mapbench.site/guides/${g.slug}`;

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "Article",
      "@id": `${guideUrl}#article`,
      headline: g.title,
      description: g.description,
      datePublished: g.date,
      dateModified: g.date,
      inLanguage: "en",
      isAccessibleForFree: true,
      author: { "@type": "Organization", name: "MapBench Editorial", url: "https://www.mapbench.site/editorial-policy" },
      publisher: {
        "@type": "Organization",
        name: "MapBench",
        url: "https://www.mapbench.site",
        logo: { "@type": "ImageObject", url: "https://www.mapbench.site/icon.svg" },
      },
      mainEntityOfPage: { "@type": "WebPage", "@id": guideUrl },
      wordCount: bodyWords,
      timeRequired: `PT${g.readMins}M`,
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: "https://www.mapbench.site/" },
        { "@type": "ListItem", position: 2, name: "Blog", item: "https://www.mapbench.site/guides" },
        { "@type": "ListItem", position: 3, name: g.title, item: guideUrl },
      ],
    },
  ];

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <article className="doc mx-auto max-w-3xl">
        <nav aria-label="Breadcrumb" className="mb-4 font-sans text-xs text-mute">
          <Link href="/" className="hover:text-brand-strong">Home</Link> / <Link href="/guides" className="hover:text-brand-strong">Blog</Link> / <span className="font-semibold text-ink">{g.title}</span>
        </nav>
        <p className="font-sans text-xs font-bold uppercase tracking-wide text-mute">{new Date(g.date).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })} · {g.readMins} min read · MapBench editorial</p>
        <h1 className="mt-2 font-display text-3xl font-bold leading-tight tracking-tight sm:text-4xl">{g.title}</h1>
        <p className="mt-4 text-sm leading-relaxed text-mute">{g.description}</p>
        <div className="mt-6">
          {g.blocks.map((b, i) => <Block key={i} b={b} />)}
        </div>
        <div className="mt-10 rounded-xl border border-line bg-card p-4 font-sans text-sm text-mute">
          <strong className="text-ink">Editorial note:</strong> This guide is written and reviewed for MapBench. We correct factual or technical errors when they are reported. See our <Link href="/editorial-policy" className="font-bold text-brand-strong hover:underline">editorial policy</Link>.
        </div>
        {related.length > 0 && (
          <div className="mt-10 border-t border-line pt-6 font-sans">
            <h2 className="font-display text-lg font-bold">Keep reading</h2>
            <ul className="mt-3 space-y-2">
              {related.slice(0, 4).map((o) => (
                <li key={o.slug}><Link href={`/guides/${o.slug}`} className="text-sm font-bold text-brand-strong hover:underline">→ {o.title}</Link><span className="ml-2 text-xs text-mute">Related guide</span></li>
              ))}
            </ul>
          </div>
        )}
      </article>
    </>
  );
}
