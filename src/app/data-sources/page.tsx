import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Data Sources & Attribution",
  description: "The open datasets behind MapBench: OpenStreetMap, OpenFreeMap, Photon, Nominatim, FOSSGIS Valhalla, OSRM, Open-Meteo, Natural Earth and the US Census — with licences and source links.",
  alternates: { canonical: "/data-sources" },
};

const SOURCES = [
  ["Map data & attribution", "OpenStreetMap", "Core street, place and administrative data used by several MapBench services.", "© OpenStreetMap contributors — Open Database License (ODbL)", "https://www.openstreetmap.org/copyright"],
  ["Map tiles", "OpenFreeMap", "Vector map tiles used by interactive maps.", "Map data © OpenStreetMap contributors; provider terms apply", "https://openfreemap.org/"],
  ["Place search (forward geocoding)", "Photon (komoot)", "Open-source geocoder built on OpenStreetMap data.", "Data © OpenStreetMap contributors (ODbL)", "https://github.com/komoot/photon"],
  ["Reverse geocoding", "Nominatim", "OpenStreetMap's community geocoder used for coordinate-to-place lookups.", "Data © OpenStreetMap contributors (ODbL); public-service usage policy applies", "https://operations.osmfoundation.org/policies/nominatim/"],
  ["Routing, isochrones, route optimisation", "Valhalla / FOSSGIS", "Road-network routing and reachable-area calculations based on OpenStreetMap roads.", "Data © OpenStreetMap contributors (ODbL); public-service fair-use limits apply", "https://github.com/valhalla/valhalla"],
  ["Routing fallback (driving)", "Project OSRM", "Open-source road routing used as a fallback where configured.", "Data © OpenStreetMap contributors (ODbL)", "https://project-osrm.org/"],
  ["Elevation", "Open-Meteo Elevation API", "Terrain elevation from the Copernicus DEM 2021 GLO-90 model at about 90 m resolution.", "Open-Meteo/Copernicus terms apply", "https://open-meteo.com/en/docs/elevation-api"],
  ["Nearby places (POI)", "Overpass API", "Live queries against OpenStreetMap for nearby mapped features.", "Data © OpenStreetMap contributors (ODbL)", "https://wiki.openstreetmap.org/wiki/Overpass_API"],
  ["Blank maps — world & countries", "Natural Earth (via world-atlas)", "Generalized 1:110m cultural/physical geometry for educational/reference blank maps.", "Natural Earth data is public domain", "https://www.naturalearthdata.com/"],
  ["Blank maps — US states & nation", "US Census TIGER/Line (via us-atlas)", "Generalized US state/national boundary topology.", "US government geographic data; see Census documentation", "https://www.census.gov/cgi-bin/geo/shapefiles/index.php"],
  ["Major cities dataset", "Curated by MapBench", "A small approximate major-city dataset used only where a page explicitly labels the result as an estimate.", "MapBench compilation; not a substitute for current official census data", "/methodology"],
  ["Astronomy", "Local calculation", "Solar calculations use standard published astronomy formulas; lunar phase is derived locally from synodic-month age.", "No external API for the core calculation", "/methodology"],
] as const;

export default function DataSourcesPage() {
  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="font-display text-3xl font-bold tracking-tight">Data Sources</h1>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-mute">
        MapBench uses open geographic datasets and public/open-source services. This page identifies what powers each feature,
        what the data is appropriate for, and where to verify the provider or licence directly.
      </p>
      <div className="mt-6 space-y-3">
        {SOURCES.map(([name, provider, desc, license, url]) => (
          <div key={name} className="card p-4">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <div className="font-bold">{name}</div>
              <a href={url} target={url.startsWith("http") ? "_blank" : undefined} rel={url.startsWith("http") ? "noopener noreferrer" : undefined} className="chip chip-brand hover:underline">
                {provider} ↗
              </a>
            </div>
            <p className="mt-1.5 text-sm leading-relaxed text-mute">{desc}</p>
            <p className="mt-1.5 text-xs font-semibold text-mute">Source/licence note: {license}</p>
          </div>
        ))}
      </div>
      <div className="mt-7 rounded-lg border border-line bg-card p-4 text-sm leading-relaxed text-mute">
        <strong className="text-ink">Verification note:</strong> Public geographic datasets change over time. MapBench results reflect the data or service available to the tool at the time of use. For legal boundaries, safety-critical navigation, surveying or other regulated decisions, verify the result with the relevant authoritative agency or licensed professional.
      </div>
    </div>
  );
}
