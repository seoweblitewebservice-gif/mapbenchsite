import { TOOLS } from "@/lib/registry";
import { ALL_GUIDES } from "@/data/allGuides";
import { LOCALES } from "@/lib/i18n";
import { isToolLocalized } from "@/data/localizedTools";

export const dynamic = "force-static";
export const revalidate = 86400;

/**
 * Lean sitemap for Google — priority indexable pages only.
 * Flooding a new site with near-duplicate locale/blank-map URLs can create
 * unnecessary crawl noise, so only substantive localized/tool/map pages are listed.
 */
const BASE = "https://www.mapbench.site";
const LASTMOD = "2026-09-29";

function escapeXml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

interface UrlRow {
  loc: string;
  lastmod?: string;
  changefreq?: string;
  priority?: string;
}

function urlBlock(row: UrlRow): string {
  const lines = [`  <url>`, `    <loc>${escapeXml(row.loc)}</loc>`];
  if (row.lastmod) lines.push(`    <lastmod>${row.lastmod}</lastmod>`);
  if (row.changefreq) lines.push(`    <changefreq>${row.changefreq}</changefreq>`);
  if (row.priority) lines.push(`    <priority>${row.priority}</priority>`);
  lines.push(`  </url>`);
  return lines.join("\n");
}

function buildUrls(): UrlRow[] {
  const rows: UrlRow[] = [];
  const seen = new Set<string>();

  const add = (path: string, changefreq: string, priority: string, lastmod = LASTMOD) => {
    const loc = path === "/" || path === "" ? BASE : `${BASE}${path.startsWith("/") ? path : `/${path}`}`;
    const key = loc.replace(/\/$/, "");
    if (seen.has(key)) return;
    seen.add(key);
    rows.push({ loc, lastmod, changefreq, priority });
  };

  add("/", "weekly", "1.0");
  add("/tools", "weekly", "0.95");
  add("/maps", "weekly", "0.9");
  add("/guides", "weekly", "0.8");
  add("/about", "monthly", "0.5");
  add("/editorial-policy", "monthly", "0.5");
  add("/methodology", "monthly", "0.5");
  add("/data-sources", "monthly", "0.5");
  add("/contact", "monthly", "0.4");
  add("/privacy", "yearly", "0.3");
  add("/terms", "yearly", "0.3");

  for (const t of TOOLS) add(`/tools/${t.slug}`, "monthly", t.popular ? "0.9" : "0.75");

  for (const g of ALL_GUIDES) {
    const lm = g.date ? String(g.date).slice(0, 10) : LASTMOD;
    add(`/guides/${g.slug}`, "monthly", "0.65", lm);
  }

  for (const locale of LOCALES) {
    const hasAny = TOOLS.some((t) => isToolLocalized(locale, t.slug));
    if (!hasAny) continue;
    add(`/${locale}`, "weekly", "0.6");
    add(`/${locale}/tools`, "weekly", "0.55");
    for (const t of TOOLS) {
      if (isToolLocalized(locale, t.slug)) add(`/${locale}/tools/${t.slug}`, "monthly", t.popular ? "0.7" : "0.55");
    }
  }

  const priorityMaps = [
    "world", "united-states-of-america", "india", "united-kingdom", "canada",
    "australia", "germany", "france", "brazil", "japan", "mexico", "spain",
    "italy", "china", "russia",
  ];
  for (const slug of priorityMaps) add(`/maps/blank/${slug}`, "monthly", "0.55");

  return rows;
}

export async function GET() {
  const rows = buildUrls();
  const body = [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
    ...rows.map(urlBlock),
    `</urlset>`,
    "",
  ].join("\n");

  return new Response(body, {
    status: 200,
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=86400",
    },
  });
}
