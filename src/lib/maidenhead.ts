import type { LatLng } from "./geo";

const letters = "ABCDEFGHIJKLMNOPQRSTUVWX";
const lngSizes = [20, 2, 1 / 12, 1 / 120];
const latSizes = [10, 1, 1 / 24, 1 / 240];

/** Maidenhead field, square, subsquare, and extended square (2–8 characters). */
export function encodeMaidenhead(lat: number, lng: number, length = 6): string | null {
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180 || ![2, 4, 6, 8].includes(length)) return null;
  let x = (lng === 180 ? -180 : lng) + 180;
  let y = Math.min(lat, 90 - 1e-10) + 90;
  let code = "";
  for (let i = 0; i < length / 2; i++) {
    const col = Math.floor(x / lngSizes[i]), row = Math.floor(y / latSizes[i]);
    code += i % 2 === 0 ? letters[col] + letters[row] : `${col}${row}`;
    x -= col * lngSizes[i]; y -= row * latSizes[i];
  }
  return code;
}

/** Returns the bounding box and centre; a locator identifies an area, not a point. */
export function decodeMaidenhead(input: string): { center: LatLng; bounds: [number, number, number, number] } | null {
  const code = input.trim().toUpperCase();
  if (!/^[A-R]{2}(?:[0-9]{2}(?:[A-X]{2}(?:[0-9]{2})?)?)?$/.test(code)) return null;
  let west = -180, south = -90;
  const pairs = code.length / 2;
  for (let i = 0; i < pairs; i++) {
    const col = i % 2 === 0 ? letters.indexOf(code[i * 2]) : Number(code[i * 2]);
    const row = i % 2 === 0 ? letters.indexOf(code[i * 2 + 1]) : Number(code[i * 2 + 1]);
    west += col * lngSizes[i]; south += row * latSizes[i];
  }
  const east = west + lngSizes[pairs - 1], north = south + latSizes[pairs - 1];
  return { center: { lat: (south + north) / 2, lng: (west + east) / 2 }, bounds: [west, south, east, north] };
}
