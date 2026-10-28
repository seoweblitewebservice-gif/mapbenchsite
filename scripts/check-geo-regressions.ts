import { equidistanceArc } from "../src/lib/equidistance";
import assert from 'node:assert/strict';
import { encodeGeohash, decodeGeohash } from '../src/lib/geohash';
import { encodeMaidenhead, decodeMaidenhead } from '../src/lib/maidenhead';
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

assert.equal(encodeGeohash(57.64911, 10.40744, 11), 'u4pruydqqvj');
const hashCentre = decodeGeohash('u4pruydqqvj'); assert(hashCentre);
assert.equal(encodeGeohash(hashCentre.lat, hashCentre.lng, 11), 'u4pruydqqvj');
assert.equal(decodeGeohash('invalid!'), null);
assert.equal(decodeGeohash('u4pruydqqvju4'), null);
console.log('PASS: geohash reference, cell-centre round trip and input validation.');

assert.equal(encodeMaidenhead(0, 0, 6), 'JJ00AA');
assert.equal(encodeMaidenhead(40.7128, -74.006, 4), 'FN20');
for (const point of points) for (const length of [2, 4, 6, 8]) {
  const code = encodeMaidenhead(point.lat, point.lng, length); assert(code);
  const cell = decodeMaidenhead(code); assert(cell);
  assert.equal(encodeMaidenhead(cell.center.lat, cell.center.lng, length), code);
  assert(point.lng >= cell.bounds[0] && point.lng <= cell.bounds[2]);
  assert(point.lat >= cell.bounds[1] && point.lat <= cell.bounds[3]);
}
assert.equal(decodeMaidenhead('ZZ12'), null);
assert.equal(decodeMaidenhead('FN3'), null);
assert.equal(encodeMaidenhead(91, 0), null);
console.log('PASS: Maidenhead reference squares, cell boundaries and input validation.');

for (const [a, b] of [[{lat: 40.7128, lng: -74.006}, {lat: 51.5074, lng: -0.1278}], [{lat: 10, lng: 179}, {lat: -10, lng: -170}]]) {
  const arc = equidistanceArc(a, b); assert(arc);
  for (const p of arc.line) assert(Math.abs(distanceKm(a, p) - distanceKm(b, p)) < 1e-6);
}
assert.equal(equidistanceArc({lat: 0, lng: 0}, {lat: 0, lng: 0}), null);
assert.equal(equidistanceArc({lat: 0, lng: 0}, {lat: 0, lng: 180}), null);
console.log('PASS: spherical equidistance samples and degenerate inputs.');

// Exercise postcode provider mapping with missing values without using the network.
async function postcodeRegression() {
  const { ukPostcode, gridRefToEN, enToGridRef } = await import('../src/lib/nationalGrid');
  assert.equal(gridRefToEN('JA'), null); // outside the supported GB grid extent
  assert.deepEqual(gridRefToEN('TQ 300 800'), { easting: 530000, northing: 180000 });
  assert.equal(enToGridRef(530000, 180000, 6), 'TQ 300 800');
  const original = globalThis.fetch;
  try {
    globalThis.fetch = async () => new Response(JSON.stringify({ result: { postcode: 'BT1 1AA', latitude: 54.6, longitude: -5.9, eastings: null, northings: null, country: 'Northern Ireland' } }), { status: 200 });
    const postcode = await ukPostcode('BT1 1AA');
    assert(Number.isNaN(postcode.easting) && Number.isNaN(postcode.northing));
    globalThis.fetch = async () => new Response(JSON.stringify({ result: { postcode: 'TEST', latitude: null, longitude: null } }), { status: 200 });
    await assert.rejects(ukPostcode('TEST'), /no mapped location/);
  } finally { globalThis.fetch = original; }
  console.log('PASS: grid extent and postcode missing-coordinate handling.');
}
postcodeRegression().catch((error) => { console.error(error); process.exitCode = 1; });

// Incomplete weather series must not be silently interpreted as dry days.
import { sumArchiveDaily } from '../src/lib/archiveTotals';
assert.equal(sumArchiveDaily([0, 2.5, 1], 3), 3.5);
assert.equal(sumArchiveDaily([0, null, 1], 3), null);
assert.equal(sumArchiveDaily([], 3), null);
assert.equal(sumArchiveDaily([1, NaN, 0], 3), null);
console.log('PASS: archive daily totals reject missing or invalid days.');

import { geojsonLineLengthKm } from '../src/lib/geojsonLineLength';
const multiLine: GeoJSON.FeatureCollection = { type: 'FeatureCollection', features: [{ type:'Feature', properties:{}, geometry: { type:'GeometryCollection', geometries:[{type:'MultiLineString',coordinates:[[[0,0],[1,0]],[[10,0],[11,0]]]},{type:'Polygon',coordinates:[[[0,0],[1,0],[0,1],[0,0]]]}] } }] };
near(geojsonLineLengthKm(multiLine), 2 * distanceKm({lat:0,lng:0},{lat:0,lng:1}), 1e-9, 'separate GeoJSON lines');
console.log('PASS: KML/GeoJSON line-length handling for separate segments.');

import { geojsonToGpx } from '../src/lib/formats';
const photoFc: GeoJSON.FeatureCollection = { type: 'FeatureCollection', features: [{ type:'Feature', properties:{ name:'Photo & trail', time:'2025-01-01T12:00:00Z' }, geometry:{type:'Point', coordinates:[1,2]} }] };
const sampleGpx = geojsonToGpx(photoFc);
assert(sampleGpx.includes('<name>Photo &amp; trail</name>'));
assert(sampleGpx.includes('<time>2025-01-01T12:00:00.000Z</time>'));
console.log('PASS: GPX export preserves waypoint name and valid time.');

// Separate GPX line segments and missing elevation must not create profile strokes across gaps.
import { buildElevationProfile } from '../src/lib/gpxProfile';
const profile = buildElevationProfile({type:'FeatureCollection', features:[{type:'Feature', properties:{}, geometry:{type:'MultiLineString', coordinates:[[[0,0,10],[0.01,0,20],[0.02,0],[0.03,0,30],[0.04,0,40]],[[10,10,50],[10.01,10,60]]]}}]});
assert(profile && profile.length === 3);
near(profile[2][0].dist, profile[1][1].dist, 1e-9, 'no profile distance between segments');
assert(profile[0][1].dist < profile[1][0].dist);
console.log('PASS: GPX elevation profile uses distance and breaks at gaps and segments.');

import { airportRouteGraph, airportConnections, sphericalPolygonAreaKm2 } from '../src/lib/mapToolData';
const routes = airportRouteGraph('X,1,AAA,1,BBB,2\nX,1,BBB,2,CCC,3');
assert.deepEqual(airportConnections(routes, '1', '3'), ['2']);
assert.equal(routes.get('2')?.has('1'), false);
assert.deepEqual(airportConnections(routes, '3', '1'), []);
const outer = [[0,0],[2,0],[2,2],[0,2],[0,0]], hole = [[0.5,0.5],[1.5,0.5],[1.5,1.5],[0.5,1.5],[0.5,0.5]];
assert(sphericalPolygonAreaKm2([outer, hole]) < sphericalPolygonAreaKm2([outer]));
near(sphericalPolygonAreaKm2([[[179,0],[-179,0],[-179,1],[179,1],[179,0]]]), sphericalPolygonAreaKm2([[[0,0],[2,0],[2,1],[0,1],[0,0]]]), 1e-6, 'antimeridian polygon');
console.log('PASS: airport directionality and approximate polygon area with holes and antimeridian.');

import { geojsonToKml } from '../src/lib/formats';
const multipartFc: GeoJSON.FeatureCollection = {type:'FeatureCollection',features:[{type:'Feature',properties:{},geometry:{type:'MultiPolygon',coordinates:[[[[0,0],[1,0],[1,1],[0,0]]],[[[2,0],[3,0],[3,1],[2,0]]]]}}]};
const multipartKml = geojsonToKml(multipartFc);
assert.match(multipartKml, /<MultiGeometry><Polygon>/);
assert.match(multipartKml, /<\/Polygon><\/MultiGeometry>/);
console.log('PASS: KML multipart geometries are wrapped in MultiGeometry.');

import { csvPointFeatures } from '../src/lib/spatialCsv';
const csvPoints = csvPointFeatures('name,latitude,longitude\r\n"A, B",10,20\r\n"two\nlines",-5,30\r\nmissing,,20\r\ninvalid,91,0\r\n');
assert.equal(csvPoints.features.length, 2);
assert.equal(csvPoints.features[0].properties?.name, 'A, B');
assert.equal(csvPoints.features[1].properties?.name, 'two\nlines');
assert.throws(() => csvPointFeatures('latitude,longitude\n"10,20'));
console.log('PASS: spatial CSV quoted fields, missing and out-of-range coordinates.');
