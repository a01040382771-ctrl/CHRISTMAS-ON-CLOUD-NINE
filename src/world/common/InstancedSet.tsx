import { useLayoutEffect, useRef } from "react";
import * as THREE from "three";

interface Props {
  geometry: THREE.BufferGeometry;
  material: THREE.Material;
  matrices: THREE.Matrix4[];
  castShadow?: boolean;
  receiveShadow?: boolean;
}

/** Draws many copies of one mesh in a single draw call. */
export function InstancedSet({ geometry, material, matrices, castShadow = true, receiveShadow = false }: Props) {
  const ref = useRef<THREE.InstancedMesh>(null);
  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    matrices.forEach((m, i) => mesh.setMatrixAt(i, m));
    mesh.instanceMatrix.needsUpdate = true;
    mesh.computeBoundingSphere();
  }, [matrices]);
  if (matrices.length === 0) return null;
  return <instancedMesh ref={ref} args={[geometry, material, matrices.length]} castShadow={castShadow} receiveShadow={receiveShadow} />;
}

const _p = new THREE.Vector3(), _q = new THREE.Quaternion(), _s = new THREE.Vector3(), _up = new THREE.Vector3(0, 1, 0), _d = new THREE.Vector3();

/** Matrix for an upright instance at a position, with optional Y rotation and scale. */
export function placeMatrix(x: number, y: number, z: number, rotY = 0, sx = 1, sy = sx, sz = sx) {
  return new THREE.Matrix4().compose(_p.set(x, y, z), _q.setFromAxisAngle(_up, rotY), _s.set(sx, sy, sz));
}

/** Matrix that stretches a unit-height (y from -0.5 to 0.5) mesh between two points. */
export function spanMatrix(a: THREE.Vector3Like, b: THREE.Vector3Like, thickness = 1) {
  _d.set(b.x - a.x, b.y - a.y, b.z - a.z);
  const len = _d.length();
  _q.setFromUnitVectors(_up, _d.normalize());
  return new THREE.Matrix4().compose(_p.set((a.x + b.x) / 2, (a.y + b.y) / 2, (a.z + b.z) / 2), _q, _s.set(thickness, len, thickness));
}
