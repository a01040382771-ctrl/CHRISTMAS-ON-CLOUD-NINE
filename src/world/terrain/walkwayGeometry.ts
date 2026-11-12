import { island, paths, plazas, SURFACE_LIFT, type PathKind } from "../layout";
import { buildPathGeometry, buildPlazaGeometry } from "./pavingGeometry";

/** Small height steps keep overlapping surfaces from z-fighting: plazas sit on top of paths. */
const LAYER: Record<PathKind, number> = { apron: -0.02, walk: -0.012, avenue: -0.006 };

/** Every paved surface (paths, then plazas), tagged with its island. Drawn by Walkways and used as walkable collision. */
export function buildWalkwayGeometries() {
  return [
    ...paths.map((p, i) => ({ island: p.island, geometry: buildPathGeometry(p, island(p.island).y + SURFACE_LIFT + LAYER[p.kind] - i * 0.0008, 100 + i) })),
    ...plazas.map((p, i) => ({ island: p.island, geometry: buildPlazaGeometry(p, island(p.island).y + SURFACE_LIFT + 0.004, 500 + i) })),
  ];
}
