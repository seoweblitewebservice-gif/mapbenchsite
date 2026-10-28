import { isValidLat, isValidLng } from './geo';

/** Parse CSV point records, including quoted commas and newlines. */
export function csvPointFeatures(text: string): GeoJSON.FeatureCollection<GeoJSON.Point> {
  const rows: string[][] = [];
  let row: string[] = [], cell = '', quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') { cell += '"'; i++; }
      else if (c === '"') quoted = false;
      else cell += c;
    } else if (c === '"' && cell === '') quoted = true;
    else if (c === ',') { row.push(cell); cell = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(cell); if (row.some(v => v.trim())) rows.push(row); row = []; cell = '';
    } else cell += c;
  }
  if (quoted) throw new Error('CSV has an unclosed quoted field.');
  row.push(cell); if (row.some(v => v.trim())) rows.push(row);
  const head = (rows.shift() ?? []).map(h => h.trim().replace(/^\uFEFF/, '').toLowerCase());
  const li = head.findIndex(h => h.includes('lat'));
  const lo = head.findIndex(h => h.includes('lon') || h.includes('lng'));
  if (li < 0 || lo < 0 || li === lo) throw new Error('The CSV needs latitude and longitude columns.');
  const features: GeoJSON.Feature<GeoJSON.Point>[] = [];
  for (const cells of rows) {
    const latText = cells[li]?.trim(), lngText = cells[lo]?.trim();
    if (!latText || !lngText) continue;
    const lat = Number(latText), lng = Number(lngText);
    if (!isValidLat(lat) || !isValidLng(lng)) continue;
    const properties: Record<string, string> = {};
    head.forEach((h, i) => { properties[h] = cells[i] ?? ''; });
    features.push({ type: 'Feature', properties, geometry: { type: 'Point', coordinates: [lng, lat] } });
  }
  return { type: 'FeatureCollection', features };
}
