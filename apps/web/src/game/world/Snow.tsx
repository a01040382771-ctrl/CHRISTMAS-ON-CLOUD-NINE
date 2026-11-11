import { useMemo } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { glowTex } from "./materials";
import { mulberry32 } from "./geo";

const vert = /* glsl */ `
uniform float uTime; uniform vec3 uCenter; uniform float uSize;
attribute vec3 aSeed;
varying float vA;
const vec3 BOX = vec3(64.0, 34.0, 64.0);
void main(){
  vec3 p = aSeed * BOX;
  p.y = mod(p.y - uTime * (1.1 + aSeed.x * 0.9), BOX.y);
  p.x += sin(uTime * 0.5 + aSeed.z * 20.0) * 0.8;
  p.z += cos(uTime * 0.4 + aSeed.x * 17.0) * 0.8;
  vec3 w = p - BOX * 0.5;
  w.xz = mod(w.xz - uCenter.xz + BOX.xz * 0.5, BOX.xz) - BOX.xz * 0.5 + uCenter.xz;
  w.y = p.y + uCenter.y - 6.0;
  vec4 mv = viewMatrix * vec4(w, 1.0);
  gl_Position = projectionMatrix * mv;
  gl_PointSize = uSize * (0.6 + aSeed.y) * (60.0 / -mv.z);
  vA = smoothstep(70.0, 20.0, -mv.z) * (0.45 + 0.4 * aSeed.y);
}`;
const frag = /* glsl */ `
uniform sampler2D uMap; varying float vA;
void main(){ vec4 t = texture2D(uMap, gl_PointCoord); gl_FragColor = vec4(1.0, 1.0, 1.0, t.a * vA); }`;

/** Falling snow in a box that follows the camera target. One draw call, all motion on the GPU. */
export function Snow({ count = 1000, target }: { count?: number; target: { current: THREE.Vector3 } }) {
  const dpr = useThree((s) => s.viewport.dpr);
  const { geo, mat } = useMemo(() => {
    const rnd = mulberry32(5);
    const seed = new Float32Array(count * 3);
    for (let i = 0; i < seed.length; i++) seed[i] = rnd();
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(count * 3), 3));
    g.setAttribute("aSeed", new THREE.BufferAttribute(seed, 3));
    const m = new THREE.ShaderMaterial({
      vertexShader: vert,
      fragmentShader: frag,
      transparent: true,
      depthWrite: false,
      uniforms: { uTime: { value: 0 }, uCenter: { value: new THREE.Vector3() }, uSize: { value: 5 }, uMap: { value: glowTex() } },
    });
    return { geo: g, mat: m };
  }, [count]);
  useFrame(({ clock }) => {
    mat.uniforms.uTime.value = clock.elapsedTime;
    mat.uniforms.uCenter.value.copy(target.current);
    mat.uniforms.uSize.value = 5 * Math.min(dpr, 2);
  });
  return <points geometry={geo} material={mat} frustumCulled={false} renderOrder={4} />;
}
