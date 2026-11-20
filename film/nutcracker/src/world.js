// Sets: the giant parlour (toy's-eye scale), the snowy night outside, the sky,
// the cloud sea and the Land of Sweets on Cloud Nine.
import * as THREE from 'three';
import { paint, blobShadow, NOISE_GLSL } from './materials.js';
import { mesh } from './characters.js';

const rand = (() => { let s = 1234567; return () => ((s = (s * 16807) % 2147483647) / 2147483647); })();
const sph = (r, w = 20, h = 14) => new THREE.SphereGeometry(r, w, h);
const cyl = (rt, rb, h, s = 24) => new THREE.CylinderGeometry(rt, rb, h, s);
const box = (x, y, z) => new THREE.BoxGeometry(x, y, z);

// ------------------------------------------------------------------ Parlour
// Back wall z=-16 with a big window (x -4.5..2.5, y 5..14). Toys are ~1 unit tall.
export const WIN = { x0: -4.5, x1: 2.5, y0: 5, y1: 14, z: -16 };

export function makeRoom() {
  const g = new THREE.Group(); g.name = 'room';
  const refs = {};
  // floor planks
  const floor = mesh(box(46, 0.4, 34), paint('#9c6038', { color2: '#8a5230', stripe: 0.45, axis: 1, pigment: 0.35 }), 0, -0.2, 1, g);
  void floor;
  // round rug
  mesh(cyl(7.2, 7.2, 0.06, 64), paint('#8f2335', { pigment: 0.3 }), 0, 0.03, -4.5, g);
  mesh(cyl(6.4, 6.4, 0.07, 64), paint('#c94a3b', { color2: '#e3b04e', stripe: 0.0001, twist: 40, pigment: 0.3 }), 0, 0.04, -4.5, g);
  mesh(cyl(4.6, 4.6, 0.08, 64), paint('#7a2840', { pigment: 0.3 }), 0, 0.05, -4.5, g);
  mesh(cyl(3.2, 3.2, 0.09, 64), paint('#2f5f4f', { color2: '#e3b04e', stripe: 0.0001, twist: 16, pigment: 0.3 }), 0, 0.06, -4.5, g);
  mesh(cyl(1.6, 1.6, 0.1, 48), paint('#e9d6a8', { pigment: 0.3 }), 0, 0.07, -4.5, g);

  // back wall with a window hole
  const wallMat = paint('#2f5a49', { color2: '#295040', stripe: 0.9, axis: 1, pigment: 0.3 });
  const W = WIN, H = 24, Z = W.z;
  mesh(box(W.x0 + 23, H, 0.6), wallMat, (-23 + W.x0) / 2, H / 2, Z, g);
  mesh(box(23 - W.x1, H, 0.6), wallMat, (W.x1 + 23) / 2, H / 2, Z, g);
  mesh(box(W.x1 - W.x0, W.y0, 0.6), wallMat, (W.x0 + W.x1) / 2, W.y0 / 2, Z, g);
  mesh(box(W.x1 - W.x0, H - W.y1, 0.6), wallMat, (W.x0 + W.x1) / 2, (H + W.y1) / 2, Z, g);
  // side walls + ceiling
  mesh(box(0.6, H, 34), wallMat, -23, H / 2, 0, g);
  mesh(box(0.6, H, 34), wallMat, 23, H / 2, 0, g);
  mesh(box(46, 0.6, 34), paint('#e7d6b8'), 0, H, 0, g);
  // wainscot + rail
  const wain = paint('#6b2a2e', { pigment: 0.3 });
  mesh(box(46, 3, 0.4), wain, 0, 1.5, Z + 0.5, g);
  mesh(box(46, 0.3, 0.6), paint('#d9b46a'), 0, 3.1, Z + 0.5, g);
  mesh(box(0.4, 3, 34), wain, -22.6, 1.5, 0, g);
  mesh(box(0.4, 3, 34), wain, 22.6, 1.5, 0, g);
  // mouse hole in the wainscot (dark arch)
  const hole = mesh(new THREE.CircleGeometry(0.9, 24, 0, Math.PI), paint('#1a1022', { emissive: 1 }), 11.5, 0.02, Z + 0.72, g);
  hole.scale.y = 1.3;

  // window frame, mullions, sill, two casement panes (hinged on the outer edges)
  const frameMat = paint('#f1e5cc', { rim: 0.2 });
  const fw = 0.45;
  mesh(box(W.x1 - W.x0 + fw * 2, fw, 0.9), frameMat, (W.x0 + W.x1) / 2, W.y1 + fw / 2, Z + 0.1, g);
  mesh(box(W.x1 - W.x0 + 1.6, 0.4, 1.6), frameMat, (W.x0 + W.x1) / 2, W.y0 - 0.2, Z + 0.5, g);
  mesh(box(fw, W.y1 - W.y0, 0.9), frameMat, W.x0 - fw / 2, (W.y0 + W.y1) / 2, Z + 0.1, g);
  mesh(box(fw, W.y1 - W.y0, 0.9), frameMat, W.x1 + fw / 2, (W.y0 + W.y1) / 2, Z + 0.1, g);
  const glass = paint('#9fb6dd', { opacity: 0.12, emissive: 0.6, depthWrite: false, side: THREE.DoubleSide });
  const half = (W.x1 - W.x0) / 2, hgt = W.y1 - W.y0;
  const panes = [];
  for (const side of [-1, 1]) {
    const hinge = new THREE.Group();
    hinge.position.set(side < 0 ? W.x0 : W.x1, W.y0, Z - 0.1);
    g.add(hinge);
    const pane = new THREE.Group(); hinge.add(pane);
    const dir = side < 0 ? 1 : -1; // pane extends toward window centre
    const cx = dir * half / 2;
    mesh(box(half, 0.22, 0.2), frameMat, cx, 0.11, 0, pane);
    mesh(box(half, 0.22, 0.2), frameMat, cx, hgt - 0.11, 0, pane);
    mesh(box(0.22, hgt, 0.2), frameMat, dir * 0.11, hgt / 2, 0, pane);
    mesh(box(0.22, hgt, 0.2), frameMat, dir * (half - 0.11), hgt / 2, 0, pane);
    mesh(box(half, 0.14, 0.15), frameMat, cx, hgt / 2, 0, pane);
    mesh(box(0.14, hgt, 0.15), frameMat, cx, hgt / 2, 0, pane);
    mesh(new THREE.PlaneGeometry(half, hgt), glass, cx, hgt / 2, 0, pane);
    panes.push({ hinge, side });
  }
  refs.panes = panes;
  // curtains
  for (const side of [-1, 1]) {
    const geo = cyl(1.2, 1.9, 17, 24);
    const c = mesh(geo, paint('#a02638', { color2: '#861d2e', stripe: 0.0001, twist: 10, wobble: 0.25, wobbleFreq: 0.8 }),
      side < 0 ? W.x0 - 2.0 : W.x1 + 2.0, 8.5, Z + 1.4, g);
    c.scale.z = 0.45;
    const tie = mesh(new THREE.TorusGeometry(1.25, 0.12, 8, 24), paint('#e3b04e'), c.position.x, 7, Z + 1.4, g);
    tie.rotation.x = Math.PI / 2; tie.scale.y = 0.5;
  }
  mesh(cyl(0.18, 0.18, W.x1 - W.x0 + 8, 12), paint('#d9b46a'), (W.x0 + W.x1) / 2, 17.2, Z + 1.4, g).rotation.z = Math.PI / 2;

  // ------------------------------------------------------ Christmas tree (giant)
  const tree = new THREE.Group(); tree.position.set(-11, 0, -9.5); g.add(tree); refs.tree = tree;
  mesh(cyl(0.7, 0.9, 3), paint('#6b4228'), 0, 1.5, 0, tree);
  mesh(cyl(2.2, 1.8, 1.6, 8), paint('#b8323f', { color2: '#e3b04e', stripe: 1.2, axis: 0 }), 0, 0.8, 0, tree); // pot
  const tiers = [[6.4, 6, 2.5], [5.2, 5.4, 5.7], [4.0, 4.8, 8.6], [2.8, 4.2, 11.2], [1.6, 3.4, 13.5]];
  const greenA = paint('#245c3e', { wobble: 0.45, wobbleFreq: 1.4, pigment: 0.4, rim: 0.15 });
  const ornaments = [];
  tiers.forEach(([r, h, y], i) => {
    const cone = mesh(new THREE.ConeGeometry(r, h, 28, 4), i % 2 ? greenA : paint('#2c6b47', { wobble: 0.45, wobbleFreq: 1.4, pigment: 0.4, rim: 0.15 }), 0, y + h / 2 - 0.4, 0, tree);
    void cone;
    const n = Math.round(r * 3.2);
    for (let k = 0; k < n; k++) {
      const a = (k / n) * Math.PI * 2 + i * 0.7;
      const hh = 0.2 + rand() * 0.45;
      const rr = r * (1 - hh) * 1.02;
      ornaments.push(new THREE.Vector3(Math.cos(a) * rr, y - 0.4 + hh * h, Math.sin(a) * rr));
    }
  });
  // ornaments (instanced)
  const ornGeo = sph(0.32, 14, 10);
  const orn = new THREE.InstancedMesh(ornGeo, paint('#ffffff', { rim: 0.6 }), ornaments.length);
  const pal = ['#d63a46', '#e9b947', '#4f7fd0', '#f4f0e6', '#c25bb3'].map((c) => new THREE.Color(c));
  const tmp = new THREE.Object3D();
  ornaments.forEach((p, i) => {
    tmp.position.copy(p); tmp.scale.setScalar(0.8 + rand() * 0.6); tmp.updateMatrix();
    orn.setMatrixAt(i, tmp.matrix); orn.setColorAt(i, pal[i % pal.length]);
  });
  tree.add(orn);
  // candles with flames
  const candleMat = paint('#f6efe1'); const flameMat = paint('#ffd66b', { emissive: 0.95 });
  refs.flames = [];
  for (let k = 0; k < 14; k++) {
    const i = k % 4; const [r, h, y] = tiers[i];
    const a = k * 2.4; const hh = 0.12; const rr = r * (1 - hh) * 0.98;
    const cx = Math.cos(a) * rr, cz = Math.sin(a) * rr, cy = y - 0.4 + hh * h;
    mesh(cyl(0.09, 0.09, 0.6, 8), candleMat, cx, cy + 0.3, cz, tree);
    const f = mesh(sph(0.11, 8, 6), flameMat, cx, cy + 0.72, cz, tree); f.scale.y = 1.8; refs.flames.push(f);
  }
  // star
  const starShape = new THREE.Shape();
  for (let i = 0; i < 10; i++) { const a = (i / 10) * Math.PI * 2 + Math.PI / 2; const r = i % 2 ? 0.55 : 1.3; i ? starShape.lineTo(Math.cos(a) * r, Math.sin(a) * r) : starShape.moveTo(Math.cos(a) * r, Math.sin(a) * r); }
  const star = mesh(new THREE.ExtrudeGeometry(starShape, { depth: 0.3, bevelEnabled: true, bevelSize: 0.08, bevelThickness: 0.08, bevelSegments: 1 }), paint('#ffd45c', { emissive: 0.7, rim: 0.5 }), 0, 17.6, -0.15, tree);
  refs.star = star;
  // garland (bead strings spiralling)
  const gpts = [];
  for (let i = 0; i <= 160; i++) { const u = i / 160; const y = 2.4 + u * 13; const r = 6.3 * (1 - u) + 0.6; const a = u * Math.PI * 9; gpts.push(new THREE.Vector3(Math.cos(a) * r, y, Math.sin(a) * r)); }
  mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(gpts), 400, 0.09, 6), paint('#f0d58a', { rim: 0.5 }), 0, 0, 0, tree);

  // presents
  const presents = [
    [-5.2, -6.4, 2.4, 1.8, 2.0, '#3f6fc4', '#f2d16b', 0.3], [-7.4, -4.6, 1.8, 2.6, 1.8, '#d9434e', '#f6efe1', -0.4],
    [-4.0, -9.8, 3.0, 2.2, 2.6, '#e8b84a', '#c0303a', 0.1], [-14.6, -5.8, 2.6, 1.6, 2.2, '#7c4fb0', '#f2d16b', 0.6],
    [-9.2, -4.0, 1.4, 1.2, 1.4, '#3a8a63', '#d9434e', -0.2],
  ];
  for (const [x, z, w, h, d, c1, c2, ry] of presents) {
    const p = new THREE.Group(); p.position.set(x, 0, z); p.rotation.y = ry; g.add(p);
    mesh(box(w, h, d), paint(c1, { pigment: 0.3 }), 0, h / 2, 0, p);
    const rib = paint(c2, { rim: 0.4 });
    mesh(box(w + 0.04, h + 0.04, 0.22), rib, 0, h / 2, 0, p);
    mesh(box(0.22, h + 0.04, d + 0.04), rib, 0, h / 2, 0, p);
    for (const s of [-1, 1]) { const b = mesh(new THREE.TorusGeometry(0.28, 0.09, 8, 16), rib, s * 0.26, h + 0.2, 0, p); b.rotation.y = Math.PI / 2; b.rotation.x = s * 0.5; }
    p.add(Object.assign(blobShadow(Math.max(w, d) * 0.8, 0.4), {}));
  }

  // ------------------------------------------------------ Fireplace
  const fp = new THREE.Group(); fp.position.set(9, 0, -15.2); g.add(fp);
  const brick = paint('#b6553f', { color2: '#9a4535', stripe: 1.6, axis: 0, pigment: 0.35 });
  mesh(box(2, 7, 1.8), brick, -3.5, 3.5, 0, fp);
  mesh(box(2, 7, 1.8), brick, 3.5, 3.5, 0, fp);
  mesh(box(9, 2, 1.8), brick, 0, 6, 0, fp);
  mesh(box(10.4, 0.5, 2.4), paint('#5a3324'), 0, 7.2, 0.2, fp);
  mesh(box(5, 5, 0.4), paint('#1d1424', { emissive: 0.9 }), 0, 2.5, -0.6, fp);
  mesh(box(6.4, 0.3, 2.6), paint('#3b2a2f'), 0, 0.15, 0.6, fp);
  const logMat = paint('#5b3a25', { wobble: 0.06, wobbleFreq: 4 });
  for (const [x, rz] of [[-0.8, 0.2], [0.8, -0.2]]) { const l = mesh(cyl(0.35, 0.35, 2.6, 10), logMat, x, 0.6, -0.1, fp); l.rotation.z = Math.PI / 2 + rz; l.rotation.y = 0.4; }
  refs.fire = [];
  const fireCols = ['#ff8a2a', '#ffc04a', '#ffe58a'];
  for (let i = 0; i < 7; i++) {
    const f = mesh(new THREE.ConeGeometry(0.45 - (i % 3) * 0.1, 2 - (i % 3) * 0.45, 10), paint(fireCols[i % 3], { emissive: 1, wobble: 0.12, wobbleFreq: 3 }),
      -1.2 + (i * 0.4), 1.6 - (i % 3) * 0.1, -0.1 + (i % 3) * 0.1, fp);
    refs.fire.push(f);
  }
  // stockings on mantle
  for (const [x, c] of [[-2.6, '#d9434e'], [0, '#3a8a63'], [2.6, '#3f6fc4']]) {
    const s = new THREE.Group(); s.position.set(x, 6.4, 1.3); fp.add(s);
    mesh(box(0.9, 1.6, 0.4), paint(c), 0, -0.6, 0, s);
    mesh(box(1.2, 0.6, 0.45), paint(c), 0.15, -1.45, 0, s);
    mesh(box(1.0, 0.4, 0.5), paint('#f6efe1'), 0, 0.15, 0, s);
  }

  // ------------------------------------------------------ Grandfather clock
  const clock = new THREE.Group(); clock.position.set(17, 0, -13.5); clock.rotation.y = -0.35; g.add(clock);
  const wood = paint('#6a3b26', { pigment: 0.35 });
  mesh(box(3, 2, 2), wood, 0, 1, 0, clock);
  mesh(box(2.4, 8, 1.6), wood, 0, 6, 0, clock);
  mesh(box(3.4, 4, 2.2), wood, 0, 12, 0, clock);
  mesh(cyl(1.7, 1.7, 0.6, 3), wood, 0, 14.6, 0, clock).rotation.set(Math.PI / 2, 0, Math.PI / 2);
  const face = mesh(cyl(1.35, 1.35, 0.2, 32), paint('#f4ead2'), 0, 12, 1.12, clock); face.rotation.x = Math.PI / 2;
  mesh(new THREE.TorusGeometry(1.35, 0.12, 8, 32), paint('#e3b04e'), 0, 12, 1.2, clock);
  for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; mesh(sph(0.07, 6, 4), paint('#2a2238'), Math.sin(a) * 1.08, 12 + Math.cos(a) * 1.08, 1.24, clock); }
  const handH = mesh(box(0.12, 0.8, 0.05), paint('#2a2238'), 0, 12.35, 1.28, clock);
  const handM = new THREE.Group(); handM.position.set(0, 12, 1.32); clock.add(handM);
  mesh(box(0.08, 1.1, 0.05), paint('#2a2238'), 0, 0.5, 0, handM);
  refs.clockHand = handM; void handH;
  // owl on top (Drosselmeyer's clock)
  const owl = new THREE.Group(); owl.position.set(0, 15.2, 0.2); clock.add(owl);
  mesh(sph(0.6, 14, 10), paint('#c49a5a'), 0, 0.5, 0, owl).scale.set(1, 1.2, 0.9);
  for (const s of [-1, 1]) { mesh(sph(0.2, 10, 8), paint('#f4ead2'), s * 0.22, 0.75, 0.45, owl); mesh(sph(0.1, 8, 6), paint('#2a2238'), s * 0.22, 0.75, 0.62, owl); }
  mesh(new THREE.ConeGeometry(0.08, 0.2, 6), paint('#e3b04e'), 0, 0.55, 0.62, owl).rotation.x = Math.PI / 2;
  refs.owl = owl;
  const pend = new THREE.Group(); pend.position.set(0, 9.6, 0.85); clock.add(pend); refs.pendulum = pend;
  mesh(box(0.08, 4, 0.05), paint('#e3b04e'), 0, -2, 0, pend);
  mesh(cyl(0.45, 0.45, 0.1, 24), paint('#e3b04e', { rim: 0.6 }), 0, -4.1, 0, pend).rotation.x = Math.PI / 2;

  // walnuts in a bowl near the rug (one of them becomes the boat)
  const bowl = mesh(new THREE.SphereGeometry(1.1, 24, 12, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), paint('#e9e1d0', { back: '#cbbfa8', side: THREE.DoubleSide, color2: '#5677b8', stripe: 3, axis: 0 }), 4.6, 1.0, -9.6, g);
  bowl.scale.y = 0.9;
  for (let i = 0; i < 4; i++) { const n = mesh(sph(0.36, 14, 10), paint('#9a6232', { wobble: 0.08, wobbleFreq: 9 }), 4.3 + (i % 2) * 0.6, 0.95 + (i > 1 ? 0.3 : 0), -9.4 - (i % 3) * 0.3, g); n.scale.y = 0.85; }
  return { group: g, refs };
}

// ------------------------------------------------------------------ Outside
export function makeOutside() {
  const g = new THREE.Group(); g.name = 'outside';
  // snowy ground beyond the wall, with soft dunes
  const gg = new THREE.PlaneGeometry(900, 900, 80, 80); gg.rotateX(-Math.PI / 2);
  const pos = gg.attributes.position;
  for (let i = 0; i < pos.count; i++) { const x = pos.getX(i), z = pos.getZ(i); pos.setY(i, Math.sin(x * 0.03) * Math.cos(z * 0.025) * 3 + Math.sin(x * 0.011 + z * 0.017) * 5 - 4); }
  gg.computeVertexNormals();
  mesh(gg, paint('#e8ecf6', { pigment: 0.25, rim: 0.1 }), 0, -0.5, -470, g);
  // pines
  const pineMat = paint('#1f4a3a', { wobble: 0.5, wobbleFreq: 0.9, pigment: 0.35 });
  const snowMat = paint('#f2f4fb', { wobble: 0.3, wobbleFreq: 1.1 });
  for (let i = 0; i < 46; i++) {
    const x = (rand() - 0.5) * 220, z = -26 - rand() * 170, s = 2 + rand() * 4;
    if (Math.abs(x) < 8 && z > -60) continue;
    const t = new THREE.Group(); t.position.set(x, -2, z); t.scale.setScalar(s); g.add(t);
    mesh(cyl(0.15, 0.2, 1, 6), paint('#4a2f22'), 0, 0.5, 0, t);
    for (let k = 0; k < 3; k++) {
      mesh(new THREE.ConeGeometry(1.4 - k * 0.35, 1.6, 9), pineMat, 0, 1.4 + k * 0.9, 0, t);
      mesh(new THREE.ConeGeometry(0.9 - k * 0.25, 0.7, 9), snowMat, 0, 2.0 + k * 0.9, 0, t);
    }
  }
  // cottages with glowing windows
  const roofMat = paint('#f4f6fc'); const winMat = paint('#ffcf6b', { emissive: 0.95 });
  const wallCols = ['#b8564a', '#5d6fa6', '#c9944f', '#7b5c8f'];
  for (let i = 0; i < 10; i++) {
    const x = (i % 2 ? 1 : -1) * (18 + rand() * 60), z = -40 - rand() * 130;
    const h = new THREE.Group(); h.position.set(x, -2, z); h.rotation.y = rand() * 1.5; h.scale.setScalar(3 + rand() * 2); g.add(h);
    mesh(box(2, 1.4, 1.6), paint(wallCols[i % 4]), 0, 0.7, 0, h);
    const roof = mesh(cyl(0, 1.6, 1.2, 4), roofMat, 0, 2.0, 0, h); roof.rotation.y = Math.PI / 4; roof.scale.set(1, 1, 0.8);
    mesh(box(0.4, 0.4, 0.05), winMat, -0.5, 0.8, 0.82, h); mesh(box(0.4, 0.4, 0.05), winMat, 0.5, 0.8, 0.82, h);
    mesh(box(0.3, 0.9, 0.3), paint('#6b3a2e'), 0.6, 2.2, 0, h);
  }
  return g;
}

// ------------------------------------------------------------------ Sky dome
export function makeSky() {
  const geo = new THREE.SphereGeometry(800, 48, 24);
  const mat = new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false,
    uniforms: { uDawn: { value: 0 }, uBoil: { value: 0 } },
    vertexShader: `varying vec3 vDir; void main(){ vDir = normalize(position); gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); gl_Position.z = gl_Position.w*0.9999; }`,
    fragmentShader: `${NOISE_GLSL}
      uniform float uDawn; uniform float uBoil; varying vec3 vDir;
      void main(){
        float h = vDir.y;
        vec3 nTop = vec3(0.07,0.08,0.24), nMid = vec3(0.16,0.18,0.42), nLow = vec3(0.33,0.30,0.55);
        vec3 dTop = vec3(0.36,0.52,0.86), dMid = vec3(0.96,0.66,0.7), dLow = vec3(1.0,0.82,0.58);
        vec3 night = mix(nLow, mix(nMid, nTop, smoothstep(0.15,0.7,h)), smoothstep(-0.1,0.2,h));
        vec3 dawn = mix(dLow, mix(dMid, dTop, smoothstep(0.1,0.65,h)), smoothstep(-0.15,0.18,h));
        vec3 c = mix(night, dawn, uDawn);
        // wide brushy bands in the sky
        float b = fbm2(vec2(atan(vDir.z,vDir.x)*2.0, h*9.0) + uBoil*0.6);
        c *= 0.93 + 0.14*b;
        gl_FragColor = vec4(c,1.0);
      }`,
  });
  const m = new THREE.Mesh(geo, mat); m.renderOrder = -10; m.frustumCulled = false;
  return m;
}

export function makeMoon() {
  const g = new THREE.Group();
  mesh(sph(14, 32, 20), paint('#fbf1cf', { emissive: 0.92, pigment: 0.35 }), 0, 0, 0, g);
  const halo = mesh(sph(24, 24, 16), paint('#cfd6ff', { emissive: 1, opacity: 0.18, depthWrite: false }), 0, 0, -6, g);
  void halo;
  for (const [x, y, r] of [[-4, 3, 2.6], [5, -4, 3.2], [2, 6, 1.6]]) mesh(sph(r, 12, 8), paint('#efdcae', { emissive: 0.9 }), x, y, 12, g).scale.z = 0.3;
  return g;
}

// ------------------------------------------------------------------ Clouds
const cloudMatTop = () => paint('#fbf3f1', { wobble: 0.35, wobbleFreq: 0.35, rim: 0.55, pigment: 0.25 });
function cloudPuffs(n, spread, rMin, rMax, flat) {
  const out = [];
  for (let i = 0; i < n; i++) {
    const a = rand() * Math.PI * 2, d = Math.sqrt(rand()) * spread;
    const r = rMin + rand() * (rMax - rMin);
    out.push([Math.cos(a) * d, (rand() - 0.3) * r * flat, Math.sin(a) * d, r]);
  }
  return out;
}

function instPuffs(list, mat, color) {
  const geo = new THREE.IcosahedronGeometry(1, 3);
  const im = new THREE.InstancedMesh(geo, mat, list.length);
  const tmp = new THREE.Object3D();
  const c = new THREE.Color();
  list.forEach(([x, y, z, r, tint], i) => {
    tmp.position.set(x, y, z); tmp.scale.set(r, r * 0.78, r); tmp.updateMatrix(); im.setMatrixAt(i, tmp.matrix);
    c.set(color); if (tint) c.multiplyScalar(tint); im.setColorAt(i, c);
  });
  im.frustumCulled = false;
  return im;
}

export function makeCloudSea() {
  const g = new THREE.Group(); g.name = 'clouds';
  // the cloud layer the boat pierces (y 64..86), spread along the flight path
  const layer = [];
  for (let i = 0; i < 70; i++) {
    const cx = (rand() - 0.5) * 300, cz = -40 - rand() * 260;
    const near = Math.abs(cx) < 18 && cz > -125 && cz < -95; // keep a gap where the camera passes
    if (near) continue;
    for (const [x, y, z, r] of cloudPuffs(6, 10, 5, 11, 0.6)) layer.push([cx + x, 74 + y, cz + z, r, 0.92 + rand() * 0.08]);
  }
  g.add(instPuffs(layer, cloudMatTop(), '#e9e3f2'));
  // a few drifting puffs lower down (seen in the night sky)
  const low = [];
  for (let i = 0; i < 16; i++) {
    const cx = (rand() - 0.5) * 200, cz = -60 - rand() * 120, cy = 30 + rand() * 20;
    for (const [x, y, z, r] of cloudPuffs(4, 6, 3, 6, 0.5)) low.push([cx + x, cy + y, cz + z, r, 0.75]);
  }
  g.add(instPuffs(low, paint('#8e8fbf', { wobble: 0.3, wobbleFreq: 0.4, rim: 0.4 }), '#ffffff'));
  // Cloud Nine: the big island (top surface around y=95) centred at (0,95,-160)
  const island = [];
  for (const [x, y, z, r] of cloudPuffs(70, 46, 7, 15, 0.35)) island.push([x, 83 + y, -160 + z, r, 0.95 + rand() * 0.05]);
  for (const [x, y, z, r] of cloudPuffs(40, 40, 6, 12, 0.5)) island.push([x, 76 + y, -160 + z, r, 0.85]);
  g.add(instPuffs(island, cloudMatTop(), '#fff4f2'));
  // flat top so things can stand on it
  const top = mesh(cyl(44, 46, 2, 48), paint('#fff4f2', { wobble: 0.6, wobbleFreq: 0.3, rim: 0.3 }), 0, 94, -160, g);
  void top;
  return g;
}

// ------------------------------------------------------------------ Land of Sweets
export function makeKingdom() {
  const g = new THREE.Group(); g.name = 'kingdom'; g.position.set(0, 95, -160);
  const refs = {};
  const pink = (o = {}) => paint('#f7b4c6', { color2: '#fbe9ef', rim: 0.45, ...o });
  // castle
  const castle = new THREE.Group(); castle.position.set(0, 0, -14); g.add(castle);
  mesh(cyl(5, 5.4, 14, 32), pink({ stripe: 0.35, twist: 6 }), 0, 7, 0, castle);
  mesh(new THREE.ConeGeometry(6, 8, 32), paint('#9fe0c8', { color2: '#e8fff6', stripe: 0.5, twist: 8, rim: 0.4 }), 0, 18, 0, castle);
  mesh(sph(0.8), paint('#ffd45c', { emissive: 0.6 }), 0, 22.5, 0, castle);
  mesh(new THREE.TorusGeometry(5.3, 0.5, 10, 40), paint('#fffaf0', { wobble: 0.25, wobbleFreq: 2 }), 0, 13.8, 0, castle).rotation.x = Math.PI / 2;
  for (const [x, z, h, col] of [[-9, 2, 10, '#c9a6ef'], [9, 2, 10, '#a8d8f5'], [-6, -6, 12, '#ffd0a6'], [6, -6, 12, '#f7b4c6']]) {
    const t = new THREE.Group(); t.position.set(x, 0, z); castle.add(t);
    mesh(cyl(2.2, 2.4, h, 24), paint(col, { color2: '#fffaf0', stripe: 0.5, twist: 4, rim: 0.45 }), 0, h / 2, 0, t);
    mesh(new THREE.ConeGeometry(2.8, 5, 24), paint('#f37aa0', { rim: 0.4 }), 0, h + 2.5, 0, t);
    mesh(new THREE.TorusGeometry(2.4, 0.3, 8, 24), paint('#fffaf0'), 0, h, 0, t).rotation.x = Math.PI / 2;
    for (let k = 0; k < 3; k++) mesh(box(0.7, 1.1, 0.2), paint('#ffd36b', { emissive: 0.8 }), Math.sin(k * 2.1) * 2.25, h * 0.55, Math.cos(k * 2.1) * 2.25, t).rotation.y = k * 2.1;
  }
  mesh(box(3.2, 4.5, 0.6), paint('#8a4b8f'), 0, 2.25, 5.1, castle);
  mesh(cyl(1.6, 1.6, 0.6, 24, 1), paint('#8a4b8f'), 0, 4.5, 5.1, castle).rotation.x = Math.PI / 2;
  // candy canes
  for (const [x, z, s] of [[-14, 4, 1], [13, 6, 1.2], [-18, -8, 1.4], [19, -6, 1.1], [-7, 14, 0.8]]) {
    const pts = [new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 5, 0), new THREE.Vector3(0, 6.6, 0), new THREE.Vector3(0.8, 7.4, 0), new THREE.Vector3(1.7, 6.8, 0), new THREE.Vector3(1.8, 6, 0)];
    const cane = mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 40, 0.38, 12), paint('#e8384f', { color2: '#fffaf0', stripe: 1.4, twist: 1, axis: 0 }), x, 0, z, g);
    cane.scale.setScalar(s); cane.rotation.y = x * 0.2;
  }
  // lollipop trees
  const lolli = [];
  for (const [x, z, c1, c2] of [[-11, 10, '#ff8fb1', '#fff3c4'], [10, 13, '#8fd3ff', '#ffffff'], [16, 0, '#ffd36b', '#ff7f8f'], [-16, -1, '#b48fff', '#fff3c4'], [-4, 20, '#9fe0a0', '#ffffff']]) {
    const l = new THREE.Group(); l.position.set(x, 0, z); g.add(l);
    mesh(cyl(0.15, 0.15, 4.5, 8), paint('#fffaf0'), 0, 2.25, 0, l);
    const disc = mesh(cyl(1.6, 1.6, 0.5, 40), paint(c1, { color2: c2, stripe: 0.0001, twist: 5, rim: 0.5 }), 0, 5.6, 0, l);
    disc.rotation.x = Math.PI / 2;
    lolli.push(disc);
    l.add(blobShadow(1.4, 0.3));
  }
  refs.lolli = lolli;
  // gingerbread houses
  for (const [x, z, ry] of [[-15, 9, 0.6], [15, 9, -0.5]]) {
    const h = new THREE.Group(); h.position.set(x, 0, z); h.rotation.y = ry; g.add(h);
    mesh(box(4, 3, 3.4), paint('#b8743c', { pigment: 0.35 }), 0, 1.5, 0, h);
    const roof = mesh(cyl(0, 3.4, 2.4, 4), paint('#fffaf0', { wobble: 0.15, wobbleFreq: 2 }), 0, 4.2, 0, h); roof.rotation.y = Math.PI / 4; roof.scale.set(1, 1, 0.85);
    mesh(box(1, 1.6, 0.1), paint('#e8384f'), 0, 0.8, 1.72, h);
    for (const s of [-1, 1]) mesh(box(0.8, 0.8, 0.1), paint('#ffd36b', { emissive: 0.8 }), s * 1.3, 1.8, 1.72, h);
    for (let k = 0; k < 6; k++) mesh(sph(0.22, 8, 6), paint(['#e8384f', '#3fa36a', '#ffd36b'][k % 3], { rim: 0.5 }), -1.8 + k * 0.72, 3.1, 1.75, h);
  }
  // cupcakes
  for (const [x, z, s, c] of [[-6, 9, 1.2, '#c9a6ef'], [7, 9.5, 1, '#9fe0c8'], [-20, 6, 1.4, '#ffd0a6']]) {
    const cc = new THREE.Group(); cc.position.set(x, 0, z); cc.scale.setScalar(s); g.add(cc);
    mesh(cyl(1.3, 1.0, 1.4, 16), paint('#f7b4c6', { color2: '#e892aa', stripe: 0.0001, twist: 16 }), 0, 0.7, 0, cc);
    mesh(sph(1.45, 18, 12), paint(c, { wobble: 0.2, wobbleFreq: 2, rim: 0.4 }), 0, 1.6, 0, cc).scale.y = 0.75;
    mesh(sph(0.35, 10, 8), paint('#e8384f', { rim: 0.6 }), 0, 2.85, 0, cc);
  }
  // round cake stage for the fairy
  const stage = new THREE.Group(); stage.position.set(2, 0, 2); g.add(stage); refs.stage = stage;
  mesh(cyl(3.2, 3.4, 1.0, 40), paint('#fffaf0', { color2: '#f7b4c6', stripe: 3.0, axis: 0 }), 0, 0.5, 0, stage);
  mesh(cyl(2.4, 2.6, 0.8, 40), paint('#f7b4c6'), 0, 1.4, 0, stage);
  for (let k = 0; k < 12; k++) { const a = (k / 12) * Math.PI * 2; mesh(sph(0.25, 8, 6), paint('#e8384f', { rim: 0.5 }), Math.cos(a) * 2.45, 1.85, Math.sin(a) * 2.45, stage); }
  return { group: g, refs };
}

// ------------------------------------------------------------------ particles
const SPRITE_FRAG = (kind) => `
  varying vec3 vCol; varying float vA;
  void main(){
    vec2 p = gl_PointCoord*2.0-1.0;
    ${kind === 'star'
    ? 'float r = length(p); float cross = max(1.0-abs(p.x)*6.0, 0.0)*max(1.0-abs(p.y)*1.1,0.0) + max(1.0-abs(p.y)*6.0,0.0)*max(1.0-abs(p.x)*1.1,0.0); float a = max(smoothstep(0.55,0.0,r), cross); '
    : 'float r = length(p); float a = smoothstep(1.0, 0.55, r); '}
    if (a < 0.02) discard;
    gl_FragColor = vec4(vCol, a*vA);
  }`;

export function makeSnow(count = 1800) {
  const geo = new THREE.BufferGeometry();
  const p = new Float32Array(count * 3), s = new Float32Array(count);
  for (let i = 0; i < count; i++) { p[i * 3] = rand(); p[i * 3 + 1] = rand(); p[i * 3 + 2] = rand(); s[i] = rand(); }
  geo.setAttribute('position', new THREE.BufferAttribute(p, 3));
  geo.setAttribute('seed', new THREE.BufferAttribute(s, 1));
  const mat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false,
    uniforms: { uTime: { value: 0 }, uCam: { value: new THREE.Vector3() }, uBox: { value: new THREE.Vector3(70, 50, 70) }, uScale: { value: 1 }, uAmt: { value: 1 }, uWind: { value: 0 } },
    vertexShader: `
      uniform float uTime; uniform vec3 uCam; uniform vec3 uBox; uniform float uScale; uniform float uAmt; uniform float uWind;
      attribute float seed; varying vec3 vCol; varying float vA;
      void main(){
        vec3 p = position*uBox;
        p.y -= uTime*(2.2+seed*1.5); p.x += sin(uTime*0.7+seed*30.0)*1.5 + uTime*uWind; p.z += uTime*uWind*0.5;
        p = mod(p - uCam + uBox*0.5, uBox) + uCam - uBox*0.5;
        // no snow inside the parlour
        bool inside = p.z > -16.4 && abs(p.x) < 23.0 && p.y < 24.0;
        vec4 mv = modelViewMatrix*vec4(p,1.0);
        gl_Position = projectionMatrix*mv;
        gl_PointSize = inside || seed > uAmt ? 0.0 : (0.25+seed*0.35)*uScale/(-mv.z);
        vCol = vec3(0.97,0.97,1.0); vA = 0.9;
      }`,
    fragmentShader: SPRITE_FRAG('dot'),
  });
  const pts = new THREE.Points(geo, mat); pts.frustumCulled = false;
  return pts;
}

export function makeStars(count = 500) {
  const geo = new THREE.BufferGeometry();
  const p = new Float32Array(count * 3), s = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    const u = rand() * 2 - 1, a = rand() * Math.PI * 2; const y = 0.08 + Math.abs(u) * 0.92; const r = Math.sqrt(1 - y * y);
    p[i * 3] = Math.cos(a) * r * 700; p[i * 3 + 1] = y * 700; p[i * 3 + 2] = Math.sin(a) * r * 700; s[i] = rand();
  }
  geo.setAttribute('position', new THREE.BufferAttribute(p, 3));
  geo.setAttribute('seed', new THREE.BufferAttribute(s, 1));
  const mat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false,
    uniforms: { uTime: { value: 0 }, uAmt: { value: 1 }, uScale: { value: 1 } },
    vertexShader: `uniform float uTime; uniform float uAmt; uniform float uScale; attribute float seed; varying vec3 vCol; varying float vA;
      void main(){ vec4 mv = modelViewMatrix*vec4(position,1.0); gl_Position = projectionMatrix*mv; gl_Position.z = gl_Position.w*0.9998;
        float tw = 0.6+0.4*sin(uTime*(2.0+seed*3.0)+seed*40.0);
        gl_PointSize = (seed>0.9 ? 22.0 : 9.0 + seed*6.0) * uScale;
        vCol = mix(vec3(1.0,0.93,0.7), vec3(0.85,0.9,1.0), seed); vA = tw*uAmt; }`,
    fragmentShader: SPRITE_FRAG('star'),
  });
  const pts = new THREE.Points(geo, mat); pts.frustumCulled = false; pts.renderOrder = -9;
  return pts;
}

// CPU-driven magic sparkles: the timeline writes positions/colors each frame.
export function makeSparkles(count = 420) {
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(count * 3), 3));
  geo.setAttribute('color', new THREE.BufferAttribute(new Float32Array(count * 3), 3));
  geo.setAttribute('size', new THREE.BufferAttribute(new Float32Array(count), 1));
  const mat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: { uScale: { value: 1 } },
    vertexShader: `uniform float uScale; attribute vec3 color; attribute float size; varying vec3 vCol; varying float vA;
      void main(){ vec4 mv = modelViewMatrix*vec4(position,1.0); gl_Position = projectionMatrix*mv; gl_PointSize = size*uScale/(-mv.z); vCol = color; vA = 1.0; }`,
    fragmentShader: SPRITE_FRAG('star'),
  });
  const pts = new THREE.Points(geo, mat); pts.frustumCulled = false; pts.renderOrder = 5;
  pts.userData.count = count;
  return pts;
}
