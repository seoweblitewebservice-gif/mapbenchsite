import Link from "next/link";
import { distanceKm, fmt } from "@/lib/geo";

const PAIRS = [
  ["New York", { lat: 40.7128, lng: -74.006 }, "London", { lat: 51.5074, lng: -0.1278 }],
  ["Los Angeles", { lat: 34.0522, lng: -118.2437 }, "Tokyo", { lat: 35.6762, lng: 139.6503 }],
  ["Sydney", { lat: -33.8688, lng: 151.2093 }, "Singapore", { lat: 1.3521, lng: 103.8198 }],
  ["Paris", { lat: 48.8566, lng: 2.3522 }, "Dubai", { lat: 25.2048, lng: 55.2708 }],
  ["Delhi", { lat: 28.6139, lng: 77.209 }, "London", { lat: 51.5074, lng: -0.1278 }],
  ["New York", { lat: 40.7128, lng: -74.006 }, "Los Angeles", { lat: 34.0522, lng: -118.2437 }],
] as const;

function DistanceExtras() {
  return (
    <div className="mt-10 space-y-10">
      <section>
        <h2 className="font-display text-2xl font-bold tracking-tight">What people use a two-place distance calculator for</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-line bg-card p-4"><h3 className="font-bold">Flight planning baseline</h3><p className="mt-2 text-sm leading-7 text-mute">Great-circle distance is useful for comparing long-haul routes before looking at airline schedules. Actual flight paths can be longer because of winds, airspace restrictions and routing.</p></div>
          <div className="rounded-xl border border-line bg-card p-4"><h3 className="font-bold">Relocation and family travel</h3><p className="mt-2 text-sm leading-7 text-mute">Straight-line distance gives a stable geographic baseline between two places. For travel time, compare it with the <Link href="/tools/driving-distance-calculator" className="font-semibold text-brand-strong hover:underline">Driving Distance Calculator</Link>.</p></div>
          <div className="rounded-xl border border-line bg-card p-4"><h3 className="font-bold">Service and territory comparison</h3><p className="mt-2 text-sm leading-7 text-mute">Use direct distance to compare branches, customers or facilities consistently. For actual coverage, a <Link href="/tools/drive-time-map" className="font-semibold text-brand-strong hover:underline">Drive Time Map</Link> or <Link href="/tools/map-radius" className="font-semibold text-brand-strong hover:underline">Map Radius Tool</Link> may better match the question.</p></div>
          <div className="rounded-xl border border-line bg-card p-4"><h3 className="font-bold">Navigation and bearing checks</h3><p className="mt-2 text-sm leading-7 text-mute">The result includes the initial compass bearing and geographic midpoint. For more direction detail, use the <Link href="/tools/bearing-calculator" className="font-semibold text-brand-strong hover:underline">Bearing Calculator</Link>.</p></div>
        </div>
      </section>

      <section>
        <h2 className="font-display text-2xl font-bold tracking-tight">Common city-to-city straight-line distances</h2>
        <p className="mt-3 text-sm leading-7 text-mute">These are reproducible MapBench calculations using the same great-circle method as the tool. They are reference values, not road mileage or booked flight distance.</p>
        <div className="mt-4 overflow-x-auto rounded-xl border border-line bg-white">
          <table className="w-full min-w-[620px] text-sm">
            <thead className="bg-well/60 text-left text-[11px] uppercase tracking-wider text-mute"><tr><th className="px-4 py-3">Route</th><th className="px-4 py-3">Miles</th><th className="px-4 py-3">Kilometres</th><th className="px-4 py-3">Nautical miles</th></tr></thead>
            <tbody className="divide-y divide-line">
              {PAIRS.map(([aName, a, bName, b]) => { const km = distanceKm(a, b); return <tr key={`${aName}-${bName}`}><td className="px-4 py-3 font-semibold">{aName} → {bName}</td><td className="px-4 py-3">{fmt(km * 0.621371, 0)}</td><td className="px-4 py-3">{fmt(km, 0)}</td><td className="px-4 py-3">{fmt(km * 0.539957, 0)}</td></tr>; })}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-2xl border border-line bg-well/35 p-5 sm:p-6">
        <h2 className="font-display text-2xl font-bold tracking-tight">How the distance calculation works</h2>
        <p className="mt-3 leading-7 text-mute">MapBench calculates the central angle between the two WGS84 latitude/longitude inputs and converts that angle to surface distance using a mean Earth radius of 6,371.0088 km. This is a spherical great-circle calculation: fast, transparent and appropriate for everyday worldwide distance comparisons.</p>
        <p className="mt-3 leading-7 text-mute">It is not the same as a full ellipsoidal geodesic solver, and it is not a road-network measurement. For most everyday comparisons the difference from an ellipsoidal geodesic is small, but specialist surveying, engineering or legal work should use dedicated geodesic software and authoritative coordinates.</p>
        <p className="mt-3 text-sm text-mute">Useful next steps: <Link href="/tools/crow-flies-distance" className="font-semibold text-brand-strong hover:underline">crow-flies comparison</Link>, <Link href="/tools/halfway-between-two-places" className="font-semibold text-brand-strong hover:underline">halfway point</Link>, <Link href="/tools/distance-matrix-calculator" className="font-semibold text-brand-strong hover:underline">distance matrix</Link>, and <Link href="/guides/how-distance-calculation-works" className="font-semibold text-brand-strong hover:underline">distance calculation guide</Link>.</p>
      </section>
    </div>
  );
}

export default function ToolPageExtras({ slug }: { slug: string }) {
  if (slug === "distance-between-two-places") return <DistanceExtras />;
  return null;
}
