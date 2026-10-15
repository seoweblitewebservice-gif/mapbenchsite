"use client";
import { useEffect, useRef, useState } from "react";
import type { Map as MLMap } from "maplibre-gl";
import { fmtCoords, isValidLat, isValidLng, parseCoordPair, type LatLng } from "@/lib/geo";
import { addressBreakdown, geolocationDetails, ipGeolocation, nominatimReverse } from "@/lib/geocode";
import { readUrlParams, syncUrl, CopyBtn, ErrorBox, Spinner, Stat, Field } from "@/components/ui";
import { DynamicMap, pinElement, type PlaceValue } from "./shared";
import LocationSearch from "@/components/LocationSearch";

type CountryMeta = { name?: string; capital?: string; region?: string; population?: number; area?: number; currency?: string; callingCode?: string; languages?: string; flag?: string };

type Mode = "forward" | "reverse" | "locate";

type IpInfo = { ip: string; city?: string; region?: string; country?: string; org?: string };

const FOCUS_LABELS: Record<string, string> = {
  county: "County", city: "City", state: "State / Region", country: "Country", postcode: "Postcode",
};

function emptyAddress(displayName: string) {
  return {
    place: "",
    city: "",
    county: "",
    state: "",
    postcode: "",
    country: "",
    countryCode: "",
    road: "",
    houseNumber: "",
    suburb: "",
    displayName,
  };
}

export default function GeocoderTool({ params }: { params?: Record<string, unknown> }) {
  const mode = (params?.mode as Mode) ?? "reverse";
  const focus = (params?.focus as string) ?? "";
  const [point, setPoint] = useState<LatLng | null>(() => {
    const p = readUrlParams();
    const lat = parseFloat(p.get("lat") ?? ""), lng = parseFloat(p.get("lng") ?? "");
    return isValidLat(lat) && isValidLng(lng) ? { lat, lng } : null;
  });
  const [forward, setForward] = useState<PlaceValue | null>(null);
  const [latIn, setLatIn] = useState("");
  const [lngIn, setLngIn] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ReturnType<typeof addressBreakdown> & { displayName: string } | null>(null);
  const [countryMeta, setCountryMeta] = useState<CountryMeta | null>(null);
  const [locationDetails, setLocationDetails] = useState<{ accuracy: number; timestamp: number; altitude?: number | null; speed?: number | null } | null>(null);
  const [ipFallback, setIpFallback] = useState<IpInfo | null>(null);
  const mapRef = useRef<MLMap | null>(null);
  const libRef = useRef<any>(null);
  const markerRef = useRef<any>(null);

  useEffect(() => {
    if (point) {
      syncUrl({ lat: point.lat.toFixed(6), lng: point.lng.toFixed(6) });
      setLatIn(point.lat.toFixed(6));
      setLngIn(point.lng.toFixed(6));
    }
  }, [point]);

  const applyIpAsResult = (ip: IpInfo) => {
    const display =
      [ip.city, ip.region, ip.country].filter(Boolean).join(", ") ||
      `Approximate IP location (${ip.ip})`;
    setResult({
      ...emptyAddress(display),
      city: ip.city || "",
      state: ip.region || "",
      country: ip.country || "",
      place: ip.city || "",
    });
  };

  const reverseLookup = async (p: LatLng, ipHint?: IpInfo | null) => {
    setBusy(true);
    const r = await nominatimReverse(p.lat, p.lng, 16);
    setBusy(false);
    if (!r.ok) {
      // VPN / datacenter IPs often land in the ocean — still show something useful
      if (ipHint) {
        applyIpAsResult(ipHint);
        setError(
          "No street address at these coordinates (common with VPN exit nodes over water or remote hosts). Showing the IP provider city estimate instead — this is not your precise home location.",
        );
      } else {
        setResult({
          ...emptyAddress("Coordinates only — no address found"),
        });
        setError(
          r.message +
            " Coordinates are still shown on the map. If you used a VPN, try turning it off or search for your city by name.",
        );
      }
      setCountryMeta(null);
      return;
    }
    setError(null);
    const parsed = { ...addressBreakdown(r.result.address), displayName: r.result.displayName };
    setResult(parsed);
    if (focus === "country" && parsed.countryCode) {
      try {
        const cr = await fetch("https://restcountries.com/v3.1/alpha/" + parsed.countryCode);
        if (cr.ok) {
          const rows = await cr.json();
          const x = rows?.[0];
          if (x)
            setCountryMeta({
              name: x.name?.common,
              capital: x.capital?.[0],
              region: x.region,
              population: x.population,
              area: x.area,
              currency: Object.keys(x.currencies ?? {})[0],
              callingCode: x.idd?.root ? x.idd.root + (x.idd.suffixes?.[0] ?? "") : undefined,
              languages: Object.values(x.languages ?? {}).join(", "),
              flag: x.flag,
            });
        }
      } catch {
        setCountryMeta(null);
      }
    } else setCountryMeta(null);
  };

  useEffect(() => {
    if (point && mode !== "forward" && !result && !busy) reverseLookup(point);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const locate = async () => {
    setBusy(true);
    setError(null);
    setIpFallback(null);
    setLocationDetails(null);
    // Hard timeout wrapper — never hang indefinitely
    const withTimeout = <T,>(p: Promise<T>, ms: number): Promise<T> =>
      Promise.race([
        p,
        new Promise<never>((_, reject) => setTimeout(() => reject(new Error("Request timed out.")), ms)),
      ]);
    // For country detection, IP geolocation is sufficient and crash-proof
    // (no GPS permission prompt, no browser geolocation API involved).
    const useIpOnly = focus === "country";
    try {
      if (useIpOnly) {
        const ip = await withTimeout(ipGeolocation(), 10000);
        if (!ip || !Number.isFinite(ip.lat) || !Number.isFinite(ip.lng)) {
          throw new Error("Could not determine your location from your network.");
        }
        const p = { lat: ip.lat, lng: ip.lng };
        const info: IpInfo = { ip: ip.ip, city: ip.city, region: ip.region, country: ip.country, org: ip.org };
        setPoint(p);
        setIpFallback(info);
        await reverseLookup(p, info);
        mapRef.current?.flyTo({ center: [p.lng, p.lat], zoom: 4, essential: true });
      } else {
        const d = await withTimeout(geolocationDetails(), 12000);
        if (!Number.isFinite(d.lat) || !Number.isFinite(d.lng)) {
          throw new Error("Invalid location coordinates received.");
        }
        const p = { lat: d.lat, lng: d.lng };
        setLocationDetails(d);
        setPoint(p);
        await reverseLookup(p);
        mapRef.current?.flyTo({ center: [p.lng, p.lat], zoom: 15, essential: true });
      }
    } catch (e: any) {
      const msg = e?.message ?? "Could not determine your location.";
      // For non-country tools, fall back to IP on GPS failure
      if (!useIpOnly) {
        try {
          const ip = await withTimeout(ipGeolocation(), 10000);
          if (ip && Number.isFinite(ip.lat) && Number.isFinite(ip.lng)) {
            const p = { lat: ip.lat, lng: ip.lng };
            const info: IpInfo = { ip: ip.ip, city: ip.city, region: ip.region, country: ip.country, org: ip.org };
            setPoint(p);
            setIpFallback(info);
            await reverseLookup(p, info);
            mapRef.current?.flyTo({ center: [p.lng, p.lat], zoom: 6, essential: true });
            setError((prev) =>
              prev ??
              "Precise device location was unavailable. Showing approximate IP location instead.",
            );
          } else {
            setError(msg + " You can also search for your city by name.");
          }
        } catch {
          setError(msg);
        }
      } else {
        setError(msg + " You can also search for your city by name.");
      }
    } finally {
      setBusy(false);
    }
  };

  const setPointAndLookup = (p: LatLng) => {
    setIpFallback(null);
    setLocationDetails(null);
    setPoint(p);
    reverseLookup(p);
  };

  useEffect(() => {
    const map = mapRef.current,
      lib = libRef.current;
    if (!map || !lib) return;
    const target = mode === "forward" ? forward : point;
    if (!target) return;
    if (!markerRef.current)
      markerRef.current = new lib.Marker({ element: pinElement("#d95d32") }).setLngLat([target.lng, target.lat]).addTo(map);
    else markerRef.current.setLngLat([target.lng, target.lat]);
  }, [point, forward, mode]);

  const breakdown = result
    ? [
        ["Place / City", result.city],
        ["Suburb / Neighbourhood", result.suburb],
        ["Road", result.road ? `${result.houseNumber ? result.houseNumber + " " : ""}${result.road}` : ""],
        [FOCUS_LABELS.county, result.county],
        [FOCUS_LABELS.state, result.state],
        ["Postcode", result.postcode],
        ["Country", result.country ? `${result.country}${result.countryCode ? ` (${result.countryCode})` : ""}` : ""],
      ].filter(([, v]) => v)
    : [];

  // Always show coord card in locate mode when we have a point (even without full address)
  const geoFields =
    point && (result || ipFallback)
      ? [
          {
            label: "Country",
            value: result?.country
              ? `${result.country}${result.countryCode ? ` (${result.countryCode})` : ""}`
              : ipFallback?.country || "—",
            icon: "🌍",
          },
          { label: "State", value: result?.state || ipFallback?.region || "—", icon: "📍" },
          { label: "City", value: result?.city || result?.suburb || ipFallback?.city || "—", icon: "🏙" },
          { label: "Latitude", value: point.lat.toFixed(6), icon: "🔴" },
          { label: "Longitude", value: point.lng.toFixed(6), icon: "🔴" },
          { label: "Postal Code", value: result?.postcode || "N/A", icon: "✉" },
        ]
      : [];

  const showLocateCard = mode === "locate" && point && !busy && (result || ipFallback);

  return (
    <div className="grid gap-4 lg:grid-cols-[400px,1fr]">
      <div className="card order-2 space-y-4 p-4 lg:order-1">
        {mode === "locate" && (
          <>
            <button type="button" className="btn btn-primary w-full" onClick={locate} disabled={busy}>
              {busy ? <Spinner label="Locating…" /> : focus === "country" ? "🌍 Detect my country" : "📍 Use my location"}
            </button>
            <p className="text-[11px] leading-relaxed text-mute">
              {focus === "country"
                ? "Detects your country from your network connection — no location permission needed. For a different place, search by name or paste coordinates."
                : "Uses your device GPS/Wi‑Fi when allowed. A VPN can block precise location or place the pin on a server overseas (sometimes over water). For your real address: allow location, or turn off VPN location-blocking, or search your city by name."}
            </p>
          </>
        )}
        {mode === "forward" ? (
          <>
            <Field label="Search a place or address">
              <LocationSearch
                autoFocus
                placeholder="e.g. Brandenburg Gate, Berlin"
                onSelect={(h) => {
                  setForward({ lat: h.lat, lng: h.lng, label: h.label });
                  mapRef.current?.flyTo({ center: [h.lng, h.lat], zoom: 14, essential: true });
                }}
              />
            </Field>
            {forward && (
              <div className="space-y-2 border-t border-line pt-3">
                <div className="text-sm font-semibold leading-snug">{forward.label}</div>
                <Stat label="Coordinates" value={fmtCoords(forward)} />
                <div className="flex flex-wrap gap-2">
                  <CopyBtn text={fmtCoords(forward)} label="Copy coordinates" />
                  <CopyBtn text={`${forward.lat}\n${forward.lng}`} label="Copy split" />
                </div>
                <a className="btn btn-ghost btn-sm" href={`/tools/coordinates-to-address?lat=${forward.lat}&lng=${forward.lng}`}>
                  Reverse-geocode this point →
                </a>
              </div>
            )}
          </>
        ) : (
          <>
            {mode === "locate" && (
              <Field label="Search any place, address or landmark">
                <LocationSearch
                  placeholder="Search a city, address or landmark…"
                  onSelect={(h) => setPointAndLookup({ lat: h.lat, lng: h.lng })}
                />
              </Field>
            )}
            <div className="grid grid-cols-2 gap-2">
              <Field label="Latitude">
                <input
                  className="input"
                  inputMode="decimal"
                  placeholder="40.7128"
                  value={latIn}
                  onChange={(e) => setLatIn(e.target.value)}
                />
              </Field>
              <Field label="Longitude">
                <input
                  className="input"
                  inputMode="decimal"
                  placeholder="-74.0060"
                  value={lngIn}
                  onChange={(e) => setLngIn(e.target.value)}
                />
              </Field>
            </div>
            <button
              type="button"
              className="btn btn-primary w-full"
              onClick={() => {
                const p = parseCoordPair(`${latIn}, ${lngIn}`);
                if (!p) {
                  setError("Latitude must be between −90 and 90, longitude between −180 and 180.");
                  return;
                }
                setPointAndLookup(p);
                mapRef.current?.flyTo({ center: [p.lng, p.lat], zoom: 14, essential: true });
              }}
            >
              Look up address
            </button>
            <p className="text-xs text-mute">Or click anywhere on the map.</p>
            {mode === "reverse" && (
              <button type="button" className="btn btn-ghost w-full" onClick={locate} disabled={busy}>
                📍 …or use my location
              </button>
            )}
          </>
        )}

        {busy && <Spinner label="Looking up address…" />}
        {error && <ErrorBox>{error}</ErrorBox>}

        {showLocateCard && (
          <div className="space-y-3 border-t border-line pt-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-md bg-brand-soft px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-brand-strong">
                Geolocation
              </span>
              {locationDetails && (
                <span className="text-[11px] text-mute">±{Math.round(locationDetails.accuracy)} m accuracy</span>
              )}
              {ipFallback && !locationDetails && (
                <span className="rounded-md bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-800">
                  IP approximate (VPN?)
                </span>
              )}
            </div>
            <div className="space-y-2">
              {geoFields.map((f) => (
                <div
                  key={f.label}
                  className="flex items-center justify-between gap-3 rounded-lg border border-line bg-well/50 px-3 py-2.5"
                >
                  <div className="flex min-w-0 items-center gap-2.5">
                    <span className="shrink-0 text-base" aria-hidden>
                      {f.icon}
                    </span>
                    <div className="min-w-0">
                      <div className="text-[11px] font-semibold uppercase tracking-wide text-mute">{f.label}</div>
                      <div className="truncate text-sm font-medium text-ink">{f.value}</div>
                    </div>
                  </div>
                  {f.value !== "—" && f.value !== "N/A" && <CopyBtn text={f.value} label="" />}
                </div>
              ))}
            </div>
            {result?.displayName && (
              <div className="rounded-lg border border-line px-3 py-2 text-xs leading-relaxed text-mute">
                <span className="font-semibold text-ink">Full address: </span>
                {result.displayName}
              </div>
            )}
            {ipFallback && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs text-amber-900">
                <strong>Approximate IP location</strong>
                <div className="mt-1">
                  {ipFallback.city}
                  {ipFallback.region ? `, ${ipFallback.region}` : ""}
                  {ipFallback.country ? `, ${ipFallback.country}` : ""}
                  {ipFallback.org ? ` · ${ipFallback.org}` : ""}
                </div>
                <div className="mt-0.5 text-[10px] opacity-80">
                  IP: {ipFallback.ip} — with VPN this is usually the VPN exit city, not your home. Pin may appear over water if the host has no street address.
                </div>
              </div>
            )}
            <div className="flex flex-wrap gap-2 pt-1">
              {point && <CopyBtn text={fmtCoords(point)} label="Copy coordinates" />}
              {result?.displayName && <CopyBtn text={result.displayName} label="Copy full address" />}
            </div>
          </div>
        )}

        {result && !busy && mode !== "locate" && (
          <div className="space-y-2 border-t border-line pt-3">
            <div className="text-sm leading-snug text-mute">{result.displayName}</div>
            {focus && breakdown.find(([k]) => k === FOCUS_LABELS[focus]) && (
              <div className="rounded-lg bg-brand-soft px-4 py-3">
                <div className="text-[11px] font-bold uppercase tracking-wide text-mute">{FOCUS_LABELS[focus]}</div>
                <div className="font-display text-xl font-bold text-brand-strong">
                  {breakdown.find(([k]) => k === FOCUS_LABELS[focus])?.[1]}
                </div>
              </div>
            )}
            {locationDetails && (
              <div className="grid grid-cols-2 gap-2 rounded-lg bg-brand-soft p-3">
                <Stat label="GPS accuracy" value={`±${Math.round(locationDetails.accuracy)} m`} />
                <Stat label="Updated" value={new Date(locationDetails.timestamp).toLocaleTimeString()} />
              </div>
            )}
            {ipFallback && (
              <div className="rounded-lg border border-line bg-well px-3 py-2 text-xs text-mute">
                <strong>Approximate IP location</strong>
                <div className="mt-1">
                  {ipFallback.city}, {ipFallback.region}, {ipFallback.country}
                  {ipFallback.org ? ` · ${ipFallback.org}` : ""}
                </div>
              </div>
            )}
            <table className="tbl">
              <tbody>
                {breakdown.map(([k, v]) => (
                  <tr key={k}>
                    <td className="w-1/3 text-mute">{k}</td>
                    <td className="font-medium">{v}</td>
                    <td className="w-10">
                      <CopyBtn text={v} label="" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {point && result.displayName && <CopyBtn text={result.displayName} label="Copy full address" />}
          </div>
        )}
      </div>
      <div className="order-1 lg:order-2">
        <DynamicMap
          center={point ?? { lat: 25, lng: 10 }}
          zoom={point ? 13 : 1.6}
          className="tall"
          onReady={(map, lib) => {
            mapRef.current = map;
            libRef.current = lib;
            if (mode !== "forward")
              map.on("click", (e: any) => setPointAndLookup({ lat: e.lngLat.lat, lng: e.lngLat.lng }));
            if (point) {
              markerRef.current = new lib.Marker({ element: pinElement("#d95d32") })
                .setLngLat([point.lng, point.lat])
                .addTo(map);
            }
          }}
        />
      </div>
    </div>
  );
}
