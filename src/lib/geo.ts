// GPS distance + check-in status. Pure, unit-testable.

export interface LatLng {
  latitude: number;
  longitude: number;
}

export type GpsStatus = "OK" | "OUT_OF_RANGE" | "MISSING";

export const CHECK_IN_RADIUS_M = 200;

export function haversineMeters(a: LatLng, b: LatLng): number {
  const R = 6371000; // earth radius, meters
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.latitude - a.latitude);
  const dLng = toRad(b.longitude - a.longitude);
  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export function gpsStatusFor(
  distanceM: number | null,
  radiusM: number = CHECK_IN_RADIUS_M,
): GpsStatus {
  if (distanceM === null || Number.isNaN(distanceM)) return "MISSING";
  return distanceM <= radiusM ? "OK" : "OUT_OF_RANGE";
}
