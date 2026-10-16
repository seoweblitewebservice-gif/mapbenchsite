import type { MetadataRoute } from "next";
import { feature } from "topojson-client";
import countriesTopo from "world-atlas/countries-110m.json";
import { CATEGORIES, TOOLS } from "@/lib/registry";
import { ALL_GUIDES } from "@/data/allGuides";
import { STUDIES } from "@/data/studies";
import { REFERENCE_COUNTRIES } from "@/data/referenceCountries";
import { US_BLANK_MAP_STATES } from "@/data/usBlankMapStates";

const BASE = "https://www.mapbench.site";
const STRUCTURE_UPDATE = new Date("2026-10-14T00:00:00Z");

const STATIC_PATHS = [
  "",
  "/tools",
  "/maps",
  "/states",
  "/guides",
  "/studies",
  "/studies/state-capital-radius",
  "/reference",
  "/author/aryan-khan",
  "/about",
  "/contact",
  "/methodology",
  "/data-sources",
  "/editorial-policy",
  "/corrections",
  "/privacy",
  "/terms",
];

const UPDATED_STATIC_PATHS = new Set([
  "",
  "/tools",
  "/maps",
  "/states",
  "/studies",
  "/studies/state-capital-radius",
  "/corrections",
]);

const PRIORITY_TOOL_SLUGS = [
  "map-radius",
  "what-county-am-i-in",
  "drive-time-map",
  "halfway-between-two-places",
  "coordinate-converter",
  "elevation-finder",
  "timezone-map-finder",
  "population-within-radius",
  "distance-between-two-places",
  "what-zip-code-am-i-in",
  "what-state-am-i-in",
  "csv-to-map",
  "latitude-longitude-finder",
  "cities-within-radius",
  "driving-distance-calculator",
  "kml-viewer",
  "geojson-viewer",
  "gpx-viewer",
] as const;

const priorityIndex = new Map<string, number>(PRIORITY_TOOL_SLUGS.map((slug, index) => [slug, index]));

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
    ...(UPDATED_STATIC_PATHS.has(path) ? { lastModified: STRUCTURE_UPDATE } : {}),
    changeFrequency: path === "" ? "weekly" : "monthly",
    priority: path === "" ? 1 : ["/tools", "/maps", "/states", "/guides", "/studies", "/reference"].includes(path) ? 0.9 : path === "/studies/state-capital-radius" ? 0.84 : 0.6,
  }));

  const categoryEntries: MetadataRoute.Sitemap = CATEGORIES.map((category) => ({
    url: `${BASE}/tools/category/${category.id}`,
    lastModified: STRUCTURE_UPDATE,
    changeFrequency: "monthly",
    priority: 0.82,
  }));

  const orderedTools = [...TOOLS].sort((a, b) => {
    const ai = priorityIndex.get(a.slug);
    const bi = priorityIndex.get(b.slug);
    if (ai !== undefined && bi !== undefined) return ai - bi;
    if (ai !== undefined) return -1;
    if (bi !== undefined) return 1;
    return Number(Boolean(b.popular)) - Number(Boolean(a.popular)) || a.name.localeCompare(b.name);
  });

  const toolEntries: MetadataRoute.Sitemap = orderedTools.map((tool) => ({
    url: `${BASE}/tools/${tool.slug}`,
    ...(priorityIndex.has(tool.slug) ? { lastModified: STRUCTURE_UPDATE } : {}),
    changeFrequency: "monthly",
    priority: priorityIndex.has(tool.slug) ? 0.95 : tool.popular ? 0.88 : 0.7,
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

  const stateCountyEntries: MetadataRoute.Sitemap = US_BLANK_MAP_STATES.map((state) => ({
    url: `${BASE}/states/${state.slug}/counties`,
    lastModified: STRUCTURE_UPDATE,
    changeFrequency: "monthly",
    priority: 0.84,
  }));

  const stateMapEntries: MetadataRoute.Sitemap = US_BLANK_MAP_STATES.map((state) => ({
    url: `${BASE}/maps/blank/us/${state.slug}`,
    lastModified: STRUCTURE_UPDATE,
    changeFrequency: "yearly",
    priority: 0.82,
  }));

  const countryMapEntries: MetadataRoute.Sitemap = ALL_COUNTRY_MAP_SLUGS.map((slug) => ({
    url: `${BASE}/maps/blank/${slug}`,
    lastModified: STRUCTURE_UPDATE,
    changeFrequency: "yearly",
    priority: 0.68,
  }));

  return [
    ...staticEntries,
    ...categoryEntries,
    ...toolEntries,
    ...stateCountyEntries,
    ...stateMapEntries,
    ...countryMapEntries,
    ...guideEntries,
    ...studyEntries,
    ...referenceEntries,
  ];
}
