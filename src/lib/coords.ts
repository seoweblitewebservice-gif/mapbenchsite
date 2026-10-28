// Coordinate format conversions: DMS, UTM, MGRS, Open Location Code (Plus Codes).
import { type LatLng, isValidLat, isValidLng, normLng } from "./geo";

// ---------- DMS ----------
export function decToDmsParts(dec: number) {
  const abs = Math.abs(dec);
  const d = Math.floor(abs);
  const mFloat = (abs - d) * 60;
  const m = Math.floor(mFloat);
  const s = (mFloat - m) * 60;
  return { d, m, s: Math.round(s * 100) / 100 };
}

export function formatDms(dec: number, axis: "lat" | "lng") {
  const { d, m, s } = decToDmsParts(dec);
  const h = axis === "lat" ? (dec >= 0 ? "N" : "S") : (dec >= 0 ? "E" : "W");
  return `${d}° ${m}' ${s.toFixed(2)}" ${h}`;
}

export function formatPairDms(p: LatLng) {
  return `${formatDms(p.lat, "lat")}, ${formatDms(p.lng, "lng")}`;
}

export function dmsToDec(d: number, m: number, s: number, hemi: string) {
  const v = Math.abs(d) + m / 60 + s / 3600;
  return /[SWsw]/.test(hemi) ? -v : v;
}

/** Parse a single DMS-ish string like 40°26'46"N or 40 26 46 S. Returns decimal or null. */
export function parseDms(str: string): number | null {
  const s = str.trim().toUpperCase().replace(/[″"]/g, '"').replace(/[′’]/g, "'").replace(/[°º]/g, " ");
  const m = s.match(/^(-?\d+(?:\.\d+)?)\s*(?:(\d+(?:\.\d+)?)\s*(?:(\d+(?:\.\d+)?)\s*)?)?\s*([NSEW]?)$/);
  if (!m) return null;
  const dec = Math.abs(parseFloat(m[1])) + (parseFloat(m[2] || "0") || 0) / 60 + (parseFloat(m[3] || "0") || 0) / 3600;
  const v = parseFloat(m[1]) < 0 ? -dec : dec;
  return /[SW]/.test(m[4]) ? -Math.abs(v) : v;
}

// ---------- UTM (WGS84) ----------
const UTM_K0 = 0.9996;
const A = 6378137, F = 1 / 298.257223563;
const E2 = F * (2 - F), EP2 = E2 / (1 - E2);

export interface Utm { zone: number; hemi: "N" | "S"; easting: number; northing: number }

export function latLngToUtm(p: LatLng): Utm | null {
  if (!isValidLat(p.lat) || !isValidLng(p.lng) || p.lat < -80 || p.lat > 84) return null;
  // Norway / Svalbard exceptions
  let zone = Math.floor((normLng(p.lng) + 180) / 6) + 1;
  if (p.lat >= 56 && p.lat < 64 && p.lng >= 3 && p.lng < 12) zone = 32;
  if (p.lat >= 72 && p.lat < 84 && p.lng >= 0 && p.lng < 42) {
    zone = p.lng < 9 ? 31 : p.lng < 21 ? 33 : p.lng < 33 ? 35 : 37;
  }
  const λ0 = ((zone - 1) * 6 - 180 + 3) * (Math.PI / 180);
  const φ = (p.lat * Math.PI) / 180, λ = (normLng(p.lng) * Math.PI) / 180;
  const N = A / Math.sqrt(1 - E2 * Math.sin(φ) ** 2);
  const T = Math.tan(φ) ** 2, C = EP2 * Math.cos(φ) ** 2;
  const Acoef = Math.cos(φ) * (λ - λ0);
  const M = A * ((1 - E2 / 4 - (3 * E2 * E2) / 64 - (5 * E2 ** 3) / 256) * φ
    - ((3 * E2) / 8 + (3 * E2 * E2) / 32 + (45 * E2 ** 3) / 1024) * Math.sin(2 * φ)
    + ((15 * E2 * E2) / 256 + (45 * E2 ** 3) / 1024) * Math.sin(4 * φ)
    - ((35 * E2 ** 3) / 3072) * Math.sin(6 * φ));
  const easting = UTM_K0 * N * (Acoef + ((1 - T + C) * Acoef ** 3) / 6
    + ((5 - 18 * T + T * T + 72 * C - 58 * EP2) * Acoef ** 5) / 120) + 500000;
  let northing = UTM_K0 * (M + N * Math.tan(φ) * (Acoef ** 2 / 2
    + ((5 - T + 9 * C + 4 * C * C) * Acoef ** 4) / 24
    + ((61 - 58 * T + T * T + 600 * C - 330 * EP2) * Acoef ** 6) / 720));
  if (p.lat < 0) northing += 10000000;
  return { zone, hemi: p.lat >= 0 ? "N" : "S", easting, northing };
}

export function utmToLatLng(u: Utm): LatLng | null {
  if (!Number.isInteger(u.zone) || u.zone < 1 || u.zone > 60 || !Number.isFinite(u.easting) || !Number.isFinite(u.northing) || u.easting < 100000 || u.easting > 900000 || u.northing < 0 || u.northing > 10000000 || !["N", "S"].includes(u.hemi)) return null;
  const x = u.easting - 500000;
  let y = u.northing;
  if (u.hemi === "S") y -= 10000000;
  const M = y / UTM_K0;
  const μ = M / (A * (1 - E2 / 4 - (3 * E2 * E2) / 64 - (5 * E2 ** 3) / 256));
  const e1 = (1 - Math.sqrt(1 - E2)) / (1 + Math.sqrt(1 - E2));
  const φ1 = μ + ((3 * e1) / 2 - (27 * e1 ** 3) / 32) * Math.sin(2 * μ)
    + ((21 * e1 * e1) / 16 - (55 * e1 ** 4) / 32) * Math.sin(4 * μ)
    + ((151 * e1 ** 3) / 96) * Math.sin(6 * μ) + ((1097 * e1 ** 4) / 512) * Math.sin(8 * μ);
  const N1 = A / Math.sqrt(1 - E2 * Math.sin(φ1) ** 2);
  const T1 = Math.tan(φ1) ** 2, C1 = EP2 * Math.cos(φ1) ** 2;
  const R1 = A * (1 - E2) / Math.pow(1 - E2 * Math.sin(φ1) ** 2, 1.5);
  const D = x / (N1 * UTM_K0);
  const lat = φ1 - ((N1 * Math.tan(φ1)) / R1) * (D * D / 2
    - ((5 + 3 * T1 + 10 * C1 - 4 * C1 * C1 - 9 * EP2) * D ** 4) / 24
    + ((61 + 90 * T1 + 298 * C1 + 45 * T1 * T1 - 252 * EP2 - 3 * C1 * C1) * D ** 6) / 720);
  const lng = (D - ((1 + 2 * T1 + C1) * D ** 3) / 6
    + ((5 - 2 * C1 + 28 * T1 - 3 * C1 * C1 + 8 * EP2 + 24 * T1 * T1) * D ** 5) / 120) / Math.cos(φ1);
  const λ0 = ((u.zone - 1) * 6 - 180 + 3) * (Math.PI / 180);
  return { lat: (lat * 180) / Math.PI, lng: normLng(((λ0 + lng) * 180) / Math.PI) };
}

export function formatUtm(u: Utm) {
  return `${u.zone}${u.hemi} ${Math.round(u.easting)} ${Math.round(u.northing)}`;
}

// ---------- MGRS ----------
const COL_LETTERS = "ABCDEFGHJKLMNPQRSTUVWXYZ";
const ROW_LETTERS = "ABCDEFGHJKLMNPQRSTUV";

export function latLngToMgrs(p: LatLng, digits = 5): string | null {
  const u = latLngToUtm(p);
  if (!u) return null;
  const set = (u.zone - 1) % 3;
  const e100 = Math.floor(u.easting / 100000);
  const n100 = Math.floor(u.northing / 100000) % 20;
  const col = COL_LETTERS[(e100 - 1 + set * 8) % 24];
  const row = ROW_LETTERS[(n100 - 1 + ((u.zone - 1) % 2) * 5) % 20];
  const d = Math.max(1, Math.min(5, digits));
  const pow = 10 ** (5 - d);
  const e = String(Math.floor((u.easting % 100000) / pow)).padStart(d, "0");
  const n = String(Math.floor((u.northing % 100000) / pow)).padStart(d, "0");
  return `${u.zone}${COL_LETTERS[((u.zone - 1) % 6) * 4 + "CDEFGHJKLMNPQRSTUV".indexOf(latBandLetter(p.lat))] ?? "?"}${col}${row}${e}${n}`;
}

function latBandLetter(lat: number) {
  const bands = "CDEFGHJKLMNPQRSTUVWX";
  if (lat < -80 || lat >= 84) return "Z";
  return bands[Math.floor((lat + 80) / 8)];
}

export function parseMgrs(s: string): LatLng | null {
  const t = s.trim().toUpperCase().replace(/\s+/g, "");
  const m = t.match(/^(\d{1,2})([C-X&&[^IO]])([A-HJ-NP-Z])([A-HJ-NP-V])(\d{2,10})$/);
  if (!m) return null;
  const zone = parseInt(m[1], 10);
  const colL = m[3], rowL = m[4];
  const half = m[5].length / 2;
  if (!Number.isInteger(half)) return null;
  const e = parseFloat(m[5].slice(0, half)), n = parseFloat(m[5].slice(half));
  const set = (zone - 1) % 3;
  const colIdx = COL_LETTERS.indexOf(colL);
  const e100 = ((colIdx - set * 8) % 24 + 24) % 24 + 1;
  const rowIdx = ROW_LETTERS.indexOf(rowL);
  const rowSet = ((zone - 1) % 2) * 5;
  let n100 = ((rowIdx - rowSet) % 20 + 20) % 20 + 1;
  const scale = 10 ** (5 - half);
  const easting = e100 * 100000 + e * scale;
  let northing = n100 * 100000 + n * scale;
  // southern hemisphere handled via band letter
  const band = m[2];
  const south = "CDEFGHJKLM".includes(band);
  if (south && northing < 1000000) northing += 10000000;
  if (!south && northing >= 10000000) northing -= 10000000;
  return utmToLatLng({ zone, hemi: south ? "S" : "N", easting, northing });
}

// ---------- Open Location Code (Plus Codes) ----------
const OLC_ALPHABET = "23456789CFGHJMPQRVWX";

/** Full Open Location Codes: paired digits through 10, then 5×4 grid refinement. */
export function encodePlusCode(lat: number, lng: number, length = 10): string {
  if (!isValidLat(lat) || !Number.isFinite(lng)) return "";
  if (!Number.isInteger(length) || length < 2 || length > 15 || (length < 10 && length % 2 !== 0)) return "";
  const pairLength = Math.min(length, 10);
  const resolutions = [20, 1, 0.05, 0.0025, 0.000125];
  const precision = length <= 10 ? resolutions[length / 2 - 1] : 0.000125 / 5 ** (length - 10);
  // Integer arithmetic prevents floating-point drift at fine grid boundaries.
  const latitude = (lat === 90 ? lat - precision : lat) + 90;
  const longitude = ((lng + 180) % 360 + 360) % 360;
  let la = Math.floor(Number((latitude * 25000000).toFixed(6)));
  let lo = Math.floor(Number((longitude * 8192000).toFixed(6)));
  let grid = "";
  for (let i = 0; i < 5; i++) {
    grid = OLC_ALPHABET[(la % 5) * 4 + lo % 4] + grid;
    la = Math.floor(la / 5); lo = Math.floor(lo / 4);
  }
  let pairs = "";
  for (let i = 0; i < 5; i++) {
    pairs = OLC_ALPHABET[la % 20] + OLC_ALPHABET[lo % 20] + pairs;
    la = Math.floor(la / 20); lo = Math.floor(lo / 20);
  }
  let code = pairs.slice(0, pairLength).padEnd(8, "0");
  code = code.slice(0, 8) + "+" + code.slice(8);
  if (length > 10) code += grid.slice(0, length - 10);
  return code;
}

/** Decode a full code to its cell centre; short codes need locality and are rejected. */
export function decodePlusCode(code: string): LatLng | null {
  const c = code.trim().toUpperCase();
  if (c.indexOf("+") !== 8 || c.lastIndexOf("+") !== 8) return null;
  const raw = c.replace("+", "");
  if (raw.length > 15 || raw.length < 8 || raw.length === 9) return null;
  const zero = raw.indexOf("0");
  if (zero >= 0 && (zero < 2 || zero % 2 !== 0 || raw.length !== 8 || !/^0+$/.test(raw.slice(zero)))) return null;
  const body = zero >= 0 ? raw.slice(0, zero) : raw;
  if ([...body].some(ch => !OLC_ALPHABET.includes(ch))) return null;
  if (OLC_ALPHABET.indexOf(body[0]) > 8 || OLC_ALPHABET.indexOf(body[1]) > 17) return null;
  const resolutions = [20, 1, 0.05, 0.0025, 0.000125];
  let lat = -90, lng = -180, latRes = 20, lngRes = 20;
  const pairs = Math.min(body.length, 10);
  for (let i = 0; i < pairs; i += 2) {
    latRes = lngRes = resolutions[i / 2];
    lat += OLC_ALPHABET.indexOf(body[i]) * latRes;
    lng += OLC_ALPHABET.indexOf(body[i + 1]) * lngRes;
  }
  for (let i = 10; i < body.length; i++) {
    latRes /= 5; lngRes /= 4;
    const value = OLC_ALPHABET.indexOf(body[i]);
    lat += Math.floor(value / 4) * latRes;
    lng += (value % 4) * lngRes;
  }
  return { lat: lat + latRes / 2, lng: normLng(lng + lngRes / 2) };
}
