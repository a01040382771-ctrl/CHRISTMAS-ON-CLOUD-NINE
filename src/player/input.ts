/**
 * Input state shared by keyboard, on-screen joystick and pointer look. Devices write here; the
 * player controller and third-person camera read from it. Nothing here knows about the avatar.
 */
import { useEffect } from "react";
import type { MoveInput } from "./movement";

export const input = {
  keys: { forward: false, back: false, left: false, right: false, run: false },
  /** Virtual joystick, -1..1 (y up = forward). */
  joyX: 0,
  joyY: 0,
  /** Joystick pushed to its rim = run. */
  joyRun: false,
  /** Accumulated look deltas in radians and zoom factor, consumed by the camera each frame. */
  lookYaw: 0,
  lookPitch: 0,
  zoom: 1,
  /** Last time (ms) the user steered the camera by hand. */
  lastLookAt: 0,
};

export function readMove(): MoveInput {
  const k = input.keys;
  const forward = (k.forward ? 1 : 0) - (k.back ? 1 : 0) + input.joyY;
  const right = (k.right ? 1 : 0) - (k.left ? 1 : 0) + input.joyX;
  return { forward: Math.max(-1, Math.min(1, forward)), right: Math.max(-1, Math.min(1, right)), run: k.run || input.joyRun };
}

export function resetInput() {
  Object.assign(input.keys, { forward: false, back: false, left: false, right: false, run: false });
  input.joyX = input.joyY = 0;
  input.joyRun = false;
  input.lookYaw = input.lookPitch = 0;
  input.zoom = 1;
}

const KEYMAP: Record<string, keyof typeof input.keys> = {
  KeyW: "forward", ArrowUp: "forward",
  KeyS: "back", ArrowDown: "back",
  KeyA: "left", ArrowLeft: "left",
  KeyD: "right", ArrowRight: "right",
  ShiftLeft: "run", ShiftRight: "run",
};

/** WASD / arrow keys + Shift while `enabled`. */
export function useKeyboard(enabled: boolean, onRespawn?: () => void) {
  useEffect(() => {
    if (!enabled) return;
    const set = (e: KeyboardEvent, down: boolean) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      const key = KEYMAP[e.code];
      if (key) { input.keys[key] = down; e.preventDefault(); }
      else if (down && e.code === "KeyR" && !e.repeat) onRespawn?.();
    };
    const down = (e: KeyboardEvent) => set(e, true), up = (e: KeyboardEvent) => set(e, false);
    const clear = () => resetInput();
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    window.addEventListener("blur", clear);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      window.removeEventListener("blur", clear);
      resetInput();
    };
  }, [enabled, onRespawn]);
}
