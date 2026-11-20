import React from 'react';
import {C} from '../styles/palette';
import {Layer, Cam} from '../animations/camera';
import {ease, keys, osc, outBack, smooth} from '../animations/easing';
import {GiftBox} from '../components/Room';
import {Plate, IMG, PaintedTree, Prop} from '../components/Painted';
import {Clara} from '../components/Clara';
import {Nutcracker} from '../components/Nutcracker';
import {ToySoldier} from '../components/Toys';
import {MagicDust} from '../components/Effects';
import {range, rnd} from '../animations/particles';
import T from '../timeline.json';

const S = T.scenes[2].start;
const L = (abs: number) => abs - S;
const BEAT = (T.fps * 60) / T.bpm; // 15 frames

/** Pop-up-book unfold: stands a flat piece up from the floor line. */
const PopUp: React.FC<{p: number; children: React.ReactNode}> = ({p, children}) =>
  p <= 0.001 ? null : <g transform={`skewX(${(1 - Math.min(1, p)) * -14}) scale(1 ${p})`}>{children}</g>;

export const THEATRE = {x: 845, y: 1450, h: 500, depth: 0.9};

export const Scene03EnchantedToys: React.FC<{f: number}> = ({f}) => {
  // camera: tilt up with the growing tree, glide right, then dive into the theatre stage
  const dive = ease(f, [138, 180], [0, 1], (t) => smooth(t) * smooth(t));
  const stage = {x: THEATRE.x, y: THEATRE.y - 0.56 * THEATRE.h};
  const base: Cam = {
    x: keys(f, [[0, 520], [60, 500], [140, 600]]),
    y: keys(f, [[0, 1080], [40, 900], [100, 1040], [140, 1060]]),
    zoom: keys(f, [[0, 1.05], [60, 1.0], [140, 1.08]]),
  };
  const target: Cam = {
    x: 540 + (stage.x - 540) / THEATRE.depth,
    y: 960 + (stage.y - 960) / THEATRE.depth,
    zoom: 1 + (4.4 - 1) / THEATRE.depth,
  };
  const cam: Cam = {
    x: base.x + (target.x - base.x) * dive,
    y: base.y + (target.y - base.y) * dive,
    zoom: base.zoom + (target.zoom - base.zoom) * dive,
  };

  const grow = ease(f, [L(T.cues.treeGrowStart), L(T.cues.treeGrowStart) + 66], [700, 1900], outBack);
  const pops = T.cues.giftPops.map((c) => ease(f, [L(c), L(c) + 14], [0, 1], outBack));
  const [pu1, pu2] = T.cues.popUps.map(L);
  const chairFold = ease(f, [pu1 - 10, pu1], [1, 0]);
  const castleUp = ease(f, [pu1, pu1 + 16], [0, 1], outBack);
  const shelfFold = ease(f, [pu2 - 10, pu2], [1, 0]);
  const theatreUp = ease(f, [pu2, pu2 + 16], [0, 1], outBack);
  const marchStart = L(T.cues.marchStart);
  const beat = (f - marchStart) / BEAT; // footsteps on the musical beat

  return (
    <svg viewBox="0 0 1080 1920" width="100%" height="100%">
      <rect width={1080} height={1920} fill={C.burgundyDeep} />
      <Layer cam={cam} depth={0.9}>
        <g transform="translate(540 1300) scale(1.22) translate(-540 -1300)">
          <Plate src={IMG.parlourNight} />
        </g>
        {/* magic light behind the tree */}
        <ellipse cx={540} cy={900} rx={620} ry={800} fill="url(#g-warm)" opacity={0.35 + osc(f, 40, 0.06)} style={{mixBlendMode: 'screen'}} />
        <g transform="translate(540 1400)">
          <PaintedTree f={f} h={grow} glow={1.3} />
        </g>
        <MagicDust f={f} cx={540} cy={1000} start={0} count={60} spread={700} dur={120} seed="tg" rise={1.2} />
        {/* armchair folds flat … a castle unfolds */}
        <g transform="translate(205 1470)">
          <PopUp p={chairFold}>
            <Prop name="armchair" h={400} />
          </PopUp>
          <PopUp p={castleUp}>
            <Prop name="castle" h={520} />
          </PopUp>
        </g>
        <g transform={`translate(${THEATRE.x} ${THEATRE.y})`}>
          <PopUp p={shelfFold}>
            <Prop name="bookcase" h={520} />
          </PopUp>
          <PopUp p={theatreUp}>
            <Prop name="theatre" h={THEATRE.h} />
          </PopUp>
        </g>
      </Layer>
      <g opacity={1 - ease(dive, [0.15, 0.5], [0, 1])}>
      <Layer cam={cam} depth={1}>
        {/* gift boxes burst open; a drummer springs out of each */}
        {[
          {x: 330, y: 1640, c: C.burgundy, b: C.gold},
          {x: 580, y: 1610, c: C.powder, b: C.burgundy},
          {x: 790, y: 1650, c: C.forest, b: C.gold},
        ].map((g, i) => {
          const p = pops[i];
          return (
            <g key={i} transform={`translate(${g.x} ${g.y})`} filter="url(#gouache)">
              {p > 0 && (
                <g transform={`translate(0 ${-118 + (1 - p) * 120}) scale(0.62)`}>
                  <ToySoldier step={Math.max(0, beat)} drum marching={false} />
                </g>
              )}
              <GiftBox w={150} h={118} color={g.c} band={g.b} lid={p} lidSpin={i % 2 ? 30 : -40} />
            </g>
          );
        })}
        {/* the marching column, stepping exactly on the beat */}
        {f >= marchStart - 5 &&
          range(7).map((i) => {
            const x = -120 + (f - marchStart) * 7.2 - i * 112;
            if (x < -200 || x > 1300) return null;
            return (
              <g key={i} transform={`translate(${x} ${1770 + (i % 2) * 6}) scale(0.8)`}>
                <ToySoldier step={beat + 0.0} drum={i === 0} />
              </g>
            );
          })}
      </Layer>
      {/* Clara and the Nutcracker, toy-sized now, watching from the rug's edge */}
      <Layer cam={cam} depth={1.18}>
        <g transform="translate(905 1985) scale(0.5)">
          <Clara gazeX={-0.7} gazeY={-0.4} headTilt={-6} mouth="o" brow={0.8} armR={20} elbowR={40} sway={osc(f, 50)} breathe={osc(f, 70)} />
        </g>
        <g transform="translate(1035 1990) scale(0.4)">
          <Nutcracker pupilX={-0.8} pupilY={-0.3} alive={0.3} armL={20} armR={70} elbowR={60} headTilt={-4} plumeSway={osc(f, 40)} />
        </g>
      </Layer>
      {/* drifting sparkles in front */}
      <Layer cam={cam} depth={1.3}>
        {range(14).map((i) => (
          <circle
            key={i}
            cx={rnd(`fs${i}`, -200, 1300) + osc(f + i * 9, 90, 30)}
            cy={((rnd(`fsy${i}`, 0, 2200) - f * rnd(`fsv${i}`, 1, 3)) % 2200 + 2200) % 2200}
            r={rnd(`fsr${i}`, 3, 8)}
            fill={C.goldLight}
            opacity={0.5 + osc(f + i * 7, 20, 0.4)}
          />
        ))}
      </Layer>
      </g>
    </svg>
  );
};
