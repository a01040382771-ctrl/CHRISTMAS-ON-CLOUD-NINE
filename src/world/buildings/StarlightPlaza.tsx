import { useMemo } from "react";
import * as THREE from "three";
import { materials } from "../../design";
import { Halos } from "../common/Halos";
import { InstancedSet, placeMatrix } from "../common/InstancedSet";
import { island, plazas, SURFACE_LIFT, type LotDef } from "../layout";

const TREE_HEIGHT = 14;
const TIERS: [number, number, number][] = [[4.3, 4.4, 1.5], [3.6, 4.0, 3.7], [2.9, 3.6, 5.9], [2.2, 3.2, 8.0], [1.5, 2.8, 9.9], [0.85, 2.4, 11.6]]; // radius, height, base y

const tierProfile = (r: number, h: number, t: number) => r * (Math.pow(1 - t, 1.6) * 0.72 + (1 - t) * 0.28);
const bauble = new THREE.SphereGeometry(0.2, 14, 10);
const bulb = new THREE.SphereGeometry(0.08, 8, 6);

function starGeometry() {
  const s = new THREE.Shape();
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2 + Math.PI / 2, r = i % 2 ? 0.34 : 0.8;
    if (i === 0) s.moveTo(Math.cos(a) * r, Math.sin(a) * r); else s.lineTo(Math.cos(a) * r, Math.sin(a) * r);
  }
  s.closePath();
  const g = new THREE.ExtrudeGeometry(s, { depth: 0.18, bevelEnabled: true, bevelSize: 0.06, bevelThickness: 0.08, bevelSegments: 2 });
  g.translate(0, 0, -0.09);
  return g;
}

/**
 * 01 · Starlight Plaza — the great Christmas tree at the centre of the village.
 * PHASE 1 PLACEHOLDER: tiered tree massing with snow, baubles, a spiral of lights and a star.
 * Phase 2 details the tree, planter, benches and plaza decoration. (The plaza paving and its
 * lamps come from the layout.)
 */
export function StarlightPlaza(_: { lots: LotDef[] }) {
  const plaza = plazas[0];
  const y = island(plaza.island).y + SURFACE_LIFT;

  const tree = useMemo(() => {
    const tiers = TIERS.map(([r, h, base]) => {
      const body = [new THREE.Vector2(0.001, base + 0.25), new THREE.Vector2(r * 0.92, base - 0.04)];
      for (let i = 0; i <= 12; i++) body.push(new THREE.Vector2(Math.max(0.001, tierProfile(r, h, i / 12)), base + h * (i / 12)));
      const snow: THREE.Vector2[] = [];
      for (let i = 0; i <= 8; i++) {
        const t = 0.36 + 0.64 * (i / 8);
        snow.push(new THREE.Vector2(Math.max(0.001, tierProfile(r, h, t) + 0.1 * (1 - i / 8) + 0.02), base + h * t + 0.06));
      }
      return { body: new THREE.LatheGeometry(body, 36), snow: new THREE.LatheGeometry(snow, 36) };
    });
    // ornaments sit on the lower, snow-free part of each tier
    const gold: THREE.Matrix4[] = [], red: THREE.Matrix4[] = [], bulbs: THREE.Matrix4[] = [], glow: [number, number, number][] = [];
    TIERS.forEach(([r, h, base], ti) => {
      const count = Math.round(r * 5);
      for (let i = 0; i < count; i++) {
        const a = (i / count) * Math.PI * 2 + ti * 0.7, t = 0.06 + (i % 3) * 0.1;
        const rr = tierProfile(r, h, t) + 0.05;
        (i % 2 ? gold : red).push(placeMatrix(Math.cos(a) * rr, base + h * t, Math.sin(a) * rr, 0, 1 + (i % 3) * 0.2));
      }
    });
    // one continuous spiral of fairy lights from the lowest branches to the star
    const turns = 7.5, n = 150;
    for (let i = 0; i < n; i++) {
      const f = i / (n - 1), a = f * turns * Math.PI * 2;
      const yy = 1.9 + f * (TREE_HEIGHT - 2.6);
      const rr = 4.25 * Math.pow(1 - f, 0.9) + 0.25;
      bulbs.push(placeMatrix(Math.cos(a) * rr, yy, Math.sin(a) * rr));
      if (i % 3 === 0) glow.push([Math.cos(a) * rr, y + yy, Math.sin(a) * rr]);
    }
    return { tiers, gold, red, bulbs, glow, star: starGeometry() };
  }, [y]);

  return (
    <group name="zone:starlight-plaza">
      <group position={[plaza.center[0], y, plaza.center[1]]}>
        {/* planter */}
        <mesh position={[0, 0.3, 0]} material={materials.stone} castShadow receiveShadow><cylinderGeometry args={[4.5, 4.7, 0.6, 48]} /></mesh>
        <mesh position={[0, 0.62, 0]} scale={[1, 0.16, 1]} material={materials.snow} receiveShadow><sphereGeometry args={[4.3, 40, 12]} /></mesh>
        <mesh position={[0, 1.2, 0]} material={materials.trunk} castShadow><cylinderGeometry args={[0.5, 0.65, 2.2, 14]} /></mesh>
        {tree.tiers.map((t, i) => (
          <group key={i}>
            <mesh geometry={t.body} material={i % 2 ? materials.pine : materials.pineDeep} castShadow receiveShadow />
            <mesh geometry={t.snow} material={materials.snow} castShadow />
          </group>
        ))}
        <InstancedSet geometry={bauble} material={materials.gold} matrices={tree.gold} castShadow={false} />
        <InstancedSet geometry={bauble} material={materials.trim} matrices={tree.red} castShadow={false} />
        <InstancedSet geometry={bulb} material={materials.lampGlow} matrices={tree.bulbs} castShadow={false} />
        <mesh geometry={tree.star} position={[0, TREE_HEIGHT + 0.75, 0]} material={materials.starGlow} castShadow />
      </group>
      <Halos positions={tree.glow} size={1.5} opacity={0.42} />
      <Halos positions={[[plaza.center[0], y + TREE_HEIGHT + 0.75, plaza.center[1]]]} size={9} opacity={0.6} />
    </group>
  );
}
