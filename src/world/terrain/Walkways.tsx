import { useMemo } from "react";
import { materials } from "../../design";
import { buildWalkwayGeometries } from "./walkwayGeometry";

/** Every paved surface in the world — plazas and the path network — built from the layout. */
export function Walkways() {
  const items = useMemo(buildWalkwayGeometries, []);
  return (
    <group name="walkways">
      {items.map((it, i) => <mesh key={i} name="paving" geometry={it.geometry} material={materials.paving} receiveShadow />)}
    </group>
  );
}
