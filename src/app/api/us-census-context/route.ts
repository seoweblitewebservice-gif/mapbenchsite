export const dynamic = "force-dynamic";

type CensusRow = Record<string, string>;

function num(value: unknown) {
  const n = Number(value);
  return Number.isFinite(n) && n > -999999000 ? n : null;
}

function rowObject(payload: unknown): CensusRow | null {
  if (!Array.isArray(payload) || payload.length < 2 || !Array.isArray(payload[0]) || !Array.isArray(payload[1])) return null;
  const headers = payload[0] as string[];
  const row = payload[1] as string[];
  return Object.fromEntries(headers.map((h, i) => [h, row[i]]));
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const lat = Number(searchParams.get("lat"));
  const lng = Number(searchParams.get("lng"));
  if (!Number.isFinite(lat) || lat < -90 || lat > 90 || !Number.isFinite(lng) || lng < -180 || lng > 180) {
    return Response.json({ ok: false, message: "Invalid latitude or longitude." }, { status: 400 });
  }

  try {
    const tiger = new URL("https://tigerweb.geo.census.gov/arcgis/rest/services/TIGERweb/State_County/MapServer/1/query");
    tiger.searchParams.set("geometry", `${lng},${lat}`);
    tiger.searchParams.set("geometryType", "esriGeometryPoint");
    tiger.searchParams.set("inSR", "4326");
    tiger.searchParams.set("spatialRel", "esriSpatialRelIntersects");
    tiger.searchParams.set("outFields", "GEOID,STATE,COUNTY,NAME,BASENAME,AREALAND,AREAWATER,CENTLAT,CENTLON");
    tiger.searchParams.set("returnGeometry", "true");
    tiger.searchParams.set("outSR", "4326");
    tiger.searchParams.set("geometryPrecision", "5");
    tiger.searchParams.set("maxAllowableOffset", "0.001");
    tiger.searchParams.set("f", "geojson");

    const tigerRes = await fetch(tiger, { next: { revalidate: 604800 } });
    if (!tigerRes.ok) throw new Error(`TIGERweb ${tigerRes.status}`);
    const tigerJson = await tigerRes.json();
    const feature = tigerJson?.features?.[0];
    const p = feature?.properties;
    if (!p?.STATE || !p?.COUNTY) {
      return Response.json({ ok: false, message: "No U.S. Census county was found at this point." }, { status: 404 });
    }

    const acs = new URL("https://api.census.gov/data/2024/acs/acs5");
    acs.searchParams.set("get", "NAME,B01003_001E,B19013_001E,B01002_001E,B17001_001E,B17001_002E,B15003_001E,B15003_022E,B15003_023E,B15003_024E,B15003_025E,B25077_001E");
    acs.searchParams.set("for", `county:${p.COUNTY}`);
    acs.searchParams.set("in", `state:${p.STATE}`);
    const acsRes = await fetch(acs, { next: { revalidate: 604800 } });
    const acsRow = acsRes.ok ? rowObject(await acsRes.json()) : null;

    const population = num(acsRow?.B01003_001E);
    const medianIncome = num(acsRow?.B19013_001E);
    const medianAge = num(acsRow?.B01002_001E);
    const povertyUniverse = num(acsRow?.B17001_001E);
    const povertyBelow = num(acsRow?.B17001_002E);
    const eduUniverse = num(acsRow?.B15003_001E);
    const bachelors = ["B15003_022E", "B15003_023E", "B15003_024E", "B15003_025E"].reduce((sum, key) => sum + (num(acsRow?.[key]) ?? 0), 0);
    const medianHomeValue = num(acsRow?.B25077_001E);
    const landM2 = num(p.AREALAND);
    const waterM2 = num(p.AREAWATER);
    const landSqMi = landM2 === null ? null : landM2 / 2_589_988.110336;
    const waterSqMi = waterM2 === null ? null : waterM2 / 2_589_988.110336;
    const density = population !== null && landSqMi && landSqMi > 0 ? population / landSqMi : null;

    return Response.json({
      ok: true,
      geography: {
        geoid: String(p.GEOID ?? `${p.STATE}${p.COUNTY}`),
        stateFips: String(p.STATE),
        countyFips: String(p.COUNTY),
        countyName: String(p.NAME ?? p.BASENAME ?? acsRow?.NAME ?? "County"),
        fullName: acsRow?.NAME ?? String(p.NAME ?? p.BASENAME ?? "County"),
        centroid: { lat: num(p.CENTLAT), lng: num(p.CENTLON) },
        landAreaSqMi: landSqMi,
        waterAreaSqMi: waterSqMi,
      },
      demographics: {
        population,
        medianHouseholdIncome: medianIncome,
        medianAge,
        povertyRate: povertyUniverse && povertyBelow !== null ? (povertyBelow / povertyUniverse) * 100 : null,
        bachelorsOrHigherRate: eduUniverse && eduUniverse > 0 ? (bachelors / eduUniverse) * 100 : null,
        medianHomeValue,
        populationDensityPerSqMi: density,
      },
      geometry: feature?.geometry ?? null,
      sources: {
        boundary: "U.S. Census Bureau TIGERweb current county boundary",
        demographics: "2020–2024 American Community Survey 5-year estimates",
      },
    }, { headers: { "Cache-Control": "public, s-maxage=604800, stale-while-revalidate=1209600" } });
  } catch {
    return Response.json({ ok: false, message: "U.S. Census data is temporarily unavailable." }, { status: 502 });
  }
}
