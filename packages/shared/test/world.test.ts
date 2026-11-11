import { test } from "node:test";
import assert from "node:assert/strict";
import {
  BUILDINGS, OBSTACLES, ZONES, MAIN_ISLAND, EDGE_MARGIN, DEFAULT_SPAWN, WALK_SPEED, AVATAR_RADIUS,
  isWalkable, stepMovement, pickSpawn, sanitizeName, sanitizeColor, groundHeight, overlapsObstacle,
} from "../src/index";

function rng(seed: number) {
  return () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 2 ** 32);
}

test("default spawn and all spawn slots are walkable", () => {
  assert.ok(isWalkable(DEFAULT_SPAWN.x, DEFAULT_SPAWN.z));
  for (let i = 0; i < 64; i++) {
    const p = pickSpawn(i);
    assert.ok(isWalkable(p.x, p.z), `spawn ${i} at ${p.x},${p.z}`);
  }
});

test("zone anchors (doorsteps) are reachable standing points", () => {
  for (const z of ZONES) assert.ok(isWalkable(z.anchor.x, z.anchor.z), `${z.id} anchor not walkable`);
});

test("walking off the cliff edge is impossible (fuzz, 200k steps)", () => {
  const r = rng(7);
  const pos = { x: DEFAULT_SPAWN.x, z: DEFAULT_SPAWN.z };
  let dirX = 0, dirZ = 1;
  for (let i = 0; i < 200_000; i++) {
    if (i % 25 === 0) {
      const a = r() * Math.PI * 2;
      dirX = Math.sin(a); dirZ = Math.cos(a);
    }
    stepMovement(pos, dirX * WALK_SPEED * 0.05, dirZ * WALK_SPEED * 0.05);
    assert.ok(isWalkable(pos.x, pos.z, AVATAR_RADIUS), `invalid at step ${i}: ${pos.x},${pos.z}`);
  }
});

test("a huge single step (teleport attempt) still ends on valid ground", () => {
  const pos = { x: 0, z: 8 };
  stepMovement(pos, 500, -300);
  assert.ok(isWalkable(pos.x, pos.z));
  pos.x = 9999; pos.z = -9999; // abnormal position
  stepMovement(pos, 0, 0);
  assert.ok(isWalkable(pos.x, pos.z));
});

test("avatars cannot enter buildings, tree or props", () => {
  const r = rng(3);
  for (const o of OBSTACLES) {
    for (let k = 0; k < 60; k++) {
      // start just outside and push straight at the obstacle centre
      const a = r() * Math.PI * 2;
      const rad = (o.kind === "circle" ? o.r : Math.max(o.hx, o.hz)) + 1.5;
      const pos = { x: o.x + Math.sin(a) * rad, z: o.z + Math.cos(a) * rad };
      if (!isWalkable(pos.x, pos.z)) continue;
      for (let i = 0; i < 120; i++) {
        stepMovement(pos, (o.x - pos.x) * 0.05, (o.z - pos.z) * 0.05);
        assert.ok(!overlapsObstacle(pos.x, pos.z, AVATAR_RADIUS - 1e-6), `${o.id} penetrated`);
      }
    }
  }
});

test("every zone is connected to spawn (grid flood-fill with real movement steps)", () => {
  const cell = 0.5;
  const key = (i: number, j: number) => `${i},${j}`;
  const seen = new Set<string>();
  const stack: [number, number][] = [[Math.round(DEFAULT_SPAWN.x / cell), Math.round(DEFAULT_SPAWN.z / cell)]];
  while (stack.length) {
    const [i, j] = stack.pop()!;
    const k = key(i, j);
    if (seen.has(k)) continue;
    if (!isWalkable(i * cell, j * cell)) continue;
    seen.add(k);
    stack.push([i + 1, j], [i - 1, j], [i, j + 1], [i, j - 1]);
  }
  for (const z of ZONES) {
    assert.ok(seen.has(key(Math.round(z.anchor.x / cell), Math.round(z.anchor.z / cell))), `${z.id} unreachable`);
  }
  // small island is reachable ONLY via the bridge: bridge corridor must be passable end to end
  assert.ok(seen.has(key(Math.round(36 / cell), 0)));
  for (let x = 18; x <= 38; x += cell) assert.ok(seen.has(key(Math.round(x / cell), 0)), `bridge gap at x=${x}`);
});

test("walking east along the bridge reaches the small island", () => {
  const pos = { x: 10, z: 0 };
  for (let i = 0; i < 400; i++) stepMovement(pos, WALK_SPEED * 0.05, 0);
  assert.ok(pos.x > 30, `stuck at ${pos.x}`);
});

test("bridge rejects walking off its sides", () => {
  const pos = { x: 24, z: 0 };
  for (let i = 0; i < 60; i++) stepMovement(pos, 0, WALK_SPEED * 0.05);
  assert.ok(Math.abs(pos.z) < 1.9, `fell off bridge side: z=${pos.z}`);
});

test("door-facing: every building doorstep is not blocked", () => {
  for (const b of Object.values(BUILDINGS)) {
    // 3.2m in front of the door along local +z
    const x = b.x + Math.sin(b.rot) * 5.2;
    const z = b.z + Math.cos(b.rot) * 5.2;
    assert.ok(isWalkable(x, z), `${b.id} doorstep blocked at ${x.toFixed(2)},${z.toFixed(2)}`);
  }
});

test("ground height: continuous bridge arch, flat elsewhere", () => {
  assert.equal(groundHeight(0, 8.5), 0);
  assert.ok(groundHeight(28, 0) > 0.5);
  assert.ok(groundHeight(22.3, 0) < 0.02);
  assert.ok(groundHeight(33.7, 0) < 0.02);
});

test("name / colour sanitising", () => {
  assert.equal(sanitizeName("  <b>Hi</b>  "), "bHi/b");
  assert.equal(sanitizeName(""), "Guest");
  assert.equal(sanitizeName(123 as unknown), "Guest");
  assert.equal(Array.from(sanitizeName("가".repeat(50))).length, 12);
  assert.equal(sanitizeColor(99), 0);
  assert.equal(sanitizeColor(2), 2);
  assert.equal(sanitizeColor("x"), 0);
});

test("layout: props never create pockets narrower than an avatar", () => {
  const br = (o: (typeof OBSTACLES)[number]) => (o.kind === "circle" ? o.r : Math.hypot(o.hx, o.hz));
  const need = AVATAR_RADIUS * 2 + 0.1;
  for (let i = 0; i < OBSTACLES.length; i++) {
    for (let j = i + 1; j < OBSTACLES.length; j++) {
      const a = OBSTACLES[i], b = OBSTACLES[j];
      const gap = Math.hypot(a.x - b.x, a.z - b.z) - br(a) - br(b);
      assert.ok(gap >= need, `${a.id} <-> ${b.id} gap ${gap.toFixed(2)}m`);
    }
  }
  // buildings keep a walkable lane behind them (no dead-end nooks against the cliff)
  const limit = MAIN_ISLAND.r - AVATAR_RADIUS - EDGE_MARGIN;
  for (const o of OBSTACLES) {
    if (o.id.startsWith("lamp") || o.id.startsWith("cottage") || o.id.startsWith("small")) continue;
    const reach = Math.hypot(o.x, o.z) + br(o);
    assert.ok(limit - reach >= need, `${o.id} too close to cliff: lane ${(limit - reach).toFixed(2)}m`);
  }
});
