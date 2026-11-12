/**
 * Snow surface height. Pure maths shared by the terrain mesh and by anything that has to sit on
 * the snow (fences, trees) so they always agree. Walkways and lots stay perfectly flat.
 */
import { fbm2, smoothstep } from "../common/noise";
import { distToBuilt, distToWalkway, islandOpenings, islandRadius, type IslandDef, type Opening } from "../layout";

const openingCache = new Map<string, Opening[]>();
const openingsOf = (id: string) => {
  let o = openingCache.get(id);
  if (!o) openingCache.set(id, (o = islandOpenings(id)));
  return o;
};

/** Height of the snow above the island's base level `def.y`. */
export function snowHeight(def: IslandDef, x: number, z: number) {
  const dx = x - def.center[0], dz = z - def.center[1];
  const r = Math.hypot(dx, dz);
  const theta = Math.atan2(dz, dx);
  const edge = islandRadius(def, theta);
  const u = r / edge;

  // 1 everywhere except in front of bridge landings / the dock, where the rim must stay level.
  let open = 1;
  for (const o of openingsOf(def.id)) {
    let d = Math.abs(theta - o.angle) % (Math.PI * 2);
    if (d > Math.PI) d = Math.PI * 2 - d;
    open = Math.min(open, smoothstep(o.halfWidth, o.halfWidth + 1.6, d * edge));
  }
  const built = distToBuilt(def.id, x, z);
  const clear = smoothstep(0.25, 1.6, distToWalkway(def.id, x, z));

  // Rounded snow bank along the cliff: a soft natural boundary under the fence.
  const bank = 0.5 * smoothstep(0.82, 0.95, u) * open * clear;
  // Gentle drifts in the decoration areas only.
  const drift = Math.max(0, fbm2(x * 0.085, z * 0.085, def.seed) - 0.34) * 1.9 * smoothstep(1.2, 5.5, built);
  // Low shoulder of shovelled snow beside paths.
  const shoulder = 0.1 * smoothstep(0.2, 0.9, built) * (1 - smoothstep(1.2, 3, built));
  // Scenery islets are small snowy knolls.
  const knoll = def.kind === "decor" ? 1.5 * (1 - smoothstep(0, 1, u)) : 0;
  return bank + drift * (1 - 0.5 * smoothstep(0.8, 1, u)) + shoulder + knoll;
}

/** Absolute world height of the snow. */
export const groundY = (def: IslandDef, x: number, z: number) => def.y + snowHeight(def, x, z);
