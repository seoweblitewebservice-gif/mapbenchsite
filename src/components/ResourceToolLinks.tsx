import Link from "next/link";
import { TOOLS } from "@/lib/registry";
import { RESOURCE_CLUSTERS, TOOL_RESOURCE_OVERRIDES } from "@/data/resourceClusters";

/** Reciprocal links from a resource to tools that recommend that exact resource. */
export default function ResourceToolLinks({ href, exclude = [] }: { href: string; exclude?: string[] }) {
  const tools = TOOLS.filter(tool => !exclude.includes(tool.slug) &&
    [...(TOOL_RESOURCE_OVERRIDES[tool.slug] ?? []), ...(RESOURCE_CLUSTERS[tool.category] ?? [])].some(link => link.href === href))
    .sort((a, b) => Number(Boolean(b.popular)) - Number(Boolean(a.popular)))
    .slice(0, 4);
  if (!tools.length) return null;
  return <section className="mt-10 border-t border-line pt-8" aria-label="Tools connected to this resource">
    <h2 className="font-display text-2xl font-bold">Put this topic into practice</h2>
    <p className="mt-3 text-sm leading-7 text-mute">These tools link to this resource for background. Each has its own inputs, coverage and limitations; a related method does not mean an identical dataset.</p>
    <ul className="mt-5 grid gap-5 sm:grid-cols-2">{tools.map(tool => <li key={tool.slug}>
      <Link href={`/tools/${tool.slug}`} className="editorial-link font-semibold">{tool.name}</Link>
      <p className="mt-1 text-sm leading-7 text-mute">{tool.short}</p>
    </li>)}</ul>
  </section>;
}
