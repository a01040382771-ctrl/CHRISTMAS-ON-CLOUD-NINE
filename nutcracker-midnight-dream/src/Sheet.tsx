import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {GlobalDefs} from './components/Defs';
import {Clara} from './components/Clara';
import {Nutcracker} from './components/Nutcracker';
import {C} from './styles/palette';

/** Model sheet used for design QA (not part of the film). */
export const Sheet: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{background: C.paper}}>
      <GlobalDefs />
      <svg viewBox="0 0 1080 1920" width="100%" height="100%">
        <g transform="translate(290 900)"><Clara armR={30} elbowR={30} gazeX={0.6} sway={Math.sin(f / 10)} /></g>
        <g transform="translate(800 900) scale(1.25)"><Nutcracker armR={50} elbowR={40} pupilX={-0.6} jaw={0.3} /></g>
        <g transform="translate(300 1800)"><Clara pose="kneel" armR={70} elbowR={10} gazeX={1} mouth="o" brow={1} /></g>
        <g transform="translate(800 1800) scale(0.9)"><Clara pose="sit" asleep mouth="sleep" headTilt={-12} hug={<g transform="translate(0 -60) scale(0.45)"><Nutcracker blink={1} winkOnly /></g>} armL={60} elbowL={70} armR={60} elbowR={70} /></g>
      </svg>
    </AbsoluteFill>
  );
};
