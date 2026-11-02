import type { Metadata } from "next";
import HubPageRoute, { hubMetadata } from "@/components/hubs/HubPageRoute";

export const metadata: Metadata = hubMetadata("sun-moon");

export default function Page() {
  return <HubPageRoute hubId="sun-moon" />;
}
