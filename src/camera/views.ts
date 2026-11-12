import { island, zones, type ZoneId } from "../world/layout";

export interface CameraView {
  target: [number, number, number];
  distance: number;
  /** Compass angle of the camera around the target: 0° = south (front), 90° = east, 180° = north (back). */
  azimuthDeg: number;
  /** Angle down from straight overhead: 0° = top-down, 90° = eye level. */
  polarDeg: number;
}

export const FOV = 45;

/** Default view: the whole village from the south, like the reference illustration. */
export function overview(aspect: number): CameraView {
  const tanHalf = Math.tan(((FOV / 2) * Math.PI) / 180);
  // landscape: fit all bridged islands; portrait: fit the village island
  const halfWidth = aspect >= 1 ? 116 : 50;
  const distance = Math.min(340, Math.max(140, halfWidth / (tanHalf * aspect)));
  return { target: [aspect >= 1 ? 12 : 0, 9, -6], distance, azimuthDeg: -6, polarDeg: 76 };
}

export function zoneView(id: ZoneId): CameraView {
  const zone = zones.find((z) => z.id === id)!;
  return { target: [zone.focus[0], island(zone.island).y + 3, zone.focus[1]], ...zone.view };
}

/** Orbit limits: generous enough to inspect every side, tight enough never to get lost. */
export const limits = {
  minDistance: 12,
  maxDistance: 360,
  minPolar: 0.1,
  maxPolar: 1.68, // slightly below eye level, to check island undersides and bridge supports
  target: { min: [-95, -6, -85] as const, max: [110, 26, 55] as const },
};
