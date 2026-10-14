"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Map as MLMap } from "maplibre-gl";
import { downloadText, toCsv } from "@/lib/formats";
import { readUrlParams, syncUrl, CopyBtn, ErrorBox, Spinner, Stat, Field } from "@/components/ui";
import { DynamicMap, pinElement } from "./shared";

type IpData = {
  ip: string;
  success?: boolean;
  message?: string;
  type?: string;
  continent?: string;
  continent_code?: string;
  country?: string;
  country_code?: string;
  region?: string;
  region_code?: string;
  city?: string;
  postal?: string;
  latitude?: number;
  longitude?: number;
  is_eu?: boolean;
  calling_code?: string;
  capital?: string;
  borders?: string;
  flag?: { emoji?: string };
  connection?: { isp?: string; org?: string; asn?: number; domain?: string };
  timezone?: { id?: string; abbr?: string; is_dst?: boolean; offset?: number; utc?: string; current_time?: string };
  security?: { anonymous?: boolean; proxy?: boolean; vpn?: boolean; tor?: boolean; hosting?: boolean };
};

type HistoryItem = Pick<IpData, "ip" | "country" | "city">;

const EXAMPLES = ["8.8.8.8", "1.1.1.1", "2001:4860:4860::8888"];

function yesNo(value: boolean | undefined) {
  if (value === undefined) return "Unknown";
  return value ? "Yes" : "No";
}

export default function IpLookupTool({ params }: { params?: Record<string, unknown> }) {
  const [query, setQuery] = useState(() => readUrlParams().get("ip") ?? "");
  const [data, setData] = useState<IpData | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const mapRef = useRef<MLMap | null>(null);
  const libRef = useRef<any>(null);
  const markerRef = useRef<any>(null);

  const lookup = async (ip?: string) => {
    setBusy(true);
    setError(null);
    try {
      const q = (ip ?? query).trim();
      const url = q ? `https://ipwho.is/${encodeURIComponent(q)}` : "https://ipwho.is/";
      const res = await fetch(url);
      const d: IpData = await res.json();
      if (!res.ok || d.success === false) throw new Error(d.message || "IP lookup failed.");
      setData(d);
      setQuery(q || d.ip || "");
      if (d.ip) {
        syncUrl({ ip: d.ip });
        setHistory((items) => {
          const next = [{ ip: d.ip, country: d.country, city: d.city }, ...items.filter((x) => x.ip !== d.ip)];
          return next.slice(0, 5);
        });
      }
    } catch (e: any) {
      setError(e?.message ?? "IP lookup failed.");
      setData(null);
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    if (params?.auto === true) lookup();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!data || data.latitude == null || data.longitude == null || !mapRef.current || !libRef.current) return;
    const lngLat: [number, number] = [data.longitude, data.latitude];
    if (!markerRef.current) {
      markerRef.current = new libRef.current.Marker({ element: pinElement("#1d6e63") }).setLngLat(lngLat).addTo(mapRef.current);
    } else {
      markerRef.current.setLngLat(lngLat);
    }
    mapRef.current.flyTo({ center: lngLat, zoom: 7, essential: true });
  }, [data]);

  const rows = useMemo(() => data ? [
    ["IP address", data.ip],
    ["IP type", data.type],
    ["Continent", [data.continent, data.continent_code].filter(Boolean).join(" · ")],
    ["Country", `${data.flag?.emoji ?? ""} ${data.country ?? ""}${data.country_code ? ` (${data.country_code})` : ""}`.trim()],
    ["Region", [data.region, data.region_code].filter(Boolean).join(" · ")],
    ["City", data.city],
    ["Postal code", data.postal],
    ["Capital", data.capital],
    ["Calling code", data.calling_code ? `+${data.calling_code}` : ""],
    ["ISP", data.connection?.isp],
    ["Organization", data.connection?.org],
    ["ASN", data.connection?.asn ? `AS${data.connection.asn}` : ""],
    ["Domain", data.connection?.domain],
    ["Timezone", data.timezone?.id],
    ["Timezone abbreviation", data.timezone?.abbr],
    ["UTC offset", data.timezone?.utc],
    ["DST active", data.timezone?.is_dst === undefined ? "" : yesNo(data.timezone.is_dst)],
    ["Coordinates", data.latitude != null && data.longitude != null ? `${data.latitude}, ${data.longitude}` : ""],
  ].filter(([, value]) => value !== undefined && value !== null && String(value).trim() !== "") as [string, string | number][] : [], [data]);

  const securityRows = data?.security ? [
    ["Anonymous network", yesNo(data.security.anonymous)],
    ["Proxy", yesNo(data.security.proxy)],
    ["VPN", yesNo(data.security.vpn)],
    ["Tor exit", yesNo(data.security.tor)],
    ["Hosting / datacenter", yesNo(data.security.hosting)],
  ] : [];

  const copyBundle = data ? rows.map(([k, v]) => `${k}: ${v}`).join("\n") : "";

  const exportJson = () => {
    if (!data) return;
    downloadText(`mapbench-ip-${data.ip.replace(/[:.]/g, "-")}.json`, JSON.stringify(data, null, 2), "application/json");
  };

  const exportCsv = () => {
    if (!data) return;
    downloadText(
      `mapbench-ip-${data.ip.replace(/[:.]/g, "-")}.csv`,
      toCsv(["Field", "Value"], rows.map(([k, v]) => [k, String(v)])),
      "text/csv",
    );
  };

  const hasPoint = data?.latitude != null && data?.longitude != null;
  const mapsQuery = hasPoint ? `${data!.latitude},${data!.longitude}` : "";

  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-[380px,1fr]">
        <div className="card space-y-4 p-4">
          <Field label="IP address" hint="Enter an IPv4 or IPv6 address, or leave blank to detect your public IP.">
            <input
              className="input"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="8.8.8.8 or 2001:4860:4860::8888"
              onKeyDown={(e) => { if (e.key === "Enter") lookup(); }}
              spellCheck={false}
            />
          </Field>

          <div className="flex flex-wrap gap-2">
            {EXAMPLES.map((ip) => (
              <button key={ip} type="button" className="btn btn-ghost btn-sm" onClick={() => { setQuery(ip); lookup(ip); }}>{ip}</button>
            ))}
          </div>

          <button className="btn btn-primary w-full" type="button" onClick={() => lookup()} disabled={busy}>
            {busy ? <Spinner label="Looking up…" /> : "Look up IP address"}
          </button>
          <button className="btn btn-ghost w-full" type="button" onClick={() => { setQuery(""); lookup(""); }} disabled={busy}>
            Detect my public IP
          </button>

          {error && <ErrorBox>{error}</ErrorBox>}

          {data && (
            <>
              <div className="grid grid-cols-2 gap-2">
                <Stat label="Country" value={`${data.flag?.emoji ?? ""} ${data.country ?? "—"}`.trim()} />
                <Stat label="Timezone" value={data.timezone?.id ?? "—"} />
                <Stat label="ISP" value={data.connection?.isp ?? "—"} />
                <Stat label="ASN" value={data.connection?.asn ? `AS${data.connection.asn}` : "—"} />
              </div>
              <div className="flex flex-wrap gap-2">
                <CopyBtn text={copyBundle} label="Copy all" />
                <button type="button" className="btn btn-ghost btn-sm" onClick={exportJson}>JSON</button>
                <button type="button" className="btn btn-ghost btn-sm" onClick={exportCsv}>CSV</button>
              </div>
            </>
          )}

          {history.length > 1 && (
            <div className="border-t border-line pt-3">
              <div className="label">Recent lookups</div>
              <div className="space-y-1.5">
                {history.map((item) => (
                  <button key={item.ip} type="button" className="flex w-full items-center justify-between rounded-lg border border-line px-3 py-2 text-left text-xs hover:bg-well" onClick={() => { setQuery(item.ip); lookup(item.ip); }}>
                    <span className="font-mono font-semibold">{item.ip}</span>
                    <span className="truncate pl-3 text-mute">{[item.city, item.country].filter(Boolean).join(", ")}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="card p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="label !mb-0">IP intelligence</div>
              {data?.timezone?.current_time && <span className="text-xs text-mute">Provider local time: {data.timezone.current_time}</span>}
            </div>
            {data ? (
              <div className="mt-3 overflow-x-auto">
                <table className="tbl">
                  <tbody>
                    {rows.map(([k, v]) => (
                      <tr key={k}>
                        <td className="w-1/3 text-mute">{k}</td>
                        <td className="font-medium">{v}<span className="float-right"><CopyBtn text={String(v)} label="" /></span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="mt-3 text-sm text-mute">Enter an IPv4 or IPv6 address, or detect your current public IP to inspect approximate network location, timezone and provider information.</p>
            )}
          </div>

          {data?.security && (
            <div className="card p-4">
              <div className="label">Network signals</div>
              <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
                {securityRows.map(([label, value]) => <Stat key={label} label={label} value={value} />)}
              </div>
              <p className="mt-3 text-xs text-mute">These are provider-supplied network indicators, not proof of a person&apos;s identity, exact device location or intent.</p>
            </div>
          )}
        </div>
      </div>

      {hasPoint && (
        <div className="card overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-4 py-3">
            <div>
              <div className="label !mb-0">Approximate network location</div>
              <p className="mt-1 text-xs text-mute">IP geolocation normally points to an ISP/network exit area, not a precise street address.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <a className="btn btn-ghost btn-sm" href={`https://www.openstreetmap.org/?mlat=${data!.latitude}&mlon=${data!.longitude}#map=8/${data!.latitude}/${data!.longitude}`} target="_blank" rel="noreferrer">OpenStreetMap</a>
              <a className="btn btn-ghost btn-sm" href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapsQuery)}`} target="_blank" rel="noreferrer">Google Maps</a>
            </div>
          </div>
          <DynamicMap
            center={{ lat: data!.latitude!, lng: data!.longitude! }}
            zoom={7}
            className="tall"
            onReady={(map, lib) => {
              mapRef.current = map;
              libRef.current = lib;
              markerRef.current = new lib.Marker({ element: pinElement("#1d6e63") })
                .setLngLat([data!.longitude!, data!.latitude!])
                .addTo(map);
            }}
          />
        </div>
      )}
    </div>
  );
}
