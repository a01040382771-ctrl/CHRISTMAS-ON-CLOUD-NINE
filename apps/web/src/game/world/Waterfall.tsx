import { useMemo } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { M } from "./materials";

const vert = /* glsl */ `
varying vec2 vUv;
void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`;
const frag = /* glsl */ `
uniform float uTime; varying vec2 vUv;
float h(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453); }
float n(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.0-2.0*f);
  return mix(mix(h(i),h(i+vec2(1,0)),f.x), mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x), f.y); }
void main(){
  float streak = n(vec2(vUv.x*14.0, vUv.y*5.0 + uTime*1.9)) * 0.6 + n(vec2(vUv.x*30.0, vUv.y*9.0 + uTime*2.6)) * 0.4;
  float edge = smoothstep(0.0,0.18,vUv.x) * smoothstep(1.0,0.82,vUv.x);
  float fade = smoothstep(0.0,0.35,vUv.y) * (0.55 + 0.45*smoothstep(1.0,0.9,vUv.y));
  float a = (0.35 + 0.65*streak) * edge * fade;
  vec3 col = mix(vec3(0.62,0.82,0.95), vec3(1.0), streak);
  gl_FragColor = vec4(col, a*0.9);
}`;

/** Animated cascade pouring off the rim into the clouds. `yaw` = direction from island centre (atan2(x,z)). */
export function Waterfall({ yaw, radius, height = 30 }: { yaw: number; radius: number; height?: number }) {
  const mat = useMemo(
    () => new THREE.ShaderMaterial({ vertexShader: vert, fragmentShader: frag, transparent: true, depthWrite: false, side: THREE.DoubleSide, uniforms: { uTime: { value: 0 } } }),
    []
  );
  useFrame(({ clock }) => {
    mat.uniforms.uTime.value = clock.elapsedTime;
  });
  const m = M();
  return (
    <group position={[Math.sin(yaw) * radius, 0, Math.cos(yaw) * radius]} rotation={[0, yaw, 0]}>
      {/* spillway lip */}
      <mesh position={[0, 0.03, -1.6]} material={m.water}>
        <boxGeometry args={[2.6, 0.1, 3.2]} />
      </mesh>
      <mesh position={[-1.55, 0.05, -1.4]} material={m.snow}>
        <sphereGeometry args={[0.75, 12, 8]} />
      </mesh>
      <mesh position={[1.55, 0.05, -1.4]} material={m.snow}>
        <sphereGeometry args={[0.75, 12, 8]} />
      </mesh>
      {/* two crossed sheets give the fall volume from every camera angle */}
      <mesh position={[0, -height / 2 + 0.0, 0.05]} material={mat}>
        <planeGeometry args={[2.5, height, 1, 1]} />
      </mesh>
      <mesh position={[0, -height / 2 + 0.0, 0.05]} rotation={[0, Math.PI / 2, 0]} material={mat}>
        <planeGeometry args={[1.8, height, 1, 1]} />
      </mesh>
    </group>
  );
}
