// Central tool registry
import { EXTRA_TOOLS } from "@/data/toolsExtra";
import { CORE_TOOLS } from "@/data/coreTools";
import { TIER_A_TOOLS } from "@/data/toolsTierA";
import { BATCH_TOOLS } from "@/data/toolsBatch";
import { BULK1_TOOLS } from "@/data/toolsBulk1";
import { BULK2_TOOLS } from "@/data/toolsBulk2";
import { GROWTH_TOOLS } from "@/data/growthTools";
import { LONGTAIL_TOOLS_1 } from "@/data/toolsLongtail1";
import { LONGTAIL_TOOLS_2 } from "@/data/toolsLongtail2";
import { LONGTAIL_TOOLS_3 } from "@/data/toolsLongtail3";
import { LONGTAIL_TOOLS_4 } from "@/data/toolsLongtail4";
import { LONGTAIL_TOOLS_5 } from "@/data/toolsLongtail5";
import { LONGTAIL_TOOLS_6 } from "@/data/toolsLongtail6";
import { LONGTAIL_TOOLS_7 } from "@/data/toolsLongtail7";

export type CategoryId =
  | "location" | "distance" | "radius" | "routing" | "coordinates"
  | "files" | "creation" | "earth" | "sun" | "lines" | "population" | "network";

export interface CategoryDef {
  id: CategoryId; label: string; short: string; tone: string;
}

export const CATEGORIES: CategoryDef[] = [
  { id: "location", label: "Location", short: "County, city, state, ZIP, country and addresses.", tone: "#1d6e63" },
  { id: "distance", label: "Distance & Bearing", short: "Distances, bearings and midpoints.", tone: "#b45309" },
  { id: "routing", label: "Routing & Travel Time", short: "Routes, travel times and drive-time areas.", tone: "#9d174d" },
  { id: "radius", label: "Radius & Area", short: "Radii, rings and polygon areas.", tone: "#4d7c0f" },
  { id: "coordinates", label: "Coordinates", short: "Find and convert GPS coordinates.", tone: "#0e7490" },
  { id: "files", label: "Map Files", short: "KML, GeoJSON, GPX and CSV.", tone: "#6d28d9" },
  { id: "creation", label: "Map Creation", short: "Pins and custom maps.", tone: "#c2410c" },
  { id: "earth", label: "Earth Science", short: "Elevation, horizon, antipodes.", tone: "#155e75" },
  { id: "sun", label: "Sun & Moon", short: "Sunrise, sunset and day length.", tone: "#a16207" },
  { id: "lines", label: "Geographic Lines", short: "Equator, tropics and meridians.", tone: "#334155" },
  { id: "population", label: "Places & Population", short: "Cities and ZIP codes in a radius.", tone: "#7c2d12" },
  { id: "network", label: "IP & Network", short: "IP geolocation and network details.", tone: "#475569" },
];

export interface ToolDef {
  slug: string; name: string; short: string; intro: string;
  category: CategoryId;
  scope: "Worldwide" | "US focused" | "Major cities" | "Major airports";
  component: string; props?: Record<string, unknown>;
  keywords: string[]; popular?: boolean;
  faq: [string, string][]; howTo: string[]; related: string[]; method?: string;
}

// Registry order is deliberate: later, more focused definitions replace older
// legacy entries that share the same canonical slug. Only one tool per slug is
// exposed to routes, sitemap, internal linking and structured data.
const RAW_TOOLS: ToolDef[] = [
  ...(CORE_TOOLS as unknown as ToolDef[]),
  ...EXTRA_TOOLS,
  ...TIER_A_TOOLS,
  ...BATCH_TOOLS,
  ...BULK1_TOOLS,
  ...BULK2_TOOLS,
  ...GROWTH_TOOLS,
  ...LONGTAIL_TOOLS_1,
  ...LONGTAIL_TOOLS_2,
  ...LONGTAIL_TOOLS_3,
  ...LONGTAIL_TOOLS_4,
  ...LONGTAIL_TOOLS_5,
  ...LONGTAIL_TOOLS_6,
  ...LONGTAIL_TOOLS_7,
];

const canonicalTools = new Map<string, ToolDef>();
for (const tool of RAW_TOOLS) canonicalTools.set(tool.slug, tool);

export const TOOLS: ToolDef[] = [...canonicalTools.values()];
export const toolBySlug = new Map(TOOLS.map((t) => [t.slug, t]));
export const popularTools = TOOLS.filter((t) => t.popular);
export const toolsByCategory = (id: CategoryId) => TOOLS.filter((t) => t.category === id);
export const STATIC_LINKS = [
  { href: "/", name: "Home", keywords: ["home"] },
  { href: "/tools", name: "All Tools", keywords: ["directory"] },
  { href: "/about", name: "About", keywords: ["about"] },
  { href: "/methodology", name: "Methodology", keywords: ["methodology"] },
  { href: "/data-sources", name: "Data Sources", keywords: ["data"] },
  { href: "/privacy", name: "Privacy", keywords: ["privacy"] },
  { href: "/contact", name: "Contact", keywords: ["contact"] },
];
