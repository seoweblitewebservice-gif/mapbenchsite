"use client";
import { useMemo, useState } from "react";
import { Field, Stat, ErrorBox } from "@/components/ui";

const fmt=(n:number,d=5)=>Number.isFinite(n)?n.toFixed(d):"—";

function CsvDiagnostics({mode}:{mode:string}){
  const[text,setText]=useState("lat,lng,name\n40.7128,-74.0060,New York\n51.5074,-0.1278,London");
  const parsed=useMemo(()=>{
    const lines=text.trim().split(/\r?\n/).filter(Boolean);
    if(!lines.length)return{headers:[],rows:[] as string[][]};
    const headers=lines[0].split(",").map(x=>x.trim());
    const rows=lines.slice(1).map(line=>line.split(",").map(x=>x.trim()));
    return{headers,rows};
  },[text]);
  const latI=parsed.headers.findIndex(h=>/^lat(itude)?$/i.test(h));
  const lngI=parsed.headers.findIndex(h=>/^(lng|lon|longitude)$/i.test(h));
  const valid=parsed.rows.filter(row=>{
    if(latI<0||lngI<0)return false;
    const lat=+row[latI],lng=+row[lngI];
    return Number.isFinite(lat)&&Number.isFinite(lng)&&lat>=-90&&lat<=90&&lng>=-180&&lng<=180;
  });
  const keys=valid.map(row=>`${row[latI]},${row[lngI]}`);
  const unique=new Set(keys);
  const lats=valid.map(row=>+row[latI]),lngs=valid.map(row=>+row[lngI]);
  const centre=valid.length?{
    lat:lats.reduce((a,b)=>a+b,0)/valid.length,
    lng:lngs.reduce((a,b)=>a+b,0)/valid.length,
  }:null;
  return <div className="space-y-3">
    <Field label="CSV text"><textarea className="input min-h-56 font-mono text-xs" value={text} onChange={e=>setText(e.target.value)}/></Field>
    {(latI<0||lngI<0)&&["csv-coordinate-validator","csv-coordinate-deduper","csv-coordinate-bbox","csv-coordinate-centroid"].includes(mode)&&<ErrorBox>Add latitude/lat and longitude/lng/lon columns in the header.</ErrorBox>}
    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
      {mode==="csv-coordinate-validator"&&<><Stat label="Valid coordinate rows" value={String(valid.length)}/><Stat label="Invalid / unsupported rows" value={String(parsed.rows.length-valid.length)}/></>}
      {mode==="csv-coordinate-deduper"&&<><Stat label="Unique coordinate pairs" value={String(unique.size)}/><Stat label="Duplicate coordinate rows" value={String(Math.max(0,valid.length-unique.size))}/></>}
      {mode==="csv-coordinate-bbox"&&<Stat label="Bounds (S, W, N, E)" value={valid.length?`${fmt(Math.min(...lats))}, ${fmt(Math.min(...lngs))}, ${fmt(Math.max(...lats))}, ${fmt(Math.max(...lngs))}`:"—"}/>} 
      {mode==="csv-coordinate-centroid"&&<Stat label="Mean coordinate centre" value={centre?`${fmt(centre.lat)}, ${fmt(centre.lng)}`:"—"}/>} 
      {mode==="csv-row-counter"&&<Stat label="Data rows" value={String(parsed.rows.length)}/>} 
      {mode==="csv-column-counter"&&<Stat label="Columns" value={String(parsed.headers.length)}/>} 
    </div>
  </div>;
}

function KmlDiagnostics({mode}:{mode:string}){
  const[text,setText]=useState('<?xml version="1.0"?><kml xmlns="http://www.opengis.net/kml/2.2"><Document><Placemark><name>Example</name><Point><coordinates>-74.006,40.7128,0</coordinates></Point></Placemark></Document></kml>');
  const parsed=useMemo(()=>{
    const doc=new DOMParser().parseFromString(text,"application/xml");
    if(doc.querySelector("parsererror"))return{ok:false,placemarks:0,coordinateBlocks:0,named:0};
    return{
      ok:true,
      placemarks:doc.querySelectorAll("Placemark").length,
      coordinateBlocks:doc.querySelectorAll("coordinates").length,
      named:doc.querySelectorAll("Placemark > name").length,
    };
  },[text]);
  return <div className="space-y-3">
    <Field label="KML / XML text"><textarea className="input min-h-56 font-mono text-xs" value={text} onChange={e=>setText(e.target.value)}/></Field>
    {!parsed.ok?<ErrorBox>Invalid XML/KML. Fix the XML syntax and try again.</ErrorBox>:<div className="grid gap-2 sm:grid-cols-3">
      {mode==="kml-placemark-counter"&&<Stat label="Placemarks" value={String(parsed.placemarks)}/>} 
      {mode==="kml-coordinate-block-counter"&&<Stat label="Coordinate blocks" value={String(parsed.coordinateBlocks)}/>} 
      {mode==="kml-name-counter"&&<Stat label="Named placemarks" value={String(parsed.named)}/>} 
    </div>}
  </div>;
}

export default function LongtailTools8({params}:{params?:Record<string,unknown>}){
  const mode=String(params?.mode||"");
  if(mode.startsWith("csv-"))return <CsvDiagnostics mode={mode}/>;
  if(mode.startsWith("kml-"))return <KmlDiagnostics mode={mode}/>;
  return <ErrorBox>This diagnostic mode is not configured.</ErrorBox>;
}
