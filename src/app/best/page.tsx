import type { Metadata } from "next";
import Link from "next/link";
import { BEST_OF } from "@/data/bestOf";
import { HUBS } from "@/data/hubs";
import { HUB_NAV } from "@/lib/hubNav";

export const metadata: Metadata = {
  title: "Best Free Map Tools: Curated Lists by Task",
  description:
    "Curated shortlists of the best free map tools for distance, radius, area, routes, GPS files, coordinates and printable maps — each with what it is best for.",
  alternates: { canonical: "/best" },
};

export default function BestIndexPage() {
  return (
    <div className="doc mx-auto max-w-4xl">
      <nav aria-label="Breadcrumb" className="mb-5 font-sans text-xs text-mute">
        <Link href="/" className="hover:text-brand-strong">Home</Link> <span aria-hidden className="mx-1">/</span>
        <span className="font-semibold text-ink">Best of</span>
      </nav>

      <header>
        <p className="font-sans text-[11px] font-extrabold uppercase tracking-[0.14em] text-brand-strong">Short lists, not directories</p>
        <h1 className="mt-2 font-display text-4xl font-bold tracking-tight">Best Free Map Tools by Task</h1>
        <p className="mt-4 max-w-3xl text-[15px] leading-relaxed text-mute">
          Each page answers one question — the best free distance calculator, the best radius map tool, the best starting point for GPS files — with a short ordered list and a note on when to pick each one. No sponsored placements and no tools that need an account.
        </p>
      </header>

      <ul className="mt-8 grid gap-4 sm:grid-cols-2">
        {BEST_OF.map((page) => (
          <li key={page.slug}>
            <Link href={page.slug} className="card group flex h-full flex-col p-5 transition-colors hover:border-brand">
              <h2 className="font-display text-lg font-bold leading-snug group-hover:text-brand-strong">{page.h1}</h2>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-mute">{page.verdict}</p>
              <span className="mt-3 text-xs font-extrabold text-brand-strong">{page.picks.length} picks · read the list →</span>
            </Link>
          </li>
        ))}
      </ul>

      <section className="mt-12 border-t border-line pt-10" aria-labelledby="best-hubs">
        <h2 id="best-hubs" className="sect-h">Prefer to browse a whole cluster?</h2>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-mute">
          Every hub lists all of its tools with a short description, plus the method notes and guides behind them.
        </p>
        <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {HUB_NAV.map((hub) => (
            <li key={hub.id}>
              <Link href={hub.href} className="rounded-xl border border-line bg-well/40 p-4 transition-colors hover:border-brand">
                <span className="block font-sans text-sm font-extrabold text-brand-strong">{hub.label} →</span>
                <span className="mt-1 block text-xs text-mute">{hub.count} tools</span>
              </Link>
            </li>
          ))}
        </ul>
        <p className="mt-4 text-xs text-mute">Hubs: {HUBS.length} · curated lists: {BEST_OF.length}</p>
      </section>
    </div>
  );
}
