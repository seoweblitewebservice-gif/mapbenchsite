import Link from "next/link";
import { allGuideBySlug } from "@/data/allGuides";
import { toolBySlug } from "@/lib/registry";

/**
 * Guide → hub link, rendered in the first screen of every guide.
 *
 * Guides are informational pages; the hub is the commercial/intent page. The
 * link up to the cluster is what turns a guide visitor into a tool user, and it
 * gives the hub a stable inbound link from every guide in the cluster.
 */
const GUIDE_HUBS: Record<string, { href: string; label: string; note: string }> = {
  "draw-radius-on-google-maps": { href: "/radius", label: "radius and service area tools", note: "Draw the same circle without Google Maps, with measured area and multiple rings." },
  "find-elevation-on-google-maps": { href: "/earth", label: "elevation and terrain tools", note: "Elevation at a point, profiles along a route and horizon distance." },
  "how-to-find-latitude-longitude-of-any-place": { href: "/coordinates", label: "coordinate tools", note: "Find, convert, validate and project the same point in every format." },
  "how-to-measure-land-area-on-a-map": { href: "/area", label: "area and acreage calculators", note: "Trace a boundary and convert the result into acres, hectares or square feet." },
  "radius-vs-drive-time-vs-straight-line-distance": { href: "/radius", label: "radius map tools", note: "Compare a circle and an isochrone on the same location." },
  "drive-time-map-vs-radius-circle": { href: "/routes", label: "route and travel time tools", note: "Build the isochrone that answers the question a circle cannot." },
  "straight-line-distance-vs-road-distance": { href: "/distance", label: "distance calculators", note: "Get both numbers for the same pair of places and compare them." },
  "crow-flies-when-it-lies": { href: "/distance", label: "straight-line distance tools", note: "Measure the great-circle distance with the method shown." },
  "how-distance-calculation-works": { href: "/distance", label: "distance calculators", note: "Every calculator in the cluster, with its formula and Earth model stated." },
  "quiet-math-of-horizons": { href: "/earth", label: "horizon and curvature tools", note: "Calculate horizon distance and curvature drop for your own observer height." },
  "what-county-am-i-in-how-it-works": { href: "/location", label: "location and geocoding tools", note: "County, city, state and ZIP lookups from a position, an address or a map click." },
  "find-my-location-gps-vs-ip-vs-vpn": { href: "/location", label: "location finder tools", note: "See what your device actually reports and correct the pin by hand." },
  "how-accurate-is-browser-geolocation": { href: "/location", label: "location and geocoding tools", note: "Position accuracy in practice, with an accuracy radius on every result." },
  "where-am-i-five-answers": { href: "/location", label: "where am I lookups", note: "Get the five answers — place, county, state, ZIP and country — side by side." },
  "how-accurate-is-your-gps": { href: "/location", label: "GPS location tools", note: "Check a reported position against the map and the Census boundary." },
  "understanding-gps-coordinates": { href: "/coordinates", label: "coordinate converters", note: "Convert between DD, DMS, DMM, UTM, MGRS, Plus Codes and geohash." },
  "what-are-plus-codes-open-location-code": { href: "/coordinates", label: "coordinate and Plus Code tools", note: "Find a Plus Code for any location, or decode one back to coordinates." },
  "map-projections-explained": { href: "/coordinates", label: "coordinate and projection tools", note: "Web Mercator, tile maths and the projection helpers behind web maps." },
  "kml-vs-geojson-vs-gpx": { href: "/gis-files", label: "GIS file tools", note: "View, validate and convert between all three formats in the browser." },
  "gps-file-workflows": { href: "/gis-files", label: "GPS file tools", note: "Every viewer, converter and track analysis tool, grouped by format." },
  "how-to-open-gpx-files": { href: "/gis-files/gpx", label: "GPX tools", note: "Open a track and read distance, elevation gain, duration and speed." },
  "how-to-convert-gpx-to-csv": { href: "/gis-files/gpx", label: "GPX tools", note: "Convert a track to a spreadsheet of timestamped coordinates." },
  "radius-vs-drive-time-vs-straight-line-distance-glossary": { href: "/distance", label: "distance calculators", note: "Pick the geometric baseline that matches your question." },
  "how-to-choose-a-meeting-point-between-places": { href: "/bearing-midpoint", label: "midpoint and meeting point tools", note: "Find the geometric midpoint or the fairest meeting spot for several people." },
  "free-printable-blank-maps-for-school-and-work": { href: "/map-maker/blank-maps", label: "printable blank maps", note: "World, USA and country outlines as clean SVG or PNG." },
  "chasing-golden-hour": { href: "/sun-moon", label: "sun and moon tools", note: "Sunrise, sunset, golden hour and shadow length for any date and place." },
  "full-moon-moonrise-times": { href: "/sun-moon", label: "moonrise and moon phase tools", note: "Moonrise, moonset and phase for a specific location rather than a generic calendar." },
  "reading-isochrones-like-a-planner": { href: "/routes", label: "isochrone and drive time tools", note: "Build the drive-time area you are reading about." },
  "road-trip-with-free-map-tools": { href: "/routes", label: "route and fuel tools", note: "Plan stops, estimate drive time and budget fuel without a subscription." },
  "compare-cities-like-an-analyst": { href: "/lookup", label: "city and place comparison tools", note: "Compare population, cost and density for two places side by side." },
  "will-it-grow-here": { href: "/earth", label: "climate and hardiness tools", note: "Hardiness zones and climate context for a specific location." },
  "how-to-calculate-distance-between-coordinates": { href: "/distance", label: "distance calculators", note: "Enter the two coordinates and read the haversine result in kilometres, miles and nautical miles." },
  "how-to-find-halfway-point-between-two-cities": { href: "/bearing-midpoint", label: "midpoint and meeting point tools", note: "Find the true spherical midpoint, or the fairest meeting point for more than two people." },
  "how-to-convert-coordinates-to-address": { href: "/location", label: "location and geocoding tools", note: "Reverse geocode a coordinate, or geocode an address back into coordinates." },
  "how-to-calculate-vehicle-running-cost-per-mile": { href: "/routes", label: "route and trip cost tools", note: "Work out fuel, cost per mile and delivery charge per route." },
  "how-to-measure-fence-length-and-posts": { href: "/land-calculators", label: "farm and fencing calculators", note: "Turn a measured boundary into fence length, posts and concrete." },
  "how-to-calculate-seed-rate-per-acre": { href: "/land-calculators", label: "farm and garden calculators", note: "Seed, fertilizer, irrigation and soil maths for a measured field." },
  "how-to-read-a-map-scale": { href: "/bearing-midpoint", label: "map scale tools", note: "Convert a measured length into ground distance in any unit." },
  "how-to-find-your-time-zone-by-coordinates": { href: "/time", label: "time zone tools", note: "Resolve the zone and offset at a coordinate, then convert the time." },
  "how-to-plot-a-csv-on-a-map": { href: "/gis-files", label: "CSV and map file tools", note: "Plot a coordinate table, validate it, or convert it to GeoJSON." },
  "how-to-open-and-convert-geojson-files": { href: "/gis-files/geojson", label: "GeoJSON tools", note: "Validate, view, measure and convert GeoJSON in the browser." },
};


export interface GuideHubLink { href: string; label: string; note: string }

export function hubForGuide(slug: string): GuideHubLink | null {
  return GUIDE_HUBS[slug] ?? null;
}

export default function HubGuideLinks({ slug, exclude = [] }: { slug: string; exclude?: string[] }) {
  const guide = allGuideBySlug.get(slug);
  const link = hubForGuide(slug);
  if (!guide || !link) return null;
  // The toolbox block is the guide's own tool recommendation; naming the first
  // few here turns the hub link into an actionable next step rather than a
  // generic "see more" pointer.
  const toolboxSlugs = guide.blocks
    .filter((block) => block.t === "toolbox")
    .flatMap((block) => (block as { slugs: string[] }).slugs)
    .filter((toolSlug) => !exclude.includes(toolSlug))
    .slice(0, 2);
  if (!toolboxSlugs.length) return null;

  return (
    <aside className="my-8 rounded-2xl border border-brand/25 bg-brand-soft/45 px-5 py-4">
      <div className="font-sans text-[10px] font-extrabold uppercase tracking-[0.14em] text-brand-strong">Put this into practice</div>
      <p className="mt-2 text-[15px] leading-7 text-ink">
        This guide is part of the <Link href={link.href} className="font-semibold text-brand-strong underline decoration-brand/30 underline-offset-4 hover:decoration-brand">{link.label}</Link> cluster.{" "}
        {link.note}
      </p>
      <p className="mt-2 font-sans text-sm font-bold">
        {toolboxSlugs.map((toolSlug, index) => {
          const tool = toolBySlug.get(toolSlug);
          if (!tool) return null;
          return (
            <span key={toolSlug}>
              {index > 0 && <span className="mx-2 text-mute">·</span>}
              <Link href={`/tools/${tool.slug}`} className="text-brand-strong hover:underline">{tool.name} →</Link>
            </span>
          );
        })}
      </p>
    </aside>
  );
}

