"use client";

import { useMemo, useState } from "react";

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  return <button className="btn btn-ghost" onClick={async()=>{await navigator.clipboard.writeText(value);setCopied(true);setTimeout(()=>setCopied(false),1200)}}>{copied?"Copied":"Copy"}</button>;
}

export function GoogleMapsEmbedTool() {
  const [query,setQuery]=useState("New York City");
  const [zoom,setZoom]=useState(12);
  const [height,setHeight]=useState(450);
  const src=`https://www.google.com/maps?q=${encodeURIComponent(query.trim()||"New York City")}&z=${zoom}&output=embed`;
  const code=`<iframe src="${src}" width="100%" height="${height}" style="border:0" loading="lazy" referrerpolicy="no-referrer-when-downgrade" allowfullscreen></iframe>`;
  return <div className="space-y-5">
    <div className="grid gap-4 sm:grid-cols-3">
      <label className="sm:col-span-2"><span className="mb-1 block text-sm font-semibold">Place, address or coordinates</span><input className="input w-full" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Eiffel Tower or 48.8584,2.2945"/></label>
      <label><span className="mb-1 block text-sm font-semibold">Zoom: {zoom}</span><input className="w-full" type="range" min="1" max="20" value={zoom} onChange={e=>setZoom(Number(e.target.value))}/></label>
      <label><span className="mb-1 block text-sm font-semibold">Height (px)</span><input className="input w-full" type="number" min="200" max="1000" value={height} onChange={e=>setHeight(Math.max(200,Math.min(1000,Number(e.target.value)||450)))}/></label>
    </div>
    <div className="rounded-xl border border-line overflow-hidden bg-card"><iframe title="Google Maps embed preview" src={src} width="100%" height={height} style={{border:0}} loading="lazy" referrerPolicy="no-referrer-when-downgrade" allowFullScreen /></div>
    <div><div className="mb-2 flex items-center justify-between gap-3"><h3 className="font-display text-lg font-bold">Embed code</h3><CopyButton value={code}/></div><textarea className="input min-h-32 w-full font-mono text-xs" readOnly value={code}/></div>
    <p className="text-xs text-mute">This generator builds a standard Google Maps iframe URL without requiring an API key. Google controls map availability, branding and embed behavior.</p>
  </div>;
}

export function ShareLocationLinkTool() {
  const [lat,setLat]=useState("40.7128");
  const [lng,setLng]=useState("-74.0060");
  const [zoom,setZoom]=useState(15);
  const a=Number(lat), b=Number(lng);
  const valid=Number.isFinite(a)&&Number.isFinite(b)&&a>=-90&&a<=90&&b>=-180&&b<=180;
  const links=valid ? [
    ["Google Maps",`https://www.google.com/maps/search/?api=1&query=${a},${b}`],
    ["OpenStreetMap",`https://www.openstreetmap.org/?mlat=${a}&mlon=${b}#map=${zoom}/${a}/${b}`],
    ["Bing Maps",`https://www.bing.com/maps?cp=${a}~${b}&lvl=${zoom}`],
  ] as const : [];
  return <div className="space-y-5">
    <div className="grid gap-4 sm:grid-cols-3"><label><span className="mb-1 block text-sm font-semibold">Latitude</span><input className="input w-full" value={lat} onChange={e=>setLat(e.target.value)}/></label><label><span className="mb-1 block text-sm font-semibold">Longitude</span><input className="input w-full" value={lng} onChange={e=>setLng(e.target.value)}/></label><label><span className="mb-1 block text-sm font-semibold">Zoom</span><input className="input w-full" type="number" min="1" max="20" value={zoom} onChange={e=>setZoom(Math.max(1,Math.min(20,Number(e.target.value)||15)))}/></label></div>
    {!valid&&<div className="rounded-lg border border-line bg-well/50 p-4 text-sm">Enter valid WGS84 coordinates: latitude −90 to 90 and longitude −180 to 180.</div>}
    <div className="grid gap-3 sm:grid-cols-3">{links.map(([name,url])=><div key={name} className="card p-4"><h3 className="font-display font-bold">{name}</h3><a className="mt-3 block break-all text-xs text-brand-strong hover:underline" href={url} target="_blank" rel="noreferrer">Open link</a><div className="mt-3"><CopyButton value={url}/></div></div>)}</div>
    <p className="text-xs text-mute">These are shareable map links, not proof of a legal address or property boundary. Each provider controls its own map and URL behavior.</p>
  </div>;
}

type Point={label:string;lat:number;lng:number};
function hav(a:Point,b:Point){const R=6371.0088,toRad=(x:number)=>x*Math.PI/180,dLat=toRad(b.lat-a.lat),dLng=toRad(b.lng-a.lng),p1=toRad(a.lat),p2=toRad(b.lat);const h=Math.sin(dLat/2)**2+Math.cos(p1)*Math.cos(p2)*Math.sin(dLng/2)**2;return 2*R*Math.asin(Math.min(1,Math.sqrt(h)))}
function parsePoints(text:string){return text.split(/\r?\n/).map(x=>x.trim()).filter(Boolean).slice(0,20).map((line,i)=>{const p=line.split(",").map(x=>x.trim());if(p.length>=3){const lat=Number(p[p.length-2]),lng=Number(p[p.length-1]);return {label:p.slice(0,-2).join(", ")||`Point ${i+1}`,lat,lng}}const lat=Number(p[0]),lng=Number(p[1]);return {label:`Point ${i+1}`,lat,lng}}).filter(p=>Number.isFinite(p.lat)&&Number.isFinite(p.lng)&&p.lat>=-90&&p.lat<=90&&p.lng>=-180&&p.lng<=180)}

export function CoordinateDistanceTableTool() {
  const [text,setText]=useState("New York,40.7128,-74.0060\nBoston,42.3601,-71.0589\nWashington DC,38.9072,-77.0369");
  const points=useMemo(()=>parsePoints(text),[text]);
  const csv=useMemo(()=>{if(points.length<2)return "";const head=["From / To",...points.map(p=>p.label)].join(",");const rows=points.map(a=>[a.label,...points.map(b=>a===b?"0":hav(a,b).toFixed(2))].join(","));return [head,...rows].join("\n")},[points]);
  return <div className="space-y-5"><div><label className="mb-1 block text-sm font-semibold">Points — one per line as label,latitude,longitude</label><textarea className="input min-h-40 w-full font-mono text-sm" value={text} onChange={e=>setText(e.target.value)} /></div><p className="text-sm text-mute">Valid points detected: {points.length}. Maximum 20 points per table.</p>{points.length>=2&&<><div className="overflow-x-auto"><table className="tbl min-w-[700px]"><thead><tr><th>From / To</th>{points.map(p=><th key={p.label}>{p.label}</th>)}</tr></thead><tbody>{points.map(a=><tr key={a.label}><th>{a.label}</th>{points.map(b=><td key={b.label}>{a===b?"—":`${hav(a,b).toFixed(1)} km`}</td>)}</tr>)}</tbody></table></div><div className="flex gap-2"><CopyButton value={csv}/><button className="btn btn-ghost" onClick={()=>{const blob=new Blob([csv],{type:"text/csv"});const u=URL.createObjectURL(blob);const a=document.createElement("a");a.href=u;a.download="coordinate-distance-table.csv";a.click();URL.revokeObjectURL(u)}}>Download CSV</button></div></>}
    <p className="text-xs text-mute">Distances are straight-line great-circle distances using a mean Earth radius of 6,371.0088 km. They are not road or walking distances.</p></div>;
}
