import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { permanentRedirect } from "next/navigation";
import ToolsDirectory from "@/components/ToolsDirectory";
import { CATEGORIES, TOOLS } from "@/lib/registry";

interface ToolsPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export async function generateMetadata({ searchParams }: ToolsPageProps): Promise<Metadata> {
  const params = await searchParams;
  const hasFilter = Boolean(params.cat || params.q);
  return {
    title: "All Free Map & Geographic Tools",
    description: "The complete MapBench directory: distance and bearing calculators, radius and area tools, routing, coordinate converters, KML/GPX/GeoJSON viewers, map makers and more.",
    alternates: { canonical: "/tools" },
    robots: hasFilter ? { index: false, follow: true } : { index: true, follow: true },
  };
}

export default async function ToolsPage({ searchParams }: ToolsPageProps) {
  const params = await searchParams;
  const catParam = Array.isArray(params.cat) ? params.cat[0] : params.cat;
  const qParam = Array.isArray(params.q) ? params.q[0] : params.q;
  const category = catParam ? CATEGORIES.find((item) => item.id === catParam) : undefined;

  // Old filtered URLs were discoverable as /tools?cat=files etc. The dedicated
  // category hubs now contain stronger unique content and direct tool links, so
  // consolidate those duplicate query URLs permanently without removing tools.
  if (category && !qParam) {
    permanentRedirect(`/tools/category/${category.id}`);
  }

  return (
    <div>
      <h1 className="font-display text-3xl font-bold tracking-tight">All tools</h1>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-mute">
        Every tool is free, works worldwide unless marked otherwise, and runs in your browser. Search by keyword, filter the full directory, or start with an editorial category hub that explains the method and common mistakes.
      </p>

      <div id="search-directory" className="mt-6">
        <Suspense fallback={<div className="card p-10 text-center text-sm text-mute">Loading directory…</div>}>
          <ToolsDirectory />
        </Suspense>
      </div>

      <section className="mt-8" aria-labelledby="tool-category-hubs">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 id="tool-category-hubs" className="font-display text-2xl font-bold tracking-tight">Explore by geographic task</h2>
            <p className="mt-2 max-w-3xl text-sm leading-relaxed text-mute">These category pages group related tools with methodology notes, key terms, practical guidance and links to relevant MapBench guides and studies.</p>
          </div>
          <span className="font-sans text-xs font-bold text-mute">{TOOLS.length} tools across {CATEGORIES.length} categories</span>
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {CATEGORIES.map((category) => {
            const count = TOOLS.filter((tool) => tool.category === category.id).length;
            return (
              <Link key={category.id} href={`/tools/category/${category.id}`} className="card group p-4 transition-colors hover:border-brand">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="font-display text-lg font-bold group-hover:text-brand-strong">{category.label}</h3>
                  <span className="chip">{count}</span>
                </div>
                <p className="mt-2 text-sm leading-relaxed text-mute">{category.short}</p>
                <span className="mt-3 block font-sans text-xs font-extrabold text-brand-strong">Open category guide →</span>
              </Link>
            );
          })}
        </div>
      </section>


    </div>
  );
}
