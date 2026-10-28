"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import type { Map as MLMap, GeoJSONSource } from "maplibre-gl";
import {
  EARTH_R_KM, bearingBetween, compassPoint, destination, distanceKm, fmt, fmtDist,
  midpoint, normLng, toDeg, toRad, type LatLng, type UnitKey,
} from "@/lib/geo";
import { geolocation, nominatimReverse } from "@/lib/geocode";
import { moonPhase, sunTimes } from "@/lib/astronomy";
import { downloadText, toCsv } from "@/lib/formats";
import { CopyBtn, ErrorBox, Field, Seg, Spinner, Stat, readUrlParams, syncUrl } from "@/components/ui";
import { DynamicMap, PALETTE, PlaceField, pinElement, type PlaceValue } from "./shared";

// ---------------------------------------------------------------- helpers

function toDms(p: LatLng): string {
  const f = (v: number, pos: string, neg: string) => {
    const a = Math.abs(v);
    const d = Math.floor(a), m = Math.floor((a - d) * 60), s = ((a - d) * 3600 - m * 60);
    return `${d}° ${String(m).padStart(2, "0")}' ${s.toFixed(1)}" ${v >= 0 ? pos : neg}`;
  };
  return `${f(p.lat, "N", "S")}, ${f(p.lng, "E", "W")}`;
}

function fmtUtcH(h: number | null): string {
  if (h === null || !Number.isFinite(h)) return "—";
  const hh = ((Math.floor(h) % 24) + 24) % 24;
  const mm = Math.round((h - Math.floor(h)) * 60);
  return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")} UTC`;
}

/** NOAA-style solar declination (deg) + equation of time (minutes). */
function solarDeclEqTime(date: Date): { decl: number; eqTime: number } {
  const jd = date.getTime() / 86400000 + 2440587.5;
  const T = (jd - 2451545) / 36525;
  const L0 = (280.46646 + T * (36000.76983 + T * 0.0003032)) % 360;
  const M = 357.52911 + T * (35999.05029 - 0.0001537 * T);
  const e = 0.016708634 - T * (0.000042037 + 0.0000001267 * T);
  const Mrad = toRad(M);
  const C = Math.sin(Mrad) * (1.914602 - T * (0.004817 + 0.000014 * T))
    + Math.sin(2 * Mrad) * (0.019993 - 0.000101 * T) + Math.sin(3 * Mrad) * 0.000289;
  const trueLong = L0 + C;
  const omega = 125.04 - 1934.136 * T;
  const lambda = trueLong - 0.00569 - 0.00478 * Math.sin(toRad(omega));
  const eps0 = 23 + (26 + (21.448 - T * (46.815 + T * (0.00059 - T * 0.001813))) / 60) / 60;
  const eps = eps0 + 0.00256 * Math.cos(toRad(omega));
  const decl = toDeg(Math.asin(Math.sin(toRad(eps)) * Math.sin(toRad(lambda))));
  const y = Math.tan(toRad(eps) / 2) ** 2;
  const eqTime = 4 * toDeg(
    y * Math.sin(2 * toRad(L0)) - 2 * e * Math.sin(Mrad)
    + 4 * e * y * Math.sin(Mrad) * Math.cos(2 * toRad(L0))
    - 0.5 * y * y * Math.sin(4 * toRad(L0)) - 1.25 * e * e * Math.sin(2 * Mrad),
  );
  return { decl, eqTime };
}

/** Point on Earth where the Sun is directly overhead right now. */
function subsolarPoint(date: Date): LatLng {
  const { decl, eqTime } = solarDeclEqTime(date);
  const utcH = date.getUTCHours() + date.getUTCMinutes() / 60 + date.getUTCSeconds() / 3600;
  return { lat: decl, lng: normLng(180 - 15 * utcH - eqTime / 4) };
}

/** Destination without longitude normalization (keeps rings continuous across the antimeridian). */
function destRaw(o: LatLng, bearingDeg: number, distKm: number): LatLng {
  const d = distKm / EARTH_R_KM;
  const t = toRad(bearingDeg);
  const f1 = toRad(o.lat), l1 = toRad(o.lng);
  const f2 = Math.asin(Math.sin(f1) * Math.cos(d) + Math.cos(f1) * Math.sin(d) * Math.cos(t));
  const l2 = l1 + Math.atan2(Math.sin(t) * Math.sin(d) * Math.cos(f1), Math.cos(d) - Math.sin(f1) * Math.sin(f2));
  return { lat: toDeg(f2), lng: toDeg(l2) };
}

/** 90°-radius ring around a center — the boundary of a visible hemisphere. */
function hemisphereRing(center: LatLng, n = 144): [number, number][] {
  const pts: [number, number][] = [];
  for (let i = 0; i <= n; i++) {
    const p = destRaw(center, (i / n) * 360, (Math.PI / 2) * EARTH_R_KM);
    pts.push([p.lng, p.lat]);
  }
  return pts;
}

/** Truncated Paul Schlyter lunar position: geocentric RA/Dec (deg) + distance (km). */
function moonRaDec(date: Date): { ra: number; dec: number; distKm: number } {
  const d = date.getTime() / 86400000 + 2440587.5 - 2451543.5;
  const N = toRad(125.1228 - 0.0529538083 * d);
  const incl = toRad(5.1454);
  const w = toRad(318.0634 + 0.1643573223 * d);
  const a = 60.2666; // Earth radii
  const e = 0.054900;
  const M = toRad(115.3654 + 13.064993 * d);
  let E = M + e * Math.sin(M) * (1 + e * Math.cos(M));
  for (let k = 0; k < 4; k++) E -= (E - e * Math.sin(E) - M) / (1 - e * Math.cos(E));
  const xv = a * (Math.cos(E) - e);
  const yv = a * (Math.sqrt(1 - e * e) * Math.sin(E));
  const v = Math.atan2(yv, xv);
  const r = Math.hypot(xv, yv);
  const xh = r * (Math.cos(N) * Math.cos(v + w) - Math.sin(N) * Math.sin(v + w) * Math.cos(incl));
  const yh = r * (Math.sin(N) * Math.cos(v + w) + Math.cos(N) * Math.sin(v + w) * Math.cos(incl));
  const zh = r * (Math.sin(v + w) * Math.sin(incl));
  let lon = Math.atan2(yh, xh);
  let latEcl = Math.atan2(zh, Math.hypot(xh, yh));
  const Ms = toRad(356.0470 + 0.9856002585 * d);
  const Mm = toRad(115.3654 + 13.064993 * d);
  const Ls = toRad(280.4665 + 0.98564736 * d);
  const Lm = N + w + M;
  const D = Lm - Ls;
  const F = Lm - N;
  lon += toRad(-1.274 * Math.sin(Mm - 2 * D) + 0.658 * Math.sin(2 * D) - 0.186 * Math.sin(Ms) - 0.114 * Math.sin(2 * F - 2 * D));
  latEcl += toRad(-0.173 * Math.sin(F - 2 * D) - 0.055 * Math.sin(Mm - F - 2 * D) - 0.046 * Math.sin(Mm + F - 2 * D) + 0.033 * Math.sin(F + 2 * D));
  const rr = r - 0.58 * Math.cos(Mm - 2 * D) - 0.46 * Math.cos(2 * D);
  const ecl = toRad(23.4393 - 3.563e-7 * d);
  const xe = rr * Math.cos(lon) * Math.cos(latEcl);
  const ye = rr * (Math.sin(lon) * Math.cos(latEcl) * Math.cos(ecl) - Math.sin(latEcl) * Math.sin(ecl));
  const ze = rr * (Math.sin(lon) * Math.cos(latEcl) * Math.sin(ecl) + Math.sin(latEcl) * Math.cos(ecl));
  return { ra: toDeg(Math.atan2(ye, xe)), dec: toDeg(Math.atan2(ze, Math.hypot(xe, ye))), distKm: rr * 6378.14 };
}

function gmstDeg(date: Date): number {
  const jd = date.getTime() / 86400000 + 2440587.5;
  const T = (jd - 2451545.0) / 36525.0;
  const g = 280.46061837 + 360.98564736629 * (jd - 2451545.0) + 0.000387933 * T * T - (T * T * T) / 38710000.0;
  return ((g % 360) + 360) % 360;
}

/** Point on Earth where the Moon is at the zenith right now. */
function sublunarPoint(date: Date): LatLng {
  const { ra, dec } = moonRaDec(date);
  return { lat: dec, lng: normLng(ra - gmstDeg(date)) };
}

/** Moon altitude (deg) above the horizon at a place/time. */
function moonAltitude(p: LatLng, date: Date): number {
  const { ra, dec } = moonRaDec(date);
  const H = toRad(gmstDeg(date) + p.lng - ra);
  const alt = Math.asin(
    Math.sin(toRad(dec)) * Math.sin(toRad(p.lat)) + Math.cos(toRad(dec)) * Math.cos(toRad(p.lat)) * Math.cos(H),
  );
  return toDeg(alt);
}

/** Approx moonrise/moonset (UTC hours) by sampling altitude over the UTC day. */
function moonRiseSet(p: LatLng, date: Date): { rise: number | null; set: number | null } {
  const base = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
  let rise: number | null = null, set: number | null = null;
  let prev = moonAltitude(p, new Date(base));
  for (let k = 1; k <= 144; k++) {
    const t = new Date(base + (k / 144) * 86400000);
    const alt = moonAltitude(p, t);
    if (prev < 0 && alt >= 0 && rise === null) rise = k / 6;
    if (prev >= 0 && alt < 0 && set === null) set = k / 6;
    if (rise !== null && set !== null) break;
    prev = alt;
  }
  return { rise, set };
}

/** Spherical linear interpolation between two points. */
function slerp(a: LatLng, b: LatLng, t: number): LatLng {
  const ax = Math.cos(toRad(a.lat)) * Math.cos(toRad(a.lng));
  const ay = Math.cos(toRad(a.lat)) * Math.sin(toRad(a.lng));
  const az = Math.sin(toRad(a.lat));
  const bx = Math.cos(toRad(b.lat)) * Math.cos(toRad(b.lng));
  const by = Math.cos(toRad(b.lat)) * Math.sin(toRad(b.lng));
  const bz = Math.sin(toRad(b.lat));
  const dot = Math.min(1, Math.max(-1, ax * bx + ay * by + az * bz));
  const om = Math.acos(dot);
  if (om < 1e-6) return { ...a };
  const so = Math.sin(om);
  const k0 = Math.sin((1 - t) * om) / so, k1 = Math.sin(t * om) / so;
  const x = k0 * ax + k1 * bx, y = k0 * ay + k1 * by, z = k0 * az + k1 * bz;
  return { lat: toDeg(Math.asin(Math.min(1, Math.max(-1, z)))), lng: normLng(toDeg(Math.atan2(y, x))) };
}

// ---------- Terrarium elevation tiles ----------
const TERR_Z = 12;
const TERR_N = 1 << TERR_Z;

function terrTile(lat: number, lng: number) {
  const fx = ((lng + 180) / 360) * TERR_N;
  const latR = toRad(Math.max(-85, Math.min(85, lat)));
  const fy = ((1 - Math.log(Math.tan(latR) + 1 / Math.cos(latR)) / Math.PI) / 2) * TERR_N;
  return { x: Math.floor(fx), y: Math.floor(fy), px: Math.floor((fx - Math.floor(fx)) * 256), py: Math.floor((fy - Math.floor(fy)) * 256) };
}

function loadTerrarium(x: number, y: number): Promise<ImageData | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    const done = (d: ImageData | null) => resolve(d);
    img.onload = () => {
      try {
        const c = document.createElement("canvas");
        c.width = 256; c.height = 256;
        const ctx = c.getContext("2d");
        if (!ctx) { done(null); return; }
        ctx.drawImage(img, 0, 0);
        done(ctx.getImageData(0, 0, 256, 256));
      } catch { done(null); }
    };
    img.onerror = () => done(null);
    img.src = `https://s3.amazonaws.com/elevation-tiles-prod/terrarium/${TERR_Z}/${x}/${y}.png`;
  });
}

function terrElev(d: ImageData, px: number, py: number): number {
  const i = (py * 256 + px) * 4;
  return d.data[i] * 256 + d.data[i + 1] + d.data[i + 2] / 256 - 32768;
}

/** Evenly spaced samples along a multi-point path. */
function samplePath(points: LatLng[], n: number): LatLng[] {
  const segs: number[] = [];
  let total = 0;
  for (let i = 1; i < points.length; i++) {
    const d = distanceKm(points[i - 1], points[i]);
    segs.push(d); total += d;
  }
  if (total <= 0) return points.slice(0, 1);
  const out: LatLng[] = [];
  for (let k = 0; k < n; k++) {
    const target = (k / (n - 1)) * total;
    let acc = 0;
    for (let i = 0; i < segs.length; i++) {
      if (acc + segs[i] >= target || i === segs.length - 1) {
        const frac = segs[i] === 0 ? 0 : Math.min(1, Math.max(0, (target - acc) / segs[i]));
        out.push(destination(points[i], bearingBetween(points[i], points[i + 1]), frac * segs[i]));
        break;
      }
      acc += segs[i];
    }
  }
  return out;
}

// ---------------------------------------------------------------- data

interface Park { name: string; lat: number; lng: number; state: string }

const PARKS: Park[] = [
  { name: "Acadia", lat: 44.35, lng: -68.21, state: "ME" },
  { name: "American Samoa", lat: -14.25, lng: -170.68, state: "AS" },
  { name: "Arches", lat: 38.73, lng: -109.59, state: "UT" },
  { name: "Badlands", lat: 43.75, lng: -102.34, state: "SD" },
  { name: "Big Bend", lat: 29.13, lng: -103.24, state: "TX" },
  { name: "Biscayne", lat: 25.65, lng: -80.08, state: "FL" },
  { name: "Black Canyon of the Gunnison", lat: 38.57, lng: -107.72, state: "CO" },
  { name: "Bryce Canyon", lat: 37.59, lng: -112.19, state: "UT" },
  { name: "Canyonlands", lat: 38.33, lng: -109.88, state: "UT" },
  { name: "Capitol Reef", lat: 38.37, lng: -111.17, state: "UT" },
  { name: "Carlsbad Caverns", lat: 32.17, lng: -104.44, state: "NM" },
  { name: "Channel Islands", lat: 34.01, lng: -119.42, state: "CA" },
  { name: "Congaree", lat: 33.78, lng: -80.78, state: "SC" },
  { name: "Crater Lake", lat: 42.94, lng: -122.10, state: "OR" },
  { name: "Cuyahoga Valley", lat: 41.24, lng: -81.55, state: "OH" },
  { name: "Death Valley", lat: 36.46, lng: -116.87, state: "CA" },
  { name: "Denali", lat: 63.07, lng: -151.01, state: "AK" },
  { name: "Dry Tortugas", lat: 24.63, lng: -82.87, state: "FL" },
  { name: "Everglades", lat: 25.32, lng: -80.93, state: "FL" },
  { name: "Gates of the Arctic", lat: 67.78, lng: -153.30, state: "AK" },
  { name: "Gateway Arch", lat: 38.62, lng: -90.18, state: "MO" },
  { name: "Glacier", lat: 48.70, lng: -113.80, state: "MT" },
  { name: "Glacier Bay", lat: 58.50, lng: -136.00, state: "AK" },
  { name: "Grand Canyon", lat: 36.06, lng: -112.14, state: "AZ" },
  { name: "Grand Teton", lat: 43.79, lng: -110.68, state: "WY" },
  { name: "Great Basin", lat: 39.01, lng: -114.22, state: "NV" },
  { name: "Great Sand Dunes", lat: 37.73, lng: -105.51, state: "CO" },
  { name: "Great Smoky Mountains", lat: 35.68, lng: -83.53, state: "TN/NC" },
  { name: "Guadalupe Mountains", lat: 31.92, lng: -104.87, state: "TX" },
  { name: "Haleakala", lat: 20.72, lng: -156.16, state: "HI" },
  { name: "Hawaii Volcanoes", lat: 19.42, lng: -155.29, state: "HI" },
  { name: "Hot Springs", lat: 34.51, lng: -93.05, state: "AR" },
  { name: "Indiana Dunes", lat: 41.65, lng: -87.05, state: "IN" },
  { name: "Isle Royale", lat: 48.00, lng: -88.91, state: "MI" },
  { name: "Joshua Tree", lat: 33.88, lng: -115.90, state: "CA" },
  { name: "Katmai", lat: 58.55, lng: -155.00, state: "AK" },
  { name: "Kenai Fjords", lat: 60.08, lng: -149.67, state: "AK" },
  { name: "Kings Canyon", lat: 36.80, lng: -118.56, state: "CA" },
  { name: "Kobuk Valley", lat: 67.55, lng: -159.28, state: "AK" },
  { name: "Lake Clark", lat: 60.81, lng: -153.45, state: "AK" },
  { name: "Lassen Volcanic", lat: 40.50, lng: -121.51, state: "CA" },
  { name: "Mammoth Cave", lat: 37.18, lng: -86.10, state: "KY" },
  { name: "Mesa Verde", lat: 37.26, lng: -108.49, state: "CO" },
  { name: "Mount Rainier", lat: 46.85, lng: -121.74, state: "WA" },
  { name: "New River Gorge", lat: 38.07, lng: -81.08, state: "WV" },
  { name: "North Cascades", lat: 48.70, lng: -121.21, state: "WA" },
  { name: "Olympic", lat: 47.97, lng: -123.50, state: "WA" },
  { name: "Petrified Forest", lat: 35.08, lng: -109.78, state: "AZ" },
  { name: "Pinnacles", lat: 36.49, lng: -121.18, state: "CA" },
  { name: "Redwood", lat: 41.37, lng: -124.03, state: "CA" },
  { name: "Rocky Mountain", lat: 40.34, lng: -105.68, state: "CO" },
  { name: "Saguaro", lat: 32.30, lng: -110.79, state: "AZ" },
  { name: "Sequoia", lat: 36.43, lng: -118.68, state: "CA" },
  { name: "Shenandoah", lat: 38.53, lng: -78.35, state: "VA" },
  { name: "Theodore Roosevelt", lat: 46.97, lng: -103.45, state: "ND" },
  { name: "Virgin Islands", lat: 18.34, lng: -64.73, state: "VI" },
  { name: "Voyageurs", lat: 48.54, lng: -92.88, state: "MN" },
  { name: "White Sands", lat: 32.78, lng: -106.17, state: "NM" },
  { name: "Wind Cave", lat: 43.56, lng: -103.48, state: "SD" },
  { name: "Wrangell-St. Elias", lat: 61.00, lng: -142.00, state: "AK" },
  { name: "Yellowstone", lat: 44.60, lng: -110.50, state: "WY/MT/ID" },
  { name: "Yosemite", lat: 37.87, lng: -119.54, state: "CA" },
  { name: "Zion", lat: 37.30, lng: -112.98, state: "UT" },
];

interface Centroid { name: string; lat: number; lng: number; kind: "state" | "country" }

const CENTROIDS: Centroid[] = [
  // 50 US states + DC (approximate geographic centers)
  { name: "Alabama", lat: 32.78, lng: -86.79, kind: "state" },
  { name: "Alaska", lat: 64.84, lng: -147.72, kind: "state" },
  { name: "Arizona", lat: 34.27, lng: -111.66, kind: "state" },
  { name: "Arkansas", lat: 34.90, lng: -92.44, kind: "state" },
  { name: "California", lat: 37.18, lng: -119.45, kind: "state" },
  { name: "Colorado", lat: 39.00, lng: -105.55, kind: "state" },
  { name: "Connecticut", lat: 41.62, lng: -72.71, kind: "state" },
  { name: "Delaware", lat: 39.32, lng: -75.50, kind: "state" },
  { name: "Florida", lat: 28.09, lng: -81.61, kind: "state" },
  { name: "Georgia", lat: 32.63, lng: -83.44, kind: "state" },
  { name: "Hawaii", lat: 21.11, lng: -157.00, kind: "state" },
  { name: "Idaho", lat: 44.39, lng: -114.61, kind: "state" },
  { name: "Illinois", lat: 40.10, lng: -89.20, kind: "state" },
  { name: "Indiana", lat: 39.89, lng: -86.15, kind: "state" },
  { name: "Iowa", lat: 42.07, lng: -93.50, kind: "state" },
  { name: "Kansas", lat: 38.49, lng: -98.38, kind: "state" },
  { name: "Kentucky", lat: 37.53, lng: -85.30, kind: "state" },
  { name: "Louisiana", lat: 31.14, lng: -92.00, kind: "state" },
  { name: "Maine", lat: 45.37, lng: -69.45, kind: "state" },
  { name: "Maryland", lat: 39.07, lng: -76.79, kind: "state" },
  { name: "Massachusetts", lat: 42.25, lng: -71.80, kind: "state" },
  { name: "Michigan", lat: 43.33, lng: -84.55, kind: "state" },
  { name: "Minnesota", lat: 46.44, lng: -94.26, kind: "state" },
  { name: "Mississippi", lat: 32.74, lng: -89.69, kind: "state" },
  { name: "Missouri", lat: 38.36, lng: -92.45, kind: "state" },
  { name: "Montana", lat: 46.92, lng: -110.04, kind: "state" },
  { name: "Nebraska", lat: 41.53, lng: -99.80, kind: "state" },
  { name: "Nevada", lat: 39.33, lng: -116.63, kind: "state" },
  { name: "New Hampshire", lat: 43.68, lng: -71.58, kind: "state" },
  { name: "New Jersey", lat: 40.19, lng: -74.67, kind: "state" },
  { name: "New Mexico", lat: 34.41, lng: -106.14, kind: "state" },
  { name: "New York", lat: 42.15, lng: -74.95, kind: "state" },
  { name: "North Carolina", lat: 35.54, lng: -79.38, kind: "state" },
  { name: "North Dakota", lat: 47.44, lng: -100.48, kind: "state" },
  { name: "Ohio", lat: 40.29, lng: -82.91, kind: "state" },
  { name: "Oklahoma", lat: 35.59, lng: -97.51, kind: "state" },
  { name: "Oregon", lat: 43.93, lng: -120.56, kind: "state" },
  { name: "Pennsylvania", lat: 40.88, lng: -77.80, kind: "state" },
  { name: "Rhode Island", lat: 41.68, lng: -71.53, kind: "state" },
  { name: "South Carolina", lat: 33.92, lng: -80.90, kind: "state" },
  { name: "South Dakota", lat: 44.29, lng: -99.44, kind: "state" },
  { name: "Tennessee", lat: 35.86, lng: -86.36, kind: "state" },
  { name: "Texas", lat: 31.47, lng: -99.32, kind: "state" },
  { name: "Utah", lat: 39.31, lng: -111.67, kind: "state" },
  { name: "Vermont", lat: 44.04, lng: -72.71, kind: "state" },
  { name: "Virginia", lat: 37.52, lng: -78.61, kind: "state" },
  { name: "Washington", lat: 47.38, lng: -120.45, kind: "state" },
  { name: "West Virginia", lat: 38.63, lng: -80.62, kind: "state" },
  { name: "Wisconsin", lat: 44.63, lng: -89.99, kind: "state" },
  { name: "Wyoming", lat: 43.00, lng: -107.55, kind: "state" },
  { name: "District of Columbia", lat: 38.91, lng: -77.02, kind: "state" },
  // Major world countries (approximate geographic centers)
  { name: "Afghanistan", lat: 34.53, lng: 69.13, kind: "country" },
  { name: "Algeria", lat: 28.03, lng: 1.66, kind: "country" },
  { name: "Argentina", lat: -38.42, lng: -63.62, kind: "country" },
  { name: "Australia", lat: -25.27, lng: 133.77, kind: "country" },
  { name: "Austria", lat: 47.52, lng: 14.55, kind: "country" },
  { name: "Bangladesh", lat: 23.68, lng: 90.36, kind: "country" },
  { name: "Belarus", lat: 53.71, lng: 27.95, kind: "country" },
  { name: "Belgium", lat: 50.50, lng: 4.47, kind: "country" },
  { name: "Bolivia", lat: -17.06, lng: -64.00, kind: "country" },
  { name: "Brazil", lat: -14.24, lng: -51.93, kind: "country" },
  { name: "Bulgaria", lat: 42.73, lng: 25.48, kind: "country" },
  { name: "Canada", lat: 56.13, lng: -106.35, kind: "country" },
  { name: "Chile", lat: -35.67, lng: -71.54, kind: "country" },
  { name: "China", lat: 35.86, lng: 104.20, kind: "country" },
  { name: "Colombia", lat: 4.57, lng: -74.30, kind: "country" },
  { name: "Croatia", lat: 45.10, lng: 15.20, kind: "country" },
  { name: "Czechia", lat: 49.82, lng: 15.47, kind: "country" },
  { name: "Denmark", lat: 56.26, lng: 9.50, kind: "country" },
  { name: "Egypt", lat: 26.82, lng: 30.80, kind: "country" },
  { name: "Ethiopia", lat: 9.15, lng: 40.49, kind: "country" },
  { name: "Finland", lat: 61.92, lng: 25.75, kind: "country" },
  { name: "France", lat: 46.23, lng: 2.21, kind: "country" },
  { name: "Germany", lat: 51.17, lng: 10.45, kind: "country" },
  { name: "Ghana", lat: 7.95, lng: -1.02, kind: "country" },
  { name: "Greece", lat: 39.07, lng: 21.82, kind: "country" },
  { name: "Hungary", lat: 47.16, lng: 19.50, kind: "country" },
  { name: "Iceland", lat: 64.96, lng: -19.02, kind: "country" },
  { name: "India", lat: 20.59, lng: 78.96, kind: "country" },
  { name: "Indonesia", lat: -0.79, lng: 113.92, kind: "country" },
  { name: "Iran", lat: 32.43, lng: 53.69, kind: "country" },
  { name: "Iraq", lat: 33.22, lng: 43.68, kind: "country" },
  { name: "Ireland", lat: 53.41, lng: -8.24, kind: "country" },
  { name: "Israel", lat: 31.05, lng: 34.85, kind: "country" },
  { name: "Italy", lat: 41.87, lng: 12.57, kind: "country" },
  { name: "Japan", lat: 36.20, lng: 138.25, kind: "country" },
  { name: "Kazakhstan", lat: 48.02, lng: 66.92, kind: "country" },
  { name: "Kenya", lat: -0.02, lng: 37.86, kind: "country" },
  { name: "Malaysia", lat: 4.21, lng: 101.98, kind: "country" },
  { name: "Mexico", lat: 23.63, lng: -102.55, kind: "country" },
  { name: "Mongolia", lat: 46.86, lng: 103.85, kind: "country" },
  { name: "Morocco", lat: 31.79, lng: -7.09, kind: "country" },
  { name: "Myanmar", lat: 21.92, lng: 95.96, kind: "country" },
  { name: "Nepal", lat: 28.39, lng: 83.94, kind: "country" },
  { name: "Netherlands", lat: 52.13, lng: 5.29, kind: "country" },
  { name: "New Zealand", lat: -40.90, lng: 174.89, kind: "country" },
  { name: "Nigeria", lat: 9.08, lng: 8.68, kind: "country" },
  { name: "Norway", lat: 64.47, lng: 11.53, kind: "country" },
  { name: "Pakistan", lat: 30.38, lng: 69.35, kind: "country" },
  { name: "Peru", lat: -9.19, lng: -75.02, kind: "country" },
  { name: "Philippines", lat: 12.88, lng: 121.77, kind: "country" },
  { name: "Poland", lat: 51.92, lng: 19.15, kind: "country" },
  { name: "Portugal", lat: 39.40, lng: -8.22, kind: "country" },
  { name: "Romania", lat: 45.94, lng: 24.97, kind: "country" },
  { name: "Russia", lat: 61.52, lng: 90.00, kind: "country" },
  { name: "Saudi Arabia", lat: 23.89, lng: 45.06, kind: "country" },
  { name: "South Africa", lat: -30.56, lng: 22.94, kind: "country" },
  { name: "South Korea", lat: 35.91, lng: 127.77, kind: "country" },
  { name: "Spain", lat: 40.46, lng: -3.75, kind: "country" },
  { name: "Sri Lanka", lat: 7.87, lng: 80.77, kind: "country" },
  { name: "Sweden", lat: 60.13, lng: 18.64, kind: "country" },
  { name: "Switzerland", lat: 46.82, lng: 8.23, kind: "country" },
  { name: "Thailand", lat: 15.87, lng: 100.99, kind: "country" },
  { name: "Turkey", lat: 38.96, lng: 35.24, kind: "country" },
  { name: "Ukraine", lat: 48.38, lng: 31.17, kind: "country" },
  { name: "United Arab Emirates", lat: 24.00, lng: 54.00, kind: "country" },
  { name: "United Kingdom", lat: 55.38, lng: -3.44, kind: "country" },
  { name: "United States", lat: 39.83, lng: -98.58, kind: "country" },
  { name: "Uzbekistan", lat: 41.38, lng: 64.59, kind: "country" },
  { name: "Venezuela", lat: 6.42, lng: -66.59, kind: "country" },
  { name: "Vietnam", lat: 14.06, lng: 108.28, kind: "country" },
];

/** Simplified International Date Line path, north to south (key bends only). */
const IDL_VERTICES: [number, number][] = [
  [72, 180], [66, 180], [65.5, -169], [60, -175], [54, -178], [52.5, -172],
  [51, 180], [30, 180], [10, 180], [5, -176], [-2, -172], [-6, 180],
  [-12, 180], [-13.5, -171.5], [-16, -171.5], [-18, 180], [-21, 180],
  [-23, -176], [-25, 180], [-40, 180], [-44, -176], [-48, -176],
  [-50, 180], [-60, 180], [-75, 180],
];

// ---------------------------------------------------------------- tools

type RankedPark = Park & { distKm: number };

export function NationalParkTool({ params }: { params?: Record<string, unknown> }) {
  void params;
  const [unit, setUnit] = useState<UnitKey>("mi");
  const [center, setCenter] = useState<PlaceValue | null>(() => {
    const p = readUrlParams();
    const lat = parseFloat(p.get("lat") ?? ""), lng = parseFloat(p.get("lng") ?? "");
    return Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : null;
  });
  const [gpsBusy, setGpsBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [focus, setFocus] = useState<number | null>(null);
  const mapRef = useRef<MLMap | null>(null);
  const libRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const centerMarkerRef = useRef<any>(null);
  const [mapTick, setMapTick] = useState(0);

  useEffect(() => {
    syncUrl({ lat: center?.lat.toFixed(5) ?? null, lng: center?.lng.toFixed(5) ?? null, u: unit });
  }, [center, unit]);

  const ranked: RankedPark[] = useMemo(() => {
    if (!center) return [];
    return PARKS.map((p) => ({ ...p, distKm: distanceKm(center, p) }))
      .sort((a, b) => a.distKm - b.distKm)
      .slice(0, 20);
  }, [center]);

  const useGps = async () => {
    setGpsBusy(true); setError(null);
    try {
      const g = await geolocation();
      setCenter({ lat: g.lat, lng: g.lng, label: "Your location" });
      mapRef.current?.flyTo({ center: [g.lng, g.lat], zoom: 6, essential: true });
    } catch (e: any) {
      setError(e?.message || "Could not get your location.");
    } finally { setGpsBusy(false); }
  };

  useEffect(() => {
    const map = mapRef.current, lib = libRef.current;
    if (!map || !lib) return;
    markersRef.current.forEach((m) => m.remove()); markersRef.current = [];
    if (centerMarkerRef.current) { centerMarkerRef.current.remove(); centerMarkerRef.current = null; }
    if (!center) return;
    centerMarkerRef.current = new lib.Marker({ element: pinElement("#d95d32", "Y") })
      .setLngLat([center.lng, center.lat]).addTo(map);
    ranked.slice(0, 10).forEach((p, i) => {
      const m = new lib.Marker({ element: pinElement(PALETTE[i % PALETTE.length], String(i + 1)) })
        .setLngLat([p.lng, p.lat]).addTo(map);
      markersRef.current.push(m);
    });
  }, [center, ranked, mapTick]);

  useEffect(() => {
    if (focus === null || !mapRef.current) return;
    const p = ranked[focus];
    if (p) mapRef.current.flyTo({ center: [p.lng, p.lat], zoom: 8, essential: true });
  }, [focus, ranked]);

  const exportCsv = () => {
    downloadText(
      "mapbench-nearest-national-parks.csv",
      toCsv(
        ["rank", "park", "state", `distance_${unit}`, "lat", "lng"],
        ranked.map((p, i) => [i + 1, p.name, p.state, (p.distKm * (unit === "mi" ? 0.621371 : 1)).toFixed(1), p.lat, p.lng]),
      ),
      "text/csv",
    );
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[400px,1fr]">
      <div className="card order-2 space-y-4 p-4 lg:order-1">
        <PlaceField label="Your location" value={center} onChange={(v) => { setCenter(v); setError(null); }} placeholder="City, address, or ZIP…" />
        <p className="text-xs text-mute">…or click the map, or use GPS.</p>
        <div className="flex flex-wrap gap-2">
          <button type="button" className="btn btn-ghost btn-sm" onClick={useGps} disabled={gpsBusy}>
            {gpsBusy ? <Spinner label="Locating…" /> : "Use my GPS location"}
          </button>
          <Seg<UnitKey>
            ariaLabel="Units"
            value={unit}
            onChange={setUnit}
            options={[{ value: "mi", label: "Miles" }, { value: "km", label: "Kilometers" }]}
          />
        </div>
        {error && <ErrorBox>{error}</ErrorBox>}
        {!center && <p className="text-sm text-mute">Set a location to rank all 63 US National Parks by straight-line distance.</p>}
        {ranked.length > 0 && (
          <div className="space-y-3 border-t border-line pt-3">
            <div className="flex items-center justify-between">
              <span className="label !mb-0">Nearest parks</span>
              <button type="button" className="btn btn-ghost btn-sm" onClick={exportCsv}>Download CSV</button>
            </div>
            <div className="max-h-96 overflow-y-auto rounded-lg border border-line">
              <table className="tbl">
                <thead><tr><th>#</th><th>Park</th><th className="text-right">Distance</th><th /></tr></thead>
                <tbody>
                  {ranked.map((p, i) => (
                    <tr key={p.name} className={focus === i ? "bg-brand-soft" : undefined}>
                      <td className="font-bold text-mute">{i + 1}</td>
                      <td>
                        <button type="button" className="text-left font-semibold hover:underline" onClick={() => setFocus(i)}>
                          {p.name}
                        </button>
                        <div className="text-xs text-mute">{p.state} · {p.lat.toFixed(2)}, {p.lng.toFixed(2)}</div>
                      </td>
                      <td className="whitespace-nowrap text-right">{fmtDist(p.distKm, unit)}</td>
                      <td className="text-right">
                        <a className="btn btn-ghost btn-sm" target="_blank" rel="noreferrer"
                          href={`https://www.google.com/maps/search/?api=1&query=${p.lat},${p.lng}`}
                          aria-label={`Open ${p.name} in Google Maps`}>Map</a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-mute">Straight-line (haversine) distance — driving distance will be longer. Park coordinates are the published visitor-center areas, approximate.</p>
          </div>
        )}
      </div>
      <div className="order-1 lg:order-2">
        <DynamicMap
          center={center ?? { lat: 39.5, lng: -98.3 }}
          zoom={center ? 6 : 3.5}
          className="tall"
          onReady={(map, lib) => {
            mapRef.current = map; libRef.current = lib;
            setMapTick((t) => t + 1);
            map.on("click", (e: any) => { setCenter({ lat: e.lngLat.lat, lng: e.lngLat.lng }); setError(null); });
          }}
        />
      </div>
    </div>
  );
}

export function MapTunnelTool({ params }: { params?: Record<string, unknown> }) {
  void params;
  const [place, setPlace] = useState<PlaceValue | null>(() => {
    const p = readUrlParams();
    const lat = parseFloat(p.get("lat") ?? ""), lng = parseFloat(p.get("lng") ?? "");
    return Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : null;
  });
  const [antiLabel, setAntiLabel] = useState<{ s: "idle" | "busy" | "done"; label?: string }>({ s: "idle" });
  const mapA = useRef<MLMap | null>(null);
  const mapB = useRef<MLMap | null>(null);
  const libRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const [mapTick, setMapTick] = useState(0);

  const antipode = useMemo<LatLng | null>(
    () => (place ? { lat: -place.lat, lng: normLng(place.lng + 180) } : null),
    [place],
  );

  useEffect(() => {
    const lib = libRef.current;
    if (!lib || !mapA.current || !mapB.current) return;
    markersRef.current.forEach((m) => m.remove()); markersRef.current = [];
    if (place) markersRef.current.push(new lib.Marker({ element: pinElement("#1d6e63", "A") }).setLngLat([place.lng, place.lat]).addTo(mapA.current));
    if (antipode) markersRef.current.push(new lib.Marker({ element: pinElement("#d95d32", "B") }).setLngLat([antipode.lng, antipode.lat]).addTo(mapB.current));
  }, [place, antipode, mapTick]);

  useEffect(() => { syncUrl({ lat: place?.lat.toFixed(5) ?? null, lng: place?.lng.toFixed(5) ?? null }); }, [place]);

  useEffect(() => {
    let cancelled = false;
    const t = setTimeout(async () => {
      if (cancelled) return;
      if (!antipode) { setAntiLabel({ s: "idle" }); return; }
      setAntiLabel({ s: "busy" });
      const r = await nominatimReverse(antipode.lat, antipode.lng, 3);
      if (cancelled) return;
      setAntiLabel({ s: "done", label: r.ok ? (r.result.displayName.split(",").slice(-3).join(",").trim() || "Open ocean") : "Open ocean" });
    }, 400);
    return () => { cancelled = true; clearTimeout(t); };
  }, [antipode]);

  const syncZoom = (from: MLMap, to: MLMap | null) => {
    if (!to) return;
    const z = from.getZoom();
    if (Math.abs(to.getZoom() - z) > 0.01) to.setZoom(z);
  };

  return (
    <div className="space-y-4">
      <div className="card mx-auto w-full max-w-xl space-y-3 p-4">
        <PlaceField label="Dig from" value={place} onChange={setPlace} placeholder="Search a city, or click the left map…" />
        <p className="text-xs text-mute">Two synchronized globes: where you start, and where you come out. Zooms stay in sync.</p>
        {place && antipode && (
          <div className="rounded-lg bg-brand-soft px-4 py-3 text-sm">
            <div className="text-[11px] font-bold uppercase tracking-wide text-mute">If you dug straight through the Earth from {place.label || "your point"}</div>
            <div className="font-display text-lg font-bold text-brand-strong">
              {antiLabel.s === "busy" ? <Spinner label="Checking the other side…" /> : <>you would emerge near {antiLabel.label}</>}
            </div>
            <div className="mt-1 text-xs text-mute">{antipode.lat.toFixed(4)}, {antipode.lng.toFixed(4)} · about 12,742 km through the planet</div>
          </div>
        )}
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <div className="label">Your side</div>
          <DynamicMap
            center={place ?? { lat: 20, lng: 0 }} zoom={2.2} className="tall"
            onReady={(map, lib) => {
              mapA.current = map; libRef.current = lib;
              setMapTick((t) => t + 1);
              map.on("click", (e: any) => setPlace({ lat: e.lngLat.lat, lng: e.lngLat.lng }));
            }}
            onMoveEnd={(m) => syncZoom(m, mapB.current)}
          />
        </div>
        <div>
          <div className="label">The other side (antipode)</div>
          <DynamicMap
            center={antipode ?? { lat: -20, lng: 180 }} zoom={2.2} className="tall"
            onReady={(map, lib) => {
              mapB.current = map; libRef.current = lib;
              setMapTick((t) => t + 1);
            }}
            onMoveEnd={(m) => syncZoom(m, mapA.current)}
          />
        </div>
      </div>
      <p className="text-xs text-mute">Latitude flips sign and longitude shifts by 180° — the antipode is always exactly half the planet away. Most land antipodes land in the ocean (about 85% of the time).</p>
    </div>
  );
}

export function GeoCenterTool({ params }: { params?: Record<string, unknown> }) {
  void params;
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Centroid | null>(CENTROIDS.find((c) => c.name === "Kansas") ?? null);
  const [there, setThere] = useState<{ s: "idle" | "busy" | "done"; label?: string }>({ s: "idle" });
  const [p1, setP1] = useState<PlaceValue | null>(null);
  const [p2, setP2] = useState<PlaceValue | null>(null);
  const mapRef = useRef<MLMap | null>(null);
  const libRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const [mapTick, setMapTick] = useState(0);

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return CENTROIDS;
    return CENTROIDS.filter((c) => c.name.toLowerCase().includes(q));
  }, [query]);

  useEffect(() => {
    let cancelled = false;
    const t = setTimeout(async () => {
      if (cancelled || !selected) return;
      setThere({ s: "busy" });
      const r = await nominatimReverse(selected.lat, selected.lng, 8);
      if (cancelled) return;
      setThere({ s: "done", label: r.ok ? (r.result.displayName.split(",").slice(0, 3).join(",").trim() || "Unnamed area") : "Unnamed area" });
    }, 400);
    return () => { cancelled = true; clearTimeout(t); };
  }, [selected]);

  useEffect(() => {
    const map = mapRef.current, lib = libRef.current;
    if (!map || !lib || !selected) return;
    if (!markerRef.current) markerRef.current = new lib.Marker({ element: pinElement("#1d6e63", "C") }).addTo(map);
    markerRef.current.setLngLat([selected.lng, selected.lat]);
    map.flyTo({ center: [selected.lng, selected.lat], zoom: selected.kind === "state" ? 5.5 : 3.5, essential: true });
  }, [selected, mapTick]);

  const twoPoint = p1 && p2 ? midpoint(p1, p2) : null;

  return (
    <div className="grid gap-4 lg:grid-cols-[400px,1fr]">
      <div className="card order-2 space-y-4 p-4 lg:order-1">
        <Field label="Search a US state or country" hint={`${CENTROIDS.length} centroids indexed`}>
          <input
            className="input" list="geocenter-list" placeholder="Type to filter…"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              const hit = CENTROIDS.find((c) => c.name.toLowerCase() === e.target.value.trim().toLowerCase());
              if (hit) setSelected(hit);
            }}
          />
          <datalist id="geocenter-list">
            {matches.slice(0, 60).map((c) => <option key={c.name} value={c.name}>{c.kind}</option>)}
          </datalist>
        </Field>
        <Field label="Or pick directly">
          <select className="select" value={selected?.name ?? ""} onChange={(e) => setSelected(CENTROIDS.find((c) => c.name === e.target.value) ?? null)}>
            <optgroup label="US states">
              {CENTROIDS.filter((c) => c.kind === "state").map((c) => <option key={c.name} value={c.name}>{c.name}</option>)}
            </optgroup>
            <optgroup label="Countries">
              {CENTROIDS.filter((c) => c.kind === "country").map((c) => <option key={c.name} value={c.name}>{c.name}</option>)}
            </optgroup>
          </select>
        </Field>

        {selected && (
          <div className="space-y-3 border-t border-line pt-3">
            <Stat label={`Geographic center of ${selected.name}`} value={`${selected.lat.toFixed(4)}, ${selected.lng.toFixed(4)}`} sub={toDms(selected)} />
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs text-mute">Nearest named place:</span>
              {there.s === "busy" ? <Spinner label="Checking…" /> : <span className="text-sm font-semibold">{there.label}</span>}
              <CopyBtn text={`${selected.lat.toFixed(5)}, ${selected.lng.toFixed(5)}`} label="Copy coords" />
            </div>
            <p className="text-xs leading-relaxed text-mute">
              Honest method note: this is the published approximate geographic center of the {selected.kind === "state" ? "state" : "country"} boundary —
              a reference point, not the population or economic center. Positions are rounded to about 0.01°.
            </p>
          </div>
        )}

        <div className="space-y-3 border-t border-line pt-3">
          <span className="label">Centroid of two points</span>
          <PlaceField label="Point A" value={p1} onChange={setP1} placeholder="First place…" />
          <PlaceField label="Point B" value={p2} onChange={setP2} placeholder="Second place…" />
          {twoPoint && (
            <Stat label="Great-circle midpoint" value={`${twoPoint.lat.toFixed(5)}, ${twoPoint.lng.toFixed(5)}`} sub="the true middle of the shortest path between A and B" />
          )}
        </div>
      </div>
      <div className="order-1 lg:order-2">
        <DynamicMap
          center={selected ? { lat: selected.lat, lng: selected.lng } : { lat: 25, lng: 0 }}
          zoom={3}
          className="tall"
          onReady={(map, lib) => { mapRef.current = map; libRef.current = lib; setMapTick((t) => t + 1); }}
        />
      </div>
    </div>
  );
}

export function ElevationProfileTool({ params }: { params?: Record<string, unknown> }) {
  void params;
  const [points, setPoints] = useState<LatLng[]>([]);
  const [elev, setElev] = useState<(number | null)[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mapRef = useRef<MLMap | null>(null);
  const libRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const tileCache = useRef<Map<string, ImageData | null>>(new Map());

  const pathKm = useMemo(() => {
    let t = 0;
    for (let i = 1; i < points.length; i++) t += distanceKm(points[i - 1], points[i]);
    return t;
  }, [points]);

  useEffect(() => {
    const map = mapRef.current, lib = libRef.current;
    if (!map || !lib) return;
    markersRef.current.forEach((m) => m.remove()); markersRef.current = [];
    points.forEach((p, i) => {
      markersRef.current.push(
        new lib.Marker({ element: pinElement(PALETTE[i % PALETTE.length], String(i + 1)) })
          .setLngLat([p.lng, p.lat]).addTo(map),
      );
    });
    (map.getSource("ep-line") as GeoJSONSource | undefined)?.setData({
      type: "Feature",
      properties: {},
      geometry: { type: "LineString", coordinates: points.map((p) => [p.lng, p.lat]) },
    });
  }, [points]);

  const buildProfile = async () => {
    if (points.length < 2) { setError("Click at least two points on the map to draw a route."); return; }
    setBusy(true); setError(null); setElev(null);
    try {
      const samples = samplePath(points, 60);
      const byTile = new Map<string, number[]>();
      samples.forEach((s, i) => {
        const t = terrTile(s.lat, s.lng);
        const key = `${t.x}/${t.y}`;
        if (!byTile.has(key)) byTile.set(key, []);
        byTile.get(key)!.push(i);
      });
      const results: (number | null)[] = new Array(samples.length).fill(null);
      await Promise.all([...byTile.entries()].map(async ([key, idxs]) => {
        let d = tileCache.current.get(key);
        if (d === undefined) {
          const [x, y] = key.split("/").map(Number);
          d = await loadTerrarium(x, y);
          tileCache.current.set(key, d);
        }
        for (const i of idxs) {
          const t = terrTile(samples[i].lat, samples[i].lng);
          results[i] = d ? terrElev(d, t.px, t.py) : null;
        }
      }));
      const valid = results.filter((v): v is number => v !== null);
      if (valid.length < results.length * 0.5) {
        setError("Elevation tiles are partly unavailable for this route (network or coverage gap). Try a shorter route or try again.");
      }
      setElev(results);
    } catch {
      setError("Could not load elevation tiles. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  };

  const stats = useMemo(() => {
    if (!elev) return null;
    const valid = elev.filter((v): v is number => v !== null);
    if (valid.length < 2) return null;
    let gain = 0, loss = 0, steep = 0;
    const stepKm = pathKm / (elev.length - 1);
    for (let i = 1; i < elev.length; i++) {
      const a = elev[i - 1], b = elev[i];
      if (a === null || b === null) continue;
      const d = b - a;
      if (d > 0) gain += d; else loss -= d;
      if (stepKm > 0) steep = Math.max(steep, (Math.abs(d) / (stepKm * 1000)) * 100);
    }
    return { min: Math.min(...valid), max: Math.max(...valid), gain, loss, steep };
  }, [elev, pathKm]);

  const chart = useMemo(() => {
    if (!elev) return null;
    const valid = elev.filter((v): v is number => v !== null);
    if (valid.length < 2) return null;
    const W = 640, H = 200, P = 28;
    const lo = Math.min(...valid), hi = Math.max(...valid);
    const span = Math.max(1, hi - lo);
    const X = (i: number) => P + (i / (elev.length - 1)) * (W - 2 * P);
    const Y = (v: number) => H - P - ((v - lo) / span) * (H - 2 * P);
    const segs: string[] = [];
    let cur = "";
    elev.forEach((v, i) => {
      if (v === null) { if (cur) { segs.push(cur); cur = ""; } return; }
      cur += `${cur ? "L" : "M"}${X(i).toFixed(1)},${Y(v).toFixed(1)}`;
    });
    if (cur) segs.push(cur);
    return { W, H, P, lo, hi, segs };
  }, [elev]);

  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-[380px,1fr]">
        <div className="card order-2 space-y-4 p-4 lg:order-1">
          <p className="text-sm text-mute">Click the map to drop route points (2 or more). Then build the profile.</p>
          <div className="flex flex-wrap gap-2">
            <button type="button" className="btn btn-primary btn-sm" onClick={buildProfile} disabled={busy || points.length < 2}>
              {busy ? <Spinner label="Sampling elevation…" /> : "Build elevation profile"}
            </button>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => { setPoints((p) => p.slice(0, -1)); setElev(null); }} disabled={!points.length}>Undo point</button>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => { setPoints([]); setElev(null); setError(null); }} disabled={!points.length}>Clear</button>
          </div>
          {error && <ErrorBox>{error}</ErrorBox>}
          <Stat label="Route" value={points.length ? `${fmt(pathKm)} km · ${points.length} points` : "no points yet"} sub="click the map to add points" />
          {stats && (
            <div className="grid grid-cols-2 gap-2 border-t border-line pt-3">
              <Stat label="Lowest" value={`${fmt(stats.min, 0)} m`} />
              <Stat label="Highest" value={`${fmt(stats.max, 0)} m`} />
              <Stat label="Total ascent" value={`${fmt(stats.gain, 0)} m`} />
              <Stat label="Total descent" value={`${fmt(stats.loss, 0)} m`} />
              <Stat label="Steepest grade" value={`${stats.steep.toFixed(1)} %`} sub="steepest sampled segment" />
              <Stat label="Samples" value={`${elev?.filter((v) => v !== null).length ?? 0} / ${elev?.length ?? 0}`} sub="successful tile reads" />
            </div>
          )}
          <p className="text-xs leading-relaxed text-mute">
            Elevations come from Terrarium tiles (SRTM-derived, ~30 m). Values are approximate — fine for
            hike and ride planning, not for surveying or engineering.
          </p>
        </div>
        <div className="order-1 lg:order-2">
          <DynamicMap
            center={{ lat: 39.5, lng: -98.3 }} zoom={3.5} className="tall"
            onReady={(map, lib) => {
              mapRef.current = map; libRef.current = lib;
              map.addSource("ep-line", { type: "geojson", data: { type: "FeatureCollection", features: [] } });
              map.addLayer({ id: "ep-line-l", type: "line", source: "ep-line", paint: { "line-color": "#d95d32", "line-width": 3 } });
              map.on("click", (e: any) => {
                setPoints((p) => [...p, { lat: e.lngLat.lat, lng: e.lngLat.lng }]);
                setElev(null); setError(null);
              });
            }}
          />
        </div>
      </div>
      {chart && (
        <div className="card p-4">
          <div className="mb-2 flex items-center justify-between">
            <span className="label !mb-0">Elevation profile</span>
            <span className="text-xs text-mute">{fmt(chart.lo, 0)} m – {fmt(chart.hi, 0)} m</span>
          </div>
          <svg viewBox={`0 0 ${chart.W} ${chart.H}`} className="w-full" role="img" aria-label="Elevation profile chart">
            {[0.25, 0.5, 0.75].map((f) => (
              <line key={f} x1={chart.P} x2={chart.W - chart.P} y1={chart.P + f * (chart.H - 2 * chart.P)} y2={chart.P + f * (chart.H - 2 * chart.P)} stroke="var(--sf-line)" strokeWidth="1" strokeDasharray="4 4" />
            ))}
            {chart.segs.map((d, i) => (
              <path key={i} d={d} fill="none" stroke="var(--sf-brand)" strokeWidth="2.5" strokeLinejoin="round" />
            ))}
          </svg>
          <div className="mt-1 flex justify-between text-xs text-mute"><span>Start</span><span>{fmt(pathKm)} km</span></div>
        </div>
      )}
    </div>
  );
}

export function DayNightTool({ params }: { params?: Record<string, unknown> }) {
  void params;
  const [now, setNow] = useState(() => new Date());
  const [live, setLive] = useState(true);
  const [clicked, setClicked] = useState<LatLng | null>(null);
  const mapRef = useRef<MLMap | null>(null);
  const [mapTick, setMapTick] = useState(0);

  useEffect(() => {
    if (!live) return;
    const t = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(t);
  }, [live]);

  const sub = useMemo(() => subsolarPoint(now), [now]);
  const anti = useMemo(() => ({ lat: -sub.lat, lng: normLng(sub.lng + 180) }), [sub]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    (map.getSource("dn-night") as GeoJSONSource | undefined)?.setData({
      type: "Feature",
      properties: {},
      geometry: { type: "Polygon", coordinates: [hemisphereRing(anti)] },
    });
    (map.getSource("dn-sub") as GeoJSONSource | undefined)?.setData({
      type: "Feature",
      properties: {},
      geometry: { type: "Point", coordinates: [sub.lng, sub.lat] },
    });
  }, [sub, anti, mapTick]);

  const sun = useMemo(() => {
    if (!clicked) return null;
    return sunTimes(clicked.lat, clicked.lng, now.getUTCFullYear(), now.getUTCMonth() + 1, now.getUTCDate());
  }, [clicked, now]);

  return (
    <div className="grid gap-4 lg:grid-cols-[380px,1fr]">
      <div className="card order-2 space-y-4 p-4 lg:order-1">
        <div className="grid grid-cols-2 gap-2">
          <Stat label="Current UTC" value={now.toISOString().slice(11, 16)} sub={now.toISOString().slice(0, 10)} />
          <Stat label="Subsolar point" value={`${sub.lat.toFixed(2)}, ${sub.lng.toFixed(2)}`} sub="Sun directly overhead" />
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" className="checkbox" checked={live} onChange={(e) => setLive(e.target.checked)} />
          Live update (every 60 s)
        </label>
        {!live && (
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => setNow(new Date())}>Refresh now</button>
        )}
        <p className="text-xs text-mute">Click anywhere on the map for today&apos;s sunrise and sunset at that point.</p>
        {clicked && sun && (
          <div className="space-y-3 border-t border-line pt-3">
            <Stat label="Clicked point" value={`${clicked.lat.toFixed(4)}, ${clicked.lng.toFixed(4)}`} />
            <div className="grid grid-cols-2 gap-2">
              <Stat label="Sunrise" value={sun.polar === "night" ? "Polar night" : fmtUtcH(sun.sunriseUTC)} />
              <Stat label="Sunset" value={sun.polar === "day" ? "Polar day" : fmtUtcH(sun.sunsetUTC)} />
            </div>
            <p className="text-xs text-mute">NOAA solar algorithm · civil sunrise/sunset (90.833° zenith). The dark overlay is the night hemisphere — its edge is the terminator line.</p>
          </div>
        )}
      </div>
      <div className="order-1 lg:order-2">
        <DynamicMap
          center={{ lat: 20, lng: 0 }} zoom={1.6} className="tall"
          onReady={(map) => {
            mapRef.current = map;
            setMapTick((t) => t + 1);
            map.addSource("dn-night", { type: "geojson", data: { type: "FeatureCollection", features: [] } });
            map.addLayer({ id: "dn-night-f", type: "fill", source: "dn-night", paint: { "fill-color": "#0b1e3a", "fill-opacity": 0.42 } });
            map.addSource("dn-sub", { type: "geojson", data: { type: "FeatureCollection", features: [] } });
            map.addLayer({
              id: "dn-sub-c", type: "circle", source: "dn-sub",
              paint: { "circle-color": "#eab308", "circle-radius": 7, "circle-stroke-color": "#fff", "circle-stroke-width": 2 },
            });
            map.on("click", (e: any) => setClicked({ lat: e.lngLat.lat, lng: e.lngLat.lng }));
          }}
        />
      </div>
    </div>
  );
}

export function MoonPositionTool({ params }: { params?: Record<string, unknown> }) {
  void params;
  const [now, setNow] = useState(() => new Date());
  const [live, setLive] = useState(true);
  const [clicked, setClicked] = useState<LatLng | null>(null);
  const mapRef = useRef<MLMap | null>(null);
  const [mapTick, setMapTick] = useState(0);

  useEffect(() => {
    if (!live) return;
    const t = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(t);
  }, [live]);

  const moon = useMemo(() => moonRaDec(now), [now]);
  const sub = useMemo(() => sublunarPoint(now), [now]);
  const phase = useMemo(() => moonPhase(now), [now]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    (map.getSource("mp-up") as GeoJSONSource | undefined)?.setData({
      type: "Feature",
      properties: {},
      geometry: { type: "Polygon", coordinates: [hemisphereRing(sub)] },
    });
    (map.getSource("mp-sub") as GeoJSONSource | undefined)?.setData({
      type: "Feature",
      properties: {},
      geometry: { type: "Point", coordinates: [sub.lng, sub.lat] },
    });
  }, [sub, mapTick]);

  const riseSet = useMemo(() => (clicked ? moonRiseSet(clicked, now) : null), [clicked, now]);
  const alt = useMemo(() => (clicked ? moonAltitude(clicked, now) : null), [clicked, now]);

  return (
    <div className="grid gap-4 lg:grid-cols-[380px,1fr]">
      <div className="card order-2 space-y-4 p-4 lg:order-1">
        <div className="flex items-center gap-4 rounded-xl bg-well px-5 py-4">
          <span className="text-5xl" aria-hidden>{phase.emoji}</span>
          <div>
            <div className="font-display text-xl font-bold">{phase.phase}</div>
            <div className="text-sm text-mute">{(phase.illumination * 100).toFixed(1)}% illuminated</div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Stat label="Distance" value={`${fmt(moon.distKm, 0)} km`} sub="Earth center to Moon center" />
          <Stat label="Sublunar point" value={`${sub.lat.toFixed(2)}, ${sub.lng.toFixed(2)}`} sub="Moon at zenith" />
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" className="checkbox" checked={live} onChange={(e) => setLive(e.target.checked)} />
          Live update (every 60 s)
        </label>
        {!live && (
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => setNow(new Date())}>Refresh now</button>
        )}
        <p className="text-xs text-mute">The highlighted region is where the Moon is currently above the horizon. Click the map for approximate moonrise/moonset at that point.</p>
        {clicked && riseSet && (
          <div className="space-y-3 border-t border-line pt-3">
            <div className="grid grid-cols-2 gap-2">
              <Stat label="Moonrise (approx)" value={fmtUtcH(riseSet.rise)} />
              <Stat label="Moonset (approx)" value={fmtUtcH(riseSet.set)} />
            </div>
            <Stat label="Current altitude" value={alt !== null ? `${alt.toFixed(1)}° ${alt >= 0 ? "above" : "below"} horizon` : "—"} sub={`${clicked.lat.toFixed(3)}, ${clicked.lng.toFixed(3)}`} />
            <p className="text-xs text-mute">Low-precision lunar theory (truncated Schlyter) — rise/set within a few minutes, fine for planning but not navigation.</p>
          </div>
        )}
      </div>
      <div className="order-1 lg:order-2">
        <DynamicMap
          center={{ lat: 20, lng: 0 }} zoom={1.6} className="tall"
          onReady={(map) => {
            mapRef.current = map;
            setMapTick((t) => t + 1);
            map.addSource("mp-up", { type: "geojson", data: { type: "FeatureCollection", features: [] } });
            map.addLayer({ id: "mp-up-f", type: "fill", source: "mp-up", paint: { "fill-color": "#eab308", "fill-opacity": 0.18 } });
            map.addLayer({ id: "mp-up-l", type: "line", source: "mp-up", paint: { "line-color": "#ca8a04", "line-width": 1.5 } });
            map.addSource("mp-sub", { type: "geojson", data: { type: "FeatureCollection", features: [] } });
            map.addLayer({
              id: "mp-sub-c", type: "circle", source: "mp-sub",
              paint: { "circle-color": "#f8fafc", "circle-radius": 7, "circle-stroke-color": "#94a3b8", "circle-stroke-width": 2 },
            });
            map.on("click", (e: any) => setClicked({ lat: e.lngLat.lat, lng: e.lngLat.lng }));
          }}
        />
      </div>
    </div>
  );
}

const IDL_NOTES: { at: LatLng; label: string }[] = [
  { at: { lat: 65.76, lng: -168.95 }, label: "Diomede Islands — 21-hour gap" },
  { at: { lat: 1.87, lng: -157.48 }, label: "Kiribati Line Islands — line jogs east" },
  { at: { lat: -13.83, lng: -171.77 }, label: "Samoa / American Samoa split" },
  { at: { lat: -43.98, lng: -176.55 }, label: "Chatham Islands — line jogs east" },
];

export function DateLineTool({ params }: { params?: Record<string, unknown> }) {
  void params;

  return (
    <div className="space-y-4">
      <div className="card p-4">
        <h2 className="font-display text-lg font-bold tracking-tight">The International Date Line</h2>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-mute">
          The International Date Line is the imaginary boundary where each new calendar day begins.
          It roughly follows the 180° meridian through the Pacific Ocean — but it zigzags around islands
          and nations to reflect local civil time choices.
        </p>
      </div>
      <DynamicMap
        center={{ lat: -5, lng: 178 }} zoom={2.4} className="tall"
        onReady={(map, lib) => {
          map.addSource("dl-line", { type: "geojson", data: { type: "FeatureCollection", features: [] } });
          map.addLayer({ id: "dl-line-l", type: "line", source: "dl-line", paint: { "line-color": "#d95d32", "line-width": 3, "line-dasharray": [2, 1.5] } });
          (map.getSource("dl-line") as GeoJSONSource | undefined)?.setData({
            type: "Feature",
            properties: {},
            geometry: { type: "LineString", coordinates: IDL_VERTICES.map(([lat, lng]) => [lng, lat]) },
          });
          IDL_NOTES.forEach((n, i) => {
            new lib.Marker({ element: pinElement(PALETTE[i % PALETTE.length], String(i + 1)) })
              .setLngLat([n.at.lng, n.at.lat]).addTo(map);
          });
        }}
      />
      <div className="grid gap-4 md:grid-cols-2">
        <div className="card space-y-2 p-4">
          <h3 className="font-display text-base font-bold">Where it bends</h3>
          <ol className="list-decimal space-y-1.5 pl-5 text-sm text-mute">
            <li><strong className="text-ink">Bering Strait</strong> — threads between Big Diomede (Russia) and Little Diomede (USA), 3.7 km apart.</li>
            <li><strong className="text-ink">Aleutian Islands</strong> — jogs west so the whole US island chain stays on the American side.</li>
            <li><strong className="text-ink">Kiribati</strong> — swings far east so the Line Islands share the same date as the capital.</li>
            <li><strong className="text-ink">Samoa</strong> — Samoa (UTC+13) sits west of the line, American Samoa (UTC−11) east of it.</li>
            <li><strong className="text-ink">Chatham Islands</strong> — jogs east to keep New Zealand&apos;s islands on the same calendar day.</li>
          </ol>
        </div>
        <div className="card space-y-2 p-4">
          <h3 className="font-display text-base font-bold">The Diomede time gap</h3>
          <p className="text-sm leading-relaxed text-mute">
            Big Diomede runs on Russian time (UTC+12) while Little Diomede, in sight across the water,
            runs on Alaska time (UTC−9 in standard time, UTC−8 during daylight saving). The offset difference is 21 or 20 hours depending on the date.
          </p>
          <h3 className="font-display text-base font-bold pt-2">Date-change facts</h3>
          <ul className="list-disc space-y-1.5 pl-5 text-sm text-mute">
            <li>Crossing westward you skip a day; crossing eastward you repeat a day.</li>
            <li>Kiritimati (Christmas Island, UTC+14) is the first inhabited place to see each new day.</li>
            <li>The line is a cartographic convention; local civil time is set by jurisdictions and may change.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

interface ZipPlace { zip: string; place: string; state: string; lat: number; lng: number }

async function lookupZip(zip: string): Promise<ZipPlace> {
  const res = await fetch(`https://api.zippopotam.us/us/${zip}`);
  if (res.status === 404) throw new Error(`ZIP code ${zip} was not found. Check the digits and try again.`);
  if (!res.ok) throw new Error(`ZIP lookup failed (${res.status}). Try again shortly.`);
  const d = await res.json();
  const p = d.places?.[0];
  if (!p) throw new Error(`No location data for ZIP ${zip}.`);
  return {
    zip,
    place: p["place name"] || "—",
    state: p["state abbreviation"] || p.state || "",
    lat: parseFloat(p.latitude),
    lng: parseFloat(p.longitude),
  };
}

export function ZipDistanceTool({ params }: { params?: Record<string, unknown> }) {
  void params;
  const [unit, setUnit] = useState<UnitKey>("mi");
  const [zipA, setZipA] = useState(() => readUrlParams().get("za") ?? "");
  const [zipB, setZipB] = useState(() => readUrlParams().get("zb") ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ a: ZipPlace; b: ZipPlace; distKm: number; bearing: number } | null>(null);
  const mapRef = useRef<MLMap | null>(null);
  const libRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);

  const valid = (z: string) => /^\d{5}$/.test(z.trim());

  const go = async () => {
    if (!valid(zipA) || !valid(zipB)) {
      setError("Enter two 5-digit US ZIP codes.");
      return;
    }
    setBusy(true); setError(null); setResult(null);
    try {
      const [a, b] = await Promise.all([lookupZip(zipA.trim()), lookupZip(zipB.trim())]);
      setResult({ a, b, distKm: distanceKm(a, b), bearing: bearingBetween(a, b) });
      syncUrl({ za: zipA.trim(), zb: zipB.trim() });
      mapRef.current?.flyTo({ center: [(a.lng + b.lng) / 2, (a.lat + b.lat) / 2], zoom: 5, essential: true });
    } catch (e: any) {
      setError(e?.message || "ZIP lookup failed. Try again.");
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    const map = mapRef.current, lib = libRef.current;
    if (!map || !lib) return;
    markersRef.current.forEach((m) => m.remove()); markersRef.current = [];
    if (!result) return;
    const { a, b } = result;
    markersRef.current.push(
      new lib.Marker({ element: pinElement("#1d6e63", "A") }).setLngLat([a.lng, a.lat]).addTo(map),
      new lib.Marker({ element: pinElement("#d95d32", "B") }).setLngLat([b.lng, b.lat]).addTo(map),
    );
    const mid = midpoint(a, b);
    markersRef.current.push(
      new lib.Marker({ element: pinElement("#8a4f9e", "M") }).setLngLat([mid.lng, mid.lat]).addTo(map),
    );
    (map.getSource("zd-line") as GeoJSONSource | undefined)?.setData({
      type: "Feature",
      properties: {},
      geometry: { type: "LineString", coordinates: [[a.lng, a.lat], [b.lng, b.lat]] },
    });
  }, [result]);

  return (
    <div className="grid gap-4 lg:grid-cols-[380px,1fr]">
      <div className="card order-2 space-y-4 p-4 lg:order-1">
        <div className="grid grid-cols-2 gap-3">
          <Field label="ZIP code A">
            <input className="input" inputMode="numeric" maxLength={5} placeholder="90210" value={zipA} onChange={(e) => setZipA(e.target.value.replace(/\D/g, ""))} />
          </Field>
          <Field label="ZIP code B">
            <input className="input" inputMode="numeric" maxLength={5} placeholder="10001" value={zipB} onChange={(e) => setZipB(e.target.value.replace(/\D/g, ""))} />
          </Field>
        </div>
        <Seg<UnitKey>
          ariaLabel="Units"
          value={unit}
          onChange={setUnit}
          options={[{ value: "mi", label: "Miles" }, { value: "km", label: "Kilometers" }]}
        />
        <button type="button" className="btn btn-primary w-full" onClick={go} disabled={busy}>
          {busy ? <Spinner label="Looking up ZIPs…" /> : "Measure distance"}
        </button>
        {error && <ErrorBox>{error}</ErrorBox>}
        {result && (
          <div className="space-y-3 border-t border-line pt-3">
            <Stat label="Straight-line distance" value={fmtDist(result.distKm, unit)} sub={`${result.a.place}, ${result.a.state} ↔ ${result.b.place}, ${result.b.state}`} />
            <div className="grid grid-cols-2 gap-2">
              <Stat label="Initial bearing" value={`${result.bearing.toFixed(1)}°`} sub={compassPoint(result.bearing)} />
              <Stat label="Midpoint" value={`${midpoint(result.a, result.b).lat.toFixed(3)}, ${midpoint(result.a, result.b).lng.toFixed(3)}`} sub="marked M on the map" />
            </div>
            <p className="text-xs text-mute">Haversine (great-circle) distance between ZIP centroids — driving distance will differ. US ZIP codes only.</p>
          </div>
        )}
      </div>
      <div className="order-1 lg:order-2">
        <DynamicMap
          center={{ lat: 39.5, lng: -98.3 }} zoom={3.5} className="tall"
          onReady={(map, lib) => {
            mapRef.current = map; libRef.current = lib;
            map.addSource("zd-line", { type: "geojson", data: { type: "FeatureCollection", features: [] } });
            map.addLayer({ id: "zd-line-l", type: "line", source: "zd-line", paint: { "line-color": "#8a4f9e", "line-width": 2.5, "line-dasharray": [3, 2] } });
          }}
        />
      </div>
    </div>
  );
}

export function CityDistanceTool({ params }: { params?: Record<string, unknown> }) {
  void params;
  const [unit, setUnit] = useState<UnitKey>("mi");
  const [from, setFrom] = useState<PlaceValue | null>(null);
  const [to, setTo] = useState<PlaceValue | null>(null);
  const mapRef = useRef<MLMap | null>(null);
  const libRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);

  const distKm = from && to ? distanceKm(from, to) : null;
  const bearing = from && to ? bearingBetween(from, to) : null;
  const mid = from && to ? midpoint(from, to) : null;

  const curve = useMemo<[number, number][]>(() => {
    if (!from || !to) return [];
    const pts: [number, number][] = [];
    for (let i = 0; i <= 64; i++) {
      const p = slerp(from, to, i / 64);
      pts.push([p.lng, p.lat]);
    }
    return pts;
  }, [from, to]);

  useEffect(() => {
    syncUrl({
      flat: from?.lat.toFixed(5) ?? null, flng: from?.lng.toFixed(5) ?? null,
      tlat: to?.lat.toFixed(5) ?? null, tlng: to?.lng.toFixed(5) ?? null, u: unit,
    });
  }, [from, to, unit]);

  useEffect(() => {
    const map = mapRef.current, lib = libRef.current;
    if (!map || !lib) return;
    markersRef.current.forEach((m) => m.remove()); markersRef.current = [];
    if (from) markersRef.current.push(new lib.Marker({ element: pinElement("#1d6e63", "A") }).setLngLat([from.lng, from.lat]).addTo(map));
    if (to) markersRef.current.push(new lib.Marker({ element: pinElement("#d95d32", "B") }).setLngLat([to.lng, to.lat]).addTo(map));
    if (mid) markersRef.current.push(new lib.Marker({ element: pinElement("#8a4f9e", "M") }).setLngLat([mid.lng, mid.lat]).addTo(map));
    (map.getSource("cd-line") as GeoJSONSource | undefined)?.setData(
      curve.length
        ? { type: "Feature", properties: {}, geometry: { type: "LineString", coordinates: curve } }
        : { type: "FeatureCollection", features: [] },
    );
    if (from && to) {
      const sw = Math.min(from.lng, to.lng), ne = Math.max(from.lng, to.lng);
      const s = Math.min(from.lat, to.lat), n = Math.max(from.lat, to.lat);
      map.fitBounds([[sw, s], [ne, n]], { padding: 60, maxZoom: 8 });
    }
  }, [from, to, mid, curve]);

  return (
    <div className="grid gap-4 lg:grid-cols-[380px,1fr]">
      <div className="card order-2 space-y-4 p-4 lg:order-1">
        <PlaceField label="From" value={from} onChange={setFrom} placeholder="First city…" />
        <PlaceField label="To" value={to} onChange={setTo} placeholder="Second city…" />
        <Seg<UnitKey>
          ariaLabel="Units"
          value={unit}
          onChange={setUnit}
          options={[{ value: "mi", label: "Miles" }, { value: "km", label: "Kilometers" }]}
        />
        {distKm !== null && bearing !== null && mid ? (
          <div className="space-y-3 border-t border-line pt-3">
            <Stat label="Straight-line distance" value={fmtDist(distKm, unit)} sub={`${from?.label ?? "A"} ↔ ${to?.label ?? "B"}`} />
            <div className="grid grid-cols-2 gap-2">
              <Stat label="Initial bearing" value={`${bearing.toFixed(1)}°`} sub={compassPoint(bearing)} />
              <Stat label="Halfway point" value={`${mid.lat.toFixed(3)}, ${mid.lng.toFixed(3)}`} sub="marked M on the map" />
            </div>
            <p className="text-xs text-mute">The curved line is the great-circle (shortest) path — this is why long flights arc toward the poles on flat maps.</p>
          </div>
        ) : (
          <p className="text-sm text-mute">Pick two cities above — the distance, bearing and great-circle route appear instantly.</p>
        )}
      </div>
      <div className="order-1 lg:order-2">
        <DynamicMap
          center={{ lat: 30, lng: 0 }} zoom={1.8} className="tall"
          onReady={(map, lib) => {
            mapRef.current = map; libRef.current = lib;
            map.addSource("cd-line", { type: "geojson", data: { type: "FeatureCollection", features: [] } });
            map.addLayer({ id: "cd-line-l", type: "line", source: "cd-line", paint: { "line-color": "#8a4f9e", "line-width": 2.5 } });
          }}
        />
      </div>
    </div>
  );
}
