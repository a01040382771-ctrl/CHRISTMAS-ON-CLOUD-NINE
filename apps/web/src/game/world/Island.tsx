import { useMemo } from "react";
import * as THREE from "three";
import { M } from "./materials";
import { revolve, mulberry32, type Profile } from "./geo";

const SNOW = new THREE.Color("#fdfbff");
const SNOW_SHADE = new THREE.Color("#ecebf6");
const ROCK_TOP = new THREE.Color("#d8bfb3");
const ROCK_MID = new THREE.Color("#b49a92");
const ROCK_DEEP = new THREE.Color("#8a7a80");

/**
 * Floating rock island: flat snowy top (y = 0, the walking surface) over a craggy, banded
 * underside. Built as one surface of revolution so silhouette and shading stay consistent
 * across the main island, the small island and the distant decorative ones.
 */
export function IslandBody({ radius, depth, seed = 1 }: { radius: number; depth: number; seed?: number }) {
  const geo = useMemo(() => {
    const R = radius;
    const D = depth;
    const under = 0.7, lip = 0.06;
    const profile: Profile = (t) => {
      if (t < under) {
        const v = t / under;
        return [R * 0.97 * Math.pow(v, 0.72), -D + (D - 1.1) * Math.pow(v, 1.5)];
      }
      if (t < under + lip) {
        const u = (t - under) / lip;
        return [R * (0.97 + 0.03 * Math.sin(u * Math.PI * 0.5)), -1.1 + 1.1 * Math.sin(u * Math.PI * 0.5)];
      }
      const u = (t - under - lip) / (1 - under - lip);
      return [R * (1 - u), 0];
    };
    const rnd = mulberry32(seed * 977);
    const ph = [rnd() * 6, rnd() * 6, rnd() * 6];
    const g = revolve(profile, {
      segments: 56,
      rows: 52,
      deform: (r, y, t, phi) => {
        if (t >= under) return [r, y];
        const k = 1 - t / under; // 1 at the tip, 0 at the rim
        const n = Math.sin(phi * 3 + y * 0.35 + ph[0]) * 0.9 + Math.sin(phi * 7 - y * 0.8 + ph[1]) * 0.5 + Math.sin(phi * 13 + y * 1.6 + ph[2]) * 0.22;
        const crag = 1 + 0.07 * n * (0.35 + (1 - k) * 0.65);
        // hanging crags: pull some sectors further down
        const drip = Math.max(0, Math.sin(phi * 5 + ph[1])) * Math.max(0, 1 - Math.abs(t / under - 0.55) * 3.2) * D * 0.06;
        return [r * crag, y - drip];
      },
    });
    // vertex colours: snow cap → warm rock → cool deep rock, with strata banding
    const pos = g.getAttribute("position") as THREE.BufferAttribute;
    const col = new Float32Array(pos.count * 3);
    const c = new THREE.Color();
    for (let i = 0; i < pos.count; i++) {
      const y = pos.getY(i);
      const band = 0.5 + 0.5 * Math.sin(y * 1.6 + Math.hypot(pos.getX(i), pos.getZ(i)) * 0.15);
      if (y > -0.5) c.copy(SNOW);
      else if (y > -2.6) c.copy(SNOW_SHADE).lerp(ROCK_TOP, THREE.MathUtils.smoothstep(-y, 0.5, 2.6));
      else if (y > -D * 0.55) c.copy(ROCK_TOP).lerp(ROCK_MID, THREE.MathUtils.smoothstep(-y, 2.6, D * 0.55));
      else c.copy(ROCK_MID).lerp(ROCK_DEEP, THREE.MathUtils.smoothstep(-y, D * 0.55, D));
      if (y < -0.6) {
        const nz = 0.5 + 0.5 * Math.sin(pos.getX(i) * 1.3 + Math.sin(pos.getZ(i) * 0.9) * 2) * Math.sin(pos.getZ(i) * 1.1 + y * 0.7);
        c.multiplyScalar(0.84 + band * 0.16 + nz * 0.12);
      }
      col[i * 3] = c.r;
      col[i * 3 + 1] = c.g;
      col[i * 3 + 2] = c.b;
    }
    g.setAttribute("color", new THREE.BufferAttribute(col, 3));
    // UV tiling for the strata texture
    const uv = g.getAttribute("uv") as THREE.BufferAttribute;
    for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * 9, uv.getY(i) * 3.5);
    return g;
  }, [radius, depth, seed]);

  const m = M();
  return <mesh geometry={geo} material={m.rock} castShadow receiveShadow userData={{ noBatch: true }} />;
}

/** Snow drifts scattered on the rim outside the walkable margin (instanced). */
export function RimDrifts({ radius, inner, count = 70, seed = 3, gapYaws = [] }: { radius: number; inner: number; count?: number; seed?: number; gapYaws?: number[] }) {
  const m = M();
  const items = useMemo(() => {
    const rnd = mulberry32(seed);
    const out: { x: number; z: number; s: number; h: number }[] = [];
    let guard = 0;
    while (out.length < count && guard++ < count * 6) {
      const a = rnd() * Math.PI * 2;
      if (gapYaws.some((gy) => Math.abs(Math.atan2(Math.sin(a - gy), Math.cos(a - gy))) < 0.22)) continue;
      const r = inner + 0.15 + rnd() * (radius - inner - 0.35);
      out.push({ x: Math.sin(a) * r, z: Math.cos(a) * r, s: 0.5 + rnd() * 0.9, h: 0.25 + rnd() * 0.3 });
    }
    return out;
  }, [radius, inner, count, seed, gapYaws]);
  return (
    <group>
      {items.map((d, i) => (
        <mesh key={i} position={[d.x, 0, d.z]} scale={[d.s, d.h * d.s, d.s]} material={m.snow} receiveShadow>
          <sphereGeometry args={[1, 12, 8]} />
        </mesh>
      ))}
    </group>
  );
}
