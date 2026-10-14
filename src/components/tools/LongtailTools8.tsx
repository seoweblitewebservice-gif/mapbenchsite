"use client";
import { useEffect, useMemo, useState } from "react";
import { CopyBtn, ErrorBox, Field, Stat } from "@/components/ui";
import { downloadText, toCsv } from "@/lib/formats";

const fmt=(n:number,d=5)=>Number.isFinite(n)?n.toFixed(d):"—";

function parseCsvLine(line:string){const out:string[]=[];let cur="",quoted=false;for(let i=0;i<line.length;i++){const ch=line[i];if(ch==='"'){if(quoted&&line[i+1]==='"'){cur+='"';i++;}else quoted=!quoted;}else if(ch===","&&!quoted){out.push(cur);cur="";}else cur+=ch;}out.push(cur);return out;}
function parseCsv(text:string){const lines=text.split(/\r?\n/).filter(l=>l.trim().length);if(!lines.length)return{headers:[] as string[],rows:[] as string[][]};const headers=parseCsvLine(lines[0]).map(x=>x.trim());return{headers,rows:lines.slice(1).map(parseCsvLine)};}

function CsvDiagnostics({mode}:{mode:string}){
  const[text,setText]=useState("lat,lng,name\n40.7128,-74.0060,New York\n51.5074,-0.1278,London\n40.7128,-74.0060,New York duplicate");
  const parsed=useMemo(()=>parseCsv(text),[text]);
  const latI=parsed.headers.findIndex(h=>/^lat(itude)?$/i.test(h));
  const lngI=parsed.headers.findIndex(h=>/^(lng|lon|longitude)$/i.test(h));
  const diagnostics=useMemo(()=>{
    const validRows:{row:string[];lat:number;lng:number;key:string}[]=[];const invalid:number[]=[];
    parsed.rows.forEach((row,i)=>{if(latI<0||lngI<0){invalid.push(i);return;}const lat=Number(row[latI]),lng=Number(row[lngI]);if(Number.isFinite(lat)&&Number.isFinite(lng)&&lat>=-90&&lat<=90&&lng>=-180&&lng<=180)validRows.push({row,lat,lng,key:`${lat.toFixed(7)},${lng.toFixed(7)}`});else invalid.push(i);});
    const seen=new Set<string>(),uniqueRows=validRows.filter(x=>{if(seen.has(x.key))return false;seen.add(x.key);return true;});
    const lats=validRows.map(x=>x.lat),lngs=validRows.map(x=>x.lng);
    const centre=validRows.length?{lat:lats.reduce((a,b)=>a+b,0)/validRows.length,lng:lngs.reduce((a,b)=>a+b,0)/validRows.length}:null;
    const bbox=validRows.length?[Math.min(...lats),Math.min(...lngs),Math.max(...lats),Math.max(...lngs)]:null;
    return{validRows,invalid,uniqueRows,duplicateCount:validRows.length-uniqueRows.length,centre,bbox};
  },[parsed,latI,lngI]);
  const needsCoords=["csv-coordinate-validator","csv-coordinate-deduper","csv-coordinate-bbox","csv-coordinate-centroid"].includes(mode);
  const summary=[`Rows: ${parsed.rows.length}`,`Columns: ${parsed.headers.length}`,`Valid coordinates: ${diagnostics.validRows.length}`,`Invalid coordinates: ${diagnostics.invalid.length}`,`Unique coordinates: ${diagnostics.uniqueRows.length}`,`Duplicates: ${diagnostics.duplicateCount}`,diagnostics.bbox?`Bounds S,W,N,E: ${diagnostics.bbox.map(v=>fmt(v)).join(", ")}`:"",diagnostics.centre?`Mean centre: ${fmt(diagnostics.centre.lat)}, ${fmt(diagnostics.centre.lng)}`:""].filter(Boolean).join("\n");
  const loadFile=async(file?:File)=>{if(file)setText(await file.text());};
  const downloadClean=()=>{if(latI<0||lngI<0)return;const rows=(mode==="csv-coordinate-deduper"?diagnostics.uniqueRows:diagnostics.validRows).map(x=>x.row);downloadText(mode==="csv-coordinate-deduper"?"mapbench-deduped.csv":"mapbench-valid-coordinates.csv",toCsv(parsed.headers,rows),"text/csv");};
  return <div className="space-y-4">
    <div className="card grid gap-3 p-4 lg:grid-cols-[1fr_auto] lg:items-end"><Field label="CSV file"><input className="input" type="file" accept=".csv,text/csv" onChange={e=>loadFile(e.target.files?.[0])}/></Field><button type="button" className="btn btn-ghost" onClick={()=>setText("lat,lng,name\n40.7128,-74.0060,New York\n51.5074,-0.1278,London")}>Load sample</button></div>
    <Field label="CSV data"><textarea className="textarea min-h-56 font-mono text-xs" value={text} onChange={e=>setText(e.target.value)}/></Field>
    {needsCoords&&(latI<0||lngI<0)&&<ErrorBox>Add latitude/lat and longitude/lng/lon columns in the header.</ErrorBox>}
    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4"><Stat label="Data rows" value={String(parsed.rows.length)}/><Stat label="Columns" value={String(parsed.headers.length)}/><Stat label="Valid coordinates" value={String(diagnostics.validRows.length)}/><Stat label="Invalid coordinate rows" value={String(diagnostics.invalid.length)}/>{diagnostics.bbox&&<Stat label="Bounds S, W, N, E" value={diagnostics.bbox.map(v=>fmt(v)).join(", ")}/>} {diagnostics.centre&&<Stat label="Mean centre" value={`${fmt(diagnostics.centre.lat)}, ${fmt(diagnostics.centre.lng)}`}/>}<Stat label="Unique coordinate pairs" value={String(diagnostics.uniqueRows.length)}/><Stat label="Duplicate rows" value={String(diagnostics.duplicateCount)}/></div>
    <div className="flex flex-wrap gap-2"><CopyBtn text={summary} label="Copy diagnostics"/>{latI>=0&&lngI>=0&&<button type="button" className="btn btn-primary btn-sm" onClick={downloadClean}>{mode==="csv-coordinate-deduper"?"Download deduped CSV":"Download valid rows"}</button>}<button type="button" className="btn btn-ghost btn-sm" onClick={()=>downloadText("mapbench-csv-copy.csv",text,"text/csv")}>Download current CSV</button></div>
    <p className="text-xs text-mute">CSV parsing supports quoted fields and escaped double quotes. Coordinate diagnostics validate latitude −90..90 and longitude −180..180.</p>
  </div>;
}

function KmlDiagnostics({mode}:{mode:string}){
  const[text,setText]=useState('<?xml version="1.0"?><kml xmlns="http://www.opengis.net/kml/2.2"><Document><Placemark><name>Example</name><Point><coordinates>-74.006,40.7128,0</coordinates></Point></Placemark></Document></kml>');
  const[mounted,setMounted]=useState(false);useEffect(()=>setMounted(true),[]);
  const parsed=useMemo(()=>{if(!mounted)return null;const doc=new DOMParser().parseFromString(text,"application/xml");if(doc.querySelector("parsererror"))return{ok:false as const};const placemarks=[...doc.querySelectorAll("Placemark")];const names=placemarks.map(p=>p.querySelector("name")?.textContent?.trim()||"").filter(Boolean);const counts={Point:doc.querySelectorAll("Point").length,LineString:doc.querySelectorAll("LineString").length,Polygon:doc.querySelectorAll("Polygon").length,MultiGeometry:doc.querySelectorAll("MultiGeometry").length};const coordinateBlocks=[...doc.querySelectorAll("coordinates")];let coordinateTuples=0;coordinateBlocks.forEach(el=>{coordinateTuples+=(el.textContent||"").trim().split(/\s+/).filter(Boolean).length;});return{ok:true as const,placemarks:placemarks.length,coordinateBlocks:coordinateBlocks.length,coordinateTuples,named:names.length,names,counts};},[mounted,text]);
  const loadFile=async(file?:File)=>{if(file)setText(await file.text());};
  if(!mounted)return <div className="text-sm text-mute">KML diagnostics run locally in your browser.</div>;
  const summary=parsed?.ok?[`Placemarks: ${parsed.placemarks}`,`Named placemarks: ${parsed.named}`,`Coordinate blocks: ${parsed.coordinateBlocks}`,`Coordinate tuples: ${parsed.coordinateTuples}`,`Points: ${parsed.counts.Point}`,`LineStrings: ${parsed.counts.LineString}`,`Polygons: ${parsed.counts.Polygon}`,`MultiGeometry: ${parsed.counts.MultiGeometry}`,parsed.names.length?`Names: ${parsed.names.slice(0,20).join(", ")}`:""] .filter(Boolean).join("\n"):"Invalid XML/KML";
  return <div className="space-y-4"><div className="card grid gap-3 p-4 lg:grid-cols-[1fr_auto] lg:items-end"><Field label="KML file"><input className="input" type="file" accept=".kml,application/vnd.google-earth.kml+xml,application/xml,text/xml" onChange={e=>loadFile(e.target.files?.[0])}/></Field><button type="button" className="btn btn-ghost" onClick={()=>setText('<?xml version="1.0"?><kml xmlns="http://www.opengis.net/kml/2.2"><Document><Placemark><name>Example</name><Point><coordinates>-74.006,40.7128,0</coordinates></Point></Placemark></Document></kml>')}>Load sample</button></div><Field label="KML / XML"><textarea className="textarea min-h-56 font-mono text-xs" value={text} onChange={e=>setText(e.target.value)}/></Field>{!parsed?.ok?<ErrorBox>Invalid XML/KML. Fix the XML syntax and try again.</ErrorBox>:<><div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4"><Stat label="Placemarks" value={String(parsed.placemarks)}/><Stat label="Named placemarks" value={String(parsed.named)}/><Stat label="Coordinate blocks" value={String(parsed.coordinateBlocks)}/><Stat label="Coordinate tuples" value={String(parsed.coordinateTuples)}/><Stat label="Points" value={String(parsed.counts.Point)}/><Stat label="LineStrings" value={String(parsed.counts.LineString)}/><Stat label="Polygons" value={String(parsed.counts.Polygon)}/><Stat label="MultiGeometry" value={String(parsed.counts.MultiGeometry)}/></div>{parsed.names.length>0&&<div className="card p-4"><div className="label">Placemark names</div><div className="mt-2 flex flex-wrap gap-2">{parsed.names.slice(0,30).map((name,i)=><span className="chip" key={`${name}-${i}`}>{name}</span>)}</div></div>}<div className="flex flex-wrap gap-2"><CopyBtn text={summary} label="Copy diagnostics"/><button type="button" className="btn btn-primary btn-sm" onClick={()=>downloadText("mapbench-inspected.kml",text,"application/vnd.google-earth.kml+xml")}>Download KML</button></div></>}</div>;
}

export default function LongtailTools8({params}:{params?:Record<string,unknown>}){const mode=String(params?.mode||"");if(mode.startsWith("csv-"))return <CsvDiagnostics mode={mode}/>;if(mode.startsWith("kml-"))return <KmlDiagnostics mode={mode}/>;return <ErrorBox>This diagnostic mode is not configured.</ErrorBox>;}
