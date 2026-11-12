/**
 * Walks the real Rapier character through the real collision world (the same shapes the browser
 * uses) with the same movement code — headless, deterministic.
 */
import RAPIER from "@dimforge/rapier3d-compat";
import { beforeAll, describe, expect, it } from "vitest";
import { CharacterMotor, groundAt } from "../src/physics/CharacterMotor";
import { createStaticColliders } from "../src/physics/staticColliders";
import { MOVE, settle, steer } from "../src/player/movement";
import { createPlayerState, type PlayerState } from "../src/player/state";
import { buildCollision, lotToWorld, SPAWN } from "../src/world/collision/buildCollision";
import { bridgePoint, bridges, docks, dockFrame, island, islands, islandU, lotDoor, lots, paths, type Vec2 } from "../src/world/layout";

let world: RAPIER.World;
let motor: CharacterMotor;
let state: PlayerState;
const dt = MOVE.fixedDt;

beforeAll(async () => {
  await RAPIER.init();
  world = new RAPIER.World({ x: 0, y: -9.81, z: 0 });
  createStaticColliders(RAPIER, world, buildCollision());
  world.step(); // builds the query pipeline
  motor = new CharacterMotor(RAPIER, world, { x: SPAWN.position[0], y: SPAWN.position[1], z: SPAWN.position[2] });
  state = createPlayerState(...SPAWN.position, SPAWN.yaw);
});

function tick(dir: [number, number], run = false) {
  const [dx, dz] = steer(state, dir, run, dt);
  const travelled = motor.step(dx, dz, dt);
  settle(state, travelled, dt);
  state.x = motor.position.x; state.y = motor.position.y; state.z = motor.position.z;
}
function place(x: number, z: number, y?: number) {
  const g = y ?? groundAt(RAPIER, world, x, z) ?? 0;
  motor.teleport({ x, y: g + 0.05, z });
  Object.assign(state, { x, y: g, z, vx: 0, vz: 0, speed: 0 });
  for (let i = 0; i < 20; i++) tick([0, 0]);
}
/** Steer towards a target; returns true if reached within `seconds`. */
function walkTo(x: number, z: number, seconds = 30, run = false, tol = 0.6) {
  for (let i = 0; i < seconds / dt; i++) {
    const dx = x - motor.position.x, dz = z - motor.position.z, d = Math.hypot(dx, dz);
    if (d < tol) return true;
    tick([dx / d, dz / d], run);
    if (motor.position.y < -30) return false;
  }
  return false;
}
const pos = () => ({ ...motor.position });

describe("character on the collision world", () => {
  it("spawns standing on the plaza paving", () => {
    place(SPAWN.position[0], SPAWN.position[2]);
    expect(motor.grounded).toBe(true);
    expect(Math.abs(motor.position.y - SPAWN.position[1])).toBeLessThan(0.08);
  });

  it("walks at the configured walk and run speeds, independent of frame count", () => {
    place(0, 8.5);
    for (let i = 0; i < 30; i++) tick([1, 0]);
    let x0 = motor.position.x;
    for (let i = 0; i < 60; i++) tick([1, 0]);
    expect(motor.position.x - x0).toBeCloseTo(MOVE.walkSpeed, 0);
    place(0, 8.5);
    for (let i = 0; i < 30; i++) tick([1, 0], true);
    x0 = motor.position.x;
    for (let i = 0; i < 30; i++) tick([1, 0], true);
    expect((motor.position.x - x0) * 2).toBeGreaterThan(MOVE.runSpeed * 0.9);
    expect(state.anim).toBe("run");
  });

  it("cannot walk through the great tree's planter", () => {
    place(0, 8.5);
    walkTo(0, 0, 6);  // (8.5: a point on the plaza in front of the tree)
    expect(Math.hypot(motor.position.x, motor.position.z)).toBeGreaterThan(4.72 + 0.25);
    expect(state.anim).toBe("idle"); // pushing against it does not play the walk cycle
  });

  it("is stopped by every building wall", () => {
    for (const lot of lots) {
      if (lot.shape === "round") continue;
      const door = lotDoor(lot);
      const fx = Math.sin(lot.rotation), fz = Math.cos(lot.rotation);
      place(door[0] + fx * 2.5, door[1] + fz * 2.5);
      walkTo(lot.center[0], lot.center[1], 6);
      const [lx, lz] = (() => { // back to lot-local to check we are outside the solid core
        const dx = motor.position.x - lot.center[0], dz = motor.position.z - lot.center[1];
        const c = Math.cos(lot.rotation), s = Math.sin(lot.rotation);
        return [dx * c - dz * s, dx * s + dz * c];
      })();
      const insideCore = Math.abs(lx) < lot.size[0] * 0.2 && Math.abs(lz) < lot.size[1] * 0.2;
      expect(insideCore, lot.id).toBe(false);
    }
  });

  it("reaches the door of every building from its path", () => {
    for (const lot of lots.filter((l) => l.shape === "rect")) {
      const door = lotDoor(lot);
      const fx = Math.sin(lot.rotation), fz = Math.cos(lot.rotation);
      place(door[0] + fx * 3, door[1] + fz * 3);
      expect(walkTo(door[0] + fx * 0.2, door[1] + fz * 0.2, 6, false, 0.75), lot.id).toBe(true);
    }
  });

  it("can walk the full length of every path in both directions", () => {
    for (const p of paths) {
      for (const pts of [p.points, [...p.points].reverse()]) {
        place(pts[0][0], pts[0][1]);
        let ok = true;
        for (let i = 4; i < pts.length; i += 4) if (!walkTo(pts[i][0], pts[i][1], 6, false, 0.9)) { ok = false; break; }
        ok = ok && walkTo(pts[pts.length - 1][0], pts[pts.length - 1][1], 6, false, 0.9);
        expect(ok, `${p.id} stuck at ${JSON.stringify(pos())}`).toBe(true);
      }
    }
  });

  it("crosses every bridge both ways, on the deck surface", () => {
    for (const b of bridges) {
      for (const [from, to] of [[0, 1], [1, 0]]) {
        const a = bridgePoint(b, from === 0 ? -0.03 : 1.03), z = bridgePoint(b, to);
        place(a[0], a[2]);
        let maxDeckError = 0;
        for (let i = 1; i <= 20; i++) {
          const t = from + (to - from) * (i / 20), p = bridgePoint(b, t);
          expect(walkTo(p[0], p[2], 6, true, 0.7), `${b.id} ${from}->${to} at t=${t.toFixed(2)}`).toBe(true);
          const bx = b.end[0] - b.start[0], bz = b.end[2] - b.start[2];
          const u = ((motor.position.x - b.start[0]) * bx + (motor.position.z - b.start[2]) * bz) / (bx * bx + bz * bz);
          if (u > 0.05 && u < 0.95) maxDeckError = Math.max(maxDeckError, Math.abs(motor.position.y - bridgePoint(b, u)[1]));
        }
        expect(maxDeckError, `${b.id} feet vs visible deck`).toBeLessThan(0.12);
        expect(Math.hypot(motor.position.x - z[0], motor.position.z - z[2])).toBeLessThan(1);
      }
    }
  });

  it("the cliff fences, railings and deck railing keep you on solid ground", () => {
    const solid = islands.filter((i) => i.kind !== "decor");
    const starts: Vec2[] = [[0, 8.5], [-20, -2], [20, 2], [0, 25], ...bridges.map((b) => { const p = bridgePoint(b, 0.5); return [p[0], p[2]] as Vec2; }), dockFrame(docks[0]).center];
    for (const def of solid.filter((d) => d.id !== "main")) starts.push([def.center[0] + 1, def.center[1] + 1]);
    for (const s of starts) {
      for (let k = 0; k < 16; k++) {
        place(s[0], s[1]);
        const a = (k / 16) * Math.PI * 2;
        for (let i = 0; i < 9 / dt; i++) tick([Math.cos(a), Math.sin(a)], true);
        const p = pos();
        expect(p.y, `fell from ${s} heading ${k}`).toBeGreaterThan(-3);
        const on = solid.some((d) => islandU(d, p.x, p.z) < 0.995) || bridges.some((b) => {
          const ax = b.start[0], az = b.start[2], bx = b.end[0] - ax, bz = b.end[2] - az;
          const u = Math.max(0, Math.min(1, ((p.x - ax) * bx + (p.z - az) * bz) / (bx * bx + bz * bz)));
          return Math.hypot(p.x - ax - bx * u, p.z - az - bz * u) < b.width / 2;
        }) || Math.hypot(p.x - dockFrame(docks[0]).center[0], p.z - dockFrame(docks[0]).center[1]) < 6;
        expect(on, `left the walkable world from ${s} heading ${k}: ${JSON.stringify(p)}`).toBe(true);
      }
    }
  }, 120_000);

  it("climbs the gazebo steps and walks between its columns", () => {
    const g = lots.find((l) => l.id === "moonlit-gazebo")!;
    const [ox, oz] = lotToWorld(g, 0, 5);
    place(ox, oz);
    const ok = walkTo(g.center[0], g.center[1], 8, false, 0.5);
    expect(ok, `stuck at ${JSON.stringify(pos())}, gazebo at ${g.center}`).toBe(true);
    expect(motor.position.y).toBeGreaterThan(island("terrace").y + 0.4);
  });

  it("climbs a step even when moving slowly (half-pushed joystick)", () => {
    const g = lots.find((l) => l.id === "moonlit-gazebo")!;
    const [ox, oz] = lotToWorld(g, 0, 5);
    place(ox, oz);
    for (let i = 0; i < 6 / dt; i++) {
      const dx = g.center[0] - motor.position.x, dz = g.center[1] - motor.position.z, d = Math.hypot(dx, dz);
      if (d < 0.5) break;
      tick([(dx / d) * 0.35, (dz / d) * 0.35]);
    }
    expect(Math.hypot(g.center[0] - motor.position.x, g.center[1] - motor.position.z)).toBeLessThan(0.6);
  });
});
