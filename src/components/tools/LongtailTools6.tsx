"use client";

import { useMemo, useState } from "react";
import { Field, Stat, ErrorBox } from "@/components/ui";

const R = 6378137;
const C = 2 * Math.PI * R;
const rad=(d:number)=>d*Math.PI/180;
const deg=(r:number)=>r*180/Math.PI;
const fmt=(n:number,d=6)=>Number.isFinite(n)?n.toFixed(d):"—";
const num=(v:string)=>Number.isFinite(+v)?+v:0;
const clampLat=(lat:number)=>Math.max(-85.05112878,Math.min(85.05112878,lat));

function Pair({aLabel,bLabel,a0,b0,calc}:{aLabel:string;bLabel:string;a0:number;b0:number;calc:(a:number,b:number)=>{label:string;value:string;sub?:string}[]}){
 const[a,setA]=useState(String(a0)),[b,setB]=useState(String(b0)); const rows=calc(num(a),num(b));
 return <div className="space-y-4"><div className="card grid gap-3 p-4 sm:grid-cols-2"><Field label={aLabel}><input className="input" value={a} onChange={e=>setA(e.target.value)}/></Field><Field label={bLabel}><input className="input" value={b} onChange={e=>setB(e.target.value)}/></Field></div><div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{rows.map(r=><Stat key={r.label} label={r.label} value={r.value} sub={r.sub}/>)}</div></div>
}

function Triple({labels,vals,calc}:{labels:[string,string,string];vals:[number,number,number];calc:(a:number,b:number,c:number)=>{label:string;value:string;sub?:string}[]}){
 const[a,setA]=useState(String(vals[0])),[b,setB]=useState(String(vals[1])),[c,setC]=useState(String(vals[2]));const rows=calc(num(a),num(b),num(c));
 return <div className="space-y-4"><div className="card grid gap-3 p-4 sm:grid-cols-3"><Field label={labels[0]}><input className="input" value={a} onChange={e=>setA(e.target.value)}/></Field><Field label={labels[1]}><input className="input" value={b} onChange={e=>setB(e.target.value)}/></Field><Field label={labels[2]}><input className="input" value={c} onChange={e=>setC(e.target.value)}/></Field></div><div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{rows.map(r=><Stat key={r.label} label={r.label} value={r.value} sub={r.sub}/>)}</div></div>
}

function mercForward(lat:number,lng:number){lat=clampLat(lat);return{x:R*rad(lng),y:R*Math.log(Math.tan(Math.PI/4+rad(lat)/2))};}
function mercInverse(x:number,y:number){return{lng:deg(x/R),lat:deg(2*Math.atan(Math.exp(y/R))-Math.PI/2)};}
function tileXY(lat:number,lng:number,z:number){const n=2**z;lat=clampLat(lat);const x=(lng+180)/360*n;const y=(1-Math.asinh(Math.tan(rad(lat)))/Math.PI)/2*n;return{x,y};}
function tileNW(x:number,y:number,z:number){const n=2**z;const lng=x/n*360-180;const lat=deg(Math.atan(Math.sinh(Math.PI*(1-2*y/n))));return{lat,lng};}
function mpp(lat:number,z:number,tile=256){return Math.cos(rad(lat))*C/(tile*2**z);}

function QuadkeyTool({decode=false}:{decode?:boolean}){
 const[z,setZ]=useState("5"),[x,setX]=useState("10"),[y,setY]=useState("12"),[q,setQ]=useState("12022");
 if(!decode){let out="";const zi=Math.max(0,Math.floor(num(z)));for(let i=zi;i>0;i--){let d=0;const mask=1<<(i-1);if((Math.floor(num(x))&mask)!==0)d++;if((Math.floor(num(y))&mask)!==0)d+=2;out+=String(d);}return <div className="space-y-4"><div className="card grid gap-3 p-4 sm:grid-cols-3"><Field label="Zoom"><input className="input" value={z} onChange={e=>setZ(e.target.value)}/></Field><Field label="Tile X"><input className="input" value={x} onChange={e=>setX(e.target.value)}/></Field><Field label="Tile Y"><input className="input" value={y} onChange={e=>setY(e.target.value)}/></Field></div><Stat label="Quadkey" value={out||"0"}/></div>}
 let tx=0,ty=0;for(let i=q.length;i>0;i--){const mask=1<<(i-1);const d=Number(q[q.length-i]);if(d===1||d===3)tx|=mask;if(d===2||d===3)ty|=mask;}return <div className="space-y-4"><Field label="Quadkey"><input className="input" value={q} onChange={e=>setQ(e.target.value.replace(/[^0-3]/g,""))}/></Field><div className="grid gap-2 sm:grid-cols-3"><Stat label="Zoom" value={String(q.length)}/><Stat label="Tile X" value={String(tx)}/><Stat label="Tile Y" value={String(ty)}/></div></div>
}

function TextList({mode}:{mode:string}){const[text,setText]=useState("40.7128,-74.0060\n34.0522,-118.2437");const pts=useMemo(()=>text.split(/\r?\n/).map(s=>s.trim()).filter(Boolean).map(s=>{const [a,b]=s.split(/[,\s]+/).map(Number);return{lat:a,lng:b}}).filter(p=>Number.isFinite(p.lat)&&Number.isFinite(p.lng)),[text]);let rows:{label:string;value:string}[]=[];if(mode==="coordinate-span"&&pts.length){const lats=pts.map(p=>p.lat),lngs=pts.map(p=>p.lng);rows=[{label:"Latitude span",value:`${fmt(Math.max(...lats)-Math.min(...lats),6)}°`},{label:"Longitude span",value:`${fmt(Math.max(...lngs)-Math.min(...lngs),6)}°`}];}if(mode==="coordinate-mean"&&pts.length){rows=[{label:"Mean latitude",value:fmt(pts.reduce((s,p)=>s+p.lat,0)/pts.length,6)},{label:"Mean longitude",value:fmt(pts.reduce((s,p)=>s+p.lng,0)/pts.length,6)}];}return <div className="space-y-4"><Field label="Coordinates (one lat,lng per line)"><textarea className="input min-h-40 font-mono text-xs" value={text} onChange={e=>setText(e.target.value)}/></Field>{pts.length?<div className="grid gap-2 sm:grid-cols-2">{rows.map(r=><Stat key={r.label} label={r.label} value={r.value}/>)}</div>:<ErrorBox>Enter at least one valid latitude/longitude pair.</ErrorBox>}</div>}

export default function LongtailTools6({params}:{params?:Record<string,unknown>}){
 const mode=String(params?.mode||"");
 if(mode==="webmerc-forward")return <Pair aLabel="Latitude" bLabel="Longitude" a0={40.7128} b0={-74.006} calc={(lat,lng)=>{const p=mercForward(lat,lng);return[{label:"Web Mercator X",value:`${fmt(p.x,3)} m`},{label:"Web Mercator Y",value:`${fmt(p.y,3)} m`}]}}/>;
 if(mode==="webmerc-inverse")return <Pair aLabel="Web Mercator X (m)" bLabel="Web Mercator Y (m)" a0={-8238310} b0={4970071} calc={(x,y)=>{const p=mercInverse(x,y);return[{label:"Latitude",value:`${fmt(p.lat,6)}°`},{label:"Longitude",value:`${fmt(p.lng,6)}°`}]}}/>;
 if(mode==="meters-per-pixel")return <Triple labels={["Latitude","Zoom","Tile size (px)"]} vals={[40,12,256]} calc={(lat,z,t)=>[{label:"Ground resolution",value:`${fmt(mpp(lat,z,t),3)} m/px`},{label:"Tile ground width",value:`${fmt(mpp(lat,z,t)*t,1)} m`}]} />;
 if(mode==="zoom-from-resolution")return <Triple labels={["Latitude","Target meters/pixel","Tile size (px)"]} vals={[40,10,256]} calc={(lat,res,t)=>{const z=Math.log2(Math.cos(rad(lat))*C/(Math.max(.000001,res)*t));return[{label:"Approx. zoom",value:fmt(z,3)},{label:"Nearest integer zoom",value:String(Math.max(0,Math.round(z)))}]} }/>;
 if(mode==="latlon-to-tile")return <Triple labels={["Latitude","Longitude","Zoom"]} vals={[40.7128,-74.006,12]} calc={(lat,lng,z)=>{const p=tileXY(lat,lng,Math.floor(z));return[{label:"Tile X",value:String(Math.floor(p.x))},{label:"Tile Y",value:String(Math.floor(p.y))},{label:"Fractional tile",value:`${fmt(p.x,4)}, ${fmt(p.y,4)}`}]} }/>;
 if(mode==="tile-to-latlon")return <Triple labels={["Tile X","Tile Y","Zoom"]} vals={[1205,1539,12]} calc={(x,y,z)=>{const p=tileNW(x,y,Math.floor(z));return[{label:"NW latitude",value:`${fmt(p.lat,6)}°`},{label:"NW longitude",value:`${fmt(p.lng,6)}°`}]} }/>;
 if(mode==="tile-bounds")return <Triple labels={["Tile X","Tile Y","Zoom"]} vals={[1205,1539,12]} calc={(x,y,z)=>{const nw=tileNW(x,y,Math.floor(z)),se=tileNW(x+1,y+1,Math.floor(z));return[{label:"North / West",value:`${fmt(nw.lat,6)}, ${fmt(nw.lng,6)}`},{label:"South / East",value:`${fmt(se.lat,6)}, ${fmt(se.lng,6)}`}]} }/>;
 if(mode==="tile-center")return <Triple labels={["Tile X","Tile Y","Zoom"]} vals={[1205,1539,12]} calc={(x,y,z)=>{const p=tileNW(x+.5,y+.5,Math.floor(z));return[{label:"Tile centre",value:`${fmt(p.lat,6)}, ${fmt(p.lng,6)}`}]} }/>;
 if(mode==="tile-count")return <Pair aLabel="Zoom" bLabel="Reference only" a0={12} b0={0} calc={(z)=>{const n=2**Math.max(0,Math.floor(z));return[{label:"Tiles per axis",value:n.toLocaleString()},{label:"Total world tiles",value:(n*n).toLocaleString()}]}}/>;
 if(mode==="world-pixel")return <Triple labels={["Latitude","Longitude","Zoom"]} vals={[40.7128,-74.006,12]} calc={(lat,lng,z)=>{const p=tileXY(lat,lng,Math.floor(z));return[{label:"World pixel X",value:fmt(p.x*256,2)},{label:"World pixel Y",value:fmt(p.y*256,2)}]} }/>;
 if(mode==="tile-pixel-offset")return <Triple labels={["Latitude","Longitude","Zoom"]} vals={[40.7128,-74.006,12]} calc={(lat,lng,z)=>{const p=tileXY(lat,lng,Math.floor(z));return[{label:"Pixel X inside tile",value:fmt((p.x-Math.floor(p.x))*256,2)},{label:"Pixel Y inside tile",value:fmt((p.y-Math.floor(p.y))*256,2)}]} }/>;
 if(mode==="quadkey-encode")return <QuadkeyTool/>;
 if(mode==="quadkey-decode")return <QuadkeyTool decode/>;
 if(mode==="mercator-scale-factor")return <Pair aLabel="Latitude" bLabel="Reference only" a0={45} b0={0} calc={(lat)=>{const k=1/Math.cos(rad(clampLat(lat)));return[{label:"Scale factor",value:fmt(k,6)},{label:"Distortion",value:`${fmt((k-1)*100,3)}%`}]} }/>;
 if(mode==="earth-circumference-latitude")return <Pair aLabel="Latitude" bLabel="Reference only" a0={45} b0={0} calc={(lat)=>[{label:"Parallel circumference",value:`${fmt(C*Math.cos(rad(lat))/1000,3)} km`},{label:"1° longitude length",value:`${fmt(C*Math.cos(rad(lat))/360/1000,3)} km`}]} />;
 if(mode==="earth-arc-length")return <Pair aLabel="Central angle (degrees)" bLabel="Earth radius (km)" a0={10} b0={6371.0088} calc={(a,r)=>[{label:"Arc length",value:`${fmt(rad(a)*r,3)} km`},{label:"Nautical miles",value:`${fmt(rad(a)*r/1.852,3)} nmi`}]} />;
 if(mode==="earth-chord-length")return <Pair aLabel="Central angle (degrees)" bLabel="Earth radius (km)" a0={10} b0={6371.0088} calc={(a,r)=>[{label:"Chord length",value:`${fmt(2*r*Math.sin(rad(a)/2),3)} km`},{label:"Arc minus chord",value:`${fmt(rad(a)*r-2*r*Math.sin(rad(a)/2),3)} km`}]} />;
 if(mode==="central-angle-distance")return <Pair aLabel="Surface distance (km)" bLabel="Earth radius (km)" a0={1000} b0={6371.0088} calc={(d,r)=>[{label:"Central angle",value:`${fmt(deg(d/r),6)}°`},{label:"Radians",value:fmt(d/r,8)}]} />;
 if(mode==="nautical-latitude")return <Pair aLabel="Latitude difference (degrees)" bLabel="Reference only" a0={1} b0={0} calc={(d)=>[{label:"Approx. nautical miles",value:`${fmt(Math.abs(d)*60,3)} nmi`},{label:"Kilometres",value:`${fmt(Math.abs(d)*60*1.852,3)} km`}]} />;
 if(mode==="coordinate-span"||mode==="coordinate-mean")return <TextList mode={mode}/>;
 if(mode==="map-pixels-ground")return <Triple labels={["Pixels","Meters per pixel","Reference only"]} vals={[500,2,0]} calc={(px,m)=>[{label:"Ground distance",value:`${fmt(px*m,2)} m`},{label:"Kilometres",value:`${fmt(px*m/1000,4)} km`}]} />;
 if(mode==="ground-distance-pixels")return <Triple labels={["Ground distance (m)","Meters per pixel","Reference only"]} vals={[1000,2,0]} calc={(d,m)=>[{label:"Pixel distance",value:m>0?`${fmt(d/m,2)} px`:"—"}]} />;
 if(mode==="tile-ground-width")return <Triple labels={["Latitude","Zoom","Tile size (px)"]} vals={[45,10,256]} calc={(lat,z,t)=>[{label:"Tile width on ground",value:`${fmt(mpp(lat,z,t)*t,2)} m`},{label:"Kilometres",value:`${fmt(mpp(lat,z,t)*t/1000,4)} km`}]} />;
 return <ErrorBox>This calculator mode is not configured.</ErrorBox>;
}
