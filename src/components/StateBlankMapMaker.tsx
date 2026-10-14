"use client";

import { useEffect, useMemo, useState } from "react";
import { geoCentroid, geoContains, geoMercator, geoPath, type GeoPermissibleObjects } from "d3-geo";
import { feature } from "topojson-client";
import { MAJOR_CITIES } from "@/data/cities";
import { downloadDataUrl, downloadText } from "@/lib/formats";
import { Seg, Spinner } from "@/components/ui";

type Variant = "blank" | "labeled" | "colored" | "cities";

type CountyItem = {
  id: string;
  name: string;
  feature: GeoJSON.Feature;
};

type LoadedState = {
  feature: GeoJSON.Feature;
  counties: CountyItem[];
};

const PALETTE = ["#e3eee8", "#f2eadc", "#e7edf3", "#f3e6df", "#ece9f3", "#e7f0ec", "#f1ebdf", "#e5edf0"];

function escapeXml(value: string) {
  return value.replace(/[<>&'\"]/g, (ch) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" }[ch] ?? ch));
}

function stateSvg(stateName: string, stateFeature: GeoJSON.Feature, counties: CountyItem[], variant: Variant, width: number, height: number) {
  const collection = { type: "FeatureCollection", features: counties.map((c) => c.feature) } as GeoJSON.FeatureCollection;
  const projection = geoMercator().fitExtent([[24, 24], [width - 24, height - 24]], collection as GeoPermissibleObjects);
  const path = geoPath(projection);
  const border = path(stateFeature as GeoPermissibleObjects) ?? "";

  let inner = counties.map((county, index) => {
    const d = path(county.feature as GeoPermissibleObjects) ?? "";
    const fill = variant === "colored" || variant === "cities" ? PALETTE[index % PALETTE.length] : "#ffffff";
    return `<path d="${d}" fill="${fill}" stroke="#53606a" stroke-width="0.8" stroke-linejoin="round"/>`;
  }).join("");

  inner += `<path d="${border}" fill="none" stroke="#1f2933" stroke-width="1.7" stroke-linejoin="round"/>`;

  if (variant === "labeled") {
    inner += counties.map((county) => {
      const [x, y] = path.centroid(county.feature as GeoPermissibleObjects);
      if (!Number.isFinite(x) || !Number.isFinite(y)) return "";
      const label = county.name.replace(/ County$| Parish$| Borough$| Census Area$/i, "");
      return `<text x="${x.toFixed(1)}" y="${y.toFixed(1)}" text-anchor="middle" font-family="Arial,sans-serif" font-size="${counties.length > 100 ? 6 : counties.length > 60 ? 7 : 8}" fill="#20262d">${escapeXml(label.slice(0, 18))}</text>`;
    }).join("");
  }

  if (variant === "cities") {
    const cities = MAJOR_CITIES.filter((city) => city.country === "United States" && geoContains(stateFeature as GeoPermissibleObjects, [city.lng, city.lat]));
    inner += cities.map((city) => {
      const xy = projection([city.lng, city.lat]);
      if (!xy) return "";
      return `<circle cx="${xy[0].toFixed(1)}" cy="${xy[1].toFixed(1)}" r="3" fill="#a3540c" stroke="#fff" stroke-width="1"/><text x="${(xy[0] + 5).toFixed(1)}" y="${(xy[1] + 3).toFixed(1)}" font-family="Arial,sans-serif" font-size="9" fill="#20262d">${escapeXml(city.name)}</text>`;
    }).join("");
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" role="img" aria-label="${escapeXml(stateName)} county blank map"><rect width="${width}" height="${height}" fill="#ffffff"/>${inner}</svg>`;
}

export default function StateBlankMapMaker({ stateName, stateFips, slug, divisionLabel }: { stateName: string; stateFips: string; slug: string; divisionLabel: string }) {
  const [data, setData] = useState<LoadedState | null>(null);
  const [variant, setVariant] = useState<Variant>("blank");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    Promise.all([import("us-atlas/states-10m.json"), import("us-atlas/counties-10m.json")])
      .then(([statesMod, countiesMod]: any[]) => {
        const statesTopo = statesMod.default ?? statesMod;
        const countiesTopo = countiesMod.default ?? countiesMod;
        const statesFc = feature(statesTopo, statesTopo.objects.states) as unknown as GeoJSON.FeatureCollection;
        const countiesFc = feature(countiesTopo, countiesTopo.objects.counties) as unknown as GeoJSON.FeatureCollection;
        const stateFeature = statesFc.features.find((f: any) => String(f.id).padStart(2, "0") === stateFips);
        if (!stateFeature) throw new Error("State boundary not found.");
        const countyItems = countiesFc.features
          .filter((f: any) => String(f.id).padStart(5, "0").startsWith(stateFips))
          .map((f: any) => ({ id: String(f.id).padStart(5, "0"), name: String(f.properties?.name ?? `FIPS ${f.id}`), feature: f as GeoJSON.Feature }))
          .sort((a, b) => a.name.localeCompare(b.name));
        if (!alive) return;
        setData({ feature: stateFeature as GeoJSON.Feature, counties: countyItems });
      })
      .catch(() => alive && setError("The US Census map geometry could not be loaded. Please refresh and try again."));
    return () => { alive = false; };
  }, [stateFips]);

  const preview = useMemo(() => data ? stateSvg(stateName, data.feature, data.counties, variant, 960, 620) : "", [data, stateName, variant]);

  const downloadSvg = () => {
    if (!data) return;
    downloadText(`mapbench-${slug}-${divisionLabel.replace(/\s+/g, "-")}-${variant}.svg`, stateSvg(stateName, data.feature, data.counties, variant, 1800, 1200), "image/svg+xml");
  };

  const downloadPng = () => {
    if (!data) return;
    const svg = stateSvg(stateName, data.feature, data.counties, variant, 1800, 1200);
    const blob = new Blob([svg], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = 2400;
      canvas.height = 1600;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.fillStyle = "#fff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      downloadDataUrl(`mapbench-${slug}-${variant}.png`, canvas.toDataURL("image/png"));
      URL.revokeObjectURL(url);
    };
    img.src = url;
  };

  if (error) return <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-900">{error}</div>;
  if (!data) return <div className="card flex min-h-64 items-center justify-center p-6"><Spinner label={`Loading ${stateName} ${divisionLabel}…`} /></div>;

  const [centroidLng, centroidLat] = geoCentroid(data.feature as GeoPermissibleObjects);

  return (
    <div className="space-y-5">
      <div className="card overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-4 py-3">
          <div>
            <div className="font-display text-lg font-bold">{stateName} {divisionLabel} map</div>
            <div className="text-xs text-mute">{data.counties.length} Census county-equivalent boundaries · choose a variant and download</div>
          </div>
          <Seg ariaLabel="Map variant" options={[
            { value: "blank" as Variant, label: "Blank" },
            { value: "labeled" as Variant, label: "Labeled" },
            { value: "colored" as Variant, label: "Colored" },
            { value: "cities" as Variant, label: "With cities" },
          ]} value={variant} onChange={setVariant} />
        </div>

        <div className="grid lg:grid-cols-[1fr,250px]">
          <div className="bg-white p-3" dangerouslySetInnerHTML={{ __html: preview }} />
          <aside className="space-y-3 border-t border-line p-4 lg:border-l lg:border-t-0">
            <div className="label">Download this map</div>
            <button type="button" className="btn btn-primary w-full" onClick={downloadSvg}>Download SVG</button>
            <button type="button" className="btn btn-ghost w-full" onClick={downloadPng}>Download PNG · 2400 px</button>
            <button type="button" className="btn btn-ghost w-full" onClick={() => window.print()}>Print / Save as PDF</button>
            <div className="rounded-lg bg-well px-3 py-2.5 text-xs leading-relaxed text-mute">SVG stays sharp at any size. PNG is convenient for documents and slides. Use your browser&apos;s print dialog to save a PDF.</div>
          </aside>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="card p-4"><div className="text-xs font-extrabold uppercase text-mute">County equivalents</div><div className="mt-1 font-display text-2xl font-bold">{data.counties.length}</div></div>
        <div className="card p-4"><div className="text-xs font-extrabold uppercase text-mute">State FIPS</div><div className="mt-1 font-display text-2xl font-bold">{stateFips}</div></div>
        <div className="card p-4"><div className="text-xs font-extrabold uppercase text-mute">Map centroid</div><div className="mt-1 font-display text-lg font-bold">{centroidLat.toFixed(2)}°, {centroidLng.toFixed(2)}°</div></div>
      </div>
    </div>
  );
}
