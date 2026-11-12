import { palette } from "./palette";

/** Warm winter-afternoon light rig. Every light in the scene reads its values from here. */
export const lighting = {
  /** Direction *towards* the sun (front-left, fairly low: long soft shadows). */
  sunDirection: [-0.58, 0.6, 0.55] as [number, number, number],
  sun: { color: "#fff0dc", intensity: 2.9 },
  /** Cool-pink bounce light from the opposite side so shadows never go grey. */
  fill: { color: "#ffd9e6", intensity: 0.45, direction: [0.6, 0.35, -0.7] as [number, number, number] },
  hemisphere: { sky: "#d3e4ff", ground: "#fbe6de", intensity: 1.05 },
  /** Golden pool of light around the plaza tree. */
  treeGlow: { color: palette.glow, intensity: 70, distance: 40 },
  fog: { color: palette.haze, near: 320, far: 980 },
  exposure: 1.02,
  shadow: { mapSize: 2048, extent: 100, bias: -0.0004, normalBias: 0.5 },
} as const;
