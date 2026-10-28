# Tool page patterns: representative audit

Reviewed publicly accessible competitor pages for county lookup, coordinate finder, KML viewer and drive-time map on 2026-10-28, alongside the previously documented midpoint and radius examples. These are samples, not an audit of every competitor tool or a test of the competitor's interactive implementation.

## Observed patterns
- The interactive interface appears before the detailed explanatory sections; instructions follow and describe the actual task. Long explanations use headings, examples, methodology, limitations, related links and FAQs where applicable. The coordinate page includes a table of contents; the file viewer identifies supported and unsupported formats. County and routing pages distinguish coverage and model assumptions.
- Competitor claims and examples are not independent verification of MapBench's features, coverage or results. For example, coordinate precision is not itself measurement accuracy, and a travel-time polygon is not a live-traffic guarantee. Do not reuse competitor text, calculations or data.

## MapBench review and implementation
- `ToolClient.tsx` already implements a registry-backed page shell with one H1, workspace, instructions, optional authored content, method notes, FAQs and contextual links. `distance-matrix-calculator` uses a separate route and was handled separately. Existing `content/*.json`, registry data, methods, links, page metadata and tool implementations are retained.
- Added direct links to the workspace and usage instructions; improved contents navigation and typography; removed a misleading static “Ready” indicator and wording that assumed every tool has a map. Related descriptions no longer visually truncate. These changes are original and shared across the regular tool template and the dedicated matrix route.
- The competitor analysis informed the hierarchy, not the page copy or data. No claim is made that 496 individual tools, their output, examples, data sources, or all existing authored content have been independently validated.

## Remaining priorities
1. Review each tool's authored instructions, examples, coverage, source claims and current behavior against its implementation; prioritize popular and external-service-dependent tools. Where evidence is missing, correct or qualify the copy individually rather than adding generic text.
2. Test browser behavior at mobile and desktop widths, keyboard interaction, map rendering, downloads and routing/geocoding service failure modes. Check actual deployment origin and consent settings.
3. Review duplicate/boilerplate content, metadata and structured data with a rendered-page crawler and current search-engine guidance. Do not add schema solely for a rich result or assert guaranteed rankings/approval.

## Follow-up: all-tool inventory and trust corrections

The registry audit checked all 496 canonical slugs, matching content files, registered component keys and internal tool links. It identified 159 tools without a registry-level implementation-specific method; a category-level caution is not a substitute. Content-depth counts are an inventory only, not a factual review or quality target.

Review of the location and IP components found that some location controls use ipwho.is, with ipapi.co fallback, without browser GPS permission. The privacy page previously described all location controls as browser GPS only and did not name those providers. The privacy and data-sources pages now describe those requests and their approximate nature. Provider terms and any legal or consent implications still require owner review.

Removed three broadly applied but irrelevant category-to-guide links: network/IP tools to geographic routing, geographic reference lines to land-area measurement, and all location tools to meeting-point selection. Specific tool overrides still provide the meeting-point guide where relevant. No routes or tool behavior changed.

The category template claimed that every page has its own documented method. Since the all-tool audit found 159 registry entries without implementation-specific method text, category descriptions now say that detail varies instead of making a universal claim. Individual tool metadata and canonical URLs are unchanged. Exact duplicate checks across all content JSON records found no identical non-empty titles, descriptions, quick answers, summaries or step introductions; this is not a semantic-duplication or factual-accuracy audit.

A source-level review of the two network tools found that public-IP detection requires a button press and contacts ipwho.is; it does not automatically run on opening the page. Added implementation-specific method notes for both network tools, corrected the public-IP instructions, and qualified assertions that a single IP comparison proves a VPN leak. The remaining count without registry-level method text is 157. A lookup by itself cannot establish full VPN or DNS protection.
