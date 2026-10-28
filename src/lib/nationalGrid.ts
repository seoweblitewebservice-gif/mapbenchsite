// UK Ordnance Survey National Grid math.
//
// A direct port of the standard Ordnance Survey formulae (see "A Guide to
// Coordinate Systems in Great Britain"): a transverse Mercator projection on
// the Airy 1830 ellipsoid, as used for OSGB36 / the National Grid.
//
// Important: there is NO datum shift here. Latitude/longitude go in and out
// as if they were on the Airy ellipsoid, so converting a WGS84 point with
// these formulae alone can differ from a true OSGB36 position by up to
// about 100 m. That is fine for finding places, not for surveying.
// Postcode lookups may include National Grid eastings/northings from postcodes.io.
// These are representative postcode coordinates, not surveyed address positions.

import { toDeg, toRad, type LatLng } from "@/lib/geo";

// --- Projection constants (Airy 1830, National Grid) ---
export const NG_A = 6377563.396; // semi-major axis (m)
export const NG_B = 6356256.909; // semi-minor axis (m)
export const NG_F0 = 0.9996012717; // scale factor on the central meridian
export const NG_LAT0 = toRad(49); // true origin latitude
export const NG_LNG0 = toRad(-2); // true origin longitude (central meridian)
export const NG_N0 = -100000; // northing of true origin (m)
export const NG_E0 = 400000; // easting of true origin (m)

const e2 = 1 - (NG_B * NG_B) / (NG_A * NG_A); // eccentricity squared
const n = (NG_A - NG_B) / (NG_A + NG_B); // third flattening

/** Meridional arc (m) from the true origin to latitude `phi` (radians). */
function meridionalArc(phi: number): number {
  const dPhi = phi - NG_LAT0;
  const sPhi = phi + NG_LAT0;
  return (
    NG_B *
    NG_F0 *
    ((1 + n + (5 / 4) * n ** 2 + (5 / 4) * n ** 3) * dPhi -
      (3 * n + 3 * n ** 2 + (21 / 8) * n ** 3) * Math.sin(dPhi) * Math.cos(sPhi) +
      ((15 / 8) * n ** 2 + (15 / 8) * n ** 3) * Math.sin(2 * dPhi) * Math.cos(2 * sPhi) -
      ((35 / 24) * n ** 3) * Math.sin(3 * dPhi) * Math.cos(3 * sPhi))
  );
}

/** WGS84-style lat/lng -> National Grid easting/northing (metres). No datum shift. */
export function latLngToEN(p: LatLng): { easting: number; northing: number } {
  const phi = toRad(p.lat);
  const lam = toRad(p.lng);
  const dLam = lam - NG_LNG0;
  const sinPhi = Math.sin(phi);
  const cosPhi = Math.cos(phi);
  const tanPhi = Math.tan(phi);

  const nu = (NG_A * NG_F0) / Math.sqrt(1 - e2 * sinPhi * sinPhi);
  const rho = (NG_A * NG_F0 * (1 - e2)) / (1 - e2 * sinPhi * sinPhi) ** 1.5;
  const eta2 = nu / rho - 1;

  const M = meridionalArc(phi);
  const I = M + NG_N0;
  const II = (nu / 2) * sinPhi * cosPhi;
  const III = (nu / 24) * sinPhi * cosPhi ** 3 * (5 - tanPhi ** 2 + 9 * eta2);
  const IIIA = (nu / 720) * sinPhi * cosPhi ** 5 * (61 - 58 * tanPhi ** 2 + tanPhi ** 4);
  const IV = nu * cosPhi;
  const V = (nu / 6) * cosPhi ** 3 * (nu / rho - tanPhi ** 2);
  const VI =
    (nu / 120) *
    cosPhi ** 5 *
    (5 - 18 * tanPhi ** 2 + tanPhi ** 4 + 14 * eta2 - 58 * eta2 * tanPhi ** 2);

  const northing = I + II * dLam ** 2 + III * dLam ** 4 + IIIA * dLam ** 6;
  const easting = NG_E0 + IV * dLam + V * dLam ** 3 + VI * dLam ** 5;
  return { easting, northing };
}

/** National Grid easting/northing (metres) -> lat/lng. No datum shift. */
export function enToLatLng(easting: number, northing: number): LatLng {
  // Initial latitude estimate, refined against the meridional arc.
  let phi = (northing - NG_N0) / (NG_A * NG_F0) + NG_LAT0;
  let M = meridionalArc(phi);
  let guard = 0;
  while (Math.abs(northing - NG_N0 - M) >= 0.00001 && guard < 20) {
    phi += (northing - NG_N0 - M) / (NG_A * NG_F0);
    M = meridionalArc(phi);
    guard++;
  }

  const sinPhi = Math.sin(phi);
  const tanPhi = Math.tan(phi);
  const secPhi = 1 / Math.cos(phi);
  const nu = (NG_A * NG_F0) / Math.sqrt(1 - e2 * sinPhi * sinPhi);
  const rho = (NG_A * NG_F0 * (1 - e2)) / (1 - e2 * sinPhi * sinPhi) ** 1.5;
  const eta2 = nu / rho - 1;

  const VII = tanPhi / (2 * rho * nu);
  const VIII =
    (tanPhi / (24 * rho * nu ** 3)) * (5 + 3 * tanPhi ** 2 + eta2 - 9 * tanPhi ** 2 * eta2);
  const IX = (tanPhi / (720 * rho * nu ** 5)) * (61 + 90 * tanPhi ** 2 + 45 * tanPhi ** 4);
  const X = secPhi / nu;
  const XI = (secPhi / (6 * nu ** 3)) * (nu / rho + 2 * tanPhi ** 2);
  const XII = (secPhi / (120 * nu ** 5)) * (5 + 28 * tanPhi ** 2 + 24 * tanPhi ** 4);
  const XIIA =
    (secPhi / (5040 * nu ** 7)) *
    (61 + 662 * tanPhi ** 2 + 1320 * tanPhi ** 4 + 720 * tanPhi ** 6);

  const dE = easting - NG_E0;
  const lat = phi - VII * dE ** 2 + VIII * dE ** 4 - IX * dE ** 6;
  const lng = NG_LNG0 + X * dE - XI * dE ** 3 + XII * dE ** 5 - XIIA * dE ** 7;
  return { lat: toDeg(lat), lng: toDeg(lng) };
}

// --- Grid references ---

// 100 km square letters inside each 500 km square, A-Z skipping "I".
const SQUARE_LETTERS = "ABCDEFGHJKLMNOPQRSTUVWXYZ";

// First letter -> [easting block, northing block] in 500 km units.
const FIRST_LETTER_BLOCKS: Record<string, [number, number]> = {
  S: [0, 0],
  T: [1, 0],
  N: [0, 1],
  O: [1, 1],
  H: [0, 2],
  J: [1, 2],
};
const BLOCK_FIRST_LETTERS: Record<string, string> = Object.fromEntries(
  Object.entries(FIRST_LETTER_BLOCKS).map(([letter, [e, nn]]) => [`${e},${nn}`, letter]),
);

/**
 * Easting/northing -> grid reference, e.g. "TQ 300 800".
 * `digits` is the TOTAL number of digits (both axes together):
 * 0 = letters only, 2 = 1 figure per axis (10 km), 4 = 2 figures (1 km),
 * 6 = 3 figures (100 m), 8 = 4 figures (10 m), 10 = 5 figures (1 m).
 */
export function enToGridRef(easting: number, northing: number, digits = 6): string {
  if (
    !Number.isFinite(easting) ||
    !Number.isFinite(northing) ||
    easting < 0 ||
    easting >= 700000 ||
    northing < 0 ||
    northing >= 1300000
  ) {
    return "Outside the National Grid";
  }
  const e500 = Math.floor(easting / 500000);
  const n500 = Math.floor(northing / 500000);
  const first = BLOCK_FIRST_LETTERS[`${e500},${n500}`];
  if (!first) return "Outside the National Grid";

  const eRem = Math.floor(easting / 100000) % 5;
  const nRem = Math.floor(northing / 100000) % 5;
  const second = SQUARE_LETTERS[(4 - nRem) * 5 + eRem];
  const letters = `${first}${second}`;

  const clean = [0, 2, 4, 6, 8, 10].includes(digits) ? digits : 6;
  if (clean === 0) return letters;
  const perAxis = clean / 2;
  const factor = 10 ** (5 - perAxis);
  const ePart = String(Math.floor((easting % 100000) / factor)).padStart(perAxis, "0");
  const nPart = String(Math.floor((northing % 100000) / factor)).padStart(perAxis, "0");
  return `${letters} ${ePart} ${nPart}`;
}

/**
 * Grid reference -> easting/northing of the square's SOUTH-WEST corner.
 * Accepts "TQ300800", "TQ 300 800", "SU 123 456", letters-only, etc.
 * Returns null when the reference cannot be parsed.
 * Callers that want the centre of the referenced square should add half
 * the cell size (10^(5 - digitsPerAxis) / 2 metres) to both values.
 */
export function gridRefToEN(ref: string): { easting: number; northing: number } | null {
  const clean = ref.trim().toUpperCase().replace(/\s+/g, "");
  const m = clean.match(/^([A-Z]{2})(\d*)$/);
  if (!m) return null;
  const [, letters, digitsStr] = m;
  if (digitsStr.length % 2 !== 0 || digitsStr.length > 10) return null;

  const block = FIRST_LETTER_BLOCKS[letters[0]];
  if (!block) return null;
  const secondIdx = SQUARE_LETTERS.indexOf(letters[1]);
  if (secondIdx < 0) return null; // also rejects "I", which is never used

  const eRem = secondIdx % 5;
  const nRem = 4 - Math.floor(secondIdx / 5);
  let easting = (block[0] * 5 + eRem) * 100000;
  let northing = (block[1] * 5 + nRem) * 100000;

  if (digitsStr.length > 0) {
    const perAxis = digitsStr.length / 2;
    const factor = 10 ** (5 - perAxis);
    easting += parseInt(digitsStr.slice(0, perAxis), 10) * factor;
    northing += parseInt(digitsStr.slice(perAxis), 10) * factor;
  }
  if (easting >= 700000 || northing >= 1300000) return null;
  return { easting, northing };
}

// --- UK postcodes (postcodes.io, built on Ordnance Survey open data) ---

export interface UkPostcode {
  postcode: string;
  lat: number;
  lng: number;
  easting: number;
  northing: number;
  district: string;
  region: string;
  country: string;
}

function numberOrNaN(value: unknown): number {
  if (value === null || value === undefined || value === "") return NaN;
  return Number(value);
}

function mapPostcode(r: any): UkPostcode {
  return {
    postcode: String(r?.postcode ?? ""),
    lat: numberOrNaN(r?.latitude),
    lng: numberOrNaN(r?.longitude),
    easting: numberOrNaN(r?.eastings),
    northing: numberOrNaN(r?.northings),
    district: String(r?.admin_district ?? ""),
    region: String(r?.region ?? ""),
    country: String(r?.country ?? ""),
  };
}

/** Look up one UK postcode. Throws an Error with a clear message on failure. */
export async function ukPostcode(code: string): Promise<UkPostcode> {
  const clean = code.trim();
  if (!clean) throw new Error("Enter a UK postcode first.");
  let res: Response;
  try {
    res = await fetch(`https://api.postcodes.io/postcodes/${encodeURIComponent(clean)}`);
  } catch {
    throw new Error("Could not reach the postcode lookup service. Check your connection and try again.");
  }
  const data: any = await res.json().catch(() => null);
  if (!res.ok || !data?.result) {
    throw new Error(`Postcode "${clean.toUpperCase()}" was not found. Check it and try again.`);
  }
  const pc = mapPostcode(data.result);
  if (!Number.isFinite(pc.lat) || !Number.isFinite(pc.lng)) {
    throw new Error(`Postcode "${clean.toUpperCase()}" has no mapped location.`);
  }
  return pc;
}

/** Nearest UK postcodes to a point, closest first. */
export async function ukNearestPostcodes(lat: number, lng: number, limit = 10): Promise<UkPostcode[]> {
  let res: Response;
  try {
    // widesearch=true: the default search radius is only ~100 m, which finds
    // nothing in rural areas; this widens it so nearby villages still return.
    res = await fetch(
      `https://api.postcodes.io/postcodes?lon=${encodeURIComponent(lng)}&lat=${encodeURIComponent(lat)}&limit=${encodeURIComponent(limit)}&widesearch=true`,
    );
  } catch {
    throw new Error("Could not reach the postcode lookup service. Check your connection and try again.");
  }
  const data: any = await res.json().catch(() => null);
  if (!res.ok || !Array.isArray(data?.result)) {
    throw new Error("No postcodes were found near that point.");
  }
  return (data.result as any[]).map(mapPostcode).filter((p) => Number.isFinite(p.lat) && Number.isFinite(p.lng));
}
