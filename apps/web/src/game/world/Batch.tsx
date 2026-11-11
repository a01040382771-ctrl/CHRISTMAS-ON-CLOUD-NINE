import { useLayoutEffect, useRef, type ReactNode } from "react";
import * as THREE from "three";
import type { ThreeElements } from "@react-three/fiber";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";

/**
 * Static-mesh batcher. Children render normally (so every component stays a plain,
 * readable R3F prefab); once mounted, all their solid meshes are baked into one merged
 * mesh per (material, shadow flags) and the originals are hidden.
 *
 * A building with ~60 small parts becomes ~8 draw calls, in the main pass and the shadow pass.
 * Instanced meshes, sprites and anything marked `userData.noBatch` are left alone.
 */
let vcMaterial: THREE.MeshStandardMaterial | null = null;
const sharedVertexColorMaterial = () => (vcMaterial ??= new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.82, metalness: 0.05 }));

export function Batch({ children, vertexColors = false, ...props }: { children: ReactNode; /** bake each mesh's material colour into vertices → one draw call per limb regardless of material */ vertexColors?: boolean } & ThreeElements["group"]) {
  const ref = useRef<THREE.Group>(null);

  useLayoutEffect(() => {
    const root = ref.current;
    if (!root) return;
    root.updateWorldMatrix(true, true);
    const inv = new THREE.Matrix4().copy(root.matrixWorld).invert();
    const rel = new THREE.Matrix4();

    type Bucket = { material: THREE.Material; cast: boolean; receive: boolean; geos: THREE.BufferGeometry[] };
    const buckets = new Map<string, Bucket>();
    const hidden: THREE.Object3D[] = [];

    root.traverse((o) => {
      const mesh = o as THREE.Mesh;
      if (!mesh.isMesh || (mesh as THREE.InstancedMesh).isInstancedMesh || mesh.userData.noBatch || mesh.userData.batched || !mesh.visible) return;
      if (Array.isArray(mesh.material) || !mesh.geometry) return;

      let g = mesh.geometry.index ? mesh.geometry.toNonIndexed() : mesh.geometry.clone();
      // only keep attributes every bucket member is guaranteed to have
      for (const name of Object.keys(g.attributes)) if (name !== "position" && name !== "normal" && name !== "uv") g.deleteAttribute(name);
      if (!g.attributes.normal) g.computeVertexNormals();
      if (!g.attributes.uv) g.setAttribute("uv", new THREE.BufferAttribute(new Float32Array(g.attributes.position.count * 2), 2));
      g.clearGroups();
      if (vertexColors) {
        const mc = (mesh.material as THREE.MeshStandardMaterial).color;
        const n = g.attributes.position.count;
        const col = new Float32Array(n * 3);
        for (let i = 0; i < n; i++) col.set([mc.r, mc.g, mc.b], i * 3);
        g.setAttribute("color", new THREE.BufferAttribute(col, 3));
      }
      mesh.updateWorldMatrix(true, false);
      rel.multiplyMatrices(inv, mesh.matrixWorld);
      g.applyMatrix4(rel);

      const bucketMat = vertexColors ? sharedVertexColorMaterial() : mesh.material;
      const key = `${bucketMat.uuid}|${mesh.castShadow ? 1 : 0}${mesh.receiveShadow ? 1 : 0}`;
      let b = buckets.get(key);
      if (!b) buckets.set(key, (b = { material: bucketMat, cast: mesh.castShadow, receive: mesh.receiveShadow, geos: [] }));
      b.geos.push(g);
      hidden.push(mesh);
    });

    const added: THREE.Mesh[] = [];
    buckets.forEach((b) => {
      const merged = mergeGeometries(b.geos, false);
      b.geos.forEach((g) => g.dispose());
      if (!merged) return;
      const m = new THREE.Mesh(merged, b.material);
      m.castShadow = b.cast;
      m.receiveShadow = b.receive;
      m.userData.batched = true;
      m.matrixAutoUpdate = false;
      root.add(m);
      added.push(m);
    });
    hidden.forEach((h) => (h.visible = false));

    return () => {
      added.forEach((m) => {
        root.remove(m);
        m.geometry.dispose();
      });
      hidden.forEach((h) => (h.visible = true));
    };
  }, []);

  return (
    <group ref={ref} {...props}>
      {children}
    </group>
  );
}
