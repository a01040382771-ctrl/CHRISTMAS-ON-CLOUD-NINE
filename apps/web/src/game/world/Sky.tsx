import { useMemo } from "react";
import * as THREE from "three";
import { glowTex } from "./materials";

const vert = /* glsl */ `
varying vec3 vDir;
void main(){ vDir = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`;
const frag = /* glsl */ `
varying vec3 vDir;
uniform vec3 uTop; uniform vec3 uMid; uniform vec3 uHorizon; uniform vec3 uBelow;
void main(){
  float h = vDir.y;
  vec3 c = mix(uHorizon, uMid, smoothstep(0.0, 0.28, h));
  c = mix(c, uTop, smoothstep(0.22, 0.85, h));
  c = mix(c, uBelow, smoothstep(0.0, -0.35, h));
  gl_FragColor = vec4(c, 1.0);
}`;

export const SKY = {
  top: "#5f9bc0",
  mid: "#92bfd6",
  horizon: "#dfe8e8",
  below: "#c9dbe3",
};

export function Sky() {
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: vert,
        fragmentShader: frag,
        side: THREE.BackSide,
        depthWrite: false,
        fog: false,
        uniforms: {
          uTop: { value: new THREE.Color(SKY.top) },
          uMid: { value: new THREE.Color(SKY.mid) },
          uHorizon: { value: new THREE.Color(SKY.horizon) },
          uBelow: { value: new THREE.Color(SKY.below) },
        },
      }),
    []
  );
  return (
    <group>
      <mesh material={mat} renderOrder={-10} frustumCulled={false}>
        <sphereGeometry args={[420, 24, 16]} />
      </mesh>
      {/* low sun glow */}
      <sprite position={[-230, 90, -260]} scale={[260, 260, 1]} renderOrder={-9}>
        <spriteMaterial map={glowTex()} blending={THREE.AdditiveBlending} depthWrite={false} transparent opacity={0.55} fog={false} toneMapped={false} />
      </sprite>
    </group>
  );
}
