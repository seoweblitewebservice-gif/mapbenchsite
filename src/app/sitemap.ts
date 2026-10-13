import type { MetadataRoute } from "next";
import { TOOLS } from "@/lib/registry";
import { ALL_GUIDES } from "@/data/allGuides";

const BASE = "https://www.mapbench.site";

const STATIC_PATHS = [
  "",
  "/tools",
  "/maps",
  "/guides",
  "/about",
  "/contact",
  "/methodology",
  "/data-sources",
  "/editorial-policy",
  "/privacy",
  "/terms",
];

const INDEXABLE_MAPS = [
  "united-states-of-america",
  "india",
  "united-kingdom",
  "canada",
  "australia",
  "germany",
  "france",
  "brazil",
  "japan",
  "mexico",
  "spain",
  "italy",
  "china",
  "russia",
];

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const staticEntries: MetadataRoute.Sitemap = STATIC_PATHS.map((path) => ({
    url: `${BASE}${path || "/"}`,
    lastModified: now,
    changeFrequency: path === "" ? "weekly" : "monthly",
    priority: path === "" ? 1 : path === "/tools" || path === "/maps" || path === "/guides" ? 0.9 : 0.6,
  }));

  const toolEntries: MetadataRoute.Sitemap = TOOLS.map((tool) => ({
    url: `${BASE}/tools/${tool.slug}`,
    lastModified: now,
    changeFrequency: "monthly",
    priority: tool.popular ? 0.9 : 0.7,
  }));

  const guideEntries: MetadataRoute.Sitemap = ALL_GUIDES.map((guide) => ({
    url: `${BASE}/guides/${guide.slug}`,
    lastModified: new Date(guide.date),
    changeFrequency: "monthly",
    priority: 0.75,
  }));

  const mapEntries: MetadataRoute.Sitemap = INDEXABLE_MAPS.map((slug) => ({
    url: `${BASE}/maps/blank/${slug}`,
    lastModified: now,
    changeFrequency: "yearly",
    priority: 0.65,
  }));

  return [...staticEntries, ...toolEntries, ...guideEntries, ...mapEntries];
}
