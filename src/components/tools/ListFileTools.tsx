"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import type { Map as MLMap, GeoJSONSource } from "maplibre-gl";
import { distanceKm, fmt, fmtCoords, fmtDist, type LatLng } from "@/lib/geo";
import { downloadText, geojsonToGpx, geojsonToKml, toCsv } from "@/lib/formats";
import { ErrorBox, Field, FileDropzone, Spinner, Stat } from "@/components/ui";
import { DynamicMap, PALETTE, pinElement } from "./shared";

// Shared helpers

const EMPTY_FC: GeoJSON.FeatureCollection = { type: "FeatureCollection", features: [] };

function routeFc(coords: number[][]): GeoJSON.FeatureCollection {
  if (coords.length < 2) return EMPTY_FC;
  return { type: "FeatureCollection", features: [{ type: "Feature", properties: {}, geometry: { type: "LineString", coordinates: coords } }] };
}

function fitMap(map: MLMap, pts: LatLng[]) {
  if (!pts.length) return;
  if (pts.length === 1) { map.flyTo({ center: [pts[0].lng, pts[0].lat], zoom: 14, essential: true }); return; }
  let minLng = 180, maxLng = -180, minLat = 90, maxLat = -90;
  for (const p of pts) {
    minLng = Math.min(minLng, p.lng); maxLng = Math.max(maxLng, p.lng);
    minLat = Math.min(minLat, p.lat); maxLat = Math.max(maxLat, p.lat);
  }
  map.fitBounds([[minLng, minLat], [maxLng, maxLat]], { padding: 55, maxZoom: 16, duration: 600 });
}

function fmtDurationS(sec: number): string {
  const s = Math.max(0, Math.round(sec));
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), ss = s % 60;
  if (h > 0) return `${h}h ${String(m).padStart(2, "0")}m`;
  if (m > 0) return `${m}m ${String(ss).padStart(2, "0")}s`;
  return `${ss}s`;
}

function fmtClock(sec: number): string {
  const s = Math.max(0, Math.round(sec));
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), ss = s % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(ss).padStart(2, "0")}`;
}

// Mode 1: GPX heart-rate analyzer

interface HrPoint { lat: number; lng: number; ele: number | null; time: Date | null; hr: number | null; cumKm: number }
interface HrZone { label: string; range: string; count: number; pct: number }
interface HrResult {
  sourceName: string; points: HrPoint[]; totalKm: number; durationS: number | null;
  hrCount: number; avgHr: number | null; minHr: number | null; maxHr: number | null;
  gainM: number; hasEle: boolean; zones: HrZone[];
}

const HR_ZONES: { label: string; range: string; test: (hr: number) => boolean }[] = [
  { label: "Zone 1 · Easy", range: "Under 110", test: (h) => h < 110 },
  { label: "Zone 2 · Fat burn", range: "110–129", test: (h) => h >= 110 && h < 130 },
  { label: "Zone 3 · Aerobic", range: "130–149", test: (h) => h >= 130 && h < 150 },
  { label: "Zone 4 · Threshold", range: "150–169", test: (h) => h >= 150 && h < 170 },
  { label: "Zone 5 · Peak", range: "170+", test: (h) => h >= 170 },
];

/** Heart rate hides in <extensions> under names like <gpxtpx:hr> — match any descendant by localName. */
function findHr(pt: Element): number | null {
  for (const el of Array.from(pt.getElementsByTagName("*"))) {
    if (el.localName === "hr") {
      const v = parseFloat(el.textContent ?? "");
      if (Number.isFinite(v) && v > 0 && v < 260) return v;
    }
  }
  return null;
}

function parseGpxHr(text: string, sourceName: string): HrResult {
  const doc = new DOMParser().parseFromString(text, "application/xml");
  if (doc.querySelector("parsererror")) throw new Error("That file is not valid XML, so it could not be read as a GPX file.");
  if (!doc.getElementsByTagName("gpx").length) throw new Error("No GPX content found in this file. Export a .gpx track from your watch or app and try again.");
  const trkpts = Array.from(doc.getElementsByTagName("trkpt"));
  if (!trkpts.length) throw new Error("This GPX file has no track points (<trkpt>). Waypoint-only and route-only files have no heart-rate timeline to analyze.");

  const points: HrPoint[] = [];
  let totalKm = 0, gainM = 0, prev: LatLng | null = null, prevEle: number | null = null;
  for (const pt of trkpts) {
    const lat = parseFloat(pt.getAttribute("lat") ?? ""), lng = parseFloat(pt.getAttribute("lon") ?? "");
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue;
    const eleText = pt.getElementsByTagName("ele")[0]?.textContent;
    const eleParsed = eleText !== undefined && eleText !== "" ? parseFloat(eleText) : NaN;
    const ele = Number.isFinite(eleParsed) ? eleParsed : null;
    const timeText = pt.getElementsByTagName("time")[0]?.textContent;
    const timeParsed = timeText ? new Date(timeText) : null;
    const time = timeParsed && !isNaN(timeParsed.getTime()) ? timeParsed : null;
    const cur: LatLng = { lat, lng };
    if (prev) totalKm += distanceKm(prev, cur);
    if (ele !== null && prevEle !== null && ele > prevEle) gainM += ele - prevEle;
    if (ele !== null) prevEle = ele;
    prev = cur;
    points.push({ lat, lng, ele, time, hr: findHr(pt), cumKm: totalKm });
  }
  if (points.length < 2) throw new Error("This GPX file has fewer than two usable track points, so there is no track to analyze.");

  const times = points.map((p) => p.time).filter((t): t is Date => t !== null);
  const durationS = times.length >= 2 ? (times[times.length - 1].getTime() - times[0].getTime()) / 1000 : null;
  const hrs = points.map((p) => p.hr).filter((h): h is number => h !== null);
  // Zone share is measured over samples that carry both a timestamp and a heart rate when possible.
  const timedHr = points.filter((p) => p.hr !== null && p.time !== null);
  const zoneBase = timedHr.length ? timedHr : points.filter((p) => p.hr !== null);
  const zones: HrZone[] = HR_ZONES.map((z) => {
    const count = zoneBase.filter((p) => z.test(p.hr as number)).length;
    return { label: z.label, range: z.range, count, pct: zoneBase.length ? (count / zoneBase.length) * 100 : 0 };
  });

  return {
    sourceName, points, totalKm,
    durationS: durationS !== null && durationS > 0 ? durationS : null,
    hrCount: hrs.length,
    avgHr: hrs.length ? hrs.reduce((a, b) => a + b, 0) / hrs.length : null,
    minHr: hrs.length ? Math.min(...hrs) : null,
    maxHr: hrs.length ? Math.max(...hrs) : null,
    gainM, hasEle: points.some((p) => p.ele !== null), zones,
  };
}

function GpxHeartRateAnalyzer() {
  const [result, setResult] = useState<HrResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pasting, setPasting] = useState(false);
  const [pasteText, setPasteText] = useState("");
  const mapRef = useRef<MLMap | null>(null);
  const libRef = useRef<unknown>(null);
  const [mapReady, setMapReady] = useState(false);

  const loadText = (text: string, sourceName: string) => {
    setError(null);
    try {
      const parsed = parseGpxHr(text, sourceName);
      setResult(parsed);
      if (parsed.hrCount === 0) setError("This GPX has no heart-rate samples — many basic recorders and route planners don't store heart rate, so there is nothing to chart. The track itself is still drawn on the map.");
    } catch (e) {
      setResult(null);
      setError(e instanceof Error ? e.message : "That file could not be read as GPX.");
    }
  };

  const onFile = (f: File) => {
    const reader = new FileReader();
    reader.onload = () => loadText(String(reader.result ?? ""), f.name);
    reader.onerror = () => setError("The file could not be read from disk.");
    reader.readAsText(f);
  };

  const reset = () => { setResult(null); setError(null); setPasteText(""); setPasting(false); };

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;
    const coords = (result?.points ?? []).map((p) => [p.lng, p.lat]);
    (map.getSource("route") as GeoJSONSource | undefined)?.setData(routeFc(coords));
    if (result) fitMap(map, result.points);
  }, [result, mapReady]);

  const samples = useMemo(() => {
    if (!result) return [];
    const step = Math.max(1, Math.ceil(result.points.length / 24));
    return result.points
      .map((p, i) => ({ p, i }))
      .filter(({ i }) => i % step === 0 || i === result.points.length - 1);
  }, [result]);

  const firstTime = result?.points.find((p) => p.time !== null)?.time ?? null;

  const downloadCsv = () => {
    if (!result) return;
    const rows = result.points.map((p) => [
      p.time && firstTime ? Math.round((p.time.getTime() - firstTime.getTime()) / 1000) : "",
      Number((p.cumKm * 0.621371).toFixed(3)),
      p.hr ?? "",
      p.ele !== null ? Math.round(p.ele * 3.28084) : "",
    ]);
    downloadText("gpx-heart-rate.csv", toCsv(["offset_seconds", "distance_mi", "heart_rate_bpm", "elevation_ft"], rows), "text/csv");
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[400px,1fr]">
      <div className="card order-2 space-y-4 p-4 lg:order-1">
        <p className="text-sm leading-relaxed text-mute">
          Analyze a workout GPX from a GPS watch or an app like Strava or Garmin Connect: distance, duration, average and peak heart rate, time in each heart-rate zone, and elevation gain. The file is read locally in your browser — it is never uploaded.
        </p>

        {!result && (
          <>
            <FileDropzone onFile={onFile} accept=".gpx,application/gpx+xml">
              <span className="text-xs text-mute">GPX track files with heart-rate data work best</span>
            </FileDropzone>
            <div>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => setPasting((v) => !v)}>
                {pasting ? "Hide paste box" : "…or paste GPX text"}
              </button>
              {pasting && (
                <div className="mt-2 space-y-2">
                  <textarea className="textarea font-mono text-xs" rows={6} value={pasteText} onChange={(e) => setPasteText(e.target.value)} placeholder="<gpx>…</gpx>" />
                  <button type="button" className="btn btn-primary w-full" onClick={() => loadText(pasteText, "pasted.gpx")} disabled={!pasteText.trim()}>
                    Analyze pasted GPX
                  </button>
                </div>
              )}
            </div>
          </>
        )}

        {result && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="chip chip-brand">✓ {result.sourceName}</span>
            <span className="chip">{result.points.length.toLocaleString("en-US")} points</span>
            <button type="button" className="btn btn-ghost btn-sm ml-auto" onClick={reset}>Load another file</button>
          </div>
        )}

        {error && <ErrorBox>{error}</ErrorBox>}

        {result && (
          <>
            <div className="grid grid-cols-2 gap-2">
              <Stat label="Distance" value={fmtDist(result.totalKm, "mi")} sub={fmtDist(result.totalKm, "km")} />
              <Stat label="Duration" value={result.durationS !== null ? fmtDurationS(result.durationS) : "—"} sub={result.durationS !== null ? "first to last point" : "no timestamps"} />
              <Stat label="Average HR" value={result.avgHr !== null ? `${Math.round(result.avgHr)} bpm` : "No HR data"} />
              <Stat label="HR range" value={result.minHr !== null && result.maxHr !== null ? `${result.minHr}–${result.maxHr}` : "—"} sub={result.minHr !== null ? "min – max bpm" : undefined} />
              <Stat label="Elevation gain" value={result.hasEle ? `${Math.round(result.gainM * 3.28084).toLocaleString("en-US")} ft` : "No elevation"} sub={result.hasEle ? `${Math.round(result.gainM).toLocaleString("en-US")} m climbed` : undefined} />
              <Stat label="HR samples" value={result.hrCount.toLocaleString("en-US")} sub={`of ${result.points.length.toLocaleString("en-US")} track points`} />
            </div>

            {result.hrCount > 0 && (
              <div>
                <div className="label">Time in heart-rate zones</div>
                <div className="overflow-x-auto">
                  <table className="tbl">
                    <thead><tr><th>Zone</th><th>BPM</th><th className="text-right">Samples</th><th className="text-right">Share</th></tr></thead>
                    <tbody>
                      {result.zones.map((z) => (
                        <tr key={z.label}><td className="font-medium">{z.label}</td><td className="text-mute">{z.range}</td><td className="text-right">{z.count.toLocaleString("en-US")}</td><td className="text-right font-semibold">{fmt(z.pct, 1)}%</td></tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="mt-1 text-xs text-mute">Share of samples that carry both a timestamp and a heart-rate reading.</p>
              </div>
            )}

            <div>
              <div className="label">Samples along the track</div>
              <div className="max-h-72 overflow-y-auto rounded-lg border border-line">
                <table className="tbl">
                  <thead><tr><th>Time</th><th className="text-right">Dist (mi)</th><th className="text-right">HR</th><th className="text-right">Elev (ft)</th></tr></thead>
                  <tbody>
                    {samples.map(({ p, i }) => (
                      <tr key={i}><td className="text-mute">{p.time && firstTime ? fmtClock((p.time.getTime() - firstTime.getTime()) / 1000) : "—"}</td><td className="text-right">{fmt(p.cumKm * 0.621371, 2)}</td><td className="text-right">{p.hr !== null ? `${p.hr}` : "—"}</td><td className="text-right">{p.ele !== null ? Math.round(p.ele * 3.28084).toLocaleString("en-US") : "—"}</td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <button type="button" className="btn btn-ghost btn-sm mt-2" onClick={downloadCsv}>Download all points as CSV</button>
            </div>
          </>
        )}
      </div>
      <div className="order-1 lg:order-2">
        <DynamicMap center={{ lat: 39.5, lng: -98.35 }} zoom={3} className="tall" onReady={(map, lib) => {
          mapRef.current = map; libRef.current = lib;
          map.addSource("route", { type: "geojson", data: EMPTY_FC });
          map.addLayer({ id: "route-line", type: "line", source: "route", paint: { "line-color": PALETTE[1], "line-width": 3 } });
          setMapReady(true);
        }} />
      </div>
    </div>
  );
}

// Mode 2: Geotagged photo route (EXIF GPS, fully client-side)

interface ExifGps { lat: number; lng: number; date: Date | null }
interface PhotoPoint { name: string; lat: number; lng: number; time: Date; fromExif: boolean }

const TIFF_TYPE_SIZES: Record<number, number> = { 1: 1, 2: 1, 3: 2, 4: 4, 5: 8, 6: 1, 7: 1, 8: 2, 9: 4, 10: 8, 11: 4, 12: 8 };

/** Read GPS coordinates (and capture time when present) from a JPEG's EXIF block. Returns null when no GPS is stored. */
function parseExifGps(buffer: ArrayBuffer): ExifGps | null {
  try {
    const view = new DataView(buffer);
    const len = buffer.byteLength;
    if (len < 8 || view.getUint16(0) !== 0xffd8) return null;

    // Walk JPEG segments looking for APP1 with an "Exif\0\0" header.
    let tiff = -1;
    let offset = 2;
    while (offset + 4 <= len) {
      const marker = view.getUint16(offset);
      if ((marker & 0xff00) !== 0xff00 || marker === 0xffda || marker === 0xffd9) break;
      const segLen = view.getUint16(offset + 2);
      if (segLen < 2) break;
      const isExif = marker === 0xffe1 && offset + 10 <= len &&
        [0x45, 0x78, 0x69, 0x66, 0, 0].every((b, i) => view.getUint8(offset + 4 + i) === b);
      if (isExif) { tiff = offset + 10; break; }
      offset += 2 + segLen;
    }
    if (tiff < 0 || tiff + 8 > len) return null;

    const orderMark = view.getUint16(tiff);
    const little = orderMark === 0x4949;
    if (!little && orderMark !== 0x4d4d) return null;
    const u16 = (o: number) => view.getUint16(o, little);
    const u32 = (o: number) => view.getUint32(o, little);
    if (u16(tiff + 2) !== 42) return null;

    interface Entry { type: number; count: number; valueOff: number; entryOff: number }
    const readIfd = (ifdRel: number): Map<number, Entry> => {
      const entries = new Map<number, Entry>();
      const base = tiff + ifdRel;
      if (ifdRel <= 0 || base + 2 > len) return entries;
      const count = u16(base);
      for (let i = 0; i < count; i++) {
        const entryOff = base + 2 + i * 12;
        if (entryOff + 12 > len) break;
        const type = u16(entryOff + 2);
        const cnt = u32(entryOff + 4);
        const totalSize = (TIFF_TYPE_SIZES[type] ?? 1) * cnt;
        const valueOff = totalSize <= 4 ? entryOff + 8 : tiff + u32(entryOff + 8);
        entries.set(u16(entryOff), { type, count: cnt, valueOff, entryOff });
      }
      return entries;
    };
    const readAscii = (e: Entry | undefined): string => {
      if (!e) return "";
      let s = "";
      for (let i = 0; i < e.count && e.valueOff + i < len; i++) {
        const c = view.getUint8(e.valueOff + i);
        if (c === 0) break;
        s += String.fromCharCode(c);
      }
      return s;
    };
    const rational = (off: number): number => {
      if (off + 8 > len) return 0;
      const num = u32(off), den = u32(off + 4);
      return den === 0 ? 0 : num / den;
    };
    const readDms = (e: Entry | undefined): number => {
      if (!e || e.count < 3) return NaN;
      return rational(e.valueOff) + rational(e.valueOff + 8) / 60 + rational(e.valueOff + 16) / 3600;
    };
    const parseExifDate = (raw: string): Date | null => {
      const m = raw.match(/^(\d{4}):(\d{2}):(\d{2})\s+(\d{2}):(\d{2}):(\d{2})/);
      if (!m) return null;
      const d = new Date(+m[1], +m[2] - 1, +m[3], +m[4], +m[5], +m[6]);
      return isNaN(d.getTime()) ? null : d;
    };

    const ifd0 = readIfd(u32(tiff + 4));
    const gpsPtr = ifd0.get(0x8825);
    if (!gpsPtr) return null;
    const gps = readIfd(u32(gpsPtr.entryOff + 8));
    if (!gps.size) return null;

    let lat = readDms(gps.get(2));
    let lng = readDms(gps.get(4));
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
    if (readAscii(gps.get(1)).startsWith("S")) lat = -Math.abs(lat);
    if (readAscii(gps.get(3)).startsWith("W")) lng = -Math.abs(lng);
    if (Math.abs(lat) > 90 || Math.abs(lng) > 180 || (lat === 0 && lng === 0)) return null;

    let date: Date | null = null;
    const exifPtr = ifd0.get(0x8769);
    if (exifPtr) {
      const exifIfd = readIfd(u32(exifPtr.entryOff + 8));
      date = parseExifDate(readAscii(exifIfd.get(0x9003)));
    }
    if (!date) date = parseExifDate(readAscii(ifd0.get(0x0132)));
    return { lat, lng, date };
  } catch {
    return null;
  }
}

function PhotoRouteMapper() {
  const [photos, setPhotos] = useState<PhotoPoint[]>([]);
  const [skipped, setSkipped] = useState(0);
  const [total, setTotal] = useState(0);
  const [processed, setProcessed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mapRef = useRef<MLMap | null>(null);
  const libRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const [mapReady, setMapReady] = useState(false);

  const handleFiles = async (files: File[]) => {
    if (!files.length) return;
    setBusy(true);
    setError(null);
    const found: PhotoPoint[] = [];
    let skip = 0;
    for (const f of files) {
      try {
        const exif = parseExifGps(await f.arrayBuffer());
        if (exif) {
          found.push({ name: f.name, lat: exif.lat, lng: exif.lng, time: exif.date ?? new Date(f.lastModified), fromExif: exif.date !== null });
        } else skip++;
      } catch { skip++; }
    }
    found.sort((a, b) => a.time.getTime() - b.time.getTime());
    setPhotos(found);
    setSkipped(skip);
    setTotal(files.length);
    setProcessed(true);
    setBusy(false);
    if (!found.length) setError("None of the selected photos had GPS coordinates stored in their EXIF data. Location is often stripped by messaging apps and screenshots — try the original camera files.");
  };

  const totalKm = useMemo(() => {
    let d = 0;
    for (let i = 1; i < photos.length; i++) d += distanceKm(photos[i - 1], photos[i]);
    return d;
  }, [photos]);

  useEffect(() => {
    const map = mapRef.current, lib = libRef.current;
    if (!map || !lib || !mapReady) return;
    (map.getSource("route") as GeoJSONSource | undefined)?.setData(routeFc(photos.map((p) => [p.lng, p.lat])));
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];
    photos.forEach((p, i) => {
      const el = pinElement(PALETTE[i % PALETTE.length], String(i + 1));
      const marker = new lib.Marker({ element: el }).setLngLat([p.lng, p.lat]).addTo(map);
      el.addEventListener("click", () => {
        new lib.Popup({ closeButton: true }).setLngLat([p.lng, p.lat]).setText(`${i + 1}. ${p.name} — ${p.time.toLocaleString("en-US")}`).addTo(map);
      });
      markersRef.current.push(marker);
    });
    if (photos.length) fitMap(map, photos);
  }, [photos, mapReady]);

  const exportFc = (): GeoJSON.FeatureCollection => {
    const features: GeoJSON.Feature[] = photos.map((p, i) => ({
      type: "Feature", properties: { name: `${i + 1}. ${p.name}`, time: p.time.toISOString() }, geometry: { type: "Point", coordinates: [p.lng, p.lat] },
    }));
    if (photos.length > 1) features.push({ type: "Feature", properties: { name: "Photo route" }, geometry: { type: "LineString", coordinates: photos.map((p) => [p.lng, p.lat]) } });
    return { type: "FeatureCollection", features };
  };

  const spanS = photos.length > 1 ? (photos[photos.length - 1].time.getTime() - photos[0].time.getTime()) / 1000 : 0;

  return (
    <div className="grid gap-4 lg:grid-cols-[400px,1fr]">
      <div className="card order-2 space-y-4 p-4 lg:order-1">
        <p className="text-sm leading-relaxed text-mute">
          Turn a set of geotagged JPEG photos into a route on the map — handy for hikes, road trips, and site surveys. Photos are ordered by capture time and joined in that order.
        </p>
        <p className="rounded-lg border border-line bg-well/50 px-3 py-2 text-xs leading-relaxed text-mute">
          Privacy: your photos are read locally in your browser and never uploaded. Only the GPS coordinates and capture time stored inside each file are used.
        </p>

        <Field label="Choose JPEG photos">
          <input
            type="file"
            accept="image/jpeg,.jpg,.jpeg"
            multiple
            className="input"
            onChange={(e) => { const files = e.target.files ? Array.from(e.target.files) : []; void handleFiles(files); e.target.value = ""; }}
          />
        </Field>
        <p className="text-xs text-mute">Select several files at once (Ctrl/Cmd-click). HEIC and PNG files carry no EXIF GPS in this tool — use the original JPEGs.</p>

        {busy && <Spinner label="Reading EXIF data locally…" />}
        {error && <ErrorBox>{error}</ErrorBox>}
        {processed && skipped > 0 && photos.length > 0 && (
          <p className="text-sm text-mute">{skipped} photo{skipped !== 1 ? "s" : ""} had no GPS location stored and {skipped !== 1 ? "were" : "was"} skipped.</p>
        )}

        {processed && photos.length > 0 && (
          <>
            <div className="grid grid-cols-2 gap-2">
              <Stat label="Photos mapped" value={photos.length.toLocaleString("en-US")} sub={`of ${total.toLocaleString("en-US")} selected`} />
              <Stat label="Skipped (no GPS)" value={skipped.toLocaleString("en-US")} />
              <Stat label="Route distance" value={fmtDist(totalKm, "mi")} sub={fmtDist(totalKm, "km")} />
              <Stat label="Time span" value={spanS > 0 ? fmtDurationS(spanS) : "Single moment"} sub="first to last photo" />
            </div>

            <div>
              <div className="label">Route order (by capture time)</div>
              <ol className="max-h-80 space-y-1 overflow-y-auto">
                {photos.map((p, i) => (
                  <li key={`${p.name}-${i}`}>
                    <button
                      type="button"
                      className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm hover:bg-well"
                      onClick={() => {
                        const map = mapRef.current, lib = libRef.current;
                        if (!map || !lib) return;
                        new lib.Popup({ closeButton: true }).setLngLat([p.lng, p.lat]).setText(`${i + 1}. ${p.name} — ${p.time.toLocaleString("en-US")}`).addTo(map);
                        map.flyTo({ center: [p.lng, p.lat], zoom: Math.max(map.getZoom(), 14), essential: true });
                      }}
                    >
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white" style={{ background: PALETTE[i % PALETTE.length] }}>{i + 1}</span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-medium">{p.name}</span>
                        <span className="block text-xs text-mute">{p.time.toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}{p.fromExif ? "" : " (file date)"} · {fmtCoords(p)}</span>
                      </span>
                    </button>
                  </li>
                ))}
              </ol>
            </div>

            <div className="flex gap-2">
              <button type="button" className="btn btn-primary flex-1" onClick={() => downloadText("photo-route.gpx", geojsonToGpx(exportFc(), "Photo route"), "application/gpx+xml")}>Export GPX</button>
              <button type="button" className="btn btn-ghost flex-1" onClick={() => downloadText("photo-route.kml", geojsonToKml(exportFc(), "Photo route"), "application/vnd.google-earth.kml+xml")}>Export KML</button>
            </div>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => { setPhotos([]); setSkipped(0); setTotal(0); setProcessed(false); setError(null); }}>
              Clear photos
            </button>
          </>
        )}
      </div>
      <div className="order-1 lg:order-2">
        <DynamicMap center={{ lat: 30, lng: 10 }} zoom={1.8} className="tall" onReady={(map, lib) => {
          mapRef.current = map; libRef.current = lib;
          map.addSource("route", { type: "geojson", data: EMPTY_FC });
          map.addLayer({ id: "route-line", type: "line", source: "route", paint: { "line-color": PALETTE[0], "line-width": 3 } });
          setMapReady(true);
        }} />
      </div>
    </div>
  );
}

// Entry point

export default function ListFileTools({ params }: { params?: Record<string, unknown> }) {
  const mode = (params?.mode as string) ?? "gpx-hr";
  return mode === "photo-route" ? <PhotoRouteMapper /> : <GpxHeartRateAnalyzer />;
}
