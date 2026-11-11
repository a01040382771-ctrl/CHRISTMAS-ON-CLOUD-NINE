import * as THREE from "three";
import { OBSTACLES, TREE, groundHeight } from "@sky/shared";

/** Height of each obstacle for camera occlusion tests (meters). Collision itself is 2D. */
function obstacleHeight(id: string): number {
  if (id === "tree") return 14;
  if (id.startsWith("invitation")) return 10;
  if (id.startsWith("market")) return 7.5;
  if (id.startsWith("ballroom")) return 8.5;
  if (id.startsWith("tower")) return 12;
  if (id.startsWith("cottage")) return 6;
  if (id.startsWith("small-tree")) return 7;
  if (id.startsWith("pine")) return 4.8;
  if (id.startsWith("bench")) return 1.3;
  if (id.startsWith("snowman")) return 2.4;
  if (id.startsWith("pole")) return 3.8;
  if (id.startsWith("lamp")) return 4.4;
  return 3;
}
const HEIGHTS = OBSTACLES.map((o) => obstacleHeight(o.id));

/** Is a camera sample point inside solid geometry? */
export function cameraBlocked(x: number, y: number, z: number): boolean {
  for (let i = 0; i < OBSTACLES.length; i++) {
    const o = OBSTACLES[i];
    if (y > HEIGHTS[i] + 0.2) continue;
    const pad = 0.55;
    if (o.kind === "circle") {
      const r = o.id === "tree" ? o.r : o.r + pad;
      if ((x - o.x) ** 2 + (z - o.z) ** 2 < r * r) return true;
    } else {
      const c = Math.cos(o.rot), s = Math.sin(o.rot);
      const dx = x - o.x, dz = z - o.z;
      const lx = dx * c - dz * s, lz = dx * s + dz * c;
      if (Math.abs(lx) < o.hx + pad && Math.abs(lz) < o.hz + pad) return true;
    }
  }
  return false;
}

/** Is a point inside the giant tree's conical canopy? */
export function insideCanopy(x: number, y: number, z: number): boolean {
  // slightly "fat" cone: errs on the side of fading so the avatar is never hidden behind boughs
  if (y < 1.3 || y > 14.2) return false;
  const r = 5.3 * (1 - (y - 1.3) / 13.0);
  return (x - TREE.x) ** 2 + (z - TREE.z) ** 2 < r * r;
}

/** 1 = canopy opaque, <1 while the tree is between the lens and the avatar (or the lens is inside it). */
export const treeFade = { target: 1 };

const desired = new THREE.Vector3();
const look = new THREE.Vector3();
let initialised = false;

export function resetCamera() {
  initialised = false;
}

/**
 * Third-person orbit camera: yaw/pitch/dist from input, shortened when a building,
 * tree or prop would sit between the avatar and the lens, never dipping below the floor.
 */
export function updateCamera(camera: THREE.PerspectiveCamera, px: number, py: number, pz: number, yaw: number, pitch: number, dist: number, dt: number) {
  const head = py + 1.35;
  const cp = Math.cos(pitch);
  const dx = Math.sin(yaw) * cp;
  const dy = Math.sin(pitch);
  const dz = Math.cos(yaw) * cp;

  // march outward from the head until something is in the way
  let d = dist;
  const step = 0.35;
  for (let s = 0.9; s <= dist; s += step) {
    if (cameraBlocked(px + dx * s, head + dy * s, pz + dz * s)) {
      d = Math.max(1.4, s - 0.7);
      break;
    }
  }
  desired.set(px + dx * d, head + dy * d, pz + dz * d);
  const floor = Math.max(0.6, groundHeight(desired.x, desired.z) + 0.6);
  if (desired.y < floor) desired.y = floor;
  look.set(px, py + 1.15, pz);

  if (!initialised) {
    camera.position.copy(desired);
    initialised = true;
  } else {
    // shrink instantly (never clip through a wall), relax outward smoothly
    const k = 1 - Math.exp(-10 * dt);
    const cur = camera.position;
    const curDist = Math.hypot(cur.x - px, cur.z - pz);
    const wantDist = Math.hypot(desired.x - px, desired.z - pz);
    if (wantDist < curDist - 0.01) camera.position.copy(desired).lerp(cur, 0.0);
    cur.lerp(desired, k);
  }
  camera.lookAt(look);

  // fade the tree canopy if it hides the avatar
  let hidden = false;
  const cx = camera.position.x, cy = camera.position.y, cz = camera.position.z;
  for (let i = 0; i <= 12 && !hidden; i++) {
    const t = i / 12;
    hidden = insideCanopy(cx + (px - cx) * t, cy + (py + 1.2 - cy) * t, cz + (pz - cz) * t);
  }
  treeFade.target = hidden ? 0.22 : 1;
}
