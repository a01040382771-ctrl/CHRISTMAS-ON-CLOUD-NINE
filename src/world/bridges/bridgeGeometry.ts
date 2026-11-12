/** Bridge deck surface and railing lines as pure data, shared by the 3D bridge and its colliders. */
import * as THREE from "three";
import { palette } from "../../design/palette";
import { bridgePoint, RAIL_INSET, type Bridge, type Vec3 } from "../layout";

/** One plank every ~0.46 m. */
export const bridgeSteps = (b: Bridge) => Math.max(8, Math.round(b.length / 0.46));

/** Horizontal unit vector across the deck (to the left when walking from start to end). */
export function bridgeSide(b: Bridge) {
  const dx = b.end[0] - b.start[0], dz = b.end[2] - b.start[2];
  const len = Math.hypot(dx, dz);
  return new THREE.Vector3(-dz / len, 0, dx / len);
}

export function bridgeCentreLine(b: Bridge) {
  const steps = bridgeSteps(b);
  return Array.from({ length: steps + 1 }, (_, i) => new THREE.Vector3(...bridgePoint(b, i / steps)));
}

/** Timber deck: one quad per plank so each board gets its own tint. This is also the walkable collision surface. */
export function buildDeckGeometry(b: Bridge) {
  const pts = bridgeCentreLine(b), side = bridgeSide(b), h = b.width / 2;
  const pos: number[] = [], uv: number[] = [], col: number[] = [];
  const base = new THREE.Color(palette.wood), alt = new THREE.Color(palette.rose), c = new THREE.Color();
  for (let i = 0; i < pts.length - 1; i++) {
    const a = pts[i], n = pts[i + 1];
    const al = [a.x - side.x * h, a.y, a.z - side.z * h], ar = [a.x + side.x * h, a.y, a.z + side.z * h];
    const bl = [n.x - side.x * h, n.y, n.z - side.z * h], br = [n.x + side.x * h, n.y, n.z + side.z * h];
    pos.push(...ar, ...br, ...al, ...al, ...br, ...bl);
    uv.push(0, 0, 0, 1, 2.5, 0, 2.5, 0, 0, 1, 2.5, 1);
    c.copy(base).lerp(alt, ((i * 37) % 11) / 30).multiplyScalar(0.92 + ((i * 53) % 7) / 60);
    for (let k = 0; k < 6; k++) col.push(c.r, c.g, c.b);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  geo.setAttribute("color", new THREE.Float32BufferAttribute(col, 3));
  geo.computeVertexNormals();
  return geo;
}

/** The two railing lines at deck level (left, right), sampled every few planks. */
export function bridgeRailLines(b: Bridge): [Vec3[], Vec3[]] {
  const side = bridgeSide(b), off = b.width / 2 - RAIL_INSET;
  const pts = bridgeCentreLine(b).filter((_, i, all) => i % 4 === 0 || i === all.length - 1);
  const line = (s: number) => pts.map((p): Vec3 => [p.x + side.x * off * s, p.y, p.z + side.z * off * s]);
  return [line(1), line(-1)];
}
