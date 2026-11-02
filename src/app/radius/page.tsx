import type { Metadata } from "next";
import HubPageRoute, { hubMetadata } from "@/components/hubs/HubPageRoute";

export const metadata: Metadata = hubMetadata("radius");

export default function Page() {
  return <HubPageRoute hubId="radius" />;
}
