import * as THREE from 'three';
import { M, G, mesh, group, glowSprite, Glow, canvasTex, rng, blobShadow } from './util.js';

const GOLD = '#d9a93f';

export function christmasTree(h = 4, seed = 3, { lights = true } = {}) {
  const g = new THREE.Group();
  const R = rng(seed);
  g.add(mesh(G.cyl(0.08 * h, 0.1 * h, 0.15 * h), M('#6b4a32'), [0, 0.07 * h, 0]));
  const greens = ['#2f5e4a', '#3a6c52', '#2a5444'];
  const tiers = 5;
  const lightsArr = [];
  for (let i = 0; i < tiers; i++) {
    const t = i / tiers;
    const r = h * (0.36 - t * 0.27), hh = h * 0.3, y = h * (0.15 + t * 0.66) + hh / 2;
    g.add(mesh(G.cone(r, hh, 24), M(greens[i % 3]), [0, y, 0]));
    // snow-dust rim
    const n = Math.floor(10 + r * 14);
    for (let k = 0; k < n; k++) {
      const a = (k / n) * Math.PI * 2 + R() * 0.3, rr = r * (0.75 + R() * 0.2), yy = y - hh * (0.35 + R() * 0.12);
      const col = ['#c94f55', GOLD, '#e8e0cf', '#6d8fc7', '#d77ea0'][Math.floor(R() * 5)];
      if (R() < 0.45) g.add(mesh(G.sphere(0.035 * h, 10, 8), M(col, { emissive: col, emissiveIntensity: 0.15 }), [Math.cos(a) * rr, yy, Math.sin(a) * rr]));
      else if (lights) { const l = mesh(G.sphere(0.014 * h, 8, 6), Glow(['#ffd98a', '#ffe9c4', '#ffb3a0'][k % 3], 1.3), [Math.cos(a) * rr * 1.02, yy + R() * 0.1, Math.sin(a) * rr * 1.02]); g.add(l); lightsArr.push(l); }
    }
  }
  const star = makeStar(0.1 * h); star.position.y = h * 1.05; g.add(star);
  const sg = glowSprite('#ffe1a0', h * 0.45, 0.8); sg.position.y = h * 1.05; g.add(sg);
  const halo = glowSprite('#ffcf8a', h * 1.6, 0.18); halo.position.y = h * 0.55; g.add(halo);
  g.userData.lights = lightsArr; g.userData.star = star;
  return g;
}

export function makeStar(r) {
  const s = new THREE.Shape();
  for (let i = 0; i < 10; i++) { const a = (i / 10) * Math.PI * 2 + Math.PI / 2, rr = i % 2 ? r * 0.45 : r; s[i ? 'lineTo' : 'moveTo'](Math.cos(a) * rr, Math.sin(a) * rr); }
  return new THREE.Mesh(new THREE.ExtrudeGeometry(s, { depth: r * 0.3, bevelEnabled: false }), Glow('#ffd76a', 1.15));
}

export function present(w, color, ribbon, pos, rotY = 0) {
  return group(mesh(G.box(w, w * 0.8, w), M(color)), mesh(G.box(w * 1.01, w * 0.81, w * 0.15), M(ribbon)), mesh(G.box(w * 0.15, w * 0.81, w * 1.01), M(ribbon)),
    mesh(G.torus(w * 0.12, w * 0.04), M(ribbon), [w * 0.08, w * 0.45, 0], [0, 0.6, 0]), mesh(G.torus(w * 0.12, w * 0.04), M(ribbon), [-w * 0.08, w * 0.45, 0], [0, -0.6, 0]))
    .translateX(pos[0]).translateY(w * 0.4 + (pos[1] || 0)).translateZ(pos[2]).rotateY(rotY);
}

export function pine(h, seed = 1, snow = true) {
  const g = new THREE.Group(); const R = rng(seed);
  g.add(mesh(G.cyl(0.06 * h, 0.09 * h, 0.2 * h, 8), M('#4d3a33'), [0, 0.1 * h, 0]));
  const greens = ['#33584f', '#2c4f4a', '#3d6457'];
  for (let i = 0; i < 4; i++) {
    const t = i / 4, r = h * (0.32 - t * 0.2), hh = h * 0.34, y = h * (0.18 + t * 0.6) + hh / 2;
    g.add(mesh(G.cone(r, hh, 12), M(greens[Math.floor(R() * 3)]), [0, y, 0], [0, R() * 3, 0]));
    if (snow) g.add(mesh(G.cone(r * 0.62, hh * 0.45, 12), M('#f3f4fa'), [0, y + hh * 0.29, 0], [0, R() * 3, 0]));
  }
  return g;
}

export function snowGround(size = 80, color = '#eef0f8') {
  const geo = new THREE.PlaneGeometry(size, size, 80, 80);
  const p = geo.attributes.position;
  for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i); p.setZ(i, Math.sin(x * 0.35) * Math.cos(y * 0.28) * 0.18 + Math.sin(x * 0.9 + y * 0.6) * 0.06); }
  geo.computeVertexNormals();
  return mesh(geo, M(color), [0, 0, 0], [-Math.PI / 2, 0, 0]);
}

// ---------- parlor (dream at night / waking morning) ----------
export function parlor({ morning = false, bigTree = false } = {}) {
  const g = new THREE.Group();
  const floorTex = canvasTex(512, 512, (c, w, h) => {
    c.fillStyle = '#8a5a3c'; c.fillRect(0, 0, w, h);
    for (let i = 0; i < 8; i++) { c.fillStyle = i % 2 ? '#93613f' : '#7e5236'; c.fillRect(0, i * 64, w, 62); c.fillStyle = '#5e3b28'; c.fillRect(0, i * 64 + 62, w, 2); c.fillRect(((i * 173) % w), i * 64, 2, 64); }
  }, [4, 4]);
  g.add(mesh(new THREE.PlaneGeometry(24, 24), new THREE.MeshToonMaterial({ map: floorTex, color: morning ? '#f4ddc8' : '#c9b0a8' }), [0, 0, 0], [-Math.PI / 2, 0, 0]));
  const rugTex = canvasTex(256, 256, (c) => {
    c.fillStyle = '#8f2f3a'; c.beginPath(); c.arc(128, 128, 126, 0, 7); c.fill();
    c.strokeStyle = '#e3b85a'; c.lineWidth = 6; c.beginPath(); c.arc(128, 128, 108, 0, 7); c.stroke();
    c.strokeStyle = '#2f5a4c'; c.lineWidth = 10; c.beginPath(); c.arc(128, 128, 80, 0, 7); c.stroke();
    for (let i = 0; i < 12; i++) { c.fillStyle = '#e8cf91'; c.beginPath(); c.arc(128 + Math.cos(i / 12 * 6.283) * 95, 128 + Math.sin(i / 12 * 6.283) * 95, 6, 0, 7); c.fill(); }
  });
  const rug = mesh(new THREE.CircleGeometry(2.6, 48), new THREE.MeshToonMaterial({ map: rugTex, transparent: true }), [0, 0.01, 0.6], [-Math.PI / 2, 0, 0]); g.add(rug);

  const wallTex = canvasTex(512, 512, (c, w, h) => {
    c.fillStyle = morning ? '#9fb59a' : '#55735f'; c.fillRect(0, 0, w, h);
    for (let x = 0; x < w; x += 64) { c.fillStyle = morning ? '#aec2a7' : '#5f7d68'; c.fillRect(x, 0, 28, h); }
    c.fillStyle = morning ? '#e9d7bb' : '#c9a56f';
    for (let x = 32; x < w; x += 64) for (let y = 32; y < h; y += 96) { c.beginPath(); c.arc(x - 18, y, 5, 0, 7); c.fill(); }
  }, [6, 2]);
  const wallM = new THREE.MeshToonMaterial({ map: wallTex });
  g.add(mesh(new THREE.PlaneGeometry(24, 9), wallM, [0, 4.5, -4]));
  g.add(mesh(new THREE.PlaneGeometry(14, 9), wallM, [-6, 4.5, 2], [0, Math.PI / 2, 0]));
  g.add(mesh(G.box(24, 1.0, 0.1), M(morning ? '#efe2cc' : '#d8c7a8'), [0, 0.5, -3.95]));
  g.add(mesh(G.box(24, 0.12, 0.16), M('#8a5a3c'), [0, 1.02, -3.92]));

  // window
  const paneCol = morning ? '#fff1d2' : '#2f4378';
  const pane = mesh(new THREE.PlaneGeometry(2.1, 2.7), Glow(paneCol, morning ? 1.15 : 1), [0, 0, 0.08]);
  const win = group(mesh(G.box(2.4, 3.0, 0.15), M('#efe4d0'), [0, 0, 0]), pane,
    mesh(G.box(0.08, 2.7, 0.06), M('#efe4d0'), [0, 0, 0.12]), mesh(G.box(2.1, 0.08, 0.06), M('#efe4d0'), [0, 0.2, 0.12]),
    mesh(new THREE.PlaneGeometry(1.4, 3.6), M(morning ? '#d99aa0' : '#8e3a48'), [-1.5, 0.1, 0.15]), mesh(new THREE.PlaneGeometry(1.4, 3.6), M(morning ? '#d99aa0' : '#8e3a48'), [1.5, 0.1, 0.15]));
  win.position.set(2.8, 3.1, -3.92); g.add(win);
  if (!morning) { const moon = mesh(new THREE.CircleGeometry(0.28, 24), Glow('#fff4d6', 1.2), [3.25, 3.9, -3.82]); g.add(moon); }
  if (morning) { const sun = glowSprite('#fff0c8', 6, 0.55); sun.position.set(2.8, 3.1, -3.5); g.add(sun); }

  // fireplace
  const fp = group(mesh(G.box(2.4, 2.0, 0.6), M('#cbb9a6'), [0, 1.0, 0]), mesh(G.box(2.7, 0.15, 0.75), M('#8a5a3c'), [0, 2.05, 0]),
    mesh(G.box(1.3, 1.1, 0.62), M('#2a1d1f'), [0, 0.6, 0.02]));
  const fire = group(mesh(G.cone(0.22, 0.6, 10), Glow('#ff9a4a', 1.25), [0, 0.35, 0.2]), mesh(G.cone(0.14, 0.45, 10), Glow('#ffd36e', 1.3), [0.12, 0.28, 0.25]), mesh(G.cone(0.13, 0.4, 10), Glow('#ff7a3a', 1.2), [-0.15, 0.25, 0.22]));
  const fg = glowSprite('#ff9a50', 2.6, morning ? 0.25 : 0.6); fg.position.set(0, 0.5, 0.6); fire.add(fg);
  if (morning) fire.scale.setScalar(0.45);
  fp.add(fire); fp.position.set(-3.2, 0, -3.65); g.add(fp);
  for (let i = 0; i < 3; i++) { const st = group(mesh(G.box(0.25, 0.35, 0.12), M(['#b23a43', '#2f6a52', '#d9a93f'][i]), [0, 0, 0]), mesh(G.box(0.27, 0.08, 0.13), M('#f6f0e4'), [0, 0.16, 0])); st.position.set(-3.8 + i * 0.6, 1.82, -3.25); g.add(st); }

  const tree = christmasTree(bigTree ? 6.5 : 2.6, 7);
  tree.position.set(bigTree ? -1.2 : -1.6, 0, bigTree ? -2.2 : -2.6); g.add(tree);
  g.add(present(0.5, '#3f6db0', '#f2d48a', [tree.position.x + 0.7, 0, tree.position.z + 1.0], 0.4));
  g.add(present(0.38, '#c94f55', '#f6f0e4', [tree.position.x - 0.6, 0, tree.position.z + 1.1], -0.3));
  g.add(present(0.3, '#e7c25a', '#b23a43', [tree.position.x + 0.1, 0, tree.position.z + 1.3], 0.9));
  g.userData.fire = fire; g.userData.tree = tree; g.userData.pane = pane;
  return g;
}

export function armchair() {
  const up = M('#a64a52'), wood = M('#6b4530');
  return group(mesh(G.box(1.3, 0.45, 1.0), up, [0, 0.45, 0]), mesh(G.box(1.3, 1.1, 0.25), up, [0, 1.05, -0.45]), mesh(G.sphere(0.65, 16, 10), up, [0, 1.55, -0.45], [0, 0, 0], [1, 0.4, 0.35]),
    mesh(G.box(0.25, 0.75, 1.0), up, [-0.6, 0.65, 0]), mesh(G.box(0.25, 0.75, 1.0), up, [0.6, 0.65, 0]),
    mesh(G.cyl(0.14, 0.14, 1.0, 12), up, [-0.6, 1.02, 0], [Math.PI / 2, 0, 0]), mesh(G.cyl(0.14, 0.14, 1.0, 12), up, [0.6, 1.02, 0], [Math.PI / 2, 0, 0]),
    ...[[-0.55, 0.4], [0.55, 0.4], [-0.55, -0.4], [0.55, -0.4]].map(([x, z]) => mesh(G.cyl(0.05, 0.04, 0.24, 8), wood, [x, 0.12, z])),
    mesh(G.box(1.0, 0.12, 0.8), M('#c66e74'), [0, 0.72, 0.05]), blobShadow(2.2, 0.35));
}

// ---------- walnut sleigh ----------
export function walnutSleigh() {
  const g = new THREE.Group();
  const geo = new THREE.SphereGeometry(1, 40, 20, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2);
  const p = geo.attributes.position;
  for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i), z = p.getZ(i); const a = Math.atan2(z, x); const k = 1 + 0.05 * Math.sin(a * 14) * Math.sin(y * 9) + 0.03 * Math.sin(a * 31 + y * 20); p.setXYZ(i, x * k, y * k, z * k); }
  geo.computeVertexNormals();
  const shell = mesh(geo, M('#8f5d37', { side: THREE.DoubleSide }), [0, 0.75, 0], [0, 0, 0], [0.85, 0.55, 1.35]); g.add(shell);
  g.add(mesh(G.torus(1.0, 0.05, Math.PI * 2), M('#6e4329'), [0, 0.75, 0], [Math.PI / 2, 0, 0], [0.85, 1.35, 1]));
  g.add(mesh(G.cyl(0.8, 0.8, 0.08, 32), M('#b6474f'), [0, 0.55, 0], [0, 0, 0], [0.95, 1, 1.5])); // velvet seat
  const gold = M(GOLD, { emissive: '#3d2a05' });
  for (const s of [-1, 1]) {
    const runner = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([new THREE.Vector3(s * 0.55, 0.35, -1.3), new THREE.Vector3(s * 0.6, 0.05, -0.6), new THREE.Vector3(s * 0.6, 0.05, 0.8), new THREE.Vector3(s * 0.6, 0.35, 1.6), new THREE.Vector3(s * 0.6, 0.75, 1.65)]), 30, 0.045, 8), gold);
    g.add(runner);
  }
  const lantern = group(mesh(G.cyl(0.015, 0.015, 0.6, 6), gold, [0, 0.3, 0]), mesh(G.sphere(0.1, 12, 8), Glow('#ffd88a', 1.3), [0, 0.65, 0]));
  const lg = glowSprite('#ffcf80', 1.4, 0.6); lg.position.y = 0.65; lantern.add(lg);
  lantern.position.set(0, 0.95, 1.15); g.add(lantern);
  return g;
}

// ---------- land of sweets ----------
function stripeTex(a, b, n = 8) {
  return canvasTex(128, 128, (c, w, h) => { c.fillStyle = a; c.fillRect(0, 0, w, h); c.fillStyle = b; for (let i = -n; i < n * 2; i++) { c.beginPath(); c.moveTo(i * 16, 0); c.lineTo(i * 16 + 8, 0); c.lineTo(i * 16 + 8 - 128, h); c.lineTo(i * 16 - 128, h); c.fill(); } }, [2, 1]);
}
export function candyPalace() {
  const g = new THREE.Group();
  const pink = M('#f2b8c6'), mint = M('#bfe3d2'), lav = M('#cdbde6'), cream = M('#fbefdc'), gold = M(GOLD, { emissive: '#3d2a05' });
  g.add(mesh(G.box(6, 2.6, 2.4), cream, [0, 1.3, 0]));
  g.add(mesh(G.box(6.3, 0.3, 2.7), pink, [0, 2.7, 0]));
  for (let i = 0; i < 7; i++) g.add(mesh(G.sphere(0.25, 12, 8), [pink, mint, lav][i % 3], [-2.7 + i * 0.9, 2.95, 1.25], [0, 0, 0], [1, 0.7, 1]));
  g.add(mesh(G.box(1.4, 1.9, 0.1), M('#a8667a'), [0, 0.95, 1.21]));
  g.add(mesh(G.cyl(0.7, 0.7, 0.1, 24, false), M('#a8667a'), [0, 1.9, 1.21], [Math.PI / 2, 0, 0], [1, 1, 1]));
  const towerTex = stripeTex('#fbefdc', '#f19bb0');
  for (const [x, z, h, r, dome] of [[-3.2, 0.4, 4.4, 0.75, mint], [3.2, 0.4, 4.4, 0.75, lav], [-1.6, -0.6, 5.2, 0.6, pink], [1.6, -0.6, 5.2, 0.6, mint], [0, -0.9, 6.2, 0.9, lav]]) {
    g.add(mesh(G.cyl(r, r * 1.05, h, 24), new THREE.MeshToonMaterial({ map: towerTex }), [x, h / 2, z]));
    g.add(mesh(G.cyl(r * 1.15, r * 1.15, 0.2, 24), gold, [x, h, z]));
    g.add(mesh(new THREE.SphereGeometry(r * 1.1, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), dome, [x, h + 0.1, z], [0, 0, 0], [1, 1.5, 1]));
    g.add(mesh(G.cone(r * 0.25, r * 1.2, 12), gold, [x, h + r * 1.75, z]));
    g.add(mesh(G.sphere(r * 0.12, 10, 8), Glow('#fff0c0', 1.2), [x, h + r * 2.4, z]));
    for (let k = 0; k < 3; k++) g.add(mesh(G.cyl(r * 0.22, r * 0.22, 0.05, 16), Glow('#ffe6b0', 1.05), [x, h * (0.35 + k * 0.2), z + r * 1.02], [Math.PI / 2, 0, 0], [1, 1, 1.4]));
  }
  return g;
}
export function lollipop(h = 2, a = '#f07c96', b = '#fff3e6', seed = 0) {
  const swirl = canvasTex(128, 128, (c) => { c.fillStyle = b; c.fillRect(0, 0, 128, 128); c.strokeStyle = a; c.lineWidth = 12; c.beginPath(); for (let t = 0; t < 30; t += 0.05) { const r = t * 2.1; c.lineTo(64 + Math.cos(t + seed) * r, 64 + Math.sin(t + seed) * r); } c.stroke(); });
  return group(mesh(G.cyl(0.04, 0.04, h, 8), M('#fbf4ea'), [0, h / 2, 0]), mesh(G.cyl(0.5, 0.5, 0.12, 32), new THREE.MeshToonMaterial({ map: swirl }), [0, h + 0.4, 0], [Math.PI / 2, 0, 0]), blobShadow(1.2, 0.2));
}
export function flowerArch() {
  const g = new THREE.Group();
  g.add(mesh(G.torus(1.6, 0.07, Math.PI), M('#fbf4ea'), [0, 0, 0]));
  const R = rng(11); const cols = ['#f2a0b4', '#fff1e8', '#e46d82', '#f7c6d0', '#ffffff', '#cfe8c8'];
  for (let i = 0; i < 46; i++) { const a = (i / 45) * Math.PI; const r = 1.6 + (R() - 0.5) * 0.12; g.add(mesh(G.sphere(0.1 + R() * 0.07, 10, 8), M(cols[Math.floor(R() * cols.length)]), [Math.cos(a) * r, Math.sin(a) * r, (R() - 0.5) * 0.15])); }
  for (let i = 0; i < 20; i++) { const a = R() * Math.PI; g.add(mesh(G.sphere(0.08, 6, 4), M('#7fa982'), [Math.cos(a) * 1.6, Math.sin(a) * 1.6, -0.1], [0, 0, 0], [1.6, 0.6, 0.8])); }
  for (const s of [-1, 1]) g.add(mesh(G.cyl(0.07, 0.07, 1.6, 10), M('#fbf4ea'), [s * 1.6, -0.8, 0]));
  g.position.y = 1.6;
  return g;
}

export function cloudPuff(seed = 1, color = '#fff6f6') {
  const g = new THREE.Group(); const R = rng(seed);
  for (let i = 0; i < 7; i++) g.add(mesh(G.sphere(0.6 + R() * 0.7, 14, 10), M(color), [(R() - 0.5) * 3.2, R() * 0.6, (R() - 0.5) * 1.2]));
  return g;
}
