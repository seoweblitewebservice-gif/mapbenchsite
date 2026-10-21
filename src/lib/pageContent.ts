/**
 * Per-tool page content for the restructured tool-page layout.
 * One JSON file per tool lives in /content/<slug>.json (repo root).
 * Files are pre-filled from existing registry/copy data; batches then
 * hand-finish them. A missing file simply means "old layout sections
 * only" — the page renders exactly as before.
 *
 * Server-side only: the page route loads the single file for its slug
 * and passes it to the client layout, so no bundle carries all 496.
 */

export interface ContentSegment {
  t: string;
  /** Optional link target: "/tools/<slug>" or any site path. */
  l?: string;
}

export interface PageContent {
  slug: string;
  primary_keyword: string;
  secondary_keywords: string[];
  /** SEO overrides (without the " · MapBench" suffix). Null = template default. */
  title: string | null;
  description: string | null;
  /** Display month for the byline, e.g. "October 2026". */
  updated: string;
  /** One plain-language sentence under the tool card. */
  summary_sentence: string | null;
  /** 40–50 words, contains the primary keyword. */
  quick_answer: string | null;
  /** Short intro paragraph above the 3 steps. Steps themselves stay in the registry. */
  steps_intro: string | null;
  use_cases: { title: string; body: ContentSegment[] }[] | null;
  examples: { label: string; body: ContentSegment[] }[] | null;
  popular_table: {
    title: string;
    intro: string;
    columns: string[];
    rows: string[][];
    note: string;
  } | null;
  /** Additional FAQs, appended to the tool's existing FAQ set. */
  faq: [string, string][];
  related_prose: ContentSegment[] | null;
  /** Optional override for the Related grid (for tools whose registry
   *  related list is empty). Null/absent = use the registry list. */
  related?: string[] | null;
  /** Slugs for the "More free tools" grid — must not overlap `related`. */
  more_tools: string[];
}

export async function loadPageContent(slug: string): Promise<PageContent | null> {
  try {
    const mod = await import(`../../content/${slug}.json`);
    return (mod.default ?? mod) as PageContent;
  } catch {
    return null;
  }
}
