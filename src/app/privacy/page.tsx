import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How MapBench handles your data: browser-first processing, no account requirements, Google Analytics, and the external services used by geographic tools.",
  alternates: { canonical: "/privacy" },
};

const CONTACT_EMAIL = "contact@mapbench.site";

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="font-display text-3xl font-bold tracking-tight">Privacy Policy</h1>
      <p className="mt-2 text-sm text-mute">Last updated: October 2026</p>
      <div className="prose-sf mt-6">
        <h2>The short version</h2>
        <ul>
          <li>No account is required to use the public MapBench tools.</li>
          <li>Supported files such as KML, GPX, GeoJSON and CSV are designed to be parsed locally in your browser and are not uploaded to MapBench servers merely to use the file tools.</li>
          <li>Coordinates and tool inputs stay in your browser unless a feature needs an external geographic service; in that case only the information needed for that request is sent to the relevant provider.</li>
          <li>MapBench uses Google Analytics to understand aggregate site usage and improve the service.</li>
          <li>We do not sell your map files or raw tool inputs.</li>
        </ul>

        <h2>External services your browser may contact</h2>
        <p>Some tools need live geographic data. Depending on the feature you use, your browser may contact documented third-party services such as:</p>
        <ul>
          <li><strong>Map tiles</strong> — OpenFreeMap using OpenStreetMap data.</li>
          <li><strong>Place search</strong> — Photon, based on OpenStreetMap.</li>
          <li><strong>Reverse geocoding</strong> — Nominatim. The coordinate pair needed for the lookup is sent.</li>
          <li><strong>Routing &amp; isochrones</strong> — FOSSGIS Valhalla, with OSRM used as a driving fallback where configured. Route coordinates are sent.</li>
          <li><strong>Elevation</strong> — Open-Meteo. Sampled coordinates are sent.</li>
          <li><strong>Nearby places</strong> — Overpass API. The relevant centre point, radius or geographic query is sent.</li>
        </ul>
        <p>These requests are subject to the provider&apos;s own terms and privacy practices. See the Data Sources page for provider references and attribution.</p>

        <h2>Geolocation</h2>
        <p>&quot;Use my location&quot; uses your browser&apos;s Geolocation API and only runs after the browser&apos;s permission flow. MapBench does not build a personal location history from that feature. When a location-based tool needs an address, route, elevation or nearby-place result, the relevant coordinates may be sent to the external service documented for that function.</p>

        <h2>Local storage</h2>
        <p>MapBench may store lightweight browser preferences such as your light/dark theme choice in <code>localStorage</code>. Some tools may also represent their state in the page URL so a setup can be shared or reopened.</p>

        <h2>Google Analytics</h2>
        <p>MapBench currently uses Google Analytics (GA4) to measure aggregate website activity such as page visits, device/browser information and interaction patterns. Google Analytics may process identifiers such as IP address and browser/device information in accordance with Google&apos;s policies and available privacy controls.</p>
        <p>Analytics data is used to understand which pages are useful, diagnose site performance and improve navigation and content. Google Analytics is separate from the geographic calculation itself and is not intentionally sent the contents of files you open in MapBench tools as part of the file-processing workflow.</p>
        <p><a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer">Google Privacy Policy</a> and <a href="https://policies.google.com/technologies/partner-sites" target="_blank" rel="noopener noreferrer">How Google uses information from sites or apps that use its services</a> provide more information.</p>

        <h2>Advertising</h2>
        <p>Third-party vendors, including Google, use cookies to serve ads based on a user&apos;s prior visits to this website or other websites. Google&apos;s use of advertising cookies enables it and its partners to serve ads to users based on their visit to this site and/or other sites on the Internet. Users may opt out of personalised advertising by visiting Google Ads Settings: <a href="https://adssettings.google.com" target="_blank" rel="noopener noreferrer">https://adssettings.google.com</a>.</p>
        <p>If advertising such as Google AdSense is enabled, ads are intended to remain separate from tool inputs and results. Google and its advertising partners may use cookies, web beacons, IP addresses and similar identifiers to serve, personalize where permitted, and measure advertising in accordance with applicable consent requirements and Google&apos;s policies.</p>
        <p>Advertising does not give an advertiser access to the geographic files you open in local file tools or to a private MapBench account, because MapBench does not require user accounts for the public toolset.</p>

        <h2>Privacy questions</h2>
        <p>
          For privacy questions, correction requests or concerns about data handling, email{" "}
          <a href={`mailto:${CONTACT_EMAIL}`} className="font-semibold text-brand-strong hover:underline">{CONTACT_EMAIL}</a>.
        </p>
      </div>
    </div>
  );
}
