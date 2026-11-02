/**
 * Navigation helpers for the hub-and-spoke internal linking system.
 *
 * All link targets are resolved from the registry and the guide dataset, so a
 * renamed or retired tool cannot leave a dead link in a hub, a breadcrumb or a
 * cross-hub block. `npm run audit:links` asserts every generated href resolves.
 */
import { TOOLS, toolBySlug, type ToolDef } from "@/lib/registry";
import { allGuideBySlug } from "@/data/allGuides";
import { BEST_OF } from "@/data/bestOf";
import {
  HUBS, SUBHUBS, hubById, hubForTool, subHubsByParent, subHubBySlug,
  type HubDef, type HubId, type SubHub,
} from "@/data/hubs";

export { hubById, subHubBySlug, hubForTool };

export const HUB_BASE_TITLE = "MapBench";

/** Every tool that belongs to a hub, in a stable, editorially sensible order. */
export function toolsInHub(id: HubId): ToolDef[] {
  const hub = hubById.get(id);
  const members = TOOLS.filter((tool) => hubForTool(tool) === id);
  if (!hub) return members;
  const rank = new Map(hub.topTools.map((slug, index) => [slug, index]));
  return [...members].sort((a, b) => {
    const ai = rank.get(a.slug);
    const bi = rank.get(b.slug);
    if (ai !== undefined && bi !== undefined) return ai - bi;
    if (ai !== undefined) return -1;
    if (bi !== undefined) return 1;
    return Number(Boolean(b.popular)) - Number(Boolean(a.popular)) || a.name.localeCompare(b.name);
  });
}

export function toolCountInHub(id: HubId) {
  return TOOLS.filter((tool) => hubForTool(tool) === id).length;
}

export const hubFor = (slug: string) => {
  const tool = toolBySlug.get(slug);
  return tool ? hubById.get(hubForTool(tool)) : undefined;
};

/** The hub a tool page should link up to, with a keyword-rich anchor. */
export function parentHubLink(tool: ToolDef): { href: string; label: string; anchor: string } | undefined {
  const hub = hubById.get(hubForTool(tool));
  if (!hub) return undefined;
  return { href: hub.slug, label: hub.label, anchor: hub.label.toLowerCase() };
}

/**
 * The curated related tools a page already renders in its "Related tools"
 * grid. These come from the tool's content file when it has one, otherwise
 * from the registry definition.
 */
export function curatedRelated(slug: string, contentRelated?: string[] | null): ToolDef[] {
  const tool = toolBySlug.get(slug);
  if (!tool) return [];
  const slugs = contentRelated?.length ? contentRelated : tool.related ?? [];
  return [...new Set(slugs)]
    .filter((candidate) => candidate !== slug)
    .map((candidate) => toolBySlug.get(candidate))
    .filter((item): item is ToolDef => Boolean(item))
    .slice(0, 6);
}

/**
 * Siblings for a tool page: three to six tools from the same hub.
 *
 * The curated list comes first because it is the editorially correct answer.
 * When a page has fewer than three curated siblings, its neighbours in the hub
 * ordering top the list up — which also gives tail tools genuine inbound links
 * instead of leaving them reachable only from the hub.
 */
export function siblingTools(slug: string, limit = 6, contentRelated?: string[] | null): ToolDef[] {
  const tool = toolBySlug.get(slug);
  if (!tool) return [];
  const hubId = hubForTool(tool);
  const full = toolsInHub(hubId);
  const ordered = full.filter((item) => item.slug !== slug);
  const bySlug = new Map(ordered.map((item) => [item.slug, item]));

  const picked: ToolDef[] = [];
  const seen = new Set<string>([slug]);
  const push = (item?: ToolDef) => {
    if (!item || seen.has(item.slug) || picked.length >= limit) return;
    seen.add(item.slug);
    picked.push(item);
  };

  // Same-hub curated links count toward the sibling floor; cross-hub curated
  // links are legitimate and useful but are not siblings.
  const curated = curatedRelated(slug, contentRelated);
  const sameHubCurated = curated.filter((item) => hubForTool(item) === hubId);
  const target = Math.min(limit, Math.max(3, sameHubCurated.length));
  for (const item of sameHubCurated) push(item);

  // Top up from the hub ordering. The starting point is derived from the slug
  // and the picks are spread around the ring, so the cluster as a whole is
  // linked evenly instead of every page pointing at the same handful of tools.
  if (picked.length < target && ordered.length) {
    const seed = [...slug].reduce((hash, char) => (hash * 31 + char.charCodeAt(0)) >>> 0, 7);
    const start = seed % ordered.length;
    const needed = target - picked.length;
    const stride = Math.max(1, Math.floor(ordered.length / Math.max(needed, 1)));
    for (let index = 0; index < ordered.length && picked.length < target; index += 1) {
      if (index % stride !== 0) continue;
      push(ordered[(start + index) % ordered.length]);
    }
    // Fill any remainder (for example when the ring is small) with the nearest
    // neighbours, then the hub's own top tools.
    for (let offset = 1; offset <= ordered.length && picked.length < target; offset += 1) {
      push(ordered[(start + offset) % ordered.length]);
    }
  }

  const hub = hubById.get(hubId);
  for (const topSlug of hub?.topTools ?? []) {
    if (picked.length >= target) break;
    push(bySlug.get(topSlug));
  }
  return picked.slice(0, limit);
}

/**
 * Neighbours of a tool in its hub's ordering, alternating forward and backward.
 *
 * Because every tool uses the same offsets, the pairing is symmetric: whatever a
 * page links forward, it receives backward. That is what gives each tool in a big
 * cluster at least two guaranteed inbound links from its own hub, before curated
 * links and the hub page itself are counted.
 */
export function ringNeighbours(slug: string, count = 4): ToolDef[] {
  const tool = toolBySlug.get(slug);
  if (!tool) return [];
  const full = toolsInHub(hubForTool(tool));
  if (full.length < 2) return [];
  const position = full.findIndex((item) => item.slug === slug);
  if (position < 0) return [];
  const offsets: number[] = [];
  for (let step = 1; offsets.length < count; step += 1) {
    offsets.push(step, -step);
  }
  const seen = new Set<string>([slug]);
  const picked: ToolDef[] = [];
  for (const offset of offsets) {
    if (picked.length >= count) break;
    const item = full[(position + offset + full.length) % full.length];
    if (!item || seen.has(item.slug)) continue;
    seen.add(item.slug);
    picked.push(item);
  }
  return picked;
}

/** Cross-hub "you may also need" targets declared by the hub matrix. */
export function crossHubLinks(id: HubId): HubDef[] {
  const hub = hubById.get(id);
  if (!hub) return [];
  return hub.crossHubs.map((other) => hubById.get(other)).filter((item): item is HubDef => Boolean(item));
}

/**
 * Guides that reference a tool inside a `toolbox` block, plus explicit
 * how-to pairings from the linking plan. Used for tool → guide links.
 */
const GUIDE_PAIRS: Record<string, string> = {
  "map-radius": "draw-radius-on-google-maps",
  "distance-between-two-places": "straight-line-distance-vs-road-distance",
  "map-area-calculator": "how-to-measure-land-area-on-a-map",
  "acreage-map-calculator": "how-to-measure-land-area-on-a-map",
  "latitude-longitude-finder": "how-to-find-latitude-longitude-of-any-place",
  "reverse-geocoder": "what-are-plus-codes-open-location-code",
  "elevation-finder": "find-elevation-on-google-maps",
  "driving-distance-calculator": "straight-line-distance-vs-road-distance",
  "halfway-between-two-places": "how-to-choose-a-meeting-point-between-places",
  "optimal-meeting-point": "how-to-choose-a-meeting-point-between-places",
  "find-my-location": "find-my-location-gps-vs-ip-vs-vpn",
  "what-county-am-i-in": "what-county-am-i-in-how-it-works",
  "gpx-viewer": "how-to-open-gpx-files",
  "kml-viewer": "kml-vs-geojson-vs-gpx",
  "gpx-to-csv-converter": "how-to-convert-gpx-to-csv",
  "geojson-to-csv-converter": "kml-vs-geojson-vs-gpx",
  "pin-map-maker": "free-printable-blank-maps-for-school-and-work",
  "blank-map": "free-printable-blank-maps-for-school-and-work",
  "crow-flies-distance": "crow-flies-when-it-lies",
  "horizon-distance": "quiet-math-of-horizons",
  "sunrise-sunset-calculator": "chasing-golden-hour",
  "golden-hour-calculator": "chasing-golden-hour",
  "moonrise-moonset": "full-moon-moonrise-times",
  "drive-time-map": "reading-isochrones-like-a-planner",
  "isochrone-map": "reading-isochrones-like-a-planner",
  "coordinate-converter": "understanding-gps-coordinates",
  "plus-code-finder": "what-are-plus-codes-open-location-code",
  "utc-offset-by-coordinates": "find-my-location-gps-vs-ip-vs-vpn",
  "multi-stop-route-planner": "road-trip-with-free-map-tools",
  "city-comparison-tool": "compare-cities-like-an-analyst",
  "plant-hardiness-zone": "will-it-grow-here",
};

export interface GuideLink { href: string; title: string; note?: string }

/** The best single guide for a tool page, or null. */
export function guideForTool(slug: string): GuideLink | null {
  const tool = toolBySlug.get(slug);
  const fromGuideData = tool
    ? [...allGuideBySlug.values()].filter((guide) =>
        guide.blocks.some((block) => block.t === "toolbox" && block.slugs.includes(slug)))
    : [];
  const ordered = [GUIDE_PAIRS[slug], ...fromGuideData.map((guide) => guide.slug)]
    .filter((candidate): candidate is string => Boolean(candidate))
    .map((candidate) => allGuideBySlug.get(candidate))
    .filter((guide): guide is NonNullable<typeof guide> => Boolean(guide));
  // Fall back to a guide from the tool's own hub, so every spoke has a
  // tool-to-guide link even when no guide names it directly.
  const hub = tool ? hubById.get(hubForTool(tool)) : undefined;
  const hubGuide = hub?.guides
    .map((path) => allGuideBySlug.get(path.replace(/^\/guides\//, "")))
    .find((candidate) => Boolean(candidate));
  const guide = ordered[0] ?? hubGuide;
  return guide ? { href: `/guides/${guide.slug}`, title: guide.title, note: guide.description } : null;
}

/** Guides declared by a hub, resolved and de-duplicated. */
export function guidesForHub(hub: HubDef): GuideLink[] {
  const seen = new Set<string>();
  return hub.guides
    .map((slug) => allGuideBySlug.get(slug.replace(/^\/guides\//, "")))
    .filter((guide): guide is NonNullable<typeof guide> => Boolean(guide))
    .filter((guide) => (seen.has(guide.slug) ? false : (seen.add(guide.slug), true)))
    .map((guide) => ({ href: `/guides/${guide.slug}`, title: guide.title, note: guide.description }));
}

/** Best-of pages that include this hub. */
export function bestOfForHub(id: HubId) {
  return BEST_OF.filter((page) => page.hubs.includes(id));
}

/** Hubs flagged in a best-of page, resolved. */
export function hubsForBestOf(page: { hubs: HubId[] }) {
  return page.hubs.map((id) => hubById.get(id)).filter((hub): hub is HubDef => Boolean(hub));
}

/** Sub-hubs of a hub (GIS file families, blank maps). */
export const subHubsOf = (id: HubId) => subHubsByParent(id);

/** Tools listed on a GIS sub-hub page. */
export function toolsInSubHub(sub: SubHub): ToolDef[] {
  return TOOLS.filter((tool) => sub.match(tool.slug) && hubForTool(tool) === sub.parent);
}

/** The sub-hub a tool belongs to, if any. */
export function subHubForTool(slug: string): SubHub | undefined {
  return SUBHUBS.find((sub) => sub.match(slug));
}

/** Breadcrumb trail for a hub or sub-hub page. */
export function hubBreadcrumbs(hub: HubDef, sub?: SubHub) {
  const trail = [
    { name: "Home", href: "/" },
    { name: "All tools", href: "/tools" },
    { name: hub.label, href: hub.slug },
  ];
  if (sub) trail.push({ name: sub.label, href: sub.slug });
  return trail;
}

/** All hub navigation entries, used by the header, footer and /tools index. */
export const HUB_NAV = HUBS.map((hub) => ({
  id: hub.id,
  href: hub.slug,
  label: hub.label,
  short: hub.short,
  tone: hub.tone ?? "#1d6e63",
  count: toolCountInHub(hub.id),
}));
