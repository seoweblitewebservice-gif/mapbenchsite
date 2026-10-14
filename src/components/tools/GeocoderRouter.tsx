"use client";

import GeocoderTool from "./GeocoderTool";
import CensusCountyTool from "./CensusCountyTool";

export default function GeocoderRouter({ params }: { params?: Record<string, unknown> }) {
  if (params?.focus === "county" && params?.mode === "locate") return <CensusCountyTool />;
  return <GeocoderTool params={params} />;
}
