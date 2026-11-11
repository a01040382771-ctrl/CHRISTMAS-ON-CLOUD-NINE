import * as THREE from "three";

/** [radius, y] along a surface of revolution; t = 0 (bottom) … 1 (apex). */
export type Profile = (t: number) => [number, number];

export interface RevolveOptions {
  segments?: number;
  rows?: number;
  /** per-angle start of the profile (used for wavy snow edges) */
  tStart?: (phi: number) => number;
  /** push the surface outwards along its normal; s = 0 at the cut edge … 1 at the apex */
  thickness?: (s: number, phi: number) => number;
  /** final per-vertex adjustment */
  deform?: (r: number, y: number, t: number, phi: number) => [number, number];
}

/**
 * Surface of revolution with optional wavy cut edge. One helper builds domes,
 * onion roofs, scalloped tree tiers, snow caps and island undersides so the
 * whole village shares the same soft, hand-modelled silhouette language.
 */
export function revolve(profile: Profile, o: RevolveOptions = {}): THREE.BufferGeometry {
  const segments = o.segments ?? 40;
  const rows = o.rows ?? 14;
  const pos: number[] = [];
  const uv: number[] = [];
  const idx: number[] = [];
  const eps = 0.002;

  for (let j = 0; j <= rows; j++) {
    const s = j / rows;
    for (let i = 0; i <= segments; i++) {
      const phi = (i / segments) * Math.PI * 2;
      const t0 = o.tStart ? o.tStart(phi) : 0;
      const t = t0 + s * (1 - t0);
      let [r, y] = profile(t);
      const thick = o.thickness ? o.thickness(s, phi) : 0;
      if (thick !== 0) {
        // outward normal of the profile curve in the (r,y) plane
        const [r1, y1] = profile(Math.min(1, t + eps));
        const [r0, y0] = profile(Math.max(0, t - eps));
        let nr = y1 - y0;
        let ny = -(r1 - r0);
        const l = Math.hypot(nr, ny) || 1;
        nr /= l;
        ny /= l;
        if (nr < 0 && ny < 0) { nr = -nr; ny = -ny; }
        r += nr * thick;
        y += ny * thick;
      }
      if (o.deform) [r, y] = o.deform(r, y, t, phi);
      pos.push(Math.sin(phi) * r, y, Math.cos(phi) * r);
      uv.push(i / segments, s);
    }
  }
  const w = segments + 1;
  for (let j = 0; j < rows; j++) {
    for (let i = 0; i < segments; i++) {
      const a = j * w + i;
      const b = a + 1;
      const c = a + w;
      const d = c + 1;
      idx.push(a, c, b, b, c, d);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  g.computeVertexNormals();

  // Make sure faces point outward (profile direction decides winding).
  const n = g.getAttribute("normal") as THREE.BufferAttribute;
  const p = g.getAttribute("position") as THREE.BufferAttribute;
  let dot = 0;
  for (let k = 0; k < p.count; k += 7) dot += n.getX(k) * p.getX(k) + n.getZ(k) * p.getZ(k);
  if (dot < 0) {
    const ix = g.index!;
    for (let k = 0; k < ix.count; k += 3) {
      const t1 = ix.getX(k + 1);
      ix.setX(k + 1, ix.getX(k + 2));
      ix.setX(k + 2, t1);
    }
    g.computeVertexNormals();
  }
  // weld seam normals
  for (let j = 0; j <= rows; j++) {
    const a = j * w;
    const b = a + segments;
    const nx = n.getX(a) + n.getX(b), ny = n.getY(a) + n.getY(b), nz = n.getZ(a) + n.getZ(b);
    const l = Math.hypot(nx, ny, nz) || 1;
    n.setXYZ(a, nx / l, ny / l, nz / l);
    n.setXYZ(b, nx / l, ny / l, nz / l);
  }
  g.computeBoundingSphere();
  return g;
}

// ───────────── roof & tier profiles ─────────────

export const domeProfile = (R: number, H: number): Profile => (t) => {
  const a = t * Math.PI * 0.5;
  return [R * Math.cos(a), H * Math.sin(a)];
};

/** swooping witch-hat cone with a slight flare at the eaves */
export const coneProfile = (R: number, H: number, flare = 0.22): Profile => (t) => {
  const r = R * Math.pow(1 - t, 1 + flare * 3);
  return [r, H * t];
};

/** onion dome that pinches to a point */
export const onionProfile = (R: number, H: number): Profile => (t) => {
  const r = R * Math.pow(1 - t, 0.62) * (1 + 0.32 * Math.sin(Math.PI * Math.min(1, t * 1.15)));
  return [r, H * t];
};

/** Wavy cut line ratio for snow edges. */
export const wavyCut = (base: number, amp: number, freq: number, phase = 0) => (phi: number) =>
  base + amp * (0.6 * Math.sin(phi * freq + phase) + 0.4 * Math.sin(phi * freq * 2.3 + phase * 1.7));

/** Snow blanket that follows a roof profile. */
export function snowCap(
  profile: Profile,
  opts: { cut?: number; amp?: number; freq?: number; thick?: number; segments?: number; rows?: number; phase?: number } = {}
) {
  const { cut = 0.28, amp = 0.07, freq = 7, thick = 0.1, segments = 40, rows = 12, phase = 0 } = opts;
  return revolve(profile, {
    segments,
    rows,
    tStart: wavyCut(cut, amp, freq, phase),
    // rounded lip: thickness rises quickly from 0 at the cut then plateaus
    thickness: (s) => thick * Math.min(1, Math.sin(Math.min(1, s * 6) * Math.PI * 0.5) * 1.0 + 0.0),
  });
}

/** Arch-topped shape (doors, windows). Origin at bottom-centre. */
export function archShape(w: number, h: number): THREE.Shape {
  const r = w / 2;
  const s = new THREE.Shape();
  s.moveTo(-r, 0);
  s.lineTo(-r, h - r);
  s.absarc(0, h - r, r, Math.PI, 0, true);
  s.lineTo(r, 0);
  s.closePath();
  return s;
}

export function archGeometry(w: number, h: number, depth = 0.06, bevel = 0): THREE.ExtrudeGeometry {
  return new THREE.ExtrudeGeometry(archShape(w, h), {
    depth,
    bevelEnabled: bevel > 0,
    bevelSize: bevel,
    bevelThickness: bevel,
    bevelSegments: 2,
    curveSegments: 12,
  });
}

/** Deterministic PRNG so every client builds an identical village. */
export function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
