import { useMemo } from "react";
import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { materials, palette } from "../../design";
import { InstancedSet, placeMatrix } from "../common/InstancedSet";
import type { TreeSpot } from "../environment/scatter";

function paint(geo: THREE.BufferGeometry, color: (y: number) => THREE.Color) {
  const pos = geo.getAttribute("position");
  const col = new Float32Array(pos.count * 3);
  for (let i = 0; i < pos.count; i++) color(pos.getY(i)).toArray(col, i * 3);
  geo.setAttribute("color", new THREE.BufferAttribute(col, 3));
  return geo;
}

/** Rounded, snow-dusted storybook pine (≈5 m tall at scale 1), merged into one geometry. */
function buildPine() {
  const green = new THREE.Color(palette.pine), deep = new THREE.Color(palette.pineDeep), snow = new THREE.Color(palette.snow), trunk = new THREE.Color(palette.trunk);
  const c = new THREE.Color();
  const parts: THREE.BufferGeometry[] = [];
  parts.push(paint(new THREE.CylinderGeometry(0.16, 0.24, 1, 10).translate(0, 0.5, 0), () => trunk));
  const tiers: [number, number, number][] = [[1.55, 2.0, 0.7], [1.25, 1.8, 1.75], [0.92, 1.6, 2.75], [0.58, 1.35, 3.65]]; // radius, height, base y
  for (const [r, h, y] of tiers) {
    // bell-shaped tier: flared skirt, rounded shoulder
    const profile = Array.from({ length: 9 }, (_, i) => {
      const t = i / 8;
      return new THREE.Vector2(Math.max(0.001, r * (Math.pow(1 - t, 1.5) * 0.7 + (1 - t) * 0.3)), y + h * t);
    });
    profile.unshift(new THREE.Vector2(0.001, y + 0.12), new THREE.Vector2(r * 0.9, y - 0.02));
    const tier = new THREE.LatheGeometry(profile, 20);
    paint(tier, (py) => {
      const t = (py - y) / h;
      // snow settles on the upper part of every tier
      return c.copy(deep).lerp(green, Math.min(1, t * 1.6)).lerp(snow, THREE.MathUtils.smoothstep(t, 0.2, 0.46) * 0.95).clone();
    });
    parts.push(tier);
  }
  return mergeGeometries(parts)!;
}

/** All background pines in one draw call. */
export function Pines({ spots }: { spots: TreeSpot[] }) {
  const geometry = useMemo(buildPine, []);
  const matrices = useMemo(() => spots.map((s) => placeMatrix(s.x, s.y, s.z, s.rotation, s.scale)), [spots]);
  return <InstancedSet geometry={geometry} material={materials.foliage} matrices={matrices} receiveShadow />;
}
