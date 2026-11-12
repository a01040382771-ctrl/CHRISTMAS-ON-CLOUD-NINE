/**
 * Movement rules: camera-relative direction, walk/run speeds, acceleration, facing and animation
 * state. Pure functions on fixed time steps, so movement is identical at any frame rate.
 */
import type { AnimState, PlayerState } from "./state";

export const MOVE = {
  walkSpeed: 3.2,
  runSpeed: 6.6,
  /** How quickly velocity reaches the target (1/s). */
  accel: 12,
  /** Stopping is snappier than starting. */
  decel: 18,
  /** Max facing turn speed, rad/s. */
  turnSpeed: 10,
  fixedDt: 1 / 60,
} as const;

export interface MoveInput {
  /** -1..1, forward is away from the camera. */
  forward: number;
  /** -1..1 */
  right: number;
  run: boolean;
}

/** World-space desired direction (length ≤ 1) for an input, relative to the camera's yaw. */
export function worldDirection(input: MoveInput, cameraYaw: number): [number, number] {
  // camera sits at (sin yaw, cos yaw) from the player, so "forward" points the other way
  const fx = -Math.sin(cameraYaw), fz = -Math.cos(cameraYaw);
  const rx = Math.cos(cameraYaw), rz = -Math.sin(cameraYaw);
  let x = fx * input.forward + rx * input.right, z = fz * input.forward + rz * input.right;
  const len = Math.hypot(x, z);
  if (len > 1) { x /= len; z /= len; }
  return [x, z];
}

const wrap = (a: number) => Math.atan2(Math.sin(a), Math.cos(a));

/**
 * Advance velocity and facing by one fixed step. Returns the horizontal displacement to hand to the
 * physics motor.
 */
export function steer(state: PlayerState, dir: [number, number], run: boolean, dt: number): [number, number] {
  const mag = Math.hypot(dir[0], dir[1]);
  const speed = mag * (run ? MOVE.runSpeed : MOVE.walkSpeed);
  const tx = mag > 0 ? (dir[0] / mag) * speed : 0, tz = mag > 0 ? (dir[1] / mag) * speed : 0;
  const k = 1 - Math.exp(-(mag > 0.01 ? MOVE.accel : MOVE.decel) * dt);
  state.vx += (tx - state.vx) * k;
  state.vz += (tz - state.vz) * k;
  if (mag < 0.01 && Math.hypot(state.vx, state.vz) < 0.05) { state.vx = 0; state.vz = 0; }

  let turned = 0;
  if (mag > 0.05) {
    const diff = wrap(Math.atan2(dir[0], dir[1]) - state.yaw);
    turned = Math.sign(diff) * Math.min(Math.abs(diff), MOVE.turnSpeed * dt);
    state.yaw = wrap(state.yaw + turned);
  }
  state.turnRate += (turned / dt - state.turnRate) * (1 - Math.exp(-14 * dt));
  return [state.vx * dt, state.vz * dt];
}

/** After physics resolved the step: record the real ground speed and pick the animation. */
export function settle(state: PlayerState, travelled: number, dt: number) {
  const actual = travelled / dt;
  // when a wall blocks the way, forget the blocked part of the velocity
  const wanted = Math.hypot(state.vx, state.vz);
  if (wanted > actual + 0.5) { const f = actual / wanted; state.vx *= f; state.vz *= f; }
  state.speed += (actual - state.speed) * (1 - Math.exp(-16 * dt));
  state.anim = animFor(state.speed, state.turnRate);
}

export function animFor(speed: number, turnRate: number): AnimState {
  if (speed < 0.35) return Math.abs(turnRate) > 1.6 ? "turn" : "idle";
  return speed > (MOVE.walkSpeed + MOVE.runSpeed) / 2 ? "run" : "walk";
}
