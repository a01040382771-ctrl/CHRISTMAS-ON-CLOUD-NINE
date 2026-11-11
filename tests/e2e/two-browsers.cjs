/**
 * Browser E2E: two (then three) independent browser contexts join the same party room.
 *
 * Requires: server (npm run dev:server) and web (npm run dev:web) running, and Playwright
 * with Chromium available (`npm i -D playwright` or a preinstalled one).
 *   node tests/e2e/two-browsers.cjs
 */
const { chromium } = require("playwright");
const WEB = process.env.WEB ?? "http://localhost:5173";
let failed = 0;
const check = (name, ok, extra = "") => { console.log(`${ok ? "PASS" : "FAIL"}  ${name} ${extra}`); if (!ok) failed++; };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function open(browser, name, url = `${WEB}/?q=low`) {
  const ctx = await browser.newContext({ viewport: { width: 220, height: 130 }, permissions: ["clipboard-read", "clipboard-write"] });
  const page = await ctx.newPage();
  page.errors = [];
  page.on("pageerror", (e) => page.errors.push(e.message));
  await page.goto(url, { waitUntil: "load" });
  await page.fill("input", name);
  await page.press("input", "Enter");
  await page.waitForFunction(() => window.__sky && window.__sky.player.ready, null, { timeout: 90000 });
  return page;
}
const me = (p) => p.evaluate(() => ({ x: window.__sky.player.x, z: window.__sky.player.z }));
const seen = (p) => p.evaluate(() => window.__sky.remotes().map((r) => ({ id: r.id, name: r.name, x: r.last.x, z: r.last.z })));
const clickText = (p, t) => p.evaluate((t) => [...document.querySelectorAll("button")].find((b) => b.textContent.includes(t)).click(), t);
const hud = (p) => p.evaluate(() => document.querySelector(".pill")?.innerText.replace(/\s+/g, " ") ?? "");

(async () => {
  const browser = await chromium.launch({ args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] });
  const A = await open(browser, "Alice");
  const B = await open(browser, "Bob");
  await sleep(1500);

  const roomA = await A.evaluate(() => window.__sky.roomId());
  const roomB = await B.evaluate(() => window.__sky.roomId());
  check("both browsers are in the same party room", roomA && roomA === roomB, roomA);
  check("A sees exactly one other avatar (Bob)", (await seen(A)).length === 1 && (await seen(A))[0].name === "Bob");
  check("B sees exactly one other avatar (Alice)", (await seen(B)).length === 1 && (await seen(B))[0].name === "Alice");
  check("HUD shows online + 2/16", /온라인.*2\/16/.test(await hud(A)), await hud(A));

  // --- A walks east with the keyboard; B must see it ---
  const a0 = await me(A);
  await A.keyboard.down("d");
  await sleep(2500);
  await A.keyboard.up("d");
  await sleep(1800);
  const a1 = await me(A);
  const aOnB = (await seen(B))[0];
  check("A moved east with D", a1.x - a0.x > 3, `Δx=${(a1.x - a0.x).toFixed(2)}`);
  check("B sees A at the same place (<1.2 m)", Math.hypot(aOnB.x - a1.x, aOnB.z - a1.z) < 1.2, `A=(${a1.x.toFixed(1)},${a1.z.toFixed(1)}) seen=(${aOnB.x.toFixed(1)},${aOnB.z.toFixed(1)})`);

  // --- B walks north (W) toward the tree; collision must hold ---
  await B.evaluate(() => window.__sky.teleport(0, 8));
  await sleep(800);
  await B.keyboard.down("w");
  let minTree = Infinity;
  for (let i = 0; i < 28; i++) {
    await sleep(150);
    const p = await me(B);
    minTree = Math.min(minTree, Math.hypot(p.x - 0, p.z - 0.5));
  }
  await B.keyboard.up("w");
  await sleep(1500);
  const b1 = await me(B);
  check("walking straight into the tree never enters it (min dist ≥ 2.69)", minTree >= 2.69, `min d=${minTree.toFixed(2)}`);
  const bOnA = (await seen(A))[0];
  check("A sees B stopped at the tree too (<1.2 m)", Math.hypot(bOnA.x - b1.x, bOnA.z - b1.z) < 1.2, `B=(${b1.x.toFixed(1)},${b1.z.toFixed(1)}) seen=(${bOnA.x.toFixed(1)},${bOnA.z.toFixed(1)})`);

  // --- cliff: A runs south for a while ---
  await A.evaluate(() => window.__sky.teleport(0, 15));
  await sleep(800);
  await A.keyboard.down("s"); // S = backwards in camera space → toward camera = +z (south)
  await sleep(4000);
  await A.keyboard.up("s");
  const a2 = await me(A);
  check("cliff edge holds (r ≤ 22.25)", Math.hypot(a2.x, a2.z) <= 22.26, `r=${Math.hypot(a2.x, a2.z).toFixed(2)}`);

  // --- bridge: B walks east along z=0 to the small island ---
  await B.evaluate(() => window.__sky.teleport(14, 0));
  await sleep(800);
  await B.keyboard.down("d");
  await sleep(6500);
  await B.keyboard.up("d");
  const b2 = await me(B);
  check("B crossed the bridge onto the small island (x > 33)", b2.x > 33, `x=${b2.x.toFixed(1)}`);
  await sleep(1200);
  const bOnA2 = (await seen(A))[0];
  check("A sees B on the other island", Math.abs(bOnA2.x - b2.x) < 1.5, `seen x=${bOnA2.x.toFixed(1)}`);

  // --- reconnect: drop B's socket ---
  await B.evaluate(() => window.__sky.dropSocket());
  await sleep(800);
  check("B shows reconnecting state", /재연결/.test(await hud(B)), await hud(B));
  check("A still sees B during the reconnect window", (await seen(A)).length === 1);
  await B.waitForFunction(() => window.__sky.conn() === "online", null, { timeout: 25000 }).catch(() => {});
  check("B reconnected (online again)", (await B.evaluate(() => window.__sky.conn())) === "online");
  await sleep(1200);
  const b3 = await me(B);
  check("B resumed near its position after reconnect", Math.hypot(b3.x - b2.x, b3.z - b2.z) < 2.5, `before=(${b2.x.toFixed(1)},${b2.z.toFixed(1)}) after=(${b3.x.toFixed(1)},${b3.z.toFixed(1)})`);

  // --- invite link ---
  await clickText(A, "초대 링크");
  await sleep(500);
  const link = await A.evaluate(() => navigator.clipboard.readText());
  check("invite link contains the room id", link.includes("room=" + roomA), link);
  const C = await open(browser, "Carol", link.replace("localhost:5173", new URL(WEB).host) + "&q=low");
  await sleep(1500);
  check("Carol joined the same room via the invite link", (await C.evaluate(() => window.__sky.roomId())) === roomA);
  check("everyone sees 2 others (3 players)", (await seen(A)).length === 2 && (await seen(C)).length === 2);

  // --- leave ---
  await clickText(B, "나가기");
  await sleep(1500);
  check("A sees Bob leave", (await seen(A)).length === 1 && (await seen(A))[0].name === "Carol", JSON.stringify((await seen(A)).map((r) => r.name)));
  check("HUD count dropped to 2/16", /2\/16/.test(await hud(A)), await hud(A));

  const errs = [A, B, C].flatMap((p) => p.errors);
  check("no uncaught page errors", errs.length === 0, errs.join(" | ").slice(0, 300));
  await browser.close();
  console.log(failed ? `\n${failed} FAILED` : "\nALL PASSED");
  process.exit(failed ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(2); });
