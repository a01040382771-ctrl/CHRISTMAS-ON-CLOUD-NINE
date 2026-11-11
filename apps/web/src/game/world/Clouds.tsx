import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { M } from "./materials";
import { mulberry32 } from "./geo";

/** Sphere with a top-lit / bottom-shaded vertex gradient — soft cotton-candy cloud lobes. */
function lobeGeometry() {
  const g = new THREE.SphereGeometry(1, 10, 7);
  const p = g.getAttribute("position");
  const col = new Float32Array(p.count * 3);
  const top = new THREE.Color("#fff6ee");
  const bot = new THREE.Color("#e9c8c6");
  const c = new THREE.Color();
  for (let i = 0; i < p.count; i++) {
    c.copy(bot).lerp(top, THREE.MathUtils.smoothstep(p.getY(i), -0.9, 0.75));
    col.set([c.r, c.g, c.b], i * 3);
  }
  g.setAttribute("color", new THREE.BufferAttribute(col, 3));
  return g;
}

interface Lobe { x: number; y: number; z: number; sx: number; sy: number; sz: number }

function Puffs({ lobes, material }: { lobes: Lobe[]; material: THREE.Material }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  const geo = useMemo(lobeGeometry, []);
  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    const d = new THREE.Object3D();
    lobes.forEach((l, i) => {
      d.position.set(l.x, l.y, l.z);
      d.scale.set(l.sx, l.sy, l.sz);
      d.updateMatrix();
      mesh.setMatrixAt(i, d.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
    mesh.computeBoundingSphere();
  }, [lobes]);
  return <instancedMesh ref={ref} args={[geo, material, lobes.length]} frustumCulled={false} />;
}

/** Cloud sea under the islands + towering cumulus on the horizon. `density` comes from the quality preset. */
export function Clouds({ density = 1 }: { density?: number }) {
  const m = M();
  const sea = useMemo(() => {
    const rnd = mulberry32(2024);
    const n = Math.round(210 * density);
    const out: Lobe[] = [];
    for (let i = 0; i < n; i++) {
      const near = i < n * 0.28;
      const r = near ? 26 + rnd() * 26 : 40 + Math.sqrt(rnd()) * 190;
      const a = rnd() * Math.PI * 2;
      const s = near ? 5 + rnd() * 7 : 9 + rnd() * 20;
      out.push({ x: Math.sin(a) * r + 6, y: -13 - rnd() * 9 - r * 0.03, z: Math.cos(a) * r, sx: s * (1 + rnd() * 0.5), sy: s * 0.4, sz: s * (1 + rnd() * 0.5) });
    }
    return out;
  }, [density]);

  const cumulus = useMemo(() => {
    const rnd = mulberry32(77);
    const defs = [
      [-95, 26, -70], [70, 32, -105], [118, 22, 30], [-120, 18, 40], [10, 40, -150], [-40, 24, 120], [95, 30, 105],
    ];
    return defs.map(([x, y, z], k) => {
      const lobes: Lobe[] = [];
      const base = 12 + rnd() * 8;
      const n = Math.round((11 + Math.floor(rnd() * 5)) * Math.max(0.6, density));
      for (let i = 0; i < n; i++) {
        const h = rnd();
        const s = base * (0.45 + 0.55 * (1 - Math.abs(h - 0.4))) * (0.7 + rnd() * 0.5);
        lobes.push({ x: (rnd() - 0.5) * base * 2.1, y: h * base * 1.2, z: (rnd() - 0.5) * base * 1.3, sx: s, sy: s * 0.85, sz: s * 0.9 });
      }
      return { pos: [x, y, z] as [number, number, number], lobes, k };
    });
  }, [density]);

  const seaRef = useRef<THREE.Group>(null);
  const cumRefs = useRef<(THREE.Group | null)[]>([]);
  useFrame(({ clock }, dt) => {
    const t = clock.elapsedTime;
    if (seaRef.current) seaRef.current.rotation.y += dt * 0.0035;
    cumRefs.current.forEach((g, i) => {
      if (g) g.position.y = cumulus[i].pos[1] + Math.sin(t * 0.07 + i * 1.7) * 1.2;
    });
  });

  return (
    <group>
      <group ref={seaRef}>
        <Puffs lobes={sea} material={useVertexTinted(m.cloudSea)} />
      </group>
      {cumulus.map((c, i) => (
        <group key={c.k} ref={(el) => { cumRefs.current[i] = el; }} position={c.pos} rotation={[0, c.k, 0]}>
          <Puffs lobes={c.lobes} material={useVertexTinted(m.cloud)} />
        </group>
      ))}
    </group>
  );
}

const tinted = new Map<THREE.Material, THREE.MeshStandardMaterial>();
function useVertexTinted(base: THREE.MeshStandardMaterial) {
  let t = tinted.get(base);
  if (!t) {
    t = base.clone();
    t.vertexColors = true;
    tinted.set(base, t);
  }
  return t;
}
