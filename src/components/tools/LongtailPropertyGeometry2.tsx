"use client";
import { useMemo, useState } from "react";
import { CopyBtn, ErrorBox, Field, Stat } from "@/components/ui";

const R=6371.0088,rad=(d:number)=>d*Math.PI/180,deg=(r:number)=>r*180/Math.PI,fmt=(v:number,d=2)=>Number.isFinite(v)?v.toFixed(d):"—",mod=(n:number,m:number)=>((n%m)+m)%m;

type Result={label:string;value:string;sub?:string};

function N({label,v,set,min,step}:{label:string;v:string;set:(x:string)=>void;min?:number;step?:number}){
  return <Field label={label}><input className="input" type="number" min={min} step={step??"any"} value={v} onChange={e=>set(e.target.value)}/></Field>;
}

function ResultGrid({results}:{results:Result[]}){
  const text=results.map(r=>`${r.label}: ${r.value}${r.sub?` (${r.sub})`:""}`).join("\n");
  return <div className="space-y-3"><div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{results.map(r=><Stat key={r.label} {...r}/>)}</div><div className="flex justify-end"><CopyBtn text={text} label="Copy results"/></div></div>;
}

function One({label,av,calc}:{label:string;av:number;calc:(x:number)=>Result[]}){
  const[x,sx]=useState(String(av));
  const val=Number(x);
  const results=calc(Number.isFinite(val)?val:0);
  return <div className="space-y-4"><div className="card p-4"><div className="grid gap-3 sm:grid-cols-[1fr_auto]"><N label={label} v={x} set={sx}/><div className="flex items-end"><button type="button" className="btn btn-ghost btn-sm" onClick={()=>sx(String(av))}>Reset</button></div></div></div><ResultGrid results={results}/></div>;
}

function Two({a,b,av,bv,calc}:{a:string;b:string;av:number;bv:number;calc:(x:number,y:number)=>Result[]}){
  const[x,sx]=useState(String(av)),[y,sy]=useState(String(bv));
  const xv=Number(x),yv=Number(y);
  const results=calc(Number.isFinite(xv)?xv:0,Number.isFinite(yv)?yv:0);
  return <div className="space-y-4"><div className="card p-4"><div className="grid gap-3 sm:grid-cols-2"><N label={a} v={x} set={sx}/><N label={b} v={y} set={sy}/></div><div className="mt-3 flex justify-end"><button type="button" className="btn btn-ghost btn-sm" onClick={()=>{sx(String(av));sy(String(bv));}}>Reset inputs</button></div></div><ResultGrid results={results}/></div>;
}

function Three({labels,vals,calc}:{labels:[string,string,string];vals:[number,number,number];calc:(a:number,b:number,c:number)=>Result[]}){
  const[a,sa]=useState(String(vals[0])),[b,sb]=useState(String(vals[1])),[c,sc]=useState(String(vals[2]));
  const results=calc(Number(a)||0,Number(b)||0,Number(c)||0);
  return <div className="space-y-4"><div className="card p-4"><div className="grid gap-3 md:grid-cols-3"><N label={labels[0]} v={a} set={sa}/><N label={labels[1]} v={b} set={sb}/><N label={labels[2]} v={c} set={sc}/></div><div className="mt-3 flex justify-end"><button type="button" className="btn btn-ghost btn-sm" onClick={()=>{sa(String(vals[0]));sb(String(vals[1]));sc(String(vals[2]));}}>Reset inputs</button></div></div><ResultGrid results={results}/></div>;
}

export function PropertyGeometry2({mode}:{mode:string}){
 if(mode==="fence-length")return <Two a="Plot length (m)" b="Plot width (m)" av={50} bv={30} calc={(l,w)=>{const p=2*Math.max(0,l+w);return[{label:"Fence length",value:`${fmt(p,1)} m`},{label:"Perimeter in feet",value:`${fmt(p*3.28084,1)} ft`},{label:"Approx. posts at 2.5 m",value:String(p>0?Math.ceil(p/2.5):0),sub:"spacing estimate only"}]}} />;
 if(mode==="rectangle-acreage")return <Two a="Lot length (ft)" b="Lot width (ft)" av={200} bv={100} calc={(l,w)=>{const q=Math.max(0,l*w);return[{label:"Area",value:`${fmt(q,0)} sq ft`},{label:"Acres",value:`${fmt(q/43560,4)} ac`},{label:"Hectares",value:`${fmt(q*0.0000092903,4)} ha`},{label:"Square metres",value:`${fmt(q*0.092903,2)} m²`}];}}/>;
 if(mode==="crop-row-length")return <Three labels={["Field length (m)","Field width (m)","Row spacing (m)"]} vals={[100,60,.75]} calc={(l,w,s)=>{const n=s>0?Math.floor(Math.max(0,w)/s)+1:0;const total=n*Math.max(0,l);return[{label:"Approx. rows",value:String(n)},{label:"Total row length",value:`${fmt(total,0)} m`},{label:"Total row length",value:`${fmt(total/1000,3)} km`}];}}/>;
 if(mode==="seed-quantity")return <Two a="Area (acres)" b="Seeding rate (kg/acre)" av={10} bv={20} calc={(a,r)=>{const kg=Math.max(0,a*r);return[{label:"Seed required",value:`${fmt(kg,1)} kg`},{label:"Pounds",value:`${fmt(kg*2.20462,1)} lb`},{label:"50 kg bags",value:String(kg>0?Math.ceil(kg/50):0)}]}} />;
 if(mode==="fertilizer-amount")return <Two a="Area (acres)" b="Application rate (lb/acre)" av={10} bv={100} calc={(a,r)=>{const lb=Math.max(0,a*r);return[{label:"Fertilizer required",value:`${fmt(lb,0)} lb`},{label:"Kilograms",value:`${fmt(lb*.453592,1)} kg`},{label:"50 lb bags",value:String(lb>0?Math.ceil(lb/50):0)}]}} />;
 if(mode==="irrigation-coverage")return <One label="Sprinkler radius (m)" av={8} calc={(r)=>{r=Math.max(0,r);const area=Math.PI*r*r;return[{label:"Ideal coverage",value:`${fmt(area,1)} m²`},{label:"Acres",value:`${fmt(area/4046.856,4)} ac`},{label:"Diameter",value:`${fmt(2*r,1)} m`},{label:"Circumference",value:`${fmt(2*Math.PI*r,1)} m`}];}} />;
 if(mode==="sprinkler-count")return <Three labels={["Field area (m²)","Sprinkler radius (m)","Overlap (%)"]} vals={[5000,8,20]} calc={(a,r,o)=>{const nominal=Math.PI*Math.max(0,r)*Math.max(0,r),one=nominal*Math.max(.1,1-o/100),count=one>0?Math.ceil(Math.max(0,a)/one):0;return[{label:"Estimated sprinklers",value:String(count)},{label:"Effective coverage each",value:`${fmt(one,1)} m²`},{label:"Nominal circle area",value:`${fmt(nominal,1)} m²`},{label:"Total nominal coverage",value:`${fmt(count*nominal,0)} m²`}];}}/>;
 if(mode==="stock-density")return <Two a="Animals" b="Pasture area (acres)" av={20} bv={50} calc={(n,a)=>[{label:"Animals per acre",value:a>0?fmt(n/a,3):"—"},{label:"Acres per animal",value:n>0?fmt(a/n,2):"—"},{label:"Animals per hectare",value:a>0?fmt(n/(a*0.404686),3):"—"}]} />;
 if(mode==="circle-area-radius")return <One label="Radius" av={10} calc={(r)=>{r=Math.max(0,r);return[{label:"Area",value:fmt(Math.PI*r*r,4)},{label:"Circumference",value:fmt(2*Math.PI*r,4)},{label:"Diameter",value:fmt(2*r,4)}]}} />;
 if(mode==="radius-from-area")return <One label="Circle area" av={314.159} calc={(a)=>{const r=Math.sqrt(Math.max(0,a)/Math.PI);return[{label:"Radius",value:fmt(r,4)},{label:"Diameter",value:fmt(2*r,4)},{label:"Circumference",value:fmt(2*Math.PI*r,4)}]}} />;
 if(mode==="circumference-radius")return <One label="Radius" av={10} calc={(r)=>{r=Math.max(0,r);return[{label:"Circumference",value:fmt(2*Math.PI*r,4)},{label:"Diameter",value:fmt(2*r,4)},{label:"Area",value:fmt(Math.PI*r*r,4)}]}} />;
 if(mode==="radius-from-circumference")return <One label="Circumference" av={62.8319} calc={(c)=>{const r=Math.max(0,c)/(2*Math.PI);return[{label:"Radius",value:fmt(r,4)},{label:"Diameter",value:fmt(2*r,4)},{label:"Area",value:fmt(Math.PI*r*r,4)}]}} />;
 if(mode==="circle-overlap")return <Two a="Equal circle radius" b="Centre distance" av={10} bv={8} calc={(r,d)=>{r=Math.max(0,r);d=Math.max(0,d);if(r<=0||d>=2*r)return[{label:"Overlap area",value:"0"},{label:"Overlap",value:"0%"},{label:"Circle area",value:fmt(Math.PI*r*r,4)}];const area=2*r*r*Math.acos(d/(2*r))-.5*d*Math.sqrt(Math.max(0,4*r*r-d*d));return[{label:"Overlap area",value:fmt(area,4)},{label:"Of one circle",value:`${fmt(area/(Math.PI*r*r)*100,2)}%`},{label:"Combined union area",value:fmt(2*Math.PI*r*r-area,4)}];}}/>;
 return <CoordinateShape2 mode={mode}/>;
}

function parse(text:string){return text.split(/\n|;/).map(x=>x.trim()).filter(Boolean).map(x=>x.split(/[ ,]+/).map(Number)).filter(p=>p.length>=2&&Number.isFinite(p[0])&&Number.isFinite(p[1])).map(([lat,lng])=>({lat,lng}));}
function stats(p:{lat:number;lng:number}[]){if(p.length<3)return{area:0,per:0,cent:null as null|{lat:number;lng:number}};const lat0=p.reduce((s,x)=>s+x.lat,0)/p.length,c=Math.cos(rad(lat0)),xy=p.map(x=>({x:rad(x.lng)*R*c,y:rad(x.lat)*R}));let t=0,cx=0,cy=0,per=0;for(let i=0;i<xy.length;i++){const a=xy[i],b=xy[(i+1)%xy.length],q=a.x*b.y-b.x*a.y;t+=q;cx+=(a.x+b.x)*q;cy+=(a.y+b.y)*q;per+=Math.hypot(b.x-a.x,b.y-a.y);}const signed=t/2;return{area:Math.abs(signed),per,cent:Math.abs(signed)>1e-12?{lng:deg(cx/(6*signed)/R/c),lat:deg(cy/(6*signed)/R)}:null};}

function CoordinateShape2({mode}:{mode:string}){
  if(mode==="coordinate-radius-points")return <RadiusPoints/>;
  const[text,setText]=useState("40.7128,-74.0060\n40.7138,-74.0060\n40.7138,-74.0045\n40.7128,-74.0045"),p=useMemo(()=>parse(text),[text]),s=useMemo(()=>stats(p),[p]);
  const box=p.length?[Math.max(...p.map(x=>x.lat)),Math.min(...p.map(x=>x.lat)),Math.max(...p.map(x=>x.lng)),Math.min(...p.map(x=>x.lng))]:null;
  const results:Result[]=[];
  if(mode==="polygon-area-coordinates")results.push({label:"Approx. area",value:`${fmt(s.area,5)} km²`},{label:"Square metres",value:`${fmt(s.area*1e6,1)} m²`},{label:"Acres",value:`${fmt(s.area*247.105,2)} ac`});
  if(mode==="polygon-perimeter-coordinates")results.push({label:"Approx. perimeter",value:`${fmt(s.per,4)} km`},{label:"Metres",value:`${fmt(s.per*1000,1)} m`},{label:"Miles",value:`${fmt(s.per*0.621371,4)} mi`});
  if(mode==="polygon-centroid-coordinates")results.push({label:"Centroid",value:s.cent?`${fmt(s.cent.lat,6)}, ${fmt(s.cent.lng,6)}`:"—"});
  if(mode==="coordinate-bbox-generator"&&box)results.push({label:"N, S, E, W",value:box.map(v=>fmt(v,5)).join(", ")},{label:"Latitude span",value:`${fmt(box[0]-box[1],5)}°`},{label:"Longitude span",value:`${fmt(box[2]-box[3],5)}°`});
  return <div className="space-y-3"><Field label="Latitude, longitude points" hint="One point per line. The polygon closes automatically for area/perimeter calculations."><textarea className="input min-h-52 font-mono text-xs" value={text} onChange={e=>setText(e.target.value)}/></Field><div className="flex flex-wrap items-center gap-2"><span className="chip chip-brand">{p.length} valid points</span><button type="button" className="btn btn-ghost btn-sm" onClick={()=>setText("")}>Clear</button></div>{p.length<2?<ErrorBox>Add valid coordinate pairs.</ErrorBox>:<ResultGrid results={results}/>}</div>;
}

function RadiusPoints(){
  const[lat,slat]=useState("40.7128"),[lng,slng]=useState("-74.006"),[r,sr]=useState("10"),[n,sn]=useState("8");
  const out=useMemo(()=>Array.from({length:Math.max(3,Math.min(360,+n||8))},(_,i)=>{const cnt=Math.max(3,Math.min(360,+n||8)),br=2*Math.PI*i/cnt,d=(+r||0)/R,p1=rad(+lat||0),l1=rad(+lng||0),p2=Math.asin(Math.sin(p1)*Math.cos(d)+Math.cos(p1)*Math.sin(d)*Math.cos(br)),l2=l1+Math.atan2(Math.sin(br)*Math.sin(d)*Math.cos(p1),Math.cos(d)-Math.sin(p1)*Math.sin(p2));return`${fmt(deg(p2),6)}, ${fmt(mod(deg(l2)+180,360)-180,6)}`;}),[lat,lng,r,n]);
  return <div className="space-y-3"><div className="card p-4"><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"><N label="Centre latitude" v={lat} set={slat}/><N label="Centre longitude" v={lng} set={slng}/><N label="Radius (km)" v={r} set={sr}/><N label="Points" v={n} set={sn}/></div></div><Field label="Generated points"><textarea readOnly className="input min-h-48 font-mono text-xs" value={out.join("\n")}/></Field><div className="flex justify-end"><CopyBtn text={out.join("\n")} label="Copy all points"/></div></div>;
}
