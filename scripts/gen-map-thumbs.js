// Generates small SVG outline thumbnails for the /maps popular section.
// Uses the repo's own boundary data (us-atlas, world-atlas) via d3-geo.
const fs = require("fs");
const path = require("path");
const d3 = require("d3-geo");
const topojson = require("topojson-client");

const ROOT = "/home/hatch/workspace/tmp-build/mb3";
const OUT = path.join(ROOT, "public/map-thumbs");
fs.mkdirSync(OUT, { recursive: true });

const W = 320, H = 200;

function svgPath(feature) {
  const proj = d3.geoMercator().fitSize([W - 16, H - 16], feature);
  const p = d3.geoPath(proj).pointRadius(0);
  // translate to center with padding
  const [[x0, y0], [x1, y1]] = proj.fitSize
    ? (() => { const b = d3.geoPath(proj).bounds(feature); return b; })()
    : [[0, 0], [W, H]];
  return p(feature);
}

function writeThumb(slug, feature, label) {
  const d = svgPath(feature);
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" role="img" aria-label="Blank map of ${label}">` +
    `<rect width="${W}" height="${H}" fill="#f4f1e8"/>"` +
    `<g transform="translate(8,8)"><path d="${d}" fill="#ffffff" stroke="#2f6f4f" stroke-width="1.5" stroke-linejoin="round"/></g></svg>`;
  // fix the stray quote from string concat
  const clean = svg.replace('fill="#f4f1e8"/>"', 'fill="#f4f1e8"/>');
  const fp = path.join(OUT, `${slug}.svg`);
  fs.writeFileSync(fp, clean);
  console.log(slug, (Buffer.byteLength(clean) / 1024).toFixed(1) + "KB");
}

// States from us-atlas states-10m (id = FIPS)
const statesTopo = JSON.parse(fs.readFileSync(path.join(ROOT, "node_modules/us-atlas/states-10m.json"), "utf8"));
const statesFc = topojson.feature(statesTopo, statesTopo.objects.states);
const STATES = { texas: "48", california: "06", florida: "12", "new-york": "36" };
const STATE_NAMES = { texas: "Texas", california: "California", florida: "Florida", "new-york": "New York" };
for (const [slug, fips] of Object.entries(STATES)) {
  const feat = statesFc.features.find((f) => String(f.id).padStart(2, "0") === fips);
  if (!feat) { console.error("state not found:", slug); continue; }
  writeThumb(slug, feat, STATE_NAMES[slug]);
}

// Countries from world-atlas countries-110m (properties.name)
const worldTopo = JSON.parse(fs.readFileSync(path.join(ROOT, "node_modules/world-atlas/countries-110m.json"), "utf8"));
const worldFc = topojson.feature(worldTopo, worldTopo.objects.countries);
const COUNTRIES = { india: "India", japan: "Japan", france: "France", "united-kingdom": "United Kingdom" };
for (const [slug, name] of Object.entries(COUNTRIES)) {
  const feat = worldFc.features.find((f) => f.properties && f.properties.name === name);
  if (!feat) { console.error("country not found:", slug); continue; }
  writeThumb(slug, feat, name);
}
console.log("done");
