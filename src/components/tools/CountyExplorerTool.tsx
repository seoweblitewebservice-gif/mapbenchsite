"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { GeoJSONSource, Map as MLMap } from "maplibre-gl";
import { downloadText, toCsv } from "@/lib/formats";
import { ErrorBox, Field, Spinner, Stat } from "@/components/ui";
import { DynamicMap } from "./shared";

const STATES = [
  ["01","Alabama"],["02","Alaska"],["04","Arizona"],["05","Arkansas"],["06","California"],["08","Colorado"],["09","Connecticut"],["10","Delaware"],["11","District of Columbia"],["12","Florida"],["13","Georgia"],["15","Hawaii"],["16","Idaho"],["17","Illinois"],["18","Indiana"],["19","Iowa"],["20","Kansas"],["21","Kentucky"],["22","Louisiana"],["23","Maine"],["24","Maryland"],["25","Massachusetts"],["26","Michigan"],["27","Minnesota"],["28","Mississippi"],["29","Missouri"],["30","Montana"],["31","Nebraska"],["32","Nevada"],["33","New Hampshire"],["34","New Jersey"],["35","New Mexico"],["36","New York"],["37","North Carolina"],["38","North Dakota"],["39","Ohio"],["40","Oklahoma"],["41","Oregon"],["42","Pennsylvania"],["44","Rhode Island"],["45","South Carolina"],["46","South Dakota"],["47","Tennessee"],["48","Texas"],["49","Utah"],["50","Vermont"],["51","Virginia"],["53","Washington"],["54","West Virginia"],["55","Wisconsin"],["56","Wyoming"],["72","Puerto Rico"],
] as const;

type County = {
  geoid: string; stateFips: string; countyFips: string; name: string;
  population: number | null; medianHouseholdIncome: number | null; medianAge: number | null;
  povertyRate: number | null; bachelorsOrHigherRate: number | null; medianHomeValue: number | null;
  housingUnits: number | null; landAreaSqMi: number | null; waterAreaSqMi: number | null;
  populationDensityPerSqMi: number | null; centroidLat: number | null; centroidLng: number | null;
};
type Payload = {
  ok: true;
  state: { fips: string; name: string };
  summary: { countyCount: number; totalPopulation: number; totalHousingUnits: number; largestPopulationCounty: County | null; highestIncomeCounty: County | null; largestAreaCounty: County | null };
  counties: County[];
  featureCollection: GeoJSON.FeatureCollection;
  sources: { boundaries: string; demographics: string };
  method: string;
};

type Metric = "population" | "medianHouseholdIncome" | "populationDensityPerSqMi" | "povertyRate" | "bachelorsOrHigherRate" | "medianHomeValue";
const METRICS: { key: Metric; label: string }[] = [
  { key: "population", label: "Population" },
  { key: "medianHouseholdIncome", label: "Median income" },
  { key: "populationDensityPerSqMi", label: "Population density" },
  { key: "povertyRate", label: "Poverty rate" },
  { key: "bachelorsOrHigherRate", label: "Bachelor's+" },
  { key: "medianHomeValue", label: "Median home value" },
];

const money = (v: number | null) => v == null ? "—" : new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(v);
const num = (v: number | null, digits = 0) => v == null ? "—" : v.toLocaleString("en-US", { maximumFractionDigits: digits });
const pct = (v: number | null) => v == null ? "—" : `${v.toFixed(1)}%`;

export default function CountyExplorerTool() {
  const [state, setState] = useState("06");
  const [metric, setMetric] = useState<Metric>("population");
  const [data, setData] = useState<Payload | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<County | null>(null);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<Metric>("population");
  const mapRef = useRef<MLMap | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    (async () => {
      setBusy(true); setError(null); setSelected(null);
      try {
        const res = await fetch(`/api/us-county-explorer?state=${state}`, { signal: controller.signal });
        const json = await res.json();
        if (!res.ok || !json.ok) throw new Error(json.message || "County explorer lookup failed.");
        setData(json);
      } catch (e: any) {
        if (e?.name !== "AbortError") setError(e?.message || "County data unavailable.");
      } finally { setBusy(false); }
    })();
    return () => controller.abort();
  }, [state]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return [...(data?.counties ?? [])]
      .filter((c) => !q || c.name.toLowerCase().includes(q) || c.geoid.includes(q))
      .sort((a, b) => (b[sort] ?? -Infinity) - (a[sort] ?? -Infinity));
  }, [data, query, sort]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !data) return;
    (map.getSource("counties") as GeoJSONSource | undefined)?.setData(data.featureCollection);
    map.setPaintProperty("county-fill", "fill-color", ["interpolate", ["linear"], ["coalesce", ["get", metric], 0], 0, "#f1f5f9", metric === "population" ? 100000 : metric.includes("Rate") ? 20 : 100000, "#a7d7ce", metric === "population" ? 1000000 : metric.includes("Rate") ? 50 : 500000, "#1d6e63"]);
    const coords: number[][] = [];
    const collect = (node: any) => {
      if (Array.isArray(node) && typeof node[0] === "number" && typeof node[1] === "number") coords.push(node);
      else if (Array.isArray(node)) node.forEach(collect);
    };
    data.featureCollection.features.forEach((f) => collect((f.geometry as any)?.coordinates));
    if (coords.length) {
      const west = Math.min(...coords.map((c) => c[0])), east = Math.max(...coords.map((c) => c[0]));
      const south = Math.min(...coords.map((c) => c[1])), north = Math.max(...coords.map((c) => c[1]));
      map.fitBounds([[west, south], [east, north]], { padding: 45, maxZoom: 7, duration: 650 });
    }
  }, [data, metric]);

  const exportCsv = () => data && downloadText("mapbench-us-county-demographics.csv", toCsv(
    ["geoid","county","population","median_household_income","median_age","poverty_rate_pct","bachelors_plus_pct","median_home_value","housing_units","land_area_sq_mi","density_per_sq_mi"],
    data.counties.map((c) => [c.geoid,c.name,c.population ?? "",c.medianHouseholdIncome ?? "",c.medianAge ?? "",c.povertyRate ?? "",c.bachelorsOrHigherRate ?? "",c.medianHomeValue ?? "",c.housingUnits ?? "",c.landAreaSqMi ?? "",c.populationDensityPerSqMi ?? ""]),
  ), "text/csv");

  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-[420px,1fr]">
        <div className="card order-2 space-y-4 p-4 lg:order-1">
          <div className="grid grid-cols-2 gap-3">
            <Field label="State"><select className="select" value={state} onChange={(e) => setState(e.target.value)}>{STATES.map(([fips, name]) => <option key={fips} value={fips}>{name}</option>)}</select></Field>
            <Field label="Map metric"><select className="select" value={metric} onChange={(e) => setMetric(e.target.value as Metric)}>{METRICS.map((m) => <option key={m.key} value={m.key}>{m.label}</option>)}</select></Field>
          </div>
          {busy && <Spinner label="Loading Census counties and ACS data…" />}
          {error && <ErrorBox>{error}</ErrorBox>}
          {data && <>
            <div className="grid grid-cols-2 gap-2">
              <Stat label="Counties" value={data.summary.countyCount} />
              <Stat label="Population" value={data.summary.totalPopulation.toLocaleString("en-US")} />
              <Stat label="Largest county" value={data.summary.largestPopulationCounty?.name ?? "—"} sub={data.summary.largestPopulationCounty ? num(data.summary.largestPopulationCounty.population) : undefined} />
              <Stat label="Highest income" value={data.summary.highestIncomeCounty?.name ?? "—"} sub={data.summary.highestIncomeCounty ? money(data.summary.highestIncomeCounty.medianHouseholdIncome) : undefined} />
            </div>
            <div className="rounded-lg border border-line bg-well/40 p-3 text-xs leading-relaxed text-mute"><strong className="text-ink">Source:</strong> {data.sources.boundaries}; {data.sources.demographics}.</div>
            {selected && <div className="rounded-xl border border-brand/30 bg-brand-soft p-4">
              <div className="text-[10px] font-extrabold uppercase tracking-wider text-brand-strong">Selected county</div>
              <div className="mt-1 font-display text-xl font-bold">{selected.name}</div>
              <div className="mt-1 text-xs text-mute">FIPS {selected.geoid}</div>
              <div className="mt-3 grid grid-cols-2 gap-2 text-sm"><div><span className="text-mute">Population</span><br/><b>{num(selected.population)}</b></div><div><span className="text-mute">Income</span><br/><b>{money(selected.medianHouseholdIncome)}</b></div><div><span className="text-mute">Poverty</span><br/><b>{pct(selected.povertyRate)}</b></div><div><span className="text-mute">Bachelor's+</span><br/><b>{pct(selected.bachelorsOrHigherRate)}</b></div><div><span className="text-mute">Home value</span><br/><b>{money(selected.medianHomeValue)}</b></div><div><span className="text-mute">Density</span><br/><b>{selected.populationDensityPerSqMi == null ? "—" : `${num(selected.populationDensityPerSqMi,1)}/mi²`}</b></div></div>
            </div>}
            <div className="grid grid-cols-[1fr,150px] gap-2"><input className="input" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search county or FIPS…"/><select className="select" value={sort} onChange={(e) => setSort(e.target.value as Metric)}>{METRICS.map((m) => <option key={m.key} value={m.key}>Sort: {m.label}</option>)}</select></div>
            <div className="flex justify-end"><button type="button" className="btn btn-ghost btn-sm" onClick={exportCsv}>Download CSV</button></div>
            <div className="max-h-[420px] overflow-y-auto rounded-lg border border-line"><table className="tbl"><thead><tr><th>County</th><th className="text-right">Population</th><th className="text-right">Income</th></tr></thead><tbody>{filtered.map((c) => <tr key={c.geoid} className="cursor-pointer" onClick={() => { setSelected(c); if (c.centroidLng != null && c.centroidLat != null) mapRef.current?.flyTo({ center: [c.centroidLng, c.centroidLat], zoom: 7, essential: true }); }}><td><div className="font-semibold">{c.name}</div><div className="text-xs text-mute">FIPS {c.geoid}</div></td><td className="text-right">{num(c.population)}</td><td className="text-right">{money(c.medianHouseholdIncome)}</td></tr>)}</tbody></table></div>
          </>}
        </div>
        <div className="order-1 lg:order-2"><DynamicMap center={{ lat: 37.2, lng: -119.7 }} zoom={4.8} className="tall" onReady={(map) => {
          mapRef.current = map;
          map.addSource("counties", { type: "geojson", data: { type: "FeatureCollection", features: [] } });
          map.addLayer({ id: "county-fill", type: "fill", source: "counties", paint: { "fill-color": "#a7d7ce", "fill-opacity": 0.7 } });
          map.addLayer({ id: "county-line", type: "line", source: "counties", paint: { "line-color": "#ffffff", "line-width": 1 } });
          map.on("click", "county-fill", (e: any) => { const p = e.features?.[0]?.properties; if (p?.geoid && data) setSelected(data.counties.find((c) => c.geoid === p.geoid) ?? null); });
          map.on("mouseenter", "county-fill", () => { map.getCanvas().style.cursor = "pointer"; });
          map.on("mouseleave", "county-fill", () => { map.getCanvas().style.cursor = ""; });
        }} /></div>
      </div>
      <div className="card p-5 sm:p-6"><h2 className="font-display text-xl font-bold">How to read the county explorer</h2><p className="mt-3 leading-7 text-mute">The map combines current Census county geography with recent ACS 5-year estimates. Change the metric to compare population, income, density, poverty, education or home value across every county in one state. The table uses the same joined data and can be searched by county name or FIPS code, sorted, and exported to CSV.</p><p className="mt-3 leading-7 text-mute">ACS values are estimates, not administrative live counts. Small counties can have wider margins of error, and rankings based on close values should not be treated as precise league tables. For a single address or point, use the dedicated <a href="/tools/address-to-county-lookup" className="font-semibold text-brand-strong hover:underline">Address to County Lookup</a>; use this explorer when your question is comparative and statewide.</p></div>
    </div>
  );
}
