"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { GeoJSONSource, Map as MLMap } from "maplibre-gl";
import { distanceKm, fmtCoords, type LatLng } from "@/lib/geo";
import { downloadText, toCsv } from "@/lib/formats";
import { CopyBtn, Stat } from "@/components/ui";
import { DynamicMap, pinElement } from "./shared";

interface LineDef {
  kind: "lat" | "lng";
  value: number;
  label: string;
  center: LatLng;
  zoom: number;
  fact: string;
  short: string;
}

const LINES: Record<string, LineDef> = {
  equator: { kind: "lat", value: 0, label: "Equator — 0° latitude", short: "Equator", center: { lat: 0, lng: 20 }, zoom: 2.2, fact: "40,075 km around — the only latitude that is a great circle." },
  "prime-meridian": { kind: "lng", value: 0, label: "Prime Meridian — 0° longitude", short: "Prime Meridian", center: { lat: 25, lng: 0 }, zoom: 2, fact: "Runs through Greenwich, London — the reference origin for longitude." },
  "date-line": { kind: "lng", value: 180, label: "International Date Line — near 180° longitude", short: "Date Line", center: { lat: 10, lng: 180 }, zoom: 2, fact: "The civil date boundary broadly follows 180° but bends around countries and island groups." },
  "tropic-cancer": { kind: "lat", value: 23.437, label: "Tropic of Cancer — 23.44° N", short: "Tropic of Cancer", center: { lat: 23.437, lng: 30 }, zoom: 2.2, fact: "Northern limit where the Sun can appear directly overhead near the June solstice." },
  "tropic-capricorn": { kind: "lat", value: -23.437, label: "Tropic of Capricorn — 23.44° S", short: "Tropic of Capricorn", center: { lat: -23.437, lng: -10 }, zoom: 2.2, fact: "Southern limit where the Sun can appear directly overhead near the December solstice." },
  arctic: { kind: "lat", value: 66.563, label: "Arctic Circle — 66.56° N", short: "Arctic Circle", center: { lat: 66.563, lng: 40 }, zoom: 2.4, fact: "Inside it, at least one day per year has 24-hour daylight and one has 24-hour darkness." },
  antarctic: { kind: "lat", value: -66.563, label: "Antarctic Circle — 66.56° S", short: "Antarctic Circle", center: { lat: -66.563, lng: 40 }, zoom: 2.4, fact: "The southern polar-circle reference, crossing Antarctica and the Southern Ocean region." },
};

function normalizeLng(lng: number) {
  return ((lng + 180) % 360 + 360) % 360 - 180;
}

function targetLng(value: number, clickedLng: number) {
  if (Math.abs(value) !== 180) return value;
  return clickedLng >= 0 ? 180 : -180;
}

export default function GeoLinesTool({ params }: { params?: Record<string, unknown> }) {
  const def = LINES[(params?.line as string) ?? "equator"] ?? LINES.equator;
  const [clicked, setClicked] = useState<LatLng | null>(null);
  const mapRef = useRef<MLMap | null>(null);
  const libRef = useRef<any>(null);
  const clickedMarkerRef = useRef<any>(null);
  const nearestMarkerRef = useRef<any>(null);

  const lineFeature = (): GeoJSON.Feature => {
    const coords: [number, number][] = [];
    if (def.kind === "lat") {
      for (let lng = -180; lng <= 180; lng += 2) coords.push([lng, def.value]);
    } else {
      const lineLng = def.value === 180 ? 179.999 : def.value;
      for (let lat = -85; lat <= 85; lat += 2) coords.push([lineLng, lat]);
    }
    return { type: "Feature", properties: {}, geometry: { type: "LineString", coordinates: coords } };
  };

  const analysis = useMemo(() => {
    if (!clicked) return null;
    const nearest: LatLng = def.kind === "lat"
      ? { lat: def.value, lng: clicked.lng }
      : { lat: clicked.lat, lng: targetLng(def.value, clicked.lng) };
    const distance = distanceKm(clicked, nearest);
    let side = "On the line";
    if (distance > 0.005) {
      if (def.kind === "lat") side = clicked.lat > def.value ? "North of line" : "South of line";
      else {
        const delta = normalizeLng(clicked.lng - targetLng(def.value, clicked.lng));
        side = delta > 0 ? "East of line" : "West of line";
      }
    }
    return { nearest, distance, side };
  }, [clicked, def]);

  const connectorFeature = (): GeoJSON.FeatureCollection => ({
    type: "FeatureCollection",
    features: analysis && clicked ? [{
      type: "Feature",
      properties: {},
      geometry: {
        type: "LineString",
        coordinates: [[clicked.lng, clicked.lat], [analysis.nearest.lng, analysis.nearest.lat]],
      },
    }] : [],
  });

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    (map.getSource("geoline") as GeoJSONSource | undefined)?.setData(lineFeature());
    (map.getSource("connector") as GeoJSONSource | undefined)?.setData(connectorFeature());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params?.line, clicked]);

  useEffect(() => {
    if (!clicked || !analysis || !mapRef.current || !libRef.current) return;
    if (!clickedMarkerRef.current) {
      clickedMarkerRef.current = new libRef.current.Marker({ element: pinElement("#1d6e63") })
        .setLngLat([clicked.lng, clicked.lat]).addTo(mapRef.current);
    } else clickedMarkerRef.current.setLngLat([clicked.lng, clicked.lat]);

    if (!nearestMarkerRef.current) {
      nearestMarkerRef.current = new libRef.current.Marker({ element: pinElement("#d95d32") })
        .setLngLat([analysis.nearest.lng, analysis.nearest.lat]).addTo(mapRef.current);
    } else nearestMarkerRef.current.setLngLat([analysis.nearest.lng, analysis.nearest.lat]);
  }, [clicked, analysis]);

  const exportCsv = () => {
    if (!clicked || !analysis) return;
    downloadText(
      `mapbench-${def.short.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-measurement.csv`,
      toCsv(["Field", "Value"], [
        ["Reference line", def.label],
        ["Selected latitude", clicked.lat.toFixed(6)],
        ["Selected longitude", clicked.lng.toFixed(6)],
        ["Nearest latitude", analysis.nearest.lat.toFixed(6)],
        ["Nearest longitude", analysis.nearest.lng.toFixed(6)],
        ["Distance km", analysis.distance.toFixed(3)],
        ["Distance miles", (analysis.distance * 0.621371).toFixed(3)],
        ["Position", analysis.side],
      ]),
      "text/csv",
    );
  };

  const copySummary = clicked && analysis ? [
    def.label,
    `Selected point: ${fmtCoords(clicked)}`,
    `Nearest point on line: ${fmtCoords(analysis.nearest)}`,
    `Distance: ${analysis.distance.toFixed(2)} km (${(analysis.distance * 0.621371).toFixed(2)} mi)`,
    `Position: ${analysis.side}`,
  ].join("\n") : "";

  return (
    <div className="space-y-4">
      <div className="card flex flex-wrap items-center justify-between gap-3 p-4">
        <div>
          <div className="chip chip-brand">{def.label}</div>
          <p className="mt-2 max-w-3xl text-sm text-mute">{def.fact}</p>
        </div>
        <button type="button" className="btn btn-ghost btn-sm" onClick={() => {
          setClicked(def.center);
          mapRef.current?.flyTo({ center: [def.center.lng, def.center.lat], zoom: def.zoom + 1, essential: true });
        }}>Use example point</button>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr,340px]">
        <div className="card overflow-hidden">
          <div className="border-b border-line px-4 py-3">
            <div className="label !mb-0">Interactive line map</div>
            <p className="mt-1 text-xs text-mute">Click anywhere to measure the shortest surface distance to the highlighted latitude or meridian.</p>
          </div>
          <DynamicMap
            center={def.center} zoom={def.zoom} className="tall"
            onReady={(map, lib) => {
              mapRef.current = map;
              libRef.current = lib;
              map.addSource("geoline", { type: "geojson", data: lineFeature() });
              map.addLayer({ id: "geoline-glow", type: "line", source: "geoline", paint: { "line-color": "#d95d32", "line-width": 8, "line-opacity": 0.22 } });
              map.addLayer({ id: "geoline", type: "line", source: "geoline", paint: { "line-color": "#d95d32", "line-width": 2.5 } });
              map.addSource("connector", { type: "geojson", data: connectorFeature() });
              map.addLayer({ id: "connector", type: "line", source: "connector", paint: { "line-color": "#1d6e63", "line-width": 2, "line-dasharray": [2, 2] } });
              map.on("click", (e: any) => setClicked({ lat: e.lngLat.lat, lng: e.lngLat.lng }));
            }}
          />
        </div>

        <div className="space-y-3">
          {clicked && analysis ? (
            <>
              <div className="grid grid-cols-2 gap-2">
                <Stat label="Distance" value={`${analysis.distance.toFixed(2)} km`} sub={`${(analysis.distance * 0.621371).toFixed(2)} miles`} />
                <Stat label="Position" value={analysis.side} />
                <Stat label="Selected point" value={`${clicked.lat.toFixed(4)}°, ${clicked.lng.toFixed(4)}°`} />
                <Stat label="Nearest point" value={`${analysis.nearest.lat.toFixed(4)}°, ${analysis.nearest.lng.toFixed(4)}°`} />
              </div>
              <div className="card space-y-3 p-4">
                <div>
                  <div className="label">Selected coordinates</div>
                  <div className="font-mono text-sm font-semibold">{fmtCoords(clicked)}</div>
                </div>
                <div>
                  <div className="label">Nearest point on {def.short}</div>
                  <div className="font-mono text-sm font-semibold">{fmtCoords(analysis.nearest)}</div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <CopyBtn text={copySummary} label="Copy analysis" />
                  <button type="button" className="btn btn-ghost btn-sm" onClick={exportCsv}>CSV</button>
                  <button type="button" className="btn btn-primary btn-sm" onClick={() => {
                    setClicked(analysis.nearest);
                    mapRef.current?.flyTo({ center: [analysis.nearest.lng, analysis.nearest.lat], zoom: Math.max(mapRef.current?.getZoom() ?? 5, 5), essential: true });
                  }}>Snap point to line</button>
                </div>
              </div>
            </>
          ) : (
            <div className="card p-5">
              <h3 className="font-display text-lg font-bold">Measure from any point</h3>
              <p className="mt-2 text-sm leading-relaxed text-mute">Click the map to calculate the nearest point on {def.short}, the surface distance to it and which side of the line your point lies on.</p>
            </div>
          )}

          <div className="card p-4">
            <div className="label">Reference value</div>
            <div className="mt-1 font-display text-xl font-bold">{def.kind === "lat" ? `${Math.abs(def.value).toFixed(3)}° ${def.value > 0 ? "N" : def.value < 0 ? "S" : "latitude"}` : def.value === 180 ? "±180° longitude" : `${Math.abs(def.value).toFixed(3)}° ${def.value >= 0 ? "E" : "W"}`}</div>
            <p className="mt-2 text-xs leading-relaxed text-mute">Distance is measured as a great-circle surface distance from the selected point to the nearest same-longitude/same-latitude point on the reference line.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
