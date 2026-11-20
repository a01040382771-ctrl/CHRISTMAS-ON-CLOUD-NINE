import React from 'react';
import {C} from '../styles/palette';
import {Layer, Cam} from '../animations/camera';
import {blinks, ease, keys, osc} from '../animations/easing';
import {GiftBox} from '../components/Room';
import {Plate, IMG, PaintedTree, WindowSnow, FireOverlay, ClockOverlay} from '../components/Painted';
import {Clara} from '../components/PaintedCast';
import {Nutcracker} from '../components/PaintedCast';
import {ink} from '../components/Defs';
import {range} from '../animations/particles';
import T from '../timeline.json';

/** Shared layout of the parlour so scene 5 can return to the very same room. */
export const PARLOUR = {
  tree: {x: 815, y: 1450, h: 1180},
  nut: {x: 700, y: 1532, s: 0.4},
  clara: {x: 380, y: 1790, s: 0.92},
  rug: {cx: 520, cy: 1700, rx: 520, ry: 165},
};

export const Gifts: React.FC<{f?: number}> = () => (
  <g filter="url(#gouache)">
    <g transform="translate(615 1478)">
      <GiftBox w={86} h={64} color={C.gold} band={C.burgundy} />
    </g>
    <g transform="translate(985 1505)">
      <GiftBox w={150} h={112} color={C.forest} band={C.gold} />
    </g>
    <g transform="translate(560 1562)">
      <GiftBox w={118} h={88} color={C.burgundy} band={C.gold} />
    </g>
    <g transform="translate(880 1584)">
      <GiftBox w={104} h={70} color={C.powder} band={C.burgundy} />
    </g>
  </g>
);

/** Foreground pine swag that frames the top of the picture (parallax). */
export const ForegroundGarland: React.FC<{f: number}> = ({f}) => (
  <g filter="url(#gouache)">
    <path d="M -80 -20 Q 540 300 1160 -20 L 1160 -200 L -80 -200 Z" fill={C.forestDeep} />
    <path d="M -80 -20 Q 540 300 1160 -20" fill="none" {...ink(46, C.forest)} />
    <path d="M -80 -20 Q 540 300 1160 -20" fill="none" {...ink(14, C.forestLight)} strokeDasharray="4 12" />
    {range(7).map((i) => {
      const t = (i + 0.5) / 7;
      const x = -80 + 1240 * t;
      const y = -20 + 4 * 160 * t * (1 - t) * 1.0 + 30;
      const sw = osc(f + i * 11, 80, 4);
      return (
        <g key={i} transform={`translate(${x} ${y}) rotate(${sw})`}>
          <path d="M 0 0 L 0 40" {...ink(1.6, C.goldDeep)} />
          <circle cy={58} r={20} fill={`url(#g-ball-${['red', 'gold', 'blue'][i % 3]})`} {...ink(2)} />
          <circle cx={-6} cy={50} r={4} fill="#FFFDF4" opacity={0.8} />
        </g>
      );
    })}
  </g>
);

export const Scene01ChristmasEve: React.FC<{f: number}> = ({f}) => {
  const P = PARLOUR;
  // camera slowly dollies toward the nutcracker
  const push = ease(f, [18, 190], [0, 1]);
  const cam: Cam = {
    x: 540 + (P.nut.x + 20 - 540) * push,
    y: 960 + (P.nut.y - 130 - 960) * push,
    zoom: 1 + 0.95 * push,
  };
  // the clock creeps to midnight
  const minutes = keys(f, [[0, 56.6], [T.cues.clockHandsAtMidnight - 10, 59.4], [T.cues.clockHandsAtMidnight, 60]]);
  const breathe = osc(f, 90);
  const reach = ease(f, [104, 160], [0, 1]);
  return (
    <svg viewBox="0 0 1080 1920" width="100%" height="100%">
      <rect width={1080} height={1920} fill={C.burgundyDeep} />
      <Layer cam={cam} depth={0.92}>
        <Plate src={IMG.parlourNight} />
        <WindowSnow f={f} id="s1" />
        <FireOverlay f={f} />
        <ClockOverlay minutes={minutes} glow={ease(f, [T.cues.clockHandsAtMidnight - 4, T.cues.clockHandsAtMidnight + 6], [0, 0.8]) * ease(f, [T.cues.clockHandsAtMidnight + 10, T.cues.clockHandsAtMidnight + 50], [1, 0.3])} />
      </Layer>
      <Layer cam={cam} depth={1}>
        <g transform={`translate(${P.tree.x} ${P.tree.y})`}>
          <PaintedTree f={f} h={P.tree.h} />
        </g>
        <Gifts />
        <g transform={`translate(${P.nut.x} ${P.nut.y}) scale(${P.nut.s})`}>
          <Nutcracker plumeSway={osc(f, 120)} />
        </g>
      </Layer>
      <Layer cam={cam} depth={1.12}>
        <g transform={`translate(${P.clara.x} ${P.clara.y}) scale(${P.clara.s})`}>
          <Clara
            gazeX={0.85}
            gazeY={0.55 + reach * 0.2}
            headTilt={6 + reach * 4}
            blink={blinks(f, [52, 128])}
            brow={reach * 0.8}
            mouth={reach > 0.5 ? 'o' : 'smile'}
            armR={10 + reach * 26}
            elbowR={6 + reach * 30}
            armL={6}
            sway={osc(f, 70)}
            breathe={breathe}
          />
        </g>
      </Layer>
      <Layer cam={cam} depth={1.45}>
        <ForegroundGarland f={f} />
      </Layer>
      {/* night: cool shadows at the edges, warm pools of light */}
      <rect width={1080} height={1920} fill="url(#g-nightvig)" />
      <defs>
        <radialGradient id="g-nightvig" cx="58%" cy="62%" r="75%">
          <stop offset="0.45" stopColor={C.nightDeep} stopOpacity="0" />
          <stop offset="1" stopColor={C.nightDeep} stopOpacity="0.55" />
        </radialGradient>
      </defs>
    </svg>
  );
};
