import { bearingBetween, destination, distanceKm, midpoint, EARTH_R_KM, type LatLng } from "./geo";

/** A sampled local section of the spherical perpendicular bisector.
 * Map line segments interpolate between samples, so rendering is approximate. */
export function equidistanceArc(a: LatLng, b: LatLng): { mid: LatLng; distance: number; line: LatLng[] } | null {
  const distance = distanceKm(a, b);
  // Coincident and antipodal points do not have a unique midpoint/bisector.
  if (distance < 0.001 || Math.abs(distance - Math.PI * EARTH_R_KM) < 0.001) return null;
  const mid = midpoint(a, b);
  const bearing = (bearingBetween(mid, b) + 90) % 360;
  const halfLength = Math.min(5000, Math.max(10, distance * 0.75));
  const line: LatLng[] = [];
  for (let i = 0; i <= 80; i++) {
    const offset = halfLength * (i / 40 - 1);
    const p = destination(mid, offset < 0 ? (bearing + 180) % 360 : bearing, Math.abs(offset));
    // Keep adjacent coordinates continuous when the arc crosses the antimeridian.
    if (line.length) {
      while (p.lng - line[line.length - 1].lng > 180) p.lng -= 360;
      while (p.lng - line[line.length - 1].lng < -180) p.lng += 360;
    }
    line.push(p);
  }
  return { mid, distance, line };
}
