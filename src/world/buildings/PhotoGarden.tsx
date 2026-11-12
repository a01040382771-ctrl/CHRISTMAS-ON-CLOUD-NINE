import { materials } from "../../design";
import type { LotDef } from "../layout";
import { BuildingSite } from "./BuildingSite";
import { BoxBody, Door } from "./kit/parts";

const W = 6.4, L = 11.4, WALL = 2.5, R = W / 2;
const ribs = [-L / 2, -L / 2 + 1.9, -L / 2 + 3.8, 0, L / 2 - 3.8, L / 2 - 1.9, L / 2];

/**
 * 04 · Editorial Photo Garden — a glass conservatory for the Christmas photo booth.
 * PHASE 1 PLACEHOLDER: barrel-vaulted glasshouse on a low ivory wall, sage ribs, door in the gable end.
 * The lot is 8 wide × 13 deep; its front (+z) faces the bridge.
 */
export function PhotoGarden({ lots }: { lots: LotDef[] }) {
  return (
    <BuildingSite lot={lots[0]}>
      <BoxBody size={[W + 0.3, 0.9, L + 0.3]} wall="wallIvory" plinth={false} radius={0.15} />
      {/* glass walls and vault */}
      <mesh position={[0, 0.9 + (WALL - 0.9) / 2, 0]} material={materials.glass}><boxGeometry args={[W, WALL - 0.9, L]} /></mesh>
      <mesh position={[0, WALL, 0]} rotation={[Math.PI / 2, 0, 0]} material={materials.glass}>
        <cylinderGeometry args={[R, R, L, 40, 1, false, Math.PI / 2, Math.PI]} />
      </mesh>
      {/* sage frame */}
      {ribs.map((z) => (
        <group key={z} position={[0, 0, z]}>
          <mesh position={[0, WALL, 0]} material={materials.roofSageDeep} castShadow><torusGeometry args={[R, 0.1, 8, 28, Math.PI]} /></mesh>
          {[-1, 1].map((s) => <mesh key={s} position={[R * s, WALL / 2 + 0.4, 0]} material={materials.roofSageDeep} castShadow><boxGeometry args={[0.2, WALL - 0.8, 0.2]} /></mesh>)}
        </group>
      ))}
      {[[-R, WALL], [R, WALL], [0, WALL + R]].map(([x, y], i) => (
        <mesh key={i} position={[x, y, 0]} material={materials.roofSageDeep} castShadow><boxGeometry args={[0.22, 0.22, L + 0.3]} /></mesh>
      ))}
      {/* snow resting along the ridge */}
      <mesh position={[0, WALL + 0.08, 0]} rotation={[Math.PI / 2, 0, 0]} material={materials.snow} castShadow>
        <cylinderGeometry args={[R + 0.06, R + 0.06, L + 0.4, 24, 1, true, Math.PI - 0.42, 0.84]} />
      </mesh>
      <Door position={[0, 0, L / 2 + 0.05]} leaf="roofSageDeep" />
      {/* warm lights inside */}
      {[-3.4, 0, 3.4].map((z) => <mesh key={z} position={[0, WALL + 1.6, z]} material={materials.lampGlow}><sphereGeometry args={[0.32, 16, 12]} /></mesh>)}
      <mesh position={[0, 0.93, 0]} rotation={[-Math.PI / 2, 0, 0]} material={materials.wallCream} receiveShadow><planeGeometry args={[W - 0.2, L - 0.2]} /></mesh>
    </BuildingSite>
  );
}
