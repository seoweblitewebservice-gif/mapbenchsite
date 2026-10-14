"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Map as MLMap } from "maplibre-gl";
import tzLookup from "tz-lookup";
import { moonPhase } from "@/lib/astronomy";
import { toDeg, toRad, type LatLng } from "@/lib/geo";
import { Field, Stat } from "@/components/ui";
import { DynamicMap, PlaceField, pinElement, type PlaceValue } from "./shared";

function moonRaDec(date: Date): { ra: number; dec: number; distKm: number } {
  const d = date.getTime() / 86400000 + 2440587.5 - 2451543.5;
  const N = toRad(125.1228 - 0.0529538083 * d);
  const incl = toRad(5.1454);
  const w = toRad(318.0634 + 0.1643573223 * d);
  const a = 60.2666;
  const e = 0.0549;
  const M = toRad(115.3654 + 13.064993 * d);
  let E = M + e * Math.sin(M) * (1 + e * Math.cos(M));
  for (let k = 0; k < 4; k++) E -= (E - e * Math.sin(E) - M) / (1 - e * Math.cos(E));
  const xv = a * (Math.cos(E) - e);
  const yv = a * (Math.sqrt(1 - e * e) * Math.sin(E));
  const v = Math.atan2(yv, xv);
  const r = Math.hypot(xv, yv);
  const xh = r * (Math.cos(N) * Math.cos(v + w) - Math.sin(N) * Math.sin(v + w) * Math.cos(incl));
  const yh = r * (Math.sin(N) * Math.cos(v + w) + Math.cos(N) * Math.sin(v + w) * Math.cos(incl));
  const zh = r * Math.sin(v + w) * Math.sin(incl);
  let lon = Math.atan2(yh, xh);
  let latEcl = Math.atan2(zh, Math.hypot(xh, yh));
  const Ms = toRad(356.047 + 0.9856002585 * d);
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
  const T = (jd - 2451545) / 36525;
  const g = 280.46061837 + 360.98564736629 * (jd - 2451545) + 0.000387933 * T * T - (T * T * T) / 38710000;
  return ((g % 360) + 360) % 360;
}

function moonAltitude(p: LatLng, date: Date): number {
  const { ra, dec } = moonRaDec(date);
  const H = toRad(gmstDeg(date) + p.lng - ra);
  return toDeg(Math.asin(
    Math.sin(toRad(dec)) * Math.sin(toRad(p.lat)) + Math.cos(toRad(dec)) * Math.cos(toRad(p.lat)) * Math.cos(H),
  ));
}

function eventsForDay(p: LatLng, date: Date) {
  const base = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
  let rise: number | null = null;
  let set: number | null = null;
  let transit = 0;
  let maxAlt = -90;
  let prev = moonAltitude(p, new Date(base));
  const stepMin = 5;
  const steps = (24 * 60) / stepMin;
  for (let i = 1; i <= steps; i++) {
    const t = new Date(base + i * stepMin * 60000);
    const alt = moonAltitude(p, t);
    if (prev < 0 && alt >= 0 && rise === null) rise = i * stepMin;
    if (prev >= 0 && alt < 0 && set === null) set = i * stepMin;
    if (alt > maxAlt) { maxAlt = alt; transit = i * stepMin; }
    prev = alt;
  }
  return { rise, set, transit, maxAlt };
}

function dateAtMinutes(date: Date, minutes: number | null) {
  if (minutes === null) return null;
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()) + minutes * 60000);
}

function fmtInZone(date: Date | null, zone: string) {
  if (!date) return "No event";
  return new Intl.DateTimeFormat("en-US", { timeZone: zone, hour: "numeric", minute: "2-digit", hour12: true }).format(date);
}

export default function MoonRiseSetTool() {
  const [place, setPlace] = useState<PlaceValue | null>(null);
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const mapRef = useRef<MLMap | null>(null);
  const libRef = useRef<any>(null);
  const markerRef = useRef<any>(null);

  useEffect(() => {
    const map = mapRef.current, lib = libRef.current;
    if (!map || !lib || !place) return;
    if (!markerRef.current) markerRef.current = new lib.Marker({ element: pinElement("#8a4f9e", "☾") }).addTo(map);
    markerRef.current.setLngLat([place.lng, place.lat]);
    map.flyTo({ center: [place.lng, place.lat], zoom: Math.max(6, map.getZoom()), essential: true });
  }, [place]);

  const chosenDate = useMemo(() => new Date(`${date}T12:00:00Z`), [date]);
  const zone = useMemo(() => {
    if (!place) return "UTC";
    try { return tzLookup(place.lat, place.lng); } catch { return "UTC"; }
  }, [place]);
  const events = useMemo(() => place ? eventsForDay(place, chosenDate) : null, [place, chosenDate]);
  const phase = useMemo(() => moonPhase(chosenDate), [chosenDate]);
  const moon = useMemo(() => moonRaDec(chosenDate), [chosenDate]);

  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-[410px,1fr]">
        <div className="card order-2 space-y-4 p-4 lg:order-1">
          <PlaceField label="Location" value={place} onChange={setPlace} placeholder="Search a city, address or coordinates…" />
          <Field label="Date">
            <input type="date" className="input" value={date} onChange={(e) => setDate(e.target.value)} />
          </Field>

          {place && events ? (
            <div className="space-y-4 border-t border-line pt-4">
              <div className="rounded-xl bg-well px-4 py-3">
                <div className="flex items-center gap-3">
                  <span className="text-4xl" aria-hidden>{phase.emoji}</span>
                  <div><div className="font-display text-lg font-bold">{phase.phase}</div><div className="text-xs text-mute">{(phase.illumination * 100).toFixed(1)}% illuminated · {phase.age.toFixed(1)} days old</div></div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Stat label="Moonrise" value={fmtInZone(dateAtMinutes(chosenDate, events.rise), zone)} sub={events.rise === null ? "No rise on this UTC date" : zone} />
                <Stat label="Moonset" value={fmtInZone(dateAtMinutes(chosenDate, events.set), zone)} sub={events.set === null ? "No set on this UTC date" : zone} />
                <Stat label="Upper transit" value={fmtInZone(dateAtMinutes(chosenDate, events.transit), zone)} sub={`maximum altitude ≈ ${events.maxAlt.toFixed(1)}°`} />
                <Stat label="Moon distance" value={`${Math.round(moon.distKm).toLocaleString()} km`} sub="geocentric approximation" />
              </div>
              <div className="rounded-xl border border-line bg-well/40 p-3 text-xs leading-6 text-mute">
                Rise/set is estimated by sampling the Moon&apos;s apparent altitude through the day at five-minute intervals. Local terrain, refraction near the horizon and the truncated lunar theory can shift the observed event by several minutes, so use this for planning rather than navigation.
              </div>
            </div>
          ) : <p className="text-sm text-mute">Choose a location to calculate moonrise, moonset, upper transit, phase and illumination for the selected date.</p>}
        </div>

        <div className="order-1 lg:order-2">
          <DynamicMap center={place ?? { lat: 25, lng: 0 }} zoom={place ? 6 : 1.6} className="tall" onReady={(map, lib) => {
            mapRef.current = map;
            libRef.current = lib;
            map.on("click", (e: any) => setPlace({ lat: e.lngLat.lat, lng: e.lngLat.lng, label: "Map point" }));
          }} />
        </div>
      </div>

      {place && events && (
        <div className="grid gap-4 md:grid-cols-3">
          <section className="card p-4"><h3 className="font-display text-base font-bold">Location context</h3><p className="mt-2 text-sm leading-6 text-mute">{place.label || "Selected point"}<br />{place.lat.toFixed(5)}, {place.lng.toFixed(5)}<br />IANA zone: {zone}</p></section>
          <section className="card p-4"><h3 className="font-display text-base font-bold">Why an event can be missing</h3><p className="mt-2 text-sm leading-6 text-mute">At high latitudes the Moon can remain above or below the horizon throughout a calendar day. “No event” is therefore not automatically an error.</p></section>
          <section className="card p-4"><h3 className="font-display text-base font-bold">Best use</h3><p className="mt-2 text-sm leading-6 text-mute">Useful for photography, observing, fishing, outdoor planning and deciding when the Moon will be above the horizon. For live global context, use Moon Position Map.</p></section>
        </div>
      )}
    </div>
  );
}
