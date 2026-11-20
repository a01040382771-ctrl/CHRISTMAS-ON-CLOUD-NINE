// Gouache-look materials.
// Every surface uses one shader: soft 3-tone banded lighting with a cool,
// purple-blue shadow mix (how gouache painters mix shadows), a jittered
// terminator, pigment unevenness, optional candy stripes and a little
// vertex "clay wobble" so nothing looks machine-perfect.
import * as THREE from 'three';

export const NOISE_GLSL = /* glsl */ `
float hash13(vec3 p){ p = fract(p*0.1031); p += dot(p, p.zyx+31.32); return fract((p.x+p.y)*p.z); }
float hash12(vec2 p){ vec3 p3 = fract(vec3(p.xyx)*0.1031); p3 += dot(p3, p3.yzx+33.33); return fract((p3.x+p3.y)*p3.z); }
float vnoise3(vec3 p){
  vec3 i = floor(p); vec3 f = fract(p); f = f*f*(3.0-2.0*f);
  float n000=hash13(i), n100=hash13(i+vec3(1,0,0)), n010=hash13(i+vec3(0,1,0)), n110=hash13(i+vec3(1,1,0));
  float n001=hash13(i+vec3(0,0,1)), n101=hash13(i+vec3(1,0,1)), n011=hash13(i+vec3(0,1,1)), n111=hash13(i+vec3(1,1,1));
  return mix(mix(mix(n000,n100,f.x),mix(n010,n110,f.x),f.y), mix(mix(n001,n101,f.x),mix(n011,n111,f.x),f.y), f.z);
}
float vnoise2(vec2 p){
  vec2 i = floor(p); vec2 f = fract(p); f = f*f*(3.0-2.0*f);
  return mix(mix(hash12(i),hash12(i+vec2(1,0)),f.x), mix(hash12(i+vec2(0,1)),hash12(i+vec2(1,1)),f.x), f.y);
}
float fbm2(vec2 p){ float a=0.5, s=0.0; for(int i=0;i<4;i++){ s+=a*vnoise2(p); p=p*2.03+17.1; a*=0.5; } return s/0.9375; }
float fbm3(vec3 p){ float a=0.5, s=0.0; for(int i=0;i<3;i++){ s+=a*vnoise3(p); p=p*2.07+11.3; a*=0.5; } return s/0.875; }
`;

// Uniforms shared by every gouache material (same objects => update once).
export const shared = {
  uBoil: { value: 0 },
  uLightDir: { value: new THREE.Vector3(-0.5, 0.75, 0.45).normalize() },
  uKeyColor: { value: new THREE.Color(1.0, 0.92, 0.8) },
  uShadowTint: { value: new THREE.Color(0.45, 0.42, 0.66) },
  uAmbient: { value: new THREE.Color(0.07, 0.05, 0.12) },
  uRimColor: { value: new THREE.Color(1.0, 0.85, 0.6) },
  uFogColor: { value: new THREE.Color(0.2, 0.2, 0.35) },
  uFogNear: { value: 40 },
  uFogFar: { value: 220 },
  uFogAmt: { value: 0.6 },
  uPLPos: { value: [new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()] },
  uPLColor: { value: [new THREE.Color(0, 0, 0), new THREE.Color(0, 0, 0), new THREE.Color(0, 0, 0), new THREE.Color(0, 0, 0)] },
  uPLRange: { value: [1, 1, 1, 1] },
};

const VERT = /* glsl */ `
${NOISE_GLSL}
uniform float uWobble; uniform float uWobbleFreq; uniform float uSeed;
varying vec3 vN; varying vec3 vW; varying vec3 vObj;
#ifdef USE_INSTANCING_COLOR
varying vec3 vInstColor;
#endif
void main(){
  mat4 m = modelMatrix;
  #ifdef USE_INSTANCING
    m = modelMatrix * instanceMatrix;
  #endif
  #ifdef USE_INSTANCING_COLOR
    vInstColor = instanceColor;
  #endif
  vec4 wp = m * vec4(position, 1.0);
  vec3 wn = normalize(inverse(transpose(mat3(m))) * normal);
  if (uWobble > 0.0) {
    float w = vnoise3(position*uWobbleFreq + uSeed) - 0.5;
    wp.xyz += wn * w * uWobble;
  }
  vN = wn; vW = wp.xyz; vObj = position;
  gl_Position = projectionMatrix * viewMatrix * wp;
}`;

const FRAG = /* glsl */ `
${NOISE_GLSL}
uniform vec3 uColor; uniform vec3 uColor2; uniform vec3 uBackColor; uniform float uUseBack;
uniform float uStripe; uniform float uStripeTwist; uniform float uStripeAxis;
uniform float uEmissive; uniform float uRim; uniform float uPigment; uniform float uOpacity;
uniform float uBoil;
uniform vec3 uLightDir; uniform vec3 uKeyColor; uniform vec3 uShadowTint; uniform vec3 uAmbient; uniform vec3 uRimColor;
uniform vec3 uFogColor; uniform float uFogNear; uniform float uFogFar; uniform float uFogAmt;
uniform vec3 uPLPos[4]; uniform vec3 uPLColor[4]; uniform float uPLRange[4];
varying vec3 vN; varying vec3 vW; varying vec3 vObj;
#ifdef USE_INSTANCING_COLOR
varying vec3 vInstColor;
#endif
void main(){
  vec3 base = uColor;
  if (uStripe > 0.0) {
    float ang = atan(vObj.z, vObj.x) / 6.2831853;
    float axis = uStripeAxis < 0.5 ? vObj.y : (uStripeAxis < 1.5 ? vObj.x : vObj.z);
    float s = axis * uStripe + ang * uStripeTwist + (vnoise3(vObj*9.0)-0.5)*0.25;
    float st = smoothstep(0.42, 0.58, abs(fract(s)-0.5)*2.0);
    base = mix(uColor, uColor2, st);
  }
  if (uUseBack > 0.5 && !gl_FrontFacing) base = uBackColor;
  #ifdef USE_INSTANCING_COLOR
    base *= vInstColor;
  #endif
  vec3 N = normalize(vN); if (!gl_FrontFacing) N = -N;
  vec3 V = normalize(cameraPosition - vW);
  float jitter = (vnoise3(vW*2.3 + uBoil*13.7) - 0.5) * 0.16;
  float d = dot(N, uLightDir)*0.5 + 0.5 + jitter;
  float lit = smoothstep(0.44, 0.52, d)*0.62 + smoothstep(0.70, 0.78, d)*0.38;
  vec3 shade = base * uShadowTint + uAmbient;
  vec3 col = mix(shade, base * uKeyColor, lit);
  // warm bounce from below
  col += base * vec3(0.10, 0.06, 0.03) * clamp(-N.y, 0.0, 1.0);
  for (int i = 0; i < 4; i++) {
    vec3 dl = uPLPos[i] - vW; float dist = length(dl);
    float att = clamp(1.0 - dist / uPLRange[i], 0.0, 1.0); att *= att;
    float pl = max(dot(N, dl / max(dist, 1e-3)), 0.0) * att;
    pl = smoothstep(0.03, 0.18, pl)*0.55 + smoothstep(0.25, 0.5, pl)*0.45;
    col += base * uPLColor[i] * pl + uPLColor[i] * att * 0.04;
  }
  float rim = pow(1.0 - max(dot(N, V), 0.0), 3.0);
  col += uRimColor * smoothstep(0.35, 0.55, rim) * uRim;
  float pig = fbm3(vW * 0.6 + vec3(uBoil*0.37));
  col *= 1.0 + (pig - 0.5) * uPigment * 0.8;
  col = mix(col, base, uEmissive);
  float f = smoothstep(uFogNear, uFogFar, length(vW - cameraPosition));
  col = mix(col, uFogColor, f * uFogAmt);
  gl_FragColor = vec4(col, uOpacity);
}`;

export function paint(color, o = {}) {
  const c = new THREE.Color(color);
  const mat = new THREE.ShaderMaterial({
    vertexShader: VERT,
    fragmentShader: FRAG,
    uniforms: {
      ...shared,
      uColor: { value: c },
      uColor2: { value: new THREE.Color(o.color2 ?? color) },
      uBackColor: { value: new THREE.Color(o.back ?? color) },
      uUseBack: { value: o.back !== undefined ? 1 : 0 },
      uStripe: { value: o.stripe ?? 0 },
      uStripeTwist: { value: o.twist ?? 0 },
      uStripeAxis: { value: o.axis ?? 0 },
      uEmissive: { value: o.emissive ?? 0 },
      uRim: { value: (o.rim ?? 0.25) * 0.7 },
      uPigment: { value: o.pigment ?? 0.22 },
      uOpacity: { value: o.opacity ?? 1 },
      uWobble: { value: o.wobble ?? 0 },
      uWobbleFreq: { value: o.wobbleFreq ?? 3 },
      uSeed: { value: o.seed ?? Math.random() * 100 },
    },
    side: o.side ?? THREE.FrontSide,
    transparent: (o.opacity ?? 1) < 1 || !!o.transparent,
    depthWrite: o.depthWrite ?? true,
  });
  return mat;
}

// Soft painted contact shadow (a dab of violet-grey under feet and objects).
export function blobShadow(radius = 0.5, strength = 0.45) {
  const geo = new THREE.PlaneGeometry(radius * 2, radius * 2);
  geo.rotateX(-Math.PI / 2);
  const mat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false,
    uniforms: { uStrength: { value: strength }, uBoil: shared.uBoil },
    vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);} `,
    fragmentShader: `${NOISE_GLSL}
      uniform float uStrength; uniform float uBoil; varying vec2 vUv;
      void main(){ vec2 p=vUv*2.0-1.0; float r=length(p) + (vnoise2(p*3.0+uBoil*5.0)-0.5)*0.25;
        float a = (1.0 - smoothstep(0.45, 1.0, r)) * uStrength;
        gl_FragColor = vec4(0.16, 0.10, 0.26, a); }`,
  });
  const m = new THREE.Mesh(geo, mat);
  m.position.y = 0.012;
  m.renderOrder = 1;
  return m;
}
