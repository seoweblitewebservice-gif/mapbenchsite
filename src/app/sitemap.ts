import type { MetadataRoute } from "next";
import { feature } from "topojson-client";
import countriesTopo from "world-atlas/countries-110m.json";
import { CATEGORIES, TOOLS } from "@/lib/registry";
import { ALL_GUIDES } from "@/data/allGuides";
import { STUDIES } from "@/data/studies";
import { REFERENCE_COUNTRIES } from "@/data/referenceCountries";

const BASE = "https://www.mapbench.site";

const STATIC_PATHS = [
  "",
  "/tools",
  "/maps",
  "/guides",
  "/studies",
  "/reference",
  "/author/aryan-khan",
  "/about",
  "/contact",
  "/methodology",
  "/data-sources",
  "/editorial-policy",
  "/privacy",
  "/terms",
];

function slugify(value: string) {
  return value.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

const countries = feature(
  countriesTopo as any,
  (countriesTopo as any).objects.countries,
) as unknown as GeoJSON.FeatureCollection<GeoJSON.Geometry, { name?: string }>;

const ALL_COUNTRY_MAP_SLUGS = Array.from(
  new Set(
    countries.features
      .map((f) => f.properties?.name)
      .filter((name): name is string => Boolean(name))
      .map(slugify),
  ),
).sort();

export default function sitemap(): MetadataRoute.Sitemap {
  const staticEntries: MetadataRoute.Sitemap = STATIC_PATHS.map((path) => ({
    url: `${BASE}${path || "/"}`,
    changeFrequency: path === "" ? "weekly" : "monthly",
    priority: path === "" ? 1 : ["/tools", "/maps", "/guides", "/studies", "/reference"].includes(path) ? 0.9 : 0.6,
  }));

  const categoryEntries: MetadataRoute.Sitemap = CATEGORIES.map((category) => ({
    url: `${BASE}/tools/category/${category.id}`,
    changeFrequency: "monthly",
    priority: 0.82,
  }));

  const toolEntries: MetadataRoute.Sitemap = TOOLS.map((tool) => ({
    url: `${BASE}/tools/${tool.slug}`,
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

  const referenceEntries: MetadataRoute.Sitemap = REFERENCE_COUNTRIES.map((country) => ({
    url: `${BASE}/reference/${country.slug}`,
    changeFrequency: "monthly",
    priority: 0.72,
  }));

  const mapEntries: MetadataRoute.Sitemap = ALL_COUNTRY_MAP_SLUGS.map((slug) => ({
    url: `${BASE}/maps/blank/${slug}`,
    changeFrequency: "yearly",
    priority: 0.65,
  }));

  return [
    ...staticEntries,
    ...categoryEntries,
    ...toolEntries,
    ...guideEntries,
    ...studyEntries,
    ...referenceEntries,
    ...mapEntries,
  ];
}
