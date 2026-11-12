import { describe, expect, it } from "vitest";
import { animFor, MOVE, settle, steer, worldDirection } from "../src/player/movement";
import { createPlayerState, snapshotOf } from "../src/player/state";

describe("movement rules", () => {
  it("W moves away from the camera, D to the camera's right", () => {
    // camera south of the player (yaw 0): forward is north (-z), right is east (+x)
    const close = (a: [number, number], b: [number, number]) => { expect(a[0]).toBeCloseTo(b[0]); expect(a[1]).toBeCloseTo(b[1]); };
    close(worldDirection({ forward: 1, right: 0, run: false }, 0), [0, -1]);
    close(worldDirection({ forward: 0, right: 1, run: false }, 0), [1, 0]);
    // camera east of the player (yaw 90°): forward is west
    const [x, z] = worldDirection({ forward: 1, right: 0, run: false }, Math.PI / 2);
    expect(x).toBeCloseTo(-1); expect(z).toBeCloseTo(0);
  });

  it("diagonal input is not faster than straight input", () => {
    const [x, z] = worldDirection({ forward: 1, right: 1, run: false }, 0.7);
    expect(Math.hypot(x, z)).toBeCloseTo(1);
  });

  it("speed is the same whatever the step size (frame-rate independent)", () => {
    const run = (dt: number) => {
      const s = createPlayerState(0, 0, 0, 0);
      let dist = 0;
      for (let t = 0; t < 3 - 1e-9; t += dt) { const [dx, dz] = steer(s, [1, 0], false, dt); dist += Math.hypot(dx, dz); }
      return dist;
    };
    expect(run(1 / 30)).toBeCloseTo(run(1 / 120), 0);
    expect(run(MOVE.fixedDt)).toBeGreaterThan(MOVE.walkSpeed * 3 * 0.9);
  });

  it("turns towards the move direction at a limited, smooth rate", () => {
    const s = createPlayerState(0, 0, 0, 0); // facing south
    const yaws: number[] = [];
    for (let i = 0; i < 30; i++) { steer(s, [0, -1], false, MOVE.fixedDt); yaws.push(s.yaw); } // asked to face north
    for (let i = 1; i < yaws.length; i++) expect(Math.abs(yaws[i] - yaws[i - 1])).toBeLessThanOrEqual(MOVE.turnSpeed * MOVE.fixedDt + 1e-9);
    expect(Math.abs(Math.cos(yaws[29]) + 1)).toBeLessThan(1e-6);
  });

  it("stops quickly when input is released", () => {
    const s = createPlayerState(0, 0, 0, 0);
    for (let i = 0; i < 60; i++) steer(s, [1, 0], false, MOVE.fixedDt);
    let t = 0;
    while (Math.hypot(s.vx, s.vz) > 0 && t < 2) { steer(s, [0, 0], false, MOVE.fixedDt); t += MOVE.fixedDt; }
    expect(t).toBeLessThan(0.5);
  });

  it("chooses idle / walk / run / turn animations", () => {
    expect(animFor(0, 0)).toBe("idle");
    expect(animFor(0, 4)).toBe("turn");
    expect(animFor(MOVE.walkSpeed, 0)).toBe("walk");
    expect(animFor(MOVE.runSpeed, 0)).toBe("run");
    const s = createPlayerState(0, 0, 0, 0);
    for (let i = 0; i < 60; i++) { steer(s, [1, 0], true, MOVE.fixedDt); settle(s, MOVE.runSpeed * MOVE.fixedDt, MOVE.fixedDt); }
    expect(s.anim).toBe("run");
  });

  it("network snapshot carries just what other clients need", () => {
    expect(Object.keys(snapshotOf(createPlayerState(1, 2, 3, 0))).sort()).toEqual(["anim", "speed", "x", "y", "yaw", "z"]);
  });
});
