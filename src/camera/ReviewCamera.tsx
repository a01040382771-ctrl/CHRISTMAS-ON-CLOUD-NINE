import { useEffect, useRef } from "react";
import { OrbitControls } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { limits, type CameraView } from "./views";

const toPosition = (v: CameraView, out: THREE.Vector3) => {
  const polar = (v.polarDeg * Math.PI) / 180, az = (v.azimuthDeg * Math.PI) / 180;
  return out.set(
    v.target[0] + v.distance * Math.sin(polar) * Math.sin(az),
    v.target[1] + v.distance * Math.cos(polar),
    v.target[2] + v.distance * Math.sin(polar) * Math.cos(az),
  );
};

/**
 * Design-review camera: orbit (drag / one finger), zoom (wheel / pinch), pan (right-drag / two
 * fingers), all within limits. Setting `view` glides the camera to that framing; any manual input
 * cancels the glide.
 */
export function ReviewCamera({ view }: { view: CameraView }) {
  const controls = useRef<OrbitControlsImpl>(null);
  const camera = useThree((s) => s.camera);
  const glide = useRef<{ target: THREE.Vector3; position: THREE.Vector3 } | null>(null);
  const first = useRef(true);

  useEffect(() => {
    const goal = { target: new THREE.Vector3(...view.target), position: toPosition(view, new THREE.Vector3()) };
    if (first.current && controls.current) {
      first.current = false;
      camera.position.copy(goal.position);
      controls.current.target.copy(goal.target);
      controls.current.update();
    } else glide.current = goal;
  }, [view, camera]);

  useFrame((_, dt) => {
    const c = controls.current;
    if (!c) return;
    if (glide.current) {
      const k = 1 - Math.exp(-dt * 4.2);
      c.target.lerp(glide.current.target, k);
      camera.position.lerp(glide.current.position, k);
      if (camera.position.distanceTo(glide.current.position) < 0.05) glide.current = null;
      c.update();
    }
    // keep the look-at point inside the world
    const { min, max } = limits.target;
    c.target.set(
      THREE.MathUtils.clamp(c.target.x, min[0], max[0]),
      THREE.MathUtils.clamp(c.target.y, min[1], max[1]),
      THREE.MathUtils.clamp(c.target.z, min[2], max[2]),
    );
  });

  return (
    <OrbitControls
      ref={controls}
      makeDefault
      enableDamping
      dampingFactor={0.08}
      rotateSpeed={0.6}
      zoomSpeed={0.9}
      panSpeed={0.7}
      screenSpacePanning={false}
      minDistance={limits.minDistance}
      maxDistance={limits.maxDistance}
      minPolarAngle={limits.minPolar}
      maxPolarAngle={limits.maxPolar}
      onStart={() => { glide.current = null; }}
    />
  );
}
