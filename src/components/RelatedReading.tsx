import Link from "next/link";
import type { ToolDef } from "@/lib/registry";
import { RESOURCE_CLUSTERS, TOOL_RESOURCE_OVERRIDES } from "@/data/resourceClusters";

export default function RelatedReading({ tool }: { tool: ToolDef }) {
  const override = TOOL_RESOURCE_OVERRIDES[tool.slug] || [];
  const category = RESOURCE_CLUSTERS[tool.category] || [];
  const seen = new Set<string>();
  const links = [...override, ...category]
    .filter((item) => {
      if (seen.has(item.href)) return false;
      seen.add(item.href);
      return true;
    })
    .slice(0, 3);

  if (!links.length) return null;

  return (
    <section aria-label="Related guides and studies">
      <h2 className="font-display text-2xl font-bold tracking-tight">Go deeper: guides &amp; original studies</h2>
      <p className="mt-3">
        Use these resources when you need the reasoning behind the calculation, a comparison with another geographic method,
        or an example of the same approach applied across a dataset.
      </p>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        {links.map((item) => (
          <Link key={item.href} href={item.href} className="rounded-lg border border-line bg-card px-4 py-3 hover:border-brand">
            <span className="font-sans text-[10px] font-extrabold uppercase tracking-wide text-mute">{item.kind}</span>
            <span className="mt-1 block font-sans text-sm font-extrabold text-brand-strong">{item.label}</span>
            <span className="mt-1 block text-sm leading-relaxed text-mute">{item.note}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
