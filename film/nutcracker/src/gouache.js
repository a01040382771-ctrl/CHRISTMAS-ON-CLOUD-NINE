// Full-screen "gouache" pass.
//  1. brush warp      – the image is pushed around by a stroke-shaped noise field
//  2. Kuwahara        – flattens colour into opaque paint patches with crisp-but-soft edges
//  3. pencil/brush line – broken, wobbly outline from depth discontinuities
//  4. stroke texture  – directional bristle marks modulate value and hue
//  5. paper           – cold-press grain, dry-brush skips, cream "paper white", indigo darks
//  6. title / caption – lettering painted in with a ragged brush reveal
// Everything that "boils" (warp, strokes, line breaks) re-seeds every other frame,
// like a hand-painted animation shot on twos.
import * as THREE from 'three';
import { NOISE_GLSL } from './materials.js';

export function makeGouachePass(width, height) {
  const rt = new THREE.WebGLRenderTarget(width, height, {
    type: THREE.HalfFloatType, depthBuffer: true,
    minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter,
  });
  rt.depthTexture = new THREE.DepthTexture(width, height, THREE.UnsignedIntType);

  const uniforms = {
    tColor: { value: rt.texture }, tDepth: { value: rt.depthTexture },
    tTitle: { value: null }, tCaption: { value: null },
    uRes: { value: new THREE.Vector2(width, height) },
    uNear: { value: 0.1 }, uFar: { value: 2000 },
    uBoil: { value: 0 }, uTitle: { value: 0 }, uCaption: { value: 0 },
    uReveal: { value: 1 }, uWhite: { value: 0 }, uWhiteCol: { value: new THREE.Color('#fbf3ee') },
    uPaper: { value: new THREE.Color('#f4ead6') }, uLineAmt: { value: 1 },
    uKuwa: { value: 1.6 },
  };
  const mat = new THREE.ShaderMaterial({
    uniforms, depthTest: false, depthWrite: false,
    vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`,
    fragmentShader: /* glsl */ `
      ${NOISE_GLSL}
      uniform sampler2D tColor, tDepth, tTitle, tCaption;
      uniform vec2 uRes; uniform float uNear, uFar, uBoil, uTitle, uCaption, uReveal, uWhite, uLineAmt, uKuwa;
      uniform vec3 uPaper, uWhiteCol;
      varying vec2 vUv;
      float lin(vec2 uv){ float d = texture(tDepth, uv).x; float z = d*2.0-1.0; return (2.0*uNear*uFar)/(uFar+uNear - z*(uFar-uNear)); }
      vec3 kuwahara(vec2 uv, vec2 px){
        vec3 m0=vec3(0),m1=vec3(0),m2=vec3(0),m3=vec3(0), s0=vec3(0),s1=vec3(0),s2=vec3(0),s3=vec3(0);
        for (int j=-3;j<=0;j++) for (int i=-3;i<=0;i++){
          vec3 a = texture(tColor, uv+vec2(i,j)*px).rgb;   m0+=a; s0+=a*a;
          vec3 b = texture(tColor, uv+vec2(-i,j)*px).rgb;  m1+=b; s1+=b*b;
          vec3 c = texture(tColor, uv+vec2(i,-j)*px).rgb;  m2+=c; s2+=c*c;
          vec3 d = texture(tColor, uv+vec2(-i,-j)*px).rgb; m3+=d; s3+=d*d;
        }
        float n = 16.0;
        m0/=n; m1/=n; m2/=n; m3/=n;
        vec3 v0 = abs(s0/n - m0*m0), v1 = abs(s1/n - m1*m1), v2 = abs(s2/n - m2*m2), v3 = abs(s3/n - m3*m3);
        float e0=v0.r+v0.g+v0.b, e1=v1.r+v1.g+v1.b, e2=v2.r+v2.g+v2.b, e3=v3.r+v3.g+v3.b;
        vec3 r = m0; float e = e0;
        if (e1<e){ e=e1; r=m1; } if (e2<e){ e=e2; r=m2; } if (e3<e){ e=e3; r=m3; }
        return r;
      }
      void main(){
        vec2 uv = vUv;
        float asp = uRes.x/uRes.y;
        vec2 px = 1.0/uRes;
        float k = uRes.y/1080.0; // keep look resolution-independent
        float seed = uBoil*7.31;
        // 1. brush warp: low-freq flow + short bristle jitter
        vec2 q = uv*vec2(asp,1.0);
        vec2 flow = vec2(fbm2(q*6.0+seed), fbm2(q*6.0+seed+19.7)) - 0.5;
        vec2 jit = vec2(vnoise2(q*120.0+seed*3.0), vnoise2(q*120.0+seed*3.0+7.0)) - 0.5;
        vec2 wuv = uv + (flow*5.0 + jit*1.6)*px*k;
        // 2. paint patches
        vec3 col = kuwahara(wuv, px*uKuwa*k);
        // 3. outline from depth (sampled with its own registration offset)
        vec2 luv = uv + (vec2(fbm2(q*4.0-seed), fbm2(q*4.0+seed+3.3))-0.5)*6.0*px*k;
        float d0 = lin(luv);
        vec2 o = 1.6*px*k;
        float dx = abs(lin(luv+vec2(o.x,0.0)) - lin(luv-vec2(o.x,0.0)));
        float dy = abs(lin(luv+vec2(0.0,o.y)) - lin(luv-vec2(0.0,o.y)));
        float edge = smoothstep(0.035, 0.12, (dx+dy)/max(d0,0.1));
        float brk = smoothstep(0.25, 0.6, fbm2(q*22.0+seed*2.0));
        edge *= brk * smoothstep(1500.0, 300.0, d0) * uLineAmt;
        vec3 lineCol = mix(vec3(0.20,0.11,0.16), col*0.45, 0.35);
        col = mix(col, lineCol, edge*0.62);
        // 4. bristle strokes along a slowly turning direction field
        float ang = fbm2(q*2.2+seed*0.5)*6.2831;
        mat2 R = mat2(cos(ang), -sin(ang), sin(ang), cos(ang));
        vec2 sp = R*(q*uRes.y/1080.0);
        float bristle = vnoise2(sp*vec2(26.0, 300.0)+seed);
        float stroke = fbm2(sp*vec2(9.0, 60.0)-seed);
        col *= 0.955 + 0.06*bristle + 0.05*(stroke-0.5);
        col += (vec3(stroke, bristle, 1.0-stroke)-0.5)*0.018;
        // matte gouache: soft-clip highlights into cream, lift darks into indigo
        float l0 = dot(col, vec3(0.3,0.59,0.11));
        col = mix(vec3(l0), col, 1.15);
        col = col/(1.0+max(col-0.85,0.0)*1.6);
        col = mix(vec3(0.06,0.04,0.13), uPaper*1.03, clamp(col,0.0,1.2));
        // cloud white-out / flash
        col = mix(col, uWhiteCol, uWhite);
        // 6. lettering (painted before the paper texture so it gets the grain too)
        vec2 tuv = uv + jit*1.2*px*k;
        float rag = fbm2(q*9.0+seed*0.3);
        vec4 cap = texture(tCaption, tuv);
        float cm = smoothstep(0.0, 0.08, uCaption*1.25 - (uv.x*0.8 + rag*0.4) + 0.05);
        col = mix(col, cap.rgb, cap.a*cm);
        vec4 tit = texture(tTitle, tuv);
        float tm = smoothstep(0.0, 0.08, uTitle*1.3 - (uv.x*0.85 + rag*0.45) + 0.05);
        col = mix(col, tit.rgb, tit.a*tm);
        // 5. paper: static grain (paper does not boil) + dry-brush skips in the lights
        vec2 g = gl_FragCoord.xy/k;
        float grain = fbm2(g*0.35) * 0.6 + vnoise2(g*1.3)*0.4;
        float fiber = vnoise2(vec2(g.x*0.05, g.y*1.6)+3.0);
        col *= 0.9 + 0.12*grain + 0.03*fiber;
        float lum = dot(col, vec3(0.3,0.59,0.11));
        float skip = smoothstep(0.8, 0.95, grain + (lum-0.6)*0.3) * 0.22;
        col = mix(col, uPaper, skip);
        // painted border: an uneven unpainted margin and a little edge darkening
        vec2 e = min(uv, 1.0-uv) * vec2(asp, 1.0);
        float border = min(e.x, e.y);
        float bn = fbm2(uv*vec2(30.0,30.0)+1.7)*0.012;
        col *= mix(0.86, 1.0, smoothstep(0.0, 0.25, border));
        float margin = smoothstep(0.012+bn, 0.004+bn, border);
        // brush reveal at the very start
        float rev = smoothstep(0.0, 0.03, uReveal*1.6 - (uv.x*0.6 + fbm2(q*vec2(2.0,26.0))*0.4) - 0.05);
        vec3 paperCol = uPaper * (0.92 + 0.1*grain);
        col = mix(paperCol, col, rev);
        col = mix(col, paperCol, margin);
        gl_FragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
      }`,
  });
  const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), mat);
  quad.frustumCulled = false;
  const scene = new THREE.Scene(); scene.add(quad);
  const cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

  return {
    rt, uniforms,
    render(renderer, worldScene, camera) {
      uniforms.uNear.value = camera.near; uniforms.uFar.value = camera.far;
      renderer.setRenderTarget(rt);
      renderer.render(worldScene, camera);
      renderer.setRenderTarget(null);
      renderer.render(scene, cam);
    },
    setSize(w, h) { rt.setSize(w, h); uniforms.uRes.value.set(w, h); },
  };
}

// Lettering canvases (transparent RGBA). Drawn once; revealed by the pass.
export function makeTitleTextures(width, height) {
  const mk = (draw) => {
    const c = document.createElement('canvas'); c.width = width; c.height = height;
    const g = c.getContext('2d'); draw(g, width, height);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.NoColorSpace; t.flipY = true;
    return t;
  };
  const s = height / 1080;
  const caption = mk((g, w, h) => {
    g.textAlign = 'left'; g.textBaseline = 'alphabetic';
    g.font = `${78 * s}px "Nanum Pen Script"`;
    g.lineWidth = 10 * s; g.strokeStyle = 'rgba(244,234,214,0.92)'; g.lineJoin = 'round';
    g.strokeText('크리스마스 이브, 자정', 110 * s, h - 120 * s);
    g.fillStyle = '#3a1f3a'; g.fillText('크리스마스 이브, 자정', 110 * s, h - 120 * s);
  });
  const title = mk((g, w, h) => {
    // a cream paper banner dabbed behind the title
    const cx = w / 2, cy = h * 0.2;
    g.fillStyle = 'rgba(250,240,224,0.88)';
    g.beginPath();
    for (let i = 0; i <= 64; i++) {
      const a = (i / 64) * Math.PI * 2;
      const r = 1 + 0.035 * Math.sin(a * 7) + 0.02 * Math.sin(a * 13 + 1);
      const x = cx + Math.cos(a) * 560 * s * r, y = cy + Math.sin(a) * 170 * s * r;
      i ? g.lineTo(x, y) : g.moveTo(x, y);
    }
    g.fill();
    g.textAlign = 'center'; g.textBaseline = 'middle';
    g.font = `700 ${132 * s}px "Gowun Batang"`;
    g.lineJoin = 'round';
    g.lineWidth = 12 * s; g.strokeStyle = '#e7b545'; g.strokeText('호두까기 인형', cx, cy - 32 * s);
    g.fillStyle = '#9b1f35'; g.fillText('호두까기 인형', cx, cy - 32 * s);
    g.font = `${74 * s}px "Nanum Pen Script"`;
    g.fillStyle = '#3d2c5e'; g.fillText('구름 위의 크리스마스', cx, cy + 72 * s);
    g.font = `${40 * s}px "Nanum Pen Script"`;
    g.fillStyle = '#7a5a8a'; g.fillText('The Nutcracker · on Cloud Nine', cx, cy + 128 * s);
  });
  return { caption, title };
}
