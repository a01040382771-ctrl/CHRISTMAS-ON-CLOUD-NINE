import { materials } from "../../design";
import type { LotDef } from "../layout";
import { BuildingSite } from "./BuildingSite";
import { Dome } from "./kit/parts";

const COLUMNS = 8, RING = 2.35, HEIGHT = 3.2;

/**
 * 07 · Moonlit Terrace — the lookout over the clouds.
 * PHASE 1 PLACEHOLDER: an open gazebo on the terrace deck; the island's cliff fence is the balustrade.
 */
export function MoonlitTerrace({ lots }: { lots: LotDef[] }) {
  return (
    <BuildingSite lot={lots[0]}>
      <mesh position={[0, 0.12, 0]} material={materials.stone} receiveShadow castShadow><cylinderGeometry args={[2.75, 2.85, 0.24, 40]} /></mesh>
      {Array.from({ length: COLUMNS }, (_, i) => {
        const a = ((i + 0.5) / COLUMNS) * Math.PI * 2;
        return <mesh key={i} position={[Math.cos(a) * RING, 0.24 + HEIGHT / 2, Math.sin(a) * RING]} material={materials.wallIvory} castShadow><cylinderGeometry args={[0.15, 0.18, HEIGHT, 12]} /></mesh>;
      })}
      <mesh position={[0, 0.24 + HEIGHT, 0]} material={materials.wallIvory} castShadow><cylinderGeometry args={[2.7, 2.6, 0.36, 40]} /></mesh>
      <Dome radius={2.75} position={[0, 0.42 + HEIGHT, 0]} roof="roofSage" squash={0.72} finial={false} />
      {/* crescent-moon finial */}
      <mesh position={[0, 0.42 + HEIGHT + 2.75 * 0.72 + 0.55, 0]} rotation={[0, 0, 0.9]} material={materials.gold} castShadow><torusGeometry args={[0.46, 0.09, 8, 24, 4.3]} /></mesh>
      <mesh position={[0, 2.7, 0]} material={materials.lampGlow}><sphereGeometry args={[0.3, 16, 12]} /></mesh>
    </BuildingSite>
  );
}
