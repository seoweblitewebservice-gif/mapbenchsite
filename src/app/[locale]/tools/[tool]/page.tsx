import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { toolBySlug, TOOLS, CATEGORIES } from "@/lib/registry";
import ToolClient from "@/components/ToolClient";
import { isLocale, LOCALES } from "@/lib/i18n";
import { getLocalizedTool, isToolLocalized } from "@/data/localizedTools";

interface Props {
  params: Promise<{ locale: string; tool: string }>;
}

const BASE = "https://www.mapbench.site";

export function generateStaticParams() {
  return LOCALES.flatMap((locale) =>
    TOOLS.filter((t) => isToolLocalized(locale, t.slug)).map((t) => ({
      locale,
      tool: t.slug,
    })),
  );
}

export const dynamicParams = true;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, tool: slug } = await params;
  if (!isLocale(locale)) return {};
  const tool = toolBySlug.get(slug);
  if (!tool) return {};

  const localized = getLocalizedTool(locale, slug);
  const languages: Record<string, string> = {
    en: `${BASE}/tools/${tool.slug}`,
    "x-default": `${BASE}/tools/${tool.slug}`,
  };
  for (const l of LOCALES) {
    if (isToolLocalized(l, slug)) {
      languages[l] = `${BASE}/${l}/tools/${tool.slug}`;
    }
  }

  return {
    title: localized?.name ?? tool.name,
    description: localized?.short ?? tool.short,
    keywords: tool.keywords,
    alternates: {
      canonical: `/${locale}/tools/${tool.slug}`,
      languages,
    },
    robots: { index: true, follow: true },
  };
}

export default async function LocalizedToolPage({ params }: Props) {
  const { locale, tool: slug } = await params;

  if (!isLocale(locale) || !toolBySlug.has(slug)) notFound();

  const tool = toolBySlug.get(slug)!;
  const localized = getLocalizedTool(locale, slug);
  const category = CATEGORIES.find((c) => c.id === tool.category);
  const absoluteUrl = `${BASE}/${locale}/tools/${tool.slug}`;

  if (localized) {
    const languages = [
      { code: "en", url: `${BASE}/tools/${tool.slug}` },
      ...LOCALES.filter((l) => isToolLocalized(l, slug)).map((l) => ({
        code: l,
        url: `${BASE}/${l}/tools/${tool.slug}`,
      })),
    ];

    const jsonLd = [
      {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        "@id": `${absoluteUrl}#tool`,
        name: localized.name,
        description: localized.short,
        url: absoluteUrl,
        applicationCategory: "UtilitiesApplication",
        operatingSystem: "Any (web browser)",
        isAccessibleForFree: true,
        offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
      },
      {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "MapBench", item: `${BASE}/${locale}` },
          {
            "@type": "ListItem",
            position: 2,
            name: category?.label ?? "Tools",
            item: `${BASE}/${locale}/tools`,
          },
          { "@type": "ListItem", position: 3, name: localized.name },
        ],
      },
      {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: localized.faq.map(([q, a]) => ({
          "@type": "Question",
          name: q,
          acceptedAnswer: { "@type": "Answer", text: a },
        })),
      },
    ];

    return (
      <>
        {languages.map((l) => (
          <link key={l.code} rel="alternate" hrefLang={l.code} href={l.url} />
        ))}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <ToolClient slug={slug} locale={locale} />
      </>
    );
  }

  return (
    <>
      <div className="mb-4 rounded-lg border border-line bg-card px-4 py-3 text-sm text-mute">
        <strong className="text-ink">Language note:</strong> Full {locale.toUpperCase()}{" "}
        translation for this tool is not ready yet. Showing the English tool interface.{" "}
        More localized content will be added over time.
      </div>
      <ToolClient slug={slug} />
    </>
  );
}
