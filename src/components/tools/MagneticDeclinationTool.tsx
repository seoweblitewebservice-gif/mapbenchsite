"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Map as MLMap } from "maplibre-gl";
import { Field, Spinner, ErrorBox, Stat, CopyBtn } from "@/components/ui";
import { DynamicMap, PlaceField, pinElement, type PlaceValue } from "./shared";

interface WmmResult {
  ok: boolean;
  message?: string;
  source?: string;
  model?: string;
  revision?: string;
  date?: string;
  declination?: number;
  inclination?: number | null;
  totalIntensity?: number | null;
  horizontalIntensity?: number | null;
  northIntensity?: number | null;
  eastIntensity?: number | null;
  verticalIntensity?: number | null;
  secularVariation?: { declinationArcMinPerYear?: number | null };
}

function normalize360(n: number) {
  return ((n % 360) + 360) % 360;
}

function declinationLabel(value: number) {
  if (Math.abs(value) < 0.05) return "approximately 0° (magnetic and true north nearly align)";
  return `${Math.abs(value).toFixed(2)}° ${value > 0 ? "east" : "west"}`;
}

export default function MagneticDeclinationTool() {
  const [place, setPlace] = useState<PlaceValue | null>(null);
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [altitude, setAltitude] = useState("0");
  const [trueBearing, setTrueBearing] = useState("90");
  const [result, setResult] = useState<WmmResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mapRef = useRef<MLMap | null>(null);
  const libRef = useRef<any>(null);
  const markerRef = useRef<any>(null);

  useEffect(() => {
    const map = mapRef.current, lib = libRef.current;
    if (!map || !lib || !place) return;
    if (!markerRef.current) markerRef.current = new lib.Marker({ element: pinElement("#1d6e63", "M") }).addTo(map);
    markerRef.current.setLngLat([place.lng, place.lat]);
    map.flyTo({ center: [place.lng, place.lat], zoom: Math.max(map.getZoom(), 7), essential: true });
  }, [place]);

  const calculate = async () => {
    if (!place) {
      setError("Choose a location first — search, use GPS, paste coordinates, or click the map.");
      return;
    }
    const alt = Number(altitude);
    if (!Number.isFinite(alt) || alt < -2 || alt > 1000) {
      setError("Altitude must be between -2 km and 1000 km.");
      return;
    }
    setBusy(true);
    setError(null);
    setResult(null);
    try {
      const params = new URLSearchParams({ lat: String(place.lat), lng: String(place.lng), altitude: String(alt), date });
      const response = await fetch(`/api/magnetic-declination?${params}`);
      const data = (await response.json()) as WmmResult;
      if (!response.ok || !data.ok || typeof data.declination !== "number") throw new Error(data.message || "Magnetic model lookup failed.");
      setResult(data);
    } catch (e: any) {
      setError(e?.message || "Could not calculate magnetic declination. Try again shortly.");
    } finally {
      setBusy(false);
    }
  };

  const bearing = Number(trueBearing);
  const magneticBearing = useMemo(() => {
    if (!result || typeof result.declination !== "number" || !Number.isFinite(bearing)) return null;
    // Magnetic bearing = true bearing - easterly declination.
    return normalize360(bearing - result.declination);
  }, [bearing, result]);

  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-[410px,1fr]">
        <div className="card order-2 space-y-4 p-4 lg:order-1">
          <PlaceField label="Location" value={place} onChange={setPlace} placeholder="Search a city, address or coordinates…" />
          <div className="grid grid-cols-2 gap-3">
            <Field label="Date" hint="WMM 2025 epoch: 2025–2030">
              <input type="date" className="input" min="2025-01-01" max="2030-12-31" value={date} onChange={(e) => setDate(e.target.value)} />
            </Field>
            <Field label="Altitude (km)" hint="0 = sea level">
              <input type="number" className="input" step="0.1" min={-2} max={1000} value={altitude} onChange={(e) => setAltitude(e.target.value)} />
            </Field>
          </div>
          <button type="button" className="btn btn-primary w-full" onClick={calculate} disabled={busy}>
            {busy ? <Spinner label="Calculating WMM…" /> : "Calculate magnetic declination"}
          </button>
          {error && <ErrorBox>{error}</ErrorBox>}

          {result && typeof result.declination === "number" && (
            <div className="space-y-3 border-t border-line pt-4">
              <Stat label="Magnetic declination" value={`${result.declination.toFixed(2)}°`} sub={declinationLabel(result.declination)} />
              <div className="grid grid-cols-2 gap-2">
                <Stat label="Inclination / dip" value={typeof result.inclination === "number" ? `${result.inclination.toFixed(2)}°` : "—"} />
                <Stat label="Total field" value={typeof result.totalIntensity === "number" ? `${Math.round(result.totalIntensity).toLocaleString()} nT` : "—"} />
              </div>
              <div className="rounded-xl border border-line bg-well/45 p-3 text-xs leading-6 text-mute">
                Positive declination is east of true north; negative is west. The result is date- and location-specific because Earth&apos;s magnetic field changes over time.
              </div>
              <CopyBtn text={`${place?.lat.toFixed(6)}, ${place?.lng.toFixed(6)} | ${date} | declination ${result.declination.toFixed(3)}°`} label="Copy result" />
            </div>
          )}
        </div>

        <div className="order-1 lg:order-2">
          <DynamicMap center={place ?? { lat: 25, lng: 0 }} zoom={place ? 7 : 1.6} className="tall" onReady={(map, lib) => {
            mapRef.current = map;
            libRef.current = lib;
            map.on("click", (e: any) => setPlace({ lat: e.lngLat.lat, lng: e.lngLat.lng, label: "Map point" }));
          }} />
        </div>
      </div>

      {result && typeof result.declination === "number" && (
        <div className="grid gap-4 md:grid-cols-2">
          <section className="card p-4">
            <h3 className="font-display text-lg font-bold">Convert true bearing to magnetic bearing</h3>
            <p className="mt-1 text-sm leading-6 text-mute">Enter a true bearing. MapBench applies the selected location&apos;s WMM declination.</p>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <Field label="True bearing">
                <input className="input" type="number" step="0.1" value={trueBearing} onChange={(e) => setTrueBearing(e.target.value)} />
              </Field>
              <Stat label="Magnetic bearing" value={magneticBearing === null ? "—" : `${magneticBearing.toFixed(2)}°`} sub="true − declination" />
            </div>
          </section>
          <section className="card p-4">
            <h3 className="font-display text-lg font-bold">Model provenance</h3>
            <p className="mt-2 text-sm leading-6 text-mute">Source: {result.source || "British Geological Survey World Magnetic Model 2025"}. This is a geomagnetic model result, not a phone compass reading. Local magnetic objects, vehicles, steel structures and instrument calibration can affect a physical compass.</p>
            {typeof result.secularVariation?.declinationArcMinPerYear === "number" && <p className="mt-2 text-sm text-mute">Modelled annual declination change: {result.secularVariation.declinationArcMinPerYear.toFixed(2)} arc-min/year.</p>}
          </section>
        </div>
      )}
    </div>
  );
}
