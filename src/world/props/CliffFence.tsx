import { useMemo } from "react";
import * as THREE from "three";
import { materials, scale } from "../../design";
import { InstancedSet, placeMatrix, spanMatrix } from "../common/InstancedSet";
import { distToWalkway, islandPoint, railAnchors, type IslandDef } from "../layout";
import { groundY } from "../terrain/ground";

const post = new THREE.CylinderGeometry(0.09, 0.11, 1, 10).translate(0, 0.5, 0);
const cap = new THREE.SphereGeometry(0.16, 12, 10);
const rail = new THREE.CylinderGeometry(0.05, 0.05, 1, 8);

/** How far in from the cliff the safety fence stands (fraction of the island radius). */
export const FENCE_INSET = 0.905;

/**
 * Safety boundary along the cliff: posts and two rails on top of the snow bank.
 * It leaves a gap wherever a walkway reaches the edge (bridge landings, the arrival deck).
 */
export function CliffFence({ def }: { def: IslandDef }) {
  const parts = useMemo(() => {
    const meanR = (def.radiusX + def.radiusZ) / 2;
    const count = Math.round((Math.PI * 2 * meanR * FENCE_INSET) / 2.4);
    const spots = Array.from({ length: count }, (_, i) => {
      const [x, z] = islandPoint(def, (i / count) * Math.PI * 2, FENCE_INSET);
      return { x, z, y: groundY(def, x, z) - 0.06, open: distToWalkway(def.id, x, z) < 0.5 };
    });
    const posts: THREE.Matrix4[] = [], caps: THREE.Matrix4[] = [], rails: THREE.Matrix4[] = [];
    spots.forEach((s, i) => {
      if (s.open) return;
      posts.push(placeMatrix(s.x, s.y, s.z, 0, 1, scale.railingHeight + 0.1, 1));
      caps.push(placeMatrix(s.x, s.y + scale.railingHeight + 0.14, s.z));
      const n = spots[(i + 1) % count];
      if (n.open) return;
      for (const h of [scale.railingHeight - 0.08, 0.52]) rails.push(spanMatrix({ x: s.x, y: s.y + h, z: s.z }, { x: n.x, y: n.y + h, z: n.z }));
    });
    // tie the fence ends into the first railing posts of each bridge / the dock
    for (const [ax, ay, az] of railAnchors(def.id)) {
      const end = spots.filter((s) => !s.open).reduce((best, s) => (Math.hypot(s.x - ax, s.z - az) < Math.hypot(best.x - ax, best.z - az) ? s : best));
      if (Math.hypot(end.x - ax, end.z - az) > 7) continue;
      const mid = { x: (end.x + ax) / 2, y: (end.y + ay) / 2, z: (end.z + az) / 2 };
      posts.push(placeMatrix(mid.x, mid.y, mid.z, 0, 1, scale.railingHeight + 0.1, 1));
      caps.push(placeMatrix(mid.x, mid.y + scale.railingHeight + 0.14, mid.z));
      for (const h of [scale.railingHeight - 0.08, 0.52]) {
        rails.push(spanMatrix({ x: end.x, y: end.y + h, z: end.z }, { x: mid.x, y: mid.y + h, z: mid.z }));
        rails.push(spanMatrix({ x: mid.x, y: mid.y + h, z: mid.z }, { x: ax, y: ay + h, z: az }));
      }
    }
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
