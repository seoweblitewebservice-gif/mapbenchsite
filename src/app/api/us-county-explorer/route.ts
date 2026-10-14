export const dynamic = "force-dynamic";

type CensusRow = Record<string, string>;

function num(value: unknown) {
  const n = Number(value);
  return Number.isFinite(n) && n > -999999000 ? n : null;
}

function rows(payload: unknown): CensusRow[] {
  if (!Array.isArray(payload) || payload.length < 2 || !Array.isArray(payload[0])) return [];
  const headers = payload[0] as string[];
  return payload.slice(1).filter(Array.isArray).map((row: unknown) => {
    const values = row as string[];
    return Object.fromEntries(headers.map((h, i) => [h, values[i]]));
  });
}

function pct(part: number | null, whole: number | null) {
  return part !== null && whole !== null && whole > 0 ? (part / whole) * 100 : null;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const state = String(searchParams.get("state") || "06").padStart(2, "0");
  if (!/^\d{2}$/.test(state)) return Response.json({ ok: false, message: "State FIPS must be two digits." }, { status: 400 });

  try {
    const acs = new URL("https://api.census.gov/data/2024/acs/acs5");
    acs.searchParams.set("get", "NAME,B01003_001E,B19013_001E,B01002_001E,B17001_001E,B17001_002E,B15003_001E,B15003_022E,B15003_023E,B15003_024E,B15003_025E,B25077_001E,B25001_001E");
    acs.searchParams.set("for", "county:*");
    acs.searchParams.set("in", `state:${state}`);

    const tiger = new URL("https://tigerweb.geo.census.gov/arcgis/rest/services/TIGERweb/State_County/MapServer/1/query");
    tiger.searchParams.set("where", `STATE='${state}'`);
    tiger.searchParams.set("outFields", "GEOID,STATE,COUNTY,NAME,BASENAME,AREALAND,AREAWATER,CENTLAT,CENTLON");
    tiger.searchParams.set("returnGeometry", "true");
    tiger.searchParams.set("outSR", "4326");
    tiger.searchParams.set("geometryPrecision", "4");
    tiger.searchParams.set("maxAllowableOffset", "0.01");
    tiger.searchParams.set("f", "geojson");

    const [acsRes, tigerRes] = await Promise.all([
      fetch(acs, { next: { revalidate: 604800 } }),
      fetch(tiger, { next: { revalidate: 604800 } }),
    ]);
    if (!acsRes.ok) throw new Error(`ACS ${acsRes.status}`);
    if (!tigerRes.ok) throw new Error(`TIGERweb ${tigerRes.status}`);

    const acsRows = rows(await acsRes.json());
    const tigerJson = await tigerRes.json();
    const features = Array.isArray(tigerJson?.features) ? tigerJson.features : [];
    const acsByGeoid = new Map(acsRows.map((r) => [`${r.state}${r.county}`, r]));

    const countyFeatures = features.map((feature: any) => {
      const p = feature?.properties ?? {};
      const geoid = String(p.GEOID ?? `${p.STATE ?? state}${p.COUNTY ?? ""}`);
      const r = acsByGeoid.get(geoid);
      const population = num(r?.B01003_001E);
      const povertyUniverse = num(r?.B17001_001E);
      const povertyBelow = num(r?.B17001_002E);
      const educationUniverse = num(r?.B15003_001E);
      const bachelors = ["B15003_022E", "B15003_023E", "B15003_024E", "B15003_025E"].reduce((sum, key) => sum + (num(r?.[key]) ?? 0), 0);
      const landM2 = num(p.AREALAND);
      const waterM2 = num(p.AREAWATER);
      const landAreaSqMi = landM2 === null ? null : landM2 / 2_589_988.110336;
      const waterAreaSqMi = waterM2 === null ? null : waterM2 / 2_589_988.110336;
      const density = population !== null && landAreaSqMi && landAreaSqMi > 0 ? population / landAreaSqMi : null;
      return {
        type: "Feature",
        geometry: feature.geometry,
        properties: {
          geoid,
          stateFips: String(p.STATE ?? state),
          countyFips: String(p.COUNTY ?? geoid.slice(2)),
          name: String(p.NAME ?? p.BASENAME ?? r?.NAME ?? "County"),
          population,
          medianHouseholdIncome: num(r?.B19013_001E),
          medianAge: num(r?.B01002_001E),
          povertyRate: pct(povertyBelow, povertyUniverse),
          bachelorsOrHigherRate: educationUniverse && educationUniverse > 0 ? (bachelors / educationUniverse) * 100 : null,
          medianHomeValue: num(r?.B25077_001E),
          housingUnits: num(r?.B25001_001E),
          landAreaSqMi,
          waterAreaSqMi,
          populationDensityPerSqMi: density,
          centroidLat: num(p.CENTLAT),
          centroidLng: num(p.CENTLON),
        },
      };
    });

    const counties = countyFeatures.map((f: any) => f.properties);
    const byPopulation = [...counties].filter((x) => x.population !== null).sort((a, b) => b.population - a.population);
    const byIncome = [...counties].filter((x) => x.medianHouseholdIncome !== null).sort((a, b) => b.medianHouseholdIncome - a.medianHouseholdIncome);
    const byArea = [...counties].filter((x) => x.landAreaSqMi !== null).sort((a, b) => b.landAreaSqMi - a.landAreaSqMi);
    const stateName = acsRows[0]?.NAME?.replace(/, .+$/, "") || "Selected state";

    return Response.json({
      ok: true,
      state: { fips: state, name: stateName },
      summary: {
        countyCount: counties.length,
        totalPopulation: counties.reduce((sum, x) => sum + (x.population ?? 0), 0),
        totalHousingUnits: counties.reduce((sum, x) => sum + (x.housingUnits ?? 0), 0),
        largestPopulationCounty: byPopulation[0] ?? null,
        highestIncomeCounty: byIncome[0] ?? null,
        largestAreaCounty: byArea[0] ?? null,
      },
      counties,
      featureCollection: { type: "FeatureCollection", features: countyFeatures },
      sources: {
        boundaries: "U.S. Census Bureau TIGERweb current county boundaries",
        demographics: "2020–2024 American Community Survey 5-year estimates",
      },
      method: "County geometry is loaded from Census TIGERweb for the selected state and joined to ACS 5-year county estimates by state+county FIPS. ACS values are survey estimates and should be interpreted with their published margins of error for formal analysis.",
    }, { headers: { "Cache-Control": "public, s-maxage=604800, stale-while-revalidate=1209600" } });
  } catch {
    return Response.json({ ok: false, message: "U.S. county explorer data is temporarily unavailable." }, { status: 502 });
  }
}
