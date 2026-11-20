// Synthesises the 30 s score + sound effects to out/score.wav (44.1 kHz, 16-bit stereo).
// An original music-box waltz (3/4, 120 bpm, bar = 1.5 s) in E minor that blossoms into G major,
// played on a synthetic celesta over pizzicato bass and soft strings, with sync'd effects.
import { writeFile, mkdir } from 'node:fs/promises';

const SR = 44100, DUR = 30.5, N = Math.floor(SR * DUR);
const L = new Float32Array(N), R = new Float32Array(N);
const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12);
let seed = 7; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);

function add(t0, len, fn, gain = 1, pan = 0) {
  const s0 = Math.floor(t0 * SR), n = Math.floor(len * SR);
  const gl = gain * Math.cos((pan + 1) * Math.PI / 4), gr = gain * Math.sin((pan + 1) * Math.PI / 4);
  for (let i = 0; i < n && s0 + i < N; i++) { if (s0 + i < 0) continue; const v = fn(i / SR) * Math.min(1, (n - i) / (0.06 * SR)); L[s0 + i] += v * gl; R[s0 + i] += v * gr; }
}
const TAU = Math.PI * 2;
const env = (t, a, d) => (t < a ? t / a : Math.exp(-(t - a) * d));

// instruments
const celesta = (t0, m, g = 0.22, pan = 0) => { const f = mtof(m); add(t0, 2.6, (t) => env(t, 0.003, 2.2) * (Math.sin(TAU * f * t) + 0.35 * Math.sin(TAU * 2 * f * t) * Math.exp(-t * 3) + 0.18 * Math.sin(TAU * 4 * f * t) * Math.exp(-t * 9) + 0.06 * Math.sin(TAU * 6.8 * f * t) * Math.exp(-t * 18)), g, pan); };
const bell = (t0, m, g = 0.25) => { const f = mtof(m); const P = [[0.5, 1, 0.9], [1, 1, 0.6], [1.19, 0.5, 0.8], [1.5, 0.35, 1.1], [2, 0.3, 1.4], [2.52, 0.2, 2], [3, 0.12, 2.6]]; add(t0, 4, (t) => P.reduce((s, [r, a, d]) => s + a * Math.sin(TAU * f * r * t) * Math.exp(-t * d), 0) * Math.min(1, t / 0.004), g, -0.2); };
function pizz(t0, m, g = 0.3, pan = 0) { // Karplus-Strong pluck
  const f = mtof(m), p = Math.max(2, Math.round(SR / f)); const buf = new Float32Array(p); for (let i = 0; i < p; i++) buf[i] = rnd() * 2 - 1;
  for (let k = 0; k < 3; k++) for (let i = 1; i < p; i++) buf[i] = 0.5 * (buf[i] + buf[i - 1]);
  let idx = 0; add(t0, 0.9, (t) => { const a = buf[idx], b = buf[(idx + 1) % p]; buf[idx] = 0.5 * (a + b) * 0.994; idx = (idx + 1) % p; return a * Math.exp(-t * 4) * Math.min(1, t / 0.004); }, g, pan);
}
function pad(t0, len, notes, g = 0.05) {
  const fs = notes.map(mtof); let lp = 0;
  add(t0, len + 0.8, (t) => { let s = 0; for (const f of fs) for (const d of [-0.003, 0.003]) { const ph = (f * (1 + d) * t) % 1; s += ph * 2 - 1; } lp += (s - lp) * 0.06; const e = Math.min(1, t / 0.5) * Math.min(1, Math.max(0, (len + 0.8 - t) / 0.8)); return lp * e; }, g);
}
const click = (t0, f = 1400, g = 0.3) => add(t0, 0.08, (t) => (Math.sin(TAU * f * t) * 0.6 + (rnd() * 2 - 1) * 0.4) * Math.exp(-t * 60), g);
const squeak = (t0, g = 0.07, pan = 0.4) => add(t0, 0.12, (t) => Math.sin(TAU * (2600 + 9000 * t) * t) * Math.sin(Math.PI * t / 0.12), g, pan);
const clink = (t0, g = 0.16) => add(t0, 0.6, (t) => [2130, 3410, 5270, 6890].reduce((s, f, i) => s + Math.sin(TAU * f * t) * Math.exp(-t * (6 + i * 4)) / (i + 1), 0), g, 0.15);
const bonk = (t0) => add(t0, 0.5, (t) => Math.sin(TAU * (380 - 300 * t) * t) * Math.exp(-t * 7), 0.35);
function whoosh(t0, len, g = 0.12) { let a = 0, b = 0; add(t0, len, (t) => { const n = rnd() * 2 - 1; const u = t / len; const k = 0.02 + 0.2 * u; a += (n - a) * k; b += (a - b) * k; return (a - b) * Math.sin(Math.PI * u) * 3; }, g); }
const jingle = (t0, g = 0.05) => add(t0, 0.25, (t) => (rnd() * 2 - 1) * Math.sin(TAU * 7800 * t) * Math.exp(-t * 18), g, 0.3);

// --- score -----------------------------------------------------------------
const B = 0.5; // one beat
// midnight: three tolls of the clock, the owl clock chiming
for (const [t, m] of [[0.6, 64], [1.5, 59], [2.4, 64]]) bell(t, m, 0.22);
pad(0, 4.5, [52, 55, 59], 0.035);
[71, 76, 79, 83].forEach((m, i) => celesta(3.3 + i * 0.25, m, 0.12, 0.3));
// melody: [beat, midi, gain]  (beat 0 = 0 s)
const mel = [
  [9, 71], [10, 76], [11, 79], [12, 78], [14, 76], [15, 75], [16, 76], [17, 78], [18, 71],
  [21, 79], [21.5, 78], [22, 76], [22.5, 75], [23, 76], [23.5, 78], [24, 79], [24.5, 81], [25, 83], [26, 71],
  [27, 74], [28, 79], [29, 83], [30, 86], [32, 83], [33, 84], [34, 81], [35, 78], [36, 79],
  [39, 79], [40, 83], [41, 86], [42, 88], [44, 86], [45, 84], [46, 83], [47, 81], [48, 83],
  [51, 79], [51.5, 83], [52, 86], [52.5, 91], [53, 95], [53.5, 98], [55, 91], [55.5, 95], [56, 98], [56.5, 103],
];
for (const [b, m] of mel) { celesta(b * B, m, 0.2, -0.1); celesta(b * B + 0.004, m + 12, 0.04, 0.2); }
// chords per bar (bar k starts at beat 3k): [bass root, chord tones]
const chords = { 3: [40, [55, 59]], 4: [40, [55, 59]], 5: [35, [54, 57]], 6: [40, [55, 59]], 7: [35, [54, 57]], 8: [40, [55, 59]],
  9: [43, [59, 62]], 10: [43, [59, 62]], 11: [38, [57, 60]], 12: [43, [59, 62]], 13: [40, [55, 59]], 14: [36, [55, 60]], 15: [38, [57, 60]],
  16: [43, [59, 62]], 17: [43, [59, 62]], 18: [43, [59, 62]] };
for (const [k, [root, tones]] of Object.entries(chords)) {
  const t = k * 3 * B;
  pizz(t, root, 0.32, -0.2);
  for (const b of [1, 2]) for (const m of tones) pizz(t + b * B, m, 0.12, 0.25);
  pad(t, 1.5, [root + 12, ...tones], k >= 9 ? 0.04 : 0.03);
}
pad(28.5, 2.0, [43, 55, 59, 62, 67], 0.05);
celesta(28.5, 79, 0.18); celesta(28.5, 83, 0.14); celesta(28.5, 86, 0.14); celesta(28.5, 91, 0.12);

// --- effects ---------------------------------------------------------------
[4.6, 4.75, 4.9, 5.05, 5.2].forEach((t, i) => celesta(t, 95 - i * 2, 0.06, 0.5)); // awakening shimmer
click(5.2); click(5.6); // jaw clacks
for (let i = 0; i < 9; i++) squeak(8.1 + i * 0.17 + rnd() * 0.05, 0.05, 0.5);
[10.25, 10.65, 11.05, 11.45].forEach((t) => clink(t));
whoosh(11.4, 0.5, 0.06); bonk(11.9); celesta(12.0, 88, 0.1);
for (let i = 0; i < 8; i++) squeak(12.1 + i * 0.12, 0.06, 0.6);
for (let i = 0; i < 12; i++) celesta(13.3 + i * 0.08, 84 + (i % 6) * 2, 0.05, -0.4); // walnut grows
celesta(14.3, 96, 0.12);
whoosh(15.2, 2.6, 0.13); whoosh(21.8, 2.0, 0.12);
for (let t = 16.5; t < 22; t += 0.25) jingle(t, t % 0.5 < 0.25 ? 0.05 : 0.03);
for (let i = 0; i < 16; i++) celesta(24 + i * 0.09, 91 + (i % 8), 0.04, 0.5 - (i % 3) * 0.4); // arrival sparkle

// --- reverb (Schroeder) + master ---------------------------------------------
function reverb(x, combs, aps) {
  const out = new Float32Array(x.length);
  for (const [d, g] of combs) { const buf = new Float32Array(d); let j = 0; for (let i = 0; i < x.length; i++) { const y = buf[j]; buf[j] = x[i] + y * g; j = (j + 1) % d; out[i] += y / combs.length; } }
  for (const [d, g] of aps) { const buf = new Float32Array(d); let j = 0; for (let i = 0; i < x.length; i++) { const b = buf[j]; const y = -g * out[i] + b; buf[j] = out[i] + g * y; out[i] = y; j = (j + 1) % d; } }
  return out;
}
const rl = reverb(L, [[1557, 0.84], [1617, 0.84], [1491, 0.84], [1422, 0.84]], [[225, 0.5], [556, 0.5]]);
const rr = reverb(R, [[1617, 0.84], [1557, 0.84], [1356, 0.84], [1277, 0.84]], [[248, 0.5], [579, 0.5]]);
let peak = 0;
for (let i = 0; i < N; i++) { L[i] += rl[i] * 0.35; R[i] += rr[i] * 0.35; peak = Math.max(peak, Math.abs(L[i]), Math.abs(R[i])); }
const norm = 0.89 / peak;
const pcm = Buffer.alloc(44 + N * 4);
pcm.write('RIFF', 0); pcm.writeUInt32LE(36 + N * 4, 4); pcm.write('WAVE', 8); pcm.write('fmt ', 12);
pcm.writeUInt32LE(16, 16); pcm.writeUInt16LE(1, 20); pcm.writeUInt16LE(2, 22); pcm.writeUInt32LE(SR, 24); pcm.writeUInt32LE(SR * 4, 28); pcm.writeUInt16LE(4, 32); pcm.writeUInt16LE(16, 34);
pcm.write('data', 36); pcm.writeUInt32LE(N * 4, 40);
for (let i = 0; i < N; i++) {
  const t = i / SR; const fade = Math.min(1, t / 0.05) * Math.min(1, Math.max(0, (30 - t) / 1.2));
  pcm.writeInt16LE(Math.round(Math.max(-1, Math.min(1, L[i] * norm * fade)) * 32767), 44 + i * 4);
  pcm.writeInt16LE(Math.round(Math.max(-1, Math.min(1, R[i] * norm * fade)) * 32767), 46 + i * 4);
}
await mkdir('out', { recursive: true });
await writeFile('out/score.wav', pcm);
console.log('wrote out/score.wav');
