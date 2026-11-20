import React, {useEffect, useState} from 'react';
import {AbsoluteFill, Audio, Img, continueRender, delayRender, staticFile, useCurrentFrame} from 'remotion';
import {GlobalDefs} from './components/Defs';
import {C} from './styles/palette';
import {loadStoryFonts} from './styles/fonts';
import T from './timeline.json';
import {Scene01ChristmasEve} from './scenes/Scene01ChristmasEve';
import {Scene02Awakening} from './scenes/Scene02Awakening';
import {Scene03EnchantedToys} from './scenes/Scene03EnchantedToys';
import {Scene04SugarPlumKingdom} from './scenes/Scene04SugarPlumKingdom';
import {Scene05LastMagic} from './scenes/Scene05LastMagic';
import {GoldenFlash, SnowSwirl, TheatreCurtain} from './components/Transitions';
import {ease} from './animations/easing';

const [S1, S2, S3, S4, S5] = T.scenes;

/** Render `children` only while the absolute frame is inside [a, b). */
const Window: React.FC<{frame: number; a: number; b: number; opacity?: number; children: React.ReactNode}> = ({frame, a, b, opacity = 1, children}) =>
  frame >= a && frame < b && opacity > 0.001 ? (
    // static-noise displacement gives every ink line a slightly hand-drawn wobble
    <AbsoluteFill style={{opacity, filter: 'url(#wobble)'}}>{children}</AbsoluteFill>
  ) : null;

export const NutcrackerDream: React.FC = () => {
  const frame = useCurrentFrame();
  const [handle] = useState(() => delayRender('fonts'));
  useEffect(() => {
    loadStoryFonts().then(() => continueRender(handle));
  }, [handle]);

  // Cross-dissolves between scenes (each transition is also dressed by an overlay below).
  const s2In = ease(frame, [S2.start - 10, S2.start + 8], [0, 1]);
  const s3In = ease(frame, [S3.start - 2, S3.start + 4], [0, 1]);
  const s5In = ease(frame, [S5.start - 16, S5.start + 10], [0, 1]);

  return (
    <AbsoluteFill style={{backgroundColor: C.paper}}>
      <GlobalDefs />
      <Window frame={frame} a={0} b={S1.end + 10}>
        <Scene01ChristmasEve f={frame - S1.start} />
      </Window>
      <Window frame={frame} a={S2.start - 10} b={S2.end + 4} opacity={s2In}>
        <Scene02Awakening f={frame - S2.start} />
      </Window>
      <Window frame={frame} a={S3.start - 2} b={S3.end + 1} opacity={s3In}>
        <Scene03EnchantedToys f={frame - S3.start} />
      </Window>
      <Window frame={frame} a={S4.start} b={S4.end + 12}>
        <Scene04SugarPlumKingdom f={frame - S4.start} />
      </Window>
      <Window frame={frame} a={S5.start - 16} b={S5.end} opacity={s5In}>
        <Scene05LastMagic f={frame - S5.start} />
      </Window>

      {/* scene transitions */}
      <GoldenFlash frame={frame} at={S3.start} />
      <TheatreCurtain frame={frame} at={S4.start} />
      <SnowSwirl frame={frame} at={S5.start} />

      {/* storybook finish: paper grain, pigment blooms, soft vignette */}
      <AbsoluteFill style={{mixBlendMode: 'multiply', opacity: 0.62, pointerEvents: 'none'}}>
        <Img src={staticFile('textures/paper.png')} style={{width: '100%', height: '100%'}} />
      </AbsoluteFill>
      <AbsoluteFill style={{mixBlendMode: 'soft-light', opacity: 0.32, pointerEvents: 'none'}}>
        <Img src={staticFile('textures/wash.png')} style={{width: '100%', height: '100%'}} />
      </AbsoluteFill>
      <AbsoluteFill
        style={{
          pointerEvents: 'none',
          background: 'radial-gradient(ellipse 80% 70% at 50% 48%, rgba(0,0,0,0) 62%, rgba(60,36,24,0.32) 100%)',
        }}
      />
      {/* opening: the picture blooms out of the blank page */}
      <AbsoluteFill style={{backgroundColor: C.paper, opacity: ease(frame, [0, 16], [1, 0]), pointerEvents: 'none'}} />

      <Audio src={staticFile('audio/score.wav')} />
    </AbsoluteFill>
  );
};
