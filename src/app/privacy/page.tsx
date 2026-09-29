import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How MapBench handles your data: browser-first processing, no account requirements, and exactly which external services your requests touch.",
  alternates: { canonical: "/privacy" },
};

const CONTACT_EMAIL = "contact@mapbench.site";

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="font-display text-3xl font-bold tracking-tight">Privacy Policy</h1>
      <p className="mt-2 text-sm text-mute">Last updated: September 2026</p>
      <div className="prose-sf mt-6">
        <h2>The short version</h2>
        <ul>
          <li>No account is ever required.</li>
          <li>Files you open (KML, GPX, GeoJSON, CSV) are parsed <strong>entirely in your browser</strong> and never uploaded to our servers.</li>
          <li>Coordinates you enter stay in your browser, except where a tool needs an external answer — then only the information required for that lookup is sent.</li>
          <li>We do not sell your tool inputs. If ads are displayed, they are clearly separated from the tools and results.</li>
        </ul>

        <h2>External services your browser talks to</h2>
        <p>Some tools need live data. When you use them, your browser may contact these documented public services:</p>
        <ul>
          <li><strong>Map tiles</strong> — OpenFreeMap (data © OpenStreetMap contributors).</li>
          <li><strong>Place search</strong> — Photon (komoot), based on OpenStreetMap.</li>
          <li><strong>Reverse geocoding</strong> — Nominatim (OpenStreetMap). Sent: the coordinate pair needed for the lookup.</li>
          <li><strong>Routing &amp; isochrones</strong> — FOSSGIS Valhalla, with OSRM fallback for driving. Sent: route coordinates.</li>
          <li><strong>Elevation</strong> — Open-Meteo. Sent: sampled coordinates.</li>
          <li><strong>Nearby places</strong> — Overpass API. Sent: centre point and radius.</li>
        </ul>
        <p>These requests are subject to each provider&apos;s own privacy policy and fair-use terms. See our Data Sources page for provider references.</p>

        <h2>Geolocation</h2>
        <p>&quot;Use my location&quot; uses your browser&apos;s Geolocation API. We do not store a personal location history. When a tool needs an address or nearby result, the relevant coordinate may be sent to the external service named on the page or in our Data Sources documentation.</p>

        <h2>Local storage</h2>
        <p>We store lightweight preferences such as your light/dark theme choice in <code>localStorage</code>. Some tool states may also be represented in the page URL so you can share or reopen the same setup.</p>

        <h2>Analytics &amp; advertising</h2>
        <p>If aggregate analytics are enabled, this policy will be updated to identify the provider and data use. Advertising must not receive your uploaded map files or raw tool inputs merely because an ad is displayed next to a tool.</p>
        <p>If Google AdSense is enabled, Google and its advertising partners may use cookies, web beacons, IP addresses and similar identifiers to serve and measure ads. See <a href="https://policies.google.com/technologies/partner-sites" target="_blank" rel="noopener noreferrer">How Google uses information from sites or apps that use its services</a>.</p>

        <h2>Privacy questions</h2>
        <p>
          For privacy questions, correction requests or concerns about data handling, email{" "}
          <a href={`mailto:${CONTACT_EMAIL}`} className="font-semibold text-brand-strong hover:underline">{CONTACT_EMAIL}</a>.
        </p>
      </div>
    </div>
  );
}
