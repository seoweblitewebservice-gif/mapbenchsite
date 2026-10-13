import type { ToolDef } from "@/lib/registry";

const CATEGORY_FAQS: Record<string, [string, string][]> = {
  distance: [
    ["How accurate is this distance?", "The geometric calculation is suitable for planning and comparison, but the answer is only as accurate as the coordinates you provide. Road, terrain and legal distances can differ."],
    ["Can I use coordinates instead of place names?", "Yes. Where the tool accepts locations, you can paste latitude and longitude directly for a more explicit input."],
    ["Why can this differ from Google Maps or a road route?", "Straight-line and geodesic tools measure geometry on Earth, while road-routing tools follow an actual transport network. They answer different questions."],
  ],
  location: [
    ["Can I use the tool without sharing my precise location?", "Yes. Search a place, paste coordinates or click the map where supported. Browser location is optional."],
    ["Why might a boundary or place name look different elsewhere?", "Administrative, postal and map datasets can use different boundaries, names and update cycles. Verify official decisions with the responsible authority."],
    ["Does MapBench store my browser location?", "Public tools do not require an account. Location is used to produce the requested result; see the privacy and data-source pages for details."],
  ],
  routing: [
    ["Does the route include live traffic?", "Unless the tool explicitly says otherwise, travel times are planning estimates and should not be treated as live-traffic predictions."],
    ["Why is road distance longer than straight-line distance?", "Roads must follow the available network, terrain, bridges and restrictions, while straight-line distance measures the geometric minimum between two points."],
    ["Can route results change over time?", "Yes. Road-network data, access restrictions and routing datasets can change, so recheck important journeys close to travel time."],
  ],
  radius: [
    ["Is a radius the same as driving distance?", "No. A radius is a geometric circle around a centre point. Driving reach depends on the road network and usually has an irregular shape."],
    ["Can I use this for service-area planning?", "Yes for first-pass planning. Use a drive-time or road-network tool when accessibility matters more than straight-line coverage."],
    ["Are map measurements legal survey measurements?", "No. MapBench measurements are planning/reference outputs unless a page explicitly states otherwise. Use a licensed surveyor for legal boundaries."],
  ],
  coordinates: [
    ["Which datum do these coordinate tools use?", "MapBench location tools generally use WGS84 latitude and longitude, the same global reference system commonly used by GPS and web maps."],
    ["Do more decimal places always mean better accuracy?", "No. More digits increase numeric precision, but they cannot improve the accuracy of the original GPS, survey or source data."],
    ["Can I copy the result into GIS software?", "Usually yes. Check the format, axis order and datum expected by the destination software before importing."],
  ],
  files: [
    ["Is my uploaded map file sent to a server?", "Where a page says browser-first or local processing, the file is handled in your browser. Check the individual tool note for any external-service dependency."],
    ["What should I do if a file will not load?", "Check that the file type is supported, the structure is valid and the file is within the stated size limits. Converting to GeoJSON, GPX, KML or CSV can also help."],
    ["Will converting a file preserve every property?", "Not always. Geographic formats support different geometry, style and metadata features, so inspect the output before relying on it."],
  ],
  sun: [
    ["Are sunrise and solar times exact to what I will see?", "Calculated events use astronomical geometry. Terrain, buildings, weather and atmospheric conditions can shift what an observer actually sees."],
    ["Does daylight saving change the Sun's position?", "No. Daylight saving changes the civil clock label, not solar geometry. Timezone rules affect displayed local time."],
    ["Why can polar locations show unusual results?", "High latitudes can have days when the Sun does not rise or set, so some solar events legitimately do not occur on a selected date."],
  ],
  earth: [
    ["Is this suitable for engineering or legal decisions?", "Treat the result as planning or educational context unless the page explicitly says otherwise. Engineering, hazard and legal decisions should use authoritative specialist data."],
    ["Why can terrain data differ between sources?", "Elevation and earth datasets vary in resolution, collection date and processing method. Small local features may not be represented equally."],
    ["Can I verify the data source?", "Yes. MapBench documents major providers and methodology on the Data Sources and Methodology pages."],
  ],
  population: [
    ["Is this an official census result?", "Only when a page explicitly uses and labels an official census dataset. Many tools are estimates or curated dataset summaries and explain that limitation on the page."],
    ["Why might population figures differ from another website?", "Population values can use different census years, boundaries, estimates and definitions of city or metro area."],
    ["Can I use the result for market planning?", "Yes as an exploratory reference, but validate commercial decisions with current official or specialist demographic data."],
  ],
  creation: [
    ["Can I share the map or output?", "Many MapBench tools support shareable URLs or exports. Check the tool controls and the source-data licence before republishing externally."],
    ["Which export format should I choose?", "Use PNG for presentation, CSV for tabular data, and GeoJSON/KML/GPX when geographic geometry needs to remain editable."],
    ["Will a shared link preserve my settings?", "Tools that store state in the URL can reopen that configuration. Sensitive or private data should not be placed in public URLs."],
  ],
  network: [
    ["Is IP location the same as my physical GPS location?", "No. IP geolocation estimates the network exit location and can be affected by VPNs, mobile carriers, proxies and ISP routing."],
    ["Can an IP lookup identify a street address?", "No. Public IP geolocation is approximate and should not be treated as a precise home or device location."],
    ["Why does a VPN change the result?", "A VPN routes traffic through another server, so public services usually see the VPN exit IP rather than your normal network address."],
  ],
  lines: [
    ["Are generated lines geodesic?", "The individual tool explains whether it uses great-circle, rhumb-line or simple coordinate geometry. Choose the method that matches your use case."],
    ["Can I export the geometry?", "Where export is offered, use a geographic format such as GeoJSON or KML if you need to edit the result later."],
    ["Why can a line look curved on a map?", "Map projections distort the spherical Earth. A shortest path on the globe can appear curved on a flat map."],
  ],
};

export function getEnhancedFaqs(tool: ToolDef): [string, string][] {
  const out: [string, string][] = [...tool.faq];
  const seen = new Set(out.map(([q]) => q.toLowerCase()));
  for (const faq of CATEGORY_FAQS[tool.category] ?? []) {
    if (out.length >= 5) break;
    if (!seen.has(faq[0].toLowerCase())) {
      out.push(faq);
      seen.add(faq[0].toLowerCase());
    }
  }
  return out;
}
