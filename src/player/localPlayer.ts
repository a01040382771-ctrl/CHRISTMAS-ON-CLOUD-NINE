/**
 * The visitor controlled from this browser. In Phase 3, remote visitors get their own
 * PlayerState objects fed from the server; only this one reads local input.
 */
import { SPAWN } from "../world/collision/buildCollision";
import { defaultAppearance } from "./avatar/appearance";
import { createPlayerState } from "./state";

export const localPlayer = {
  state: createPlayerState(...SPAWN.position, SPAWN.yaw),
  /** Smoothed transform actually drawn (hides fixed-step jitter and step-up hops). */
  view: { x: SPAWN.position[0], y: SPAWN.position[1], z: SPAWN.position[2], yaw: SPAWN.yaw },
  /** Azimuth of the follow camera around the player; movement is relative to it. */
  cameraYaw: SPAWN.yaw + Math.PI,
  appearance: defaultAppearance,
  respawnRequests: 0,
};

/** Ask the controller to put the player back at the safe start point (handled on the next frame). */
export function requestRespawn() {
  localPlayer.respawnRequests++;
}
