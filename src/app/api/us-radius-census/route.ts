export const dynamic = "force-dynamic";

const R = 6371.0088;
const rad = (d: number) => d * Math.PI / 180;
function distanceKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const dLat = rad(b.lat - a.lat), dLng = rad(b.lng - a.lng);
  const x = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(x)));
}

async function queryLayer(url: string, lat: number, lng: number, radiusKm: number, fields: string) {
  const q = new URL(url + "/query");
  q.searchParams.set("geometry", `${lng},${lat}`);
  q.searchParams.set("geometryType", "esriGeometryPoint");
  q.searchParams.set("inSR", "4326");
  q.searchParams.set("spatialRel", "esriSpatialRelIntersects");
  q.searchParams.set("distance", String(radiusKm * 1000));
  q.searchParams.set("units", "esriSRUnit_Meter");
  q.searchParams.set("outFields", fields);
  q.searchParams.set("returnGeometry", "false");
  q.searchParams.set("f", "json");
  const res = await fetch(q, { next: { revalidate: 604800 } });
  if (!res.ok) throw new Error(`Census TIGERweb ${res.status}`);
  const json = await res.json();
  return Array.isArray(json?.features) ? json.features.map((f: any) => f.attributes ?? {}) : [];
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const lat = Number(searchParams.get("lat"));
  const lng = Number(searchParams.get("lng"));
  const radiusKm = Math.min(1000, Math.max(1, Number(searchParams.get("radiusKm")) || 100));
  if (!Number.isFinite(lat) || lat < -90 || lat > 90 || !Number.isFinite(lng) || lng < -180 || lng > 180) {
    return Response.json({ ok: false, message: "Invalid latitude or longitude." }, { status: 400 });
  }

  try {
    const fields = "GEOID,STATE,PLACE,BASENAME,NAME,POP100,HU100,CENTLAT,CENTLON,AREALAND";
    const [inc, cdp, zctas] = await Promise.all([
      queryLayer("https://tigerweb.geo.census.gov/arcgis/rest/services/Census2020/Places_CouSub_ConCity_SubMCD/MapServer/4", lat, lng, radiusKm, fields),
      queryLayer("https://tigerweb.geo.census.gov/arcgis/rest/services/Census2020/Places_CouSub_ConCity_SubMCD/MapServer/5", lat, lng, radiusKm, fields),
      queryLayer("https://tigerweb.geo.census.gov/arcgis/rest/services/TIGERweb/PUMA_TAD_TAZ_UGA_ZCTA/MapServer/7", lat, lng, radiusKm, "GEOID,ZCTA5,BASENAME,NAME,POP100,HU100,CENTLAT,CENTLON,AREALAND"),
    ]);

    const center = { lat, lng };
    const seen = new Set<string>();
    const places = [...inc, ...cdp].map((p: any) => {
      const plat = Number(p.CENTLAT), plng = Number(p.CENTLON);
      if (!Number.isFinite(plat) || !Number.isFinite(plng)) return null;
      const distKm = distanceKm(center, { lat: plat, lng: plng });
      return {
        geoid: String(p.GEOID ?? ""),
        name: String(p.BASENAME ?? p.NAME ?? "Place"),
        stateFips: String(p.STATE ?? ""),
        placeCode: String(p.PLACE ?? ""),
        lat: plat,
        lng: plng,
        distanceKm: distKm,
        population2020: Number(p.POP100) || 0,
        housingUnits2020: Number(p.HU100) || 0,
        landAreaSqMi: Number(p.AREALAND) ? Number(p.AREALAND) / 2_589_988.110336 : null,
      };
    }).filter((p: any) => p && p.distanceKm <= radiusKm && p.geoid && !seen.has(p.geoid) && seen.add(p.geoid))
      .sort((a: any, b: any) => a.distanceKm - b.distanceKm);

    const zctaRows = zctas.map((z: any) => {
      const zlat = Number(z.CENTLAT), zlng = Number(z.CENTLON);
      if (!Number.isFinite(zlat) || !Number.isFinite(zlng)) return null;
      const distKm = distanceKm(center, { lat: zlat, lng: zlng });
      return {
        zcta: String(z.ZCTA5 ?? z.GEOID ?? z.BASENAME ?? ""),
        lat: zlat,
        lng: zlng,
        distanceKm: distKm,
        population2020: Number(z.POP100) || 0,
        housingUnits2020: Number(z.HU100) || 0,
      };
    }).filter((z: any) => z && z.distanceKm <= radiusKm && z.zcta);

    const populationEstimate = zctaRows.reduce((sum: number, z: any) => sum + z.population2020, 0);
    const housingUnits = zctaRows.reduce((sum: number, z: any) => sum + z.housingUnits2020, 0);

    return Response.json({
      ok: true,
      radiusKm,
      places,
      zctas: zctaRows,
      summary: {
        placeCount: places.length,
        zctaCount: zctaRows.length,
        populationEstimate,
        housingUnits,
        largestPlace: [...places].sort((a: any, b: any) => b.population2020 - a.population2020)[0] ?? null,
      },
      method: "U.S. Census 2020 incorporated places/CDPs and 2020 ZCTAs. Inclusion uses each geography's Census centroid inside the selected radius; population is the sum of included ZCTA 2020 populations, so it is a reproducible approximation rather than an exact clipped-area count.",
      sources: ["U.S. Census Bureau TIGERweb", "2020 Decennial Census POP100/HU100"],
    }, { headers: { "Cache-Control": "public, s-maxage=604800, stale-while-revalidate=1209600" } });
  } catch {
    return Response.json({ ok: false, message: "U.S. Census radius data is temporarily unavailable." }, { status: 502 });
  }
}
