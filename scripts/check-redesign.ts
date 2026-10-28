/**
 * Homepage format + complete-directory coverage test.
 * Run with the preview server running: npx tsx scripts/check-redesign.ts
 * (or: npm run test:homepage, with PREVIEW_ORIGIN pointing at the server)
 *
 * The homepage lists the full tool directory (all registry tools,
 * category-wise) plus blank-map spotlights, a US-states strip, studies,
 * guides, popular questions, data sources and FAQ.
 */
import assert from "node:assert/strict";
import { CATEGORIES, TOOLS } from "../src/lib/registry";
import {
  HOMEPAGE_GUIDE_SLUGS,
  POPULAR_QUESTIONS,
  POPULAR_SLUGS,
  homepageMapHrefs,
} from "../src/data/homepage";
import { US_BLANK_MAP_STATES } from "../src/data/usBlankMapStates";
import { STUDIES } from "../src/data/studies";

const origin = process.env.PREVIEW_ORIGIN ?? "http://localhost:3000";

async function page(path: string) {
  const response = await fetch(new URL(path, origin));
  assert.equal(response.status, 200, `${path} should load`);
  return response.text();
}

function toolSlugsIn(html: string): Set<string> {
  const known = new Set(TOOLS.map((tool) => tool.slug));
  const found = new Set<string>();
  for (const match of html.matchAll(/href="\/tools\/([a-z0-9-]+)"/g)) {
    if (known.has(match[1])) found.add(match[1]);
  }
  return found;
}

async function main() {
  assert.equal(POPULAR_SLUGS.length, 4, "Homepage hero must feature exactly 4 popular tools");
  assert.equal(HOMEPAGE_GUIDE_SLUGS.length, 3, "Homepage must showcase exactly 3 guides");
  assert.equal(POPULAR_QUESTIONS.length, 12, "Homepage must list exactly 12 popular questions");
  assert.equal(homepageMapHrefs().length, 12, "Homepage must spotlight exactly 12 blank maps");

  const home = await page("/");
  assert.equal((home.match(/<h1[ >]/g) ?? []).length, 1, "Homepage needs exactly one H1");
  assert.ok(
    home.includes('id="home-tool-search"'),
    "Homepage hero needs a working tool search box",
  );

  // Popular hero tools resolve to live registry tools and are linked.
  for (const slug of POPULAR_SLUGS) {
    assert.ok(
      TOOLS.some((tool) => tool.slug === slug),
      `Popular slug ${slug} must exist in the registry`,
    );
    assert.ok(
      home.includes(`href="/tools/${slug}"`),
      `Homepage is missing popular tool ${slug}`,
    );
  }

  // Full directory: every category section exists and every tool is linked.
  assert.equal(CATEGORIES.length, 12, "Registry must define 12 categories");
  for (const category of CATEGORIES) {
    assert.ok(
      home.includes(`id="category-${category.id}"`),
      `Homepage is missing directory section ${category.id}`,
    );
    assert.ok(
      home.includes(`href="/tools/category/${category.id}"`),
      `Homepage is missing category hub link ${category.id}`,
    );
  }
  const homeToolLinks = toolSlugsIn(home);
  const missingTools = TOOLS.filter((tool) => !homeToolLinks.has(tool.slug)).map(
    (tool) => tool.slug,
  );
  assert.equal(
    missingTools.length,
    0,
    `Homepage directory is missing tools: ${missingTools.join(", ")}`,
  );

  // Blank-map spotlights resolve to live map pages.
  for (const href of homepageMapHrefs()) {
    assert.ok(home.includes(`href="${href}"`), `Homepage is missing map link ${href}`);
    await page(href);
  }

  // US-states strip: every state county page is linked and loads.
  assert.ok(home.includes('id="us-states"'), "Homepage needs the US-states section");
  for (const state of US_BLANK_MAP_STATES) {
    const href = `/states/${state.slug}/counties`;
    assert.ok(home.includes(`href="${href}"`), `Homepage is missing state link ${href}`);
  }
  for (const slug of ["california", "texas", "florida"]) {
    await page(`/states/${slug}/counties`);
  }
  await page("/states");

  // Studies, guides, popular questions, data sources, FAQ.
  for (const study of STUDIES.slice(0, 3)) {
    assert.ok(
      home.includes(`href="/studies/${study.slug}"`),
      `Homepage is missing study ${study.slug}`,
    );
  }
  for (const slug of HOMEPAGE_GUIDE_SLUGS) {
    assert.ok(home.includes(`href="/guides/${slug}"`), `Homepage is missing guide ${slug}`);
    await page(`/guides/${slug}`);
  }
  assert.ok(home.includes('id="popular-questions"'), "Homepage needs popular questions");
  for (const item of POPULAR_QUESTIONS) {
    assert.ok(
      home.includes(`href="${item.href}"`),
      `Homepage is missing popular question link ${item.href}`,
    );
  }
  assert.ok(home.includes('id="data-sources"'), "Homepage needs the data-sources section");
  const faqQuestions = (home.match(/<details/g) ?? []).length;
  assert.equal(faqQuestions, 8, "Homepage FAQ must contain 8 questions");

  // Complete directory coverage also holds outside the homepage: every tool
  // must remain discoverable via its canonical category hub.
  const covered = new Set<string>();
  for (const category of CATEGORIES) {
    const html = await page(`/tools/category/${category.id}`);
    assert.equal(
      (html.match(/<h1[ >]/g) ?? []).length,
      1,
      `Category ${category.id} needs exactly one H1`,
    );
    for (const slug of toolSlugsIn(html)) covered.add(slug);
  }
  const missingFromHubs = TOOLS.filter((tool) => !covered.has(tool.slug)).map(
    (tool) => tool.slug,
  );
  assert.equal(
    missingFromHubs.length,
    0,
    `Tools missing from every category hub: ${missingFromHubs.join(", ")}`,
  );

  // /tools directory keeps search-first layout and links the hubs.
  const directory = await page("/tools");
  assert.ok(
    directory.indexOf('id="search-directory"') !== -1 &&
      directory.indexOf('id="search-directory"') < directory.indexOf('id="tool-category-hubs"'),
    "Search must precede category guides on /tools",
  );

  // Spot-check a flagship tool page still renders with one H1 and canonical URL.
  const radius = await page("/tools/map-radius");
  assert.equal((radius.match(/<h1[ >]/g) ?? []).length, 1, "Tool page needs exactly one H1");
  assert.ok(
    radius.includes('rel="canonical" href="https://www.mapbench.site/tools/map-radius"'),
    "Tool page canonical URL must be preserved",
  );

  console.log(
    `PASS: full-directory homepage (${homeToolLinks.size}/${TOOLS.length} tools, ` +
      `${CATEGORIES.length} categories, ${POPULAR_SLUGS.length} popular, 12 map spotlights, ` +
      `${US_BLANK_MAP_STATES.length} states, 3 studies, 3 guides, 12 questions, 8 FAQs) + ` +
      `category-hub coverage (${covered.size}/${TOOLS.length}).`,
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
