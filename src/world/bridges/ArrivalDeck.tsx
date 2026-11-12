import { useMemo } from "react";
import * as THREE from "three";
import { materials, palette, scale } from "../../design";
import { InstancedSet, placeMatrix, spanMatrix } from "../common/InstancedSet";
import { DOCK_RAIL_START, dockFrame, RAIL_INSET, type DockDef } from "../layout";

const post = new THREE.CylinderGeometry(0.1, 0.12, 1, 10).translate(0, 0.5, 0);
const cap = new THREE.SphereGeometry(0.17, 12, 10);
const bar = new THREE.CylinderGeometry(0.06, 0.06, 1, 8);
const brace = new THREE.CylinderGeometry(0.13, 0.13, 1, 8);

/** Timber arrival deck projecting from the village island: the future spawn / landing point. */
export function ArrivalDeck({ dock }: { dock: DockDef }) {
  const frame = useMemo(() => dockFrame(dock), [dock]);
  const parts = useMemo(() => {
    const { width: w, length: l } = frame;
    // planks (local space: +z points away from the island)
    const pos: number[] = [], uv: number[] = [], col: number[] = [];
    const base = new THREE.Color(palette.wood), alt = new THREE.Color(palette.rose), c = new THREE.Color();
    const n = Math.round(l / 0.46);
    for (let i = 0; i < n; i++) {
      const z0 = -l / 2 + (i / n) * l, z1 = -l / 2 + ((i + 1) / n) * l;
      pos.push(w / 2, 0, z0, -w / 2, 0, z0, w / 2, 0, z1, w / 2, 0, z1, -w / 2, 0, z0, -w / 2, 0, z1);
      uv.push(0, 0, 5, 0, 0, 1, 0, 1, 5, 0, 5, 1);
      c.copy(base).lerp(alt, ((i * 37) % 11) / 30).multiplyScalar(0.92 + ((i * 53) % 7) / 60);
      for (let k = 0; k < 6; k++) col.push(c.r, c.g, c.b);
    }
    const deck = new THREE.BufferGeometry();
    deck.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    deck.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
    deck.setAttribute("color", new THREE.Float32BufferAttribute(col, 3));
    deck.computeVertexNormals();

    // railing on the three open sides
    const posts: THREE.Matrix4[] = [], caps: THREE.Matrix4[] = [], bars: THREE.Matrix4[] = [], braces: THREE.Matrix4[] = [];
    const outline: [number, number][] = [];
    const zStart = -l / 2 + l * DOCK_RAIL_START, zEnd = l / 2 - RAIL_INSET, x = w / 2 - RAIL_INSET;
    for (const f of [0, 0.5]) outline.push([-x, zStart + (zEnd - zStart) * f]);
    for (let i = 0; i <= 4; i++) outline.push([-x + (i / 4) * x * 2, zEnd]);
    for (const f of [0.5, 0]) outline.push([x, zStart + (zEnd - zStart) * f]);
    outline.forEach(([x, z], i) => {
      posts.push(placeMatrix(x, 0, z, 0, 1, scale.railingHeight + 0.1, 1));
      caps.push(placeMatrix(x, scale.railingHeight + 0.14, z));
      const next = outline[i + 1];
      if (next) for (const h of [scale.railingHeight - 0.05, 0.55]) bars.push(spanMatrix({ x, y: h, z }, { x: next[0], y: h, z: next[1] }));
    });
    // diagonal braces back to the rock
    for (const x of [-w / 2 + 0.6, 0, w / 2 - 0.6]) braces.push(spanMatrix({ x, y: -0.3, z: l / 2 - 0.5 }, { x, y: -3.2, z: -l / 2 + l * 0.2 }));
    return { deck, posts, caps, bars, braces };
  }, [frame]);

  return (
    <group name={`dock:${dock.id}`} position={[frame.center[0], frame.y, frame.center[1]]} rotation={[0, frame.rotation, 0]}>
      <mesh geometry={parts.deck} material={materials.planks} receiveShadow castShadow />
      <mesh position={[0, -0.2, 0]} material={materials.woodDeep} castShadow>
        <boxGeometry args={[frame.width + 0.1, 0.36, frame.length]} />
      </mesh>
      <InstancedSet geometry={post} material={materials.trim} matrices={parts.posts} />
      <InstancedSet geometry={cap} material={materials.gold} matrices={parts.caps} />
      <InstancedSet geometry={bar} material={materials.trim} matrices={parts.bars} />
      <InstancedSet geometry={brace} material={materials.woodDeep} matrices={parts.braces} />
    </group>
  );
}
