// Geographic file formats: CSV parsing/writing, GeoJSON → KML / GPX conversion, downloads.

export function downloadText(filename: string, text: string, mime = "text/plain") {
  const blob = new Blob([text], { type: `${mime};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

export function downloadDataUrl(filename: string, dataUrl: string) {
  const a = document.createElement("a");
  a.href = dataUrl; a.download = filename;
  document.body.appendChild(a); a.click(); a.remove();
}

export const escapeXml = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&apos;");

type GJ = GeoJSON.GeoJsonObject;

// ---------- GeoJSON → KML ----------
export function geojsonToKml(fc: GJ, name = "MapBench export"): string {
  const placemarks: string[] = [];
  const visit = (obj: any) => {
    if (!obj) return;
    if (obj.type === "FeatureCollection") obj.features?.forEach(visit);
    else if (obj.type === "Feature") {
      const geomKml = geomToKml(obj.geometry);
      if (!geomKml) return;
      const p = obj.properties || {};
      const nm = p.name ?? p.title ?? p.Name ?? "";
      const desc = p.description ?? p.desc ?? "";
      const ext = Object.entries(p)
        .filter(([k]) => !["name", "title", "Name", "description", "desc"].includes(k))
        .map(([k, v]) => `<Data name="${escapeXml(String(k))}"><value>${escapeXml(String(v))}</value></Data>`).join("");
      placemarks.push(`<Placemark><name>${escapeXml(String(nm))}</name><description>${escapeXml(String(desc))}</description>${ext ? `<ExtendedData>${ext}</ExtendedData>` : ""}${geomKml}</Placemark>`);
    } else if (obj.type) {
      const geomKml = geomToKml(obj);
      if (geomKml) placemarks.push(`<Placemark>${geomKml}</Placemark>`);
    }
  };
  visit(fc);
  return `<?xml version="1.0" encoding="UTF-8"?>\n<kml xmlns="http://www.opengis.net/kml/2.2"><Document><name>${escapeXml(name)}</name>${placemarks.join("\n")}</Document></kml>`;
}

function coordsToStr(c: any): string {
  if (typeof c[0] === "number") return `${c[0]},${c[1]}${c[2] !== undefined ? `,${c[2]}` : ""}`;
  return c.map(coordsToStr).join(" ");
}

function geomToKml(g: any): string {
  if (!g?.type) return "";
  switch (g.type) {
    case "Point": return `<Point><coordinates>${coordsToStr(g.coordinates)}</coordinates></Point>`;
    case "MultiPoint": return `<MultiGeometry>${g.coordinates.map((c: any) => `<Point><coordinates>${coordsToStr(c)}</coordinates></Point>`).join("")}</MultiGeometry>`;
    case "LineString": return `<LineString><coordinates>${coordsToStr(g.coordinates)}</coordinates></LineString>`;
    case "MultiLineString": return `<MultiGeometry>${g.coordinates.map((r: any) => `<LineString><coordinates>${coordsToStr(r)}</coordinates></LineString>`).join("")}</MultiGeometry>`;
    case "Polygon": return `<Polygon><outerBoundaryIs><LinearRing><coordinates>${coordsToStr(g.coordinates[0])}</coordinates></LinearRing></outerBoundaryIs>${(g.coordinates.slice(1) || []).map((r: any) => `<innerBoundaryIs><LinearRing><coordinates>${coordsToStr(r)}</coordinates></LinearRing></innerBoundaryIs>`).join("")}</Polygon>`;
    case "MultiPolygon": return `<MultiGeometry>${g.coordinates.map((poly: any) => geomToKml({ type: "Polygon", coordinates: poly })).join("")}</MultiGeometry>`;
    case "GeometryCollection": return `<MultiGeometry>${(g.geometries || []).map(geomToKml).join("")}</MultiGeometry>`;
    default: return "";
  }
}

// ---------- GeoJSON → GPX ----------
export function geojsonToGpx(fc: GJ, name = "MapBench export"): string {
  const wpts: string[] = [], trks: string[] = [];
  const visit = (obj: any, idx: number, properties: Record<string, unknown> = {}) => {
    if (!obj) return;
    if (obj.type === "FeatureCollection") return obj.features?.forEach((feature: any, i: number) => visit(feature, i));
    if (obj.type === "Feature") return visit(obj.geometry, idx, obj.properties ?? {});
    const nm = escapeXml(String(properties.name ?? `item-${idx + 1}`));
    const date = typeof properties.time === "string" ? new Date(properties.time) : null;
    const time = date && Number.isFinite(date.getTime()) ? `<time>${date.toISOString()}</time>` : "";
    switch (obj?.type) {
      case "Point":
        wpts.push(`<wpt lat="${obj.coordinates[1]}" lon="${obj.coordinates[0]}">${obj.coordinates[2] !== undefined ? `<ele>${obj.coordinates[2]}</ele>` : ""}${time}<name>${nm}</name></wpt>`);
        break;
      case "MultiPoint":
        obj.coordinates.forEach((c: any) => wpts.push(`<wpt lat="${c[1]}" lon="${c[0]}"><name>${nm}</name></wpt>`));
        break;
      case "LineString":
        trks.push(`<trk><name>${nm}</name><trkseg>${obj.coordinates.map((c: any) => `<trkpt lat="${c[1]}" lon="${c[0]}">${c[2] !== undefined ? `<ele>${c[2]}</ele>` : ""}</trkpt>`).join("")}</trkseg></trk>`);
        break;
      case "MultiLineString":
        trks.push(`<trk><name>${nm}</name>${obj.coordinates.map((seg: any) => `<trkseg>${seg.map((c: any) => `<trkpt lat="${c[1]}" lon="${c[0]}"></trkpt>`).join("")}</trkseg>`).join("")}</trk>`);
        break;
      case "GeometryCollection":
        (obj.geometries ?? []).forEach((geometry: any) => visit(geometry, idx, properties));
        break;
      case "Polygon":
        trks.push(`<trk><name>${nm} (boundary)</name><trkseg>${obj.coordinates[0].map((c: any) => `<trkpt lat="${c[1]}" lon="${c[0]}"></trkpt>`).join("")}</trkseg></trk>`);
        break;
    }
  };
  visit(fc, 0);
  return `<?xml version="1.0" encoding="UTF-8"?>\n<gpx version="1.1" creator="MapBench" xmlns="http://www.topografix.com/GPX/1/1"><metadata><name>${escapeXml(name)}</name></metadata>${wpts.join("")}${trks.join("")}</gpx>`;
}

// ---------- CSV ----------
export interface ParsedCsv { headers: string[]; rows: string[][] }

export function parseCsv(text: string, maxRows = 20000): ParsedCsv {
  const rows: string[][] = [];
  let cur: string[] = [], field = "", inQuotes = false;
  const src = text.replace(/\r\n?/g, "\n");
  for (let i = 0; i < src.length; i++) {
    const ch = src[i];
    if (inQuotes) {
      if (ch === '"') {
        if (src[i + 1] === '"') { field += '"'; i++; }
        else inQuotes = false;
      } else field += ch;
    } else if (ch === '"') inQuotes = true;
    else if (ch === ",") { cur.push(field); field = ""; }
    else if (ch === "\n") {
      cur.push(field); field = "";
      if (cur.some((c) => c.trim() !== "")) rows.push(cur);
      cur = [];
      if (rows.length > maxRows) break;
    } else field += ch;
  }
  if (field !== "" || cur.length) { cur.push(field); if (cur.some((c) => c.trim() !== "")) rows.push(cur); }
  const headers = rows.shift() || [];
  return { headers, rows };
}

export function toCsv(headers: string[], rows: (string | number)[][]): string {
  const esc = (v: string | number) => {
    const s = String(v ?? "");
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [headers.map(esc).join(","), ...rows.map((r) => r.map(esc).join(","))].join("\n");
}

/** Guess which header indexes hold latitude/longitude. */
export function guessLatLngCols(headers: string[]): { latCol: number; lngCol: number } {
  const norm = (s: string) => s.toLowerCase().replace(/[^a-z]/g, "");
  const latHints = ["lat", "latitude", "y", "latdd", "pointy", "geolat"];
  const lngHints = ["lng", "lon", "long", "longitude", "x", "londd", "pointx", "geolon"];
  let latCol = -1, lngCol = -1;
  headers.forEach((h, i) => {
    const n = norm(h);
    if (latCol < 0 && latHints.includes(n)) latCol = i;
    if (lngCol < 0 && lngHints.includes(n)) lngCol = i;
  });
  return { latCol, lngCol };
}

// ---------- GeoJSON helpers ----------
export function asFeatureCollection(input: any): GeoJSON.FeatureCollection {
  if (!input || typeof input !== "object") throw new Error("The file is not valid JSON.");
  if (input.type === "FeatureCollection") return input;
  if (input.type === "Feature") return { type: "FeatureCollection", features: [input] };
  const geomTypes = ["Point", "MultiPoint", "LineString", "MultiLineString", "Polygon", "MultiPolygon", "GeometryCollection"];
  if (geomTypes.includes(input.type)) return { type: "FeatureCollection", features: [{ type: "Feature", properties: {}, geometry: input }] };
  if (Array.isArray(input)) {
    const feats = input.filter((f) => f?.type === "Feature");
    if (feats.length === input.length) return { type: "FeatureCollection", features: feats };
  }
  throw new Error("Could not find a GeoJSON Feature, FeatureCollection or Geometry in the file.");
}

export function featureCount(fc: GeoJSON.FeatureCollection): number {
  return fc.features.length;
}

export function geojsonBbox(fc: GeoJSON.FeatureCollection): [number, number, number, number] | null {
  let minx = 181, miny = 91, maxx = -181, maxy = -91, found = false;
  const walk = (c: any): void => {
    if (typeof c?.[0] === "number" && typeof c?.[1] === "number") {
      found = true;
      if (c[0] < minx) minx = c[0]; if (c[0] > maxx) maxx = c[0];
      if (c[1] < miny) miny = c[1]; if (c[1] > maxy) maxy = c[1];
      return;
    }
    if (Array.isArray(c)) c.forEach(walk);
  };
  fc.features.forEach((f) => f.geometry && walk((f.geometry as any).coordinates ?? (f.geometry as any).geometries));
  if (!found) return null;
  return [minx, miny, maxx, maxy];
}
