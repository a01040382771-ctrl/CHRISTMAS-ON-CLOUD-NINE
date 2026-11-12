import { useMemo } from "react";
import * as THREE from "three";
import { lighting, palette } from "../../design";

/** Pastel gradient sky dome with a soft warm glow around the sun. */
export function Sky() {
  const material = useMemo(
    () => new THREE.ShaderMaterial({
      side: THREE.BackSide,
      depthWrite: false,
      fog: false,
      uniforms: {
        zenith: { value: new THREE.Color(palette.skyZenith) },
        mid: { value: new THREE.Color(palette.pastelBlue) },
        horizon: { value: new THREE.Color(palette.skyHorizon) },
        below: { value: new THREE.Color(palette.skyBelow) },
        sunColor: { value: new THREE.Color(lighting.sun.color) },
        sunDir: { value: new THREE.Vector3(...lighting.sunDirection).normalize() },
      },
      vertexShader: /* glsl */ `
        varying vec3 vDir;
        void main() {
          vDir = normalize(position);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }`,
      fragmentShader: /* glsl */ `
        uniform vec3 zenith, mid, horizon, below, sunColor, sunDir;
        varying vec3 vDir;
        void main() {
          vec3 d = normalize(vDir);
          float h = d.y;
          vec3 col = mix(horizon, mid, smoothstep(0.0, 0.28, h));
          col = mix(col, zenith, smoothstep(0.22, 0.95, h));
          col = mix(col, below, smoothstep(0.0, -0.45, h));
          float s = max(dot(d, sunDir), 0.0);
          col += sunColor * (pow(s, 6.0) * 0.16 + pow(s, 90.0) * 0.5);
          gl_FragColor = vec4(col, 1.0);
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
        }`,
    }),
    [],
  );
  return (
    <mesh material={material} renderOrder={-10} frustumCulled={false}>
      <sphereGeometry args={[1500, 32, 24]} />
    </mesh>
  );
}
