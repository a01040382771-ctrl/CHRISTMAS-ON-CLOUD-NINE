import { useEffect, useMemo } from "react";
import * as THREE from "three";
import {
  BENCHES, BRIDGE, BUILDINGS, EXPANSION_SLOTS, ISLAND_VISUAL_R, LAMPS, PINES, PLAZA_RADIUS, SMALL_ISLAND,
  SMALL_ISLAND_VISUAL_R, SMALL_TREE, SNOWMEN, STAGE, TREE, FENCE_RADIUS, ZONES, facing,
} from "@sky/shared";
import { useUi } from "../state/store";
import { QUALITY } from "../state/quality";
import { registerInteractable } from "./events";
import { M } from "./world/materials";
import { IslandBody, RimDrifts } from "./world/Island";
import { Sky } from "./world/Sky";
import { Clouds } from "./world/Clouds";
import { Waterfall } from "./world/Waterfall";
import { RoundHouse } from "./buildings/RoundHouse";
import { Cottage } from "./buildings/Cottage";
import { G, LightDriver } from "./buildings/parts";
import { ChristmasTree, PineTree } from "./props/Trees";
import { Bench, Lamp, Presents, Snowman, Stage } from "./props/Furniture";
import { Bridge } from "./props/Bridge";
import { BRIDGE_GAP, RimFence } from "./props/Fence";
import { signTexture } from "./world/textures";
import { Batch } from "./world/Batch";
import { HaloField } from "./world/Halos";
import { LightsField } from "./world/LightsField";

const WATERFALL_YAW = -Math.PI / 4;
const WATERFALL_GAP = { yaw: WATERFALL_YAW, half: 0.13 };

export function World() {
  const quality = useUi((s) => s.quality);
  const q = QUALITY[quality];
  const m = M();
  const g = G();

  // doorstep prompts (Phase 5 hooks)
  useEffect(() => {
    const offs = ZONES.filter((z) => z.id !== "plaza").map((z) =>
      registerInteractable({
        id: z.id,
        x: z.anchor.x,
        z: z.anchor.z,
        radius: z.radius,
        title: `${z.ko} · ${z.name}`,
        hint: z.status === "planned" ? "곧 문을 열어요 (준비 중)" : "곧 입장할 수 있어요 (준비 중)",
      })
    );
    return () => offs.forEach((f) => f());
  }, []);

  const wishSign = useMemo(() => new THREE.MeshStandardMaterial({ map: signTexture("Wish Cottage", "#2f5f55", "#ffe9b0"), roughness: 0.8 }), []);

  return (
    <>
      <fog attach="fog" args={["#dde8ea", 90, 330]} />
      <Sky />

      {/* light: warm low sun + cool sky fill, matching the concept art */}
      <hemisphereLight args={["#cfe3f6", "#f0c9b8", 1.15]} />
      <ambientLight intensity={0.28} color="#ffe9dc" />
      <directionalLight
        position={[-38, 46, 30]}
        intensity={2.5}
        color="#ffd9b4"
        castShadow={q.shadows}
        shadow-mapSize={[q.shadowMapSize, q.shadowMapSize]}
        shadow-camera-left={-30}
        shadow-camera-right={56}
        shadow-camera-top={34}
        shadow-camera-bottom={-34}
        shadow-camera-near={5}
        shadow-camera-far={140}
        shadow-bias={-0.0004}
        shadow-normalBias={0.04}
        target-position={[10, 0, 0]}
      />
      <LightDriver enabled={q.twinkleLights} />

      <Clouds density={q.cloudPuffs} />

      {/* ───────── main island ───────── */}
      <IslandBody radius={ISLAND_VISUAL_R} depth={20} seed={1} />
      <RimDrifts radius={ISLAND_VISUAL_R - 0.4} inner={FENCE_RADIUS + 0.4} count={Math.round(70 * q.cloudPuffs + 20)} gapYaws={[Math.PI / 2, WATERFALL_YAW]} />
      <Batch><RimFence gaps={[BRIDGE_GAP, WATERFALL_GAP]} /></Batch>
      <Waterfall yaw={WATERFALL_YAW} radius={ISLAND_VISUAL_R + 0.4} height={34} />

      <Batch>
      {/* Starlight Plaza: cobbles, gold compass inlay, paths */}
      <><Plaza /></>

      <>
        <ChristmasTree position={[TREE.x, 0, TREE.z]} height={13.5} baseRadius={4.3} tiers={6} trunkHeight={2.1} ornaments={q.cloudPuffs > 0.6 ? 120 : 60} lowDetail={false} fade />
        <Presents position={[TREE.x, 0, TREE.z]} count={16} radius={1.95} />
      </>
      <><Stage /></>

      {/* buildings */}
      <><RoundHouse
        spec={BUILDINGS.invitation}
        radius={3.9}
        wallHeight={3.7}
        wall="plasterPink"
        roof="roofRed"
        roofKind="dome"
        roofHeight={2.5}
        windows={10}
        cupola={{ radius: 1.25, height: 1.9, roof: "cone", roofKey: "roofBurgundy" }}
      /></>
      <><Cottage spec={BUILDINGS.market} wall="plasterCream" roof="roofTeal" sign="Candy Market" /></>
      <><RoundHouse
        spec={BUILDINGS.ballroom}
        radius={3.3}
        wallHeight={3.8}
        wall="plasterRose"
        roof="roofBurgundy"
        roofKind="onion"
        roofHeight={3.4}
        windows={8}
        curtains
        phase={2}
      /></>
      <><RoundHouse
        spec={BUILDINGS.tower}
        radius={2.0}
        wallHeight={7.2}
        floors={3}
        wall="plasterBlue"
        roof="roofSlateBlue"
        roofKind="cone"
        roofHeight={3.6}
        windows={6}
        doorScale={0.9}
        phase={4}
      /></>

      <>
        {BENCHES.map((b, i) => <Bench key={i} position={[b.x, 0, b.z]} rotationY={b.rot} />)}
        {LAMPS.map((l, i) => <Lamp key={i} position={[l.x, 0, l.z]} tall={l.tall} />)}
        {SNOWMEN.map((s, i) => <Snowman key={i} position={[s.x, 0, s.z]} rotationY={facing(s.x, s.z, 0, 4)} hat={i ? "#2f6b48" : "#7d2540"} />)}
        {PINES.map((p, i) => <PineTree key={i} position={[p.x, 0, p.z]} scale={p.s} seed={i} />)}
      </>

      
      </Batch>

      {/* ───────── bridge + small island ───────── */}
      <Batch><Bridge /></Batch>
      <group position={[SMALL_ISLAND.x, 0, SMALL_ISLAND.z]}>
        <IslandBody radius={SMALL_ISLAND_VISUAL_R} depth={9} seed={5} />
        <RimDrifts radius={SMALL_ISLAND_VISUAL_R - 0.3} inner={SMALL_ISLAND.r - 0.7} count={26} seed={8} gapYaws={[-Math.PI / 2]} />
        <Batch><RimFence radius={SMALL_ISLAND.r - 0.35} gaps={[{ yaw: -Math.PI / 2, half: 0.3 }]} /></Batch>
        {/* path disc */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-3.2, 0.03, 0.4]} material={m.cobble}>
          <circleGeometry args={[4.4, 40]} />
        </mesh>
      </group>
      <Batch><Cottage spec={BUILDINGS.cottage} width={5.2} depth={4.6} wallHeight={3.0} wall="plasterMint" roof="roofRed" awning={false} /></Batch>
      <mesh position={[BUILDINGS.cottage.x + Math.sin(BUILDINGS.cottage.rot) * 2.5, 3.1, BUILDINGS.cottage.z + Math.cos(BUILDINGS.cottage.rot) * 2.5]} rotation={[0, BUILDINGS.cottage.rot, 0]} material={wishSign} castShadow>
        <boxGeometry args={[1.9, 0.55, 0.08]} />
      </mesh>
      {/* the wish tree (teaser for Secret Wish Forest) */}
      <Batch><ChristmasTree position={[SMALL_TREE.x, 0, SMALL_TREE.z]} height={6.8} baseRadius={2.2} tiers={4} trunkHeight={1.3} ornaments={36} seed={9} /></Batch>
      {/* ───────── reserved sky-island slots (future districts; decorative for now) ───────── */}
      {EXPANSION_SLOTS.map((s, i) => (
        <Batch key={s.id} position={[s.x, -1.5 - i * 0.6, s.z]}>
          <IslandBody radius={s.r * 1.25} depth={s.r * 1.1} seed={20 + i} />
          <PineTree position={[s.r * 0.25, 0, -s.r * 0.15]} scale={1.3} seed={i} />
          <PineTree position={[-s.r * 0.35, 0, s.r * 0.2]} scale={1.0} seed={i + 3} />
          <RoundHouse
            spec={{ id: s.id, x: -s.r * 0.05, z: s.r * 0.05, rot: Math.atan2(-s.x, -s.z) + i }}
            radius={2.2 + (i % 2) * 0.4}
            wallHeight={2.6}
            wall={i === 0 ? "plasterBlue" : i === 1 ? "plasterPink" : "plasterMint"}
            roof={i === 0 ? "roofTeal" : i === 1 ? "roofBurgundy" : "roofRed"}
            roofKind={i === 1 ? "onion" : "dome"}
            roofHeight={i === 1 ? 2.8 : 1.9}
            windows={6}
            lowDetail
            phase={i}
          />
        </Batch>
      ))}

      <HaloField version={quality === "low" ? 0 : 1} />
      <LightsField version={quality === "low" ? 0 : 1} />
    </>
  );
}

function Plaza() {
  const m = M();
  const g = G();
  const starGeo = useMemo(() => {
    const s = new THREE.Shape();
    const n = 8, ro = 5.6, ri = 3.0;
    for (let i = 0; i < n * 2; i++) {
      const a = (i / (n * 2)) * Math.PI * 2;
      const r = i % 2 ? ri : ro;
      i === 0 ? s.moveTo(Math.cos(a) * r, Math.sin(a) * r) : s.lineTo(Math.cos(a) * r, Math.sin(a) * r);
    }
    s.closePath();
    return new THREE.ShapeGeometry(s);
  }, []);
  const plazaMat = useMemo(() => {
    const t = m.cobble.map!.clone();
    t.repeat.set(6.5, 6.5);
    t.needsUpdate = true;
    return new THREE.MeshStandardMaterial({ map: t, roughness: 0.95 });
  }, [m]);
  const pathMat = useMemo(() => {
    const t = m.cobble.map!.clone();
    t.repeat.set(1.7, 1.0);
    t.needsUpdate = true;
    return new THREE.MeshStandardMaterial({ map: t, roughness: 0.95 });
  }, [m]);
  const R = PLAZA_RADIUS;
  return (
    <group>
      {/* snowy ground under everything on the main island is the island top (y=0); cobbles sit 3cm above */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]} material={plazaMat} receiveShadow>
        <circleGeometry args={[R, 72]} />
      </mesh>
      {/* snow edge ring + inlaid rings */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, 0]} material={m.snow}>
        <ringGeometry args={[R - 0.05, R + 0.45, 72]} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.045, 0]}>
        <ringGeometry args={[R - 1.2, R - 1.0, 72]} />
        <meshStandardMaterial color="#e6c27a" roughness={0.5} metalness={0.3} />
      </mesh>
      {/* gold compass star around the tree */}
      <mesh geometry={starGeo} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.04, 0.5]} receiveShadow>
        <meshStandardMaterial color="#f1dcc0" roughness={0.7} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, 0.5]}>
        <ringGeometry args={[5.9, 6.1, 64]} />
        <meshStandardMaterial color="#e6c27a" roughness={0.45} metalness={0.4} />
      </mesh>
      {/* path to the bridge */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[(R + 21.5) / 2 - 0.4, 0.03, 0]} material={pathMat} receiveShadow>
        <planeGeometry args={[21.5 - R + 0.8, BRIDGE.halfWidth * 2]} />
      </mesh>
      <mesh geometry={g.box} material={m.stone} position={[22.3, 0.0, 0]} scale={[0.5, 0.06, BRIDGE.halfWidth * 2 + 0.3]} />
    </group>
  );
}
