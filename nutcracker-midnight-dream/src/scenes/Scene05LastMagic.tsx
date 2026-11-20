import React from 'react';
import {C} from '../styles/palette';
import {Layer, Cam} from '../animations/camera';
import {blinkAt, ease, keys, osc, smooth} from '../animations/easing';
import {Plate, IMG, PaintedTree, ClockOverlay, PARLOUR_PLATE} from '../components/Painted';
import {Clara} from '../components/PaintedCast';
import {Nutcracker} from '../components/PaintedCast';
import {LightRays, Twinkle} from '../components/Effects';
import {StoryPage} from '../components/StoryBook';
import {PARLOUR, Gifts} from './Scene01ChristmasEve';
import T from '../timeline.json';

const S = T.scenes[4].start;
const L = (abs: number) => abs - S;

const CLARA = {x: 640, y: 1660, s: 0.82};
const FRAME = {x: 205, y: 190, w: 670, h: 1191}; // final illustration plate on the page

export const Scene05LastMagic: React.FC<{f: number}> = ({f}) => {
  const wake = L(T.cues.wake);
  const wink = L(T.cues.blink);
  const title = L(T.cues.title);

  const nutFace = {x: CLARA.x + 14 * CLARA.s, y: CLARA.y - 165 * CLARA.s};
  const cam: Cam = {
    x: keys(f, [[0, CLARA.x - 20], [wink - 20, nutFace.x], [wink + 8, nutFace.x], [title + 8, 540]]),
    y: keys(f, [[0, CLARA.y - 300], [wink - 20, nutFace.y], [wink + 8, nutFace.y], [title + 8, 960]]),
    zoom: keys(f, [[0, 1.6], [wink - 20, 3.4], [wink + 8, 3.5], [title + 8, 1]]),
  };

  const eyesOpen = ease(f, [wake, wake + 14], [0, 1]);
  const headUp = ease(f, [wake - 4, wake + 30], [0, 1]);
  const winkAmt = blinkAt(f, wink, 12);
  const page = ease(f, [wink + 14, title + 12], [0, 1], smooth);

  const room = (
    <svg viewBox="0 0 1080 1920" width="100%" height="100%" overflow="hidden">
      <rect width={1080} height={1920} fill={C.burgundy} />
      <Layer cam={cam} depth={0.92}>
        <Plate src={IMG.parlourMorning} />
        <ClockOverlay minutes={60 + 7 * 60 + 40 + f / 30} />
      </Layer>
      <Layer cam={cam} depth={1}>
        <g transform={`translate(${PARLOUR.tree.x} ${PARLOUR.tree.y})`}>
          <PaintedTree f={f} h={PARLOUR.tree.h} lit={false} />
        </g>
        <Gifts />
        <g transform={`translate(${CLARA.x} ${CLARA.y}) scale(${CLARA.s})`}>
          <Clara
            pose="sit"
            asleep={eyesOpen < 0.5}
            blink={1 - eyesOpen}
            gazeX={0.15}
            gazeY={0.9}
            headTilt={keys(f, [[0, -16], [wake, -16], [wake + 30, -4]]) + osc(f, 90, 1.5) * (1 - headUp)}
            headY={headUp * 6}
            mouth={eyesOpen < 0.5 ? 'sleep' : f > wink + 4 ? 'o' : 'smile'}
            brow={ease(f, [wink + 2, wink + 12], [0.2, 1])}
            armL={8}
            elbowL={-54}
            armR={8}
            elbowR={-52}
            sway={osc(f, 80) * 0.5}
            breathe={osc(f, eyesOpen < 0.5 ? 100 : 70)}
            hug={
              <g transform="translate(14 -10) scale(0.32)">
                <Nutcracker armL={2} armR={2} winkOnly blink={winkAmt} pupilX={-0.1} pupilY={0.1} />
                {f > wink - 2 && f < wink + 26 && (
                  <g transform={`translate(18 -486) rotate(${f * 6})`} style={{mixBlendMode: 'screen'}}>
                    <circle r={60} fill="url(#g-magic)" opacity={ease(f, [wink, wink + 4], [0, 1]) * ease(f, [wink + 10, wink + 26], [1, 0])} />
                    <Twinkle r={48} opacity={ease(f, [wink, wink + 4], [0, 1]) * ease(f, [wink + 10, wink + 26], [1, 0])} />
                  </g>
                )}
              </g>
            }
          />
        </g>
      </Layer>
      {/* morning sun through the window */}
      <Layer cam={cam} depth={0.95}>
        <LightRays x={PARLOUR_PLATE.glass.x + PARLOUR_PLATE.glass.w / 2} y={PARLOUR_PLATE.glass.y + 260} angle={-28} len={1700} spread={260} opacity={0.9} f={f} />
      </Layer>
      <rect width={1080} height={1920} fill="url(#g-morning)" style={{mixBlendMode: 'soft-light'}} />
      <defs>
        <linearGradient id="g-morning" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#FFF2CF" stopOpacity="0.9" />
          <stop offset="1" stopColor="#E9C88E" stopOpacity="0.4" />
        </linearGradient>
      </defs>
    </svg>
  );

  // the living picture settles into a plate on the book's last page
  const s = 1 + (FRAME.w / 1080 - 1) * page;
  const tx = FRAME.x * page;
  const ty = FRAME.y * page;
  return (
    <svg viewBox="0 0 1080 1920" width="100%" height="100%">
      <defs>
        <clipPath id="plate-clip">
          <rect x={tx} y={ty} width={1080 * s} height={1920 * s} rx={page * 40} />
        </clipPath>
      </defs>
      <StoryPage f={f} reveal={page} titleAt={title} frame={FRAME} />
      <g clipPath="url(#plate-clip)">
        <g transform={`translate(${tx} ${ty}) scale(${s})`}>{room}</g>
      </g>
      {page > 0 && (
        <rect x={tx} y={ty} width={1080 * s} height={1920 * s} rx={page * 40} fill="none" stroke={C.gold} strokeWidth={10 * page} opacity={page} />
      )}
    </svg>
  );
};
