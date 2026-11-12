/**
 * Builds the complete collision description of the world from the same data and geometry
 * builders the visible scene uses — snow, paving, bridge decks and foundations are literally the
 * rendered triangles — so what you see is what you stand on.
 */
import * as THREE from "three";
import { bridgeRailLines, buildDeckGeometry } from "../bridges/bridgeGeometry";
import { FLOOR } from "../buildings/foundation";
import { treeSpots } from "../environment/scatter";
import {
  bridges, DOCK_RAIL_START, dockFrame, docks, island, islands, lots, plazas, RAIL_INSET, SURFACE_LIFT, type LotDef, type Vec3,
} from "../layout";
import { fenceLayout } from "../props/fenceLayout";
import { lampSpots } from "../props/lampPlacement";
import { LAMP_HEIGHT_M } from "../props/lampSpec";
import { buildSnowGeometry } from "../terrain/islandGeometry";
import { buildWalkwayGeometries } from "../terrain/walkwayGeometry";
import { zoneBlockers, type LocalBlocker } from "./blockers";
import type { CollisionGroup, CollisionShape, MeshShape } from "./shapes";

/** Barriers reach this far above the walking surface — well over the railings, under any roof. */
const BARRIER_HEIGHT = 1.6;
const BARRIER_THICKNESS = 0.3;

function meshShape(geo: THREE.BufferGeometry, group: CollisionGroup, tag: string, matrix?: THREE.Matrix4): MeshShape {
  // indexed geometry and plain triangle soups are both supported
  const pos = geo.getAttribute("position");
  const vertices = new Float32Array(pos.count * 3);
  const v = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    if (matrix) v.applyMatrix4(matrix);
    vertices.set([v.x, v.y, v.z], i * 3);
  }
  const indices = geo.index ? new Uint32Array(geo.index.array) : Uint32Array.from({ length: pos.count }, (_, i) => i);
  return { kind: "mesh", group, tag, vertices, indices };
}

/** Upright wall between two points (y = their walking height). */
export function wallBetween(a: Vec3, b: Vec3, group: CollisionGroup, tag: string, height = BARRIER_HEIGHT, below = 0.3): CollisionShape {
  const dx = b[0] - a[0], dz = b[2] - a[2];
  const len = Math.hypot(dx, dz);
  const bottom = Math.min(a[1], b[1]) - below, top = Math.max(a[1], b[1]) + height;
  return {
    kind: "box", group, tag,
    center: [(a[0] + b[0]) / 2, (bottom + top) / 2, (a[2] + b[2]) / 2],
    half: [len / 2 + BARRIER_THICKNESS / 2, (top - bottom) / 2, BARRIER_THICKNESS / 2],
    rotY: Math.atan2(-dz, dx),
  };
}

/** lot-local → world */
export function lotToWorld(lot: LotDef, x: number, z: number): [number, number] {
  const c = Math.cos(lot.rotation), s = Math.sin(lot.rotation);
  return [lot.center[0] + x * c + z * s, lot.center[1] - x * s + z * c];
}

function blockerShape(lot: LotDef, b: LocalBlocker): CollisionShape {
  const [x, z] = lotToWorld(lot, b.x, b.z);
  const floor = island(lot.island).y + FLOOR + (b.y ?? 0);
  const group = b.group ?? "building";
  const tag = `building:${lot.id}`;
  if (b.kind === "cylinder") return { kind: "cylinder", group, tag, center: [x, floor + b.h / 2, z], radius: b.r, halfHeight: b.h / 2 };
  return { kind: "box", group, tag, center: [x, floor + b.h / 2, z], half: [b.w / 2, b.h / 2, b.d / 2], rotY: lot.rotation };
}

export function buildCollision(): CollisionShape[] {
  const shapes: CollisionShape[] = [];
  const walkable = islands.filter((i) => i.kind !== "decor");

  // ── ground: the rendered snow, paving, bridge decks and foundations ──
  for (const def of walkable) shapes.push(meshShape(buildSnowGeometry(def), "terrain", `snow:${def.id}`));
  for (const w of buildWalkwayGeometries()) shapes.push(meshShape(w.geometry, "terrain", `paving:${w.island}`));
  for (const b of bridges) shapes.push(meshShape(buildDeckGeometry(b), "terrain", `bridge:${b.id}`));
  // foundation slabs: same footprint and height as foundationGeometry (top at FLOOR, bevel included)
  for (const lot of lots) {
    const y = island(lot.island).y, top = y + FLOOR, bottom = y - 0.35;
    const center: Vec3 = [lot.center[0], (top + bottom) / 2, lot.center[1]];
    if (lot.shape === "round") shapes.push({ kind: "cylinder", group: "terrain", tag: `foundation:${lot.id}`, center, radius: lot.size[0] / 2 + 0.05, halfHeight: (top - bottom) / 2 });
    else shapes.push({ kind: "box", group: "terrain", tag: `foundation:${lot.id}`, center, half: [lot.size[0] / 2 + 0.05, (top - bottom) / 2, lot.size[1] / 2 + 0.05], rotY: lot.rotation });
  }
  for (const d of docks) {
    const fr = dockFrame(d);
    shapes.push({ kind: "box", group: "terrain", tag: `dock:${d.id}`, center: [fr.center[0], fr.y - 0.2, fr.center[1]], half: [fr.width / 2, 0.2, fr.length / 2], rotY: fr.rotation });
  }

  // ── buildings ──
  for (const lot of lots) {
    if (lot.zone === "starlight-plaza") continue;
    for (const b of zoneBlockers[lot.zone](lot)) shapes.push(blockerShape(lot, b));
  }
  // the great tree's planter in the middle of Starlight Plaza
  const plaza = plazas[0], py = island(plaza.island).y + SURFACE_LIFT;
  shapes.push({ kind: "cylinder", group: "building", tag: "building:plaza-tree", center: [plaza.center[0], py + 2, plaza.center[1]], radius: 4.72, halfHeight: 2 });

  // ── props ──
  for (const t of treeSpots) {
    if (!walkable.some((d) => Math.hypot(t.x - d.center[0], t.z - d.center[1]) < Math.max(d.radiusX, d.radiusZ) * 1.2)) continue;
    shapes.push({ kind: "cylinder", group: "prop", tag: "tree", center: [t.x, t.y + 2.4 * t.scale, t.z], radius: 1.1 * t.scale, halfHeight: 2.4 * t.scale });
  }
  for (const l of lampSpots) shapes.push({ kind: "cylinder", group: "prop", tag: "lamp", center: [l.x, l.y + LAMP_HEIGHT_M / 2, l.z], radius: 0.24, halfHeight: LAMP_HEIGHT_M / 2 });

  // ── safety barriers: cliff fences, bridge railings, arrival-deck railing ──
  for (const def of walkable) for (const [a, b] of fenceLayout(def).segments) shapes.push(wallBetween(a, b, "barrier", `fence:${def.id}`));
  for (const b of bridges) {
    for (const line of bridgeRailLines(b)) for (let i = 0; i < line.length - 1; i++) shapes.push(wallBetween(line[i], line[i + 1], "barrier", `rail:${b.id}`, BARRIER_HEIGHT, 0.6));
  }
  for (const d of docks) {
    const fr = dockFrame(d);
    const c = Math.cos(fr.rotation), s = Math.sin(fr.rotation);
    const w = (x: number, z: number): Vec3 => [fr.center[0] + x * c + z * s, fr.y, fr.center[1] - x * s + z * c];
    const x = fr.width / 2 - RAIL_INSET, z0 = -fr.length / 2 + fr.length * DOCK_RAIL_START, z1 = fr.length / 2 - RAIL_INSET;
    for (const [a, b] of [[w(-x, z0), w(-x, z1)], [w(-x, z1), w(x, z1)], [w(x, z1), w(x, z0)]] as const) shapes.push(wallBetween(a, b, "barrier", `rail:${d.id}`, BARRIER_HEIGHT, 0.6));
  }
  return shapes;
}

/** Safe start: south edge of Starlight Plaza, facing the tree with room to look around. */
export const SPAWN = { position: [0, island("main").y + SURFACE_LIFT, 10.5] as Vec3, yaw: Math.PI };

