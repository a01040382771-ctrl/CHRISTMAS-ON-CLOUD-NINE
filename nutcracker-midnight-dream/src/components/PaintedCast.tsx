import React from 'react';
import {staticFile} from 'remotion';
import {C} from '../styles/palette';
import type {ClaraPose} from './Clara';
import type {NutPose} from './Nutcracker';

/**
 * The cast as hand-painted gouache paper puppets.
 *
 * Each character was painted once as a parts sheet (src/assets/gouache/sheets)
 * and cut into pieces by scripts/build-cast.py. Here the pieces are hinged at
 * their joints, so the characters keep exactly the props (and the animation)
 * of the original vector rigs in Clara.tsx / Nutcracker.tsx / Toys.tsx.
 *
 * All coordinates below are in the pixels of each cut-out PNG.
 */
type Part = {src: string; w: number; h: number};
const P = (name: string, w: number, h: number): Part => ({src: `gouache/cast/${name}.png`, w, h});

const Img: React.FC<{p: Part; x?: number; y?: number; opacity?: number}> = ({p, x = 0, y = 0, opacity}) =>
  opacity === 0 ? null : <image href={staticFile(p.src)} x={x} y={y} width={p.w} height={p.h} opacity={opacity} />;

/** Hinge: place `child` so its pivot (px,py) sits at (x,y), rotated by `deg`. */
const Hinge: React.FC<{x: number; y: number; px: number; py: number; deg: number; s?: number; children: React.ReactNode}> = ({x, y, px, py, deg, s = 1, children}) => (
  <g transform={`translate(${x} ${y}) rotate(${deg}) scale(${s}) translate(${-px} ${-py})`}>{children}</g>
);

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

// ---------------------------------------------------------------- Nutcracker
const NUT = {
  body: P('nut-body', 388, 880),
  ep: P('nut-epaulettes', 388, 880),
  headFront: P('nut-head-front', 284, 508),
  headLeft: P('nut-head-left', 284, 508),
  headWink: P('nut-head-wink', 284, 510),
  uarmL: P('nut-uarm-l', 120, 288),
  uarmR: P('nut-uarm-r', 120, 288),
  farmL: P('nut-farm-l', 112, 196),
  farmR: P('nut-farm-r', 116, 196),
};
const NUT_BASE = {x: 192, y: 875};
const NUT_NECK = {x: 192, y: 58};
const NUT_HEAD_PIVOT = {x: 142, y: 400};
const NUT_SH = {l: {x: 52, y: 128}, r: {x: 336, y: 128}};
const NUT_ARM_S = 0.8;
const NUT_K = 670 / 1270; // match the vector rig's units (≈670 tall)

const NutArm: React.FC<{side: -1 | 1; a: number; e: number}> = ({side, a, e}) => {
  const L = side < 0;
  const up = L ? NUT.uarmL : NUT.uarmR;
  const fa = L ? NUT.farmL : NUT.farmR;
  const peg = L ? {x: 78, y: 24} : {x: 40, y: 24};
  const elbow = L ? {x: 58, y: 268} : {x: 69, y: 268};
  const top = L ? {x: 54, y: 12} : {x: 72, y: 12};
  const sh = L ? NUT_SH.l : NUT_SH.r;
  return (
    <Hinge x={sh.x} y={sh.y} px={peg.x} py={peg.y} deg={-side * a} s={NUT_ARM_S}>
      <Hinge x={elbow.x} y={elbow.y} px={top.x} py={top.y} deg={-side * e}>
        <Img p={fa} />
      </Hinge>
      <Img p={up} />
    </Hinge>
  );
};

export const Nutcracker: React.FC<NutPose> = ({
  pupilX = 0,
  blink = 0,
  winkOnly = false,
  headTilt = 0,
  headLift = 0,
  armL = 4,
  elbowL = 0,
  armR = 4,
  elbowR = 0,
  alive = 0,
}) => {
  const look = clamp01((-pupilX - 0.25) / 0.45);
  const wink = clamp01((blink - 0.15) / 0.5) * (winkOnly || blink > 0 ? 1 : 0);
  return (
    <g transform={`scale(${NUT_K}) translate(${-NUT_BASE.x} ${-NUT_BASE.y})`}>
      {alive > 0 && <ellipse cx={NUT_BASE.x} cy={NUT_BASE.y - 640} rx={520} ry={700} fill="url(#g-magic)" opacity={alive * 0.55} />}
      <NutArm side={-1} a={armL} e={elbowL} />
      <Img p={NUT.body} />
      <NutArm side={1} a={armR} e={elbowR} />
      <Img p={NUT.ep} />
      <Hinge x={NUT_NECK.x} y={NUT_NECK.y - headLift / NUT_K} px={NUT_HEAD_PIVOT.x} py={NUT_HEAD_PIVOT.y} deg={headTilt}>
        <Img p={NUT.headFront} opacity={1 - Math.max(look, wink)} />
        {look > 0 && <Img p={NUT.headLeft} opacity={look * (1 - wink)} />}
        {wink > 0 && <Img p={NUT.headWink} opacity={wink} />}
        {alive > 0.05 && (
          <g style={{mixBlendMode: 'screen'}} opacity={alive * (0.6 + 0.4 * Math.sin(alive * 20))}>
            <circle cx={108} cy={300} r={9} fill="#FFF6DA" />
            <circle cx={176} cy={300} r={9} fill="#FFF6DA" opacity={1 - wink} />
          </g>
        )}
      </Hinge>
    </g>
  );
};

// ---------------------------------------------------------------- Clara
const CL = {
  stand: {p: P('clara-body-stand', 320, 878), neck: {x: 161, y: 18}, l: {x: 68, y: 46}, r: {x: 254, y: 46}, base: {x: 161, y: 871}},
  kneel: {p: P('clara-body-kneel', 564, 582), neck: {x: 286, y: 15}, l: {x: 196, y: 36}, r: {x: 376, y: 36}, base: {x: 281, y: 573}},
  sit: {p: P('clara-body-sit', 532, 502), neck: {x: 263, y: 12}, l: {x: 168, y: 34}, r: {x: 360, y: 34}, base: {x: 263, y: 493}},
};
const CL_HEAD = {
  open: P('clara-head-open', 400, 398),
  sleep: P('clara-head-sleep', 400, 398),
  wonder: P('clara-head-wonder', 398, 398),
  ribOpen: P('clara-ribbon-open', 400, 398),
  ribSleep: P('clara-ribbon-sleep', 400, 398),
  ribWonder: P('clara-ribbon-wonder', 398, 398),
};
const CL_CHIN = {x: 201, y: 342};
const CL_KNOT = {x: 336, y: 96};
const CL_HEAD_S = 0.74;
const CL_ARM_S = 0.56;
const CL_K = 600 / 1120;

const ClaraArm: React.FC<{side: -1 | 1; a: number; e: number; at: {x: number; y: number}}> = ({side, a, e, at}) => {
  const L = side < 0;
  const up = L ? P('clara-uarm-l', 212, 286) : P('clara-uarm-r', 216, 292);
  const fa = L ? P('clara-farm-l', 198, 432) : P('clara-farm-r', 204, 430);
  const sh = L ? {x: 106, y: 18} : {x: 106, y: 20};
  const elbow = L ? {x: 106, y: 262} : {x: 108, y: 266};
  const top = L ? {x: 45, y: 24} : {x: 157, y: 24};
  return (
    <Hinge x={at.x} y={at.y} px={sh.x} py={sh.y} deg={-side * a} s={CL_ARM_S}>
      <Hinge x={elbow.x} y={elbow.y} px={top.x} py={top.y} deg={-side * e}>
        <Img p={fa} />
      </Hinge>
      <Img p={up} />
    </Hinge>
  );
};

export const Clara: React.FC<ClaraPose> = (p) => {
  const body = CL[p.pose ?? 'stand'];
  const closed = p.asleep || (p.blink ?? 0) > 0.5;
  const wonder = !closed && (p.mouth === 'o' || (p.brow ?? 0) > 0.6);
  const head = closed ? CL_HEAD.sleep : wonder ? CL_HEAD.wonder : CL_HEAD.open;
  const rib = closed ? CL_HEAD.ribSleep : wonder ? CL_HEAD.ribWonder : CL_HEAD.ribOpen;
  const br = (p.breathe ?? 0) * 3;
  const sway = p.sway ?? 0;
  const headX = (p.gazeX ?? 0) * 4;
  return (
    <g transform={`scale(${CL_K}) translate(${-body.base.x} ${-body.base.y})`}>
      <ClaraArm side={-1} a={p.armL ?? 8} e={p.elbowL ?? 6} at={{x: body.l.x, y: body.l.y + br}} />
      {/* neck */}
      <path d={`M ${body.neck.x - 12} ${body.neck.y + 6} L ${body.neck.x - 10} ${body.neck.y - 30} L ${body.neck.x + 10} ${body.neck.y - 30} L ${body.neck.x + 12} ${body.neck.y + 6} Z`} fill="#D8A88B" />
      <g transform={`translate(0 ${br * 0.5})`}>
        <Img p={body.p} />
      </g>
      {p.hug && <g transform={`scale(${1 / CL_K}) translate(${body.base.x * CL_K} ${body.base.y * CL_K})`}>{p.hug}</g>}
      <Hinge x={body.neck.x + headX} y={body.neck.y - 6 - (p.headY ?? 0) / CL_K + br * 0.3} px={CL_CHIN.x} py={CL_CHIN.y} deg={p.headTilt ?? 0} s={CL_HEAD_S}>
        <Img p={head} />
        <Hinge x={CL_KNOT.x} y={CL_KNOT.y} px={CL_KNOT.x} py={CL_KNOT.y} deg={sway * 5}>
          <Img p={rib} />
        </Hinge>
      </Hinge>
      <ClaraArm side={1} a={p.armR ?? 8} e={p.elbowR ?? 6} at={{x: body.r.x, y: body.r.y + br}} />
    </g>
  );
};

// ---------------------------------------------------------------- toy soldier
const SOLDIER = {
  rifle: {p: P('soldier-rifle', 398, 882), hips: [152, 262], hipY: 812},
  drum: {p: P('soldier-drum', 444, 948), hips: [166, 274], hipY: 812},
  leg: P('soldier-leg', 128, 516),
};
const LEG_TOP = {x: 62, y: 10};
const SOLDIER_K = 300 / 1330;

export const ToySoldier: React.FC<{step: number; drum?: boolean; marching?: boolean}> = ({step, drum = false, marching = true}) => {
  const b = drum ? SOLDIER.drum : SOLDIER.rifle;
  const ph = step * Math.PI;
  const swing = marching ? Math.sin(ph) * 16 : 0;
  const bob = marching ? -Math.abs(Math.cos(ph)) * 22 : 0;
  const midX = (b.hips[0] + b.hips[1]) / 2;
  const footY = b.hipY + 506;
  return (
    <g transform={`scale(${SOLDIER_K}) translate(${-midX} ${-footY + bob})`}>
      <Hinge x={b.hips[0]} y={b.hipY} px={LEG_TOP.x} py={LEG_TOP.y} deg={swing}>
        <Img p={SOLDIER.leg} />
      </Hinge>
      <Hinge x={b.hips[1]} y={b.hipY} px={LEG_TOP.x} py={LEG_TOP.y} deg={-swing}>
        <Img p={SOLDIER.leg} />
      </Hinge>
      <g transform={drum ? `translate(0 ${-Math.max(0, Math.sin(ph * 2)) * 8})` : undefined}>
        <Img p={b.p} />
      </g>
    </g>
  );
};

// ---------------------------------------------------------------- ballerina
const BAL = [
  {p: P('ballerina-0', 376, 912), toe: 189},
  {p: P('ballerina-1', 356, 912), toe: 166},
  {p: P('ballerina-2', 374, 912), toe: 187},
  {p: P('ballerina-3', 362, 912), toe: 176},
];
const BAL_TOE_Y = 905;
const BAL_K = 420 / 905;

/** Pirouette from the painted 4-view turnaround. `ph` = turn angle (rad). */
export const Ballerina: React.FC<{ph: number; tutu?: string; tutuDeep?: string; hairColor?: string}> = ({ph}) => {
  const turns = ((ph / (Math.PI * 2)) % 1 + 1) % 1;
  const q = turns * 4;
  const i = Math.floor(q);
  const frac = q - i;
  const mix = clamp01((frac - 0.55) / 0.35); // hold each view, then turn quickly into the next
  const a = BAL[i];
  const b = BAL[(i + 1) % 4];
  const squeeze = 1 - Math.sin(mix * Math.PI) * 0.12;
  return (
    <g transform={`scale(${BAL_K * squeeze} ${BAL_K})`}>
      <ellipse cx={0} cy={0} rx={150} ry={26} fill="rgba(120,60,80,0.22)" />
      <Img p={a.p} x={-a.toe} y={-BAL_TOE_Y} opacity={1 - mix} />
      {mix > 0 && <Img p={b.p} x={-b.toe} y={-BAL_TOE_Y} opacity={mix} />}
    </g>
  );
};
