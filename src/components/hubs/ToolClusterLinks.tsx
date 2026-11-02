import Link from "next/link";
import type { ToolDef } from "@/lib/registry";
import {
  crossHubLinks, curatedRelated, guideForTool, parentHubLink, siblingTools, subHubForTool, toolsInHub,
} from "@/lib/hubNav";
import { hubForTool } from "@/data/hubs";

/**
 * The spoke-side of the internal linking structure, rendered as static HTML so
 * every link is crawlable without JavaScript.
 *
 *  - "Part of" links up to the parent hub and to the GIS sub-hub if there is one.
 *  - "Related tools" gives three to six siblings from the same cluster.
 *  - "You may also need" follows the cross-hub matrix for the tool's hub.
 *  - The guide block gives the tool-to-guide link the QA checklist asks for.
 */
export default function ToolClusterLinks({ tool, contentRelated }: { tool: ToolDef; contentRelated?: string[] | null }) {
  const hubId = hubForTool(tool);
  const hub = parentHubLink(tool);
  const sub = subHubForTool(tool.slug);
  // The curated "Related tools" grid above already links the editorially
  // chosen siblings, so this block adds the rest of the cluster (neighbours in
  // the hub ordering) and never repeats a link the page already contains.
  const curated = new Set(curatedRelated(tool.slug, contentRelated).map((item) => item.slug));
  const siblings = siblingTools(tool.slug, 10, contentRelated).filter((item) => !curated.has(item.slug)).slice(0, 4);
  const cross = crossHubLinks(hubId).slice(0, 4);
  const guide = guideForTool(tool.slug);
  const hubToolCount = toolsInHub(hubId).length;

  return (
    <div className="mt-10 space-y-10">
      {hub && (
        <section aria-labelledby="cluster-parent" className="rounded-2xl border border-brand/25 bg-brand-soft/40 p-5">
          <h2 id="cluster-parent" className="font-display text-lg font-bold">
            Part of our {hub.label.toLowerCase()} hub
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-mute">
            {tool.name} sits in the <Link href={hub.href} className="font-semibold text-brand-strong underline decoration-brand/30 underline-offset-4 hover:decoration-brand">{hub.label.toLowerCase()}</Link>{" "}
            cluster, alongside {hubToolCount - 1} other tools that answer neighbouring questions with different methods or datasets.
            {sub && <> It also belongs to the <Link href={sub.slug} className="font-semibold text-brand-strong underline decoration-brand/30 underline-offset-4 hover:decoration-brand">{sub.label}</Link> family.</>}
          </p>
        </section>
      )}

      {siblings.length > 0 && (
        <section aria-labelledby="cluster-siblings">
          <h2 id="cluster-siblings" className="font-display text-2xl font-bold tracking-tight">Elsewhere in this cluster</h2>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-mute">
            The same family of methods, so a comparison between two results is meaningful rather than apples-to-oranges.
          </p>
          <ul className="mt-4 space-y-3">
            {siblings.map((sibling) => (
              <li key={sibling.slug} className="border-l-2 border-line pl-4">
                <Link href={`/tools/${sibling.slug}`} className="editorial-link font-semibold">{sibling.name}</Link>
                <p className="mt-1 text-sm leading-7 text-mute">{sibling.short}</p>
              </li>
            ))}
          </ul>
        </section>
      )}

      {cross.length > 0 && (
        <section aria-labelledby="cluster-cross">
          <h2 id="cluster-cross" className="font-display text-2xl font-bold tracking-tight">You may also need</h2>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-mute">
            When this answer is only part of the job, these clusters cover the next step.
          </p>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {cross.map((other) => (
              <li key={other.id}>
                <Link href={other.slug} className="block rounded-xl border border-line bg-well/40 p-4 transition-colors hover:border-brand">
                  <span className="block font-sans text-sm font-extrabold text-brand-strong">{other.label} →</span>
                  <span className="mt-1.5 block text-sm leading-6 text-mute">{other.short}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {guide && (
        <section aria-labelledby="cluster-guide" className="rounded-2xl border border-line bg-white p-5 shadow-sm">
          <h2 id="cluster-guide" className="font-display text-xl font-bold">Read the guide behind this tool</h2>
          <p className="mt-2 text-sm leading-relaxed text-mute">
            <Link href={guide.href} className="font-semibold text-brand-strong underline decoration-brand/30 underline-offset-4 hover:decoration-brand">{guide.title}</Link>
            {guide.note ? <> — {guide.note}</> : null}
          </p>
        </section>
      )}
    </div>
  );
}
