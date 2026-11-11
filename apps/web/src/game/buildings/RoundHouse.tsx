import { useMemo } from "react";
import * as THREE from "three";
import type { BuildingSpec } from "@sky/shared";
import { M } from "../world/materials";
import { ArchDoor, G, GarlandRing, RoundRoof, WindowUnit } from "./parts";

type WallKey = "plasterPink" | "plasterCream" | "plasterBlue" | "plasterRose" | "plasterMint";
type RoofKey = "roofRed" | "roofBurgundy" | "roofTeal" | "roofPine" | "roofSlateBlue";

export interface RoundHouseProps {
  spec: BuildingSpec;
  radius?: number;
  wallHeight?: number;
  wall?: WallKey;
  roof?: RoofKey;
  roofKind?: "dome" | "cone" | "onion";
  roofHeight?: number;
  /** windows evenly spaced around the ring (door slot is skipped) */
  windows?: number;
  /** floors of windows */
  floors?: number;
  curtains?: boolean;
  /** rising lantern turret through the roof */
  cupola?: { radius: number; height: number; roof: "cone" | "onion"; roofKey?: RoofKey };
  doorScale?: number;
  /** skip fine details for far-away decorative islands */
  lowDetail?: boolean;
  phase?: number;
}

const FOUND = 0.34;

/**
 * Round, fairy-tale house. Local +z is the door side (use `spec.rot` to aim at the plaza).
 * Walls, windows, eaves and garland are generated around the full circumference, so the
 * back and sides read as designed as the front from any camera angle.
 */
export function RoundHouse({
  spec, radius = 3.5, wallHeight = 3.6, wall = "plasterPink", roof = "roofRed", roofKind = "dome", roofHeight = 2.4,
  windows = 9, floors = 1, curtains = false, cupola, doorScale = 1, lowDetail = false, phase = 0,
}: RoundHouseProps) {
  const m = M();
  const g = G();
  const top = FOUND + wallHeight;

  const winSlots = useMemo(() => {
    const out: { a: number; y: number }[] = [];
    const n = windows;
    for (let f = 0; f < floors; f++) {
      const y = FOUND + 1.0 + f * ((wallHeight - 1.0) / floors) + (floors > 1 ? 0.15 : 0.2);
      for (let k = 0; k < n; k++) {
        const a = (k / n) * Math.PI * 2;
        const dAngle = Math.min(a, Math.PI * 2 - a);
        // keep the door slot on the ground floor free; upper floors keep a window above the door
        if (f === 0 && dAngle < 0.62) continue;
        if (f > 0 && dAngle < 0.01 && floors === 1) continue;
        if (lowDetail && k % 2 === 1) continue;
        out.push({ a, y });
      }
    }
    return out;
  }, [windows, floors, wallHeight, lowDetail]);

  const roofRadius = radius + 0.42;

  return (
    <group position={[spec.x, 0, spec.z]} rotation={[0, spec.rot, 0]}>
      {/* foundation + snow skirt */}
      <mesh position={[0, FOUND / 2 - 0.02, 0]} castShadow receiveShadow material={m.stone}>
        <cylinderGeometry args={[radius + 0.2, radius + 0.28, FOUND + 0.04, 48]} />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, FOUND + 0.0, 0]} scale={[1, 1, 0.5]} material={m.snow}>
        <torusGeometry args={[radius + 0.22, 0.24, 10, 48]} />
      </mesh>

      {/* walls */}
      <mesh position={[0, FOUND + wallHeight / 2, 0]} castShadow receiveShadow material={m[wall]}>
        <cylinderGeometry args={[radius, radius, wallHeight, 56]} />
      </mesh>
      {/* belt course between floors */}
      {Array.from({ length: floors - 1 }, (_, f) => (
        <mesh key={f} rotation={[Math.PI / 2, 0, 0]} position={[0, FOUND + ((f + 1) * wallHeight) / floors, 0]} material={m.trim}>
          <torusGeometry args={[radius + 0.02, 0.1, 8, 56]} />
        </mesh>
      ))}
      {/* eave ring */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, top, 0]} castShadow material={m.trim}>
        <torusGeometry args={[radius + 0.12, 0.17, 10, 56]} />
      </mesh>

      <RoundRoof radius={roofRadius} height={roofHeight} kind={roofKind} material={m[roof]} y={top} phase={phase} finial={!cupola} />

      {cupola && (
        <group position={[0, top + roofHeight * 0.62, 0]}>
          <mesh position={[0, cupola.height / 2, 0]} castShadow material={m.plasterCream}>
            <cylinderGeometry args={[cupola.radius, cupola.radius * 1.04, cupola.height, 32]} />
          </mesh>
          {[0, 1, 2, 3].map((i) => {
            const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
            return <WindowUnit key={i} position={[Math.sin(a) * cupola.radius, cupola.height * 0.2, Math.cos(a) * cupola.radius]} rotationY={a} scale={0.7} shutters={false} halo={false} />;
          })}
          <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, cupola.height, 0]} material={m.trim} castShadow>
            <torusGeometry args={[cupola.radius + 0.1, 0.12, 8, 36]} />
          </mesh>
          <RoundRoof radius={cupola.radius + 0.35} height={cupola.height * 0.95} kind={cupola.roof} material={m[cupola.roofKey ?? "roofBurgundy"]} y={cupola.height} phase={phase + 1} />
        </group>
      )}

      {/* windows all the way round */}
      {winSlots.map(({ a, y }, i) => (
        <WindowUnit
          key={i}
          position={[Math.sin(a) * (radius - 0.02), y, Math.cos(a) * (radius - 0.02)]}
          rotationY={a}
          curtains={curtains}
          halo={!lowDetail}
        />
      ))}

      {/* door faces local +z */}
      <ArchDoor position={[0, FOUND, radius - 0.02]} scale={doorScale} stepH={FOUND} />

      {!lowDetail && <GarlandRing radius={radius + 0.3} y={top - 0.25} swags={14} sag={0.3} skipAngle={0} />}

      {/* roof/eave snow drifts on the foundation edge (back & sides) */}
      {!lowDetail &&
        Array.from({ length: 7 }, (_, i) => {
          const a = Math.PI * 0.55 + (i / 6) * Math.PI * 0.9;
          const rr = radius + 0.18;
          return <mesh key={i} geometry={g.sphere} material={m.snow} position={[Math.sin(a) * rr, 0.12, Math.cos(a) * rr]} scale={[0.5, 0.2, 0.5]} />;
        })}
    </group>
  );
}
