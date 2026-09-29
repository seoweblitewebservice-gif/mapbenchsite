import Link from "next/link";
import { TOOLS } from "@/lib/registry";

const POPULAR: [string, string][] = [
  ["/tools/find-my-location", "Find My Location"],
  ["/tools/what-county-am-i-in", "What County Am I In?"],
  ["/tools/distance-between-two-places", "Distance Calculator"],
  ["/tools/drive-time-map", "Drive Time Map"],
  ["/tools/map-radius", "Map Radius Tool"],
  ["/tools/latitude-longitude-finder", "Lat & Long Finder"],
  ["/tools/fuel-cost-calculator", "Fuel Cost Calculator"],
  ["/tools/gpx-viewer", "GPX Viewer"],
  ["/tools/csv-to-map", "CSV to Map"],
];

const MAPS: [string, string][] = [
  ["/maps?map=us", "United States"],
  ["/maps?map=world", "World"],
  ["/maps?map=cont-europe", "Europe"],
  ["/maps?map=s-California", "California"],
  ["/maps?map=c-India", "India"],
  ["/maps?map=c-Japan", "Japan"],
  ["/maps?map=c-Australia", "Australia"],
];

const RESOURCES: [string, string][] = [
  ["/tools", `All ${TOOLS.length} tools`],
  ["/maps", "Blank map library"],
  ["/guides", "Blog"],
  ["/methodology", "Methodology"],
  ["/data-sources", "Data sources"],
  ["/editorial-policy", "Editorial policy"],
  ["/about", "About"],
  ["/contact", "Contact"],
];

export default function Footer() {
  return (
    <footer className="mt-16 bg-[#221d15] text-[#d9d2c0]">
      <div className="container-sf grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-5">
        <div className="lg:col-span-1">
          <div className="font-display text-lg font-bold text-[#f3edda]">map<span className="text-[#7cc39d]">bench</span></div>
          <p className="mt-3 font-serif text-sm leading-relaxed text-[#a89f8c]">
            Free geographic tools and practical mapping guides built on documented methods and open data.
          </p>
        </div>
        <FooterCol title="Popular tools" links={POPULAR} more={["/tools", "All tools →"]} />
        <FooterCol title="Blank maps" links={MAPS} more={["/maps", "All maps →"]} />
        <FooterCol title="Resources" links={RESOURCES} />
        <FooterCol
          title="Legal & trust"
          links={[
            ["/privacy", "Privacy Policy"],
            ["/terms", "Terms of Use"],
            ["/editorial-policy", "Editorial Policy"],
            ["/contact", "Contact"],
          ]}
        />
      </div>
      <div className="border-t border-[#3a3428] py-4">
        <div className="container-sf flex flex-col items-center justify-between gap-2 font-serif text-xs text-[#8d8574] sm:flex-row">
          <span>© {new Date().getFullYear()} MapBench · Free geographic tools for everyone.</span>
          <span>Data sources and licences are documented on-site.</span>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, links, more }: { title: string; links: [string, string][]; more?: [string, string] }) {
  return (
    <nav aria-label={title}>
      <div className="mb-2.5 text-[10px] font-extrabold uppercase tracking-widest text-[#8d8574]">{title}</div>
      <ul className="space-y-2">
        {links.map(([href, label]) => (
          <li key={href}>
            <Link href={href} className="font-serif text-sm text-[#c9c1ad] transition-colors hover:text-[#7cc39d] hover:underline">
              {label}
            </Link>
          </li>
        ))}
        {more && (
          <li className="pt-1">
            <Link href={more[0]} className="font-sans text-sm font-extrabold text-[#7cc39d] hover:underline">{more[1]}</Link>
          </li>
        )}
      </ul>
    </nav>
  );
}
