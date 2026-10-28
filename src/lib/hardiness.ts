/** Broad USDA 10 °F bands, using average annual extreme minimum in Celsius. */
export function hardinessZone(celsius: number): number {
  if (!Number.isFinite(celsius)) throw new Error('Invalid temperature');
  const fahrenheit = celsius * 9 / 5 + 32;
  return Math.max(1, Math.min(13, Math.floor((fahrenheit + 60) / 10) + 1));
}

/** Require all days of each requested calendar year; never treat missing values as warmer days. */
export function annualMinimumMean(times: string[], temperatures: (number | null)[], firstYear: number, lastYear: number): number {
  if (times.length !== temperatures.length) throw new Error('Mismatched archive data');
  const years = new Map<number, { count: number; min: number; dates: Set<string> }>();
  times.forEach((date, i) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error('Invalid archive date');
    const parsed = new Date(`${date}T00:00:00Z`);
    if (!Number.isFinite(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== date) throw new Error('Invalid archive date');
    const year = Number(date.slice(0, 4));
    if (year < firstYear || year > lastYear) return;
    const value = temperatures[i];
    if (typeof value !== 'number' || !Number.isFinite(value)) throw new Error('Missing archive temperature');
    const entry = years.get(year) ?? { count: 0, min: Infinity, dates: new Set<string>() };
    if (entry.dates.has(date)) throw new Error('Duplicate archive date');
    entry.dates.add(date); entry.count++; entry.min = Math.min(entry.min, value); years.set(year, entry);
  });
  let sum = 0;
  for (let year = firstYear; year <= lastYear; year++) {
    const leap = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
    const entry = years.get(year);
    if (!entry || entry.count !== (leap ? 366 : 365)) throw new Error('Incomplete archive year');
    sum += entry.min;
  }
  return sum / (lastYear - firstYear + 1);
}
