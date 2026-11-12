import { palette } from "../../design/palette";

/**
 * Everything that makes an avatar look like *this* visitor. Plain colours today; later this is
 * where outfit choices live, and the same object will be sent to other players (Phase 3+).
 */
export interface AvatarAppearance {
  skin: string;
  cheeks: string;
  hair: string;
  coat: string;
  /** Fur trim on hem, cuffs and boots. */
  trim: string;
  buttons: string;
  scarf: string;
  hat: string;
  hatBand: string;
  pompom: string;
  mittens: string;
  leggings: string;
  boots: string;
}

export const defaultAppearance: AvatarAppearance = {
  skin: "#f8dccb",
  cheeks: "#f0a2a6",
  hair: "#7b4a3c",
  coat: palette.berry,
  trim: palette.snow,
  buttons: palette.gold,
  scarf: palette.sage,
  hat: palette.burgundy,
  hatBand: palette.warmIvory,
  pompom: palette.snow,
  mittens: palette.warmIvory,
  leggings: "#5b3340",
  boots: palette.woodDeep,
};
