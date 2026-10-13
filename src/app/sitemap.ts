import type { MetadataRoute } from "next";
import { CATEGORIES, TOOLS } from "@/lib/registry";
import { ALL_GUIDES } from "@/data/allGuides";
import { STUDIES } from "@/data/studies";

const BASE = "https://www.mapbench.site";

const STATIC_PATHS = [
  "",
  "/tools",
  "/maps",
  "/guides",
  "/studies",
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
    priority: path === "" ? 1 : ["/tools", "/maps", "/guides", "/studies"].includes(path) ? 0.9 : 0.6,
  }));

  const categoryEntries: MetadataRoute.Sitemap = CATEGORIES.map((category) => ({
    url: `${BASE}/tools/category/${category.id}`,
    lastModified: now,
    changeFrequency: "monthly",
    priority: 0.82,
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

  const studyEntries: MetadataRoute.Sitemap = STUDIES.map((study) => ({
    url: `${BASE}/studies/${study.slug}`,
    lastModified: new Date(study.date),
    changeFrequency: "monthly",
    priority: 0.8,
  }));

  const mapEntries: MetadataRoute.Sitemap = INDEXABLE_MAPS.map((slug) => ({
    url: `${BASE}/maps/blank/${slug}`,
    lastModified: now,
    changeFrequency: "yearly",
    priority: 0.65,
  }));

  return [...staticEntries, ...categoryEntries, ...toolEntries, ...guideEntries, ...studyEntries, ...mapEntries];
}
