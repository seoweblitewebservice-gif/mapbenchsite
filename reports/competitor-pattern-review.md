# Public-pattern review and remaining work

Reference: publicly rendered SimpleMapLab homepage, radius and distance pages. No competitor wording, assets or implementation code imported.

## Applied patterns

- Tool workspace before the article; ordered how-to instructions.
- Practical uses, worked examples, reference data, explanation, methodology/limits and FAQs.
- Contents navigation follows visible sections and uses valid anchors.
- Contextual links and reciprocal links between relevant tools, guides and studies.
- Study pages distinguish exported research data from related-tool datasets rather than claiming identical reproduction.
- Category hubs offer direct task navigation; public URLs are preserved.
- Unique MapBench copy retained; structural changes are not represented as individual content rewrites.

## Verification in this workspace

- Production build passes.
- 496/496 tool pages pass rendered structure checks and local HTTP/schema smoke tests.
- 888 static English public pages pass heading, metadata and local route/anchor checks.
- 48,601 distinct-per-page internal links checked. Dynamic routes are pattern-validated; dynamic directory pages separately HTTP-tested.
- 138 core calculation assertions pass.
- 276 upstream Open Location Code encoding vectors within supported inputs pass (Google open-location-code, test_data/encoding.csv, fetched for verification only).
- Fixed inverse UTM longitude central-meridian offset and replaced incorrect Plus Code pair/grid logic; added input validation and regression checks.
- GitHub Build Check now runs the reproducible verification command `npm run verify:site`.

## Not complete / not claimed

- 159 tools lack implementation-specific method text (see audits/tool-pages.csv). Category disclaimers are not substitutes for this work.
- Every calculator's interactive inputs, downloads, remote APIs and live data have NOT been exercised.
- Desktop/mobile screenshot parity is not verified; the competitor's private code, analytics and backend are unknown.
- MGRS conversion requires a separate authoritative-vector audit; this batch only fixes the UTM and Plus Code issues tested here.
- All 496 pages have NOT been individually rewritten or fact-checked.
- Maps, guides, studies and legal pages retain appropriate page-type layouts rather than being forced into a calculator template.
- This batch is a workspace preview, not a verified production release.
