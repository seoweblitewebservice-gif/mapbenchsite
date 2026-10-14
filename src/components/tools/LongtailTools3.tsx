"use client";

import { useState } from "react";
import { CopyBtn, ErrorBox, Field, Stat } from "@/components/ui";
import { BearingTool, MidpointTool } from "./BearingMidpoint";
import DistanceTool from "./DistanceTool";
import GeoLinesTool from "./GeoLinesTool";
import RadiusTool from "./RadiusTool";

const toRad = (d: number) => d * Math.PI / 180;
const fmt = (n: number, d = 2) => Number.isFinite(n) ? n.toFixed(d) : "—";

type Row = { label: string; value: string; sub?: string };

function Num({ label, value, setValue }: { label: string; value: string; setValue: (v: string) => void }) {
  return <Field label={label}><input className="input" type="number" value={value} onChange={(e) => setValue(e.target.value)} /></Field>;
}

function ResultActions({ rows, onReset }: { rows: Row[]; onReset: () => void }) {
  const text = rows.map((r) => `${r.label}: ${r.value}${r.sub ? ` (${r.sub})` : ""}`).join("\n");
  return <div className="flex flex-wrap gap-2"><CopyBtn text={text} label="Copy results" /><button type="button" className="btn btn-ghost btn-sm" onClick={onReset}>Reset</button></div>;
}

const DEFAULTS: Record<string, [string, string]> = {
  "flight-time-distance": ["500", "800"],
  "shipping-time": ["1000", "20"],
  "ship-speed-distance-time": ["1000", "20"],
  "delivery-fee-distance": ["25", "1.5"],
  "service-call-cost": ["80", "25"],
  "technician-travel-time": ["40", "50"],
  "branch-travel-cost": ["100", "0.5"],
  "delivery-cost-km": ["20", "1.5"],
  "courier-charge": ["10", "2"],
  "lot-width": ["500", "20"],
  "lot-depth": ["500", "25"],
  "field-coverage-time": ["50", "5"],
  "mowing-time": ["1000", "250"],
  "fence-post-count": ["100", "2.5"],
  "garden-bed-area": ["10", "4"],
  "mulch-volume": ["100", "5"],
};

const LABELS: Record<string, [string, string]> = {
  "flight-time-distance": ["Distance (km)", "Average speed (km/h)"],
  "shipping-time": ["Distance (nautical miles)", "Speed (knots)"],
  "ship-speed-distance-time": ["Distance (nautical miles)", "Speed (knots)"],
  "delivery-fee-distance": ["Distance (km)", "Fee per km"],
  "service-call-cost": ["Base service fee", "Travel charge"],
  "technician-travel-time": ["Distance (km)", "Average speed (km/h)"],
  "branch-travel-cost": ["Distance (km)", "Cost per km"],
  "delivery-cost-km": ["Distance (km)", "Cost per km"],
  "courier-charge": ["Distance (km)", "Charge per km"],
  "lot-width": ["Lot area (m²)", "Lot depth (m)"],
  "lot-depth": ["Lot area (m²)", "Lot width (m)"],
  "field-coverage-time": ["Field area (acres)", "Coverage rate (acres/hour)"],
  "mowing-time": ["Lawn area (m²)", "Mowing rate (m²/hour)"],
  "fence-post-count": ["Fence length (m)", "Post spacing (m)"],
  "garden-bed-area": ["Length (m)", "Width (m)"],
  "mulch-volume": ["Area (m²)", "Mulch depth (cm)"],
};

function TwoNumber({ mode }: { mode: string }) {
  const defaults = DEFAULTS[mode] ?? ["1", "1"];
  const labels = LABELS[mode] ?? ["Value A", "Value B"];
  const [a, setA] = useState(defaults[0]);
  const [b, setB] = useState(defaults[1]);
  const x = Number(a), y = Number(b);
  let rows: Row[] = [];

  if (mode === "flight-time-distance") {
    const h = y > 0 ? x / y : NaN;
    rows = [{ label: "Estimated flight time", value: `${fmt(h, 2)} h` }, { label: "Minutes", value: `${fmt(h * 60, 0)} min` }, { label: "Distance", value: `${fmt(x, 1)} km` }];
  }
  if (mode === "shipping-time" || mode === "ship-speed-distance-time") {
    const h = y > 0 ? x / y : NaN;
    rows = [{ label: "Transit time", value: `${fmt(h, 2)} h` }, { label: "Days", value: `${fmt(h / 24, 2)} days` }, { label: "Kilometres", value: `${fmt(x * 1.852, 1)} km` }];
  }
  if (mode === "delivery-fee-distance") rows = [{ label: "Delivery fee", value: fmt(x * y, 2) }, { label: "Rate", value: `${fmt(y, 2)} per km` }, { label: "Round-trip fee", value: fmt(x * y * 2, 2) }];
  if (mode === "service-call-cost") rows = [{ label: "Estimated call cost", value: fmt(x + y, 2), sub: "base fee + travel charge" }, { label: "Base share", value: x + y > 0 ? `${fmt(x / (x + y) * 100, 1)}%` : "—" }, { label: "Travel share", value: x + y > 0 ? `${fmt(y / (x + y) * 100, 1)}%` : "—" }];
  if (mode === "technician-travel-time") {
    const h = y > 0 ? x / y : NaN;
    rows = [{ label: "Travel time", value: `${fmt(h, 2)} h` }, { label: "Minutes", value: `${fmt(h * 60, 0)} min` }, { label: "Round trip", value: `${fmt(h * 2, 2)} h` }];
  }
  if (mode === "branch-travel-cost") rows = [{ label: "One-way travel cost", value: fmt(x * y, 2) }, { label: "Round-trip cost", value: fmt(x * y * 2, 2) }, { label: "Round-trip distance", value: `${fmt(x * 2, 1)} km` }];
  if (mode === "delivery-cost-km" || mode === "courier-charge") rows = [{ label: "Estimated charge", value: fmt(x * y, 2) }, { label: "Round-trip charge", value: fmt(x * y * 2, 2) }, { label: "Distance", value: `${fmt(x, 1)} km` }];
  if (mode === "lot-width") rows = [{ label: "Lot width", value: y > 0 ? `${fmt(x / y, 2)} m` : "—" }, { label: "Area", value: `${fmt(x, 2)} m²` }, { label: "Estimated perimeter", value: y > 0 ? `${fmt(2 * (y + x / y), 2)} m` : "—" }];
  if (mode === "lot-depth") rows = [{ label: "Lot depth", value: y > 0 ? `${fmt(x / y, 2)} m` : "—" }, { label: "Area", value: `${fmt(x, 2)} m²` }, { label: "Estimated perimeter", value: y > 0 ? `${fmt(2 * (y + x / y), 2)} m` : "—" }];
  if (mode === "field-coverage-time" || mode === "mowing-time") {
    const h = y > 0 ? x / y : NaN;
    rows = [{ label: "Estimated time", value: `${fmt(h, 2)} h` }, { label: "Minutes", value: `${fmt(h * 60, 0)} min` }, { label: "Rate", value: fmt(y, 2) }];
  }
  if (mode === "fence-post-count") rows = [{ label: "Posts needed", value: y > 0 ? String(Math.ceil(x / y) + 1) : "—" }, { label: "Approx. gaps", value: y > 0 ? String(Math.ceil(x / y)) : "—" }, { label: "Fence length", value: `${fmt(x, 1)} m` }];
  if (mode === "garden-bed-area") rows = [{ label: "Area", value: `${fmt(x * y, 2)} m²` }, { label: "Perimeter", value: `${fmt(2 * (x + y), 2)} m` }, { label: "Diagonal", value: `${fmt(Math.hypot(x, y), 2)} m` }];
  if (mode === "mulch-volume") rows = [{ label: "Volume", value: `${fmt(x * (y / 100), 3)} m³` }, { label: "Litres", value: `${fmt(x * (y / 100) * 1000, 0)} L` }, { label: "20 L bags", value: String(Math.ceil(x * (y / 100) * 1000 / 20)) }];

  const valid = Number.isFinite(x) && Number.isFinite(y);
  return <div className="space-y-4">
    <div className="card grid gap-3 p-4 sm:grid-cols-2"><Num label={labels[0]} value={a} setValue={setA} /><Num label={labels[1]} value={b} setValue={setB} /></div>
    {!valid ? <ErrorBox>Enter valid numeric values.</ErrorBox> : <><div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{rows.map((r) => <Stat key={r.label} label={r.label} value={r.value} sub={r.sub} />)}</div><ResultActions rows={rows} onReset={() => { setA(defaults[0]); setB(defaults[1]); }} /></>}
  </div>;
}

function OneNumber({ mode }: { mode: "square-perimeter-area" | "square-acreage-perimeter" }) {
  const initial = mode === "square-perimeter-area" ? "400" : "800";
  const label = mode === "square-perimeter-area" ? "Square area (m²)" : "Square perimeter (ft)";
  const [value, setValue] = useState(initial);
  const x = Number(value);
  let rows: Row[] = [];
  if (mode === "square-perimeter-area") {
    const side = Math.sqrt(Math.max(0, x));
    rows = [{ label: "Square side", value: `${fmt(side, 2)} m` }, { label: "Perimeter", value: `${fmt(side * 4, 2)} m` }, { label: "Area", value: `${fmt(x, 2)} m²` }];
  } else {
    const side = x / 4, area = side * side;
    rows = [{ label: "Square side", value: `${fmt(side, 2)} ft` }, { label: "Square area", value: `${fmt(area, 2)} ft²` }, { label: "Acres", value: `${fmt(area / 43560, 4)} acres` }];
  }
  return <div className="space-y-4"><div className="card p-4"><Num label={label} value={value} setValue={setValue} /></div><div className="grid gap-2 sm:grid-cols-3">{rows.map((r) => <Stat key={r.label} label={r.label} value={r.value} />)}</div><ResultActions rows={rows} onReset={() => setValue(initial)} /></div>;
}

function GeoReference({ mode }: { mode: "hemisphere" | "latitude-band" | "longitude-zone" }) {
  const [lat, setLat] = useState("28.6139"), [lng, setLng] = useState("77.2090");
  const la = Number(lat), lo = Number(lng);
  const valid = Number.isFinite(la) && Number.isFinite(lo) && Math.abs(la) <= 90 && Math.abs(lo) <= 180;
  const rows: Row[] = [];
  if (valid && mode === "hemisphere") rows.push({ label: "Hemisphere", value: `${la >= 0 ? "Northern" : "Southern"} / ${lo >= 0 ? "Eastern" : "Western"}` }, { label: "Latitude", value: `${Math.abs(la).toFixed(4)}° ${la >= 0 ? "N" : "S"}` }, { label: "Longitude", value: `${Math.abs(lo).toFixed(4)}° ${lo >= 0 ? "E" : "W"}` });
  if (valid && mode === "latitude-band") rows.push({ label: "Latitude band", value: Math.abs(la) < 23.4366 ? "Tropical" : Math.abs(la) < 66.5634 ? "Mid-latitude" : "Polar" }, { label: "Distance from Equator", value: `${fmt(Math.abs(la) * 111.195, 1)} km` }, { label: "Absolute latitude", value: `${fmt(Math.abs(la), 3)}°` });
  if (valid && mode === "longitude-zone") {
    const zone = Math.max(-12, Math.min(14, Math.round(lo / 15)));
    const central = zone * 15;
    rows.push({ label: "Approx. longitude zone", value: `UTC${zone >= 0 ? "+" : ""}${zone}` }, { label: "Central meridian", value: `${Math.abs(central)}° ${central >= 0 ? "E" : "W"}` }, { label: "Solar offset from UTC", value: `${fmt(lo * 4, 0)} minutes`, sub: "geographic solar-time approximation" });
  }
  return <div className="space-y-4"><div className="card grid gap-3 p-4 sm:grid-cols-2"><Num label="Latitude" value={lat} setValue={setLat} /><Num label="Longitude" value={lng} setValue={setLng} /></div>{!valid ? <ErrorBox>Enter valid latitude and longitude values.</ErrorBox> : <><div className="grid gap-2 sm:grid-cols-3">{rows.map((r) => <Stat key={r.label} label={r.label} value={r.value} sub={r.sub} />)}</div><ResultActions rows={rows} onReset={() => { setLat("28.6139"); setLng("77.2090"); }} /></>}</div>;
}

function SimpleConvert({ mode }: { mode: string }) {
  const [v, setV] = useState("1");
  const x = Number(v);
  let input = "Value";
  let rows: Row[] = [];
  if (mode === "hectares-square-km") { input = "Hectares"; rows = [{ label: "Square kilometres", value: fmt(x * 0.01, 6) }, { label: "Acres", value: fmt(x * 2.4710538147, 4) }, { label: "Square metres", value: fmt(x * 10000, 0) }]; }
  if (mode === "acres-square-feet") { input = "Acres"; rows = [{ label: "Square feet", value: fmt(x * 43560, 2) }, { label: "Hectares", value: fmt(x * 0.40468564224, 6) }, { label: "Square metres", value: fmt(x * 4046.8564224, 2) }]; }
  if (mode === "sqm-hectares") { input = "Square metres"; rows = [{ label: "Hectares", value: fmt(x / 10000, 6) }, { label: "Acres", value: fmt(x / 4046.8564224, 6) }, { label: "Square feet", value: fmt(x * 10.7639104167, 2) }]; }
  return <div className="space-y-4"><div className="card p-4"><Num label={input} value={v} setValue={setV} /></div><div className="grid gap-2 sm:grid-cols-3">{rows.map((r) => <Stat key={r.label} label={r.label} value={r.value} />)}</div><ResultActions rows={rows} onReset={() => setV("1")} /></div>;
}

const LINE_MODE: Record<string, string> = {
  "distance-equator": "equator",
  "distance-prime": "prime-meridian",
  "distance-tropic-cancer": "tropic-cancer",
  "distance-tropic-capricorn": "tropic-capricorn",
  "distance-arctic-circle": "arctic",
  "distance-antarctic-circle": "antarctic",
};

export default function LongtailTools3({ params }: { params?: Record<string, unknown> }) {
  const mode = String(params?.mode || "");

  if (mode === "flight-bearing" || mode === "nautical-bearing") return <BearingTool params={{ coordInputs: true }} />;
  if (mode === "great-circle-route") return <DistanceTool params={{ defaultUnit: "km", emphasize: "crow" }} />;
  if (mode === "airport-midpoint") return <MidpointTool params={{ coordInputs: true }} />;
  if (mode === "nautical-distance") return <DistanceTool params={{ defaultUnit: "nmi", emphasize: "nautical" }} />;
  if (LINE_MODE[mode]) return <GeoLinesTool params={{ line: LINE_MODE[mode] }} />;
  if (["delivery-radius-area", "customer-radius-area", "catchment-area", "sales-territory-area"].includes(mode)) return <RadiusTool params={{}} />;
  if (["hemisphere", "latitude-band", "longitude-zone"].includes(mode)) return <GeoReference mode={mode as "hemisphere" | "latitude-band" | "longitude-zone"} />;
  if (["hectares-square-km", "acres-square-feet", "sqm-hectares"].includes(mode)) return <SimpleConvert mode={mode} />;
  if (mode === "square-perimeter-area" || mode === "square-acreage-perimeter") return <OneNumber mode={mode} />;

  const supported = ["flight-time-distance", "shipping-time", "ship-speed-distance-time", "delivery-fee-distance", "service-call-cost", "technician-travel-time", "branch-travel-cost", "delivery-cost-km", "courier-charge", "lot-width", "lot-depth", "field-coverage-time", "mowing-time", "fence-post-count", "garden-bed-area", "mulch-volume"];
  if (supported.includes(mode)) return <TwoNumber mode={mode} />;
  return <ErrorBox>This calculator mode is not configured.</ErrorBox>;
}
