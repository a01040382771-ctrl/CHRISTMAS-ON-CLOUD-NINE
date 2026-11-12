import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { AvatarAnimator, type AvatarPose, type AvatarRig } from "./animation";
import type { AvatarAppearance } from "./appearance";

const matte = (color: string, extra: THREE.MeshStandardMaterialParameters = {}) =>
  new THREE.MeshStandardMaterial({ color, roughness: 0.85, metalness: 0, ...extra });

function useAvatarMaterials(a: AvatarAppearance) {
  return useMemo(() => ({
    skin: matte(a.skin, { roughness: 0.7 }),
    cheeks: matte(a.cheeks, { roughness: 0.7 }),
    hair: matte(a.hair),
    coat: matte(a.coat),
    trim: matte(a.trim, { roughness: 0.95 }),
    buttons: matte(a.buttons, { roughness: 0.35, metalness: 0.5 }),
    scarf: matte(a.scarf),
    hat: matte(a.hat),
    hatBand: matte(a.hatBand, { roughness: 0.95 }),
    pompom: matte(a.pompom, { roughness: 1 }),
    mittens: matte(a.mittens, { roughness: 0.95 }),
    leggings: matte(a.leggings),
    boots: matte(a.boots, { roughness: 0.6 }),
    eyes: matte("#3a2630", { roughness: 0.3 }),
    eyeShine: new THREE.MeshBasicMaterial({ color: "#ffffff" }),
  }), [a]);
}

/** Shared geometry (one copy for every avatar on screen). */
const geo = {
  coat: (() => {
    const profile = [
      [0.001, 0.47], [0.255, 0.47], [0.27, 0.52], [0.25, 0.66], [0.215, 0.82], [0.19, 0.95], [0.165, 1.04], [0.11, 1.11], [0.001, 1.14],
    ].map(([r, y]) => new THREE.Vector2(r, y));
    return new THREE.LatheGeometry(profile, 28);
  })(),
  hemTrim: new THREE.TorusGeometry(0.262, 0.045, 10, 32).rotateX(Math.PI / 2),
  placket: new THREE.CapsuleGeometry(0.018, 0.5, 4, 8),
  button: new THREE.SphereGeometry(0.024, 10, 8),
  scarfRing: new THREE.TorusGeometry(0.115, 0.06, 12, 24).rotateX(Math.PI / 2),
  scarfTail: new THREE.CapsuleGeometry(0.05, 0.2, 4, 10).scale(1, 1, 0.45),
  head: new THREE.SphereGeometry(0.22, 32, 24),
  hair: new THREE.SphereGeometry(0.228, 28, 16, 0, Math.PI * 2, 0, Math.PI * 0.62),
  eye: new THREE.SphereGeometry(0.03, 14, 10).scale(1, 1.15, 0.6),
  shine: new THREE.SphereGeometry(0.009, 8, 6),
  cheek: new THREE.SphereGeometry(0.04, 14, 10).scale(1, 0.62, 0.3),
  nose: new THREE.SphereGeometry(0.022, 10, 8),
  smile: new THREE.TorusGeometry(0.03, 0.007, 6, 14, Math.PI),
  hat: new THREE.SphereGeometry(0.238, 28, 14, 0, Math.PI * 2, 0, Math.PI / 2),
  hatBand: new THREE.TorusGeometry(0.228, 0.052, 12, 30).rotateX(Math.PI / 2),
  pompom: new THREE.IcosahedronGeometry(0.075, 2),
  arm: new THREE.CapsuleGeometry(0.064, 0.27, 6, 12),
  cuff: new THREE.TorusGeometry(0.068, 0.028, 8, 18).rotateX(Math.PI / 2),
  mitten: new THREE.SphereGeometry(0.072, 16, 12).scale(1, 1.15, 0.9),
  thumb: new THREE.SphereGeometry(0.03, 10, 8),
  leg: new THREE.CapsuleGeometry(0.072, 0.36, 6, 12),
  boot: new THREE.SphereGeometry(1, 18, 12).scale(0.1, 0.085, 0.145),
  bootCuff: new THREE.TorusGeometry(0.085, 0.032, 8, 18).rotateX(Math.PI / 2),
};

const HIP_Y = 0.6;

/**
 * The default visitor: a round, storybook figure in a fur-trimmed winter coat, scarf and bobble
 * hat, 1.7 m to the top of the hat (design/scale.avatarHeight). Feet at y = 0, facing +z.
 * Built from separate pivots (legs, arms, torso, head) so AvatarAnimator can pose it.
 */
export function ProceduralAvatar({ appearance, pose }: { appearance: AvatarAppearance; pose: () => AvatarPose }) {
  const m = useAvatarMaterials(appearance);
  const bob = useRef<THREE.Group>(null!), torso = useRef<THREE.Group>(null!), head = useRef<THREE.Group>(null!);
  const legL = useRef<THREE.Group>(null!), legR = useRef<THREE.Group>(null!), armL = useRef<THREE.Group>(null!), armR = useRef<THREE.Group>(null!);
  const animator = useMemo(() => new AvatarAnimator(), []);

  useFrame((_, dt) => {
    const rig: AvatarRig = { bob: bob.current, torso: torso.current, head: head.current, legL: legL.current, legR: legR.current, armL: armL.current, armR: armR.current };
    animator.update(rig, pose(), Math.min(dt, 0.1));
  });

  const leg = (side: 1 | -1, ref: React.RefObject<THREE.Group>) => (
    <group ref={ref} position={[0.1 * side, HIP_Y, 0]}>
      <mesh geometry={geo.leg} material={m.leggings} position={[0, -0.26, 0]} castShadow />
      <mesh geometry={geo.bootCuff} material={m.trim} position={[0, -0.43, 0]} castShadow />
      <mesh geometry={geo.boot} material={m.boots} position={[0, -0.515, 0.03]} castShadow />
    </group>
  );
  const arm = (side: 1 | -1, ref: React.RefObject<THREE.Group>) => (
    <group ref={ref} position={[0.185 * side, 1.02 - HIP_Y, 0]}>
      <mesh geometry={geo.arm} material={m.coat} position={[0, -0.17, 0]} castShadow />
      <mesh geometry={geo.cuff} material={m.trim} position={[0, -0.33, 0]} castShadow />
      <mesh geometry={geo.mitten} material={m.mittens} position={[0, -0.41, 0.005]} castShadow />
      <mesh geometry={geo.thumb} material={m.mittens} position={[-0.045 * side, -0.385, 0.035]} castShadow />
    </group>
  );

  return (
    <group name="avatar">
      <group ref={bob}>
        {leg(-1, legL)}
        {leg(1, legR)}
        <group ref={torso} position={[0, HIP_Y, 0]}>
          <group position={[0, -HIP_Y, 0]} scale={[1, 1, 0.86]}>
            <mesh geometry={geo.coat} material={m.coat} castShadow receiveShadow />
            <mesh geometry={geo.hemTrim} material={m.trim} position={[0, 0.49, 0]} castShadow />
          </group>
          {/* front placket and buttons */}
          <mesh geometry={geo.placket} material={m.trim} position={[0, 0.17, 0.205]} rotation={[-0.1, 0, 0]} />
          {[0.38, 0.25, 0.12].map((y, i) => <mesh key={i} geometry={geo.button} material={m.buttons} position={[0.05, y, 0.21 - (0.38 - y) * 0.1]} />)}
          {/* scarf */}
          <mesh geometry={geo.scarfRing} material={m.scarf} position={[0, 1.105 - HIP_Y, 0]} castShadow />
          <mesh geometry={geo.scarfTail} material={m.scarf} position={[0.08, 0.98 - HIP_Y, 0.15]} rotation={[0.18, 0, 0.12]} castShadow />
          {arm(-1, armL)}
          {arm(1, armR)}
          <group ref={head} position={[0, 1.15 - HIP_Y, 0]}>
            <mesh geometry={geo.head} material={m.skin} position={[0, 0.2, 0]} castShadow />
            <mesh geometry={geo.hair} material={m.hair} position={[0, 0.205, -0.012]} rotation={[-0.95, 0, 0]} castShadow />
            {[-1, 1].map((sd) => (
              <group key={sd}>
                <mesh geometry={geo.eye} material={m.eyes} position={[0.075 * sd, 0.21, 0.198]} />
                <mesh geometry={geo.shine} material={m.eyeShine} position={[0.075 * sd + 0.01, 0.225, 0.215]} />
                <mesh geometry={geo.cheek} material={m.cheeks} position={[0.125 * sd, 0.155, 0.165]} rotation={[0, 0.6 * sd, 0]} />
              </group>
            ))}
            <mesh geometry={geo.nose} material={m.skin} position={[0, 0.175, 0.218]} />
            <mesh geometry={geo.smile} material={m.eyes} position={[0, 0.125, 0.205]} rotation={[0.25, 0, Math.PI]} />
            <group position={[0, 0.25, -0.01]} rotation={[-0.12, 0, 0.06]}>
              <mesh geometry={geo.hat} material={m.hat} scale={[1, 1.08, 1]} castShadow />
              <mesh geometry={geo.hatBand} material={m.hatBand} position={[0, 0.02, 0]} castShadow />
              <mesh geometry={geo.pompom} material={m.pompom} position={[0, 0.3, 0]} castShadow />
            </group>
          </group>
        </group>
      </group>
    </group>
  );
}
