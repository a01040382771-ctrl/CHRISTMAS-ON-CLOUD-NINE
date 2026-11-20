// Render the film to out/nutcracker.mp4:  node scripts/render.mjs [--w=1920 --h=1080 --workers=2]
// Each frame is rendered deterministically in headless Chromium (software WebGL is fine),
// saved as PNG, then encoded with the score by ffmpeg.
import { createRequire } from 'node:module';
import { writeFile, mkdir, access } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { serve } from './serve.mjs';
const { chromium } = createRequire(import.meta.url)('playwright');

const opt = Object.fromEntries(process.argv.slice(2).filter((a) => a.startsWith('--')).map((a) => a.slice(2).split('=')));
const W = +(opt.w || 1920), H = +(opt.h || 1080), WORKERS = +(opt.workers || 2);
const FPS = 24, DURATION = 30, N = FPS * DURATION;
const FR = 'out/frames';
await mkdir(FR, { recursive: true });

const server = await serve();
const url = `http://127.0.0.1:${server.address().port}/index.html?render=1&w=${W}&h=${H}`;
const ARGS = ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'];
const browsers = [];
const exists = (f) => access(f).then(() => true, () => false);
let done = 0; const t0 = Date.now();
async function worker(k) {
  // one browser per worker: each gets its own GPU process (they would otherwise serialise)
  const browser = await chromium.launch({ args: ARGS }); browsers.push(browser);
  const page = await browser.newPage({ viewport: { width: Math.min(W, 1920), height: Math.min(H, 1080) } });
  page.on('pageerror', (e) => console.error('[pageerror]', e.message));
  await page.goto(url);
  await page.waitForFunction(() => window.__ready === true, null, { timeout: 120000 });
  for (let i = k; i < N; i += WORKERS) {
    const file = `${FR}/f${String(i).padStart(4, '0')}.png`;
    if (!opt.force && await exists(file)) { done++; continue; }
    const data = await page.evaluate((i) => window.__renderFrame(i), i);
    await writeFile(file, Buffer.from(data.split(',')[1], 'base64'));
    if (++done % 24 === 0) console.log(`${done}/${N} frames, ${((Date.now() - t0) / 1000).toFixed(0)}s`);
  }
}
await Promise.all(Array.from({ length: WORKERS }, (_, k) => worker(k)));
await Promise.all(browsers.map((b) => b.close())); server.close();

if (!(await exists('out/score.wav'))) execFileSync('node', ['scripts/score.mjs'], { stdio: 'inherit' });
execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-framerate', String(FPS), '-i', `${FR}/f%04d.png`, '-i', 'out/score.wav',
  '-c:v', 'libx264', '-preset', 'slow', '-crf', '18', '-pix_fmt', 'yuv420p', '-tune', 'animation',
  '-c:a', 'aac', '-b:a', '192k', '-shortest', '-movflags', '+faststart', 'out/nutcracker.mp4'], { stdio: 'inherit' });
console.log('wrote out/nutcracker.mp4');
