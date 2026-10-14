"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Map as MLMap } from "maplibre-gl";
import { fmtCoords, isValidLat, isValidLng, parseCoordPair, type LatLng } from "@/lib/geo";
import { encodePlusCode, formatDms, formatUtm, latLngToMgrs, latLngToUtm, parseDms } from "@/lib/coords";
import { geolocationDetails, nominatimReverse, addressBreakdown } from "@/lib/geocode";
import { downloadText, toCsv } from "@/lib/formats";
import { readUrlParams, syncUrl, CopyBtn, ErrorBox, Field, Spinner, Stat } from "@/components/ui";
import { DynamicMap, pinElement } from "./shared";
import LocationSearch from "@/components/LocationSearch";

type ReverseInfo = {
  displayName: string;
  address: ReturnType<typeof addressBreakdown>;
};

const PRECISIONS = [4, 5, 6, 7, 8];

export default function LatLongTool({ params }: { params?: Record<string, unknown> }) {
  const gpsFocus = !!params?.gpsFocus;
  const [point, setPoint] = useState<LatLng>(() => {
    const p = readUrlParams();
    const lat = parseFloat(p.get("lat") ?? "");
    const lng = parseFloat(p.get("lng") ?? "");
    return isValidLat(lat) && isValidLng(lng) ? { lat, lng } : { lat: 48.8584, lng: 2.2945 };
  });
  const [raw, setRaw] = useState("");
  const [precision, setPrecision] = useState(6);
  const [err, setErr] = useState<string | null>(null);
  const [reverse, setReverse] = useState<ReverseInfo | null>(null);
  const [reverseBusy, setReverseBusy] = useState(false);
  const [locating, setLocating] = useState(false);
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const mapRef = useRef<MLMap | null>(null);
  const libRef = useRef<any>(null);
  const markerRef = useRef<any>(null);

  useEffect(() => {
    syncUrl({ lat: point.lat.toFixed(precision), lng: point.lng.toFixed(precision) });
  }, [point, precision]);

  useEffect(() => {
    const lib = libRef.current;
    if (!lib || !mapRef.current) return;
    if (!markerRef.current) {
      markerRef.current = new lib.Marker({ element: pinElement("#1d6e63"), draggable: true })
        .setLngLat([point.lng, point.lat])
        .addTo(mapRef.current);
      markerRef.current.on("drag", () => {
        const ll = markerRef.current.getLngLat();
        setPoint({ lat: ll.lat, lng: ll.lng });
        setReverse(null);
        setAccuracy(null);
      });
    } else markerRef.current.setLngLat([point.lng, point.lat]);
  }, [point]);

  const locateRaw = () => {
    setErr(null);
    const pair = parseCoordPair(raw);
    if (pair) {
      setPoint(pair);
      setReverse(null);
      setAccuracy(null);
      mapRef.current?.flyTo({ center: [pair.lng, pair.lat], zoom: 13, essential: true });
      return;
    }
    const parts = raw.split(/[,;]\s*|\s{2,}/);
    if (parts.length >= 2) {
      const la = parseDms(parts[0]);
      const lo = parseDms(parts.slice(1).join(" "));
      if (la !== null && lo !== null && isValidLat(la) && isValidLng(lo)) {
        setPoint({ lat: la, lng: lo });
        setReverse(null);
        setAccuracy(null);
        mapRef.current?.flyTo({ center: [lo, la], zoom: 13, essential: true });
        return;
      }
    }
    setErr("Couldn't read that coordinate. Try “40.7128, -74.006” or “40°26'46\"N 79°58'36\"W”.");
  };

  const useCurrentLocation = async () => {
    setErr(null);
    setLocating(true);
    try {
      const pos = await geolocationDetails();
      setPoint({ lat: pos.lat, lng: pos.lng });
      setAccuracy(pos.accuracy);
      setReverse(null);
      mapRef.current?.flyTo({ center: [pos.lng, pos.lat], zoom: 15, essential: true });
    } catch (e: any) {
      setErr(e?.message ?? "Could not determine your current location.");
    } finally {
      setLocating(false);
    }
  };

  const reverseLookup = async () => {
    setReverseBusy(true);
    setErr(null);
    const res = await nominatimReverse(point.lat, point.lng, 18);
    setReverseBusy(false);
    if (!res.ok) {
      setReverse(null);
      setErr(res.message);
      return;
    }
    setReverse({ displayName: res.result.displayName, address: addressBreakdown(res.result.address) });
  };

  const utm = latLngToUtm(point);
  const mgrs = latLngToMgrs(point, 5);
  const dd = `${point.lat.toFixed(precision)}, ${point.lng.toFixed(precision)}`;
  const dms = `${formatDms(point.lat, "lat")}, ${formatDms(point.lng, "lng")}`;
  const utmText = utm ? formatUtm(utm) : "Outside UTM range";
  const plusCode = encodePlusCode(point.lat, point.lng);

  const formats = useMemo(() => [
    ["Decimal degrees", dd],
    ["DMS", dms],
    ["UTM (WGS84)", utmText],
    ["MGRS", mgrs ?? "—"],
    ["Plus Code", plusCode],
  ] as [string, string][], [dd, dms, utmText, mgrs, plusCode]);

  const copyAll = formats.map(([k, v]) => `${k}: ${v}`).join("\n") + (reverse ? `\nAddress: ${reverse.displayName}` : "");
  const mapQuery = `${point.lat},${point.lng}`;

  const exportJson = () => {
    downloadText("mapbench-coordinate.json", JSON.stringify({
      latitude: point.lat,
      longitude: point.lng,
      precision,
      formats: Object.fromEntries(formats),
      address: reverse?.displayName ?? null,
      accuracyMeters: accuracy,
      datum: "WGS84",
    }, null, 2), "application/json");
  };

  const exportCsv = () => {
    downloadText("mapbench-coordinate.csv", toCsv(["Field", "Value"], [
      ["Latitude", point.lat],
      ["Longitude", point.lng],
      ...formats,
      ...(reverse ? [["Address", reverse.displayName] as [string, string]] : []),
    ]), "text/csv");
  };

  const updateLat = (value: string) => {
    const n = Number(value);
    if (isValidLat(n)) { setPoint((p) => ({ ...p, lat: n })); setReverse(null); setAccuracy(null); }
  };
  const updateLng = (value: string) => {
    const n = Number(value);
    if (isValidLng(n)) { setPoint((p) => ({ ...p, lng: n })); setReverse(null); setAccuracy(null); }
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[420px,1fr]">
      <div className="card order-2 space-y-4 p-4 lg:order-1">
        {gpsFocus ? (
          <div>
            <Field label="Paste GPS coordinates" hint="Decimal degrees and DMS with hemisphere letters are supported.">
              <input className="input" value={raw} onChange={(e) => setRaw(e.target.value)} placeholder={'40°26\'46"N, 79°58\'36"W'} onKeyDown={(e) => e.key === "Enter" && locateRaw()} />
            </Field>
            <button type="button" className="btn btn-primary mt-2 w-full" onClick={locateRaw}>Locate coordinate</button>
          </div>
        ) : (
          <Field label="Jump to a place">
            <LocationSearch placeholder="Search address, city or landmark…" onSelect={(h) => {
              setPoint({ lat: h.lat, lng: h.lng });
              setReverse(null);
              setAccuracy(null);
              mapRef.current?.flyTo({ center: [h.lng, h.lat], zoom: 13, essential: true });
            }} />
          </Field>
        )}

        <button type="button" className="btn btn-ghost w-full" onClick={useCurrentLocation} disabled={locating}>
          {locating ? <Spinner label="Locating…" /> : "⌖ Use my current location"}
        </button>

        {err && <ErrorBox>{err}</ErrorBox>}

        <div className="grid grid-cols-2 gap-3 border-t border-line pt-3">
          <Field label="Latitude">
            <input type="number" step="any" className="input font-mono" value={point.lat} onChange={(e) => updateLat(e.target.value)} />
          </Field>
          <Field label="Longitude">
            <input type="number" step="any" className="input font-mono" value={point.lng} onChange={(e) => updateLng(e.target.value)} />
          </Field>
        </div>

        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="label !mb-0">Decimal precision</div>
            <div className="mt-1 text-xs text-mute">Controls decimal display and share URL.</div>
          </div>
          <select className="select !w-auto" value={precision} onChange={(e) => setPrecision(Number(e.target.value))}>
            {PRECISIONS.map((n) => <option key={n} value={n}>{n} decimals</option>)}
          </select>
        </div>

        <div className="space-y-2 border-t border-line pt-3">
          {formats.map(([label, value]) => <FormatRow key={label} label={label} value={value} />)}
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button type="button" className="btn btn-primary" onClick={reverseLookup} disabled={reverseBusy}>
            {reverseBusy ? <Spinner label="Finding address…" /> : "Find address"}
          </button>
          <CopyBtn text={copyAll} label="Copy all" />
        </div>

        {reverse && (
          <div className="rounded-lg border border-line bg-well p-3 text-sm">
            <div className="text-[10px] font-bold uppercase tracking-wide text-mute">Nearest address</div>
            <div className="mt-1 font-semibold leading-relaxed">{reverse.displayName}</div>
            <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
              {reverse.address.city && <Stat label="City" value={reverse.address.city} />}
              {reverse.address.county && <Stat label="County" value={reverse.address.county} />}
              {reverse.address.state && <Stat label="State / region" value={reverse.address.state} />}
              {reverse.address.postcode && <Stat label="Postal code" value={reverse.address.postcode} />}
              {reverse.address.country && <Stat label="Country" value={reverse.address.country} />}
              {reverse.address.road && <Stat label="Road" value={reverse.address.road} />}
            </div>
          </div>
        )}

        {accuracy != null && <p className="text-xs text-mute">Browser-reported location accuracy: about ±{Math.round(accuracy)} m.</p>}

        <div className="flex flex-wrap gap-2">
          <button type="button" className="btn btn-ghost btn-sm" onClick={exportJson}>Export JSON</button>
          <button type="button" className="btn btn-ghost btn-sm" onClick={exportCsv}>Export CSV</button>
          <a className="btn btn-ghost btn-sm" href={`https://www.openstreetmap.org/?mlat=${point.lat}&mlon=${point.lng}#map=15/${point.lat}/${point.lng}`} target="_blank" rel="noreferrer">OpenStreetMap</a>
          <a className="btn btn-ghost btn-sm" href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapQuery)}`} target="_blank" rel="noreferrer">Google Maps</a>
        </div>

        <p className="text-xs text-mute">Click or drag the map marker to move the point. Coordinates use the WGS84 datum. Reverse-geocoded addresses are approximate labels from OpenStreetMap data.</p>
      </div>

      <div className="order-1 lg:order-2">
        <DynamicMap center={point} zoom={12} className="tall" onReady={(map, lib) => {
          mapRef.current = map;
          libRef.current = lib;
          markerRef.current = new lib.Marker({ element: pinElement("#1d6e63"), draggable: true }).setLngLat([point.lng, point.lat]).addTo(map);
          markerRef.current.on("drag", () => {
            const ll = markerRef.current.getLngLat();
            setPoint({ lat: ll.lat, lng: ll.lng });
            setReverse(null);
            setAccuracy(null);
          });
          map.on("click", (e: any) => {
            setPoint({ lat: e.lngLat.lat, lng: e.lngLat.lng });
            setReverse(null);
            setAccuracy(null);
          });
        }} />
      </div>
    </div>
  );
}

function FormatRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-2 rounded-lg border border-line bg-well px-3 py-2">
      <div className="min-w-0">
        <div className="text-[10px] font-bold uppercase tracking-wide text-mute">{label}</div>
        <div className="truncate font-mono text-sm font-semibold">{value}</div>
      </div>
      <CopyBtn text={value} label="" />
    </div>
  );
}
