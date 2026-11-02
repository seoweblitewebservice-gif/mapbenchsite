import type { Metadata } from "next";
import HubPageRoute, { hubMetadata } from "@/components/hubs/HubPageRoute";

export const metadata: Metadata = hubMetadata("map-maker");

export default function Page() {
  return <HubPageRoute hubId="map-maker" />;
}
