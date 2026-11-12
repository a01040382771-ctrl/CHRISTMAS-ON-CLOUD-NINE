import { describe, expect, it } from "vitest";
import { scale } from "../src/design/scale";
import {
  bridgeMaxSlopeDeg, bridges, distToWalkway, dockFrame, docks, GATE_INSET, island, islandRadius, islands, islandU,
  isWalkable, lotDoor, lots, paths, plazas, zones, type LotDef, type Vec2,
} from "../src/world/layout";
import { treeSpots } from "../src/world/environment/scatter";
import { lampSpots } from "../src/world/props/lampPlacement";

/** Corner points (and edge mid-points) of a lot footprint in world space. */
function lotOutline(lot: LotDef): Vec2[] {
  const [w, d] = lot.size;
  if (lot.shape === "round") return Array.from({ length: 16 }, (_, i) => [lot.center[0] + Math.cos(i * 0.3927) * w / 2, lot.center[1] + Math.sin(i * 0.3927) * w / 2] as Vec2);
  const c = Math.cos(lot.rotation), s = Math.sin(lot.rotation);
  const pts: Vec2[] = [];
  for (const lx of [-0.5, 0, 0.5]) for (const lz of [-0.5, 0, 0.5]) {
    if (lx === 0 && lz === 0) continue;
    pts.push([lot.center[0] + lx * w * c + lz * d * s, lot.center[1] - lx * w * s + lz * d * c]);
  }
  return pts;
}

const cliffDistance = (islandId: string, [x, z]: Vec2) => {
  const def = island(islandId);
  return (1 - islandU(def, x, z)) * islandRadius(def, Math.atan2(z - def.center[1], x - def.center[0]));
};

describe("islands and bridges", () => {
  it("bridged islands never overlap", () => {
    const solid = islands.filter((i) => i.kind !== "decor");
    for (const a of solid) for (const b of solid) {
      if (a.id >= b.id) continue;
      const gap = Math.hypot(a.center[0] - b.center[0], a.center[1] - b.center[1]) - Math.max(a.radiusX, a.radiusZ) - Math.max(b.radiusX, b.radiusZ);
      expect(gap, `${a.id} ↔ ${b.id}`).toBeGreaterThan(4);
    }
  });

  it("every bridge lands on solid ground on both islands", () => {
    for (const b of bridges) {
      for (const [end, id] of [[b.start, b.from.island], [b.end, b.to.island]] as const) {
        const u = islandU(island(id), end[0], end[2]);
        expect(u, `${b.id} @ ${id}`).toBeCloseTo(GATE_INSET, 3);
        expect(end[1], `${b.id} height @ ${id}`).toBeCloseTo(island(id).y, 0);
      }
    }
  });

  it("bridge decks keep a walkable slope and width", () => {
    for (const b of bridges) {
      expect(bridgeMaxSlopeDeg(b), b.id).toBeLessThanOrEqual(scale.maxWalkSlopeDeg);
      expect(b.width, b.id).toBeGreaterThanOrEqual(scale.pathMin);
      expect(b.length, b.id).toBeGreaterThan(8);
    }
  });
});

describe("walkways", () => {
  it("paths are wide enough for avatars to pass each other", () => {
    for (const p of paths) expect(p.width, p.id).toBeGreaterThanOrEqual(scale.pathMin);
  });

  it("paths and plazas stay on their island", () => {
    for (const p of paths) for (const [x, z] of p.points) expect(islandU(island(p.island), x, z), p.id).toBeLessThanOrEqual(1);
    for (const p of plazas) expect(cliffDistance(p.island, p.center) - p.radius, p.id).toBeGreaterThan(1.5);
  });

  it("the whole walking network is connected: every zone can be reached from the arrival deck", () => {
    const cell = 0.5;
    const key = (ix: number, iz: number) => `${ix},${iz}`;
    const start = dockFrame(docks[0]).center;
    const seen = new Set<string>();
    const queue: [number, number][] = [[Math.round(start[0] / cell), Math.round(start[1] / cell)]];
    seen.add(key(queue[0][0], queue[0][1]));
    while (queue.length) {
      const [ix, iz] = queue.pop()!;
      for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = ix + dx, nz = iz + dz, k = key(nx, nz);
        if (seen.has(k) || !isWalkable(nx * cell, nz * cell)) continue;
        seen.add(k);
        queue.push([nx, nz]);
      }
    }
    const reached = ([x, z]: Vec2) => seen.has(key(Math.round(x / cell), Math.round(z / cell)));
    for (const p of plazas) expect(reached(p.center), `plaza ${p.id}`).toBe(true);
    for (const b of bridges) {
      expect(reached([b.start[0], b.start[2]]), `${b.id} start`).toBe(true);
      expect(reached([b.end[0], b.end[2]]), `${b.id} end`).toBe(true);
    }
  });
});

describe("building lots", () => {
  const buildings = lots.filter((l) => l.shape === "rect");

  it("lots keep a safe margin from the cliff", () => {
    for (const lot of lots) for (const p of lotOutline(lot)) expect(cliffDistance(lot.island, p), lot.id).toBeGreaterThanOrEqual(scale.cliffMargin);
  });

  it("lots never overlap each other", () => {
    for (const a of lots) for (const b of lots) {
      if (a.id >= b.id || a.island !== b.island) continue;
      const reach = (l: LotDef) => Math.hypot(l.size[0], l.size[1]) / 2;
      const centers = Math.hypot(a.center[0] - b.center[0], a.center[1] - b.center[1]);
      // conservative: bounding circles of neighbouring lots must not intersect unless both are tiny stalls in a row
      if (centers < reach(a) + reach(b)) {
        for (const p of lotOutline(a)) {
          const dx = p[0] - b.center[0], dz = p[1] - b.center[1];
          const c = Math.cos(b.rotation), s = Math.sin(b.rotation);
          const inside = Math.abs(dx * c - dz * s) < b.size[0] / 2 && Math.abs(dx * s + dz * c) < b.size[1] / 2;
          expect(inside, `${a.id} overlaps ${b.id}`).toBe(false);
        }
      }
    }
  });

  it("buildings do not sit on a walkway", () => {
    for (const lot of buildings) for (const p of lotOutline(lot)) {
      const door = lotDoor(lot);
      if (Math.hypot(p[0] - door[0], p[1] - door[1]) < 0.01) continue; // the door edge touches its path by design
      expect(distToWalkway(lot.island, p[0], p[1]), lot.id).toBeGreaterThan(0.3);
    }
  });

  it("every building door opens onto a path or plaza", () => {
    for (const lot of buildings) {
      const [dx, dz] = lotDoor(lot);
      const fx = Math.sin(lot.rotation), fz = Math.cos(lot.rotation);
      // one avatar-width in front of the door must already be paved
      expect(isWalkable(dx + fx * scale.avatarWidth, dz + fz * scale.avatarWidth), lot.id).toBe(true);
    }
  });

  it("every zone has a place in the world", () => {
    expect(zones.map((z) => z.index)).toEqual([1, 2, 3, 4, 5, 6, 7]);
    for (const z of zones.filter((z) => z.id !== "starlight-plaza")) expect(lots.some((l) => l.zone === z.id), z.id).toBe(true);
  });
});

describe("decoration", () => {
  it("trees stand in decoration areas only — never on a walkway or lot, never past the fence", () => {
    expect(treeSpots.length).toBeGreaterThan(80);
    for (const t of treeSpots) {
      const def = islands.find((i) => islandU(i, t.x, t.z) <= 1)!;
      expect(def, "tree floats in mid-air").toBeDefined();
      if (def.kind !== "decor") expect(distToWalkway(def.id, t.x, t.z)).toBeGreaterThan(1.55 * t.scale);
    }
  });

  it("lamps stand beside the paving, not on it", () => {
    expect(lampSpots.length).toBeGreaterThan(20);
    for (const l of lampSpots) expect(isWalkable(l.x, l.z)).toBe(false);
  });
});
