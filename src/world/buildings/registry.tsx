import type { ComponentType } from "react";
import type { LotDef, ZoneId } from "../layout";
import { CandyMarket } from "./CandyMarket";
import { InvitationHouse } from "./InvitationHouse";
import { MoonlitTerrace } from "./MoonlitTerrace";
import { PhotoGarden } from "./PhotoGarden";
import { StarlightPlaza } from "./StarlightPlaza";
import { VelvetBallroom } from "./VelvetBallroom";
import { WishForest } from "./WishForest";

/**
 * One component per zone. Each receives the lots the layout assigns to it and is otherwise
 * self-contained, so a zone can be redesigned (or swapped for a GLB via common/GlbAsset) without
 * touching any other zone.
 */
export const zoneComponents: Record<ZoneId, ComponentType<{ lots: LotDef[] }>> = {
  "starlight-plaza": StarlightPlaza,
  "invitation-house": InvitationHouse,
  "velvet-ballroom": VelvetBallroom,
  "photo-garden": PhotoGarden,
  "wish-forest": WishForest,
  "candy-market": CandyMarket,
  "moonlit-terrace": MoonlitTerrace,
};
