import { materials } from "../../design";
import type { LotDef } from "../layout";
import { BuildingSite } from "./BuildingSite";
import { BoxBody, ConeRoof, Dome, Door, GableRoof, GlowWindow, TowerBody } from "./kit/parts";

/**
 * 03 · Velvet Ballroom — the grand vintage party hall and the village's backdrop.
 * PHASE 1 PLACEHOLDER: symmetric massing (hall, entrance rotunda, two wing towers).
 */
export function VelvetBallroom({ lots }: { lots: LotDef[] }) {
  return (
    <BuildingSite lot={lots[0]}>
      {/* lot is 20 × 9.5 */}
      <BoxBody size={[12, 6.4, 6.2]} position={[0, 0, -1]} wall="wallPink" />
      <GableRoof width={12} depth={6.2} height={4} position={[0, 6.3, -1]} roof="roofBurgundy" />
      {/* entrance rotunda */}
      <TowerBody radius={2.7} height={8.6} position={[0, 0, 1.7]} wall="wallIvory" />
      <Dome radius={2.95} position={[0, 8.6, 1.7]} roof="roofBurgundy" squash={1.05} />
      <Door position={[0, 0, 4.36]} w={1.9} h={3} />
      <GlowWindow position={[0, 4.6, 4.3]} w={1.3} h={2.3} />
      {/* wing towers */}
      {[-1, 1].map((s) => (
        <group key={s}>
          <TowerBody radius={2.1} height={7.6} position={[7.4 * s, 0, 0.2]} wall="wallIvory" />
          <ConeRoof radius={2.1} height={4.8} position={[7.4 * s, 7.6, 0.2]} roof="roofPink" />
          <GlowWindow position={[7.4 * s, 1.6, 2.26]} w={0.95} h={1.9} />
          <GlowWindow position={[7.4 * s, 4.9, 2.22]} w={0.95} h={1.6} />
          <GlowWindow position={[(7.4 + 2.06) * s, 3.2, 0.2]} rotationY={(Math.PI / 2) * s} w={0.95} h={1.9} />
          {/* tall ballroom windows between rotunda and towers */}
          <GlowWindow position={[4.1 * s, 1.5, 2.1]} w={1.3} h={3.4} />
          <GlowWindow position={[4.2 * s, 1.5, -4.1]} rotationY={Math.PI} w={1.3} h={3.4} />
          <GlowWindow position={[1.4 * s, 1.5, -4.1]} rotationY={Math.PI} w={1.3} h={3.4} />
        </group>
      ))}
      {/* entrance steps spilling onto the forecourt */}
      <mesh position={[0, -0.06, 4.3]} material={materials.stone} receiveShadow castShadow><cylinderGeometry args={[2.3, 2.4, 0.2, 40, 1, false, -Math.PI / 2, Math.PI]} /></mesh>
    </BuildingSite>
  );
}
