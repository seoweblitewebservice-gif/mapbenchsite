/**
 * Keyword ownership map for the cannibalization audit.
 *
 * The linking plan's first rule is "one search intent = one page". The tool
 * content files each declare a primary keyword; the guide and best-of datasets
 * declare theirs; this file declares the owned secondary terms so the audit can
 * prove that no keyword is claimed by two different URLs.
 *
 * When a duplicate is found the audit fails and prints both URLs. The fix is
 * either to merge the pages or to move the term to a different page — not to
 * add the duplicate to an exclusion list.
 */

/**
 * Pairs where two tools legitimately describe the same underlying idea but
 * answer different questions. The audit reports them and asserts that each
 * page carries an explicit link to the other, so a reader (and a crawler) is
 * sent to the right one instead of seeing two competing pages.
 */
export const CANNIBAL_PAIRS: { a: string; b: string; reason: string }[] = [
  {
    a: "reverse-geocoder",
    b: "coordinates-to-address",
    reason: "Both turn coordinates into an address; the reverse geocoder is the search-driven tool, the other is the paste-driven output page.",
  },
  {
    a: "timezone-converter",
    b: "time-zone-converter",
    reason: "Two converters for one query; the world time zone map should own the map view and one converter should own the conversion.",
  },
  {
    a: "distance-between-cities",
    b: "city-comparison-tool",
    reason: "City comparison uses distance between cities as one of its inputs.",
  },
  {
    a: "buffer-zone-map",
    b: "spatial-buffer-overlay-analyzer",
    reason: "A drawn buffer and an uploaded-geometry overlay answer the same question with different inputs.",
  },
  {
    a: "air-pressure-by-elevation",
    b: "pressure-altitude-calculator",
    reason: "The same atmospheric relationship, read forwards and backwards.",
  },
  {
    a: "area-code-finder",
    b: "phone-area-code-map",
    reason: "Point lookup versus map overview of telephone area codes.",
  },
  {
    a: "slope-grade-calculator",
    b: "slope-gradient-calculator",
    reason: "Naming collision: grade (rise over run, percent) and gradient (rise over run, ratio or degrees) share a term.",
  },
  {
    a: "drive-time-map",
    b: "isochrone-map",
    reason: "An isochrone is the general term; the drive time map is the driving-specific tool.",
  },
  {
    a: "map-area-calculator",
    b: "geojson-area-calculator",
    reason: "Drawing an area on a map versus measuring an uploaded file must stay separate pages with different inputs.",
  },
  {
    a: "timezone-map-finder",
    b: "world-time-zone-map",
    reason: "Find the zone at a point versus see all zones at once.",
  },
];
