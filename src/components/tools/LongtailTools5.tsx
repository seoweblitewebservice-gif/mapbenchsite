"use client";
import { useMemo, useState } from "react";
import { CopyBtn, ErrorBox, Field, Stat } from "@/components/ui";
import { BearingTool } from "./BearingMidpoint";

const R=6371.0088;
const rad=(d:number)=>d*Math.PI/180;
const deg=(r:number)=>r*180/Math.PI;
const fmt=(n:number,d=2)=>Number.isFinite(n)?n.toFixed(d):"—";
const num=(s:string)=>Number.isFinite(+s)?+s:0;
type Row={label:string;value:string;sub?:string};

function Actions({rows,onReset}:{rows:Row[];onReset:()=>void}){return <div className="flex flex-wrap gap-2"><CopyBtn text={rows.map(r=>`${r.label}: ${r.value}`).join("\n")} label="Copy results"/><button type="button" className="btn btn-ghost btn-sm" onClick={onReset}>Reset</button></div>}
function One({label,v0,calc}:{label:string;v0:number;calc:(v:number)=>Row[]}){const[v,setV]=useState(String(v0));const rows=calc(num(v));return <div className="space-y-4"><div className="card p-4"><Field label={label}><input className="input" type="number" value={v} onChange={e=>setV(e.target.value)}/></Field></div><div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{rows.map(r=><Stat key={r.label} label={r.label} value={r.value} sub={r.sub}/>)}</div><Actions rows={rows} onReset={()=>setV(String(v0))}/></div>}
function Two({aLabel,bLabel,a0,b0,calc}:{aLabel:string;bLabel:string;a0:number;b0:number;calc:(a:number,b:number)=>Row[]}){const[a,setA]=useState(String(a0)),[b,setB]=useState(String(b0));const rows=calc(num(a),num(b));return <div className="space-y-4"><div className="card grid gap-3 p-4 sm:grid-cols-2"><Field label={aLabel}><input className="input" type="number" value={a} onChange={e=>setA(e.target.value)}/></Field><Field label={bLabel}><input className="input" type="number" value={b} onChange={e=>setB(e.target.value)}/></Field></div><div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{rows.map(r=><Stat key={r.label} label={r.label} value={r.value} sub={r.sub}/>)}</div><Actions rows={rows} onReset={()=>{setA(String(a0));setB(String(b0));}}/></div>}

function RhumbTool({kind}:{kind:"distance"|"bearing"}){
 const[aLat,setALat]=useState("40.7128"),[aLng,setALng]=useState("-74.0060"),[bLat,setBLat]=useState("51.5074"),[bLng,setBLng]=useState("-0.1278");
 const out=useMemo(()=>{
  const la1=num(aLat),lo1=num(aLng),la2=num(bLat),lo2=num(bLng);
  const valid=[la1,lo1,la2,lo2].every(Number.isFinite)&&Math.abs(la1)<=90&&Math.abs(la2)<=90&&Math.abs(lo1)<=180&&Math.abs(lo2)<=180;
  if(!valid)return null;
  const p1=rad(la1),p2=rad(la2),dp=p2-p1;let dl=rad(lo2-lo1);
  if(Math.abs(dl)>Math.PI)dl=dl>0?-(2*Math.PI-dl):(2*Math.PI+dl);
  const dpsi=Math.log(Math.tan(Math.PI/4+p2/2)/Math.tan(Math.PI/4+p1/2));
  const q=Math.abs(dpsi)>1e-12?dp/dpsi:Math.cos(p1);
  const rhumbDist=Math.sqrt(dp*dp+q*q*dl*dl)*R;
  const rhumbBearing=(deg(Math.atan2(dl,dpsi))+360)%360;
  const h=Math.sin(dp/2)**2+Math.cos(p1)*Math.cos(p2)*Math.sin(dl/2)**2;
  const greatCircle=2*R*Math.asin(Math.min(1,Math.sqrt(h)));
  return{rhumbDist,rhumbBearing,greatCircle,difference:rhumbDist-greatCircle};
 },[aLat,aLng,bLat,bLng]);
 const rows:Row[]=out?[{label:"Rhumb-line distance",value:`${fmt(out.rhumbDist,2)} km`},{label:"Rhumb bearing",value:`${fmt(out.rhumbBearing,2)}°`},{label:"Great-circle distance",value:`${fmt(out.greatCircle,2)} km`},{label:"Rhumb vs great-circle",value:`${out.difference>=0?"+":""}${fmt(out.difference,2)} km`,sub:"difference in path length"}]:[];
 return <div className="space-y-4"><div className="card grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-4"><Field label="Start latitude"><input className="input" value={aLat} onChange={e=>setALat(e.target.value)}/></Field><Field label="Start longitude"><input className="input" value={aLng} onChange={e=>setALng(e.target.value)}/></Field><Field label="End latitude"><input className="input" value={bLat} onChange={e=>setBLat(e.target.value)}/></Field><Field label="End longitude"><input className="input" value={bLng} onChange={e=>setBLng(e.target.value)}/></Field></div>{!out?<ErrorBox>Enter valid latitude and longitude values.</ErrorBox>:<><div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">{rows.map(r=><Stat key={r.label} label={r.label} value={r.value} sub={r.sub}/>)}</div><p className="text-xs text-mute">Rhumb lines keep a constant compass bearing. Great-circle routes are usually shorter over long distances, so the two values are intentionally different.</p><Actions rows={rows} onReset={()=>{setALat("40.7128");setALng("-74.0060");setBLat("51.5074");setBLng("-0.1278");}}/></>}</div>;
}

function RouteMath({mode}:{mode:string}){
 if(mode==="rhumb-distance")return <RhumbTool kind="distance"/>;
 if(mode==="rhumb-bearing")return <RhumbTool kind="bearing"/>;
 if(mode==="greatcircle-bearing")return <BearingTool params={{coordInputs:true}}/>;
 if(mode==="distance-percent")return <Two aLabel="Part distance (km)" bLabel="Total distance (km)" a0={25} b0={100} calc={(a,b)=>[{label:"Percent of route",value:b>0?`${fmt(a/b*100,2)}%`:"—"},{label:"Remaining",value:`${fmt(Math.max(0,b-a),2)} km`},{label:"Completed distance",value:`${fmt(a,2)} km`}]}/>;
 if(mode==="pace-speed")return <One label="Pace (min/km)" v0={6} calc={(p)=>[{label:"Speed",value:p>0?`${fmt(60/p,2)} km/h`:"—"},{label:"mph",value:p>0?`${fmt(60/p*0.621371,2)} mph`:"—"},{label:"min/mile",value:p>0?`${fmt(p*1.609344,2)} min/mi`:"—"}]}/>;
 if(mode==="speed-pace")return <One label="Speed (km/h)" v0={10} calc={(s)=>[{label:"Pace",value:s>0?`${fmt(60/s,2)} min/km`:"—"},{label:"min/mile",value:s>0?`${fmt(60/(s*0.621371),2)} min/mi`:"—"},{label:"mph",value:`${fmt(s*0.621371,2)} mph`}]}/>;
 return null;
}

function Farm({mode}:{mode:string}){
 if(mode==="plants-row")return <Two aLabel="Row length (m)" bLabel="Plant spacing (cm)" a0={100} b0={30} calc={(l,s)=>[{label:"Plants per row",value:s>0?String(Math.floor(l*100/s)+1):"—"},{label:"Spacing",value:`${fmt(s,1)} cm`},{label:"Row length",value:`${fmt(l,1)} m`}]}/>;
 if(mode==="rows-field")return <Two aLabel="Field width (m)" bLabel="Row spacing (m)" a0={80} b0={0.75} calc={(w,s)=>[{label:"Approx. rows",value:s>0?String(Math.floor(w/s)):"—"},{label:"Unused width",value:s>0?`${fmt(w-Math.floor(w/s)*s,2)} m`:"—"},{label:"Row spacing",value:`${fmt(s,2)} m`}]}/>;
 if(mode==="plants-field")return <PlantField/>;
 if(mode==="mulch-volume")return <Mulch/>;
 if(mode==="soil-volume")return <Mulch label="Soil volume"/>;
 if(mode==="irrigation-flow")return <Two aLabel="Flow rate (L/min)" bLabel="Run time (minutes)" a0={20} b0={60} calc={(f,t)=>[{label:"Water applied",value:`${fmt(f*t,1)} L`},{label:"m³",value:`${fmt(f*t/1000,3)} m³`},{label:"Litres per hour",value:`${fmt(f*60,0)} L/h`}]}/>;
 if(mode==="water-depth")return <Two aLabel="Water volume (litres)" bLabel="Area (m²)" a0={1000} b0={100} calc={(v,a)=>[{label:"Equivalent water depth",value:a>0?`${fmt(v/a,2)} mm`:"—"},{label:"Volume",value:`${fmt(v,0)} L`},{label:"Area",value:`${fmt(a,1)} m²`}]}/>;
 if(mode==="fertilizer-area")return <Two aLabel="Area (m²)" bLabel="Application rate (g/m²)" a0={500} b0={35} calc={(a,r)=>[{label:"Fertilizer needed",value:`${fmt(a*r/1000,2)} kg`},{label:"Grams",value:`${fmt(a*r,0)} g`},{label:"25 kg bags",value:String(Math.ceil((a*r/1000)/25))}]}/>;
 return null;
}
function PlantField(){const[l,setL]=useState("100"),[w,setW]=useState("50"),[rs,setRs]=useState("0.75"),[ps,setPs]=useState("0.3");const rows=Math.max(0,Math.floor(num(w)/Math.max(.0001,num(rs)))),per=Math.max(0,Math.floor(num(l)/Math.max(.0001,num(ps)))+1),total=rows*per;const out:Row[]=[{label:"Rows",value:String(rows)},{label:"Plants per row",value:String(per)},{label:"Approx. total plants",value:String(total)},{label:"Field area",value:`${fmt(num(l)*num(w),1)} m²`}];return <div className="space-y-4"><div className="card grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-4"><Field label="Field length (m)"><input className="input" value={l} onChange={e=>setL(e.target.value)}/></Field><Field label="Field width (m)"><input className="input" value={w} onChange={e=>setW(e.target.value)}/></Field><Field label="Row spacing (m)"><input className="input" value={rs} onChange={e=>setRs(e.target.value)}/></Field><Field label="Plant spacing (m)"><input className="input" value={ps} onChange={e=>setPs(e.target.value)}/></Field></div><div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">{out.map(r=><Stat key={r.label} label={r.label} value={r.value}/>)}</div><Actions rows={out} onReset={()=>{setL("100");setW("50");setRs("0.75");setPs("0.3");}}/></div>}
function Mulch({label="Mulch volume"}:{label?:string}){const[a,setA]=useState("100"),[d,setD]=useState("5");const m3=num(a)*(num(d)/100);const rows:Row[]=[{label,value:`${fmt(m3,2)} m³`},{label:"Litres",value:`${fmt(m3*1000,0)} L`},{label:"20 L bags",value:String(Math.ceil(m3*1000/20))}];return <div className="space-y-4"><div className="card grid gap-3 p-4 sm:grid-cols-2"><Field label="Area (m²)"><input className="input" value={a} onChange={e=>setA(e.target.value)}/></Field><Field label="Depth (cm)"><input className="input" value={d} onChange={e=>setD(e.target.value)}/></Field></div><div className="grid gap-2 sm:grid-cols-3">{rows.map(r=><Stat key={r.label} label={r.label} value={r.value}/>)}</div><Actions rows={rows} onReset={()=>{setA("100");setD("5");}}/></div>}

export default function LongtailTools5({params}:{params?:Record<string,unknown>}){const mode=String(params?.mode||"");if(["rhumb-distance","rhumb-bearing","greatcircle-bearing","distance-percent","pace-speed","speed-pace"].includes(mode))return <RouteMath mode={mode}/>;if(["plants-row","rows-field","plants-field","mulch-volume","soil-volume","irrigation-flow","water-depth","fertilizer-area"].includes(mode))return <Farm mode={mode}/>;return <ErrorBox>This calculator mode is not configured.</ErrorBox>}
