"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { GeoJSONSource, Map as MLMap } from "maplibre-gl";
import tzlookup from "tz-lookup";
import { CopyBtn, Stat } from "@/components/ui";
import { DynamicMap, PlaceField, pinElement, type PlaceValue } from "./shared";

const PALETTE = ["#dbeafe", "#bfdbfe", "#bae6fd", "#a5f3fc", "#99f6e4", "#bbf7d0", "#d9f99d", "#fef08a", "#fed7aa", "#fecaca", "#fbcfe8", "#e9d5ff"];

function offsetMinutes(zone: string, date: Date) {
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: zone, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23" }).formatToParts(date);
  const v: Record<string, string> = {};
  for (const p of parts) if (p.type !== "literal") v[p.type] = p.value;
  return (Date.UTC(+v.year, +v.month - 1, +v.day, +v.hour, +v.minute, +v.second) - date.getTime()) / 60000;
}

function offsetLabel(minutes: number) {
  const sign = minutes >= 0 ? "+" : "-";
  const abs = Math.abs(Math.round(minutes));
  return `UTC${sign}${String(Math.floor(abs / 60)).padStart(2, "0")}:${String(abs % 60).padStart(2, "0")}`;
}

function dstActive(zone: string, date: Date) {
  const year = date.getUTCFullYear();
  const jan = offsetMinutes(zone, new Date(Date.UTC(year, 0, 15, 12)));
  const jul = offsetMinutes(zone, new Date(Date.UTC(year, 6, 15, 12)));
  const current = offsetMinutes(zone, date);
  return current !== Math.min(jan, jul);
}

function bandFeatures(now: Date) {
  const features: any[] = [];
  for (let lat = -80; lat < 85; lat += 5) {
    for (let lng = -180; lng < 180; lng += 5) {
      try {
        const zone = tzlookup(lat + 2.5, lng + 2.5);
        const off = offsetMinutes(zone, now);
        const colorIndex = Math.round((off + 720) / 120) % PALETTE.length;
        features.push({
          type: "Feature",
          properties: { zone, offset: off, label: offsetLabel(off), color: PALETTE[(colorIndex + PALETTE.length) % PALETTE.length] },
          geometry: { type: "Polygon", coordinates: [[[lng, lat], [lng + 5, lat], [lng + 5, lat + 5], [lng, lat + 5], [lng, lat]]] },
        });
      } catch { /* polar/ocean lookup gaps are skipped */ }
    }
  }
  return { type: "FeatureCollection", features } as const;
}

const CLOCKS = [
  ["New York", 40.7128, -74.006], ["London", 51.5074, -0.1278], ["Delhi", 28.6139, 77.209],
  ["Dubai", 25.2048, 55.2708], ["Tokyo", 35.6762, 139.6503], ["Sydney", -33.8688, 151.2093],
] as const;

export default function WorldTimeZoneMapTool() {
  const [place, setPlace] = useState<PlaceValue | null>({ lat: 51.5074, lng: -0.1278, label: "London" });
  const [now, setNow] = useState(() => new Date());
  const mapRef = useRef<MLMap | null>(null);
  const libRef = useRef<any>(null);
  const markerRef = useRef<any>(null);

  useEffect(() => { const timer = setInterval(() => setNow(new Date()), 1000); return () => clearInterval(timer); }, []);
  const bands = useMemo(() => bandFeatures(now), [Math.floor(now.getTime() / 3600000)]); // refresh offset surface hourly

  const info = useMemo(() => {
    if (!place) return null;
    try {
      const zone = tzlookup(place.lat, place.lng);
      const offset = offsetMinutes(zone, now);
      return {
        zone,
        offset,
        offsetText: offsetLabel(offset),
        dst: dstActive(zone, now),
        local: new Intl.DateTimeFormat("en-US", { timeZone: zone, weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit", second: "2-digit", timeZoneName: "short" }).format(now),
      };
    } catch { return null; }
  }, [place, now]);

  useEffect(() => {
    const map = mapRef.current, lib = libRef.current;
    if (!map || !lib || !place) return;
    if (!markerRef.current) markerRef.current = new lib.Marker({ element: pinElement("#111827", "T") }).addTo(map);
    markerRef.current.setLngLat([place.lng, place.lat]);
  }, [place]);

  useEffect(() => {
    const source = mapRef.current?.getSource("tz-bands") as GeoJSONSource | undefined;
    source?.setData(bands as any);
  }, [bands]);

  const worldClocks = CLOCKS.map(([name, lat, lng]) => {
    const zone = tzlookup(lat, lng), off = offsetMinutes(zone, now);
    return { name, zone, offset: offsetLabel(off), time: new Intl.DateTimeFormat("en-US", { timeZone: zone, hour: "numeric", minute: "2-digit", hour12: true }).format(now) };
  });

  const copy = info && place ? `Location: ${place.label || `${place.lat.toFixed(5)}, ${place.lng.toFixed(5)}`}\nIANA time zone: ${info.zone}\nLocal time: ${info.local}\nUTC offset: ${info.offsetText}\nDST active: ${info.dst ? "Yes" : "No"}` : "";

  return <div className="space-y-4">
    <div className="card grid gap-4 p-4 lg:grid-cols-[1fr_320px]">
      <PlaceField label="Search or choose a location" value={place} onChange={setPlace} placeholder="Search city, address, GPS or coordinates…" />
      {info ? <div className="grid grid-cols-2 gap-2"><Stat label="IANA zone" value={info.zone} /><Stat label="UTC offset" value={info.offsetText} /><Stat label="Local time" value={info.local} /><Stat label="DST active" value={info.dst ? "Yes" : "No"} /></div> : <div className="rounded-xl bg-well p-4 text-sm text-mute">Choose a point to inspect its time zone.</div>}
    </div>

    <div className="card overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-4 py-3"><div><div className="label !mb-0">Interactive world time-zone surface</div><p className="mt-1 text-xs text-mute">Click anywhere for the exact IANA zone lookup at that coordinate. The coloured background is a generalized 5° reference grid, not a legal boundary layer.</p></div>{info && <CopyBtn text={copy} label="Copy zone details" />}</div>
      <DynamicMap center={{ lat: 18, lng: 0 }} zoom={1.35} className="tall" onReady={(map, lib) => {
        mapRef.current = map; libRef.current = lib;
        map.addSource("tz-bands", { type: "geojson", data: bands as any });
        map.addLayer({ id: "tz-bands-fill", type: "fill", source: "tz-bands", paint: { "fill-color": ["get", "color"], "fill-opacity": 0.28 } });
        map.addLayer({ id: "tz-bands-line", type: "line", source: "tz-bands", paint: { "line-color": "#64748b", "line-width": 0.25, "line-opacity": 0.35 } });
        map.addLayer({ id: "tz-bands-label", type: "symbol", source: "tz-bands", minzoom: 3, layout: { "text-field": ["get", "label"], "text-size": 9 }, paint: { "text-color": "#334155", "text-halo-color": "#fff", "text-halo-width": 1 } });
        if (place) markerRef.current = new lib.Marker({ element: pinElement("#111827", "T") }).setLngLat([place.lng, place.lat]).addTo(map);
        map.on("click", (e: any) => setPlace({ lat: e.lngLat.lat, lng: e.lngLat.lng }));
      }} />
    </div>

    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-6">{worldClocks.map((c) => <div key={c.name} className="card p-3"><div className="text-[10px] font-extrabold uppercase tracking-wide text-mute">{c.name}</div><div className="mt-1 font-display text-xl font-bold">{c.time}</div><div className="mt-1 text-xs text-mute">{c.offset} · {c.zone}</div></div>)}</div>

    <div className="card p-5 sm:p-6"><h2 className="font-display text-xl font-bold">How to read this map</h2><p className="mt-3 leading-7 text-mute">Political time-zone boundaries are irregular: countries choose civil time, some regions use half-hour or quarter-hour offsets, and daylight-saving rules change with date. MapBench therefore uses the coordinate itself to resolve the IANA zone and current UTC offset. The background grid is only a fast visual guide to offset regions; the result panel is the authoritative output of this tool.</p><p className="mt-3 leading-7 text-mute">Use the map to compare cities, remote teams or travel destinations, then open the <a href="/tools/timezone-map-finder" className="font-semibold text-brand-strong hover:underline">Time Zone Finder</a> for a focused location workflow or the <a href="/tools/time-difference-between-timezones" className="font-semibold text-brand-strong hover:underline">Time Difference tool</a> to compare two named zones on a specific date.</p></div>
  </div>;
}
