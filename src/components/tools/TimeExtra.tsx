"use client";
import { useEffect, useMemo, useState } from "react";
import tzlookup from "tz-lookup";
import { sunTimes, hourAngleTimes, fmtDurationHours } from "@/lib/astronomy";
import { readUrlParams, syncUrl, Field, Stat, ErrorBox } from "@/components/ui";
import { PlaceField, type PlaceValue } from "./shared";

function zoneSnapshot(tz: string, now = new Date()) {
  try {
    const time = new Intl.DateTimeFormat("en-US", { timeZone: tz, hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true }).format(now);
    const date = new Intl.DateTimeFormat("en-US", { timeZone: tz, weekday: "short", month: "short", day: "numeric", year: "numeric" }).format(now);
    const offsetName = new Intl.DateTimeFormat("en-US", { timeZone: tz, timeZoneName: "longOffset" }).formatToParts(now).find((p) => p.type === "timeZoneName")?.value ?? "GMT";
    const shortName = new Intl.DateTimeFormat("en-US", { timeZone: tz, timeZoneName: "short" }).formatToParts(now).find((p) => p.type === "timeZoneName")?.value ?? tz;
    const hour = Number(new Intl.DateTimeFormat("en-US", { timeZone: tz, hour: "2-digit", hourCycle: "h23" }).format(now));
    const jan = new Date(Date.UTC(now.getUTCFullYear(), 0, 1));
    const jul = new Date(Date.UTC(now.getUTCFullYear(), 6, 1));
    const offsetMinutes = (d: Date) => {
      const parts = new Intl.DateTimeFormat("en-CA", { timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23" }).formatToParts(d);
      const get = (type: Intl.DateTimeFormatPartTypes) => Number(parts.find((p) => p.type === type)?.value ?? 0);
      const asUTC = Date.UTC(get("year"), get("month") - 1, get("day"), get("hour"), get("minute"), get("second"));
      return Math.round((asUTC - d.getTime()) / 60000);
    };
    const currentOffset = offsetMinutes(now);
    const standard = Math.min(offsetMinutes(jan), offsetMinutes(jul));
    return { time, date, offset: offsetName.replace("GMT", "UTC"), shortName, isDst: currentOffset > standard, hour, offsetMinutes: currentOffset };
  } catch {
    return { time: "—", date: "—", offset: "—", shortName: tz, isDst: false, hour: 12, offsetMinutes: 0 };
  }
}

const WORLD_CLOCKS = [
  ["New York", "America/New_York"], ["Los Angeles", "America/Los_Angeles"], ["London", "Europe/London"], ["Paris", "Europe/Paris"],
  ["Dubai", "Asia/Dubai"], ["Mumbai", "Asia/Kolkata"], ["Tokyo", "Asia/Tokyo"], ["Sydney", "Australia/Sydney"],
] as const;

function offsetDiffLabel(minutes: number) {
  if (!minutes) return "same time";
  const abs = Math.abs(minutes);
  const h = Math.floor(abs / 60), m = abs % 60;
  return `${minutes > 0 ? "+" : "−"}${h}h${m ? ` ${m}m` : ""}`;
}

export function TimezoneTool() {
  const [place, setPlace] = useState<PlaceValue | null>(() => {
    const p = readUrlParams();
    const lat = parseFloat(p.get("lat") ?? ""), lng = parseFloat(p.get("lng") ?? "");
    return Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : null;
  });
  const [now, setNow] = useState(() => new Date());
  useEffect(() => { const t = setInterval(() => setNow(new Date()), 1000); return () => clearInterval(t); }, []);
  useEffect(() => { syncUrl({ lat: place?.lat.toFixed(5) ?? null, lng: place?.lng.toFixed(5) ?? null }); }, [place]);

  const tz = useMemo(() => {
    if (!place) return null;
    try { return tzlookup(place.lat, place.lng); } catch { return null; }
  }, [place]);
  const selected = tz ? zoneSnapshot(tz, now) : null;
  const browserTz = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  const browser = zoneSnapshot(browserTz, now);
  const diff = selected ? selected.offsetMinutes - browser.offsetMinutes : 0;

  return (
    <div className="space-y-5">
      <div className="grid gap-4 lg:grid-cols-[1.25fr_.75fr]">
        <div className="rounded-2xl border border-line bg-gradient-to-br from-white to-brand-soft/30 p-4 sm:p-5">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div><div className="text-xs font-extrabold uppercase tracking-[0.12em] text-brand-strong">Find any timezone</div><p className="mt-1 text-sm text-mute">Search a place, use GPS, or paste coordinates.</p></div>
            <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700">Local lookup</span>
          </div>
          <PlaceField label="Any place on Earth" value={place} onChange={setPlace} placeholder="Search a city, state, ZIP or paste lat, lng…" />
          <div className="mt-4 flex flex-wrap gap-2 text-xs">
            {["New York","London","Tokyo","Delhi","Paris","Sydney"].map((label) => <span key={label} className="rounded-full border border-line bg-white px-3 py-1.5 text-mute">{label}</span>)}
          </div>
        </div>

        <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-[radial-gradient(circle_at_top_right,#334155_0,#0f172a_42%,#020617_100%)] p-5 text-white shadow-xl">
          <div className="absolute -right-10 -top-10 h-36 w-36 rounded-full border border-white/10" />
          <div className="absolute -right-2 top-8 h-20 w-20 rounded-full border border-white/10" />
          <div className="relative">
            <div className="flex items-center justify-between gap-3"><span className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-slate-300">Current local time</span>{selected && <span className={`rounded-full px-2.5 py-1 text-[10px] font-extrabold ${selected.isDst ? "bg-amber-300 text-amber-950" : "bg-emerald-300 text-emerald-950"}`}>{selected.isDst ? "DST active" : "No DST"}</span>}</div>
            <div className="mt-5 font-display text-4xl font-bold tracking-tight sm:text-5xl">{selected?.time ?? "--:--:--"}</div>
            <div className="mt-1 text-sm text-slate-300">{selected?.date ?? "Choose a location to begin"}</div>
            <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-xl bg-white/8 p-3"><div className="text-[10px] uppercase tracking-wider text-slate-400">IANA zone</div><div className="mt-1 break-all font-bold">{tz ?? "—"}</div></div>
              <div className="rounded-xl bg-white/8 p-3"><div className="text-[10px] uppercase tracking-wider text-slate-400">UTC offset</div><div className="mt-1 font-bold">{selected?.offset ?? "—"}</div></div>
            </div>
          </div>
        </div>
      </div>

      {tz && selected && place && (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Stat label="Time zone" value={<span className="text-base">{tz}</span>} sub={selected.shortName} />
            <Stat label="UTC offset" value={selected.offset} sub={selected.isDst ? "daylight saving currently active" : "current standard/civil offset"} />
            <Stat label="Coordinates" value={`${place.lat.toFixed(4)}, ${place.lng.toFixed(4)}`} sub="WGS84 latitude, longitude" />
            <Stat label="Compared with your device" value={offsetDiffLabel(diff)} sub={diff === 0 ? "same current offset" : diff > 0 ? "selected place is ahead" : "selected place is behind"} />
          </div>

          <section className="rounded-2xl border border-line bg-gradient-to-br from-slate-50 to-white p-4 sm:p-5">
            <div className="flex flex-wrap items-end justify-between gap-3"><div><div className="text-xs font-extrabold uppercase tracking-[0.12em] text-brand-strong">World clock</div><h3 className="mt-1 font-display text-xl font-bold">Compare major cities instantly</h3></div><div className="text-xs text-mute">Live · updates every second</div></div>
            <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8">
              {WORLD_CLOCKS.map(([city, zone]) => {
                const z = zoneSnapshot(zone, now);
                const localDiff = z.offsetMinutes - selected.offsetMinutes;
                return <div key={zone} className={`rounded-xl border p-3 transition-all ${zone === tz ? "border-brand bg-brand-soft shadow-sm" : "border-line bg-white"}`}><div className="flex items-center justify-between gap-2"><div className="text-xs font-bold">{city}</div><span className="text-sm" aria-hidden>{z.hour >= 7 && z.hour < 19 ? "☀️" : "🌙"}</span></div><div className="mt-2 font-display text-lg font-bold">{z.time.replace(/:\d{2}\s/, " ")}</div><div className="mt-1 text-[10px] text-mute">{z.offset}</div><div className="mt-2 text-[10px] font-semibold text-brand-strong">{offsetDiffLabel(localDiff)} vs selected</div></div>;
              })}
            </div>
          </section>

          <section className="grid gap-3 lg:grid-cols-2">
            <div className="rounded-2xl border border-line bg-white p-5 shadow-sm"><div className="text-xs font-extrabold uppercase tracking-[0.12em] text-mute">Compare with your local time</div><div className="mt-4 flex items-center justify-between gap-4"><div><div className="text-xs text-mute">Selected location</div><div className="mt-1 font-display text-2xl font-bold">{selected.time.replace(/:\d{2}\s/, " ")}</div><div className="text-xs text-mute">{tz}</div></div><div className="rounded-xl bg-brand-soft px-4 py-3 text-center"><div className="font-display text-xl font-bold text-brand-strong">{offsetDiffLabel(diff)}</div><div className="text-[10px] font-semibold text-mute">{diff > 0 ? "ahead" : diff < 0 ? "behind" : "same time"}</div></div><div className="text-right"><div className="text-xs text-mute">Your device</div><div className="mt-1 font-display text-2xl font-bold">{browser.time.replace(/:\d{2}\s/, " ")}</div><div className="text-xs text-mute">{browserTz}</div></div></div></div>
            <div className="rounded-2xl border border-line bg-white p-5 shadow-sm"><div className="text-xs font-extrabold uppercase tracking-[0.12em] text-mute">Timezone details</div><div className="mt-4 grid grid-cols-2 gap-3 text-sm"><div className="rounded-xl bg-well/60 p-3"><div className="text-[10px] uppercase text-mute">Abbreviation</div><div className="mt-1 font-bold">{selected.shortName}</div></div><div className="rounded-xl bg-well/60 p-3"><div className="text-[10px] uppercase text-mute">Daylight saving</div><div className="mt-1 font-bold">{selected.isDst ? "Active now" : "Not active"}</div></div><div className="rounded-xl bg-well/60 p-3"><div className="text-[10px] uppercase text-mute">Day / night</div><div className="mt-1 font-bold">{selected.hour >= 7 && selected.hour < 19 ? "Daytime ☀️" : "Nighttime 🌙"}</div></div><div className="rounded-xl bg-well/60 p-3"><div className="text-[10px] uppercase text-mute">Lookup method</div><div className="mt-1 font-bold">tz database geometry</div></div></div></div>
          </section>
        </>
      )}
      {place && !tz && <ErrorBox>No timezone record exists for this point (open ocean or polar areas).</ErrorBox>}
      <div className="rounded-xl border border-line bg-well/40 px-4 py-3 text-xs leading-relaxed text-mute">Timezone boundaries come from the open tz database geometry bundled with the tool. The IANA zone is resolved locally; live clock and UTC offset use your browser&apos;s Intl timezone engine.</div>
    </div>
  );
}

export function MeetingTool() {
  const [cities, setCities] = useState<PlaceValue[]>([]);
  const tzs = useMemo(() => cities.map((c) => { try { return { ...c, tz: tzlookup(c.lat, c.lng) }; } catch { return { ...c, tz: "UTC" }; } }), [cities]);
  const grid = useMemo(() => {
    const hours = Array.from({ length: 24 }, (_, h) => h);
    const rows = tzs.map((c) => { const local = hours.map((h) => { const d = new Date(); d.setUTCMinutes(0, 0, 0); d.setUTCHours(h); return parseInt(new Intl.DateTimeFormat("en-US", { timeZone: c.tz, hour: "numeric", hourCycle: "h23" }).format(d), 10); }); return { ...c, local }; });
    return { rows, overlap: hours.filter((h) => rows.every((r) => r.local[h] >= 9 && r.local[h] < 17)) };
  }, [tzs]);
  return <div className="space-y-4"><div className="card space-y-3 p-4">{cities.map((c,i)=><div key={i} className="flex items-start gap-2"><div className="flex-1"><PlaceField label={`Participant ${i+1}`} value={c} onChange={(v)=>setCities((cs)=>cs.map((x,j)=>j===i?v:x) as PlaceValue[])} /></div><button type="button" className="btn btn-ghost btn-sm mt-5" onClick={()=>setCities((cs)=>cs.filter((_,j)=>j!==i))}>✕</button></div>)}{cities.length<6&&<button type="button" className="btn btn-ghost btn-sm" onClick={()=>setCities((cs)=>[...cs,null as any])}>+ Add city / timezone</button>}</div>{tzs.length>0&&<><div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{tzs.map((c,i)=>{const n=zoneSnapshot(c.tz);return <Stat key={i} label={c.label||c.tz} value={n.time} sub={`${c.tz} · ${n.offset}`} />;})}</div>{tzs.length>1&&<div className="card p-4"><div className="label">Working-hours overlap (09–17 local for everyone)</div>{grid.overlap.length?<p className="mt-1 font-display text-lg font-bold text-brand-strong">{grid.overlap[0].toString().padStart(2,"0")}:00–{String(grid.overlap[grid.overlap.length-1]+1).padStart(2,"0")}:00 UTC</p>:<p className="mt-1 text-sm text-mute">No single UTC hour falls inside 09:00–17:00 for every participant.</p>}</div>}</>}</div>;
}

export function DaylightChartTool() {
  const [place,setPlace]=useState<PlaceValue|null>(null);
  const series=useMemo(()=>{if(!place)return null;const pts:{day:number;hours:number|null}[]=[];for(let d=0;d<365;d+=3){const date=new Date(Date.UTC(2025,0,1+d));const r=sunTimes(place.lat,place.lng,2025,date.getUTCMonth()+1,date.getUTCDate());pts.push({day:d,hours:r.dayLengthHours});}const valid=pts.filter((p)=>p.hours!==null) as {day:number;hours:number}[];const max=valid.reduce((a,b)=>b.hours>a.hours?b:a,valid[0]);const min=valid.reduce((a,b)=>b.hours<a.hours?b:a,valid[0]);return{pts,max,min};},[place]);
  const W=620,H=180,P=12,x=(d:number)=>P+(d/365)*(W-2*P),y=(h:number)=>H-P-(h/24)*(H-2*P);
  return <div className="space-y-4"><div className="card p-4"><PlaceField label="Location" value={place} onChange={setPlace} placeholder="Search any place…" /></div>{series&&<div className="card p-4"><div className="label">Daylight through the year</div><svg viewBox={`0 0 ${W} ${H}`} className="mt-2 w-full">{[0,6,12,18,24].map((h)=><g key={h}><line x1={P} x2={W-P} y1={y(h)} y2={y(h)} stroke="var(--sf-line)"/><text x={2} y={y(h)+3} fontSize="9" fill="var(--sf-mute)">{h}h</text></g>)}<path d={series.pts.filter((p)=>p.hours!==null).map((p,i)=>`${i?"L":"M"}${x(p.day).toFixed(1)},${y(p.hours as number).toFixed(1)}`).join("")} fill="none" stroke="var(--sf-brand)" strokeWidth="2.5"/></svg><div className="mt-3 grid grid-cols-2 gap-2"><Stat label="Longest day" value={fmtDurationHours(series.max.hours)}/><Stat label="Shortest day" value={fmtDurationHours(series.min.hours)}/></div></div>}</div>;
}

export function GoldenHourTool() {
  const [place,setPlace]=useState<PlaceValue|null>(null);const[dateStr,setDateStr]=useState(()=>new Date().toISOString().slice(0,10));
  const res=useMemo(()=>{if(!place)return null;const[Y,M,D]=dateStr.split("-").map(Number);if(!Y||!M||!D)return null;const low=hourAngleTimes(place.lat,place.lng,Y,M,D,96),high=hourAngleTimes(place.lat,place.lng,Y,M,D,84);const fmtT=(h:number|null)=>{if(h===null)return"—";const t=((h%24)+24)%24;return`${String(Math.floor(t)).padStart(2,"0")}:${String(Math.round((t%1)*60)).padStart(2,"0")} UTC`;};return{low,high,fmtT};},[place,dateStr]);
  return <div className="space-y-4"><div className="card grid gap-3 p-4 sm:grid-cols-2"><PlaceField label="Location" value={place} onChange={setPlace}/><Field label="Date"><input type="date" className="input" value={dateStr} onChange={(e)=>setDateStr(e.target.value)}/></Field></div>{res&&<div className="grid gap-2 sm:grid-cols-2"><Stat label="Morning golden hour" value={`${res.fmtT(res.low.rise)} → ${res.fmtT(res.high.rise)}`}/><Stat label="Evening golden hour" value={`${res.fmtT(res.high.set)} → ${res.fmtT(res.low.set)}`}/></div>}</div>;
}
