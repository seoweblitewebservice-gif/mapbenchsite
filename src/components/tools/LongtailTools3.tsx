"use client";

import { useMemo, useState } from "react";
import { Field, Stat, ErrorBox } from "@/components/ui";

const R_KM = 6371.0088;
const toRad=(d:number)=>d*Math.PI/180;
const toDeg=(r:number)=>r*180/Math.PI;
const fmt=(n:number,d=2)=>Number.isFinite(n)?n.toFixed(d):"—";

function hav(lat1:number,lng1:number,lat2:number,lng2:number){
  const p1=toRad(lat1), p2=toRad(lat2), dp=toRad(lat2-lat1), dl=toRad(lng2-lng1);
  const h=Math.sin(dp/2)**2+Math.cos(p1)*Math.cos(p2)*Math.sin(dl/2)**2;
  return 2*R_KM*Math.asin(Math.sqrt(h));
}
function bearing(lat1:number,lng1:number,lat2:number,lng2:number){
  const p1=toRad(lat1),p2=toRad(lat2),dl=toRad(lng2-lng1);
  return (toDeg(Math.atan2(Math.sin(dl)*Math.cos(p2),Math.cos(p1)*Math.sin(p2)-Math.sin(p1)*Math.cos(p2)*Math.cos(dl)))+360)%360;
}
function midpoint(lat1:number,lng1:number,lat2:number,lng2:number){
  const p1=toRad(lat1),p2=toRad(lat2),dl=toRad(lng2-lng1);
  const bx=Math.cos(p2)*Math.cos(dl),by=Math.cos(p2)*Math.sin(dl);
  const p3=Math.atan2(Math.sin(p1)+Math.sin(p2),Math.sqrt((Math.cos(p1)+bx)**2+by**2));
  const l3=toRad(lng1)+Math.atan2(by,Math.cos(p1)+bx);
  return {lat:toDeg(p3),lng:((toDeg(l3)+540)%360)-180};
}

function Num({label,value,setValue}:{label:string;value:string;setValue:(v:string)=>void}){return <Field label={label}><input className="input" type="number" value={value} onChange={e=>setValue(e.target.value)}/></Field>}

function FourCoord({mode}:{mode:string}){
  const[a,setA]=useState("40.7128"),[b,setB]=useState("-74.0060"),[c,setC]=useState("51.5074"),[d,setD]=useState("-0.1278");
  const vals=[+a,+b,+c,+d];
  const ok=vals.every(Number.isFinite)&&Math.abs(vals[0])<=90&&Math.abs(vals[2])<=90&&Math.abs(vals[1])<=180&&Math.abs(vals[3])<=180;
  const dist=ok?hav(vals[0],vals[1],vals[2],vals[3]):NaN;
  const br=ok?bearing(vals[0],vals[1],vals[2],vals[3]):NaN;
  const mid=ok?midpoint(vals[0],vals[1],vals[2],vals[3]):null;
  return <div className="space-y-4"><div className="card grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-4"><Num label="Point A latitude" value={a} setValue={setA}/><Num label="Point A longitude" value={b} setValue={setB}/><Num label="Point B latitude" value={c} setValue={setC}/><Num label="Point B longitude" value={d} setValue={setD}/></div>{!ok?<ErrorBox>Enter valid latitude/longitude values.</ErrorBox>:<div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{mode==="flight-bearing"&&<><Stat label="Initial bearing" value={`${fmt(br,2)}°`}/><Stat label="Great-circle distance" value={`${fmt(dist,1)} km`}/></>}{mode==="great-circle-route"&&<><Stat label="Great-circle distance" value={`${fmt(dist,1)} km`}/><Stat label="Initial bearing" value={`${fmt(br,2)}°`}/><Stat label="Nautical miles" value={`${fmt(dist/1.852,1)} nmi`}/></>}{mode==="airport-midpoint"&&mid&&<><Stat label="Midpoint" value={`${fmt(mid.lat,5)}, ${fmt(mid.lng,5)}`}/><Stat label="Halfway distance" value={`${fmt(dist/2,1)} km`}/></>}{mode==="nautical-distance"&&<><Stat label="Nautical miles" value={`${fmt(dist/1.852,2)} nmi`}/><Stat label="Kilometres" value={`${fmt(dist,2)} km`}/></>}{mode==="nautical-bearing"&&<><Stat label="Initial bearing" value={`${fmt(br,2)}°`}/><Stat label="Distance" value={`${fmt(dist/1.852,2)} nmi`}/></>}</div>}</div>
}

function TwoNumber({mode}:{mode:string}){
  const[a,setA]=useState("500"),[b,setB]=useState("80");
  const x=+a,y=+b;
  let stats:{label:string;value:string;sub?:string}[]=[];
  if(mode==="flight-time-distance"){const h=y>0?x/y:NaN;stats=[{label:"Estimated flight time",value:`${fmt(h,2)} h`},{label:"Minutes",value:`${fmt(h*60,0)} min`}];}
  if(mode==="shipping-time"){const h=y>0?x/y:NaN;stats=[{label:"Transit time",value:`${fmt(h,2)} h`},{label:"Days",value:`${fmt(h/24,2)} days`}];}
  if(mode==="ship-speed-distance-time"){const h=y>0?x/y:NaN;stats=[{label:"Travel time",value:`${fmt(h,2)} h`},{label:"Days",value:`${fmt(h/24,2)} days`}];}
  if(mode==="delivery-fee-distance"){stats=[{label:"Delivery fee",value:fmt(x*y,2)},{label:"Rate",value:`${fmt(y,2)} per km`}];}
  if(mode==="service-call-cost"){stats=[{label:"Estimated call cost",value:fmt(x+y,2),sub:"base fee + travel charge"}];}
  if(mode==="technician-travel-time"){const h=y>0?x/y:NaN;stats=[{label:"Travel time",value:`${fmt(h,2)} h`},{label:"Minutes",value:`${fmt(h*60,0)} min`}];}
  if(mode==="delivery-radius-area"||mode==="customer-radius-area"||mode==="catchment-area"||mode==="sales-territory-area"){const area=Math.PI*x*x;stats=[{label:"Ideal circular area",value:`${fmt(area,2)} km²`},{label:"Diameter",value:`${fmt(x*2,2)} km`}];}
  if(mode==="branch-travel-cost"){stats=[{label:"Travel cost",value:fmt(x*y,2)},{label:"Round trip",value:fmt(x*y*2,2)}];}
  if(mode==="delivery-cost-km"||mode==="courier-charge"){stats=[{label:"Estimated charge",value:fmt(x*y,2)}];}
  if(mode==="lot-width"){stats=[{label:"Lot width",value:y>0?fmt(x/y,2):"—"},{label:"Area",value:fmt(x,2)}];}
  if(mode==="lot-depth"){stats=[{label:"Lot depth",value:y>0?fmt(x/y,2):"—"},{label:"Area",value:fmt(x,2)}];}
  if(mode==="square-perimeter-area"){const side=Math.sqrt(Math.max(0,x));stats=[{label:"Square side",value:fmt(side,2)},{label:"Perimeter",value:fmt(side*4,2)}];}
  if(mode==="square-acreage-perimeter"){const side=x/4;const area=side*side;stats=[{label:"Square area",value:`${fmt(area,2)} ft²`},{label:"Acres",value:`${fmt(area/43560,4)} acres`}];}
  if(mode==="field-coverage-time"||mode==="mowing-time"){const h=y>0?x/y:NaN;stats=[{label:"Estimated time",value:`${fmt(h,2)} h`},{label:"Minutes",value:`${fmt(h*60,0)} min`}];}
  if(mode==="fence-post-count"){stats=[{label:"Posts needed",value:y>0?String(Math.ceil(x/y)+1):"—"}];}
  if(mode==="garden-bed-area"){stats=[{label:"Area",value:fmt(x*y,2)},{label:"Perimeter",value:fmt(2*(x+y),2)}];}
  if(mode==="mulch-volume"){stats=[{label:"Volume",value:`${fmt(x*(y/100),3)} m³`},{label:"Litres",value:`${fmt(x*(y/100)*1000,0)} L`}];}
  const labels:Record<string,[string,string]>= {
    "flight-time-distance":["Distance (km)","Average speed (km/h)"],
    "shipping-time":["Distance (nautical miles)","Speed (knots)"],
    "ship-speed-distance-time":["Distance (nautical miles)","Speed (knots)"],
    "delivery-fee-distance":["Distance (km)","Fee per km"],
    "service-call-cost":["Base service fee","Travel charge"],
    "technician-travel-time":["Distance (km)","Average speed (km/h)"],
    "delivery-radius-area":["Radius (km)","Reference"],"customer-radius-area":["Radius (km)","Reference"],"catchment-area":["Radius (km)","Reference"],"sales-territory-area":["Radius (km)","Reference"],
    "branch-travel-cost":["Distance (km)","Cost per km"],"delivery-cost-km":["Distance (km)","Cost per km"],"courier-charge":["Distance (km)","Charge per km"],
    "lot-width":["Lot area (m²)","Lot depth (m)"],"lot-depth":["Lot area (m²)","Lot width (m)"],"square-perimeter-area":["Area (m²)","Reference"],"square-acreage-perimeter":["Perimeter (ft)","Reference"],
    "field-coverage-time":["Field area (acres)","Coverage rate (acres/hour)"],"mowing-time":["Lawn area (m²)","Mowing rate (m²/hour)"],"fence-post-count":["Fence length (m)","Post spacing (m)"],"garden-bed-area":["Length (m)","Width (m)"],"mulch-volume":["Area (m²)","Mulch depth (cm)"],
  };
  const [la,lb]=labels[mode]||["Value A","Value B"];
  return <div className="space-y-4"><div className="card grid gap-3 p-4 sm:grid-cols-2"><Num label={la} value={a} setValue={setA}/><Num label={lb} value={b} setValue={setB}/></div><div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{stats.map(s=><Stat key={s.label} label={s.label} value={s.value} sub={s.sub}/>)}</div></div>
}

function GeoReference({mode}:{mode:string}){
  const[lat,setLat]=useState("28.6139"),[lng,setLng]=useState("77.2090");const la=+lat,lo=+lng;
  const kmLat=111.195,kmLng=111.32*Math.cos(toRad(la));
  let label="Result",value="—",sub: string|undefined;
  if(mode==="distance-equator"){label="Distance from Equator";value=`${fmt(Math.abs(la)*kmLat,1)} km`;sub=la>=0?"Northern Hemisphere":"Southern Hemisphere";}
  if(mode==="distance-prime"){label="Approx. east-west distance from Prime Meridian";value=`${fmt(Math.abs(lo)*Math.abs(kmLng),1)} km`;sub=lo>=0?"East longitude":"West longitude";}
  if(mode==="hemisphere"){label="Hemisphere";value=`${la>=0?"Northern":"Southern"} / ${lo>=0?"Eastern":"Western"}`;}
  const parallels:Record<string,[number,string]>={"distance-tropic-cancer":[23.4366,"Tropic of Cancer"],"distance-tropic-capricorn":[-23.4366,"Tropic of Capricorn"],"distance-arctic-circle":[66.5634,"Arctic Circle"],"distance-antarctic-circle":[-66.5634,"Antarctic Circle"]};
  if(parallels[mode]){const[p,n]=parallels[mode];label=`Distance from ${n}`;value=`${fmt(Math.abs(la-p)*kmLat,1)} km`;sub=`Latitude difference ${fmt(Math.abs(la-p),3)}°`;}
  if(mode==="latitude-band"){label="Latitude band";value=Math.abs(la)<23.4366?"Tropical":Math.abs(la)<66.5634?"Mid-latitude":"Polar";}
  if(mode==="longitude-zone"){const zone=Math.round(lo/15);label="Approximate 15° longitude zone";value=`UTC${zone>=0?"+":""}${zone}`;sub="Geographic approximation only; political time zones differ.";}
  return <div className="space-y-4"><div className="card grid gap-3 p-4 sm:grid-cols-2"><Num label="Latitude" value={lat} setValue={setLat}/><Num label="Longitude" value={lng} setValue={setLng}/></div><Stat label={label} value={value} sub={sub}/></div>
}

function SimpleConvert({mode}:{mode:string}){const[v,setV]=useState("1");const x=+v;let label="Result",value="—";if(mode==="hectares-square-km"){label="Square kilometres";value=fmt(x*0.01,6)}if(mode==="acres-square-feet"){label="Square feet";value=fmt(x*43560,2)}if(mode==="sqm-hectares"){label="Hectares";value=fmt(x/10000,6)}return <div className="space-y-4"><div className="card p-4"><Num label="Value" value={v} setValue={setV}/></div><Stat label={label} value={value}/></div>}

export default function LongtailTools3({params}:{params?:Record<string,unknown>}){
 const mode=String(params?.mode||"");
 if(["flight-bearing","great-circle-route","airport-midpoint","nautical-distance","nautical-bearing"].includes(mode))return <FourCoord mode={mode}/>;
 if(["distance-equator","distance-prime","hemisphere","distance-tropic-cancer","distance-tropic-capricorn","distance-arctic-circle","distance-antarctic-circle","latitude-band","longitude-zone"].includes(mode))return <GeoReference mode={mode}/>;
 if(["hectares-square-km","acres-square-feet","sqm-hectares"].includes(mode))return <SimpleConvert mode={mode}/>;
 const supported=["flight-time-distance","shipping-time","ship-speed-distance-time","delivery-fee-distance","service-call-cost","technician-travel-time","delivery-radius-area","customer-radius-area","catchment-area","sales-territory-area","branch-travel-cost","delivery-cost-km","courier-charge","lot-width","lot-depth","square-perimeter-area","square-acreage-perimeter","field-coverage-time","mowing-time","fence-post-count","garden-bed-area","mulch-volume"];
 if(supported.includes(mode))return <TwoNumber mode={mode}/>;
 return <ErrorBox>This calculator mode is not configured.</ErrorBox>;
}
