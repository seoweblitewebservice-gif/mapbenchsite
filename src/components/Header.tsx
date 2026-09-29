"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CATEGORIES, TOOLS } from "@/lib/registry";

export function Logo() {
  return (
    <span className="flex items-baseline font-display text-lg font-bold tracking-tight">
      <svg width="18" height="18" viewBox="0 0 32 32" fill="none" aria-hidden className="mr-1.5 self-center">
        <path d="M16 3c-5 0-9 4-9 8.9 0 6.5 7.4 14.4 8.4 15.5a.8.8 0 0 0 1.2 0c1-1.1 8.4-9 8.4-15.5C25 7 21 3 16 3Z" fill="var(--sf-brand)" />
        <circle cx="16" cy="12" r="3.4" fill="var(--sf-card)" />
      </svg>
      map<span className="text-brand">bench</span>
    </span>
  );
}

function ThemeToggle() {
  const [dark, setDark] = useState(false);
  useEffect(() => { setDark(document.documentElement.classList.contains("dark")); }, []);
  return (
    <button
      type="button"
      className="btn btn-ghost btn-sm"
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
      onClick={() => {
        const next = !dark;
        setDark(next);
        document.documentElement.classList.toggle("dark", next);
        try { localStorage.setItem("sf-theme", next ? "dark" : "light"); } catch { /* ignore */ }
      }}
    >
      {dark ? "☀" : "◐"}
    </button>
  );
}

const FEATURED_SLUGS = [
  "find-my-location",
  "what-county-am-i-in",
  "distance-between-two-places",
  "drive-time-map",
  "map-radius",
  "latitude-longitude-finder",
  "map-area-calculator",
  "fuel-cost-calculator",
  "gpx-viewer",
  "csv-to-map",
  "sunrise-sunset-calculator",
  "elevation-finder",
];
const FEATURED = FEATURED_SLUGS.map((slug) => TOOLS.find((t) => t.slug === slug)).filter(Boolean);

const MAPS_MENU: { title: string; links: [string, string][]; more?: [string, string] }[] = [
  {
    title: "Popular maps",
    links: [
      ["/maps?map=world", "World"],
      ["/maps?map=us", "United States"],
      ["/maps?map=c-India", "India"],
      ["/maps?map=c-United-Kingdom", "United Kingdom"],
      ["/maps?map=c-Japan", "Japan"],
      ["/maps?map=c-Australia", "Australia"],
    ],
    more: ["/maps", "Browse all maps →"],
  },
  {
    title: "Region tools",
    links: [
      ["/tools/what-county-am-i-in", "What County Am I In?"],
      ["/tools/cities-within-radius", "Cities Within Radius"],
      ["/tools/population-within-radius", "Population Within Radius"],
      ["/tools/map-area-calculator", "Map Area Calculator"],
      ["/tools/service-area-map", "Service Area Map"],
      ["/tools/multi-radius-map", "Multiple Radius Tool"],
    ],
    more: ["/tools", "All tools →"],
  },
];

export default function Header() {
  const [open, setOpen] = useState(false);
  const [toolsOpen, setToolsOpen] = useState(false);
  const [mapsOpen, setMapsOpen] = useState(false);
  const toolsRef = useRef<HTMLDivElement>(null);
  const mapsRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  useEffect(() => { setOpen(false); setToolsOpen(false); setMapsOpen(false); }, [pathname]);
  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!toolsRef.current?.contains(e.target as Node)) setToolsOpen(false);
      if (!mapsRef.current?.contains(e.target as Node)) setMapsOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-canvas/95 backdrop-blur">
      <a href="#main" className="skip-link">Skip to content</a>
      <div className="container-sf flex h-12 items-center gap-4">
        <Link href="/" aria-label="MapBench home"><Logo /></Link>
        <nav className="ml-auto hidden items-center gap-1 md:flex" aria-label="Main">
          <div className="relative" ref={toolsRef}>
            <button type="button" className="rounded px-2.5 py-1.5 text-[13px] font-bold hover:text-brand-strong" aria-expanded={toolsOpen} onClick={() => { setToolsOpen((v) => !v); setMapsOpen(false); }}>
              Tools <span aria-hidden className="text-[10px]">▾</span>
            </button>
            {toolsOpen && (
              <div className="absolute right-0 top-full mt-1 w-[min(46rem,92vw)] rounded-lg border border-line bg-card p-5 shadow-xl">
                <div className="grid gap-6 sm:grid-cols-2">
                  <div>
                    <div className="mb-2 text-[11px] font-extrabold uppercase tracking-wider text-mute">Featured tools</div>
                    <ul className="grid gap-1.5 sm:grid-cols-2">
                      {FEATURED.map((t) => t && <li key={t.slug}><Link href={`/tools/${t.slug}`} className="text-[13px] font-semibold hover:text-brand-strong hover:underline">{t.name}</Link></li>)}
                    </ul>
                  </div>
                  <div>
                    <div className="mb-2 text-[11px] font-extrabold uppercase tracking-wider text-mute">Browse by category</div>
                    <ul className="grid gap-1.5 sm:grid-cols-2">
                      {CATEGORIES.map((c) => <li key={c.id}><Link href={`/tools?cat=${c.id}`} className="text-[13px] font-semibold hover:text-brand-strong hover:underline">{c.label}</Link></li>)}
                    </ul>
                  </div>
                </div>
                <div className="mt-5 border-t border-line pt-3 text-right"><Link href="/tools" className="text-[13px] font-extrabold text-brand-strong hover:underline">Browse the full directory →</Link></div>
              </div>
            )}
          </div>

          <div className="relative" ref={mapsRef}>
            <button type="button" className="rounded px-2.5 py-1.5 text-[13px] font-bold hover:text-brand-strong" aria-expanded={mapsOpen} onClick={() => { setMapsOpen((v) => !v); setToolsOpen(false); }}>
              Maps <span aria-hidden className="text-[10px]">▾</span>
            </button>
            {mapsOpen && (
              <div className="absolute right-0 top-full mt-1 w-[min(42rem,92vw)] rounded-lg border border-line bg-card p-5 shadow-xl">
                <div className="grid gap-6 sm:grid-cols-2">
                  {MAPS_MENU.map((col) => (
                    <div key={col.title}>
                      <div className="mb-2 text-[11px] font-extrabold uppercase tracking-wider text-mute">{col.title}</div>
                      <ul className="space-y-1.5">
                        {col.links.map(([href, label]) => <li key={href}><Link href={href} className="text-[13px] font-semibold hover:text-brand-strong hover:underline">{label}</Link></li>)}
                        {col.more && <li className="pt-1"><Link href={col.more[0]} className="text-[13px] font-extrabold text-brand-strong hover:underline">{col.more[1]}</Link></li>}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <Link href="/guides" className="rounded px-2.5 py-1.5 text-[13px] font-bold hover:text-brand-strong">Blog</Link>
          <Link href="/about" className="rounded px-2.5 py-1.5 text-[13px] font-bold hover:text-brand-strong">About</Link>
          <button type="button" className="ml-2 rounded border border-line px-2.5 py-1 text-[12px] font-bold text-mute hover:border-brand hover:text-brand-strong" onClick={() => window.dispatchEvent(new CustomEvent("sf-open-search"))}>Search <kbd className="ml-1 text-[10px]">⌘K</kbd></button>
          <ThemeToggle />
        </nav>

        <div className="ml-auto flex items-center gap-1 md:hidden">
          <ThemeToggle />
          <button type="button" className="btn btn-ghost btn-sm" aria-expanded={open} aria-label="Toggle menu" onClick={() => setOpen((v) => !v)}>
            {open ? "×" : "☰"}
          </button>
        </div>
      </div>

      {open && (
        <nav className="max-h-[80vh] overflow-y-auto border-t border-line bg-canvas md:hidden" aria-label="Mobile">
          <div className="container-sf space-y-5 py-4">
            <div className="flex flex-wrap gap-4 text-sm font-extrabold">
              <Link href="/tools" className="text-brand-strong">All tools</Link>
              <Link href="/maps" className="text-brand-strong">Maps</Link>
              <Link href="/guides" className="text-brand-strong">Blog</Link>
              <Link href="/about" className="text-brand-strong">About</Link>
            </div>
            <button type="button" className="btn btn-ghost btn-sm w-full" onClick={() => window.dispatchEvent(new CustomEvent("sf-open-search"))}>Search tools…</button>
            <div>
              <div className="mb-2 text-[11px] font-extrabold uppercase tracking-wider text-mute">Featured tools</div>
              <ul className="grid grid-cols-2 gap-2">
                {FEATURED.slice(0, 8).map((t) => t && <li key={t.slug}><Link href={`/tools/${t.slug}`} className="text-sm font-semibold hover:text-brand-strong">{t.name}</Link></li>)}
              </ul>
            </div>
            <div>
              <div className="mb-2 text-[11px] font-extrabold uppercase tracking-wider text-mute">Categories</div>
              <ul className="grid grid-cols-2 gap-2">
                {CATEGORIES.map((c) => <li key={c.id}><Link href={`/tools?cat=${c.id}`} className="text-sm font-semibold hover:text-brand-strong">{c.label}</Link></li>)}
              </ul>
            </div>
          </div>
        </nav>
      )}
    </header>
  );
}

export { default as Footer } from "./Footer";
