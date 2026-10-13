import { feature } from "topojson-client";
import { geoArea, geoBounds, geoCentroid } from "d3-geo";
import countriesTopo from "world-atlas/countries-110m.json";

const EARTH_SURFACE_KM2 = 510072000;

type CountryFeature = GeoJSON.Feature<GeoJSON.Geometry, { name?: string }>;

const world = feature(
  countriesTopo as any,
  (countriesTopo as any).objects.countries,
) as unknown as GeoJSON.FeatureCollection<GeoJSON.Geometry, { name?: string }>;

const countries = world.features.filter((f): f is CountryFeature => Boolean(f.properties?.name));

export interface CountryGeometryRow {
  name: string;
  areaKm2: number;
  centroidLat: number;
  centroidLon: number;
  west: number;
  south: number;
  east: number;
  north: number;
  latSpan: number;
  lonSpan: number;
}

export function countryGeometryRows(): CountryGeometryRow[] {
  return countries.map((country) => {
    const [[west, south], [east, north]] = geoBounds(country);
    const [centroidLon, centroidLat] = geoCentroid(country);
    let lonSpan = east - west;
    if (lonSpan < 0) lonSpan += 360;
    return {
      name: country.properties!.name!,
      areaKm2: (geoArea(country) / (4 * Math.PI)) * EARTH_SURFACE_KM2,
      centroidLat,
      centroidLon,
      west,
      south,
      east,
      north,
      latSpan: north - south,
      lonSpan,
    };
  });
}

export function largestCountryGeometryRows(limit = 25) {
  return countryGeometryRows().sort((a, b) => b.areaKm2 - a.areaKm2).slice(0, limit);
}

export function widestLongitudeCountryRows(limit = 25) {
  return countryGeometryRows()
    .filter((row) => row.lonSpan <= 180)
    .sort((a, b) => b.lonSpan - a.lonSpan)
    .slice(0, limit);
}

export function northernCentroidCountryRows(limit = 25) {
  return countryGeometryRows().sort((a, b) => b.centroidLat - a.centroidLat).slice(0, limit);
}

export function countryStudyExport(slug: string) {
  switch (slug) {
    case "largest-country-geometries":
      return {
        headers: ["rank", "country", "geometry_area_km2", "centroid_lat", "centroid_lon"],
        rows: largestCountryGeometryRows(200).map((r, i) => [i + 1, r.name, Math.round(r.areaKm2), r.centroidLat.toFixed(4), r.centroidLon.toFixed(4)]),
      };
    case "widest-country-longitude-spans":
      return {
        headers: ["rank", "country", "longitude_span_degrees", "west", "east", "centroid_lat"],
        rows: widestLongitudeCountryRows(200).map((r, i) => [i + 1, r.name, r.lonSpan.toFixed(2), r.west.toFixed(2), r.east.toFixed(2), r.centroidLat.toFixed(2)]),
      };
    case "northernmost-country-centroids":
      return {
        headers: ["rank", "country", "centroid_lat", "centroid_lon", "latitude_span_degrees"],
        rows: northernCentroidCountryRows(200).map((r, i) => [i + 1, r.name, r.centroidLat.toFixed(4), r.centroidLon.toFixed(4), r.latSpan.toFixed(2)]),
      };
    default:
      return null;
  }
}
