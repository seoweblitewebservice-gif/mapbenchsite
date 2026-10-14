import type { LatLng } from "./geo";
import type { TravelMode } from "./routing";

const COSTING: Record<TravelMode, string> = {
  driving: "auto",
  walking: "pedestrian",
  cycling: "bicycle",
};

export interface NetworkMatrixResult {
  ok: true;
  distancesKm: (number | null)[][];
  durationsS: (number | null)[][];
  provider: "valhalla";
}

export type NetworkMatrixError = { ok: false; message: string };

/**
 * Road / walking / cycling N×N time-distance matrix using the same public
 * Valhalla service MapBench already uses for routing. Keep requests modest so
 * the public service is not abused; the UI currently caps this at 15 points.
 */
export async function networkMatrix(
  points: LatLng[],
  mode: TravelMode,
): Promise<NetworkMatrixResult | NetworkMatrixError> {
  if (points.length < 2) return { ok: false, message: "Add at least two points." };
  if (points.length > 15) return { ok: false, message: "Road matrices are limited to 15 points per request. Use straight-line mode for larger sets." };

  const locations = points.map((p) => ({ lat: p.lat, lon: p.lng }));
  const payload = {
    sources: locations,
    targets: locations,
    costing: COSTING[mode],
    units: "kilometers",
    verbose: false,
  };

  try {
    const url = `https://valhalla1.openstreetmap.de/sources_to_targets?json=${encodeURIComponent(JSON.stringify(payload))}`;
    const res = await fetch(url);
    if (!res.ok) {
      if (res.status === 400) {
        return { ok: false, message: "The routing engine could not build a matrix for these points. Check that the locations are reachable in the selected travel mode." };
      }
      throw new Error(`HTTP ${res.status}`);
    }

    const data = await res.json();
    const compact = data?.sources_to_targets;
    const distances = compact?.distances;
    const durations = compact?.durations;
    if (!Array.isArray(distances) || !Array.isArray(durations)) {
      return { ok: false, message: "The routing service returned an unexpected matrix response." };
    }

    const normalize = (rows: unknown[]): (number | null)[][] => rows.map((row) =>
      Array.isArray(row)
        ? row.map((value) => typeof value === "number" && Number.isFinite(value) ? value : null)
        : [],
    );

    return {
      ok: true,
      distancesKm: normalize(distances),
      durationsS: normalize(durations),
      provider: "valhalla",
    };
  } catch {
    return { ok: false, message: "The road matrix service is temporarily unavailable. Straight-line mode still works locally." };
  }
}
