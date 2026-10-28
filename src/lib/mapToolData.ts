/** OpenFlights route edges are directional; a return leg is not implied. */
export function airportRouteGraph(text: string): Map<string, Set<string>> {
  const graph = new Map<string, Set<string>>();
  for (const line of text.split('\n')) {
    const c = line.split(',');
    const src = c[3]?.trim(), dst = c[5]?.trim();
    if (!src || !dst || src === '\\N' || dst === '\\N') continue;
    if (!graph.has(src)) graph.set(src, new Set());
    graph.get(src)!.add(dst);
  }
  return graph;
}
export function airportConnections(graph: Map<string, Set<string>>, from: string, to: string): string[] {
  return [...(graph.get(from) ?? [])].filter(id => id !== from && id !== to && graph.get(id)?.has(to));
}

/** Approximate spherical polygon area; subtract holes and normalize antimeridian crossings. */
export function sphericalPolygonAreaKm2(rings: number[][][]): number {
  const ringArea = (ring: number[][]) => {
    let total = 0;
    if (ring.length < 3) return 0;
    for (let i = 0; i < ring.length; i++) {
      const [x1, y1] = ring[i], [x2, y2] = ring[(i + 1) % ring.length];
      const delta = ((x2 - x1 + 540) % 360) - 180;
      total += delta * Math.PI / 180 * (2 + Math.sin(y1 * Math.PI / 180) + Math.sin(y2 * Math.PI / 180));
    }
    return Math.abs(total * 6371 ** 2 / 2);
  };
  return Math.max(0, ringArea(rings[0] ?? []) - rings.slice(1).reduce((sum, ring) => sum + ringArea(ring), 0));
}
