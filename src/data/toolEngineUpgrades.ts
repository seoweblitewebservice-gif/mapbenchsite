/** Legacy URLs now use the existing engine that actually fulfils their intent.
 * Only the implementation fields are inherited; names, slugs and categories stay. */
export const TOOL_ENGINE_UPGRADES: Record<string, string> = {
  "true-north-vs-magnetic": "magnetic-declination",
  "center-of-polygon": "polygon-centroid-from-coordinates",
  "random-point-generator": "random-location-generator",
  "school-district-context": "census-geography-finder",
  "congressional-district-context": "census-geography-finder",
  "embed-map-link-helper": "google-maps-embed-code-generator",
};
