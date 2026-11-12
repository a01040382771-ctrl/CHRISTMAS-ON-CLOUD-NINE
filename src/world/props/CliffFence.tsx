import { useMemo } from "react";
import * as THREE from "three";
import { materials, scale } from "../../design";
import { InstancedSet, placeMatrix, spanMatrix } from "../common/InstancedSet";
import type { IslandDef } from "../layout";
import { FENCE_RAILS, fenceLayout } from "./fenceLayout";

export { FENCE_INSET } from "./fenceLayout";

const post = new THREE.CylinderGeometry(0.09, 0.11, 1, 10).translate(0, 0.5, 0);
const cap = new THREE.SphereGeometry(0.16, 12, 10);
const rail = new THREE.CylinderGeometry(0.05, 0.05, 1, 8);

/**
 * Safety boundary along the cliff: posts and two rails on top of the snow bank.
 * Its layout (and the matching collision barrier) comes from fenceLayout.ts.
 */
export function CliffFence({ def }: { def: IslandDef }) {
  const parts = useMemo(() => {
    const layout = fenceLayout(def);
    const posts = layout.posts.map(([x, y, z]) => placeMatrix(x, y, z, 0, 1, scale.railingHeight + 0.1, 1));
    const caps = layout.posts.map(([x, y, z]) => placeMatrix(x, y + scale.railingHeight + 0.14, z));
    const rails = layout.segments.flatMap(([a, b]) =>
      FENCE_RAILS.map((h) => spanMatrix({ x: a[0], y: a[1] + h, z: a[2] }, { x: b[0], y: b[1] + h, z: b[2] })),
    );
    return { posts, caps, rails };
  }, [def]);

  return (
    <group name={`fence:${def.id}`}>
      <InstancedSet geometry={post} material={materials.trim} matrices={parts.posts} />
      <InstancedSet geometry={cap} material={materials.snow} matrices={parts.caps} />
      <InstancedSet geometry={rail} material={materials.wood} matrices={parts.rails} />
    </group>
  );
}
