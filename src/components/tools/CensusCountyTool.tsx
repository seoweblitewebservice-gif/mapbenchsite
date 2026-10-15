"use client";

import { useEffect, useRef, useState } from "react";
import type { GeoJSONSource, Map as MLMap } from "maplibre-gl";
import { CopyBtn, ErrorBox, Spinner, Stat } from "@/components/ui";
import { DynamicMap, PlaceField, pinElement, type PlaceValue } from "./shared";

interface CensusContext {
  ok: true;
  geography: {
    geoid: string;
    stateFips: string;
    countyFips: string;
    countyName: string;
    fullName: string;
    centroid: { lat: number | null; lng: number | null };
    landAreaSqMi: number | null;
    waterAreaSqMi: number | null;
  };
  demographics: {
    population: number | null;
    medianHouseholdIncome: number | null;
    medianAge: number | null;
    povertyRate: number | null;
    bachelorsOrHigherRate: number | null;
    medianHomeValue: number | null;
    populationDensityPerSqMi: number | null;
  };
  geometry: GeoJSON.Geometry | null;
  sources: { boundary: string; demographics: string };
}

const money = (value: number | null) => value == null ? "—" : new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value);
const number = (value: number | null, digits = 0) => value == null ? "—" : value.toLocaleString("en-US", { maximumFractionDigits: digits });

export default function CensusCountyTool() {
  const [place, setPlace] = useState<PlaceValue | null>(null);
  const [data, setData] = useState<CensusContext | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mapRef = useRef<MLMap | null>(null);
  const libRef = useRef<any>(null);
  const markerRef = useRef<any>(null);

  const lookup = async (p: PlaceValue) => {
    setPlace(p);
    setBusy(true);
    setError(null);
    setData(null);
    try {
      const res = await fetch(`/api/us-census-context?lat=${encodeURIComponent(p.lat)}&lng=${encodeURIComponent(p.lng)}`);
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.message || "County lookup failed.");
      setData(json);
    } catch (e: any) {
      setError(e?.message || "U.S. Census county data is temporarily unavailable.");
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    const map = mapRef.current;
    const lib = libRef.current;
    if (!map || !lib || !place) return;
    // Guard against invalid coordinates crashing the map renderer
    if (!Number.isFinite(place.lat) || !Number.isFinite(place.lng)) return;
    if (!markerRef.current) markerRef.current = new lib.Marker({ element: pinElement("#d95d32", "P") }).addTo(map);
    markerRef.current.setLngLat([place.lng, place.lat]);
    map.flyTo({ center: [place.lng, place.lat], zoom: 7.5, essential: true });
  }, [place]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const source = map.getSource("county-boundary") as GeoJSONSource | undefined;
    source?.setData(data?.geometry ? { type: "Feature", properties: {}, geometry: data.geometry } : { type: "FeatureCollection", features: [] });
    if (data?.geometry) {
      const coords: number[][] = [];
      const collect = (node: any) => {
        if (Array.isArray(node) && typeof node[0] === "number" && typeof node[1] === "number") coords.push(node as number[]);
        else if (Array.isArray(node)) node.forEach(collect);
      };
      collect((data.geometry as any).coordinates);
      if (coords.length) {
        const west = Math.min(...coords.map((c) => c[0])), east = Math.max(...coords.map((c) => c[0]));
        const south = Math.min(...coords.map((c) => c[1])), north = Math.max(...coords.map((c) => c[1]));
        map.fitBounds([[west, south], [east, north]], { padding: 55, maxZoom: 10, duration: 700 });
      }
    }
  }, [data]);

  const copy = data ? [
    `County: ${data.geography.fullName}`,
    `FIPS: ${data.geography.geoid}`,
    `Population: ${number(data.demographics.population)}`,
    `Median household income: ${money(data.demographics.medianHouseholdIncome)}`,
    `Median age: ${number(data.demographics.medianAge, 1)}`,
    `Poverty rate: ${data.demographics.povertyRate == null ? "—" : `${data.demographics.povertyRate.toFixed(1)}%`}`,
    `Bachelor's degree or higher: ${data.demographics.bachelorsOrHigherRate == null ? "—" : `${data.demographics.bachelorsOrHigherRate.toFixed(1)}%`}`,
  ].join("\n") : "";

  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-[400px,1fr]">
        <div className="card order-2 space-y-4 p-4 lg:order-1">
          <PlaceField label="U.S. location" value={place} onChange={(p) => { if (p) lookup(p); else { setPlace(null); setData(null); } }} placeholder="Search an address, city, ZIP or use your location…" ipFirst />
          <p className="text-xs leading-relaxed text-mute">For U.S. points, this uses the Census Bureau county boundary rather than relying only on an address label. Search, use GPS, paste coordinates, or click the map.</p>
          {busy && <Spinner label="Checking Census geography…" />}
          {error && <ErrorBox>{error}</ErrorBox>}

          {data && (
            <div className="space-y-4 border-t border-line pt-4">
              <div className="rounded-xl border border-brand/30 bg-brand-soft p-4">
                <div className="text-[10px] font-extrabold uppercase tracking-wider text-brand-strong">Official county match</div>
                <div className="mt-1 font-display text-2xl font-bold">{data.geography.fullName}</div>
                <div className="mt-2 flex flex-wrap gap-2 text-xs text-mute"><span>FIPS {data.geography.geoid}</span><span>•</span><span>State {data.geography.stateFips}</span><span>•</span><span>County {data.geography.countyFips}</span></div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Stat label="Population" value={number(data.demographics.population)} />
                <Stat label="Density" value={data.demographics.populationDensityPerSqMi == null ? "—" : `${number(data.demographics.populationDensityPerSqMi, 1)}/mi²`} />
                <Stat label="Median income" value={money(data.demographics.medianHouseholdIncome)} />
                <Stat label="Median home value" value={money(data.demographics.medianHomeValue)} />
                <Stat label="Median age" value={number(data.demographics.medianAge, 1)} />
                <Stat label="Poverty rate" value={data.demographics.povertyRate == null ? "—" : `${data.demographics.povertyRate.toFixed(1)}%`} />
                <Stat label="Bachelor's+" value={data.demographics.bachelorsOrHigherRate == null ? "—" : `${data.demographics.bachelorsOrHigherRate.toFixed(1)}%`} />
                <Stat label="Land area" value={data.geography.landAreaSqMi == null ? "—" : `${number(data.geography.landAreaSqMi, 1)} mi²`} />
              </div>
              <CopyBtn text={copy} label="Copy county summary" />
              <div className="rounded-lg border border-line bg-well/40 p-3 text-xs leading-relaxed text-mute">
                <strong className="text-ink">Sources:</strong> {data.sources.boundary}. Demographics are {data.sources.demographics}. ACS values are estimates and can have margins of error; use official Census tables for formal decisions.
              </div>
            </div>
          )}
        </div>

        <div className="order-1 lg:order-2">
          <DynamicMap center={place ?? { lat: 39.5, lng: -98.35 }} zoom={place ? 7 : 3.3} className="tall" onReady={(map, lib) => {
            mapRef.current = map; libRef.current = lib;
            map.addSource("county-boundary", { type: "geojson", data: { type: "FeatureCollection", features: [] } });
            map.addLayer({ id: "county-fill", type: "fill", source: "county-boundary", paint: { "fill-color": "#1d6e63", "fill-opacity": 0.12 } });
            map.addLayer({ id: "county-line", type: "line", source: "county-boundary", paint: { "line-color": "#1d6e63", "line-width": 3 } });
            map.on("click", (e: any) => lookup({ lat: e.lngLat.lat, lng: e.lngLat.lng }));
          }} />
        </div>
      </div>

      <div className="card p-5 sm:p-6">
        <h2 className="font-display text-xl font-bold">Why this is stronger than a simple reverse-geocoder</h2>
        <p className="mt-3 leading-7 text-mute">An address service can return a county name from labels attached to a road or place. This tool also performs a point-in-polygon lookup against the U.S. Census Bureau county layer, returns the five-digit county FIPS code, draws the county boundary, and joins the result to recent ACS demographic estimates. That makes it useful for property research, territory planning, public-record searches, local-market analysis and checking locations close to county borders.</p>
        <p className="mt-3 leading-7 text-mute">The boundary is geographic context, not a legal survey. Population, income, age, home value, education and poverty values are ACS estimates rather than live counts. For a mailing ZIP question, use <a className="font-semibold text-brand-strong hover:underline" href="/tools/what-zip-code-am-i-in">What ZIP Code Am I In?</a>; for a broader state check use <a className="font-semibold text-brand-strong hover:underline" href="/tools/what-state-am-i-in">What State Am I In?</a>.</p>
      </div>
    </div>
  );
}
