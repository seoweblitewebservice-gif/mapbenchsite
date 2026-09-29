import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { toolBySlug, TOOLS, CATEGORIES } from "@/lib/registry";
import ToolClient from "@/components/ToolClient";

interface Props { params: Promise<{ tool: string }> }

export function generateStaticParams() {
  return TOOLS.map((t) => ({ tool: t.slug }));
}

function seoTitle(name: string, keywords: string[]) {
  const primary = keywords[0];
  if (primary && primary.length < 40 && !name.toLowerCase().includes(primary.toLowerCase())) {
    return `${name} — Free Online ${primary.replace(/^./, (c) => c.toUpperCase())} Tool`;
  }
  return `${name} — Free Online Map Tool`;
}

function seoDescription(tool: { name: string; short: string; intro: string; scope: string }) {
  const base = tool.intro?.trim() || tool.short;
  const tail = ` Free, no sign-up. Coverage: ${tool.scope}. Runs in your browser on MapBench.`;
  const combined = base.endsWith(".") ? base + tail : base + "." + tail;
  return combined.length > 160 ? combined.slice(0, 157) + "…" : combined;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { tool: slug } = await params;
  const tool = toolBySlug.get(slug);
  if (!tool) return {};
  const url = `/tools/${tool.slug}`;
  const title = seoTitle(tool.name, tool.keywords);
  const description = seoDescription(tool);
  return {
    title,
    description,
    keywords: [...tool.keywords, tool.name, "free", "map tool", "no sign-up"],
    alternates: { canonical: url },
    robots: { index: true, follow: true },
    openGraph: {
      type: "website",
      title: `${tool.name} — Free Online Tool | MapBench`,
      description,
      url,
      siteName: "MapBench",
    },
    twitter: {
      card: "summary",
      title: `${tool.name} · MapBench`,
      description,
    },
  };
}

export default async function ToolPage({ params }: Props) {
  const { tool: slug } = await params;
  const tool = toolBySlug.get(slug);
  if (!tool) notFound();
  const category = CATEGORIES.find((c) => c.id === tool.category);
  const absoluteUrl = `https://www.mapbench.site/tools/${tool.slug}`;

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      "@id": `${absoluteUrl}#tool`,
      name: tool.name,
      description: tool.short,
      url: absoluteUrl,
      applicationCategory: "UtilitiesApplication",
      operatingSystem: "Any (web browser)",
      isAccessibleForFree: true,
      browserRequirements: "Requires JavaScript and HTML5",
      inLanguage: "en",
      offers: { "@type": "Offer", price: "0", priceCurrency: "USD", availability: "https://schema.org/InStock" },
      featureList: tool.howTo,
      provider: {
        "@type": "Organization",
        name: "MapBench",
        url: "https://www.mapbench.site",
        logo: { "@type": "ImageObject", url: "https://www.mapbench.site/icon.svg" },
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "HowTo",
      name: `How to use ${tool.name}`,
      description: tool.short,
      inLanguage: "en",
      step: tool.howTo.map((text, i) => ({
        "@type": "HowToStep",
        position: i + 1,
        name: `Step ${i + 1}`,
        text,
      })),
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: "https://www.mapbench.site/" },
        { "@type": "ListItem", position: 2, name: "Tools", item: "https://www.mapbench.site/tools" },
        ...(category ? [{ "@type": "ListItem", position: 3, name: category.label, item: `https://www.mapbench.site/tools?cat=${category.id}` }] : []),
        { "@type": "ListItem", position: category ? 4 : 3, name: tool.name, item: absoluteUrl },
      ],
    },
    ...(tool.faq.length ? [{
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: tool.faq.map(([q, a]) => ({
        "@type": "Question",
        name: q,
        acceptedAnswer: { "@type": "Answer", text: a },
      })),
    }] : []),
    {
      "@context": "https://schema.org",
      "@type": "WebPage",
      "@id": absoluteUrl,
      url: absoluteUrl,
      name: tool.name,
      description: tool.short,
      isPartOf: { "@type": "WebSite", name: "MapBench", url: "https://www.mapbench.site" },
      about: { "@id": `${absoluteUrl}#tool` },
    },
  ];

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <ToolClient slug={tool.slug} />
    </>
  );
}
