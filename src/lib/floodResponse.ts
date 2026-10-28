/** A missing feature is not evidence of a safe or mapped flood zone. */
export function describeFloodResponse(data: unknown): string {
  if (!data || typeof data !== 'object') throw new Error('Invalid FEMA response');
  const response = data as { error?: unknown; features?: { attributes?: { FLD_ZONE?: unknown; ZONE_SUBTY?: unknown } }[] };
  if (response.error || !Array.isArray(response.features)) throw new Error('Invalid FEMA response');
  const a = response.features[0]?.attributes;
  if (typeof a?.FLD_ZONE === 'string' && a.FLD_ZONE.trim()) {
    const subtype = typeof a.ZONE_SUBTY === 'string' && a.ZONE_SUBTY.trim() ? ` (${a.ZONE_SUBTY})` : '';
    return `FEMA flood zone ${a.FLD_ZONE}${subtype}`;
  }
  return 'No flood-zone feature was returned. Coverage or mapping status is unknown; this is not a finding that the location is safe or in Zone X. Check the FEMA Flood Map Service Center.';
}
