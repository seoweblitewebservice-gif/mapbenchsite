import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { TOOLS } from '../src/lib/registry';
import { toolComponents } from '../src/components/tools';
import type { PageContent } from '../src/lib/pageContent';

const slugs = new Set(TOOLS.map(t => t.slug));
const baseline = JSON.parse(readFileSync('audits/tool-slugs-baseline.json', 'utf8')) as string[];
assert.deepEqual([...slugs].sort(), baseline.sort(), 'Existing canonical tool URLs must not change');
const rows: string[][] = [['slug', 'category', 'component', 'quick_answer', 'method_detail', 'examples', 'related_links', 'editorial_follow_up']];
const errors: string[] = [];
for (const t of TOOLS) {
  const pc = JSON.parse(readFileSync(`content/${t.slug}.json`, 'utf8')) as PageContent;
  const dedicated = t.slug === 'distance-matrix-calculator';
  if (!(t.component in toolComponents)) errors.push(`${t.slug}: component ${t.component} missing`);
  if (t.component === 'list-spatial' && !['voronoi', 'buffer', 'suitability', 'dashboard', 'form-builder', 'live-connector'].includes(String(t.props?.mode))) errors.push(`${t.slug}: invalid list-spatial mode ${t.props?.mode}`);
  if (t.component === 'list-map' && !['county-cities', 'boundary-kml', 'boundary-country', 'airport-routes', 'advanced-embed', 'store-locator'].includes(String(t.props?.mode))) errors.push(`${t.slug}: invalid list-map mode ${t.props?.mode}`);
  if (t.component === 'list-location' && !['municipality', 'village', 'district', 'parish', 'coords-city', 'coords-country', 'coords-state', 'coords-lookup', 'intersection'].includes(String(t.props?.mode))) errors.push(`${t.slug}: invalid list-location mode ${t.props?.mode}`);
  if (t.component === 'list-grid' && !['ngr-convert', 'ngr-to-postcode', 'postcode-to-ngr', 'ngr-map', 'osgrid-distance', 'uk-postcode-distance', 'uk-postcode-walking'].includes(String(t.props?.mode))) errors.push(`${t.slug}: invalid list-grid mode ${t.props?.mode}`);
  if (t.component === 'list-earth' && !['elevation-atlas', 'terrain-grid', 'gps-speedometer', 'moon-calendar', 'snow', 'rain', 'cicada'].includes(String(t.props?.mode))) errors.push(`${t.slug}: invalid list-earth mode ${t.props?.mode}`);
  if (t.component === 'list-file' && !['gpx-hr', 'photo-route'].includes(String(t.props?.mode))) errors.push(`${t.slug}: invalid list-file mode ${t.props?.mode}`);
  if (t.component === 'fileviewer' && !['kml', 'gpx', 'geojson'].includes(String(t.props?.format))) errors.push(`${t.slug}: invalid fileviewer format ${t.props?.format}`);
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
  rows.push([t.slug, t.category, t.component, dedicated ? 'dedicated route' : 'present', t.method ? 'registry method + scope checks' : 'category scope checks only', dedicated ? 'dedicated route' : String(pc.examples?.length ?? 0), String(new Set(related).size), !t.method ? 'Add implementation-specific formula/source documentation' : 'Review generic steps and examples against implementation']);
}
writeFileSync('audits/tool-pages.csv', rows.map(row => row.map(cell => `"${cell.replaceAll('"', '""')}"`).join(',')).join('\n') + '\n');
assert.deepEqual(errors, [], 'Tool audit failed');
console.log(`PASS: ${TOOLS.length} unchanged slugs, content, registered components and internal tool links. Per-page report: audits/tool-pages.csv`);
console.log(`Editorial debt: ${TOOLS.filter(t => !t.method).length} tools still lack implementation-specific method text; category checks do not claim otherwise.`);
