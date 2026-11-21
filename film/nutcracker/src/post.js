import * as THREE from 'three';

// Gouache post-process:
//   1) composite  : mixes two shots with a painted brush-stroke wipe
//   2) gouache    : directional Kuwahara (flat opaque strokes) + pigment pooling at edges,
//                   granulation, mottled coverage, paper tooth, deckled border, hand-lettered text

const quadVS = `varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0., 1.); }`;
const NOISE = `
float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7)))*43758.5453); }
float noise(vec2 p){ vec2 i=floor(p), f=fract(p); vec2 u=f*f*(3.-2.*f);
  return mix(mix(hash(i),hash(i+vec2(1,0)),u.x), mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),u.x), u.y); }
float fbm(vec2 p){ float v=0., a=.5; for(int i=0;i<5;i++){ v+=a*noise(p); p=p*2.03+vec2(1.7,9.2); a*=.5; } return v; }
`;

const compositeFS = `
uniform sampler2D tA, tB; uniform float uMix; varying vec2 vUv;
${NOISE}
void main(){
  vec3 a = texture2D(tA, vUv).rgb, b = texture2D(tB, vUv).rgb;
  // horizontal brush-stroke bands sweeping left → right
  float band = floor(vUv.y * 9.0);
  float n = fbm(vec2(vUv.x * 3.0, vUv.y * 16.0)) * 0.35 + hash(vec2(band, 3.1)) * 0.18;
  float v = vUv.x * 0.72 + n;
  float p = uMix * 1.5 - 0.2;
  float m = smoothstep(v - 0.05, v + 0.05, p);
  gl_FragColor = vec4(mix(a, b, m), 1.0);
}`;

const gouacheFS = `
uniform sampler2D tIn, tText; uniform vec2 uRes; uniform float uSeed, uFade; uniform vec3 uFadeCol;
varying vec2 vUv;
${NOISE}
const vec3 LUM = vec3(.299,.587,.114);
vec3 tone(vec3 c){ c = c*(1.0 + c/4.0)/(1.0 + c); return pow(clamp(c,0.,1.), vec3(1.0/2.2)); }
vec3 samp(vec2 uv){ return tone(texture2D(tIn, uv).rgb); }
void main(){
  vec2 px = 1.0 / uRes;
  vec2 uv = vUv;
  // "boil": the painted image shifts a hair every other frame like re-painted cels
  vec2 w = vec2(fbm(uv*5.0 + uSeed*1.37), fbm(uv*5.0 + vec2(5.2,1.3) + uSeed*1.37)) - 0.5;
  uv += w * px * 3.2;
  // brush direction field
  float ang = fbm(uv * 2.6 + 11.0 + uSeed*0.05) * 6.2831;
  vec2 dir = vec2(cos(ang), sin(ang));
  // directional Kuwahara (sheared sampling ⇒ elongated flat strokes)
  vec3 m0=vec3(0.),m1=vec3(0.),m2=vec3(0.),m3=vec3(0.), s0=vec3(0.),s1=vec3(0.),s2=vec3(0.),s3=vec3(0.);
  const int R = 3;
  for (int j=-R; j<=R; j++) for (int i=-R; i<=R; i++){
    vec2 o = vec2(float(i), float(j));
    o += dir * dot(o, dir) * 0.9;
    vec3 c = samp(uv + o * px * 1.15); vec3 cc = c*c;
    if (i<=0 && j<=0){ m0+=c; s0+=cc; }
    if (i>=0 && j<=0){ m1+=c; s1+=cc; }
    if (i<=0 && j>=0){ m2+=c; s2+=cc; }
    if (i>=0 && j>=0){ m3+=c; s3+=cc; }
  }
  float n = float((R+1)*(R+1));
  m0/=n; m1/=n; m2/=n; m3/=n;
  float v0 = dot(s0/n - m0*m0, vec3(1.)), v1 = dot(s1/n - m1*m1, vec3(1.)), v2 = dot(s2/n - m2*m2, vec3(1.)), v3 = dot(s3/n - m3*m3, vec3(1.));
  // soft-min blend of the quadrants (smoother than hard Kuwahara, reads as wet paint)
  float k0 = 1.0/(1e-4 + pow(v0*60.0, 2.0)), k1 = 1.0/(1e-4 + pow(v1*60.0, 2.0)), k2 = 1.0/(1e-4 + pow(v2*60.0, 2.0)), k3 = 1.0/(1e-4 + pow(v3*60.0, 2.0));
  vec3 col = (m0*k0 + m1*k1 + m2*k2 + m3*k3) / (k0+k1+k2+k3);

  // pigment pooling: darker, warmer rims where values change
  float l  = dot(samp(uv), LUM);
  float lx = dot(samp(uv + vec2(px.x*1.6,0.)), LUM) - dot(samp(uv - vec2(px.x*1.6,0.)), LUM);
  float ly = dot(samp(uv + vec2(0.,px.y*1.6)), LUM) - dot(samp(uv - vec2(0.,px.y*1.6)), LUM);
  float e = length(vec2(lx, ly));
  float edge = smoothstep(0.05, 0.28, e) * (0.75 + 0.5*noise(uv*uRes/6.0 + uSeed));
  col = mix(col, col * vec3(0.66, 0.55, 0.58), clamp(edge, 0.0, 1.0) * 0.55);

  vec2 sp = uv * uRes;
  // stroke streaks along the brush direction
  float streak = noise(vec2(dot(sp, dir) * 0.035, dot(sp, vec2(-dir.y, dir.x)) * 0.45) + uSeed * 0.1);
  col *= 0.95 + 0.085 * streak;
  // uneven opaque coverage
  float mottle = fbm(uv * vec2(6.0, 4.5) + 3.0);
  col *= 0.93 + 0.1 * mottle;
  // granulation in darks
  float gran = noise(sp / 1.8 + uSeed * 7.0);
  col -= (gran - 0.5) * 0.05 * (1.0 - dot(col, LUM));
  // gouache: matte, chalky, slightly desaturated with white body
  float L = dot(col, LUM);
  col = mix(vec3(L), col, 0.92);
  col = col * 0.88 + vec3(0.075, 0.068, 0.06);

  // paper tooth
  float paper = fbm(sp / 1.4) * 0.55 + fbm(sp / 11.0) * 0.45;
  float fiber = noise(vec2(sp.x * 0.02, sp.y * 0.9));
  col *= 0.935 + 0.075 * paper + 0.02 * fiber;

  // warm vignette
  float vg = smoothstep(1.2, 0.35, length((vUv - 0.5) * vec2(1.3, 1.0)));
  col *= mix(vec3(0.80, 0.74, 0.76), vec3(1.0), vg);

  vec3 paperCol = vec3(0.955, 0.925, 0.86) * (0.95 + 0.06 * paper);
  col = mix(col, uFadeCol * (0.95 + 0.06 * paper), uFade);

  // hand-lettered text (already painted into tText)
  vec4 tx = texture2D(tText, vUv + w * px * 1.6);
  col = mix(col, tx.rgb * (0.9 + 0.12 * paper), tx.a);

  // deckled paper border
  float d = min(min(vUv.x, 1.0 - vUv.x) * uRes.x / uRes.y, min(vUv.y, 1.0 - vUv.y));
  float border = smoothstep(0.012, 0.026, d + (fbm(vUv * 60.0) - 0.5) * 0.02);
  col = mix(paperCol, col, border);

  gl_FragColor = vec4(col, 1.0);
}`;

export function createPost(renderer, W, H) {
  const opts = { type: THREE.HalfFloatType, samples: 4, depthBuffer: true };
  const rtA = new THREE.WebGLRenderTarget(W, H, opts);
  const rtB = new THREE.WebGLRenderTarget(W, H, opts);
  const rtC = new THREE.WebGLRenderTarget(W, H, { type: THREE.HalfFloatType, depthBuffer: false });
  for (const rt of [rtA, rtB, rtC]) rt.texture.minFilter = rt.texture.magFilter = THREE.LinearFilter;

  const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2));
  quad.frustumCulled = false;
  const qScene = new THREE.Scene(); qScene.add(quad);
  const qCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

  const composite = new THREE.ShaderMaterial({ vertexShader: quadVS, fragmentShader: compositeFS, uniforms: { tA: { value: rtA.texture }, tB: { value: rtB.texture }, uMix: { value: 0 } }, depthTest: false, depthWrite: false });
  const gouache = new THREE.ShaderMaterial({
    vertexShader: quadVS, fragmentShader: gouacheFS, depthTest: false, depthWrite: false,
    uniforms: { tIn: { value: rtA.texture }, tText: { value: null }, uRes: { value: new THREE.Vector2(W, H) }, uSeed: { value: 0 }, uFade: { value: 0 }, uFadeCol: { value: new THREE.Color(1, 1, 1) } },
  });

  return {
    render({ a, b, mix, seed, fade, fadeCol, textTex }) {
      renderer.setRenderTarget(rtA); renderer.render(a.scene, a.camera);
      let src = rtA.texture;
      if (b && mix > 0) {
        renderer.setRenderTarget(rtB); renderer.render(b.scene, b.camera);
        composite.uniforms.uMix.value = mix; quad.material = composite;
        renderer.setRenderTarget(rtC); renderer.render(qScene, qCam);
        src = rtC.texture;
      }
      Object.assign(gouache.uniforms.tIn, { value: src });
      gouache.uniforms.uSeed.value = seed; gouache.uniforms.uFade.value = fade; gouache.uniforms.uFadeCol.value.set(fadeCol);
      gouache.uniforms.tText.value = textTex;
      quad.material = gouache;
      renderer.setRenderTarget(null); renderer.render(qScene, qCam);
    },
  };
}
