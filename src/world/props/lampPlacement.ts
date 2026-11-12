import { bridges, distToBuilt, island, islandU, paths, plazas, SURFACE_LIFT } from "../layout";
import type { LampSpot } from "./LampPosts";

/**
 * Lamp positions are derived from the layout: a ring around Starlight Plaza, alternating sides
 * along avenues and walks, and a pair at each bridge landing. Lamps always stand just off the
 * paving, never on it.
 */
function build(): LampSpot[] {
  const spots: LampSpot[] = [];
  const push = (islandId: string, x: number, z: number) => {
    const def = island(islandId);
    if (islandU(def, x, z) > 0.93) return;
    if (distToBuilt(islandId, x, z) < 0.35) return;
    if (spots.some((s) => Math.hypot(s.x - x, s.z - z) < 3)) return;
    spots.push({ x, y: def.y + SURFACE_LIFT, z });
  };

  // ring around the central plaza, between the five exits
  const plaza = plazas[0];
  for (const deg of [38, 142, 216, 246, 297, 337]) {
    const a = (deg * Math.PI) / 180;
    push(plaza.island, plaza.center[0] + Math.cos(a) * (plaza.radius + 0.7), plaza.center[1] + Math.sin(a) * (plaza.radius + 0.7));
  }
  // along the paths
  for (const p of paths) {
    if (p.kind === "apron") continue;
    const every = 9;
    let side = 1;
    for (let d = 4.5; d < p.length - 2; d += every) {
      const i = Math.min(p.points.length - 2, Math.round((d / p.length) * (p.points.length - 1)));
      const a = p.points[i], b = p.points[i + 1];
      const len = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
      const nx = -(b[1] - a[1]) / len, nz = (b[0] - a[0]) / len;
      const off = (p.width / 2 + 0.7) * side;
      push(p.island, a[0] + nx * off, a[1] + nz * off);
      side = -side;
    }
  }
  // gate lamps at both ends of every bridge
  for (const b of bridges) {
    const dx = b.end[0] - b.start[0], dz = b.end[2] - b.start[2];
    const len = Math.hypot(dx, dz);
    const nx = -dz / len, nz = dx / len;
    for (const [end, islandId, back] of [[b.start, b.from.island, -1.6], [b.end, b.to.island, 1.6]] as const) {
      for (const s of [-1, 1]) {
        const x = end[0] + (dx / len) * back + nx * (b.width / 2 + 0.9) * s;
        const z = end[2] + (dz / len) * back + nz * (b.width / 2 + 0.9) * s;
        const def = island(islandId);
        if (distToBuilt(islandId, x, z) > 0.2) spots.push({ x, y: def.y + SURFACE_LIFT, z });
      }
    }
  }
  return spots;
}

export const lampSpots = build();
