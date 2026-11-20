import React from 'react';
import {C} from '../styles/palette';
import {hair, ink} from './Defs';

/**
 * CLARA — one model sheet, every scene.
 * Soft brown hair, red ribbon, ivory nightgown, round gentle face.
 * All poses share the same head and arm parts so the design never drifts.
 */
export type ClaraFace = {
  blink?: number; // 0 open … 1 closed
  gazeX?: number; // -1 … 1
  gazeY?: number;
  mouth?: 'smile' | 'o' | 'sleep' | 'soft';
  brow?: number; // 0 neutral … 1 raised (wonder)
  asleep?: boolean;
};

export type ClaraPose = ClaraFace & {
  pose?: 'stand' | 'kneel' | 'sit';
  headTilt?: number; // deg
  headY?: number; // px lift
  armL?: number; // shoulder angle (deg, + = outward / up)
  elbowL?: number;
  armR?: number;
  elbowR?: number;
  sway?: number; // ribbon / hair breeze phase value -1..1
  breathe?: number; // -1..1
  hug?: React.ReactNode; // rendered between body and front arms (e.g. the nutcracker)
};

const Eye: React.FC<{x: number; blink: number; gx: number; gy: number; asleep?: boolean}> = ({x, blink, gx, gy, asleep}) => {
  const closed = asleep || blink > 0.55;
  if (closed) {
    return (
      <g>
        <path d={`M ${x - 9} 6 Q ${x} 13 ${x + 9} 6`} fill="none" {...ink(2.6)} />
        <path d={`M ${x - 8} 9 l -4 3 M ${x + 8} 9 l 4 3`} {...hair(1.4, C.ink)} />
      </g>
    );
  }
  const sy = 1 - blink * 0.9;
  return (
    <g transform={`translate(${x + gx * 3.2} ${4 + gy * 2.5}) scale(1 ${sy})`}>
      <ellipse cx={0} cy={2} rx={7.2} ry={9.2} fill="#3A2318" />
      <ellipse cx={-0.5} cy={3.5} rx={4.5} ry={5.6} fill="#5B3A26" />
      <circle cx={2.4} cy={-1.8} r={2.6} fill="#FFFDF6" />
      <circle cx={-2.6} cy={5.6} r={1.1} fill="#FFFDF6" opacity={0.8} />
      <path d={`M -10 -4 Q 0 -12 10 -4`} fill="none" {...ink(2.2)} />
      <path d={x < 0 ? `M -9 -5 l -4 -3` : `M 9 -5 l 4 -3`} {...hair(1.6, C.ink)} />
    </g>
  );
};

/** Head drawn around the face centre (0,0). */
export const ClaraHead: React.FC<ClaraFace & {sway?: number}> = ({
  blink = 0,
  gazeX = 0,
  gazeY = 0,
  mouth = 'smile',
  brow = 0,
  asleep,
  sway = 0,
}) => {
  const by = -brow * 4;
  return (
    <g>
      {/* ribbon tails fall behind the hair */}
      <g transform={`translate(52 -64) rotate(${-28 + sway * 3})`}>
        <path d={`M -2 6 C ${-10 + sway * 3} 28 ${-20 + sway * 6} 44 ${-14 + sway * 8} 62 L ${-6 + sway * 8} 54 L ${0 + sway * 7} 64 C ${2 + sway * 5} 44 2 26 4 6 Z`} fill="url(#g-ribbon)" {...ink(2)} />
        <path d={`M 4 6 C ${12 + sway * 3} 24 ${22 + sway * 5} 36 ${20 + sway * 7} 52 L ${28 + sway * 7} 46 L ${32 + sway * 6} 54 C ${30 + sway * 3} 34 18 20 8 4 Z`} fill="url(#g-ribbon)" {...ink(2)} />
      </g>
      {/* back hair */}
      <path
        d="M -56 -18 C -80 -72 -42 -96 2 -94 C 48 -96 84 -66 66 -10 C 74 30 70 70 86 100 C 96 122 78 136 62 124 C 66 142 46 150 38 132 C 34 110 34 84 28 64 L -30 64 C -34 86 -36 112 -42 132 C -52 152 -74 142 -68 124 C -86 134 -100 116 -88 98 C -72 70 -72 30 -56 -18 Z"
        fill="url(#g-hair)"
        {...ink(2.6)}
      />
      <path d="M -70 40 C -76 70 -78 92 -86 104 M 70 40 C 74 70 78 92 84 104 M -52 70 C -54 96 -56 114 -60 126 M 52 70 C 54 96 56 114 58 128" {...hair(1.4, C.hairDeep)} />
      {/* neck */}
      <path d="M -11 48 L -12 74 L 12 74 L 11 48 Z" fill={C.skinShade} {...ink(2)} />
      {/* face */}
      <ellipse cx={0} cy={2} rx={55} ry={58} fill="url(#g-skin)" {...ink(2.6)} />
      {/* cheeks */}
      <ellipse cx={-31} cy={24} rx={14} ry={9.5} fill="url(#g-cheek)" />
      <ellipse cx={31} cy={24} rx={14} ry={9.5} fill="url(#g-cheek)" />
      {/* brows */}
      <path d={`M -31 ${-17 + by} Q -22 ${-25 + by} -12 ${-22 + by}`} {...hair(1.7, C.hairDeep)} />
      <path d={`M 12 ${-22 + by} Q 22 ${-25 + by} 31 ${-17 + by}`} {...hair(1.7, C.hairDeep)} />
      <Eye x={-21} blink={blink} gx={gazeX} gy={gazeY} asleep={asleep} />
      <Eye x={21} blink={blink} gx={gazeX} gy={gazeY} asleep={asleep} />
      {/* nose */}
      <path d="M 1 14 Q 5 20 0 22" {...hair(1.8, C.skinShade)} />
      <path d="M 1 14 Q 5 20 0 22" {...hair(1.1, C.inkSoft)} />
      {/* mouth */}
      {mouth === 'smile' && <path d="M -10 31 Q 0 39 10 31" fill="none" {...ink(2.2, C.burgundyDeep)} />}
      {mouth === 'soft' && <path d="M -7 32 Q 0 36 7 32" fill="none" {...ink(2.2, C.burgundyDeep)} />}
      {mouth === 'sleep' && <path d="M -5 33 Q 0 35 5 33" fill="none" {...ink(2, C.burgundyDeep)} />}
      {mouth === 'o' && <ellipse cx={0} cy={33} rx={5.5} ry={6.5} fill={C.burgundyDeep} {...ink(1.6, C.ink)} />}
      {/* fringe */}
      <path
        d="M -57 -4 C -64 -60 -30 -82 4 -80 C 42 -80 66 -56 58 -2 C 52 -28 40 -40 22 -44 C 26 -30 14 -20 4 -30 C -2 -40 -12 -44 -22 -40 C -36 -34 -46 -22 -57 -4 Z"
        fill="url(#g-hair)"
        {...ink(2.6)}
      />
      <path d="M -40 -56 C -30 -66 -10 -70 8 -68 M 18 -66 C 34 -62 46 -52 52 -36 M -48 -36 C -40 -46 -30 -50 -22 -52" {...hair(1.3, C.hairLight)} />
      <path d="M -14 -76 C -4 -60 4 -46 4 -32 M 26 -74 C 30 -62 30 -52 24 -44" {...hair(1.2, C.hairDeep)} />
      {/* the red ribbon */}
      <g transform={`translate(46 -64) rotate(${22 + sway * 2})`}>
        <path d="M 0 0 C -22 -26 -50 -16 -44 4 C -40 20 -16 14 0 0 Z" fill="url(#g-ribbon)" {...ink(2.2)} />
        <path d="M 0 0 C 22 -28 52 -18 46 4 C 42 20 16 12 0 0 Z" fill="url(#g-ribbon)" {...ink(2.2)} />
        <path d="M -8 -4 C -20 -12 -32 -10 -36 0 M 8 -4 C 22 -14 34 -10 38 0" {...hair(1.2, C.burgundyDeep)} />
        <ellipse cx={1} cy={1} rx={9} ry={8} fill="#B8454F" {...ink(2)} />
      </g>
    </g>
  );
};

/** One arm: shoulder at origin, hanging along +y. */
const Arm: React.FC<{side: -1 | 1; a: number; e: number}> = ({side, a, e}) => (
  <g transform={`rotate(${-side * a})`}>
    {/* puffed sleeve */}
    <path d="M -22 -8 C -42 12 -38 64 -16 84 L 16 84 C 38 64 42 12 22 -8 Z" fill="url(#g-gown)" {...ink(2.4)} />
    <path d="M -10 -2 C -16 24 -14 56 -8 78 M 8 -2 C 14 24 12 56 6 78" {...hair(1.1)} />
    <g transform={`translate(0 80) rotate(${-side * e})`}>
      <path d="M -14 0 L -12 82 L 12 82 L 14 0 Z" fill="url(#g-gown)" {...ink(2.3)} />
      <path d="M -18 80 Q -12 92 -6 82 Q 0 94 6 82 Q 12 92 18 80 Z" fill={C.white} {...ink(1.8)} />
      <path d="M -11 86 C -16 100 -12 114 0 116 C 12 116 15 102 11 86 Z" fill="url(#g-skin)" {...ink(2.2)} />
      <path d={`M ${side * 10} 92 C ${side * 18} 96 ${side * 16} 104 ${side * 9} 104`} fill="url(#g-skin)" {...ink(1.8)} />
    </g>
  </g>
);

export const Clara: React.FC<ClaraPose> = (p) => {
  const pose = p.pose ?? 'stand';
  const br = (p.breathe ?? 0) * 2;
  const headTilt = p.headTilt ?? 0;
  const headY = p.headY ?? 0;
  const face: ClaraFace = {
    blink: p.blink,
    gazeX: p.gazeX,
    gazeY: p.gazeY,
    mouth: p.mouth,
    brow: p.brow,
    asleep: p.asleep,
  };

  if (pose === 'stand') {
    return (
      <g>
        {/* slippers */}
        <ellipse cx={-42} cy={-12} rx={28} ry={14} fill={C.burgundy} {...ink(2.2)} />
        <ellipse cx={42} cy={-12} rx={28} ry={14} fill={C.burgundy} {...ink(2.2)} />
        {/* far arm */}
        <g transform={`translate(-68 ${-398 + br})`}>
          <Arm side={-1} a={p.armL ?? 8} e={p.elbowL ?? 6} />
        </g>
        {/* gown */}
        <g transform={`translate(0 ${br * 0.5})`}>
          <path
            d="M -40 -430 C -62 -426 -72 -410 -74 -390 L -98 -200 C -122 -120 -150 -72 -162 -40 Q -132 -26 -106 -40 Q -80 -24 -54 -38 Q -27 -22 0 -36 Q 27 -22 54 -38 Q 80 -24 106 -40 Q 132 -26 162 -40 C 150 -72 122 -120 98 -200 L 74 -390 C 72 -410 62 -426 40 -430 Z"
            fill="url(#g-gown)"
            {...ink(2.6)}
          />
          <path d="M -162 -40 Q -146 -20 -132 -30 Q -120 -14 -106 -26 Q -92 -10 -78 -24 Q -64 -8 -52 -22 Q -38 -6 -26 -20 Q -12 -4 0 -20 Q 12 -4 26 -20 Q 38 -6 52 -22 Q 64 -8 78 -24 Q 92 -10 106 -26 Q 120 -14 132 -30 Q 146 -20 162 -40" fill={C.white} {...ink(1.8)} />
          <path d="M -150 -52 Q 0 -30 150 -52" {...hair(1.2)} />
          <path d="M -24 -330 C -36 -240 -58 -150 -78 -60 M 10 -320 C 6 -230 -2 -140 -8 -52 M 40 -330 C 54 -240 76 -150 96 -64 M -60 -250 C -80 -170 -104 -110 -124 -58" {...hair(1.3)} />
          {/* smocked yoke */}
          <path d="M -58 -372 Q 0 -360 58 -372 M -58 -362 q 6 4 12 0 t 12 0 t 12 0 t 12 0 t 12 0 t 12 0 t 12 0 t 12 0 t 12 0 t 12 0" {...hair(1.3)} />
          {/* collar ruffle */}
          <path d="M -44 -432 Q -46 -414 -32 -412 Q -26 -400 -14 -406 Q -6 -396 2 -404 Q 12 -396 18 -406 Q 30 -400 34 -412 Q 48 -414 44 -432 Q 0 -420 -44 -432 Z" fill={C.white} {...ink(2)} />
          {/* collar bow (the second red ribbon) */}
          <g transform="translate(0 -404)">
            <path d="M 0 0 C -12 -10 -24 -4 -20 4 C -16 12 -6 6 0 0 Z M 0 0 C 12 -10 24 -4 20 4 C 16 12 6 6 0 0 Z" fill="url(#g-ribbon)" {...ink(1.6)} />
            <path d="M -2 2 L -8 22 L -2 18 M 2 2 L 8 22 L 3 18" fill="none" {...ink(1.8, C.ribbon)} />
            <circle r={4} fill="#B8454F" {...ink(1.4)} />
          </g>
        </g>
        {p.hug}
        {/* head */}
        <g transform={`translate(0 ${-500 + headY + br * 0.3}) rotate(${headTilt} 0 60)`}>
          <ClaraHead {...face} sway={p.sway} />
        </g>
        {/* near arm */}
        <g transform={`translate(68 ${-398 + br})`}>
          <Arm side={1} a={p.armR ?? 8} e={p.elbowR ?? 6} />
        </g>
      </g>
    );
  }

  // kneel / sit share a pooled skirt and a lower torso
  const sit = pose === 'sit';
  return (
    <g>
      <g transform={`translate(-66 ${-284 + br})`}>
        <Arm side={-1} a={p.armL ?? 10} e={p.elbowL ?? 20} />
      </g>
      {/* skirt pool */}
      <path
        d={
          sit
            ? 'M -70 -250 L -88 -150 C -170 -130 -250 -70 -262 -12 Q -230 4 -200 -6 Q -170 10 -140 -4 Q -110 12 -80 -2 Q -50 12 -20 -2 Q 10 12 40 -2 Q 70 12 100 -2 Q 130 12 160 -4 Q 190 8 220 -8 Q 246 2 268 -14 C 250 -80 170 -130 88 -150 L 70 -250 Z'
            : 'M -66 -270 L -86 -150 C -160 -132 -226 -80 -236 -14 Q -206 2 -178 -8 Q -150 8 -120 -6 Q -90 10 -60 -4 Q -30 10 0 -4 Q 30 10 60 -4 Q 90 10 120 -6 Q 150 8 178 -8 Q 206 2 236 -14 C 226 -80 160 -132 86 -150 L 66 -270 Z'
        }
        fill="url(#g-gown)"
        {...ink(2.6)}
      />
      <path d="M -40 -150 C -90 -110 -150 -70 -190 -20 M 20 -140 C 40 -90 60 -50 80 -10 M -10 -140 C -20 -90 -30 -50 -40 -8 M 60 -150 C 110 -110 160 -70 200 -20" {...hair(1.3)} />
      {/* bodice */}
      <path d="M -40 -312 C -60 -308 -68 -292 -70 -272 L -78 -150 Q 0 -138 78 -150 L 70 -272 C 68 -292 60 -308 40 -312 Z" fill="url(#g-gown)" {...ink(2.5)} />
      <path d="M -56 -258 Q 0 -246 56 -258 M -56 -248 q 6 4 12 0 t 12 0 t 12 0 t 12 0 t 12 0 t 12 0 t 12 0 t 12 0 t 12 0" {...hair(1.3)} />
      <path d="M -44 -314 Q -46 -296 -32 -294 Q -26 -282 -14 -288 Q -6 -278 2 -286 Q 12 -278 18 -288 Q 30 -282 34 -294 Q 48 -296 44 -314 Q 0 -302 -44 -314 Z" fill={C.white} {...ink(2)} />
      <g transform="translate(0 -286)">
        <path d="M 0 0 C -12 -10 -24 -4 -20 4 C -16 12 -6 6 0 0 Z M 0 0 C 12 -10 24 -4 20 4 C 16 12 6 6 0 0 Z" fill="url(#g-ribbon)" {...ink(1.6)} />
        <circle r={4} fill="#B8454F" {...ink(1.4)} />
      </g>
      {p.hug}
      <g transform={`translate(0 ${-382 + headY + br * 0.3}) rotate(${headTilt} 0 60)`}>
        <ClaraHead {...face} sway={p.sway} />
      </g>
      <g transform={`translate(66 ${-284 + br})`}>
        <Arm side={1} a={p.armR ?? 10} e={p.elbowR ?? 20} />
      </g>
    </g>
  );
};
