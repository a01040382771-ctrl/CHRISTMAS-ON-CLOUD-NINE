/**
 * Shared proportions. 1 world unit = 1 metre.
 * Buildings, paths, bridges and (future) avatars all derive their sizes from these numbers
 * so that everything stays in the same scale when pieces are built one at a time.
 */
export const scale = {
  avatarHeight: 1.7,
  avatarWidth: 0.6,
  doorWidth: 1.4,
  doorHeight: 2.4,
  storyHeight: 3.2,
  /** Narrowest walkable path (two avatars pass comfortably). */
  pathMin: 3,
  pathMain: 4.5,
  bridgeWidth: 3.6,
  railingHeight: 1.05,
  /** Bridges and ramps never get steeper than this. */
  maxWalkSlopeDeg: 13,
  /** Minimum clear distance between a building lot and the cliff edge. */
  cliffMargin: 3,
  /** Size of one paving stone. */
  stone: 0.62,
} as const;
