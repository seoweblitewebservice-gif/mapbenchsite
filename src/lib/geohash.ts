import type { LatLng } from "./geo";

const ALPHABET = "0123456789bcdefghjkmnpqrstuvwxyz";

/** Encode a WGS84 coordinate into a geohash cell. */
export function encodeGeohash(lat: number, lng: number, precision = 9): string {
  let latMin = -90, latMax = 90, lngMin = -180, lngMax = 180;
  let bit = 0, ch = 0, even = true, out = "";
  const bits = [16, 8, 4, 2, 1];
  while (out.length < precision) {
    if (even) { const mid = (lngMin + lngMax) / 2; if (lng >= mid) { ch |= bits[bit]; lngMin = mid; } else lngMax = mid; }
    else { const mid = (latMin + latMax) / 2; if (lat >= mid) { ch |= bits[bit]; latMin = mid; } else latMax = mid; }
    even = !even;
    if (bit < 4) bit += 1; else { out += ALPHABET[ch]; ch = 0; bit = 0; }
  }
  return out;
}

/** Decode to the centre of the represented cell, not the original point. */
export function decodeGeohash(input: string): LatLng | null {
  const hash = input.trim().toLowerCase();
  if (!/^[0123456789bcdefghjkmnpqrstuvwxyz]{1,12}$/.test(hash)) return null;
  let latMin = -90, latMax = 90, lngMin = -180, lngMax = 180, even = true;
  for (const char of hash) {
    const value = ALPHABET.indexOf(char);
    for (const bit of [16, 8, 4, 2, 1]) {
      if (even) { const mid = (lngMin + lngMax) / 2; if (value & bit) lngMin = mid; else lngMax = mid; }
      else { const mid = (latMin + latMax) / 2; if (value & bit) latMin = mid; else latMax = mid; }
      even = !even;
    }
  }
  return { lat: (latMin + latMax) / 2, lng: (lngMin + lngMax) / 2 };
}
