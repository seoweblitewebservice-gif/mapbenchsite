"use client";
import { useMemo, useState } from "react";
import { Field, Stat, ErrorBox } from "@/components/ui";

const R=6371.0088;
const rad=(d:number)=>d*Math.PI/180;
const deg=(r:number)=>r*180/Math.PI;
const fmt=(n:number,d=2)=>Number.isFinite(n)?n.toFixed(d):"—";
const num=(s:string)=>Number.isFinite(+s)?+s:0;

type Row={label:string;value:string;sub?:string};
function Two({aLabel,bLabel,a0,b0,calc}:{aLabel:string;bLabel:string;a0:number;b0:number;calc:(a:number,b:number)=>Row[]}){const[a,setA]=useState(String(a0)),[b,setB]=useState(String(b0));const rows=calc(num(a),num(b));return <div className="space-y-4"><div className="card grid gap-3 p-4 sm:grid-cols-2"><Field label={aLabel}><input className="input" type="number" value={a} onChange={e=>setA(e.target.value)}/></Field><Field label={bLabel}><input className="input" type="number" value={b} onChange={e=>setB(e.target.value)}/></Field></div><div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{rows.map(r=><Stat key={r.label} label={r.label} value={r.value} sub={r.sub}/>)}</div></div>}

function RouteMath({mode}:{mode:string}){
 if(mode==="rhumb-distance")return <CoordPair kind="distance"/>;
 if(mode==="rhumb-bearing")return <CoordPair kind="bearing"/>;
 if(mode==="greatcircle-bearing")return <CoordPair kind="greatbearing"/>;
 if(mode==="distance-percent")return <Two aLabel="Part distance (km)" bLabel="Total distance (km)" a0={25} b0={100} calc={(a,b)=>[{label:"Percent of route",value:b>0?`${fmt(a/b*100,2)}%`:"—"},{label:"Remaining",value:`${fmt(Math.max(0,b-a),2)} km`}]}/>;
 if(mode==="pace-speed")return <Two aLabel="Pace (min/km)" bLabel="Reference only" a0={6} b0={0} calc={(p)=>[{label:"Speed",value:p>0?`${fmt(60/p,2)} km/h`:"—"},{label:"mph",value:p>0?`${fmt(60/p*0.621371,2)} mph`:"—"}]}/>;
 if(mode==="speed-pace")return <Two aLabel="Speed (km/h)" bLabel="Reference only" a0={10} b0={0} calc={(s)=>[{label:"Pace",value:s>0?`${fmt(60/s,2)} min/km`:"—"},{label:"min/mile",value:s>0?`${fmt(60/(s*0.621371),2)} min/mi`:"—"}]}/>;
 return null;
}
function CoordPair({kind}:{kind:string}){const[aLat,setALat]=useState("40.7128"),[aLng,setALng]=useState("-74.0060"),[bLat,setBLat]=useState("51.5074"),[bLng,setBLng]=useState("-0.1278");const out=useMemo(()=>{const p1=rad(num(aLat)),p2=rad(num(bLat)),dl=rad(num(bLng)-num(aLng)),dp=p2-p1;const dpsi=Math.log(Math.tan(Math.PI/4+p2/2)/Math.tan(Math.PI/4+p1/2));const q=Math.abs(dpsi)>1e-12?dp/dpsi:Math.cos(p1);const dlAdj=Math.abs(dl)>Math.PI?(dl>0?-(2*Math.PI-dl):(2*Math.PI+dl)):dl;const rhumbDist=Math.sqrt(dp*dp+q*q*dlAdj*dlAdj)*R;const rhumbBearing=(deg(Math.atan2(dlAdj,dpsi))+360)%360;const y=Math.sin(dl)*Math.cos(p2),x=Math.cos(p1)*Math.sin(p2)-Math.sin(p1)*Math.cos(p2)*Math.cos(dl);const gc=(deg(Math.atan2(y,x))+360)%360;return{rhumbDist,rhumbBearing,gc};},[aLat,aLng,bLat,bLng]);return <div className="space-y-4"><div className="card grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-4"><Field label="Start latitude"><input className="input" value={aLat} onChange={e=>setALat(e.target.value)}/></Field><Field label="Start longitude"><input className="input" value={aLng} onChange={e=>setALng(e.target.value)}/></Field><Field label="End latitude"><input className="input" value={bLat} onChange={e=>setBLat(e.target.value)}/></Field><Field label="End longitude"><input className="input" value={bLng} onChange={e=>setBLng(e.target.value)}/></Field></div><Stat label={kind==="distance"?"Rhumb-line distance":kind==="bearing"?"Rhumb-line bearing":"Initial great-circle bearing"} value={kind==="distance"?`${fmt(out.rhumbDist,2)} km`:kind==="bearing"?`${fmt(out.rhumbBearing,2)}°`:`${fmt(out.gc,2)}°`}/></div>}

function Farm({mode}:{mode:string}){
 if(mode==="plants-row")return <Two aLabel="Row length (m)" bLabel="Plant spacing (cm)" a0={100} b0={30} calc={(l,s)=>[{label:"Plants per row",value:s>0?String(Math.floor(l*100/s)+1):"—"},{label:"Spacing",value:`${fmt(s,1)} cm`}]}/>;
 if(mode==="rows-field")return <Two aLabel="Field width (m)" bLabel="Row spacing (m)" a0={80} b0={0.75} calc={(w,s)=>[{label:"Approx. rows",value:s>0?String(Math.floor(w/s)):"—"},{label:"Unused width",value:s>0?`${fmt(w-Math.floor(w/s)*s,2)} m`:"—"}]}/>;
 if(mode==="plants-field")return <PlantField/>;
 if(mode==="mulch-volume")return <Mulch/>;
 if(mode==="soil-volume")return <Mulch label="Soil volume"/>;
 if(mode==="irrigation-flow")return <Two aLabel="Flow rate (L/min)" bLabel="Run time (minutes)" a0={20} b0={60} calc={(f,t)=>[{label:"Water applied",value:`${fmt(f*t,1)} L`},{label:"m³",value:`${fmt(f*t/1000,3)} m³`}]}/>;
 if(mode==="water-depth")return <Two aLabel="Water volume (litres)" bLabel="Area (m²)" a0={1000} b0={100} calc={(v,a)=>[{label:"Equivalent water depth",value:a>0?`${fmt(v/a,2)} mm`:"—"},{label:"Volume",value:`${fmt(v,0)} L`}]}/>;
 if(mode==="fertilizer-area")return <Two aLabel="Area (m²)" bLabel="Application rate (g/m²)" a0={500} b0={35} calc={(a,r)=>[{label:"Fertilizer needed",value:`${fmt(a*r/1000,2)} kg`},{label:"Grams",value:`${fmt(a*r,0)} g`}]}/>;
 return null;
}
function PlantField(){const[l,setL]=useState("100"),[w,setW]=useState("50"),[rs,setRs]=useState("0.75"),[ps,setPs]=useState("0.3");const rows=Math.max(0,Math.floor(num(w)/Math.max(.0001,num(rs)))),per=Math.max(0,Math.floor(num(l)/Math.max(.0001,num(ps)))+1);return <div className="space-y-4"><div className="card grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-4"><Field label="Field length (m)"><input className="input" value={l} onChange={e=>setL(e.target.value)}/></Field><Field label="Field width (m)"><input className="input" value={w} onChange={e=>setW(e.target.value)}/></Field><Field label="Row spacing (m)"><input className="input" value={rs} onChange={e=>setRs(e.target.value)}/></Field><Field label="Plant spacing (m)"><input className="input" value={ps} onChange={e=>setPs(e.target.value)}/></Field></div><div className="grid gap-2 sm:grid-cols-3"><Stat label="Rows" value={String(rows)}/><Stat label="Plants per row" value={String(per)}/><Stat label="Approx. total plants" value={String(rows*per)}/></div></div>}
function Mulch({label="Mulch volume"}:{label?:string}){const[a,setA]=useState("100"),[d,setD]=useState("5");const m3=num(a)*(num(d)/100);return <div className="space-y-4"><div className="card grid gap-3 p-4 sm:grid-cols-2"><Field label="Area (m²)"><input className="input" value={a} onChange={e=>setA(e.target.value)}/></Field><Field label="Depth (cm)"><input className="input" value={d} onChange={e=>setD(e.target.value)}/></Field></div><div className="grid gap-2 sm:grid-cols-2"><Stat label={label} value={`${fmt(m3,2)} m³`}/><Stat label="Litres" value={`${fmt(m3*1000,0)} L`}/></div></div>}

export default function LongtailTools5({params}:{params?:Record<string,unknown>}){const mode=String(params?.mode||"");if(["rhumb-distance","rhumb-bearing","greatcircle-bearing","distance-percent","pace-speed","speed-pace"].includes(mode))return <RouteMath mode={mode}/>;if(["plants-row","rows-field","plants-field","mulch-volume","soil-volume","irrigation-flow","water-depth","fertilizer-area"].includes(mode))return <Farm mode={mode}/>;return <ErrorBox>This calculator mode is not configured.</ErrorBox>}
