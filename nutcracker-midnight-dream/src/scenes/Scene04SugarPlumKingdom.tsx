import React from 'react';
import {C} from '../styles/palette';
import {Layer, Cam} from '../animations/camera';
import {blinks, ease, keys, osc} from '../animations/easing';
import {SugarPalace, SugarTower, CandyCloud, Ballerina, CandyLamp} from '../components/Kingdom';
import {Clara} from '../components/Clara';
import {Nutcracker} from '../components/Nutcracker';
import {MagicDust, Snow, Twinkle} from '../components/Effects';
import {ink} from '../components/Defs';
import {range, rnd} from '../animations/particles';

/** Perspective checkerboard ballroom floor in rose & ivory. */
const Ballroom: React.FC<{y0: number; y1: number}> = ({y0, y1}) => {
  const vp = {x: 540, y: y0 - 420};
  const rows = 9;
  const cols = 16;
  const tiles: React.ReactNode[] = [];
  const yAt = (r: number) => y0 + (y1 - y0) * Math.pow(r / rows, 1.7);
  const xAt = (c: number, y: number) => {
    const bx = -900 + (c / cols) * 2880;
    return vp.x + (bx - vp.x) * ((y - vp.y) / (y1 - vp.y));
  };
  for (let r = 0; r < rows; r++) {
    const ya = yAt(r);
    const yb = yAt(r + 1);
    for (let c = 0; c < cols; c++) {
      if ((r + c) % 2) continue;
      tiles.push(<path key={`${r}-${c}`} d={`M ${xAt(c, ya)} ${ya} L ${xAt(c + 1, ya)} ${ya} L ${xAt(c + 1, yb)} ${yb} L ${xAt(c, yb)} ${yb} Z`} fill={C.rose} opacity={0.85} />);
    }
  }
  return (
    <g>
      <rect x={-900} y={y0} width={2900} height={y1 - y0} fill={C.white} />
      {tiles}
      <rect x={-900} y={y0} width={2900} height={y1 - y0} fill="url(#g-floorsheen)" />
      <path d={`M -900 ${y0} L 2000 ${y0}`} {...ink(6, C.gold)} />
      <defs>
        <linearGradient id="g-floorsheen" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={C.powderLight} stopOpacity="0.6" />
          <stop offset="0.4" stopColor="#FFFFFF" stopOpacity="0" />
          <stop offset="1" stopColor={C.roseDeep} stopOpacity="0.25" />
        </linearGradient>
      </defs>
    </g>
  );
};

export const Scene04SugarPlumKingdom: React.FC<{f: number}> = ({f}) => {
  // a slow crane: from the sugar sky down to the ballroom
  const cam: Cam = {
    x: keys(f, [[0, 560], [210, 520]]),
    y: keys(f, [[0, 760], [90, 980], [210, 1040]]),
    zoom: keys(f, [[0, 1.22], [100, 1.04], [210, 1.1]]),
  };
  const spin = (k: number) => f * 0.17 + Math.sin(f / 33 + k) * 0.6 + k * 2.1;
  return (
    <svg viewBox="0 0 1080 1920" width="100%" height="100%">
      <defs>
        <linearGradient id="g-sugarsky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#9DBBD3" />
          <stop offset="0.35" stopColor={C.powderLight} />
          <stop offset="0.65" stopColor={C.roseLight} />
          <stop offset="1" stopColor="#F8E7D2" />
        </linearGradient>
      </defs>
      <rect width={1080} height={1920} fill="url(#g-sugarsky)" />
      <Layer cam={cam} depth={0.15}>
        {range(26).map((i) => (
          <g key={i} transform={`translate(${rnd(`ks${i}`, -100, 1180)} ${rnd(`ksy${i}`, -300, 700)})`}>
            <Twinkle r={rnd(`ksr${i}`, 5, 12)} opacity={0.5 + osc(f + i * 7, 30, 0.45)} />
          </g>
        ))}
        <g transform="translate(820 120)">
          <circle r={70} fill="#FFF8E6" {...ink(2, C.goldLight)} />
          <circle cx={26} cy={-10} r={62} fill="#B4CCDD" />
        </g>
      </Layer>
      <Layer cam={cam} depth={0.3}>
        {[
          {x: 60, h: 760, w: 90, t: 'blue'},
          {x: 230, h: 980, w: 110, t: 'rose'},
          {x: 860, h: 1000, w: 110, t: 'blue'},
          {x: 1040, h: 780, w: 90, t: 'rose'},
          {x: 400, h: 600, w: 70, t: 'blue'},
          {x: 690, h: 640, w: 70, t: 'rose'},
        ].map((t, i) => (
          <g key={i} transform={`translate(${t.x} 1200)`}>
            <SugarTower h={t.h} w={t.w} f={f} tone={t.t as 'blue' | 'rose'} seed={`tw${i}`} />
          </g>
        ))}
        {[
          {x: 120, y: 520, w: 300},
          {x: 900, y: 380, w: 360},
          {x: 520, y: 260, w: 260},
        ].map((c, i) => (
          <g key={i} transform={`translate(${c.x + osc(f + i * 40, 200, 30)} ${c.y})`}>
            <CandyCloud w={c.w} color={i % 2 ? C.powderLight : C.roseLight} />
          </g>
        ))}
      </Layer>
      <Layer cam={cam} depth={0.55}>
        <g transform="translate(540 1330)">
          <SugarPalace f={f} />
        </g>
        {/* sugar fireworks above the palace */}
        {[30, 90, 150].map((s, i) => (
          <MagicDust key={s} f={f} cx={[300, 780, 540][i]} cy={[420, 360, 180][i]} start={s} count={40} spread={220} dur={60} seed={`fw${i}`} rise={-0.2} />
        ))}
      </Layer>
      <Layer cam={cam} depth={0.85}>
        <Ballroom y0={1330} y1={2500} />
        {/* gilded garland arch over the ballroom */}
        <path d="M -60 1330 Q 540 1060 1140 1330" fill="none" {...ink(10, C.gold)} strokeDasharray="1 18" />
        {[
          {x: 250, y: 1580, s: 0.9, k: 0, tutu: C.powder, deep: C.powderDeep, hair: C.hairDeep},
          {x: 540, y: 1480, s: 0.76, k: 1, tutu: C.rose, deep: C.roseDeep, hair: C.hair},
          {x: 830, y: 1580, s: 0.9, k: 2, tutu: C.goldLight, deep: C.gold, hair: '#3E2A20'},
        ].map((b) => (
          <g key={b.k} transform={`translate(${b.x + osc(f + b.k * 50, 140, 26)} ${b.y}) scale(${b.s})`}>
            <ellipse cx={0} cy={0} rx={150} ry={34} fill="url(#g-magic)" opacity={0.5} />
            <Ballerina ph={spin(b.k)} tutu={b.tutu} tutuDeep={b.deep} hairColor={b.hair} />
          </g>
        ))}
      </Layer>
      <Layer cam={cam} depth={1.1}>
        <g transform="translate(40 1980)">
          <CandyLamp h={560} f={f} />
        </g>
        <g transform="translate(1040 1980)">
          <CandyLamp h={560} f={f} flip />
        </g>
      </Layer>
      {/* Clara and the Nutcracker watch the ball together, hand in hand */}
      <Layer cam={cam} depth={1.25}>
        <g transform="translate(330 2010) scale(0.8)">
          <Clara gazeX={0.5} gazeY={-0.6} headTilt={-4} mouth="smile" brow={0.6} blink={blinks(f, [70, 170])} armR={34} elbowR={10} armL={6} sway={osc(f, 45)} breathe={osc(f, 75)} />
        </g>
        <g transform="translate(610 2020) scale(0.64)">
          <Nutcracker pupilX={-0.2} pupilY={-0.5} alive={0.5} armL={42} elbowL={6} armR={8} headTilt={-3} jaw={0.15} plumeSway={osc(f, 40)} />
        </g>
      </Layer>
      {/* star-shaped sugar crystals and snowflakes drifting down */}
      <Snow f={f + 400} count={70} seed="k4" speed={0.8} stars wind={0.3} />
      <rect width={1080} height={1920} fill="url(#g-k-vig)" />
      <defs>
        <radialGradient id="g-k-vig" cx="50%" cy="50%" r="70%">
          <stop offset="0.6" stopColor={C.roseDeep} stopOpacity="0" />
          <stop offset="1" stopColor={C.burgundy} stopOpacity="0.28" />
        </radialGradient>
      </defs>
    </svg>
  );
};
