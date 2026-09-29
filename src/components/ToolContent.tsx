"use client";
import { useMemo } from "react";
import Link from "next/link";
import { CATEGORIES, toolBySlug, type ToolDef } from "@/lib/registry";
import { TOOL_COPY } from "@/data/toolCopy";
import { LIMITS } from "@/data/categoryGuide4";
import { CATEGORY_DATA_NOTE } from "@/data/categoryExtras";
import { MAJOR_CITIES } from "@/data/cities";
import { distanceKm, bearingBetween, compassPoint, fmt, normLng } from "@/lib/geo";
import { formatDms, latLngToUtm, formatUtm, latLngToMgrs } from "@/lib/coords";
import { sunTimes, fmtDurationHours } from "@/lib/astronomy";

interface Example { lead: string; body: string }

function buildExamples(tool: ToolDef): Example[] {
  const NYC = { lat: 40.7128, lng: -74.006 };
  const LON = { lat: 51.5074, lng: -0.1278 };
  const TYO = { lat: 35.6762, lng: 139.6503 };
  const SYD = { lat: -33.8688, lng: 151.2093 };
  const BER = { lat: 52.52, lng: 13.405 };
  const PAR = { lat: 48.8566, lng: 2.3522 };

  switch (tool.category) {
    case "distance": {
      const e1 = distanceKm(NYC, LON), e2 = distanceKm(TYO, SYD), e3 = distanceKm(PAR, BER);
      return [
        { lead: "New York → London", body: `The great-circle distance is about ${fmt(e1, 0)} km (${fmt(e1 * 0.621371, 0)} mi), with an initial bearing of ${fmt(bearingBetween(NYC, LON), 0)}° (${compassPoint(bearingBetween(NYC, LON))}).` },
        { lead: "Tokyo → Sydney", body: `This pair is about ${fmt(e2, 0)} km apart on the sphere. It is a useful example of why flat maps distort long intercontinental routes.` },
        { lead: "Paris → Berlin", body: `The straight-line distance is about ${fmt(e3, 0)} km. Road distance is longer because real routes follow the transport network rather than the geometric minimum.` },
      ];
    }
    case "radius":
      return [5, 10, 25].map((r) => ({
        lead: `${r}-mile radius`,
        body: `A ${r}-mile circle encloses roughly ${fmt(Math.PI * (r * 1.60934) ** 2, 0)} km². This is geometric coverage, not a promise about driving time or service accessibility.`,
      }));
    case "routing":
      return [
        { lead: "Urban drive", body: "A short route can take much longer than its distance suggests because of road classes, turns, bridges and local restrictions. Treat public routing times as planning estimates unless live traffic is explicitly provided." },
        { lead: "Cycling reach", body: "A cycling-time area often stretches along continuous cycleways and contracts around rivers, limited crossings and steep terrain." },
        { lead: "Multiple stops", body: "Changing stop order can reduce backtracking substantially. Route optimisation is most useful when several destinations are scattered across a city or region." },
      ];
    case "coordinates": {
      const utm = latLngToUtm(NYC);
      return [
        { lead: "40.7128, −74.0060", body: utm ? `The same Lower Manhattan point can be written as ${formatDms(40.7128, "lat")}, ${formatDms(-74.006, "lng")} or ${formatUtm(utm)}. Different formats describe the same location.` : "Different coordinate formats can describe the same physical point." },
        { lead: "MGRS precision", body: `For the same sample point, a 10-digit MGRS reference is ${latLngToMgrs(NYC, 5)}. More digits increase numeric precision, not the accuracy of the original measurement.` },
        { lead: "Decimal places", body: "Five decimal places of latitude are roughly metre-scale. That does not mean a phone GPS measurement itself is accurate to one metre." },
      ];
    }
    case "earth": {
      const h1 = 3.86 * Math.sqrt(1.7), h2 = 3.86 * Math.sqrt(100);
      return [
        { lead: "Eye height near sea level", body: `With eyes about 1.7 m above sea level, the refracted-horizon estimate is roughly ${fmt(h1, 1)} km.` },
        { lead: "100 m viewpoint", body: `At 100 m elevation above a clear horizon, the estimate increases to roughly ${fmt(h2, 0)} km.` },
        { lead: "Antipode example", body: `New York's antipodal coordinate is approximately ${(-NYC.lat).toFixed(2)}, ${normLng(NYC.lng + 180).toFixed(2)}.` },
      ];
    }
    case "sun": {
      const eq = (lat: number) => sunTimes(lat, 0, 2025, 3, 20).dayLengthHours;
      return [
        { lead: "Equinox comparison", body: `Calculated day length is about ${fmtDurationHours(eq(0))} at the Equator and changes with latitude because of solar geometry and the sunrise/sunset convention used.` },
        { lead: "Golden hour", body: "The useful light window changes with latitude, season and local horizon. Treat calculated times as planning guidance, especially around obstructed horizons." },
        { lead: "Clock time", body: "Solar geometry and civil clock time are different layers. Time zones and daylight-saving rules shift the clock label, not the Sun's position." },
      ];
    }
    case "population": {
      const near = MAJOR_CITIES.map((c) => ({ ...c, d: distanceKm(LON, c) })).filter((c) => c.d <= 500);
      const pop = near.reduce((s, c) => s + c.pop, 0);
      return [
        { lead: "500 km around London", body: `The curated major-city dataset contains ${near.length} entries within 500 km, summing to roughly ${(pop / 1000).toFixed(1)} million people. This is a dataset-based estimate, not a census count of everyone inside the circle.` },
        { lead: "Dataset vintage", body: "Population and cost datasets age quickly. Always read the stated source and vintage before using a number in a report." },
        { lead: "Rural coverage", body: "A major-city dataset will undercount rural settlement. The result should be treated as a lower-bound style estimate where the page says so." },
      ];
    }
    case "location":
      return [
        { lead: "GPS near a boundary", body: "A small location error can change the returned city, county or postal area when the point is close to a boundary. Verify the pin before using the answer for official paperwork." },
        { lead: "Postal vs administrative", body: "Mailing cities, municipalities, counties and ZIP/postal areas are different geographic layers and can legitimately return different names." },
        { lead: "Indoor location", body: "Browser geolocation may be less accurate indoors. If the result looks wrong, move the pin or search the address directly." },
      ];
    case "files":
      return [
        { lead: "GPX track", body: "A GPX file can carry track points, timestamps and elevation. Local browser tools can inspect those fields without sending the file to a server." },
        { lead: "KML/KMZ", body: "KML is XML-based; KMZ is a ZIP container that commonly contains a KML document plus assets." },
        { lead: "CSV coordinates", body: "CSV mapping works best when latitude and longitude columns are explicit and invalid rows are reported instead of silently ignored." },
      ];
    case "creation":
      return [
        { lead: "Small pin map", body: "A handful of labelled pins is usually clearer than dozens of unstyled markers. Use categories or colours only when they carry meaning." },
        { lead: "Shareable state", body: "When a tool stores settings in the URL, recipients can reopen the same configuration without an account." },
        { lead: "Export choice", body: "PNG is useful for presentation; GeoJSON or CSV is better when the data needs to remain editable." },
      ];
    default:
      return [
        { lead: "One degree of latitude", body: "One degree of latitude is about 111 km, while a degree of longitude becomes shorter toward the poles." },
        { lead: "Great-circle limit", body: "The largest possible surface separation between two points is roughly half the Earth's circumference." },
        { lead: "Map interpretation", body: "Always distinguish geometric measurements from administrative, road-network or legal boundaries; they answer different questions." },
      ];
  }
}

export default function ToolContent({ tool }: { tool: ToolDef }) {
  const category = CATEGORIES.find((c) => c.id === tool.category)!;
  const copy = TOOL_COPY[tool.slug];
  const examples = useMemo(() => buildExamples(tool), [tool]);
  const limits = LIMITS[tool.category];
  const related = (tool.related || [])
    .map((s) => toolBySlug.get(s))
    .filter((t): t is ToolDef => !!t && t.slug !== tool.slug)
    .slice(0, 4);

  return (
    <div className="doc mx-auto max-w-3xl space-y-8">
      <section aria-label="Quick answer" className="rounded-lg border border-line bg-card px-4 py-3">
        <p className="!mb-0 text-[15px]"><strong>Quick answer:</strong> {tool.short} Coverage: {tool.scope}. No account is required.</p>
      </section>

      {copy && (
        <section aria-label="About this tool" data-content-type="tool-explanation">
          <h2 className="font-display text-2xl font-bold tracking-tight">{copy.h2}</h2>
          {copy.paras.map((p, i) => <p key={i} className="mt-3">{p}</p>)}
        </section>
      )}

      <section aria-label="Worked examples">
        <h2 className="font-display text-2xl font-bold tracking-tight">Worked examples</h2>
        <ul className="mt-3 space-y-3">
          {examples.map((e) => (
            <li key={e.lead} className="rounded-lg border border-line bg-card px-4 py-3">
              <span className="font-sans text-sm font-extrabold text-brand-strong">{e.lead} — </span>
              <span className="text-[15px] text-mute">{e.body}</span>
            </li>
          ))}
        </ul>
      </section>

      {limits && (
        <section aria-label="Limits and appropriate use">
          <h2 className="font-display text-2xl font-bold tracking-tight">Limits &amp; appropriate use</h2>
          {limits.paras.slice(0, 2).map((p, i) => <p key={i} className="mt-3">{p}</p>)}
          <ul className="mt-2 list-disc space-y-1.5 pl-6">
            {limits.escalate.slice(0, 3).map((e) => <li key={e}>{e}</li>)}
          </ul>
        </section>
      )}

      <section aria-label="Data and methodology note">
        <h2 className="font-display text-2xl font-bold tracking-tight">Data &amp; methodology</h2>
        <p className="mt-3">{tool.method ? `${tool.method} ` : ""}{CATEGORY_DATA_NOTE[tool.category]}</p>
        <p className="mt-2 text-sm text-mute">For source details, licences and model limitations, see <Link href="/data-sources" className="font-bold text-brand-strong hover:underline">Data Sources</Link> and <Link href="/methodology" className="font-bold text-brand-strong hover:underline">Methodology</Link>.</p>
      </section>

      {related.length > 0 && (
        <section aria-label="Related tools in context">
          <h2 className="font-display text-2xl font-bold tracking-tight">Related tools</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {related.map((r) => (
              <Link key={r.slug} href={`/tools/${r.slug}`} className="rounded-lg border border-line bg-card px-4 py-3 hover:border-brand">
                <span className="font-sans text-sm font-extrabold text-brand-strong">{r.name}</span>
                <span className="mt-1 block text-sm text-mute">{r.short}</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      <p className="text-xs text-mute">Category: {category.label}. Results are intended for everyday analysis and planning unless a page explicitly states otherwise.</p>
    </div>
  );
}
