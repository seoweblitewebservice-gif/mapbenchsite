/** Run after npm run build; validates rendered HTML, not just source templates. */
import assert from "node:assert/strict";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { TOOLS } from "../src/lib/registry";

const failures: string[] = [];
const rows: string[] = [];
for (const tool of TOOLS) {
  const html = readFileSync(`.next/server/app/tools/${tool.slug}.html`, "utf8");
  const errors: string[] = [];
  const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(m => m[1]);
  const required = ["how-to-use", "use-cases", "worked-examples", "popular-table", "tool-guide", "method-and-limits", "faq", "trust"];
  for (const id of required) if (!ids.includes(id)) errors.push(`missing ${id}`);
  for (const id of required) if (ids.filter(value => value === id).length > 1) errors.push(`duplicate ${id}`);
  if ((html.match(/<h1[ >]/g) ?? []).length !== 1) errors.push("expected one H1");
  const ordered = tool.slug === 'distance-matrix-calculator'
    ? ["how-to-use", "use-cases", "popular-table", "tool-guide", "method-and-limits", "faq"]
    : required.slice(0, -1);
  const positions = ordered.map(id => html.indexOf(`id="${id}"`));
  if (positions.some((pos, i) => i > 0 && pos < positions[i - 1])) errors.push("section order");
  if (html.indexOf('Tool workspace') > html.indexOf('id="how-to-use"')) errors.push('workspace must precede article');
  const nav = html.match(/<nav aria-label="On this page"[\s\S]*?<\/nav>/)?.[0] ?? '';
  for (const match of nav.matchAll(/href="#([^"]+)"/g)) if (!ids.includes(match[1])) errors.push(`dead anchor ${match[1]}`);
  if (!nav) errors.push('missing contents navigation');
  if (errors.length) failures.push(`${tool.slug}: ${errors.join(', ')}`);
  rows.push(`| ${tool.slug} | ${errors.length ? errors.join(', ') : 'PASS'} |`);
}
mkdirSync('reports', { recursive: true });
writeFileSync('reports/content-structure-audit.md', `# Tool-page structure audit\n\n${TOOLS.length} rendered tool pages checked. ${failures.length} failures.\n\nChecks: one H1, working contents anchors, required sections, unique section IDs, tool-first placement, and reading order. This is a structural check, not a claim that all copy is individually rewritten or fact-checked.\n\n| Page | Structure |\n| --- | --- |\n${rows.join('\n')}\n`);
assert.equal(failures.length, 0, failures.join('\n'));
console.log(`PASS: all ${TOOLS.length} rendered tool pages have the required editorial structure.`);
