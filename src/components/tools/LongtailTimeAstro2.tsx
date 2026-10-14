"use client";

import { useMemo, useState } from "react";
import tzlookup from "tz-lookup";
import { CopyBtn, ErrorBox, Field, Stat } from "@/components/ui";
import { PlaceField, type PlaceValue } from "./shared";
import { MoonTool, SunTool } from "./SunMoon";

const rad = (d: number) => d * Math.PI / 180;
const deg = (r: number) => r * 180 / Math.PI;
const fmt = (v: number, d = 2) => Number.isFinite(v) ? v.toFixed(d) : "—";
const mod = (n: number, m: number) => ((n % m) + m) % m;

function offset(zone: string, date: Date) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: zone,
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23",
  }).formatToParts(date);
  const v: Record<string, string> = {};
  for (const p of parts) if (p.type !== "literal") v[p.type] = p.value;
  return (Date.UTC(+v.year, +v.month - 1, +v.day, +v.hour, +v.minute, +v.second) - date.getTime()) / 60000;
}

function offsetLabel(minutes: number) {
  if (!Number.isFinite(minutes)) return "—";
  const sign = minutes >= 0 ? "+" : "-";
  const abs = Math.abs(Math.round(minutes));
  return `UTC${sign}${String(Math.floor(abs / 60)).padStart(2, "0")}:${String(abs % 60).padStart(2, "0")}`;
}

function wallTimeToUtc(dateStr: string, minutes: number, zone: string) {
  const [y, m, d] = dateStr.split("-").map(Number);
  const hh = Math.floor(minutes / 60), mm = minutes % 60;
  let guess = new Date(Date.UTC(y, m - 1, d, hh, mm));
  for (let i = 0; i < 3; i++) guess = new Date(Date.UTC(y, m - 1, d, hh, mm) - offset(zone, guess) * 60000);
  return guess;
}

function parseTime(value: string) {
  const [h, m] = value.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
}

const ZONE_PRESETS = ["UTC", "America/New_York", "Europe/London", "Asia/Kolkata", "Asia/Dubai", "Asia/Tokyo", "Australia/Sydney"];

export function TimeAstro2({ mode }: { mode: string }) {
  if (mode.startsWith("moon-") || mode.startsWith("next-")) return <MoonTool />;
  if (["civil-twilight", "nautical-twilight", "astronomical-twilight", "solar-noon"].includes(mode)) return <SunTool />;
  if (["sun-altitude", "sun-azimuth"].includes(mode)) return <SunPos mode={mode} />;
  return <Time mode={mode} />;
}

function Time({ mode }: { mode: string }) {
  if (mode === "unix-to-local") return <UnixToLocal />;
  if (mode === "local-to-unix") return <LocalToUnix />;
  if (mode === "working-hours-overlap") return <WorkOverlap />;
  if (mode === "time-difference-zones") return <ZoneDiff />;
  return <CoordTime mode={mode} />;
}

function ZonePicker({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return <Field label={label}>
    <input className="input" value={value} onChange={(e) => onChange(e.target.value)} list="mapbench-timezones" spellCheck={false} />
    <datalist id="mapbench-timezones">{ZONE_PRESETS.map((z) => <option key={z} value={z} />)}</datalist>
  </Field>;
}

function UnixToLocal() {
  const [ts, setTs] = useState(String(Math.floor(Date.now() / 1000)));
  const [zone, setZone] = useState("UTC");
  const parsed = Number(ts);
  const date = Number.isFinite(parsed) ? new Date(Math.abs(parsed) > 1e11 ? parsed : parsed * 1000) : null;
  let local = "—", iso = "—", error = "";
  try {
    if (!date || Number.isNaN(date.getTime())) throw new Error("Enter a valid Unix timestamp.");
    local = new Intl.DateTimeFormat("en-US", { timeZone: zone, dateStyle: "full", timeStyle: "long" }).format(date);
    iso = date.toISOString();
  } catch (e) { error = e instanceof Error ? e.message : "Invalid timestamp or time zone."; }
  const seconds = date && !Number.isNaN(date.getTime()) ? Math.floor(date.getTime() / 1000) : NaN;
  const milliseconds = date && !Number.isNaN(date.getTime()) ? date.getTime() : NaN;
  const copy = error ? "" : `Local time: ${local}\nUTC ISO: ${iso}\nUnix seconds: ${seconds}\nUnix milliseconds: ${milliseconds}\nTime zone: ${zone}`;

  return <div className="space-y-4">
    <div className="card grid gap-3 p-4 md:grid-cols-[1fr_1fr_auto]">
      <Field label="Unix timestamp" hint="Seconds or milliseconds are detected automatically."><input className="input font-mono" value={ts} onChange={(e) => setTs(e.target.value)} /></Field>
      <ZonePicker label="Display time zone" value={zone} onChange={setZone} />
      <div className="flex items-end"><button type="button" className="btn btn-ghost" onClick={() => setTs(String(Math.floor(Date.now() / 1000)))}>Use now</button></div>
    </div>
    <div className="flex flex-wrap gap-2">{ZONE_PRESETS.slice(0, 5).map((z) => <button type="button" key={z} className="btn btn-ghost btn-sm" onClick={() => setZone(z)}>{z.replace("America/", "").replace("Europe/", "").replace("Asia/", "")}</button>)}</div>
    {error ? <ErrorBox>{error}</ErrorBox> : <>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4"><Stat label="Local time" value={local} /><Stat label="UTC / ISO 8601" value={iso} /><Stat label="Unix seconds" value={String(seconds)} /><Stat label="Unix milliseconds" value={String(milliseconds)} /></div>
      <CopyBtn text={copy} label="Copy conversion" />
    </>}
  </div>;
}

function LocalToUnix() {
  const [value, setValue] = useState(() => new Date().toISOString().slice(0, 16));
  const [zone, setZone] = useState("UTC");
  let result: Date | null = null, error = "";
  try {
    const [d, t] = value.split("T"), [y, m, day] = d.split("-").map(Number), [hh, mm] = t.split(":").map(Number);
    if (![y, m, day, hh, mm].every(Number.isFinite)) throw new Error("Choose a valid local date and time.");
    let guess = new Date(Date.UTC(y, m - 1, day, hh, mm));
    for (let i = 0; i < 3; i++) guess = new Date(Date.UTC(y, m - 1, day, hh, mm) - offset(zone, guess) * 60000);
    result = guess;
  } catch (e) { error = e instanceof Error ? e.message : "Invalid local time or time zone."; }
  const seconds = result ? Math.floor(result.getTime() / 1000) : NaN;
  const milliseconds = result ? result.getTime() : NaN;
  const copy = result ? `Local input: ${value}\nTime zone: ${zone}\nUTC ISO: ${result.toISOString()}\nUnix seconds: ${seconds}\nUnix milliseconds: ${milliseconds}` : "";

  return <div className="space-y-4">
    <div className="card grid gap-3 p-4 md:grid-cols-2"><Field label="Local date & time"><input className="input" type="datetime-local" value={value} onChange={(e) => setValue(e.target.value)} /></Field><ZonePicker label="IANA time zone" value={zone} onChange={setZone} /></div>
    <div className="flex flex-wrap gap-2">{ZONE_PRESETS.map((z) => <button type="button" key={z} className="btn btn-ghost btn-sm" onClick={() => setZone(z)}>{z}</button>)}</div>
    {error ? <ErrorBox>{error}</ErrorBox> : result && <><div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4"><Stat label="Unix seconds" value={String(seconds)} /><Stat label="Unix milliseconds" value={String(milliseconds)} /><Stat label="UTC / ISO 8601" value={result.toISOString()} /><Stat label="Offset at this instant" value={offsetLabel(offset(zone, result))} /></div><CopyBtn text={copy} label="Copy conversion" /></>}
  </div>;
}

function CoordTime({ mode }: { mode: string }) {
  const [place, setPlace] = useState<PlaceValue | null>({ lat: 40.7128, lng: -74.006, label: "New York" });
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  let zone = "—", off = NaN, local = "—", dst = "—", error = "";
  try {
    if (!place) throw new Error("Choose a location.");
    zone = tzlookup(place.lat, place.lng);
    const d = new Date(`${date}T12:00:00Z`);
    off = offset(zone, d);
    local = new Intl.DateTimeFormat("en-US", { timeZone: zone, dateStyle: "full", timeStyle: "long" }).format(d);
    const jan = offset(zone, new Date(Date.UTC(d.getUTCFullYear(), 0, 15, 12)));
    const jul = offset(zone, new Date(Date.UTC(d.getUTCFullYear(), 6, 15, 12)));
    dst = off !== Math.min(jan, jul) ? "Yes" : "No";
  } catch (e) { error = e instanceof Error ? e.message : "Could not determine time zone."; }
  const copy = !error && place ? `Coordinates: ${place.lat.toFixed(6)}, ${place.lng.toFixed(6)}\nTime zone: ${zone}\nUTC offset: ${offsetLabel(off)}\nDST active: ${dst}\n12:00 UTC shown locally: ${local}` : "";

  return <div className="space-y-4">
    <div className="card grid gap-4 p-4 lg:grid-cols-[1fr_220px]"><PlaceField label="Location" value={place} onChange={setPlace} placeholder="Search a place, use GPS or paste coordinates…" /><Field label="Date"><input className="input" type="date" value={date} onChange={(e) => setDate(e.target.value)} /></Field></div>
    {error ? <ErrorBox>{error}</ErrorBox> : <>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4"><Stat label="IANA time zone" value={zone} /><Stat label="UTC offset" value={offsetLabel(off)} /><Stat label="DST active" value={dst} /><Stat label="12:00 UTC at location" value={local} /></div>
      {mode === "utc-offset-coordinates" && <p className="text-xs text-mute">Offset is date-aware, so historical/future DST changes can alter the result.</p>}
      {mode === "local-time-coordinates" && <p className="text-xs text-mute">The displayed local time converts 12:00 UTC on the selected date into the location&apos;s IANA time zone.</p>}
      {mode === "dst-checker-coordinates" && <p className="text-xs text-mute">DST status is inferred from the selected date&apos;s offset compared with the zone&apos;s winter/summer offsets.</p>}
      <CopyBtn text={copy} label="Copy location time data" />
    </>}
  </div>;
}

function ZoneDiff() {
  const [a, setA] = useState("America/New_York"), [b, setB] = useState("Europe/London");
  const [when, setWhen] = useState(() => new Date().toISOString().slice(0, 16));
  let error = "", oa = NaN, ob = NaN, diff = NaN, aTime = "—", bTime = "—";
  try {
    const d = new Date(`${when}:00Z`);
    oa = offset(a, d); ob = offset(b, d); diff = (ob - oa) / 60;
    aTime = new Intl.DateTimeFormat("en-US", { timeZone: a, dateStyle: "medium", timeStyle: "short" }).format(d);
    bTime = new Intl.DateTimeFormat("en-US", { timeZone: b, dateStyle: "medium", timeStyle: "short" }).format(d);
  } catch (e) { error = e instanceof Error ? e.message : "Invalid time zone."; }
  const copy = error ? "" : `${a}: ${aTime} (${offsetLabel(oa)})\n${b}: ${bTime} (${offsetLabel(ob)})\nDifference B − A: ${diff >= 0 ? "+" : ""}${fmt(diff, 2)} hours`;

  return <div className="space-y-4">
    <div className="card grid gap-3 p-4 md:grid-cols-3"><ZonePicker label="Time zone A" value={a} onChange={setA} /><ZonePicker label="Time zone B" value={b} onChange={setB} /><Field label="UTC instant"><input className="input" type="datetime-local" value={when} onChange={(e) => setWhen(e.target.value)} /></Field></div>
    <div className="flex flex-wrap gap-2"><button type="button" className="btn btn-ghost btn-sm" onClick={() => { setA(b); setB(a); }}>Swap zones</button><button type="button" className="btn btn-ghost btn-sm" onClick={() => setWhen(new Date().toISOString().slice(0, 16))}>Use now</button></div>
    {error ? <ErrorBox>{error}</ErrorBox> : <><div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5"><Stat label="Zone A local" value={aTime} /><Stat label="Zone A offset" value={offsetLabel(oa)} /><Stat label="Difference B − A" value={`${diff >= 0 ? "+" : ""}${fmt(diff, 2)} h`} /><Stat label="Zone B offset" value={offsetLabel(ob)} /><Stat label="Zone B local" value={bTime} /></div><CopyBtn text={copy} label="Copy comparison" /></>}
  </div>;
}

function WorkOverlap() {
  const [a, setA] = useState("America/New_York"), [b, setB] = useState("Europe/London");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [aStart, setAStart] = useState("09:00"), [aEnd, setAEnd] = useState("17:00"), [bStart, setBStart] = useState("09:00"), [bEnd, setBEnd] = useState("17:00");
  const result = useMemo(() => {
    try {
      const aS = wallTimeToUtc(date, parseTime(aStart), a), aE = wallTimeToUtc(date, parseTime(aEnd), a);
      const bS = wallTimeToUtc(date, parseTime(bStart), b), bE = wallTimeToUtc(date, parseTime(bEnd), b);
      const start = new Date(Math.max(aS.getTime(), bS.getTime())), end = new Date(Math.min(aE.getTime(), bE.getTime()));
      if (end <= start) return { ok: true, minutes: 0, aLabel: "No overlap", bLabel: "No overlap", utc: "No overlap" };
      const fmtZone = (zone: string) => `${new Intl.DateTimeFormat("en-US", { timeZone: zone, hour: "numeric", minute: "2-digit" }).format(start)}–${new Intl.DateTimeFormat("en-US", { timeZone: zone, hour: "numeric", minute: "2-digit" }).format(end)}`;
      return { ok: true, minutes: Math.round((end.getTime() - start.getTime()) / 60000), aLabel: fmtZone(a), bLabel: fmtZone(b), utc: `${start.toISOString().slice(11, 16)}–${end.toISOString().slice(11, 16)} UTC` };
    } catch (e) { return { ok: false, message: e instanceof Error ? e.message : "Invalid time zone or working hours." }; }
  }, [a, b, date, aStart, aEnd, bStart, bEnd]);

  return <div className="space-y-4">
    <div className="card grid gap-4 p-4 lg:grid-cols-2">
      <div className="space-y-3"><ZonePicker label="Team / zone A" value={a} onChange={setA} /><div className="grid grid-cols-2 gap-2"><Field label="A starts"><input className="input" type="time" value={aStart} onChange={(e) => setAStart(e.target.value)} /></Field><Field label="A ends"><input className="input" type="time" value={aEnd} onChange={(e) => setAEnd(e.target.value)} /></Field></div></div>
      <div className="space-y-3"><ZonePicker label="Team / zone B" value={b} onChange={setB} /><div className="grid grid-cols-2 gap-2"><Field label="B starts"><input className="input" type="time" value={bStart} onChange={(e) => setBStart(e.target.value)} /></Field><Field label="B ends"><input className="input" type="time" value={bEnd} onChange={(e) => setBEnd(e.target.value)} /></Field></div></div>
    </div>
    <div className="flex flex-wrap items-end gap-3"><Field label="Date"><input className="input !w-auto" type="date" value={date} onChange={(e) => setDate(e.target.value)} /></Field><button type="button" className="btn btn-ghost btn-sm" onClick={() => { setA(b); setB(a); }}>Swap zones</button></div>
    {!result.ok ? <ErrorBox>{result.message}</ErrorBox> : <><div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4"><Stat label="Overlap duration" value={`${Math.floor(result.minutes / 60)}h ${result.minutes % 60}m`} /><Stat label="Window in zone A" value={result.aLabel} /><Stat label="Window in zone B" value={result.bLabel} /><Stat label="UTC window" value={result.utc} /></div><CopyBtn text={`Overlap: ${result.minutes} minutes\n${a}: ${result.aLabel}\n${b}: ${result.bLabel}\n${result.utc}`} label="Copy overlap" /></>}
    <p className="text-xs text-mute">This compares each zone&apos;s own working-hours window on the selected date, so daylight-saving differences are date-aware.</p>
  </div>;
}

function position(lat: number, lng: number, date: Date) {
  const jd = date.getTime() / 86400000 + 2440587.5, t = (jd - 2451545) / 36525;
  const L0 = mod(280.46646 + t * (36000.76983 + t * .0003032), 360), M = 357.52911 + t * (35999.05029 - .0001537 * t), e = .016708634 - t * (.000042037 + .0000001267 * t);
  const C = Math.sin(rad(M)) * (1.914602 - t * (.004817 + .000014 * t)) + Math.sin(rad(2 * M)) * (.019993 - .000101 * t) + Math.sin(rad(3 * M)) * .000289;
  const tl = L0 + C, o = 125.04 - 1934.136 * t, lam = tl - .00569 - .00478 * Math.sin(rad(o));
  const eps0 = 23 + (26 + (21.448 - t * (46.815 + t * (.00059 - t * .001813)) / 60) / 60), eps = eps0 + .00256 * Math.cos(rad(o));
  const dec = deg(Math.asin(Math.sin(rad(eps)) * Math.sin(rad(lam)))), y = Math.tan(rad(eps / 2)) ** 2;
  const eot = 4 * deg(y * Math.sin(2 * rad(L0)) - 2 * e * Math.sin(rad(M)) + 4 * e * y * Math.sin(rad(M)) * Math.cos(2 * rad(L0)) - .5 * y * y * Math.sin(4 * rad(L0)) - 1.25 * e * e * Math.sin(2 * rad(M)));
  const mins = date.getUTCHours() * 60 + date.getUTCMinutes() + date.getUTCSeconds() / 60, ts = mod(mins + eot + 4 * lng, 1440), ha = ts / 4 < 0 ? ts / 4 + 180 : ts / 4 - 180;
  const zen = deg(Math.acos(Math.sin(rad(lat)) * Math.sin(rad(dec)) + Math.cos(rad(lat)) * Math.cos(rad(dec)) * Math.cos(rad(ha))));
  const alt = 90 - zen, az = mod(deg(Math.atan2(Math.sin(rad(ha)), Math.cos(rad(ha)) * Math.sin(rad(lat)) - Math.tan(rad(dec)) * Math.cos(rad(lat)))) + 180, 360);
  return { alt, az, dec };
}

function compass(az: number) {
  const names = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
  return names[Math.round(az / 45) % 8];
}

function lightBand(alt: number) {
  if (alt >= 0) return "Sun above horizon";
  if (alt >= -6) return "Civil twilight";
  if (alt >= -12) return "Nautical twilight";
  if (alt >= -18) return "Astronomical twilight";
  return "Night";
}

function SunPos({ mode }: { mode: string }) {
  const [place, setPlace] = useState<PlaceValue | null>({ lat: 40.7128, lng: -74.006, label: "New York" });
  const [when, setWhen] = useState(() => new Date().toISOString().slice(0, 16));
  const p = place ? position(place.lat, place.lng, new Date(`${when}:00Z`)) : null;
  const value = p ? (mode === "sun-altitude" ? p.alt : p.az) : NaN;
  const copy = p && place ? `Coordinates: ${place.lat.toFixed(6)}, ${place.lng.toFixed(6)}\nUTC instant: ${when}Z\nSolar altitude: ${p.alt.toFixed(2)}°\nSolar azimuth: ${p.az.toFixed(2)}° (${compass(p.az)})\nLight condition: ${lightBand(p.alt)}\nSolar declination: ${p.dec.toFixed(2)}°` : "";

  return <div className="space-y-4">
    <div className="card grid gap-4 p-4 lg:grid-cols-[1fr_260px]"><PlaceField label="Location" value={place} onChange={setPlace} placeholder="Search a place, use GPS or paste coordinates…" /><div><Field label="UTC date & time"><input className="input" type="datetime-local" value={when} onChange={(e) => setWhen(e.target.value)} /></Field><button type="button" className="btn btn-ghost btn-sm mt-2" onClick={() => setWhen(new Date().toISOString().slice(0, 16))}>Use current UTC</button></div></div>
    {!place || !p ? <ErrorBox>Choose a valid location and date/time.</ErrorBox> : <><div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5"><Stat label={mode === "sun-altitude" ? "Solar altitude" : "Solar azimuth"} value={`${fmt(value, 2)}°`} /><Stat label="Solar altitude" value={`${fmt(p.alt, 2)}°`} /><Stat label="Solar azimuth" value={`${fmt(p.az, 2)}° ${compass(p.az)}`} /><Stat label="Light condition" value={lightBand(p.alt)} /><Stat label="Solar declination" value={`${fmt(p.dec, 2)}°`} /></div><CopyBtn text={copy} label="Copy solar position" /></>}
  </div>;
}
