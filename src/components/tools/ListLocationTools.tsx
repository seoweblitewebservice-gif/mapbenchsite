"use client";
import { useEffect, useRef, useState } from "react";
import type { Map as MLMap } from "maplibre-gl";
import { fmtCoords, isValidLat, isValidLng, type LatLng } from "@/lib/geo";
import { geolocation, nominatimReverse } from "@/lib/geocode";
import { CopyBtn, ErrorBox, Field, Spinner, Stat } from "@/components/ui";
import { DynamicMap, pinElement, PlaceField, type PlaceValue } from "./shared";

/**
 * Focused reverse-geocoding pages added for the user's list:
 * municipality / village / district / parish finders, coordinates-to-city /
 * country / state converters, a general coordinate lookup, and a street
 * intersection finder. All use OpenStreetMap data via Nominatim.
 */

type Mode =
  | "municipality" | "village" | "district" | "parish"
  | "coords-city" | "coords-country" | "coords-state" | "coords-lookup"
  | "intersection";

const FOCUS: Record<string, { label: string; zoom: number; pick: (a: Record<string, string>) => string; missing: string }> = {
  municipality: {
    label: "Municipality / fallback settlement", zoom: 14,
    pick: (a) => a.municipality || a.city || a.town || "",
    missing: "No municipality is recorded for this point in OpenStreetMap. The wider area fields below are the closest recorded answer.",
  },
  village: {
    label: "Village / fallback settlement", zoom: 14,
    pick: (a) => a.village || a.town || a.hamlet || "",
    missing: "No village, town or hamlet field was returned. This does not establish which settlement is nearest.",
  },
  district: {
    label: "District / fallback area", zoom: 14,
    pick: (a) => a.city_district || a.district || a.suburb || a.county || "",
    missing: "No district is recorded for this point in OpenStreetMap.",
  },
  parish: {
    label: "Civil parish", zoom: 14,
    pick: (a) => a.parish || "",
    missing: "No civil parish is recorded in OpenStreetMap for this point. Civil parishes exist mainly in England and parts of Wales; many points have none.",
  },
  "coords-city": {
    label: "City / fallback settlement", zoom: 12,
    pick: (a) => a.city || a.town || a.village || a.municipality || "",
    missing: "No city or town is recorded for these coordinates.",
  },
  "coords-country": {
    label: "Country", zoom: 5,
    pick: (a) => (a.country ? `${a.country}${a.country_code ? ` (${a.country_code.toUpperCase()})` : ""}` : ""),
    missing: "No country is recorded for these coordinates (open water has none).",
  },
  "coords-state": {
    label: "State / region", zoom: 8,
    pick: (a) => a.state || a.region || "",
    missing: "No state or region is recorded for these coordinates.",
  },
  "coords-lookup": {
    label: "Location", zoom: 16,
    pick: () => "",
    missing: "",
  },
};

export default function ListLocationTools({ params }: { params?: Record<string, unknown> }) {
  const mode = ((params?.mode as string) ?? "coords-lookup") as Mode;
  if (mode === "intersection") return <IntersectionTool />;
  return <ReverseFocusTool mode={mode} />;
}

function ReverseFocusTool({ mode }: { mode: Exclude<Mode, "intersection"> }) {
  const cfg = FOCUS[mode];
  const [point, setPoint] = useState<LatLng | null>(null);
  const [latIn, setLatIn] = useState("");
  const [lngIn, setLngIn] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [address, setAddress] = useState<Record<string, string> | null>(null);
  const [displayName, setDisplayName] = useState("");
  const lookupId = useRef(0);
  const mapRef = useRef<MLMap | null>(null);
  const libRef = useRef<any>(null);
  const markerRef = useRef<any>(null);

  const lookup = async (p: LatLng) => {
    const id = ++lookupId.current;
    setPoint(p);
    setAddress(null); setDisplayName("");
    setLatIn(p.lat.toFixed(6));
    setLngIn(p.lng.toFixed(6));
    setBusy(true);
    setError(null);
    const r = await nominatimReverse(p.lat, p.lng, cfg.zoom);
    if (id !== lookupId.current) return;
    setBusy(false);
    if (!r.ok) {
      setAddress(null);
      setDisplayName("");
      setError(r.message);
      return;
    }
    setAddress(r.result.address);
    setDisplayName(r.result.displayName);
  };

  useEffect(() => {
    const map = mapRef.current, lib = libRef.current;
    if (!map || !lib || !point) return;
    if (!markerRef.current) markerRef.current = new lib.Marker({ element: pinElement("#d95d32") }).setLngLat([point.lng, point.lat]).addTo(map);
    else markerRef.current.setLngLat([point.lng, point.lat]);
  }, [point]);

  const focusValue = address ? cfg.pick(address) : "";
  const rows: [string, string][] = address
    ? ([
        ["Village", address.village || address.hamlet],
        ["Town", address.town],
        ["City", address.city],
        ["Municipality", address.municipality],
        ["District", address.city_district || address.district],
        ["Suburb / neighbourhood", address.suburb || address.neighbourhood],
        ["Parish", address.parish],
        ["County", address.county || address.state_district],
        ["State / region", address.state || address.region],
        ["Postcode", address.postcode],
        ["Country", address.country ? `${address.country}${address.country_code ? ` (${address.country_code.toUpperCase()})` : ""}` : ""],
        ["Road", address.road ? `${address.house_number ? address.house_number + " " : ""}${address.road}` : ""],
      ] as [string, string][]).filter(([, v]) => v)
    : [];

  return (
    <div className="grid gap-4 lg:grid-cols-[400px,1fr]">
      <div className="card order-2 space-y-4 p-4 lg:order-1">
        <PlaceField label="Search a place" value={point ? { ...point } : null} onChange={(v) => v && lookup(v)} />
        <div className="grid grid-cols-2 gap-2">
          <Field label="Latitude">
            <input className="input" inputMode="decimal" placeholder="51.5074" value={latIn} onChange={(e) => setLatIn(e.target.value)} />
          </Field>
          <Field label="Longitude">
            <input className="input" inputMode="decimal" placeholder="-0.1278" value={lngIn} onChange={(e) => setLngIn(e.target.value)} />
          </Field>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" className="btn btn-primary flex-1" disabled={busy} onClick={() => {
            const lat = Number(latIn), lng = Number(lngIn);
            if (!latIn.trim() || !lngIn.trim() || !isValidLat(lat) || !isValidLng(lng)) { setError("Latitude must be between −90 and 90, longitude between −180 and 180."); return; }
            lookup({ lat, lng });
            mapRef.current?.flyTo({ center: [lng, lat], zoom: 13, essential: true });
          }}>{busy ? "Looking up…" : "Look up"}</button>
          <button type="button" className="btn btn-ghost" disabled={busy} onClick={async () => {
            try { const p = await geolocation(); lookup(p); mapRef.current?.flyTo({ center: [p.lng, p.lat], zoom: 13, essential: true }); }
            catch (e: any) { setError(e?.message ?? "Geolocation failed."); }
          }}>📍 Use my location</button>
        </div>
        <p className="text-xs text-mute">Or click anywhere on the map.</p>
        {busy && <Spinner label="Reading OpenStreetMap address data…" />}
        {error && <ErrorBox>{error}</ErrorBox>}

        {address && !busy && (
          <div className="space-y-3 border-t border-line pt-3">
            {mode !== "coords-lookup" && (focusValue
              ? <Stat label={cfg.label} value={focusValue} sub={point ? fmtCoords(point) : undefined} />
              : <ErrorBox>{cfg.missing}</ErrorBox>)}
            {mode === "coords-lookup" && point && <Stat label="Coordinates" value={fmtCoords(point)} />}
            {displayName && <p className="text-sm leading-snug text-mute">{displayName}</p>}
            {rows.length > 0 && (
              <table className="tbl"><tbody>
                {rows.map(([k, v]) => (
                  <tr key={k}><td className="w-1/3 text-mute">{k}</td><td className="font-medium">{v}</td><td className="w-10"><CopyBtn text={v} label="" /></td></tr>
                ))}
              </tbody></table>
            )}
            <p className="text-[11px] leading-relaxed text-mute">Nominatim returns the address of a nearby suitable mapped object, not a verified point-in-boundary result. Fields can be missing, outdated or approximate; for legal boundaries use the responsible authority. Municipality, district and city modes may use broader fallback fields.</p>
          </div>
        )}
      </div>
      <div className="order-1 lg:order-2">
        <DynamicMap center={point ?? { lat: 25, lng: 10 }} zoom={point ? 12 : 1.6} className="tall" onReady={(map, lib) => {
          mapRef.current = map; libRef.current = lib;
          map.on("click", (e: any) => lookup({ lat: e.lngLat.lat, lng: e.lngLat.lng }));
          if (point) markerRef.current = new lib.Marker({ element: pinElement("#d95d32") }).setLngLat([point.lng, point.lat]).addTo(map);
        }} />
      </div>
    </div>
  );
}

interface NomHit { displayName: string; p: LatLng }

async function nominatimSearch(q: string, limit = 5): Promise<NomHit[]> {
  const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(q)}&limit=${limit}&addressdetails=0`;
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  if (!res.ok) throw new Error(`Search failed (${res.status})`);
  const data = await res.json();
  return (data as any[]).map((d) => ({ displayName: String(d.display_name ?? ""), p: { lat: Number(d.lat), lng: Number(d.lon) } }));
}

function IntersectionTool() {
  const [streetA, setStreetA] = useState("");
  const [streetB, setStreetB] = useState("");
  const [city, setCity] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [point, setPoint] = useState<LatLng | null>(null);
  const [address, setAddress] = useState("");
  const [alternatives, setAlternatives] = useState<NomHit[]>([]);
  const mapRef = useRef<MLMap | null>(null);
  const libRef = useRef<any>(null);
  const markerRef = useRef<any>(null);

  useEffect(() => {
    const map = mapRef.current, lib = libRef.current;
    if (!map || !lib || !point) return;
    if (!markerRef.current) markerRef.current = new lib.Marker({ element: pinElement("#1d6e63") }).setLngLat([point.lng, point.lat]).addTo(map);
    else markerRef.current.setLngLat([point.lng, point.lat]);
  }, [point]);

  const find = async () => {
    if (!streetA.trim() || !streetB.trim()) { setError("Enter both street names."); return; }
    setBusy(true); setError(null); setAlternatives([]); setPoint(null); setAddress("");
    try {
      const suffix = city.trim() ? `, ${city.trim()}` : "";
      let found: NomHit[] = [];
      for (const q of [`${streetA} & ${streetB}${suffix}`, `${streetA} and ${streetB}${suffix}`]) {
        found = await nominatimSearch(q, 5);
        if (found.length) break;
      }
      if (!found.length) {
        setPoint(null);
        setError("No search match was returned. This does not establish whether the streets cross; check spellings and verify with local mapping.");
        return;
      }
      const top = found[0];
      setPoint(top.p);
      setAlternatives(found.slice(1));
      mapRef.current?.flyTo({ center: [top.p.lng, top.p.lat], zoom: 16, essential: true });
      const rev = await nominatimReverse(top.p.lat, top.p.lng, 18);
      setAddress(rev.ok ? rev.result.displayName : top.displayName);
    } catch {
      setError("The search service could not be reached. Try again in a moment.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[400px,1fr]">
      <div className="card order-2 space-y-4 p-4 lg:order-1">
        <Field label="First street">
          <input className="input" value={streetA} onChange={(e) => setStreetA(e.target.value)} placeholder="5th Avenue" />
        </Field>
        <Field label="Second street">
          <input className="input" value={streetB} onChange={(e) => setStreetB(e.target.value)} placeholder="W 34th Street" />
        </Field>
        <Field label="City / town (recommended)">
          <input className="input" value={city} onChange={(e) => setCity(e.target.value)} placeholder="New York" />
        </Field>
        <button type="button" className="btn btn-primary w-full" onClick={find} disabled={busy}>
          {busy ? <Spinner label="Searching OpenStreetMap…" /> : "Find the intersection"}
        </button>
        {error && <ErrorBox>{error}</ErrorBox>}
        <p className="text-xs leading-relaxed text-mute">Search results are possible matches only: this tool does not check whether the mapped street geometries cross.</p>
        {point && (
          <div className="space-y-3 border-t border-line pt-3">
            <Stat label="Possible match coordinates" value={fmtCoords(point, 6)} />
            {address && <p className="text-sm leading-snug text-mute">{address}</p>}
            {alternatives.length > 0 && (
              <div>
                <div className="label">Other possible matches</div>
                <div className="flex flex-wrap gap-2">
                  {alternatives.map((a, i) => (
                    <button key={i} type="button" className="btn btn-ghost btn-sm" onClick={() => { setPoint(a.p); setAddress(a.displayName); mapRef.current?.flyTo({ center: [a.p.lng, a.p.lat], zoom: 16, essential: true }); }}>
                      {a.displayName.split(",").slice(0, 3).join(",")}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <p className="text-[11px] leading-relaxed text-mute">These are Nominatim text-search matches, not a geometric intersection calculation. A result may not be the junction or even a crossing; verify both roads and the location independently before using it.</p>
          </div>
        )}
      </div>
      <div className="order-1 lg:order-2">
        <DynamicMap center={point ?? { lat: 40.7, lng: -74 }} zoom={point ? 16 : 10} className="tall" onReady={(map, lib) => {
          mapRef.current = map; libRef.current = lib;
          if (point) markerRef.current = new lib.Marker({ element: pinElement("#1d6e63") }).setLngLat([point.lng, point.lat]).addTo(map);
        }} />
      </div>
    </div>
  );
}
