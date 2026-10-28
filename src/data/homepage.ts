/**
 * Curated homepage selections. Single source of truth shared by the homepage
 * (`src/app/page.tsx`) and the homepage coverage test
 * (`scripts/check-redesign.ts`) so the two cannot drift apart.
 *
 * The homepage lists the full tool directory (all registry tools,
 * category-wise) plus spotlight links below. Every slug/href here must
 * resolve to a live page.
 */

/** Four starter tools shown as cards in the hero. */
export const POPULAR_SLUGS: string[] = [
  "halfway-between-two-places",
  "map-radius",
  "elevation-finder",
  "timezone-map-finder",
];

/** Exactly three evergreen guides for the homepage. */
export const HOMEPAGE_GUIDE_SLUGS: string[] = [
  "understanding-gps-coordinates",
  "radius-vs-drive-time-vs-straight-line-distance",
  "kml-vs-geojson-vs-gpx",
];

/** US state blank-map spotlights (slugs in US_BLANK_MAP_STATES). */
export const HOMEPAGE_STATE_MAP_SLUGS: string[] = [
  "california",
  "texas",
  "florida",
  "new-york",
  "pennsylvania",
  "illinois",
];

/** Country blank-map spotlights (slugs in the world-atlas country set). */
export const HOMEPAGE_COUNTRY_MAPS: { name: string; slug: string }[] = [
  { name: "France", slug: "france" },
  { name: "Germany", slug: "germany" },
  { name: "Japan", slug: "japan" },
  { name: "India", slug: "india" },
  { name: "Australia", slug: "australia" },
  { name: "United Kingdom", slug: "united-kingdom" },
];

export function homepageMapHrefs(): string[] {
  return [
    ...HOMEPAGE_STATE_MAP_SLUGS.map((slug) => `/maps/blank/us/${slug}`),
    ...HOMEPAGE_COUNTRY_MAPS.map((country) => `/maps/blank/${country.slug}`),
  ];
}

export interface PopularQuestion {
  question: string;
  href: string;
}

/** Question-style shortcuts to popular tools and maps. */
export const POPULAR_QUESTIONS: PopularQuestion[] = [
  { question: "Which county am I standing in?", href: "/tools/what-county-am-i-in" },
  { question: "How far can I drive in 30 minutes?", href: "/tools/drive-time-map" },
  { question: "What's the elevation right here?", href: "/tools/elevation-finder" },
  { question: "Which ZIP codes are within 50 miles?", href: "/tools/zip-codes-within-radius" },
  { question: "How far apart are two places?", href: "/tools/distance-between-two-places" },
  { question: "Which time zone is this place in?", href: "/tools/what-timezone-am-i-in" },
  { question: "Draw a fixed-radius circle on a map", href: "/tools/map-radius" },
  { question: "What are my exact coordinates?", href: "/tools/latitude-longitude-finder" },
  { question: "Which cities are within 100 miles?", href: "/tools/cities-within-radius" },
  { question: "How many people live within this radius?", href: "/tools/population-within-radius" },
  { question: "Printable blank map of Texas", href: "/maps/blank/us/texas" },
  { question: "Printable blank map of India", href: "/maps/blank/india" },
];
