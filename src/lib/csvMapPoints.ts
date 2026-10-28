/** Parse and bound CSV coordinate rows without accepting numeric prefixes as coordinates. */
export function csvMapPoints(rows: string[][], latCol: number, lngCol: number, labelCol: number, catCol: number, limit = 50000) {
  if (latCol < 0 || lngCol < 0) return [];
  const out: { lat: number; lng: number; label: string; cat: string; row: string[] }[] = [];
  for (const row of rows) {
    if (out.length >= limit) break;
    const latText = (row[latCol] ?? "").trim(), lngText = (row[lngCol] ?? "").trim();
    if (!latText || !lngText) continue;
    const lat = Number(latText), lng = Number(lngText);
    if (Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180) {
      out.push({ lat, lng, label: labelCol >= 0 ? row[labelCol] ?? "" : "", cat: catCol >= 0 ? row[catCol] ?? "" : "", row });
    }
  }
  return out;
}
