import React from 'react';
import {C} from '../styles/palette';
import {Layer, Cam} from '../animations/camera';
import {blinkAt, ease, keys, osc, smooth} from '../animations/easing';
import {Wall, Floor, Window, Fireplace, MantelClock} from '../components/Room';
import {ChristmasTree} from '../components/Tree';
import {Clara} from '../components/Clara';
import {Nutcracker} from '../components/Nutcracker';
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

  const nutFace = {x: CLARA.x + 14 * CLARA.s, y: CLARA.y - 233 * CLARA.s};
  const cam: Cam = {
    x: keys(f, [[0, CLARA.x - 20], [wink - 20, nutFace.x], [wink + 8, nutFace.x], [title + 8, 540]]),
    y: keys(f, [[0, CLARA.y - 300], [wink - 20, nutFace.y], [wink + 8, nutFace.y], [title + 8, 960]]),
    zoom: keys(f, [[0, 1.6], [wink - 20, 3.2], [wink + 8, 3.3], [title + 8, 1]]),
  };

  const eyesOpen = ease(f, [wake, wake + 14], [0, 1]);
  const headUp = ease(f, [wake - 4, wake + 30], [0, 1]);
  const winkAmt = blinkAt(f, wink, 12);
  const page = ease(f, [wink + 14, title + 12], [0, 1], smooth);

  const room = (
    <svg viewBox="0 0 1080 1920" width="100%" height="100%" overflow="hidden">
      <rect width={1080} height={1920} fill={C.burgundy} />
      <Layer cam={cam} depth={0.86}>
        <Wall x={-400} y={-200} w={1900} h={1520} railY={1080} tint="morning" />
        <Window cx={PARLOUR.window.cx} top={PARLOUR.window.top} w={PARLOUR.window.w} h={PARLOUR.window.h} f={f} time="morning" breeze={0.5} />
      </Layer>
      <Layer cam={cam} depth={0.93}>
        <g transform={`translate(${PARLOUR.fire.x} ${PARLOUR.fire.y})`}>
          <Fireplace f={f} lit={0} />
        </g>
        <g transform={`translate(${PARLOUR.fire.x} ${PARLOUR.fire.y - 490})`}>
          <MantelClock f={f} minutes={60 + 7 * 60 + 40 + f / 30} scale={0.9} />
        </g>
      </Layer>
      <Layer cam={cam} depth={1}>
        <Floor y0={1300} y1={2300} vpY={560} rug={PARLOUR.rug} />
        <g transform={`translate(${PARLOUR.tree.x} ${PARLOUR.tree.y})`}>
          <ChristmasTree f={f} lit={false} />
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
            brow={f > wink + 4 ? 1 : 0.2}
            armL={10}
            elbowL={-80}
            armR={10}
            elbowR={-78}
            sway={osc(f, 80) * 0.5}
            breathe={osc(f, eyesOpen < 0.5 ? 100 : 70)}
            hug={
              <g transform="translate(14 -80) scale(0.36)">
                <Nutcracker armL={2} armR={2} winkOnly blink={winkAmt} pupilX={-0.1} pupilY={0.1} />
                {f > wink - 2 && f < wink + 26 && (
                  <g transform={`translate(22 -426) rotate(${f * 6})`} style={{mixBlendMode: 'screen'}}>
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
        <LightRays x={PARLOUR.window.cx} y={PARLOUR.window.top + 160} angle={-28} len={1700} spread={260} opacity={0.9} f={f} />
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
