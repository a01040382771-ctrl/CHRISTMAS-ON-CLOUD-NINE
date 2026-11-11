import { useMemo } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { archGeometry, archShape, revolve, domeProfile, coneProfile, onionProfile, snowCap } from "../world/geo";
import { LIGHTS, M } from "../world/materials";
import { LightMarker, type LightColor } from "../world/LightsField";

// ───────────── shared geometry cache ─────────────

let _g: ReturnType<typeof buildGeos> | null = null;
function buildGeos() {
  const glassGeo = new THREE.ShapeGeometry(archShape(0.8, 1.5), 12);
  // ShapeGeometry UVs are in shape space → remap to 0..1 for the glow texture
  const p = glassGeo.getAttribute("position");
  const uv = glassGeo.getAttribute("uv");
  for (let i = 0; i < p.count; i++) uv.setXY(i, (p.getX(i) + 0.4) / 0.8, p.getY(i) / 1.5);
  return {
    windowFrame: archGeometry(1.14, 1.72, 0.1, 0.02),
    windowGlass: glassGeo,
    doorFrame: archGeometry(2.0, 2.85, 0.4, 0.03),
    doorLeaf: archGeometry(1.5, 2.6, 0.1, 0.02),
    sphere: new THREE.SphereGeometry(1, 12, 8),
    sphereLo: new THREE.SphereGeometry(1, 9, 6),
    lightBulb: new THREE.IcosahedronGeometry(0.075, 0),
    box: new THREE.BoxGeometry(1, 1, 1),
    cyl: new THREE.CylinderGeometry(1, 1, 1, 24),
    torus: new THREE.TorusGeometry(1, 0.12, 8, 28),
  };
}
export const G = () => (_g ??= buildGeos());

// ───────────── light twinkle driver ─────────────

const baseColors = new Map<THREE.MeshBasicMaterial, THREE.Color>();

/** One tiny component animates every string light in the village (shared materials). */
export function LightDriver({ enabled = true }: { enabled?: boolean }) {
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    const L = LIGHTS();
    const mats = [L.warm, L.red, L.blue, L.white];
    mats.forEach((m, i) => {
      if (!baseColors.has(m)) baseColors.set(m, m.color.clone());
      const k = enabled ? 0.8 + 0.32 * Math.sin(t * (1.6 + i * 0.45) + i * 1.9) : 1;
      m.color.copy(baseColors.get(m)!).multiplyScalar(k);
    });
  });
  return null;
}

/** String lights: rendered by the world-level LightsField (4 draw calls for the whole village). */
export function StringLights({ points, scale = 1, palette = ["warm", "red", "white", "blue"] }: { points: THREE.Vector3[]; scale?: number; palette?: LightColor[] }) {
  return <LightMarker points={points} scale={scale} palette={palette} />;
}

export { Halo } from "../world/Halos";
import { Halo } from "../world/Halos";

// ───────────── window ─────────────

/** Arched window with warm interior glow, mullions, sill (with snow), shutters and halo. Faces local +z. */
export function WindowUnit({ position, rotationY = 0, curtains = false, shutters = true, scale = 1, halo = true }: {
  position: [number, number, number]; rotationY?: number; curtains?: boolean; shutters?: boolean; scale?: number; halo?: boolean;
}) {
  const m = M();
  const g = G();
  return (
    <group position={position} rotation={[0, rotationY, 0]} scale={scale}>
      <mesh geometry={g.windowFrame} material={m.trim} position={[0, -0.1, -0.06]} castShadow />
      <mesh geometry={g.windowGlass} material={curtains ? m.glassCurtain : m.glass} position={[0, 0, 0.045]} />
      {/* mullions */}
      <mesh geometry={g.box} material={m.trim} position={[0, 0.7, 0.07]} scale={[0.05, 1.45, 0.04]} />
      <mesh geometry={g.box} material={m.trim} position={[0, 0.62, 0.07]} scale={[0.8, 0.05, 0.04]} />
      {/* sill + snow */}
      <mesh geometry={g.box} material={m.stoneLight} position={[0, -0.14, 0.2]} scale={[1.3, 0.12, 0.34]} castShadow />
      <mesh geometry={g.sphere} material={m.snow} position={[0, -0.06, 0.2]} scale={[0.6, 0.07, 0.15]} />
      {shutters && (
        <>
          <mesh geometry={g.box} material={m.roofPine} position={[-0.7, 0.72, 0.01]} scale={[0.26, 1.3, 0.05]} castShadow />
          <mesh geometry={g.box} material={m.roofPine} position={[0.7, 0.72, 0.01]} scale={[0.26, 1.3, 0.05]} castShadow />
        </>
      )}
      {halo && <Halo position={[0, 0.8, 0.45]} size={2.6} opacity={0.26} />}
    </group>
  );
}

// ───────────── door ─────────────

/** Arched wooden door with stone frame, wreath & bow, lantern, step. Faces local +z, base on y=0. */
export function ArchDoor({ position, rotationY = 0, scale = 1, wreath = true, stepH = 0.3 }: { position: [number, number, number]; rotationY?: number; scale?: number; wreath?: boolean; stepH?: number }) {
  const m = M();
  const g = G();
  return (
    <group position={position} rotation={[0, rotationY, 0]} scale={scale}>
      <mesh geometry={g.doorFrame} material={m.stoneLight} position={[0, 0, -0.18]} castShadow />
      <mesh geometry={g.doorLeaf} material={m.doorWood} position={[0, 0, 0.18]} castShadow />
      {/* planks */}
      {[-0.45, 0, 0.45].map((x) => (
        <mesh key={x} geometry={g.box} material={m.woodDark} position={[x, 1.2, 0.3]} scale={[0.04, 2.3, 0.02]} />
      ))}
      <mesh geometry={g.box} material={m.goldSoft} position={[0, 1.3, 0.3]} scale={[1.34, 0.07, 0.03]} />
      <mesh geometry={g.sphere} material={m.gold} position={[0.5, 1.15, 0.33]} scale={0.07} />
      {wreath && (
        <group position={[0, 2.0, 0.34]}>
          <mesh geometry={g.torus} material={m.pine} scale={0.36} />
          <mesh geometry={g.sphere} material={m.ribbonRed} position={[0, -0.34, 0.03]} scale={[0.12, 0.09, 0.05]} />
          <mesh geometry={g.sphere} material={m.ribbonRed} position={[-0.09, -0.4, 0.03]} scale={[0.05, 0.12, 0.04]} rotation={[0, 0, 0.3]} />
          <mesh geometry={g.sphere} material={m.ribbonRed} position={[0.09, -0.4, 0.03]} scale={[0.05, 0.12, 0.04]} rotation={[0, 0, -0.3]} />
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <mesh key={i} geometry={g.sphere} material={m.ribbonRed} position={[Math.sin(i * 1.05) * 0.34, Math.cos(i * 1.05) * 0.34, 0.06]} scale={0.045} />
          ))}
        </group>
      )}
      {/* step, snow on the step */}
      <mesh geometry={g.box} material={m.stone} position={[0, -stepH / 2 + 0.02, 0.75]} scale={[2.5, stepH + 0.04, 1.1]} receiveShadow castShadow />
      <mesh geometry={g.box} material={m.stone} position={[0, -stepH / 4, 1.55]} scale={[2.1, stepH / 2, 0.6]} receiveShadow castShadow />
      <mesh geometry={g.sphere} material={m.snow} position={[-0.8, 0.05, 0.95]} scale={[0.55, 0.07, 0.4]} />
      {/* lantern */}
      <group position={[1.4, 2.0, 0.28]}>
        <mesh geometry={g.cyl} material={m.lampMetal} position={[0, 0.2, 0]} scale={[0.02, 0.4, 0.02]} />
        <mesh geometry={g.sphere} material={LIGHTS().warm} position={[0, 0, 0.05]} scale={0.12} />
        <Halo position={[0, 0, 0.2]} size={1.6} opacity={0.6} />
      </group>
      <Halo position={[0, 1.4, 1.2]} size={3.6} opacity={0.18} />
    </group>
  );
}

// ───────────── garland ─────────────

export function ringGarlandPoints(radius: number, y: number, swags: number, sag: number, perSwag = 7): THREE.Vector3[] {
  const pts: THREE.Vector3[] = [];
  for (let s = 0; s < swags; s++) {
    for (let k = 0; k < perSwag; k++) {
      const u = k / perSwag;
      const a = ((s + u) / swags) * Math.PI * 2;
      pts.push(new THREE.Vector3(Math.sin(a) * radius, y - Math.sin(Math.PI * u) * sag, Math.cos(a) * radius));
    }
  }
  return pts;
}

/** Pine garland swags + twinkle lights following a ring (eaves). */
export function GarlandRing({ radius, y, swags = 12, sag = 0.28, skipAngle }: { radius: number; y: number; swags?: number; sag?: number; skipAngle?: number }) {
  const m = M();
  const { tube, bulbs } = useMemo(() => {
    const pts = ringGarlandPoints(radius, y, swags, sag, 8);
    const curve = new THREE.CatmullRomCurve3(pts, true, "catmullrom", 0.3);
    const tube = new THREE.TubeGeometry(curve, swags * 16, 0.065, 6, true);
    const bulbs = pts.filter((p) => {
      if (skipAngle === undefined) return true;
      const a = Math.atan2(p.x, p.z);
      return Math.abs(Math.atan2(Math.sin(a - skipAngle), Math.cos(a - skipAngle))) > 0.42;
    }).map((p) => p.clone().add(new THREE.Vector3(0, -0.07, 0).setLength(0.07)));
    return { tube, bulbs };
  }, [radius, y, swags, sag, skipAngle]);
  return (
    <>
      <mesh geometry={tube} material={m.pine} castShadow />
      <StringLights points={bulbs} />
    </>
  );
}

// ───────────── chimney ─────────────

export function Chimney({ position, height = 1.8 }: { position: [number, number, number]; height?: number }) {
  const m = M();
  const g = G();
  return (
    <group position={position}>
      <mesh geometry={g.box} material={m.stone} position={[0, height / 2, 0]} scale={[0.8, height, 0.8]} castShadow />
      <mesh geometry={g.box} material={m.stoneLight} position={[0, height + 0.06, 0]} scale={[1.0, 0.14, 1.0]} castShadow />
      <mesh geometry={g.sphere} material={m.snow} position={[0, height + 0.2, 0]} scale={[0.55, 0.14, 0.55]} />
    </group>
  );
}

// ───────────── round roofs (shared by round houses, cupolas, towers) ─────────────

/** Lathe roof + wavy snow blanket + dark soffit disc so the underside never shows through. */
export function RoundRoof({ radius, height, kind, material, y = 0, snowThick = 0.11, phase = 0, finial = true }: {
  radius: number; height: number; kind: "dome" | "cone" | "onion"; material: THREE.Material; y?: number; snowThick?: number; phase?: number; finial?: boolean;
}) {
  const m = M();
  const { roof, snow, profile } = useMemo(() => {
    let profile;
    if (kind === "dome") profile = domeProfile(radius, height);
    else if (kind === "cone") profile = coneProfile(radius, height);
    else profile = onionProfile(radius, height);
    return {
      profile,
      roof: revolve(profile, { segments: 36, rows: 14 }),
      snow: snowCap(profile, { cut: kind === "dome" ? 0.34 : 0.3, amp: 0.085, freq: 7, thick: snowThick, segments: 36, rows: 10, phase }),
    };
  }, [radius, height, kind, snowThick, phase]);
  const g = G();
  const top = profile(1);
  return (
    <group position={[0, y, 0]}>
      <mesh geometry={roof} material={material} castShadow receiveShadow />
      <mesh geometry={snow} material={m.snow} castShadow receiveShadow />
      {/* soffit */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <circleGeometry args={[radius, 40]} />
        <meshStandardMaterial color="#6b4a3a" roughness={1} side={THREE.DoubleSide} />
      </mesh>
      {finial && kind !== "dome" && (
        <group position={[0, top[1] - 0.05, 0]}>
          <mesh geometry={g.sphere} material={m.gold} position={[0, 0.12, 0]} scale={0.15} castShadow />
          <mesh geometry={g.cyl} material={m.gold} position={[0, 0.5, 0]} scale={[0.025, 0.8, 0.025]} />
        </group>
      )}
    </group>
  );
}
