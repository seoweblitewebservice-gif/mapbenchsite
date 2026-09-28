"use client";

import { useMemo, useState } from "react";
import tzlookup from "tz-lookup";
import { ErrorBox, Field, Stat } from "@/components/ui";

const R_KM = 6371.0088;
const SYNODIC_MONTH = 29.530588853;
const MOON_EPOCH = Date.UTC(2000, 0, 6, 18, 14, 0);

const rad = (d: number) => (d * Math.PI) / 180;
const deg = (r: number) => (r * 180) / Math.PI;
const fmt = (v: number, d = 2) => (Number.isFinite(v) ? v.toFixed(d) : "—");
const mod = (n: number, m: number) => ((n % m) + m) % m;

function NumField({ label, value, setValue, step = "any" }: { label: string; value: string; setValue: (v: string) => void; step?: string }) {
  return (
    <Field label={label}>
      <input className="input" type="number" step={step} value={value} onChange={(e) => setValue(e.target.value)} />
    </Field>
  );
}

function TwoNumber({ aLabel, bLabel, a0, b0, calculate }: { aLabel: string; bLabel: string; a0: number; b0: number; calculate: (a: number, b: number) => { label: string; value: string; sub?: string }[] }) {
  const [a, setA] = useState(String(a0));
  const [b, setB] = useState(String(b0));
  const rows = calculate(+a || 0, +b || 0);
  return (
    <div className="space-y-4">
      <div className="card grid gap-3 p-4 sm:grid-cols-2">
        <NumField label={aLabel} value={a} setValue={setA} />
        <NumField label={bLabel} value={b} setValue={setB} />
      </div>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {rows.map((r) => <Stat key={r.label} label={r.label} value={r.value} sub={r.sub} />)}
      </div>
    </div>
  );
}

function ThreeNumber({ labels, defaults, calculate }: { labels: [string, string, string]; defaults: [number, number, number]; calculate: (a: number, b: number, c: number) => { label: string; value: string; sub?: string }[] }) {
  const [a, setA] = useState(String(defaults[0]));
  const [b, setB] = useState(String(defaults[1]));
  const [c, setC] = useState(String(defaults[2]));
  const rows = calculate(+a || 0, +b || 0, +c || 0);
  return (
    <div className="space-y-4">
      <div className="card grid gap-3 p-4 md:grid-cols-3">
        <NumField label={labels[0]} value={a} setValue={setA} />
        <NumField label={labels[1]} value={b} setValue={setB} />
        <NumField label={labels[2]} value={c} setValue={setC} />
      </div>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {rows.map((r) => <Stat key={r.label} label={r.label} value={r.value} sub={r.sub} />)}
      </div>
    </div>
  );
}

function PropertyTool({ mode }: { mode: string }) {
  if (mode === "fence-length") return <TwoNumber aLabel="Plot length (m)" bLabel="Plot width (m)" a0={50} b0={30} calculate={(l,w)=>[{label:"Fence length",value:`${fmt(2*(l+w),1)} m`},{label:"Perimeter in feet",value:`${fmt(2*(l+w)*3.28084,1)} ft`}]} />;
  if (mode === "rectangle-acreage") return <TwoNumber aLabel="Lot length (ft)" bLabel="Lot width (ft)" a0={200} b0={100} calculate={(l,w)=>{const sq=l*w;return[{label:"Area",value:`${fmt(sq,0)} sq ft`},{label:"Acres",value:`${fmt(sq/43560,4)} ac`},{label:"Hectares",value:`${fmt(sq*0.0000092903,4)} ha`}];}} />;
  if (mode === "crop-row-length") return <ThreeNumber labels={["Field length (m)","Field width (m)","Row spacing (m)"]} defaults={[100,60,0.75]} calculate={(l,w,s)=>{const rows=s>0?Math.floor(w/s)+1:0;return[{label:"Approx. rows",value:String(rows)},{label:"Total row length",value:`${fmt(rows*l,0)} m`},{label:"Kilometres of rows",value:`${fmt(rows*l/1000,2)} km`}];}} />;
  if (mode === "seed-quantity") return <TwoNumber aLabel="Area (acres)" bLabel="Seeding rate (kg/acre)" a0={10} b0={20} calculate={(a,r)=>[{label:"Seed required",value:`${fmt(a*r,1)} kg`},{label:"Pounds",value:`${fmt(a*r*2.20462,1)} lb`}]} />;
  if (mode === "fertilizer-amount") return <TwoNumber aLabel="Area (acres)" bLabel="Application rate (lb/acre)" a0={10} b0={100} calculate={(a,r)=>[{label:"Fertilizer required",value:`${fmt(a*r,0)} lb`},{label:"Kilograms",value:`${fmt(a*r*0.453592,1)} kg`}]} />;
  if (mode === "irrigation-coverage") return <TwoNumber aLabel="Sprinkler radius (m)" bLabel="Reference only" a0={8} b0={0} calculate={(r)=>[{label:"Ideal circle coverage",value:`${fmt(Math.PI*r*r,1)} m²`},{label:"Acres",value:`${fmt(Math.PI*r*r/4046.856,4)} ac`}]} />;
  if (mode === "sprinkler-count") return <ThreeNumber labels={["Field area (m²)","Sprinkler radius (m)","Overlap allowance (%)"]} defaults={[5000,8,20]} calculate={(area,r,overlap)=>{const one=Math.PI*r*r*Math.max(0.1,1-overlap/100);const n=one>0?Math.ceil(area/one):0;return[{label:"Estimated sprinklers",value:String(n)},{label:"Effective coverage each",value:`${fmt(one,1)} m²`}];}} />;
  return <TwoNumber aLabel="Animals" bLabel="Pasture area (acres)" a0={20} b0={50} calculate={(animals,acres)=>[{label:"Stock density",value:acres>0?`${fmt(animals/acres,3)} animals/acre`:"—"},{label:"Acres per animal",value:animals>0?`${fmt(acres/animals,2)} ac`:"—"}]} />;
}

function CircleTool({ mode }: { mode: string }) {
  if (mode === "circle-area-radius") return <TwoNumber aLabel="Radius" bLabel="Reference only" a0={10} b0={0} calculate={(r)=>[{label:"Area",value:fmt(Math.PI*r*r,4)},{label:"Circumference",value:fmt(2*Math.PI*r,4)}]} />;
  if (mode === "radius-from-area") return <TwoNumber aLabel="Circle area" bLabel="Reference only" a0={314.159} b0={0} calculate={(a)=>[{label:"Radius",value:fmt(Math.sqrt(Math.max(0,a)/Math.PI),4)},{label:"Diameter",value:fmt(2*Math.sqrt(Math.max(0,a)/Math.PI),4)}]} />;
  if (mode === "circumference-radius") return <TwoNumber aLabel="Radius" bLabel="Reference only" a0={10} b0={0} calculate={(r)=>[{label:"Circumference",value:fmt(2*Math.PI*r,4)},{label:"Diameter",value:fmt(2*r,4)}]} />;
  if (mode === "radius-from-circumference") return <TwoNumber aLabel="Circumference" bLabel="Reference only" a0={62.8319} b0={0} calculate={(c)=>[{label:"Radius",value:fmt(c/(2*Math.PI),4)},{label:"Diameter",value:fmt(c/Math.PI,4)}]} />;
  return <TwoNumber aLabel="Equal circle radius" bLabel="Centre distance" a0={10} b0={8} calculate={(r,d)=>{if(r<=0||d>=2*r)return[{label:"Overlap area",value:"0"},{label:"Overlap",value:"0%"}];const area=2*r*r*Math.acos(d/(2*r))-.5*d*Math.sqrt(4*r*r-d*d);return[{label:"Overlap area",value:fmt(area,4)},{label:"Of one circle",value:`${fmt(area/(Math.PI*r*r)*100,2)}%`}];}} />;
}

function parseLatLngList(text: string) {
  return text.split(/\n|;/).map((line)=>line.trim()).filter(Boolean).map((line)=>line.split(/[ ,]+/).map(Number)).filter((p)=>p.length>=2&&Number.isFinite(p[0])&&Number.isFinite(p[1])).map(([lat,lng])=>({lat,lng}));
}

function projectedPolygon(points:{lat:number;lng:number}[]) {
  if(points.length<3)return{area:0,perimeter:0,centroid:null as null|{lat:number;lng:number}};
  const lat0=points.reduce((s,p)=>s+p.lat,0)/points.length;
  const cos=Math.cos(rad(lat0));
  const xy=points.map(p=>({x:rad(p.lng)*R_KM*cos,y:rad(p.lat)*R_KM}));
  let twice=0,cx=0,cy=0,perimeter=0;
  for(let i=0;i<xy.length;i++){const a=xy[i],b=xy[(i+1)%xy.length],cross=a.x*b.y-b.x*a.y;twice+=cross;cx+=(a.x+b.x)*cross;cy+=(a.y+b.y)*cross;perimeter+=Math.hypot(b.x-a.x,b.y-a.y);}
  const area=Math.abs(twice)/2;const signed=twice/2;
  const centroid=Math.abs(signed)>1e-12?{lng:deg(cx/(6*signed)/R_KM/cos),lat:deg(cy/(6*signed)/R_KM)}:null;
  return{area,perimeter,centroid};
}

function PolygonTool({mode}:{mode:string}){
  const[text,setText]=useState("40.7128,-74.0060\n40.7138,-74.0060\n40.7138,-74.0045\n40.7128,-74.0045");
  const points=useMemo(()=>parseLatLngList(text),[text]);
  const stats=useMemo(()=>projectedPolygon(points),[points]);
  const bbox=points.length?{n:Math.max(...points.map(p=>p.lat)),s:Math.min(...points.map(p=>p.lat)),e:Math.max(...points.map(p=>p.lng)),w:Math.min(...points.map(p=>p.lng))}:null;
  return <div className="space-y-3"><Field label="Latitude, longitude points — one per line"><textarea className="input min-h-52 font-mono text-xs" value={text} onChange={e=>setText(e.target.value)}/></Field>{points.length<2?<ErrorBox>Add at least two valid coordinate pairs.</ErrorBox>:<div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{mode==="polygon-area-coordinates"&&<Stat label="Approx. polygon area" value={`${fmt(stats.area,5)} km²`}/>} {mode==="polygon-perimeter-coordinates"&&<Stat label="Approx. perimeter" value={`${fmt(stats.perimeter,4)} km`}/>} {mode==="polygon-centroid-coordinates"&&<Stat label="Polygon centroid" value={stats.centroid?`${fmt(stats.centroid.lat,6)}, ${fmt(stats.centroid.lng,6)}`:"—"}/>} {mode==="coordinate-bbox-generator"&&bbox&&<Stat label="N, S, E, W" value={`${fmt(bbox.n,5)}, ${fmt(bbox.s,5)}, ${fmt(bbox.e,5)}, ${fmt(bbox.w,5)}`}/>}</div>}</div>;
}

function RadiusPointsTool(){const[lat,setLat]=useState("40.7128"),[lng,setLng]=useState("-74.0060"),[radius,setRadius]=useState("10"),[count,setCount]=useState("8");const pts=useMemo(()=>{const n=Math.max(3,Math.min(360,+count||8)),d=(+radius||0)/R_KM,p1=rad(+lat||0),l1=rad(+lng||0);return Array.from({length:n},(_,i)=>{const br=2*Math.PI*i/n;const p2=Math.asin(Math.sin(p1)*Math.cos(d)+Math.cos(p1)*Math.sin(d)*Math.cos(br));const l2=l1+Math.atan2(Math.sin(br)*Math.sin(d)*Math.cos(p1),Math.cos(d)-Math.sin(p1)*Math.sin(p2));return`${fmt(deg(p2),6)}, ${fmt(mod(deg(l2)+180,360)-180,6)}`;});},[lat,lng,radius,count]);return <div className="space-y-3"><div className="card grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-4"><NumField label="Centre latitude" value={lat} setValue={setLat}/><NumField label="Centre longitude" value={lng} setValue={setLng}/><NumField label="Radius (km)" value={radius} setValue={setRadius}/><NumField label="Points" value={count} setValue={setCount}/></div><Field label="Generated boundary points"><textarea readOnly className="input min-h-48 font-mono text-xs" value={pts.join("\n")}/></Field></div>}

function tzOffsetMinutes(zone:string,date:Date){const parts=new Intl.DateTimeFormat("en-US",{timeZone:zone,year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit",second:"2-digit",hourCycle:"h23"}).formatToParts(date);const v:Record<string,string>={};parts.forEach(p=>{if(p.type!=="literal")v[p.type]=p.value;});return(Date.UTC(+v.year,+v.month-1,+v.day,+v.hour,+v.minute,+v.second)-date.getTime())/60000;}

function TimeTool({mode}:{mode:string}){
  if(mode==="unix-to-local"){const[ts,setTs]=useState(String(Math.floor(Date.now()/1000))),[zone,setZone]=useState("UTC");let out="—";try{out=new Intl.DateTimeFormat("en-US",{timeZone:zone,dateStyle:"medium",timeStyle:"long"}).format(new Date((+ts||0)*1000));}catch{}return <div className="space-y-3"><Field label="Unix timestamp (seconds)"><input className="input" value={ts} onChange={e=>setTs(e.target.value)}/></Field><Field label="IANA time zone"><input className="input" value={zone} onChange={e=>setZone(e.target.value)} placeholder="America/New_York"/></Field><Stat label="Local time" value={out}/></div>}
  if(mode==="local-to-unix"){const[value,setValue]=useState(()=>new Date().toISOString().slice(0,16)),[zone,setZone]=useState("UTC");let unix="—";try{const[d,t]=value.split("T"),[y,m,day]=d.split("-").map(Number),[hh,mm]=t.split(":").map(Number);let guess=new Date(Date.UTC(y,m-1,day,hh,mm));for(let i=0;i<2;i++)guess=new Date(Date.UTC(y,m-1,day,hh,mm)-tzOffsetMinutes(zone,guess)*60000);unix=String(Math.floor(guess.getTime()/1000));}catch{}return <div className="space-y-3"><Field label="Local date & time"><input className="input" type="datetime-local" value={value} onChange={e=>setValue(e.target.value)}/></Field><Field label="IANA time zone"><input className="input" value={zone} onChange={e=>setZone(e.target.value)}/></Field><Stat label="Unix timestamp" value={unix}/></div>}
  if(mode==="working-hours-overlap")return <WorkingHoursTool/>;
  if(mode==="time-difference-zones")return <ZoneDifferenceTool/>;
  return <CoordinateTimeTool mode={mode}/>;
}

function CoordinateTimeTool({mode}:{mode:string}){const[lat,setLat]=useState("40.7128"),[lng,setLng]=useState("-74.0060"),[date,setDate]=useState(()=>new Date().toISOString().slice(0,10));let zone="—",offset=NaN,local="—",dst="—";try{zone=tzlookup(+lat,+lng);const d=new Date(`${date}T12:00:00Z`);offset=tzOffsetMinutes(zone,d);local=new Intl.DateTimeFormat("en-US",{timeZone:zone,dateStyle:"medium",timeStyle:"long"}).format(d);const jan=tzOffsetMinutes(zone,new Date(Date.UTC(d.getUTCFullYear(),0,15,12))),jul=tzOffsetMinutes(zone,new Date(Date.UTC(d.getUTCFullYear(),6,15,12)));const standard=Math.min(jan,jul);dst=offset!==standard?"Yes":"No";}catch{}return <div className="space-y-4"><div className="card grid gap-3 p-4 md:grid-cols-3"><NumField label="Latitude" value={lat} setValue={setLat}/><NumField label="Longitude" value={lng} setValue={setLng}/><Field label="Date"><input className="input" type="date" value={date} onChange={e=>setDate(e.target.value)}/></Field></div><div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{mode==="utc-offset-coordinates"&&<><Stat label="Time zone" value={zone}/><Stat label="UTC offset" value={Number.isFinite(offset)?`UTC${offset>=0?"+":""}${fmt(offset/60,2)}`:"—"}/></>} {mode==="local-time-coordinates"&&<><Stat label="Time zone" value={zone}/><Stat label="Local time at 12:00 UTC" value={local}/></>} {mode==="dst-checker-coordinates"&&<><Stat label="Time zone" value={zone}/><Stat label="DST active on date" value={dst}/></>}</div></div>}

function ZoneDifferenceTool(){const[a,setA]=useState("America/New_York"),[b,setB]=useState("Europe/London"),[date,setDate]=useState(()=>new Date().toISOString().slice(0,10));let diff="—";try{const d=new Date(`${date}T12:00:00Z`);diff=`${fmt((tzOffsetMinutes(b,d)-tzOffsetMinutes(a,d))/60,2)} hours`;}catch{}return <div className="space-y-3"><Field label="Time zone A"><input className="input" value={a} onChange={e=>setA(e.target.value)}/></Field><Field label="Time zone B"><input className="input" value={b} onChange={e=>setB(e.target.value)}/></Field><Field label="Date"><input className="input" type="date" value={date} onChange={e=>setDate(e.target.value)}/></Field><Stat label="B minus A" value={diff}/></div>}

function WorkingHoursTool(){const[a,setA]=useState("America/New_York"),[b,setB]=useState("Europe/London"),[start,setStart]=useState("09:00"),[end,setEnd]=useState("17:00");const result=useMemo(()=>{try{const day=new Date();day.setUTCHours(12,0,0,0);const offA=tzOffsetMinutes(a,day),offB=tzOffsetMinutes(b,day);const toMin=(s:string)=>{const[h,m]=s.split(":").map(Number);return h*60+m;};const sA=toMin(start),eA=toMin(end);const sBAsA=toMin(start)-(offB-offA),eBAsA=toMin(end)-(offB-offA);const lo=Math.max(sA,sBAsA),hi=Math.min(eA,eBAsA);return hi>lo?`${String(Math.floor(mod(lo,1440)/60)).padStart(2,"0")}:${String(mod(lo,60)).padStart(2,"0")}–${String(Math.floor(mod(hi,1440)/60)).padStart(2,"0")}:${String(mod(hi,60)).padStart(2,"0")} in zone A`:`No overlap`; }catch{return"Invalid time zone";}},[a,b,start,end]);return <div className="space-y-3"><Field label="Time zone A"><input className="input" value={a} onChange={e=>setA(e.target.value)}/></Field><Field label="Time zone B"><input className="input" value={b} onChange={e=>setB(e.target.value)}/></Field><div className="grid gap-3 sm:grid-cols-2"><Field label="Workday start"><input className="input" type="time" value={start} onChange={e=>setStart(e.target.value)}/></Field><Field label="Workday end"><input className="input" type="time" value={end} onChange={e=>setEnd(e.target.value)}/></Field></div><Stat label="Overlap" value={result}/></div>}

function dayOfYear(date:Date){return Math.floor((Date.UTC(date.getUTCFullYear(),date.getUTCMonth(),date.getUTCDate())-Date.UTC(date.getUTCFullYear(),0,0))/86400000);}
function solarEventUtc(lat:number,lng:number,date:Date,zenith:number,rising:boolean){const n=dayOfYear(date),lngHour=lng/15,t=n+((rising?6:18)-lngHour)/24,m=0.9856*t-3.289;let L=mod(m+1.916*Math.sin(rad(m))+0.020*Math.sin(rad(2*m))+282.634,360);let ra=mod(deg(Math.atan(0.91764*Math.tan(rad(L)))),360);const lq=Math.floor(L/90)*90,raq=Math.floor(ra/90)*90;ra=(ra+(lq-raq))/15;const sinDec=0.39782*Math.sin(rad(L)),cosDec=Math.cos(Math.asin(sinDec));const cosH=(Math.cos(rad(zenith))-sinDec*Math.sin(rad(lat)))/(cosDec*Math.cos(rad(lat)));if(cosH>1||cosH<-1)return null;let h=rising?360-deg(Math.acos(cosH)):deg(Math.acos(cosH));h/=15;const local=h+ra-0.06571*t-6.622;return mod(local-lngHour,24);}
function formatUtcHour(h:number|null){if(h===null)return"No event on this date";const hour=Math.floor(h),min=Math.round((h-hour)*60)%60;return`${String(hour).padStart(2,"0")}:${String(min).padStart(2,"0")} UTC`;}

function SolarTool({mode}:{mode:string}){if(["civil-twilight","nautical-twilight","astronomical-twilight","solar-noon"].includes(mode))return <SolarEventTool mode={mode}/>;return <SunPositionTool mode={mode}/>;}
function SolarEventTool({mode}:{mode:string}){const[lat,setLat]=useState("40.7128"),[lng,setLng]=useState("-74.0060"),[date,setDate]=useState(()=>new Date().toISOString().slice(0,10));const d=new Date(`${date}T12:00:00Z`);const zenith=mode==="civil-twilight"?96:mode==="nautical-twilight"?102:mode==="astronomical-twilight"?108:90.833;const dawn=solarEventUtc(+lat,+lng,d,zenith,true),dusk=solarEventUtc(+lat,+lng,d,zenith,false);const noon=dawn!==null&&dusk!==null?mod((dawn+dusk)/2,24):null;return <div className="space-y-4"><div className="card grid gap-3 p-4 md:grid-cols-3"><NumField label="Latitude" value={lat} setValue={setLat}/><NumField label="Longitude" value={lng} setValue={setLng}/><Field label="Date"><input className="input" type="date" value={date} onChange={e=>setDate(e.target.value)}/></Field></div><div className="grid gap-2 sm:grid-cols-2">{mode==="solar-noon"?<Stat label="Approx. solar noon" value={formatUtcHour(noon)}/>:<><Stat label="Morning event" value={formatUtcHour(dawn)}/><Stat label="Evening event" value={formatUtcHour(dusk)}/></>}</div></div>}
function solarPosition(lat:number,lng:number,date:Date){const jd=date.getTime()/86400000+2440587.5,t=(jd-2451545)/36525,L0=mod(280.46646+t*(36000.76983+t*0.0003032),360),M=357.52911+t*(35999.05029-0.0001537*t),e=0.016708634-t*(0.000042037+0.0000001267*t),C=Math.sin(rad(M))*(1.914602-t*(0.004817+0.000014*t))+Math.sin(rad(2*M))*(0.019993-0.000101*t)+Math.sin(rad(3*M))*0.000289,trueLong=L0+C,omega=125.04-1934.136*t,lambda=trueLong-0.00569-0.00478*Math.sin(rad(omega)),eps0=23+(26+(21.448-t*(46.815+t*(0.00059-t*0.001813)))/60)/60,eps=eps0+0.00256*Math.cos(rad(omega)),decl=deg(Math.asin(Math.sin(rad(eps))*Math.sin(rad(lambda)))),y=Math.tan(rad(eps/2))**2,eot=4*deg(y*Math.sin(2*rad(L0))-2*e*Math.sin(rad(M))+4*e*y*Math.sin(rad(M))*Math.cos(2*rad(L0))-.5*y*y*Math.sin(4*rad(L0))-1.25*e*e*Math.sin(2*rad(M))),minutes=date.getUTCHours()*60+date.getUTCMinutes()+date.getUTCSeconds()/60,trueSolar=mod(minutes+eot+4*lng,1440),ha=trueSolar/4<0?trueSolar/4+180:trueSolar/4-180,zen=deg(Math.acos(Math.sin(rad(lat))*Math.sin(rad(decl))+Math.cos(rad(lat))*Math.cos(rad(decl))*Math.cos(rad(ha)))),elevation=90-zen;let az=deg(Math.atan2(Math.sin(rad(ha)),Math.cos(rad(ha))*Math.sin(rad(lat))-Math.tan(rad(decl))*Math.cos(rad(lat))))+180;az=mod(az,360);return{elevation,azimuth:az};}
function SunPositionTool({mode}:{mode:string}){const[lat,setLat]=useState("40.7128"),[lng,setLng]=useState("-74.0060"),[when,setWhen]=useState(()=>new Date().toISOString().slice(0,16));const pos=solarPosition(+lat,+lng,new Date(`${when}:00Z`));return <div className="space-y-4"><div className="card grid gap-3 p-4 md:grid-cols-3"><NumField label="Latitude" value={lat} setValue={setLat}/><NumField label="Longitude" value={lng} setValue={setLng}/><Field label="UTC date & time"><input className="input" type="datetime-local" value={when} onChange={e=>setWhen(e.target.value)}/></Field></div>{mode==="sun-altitude"?<Stat label="Solar altitude" value={`${fmt(pos.elevation,2)}°`}/>:<Stat label="Solar azimuth" value={`${fmt(pos.azimuth,2)}°`}/>}</div>}

function moonAgeDays(date:Date){return mod((date.getTime()-MOON_EPOCH)/86400000,SYNODIC_MONTH);}
function MoonTool({mode}:{mode:string}){const[date,setDate]=useState(()=>new Date().toISOString().slice(0,10));const d=new Date(`${date}T12:00:00Z`),age=moonAgeDays(d),illum=(1-Math.cos(2*Math.PI*age/SYNODIC_MONTH))/2;const phase=age<1.85?"New Moon":age<5.54?"Waxing Crescent":age<9.23?"First Quarter":age<12.92?"Waxing Gibbous":age<16.61?"Full Moon":age<20.30?"Waning Gibbous":age<23.99?"Last Quarter":age<27.68?"Waning Crescent":"New Moon";const deltaNew=mod(SYNODIC_MONTH-age,SYNODIC_MONTH),deltaFull=mod(SYNODIC_MONTH/2-age,SYNODIC_MONTH);const nextNew=new Date(d.getTime()+deltaNew*86400000),nextFull=new Date(d.getTime()+deltaFull*86400000);return <div className="space-y-3"><Field label="Date"><input className="input" type="date" value={date} onChange={e=>setDate(e.target.value)}/></Field><div className="grid gap-2 sm:grid-cols-2">{mode==="moon-phase-date"&&<Stat label="Approx. phase" value={phase}/>} {mode==="moon-age"&&<Stat label="Moon age" value={`${fmt(age,2)} days`}/>} {mode==="moon-illumination"&&<Stat label="Illuminated fraction" value={`${fmt(illum*100,1)}%`}/>} {mode==="next-full-moon"&&<Stat label="Approx. next full moon" value={nextFull.toISOString().slice(0,10)}/>} {mode==="next-new-moon"&&<Stat label="Approx. next new moon" value={nextNew.toISOString().slice(0,10)}/>}</div><p className="text-xs text-mute">Lunar results use a mean synodic-month approximation and are suitable for planning, not ephemeris-grade astronomy.</p></div>}

function parseWkt(text:string){const type=text.trim().match(/^([A-Z]+)\s*/i)?.[1]?.toUpperCase()||"";const pairs=[...text.matchAll(/(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)/g)].map(m=>[+m[1],+m[2]]);return{type,pairs,valid:["POINT","LINESTRING","POLYGON","MULTIPOINT","MULTILINESTRING","MULTIPOLYGON"].includes(type)&&pairs.length>0};}
function WktTool({mode}:{mode:string}){const[text,setText]=useState("LINESTRING (-74.0060 40.7128, -73.9857 40.7484)");const p=useMemo(()=>parseWkt(text),[text]);const bbox=p.pairs.length?[Math.min(...p.pairs.map(x=>x[0])),Math.min(...p.pairs.map(x=>x[1])),Math.max(...p.pairs.map(x=>x[0])),Math.max(...p.pairs.map(x=>x[1]))]:null;return <div className="space-y-3"><Field label="WKT"><textarea className="input min-h-40 font-mono text-xs" value={text} onChange={e=>setText(e.target.value)}/></Field><div className="grid gap-2 sm:grid-cols-2">{mode==="wkt-validator"&&<Stat label="Validation" value={p.valid?`Valid ${p.type} structure":"Invalid / unsupported WKT"}/>} {mode==="wkt-bbox"&&<Stat label="Bounding box" value={bbox?bbox.map(v=>fmt(v,5)).join(", "):"—"}/>} {mode==="wkt-coordinate-count"&&<Stat label="Coordinate pairs" value={String(p.pairs.length)}/>}</div></div>}

function decodePolyline(str:string){let index=0,lat=0,lng=0,coords:{lat:number;lng:number}[]=[];while(index<str.length){let b,shift=0,result=0;do{b=str.charCodeAt(index++)-63;result|=(b&0x1f)<<shift;shift+=5;}while(b>=0x20&&index<=str.length);const dlat=(result&1)?~(result>>1):(result>>1);lat+=dlat;shift=0;result=0;do{b=str.charCodeAt(index++)-63;result|=(b&0x1f)<<shift;shift+=5;}while(b>=0x20&&index<=str.length);const dlng=(result&1)?~(result>>1):(result>>1);lng+=dlng;coords.push({lat:lat/1e5,lng:lng/1e5});}return coords;}
function encodeSigned(value:number){let v=value<0?~(value<<1):(value<<1),out="";while(v>=0x20){out+=String.fromCharCode((0x20|(v&0x1f))+63);v>>=5;}return out+String.fromCharCode(v+63);}
function encodePolyline(points:{lat:number;lng:number}[]){let lastLat=0,lastLng=0,out="";for(const p of points){const lat=Math.round(p.lat*1e5),lng=Math.round(p.lng*1e5);out+=encodeSigned(lat-lastLat)+encodeSigned(lng-lastLng);lastLat=lat;lastLng=lng;}return out;}
function PolylineTool({mode}:{mode:string}){const[text,setText]=useState(mode==="polyline-decode"?"_p~iF~ps|U_ulLnnqC_mqNvxq`@":"38.5,-120.2\n40.7,-120.95\n43.252,-126.453");let output="";try{output=mode==="polyline-decode"?decodePolyline(text).map(p=>`${fmt(p.lat,5)}, ${fmt(p.lng,5)}`).join("\n"):encodePolyline(parseLatLngList(text));}catch{output="Invalid input";}return <div className="space-y-3"><Field label={mode==="polyline-decode"?"Encoded polyline":"Latitude, longitude points"}><textarea className="input min-h-36 font-mono text-xs" value={text} onChange={e=>setText(e.target.value)}/></Field><Field label="Output"><textarea readOnly className="input min-h-36 font-mono text-xs" value={output}/></Field></div>}

function GeoCsvTool({mode}:{mode:string}){const[text,setText]=useState(mode==="geojson-to-csv"?'{"type":"FeatureCollection","features":[{"type":"Feature","properties":{"name":"Example"},"geometry":{"type":"Point","coordinates":[-74.006,40.7128]}}]}':"name,latitude,longitude\nExample,40.7128,-74.0060");let output="";let error="";try{if(mode==="geojson-to-csv"){const obj=JSON.parse(text),features=obj.type==="FeatureCollection"?obj.features:[];const keys=Array.from(new Set(features.flatMap((f:any)=>Object.keys(f.properties||{}))));const header=[...keys,"latitude","longitude"];const rows=features.filter((f:any)=>f.geometry?.type==="Point").map((f:any)=>[...keys.map(k=>JSON.stringify(f.properties?.[k]??"")),f.geometry.coordinates[1],f.geometry.coordinates[0]].join(","));output=[header.join(","),...rows].join("\n");}else{const lines=text.trim().split(/\r?\n/),headers=lines[0].split(",").map(s=>s.trim()),latI=headers.findIndex(h=>/^lat(itude)?$/i.test(h)),lngI=headers.findIndex(h=>/^(lng|lon|longitude)$/i.test(h));if(latI<0||lngI<0)throw new Error("CSV needs latitude and longitude columns");const features=lines.slice(1).filter(Boolean).map(line=>{const cells=line.split(",");const props:Object=Object.fromEntries(headers.map((h,i)=>[h,cells[i]??""]).filter((_,i)=>i!==latI&&i!==lngI));return{type:"Feature",properties:props,geometry:{type:"Point",coordinates:[+cells[lngI],+cells[latI]]}};});output=JSON.stringify({type:"FeatureCollection",features},null,2);}}catch(e){error=e instanceof Error?e.message:"Invalid input";}return <div className="space-y-3"><Field label={mode==="geojson-to-csv"?"GeoJSON Point features":"CSV with latitude/longitude columns"}><textarea className="input min-h-52 font-mono text-xs" value={text} onChange={e=>setText(e.target.value)}/></Field>{error?<ErrorBox>{error}</ErrorBox>:<Field label="Converted output"><textarea readOnly className="input min-h-52 font-mono text-xs" value={output}/></Field>}</div>}

export default function LongtailTool2({params}:{params?:Record<string,unknown>}){const mode=String(params?.mode||"");if(["fence-length","rectangle-acreage","crop-row-length","seed-quantity","fertilizer-amount","irrigation-coverage","sprinkler-count","stock-density"].includes(mode))return <PropertyTool mode={mode}/>;if(["circle-area-radius","radius-from-area","circumference-radius","radius-from-circumference","circle-overlap"].includes(mode))return <CircleTool mode={mode}/>;if(["polygon-area-coordinates","polygon-perimeter-coordinates","polygon-centroid-coordinates","coordinate-bbox-generator"].includes(mode))return <PolygonTool mode={mode}/>;if(mode==="coordinate-radius-points")return <RadiusPointsTool/>;if(["unix-to-local","local-to-unix","utc-offset-coordinates","local-time-coordinates","dst-checker-coordinates","working-hours-overlap","time-difference-zones"].includes(mode))return <TimeTool mode={mode}/>;if(["civil-twilight","nautical-twilight","astronomical-twilight","solar-noon","sun-altitude","sun-azimuth"].includes(mode))return <SolarTool mode={mode}/>;if(["moon-phase-date","moon-age","moon-illumination","next-full-moon","next-new-moon"].includes(mode))return <MoonTool mode={mode}/>;if(["wkt-validator","wkt-bbox","wkt-coordinate-count"].includes(mode))return <WktTool mode={mode}/>;if(["polyline-decode","polyline-encode"].includes(mode))return <PolylineTool mode={mode}/>;if(["geojson-to-csv","csv-to-geojson"].includes(mode))return <GeoCsvTool mode={mode}/>;return <ErrorBox>This tool mode is not configured.</ErrorBox>}
