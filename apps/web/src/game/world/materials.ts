import * as THREE from "three";
import * as TEX from "./textures";

/**
 * One shared palette for the whole village (pastel blue, ivory, pine green,
 * pastel pink, burgundy, champagne gold). Materials are created lazily once and reused,
 * which keeps draw state changes and GPU memory low.
 */
const std = (color: string, o: THREE.MeshStandardMaterialParameters = {}) =>
  new THREE.MeshStandardMaterial({ color, roughness: 0.88, metalness: 0, ...o });

let _m: ReturnType<typeof build> | null = null;

function build() {
  const plaster = TEX.plasterTexture();
  const cobble = TEX.cobbleTexture();
  const snow = TEX.snowTexture();
  const wood = TEX.woodTexture();
  const rock = TEX.rockTexture();
  const pineTex = TEX.pineTexture();
  const candy = TEX.stripeTexture();
  candy.repeat.set(1, 6);

  const warmGlass = (curtains: boolean) =>
    new THREE.MeshBasicMaterial({ map: TEX.windowTexture(curtains), toneMapped: false, color: "#ffd9a0" });

  return {
    plasterPink: std("#f6c3b6", { map: plaster }),
    plasterCream: std("#fbeed9", { map: plaster }),
    plasterBlue: std("#bcd6ea", { map: plaster }),
    plasterRose: std("#eaa7aa", { map: plaster }),
    plasterMint: std("#c4e0d0", { map: plaster }),
    stone: std("#b9a39b", { map: rock }),
    stoneLight: std("#e5d3c9", { map: rock }),
    rock: std("#ffffff", { vertexColors: true, roughness: 1 }),
    wood: std("#ffffff", { map: wood }),
    woodDark: std("#6b4a3a", { map: wood }),
    roofRed: std("#b3343f"),
    roofBurgundy: std("#7d2540"),
    roofTeal: std("#5f8f96"),
    roofPine: std("#3f7a56"),
    roofSlateBlue: std("#6f93b8"),
    trim: std("#fff3e3"),
    gold: new THREE.MeshStandardMaterial({ color: "#e6c27a", roughness: 0.35, metalness: 0.75 }),
    goldSoft: new THREE.MeshStandardMaterial({ color: "#f0d594", roughness: 0.45, metalness: 0.5, emissive: "#6b4a10", emissiveIntensity: 0.25 }),
    snow: new THREE.MeshStandardMaterial({ color: "#ffffff", map: snow, roughness: 0.95, emissive: "#b9d2f2", emissiveIntensity: 0.16 }),
    snowGround: new THREE.MeshStandardMaterial({ color: "#fdfbff", map: snow, roughness: 1, emissive: "#c3d6f2", emissiveIntensity: 0.12 }),
    cobble: std("#ffffff", { map: cobble, roughness: 0.92 }),
    pine: std("#3a7a52", { map: pineTex }),
    pineLight: std("#4c9462", { map: pineTex }),
    pineDeep: std("#2c6444", { map: pineTex }),
    trunk: std("#6e4a36"),
    candy: std("#ffffff", { map: candy, roughness: 0.5 }),
    ribbonRed: std("#c0303c", { roughness: 0.55 }),
    ribbonGold: new THREE.MeshStandardMaterial({ color: "#e8c46c", roughness: 0.4, metalness: 0.6 }),
    lampMetal: std("#4a3a40", { roughness: 0.5, metalness: 0.4 }),
    iron: std("#5b4a52", { roughness: 0.6, metalness: 0.3 }),
    burgundy: std("#7d2540", { roughness: 0.7 }),
    carrot: std("#f08a3c"),
    coal: std("#2a2226"),
    glass: warmGlass(false),
    glassCurtain: warmGlass(true),
    doorWood: std("#8a4f3a", { map: wood }),
    cloud: new THREE.MeshStandardMaterial({ color: "#fff1e8", roughness: 1, emissive: "#ffd9c4", emissiveIntensity: 0.38 }),
    cloudSea: new THREE.MeshStandardMaterial({ color: "#fff7f1", roughness: 1, emissive: "#ffe3d6", emissiveIntensity: 0.3 }),
    water: new THREE.MeshBasicMaterial({ color: "#cfeaf7", transparent: true, opacity: 0.85 }),
  };
}

export function M() {
  return (_m ??= build());
}

/** Shared string-light materials; one driver animates all lights in the village. */
let _l: ReturnType<typeof buildLights> | null = null;
function buildLights() {
  const mk = (c: string) => new THREE.MeshBasicMaterial({ color: c, toneMapped: false });
  return { warm: mk("#ffd27a"), red: mk("#ff6b6b"), blue: mk("#9fd3ff"), white: mk("#fff4d8") };
}
export function LIGHTS() {
  return (_l ??= buildLights());
}

let _glow: THREE.Texture | null = null;
export function glowTex() {
  return (_glow ??= TEX.glowTexture());
}
