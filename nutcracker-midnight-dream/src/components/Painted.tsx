import React from 'react';
import {staticFile} from 'remotion';
import {C} from '../styles/palette';
import {ink} from './Defs';
import {osc} from '../animations/easing';
import {range, rnd} from '../animations/particles';
import {Twinkle} from './Effects';

/**
 * Hand-painted gouache plates (see README › 에셋 목록) and the small
 * animated overlays that bring them to life.
 */
export const IMG = {
  parlourNight: 'gouache/parlour-night.png',
  parlourMorning: 'gouache/parlour-morning.png',
  kingdom: 'gouache/kingdom.png',
  tree: 'gouache/tree.png',
  castle: 'gouache/castle.png',
  theatre: 'gouache/theatre.png',
  armchair: 'gouache/armchair.png',
  bookcase: 'gouache/bookcase.png',
} as const;

/** Native pixel sizes of the cut-out props (for aspect ratios). */
const SIZE: Record<string, [number, number]> = {
  tree: [766, 1497],
  castle: [627, 964],
  theatre: [812, 965],
  armchair: [707, 964],
  bookcase: [588, 989],
};

/** Full-frame painted plate in 1080×1920 world units. */
export const Plate: React.FC<{src: string; filter?: string; opacity?: number}> = ({src, filter, opacity}) => (
  <image href={staticFile(src)} x={0} y={0} width={1080} height={1920} preserveAspectRatio="none" filter={filter} opacity={opacity} />
);

/** Cut-out prop drawn with its bottom-centre at the origin, `h` units tall. */
export const Prop: React.FC<{name: keyof typeof SIZE; h: number; filter?: string}> = ({name, h, filter}) => {
  const [w0, h0] = SIZE[name];
  const w = (h * w0) / h0;
  return <image href={staticFile(IMG[name as keyof typeof IMG])} x={-w / 2} y={-h} width={w} height={h} filter={filter} />;
};

export const propWidth = (name: keyof typeof SIZE, h: number) => (h * SIZE[name][0]) / SIZE[name][1];

/** Where things are painted in the parlour plate (world units). */
export const PARLOUR_PLATE = {
  glass: {x: 278, y: 106, w: 232, h: 800},
  fire: {x: 62, y: 1300},
  clock: {x: 115, y: 676, r: 26},
};

// candle / bead highlights measured on tree.png (fractions of width/height)
const TREE_LIGHTS: Array<[number, number]> = [
  [0.401, 0.12], [0.547, 0.166], [0.647, 0.202], [0.331, 0.24], [0.62, 0.303], [0.346, 0.34], [0.75, 0.353],
  [0.262, 0.376], [0.76, 0.406], [0.477, 0.415], [0.691, 0.438], [0.194, 0.496], [0.705, 0.494], [0.392, 0.524],
  [0.834, 0.572], [0.238, 0.585], [0.702, 0.604], [0.164, 0.64], [0.343, 0.674], [0.633, 0.693], [0.144, 0.753],
  [0.857, 0.761], [0.373, 0.818], [0.727, 0.845], [0.202, 0.854],
];

/** The painted tree with flickering candle glow and a shimmering star. Origin = floor at trunk. */
export const PaintedTree: React.FC<{f: number; h: number; lit?: boolean; glow?: number; filter?: string}> = ({f, h, lit = true, glow = 1, filter}) => {
  const w = propWidth('tree', h);
  return (
    <g>
      {lit && <ellipse cx={0} cy={-h * 0.5} rx={w * 0.85} ry={h * 0.6} fill="url(#g-warm)" opacity={0.3 * glow + osc(f, 37, 0.04)} />}
      <Prop name="tree" h={h} filter={filter} />
      {lit && (
        <g style={{mixBlendMode: 'screen'}}>
          {TREE_LIGHTS.map(([x, y], i) => {
            const fl = 0.55 + Math.sin(f * 0.5 + i * 2.3) * 0.25 + Math.sin(f * 1.3 + i) * 0.15;
            return <circle key={i} cx={x * w - w / 2} cy={y * h - h} r={h * 0.018} fill="url(#g-warm)" opacity={fl * glow} />;
          })}
          <g transform={`translate(${0.503 * w - w / 2} ${0.035 * h - h})`}>
            <circle r={h * 0.07} fill="url(#g-magic)" opacity={(0.55 + osc(f, 24, 0.2)) * glow} />
            <g transform={`rotate(${f * 1.5})`}>
              <Twinkle r={h * 0.045} opacity={0.5 + osc(f, 18, 0.35)} />
            </g>
          </g>
        </g>
      )}
    </g>
  );
};

/** Snow falling behind the painted window panes. */
export const WindowSnow: React.FC<{f: number; id: string}> = ({f, id}) => {
  const g = PARLOUR_PLATE.glass;
  return (
    <g>
      <defs>
        <clipPath id={`glass-${id}`}>
          <path d={`M ${g.x} ${g.y + g.w / 2} A ${g.w / 2} ${g.w / 2} 0 0 1 ${g.x + g.w} ${g.y + g.w / 2} L ${g.x + g.w} ${g.y + g.h} L ${g.x} ${g.y + g.h} Z`} />
        </clipPath>
      </defs>
      <g clipPath={`url(#glass-${id})`}>
        {range(60).map((i) => {
          const sp = rnd(`gs${i}`, 0.9, 2.2);
          const y = g.y + ((rnd(`gy${i}`, 0, g.h) + f * sp) % g.h);
          const x = g.x + rnd(`gx${i}`, 0, g.w) + osc(f + i * 13, 70, 8);
          return <circle key={i} cx={x} cy={y} r={rnd(`gr${i}`, 1.4, 3.6)} fill={C.white} opacity={0.85} />;
        })}
      </g>
    </g>
  );
};

const Tongue: React.FC<{x: number; y: number; s: number; f: number; ph: number}> = ({x, y, s, f, ph}) => {
  const a = osc(f + ph * 20, 13 + ph * 3, 1);
  const b = osc(f + ph * 31, 9 + ph * 2, 1);
  const hgt = 120 + a * 22 + b * 10;
  return (
    <path
      transform={`translate(${x} ${y}) scale(${s})`}
      d={`M -30 0 C -34 -40 ${-14 + b * 8} ${-hgt * 0.55} ${a * 12} ${-hgt} C ${12 + b * 6} ${-hgt * 0.6} 38 -40 30 0 Z`}
      fill="url(#g-flame)"
    />
  );
};

/** Living fire laid over the painted hearth. */
export const FireOverlay: React.FC<{f: number; lit?: number}> = ({f, lit = 1}) => {
  const p = PARLOUR_PLATE.fire;
  const pulse = 0.75 + osc(f, 11, 0.14) + osc(f + 7, 5, 0.07);
  return (
    <g opacity={lit}>
      <ellipse cx={p.x + 60} cy={p.y - 40} rx={380} ry={300} fill="url(#g-warm)" opacity={0.45 * pulse} style={{mixBlendMode: 'screen'}} />
      <g opacity={0.6} style={{mixBlendMode: 'screen'}} filter="url(#blur4)">
        <Tongue x={p.x - 30} y={p.y + 10} s={0.9} f={f} ph={0.1} />
        <Tongue x={p.x + 20} y={p.y + 14} s={1.15} f={f} ph={0.5} />
        <Tongue x={p.x + 70} y={p.y + 16} s={0.75} f={f} ph={0.9} />
      </g>
      {range(8).map((i) => {
        const t = ((f + i * 13) % 55) / 55;
        return <circle key={i} cx={p.x + rnd(`fe${i}`, -40, 80) + Math.sin(t * 6 + i) * 12} cy={p.y - 40 - t * 200} r={2.6 * (1 - t)} fill="#FFD27A" opacity={1 - t} />;
      })}
      {/* warm light pooling on the floorboards */}
      <ellipse cx={p.x + 160} cy={p.y + 140} rx={260} ry={60} fill="url(#g-warm)" opacity={0.35 * pulse} style={{mixBlendMode: 'screen'}} />
    </g>
  );
};

/** Clock hands over the painted mantel clock. `minutes` = minutes past 11:00. */
export const ClockOverlay: React.FC<{minutes: number; glow?: number}> = ({minutes, glow = 0}) => {
  const c = PARLOUR_PLATE.clock;
  const hourAngle = ((11 + minutes / 60) % 12) * 30;
  const minAngle = (minutes % 60) * 6;
  return (
    <g transform={`translate(${c.x} ${c.y})`}>
      {glow > 0 && <circle r={c.r * 3} fill="url(#g-magic)" opacity={glow} style={{mixBlendMode: 'screen'}} />}
      <circle r={c.r - 3} fill="#F4ECDA" />
      {range(12).map((i) => {
        const a = (i / 12) * Math.PI * 2;
        const r0 = i % 3 ? c.r - 9 : c.r - 12;
        return <path key={i} d={`M ${Math.sin(a) * r0} ${-Math.cos(a) * r0} L ${Math.sin(a) * (c.r - 5)} ${-Math.cos(a) * (c.r - 5)}`} {...ink(i % 3 ? 1 : 2)} />;
      })}
      <path d="M -1.6 2 L 0 -12 L 1.6 2 Z" fill={C.ink} transform={`rotate(${hourAngle})`} />
      <path d="M -1.1 3 L 0 -18 L 1.1 3 Z" fill={C.ink} transform={`rotate(${minAngle})`} />
      <circle r={2.2} fill={C.gold} />
    </g>
  );
};
