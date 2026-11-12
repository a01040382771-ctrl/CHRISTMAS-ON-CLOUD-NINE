import { materials, type MaterialName } from "../../design";
import type { LotDef } from "../layout";
import { BuildingSite } from "./BuildingSite";
import { BoxBody, GableRoof } from "./kit/parts";

const styles: { wall: MaterialName; roof: MaterialName }[] = [
  { wall: "wallPink", roof: "roofPink" },
  { wall: "wallIvory", roof: "roofSage" },
  { wall: "wallCream", roof: "roofBurgundy" },
];

/** One market stall: counter, back wall, posts, swooping roof and a row of bulbs. Lot is 3.8 × 2.8. */
function Stall({ lot, style }: { lot: LotDef; style: (typeof styles)[number] }) {
  return (
    <BuildingSite lot={lot}>
      <BoxBody size={[3.2, 1.05, 0.9]} position={[0, 0, 0.5]} wall={style.wall} plinth={false} radius={0.12} />
      <mesh position={[0, 1.1, 0.55]} material={materials.wood} castShadow><boxGeometry args={[3.4, 0.12, 1.1]} /></mesh>
      <BoxBody size={[3.2, 2.5, 0.35]} position={[0, 0, -0.85]} wall={style.wall} plinth={false} radius={0.1} />
      <mesh position={[0, 1.55, -0.66]} material={materials.windowGlow}><planeGeometry args={[2.6, 1.1]} /></mesh>
      {[-1.5, 1.5].map((x) => <mesh key={x} position={[x, 1.25, 0.85]} material={materials.wood} castShadow><cylinderGeometry args={[0.08, 0.08, 2.5, 8]} /></mesh>)}
      <GableRoof width={3.3} depth={2.2} height={1.6} position={[0, 2.5, 0]} roof={style.roof} overhang={0.4} snowFrom={0.5} />
      {[-1.2, -0.6, 0, 0.6, 1.2].map((x) => <mesh key={x} position={[x, 2.36, 1.38]} material={materials.lampGlow}><sphereGeometry args={[0.09, 10, 8]} /></mesh>)}
    </BuildingSite>
  );
}

/**
 * 06 · Candy Market — stalls lining both sides of the market street.
 * PHASE 1 PLACEHOLDER: six identical stall massings in three colourways.
 */
export function CandyMarket({ lots }: { lots: LotDef[] }) {
  return <>{lots.map((lot, i) => <Stall key={lot.id} lot={lot} style={styles[i % styles.length]} />)}</>;
}
