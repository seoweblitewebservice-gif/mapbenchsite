import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { contextLinks } from "../src/lib/contextLinks";
import { TOOLS, toolBySlug } from "../src/lib/registry";
import { ALL_GUIDES } from "../src/data/allGuides";
import { STUDIES } from "../src/data/studies";
import { RESOURCE_CLUSTERS, TOOL_RESOURCE_OVERRIDES } from "../src/data/resourceClusters";

function valid(href: string) {
  if (href.startsWith('/tools/')) return toolBySlug.has(href.slice(7));
  if (href.startsWith('/guides/')) return ALL_GUIDES.some(g => g.slug === href.slice(8));
  if (href.startsWith('/studies/')) return href === '/studies/state-capital-radius' || STUDIES.some(s => s.slug === href.slice(9));
  return ['/methodology', '/data-sources', '/privacy', '/maps', '/tools', '/guides', '/studies'].includes(href);
}
for (const item of [...Object.values(RESOURCE_CLUSTERS).flat(), ...Object.values(TOOL_RESOURCE_OVERRIDES).flat()]) {
  assert(valid(item.href), `Invalid reading link: ${item.href}`);
}
for (const slug of ['halfway-between-two-places', 'drive-time-map']) {
  const data = JSON.parse(readFileSync(`content/${slug}.json`, 'utf8'));
  function visit(value: unknown) {
    if (!value || typeof value !== 'object') return;
    for (const [key, item] of Object.entries(value)) {
      if (key === 'l' && typeof item === 'string') assert(valid(item), `Invalid ${slug} link: ${item}`);
      else visit(item);
    }
  }
  visit(data);
}
for (const tool of TOOLS) {
  const target = tool.related.map(slug => toolBySlug.get(slug)).find(t => t && t.slug !== tool.slug);
  if (!target) continue;
  const text = `Compare ${target.name}, then ${target.name}. <script>not HTML</script>`;
  const parts = contextLinks(text, tool);
  assert.equal(parts.map(p => p.text).join(''), text, 'Must preserve exact original text');
  assert.equal(parts.filter(p => p.href).length, 1, 'Repeated mentions link only once');
  for (const part of parts) if (part.href) assert(valid(part.href));
  assert(!contextLinks(`prefix${target.name}suffix`, tool).some(p => p.href), 'No partial-word links');
}
console.log('PASS: contextual links, text preservation, duplicate limits, resource targets and rewritten-page links.');
