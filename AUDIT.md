# MapBench tool-page audit — 27 October 2026

## Scope and evidence

Repository baseline: `8c7ddc96b0623c55a2cae219c88ccbeafe1772d4`. All 496 canonical English tools were inventoried, not just popular pages. See `audits/tool-pages.csv` for one row per tool and `audits/tool-slugs-baseline.json` for the URL contract. Registry data, all 496 content JSON files, registered workspace components, the shared route, dedicated matrix route, shared content renderer, sitemap and redirect configuration were inspected programmatically or at template level.

This is a **repository/content/rendered-HTML audit**, not a claim that 496 calculators were manually operated, every formula independently proven, or external APIs tested. Original calculator behaviour is deliberately unchanged. Full interaction, mobile visual, accessibility and numerical regression coverage remains separate work.

The requested historical `AUDIT.md` and `COMPETITOR-DEEP-AUDIT.md` were absent from the checkout/history available to this session. Fetching `https://mapbench.site/AUDIT.md` and `/COMPETITOR-DEEP-AUDIT.md` returned the site's 404 page. No conclusions are attributed to those unavailable documents. These new reports are explicitly fresh audits.

## Findings and implementation

| Priority | Baseline finding | Action / status |
| --- | --- | --- |
| High | 69 registry related references pointed to unregistered tools; the renderer silently discarded them | Corrected references to live, relevant tools in source data. All registry and content tool links now validate. No tool slugs renamed. |
| High | Quick answers existed on 495 content-backed pages plus the dedicated matrix page, but followed the workspace | Moved existing original MapBench answers above the workspace on all 496 English tools. No duplicate answer block. |
| High | Method detail was buried in long category content | Added a directly linked method/assumptions/limits panel across shared pages and the dedicated matrix route. It shows the existing per-tool method where provided, plus original category-specific verification and limitation guidance. |
| High | Browser-first wording could be mistaken for offline processing | Explicitly distinguish local calculations from third-party search, map and data requests in the new panel; link privacy and source notes. |
| Medium | Universal “Shareable results” badge implied every calculator serializes inputs | Replaced with “No installation required.” The copy-link button is not a guarantee that inputs are encoded. |
| Medium | WebPage schema asserted `reviewedBy` without page-specific review evidence | Removed this assertion in shared schema; retained authorship without manufacturing a review or update date. |
| Medium | WebPage / application / breadcrumb entities lacked explicit connections | Connected `mainEntity` and breadcrumb IDs in shared JSON-LD. Existing FAQ answers and HowTo steps still use the same data as visible content. |
| Medium | Raw JSON-LD serialization allowed literal `<` | Escape `<` as a Unicode sequence in both English route templates. |
| Medium | No repeatable all-tool URL/content/link audit | Added `npm run audit:tools` and a production-rendered all-tool smoke script. |

## Important remaining editorial debt

- **159 tools have no dedicated registry method text.** New category checks are not presented as a verified formula for those tools. The CSV flags each one for implementation-specific source/formula documentation.
- Some tools still inherit broad steps, category examples and repeated explanatory prose. Existing copy is preserved rather than bulk-replaced with keyword-swapped filler. Individually test each engine before publishing new formula, precision, provider or export claims.
- No new aggregate ratings, fake reviews, fabricated test results, unsupported `dateModified` values, or rich-result promises were added. FAQ/HowTo markup does not guarantee search enhancements.
- Existing locale redirects are preserved. This work does not reinstate translated pages or change canonical paths.
- Whole-repository ESLint reports 66 errors and 12 warnings outside the changed route/component/script set. Changed route/component/audit files pass targeted ESLint. Dependency installation also reported 7 vulnerabilities; dependency upgrades are not silently mixed into this content/structure change.

## Validation

- `npm run audit:tools`: PASS, 496 unchanged canonical slugs, matching content slugs, registered components and valid registry/content tool links.
- `npm run build`: PASS, optimized production compilation and static generation.
- `python scripts/smoke-tool-pages.py`: PASS, all 496 production-rendered routes return 200; exactly one H1; canonical URL present; quick answer before workspace; required anchors; parseable WebApplication, BreadcrumbList and FAQPage schema; FAQ questions visible in HTML.
- Targeted ESLint: PASS. Whole-repo lint: fails as described above; not reported as green.
- Production preview runs on `0.0.0.0:3000`. These HTTP checks do not test WebGL, geolocation permission or third-party availability.
- Vercel/GitHub verification is recorded in `audits/VERIFICATION.md` after deployment. Production is not changed or merged by this task.

## Reproduce

```sh
npm install
npm run audit:tools
npm run build
npm run start -- --hostname 0.0.0.0
# In a separate shell:
python scripts/smoke-tool-pages.py
```

## Continuation audit — 28 October 2026

The initial audit above is historical; the following supersedes its missing-method count.

### Implementation changes

- **Method text now exists on 496/496 tools.** The previous 159 missing entries now resolve to implementation-specific engine descriptions, with source-file links and engine-specific limits where mapped. Shared engines have shared documentation by design; this is not 496 independently validated algorithms.
- Corrected an actual model mismatch: polygon area uses the local **spherical** ring formula, not the ellipsoid claimed by an earlier registry entry. Radius statistics use planar πr², unlike the spherical-cap calculation in AreaTool circle mode. These distinctions are now explicit.
- Replaced the general workspaces on six legacy URLs with the appropriate existing engines: magnetic correction, polygon centroid, random points, school districts, congressional districts and iframe generation. Slugs are unchanged. School mode is explicitly selected rather than inheriting congressional mode.
- Added an actual equal-weight MapLibre heat layer for `heatmap-from-points`; standard CSV mapping already had zoom-dependent clustering. These are visualization operations, not statistical cluster inference or population-density models.
- Rewrote the mismatched lot-size answer, metadata and worked example to describe polygon drawing. The 12,364 m² reference example is checked against the actual spherical-area helper.
- Rewrote content for upgraded and capability-limited pages to remove unsupported feature claims and imaginary worked results. Eighteen remaining specialist URLs explicitly disclose which operation is and is not available. These are **remaining feature gaps**, not completed specialist implementations; see the CSV capability column and `src/data/toolCapabilities.ts`.
- Removed the second generic quick-answer block. When per-page content exists, removed the redundant category-level “worked examples”/use-case blocks, which could describe a different task. Kept intent-specific page examples, related guides and editorial guidance.
- Source inspection exposed a real US fuel-price unit bug: litres were multiplied by price per gallon. Quantity and price now use matching units, with regression tests. The daylight chart now uses the current year rather than hard-coded 2025.
- Added all-tool audit and numeric regression checks to GitHub CI.

### Verification scope

`npm run audit:tools`, `npm run test:tools`, TypeScript and the production build pass. All 496 local production-rendered tool pages pass the strengthened smoke test, which verifies the exact canonical tag and visible FAQ **answers** and HowTo steps against JSON-LD, not merely a matching URL string or FAQ question.

A real headless Chromium session at 375px width verified interactive polygon-centroid input/output, absence of horizontal overflow on that page, CSV ingestion and invalid-coordinate reporting on the heatmap page, the magnetic workspace's date control, and iframe output presence. No page exceptions occurred in this sample. External requests were deliberately blocked: these tests do **not** verify third-party APIs, map-tile rendering, WMM responses or iframe loading. The browser test is reproducible with `npm run test:browser` while the local production server runs on port 3000 (Linux runtime libraries are taken from the bundled Chromium package).

The audit CSV now records the implementation reference, capability boundary and upgraded-engine target per tool. Whole-repository lint debt and external-service/mobile coverage outside this sample remain open; a passing build does not close them.
