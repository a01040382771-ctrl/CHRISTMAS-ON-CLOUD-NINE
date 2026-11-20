/**
 * Bundles once and renders selected frames as JPEG.
 * Usage: node scripts/render-stills.mjs <outDir> <scale> frame [frame...]
 *   e.g. node scripts/render-stills.mjs out/frames 1 90 300 450 650 860
 */
import path from 'node:path';
import fs from 'node:fs';
import {bundle} from '@remotion/bundler';
import {renderStill, selectComposition} from '@remotion/renderer';

const [outDir = 'out/frames', scale = '1', ...frames] = process.argv.slice(2);
const browserExecutable = process.env.REMOTION_BROWSER || undefined;
fs.mkdirSync(outDir, {recursive: true});
const serveUrl = await bundle({entryPoint: path.resolve('src/index.ts')});
const composition = await selectComposition({serveUrl, id: 'NutcrackerDream', browserExecutable});
const list = frames.length ? frames.map(Number) : [90, 300, 450, 650, 860];
for (const frame of list) {
  const output = path.join(outDir, `frame-${String(frame).padStart(3, '0')}.jpg`);
  await renderStill({serveUrl, composition, frame, output, imageFormat: 'jpeg', jpegQuality: 90, scale: Number(scale), browserExecutable});
  console.log('wrote', output);
}
