/**
 * Engine-independent collision shapes. Everything here is plain data in world space, so the same
 * description can drive Rapier in the browser today and an authoritative server later (Phase 3).
 */
import type { Vec3 } from "../layout";

/**
 * terrain  — surfaces you stand on (snow, paving, bridge decks, foundations, deck, steps)
 * building — architecture; also blocks the third-person camera
 * prop     — trees, lamps and other small obstacles (do not block the camera)
 * barrier  — invisible safety walls along fences and railings (do not block the camera)
 */
export type CollisionGroup = "terrain" | "building" | "prop" | "barrier";

interface Base { group: CollisionGroup; tag: string }
export interface BoxShape extends Base { kind: "box"; center: Vec3; half: Vec3; rotY: number }
export interface CylinderShape extends Base { kind: "cylinder"; center: Vec3; radius: number; halfHeight: number }
export interface MeshShape extends Base { kind: "mesh"; vertices: Float32Array; indices: Uint32Array }
export type CollisionShape = BoxShape | CylinderShape | MeshShape;

/** Bit masks shared by the physics runtime. */
export const GROUP_BITS: Record<CollisionGroup | "player", number> = {
  terrain: 1 << 0,
  building: 1 << 1,
  prop: 1 << 2,
  barrier: 1 << 3,
  player: 1 << 4,
};

/** Rapier-style interaction groups: membership in the high 16 bits, filter in the low 16 bits. */
export const interactionGroups = (membership: number, filter: number) => ((membership & 0xffff) << 16) | (filter & 0xffff);
