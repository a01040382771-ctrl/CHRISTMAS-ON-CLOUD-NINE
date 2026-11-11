/**
 * Raw input state shared by keyboard, mouse, touch joystick and camera.
 * Mutable module state on purpose: it is read every frame by the render loop and
 * must not trigger React re-renders.
 */
export const input = {
  keys: new Set<string>(),
  /** virtual joystick, each -1..1 (x right, y up) */
  joyX: 0,
  joyY: 0,
  /** camera orbit */
  yaw: 0,
  pitch: 0.42,
  dist: 9.5,
  interactPressed: false,
};

export const CAM = { minPitch: 0.1, maxPitch: 1.25, minDist: 4.5, maxDist: 15 };

const MOVE_KEYS = new Set(["KeyW", "KeyA", "KeyS", "KeyD", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"]);

/** Move intent in camera space: x = strafe right, y = forward. Length ≤ 1. */
export function readMoveIntent(): { x: number; y: number } {
  const k = input.keys;
  let x = (k.has("KeyD") || k.has("ArrowRight") ? 1 : 0) - (k.has("KeyA") || k.has("ArrowLeft") ? 1 : 0);
  let y = (k.has("KeyW") || k.has("ArrowUp") ? 1 : 0) - (k.has("KeyS") || k.has("ArrowDown") ? 1 : 0);
  x += input.joyX;
  y += input.joyY;
  const len = Math.hypot(x, y);
  if (len > 1) {
    x /= len;
    y /= len;
  }
  return { x, y };
}

/** Camera-space intent → world-space (x,z) direction, given camera yaw. */
export function toWorldDir(ix: number, iy: number, yaw: number): { x: number; z: number } {
  // forward = (-sin yaw, -cos yaw), right = (cos yaw, -sin yaw)
  const s = Math.sin(yaw);
  const c = Math.cos(yaw);
  return { x: ix * c - iy * s, z: -ix * s - iy * c };
}

function isTyping(e: Event) {
  const t = e.target as HTMLElement | null;
  return !!t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable);
}

export function installKeyboard(): () => void {
  const down = (e: KeyboardEvent) => {
    if (isTyping(e)) return;
    if (MOVE_KEYS.has(e.code)) e.preventDefault();
    input.keys.add(e.code);
    if (e.code === "KeyE" && !e.repeat) input.interactPressed = true;
  };
  const up = (e: KeyboardEvent) => input.keys.delete(e.code);
  const blur = () => input.keys.clear();
  window.addEventListener("keydown", down);
  window.addEventListener("keyup", up);
  window.addEventListener("blur", blur);
  document.addEventListener("visibilitychange", blur);
  return () => {
    window.removeEventListener("keydown", down);
    window.removeEventListener("keyup", up);
    window.removeEventListener("blur", blur);
    document.removeEventListener("visibilitychange", blur);
    input.keys.clear();
  };
}

/** Drag-to-orbit on a DOM element (mouse drag, or touch drag outside the joystick), wheel to zoom. */
export function installCameraControls(el: HTMLElement): () => void {
  const pointers = new Map<number, { x: number; y: number }>();
  let pinch = 0;

  const down = (e: PointerEvent) => {
    if ((e.target as HTMLElement).closest("[data-no-orbit]")) return;
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    el.setPointerCapture?.(e.pointerId);
    if (pointers.size === 2) {
      const [a, b] = [...pointers.values()];
      pinch = Math.hypot(a.x - b.x, a.y - b.y);
    }
  };
  const move = (e: PointerEvent) => {
    const p = pointers.get(e.pointerId);
    if (!p) return;
    const dx = e.clientX - p.x;
    const dy = e.clientY - p.y;
    p.x = e.clientX;
    p.y = e.clientY;
    if (pointers.size === 2) {
      const [a, b] = [...pointers.values()];
      const d = Math.hypot(a.x - b.x, a.y - b.y);
      input.dist = clamp(input.dist - (d - pinch) * 0.03, CAM.minDist, CAM.maxDist);
      pinch = d;
      return;
    }
    const k = e.pointerType === "touch" ? 0.0065 : 0.0048;
    input.yaw -= dx * k;
    input.pitch = clamp(input.pitch + dy * k, CAM.minPitch, CAM.maxPitch);
  };
  const up = (e: PointerEvent) => {
    pointers.delete(e.pointerId);
  };
  const wheel = (e: WheelEvent) => {
    e.preventDefault();
    input.dist = clamp(input.dist + e.deltaY * 0.01, CAM.minDist, CAM.maxDist);
  };
  const noMenu = (e: Event) => e.preventDefault();

  el.addEventListener("pointerdown", down);
  el.addEventListener("pointermove", move);
  el.addEventListener("pointerup", up);
  el.addEventListener("pointercancel", up);
  el.addEventListener("wheel", wheel, { passive: false });
  el.addEventListener("contextmenu", noMenu);
  return () => {
    el.removeEventListener("pointerdown", down);
    el.removeEventListener("pointermove", move);
    el.removeEventListener("pointerup", up);
    el.removeEventListener("pointercancel", up);
    el.removeEventListener("wheel", wheel);
    el.removeEventListener("contextmenu", noMenu);
  };
}

function clamp(v: number, lo: number, hi: number) {
  return v < lo ? lo : v > hi ? hi : v;
}
