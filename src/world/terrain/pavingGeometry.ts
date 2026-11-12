import * as THREE from "three";
import { palette } from "../../design/palette";
import { scale } from "../../design/scale";
import { mulberry32 } from "../common/noise";
import type { Path, PlazaDef } from "../layout";

/**
 * Cobbled surfaces are built stone by stone: every quad is one cobble with its own tint, mapped
 * to a single rounded-stone tile. This keeps the hand-laid look at any zoom level.
 */
class StoneMesh {
  pos: number[] = [];
  uv: number[] = [];
  col: number[] = [];
  private c = new THREE.Color();
  constructor(private base: THREE.Color, private accents: THREE.Color[], private rnd: () => number) {}

  tint(override?: THREE.Color) {
    this.c.copy(override ?? this.base);
    this.c.lerp(this.accents[Math.floor(this.rnd() * this.accents.length)], this.rnd() * (override ? 0.25 : 0.55));
    this.c.multiplyScalar(0.94 + this.rnd() * 0.08);
    return this.c;
  }

  /** a-b is the near edge, d-c the far edge; u0..u1 is the slice of the stone tile. */
  quad(a: number[], b: number[], c: number[], d: number[], u0: number, u1: number, color: THREE.Color) {
    this.pos.push(...a, ...d, ...b, ...b, ...d, ...c);
    this.uv.push(u0, 0, u0, 1, u1, 0, u1, 0, u0, 1, u1, 1);
    for (let i = 0; i < 6; i++) this.col.push(color.r, color.g, color.b);
  }

  build() {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute(this.pos, 3));
    geo.setAttribute("uv", new THREE.Float32BufferAttribute(this.uv, 2));
    geo.setAttribute("color", new THREE.Float32BufferAttribute(this.col, 3));
    const normals = new Float32Array(this.pos.length);
    for (let i = 1; i < normals.length; i += 3) normals[i] = 1;
    geo.setAttribute("normal", new THREE.BufferAttribute(normals, 3));
    return geo;
  }
}

const paving = new THREE.Color(palette.paving);
const accents = [new THREE.Color(palette.pavingRose), new THREE.Color(palette.cream), new THREE.Color(palette.stone)];
const border = new THREE.Color(palette.pavingRose);
const band = new THREE.Color(palette.champagne).lerp(new THREE.Color(palette.paving), 0.35);

/** Ribbon of cobbles along a path, laid in a running bond with a rose border course. */
export function buildPathGeometry(path: Path, y: number, seed: number) {
  const mesh = new StoneMesh(paving, accents, mulberry32(seed));
  const pts = path.points;
  const across = Math.max(2, Math.round(path.width / scale.stone));
  const normals = pts.map((_, i) => {
    const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)];
    const d = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
    return [-(b[1] - a[1]) / d, (b[0] - a[0]) / d];
  });
  const at = (i: number, s: number) => [pts[i][0] + normals[i][0] * s * path.width, y, pts[i][1] + normals[i][1] * s * path.width];

  for (let i = 0; i < pts.length - 1; i++) {
    // odd rows are shifted half a stone, so the two edge stones are halves
    const cuts: number[] = [];
    if (i % 2 === 0) for (let k = 0; k <= across; k++) cuts.push(k);
    else { cuts.push(0); for (let k = 0; k < across; k++) cuts.push(k + 0.5); cuts.push(across); }
    for (let k = 0; k < cuts.length - 1; k++) {
      const s0 = cuts[k] / across - 0.5, s1 = cuts[k + 1] / across - 0.5;
      const isEdge = k === 0 || k === cuts.length - 2;
      const shift = i % 2 === 0 ? 0 : 0.5;
      mesh.quad(at(i, s1), at(i, s0), at(i + 1, s0), at(i + 1, s1), cuts[k + 1] + shift, cuts[k] + shift, mesh.tint(isEdge ? border : undefined));
    }
  }
  return mesh.build();
}

/** Circular plaza laid in concentric rings with a rose border and a champagne inlay band. */
export function buildPlazaGeometry(plaza: PlazaDef, y: number, seed: number) {
  const mesh = new StoneMesh(paving, accents, mulberry32(seed));
  const rings = Math.max(2, Math.round(plaza.radius / scale.stone));
  const ringW = plaza.radius / rings;
  const [cx, cz] = plaza.center;
  for (let j = 0; j < rings; j++) {
    const r0 = j * ringW, r1 = r0 + ringW;
    const count = Math.max(6, Math.round((Math.PI * 2 * (r0 + r1) * 0.5) / (scale.stone * 1.15)));
    const offset = (j % 2) * 0.5;
    const fromEdge = rings - 1 - j;
    const accent = fromEdge < 2 ? border : rings > 8 && (j === Math.round(rings * 0.58) || j === Math.round(rings * 0.58) + 1) ? band : undefined;
    for (let i = 0; i < count; i++) {
      const a0 = ((i + offset) / count) * Math.PI * 2, a1 = ((i + 1 + offset) / count) * Math.PI * 2;
      const p = (r: number, a: number) => [cx + Math.cos(a) * r, y, cz + Math.sin(a) * r];
      mesh.quad(p(r0, a1), p(r0, a0), p(r1, a0), p(r1, a1), 1, 0, mesh.tint(accent));
    }
  }
  return mesh.build();
}
