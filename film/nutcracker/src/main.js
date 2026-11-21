import * as THREE from 'three';
import { SHOTS, TRANSITIONS, DURATION } from './shots.js';
import { createPost } from './post.js';
import { clamp, ramp } from './util.js';

const W = 1280, H = 720;
const canvas = document.createElement('canvas');
canvas.width = W; canvas.height = H; document.body.appendChild(canvas);
const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, preserveDrawingBuffer: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(1); renderer.setSize(W, H, false);
renderer.outputColorSpace = THREE.SRGBColorSpace;
const post = createPost(renderer, W, H);

const shots = SHOTS.map((s) => ({ ...s, ...s.build() }));

// ------------------------------------------------------------------ lettering
const tc = document.createElement('canvas'); tc.width = W; tc.height = H;
const tctx = tc.getContext('2d');
const textTex = new THREE.CanvasTexture(tc);
textTex.colorSpace = THREE.NoColorSpace; textTex.flipY = true;

const SERIF = '"Gowun Batang", serif';
const CAPTIONS = [
  { t0: 0.5, t1: 4.3, kind: 'title' },
  { t0: 6.0, t1: 9.4, text: '왕자와 함께 떠나는 밤의 여행', color: '#fbf1e2' },
  { t0: 11.1, t1: 14.6, text: '눈꽃 요정들의 춤', color: '#4b3a66' },
  { t0: 16.0, t1: 18.6, text: '생쥐 대왕과의 결투', color: '#fbf1e2' },
  { t0: 22.0, t1: 23.8, text: '마법이 풀리고', color: '#5a2f45' },
  { t0: 24.0, t1: 26.0, text: '두 사람은 결혼식을 올렸어요', color: '#5a2f45' },
  { t0: 27.7, t1: 30.5, text: '……모든 것은 크리스마스 밤의 꿈이었어요', color: '#4a3326', kind: 'end' },
  { t0: 29.0, t1: 31.0, kind: 'merry' },
];
function paintText(t) {
  tctx.clearRect(0, 0, W, H);
  tctx.textBaseline = 'middle';
  for (const c of CAPTIONS) {
    if (t < c.t0 - 0.01 || t > c.t1) continue;
    const a = clamp((t - c.t0) / 0.5) * clamp((c.t1 - t) / 0.5);
    const rise = (1 - clamp((t - c.t0) / 0.8)) * 8;
    tctx.save(); tctx.globalAlpha = a;
    if (c.kind === 'title') {
      tctx.textAlign = 'center';
      tctx.shadowColor = 'rgba(40,20,25,0.55)'; tctx.shadowBlur = 18;
      tctx.fillStyle = '#fbecd2'; tctx.font = `700 82px ${SERIF}`; tctx.fillText('호두까기 인형', W / 2, 128 + rise);
      tctx.font = `400 26px ${SERIF}`; tctx.fillStyle = '#f4d9b8'; tctx.fillText('— 크리스마스 이브, 클라라의 이야기 —', W / 2, 196 + rise);
      tctx.fillStyle = '#e7c27a'; for (const s of [-1, 1]) { tctx.beginPath(); tctx.arc(W / 2 + s * 270, 128 + rise, 5, 0, 7); tctx.fill(); }
    } else if (c.kind === 'merry') {
      tctx.textAlign = 'center'; tctx.fillStyle = '#9a3b3f'; tctx.font = `700 46px ${SERIF}`;
      tctx.fillText('Merry Christmas', W / 2, H / 2 + 40 + rise);
    } else if (c.kind === 'end') {
      const k = ramp(t, 29.0, 29.7);
      tctx.font = `400 34px ${SERIF}`;
      const y = (H - 96) * (1 - k) + (H / 2 - 30) * k + rise, tw = tctx.measureText(c.text).width;
      tctx.save(); tctx.filter = 'blur(18px)'; tctx.globalAlpha = a * 0.6 * (1 - k); tctx.fillStyle = '#fff6ec'; tctx.fillRect(W / 2 - tw / 2 - 30, y - 34, tw + 60, 68); tctx.restore();
      tctx.textAlign = 'center'; tctx.fillStyle = c.color;
      tctx.shadowColor = 'rgba(255,248,235,0.9)'; tctx.shadowBlur = 14 * (1 - k);
      tctx.fillText(c.text, W / 2, (H - 96) * (1 - k) + (H / 2 - 30) * k + rise);
    } else {
      tctx.font = `400 32px ${SERIF}`;
      const tw = tctx.measureText(c.text).width; const light = c.color === '#fbf1e2';
      tctx.save(); tctx.filter = 'blur(16px)'; tctx.globalAlpha = a * (light ? 0.38 : 0.55); tctx.fillStyle = light ? '#2a1e30' : '#fff6ec';
      tctx.fillRect(56, H - 116 + rise, tw + 48, 66); tctx.restore();
      tctx.textAlign = 'left'; tctx.fillStyle = c.color;
      tctx.shadowColor = c.color === '#fbf1e2' ? 'rgba(30,20,40,0.6)' : 'rgba(255,245,240,0.8)'; tctx.shadowBlur = 12;
      tctx.fillText(c.text, 78, H - 86 + rise);
      tctx.globalAlpha = a * 0.8; tctx.fillRect(80, H - 60 + rise, 46 * clamp((t - c.t0) / 0.9), 2);
    }
    tctx.restore();
  }
  textTex.needsUpdate = true;
}

// ------------------------------------------------------------------ timeline
const WHITE = new THREE.Color('#fff8ec'), PAPER = new THREE.Color('#f3ead9');
function renderAt(t) {
  let idx = 0; for (let i = 0; i < shots.length; i++) if (t >= shots[i].start) idx = i;
  let a = shots[idx], b = null, mix = 0, fade = 0, fadeCol = WHITE;
  // transition into the current shot (t just after its start) or into the next (t just before its end)
  for (const k of [idx, idx + 1]) {
    const tr = TRANSITIONS[k]; if (!tr || !shots[k]) continue;
    const B = shots[k].start, d = t - B;
    if (Math.abs(d) >= tr.half) continue;
    if (tr.type === 'paint') { a = shots[k - 1]; b = shots[k]; mix = (d + tr.half) / (2 * tr.half); }
    else { a = d < 0 ? shots[k - 1] : shots[k]; fade = 1 - Math.abs(d) / tr.half; fade = fade * fade * (3 - 2 * fade); }
  }
  a.update(t - a.start); if (b) b.update(t - b.start);
  // open from paper, close on paper
  fade = Math.max(fade, 1 - ramp(t, 0.0, 0.7));
  const endFade = ramp(t, 29.0, 29.8);
  if (endFade > fade) { fade = endFade; fadeCol = PAPER; }
  if (t < 0.7) fadeCol = PAPER;
  paintText(t);
  post.render({ a, b, mix, seed: Math.floor(t * 12) % 97, fade, fadeCol, textTex });
}

window.renderAt = renderAt;
window.DURATION = DURATION;
window.__ready = (async () => {
  await Promise.all([document.fonts.load(`700 82px "Gowun Batang"`, '호두까기 인형'), document.fonts.load(`400 32px "Gowun Batang"`, '눈꽃 요정들의 춤 Merry')]);
  await document.fonts.ready;
  return true;
})();

// interactive preview: index.html            → plays in real time
//                      index.html?t=12.3     → still frame
const qs = new URLSearchParams(location.search);
window.__ready.then(() => {
  if (qs.has('capture')) return;
  if (qs.has('t')) { renderAt(parseFloat(qs.get('t'))); return; }
  const t0 = performance.now();
  const loop = () => { const t = ((performance.now() - t0) / 1000) % DURATION; renderAt(t); requestAnimationFrame(loop); };
  loop();
});
