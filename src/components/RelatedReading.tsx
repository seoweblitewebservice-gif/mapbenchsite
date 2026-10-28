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
      <ul className="mt-4 space-y-4">
        {links.map(item => <li key={item.href} className="border-l-2 border-line pl-4">
          <span className="text-xs font-bold uppercase tracking-wide text-mute">{item.kind} · </span>
          <Link href={item.href} className="editorial-link font-semibold">{item.label}</Link>
          <p className="mt-1 text-sm leading-7 text-mute">{item.note}</p>
        </li>)}
      </ul>
    </section>
  );
}
