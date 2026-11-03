import Link from "next/link";
import { HUB_NAV } from "@/lib/hubNav";

/**
 * Static, always-rendered hub navigation.
 *
 * The header mega-menu only exists in the DOM after a click, which means the
 * hub links inside it are not crawlable from every page. This strip lists every
 * hub as a plain anchor, so every page — tool, guide, best-of or article —
 * passes a link to all fourteen pillars.
 *
 * Layout: one row, always. The strip used to wrap onto a second line at
 * common laptop widths, which doubled the height of the sticky header on every
 * page of the site. It now scrolls horizontally instead of wrapping, sits on a
 * single baseline, and is deliberately quieter than the logo row so it reads as
 * a utility index rather than a second navigation bar.
 */
export default function HubNavLinks() {
  return (
    <div className="border-b border-line bg-well/60">
      <nav
        aria-label="Tool hubs"
        className="container-sf flex items-center gap-3 overflow-x-auto py-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        <span className="shrink-0 font-sans text-[10px] font-extrabold uppercase tracking-[0.12em] text-mute">
          Hubs
        </span>
        <ul className="flex items-center gap-3 whitespace-nowrap">
          {HUB_NAV.map((hub) => (
            <li key={hub.id} className="shrink-0">
              <Link
                href={hub.href}
                className="font-sans text-[11px] font-semibold text-mute transition-colors hover:text-brand-strong hover:underline"
              >
                {hub.label}
              </Link>
            </li>
          ))}
        </ul>
        <Link
          href="/best"
          className="shrink-0 whitespace-nowrap font-sans text-[11px] font-semibold text-mute transition-colors hover:text-brand-strong hover:underline"
        >
          Best of
        </Link>
      </nav>
    </div>
  );
}
