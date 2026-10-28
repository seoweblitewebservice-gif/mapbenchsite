"use client";
import { useMemo, useRef, useState } from "react";
import { fuelEstimate } from "@/lib/fuelEstimate";
import { distanceKm, fmt, fmtDist, type UnitKey } from "@/lib/geo";
import { AIRPORTS } from "@/data/airports";
import { route, fmtDuration } from "@/lib/routing";
import { Field, Stat, ErrorBox, Spinner, Seg } from "@/components/ui";
import { PlaceField, type PlaceValue } from "./shared";

// ---------- Flight Time ----------
export function FlightTimeTool() {
  const [a, setA] = useState("JFK");
  const [b, setB] = useState("LHR");
  const apA = AIRPORTS.find((x) => x.iata === a)!;
  const apB = AIRPORTS.find((x) => x.iata === b)!;
  const km = distanceKm(apA, apB);
  const hours = km / 850 + 0.75; // cruise ~850 km/h + taxi/climb/descent block
  const hh = Math.floor(hours), mm = Math.round((hours - hh) * 60);
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="card space-y-4 p-4">
        <div className="grid grid-cols-2 gap-3">
          <Field label="From airport">
            <select className="select" value={a} onChange={(e) => setA(e.target.value)}>
              {AIRPORTS.map((x) => <option key={x.iata} value={x.iata}>{x.iata} — {x.city}</option>)}
            </select>
          </Field>
          <Field label="To airport">
            <select className="select" value={b} onChange={(e) => setB(e.target.value)}>
              {AIRPORTS.map((x) => <option key={x.iata} value={x.iata}>{x.iata} — {x.city}</option>)}
            </select>
          </Field>
        </div>
        <p className="text-xs text-mute">Estimate method: great-circle air distance ÷ 850 km/h cruise, plus a 45-minute block for taxi, climb and approach. Real schedules add winds, routing and turnaround.</p>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Stat label="Air distance" value={fmt(km, 0) + " km"} sub={fmt(km * 0.539957, 0) + " nmi · " + fmt(km * 0.621371, 0) + " mi"} />
        <Stat label="Estimated flight time" value={`${hh}h ${String(mm).padStart(2, "0")}m`} sub="gate to gate, still air" />
        <Stat label="From" value={`${apA.iata} ${apA.name}`} sub={apA.country} />
        <Stat label="To" value={`${apB.iata} ${apB.name}`} sub={apB.country} />
      </div>
    </div>
  );
}

// ---------- Fuel Cost ----------
export function FuelCostTool() {
  const [a, setA] = useState<PlaceValue | null>(null);
  const [b, setB] = useState<PlaceValue | null>(null);
  const [consumption, setConsumption] = useState(7.5); // L/100km
  const [price, setPrice] = useState(1.65); // per litre
  const [unit, setUnit] = useState<"l100" | "mpg">("l100");
  const [mpg, setMpg] = useState(32);
  const [perGal, setPerGal] = useState(3.8);
  const [basis, setBasis] = useState<"road" | "straight">("road");
  const [busy, setBusy] = useState(false);
  const [roadKm, setRoadKm] = useState<number | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const requestId = useRef(0);
  const changePlace = (setter: (v: PlaceValue | null) => void, v: PlaceValue | null) => { requestId.current++; setBusy(false); setRoadKm(null); setErr(null); setter(v); };
  const straightKm = a && b ? distanceKm(a, b) : null;

  const calcRoad = async () => {
    if (!a || !b) { setErr("Set both points first."); return; }
    const id = ++requestId.current;
    setBusy(true); setErr(null); setRoadKm(null);
    const r = await route([a, b], "driving");
    if (id !== requestId.current) return;
    setBusy(false);
    if (!r.ok) { setErr(r.message); setRoadKm(null); return; }
    setRoadKm(r.distanceKm);
  };

  const distKm = basis === "road" ? roadKm : straightKm;
  const estimate = distKm !== null ? fuelEstimate(distKm, unit, unit === "l100" ? consumption : mpg, unit === "l100" ? price : perGal) : null;
  const cost = estimate?.cost ?? null;

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="card space-y-4 p-4">
        <PlaceField label="From" value={a} onChange={(v) => changePlace(setA, v)} />
        <PlaceField label="To" value={b} onChange={(v) => changePlace(setB, v)} />
        <div className="flex flex-wrap items-center gap-2">
          <Seg ariaLabel="Distance basis" options={[{ value: "road" as const, label: "Road distance" }, { value: "straight" as const, label: "Straight line" }]} value={basis} onChange={setBasis} />
          {basis === "road" && <button type="button" className="btn btn-ghost btn-sm" onClick={calcRoad} disabled={busy}>{busy ? <Spinner label="Routing…" /> : "Fetch road distance"}</button>}
        </div>
        {err && <ErrorBox>{err}</ErrorBox>}
        <div className="grid grid-cols-2 gap-3">
          <Field label="Efficiency">
            {unit === "l100"
              ? <input type="number" step="0.1" min={1} className="input" value={consumption} onChange={(e) => setConsumption(Math.max(1, parseFloat(e.target.value) || 1))} aria-label="Litres per 100 km" />
              : <input type="number" step="1" min={1} className="input" value={mpg} onChange={(e) => setMpg(Math.max(1, parseFloat(e.target.value) || 1))} aria-label="Miles per gallon" />}
          </Field>
          <Field label="Fuel price">
            {unit === "l100"
              ? <input type="number" step="0.01" min={0} className="input" value={price} onChange={(e) => setPrice(Math.max(0, parseFloat(e.target.value) || 0))} aria-label="Price per litre" />
              : <input type="number" step="0.01" min={0} className="input" value={perGal} onChange={(e) => setPerGal(Math.max(0, parseFloat(e.target.value) || 0))} aria-label="Price per gallon" />}
          </Field>
        </div>
        <Seg ariaLabel="Units" options={[{ value: "l100" as const, label: "L/100 km + /litre" }, { value: "mpg" as const, label: "US MPG + /US gallon" }]} value={unit} onChange={setUnit} />
      </div>
      <div className="grid content-start grid-cols-2 gap-2">
        <Stat label="Distance" value={distKm !== null ? fmt(distKm) + " km" : "—"} sub={distKm !== null ? fmt(distKm * 0.621371) + " mi" : basis === "road" ? "fetch or switch basis" : "set both points"} />
        <Stat label="Fuel needed" value={estimate ? fmt(estimate.amount) + (unit === "l100" ? " L" : " US gal") : "—"} />
        <Stat label="Estimated fuel cost" value={cost !== null ? fmt(cost, 1) : "—"} sub="local currency units" />
        <Stat label="Round trip" value={cost !== null ? fmt(cost * 2, 1) : "—"} />
      </div>
    </div>
  );
}

// ---------- Nearest Airport ----------
export function NearestAirportTool() {
  const [point, setPoint] = useState<PlaceValue | null>(null);
  const nearest = useMemo(() => {
    if (!point) return [];
    return AIRPORTS
      .map((a) => ({ ...a, d: distanceKm(point, a) }))
      .sort((x, y) => x.d - y.d)
      .slice(0, 6);
  }, [point]);
  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div className="card p-4">
        <PlaceField label="Your location" value={point} onChange={setPoint} placeholder="Search a city or click coordinates…" />
        <p className="mt-2 text-xs text-mute">Compared against a curated dataset of ~90 major international airports; distances are great-circle to each field&apos;s coordinates.</p>
      </div>
      {nearest.length > 0 && (
        <div className="card p-4">
          <div className="label">Nearest major airports</div>
          <table className="tbl mt-2">
            <thead><tr><th></th><th>Airport</th><th className="text-right">Distance</th><th className="text-right">Drive-ish time</th></tr></thead>
            <tbody>
              {nearest.map((a, i) => (
                <tr key={a.iata}>
                  <td className="font-bold text-brand-strong">{i + 1}</td>
                  <td><span className="font-mono font-bold">{a.iata}</span> <span className="text-mute">{a.name} · {a.city}</span></td>
                  <td className="text-right font-semibold">{fmt(a.d, 0)} km</td>
                  <td className="text-right text-mute">~{fmtDuration((a.d / 80) * 3600 + 900)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ---------- Walking Time ----------
export function WalkingTimeTool() {
  const [distance, setDistance] = useState(5);
  const [unit, setUnit] = useState<UnitKey>("km");
  const [speed, setSpeed] = useState(5);
  const km = unit === "mi" ? distance * 1.60934 : distance;
  const hours = km / Math.max(1, speed);
  const steps = Math.round((km * 1000) / 0.762);
  const kcal = Math.round(km * 70 * 0.75); // ~0.75 kcal/kg/km at 70 kg
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="card space-y-4 p-4">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Distance">
            <input type="number" step="any" min={0.1} className="input" value={distance} onChange={(e) => setDistance(Math.max(0.1, parseFloat(e.target.value) || 0.1))} />
          </Field>
          <Field label="Unit">
            <select className="select" value={unit} onChange={(e) => setUnit(e.target.value as UnitKey)}>
              <option value="km">Kilometres</option><option value="mi">Miles</option>
            </select>
          </Field>
        </div>
        <Field label="Walking speed (km/h)" hint="Relaxed ≈ 4, average ≈ 5, brisk ≈ 6.5">
          <input type="number" step="0.1" min={1} max={10} className="input" value={speed} onChange={(e) => setSpeed(Math.min(10, Math.max(1, parseFloat(e.target.value) || 5)))} />
        </Field>
        <p className="text-xs text-mute">Need a route-based figure instead? The Walking Route Planner computes distance and time along actual footways between two real points.</p>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Stat label="Walking time" value={fmtDuration(hours * 3600)} sub={`${fmt(hours, 2)} hours`} />
        <Stat label="Steps (approx)" value={steps.toLocaleString()} sub="at ~0.76 m stride" />
        <Stat label="Energy (approx)" value={`${kcal} kcal`} sub="70 kg walker" />
        <Stat label="Distance" value={`${fmt(km)} km`} sub={`${fmt(km * 0.621371)} mi`} />
      </div>
    </div>
  );
}
