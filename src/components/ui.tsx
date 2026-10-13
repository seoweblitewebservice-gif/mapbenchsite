"use client";
import { useEffect, useRef, useState, type ReactNode } from "react";

export function Spinner({ label = "Working…" }: { label?: string }) {
  return <span className="inline-flex items-center gap-2 text-sm text-mute" role="status"><svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity=".25"/><path d="M22 12a10 10 0 0 0-10-10" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/></svg>{label}</span>;
}

export function ErrorBox({ children }: { children: ReactNode }) {
  return <div role="alert" className="rounded-xl border border-ember/30 bg-[var(--sf-warn-bg)] px-4 py-3 text-sm leading-relaxed shadow-sm">{children}</div>;
}

export function Stat({ label, value, sub }: { label: string; value: ReactNode; sub?: ReactNode }) {
  return (
    <div className="group relative overflow-hidden rounded-xl border border-line bg-gradient-to-br from-white to-well/60 px-4 py-4 shadow-[0_5px_18px_rgba(15,23,42,0.04)] transition-all hover:-translate-y-0.5 hover:border-brand/35 hover:shadow-[0_10px_28px_rgba(15,23,42,0.08)]">
      <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-transparent via-brand/45 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
      <div className="text-[10px] font-extrabold uppercase tracking-[0.13em] text-mute">{label}</div>
      <div className="mt-1 font-display text-xl font-bold leading-tight break-words text-ink">{value}</div>
      {sub ? <div className="mt-1.5 text-xs leading-relaxed text-mute">{sub}</div> : null}
    </div>
  );
}

export function CopyBtn({ text, label = "Copy", small = true }: { text: string; label?: string; small?: boolean }) {
  const [done, setDone] = useState(false);
  return <button type="button" className={`btn btn-ghost ${small ? "btn-sm" : ""}`} onClick={async()=>{try{await navigator.clipboard.writeText(text);}catch{const ta=document.createElement("textarea");ta.value=text;document.body.appendChild(ta);ta.select();document.execCommand("copy");ta.remove();}setDone(true);setTimeout(()=>setDone(false),1400);}} aria-label={label}>{done?<svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden><path d="M20 6 9 17l-5-5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>:<svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden><rect x="9" y="9" width="12" height="12" rx="2" stroke="currentColor" strokeWidth="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>}{done?"Copied":label}</button>;
}

export function Seg<T extends string>({ options, value, onChange, ariaLabel }: { options:{value:T;label:string}[];value:T;onChange:(v:T)=>void;ariaLabel?:string; }) {
  return <div role="tablist" aria-label={ariaLabel} className="inline-flex flex-wrap gap-1 rounded-xl border border-line bg-well/70 p-1.5 shadow-inner">{options.map((o)=><button key={o.value} role="tab" type="button" aria-selected={value===o.value} className={`rounded-lg px-3.5 py-2 text-sm font-semibold transition-all ${value===o.value?"bg-white text-brand-strong shadow-sm ring-1 ring-brand/15":"text-mute hover:bg-white/70 hover:text-ink"}`} onClick={()=>onChange(o.value)}>{o.label}</button>)}</div>;
}

export function Field({ label, children, hint }: { label:string;children:ReactNode;hint?:string }) {
  return <label className="block"><span className="mb-1.5 block text-[11px] font-extrabold uppercase tracking-[0.1em] text-mute">{label}</span>{children}{hint?<span className="mt-1.5 block text-xs leading-relaxed text-mute">{hint}</span>:null}</label>;
}

export function useDebounced<T>(value:T,ms=350):T{const[v,setV]=useState(value);useEffect(()=>{const t=setTimeout(()=>setV(value),ms);return()=>clearTimeout(t);},[value,ms]);return v;}
export function syncUrl(params:Record<string,string|number|boolean|undefined|null>){if(typeof window==="undefined")return;const url=new URL(window.location.href);for(const[k,v]of Object.entries(params)){if(v===undefined||v===null||v==="")url.searchParams.delete(k);else url.searchParams.set(k,String(v));}window.history.replaceState(null,"",url.toString());}
export function readUrlParams():URLSearchParams{return typeof window==="undefined"?new URLSearchParams():new URLSearchParams(window.location.search);}
export function fmtDateTime(d:Date){return d.toLocaleString("en-US",{hour:"2-digit",minute:"2-digit",timeZone:"UTC"})+" UTC";}

export function FileDropzone({ onFile, accept, children, maxSizeMb=25 }: { onFile:(f:File)=>void;accept:string;children:ReactNode;maxSizeMb?:number }) {
  const[over,setOver]=useState(false);const[err,setErr]=useState<string|null>(null);const inputRef=useRef<HTMLInputElement>(null);
  const handle=(f:File|undefined|null)=>{setErr(null);if(!f)return;if(f.size>maxSizeMb*1024*1024){setErr(`That file is larger than ${maxSizeMb} MB. Please use a smaller file.`);return;}onFile(f);};
  return <div><div role="button" tabIndex={0} aria-label="Upload file" className={`group flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed px-6 py-12 text-center transition-all ${over?"border-brand bg-brand-soft shadow-inner":"border-line bg-gradient-to-b from-white to-well/55 hover:border-brand/60 hover:shadow-md"}`} onDragOver={(e)=>{e.preventDefault();setOver(true);}} onDragLeave={()=>setOver(false)} onDrop={(e)=>{e.preventDefault();setOver(false);handle(e.dataTransfer.files?.[0]);}} onClick={()=>inputRef.current?.click()} onKeyDown={(e)=>{if(e.key==="Enter"||e.key===" ")inputRef.current?.click();}}><div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-soft text-brand-strong transition-transform group-hover:-translate-y-1"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden><path d="M12 16V4m0 0 4 4m-4-4L8 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M4 15v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg></div><div><div className="text-sm font-bold text-ink">Drop your file here</div><div className="mt-1 text-xs text-mute">or click to browse · browser-first processing</div></div><input ref={inputRef} type="file" accept={accept} className="sr-only" onChange={(e)=>{handle(e.target.files?.[0]);e.target.value="";}}/></div>{children}{err?<div className="mt-2"><ErrorBox>{err}</ErrorBox></div>:null}</div>;
}
