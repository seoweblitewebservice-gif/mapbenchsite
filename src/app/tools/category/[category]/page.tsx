import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CATEGORIES, toolsByCategory, type CategoryId } from "@/lib/registry";
import { CATEGORY_DATA_NOTE, CATEGORY_GLOSSARY, CATEGORY_TIPS } from "@/data/categoryExtras";
import { SUPPLEMENT } from "@/data/categorySupplement";
import { RESOURCE_CLUSTERS } from "@/data/resourceClusters";

interface Props { params: Promise<{ category: string }> }
const BASE = "https://www.mapbench.site";

export function generateStaticParams() {
  return CATEGORIES.map((category) => ({ category: category.id }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { category: id } = await params;
  const category = CATEGORIES.find((c) => c.id === id);
  if (!category) return {};
  return {
    title: `${category.label} Map Tools & Geographic Calculators`,
    description: `${category.short} Explore free ${category.label.toLowerCase()} tools with documented methods, practical guidance, limitations and related geographic resources.`,
    alternates: { canonical: `/tools/category/${category.id}` },
    robots: { index: true, follow: true },
  };
}

export default async function CategoryPage({ params }: Props) {
  const { category: id } = await params;
  const category = CATEGORIES.find((c) => c.id === id);
  if (!category) notFound();

  const categoryId = category.id as CategoryId;
  const tools = toolsByCategory(categoryId);
  const featured = [...tools].sort((a, b) => Number(Boolean(b.popular)) - Number(Boolean(a.popular))).slice(0, 12);
  const tips = CATEGORY_TIPS[categoryId] || [];
  const glossary = CATEGORY_GLOSSARY[categoryId] || [];
  const supplement = SUPPLEMENT[categoryId];
  const resources = RESOURCE_CLUSTERS[categoryId] || [];

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: `${category.label} Map Tools`,
      description: category.short,
      url: `${BASE}/tools/category/${category.id}`,
      isPartOf: { "@type": "WebSite", name: "MapBench", url: BASE },
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "MapBench", item: BASE },
        { "@type": "ListItem", position: 2, name: "Tools", item: `${BASE}/tools` },
        { "@type": "ListItem", position: 3, name: category.label },
      ],
    },
  ];

  return (
    <div className="doc mx-auto max-w-5xl">
      <nav className="mb-5 font-sans text-xs text-mute"><Link href="/" className="hover:text-brand-strong">Home</Link> / <Link href="/tools" className="hover:text-brand-strong">Tools</Link> / <span>{category.label}</span></nav>

      <header className="max-w-3xl">
        <p className="font-sans text-[11px] font-extrabold uppercase tracking-[0.14em] text-brand-strong">MapBench tool category</p>
        <h1 className="mt-2 font-display text-4xl font-bold tracking-tight">{category.label} Map Tools</h1>
        <p className="mt-4 text-lg leading-relaxed text-mute">{category.short} This hub groups {tools.length} tools that answer related geographic questions while keeping the underlying method, data source and limitations visible.</p>
      </header>

      <section className="mt-10" aria-labelledby="featured-category-tools">
        <div className="flex items-end justify-between gap-4"><div><h2 id="featured-category-tools" className="sect-h">Start with these tools</h2><p className="mt-2 max-w-3xl">Choose the tool that matches the question rather than the one with the most familiar name. Related tools can use different geographic models and legitimately return different answers.</p></div><Link href={`/tools?cat=${category.id}`} className="font-sans text-sm font-extrabold text-brand-strong hover:underline">View all {tools.length} →</Link></div>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((tool) => <Link key={tool.slug} href={`/tools/${tool.slug}`} className="card group p-5 hover:border-brand"><div className="text-[10px] font-extrabold uppercase tracking-wide text-mute">{tool.scope}</div><h3 className="mt-2 font-display text-lg font-bold group-hover:text-brand-strong">{tool.name}</h3><p className="mt-2 text-sm leading-relaxed text-mute">{tool.short}</p><span className="mt-4 block font-sans text-sm font-extrabold text-brand-strong">Open tool →</span></Link>)}
        </div>
      </section>

      <section className="mt-12 border-t border-line pt-10" aria-labelledby="category-method">
        <h2 id="category-method" className="sect-h">How to use this category well</h2>
        <p className="mt-3 max-w-3xl">{CATEGORY_DATA_NOTE[categoryId]}</p>
        <ul className="mt-5 grid gap-4 md:grid-cols-3">{tips.slice(0, 3).map((tip) => <li key={tip} className="card p-4 text-sm leading-relaxed text-mute">{tip}</li>)}</ul>
      </section>

      {supplement && <section className="mt-12 border-t border-line pt-10"><h2 className="sect-h">{supplement.title}</h2><p className="mt-3 max-w-3xl">{supplement.para}</p><ul className="mt-4 list-disc space-y-2 pl-6">{supplement.bullets.map((b) => <li key={b}>{b}</li>)}</ul></section>}

      <section className="mt-12 border-t border-line pt-10" aria-labelledby="category-terms">
        <h2 id="category-terms" className="sect-h">Key terms</h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">{glossary.map(([term, definition]) => <div key={term} className="card p-4"><h3 className="font-sans text-sm font-extrabold">{term}</h3><p className="mt-1 text-sm leading-relaxed text-mute">{definition}</p></div>)}</div>
      </section>

      {resources.length > 0 && <section className="mt-12 border-t border-line pt-10" aria-labelledby="category-reading"><h2 id="category-reading" className="sect-h">Related guides & original research</h2><div className="mt-5 grid gap-4 sm:grid-cols-2">{resources.map((r) => <Link key={r.href} href={r.href} className="card p-5 hover:border-brand"><div className="text-[10px] font-extrabold uppercase tracking-wide text-mute">{r.kind}</div><h3 className="mt-2 font-display text-lg font-bold text-brand-strong">{r.label}</h3><p className="mt-2 text-sm leading-relaxed text-mute">{r.note}</p></Link>)}</div></section>}

      <section className="mt-12 rounded-xl border border-line bg-well/50 p-5"><h2 className="font-display text-xl font-bold">When to verify with an official source</h2><p className="mt-2 text-sm leading-relaxed text-mute">MapBench is designed for analysis, learning and planning. If the result affects a legal boundary, surveying, emergency response, engineering, regulated eligibility, official statistics or a financial commitment, verify the underlying information with the responsible authority or qualified professional.</p></section>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    </div>
  );
}
