/** Estimate fuel in the selected unit. MPG and gallons are US units. */
export function fuelEstimate(distanceKm: number, unit: 'l100' | 'mpg', efficiency: number, pricePerUnit: number) {
  const amount = unit === 'l100' ? distanceKm * efficiency / 100 : distanceKm * 0.621371192237334 / efficiency;
  return { amount, cost: amount * pricePerUnit };
}
