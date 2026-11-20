/**
 * Generates public/audio/score.wav — an ORIGINAL score and sound effects,
 * synthesised from scratch (no samples, no third-party recordings).
 *
 * The music is newly composed "in the manner of" a Tchaikovsky ballet
 * (celesta, pizzicato strings, harp, toy march) so no copyrighted recording
 * or arrangement is used. Every cue time comes from src/timeline.json so the
 * sound stays frame-locked to the animation.
 *
 * Usage: node scripts/generate-audio.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const T = JSON.parse(fs.readFileSync(path.join(__dirname, '../src/timeline.json'), 'utf8'));

const SR = 44100;
const DUR = T.durationInFrames / T.fps + 0.0;
const N = Math.ceil(SR * DUR);
const L = new Float32Array(N);
const R = new Float32Array(N);
const BEAT = 60 / T.bpm; // 0.5 s
const fr = (f) => f / T.fps; // frame → seconds

// ---------- deterministic noise ----------
let seed = 1234567;
const rand = () => {
  seed = (seed * 1664525 + 1013904223) >>> 0;
  return seed / 4294967296;
};
const noise = () => rand() * 2 - 1;

const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12);
const NOTE = (name) => {
  const m = /^([A-G])(#|b)?(-?\d)$/.exec(name);
  const base = {C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11}[m[1]];
  const acc = m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0;
  return 12 * (Number(m[3]) + 1) + base + acc;
};

const add = (t0, buf, gain = 1, pan = 0) => {
  const s0 = Math.floor(t0 * SR);
  const gl = gain * Math.cos(((pan + 1) * Math.PI) / 4);
  const gr = gain * Math.sin(((pan + 1) * Math.PI) / 4);
  for (let i = 0; i < buf.length; i++) {
    const j = s0 + i;
    if (j < 0 || j >= N) continue;
    L[j] += buf[i] * gl;
    R[j] += buf[i] * gr;
  }
};

// ---------- instruments ----------
/** Celesta / music box: bright inharmonic bell partials with fast decay. */
function celesta(freq, dur = 1.6, bright = 1) {
  const n = Math.floor(SR * dur);
  const out = new Float32Array(n);
  const parts = [
    [1, 1, 2.2],
    [2, 0.32 * bright, 4.5],
    [3.01, 0.12 * bright, 7],
    [4.16, 0.08 * bright, 9],
    [5.43, 0.04 * bright, 12],
  ];
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    const att = Math.min(1, t / 0.003);
    let v = 0;
    for (const [m, a, d] of parts) v += a * Math.exp(-d * t) * Math.sin(2 * Math.PI * freq * m * t);
    out[i] = v * att * 0.5;
  }
  return out;
}

/** Karplus–Strong plucked string (pizzicato / harp). */
function pluck(freq, dur = 1.2, damp = 0.996, bright = 0.5) {
  const n = Math.floor(SR * dur);
  const out = new Float32Array(n);
  const p = Math.max(2, Math.round(SR / freq));
  const buf = new Float32Array(p);
  for (let i = 0; i < p; i++) buf[i] = noise() * (1 - bright) + (i < p / 2 ? 1 : -1) * bright * 0.6;
  let idx = 0;
  for (let i = 0; i < n; i++) {
    const a = buf[idx];
    const b = buf[(idx + 1) % p];
    buf[idx] = damp * 0.5 * (a + b);
    out[i] = a * 0.45 * Math.min(1, i / 30);
    idx = (idx + 1) % p;
  }
  return out;
}

/** Bowed string pad: additive saw-ish with vibrato and slow envelope. */
function strings(freq, dur, att = 0.35, rel = 0.6, harm = 7) {
  const n = Math.floor(SR * (dur + rel));
  const out = new Float32Array(n);
  const ph = [0, 0, 0];
  const det = [1, 1.0035, 0.9968];
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    const env = t < att ? t / att : t < dur ? 1 : Math.max(0, 1 - (t - dur) / rel);
    const vib = 1 + 0.0035 * Math.sin(2 * Math.PI * 5.2 * t) * Math.min(1, t / 0.6);
    let v = 0;
    for (let k = 0; k < 3; k++) {
      ph[k] += (2 * Math.PI * freq * det[k] * vib) / SR;
      for (let h = 1; h <= harm; h++) v += Math.sin(ph[k] * h) / (h * h * 0.7 + 0.3);
    }
    out[i] = (v / 6) * env * env;
  }
  return out;
}

/** Wooden flute / piccolo voice. */
function flute(freq, dur) {
  const n = Math.floor(SR * (dur + 0.12));
  const out = new Float32Array(n);
  let ph = 0;
  let lp = 0;
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    const env = Math.min(1, t / 0.025) * (t < dur ? 1 : Math.max(0, 1 - (t - dur) / 0.12));
    const vib = 1 + 0.004 * Math.sin(2 * Math.PI * 5.5 * t);
    ph += (2 * Math.PI * freq * vib) / SR;
    lp += 0.08 * (noise() - lp);
    out[i] = (Math.sin(ph) + 0.18 * Math.sin(2 * ph) + 0.06 * Math.sin(3 * ph) + lp * 0.35) * env * 0.4;
  }
  return out;
}

/** Church/clock bell with hum and long decay. */
function bell(freq, dur = 4.5) {
  const n = Math.floor(SR * dur);
  const out = new Float32Array(n);
  const parts = [
    [0.5, 0.45, 0.6],
    [1, 1, 0.9],
    [1.19, 0.5, 1.3],
    [1.56, 0.35, 1.6],
    [2, 0.4, 2],
    [2.51, 0.22, 2.8],
    [3.01, 0.14, 3.5],
    [4.07, 0.08, 5],
  ];
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    let v = 0;
    for (const [m, a, d] of parts) v += a * Math.exp(-d * t) * Math.sin(2 * Math.PI * freq * m * t + m);
    const strike = Math.exp(-t * 60) * noise() * 0.25;
    out[i] = (v * 0.32 + strike) * Math.min(1, t / 0.002);
  }
  return out;
}

/** Tiny wooden "tock". */
function tock(freq = 950, dur = 0.12) {
  const n = Math.floor(SR * dur);
  const out = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    out[i] =
      (Math.sin(2 * Math.PI * freq * t) * 0.8 + Math.sin(2 * Math.PI * freq * 2.7 * t) * 0.3) * Math.exp(-t * 55) +
      noise() * Math.exp(-t * 180) * 0.4;
  }
  return out;
}

/** Wooden joint creak: stick-slip friction grains with rising rate. */
function creak(dur = 0.6, f0 = 260, f1 = 420) {
  const n = Math.floor(SR * dur);
  const out = new Float32Array(n);
  let next = 0;
  let res = 0;
  let resV = 0;
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    const k = t / dur;
    const rate = 35 + 90 * Math.sin(Math.PI * k);
    let exc = 0;
    if (t >= next) {
      exc = 1;
      next = t + (1 / rate) * (0.7 + rand() * 0.6);
    }
    const f = f0 + (f1 - f0) * k;
    const w = 2 * Math.PI * f / SR;
    // damped resonator
    resV += -w * w * res - 0.02 * resV + exc * 0.6;
    res += resV;
    out[i] = res * 0.06 * Math.sin(Math.PI * k);
  }
  return out;
}

/** Filtered noise whoosh (wind, snow swirl, magic swell). */
function whoosh(dur = 1.5, peak = 0.5, cut0 = 0.02, cut1 = 0.2) {
  const n = Math.floor(SR * dur);
  const out = new Float32Array(n);
  let a = 0;
  let b = 0;
  for (let i = 0; i < n; i++) {
    const k = i / n;
    const env = k < peak ? Math.sin((k / peak) * Math.PI / 2) : Math.cos(((k - peak) / (1 - peak)) * Math.PI / 2);
    const c = cut0 + (cut1 - cut0) * Math.sin(Math.PI * k);
    a += c * (noise() - a);
    b += c * (a - b);
    out[i] = (a - b * 0.6) * env * 1.4;
  }
  return out;
}

/** Shimmer: a cloud of tiny high bells. */
function sparkle(t0, dur, count, gain = 0.12, lo = 2000, hi = 6000) {
  for (let i = 0; i < count; i++) {
    const t = t0 + rand() * dur;
    const f = lo * Math.pow(hi / lo, rand());
    add(t, celesta(f, 0.6, 0.4), gain * (0.4 + rand() * 0.6), rand() * 1.6 - 0.8);
  }
}

function drum(freq0 = 90, freq1 = 45, dur = 0.35) {
  const n = Math.floor(SR * dur);
  const out = new Float32Array(n);
  let ph = 0;
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    const f = freq1 + (freq0 - freq1) * Math.exp(-t * 25);
    ph += (2 * Math.PI * f) / SR;
    out[i] = Math.sin(ph) * Math.exp(-t * 9) * 0.9;
  }
  return out;
}

function snare(dur = 0.18, gain = 1) {
  const n = Math.floor(SR * dur);
  const out = new Float32Array(n);
  let prev = 0;
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    const x = noise();
    const hp = x - prev;
    prev = x;
    out[i] = (hp * 0.55 * Math.exp(-t * 22) + Math.sin(2 * Math.PI * 190 * t) * 0.4 * Math.exp(-t * 30)) * gain;
  }
  return out;
}

function chirp(f0, f1, dur = 0.09) {
  const n = Math.floor(SR * dur);
  const out = new Float32Array(n);
  let ph = 0;
  for (let i = 0; i < n; i++) {
    const k = i / n;
    const f = f0 + (f1 - f0) * k;
    ph += (2 * Math.PI * f) / SR;
    out[i] = Math.sin(ph) * Math.sin(Math.PI * k) * 0.5;
  }
  return out;
}

// ---------- helpers for writing music ----------
const b2s = (beat) => beat * BEAT;
const cel = (beat, n, len = 1.5, g = 0.22, pan = 0.15) => add(b2s(beat), celesta(mtof(NOTE(n)), len + 0.8), g, pan);
const pz = (beat, n, g = 0.3, pan = -0.25) => add(b2s(beat), pluck(mtof(NOTE(n)), 0.9, 0.993, 0.3), g, pan);
const harp = (beat, n, g = 0.22, pan = 0.35) => add(b2s(beat), pluck(mtof(NOTE(n)), 2.2, 0.9985, 0.55), g, pan);
const pad = (beat, beats, notes, g = 0.05, att = 0.4) =>
  notes.forEach((n, i) => add(b2s(beat), strings(mtof(NOTE(n)), b2s(beats), att, 0.8), g, -0.4 + (i / Math.max(1, notes.length - 1)) * 0.8));
const fl = (beat, n, beats, g = 0.16) => add(b2s(beat), flute(mtof(NOTE(n)), b2s(beats) * 0.55), g, 0.3);
const seq = (start, notes, fn) => {
  let b = start;
  for (const [n, d, ...rest] of notes) {
    if (n) fn(b, n, d, ...rest);
    b += d;
  }
  return b;
};

// ========== MUSIC ==========
// A — Christmas Eve lullaby (beats 0–12, 3/4, E minor): music box + soft strings
pad(0, 3, ['E3', 'B3', 'G4'], 0.035, 1.2);
pad(3, 3, ['A2', 'E3', 'C4'], 0.035);
pad(6, 3, ['B2', 'F#3', 'D#4', 'A3'], 0.035);
pad(9, 3, ['E3', 'B3', 'G4'], 0.035);
seq(0.5, [['E5', 1], ['G5', 1], ['B5', 1], ['A5', 1.5], ['G5', 0.5], ['E5', 1], ['D#5', 1], ['F#5', 1], ['A5', 1], ['G5', 1.5], ['F#5', 0.5], ['E5', 1]], (b, n) => cel(b, n, 1.4, 0.2));
[0, 3, 6, 9].forEach((b, i) => pz(b, ['E2', 'A2', 'B2', 'E2'][i], 0.26));

// B — The Awakening (beats 12–24): low tremolo, rising celesta, swell into the clasp
pad(12, 6, ['E2', 'B2', 'E3'], 0.05, 1.5);
pad(18, 4, ['C3', 'G3', 'E4'], 0.05, 1.0);
pad(22, 2, ['D3', 'F#3', 'A3', 'C4'], 0.06, 0.4);
seq(14, [['B4', 1], ['C5', 1], ['D#5', 1], ['E5', 1], ['F#5', 1], ['G5', 1], ['A5', 0.75], ['B5', 0.75], ['C6', 0.5], ['D6', 1]], (b, n) => cel(b, n, 1.6, 0.17, -0.1));
// glistening harp arpeggio at the hand clasp
{
  const clasp = fr(T.cues.handClasp) / BEAT;
  ['C4', 'E4', 'G4', 'C5', 'E5', 'G5', 'C6', 'E6'].forEach((n, i) => harp(clasp + i * 0.12, n, 0.2));
}

// C — The Toy March (beats 24–36, G major 4/4)
for (let b = 24; b < 36; b++) {
  const bassNotes = ['G2', 'D3', 'G2', 'D3', 'C3', 'G2', 'D3', 'A2', 'G2', 'D3', 'G2', 'D3'];
  if (b >= 26) pz(b, bassNotes[b - 24], 0.36);
  if (b >= 26 && b % 2 === 0) add(b2s(b), drum(), 0.32, 0);
  if (b >= 26 && b % 2 === 1) add(b2s(b), snare(), 0.22, 0.1);
  if (b >= 26) pz(b + 0.5, ['B3', 'B3', 'B3', 'B3', 'E4', 'D4', 'F#4', 'C4', 'B3', 'B3', 'B3', 'B3'][b - 24], 0.16, 0.2);
}
// snare roll into the march
for (let i = 0; i < 12; i++) add(b2s(25 + i / 12), snare(0.08, 0.35 + i * 0.03), 0.2, 0.1);
seq(26, [['D5', 0.5], ['D5', 0.5], ['G5', 0.5], ['A5', 0.5], ['B5', 1], ['G5', 1], ['A5', 0.5], ['B5', 0.5], ['C6', 0.5], ['A5', 0.5], ['B5', 1], ['D5', 1], ['G5', 0.5], ['F#5', 0.5], ['E5', 0.5], ['F#5', 0.5], ['G5', 1]], (b, n, d) => fl(b, n, d, 0.15));
seq(26, [['B4', 1], ['D5', 1], ['G4', 1], ['B4', 1], ['C5', 1], ['E5', 1], ['D5', 2], ['B4', 1], ['C5', 1], ['B4', 1]], (b, n) => cel(b, n, 0.4, 0.08, -0.3));
// harp glissando as the theatre curtain opens
{
  const c = fr(T.cues.curtainOpen) / BEAT;
  ['G3', 'A3', 'B3', 'D4', 'E4', 'G4', 'A4', 'B4', 'D5', 'E5', 'G5', 'A5', 'B5', 'D6', 'E6'].forEach((n, i) => harp(c + i * 0.085, n, 0.17));
}

// D — Sugar Plum Kingdom (beats 36–50) celesta waltz with pizzicato + harp + strings
pad(36, 3, ['E3', 'B3', 'G4'], 0.04);
pad(39, 3, ['E3', 'B3', 'G4'], 0.04);
pad(42, 3, ['A2', 'E3', 'C4', 'A4'], 0.045);
pad(45, 3, ['B2', 'F#3', 'D#4', 'A4'], 0.045);
pad(48, 3, ['G2', 'D3', 'B3', 'G4'], 0.05);
[
  [36, 'E2', ['B3', 'G4']],
  [39, 'E2', ['B3', 'G4']],
  [42, 'A2', ['C4', 'E4']],
  [45, 'B2', ['D#4', 'A4']],
  [48, 'G2', ['B3', 'D4']],
].forEach(([b, root, up]) => {
  pz(b, root, 0.34);
  pz(b + 1, up[0], 0.18, 0.2);
  pz(b + 1, up[1], 0.14, 0.3);
  pz(b + 2, up[0], 0.18, 0.2);
  pz(b + 2, up[1], 0.14, 0.3);
});
seq(36, [
  ['E5', 0.5], ['B5', 0.5], ['G5', 0.5], ['B5', 0.5], ['F#5', 0.5], ['A5', 0.5],
  ['G5', 0.5], ['E5', 0.5], ['D#5', 0.5], ['E5', 0.5], ['B4', 1],
  ['C6', 0.5], ['A5', 0.5], ['E5', 0.5], ['A5', 0.5], ['G5', 0.5], ['F#5', 0.5],
  ['D#6', 0.5], ['B5', 0.5], ['F#5', 0.5], ['A5', 0.5], ['G5', 0.5], ['F#5', 0.5],
  ['G5', 0.5], ['B5', 0.5], ['D6', 1], ['G6', 1],
], (b, n) => cel(b, n, 1.0, 0.24, 0.1));
// octave sparkle doubling
seq(36, [['E6', 3], ['E6', 3], ['C7', 3], ['D#7', 3]], (b, n) => cel(b, n, 1.2, 0.06, 0.6));
[37.5, 40.5, 43.5, 46.5].forEach((b, k) => ['E4', 'G4', 'B4', 'E5', 'G5', 'B5'].forEach((n, i) => harp(b + i * 0.1, k === 2 ? ['A3', 'C4', 'E4', 'A4', 'C5', 'E5'][i] : n, 0.08)));

// E — Morning (beats 50–60): music-box reprise and a final E-major chord
pad(50, 6, ['G3', 'B3', 'D4', 'G4'], 0.032, 1.2);
pad(56, 4, ['E3', 'B3', 'G#4', 'E4'], 0.04, 0.6);
seq(50.5, [['B4', 1], ['D5', 1], ['G5', 1.5], ['F#5', 0.5], ['E5', 1], ['D5', 1.2]], (b, n) => cel(b, n, 1.6, 0.16, 0.0));
{
  const tb = fr(T.cues.title) / BEAT;
  ['E3', 'B3', 'E4', 'G#4', 'B4', 'E5', 'G#5', 'B5', 'E6'].forEach((n, i) => harp(tb + i * 0.11, n, 0.16));
  cel(tb + 1.2, 'E6', 2.5, 0.16);
  cel(tb + 1.2, 'B5', 2.5, 0.1);
  pz(tb, 'E2', 0.35);
}

// ========== SOUND EFFECTS ==========
// winter wind & snow outside the window (scene 1)
add(0, whoosh(6.4, 0.35, 0.01, 0.05), 0.07, -0.6);
// mantel clock ticking before midnight
for (let f = 6; f < T.cues.clockChimes[0]; f += 15) add(fr(f), tock(f % 30 ? 1400 : 1150, 0.06), 0.05, -0.5);
// midnight chimes (E3 bell)
T.cues.clockChimes.forEach((f, i) => add(fr(f), bell(mtof(NOTE('E4')), 4.0), 0.2 - i * 0.012, -0.35));
// the doll's eyes and joints
T.cues.eyeTicks.forEach((f) => add(fr(f), tock(1800, 0.05), 0.12, 0.2));
add(fr(T.cues.headCreak), creak(0.8, 240, 380), 0.55, 0.15);
add(fr(T.cues.armCreak), creak(0.55, 300, 470), 0.5, 0.05);
T.cues.armClicks.forEach((f) => add(fr(f), tock(820, 0.1), 0.2, 0.05));
// golden magic dust
sparkle(fr(T.cues.magicBurst), 2.0, 46, 0.1);
add(fr(T.cues.magicBurst - 6), whoosh(2.2, 0.3, 0.02, 0.12), 0.08, 0);
// the clasp: warm swell + shimmer
add(fr(T.cues.handClasp - 10), whoosh(1.6, 0.25, 0.03, 0.2), 0.12, 0);
sparkle(fr(T.cues.handClasp), 1.4, 40, 0.11, 2500, 8000);
// the tree grows
add(fr(T.cues.treeGrowStart), whoosh(2.0, 0.55, 0.005, 0.06), 0.18, -0.2);
for (let i = 0; i < 10; i++) add(fr(T.cues.treeGrowStart) + i * 0.16, creak(0.18, 160 + i * 18, 220 + i * 20), 0.25, -0.3 + i * 0.06);
// gift boxes pop
T.cues.giftPops.forEach((f, i) => {
  add(fr(f), tock(520 + i * 120, 0.14), 0.3, -0.4 + i * 0.4);
  sparkle(fr(f), 0.5, 10, 0.07);
});
// march footsteps (tiny wooden steps on every beat)
for (let f = T.cues.marchStart; f < 540; f += 15) add(fr(f) + 0.01, tock(1300 + ((f / 15) % 2) * 160, 0.05), 0.09, 0.3);
// pop-up paper folds
T.cues.popUps.forEach((f) => add(fr(f), whoosh(0.35, 0.2, 0.08, 0.4), 0.16, 0.3));
// theatre curtain + into the kingdom
add(fr(T.cues.curtainOpen), whoosh(1.2, 0.4, 0.02, 0.12), 0.14, 0);
sparkle(fr(T.cues.kingdomStart), 7, 70, 0.06, 2500, 9000);
// snowflakes swirling (scene 4 → 5)
add(fr(T.cues.snowSwirl), whoosh(2.4, 0.4, 0.01, 0.1), 0.14, 0.4);
// morning birds outside
[[770, 3200, 4100], [778, 3600, 2900], [804, 3000, 3900], [811, 3800, 3100], [872, 3300, 4200]].forEach(([f, a, b]) =>
  add(fr(f), chirp(a, b, 0.08), 0.06, -0.7),
);
// the final wink: one bright "ting"
add(fr(T.cues.blink), celesta(mtof(NOTE('B6')), 1.6, 0.6), 0.22, 0.25);
add(fr(T.cues.blink) + 0.07, celesta(mtof(NOTE('E7')), 1.4, 0.4), 0.14, 0.35);

// ========== MIX: reverb, fades, normalise ==========
function reverb(x, mix = 0.24) {
  const combs = [1557, 1617, 1491, 1422].map((d) => ({d, b: new Float32Array(d), i: 0, s: 0}));
  const aps = [225, 556, 441].map((d) => ({d, b: new Float32Array(d), i: 0}));
  const y = new Float32Array(x.length);
  for (let n = 0; n < x.length; n++) {
    let acc = 0;
    for (const c of combs) {
      const out = c.b[c.i];
      c.s = out * 0.8 + c.s * 0.2;
      c.b[c.i] = x[n] + c.s * 0.84;
      c.i = (c.i + 1) % c.d;
      acc += out;
    }
    acc *= 0.25;
    for (const a of aps) {
      const bo = a.b[a.i];
      const v = -acc + bo;
      a.b[a.i] = acc + bo * 0.5;
      a.i = (a.i + 1) % a.d;
      acc = v;
    }
    y[n] = x[n] * (1 - mix) + acc * mix * 1.6;
  }
  return y;
}
const LR = reverb(L, 0.26);
const RR = reverb(R.map((v, i) => (i > 30 ? R[i - 23] : v)), 0.26);

let peak = 0;
for (let i = 0; i < N; i++) peak = Math.max(peak, Math.abs(LR[i]), Math.abs(RR[i]));
const norm = 0.89 / peak;
const fadeIn = SR * 0.5;
const fadeOut = SR * 1.2;

const data = Buffer.alloc(N * 4);
for (let i = 0; i < N; i++) {
  let g = norm;
  if (i < fadeIn) g *= i / fadeIn;
  if (i > N - fadeOut) g *= (N - i) / fadeOut;
  // gentle soft-clip
  const l = Math.tanh(LR[i] * g * 1.1) / Math.tanh(1.1);
  const r = Math.tanh(RR[i] * g * 1.1) / Math.tanh(1.1);
  data.writeInt16LE(Math.round(l * 32767), i * 4);
  data.writeInt16LE(Math.round(r * 32767), i * 4 + 2);
}
const hdr = Buffer.alloc(44);
hdr.write('RIFF', 0);
hdr.writeUInt32LE(36 + data.length, 4);
hdr.write('WAVE', 8);
hdr.write('fmt ', 12);
hdr.writeUInt32LE(16, 16);
hdr.writeUInt16LE(1, 20);
hdr.writeUInt16LE(2, 22);
hdr.writeUInt32LE(SR, 24);
hdr.writeUInt32LE(SR * 4, 28);
hdr.writeUInt16LE(4, 32);
hdr.writeUInt16LE(16, 34);
hdr.write('data', 36);
hdr.writeUInt32LE(data.length, 40);
const outPath = path.join(__dirname, '../public/audio/score.wav');
fs.writeFileSync(outPath, Buffer.concat([hdr, data]));
console.log(`wrote ${outPath} (${DUR.toFixed(2)} s, peak-normalised ×${norm.toFixed(2)})`);
