import * as THREE from 'three';
import { clamp, lerp, smooth, ramp, kf, rng, M, G, mesh, group, glowSprite, skyDome, particles, Glow } from './util.js';
import { makeClara, makeNutcracker, makeMouse, makeFairy, makeSnowflake } from './characters.js';
import { parlor, pine, snowGround, walnutSleigh, candyPalace, lollipop, flowerArch, cloudPuff, armchair, christmasTree } from './props.js';

const ASPECT = 16 / 9;
const cam = (fov = 38) => new THREE.PerspectiveCamera(fov, ASPECT, 0.1, 200);
const setCam = (c, pos, look) => { c.position.set(...pos); c.lookAt(...look); };
const face = (obj, from, to) => { obj.rotation.y = Math.atan2(to[0] - from[0], to[2] - from[2]); };
const lights = (scene, { sky, ground, hemi = 1.0, dir = '#fff', dirI = 1.2, dirPos = [4, 8, 5] }) => {
  scene.add(new THREE.HemisphereLight(sky, ground, hemi));
  const d = new THREE.DirectionalLight(dir, dirI); d.position.set(...dirPos); scene.add(d);
  return d;
};

function walk(ch, phase, amt = 1) {
  const s = Math.sin(phase);
  if (ch.legs) { ch.legs[0].rotation.x = s * 0.5 * amt; ch.legs[1].rotation.x = -s * 0.5 * amt; }
  ch.body.position.y = Math.abs(Math.cos(phase)) * 0.035 * amt;
  ch.body.rotation.z = s * 0.03 * amt;
}
function resetPose(ch) {
  ch.arms.forEach((a, i) => { a.rotation.set(0, 0, (i ? 1 : -1) * 0.15); });
  if (ch.legs) ch.legs.forEach((l) => l.rotation.set(0, 0, 0));
  ch.body.position.set(0, 0, 0); ch.body.rotation.set(0, 0, 0); ch.head.rotation.set(0, 0, 0);
}

// sparkle cloud made of glow sprites with procedural motion
function sparkles(n, color, seed, size = 0.25) {
  const g = new THREE.Group(); const R = rng(seed);
  const items = [];
  for (let i = 0; i < n; i++) { const s = glowSprite(color, size, 0.9); g.add(s); items.push({ s, a: R() * 6.28, r: R(), h: R(), sp: 0.5 + R() }); }
  g.userData.items = items; return g;
}

// =====================================================================
// SHOT 1 — 만남 : the nutcracker comes alive beneath a towering dream-tree
// =====================================================================
function shotMeet() {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#2b1f2a');
  scene.fog = new THREE.Fog('#3a2733', 9, 22);
  lights(scene, { sky: '#ffd9b0', ground: '#3a2a3a', hemi: 0.9, dir: '#ffe2c0', dirI: 0.9, dirPos: [-3, 6, 4] });
  const treeLight = new THREE.PointLight('#ffc27a', 18, 12, 1.6); treeLight.position.set(-1.0, 3, -0.8); scene.add(treeLight);
  const winLight = new THREE.PointLight('#9fb6ff', 0, 10, 1.5); winLight.position.set(2.8, 2.5, -2.8); scene.add(winLight);
  const room = parlor({ bigTree: true }); scene.add(room);
  const clara = makeClara({ dress: '#f3c4cb' }); scene.add(clara.root);
  const nut = makeNutcracker(); scene.add(nut.root);
  const spark = sparkles(26, '#ffe08a', 4, 0.22); scene.add(spark);
  const dust = particles({ count: 260, area: [10, 6, 8], center: [0.5, 0, -0.5], size: 0.05, speed: -0.25, sway: 0.25, colors: ['#ffe3a3', '#ffd0e0', '#fff'], additive: true, opacity: 0.7, seed: 21 });
  scene.add(dust);
  const camera = cam(36);
  const paneMat = room.userData.pane.material; const paneBase = paneMat.color.clone();

  const N0 = [-0.4, 0, 0.35], N1 = [0.8, 0, 0.05], N2 = [2.0, 0, -2.95];
  const C0 = [2.15, 0, -0.45], C2 = [2.75, 0, -2.95];

  function update(lt) {
    dust.userData.setTime(lt + 3);
    resetPose(clara); resetPose(nut);
    // fire / tree lights flicker
    room.userData.fire.scale.y = 1 + Math.sin(lt * 17) * 0.08 + Math.sin(lt * 7.3) * 0.06;
    room.userData.tree.userData.lights.forEach((l, i) => l.scale.setScalar(0.8 + 0.4 * Math.sin(lt * 3 + i)));

    // --- the toy wakes (0 – 1.3)
    const alive = ramp(lt, 0.6, 1.3);
    spark.userData.items.forEach((it, i) => {
      const a = it.a + lt * 2.2 * it.sp, r = 0.45 + it.r * 0.35, k = clamp(1.4 - lt * 0.6);
      it.s.position.set(nut.root.position.x + Math.cos(a) * r, 0.2 + ((it.h + lt * 0.35 * it.sp) % 1) * 2.0, nut.root.position.z + Math.sin(a) * r);
      it.s.material.opacity = 0.85 * k * (0.5 + 0.5 * Math.sin(lt * 9 + i));
    });

    // --- walk to Clara (1.3 – 2.6)
    const w1 = ramp(lt, 1.3, 2.6);
    const npos = lt < 3.9 ? [lerp(N0[0], N1[0], w1), 0, lerp(N0[2], N1[2], w1)] : [lerp(N1[0], N2[0], ramp(lt, 4.0, 6.0)), 0, lerp(N1[2], N2[2], ramp(lt, 4.0, 6.0))];
    nut.root.position.set(...npos);
    const cpos = [lerp(C0[0], C2[0], ramp(lt, 4.0, 6.0)), 0, lerp(C0[2], C2[2], ramp(lt, 4.0, 6.0))];
    clara.root.position.set(...cpos);

    // facing
    if (lt < 0.9) nut.root.rotation.y = 0.25;
    else if (lt < 3.9) { const target = Math.atan2(cpos[0] - npos[0], cpos[2] - npos[2]); nut.root.rotation.y = lerp(0.25, target, ramp(lt, 0.9, 1.4)); }
    else nut.root.rotation.y = lerp(Math.atan2(C0[0] - N1[0], C0[2] - N1[2]), Math.PI, ramp(lt, 3.9, 4.4));
    const cFace = Math.atan2(npos[0] - cpos[0], npos[2] - cpos[2]);
    clara.root.rotation.y = lt < 3.9 ? lerp(-0.9, cFace, ramp(lt, 0.5, 1.4)) : lerp(Math.atan2(N1[0] - C0[0], N1[2] - C0[2]), Math.PI, ramp(lt, 3.9, 4.4));

    if (lt < 1.0) { nut.jaw.position.y = -0.075 - (Math.sin(lt * 20) > 0.6 ? 0.02 : 0); nut.body.rotation.z = Math.sin(lt * 14) * 0.02 * ramp(lt, 0.4, 0.8); }
    if (w1 > 0 && w1 < 1) walk(nut, lt * 9, 1);
    nut.arms[0].rotation.z = -0.12 - 0.1 * alive; nut.arms[1].rotation.z = 0.12 + 0.1 * alive;

    // clara: surprised hands to chest (0.8–1.8), then curtsy
    const sur = ramp(lt, 0.8, 1.3) * (1 - ramp(lt, 2.2, 2.6));
    clara.arms.forEach((a, i) => { a.rotation.x = -1.4 * sur; a.rotation.z = (i ? 1 : -1) * (0.15 - 0.5 * sur); });
    // bow & curtsy (2.6 – 3.4)
    const bow = ramp(lt, 2.6, 3.0) * (1 - ramp(lt, 3.2, 3.5));
    nut.body.rotation.x = 0.32 * bow; nut.arms[1].rotation.x = -0.9 * bow; nut.arms[1].rotation.z = 0.12 + 0.5 * bow;
    clara.body.position.y = -0.1 * bow; clara.arms.forEach((a, i) => { a.rotation.z += (i ? 1 : -1) * 0.6 * bow; });
    clara.head.rotation.x = 0.2 * bow;
    // offer hand (3.4 – 3.9), hold hands while walking
    const hand = ramp(lt, 3.35, 3.8);
    if (lt < 4.0) { nut.arms[0].rotation.x = -0.9 * hand; nut.arms[0].rotation.z = -0.12 - 0.3 * hand; clara.arms[0].rotation.x = -0.8 * hand * (1 - bow); }
    else {
      nut.arms[1].rotation.z = 0.12 + 0.35; clara.arms[0].rotation.z = -0.4;
      const wk = ramp(lt, 4.0, 4.3);
      walk(nut, lt * 8, wk); walk(clara, lt * 8 + 1, wk);
    }
    clara.blink(Math.sin(lt * 2.3 + 1) > 0.985);
    // window becomes a doorway of light
    const open = ramp(lt, 3.6, 5.5);
    paneMat.color.copy(paneBase).lerp(new THREE.Color('#fff2cf').multiplyScalar(1.4), open);
    winLight.intensity = open * 22;

    // camera
    const p = kf(lt, [[0, [0.2, 1.75, 6.8]], [2.6, [0.9, 1.55, 5.0]], [4.0, [1.4, 1.5, 4.4]], [6.0, [2.3, 1.7, 2.6]]]);
    const l = kf(lt, [[0, [-0.2, 1.7, -1.2]], [2.6, [1.4, 1.15, -0.3]], [4.0, [1.6, 1.15, -0.4]], [6.0, [2.4, 1.6, -3.4]]]);
    setCam(camera, p, l);
  }
  return { scene, camera, update };
}

// =====================================================================
// SHOT 2 — 여행 : walnut sleigh gliding through a snowy forest at blue hour
// =====================================================================
function shotJourney() {
  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog('#8d93c4', 10, 46);
  scene.add(skyDome('#2c3870', '#9a9cd0', '#e6c6d4'));
  lights(scene, { sky: '#c9d4ff', ground: '#6a5a8a', hemi: 1.15, dir: '#ffe8d0', dirI: 0.9, dirPos: [-6, 7, 3] });
  const moon = mesh(new THREE.CircleGeometry(3, 40), Glow('#fff6dc', 1.1), [-14, 15, -45]); scene.add(moon);
  const mg = glowSprite('#fff0d0', 18, 0.45); mg.position.copy(moon.position); scene.add(mg);
  const ground = snowGround(140, '#e9ecfa'); scene.add(ground);
  const R = rng(5);
  for (let i = 0; i < 90; i++) {
    const x = -15 + R() * 70, side = R() < 0.5 ? -1 : 1, z = side * (3 + R() * 18);
    const p = pine(2.2 + R() * 3.5, i, true); p.position.set(x, 0, z); p.rotation.y = R() * 6; scene.add(p);
  }
  for (let i = 0; i < 6; i++) { const h = mesh(G.sphere(12, 24, 12), M('#dfe3f6'), [-10 + i * 14, -8, -38 - R() * 6], [0, 0, 0], [1.6, 1, 1]); scene.add(h); }
  // lamp posts along the path
  const lamps = [];
  for (let i = 0; i < 7; i++) {
    const x = -2 + i * 6;
    const lp = group(mesh(G.cyl(0.05, 0.07, 2.2, 8), M('#3a3048'), [0, 1.1, 0]), mesh(G.sphere(0.16, 12, 8), Glow('#ffd48a', 1.3), [0, 2.3, 0]));
    const gl = glowSprite('#ffc979', 2.2, 0.55); gl.position.y = 2.3; lp.add(gl);
    lp.position.set(x, 0, -2.4 + Math.sin(x * 0.18) * 1.2); scene.add(lp); lamps.push(lp);
  }
  const sleigh = walnutSleigh(); scene.add(sleigh);
  const clara = makeClara({ dress: '#f3c4cb' }); clara.root.position.set(0.3, 0.12, -0.15); clara.root.children.at(-1).visible = false; sleigh.add(clara.root);
  const nut = makeNutcracker(); nut.root.position.set(-0.32, -0.12, -0.2); nut.root.children.at(-1).visible = false; nut.legs.forEach((l) => (l.visible = false)); sleigh.add(nut.root);
  const trail = sparkles(30, '#ffe3a8', 8, 0.3); scene.add(trail);
  const snow = particles({ count: 1400, area: [36, 12, 26], center: [0, 0, 0], size: 0.09, speed: 0.9, sway: 0.5, seed: 2 });
  scene.add(snow);
  const camera = cam(40);
  const path = (s) => [s, 0.35 + Math.sin(s * 0.9) * 0.05, Math.sin(s * 0.18) * 1.2];

  function update(lt) {
    snow.userData.setTime(lt + 10);
    resetPose(clara); resetPose(nut);
    const s = -1 + lt * 3.6;
    const p = path(s), p2 = path(s + 0.2);
    sleigh.position.set(...p); sleigh.rotation.y = Math.atan2(p2[0] - p[0], p2[2] - p[2]);
    sleigh.rotation.z = Math.sin(lt * 2.1) * 0.03;
    snow.position.x = s;
    trail.userData.items.forEach((it, i) => {
      const back = it.r * 3.5 + 0.4; const q = path(s - back);
      it.s.position.set(q[0], q[1] + 0.2 + it.h * 0.6 + Math.sin(lt * 4 + i) * 0.05, q[2] + (it.a - 3.1) * 0.12);
      it.s.material.opacity = 0.9 * (1 - it.r) * (0.6 + 0.4 * Math.sin(lt * 10 + i));
    });
    // Clara waves and leans on the nutcracker
    clara.arms[1].rotation.z = 2.4 + Math.sin(lt * 7) * 0.3 * ramp(lt, 0.8, 1.2) * (1 - ramp(lt, 3.2, 3.6));
    clara.arms[1].rotation.x = -0.2;
    clara.arms[0].rotation.z = -0.5; clara.head.rotation.z = -0.12 * ramp(lt, 3.3, 4.0); clara.head.rotation.y = Math.sin(lt * 1.3) * 0.3;
    nut.arms[1].rotation.z = 0.6; nut.arms[0].rotation.x = -0.6; nut.head.rotation.y = 0.25 + Math.sin(lt * 1.1) * 0.15;
    nut.sword.visible = false;
    clara.blink(Math.sin(lt * 2.7) > 0.985);
    // camera tracks alongside then looks up into the snowfall
    const cp = kf(lt, [[0, [s - 4.6, 2.0, 6.6]], [3.0, [s + 2.6, 1.7, 6.0]], [5.4, [s + 4.6, 1.5, 4.4]]]);
    const lk = kf(lt, [[0, [s + 0.5, 0.9, 0]], [3.0, [s, 1.0, 0]], [4.2, [s, 1.3, 0]], [5.4, [s + 1.0, 3.6, -1]]]);
    setCam(camera, cp, lk);
  }
  return { scene, camera, update };
}

// =====================================================================
// SHOT 3 — 눈꽃 요정 : snowflake fairies circle the pair in a glade
// =====================================================================
function shotFairies() {
  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog('#c9c6ec', 13, 42);
  scene.add(skyDome('#7b86c9', '#d6d0f0', '#f3e6f2'));
  lights(scene, { sky: '#e8ecff', ground: '#8a7fb4', hemi: 1.2, dir: '#fff3ea', dirI: 0.9, dirPos: [3, 8, 6] });
  scene.add(snowGround(90, '#eeeaf8'));
  const R = rng(9);
  for (let i = 0; i < 40; i++) { const a = R() * 6.28, r = 9 + R() * 12; const p = pine(2.5 + R() * 3, i + 50); p.position.set(Math.cos(a) * r, 0, Math.sin(a) * r); scene.add(p); }
  const ring = mesh(G.torus(2.7, 0.02), Glow('#ffffff', 0.9), [0, 0.03, 0], [Math.PI / 2, 0, 0]); scene.add(ring);
  const clara = makeClara({ dress: '#f3c4cb' }); clara.root.position.set(-0.32, 0, 0); scene.add(clara.root);
  const nut = makeNutcracker(); nut.root.position.set(0.36, 0, 0); scene.add(nut.root);
  const fairies = []; for (let i = 0; i < 7; i++) { const f = makeFairy(i % 3); scene.add(f.root); fairies.push(f); }
  const flakes = []; for (let i = 0; i < 9; i++) { const f = makeSnowflake(0.4 + R() * 0.5); const a = (i / 9) * 6.28 + 0.3, r = 3.8 + R() * 2; f.position.set(Math.cos(a) * r, 2.5 + R() * 2.5, Math.sin(a) * r); f.userData.sp = 0.3 + R() * 0.5; scene.add(f); flakes.push(f); }
  const swirl = particles({ count: 900, area: [14, 8, 14], center: [0, 0, 0], size: 0.08, speed: 0.55, sway: 0.7, colors: ['#ffffff', '#dcefff', '#efe2ff'], seed: 7 });
  scene.add(swirl);
  const glows = sparkles(40, '#d7ecff', 12, 0.18); scene.add(glows);
  const camera = cam(40);

  function update(lt) {
    swirl.userData.setTime(lt + 20); swirl.rotation.y = lt * 0.35;
    resetPose(clara); resetPose(nut);
    clara.root.rotation.y = 0.2; nut.root.rotation.y = -0.2;
    clara.arms[1].rotation.z = 0.45; nut.arms[0].rotation.z = -0.45; nut.sword.visible = true;
    clara.head.rotation.y = Math.sin(lt * 0.9) * 0.5; nut.head.rotation.y = -Math.sin(lt * 0.9 + 0.5) * 0.4;
    clara.head.rotation.x = -0.15; clara.blink(false);
    clara.arms[0].rotation.x = -1.2 * ramp(lt, 1.5, 2.0) * (1 - ramp(lt, 3.2, 3.6)); clara.arms[0].rotation.z = -0.3;
    const enter = ramp(lt, -0.2, 1.6);
    fairies.forEach((f, i) => {
      const a = (i / 7) * Math.PI * 2 + lt * 0.55;
      const r = lerp(4.5, 2.6, enter);
      const y = lerp(4.5 + i * 0.3, 0, enter) + Math.max(0, Math.sin(lt * 3.2 + i)) * 0.18;
      f.root.position.set(Math.cos(a) * r, y, Math.sin(a) * r);
      const cyc = (lt + i * 0.37) % 1.7, spin = Math.PI * 2 * Math.min(1, Math.max(0, (cyc - 1.1) / 0.5));
      f.root.rotation.y = Math.atan2(f.root.position.x, f.root.position.z); // face outward, toward the orbiting camera
      f.body.rotation.y = spin;
      f.body.position.y = spin > 0 ? 0.06 : 0;
      const arm = 2.6 + Math.sin(lt * 3 + i) * 0.25;
      f.arms[0].rotation.z = -arm; f.arms[1].rotation.z = arm;
      f.arms[0].rotation.x = f.arms[1].rotation.x = Math.sin(lt * 3 + i) * 0.2;
      f.body.rotation.z = Math.sin(lt * 2 + i) * 0.08;
      f.wings.forEach((w, k) => { w.rotation.y = (k ? 1 : -1) * (0.6 + Math.sin(lt * 14 + i) * 0.3); });
    });
    flakes.forEach((f, i) => { f.rotation.z = lt * f.userData.sp; f.rotation.y = Math.sin(lt * 0.6 + i) * 0.6; f.position.y += Math.sin(lt * 1.2 + i) * 0.002; });
    glows.userData.items.forEach((it, i) => {
      const a = it.a + lt * (0.8 + it.sp), r = 1.2 + it.r * 3.2, h = (it.h * 4 + lt * 0.6 * it.sp) % 4.5;
      it.s.position.set(Math.cos(a + h) * r, h, Math.sin(a + h) * r); it.s.material.opacity = 0.6 * (0.5 + 0.5 * Math.sin(lt * 6 + i));
    });
    const ang = kf(lt, [[0, -0.35], [5.4, 0.9]]);
    const rad = kf(lt, [[0, 6.6], [5.4, 5.2]]);
    const h = kf(lt, [[0, 3.6], [2.2, 1.9], [5.4, 1.5]]);
    setCam(camera, [Math.sin(ang) * rad, h, Math.cos(ang) * rad], [0, kf(lt, [[0, 2.2], [2.2, 1.15]]), 0]);
  }
  return { scene, camera, update };
}

// =====================================================================
// SHOT 4 — 생쥐 대왕 : the duel, and Clara's slipper
// =====================================================================
function shotBattle() {
  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog('#4b3f6e', 9, 34);
  scene.add(skyDome('#1e2148', '#5a4a80', '#8a6a90'));
  lights(scene, { sky: '#a9b2ff', ground: '#3a2c4a', hemi: 1.0, dir: '#cfd8ff', dirI: 1.0, dirPos: [-5, 9, 4] });
  const lantern = new THREE.PointLight('#ffb36a', 14, 10, 1.6); lantern.position.set(-3.6, 2.4, -0.4); scene.add(lantern);
  const moon = mesh(new THREE.CircleGeometry(2.6, 40), Glow('#fff2d0', 1.1), [8, 11, -30]); scene.add(moon);
  const mg = glowSprite('#fff0d0', 14, 0.4); mg.position.copy(moon.position); scene.add(mg);
  scene.add(snowGround(100, '#d9d6ec'));
  const R = rng(19);
  for (let i = 0; i < 38; i++) { const x = (R() - 0.5) * 40, z = -5 - R() * 18; const p = pine(2.6 + R() * 3.5, i + 100); p.position.set(x, 0, z); scene.add(p); }
  // toy fort silhouette
  const fort = group(mesh(G.box(5, 2.2, 1), M('#6b5a7e'), [0, 1.1, 0]), ...[-2.5, 2.5].map((x) => mesh(G.cyl(0.6, 0.6, 3.2, 12), M('#6b5a7e'), [x, 1.6, 0])),
    ...[-2.5, 2.5].map((x) => mesh(G.cone(0.75, 1.2, 12), M('#8e3d4f'), [x, 3.8, 0])), mesh(G.box(1, 1.2, 0.1), Glow('#ffcf8a', 0.9), [0, 0.7, 0.52]));
  fort.position.set(4.5, 0, -9); scene.add(fort);
  const lampPost = group(mesh(G.cyl(0.05, 0.07, 2.4, 8), M('#2f2638'), [0, 1.2, 0]), mesh(G.sphere(0.16, 12, 8), Glow('#ffcf8a', 1.3), [0, 2.5, 0]));
  const lpg = glowSprite('#ffb86f', 2.4, 0.6); lpg.position.y = 2.5; lampPost.add(lpg); lampPost.position.set(-3.9, 0, -0.8); scene.add(lampPost);

  const nut = makeNutcracker(); scene.add(nut.root);
  const king = makeMouse({ king: true, scale: 1.08 }); scene.add(king.root);
  const clara = makeClara({ dress: '#f3c4cb' }); clara.root.position.set(-2.7, 0, 1.1); scene.add(clara.root);
  const soldiers = [[2.7, 1.5], [3.3, 0.2], [2.7, -1.2], [3.9, 1.2]].map(([x, z], i) => { const m = makeMouse({ scale: 0.55 }); m.root.position.set(x, 0, z); scene.add(m.root); return m; });
  const slipper = clara.slipper; scene.add(slipper);
  const clash = glowSprite('#fff2b0', 1.2, 0); scene.add(clash);
  const hit = new THREE.Group(); scene.add(hit);
  const hitStar = glowSprite('#fff6c8', 2.5, 0); hit.add(hitStar);
  const puff = new THREE.Group(); scene.add(puff);
  const PR = rng(3); const puffs = [];
  for (let i = 0; i < 12; i++) { const p = mesh(G.sphere(0.35, 12, 8), new THREE.MeshToonMaterial({ color: '#f3eef6', transparent: true }), [0, 0, 0]); p.userData.d = new THREE.Vector3(PR() - 0.5, PR() * 0.8, PR() - 0.5).normalize(); puff.add(p); puffs.push(p); }
  const snow = particles({ count: 700, area: [26, 10, 18], center: [0, 0, -2], size: 0.07, speed: 0.7, sway: 0.4, seed: 4 });
  scene.add(snow);
  const camera = cam(38);
  const clashes = [1.15, 1.65, 2.15, 2.6, 3.0];

  function update(lt) {
    snow.userData.setTime(lt + 30);
    resetPose(nut); resetPose(king); resetPose(clara);
    const duel = ramp(lt, 0.8, 1.0) * (1 - ramp(lt, 3.1, 3.2));
    // positions with lunges
    const lungeN = duel * Math.sin(lt * Math.PI * 2 * 1.0) * 0.25;
    const back = ramp(lt, 3.1, 3.5) * (1 - ramp(lt, 5.4, 5.9));
    nut.root.position.set(-0.85 + lungeN - back * 0.55, 0, 0.1);
    nut.root.rotation.y = lerp(Math.PI / 2, Math.PI / 2 + 0.5, ramp(lt, 5.4, 5.9));
    nut.body.rotation.z = back * 0.18;
    const kingAlive = 1 - ramp(lt, 5.0, 5.5);
    king.root.position.set(0.95 + lungeN * 0.8 - ramp(lt, 3.1, 3.5) * 0.3, 0, 0);
    king.root.rotation.y = -Math.PI / 2 + ramp(lt, 4.35, 5.0) * Math.PI * 3;
    king.body.rotation.z = -ramp(lt, 4.6, 5.0) * 1.2;
    king.root.scale.setScalar(1.08 * Math.max(0.001, kingAlive));
    // sword arms: nutcracker swings, king parries offset in phase
    const sw = Math.sin(lt * Math.PI * 4.0);
    nut.arms[1].rotation.x = lerp(-0.7, -1.6 + sw * 0.9, duel); nut.arms[1].rotation.z = 0.15 + 0.2 * duel;
    nut.arms[0].rotation.z = -0.15 - 0.6 * duel;
    king.arms[1].rotation.x = lerp(-0.6, -1.6 - sw * 0.8, Math.max(duel, ramp(lt, 3.1, 3.3) * (1 - ramp(lt, 4.3, 4.5))));
    if (lt > 3.1 && lt < 4.4) king.arms[1].rotation.x = -2.6 + Math.sin(lt * 5) * 0.2; // looming raise
    king.head.rotation.z = lt < 0.9 ? Math.sin(lt * 18) * 0.12 : 0; // cackle
    king.head.rotation.x = lt < 0.9 ? -0.15 : 0;
    walk(nut, lt * 12, duel * 0.6); walk(king, lt * 12 + 2, duel * 0.6);
    // clashes
    let cl = 0; for (const c of clashes) cl = Math.max(cl, 1 - Math.abs(lt - c) / 0.12);
    clash.material.opacity = clamp(cl) * 0.95; clash.position.set(0.05 + lungeN, 1.45, 0.1); clash.scale.setScalar(0.8 + cl * 0.9);
    // Clara: worried hands, then throws the slipper
    clara.root.rotation.y = Math.atan2(0.0 - -2.7, 0 - 1.1);
    const worry = ramp(lt, 0.3, 0.8) * (1 - ramp(lt, 3.4, 3.6));
    clara.arms.forEach((a, i) => { a.rotation.x = -1.5 * worry; a.rotation.z = (i ? 1 : -1) * (0.15 - 0.45 * worry); });
    clara.body.position.y = Math.sin(lt * 10) * 0.01 * worry;
    const wind = ramp(lt, 3.45, 3.85), throwA = ramp(lt, 3.85, 4.0);
    if (lt > 3.4) { clara.arms[1].rotation.x = lerp(0, -2.9, wind) + throwA * 2.0; clara.arms[1].rotation.z = 0.3; clara.body.rotation.x = -0.1 * wind + 0.18 * throwA; }
    if (lt > 4.1) { clara.arms[1].rotation.x = -0.4; clara.arms[0].rotation.x = -1.3 * ramp(lt, 4.5, 4.8); clara.arms[1].rotation.x = -1.3 * ramp(lt, 4.5, 4.8); clara.arms.forEach((a, i) => (a.rotation.z = (i ? 1 : -1) * -0.25 * ramp(lt, 4.5, 4.8))); }
    clara.blink(false);
    // slipper flight 3.95 → 4.4
    const f = (lt - 3.95) / 0.45;
    slipper.visible = f > 0 && f < 1.05;
    if (slipper.visible) {
      const u = clamp(f);
      const a = new THREE.Vector3(-2.5, 1.5, 1.0), b = new THREE.Vector3(0.75, 1.65, 0.05);
      slipper.position.lerpVectors(a, b, u); slipper.position.y += Math.sin(u * Math.PI) * 1.0; slipper.rotation.set(u * 12, u * 3, 0); slipper.scale.setScalar(1.6);
    }
    const hk = clamp(1 - Math.abs(lt - 4.42) / 0.25);
    hitStar.material.opacity = hk; hitStar.scale.setScalar(1 + hk * 2); hit.position.set(0.75, 1.65, 0.1);
    // poof
    const pf = clamp((lt - 4.95) / 0.75);
    puff.visible = pf > 0 && pf < 1; puff.position.set(0.95, 0.8, 0);
    puffs.forEach((p) => { p.position.copy(p.userData.d).multiplyScalar(0.2 + pf * 1.2); p.scale.setScalar(0.5 + pf * 1.6); p.material.opacity = 1 - pf; });
    // soldiers jitter then flee
    soldiers.forEach((s, i) => {
      s.root.rotation.y = -Math.PI / 2 + Math.sin(lt * 6 + i) * 0.2;
      s.body.position.y = Math.abs(Math.sin(lt * 9 + i)) * 0.08;
      s.arms[1].rotation.x = -1.2 + Math.sin(lt * 8 + i) * 0.5;
      const flee = ramp(lt, 4.6 + i * 0.08, 5.6);
      if (flee > 0) { s.root.rotation.y = Math.PI / 2; s.root.position.x = [2.7, 3.3, 2.7, 3.9][i] + flee * 7; walk(s, lt * 20, 1); }
    });
    nut.blink?.(false);
    // camera
    const p = kf(lt, [[0, [0.3, 1.7, 7.4]], [1.0, [0.2, 1.5, 4.6]], [3.2, [0.1, 1.55, 4.3]], [3.6, [-0.9, 2.0, 6.4]], [5.0, [-0.5, 1.8, 5.8]], [6.4, [-1.2, 1.6, 4.6]]]);
    const l = kf(lt, [[0, [0.3, 1.2, 0]], [1.0, [0.1, 1.35, 0]], [3.2, [0.1, 1.35, 0]], [3.6, [-0.8, 1.3, 0.3]], [5.0, [-0.3, 1.2, 0.2]], [6.4, [-1.5, 1.2, 0.5]]]);
    setCam(camera, p, l);
  }
  return { scene, camera, update };
}

// =====================================================================
// SHOT 5 — 마법이 풀리고, 결혼식 : Land of Sweets
// =====================================================================
function shotWedding() {
  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog('#f2cfd9', 16, 48);
  scene.add(skyDome('#c9a2d6', '#f7c9d4', '#fde9e0'));
  lights(scene, { sky: '#fff0f4', ground: '#d6a6b8', hemi: 1.15, dir: '#fff2e0', dirI: 1.0, dirPos: [4, 9, 6] });
  scene.add(snowGround(100, '#f1d3dc'));
  const palace = candyPalace(); palace.position.set(0, 0, -8.5); scene.add(palace);
  const R = rng(31);
  [[-4.5, -3], [4.2, -2.5], [-6.5, -6], [6.8, -5.5], [-3, -10], [3.4, -11]].forEach(([x, z], i) => { const l = lollipop(1.6 + R() * 1.2, ['#f07c96', '#7cc7b2', '#b49be0', '#f2b155'][i % 4], '#fff3e6', i); l.position.set(x, 0, z); scene.add(l); });
  for (let i = 0; i < 8; i++) { const c = cloudPuff(i + 3); c.position.set((R() - 0.5) * 40, 6 + R() * 6, -18 - R() * 14); c.scale.setScalar(1.2 + R()); scene.add(c); }
  const arch = flowerArch(); arch.position.z = -0.7; scene.add(arch);
  const bells = []; for (const s of [-1, 1]) { const b = group(mesh(G.cone(0.18, 0.3, 16, true), M('#e2b24b', { emissive: '#4a3208' }), [0, -0.15, 0]), mesh(G.sphere(0.05), M('#e2b24b'), [0, -0.3, 0])); b.position.set(s * 0.32, 3.15, -0.7); scene.add(b); bells.push(b); }
  const clara = makeClara({ dress: '#f3c4cb' }); clara.root.position.set(-0.5, 0, 0); scene.add(clara.root);
  const nut = makeNutcracker(); nut.root.position.set(0.5, 0, 0); scene.add(nut.root);
  const magic = sparkles(46, '#ffd86a', 17, 0.26); scene.add(magic);
  const flash = glowSprite('#fff3c8', 4, 0); flash.position.set(0.5, 1.2, 0.2); scene.add(flash);
  const petals = particles({ count: 600, area: [12, 7, 8], center: [0, 0, 0.5], size: 0.1, speed: 0.6, sway: 0.6, colors: ['#f6a8bc', '#ffffff', '#f9d36f', '#e46d82', '#bfe3d2'], seed: 13 });
  scene.add(petals);
  const dressMat = clara.skirt.material; const pink = new THREE.Color('#f3c4cb'), white = new THREE.Color('#f7ead8');
  const camera = cam(38);

  function update(lt) {
    resetPose(clara); resetPose(nut);
    petals.userData.setTime(lt); petals.visible = lt > 2.0;
    petals.material.uniforms.uOpacity.value = 0.95 * ramp(lt, 2.0, 2.6);
    clara.root.rotation.y = 0.75; nut.root.rotation.y = -0.75; nut.sword.visible = false;
    // transformation
    const tr = ramp(lt, 0.0, 1.25);
    magic.userData.items.forEach((it, i) => {
      const a = it.a + lt * 5 * it.sp, r = 0.25 + it.r * 0.55 * (1 - tr * 0.5), h = (it.h * 2.2 + lt * 1.6 * it.sp) % 2.2;
      it.s.position.set(0.5 + Math.cos(a) * r, h, Math.sin(a) * r);
      it.s.material.opacity = 0.95 * (1 - ramp(lt, 1.3, 2.0)) * (0.5 + 0.5 * Math.sin(lt * 12 + i));
    });
    const fl = clamp(1 - Math.abs(lt - 1.25) / 0.35);
    flash.material.opacity = fl; flash.scale.setScalar(3 + fl * 5);
    nut.setPrince(lt >= 1.25);
    nut.root.position.y = Math.sin(tr * Math.PI) * 0.35;
    nut.root.rotation.y = -0.75 + (lt < 1.6 ? Math.sin(tr * Math.PI) * Math.PI * 2 * tr : 0);
    // Clara surprised → joy
    const sur = ramp(lt, 0.3, 0.7) * (1 - ramp(lt, 1.9, 2.3));
    clara.arms.forEach((a, i) => { a.rotation.x = -1.6 * sur; a.rotation.z = (i ? 1 : -1) * (0.15 - 0.55 * sur); });
    // wedding attire + arch
    const wed = ramp(lt, 1.9, 2.5);
    dressMat.color.copy(pink).lerp(white, wed);
    clara.veil.visible = clara.tiara.visible = clara.bouquet.visible = lt > 2.0;
    clara.veil.scale.setScalar(Math.max(0.01, wed));
    arch.scale.setScalar(Math.max(0.001, ramp(lt, 1.8, 2.6)));
    bells.forEach((b, i) => { b.visible = lt > 2.3; b.rotation.z = Math.sin(lt * 7 + i * 3) * 0.35 * ramp(lt, 2.3, 2.6); });
    // hold hands and lean in (2.6 →)
    const hold = ramp(lt, 2.5, 3.1);
    clara.arms[1].rotation.x = -0.9 * hold; clara.arms[1].rotation.z = 0.15 + 0.1 * hold;
    clara.arms[0].rotation.x = -1.0 * wed; // bouquet hand is arms[1]; left arm cradles
    nut.arms[0].rotation.x = -0.9 * hold; nut.arms[0].rotation.z = -0.15 - 0.1 * hold;
    clara.root.position.x = -0.5 + 0.08 * hold; nut.root.position.x = 0.5 - 0.08 * hold;
    clara.head.rotation.x = -0.1 * hold; nut.head.rotation.x = 0.12 * hold;
    clara.root.rotation.y = 0.75 + 0.25 * hold; nut.root.rotation.y = lt < 1.6 ? nut.root.rotation.y : -0.75 - 0.25 * hold;
    const dance = ramp(lt, 3.6, 4.0);
    clara.body.position.y = Math.max(0, Math.sin(lt * 5)) * 0.04 * dance;
    clara.blink(Math.sin(lt * 2.1) > 0.985);
    const p = kf(lt, [[0, [0.9, 1.6, 3.4]], [1.6, [0.6, 1.5, 3.3]], [3.0, [0.15, 1.6, 4.4]], [5.4, [0, 1.9, 5.6]]]);
    const l = kf(lt, [[0, [0.45, 1.3, 0]], [1.6, [0.3, 1.35, 0]], [3.0, [0, 1.45, -0.4]], [5.4, [0, 1.8, -1.2]]]);
    setCam(camera, p, l);
  }
  return { scene, camera, update };
}

// =====================================================================
// SHOT 6 — 꿈에서 깨어나다 : Christmas morning in the parlor
// =====================================================================
function shotWake() {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#e8d6c0');
  scene.fog = new THREE.Fog('#f0e2cc', 8, 22);
  lights(scene, { sky: '#fff4e0', ground: '#b89a8a', hemi: 1.25, dir: '#fff1d6', dirI: 1.3, dirPos: [5, 6, 2] });
  const sunbeam = new THREE.PointLight('#ffe6b8', 14, 10, 1.5); sunbeam.position.set(2.4, 2.8, -2.4); scene.add(sunbeam);
  const room = parlor({ morning: true }); scene.add(room);
  const chair = armchair(); chair.position.set(0.6, 0, 0.1); chair.rotation.y = -0.35; scene.add(chair);
  const clara = makeClara({ dress: '#f6efe6', trim: '#ffffff' }); // white nightgown
  clara.root.children.at(-1).visible = false;
  const seat = new THREE.Group(); seat.position.set(0.6, 0.42, 0.18); seat.rotation.y = -0.35; scene.add(seat);
  clara.root.position.set(0, 0, 0); seat.add(clara.root);
  const doll = makeNutcracker(); doll.root.scale.setScalar(0.3); doll.root.children.at(-1).visible = false; doll.sword.visible = false;
  doll.root.position.set(0.04, 0.48, 0.4); doll.root.rotation.x = -0.15; seat.add(doll.root);
  const twinkle = glowSprite('#ffe9a8', 0.4, 0); twinkle.position.set(0.06, 0.92, 0.46); seat.add(twinkle);
    // light rays
  const rays = new THREE.Group();
  for (let i = 0; i < 3; i++) { const r = mesh(new THREE.PlaneGeometry(0.7, 7), new THREE.MeshBasicMaterial({ color: '#fff3d6', transparent: true, opacity: 0.12, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }), [2.1 + i * 0.45, 1.6, -1.6], [0.3, -0.5, 0.75]); rays.add(r); }
  scene.add(rays);
  const dust = particles({ count: 160, area: [4, 4, 4], center: [1.8, 0.4, -1.4], size: 0.035, speed: -0.08, sway: 0.2, colors: ['#fff3d0'], additive: true, opacity: 0.6, seed: 77 });
  scene.add(dust);
  const camera = cam(36);

  function update(lt) {
    dust.userData.setTime(lt);
    resetPose(clara);
    room.userData.fire.scale.y = 0.45 * (1 + Math.sin(lt * 15) * 0.08);
    const wake = ramp(lt, 1.4, 2.0);
    // sleeping slump → sit up
    clara.body.rotation.z = lerp(0.18, 0.04, wake);
    clara.body.rotation.x = lerp(0.12, -0.05, wake);
    clara.head.rotation.z = lerp(0.42, 0.08, wake) + Math.sin(lt * 1.4) * 0.02 * (1 - wake);
    clara.head.rotation.x = lerp(0.15, 0.3 * ramp(lt, 2.2, 2.6), wake); // looks down at the doll
    clara.body.position.y = Math.sin(lt * 1.6) * 0.008 * (1 - wake);
    clara.blink(lt < 1.55 || (lt > 2.05 && lt < 2.15));
    // hugging the doll
    clara.arms.forEach((a, i) => { a.rotation.x = -1.15 + 0.1 * Math.sin(lt * 1.6); a.rotation.z = (i ? -1 : 1) * 0.55; });
    clara.arms[1].rotation.x = lerp(-1.15, -1.45, ramp(lt, 2.3, 2.8));
    clara.mouth.scale.set(1 + 0.4 * ramp(lt, 2.3, 2.8), 1 + 0.4 * ramp(lt, 2.3, 2.8), 1);
    doll.root.rotation.z = lerp(0.3, 0.0, wake); doll.root.rotation.y = lerp(0.4, 0.15, ramp(lt, 2.2, 2.8));
    const tw = clamp(1 - Math.abs(lt - 3.0) / 0.22);
    twinkle.material.opacity = tw; twinkle.scale.setScalar(0.25 + tw * 0.5);
    rays.children.forEach((r, i) => (r.material.opacity = 0.1 + 0.04 * Math.sin(lt * 0.8 + i)));
    const p = kf(lt, [[0, [1.2, 1.62, 2.3]], [2.4, [1.05, 1.62, 2.8]], [4.2, [0.4, 1.9, 5.2]]]);
    const l = kf(lt, [[0, [0.5, 1.3, 0.3]], [2.4, [0.5, 1.28, 0.25]], [4.2, [0.0, 1.35, -0.6]]]);
    setCam(camera, p, l);
  }
  return { scene, camera, update };
}

export const SHOTS = [
  { name: '만남', start: 0.0, end: 5.5, build: shotMeet },
  { name: '여행', start: 5.5, end: 10.5, build: shotJourney },
  { name: '눈꽃 요정', start: 10.5, end: 15.5, build: shotFairies },
  { name: '생쥐 대왕', start: 15.5, end: 21.5, build: shotBattle },
  { name: '결혼식', start: 21.5, end: 26.4, build: shotWedding },
  { name: '깨어남', start: 26.4, end: 30.0, build: shotWake },
];
// transition at the start of shot i (i ≥ 1): style + half-width in seconds
export const TRANSITIONS = [null, { type: 'paint', half: 0.4 }, { type: 'paint', half: 0.4 }, { type: 'paint', half: 0.35 }, { type: 'paint', half: 0.4 }, { type: 'white', half: 0.75 }];
export const DURATION = 30;
