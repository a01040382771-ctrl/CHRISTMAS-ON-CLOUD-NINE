// 호두까기 인형 — 구름 위의 크리스마스 / The Nutcracker on Cloud Nine
// A 30-second gouache-style 3D short. The whole film is a pure function of time t,
// so every frame can be rendered deterministically (scripts/render.mjs) or played live.
import * as THREE from 'three';
import { shared, paint } from './materials.js';
import { makeNutcracker, makeClara, makeMouse, makeMouseKing, makeFairy, makeWalnutBoat, mesh } from './characters.js';
import { makeRoom, makeOutside, makeSky, makeMoon, makeCloudSea, makeKingdom, makeSnow, makeStars, makeSparkles } from './world.js';
import { makeGouachePass, makeTitleTextures } from './gouache.js';

export const DURATION = 30;
export const FPS = 24;

THREE.ColorManagement.enabled = false;

// ------------------------------------------------------------------ helpers
const clamp01 = (x) => Math.min(1, Math.max(0, x));
const seg = (t, a, b) => clamp01((t - a) / (b - a));
const sm = (x) => x * x * (3 - 2 * x);
const ease = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
const lerp = (a, b, u) => a + (b - a) * u;
const V = (x, y, z) => new THREE.Vector3(x, y, z);
const hop = (u, h) => Math.sin(Math.PI * clamp01(u)) * h;
const yawTo = (from, to) => Math.atan2(to.x - from.x, to.z - from.z);
const lerpAngle = (a, b, u) => { let d = ((b - a + Math.PI) % (Math.PI * 2)) - Math.PI; if (d < -Math.PI) d += Math.PI * 2; return a + d * u; };

// Hermite (Catmull-Rom tangents, non-uniform time) keyframe track.
function track(keys) {
  const n = keys.length;
  return (t) => {
    if (t <= keys[0][0]) return keys[0].slice(1);
    if (t >= keys[n - 1][0]) return keys[n - 1].slice(1);
    let i = 0; while (t > keys[i + 1][0]) i++;
    const k0 = keys[Math.max(i - 1, 0)], k1 = keys[i], k2 = keys[i + 1], k3 = keys[Math.min(i + 2, n - 1)];
    const h = k2[0] - k1[0], u = (t - k1[0]) / h, u2 = u * u, u3 = u2 * u;
    const out = [];
    for (let c = 1; c < k1.length; c++) {
      const m1 = ((k2[c] - k0[c]) / (k2[0] - k0[0])) * h;
      const m2 = ((k3[c] - k1[c]) / (k3[0] - k1[0])) * h;
      out.push((2 * u3 - 3 * u2 + 1) * k1[c] + (u3 - 2 * u2 + u) * m1 + (-2 * u3 + 3 * u2) * k2[c] + (u3 - u2) * m2);
    }
    return out;
  };
}

// ------------------------------------------------------------------ key positions
const NUT0 = V(-3.0, 0, -4.6);
const NUTB = V(0.5, 0, -6.4);
const CLARA0 = V(1.3, 0, -2.4);
const KING = V(2.7, 0, -7.9);
const HOLE = V(11.5, 0, -15.0);
const WAL = V(0.1, 0, -4.4);
const MICE_T = [V(1.2, 0, -8.6), V(4.0, 0, -7.0), V(3.4, 0, -9.2), V(1.9, 0, -9.6), V(4.4, 0, -8.6)];

// boat flight path
const boatTrack = track([
  [15.3, 0.1, 0, -4.4], [16.0, 0.0, 2.0, -7.2], [16.8, -0.9, 7.6, -12.6], [17.4, -1.0, 9.4, -17.2],
  [18.5, 0.8, 15, -31], [20.0, 5, 30, -58], [21.5, 4, 51, -86], [22.6, 1, 70, -106],
  [23.6, -2, 90, -124], [24.8, -4.5, 97.5, -134], [26.0, -6, 95.15, -141], [30, -6, 95.15, -141],
]);
function boatAt(t) {
  if (t < 15.3) return V(WAL.x, WAL.y, WAL.z);
  const [x, y, z] = boatTrack(t); return V(x, y, z);
}
const BOAT_YAW0 = Math.atan2(-1.1, -11.6) + Math.PI * 2;
function boatYaw(t) {
  if (t < 15.3) return BOAT_YAW0;
  const a = boatAt(Math.min(t, 25.6)), b = boatAt(Math.min(t, 25.6) + 0.05);
  let y = Math.atan2(b.x - a.x, b.z - a.z); if (y < 0) y += Math.PI * 2;
  return y;
}

// camera: room shots (A) -> follow boat (F) -> Cloud Nine (C)
const camA = track([
  [0.0, 13.2, 11.6, -3.4, 17, 12, -13.5, 34],
  [1.6, 12.8, 11.2, -2.8, 16.6, 11.7, -13.5, 34],
  [3.0, 7.5, 7.0, 5.5, 0, 4, -10, 42],
  [4.4, 1.6, 1.7, 0.2, -2.9, 0.9, -4.6, 36],
  [5.6, -0.9, 1.25, -1.9, -3.0, 0.85, -4.6, 32],
  [6.8, -1.1, 1.2, -2.3, -2.9, 0.85, -4.6, 32],
  [7.8, 2.6, 2.0, 1.8, -0.8, 0.8, -4.2, 40],
  [9.0, 4.6, 2.0, -0.2, 1.6, 0.7, -6.6, 40],
  [10.8, 3.8, 1.7, 0.6, 1.8, 0.8, -6.6, 40],
  [11.6, 3.7, 1.65, 0.5, 2.0, 0.85, -6.9, 40],
  [12.6, 3.6, 1.8, 0.2, 1.4, 0.7, -6.2, 40],
  [13.6, 3.4, 1.7, -0.6, 0.3, 0.6, -4.8, 40],
  [15.0, 3.0, 2.4, 0.2, 0.0, 1.4, -6.0, 44],
]);
const followOff = track([
  [15.0, 0, 2.6, -6.5], [17.4, 0.4, 2.0, -6.0], [18.6, 1.5, 2.6, -7.5], [20.2, 6.5, -1.0, -3.0],
  [21.6, 9.0, -2.0, -1.0], [22.6, 7.0, -4.0, 2.0], [23.4, 5.0, 0.0, 6.0],
]);
const followFov = track([[15.0, 44], [18.0, 46], [21.0, 50], [23.4, 46]]);
const camC = track([
  [23.4, 7, 110, -108, -2, 98, -135, 44],
  [24.6, 8, 99.5, -126, -2, 97, -146, 44],
  [26.2, 6, 99, -128, -1, 98.5, -152, 44],
  [27.6, 10, 101, -124, 0, 101, -160, 48],
  [30.0, 13, 104, -119, 0, 102.5, -162, 50],
]);

// ------------------------------------------------------------------ the film
export async function createFilm(canvas, width, height) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, preserveDrawingBuffer: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(1);
  renderer.setSize(width, height, false);
  renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
  renderer.setClearColor(0x101028, 1);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 2000);

  const room = makeRoom(); scene.add(room.group);
  scene.add(makeOutside());
  const sky = makeSky(); scene.add(sky);
  const stars = makeStars(); scene.add(stars);
  const moon = makeMoon(); moon.position.set(-40, 85, -230); scene.add(moon);
  scene.add(makeCloudSea());
  const kingdom = makeKingdom(); scene.add(kingdom.group);
  const snow = makeSnow(); scene.add(snow);
  const sparkles = makeSparkles(); scene.add(sparkles);

  const nut = makeNutcracker(); scene.add(nut);
  const clara = makeClara(); scene.add(clara);
  const king = makeMouseKing(); scene.add(king);
  const mice = MICE_T.map(() => { const m = makeMouse(); scene.add(m); return m; });
  const fairy = makeFairy(); scene.add(fairy);
  const boat = makeWalnutBoat(); scene.add(boat); boat.rotation.order = 'YXZ';
  // the magic walnut (closed) that grows into the boat
  const walnut = new THREE.Group(); scene.add(walnut);
  const wn = mesh(new THREE.SphereGeometry(1, 28, 20), paint('#9a6232', { wobble: 0.16, wobbleFreq: 5, color2: '#7d4a24', stripe: 2.4, axis: 1, rim: 0.4 }), 0, 1, 0, walnut);
  wn.scale.set(0.85, 0.8, 1);
  const seam = mesh(new THREE.TorusGeometry(0.86, 0.05, 6, 32), paint('#6b3d1d'), 0, 1, 0, walnut); seam.rotation.y = Math.PI / 2; seam.scale.set(1, 0.95, 1);
  const flySlipper = new THREE.Group(); scene.add(flySlipper);
  mesh(new THREE.SphereGeometry(0.07, 12, 8), paint('#d83c52'), 0, 0, 0, flySlipper).scale.set(0.6, 0.45, 1.3);
  const flyCrown = king.userData.crown;

  const pass = makeGouachePass(width, height);
  await document.fonts.ready;
  try { await Promise.all([document.fonts.load('700 100px "Gowun Batang"', '호두까기 인형'), document.fonts.load('80px "Nanum Pen Script"', '구름 위의 크리스마스')]); } catch { /* fallback fonts */ }
  const titles = makeTitleTextures(width, height);
  pass.uniforms.tTitle.value = titles.title;
  pass.uniforms.tCaption.value = titles.caption;
  const scale = height / 1080;
  sparkles.material.uniforms.uScale.value = scale * 1000;
  snow.material.uniforms.uScale.value = scale * 900;
  stars.material.uniforms.uScale.value = scale;

  // lighting presets (room / night flight / dawn)
  const L = {
    room: { dir: V(-0.5, 0.75, 0.45).normalize(), key: new THREE.Color(1.0, 0.88, 0.74), shadow: new THREE.Color(0.42, 0.38, 0.62), amb: new THREE.Color(0.06, 0.04, 0.1), rim: new THREE.Color(1.0, 0.75, 0.45), fog: new THREE.Color(0.18, 0.12, 0.2), near: 50, far: 200, amt: 0.4 },
    night: { dir: V(-0.25, 0.7, -0.65).normalize(), key: new THREE.Color(0.78, 0.84, 1.0), shadow: new THREE.Color(0.34, 0.36, 0.64), amb: new THREE.Color(0.05, 0.06, 0.14), rim: new THREE.Color(0.75, 0.85, 1.0), fog: new THREE.Color(0.2, 0.22, 0.45), near: 60, far: 380, amt: 0.65 },
    dawn: { dir: V(0.6, 0.5, 0.6).normalize(), key: new THREE.Color(1.0, 0.9, 0.76), shadow: new THREE.Color(0.52, 0.44, 0.74), amb: new THREE.Color(0.06, 0.04, 0.1), rim: new THREE.Color(1.0, 0.72, 0.78), fog: new THREE.Color(0.98, 0.8, 0.8), near: 80, far: 400, amt: 0.35 },
  };
  function setLight(a, b, u) {
    shared.uLightDir.value.copy(a.dir).lerp(b.dir, u).normalize();
    shared.uKeyColor.value.copy(a.key).lerp(b.key, u);
    shared.uShadowTint.value.copy(a.shadow).lerp(b.shadow, u);
    shared.uAmbient.value.copy(a.amb).lerp(b.amb, u);
    shared.uRimColor.value.copy(a.rim).lerp(b.rim, u);
    shared.uFogColor.value.copy(a.fog).lerp(b.fog, u);
    shared.uFogNear.value = lerp(a.near, b.near, u); shared.uFogFar.value = lerp(a.far, b.far, u); shared.uFogAmt.value = lerp(a.amt, b.amt, u);
  }
  function setPL(i, p, color, intensity, range) {
    shared.uPLPos.value[i].copy(p); shared.uPLColor.value[i].copy(color).multiplyScalar(intensity); shared.uPLRange.value[i] = range;
  }
  const FIRE = new THREE.Color(1.0, 0.55, 0.22), CANDLE = new THREE.Color(1.0, 0.78, 0.45), MAGIC = new THREE.Color(1.0, 0.86, 0.55), PINKG = new THREE.Color(1.0, 0.7, 0.85);

  // sparkle emitters ---------------------------------------------------------
  const spPos = sparkles.geometry.attributes.position, spCol = sparkles.geometry.attributes.color, spSize = sparkles.geometry.attributes.size;
  const GOLD = new THREE.Color(1.0, 0.85, 0.45), WHITE = new THREE.Color(1, 0.97, 0.9), PINK = new THREE.Color(1.0, 0.62, 0.82), BLUE = new THREE.Color(0.65, 0.8, 1.0);
  const h1 = (i) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
  function emitters(t) {
    const out = [];
    // awakening swirl
    if (t > 4.4 && t < 6.6) {
      const life = seg(t, 4.4, 6.6);
      for (let i = 0; i < 70; i++) {
        const ph = h1(i) * 6.28, u = (t * 0.9 + h1(i + 9)) % 1;
        const a = ph + t * 4 + u * 6;
        const r = 0.55 * (1 - u * 0.6);
        out.push([NUT0.x + Math.cos(a) * r, u * 1.6, NUT0.z + Math.sin(a) * r, (60 + h1(i + 3) * 70) * Math.sin(Math.PI * life) * (1 - u * 0.5), i % 3 ? GOLD : WHITE]);
      }
    }
    // walnut glow + burst
    if (t > 13.2 && t < 15.0) {
      const k = seg(t, 13.2, 14.3);
      const burst = seg(t, 14.25, 15.0);
      for (let i = 0; i < 90; i++) {
        const a = h1(i) * 6.28 + t * 3, el = (h1(i + 5) - 0.3) * 1.5;
        const r = burst > 0 ? 1.0 + burst * 3.5 * (0.5 + h1(i + 7)) : 0.4 + k * 1.2;
        const y = burst > 0 ? 1 + Math.sin(el) * r : 0.4 + k * 1.2 + Math.sin(a * 2) * 0.4;
        out.push([WAL.x + Math.cos(a) * r, y, WAL.z + Math.sin(a) * r, (50 + 70 * h1(i + 2)) * (burst > 0 ? 1 - burst : k), i % 2 ? GOLD : PINK]);
      }
    }
    // boat trail
    if (t > 15.2 && t < 27) {
      for (let i = 0; i < 120; i++) {
        const age = (h1(i) + t * 0.8) % 1.0 * 1.4;
        const tt = t - age; if (tt < 15.3) continue;
        const p = boatAt(tt);
        const j = 0.6 * age;
        out.push([p.x + (h1(i + 1) - 0.5) * j * 2, p.y + 0.4 + (h1(i + 2) - 0.5) * j * 2 - age * 0.5, p.z + (h1(i + 3) - 0.5) * j * 2,
          (40 + 80 * h1(i + 4)) * (1 - age / 1.4) * (1 - seg(t, 25.5, 27)), i % 4 === 0 ? PINK : (i % 3 ? GOLD : WHITE)]);
      }
    }
    // Cloud Nine twinkles + fairy fountain
    if (t > 23) {
      const fade = seg(t, 23, 24.5);
      const st = kingdom.group.position.clone().add(kingdom.refs.stage.position);
      for (let i = 0; i < 70; i++) {
        const u = (h1(i) + t * 0.5) % 1;
        const a = h1(i + 1) * 6.28 + t * 1.5;
        const r = 0.4 + u * 2.6;
        out.push([st.x + Math.cos(a) * r, st.y + 2.0 + Math.sin(Math.PI * u) * 3.2, st.z + Math.sin(a) * r, (50 + 60 * h1(i + 2)) * Math.sin(Math.PI * u) * fade, i % 2 ? PINK : WHITE]);
      }
      for (let i = 0; i < 60; i++) {
        const tw = 0.5 + 0.5 * Math.sin(t * (3 + h1(i) * 4) + i);
        out.push([kingdom.group.position.x + (h1(i + 11) - 0.5) * 60, 96 + h1(i + 12) * 26, kingdom.group.position.z + (h1(i + 13) - 0.5) * 50,
          (120 + 160 * h1(i + 14)) * tw * fade, i % 3 ? GOLD : BLUE]);
      }
    }
    return out;
  }

  // ------------------------------------------------------------------ pose
  const tmpV = new THREE.Vector3();
  function poseBase(ch, pos, yaw) { ch.position.copy(pos); ch.rotation.set(0, yaw, 0); const b = ch.userData.body; b.position.set(0, 0, 0); b.rotation.set(0, 0, 0); }
  function resetArms(ch) { for (const k of ['armL', 'armR']) if (ch.userData[k]) ch.userData[k].rotation.set(0, 0, 0); }

  function update(t) {
    const tc = Math.floor(t * 12) / 12; // character poses on twos
    const boil = Math.floor(t * 12);
    shared.uBoil.value = boil % 97;
    pass.uniforms.uBoil.value = boil % 97;
    sky.material.uniforms.uBoil.value = boil % 97;

    // ---------------- boat & walnut
    const bp = boatAt(t), byaw = boatYaw(t);
    const grow = seg(t, 13.35, 14.25);
    walnut.visible = t < 14.3;
    walnut.position.copy(WAL);
    const ws = lerp(0.2, 1.0, ease(grow)) * (1 + 0.04 * Math.sin(t * 30) * grow);
    walnut.scale.setScalar(ws);
    walnut.rotation.set(0, BOAT_YAW0 + Math.PI / 2, Math.sin(tc * 8) * 0.06 * grow);
    boat.visible = t >= 14.3;
    const pop = sm(seg(t, 14.3, 14.6));
    boat.position.copy(bp);
    const climb = t > 15.3 && t < 25.8 ? (() => { const a = boatAt(t), b = boatAt(t + 0.05); return Math.atan2(b.y - a.y, Math.hypot(b.x - a.x, b.z - a.z)); })() : 0;
    const settle = t > 25.8 ? Math.sin((t - 25.8) * 5) * Math.exp(-(t - 25.8) * 2.5) * 0.08 : 0;
    boat.rotation.set(-climb * 0.45 + settle, byaw, Math.sin(t * 1.7) * 0.06 * (t > 15.3 ? 1 : 0));
    if (t > 15.3 && t < 26) boat.position.y += Math.sin(t * 2.3) * 0.12 * seg(t, 15.5, 16.5);
    boat.scale.setScalar(lerp(0.8, 1, pop) * (1 + 0.08 * Math.sin(seg(t, 14.3, 14.8) * Math.PI)));
    boat.userData.shadow.visible = t < 16;
    boat.userData.shadow.material.uniforms.uStrength.value = 0.45 * (1 - seg(t, 15.3, 16));
    boat.userData.rig.scale.y = sm(seg(t, 14.5, 15.0)) * 0.99 + 0.01;
    boat.userData.sail.scale.set(1 + 0.06 * Math.sin(t * 7), 1, 1);
    boat.updateMatrixWorld(true);

    // ---------------- nutcracker
    resetArms(nut);
    nut.userData.jaw.rotation.set(0, 0, 0); nut.userData.head.rotation.set(0, 0, 0);
    const seatN = V(-0.28, 0.22, 0.45), seatC = V(0.3, 0.22, -0.6);
    const yawNC = yawTo(NUT0, CLARA0);
    if (tc < 8.6) {
      let yaw = 0.3; let y = 0;
      if (tc >= 5.9) { const u = seg(tc, 5.9, 6.3); yaw = lerpAngle(0.3, yawNC, ease(u)); y = hop(u, 0.35); }
      poseBase(nut, NUT0, yaw); nut.position.y = y;
      nut.userData.body.rotation.z = tc > 4.5 && tc < 5.9 ? Math.sin(tc * 20) * 0.04 * seg(tc, 4.5, 5.0) : 0;
      const clack = (a) => hop(seg(tc, a, a + 0.25), 0.5);
      nut.userData.jaw.rotation.x = clack(5.15) + clack(5.55);
      nut.userData.head.rotation.z = tc > 5.0 && tc < 5.9 ? 0.12 : 0;
      if (tc > 6.3) { const s = sm(seg(tc, 6.3, 6.65)) * (1 - sm(seg(tc, 7.6, 8.0))); nut.userData.armR.rotation.x = -2.7 * s; nut.userData.armR.rotation.z = 0.25 * s; }
      // breathing / idle wobble
      nut.userData.body.position.y = tc > 6.3 ? Math.abs(Math.sin(tc * 3)) * 0.02 : 0;
    } else if (tc < 14.6) {
      // march to the mouse king, duel, victory, bow
      const u = ease(seg(tc, 8.6, 10.0));
      const p = NUT0.clone().lerp(NUTB, u);
      let yaw = lerpAngle(yawNC, yawTo(NUT0, NUTB), sm(seg(tc, 8.6, 8.9)));
      yaw = lerpAngle(yaw, yawTo(NUTB, KING), sm(seg(tc, 9.7, 10.0)));
      poseBase(nut, p, yaw);
      if (tc < 10.0) nut.position.y = Math.abs(Math.sin(tc * 14)) * 0.08 * (u < 1 ? 1 : 0);
      nut.userData.armR.rotation.x = -1.3;
      nut.userData.armL.rotation.x = Math.sin(tc * 14) * 0.5 * (tc < 10 ? 1 : 0);
      if (tc >= 10.0 && tc < 11.7) {
        const ph = (tc - 10.0) / 0.4; const sw = Math.sin(ph * Math.PI);
        nut.userData.armR.rotation.x = -1.2 - 1.0 * sw;
        nut.userData.armR.rotation.y = 0.5 * Math.cos(ph * Math.PI);
        const fwd = V(Math.sin(yaw), 0, Math.cos(yaw));
        nut.position.addScaledVector(fwd, 0.18 * Math.max(0, Math.sin(ph * Math.PI * 0.5 + 0.3)));
        nut.userData.body.rotation.x = 0.1 * sw;
      }
      if (tc >= 12.0) { // victory: sword raised, then bow toward Clara
        const v = sm(seg(tc, 12.0, 12.3)) * (1 - sm(seg(tc, 12.9, 13.2)));
        nut.userData.armR.rotation.x = lerp(-1.3, -2.8, v);
        nut.position.y = hop(seg(tc, 12.0, 12.35), 0.25);
        const turn = sm(seg(tc, 12.8, 13.1));
        nut.rotation.y = lerpAngle(yaw, yawTo(NUTB, CLARA0), turn);
        const bow = hop(seg(tc, 13.1, 13.9), 1);
        nut.userData.body.rotation.x = 0.45 * bow; nut.userData.armL.rotation.x = -0.6 * bow;
        nut.userData.armR.rotation.x = lerp(nut.userData.armR.rotation.x, -0.5, turn);
        if (tc > 14.0) { nut.userData.armR.rotation.x = -0.5; nut.rotation.y = lerpAngle(nut.rotation.y, yawTo(NUTB, WAL), sm(seg(tc, 14.0, 14.3))); }
      }
    } else {
      // jump into the boat, ride, wave
      const u = seg(tc, 14.6, 15.2);
      if (u < 1) {
        const target = boat.localToWorld(seatN.clone());
        const p = NUTB.clone().lerp(target, ease(u)); p.y = lerp(0, target.y, u) + hop(u, 1.1);
        poseBase(nut, p, lerpAngle(yawTo(NUTB, WAL), byaw, u));
        nut.userData.armR.rotation.x = -1.6 * Math.sin(Math.PI * u); nut.userData.armL.rotation.x = -1.6 * Math.sin(Math.PI * u);
      } else {
        boat.localToWorld(tmpV.copy(seatN)); poseBase(nut, tmpV, byaw);
        nut.quaternion.copy(boat.quaternion);
        nut.userData.armR.rotation.x = t > 15.3 && t < 17.6 ? -2.6 : -0.6; // points the way, sword up
        if (t > 25.8) { const w = sm(seg(tc, 25.8, 26.2)); nut.userData.armL.rotation.z = -2.6 * w + Math.sin(tc * 10) * 0.3 * w; nut.userData.armR.rotation.x = -2.8 * w; }
      }
    }
    nut.userData.shadow.visible = tc < 14.6 || t < 15.25;

    // ---------------- Clara
    resetArms(clara);
    clara.userData.head.rotation.set(0, 0, 0);
    clara.userData.slipper.visible = tc < 11.35;
    if (tc < 14.6) {
      let yaw = yawTo(CLARA0, NUT0);
      if (tc > 8.8) yaw = lerpAngle(yaw, yawTo(CLARA0, KING), sm(seg(tc, 8.8, 9.3)));
      if (tc > 12.9) yaw = lerpAngle(yaw, yawTo(CLARA0, NUTB), sm(seg(tc, 12.9, 13.2)));
      poseBase(clara, CLARA0, yaw);
      clara.userData.body.rotation.z = Math.sin(tc * 2.2) * 0.025;
      if (tc > 6.8 && tc < 8.6) { // delighted clap
        const c = sm(seg(tc, 6.8, 7.1)) * (1 - sm(seg(tc, 8.2, 8.6)));
        clara.userData.armL.rotation.set(-1.25 * c, 0, (-0.45 + Math.sin(tc * 24) * 0.12) * c);
        clara.userData.armR.rotation.set(-1.25 * c, 0, (0.45 - Math.sin(tc * 24) * 0.12) * c);
        clara.position.y = hop(seg(tc, 7.2, 7.5), 0.15);
      }
      if (tc > 8.8 && tc < 10.6) { // gasp: hands to cheeks, step back
        const c = sm(seg(tc, 8.8, 9.1));
        clara.userData.armL.rotation.set(-2.3 * c, 0, -0.6 * c);
        clara.userData.armR.rotation.set(-2.3 * c, 0, 0.6 * c);
        clara.userData.body.rotation.x = -0.12 * c;
      }
      if (tc >= 10.6 && tc < 11.8) { // the slipper throw
        const wind = sm(seg(tc, 10.7, 11.2));
        const fling = sm(seg(tc, 11.25, 11.45));
        clara.userData.armR.rotation.x = lerp(-3.0 * wind, -1.0, fling);
        clara.userData.body.rotation.x = -0.15 * wind + 0.25 * fling;
        clara.userData.armL.rotation.x = -0.8 * wind;
      }
      if (tc >= 11.8 && tc < 12.9) { const c = sm(seg(tc, 11.9, 12.2)); clara.position.y = hop(seg(tc, 12.0, 12.4), 0.25); clara.userData.armL.rotation.set(-2.8 * c, 0, -0.3 * c); clara.userData.armR.rotation.set(-2.8 * c, 0, 0.3 * c); }
    } else {
      const u = seg(tc, 14.75, 15.25);
      if (u < 1) {
        const target = boat.localToWorld(seatC.clone());
        const p = CLARA0.clone().lerp(target, ease(u)); p.y = lerp(0, target.y, u) + hop(u, 1.0);
        poseBase(clara, p, lerpAngle(yawTo(CLARA0, WAL), byaw, u));
        clara.userData.armL.rotation.x = -2.2 * Math.sin(Math.PI * u); clara.userData.armR.rotation.x = -2.2 * Math.sin(Math.PI * u);
      } else {
        boat.localToWorld(tmpV.copy(seatC)); poseBase(clara, tmpV, byaw);
        clara.quaternion.copy(boat.quaternion);
        clara.userData.armR.rotation.set(-0.9, 0, 0.5); clara.userData.armL.rotation.set(-0.5, 0, -0.3);
        if (t > 17.5 && t < 25.5) { clara.userData.armL.rotation.set(-2.0, 0, -0.9 + Math.sin(tc * 6) * 0.2); clara.userData.head.rotation.y = Math.sin(t * 0.8) * 0.4; }
        if (t > 25.8) { const w = sm(seg(tc, 25.9, 26.3)); clara.userData.armR.rotation.set(-2.5 * w, 0, 0.6 * w + Math.sin(tc * 11) * 0.35 * w); }
      }
    }
    clara.userData.shadow.visible = tc < 14.75 || t < 15.25;

    // the flying slipper
    flySlipper.visible = tc >= 11.35 && tc < 13.2;
    if (flySlipper.visible) {
      const p0 = V(CLARA0.x, 1.2, CLARA0.z), p2 = V(KING.x, 1.0, KING.z);
      if (tc < 11.9) {
        const u = seg(tc, 11.35, 11.9);
        const p = p0.clone().lerp(p2, u); p.y += hop(u, 1.4);
        flySlipper.position.copy(p); flySlipper.rotation.set(tc * 20, tc * 7, 0);
      } else {
        const u = seg(tc, 11.9, 12.4);
        const land = V(KING.x - 0.8, 0.05, KING.z + 0.9);
        const p = p2.clone().lerp(land, u); p.y = lerp(1.0, 0.05, u) + hop(u, 0.6);
        flySlipper.position.copy(p); flySlipper.rotation.set(u * 8, 1, u < 1 ? u * 5 : 0.2);
      }
    }

    // ---------------- mice
    mice.forEach((m, i) => {
      const t0 = 8.0 + i * 0.25, t1 = t0 + 1.4;
      const f0 = 12.1 + i * 0.12, f1 = f0 + 0.9;
      const target = MICE_T[i];
      let p, yaw;
      if (tc < t1) { const u = seg(tc, t0, t1); p = HOLE.clone().lerp(target, ease(u)); yaw = yawTo(HOLE, target); if (u >= 1) yaw = yawTo(target, NUTB); }
      else if (tc < f0) { p = target.clone(); yaw = lerpAngle(yawTo(HOLE, target), yawTo(target, NUTB), sm(seg(tc, t1, t1 + 0.3))); }
      else { const u = seg(tc, f0, f1); p = target.clone().lerp(HOLE, ease(u)); yaw = yawTo(target, HOLE); }
      const moving = (tc > t0 && tc < t1) || (tc > f0 && tc < f1);
      poseBase(m, p, yaw);
      m.userData.body.position.y = moving ? Math.abs(Math.sin(tc * 34 + i)) * 0.07 : Math.abs(Math.sin(tc * 6 + i)) * 0.02;
      m.userData.body.rotation.x = moving ? 0.1 : 0;
      const atHole = Math.min(seg(tc, t0, t0 + 0.25), 1 - seg(tc, f1 - 0.2, f1));
      m.visible = tc > t0 && tc < f1;
      m.scale.setScalar(0.4 + 0.6 * atHole);
    });

    // ---------------- mouse king
    resetArms(king);
    king.userData.head.rotation.set(0, 0, 0);
    {
      const kIn0 = 9.0, kIn1 = 10.0, kOut0 = 12.45, kOut1 = 13.5;
      king.visible = tc > kIn0 && tc < kOut1;
      let p = KING.clone(); let yaw = yawTo(KING, NUTB);
      if (tc < kIn1) { const u = seg(tc, kIn0, kIn1); p = HOLE.clone().lerp(KING, ease(u)); yaw = lerpAngle(yawTo(HOLE, KING), yawTo(KING, NUTB), sm(seg(tc, 9.7, 10.0))); }
      poseBase(king, p, yaw);
      if (tc < kIn1) king.userData.body.position.y = Math.abs(Math.sin(tc * 12)) * 0.08;
      king.userData.armR.rotation.x = -1.2;
      king.userData.armL.rotation.set(-0.4, 0, -0.4);
      if (tc >= 10.0 && tc < 11.7) {
        const ph = (tc - 10.0) / 0.4 + 1; const sw = Math.sin(ph * Math.PI);
        king.userData.armR.rotation.x = -1.2 - 1.0 * sw; king.userData.armR.rotation.y = -0.5 * Math.cos(ph * Math.PI);
        const fwd = V(Math.sin(yaw), 0, Math.cos(yaw));
        king.position.addScaledVector(fwd, 0.15 * Math.max(0, Math.sin(ph * Math.PI * 0.5 + 0.3)));
      }
      if (tc >= 11.9) { // bonk! stagger, dizzy spin, flee
        const s = seg(tc, 11.9, 12.45);
        king.userData.body.rotation.x = -0.35 * hop(s, 1);
        king.userData.head.rotation.z = Math.sin(tc * 18) * 0.3 * (1 - seg(tc, 12.3, 12.6));
        king.rotation.y = yaw + ease(s) * Math.PI * 2;
        king.userData.armR.rotation.x = -0.3; king.userData.armL.rotation.x = -2.6 * hop(s, 1);
      }
      if (tc >= kOut0) { const u = seg(tc, kOut0, kOut1); king.position.copy(KING.clone().lerp(HOLE, ease(u))); king.rotation.y = yawTo(KING, HOLE); king.userData.body.position.y = Math.abs(Math.sin(tc * 30)) * 0.1; king.userData.body.rotation.x = 0.35; king.scale.setScalar(1 - 0.6 * seg(tc, kOut1 - 0.2, kOut1)); }
      else king.scale.setScalar(1);
      // crown flies off on the hit
      if (tc >= 11.9) {
        const u = seg(tc, 11.9, 12.5);
        flyCrown.position.set(-0.7 * u, 0.15 + hop(u, 0.9) - 0.9 * u, 0.2 * u);
        flyCrown.rotation.set(u * 9, 0, u * 4);
        if (u >= 1) { flyCrown.position.set(-0.7, -0.75, 0.2); flyCrown.rotation.set(0.3, 0, 1.6); }
      } else { flyCrown.position.set(0, 0.15, 0); flyCrown.rotation.set(0, 0, 0); }
    }

    // ---------------- fairy
    fairy.visible = t > 22.5;
    fairy.position.copy(kingdom.group.position).add(kingdom.refs.stage.position); fairy.position.y += 1.82;
    fairy.rotation.set(0, t * 7.5, 0);
    fairy.userData.body.position.y = Math.abs(Math.sin(t * 3.75)) * 0.06;
    fairy.scale.setScalar(2.0);

    // ---------------- set dressing
    const clockU = sm(seg(t, 0.55, 0.75));
    room.refs.clockHand.rotation.z = lerp(0.12, 0, clockU);
    room.refs.pendulum.rotation.z = Math.sin(t * Math.PI) * 0.18;
    room.refs.owl.rotation.y = Math.sin(tc * 3) * 0.6 * (1 - seg(tc, 3.0, 3.6));
    room.refs.owl.position.y = 15.2 + hop((tc % 1.2) / 0.4, 0.15) * (tc < 3 ? 1 : 0);
    room.refs.fire.forEach((f, i) => { f.scale.set(1 + 0.15 * Math.sin(tc * 13 + i), 1 + 0.3 * Math.sin(tc * 9 + i * 2.1), 1); });
    room.refs.flames.forEach((f, i) => { f.scale.y = 1.8 + 0.4 * Math.sin(tc * 11 + i); });
    room.refs.star.rotation.y = Math.sin(t * 0.8) * 0.3;
    const open = ease(seg(t, 15.4, 16.4));
    room.refs.panes.forEach(({ hinge, side }) => { hinge.rotation.y = (side < 0 ? 1 : -1) * 1.75 * open + Math.sin(tc * 13) * 0.04 * open * (side); });
    kingdom.refs.lolli.forEach((l, i) => { l.rotation.y = Math.sin(t * 0.7 + i) * 0.2; });

    // ---------------- camera
    const a = camA(t);
    const off = followOff(t);
    const fwdB = V(Math.sin(byaw), 0, Math.cos(byaw));
    const rightB = V(Math.cos(byaw), 0, -Math.sin(byaw));
    const bpos = bp.clone();
    const fPos = bpos.clone().addScaledVector(rightB, off[0]).add(V(0, off[1], 0)).addScaledVector(fwdB, off[2]);
    const fLook = bpos.clone().add(V(0, 1.1, 0)).addScaledVector(fwdB, 2.5);
    const c = camC(t);
    let pos = V(a[0], a[1], a[2]), look = V(a[3], a[4], a[5]), fov = a[6];
    const w1 = sm(seg(t, 14.6, 15.9));
    pos.lerp(fPos, w1); look.lerp(fLook, w1); fov = lerp(fov, followFov(t)[0], w1);
    const w2 = sm(seg(t, 23.0, 24.4));
    pos.lerp(V(c[0], c[1], c[2]), w2); look.lerp(V(c[3], c[4], c[5]), w2); fov = lerp(fov, c[6], w2);
    // hand-held drift + impact shake
    pos.x += Math.sin(t * 0.9) * 0.04; pos.y += Math.sin(t * 1.3 + 1) * 0.03;
    const shake = Math.exp(-Math.max(0, t - 11.9) * 6) * (t > 11.9 ? 1 : 0);
    look.x += Math.sin(t * 70) * 0.05 * shake; look.y += Math.cos(t * 63) * 0.05 * shake;
    camera.position.copy(pos); camera.lookAt(look); camera.fov = fov; camera.updateProjectionMatrix();

    // ---------------- light, sky, atmosphere
    const toNight = sm(seg(t, 17.0, 18.0)), toDawn = sm(seg(t, 22.4, 23.6));
    if (toDawn > 0) setLight(L.night, L.dawn, toDawn); else setLight(L.room, L.night, toNight);
    const flick = 1 + 0.12 * Math.sin(tc * 17) + 0.08 * Math.sin(tc * 29);
    const inRoom = 1 - toNight;
    setPL(0, V(9, 2.6, -12.8), FIRE, 1.5 * flick * inRoom, 22);
    setPL(1, V(-11, 7, -5.5), CANDLE, 0.9 * inRoom, 17);
    let magic = 0; const mp = V();
    if (t > 4.4 && t < 6.8) { magic = Math.sin(Math.PI * seg(t, 4.4, 6.8)) * 1.6; mp.copy(NUT0).add(V(0, 0.9, 0.4)); }
    else if (t > 13.2 && t < 15.3) { magic = Math.sin(Math.PI * seg(t, 13.2, 15.3)) * 2.0; mp.copy(WAL).add(V(0, 1.2, 0.6)); }
    else if (t >= 15.3) { magic = 0.9; boat.userData.lantern.getWorldPosition(mp); }
    setPL(2, mp, MAGIC, magic, t >= 15.3 ? 5 : 5);
    setPL(3, fairy.position.clone().add(V(0, 2, 0)), PINKG, t > 23 ? 1.0 : 0, 12);
    const dawn = sm(seg(t, 21.8, 24.0));
    sky.material.uniforms.uDawn.value = dawn;
    sky.position.copy(camera.position);
    stars.position.copy(camera.position);
    stars.material.uniforms.uTime.value = t; stars.material.uniforms.uAmt.value = 1 - dawn;
    moon.visible = t < 23;
    moon.scale.setScalar(1 - dawn * 0.3);
    snow.material.uniforms.uTime.value = t; snow.material.uniforms.uCam.value.copy(camera.position);
    snow.material.uniforms.uAmt.value = 1 - seg(t, 20.5, 22.5);
    snow.material.uniforms.uWind.value = t > 15.3 ? 1.5 : 0.3;

    // ---------------- sparkles
    const list = emitters(t);
    const n = sparkles.userData.count;
    for (let i = 0; i < n; i++) {
      const e = list[i];
      if (e) { spPos.setXYZ(i, e[0], e[1], e[2]); spCol.setXYZ(i, e[4].r, e[4].g, e[4].b); spSize.setX(i, e[3] / 1000 * 0.9); }
      else spSize.setX(i, 0);
    }
    spPos.needsUpdate = spCol.needsUpdate = spSize.needsUpdate = true;

    // ---------------- post: whiteout through the cloud layer, lettering
    pass.uniforms.uWhite.value = 0.85 * Math.exp(-Math.pow((t - 23.05) / 0.4, 2));
    pass.uniforms.uWhiteCol.value.setRGB(0.97, 0.93, 0.95);
    pass.uniforms.uCaption.value = sm(seg(t, 0.6, 2.2)) * (1 - sm(seg(t, 3.6, 4.4)));
    pass.uniforms.uTitle.value = sm(seg(t, 27.4, 29.0));
    pass.uniforms.uReveal.value = sm(seg(t, 0.0, 1.1));
  }

  function renderAt(t) {
    update(t);
    pass.render(renderer, scene, camera);
  }
  return { renderer, renderAt, camera, scene };
}
