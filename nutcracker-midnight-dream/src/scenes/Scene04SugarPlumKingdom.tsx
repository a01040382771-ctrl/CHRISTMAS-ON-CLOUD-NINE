import React from 'react';
import {C} from '../styles/palette';
import {Layer, Cam} from '../animations/camera';
import {blinks, ease, keys, osc} from '../animations/easing';
import {Ballerina} from '../components/PaintedCast';
import {Plate, IMG} from '../components/Painted';
import {Clara} from '../components/PaintedCast';
import {Nutcracker} from '../components/PaintedCast';
import {MagicDust, Snow, Twinkle} from '../components/Effects';
import {range, rnd} from '../animations/particles';

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
      <Layer cam={cam} depth={0.6}>
        <g transform="translate(540 960) scale(1.12) translate(-540 -960)">
          <Plate src={IMG.kingdom} />
        </g>
        {/* glowing palace door and tower finials */}
        <ellipse cx={540} cy={760} rx={150} ry={190} fill="url(#g-magic)" opacity={0.35 + osc(f, 30, 0.12)} style={{mixBlendMode: 'screen'}} />
        {range(26).map((i) => (
          <g key={i} transform={`translate(${rnd(`ks${i}`, -60, 1140)} ${rnd(`ksy${i}`, -60, 620)})`}>
            <Twinkle r={rnd(`ksr${i}`, 5, 13)} opacity={0.35 + osc(f + i * 7, 30, 0.35)} />
          </g>
        ))}
        {/* sugar fireworks above the palace */}
        {[30, 90, 150].map((s, i) => (
          <MagicDust key={s} f={f} cx={[300, 780, 540][i]} cy={[420, 360, 200][i]} start={s} count={40} spread={220} dur={60} seed={`fw${i}`} rise={-0.2} />
        ))}
      </Layer>
      <Layer cam={cam} depth={0.72}>
        {[
          {x: 250, y: 1560, s: 0.95, k: 0, tutu: C.powderDeep, deep: C.nightBlue, hair: C.hairDeep},
          {x: 540, y: 1440, s: 0.8, k: 1, tutu: C.roseDeep, deep: C.burgundyLight, hair: C.hair},
          {x: 830, y: 1560, s: 0.95, k: 2, tutu: C.gold, deep: C.goldDeep, hair: '#3E2A20'},
        ].map((b) => (
          <g key={b.k} transform={`translate(${b.x + osc(f + b.k * 50, 140, 22)} ${b.y}) scale(${b.s})`}>
            <ellipse cx={0} cy={0} rx={150} ry={34} fill="url(#g-magic)" opacity={0.5} />
            <Ballerina ph={spin(b.k)} variant={(['blue', 'pink', 'gold'] as const)[b.k]} />
          </g>
        ))}
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
