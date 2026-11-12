/**
 * BUILDING KIT — shared architectural parts used by every building.
 * All parts are drawn in the building's local space: y = 0 is the top of the lot foundation,
 * +z is the front. Sizes are in metres and follow design/scale.ts.
 */
import { useMemo } from "react";
import { RoundedBox } from "@react-three/drei";
import * as THREE from "three";
import { materials, scale, type MaterialName } from "../../../design";

type V3 = [number, number, number];
const mat = (name: MaterialName) => materials[name];

/** Rounded masonry volume standing on a stone plinth. */
export function BoxBody({ size, position = [0, 0, 0], wall = "wallIvory", plinth = true, radius = 0.32 }: {
  size: V3; position?: V3; wall?: MaterialName; plinth?: boolean; radius?: number;
}) {
  const [w, h, d] = size;
  return (
    <group position={position}>
      <RoundedBox args={[w, h, d]} radius={Math.min(radius, h / 2 - 0.01)} smoothness={4} position={[0, h / 2, 0]} material={mat(wall)} castShadow receiveShadow />
      {plinth && <RoundedBox args={[w + 0.3, 0.6, d + 0.3]} radius={0.14} smoothness={3} position={[0, 0.3, 0]} material={materials.stone} castShadow receiveShadow />}
    </group>
  );
}

/** Round tower shaft with a slight taper and a stone plinth. */
export function TowerBody({ radius, height, position = [0, 0, 0], wall = "wallIvory" }: {
  radius: number; height: number; position?: V3; wall?: MaterialName;
}) {
  return (
    <group position={position}>
      <mesh position={[0, height / 2, 0]} material={mat(wall)} castShadow receiveShadow>
        <cylinderGeometry args={[radius * 0.95, radius, height, 36]} />
      </mesh>
      <mesh position={[0, 0.3, 0]} material={materials.stone} castShadow receiveShadow>
        <cylinderGeometry args={[radius + 0.16, radius + 0.2, 0.6, 36]} />
      </mesh>
      <mesh position={[0, height - 0.12, 0]} material={materials.stone} castShadow>
        <cylinderGeometry args={[radius + 0.1, radius * 0.97, 0.24, 36]} />
      </mesh>
    </group>
  );
}

const coneProfile = (r: number, h: number, t: number) => new THREE.Vector2(r * (Math.pow(1 - t, 2) * 0.55 + (1 - t) * 0.45), h * t);

/** Flared storybook cone roof with a snow blanket, a snowy eave roll and a gold finial. */
export function ConeRoof({ radius, height, position = [0, 0, 0], roof = "roofPink", finial = true }: {
  radius: number; height: number; position?: V3; roof?: MaterialName; finial?: boolean;
}) {
  const eave = radius * 1.24;
  const geo = useMemo(() => {
    const body = [new THREE.Vector2(0.001, -0.02), new THREE.Vector2(eave * 0.97, -0.14)];
    for (let i = 0; i <= 18; i++) body.push(coneProfile(eave, height, i / 18));
    const snow: THREE.Vector2[] = [];
    const t0 = 0.3;
    const start = coneProfile(eave, height, t0);
    snow.push(new THREE.Vector2(start.x + 0.02, start.y - 0.1), new THREE.Vector2(start.x + 0.2, start.y + 0.02));
    for (let i = 1; i <= 14; i++) {
      const p = coneProfile(eave, height, t0 + (1 - t0) * (i / 14));
      snow.push(new THREE.Vector2(Math.max(0.001, p.x + 0.13 * (1 - i / 14) + 0.03), p.y + 0.1));
    }
    return { body: new THREE.LatheGeometry(body, 40), snow: new THREE.LatheGeometry(snow, 40) };
  }, [eave, height]);
  return (
    <group position={position}>
      <mesh geometry={geo.body} material={mat(roof)} castShadow receiveShadow />
      <mesh geometry={geo.snow} material={materials.snow} castShadow />
      <mesh position={[0, 0.02, 0]} rotation={[Math.PI / 2, 0, 0]} scale={[1, 1, 0.62]} material={materials.snow} castShadow>
        <torusGeometry args={[eave - 0.05, 0.24, 10, 40]} />
      </mesh>
      {finial && <Finial position={[0, height + 0.1, 0]} />}
    </group>
  );
}

/** Gold ball finial on a short spire. */
export function Finial({ position = [0, 0, 0], size = 1 }: { position?: V3; size?: number }) {
  return (
    <group position={position} scale={size}>
      <mesh position={[0, 0.3, 0]} material={materials.gold} castShadow><cylinderGeometry args={[0.03, 0.06, 0.7, 8]} /></mesh>
      <mesh position={[0, 0.72, 0]} material={materials.gold} castShadow><sphereGeometry args={[0.17, 16, 12]} /></mesh>
    </group>
  );
}

/**
 * Swooping gable roof. The ridge runs along local x; `width` is the wall length under the ridge,
 * `depth` the wall depth it spans. Includes the snow blanket on the upper slopes.
 */
export function GableRoof({ width, depth, height, position = [0, 0, 0], rotationY = 0, roof = "roofPink", overhang = 0.55, snowFrom = 0.24 }: {
  width: number; depth: number; height: number; position?: V3; rotationY?: number; roof?: MaterialName; overhang?: number;
  /** Where the snow starts on the slope: 0 = eave, 1 = ridge. */
  snowFrom?: number;
}) {
  const geo = useMemo(() => {
    const a = depth / 2 + overhang;
    const ctrl = new THREE.Vector2(-a * 0.42, height * 0.4); // below the straight slope → gentle swoop
    const slope = (s: number) => {
      const u = 1 - s;
      return new THREE.Vector2(u * u * -a + 2 * u * s * ctrl.x, 2 * u * s * ctrl.y + s * s * height);
    };
    const body = new THREE.Shape();
    body.moveTo(-a, 0);
    body.quadraticCurveTo(ctrl.x, ctrl.y, 0, height);
    body.quadraticCurveTo(-ctrl.x, ctrl.y, a, 0);
    body.lineTo(a - 0.3, -0.18);
    body.lineTo(-a + 0.3, -0.18);
    body.closePath();

    // snow lies on the upper part of both slopes
    const outer: THREE.Vector2[] = [], inner: THREE.Vector2[] = [];
    for (let i = 0; i <= 10; i++) {
      const s = snowFrom + (1 - snowFrom) * (i / 10);
      const p = slope(s), q = slope(Math.min(1, s + 0.02));
      const n = new THREE.Vector2(-(q.y - p.y), q.x - p.x).normalize();
      if (i === 10) n.set(0, 1);
      outer.push(p.clone().addScaledVector(n, 0.2 - 0.04 * (i / 10)));
      inner.push(p.clone().addScaledVector(n, -0.03));
    }
    // closed outline: up the left slope's snow surface, down the right, then back underneath
    const snow = new THREE.Shape();
    snow.moveTo(inner[0].x, inner[0].y);
    outer.forEach((p) => snow.lineTo(p.x, p.y));
    [...outer].reverse().slice(1).forEach((p) => snow.lineTo(-p.x, p.y));
    inner.forEach((_, i) => { const p = inner[i]; if (i < inner.length - 1) snow.lineTo(-p.x, p.y); });
    [...inner].reverse().forEach((p) => snow.lineTo(p.x, p.y));
    snow.closePath();

    const len = width + overhang * 2;
    const extrude = (shape: THREE.Shape, length: number) => {
      const g = new THREE.ExtrudeGeometry(shape, { depth: length, bevelEnabled: true, bevelSize: 0.06, bevelThickness: 0.06, bevelSegments: 2, curveSegments: 14 });
      g.translate(0, 0, -length / 2);
      g.rotateY(Math.PI / 2);
      return g;
    };
    return { body: extrude(body, len), snow: extrude(snow, len + 0.16) };
  }, [width, depth, height, overhang, snowFrom]);
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <mesh geometry={geo.body} material={mat(roof)} castShadow receiveShadow />
      <mesh geometry={geo.snow} material={materials.snow} castShadow />
    </group>
  );
}

/** Dome with a snow cap; `squash` < 1 flattens it, > 1 makes an onion-ish cupola. */
export function Dome({ radius, position = [0, 0, 0], roof = "roofBurgundy", squash = 1, finial = true }: {
  radius: number; position?: V3; roof?: MaterialName; squash?: number; finial?: boolean;
}) {
  return (
    <group position={position}>
      <mesh scale={[1, squash, 1]} material={mat(roof)} castShadow receiveShadow>
        <sphereGeometry args={[radius, 40, 20, 0, Math.PI * 2, 0, Math.PI / 2]} />
      </mesh>
      <mesh scale={[1, squash, 1]} position={[0, 0.06, 0]} material={materials.snow} castShadow>
        <sphereGeometry args={[radius * 1.02, 40, 12, 0, Math.PI * 2, 0, 0.82]} />
      </mesh>
      <mesh position={[0, 0.02, 0]} rotation={[Math.PI / 2, 0, 0]} scale={[1, 1, 0.6]} material={materials.snow} castShadow>
        <torusGeometry args={[radius, 0.2, 10, 40]} />
      </mesh>
      {finial && <Finial position={[0, radius * squash, 0]} size={1.2} />}
    </group>
  );
}

function archShape(w: number, h: number) {
  const s = new THREE.Shape();
  const r = w / 2;
  s.moveTo(-r, 0);
  s.lineTo(r, 0);
  s.lineTo(r, h - r);
  s.absarc(0, h - r, r, 0, Math.PI, false);
  s.lineTo(-r, 0);
  return s;
}

function useArch(w: number, h: number, frame: number) {
  return useMemo(() => ({
    frame: new THREE.ExtrudeGeometry(archShape(w + frame * 2, h + frame), { depth: 0.14, bevelEnabled: true, bevelSize: 0.03, bevelThickness: 0.03, bevelSegments: 2, curveSegments: 12 }),
    pane: new THREE.ShapeGeometry(archShape(w, h), 12),
  }), [w, h, frame]);
}

/** Arched window glowing with warm interior light. Placed on a wall facing its local +z. */
export function GlowWindow({ position, rotationY = 0, w = 1, h = 1.7, frame = "wallIvory" }: {
  position: V3; rotationY?: number; w?: number; h?: number; frame?: MaterialName;
}) {
  const geo = useArch(w, h, 0.14);
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <mesh geometry={geo.frame} position={[0, -0.07, -0.08]} material={mat(frame)} castShadow />
      <mesh geometry={geo.pane} position={[0, 0, 0.1]} material={materials.windowGlow} />
      <mesh position={[0, h / 2, 0.11]} material={mat(frame)}><boxGeometry args={[0.07, h, 0.05]} /></mesh>
      <mesh position={[0, (h - w / 2) * 0.62, 0.11]} material={mat(frame)}><boxGeometry args={[w, 0.07, 0.05]} /></mesh>
      <mesh position={[0, -0.1, 0.14]} material={materials.snow} castShadow><boxGeometry args={[w + 0.5, 0.16, 0.34]} /></mesh>
    </group>
  );
}

/** Arched front door at avatar scale, with a wreath and a stone step. */
export function Door({ position, rotationY = 0, w = scale.doorWidth, h = scale.doorHeight, leaf = "trim" }: {
  position: V3; rotationY?: number; w?: number; h?: number; leaf?: MaterialName;
}) {
  const geo = useArch(w, h, 0.2);
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <mesh geometry={geo.frame} position={[0, 0, -0.08]} material={materials.stone} castShadow />
      <mesh geometry={geo.pane} position={[0, 0, 0.1]} material={mat(leaf)} />
      <mesh position={[w * 0.3, h * 0.42, 0.14]} material={materials.gold}><sphereGeometry args={[0.07, 12, 10]} /></mesh>
      <mesh position={[0, h * 0.66, 0.15]} material={materials.pine}><torusGeometry args={[0.26, 0.085, 8, 20]} /></mesh>
      <mesh position={[0, h * 0.66 - 0.26, 0.2]} material={materials.gold}><sphereGeometry args={[0.07, 10, 8]} /></mesh>
      <mesh position={[0, -0.02, 0.45]} material={materials.stone} castShadow receiveShadow><boxGeometry args={[w + 0.9, 0.2, 0.9]} /></mesh>
    </group>
  );
}

/** Chimney with a snow cap. */
export function Chimney({ position, height = 1.8 }: { position: V3; height?: number }) {
  return (
    <group position={position}>
      <RoundedBox args={[0.8, height, 0.8]} radius={0.1} smoothness={3} position={[0, height / 2, 0]} material={materials.wallRose} castShadow />
      <RoundedBox args={[1, 0.26, 1]} radius={0.1} smoothness={3} position={[0, height, 0]} material={materials.stone} castShadow />
      <mesh position={[0, height + 0.2, 0]} scale={[1, 0.5, 1]} material={materials.snow}><sphereGeometry args={[0.5, 14, 10]} /></mesh>
    </group>
  );
}
