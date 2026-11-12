import { useLayoutEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { lighting, palette } from "../../design";
import { fbm2, mulberry32 } from "../common/noise";

interface Puff { x: number; y: number; z: number; sx: number; sy: number; sz: number }

/** Sea of cloud far below the islands, thinning into pastel-blue gaps. */
function cloudSea(rnd: () => number): Puff[] {
  const puffs: Puff[] = [];
  const LEVEL = -44;
  for (let i = 0; i < 4000 && puffs.length < 900; i++) {
    const r = 30 + Math.pow(rnd(), 0.8) * 620, a = rnd() * Math.PI * 2;
    const x = Math.cos(a) * r, z = Math.sin(a) * r;
    const density = fbm2(x * 0.0065, z * 0.0065, 4);
    if (density < 0.46 + rnd() * 0.1) continue;
    const size = (6 + rnd() * 5.5) * (1 + r / 170);
    puffs.push({ x, y: LEVEL + (density - 0.5) * 16 + rnd() * 3, z, sx: size * (1 + rnd() * 0.35), sy: size * (0.7 + rnd() * 0.25), sz: size * (1 + rnd() * 0.35) });
  }
  // dense bed directly beneath the village so it always floats above cloud
  for (let i = 0; i < 110; i++) {
    const r = Math.sqrt(rnd()) * 150, a = rnd() * Math.PI * 2;
    const size = 7 + rnd() * 6;
    puffs.push({ x: Math.cos(a) * r, y: LEVEL - 3 + rnd() * 6, z: Math.sin(a) * r - 10, sx: size * 1.25, sy: size * 0.75, sz: size * 1.25 });
  }
  return puffs;
}

/** Towering cotton-candy cumulus: a flat base that billows upwards. */
function cumulus(rnd: () => number, cx: number, cy: number, cz: number, size: number): Puff[] {
  const puffs: Puff[] = [];
  const count = 16 + Math.floor(rnd() * 8);
  for (let i = 0; i < count; i++) {
    const level = Math.pow(rnd(), 1.5); // most puffs near the base
    const spread = (1 - level * 0.72) * size * 1.3;
    const a = rnd() * Math.PI * 2, d = Math.sqrt(rnd()) * spread;
    const s = size * (0.42 + rnd() * 0.3) * (1 - level * 0.3);
    puffs.push({ x: cx + Math.cos(a) * d * 1.35, y: cy + level * size * 1.25 + s * 0.4, z: cz + Math.sin(a) * d * 0.8, sx: s * 1.1, sy: s * 0.86, sz: s });
  }
  return puffs;
}

const HERO_CLOUDS: [number, number, number, number][] = [
  // x, y, z, size — framed behind and beside the village as in the reference image
  [-310, -30, -420, 70], [60, -26, -560, 96], [400, -30, -380, 66], [-640, -30, -200, 60],
  [700, -30, -120, 58], [-380, -34, 380, 44], [400, -34, 400, 46],
];

/**
 * All clouds in one instanced draw call with a soft wrapped-light shader: warm cream where the sun
 * hits, peach in shade, cool blue underneath. Each puff bobs very slightly.
 */
export function Clouds() {
  const ref = useRef<THREE.InstancedMesh>(null);
  const puffs = useMemo(() => {
    const rnd = mulberry32(2024);
    return [...cloudSea(rnd), ...HERO_CLOUDS.flatMap(([x, y, z, s]) => cumulus(rnd, x, y, z, s))];
  }, []);
  const geometry = useMemo(() => new THREE.SphereGeometry(1, 16, 10), []);
  const material = useMemo(
    () => new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        sunDir: { value: new THREE.Vector3(...lighting.sunDirection).normalize() },
        lit: { value: new THREE.Color(palette.cloudLit) },
        shade: { value: new THREE.Color(palette.cloudShade) },
        cool: { value: new THREE.Color(palette.cloudCool) },
        fogColor: { value: new THREE.Color(lighting.fog.color) },
        fogNear: { value: lighting.fog.near * 1.5 },
        fogFar: { value: lighting.fog.far * 1.5 },
      },
      vertexShader: /* glsl */ `
        uniform float time;
        varying vec3 vNormal;
        varying vec3 vView;
        varying float vDepth;
        void main() {
          mat3 m = mat3(instanceMatrix);
          vec3 n = m * (normal / vec3(dot(m[0], m[0]), dot(m[1], m[1]), dot(m[2], m[2])));
          vNormal = normalize(n);
          vec4 world = modelMatrix * instanceMatrix * vec4(position, 1.0);
          vec3 origin = instanceMatrix[3].xyz;
          world.y += sin(time * 0.22 + origin.x * 0.031 + origin.z * 0.017) * 0.9;
          vec4 mv = viewMatrix * world;
          vView = normalize(cameraPosition - world.xyz);
          vDepth = -mv.z;
          gl_Position = projectionMatrix * mv;
        }`,
      fragmentShader: /* glsl */ `
        uniform vec3 sunDir, lit, shade, cool, fogColor;
        uniform float fogNear, fogFar;
        varying vec3 vNormal;
        varying vec3 vView;
        varying float vDepth;
        void main() {
          vec3 n = normalize(vNormal);
          float wrap = clamp(dot(n, sunDir) * 0.5 + 0.5, 0.0, 1.0);
          vec3 col = mix(shade, lit, smoothstep(0.28, 0.82, wrap));
          col = mix(col, cool, smoothstep(0.1, -0.9, n.y) * 0.65);
          float rim = pow(1.0 - clamp(dot(n, normalize(vView)), 0.0, 1.0), 2.2);
          col = mix(col, lit, rim * 0.3);
          col = mix(col, fogColor, smoothstep(fogNear, fogFar, vDepth) * 0.7);
          gl_FragColor = vec4(col, 1.0);
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
        }`,
    }),
    [],
  );

  useLayoutEffect(() => {
    const mesh = ref.current!;
    const m = new THREE.Matrix4(), q = new THREE.Quaternion(), p = new THREE.Vector3(), s = new THREE.Vector3();
    puffs.forEach((puff, i) => mesh.setMatrixAt(i, m.compose(p.set(puff.x, puff.y, puff.z), q, s.set(puff.sx, puff.sy, puff.sz))));
    mesh.instanceMatrix.needsUpdate = true;
  }, [puffs]);

  useFrame(({ clock }) => { material.uniforms.time.value = clock.elapsedTime; });

  return <instancedMesh ref={ref} args={[geometry, material, puffs.length]} frustumCulled={false} name="clouds" />;
}
