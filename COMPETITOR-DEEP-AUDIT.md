# SimpleMapLab structural comparison — 27 October 2026

## Evidence boundaries

Directly fetched the homepage and these representative tool pages:
- https://www.simplemaplab.com/
- https://www.simplemaplab.com/tools/map-radius-tool (all three text chunks)
- https://www.simplemaplab.com/tools/distance-between-two-places (first text chunk)

This is a sampled competitor review, not an exhaustive crawl of all its tools. The fetch reader exposes rendered text, not a reliable raw-DOM/schema dump. Accordingly, no claim is made that competitor JSON-LD, canonicals, performance or mobile interactions were validated. The historical comparison report requested by the user was unavailable; see `AUDIT.md`.

## Techniques worth adapting, without copying content

| Technique observed | Evaluation | MapBench decision |
| --- | --- | --- |
| Intent-based homepage groups with descriptive links and scope labels | Helps distinguish location lookup, distance, radius and data needs | Preserve existing MapBench category hubs and breadcrumb hierarchy; do not imitate competitor naming or rewrite existing URLs. |
| Tool workspace followed by actionable steps | Task-first layout makes input/output intent clear | Preserve the workspace, but surface MapBench's own quick answer immediately before it. This placement is our implementation decision, not an assertion about the sampled competitor. |
| Concrete examples and reference tables | Useful when numbers can be reproduced and assumptions are explicit | Retain existing MapBench examples/tables; do not import competitor places, statistics or numbers. New verification guidance asks users to preserve inputs, mode and units. |
| Method section near explanatory content | A named method helps users distinguish geometry from road routing | Add an earlier, anchor-linked method/limits panel using MapBench's registry method and original category-specific checks. Do not claim that generic scope notes independently verify an engine. |
| Contextual prose links plus related cards | Links explain *why* another tool answers a different question | Keep existing MapBench prose and cards, repair 69 invalid related references, validate every tool target automatically. |
| Visible source and privacy discussion | Valuable only if local processing and remote lookups are distinguished | Explicitly disclose that search, basemap and data requests may use third parties, with source/privacy/correction links. |
| FAQs addressing mode, accuracy and source questions | Useful for resolving intent differences | Keep MapBench FAQ text and structured FAQ data synchronized. Do not copy competitor questions or answers. |

## Do not reproduce the competitor's weaknesses

The sampled radius page alternates sphere-based calculation language with an ellipsoid description in the source section. Its distance page describes driving estimates with different assumed speeds in the workflow and FAQ. Some radius examples make population, service coverage or regulatory assertions without enough local context to reproduce them. These are reasons to improve method boundaries, not material to copy.

MapBench must not imply that a circle proves delivery eligibility, school assignment, evacuation policy, drone authorization or radio propagation. Likewise, a browser-based interface does not prove that no coordinates ever reach third parties. The original limitation panels explicitly separate planning outputs from authoritative or safety-critical decisions.

## Schema policy

Schema improvements are based on MapBench's own visible content and Schema.org entity relationships, **not** an unverified claim about competitor schema. Link the actual application and breadcrumb to the page; serialize safely; keep FAQs/steps synchronized; avoid fabricated reviewers, ratings and dates. No SEO ranking or rich-result guarantee is made.

## Originality

No competitor text, tables, city-pair figures, scenario statistics, source claims or implementation code were added to MapBench. Existing MapBench content remains in place; new editorial text is written for its own models and scope. The comparison records techniques and critiques rather than reproducing the competitor's content.
