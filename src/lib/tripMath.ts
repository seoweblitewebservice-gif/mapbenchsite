/** Fuel quantity and price must use matching units. US mpg means US gallons. */
export function fuelEstimate(distanceKm: number, efficiency: number, price: number, unit: 'l100' | 'mpg') {
  if (![distanceKm, efficiency, price].every(Number.isFinite) || distanceKm < 0 || efficiency <= 0 || price < 0) return null;
  const gallons = unit === 'mpg' ? distanceKm * 0.621371 / efficiency : distanceKm * efficiency / 100 / 3.78541;
  const litres = gallons * 3.78541;
  return { litres, gallons, cost: (unit === 'mpg' ? gallons : litres) * price };
}
