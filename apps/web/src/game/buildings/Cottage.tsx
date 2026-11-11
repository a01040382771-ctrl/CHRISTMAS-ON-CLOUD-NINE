import { useMemo } from "react";
import * as THREE from "three";
import { RoundedBox } from "@react-three/drei";
import type { BuildingSpec } from "@sky/shared";
import { M } from "../world/materials";
import { signTexture, stripeTexture } from "../world/textures";
import { ArchDoor, Chimney, G, Halo, StringLights, WindowUnit } from "./parts";

type WallKey = "plasterPink" | "plasterCream" | "plasterBlue" | "plasterRose" | "plasterMint";
type RoofKey = "roofRed" | "roofBurgundy" | "roofTeal" | "roofPine" | "roofSlateBlue";

export interface CottageProps {
  spec: BuildingSpec;
  width?: number;
  depth?: number;
  wallHeight?: number;
  wall?: WallKey;
  roof?: RoofKey;
  sign?: string;
  awning?: boolean;
  lowDetail?: boolean;
}

const FOUND = 0.34;

/** Gabled cottage with a front gable, striped awning and shop sign. Door on local +z. */
export function Cottage({ spec, width = 6.2, depth = 5.2, wallHeight = 3.4, wall = "plasterCream", roof = "roofTeal", sign, awning = true, lowDetail = false }: CottageProps) {
  const m = M();
  const g = G();
  const rh = width * 0.34; // roof rise
  const alpha = Math.atan2(rh, width / 2);
  const slopeLen = width / 2 / Math.cos(alpha) + 0.5;
  const yEave = FOUND + wallHeight;

  const gable = useMemo(() => {
    const s = new THREE.Shape();
    s.moveTo(-width / 2, 0);
    s.lineTo(width / 2, 0);
    s.lineTo(0, rh);
    s.closePath();
    return new THREE.ExtrudeGeometry(s, { depth: depth, bevelEnabled: false });
  }, [width, depth, rh]);

  const signMat = useMemo(() => (sign ? new THREE.MeshStandardMaterial({ map: signTexture(sign), roughness: 0.8 }) : null), [sign]);
  const awningMat = useMemo(() => {
    const t = stripeTexture("#c8323c", "#fff6ee", 6, false);
    t.repeat.set(1, 1);
    return new THREE.MeshStandardMaterial({ map: t, roughness: 0.7, side: THREE.DoubleSide });
  }, []);

  const lights = useMemo(() => {
    const pts: THREE.Vector3[] = [];
    // swag along the front eave
    for (let k = 0; k <= 14; k++) {
      const u = k / 14;
      pts.push(new THREE.Vector3(-width / 2 + 0.2 + u * (width - 0.4), yEave - 0.12 - Math.sin(u * Math.PI * 3) * 0.12 - 0.12, depth / 2 + 0.12));
    }
    return pts;
  }, [width, depth, yEave]);

  return (
    <group position={[spec.x, 0, spec.z]} rotation={[0, spec.rot, 0]}>
      {/* foundation + walls */}
      <mesh geometry={g.box} material={m.stone} position={[0, FOUND / 2 - 0.02, 0]} scale={[width + 0.4, FOUND + 0.04, depth + 0.4]} castShadow receiveShadow />
      <mesh geometry={g.box} material={m[wall]} position={[0, FOUND + wallHeight / 2, 0]} scale={[width, wallHeight, depth]} castShadow receiveShadow />
      {/* corner quoins */}
      {[-1, 1].map((sx) => [-1, 1].map((sz) => (
        <mesh key={`${sx}${sz}`} geometry={g.box} material={m.trim} position={[sx * (width / 2), FOUND + wallHeight / 2, sz * (depth / 2)]} scale={[0.22, wallHeight, 0.22]} castShadow />
      )))}
      {/* gables (front + back, same design) */}
      <mesh geometry={gable} material={m[wall]} position={[0, yEave, -depth / 2]} castShadow receiveShadow />

      {/* roof slabs with snow */}
      {[-1, 1].map((side) => (
        <group key={side} position={[0, yEave + rh, 0]} rotation={[0, 0, -side * alpha]}>
          <mesh geometry={g.box} material={m[roof]} position={[side * (slopeLen / 2 - 0.05), 0.02, 0]} scale={[slopeLen, 0.16, depth + 0.9]} castShadow receiveShadow />
          <RoundedBox args={[slopeLen * 0.95, 0.24, depth + 0.8]} radius={0.1} smoothness={3} position={[side * (slopeLen / 2 - 0.08), 0.17, 0]} castShadow receiveShadow material={m.snow} />
        </group>
      ))}
      {/* ridge cap */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, yEave + rh + 0.3, 0]} scale={[1, 1, 1]} material={m.snow} castShadow>
        <cylinderGeometry args={[0.25, 0.25, depth + 0.8, 14]} />
      </mesh>

      {/* round attic window in the front gable (+ matching one at the back) */}
      {[1, -1].map((s) => (
        <group key={s} position={[0, yEave + rh * 0.38, (s * depth) / 2]} rotation={[0, s > 0 ? 0 : Math.PI, 0]}>
          <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0.02]} material={m.trim}>
            <cylinderGeometry args={[0.55, 0.55, 0.1, 24]} />
          </mesh>
          <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0.08]} material={m.glass}>
            <cylinderGeometry args={[0.42, 0.42, 0.04, 24]} />
          </mesh>
          {!lowDetail && <Halo position={[0, 0, 0.35]} size={1.8} opacity={0.4} />}
        </group>
      ))}

      {/* windows on all four faces */}
      {[-1, 1].map((sx) => (
        <WindowUnit key={`f${sx}`} position={[sx * (width * 0.3), FOUND + 1.15, depth / 2 - 0.02]} rotationY={0} halo={!lowDetail} />
      ))}
      {[-1, 1].map((sx) => (
        <WindowUnit key={`b${sx}`} position={[sx * (width * 0.3), FOUND + 1.15, -depth / 2 + 0.02]} rotationY={Math.PI} halo={!lowDetail} />
      ))}
      {[-1, 1].map((sz) => (
        <WindowUnit key={`s${sz}`} position={[width / 2 - 0.02, FOUND + 1.15, sz * 1.05]} rotationY={Math.PI / 2} halo={!lowDetail} />
      ))}
      {[-1, 1].map((sz) => (
        <WindowUnit key={`w${sz}`} position={[-width / 2 + 0.02, FOUND + 1.15, sz * 1.05]} rotationY={-Math.PI / 2} halo={!lowDetail} />
      ))}

      <ArchDoor position={[0, FOUND, depth / 2 - 0.02]} stepH={FOUND} />

      {awning && (
        <group position={[0, FOUND + 3.0, depth / 2 + 0.05]}>
          <mesh material={awningMat} position={[0, -0.05, 0.62]} rotation={[0.45, 0, 0]} castShadow>
            <planeGeometry args={[3.0, 1.45]} />
          </mesh>
          {Array.from({ length: 11 }, (_, i) => (
            <mesh key={i} geometry={g.sphere} material={i % 2 ? m.trim : m.ribbonRed} position={[-1.4 + i * 0.28, -0.62, 1.2]} scale={0.13} />
          ))}
          <mesh geometry={g.sphere} material={m.snow} position={[0, 0.08, 0.35]} scale={[1.4, 0.09, 0.3]} />
        </group>
      )}

      {signMat && (
        <mesh position={[0, FOUND + wallHeight - 0.55, depth / 2 + 0.06]} castShadow material={signMat}>
          <boxGeometry args={[2.3, 0.7, 0.08]} />
        </mesh>
      )}

      {/* market crates with ornaments, kept inside the collision margin */}
      {awning && !lowDetail && [-1, 1].map((sx) => (
        <group key={sx} position={[sx * 2.3, 0, depth / 2 + 0.2]}>
          <mesh geometry={g.box} material={m.wood} position={[0, 0.25, 0]} scale={[0.9, 0.5, 0.5]} castShadow />
          {[-0.28, 0, 0.28].map((x, i) => (
            <mesh key={i} geometry={g.sphere} material={i === 1 ? m.ribbonGold : m.ribbonRed} position={[x, 0.58, 0]} scale={0.16} castShadow />
          ))}
        </group>
      ))}

      <Chimney position={[width * 0.25, yEave + rh * 0.35, -depth * 0.2]} height={1.5} />
      <StringLights points={lights} />
    </group>
  );
}
