/**
 * Sky Village colour palette — the single source of truth for every colour in the world.
 * Components must not hard-code hex values; add a named swatch here instead.
 */
export const palette = {
  // Soft Pink — roofs and accents
  softPink: "#f1b3bd",
  rose: "#e293a3",
  blush: "#f9dcd8",
  // Warm Ivory — walls and snow
  warmIvory: "#fbf1e2",
  cream: "#f3e3cd",
  snow: "#fffaf4",
  snowShade: "#e4ebf6",
  // Pastel Blue — sky and distance
  pastelBlue: "#a9cbe6",
  skyZenith: "#6ea6d0",
  skyHorizon: "#e3eef6",
  skyBelow: "#9fc6e3",
  haze: "#eee6e8",
  // Sage Green — roofs and trees
  sage: "#a3bba0",
  sageDeep: "#7c9a80",
  pine: "#5f8a6c",
  pineDeep: "#497259",
  // Burgundy — ribbons and Christmas trim
  burgundy: "#8f2f47",
  burgundyDeep: "#6e2238",
  /** Raspberry between rose and burgundy — the default avatar coat, readable against pink walls and snow. */
  berry: "#c4566f",
  // Champagne Gold — lights and ornaments
  champagne: "#f3d9a4",
  gold: "#e3b862",
  /** Drainpipes and spire caps. */
  copper: "#b9744f",
  glow: "#ffd58a",
  // Supporting neutrals (stone, rock, wood) tuned to sit inside the pastel range
  stone: "#e2d2c3",
  stoneShade: "#c4afa2",
  paving: "#ecd9c8",
  pavingRose: "#e9c3bd",
  rock: "#dcc1b5",
  rockDeep: "#b8979a",
  wood: "#b9705f",
  woodDeep: "#84483f",
  trunk: "#8a6253",
  // Clouds
  cloudLit: "#fff8ee",
  cloudShade: "#f1b9a9",
  cloudCool: "#bccbe8",
} as const;

export type Swatch = keyof typeof palette;
