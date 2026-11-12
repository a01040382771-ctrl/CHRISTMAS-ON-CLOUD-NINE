import { useLayoutEffect, useRef } from "react";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import { lighting } from "../../design";

/** The whole light rig, driven by design/lighting.ts. */
export function Lighting() {
  const sun = useRef<THREE.DirectionalLight>(null);
  const scene = useThree((s) => s.scene);

  useLayoutEffect(() => {
    scene.fog = new THREE.Fog(lighting.fog.color, lighting.fog.near, lighting.fog.far);
    return () => { scene.fog = null; };
  }, [scene]);

  useLayoutEffect(() => {
    const light = sun.current!;
    const e = lighting.shadow.extent;
    const cam = light.shadow.camera;
    cam.left = -e; cam.right = e; cam.top = e; cam.bottom = -e; cam.near = 10; cam.far = 420;
    cam.updateProjectionMatrix();
    light.target.position.set(8, 0, -8);
    light.target.updateMatrixWorld();
  }, []);

  const [sx, sy, sz] = lighting.sunDirection;
  const [fx, fy, fz] = lighting.fill.direction;
  return (
    <>
      <hemisphereLight args={[lighting.hemisphere.sky, lighting.hemisphere.ground, lighting.hemisphere.intensity]} />
      <directionalLight
        ref={sun}
        position={[8 + sx * 200, sy * 200, -8 + sz * 200]}
        color={lighting.sun.color}
        intensity={lighting.sun.intensity}
        castShadow
        shadow-mapSize={[lighting.shadow.mapSize, lighting.shadow.mapSize]}
        shadow-bias={lighting.shadow.bias}
        shadow-normalBias={lighting.shadow.normalBias}
        shadow-radius={5}
      />
      <directionalLight position={[fx * 100, fy * 100, fz * 100]} color={lighting.fill.color} intensity={lighting.fill.intensity} />
      <pointLight position={[0, 5, 0]} color={lighting.treeGlow.color} intensity={lighting.treeGlow.intensity} distance={lighting.treeGlow.distance} decay={2} />
    </>
  );
}
