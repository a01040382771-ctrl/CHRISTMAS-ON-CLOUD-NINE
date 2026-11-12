import { useMemo } from "react";
import { materials } from "../../design";
import { Halos } from "../common/Halos";
import { mulberry32 } from "../common/noise";
import type { LotDef } from "../layout";
import { BuildingSite } from "./BuildingSite";

/**
 * 05 · Secret Wish Forest — the wishing tree in the forest clearing.
 * PHASE 1 PLACEHOLDER: a frosted tree hung with golden wish-lights on a stone ring. The pines
 * around it come from environment/scatter.ts.
 */
export function WishForest({ lots }: { lots: LotDef[] }) {
  const orbs = useMemo(() => {
    const rnd = mulberry32(77);
    return Array.from({ length: 16 }, (): [number, number, number] => {
      const a = rnd() * Math.PI * 2, r = 0.8 + rnd() * 1.5;
      return [Math.cos(a) * r, 2.5 + rnd() * 1.9, Math.sin(a) * r];
    });
  }, []);
  return (
    <BuildingSite lot={lots[0]}>
      <mesh position={[0, 0.2, 0]} material={materials.stone} castShadow receiveShadow><cylinderGeometry args={[1.2, 1.3, 0.4, 28]} /></mesh>
      <mesh position={[0, 0.42, 0]} scale={[1, 0.3, 1]} material={materials.snow}><sphereGeometry args={[1.12, 24, 12]} /></mesh>
      <mesh position={[0, 2.1, 0]} material={materials.wallCream} castShadow><cylinderGeometry args={[0.16, 0.3, 3.6, 10]} /></mesh>
      {[[0, 4.6, 0, 2], [1.1, 3.9, 0.4, 1.35], [-1, 4, -0.5, 1.4], [0.2, 3.8, -1.1, 1.2], [-0.3, 5.7, 0.3, 1.25]].map(([x, y, z, r], i) => (
        <mesh key={i} position={[x, y, z]} material={i % 2 ? materials.wallPink : materials.snow} castShadow><sphereGeometry args={[r, 20, 14]} /></mesh>
      ))}
      {orbs.map((p, i) => <mesh key={i} position={p} material={materials.lampGlow}><sphereGeometry args={[0.11, 10, 8]} /></mesh>)}
      <Halos positions={orbs} size={1.6} opacity={0.5} />
    </BuildingSite>
  );
}
