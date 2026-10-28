"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import type { Map as MLMap, GeoJSONSource } from "maplibre-gl";
import { destination, distanceKm, fmtDist, kmTo, toKm, type LatLng, type UnitKey } from "@/lib/geo";
import { geojsonToGpx, geojsonToKml, downloadText } from "@/lib/formats";
import { readUrlParams, syncUrl, Field } from "@/components/ui";
import { DynamicMap, PALETTE, pinElement, type PlaceValue } from "./shared";
import LocationSearch from "@/components/LocationSearch";

interface Circle { id: number; center: LatLng; radiusKm: number }

const PRESETS = [5, 10, 25, 50, 100];

function circlePolygon(c: Circle): GeoJSON.Feature {
  const coords: [number, number][] = [];
  for (let i = 0; i <= 128; i++) {
    const p = destination(c.center, (i / 128) * 360, c.radiusKm);
    coords.push([p.lng, p.lat]);
  }
  return { type: "Feature", properties: { radiusKm: c.radiusKm }, geometry: { type: "Polygon", coordinates: [coords] } };
}

export default function RadiusTool({ params }: { params?: Record<string, unknown> }) {
  const multi = !!params?.multi;
  const rings = !!params?.rings;
  const [unit, setUnit] = useState<UnitKey>(() => {
    const u = readUrlParams().get("u") as UnitKey | null;
    return u && ["km", "mi", "nmi", "m", "ft"].includes(u) ? u : "mi";
  });
  const [circles, setCircles] = useState<Circle[]>(() => {
    const p = readUrlParams();
    const lat = parseFloat(p.get("lat") ?? ""), lng = parseFloat(p.get("lng") ?? "");
    const r = parseFloat(p.get("r") ?? "");
    if (Number.isFinite(lat) && Number.isFinite(lng) && Number.isFinite(r)) return [{ id: 1, center: { lat, lng }, radiusKm: r }];
    return [{ id: 1, center: { lat: 40.7549, lng: -73.984 }, radiusKm: toKm(10, "mi") }];
  });
  const [ringCount, setRingCount] = useState(5);
  const mapRef = useRef<MLMap | null>(null);
  const libRef = useRef<any>(null);
  const centerMarkers = useRef<Record<number, any>>({});
  const edgeMarkers = useRef<Record<number, any>>({});
  const nextId = useRef(2);

  const effectiveCircles = useMemo<Circle[]>(() => {
    if (!rings) return circles;
    const base = circles[0];
    if (!base) return [];
    const step = base.radiusKm / ringCount;
    return Array.from({ length: ringCount }, (_, i) => ({ id: i + 1, center: base.center, radiusKm: step * (i + 1) }));
  }, [circles, rings, ringCount]);

  const draw = () => {
    const map = mapRef.current, lib = libRef.current;
    if (!map || !lib) return;
    const fc: GeoJSON.FeatureCollection = { type: "FeatureCollection", features: effectiveCircles.map((c) => {
      const f = circlePolygon(c);
      (f.properties as any).color = PALETTE[(c.id - 1) % PALETTE.length];
      return f;
    }) };
    const src = map.getSource("rad") as GeoJSONSource | undefined;
    if (src) src.setData(fc);
    const seen = new Set<number>();
    for (const c of circles) {
      seen.add(c.id);
      if (!centerMarkers.current[c.id]) {
        const m = new lib.Marker({ element: pinElement(PALETTE[(c.id - 1) % PALETTE.length]), draggable: true })
          .setLngLat([c.center.lng, c.center.lat])
          .addTo(map);
        m.on("drag", () => {
          const ll = m.getLngLat();
          setCircles((cs) => cs.map((x) => x.id === c.id ? { ...x, center: { lat: ll.lat, lng: ll.lng } } : x));
        });
        centerMarkers.current[c.id] = m;
      } else centerMarkers.current[c.id].setLngLat([c.center.lng, c.center.lat]);
      const edgePos = destination(c.center, 90, c.radiusKm);
      if (!edgeMarkers.current[c.id]) {
        const el = document.createElement("div");
        el.style.cssText = "width:14px;height:14px;border-radius:50%;background:#fff;border:3px solid #d95d32;cursor:grab;box-shadow:0 1px 4px rgba(0,0,0,.4)";
        const em = new lib.Marker({ element: el, draggable: true }).setLngLat([edgePos.lng, edgePos.lat]).addTo(map);
        em.on("drag", () => {
          const ll = em.getLngLat();
          setCircles((cs) => cs.map((x) => {
            if (x.id !== c.id) return x;
            const d = distanceKm(x.center, { lat: ll.lat, lng: ll.lng });
            return { ...x, radiusKm: Math.max(0.05, d) };
          }));
        });
        edgeMarkers.current[c.id] = em;
      } else edgeMarkers.current[c.id].setLngLat([edgePos.lng, edgePos.lat]);
    }
    for (const id of Object.keys(centerMarkers.current).map(Number)) {
      if (!seen.has(id)) { centerMarkers.current[id].remove(); delete centerMarkers.current[id]; edgeMarkers.current[id]?.remove(); delete edgeMarkers.current[id]; }
    }
  };

  useEffect(() => { draw(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [circles, ringCount, effectiveCircles]);
  useEffect(() => {
    const c = circles[0];
    if (c && !multi && !rings) syncUrl({ lat: c.center.lat.toFixed(5), lng: c.center.lng.toFixed(5), r: c.radiusKm.toFixed(3), u: unit });
  }, [circles, unit, multi, rings]);

  const setRadius = (v: number) => setCircles((cs) => cs.map((c, i) => i === 0 ? { ...c, radiusKm: toKm(v, unit) } : c));
  const setCenter = (p: PlaceValue) => {
    setCircles((cs) => cs.map((c, i) => i === 0 ? { ...c, center: { lat: p.lat, lng: p.lng } } : c));
    if (mapRef.current) mapRef.current.flyTo({ center: [p.lng, p.lat], zoom: Math.max(mapRef.current.getZoom(), 10), essential: true });
  };

  const currentRadiusDisplay = Number(kmTo(circles[0]?.radiusKm ?? 0, unit).toFixed(unit === "mi" || unit === "km" ? 1 : 2));
  const exportFc: GeoJSON.FeatureCollection = { type: "FeatureCollection", features: effectiveCircles.map(circlePolygon) };

  const radiusKm = circles[0]?.radiusKm ?? 0;
  const areaStr = fmtArea(radiusKm, unit);
  const periStr = fmtDist(2 * Math.PI * radiusKm, unit);
  const diamStr = fmtDist(2 * radiusKm, unit);

  return (
    <div className="grid gap-4 lg:grid-cols-[380px,1fr]">
      <div className="card order-2 space-y-4 p-4 lg:order-1">
        <Field label="Center location">
          <LocationSearch placeholder="Search address, city or landmark…" onSelect={(h) => setCenter(h)} />
        </Field>
        <p className="text-xs text-mute">Click the map to set center · Drag the orange handle to resize</p>

        {/* Unit toggle — competitor style */}
        {!rings && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              className={`btn btn-sm flex-1 ${unit === "mi" ? "btn-primary" : "btn-ghost"}`}
              onClick={() => setUnit("mi")}
            >Miles</button>
            <button
              type="button"
              className={`btn btn-sm flex-1 ${unit === "km" ? "btn-primary" : "btn-ghost"}`}
              onClick={() => setUnit("km")}
            >Kilometers</button>
          </div>
        )}

        {!rings && (
          <>
            <Field label={`Radius (${unit === "mi" ? "mi" : unit === "km" ? "km" : unit})`}>
              <input
                type="number" min={0.01} step="any" className="input"
                value={currentRadiusDisplay}
                onChange={(e) => setRadius(Math.max(0.01, parseFloat(e.target.value) || 0.01))}
              />
            </Field>

            {/* Preset buttons — like SimpleMapLab */}
            <div className="flex flex-wrap gap-1.5">
              {PRESETS.map((p) => {
                const isActive = Math.abs(currentRadiusDisplay - p) < 0.05;
                return (
                  <button
                    key={p}
                    type="button"
                    className={`btn btn-sm ${isActive ? "btn-primary" : "btn-ghost"}`}
                    onClick={() => setRadius(p)}
                  >{p}</button>
                );
              })}
            </div>
          </>
        )}

        {rings && (
          <div className="grid grid-cols-2 gap-3">
            <Field label="Rings">
              <select className="select" value={ringCount} onChange={(e) => setRingCount(parseInt(e.target.value))}>
                {[3, 4, 5, 6, 8, 10, 12].map((n) => <option key={n} value={n}>{n} rings</option>)}
              </select>
            </Field>
            <Field label={`Outer radius (${unit})`}>
              <input
                type="number" min={0.1} step="any" className="input"
                value={Number(kmTo(circles[0]?.radiusKm ?? 0, unit).toFixed(3))}
                onChange={(e) => setRadius(Math.max(0.1, parseFloat(e.target.value) || 0.1))}
              />
            </Field>
          </div>
        )}
        {rings && <p className="text-xs text-mute">Ring interval: {fmtDist((circles[0]?.radiusKm ?? 0) / ringCount, unit)}</p>}

        {multi && !rings && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="label">All circles</span>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => setCircles((cs) => cs.slice(0, 1))}>Clear extra</button>
            </div>
            {circles.map((c, i) => (
              <div key={c.id} className="flex items-center gap-2 rounded-lg border border-line p-2 text-sm">
                <span className="h-3 w-3 shrink-0 rounded-full" style={{ background: PALETTE[(c.id - 1) % PALETTE.length] }} aria-hidden />
                <span className="flex-1 truncate text-xs text-mute">{c.center.lat.toFixed(4)}, {c.center.lng.toFixed(4)}</span>
                <input
                  type="number" step="any" min={0.05} className="input !w-20 !px-2 !py-1 text-xs"
                  value={Number(kmTo(c.radiusKm, unit).toFixed(2))}
                  aria-label={`Circle ${i + 1} radius`}
                  onChange={(e) => setCircles((cs) => cs.map((x) => x.id === c.id ? { ...x, radiusKm: toKm(parseFloat(e.target.value) || 0.05, unit) } : x))}
                />
                <button type="button" className="btn btn-ghost btn-sm" aria-label={`Remove circle ${i + 1}`} onClick={() => setCircles((cs) => cs.length > 1 ? cs.filter((x) => x.id !== c.id) : cs)}>✕</button>
              </div>
            ))}
            <button
              type="button" className="btn btn-ghost w-full"
              onClick={() => {
                const base = circles[0];
                const center = destination(base.center, 45, 15 * circles.length);
                setCircles((cs) => [...cs, { id: nextId.current++, center, radiusKm: base.radiusKm }]);
              }}
            >+ Add circle</button>
          </div>
        )}

        {/* Stats — Area / Perimeter / Diameter */}
        <div className="space-y-2 border-t border-line pt-3">
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="rounded-lg bg-well px-2 py-2">
              <div className="text-[10px] font-bold uppercase tracking-wide text-mute">Area</div>
              <div className="mt-0.5 text-sm font-bold text-ink">{areaStr}</div>
            </div>
            <div className="rounded-lg bg-well px-2 py-2">
              <div className="text-[10px] font-bold uppercase tracking-wide text-mute">Perimeter</div>
              <div className="mt-0.5 text-sm font-bold text-ink">{periStr}</div>
            </div>
            <div className="rounded-lg bg-well px-2 py-2">
              <div className="text-[10px] font-bold uppercase tracking-wide text-mute">Diameter</div>
              <div className="mt-0.5 text-sm font-bold text-ink">{diamStr}</div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 pt-1">
            <button type="button" className="btn btn-primary btn-sm" onClick={() => downloadText("mapbench-radius.geojson", JSON.stringify(exportFc, null, 2), "application/geo+json")}>Export GeoJSON</button>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => downloadText("mapbench-radius.kml", geojsonToKml(exportFc, "Radius circles"), "application/vnd.google-earth.kml+xml")}>KML</button>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => downloadText("mapbench-radius.gpx", geojsonToGpx(exportFc, "Radius circles"), "application/gpx+xml")}>GPX</button>
            {!rings && (
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => setCircles([{ id: 1, center: circles[0]?.center ?? { lat: 40.7549, lng: -73.984 }, radiusKm: toKm(10, unit) }])}
              >Clear</button>
            )}
          </div>
        </div>
      </div>
      <div className="order-1 lg:order-2">
        <DynamicMap
          center={circles[0]?.center ?? { lat: 40.7549, lng: -73.984 }}
          zoom={11}
          className="tall"
          onReady={(map, lib) => {
            mapRef.current = map; libRef.current = lib;
            map.addSource("rad", { type: "geojson", data: { type: "FeatureCollection", features: [] } });
            map.addLayer({ id: "rad-fill", type: "fill", source: "rad", paint: { "fill-color": ["get", "color"], "fill-opacity": 0.14 } });
            map.addLayer({ id: "rad-line", type: "line", source: "rad", paint: { "line-color": ["get", "color"], "line-width": 2 } });
            map.on("click", (e: any) => {
              setCircles((cs) => cs.map((c, i) => i === 0 ? { ...c, center: { lat: e.lngLat.lat, lng: e.lngLat.lng } } : c));
            });
            draw();
          }}
        />
      </div>
    </div>
  );
}

function fmtArea(radiusKm: number, unit: UnitKey) {
  const areaKm2 = Math.PI * radiusKm * radiusKm;
  const perUnit: Record<UnitKey, [number, string]> = {
    km: [1, "km²"], mi: [0.386102, "mi²"], nmi: [0.291553, "NM²"], m: [1e6, "m²"], ft: [10763910, "ft²"],
  };
  const [f, l] = perUnit[unit] ?? perUnit.mi;
  return `${(areaKm2 * f).toLocaleString("en-US", { maximumFractionDigits: areaKm2 * f > 1000 ? 0 : 2 })} ${l}`;
}
