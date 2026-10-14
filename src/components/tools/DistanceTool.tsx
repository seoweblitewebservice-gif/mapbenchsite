"use client";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { Map as MLMap, GeoJSONSource } from "maplibre-gl";
import { bearingBetween, compassPoint, distanceKm, fmtDist, fmt, midpoint, UNITS, type LatLng, type UnitKey } from "@/lib/geo";
import { readUrlParams, syncUrl, Field } from "@/components/ui";
import { DynamicMap, pinElement, PlaceField, type PlaceValue } from "./shared";

function parsePair(s: string | null): LatLng | null {
  if (!s) return null;
  const [x, y] = s.split(",");
  const lat = parseFloat(x), lng = parseFloat(y);
  return Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : null;
}

function Card({ label, value, sub, accent = false }: { label: string; value: ReactNode; sub?: ReactNode; accent?: boolean }) {
  return <div className={`rounded-2xl border p-4 ${accent ? "border-brand/30 bg-brand-soft/60" : "border-line bg-white"}`}><div className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-mute">{label}</div><div className={`mt-1 font-display text-2xl font-bold ${accent ? "text-brand-strong" : "text-ink"}`}>{value}</div>{sub ? <div className="mt-1 text-xs leading-relaxed text-mute">{sub}</div> : null}</div>;
}

export default function DistanceTool({ params }: { params?: Record<string, unknown> }) {
  const emphasize = (params?.emphasize as string) ?? "";
  const [unit, setUnit] = useState<UnitKey>((params?.defaultUnit as UnitKey) ?? "mi");
  const [a, setA] = useState<PlaceValue | null>(() => { const p = parsePair(readUrlParams().get("a")); return p ? { ...p, label: "Point A" } : null; });
  const [b, setB] = useState<PlaceValue | null>(() => { const p = parsePair(readUrlParams().get("b")); return p ? { ...p, label: "Point B" } : null; });
  const [knots, setKnots] = useState(10);
  const [nextPoint, setNextPoint] = useState<"a" | "b">("a");
  const nextPointRef = useRef<"a" | "b">("a");
  const mapRef = useRef<MLMap | null>(null);
  const libRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);

  const chooseNext = (value: "a" | "b") => {
    nextPointRef.current = value;
    setNextPoint(value);
  };

  const result = useMemo(() => {
    if (!a || !b) return null;
    const km = distanceKm(a, b);
    const bearing = bearingBetween(a, b);
    const finalBearing = (bearingBetween(b, a) + 180) % 360;
    const mid = midpoint(a, b);
    return { km, bearing, finalBearing, mid };
  }, [a, b]);

  useEffect(() => {
    syncUrl({ a: a ? `${a.lat.toFixed(5)},${a.lng.toFixed(5)}` : null, b: b ? `${b.lat.toFixed(5)},${b.lng.toFixed(5)}` : null });
  }, [a, b]);

  useEffect(() => {
    const map = mapRef.current, lib = libRef.current;
    if (!map || !lib) return;
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];
    const pts: LatLng[] = [];
    if (a) { markersRef.current.push(new lib.Marker({ element: pinElement("#1d6e63", "A") }).setLngLat([a.lng, a.lat]).addTo(map)); pts.push(a); }
    if (b) { markersRef.current.push(new lib.Marker({ element: pinElement("#d95d32", "B") }).setLngLat([b.lng, b.lat]).addTo(map)); pts.push(b); }
    const src = map.getSource("dist-line") as GeoJSONSource | undefined;
    src?.setData(a && b ? { type: "Feature", properties: {}, geometry: { type: "LineString", coordinates: [[a.lng, a.lat], [b.lng, b.lat]] } } : { type: "FeatureCollection", features: [] } as any);
    if (pts.length === 2) {
      const dx = Math.abs(pts[0].lng - pts[1].lng);
      if (dx <= 180) map.fitBounds([[Math.min(pts[0].lng, pts[1].lng), Math.min(pts[0].lat, pts[1].lat)], [Math.max(pts[0].lng, pts[1].lng), Math.max(pts[0].lat, pts[1].lat)]], { padding: 80, maxZoom: 11, duration: 500 });
    } else if (pts.length === 1) map.flyTo({ center: [pts[0].lng, pts[0].lat], zoom: 7, essential: true });
  }, [a, b]);

  const isNautical = emphasize === "nautical";
  const swap = () => { setA(b); setB(a); chooseNext("a"); };

  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-line bg-gradient-to-br from-white to-well/30 p-4 sm:p-5">
        <div className="grid gap-3 lg:grid-cols-[1fr_auto_1fr] lg:items-end">
          <PlaceField label="From" value={a} onChange={(v) => { setA(v); if (v) chooseNext("b"); }} placeholder={emphasize === "zip" ? "ZIP code or place…" : emphasize === "city" ? "City name…" : "Search place or address…"} />
          <button type="button" className="btn btn-ghost mb-0.5 h-10 self-end whitespace-nowrap" onClick={swap} aria-label="Swap origin and destination">⇄ Swap</button>
          <PlaceField label="To" value={b} onChange={(v) => { setB(v); if (v) chooseNext("a"); }} placeholder={emphasize === "zip" ? "ZIP code or place…" : emphasize === "city" ? "City name…" : "Search place or address…"} />
        </div>
        <div className="mt-4 flex flex-wrap items-end justify-between gap-3 border-t border-line pt-4">
          <div className="w-full sm:w-48"><Field label="Display unit"><select className="select" value={unit} onChange={(e) => setUnit(e.target.value as UnitKey)}>{Object.entries(UNITS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}</select></Field></div>
          {isNautical && <div className="w-full sm:w-52"><Field label="Speed (knots)"><input type="number" min={0.5} step="0.5" className="input" value={knots} onChange={(e) => setKnots(Math.max(0.5, parseFloat(e.target.value) || 0.5))} /></Field></div>}
          <div className="text-xs leading-relaxed text-mute">Tip: click the map to set <strong className="text-ink">{nextPoint === "a" ? "From (A)" : "To (B)"}</strong>.</div>
        </div>
      </section>

      <section className="relative overflow-hidden rounded-2xl border border-line bg-well shadow-sm">
        <DynamicMap
          center={a ?? { lat: 30, lng: 0 }} zoom={a ? 5 : 1.6} className="tall"
          onReady={(map, lib) => {
            mapRef.current = map; libRef.current = lib;
            map.addSource("dist-line", { type: "geojson", data: { type: "FeatureCollection", features: [] } });
            map.addLayer({ id: "dist-line-l", type: "line", source: "dist-line", paint: { "line-color": "#1d6e63", "line-width": 3, "line-dasharray": [2, 1.5] } });
            map.on("click", (e) => {
              const point = { lat: e.lngLat.lat, lng: e.lngLat.lng, label: `Map point ${e.lngLat.lat.toFixed(4)}, ${e.lngLat.lng.toFixed(4)}` };
              if (nextPointRef.current === "a") {
                setA(point);
                chooseNext("b");
              } else {
                setB(point);
                chooseNext("a");
              }
            });
          }}
        />
        {!a && !b && <div className="pointer-events-none absolute left-4 top-4 rounded-xl border border-line bg-white/95 px-3 py-2 text-xs font-semibold shadow-sm">Search above or click anywhere on the map to begin</div>}
      </section>

      {result && a && b ? (
        <section className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Card label="Straight-line distance" value={fmtDist(result.km, unit)} sub="Great-circle distance on Earth" accent />
            <Card label="Initial direction" value={compassPoint(result.bearing)} sub={`${fmt(result.bearing, 1)}° from true north`} />
            <Card label="Midpoint" value={`${result.mid.lat.toFixed(3)}, ${result.mid.lng.toFixed(3)}`} sub="Geodesic midpoint" />
            <Card label="Final bearing" value={`${fmt(result.finalBearing, 1)}°`} sub={compassPoint(result.finalBearing)} />
          </div>

          {isNautical && <div className="rounded-2xl border border-brand/20 bg-brand-soft px-4 py-3 text-sm">Straight-line passage at <strong>{knots} kn</strong> ≈ <strong>{fmt((result.km * 0.539957) / knots, 1)} hours</strong>.</div>}

          <div className="grid gap-3 lg:grid-cols-[1fr_1fr]">
            <div className="rounded-2xl border border-line bg-white p-4"><div className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-mute">Endpoints</div><div className="mt-3 grid gap-3 sm:grid-cols-2"><div className="rounded-xl bg-well/50 p-3"><div className="text-xs font-extrabold text-brand-strong">A · From</div><div className="mt-1 text-sm font-bold">{a.label || "Point A"}</div><div className="mt-1 text-xs text-mute">{a.lat.toFixed(5)}, {a.lng.toFixed(5)}</div></div><div className="rounded-xl bg-well/50 p-3"><div className="text-xs font-extrabold text-ember">B · To</div><div className="mt-1 text-sm font-bold">{b.label || "Point B"}</div><div className="mt-1 text-xs text-mute">{b.lat.toFixed(5)}, {b.lng.toFixed(5)}</div></div></div></div>
            <details className="rounded-2xl border border-line bg-white p-4" open><summary className="cursor-pointer text-sm font-bold">All unit conversions</summary><div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">{Object.entries(UNITS).map(([k, v]) => <div key={k} className="rounded-xl bg-well/50 p-3"><div className="text-[10px] uppercase text-mute">{v.label}</div><div className="mt-1 text-sm font-bold">{fmtDist(result.km, k as UnitKey)}</div></div>)}</div></details>
          </div>
          {emphasize === "crow" && <p className="rounded-xl border border-line bg-well/40 px-4 py-3 text-xs text-mute">This is a straight-line (great-circle) distance. For road distance and travel time, use the Driving Distance Calculator.</p>}
        </section>
      ) : (
        <div className="rounded-2xl border border-dashed border-line bg-well/30 px-5 py-6 text-center text-sm text-mute">Set both points using search, coordinates, GPS or map clicks to see distance, direction, midpoint and unit conversions.</div>
      )}
    </div>
  );
}
