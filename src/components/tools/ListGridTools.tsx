"use client";
import { useEffect, useRef, useState } from "react";
import type { GeoJSONSource, Map as MLMap } from "maplibre-gl";
import { bearingBetween, compassPoint, distanceKm, fmt, fmtCoords, fmtDist, midpoint, type LatLng } from "@/lib/geo";
import { CopyBtn, ErrorBox, Field, Spinner, Stat } from "@/components/ui";
import { DynamicMap, PALETTE, pinElement } from "./shared";
import {
  enToGridRef, enToLatLng, gridRefToEN, latLngToEN,
  ukNearestPostcodes, ukPostcode, type UkPostcode,
} from "@/lib/nationalGrid";
import { fmtDuration, route } from "@/lib/routing";

const DATUM_NOTE =
  "Approximate projection only: no WGS84–OSGB36 datum transformation is applied. The error can be substantial; do not use for surveying or safety-critical navigation. Use an authoritative transformation for accurate results.";
const GB = { lat: 54.5, lng: -2.5 };

interface En { easting: number; northing: number }
interface GridPoint { en: En; point: LatLng }

/** Parse a grid ref to the CENTRE of its square (gridRefToEN gives the SW corner). */
function gridRefToPoint(ref: string): GridPoint | null {
  const sw = gridRefToEN(ref);
  if (!sw) return null;
  const digitCount = ref.replace(/[^0-9]/g, "").length;
  const cell = digitCount === 0 ? 100000 : 10 ** (5 - digitCount / 2);
  const en = { easting: sw.easting + cell / 2, northing: sw.northing + cell / 2 };
  return { en, point: enToLatLng(en.easting, en.northing) };
}

function postcodeGrid(pc: UkPostcode): En | null {
  if (!["England", "Scotland", "Wales"].includes(pc.country) || !Number.isFinite(pc.easting) || !Number.isFinite(pc.northing) || enToGridRef(pc.easting, pc.northing) === "Outside the National Grid") return null;
  return { easting: pc.easting, northing: pc.northing };
}

function fmtEn(en: En): string {
  return `${Math.round(en.easting).toLocaleString("en-GB")}, ${Math.round(en.northing).toLocaleString("en-GB")}`;
}

/** Shared readout block for any point inside (or near) the National Grid. */
function GridReadout({ en, point }: { en: En; point: LatLng }) {
  const ref6 = enToGridRef(en.easting, en.northing, 6);
  const ref10 = enToGridRef(en.easting, en.northing, 10);
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <Stat label="Grid reference (6 figure)" value={ref6} sub="100 m square" />
        <Stat label="Grid reference (10 figure)" value={ref10} sub="1 m square" />
        <Stat label="Easting" value={Math.round(en.easting).toLocaleString("en-GB")} sub="metres east" />
        <Stat label="Northing" value={Math.round(en.northing).toLocaleString("en-GB")} sub="metres north" />
      </div>
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <span className="text-mute">Lat / lng:</span> <strong>{fmtCoords(point)}</strong>
        {ref6 !== "Outside the National Grid" && <CopyBtn text={ref6} label="Copy grid ref" />}
      </div>
    </div>
  );
}

/** Single movable pin driven by `point`, for the small map modes. */
function useSinglePin(point: LatLng | null, color = PALETTE[0]) {
  const mapRef = useRef<MLMap | null>(null);
  const libRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  useEffect(() => {
    const map = mapRef.current, lib = libRef.current;
    if (!map || !lib || !point) return;
    if (!markerRef.current) {
      markerRef.current = new lib.Marker({ element: pinElement(color) }).setLngLat([point.lng, point.lat]).addTo(map);
    } else markerRef.current.setLngLat([point.lng, point.lat]);
  }, [point, color]);
  return { mapRef, libRef };
}

// ---------------------------------------------------------------- ngr-convert
function NgrConvert() {
  const [latText, setLatText] = useState("51.5014");
  const [lngText, setLngText] = useState("-0.1419");
  const [point, setPoint] = useState<LatLng | null>({ lat: 51.5014, lng: -0.1419 });
  const [gridInput, setGridInput] = useState("");
  const [fromGrid, setFromGrid] = useState<GridPoint | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { mapRef, libRef } = useSinglePin(point ?? fromGrid?.point ?? null);

  const active: GridPoint | null = fromGrid ?? (point ? { point, en: latLngToEN(point) } : null);

  const convertLatLng = () => {
    const lat = Number(latText), lng = Number(lngText);
    if (!latText.trim() || !lngText.trim() || !Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) {
      setError("Enter a valid latitude (-90 to 90) and longitude (-180 to 180)."); return;
    }
    setError(null); setFromGrid(null); setPoint({ lat, lng });
    mapRef.current?.flyTo({ center: [lng, lat], zoom: 10, essential: true });
  };
  const convertGrid = () => {
    const gp = gridRefToPoint(gridInput);
    if (!gp) { setError("That grid reference could not be read. Try a format like TQ 300 800."); return; }
    setError(null); setFromGrid(gp); setPoint(null);
    setLatText(gp.point.lat.toFixed(5)); setLngText(gp.point.lng.toFixed(5));
    mapRef.current?.flyTo({ center: [gp.point.lng, gp.point.lat], zoom: 10, essential: true });
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[400px,1fr]">
      <div className="card order-2 space-y-4 p-4 lg:order-1">
        <div>
          <span className="label">Latitude &amp; longitude to grid reference</span>
          <div className="grid grid-cols-2 gap-2">
            <input className="input" inputMode="decimal" aria-label="Latitude" value={latText} onChange={(e) => setLatText(e.target.value)} />
            <input className="input" inputMode="decimal" aria-label="Longitude" value={lngText} onChange={(e) => setLngText(e.target.value)} />
          </div>
          <button type="button" className="btn btn-primary w-full mt-2" onClick={convertLatLng}>Convert to grid reference</button>
          <p className="mt-2 text-xs text-mute">You can also click the map to pick a point.</p>
        </div>
        <div className="border-t border-line pt-3">
          <Field label="Grid reference to lat / lng" hint="For example TQ 300 800 or SU 123 456.">
            <input className="input" value={gridInput} placeholder="TQ 300 800" onChange={(e) => setGridInput(e.target.value)} />
          </Field>
          <button type="button" className="btn btn-primary w-full mt-2" onClick={convertGrid}>Convert to lat / lng</button>
        </div>
        {error && <ErrorBox>{error}</ErrorBox>}
        {active && <GridReadout en={active.en} point={active.point} />}
        <p className="rounded-lg bg-well px-3 py-2 text-xs leading-relaxed text-mute">{DATUM_NOTE}</p>
      </div>
      <div className="order-1 lg:order-2">
        <DynamicMap center={active?.point ?? { lat: 51.5, lng: -0.12 }} zoom={9} className="tall" onReady={(map, lib) => {
          mapRef.current = map; libRef.current = lib;
          map.on("click", (e: any) => {
            const p = { lat: e.lngLat.lat, lng: e.lngLat.lng };
            setFromGrid(null); setPoint(p); setError(null);
            setLatText(p.lat.toFixed(5)); setLngText(p.lng.toFixed(5));
          });
        }} />
      </div>
    </div>
  );
}

// ------------------------------------------------------------- ngr-to-postcode
function NgrToPostcode() {
  const [gridInput, setGridInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [centre, setCentre] = useState<GridPoint | null>(null);
  const [results, setResults] = useState<UkPostcode[] | null>(null);

  const run = async () => {
    const gp = gridRefToPoint(gridInput);
    if (!gp) { setError("That grid reference could not be read. Try a format like TQ 300 800."); return; }
    setBusy(true); setError(null); setResults(null); setCentre(gp);
    try {
      setResults(await ukNearestPostcodes(gp.point.lat, gp.point.lng, 10));
    } catch (e: any) { setError(e?.message ?? "The postcode lookup failed. Please try again."); }
    setBusy(false);
  };

  return (
    <div className="card space-y-4 p-4">
      <Field label="OS grid reference" hint="For example TQ 300 800. The nearest postcodes to the centre of that square are listed.">
        <input className="input" value={gridInput} placeholder="TQ 300 800" onChange={(e) => setGridInput(e.target.value)} />
      </Field>
      <button type="button" className="btn btn-primary w-full" onClick={run} disabled={busy}>
        {busy ? <Spinner label="Looking up postcodes…" /> : "Find nearest postcodes"}
      </button>
      {error && <ErrorBox>{error}</ErrorBox>}
      {centre && results && (
        <div className="space-y-3">
          <p className="text-sm text-mute">
            Centre of the entered grid square: {fmtCoords(centre.point)} · Easting / northing {fmtEn(centre.en)}
          </p>
          <div className="overflow-x-auto">
            <table className="tbl">
              <thead><tr><th>Postcode</th><th>District</th><th>Region</th><th>Distance</th></tr></thead>
              <tbody>
                {results.map((pc) => {
                  const d = distanceKm(centre.point, pc);
                  return (
                    <tr key={pc.postcode}>
                      <td className="font-semibold">{pc.postcode}</td>
                      <td>{pc.district || "—"}</td>
                      <td>{pc.region || "—"}</td>
                      <td>{fmtDist(d, "mi")} <span className="text-mute">({fmtDist(d, "km")})</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {!results.length && <p className="text-sm text-mute">No postcodes were found near that grid reference.</p>}
          <p className="text-xs text-mute">{DATUM_NOTE}</p>
        </div>
      )}
    </div>
  );
}

// ------------------------------------------------------------- postcode-to-ngr
function PostcodeToNgr() {
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<UkPostcode | null>(null);
  const point = result ? { lat: result.lat, lng: result.lng } : null;
  const { mapRef, libRef } = useSinglePin(point, PALETTE[1]);

  const run = async () => {
    setBusy(true); setError(null); setResult(null);
    try {
      const pc = await ukPostcode(code);
      setResult(pc);
      mapRef.current?.flyTo({ center: [pc.lng, pc.lat], zoom: 13, essential: true });
    } catch (e: any) { setError(e?.message ?? "The postcode lookup failed. Please try again."); }
    setBusy(false);
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[400px,1fr]">
      <div className="card order-2 space-y-4 p-4 lg:order-1">
        <Field label="UK postcode" hint="For example SW1A 1AA or EH1 1YZ.">
          <input className="input" value={code} placeholder="SW1A 1AA" onChange={(e) => setCode(e.target.value)} />
        </Field>
        <button type="button" className="btn btn-primary w-full" onClick={run} disabled={busy}>
          {busy ? <Spinner label="Looking up postcode…" /> : "Get grid reference"}
        </button>
        {error && <ErrorBox>{error}</ErrorBox>}
        {result && (
          <div className="space-y-3">
            {postcodeGrid(result) ? <GridReadout en={postcodeGrid(result)!} point={result} /> : <ErrorBox>No usable British National Grid coordinates were returned for this postcode. Northern Ireland uses a different grid.</ErrorBox>}
            <div className="grid grid-cols-2 gap-3">
              <Stat label="District" value={result.district || "—"} />
              <Stat label="Region" value={result.region || "—"} />
            </div>
            <p className="rounded-lg bg-well px-3 py-2 text-xs leading-relaxed text-mute">
              The grid reference uses eastings and northings supplied by postcodes.io for a representative postcode location, not an individual property or a surveyed position.
            </p>
          </div>
        )}
      </div>
      <div className="order-1 lg:order-2">
        <DynamicMap center={point ?? { lat: 54.5, lng: -2.5 }} zoom={point ? 13 : 6} className="tall" onReady={(map, lib) => { mapRef.current = map; libRef.current = lib; }} />
      </div>
    </div>
  );
}

// -------------------------------------------------------------------- ngr-map
function NgrMap() {
  const [ref, setRef] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [picked, setPicked] = useState<GridPoint | null>(null);
  const { mapRef, libRef } = useSinglePin(picked?.point ?? null, PALETTE[2]);
  return (
    <div className="grid gap-4 lg:grid-cols-[400px,1fr]">
      <div className="card order-2 space-y-4 p-4 lg:order-1">
        <p className="text-sm leading-relaxed text-mute">
          Enter a grid reference to plot its square’s approximate centre, or click the map to read an approximate reference. Grid squares and grid lines are not drawn.
        </p>
        <Field label="Grid reference"><input className="input" value={ref} onChange={(e) => setRef(e.target.value)} placeholder="TQ 300 800" /></Field>
        <button type="button" className="btn btn-primary w-full" onClick={() => {
          const gp = gridRefToPoint(ref);
          if (!gp) { setError("Enter a valid British National Grid reference."); return; }
          setError(null); setPicked(gp);
          mapRef.current?.flyTo({ center: [gp.point.lng, gp.point.lat], zoom: 12, essential: true });
        }}>Plot reference centre</button>
        {error && <ErrorBox>{error}</ErrorBox>}
        {picked ? (
          <GridReadout en={picked.en} point={picked.point} />
        ) : (
          <p className="rounded-lg bg-well px-3 py-2 text-sm text-mute">No point picked yet — click the map to start.</p>
        )}
        <p className="rounded-lg bg-well px-3 py-2 text-xs leading-relaxed text-mute">{DATUM_NOTE}</p>
      </div>
      <div className="order-1 lg:order-2">
        <DynamicMap center={GB} zoom={6} className="tall" onReady={(map, lib) => {
          mapRef.current = map; libRef.current = lib;
          map.on("click", (e: any) => {
            const p = { lat: e.lngLat.lat, lng: e.lngLat.lng };
            setError(null); setPicked({ point: p, en: latLngToEN(p) });
          });
        }} />
      </div>
    </div>
  );
}

// ------------------------------------------------------------ osgrid-distance
interface GridDistResult { distKm: number; bearing: number; mid: GridPoint; a: GridPoint; b: GridPoint }

function OsGridDistance() {
  const [aRef, setARef] = useState("");
  const [bRef, setBRef] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<GridDistResult | null>(null);

  const run = () => {
    const a = gridRefToPoint(aRef), b = gridRefToPoint(bRef);
    if (!a || !b) { setError("One of the grid references could not be read. Try a format like TQ 300 800."); setResult(null); return; }
    const dE = b.en.easting - a.en.easting, dN = b.en.northing - a.en.northing;
    const midEn = { easting: (a.en.easting + b.en.easting) / 2, northing: (a.en.northing + b.en.northing) / 2 };
    setError(null);
    setResult({
      distKm: Math.hypot(dE, dN) / 1000,
      bearing: (Math.atan2(dE, dN) * 180 / Math.PI + 360) % 360,
      mid: { en: midEn, point: enToLatLng(midEn.easting, midEn.northing) },
      a, b,
    });
  };

  return (
    <div className="card space-y-4 p-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="First grid reference"><input className="input" value={aRef} placeholder="TQ 300 800" onChange={(e) => setARef(e.target.value)} /></Field>
        <Field label="Second grid reference"><input className="input" value={bRef} placeholder="SU 123 456" onChange={(e) => setBRef(e.target.value)} /></Field>
      </div>
      <button type="button" className="btn btn-primary w-full" onClick={run}>Measure distance</button>
      {error && <ErrorBox>{error}</ErrorBox>}
      {result && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Stat label="Distance" value={fmtDist(result.distKm, "mi")} sub={fmtDist(result.distKm, "km")} />
            <Stat label="Bearing" value={`${fmt(result.bearing, 0)}° ${compassPoint(result.bearing)}`} sub="From the first point to the second" />
            <Stat label="Midpoint grid reference" value={enToGridRef(result.mid.en.easting, result.mid.en.northing, 6)} sub={enToGridRef(result.mid.en.easting, result.mid.en.northing, 10)} />
            <Stat label="Midpoint lat / lng" value={fmtCoords(result.mid.point)} sub={`Easting / northing ${fmtEn(result.mid.en)}`} />
          </div>
          <p className="text-xs text-mute">
            Distance and bearing are calculated between the centres of the two referenced squares in the projected grid. Grid north differs from true north; the displayed midpoint latitude/longitude has no datum shift.
          </p>
        </div>
      )}
    </div>
  );
}

// ------------------------------------------------------- uk-postcode-distance
interface PcDistResult { a: UkPostcode; b: UkPostcode; distKm: number; bearing: number; mid: LatLng; midPc: UkPostcode | null }

function UkPostcodeDistance() {
  const [aCode, setACode] = useState("");
  const [bCode, setBCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<PcDistResult | null>(null);

  const run = async () => {
    setBusy(true); setError(null); setResult(null);
    try {
      const [a, b] = await Promise.all([ukPostcode(aCode), ukPostcode(bCode)]);
      const mid = midpoint(a, b);
      // Nearest postcode to the midpoint is a bonus lookup, never fatal.
      const midPc = await ukNearestPostcodes(mid.lat, mid.lng, 1).then((r) => r[0] ?? null).catch(() => null);
      setResult({ a, b, distKm: distanceKm(a, b), bearing: bearingBetween(a, b), mid, midPc });
    } catch (e: any) { setError(e?.message ?? "The postcode lookup failed. Please try again."); }
    setBusy(false);
  };

  return (
    <div className="card space-y-4 p-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="First postcode"><input className="input" value={aCode} placeholder="SW1A 1AA" onChange={(e) => setACode(e.target.value)} /></Field>
        <Field label="Second postcode"><input className="input" value={bCode} placeholder="EH1 1YZ" onChange={(e) => setBCode(e.target.value)} /></Field>
      </div>
      <button type="button" className="btn btn-primary w-full" onClick={run} disabled={busy}>
        {busy ? <Spinner label="Looking up postcodes…" /> : "Measure distance"}
      </button>
      {error && <ErrorBox>{error}</ErrorBox>}
      {result && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Stat label="Straight-line distance" value={fmtDist(result.distKm, "mi")} sub={fmtDist(result.distKm, "km")} />
            <Stat label="Bearing" value={`${fmt(result.bearing, 0)}° ${compassPoint(result.bearing)}`} sub={`From ${result.a.postcode} to ${result.b.postcode}`} />
            <Stat label="Midpoint" value={fmtCoords(result.mid)} sub="Halfway between the two postcodes" />
            <Stat label="Nearest postcode to midpoint" value={result.midPc?.postcode ?? "—"} sub={result.midPc ? `${result.midPc.district}${result.midPc.region ? `, ${result.midPc.region}` : ""}` : "Not found"} />
          </div>
          <p className="text-sm text-mute">
            <span className="chip mr-2">{result.a.postcode}</span>{result.a.district} · grid ref {postcodeGrid(result.a) ? enToGridRef(result.a.easting, result.a.northing, 6) : "not available"}
            <br />
            <span className="chip mr-2 mt-1">{result.b.postcode}</span>{result.b.district} · grid ref {postcodeGrid(result.b) ? enToGridRef(result.b.easting, result.b.northing, 6) : "not available"}
          </p>
        </div>
      )}
    </div>
  );
}

// -------------------------------------------------------- uk-postcode-walking
interface WalkResult { a: UkPostcode; b: UkPostcode; distKm: number; durationS: number; straightKm: number; shape: LatLng[] }

function UkPostcodeWalking() {
  const [aCode, setACode] = useState("");
  const [bCode, setBCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<WalkResult | null>(null);
  const mapRef = useRef<MLMap | null>(null);
  const libRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);

  const run = async () => {
    setBusy(true); setError(null); setResult(null);
    try {
      const [a, b] = await Promise.all([ukPostcode(aCode), ukPostcode(bCode)]);
      const r = await route([a, b], "walking");
      if (!r.ok) { setError(r.message); setBusy(false); return; }
      setResult({ a, b, distKm: r.distanceKm, durationS: r.durationS, straightKm: distanceKm(a, b), shape: r.shape });
    } catch (e: any) { setError(e?.message ?? "Something went wrong. Please try again."); }
    setBusy(false);
  };

  useEffect(() => {
    const map = mapRef.current, lib = libRef.current;
    if (!map || !lib || !result) return;
    markersRef.current.forEach((mk) => mk.remove());
    markersRef.current = [
      new lib.Marker({ element: pinElement(PALETTE[0], "A") }).setLngLat([result.a.lng, result.a.lat]).addTo(map),
      new lib.Marker({ element: pinElement(PALETTE[1], "B") }).setLngLat([result.b.lng, result.b.lat]).addTo(map),
    ];
    (map.getSource("walk-route") as GeoJSONSource | undefined)?.setData({
      type: "Feature", properties: {},
      geometry: { type: "LineString", coordinates: result.shape.map((p) => [p.lng, p.lat]) },
    } as any);
    if (result.shape.length > 1) {
      const bounds = result.shape.reduce(
        (bb: any, p) => bb.extend([p.lng, p.lat]),
        new lib.LngLatBounds([result.shape[0].lng, result.shape[0].lat], [result.shape[0].lng, result.shape[0].lat]),
      );
      map.fitBounds(bounds, { padding: 60, duration: 600 });
    }
  }, [result]);

  return (
    <div className="grid gap-4 lg:grid-cols-[400px,1fr]">
      <div className="card order-2 space-y-4 p-4 lg:order-1">
        <div className="grid gap-3">
          <Field label="Start postcode"><input className="input" value={aCode} placeholder="SW1A 1AA" onChange={(e) => setACode(e.target.value)} /></Field>
          <Field label="End postcode"><input className="input" value={bCode} placeholder="SW1A 2AA" onChange={(e) => setBCode(e.target.value)} /></Field>
        </div>
        <button type="button" className="btn btn-primary w-full" onClick={run} disabled={busy}>
          {busy ? <Spinner label="Finding a walking route…" /> : "Find walking route"}
        </button>
        {error && <ErrorBox>{error}</ErrorBox>}
        {result && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <Stat label="Walking distance" value={fmtDist(result.distKm, "mi")} sub={fmtDist(result.distKm, "km")} />
              <Stat label="Walking time" value={fmtDuration(result.durationS)} sub="At a normal walking pace" />
              <Stat label="Straight-line distance" value={fmtDist(result.straightKm, "mi")} sub={fmtDist(result.straightKm, "km")} />
              <Stat label="Route" value={`${result.a.postcode} → ${result.b.postcode}`} sub="Follow the line on the map" />
            </div>
            <p className="text-xs text-mute">Walking route follows paths and streets from OpenStreetMap data. Check local signs and access before you set off.</p>
          </div>
        )}
      </div>
      <div className="order-1 lg:order-2">
        <DynamicMap center={GB} zoom={6} className="tall" onReady={(map, lib) => {
          mapRef.current = map; libRef.current = lib;
          map.addSource("walk-route", { type: "geojson", data: { type: "FeatureCollection", features: [] } });
          map.addLayer({ id: "walk-route-line", type: "line", source: "walk-route", layout: { "line-cap": "round", "line-join": "round" }, paint: { "line-color": PALETTE[1], "line-width": 4 } });
        }} />
      </div>
    </div>
  );
}

// -------------------------------------------------------------------- dispatch
export default function ListGridTools({ params }: { params?: Record<string, unknown> }) {
  const mode = (params?.mode as string) ?? "ngr-convert";
  switch (mode) {
    case "ngr-to-postcode": return <NgrToPostcode />;
    case "postcode-to-ngr": return <PostcodeToNgr />;
    case "ngr-map": return <NgrMap />;
    case "osgrid-distance": return <OsGridDistance />;
    case "uk-postcode-distance": return <UkPostcodeDistance />;
    case "uk-postcode-walking": return <UkPostcodeWalking />;
    case "ngr-convert":
    default: return <NgrConvert />;
  }
}
