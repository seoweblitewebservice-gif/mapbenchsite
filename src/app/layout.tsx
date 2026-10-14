import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import Header, { Footer } from "@/components/Header";
import SearchPalette from "@/components/SearchPalette";
import FullSiteTranslator from "@/components/FullSiteTranslator";
import "./globals.css";

export const metadata: Metadata = {
  verification: {
    google: "f3UG9hYpRPornzaXrqA_IODC_j9gS_1bVdqxh-4AjAk",
  },
  metadataBase: new URL("https://www.mapbench.site"),
  title: {
    default: "MapBench — Free Maps & Geographic Tools",
    template: "%s · MapBench",
  },
  description:
    "Free browser-based map and geographic tools for distance, area, radius, routing, coordinates, elevation, blank maps and GPS files. No account required.",
  applicationName: "MapBench",
  category: "geographic tools",
  keywords: ["map tools", "geographic tools", "distance calculator", "area calculator", "coordinate converter", "GPS tools", "blank maps"],
  openGraph: {
    type: "website",
    siteName: "MapBench",
    title: "MapBench — Free Maps & Geographic Tools",
    description:
      "Calculate distances, measure areas, create maps, explore geographic data and convert GPS files — instantly in your browser. Free, no account required.",
    images: [
      {
        url: "/og-default.jpg",
        width: 1200,
        height: 630,
        alt: "MapBench — Free Maps & Geographic Tools",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "MapBench — Free Maps & Geographic Tools",
    description: "Free browser-first geographic tools: distance, radius, routing, coordinates, map files and more.",
    images: ["/og-default.jpg"],
  },
  robots: { index: true, follow: true },
  authors: [{ name: "Aryan Khan", url: "https://www.mapbench.site/author/aryan-khan" }],
  creator: "Aryan Khan",
  publisher: "MapBench",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f6f2e9" },
    { media: "(prefers-color-scheme: dark)", color: "#14120e" },
  ],
};

const themeScript = `(function(){try{var t=localStorage.getItem("sf-theme");var d=t? t==="dark" : false;document.documentElement.classList.toggle("dark",d);}catch(e){}})();`;

const googleAnalyticsScript = `
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-9FHWG8223G');
`;

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script async src="https://www.googletagmanager.com/gtag/js?id=G-9FHWG8223G" />
        <script dangerouslySetInnerHTML={{ __html: googleAnalyticsScript }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
          "@context": "https://schema.org",
          "@graph": [
            { "@type": "WebSite", "@id": "https://www.mapbench.site/#website", name: "MapBench", url: "https://www.mapbench.site", description: "Free browser-based map and geographic tools." },
            { "@type": "Organization", "@id": "https://www.mapbench.site/#organization", name: "MapBench", url: "https://www.mapbench.site", logo: { "@type": "ImageObject", url: "https://www.mapbench.site/icon.svg" }, founder: { "@type": "Person", "@id": "https://www.mapbench.site/author/aryan-khan#person", name: "Aryan Khan", url: "https://www.mapbench.site/author/aryan-khan", sameAs: ["https://www.linkedin.com/in/aryan-khan-b77438438/"] } }
          ]
        }) }} />
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-screen bg-canvas font-sans text-ink antialiased">
        <Header />
        <main id="main" className="container-sf py-6 sm:py-8">{children}</main>
        <Footer />
        <SearchPalette />
        <div className="fixed -left-[10000px] top-0 h-px w-px overflow-hidden" aria-hidden="true">
          <FullSiteTranslator />
        </div>
      </body>
    </html>
  );
}
