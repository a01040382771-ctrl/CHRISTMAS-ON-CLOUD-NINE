// Renders the film frame-by-frame in headless Chromium.
//   node render.mjs                 → frames/00000.png … (24 fps × 30 s)
//   node render.mjs --stills 2,8,13 → stills/t2.png …
//   node render.mjs --from 0 --to 360   (frame range, for parallel workers)
import { createRequire } from 'node:module';
const { chromium } = createRequire(import.meta.url)('playwright');
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const FPS = 24;
const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };

const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.woff2': 'font/woff2', '.woff': 'font/woff' };
const server = http.createServer((req, res) => {
  const p = path.join(ROOT, decodeURIComponent(req.url.split('?')[0]));
  if (!p.startsWith(ROOT) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'content-type': TYPES[path.extname(p)] || 'application/octet-stream' });
  fs.createReadStream(p).pipe(res);
}).listen(0);
const port = server.address().port;

const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') console.log('[page]', m.text()); });
page.on('pageerror', (e) => console.log('[pageerror]', e.message));
await page.goto(`http://localhost:${port}/index.html?capture`);
await page.waitForFunction(() => window.__ready !== undefined);
await page.evaluate(() => window.__ready);

async function grab(t, file) {
  const data = await page.evaluate((t) => { window.renderAt(t); return document.querySelector('canvas').toDataURL('image/png'); }, t);
  fs.writeFileSync(file, Buffer.from(data.split(',')[1], 'base64'));
}

if (opt('--stills')) {
  fs.mkdirSync(path.join(ROOT, 'stills'), { recursive: true });
  for (const s of opt('--stills').split(',')) { const t0 = Date.now(); await grab(parseFloat(s), path.join(ROOT, 'stills', `t${s}.png`)); console.log('still', s, Date.now() - t0, 'ms'); }
} else {
  const dir = path.join(ROOT, 'frames'); fs.mkdirSync(dir, { recursive: true });
  const from = +opt('--from', 0), to = +opt('--to', 30 * FPS);
  const t0 = Date.now();
  for (let f = from; f < to; f++) {
    await grab(f / FPS, path.join(dir, String(f).padStart(5, '0') + '.png'));
    if (f % 24 === 0) console.log(`frame ${f} (${((Date.now() - t0) / (f - from + 1)).toFixed(0)} ms/frame)`);
  }
}
await browser.close(); server.close();
