"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { GeoJSONSource, Map as MLMap } from "maplibre-gl";
import { bearingBetween, compassPoint, destination, distanceKm, fmt, kmTo, toKm, type UnitKey } from "@/lib/geo";
import { MAJOR_CITIES } from "@/data/cities";
import { downloadText, toCsv } from "@/lib/formats";
import { ErrorBox, Field, Spinner, Stat } from "@/components/ui";
import { DynamicMap, pinElement, PlaceField, type PlaceValue } from "./shared";

type CensusPlace = {
  geoid: string;
  name: string;
  stateFips: string;
  placeCode: string;
  lat: number;
  lng: number;
  distanceKm: number;
  population2020: number;
  housingUnits2020: number;
  landAreaSqMi: number | null;
};

type CensusPayload = {
  ok: true;
  radiusKm: number;
  places: CensusPlace[];
  zctas: { zcta: string; lat: number; lng: number; distanceKm: number; population2020: number; housingUnits2020: number }[];
  summary: { placeCount: number; zctaCount: number; populationEstimate: number; housingUnits: number; largestPlace: CensusPlace | null };
  method: string;
  sources: string[];
};

export default function CitiesRadiusProTool({ params }: { params?: Record<string, unknown> }) {
  const populationMode = params?.mode === "population";
  const [unit, setUnit] = useState<UnitKey>("mi");
  const [radius, setRadius] = useState(50);
  const [center, setCenter] = useState<PlaceValue | null>(null);
  const [census, setCensus] = useState<CensusPayload | null>(null);
  const [censusError, setCensusError] = useState<string | null>(null);
  const [loadingCensus, setLoadingCensus] = useState(false);
  const [minPopulation, setMinPopulation] = useState(0);
  const mapRef = useRef<MLMap | null>(null);
  const libRef = useRef<any>(null);
  const markerRef = useRef<any>(null);

  const radiusKm = toKm(radius, unit);
  const fallback = useMemo(() => {
    if (!center) return [];
    return MAJOR_CITIES.map((c) => ({ ...c, distKm: distanceKm(center, c), bearing: bearingBetween(center, c) }))
      .filter((c) => c.distKm <= radiusKm && c.pop * 1000 >= minPopulation)
      .sort((a, b) => a.distKm - b.distKm);
  }, [center, radiusKm, minPopulation]);

  useEffect(() => {
    if (!center || radiusKm > 1000) { setCensus(null); return; }
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setLoadingCensus(true);
      setCensusError(null);
      try {
        const res = await fetch(`/api/us-radius-census?lat=${center.lat}&lng=${center.lng}&radiusKm=${radiusKm}`, { signal: controller.signal });
        const json = await res.json();
        if (!res.ok || !json.ok) throw new Error(json.message || "Census radius lookup failed.");
        setCensus(json);
      } catch (e: any) {
        if (e?.name !== "AbortError") {
          setCensus(null);
          setCensusError(e?.message || "U.S. Census radius data unavailable.");
        }
      } finally {
        setLoadingCensus(false);
      }
    }, 350);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [center, radiusKm]);

  const censusPlaces = useMemo(() => (census?.places ?? []).filter((p) => p.population2020 >= minPopulation), [census, minPopulation]);
  const usingCensus = !!census;

  useEffect(() => {
    const map = mapRef.current, lib = libRef.current;
    if (!map || !lib) return;
    if (center) {
      if (!markerRef.current) markerRef.current = new lib.Marker({ element: pinElement("#d95d32", "C") }).addTo(map);
      markerRef.current.setLngLat([center.lng, center.lat]);
    }
    const ring: [number, number][] = [];
    if (center) for (let i = 0; i <= 128; i++) { const p = destination(center, (i / 128) * 360, radiusKm); ring.push([p.lng, p.lat]); }
    (map.getSource("cr-ring") as GeoJSONSource | undefined)?.setData(center ? { type: "Feature", properties: {}, geometry: { type: "Polygon", coordinates: [ring] } } : { type: "FeatureCollection", features: [] });
    const points = usingCensus ? censusPlaces : fallback.map((c) => ({ name: c.name, population2020: c.pop * 1000, lat: c.lat, lng: c.lng }));
    (map.getSource("cr-cities") as GeoJSONSource | undefined)?.setData({ type: "FeatureCollection", features: points.map((p: any) => ({ type: "Feature", properties: { name: p.name, pop: p.population2020 }, geometry: { type: "Point", coordinates: [p.lng, p.lat] } })) });
    if (center) map.flyTo({ center: [center.lng, center.lat], zoom: Math.max(3, Math.min(10, 7 - Math.log2(Math.max(1, radiusKm) / 50))), essential: true });
  }, [center, radiusKm, censusPlaces, fallback, usingCensus]);

  const exportCsv = () => {
    if (usingCensus) {
      downloadText("mapbench-census-places-in-radius.csv", toCsv(
        ["place", "state_fips", "place_geoid", "distance_km", "population_2020", "housing_units_2020", "latitude", "longitude"],
        censusPlaces.map((p) => [p.name, p.stateFips, p.geoid, p.distanceKm.toFixed(2), p.population2020, p.housingUnits2020, p.lat, p.lng]),
      ), "text/csv");
    } else {
      downloadText("mapbench-world-cities-in-radius.csv", toCsv(
        ["city", "country", "distance_km", "population", "latitude", "longitude"],
        fallback.map((c) => [c.name, c.country, c.distKm.toFixed(2), c.pop * 1000, c.lat, c.lng]),
      ), "text/csv");
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-[410px,1fr]">
        <div className="card order-2 space-y-4 p-4 lg:order-1">
          <PlaceField label="Centre point" value={center} onChange={setCenter} placeholder="Search a city, ZIP, address or use GPS…" />
          <div className="grid grid-cols-2 gap-3">
            <Field label={`Radius (${unit})`}><input type="number" min={1} max={unit === "km" ? 1000 : 621} className="input" value={radius} onChange={(e) => setRadius(Math.max(1, Number(e.target.value) || 1))} /></Field>
            <Field label="Unit"><select className="select" value={unit} onChange={(e) => { const next = e.target.value as UnitKey; setRadius(Number(kmTo(toKm(radius, unit), next).toFixed(1))); setUnit(next); }}><option value="mi">Miles</option><option value="km">Kilometres</option><option value="nmi">Nautical miles</option></select></Field>
          </div>
          <Field label="Minimum place population"><select className="select" value={minPopulation} onChange={(e) => setMinPopulation(Number(e.target.value))}><option value={0}>Any population</option><option value={1000}>1,000+</option><option value={5000}>5,000+</option><option value={10000}>10,000+</option><option value={50000}>50,000+</option><option value={100000}>100,000+</option></select></Field>

          {loadingCensus && <Spinner label="Checking Census places and ZIP areas…" />}
          {censusError && center && <div className="rounded-lg border border-line bg-well/40 p-3 text-xs text-mute">Official U.S. Census radius mode was not available for this point, so MapBench is showing the worldwide major-city fallback. {censusError}</div>}

          {center && (
            <div className="space-y-3 border-t border-line pt-3">
              {usingCensus ? (
                <>
                  <div className="flex flex-wrap gap-2"><span className="chip chip-brand">U.S. Census mode</span><span className="chip">2020 Decennial population</span></div>
                  {populationMode ? (
                    <div className="grid grid-cols-2 gap-2">
                      <Stat label="Population estimate" value={`≈ ${census.summary.populationEstimate.toLocaleString("en-US")}`} sub={`${census.summary.zctaCount} ZCTA centroids inside radius`} />
                      <Stat label="Housing units" value={census.summary.housingUnits.toLocaleString("en-US")} sub="2020 Census HU100" />
                      <Stat label="Census places" value={censusPlaces.length} sub={`${census.summary.placeCount} before population filter`} />
                      <Stat label="Largest place" value={census.summary.largestPlace?.name ?? "—"} sub={census.summary.largestPlace ? census.summary.largestPlace.population2020.toLocaleString("en-US") : undefined} />
                    </div>
                  ) : <Stat label="Census places in radius" value={censusPlaces.length} sub="Incorporated places + Census Designated Places" />}
                  <div className="rounded-lg border border-brand/20 bg-brand-soft/40 p-3 text-xs leading-relaxed text-mute"><strong className="text-ink">Method:</strong> {census.method}</div>
                </>
              ) : (
                <Stat label={populationMode ? "Major-city population estimate" : "Major cities in radius"} value={populationMode ? `≈ ${(fallback.reduce((s, c) => s + c.pop, 0) * 1000).toLocaleString("en-US")}` : fallback.length} sub={`Worldwide fallback using ${MAJOR_CITIES.length} curated major cities`} />
              )}

              <div className="flex items-center justify-between gap-2"><span className="label !mb-0">Results</span><button type="button" className="btn btn-ghost btn-sm" onClick={exportCsv} disabled={usingCensus ? !censusPlaces.length : !fallback.length}>Download CSV</button></div>
              <div className="max-h-[420px] overflow-y-auto rounded-lg border border-line">
                <table className="tbl">
                  <thead><tr><th>Place</th><th className="text-right">Distance</th><th className="text-right">Population</th></tr></thead>
                  <tbody>
                    {usingCensus ? censusPlaces.map((p) => <tr key={p.geoid}><td><div className="font-semibold">{p.name}</div><div className="text-xs text-mute">FIPS {p.geoid}</div></td><td className="text-right">{fmt(p.distanceKm, 1)} km</td><td className="text-right">{p.population2020.toLocaleString("en-US")}</td></tr>) : fallback.map((c) => <tr key={`${c.name}-${c.country}`}><td><div className="font-semibold">{c.name}</div><div className="text-xs text-mute">{c.country} · {compassPoint(c.bearing)}</div></td><td className="text-right">{fmt(c.distKm, 1)} km</td><td className="text-right">{(c.pop * 1000).toLocaleString("en-US")}</td></tr>)}
                    {(usingCensus ? censusPlaces.length : fallback.length) === 0 && <tr><td colSpan={3} className="py-5 text-center text-mute">No matching places inside this radius. Increase the radius or lower the population filter.</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        <div className="order-1 lg:order-2"><DynamicMap center={center ?? { lat: 39.5, lng: -98.35 }} zoom={center ? 6 : 3} className="tall" onReady={(map, lib) => {
          mapRef.current = map; libRef.current = lib;
          map.addSource("cr-ring", { type: "geojson", data: { type: "FeatureCollection", features: [] } });
          map.addSource("cr-cities", { type: "geojson", data: { type: "FeatureCollection", features: [] } });
          map.addLayer({ id: "cr-ring-f", type: "fill", source: "cr-ring", paint: { "fill-color": "#d95d32", "fill-opacity": 0.07 } });
          map.addLayer({ id: "cr-ring-l", type: "line", source: "cr-ring", paint: { "line-color": "#d95d32", "line-width": 2 } });
          map.addLayer({ id: "cr-city-dots", type: "circle", source: "cr-cities", paint: { "circle-color": "#1d6e63", "circle-radius": ["interpolate", ["linear"], ["get", "pop"], 0, 3, 100000, 7, 1000000, 12], "circle-stroke-color": "#fff", "circle-stroke-width": 1.3 } });
          map.addLayer({ id: "cr-city-labels", type: "symbol", source: "cr-cities", layout: { "text-field": ["get", "name"], "text-size": 10, "text-offset": [0, 1.25], "text-font": ["Noto Sans Regular"] }, paint: { "text-color": "#1c2126", "text-halo-color": "#fff", "text-halo-width": 1.4 } });
          map.on("click", (e: any) => setCenter({ lat: e.lngLat.lat, lng: e.lngLat.lng }));
        }} /></div>
      </div>

      <div className="card p-5 sm:p-6">
        <h2 className="font-display text-xl font-bold">What changes in U.S. Census mode</h2>
        <p className="mt-3 leading-7 text-mute">Inside the United States, MapBench no longer relies only on a short list of major cities. It queries Census Bureau place geography for incorporated places and Census Designated Places, including smaller communities that a global major-city dataset misses. The population view separately uses 2020 ZIP Code Tabulation Area population totals whose Census centroids fall inside the radius, which captures suburban and rural population much better than summing city populations alone.</p>
        <p className="mt-3 leading-7 text-mute">This is still an approximation: a ZCTA can cross the radius boundary, and centroid inclusion does not split population proportionally along the circle. The method is transparent and reproducible, but it is not an official custom Census tabulation. For exact policy, funding or regulatory work, use the Census Bureau&apos;s official tables or a GIS workflow that clips small-area population data to the requested boundary.</p>
      </div>
    </div>
  );
}
