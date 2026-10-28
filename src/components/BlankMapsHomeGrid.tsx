import Link from "next/link";
import { geoMercator, geoAlbersUsa, geoPath, type GeoPermissibleObjects } from "d3-geo";
import { feature, merge } from "topojson-client";
import worldLand from "world-atlas/land-110m.json";
import countriesTopo from "world-atlas/countries-110m.json";
import usStates from "us-atlas/states-10m.json";

interface Thumb { id: string; name: string; d: string }

function pathFor(f: GeoJSON.Feature, albers: boolean): string {
  const projection = albers
    ? geoAlbersUsa().fitExtent([[4, 4], [156, 96]], f as GeoPermissibleObjects)
    : geoMercator().fitExtent([[4, 4], [156, 96]], f as GeoPermissibleObjects);
  return geoPath(projection)(f as GeoPermissibleObjects) ?? "";
}

const COUNTRY_PREVIEWS = [
  "India", "Brazil", "Australia", "Canada", "France", "Germany",
  "Japan", "Mexico", "Spain", "United Kingdom", "Italy", "South Africa",
];

const land = feature(worldLand as any, (worldLand as any).objects.land) as unknown as GeoJSON.Feature;
const countries = feature(countriesTopo as any, (countriesTopo as any).objects.countries) as unknown as GeoJSON.FeatureCollection;
const thumbs: Thumb[] = [{ id: "world", name: "World", d: pathFor(land, false) }];

for (const name of COUNTRY_PREVIEWS) {
  const f = (countries.features as any[]).find((x) => x.properties?.name === name);
  if (f) thumbs.push({ id: name.toLowerCase().replace(/\s+/g, "-"), name, d: pathFor(f, false) });
}

const mergedUs = merge(usStates as any, (usStates as any).objects.states.geometries);
const us: Thumb = {
  id: "united-states",
  name: "United States",
  d: pathFor({ type: "Feature", properties: {}, geometry: mergedUs } as GeoJSON.Feature, true),
};
const all = [thumbs[0], us, ...thumbs.slice(1)];

export default function BlankMapsHomeGrid({ limit }: { limit?: number }) {
  const items = typeof limit === "number" ? all.slice(0, limit) : all;
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      {items.map((t) => (
        <Link key={t.id} href="/maps" className="card group overflow-hidden">
          <div className="bg-white p-2 dark:bg-[#141210]">
            <svg viewBox="0 0 160 100" className="h-auto w-full" role="img" aria-label={`Blank map of ${t.name}`}>
              <path d={t.d} fill="var(--sf-brand-soft)" stroke="var(--sf-brand)" strokeWidth="1" strokeLinejoin="round" />
            </svg>
          </div>
          <div className="border-t border-line px-3 py-2">
            <span className="font-display text-sm font-bold group-hover:text-brand-strong">{t.name}</span>
            <span className="ml-2 text-[10px] font-bold uppercase tracking-wide text-mute">SVG · PNG</span>
          </div>
        </Link>
      ))}
    </div>
  );
}
