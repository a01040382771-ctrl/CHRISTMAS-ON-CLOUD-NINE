import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { BRIDGE, groundHeight } from "@sky/shared";
import { M } from "../world/materials";
import { G, StringLights } from "../buildings/parts";

const X0 = BRIDGE.spanStart - 1.0;
const X1 = BRIDGE.spanEnd + 1.0;
const hAt = (x: number) => Math.max(0.03, groundHeight(x, 0));

/** Slope angle of the arch at x (rotation about z). */
const slope = (x: number) => Math.atan2(hAt(x + 0.05) - hAt(x - 0.05), 0.1);

/** Arched plank bridge between the main island rim and the small island. Collision = shared walkable rect. */
export function Bridge() {
  const m = M();
  const g = G();
  const W = BRIDGE.halfWidth;

  const planks = useMemo(() => {
    const out: { x: number; a: number }[] = [];
    for (let x = X0; x <= X1; x += 0.43) out.push({ x, a: slope(x) });
    return out;
  }, []);
  const planksRef = useRef<THREE.InstancedMesh>(null);
  useLayoutEffect(() => {
    const mesh = planksRef.current;
    if (!mesh) return;
    const d = new THREE.Object3D();
    planks.forEach((p, i) => {
      d.position.set(p.x, hAt(p.x) - 0.06, 0);
      d.rotation.set(0, 0, p.a);
      d.scale.set(0.4, 0.12, W * 2 + 0.2);
      d.updateMatrix();
      mesh.setMatrixAt(i, d.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
    mesh.computeBoundingSphere();
  }, [planks, W]);

  const curve = (y: number, z: number) => {
    const pts: THREE.Vector3[] = [];
    for (let x = X0; x <= X1; x += 0.5) pts.push(new THREE.Vector3(x, hAt(x) + y, z));
    return new THREE.CatmullRomCurve3(pts);
  };
  const geos = useMemo(() => {
    const tube = (y: number, z: number, r: number) => new THREE.TubeGeometry(curve(y, z), 48, r, 8, false);
    return {
      railTop: [tube(1.05, -W, 0.06), tube(1.05, W, 0.06)],
      railMid: [tube(0.55, -W, 0.045), tube(0.55, W, 0.045)],
      stringer: [tube(-0.28, -W + 0.3, 0.14), tube(-0.28, W - 0.3, 0.14)],
      snowEdge: [tube(0.03, -W + 0.15, 0.1), tube(0.03, W - 0.15, 0.1)],
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const posts = useMemo(() => {
    const out: { x: number; z: number }[] = [];
    for (let x = BRIDGE.spanStart; x <= BRIDGE.spanEnd + 0.01; x += (BRIDGE.spanEnd - BRIDGE.spanStart) / 8) {
      out.push({ x, z: -W }, { x, z: W });
    }
    return out;
  }, [W]);

  const swag = useMemo(() => {
    const pts: THREE.Vector3[] = [];
    const n = 8;
    for (const z of [-W, W]) {
      for (let s = 0; s < n; s++) {
        for (let k = 0; k < 6; k++) {
          const u = k / 6;
          const x = BRIDGE.spanStart + ((s + u) / n) * (BRIDGE.spanEnd - BRIDGE.spanStart);
          pts.push(new THREE.Vector3(x, hAt(x) + 1.02 - Math.sin(Math.PI * u) * 0.2, z * 0.995));
        }
      }
    }
    return pts;
  }, [W]);

  return (
    <group>
      <instancedMesh ref={planksRef} args={[g.box, m.wood, planks.length]} castShadow receiveShadow />
      {geos.stringer.map((t, i) => <mesh key={i} geometry={t} material={m.woodDark} castShadow />)}
      {geos.snowEdge.map((t, i) => <mesh key={i} geometry={t} material={m.snow} />)}
      {geos.railTop.map((t, i) => <mesh key={i} geometry={t} material={m.candy} castShadow />)}
      {geos.railMid.map((t, i) => <mesh key={i} geometry={t} material={m.candy} castShadow />)}
      {posts.map((p, i) => (
        <group key={i} position={[p.x, hAt(p.x), p.z]}>
          <mesh geometry={g.cyl} material={m.candy} position={[0, 0.55, 0]} scale={[0.07, 1.1, 0.07]} castShadow />
          <mesh geometry={g.sphere} material={m.gold} position={[0, 1.13, 0]} scale={0.1} />
        </group>
      ))}
      <StringLights points={swag} />
      {/* underside hangers: lanterns glowing beneath the bridge */}
      {[0.28, 0.5, 0.72].map((u) => {
        const x = BRIDGE.spanStart + u * (BRIDGE.spanEnd - BRIDGE.spanStart);
        return (
          <group key={u} position={[x, hAt(x) - 0.55, 0]}>
            <mesh geometry={g.cyl} material={m.iron} position={[0, 0.3, 0]} scale={[0.015, 0.6, 0.015]} />
            <mesh geometry={g.sphere} material={m.goldSoft} scale={[0.14, 0.18, 0.14]} />
          </group>
        );
      })}
    </group>
  );
}
