"use client";
import { useState } from "react";
import { ErrorBox, Field, Stat } from "@/components/ui";
import ElevationTool from "./ElevationTool";

export default function SlopeGradeTool() {
  const [rise, setRise] = useState("60");
  const [run, setRun] = useState("1000");
  const a = Number(rise), b = Number(run);
  const valid = rise.trim() !== "" && run.trim() !== "" && Number.isFinite(a) && Number.isFinite(b) && b > 0;
  return <div className="space-y-5">
    <div className="card space-y-3 p-4">
      <h3 className="font-bold">Calculate grade</h3>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Elevation change (rise)"><input className="input" type="number" step="any" value={rise} onChange={e => setRise(e.target.value)} /></Field>
        <Field label="Horizontal distance (run)"><input className="input" type="number" step="any" min="0" value={run} onChange={e => setRun(e.target.value)} /></Field>
      </div>
      <p className="text-xs text-mute">Use the same unit for rise and run. Enter a negative rise for a descent; run must be positive. This is an average, not the steepest section.</p>
      {valid ? <div className="grid gap-2 sm:grid-cols-2"><Stat label="Average grade" value={`${(100 * a / b).toFixed(2)}%`} /><Stat label="Angle" value={`${(Math.atan(a / b) * 180 / Math.PI).toFixed(2)}°`} /></div> : <ErrorBox>Enter a finite rise and a positive horizontal run.</ErrorBox>}
    </div>
    <div><h3 className="mb-3 font-bold">Optional point elevation lookup</h3><p className="mb-3 text-sm text-mute">Look up each endpoint separately and enter the difference above. The lookup does not automatically calculate a path profile or horizontal distance.</p><ElevationTool /></div>
  </div>;
}
