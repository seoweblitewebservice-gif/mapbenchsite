"use client";
import { useEffect, useRef, useState } from "react";
import { describeFloodResponse } from "@/lib/floodResponse";
import { distanceKm, fmt, fmtCoords, type LatLng } from "@/lib/geo";
import { nominatimReverse, addressBreakdown, geolocation } from "@/lib/geocode";
import { STATE_AREA_CODES } from "@/data/compare";
import { readUrlParams, syncUrl, ErrorBox, Spinner, Stat } from "@/components/ui";
import { PlaceField, type PlaceValue } from "./shared";

function usePointFromUrl(): [PlaceValue | null, (v: PlaceValue | null) => void] {
  const [v, setV] = useState<PlaceValue | null>(() => {
    const p = readUrlParams();
    const lat = parseFloat(p.get("lat") ?? ""), lng = parseFloat(p.get("lng") ?? "");
    return Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : null;
  });
  useEffect(() => { syncUrl({ lat: v?.lat.toFixed(5) ?? null, lng: v?.lng.toFixed(5) ?? null }); }, [v]);
  return [v, setV];
}

function GpsBtn({ onPoint }: { onPoint: (p: LatLng) => void }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  return (
    <>
      <button
        type="button" className="btn btn-ghost btn-sm" disabled={busy}
        onClick={async () => {
          setBusy(true); setErr(null);
          try { onPoint(await geolocation()); } catch (e: any) { setErr(e?.message ?? "Geolocation failed."); }
          setBusy(false);
        }}
      >{busy ? <Spinner label="Locating…" /> : "📍 Use my location"}</button>
      {err && <span className="text-xs text-ember">{err}</span>}
    </>
  );
}

// ---------- Area code ----------
export function AreaCodeTool() {
  const [point, setPoint] = usePointFromUrl();
  const [state, setState] = useState<{ state: string; codes: string[] } | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const resolve = async (p: LatLng) => {
    setPoint(p); setBusy(true); setErr(null); setState(null);
    const r = await nominatimReverse(p.lat, p.lng, 10);
    setBusy(false);
    if (!r.ok) { setErr(r.message); return; }
    const st = addressBreakdown(r.result.address).state;
    const codes = STATE_AREA_CODES[st];
    if (!codes) setErr(st ? `No area-code snapshot for "${st}" yet — this reference currently covers US states.` : "This point is outside the United States; NANPA area codes don't apply.");
    else setState({ state: st, codes });
  };

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div className="card space-y-3 p-4">
        <PlaceField label="Location" value={point} onChange={(v) => v && resolve(v)} placeholder="US address, city or ZIP…" />
        <GpsBtn onPoint={resolve} />
        {busy && <Spinner label="Resolving state…" />}
        {err && <ErrorBox>{err}</ErrorBox>}
      </div>
      {state && (
        <div className="card p-4">
          <div className="label">Area codes in {state.state}</div>
          <div className="mt-2 flex flex-wrap gap-2">
            {state.codes.map((c) => <span key={c} className="chip chip-brand font-mono !text-sm">{c}</span>)}
          </div>
          <p className="mt-3 text-xs text-mute">Reference snapshot of NANPA assignments; overlays and splits change periodically — confirm with your carrier for porting decisions.</p>
        </div>
      )}
    </div>
  );
}

// ---------- Congressional / School district (US Census geocoder) ----------
export function CensusTool({ params }: { params?: Record<string, unknown> }) {
  const mode = params?.mode === "school" ? "school" : "cd";
  const [point, setPoint] = usePointFromUrl();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [out, setOut] = useState<string[]>([]);

  const resolve = async (p: LatLng) => {
    setPoint(p); setBusy(true); setErr(null); setOut([]);
    try {
      const url = `https://geocoding.geo.census.gov/geocoder/geographies/coordinates?x=${p.lng}&y=${p.lat}&benchmark=Public_AR_Current&vintage=Current_Current&format=json`;
      const res = await fetch(url);
      if (!res.ok) throw new Error();
      const data = await res.json();
      const geos: Record<string, any[]> = data?.result?.geographies ?? {};
      const keys = mode === "cd"
        ? ["Congressional Districts"]
        : ["Unified School Districts", "Elementary School Districts", "Secondary School Districts"];
      const names: string[] = [];
      for (const k of keys) for (const g of geos[k] ?? []) names.push(`${g.BASENAME ?? g.NAME ?? "Unknown"}${k !== "Congressional Districts" ? " (" + k.replace(" School Districts", "").toLowerCase() + ")" : ""}`);
      if (!names.length) throw new Error("empty");
      setOut(names);
    } catch {
      setErr(mode === "cd"
        ? "The US Census geocoder didn't return a district for this point — it must be inside the 50 states or DC. Try a nearby street address."
        : "No school-district boundary was returned for this point. Coverage varies; try a nearby address.");
    }
    setBusy(false);
  };

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div className="card space-y-3 p-4">
        <PlaceField label="US location" value={point} onChange={(v) => v && resolve(v)} placeholder="US address or coordinates…" />
        <GpsBtn onPoint={resolve} />
        {busy && <Spinner label="Querying US Census geocoder…" />}
        {err && <ErrorBox>{err}</ErrorBox>}
        <p className="text-xs text-mute">Source: US Census Bureau geocoder (TIGER boundaries) — United States only, free public service.</p>
      </div>
      {out.length > 0 && (
        <div className="card p-4">
          <div className="label">{mode === "cd" ? "Congressional district" : "School district"}</div>
          {out.map((n) => <div key={n} className="mt-1 font-display text-lg font-bold text-brand-strong">{n}</div>)}
        </div>
      )}
    </div>
  );
}

// ---------- Watershed (US) ----------
export function WatershedTool() {
  const [point, setPoint] = usePointFromUrl();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [out, setOut] = useState<Record<string, string> | null>(null);

  const resolve = async (p: LatLng) => {
    setPoint(p); setBusy(true); setErr(null); setOut(null);
    try {
      const url = `https://hydro.nationalmap.gov/arcgis/rest/services/wbd/MapServer/7/query?where=1%3D1&geometry=${p.lng}%2C${p.lat}&geometryType=esriGeometryPoint&inSR=4326&spatialRel=esriSpatialRelIntersects&outFields=*&returnGeometry=false&f=json`;
      const res = await fetch(url);
      if (!res.ok) throw new Error();
      const data = await res.json();
      const attrs = data?.features?.[0]?.attributes;
      if (!attrs) throw new Error("none");
      const pick: Record<string, string> = {};
      for (const [k, v] of Object.entries(attrs)) {
        if (/name|huc/i.test(k) && typeof v === "string" && v) pick[k.replace(/_/g, " ")] = v;
        if (Object.keys(pick).length >= 6) break;
      }
      if (!Object.keys(pick).length) throw new Error("none");
      setOut(pick);
    } catch {
      setErr("No watershed boundary returned — the USGS WBD service covers the United States; outside it (or during outages) this lookup can't answer.");
    }
    setBusy(false);
  };

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div className="card space-y-3 p-4">
        <PlaceField label="US location" value={point} onChange={(v) => v && resolve(v)} />
        <GpsBtn onPoint={resolve} />
        {busy && <Spinner label="Querying USGS Watershed Boundary Dataset…" />}
        {err && <ErrorBox>{err}</ErrorBox>}
        <p className="text-xs text-mute">Source: USGS / NRCS Watershed Boundary Dataset via The National Map (US only).</p>
      </div>
      {out && (
        <div className="card p-4">
          <div className="label">Watershed (hydrologic unit)</div>
          <table className="tbl mt-2"><tbody>{Object.entries(out).map(([k, v]) => <tr key={k}><td className="text-mute">{k}</td><td className="font-semibold">{v}</td></tr>)}</tbody></table>
        </div>
      )}
    </div>
  );
}

// ---------- Flood zone (US FEMA) ----------
export function FloodTool() {
  const [point, setPoint] = usePointFromUrl();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [out, setOut] = useState<string | null>(null);
  const requestId = useRef(0);

  const resolve = async (p: LatLng) => {
    const id = ++requestId.current;
    setPoint(p); setBusy(true); setErr(null); setOut(null);
    try {
      const url = `https://hazards.fema.gov/gis/nfhl/rest/services/public/NFHL/MapServer/28/query?where=1%3D1&geometry=${p.lng}%2C${p.lat}&geometryType=esriGeometryPoint&inSR=4326&spatialRel=esriSpatialRelIntersects&outFields=FLD_ZONE%2CZONE_SUBTY&returnGeometry=false&f=json`;
      const res = await fetch(url);
      if (!res.ok) throw new Error();
      const data = await res.json();
      if (id !== requestId.current) return;
      setOut(describeFloodResponse(data));
    } catch {
      if (id !== requestId.current) return;
      setErr("FEMA's NFHL service didn't answer for this point — it covers US communities with mapped floodplains. For authoritative checks use the FEMA Flood Map Service Center.");
    }
    setBusy(false);
  };

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div className="card space-y-3 p-4">
        <PlaceField label="US location" value={point} onChange={(v) => v && resolve(v)} />
        <GpsBtn onPoint={resolve} />
        {busy && <Spinner label="Checking FEMA flood data…" />}
        {err && <ErrorBox>{err}</ErrorBox>}
        <p className="text-xs text-mute">Source: FEMA National Flood Hazard Layer (US). This is an orientation tool, not an insurance determination.</p>
      </div>
      {out && <div className="card p-4"><div className="label">Flood zone</div><div className="mt-1 font-display text-lg font-bold text-brand-strong">{out}</div></div>}
    </div>
  );
}

// ---------- Earthquakes / fault activity ----------
export function QuakeTool() {
  const [point, setPoint] = usePointFromUrl();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [quakes, setQuakes] = useState<{ mag: number; place: string; distKm: number; when: string }[]>([]);

  const resolve = async (p: LatLng) => {
    setPoint(p); setBusy(true); setErr(null); setQuakes([]);
    try {
      const start = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);
      const url = `https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&latitude=${p.lat}&longitude=${p.lng}&maxradiuskm=300&minmagnitude=2.5&starttime=${start}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setQuakes((data.features ?? []).map((f: any) => ({
        mag: f.properties.mag,
        place: f.properties.place,
        distKm: distanceKm(p, { lat: f.geometry.coordinates[1], lng: f.geometry.coordinates[0] }),
        when: new Date(f.properties.time).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      })).sort((a: any, b: any) => a.distKm - b.distKm));
    } catch {
      setErr("The USGS earthquake service is unreachable right now — please try again shortly.");
    }
    setBusy(false);
  };

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div className="card space-y-3 p-4">
        <PlaceField label="Anywhere on Earth" value={point} onChange={(v) => v && resolve(v)} />
        <GpsBtn onPoint={resolve} />
        {busy && <Spinner label="Querying USGS catalog…" />}
        {err && <ErrorBox>{err}</ErrorBox>}
        <p className="text-xs text-mute">Recent seismicity (M2.5+, 30 days, 300 km) is a practical proxy for fault activity; US Quaternary fault traces live in the USGS Qfaults database.</p>
      </div>
      {quakes.length > 0 && (
        <div className="card p-4">
          <div className="label">{quakes.length} recent quake{quakes.length > 1 ? "s" : ""} nearby</div>
          <table className="tbl mt-2">
            <thead><tr><th>Mag</th><th>Place</th><th className="text-right">Distance</th><th className="text-right">Date</th></tr></thead>
            <tbody>{quakes.slice(0, 15).map((q, i) => <tr key={i}><td className="font-bold text-ember">{q.mag.toFixed(1)}</td><td>{q.place}</td><td className="text-right">{fmt(q.distKm, 0)} km</td><td className="text-right">{q.when}</td></tr>)}</tbody>
          </table>
        </div>
      )}
      {quakes.length === 0 && point && !busy && !err && <div className="card p-4 text-sm text-mute">No M2.5+ earthquakes within 300 km in the last 30 days — a quiet stretch of crust.</div>}
    </div>
  );
}

// ---------- Indigenous territory ----------
export function IndigenousTool() {
  const [point, setPoint] = usePointFromUrl();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [out, setOut] = useState<{ name: string; link?: string }[]>([]);

  const resolve = async (p: LatLng) => {
    setPoint(p); setBusy(true); setErr(null); setOut([]);
    try {
      const res = await fetch(`https://native-land.ca/api/index.php?maps=territories&position=${p.lat},${p.lng}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      const list = (Array.isArray(data) ? data : data?.features ?? []).map((f: any) => ({ name: f.properties?.Name ?? f.properties?.name ?? "Unnamed territory", link: f.properties?.link ?? f.properties?.Link })).filter((x: any) => x.name);
      if (!list.length) throw new Error("none");
      setOut(list);
    } catch {
      setErr("Native Land Digital Map didn't return a territory for this point (ocean, or service unavailable). Data © Native-Land.ca.");
    }
    setBusy(false);
  };

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div className="card space-y-3 p-4">
        <PlaceField label="Location" value={point} onChange={(v) => v && resolve(v)} />
        <GpsBtn onPoint={resolve} />
        {busy && <Spinner label="Consulting Native Land Digital Map…" />}
        {err && <ErrorBox>{err}</ErrorBox>}
        <p className="text-xs text-mute">Boundaries from Native-Land.ca — a respectful starting point for learning, not a legal determination of territory.</p>
      </div>
      {out.length > 0 && (
        <div className="card p-4">
          <div className="label">Traditional / indigenous territories</div>
          <ul className="mt-2 space-y-1">
            {out.map((t) => <li key={t.name} className="font-display text-lg font-bold text-brand-strong">{t.name}</li>)}
          </ul>
        </div>
      )}
    </div>
  );
}
