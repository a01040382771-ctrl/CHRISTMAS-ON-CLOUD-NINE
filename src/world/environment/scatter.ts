import { mulberry32 } from "../common/noise";
import { distToBuilt, island, islandPoint, islandRadius, islandU } from "../layout";
import { groundY } from "../terrain/ground";

export interface TreeSpot { x: number; y: number; z: number; scale: number; rotation: number }

interface Rule { island: string; count: number; size: [number, number]; seed: number; /** how tightly crowns may pack: 1 = just touching */ packing: number }

/** Crown radius of a pine at scale 1 (see props/Pines.tsx). */
const CROWN = 1.55;

/** Decoration areas only: trees never stand on a walkway, a lot, or the cliff bank. */
const rules: Rule[] = [
  { island: "main", count: 34, size: [0.75, 1.25], seed: 5, packing: 1.25 },
  { island: "garden", count: 9, size: [0.7, 1.05], seed: 6, packing: 1.3 },
  { island: "forest", count: 44, size: [0.85, 1.6], seed: 7, packing: 0.8 },
  { island: "terrace", count: 4, size: [0.6, 0.85], seed: 8, packing: 1.3 },
  { island: "islet-northwest", count: 5, size: [0.8, 1.2], seed: 9, packing: 0.9 },
  { island: "islet-east", count: 4, size: [0.7, 1.1], seed: 10, packing: 0.9 },
  { island: "islet-southwest", count: 3, size: [0.7, 1], seed: 12, packing: 0.9 },
];

function scatter(rule: Rule): TreeSpot[] {
  const def = island(rule.island);
  const rnd = mulberry32(rule.seed * 7919);
  const out: TreeSpot[] = [];
  for (let tries = 0; tries < 6000 && out.length < rule.count; tries++) {
    const angle = rnd() * Math.PI * 2;
    const [x, z] = islandPoint(def, angle, Math.sqrt(rnd()) * 0.86);
    // keep the view from the default camera into the plaza open: only small trees in the front
    const front = def.kind === "main" && z > 8;
    const s = rule.size[0] + rnd() * (rule.size[1] - rule.size[0]) * (front ? 0.35 : 1);
    const crown = CROWN * s;
    // the whole crown stays inside the fence line and off every walkway and lot
    if ((1 - islandU(def, x, z)) * islandRadius(def, angle) < crown + (def.kind === "decor" ? 0.6 : 0.105 * islandRadius(def, angle))) continue;
    if (distToBuilt(def.id, x, z) < crown + 0.5) continue;
    if (out.some((t) => Math.hypot(t.x - x, t.z - z) < (crown + CROWN * t.scale) * rule.packing)) continue;
    out.push({ x, y: groundY(def, x, z) - 0.05, z, scale: s, rotation: rnd() * Math.PI * 2 });
  }
  return out;
}

export const treeSpots: TreeSpot[] = rules.flatMap(scatter);
