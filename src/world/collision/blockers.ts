/**
 * Solid volumes of every building, in lot-local space (y = 0 is the floor on top of the
 * foundation slab, +z is the door side). They follow the massing in the matching
 * world/buildings/<Zone>.tsx file — when a building is redesigned in Phase 3, update its entry here
 * (the layout tests check that every door stays reachable).
 *
 * Volumes run up to the roof so the third-person camera never clips into a building.
 */
import type { LotDef, ZoneId } from "../layout";
import type { CollisionGroup } from "./shapes";

export type LocalBlocker =
  | { kind: "box"; x: number; z: number; w: number; d: number; h: number; y?: number; group?: CollisionGroup }
  | { kind: "cylinder"; x: number; z: number; r: number; h: number; y?: number; group?: CollisionGroup };

const box = (x: number, z: number, w: number, d: number, h: number, group?: CollisionGroup): LocalBlocker => ({ kind: "box", x, z, w, d, h, group });
const cyl = (x: number, z: number, r: number, h: number, group?: CollisionGroup): LocalBlocker => ({ kind: "cylinder", x, z, r, h, group });

const gazeboColumns = Array.from({ length: 8 }, (_, i) => {
  const a = ((i + 0.5) / 8) * Math.PI * 2;
  return cyl(Math.cos(a) * 2.35, Math.sin(a) * 2.35, 0.2, 3.6);
});

export const zoneBlockers: Record<Exclude<ZoneId, "starlight-plaza">, (lot: LotDef) => LocalBlocker[]> = {
  // hall (+ plinth), entrance porch, corner tower
  "invitation-house": () => [box(1.2, -0.6, 7.3, 5.9, 7.7), box(0, 2.5, 3.1, 1.7, 4.7), cyl(-3.3, 0.9, 2.2, 11.8)],
  // centre hall, west wing + porch, east wing, north-east turret; the two front steps are walkable,
  // the potted firs beside them are small obstacles
  "velvet-ballroom": () => [
    box(0, -0.3, 6.7, 7.3, 10.6), box(-5.7, -0.4, 5.3, 5.9, 5.6), box(-5.8, 3.3, 5.0, 1.9, 3.6),
    box(5.8, -0.6, 5.5, 5.9, 8.2), cyl(3.3, -3.45, 1.35, 15),
    box(0, 3.8, 2.7, 0.9, 0.38, "terrain"), box(0, 4.5, 3.2, 0.6, 0.16, "terrain"),
    cyl(-1.95, 4.05, 0.4, 1.6, "prop"), cyl(1.95, 4.05, 0.4, 1.6, "prop"),
  ],
  // glasshouse on its low wall
  "photo-garden": () => [box(0, 0, 6.7, 11.7, 5.9)],
  // stone ring and trunk of the wishing tree
  "wish-forest": () => [cyl(0, 0, 1.32, 6)],
  // counter, back wall and posts of one stall
  "candy-market": () => [box(0, -0.05, 3.5, 2.0, 4.1)],
  // stepped plinth you can walk onto, eight columns with room to pass between
  "moonlit-terrace": () => [{ kind: "cylinder", x: 0, z: 0, r: 2.85, h: 0.24, group: "terrain" }, ...gazeboColumns],
};

