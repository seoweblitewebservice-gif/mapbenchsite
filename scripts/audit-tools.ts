import assert from 'node:assert/strict';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { TOOLS } from '../src/lib/registry';
import { toolComponents } from '../src/components/tools';
import { engineMethod } from '../src/data/engineMethods';
import { CAPABILITY_NOTES } from '../src/data/toolCapabilities';
import { TOOL_ENGINE_UPGRADES } from '../src/data/toolEngineUpgrades';
import type { PageContent } from '../src/lib/pageContent';

const slugs = new Set(TOOLS.map(t => t.slug));
const baseline = JSON.parse(readFileSync('audits/tool-slugs-baseline.json', 'utf8')) as string[];
assert.deepEqual([...slugs].sort(), baseline.sort(), 'Existing canonical tool URLs must not change');
const rows: string[][] = [['slug', 'category', 'component', 'quick_answer', 'method_detail', 'examples', 'related_links', 'editorial_follow_up', 'implementation_reference', 'capability_boundary', 'upgraded_engine_target']];
const errors: string[] = [];
for (const t of TOOLS) {
  const pc = JSON.parse(readFileSync(`content/${t.slug}.json`, 'utf8')) as PageContent;
  const evidence = engineMethod(t);
  if (!t.method?.trim()) errors.push(`${t.slug}: method is required`);
  if (evidence && !existsSync(`src/components/tools/${evidence.source}`)) errors.push(`${t.slug}: missing implementation reference`);
  const alternative = CAPABILITY_NOTES[t.slug]?.alternative;
  if (alternative && !slugs.has(alternative)) errors.push(`${t.slug}: invalid capability alternative ${alternative}`);
  const dedicated = t.slug === 'distance-matrix-calculator';
  if (!(t.component in toolComponents)) errors.push(`${t.slug}: component ${t.component} missing`);
  if (pc.slug !== t.slug) errors.push(`${t.slug}: content slug mismatch`);
  for (const field of ['title', 'description', 'quick_answer'] as const) {
    if (!dedicated && !pc[field]?.trim()) errors.push(`${t.slug}: missing ${field}`);
  }
  const related = [...t.related, ...(pc.related ?? []), ...pc.more_tools];
  for (const link of related) if (!slugs.has(link)) errors.push(`${t.slug}: invalid related ${link}`);
  function checkLinks(value: unknown): void {
    if (Array.isArray(value)) return value.forEach(checkLinks);
    if (!value || typeof value !== 'object') return;
    const obj = value as Record<string, unknown>;
    if (typeof obj.l === 'string' && obj.l.startsWith('/tools/') && !obj.l.startsWith('/tools/category/')) {
      if (!slugs.has(obj.l.slice(7))) errors.push(`${t.slug}: invalid prose link ${obj.l}`);
    }
    Object.values(obj).forEach(checkLinks);
  }
  checkLinks(pc);
  rows.push([t.slug, t.category, t.component, dedicated ? 'dedicated route' : 'present', t.method ? 'registry method + scope checks' : 'category scope checks only', dedicated ? 'dedicated route' : String(pc.examples?.length ?? 0), String(new Set(related).size), 'Independent interaction/API validation remains separate', evidence?.source ?? 'registry method', CAPABILITY_NOTES[t.slug]?.unavailable ?? '', TOOL_ENGINE_UPGRADES[t.slug] ?? '']);
}
writeFileSync('audits/tool-pages.csv', rows.map(row => row.map(cell => `"${cell.replaceAll('"', '""')}"`).join(',')).join('\n') + '\n');
assert.deepEqual(errors, [], 'Tool audit failed');
console.log(`PASS: ${TOOLS.length} unchanged slugs, content, registered components and internal tool links. Per-page report: audits/tool-pages.csv`);
console.log(`Method coverage: ${TOOLS.filter(t => !!t.method).length}/${TOOLS.length}; explicit legacy capability boundaries: ${Object.keys(CAPABILITY_NOTES).length}; engine upgrades: ${Object.keys(TOOL_ENGINE_UPGRADES).length}. This does not claim all external services were tested.`);
