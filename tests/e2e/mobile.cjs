/** Mobile emulation: touch joystick moves the avatar, one-finger drag orbits the camera. */
const { chromium } = require("playwright");
const WEB = process.env.WEB ?? "http://localhost:5173";
let failed = 0;
const check = (n, ok, x = "") => { console.log(`${ok ? "PASS" : "FAIL"}  ${n} ${x}`); if (!ok) failed++; };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

(async () => {
  const browser = await chromium.launch({ args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] });
  const ctx = await browser.newContext({ viewport: { width: 390, height: 600 }, deviceScaleFactor: 1, hasTouch: true, isMobile: true, userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148" });
  const page = await ctx.newPage();
  const errs = [];
  page.on("pageerror", (e) => errs.push(e.message));
  await page.goto(`${WEB}/?q=low&touch=1`, { waitUntil: "load" });
  await page.fill("input", "Mobi");
  await page.press("input", "Enter");
  await page.waitForFunction(() => window.__sky && window.__sky.player.ready, null, { timeout: 90000 });
  await sleep(1000);
  const cdp = await ctx.newCDPSession(page);
  const touch = (type, pts) => cdp.send("Input.dispatchTouchEvent", { type, touchPoints: pts.map(([x, y], i) => ({ x, y, id: i + 1 })) });

  check("joystick is rendered on touch devices", await page.evaluate(() => !!document.querySelector(".joystick")));
  const box = await page.evaluate(() => { const r = document.querySelector(".joystick").getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; });

  const p0 = await page.evaluate(() => ({ x: window.__sky.player.x, z: window.__sky.player.z }));
  await touch("touchStart", [[box.x, box.y]]);
  await touch("touchMove", [[box.x, box.y - 50]]); // push up = forward = north (-z)
  await sleep(1500);
  const joy = await page.evaluate(() => ({ x: window.__sky.input.joyX, y: window.__sky.input.joyY }));
  await touch("touchEnd", []);
  await sleep(500);
  const p1 = await page.evaluate(() => ({ x: window.__sky.player.x, z: window.__sky.player.z }));
  check("joystick input registers (forward ≈ +1)", joy.y > 0.8 && Math.abs(joy.x) < 0.2, JSON.stringify(joy));
  check("avatar walked forward (north) with the joystick", p0.z - p1.z > 2, `Δz=${(p1.z - p0.z).toFixed(2)}`);
  const joy2 = await page.evaluate(() => ({ x: window.__sky.input.joyX, y: window.__sky.input.joyY }));
  check("joystick released → input returns to 0", joy2.x === 0 && joy2.y === 0);

  const yaw0 = await page.evaluate(() => window.__sky.input.yaw);
  await touch("touchStart", [[250, 200]]);
  for (let i = 1; i <= 8; i++) await touch("touchMove", [[250 + i * 15, 200]]);
  await touch("touchEnd", []);
  const yaw1 = await page.evaluate(() => window.__sky.input.yaw);
  check("one-finger drag rotates the camera", Math.abs(yaw1 - yaw0) > 0.3, `Δyaw=${(yaw1 - yaw0).toFixed(2)}`);

  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1);
  check("no horizontal overflow at 390px", !overflow);
  await page.screenshot({ path: process.env.SHOT ?? "mobile.png" });
  check("no uncaught page errors", errs.length === 0, errs.join("|").slice(0, 200));
  await browser.close();
  console.log(failed ? `\n${failed} FAILED` : "\nALL PASSED");
  process.exit(failed ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(2); });
