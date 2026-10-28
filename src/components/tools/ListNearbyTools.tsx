"use client";
import { useEffect, useRef, useState } from "react";
import type { Map as MLMap, GeoJSONSource } from "maplibre-gl";
import { bearingBetween, compassPoint, distanceKm, fmt, fmtDist, type LatLng } from "@/lib/geo";
import { geolocation } from "@/lib/geocode";
import { ukPostcode } from "@/lib/nationalGrid";
import { ErrorBox, Field, Spinner } from "@/components/ui";
import { DynamicMap, pinElement, PlaceField, type PlaceValue } from "./shared";

/**
 * Dedicated nearby-finder pages added for the user's list. Each mode runs one
 * focused OpenStreetMap (Overpass) query around a centre point — the category
 * is fixed by the page, not picked from a generic list.
 */

type Mode = "school" | "library" | "hospital" | "ev" | "restroom" | "petrol" | "tube" | "peaks" | "trails" | "uk-hospital";

interface CatDef {
  label: string;
  query: (r: number, p: LatLng) => string;
  nameOf: (t: Record<string, string>) => string;
  defaultRadiusMi: number;
  maxRadiusMi: number;
  note?: string;
}

const around = (r: number, p: LatLng) => `around:${r},${p.lat},${p.lng}`;

const CATS: Record<Mode, CatDef> = {
  school: {
    label: "schools",
    query: (r, p) => `[out:json][timeout:60];nwr["amenity"="school"](${around(r, p)});out center 200;`,
    nameOf: (t) => t.name ?? "Unnamed school",
    defaultRadiusMi: 5, maxRadiusMi: 50,
  },
  library: {
    label: "public libraries",
    query: (r, p) => `[out:json][timeout:60];nwr["amenity"="library"](${around(r, p)});out center 200;`,
    nameOf: (t) => t.name ?? "Public library",
    defaultRadiusMi: 10, maxRadiusMi: 50,
  },
  hospital: {
    label: "hospitals",
    query: (r, p) => `[out:json][timeout:60];nwr["amenity"="hospital"](${around(r, p)});out center 200;`,
    nameOf: (t) => t.name ?? "Hospital",
    defaultRadiusMi: 25, maxRadiusMi: 100,
  },
  ev: {
    label: "EV charging stations",
    query: (r, p) => `[out:json][timeout:60];nwr["amenity"="charging_station"](${around(r, p)});out center 200;`,
    nameOf: (t) => t.name ?? t.operator ?? "Charging station",
    defaultRadiusMi: 10, maxRadiusMi: 50,
  },
  restroom: {
    label: "public restrooms",
    query: (r, p) => `[out:json][timeout:60];nwr["amenity"="toilets"](${around(r, p)});out center 200;`,
    nameOf: (t) => t.name ?? "Public restroom",
    defaultRadiusMi: 3, maxRadiusMi: 25,
  },
  petrol: {
    label: "petrol and gas stations",
    query: (r, p) => `[out:json][timeout:60];nwr["amenity"="fuel"](${around(r, p)});out center 200;`,
    nameOf: (t) => t.name ?? t.brand ?? t.operator ?? "Fuel station",
    defaultRadiusMi: 10, maxRadiusMi: 50,
    note: "Station locations come from OpenStreetMap. This tool does not provide fuel prices or live availability; check with the station.",
  },
  tube: {
    label: "Underground-tagged stations and subway entrances",
    query: (r, p) => `[out:json][timeout:60];(node["railway"="station"]["network"~"Underground"](${around(r, p)});node["railway"="subway_entrance"](${around(r, p)}););out 300;`,
    nameOf: (t) => t.name ?? "Station entrance",
    defaultRadiusMi: 2, maxRadiusMi: 15,
  },
  peaks: {
    label: "mountain peaks",
    query: (r, p) => `[out:json][timeout:60];node["natural"="peak"](${around(r, p)});out 200;`,
    nameOf: (t) => `${t.name ?? "Unnamed peak"}${t.ele && Number.isFinite(Number(t.ele)) ? ` — ${fmt(Number(t.ele) * 3.28084, 0)} ft` : ""}`,
    defaultRadiusMi: 50, maxRadiusMi: 100,
  },
  trails: {
    label: "waymarked hiking trails",
    query: (r, p) => `[out:json][timeout:90];relation["route"="hiking"](${around(r, p)});out center 100;`,
    nameOf: (t) => t.name ?? t.ref ?? "Hiking route",
    defaultRadiusMi: 25, maxRadiusMi: 100,
    note: "Trails are waymarked routes recorded in OpenStreetMap. Always check local signs and land access before you walk one.",
  },
  "uk-hospital": {
    label: "hospitals",
    query: (r, p) => `[out:json][timeout:60];nwr["amenity"="hospital"](${around(r, p)});out center 200;`,
    nameOf: (t) => t.name ?? "Hospital",
    defaultRadiusMi: 25, maxRadiusMi: 100,
  },
};

interface Poi { name: string; lat: number; lng: number; distKm: number; bearing: number }

export default function ListNearbyTools({ params }: { params?: Record<string, unknown> }) {
  const mode = ((params?.mode as string) ?? "school") as Mode;
  const cat = CATS[mode];
  const [center, setCenter] = useState<PlaceValue | null>(mode === "tube" ? { lat: 51.5074, lng: -0.1278, label: "Central London" } : null);
  const [radiusMi, setRadiusMi] = useState(cat.defaultRadiusMi);
  const [postcode, setPostcode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pois, setPois] = useState<Poi[] | null>(null);
  const searchId = useRef(0);
  const invalidateResults = () => { searchId.current++; setPois(null); setBusy(false); setError(null); };
  const mapRef = useRef<MLMap | null>(null);
  const libRef = useRef<any>(null);
  const markerRef = useRef<any>(null);

  useEffect(() => {
    const map = mapRef.current, lib = libRef.current;
    if (!map || !lib) return;
    if (center) {
      if (!markerRef.current) markerRef.current = new lib.Marker({ element: pinElement("#1d6e63") }).setLngLat([center.lng, center.lat]).addTo(map);
      else markerRef.current.setLngLat([center.lng, center.lat]);
    }
    (map.getSource("nb") as GeoJSONSource | undefined)?.setData({
      type: "FeatureCollection",
      features: (pois ?? []).map((p) => ({ type: "Feature", properties: { name: p.name }, geometry: { type: "Point", coordinates: [p.lng, p.lat] } })),
    });
  }, [center, pois]);

  const search = async (c: LatLng = center as LatLng) => {
    if (!c) { setError("Pick a location first — search, click the map, or use GPS."); return; }
    const id = ++searchId.current;
    setBusy(true); setError(null); setPois(null);
    try {
      const r = Math.round(Math.min(radiusMi, cat.maxRadiusMi) * 1609.344);
      const res = await fetch("https://overpass-api.de/api/interpreter", {
        method: "POST", body: new URLSearchParams({ data: cat.query(r, c) }),
      });
      if (id !== searchId.current) return;
      if (res.status === 429) { setError("The OpenStreetMap query service is rate-limiting right now. Wait a few seconds and try again."); setBusy(false); return; }
      if (!res.ok) throw new Error();
      const data = await res.json();
      if (id !== searchId.current) return;
      const list: Poi[] = (data.elements ?? [])
        .map((e: any) => {
          const p = { lat: e.lat ?? e.center?.lat, lng: e.lon ?? e.center?.lon };
          return { name: cat.nameOf(e.tags ?? {}), ...p, distKm: distanceKm(c, p), bearing: bearingBetween(c, p) };
        })
        .filter((p: Poi) => Number.isFinite(p.lat) && Number.isFinite(p.lng))
        .sort((a: Poi, b: Poi) => a.distKm - b.distKm)
        .slice(0, 100);
      setPois(list);
    } catch {
      if (id !== searchId.current) return;
      setError("The OpenStreetMap query service is temporarily unavailable. Please try again in a moment.");
    }
    setBusy(false);
  };

  const usePostcode = async () => {
    try {
      const r = await ukPostcode(postcode);
      const p = { lat: r.lat, lng: r.lng, label: r.postcode };
      setCenter(p);
      mapRef.current?.flyTo({ center: [p.lng, p.lat], zoom: 11, essential: true });
      await search(p);
    } catch (e: any) {
      setError(e?.message ?? "That postcode was not found.");
    }
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[400px,1fr]">
      <div className="card order-2 space-y-4 p-4 lg:order-1">
        <PlaceField label="Search from" value={center} onChange={(v) => { setCenter(v); invalidateResults(); if (v) mapRef.current?.flyTo({ center: [v.lng, v.lat], zoom: 12, essential: true }); }} />
        <div className="flex gap-2">
          <button type="button" className="btn btn-ghost btn-sm" onClick={async () => {
            try { const p = await geolocation(); setCenter({ ...p, label: "My location" }); invalidateResults(); mapRef.current?.flyTo({ center: [p.lng, p.lat], zoom: 12, essential: true }); }
            catch (e: any) { setError(e?.message ?? "Geolocation failed."); }
          }}>📍 Use my location</button>
        </div>
        {mode === "uk-hospital" && (
          <Field label="…or start from a UK postcode">
            <div className="flex gap-2">
              <input className="input" value={postcode} onChange={(e) => setPostcode(e.target.value)} placeholder="SW1A 1AA" />
              <button type="button" className="btn btn-ghost whitespace-nowrap" onClick={usePostcode} disabled={busy}>Use postcode</button>
            </div>
          </Field>
        )}
        <Field label={`Search radius: ${radiusMi} miles`}>
          <input type="range" min={1} max={cat.maxRadiusMi} step={1} className="w-full" value={radiusMi} onChange={(e) => { setRadiusMi(Number(e.target.value)); invalidateResults(); }} />
        </Field>
        <button type="button" className="btn btn-primary w-full" onClick={() => center && search()} disabled={busy || !center}>
          {busy ? <Spinner label={`Searching for ${cat.label}…`} /> : `Find ${cat.label}`}
        </button>
        {error && <ErrorBox>{error}</ErrorBox>}
        {(mode === "hospital" || mode === "uk-hospital") && <p className="rounded-lg bg-amber-50 p-3 text-sm font-semibold text-amber-900">For an emergency, contact your local emergency services. This map is not an emergency directory.</p>}
        <p className="text-xs leading-relaxed text-mute">Results are sorted by straight-line distance among returned records, not a guarantee of the nearest facility. Queries can return at most 200 records (300 for subway mode, 100 for trails), and the list shows at most 100. Coverage, access and opening status may be incomplete or outdated; confirm with the operator.</p>
        {cat.note && <p className="text-xs leading-relaxed text-mute">{cat.note}</p>}
        {pois && (
          <div className="border-t border-line pt-3">
            <div className="label">{pois.length} result{pois.length !== 1 ? "s" : ""}, sorted by distance among returned records (OpenStreetMap)</div>
            <ul className="max-h-96 space-y-1 overflow-y-auto">
              {pois.map((p, i) => (
                <li key={i}>
                  <button type="button" className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm hover:bg-well" onClick={() => {
                    const map = mapRef.current, lib = libRef.current;
                    if (!map || !lib) return;
                    new lib.Popup().setLngLat([p.lng, p.lat]).setText(p.name).addTo(map);
                    map.panTo([p.lng, p.lat], { duration: 400 });
                  }}>
                    <span className="flex-1 truncate font-medium">{p.name}</span>
                    <span className="shrink-0 text-xs text-mute">{fmtDist(p.distKm, "mi")} · {compassPoint(p.bearing)}</span>
                  </button>
                </li>
              ))}
              {!pois.length && <li className="px-2 py-3 text-sm text-mute">Nothing mapped within {radiusMi} miles in OpenStreetMap — try a larger radius. Coverage is volunteer-mapped, so a missing result does not prove nothing is there.</li>}
            </ul>
          </div>
        )}
      </div>
      <div className="order-1 lg:order-2">
        <DynamicMap center={center ?? { lat: 30, lng: 10 }} zoom={center ? 11 : 1.8} className="tall" onReady={(map, lib) => {
          mapRef.current = map; libRef.current = lib;
          map.addSource("nb", { type: "geojson", data: { type: "FeatureCollection", features: [] } });
          map.addLayer({ id: "nb-dots", type: "circle", source: "nb", paint: { "circle-color": "#8a4f9e", "circle-radius": 7, "circle-stroke-color": "#fff", "circle-stroke-width": 2 } });
          map.on("click", (e: any) => { setCenter({ lat: e.lngLat.lat, lng: e.lngLat.lng }); invalidateResults(); });
        }} />
      </div>
    </div>
  );
}
