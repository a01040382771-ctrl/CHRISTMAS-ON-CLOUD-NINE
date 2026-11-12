import type { LotDef } from "../layout";
import { BuildingSite } from "./BuildingSite";
import { BoxBody, Chimney, ConeRoof, Door, GableRoof, GlowWindow, TowerBody } from "./kit/parts";

/**
 * 02 · Invitation House — the Christmas post office.
 * PHASE 1 PLACEHOLDER: massing only (hall + corner tower) to fix size, entrance and silhouette.
 * Phase 3 replaces the contents of this component; the lot and its paths stay as they are.
 */
export function InvitationHouse({ lots }: { lots: LotDef[] }) {
  return (
    <BuildingSite lot={lots[0]}>
      {/* main hall — lot is 11 × 8.5, door on the front face at x = 0 */}
      <BoxBody size={[7, 4.4, 5.6]} position={[1.2, 0, -0.6]} wall="wallIvory" />
      <GableRoof width={7} depth={5.6} height={3.3} position={[1.2, 4.3, -0.6]} roof="roofPink" />
      <Chimney position={[3.3, 5.2, -1.6]} height={2.3} />
      {/* entrance porch */}
      <BoxBody size={[2.8, 3.3, 1.4]} position={[0, 0, 2.5]} wall="wallPink" />
      <GableRoof width={1.5} depth={2.8} height={1.5} position={[0, 3.2, 2.6]} rotationY={Math.PI / 2} roof="roofPink" overhang={0.4} />
      <Door position={[0, 0, 3.2]} />
      {/* corner tower */}
      <TowerBody radius={2} height={7.4} position={[-3.3, 0, 0.9]} wall="wallCream" />
      <ConeRoof radius={2} height={4.4} position={[-3.3, 7.4, 0.9]} roof="roofSage" />
      <GlowWindow position={[-3.3, 1.5, 2.86]} w={0.9} h={1.6} />
      <GlowWindow position={[-3.3, 4.7, 2.82]} w={0.9} h={1.5} />
      <GlowWindow position={[-5.26, 4.7, 0.9]} rotationY={-Math.PI / 2} w={0.9} h={1.5} />
      {/* hall windows: front, side, back */}
      <GlowWindow position={[3.1, 1.4, 2.2]} />
      <GlowWindow position={[4.7, 1.4, -0.6]} rotationY={Math.PI / 2} />
      <GlowWindow position={[-0.4, 1.4, -3.4]} rotationY={Math.PI} />
      <GlowWindow position={[2.8, 1.4, -3.4]} rotationY={Math.PI} />
    </BuildingSite>
  );
}
