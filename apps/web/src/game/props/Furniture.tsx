import { useMemo } from "react";
import * as THREE from "three";
import { STAGE, STAGE_POLES, TREE } from "@sky/shared";
import { M, LIGHTS } from "../world/materials";
import { G, Halo, StringLights } from "../buildings/parts";
import { mulberry32 } from "../world/geo";
import { woodTexture } from "../world/textures";

export function Lamp({ position, tall = true }: { position: [number, number, number]; tall?: boolean }) {
  const m = M();
  const g = G();
  const h = tall ? 3.7 : 2.1;
  return (
    <group position={position}>
      <mesh geometry={g.cyl} material={m.lampMetal} position={[0, 0.15, 0]} scale={[0.22, 0.3, 0.22]} castShadow />
      <mesh geometry={g.cyl} material={m.lampMetal} position={[0, h / 2, 0]} scale={[0.07, h, 0.07]} castShadow />
      <mesh geometry={g.cyl} material={m.gold} position={[0, 0.9, 0]} scale={[0.11, 0.08, 0.11]} />
      {/* lantern */}
      <group position={[0, h + 0.02, 0]}>
        <mesh geometry={g.cyl} material={m.lampMetal} position={[0, -0.05, 0]} scale={[0.2, 0.1, 0.2]} />
        <mesh geometry={g.sphere} material={LIGHTS().warm} position={[0, 0.25, 0]} scale={[0.17, 0.26, 0.17]} />
        <mesh position={[0, 0.58, 0]} material={m.lampMetal} castShadow>
          <coneGeometry args={[0.3, 0.3, 8]} />
        </mesh>
        <mesh geometry={g.sphere} material={m.snow} position={[0, 0.7, 0]} scale={[0.25, 0.1, 0.25]} />
        <Halo position={[0, 0.25, 0]} size={tall ? 3.2 : 2.2} opacity={0.55} />
      </group>
      {tall && (
        <group position={[0, 1.7, 0]}>
          <mesh geometry={g.torus} material={m.pine} scale={0.26} position={[0, 0, 0.14]} />
          <mesh geometry={g.sphere} material={m.ribbonRed} position={[0, -0.28, 0.12]} scale={[0.1, 0.08, 0.05]} />
        </group>
      )}
    </group>
  );
}

/** Park bench; seat faces local +z. Footprint 1.9 × 0.76. */
export function Bench({ position, rotationY }: { position: [number, number, number]; rotationY: number }) {
  const m = M();
  const g = G();
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <mesh geometry={g.box} material={m.wood} position={[0, 0.5, 0.05]} scale={[1.85, 0.09, 0.62]} castShadow receiveShadow />
      <mesh geometry={g.box} material={m.wood} position={[0, 0.95, -0.27]} scale={[1.85, 0.5, 0.07]} rotation={[-0.12, 0, 0]} castShadow />
      {[-0.82, 0.82].map((x) => (
        <group key={x}>
          <mesh geometry={g.box} material={m.iron} position={[x, 0.25, 0.05]} scale={[0.08, 0.5, 0.6]} castShadow />
          <mesh geometry={g.box} material={m.iron} position={[x, 0.75, -0.28]} scale={[0.08, 0.9, 0.08]} castShadow />
        </group>
      ))}
      <mesh geometry={g.sphere} material={m.snow} position={[-0.35, 0.57, 0.05]} scale={[0.5, 0.07, 0.24]} />
      <mesh geometry={g.sphere} material={m.snow} position={[0.5, 1.2, -0.28]} scale={[0.42, 0.06, 0.09]} />
    </group>
  );
}

export function Snowman({ position, rotationY = 0, hat = "#7d2540" }: { position: [number, number, number]; rotationY?: number; hat?: string }) {
  const m = M();
  const g = G();
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <mesh geometry={g.sphere} material={m.snow} position={[0, 0.5, 0]} scale={0.52} castShadow receiveShadow />
      <mesh geometry={g.sphere} material={m.snow} position={[0, 1.2, 0]} scale={0.4} castShadow />
      <mesh geometry={g.sphere} material={m.snow} position={[0, 1.82, 0]} scale={0.3} castShadow />
      <mesh geometry={g.sphere} material={m.coal} position={[-0.1, 1.9, 0.26]} scale={0.035} />
      <mesh geometry={g.sphere} material={m.coal} position={[0.1, 1.9, 0.26]} scale={0.035} />
      <mesh position={[0, 1.8, 0.4]} rotation={[Math.PI / 2, 0, 0]} material={m.carrot} castShadow>
        <coneGeometry args={[0.045, 0.28, 8]} />
      </mesh>
      {[0, 1, 2].map((i) => (
        <mesh key={i} geometry={g.sphere} material={m.coal} position={[0, 1.3 - i * 0.22, 0.38 - i * 0.03]} scale={0.04} />
      ))}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 1.55, 0]} material={m.ribbonRed} castShadow>
        <torusGeometry args={[0.31, 0.08, 8, 20]} />
      </mesh>
      <mesh geometry={g.box} material={m.ribbonRed} position={[0.2, 1.38, 0.22]} scale={[0.1, 0.34, 0.06]} rotation={[0, 0, 0.1]} />
      {/* top hat */}
      <mesh position={[0, 2.08, 0]} castShadow>
        <cylinderGeometry args={[0.2, 0.22, 0.34, 16]} />
        <meshStandardMaterial color={hat} roughness={0.8} />
      </mesh>
      <mesh position={[0, 1.93, 0]} castShadow>
        <cylinderGeometry args={[0.36, 0.36, 0.04, 20]} />
        <meshStandardMaterial color={hat} roughness={0.8} />
      </mesh>
      <mesh geometry={g.cyl} material={m.gold} position={[0, 1.98, 0]} scale={[0.225, 0.05, 0.225]} />
      {/* stick arms */}
      {[-1, 1].map((s) => (
        <mesh key={s} geometry={g.cyl} material={m.trunk} position={[s * 0.62, 1.38, 0]} rotation={[0, 0, s * 1.0]} scale={[0.025, 0.7, 0.025]} />
      ))}
    </group>
  );
}

/** Gift boxes piled at the base of the tree (inside its collision radius). */
export function Presents({ position, count = 14, radius = 1.9 }: { position: [number, number, number]; count?: number; radius?: number }) {
  const m = M();
  const g = G();
  const items = useMemo(() => {
    const rnd = mulberry32(9);
    const cols = ["#d4333f", "#2f7d4f", "#e8c46c", "#6fa8dc", "#f2a7bd", "#8c2f4b", "#fff4e6"];
    return Array.from({ length: count }, (_, i) => {
      const a = (i / count) * Math.PI * 2 + rnd() * 0.3;
      const r = radius * (0.7 + rnd() * 0.45);
      const s = 0.45 + rnd() * 0.45;
      return { a, r, s, rot: rnd() * 3, color: cols[i % cols.length], ribbon: i % 2 ? "#e8c46c" : "#fff4e6" };
    });
  }, [count, radius]);
  return (
    <group position={position}>
      {items.map((it, i) => (
        <group key={i} position={[Math.sin(it.a) * it.r, 0, Math.cos(it.a) * it.r]} rotation={[0, it.rot, 0]}>
          <mesh geometry={g.box} position={[0, it.s / 2, 0]} scale={[it.s, it.s, it.s]} castShadow>
            <meshStandardMaterial color={it.color} roughness={0.6} />
          </mesh>
          <mesh geometry={g.box} position={[0, it.s / 2, 0]} scale={[it.s * 1.02, it.s * 1.02, it.s * 0.16]}>
            <meshStandardMaterial color={it.ribbon} roughness={0.4} metalness={0.3} />
          </mesh>
          <mesh geometry={g.box} position={[0, it.s / 2, 0]} scale={[it.s * 0.16, it.s * 1.02, it.s * 1.02]}>
            <meshStandardMaterial color={it.ribbon} roughness={0.4} metalness={0.3} />
          </mesh>
          <mesh geometry={g.sphere} material={m.ribbonRed} position={[0, it.s + 0.04, 0]} scale={[it.s * 0.22, it.s * 0.12, it.s * 0.12]} />
          <mesh geometry={g.sphere} material={m.snow} position={[0.05, it.s + 0.0, 0.04]} scale={[it.s * 0.38, 0.05, it.s * 0.34]} />
        </group>
      ))}
    </group>
  );
}

/** Low circular stage: walkable (height from shared groundHeight), ramp rim, light-string poles. */
export function Stage() {
  const m = M();
  const g = G();
  const floor = useMemo(() => {
    const t = woodTexture("#c79a6d");
    t.repeat.set(2.4, 2.4);
    return new THREE.MeshStandardMaterial({ map: t, roughness: 0.75 });
  }, []);
  const swag = useMemo(() => {
    const [a, b] = STAGE_POLES;
    const pts: THREE.Vector3[] = [];
    const n = 26;
    for (let i = 0; i <= n; i++) {
      const u = i / n;
      pts.push(new THREE.Vector3(a.x + (b.x - a.x) * u - STAGE.x, 3.35 - Math.sin(Math.PI * u) * 0.9, a.z + (b.z - a.z) * u - STAGE.z));
    }
    return pts;
  }, []);
  const cable = useMemo(() => new THREE.TubeGeometry(new THREE.CatmullRomCurve3(swag), 40, 0.03, 5, false), [swag]);
  return (
    <group position={[STAGE.x, 0, STAGE.z]}>
      <mesh position={[0, STAGE.height / 2, 0]} material={m.stoneLight} receiveShadow castShadow>
        <cylinderGeometry args={[STAGE.r, STAGE.r + 0.5, STAGE.height, 48]} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, STAGE.height + 0.005, 0]} material={floor} receiveShadow>
        <circleGeometry args={[STAGE.r - 0.05, 48]} />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, STAGE.height + 0.02, 0]} material={m.gold}>
        <torusGeometry args={[STAGE.r - 0.2, 0.05, 6, 56]} />
      </mesh>
      {/* poles */}
      {STAGE_POLES.map((p, i) => (
        <group key={i} position={[p.x - STAGE.x, 0, p.z - STAGE.z]}>
          <mesh geometry={g.cyl} material={m.candy} position={[0, 1.75, 0]} scale={[0.1, 3.5, 0.1]} castShadow />
          <mesh geometry={g.sphere} material={m.gold} position={[0, 3.55, 0]} scale={0.18} />
          <mesh geometry={g.sphere} material={m.snow} position={[0, 3.45, 0]} scale={[0.2, 0.08, 0.2]} />
        </group>
      ))}
      <mesh geometry={cable} material={m.iron} />
      <StringLights points={swag} scale={1.2} />
    </group>
  );
}
