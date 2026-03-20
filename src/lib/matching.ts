/** Great-circle distance in km between two lat/lng points (Haversine). */
export function haversineKm(
  lat1: number, lng1: number,
  lat2: number, lng2: number,
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** Beyond this distance (km) per endpoint, match score is 0%. */
export const MATCH_MAX_KM = 5;

/**
 * Returns a 0–100 route match score between a listing and a ride request.
 * Pickup proximity and dropoff proximity each contribute 50%.
 * Score decays linearly: 0 km → 100%, MATCH_MAX_KM → 0%.
 */
export function matchPercent(
  listing: { fromLat: number; fromLng: number; toLat: number; toLng: number },
  request: { fromLat: number; fromLng: number; toLat: number; toLng: number },
): number {
  const fromDist = haversineKm(listing.fromLat, listing.fromLng, request.fromLat, request.fromLng);
  const toDist   = haversineKm(listing.toLat,   listing.toLng,   request.toLat,   request.toLng);
  const fromScore = Math.max(0, 1 - fromDist / MATCH_MAX_KM) * 100;
  const toScore   = Math.max(0, 1 - toDist   / MATCH_MAX_KM) * 100;
  return Math.round((fromScore + toScore) / 2);
}
