import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { M } from "../world/materials";
import { coneProfile, mulberry32, revolve, snowCap } from "../world/geo";
import { G, Halo, StringLights } from "../buildings/parts";
import { useFrame } from "@react-three/fiber";
import { treeFade } from "../controls/cameraRig";

/** Scalloped, slightly drooping tier of pine boughs. */
function tierGeometry(R: number, H: number, k: number, seg = 32) {
  const prof = coneProfile(R, H, 0.08);
  return revolve(prof, {
    segments: seg,
    rows: 12,
    deform: (r, y, t, phi) => {
      const w = Math.max(0, 1 - t / 0.22);
      const s = 0.5 + 0.5 * Math.cos(phi * k);
      return [r * (1 + 0.06 * w * s), y - 0.55 * w * (1 - s) * Math.min(1, H / 3)];
    },
  });
}

export interface TreeProps {
  position: [number, number, number];
  height?: number;
  baseRadius?: number;
  tiers?: number;
  /** clearance under the lowest boughs so avatars can walk up to the trunk */
  trunkHeight?: number;
  ornaments?: number;
  lights?: boolean;
  seed?: number;
  star?: boolean;
  lowDetail?: boolean;
  /** fade the canopy when it hides the avatar (only the central tree uses this) */
  fade?: boolean;
}

/** Parametric Christmas tree: scalloped snow-dusted tiers, ornaments, gold ribbon, twinkle lights, star. */
export function ChristmasTree({ position, height = 13, baseRadius = 4.2, tiers = 6, trunkHeight = 2.1, ornaments = 110, lights = true, seed = 4, star = true, lowDetail = false, fade = false }: TreeProps) {
  const m = M();
  // per-tree clones so only this tree fades (the shared pine materials stay opaque)
  const fadeMats = useMemo(() => {
    if (!fade) return null;
    const c = (b: THREE.MeshStandardMaterial) => { const x = b.clone(); x.transparent = false; return x; };
    return { pine: c(m.pine), pineLight: c(m.pineLight), pineDeep: c(m.pineDeep), snow: c(m.snow), ribbon: c(m.ribbonGold) };
  }, [fade, m]);
  const op = useRef(1);
  const ornMat = useRef<THREE.MeshStandardMaterial>(null);
  useFrame((_, dt) => {
    if (!fadeMats) return;
    op.current += (treeFade.target - op.current) * Math.min(1, dt * 7);
    const o = Math.abs(op.current - treeFade.target) < 0.01 ? treeFade.target : op.current;
    for (const mat of Object.values(fadeMats)) {
      const wasT = mat.transparent;
      mat.opacity = o;
      mat.transparent = o < 0.995;
      mat.depthWrite = o > 0.6;
      if (wasT !== mat.transparent) mat.needsUpdate = true;
    }
    const om = ornMat.current;
    if (om) {
      const wasT = om.transparent;
      om.opacity = o;
      om.transparent = o < 0.995;
      if (wasT !== om.transparent) om.needsUpdate = true;
    }
  });
  const g = G();
  const tierH = (height - trunkHeight) * 0.34;
  const step = (height - trunkHeight - tierH) / (tiers - 1);

  const data = useMemo(() => {
    const rnd = mulberry32(seed);
    const tiersData = Array.from({ length: tiers }, (_, i) => {
      const R = baseRadius * (1 - 0.8 * (i / (tiers - 1)));
      const H = tierH * (1 - 0.1 * (i / (tiers - 1)));
      const y = trunkHeight + i * step;
      return { R, H, y, geo: tierGeometry(R, H, 9 + i * 1.5, lowDetail ? 28 : 56), snow: snowCap(coneProfile(R, H, 0.08), { cut: 0.42, amp: 0.1, freq: 9 + i, thick: 0.13, segments: lowDetail ? 28 : 56, rows: 8, phase: i * 1.3 }) };
    });

    // ornaments on the outer surface of the tiers
    const orn: { p: THREE.Vector3; s: number; c: THREE.Color }[] = [];
    const palette = ["#d4333f", "#e8c46c", "#6fa8dc", "#f2a7bd", "#fff4e6", "#8c2f4b"].map((c) => new THREE.Color(c));
    for (let n = 0; n < ornaments; n++) {
      const i = Math.floor(rnd() * tiers);
      const td = tiersData[i];
      const t = 0.08 + rnd() * 0.5;
      const phi = rnd() * Math.PI * 2;
      const r = td.R * Math.pow(1 - t, 1.24) + 0.12;
      orn.push({ p: new THREE.Vector3(Math.sin(phi) * r, td.y + td.H * t, Math.cos(phi) * r), s: (0.2 + rnd() * 0.12) * (0.55 + 0.45 * (td.R / baseRadius)), c: palette[Math.floor(rnd() * palette.length)] });
    }

    // spiral ribbon + lights
    const spiral: THREE.Vector3[] = [];
    const turns = 5.5;
    const samples = 160;
    const y0 = trunkHeight + 0.5;
    const y1 = height - 0.9;
    for (let k = 0; k <= samples; k++) {
      const u = k / samples;
      const y = y0 + (y1 - y0) * u;
      const a = u * turns * Math.PI * 2;
      const r = Math.max(0.1, baseRadius * (1 - (y - trunkHeight) / (height - trunkHeight)) * 0.86 + 0.12);
      spiral.push(new THREE.Vector3(Math.sin(a) * r, y, Math.cos(a) * r));
    }
    const ribbon = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(spiral), 220, 0.07, 6, false);
    const bulbs = spiral.filter((_, k) => k % 2 === 0).map((p) => p.clone().multiplyScalar(1.015));
    return { tiersData, orn, ribbon, bulbs };
  }, [tiers, baseRadius, height, trunkHeight, tierH, step, ornaments, seed, lowDetail]);

  const ornRef = useRef<THREE.InstancedMesh>(null);
  useLayoutEffect(() => {
    const mesh = ornRef.current;
    if (!mesh) return;
    const d = new THREE.Object3D();
    data.orn.forEach((o, i) => {
      d.position.copy(o.p);
      d.scale.setScalar(o.s);
      d.updateMatrix();
      mesh.setMatrixAt(i, d.matrix);
      mesh.setColorAt(i, o.c);
    });
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    mesh.computeBoundingSphere();
  }, [data.orn]);

  const starGeo = useMemo(() => {
    const s = new THREE.Shape();
    const n = 5, ro = 0.75, ri = 0.34;
    for (let i = 0; i < n * 2; i++) {
      const a = (i / (n * 2)) * Math.PI * 2 + Math.PI / 2;
      const r = i % 2 ? ri : ro;
      i === 0 ? s.moveTo(Math.cos(a) * r, Math.sin(a) * r) : s.lineTo(Math.cos(a) * r, Math.sin(a) * r);
    }
    s.closePath();
    return new THREE.ExtrudeGeometry(s, { depth: 0.25, bevelEnabled: true, bevelSize: 0.06, bevelThickness: 0.06, bevelSegments: 2 });
  }, []);

  return (
    <group position={position}>
      <mesh position={[0, trunkHeight / 2 + 0.2, 0]} material={m.trunk} castShadow>
        <cylinderGeometry args={[0.55, 0.85, trunkHeight + 2.2, 14]} />
      </mesh>
      {data.tiersData.map((t, i) => (
        <group key={i} position={[0, t.y, 0]}>
          <mesh geometry={t.geo} material={fadeMats ? (i % 3 === 0 ? fadeMats.pineDeep : i % 3 === 1 ? fadeMats.pine : fadeMats.pineLight) : (i % 3 === 0 ? m.pineDeep : i % 3 === 1 ? m.pine : m.pineLight)} castShadow receiveShadow />
          <mesh geometry={t.snow} material={fadeMats ? fadeMats.snow : m.snow} castShadow />
        </group>
      ))}
      {!lowDetail && (
        <>
          <instancedMesh ref={ornRef} args={[g.sphereLo, undefined as unknown as THREE.Material, data.orn.length]} castShadow>
            <meshStandardMaterial ref={ornMat} color="#ffffff" roughness={0.22} metalness={0.55} />
          </instancedMesh>
          <mesh geometry={data.ribbon} material={fadeMats ? fadeMats.ribbon : m.ribbonGold} />
        </>
      )}
      {lights && <StringLights points={data.bulbs} scale={1.15} />}
      {star && (
        <group position={[0, height + 0.15, 0]}>
          <mesh geometry={starGeo} material={m.gold} position={[0, 0, -0.12]} castShadow />
          <Halo position={[0, 0.1, 0.4]} size={5.5} opacity={0.65} />
        </group>
      )}
    </group>
  );
}

/** Small snow-dusted pine for ring planting. */
export function PineTree({ position, scale = 1, seed = 1 }: { position: [number, number, number]; scale?: number; seed?: number }) {
  const m = M();
  const parts = useMemo(() => {
    const tiers = 3;
    return Array.from({ length: tiers }, (_, i) => {
      const R = 1.45 * (1 - i * 0.28);
      const H = 1.9 * (1 - i * 0.08);
      const y = 0.9 + i * 1.15;
      return { y, geo: tierGeometry(R, H, 8 + i), snow: snowCap(coneProfile(R, H, 0.08), { cut: 0.4, amp: 0.1, freq: 8, thick: 0.1, segments: 24, rows: 7, phase: seed + i }) };
    });
  }, [seed]);
  return (
    <group position={position} scale={scale}>
      <mesh position={[0, 0.5, 0]} material={m.trunk} castShadow>
        <cylinderGeometry args={[0.18, 0.26, 1.2, 8]} />
      </mesh>
      {parts.map((p, i) => (
        <group key={i} position={[0, p.y, 0]}>
          <mesh geometry={p.geo} material={i % 2 ? m.pineLight : m.pine} castShadow receiveShadow />
          <mesh geometry={p.snow} material={m.snow} castShadow />
        </group>
      ))}
    </group>
  );
}
