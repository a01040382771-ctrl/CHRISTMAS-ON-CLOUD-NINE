/**
 * Single source of truth for colour. Five brand colours from the art brief,
 * plus derived tints/shades so every illustration stays inside one family.
 */
export const brand = {
  burgundy: '#762E42',
  gold: '#C5A46A',
  powder: '#ACC9DD',
  ivory: '#F2E8D4',
  forest: '#345447',
} as const;

export const C = {
  ...brand,
  // ink (sepia line work — never pure black)
  ink: '#3B2720',
  inkSoft: 'rgba(59,39,32,0.55)',
  inkFaint: 'rgba(59,39,32,0.22)',
  // burgundy family
  burgundyDeep: '#55202F',
  burgundyLight: '#9C4E60',
  rose: '#E3B9BF',
  roseDeep: '#C98D99',
  roseLight: '#F3DBDA',
  // gold family
  goldDeep: '#9F7F45',
  goldLight: '#E6D2A2',
  candle: '#FFE9B8',
  flame: '#F2B45A',
  // powder blue family
  powderDeep: '#7C9DB8',
  powderLight: '#D7E6EE',
  nightBlue: '#3F5672',
  nightDeep: '#2B3B52',
  // ivory family
  ivoryDeep: '#E2D3B4',
  paper: '#F4EBD8',
  white: '#FBF7EE',
  // forest family
  forestDeep: '#22392F',
  forestLight: '#5E7E64',
  forestPale: '#8FA88E',
  // characters
  skin: '#F3D6BE',
  skinShade: '#E3B79C',
  cheek: '#E39C93',
  hair: '#7A4A2F',
  hairDeep: '#53311F',
  hairLight: '#9C6845',
  ribbon: '#A3333F',
  ribbonDeep: '#762E42',
  coat: '#9A3140',
  coatDeep: '#6E2232',
  navy: '#2C3858',
  navyDeep: '#1E2740',
  wood: '#C08F5E',
  woodDeep: '#8E6038',
  woodLight: '#DDB78A',
  boot: '#2E2420',
} as const;

export type Palette = typeof C;
