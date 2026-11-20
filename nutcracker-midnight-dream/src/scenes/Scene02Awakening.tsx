import React from 'react';
import {C} from '../styles/palette';
import {Layer, Cam} from '../animations/camera';
import {blinks, ease, keys, osc, outBack} from '../animations/easing';
import {GiftBox} from '../components/Room';
import {Plate, IMG, PaintedTree} from '../components/Painted';
import {Clara} from '../components/PaintedCast';
import {Nutcracker} from '../components/PaintedCast';
import {MagicDust, Twinkle} from '../components/Effects';
import {range, rnd} from '../animations/particles';
import T from '../timeline.json';

const S = T.scenes[1].start;
const L = (abs: number) => abs - S; // absolute cue → local frame

/** Hand-meeting point (world space) – both arms are posed to reach it. */
const MEET = {x: 468, y: 1392};

export const Scene02Awakening: React.FC<{f: number}> = ({f}) => {
  const cam: Cam = {
    x: 600 + ease(f, [0, 180], [0, -70]),
    y: 1330 + ease(f, [0, 180], [0, 20]),
    zoom: 1.28 + ease(f, [0, 180], [0, 0.16]),
  };

  // --- the doll wakes ---
  const eye1 = L(T.cues.eyeTicks[0]);
  const eye2 = L(T.cues.eyeTicks[1]);
  const pupilX = keys(f, [[eye1 - 4, 0], [eye1 + 10, -0.85], [eye2 - 2, -0.85], [eye2 + 10, -0.55], [130, -0.55], [150, -1]]);
  const pupilY = keys(f, [[eye2 - 2, 0], [eye2 + 10, -0.45], [100, -0.3], [150, 0.15]]);
  const head = L(T.cues.headCreak);
  const headTilt = keys(f, [[0, 9], [head, 9], [head + 26, -5], [head + 34, -3]]);
  const headLift = keys(f, [[head, 0], [head + 26, 14]]);
  const arm0 = L(T.cues.armCreak);
  const [c1, c2] = T.cues.armClicks.map(L);
  const armL = keys(f, [[arm0, 4], [c1, 38], [c1 + 4, 36], [c2, 50], [c2 + 4, 49], [arm0 + 40, 60]]);
  const elbowL = keys(f, [[arm0, 0], [c2, 2], [arm0 + 42, 6]]);
  const burst = L(T.cues.magicBurst);
  const alive = ease(f, [burst - 6, burst + 40], [0, 1]);
  const jaw = keys(f, [[burst, 0], [burst + 12, 0.35], [burst + 24, 0.12]]);
  const clasp = L(T.cues.handClasp);
  const nBlink = blinks(f, [burst + 30]);

  // --- Clara ---
  const reach = ease(f, [112, clasp], [0, 1]);
  const after = ease(f, [clasp, clasp + 20], [0, 1]);
  const breathe = osc(f, 80);

  // --- floor light after the clasp ---
  const light = ease(f, [clasp - 2, 186], [0, 1], outBack);

  return (
    <svg viewBox="0 0 1080 1920" width="100%" height="100%">
      <rect width={1080} height={1920} fill={C.burgundyDeep} />
      <Layer cam={cam} depth={0.55}>
        <g filter="url(#blur4)" transform="translate(540 1300) scale(1.25) translate(-540 -1300)">
          <Plate src={IMG.parlourNight} />
        </g>
      </Layer>
      <Layer cam={cam} depth={0.78}>
        <g filter="url(#blur4)" transform="translate(760 1900)">
          <PaintedTree f={f} h={2300} />
        </g>
      </Layer>
      <Layer cam={cam} depth={1}>
        {/* the painted floor and rug, close up */}
        <defs>
          <clipPath id="s2-floor">
            <rect x={-200} y={1300} width={1480} height={800} />
          </clipPath>
        </defs>
        <g transform="translate(540 1300) scale(1.25) translate(-540 -1300)">
          <g clipPath="url(#s2-floor)">
            <Plate src={IMG.parlourNight} />
          </g>
          <rect x={-200} y={1296} width={1480} height={90} fill="url(#g-floorfade)" />
        </g>
        <defs>
          <linearGradient id="g-floorfade" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#2A1A14" stopOpacity="0.6" />
            <stop offset="1" stopColor="#2A1A14" stopOpacity="0" />
          </linearGradient>
        </defs>
        {/* floor light spreading from the clasp */}
        {light > 0 && (
          <g style={{mixBlendMode: 'screen'}}>
            <ellipse cx={MEET.x + 40} cy={1700} rx={60 + light * 760} ry={20 + light * 230} fill="url(#g-magic)" opacity={Math.min(1, light) * 0.95} />
            {range(14).map((i) => {
              const a = (i / 14) * Math.PI * 2 + f * 0.01;
              const r1 = light * 900;
              return (
                <path
                  key={i}
                  d={`M ${MEET.x + 40} 1700 L ${MEET.x + 40 + Math.cos(a - 0.05) * r1} ${1700 + Math.sin(a - 0.05) * r1 * 0.3} L ${MEET.x + 40 + Math.cos(a + 0.05) * r1} ${1700 + Math.sin(a + 0.05) * r1 * 0.3} Z`}
                  fill="#FFF3CF"
                  opacity={0.25 * Math.min(1, light)}
                />
              );
            })}
          </g>
        )}
        <g transform="translate(905 1600)" filter="url(#gouache)">
          <GiftBox w={210} h={150} color={C.forest} band={C.gold} />
        </g>
        <g transform="translate(70 1500)" filter="url(#gouache)">
          <GiftBox w={170} h={120} color={C.gold} band={C.burgundy} />
        </g>
        {/* the nutcracker, now as tall as a kneeling child */}
        <g transform="translate(720 1712) scale(1.15)">
          <Nutcracker
            pupilX={pupilX}
            pupilY={pupilY}
            headTilt={headTilt}
            headLift={headLift}
            armL={armL}
            elbowL={elbowL}
            armR={4 + alive * 6 + osc(f, 50, alive * 1.5)}
            elbowR={alive * 10}
            jaw={jaw}
            alive={alive}
            blink={nBlink}
            plumeSway={osc(f, 60)}
          />
        </g>
        <g transform="translate(250 1900) scale(1.36)">
          <Clara
            pose="kneel"
            gazeX={1}
            gazeY={keys(f, [[0, 0.3], [head, 0.3], [head + 20, -0.2]])}
            headTilt={keys(f, [[0, 8], [100, 4], [clasp, -6], [clasp + 20, -2]])}
            blink={blinks(f, [20, 96])}
            brow={keys(f, [[eye1, 0], [eye1 + 10, 1], [clasp + 10, 0.3]])}
            mouth={f < eye1 ? 'smile' : f < clasp + 6 ? 'o' : 'smile'}
            armR={10 + reach * 114 + after * 3}
            elbowR={30 - reach * 30}
            armL={keys(f, [[eye1, 10], [eye1 + 16, -18], [110, -18], [130, 10]])}
            elbowL={keys(f, [[eye1, 20], [eye1 + 16, -96], [110, -96], [130, 20]])}
            sway={osc(f, 60)}
            breathe={breathe}
          />
        </g>
        {/* golden dust around the doll */}
        <MagicDust f={f} cx={700} cy={1240} start={burst} count={90} spread={420} dur={90} seed="aw" />
        <MagicDust f={f} cx={MEET.x} cy={MEET.y} start={clasp - 4} count={60} spread={300} dur={50} seed="cl" rise={0.3} />
        {f > clasp - 3 && (
          <g transform={`translate(${MEET.x} ${MEET.y}) rotate(${f * 2})`} style={{mixBlendMode: 'screen'}}>
            <circle r={40 + after * 60} fill="url(#g-magic)" opacity={1 - after * 0.5} />
            <Twinkle r={50 + after * 40} opacity={1 - after * 0.4} />
          </g>
        )}
      </Layer>
      {/* foreground bokeh from the tree lights */}
      <Layer cam={cam} depth={1.5}>
        {range(9).map((i) => (
          <circle
            key={i}
            cx={rnd(`bk${i}`, -100, 1180)}
            cy={rnd(`bky${i}`, 500, 2000)}
            r={rnd(`bkr${i}`, 22, 60)}
            fill={i % 2 ? C.goldLight : '#FFE3B0'}
            opacity={0.18 + osc(f + i * 20, 70, 0.08)}
            filter="url(#blur10)"
          />
        ))}
      </Layer>
      <rect width={1080} height={1920} fill="url(#g-aw-vig)" />
      <defs>
        <radialGradient id="g-aw-vig" cx="50%" cy="62%" r="72%">
          <stop offset="0.5" stopColor={C.nightDeep} stopOpacity="0" />
          <stop offset="1" stopColor={C.nightDeep} stopOpacity="0.5" />
        </radialGradient>
      </defs>
    </svg>
  );
};
