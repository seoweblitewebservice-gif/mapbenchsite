import Link from "next/link";
import { HUB_NAV } from "@/lib/hubNav";

/**
 * Static, always-rendered hub navigation.
 *
 * The header mega-menu only exists in the DOM after a click, which means the
 * hub links inside it are not crawlable from every page. This strip sits above
 * the header and lists all hubs as plain anchors, so every page — tool, guide,
 * best-of or article — passes a link to all twelve pillars.
 */
export default function HubNavLinks() {
  return (
    <div className="border-b border-line bg-well/60">
      <nav aria-label="Tool hubs" className="container-sf flex flex-wrap items-center gap-x-3.5 gap-y-1 py-1.5">
        <span className="font-sans text-[10px] font-extrabold uppercase tracking-[0.12em] text-mute">Hubs</span>
        {HUB_NAV.map((hub) => (
          <Link
            key={hub.id}
            href={hub.href}
            className="font-sans text-[12px] font-semibold text-mute transition-colors hover:text-brand-strong hover:underline"
          >
            {hub.label}
          </Link>
        ))}
        <Link href="/best" className="font-sans text-[12px] font-semibold text-mute transition-colors hover:text-brand-strong hover:underline">Best of</Link>
      </nav>
    </div>
  );
}
