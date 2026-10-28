"use client";

import { useMemo, useState } from "react";
import { encodeMaidenhead, decodeMaidenhead } from "@/lib/maidenhead";
import { Field } from "@/components/ui";

export default function MaidenheadTool() {
  const [latitude, setLatitude] = useState("40.7128");
  const [longitude, setLongitude] = useState("-74.006");
  const [length, setLength] = useState(6);
  const [locator, setLocator] = useState("FN30AS");
  const encoded = useMemo(() => latitude.trim() && longitude.trim() ? encodeMaidenhead(Number(latitude), Number(longitude), length) : null, [latitude, longitude, length]);
  const decoded = useMemo(() => decodeMaidenhead(locator), [locator]);
  return <div className="grid gap-5 md:grid-cols-2">
    <section className="card space-y-4 p-5" aria-labelledby="maidenhead-encode">
      <h2 id="maidenhead-encode" className="font-display text-xl font-bold">Coordinates to locator</h2>
      <p className="text-sm leading-relaxed text-mute">Enter decimal degrees. North and east are positive; south and west are negative.</p>
      <Field label="Latitude"><input className="input" type="number" step="any" min="-90" max="90" value={latitude} onChange={e => setLatitude(e.target.value)} /></Field>
      <Field label="Longitude"><input className="input" type="number" step="any" min="-180" max="180" value={longitude} onChange={e => setLongitude(e.target.value)} /></Field>
      <Field label="Locator length"><select className="select" value={length} onChange={e => setLength(Number(e.target.value))}><option value={2}>2 characters — field</option><option value={4}>4 characters — square</option><option value={6}>6 characters — subsquare</option><option value={8}>8 characters — extended square</option></select></Field>
      <p className="text-sm" aria-live="polite">{encoded ? <>Locator: <strong className="font-mono text-lg">{encoded}</strong></> : "Enter valid latitude and longitude."}</p>
    </section>
    <section className="card space-y-4 p-5" aria-labelledby="maidenhead-decode">
      <h2 id="maidenhead-decode" className="font-display text-xl font-bold">Locator to area</h2>
      <p className="text-sm leading-relaxed text-mute">A locator represents an area. The coordinates below are the centre of that area, not an exact station position.</p>
      <Field label="Maidenhead locator"><input className="input font-mono" value={locator} onChange={e => setLocator(e.target.value)} spellCheck={false} autoComplete="off" /></Field>
      <div className="text-sm leading-7" aria-live="polite">{decoded ? <><p>Centre: <strong>{decoded.center.lat.toFixed(5)}, {decoded.center.lng.toFixed(5)}</strong></p><p>West / south: {decoded.bounds[0].toFixed(5)}, {decoded.bounds[1].toFixed(5)}</p><p>East / north: {decoded.bounds[2].toFixed(5)}, {decoded.bounds[3].toFixed(5)}</p></> : <p>Enter a valid 2, 4, 6 or 8 character locator.</p>}</div>
    </section>
  </div>;
}
