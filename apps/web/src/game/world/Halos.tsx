import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { useThree } from "@react-three/fiber";
import { glowTex } from "./materials";

/** Marker for a warm glow. Renders no geometry itself — HaloField gathers every marker into one draw call. */
export function Halo({ position, size = 2.4, opacity = 0.5 }: { position: [number, number, number]; size?: number; opacity?: number }) {
  return <object3D position={position} userData={{ halo: { size, opacity } }} />;
}

const vert = /* glsl */ `
attribute vec3 aOffset; attribute vec2 aSizeOpacity;
varying vec2 vUv; varying float vOpacity;
void main(){
  vUv = uv; vOpacity = aSizeOpacity.y;
  vec4 mv = viewMatrix * vec4(aOffset, 1.0);
  mv.xy += position.xy * aSizeOpacity.x;
  gl_Position = projectionMatrix * mv;
}`;
const frag = /* glsl */ `
uniform sampler2D uMap; varying vec2 vUv; varying float vOpacity;
void main(){ vec4 t = texture2D(uMap, vUv); gl_FragColor = vec4(t.rgb * vOpacity, t.a * vOpacity); }`;

/** All glows in the scene as one instanced, camera-facing, additive quad batch. */
export function HaloField({ version = 0 }: { version?: number }) {
  const scene = useThree((s) => s.scene);
  const { geo, mesh } = useMemo(() => {
    const base = new THREE.PlaneGeometry(1, 1);
    const g = new THREE.InstancedBufferGeometry();
    g.index = base.index;
    g.setAttribute("position", base.getAttribute("position"));
    g.setAttribute("uv", base.getAttribute("uv"));
    g.instanceCount = 0;
    const mat = new THREE.ShaderMaterial({
      vertexShader: vert,
      fragmentShader: frag,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      toneMapped: false,
      uniforms: { uMap: { value: glowTex() } },
    });
    const m = new THREE.Mesh(g, mat);
    m.frustumCulled = false;
    m.renderOrder = 5;
    return { geo: g, mesh: m };
  }, []);

  useEffect(() => {
    scene.updateMatrixWorld(true);
    const pos: number[] = [];
    const so: number[] = [];
    const v = new THREE.Vector3();
    scene.traverse((o) => {
      const h = o.userData?.halo as { size: number; opacity: number } | undefined;
      if (!h) return;
      o.getWorldPosition(v);
      pos.push(v.x, v.y, v.z);
      so.push(h.size, h.opacity);
    });
    geo.setAttribute("aOffset", new THREE.InstancedBufferAttribute(new Float32Array(pos), 3));
    geo.setAttribute("aSizeOpacity", new THREE.InstancedBufferAttribute(new Float32Array(so), 2));
    geo.instanceCount = pos.length / 3;
  }, [scene, geo, version]);

  return <primitive object={mesh} />;
}
