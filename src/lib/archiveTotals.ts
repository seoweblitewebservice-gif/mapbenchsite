/** Sum complete daily values only. Missing observations must not be treated as zero. */
export function sumArchiveDaily(values: unknown, expectedDays: number): number | null {
  if (!Array.isArray(values) || values.length !== expectedDays || values.some(v => typeof v !== "number" || !Number.isFinite(v))) return null;
  return values.reduce((total: number, value: number) => total + value, 0);
}
