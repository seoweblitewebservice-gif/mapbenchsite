# MapBench internal linking — implementation and rollout

Companion to the internal linking plan (hub-and-spoke topic clusters). This
document records what was actually built, how it maps to the plan's rules, and
what remains for phases 3–5.

**Status: phases 1 and 2 complete and enforced by an audit.** Phases 3–5 are
partly done (10 new guides, 12 best-of pages) with the remaining work listed at
the end.

---

## 1. What the site already had

Verified against the repository, not assumed:

| Area | State before this work |
| --- | --- |
| Tool pages | 496 canonical tools under `/tools/<slug>`, all server-rendered, with quick answers, method panels and FAQs |
| Browsing | 12 editorial **categories** at `/tools/category/<id>` — grouped by *dataset* (Location, Distance & Bearing, Radius & Area, Files, …) |
| Guides | 45 guides at `/guides/<slug>` |
| Nav | Header mega-menu (client-rendered on click), footer with popular tools and resources |
| Breadcrumbs | Home / Tools / Category / Tool, plus `BreadcrumbList` schema |
| Sitemap | Tools, categories, guides, studies, states, countries |

The gap the plan identified was real but slightly different from the plan's
assumption:

1. **Categories were not search-intent hubs.** "Radius & Area" mixed radius
   maps, acreage, unit converters and farm calculators — four intents, one
   pillar. "Location" contained all the time-zone tools. "Coordinates" contained
   administrative lookups.
2. **The hub links were not crawlable.** The only place all categories were
   listed together was inside a JS mega-menu that renders on click, and the
   `/tools` page's category grid.
3. **Tool pages had no parent-hub link in their body.** The only upward links
   were the breadcrumb (to the category) and the trust panel.
4. **21 links pointed at slugs that do not exist.** Guides' `toolbox` blocks
   referenced tools such as `great-circle-calculator`, `gps-coordinate-lookup`
   and `daylight-hours-calculator`. Ten guide blocks were affected. The renderer
   silently dropped them, so ten guides had dead tool recommendations in their
   source and nothing rendered in their place.
5. **"Related tools" was thin.** 274 of 496 tool pages rendered a curated grid
   of only one or two links, and the same handful of popular tools absorbed
   almost every inbound link.

---

## 2. What was built

### 2.1 A hub taxonomy that matches search intent

`src/data/hubs.ts` defines **14 task hubs** and **3 GIS sub-hubs**. Membership is
declarative (category default + explicit overrides + scoped slug patterns), so
the assignment is auditable and stable as tools are added.

| Hub | Path | Tools | Also links to |
| --- | --- | --- | --- |
| Distance Calculators | `/distance` | 29 | routes, bearing-midpoint, radius |
| Bearing & Midpoint | `/bearing-midpoint` | 18 | distance, routes, location |
| Routes & Travel Time | `/routes` | 63 | distance, radius, time |
| Radius & Service Area | `/radius` | 19 | area, distance, map-maker, lookup |
| Area & Acreage | `/area` | 27 | land-calculators, radius, gis-files, map-maker |
| Farm & Garden | `/land-calculators` | 20 | area, radius |
| Location & Geocoding | `/location` | 38 | time, lookup, gis-files |
| Coordinates | `/coordinates` | 64 | location, distance, gis-files, map-maker |
| Time Zones | `/time` | 17 | location, sun-moon |
| Sun & Moon | `/sun-moon` | 28 | time, location, earth |
| Boundaries & Lookups | `/lookup` | 40 | location, radius, map-maker |
| Elevation & Terrain | `/earth` | 41 | distance, lookup, sun-moon |
| GIS Files | `/gis-files` | 65 | map-maker, coordinates, area, distance |
| Map Maker | `/map-maker` | 27 | gis-files, radius, area, coordinates |

Sub-hubs: `/gis-files/geojson` (18), `/gis-files/gpx` (26),
`/gis-files/other` (19), and `/map-maker/blank-maps` (printable maps).

**Slug note.** The plan proposed `/radius/`, `/area/`, `/land-calculators/` and
so on. Existing live URLs were kept for every tool; only new hub URLs were
created at the top level, because nesting 496 unchanged tool URLs under new hub
paths would have required redirects with no ranking benefit. The hub *paths* are
short, keyword-led and match the plan's structure; the *tool* URLs are unchanged.

Why `/land-calculators` and not `/land`: the plan's own keyword mapping lists
"farm acreage calculator" and "field area calculator" as the hub targets, and
`/land-calculators` is the slug that page already needed. Every other hub uses
the plan's proposal.

### 2.2 Pillar pages

`src/components/hubs/HubPageRoute.tsx` renders the plan's hub template:

1. `H1` with the head keyword.
2. 3-paragraph, ~200-word intro that links the top tools (first 100 words).
3. "Start with these" — three tools, named.
4. A complete grid of **every** child tool, with one-line descriptions.
5. Sub-hub families, where they exist.
6. "Learn more" — the cluster's guides.
7. "You may also need" — the cross-hub matrix from the plan.
8. Best-of lists in the cluster.
9. FAQs (on hubs that declare them).
10. Breadcrumbs above the H1 + `CollectionPage`, `BreadcrumbList` and `FAQPage`
    JSON-LD generated from the same data as the visible page.

Each hub has a unique title, description, `H1` and primary keyword. Nothing is
reused between hubs.

### 2.3 The spoke side

`src/components/hubs/ToolClusterLinks.tsx` renders, on every tool page, after
the FAQ and before the trust panel:

- **"Part of our … hub"** — the child-to-parent link (rule 3) with a
  keyword-rich anchor, plus the GIS sub-hub where one applies.
- **"Elsewhere in this cluster"** — same-hub siblings not already linked above.
- **"You may also need"** — 2–4 cross-hub links from the matrix (rule 5).
- **"Read the guide behind this tool"** — the tool-to-guide link (rule 7).

The breadcrumb also now shows Home / Tools / **Hub** / Tool, so the parent link
appears above the fold as well as in the body. `BreadcrumbList` schema matches
the visible trail.

**"Related tools" (rule 4)** is the page's existing curated grid, now topped up
to a floor of five links with the tool's ring neighbours (see 2.5) rather than
being left at one or two.

### 2.4 Sitewide navigation (rule 9)

- **Static hub strip** in the header (`HubNavLinks`), rendered on every page as
  plain anchors — not behind a click. This is what makes all 14 hubs one hop
  from anywhere.
- **Header mega-menu** now leads with the task hubs, then the tool columns.
- **Header nav**: Tools, Guides, Best of.
- **Footer**: a band listing all 14 hubs with tool counts, all 12 best-of
  pages, and the method pages.
- **`/tools`**: rewritten as the All Tools hub — every hub with every tool in it,
  plus the original category index for readers who browse by dataset.

### 2.5 Link distribution, not a star

The naive version of "3 to 6 related tools" makes every page point at the same
six popular tools, which leaves 300+ pages with almost no inbound links. The
selection is therefore:

1. **Curated** `related` entries from the tool's content file (the editorial
   answer), same hub only, for the sibling floor.
2. **Ring neighbours** — the tool's immediate neighbours in its hub ordering,
   alternating forward and backward. Every tool uses the same offsets, so the
   pairing is symmetric: what a page links forward, it receives backward.

Result: every tool page renders 3–6 related tools, and **every tool has at least
3 inbound links** (mean 6.8), with no page above the 100-link ceiling.

### 2.6 Guides and best-of pages

- `HubGuideLinks` puts a "put this into practice" block in the first screen of
  every guide: the parent hub plus two named tools. 33 guides have an explicit
  hub mapping; the rest inherit a hub through their toolbox tools.
- 12 best-of pages at `/best/<slug>` plus a `/best` index. Each has a verdict,
  ordered picks with a reason, the parent hubs, the method note, FAQs, a
  `best-of` sitemap entry and `ItemList`/`FAQPage` schema.
- 10 new how-to guides (`src/data/guides9.ts`) covering the queries in the
  plan's guide table that had no page: distance between coordinates, halfway
  point, coordinates to address, cost per mile, fence length, seed rate, map
  scale, time zone by coordinates, CSV on a map, opening GeoJSON.

### 2.7 Sitemap, canonicals and robots

Every hub, sub-hub and best-of page is in `sitemap.xml` with a real
`lastModified`. Canonicals are self-referencing. `robots.txt` already allowed
everything except `/api/`.

---

## 3. The audit: `npm run audit:links`

`scripts/audit-internal-links.ts` is the plan's QA section made executable. It
fails the build on:

| Check | Rule from the plan |
| --- | --- |
| Unresolved internal href | no broken links |
| Hub exists as a route file on disk | no 404 pillars |
| Hub links every child tool | rule 2, no orphans |
| Tool links its parent hub | rule 3 |
| Tool renders 3–6 related tools | rule 4 |
| Tool links 2+ cross-hubs | rule 5 |
| Guide links a tool; tool links a guide | rules 6 and 7 |
| Best-of links hubs and picks | rule 8 |
| One page per primary keyword | "one search intent = one page" |
| Click depth ≤ 3 from home | "click depth at 3 or less" |
| ≥ 3 inbound links per tool | QA threshold |
| No page over 100 links | "never more than 100" |
| Canonical/sitemap coverage | technical checklist |

Outputs: `reports/internal-links.md` (hub table, click depth, thinnest clusters)
and `reports/internal-links-cannibalization.md` (secondary keywords that are
another page's primary). It is wired into `npm run verify:site` immediately after
the structure and smoke checks.

### What the audit found and fixed

- 21 dead tool slugs across 10 guides.
- 8 keyword collisions, including `slope calculator` claimed by two tools and
  `area calculator` claimed by both the map-area tool and the area hub.
- 2 tools whose related grid rendered a single link.
- Missing `/gis-files/page.tsx` (the nav listed a hub that 404'd during the first
  verification pass — caught by the route-existence check added afterwards).

---

## 4. Verification (all green)

```sh
npm run typecheck      # clean
npm run build          # 1013 static pages, exit 0
npm run audit:structure # PASS, 496 pages
npm run audit:links    # PASS
npm run test:links     # PASS
python scripts/smoke-tool-pages.py  # PASS, 496 pages
```

Rendered checks beyond the scripts: all 14 hubs, 3 sub-hubs, `/best` and 12
best-of pages return 200; every hub renders one H1, a real breadcrumb, all child
tool links, cross-hub links and a guide block; tool pages render the parent hub
in the breadcrumb and body; guide pages render the hub block in the first screen.

Whole-repository `npm run lint` still reports 64 pre-existing errors in
`src/components/tools/*` (unguarded `setState` in effects, `<a>` instead of
`<Link>`, a complex `useMemo` dependency). They are untouched by this work; every
file added or changed here lints clean.

---

## 5. Rollout mapping

| Phase | Plan | Status |
| --- | --- | --- |
| 1 (week 1) | `/tools` hub + 12 category hubs, header/footer nav, breadcrumbs sitewide | **Done** — 14 hubs + 3 sub-hubs, static header strip, footer hub band, hub breadcrumbs on tools and guides |
| 2 (weeks 2–3) | Intro-to-hub links, related and cross-hub blocks on high-volume tools | **Done** — applied to all 496 tools, not a subset |
| 3 (weeks 3–5) | Guides + tool-to-guide FAQ link | **Partly done** — 10 new how-to guides, guide→hub and tool→guide links live; 12 queries from the plan's table still need their own guide (list below) |
| 4 (weeks 5–6) | Best-of pages, remaining tools | **Best-of done** (12 pages). Tool coverage was already complete: conversions, farm calculators and micro-tools all exist — they were regrouped rather than created |
| 5 (ongoing) | Monthly audit | **Automated** — `npm run audit:links` in `verify:site` |

### Guides still to write (phase 3 remainder)

These plan queries resolve today to an existing guide via the hub fallback, but
deserve their own page: how to find elevation on Google Maps (exists, needs hub
mapping), how to create a custom pin map, how to open KML files, how to convert
GeoJSON to CSV, how to find your county by location, how to calculate radius
around a location, how to create a delivery radius map, how to calculate travel
time between cities, how to calculate flight distance, how to make a printable
blank map, how to measure property boundaries, how to create a custom labelled
map.

Write each with a `toolbox` block naming its tool — that is what makes the
tool→guide and guide→tool checks pass automatically.

---

## 6. Monthly review checklist

1. `npm run audit:links` — must exit 0. Read
   `reports/internal-links-cannibalization.md` every time; it is advisory and
   lists the pairs to review, not to delete.
2. Search Console → Performance → filter by query: exactly one URL per target
   keyword. Two URLs means merge or re-anchor.
3. Pages report: watch indexed count for the 14 hubs and 12 best-of pages.
4. For every new tool: add it to a hub (the rules usually assign it
   automatically), confirm the audit gives it 3+ siblings and 3+ inbound links,
   and give it a `GUIDE_PAIRS` entry or a toolbox mention in a guide.
5. For every new guide: add a `toolbox` block and a `GUIDE_HUBS` entry in
   `src/components/hubs/HubGuideLinks.tsx`.

## 7. Where the data lives

| File | Purpose |
| --- | --- |
| `src/data/hubs.ts` | Hub definitions, tool membership rules, sub-hubs, hub copy and FAQs |
| `src/data/bestOf.ts` | Best-of pages and their picks |
| `src/data/cannibalization.ts` | Documented near-duplicate pairs and why they stay separate |
| `src/data/guides9.ts` | New how-to guides |
| `src/lib/hubNav.ts` | All link resolution: siblings, ring neighbours, cross-hubs, guide pairing |
| `src/components/hubs/` | Hub template, tool cluster block, guide hub block |
| `scripts/audit-internal-links.ts` | The enforced link audit |
