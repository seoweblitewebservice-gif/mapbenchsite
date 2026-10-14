"use client";
import { useEffect, useRef, useState } from "react";
import type { Map as MLMap, GeoJSONSource } from "maplibre-gl";
import { bearingBetween, compassPoint, destination, distanceKm, fmt, toKm, type UnitKey } from "@/lib/geo";
import { downloadText, toCsv } from "@/lib/formats";
import { readUrlParams, syncUrl, Field, Stat, Spinner, ErrorBox } from "@/components/ui";
import { DynamicMap, pinElement, PlaceField, type PlaceValue } from "./shared";

const PRESETS = [5, 10, 15, 25, 50, 100];

type ZipHit = {
  zip: string;
  name: string;
  state?: string;
  country?: string;
  lat: number;
  lng: number;
  distKm: number;
  bearing: number;
  population?: number;
  housingUnits?: number;
  source: "Census ZCTA" | "OpenStreetMap postcode";
};

type CensusRadiusPayload = {
  ok: true;
  zctas: Array<{
    zcta: string;
    lat: number;
    lng: number;
    distanceKm: number;
    population2020: number;
    housingUnits2020: number;
  }>;
  method: string;
  sources: string[];
};

export default function ZipRadiusTool() {
  const [unit, setUnit] = useState<UnitKey>("mi");
  const [radius, setRadius] = useState(10);
  const [center, setCenter] = useState<PlaceValue | null>(() => {
    const p = readUrlParams();
    const lat = parseFloat(p.get("lat") ?? ""), lng = parseFloat(p.get("lng") ?? "");
    return Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : null;
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hits, setHits] = useState<ZipHit[]>([]);
  const [mode, setMode] = useState<"census" | "osm" | null>(null);
  const [method, setMethod] = useState<string | null>(null);
  const mapRef = useRef<MLMap | null>(null);
  const libRef = useRef<any>(null);
  const markerRef = useRef<any>(null);

  const radiusKm = toKm(radius, unit);

  useEffect(() => {
    syncUrl({ lat: center?.lat.toFixed(5) ?? null, lng: center?.lng.toFixed(5) ?? null, r: String(radius), u: unit });
  }, [center, radius, unit]);

  const searchOsm = async (): Promise<ZipHit[]> => {
    if (!center) return [];
    const degLat = radiusKm / 111;
    const cosLat = Math.cos((center.lat * Math.PI) / 180);
    const degLng = radiusKm / (111 * (Math.abs(cosLat) > 0.05 ? Math.abs(cosLat) : 0.05));
    const viewbox = `${center.lng - degLng},${center.lat + degLat},${center.lng + degLng},${center.lat - degLat}`;
    const url = `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=80&postalcode=1&viewbox=${encodeURIComponent(viewbox)}&bounded=1&email=contact@mapbench.site`;
    const res = await fetch(url, { headers: { Accept: "application/json" } });
    if (!res.ok) throw new Error(`Postcode lookup failed (${res.status}).`);
    const rows: any[] = await res.json();
    const seen = new Set<string>();
    const list: ZipHit[] = [];
    for (const r of rows) {
      const zip = r.address?.postcode || r.display_name?.match(/\b([A-Z0-9][A-Z0-9 -]{2,9})\b/i)?.[1]?.trim() || "";
      if (!zip || seen.has(zip)) continue;
      const lat = parseFloat(r.lat), lng = parseFloat(r.lon);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue;
      const dist = distanceKm(center, { lat, lng });
      if (dist > radiusKm) continue;
      seen.add(zip);
      list.push({
        zip,
        name: r.address?.city || r.address?.town || r.address?.village || r.address?.county || r.display_name?.split(",")[0] || "—",
        state: r.address?.state,
        country: r.address?.country_code?.toUpperCase(),
        lat,
        lng,
        distKm: dist,
        bearing: bearingBetween(center, { lat, lng }),
        source: "OpenStreetMap postcode",
      });
    }
    return list.sort((a, b) => a.distKm - b.distKm);
  };

  const search = async () => {
    if (!center) {
      setError("Set a centre point first — search a place, use GPS, or click the map.");
      return;
    }
    setBusy(true);
    setError(null);
    setHits([]);
    setMode(null);
    setMethod(null);
    try {
      let censusWorked = false;
      if (radiusKm <= 1000) {
        try {
          const res = await fetch(`/api/us-radius-census?lat=${encodeURIComponent(center.lat)}&lng=${encodeURIComponent(center.lng)}&radiusKm=${encodeURIComponent(radiusKm)}`);
          const json = await res.json() as CensusRadiusPayload | { ok?: false; message?: string };
          if (res.ok && json.ok && Array.isArray(json.zctas) && json.zctas.length > 0) {
            const list = json.zctas.map<ZipHit>((z) => ({
              zip: z.zcta,
              name: `Census ZCTA ${z.zcta}`,
              country: "US",
              lat: z.lat,
              lng: z.lng,
              distKm: z.distanceKm,
              bearing: bearingBetween(center, { lat: z.lat, lng: z.lng }),
              population: z.population2020,
              housingUnits: z.housingUnits2020,
              source: "Census ZCTA",
            })).sort((a, b) => a.distKm - b.distKm);
            setHits(list);
            setMode("census");
            setMethod(json.method);
            censusWorked = true;
          }
        } catch {
          censusWorked = false;
        }
      }

      if (!censusWorked) {
        const list = await searchOsm();
        setHits(list);
        setMode("osm");
        setMethod("Worldwide fallback uses OpenStreetMap postcode-tagged search results inside a geographic bounding box and then filters each result by great-circle distance from the selected centre.");
        if (!list.length) setError("No postal codes were found in this radius. Try a larger radius or another centre. Outside the U.S., coverage depends on OpenStreetMap postcode data.");
      }
    } catch (e: any) {
      setError(e?.message || "Could not look up ZIP / postal codes. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    const map = mapRef.current, lib = libRef.current;
    if (!map || !lib) return;
    if (center) {
      if (!markerRef.current) markerRef.current = new lib.Marker({ element: pinElement("#d95d32") }).setLngLat([center.lng, center.lat]).addTo(map);
      else markerRef.current.setLngLat([center.lng, center.lat]);
    }
    const coords: [number, number][] = [];
    if (center) for (let i = 0; i <= 128; i++) {
      const p = destination(center, (i / 128) * 360, radiusKm);
      coords.push([p.lng, p.lat]);
    }
    (map.getSource("zr-ring") as GeoJSONSource | undefined)?.setData(center ? { type: "Feature", properties: {}, geometry: { type: "Polygon", coordinates: [coords] } } : { type: "FeatureCollection", features: [] });
    (map.getSource("zr-zips") as GeoJSONSource | undefined)?.setData({
      type: "FeatureCollection",
      features: hits.map((h) => ({ type: "Feature", properties: { zip: h.zip, name: h.name, pop: h.population ?? 0 }, geometry: { type: "Point", coordinates: [h.lng, h.lat] } })),
    });
    if (center) map.flyTo({ center: [center.lng, center.lat], zoom: Math.max(5, Math.min(12, 10 - Math.log2(Math.max(radiusKm, 1) / 10))), essential: true });
  }, [center, radiusKm, hits]);

  const exportCsv = () => {
    downloadText(
      mode === "census" ? "mapbench-zctas-in-radius.csv" : "mapbench-postcodes-in-radius.csv",
      toCsv(
        ["zip_or_zcta", "place", "state", "country", "distance_km", "bearing_deg", "population_2020", "housing_units_2020", "latitude", "longitude", "source"],
        hits.map((h) => [h.zip, h.name, h.state || "", h.country || "", h.distKm.toFixed(2), h.bearing.toFixed(1), h.population ?? "", h.housingUnits ?? "", h.lat, h.lng, h.source]),
      ),
      "text/csv",
    );
  };

  const population = hits.reduce((sum, h) => sum + (h.population ?? 0), 0);
  const housing = hits.reduce((sum, h) => sum + (h.housingUnits ?? 0), 0);

  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-[410px,1fr]">
        <div className="card order-2 space-y-4 p-4 lg:order-1">
          <PlaceField label="Centre point" value={center} onChange={setCenter} placeholder="City, address, ZIP, coordinates or GPS…" />
          <p className="text-xs leading-relaxed text-mute">For U.S. centres, MapBench first tries Census ZIP Code Tabulation Areas (ZCTAs). Elsewhere it falls back to OpenStreetMap postcode data.</p>

          <div className="flex items-center gap-2">
            <button type="button" className={`btn btn-sm flex-1 ${unit === "mi" ? "btn-primary" : "btn-ghost"}`} onClick={() => setUnit("mi")}>Miles</button>
            <button type="button" className={`btn btn-sm flex-1 ${unit === "km" ? "btn-primary" : "btn-ghost"}`} onClick={() => setUnit("km")}>Kilometres</button>
          </div>

          <Field label={`Radius (${unit})`}><input type="number" min={1} max={unit === "km" ? 1000 : 621} step="any" className="input" value={radius} onChange={(e) => setRadius(Math.max(1, parseFloat(e.target.value) || 1))} /></Field>
          <div className="flex flex-wrap gap-1.5">{PRESETS.map((p) => <button key={p} type="button" className={`btn btn-sm ${Math.abs(radius - p) < 0.05 ? "btn-primary" : "btn-ghost"}`} onClick={() => setRadius(p)}>{p}</button>)}</div>

          <button type="button" className="btn btn-primary w-full" onClick={search} disabled={busy || !center}>{busy ? <Spinner label="Finding ZIP areas…" /> : "Find ZIP / postal areas"}</button>
          {error && <ErrorBox>{error}</ErrorBox>}

          {hits.length > 0 && (
            <div className="space-y-3 border-t border-line pt-3">
              <div className="flex flex-wrap gap-2"><span className="chip chip-brand">{mode === "census" ? "U.S. Census ZCTA mode" : "Worldwide postcode fallback"}</span>{mode === "census" && <span className="chip">2020 Decennial population</span>}</div>
              <div className="grid grid-cols-2 gap-2">
                <Stat label={mode === "census" ? "ZCTA centroids in radius" : "Postal codes in radius"} value={hits.length} sub={`within ${radius} ${unit}`} />
                {mode === "census" ? <Stat label="Population represented" value={population.toLocaleString("en-US")} sub="2020 POP100 sum" /> : <Stat label="Data source" value="OSM" sub="postcode-tagged results" />}
                {mode === "census" && <Stat label="Housing units" value={housing.toLocaleString("en-US")} sub="2020 HU100 sum" />}
                {mode === "census" && <Stat label="Largest ZCTA" value={hits.slice().sort((a, b) => (b.population ?? 0) - (a.population ?? 0))[0]?.zip ?? "—"} sub={hits.length ? `${Math.max(...hits.map((h) => h.population ?? 0)).toLocaleString("en-US")} people` : undefined} />}
              </div>
              {method && <div className="rounded-lg border border-brand/20 bg-brand-soft/40 p-3 text-xs leading-relaxed text-mute"><strong className="text-ink">Method:</strong> {method}</div>}
              {mode === "census" && <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs leading-relaxed text-amber-950"><strong>ZCTA is not the same as a USPS delivery ZIP boundary.</strong> Census ZCTAs are statistical areas. Inclusion here uses the Census internal point/centroid inside the radius, so a ZCTA can partly extend outside the circle.</div>}
              <div className="flex items-center justify-between"><span className="label !mb-0">Results</span><button type="button" className="btn btn-ghost btn-sm" onClick={exportCsv}>Download CSV</button></div>
              <div className="max-h-[430px] overflow-y-auto rounded-lg border border-line">
                <table className="tbl">
                  <thead><tr><th>{mode === "census" ? "ZCTA" : "ZIP / Postcode"}</th><th className="text-right">Distance</th>{mode === "census" && <th className="text-right">Population</th>}</tr></thead>
                  <tbody>{hits.map((h) => <tr key={`${h.zip}-${h.lat}`}><td><div className="font-semibold">{h.zip}</div><div className="text-xs text-mute">{mode === "census" ? "Census statistical area" : `${h.name}${h.state ? `, ${h.state}` : ""}${h.country ? ` · ${h.country}` : ""}`} · {compassPoint(h.bearing)}</div></td><td className="whitespace-nowrap text-right">{fmt(h.distKm, 1)} km</td>{mode === "census" && <td className="text-right">{(h.population ?? 0).toLocaleString("en-US")}</td>}</tr>)}</tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        <div className="order-1 lg:order-2">
          <DynamicMap center={center ?? { lat: 39.5, lng: -98.3 }} zoom={center ? 8 : 3.5} className="tall" onReady={(map, lib) => {
            mapRef.current = map; libRef.current = lib;
            map.addSource("zr-ring", { type: "geojson", data: { type: "FeatureCollection", features: [] } });
            map.addSource("zr-zips", { type: "geojson", data: { type: "FeatureCollection", features: [] } });
            map.addLayer({ id: "zr-ring-f", type: "fill", source: "zr-ring", paint: { "fill-color": "#d95d32", "fill-opacity": 0.08 } });
            map.addLayer({ id: "zr-ring-l", type: "line", source: "zr-ring", paint: { "line-color": "#d95d32", "line-width": 2 } });
            map.addLayer({ id: "zr-dots", type: "circle", source: "zr-zips", paint: { "circle-color": "#1d6e63", "circle-radius": ["interpolate", ["linear"], ["get", "pop"], 0, 5, 100000, 8], "circle-stroke-color": "#fff", "circle-stroke-width": 1.5 } });
            map.addLayer({ id: "zr-labels", type: "symbol", source: "zr-zips", layout: { "text-field": ["get", "zip"], "text-size": 11, "text-offset": [0, 1.2], "text-font": ["Noto Sans Regular"] }, paint: { "text-color": "#1c2126", "text-halo-color": "#fff", "text-halo-width": 1.5 } });
            map.on("click", (e: any) => setCenter({ lat: e.lngLat.lat, lng: e.lngLat.lng }));
          }} />
        </div>
      </div>

      <div className="card p-5 sm:p-6">
        <h2 className="font-display text-xl font-bold">How ZIP-radius results should be interpreted</h2>
        <p className="mt-3 leading-7 text-mute">Inside the United States, MapBench uses Census ZIP Code Tabulation Areas so the results have a reproducible statistical geography and 2020 population/housing context. A ZCTA is designed for Census tabulation and should not be presented as an official USPS delivery polygon. This distinction matters for direct mail, territory planning, local SEO research and demographic analysis.</p>
        <p className="mt-3 leading-7 text-mute">The radius test uses each ZCTA&apos;s Census reference point inside the circle rather than clipping every polygon to the radius. That keeps the calculation fast and transparent, but it means a returned ZCTA can extend beyond the circle and a nearby ZCTA can be omitted if its reference point falls outside. For formal population estimates within a custom circle, use small-area Census data and GIS areal interpolation rather than treating this list as an exact count.</p>
      </div>
    </div>
  );
}