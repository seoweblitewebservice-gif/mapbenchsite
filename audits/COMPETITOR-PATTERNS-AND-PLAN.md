# MapBench: competitor pattern audit and implementation plan

Audit date: 2026-10-28. Scope: representative public pages, not a complete crawl or an examination of private code. Observations below come from public page content retrieved in this session; they are not claims about rankings, traffic, Core Web Vitals, backend infrastructure or deployment configuration. Markdown extraction does not establish responsive layout, actual control behavior, raw HTML metadata, JSON-LD or HTTP status reliably. Those require a browser/raw-response audit.

## Public page-type inventory

- [Home](https://www.simplemaplab.com/): tool search and prominent tools, grouped directory with descriptions and category jump links, maps, state/county links and supporting content. These serve discovery and navigation, not proof that all tools function as advertised.
- [Tools directory](https://www.simplemaplab.com/tools): grouped links, short task descriptions and geographic coverage indicators. The homepage and directory overlap intentionally as discovery paths.
- [Midpoint tool](https://www.simplemaplab.com/tools/halfway-between-two-places) and [radius tool](https://www.simplemaplab.com/tools/map-radius-tool): interactive inputs followed by instructions, examples, related resources, methodology and FAQs. Some extracted content conflicts: the midpoint page describes both simple coordinate averaging and a great-circle midpoint. Do not use competitor copy as technical authority; check MapBench's implementation and methods independently.
- [Blog index](https://www.simplemaplab.com/blog) and [projection article](https://www.simplemaplab.com/blog/what-is-a-map-projection): descriptive titles, dates, read time, opening answer, themed sections, visual explanations and supporting links. A relevant structure depends on the topic; no fixed heading or word-count target is implied.
- [Blank-map directory](https://www.simplemaplab.com/maps/blank) and [Japan map](https://www.simplemaplab.com/maps/blank/japan): resource groupings, map previews, variant/download controls and source/licence explanations. The Japan page's claims about internal prefecture boundaries conflict with its own limitation statement; independently verify capabilities rather than copying claims.
- [California counties](https://www.simplemaplab.com/states/california/counties): parent geography, table, map and links to related map/tools, plus sources and limitations. Do not reuse its figures.
- [Research study](https://www.simplemaplab.com/studies/most-remote-places): dated byline, definitions, visual results, tables, methodology, limitations and data links. Data and licence need independent verification before any reuse.
- [About](https://www.simplemaplab.com/about), [Contact](https://www.simplemaplab.com/contact), [Methodology](https://www.simplemaplab.com/methodology), [Privacy](https://www.simplemaplab.com/privacy-policy), [Terms](https://www.simplemaplab.com/terms-of-use): operator, editorial, sourcing, contact and privacy disclosures. These are competitor-specific, not MapBench policy evidence.
- [robots.txt](https://www.simplemaplab.com/robots.txt) advertises a sitemap and excludes /api/. [sitemap.xml](https://www.simplemaplab.com/sitemap.xml) lists tools, maps, editorial and informational URLs. A sitemap listing is not proof of indexing or freshness.
- `/guides` and `/maps` returned a not-found page in the content extractor; the observed competitor hubs are `/blog` and `/maps/blank`. Header dropdown, mobile menu, footer, canonical tags, schema, social metadata, pagination, image dimensions and real-world performance were not verified with raw HTML/browser access. Do not infer them from the extracted text.

## MapBench architecture and existing linking map

- Next.js App Router; `src/app/page.tsx` uses the canonical `CATEGORIES`/`TOOLS` registry. Existing in-progress homepage edits restore the full category directory and popular links.
- `/` → `/tools/category/[category]` → `/tools/[tool]`; tool pages also have breadcrumbs, `related` tools and `RelatedReading` resources. `src/components/ToolClient.tsx` renders the existing interactive tool and editorial sections; no rewrite is needed to create another template.
- `/guides` → `/guides/[slug]`; guide blocks support headings, paragraphs, lists, notes and toolboxes. Guide pages use breadcrumbs, metadata and reciprocal `ResourceToolLinks` where configured.
- `/studies` → `/studies/[slug]` → results, data, method, limits and relevant tools. `/states` → state county pages; `/reference` → country reference pages; `/maps` → dedicated state/country maps.
- Shared `Header.tsx` contains menu, search and theme controls; `Footer` and trust pages provide policy links. Preserve these components and their existing behavior.
- `robots.ts`, `sitemap.ts` and generated metadata define the crawl structure. A prior build audit reported 888 rendered pages and zero findings for the checks it implements, not a comprehensive SEO validation. Dynamic routes, interaction, external services, duplicate metadata, JSON-LD validity and actual indexing need additional testing.

## Verified gap and linking plan, before implementation

The homepage map preview component sends every country thumbnail to the generic `/maps` hub, even though the app has a canonical country-map route. Planned change: route country previews directly to their existing `/maps/blank/[country]` pages, while keeping the world thumbnail at the map hub. Retain all map previews, no new datasets, and verify every destination against generated routes. This adds relevant homepage → resource links without sitewide unrelated links.

The homepage directory had previously been shortened during this session; the user's latest instruction requires all descriptions, so the in-progress correction restores all 496 registry entries. Existing tool → guide/study and resource → tool links are already data-driven; changing these wholesale without a relevance review risks adding unrelated links. No unsupported structured data or claims will be added.

## Prioritized implementation

1. Preserve the current in-progress homepage changes, all registry entries, map resources, FAQs, metadata and structured data; improve the verified map-preview destination gap (`src/components/BlankMapsHomeGrid.tsx`).
2. Validate production build, canonical registry links and route destinations, current automated site/structure/editorial/geometry checks; record limitations.
3. Future/manual review: actual desktop/mobile menu, keyboard navigation, search, map downloads and external-service behavior; raw competitor HTML metadata/schema; duplicate title/description/canonical and sitemap freshness analysis; accessibility and performance measurement; factual/privacy/legal review by the site owner. Do not claim full coverage from representative samples.
