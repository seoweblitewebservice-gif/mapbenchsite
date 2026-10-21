import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { toolBySlug, TOOLS, CATEGORIES } from "@/lib/registry";
import ToolClient from "@/components/ToolClient";
import { getEnhancedFaqs } from "@/lib/toolFaqs";
import { loadPageContent } from "@/lib/pageContent";

interface Props { params: Promise<{ tool: string }> }

export function generateStaticParams() {
  // "distance-matrix-calculator" is served by its own dedicated route
  // (src/app/tools/distance-matrix-calculator/page.tsx) — pilot restructure.
  return TOOLS.filter((t) => t.slug !== "distance-matrix-calculator").map((t) => ({ tool: t.slug }));
}

const TITLE_OVERRIDES: Record<string, string> = {
  "distance-between-two-places": "Distance Between Two Places: Miles, Km & Bearing",
  "halfway-between-two-places": "Halfway Between Two Places: Midpoint & Meeting Point",
  "cities-within-radius": "Cities Within a Radius: Find Nearby US Cities & Towns",
  "population-within-radius": "Population Within a Radius: Census Demographics & Income",
  "zip-codes-within-radius": "ZIP Codes Within a Radius: Census ZCTA Finder",
  "coordinate-converter": "GPS Coordinate Converter: DD, DMS, DMM, UTM, MGRS & Geohash",
  "bearing-calculator": "Bearing Calculator: Compass Direction Between Two Points",
  "map-radius": "Map Radius Tool: Draw a Radius Around Any Location",
  "drive-time-map": "Drive Time Map: See How Far You Can Travel",
  "driving-distance-calculator": "Driving Distance Calculator: Road Miles & Travel Time",
  "what-county-am-i-in": "What County Am I In? Census County & FIPS Lookup",
  "what-state-am-i-in": "What State Am I In? State Boundary & FIPS Lookup",
  "what-zip-code-am-i-in": "What ZIP Code Am I In? Postcode & Census ZCTA Lookup",
  "us-county-demographic-explorer": "US County Demographics Explorer: Population, Income & Maps",
  "world-time-zone-map": "World Time Zone Map: Live Local Time, UTC Offset & DST",
  "magnetic-declination": "Magnetic Declination Calculator: WMM 2025 Compass Correction",
  "moonrise-moonset": "Moonrise & Moonset Calculator by Location and Date",
};

function seoTitle(slug: string, name: string, keywords: string[]) {
  if (TITLE_OVERRIDES[slug]) return TITLE_OVERRIDES[slug];
  const primary = keywords[0]?.trim();
  let t = name;
  if (primary && primary.length <= 42) {
    const p = primary.replace(/^./, (c) => c.toUpperCase());
    if (!name.toLowerCase().includes(primary.toLowerCase())) t = `${name}: ${p}`;
  }
  // Keep the rendered "<title> · MapBench" descriptive: pad very short titles
  if (t.length < 30 && !t.toLowerCase().includes("free")) t = `${t} — Free Online Tool`;
  return t;
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
  const pc = await loadPageContent(slug);
  const title = pc?.title ?? seoTitle(tool.slug, tool.name, tool.keywords);
  const description = pc?.description ?? seoDescription(tool);
  return {
    title,
    description,
    keywords: [...tool.keywords, tool.name, "free", "map tool", "no sign-up"],
    alternates: { canonical: url },
    robots: { index: true, follow: true },
    openGraph: { type: "website", title, description, url, siteName: "MapBench" },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function ToolPage({ params }: Props) {
  const { tool: slug } = await params;
  const tool = toolBySlug.get(slug);
  if (!tool) notFound();
  const category = CATEGORIES.find((c) => c.id === tool.category);
  const absoluteUrl = `https://www.mapbench.site/tools/${tool.slug}`;
  const author = { "@type": "Person", "@id": "https://www.mapbench.site/author/aryan-khan#person", name: "Aryan Khan", url: "https://www.mapbench.site/author/aryan-khan", sameAs: ["https://www.linkedin.com/in/aryan-khan-b77438438/"] };
  const pc = await loadPageContent(slug);
  const baseFaqs = getEnhancedFaqs(tool);
  const faqs: [string, string][] = pc?.faq?.length
    ? [...baseFaqs, ...pc.faq.filter(([q]) => !baseFaqs.some(([bq]) => bq === q))]
    : baseFaqs;

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
      author,
      provider: { "@type": "Organization", name: "MapBench", url: "https://www.mapbench.site", logo: { "@type": "ImageObject", url: "https://www.mapbench.site/icon.svg" } },
    },
    {
      "@context": "https://schema.org",
      "@type": "HowTo",
      name: `How to use ${tool.name}`,
      description: tool.short,
      inLanguage: "en",
      step: tool.howTo.map((text, i) => ({ "@type": "HowToStep", position: i + 1, name: `Step ${i + 1}`, text })),
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: "https://www.mapbench.site/" },
        { "@type": "ListItem", position: 2, name: "Tools", item: "https://www.mapbench.site/tools" },
        ...(category ? [{ "@type": "ListItem", position: 3, name: category.label, item: `https://www.mapbench.site/tools/category/${category.id}` }] : []),
        { "@type": "ListItem", position: category ? 4 : 3, name: tool.name, item: absoluteUrl },
      ],
    },
    ...(faqs.length ? [{
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faqs.map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })),
    }] : []),
    {
      "@context": "https://schema.org",
      "@type": "WebPage",
      "@id": absoluteUrl,
      url: absoluteUrl,
      name: tool.name,
      description: tool.short,
      author,
      reviewedBy: author,
      isPartOf: { "@type": "WebSite", name: "MapBench", url: "https://www.mapbench.site" },
      about: { "@id": `${absoluteUrl}#tool` },
    },
  ];

  return <><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} /><ToolClient slug={tool.slug} pageContent={pc} faqsOverride={faqs} /></>;
}
