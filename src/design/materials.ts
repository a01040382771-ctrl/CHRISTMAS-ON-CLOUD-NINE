import * as THREE from "three";
import { palette } from "./palette";
import { makeHaloTexture, makePlankTile, makeShingleTile, makeStoneTile } from "./textures";

/**
 * Shared material library. Every mesh in the world uses one of these instances, so a tweak here
 * restyles the whole village and buildings made in later phases automatically match.
 * Look: matte, hand-painted — high roughness, no metal except the champagne-gold accents.
 */
const matte = (color: string, extra: THREE.MeshStandardMaterialParameters = {}) =>
  new THREE.MeshStandardMaterial({ color, roughness: 0.88, metalness: 0, ...extra });

const stoneTile = makeStoneTile();
const plankTile = makePlankTile();

const shingleTile = makeShingleTile(palette.rose, "#b86a76", palette.blush);
shingleTile.rotation = Math.PI / 2;
shingleTile.repeat.set(1.6, 1.6);

export const textures = {
  stoneTile,
  plankTile,
  shingleTile,
  halo: makeHaloTexture(),
};

export const materials = {
  // ground
  snow: matte(palette.snow, { roughness: 0.95 }),
  paving: matte("#ffffff", { map: stoneTile, vertexColors: true, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }),
  stoneBlocks: matte("#ffffff", { map: stoneTile, vertexColors: true }),
  rock: matte("#ffffff", { vertexColors: true, roughness: 0.95 }),
  pad: matte(palette.stone),
  stone: matte(palette.stone),
  stoneShade: matte(palette.stoneShade),
  // architecture
  wallIvory: matte(palette.warmIvory),
  wallCream: matte(palette.cream),
  wallPink: matte(palette.blush),
  wallRose: matte(palette.softPink),
  roofPink: matte(palette.rose),
  roofSoftPink: matte(palette.softPink),
  roofSage: matte(palette.sage),
  roofSageDeep: matte(palette.sageDeep),
  roofBurgundy: matte(palette.burgundy),
  /** Scalloped pink tiles (Velvet Ballroom). */
  roofShingle: matte("#ffffff", { map: shingleTile }),
  trim: matte(palette.burgundy),
  trimDeep: matte(palette.burgundyDeep),
  wood: matte(palette.wood),
  woodDeep: matte(palette.woodDeep),
  planks: matte("#ffffff", { map: plankTile, vertexColors: true }),
  gold: new THREE.MeshStandardMaterial({ color: palette.gold, roughness: 0.38, metalness: 0.55 }),
  copper: new THREE.MeshStandardMaterial({ color: palette.copper, roughness: 0.45, metalness: 0.45 }),
  // light
  windowGlow: new THREE.MeshStandardMaterial({ color: palette.champagne, emissive: palette.glow, emissiveIntensity: 1.35, roughness: 0.6 }),
  lampGlow: new THREE.MeshStandardMaterial({ color: "#fff3d6", emissive: palette.glow, emissiveIntensity: 2.2, roughness: 0.5 }),
  starGlow: new THREE.MeshStandardMaterial({ color: palette.champagne, emissive: palette.gold, emissiveIntensity: 1.6, roughness: 0.4, metalness: 0.3 }),
  glass: new THREE.MeshStandardMaterial({
    color: "#eaf4fb", roughness: 0.12, metalness: 0, transparent: true, opacity: 0.34, side: THREE.DoubleSide, depthWrite: false,
    emissive: palette.champagne, emissiveIntensity: 0.12,
  }),
  // nature
  foliage: matte("#ffffff", { vertexColors: true }),
  pine: matte(palette.pine),
  pineDeep: matte(palette.pineDeep),
  trunk: matte(palette.trunk),
  // review helpers
  mannequin: matte(palette.rose, { transparent: true, opacity: 0.85 }),
} as const;

export type MaterialName = keyof typeof materials;
