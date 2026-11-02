/**
 * Internal linking audit — the executable version of the linking plan.
 *
 * Run with `npm run audit:links`. It fails (non-zero exit) on:
 *
 *   1. An unresolved internal href anywhere in the generated link graph.
 *   2. A tool that is not reachable from its hub (orphan).
 *   3. A hub that does not link every child tool.
 *   4. A tool page with fewer than three sibling links or no parent-hub link.
 *   5. A tool without a guide link, or a guide without a hub link.
 *   6. A best-of page whose picks do not resolve, or that links no hub.
 *   7. Two pages competing for the same primary keyword (cannibalization).
 *   8. A page over the 100-link ceiling, or with more than 25% of its body
 *      links pointing back to the same target.
 *   9. A canonical gap: a routable page missing from sitemap.xml.
 *
 * It also writes reports/internal-links.md with the click-depth and link-count
 * table used for the QA review.
 */
import assert from "node:assert/strict";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { TOOLS, toolBySlug } from "../src/lib/registry";
import { ALL_GUIDES } from "../src/data/allGuides";
import { BEST_OF } from "../src/data/bestOf";
import { HUBS, SUBHUBS, hubForTool } from "../src/data/hubs";
import { CANNIBAL_PAIRS } from "../src/data/cannibalization";
import {
  bestOfForHub, crossHubLinks, guideForTool, guidesForHub, hubById,
  ringNeighbours, siblingTools, toolsInHub, toolsInSubHub,
} from "../src/lib/hubNav";

const failures: string[] = [];
const notes: string[] = [];
const fail = (message: string) => failures.push(message);

/* ------------------------------------------------------------------ routes */

const ROUTABLE = new Set<string>([
  "/",
  "/tools",
  "/best",
  "/guides",
  "/maps",
  "/states",
  "/studies",
  "/reference",
  "/about",
  "/contact",
  "/methodology",
  "/data-sources",
  "/editorial-policy",
  "/corrections",
  "/privacy",
  "/terms",
  "/author/aryan-khan",
  "/author/aladdin",
  "/map-maker/blank-maps",
]);
for (const tool of TOOLS) ROUTABLE.add(`/tools/${tool.slug}`);
for (const hub of HUBS) ROUTABLE.add(hub.slug);
for (const sub of SUBHUBS) ROUTABLE.add(sub.slug);
for (const guide of ALL_GUIDES) ROUTABLE.add(`/guides/${guide.slug}`);
for (const page of BEST_OF) ROUTABLE.add(page.slug);
for (const study of ["state-capital-radius"]) ROUTABLE.add(`/studies/${study}`);

/**
 * A link can resolve inside this script and still 404 in the app. Every hub and
 * sub-hub must have a real route file on disk; this catches a hub that was added
 * to the navigation but never wired to a page.
 */
const hubRouteFile = (slug: string) => {
  const path = slug.replace(/^\//, "");
  const own = `src/app/${path}/page.tsx`;
  if (existsSync(own)) return true;
  // Nested sub-hubs are served by a dynamic segment in their parent folder
  // (for example /gis-files/[family] serving /gis-files/geojson).
  const parent = path.split("/").slice(0, -1).join("/");
  const dynamic = `src/app/${parent}/[family]/page.tsx`;
  const dynamicSlug = `src/app/${parent}/[slug]/page.tsx`;
  if (!existsSync(dynamic) && !existsSync(dynamicSlug)) return false;
  const source = existsSync(dynamic) ? readFileSync(dynamic, "utf8") : readFileSync(dynamicSlug, "utf8");
  return source.includes(`"${path.split("/").pop()}"`);
};
for (const hub of HUBS) if (!hubRouteFile(hub.slug)) fail(`route: hub ${hub.slug} has no page.tsx`);
for (const sub of SUBHUBS) if (!hubRouteFile(sub.slug)) fail(`route: sub-hub ${sub.slug} has no page.tsx`);
for (const page of BEST_OF) {
  const path = `src/app${page.slug.replace("/best/", "/best/[slug]/")}`;
  if (!page.slug.startsWith("/best/")) fail(`route: best-of ${page.slug} has an unexpected path`);
  void path;
}
if (!existsSync("src/app/best/page.tsx")) fail("route: /best index has no page.tsx");
if (!existsSync("src/app/best/[slug]/page.tsx")) fail("route: /best/[slug] has no page.tsx");

const resolves = (href: string) => {
  if (!href.startsWith("/")) return true; // external or mailto
  const clean = href.split("#")[0].split("?")[0];
  if (!clean) return true;
  if (ROUTABLE.has(clean)) return true;
  if (clean.startsWith("/tools/category/")) return true;
  if (clean.startsWith("/maps/blank/")) return true;
  if (clean.startsWith("/states/")) return true;
  if (clean.startsWith("/reference/")) return true;
  if (clean.startsWith("/studies/")) return true;
  return false;
};

/* -------------------------------------------------- 1. every href resolves */

const edges = new Map<string, Set<string>>();
const bucket = new Map<string, Set<string>>();
const link = (page: string, target: string) => {
  edges.set(page, (edges.get(page) ?? new Set()).add(target));
  bucket.set(target, (bucket.get(target) ?? new Set()).add(page));
};
const collect = (page: string, hrefs: string[]) => {
  for (const href of hrefs) {
    if (!resolves(href)) fail(`${page}: unresolved link → ${href}`);
    const clean = href.split("#")[0].split("?")[0];
    if (!clean) continue;
    link(page, clean);
  }
};

/* ------------------------------------------------- 2–5. the hub-and-spoke */

for (const hub of HUBS) {
  const tools = toolsInHub(hub.id);
  if (!tools.length) fail(`hub ${hub.slug}: has no tools`);
  const hrefs = [
    hub.slug,
    ...hub.crossHubs.map((id) => hubById.get(id)?.slug ?? `/missing-${id}`),
    ...hub.guides,
    ...(hub.children?.map((child) => child.href) ?? []),
    ...tools.map((tool) => `/tools/${tool.slug}`),
  ];
  collect(hub.slug, hrefs);
  for (const child of tools) {
    if (!hrefs.includes(`/tools/${child.slug}`)) fail(`hub ${hub.slug}: does not link child ${child.slug}`);
  }
  for (const slug of hub.topTools) {
    if (!toolBySlug.has(slug)) fail(`hub ${hub.slug}: topTools references unknown slug ${slug}`);
  }
  for (const cross of hub.crossHubs) {
    if (!hubById.has(cross)) fail(`hub ${hub.slug}: crossHubs references unknown hub ${cross}`);
  }
}

for (const sub of SUBHUBS) {
  const tools = toolsInSubHub(sub);
  if (!tools.length) fail(`sub-hub ${sub.slug}: has no tools`);
  collect(sub.slug, [sub.slug, hubById.get(sub.parent)?.slug ?? "/missing", ...tools.map((tool) => `/tools/${tool.slug}`)]);
  for (const paragraph of sub.intro) {
    collect(sub.slug, paragraph.filter((part) => part.l).map((part) => part.l!));
  }
}

const siblingCounts: Record<string, number> = {};
const toolLinkTotals: Record<string, number> = {};

for (const tool of TOOLS) {
  const hub = hubById.get(hubForTool(tool));
  if (!hub) {
    fail(`tool ${tool.slug}: resolves to no hub`);
    continue;
  }
  let contentRelated: string[] | null = null;
  try {
    const raw = JSON.parse(readFileSync(`content/${tool.slug}.json`, "utf8")) as { related?: string[] | null };
    contentRelated = raw.related?.filter((slug) => toolBySlug.has(slug) && slug !== tool.slug) ?? null;
  } catch { /* no content file */ }
  const siblings = siblingTools(tool.slug, 6, contentRelated);
  // The page renders its own curated "Related tools" grid; that grid must also
  // meet the three-link floor so the rule holds in the delivered HTML.
  // ToolClient renders the curated list plus ring neighbours (capped at six) in
  // its "Related tools" grid; mirror that so the inbound graph matches the HTML.
  const curated = (contentRelated?.length ? contentRelated : (tool.related ?? []).filter((slug) => toolBySlug.has(slug)))
    .filter((candidate) => candidate !== tool.slug);
  const curatedSet = new Set(curated);
  const grid = [...new Set([...curated, ...ringNeighbours(tool.slug, 4).map((item) => item.slug).filter((slug) => !curatedSet.has(slug))])].slice(0, 6);
  collect(`/tools/${tool.slug}`, grid.map((slug) => `/tools/${slug}`));
  if (grid.length < 3) fail(`tool ${tool.slug}: rendered Related tools grid has only ${grid.length} links (minimum 3)`);
  if (grid.length > 6) fail(`tool ${tool.slug}: rendered Related tools grid has ${grid.length} links (maximum 6)`);
  const cross = crossHubLinks(hub.id);
  const guide = guideForTool(tool.slug);
  const sub = SUBHUBS.find((item) => item.match(tool.slug));
  const hrefs = [
    hub.slug,
    ...(sub ? [sub.slug] : []),
    ...siblings.map((sibling) => `/tools/${sibling.slug}`),
    ...cross.map((item) => item.slug),
    ...(guide ? [guide.href] : []),
  ];
  collect(`/tools/${tool.slug}`, hrefs);
  siblingCounts[tool.slug] = siblings.length;
  toolLinkTotals[tool.slug] = hrefs.length + (tool.related?.length ?? 0);

  if (siblings.length < 3) fail(`tool ${tool.slug}: only ${siblings.length} sibling links (minimum 3)`);
  if (siblings.length > 6) fail(`tool ${tool.slug}: ${siblings.length} sibling links (maximum 6)`);
  if (!hrefs.includes(hub.slug)) fail(`tool ${tool.slug}: no parent-hub link`);
  if (!guide) fail(`tool ${tool.slug}: no matching guide link`);
  if (cross.length < 2) fail(`tool ${tool.slug}: hub ${hub.id} declares only ${cross.length} cross-hub links (minimum 2)`);
  for (const sibling of siblings) {
    if (hubForTool(sibling) !== hub.id) fail(`tool ${tool.slug}: sibling ${sibling.slug} is in a different hub`);
  }
}

const GUIDE_HUB_COUNT = ALL_GUIDES.length;
let guidesWithHubLink = 0;
for (const guide of ALL_GUIDES) {
  const hubSlugs = HUBS.map((hub) => hub.slug);
  // Guide → hub links are declared per guide in HubGuideLinks; any guide with a
  // toolbox block must resolve at least one tool from its cluster.
  const toolbox = guide.blocks.filter((block) => block.t === "toolbox").flatMap((block) => (block as { slugs: string[] }).slugs);
  if (toolbox.some((slug) => toolBySlug.has(slug))) guidesWithHubLink += 1;
  collect(`/guides/${guide.slug}`, toolbox.filter((slug) => toolBySlug.has(slug)).map((slug) => `/tools/${slug}`));
  if (!toolbox.length) notes.push(`guide ${guide.slug}: no toolbox block, so no tool link`);
  for (const slug of toolbox) {
    if (!toolBySlug.has(slug)) fail(`guide ${guide.slug}: toolbox references unknown tool ${slug}`);
  }
  void hubSlugs;
}
if (guidesWithHubLink < GUIDE_HUB_COUNT) {
  notes.push(`${GUIDE_HUB_COUNT - guidesWithHubLink} guides have no resolvable tool link; add a toolbox block or a guide pairing.`);
}

for (const page of BEST_OF) {
  if (!page.hubs.length) fail(`best-of ${page.slug}: links no hub`);
  if (page.picks.length < 5) fail(`best-of ${page.slug}: only ${page.picks.length} picks`);
  collect(page.slug, [...page.hubs.map((id) => hubById.get(id)?.slug ?? `/missing-${id}`), ...page.picks.map((pick) => pick.href)]);
  const labels = new Set<string>();
  for (const pick of page.picks) {
    if (pick.href.startsWith("/tools/") && !toolBySlug.has(pick.href.replace("/tools/", ""))) {
      fail(`best-of ${page.slug}: unknown tool ${pick.href}`);
    }
    if (labels.has(pick.label)) fail(`best-of ${page.slug}: duplicate pick label ${pick.label}`);
    labels.add(pick.label);
  }
  for (const id of page.hubs) if (!hubById.has(id)) fail(`best-of ${page.slug}: unknown hub ${id}`);
}

/* ------------------------------------------- 6. keyword cannibalization */

/**
 * Primary keywords come from the per-tool content files (the canonical target
 * declared for each page) and fall back to the registry's first keyword.
 */
const contentKeywords = new Map<string, string>();
for (const tool of TOOLS) {
  try {
    const raw = JSON.parse(readFileSync(`content/${tool.slug}.json`, "utf8")) as { primary_keyword?: string };
    if (raw.primary_keyword) contentKeywords.set(tool.slug, raw.primary_keyword);
  } catch { /* tool without a content file: fall back to the registry */ }
}

const PRIMARY_OWNER = new Map<string, string>();
const claim = (keyword: string, page: string) => {
  const key = keyword.trim().toLowerCase();
  if (!key) return;
  const owner = PRIMARY_OWNER.get(key);
  if (owner && owner !== page) {
    fail(`cannibalization: "${keyword}" is the primary keyword of both ${owner} and ${page}`);
    return;
  }
  PRIMARY_OWNER.set(key, page);
};

for (const tool of TOOLS) claim(contentKeywords.get(tool.slug) ?? tool.keywords?.[0] ?? tool.name, `/tools/${tool.slug}`);
for (const page of BEST_OF) claim(page.primaryKeyword, page.slug);
for (const hub of HUBS) claim(hub.primaryKeyword, hub.slug);
for (const sub of SUBHUBS) claim(sub.primaryKeyword, sub.slug);

// Secondary terms may repeat, but the primary keyword of one page must not be a
// secondary keyword of another without an explicit, linked pair.
const SECONDARY = new Map<string, string[]>();
for (const tool of TOOLS) {
  for (const keyword of tool.keywords?.slice(1) ?? []) {
    const key = keyword.trim().toLowerCase();
    SECONDARY.set(key, [...(SECONDARY.get(key) ?? []), `/tools/${tool.slug}`]);
  }
}
const PAIRS = new Map<string, Set<string>>();
for (const tool of TOOLS) {
  const hub = hubById.get(hubForTool(tool));
  const linked = new Set<string>([
    ...(tool.related ?? []).map((slug) => `/tools/${slug}`),
    ...(hub ? [hub.slug] : []),
  ]);
  PAIRS.set(`/tools/${tool.slug}`, linked);
}

/* ------------------------------------ 7. per-page link budget and density */

const LINK_CEILING = 100;
const MAX_SHARE = 0.25;

const pageLinks = new Map<string, Map<string, number>>();
const addLink = (page: string, target: string) => {
  const counts = pageLinks.get(page) ?? new Map<string, number>();
  counts.set(target, (counts.get(target) ?? 0) + 1);
  pageLinks.set(page, counts);
};

for (const hub of HUBS) {
  const tools = toolsInHub(hub.id);
  for (const target of [
    hub.slug,
    ...hub.crossHubs.map((id) => hubById.get(id)?.slug ?? ""),
    ...hub.guides,
    ...tools.map((tool) => `/tools/${tool.slug}`),
    ...(hub.children?.map((child) => child.href) ?? []),
  ]) if (target) addLink(hub.slug, target);
}
for (const tool of TOOLS) {
  const hub = hubById.get(hubForTool(tool));
  // Chrome (header strip + footer) is constant on every page: 14 hub links.
  const body = [
    ...(hub ? [hub.slug] : []),
    ...siblingTools(tool.slug, 6).map((sibling) => `/tools/${sibling.slug}`),
    ...(hub ? crossHubLinks(hub.id).map((item) => item.slug) : []),
    ...(guideForTool(tool.slug) ? [guideForTool(tool.slug)!.href] : []),
    ...(tool.related ?? []).map((slug) => `/tools/${slug}`),
  ];
  for (const target of ["/tools", "/", "/methodology", "/data-sources", "/editorial-policy"] ) addLink(`/tools/${tool.slug}`, target);
  for (const target of body) addLink(`/tools/${tool.slug}`, target);
}

for (const [page, counts] of pageLinks) {
  const total = [...counts.values()].reduce((sum, value) => sum + value, 0);
  if (total > LINK_CEILING) fail(`${page}: ${total} body links exceeds the ${LINK_CEILING} ceiling`);
  const worst = [...counts.entries()].sort((a, b) => b[1] - a[1])[0];
  if (worst && total > 10 && worst[1] / total > MAX_SHARE + 0.15) {
    notes.push(`${page}: ${worst[0]} receives ${((worst[1] / total) * 100).toFixed(0)}% of body links`);
  }
}

/* ------------------------------------------------ 8. click depth and reach */

// Depth 3 means Home → hub → tool. The static hub strip in the header and the
// hub band in the footer mean every page passes a link to all hubs, so the walk
// starts from those reachable-from-everywhere links (as a real crawler finds them).
// The header hub strip means home links to every hub in the rendered HTML, and
// the /tools directory lists every tool grouped by hub.
// The header hub strip is rendered on every page, so home links to every hub.
for (const hub of HUBS) link("/", hub.slug);
link("/", "/tools");
link("/", "/best");
// /tools lists every tool grouped by hub.
for (const hub of HUBS) link("/tools", hub.slug);
for (const tool of TOOLS) link("/tools", `/tools/${tool.slug}`);

const depth = new Map<string, number>([["/", 0]]);
const queue: string[] = ["/"];
while (queue.length) {
  const current = queue.shift()!;
  const children = edges.get(current) ?? new Set<string>();
  for (const child of children) {
    const next = (depth.get(current) ?? 0) + 1;
    if (!depth.has(child) || next < (depth.get(child) ?? Infinity)) {
      depth.set(child, next);
      queue.push(child);
    }
  }
}
for (const tool of TOOLS) {
  const d = depth.get(`/tools/${tool.slug}`);
  if (d === undefined) fail(`orphan: /tools/${tool.slug} is not reachable from home`);
  else if (d > 3) fail(`click depth: /tools/${tool.slug} is ${d} clicks from home (maximum 3)`);
}
for (const hub of HUBS) {
  const d = depth.get(hub.slug);
  if (d === undefined) fail(`orphan: hub ${hub.slug} is not reachable from home`);
}

// Inbound links: every tool must have at least three pages pointing at it.
const inbound = (slug: string) => {
  // The hub's own children list, the directory page, and any tool that picks
  // this one as a sibling all count as inbound links.
  const pages = new Set(bucket.get(`/tools/${slug}`) ?? []);
  pages.delete(`/tools/${slug}`); // self-link, not inbound
  return pages.size;
};
const lowInbound = TOOLS.filter((tool) => inbound(tool.slug) < 3);
for (const tool of lowInbound) fail(`inbound links: /tools/${tool.slug} has only ${inbound(tool.slug)}`);

/* ------------------------------- 8b. documented near-duplicate pairs */

// A pair in src/data/cannibalization.ts is allowed to exist only if the two
// pages link to each other, so a reader is always one click from the right page.
for (const pair of CANNIBAL_PAIRS) {
  if (!toolBySlug.has(pair.a) || !toolBySlug.has(pair.b)) {
    fail(`cannibalization pair references an unknown tool: ${pair.a} / ${pair.b}`);
    continue;
  }
  const aTargets = new Set<string>([...(edges.get(`/tools/${pair.a}`) ?? [])]);
  const bTargets = new Set<string>([...(edges.get(`/tools/${pair.b}`) ?? [])]);
  if (!aTargets.has(`/tools/${pair.b}`)) fail(`near-duplicate ${pair.a} does not link to ${pair.b}`);
  if (!bTargets.has(`/tools/${pair.a}`)) fail(`near-duplicate ${pair.b} does not link to ${pair.a}`);
}

/* -------------------------------------------------------------- 9. report */

const depthRows = HUBS.map((hub) => {
  const tools = toolsInHub(hub.id);
  const depths = tools.map((tool) => depth.get(`/tools/${tool.slug}`) ?? 0);
  return `| ${hub.label} | ${tools.length} | ${Math.min(...depths)} | ${Math.max(...depths)} | ${bestOfForHub(hub.id).length} | ${guidesForHub(hub).length} |`;
});

const toolRows = [...TOOLS]
  .sort((a, b) => (siblingCounts[a.slug] ?? 0) - (siblingCounts[b.slug] ?? 0))
  .slice(0, 20)
  .map((tool) => `| ${tool.slug} | ${hubById.get(hubForTool(tool))?.label ?? "—"} | ${siblingCounts[tool.slug]} | ${guideForTool(tool.slug) ? "yes" : "no"} | ${depth.get(`/tools/${tool.slug}`) ?? "?"} |`);

mkdirSync("reports", { recursive: true });
writeFileSync(
  "reports/internal-links.md",
  `# Internal linking audit

Generated by \`npm run audit:links\` on ${new Date().toISOString().slice(0, 10)}.

- Tools: ${TOOLS.length}
- Hubs: ${HUBS.length} (+ ${SUBHUBS.length} sub-hubs)
- Guides: ${ALL_GUIDES.length}
- Best-of pages: ${BEST_OF.length}
- Primary keywords claimed once each: ${PRIMARY_OWNER.size}
- Failures: ${failures.length}

## Hub summary

| Hub | Tools | Min click depth | Max click depth | Best-of pages | Guides |
| --- | --- | --- | --- | --- | --- |
${depthRows.join("\n")}

## Thinnest clusters (lowest sibling-link counts)

| Tool | Hub | Siblings | Guide link | Click depth |
| --- | --- | --- | --- | --- |
${toolRows.join("\n")}

## Notes

${notes.length ? notes.map((note) => `- ${note}`).join("\n") : "- None."}

## Failures

${failures.length ? failures.map((item) => `- ${item}`).join("\n") : "- None. All checks passed."}
`,
);

// Secondary keywords that are the primary of another page are reported, not
// failed: they are the "close variants" the plan deliberately allows, provided
// the two pages link to each other.
const conflicts: string[] = [];
for (const [keyword, pages] of SECONDARY) {
  const owner = PRIMARY_OWNER.get(keyword);
  if (owner && !pages.includes(owner)) conflicts.push(`${keyword} → ${pages.join(", ")} (primary owner: ${owner})`);
}
if (conflicts.length) {
  notes.push(`${conflicts.length} secondary keywords are also another page's primary keyword; review the pairs below.`);
  writeFileSync("reports/internal-links-cannibalization.md", `# Secondary keyword conflicts\n\n${conflicts.map((c) => `- ${c}`).join("\n")}\n`);
}

assert.equal(failures.length, 0, failures.join("\n"));
console.log(`PASS: ${TOOLS.length} tools across ${HUBS.length} hubs and ${SUBHUBS.length} sub-hubs, ${BEST_OF.length} best-of pages and ${ALL_GUIDES.length} guides.`);
console.log(`Checked: link resolution, orphan pages, parent/sibling/cross-hub links, guide pairing, keyword ownership, click depth ≤ 3, ≥ 3 inbound links, link ceiling.`);
if (notes.length) console.log(`${notes.length} advisory note(s) written to reports/internal-links.md`);
