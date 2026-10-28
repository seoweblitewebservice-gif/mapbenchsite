"use client";
import { annualMinimumMean, hardinessZone } from "@/lib/hardiness";
import { useEffect, useMemo, useState } from "react";
import { fmt } from "@/lib/geo";
import { readUrlParams, syncUrl, ErrorBox, Field, Spinner, Stat } from "@/components/ui";
import { PlaceField, type PlaceValue } from "./shared";

function usePoint(): [PlaceValue | null, (v: PlaceValue | null) => void] {
  const [v, setV] = useState<PlaceValue | null>(() => {
    const p = readUrlParams();
    const lat = parseFloat(p.get("lat") ?? ""), lng = parseFloat(p.get("lng") ?? "");
    return Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : null;
  });
  useEffect(() => { syncUrl({ lat: v?.lat.toFixed(5) ?? null, lng: v?.lng.toFixed(5) ?? null }); }, [v]);
  return [v, setV];
}

// ---------- Solar panel potential ----------
export function SolarTool() {
  const [point, setPoint] = usePoint();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [psh, setPsh] = useState<number | null>(null);
  const [kw, setKw] = useState(5);
  const [rate, setRate] = useState(0.16);

  const load = async (p: { lat: number; lng: number }) => {
    setPoint(p); setBusy(true); setErr(null); setPsh(null);
    try {
      const end = new Date(); const start = new Date(end.getTime() - 365 * 86400000);
      const url = `https://archive-api.open-meteo.com/v1/archive?latitude=${p.lat}&longitude=${p.lng}&start_date=${start.toISOString().slice(0, 10)}&end_date=${end.toISOString().slice(0, 10)}&daily=shortwave_radiation_sum&timezone=UTC`;
      const res = await fetch(url);
      if (!res.ok) throw new Error();
      const data = await res.json();
      const vals = (data.daily?.shortwave_radiation_sum ?? []).filter((x: number | null) => x !== null);
      if (!vals.length) throw new Error();
      setPsh(vals.reduce((a: number, b: number) => a + b, 0) / vals.length / 1000); // MJ/m²→kWh/m²
    } catch {
      setErr("Open-Meteo's radiation archive didn't answer — try again shortly.");
    }
    setBusy(false);
  };

  const annual = psh !== null ? psh * kw * 365 * 0.8 : null;

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="card space-y-4 p-4">
        <PlaceField label="Site location" value={point} onChange={(v) => v && load(v)} />
        <div className="grid grid-cols-2 gap-3">
          <Field label="System size (kW)">
            <input type="number" step="0.5" min={0.5} className="input" value={kw} onChange={(e) => setKw(Math.max(0.5, parseFloat(e.target.value) || 0.5))} />
          </Field>
          <Field label="Electricity price (per kWh)">
            <input type="number" step="0.01" min={0} className="input" value={rate} onChange={(e) => setRate(Math.max(0, parseFloat(e.target.value) || 0))} />
          </Field>
        </div>
        {busy && <Spinner label="Averaging a year of satellite radiation…" />}
        {err && <ErrorBox>{err}</ErrorBox>}
        <p className="text-xs text-mute">Method: ERA5 reanalysis (Open-Meteo archive) daily shortwave radiation over the past 12 months, averaged to peak-sun-hours; production = PSH × kW × 365 × 0.8 performance ratio. Flat, south-facing (northern hemisphere) assumption.</p>
      </div>
      <div className="grid content-start grid-cols-2 gap-2">
        <Stat label="Peak sun hours" value={psh !== null ? fmt(psh, 2) : "—"} sub="kWh/m² per day, 12-mo average" />
        <Stat label="Est. annual production" value={annual !== null ? `${Math.round(annual).toLocaleString()} kWh` : "—"} />
        <Stat label="Est. annual value" value={annual !== null ? fmt(annual * rate, 0) : "—"} sub="at your electricity price" />
        <Stat label="Class" value={psh === null ? "—" : psh >= 5.5 ? "Excellent" : psh >= 4.5 ? "Very good" : psh >= 3.5 ? "Good" : "Modest"} />
      </div>
    </div>
  );
}

// ---------- Köppen climate zone ----------
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function koppen(t: number[], p: number[]): { code: string; label: string } {
  const Tann = t.reduce((a, b) => a + b, 0) / 12;
  const Tmin = Math.min(...t), Tmax = Math.max(...t);
  const Pann = p.reduce((a, b) => a + b, 0);
  const summerP = p.slice(3, 9).reduce((a, b) => a + b, 0);
  const winterP = Pann - summerP;
  if (Tmin >= 18) {
    if (p.every((x) => x >= 60)) return { code: "Af", label: "Tropical rainforest" };
    const driest = Math.min(...p);
    if (driptyp(p, Pann, driest)) return { code: "Am", label: "Tropical monsoon" };
    return { code: "Aw", label: "Tropical savanna" };
  }
  const threshold = 2 * (Tann + (summerP >= winterP ? 28 : winterP >= summerP ? 0 : 14)); // simplified
  if (Pann < threshold) {
    const desert = Pann < threshold / 2;
    return desert ? { code: Tann >= 18 ? "BWh" : "BWk", label: Tann >= 18 ? "Hot desert" : "Cold desert" } : { code: Tann >= 18 ? "BSh" : "BSk", label: Tann >= 18 ? "Hot steppe" : "Cold steppe" };
  }
  if (Tmax > 10 && Tmin > -3) {
    const drySummer = p[5] + p[6] + p[7] < Math.max(...p.slice(9, 12), ...p.slice(0, 3)) / 3;
    const dryWinter = Math.max(...p.slice(9, 12), ...p.slice(0, 3)) > 10 * Math.min(...p.slice(5, 8));
    if (drySummer) return { code: Tmax >= 22 ? "Csa" : "Csb", label: Tmax >= 22 ? "Mediterranean (hot summer)" : "Mediterranean (warm summer)" };
    if (dryWinter) return { code: "Cwa", label: "Dry-winter subtropical" };
    return { code: Tmax >= 22 ? "Cfa" : "Cfb", label: Tmax >= 22 ? "Humid subtropical" : "Oceanic" };
  }
  if (Tmax > 10) {
    return { code: Tmin <= -25 ? "Dfd" : "Dfb", label: "Cold continental (snow)" };
  }
  return { code: Tmax > 0 ? "ET" : "EF", label: Tmax > 0 ? "Tundra" : "Ice cap" };
}
function driptyp(p: number[], Pann: number, driest: number) { return driest >= 60 || driest >= Pann / 25; }

export function ClimateZoneTool() {
  const [point, setPoint] = usePoint();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [out, setOut] = useState<{ code: string; label: string; t: number[]; p: number[] } | null>(null);

  const load = async (pt: { lat: number; lng: number }) => {
    setPoint(pt); setBusy(true); setErr(null); setOut(null);
    try {
      const url = `https://archive-api.open-meteo.com/v1/archive?latitude=${pt.lat}&longitude=${pt.lng}&start_date=1991-01-01&end_date=2020-12-31&monthly=temperature_2m_mean,precipitation_sum&timezone=UTC`;
      const res = await fetch(url);
      if (!res.ok) throw new Error();
      const data = await res.json();
      const tm: number[] = data.monthly?.temperature_2m_mean ?? [];
      const pm: number[] = data.monthly?.precipitation_sum ?? [];
      if (tm.length !== 360 || pm.length !== 360 || !tm.every(Number.isFinite) || !pm.every(Number.isFinite)) throw new Error();
      const t: number[] = [], p: number[] = [];
      for (let m = 0; m < 12; m++) {
        let ts = 0, tc = 0, ps = 0;
        for (let y = 0; y < 30; y++) {
          const i = y * 12 + m;
          if (tm[i] != null) { ts += tm[i]; tc++; }
          if (pm[i] != null) ps += pm[i];
        }
        t.push(ts / Math.max(1, tc)); p.push(ps / 30);
      }
      setOut({ ...koppen(t, p), t, p });
    } catch {
      setErr("The climate archive is unavailable or returned incomplete data — try again shortly.");
    }
    setBusy(false);
  };

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="card space-y-4 p-4">
        <PlaceField label="Anywhere on Earth" value={point} onChange={(v) => v && load(v)} />
        {busy && <Spinner label="Averaging 1991–2020 climate normals…" />}
        {err && <ErrorBox>{err}</ErrorBox>}
        <p className="text-xs text-mute">Classification computed from 30 years of ERA5 monthly normals (temperature + precipitation) with a simplified Köppen decision tree — main groups faithful, rare subtypes merged.</p>
      </div>
      {out && (
        <div className="space-y-2">
          <div className="rounded-xl bg-brand-soft px-5 py-4">
            <div className="text-[11px] font-bold uppercase tracking-wide text-mute">Köppen climate classification</div>
            <div className="font-display text-2xl font-bold text-brand-strong">{out.code} — {out.label}</div>
          </div>
          <div className="card p-4">
            <div className="label">Monthly normals 1991–2020</div>
            <table className="tbl mt-2">
              <thead><tr><th></th>{MONTHS.map((m) => <th key={m} className="!px-1 text-center">{m[0]}</th>)}</tr></thead>
              <tbody>
                <tr><td className="text-mute">°C</td>{out.t.map((v, i) => <td key={i} className="!px-1 text-right">{Math.round(v)}</td>)}</tr>
                <tr><td className="text-mute">mm</td>{out.p.map((v, i) => <td key={i} className="!px-1 text-right">{Math.round(v)}</td>)}</tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------- USDA hardiness ----------
export function HardinessTool() {
  const [point, setPoint] = usePoint();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [out, setOut] = useState<{ zone: string; minC: number } | null>(null);

  const load = async (pt: { lat: number; lng: number }) => {
    setPoint(pt); setBusy(true); setErr(null); setOut(null);
    try {
      const url = `https://archive-api.open-meteo.com/v1/archive?latitude=${pt.lat}&longitude=${pt.lng}&start_date=2000-01-01&end_date=2023-12-31&daily=temperature_2m_min&timezone=UTC`;
      const res = await fetch(url);
      if (!res.ok) throw new Error();
      const data = await res.json();
      const mins: (number | null)[] = data.daily?.temperature_2m_min ?? [];
      const times: string[] = data.daily?.time ?? [];
      const avgMin = annualMinimumMean(times, mins, 2000, 2023);
      const zone = String(hardinessZone(avgMin));
      setOut({ zone, minC: avgMin });
    } catch {
      setErr("The temperature archive is unavailable or returned incomplete data. Please try again shortly.");
    }
    setBusy(false);
  };

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="card space-y-4 p-4">
        <PlaceField label="Garden location" value={point} onChange={(v) => v && load(v)} />
        {busy && <Spinner label="Scanning 24 winters of minima…" />}
        {err && <ErrorBox>{err}</ErrorBox>}
        <p className="text-xs text-mute">Method: mean of annual extreme minima from 24 years of ERA5 reanalysis, mapped to USDA band widths (each zone ≈ 5.6 °C / 10 °F). Microclimates shift real gardens — treat as guidance.</p>
      </div>
      {out && (
        <div className="grid content-start grid-cols-2 gap-2">
          <Stat label="Hardiness zone" value={`Zone ${out.zone}`} sub="estimate, not the official USDA map" />
          <Stat label="Avg annual extreme min" value={`${fmt(out.minC, 1)} °C`} sub={`${fmt(out.minC * 9 / 5 + 32, 1)} °F`} />
        </div>
      )}
    </div>
  );
}
