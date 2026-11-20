import React from 'react';
import {C} from '../styles/palette';
import {hair, ink} from './Defs';
import {ease} from '../animations/easing';
import {range} from '../animations/particles';
import {SERIF_FONT, TITLE_FONT} from '../styles/fonts';

/** Curly corner flourish drawn in gold ink. */
const Flourish: React.FC<{draw: number}> = ({draw}) => (
  <g>
    <path
      d="M 0 0 C 40 0 70 10 80 40 C 88 64 70 80 54 72 C 40 64 46 46 60 48 M 0 0 C 0 40 10 70 40 80 C 64 88 80 70 72 54 C 64 40 46 46 48 60 M 18 18 L 30 30"
      fill="none"
      stroke={C.goldDeep}
      strokeWidth={3}
      strokeLinecap="round"
      pathLength={1}
      strokeDasharray="1 1"
      strokeDashoffset={1 - draw}
    />
    <circle cx={30} cy={30} r={5 * draw} fill={C.gold} />
  </g>
);

/**
 * The last page of an old storybook: ivory paper, gutter shadow,
 * stacked page edges, gilt border and the title set in old type.
 */
export const StoryPage: React.FC<{f: number; reveal: number; titleAt: number; frame: {x: number; y: number; w: number; h: number}}> = ({f, reveal, titleAt, frame}) => {
  if (reveal <= 0) return null;
  const word = (i: number) => ease(f, [titleAt + i * 6, titleAt + i * 6 + 16], [0, 1]);
  const words1 = ["The", "Nutcracker's"];
  const words2 = ['Midnight', 'Dream'];
  const rule = ease(f, [titleAt + 18, titleAt + 40], [0, 1]);
  const finis = ease(f, [titleAt + 30, titleAt + 46], [0, 1]);
  const bottomY = frame.y + frame.h;
  return (
    <g opacity={Math.min(1, reveal * 1.6)}>
      <rect width={1080} height={1920} fill={C.paper} />
      {/* gutter shadow + page stack */}
      <rect x={0} y={0} width={90} height={1920} fill="url(#g-gutter)" />
      {range(6).map((i) => (
        <path key={i} d={`M ${1080 - i * 5} 0 L ${1080 - i * 5} 1920`} {...hair(1, 'rgba(120,90,60,0.35)')} />
      ))}
      <defs>
        <linearGradient id="g-gutter" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#7A5A3A" stopOpacity="0.45" />
          <stop offset="1" stopColor="#7A5A3A" stopOpacity="0" />
        </linearGradient>
      </defs>
      {/* gilt border */}
      <rect x={60} y={60} width={960} height={1800} fill="none" {...ink(4, C.gold)} />
      <rect x={76} y={76} width={928} height={1768} {...hair(1.4, C.goldDeep)} />
      {[
        [76, 76, 0],
        [1004, 76, 90],
        [1004, 1844, 180],
        [76, 1844, 270],
      ].map(([x, y, r], i) => (
        <g key={i} transform={`translate(${x} ${y}) rotate(${r})`}>
          <Flourish draw={reveal} />
        </g>
      ))}
      {/* title */}
      <g fontFamily={TITLE_FONT} textAnchor="middle" fill={C.burgundy}>
        <text x={540} y={bottomY + 128} fontSize={74}>
          {words1.map((w, i) => (
            <tspan key={w} opacity={word(i)} dx={i ? 18 : 0}>
              {w}
            </tspan>
          ))}
        </text>
        <text x={540} y={bottomY + 222} fontSize={92} letterSpacing={2}>
          {words2.map((w, i) => (
            <tspan key={w} opacity={word(i + 2)} dx={i ? 22 : 0}>
              {w}
            </tspan>
          ))}
        </text>
      </g>
      {/* ornamental rule */}
      <g transform={`translate(540 ${bottomY + 276})`}>
        <path d="M -260 0 C -160 -16 -60 16 0 0 C 60 -16 160 16 260 0" fill="none" stroke={C.goldDeep} strokeWidth={2.6} pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - rule} />
        <path d="M 0 -14 L 10 0 L 0 14 L -10 0 Z" fill={C.gold} opacity={rule} {...ink(1.4, C.goldDeep)} />
      </g>
      <text x={540} y={bottomY + 350} textAnchor="middle" fontFamily={SERIF_FONT} fontStyle="italic" fontWeight={600} fontSize={42} fill={C.forest} opacity={finis} letterSpacing={6}>
        ~ The End ~
      </text>
      <text x={540} y={1816} textAnchor="middle" fontFamily={SERIF_FONT} fontWeight={500} fontSize={26} fill={C.goldDeep} opacity={finis * 0.9}>
        30
      </text>
    </g>
  );
};
