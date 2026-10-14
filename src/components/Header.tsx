"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CATEGORIES, TOOLS } from "@/lib/registry";
import LanguageSwitcher from "@/components/LanguageSwitcher";

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

const TOOL_GROUPS = CATEGORIES.map((category) => ({
  category,
  tools: TOOLS.filter((tool) => tool.category === category.id),
})).filter((group) => group.tools.length > 0);

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
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setToolsOpen(false);
        setMapsOpen(false);
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-canvas/95 backdrop-blur">
      <a href="#main" className="skip-link">Skip to content</a>
      <div className="container-sf flex h-12 items-center gap-4">
        <Link href="/" aria-label="MapBench home"><Logo /></Link>
        <nav className="ml-auto hidden items-center gap-1 md:flex" aria-label="Main">
          <div className="relative" ref={toolsRef}>
            <button
              type="button"
              className={`rounded px-2.5 py-1.5 text-[13px] font-bold transition hover:text-brand-strong ${toolsOpen ? "bg-brand-soft text-brand-strong" : ""}`}
              aria-expanded={toolsOpen}
              aria-controls="desktop-tools-mega-menu"
              onClick={() => { setToolsOpen((v) => !v); setMapsOpen(false); }}
            >
              Tools <span aria-hidden className={`inline-block text-[10px] transition-transform ${toolsOpen ? "rotate-180" : ""}`}>▾</span>
            </button>

            {toolsOpen && (
              <div id="desktop-tools-mega-menu" className="fixed inset-x-0 top-12 z-50 border-y border-line bg-card/98 shadow-2xl backdrop-blur-xl">
                <div className="mx-auto max-h-[calc(100vh-3rem)] max-w-[1540px] overflow-y-auto px-6 py-6 lg:px-8">
                  <div className="mb-6 flex flex-wrap items-end justify-between gap-4 border-b border-line pb-4">
                    <div>
                      <div className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-brand-strong">MapBench tool directory</div>
                      <div className="mt-1 font-display text-2xl font-bold">Browse all {TOOLS.length} geographic tools</div>
                      <p className="mt-1 max-w-2xl text-xs leading-5 text-mute">Every tool is listed below by task. Choose a tool directly without opening the full directory page.</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button type="button" className="btn btn-ghost btn-sm" onClick={() => { setToolsOpen(false); window.dispatchEvent(new CustomEvent("sf-open-search")); }}>Search tools</button>
                      <Link href="/tools" className="btn btn-primary btn-sm">View all tools →</Link>
                    </div>
                  </div>

                  <div className="grid items-start gap-x-8 gap-y-9 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
                    {TOOL_GROUPS.map(({ category, tools }) => (
                      <section key={category.id} className="min-w-0">
                        <div className="mb-3 flex items-center justify-between gap-2 border-b border-line pb-2">
                          <Link href={`/tools/category/${category.id}`} className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-brand-strong hover:underline">{category.label}</Link>
                          <span className="text-[10px] font-bold text-mute">{tools.length}</span>
                        </div>
                        <ul className="space-y-1.5">
                          {tools.map((tool) => (
                            <li key={tool.slug}>
                              <Link href={`/tools/${tool.slug}`} className="block text-[13px] font-medium leading-[1.35] text-ink transition hover:translate-x-0.5 hover:text-brand-strong hover:underline">
                                {tool.name}
                                {tool.scope === "US focused" && <span className="ml-1 align-super text-[8px] font-extrabold uppercase tracking-wide text-brand">US</span>}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </section>
                    ))}
                  </div>

                  <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4 text-xs text-mute">
                    <span>{TOOLS.length} tools across {TOOL_GROUPS.length} categories.</span>
                    <Link href="/tools" className="font-extrabold text-brand-strong hover:underline">View the complete searchable tool directory →</Link>
                  </div>
                </div>
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

          <Link href="/studies" className="rounded px-2.5 py-1.5 text-[13px] font-bold hover:text-brand-strong">Studies</Link>
          <Link href="/guides" className="rounded px-2.5 py-1.5 text-[13px] font-bold hover:text-brand-strong">Guides</Link>
          <Link href="/about" className="rounded px-2.5 py-1.5 text-[13px] font-bold hover:text-brand-strong">About</Link>
          <button type="button" className="ml-2 rounded border border-line px-2.5 py-1 text-[12px] font-bold text-mute hover:border-brand hover:text-brand-strong" onClick={() => window.dispatchEvent(new CustomEvent("sf-open-search"))}>Search <kbd className="ml-1 text-[10px]">⌘K</kbd></button>
          <LanguageSwitcher />
          <ThemeToggle />
        </nav>

        <div className="ml-auto flex items-center gap-1 md:hidden">
          <LanguageSwitcher />
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
              <Link href="/studies" className="text-brand-strong">Studies</Link>
              <Link href="/guides" className="text-brand-strong">Guides</Link>
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
              <div className="mb-2 flex items-center justify-between"><div className="text-[11px] font-extrabold uppercase tracking-wider text-mute">All tools by category</div><span className="text-[10px] font-bold text-mute">{TOOLS.length} tools</span></div>
              <div className="divide-y divide-line rounded-xl border border-line bg-card">
                {TOOL_GROUPS.map(({ category, tools }) => (
                  <details key={category.id} className="group px-3 py-3">
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-extrabold marker:content-none">
                      <span>{category.label}</span>
                      <span className="flex items-center gap-2 text-xs text-mute"><span>{tools.length}</span><span className="transition group-open:rotate-45">+</span></span>
                    </summary>
                    <ul className="mt-3 grid gap-2 pl-1">
                      {tools.map((tool) => <li key={tool.slug}><Link href={`/tools/${tool.slug}`} className="block text-sm leading-5 text-mute hover:text-brand-strong">{tool.name}{tool.scope === "US focused" && <span className="ml-1 align-super text-[8px] font-extrabold uppercase text-brand">US</span>}</Link></li>)}
                    </ul>
                    <Link href={`/tools/category/${category.id}`} className="mt-3 inline-block text-xs font-extrabold text-brand-strong hover:underline">View {category.label} category →</Link>
                  </details>
                ))}
              </div>
            </div>
          </div>
        </nav>
      )}
    </header>
  );
}

export { default as Footer } from "./Footer";
