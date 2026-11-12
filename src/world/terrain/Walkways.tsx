import { useMemo } from "react";
import { materials } from "../../design";
import { island, paths, plazas, SURFACE_LIFT, type PathKind } from "../layout";
import { buildPathGeometry, buildPlazaGeometry } from "./pavingGeometry";

/** Small height steps keep overlapping surfaces from z-fighting: plazas sit on top of paths. */
const LAYER: Record<PathKind, number> = { apron: -0.02, walk: -0.012, avenue: -0.006 };

/** Every paved surface in the world — plazas and the path network — built from the layout. */
export function Walkways() {
  const geometries = useMemo(
    () => [
      ...paths.map((p, i) => buildPathGeometry(p, island(p.island).y + SURFACE_LIFT + LAYER[p.kind] - i * 0.0008, 100 + i)),
      ...plazas.map((p, i) => buildPlazaGeometry(p, island(p.island).y + SURFACE_LIFT + 0.004, 500 + i)),
    ],
    [],
  );
  return (
    <group name="walkways">
      {geometries.map((g, i) => <mesh key={i} geometry={g} material={materials.paving} receiveShadow />)}
    </group>
  );
}
