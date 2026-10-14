"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Map as MLMap } from "maplibre-gl";
import tzlookup from "tz-lookup";
import { sunTimes, hourAngleTimes, fmtDurationHours, moonPhase } from "@/lib/astronomy";
import { readUrlParams, syncUrl, Field, Stat, ErrorBox, CopyBtn } from "@/components/ui";
import { DynamicMap, PlaceField, pinElement, type PlaceValue } from "./shared";

function fmtUtc(hours: number | null): string {
  if (hours === null || !Number.isFinite(hours)) return "—";
  const h = ((hours % 24) + 24) % 24;
  const hh = Math.floor(h), mm = Math.round((h - hh) * 60) % 60;
  return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")} UTC`;
}

function dateParts(dateStr: string) {
  const [y, m, d] = dateStr.split("-").map(Number);
  return { y, m, d };
}

function eventDate(dateStr: string, hours: number | null) {
  if (hours === null || !Number.isFinite(hours)) return null;
  const { y, m, d } = dateParts(dateStr);
  return new Date(Date.UTC(y, m - 1, d) + hours * 3600000);
}

function localTime(dateStr: string, hours: number | null, tz: string | null) {
  const event = eventDate(dateStr, hours);
  if (!event || !tz) return "";
  return new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZoneName: "short",
  }).format(event);
}

function shiftIsoDate(dateStr: string, days: number) {
  const { y, m, d } = dateParts(dateStr);
  const date = new Date(Date.UTC(y, m - 1, d + days));
  return date.toISOString().slice(0, 10);
}

function deltaDaylight(current: number | null, previous: number | null) {
  if (current == null || previous == null) return "—";
  const minutes = Math.round((current - previous) * 60);
  if (minutes === 0) return "No change";
  return `${minutes > 0 ? "+" : ""}${minutes} min vs yesterday`;
}

export function SunTool() {
  const [place, setPlace] = useState<PlaceValue | null>(() => {
    const p = readUrlParams();
    const lat = parseFloat(p.get("lat") ?? ""), lng = parseFloat(p.get("lng") ?? "");
    return Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : null;
  });
  const [dateStr, setDateStr] = useState(() => readUrlParams().get("date") ?? new Date().toISOString().slice(0, 10));
  const mapRef = useRef<MLMap | null>(null);
  const libRef = useRef<any>(null);
  const markerRef = useRef<any>(null);

  useEffect(() => {
    syncUrl({ lat: place?.lat.toFixed(5) ?? null, lng: place?.lng.toFixed(5) ?? null, date: dateStr });
  }, [place, dateStr]);

  useEffect(() => {
    if (!place || !mapRef.current || !libRef.current) return;
    if (!markerRef.current) {
      markerRef.current = new libRef.current.Marker({ element: pinElement("#d97706"), draggable: true })
        .setLngLat([place.lng, place.lat])
        .addTo(mapRef.current);
      markerRef.current.on("dragend", () => {
        const ll = markerRef.current.getLngLat();
        setPlace({ lat: ll.lat, lng: ll.lng });
      });
    } else markerRef.current.setLngLat([place.lng, place.lat]);
  }, [place]);

  const result = useMemo(() => {
    if (!place) return null;
    const { y, m, d } = dateParts(dateStr);
    if (!y || !m || !d) return null;
    const main = sunTimes(place.lat, place.lng, y, m, d);
    const previousDate = shiftIsoDate(dateStr, -1);
    const p = dateParts(previousDate);
    const previous = sunTimes(place.lat, place.lng, p.y, p.m, p.d);
    return {
      main,
      previous,
      civil: hourAngleTimes(place.lat, place.lng, y, m, d, 96),
      nautical: hourAngleTimes(place.lat, place.lng, y, m, d, 102),
      astronomical: hourAngleTimes(place.lat, place.lng, y, m, d, 108),
    };
  }, [place, dateStr]);

  const tz = useMemo(() => {
    if (!place) return null;
    try { return tzlookup(place.lat, place.lng); } catch { return null; }
  }, [place]);

  const week = useMemo(() => {
    if (!place) return [];
    return Array.from({ length: 7 }, (_, i) => {
      const iso = shiftIsoDate(dateStr, i - 3);
      const { y, m, d } = dateParts(iso);
      return { iso, ...sunTimes(place.lat, place.lng, y, m, d) };
    });
  }, [place, dateStr]);

  const copySummary = result && place ? [
    `Location: ${place.label || `${place.lat.toFixed(5)}, ${place.lng.toFixed(5)}`}`,
    `Date: ${dateStr}`,
    `Timezone: ${tz ?? "unknown"}`,
    `Sunrise: ${localTime(dateStr, result.main.sunriseUTC, tz) || fmtUtc(result.main.sunriseUTC)}`,
    `Sunset: ${localTime(dateStr, result.main.sunsetUTC, tz) || fmtUtc(result.main.sunsetUTC)}`,
    `Solar noon: ${localTime(dateStr, result.main.solarNoonUTC, tz) || fmtUtc(result.main.solarNoonUTC)}`,
    `Day length: ${fmtDurationHours(result.main.dayLengthHours)}`,
  ].join("\n") : "";

  return (
    <div className="space-y-4">
      <div className="card grid gap-4 p-4 lg:grid-cols-[1fr_220px]">
        <PlaceField label="Location" value={place} onChange={setPlace} placeholder="Search a city, address or use your location…" />
        <div>
          <Field label="Date">
            <input type="date" className="input" value={dateStr} max="2100-12-31" min="1900-01-01" onChange={(e) => setDateStr(e.target.value)} />
          </Field>
          <div className="mt-2 grid grid-cols-3 gap-1.5">
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setDateStr(shiftIsoDate(dateStr, -1))}>← Day</button>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setDateStr(new Date().toISOString().slice(0, 10))}>Today</button>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setDateStr(shiftIsoDate(dateStr, 1))}>Day →</button>
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
        <div className="card overflow-hidden">
          <div className="border-b border-line px-4 py-3">
            <div className="label !mb-0">Pick the exact location</div>
            <p className="mt-1 text-xs text-mute">Click the map or drag the marker. Sunrise and twilight recalculate instantly.</p>
          </div>
          <DynamicMap
            center={place ?? { lat: 20, lng: 0 }}
            zoom={place ? 8 : 2}
            className="tall"
            onReady={(map, lib) => {
              mapRef.current = map;
              libRef.current = lib;
              if (place) {
                markerRef.current = new lib.Marker({ element: pinElement("#d97706"), draggable: true })
                  .setLngLat([place.lng, place.lat])
                  .addTo(map);
                markerRef.current.on("dragend", () => {
                  const ll = markerRef.current.getLngLat();
                  setPlace({ lat: ll.lat, lng: ll.lng });
                });
              }
              map.on("click", (e: any) => setPlace({ lat: e.lngLat.lat, lng: e.lngLat.lng }));
            }}
          />
        </div>

        <div className="space-y-3">
          {result ? (
            <>
              <div className="grid grid-cols-2 gap-2">
                <Stat label="Sunrise" value={result.main.polar === "night" ? "Polar night" : (localTime(dateStr, result.main.sunriseUTC, tz) || fmtUtc(result.main.sunriseUTC))} sub={fmtUtc(result.main.sunriseUTC)} />
                <Stat label="Sunset" value={result.main.polar === "day" ? "Polar day" : (localTime(dateStr, result.main.sunsetUTC, tz) || fmtUtc(result.main.sunsetUTC))} sub={fmtUtc(result.main.sunsetUTC)} />
                <Stat label="Solar noon" value={localTime(dateStr, result.main.solarNoonUTC, tz) || fmtUtc(result.main.solarNoonUTC)} sub={`${result.main.declination.toFixed(2)}° solar declination`} />
                <Stat label="Day length" value={fmtDurationHours(result.main.dayLengthHours)} sub={deltaDaylight(result.main.dayLengthHours, result.previous.dayLengthHours)} />
              </div>
              <div className="card p-4">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <div className="label !mb-0">Location context</div>
                    <div className="mt-1 text-sm font-semibold">{tz ?? "Timezone unavailable"}</div>
                  </div>
                  <CopyBtn text={copySummary} label="Copy results" />
                </div>
                <div className="mt-3 text-xs text-mute">{place?.lat.toFixed(5)}, {place?.lng.toFixed(5)} · astronomical times use NOAA-style solar geometry.</div>
              </div>
            </>
          ) : (
            <div className="card p-5 text-sm text-mute">Choose a location to calculate sunrise, sunset, twilight and daylight duration.</div>
          )}
        </div>
      </div>

      {result && (
        <>
          <div className="card p-4">
            <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
              <div><div className="label !mb-0">Twilight timeline</div><p className="mt-1 text-xs text-mute">Civil, nautical and astronomical twilight use standard solar depression angles of 6°, 12° and 18°.</p></div>
            </div>
            <div className="overflow-x-auto">
              <table className="tbl min-w-[680px]">
                <thead><tr><th>Event</th><th>Morning</th><th>Evening</th><th>UTC morning</th><th>UTC evening</th></tr></thead>
                <tbody>
                  {[
                    ["Astronomical twilight", result.astronomical.rise, result.astronomical.set],
                    ["Nautical twilight", result.nautical.rise, result.nautical.set],
                    ["Civil twilight", result.civil.rise, result.civil.set],
                    ["Sunrise / sunset", result.main.sunriseUTC, result.main.sunsetUTC],
                  ].map(([label, rise, set]) => (
                    <tr key={String(label)}>
                      <td className="font-semibold">{label}</td>
                      <td>{localTime(dateStr, rise as number | null, tz) || "—"}</td>
                      <td>{localTime(dateStr, set as number | null, tz) || "—"}</td>
                      <td>{fmtUtc(rise as number | null)}</td>
                      <td>{fmtUtc(set as number | null)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="card p-4">
            <div className="label">7-day daylight comparison</div>
            <div className="mt-2 overflow-x-auto">
              <table className="tbl min-w-[620px]">
                <thead><tr><th>Date</th><th>Sunrise</th><th>Sunset</th><th>Daylight</th></tr></thead>
                <tbody>
                  {week.map((day) => (
                    <tr key={day.iso} className={day.iso === dateStr ? "bg-brand-soft" : ""}>
                      <td className="font-semibold">{new Date(`${day.iso}T12:00:00Z`).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", timeZone: "UTC" })}</td>
                      <td>{localTime(day.iso, day.sunriseUTC, tz) || fmtUtc(day.sunriseUTC)}</td>
                      <td>{localTime(day.iso, day.sunsetUTC, tz) || fmtUtc(day.sunsetUTC)}</td>
                      <td>{fmtDurationHours(day.dayLengthHours)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {result?.main.polar && (
        <ErrorBox>
          {result.main.polar === "day"
            ? "The Sun stays above the horizon all day at this location and date (midnight sun)."
            : "The Sun stays below the horizon all day at this location and date (polar night)."}
        </ErrorBox>
      )}
    </div>
  );
}

export function MoonTool() {
  const [dateStr, setDateStr] = useState(() => readUrlParams().get("date") ?? new Date().toISOString().slice(0, 10));
  useEffect(() => { syncUrl({ date: dateStr }); }, [dateStr]);

  const selectedDate = useMemo(() => {
    const { y, m, d } = dateParts(dateStr);
    return new Date(Date.UTC(y, m - 1, d, 12));
  }, [dateStr]);
  const info = useMemo(() => moonPhase(selectedDate), [selectedDate]);

  const calendar = useMemo(() => Array.from({ length: 30 }, (_, i) => {
    const date = new Date(selectedDate.getTime() + (i - 7) * 86400000);
    return { date, info: moonPhase(date) };
  }), [selectedDate]);

  const daysUntilFull = Math.max(0, Math.round((info.nextFullMoon.getTime() - selectedDate.getTime()) / 86400000 * 10) / 10);
  const daysUntilNew = Math.max(0, Math.round((info.nextNewMoon.getTime() - selectedDate.getTime()) / 86400000 * 10) / 10);
  const phaseAngle = (info.age / 29.530588853) * 360;
  const copySummary = `Date: ${dateStr}\nPhase: ${info.phase}\nIllumination: ${(info.illumination * 100).toFixed(1)}%\nMoon age: ${info.age.toFixed(1)} days\nPhase angle: ${phaseAngle.toFixed(1)}°\nNext full moon: ${info.nextFullMoon.toISOString()}\nNext new moon: ${info.nextNewMoon.toISOString()}`;

  return (
    <div className="space-y-4">
      <div className="card grid gap-4 p-4 lg:grid-cols-[260px_1fr]">
        <div>
          <Field label="Date"><input type="date" className="input" value={dateStr} onChange={(e) => setDateStr(e.target.value)} /></Field>
          <div className="mt-2 grid grid-cols-3 gap-1.5">
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setDateStr(shiftIsoDate(dateStr, -1))}>← Day</button>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setDateStr(new Date().toISOString().slice(0, 10))}>Today</button>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setDateStr(shiftIsoDate(dateStr, 1))}>Day →</button>
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-line bg-gradient-to-br from-well to-card px-5 py-4">
          <div className="flex items-center gap-4">
            <span className="text-6xl" aria-hidden>{info.emoji}</span>
            <div><div className="font-display text-2xl font-bold">{info.phase}</div><div className="mt-1 text-sm text-mute">{(info.illumination * 100).toFixed(1)}% illuminated · lunar day {info.age.toFixed(1)}</div></div>
          </div>
          <CopyBtn text={copySummary} label="Copy phase data" />
        </div>
      </div>

      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
        <Stat label="Illumination" value={`${(info.illumination * 100).toFixed(1)}%`} />
        <Stat label="Moon age" value={`${info.age.toFixed(1)} days`} />
        <Stat label="Phase angle" value={`${phaseAngle.toFixed(1)}°`} />
        <Stat label="Next full moon" value={info.nextFullMoon.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" })} sub={`${daysUntilFull} days away`} />
        <Stat label="Next new moon" value={info.nextNewMoon.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" })} sub={`${daysUntilNew} days away`} />
      </div>

      <div className="card p-4">
        <div className="mb-3"><div className="label !mb-0">30-day phase calendar</div><p className="mt-1 text-xs text-mute">Seven days before the selected date through 22 days after it. Click any day to inspect it.</p></div>
        <div className="grid grid-cols-5 gap-2 sm:grid-cols-10 lg:grid-cols-15">
          {calendar.map(({ date, info: dayInfo }) => {
            const iso = date.toISOString().slice(0, 10);
            const active = iso === dateStr;
            return (
              <button key={iso} type="button" onClick={() => setDateStr(iso)} className={`rounded-xl border p-2 text-center transition ${active ? "border-brand bg-brand-soft" : "border-line bg-card hover:bg-well"}`} title={`${dayInfo.phase} · ${(dayInfo.illumination * 100).toFixed(0)}% illuminated`}>
                <div className="text-[10px] font-semibold text-mute">{date.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" })}</div>
                <div className="my-1 text-2xl" aria-hidden>{dayInfo.emoji}</div>
                <div className="text-[10px] text-mute">{(dayInfo.illumination * 100).toFixed(0)}%</div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="card p-5">
        <h3 className="font-display text-lg font-bold">How to read the lunar cycle</h3>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ["🌑 New Moon", "Moon near the Sun in the sky; the illuminated side faces mostly away from Earth."],
            ["🌓 First Quarter", "Roughly half illuminated and commonly visible from afternoon into evening."],
            ["🌕 Full Moon", "Opposite the Sun in the sky; rises around sunset and sets around sunrise."],
            ["🌗 Last Quarter", "Half illuminated again, most prominent from late night into morning."],
          ].map(([title, text]) => <div key={title} className="rounded-xl border border-line bg-well/35 p-3"><div className="font-semibold">{title}</div><p className="mt-1 text-xs leading-relaxed text-mute">{text}</p></div>)}
        </div>
        <p className="mt-4 text-xs text-mute">Phase and illumination are global geometric properties. Local moonrise/moonset and apparent orientation depend on location, horizon and date.</p>
      </div>
    </div>
  );
}
