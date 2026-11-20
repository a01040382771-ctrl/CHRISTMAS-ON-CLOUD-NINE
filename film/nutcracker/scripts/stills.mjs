// Render a few stills for checking: node scripts/stills.mjs 0.5 6 11.9 ... [--w=960 --h=540 --out=dir]
import { createRequire } from 'node:module';
const { chromium } = createRequire(import.meta.url)('playwright'); // pre-installed globally
import { writeFile, mkdir } from 'node:fs/promises';
import { serve } from './serve.mjs';

const args = process.argv.slice(2);
const opt = Object.fromEntries(args.filter((a) => a.startsWith('--')).map((a) => a.slice(2).split('=')));
const times = args.filter((a) => !a.startsWith('--')).map(Number);
const W = +(opt.w || 960), H = +(opt.h || 540), out = opt.out || 'out/stills';
await mkdir(out, { recursive: true });
const server = await serve();
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: W, height: H } });
page.on('console', (m) => console.log('[page]', m.text()));
page.on('pageerror', (e) => console.log('[pageerror]', e.message));
await page.goto(`http://127.0.0.1:${server.address().port}/index.html?render=1&w=${W}&h=${H}`);
await page.waitForFunction(() => window.__ready === true, null, { timeout: 120000 });
for (const t of times) {
  const t0 = Date.now();
  const url = await page.evaluate((t) => window.__renderTime(t), t);
  await writeFile(`${out}/t${String(t.toFixed(2)).padStart(5, '0')}.png`, Buffer.from(url.split(',')[1], 'base64'));
  console.log(`t=${t} ${Date.now() - t0}ms`);
}
await browser.close(); server.close();
