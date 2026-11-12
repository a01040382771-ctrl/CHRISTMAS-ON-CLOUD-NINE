/**
 * Browser E2E for Phase 2 (avatar, controls, follow camera, collision). Needs the dev server:
 *   npm run dev   (then)   npm run test:e2e
 * Uses dev-only hooks on window.__skyVillage. Runs on software WebGL, so it is slow but real.
 */
const { chromium } = require("playwright");
const WEB = process.env.WEB ?? "http://localhost:5173/";
const SPAWN_Z = 10.5; // src/world/collision/buildCollision.ts SPAWN
const ARGS = ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"];
let failed = 0;
const t0 = Date.now();
const check = (name, ok, extra = "") => { console.log(`[${((Date.now() - t0) / 1000).toFixed(0).padStart(3)}s] ${ok ? "PASS" : "FAIL"}  ${name} ${extra}`); if (!ok) failed++; };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const IGNORED = [/deprecated parameters for the initialization function/]; // emitted inside @react-three/rapier

async function open(browser, ctxOpts) {
  const ctx = await browser.newContext(ctxOpts);
  const page = await ctx.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => { if (m.type() === "error" && !IGNORED.some((r) => r.test(m.text()))) errors.push(m.text()); });
  await page.goto(WEB);
  await page.waitForFunction(() => window.__skyVillage?.player && window.__skyVillage.controls, null, { timeout: 120000 });
  await sleep(1500);
  return { ctx, page, errors };
}
const player = (page) => page.evaluate(() => { const p = window.__skyVillage.player, s = p.state, c = window.__skyVillage.camera.position; return { x: s.x, y: s.y, z: s.z, yaw: s.yaw, anim: s.anim, speed: s.speed, grounded: s.grounded, camYaw: p.cameraYaw, cam: { x: c.x, y: c.y, z: c.z } }; });
const teleport = (page, x, z, yaw) => page.evaluate(([x, z, yaw]) => window.__skyVillage.player.teleport(x, z, yaw), [x, z, yaw]);
/** Point the follow camera so that "forward" (W) walks along compass direction (dx, dz). */
const aim = async (page, dx, dz) => {
  await page.evaluate(([dx, dz]) => {
    const p = window.__skyVillage.player, want = Math.atan2(-dx, -dz);
    p.input.lookYaw += Math.atan2(Math.sin(want - p.cameraYaw), Math.cos(want - p.cameraYaw));
    p.input.lastLookAt = performance.now() + 600000; // suppress auto-recentre during the test
  }, [dx, dz]);
  // wait until the camera has applied it, so the first walking frame already uses the new heading
  await page.waitForFunction(() => window.__skyVillage.player.input.lookYaw === 0, null, { timeout: 20000 });
};
/** Poll the player state until `cond` holds (the sim can run far below real time on software WebGL). */
const waitPlayer = async (page, cond, timeout = 20000) => {
  const end = Date.now() + timeout;
  let q = await player(page);
  while (!cond(q) && Date.now() < end) { await sleep(200); q = await player(page); }
  return q;
};
const hold = async (page, keys, ms) => { for (const k of keys) await page.keyboard.down(k); await sleep(ms); for (const k of [...keys].reverse()) await page.keyboard.up(k); };

(async () => {
  const browser = await chromium.launch({ args: ARGS });

  // ───────────── desktop ─────────────
  const { ctx, page, errors } = await open(browser, { viewport: { width: 800, height: 520 }, deviceScaleFactor: 1 });
  let p = await player(page);
  check("avatar spawns on Starlight Plaza", Math.abs(p.x) < 0.2 && Math.abs(p.z - SPAWN_Z) < 0.2 && p.grounded, JSON.stringify({ x: p.x, y: p.y, z: p.z }));
  check("world view mode is the default (orbit controls active)", await page.evaluate(() => !!window.__skyVillage.controls));

  await page.click("button.explore");
  await sleep(2500);
  p = await player(page);
  check("explore mode: follow camera sits behind the avatar", p.cam.z > p.z + 2 && Math.hypot(p.cam.x - p.x, p.cam.z - p.z) < 17, JSON.stringify(p.cam));
  check("explore mode: orbit controls released", await page.evaluate(() => !window.__skyVillage.controls));

  // walk (camera-relative: W walks away from the camera, i.e. north here)
  await teleport(page, 0, 8.5, Math.PI); await aim(page, 1, 0); await sleep(600);
  let a = await player(page);
  await page.keyboard.down("KeyW");
  const mid = await waitPlayer(page, (q) => q.x - a.x > 1.5);
  await waitPlayer(page, (q) => q.x - a.x > 3); await page.keyboard.up("KeyW");
  let b = await player(page);
  check("W walks in the camera's forward direction", b.x - a.x > 2.5 && Math.abs(b.z - a.z) < 0.8, `Δx=${(b.x - a.x).toFixed(2)} Δz=${(b.z - a.z).toFixed(2)}`);
  check("walk animation and walk speed while moving", mid.anim === "walk" && mid.speed > 2.6 && mid.speed < 3.6, `${mid.anim} ${mid.speed.toFixed(2)} m/s`);
  check("avatar turned to face where it walks (east)", Math.abs(Math.sin(b.yaw) - 1) < 0.05, `yaw=${b.yaw.toFixed(2)}`);
  b = await waitPlayer(page, (q) => q.anim === "idle", 6000);
  check("releasing the key stops and returns to idle", b.anim === "idle" && b.speed < 0.2, `${b.anim} ${b.speed.toFixed(2)}`);

  // run
  await teleport(page, -11, -0.5, -Math.PI / 2); await aim(page, -1, 0); await sleep(500);
  a = await player(page);
  await page.keyboard.down("ShiftLeft"); await page.keyboard.down("KeyW");
  const run = await waitPlayer(page, (q) => a.x - q.x > 4);
  await page.keyboard.up("KeyW"); await page.keyboard.up("ShiftLeft");
  check("Shift runs (run animation, ~6.6 m/s)", run.anim === "run" && run.speed > 5.5, `${run.anim} ${run.speed.toFixed(2)} m/s`);

  // turning: from facing west, press D only → turns towards north smoothly
  await teleport(page, 0, 8.5, -Math.PI / 2); await aim(page, -1, 0); await sleep(500);
  await page.keyboard.down("KeyD");
  const turning = await waitPlayer(page, (q) => Math.abs(Math.cos(q.yaw) - 0) < 0.999 || q.anim !== "idle", 6000);
  const turned = await waitPlayer(page, (q) => q.z < 8.5 - 1.5);
  await page.keyboard.up("KeyD");
  const turnRate = await page.evaluate(() => window.__skyVillage.player.state.turnRate);
  check("turning is smooth, not instant (limited turn speed)", Math.abs(turnRate) <= 10.5, `turnRate=${turnRate.toFixed(2)} rad/s, first sample yaw=${turning.yaw.toFixed(2)}`);
  check("D turns and walks to the camera's right (north)", Math.abs(Math.cos(turned.yaw) + 1) < 0.1, `yaw=${turned.yaw.toFixed(2)}`);

  // camera: mouse drag and wheel
  const c0 = await player(page);
  await page.mouse.move(400, 260); await page.mouse.down();
  for (let i = 1; i <= 10; i++) { await page.mouse.move(400 + i * 18, 260); await sleep(30); }
  await page.mouse.up(); await sleep(500);
  const c1 = await player(page);
  check("mouse drag orbits the follow camera", Math.abs(Math.atan2(Math.sin(c1.camYaw - c0.camYaw), Math.cos(c1.camYaw - c0.camYaw))) > 0.4, `${c0.camYaw.toFixed(2)} → ${c1.camYaw.toFixed(2)}`);
  const dist = (q) => Math.hypot(q.cam.x - q.x, q.cam.y - q.y - 1.35, q.cam.z - q.z);
  for (let i = 0; i < 6; i++) { await page.mouse.wheel(0, 300); await sleep(60); }
  await sleep(900);
  const c2 = await player(page);
  check("mouse wheel changes the camera distance (and stays within limits)", dist(c2) > dist(c1) + 1 && dist(c2) <= 16.5, `${dist(c1).toFixed(1)} → ${dist(c2).toFixed(1)} m`);
  for (let i = 0; i < 6; i++) { await page.mouse.wheel(0, -300); await sleep(60); }
  await page.mouse.move(400, 260); await page.mouse.down();
  for (let i = 1; i <= 12; i++) { await page.mouse.move(400, 260 - i * 30); await sleep(30); }
  await page.mouse.up(); await sleep(800);
  const low = await player(page);
  const g = await page.evaluate(([x, z]) => window.__skyVillage.player.physicsGround(x, z), [low.cam.x, low.cam.z]);
  check("camera never goes below the ground", g === null || low.cam.y > g + 0.3, `cam y=${low.cam.y.toFixed(2)} ground=${g === null ? "none" : g.toFixed(2)}`);

  // collision: buildings
  const stall = await page.evaluate(() => {
    const L = window.__skyVillage.layout, lot = L.lots.find((l) => l.id === "market-stall-1"), d = L.lotDoor(lot), f = L.lotFront(lot);
    return [d[0] + f[0] * 2.4, d[1] + f[1] * 2.4, -f[0], -f[1]];
  });
  for (const [name, x, z, dx, dz] of [["Velvet Ballroom", 0, -16, 0, -1], ["Invitation House", -20.6, -5, -0.3, -1], ["a market stall", ...stall]]) {
    await teleport(page, x, z); await aim(page, dx, dz); await sleep(400);
    // walk for 8 m of simulated walking; a wall must stop the avatar well before that
    await page.keyboard.down("KeyW");
    let q = await player(page), last = q, still = 0;
    for (let i = 0; i < 80 && Math.hypot(q.x - x, q.z - z) < 7.5 && still < 4; i++) {
      await sleep(250); last = q; q = await player(page);
      still = Math.hypot(q.x - last.x, q.z - last.z) < 0.02 ? still + 1 : 0;
    }
    await page.keyboard.up("KeyW");
    check(`walls of ${name} stop the avatar`, Math.hypot(q.x - x, q.z - z) < 6, `stopped after ${Math.hypot(q.x - x, q.z - z).toFixed(2)} m at ${q.x.toFixed(2)},${q.z.toFixed(2)}`);
  }

  // bridges: cross each one with Shift+W
  const bridges = await page.evaluate(() => window.__skyVillage.layout.bridges.map((b) => ({ id: b.id, start: b.start, end: b.end, to: b.to.island })));
  for (const br of bridges) {
    const dx = br.end[0] - br.start[0], dz = br.end[2] - br.start[2], len = Math.hypot(dx, dz);
    await teleport(page, br.start[0] - (dx / len) * 2.5, br.start[2] - (dz / len) * 2.5);
    await aim(page, dx / len, dz / len); await sleep(400);
    const samples = [];
    await page.keyboard.down("ShiftLeft"); await page.keyboard.down("KeyW");
    const until = Date.now() + 60000;
    for (;;) {
      const q = await player(page);
      samples.push(q);
      const arrived = await page.evaluate(([x, z, id]) => window.__skyVillage.layout.islandU(id, x, z) < 0.8, [q.x, q.z, br.to]);
      if (arrived || Date.now() > until) break;
      await sleep(200);
    }
    await page.keyboard.up("KeyW"); await page.keyboard.up("ShiftLeft");
    await sleep(400);
    const q = await player(page);
    const onTarget = await page.evaluate(([x, z, id]) => window.__skyVillage.layout.islandU(id, x, z) < 0.95, [q.x, q.z, br.to]);
    const lowest = Math.min(...samples.map((s) => s.y));
    check(`crosses ${br.id} onto the next island`, onTarget && q.grounded, `end=${q.x.toFixed(1)},${q.y.toFixed(2)},${q.z.toFixed(1)} lowest y on the way=${lowest.toFixed(2)}`);
  }

  // safety: run at the cliff from the plaza, along the market street and on a satellite island
  for (const [x, z, dx, dz] of [[0, 18, 0.7, 0.7], [-20, 6, -0.6, 0.8], [30, 10, 0.5, 0.86]]) {
    await teleport(page, x, z); await aim(page, dx, dz); await sleep(300);
    await page.keyboard.down("ShiftLeft"); await page.keyboard.down("KeyW");
    let q = await player(page), last, still = 0;
    for (let i = 0; i < 120 && still < 4; i++) { await sleep(250); last = q; q = await player(page); still = Math.hypot(q.x - last.x, q.z - last.z) < 0.02 ? still + 1 : 0; }
    await page.keyboard.up("KeyW"); await page.keyboard.up("ShiftLeft");
    check(`fence stops a run towards the cliff (${dx},${dz})`, q.y > -1 && q.grounded, JSON.stringify({ x: +q.x.toFixed(1), y: +q.y.toFixed(2), z: +q.z.toFixed(1) }));
  }

  // fall-safety: a drop into the clouds returns the avatar to the start point
  await page.evaluate(() => { const p = window.__skyVillage.player; p.motor.teleport({ x: 0, y: 5, z: 70 }); });
  p = await waitPlayer(page, (q) => Math.hypot(q.x, q.z - SPAWN_Z) < 0.5 && q.grounded, 30000);
  check("falling off the world returns to the safe start point", Math.hypot(p.x, p.z - SPAWN_Z) < 0.5 && p.grounded, JSON.stringify({ x: p.x, y: p.y, z: p.z }));

  // respawn button
  await teleport(page, -20, -2);
  await page.click("text=시작 위치로"); await sleep(600);
  p = await player(page);
  check("'시작 위치로' button returns to the start point", Math.hypot(p.x, p.z - SPAWN_Z) < 0.3);

  // what you see is what you stand on
  const probe = await page.evaluate(() => {
    const THREE = window.__skyVillage.THREE, scene = window.__skyVillage.scene, L = window.__skyVillage.layout;
    const surfaces = [];
    scene.traverse((o) => { if (o.isMesh && ["snow", "paving", "deck", "foundation", "step"].includes(o.name)) surfaces.push(o); });
    const ray = new THREE.Raycaster(); ray.far = 200;
    const pts = [];
    for (const p of L.paths) for (let i = 0; i < p.points.length; i += 5) pts.push(p.points[i]);
    for (const b of L.bridges) for (let t = 0.05; t < 1; t += 0.1) { const q = L.bridgePoint(b, t); pts.push([q[0], q[2]]); }
    for (const l of L.lots) pts.push(l.center.map((v, i) => v + (i ? 0.01 : 0)));
    for (let x = -36; x <= 36; x += 6) for (let z = -30; z <= 30; z += 6) if (L.islandU("main", x, z) < 0.85) pts.push([x, z]);
    let worst = 0, worstAt = null, missing = 0, samples = 0;
    for (const [x, z] of pts) {
      const phys = window.__skyVillage.player.physicsGround(x, z);
      ray.set(new THREE.Vector3(x, 60, z), new THREE.Vector3(0, -1, 0));
      const hit = ray.intersectObjects(surfaces, false)[0];
      if (!hit || phys === null) { missing++; continue; }
      // buildings stand on the foundations: only compare surfaces you can stand on in the open
      const err = Math.abs(hit.point.y - phys);
      samples++;
      if (err > worst) { worst = err; worstAt = [x, z, hit.object.name, hit.point.y, phys]; }
    }
    return { worst, worstAt, missing, samples };
  });
  check("visible ground and physics ground agree (paths, plazas, bridges, foundations, snow)", probe.worst < 0.06 && probe.missing === 0, JSON.stringify(probe));

  // back to world view
  await page.click("text=월드 감상으로"); await sleep(2500);
  check("returning to world view restores the orbit camera", await page.evaluate(() => !!window.__skyVillage.controls));
  check("no page errors (desktop)", errors.length === 0, errors.join(" | "));
  await ctx.close();

  // ───────────── mobile (touch) ─────────────
  const m = await open(browser, { viewport: { width: 390, height: 760 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2, userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148" });
  const mp = m.page;
  await mp.click("button.explore"); await sleep(2500);
  check("joystick is shown on touch devices in explore mode", await mp.evaluate(() => !!document.querySelector(".joystick")));
  const cdp = await m.ctx.newCDPSession(mp);
  const touch = (type, pts) => cdp.send("Input.dispatchTouchEvent", { type, touchPoints: pts.map(([x, y], i) => ({ x, y, id: i + 1 })) });
  const jc = await mp.evaluate(() => { const r = document.querySelector(".joystick").getBoundingClientRect(); return [r.x + r.width / 2, r.y + r.height / 2]; });
  await aim(mp, 0, -1); await sleep(400);
  let s0 = await player(mp);
  await touch("touchStart", [jc]);
  await touch("touchMove", [[jc[0], jc[1] - 32]]);
  let s1 = await waitPlayer(mp, (q) => s0.z - q.z > 1.5);
  // while still walking, drag the camera with a second finger on the right
  await touch("touchMove", [[jc[0], jc[1] - 32], [300, 300]]);
  for (let i = 1; i <= 8; i++) { await touch("touchMove", [[jc[0], jc[1] - 32], [300 - i * 14, 300]]); await sleep(40); }
  const s2 = await waitPlayer(mp, (q) => Math.abs(q.camYaw - s1.camYaw) > 0.3 && Math.hypot(q.x - s1.x, q.z - s1.z) > 0.3, 8000);
  await touch("touchEnd", []);
  const s3 = await waitPlayer(mp, (q) => q.anim === "idle", 8000);
  check("joystick walks the avatar forward", s0.z - s1.z > 1.5 && s1.anim === "walk", `Δz=${(s1.z - s0.z).toFixed(2)} ${s1.anim}`);
  check("second finger turns the camera while the joystick is held", Math.abs(s2.camYaw - s1.camYaw) > 0.3 && Math.hypot(s2.x - s1.x, s2.z - s1.z) > 0.3, `camYaw ${s1.camYaw.toFixed(2)} → ${s2.camYaw.toFixed(2)}`);
  check("releasing the joystick stops the avatar", s3.anim === "idle");
  await touch("touchStart", [jc]); await touch("touchMove", [[jc[0], jc[1] - 70]]);
  const s4 = await waitPlayer(mp, (q) => q.anim === "run", 10000); await touch("touchEnd", []);
  check("pushing the joystick to the rim runs", s4.anim === "run", `${s4.anim} ${s4.speed.toFixed(2)}`);
  const scroll = await mp.evaluate(() => ({ x: window.scrollX, y: window.scrollY, over: document.documentElement.scrollWidth > innerWidth || document.documentElement.scrollHeight > innerHeight }));
  check("touch controls never scroll the page", scroll.x === 0 && scroll.y === 0 && !scroll.over, JSON.stringify(scroll));
  await mp.screenshot({ path: process.env.SHOT_DIR ? `${process.env.SHOT_DIR}/e2e-mobile.png` : "/dev/null" }).catch(() => {});
  check("no page errors (mobile)", m.errors.length === 0, m.errors.join(" | "));

  await browser.close();
  console.log(failed ? `\n${failed} FAILED` : "\nALL PASSED");
  process.exit(failed ? 1 : 0);
})();
