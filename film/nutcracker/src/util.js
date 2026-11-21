import * as THREE from 'three';

// ---------- math / timing ----------
export const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const lerp = (a, b, t) => a + (b - a) * t;
export const smooth = (t) => { t = clamp(t); return t * t * (3 - 2 * t); };
export const ramp = (t, a, b) => smooth((t - a) / (b - a));
export const easeOut = (t) => 1 - Math.pow(1 - clamp(t), 3);
export const easeInOut = (t) => { t = clamp(t); return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };

// keyframes: [[time, value], ...]; value may be number or array. Smooth between keys.
export function kf(t, keys) {
  if (t <= keys[0][0]) return keys[0][1];
  for (let i = 0; i < keys.length - 1; i++) {
    const [t0, v0] = keys[i], [t1, v1] = keys[i + 1];
    if (t <= t1) {
      const u = easeInOut((t - t0) / (t1 - t0));
      if (Array.isArray(v0)) return v0.map((v, k) => lerp(v, v1[k], u));
      return lerp(v0, v1, u);
    }
  }
  return keys[keys.length - 1][1];
}

// deterministic random
export function rng(seed) {
  let s = seed >>> 0;
  return () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

// ---------- gouache-friendly materials ----------
// soft three-band ramp, linear-filtered so the bands melt like wet paint
const gradTex = (() => {
  const d = new Uint8Array([105, 165, 222, 255]);
  const t = new THREE.DataTexture(d, 4, 1, THREE.RedFormat);
  t.minFilter = t.magFilter = THREE.LinearFilter; t.needsUpdate = true;
  return t;
})();

const matCache = new Map();
export function M(color, opts = {}) {
  const key = color + JSON.stringify(opts);
  if (!opts.noCache && matCache.has(key)) return matCache.get(key);
  const { noCache, ...rest } = opts;
  const m = new THREE.MeshToonMaterial({ color, gradientMap: gradTex, ...rest });
  if (!noCache) matCache.set(key, m);
  return m;
}
export const Glow = (color, intensity = 1) => new THREE.MeshBasicMaterial({ color: new THREE.Color(color).multiplyScalar(intensity), toneMapped: false });

export function mesh(geo, mat, pos = [0, 0, 0], rot = [0, 0, 0], scale = [1, 1, 1]) {
  const m = new THREE.Mesh(geo, mat);
  m.position.set(...pos); m.rotation.set(...rot);
  if (typeof scale === 'number') m.scale.setScalar(scale); else m.scale.set(...scale);
  return m;
}
export function group(...children) { const g = new THREE.Group(); children.forEach((c) => c && g.add(c)); return g; }

export const G = {
  sphere: (r, w = 20, h = 14) => new THREE.SphereGeometry(r, w, h),
  cyl: (rt, rb, h, s = 20, open = false) => new THREE.CylinderGeometry(rt, rb, h, s, 1, open),
  cone: (r, h, s = 20) => new THREE.ConeGeometry(r, h, s),
  box: (w, h, d) => new THREE.BoxGeometry(w, h, d),
  capsule: (r, l) => new THREE.CapsuleGeometry(r, l, 6, 12),
  torus: (r, t, arc = Math.PI * 2) => new THREE.TorusGeometry(r, t, 10, 40, arc),
  lathe: (pts, s = 28) => new THREE.LatheGeometry(pts.map(([x, y]) => new THREE.Vector2(x, y)), s),
};

// soft radial sprite texture (glows, blob shadows)
export const radialTex = (() => {
  const c = document.createElement('canvas'); c.width = c.height = 128;
  const g = c.getContext('2d');
  const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.35, 'rgba(255,255,255,0.55)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
})();

export function glowSprite(color, size, opacity = 0.8) {
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: radialTex, color, transparent: true, opacity, blending: THREE.AdditiveBlending, depthWrite: false }));
  s.scale.set(size, size, 1); return s;
}
export function blobShadow(size, opacity = 0.35, color = '#2a1f2e') {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(size, size), new THREE.MeshBasicMaterial({ map: radialTex, color, transparent: true, opacity, depthWrite: false }));
  m.rotation.x = -Math.PI / 2; m.position.y = 0.012; m.renderOrder = 1; return m;
}

// gradient sky dome
export function skyDome(top, mid, bottom, r = 80) {
  const geo = new THREE.SphereGeometry(r, 32, 16);
  const mat = new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false,
    uniforms: { cTop: { value: new THREE.Color(top) }, cMid: { value: new THREE.Color(mid) }, cBot: { value: new THREE.Color(bottom) } },
    vertexShader: `varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
    fragmentShader: `uniform vec3 cTop,cMid,cBot; varying vec3 vP; void main(){ float h=vP.y; vec3 c = h>0.0 ? mix(cMid,cTop,smoothstep(0.0,0.6,h)) : mix(cMid,cBot,smoothstep(0.0,-0.3,h)); gl_FragColor=vec4(c,1.); }`,
  });
  return new THREE.Mesh(geo, mat);
}

// canvas texture helper
export function canvasTex(w, h, draw, repeat) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  if (repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(...repeat); }
  t.anisotropy = 4; return t;
}

// falling particles (snow / petals / confetti), fully determined by uTime
export function particles({ count = 600, area = [20, 10, 20], center = [0, 0, 0], size = 0.12, speed = 0.6, sway = 0.4, colors = ['#ffffff'], opacity = 0.95, additive = false, seed = 1 }) {
  const R = rng(seed);
  const pos = new Float32Array(count * 3), col = new Float32Array(count * 3), rnd = new Float32Array(count);
  const tmp = new THREE.Color();
  for (let i = 0; i < count; i++) {
    pos[i * 3] = (R() - 0.5) * area[0]; pos[i * 3 + 1] = R() * area[1]; pos[i * 3 + 2] = (R() - 0.5) * area[2];
    tmp.set(colors[Math.floor(R() * colors.length)]); col.set([tmp.r, tmp.g, tmp.b], i * 3); rnd[i] = R();
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  geo.setAttribute('rnd', new THREE.BufferAttribute(rnd, 1));
  const mat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending,
    uniforms: { uTime: { value: 0 }, uH: { value: area[1] }, uSize: { value: size }, uSpeed: { value: speed }, uSway: { value: sway }, uOpacity: { value: opacity } },
    vertexShader: `attribute float rnd; attribute vec3 color; varying vec3 vC; varying float vR;
      uniform float uTime,uH,uSize,uSpeed,uSway;
      void main(){ vec3 p=position; float sp=uSpeed*(0.6+0.8*rnd);
        p.y = mod(p.y - uTime*sp, uH);
        p.x += sin(uTime*0.7 + rnd*40.0)*uSway; p.z += cos(uTime*0.5 + rnd*23.0)*uSway*0.6;
        vec4 mv = modelViewMatrix*vec4(p,1.); gl_Position = projectionMatrix*mv;
        gl_PointSize = uSize*(0.6+0.8*fract(rnd*7.0))*(620.0/-mv.z); vC=color; vR=rnd; }`,
    fragmentShader: `varying vec3 vC; varying float vR; uniform float uOpacity;
      void main(){ vec2 d=gl_PointCoord-0.5; float r=length(d); if(r>0.5) discard;
        float a = smoothstep(0.5,0.2,r); gl_FragColor=vec4(vC, a*uOpacity); }`,
  });
  const pts = new THREE.Points(geo, mat);
  pts.position.set(...center); pts.frustumCulled = false;
  pts.userData.setTime = (t) => { mat.uniforms.uTime.value = t; };
  return pts;
}
