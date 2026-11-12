/**
 * Character state — plain data, independent of rendering, input and physics.
 * The local player writes it; in Phase 3 remote avatars will be driven by the same shape
 * received from the server (see PlayerSnapshot).
 */
export type AnimState = "idle" | "walk" | "run" | "turn";

/** What another client needs to draw this avatar. Small and serialisable for network sync. */
export interface PlayerSnapshot {
  x: number;
  y: number;
  z: number;
  /** Facing, radians; 0 = +z (south), π = north. */
  yaw: number;
  /** Horizontal ground speed, m/s. */
  speed: number;
  anim: AnimState;
}

export interface PlayerState extends PlayerSnapshot {
  /** Horizontal velocity, m/s. */
  vx: number;
  vz: number;
  /** Yaw change rate, rad/s (drives turn leaning). */
  turnRate: number;
  grounded: boolean;
  /** Increments on every respawn / teleport so views can snap instead of gliding. */
  teleportCount: number;
}

export function createPlayerState(x: number, y: number, z: number, yaw: number): PlayerState {
  return { x, y, z, yaw, speed: 0, anim: "idle", vx: 0, vz: 0, turnRate: 0, grounded: true, teleportCount: 0 };
}

export const snapshotOf = (s: PlayerState): PlayerSnapshot => ({ x: s.x, y: s.y, z: s.z, yaw: s.yaw, speed: s.speed, anim: s.anim });
