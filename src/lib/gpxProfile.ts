import { distanceKm, isValidLat, isValidLng } from './geo';

/** Build separate profile strokes; never add a distance across distinct lines or missing coordinates. */
export function buildElevationProfile(fc: GeoJSON.FeatureCollection): { dist: number; ele: number }[][] | null {
  const segments: { dist: number; ele: number }[][] = [];
  let dist = 0;
  const line = (coords: GeoJSON.Position[]) => {
    let prev: { lat: number; lng: number } | null = null;
    let stroke: { dist: number; ele: number }[] = [];
    const finish = () => { if (stroke.length > 1) segments.push(stroke); stroke = []; };
    for (const c of coords) {
      const p = { lng: c[0], lat: c[1] };
      if (!isValidLat(p.lat) || !isValidLng(p.lng)) { finish(); prev = null; continue; }
      if (prev) dist += distanceKm(prev, p);
      prev = p;
      if (Number.isFinite(c[2])) stroke.push({ dist, ele: c[2] });
      else finish();
    }
    finish();
  };
  for (const f of fc.features) {
    const g = f.geometry;
    if (g?.type === 'LineString') line(g.coordinates);
    else if (g?.type === 'MultiLineString') g.coordinates.forEach(line);
  }
  // Limit points per stroke without joining disconnected strokes.
  const count = segments.reduce((n, s) => n + s.length, 0);
  const step = Math.max(1, Math.ceil(count / 400));
  return segments.length ? segments.map(s => s.filter((_, i) => i === 0 || i === s.length - 1 || i % step === 0)) : null;
}
