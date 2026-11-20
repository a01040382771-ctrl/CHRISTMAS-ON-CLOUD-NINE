import React from 'react';
import {C} from '../styles/palette';
import {hair, ink} from './Defs';

/**
 * THE NUTCRACKER — traditional wooden soldier.
 * Red coat + gold frogging, dark navy shako, big eyes, white whiskers.
 * Every limb is a separate wooden piece rotating on a visible peg joint.
 * Origin = centre of the wooden base; ~670 units tall.
 */
export type NutPose = {
  pupilX?: number; // -1..1
  pupilY?: number;
  blink?: number; // 0..1 (painted lids)
  winkOnly?: boolean; // close only the near (right) eye
  headTilt?: number; // deg about neck peg
  headLift?: number; // px
  armL?: number; // shoulder angle (+ = outward/up)
  elbowL?: number;
  armR?: number;
  elbowR?: number;
  jaw?: number; // 0..1
  alive?: number; // 0..1 adds warm glow & eye glints
  plumeSway?: number;
  base?: boolean;
};

const NutArm: React.FC<{side: -1 | 1; a: number; e: number}> = ({side, a, e}) => (
  <g transform={`rotate(${-side * a})`}>
    <path d="M -15 -4 C -16 -14 16 -14 15 -4 L 14 70 L -14 70 Z" fill="url(#g-coat)" {...ink(2.4)} />
    <path d={`M ${-side * 7} 4 L ${-side * 6} 62`} {...hair(3, 'rgba(255,220,210,0.35)')} />
    <g transform={`translate(0 68) rotate(${-side * e})`}>
      <path d="M -13 -4 L -12 56 L 12 56 L 13 -4 Z" fill="url(#g-coat)" {...ink(2.3)} />
      <rect x={-15} y={50} width={30} height={13} rx={3} fill="url(#g-gold)" {...ink(2)} />
      <path d="M -12 62 C -16 78 -12 94 0 96 C 12 94 16 78 12 62 Z" fill={C.white} {...ink(2.2)} />
      <path d={`M ${side * 10} 70 C ${side * 19} 74 ${side * 18} 84 ${side * 10} 86`} fill={C.white} {...ink(1.8)} />
      <path d="M -6 80 L 6 80 M -6 87 L 5 87" {...hair(1, C.inkFaint)} />
      {/* elbow peg */}
      <circle cx={0} cy={0} r={7.5} fill="url(#g-wood)" {...ink(1.8)} />
      <circle cx={0} cy={0} r={2.2} fill={C.woodDeep} />
    </g>
    {/* shoulder peg */}
    <circle cx={0} cy={0} r={10} fill="url(#g-wood)" {...ink(2)} />
    <circle cx={0} cy={0} r={3} fill={C.woodDeep} />
  </g>
);

const NutEye: React.FC<{x: number; px: number; py: number; blink: number; glint: number}> = ({x, px, py, blink, glint}) => (
  <g transform={`translate(${x} -88)`}>
    <ellipse rx={16} ry={12.5} fill={C.white} {...ink(2.2)} />
    <circle cx={px * 6} cy={py * 4 + 1} r={7.2} fill="#1F1A1A" />
    <circle cx={px * 6 + 2.6} cy={py * 4 - 2} r={2.3 + glint * 0.8} fill="#FFFFFF" opacity={0.6 + glint * 0.4} />
    {blink > 0.02 && (
      <g>
        <path
          d={`M -16.5 -1 A 16.5 13 0 0 1 16.5 -1 L 16.5 ${-13 + blink * 26} L -16.5 ${-13 + blink * 26} Z`}
          fill="#E8BE9C"
          transform="translate(0 0)"
          clipPath="url(#nc-eye-clip)"
        />
        <path d={`M -15 ${-12 + blink * 24} Q 0 ${-8 + blink * 26} 15 ${-12 + blink * 24}`} fill="none" {...ink(2.2)} />
      </g>
    )}
    <path d="M -18 -2 Q 0 -20 18 -2" fill="none" {...ink(2.6)} />
  </g>
);

const NutcrackerRig: React.FC<NutPose> = ({
  pupilX = 0,
  pupilY = 0,
  blink = 0,
  winkOnly = false,
  headTilt = 0,
  headLift = 0,
  armL = 4,
  elbowL = 0,
  armR = 4,
  elbowR = 0,
  jaw = 0,
  alive = 0,
  plumeSway = 0,
  base = true,
}) => {
  const jy = jaw * 13;
  return (
    <g>
      <defs>
        <clipPath id="nc-eye-clip">
          <ellipse rx={16} ry={12.5} />
        </clipPath>
      </defs>
      {alive > 0 && <ellipse cx={0} cy={-330} rx={260} ry={360} fill="url(#g-magic)" opacity={alive * 0.55} />}
      {/* base */}
      {base && (
        <g>
          <path d="M -78 -24 L 78 -24 L 84 -2 Q 0 8 -84 -2 Z" fill="url(#g-wood)" {...ink(2.4)} />
          <ellipse cx={0} cy={-24} rx={78} ry={11} fill={C.woodLight} {...ink(2.2)} />
          <path d="M -60 -10 Q -20 -6 20 -10 M -30 -4 Q 10 0 50 -6" {...hair(1, C.woodDeep)} />
        </g>
      )}
      {/* legs: white breeches + black boots with gold tops */}
      {[-1, 1].map((s) => (
        <g key={s} transform={`translate(${s * 25} 0)`}>
          <path d="M -21 -186 C -24 -160 -22 -130 -19 -108 L 19 -108 C 22 -130 24 -160 21 -186 Z" fill="url(#g-white)" {...ink(2.3)} />
          <path d="M -20 -112 L -21 -30 C -22 -22 -14 -20 0 -20 L 22 -20 C 30 -20 30 -30 22 -32 L 20 -112 Z" fill="url(#g-boot)" {...ink(2.3)} />
          <rect x={-23} y={-118} width={46} height={12} rx={3} fill="url(#g-gold)" {...ink(1.8)} />
          <path d="M -12 -96 L -13 -44" {...hair(2.4, 'rgba(255,255,255,0.18)')} />
        </g>
      ))}
      {/* far arm */}
      <g transform="translate(-66 -316)">
        <NutArm side={-1} a={armL} e={elbowL} />
      </g>
      {/* coat */}
      <path d="M -58 -334 C -68 -300 -68 -232 -62 -194 L -78 -150 Q 0 -138 78 -150 L 62 -194 C 68 -232 68 -300 58 -334 Q 0 -346 -58 -334 Z" fill="url(#g-coat)" {...ink(2.6)} />
      <path d="M 0 -186 L 0 -144" {...ink(2)} />
      {[-306, -282, -258, -234].map((y) => (
        <g key={y}>
          <path d={`M -38 ${y} Q -19 ${y - 5} 0 ${y} Q 19 ${y - 5} 38 ${y}`} fill="none" {...ink(4.2, C.goldDeep)} />
          <path d={`M -38 ${y} Q -19 ${y - 5} 0 ${y} Q 19 ${y - 5} 38 ${y}`} fill="none" {...ink(2.4, C.goldLight)} />
          <circle cx={-40} cy={y} r={4} fill="none" {...ink(2, C.gold)} />
          <circle cx={40} cy={y} r={4} fill="none" {...ink(2, C.gold)} />
          <circle cx={-12} cy={y - 2} r={4.2} fill="url(#g-ball-gold)" {...ink(1.2)} />
          <circle cx={12} cy={y - 2} r={4.2} fill="url(#g-ball-gold)" {...ink(1.2)} />
        </g>
      ))}
      {/* belt */}
      <path d="M -64 -206 Q 0 -196 64 -206 L 64 -188 Q 0 -178 -64 -188 Z" fill={C.navyDeep} {...ink(2)} />
      <rect x={-13} y={-207} width={26} height={22} rx={3} fill="url(#g-gold)" {...ink(1.8)} />
      <rect x={-6} y={-201} width={12} height={10} fill="none" {...ink(1.4, C.goldDeep)} />
      {/* epaulettes */}
      {[-1, 1].map((s) => (
        <g key={s} transform={`translate(${s * 56} -334)`}>
          <path d="M -24 0 Q 0 -16 24 0 Q 0 10 -24 0 Z" fill="url(#g-gold)" {...ink(2)} />
          <path d="M -20 3 L -21 18 M -12 6 L -12 22 M -4 7 L -4 23 M 4 7 L 4 23 M 12 6 L 12 22 M 20 3 L 21 18" {...ink(2.6, C.gold)} />
        </g>
      ))}
      {/* high gold collar sits over the neck */}
      <path d="M -30 -346 Q 0 -352 30 -346 L 32 -332 Q 0 -324 -32 -332 Z" fill="url(#g-gold)" {...ink(1.8)} />
      {/* head (rotates on the neck peg) */}
      <g transform={`translate(0 ${-338 - headLift}) rotate(${headTilt})`}>
        <rect x={-18} y={-14} width={36} height={18} fill={C.woodDeep} {...ink(1.8)} />
        {/* white side hair */}
        <path d="M -50 -110 C -68 -100 -64 -84 -58 -76 C -70 -68 -64 -50 -54 -46 C -62 -36 -56 -22 -46 -24 L -44 -110 Z" fill={C.white} {...ink(2)} />
        <path d="M 50 -110 C 68 -100 64 -84 58 -76 C 70 -68 64 -50 54 -46 C 62 -36 56 -22 46 -24 L 44 -110 Z" fill={C.white} {...ink(2)} />
        {/* face block */}
        <path d="M -48 -132 L 48 -132 C 54 -100 54 -56 50 -28 Q 0 -18 -50 -28 C -54 -56 -54 -100 -48 -132 Z" fill="url(#g-woodface)" {...ink(2.6)} />
        <ellipse cx={-31} cy={-62} rx={12} ry={8.5} fill="url(#g-cheek)" />
        <ellipse cx={31} cy={-62} rx={12} ry={8.5} fill="url(#g-cheek)" />
        {/* brows */}
        <path d="M -40 -105 Q -26 -120 -9 -112" fill="none" {...ink(4.6, '#2A2220')} />
        <path d="M 9 -112 Q 26 -120 40 -105" fill="none" {...ink(4.6, '#2A2220')} />
        <NutEye x={-22} px={pupilX} py={pupilY} blink={winkOnly ? 0 : blink} glint={alive} />
        <NutEye x={22} px={pupilX} py={pupilY} blink={blink} glint={alive} />
        {/* nose */}
        <ellipse cx={0} cy={-68} rx={10} ry={12} fill="#E3A38E" {...ink(2.2)} />
        <ellipse cx={-3} cy={-72} rx={3} ry={3.5} fill="#F6D5C4" />
        {/* mouth gap */}
        <rect x={-26} y={-49} width={52} height={7 + jy} rx={2} fill="#3B1E1A" {...ink(1.8)} />
        <path d="M -24 -48 L 24 -48 L 24 -44 L -24 -44 Z" fill={C.white} />
        <path d="M -16 -48 L -16 -44 M -8 -48 L -8 -44 M 0 -48 L 0 -44 M 8 -48 L 8 -44 M 16 -48 L 16 -44" {...hair(0.9, C.inkSoft)} />
        {/* lower jaw + beard (lever-operated) */}
        <g transform={`translate(0 ${jy})`}>
          <path d="M -44 -42 C -50 -10 -30 22 0 30 C 30 22 50 -10 44 -42 Q 0 -34 -44 -42 Z" fill={C.white} {...ink(2.4)} />
          <path d="M -30 -30 q 6 8 0 16 M -16 -26 q 6 10 0 22 M 0 -26 q 6 12 0 26 M 16 -26 q 6 10 0 22 M 30 -30 q 6 8 0 16" {...hair(1.2, C.inkFaint)} />
          <path d="M -24 -42 L 24 -42 L 24 -38 L -24 -38 Z" fill={C.white} {...ink(1.2)} />
        </g>
        {/* moustache */}
        <path d="M -2 -56 C -18 -64 -42 -62 -54 -48 C -46 -50 -40 -46 -38 -42 C -28 -50 -14 -48 -2 -50 Z" fill={C.white} {...ink(2.2)} />
        <path d="M 2 -56 C 18 -64 42 -62 54 -48 C 46 -50 40 -46 38 -42 C 28 -50 14 -48 2 -50 Z" fill={C.white} {...ink(2.2)} />
        <path d="M -40 -54 q 8 -3 16 0 M 24 -54 q 8 -3 16 0" {...hair(1, C.inkFaint)} />
        {/* shako */}
        <path d="M -50 -128 L -56 -250 Q 0 -262 56 -250 L 50 -128 Z" fill="url(#g-navy)" {...ink(2.6)} />
        <ellipse cx={0} cy={-251} rx={56} ry={10} fill={C.navyDeep} {...ink(2.2)} />
        <path d="M -55 -246 Q 0 -256 55 -246 L 55 -234 Q 0 -244 -55 -234 Z" fill="url(#g-gold)" {...ink(1.8)} />
        <path d="M -51 -148 Q 0 -156 51 -148 L 50 -130 Q 0 -138 -50 -130 Z" fill="url(#g-gold)" {...ink(1.8)} />
        <path d="M -54 -130 Q 0 -138 54 -130 L 56 -122 Q 0 -104 -56 -122 Z" fill="#1C1A20" {...ink(2.2)} />
        <path d="M -36 -126 Q 0 -114 36 -126" {...hair(1.6, 'rgba(255,255,255,0.25)')} />
        {/* sunburst crest */}
        <g transform="translate(0 -196)">
          {Array.from({length: 12}, (_, i) => (
            <path key={i} d="M 0 -6 L 3 -22 L 0 -26 L -3 -22 Z" fill={C.gold} {...ink(1, C.goldDeep)} transform={`rotate(${i * 30})`} />
          ))}
          <circle r={10} fill="url(#g-ball-gold)" {...ink(1.8)} />
          <circle r={4} fill={C.burgundy} />
        </g>
        <path d="M -36 -232 L -38 -150 M 34 -232 L 36 -150" {...hair(2.5, 'rgba(255,255,255,0.12)')} />
        {/* plume */}
        <g transform={`translate(0 -258) rotate(${plumeSway * 4})`}>
          <path d="M -4 0 C -22 -20 -20 -54 -6 -78 C -2 -60 4 -54 12 -50 C 6 -40 18 -28 10 -14 C 8 -8 4 -4 4 0 Z" fill={C.burgundyLight} {...ink(2)} />
          <path d="M -2 -4 C -10 -24 -8 -50 -4 -70 M 2 -10 C 8 -24 10 -36 8 -46" {...hair(1.2, C.ivory)} />
          <rect x={-7} y={-6} width={14} height={10} rx={2} fill="url(#g-gold)" {...ink(1.6)} />
        </g>
      </g>
      {/* near arm */}
      <g transform="translate(66 -316)">
        <NutArm side={1} a={armR} e={elbowR} />
      </g>
    </g>
  );
};

/** Painted in gouache (see #gouache in Defs). */
export const Nutcracker: React.FC<NutPose> = (p) => (
  <g filter="url(#gouache)">
    <NutcrackerRig {...p} />
  </g>
);
