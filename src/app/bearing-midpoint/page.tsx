import type { Metadata } from "next";
import HubPageRoute, { hubMetadata } from "@/components/hubs/HubPageRoute";

export const metadata: Metadata = hubMetadata("bearing-midpoint");

export default function Page() {
  return <HubPageRoute hubId="bearing-midpoint" />;
}
