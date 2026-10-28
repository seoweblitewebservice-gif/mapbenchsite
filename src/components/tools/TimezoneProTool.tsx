"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import tzlookup from "tz-lookup";
import { ErrorBox, Stat, syncUrl, readUrlParams } from "@/components/ui";
import { DynamicMap, PlaceField, pinElement, type PlaceValue } from "./shared";

const PRESETS: { label: string; lat: number; lng: number }[] = [
  { label: "New York", lat: 40.7128, lng: -74.006 },
  { label: "London", lat: 51.5074, lng: -0.1278 },
  { label: "Tokyo", lat: 35.6762, lng: 139.6503 },
  { label: "Delhi", lat: 28.6139, lng: 77.209 },
  { label: "Paris", lat: 48.8566, lng: 2.3522 },
  { label: "Sydney", lat: -33.8688, lng: 151.2093 },
];

const WORLD_CLOCKS = [
  ["New York", "America/New_York"], ["Los Angeles", "America/Los_Angeles"], ["London", "Europe/London"], ["Paris", "Europe/Paris"],
  ["Dubai", "Asia/Dubai"], ["Mumbai", "Asia/Kolkata"], ["Tokyo", "Asia/Tokyo"], ["Sydney", "Australia/Sydney"],
] as const;

function snapshot(tz: string, now = new Date()) {
  const time = new Intl.DateTimeFormat("en-US", { timeZone: tz, hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true }).format(now);
  const date = new Intl.DateTimeFormat("en-US", { timeZone: tz, weekday: "long", month: "short", day: "numeric", year: "numeric" }).format(now);
  const offsetName = new Intl.DateTimeFormat("en-US", { timeZone: tz, timeZoneName: "longOffset" }).formatToParts(now).find((p) => p.type === "timeZoneName")?.value ?? "GMT";
  const shortName = new Intl.DateTimeFormat("en-US", { timeZone: tz, timeZoneName: "short" }).formatToParts(now).find((p) => p.type === "timeZoneName")?.value ?? tz;
  const hour = Number(new Intl.DateTimeFormat("en-US", { timeZone: tz, hour: "2-digit", hourCycle: "h23" }).format(now));
  const offsetMinutes = (d: Date) => {
    const parts = new Intl.DateTimeFormat("en-CA", { timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23" }).formatToParts(d);
    const get = (type: Intl.DateTimeFormatPartTypes) => Number(parts.find((p) => p.type === type)?.value ?? 0);
    return Math.round((Date.UTC(get("year"), get("month") - 1, get("day"), get("hour"), get("minute"), get("second")) - d.getTime()) / 60000);
  };
  const current = offsetMinutes(now);
  const jan = offsetMinutes(new Date(Date.UTC(now.getUTCFullYear(), 0, 1)));
  const jul = offsetMinutes(new Date(Date.UTC(now.getUTCFullYear(), 6, 1)));
  return { time, date, offset: offsetName.replace("GMT", "UTC"), shortName, hour, offsetMinutes: current, isDst: current > Math.min(jan, jul) };
}

function diffLabel(minutes: number) {
  if (!minutes) return "Same time";
  const abs = Math.abs(minutes), h = Math.floor(abs / 60), m = abs % 60;
  return `${minutes > 0 ? "+" : "−"}${h}h${m ? ` ${m}m` : ""}`;
}

export default function TimezoneProTool() {
  const [place, setPlace] = useState<PlaceValue | null>(() => {
    const p = readUrlParams();
    const latRaw = p.get("lat"), lngRaw = p.get("lng");
    if (!latRaw?.trim() || !lngRaw?.trim()) return null;
    const lat = Number(latRaw), lng = Number(lngRaw);
    return Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180 ? { lat, lng } : null;
  });
  const [now, setNow] = useState(new Date());
  const mapRef = useRef<any>(null);
  const libRef = useRef<any>(null);
  const markerRef = useRef<any>(null);

  useEffect(() => { const id = window.setInterval(() => setNow(new Date()), 1000); return () => window.clearInterval(id); }, []);
  useEffect(() => { syncUrl({ lat: place?.lat.toFixed(5) ?? null, lng: place?.lng.toFixed(5) ?? null }); }, [place]);

  useEffect(() => {
    if (!place || !mapRef.current || !libRef.current) return;
    markerRef.current?.remove?.();
    markerRef.current = new libRef.current.Marker({ element: pinElement("#2563eb") })
      .setLngLat([place.lng, place.lat])
      .addTo(mapRef.current);
    mapRef.current.flyTo({ center: [place.lng, place.lat], zoom: Math.max(mapRef.current.getZoom(), 4), essential: true });
  }, [place]);

  const tz = useMemo(() => {
    if (!place) return null;
    try { return tzlookup(place.lat, place.lng); } catch { return null; }
  }, [place]);
  const selected = tz ? snapshot(tz, now) : null;
  const browserTz = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  const browser = snapshot(browserTz, now);
  const diff = selected ? selected.offsetMinutes - browser.offsetMinutes : 0;

  return (
    <div className="space-y-5">
      <div className="grid gap-4 lg:grid-cols-[1.15fr_.85fr]">
        <div className="rounded-2xl border border-line bg-gradient-to-br from-white to-brand-soft/30 p-4 sm:p-5">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div><div className="text-xs font-extrabold uppercase tracking-[.12em] text-brand-strong">Find any timezone</div><p className="mt-1 text-sm text-mute">Search, use GPS, paste coordinates, or click the map.</p></div>
            <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700">Instant lookup</span>
          </div>
          <PlaceField label="Location" value={place} onChange={setPlace} placeholder="Search city, state, country or ZIP…" />
          <div className="mt-4">
            <div className="mb-2 text-[11px] font-bold uppercase tracking-wide text-mute">Popular locations</div>
            <div className="flex flex-wrap gap-2">
              {PRESETS.map((p) => (
                <button key={p.label} type="button" onClick={() => setPlace(p)} className="rounded-full border border-line bg-white px-3 py-1.5 text-xs font-semibold text-mute transition hover:border-brand hover:bg-brand-soft hover:text-brand-strong">{p.label}</button>
              ))}
            </div>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-[radial-gradient(circle_at_top_right,#334155_0,#0f172a_42%,#020617_100%)] p-5 text-white shadow-xl">
          <div className="relative">
            <div className="flex items-center justify-between gap-3"><span className="text-[11px] font-extrabold uppercase tracking-[.14em] text-slate-300">Current local time</span>{selected && <span className={`rounded-full px-2.5 py-1 text-[10px] font-extrabold ${selected.isDst ? "bg-amber-300 text-amber-950" : "bg-emerald-300 text-emerald-950"}`}>{selected.isDst ? "DST likely active" : "DST not detected"}</span>}</div>
            <div className="mt-5 font-display text-4xl font-bold tracking-tight sm:text-5xl">{selected?.time ?? "--:--:--"}</div>
            <div className="mt-1 text-sm text-slate-300">{selected?.date ?? "Choose a location to begin"}</div>
            <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-xl bg-white/10 p-3"><div className="text-[10px] uppercase tracking-wider text-slate-400">IANA zone</div><div className="mt-1 break-all font-bold">{tz ?? "—"}</div></div>
              <div className="rounded-xl bg-white/10 p-3"><div className="text-[10px] uppercase tracking-wider text-slate-400">UTC offset</div><div className="mt-1 font-bold">{selected?.offset ?? "—"}</div></div>
            </div>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-line bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-line px-4 py-3"><div><div className="text-xs font-extrabold uppercase tracking-[.12em] text-brand-strong">Interactive map</div><p className="mt-0.5 text-xs text-mute">Click anywhere on land to resolve the timezone.</p></div>{place && <div className="text-xs font-semibold text-mute">{place.lat.toFixed(4)}, {place.lng.toFixed(4)}</div>}</div>
        <DynamicMap
          center={place ?? { lat: 20, lng: 10 }}
          zoom={place ? 4 : 1.5}
          className="!h-[420px] !rounded-none"
          onReady={(map, lib) => {
            mapRef.current = map;
            libRef.current = lib;
            map.on("click", (e: any) => setPlace({ lat: e.lngLat.lat, lng: e.lngLat.lng, label: "Map selection" }));
            if (place) {
              markerRef.current = new lib.Marker({ element: pinElement("#2563eb") }).setLngLat([place.lng, place.lat]).addTo(map);
            }
          }}
        />
      </div>

      {place && !tz && <ErrorBox>No timezone record exists for this point. Try a location on land away from polar/ocean areas.</ErrorBox>}

      {place && tz && selected && (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Stat label="Time zone" value={tz} sub={selected.shortName} />
            <Stat label="UTC offset" value={selected.offset} sub={selected.isDst ? "DST likely active" : "current civil offset"} />
            <Stat label="Coordinates" value={`${place.lat.toFixed(4)}, ${place.lng.toFixed(4)}`} sub="WGS84" />
            <Stat label="Vs your device" value={diffLabel(diff)} sub={diff > 0 ? "selected place is ahead" : diff < 0 ? "selected place is behind" : "same current offset"} />
          </div>

          <section className="rounded-2xl border border-line bg-gradient-to-br from-slate-50 to-white p-4 sm:p-5">
            <div className="flex items-end justify-between gap-3"><div><div className="text-xs font-extrabold uppercase tracking-[.12em] text-brand-strong">World clock</div><h3 className="mt-1 font-display text-xl font-bold">Major cities right now</h3></div><span className="text-xs text-mute">Live</span></div>
            <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8">
              {WORLD_CLOCKS.map(([city, zone]) => { const z = snapshot(zone, now); return <div key={zone} className={`rounded-xl border p-3 ${zone === tz ? "border-brand bg-brand-soft" : "border-line bg-white"}`}><div className="flex items-center justify-between"><span className="text-xs font-bold">{city}</span><span>{z.hour >= 7 && z.hour < 19 ? "☀️" : "🌙"}</span></div><div className="mt-2 font-display text-lg font-bold">{z.time.replace(/:\d{2}\s/, " ")}</div><div className="mt-1 text-[10px] text-mute">{z.offset}</div><div className="mt-2 text-[10px] font-semibold text-brand-strong">{diffLabel(z.offsetMinutes - selected.offsetMinutes)} vs selected</div></div>; })}
            </div>
          </section>

          <section className="grid gap-3 lg:grid-cols-2">
            <div className="rounded-2xl border border-line bg-white p-5 shadow-sm"><div className="text-xs font-extrabold uppercase tracking-[.12em] text-mute">Compare with your device</div><div className="mt-4 grid grid-cols-[1fr_auto_1fr] items-center gap-4"><div><div className="text-xs text-mute">Selected</div><div className="mt-1 font-display text-2xl font-bold">{selected.time.replace(/:\d{2}\s/, " ")}</div><div className="text-xs text-mute">{tz}</div></div><div className="rounded-xl bg-brand-soft px-4 py-3 text-center"><div className="font-display text-xl font-bold text-brand-strong">{diffLabel(diff)}</div><div className="text-[10px] text-mute">difference</div></div><div className="text-right"><div className="text-xs text-mute">Your device</div><div className="mt-1 font-display text-2xl font-bold">{browser.time.replace(/:\d{2}\s/, " ")}</div><div className="text-xs text-mute">{browserTz}</div></div></div></div>
            <div className="rounded-2xl border border-line bg-white p-5 shadow-sm"><div className="text-xs font-extrabold uppercase tracking-[.12em] text-mute">Timezone details</div><div className="mt-4 grid grid-cols-2 gap-3 text-sm"><div className="rounded-xl bg-well/60 p-3"><div className="text-[10px] uppercase text-mute">Abbreviation</div><div className="mt-1 font-bold">{selected.shortName}</div></div><div className="rounded-xl bg-well/60 p-3"><div className="text-[10px] uppercase text-mute">DST</div><div className="mt-1 font-bold">{selected.isDst ? "Active" : "Not active"}</div></div><div className="rounded-xl bg-well/60 p-3"><div className="text-[10px] uppercase text-mute">Day / night</div><div className="mt-1 font-bold">{selected.hour >= 7 && selected.hour < 19 ? "Daytime ☀️" : "Nighttime 🌙"}</div></div><div className="rounded-xl bg-well/60 p-3"><div className="text-[10px] uppercase text-mute">Method</div><div className="mt-1 font-bold">IANA tz geometry</div></div></div></div>
          </section>
        </>
      )}
    </div>
  );
}
