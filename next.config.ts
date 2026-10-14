import type { NextConfig } from "next";

const LOCALE_PATTERN = "es|de|fr|it|pt|nl|pl|ru|sv|da|no|fi|cs|ro|el|hu|tr|uk|ar|ja|ko|zh|hi";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      // Retire old translated routes cleanly. Tool URLs consolidate to the
      // equivalent English tool; locale hubs and other locale paths go home.
      {
        source: `/:locale(${LOCALE_PATTERN})/tools/:tool`,
        destination: "/tools/:tool",
        permanent: true,
      },
      {
        source: `/:locale(${LOCALE_PATTERN})/tools`,
        destination: "/",
        permanent: true,
      },
      {
        source: `/:locale(${LOCALE_PATTERN})`,
        destination: "/",
        permanent: true,
      },
      {
        source: `/:locale(${LOCALE_PATTERN})/:path*`,
        destination: "/",
        permanent: true,
      },

      // Broken / legacy tool slugs → live tools (fixes GSC 404s)
      {
        source: "/tools/multiple-radius-tool",
        destination: "/tools/multi-radius-map",
        permanent: true,
      },
      {
        source: "/tools/great-circle-calculator",
        destination: "/tools/crow-flies-distance",
        permanent: true,
      },
      {
        source: "/tools/gps-coordinate-lookup",
        destination: "/tools/latitude-longitude-finder",
        permanent: true,
      },
      {
        source: "/tools/map-radius-tool",
        destination: "/tools/map-radius",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
