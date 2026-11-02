import type { Metadata } from "next";
import HubPageRoute, { hubMetadata } from "@/components/hubs/HubPageRoute";

export const metadata: Metadata = hubMetadata("distance");

export default function Page() {
  return <HubPageRoute hubId="distance" />;
}
