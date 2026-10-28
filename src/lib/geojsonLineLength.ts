import { distanceKm, isValidLat, isValidLng } from './geo';

/** Sum spherical distances within LineStrings only; separate lines are not joined. */
export function geojsonLineLengthKm(fc: GeoJSON.FeatureCollection): number {
  let total = 0;
  const line = (coords: GeoJSON.Position[]) => {
    let prev: { lat: number; lng: number } | null = null;
    for (const c of coords) {
      const p = { lng: c[0], lat: c[1] };
      if (!isValidLat(p.lat) || !isValidLng(p.lng)) { prev = null; continue; }
      if (prev) total += distanceKm(prev, p);
      prev = p;
    }
  };
  const visit = (g: GeoJSON.Geometry | null) => {
    if (!g) return;
    if (g.type === 'LineString') line(g.coordinates);
    else if (g.type === 'MultiLineString') g.coordinates.forEach(line);
    else if (g.type === 'GeometryCollection') g.geometries.forEach(visit);
  };
  fc.features.forEach(f => visit(f.geometry));
  return total;
}
