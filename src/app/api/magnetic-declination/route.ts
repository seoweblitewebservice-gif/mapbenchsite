export const dynamic = "force-dynamic";

function asNumber(value: string | null) {
  if (value === null || value.trim() === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function readValue(node: unknown): number | null {
  if (typeof node === "number" && Number.isFinite(node)) return node;
  if (node && typeof node === "object" && "value" in node) {
    const n = Number((node as { value?: unknown }).value);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const lat = asNumber(searchParams.get("lat"));
  const lng = asNumber(searchParams.get("lng"));
  const altitude = asNumber(searchParams.get("altitude")) ?? 0;
  const date = searchParams.get("date") || new Date().toISOString().slice(0, 10);

  if (lat === null || lat < -90 || lat > 90 || lng === null || lng < -180 || lng > 180) {
    return Response.json({ ok: false, message: "Latitude must be between -90 and 90 and longitude between -180 and 180." }, { status: 400 });
  }
  if (altitude < -2 || altitude > 1000) {
    return Response.json({ ok: false, message: "Altitude must be between -2 km and 1000 km." }, { status: 400 });
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return Response.json({ ok: false, message: "Date must use YYYY-MM-DD format." }, { status: 400 });
  }
  const year = Number(date.slice(0, 4));
  if (year < 2025 || year > 2030) {
    return Response.json({ ok: false, message: "WMM 2025 is intended for dates from 2025 through 2030." }, { status: 400 });
  }

  const upstream = new URL("https://geomag.bgs.ac.uk/web_service/GMModels/wmm/2025/");
  upstream.searchParams.set("latitude", String(lat));
  upstream.searchParams.set("longitude", String(lng));
  upstream.searchParams.set("altitude", String(altitude));
  upstream.searchParams.set("date", date);
  upstream.searchParams.set("format", "json");

  try {
    const response = await fetch(upstream, {
      headers: { Accept: "application/json", "User-Agent": "MapBench/1.0 (https://www.mapbench.site)" },
      next: { revalidate: 86400 },
    });
    if (!response.ok) {
      return Response.json({ ok: false, message: `BGS World Magnetic Model service returned ${response.status}. Please try again shortly.` }, { status: 502 });
    }

    const payload = await response.json();
    const root = payload?.["geomagnetic-field-model-result"] ?? payload;
    const field = root?.["field-value"] ?? {};
    const sv = root?.["secular-variation"] ?? {};

    const declination = readValue(field?.declination);
    if (declination === null) {
      return Response.json({ ok: false, message: "The magnetic model response did not include declination." }, { status: 502 });
    }

    return Response.json({
      ok: true,
      source: "British Geological Survey World Magnetic Model 2025",
      model: root?.model?.value ?? root?.model ?? "WMM",
      revision: root?.model_revision ?? root?.model?.revision ?? "2025",
      date,
      coordinates: { lat, lng, altitudeKm: altitude },
      declination,
      inclination: readValue(field?.inclination),
      totalIntensity: readValue(field?.["total-intensity"]),
      horizontalIntensity: readValue(field?.["horizontal-intensity"]),
      northIntensity: readValue(field?.["north-intensity"]),
      eastIntensity: readValue(field?.["east-intensity"]),
      verticalIntensity: readValue(field?.["vertical-intensity"]),
      secularVariation: {
        declinationArcMinPerYear: readValue(sv?.declination),
        inclinationArcMinPerYear: readValue(sv?.inclination),
        totalIntensityNtPerYear: readValue(sv?.["total-intensity"]),
      },
    }, {
      headers: { "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800" },
    });
  } catch {
    return Response.json({ ok: false, message: "Could not reach the BGS World Magnetic Model service. Please try again." }, { status: 502 });
  }
}
