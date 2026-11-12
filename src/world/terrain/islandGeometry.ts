import * as THREE from "three";
import { palette } from "../../design/palette";
import { fbm2, noise2 } from "../common/noise";
import { islandRadius, type IslandDef } from "../layout";
import { snowHeight } from "./ground";

const RIM_TOP = -0.3;
const RIM_BOTTOM = -2.7;

function finish(positions: number[], indices: number[], extra: Record<string, [number[], number]> = {}) {
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  for (const [name, [data, size]] of Object.entries(extra)) geo.setAttribute(name, new THREE.Float32BufferAttribute(data, size));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}

/** Stitch `rows` rings of `segs` vertices (wrapping around) into triangles. */
function stitch(indices: number[], rows: number, segs: number, offset = 0, wrap = true) {
  const cols = wrap ? segs : segs + 1;
  for (let j = 0; j < rows - 1; j++) {
    for (let i = 0; i < segs; i++) {
      const a = offset + j * cols + i, b = offset + j * cols + ((i + 1) % cols);
      const c = a + cols, d = b + cols;
      indices.push(a, b, c, b, d, c);
    }
  }
}

/** Snow blanket: flat where people walk, drifting elsewhere, rolling over the cliff edge. */
export function buildSnowGeometry(def: IslandDef) {
  const meanR = (def.radiusX + def.radiusZ) / 2;
  const segs = Math.max(48, Math.round(meanR * 4.2));
  const rings = Math.max(10, Math.round(meanR * 1.15));
  const pos: number[] = [def.center[0], def.y + snowHeight(def, def.center[0], def.center[1]), def.center[1]];
  const idx: number[] = [];
  // overhanging lip profile: [fraction of radius, height below the bank]
  const lip: [number, number][] = [[1.012, -0.1], [1.0, -0.42], [0.985, -0.62]];

  for (let j = 1; j <= rings + lip.length; j++) {
    for (let i = 0; i < segs; i++) {
      const a = (i / segs) * Math.PI * 2;
      const edge = islandRadius(def, a);
      const cx = Math.cos(a), cz = Math.sin(a);
      if (j <= rings) {
        const u = Math.pow(j / rings, 0.9);
        const x = def.center[0] + cx * edge * u, z = def.center[1] + cz * edge * u;
        pos.push(x, def.y + snowHeight(def, x, z), z);
      } else {
        const [f, drop] = lip[j - rings - 1];
        const ex = def.center[0] + cx * edge, ez = def.center[1] + cz * edge;
        // uneven drip so the snow edge is not a ruler-straight line
        const drip = 1 + 0.9 * noise2(a * edge * 0.45, def.seed, 5);
        pos.push(def.center[0] + cx * edge * f, def.y + snowHeight(def, ex, ez) + drop * drip, def.center[1] + cz * edge * f);
      }
    }
  }
  for (let i = 0; i < segs; i++) idx.push(0, 1 + ((i + 1) % segs), 1 + i);
  stitch(idx, rings + lip.length, segs, 1);
  return finish(pos, idx);
}

/** Course of pale stone blocks under the snow: the island's retaining rim. */
export function buildRimGeometry(def: IslandDef) {
  const meanR = (def.radiusX + def.radiusZ) / 2;
  const segs = Math.max(48, Math.round(meanR * 4.2));
  const pos: number[] = [], uv: number[] = [], col: number[] = [], idx: number[] = [];
  const light = new THREE.Color(palette.stone), dark = new THREE.Color(palette.stoneShade), c = new THREE.Color();
  const blocks = Math.round((Math.PI * 2 * meanR) / 1.7);
  const rows: [number, number, number][] = [[0.992, RIM_TOP, 0], [0.988, (RIM_TOP + RIM_BOTTOM) / 2, 1], [0.972, RIM_BOTTOM, 2]];
  for (const [f, y, v] of rows) {
    for (let i = 0; i <= segs; i++) {
      const a = (i / segs) * Math.PI * 2;
      const r = islandRadius(def, a) * f;
      pos.push(def.center[0] + Math.cos(a) * r, def.y + y, def.center[1] + Math.sin(a) * r);
      uv.push((i / segs) * blocks, v);
      c.copy(light).lerp(dark, 0.25 + 0.5 * noise2(i * 0.9, v * 3.1, def.seed) + v * 0.12);
      col.push(c.r, c.g, c.b);
    }
  }
  stitch(idx, rows.length, segs, 0, false);
  return finish(pos, idx, { uv: [uv, 2], color: [col, 3] });
}

/** Rugged rock underside tapering to a rounded keel, tinted from warm stone to dusty rose. */
export function buildRockGeometry(def: IslandDef) {
  const meanR = (def.radiusX + def.radiusZ) / 2;
  const segs = Math.max(40, Math.round(meanR * 2.6));
  const rows = 16;
  const pos: number[] = [], col: number[] = [], idx: number[] = [];
  const top = new THREE.Color(palette.rock), deep = new THREE.Color(palette.rockDeep), pale = new THREE.Color(palette.stone), c = new THREE.Color();

  for (let k = 0; k <= rows; k++) {
    const t = k / rows;
    const taper = Math.pow(1 - t * t, 0.58);
    for (let i = 0; i < segs; i++) {
      const a = (i / segs) * Math.PI * 2;
      const edge = islandRadius(def, a) * 0.965;
      // bulges and hollows grow towards the middle of the profile, vanish at rim and keel
      const envelope = Math.sin(Math.PI * Math.min(1, t * 1.15)) * 0.9;
      const bulge = 1 + (fbm2(Math.cos(a) * 2.2 + t * 2.4, Math.sin(a) * 2.2 - t * 1.7, def.seed + 3) - 0.5) * 0.5 * envelope;
      const r = edge * taper * bulge;
      const x = def.center[0] + Math.cos(a) * r, z = def.center[1] + Math.sin(a) * r;
      // hanging lobes: depth varies across the underside
      const lobes = 0.7 + 0.75 * fbm2(x * 0.075, z * 0.075, def.seed + 9);
      const y = def.y + RIM_BOTTOM + 0.25 - def.depth * Math.pow(t, 0.9) * lobes;
      pos.push(x, y, z);
      const strata = 0.5 + 0.5 * Math.sin(y * 1.15 + noise2(a * 3, t * 4, def.seed) * 3);
      c.copy(top).lerp(deep, Math.min(1, Math.pow(t, 0.75) * 0.95 + strata * 0.12));
      if (t < 0.12) c.lerp(pale, 1 - t / 0.12);
      col.push(c.r, c.g, c.b);
    }
  }
  stitch(idx, rows + 1, segs);
  return finish(pos, idx, { color: [col, 3] });
}
