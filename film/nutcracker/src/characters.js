// Toy characters built from simple painted primitives.
// Every character is a THREE.Group whose origin sits between its feet, with
// named pivot groups (arms, jaw, ...) that the timeline poses.
import * as THREE from 'three';
import { paint, blobShadow } from './materials.js';

const SEG = 20;
const sph = (r, w = SEG, h = 14) => new THREE.SphereGeometry(r, w, h);
const cyl = (rt, rb, h, s = SEG) => new THREE.CylinderGeometry(rt, rb, h, s);
const box = (x, y, z) => new THREE.BoxGeometry(x, y, z);

export function mesh(geo, mat, x = 0, y = 0, z = 0, parent) {
  const m = new THREE.Mesh(geo, mat);
  m.position.set(x, y, z);
  if (parent) parent.add(m);
  return m;
}

const C = {
  red: paint('#c0303a', { rim: 0.3 }),
  deepRed: paint('#8e1f33'),
  gold: paint('#e7b545', { rim: 0.5, pigment: 0.3 }),
  navy: paint('#2b3a78'),
  black: paint('#2a2238', { rim: 0.35 }),
  skin: paint('#f2c9a6', { rim: 0.15, pigment: 0.12 }),
  cheek: paint('#ec8f8f', { pigment: 0.1 }),
  white: paint('#f6efe1', { pigment: 0.15 }),
  eye: paint('#231a2e', { rim: 0 }),
  silver: paint('#d8dbe8', { rim: 0.6 }),
  mouse: paint('#8d8a9f', { wobble: 0.015, wobbleFreq: 8 }),
  mouseDark: paint('#6c6880'),
  pink: paint('#f1a5b2'),
  purple: paint('#6a3f8f', { rim: 0.35 }),
  gown: paint('#eef0f8', { wobble: 0.02, wobbleFreq: 5 }),
  gownBlue: paint('#bcd0ef'),
  hair: paint('#7a4528', { wobble: 0.015, wobbleFreq: 10 }),
  ribbon: paint('#d83c52'),
  tutu: paint('#f4b7d0', { wobble: 0.05, wobbleFreq: 9, rim: 0.4 }),
  lilac: paint('#c7a2e0', { rim: 0.4 }),
};

function addShadow(g, r) { const s = blobShadow(r, 0.5); g.add(s); g.userData.shadow = s; return s; }

// ---------------------------------------------------------------- Nutcracker
export function makeNutcracker() {
  const g = new THREE.Group(); g.name = 'nutcracker';
  const body = new THREE.Group(); g.add(body); g.userData.body = body;
  // boots + legs
  for (const sx of [-1, 1]) {
    mesh(box(0.13, 0.12, 0.2), C.black, sx * 0.08, 0.06, 0.02, body);
    mesh(cyl(0.065, 0.065, 0.32), C.navy, sx * 0.08, 0.27, 0, body);
    mesh(cyl(0.068, 0.068, 0.04), C.gold, sx * 0.08, 0.36, 0, body);
  }
  // jacket
  mesh(cyl(0.15, 0.17, 0.34), C.red, 0, 0.58, 0, body);
  mesh(cyl(0.175, 0.175, 0.05), C.gold, 0, 0.45, 0, body);
  mesh(cyl(0.18, 0.15, 0.06), C.red, 0, 0.42, 0, body); // coat skirt
  for (let i = 0; i < 3; i++) mesh(sph(0.022, 8, 6), C.gold, 0, 0.52 + i * 0.075, 0.155, body);
  for (const sx of [-1, 1]) {
    const ep = mesh(sph(0.075, 12, 8), C.gold, sx * 0.17, 0.74, 0, body); ep.scale.set(1, 0.45, 1);
  }
  // arms (pivot at shoulder)
  const arms = [];
  for (const sx of [-1, 1]) {
    const a = new THREE.Group(); a.position.set(sx * 0.2, 0.72, 0); body.add(a);
    mesh(cyl(0.05, 0.045, 0.27), C.red, 0, -0.13, 0, a);
    mesh(cyl(0.052, 0.052, 0.03), C.gold, 0, -0.25, 0, a);
    mesh(sph(0.05, 10, 8), C.white, 0, -0.3, 0, a);
    arms.push(a);
  }
  g.userData.armL = arms[0]; g.userData.armR = arms[1];
  // sword in right hand
  const sword = new THREE.Group(); sword.position.set(0, -0.3, 0.02); arms[1].add(sword);
  mesh(box(0.025, 0.42, 0.012), C.silver, 0, -0.0, 0.24, sword).rotation.x = Math.PI / 2;
  mesh(box(0.12, 0.02, 0.03), C.gold, 0, 0, 0.04, sword);
  sword.children[0].position.set(0, 0, 0.26);
  g.userData.sword = sword;
  // head
  const head = new THREE.Group(); head.position.y = 0.78; body.add(head); g.userData.head = head;
  mesh(cyl(0.115, 0.12, 0.2), C.skin, 0, 0.1, 0, head);
  for (const sx of [-1, 1]) {
    mesh(sph(0.018, 8, 6), C.eye, sx * 0.045, 0.14, 0.108, head);
    mesh(sph(0.026, 8, 6), C.cheek, sx * 0.07, 0.09, 0.095, head).scale.set(1, 0.7, 0.4);
    const brow = mesh(box(0.05, 0.012, 0.01), C.black, sx * 0.045, 0.175, 0.115, head); brow.rotation.z = sx * -0.2;
    const hairSide = mesh(sph(0.06, 10, 8), C.white, sx * 0.11, 0.08, -0.01, head); hairSide.scale.set(0.6, 1.3, 1);
  }
  const nose = mesh(sph(0.03, 10, 8), C.skin, 0, 0.115, 0.125, head); nose.scale.set(0.9, 1, 1.2);
  const stache = mesh(cyl(0.012, 0.012, 0.11, 8), C.black, 0, 0.078, 0.122, head); stache.rotation.z = Math.PI / 2;
  // jaw (pivot at the hinge, clacks open)
  const jaw = new THREE.Group(); jaw.position.set(0, 0.03, 0.02); head.add(jaw); g.userData.jaw = jaw;
  mesh(box(0.15, 0.06, 0.12), C.skin, 0, -0.02, 0.05, jaw);
  mesh(box(0.12, 0.018, 0.02), C.white, 0, 0.012, 0.11, jaw);
  const beard = mesh(sph(0.1, 12, 10), C.white, 0, -0.06, 0.06, jaw); beard.scale.set(1.15, 0.9, 0.7);
  // shako hat
  mesh(cyl(0.125, 0.12, 0.3), C.black, 0, 0.36, 0, head);
  mesh(cyl(0.128, 0.128, 0.04), C.gold, 0, 0.23, 0, head);
  mesh(cyl(0.128, 0.128, 0.025), C.gold, 0, 0.5, 0, head);
  const badge = mesh(sph(0.035, 10, 8), C.gold, 0, 0.36, 0.118, head); badge.scale.z = 0.4;
  const plume = mesh(sph(0.06, 10, 8), C.red, 0, 0.58, 0.04, head); plume.scale.set(0.8, 1.5, 0.8);
  const visor = mesh(cyl(0.13, 0.13, 0.015, SEG), C.black, 0, 0.215, 0.035, head); visor.scale.z = 1.1;
  addShadow(g, 0.32);
  return g;
}

// ---------------------------------------------------------------- Clara
export function makeClara() {
  const g = new THREE.Group(); g.name = 'clara';
  const body = new THREE.Group(); g.add(body); g.userData.body = body;
  const pts = [];
  for (let i = 0; i <= 10; i++) {
    const y = i / 10;
    pts.push(new THREE.Vector2(0.27 - 0.16 * Math.pow(y, 0.8) + 0.02 * Math.sin(y * 9), y * 0.7));
  }
  pts.push(new THREE.Vector2(0.0, 0.72));
  const dress = mesh(new THREE.LatheGeometry(pts, 24), C.gown, 0, 0.08, 0, body);
  dress.material.side = THREE.DoubleSide;
  mesh(cyl(0.26, 0.275, 0.05), C.gownBlue, 0, 0.12, 0, body);
  for (const sx of [-1, 1]) mesh(sph(0.05, 10, 8), C.skin, sx * 0.07, 0.04, 0.05, body).scale.set(1, 0.6, 1.5);
  mesh(cyl(0.12, 0.12, 0.05), C.gownBlue, 0, 0.66, 0, body); // sash
  const arms = [];
  for (const sx of [-1, 1]) {
    const a = new THREE.Group(); a.position.set(sx * 0.12, 0.74, 0); body.add(a);
    const sl = mesh(sph(0.06, 10, 8), C.gown, 0, -0.02, 0, a); sl.scale.set(1, 1.1, 1);
    mesh(cyl(0.032, 0.03, 0.26), C.skin, 0, -0.15, 0, a);
    mesh(sph(0.04, 8, 6), C.skin, 0, -0.28, 0, a);
    arms.push(a);
  }
  g.userData.armL = arms[0]; g.userData.armR = arms[1];
  // slipper held in right hand (thrown later)
  const slipper = new THREE.Group();
  const sm = mesh(sph(0.07, 12, 8), C.ribbon, 0, 0, 0, slipper); sm.scale.set(0.6, 0.45, 1.3);
  mesh(sph(0.03, 8, 6), C.white, 0, 0.03, 0.03, slipper);
  slipper.position.set(0, -0.32, 0.02); arms[1].add(slipper);
  g.userData.slipper = slipper;
  const head = new THREE.Group(); head.position.y = 0.86; body.add(head); g.userData.head = head;
  mesh(sph(0.14, 18, 14), C.skin, 0, 0.1, 0, head);
  const hair = mesh(sph(0.155, 18, 14), C.hair, 0, 0.13, -0.025, head); hair.scale.set(1, 0.95, 0.95);
  const fringe = mesh(sph(0.1, 12, 8), C.hair, 0, 0.2, 0.06, head); fringe.scale.set(1.3, 0.5, 0.8);
  const bun = mesh(sph(0.08, 12, 10), C.hair, 0, 0.17, -0.15, head);
  const tail = mesh(sph(0.07, 12, 10), C.hair, 0, 0.02, -0.18, head); tail.scale.set(0.8, 1.6, 0.8);
  for (const sx of [-1, 1]) {
    const bow = mesh(sph(0.05, 10, 8), C.ribbon, 0.09 + sx * 0.05, 0.27, -0.02, head); bow.scale.set(1.1, 0.6, 0.5); bow.rotation.z = sx * 0.5;
    mesh(sph(0.017, 8, 6), C.eye, sx * 0.05, 0.1, 0.13, head);
    mesh(sph(0.026, 8, 6), C.cheek, sx * 0.085, 0.06, 0.11, head).scale.set(1, 0.7, 0.4);
  }
  void bun; void tail;
  const mouth = mesh(sph(0.015, 8, 6), C.deepRed, 0, 0.045, 0.135, head); mouth.scale.set(1.4, 0.7, 0.5);
  addShadow(g, 0.36);
  return g;
}

// ---------------------------------------------------------------- Mice
export function makeMouse() {
  const g = new THREE.Group(); g.name = 'mouse';
  const body = new THREE.Group(); g.add(body); g.userData.body = body;
  mesh(sph(0.2, 16, 12), C.mouse, 0, 0.17, 0, body).scale.set(0.9, 0.8, 1.35);
  const head = new THREE.Group(); head.position.set(0, 0.22, 0.25); body.add(head);
  mesh(sph(0.12, 14, 10), C.mouse, 0, 0, 0, head).scale.set(0.9, 0.85, 1.2);
  const snout = mesh(new THREE.ConeGeometry(0.07, 0.16, 12), C.mouse, 0, -0.02, 0.15, head); snout.rotation.x = Math.PI / 2;
  mesh(sph(0.025, 8, 6), C.pink, 0, -0.02, 0.23, head);
  for (const sx of [-1, 1]) {
    const ear = mesh(cyl(0.08, 0.08, 0.02, 16), C.pink, sx * 0.08, 0.1, -0.02, head);
    ear.rotation.x = Math.PI / 2; ear.rotation.z = sx * 0.3;
    mesh(sph(0.018, 8, 6), C.eye, sx * 0.05, 0.03, 0.09, head);
  }
  const curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0.15, -0.25), new THREE.Vector3(0, 0.1, -0.45), new THREE.Vector3(0.1, 0.18, -0.6), new THREE.Vector3(0.05, 0.3, -0.7),
  ]);
  mesh(new THREE.TubeGeometry(curve, 16, 0.014, 6), C.pink, 0, 0, 0, body);
  addShadow(g, 0.34);
  return g;
}

export function makeMouseKing() {
  const g = new THREE.Group(); g.name = 'mouseKing';
  const body = new THREE.Group(); g.add(body); g.userData.body = body;
  for (const sx of [-1, 1]) mesh(sph(0.08, 10, 8), C.mouseDark, sx * 0.1, 0.05, 0.05, body).scale.set(1, 0.6, 1.6);
  mesh(sph(0.26, 18, 14), C.mouse, 0, 0.42, 0, body).scale.set(1, 1.35, 0.9);
  mesh(sph(0.16, 12, 10), C.white, 0, 0.42, 0.13, body).scale.set(1, 1.4, 0.5); // belly
  // cape
  const cape = mesh(new THREE.CylinderGeometry(0.24, 0.42, 0.75, 20, 1, true, Math.PI * 0.4, Math.PI * 1.2), C.purple, 0, 0.4, -0.02, body);
  cape.material = paint('#6a3f8f', { rim: 0.35, side: THREE.DoubleSide, back: '#c0303a' });
  const collar = mesh(new THREE.TorusGeometry(0.17, 0.045, 8, 20), C.white, 0, 0.72, 0, body); collar.rotation.x = Math.PI / 2;
  const arms = [];
  for (const sx of [-1, 1]) {
    const a = new THREE.Group(); a.position.set(sx * 0.24, 0.62, 0.02); body.add(a);
    mesh(cyl(0.05, 0.04, 0.3), C.mouse, 0, -0.14, 0, a);
    mesh(sph(0.045, 8, 6), C.pink, 0, -0.3, 0, a);
    arms.push(a);
  }
  g.userData.armL = arms[0]; g.userData.armR = arms[1];
  const sword = new THREE.Group(); sword.position.set(0, -0.3, 0); arms[1].add(sword);
  mesh(box(0.025, 0.012, 0.45), C.silver, 0, 0, 0.26, sword);
  mesh(box(0.11, 0.025, 0.03), C.gold, 0, 0, 0.04, sword);
  g.userData.sword = sword;
  const head = new THREE.Group(); head.position.set(0, 0.86, 0.04); body.add(head); g.userData.head = head;
  mesh(sph(0.17, 16, 12), C.mouse, 0, 0, 0, head).scale.set(1, 0.9, 1.1);
  const snout = mesh(new THREE.ConeGeometry(0.09, 0.2, 14), C.mouse, 0, -0.03, 0.2, head); snout.rotation.x = Math.PI / 2;
  mesh(sph(0.03, 8, 6), C.pink, 0, -0.03, 0.3, head);
  for (const sx of [-1, 1]) {
    const ear = mesh(cyl(0.11, 0.11, 0.025, 18), C.pink, sx * 0.12, 0.13, -0.03, head);
    ear.rotation.x = Math.PI / 2; ear.rotation.z = sx * 0.35;
    mesh(sph(0.024, 8, 6), C.eye, sx * 0.065, 0.04, 0.13, head);
    const brow = mesh(box(0.06, 0.014, 0.01), C.eye, sx * 0.065, 0.085, 0.14, head); brow.rotation.z = sx * 0.35;
  }
  // crown
  const crown = new THREE.Group(); crown.position.set(0, 0.15, 0); head.add(crown); g.userData.crown = crown;
  mesh(cyl(0.11, 0.1, 0.06, 16), C.gold, 0, 0, 0, crown);
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2;
    const p = mesh(new THREE.ConeGeometry(0.03, 0.09, 6), C.gold, Math.sin(a) * 0.09, 0.07, Math.cos(a) * 0.09, crown);
    mesh(sph(0.015, 6, 5), C.ribbon, 0, 0.05, 0, p);
  }
  addShadow(g, 0.45);
  return g;
}

// ---------------------------------------------------------------- Sugar Plum Fairy
export function makeFairy() {
  const g = new THREE.Group(); g.name = 'fairy';
  const body = new THREE.Group(); g.add(body); g.userData.body = body;
  // standing leg en pointe + raised leg (retiré)
  mesh(cyl(0.035, 0.022, 0.62), C.skin, 0, 0.31, 0, body);
  const shoe = mesh(cyl(0.024, 0.02, 0.06), C.pink, 0, 0.03, 0, body); void shoe;
  const thigh = mesh(cyl(0.035, 0.03, 0.3), C.skin, 0.1, 0.5, 0.02, body); thigh.rotation.z = 1.1;
  const shin = mesh(cyl(0.03, 0.022, 0.28), C.skin, 0.1, 0.43, 0.02, body); shin.rotation.z = -0.6;
  // tutu
  const tutu = mesh(cyl(0.48, 0.5, 0.07, 32), C.tutu, 0, 0.68, 0, body);
  tutu.material = paint('#f4b7d0', { wobble: 0.06, wobbleFreq: 9, rim: 0.4, color2: '#e793bd', stripe: 0.0001, twist: 18 });
  mesh(cyl(0.38, 0.42, 0.06, 28), C.lilac, 0, 0.71, 0, body);
  mesh(cyl(0.09, 0.1, 0.25), C.tutu, 0, 0.84, 0, body); // bodice
  // arms in high fifth
  for (const sx of [-1, 1]) {
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(sx * 0.09, 0.94, 0), new THREE.Vector3(sx * 0.22, 1.1, 0.04),
      new THREE.Vector3(sx * 0.17, 1.32, 0.05), new THREE.Vector3(sx * 0.04, 1.4, 0.04),
    ]);
    mesh(new THREE.TubeGeometry(curve, 16, 0.026, 6), C.skin, 0, 0, 0, body);
  }
  const head = new THREE.Group(); head.position.y = 1.08; body.add(head);
  mesh(sph(0.105, 16, 12), C.skin, 0, 0, 0, head);
  mesh(sph(0.11, 16, 12), C.hair, 0, 0.03, -0.02, head).scale.set(1, 0.9, 0.95);
  mesh(sph(0.055, 10, 8), C.hair, 0, 0.1, -0.08, head);
  for (const sx of [-1, 1]) {
    mesh(sph(0.013, 8, 6), C.eye, sx * 0.038, 0.0, 0.1, head);
    mesh(sph(0.02, 8, 6), C.cheek, sx * 0.065, -0.03, 0.085, head).scale.set(1, 0.7, 0.4);
  }
  const tiara = mesh(new THREE.TorusGeometry(0.08, 0.012, 6, 16, Math.PI), C.gold, 0, 0.09, 0.02, head);
  tiara.rotation.x = -0.4;
  mesh(sph(0.025, 8, 6), paint('#9fd9f0', { emissive: 0.5 }), 0, 0.17, 0.04, head);
  // wings
  for (const sx of [-1, 1]) {
    const w = mesh(sph(0.22, 14, 10), paint('#e9e2ff', { opacity: 0.55, emissive: 0.3, side: THREE.DoubleSide, depthWrite: false }), sx * 0.2, 0.95, -0.12, body);
    w.scale.set(1, 1.5, 0.08); w.rotation.z = sx * -0.5;
  }
  addShadow(g, 0.5);
  return g;
}

// ---------------------------------------------------------------- Walnut-shell boat
export function makeWalnutBoat() {
  const g = new THREE.Group(); g.name = 'walnut';
  const shellGeo = new THREE.SphereGeometry(1, 40, 20, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2);
  const shell = mesh(shellGeo, paint('#9a6232', {
    back: '#b07a48', wobble: 0.09, wobbleFreq: 6, rim: 0.3, pigment: 0.4, side: THREE.DoubleSide,
    color2: '#7d4a24', stripe: 2.2, axis: 1,
  }), 0, 0.62, 0, g);
  shell.scale.set(0.95, 0.62, 1.25);
  const rimRing = mesh(new THREE.TorusGeometry(1, 0.06, 8, 40), paint('#7d4a24', { wobble: 0.04, wobbleFreq: 8 }), 0, 0.62, 0, g);
  rimRing.rotation.x = Math.PI / 2; rimRing.scale.set(0.95, 1.25, 1);
  // mast + holly-leaf sail + lantern
  const rig = new THREE.Group(); g.add(rig); g.userData.rig = rig;
  mesh(cyl(0.025, 0.03, 1.5), paint('#5a3a22'), 0, 1.1, -0.15, rig);
  const sailShape = new THREE.Shape();
  sailShape.moveTo(0, 0); sailShape.quadraticCurveTo(0.55, 0.35, 0.05, 1.1); sailShape.quadraticCurveTo(0.15, 0.5, 0, 0);
  const sail = mesh(new THREE.ShapeGeometry(sailShape, 12), paint('#f3e6c8', { side: THREE.DoubleSide, color2: '#d6404c', stripe: 3.0, axis: 0 }), 0.03, 0.62, -0.15, rig);
  sail.rotation.y = Math.PI / 2; g.userData.sail = sail;
  const flag = mesh(new THREE.ConeGeometry(0.07, 0.22, 4), paint('#d6404c'), 0, 1.9, -0.05, rig); flag.rotation.x = Math.PI / 2;
  const lantern = new THREE.Group(); lantern.position.set(0, 0.9, 1.15); g.add(lantern);
  mesh(cyl(0.012, 0.012, 0.3), paint('#5a3a22'), 0, 0.15, 0, lantern);
  mesh(sph(0.08, 12, 10), paint('#ffd884', { emissive: 0.85 }), 0, 0.33, 0.02, lantern);
  g.userData.lantern = lantern;
  g.userData.shell = shell;
  addShadow(g, 1.3);
  return g;
}
