"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CATEGORIES, TOOLS, type CategoryId } from "@/lib/registry";

export default function ToolsDirectory() {
  const sp = useSearchParams();
  const [q, setQ] = useState(sp.get("q") ?? "");
  const cat = (sp.get("cat") ?? "") as CategoryId | "";

  const results = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return TOOLS.filter((t) => {
      if (cat && t.category !== cat) return false;
      if (!needle) return true;
      return needle.split(/\s+/).every((w) => `${t.name} ${t.short} ${t.keywords.join(" ")} ${t.category}`.toLowerCase().includes(w));
    });
  }, [q, cat]);

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <input
            className="input !py-2.5 pl-9"
            placeholder={`Search ${TOOLS.length} tools…`}
            aria-label="Search tools"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden className="absolute left-3 top-1/2 -translate-y-1/2 text-mute"><circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" /><path d="m20 20-3.5-3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
        </div>
        <span className="text-sm text-mute">{results.length} tool{results.length !== 1 ? "s" : ""}</span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        <Link href="/tools" className={`chip !py-1.5 ${!cat ? "!border-transparent chip-brand" : "hover:border-brand"}`}>All</Link>
        {CATEGORIES.map((c) => (
          <Link key={c.id} href={`/tools/category/${c.id}`} className="chip !py-1.5 hover:border-brand">
            <span className="h-2 w-2 rounded-full" style={{ background: c.tone }} aria-hidden />
            {c.label}
          </Link>
        ))}
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {results.map((t) => (
          <Link key={t.slug} href={`/tools/${t.slug}`} className="card group flex flex-col p-4 transition-colors hover:border-brand">
            <div className="flex items-start justify-between gap-2">
              <span className="font-bold leading-snug group-hover:text-brand-strong">{t.name}</span>
              <span className="chip chip-brand shrink-0">Free</span>
            </div>
            <p className="mt-1.5 line-clamp-2 flex-1 text-xs leading-relaxed text-mute">{t.short}</p>
            <div className="mt-3 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full" style={{ background: CATEGORIES.find((c) => c.id === t.category)?.tone }} aria-hidden />
              <span className="text-[11px] font-bold uppercase tracking-wide text-mute">{CATEGORIES.find((c) => c.id === t.category)?.label} · {t.scope}</span>
            </div>
          </Link>
        ))}
      </div>
      {!results.length && (
        <div className="card p-10 text-center text-sm text-mute">No tools match “{q}”. Try “distance”, “radius”, “coordinates” or “map”.</div>
      )}
    </div>
  );
}
