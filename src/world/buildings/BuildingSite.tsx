import { useMemo, type ReactNode } from "react";
import { materials } from "../../design";
import { FLOOR, FOUNDATION, foundationGeometry } from "./foundation";

export { FOUNDATION };
import { island, type LotDef } from "../layout";

/**
 * A building lot: places its children at the lot's position/rotation on the right island and
 * draws the stone foundation that marks the plot. Children are modelled in local space with
 * y = 0 at the top of the foundation and +z facing the door side.
 */
export function BuildingSite({ lot, children }: { lot: LotDef; children?: ReactNode }) {
  const geometry = useMemo(() => foundationGeometry(lot), [lot]);
  const y = island(lot.island).y;
  return (
    <group name={`lot:${lot.id}`} position={[lot.center[0], y, lot.center[1]]} rotation={[0, lot.rotation, 0]}>
      <mesh name="foundation" geometry={geometry} material={materials.pad} receiveShadow castShadow />
      <group position={[0, FLOOR, 0]}>{children}</group>
    </group>
  );
}
