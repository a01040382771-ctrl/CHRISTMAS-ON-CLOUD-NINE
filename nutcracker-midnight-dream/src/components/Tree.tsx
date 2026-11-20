import React, {useMemo} from 'react';
import {C} from '../styles/palette';
import {hair, ink} from './Defs';
import {rnd} from '../animations/particles';

/**
 * The Christmas tree, drawn as six hand-cut tiers of drooping fir boughs.
 * Origin = floor at trunk centre. Unscaled height ≈ 1060 (incl. star).
 */
const TIERS = [
  {top: -1000, bot: -800, w: 135},
  {top: -880, bot: -655, w: 215},
  {top: -745, bot: -505, w: 285},
  {top: -600, bot: -345, w: 345},
  {top: -455, bot: -185, w: 395},
  {top: -305, bot: -40, w: 430},
];

const tierPath = (i: number, t: {top: number; bot: number; w: number}) => {
  const n = Math.max(4, Math.round(t.w / 34));
  // left flank: needles along a concave line from apex to left tip
  let d = `M 0 ${t.top}`;
  const flankSteps = 6;
  for (let k = 1; k <= flankSteps; k++) {
    const u = k / flankSteps;
    const x = -t.w * Math.pow(u, 0.9);
    const y = t.top + (t.bot - t.top) * u;
    const jag = rnd(`fl${i}${k}`, 8, 18);
    d += ` L ${x - jag} ${y - 6} L ${x + 4} ${y + 2}`;
  }
  // drooping bough tips along the bottom
  for (let k = 0; k < n; k++) {
    const x0 = -t.w + (2 * t.w * k) / n;
    const x1 = -t.w + (2 * t.w * (k + 1)) / n;
    const mid = (x0 + x1) / 2;
    const droop = rnd(`dr${i}${k}`, 16, 34);
    const curve = Math.cos((mid / t.w) * Math.PI * 0.5) * 18;
    d += ` Q ${mid - 6} ${t.bot + droop + curve} ${mid} ${t.bot + droop * 0.6 + curve}`;
    d += ` L ${mid + 5} ${t.bot + droop + curve + 6} L ${mid + 9} ${t.bot + curve + 8}`;
    d += ` Q ${(mid + x1) / 2} ${t.bot + curve + 2} ${x1} ${t.bot + rnd(`dy${i}${k}`, -4, 6) + Math.cos((x1 / t.w) * Math.PI * 0.5) * 18}`;
  }
  for (let k = flankSteps - 1; k >= 0; k--) {
    const u = k / flankSteps;
    const x = t.w * Math.pow(u, 0.9);
    const y = t.top + (t.bot - t.top) * u;
    const jag = rnd(`fr${i}${k}`, 8, 18);
    d += ` L ${x + jag} ${y + 2} L ${x - 4} ${y - 6}`;
  }
  return d + ' Z';
};

type Ornament = {x: number; y: number; r: number; kind: 'gold' | 'red' | 'blue' | 'candle'; ph: number};

export const ChristmasTree: React.FC<{f: number; glow?: number; lit?: boolean}> = ({f, glow = 1, lit = true}) => {
  const geo = useMemo(() => {
    const tiers = TIERS.map((t, i) => ({...t, d: tierPath(i, t)}));
    const needles: string[] = [];
    TIERS.forEach((t, i) => {
      const count = Math.round(t.w / 9);
      for (let k = 0; k < count; k++) {
        const u = rnd(`nu${i}${k}`, 0.25, 0.98);
        const y = t.top + (t.bot - t.top) * u;
        const half = t.w * Math.pow(u, 0.9) * 0.92;
        const x = rnd(`nx${i}${k}`, -half, half);
        const len = rnd(`nl${i}${k}`, 7, 15);
        const lean = x / (t.w + 1);
        // little fan of needles: a "v" of two short strokes
        needles.push(`M ${x} ${y} l ${-4 + lean * 10} ${len} M ${x} ${y} l ${4 + lean * 10} ${len * 0.9}`);
      }
    });
    const orns: Ornament[] = [];
    const kinds: Ornament['kind'][] = ['gold', 'red', 'candle', 'blue', 'gold', 'red', 'candle'];
    TIERS.forEach((t, i) => {
      const count = 2 + i;
      for (let k = 0; k < count; k++) {
        const u = (k + 0.5) / count;
        const x = (-0.82 + 1.64 * u) * t.w + rnd(`ox${i}${k}`, -14, 14);
        const y = t.bot - rnd(`oy${i}${k}`, 10, 70) + Math.cos((x / t.w) * Math.PI * 0.5) * 14;
        orns.push({x, y, r: rnd(`or${i}${k}`, 13, 19), kind: kinds[(i * 3 + k) % kinds.length], ph: rnd(`ph${i}${k}`, 0, 2)});
      }
    });
    return {tiers, needles: needles.join(' '), orns};
  }, []);

  const flick = (ph: number) => 1 + Math.sin(f * 0.55 + ph * 7) * 0.08 + Math.sin(f * 1.3 + ph * 3) * 0.05;

  return (
    <g>
      {/* warm aura of candle light */}
      {lit && <ellipse cx={0} cy={-520} rx={560} ry={640} fill="url(#g-warm)" opacity={0.35 * glow * flick(0.3)} />}
      {/* tree skirt */}
      <ellipse cx={0} cy={-6} rx={300} ry={48} fill={C.burgundy} {...ink(2.6)} />
      <ellipse cx={0} cy={-6} rx={300} ry={48} fill="none" {...ink(6, C.gold)} strokeDasharray="2 14" />
      <path d="M -60 -48 L -40 -4 L 40 -4 L 60 -48 Z" fill={C.woodDeep} {...ink(2.2)} />
      {/* boughs (lowest first) */}
      {[...geo.tiers].reverse().map((t, idx) => {
        const i = geo.tiers.length - 1 - idx;
        return (
          <g key={i}>
            <path d={t.d} fill="url(#g-green)" {...ink(2.6, C.forestDeep)} />
            <path d={`M ${-t.w * 0.85} ${t.bot + 2} Q 0 ${t.bot + 34} ${t.w * 0.85} ${t.bot + 2}`} fill="none" {...ink(18, 'rgba(20,40,30,0.25)')} />
            {/* garland swag of gold beads */}
            <path
              d={`M ${-t.w * 0.88} ${t.bot - 70} Q 0 ${t.bot + (i % 2 ? -10 : 0)} ${t.w * 0.88} ${t.bot - 95}`}
              fill="none"
              stroke={C.goldLight}
              strokeWidth={7}
              strokeLinecap="round"
              strokeDasharray="0.1 13"
            />
          </g>
        );
      })}
      <path d={geo.needles} {...hair(1.5, 'rgba(150,185,150,0.42)')} />
      <path d={geo.needles} transform="translate(3 6)" {...hair(1.3, 'rgba(20,45,35,0.35)')} />
      {/* ornaments */}
      {geo.orns.map((o, i) =>
        o.kind === 'candle' ? (
          <g key={i} transform={`translate(${o.x} ${o.y})`}>
            {lit && <circle cx={0} cy={-34} r={22} fill="url(#g-warm)" opacity={0.85 * glow * flick(o.ph)} />}
            <rect x={-5} y={-26} width={10} height={28} rx={2} fill={C.white} {...ink(1.6)} />
            <path d="M -9 2 L 9 2 L 6 8 L -6 8 Z" fill="url(#g-gold)" {...ink(1.4)} />
            {lit && (
              <path
                transform={`translate(0 -27) scale(${1} ${flick(o.ph)})`}
                d="M 0 -16 C 6 -8 6 -2 0 0 C -6 -2 -6 -8 0 -16 Z"
                fill="url(#g-flame)"
                {...ink(1, C.goldDeep)}
              />
            )}
          </g>
        ) : (
          <g key={i} transform={`translate(${o.x} ${o.y}) rotate(${Math.sin(f / 22 + o.ph * 3) * 4} 0 ${-o.r - 10})`}>
            <path d={`M 0 ${-o.r - 12} L 0 ${-o.r}`} {...hair(1.4, C.goldDeep)} />
            <rect x={-4} y={-o.r - 4} width={8} height={6} fill="url(#g-gold)" {...ink(1.2)} />
            <circle r={o.r} fill={`url(#g-ball-${o.kind})`} {...ink(2)} />
            <path d={`M ${-o.r * 0.55} ${-o.r * 0.1} Q 0 ${o.r * 0.25} ${o.r * 0.55} ${-o.r * 0.1}`} {...hair(1.2, 'rgba(255,255,255,0.5)')} />
            <circle cx={-o.r * 0.35} cy={-o.r * 0.38} r={o.r * 0.18} fill="#FFFDF4" opacity={0.75 + Math.sin(f / 9 + o.ph * 5) * 0.25} />
          </g>
        ),
      )}
      {/* star */}
      <g transform={`translate(0 -1030) rotate(${Math.sin(f / 40) * 3})`}>
        {lit && <circle r={110} fill="url(#g-magic)" opacity={0.55 + Math.sin(f / 12) * 0.12} />}
        <path
          d={Array.from({length: 16}, (_, k) => {
            const a = (k / 16) * Math.PI * 2 - Math.PI / 2;
            const r = k % 2 ? 22 : k % 4 ? 46 : 62;
            return `${k ? 'L' : 'M'} ${Math.cos(a) * r} ${Math.sin(a) * r}`;
          }).join(' ') + ' Z'}
          fill="url(#g-ball-gold)"
          {...ink(2.4)}
        />
        <circle r={10} fill="#FFF6DA" {...ink(1.4)} />
      </g>
    </g>
  );
};
