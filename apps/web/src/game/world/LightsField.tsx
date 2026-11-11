import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { useThree } from "@react-three/fiber";
import { LIGHTS } from "./materials";

export type LightColor = "warm" | "red" | "white" | "blue";

/** Marker: "these bulbs live here". LightsField gathers all markers into four instanced draws (one per colour). */
export function LightMarker({ points, scale = 1, palette = ["warm", "red", "white", "blue"] }: { points: THREE.Vector3[]; scale?: number; palette?: LightColor[] }) {
  return <object3D userData={{ lights: { points, scale, palette } }} />;
}

const bulb = new THREE.IcosahedronGeometry(0.075, 0);

/** Every string light in the village → 4 InstancedMeshes total (colours share twinkle materials). */
export function LightsField({ version = 0 }: { version?: number }) {
  const scene = useThree((s) => s.scene);
  const meshes = useMemo(() => (["warm", "red", "white", "blue"] as LightColor[]).map((c) => {
    const m = new THREE.InstancedMesh(bulb, LIGHTS()[c], 1);
    m.count = 0;
    m.frustumCulled = false;
    return { c, m };
  }), []);

  useEffect(() => {
    scene.updateMatrixWorld(true);
    const buckets: Record<LightColor, THREE.Matrix4[]> = { warm: [], red: [], white: [], blue: [] };
    const v = new THREE.Vector3();
    const q = new THREE.Quaternion();
    const s = new THREE.Vector3();
    scene.traverse((o) => {
      const d = o.userData?.lights as { points: THREE.Vector3[]; scale: number; palette: LightColor[] } | undefined;
      if (!d) return;
      d.points.forEach((p, i) => {
        const mat = new THREE.Matrix4().makeTranslation(p.x, p.y, p.z).premultiply(o.matrixWorld);
        mat.decompose(v, q, s);
        mat.compose(v, q, s.setScalar(d.scale));
        buckets[d.palette[i % d.palette.length]].push(mat);
      });
    });
    for (const { c, m } of meshes) {
      const list = buckets[c];
      if (m.instanceMatrix.count < list.length) {
        m.instanceMatrix = new THREE.InstancedBufferAttribute(new Float32Array(list.length * 16), 16);
      }
      list.forEach((mat, i) => m.setMatrixAt(i, mat));
      m.count = list.length;
      m.instanceMatrix.needsUpdate = true;
    }
  }, [scene, meshes, version]);

  return (
    <>
      {meshes.map(({ c, m }) => (
        <primitive key={c} object={m} />
      ))}
    </>
  );
}
