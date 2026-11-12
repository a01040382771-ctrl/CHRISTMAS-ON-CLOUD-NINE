import { useMemo } from "react";
import * as THREE from "three";
import { materials } from "../../design";
import { Halos } from "../common/Halos";
import { InstancedSet, placeMatrix } from "../common/InstancedSet";
import { LAMP_HEIGHT_M as LAMP_HEIGHT } from "./lampSpec";

export interface LampSpot { x: number; y: number; z: number }

export { LAMP_HEIGHT };

const base = new THREE.CylinderGeometry(0.17, 0.24, 0.45, 12).translate(0, 0.225, 0);
const pole = new THREE.CylinderGeometry(0.06, 0.08, LAMP_HEIGHT - 0.5, 10).translate(0, (LAMP_HEIGHT - 0.5) / 2 + 0.2, 0);
const lantern = new THREE.SphereGeometry(0.3, 16, 12).scale(1, 1.15, 1).translate(0, LAMP_HEIGHT, 0);
const hood = new THREE.ConeGeometry(0.4, 0.34, 16).translate(0, LAMP_HEIGHT + 0.45, 0);
const snowCap = new THREE.SphereGeometry(0.3, 12, 8).scale(1, 0.5, 1).translate(0, LAMP_HEIGHT + 0.58, 0);

/** Street lamps: a warm glowing globe on a slim burgundy post, drawn as a few instanced batches. */
export function LampPosts({ spots }: { spots: LampSpot[] }) {
  const matrices = useMemo(() => spots.map((s) => placeMatrix(s.x, s.y, s.z)), [spots]);
  const halos = useMemo(() => spots.map((s): [number, number, number] => [s.x, s.y + LAMP_HEIGHT, s.z]), [spots]);
  return (
    <group name="lamps">
      <InstancedSet geometry={base} material={materials.trimDeep} matrices={matrices} />
      <InstancedSet geometry={pole} material={materials.trimDeep} matrices={matrices} />
      <InstancedSet geometry={lantern} material={materials.lampGlow} matrices={matrices} castShadow={false} />
      <InstancedSet geometry={hood} material={materials.trimDeep} matrices={matrices} />
      <InstancedSet geometry={snowCap} material={materials.snow} matrices={matrices} castShadow={false} />
      <Halos positions={halos} size={4.2} opacity={0.5} />
    </group>
  );
}
