"use client";
import { useMemo, useState } from "react";
import { fmtCoords, isValidLat, isValidLng, parseCoordPair } from "@/lib/geo";
import { decodePlusCode, encodePlusCode } from "@/lib/coords";
import { photonSearch, nominatimReverse, addressBreakdown } from "@/lib/geocode";
import { Field, Stat, ErrorBox, Spinner, CopyBtn, Seg } from "@/components/ui";
import LocationSearch from "@/components/LocationSearch";

// ---------- Unit converters (nautical / area) ----------
const NAUTICAL: [string, number][] = [ // per km
  ["Nautical miles", 0.5399568035], ["Kilometres", 1], ["Statute miles", 0.6213711922],
  ["Metres", 1000], ["Feet", 3280.8399], ["Cable lengths", 5.399568],
];
const AREA: [string, number][] = [ // per km²
  ["Square kilometres", 1], ["Square miles", 0.386102159], ["Hectares", 100], ["Acres", 247.105381],
  ["Square metres", 1e6], ["Square feet", 10763910.4],
];

export function UnitConverterTool({ params }: { params?: Record<string, unknown> }) {
  const kind = params?.kind === "area" ? "area" : "nautical";
  const units = kind === "area" ? AREA : NAUTICAL;
  const [value, setValue] = useState(kind === "area" ? 1 : 10);
  const [from, setFrom] = useState(0);
  const km = kind === "area" ? value / units[from][1] : value / units[from][1];
  const base = kind === "area" ? "km²" : "km";
  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div className="card grid grid-cols-2 gap-3 p-4">
        <Field label="Value">
          <input type="number" step="any" className="input" value={value} onChange={(e) => setValue(parseFloat(e.target.value) || 0)} />
        </Field>
        <Field label="From unit">
          <select className="select" value={from} onChange={(e) => setFrom(parseInt(e.target.value))}>
            {units.map(([n], i) => <option key={n} value={i}>{n}</option>)}
          </select>
        </Field>
      </div>
      <div className="card p-4">
        <div className="label">All conversions</div>
        <table className="tbl mt-2">
          <tbody>
            {units.map(([n, f], i) => (
              <tr key={n}>
                <td className="text-mute">{n}</td>
                <td className="text-right font-mono font-semibold">{(km * f).toLocaleString("en-US", { maximumFractionDigits: Math.abs(km * f) < 1 ? 6 : 2 })}</td>
                <td className="w-10">{i !== from && <CopyBtn text={String(km * f)} label="" />}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="mt-2 text-xs text-mute">
          {kind === "nautical"
            ? "1 nautical mile = 1,852 m exactly (one minute of latitude); 1 cable = 0.1 nmi."
            : "1 hectare = 10,000 m²; 1 acre = 4,046.86 m²; conversions are exact by definition."}
        </p>
      </div>
    </div>
  );
}

// ---------- What3Words ----------
export function W3wTool() {
  const [words, setWords] = useState("");
  const [key, setKey] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [result, setResult] = useState<{ lat: number; lng: number } | null>(null);
  const [ll, setLl] = useState("");

  const lookup = async () => {
    setErr(null);
    const w = words.trim().replace(/^\/+\//, "").replace(/^\/\/\//, "");
    if (!/^[a-z-]+\.[a-z-]+\.[a-z-]+$/i.test(w)) { setErr("A what3words address looks like three dotted words, e.g. filled.count.soap."); return; }
    if (!key.trim()) { setErr("Add your own what3words API key (stored only in this browser tab) to query the official service — or use the free Plus Code alternative below."); return; }
    setBusy(true);
    try {
      const res = await fetch(`https://api.what3words.com/v3/convert-to-coordinates?words=${encodeURIComponent(w)}&key=${encodeURIComponent(key.trim())}`);
      const data = await res.json();
      if (!res.ok || !data.coordinates) { setErr(data?.error?.message ?? "The what3words service rejected this request. Check the key and the words."); }
      else setResult({ lat: data.coordinates.lat, lng: data.coordinates.lng });
    } catch { setErr("Could not reach the what3words service from this browser."); }
    setBusy(false);
  };

  const plus = useMemo(() => {
    const p = parseCoordPair(ll);
    return p && isValidLat(p.lat) && isValidLng(p.lng) ? encodePlusCode(p.lat, p.lng) : null;
  }, [ll]);
  const decoded = useMemo(() => decodePlusCode(ll), [ll]);

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="card space-y-3 p-4">
        <Field label="what3words address">
          <input className="input" placeholder="filled.count.soap" value={words} onChange={(e) => setWords(e.target.value)} />
        </Field>
        <Field label="Your what3words API key (optional, stays local)">
          <input className="input" type="password" placeholder="Paste key to enable official lookup" value={key} onChange={(e) => setKey(e.target.value)} />
        </Field>
        <button type="button" className="btn btn-primary w-full" onClick={lookup} disabled={busy}>{busy ? <Spinner /> : "Convert to coordinates"}</button>
        {err && <ErrorBox>{err}</ErrorBox>}
        {result && (
          <div className="space-y-2">
            <Stat label="Coordinates" value={fmtCoords(result)} />
            <CopyBtn text={fmtCoords(result)} label="Copy coordinates" />
          </div>
        )}
        <p className="text-xs text-mute">what3words is a proprietary system requiring a licensed API. MapBench never bundles a key; your own key is used only from this tab.</p>
      </div>
      <div className="card space-y-3 p-4">
        <div className="font-display text-base font-bold">Free open alternative: Plus Codes</div>
        <Field label="Paste coordinates or a Plus Code">
          <input className="input" placeholder="40.7128, -74.0060  or  87G8Q37H+XQ" value={ll} onChange={(e) => setLl(e.target.value)} />
        </Field>
        {plus && <Stat label="Plus Code for these coordinates" value={plus} sub="open standard, no key needed" />}
        {decoded && <Stat label="Decoded coordinates" value={fmtCoords(decoded)} />}
        <p className="text-xs text-mute">Plus Codes (Open Location Codes) give any spot a short shareable code, computed purely by math — no database, no licence.</p>
      </div>
    </div>
  );
}

// ---------- Address validator ----------
export function AddressValidatorTool() {
  const [addr, setAddr] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [out, setOut] = useState<{ standard: Record<string, string>; display: string; coords: { lat: number; lng: number }; matched: string } | null>(null);

  const validate = async () => {
    if (addr.trim().length < 5) { setErr("Type a fuller address — at least street and city."); return; }
    setBusy(true); setErr(null); setOut(null);
    const s = await photonSearch(addr.trim(), 1);
    if (!s.ok || !s.results.length) { setErr("No matching address found. Try adding the city or country, or simplify the street part."); setBusy(false); return; }
    const hit = s.results[0];
    const r = await nominatimReverse(hit.lat, hit.lng, 18);
    setBusy(false);
    if (!r.ok) { setErr(r.message); return; }
    const std = addressBreakdown(r.result.address);
    setOut({ standard: { Road: [std.houseNumber, std.road].filter(Boolean).join(" "), City: std.city, County: std.county, State: std.state, Postcode: std.postcode, Country: std.country }, display: r.result.displayName, coords: { lat: hit.lat, lng: hit.lng }, matched: hit.label });
  };

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div className="card space-y-3 p-4">
        <Field label="Address to validate / standardize">
          <input className="input" placeholder="1600 Pennsylvania Avenue NW, Washington, DC" value={addr} onChange={(e) => setAddr(e.target.value)} onKeyDown={(e) => e.key === "Enter" && validate()} />
        </Field>
        <button type="button" className="btn btn-primary w-full" onClick={validate} disabled={busy}>{busy ? <Spinner label="Checking against OpenStreetMap…" /> : "Validate & standardize"}</button>
        {err && <ErrorBox>{err}</ErrorBox>}
      </div>
      {out && (
        <div className="card p-4">
          <div className="label">Standardized form (OSM canonical)</div>
          <table className="tbl mt-2">
            <tbody>
              {Object.entries(out.standard).filter(([, v]) => v).map(([k, v]) => (
                <tr key={k}><td className="w-28 text-mute">{k}</td><td className="font-medium">{v}</td></tr>
              ))}
              <tr><td className="text-mute">Coordinates</td><td className="font-mono">{fmtCoords(out.coords)}</td></tr>
            </tbody>
          </table>
          <p className="mt-2 text-xs text-mute">Matched reference: {out.display}</p>
          <ul className="mt-2 space-y-1 text-xs">
            {(["City", "Postcode"] as const).map((k) => {
              const stdVal = (out.standard as any)[k]?.toLowerCase() ?? "";
              const ok = stdVal && addr.toLowerCase().includes(stdVal.split(" ")[0]);
              return <li key={k} className={ok ? "text-brand-strong" : "text-ember"}>{ok ? "✓" : "✗"} {k} {ok ? "matches your input" : "differs from your input (or missing)"}</li>;
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
