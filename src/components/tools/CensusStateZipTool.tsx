"use client";

import { useEffect, useRef, useState } from "react";
import type { GeoJSONSource, Map as MLMap } from "maplibre-gl";
import { CopyBtn, ErrorBox, Spinner, Stat } from "@/components/ui";
import { nominatimReverse, addressBreakdown } from "@/lib/geocode";
import { DynamicMap, PlaceField, pinElement, type PlaceValue } from "./shared";

type Focus = "state" | "postcode";

type StateContext = {
  ok: true;
  geography: {
    geoid: string;
    stateFips: string;
    stateName: string;
    abbreviation: string;
    centroid: { lat: number | null; lng: number | null };
    landAreaSqMi: number | null;
    waterAreaSqMi: number | null;
  };
  demographics: Demographics;
  geometry: GeoJSON.Geometry | null;
  sources: Sources;
};

type ZipContext = {
  ok: true;
  geography: {
    zcta: string;
    name: string;
    centroid: { lat: number | null; lng: number | null };
    landAreaSqMi: number | null;
    waterAreaSqMi: number | null;
  };
  demographics: Demographics;
  geometry: GeoJSON.Geometry | null;
  sources: Sources;
};

type Demographics = {
  population: number | null;
  medianHouseholdIncome: number | null;
  medianAge: number | null;
  povertyRate: number | null;
  bachelorsOrHigherRate: number | null;
  medianHomeValue: number | null;
  housingUnits?: number | null;
  populationDensityPerSqMi: number | null;
};

type Sources = { boundary: string; demographics: string };

const money = (value: number | null) => value == null ? "—" : new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value);
const number = (value: number | null | undefined, digits = 0) => value == null ? "—" : value.toLocaleString("en-US", { maximumFractionDigits: digits });

export default function CensusStateZipTool({ focus }: { focus: Focus }) {
  const isZip = focus === "postcode";
  const [place, setPlace] = useState<PlaceValue | null>(null);
  const [stateData, setStateData] = useState<StateContext | null>(null);
  const [zipData, setZipData] = useState<ZipContext | null>(null);
  const [mailingPostcode, setMailingPostcode] = useState<string>("");
  const [addressLabel, setAddressLabel] = useState<string>("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mapRef = useRef<MLMap | null>(null);
  const libRef = useRef<any>(null);
  const markerRef = useRef<any>(null);

  const data = isZip ? zipData : stateData;

  const lookup = async (p: PlaceValue) => {
    setPlace(p);
    setBusy(true);
    setError(null);
    setStateData(null);
    setZipData(null);
    setMailingPostcode("");
    setAddressLabel("");
    try {
      const endpoint = isZip ? "/api/us-zcta-context" : "/api/us-state-context";
      const [censusRes, reverse] = await Promise.all([
        fetch(`${endpoint}?lat=${encodeURIComponent(p.lat)}&lng=${encodeURIComponent(p.lng)}`),
        nominatimReverse(p.lat, p.lng, 16),
      ]);
      const censusJson = await censusRes.json();
      if (!censusRes.ok || !censusJson.ok) throw new Error(censusJson.message || `${isZip ? "ZIP" : "State"} lookup failed.`);
      if (isZip) setZipData(censusJson as ZipContext);
      else setStateData(censusJson as StateContext);
      if (reverse.ok) {
        const parsed = addressBreakdown(reverse.result.address);
        setMailingPostcode(parsed.postcode || "");
        setAddressLabel(reverse.result.displayName || "");
      }
    } catch (e: any) {
      setError(e?.message || `U.S. Census ${isZip ? "ZIP" : "state"} data is temporarily unavailable.`);
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    const map = mapRef.current;
    const lib = libRef.current;
    if (!map || !lib || !place) return;
    if (!markerRef.current) markerRef.current = new lib.Marker({ element: pinElement("#d95d32", "P") }).addTo(map);
    markerRef.current.setLngLat([place.lng, place.lat]);
    map.flyTo({ center: [place.lng, place.lat], zoom: isZip ? 11 : 6, essential: true });
  }, [place, isZip]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const source = map.getSource("census-boundary") as GeoJSONSource | undefined;
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
        map.fitBounds([[west, south], [east, north]], { padding: 55, maxZoom: isZip ? 12 : 7, duration: 700 });
      }
    }
  }, [data, isZip]);

  const demographics = data?.demographics;
  const title = isZip
    ? `Census ZCTA ${zipData?.geography.zcta ?? ""}`
    : `${stateData?.geography.stateName ?? ""}${stateData?.geography.abbreviation ? ` (${stateData.geography.abbreviation})` : ""}`;
  const codeLabel = isZip ? "Census ZCTA" : "State FIPS";
  const codeValue = isZip ? zipData?.geography.zcta : stateData?.geography.stateFips;
  const landArea = isZip ? zipData?.geography.landAreaSqMi : stateData?.geography.landAreaSqMi;
  const source = data?.sources;
  const zipDiffers = isZip && mailingPostcode && zipData?.geography.zcta && mailingPostcode !== zipData.geography.zcta;

  const copy = data ? [
    isZip ? `Census ZCTA: ${zipData?.geography.zcta}` : `State: ${stateData?.geography.stateName}`,
    !isZip && stateData?.geography.abbreviation ? `Abbreviation: ${stateData.geography.abbreviation}` : "",
    isZip && mailingPostcode ? `Mailing postcode from address data: ${mailingPostcode}` : "",
    `Population: ${number(demographics?.population)}`,
    `Median household income: ${money(demographics?.medianHouseholdIncome ?? null)}`,
    `Median age: ${number(demographics?.medianAge, 1)}`,
    `Poverty rate: ${demographics?.povertyRate == null ? "—" : `${demographics.povertyRate.toFixed(1)}%`}`,
    `Bachelor's degree or higher: ${demographics?.bachelorsOrHigherRate == null ? "—" : `${demographics.bachelorsOrHigherRate.toFixed(1)}%`}`,
  ].filter(Boolean).join("\n") : "";

  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-[400px,1fr]">
        <div className="card order-2 space-y-4 p-4 lg:order-1">
          <PlaceField
            label={isZip ? "U.S. location or address" : "U.S. location"}
            value={place}
            onChange={(p) => { if (p) lookup(p); else { setPlace(null); setStateData(null); setZipData(null); } }}
            placeholder={isZip ? "Search an address, ZIP, city or use your location…" : "Search an address, city, state or use your location…"}
          />
          <p className="text-xs leading-relaxed text-mute">{isZip
            ? "MapBench checks the selected point against the Census ZCTA polygon and separately reads the address postcode when available. ZIP Codes and Census ZCTAs are related but not identical concepts."
            : "For U.S. points, MapBench checks the selected point against the Census Bureau state polygon, then joins the state FIPS code to recent ACS demographic estimates."}</p>
          {busy && <Spinner label={`Checking Census ${isZip ? "ZIP geography" : "state geography"}…`} />}
          {error && <ErrorBox>{error}</ErrorBox>}

          {data && demographics && (
            <div className="space-y-4 border-t border-line pt-4">
              <div className="rounded-xl border border-brand/30 bg-brand-soft p-4">
                <div className="text-[10px] font-extrabold uppercase tracking-wider text-brand-strong">{isZip ? "Census geography match" : "Official state match"}</div>
                <div className="mt-1 font-display text-2xl font-bold">{title}</div>
                <div className="mt-2 flex flex-wrap gap-2 text-xs text-mute"><span>{codeLabel} {codeValue}</span>{addressLabel && <><span>•</span><span className="truncate">{addressLabel}</span></>}</div>
              </div>

              {isZip && (
                <div className={`rounded-xl border p-3 text-sm ${zipDiffers ? "border-amber-300 bg-amber-50 text-amber-950" : "border-line bg-well/40 text-mute"}`}>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <div><div className="text-[10px] font-bold uppercase tracking-wide opacity-70">Mailing postcode label</div><div className="font-display text-xl font-bold">{mailingPostcode || "Not available"}</div></div>
                    <div><div className="text-[10px] font-bold uppercase tracking-wide opacity-70">Census ZCTA</div><div className="font-display text-xl font-bold">{zipData?.geography.zcta}</div></div>
                  </div>
                  <p className="mt-2 text-xs leading-relaxed">{zipDiffers
                    ? "These values differ at this point. That can be legitimate because USPS ZIP Codes are mail-delivery constructs while ZCTAs are Census statistical areas built to approximate ZIP geography."
                    : "When the values match, remember they still come from different systems: the postcode is an address label, while the ZCTA is a Census statistical polygon."}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2">
                <Stat label="Population" value={number(demographics.population)} />
                <Stat label="Density" value={demographics.populationDensityPerSqMi == null ? "—" : `${number(demographics.populationDensityPerSqMi, 1)}/mi²`} />
                <Stat label="Median income" value={money(demographics.medianHouseholdIncome)} />
                <Stat label="Median home value" value={money(demographics.medianHomeValue)} />
                <Stat label="Median age" value={number(demographics.medianAge, 1)} />
                <Stat label="Poverty rate" value={demographics.povertyRate == null ? "—" : `${demographics.povertyRate.toFixed(1)}%`} />
                <Stat label="Bachelor's+" value={demographics.bachelorsOrHigherRate == null ? "—" : `${demographics.bachelorsOrHigherRate.toFixed(1)}%`} />
                <Stat label="Land area" value={landArea == null ? "—" : `${number(landArea, 1)} mi²`} />
              </div>
              <CopyBtn text={copy} label={`Copy ${isZip ? "ZIP" : "state"} summary`} />
              {source && <div className="rounded-lg border border-line bg-well/40 p-3 text-xs leading-relaxed text-mute"><strong className="text-ink">Sources:</strong> {source.boundary}. Demographics are {source.demographics}. ACS values are estimates and may have margins of error.</div>}
            </div>
          )}
        </div>

        <div className="order-1 lg:order-2">
          <DynamicMap center={place ?? { lat: 39.5, lng: -98.35 }} zoom={place ? (isZip ? 10 : 5) : 3.3} className="tall" onReady={(map, lib) => {
            mapRef.current = map; libRef.current = lib;
            map.addSource("census-boundary", { type: "geojson", data: { type: "FeatureCollection", features: [] } });
            map.addLayer({ id: "census-boundary-fill", type: "fill", source: "census-boundary", paint: { "fill-color": isZip ? "#0e7490" : "#1d6e63", "fill-opacity": 0.12 } });
            map.addLayer({ id: "census-boundary-line", type: "line", source: "census-boundary", paint: { "line-color": isZip ? "#0e7490" : "#1d6e63", "line-width": 3 } });
            map.on("click", (e: any) => lookup({ lat: e.lngLat.lat, lng: e.lngLat.lng }));
          }} />
        </div>
      </div>

      <div className="card p-5 sm:p-6">
        <h2 className="font-display text-xl font-bold">{isZip ? "ZIP Code versus Census ZCTA: why the distinction matters" : "Why this is stronger than reading a state name from an address"}</h2>
        {isZip ? <>
          <p className="mt-3 leading-7 text-mute">USPS ZIP Codes were created for mail delivery, not as a clean nationwide set of legal polygons. Census ZIP Code Tabulation Areas are statistical areas designed to approximate the geographic distribution of ZIP Codes for tabulation. That makes ZCTAs useful for mapping population, income and housing data, but it also means a ZCTA should not be presented as the official delivery boundary for every mailing address.</p>
          <p className="mt-3 leading-7 text-mute">MapBench therefore shows the postcode returned by address data separately from the Census ZCTA containing the selected coordinate. The ZCTA polygon is used for the highlighted boundary and ACS demographic context. For mailing eligibility or an official delivery address, verify with USPS. For demographic and statistical geography, the Census ZCTA is the relevant layer.</p>
        </> : <>
          <p className="mt-3 leading-7 text-mute">A normal reverse-geocoder can return a state label, but this tool also performs a point-in-polygon check against the Census Bureau state layer, returns the state FIPS code, highlights the full state boundary and joins the state to ACS population, income, age, housing, education and poverty estimates.</p>
          <p className="mt-3 leading-7 text-mute">That makes the result more useful for data work, territory planning and location verification while still keeping the limitation clear: Census boundaries are authoritative statistical geography, not a substitute for legal property boundaries or specialist regulatory advice.</p>
        </>}
      </div>
    </div>
  );
}
