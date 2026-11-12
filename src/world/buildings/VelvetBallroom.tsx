import { useMemo } from "react";
import { RoundedBox } from "@react-three/drei";
import * as THREE from "three";
import { materials, type MaterialName } from "../../design";
import { Halos } from "../common/Halos";
import type { LotDef } from "../layout";
import { BuildingSite } from "./BuildingSite";
import { BoxBody, Dome, Door, GableEnd, GableRoof, gableProfileY, GlowWindow, TowerBody } from "./kit/parts";

/**
 * 03 · Velvet Ballroom — a storybook Christmas hall in pink stucco and ivory stone under scalloped
 * pink tiles and heavy snow.
 *
 * Massing (lot-local, the door faces +z towards Starlight Plaza):
 *   centre   two-storey ivory hall with a timber-framed front gable, the main door and a tall arched window
 *   west     single-storey wing with a columned porch
 *   east     pink stucco wing with its own front gable, flower boxes and a side door
 *   back     round pink turret at the north-east corner, plus two chimneys
 * Each volume has a proper gable wall at every exposed end, so the building reads from all sides.
 * Collision volumes for this massing: world/collision/blockers.ts ("velvet-ballroom").
 */

type V3 = [number, number, number];

// ── volumes ──
const CENTRE = { w: 6.4, d: 7, z: -0.3, h: 6, roofH: 4.4, over: 0.6 };
const WEST = { x: -5.7, w: 5, d: 5.6, z: -0.4, h: 3.2, roofH: 2.2, over: 0.5 };
const EAST = { x: 5.8, w: 5.2, d: 5.6, z: -0.6, h: 4.4, roofH: 3.4, over: 0.5 };
const TURRET = { x: 3.3, z: -3.45, r: 1.15, h: 11 };
const front = (v: { z: number; d: number }) => v.z + v.d / 2;
const back = (v: { z: number; d: number }) => v.z - v.d / 2;
const DOOR_Y = 0.3;

// ── small dressing parts ──

/** Wall lantern on an iron bracket, mounted on a wall facing +z. */
function Lantern({ position, rotationY = 0 }: { position: V3; rotationY?: number }) {
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <mesh position={[0, 0.32, 0.22]} material={materials.trimDeep}><boxGeometry args={[0.06, 0.06, 0.44]} /></mesh>
      <mesh position={[0, 0.12, 0.42]} material={materials.trimDeep}><boxGeometry args={[0.04, 0.4, 0.04]} /></mesh>
      <mesh position={[0, -0.05, 0.42]} material={materials.lampGlow}><boxGeometry args={[0.26, 0.36, 0.26]} /></mesh>
      <mesh position={[0, 0.2, 0.42]} material={materials.trimDeep} castShadow><coneGeometry args={[0.22, 0.18, 4]} /></mesh>
      <mesh position={[0, -0.26, 0.42]} material={materials.trimDeep}><boxGeometry args={[0.3, 0.06, 0.3]} /></mesh>
    </group>
  );
}

/** Red bow with two tails. */
function Bow({ position, size = 1 }: { position: V3; size?: number }) {
  return (
    <group position={position} scale={size}>
      {[-1, 1].map((s) => <mesh key={s} position={[0.09 * s, 0, 0]} scale={[1, 0.7, 0.45]} material={materials.trim}><sphereGeometry args={[0.09, 10, 8]} /></mesh>)}
      <mesh material={materials.trimDeep}><sphereGeometry args={[0.05, 8, 6]} /></mesh>
      {[-1, 1].map((s) => <mesh key={s} position={[0.05 * s, -0.12, 0]} rotation={[0, 0, 0.35 * s]} material={materials.trim}><boxGeometry args={[0.05, 0.2, 0.02]} /></mesh>)}
    </group>
  );
}

/** Evergreen swag hanging between two points (on a wall facing +z), with bows and baubles. */
function Garland({ from, to, sag = 0.3, bows = true }: { from: V3; to: V3; sag?: number; bows?: boolean }) {
  const { geometry, points } = useMemo(() => {
    const pts = Array.from({ length: 13 }, (_, i) => {
      const t = i / 12;
      return new THREE.Vector3(
        from[0] + (to[0] - from[0]) * t,
        from[1] + (to[1] - from[1]) * t - sag * Math.sin(Math.PI * t),
        from[2] + (to[2] - from[2]) * t,
      );
    });
    return { geometry: new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 24, 0.09, 7), points: pts };
  }, [from, to, sag]);
  return (
    <group>
      <mesh geometry={geometry} material={materials.pine} castShadow />
      {points.filter((_, i) => i % 3 === 1).map((p, i) => <mesh key={i} position={[p.x, p.y - 0.08, p.z + 0.06]} material={i % 2 ? materials.gold : materials.trim}><sphereGeometry args={[0.055, 8, 6]} /></mesh>)}
      {bows && <><Bow position={[from[0], from[1], from[2] + 0.08]} /><Bow position={[to[0], to[1], to[2] + 0.08]} /></>}
    </group>
  );
}

/** Window box with evergreen sprigs and red berries, under a window on a wall facing +z. */
function FlowerBox({ position, rotationY = 0, w = 1.1 }: { position: V3; rotationY?: number; w?: number }) {
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <mesh position={[0, 0, 0.16]} material={materials.wood} castShadow><boxGeometry args={[w, 0.22, 0.3]} /></mesh>
      {[-0.32, 0, 0.32].map((x) => <mesh key={x} position={[x * w, 0.17, 0.16]} scale={[1.3, 0.8, 1]} material={materials.pine}><sphereGeometry args={[0.17, 10, 8]} /></mesh>)}
      {[-0.2, 0.15, 0.4].map((x) => <mesh key={x} position={[x * w, 0.24, 0.3]} material={materials.trim}><sphereGeometry args={[0.04, 6, 5]} /></mesh>)}
    </group>
  );
}

/** Small potted fir beside the steps. */
function PottedTree({ position }: { position: V3 }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.22, 0]} material={materials.wood} castShadow><cylinderGeometry args={[0.26, 0.2, 0.44, 14]} /></mesh>
      <mesh position={[0, 0.9, 0]} material={materials.pine} castShadow><coneGeometry args={[0.38, 1.1, 12]} /></mesh>
      <mesh position={[0, 1.35, 0]} material={materials.snow}><coneGeometry args={[0.16, 0.32, 10]} /></mesh>
      <mesh position={[0, 1.55, 0]} material={materials.gold}><sphereGeometry args={[0.05, 8, 6]} /></mesh>
    </group>
  );
}

/** Slim spire with a gold tip; optionally a red ribbon pennant. */
function Spire({ position, height = 1.6, flag = false, material = "trim" }: { position: V3; height?: number; flag?: boolean; material?: MaterialName }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.12, 0]} material={materials.copper} castShadow><cylinderGeometry args={[0.2, 0.24, 0.24, 12]} /></mesh>
      <mesh position={[0, 0.24 + height / 2, 0]} material={materials[material]} castShadow><coneGeometry args={[0.17, height, 12]} /></mesh>
      <mesh position={[0, 0.3 + height, 0]} material={materials.gold}><sphereGeometry args={[0.08, 10, 8]} /></mesh>
      {flag && (
        <group position={[0.02, height * 0.75, 0]}>
          <mesh position={[0.3, 0, 0]} rotation={[0, 0, -0.2]} material={materials.trim} castShadow><boxGeometry args={[0.55, 0.16, 0.02]} /></mesh>
          <mesh position={[0.62, -0.1, 0]} rotation={[0, 0, -0.6]} material={materials.trim}><boxGeometry args={[0.2, 0.12, 0.02]} /></mesh>
        </group>
      )}
    </group>
  );
}

/** Gold weathervane: cross with an arrow. */
function Weathervane({ position }: { position: V3 }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.5, 0]} material={materials.gold}><cylinderGeometry args={[0.035, 0.05, 1, 8]} /></mesh>
      <mesh position={[0, 0.85, 0]} material={materials.gold}><boxGeometry args={[0.7, 0.05, 0.05]} /></mesh>
      <mesh position={[0, 0.85, 0]} material={materials.gold}><boxGeometry args={[0.05, 0.05, 0.7]} /></mesh>
      <mesh position={[0.1, 1.08, 0]} material={materials.gold}><boxGeometry args={[0.8, 0.06, 0.04]} /></mesh>
      <mesh position={[-0.33, 1.08, 0]} rotation={[0, 0, Math.PI / 2]} material={materials.gold}><coneGeometry args={[0.1, 0.18, 4]} /></mesh>
      <mesh position={[0, 1.2, 0]} material={materials.gold}><sphereGeometry args={[0.06, 8, 6]} /></mesh>
    </group>
  );
}

/** Stuccoed chimney with a stone cap, snow and two clay pots. */
function TallChimney({ position, height, wall = "wallIvory" }: { position: V3; height: number; wall?: MaterialName }) {
  return (
    <group position={position}>
      <RoundedBox args={[0.95, height, 0.95]} radius={0.1} smoothness={3} position={[0, height / 2, 0]} material={materials[wall]} castShadow />
      <RoundedBox args={[1.15, 0.24, 1.15]} radius={0.08} smoothness={3} position={[0, height + 0.08, 0]} material={materials.stone} castShadow />
      <mesh position={[0, height + 0.26, 0]} scale={[1, 0.38, 1]} material={materials.snow} castShadow><sphereGeometry args={[0.62, 16, 10]} /></mesh>
      {[-0.22, 0.22].map((x) => <mesh key={x} position={[x, height + 0.48, 0.05]} material={materials.wood} castShadow><cylinderGeometry args={[0.11, 0.13, 0.42, 10]} /></mesh>)}
    </group>
  );
}

/** Copper downpipe from the eaves to the ground. */
const Downpipe = ({ x, z, top }: { x: number; z: number; top: number }) => (
  <mesh position={[x, top / 2, z]} material={materials.copper} castShadow><cylinderGeometry args={[0.06, 0.06, top, 8]} /></mesh>
);

/** Half-timber beam on a wall facing +z. */
const Beam = ({ from, to, z }: { from: [number, number]; to: [number, number]; z: number }) => {
  const dx = to[0] - from[0], dy = to[1] - from[1];
  return (
    <mesh position={[(from[0] + to[0]) / 2, (from[1] + to[1]) / 2, z]} rotation={[0, 0, Math.atan2(dy, dx)]} material={materials.wood} castShadow>
      <boxGeometry args={[Math.hypot(dx, dy) + 0.12, 0.2, 0.16]} />
    </mesh>
  );
};

/** Curved bargeboard following the front edge of a gable roof. */
function Bargeboard({ span, height, overhang, base, z }: { span: number; height: number; overhang: number; base: number; z: number }) {
  const geometry = useMemo(() => {
    const half = span / 2 + overhang * 0.8;
    const pts = Array.from({ length: 21 }, (_, i) => {
      const x = -half + (i / 20) * half * 2;
      return new THREE.Vector3(x, base + gableProfileY(span, height, overhang, x) - 0.12, z);
    });
    return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 40, 0.13, 8);
  }, [span, height, overhang, base, z]);
  return <mesh geometry={geometry} material={materials.wood} castShadow />;
}

export function VelvetBallroom({ lots }: { lots: LotDef[] }) {
  const cf = front(CENTRE), cb = back(CENTRE);
  const ef = front(EAST), eb = back(EAST), ex = EAST.x + EAST.w / 2;
  const wf = front(WEST), wx = WEST.x - WEST.w / 2;
  const gableY = (x: number) => CENTRE.h - 0.1 + gableProfileY(CENTRE.w, CENTRE.roofH, CENTRE.over, x);

  const lanternGlows = useMemo((): V3[] => [[-1.6, 2.55, cf + 0.42], [1.6, 2.55, cf + 0.42], [wx - 0.42, 2.4, WEST.z + 1.5]], [cf, wx]);

  return (
    <BuildingSite lot={lots[0]}>
      {/* ───────────── centre hall ───────────── */}
      <BoxBody size={[CENTRE.w, CENTRE.h, CENTRE.d]} position={[0, 0, CENTRE.z]} wall="wallIvory" />
      <GableRoof width={CENTRE.d} depth={CENTRE.w} height={CENTRE.roofH} position={[0, CENTRE.h - 0.1, CENTRE.z]} rotationY={Math.PI / 2}
        roof="roofShingle" overhang={CENTRE.over} snowFrom={0.3} snowDepth={0.42} snowLip shell={0.32} rakeSnow />
      <GableEnd span={CENTRE.w} height={CENTRE.roofH} overhang={CENTRE.over} position={[0, CENTRE.h - 0.1, cf]} wall="wallIvory" />
      <GableEnd span={CENTRE.w} height={CENTRE.roofH} overhang={CENTRE.over} position={[0, CENTRE.h - 0.1, cb]} rotationY={Math.PI} wall="wallIvory" />

      {/* front: stone quoins, half-timbering, bargeboard and roundel */}
      {[-1, 1].map((s) => [0.5, 1.5, 2.5, 3.5, 4.5].map((y, i) => (
        <mesh key={`${s}${y}`} position={[s * (CENTRE.w / 2 - 0.25 + (i % 2) * 0.08), y, cf + 0.03]} material={materials.stone} castShadow><boxGeometry args={[0.6 + (i % 2) * 0.16, 0.5, 0.14]} /></mesh>
      )))}
      <Beam from={[-CENTRE.w / 2, CENTRE.h - 0.1]} to={[CENTRE.w / 2, CENTRE.h - 0.1]} z={cf + 0.06} />
      <Beam from={[-CENTRE.w / 2 + 0.3, 2.95]} to={[CENTRE.w / 2 - 0.3, 2.95]} z={cf + 0.06} />
      {[-1.5, 1.5].map((x) => <Beam key={x} from={[x, CENTRE.h - 0.1]} to={[x, gableY(x) - 0.2]} z={cf + 0.06} />)}
      {[-1, 1].map((s) => <Beam key={s} from={[s * 1.5, CENTRE.h + 0.3]} to={[s * 2.6, gableY(s * 2.6) - 0.15]} z={cf + 0.06} />)}
      <Bargeboard span={CENTRE.w} height={CENTRE.roofH} overhang={CENTRE.over} base={CENTRE.h - 0.1} z={cf + CENTRE.over - 0.05} />
      <mesh position={[0, CENTRE.h + 2.55, cf + 0.08]} material={materials.wood} castShadow><torusGeometry args={[0.5, 0.1, 10, 28]} /></mesh>
      <mesh position={[0, CENTRE.h + 2.55, cf + 0.06]} material={materials.windowGlow}><circleGeometry args={[0.42, 24]} /></mesh>

      {/* the great arched window and the main door */}
      <GlowWindow position={[0, 3.25, cf]} w={2.3} h={2.3} frame="wood" />
      {/* stone portal stands proud of the plinth; two steps lead up to it */}
      <Door position={[0, DOOR_Y, cf + 0.15]} w={1.8} h={2.85} leaf="wood" />
      <mesh position={[0, 0.08, cf + 1.3]} material={materials.stone} castShadow receiveShadow><boxGeometry args={[3.2, 0.16, 0.6]} /></mesh>
      <Garland from={[-1.25, 3.18, cf + 0.12]} to={[1.25, 3.18, cf + 0.12]} sag={0.22} />
      <Garland from={[-1.3, CENTRE.h - 0.25, cf + 0.18]} to={[1.3, CENTRE.h - 0.25, cf + 0.18]} sag={0.25} />
      <Lantern position={[-1.6, 2.2, cf]} />
      <Lantern position={[1.6, 2.2, cf]} />
      <PottedTree position={[-1.95, 0, cf + 0.85]} />
      <PottedTree position={[1.95, 0, cf + 0.85]} />

      {/* sides above the wings, and the back */}
      <GlowWindow position={[-CENTRE.w / 2, 4.3, CENTRE.z]} rotationY={-Math.PI / 2} w={0.9} h={1.3} />
      <GlowWindow position={[CENTRE.w / 2, 5.0, CENTRE.z + 1.6]} rotationY={Math.PI / 2} w={0.8} h={0.9} />
      {[-1.6, 1.6].map((x) => <GlowWindow key={x} position={[x, 1.3, cb]} rotationY={Math.PI} w={0.95} h={1.6} />)}
      <GlowWindow position={[0, 3.4, cb]} rotationY={Math.PI} w={1.1} h={1.7} />
      <GlowWindow position={[0, CENTRE.h + 1.0, cb]} rotationY={Math.PI} w={0.8} h={1.1} />
      <Downpipe x={-CENTRE.w / 2 - 0.08} z={cb + 0.2} top={CENTRE.h - 0.2} />

      {/* ───────────── west wing with porch ───────────── */}
      <BoxBody size={[WEST.w, WEST.h, WEST.d]} position={[WEST.x, 0, WEST.z]} wall="wallCream" />
      <GableRoof width={WEST.w} depth={WEST.d} height={WEST.roofH} position={[WEST.x, WEST.h - 0.1, WEST.z]}
        roof="roofShingle" overhang={WEST.over} snowFrom={0.3} snowDepth={0.36} snowLip shell={0.3} rakeSnow />
      <GableEnd span={WEST.d} height={WEST.roofH} overhang={WEST.over} position={[wx, WEST.h - 0.1, WEST.z]} rotationY={-Math.PI / 2} wall="wallCream" />
      <GlowWindow position={[wx, WEST.h + 0.45, WEST.z]} rotationY={-Math.PI / 2} w={0.7} h={0.9} />
      <GlowWindow position={[wx, 1.2, WEST.z - 1.2]} rotationY={-Math.PI / 2} w={0.85} h={1.4} />
      <Lantern position={[wx, 2.1, WEST.z + 1.5]} rotationY={-Math.PI / 2} />
      {[-6.9, -4.5].map((x) => <GlowWindow key={x} position={[x, 1.2, wf]} w={0.9} h={1.45} />)}
      {[-6.6, -4.8].map((x) => <GlowWindow key={x} position={[x, 1.2, back(WEST)]} rotationY={Math.PI} w={0.85} h={1.4} />)}
      <TallChimney position={[-6.9, WEST.h + 0.6, WEST.z - 1.3]} height={2.1} wall="wallPink" />
      <Spire position={[wx + 0.15, WEST.h + WEST.roofH - 0.2, WEST.z]} height={1.2} material="gold" />
      {/* porch: deck, columns, rail with garland, lean-to roof under snow */}
      <mesh position={[WEST.x - 0.1, 0.15, wf + 0.85]} material={materials.stone} castShadow receiveShadow><boxGeometry args={[4.8, 0.3, 1.7]} /></mesh>
      {[-7.9, -6.5, -5.1, -3.7].map((x) => (
        <group key={x} position={[x, 0.3, wf + 1.5]}>
          <mesh position={[0, 1.25, 0]} material={materials.trim} castShadow><cylinderGeometry args={[0.12, 0.14, 2.5, 12]} /></mesh>
          <mesh position={[0, 2.55, 0]} material={materials.wood} castShadow><boxGeometry args={[0.36, 0.14, 0.36]} /></mesh>
          <mesh position={[0, 0.06, 0]} material={materials.stone}><boxGeometry args={[0.34, 0.12, 0.34]} /></mesh>
        </group>
      ))}
      {[[-7.9, -6.5], [-5.1, -3.7]].map(([a, b]) => (
        <group key={a}>
          <mesh position={[(a + b) / 2, 1.2, wf + 1.5]} rotation={[0, 0, Math.PI / 2]} material={materials.wood}><cylinderGeometry args={[0.05, 0.05, b - a, 8]} /></mesh>
          <Garland from={[a + 0.15, 1.22, wf + 1.6]} to={[b - 0.15, 1.22, wf + 1.6]} sag={0.2} />
        </group>
      ))}
      <group position={[WEST.x - 0.1, 2.95, wf + 0.95]} rotation={[0.3, 0, 0]}>
        <mesh material={materials.roofShingle} castShadow receiveShadow><boxGeometry args={[5.2, 0.16, 2.1]} /></mesh>
        <RoundedBox args={[5.3, 0.32, 1.95]} radius={0.15} smoothness={3} position={[0, 0.2, -0.05]} material={materials.snow} castShadow />
        <mesh position={[0, 0.12, 1.0]} rotation={[0, 0, Math.PI / 2]} material={materials.snow} castShadow><capsuleGeometry args={[0.2, 5.0, 6, 12]} /></mesh>
      </group>

      {/* ───────────── east wing ───────────── */}
      <BoxBody size={[EAST.w, EAST.h, EAST.d]} position={[EAST.x, 0, EAST.z]} wall="wallPink" />
      <GableRoof width={EAST.d} depth={EAST.w} height={EAST.roofH} position={[EAST.x, EAST.h - 0.1, EAST.z]} rotationY={Math.PI / 2}
        roof="roofShingle" overhang={EAST.over} snowFrom={0.3} snowDepth={0.4} snowLip shell={0.3} rakeSnow />
      <GableEnd span={EAST.w} height={EAST.roofH} overhang={EAST.over} position={[EAST.x, EAST.h - 0.1, ef]} wall="wallPink" />
      <GableEnd span={EAST.w} height={EAST.roofH} overhang={EAST.over} position={[EAST.x, EAST.h - 0.1, eb]} rotationY={Math.PI} wall="wallPink" />
      <Bargeboard span={EAST.w} height={EAST.roofH} overhang={EAST.over} base={EAST.h - 0.1} z={ef + EAST.over - 0.05} />
      {[4.6, 7.0].map((x) => (
        <group key={x}>
          <GlowWindow position={[x, 1.3, ef]} w={0.95} h={1.6} />
          <FlowerBox position={[x, 1.05, ef]} />
          <GlowWindow position={[x, 3.15, ef]} w={0.8} h={1.0} />
        </group>
      ))}
      <GlowWindow position={[EAST.x, EAST.h + 0.6, ef]} w={0.85} h={1.2} />
      <mesh position={[EAST.x, EAST.h + 2.0, ef + 0.08]} material={materials.pine}><torusGeometry args={[0.32, 0.1, 8, 20]} /></mesh>
      <Bow position={[EAST.x, EAST.h + 1.66, ef + 0.18]} size={0.8} />
      <Spire position={[EAST.x, EAST.h + EAST.roofH - 0.1, ef - 0.2]} height={1.4} material="gold" />
      {/* east face: side door, windows, lantern; back face */}
      <Door position={[ex, 0, EAST.z - 1.2]} rotationY={Math.PI / 2} w={1.05} h={2.1} leaf="wood" />
      <GlowWindow position={[ex, 1.3, EAST.z + 1.2]} rotationY={Math.PI / 2} w={0.9} h={1.5} />
      <FlowerBox position={[ex, 1.05, EAST.z + 1.2]} rotationY={Math.PI / 2} />
      <GlowWindow position={[ex, 3.1, EAST.z - 1.2]} rotationY={Math.PI / 2} w={0.8} h={0.9} />
      {[4.6, 7.0].map((x) => <GlowWindow key={x} position={[x, 1.3, eb]} rotationY={Math.PI} w={0.9} h={1.5} />)}
      <GlowWindow position={[EAST.x, EAST.h + 0.6, eb]} rotationY={Math.PI} w={0.8} h={1.1} />
      <Downpipe x={ex + 0.08} z={ef - 0.1} top={EAST.h - 0.2} />
      <Downpipe x={ex + 0.08} z={eb + 0.1} top={EAST.h - 0.2} />
      <Downpipe x={CENTRE.w / 2 + 0.08} z={ef + 0.1} top={EAST.h - 0.2} />

      {/* ───────────── turret, chimney, spires ───────────── */}
      <TowerBody radius={TURRET.r} height={TURRET.h} position={[TURRET.x, 0, TURRET.z]} wall="wallRose" />
      <mesh position={[TURRET.x, TURRET.h - 1.5, TURRET.z]} material={materials.wallIvory} castShadow><cylinderGeometry args={[TURRET.r + 0.08, TURRET.r + 0.08, 0.3, 32]} /></mesh>
      <Dome radius={TURRET.r + 0.2} position={[TURRET.x, TURRET.h, TURRET.z]} roof="wallIvory" squash={1.25} finial={false} />
      <mesh position={[TURRET.x, TURRET.h + (TURRET.r + 0.2) * 1.25 + 0.15, TURRET.z]} material={materials.copper} castShadow><cylinderGeometry args={[0.16, 0.26, 0.4, 12]} /></mesh>
      <Weathervane position={[TURRET.x, TURRET.h + (TURRET.r + 0.2) * 1.25 + 0.3, TURRET.z]} />
      <GlowWindow position={[TURRET.x, 7.3, TURRET.z + TURRET.r - 0.03]} w={0.6} h={1.0} />
      <GlowWindow position={[TURRET.x + TURRET.r - 0.03, 8.4, TURRET.z]} rotationY={Math.PI / 2} w={0.6} h={1.0} />
      <GlowWindow position={[TURRET.x, 8.4, TURRET.z - TURRET.r + 0.03]} rotationY={Math.PI} w={0.6} h={1.0} />
      <TallChimney position={[2.3, CENTRE.h + 0.4, CENTRE.z + 1.5]} height={4.2} />
      <Spire position={[0, CENTRE.h + CENTRE.roofH - 0.1, cf - 0.2]} height={1.8} flag />
      <Spire position={[0, CENTRE.h + CENTRE.roofH - 0.1, cb + 0.3]} height={1.1} material="gold" />

      <Halos positions={lanternGlows} size={2.6} opacity={0.55} />
    </BuildingSite>
  );
}
