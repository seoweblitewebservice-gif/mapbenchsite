/** Run with the preview server running: npx tsx scripts/check-redesign.ts */
import assert from "node:assert/strict";
import { CATEGORIES, TOOLS } from "../src/lib/registry";

const origin = process.env.PREVIEW_ORIGIN ?? "http://localhost:3000";
async function page(path: string) {
  const response = await fetch(new URL(path, origin));
  assert.equal(response.status, 200, `${path} should load`);
  return response.text();
}
async function main() {
  const home = await page("/");
  for (const category of CATEGORIES) {
    assert(home.includes(`id="category-${category.id}"`), `Missing category ${category.id}`);
  }
  for (const tool of TOOLS) {
    assert(home.includes(`href="/tools/${tool.slug}"`), `Missing homepage tool ${tool.slug}`);
  }
  assert.equal((home.match(/<h1[ >]/g) ?? []).length, 1, "Homepage needs one H1");
  const directory = await page("/tools");
  assert(directory.indexOf('id="search-directory"') < directory.indexOf('id="tool-category-hubs"'), "Search must precede category guides");
  const radius = await page("/tools/map-radius");
  assert(radius.includes("Ten practical radius-map examples"));
  assert(radius.includes("Radius, route or drive-time map?"));
  assert(radius.indexOf("Tool workspace") < radius.indexOf('id="quick-answer"'), "Calculator must precede editorial content");
  assert(radius.replace(/<!--.*?-->/g, "").includes("28.3 square miles"), "3-mile worked example should be correct");
  for (const slug of ["drive-time-map", "driving-distance-calculator", "distance-between-two-places", "multi-radius-map"]) {
    assert(TOOLS.some(tool => tool.slug === slug), `Example link ${slug} must exist`);
  }
  console.log(`PASS: ${TOOLS.length} homepage links, ${CATEGORIES.length} categories, search-first directory, tool-first radius page and worked examples.`);
}
main().catch(error => { console.error(error); process.exitCode = 1; });
