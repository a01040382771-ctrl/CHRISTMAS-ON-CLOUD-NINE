import { useMemo } from "react";
import { materials } from "../../design";
import type { IslandDef } from "../layout";
import { buildRimGeometry, buildRockGeometry, buildSnowGeometry } from "./islandGeometry";

/** One floating island: snow blanket, stone rim and rock underside, generated from its IslandDef. */
export function FloatingIsland({ def }: { def: IslandDef }) {
  const geo = useMemo(() => ({ snow: buildSnowGeometry(def), rim: buildRimGeometry(def), rock: buildRockGeometry(def) }), [def]);
  return (
    <group name={`island:${def.id}`}>
      <mesh name="snow" geometry={geo.snow} material={materials.snow} receiveShadow castShadow />
      <mesh geometry={geo.rim} material={materials.stoneBlocks} receiveShadow />
      <mesh geometry={geo.rock} material={materials.rock} receiveShadow castShadow />
    </group>
  );
}
