"use client";

import GeocoderTool from "./GeocoderTool";
import CensusCountyTool from "./CensusCountyTool";
import CensusStateZipTool from "./CensusStateZipTool";

export default function GeocoderRouter({ params }: { params?: Record<string, unknown> }) {
  if (params?.mode === "locate" && params?.focus === "county") return <CensusCountyTool />;
  if (params?.mode === "locate" && params?.focus === "state") return <CensusStateZipTool focus="state" />;
  if (params?.mode === "locate" && params?.focus === "postcode") return <CensusStateZipTool focus="postcode" />;
  return <GeocoderTool params={params} />;
}
