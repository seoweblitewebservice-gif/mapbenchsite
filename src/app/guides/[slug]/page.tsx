import type { Metadata } from "next";
import Link from "next/link";
import ResourceToolLinks from "@/components/ResourceToolLinks";
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
const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
const linkedWords = (parts: Array<string | { href: string; text: string }>) => parts.reduce((n, part) => n + words(typeof part === "string" ? part : part.text), 0);

function Block({ b, index }: { b: GuideBlock; index: number }) {
  switch (b.t) {
    case "h2": {
      const id = `${slugify(b.text)}-${index}`;
      return <h2 id={id} className="scroll-mt-24 border-t border-line pt-10 font-display text-2xl font-bold tracking-tight sm:text-[1.75rem]">{b.text}</h2>;
    }
    case "p": return <p className="text-[17px] leading-[1.9] text-mute sm:text-[18px]">{b.text}</p>;
    case "linkp": return (
      <p className="text-[17px] leading-[1.9] text-mute sm:text-[18px]">
        {b.parts.map((part, i) => typeof part === "string"
          ? <span key={i}>{part}</span>
          : <Link key={i} href={part.href} className="font-semibold text-brand-strong underline decoration-brand/30 underline-offset-4 hover:decoration-brand">{part.text}</Link>)}
      </p>
    );
    case "ul": return <ul className="space-y-3 pl-5 text-[16px] leading-[1.8] text-mute marker:text-brand sm:text-[17px]">{b.items.map((i) => <li key={i}>{i}</li>)}</ul>;
    case "note":
      return <aside className="my-8 rounded-2xl border border-brand/25 bg-brand-soft/55 px-5 py-4 text-[15px] leading-7 text-brand-strong"><div className="mb-1 font-sans text-[10px] font-extrabold uppercase tracking-[0.14em]">Worth noting</div>{b.text}</aside>;
    case "toolbox": {
      const tools = b.slugs.map((s) => toolBySlug.get(s)).filter(Boolean);
      return (
        <section className="my-10 rounded-2xl border border-line bg-white p-5 shadow-sm">
          <div className="font-sans text-[10px] font-extrabold uppercase tracking-[0.14em] text-brand-strong">Useful tools for this topic</div>
          <h3 className="mt-1 font-display text-xl font-bold">Continue with the actual map tools</h3>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {tools.map((t) => (
              <Link key={t!.slug} href={`/tools/${t!.slug}`} className="group rounded-xl border border-line bg-well/20 p-4 transition-all hover:-translate-y-0.5 hover:border-brand hover:shadow-sm">
                <span className="block font-sans text-sm font-extrabold group-hover:text-brand-strong">{t!.name} →</span>
                <span className="mt-1.5 block text-sm leading-6 text-mute">{t!.short}</span>
              </Link>
            ))}
          </div>
        </section>
      );
    }
    case "table": {
      return (
        <div className="my-9 overflow-hidden rounded-2xl border border-line bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] border-collapse text-sm">
              <thead>
                <tr className="bg-well/65">
                  {b.headers.map((h) => (
                    <th key={h} className="border-b border-line px-4 py-3 text-left font-sans text-[11px] font-extrabold uppercase tracking-wide text-mute">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {b.rows.map((r, i) => (
                  <tr key={i} className="border-b border-line last:border-0 even:bg-well/20">
                    {r.map((c, j) => <td key={j} className="px-4 py-3 align-top leading-6 text-mute">{c}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
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
    if (b.t === "linkp") return acc + linkedWords(b.parts);
    if (b.t === "ul") return acc + b.items.reduce((a, i) => a + words(i), 0);
    if (b.t === "table") return acc + b.headers.reduce((a, h) => a + words(h), 0) + b.rows.reduce((a, r) => a + r.reduce((x, c) => x + words(c), 0), 0);
    return acc;
  }, 0);

  const readMins = Math.max(3, Math.ceil(bodyWords / 220));
  const headings = g.blocks.flatMap((b, index) => b.t === "h2" ? [{ text: b.text, id: `${slugify(b.text)}-${index}` }] : []);
  const firstList = g.blocks.find((b) => b.t === "ul");
  const takeaways = firstList?.t === "ul" ? firstList.items.slice(0, 4) : [];

  const toolboxSlugs = g.blocks.filter((b) => b.t === "toolbox").flatMap((b) => (b as { slugs: string[] }).slugs);
  const related = ALL_GUIDES.filter((x) => x.slug !== slug && x.blocks.some((b) => b.t === "toolbox" && b.slugs.some((s) => toolboxSlugs.includes(s))));
  const guideUrl = `https://www.mapbench.site/guides/${g.slug}`;
  const author = { "@type": "Person", "@id": "https://www.mapbench.site/author/aryan-khan#person", name: "Aryan Khan", url: "https://www.mapbench.site/author/aryan-khan", sameAs: ["https://www.linkedin.com/in/aryan-khan-b77438438/"] };

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
      author,
      reviewedBy: author,
      publisher: {
        "@type": "Organization",
        name: "MapBench",
        url: "https://www.mapbench.site",
        logo: { "@type": "ImageObject", url: "https://www.mapbench.site/icon.svg" },
      },
      mainEntityOfPage: { "@type": "WebPage", "@id": guideUrl },
      wordCount: bodyWords,
      timeRequired: `PT${readMins}M`,
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: "https://www.mapbench.site/" },
        { "@type": "ListItem", position: 2, name: "Guides", item: "https://www.mapbench.site/guides" },
        { "@type": "ListItem", position: 3, name: g.title, item: guideUrl },
      ],
    },
  ];

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <article className="mx-auto max-w-6xl">
        <nav aria-label="Breadcrumb" className="mb-7 font-sans text-xs text-mute">
          <Link href="/" className="hover:text-brand-strong">Home</Link> <span className="mx-1">/</span> <Link href="/guides" className="hover:text-brand-strong">Guides</Link> <span className="mx-1">/</span> <span className="font-semibold text-ink">{g.title}</span>
        </nav>

        <header className="mx-auto max-w-4xl border-b border-line pb-9">
          <h1 className="font-display text-4xl font-bold leading-[1.08] tracking-tight sm:text-5xl">{g.title}</h1>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-mute sm:text-xl">{g.description}</p>

          <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2 font-sans text-sm text-mute">
            <Link href="/author/aryan-khan" className="font-extrabold text-ink hover:text-brand-strong">Aryan Khan</Link>
            <span aria-hidden>·</span>
            <span>{new Date(g.date).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</span>
            <span aria-hidden>·</span>
            <span>{readMins} min read</span>
          </div>

          <div className="mt-8 rounded-2xl border border-line bg-white p-5 shadow-sm sm:p-6">
            <div className="font-sans text-[10px] font-extrabold uppercase tracking-[0.14em] text-mute">In brief</div>
            <p className="mt-2 text-[17px] leading-8 text-ink">{g.description}</p>
            {takeaways.length > 0 && (
              <ul className="mt-4 grid gap-2.5 text-sm leading-6 text-mute sm:grid-cols-2">
                {takeaways.map((item) => <li key={item} className="flex gap-2"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand" /><span>{item}</span></li>)}
              </ul>
            )}
          </div>
        </header>

        <div className="mx-auto mt-9 grid max-w-6xl gap-12 lg:grid-cols-[minmax(0,760px)_260px] lg:justify-center">
          <div className="min-w-0">
            <div className="doc space-y-7">
              {g.blocks.map((b, i) => <Block key={i} b={b} index={i} />)}
            </div>

            <section className="mt-14 border-t border-line pt-8">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-brand-soft font-display text-lg font-bold text-brand-strong">AK</div>
                <div>
                  <h2 className="font-display text-xl font-bold">About the author</h2>
                  <p className="mt-2 max-w-2xl text-sm leading-7 text-mute">Aryan Khan edits MapBench with a focus on practical map calculations, coordinate systems, routing concepts, open geographic data and clear limitations. Guides are written to help a reader make a better decision, not just to repeat a definition.</p>
                  <div className="mt-3 flex flex-wrap gap-4 text-sm font-bold">
                    <Link href="/author/aryan-khan" className="text-brand-strong hover:underline">Author profile →</Link>
                    <a href="https://www.linkedin.com/in/aryan-khan-b77438438/" target="_blank" rel="me noopener noreferrer" className="text-brand-strong hover:underline">LinkedIn ↗</a>
                    <Link href="/editorial-policy" className="text-brand-strong hover:underline">Editorial policy →</Link>
                    <Link href="/methodology" className="text-brand-strong hover:underline">Methodology →</Link>
                  </div>
                </div>
              </div>
            </section>

            {related.length > 0 && (
              <section className="mt-12 border-t border-line pt-8">
                <h2 className="font-display text-2xl font-bold">Related reading</h2>
                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  {related.slice(0, 4).map((o) => (
                    <Link key={o.slug} href={`/guides/${o.slug}`} className="group rounded-2xl border border-line bg-white p-5 transition-all hover:-translate-y-0.5 hover:border-brand hover:shadow-sm">
                      <h3 className="font-display text-lg font-bold leading-snug group-hover:text-brand-strong">{o.title}</h3>
                      <p className="mt-2 text-sm leading-6 text-mute">{o.description}</p>
                    </Link>
                  ))}
                </div>
              </section>
            )}
          </div>

          <aside className="hidden lg:block">
            <div className="sticky top-24 space-y-4">
              {headings.length > 0 && (
                <nav aria-label="Article sections" className="rounded-2xl border border-line bg-white p-4 shadow-sm">
                  <div className="font-sans text-[10px] font-extrabold uppercase tracking-[0.14em] text-mute">On this page</div>
                  <ol className="mt-3 space-y-2.5">
                    {headings.map((h) => <li key={h.id}><a href={`#${h.id}`} className="block text-sm leading-5 text-mute hover:text-brand-strong">{h.text}</a></li>)}
                  </ol>
                </nav>
              )}
              <div className="rounded-2xl border border-line bg-well/45 p-4">
                <div className="font-sans text-[10px] font-extrabold uppercase tracking-[0.14em] text-mute">Sources & methods</div>
                <p className="mt-2 text-xs leading-6 text-mute">Check how MapBench calculates results and which public datasets or services are used.</p>
                <div className="mt-3 space-y-2 text-sm font-bold">
                  <Link href="/data-sources" className="block text-brand-strong hover:underline">Data sources →</Link>
                  <Link href="/methodology" className="block text-brand-strong hover:underline">Methodology →</Link>
                  <Link href="/editorial-policy" className="block text-brand-strong hover:underline">Corrections policy →</Link>
                </div>
              </div>
            </div>
          </aside>
        </div>
        <ResourceToolLinks href={`/guides/${g.slug}`} exclude={toolboxSlugs} />
      </article>
    </>
  );
}
