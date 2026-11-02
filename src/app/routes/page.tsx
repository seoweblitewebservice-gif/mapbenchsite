import type { Metadata } from "next";
import HubPageRoute, { hubMetadata } from "@/components/hubs/HubPageRoute";

export const metadata: Metadata = hubMetadata("routes");

export default function Page() {
  return <HubPageRoute hubId="routes" />;
}
