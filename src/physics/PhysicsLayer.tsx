import { Suspense, useEffect, useState, type ReactNode } from "react";
import { Physics, useRapier } from "@react-three/rapier";
import { buildCollision } from "../world/collision/buildCollision";
import type { CollisionShape } from "../world/collision/shapes";
import { createStaticColliders } from "./staticColliders";

let cached: CollisionShape[] | null = null;
const collisionShapes = () => (cached ??= buildCollision());

/** Adds the whole static collision world, then reports ready. */
function StaticColliders({ onReady }: { onReady: (ready: boolean) => void }) {
  const { world, rapier } = useRapier();
  useEffect(() => {
    const colliders = createStaticColliders(rapier, world, collisionShapes());
    world.step(); // build the query structures before the first character move
    onReady(true);
    return () => {
      onReady(false);
      for (const c of colliders) {
        try { world.removeCollider(c, false); } catch { /* world already freed */ }
      }
    };
  }, [world, rapier, onReady]);
  return null;
}

/**
 * Rapier physics (via @react-three/rapier). The visible world renders without waiting for it;
 * children (player, follow camera) mount once the colliders exist. `debug` draws every collider.
 */
export function PhysicsLayer({ debug = false, children }: { debug?: boolean; children: ReactNode }) {
  const [ready, setReady] = useState(false);
  return (
    <Suspense fallback={null}>
      <Physics debug={debug} timeStep={1 / 60} gravity={[0, -9.81, 0]}>
        <StaticColliders onReady={setReady} />
        {ready && children}
      </Physics>
    </Suspense>
  );
}
