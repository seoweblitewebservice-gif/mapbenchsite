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
