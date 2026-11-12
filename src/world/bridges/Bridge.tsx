import { useMemo } from "react";
import * as THREE from "three";
import { materials, palette, scale } from "../../design";
import { InstancedSet, placeMatrix, spanMatrix } from "../common/InstancedSet";
import { bridgePoint, RAIL_INSET, type Bridge as BridgeData } from "../layout";

const post = new THREE.CylinderGeometry(0.085, 0.1, 1, 10).translate(0, 0.5, 0);
const cap = new THREE.SphereGeometry(0.15, 12, 10);
const strut = new THREE.CylinderGeometry(0.06, 0.06, 1, 8);

/** Timber deck: one quad per plank so each board gets its own tint. */
function plankDeck(pts: THREE.Vector3[], side: THREE.Vector3, width: number) {
  const pos: number[] = [], uv: number[] = [], col: number[] = [];
  const base = new THREE.Color(palette.wood), alt = new THREE.Color(palette.rose), c = new THREE.Color();
  const h = width / 2;
  for (let i = 0; i < pts.length - 1; i++) {
    const a = pts[i], b = pts[i + 1];
    const al = [a.x - side.x * h, a.y, a.z - side.z * h], ar = [a.x + side.x * h, a.y, a.z + side.z * h];
    const bl = [b.x - side.x * h, b.y, b.z - side.z * h], br = [b.x + side.x * h, b.y, b.z + side.z * h];
    pos.push(...ar, ...br, ...al, ...al, ...br, ...bl);
    uv.push(0, 0, 0, 1, 2.5, 0, 2.5, 0, 0, 1, 2.5, 1);
    c.copy(base).lerp(alt, ((i * 37) % 11) / 30).multiplyScalar(0.92 + ((i * 53) % 7) / 60);
    for (let k = 0; k < 6; k++) col.push(c.r, c.g, c.b);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  geo.setAttribute("color", new THREE.Float32BufferAttribute(col, 3));
  geo.computeVertexNormals();
  return geo;
}

/** Solid beam under the deck (left face, underside, right face). */
function deckBeam(pts: THREE.Vector3[], side: THREE.Vector3, width: number, depth: number) {
  const pos: number[] = [], idx: number[] = [];
  const h = width / 2;
  pts.forEach((p) => {
    pos.push(p.x - side.x * h, p.y - 0.01, p.z - side.z * h, p.x - side.x * h, p.y - depth, p.z - side.z * h);
    pos.push(p.x + side.x * h, p.y - depth, p.z + side.z * h, p.x + side.x * h, p.y - 0.01, p.z + side.z * h);
  });
  for (let i = 0; i < pts.length - 1; i++) {
    for (let k = 0; k < 3; k++) {
      const a = i * 4 + k, b = a + 1, c = a + 4, d = a + 5;
      idx.push(a, c, b, b, c, d);
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  geo.setIndex(idx);
  geo.computeVertexNormals();
  return geo;
}

/**
 * Arched timber footbridge between two islands. Its end points come from the layout, so it always
 * lands exactly on both islands; the deck keeps a walkable slope (checked by the layout tests).
 */
export function Bridge({ bridge }: { bridge: BridgeData }) {
  const parts = useMemo(() => {
    const steps = Math.max(8, Math.round(bridge.length / 0.46));
    const pts = Array.from({ length: steps + 1 }, (_, i) => new THREE.Vector3(...bridgePoint(bridge, i / steps)));
    const dir = new THREE.Vector3(bridge.end[0] - bridge.start[0], 0, bridge.end[2] - bridge.start[2]).normalize();
    const side = new THREE.Vector3(-dir.z, 0, dir.x);
    const half = bridge.width / 2;

    const rail = (offset: number, height: number, radius: number) => {
      const curve = new THREE.CatmullRomCurve3(pts.filter((_, i) => i % 4 === 0 || i === steps).map((p) => p.clone().addScaledVector(side, offset).setY(p.y + height)));
      return new THREE.TubeGeometry(curve, steps, radius, 8);
    };
    // deck arch springing from the stone rims of both islands
    const arch = (offset: number) => {
      const curve = new THREE.CatmullRomCurve3(
        Array.from({ length: 17 }, (_, i) => {
          const t = i / 16, p = bridgePoint(bridge, t);
          return new THREE.Vector3(p[0], p[1] - 0.38 - 1.9 * Math.pow(1 - Math.sin(Math.PI * t), 1.4), p[2]).addScaledVector(side, offset);
        }),
      );
      return new THREE.TubeGeometry(curve, 48, 0.17, 8);
    };

    const posts: THREE.Matrix4[] = [], caps: THREE.Matrix4[] = [], struts: THREE.Matrix4[] = [];
    const postCount = Math.max(2, Math.round(bridge.length / 2.3));
    for (let i = 0; i <= postCount; i++) {
      const t = i / postCount, p = bridgePoint(bridge, t);
      for (const s of [-1, 1]) {
        const x = p[0] + side.x * (half - RAIL_INSET) * s, z = p[2] + side.z * (half - RAIL_INSET) * s;
        posts.push(placeMatrix(x, p[1] - 0.05, z, 0, 1, scale.railingHeight + 0.12, 1));
        caps.push(placeMatrix(x, p[1] + scale.railingHeight + 0.14, z));
        const archY = p[1] - 0.38 - 1.9 * Math.pow(1 - Math.sin(Math.PI * t), 1.4);
        if (i > 0 && i < postCount && p[1] - 0.3 - archY > 0.25) {
          struts.push(spanMatrix({ x: p[0] + side.x * (half - 0.25) * s, y: archY, z: p[2] + side.z * (half - 0.25) * s }, { x: p[0] + side.x * (half - 0.25) * s, y: p[1] - 0.3, z: p[2] + side.z * (half - 0.25) * s }));
        }
      }
    }
    return {
      deck: plankDeck(pts, side, bridge.width),
      beam: deckBeam(pts, side, bridge.width + 0.1, 0.34),
      rails: [half - RAIL_INSET, -(half - RAIL_INSET)].flatMap((o) => [rail(o, scale.railingHeight, 0.075), rail(o, 0.55, 0.045)]),
      arches: [arch(half - 0.25), arch(-(half - 0.25))],
      posts, caps, struts,
    };
  }, [bridge]);

  return (
    <group name={`bridge:${bridge.id}`}>
      <mesh geometry={parts.deck} material={materials.planks} receiveShadow castShadow />
      <mesh geometry={parts.beam} material={materials.woodDeep} castShadow />
      {parts.rails.map((g, i) => <mesh key={i} geometry={g} material={materials.trim} castShadow />)}
      {parts.arches.map((g, i) => <mesh key={i} geometry={g} material={materials.woodDeep} castShadow />)}
      <InstancedSet geometry={post} material={materials.trim} matrices={parts.posts} />
      <InstancedSet geometry={cap} material={materials.gold} matrices={parts.caps} />
      <InstancedSet geometry={strut} material={materials.woodDeep} matrices={parts.struts} />
    </group>
  );
}
