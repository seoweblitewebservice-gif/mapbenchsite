"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Map as MLMap } from "maplibre-gl";
import LocationSearch from "@/components/LocationSearch";
import { downloadDataUrl, downloadText, geojsonToKml, toCsv } from "@/lib/formats";
import { readUrlParams, syncUrl, CopyBtn, ErrorBox, Field } from "@/components/ui";
import { DynamicMap, PALETTE } from "./shared";

interface Pin { id: number; lat: number; lng: number; label: string; color: string }

function parsePinsFromUrl(): Pin[] {
  const raw = readUrlParams().get("pins");
  if (!raw) return [];
  try {
    return raw.split("~").map((chunk, i) => {
      const [lat, lng, color, ...rest] = chunk.split("|");
      return { id: i + 1, lat: parseFloat(lat), lng: parseFloat(lng), color: color || PALETTE[0], label: decodeURIComponent(rest.join("|") || "") };
    }).filter((p) => Number.isFinite(p.lat) && Number.isFinite(p.lng) && Math.abs(p.lat) <= 90 && Math.abs(p.lng) <= 180);
  } catch { return []; }
}

function parseBulk(text: string): { lat: number; lng: number; label: string }[] {
  return text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean).map((line) => {
    const parts = line.split(/\t|,/).map((x) => x.trim());
    const lat = Number(parts[0]), lng = Number(parts[1]);
    return { lat, lng, label: parts.slice(2).join(", ") };
  }).filter((p) => Number.isFinite(p.lat) && Number.isFinite(p.lng) && Math.abs(p.lat) <= 90 && Math.abs(p.lng) <= 180);
}

function markerElement(pin: Pin, index: number) {
  const el = document.createElement("div");
  el.style.display = "flex";
  el.style.alignItems = "center";
  el.style.justifyContent = "center";
  el.style.width = "32px";
  el.style.height = "32px";
  el.style.borderRadius = "999px";
  el.style.background = pin.color;
  el.style.border = "3px solid white";
  el.style.boxShadow = "0 3px 10px rgba(0,0,0,.28)";
  el.style.color = "white";
  el.style.font = "700 12px ui-sans-serif,system-ui,sans-serif";
  el.style.cursor = "grab";
  el.textContent = String(index + 1);
  el.title = pin.label || `Pin ${index + 1}`;
  return el;
}

export default function PinMapTool() {
  const [pins, setPins] = useState<Pin[]>(parsePinsFromUrl);
  const [bulk, setBulk] = useState("");
  const [bulkError, setBulkError] = useState<string | null>(null);
  const nextId = useRef(Math.max(0, ...pins.map((p) => p.id)) + 1);
  const mapRef = useRef<MLMap | null>(null);
  const libRef = useRef<any>(null);
  const markerRefs = useRef<Map<number, any>>(new Map());

  useEffect(() => {
    syncUrl({ pins: pins.length ? pins.map((p) => `${p.lat.toFixed(5)}|${p.lng.toFixed(5)}|${p.color}|${encodeURIComponent(p.label)}`).join("~") : null });
  }, [pins]);

  useEffect(() => {
    const map = mapRef.current, lib = libRef.current;
    if (!map || !lib) return;

    markerRefs.current.forEach((marker) => marker.remove());
    markerRefs.current.clear();

    pins.forEach((pin, index) => {
      const marker = new lib.Marker({ element: markerElement(pin, index), draggable: true })
        .setLngLat([pin.lng, pin.lat])
        .addTo(map);
      marker.on("dragend", () => {
        const ll = marker.getLngLat();
        setPins((items) => items.map((item) => item.id === pin.id ? { ...item, lat: ll.lat, lng: ll.lng } : item));
      });
      markerRefs.current.set(pin.id, marker);
    });
  }, [pins]);

  const exportFc = () => ({
    type: "FeatureCollection" as const,
    features: pins.map((p, i) => ({
      type: "Feature" as const,
      properties: { name: p.label || `Pin ${i + 1}`, color: p.color, number: i + 1 },
      geometry: { type: "Point" as const, coordinates: [p.lng, p.lat] },
    })),
  });

  const addPin = (lat: number, lng: number, label = "") => {
    setPins((items) => [...items, { id: nextId.current++, lat, lng, label, color: PALETTE[items.length % PALETTE.length] }]);
  };

  const fitAll = () => {
    const map = mapRef.current;
    if (!map || !pins.length) return;
    if (pins.length === 1) {
      map.flyTo({ center: [pins[0].lng, pins[0].lat], zoom: 12, essential: true });
      return;
    }
    let west = Infinity, south = Infinity, east = -Infinity, north = -Infinity;
    pins.forEach((p) => { west = Math.min(west, p.lng); east = Math.max(east, p.lng); south = Math.min(south, p.lat); north = Math.max(north, p.lat); });
    map.fitBounds([[west, south], [east, north]], { padding: 60, maxZoom: 13, duration: 700 });
  };

  const importBulk = () => {
    const parsed = parseBulk(bulk);
    if (!parsed.length) {
      setBulkError("No valid rows found. Use latitude,longitude,label — one pin per line.");
      return;
    }
    setBulkError(null);
    setPins((items) => [
      ...items,
      ...parsed.map((p, i) => ({ id: nextId.current++, ...p, color: PALETTE[(items.length + i) % PALETTE.length] })),
    ]);
    setBulk("");
    setTimeout(fitAll, 120);
  };

  const exportPng = () => {
    const map = mapRef.current;
    if (!map) return;
    downloadDataUrl("mapbench-pin-map.png", map.getCanvas().toDataURL("image/png"));
  };

  const copyList = useMemo(() => pins.map((p, i) => `${i + 1}. ${p.label || `Pin ${i + 1}`} — ${p.lat.toFixed(6)}, ${p.lng.toFixed(6)}`).join("\n"), [pins]);

  return (
    <div className="grid gap-4 lg:grid-cols-[390px,1fr]">
      <div className="card order-2 space-y-4 p-4 lg:order-1">
        <div>
          <div className="label">Add a place</div>
          <LocationSearch placeholder="Search city, address or place…" onSelect={(h) => {
            addPin(h.lat, h.lng, h.label);
            mapRef.current?.flyTo({ center: [h.lng, h.lat], zoom: 12, essential: true });
          }} />
          <p className="mt-2 text-xs text-mute">Or click anywhere on the map. Markers are draggable after you add them.</p>
        </div>

        <details className="rounded-xl border border-line bg-well/30 p-3">
          <summary className="cursor-pointer text-sm font-semibold">Bulk add coordinates</summary>
          <div className="mt-3 space-y-2">
            <textarea className="textarea min-h-28 font-mono text-xs" value={bulk} onChange={(e) => setBulk(e.target.value)} placeholder={"40.7128,-74.006,New York\n51.5074,-0.1278,London\n35.6762,139.6503,Tokyo"} />
            <button type="button" className="btn btn-primary btn-sm" onClick={importBulk}>Import rows</button>
            {bulkError && <ErrorBox>{bulkError}</ErrorBox>}
          </div>
        </details>

        <div className="flex flex-wrap gap-2">
          <button type="button" className="btn btn-ghost btn-sm" disabled={!pins.length} onClick={fitAll}>Fit all pins</button>
          {pins.length > 0 && <CopyBtn text={copyList} label="Copy pin list" />}
          {pins.length > 0 && <button type="button" className="btn btn-ghost btn-sm" onClick={() => setPins([])}>Clear all</button>}
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between"><div className="label !mb-0">Pins</div><span className="text-xs text-mute">{pins.length} total</span></div>
          <ul className="max-h-[380px] space-y-2 overflow-y-auto pr-1">
            {pins.map((p, i) => (
              <li key={p.id} className="rounded-xl border border-line bg-card p-2.5">
                <div className="flex items-center gap-2">
                  <button type="button" aria-label="Change colour" className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 border-white text-[11px] font-extrabold text-white shadow" style={{ background: p.color }} onClick={() => setPins((ps) => ps.map((x) => x.id === p.id ? { ...x, color: PALETTE[(PALETTE.indexOf(x.color) + 1 + PALETTE.length) % PALETTE.length] } : x))}>{i + 1}</button>
                  <input className="input min-w-0 flex-1 !py-1.5 text-sm" value={p.label} placeholder={`Pin ${i + 1}`} aria-label={`Label for pin ${i + 1}`} onChange={(e) => setPins((ps) => ps.map((x) => x.id === p.id ? { ...x, label: e.target.value } : x))} />
                  <button type="button" className="btn btn-ghost btn-sm" aria-label="Remove pin" onClick={() => setPins((ps) => ps.filter((x) => x.id !== p.id))}>✕</button>
                </div>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <input className="input !py-1.5 font-mono text-xs" type="number" step="any" value={p.lat} aria-label={`Latitude for pin ${i + 1}`} onChange={(e) => setPins((ps) => ps.map((x) => x.id === p.id ? { ...x, lat: Math.max(-90, Math.min(90, Number(e.target.value))) } : x))} />
                  <input className="input !py-1.5 font-mono text-xs" type="number" step="any" value={p.lng} aria-label={`Longitude for pin ${i + 1}`} onChange={(e) => setPins((ps) => ps.map((x) => x.id === p.id ? { ...x, lng: Math.max(-180, Math.min(180, Number(e.target.value))) } : x))} />
                </div>
              </li>
            ))}
          </ul>
          {pins.length === 0 && <div className="rounded-lg bg-well px-3 py-4 text-center text-sm text-mute">No pins yet — search a place or click the map.</div>}
        </div>

        <div className="space-y-2 border-t border-line pt-3">
          <div className="label">Export & share</div>
          <div className="flex flex-wrap gap-2">
            <button type="button" className="btn btn-primary btn-sm" onClick={exportPng} disabled={!pins.length}>PNG image</button>
            <button type="button" className="btn btn-ghost btn-sm" disabled={!pins.length} onClick={() => downloadText("mapbench-pins.geojson", JSON.stringify(exportFc(), null, 2), "application/geo+json")}>GeoJSON</button>
            <button type="button" className="btn btn-ghost btn-sm" disabled={!pins.length} onClick={() => downloadText("mapbench-pins.kml", geojsonToKml(exportFc(), "Pin map"), "application/vnd.google-earth.kml+xml")}>KML</button>
            <button type="button" className="btn btn-ghost btn-sm" disabled={!pins.length} onClick={() => downloadText("mapbench-pins.csv", toCsv(["number", "name", "lat", "lng", "color"], pins.map((p, i) => [String(i + 1), p.label || `Pin ${i + 1}`, p.lat.toFixed(6), p.lng.toFixed(6), p.color])), "text/csv")}>CSV</button>
          </div>
          <p className="text-xs text-mute">The current pin set is also encoded in the page URL, so Copy link on the tool page preserves it.</p>
        </div>
      </div>

      <div className="order-1 lg:order-2">
        <DynamicMap center={pins[0] ? { lat: pins[0].lat, lng: pins[0].lng } : { lat: 20, lng: 0 }} zoom={pins.length ? 5 : 2} className="tall" onReady={(map, lib) => {
          mapRef.current = map;
          libRef.current = lib;
          pins.forEach((pin, index) => {
            const marker = new lib.Marker({ element: markerElement(pin, index), draggable: true }).setLngLat([pin.lng, pin.lat]).addTo(map);
            marker.on("dragend", () => {
              const ll = marker.getLngLat();
              setPins((items) => items.map((item) => item.id === pin.id ? { ...item, lat: ll.lat, lng: ll.lng } : item));
            });
            markerRefs.current.set(pin.id, marker);
          });
          map.on("click", (e: any) => addPin(e.lngLat.lat, e.lngLat.lng));
          setTimeout(fitAll, 100);
        }} />
      </div>
    </div>
  );
}
