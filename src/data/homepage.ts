import type { CategoryId } from "@/lib/registry";

/**
 * Curated homepage selection. Single source of truth shared by the homepage
 * (`src/app/page.tsx`) and the homepage coverage test
 * (`scripts/check-redesign.ts`) so the two cannot drift apart.
 *
 * Rules:
 * - Exactly 8 popular tools.
 * - At most 3 featured categories, 4 tools each.
 * - Featured tools must not repeat popular-tools links.
 * - Every slug must exist in the tool registry.
 */

export const POPULAR_SLUGS: string[] = [
  "map-radius",
  "distance-between-two-places",
  "drive-time-map",
  "latitude-longitude-finder",
  "find-my-location",
  "csv-to-map",
  "elevation-finder",
  "sunrise-sunset-calculator",
];

export interface HomepageFeaturedSection {
  categoryId: CategoryId;
  heading: string;
  blurb: string;
  slugs: string[];
}

export const FEATURED_SECTIONS: HomepageFeaturedSection[] = [
  {
    categoryId: "location",
    heading: "Find places, addresses and boundaries",
    blurb:
      "Look up where any point falls — county, address or time zone — and convert between addresses and coordinates.",
    slugs: [
      "what-county-am-i-in",
      "reverse-geocoder",
      "address-to-coordinates",
      "coordinates-to-address",
    ],
  },
  {
    categoryId: "routing",
    heading: "Plan routes, drive time and trip cost",
    blurb:
      "Compare road distances, estimate arrival times and work out what a trip will cost before you leave.",
    slugs: [
      "driving-distance-calculator",
      "multi-stop-route-planner",
      "travel-time-estimator",
      "fuel-cost-calculator",
    ],
  },
  {
    categoryId: "files",
    heading: "Open and convert GPS and map files",
    blurb:
      "View tracks and waypoints from your devices, then convert them into the format your next tool needs.",
    slugs: [
      "gpx-viewer",
      "kml-viewer",
      "geojson-viewer",
      "gpx-to-csv-converter",
    ],
  },
];

/** Exactly three evergreen guides for the homepage. */
export const HOMEPAGE_GUIDE_SLUGS: string[] = [
  "understanding-gps-coordinates",
  "radius-vs-drive-time-vs-straight-line-distance",
  "kml-vs-geojson-vs-gpx",
];
