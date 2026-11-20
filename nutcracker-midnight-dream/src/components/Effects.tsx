import React from 'react';
import {C} from '../styles/palette';
import {ink} from './Defs';
import {rnd, range} from '../animations/particles';

/** Six-armed hand-drawn snowflake. */
export const Snowflake: React.FC<{r: number; color?: string; w?: number}> = ({r, color = C.white, w = 1.6}) => (
  <g>
    {range(6).map((i) => (
      <g key={i} transform={`rotate(${i * 60})`}>
        <path d={`M 0 0 L 0 ${-r} M 0 ${-r * 0.55} L ${-r * 0.28} ${-r * 0.78} M 0 ${-r * 0.55} L ${r * 0.28} ${-r * 0.78}`} stroke={color} strokeWidth={w} strokeLinecap="round" fill="none" />
      </g>
    ))}
    <circle r={r * 0.14} fill={color} />
  </g>
);

/** Sugar-crystal star (scene 4). */
export const CrystalStar: React.FC<{r: number; fill?: string}> = ({r, fill = 'url(#g-ball-gold)'}) => (
  <path
    d={
      range(10)
        .map((k) => {
          const a = (k / 10) * Math.PI * 2 - Math.PI / 2;
          const rr = k % 2 ? r * 0.45 : r;
          return `${k ? 'L' : 'M'} ${Math.cos(a) * rr} ${Math.sin(a) * rr}`;
        })
        .join(' ') + ' Z'
    }
    fill={fill}
    {...ink(Math.max(1, r * 0.09), C.goldDeep)}
  />
);

/** Four-point twinkle. */
export const Twinkle: React.FC<{r: number; color?: string; opacity?: number}> = ({r, color = '#FFF6DA', opacity = 1}) => (
  <path
    d={`M 0 ${-r} Q ${r * 0.12} ${-r * 0.12} ${r} 0 Q ${r * 0.12} ${r * 0.12} 0 ${r} Q ${-r * 0.12} ${r * 0.12} ${-r} 0 Q ${-r * 0.12} ${-r * 0.12} 0 ${-r} Z`}
    fill={color}
    opacity={opacity}
  />
);

/**
 * Falling snow in screen space. Deterministic; layered by depth so near
 * flakes are bigger, faster and drawn as crystals.
 */
export const Snow: React.FC<{f: number; count?: number; seed?: string; speed?: number; opacity?: number; wind?: number; color?: string; stars?: boolean}> = ({
  f,
  count = 60,
  seed = 'sn',
  speed = 1,
  opacity = 1,
  wind = 0,
  color = C.white,
  stars = false,
}) => (
  <g opacity={opacity}>
    {range(count).map((i) => {
      const depth = rnd(`${seed}d${i}`, 0.3, 1);
      const vy = (1.2 + depth * 2.6) * speed;
      const y = ((rnd(`${seed}y${i}`, 0, 2100) + f * vy) % 2100) - 90;
      const x = ((rnd(`${seed}x${i}`, -100, 1180) + f * wind * depth + Math.sin(f / (40 + i % 17) + i) * 22 * depth + 1300) % 1300) - 110;
      const r = 3 + depth * 9;
      const rot = f * (i % 2 ? 1 : -1) * 0.8 + i * 30;
      if (stars && i % 3 === 0) {
        return (
          <g key={i} transform={`translate(${x} ${y}) rotate(${rot})`}>
            <CrystalStar r={r * 1.5} />
          </g>
        );
      }
      return depth > 0.72 ? (
        <g key={i} transform={`translate(${x} ${y}) rotate(${rot})`} opacity={0.95}>
          <Snowflake r={r * 1.2} color={color} w={1.4 + depth} />
        </g>
      ) : (
        <circle key={i} cx={x} cy={y} r={r * 0.45} fill={color} opacity={0.55 + depth * 0.4} />
      );
    })}
  </g>
);

/**
 * Golden magic dust spiralling outward from a point.
 * start: frame the burst begins; dur: frames each mote lives.
 */
export const MagicDust: React.FC<{f: number; cx: number; cy: number; start: number; count?: number; spread?: number; dur?: number; seed?: string; rise?: number}> = ({
  f,
  cx,
  cy,
  start,
  count = 70,
  spread = 380,
  dur = 80,
  seed = 'md',
  rise = 0.6,
}) => (
  <g>
    {range(count).map((i) => {
      const born = start + rnd(`${seed}b${i}`, 0, 50);
      const age = f - born;
      if (age < 0 || age > dur) return null;
      const t = age / dur;
      const a0 = rnd(`${seed}a${i}`, 0, Math.PI * 2);
      const swirl = rnd(`${seed}s${i}`, 1.2, 2.6) * (i % 2 ? 1 : -1);
      const rr = spread * rnd(`${seed}r${i}`, 0.35, 1) * (1 - Math.pow(1 - t, 2.2));
      const a = a0 + swirl * t;
      const x = cx + Math.cos(a) * rr;
      const y = cy + Math.sin(a) * rr * 0.75 - t * spread * rise;
      const tw = 0.6 + Math.sin(age * 0.6 + i) * 0.4;
      const op = Math.sin(Math.PI * Math.min(1, t * 1.1)) * tw;
      const sz = rnd(`${seed}z${i}`, 4, 11);
      return i % 4 === 0 ? (
        <g key={i} transform={`translate(${x} ${y}) rotate(${age * 4})`}>
          <Twinkle r={sz * 1.6} opacity={op} />
        </g>
      ) : (
        <circle key={i} cx={x} cy={y} r={sz * 0.5} fill={i % 3 ? C.goldLight : '#FFF6DA'} opacity={op} />
      );
    })}
  </g>
);

/** Soft god-rays (morning window, magic light). */
export const LightRays: React.FC<{x: number; y: number; angle: number; len: number; spread: number; opacity: number; f: number; color?: string; n?: number}> = ({
  x,
  y,
  angle,
  len,
  spread,
  opacity,
  f,
  color = '#FFF1C8',
  n = 6,
}) => (
  <g transform={`translate(${x} ${y}) rotate(${angle})`} opacity={opacity} style={{mixBlendMode: 'screen'}}>
    {range(n).map((i) => {
      const off = -spread / 2 + (i / (n - 1)) * spread;
      const w = rnd(`lr${i}`, 30, 90);
      const o = 0.18 + Math.sin(f / 30 + i * 1.7) * 0.07;
      return <path key={i} d={`M ${off - w * 0.2} 0 L ${off + w * 0.2} 0 L ${off * 2.2 + w} ${len} L ${off * 2.2 - w} ${len} Z`} fill={color} opacity={o} filter="url(#blur10)" />;
    })}
  </g>
);
