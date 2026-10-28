import { toolBySlug, type ToolDef } from "./registry";

export interface LinkedText { text: string; href?: string }

/** Link only explicit related-tool names, once per paragraph, never fuzzy keywords. */
export function contextLinks(text: string, tool: ToolDef): LinkedText[] {
  const candidates = [...new Set(tool.related)]
    .filter(slug => slug !== tool.slug)
    .map(slug => toolBySlug.get(slug))
    .filter((item): item is ToolDef => Boolean(item))
    .sort((a, b) => b.name.length - a.name.length);
  const used = new Set<string>();
  const parts: LinkedText[] = [];
  let cursor = 0;
  const lower = text.toLowerCase();
  while (cursor < text.length && used.size < 2) {
    let best: { index: number; tool: ToolDef } | undefined;
    for (const candidate of candidates) {
      if (used.has(candidate.slug)) continue;
      let index = lower.indexOf(candidate.name.toLowerCase(), cursor);
      while (index >= 0) {
        const before = text[index - 1] ?? "";
        const after = text[index + candidate.name.length] ?? "";
        if (!/[\p{L}\p{N}]/u.test(before) && !/[\p{L}\p{N}]/u.test(after)) break;
        index = lower.indexOf(candidate.name.toLowerCase(), index + 1);
      }
      if (index >= 0 && (!best || index < best.index)) best = { index, tool: candidate };
    }
    if (!best) break;
    if (best.index > cursor) parts.push({ text: text.slice(cursor, best.index) });
    cursor = best.index + best.tool.name.length;
    parts.push({ text: text.slice(best.index, cursor), href: `/tools/${best.tool.slug}` });
    used.add(best.tool.slug);
  }
  if (cursor < text.length) parts.push({ text: text.slice(cursor) });
  return parts;
}
