import { memo, useMemo, useRef } from "react";
import * as THREE from "three";
import { Html } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { AVATAR_COLORS } from "@sky/shared";
import { Batch } from "../world/Batch";

/**
 * Avatar look. Everything cosmetic lives in this spec so hair, outfits and
 * accessories can later be swapped or unlocked (market items, photo-booth outfits)
 * without touching movement or networking.
 */
export interface AvatarSpec {
  coat: string;
  hat: string;
  scarf: string;
  skin: string;
  boots: string;
}

const SKINS = ["#ffd9c0", "#f6c6a6", "#e9ad8a", "#ffe2cf", "#d79b78", "#fbd0b4"];
const HATS = ["#fff4e6", "#e8c46c", "#fff4e6", "#fff4e6", "#e8c46c", "#fff4e6"];
const SCARVES = ["#2f7d4f", "#c8323c", "#fff4e6", "#c8323c", "#e8c46c", "#8c2f4b"];

export function specForColor(idx: number): AvatarSpec {
  const i = ((idx % AVATAR_COLORS.length) + AVATAR_COLORS.length) % AVATAR_COLORS.length;
  return { coat: AVATAR_COLORS[i], hat: HATS[i], scarf: SCARVES[i], skin: SKINS[i], boots: "#5a3b34" };
}

export interface AvatarAnim {
  moving: boolean;
}

// shared geometry (one set for every avatar)
let geos: ReturnType<typeof mk> | null = null;
function mk() {
  return {
    sphere: new THREE.SphereGeometry(1, 16, 11),
    capsule: new THREE.CapsuleGeometry(1, 1, 6, 14),
    torus: new THREE.TorusGeometry(1, 0.25, 8, 24),
    dome: new THREE.SphereGeometry(1, 24, 14, 0, Math.PI * 2, 0, Math.PI * 0.55),
    smile: new THREE.TorusGeometry(1, 0.1, 6, 14, Math.PI),
    box: new THREE.BoxGeometry(1, 1, 1),
  };
}
const G = () => (geos ??= mk());

const white = new THREE.MeshStandardMaterial({ color: "#fff7ee", roughness: 0.9 });
const dark = new THREE.MeshStandardMaterial({ color: "#2b1d1f", roughness: 0.4 });
const blush = new THREE.MeshBasicMaterial({ color: "#f7a3a8" });
const gold = new THREE.MeshStandardMaterial({ color: "#e8c46c" });
const eyeShine = new THREE.MeshBasicMaterial({ color: "#ffffff" });

/**
 * Cute round avatar (≈1.55 m with hat). Origin at the feet, faces +z.
 * Walk/idle animation is procedural (limb swing, bounce, breathing) driven by `anim.moving`.
 */
export const AvatarModel = memo(function AvatarModel({ spec, anim, name, self = false }: { spec: AvatarSpec; anim: AvatarAnim; name: string; self?: boolean }) {
  const g = G();
  const mats = useMemo(
    () => ({
      coat: new THREE.MeshStandardMaterial({ color: spec.coat, roughness: 0.85 }),
      skin: new THREE.MeshStandardMaterial({ color: spec.skin, roughness: 0.7 }),
      hat: new THREE.MeshStandardMaterial({ color: spec.hat, roughness: 0.9 }),
      scarf: new THREE.MeshStandardMaterial({ color: spec.scarf, roughness: 0.9 }),
      boots: new THREE.MeshStandardMaterial({ color: spec.boots, roughness: 0.8 }),
    }),
    [spec]
  );
  const root = useRef<THREE.Group>(null);
  const body = useRef<THREE.Group>(null);
  const legL = useRef<THREE.Group>(null);
  const legR = useRef<THREE.Group>(null);
  const armL = useRef<THREE.Group>(null);
  const armR = useRef<THREE.Group>(null);
  const pom = useRef<THREE.Mesh>(null);
  const phase = useRef(Math.random() * 6);
  const amp = useRef(0);

  useFrame(({ clock }, dt) => {
    const t = clock.elapsedTime;
    const target = anim.moving ? 1 : 0;
    amp.current += (target - amp.current) * Math.min(1, dt * 12);
    if (anim.moving) phase.current += dt * 10.5;
    const a = amp.current;
    const s = Math.sin(phase.current);
    if (legL.current) legL.current.rotation.x = s * 0.75 * a;
    if (legR.current) legR.current.rotation.x = -s * 0.75 * a;
    if (armL.current) armL.current.rotation.x = -s * 0.7 * a + Math.sin(t * 1.6) * 0.03 * (1 - a);
    if (armR.current) armR.current.rotation.x = s * 0.7 * a - Math.sin(t * 1.6) * 0.03 * (1 - a);
    if (body.current) {
      body.current.position.y = Math.abs(Math.sin(phase.current)) * 0.065 * a + Math.sin(t * 2.0) * 0.008 * (1 - a);
      body.current.rotation.x = 0.09 * a;
      body.current.rotation.z = Math.sin(phase.current) * 0.04 * a;
      const br = 1 + Math.sin(t * 2.0) * 0.012 * (1 - a);
      body.current.scale.set(1, br, 1);
    }
    if (pom.current) pom.current.position.x = Math.sin(t * 2.4 + phase.current) * 0.02 + Math.sin(phase.current) * 0.03 * a;
  });

  return (
    <group ref={root}>
      {/* Each rigid part is baked into ONE vertex-coloured mesh (see Batch): 7 draw calls per avatar instead of ~35. */}
      {[-1, 1].map((s) => (
        <group key={s} ref={s < 0 ? legL : legR} position={[s * 0.14, 0.38, 0]}>
          <Batch vertexColors>
            <mesh geometry={g.capsule} material={mats.coat} position={[0, -0.14, 0]} scale={[0.1, 0.07, 0.1]} castShadow />
            <mesh geometry={g.sphere} material={mats.boots} position={[0, -0.3, 0.04]} scale={[0.125, 0.1, 0.18]} castShadow />
          </Batch>
        </group>
      ))}
      <group ref={body}>
        <Batch vertexColors>
          {/* coat, fur hem, belt, buckle, buttons */}
          <mesh geometry={g.capsule} material={mats.coat} position={[0, 0.72, 0]} scale={[0.31, 0.18, 0.27]} castShadow />
          <mesh geometry={g.torus} material={white} position={[0, 0.5, 0]} rotation={[Math.PI / 2, 0, 0]} scale={[0.3, 0.27, 0.22]} />
          <mesh geometry={g.torus} material={dark} position={[0, 0.7, 0]} rotation={[Math.PI / 2, 0, 0]} scale={[0.3, 0.27, 0.12]} />
          <mesh geometry={g.box} material={gold} position={[0, 0.7, 0.285]} scale={[0.1, 0.08, 0.025]} castShadow />
          {[0.85, 0.6].map((y) => (
            <mesh key={y} geometry={g.sphere} material={white} position={[0, y, 0.27]} scale={0.026} />
          ))}
          {/* scarf */}
          <mesh geometry={g.torus} material={mats.scarf} position={[0, 0.98, 0]} rotation={[Math.PI / 2, 0, 0]} scale={[0.25, 0.23, 0.3]} castShadow />
          <mesh geometry={g.box} material={mats.scarf} position={[0.17, 0.82, 0.2]} rotation={[0, 0, -0.08]} scale={[0.1, 0.3, 0.05]} castShadow />
        </Batch>
        {[-1, 1].map((s) => (
          <group key={s} ref={s < 0 ? armL : armR} position={[s * 0.34, 0.9, 0]} rotation={[0, 0, s * 0.18]}>
            <Batch vertexColors>
              <mesh geometry={g.capsule} material={mats.coat} position={[0, -0.14, 0]} scale={[0.085, 0.09, 0.085]} castShadow />
              <mesh geometry={g.sphere} material={white} position={[0, -0.33, 0]} scale={0.09} castShadow />
            </Batch>
          </group>
        ))}
        {/* head */}
        <group position={[0, 1.2, 0]}>
          <Batch vertexColors>
            <mesh geometry={g.sphere} material={mats.skin} scale={[0.36, 0.33, 0.34]} castShadow />
            {[-1, 1].map((s) => (
              <group key={s}>
                <mesh geometry={g.sphere} material={dark} position={[s * 0.125, 0.02, 0.31]} scale={[0.045, 0.058, 0.03]} />
                <mesh geometry={g.sphere} material={eyeShine} position={[s * 0.125 + 0.012, 0.04, 0.335]} scale={0.014} />
                <mesh geometry={g.sphere} material={blush} position={[s * 0.205, -0.07, 0.262]} rotation={[0, s * 0.62, 0]} scale={[0.065, 0.045, 0.02]} />
              </group>
            ))}
            <mesh geometry={g.smile} material={dark} position={[0, -0.06, 0.33]} rotation={[0, 0, Math.PI]} scale={[0.065, 0.055, 0.04]} />
            {/* beanie with fur cuff */}
            <mesh geometry={g.dome} material={mats.coat} position={[0, 0.07, -0.005]} scale={[0.375, 0.36, 0.37]} castShadow />
            <mesh geometry={g.torus} material={mats.hat} position={[0, 0.12, 0]} rotation={[Math.PI / 2, 0, 0]} scale={[0.355, 0.345, 0.27]} castShadow />
          </Batch>
          <mesh ref={pom} geometry={g.sphere} material={mats.hat} position={[0, 0.4, -0.02]} scale={0.1} castShadow />
        </group>
      </group>
      {/* nickname */}
      <Html position={[0, 1.95, 0]} center zIndexRange={[20, 0]} style={{ pointerEvents: "none" }}>
        <div className={`nametag${self ? " self" : ""}`}>{name}</div>
      </Html>
    </group>
  );
});
