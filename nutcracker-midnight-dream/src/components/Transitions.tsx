import React from 'react';
import {AbsoluteFill} from 'remotion';
import {C} from '../styles/palette';
import {ease, keys} from '../animations/easing';
import {hair, ink} from './Defs';
import {Snow, Twinkle} from './Effects';
import {range, rnd} from '../animations/particles';

type P = {frame: number; at: number};

/** 2 → 3: the light from the clasp floods the page. */
export const GoldenFlash: React.FC<P> = ({frame, at}) => {
  const o = keys(frame, [[at - 16, 0], [at - 1, 1], [at + 3, 1], [at + 20, 0]]);
  if (o <= 0) return null;
  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      <svg viewBox="0 0 1080 1920" width="100%" height="100%">
        <rect width={1080} height={1920} fill="#FFF6DE" opacity={o * 0.92} />
        <circle cx={540} cy={1250} r={300 + o * 900} fill="url(#g-magic)" opacity={o} />
        <g transform={`translate(540 1250) rotate(${frame})`} opacity={o}>
          {range(10).map((i) => (
            <g key={i} transform={`rotate(${i * 36}) translate(${200 + o * 300} 0)`}>
              <Twinkle r={30} />
            </g>
          ))}
        </g>
      </svg>
    </AbsoluteFill>
  );
};

const CurtainHalf: React.FC<{side: -1 | 1; open: number; f: number}> = ({side, open, f}) => {
  // each half covers 0..560 px from its edge when closed, gathers to ~150 when open
  const reach = 560 - open * 470;
  const edge = side < 0 ? 0 : 1080;
  const inner = edge - side * reach;
  const gather = open * 120;
  const folds = range(7).map((i) => {
    const t = (i + 0.5) / 7;
    const x = edge - side * reach * t;
    const sw = Math.sin(f / 9 + i) * 6 * (1 - open);
    return `M ${x} 120 C ${x - side * gather * 0.2} 700 ${x + sw + side * gather * t * 0.4} 1300 ${x + sw + side * gather * t} 1930`;
  });
  return (
    <g>
      <path
        d={`M ${edge + side * 20} 100 L ${inner} 100 C ${inner + side * gather * 0.2} 700 ${inner + side * gather * 0.6} 1400 ${inner + side * gather} 1930 L ${edge + side * 20} 1930 Z`}
        fill={C.burgundy}
        {...ink(3)}
      />
      <path d={folds.join(' ')} {...hair(14, 'rgba(60,15,30,0.35)')} />
      <path d={folds.join(' ')} {...hair(5, 'rgba(255,210,215,0.16)')} transform={`translate(${-side * 18} 0)`} />
      <path d={`M ${inner} 100 C ${inner + side * gather * 0.2} 700 ${inner + side * gather * 0.6} 1400 ${inner + side * gather} 1930`} fill="none" {...ink(12, C.gold)} strokeDasharray="3 9" />
    </g>
  );
};

/** 3 → 4: the toy theatre's velvet curtain parts on the Sugar Plum Kingdom. */
export const TheatreCurtain: React.FC<P> = ({frame, at}) => {
  const show = frame >= at - 14 && frame < at + 34;
  if (!show) return null;
  const close = ease(frame, [at - 14, at - 2], [0, 1]);
  const open = ease(frame, [at + 2, at + 30], [0, 1]);
  const lift = ease(frame, [at + 16, at + 34], [0, 1]);
  return (
    <AbsoluteFill style={{pointerEvents: 'none', opacity: close}}>
      <svg viewBox="0 0 1080 1920" width="100%" height="100%">
        <g transform={`translate(${-open * 120} 0)`}>
          <CurtainHalf side={-1} open={open} f={frame} />
        </g>
        <g transform={`translate(${open * 120} 0)`}>
          <CurtainHalf side={1} open={open} f={frame} />
        </g>
        <g transform={`translate(0 ${-lift * 360})`}>
          <path d="M -20 -20 L 1100 -20 L 1100 150 Q 810 260 540 170 Q 270 260 -20 150 Z" fill={C.burgundyLight} {...ink(3)} />
          <path d="M -20 150 Q 270 260 540 170 Q 810 260 1100 150" fill="none" {...ink(16, C.gold)} strokeDasharray="3 10" />
          <rect x={-20} y={-10} width={1120} height={40} fill="url(#g-gold)" {...ink(2)} />
        </g>
      </svg>
    </AbsoluteFill>
  );
};

/** 4 → 5: a swirl of snowflakes carries the dream away into morning. */
export const SnowSwirl: React.FC<P> = ({frame, at}) => {
  const a = at - 26;
  const b = at + 24;
  if (frame < a || frame > b) return null;
  const env = keys(frame, [[a, 0], [at - 4, 1], [at + 4, 1], [b, 0]]);
  const t = (frame - a) / (b - a);
  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      <svg viewBox="0 0 1080 1920" width="100%" height="100%">
        <rect width={1080} height={1920} fill={C.powderLight} opacity={env * 0.85} />
        <g opacity={env}>
          {range(150).map((i) => {
            const r0 = rnd(`sw${i}`, 40, 1100);
            const a0 = rnd(`swa${i}`, 0, Math.PI * 2);
            const ang = a0 + t * (3.2 + (1100 - r0) / 300);
            const r = r0 * (1.25 - t * 0.5);
            const x = 540 + Math.cos(ang) * r;
            const y = 960 + Math.sin(ang) * r * 1.4;
            const s = rnd(`sws${i}`, 3, 11);
            return i % 4 ? (
              <circle key={i} cx={x} cy={y} r={s * 0.6} fill={C.white} />
            ) : (
              <g key={i} transform={`translate(${x} ${y}) rotate(${ang * 60})`}>
                <path d={range(3).map((k) => `M ${-s * 2 * Math.cos((k * Math.PI) / 3)} ${-s * 2 * Math.sin((k * Math.PI) / 3)} L ${s * 2 * Math.cos((k * Math.PI) / 3)} ${s * 2 * Math.sin((k * Math.PI) / 3)}`).join(' ')} stroke={C.white} strokeWidth={2} strokeLinecap="round" />
              </g>
            );
          })}
        </g>
        <g opacity={env * 0.7}>
          <Snow f={frame} count={40} seed="sw2" speed={2} wind={4} />
        </g>
      </svg>
    </AbsoluteFill>
  );
};
