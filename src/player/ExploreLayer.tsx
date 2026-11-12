import { ThirdPersonCamera } from "../camera/ThirdPersonCamera";
import { PhysicsLayer } from "../physics/PhysicsLayer";
import { PlayerController } from "./PlayerController";

/**
 * Everything that needs physics: the local player and the follow camera. Loaded as a separate
 * chunk (Rapier's WASM is large) so the village renders before physics has arrived.
 */
export default function ExploreLayer({ exploring, debug }: { exploring: boolean; debug: boolean }) {
  return (
    <PhysicsLayer debug={debug}>
      <PlayerController controlsEnabled={exploring} />
      {exploring && <ThirdPersonCamera />}
    </PhysicsLayer>
  );
}
