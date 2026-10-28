/**
 * Curated-homepage + complete-directory coverage test.
 * Run with the preview server running: npx tsx scripts/check-redesign.ts
 * (or: npm run test:homepage, with PREVIEW_ORIGIN pointing at the server)
 *
 * Replaces the old assertion that the homepage must link all tools. The
 * homepage is now a curated entry point; the complete directory lives at
 * /tools and across the 12 canonical category hubs.
 */
import assert from "node:assert/strict";
import { CATEGORIES, TOOLS } from "../src/lib/registry";
import {
  FEATURED_SECTIONS,
  HOMEPAGE_GUIDE_SLUGS,
  POPULAR_SLUGS,
} from "../src/data/homepage";
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
  // ---- Curated homepage structure ----
  assert.equal(POPULAR_SLUGS.length, 8, "Homepage must feature exactly 8 popular tools");
  assert.ok(
    FEATURED_SECTIONS.length <= 3,
    "Homepage must have at most 3 featured category sections",
  );
  for (const section of FEATURED_SECTIONS) {
    assert.equal(
      section.slugs.length,
      4,
      `Featured section ${section.categoryId} must list exactly 4 tools`,
    );
    for (const slug of section.slugs) {
      assert.ok(
        !POPULAR_SLUGS.includes(slug),
        `Featured tool ${slug} must not repeat a popular-tools link`,
      );
    }
  }

  const home = await page("/");
  assert.equal((home.match(/<h1[ >]/g) ?? []).length, 1, "Homepage needs exactly one H1");
  assert.ok(
    home.includes('id="home-tool-search"'),
    "Homepage hero needs a working tool search box",
  );

  // Popular + featured selections resolve to live registry tools and are linked.
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
  for (const section of FEATURED_SECTIONS) {
    assert.ok(
      CATEGORIES.some((category) => category.id === section.categoryId),
      `Featured category ${section.categoryId} must exist`,
    );
    for (const slug of section.slugs) {
      assert.ok(
        TOOLS.some((tool) => tool.slug === slug),
        `Featured slug ${slug} must exist in the registry`,
      );
      assert.ok(
        home.includes(`href="/tools/${slug}"`),
        `Homepage is missing featured tool ${slug}`,
      );
    }
  }

  // All 12 category hubs are linked from the homepage with live canonical URLs.
  assert.equal(CATEGORIES.length, 12, "Registry must define 12 categories");
  for (const category of CATEGORIES) {
    assert.ok(
      home.includes(`href="/tools/category/${category.id}"`),
      `Homepage is missing category link ${category.id}`,
    );
  }

  // Exactly 3 guides and 3 studies are showcased.
  assert.equal(HOMEPAGE_GUIDE_SLUGS.length, 3, "Homepage must showcase exactly 3 guides");
  for (const slug of HOMEPAGE_GUIDE_SLUGS) {
    assert.ok(home.includes(`href="/guides/${slug}"`), `Homepage is missing guide ${slug}`);
  }
  for (const study of STUDIES.slice(0, 3)) {
    assert.ok(
      home.includes(`href="/studies/${study.slug}"`),
      `Homepage is missing study ${study.slug}`,
    );
  }

  // Curated, not exhaustive: the homepage must NOT carry the full directory.
  const homeToolLinks = toolSlugsIn(home);
  assert.ok(
    homeToolLinks.size < TOOLS.length,
    `Homepage should be curated, but links ${homeToolLinks.size}/${TOOLS.length} tools`,
  );
  assert.ok(
    homeToolLinks.size >= POPULAR_SLUGS.length + FEATURED_SECTIONS.flatMap((s) => s.slugs).length,
    "Homepage is missing curated tool links",
  );

  // ---- Complete directory coverage (outside the homepage) ----
  // Every registry tool must remain discoverable via its canonical category hub.
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
  const missing = TOOLS.filter((tool) => !covered.has(tool.slug)).map((tool) => tool.slug);
  assert.equal(
    missing.length,
    0,
    `Tools missing from every category hub: ${missing.join(", ")}`,
  );

  // /tools directory keeps search-first layout and links the hubs.
  const directory = await page("/tools");
  assert.ok(
    directory.indexOf('id="search-directory"') !== -1 &&
      directory.indexOf('id="search-directory"') < directory.indexOf('id="tool-category-hubs"'),
    "Search must precede category guides on /tools",
  );
  for (const category of CATEGORIES) {
    assert.ok(
      directory.includes(`href="/tools/category/${category.id}"`),
      `/tools is missing category hub link ${category.id}`,
    );
  }

  // Spot-check a flagship tool page still renders with one H1 and canonical URL.
  const radius = await page("/tools/map-radius");
  assert.equal((radius.match(/<h1[ >]/g) ?? []).length, 1, "Tool page needs exactly one H1");
  assert.ok(
    radius.includes('rel="canonical" href="https://www.mapbench.site/tools/map-radius"'),
    "Tool page canonical URL must be preserved",
  );

  console.log(
    `PASS: curated homepage (${POPULAR_SLUGS.length} popular + ` +
      `${FEATURED_SECTIONS.flatMap((s) => s.slugs).length} featured links, ` +
      `${CATEGORIES.length} category hubs, 3 guides, 3 studies) + complete ` +
      `directory coverage (${covered.size}/${TOOLS.length} tools via category hubs).`,
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
