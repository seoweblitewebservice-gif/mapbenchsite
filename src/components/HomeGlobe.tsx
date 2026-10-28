import { geoGraticule10, geoOrthographic, geoPath, type GeoPermissibleObjects } from "d3-geo";
import { feature } from "topojson-client";
import worldLand from "world-atlas/land-110m.json";

// Decorative illustration built from the same Natural Earth geometry used by the map gallery.
const projection = geoOrthographic().rotate([-15, -15]).fitExtent([[20, 20], [380, 380]], { type: "Sphere" });
const path = geoPath(projection);
const land = feature(worldLand as never, (worldLand as any).objects.land) as unknown as GeoPermissibleObjects;

export default function HomeGlobe() {
  return <svg className="home-globe" viewBox="0 0 400 400" aria-hidden="true">
    <defs><linearGradient id="home-ocean" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#d8f4fb"/><stop offset="1" stopColor="#81c9e3"/></linearGradient><linearGradient id="home-land" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#8bcfad"/><stop offset="1" stopColor="#36a57f"/></linearGradient></defs>
    <circle cx="200" cy="200" r="179" fill="url(#home-ocean)" />
    <path d={path(geoGraticule10()) ?? ""} fill="none" stroke="#fff" strokeOpacity=".5" strokeWidth=".8" />
    <path d={path(land) ?? ""} fill="url(#home-land)" stroke="#fff" strokeOpacity=".55" strokeWidth=".8" />
    <circle cx="200" cy="200" r="179" fill="none" stroke="#fff" strokeWidth="3" />
    <circle cx="259" cy="145" r="7" fill="#fff" stroke="#087c61" strokeWidth="4" />
    <circle cx="151" cy="232" r="7" fill="#fff" stroke="#087c61" strokeWidth="4" />
    <path d="M157 226 Q190 145 253 145" fill="none" stroke="#fff" strokeWidth="3" strokeDasharray="5 6" />
  </svg>;
}
