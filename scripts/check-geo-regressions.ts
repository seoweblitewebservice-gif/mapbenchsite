import assert from 'node:assert/strict';
import { distanceKm, destination, midpoint, bearingBetween, isValidLat, isValidLng, kmTo, toKm, EARTH_R_KM } from '../src/lib/geo';
import { latLngToUtm, utmToLatLng, encodePlusCode, decodePlusCode } from '../src/lib/coords';
const points = [
  { lat: 0, lng: 0 }, { lat: 28.6139, lng: 77.209 },
  { lat: -33.8688, lng: 151.2093 }, { lat: 51.5074, lng: -0.1278 },
  { lat: 40.7128, lng: -74.006 }, { lat: 0, lng: 179.9 },
];
function near(a: number, b: number, tolerance: number, label: string) {
  assert(Math.abs(a - b) <= tolerance, `${label}: ${a} != ${b}`);
}
let checks = 0;
for (const a of points) {
  near(distanceKm(a, a), 0, 1e-9, 'coincident points'); checks++;
  for (const b of points) {
    const d = distanceKm(a, b);
    near(d, distanceKm(b, a), 1e-8, 'distance symmetry'); checks++;
    if (d > 1e-8) {
      const m = midpoint(a, b);
      near(distanceKm(a, m), d / 2, 1e-6, 'halfway distance'); checks++;
      near(distanceKm(destination(a, bearingBetween(a, b), d), b), 0, 1e-6, 'destination round trip'); checks++;
    }
  }
  const utm = latLngToUtm(a); assert(utm);
  const decoded = utmToLatLng(utm); assert(decoded);
  near(distanceKm(a, decoded), 0, 0.002, 'UTM round trip'); checks++;
  const plus = decodePlusCode(encodePlusCode(a.lat, a.lng)); assert(plus);
  near(distanceKm(a, plus), 0, 0.02, 'plus-code round trip'); checks++;
}
near(distanceKm({lat:0,lng:179.9},{lat:0,lng:-179.9}), EARTH_R_KM * Math.PI / 900, 1e-6, 'antimeridian'); checks++;
for (const unit of ['km','mi','nmi'] as const) { near(toKm(kmTo(123.45, unit), unit), 123.45, 1e-10, 'unit round trip'); checks++; }
assert(!isValidLat(91) && !isValidLng(181) && !isValidLat(NaN)); checks++;
// Independent reference points and input rejection, beyond inverse round trips.
const central = utmToLatLng({ zone: 31, hemi: 'N', easting: 500000, northing: 0 });
assert(central); near(central.lat, 0, 1e-10, 'UTM equator'); near(central.lng, 3, 1e-10, 'zone central meridian'); checks += 2;
assert.equal(encodePlusCode(0, 0), '6FG22222+22'); checks++;
assert.equal(encodePlusCode(1, 180, 4), '62H20000+'); checks++;
assert.equal(encodePlusCode(71.301289, -127.202151, 15), 'C43J8Q2X+G49CW45'); checks++;
for (const length of [2, 4, 6, 8, 10, 11, 12, 13, 14, 15]) {
  const code = encodePlusCode(28.6139, 77.209, length);
  const centre = decodePlusCode(code); assert(centre);
  assert.equal(encodePlusCode(centre.lat, centre.lng, length), code); checks++;
}
assert.equal(decodePlusCode('CWC8+Q9'), null); checks++;
assert.equal(decodePlusCode('ZZZZZZZZ+ZZ'), null); checks++;
assert.equal(latLngToUtm({lat: 89, lng: 0}), null); checks++;
assert.equal(utmToLatLng({zone: 31.5, hemi:'N', easting:500000, northing:0}), null); checks++;
console.log(`PASS: ${checks} core calculation assertions. Does not cover every UI or third-party routing/geocoding service.`);
