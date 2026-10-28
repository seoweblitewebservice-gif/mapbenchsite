"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type SearchTool = {
  slug: string;
  name: string;
  short: string;
  category: string;
  categoryLabel: string;
  scope: string;
  keywords: string[];
};

type Props = {
  tools: SearchTool[];
  suggested: SearchTool[];
  compact?: boolean;
};

const QUICK_CATEGORIES = [
  ["Location", "/tools/category/location"],
  ["Distance", "/tools/category/distance"],
  ["Radius & area", "/tools/category/radius"],
  ["Coordinates", "/tools/category/coordinates"],
  ["Routing", "/tools/category/routing"],
  ["Map files", "/tools/category/files"],
] as const;

function score(tool: SearchTool, query: string) {
  const q = query.toLowerCase().trim();
  if (!q) return 0;
  const name = tool.name.toLowerCase();
  const slug = tool.slug.replace(/-/g, " ").toLowerCase();
  const category = tool.categoryLabel.toLowerCase();
  const short = tool.short.toLowerCase();
  const keywords = tool.keywords.join(" ").toLowerCase();

  let points = 0;
  if (name === q) points += 100;
  if (name.startsWith(q)) points += 70;
  if (name.includes(q)) points += 45;
  if (slug.startsWith(q)) points += 35;
  if (slug.includes(q)) points += 25;
  if (keywords.includes(q)) points += 22;
  if (category.includes(q)) points += 12;
  if (short.includes(q)) points += 8;
  return points;
}

export default function HomeToolFinder({ tools, suggested, compact = false }: Props) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);

  const results = useMemo(() => {
    if (query.trim().length < 2) return [];
    return tools
      .map((tool) => ({ tool, score: score(tool, query) }))
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score || a.tool.name.localeCompare(b.tool.name))
      .slice(0, 8)
      .map((item) => item.tool);
  }, [query, tools]);

  const submit = () => {
    if (results[0]) router.push(`/tools/${results[0].slug}`);
    else if (query.trim()) router.push(`/tools?q=${encodeURIComponent(query.trim())}`);
  };

  return (
    <div className="mx-auto mt-8 w-full max-w-4xl text-left">
      <div className="relative">
        <label htmlFor="home-tool-search" className="mb-2 block font-sans text-xs font-extrabold uppercase tracking-[0.12em] text-ink">
          Find the right map tool
        </label>
        <div className="relative rounded-xl border border-line bg-card shadow-sm transition focus-within:border-brand focus-within:ring-2 focus-within:ring-brand/10">
          <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-lg text-mute" aria-hidden>⌕</span>
          <input
            id="home-tool-search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => window.setTimeout(() => setFocused(false), 140)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                submit();
              }
            }}
            placeholder="Try radius, county, drive time, coordinates, GPX…"
            autoComplete="off"
            className="h-14 w-full rounded-xl bg-transparent pl-12 pr-28 font-sans text-[15px] text-ink outline-none placeholder:text-mute"
            role="combobox"
            aria-expanded={focused && query.trim().length >= 2}
            aria-controls="home-tool-search-results"
          />
          <button type="button" onClick={submit} className="btn btn-primary absolute right-2 top-2 h-10 px-4 text-sm">
            Search
          </button>
        </div>

        {focused && query.trim().length >= 2 && (
          <div id="home-tool-search-results" className="absolute z-30 mt-2 w-full overflow-hidden rounded-xl border border-line bg-card text-left shadow-xl">
            {results.length > 0 ? (
              <div className="divide-y divide-line">
                {results.map((tool) => (
                  <Link key={tool.slug} href={`/tools/${tool.slug}`} className="group flex items-start justify-between gap-4 px-4 py-3.5 transition hover:bg-brand-soft/40">
                    <div>
                      <div className="font-sans text-sm font-extrabold text-ink group-hover:text-brand-strong">{tool.name}</div>
                      <div className="mt-1 line-clamp-1 text-xs leading-relaxed text-mute">{tool.short}</div>
                    </div>
                    <span className="mt-0.5 shrink-0 rounded-full border border-line px-2 py-1 font-sans text-[10px] font-bold text-mute">{tool.categoryLabel}</span>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="px-4 py-4 text-sm text-mute">
                No exact match. Press Enter to search the full directory for “{query.trim()}”.
              </div>
            )}
          </div>
        )}
      </div>

      {!compact && (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="mr-1 font-sans text-[11px] font-bold uppercase tracking-wide text-mute">Browse:</span>
          {QUICK_CATEGORIES.map(([label, href]) => (
            <Link key={href} href={href} className="rounded-full border border-line bg-card/90 px-3 py-1.5 font-sans text-xs font-semibold text-ink transition hover:border-brand hover:text-brand-strong">
              {label}
            </Link>
          ))}
        </div>
      )}

      {!compact && (
      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {suggested.slice(0, 8).map((tool, index) => (
          <Link key={tool.slug} href={`/tools/${tool.slug}`} className="group rounded-xl border border-line bg-card/95 p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-brand hover:shadow-md">
            <div className="flex items-start justify-between gap-2">
              <span className="font-sans text-[10px] font-extrabold uppercase tracking-[0.1em] text-brand-strong">{index < 4 ? "Popular" : tool.categoryLabel}</span>
              <span className="text-sm text-mute transition group-hover:translate-x-0.5 group-hover:text-brand-strong">→</span>
            </div>
            <h2 className="mt-2 font-display text-[16px] font-bold leading-snug text-ink group-hover:text-brand-strong">{tool.name}</h2>
            <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-mute">{tool.short}</p>
          </Link>
        ))}
      </div>
      )}
    </div>
  );
}
