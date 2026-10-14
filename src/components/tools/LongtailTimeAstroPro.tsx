"use client";

import { useMemo, useState } from "react";
import tzlookup from "tz-lookup";
import { CopyBtn, ErrorBox, Field, Stat } from "@/components/ui";
import { PlaceField, type PlaceValue } from "./shared";
import { MoonTool, SunTool } from "./SunMoon";

const fmt = (value: number, digits = 2) => Number.isFinite(value) ? value.toFixed(digits) : "—";
const mod = (n: number, m: number) => ((n % m) + m) % m;
const rad = (d: number) => d * Math.PI / 180;
const deg = (r: number) => r * 180 / Math.PI;
const ZONES = ["UTC", "America/New_York", "Europe/London", "Asia/Kolkata", "Asia/Dubai", "Asia/Tokyo", "Australia/Sydney"];

type OverlapResult =
  | { ok: true; minutes: number; aLabel: string; bLabel: string; utc: string }
  | { ok: false; message: string };

function offset(zone: string, date: Date) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: zone,
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23",
  }).formatToParts(date);
  const values: Record<string, string> = {};
  for (const p of parts) if (p.type !== "literal") values[p.type] = p.value;
  return (Date.UTC(+values.year, +values.month - 1, +values.day, +values.hour, +values.minute, +values.second) - date.getTime()) / 60000;
}

function offsetLabel(minutes: number) {
  if (!Number.isFinite(minutes)) return "—";
  const sign = minutes >= 0 ? "+" : "-";
  const abs = Math.abs(Math.round(minutes));
  return `UTC${sign}${String(Math.floor(abs / 60)).padStart(2, "0")}:${String(abs % 60).padStart(2, "0")}`;
}

function parseTime(value: string) {
  const [h, m] = value.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
}

function wallTimeToUtc(dateStr: string, minutes: number, zone: string) {
  const [y, m, d] = dateStr.split("-").map(Number);
  const hh = Math.floor(minutes / 60), mm = minutes % 60;
  let guess = new Date(Date.UTC(y, m - 1, d, hh, mm));
  for (let i = 0; i < 3; i++) guess = new Date(Date.UTC(y, m - 1, d, hh, mm) - offset(zone, guess) * 60000);
  return guess;
}

function ZonePicker({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return <Field label={label}>
    <input className="input" value={value} onChange={(e) => onChange(e.target.value)} list="mapbench-zone-list" spellCheck={false} />
    <datalist id="mapbench-zone-list">{ZONES.map((zone) => <option key={zone} value={zone} />)}</datalist>
  </Field>;
}

export function TimeAstro2({ mode }: { mode: string }) {
  if (mode.startsWith("moon-") || mode.startsWith("next-")) return <MoonTool />;
  if (["civil-twilight", "nautical-twilight", "astronomical-twilight", "solar-noon"].includes(mode)) return <SunTool />;
  if (["sun-altitude", "sun-azimuth"].includes(mode)) return <SunPosition mode={mode} />;
  if (mode === "unix-to-local") return <UnixToLocal />;
  if (mode === "local-to-unix") return <LocalToUnix />;
  if (mode === "working-hours-overlap") return <WorkOverlap />;
  if (mode === "time-difference-zones") return <ZoneDifference />;
  return <CoordinateTime mode={mode} />;
}

function UnixToLocal() {
  const [timestamp, setTimestamp] = useState(String(Math.floor(Date.now() / 1000)));
  const [zone, setZone] = useState("UTC");
  const n = Number(timestamp);
  const date = Number.isFinite(n) ? new Date(Math.abs(n) > 1e11 ? n : n * 1000) : null;
  let error = "", local = "—", iso = "—";
  try {
    if (!date || Number.isNaN(date.getTime())) throw new Error("Enter a valid Unix timestamp.");
    local = new Intl.DateTimeFormat("en-US", { timeZone: zone, dateStyle: "full", timeStyle: "long" }).format(date);
    iso = date.toISOString();
  } catch (e) { error = e instanceof Error ? e.message : "Invalid timestamp or time zone."; }
  const seconds = date && !Number.isNaN(date.getTime()) ? Math.floor(date.getTime() / 1000) : NaN;
  const milliseconds = date && !Number.isNaN(date.getTime()) ? date.getTime() : NaN;
  const summary = error ? "" : `Local: ${local}\nUTC: ${iso}\nUnix seconds: ${seconds}\nUnix milliseconds: ${milliseconds}`;
  return <div className="space-y-4">
    <div className="card grid gap-3 p-4 md:grid-cols-[1fr_1fr_auto]">
      <Field label="Unix timestamp" hint="Seconds or milliseconds are detected automatically."><input className="input font-mono" value={timestamp} onChange={(e) => setTimestamp(e.target.value)} /></Field>
      <ZonePicker label="Display time zone" value={zone} onChange={setZone} />
      <div className="flex items-end"><button type="button" className="btn btn-ghost" onClick={() => setTimestamp(String(Math.floor(Date.now() / 1000)))}>Use now</button></div>
    </div>
    {error ? <ErrorBox>{error}</ErrorBox> : <><div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4"><Stat label="Local time" value={local} /><Stat label="UTC / ISO" value={iso} /><Stat label="Unix seconds" value={String(seconds)} /><Stat label="Unix milliseconds" value={String(milliseconds)} /></div><CopyBtn text={summary} label="Copy conversion" /></>}
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
  return <div className="space-y-4">
    <div className="card grid gap-3 p-4 md:grid-cols-2"><Field label="Local date & time"><input className="input" type="datetime-local" value={value} onChange={(e) => setValue(e.target.value)} /></Field><ZonePicker label="IANA time zone" value={zone} onChange={setZone} /></div>
    {error ? <ErrorBox>{error}</ErrorBox> : result && <><div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4"><Stat label="Unix seconds" value={String(seconds)} /><Stat label="Unix milliseconds" value={String(milliseconds)} /><Stat label="UTC / ISO" value={result.toISOString()} /><Stat label="Offset" value={offsetLabel(offset(zone, result))} /></div><CopyBtn text={`${result.toISOString()}\n${seconds}\n${milliseconds}`} label="Copy conversion" /></>}
  </div>;
}

function CoordinateTime({ mode }: { mode: string }) {
  const [place, setPlace] = useState<PlaceValue | null>({ lat: 40.7128, lng: -74.006, label: "New York" });
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  let zone = "—", currentOffset = NaN, local = "—", dst = "—", error = "";
  try {
    if (!place) throw new Error("Choose a location.");
    zone = tzlookup(place.lat, place.lng);
    const instant = new Date(`${date}T12:00:00Z`);
    currentOffset = offset(zone, instant);
    local = new Intl.DateTimeFormat("en-US", { timeZone: zone, dateStyle: "full", timeStyle: "long" }).format(instant);
    const jan = offset(zone, new Date(Date.UTC(instant.getUTCFullYear(), 0, 15, 12)));
    const jul = offset(zone, new Date(Date.UTC(instant.getUTCFullYear(), 6, 15, 12)));
    dst = currentOffset !== Math.min(jan, jul) ? "Yes" : "No";
  } catch (e) { error = e instanceof Error ? e.message : "Could not resolve the time zone."; }
  return <div className="space-y-4">
    <div className="card grid gap-4 p-4 lg:grid-cols-[1fr_220px]"><PlaceField label="Location" value={place} onChange={setPlace} placeholder="Search, use GPS or paste coordinates…" /><Field label="Date"><input className="input" type="date" value={date} onChange={(e) => setDate(e.target.value)} /></Field></div>
    {error ? <ErrorBox>{error}</ErrorBox> : <><div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4"><Stat label="IANA zone" value={zone} /><Stat label="UTC offset" value={offsetLabel(currentOffset)} /><Stat label="DST active" value={dst} /><Stat label="12:00 UTC locally" value={local} /></div><CopyBtn text={`${zone}\n${offsetLabel(currentOffset)}\nDST: ${dst}\n${local}`} label="Copy time-zone data" />{mode === "dst-checker-coordinates" && <p className="text-xs text-mute">DST is date-aware and compares the selected date&apos;s offset with the zone&apos;s seasonal offsets.</p>}</>}
  </div>;
}

function ZoneDifference() {
  const [a, setA] = useState("America/New_York"), [b, setB] = useState("Europe/London");
  const [when, setWhen] = useState(() => new Date().toISOString().slice(0, 16));
  let error = "", aOffset = NaN, bOffset = NaN, diff = NaN, aTime = "—", bTime = "—";
  try {
    const instant = new Date(`${when}:00Z`);
    aOffset = offset(a, instant); bOffset = offset(b, instant); diff = (bOffset - aOffset) / 60;
    aTime = new Intl.DateTimeFormat("en-US", { timeZone: a, dateStyle: "medium", timeStyle: "short" }).format(instant);
    bTime = new Intl.DateTimeFormat("en-US", { timeZone: b, dateStyle: "medium", timeStyle: "short" }).format(instant);
  } catch (e) { error = e instanceof Error ? e.message : "Invalid time zone."; }
  return <div className="space-y-4">
    <div className="card grid gap-3 p-4 md:grid-cols-3"><ZonePicker label="Zone A" value={a} onChange={setA} /><ZonePicker label="Zone B" value={b} onChange={setB} /><Field label="UTC instant"><input className="input" type="datetime-local" value={when} onChange={(e) => setWhen(e.target.value)} /></Field></div>
    <button type="button" className="btn btn-ghost btn-sm" onClick={() => { setA(b); setB(a); }}>Swap zones</button>
    {error ? <ErrorBox>{error}</ErrorBox> : <><div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5"><Stat label="Zone A local" value={aTime} /><Stat label="Zone A offset" value={offsetLabel(aOffset)} /><Stat label="Difference B − A" value={`${diff >= 0 ? "+" : ""}${fmt(diff)} h`} /><Stat label="Zone B offset" value={offsetLabel(bOffset)} /><Stat label="Zone B local" value={bTime} /></div><CopyBtn text={`${a}: ${aTime}\n${b}: ${bTime}\nDifference: ${fmt(diff)} h`} label="Copy comparison" /></>}
  </div>;
}

function WorkOverlap() {
  const [a, setA] = useState("America/New_York"), [b, setB] = useState("Europe/London");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [aStart, setAStart] = useState("09:00"), [aEnd, setAEnd] = useState("17:00");
  const [bStart, setBStart] = useState("09:00"), [bEnd, setBEnd] = useState("17:00");
  const result = useMemo<OverlapResult>(() => {
    try {
      const aS = wallTimeToUtc(date, parseTime(aStart), a), aE = wallTimeToUtc(date, parseTime(aEnd), a);
      const bS = wallTimeToUtc(date, parseTime(bStart), b), bE = wallTimeToUtc(date, parseTime(bEnd), b);
      const start = new Date(Math.max(aS.getTime(), bS.getTime())), end = new Date(Math.min(aE.getTime(), bE.getTime()));
      if (end <= start) return { ok: true, minutes: 0, aLabel: "No overlap", bLabel: "No overlap", utc: "No overlap" };
      const inZone = (zone: string) => `${new Intl.DateTimeFormat("en-US", { timeZone: zone, hour: "numeric", minute: "2-digit" }).format(start)}–${new Intl.DateTimeFormat("en-US", { timeZone: zone, hour: "numeric", minute: "2-digit" }).format(end)}`;
      return { ok: true, minutes: Math.round((end.getTime() - start.getTime()) / 60000), aLabel: inZone(a), bLabel: inZone(b), utc: `${start.toISOString().slice(11, 16)}–${end.toISOString().slice(11, 16)} UTC` };
    } catch (e) { return { ok: false, message: e instanceof Error ? e.message : "Invalid time zone or working hours." }; }
  }, [a, b, date, aStart, aEnd, bStart, bEnd]);
  return <div className="space-y-4">
    <div className="card grid gap-4 p-4 lg:grid-cols-2">
      <div className="space-y-3"><ZonePicker label="Team / zone A" value={a} onChange={setA} /><div className="grid grid-cols-2 gap-2"><Field label="A starts"><input className="input" type="time" value={aStart} onChange={(e) => setAStart(e.target.value)} /></Field><Field label="A ends"><input className="input" type="time" value={aEnd} onChange={(e) => setAEnd(e.target.value)} /></Field></div></div>
      <div className="space-y-3"><ZonePicker label="Team / zone B" value={b} onChange={setB} /><div className="grid grid-cols-2 gap-2"><Field label="B starts"><input className="input" type="time" value={bStart} onChange={(e) => setBStart(e.target.value)} /></Field><Field label="B ends"><input className="input" type="time" value={bEnd} onChange={(e) => setBEnd(e.target.value)} /></Field></div></div>
    </div>
    <Field label="Date"><input className="input !w-auto" type="date" value={date} onChange={(e) => setDate(e.target.value)} /></Field>
    {!result.ok ? <ErrorBox>{result.message}</ErrorBox> : <><div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4"><Stat label="Overlap duration" value={`${Math.floor(result.minutes / 60)}h ${result.minutes % 60}m`} /><Stat label="Window in A" value={result.aLabel} /><Stat label="Window in B" value={result.bLabel} /><Stat label="UTC window" value={result.utc} /></div><CopyBtn text={`${result.minutes} minutes\n${a}: ${result.aLabel}\n${b}: ${result.bLabel}\n${result.utc}`} label="Copy overlap" /></>}
  </div>;
}

function solarPosition(lat: number, lng: number, date: Date) {
  const jd = date.getTime() / 86400000 + 2440587.5, t = (jd - 2451545) / 36525;
  const l0 = mod(280.46646 + t * (36000.76983 + t * .0003032), 360), m = 357.52911 + t * (35999.05029 - .0001537 * t), e = .016708634 - t * (.000042037 + .0000001267 * t);
  const c = Math.sin(rad(m)) * (1.914602 - t * (.004817 + .000014 * t)) + Math.sin(rad(2 * m)) * (.019993 - .000101 * t) + Math.sin(rad(3 * m)) * .000289;
  const omega = 125.04 - 1934.136 * t, lambda = l0 + c - .00569 - .00478 * Math.sin(rad(omega));
  const eps0 = 23 + (26 + (21.448 - t * (46.815 + t * (.00059 - t * .001813)) / 60) / 60), eps = eps0 + .00256 * Math.cos(rad(omega));
  const dec = deg(Math.asin(Math.sin(rad(eps)) * Math.sin(rad(lambda)))), y = Math.tan(rad(eps / 2)) ** 2;
  const eot = 4 * deg(y * Math.sin(2 * rad(l0)) - 2 * e * Math.sin(rad(m)) + 4 * e * y * Math.sin(rad(m)) * Math.cos(2 * rad(l0)) - .5 * y * y * Math.sin(4 * rad(l0)) - 1.25 * e * e * Math.sin(2 * rad(m)));
  const minutes = date.getUTCHours() * 60 + date.getUTCMinutes() + date.getUTCSeconds() / 60, trueSolar = mod(minutes + eot + 4 * lng, 1440), hourAngle = trueSolar / 4 < 0 ? trueSolar / 4 + 180 : trueSolar / 4 - 180;
  const zenith = deg(Math.acos(Math.sin(rad(lat)) * Math.sin(rad(dec)) + Math.cos(rad(lat)) * Math.cos(rad(dec)) * Math.cos(rad(hourAngle))));
  const altitude = 90 - zenith, azimuth = mod(deg(Math.atan2(Math.sin(rad(hourAngle)), Math.cos(rad(hourAngle)) * Math.sin(rad(lat)) - Math.tan(rad(dec)) * Math.cos(rad(lat)))) + 180, 360);
  return { altitude, azimuth, declination: dec };
}

function compass(azimuth: number) { return ["N", "NE", "E", "SE", "S", "SW", "W", "NW"][Math.round(azimuth / 45) % 8]; }
function lightBand(altitude: number) { return altitude >= 0 ? "Sun above horizon" : altitude >= -6 ? "Civil twilight" : altitude >= -12 ? "Nautical twilight" : altitude >= -18 ? "Astronomical twilight" : "Night"; }

function SunPosition({ mode }: { mode: string }) {
  const [place, setPlace] = useState<PlaceValue | null>({ lat: 40.7128, lng: -74.006, label: "New York" });
  const [when, setWhen] = useState(() => new Date().toISOString().slice(0, 16));
  const position = place ? solarPosition(place.lat, place.lng, new Date(`${when}:00Z`)) : null;
  if (!place || !position) return <ErrorBox>Choose a valid location and UTC date/time.</ErrorBox>;
  const primary = mode === "sun-altitude" ? position.altitude : position.azimuth;
  return <div className="space-y-4">
    <div className="card grid gap-4 p-4 lg:grid-cols-[1fr_260px]"><PlaceField label="Location" value={place} onChange={setPlace} placeholder="Search, use GPS or paste coordinates…" /><Field label="UTC date & time"><input className="input" type="datetime-local" value={when} onChange={(e) => setWhen(e.target.value)} /></Field></div>
    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5"><Stat label={mode === "sun-altitude" ? "Solar altitude" : "Solar azimuth"} value={`${fmt(primary)}°`} /><Stat label="Altitude" value={`${fmt(position.altitude)}°`} /><Stat label="Azimuth" value={`${fmt(position.azimuth)}° ${compass(position.azimuth)}`} /><Stat label="Light condition" value={lightBand(position.altitude)} /><Stat label="Declination" value={`${fmt(position.declination)}°`} /></div>
    <CopyBtn text={`${place.lat.toFixed(6)}, ${place.lng.toFixed(6)}\nAltitude: ${fmt(position.altitude)}°\nAzimuth: ${fmt(position.azimuth)}°\n${lightBand(position.altitude)}`} label="Copy solar position" />
  </div>;
}
