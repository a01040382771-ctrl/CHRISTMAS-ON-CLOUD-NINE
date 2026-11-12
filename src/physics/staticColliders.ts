/** Turns engine-independent collision shapes into Rapier colliders. No React, so tests and a future server can reuse it. */
import type RAPIER from "@dimforge/rapier3d-compat";
import { GROUP_BITS, interactionGroups, type CollisionShape } from "../world/collision/shapes";

type Rapier = typeof RAPIER;

export function createStaticColliders(R: Rapier, world: RAPIER.World, shapes: CollisionShape[]) {
  const colliders: RAPIER.Collider[] = [];
  for (const s of shapes) {
    let desc: RAPIER.ColliderDesc;
    if (s.kind === "mesh") desc = R.ColliderDesc.trimesh(s.vertices, s.indices);
    else if (s.kind === "cylinder") desc = R.ColliderDesc.cylinder(s.halfHeight, s.radius).setTranslation(...s.center);
    else {
      const h = s.rotY / 2;
      desc = R.ColliderDesc.cuboid(...s.half).setTranslation(...s.center).setRotation({ x: 0, y: Math.sin(h), z: 0, w: Math.cos(h) });
    }
    desc.setCollisionGroups(interactionGroups(GROUP_BITS[s.group], 0xffff));
    colliders.push(world.createCollider(desc));
  }
  return colliders;
}
