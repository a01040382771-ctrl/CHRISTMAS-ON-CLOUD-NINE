import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { BRIDGE, FENCE_RADIUS } from "@sky/shared";
import { M } from "../world/materials";
import { G, StringLights } from "../buildings/parts";

/** Candy-cane safety rail around a circular island, with named gaps (bridge, waterfall). */
export function RimFence({ cx = 0, cz = 0, radius = FENCE_RADIUS, gaps }: { cx?: number; cz?: number; radius?: number; gaps: { yaw: number; half: number }[] }) {
  const m = M();
  const g = G();
  const postStep = 1.55 / radius; // radians between posts

  // angle ranges that are solid fence
  const arcs = useMemo(() => {
    const TAU = Math.PI * 2;
    const norm = (a: number) => ((a % TAU) + TAU) % TAU;
    const cuts = gaps.map((x) => ({ a: norm(x.yaw - x.half), b: norm(x.yaw + x.half) })).sort((p, q) => p.a - q.a);
    if (cuts.length === 0) return [{ a0: 0, a1: TAU }];
    const out: { a0: number; a1: number }[] = [];
    for (let i = 0; i < cuts.length; i++) {
      const start = cuts[i].b;
      let end = cuts[(i + 1) % cuts.length].a;
      if (end <= start) end += TAU;
      out.push({ a0: start, a1: end });
    }
    return out;
  }, [gaps]);

  const { posts, railTop, railMid, bulbs } = useMemo(() => {
    const posts: { x: number; z: number }[] = [];
    const bulbs: THREE.Vector3[] = [];
    const mkRail = (y: number, r: number) =>
      arcs.map(({ a0, a1 }) => {
        const n = Math.max(4, Math.ceil((a1 - a0) / 0.04));
        const pts: THREE.Vector3[] = [];
        for (let i = 0; i <= n; i++) {
          const a = a0 + ((a1 - a0) * i) / n;
          pts.push(new THREE.Vector3(Math.sin(a) * radius, y, Math.cos(a) * radius));
        }
        return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), n * 2, r, 6, false);
      });
    for (const { a0, a1 } of arcs) {
      const n = Math.max(1, Math.round((a1 - a0) / postStep));
      for (let i = 0; i <= n; i++) {
        const a = a0 + ((a1 - a0) * i) / n;
        posts.push({ x: Math.sin(a) * radius, z: Math.cos(a) * radius });
        if (i < n) {
          for (let k = 0; k < 3; k++) {
            const u = k / 3;
            const aa = a0 + ((a1 - a0) * (i + u)) / n;
            bulbs.push(new THREE.Vector3(Math.sin(aa) * radius, 1.08 - Math.sin(Math.PI * u) * 0.14, Math.cos(aa) * radius));
          }
        }
      }
    }
    return { posts, railTop: mkRail(1.0, 0.05), railMid: mkRail(0.55, 0.04), bulbs };
  }, [arcs, radius, postStep]);

  const postsRef = useRef<THREE.InstancedMesh>(null);
  const capsRef = useRef<THREE.InstancedMesh>(null);
  useLayoutEffect(() => {
    const d = new THREE.Object3D();
    posts.forEach((p, i) => {
      d.position.set(p.x, 0.58, p.z);
      d.scale.set(0.075, 1.16, 0.075);
      d.updateMatrix();
      postsRef.current?.setMatrixAt(i, d.matrix);
      d.position.set(p.x, 1.2, p.z);
      d.scale.setScalar(0.1);
      d.updateMatrix();
      capsRef.current?.setMatrixAt(i, d.matrix);
    });
    for (const r of [postsRef, capsRef]) {
      if (r.current) {
        r.current.instanceMatrix.needsUpdate = true;
        r.current.computeBoundingSphere();
      }
    }
  }, [posts]);

  return (
    <group position={[cx, 0, cz]}>
      <instancedMesh ref={postsRef} args={[g.cyl, m.candy, posts.length]} castShadow />
      <instancedMesh ref={capsRef} args={[g.sphereLo, m.gold, posts.length]} />
      {railTop.map((t, i) => <mesh key={`t${i}`} geometry={t} material={m.candy} castShadow />)}
      {railMid.map((t, i) => <mesh key={`m${i}`} geometry={t} material={m.candy} />)}
      <StringLights points={bulbs} scale={0.85} />
    </group>
  );
}

/** Gap description for the east bridge, as seen from the main island's centre. */
export const BRIDGE_GAP = { yaw: Math.PI / 2, half: Math.atan2(BRIDGE.halfWidth + 0.9, FENCE_RADIUS) };
