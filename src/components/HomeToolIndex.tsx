import Link from "next/link";
import { CATEGORIES, TOOLS } from "@/lib/registry";

const HOME_TOOL_SLUGS = [
  "what-county-am-i-in",
  "what-state-am-i-in",
  "what-zip-code-am-i-in",
  "what-country-am-i-in",
  "find-my-location",
  "latitude-longitude-finder",
  "distance-between-two-places",
  "driving-distance-calculator",
  "drive-time-map",
  "map-radius",
  "cities-within-radius",
  "zip-codes-within-radius",
  "map-area-calculator",
  "lot-size-calculator",
  "elevation-finder",
  "timezone-map-finder",
  "gpx-viewer",
  "kml-viewer",
  "geojson-viewer",
  "csv-to-map",
  "sunrise-sunset-calculator",
  "bearing-calculator",
  "halfway-between-two-places",
  "distance-matrix-calculator",
];

export default function HomeToolIndex() {
  const tools = HOME_TOOL_SLUGS.map((slug) => TOOLS.find((tool) => tool.slug === slug)).filter(Boolean);

  return (
    <section aria-labelledby="home-tool-index" className="border-t border-line py-12">
      <div className="mx-auto max-w-5xl px-4">
        <div className="max-w-3xl">
          <p className="font-sans text-[11px] font-extrabold uppercase tracking-[0.14em] text-brand-strong">Popular tools directory</p>
          <h2 id="home-tool-index" className="sect-h mt-2">Useful map tools, explained before you open them</h2>
          <p className="mt-3 leading-relaxed text-mute">Browse common MapBench tools in a compact reading-first format. Each entry tells you what the tool actually does, then links straight to the interactive workspace.</p>
        </div>

        <div className="mt-8 grid gap-x-12 gap-y-7 lg:grid-cols-2">
          {tools.map((tool) => {
            if (!tool) return null;
            const category = CATEGORIES.find((c) => c.id === tool.category)?.label;
            return (
              <article key={tool.slug} className="border-b border-line pb-6 last:border-0 lg:last:border-b">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-display text-[17px] font-bold leading-snug">
                    <Link href={`/tools/${tool.slug}`} className="underline decoration-line underline-offset-4 hover:text-brand-strong hover:decoration-brand">{tool.name}</Link>
                  </h3>
                  {tool.scope === "US focused" && <span className="font-sans text-[9px] font-extrabold uppercase tracking-wide text-brand-strong">US</span>}
                </div>
                <p className="mt-2 text-[14px] leading-6 text-mute">{tool.short}</p>
                <div className="mt-2 font-sans text-[11px] font-semibold text-mute">{category}{category ? " · " : ""}{tool.scope}</div>
                <Link href={`/tools/${tool.slug}`} className="mt-3 inline-block font-sans text-[12px] font-extrabold text-brand-strong hover:underline">Open {tool.name} →</Link>
              </article>
            );
          })}
        </div>

        <div className="mt-8 rounded-xl border border-line bg-well/35 px-5 py-4 text-sm text-mute">
          Need something more specific? <Link href="/tools" className="font-extrabold text-brand-strong hover:underline">Browse all {TOOLS.length} tools →</Link>
        </div>
      </div>
    </section>
  );
}
