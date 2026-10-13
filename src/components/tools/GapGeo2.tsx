"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import type { Map as MLMap, GeoJSONSource } from "maplibre-gl";
import { feature } from "topojson-client";
import { geoBounds, geoContains } from "d3-geo";
import { bboxOf, parseCoordPair, toDeg, toRad, type LatLng } from "@/lib/geo";
import { downloadText } from "@/lib/formats";
import { fmtDurationHours, sunTimes } from "@/lib/astronomy";
import { CopyBtn, ErrorBox, Field, Spinner, Stat, readUrlParams, syncUrl } from "@/components/ui";
import { DynamicMap, PALETTE, SectionTitle, pinElement, PlaceField, type PlaceValue } from "./shared";
import tzlookup from "tz-lookup";

// tz-lookup types come from src/types/tz-lookup.d.ts (repo-wide ambient declaration).

/** Minimal shape of a TopoJSON Topology — only the parts we touch. */
interface AtlasTopology {
  objects: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

function toDMS(lat: number, lng: number): string {
  const part = (v: number, pos: string, neg: string) => {
    const a = Math.abs(v);
    const d = Math.floor(a);
    const m = Math.floor((a - d) * 60);
    const s = (a - d) * 3600 - m * 60;
    return `${d}°${m}′${s.toFixed(1)}″${v >= 0 ? pos : neg}`;
  };
  return `${part(lat, "N", "S")} ${part(lng, "E", "W")}`;
}

/** Load Natural Earth 110m boundary data: bundled package first, CDN fallback. Never throws at build time. */
async function loadTopology(kind: "land" | "countries"): Promise<AtlasTopology> {
  try {
    const mod = kind === "land"
      ? await import("world-atlas/land-110m.json")
      : await import("world-atlas/countries-110m.json");
    const data = (mod as unknown as { default: unknown }).default ?? mod;
    return data as AtlasTopology;
  } catch {
    const res = await fetch(`https://cdn.jsdelivr.net/npm/world-atlas@2/${kind}-110m.json`);
    if (!res.ok) throw new Error(`Boundary data unavailable (HTTP ${res.status}). Check your connection and retry.`);
    return (await res.json()) as AtlasTopology;
  }
}

interface AtlasState { land: GeoJSON.FeatureCollection | null; countries: GeoJSON.FeatureCollection | null; error: string | null }

function useWorldAtlas(): AtlasState {
  const [state, setState] = useState<AtlasState>({ land: null, countries: null, error: null });
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [landTopo, countriesTopo] = await Promise.all([loadTopology("land"), loadTopology("countries")]);
        if (cancelled) return;
        const land = feature(
          landTopo as unknown as Parameters<typeof feature>[0],
          landTopo.objects.land as unknown as Parameters<typeof feature>[1],
        ) as unknown as GeoJSON.FeatureCollection;
        const countries = feature(
          countriesTopo as unknown as Parameters<typeof feature>[0],
          countriesTopo.objects.countries as unknown as Parameters<typeof feature>[1],
        ) as unknown as GeoJSON.FeatureCollection;
        setState({ land, countries, error: null });
      } catch (e) {
        if (!cancelled) setState({ land: null, countries: null, error: e instanceof Error ? e.message : "Could not load boundary data." });
      }
    })();
    return () => { cancelled = true; };
  }, []);
  return state;
}

function contains(obj: GeoJSON.FeatureCollection | GeoJSON.Feature, p: LatLng): boolean {
  // d3-geo types are narrow; the runtime accepts any GeoJSON object.
  return geoContains(obj as never, [p.lng, p.lat]);
}

/** True equal-area spherical sample: uniform in sin(latitude), uniform in longitude. */
function sampleSphere(): LatLng {
  const u = Math.random();
  const v = Math.random();
  return { lat: toDeg(Math.asin(2 * u - 1)), lng: 360 * v - 180 };
}

function countryNameOf(countries: GeoJSON.FeatureCollection, p: LatLng): string | null {
  const f = countries.features.find((ft) => contains(ft, p));
  const name = (f?.properties as { name?: string } | null)?.name;
  return typeof name === "string" && name ? name : null;
}

/** A sampled parallel (line of latitude) as a GeoJSON LineString. */
function parallelRing(lat: number): GeoJSON.Feature {
  const coords: [number, number][] = [];
  for (let lng = -180; lng <= 180; lng += 2) coords.push([lng, lat]);
  return { type: "Feature", properties: {}, geometry: { type: "LineString", coordinates: coords } };
}

function addLineLayer(map: MLMap, sourceId: string, layerId: string, data: GeoJSON.Feature, color: string) {
  if (map.getSource(sourceId)) (map.getSource(sourceId) as GeoJSONSource).setData(data);
  else {
    map.addSource(sourceId, { type: "geojson", data });
    map.addLayer({ id: layerId, type: "line", source: sourceId, paint: { "line-color": color, "line-width": 2.5 } });
  }
}

// ---------------------------------------------------------------------------
// 1. Latitude / longitude plotter
// ---------------------------------------------------------------------------

interface PlotPoint { id: number; lat: number; lng: number; raw: string }
interface ParseError { line: number; text: string }

export function LatLngPlotTool({ params }: { params?: Record<string, unknown> }) {
  void params;
  const [text, setText] = useState("40.7128, -74.0060\n51.5074, -0.1278\n35.6762° N, 139.6503° E");
  const [points, setPoints] = useState<PlotPoint[]>([]);
  const [errors, setErrors] = useState<ParseError[]>([]);
  const [plotted, setPlotted] = useState(false);
  const mapRef = useRef<MLMap | null>(null);
  const libRef = useRef<any>(null);
  const markersRef = useRef<Record<number, any>>({});
  const popupRef = useRef<any>(null);
  const nextId = useRef(1);

  const plot = () => {
    const pts: PlotPoint[] = [];
    const errs: ParseError[] = [];
    text.split("\n").forEach((line, i) => {
      const t = line.trim();
      if (!t) return;
      const p = parseCoordPair(t);
      if (p) pts.push({ id: nextId.current++, lat: p.lat, lng: p.lng, raw: t });
      else errs.push({ line: i + 1, text: t.length > 60 ? t.slice(0, 60) + "…" : t });
    });
    setPoints(pts);
    setErrors(errs);
    setPlotted(true);
  };

  const clear = () => {
    setPoints([]); setErrors([]); setPlotted(false); setText("");
  };

  useEffect(() => {
    const map = mapRef.current, lib = libRef.current;
    if (!map || !lib) return;
    const seen = new Set<number>();
    points.forEach((p, i) => {
      seen.add(p.id);
      if (!markersRef.current[p.id]) {
        const m = new lib.Marker({ element: pinElement(PALETTE[i % PALETTE.length], String(i + 1)) })
          .setLngLat([p.lng, p.lat])
          .addTo(map);
        m.getElement().addEventListener("click", (ev: Event) => {
          ev.stopPropagation();
          popupRef.current?.remove();
          popupRef.current = new lib.Popup({ offset: 25, closeButton: true })
            .setLngLat([p.lng, p.lat])
            .setHTML(`<div style="font:12px/1.5 system-ui;color:#111"><strong>Point ${i + 1}</strong><br>${p.lat.toFixed(5)}, ${p.lng.toFixed(5)}<br><span style="color:#555">${toDMS(p.lat, p.lng)}</span></div>`)
            .addTo(map);
        });
        markersRef.current[p.id] = m;
      }
    });
    for (const id of Object.keys(markersRef.current).map(Number)) {
      if (!seen.has(id)) { markersRef.current[id].remove(); delete markersRef.current[id]; }
    }
    if (points.length > 0 && mapRef.current) {
      const b = bboxOf(points);
      mapRef.current.fitBounds([[b[0][0], b[0][1]], [b[1][0], b[1][1]]], { padding: 50, maxZoom: 12 });
    }
  }, [points]);

  const removePoint = (id: number) => setPoints((ps) => ps.filter((p) => p.id !== id));

  const exportCsv = () => {
    const rows = ["index,latitude,longitude,input", ...points.map((p, i) => `${i + 1},${p.lat.toFixed(6)},${p.lng.toFixed(6)},"${p.raw.replace(/"/g, '""')}"`)];
    downloadText("mapbench-coordinates.csv", rows.join("\n"), "text/csv");
  };

  const fitBounds = () => {
    if (!mapRef.current || points.length === 0) return;
    const b = bboxOf(points);
    mapRef.current.fitBounds([[b[0][0], b[0][1]], [b[1][0], b[1][1]]], { padding: 50, maxZoom: 12 });
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[380px,1fr]">
      <div className="card order-2 space-y-4 p-4 lg:order-1">
        <Field label="Coordinates — one per line" hint='Accepts "40.7, -74", "40.7 -74", or 40.7° N 74° W'>
          <textarea
            className="input font-mono text-xs" rows={6} spellCheck={false}
            value={text} onChange={(e) => setText(e.target.value)}
            placeholder={"40.7128, -74.0060\n51.5074, -0.1278"}
            aria-label="Coordinates, one per line"
          />
        </Field>
        <div className="flex flex-wrap gap-2">
          <button type="button" className="btn btn-primary btn-sm" onClick={plot}>Plot on map</button>
          <button type="button" className="btn btn-ghost btn-sm" onClick={clear}>Clear</button>
          {points.length > 0 && (
            <>
              <button type="button" className="btn btn-ghost btn-sm" onClick={fitBounds}>Fit bounds</button>
              <button type="button" className="btn btn-ghost btn-sm" onClick={exportCsv}>Export CSV</button>
            </>
          )}
        </div>

        {plotted && errors.length > 0 && (
          <div className="space-y-1">
            <div className="text-xs font-bold uppercase tracking-wide text-mute">Could not parse ({errors.length})</div>
            {errors.slice(0, 8).map((e) => (
              <div key={e.line} className="rounded-md bg-well px-2 py-1 font-mono text-xs text-mute">line {e.line}: {e.text}</div>
            ))}
            {errors.length > 8 && <div className="text-xs text-mute">…and {errors.length - 8} more</div>}
          </div>
        )}

        {points.length > 0 ? (
          <div className="space-y-1.5">
            <div className="text-xs font-bold uppercase tracking-wide text-mute">Plotted points ({points.length})</div>
            <div className="max-h-64 space-y-1 overflow-y-auto pr-1">
              {points.map((p, i) => (
                <div key={p.id} className="flex items-center gap-2 rounded-lg border border-line px-2 py-1.5 text-xs">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white" style={{ background: PALETTE[i % PALETTE.length] }} aria-hidden>{i + 1}</span>
                  <span className="flex-1 truncate font-mono">{p.lat.toFixed(5)}, {p.lng.toFixed(5)}</span>
                  <button type="button" className="btn btn-ghost btn-sm !px-2" aria-label={`Remove point ${i + 1}`} onClick={() => removePoint(p.id)}>✕</button>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <p className="text-sm text-mute">{plotted ? "No valid coordinates found — check the format and try again." : "Paste coordinates above and press “Plot on map” — numbered pins appear here and on the map."}</p>
        )}
      </div>
      <div className="order-1 lg:order-2">
        <DynamicMap
          center={{ lat: 25, lng: 10 }} zoom={1.6} className="tall"
          onReady={(map, lib) => { mapRef.current = map; libRef.current = lib; }}
        />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 2. Random location generator (true equal-area sampling)
// ---------------------------------------------------------------------------

type RandMode = "anywhere" | "land" | "country";

interface RandResult { lat: number; lng: number; country: string | null; attempts: number }

export function RandomLocationTool({ params }: { params?: Record<string, unknown> }) {
  void params;
  const [mode, setMode] = useState<RandMode>("anywhere");
  const [country, setCountry] = useState("");
  const [result, setResult] = useState<RandResult | null>(null);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const atlas = useWorldAtlas();
  const mapRef = useRef<MLMap | null>(null);
  const libRef = useRef<any>(null);
  const markerRef = useRef<any>(null);

  const countryNames = useMemo(() => {
    if (!atlas.countries) return [];
    const names = atlas.countries.features
      .map((f) => (f.properties as { name?: string } | null)?.name)
      .filter((n): n is string => typeof n === "string" && n.length > 0);
    return [...new Set(names)].sort((a, b) => a.localeCompare(b));
  }, [atlas.countries]);

  const generate = () => {
    setError(null);
    if (mode !== "anywhere" && !atlas.land) { setError("Boundary data is still loading — please wait a moment."); return; }
    if (mode === "country" && !country) { setError("Pick a country first (type to search the list)."); return; }
    setGenerating(true);
    // Defer the tight rejection loop so the spinner paints first.
    setTimeout(() => {
      try {
        let p: LatLng; let attempts = 0;
        const MAX = 200000;
        if (mode === "anywhere") {
          p = sampleSphere(); attempts = 1;
        } else if (mode === "land" && atlas.land && atlas.countries) {
          let found: LatLng | null = null;
          while (attempts < MAX) {
            attempts++;
            const c = sampleSphere();
            if (contains(atlas.land, c)) { found = c; break; }
          }
          if (!found) throw new Error("Could not find a land point after many tries — please retry.");
          p = found;
        } else if (atlas.countries) {
          const feat = atlas.countries.features.find((f) => (f.properties as { name?: string } | null)?.name === country);
          if (!feat) throw new Error("Selected country was not found in the boundary data.");
          const [[w, s], [e, n]] = geoBounds(feat as never);
          const sinS = Math.sin(toRad(Math.max(s, -89.9)));
          const sinN = Math.sin(toRad(Math.min(n, 89.9)));
          const crosses = e < w;
          const span = crosses ? (180 - w) + (e + 180) : e - w;
          let found: LatLng | null = null;
          while (attempts < MAX) {
            attempts++;
            const lat = toDeg(Math.asin(Math.min(1, Math.max(-1, sinS + Math.random() * (sinN - sinS)))));
            let lng: number;
            if (!crosses) lng = w + Math.random() * span;
            else {
              const r = Math.random() * span;
              lng = r < 180 - w ? w + r : -180 + (r - (180 - w));
            }
            const c = { lat, lng: lng > 180 ? lng - 360 : lng < -180 ? lng + 360 : lng };
            if (contains(feat, c)) { found = c; break; }
          }
          if (!found) throw new Error("Could not sample inside that country — please retry.");
          p = found;
        } else {
          throw new Error("Boundary data is not ready yet.");
        }
        const cname = atlas.countries ? countryNameOf(atlas.countries, p) : null;
        setResult({ lat: p.lat, lng: p.lng, country: cname, attempts });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Generation failed — please retry.");
      } finally {
        setGenerating(false);
      }
    }, 40);
  };

  useEffect(() => {
    const map = mapRef.current, lib = libRef.current;
    if (!map || !lib || !result) return;
    if (!markerRef.current) {
      markerRef.current = new lib.Marker({ element: pinElement("#d95d32", "•") }).addTo(map);
    }
    markerRef.current.setLngLat([result.lng, result.lat]);
    map.flyTo({ center: [result.lng, result.lat], zoom: Math.max(map.getZoom(), 4), essential: true });
  }, [result]);

  return (
    <div className="grid gap-4 lg:grid-cols-[380px,1fr]">
      <div className="card order-2 space-y-4 p-4 lg:order-1">
        <Field label="Sampling mode">
          <select className="select" value={mode} onChange={(e) => { setMode(e.target.value as RandMode); setResult(null); }} aria-label="Sampling mode">
            <option value="anywhere">Anywhere on Earth</option>
            <option value="land">Land only</option>
            <option value="country">Inside a country</option>
          </select>
        </Field>
        {mode === "country" && (
          <Field label="Country" hint="Type to search the list">
            {atlas.countries ? (
              <input
                className="input" list="randloc-countries" value={country}
                onChange={(e) => setCountry(e.target.value)}
                placeholder="Start typing a country name…" aria-label="Country"
              />
            ) : atlas.error ? null : <Spinner label="Loading country list…" />}
            <datalist id="randloc-countries">
              {countryNames.map((n) => <option key={n} value={n} />)}
            </datalist>
          </Field>
        )}
        {mode !== "anywhere" && !atlas.land && !atlas.error && <Spinner label="Loading boundary data…" />}
        {atlas.error && <ErrorBox>{atlas.error} <button type="button" className="btn btn-ghost btn-sm ml-2" onClick={() => window.location.reload()}>Retry</button></ErrorBox>}

        <button
          type="button" className="btn btn-primary w-full"
          onClick={generate}
          disabled={generating || (mode !== "anywhere" && !atlas.land)}
        >
          {generating ? <Spinner label="Sampling…" /> : "Generate random location"}
        </button>
        {error && <ErrorBox>{error}</ErrorBox>}

        {result && (
          <div className="space-y-2 border-t border-line pt-3">
            <div className="grid grid-cols-2 gap-2">
              <Stat label="Latitude" value={result.lat.toFixed(5)} />
              <Stat label="Longitude" value={result.lng.toFixed(5)} />
            </div>
            {result.country && <Stat label="Country" value={result.country} />}
            <p className="text-xs text-mute">
              Found after {result.attempts.toLocaleString("en-US")} {result.attempts === 1 ? "try" : "tries"}.
              Sampling is equal-area on the sphere — every square kilometre of Earth is equally likely, so small countries are not over-represented.
            </p>
            <CopyBtn text={`${result.lat.toFixed(6)}, ${result.lng.toFixed(6)}`} label="Copy coordinates" />
          </div>
        )}
        {!result && !error && (
          <p className="text-sm text-mute">Press generate — a pin drops on a uniformly random point. “Land only” rejects ocean points against Natural Earth boundaries.</p>
        )}
      </div>
      <div className="order-1 lg:order-2">
        <DynamicMap
          center={{ lat: 25, lng: 10 }} zoom={1.6} className="tall"
          onReady={(map, lib) => { mapRef.current = map; libRef.current = lib; }}
        />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 3. US time zone map
// ---------------------------------------------------------------------------

const US_ZONES: { zone: string; label: string }[] = [
  { zone: "America/New_York", label: "Eastern" },
  { zone: "America/Chicago", label: "Central" },
  { zone: "America/Denver", label: "Mountain" },
  { zone: "America/Los_Angeles", label: "Pacific" },
  { zone: "America/Anchorage", label: "Alaska" },
  { zone: "Pacific/Honolulu", label: "Hawaii-Aleutian" },
];

function offsetMinutes(tz: string, d: Date): number {
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false,
  });
  const parts: Record<string, string> = {};
  for (const p of dtf.formatToParts(d)) parts[p.type] = p.value;
  const asUTC = Date.UTC(Number(parts.year), Number(parts.month) - 1, Number(parts.day), Number(parts.hour) % 24, Number(parts.minute), Number(parts.second));
  return Math.round((asUTC - d.getTime()) / 60000);
}

function fmtOffset(mins: number): string {
  const sign = mins < 0 ? "−" : "+";
  const a = Math.abs(mins);
  const h = Math.floor(a / 60);
  const m = a % 60;
  return `UTC${sign}${h}${m ? ":" + String(m).padStart(2, "0") : ""}`;
}

function dstStatus(tz: string): string {
  const jan = offsetMinutes(tz, new Date(Date.UTC(2025, 0, 15, 12)));
  const jul = offsetMinutes(tz, new Date(Date.UTC(2025, 6, 15, 12)));
  if (jan === jul) return "No daylight saving observed";
  const now = offsetMinutes(tz, new Date());
  return now === Math.max(jan, jul) ? "Daylight saving time in effect" : "Standard time in effect";
}

function clockStr(tz: string): string {
  return new Date().toLocaleTimeString("en-US", { timeZone: tz, hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true });
}

export function UsTimezoneTool({ params }: { params?: Record<string, unknown> }) {
  void params;
  const [point, setPoint] = useState<LatLng | null>(null);
  const [zone, setZone] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [locating, setLocating] = useState(false);
  const [locError, setLocError] = useState<string | null>(null);
  const [, setTick] = useState(0);
  const mapRef = useRef<MLMap | null>(null);
  const libRef = useRef<any>(null);
  const markerRef = useRef<any>(null);

  useEffect(() => {
    const t = setInterval(() => setTick((n) => n + 1), 1000);
    return () => clearInterval(t);
  }, []);

  const resolvePoint = (lat: number, lng: number) => {
    try {
      const z = tzlookup(lat, lng);
      setZone(z); setPoint({ lat, lng }); setNote(null); setLocError(null);
    } catch {
      setZone(null); setPoint({ lat, lng }); setLocError(null);
      setNote("That point looks like open water — time zones are defined for land areas, so click on land instead.");
    }
  };

  useEffect(() => {
    const map = mapRef.current, lib = libRef.current;
    if (!map || !lib || !point) return;
    if (!markerRef.current) markerRef.current = new lib.Marker({ element: pinElement("#0e7490") }).addTo(map);
    markerRef.current.setLngLat([point.lng, point.lat]);
  }, [point]);

  const useMyLocation = () => {
    if (!("geolocation" in navigator)) { setLocError("Geolocation is not available in this browser."); return; }
    setLocating(true); setLocError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => { setLocating(false); resolvePoint(pos.coords.latitude, pos.coords.longitude); },
      (err) => {
        setLocating(false);
        setLocError(err.code === err.PERMISSION_DENIED
          ? "Location permission was denied — allow it in the browser prompt, or click the map instead."
          : "Could not read your location — click the map instead.");
      },
      { timeout: 12000 }
    );
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[380px,1fr]">
      <div className="card order-2 space-y-4 p-4 lg:order-1">
        <button type="button" className="btn btn-primary w-full" onClick={useMyLocation} disabled={locating}>
          {locating ? <Spinner label="Locating…" /> : "Use my location"}
        </button>
        <p className="text-xs text-mute">…or click anywhere on the map. Time zone is resolved offline from coordinates — nothing leaves your browser.</p>
        {locError && <ErrorBox>{locError}</ErrorBox>}
        {note && <ErrorBox>{note}</ErrorBox>}

        {zone && point && (
          <div className="space-y-2 border-t border-line pt-3">
            <SectionTitle>Selected point</SectionTitle>
            <Stat label="Time zone" value={zone} sub={`${point.lat.toFixed(3)}, ${point.lng.toFixed(3)}`} />
            <div className="grid grid-cols-2 gap-2">
              <Stat label="Local time" value={clockStr(zone)} sub="updates every second" />
              <Stat label="UTC offset" value={fmtOffset(offsetMinutes(zone, new Date()))} sub={dstStatus(zone)} />
            </div>
          </div>
        )}

        <div className="space-y-2 border-t border-line pt-3">
          <SectionTitle>US zones — live</SectionTitle>
          <div className="grid grid-cols-2 gap-2">
            {US_ZONES.map((z) => (
              <button
                key={z.zone} type="button"
                onClick={() => { setZone(z.zone); setNote(null); }}
                className={`rounded-lg border p-2.5 text-left transition-colors ${zone === z.zone ? "border-brand bg-brand-soft" : "border-line bg-well hover:border-brand/50"}`}
                aria-pressed={zone === z.zone}
              >
                <div className="text-[11px] font-bold uppercase tracking-wide text-mute">{z.label}</div>
                <div className="mt-0.5 font-display text-base font-semibold tabular-nums">{clockStr(z.zone)}</div>
                <div className="text-xs text-mute">{fmtOffset(offsetMinutes(z.zone, new Date()))}</div>
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="order-1 lg:order-2">
        <DynamicMap
          center={{ lat: 39.8, lng: -98.5 }} zoom={3.2} className="tall"
          onReady={(map, lib) => {
            mapRef.current = map; libRef.current = lib;
            map.on("click", (e: any) => resolvePoint(e.lngLat.lat, e.lngLat.lng));
          }}
        />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 4. My elevation (GPS + Terrarium tile decode)
// ---------------------------------------------------------------------------

const TERR_Z = 13;

function tileXY(lat: number, lng: number): { x: number; y: number } {
  const n = 2 ** TERR_Z;
  const x = Math.min(n - 1, Math.max(0, Math.floor(((lng + 180) / 360) * n)));
  const latR = toRad(lat);
  const y = Math.min(n - 1, Math.max(0, Math.floor((((1 - Math.log(Math.tan(latR) + 1 / Math.cos(latR)) / Math.PI) / 2) * n))));
  return { x, y };
}

async function fetchTerrariumElevation(p: LatLng): Promise<number> {
  const { x, y } = tileXY(p.lat, p.lng);
  const url = `https://s3.amazonaws.com/elevation-tiles-prod/terrarium/${TERR_Z}/${x}/${y}.png`;
  const img = new Image();
  img.crossOrigin = "anonymous";
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = () => reject(new Error("elevation tile"));
    img.src = url;
  });
  const canvas = document.createElement("canvas");
  canvas.width = img.naturalWidth || 256;
  canvas.height = img.naturalHeight || 256;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) throw new Error("Canvas is not available in this browser.");
  ctx.drawImage(img, 0, 0);
  const n = 2 ** TERR_Z;
  const fx = ((((p.lng + 180) / 360) * n) - x) * canvas.width;
  const latR = toRad(p.lat);
  const fy = ((((1 - Math.log(Math.tan(latR) + 1 / Math.cos(latR)) / Math.PI) / 2) * n) - y) * canvas.height;
  const px = Math.min(canvas.width - 1, Math.max(0, Math.floor(fx)));
  const py = Math.min(canvas.height - 1, Math.max(0, Math.floor(fy)));
  const d = ctx.getImageData(px, py, 1, 1).data;
  return d[0] * 256 + d[1] + d[2] / 256 - 32768;
}

export function MyElevationTool({ params }: { params?: Record<string, unknown> }) {
  void params;
  const [place, setPlace] = useState<PlaceValue | null>(() => {
    const p = readUrlParams();
    const lat = parseFloat(p.get("lat") ?? ""), lng = parseFloat(p.get("lng") ?? "");
    return Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : null;
  });
  const [elevM, setElevM] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mapRef = useRef<MLMap | null>(null);
  const libRef = useRef<any>(null);
  const markerRef = useRef<any>(null);

  const lookup = async (p: LatLng) => {
    setLoading(true); setError(null); setElevM(null);
    syncUrl({ lat: p.lat.toFixed(5), lng: p.lng.toFixed(5) });
    try {
      const m = await fetchTerrariumElevation(p);
      setElevM(m);
      const map = mapRef.current;
      if (map) map.flyTo({ center: [p.lng, p.lat], zoom: Math.max(map.getZoom(), 11), essential: true });
    } catch {
      setError("Could not read the elevation tile for that point — check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const map = mapRef.current, lib = libRef.current;
    if (!map || !lib || !place) return;
    if (!markerRef.current) markerRef.current = new lib.Marker({ element: pinElement("#155e75") }).addTo(map);
    markerRef.current.setLngLat([place.lng, place.lat]);
  }, [place]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (place && !cancelled) await lookup(place);
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const useGps = () => {
    if (!("geolocation" in navigator)) { setError("Geolocation is not available in this browser — search a place instead."); return; }
    setLoading(true); setError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const p = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setPlace(p);
        void lookup(p);
      },
      (err) => {
        setLoading(false);
        setError(err.code === err.PERMISSION_DENIED
          ? "Location permission was denied — allow it in the browser prompt, or search a place instead."
          : "Could not read your location — search a place instead.");
      },
      { timeout: 12000 }
    );
  };

  const elevFt = elevM !== null ? elevM * 3.28084 : null;
  const gaugePct = elevM !== null ? Math.min(100, Math.max(0, ((elevM + 500) / 9500) * 100)) : 0;

  return (
    <div className="grid gap-4 lg:grid-cols-[380px,1fr]">
      <div className="card order-2 space-y-4 p-4 lg:order-1">
        <button type="button" className="btn btn-primary btn-lg w-full" onClick={useGps} disabled={loading}>
          {loading ? <Spinner label="Reading elevation…" /> : "Use my location"}
        </button>
        <PlaceField label="Or pick a place" value={place} onChange={(v) => { setPlace(v); if (v) void lookup(v); }} placeholder="Search a place or paste lat, lng" />
        {error && <ErrorBox>{error}</ErrorBox>}

        {elevM !== null && !loading && place && (
          <div className="space-y-3 border-t border-line pt-3">
            <div className="grid grid-cols-2 gap-2">
              <Stat label="Elevation" value={`${elevFt !== null ? Math.round(elevFt).toLocaleString("en-US") : "—"} ft`} sub={`${place.lat.toFixed(4)}, ${place.lng.toFixed(4)}`} />
              <Stat label="In meters" value={`${Math.round(elevM).toLocaleString("en-US")} m`} sub={elevM < 0 ? "below sea level" : "above sea level"} />
            </div>
            <div>
              <div className="relative h-2.5 rounded-full bg-well" role="img" aria-label={`Elevation gauge: ${Math.round(elevM)} meters`}>
                <div className="absolute top-1/2 h-4 w-1 -translate-y-1/2 rounded bg-brand" style={{ left: `calc(${gaugePct}% - 2px)` }} />
              </div>
              <div className="mt-1 flex justify-between text-[10px] text-mute">
                <span>−500 m</span><span>Dead Sea −430 m</span><span>Everest 8,849 m</span>
              </div>
            </div>
            <CopyBtn text={`${Math.round(elevM)} m (${Math.round(elevFt ?? 0)} ft) at ${place.lat.toFixed(5)}, ${place.lng.toFixed(5)}`} label="Copy result" />
          </div>
        )}
        {!place && !loading && (
          <p className="text-sm text-mute">Press the button for a one-tap GPS reading, or search any place on Earth.</p>
        )}
        <p className="text-xs text-mute">
          Elevation is decoded from a single 30&nbsp;m terrain-model pixel (Terrarium tiles, SRTM/ASTER based) — good for trip
          planning, not survey grade. Phone GPS altitude can differ by 10–30&nbsp;m.
        </p>
      </div>
      <div className="order-1 lg:order-2">
        <DynamicMap
          center={place ?? { lat: 25, lng: 10 }} zoom={place ? 11 : 1.6} className="tall"
          onReady={(map, lib) => {
            mapRef.current = map; libRef.current = lib;
            map.on("click", (e: any) => { const p = { lat: e.lngLat.lat, lng: e.lngLat.lng }; setPlace(p); void lookup(p); });
          }}
        />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 5. Arctic Circle
// ---------------------------------------------------------------------------

const ARCTIC_LAT = 66.5606;

const ARCTIC_COUNTRIES: { name: string; note: string }[] = [
  { name: "Norway", note: "Crosses the mainland north of Bodø and the Lofoten islands." },
  { name: "Sweden", note: "Passes through Lapland, just north of Jokkmokk." },
  { name: "Finland", note: "Runs through Finnish Lapland; Rovaniemi markets itself as sitting on the line." },
  { name: "Russia", note: "The longest Arctic Circle stretch of any country, across Siberia to Chukotka." },
  { name: "United States (Alaska)", note: "Crosses northern Alaska, including the Brooks Range." },
  { name: "Canada", note: "Passes through Yukon, the Northwest Territories and Nunavut." },
  { name: "Greenland (Denmark)", note: "Cuts across central Greenland's ice sheet." },
  { name: "Iceland", note: "Just grazes Grímsey, a small island off the north coast." },
];

export function ArcticTool({ params }: { params?: Record<string, unknown> }) {
  void params;
  const [click, setClick] = useState<{ lat: number; lng: number; day: string; note: string } | null>(null);
  const mapRef = useRef<MLMap | null>(null);
  const libRef = useRef<any>(null);
  const markerRef = useRef<any>(null);

  const onMapClick = (lat: number, lng: number) => {
    const d = new Date();
    const r = sunTimes(lat, lng, d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate());
    const day = r.dayLengthHours !== null ? fmtDurationHours(r.dayLengthHours) : "—";
    const note = r.polar === "day"
      ? "Midnight sun today — the Sun never sets at this point."
      : r.polar === "night"
        ? "Polar night today — the Sun never rises at this point."
        : "Normal day/night cycle today.";
    setClick({ lat, lng, day, note });
  };

  useEffect(() => {
    const map = mapRef.current, lib = libRef.current;
    if (!map || !lib || !click) return;
    if (!markerRef.current) markerRef.current = new lib.Marker({ element: pinElement("#0e7490") }).addTo(map);
    markerRef.current.setLngLat([click.lng, click.lat]);
  }, [click]);

  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-[1fr,380px]">
        <DynamicMap
          center={{ lat: 72, lng: -40 }} zoom={2.2} className="tall"
          onReady={(map, lib) => {
            mapRef.current = map; libRef.current = lib;
            addLineLayer(map, "arctic-src", "arctic-line", parallelRing(ARCTIC_LAT), "#0e7490");
            map.on("click", (e: any) => onMapClick(e.lngLat.lat, e.lngLat.lng));
          }}
        />
        <div className="card space-y-3 p-4">
          <SectionTitle>The Arctic Circle — 66.5606° N</SectionTitle>
          <p className="text-sm leading-relaxed text-mute">
            The Arctic Circle marks the southern limit of the polar day and polar night: north of this line there is at least
            one day a year when the Sun never sets, and one when it never rises. Click the map to check today&apos;s day length anywhere.
          </p>
          {click ? (
            <div className="grid grid-cols-2 gap-2">
              <Stat label="Day length" value={click.day} sub={`${click.lat.toFixed(2)}°, ${click.lng.toFixed(2)}°`} />
              <Stat label="Status" value={click.note.startsWith("Normal") ? "Normal" : click.note.startsWith("Midnight") ? "Midnight sun" : "Polar night"} sub={click.note} />
            </div>
          ) : (
            <p className="text-sm text-mute">Click the map for today&apos;s day length at that point.</p>
          )}
          <div className="grid grid-cols-3 gap-2 border-t border-line pt-3">
            <Stat label="At the circle" value="~1 day" sub="of midnight sun around Jun 21" />
            <Stat label="At the circle" value="~1 day" sub="of polar night around Dec 21" />
            <Stat label="At the pole" value="~6 months" sub="of continuous daylight" />
          </div>
        </div>
      </div>

      <div className="card p-4">
        <SectionTitle>Countries crossed by the Arctic Circle</SectionTitle>
        <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {ARCTIC_COUNTRIES.map((c) => (
            <div key={c.name} className="rounded-lg border border-line bg-well px-3 py-2.5">
              <div className="text-sm font-bold">{c.name}</div>
              <div className="mt-0.5 text-xs text-mute">{c.note}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="card p-4">
          <SectionTitle>Why it matters</SectionTitle>
          <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm text-mute">
            <li>Daylight grows with latitude: one day of midnight sun at the circle becomes about six months at the North Pole.</li>
            <li>The circle is not fixed — Earth&apos;s axial tilt slowly changes, so the line drifts about 14 metres per year.</li>
            <li>“Arctic” comes from the Greek <em>arktos</em>, bear — a nod to the constellations Ursa Major and Ursa Minor.</li>
            <li>Eight countries share Arctic territory, which is why the region matters for shipping routes, resources and climate science.</li>
          </ul>
        </div>
        <div className="card p-4">
          <SectionTitle>Midnight sun vs polar night</SectionTitle>
          <p className="mt-2 text-sm leading-relaxed text-mute">
            Around the June solstice the Northern Hemisphere tilts toward the Sun, so places north of the circle see the Sun skim
            the horizon without setting — the midnight sun. Around the December solstice the tilt reverses and the Sun stays below
            the horizon all day — the polar night. Both effects strengthen the further north you go.
          </p>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 6. Antarctic Circle
// ---------------------------------------------------------------------------

const ANTARCTIC_LAT = -66.5606;

const STATIONS: { name: string; operator: string; lat: number; lng: number; note: string }[] = [
  { name: "McMurdo Station", operator: "United States", lat: -77.8419, lng: 166.6863, note: "The largest Antarctic station; logistics hub on Ross Island." },
  { name: "Amundsen-Scott South Pole Station", operator: "United States", lat: -90, lng: 0, note: "Sits at the geographic South Pole; rebuilt on stilts against drifting snow." },
  { name: "Vostok Station", operator: "Russia", lat: -78.4646, lng: 106.8378, note: "Recorded −89.2 °C in 1983, the coldest temperature ever measured on Earth." },
  { name: "Concordia Station", operator: "France / Italy", lat: -75.0997, lng: 123.3327, note: "Year-round research on the high polar plateau, 3,233 m above sea level." },
];

export function AntarcticTool({ params }: { params?: Record<string, unknown> }) {
  void params;
  const mapRef = useRef<MLMap | null>(null);
  const libRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const popupRef = useRef<any>(null);

  useEffect(() => {
    // markersRef holds a plain array (never reassigned, only mutated), so reading
    // .current at cleanup time is intentional — it removes markers added later too.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    return () => { markersRef.current.forEach((m) => m.remove()); popupRef.current?.remove(); };
  }, []);

  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-[1fr,380px]">
        <DynamicMap
          center={{ lat: -78, lng: 0 }} zoom={2.2} className="tall"
          onReady={(map, lib) => {
            mapRef.current = map; libRef.current = lib;
            addLineLayer(map, "antarc-src", "antarc-line", parallelRing(ANTARCTIC_LAT), "#155e75");
            STATIONS.forEach((s, i) => {
              const m = new lib.Marker({ element: pinElement(PALETTE[i % PALETTE.length], String(i + 1)) })
                .setLngLat([s.lng, s.lat])
                .addTo(map);
              m.getElement().addEventListener("click", (ev: Event) => {
                ev.stopPropagation();
                popupRef.current?.remove();
                popupRef.current = new lib.Popup({ offset: 25, closeButton: true })
                  .setLngLat([s.lng, s.lat])
                  .setHTML(`<div style="font:12px/1.5 system-ui;color:#111"><strong>${s.name}</strong><br>${s.operator}<br><span style="color:#555">${s.lat.toFixed(4)}, ${s.lng.toFixed(4)}</span></div>`)
                  .addTo(map);
              });
              markersRef.current.push(m);
            });
          }}
        />
        <div className="card space-y-3 p-4">
          <SectionTitle>The Antarctic Circle — 66.5606° S</SectionTitle>
          <p className="text-sm leading-relaxed text-mute">
            The Antarctic Circle is the southern counterpart of the Arctic Circle: south of this line there is at least one day
            a year of midnight sun and one of polar night — with the seasons reversed. Click a station pin for details.
          </p>
          <div className="grid grid-cols-2 gap-2">
            <Stat label="Midnight sun" value="~Dec 21" sub="at the circle, one day" />
            <Stat label="Polar night" value="~Jun 21" sub="at the circle, one day" />
          </div>
          <div className="rounded-lg border border-line bg-well px-3 py-2.5 text-xs leading-relaxed text-mute">
            <strong className="text-ink">Antarctic Treaty (1959).</strong> In force since 1961, it reserves Antarctica for
            peaceful purposes and scientific cooperation; all territorial claims are held in abeyance.
          </div>
        </div>
      </div>

      <div className="card p-4">
        <SectionTitle>Research stations on the map</SectionTitle>
        <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {STATIONS.map((s, i) => (
            <div key={s.name} className="rounded-lg border border-line bg-well px-3 py-2.5">
              <div className="flex items-center gap-2">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white" style={{ background: PALETTE[i % PALETTE.length] }} aria-hidden>{i + 1}</span>
                <div className="text-sm font-bold leading-tight">{s.name}</div>
              </div>
              <div className="mt-1 text-xs text-mute">{s.operator} · {s.lat.toFixed(2)}°, {s.lng.toFixed(2)}°</div>
              <div className="mt-0.5 text-xs text-mute">{s.note}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="card p-4">
          <SectionTitle>Polar day and night, reversed</SectionTitle>
          <p className="mt-2 text-sm leading-relaxed text-mute">
            Because the seasons are opposite in the Southern Hemisphere, the Antarctic Circle&apos;s midnight sun falls around the
            December solstice and its polar night around the June solstice. At the South Pole itself the Sun stays up for about
            six months (roughly late September to late March) and down for six months.
          </p>
        </div>
        <div className="card p-4">
          <SectionTitle>Antarctica in numbers</SectionTitle>
          <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm text-mute">
            <li>Holds about 70% of the world&apos;s fresh water, locked in ice averaging over 2 km thick.</li>
            <li>No permanent residents — roughly 1,000 people overwinter, rising to about 4,000 in summer.</li>
            <li>Vostok&apos;s −89.2 °C (July 1983) remains the lowest temperature ever recorded on Earth.</li>
            <li>The continent is larger than Europe — about 14 million km², nearly all of it south of the circle.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
