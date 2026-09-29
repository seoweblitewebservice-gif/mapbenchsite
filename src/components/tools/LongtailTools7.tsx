"use client";
import { useState } from "react";
import { Field, Stat, ErrorBox } from "@/components/ui";

const fmt=(n:number,d=6)=>Number.isFinite(n)?n.toFixed(d):"—";
const num=(v:string)=>Number.isFinite(+v)?+v:0;
const rad=(d:number)=>d*Math.PI/180;

type Row={label:string;value:string;sub?:string};
function One({label,v0,calc}:{label:string;v0:number;calc:(v:number)=>Row[]}){const[v,setV]=useState(String(v0));const rows=calc(num(v));return <div className="space-y-4"><Field label={label}><input className="input" type="number" value={v} onChange={e=>setV(e.target.value)}/></Field><div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{rows.map(r=><Stat key={r.label} label={r.label} value={r.value} sub={r.sub}/>)}</div></div>}
function Two({aLabel,bLabel,a0,b0,calc}:{aLabel:string;bLabel:string;a0:number;b0:number;calc:(a:number,b:number)=>Row[]}){const[a,setA]=useState(String(a0)),[b,setB]=useState(String(b0));const rows=calc(num(a),num(b));return <div className="space-y-4"><div className="card grid gap-3 p-4 sm:grid-cols-2"><Field label={aLabel}><input className="input" type="number" value={a} onChange={e=>setA(e.target.value)}/></Field><Field label={bLabel}><input className="input" type="number" value={b} onChange={e=>setB(e.target.value)}/></Field></div><div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{rows.map(r=><Stat key={r.label} label={r.label} value={r.value} sub={r.sub}/>)}</div></div>}

export default function LongtailTools7({params}:{params?:Record<string,unknown>}){
 const mode=String(params?.mode||"");
 if(mode==="acres-hectares")return <One label="Acres" v0={10} calc={v=>[{label:"Hectares",value:fmt(v*0.40468564224,6)},{label:"Square metres",value:fmt(v*4046.8564224,2)}]}/>;
 if(mode==="hectares-acres")return <One label="Hectares" v0={10} calc={v=>[{label:"Acres",value:fmt(v*2.4710538147,6)},{label:"Square metres",value:fmt(v*10000,2)}]}/>;
 if(mode==="sqmi-sqkm")return <One label="Square miles" v0={5} calc={v=>[{label:"Square kilometres",value:fmt(v*2.589988110336,6)},{label:"Hectares",value:fmt(v*258.9988110336,3)}]}/>;
 if(mode==="sqkm-sqmi")return <One label="Square kilometres" v0={5} calc={v=>[{label:"Square miles",value:fmt(v*0.386102158542,6)},{label:"Hectares",value:fmt(v*100,3)}]}/>;
 if(mode==="feet-metres")return <One label="Feet" v0={1000} calc={v=>[{label:"Metres",value:fmt(v*0.3048,4)},{label:"Kilometres",value:fmt(v*0.0003048,6)}]}/>;
 if(mode==="metres-feet")return <One label="Metres" v0={1000} calc={v=>[{label:"Feet",value:fmt(v*3.280839895,4)},{label:"Miles",value:fmt(v/1609.344,6)}]}/>;
 if(mode==="nmi-km")return <One label="Nautical miles" v0={100} calc={v=>[{label:"Kilometres",value:fmt(v*1.852,4)},{label:"Statute miles",value:fmt(v*1.150779448,4)}]}/>;
 if(mode==="km-nmi")return <One label="Kilometres" v0={100} calc={v=>[{label:"Nautical miles",value:fmt(v/1.852,6)},{label:"Statute miles",value:fmt(v*0.6213711922,4)}]}/>;
 if(mode==="miles-km")return <One label="Miles" v0={100} calc={v=>[{label:"Kilometres",value:fmt(v*1.609344,4)},{label:"Metres",value:fmt(v*1609.344,2)}]}/>;
 if(mode==="km-miles")return <One label="Kilometres" v0={100} calc={v=>[{label:"Miles",value:fmt(v*0.6213711922,4)},{label:"Nautical miles",value:fmt(v/1.852,4)}]}/>;
 if(mode==="pace-km-mile")return <One label="Pace (minutes per km)" v0={5} calc={v=>[{label:"Minutes per mile",value:fmt(v*1.609344,3)},{label:"Equivalent km/h",value:v>0?fmt(60/v,3):"—"}]}/>;
 if(mode==="pace-mile-km")return <One label="Pace (minutes per mile)" v0={8} calc={v=>[{label:"Minutes per km",value:fmt(v/1.609344,3)},{label:"Equivalent mph",value:v>0?fmt(60/v,3):"—"}]}/>;
 if(mode==="degrees-radians")return <One label="Degrees" v0={180} calc={v=>[{label:"Radians",value:fmt(v*Math.PI/180,9)},{label:"Turns",value:fmt(v/360,6)}]}/>;
 if(mode==="radians-degrees")return <One label="Radians" v0={3.141592654} calc={v=>[{label:"Degrees",value:fmt(v*180/Math.PI,6)},{label:"Turns",value:fmt(v/(2*Math.PI),6)}]}/>;
 if(mode==="degrees-arcminutes")return <One label="Decimal degrees" v0={1.5} calc={v=>[{label:"Arcminutes",value:fmt(v*60,6)},{label:"Arcseconds",value:fmt(v*3600,3)}]}/>;
 if(mode==="arcminutes-degrees")return <One label="Arcminutes" v0={90} calc={v=>[{label:"Decimal degrees",value:fmt(v/60,8)},{label:"Arcseconds",value:fmt(v*60,3)}]}/>;
 if(mode==="arcseconds-ground")return <Two aLabel="Arcseconds" bLabel="Latitude (°)" a0={1} b0={45} calc={(a,lat)=>{const latm=Math.abs(a)*30.87;const lonm=Math.abs(a)*30.92*Math.cos(rad(lat));return[{label:"Latitude ground distance",value:`≈ ${fmt(latm,3)} m`},{label:"Longitude ground distance",value:`≈ ${fmt(lonm,3)} m`,sub:"spherical approximation"}]}}/>;
 if(mode==="map-ground-from-scale")return <Two aLabel="Map distance (cm)" bLabel="Scale denominator (1:n)" a0={5} b0={50000} calc={(cm,s)=>{const m=cm*s/100;return[{label:"Ground distance",value:`${fmt(m,2)} m`},{label:"Kilometres",value:`${fmt(m/1000,4)} km`} ]}}/>;
 if(mode==="map-distance-from-ground")return <Two aLabel="Ground distance (m)" bLabel="Scale denominator (1:n)" a0={1000} b0={50000} calc={(m,s)=>[{label:"Map distance",value:s>0?`${fmt(m*100/s,4)} cm`:"—"},{label:"Millimetres",value:s>0?`${fmt(m*1000/s,4)} mm`:"—"}]}/>;
 if(mode==="scale-ratio-from-distances")return <Two aLabel="Map distance (cm)" bLabel="Ground distance (m)" a0={2} b0={1000} calc={(cm,m)=>{const denom=cm>0?m*100/cm:NaN;return[{label:"Scale ratio",value:Number.isFinite(denom)?`1:${fmt(denom,0)}`:"—"},{label:"Denominator",value:fmt(denom,0)}]}}/>;
 return <ErrorBox>This calculator mode is not configured.</ErrorBox>;
}
