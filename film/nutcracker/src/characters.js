import * as THREE from 'three';
import { M, G, mesh, group, glowSprite, blobShadow, Glow } from './util.js';

const SKIN = '#f2cdb0', BLUSH = '#e98f8f', INK = '#2b2026', GOLD = '#d9a93f', WHITE = '#f6f0e4';

// pivoted limb: a group at the joint, the mesh hanging along -Y
function limb(geo, mat, len, at) {
  const pivot = new THREE.Group(); pivot.position.set(...at);
  const m = mesh(geo, mat, [0, -len / 2, 0]); pivot.add(m);
  return pivot;
}

function face(g, { y, z, r, eyeGap = 0.06, eyeY = 0.0, cheeks = true, eyeR = 0.022 }) {
  const eyes = [];
  for (const s of [-1, 1]) {
    const e = mesh(G.sphere(eyeR, 10, 8), M(INK), [s * eyeGap, y + eyeY, z + r * 0.9]);
    e.scale.z = 0.5; g.add(e); eyes.push(e);
    if (cheeks) g.add(mesh(G.sphere(0.032, 10, 8), M(BLUSH), [s * (eyeGap + 0.045), y - 0.055, z + r * 0.8], [0, 0, 0], [1, 0.6, 0.4]));
  }
  const mouth = mesh(G.torus(0.025, 0.007, Math.PI), M('#a8434b'), [0, y - 0.075, z + r * 0.93], [0, 0, Math.PI]);
  g.add(mouth);
  return { eyes, mouth };
}

// ================= CLARA =================
export function makeClara({ dress = '#f1b7c0', trim = '#fbeee8' } = {}) {
  const root = new THREE.Group();
  const body = new THREE.Group(); root.add(body);
  const dressM = M(dress, { noCache: true });
  const skirt = mesh(G.lathe([[0.0, 0.08], [0.43, 0.08], [0.46, 0.12], [0.40, 0.3], [0.28, 0.55], [0.16, 0.76], [0.0, 0.78]]), dressM);
  body.add(skirt);
  body.add(mesh(G.torus(0.44, 0.03), M(trim), [0, 0.11, 0], [Math.PI / 2, 0, 0]));
  for (const s of [-1, 1]) body.add(mesh(G.sphere(0.06, 12, 8), M('#e7c9a9'), [s * 0.09, 0.05, 0.1], [0, 0, 0], [0.8, 0.6, 1.3])); // slippers
  body.add(mesh(G.cyl(0.13, 0.15, 0.3), dressM, [0, 0.9, 0]));
  body.add(mesh(G.torus(0.14, 0.025), M('#c96a7c'), [0, 0.78, 0], [Math.PI / 2, 0, 0])); // sash
  body.add(mesh(G.cyl(0.045, 0.05, 0.1), M(SKIN), [0, 1.08, 0]));

  const head = new THREE.Group(); head.position.set(0, 1.25, 0); body.add(head);
  head.add(mesh(G.sphere(0.17), M(SKIN)));
  const hairM = M('#6a3c28');
  head.add(mesh(G.sphere(0.185), hairM, [0, 0.035, -0.045]));
  head.add(mesh(G.sphere(0.09), hairM, [0, 0.12, -0.15])); // bun
  head.add(mesh(G.sphere(0.07), hairM, [0.1, 0.13, 0.08], [0, 0, 0.6], [1.2, 0.5, 0.8])); // fringe
  head.add(mesh(G.sphere(0.07), hairM, [-0.08, 0.14, 0.09], [0, 0, -0.5], [1.2, 0.5, 0.8]));
  for (const s of [-1, 1]) head.add(mesh(G.cone(0.05, 0.12, 10), M('#c8414d'), [s * 0.07, 0.16, -0.2], [0, 0, s * Math.PI / 2]));
  const f = face(head, { y: 0.0, z: 0, r: 0.17 });

  const sleeveM = M(trim);
  const arms = [];
  for (const s of [-1, 1]) {
    const a = limb(G.capsule(0.04, 0.36), M(SKIN), 0.44, [s * 0.17, 1.03, 0]);
    a.add(mesh(G.sphere(0.075, 12, 10), sleeveM, [0, -0.02, 0]));
    a.rotation.z = s * 0.18; body.add(a); arms.push(a);
  }
  // wedding extras
  const veil = mesh(new THREE.LatheGeometry([[0.02, 0.21], [0.2, 0.18], [0.23, 0.0], [0.27, -0.35], [0.32, -0.7]].map(([x, y]) => new THREE.Vector2(x, y)), 24, Math.PI * 0.7, Math.PI * 0.6),
    new THREE.MeshToonMaterial({ color: '#fffaf2', transparent: true, opacity: 0.4, side: THREE.DoubleSide, depthWrite: false }), [0, 0.03, -0.06]);
  veil.visible = false; head.add(veil);
  const tiara = group(mesh(G.torus(0.13, 0.012), M(GOLD, { emissive: '#5a3c08' }), [0, 0.15, -0.01], [Math.PI / 2 - 0.3, 0, 0]),
    mesh(G.sphere(0.025), Glow('#ffe7f0', 1.3), [0, 0.2, 0.1]));
  tiara.visible = false; head.add(tiara);
  const bouquet = group(...[0, 1, 2, 3, 4].map((i) => mesh(G.sphere(0.05, 10, 8), M(['#f2a0b4', '#fff1e8', '#e46d82', '#f7c6d0', '#fff'][i]), [Math.cos(i * 1.3) * 0.05, Math.sin(i * 2.1) * 0.03, Math.sin(i * 1.3) * 0.05])));
  bouquet.position.set(0, -0.46, 0.05); bouquet.visible = false; arms[1].add(bouquet);

  root.add(blobShadow(1.3, 0.3));
  const slipper = mesh(G.sphere(0.06, 12, 8), M('#e7c9a9'), [0, 0, 0], [0, 0, 0], [0.8, 0.6, 1.4]);

  return {
    root, body, head, arms, eyes: f.eyes, mouth: f.mouth, veil, tiara, bouquet, skirt, slipper,
    blink(closed) { f.eyes.forEach((e) => (e.scale.y = closed ? 0.15 : 1)); },
  };
}

// ================= NUTCRACKER / PRINCE =================
export function makeNutcracker() {
  const root = new THREE.Group();
  const body = new THREE.Group(); root.add(body);
  const red = M('#b3343c'), black = M('#272330'), white = M(WHITE), gold = M(GOLD, { emissive: '#3d2a05' });
  const legs = [];
  for (const s of [-1, 1]) {
    const leg = new THREE.Group(); leg.position.set(s * 0.1, 0.72, 0);
    leg.add(mesh(G.cyl(0.075, 0.07, 0.42), white, [0, -0.21, 0]));
    leg.add(mesh(G.cyl(0.085, 0.09, 0.32), black, [0, -0.56, 0]));
    leg.add(mesh(G.box(0.14, 0.08, 0.22), black, [0, -0.68, 0.04]));
    body.add(leg); legs.push(leg);
  }
  body.add(mesh(G.cyl(0.2, 0.27, 0.22, 20, true), red, [0, 0.72, 0]));      // coat flare
  body.add(mesh(G.cyl(0.19, 0.2, 0.5), red, [0, 1.0, 0]));                  // torso
  body.add(mesh(G.cyl(0.205, 0.205, 0.06), black, [0, 0.82, 0]));          // belt
  body.add(mesh(G.box(0.07, 0.06, 0.03), gold, [0, 0.82, 0.2]));
  for (let i = 0; i < 4; i++) for (const s of [-1, 1]) body.add(mesh(G.sphere(0.018, 8, 6), gold, [s * 0.07, 0.9 + i * 0.075, 0.185]));
  body.add(mesh(G.box(0.05, 0.38, 0.02), M('#f3e4c2'), [0, 1.03, 0.19])); // braid strip
  for (const s of [-1, 1]) body.add(mesh(G.sphere(0.09, 12, 8), gold, [s * 0.21, 1.24, 0], [0, 0, 0], [1, 0.45, 1]));

  const arms = [];
  for (const s of [-1, 1]) {
    const a = limb(G.capsule(0.06, 0.38), red, 0.48, [s * 0.25, 1.21, 0]);
    a.add(mesh(G.sphere(0.065, 12, 10), white, [0, -0.5, 0])); // glove
    a.add(mesh(G.cyl(0.07, 0.07, 0.05), M('#f3e4c2'), [0, -0.42, 0]));
    a.rotation.z = s * 0.12; body.add(a); arms.push(a);
  }
  // sword in right hand (arms[1])
  const sword = group(
    mesh(G.box(0.035, 0.7, 0.012), M('#d7dde6', { emissive: '#2d3440' }), [0, 0.38, 0]),
    mesh(G.box(0.17, 0.03, 0.04), gold, [0, 0.02, 0]),
    mesh(G.cyl(0.02, 0.02, 0.1), M('#5a3a2a'), [0, -0.05, 0]));
  sword.position.set(0, -0.52, 0.03); sword.rotation.x = 2.3; arms[1].add(sword);

  // nutcracker head
  const head = new THREE.Group(); head.position.set(0, 1.42, 0); body.add(head);
  const nut = new THREE.Group(); head.add(nut);
  nut.add(mesh(G.cyl(0.15, 0.16, 0.3), M('#efd6b6'), [0, 0, 0]));
  nut.add(mesh(G.sphere(0.035, 10, 8), M('#e7a08a'), [0, 0.0, 0.16]));
  for (const s of [-1, 1]) {
    nut.add(mesh(G.sphere(0.03, 10, 8), white, [s * 0.06, 0.05, 0.135]));
    nut.add(mesh(G.sphere(0.018, 10, 8), M(INK), [s * 0.06, 0.05, 0.16]));
    nut.add(mesh(G.box(0.07, 0.02, 0.02), M(INK), [s * 0.06, 0.1, 0.15], [0, 0, -s * 0.2]));
    nut.add(mesh(G.sphere(0.03, 10, 8), M(BLUSH), [s * 0.1, -0.02, 0.12], [0, 0, 0], [1, 0.6, 0.5]));
  }
  nut.add(mesh(G.sphere(0.13, 14, 10), white, [0, -0.13, 0.05], [0, 0, 0], [1.15, 0.9, 0.9])); // beard
  nut.add(mesh(G.sphere(0.05, 10, 8), white, [0, -0.04, 0.15], [0, 0, 0], [1.6, 0.5, 0.6]));   // moustache
  const jaw = mesh(G.box(0.1, 0.025, 0.04), M('#3b1f24'), [0, -0.075, 0.175]); nut.add(jaw);
  nut.add(mesh(G.sphere(0.17, 14, 10), white, [0, 0.03, -0.06], [0, 0, 0], [1, 1, 0.9]));     // hair back
  nut.add(mesh(G.cyl(0.165, 0.165, 0.32), black, [0, 0.31, 0]));                              // shako
  nut.add(mesh(G.cyl(0.17, 0.17, 0.05), gold, [0, 0.17, 0]));
  nut.add(mesh(G.sphere(0.045, 10, 8), gold, [0, 0.33, 0.16]));
  nut.add(mesh(G.sphere(0.08, 12, 8), M('#d9454c'), [0, 0.52, 0], [0, 0, 0], [0.7, 1.2, 0.7])); // plume

  // prince head (after the spell breaks)
  const prince = new THREE.Group(); prince.visible = false; head.add(prince);
  prince.add(mesh(G.sphere(0.16), M(SKIN), [0, -0.02, 0]));
  const hairP = M('#7a4a2c');
  prince.add(mesh(G.sphere(0.172), hairP, [0, 0.03, -0.035]));
  prince.add(mesh(G.sphere(0.08), hairP, [0.06, 0.11, 0.08], [0, 0, 0.4], [1.4, 0.55, 0.9]));
  face(prince, { y: -0.02, z: 0, r: 0.16 });
  const crown = group(mesh(G.cyl(0.11, 0.1, 0.06, 16, true), gold, [0, 0, 0]),
    ...[0, 1, 2, 3, 4, 5, 6].map((i) => mesh(G.cone(0.022, 0.07, 6), gold, [Math.cos(i * 0.9) * 0.105, 0.06, Math.sin(i * 0.9) * 0.105])),
    mesh(G.sphere(0.022), Glow('#ff8fa0', 1.2), [0, 0.01, 0.11]));
  crown.position.set(0, 0.16, -0.01); prince.add(crown);
  // cape for prince
  const cape = mesh(G.cyl(0.24, 0.38, 1.05, 20, true), M('#3a4f8f', { side: THREE.DoubleSide }), [0, 0.72, -0.04]);
  cape.geometry = new THREE.CylinderGeometry(0.24, 0.4, 1.05, 20, 1, true, Math.PI * 0.55, Math.PI * 0.9);
  cape.visible = false; body.add(cape);

  root.add(blobShadow(1.3, 0.3));
  return {
    root, body, head, arms, legs, sword, nut, prince, cape, jaw,
    setPrince(on) { nut.visible = !on; prince.visible = on; cape.visible = on; },
  };
}

// ================= MOUSE KING =================
export function makeMouse({ king = false, scale = 1 } = {}) {
  const root = new THREE.Group();
  const body = new THREE.Group(); root.add(body);
  const fur = M(king ? '#8a8296' : '#9a929e'), pink = M('#e6a2a8'), belly = M('#c9c0c6'), dark = M('#1f1a22');
  body.add(mesh(G.sphere(0.42, 20, 16), fur, [0, 0.62, 0], [0, 0, 0], [1, 1.25, 0.9]));
  body.add(mesh(G.sphere(0.32, 16, 12), belly, [0, 0.6, 0.12], [0, 0, 0], [1, 1.2, 0.8]));
  for (const s of [-1, 1]) body.add(mesh(G.sphere(0.12, 12, 8), pink, [s * 0.17, 0.05, 0.12], [0, 0, 0], [0.8, 0.4, 1.5]));
  const head = new THREE.Group(); head.position.set(0, 1.25, 0.04); body.add(head);
  head.add(mesh(G.sphere(0.27), fur));
  const snout = mesh(G.cone(0.16, 0.34, 16), fur, [0, -0.05, 0.3], [Math.PI / 2, 0, 0]); head.add(snout);
  head.add(mesh(G.sphere(0.05, 10, 8), pink, [0, -0.05, 0.48]));
  for (const s of [-1, 1]) {
    const ear = group(mesh(G.cyl(0.17, 0.17, 0.035, 20), fur, [0, 0, 0], [Math.PI / 2, 0, 0]),
      mesh(G.cyl(0.12, 0.12, 0.04, 20), pink, [0, 0, 0.01], [Math.PI / 2, 0, 0]));
    ear.position.set(s * 0.22, 0.24, -0.02); ear.rotation.z = -s * 0.3; head.add(ear);
    head.add(mesh(G.sphere(0.04, 10, 8), Glow(king ? '#d2283a' : '#2a1d24', king ? 1.1 : 1), [s * 0.1, 0.06, 0.22]));
    for (const k of [-1, 1]) head.add(mesh(G.cyl(0.004, 0.004, 0.3, 4), dark, [s * 0.16, -0.06 + k * 0.02, 0.4], [0, 0, Math.PI / 2 + s * k * 0.15]));
  }
  if (king) {
    const gold = M(GOLD, { emissive: '#3d2a05' });
    const crown = group(mesh(G.cyl(0.17, 0.15, 0.1, 18, true), gold),
      ...[0, 1, 2, 3, 4, 5, 6, 7].map((i) => mesh(G.cone(0.035, 0.12, 6), gold, [Math.cos(i * 0.785) * 0.16, 0.1, Math.sin(i * 0.785) * 0.16])),
      mesh(G.sphere(0.035), Glow('#6fd0ff', 1.2), [0, 0.02, 0.16]));
    crown.position.set(0, 0.27, 0); head.add(crown);
    const cape = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.55, 1.1, 24, 1, true, Math.PI * 0.55, Math.PI * 0.9), M('#7d2236', { side: THREE.DoubleSide }));
    cape.position.set(0, 0.6, -0.06); body.add(cape);
    body.add(mesh(G.torus(0.28, 0.06), M('#f4eee6'), [0, 1.08, 0], [Math.PI / 2, 0, 0])); // ermine collar
  } else {
    head.add(mesh(G.cone(0.14, 0.22, 12), M('#b23a43'), [0, 0.3, 0]));
  }
  // tail
  const curve = new THREE.CatmullRomCurve3([new THREE.Vector3(0, 0.3, -0.35), new THREE.Vector3(0, 0.15, -0.7), new THREE.Vector3(0.25, 0.25, -1.0), new THREE.Vector3(0.45, 0.55, -1.05)]);
  body.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 24, 0.025, 6), pink));
  const arms = [];
  for (const s of [-1, 1]) {
    const a = limb(G.capsule(0.06, 0.3), fur, 0.4, [s * 0.36, 0.95, 0.05]);
    a.add(mesh(G.sphere(0.06, 10, 8), pink, [0, -0.42, 0]));
    a.rotation.z = s * 0.35; body.add(a); arms.push(a);
  }
  const sword = group(mesh(G.box(0.04, king ? 0.8 : 0.45, 0.012), M('#b8bfcb', { emissive: '#1d2330' }), [0, king ? 0.42 : 0.25, 0]), mesh(G.box(0.16, 0.03, 0.04), M('#5c4a3a'), [0, 0.02, 0]));
  sword.position.set(0, -0.44, 0.03); sword.rotation.x = 2.3; arms[1].add(sword);
  root.add(blobShadow(1.5, 0.35));
  root.scale.setScalar(scale);
  return { root, body, head, arms, sword };
}

// ================= SNOW FAIRY =================
export function makeFairy(hue = 0) {
  const root = new THREE.Group();
  const body = new THREE.Group(); root.add(body);
  const tint = new THREE.Color().setHSL(0.55 + hue * 0.08, 0.45, 0.86);
  const tutuM = M(tint.getStyle());
  const ruffle = (pts, amp) => { const g = G.lathe(pts, 64); const p = g.attributes.position; for (let i = 0; i < p.count; i++) { const x = p.getX(i), z = p.getZ(i), r = Math.hypot(x, z); p.setY(i, p.getY(i) + Math.sin(Math.atan2(z, x) * 14) * amp * r); } g.computeVertexNormals(); return g; };
  body.add(mesh(ruffle([[0.06, 0.9], [0.24, 0.88], [0.42, 0.8], [0.46, 0.76], [0.3, 0.76], [0.08, 0.78]], 0.09), tutuM));
  body.add(mesh(ruffle([[0.06, 0.86], [0.2, 0.84], [0.36, 0.75], [0.38, 0.71], [0.2, 0.74], [0.06, 0.76]], 0.12), M('#ffffff')));
  for (const s of [-1, 1]) {
    body.add(mesh(G.cyl(0.045, 0.03, 0.74), M('#f2cfc4'), [s * 0.065, 0.39, 0]));
    body.add(mesh(G.cone(0.035, 0.07, 8), M('#f2b6c0'), [s * 0.065, 0.03, 0.01], [Math.PI, 0, 0]));
  }
  body.add(mesh(G.cyl(0.1, 0.12, 0.28), M('#eef4fb'), [0, 0.95, 0]));
  body.add(mesh(G.cyl(0.035, 0.04, 0.08), M(SKIN), [0, 1.12, 0]));
  const head = new THREE.Group(); head.position.set(0, 1.27, 0); body.add(head);
  head.add(mesh(G.sphere(0.14), M(SKIN)));
  const hair = M('#f1eee9');
  head.add(mesh(G.sphere(0.152), hair, [0, 0.03, -0.035]));
  head.add(mesh(G.sphere(0.07), hair, [0, 0.13, -0.08]));
  face(head, { y: 0.0, z: 0, r: 0.14, eyeGap: 0.05, eyeR: 0.018 });
  head.add(mesh(G.sphere(0.035, 8, 6), Glow('#cfefff', 1.4), [0, 0.16, 0.06]));
  const arms = [];
  for (const s of [-1, 1]) {
    const a = limb(G.capsule(0.03, 0.34), M(SKIN), 0.4, [s * 0.12, 1.06, 0]);
    body.add(a); arms.push(a);
  }
  // wings
  const wingShape = new THREE.Shape(); wingShape.absellipse(0, 0, 0.22, 0.4, 0, Math.PI * 2);
  const wingM = new THREE.MeshBasicMaterial({ color: '#d8f0ff', transparent: true, opacity: 0.55, side: THREE.DoubleSide, depthWrite: false });
  const wings = [];
  for (const s of [-1, 1]) {
    const w = new THREE.Mesh(new THREE.ShapeGeometry(wingShape, 24), wingM);
    w.position.set(s * 0.2, 1.1, -0.12); w.rotation.set(0, s * 0.6, s * -0.4); body.add(w); wings.push(w);
  }
  const glow = glowSprite('#bfe6ff', 1.6, 0.16); glow.position.y = 0.9; root.add(glow);
  root.add(blobShadow(1.1, 0.2, '#4a5a8a'));
  return { root, body, head, arms, wings };
}

// ================= SNOWFLAKE =================
export function makeSnowflake(size = 1, color = '#e9f6ff') {
  const g = new THREE.Group();
  const m = Glow(color, 1.05);
  for (let i = 0; i < 6; i++) {
    const arm = new THREE.Group(); arm.rotation.z = (i * Math.PI) / 3;
    arm.add(mesh(G.box(0.05 * size, size, 0.02), m, [0, size / 2, 0]));
    for (const k of [0.45, 0.72]) for (const s of [-1, 1])
      arm.add(mesh(G.box(0.035 * size, 0.28 * size * (1.1 - k), 0.02), m, [s * 0.07 * size, k * size, 0], [0, 0, -s * 0.8]));
    g.add(arm);
  }
  g.add(mesh(G.cyl(0.12 * size, 0.12 * size, 0.03, 6), m, [0, 0, 0], [Math.PI / 2, 0, 0]));
  return g;
}
