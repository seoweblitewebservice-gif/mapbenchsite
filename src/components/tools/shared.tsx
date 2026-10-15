"use client";
import dynamic from "next/dynamic";
import { useState } from "react";
import type { LatLng } from "@/lib/geo";
import { geolocation, ipGeolocation } from "@/lib/geocode";
import LocationSearch from "@/components/LocationSearch";

// MapLibre must never render on the server.
export const DynamicMap = dynamic(() => import("@/components/MapShell"), {
  ssr: false,
  loading: () => <div className="map-shell animate-pulse bg-well" aria-hidden />,
});

export interface PlaceValue extends LatLng { label?: string }

/** Search-or-paste place picker used across distance/routing tools. */
export function PlaceField({ label, value, onChange, placeholder }: {
  label: string;
  value: PlaceValue | null;
  onChange: (v: PlaceValue | null) => void;
  placeholder?: string;
}) {
  const [manual, setManual] = useState("");
  const [locating, setLocating] = useState(false);
  const [geoNote, setGeoNote] = useState<string | null>(null);

  const useMyLocation = async () => {
    setGeoNote(null);
    setLocating(true);
    // Hard timeout: never let geolocation hang the UI indefinitely
    const withTimeout = <T,>(p: Promise<T>, ms: number, msg: string): Promise<T> =>
      Promise.race([
        p,
        new Promise<never>((_, reject) => setTimeout(() => reject(new Error(msg)), ms)),
      ]);
    try {
      const pos = await withTimeout(geolocation(), 12000, "Location request timed out.");
      // Validate coordinates before using them
      if (!Number.isFinite(pos.lat) || !Number.isFinite(pos.lng)) {
        throw new Error("Invalid location coordinates received.");
      }
      setManual("");
      onChange({ lat: pos.lat, lng: pos.lng, label: "My precise location" });
    } catch {
      // If browser/device GPS is blocked, gracefully fall back to an approximate
      // network/IP location instead of leaving the user with a blocking error.
      try {
        const approx = await withTimeout(ipGeolocation(), 10000, "IP location timed out.");
        if (approx) {
          const labelParts = [approx.city, approx.region, approx.country].filter(Boolean);
          setManual("");
          onChange({
            lat: approx.lat,
            lng: approx.lng,
            label: labelParts.length ? `${labelParts.join(", ")} (approx.)` : "Approximate location",
          });
          setGeoNote("Precise location is blocked, so an approximate network location was used instead. You can still search or paste exact coordinates.");
        } else {
          setGeoNote("Precise location is blocked. Search a place, click the map, or paste coordinates instead.");
        }
      } catch {
        setGeoNote("Precise location is blocked. Search a place, click the map, or paste coordinates instead.");
      }
    } finally {
      setLocating(false);
    }
  };

  return (
    <div>
      <span className="label">{label}</span>
      <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
        <LocationSearch
          placeholder={placeholder ?? "Search a place…"}
          initialValue={value?.label ?? ""}
          onSelect={(h) => {
            setManual("");
            setGeoNote(null);
            onChange({ lat: h.lat, lng: h.lng, label: h.label });
          }}
        />
        <button
          type="button"
          className="btn btn-primary whitespace-nowrap"
          onClick={useMyLocation}
          disabled={locating}
        >
          {locating ? "Locating…" : "⌖ Use my location"}
        </button>
      </div>
      <div className="mt-2 grid gap-2 sm:grid-cols-[1fr_auto]">
        <input
          className="input !py-2 text-xs"
          placeholder="…or paste coordinates, e.g. 28.6139, 77.2090"
          aria-label={`${label} coordinates`}
          value={value && !manual && !value.label ? `${value.lat.toFixed(5)}, ${value.lng.toFixed(5)}` : manual}
          onChange={(e) => {
            const next = e.target.value;
            setManual(next);
            setGeoNote(null);
            const m = next.match(/^\s*(-?\d+(?:\.\d+)?)\s*[, ]\s*(-?\d+(?:\.\d+)?)\s*$/);
            if (m) {
              const lat = parseFloat(m[1]), lng = parseFloat(m[2]);
              if (Math.abs(lat) <= 90 && Math.abs(lng) <= 180) onChange({ lat, lng });
            }
          }}
        />
        {value && (
          <button
            type="button"
            className="btn btn-ghost btn-sm whitespace-nowrap"
            onClick={() => { setManual(""); setGeoNote(null); onChange(null); }}
            aria-label={`Clear ${label}`}
          >
            Clear
          </button>
        )}
      </div>
      {value && (
        <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-mute">
          <span className="rounded-md bg-brand-soft px-2 py-1 font-semibold text-brand-strong">Selected</span>
          <span>{value.label || `${value.lat.toFixed(5)}, ${value.lng.toFixed(5)}`}</span>
        </div>
      )}
      {geoNote && (
        <div className="mt-2 rounded-lg border border-line bg-well/50 px-3 py-2 text-[11px] leading-relaxed text-mute">
          {geoNote}
        </div>
      )}
    </div>
  );
}

/** Colored SVG pin as a DOM element for maplibre Markers. */
export function pinElement(color: string, glyph?: string): HTMLDivElement {
  const el = document.createElement("div");
  el.style.width = "30px";
  el.style.height = "40px";
  el.innerHTML = `<svg viewBox="0 0 30 40" width="30" height="40" xmlns="http://www.w3.org/2000/svg">
    <path d="M15 1C7.8 1 2 6.8 2 14c0 9.6 10.6 21.6 12.2 23.4a1 1 0 0 0 1.6 0C17.4 35.6 28 23.6 28 14 28 6.8 22.2 1 15 1Z" fill="${color}" stroke="rgba(0,0,0,.28)" stroke-width="1"/>
    <circle cx="15" cy="14" r="5.2" fill="#fff"/>
    ${glyph ? `<text x="15" y="18.5" font-family="sans-serif" font-size="10" font-weight="700" text-anchor="middle" fill="${color}">${glyph}</text>` : ""}
  </svg>`;
  el.style.cursor = "pointer";
  return el;
}

export const PALETTE = ["#1d6e63", "#d95d32", "#8a4f9e", "#b45309", "#0e7490", "#9d174d", "#4d7c0f", "#334155"];

export function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="font-display text-lg font-bold tracking-tight">{children}</h2>;
}
