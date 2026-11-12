/**
 * WORLD LAYOUT — the single source of truth for where everything is.
 *
 * Pure data + maths (no three.js), so it can be validated by unit tests and later reused for
 * avatar movement / collision. Islands, bridges, plazas, paths and building lots are all declared
 * here; the 3D components only read from it. To add a new floating island: add an IslandDef (or
 * `placeSatellite`), a BridgeDef, and its paths/lots — nothing else needs to change.
 *
 * Axes: +x = east, +z = south (towards the default camera), +y = up. Units are metres.
 * Angles are measured from +x towards +z (so 90° = south, 180° = west, 270°/-90° = north).
 */
import { scale } from "../design/scale";
import { mulberry32 } from "./common/noise";

export type Vec2 = readonly [number, number];
export type Vec3 = readonly [number, number, number];

export type ZoneId =
  | "starlight-plaza"
  | "invitation-house"
  | "velvet-ballroom"
  | "photo-garden"
  | "wish-forest"
  | "candy-market"
  | "moonlit-terrace";

export interface IslandDef {
  id: string;
  name: string;
  /** main = village centre, satellite = bridged zone island, decor = distant scenery / expansion slot */
  kind: "main" | "satellite" | "decor";
  center: Vec2;
  /** Height of the walkable top surface. */
  y: number;
  radiusX: number;
  radiusZ: number;
  /** Depth of the rock underside. */
  depth: number;
  seed: number;
}

export interface BridgeDef {
  id: string;
  from: { island: string; angleDeg: number };
  to: { island: string; angleDeg: number };
  width: number;
  /** Extra rise at mid-span. */
  arch: number;
}

export interface Bridge extends BridgeDef {
  start: Vec3;
  end: Vec3;
  length: number;
}

export interface PlazaDef {
  id: string;
  island: string;
  center: Vec2;
  radius: number;
}

export type PathKind = "avenue" | "walk" | "apron";

export interface Path {
  id: string;
  island: string;
  kind: PathKind;
  width: number;
  /** Smoothed centre line, resampled at one paving stone per step. */
  points: Vec2[];
  length: number;
}

export interface LotDef {
  id: string;
  zone: ZoneId;
  island: string;
  center: Vec2;
  /** Local +z is the front (door side). `rotation` turns the lot around Y. */
  rotation: number;
  shape: "rect" | "round";
  /** rect: [width (local x), depth (local z)]; round: [diameter, diameter] */
  size: Vec2;
}

export interface DockDef {
  id: string;
  island: string;
  angleDeg: number;
  width: number;
  length: number;
}

export interface ZoneDef {
  id: ZoneId;
  index: number;
  name: string;
  nameKo: string;
  island: string;
  /** Point the review camera looks at. */
  focus: Vec2;
  /** Review camera framing: distance and the compass angle the camera sits at (0° = south). */
  view: { distance: number; azimuthDeg: number; polarDeg: number };
}

const rad = (deg: number) => (deg * Math.PI) / 180;
const add = (a: Vec2, b: Vec2): Vec2 => [a[0] + b[0], a[1] + b[1]];

// ───────────────────────── island outlines ─────────────────────────

const harmonicCache = new Map<number, { k: number; amp: number; phase: number }[]>();
function harmonics(seed: number) {
  let h = harmonicCache.get(seed);
  if (!h) {
    const rnd = mulberry32(seed);
    h = [
      { k: 3, amp: 0.028 },
      { k: 4, amp: 0.02 },
      { k: 5, amp: 0.016 },
      { k: 7, amp: 0.008 },
    ].map((o) => ({ ...o, phase: rnd() * Math.PI * 2 }));
    harmonicCache.set(seed, h);
  }
  return h;
}

type Outline = Pick<IslandDef, "radiusX" | "radiusZ" | "seed">;

/** Distance from the island centre to its cliff edge in direction `angle` (radians). */
export function islandRadius(def: Outline, angle: number) {
  const c = Math.cos(angle), s = Math.sin(angle);
  const ellipse = (def.radiusX * def.radiusZ) / Math.hypot(def.radiusZ * c, def.radiusX * s);
  let wobble = 1;
  for (const h of harmonics(def.seed)) wobble += h.amp * Math.cos(h.k * angle + h.phase);
  return ellipse * wobble;
}

/** World-space point on the island at `angle`, `fraction` of the way out to the edge. */
export function islandPoint(def: IslandDef, angle: number, fraction = 1): Vec2 {
  const r = islandRadius(def, angle) * fraction;
  return [def.center[0] + Math.cos(angle) * r, def.center[1] + Math.sin(angle) * r];
}

/** 0 at the centre, 1 on the cliff edge. */
export function islandU(def: IslandDef, x: number, z: number) {
  const dx = x - def.center[0], dz = z - def.center[1];
  return Math.hypot(dx, dz) / islandRadius(def, Math.atan2(dz, dx));
}

/** Position a satellite island so a straight bridge of `gap` metres meets both islands radially. */
function placeSatellite(main: IslandDef, angleDeg: number, gap: number, def: Omit<IslandDef, "center">): IslandDef {
  const a = rad(angleDeg);
  const dist = islandRadius(main, a) + gap + islandRadius(def, a + Math.PI);
  return { ...def, center: [main.center[0] + Math.cos(a) * dist, main.center[1] + Math.sin(a) * dist] };
}

// ───────────────────────── islands ─────────────────────────

const GARDEN_ANGLE = 186;
const FOREST_ANGLE = -52;
const TERRACE_ANGLE = 10;
const DOCK_ANGLE = 90;

const main: IslandDef = {
  id: "main", name: "Village Island", kind: "main",
  center: [0, 0], y: 0, radiusX: 41, radiusZ: 35, depth: 19, seed: 11,
};

const garden = placeSatellite(main, GARDEN_ANGLE, 15, {
  id: "garden", name: "Photo Garden Island", kind: "satellite",
  y: -1.2, radiusX: 16, radiusZ: 13.5, depth: 11, seed: 23,
});

const forest = placeSatellite(main, FOREST_ANGLE, 17, {
  id: "forest", name: "Wish Forest Island", kind: "satellite",
  y: 2, radiusX: 18.5, radiusZ: 16, depth: 13, seed: 37,
});

const terrace = placeSatellite(main, TERRACE_ANGLE, 24, {
  id: "terrace", name: "Moonlit Terrace Island", kind: "satellite",
  y: 3.6, radiusX: 12.5, radiusZ: 11.5, depth: 10, seed: 41,
});

export const islands: IslandDef[] = [
  main, garden, forest, terrace,
  // Distant scenery islets — also the reserved slots for future expansion islands.
  { id: "islet-northwest", name: "Expansion slot NW", kind: "decor", center: [-64, -66], y: 7, radiusX: 8, radiusZ: 7, depth: 8, seed: 53 },
  { id: "islet-east", name: "Expansion slot E", kind: "decor", center: [104, -34], y: 11, radiusX: 7, radiusZ: 6, depth: 7, seed: 67 },
  { id: "islet-southwest", name: "Expansion slot SW", kind: "decor", center: [-62, 40], y: -7, radiusX: 6, radiusZ: 5.2, depth: 6, seed: 79 },
];

export const island = (id: string) => {
  const found = islands.find((i) => i.id === id);
  if (!found) throw new Error(`Unknown island: ${id}`);
  return found;
};

// ───────────────────────── bridges ─────────────────────────

/** Fraction of the island radius where bridge decks and gate paths meet. */
export const GATE_INSET = 0.965;
/** How far the walkable surface sits above the island's snow level. */
export const SURFACE_LIFT = 0.06;

const bridgeDefs: BridgeDef[] = [
  { id: "garden-bridge", from: { island: "main", angleDeg: GARDEN_ANGLE }, to: { island: "garden", angleDeg: GARDEN_ANGLE + 180 }, width: scale.bridgeWidth, arch: 0.55 },
  { id: "forest-bridge", from: { island: "main", angleDeg: FOREST_ANGLE }, to: { island: "forest", angleDeg: FOREST_ANGLE + 180 }, width: scale.bridgeWidth, arch: 0.5 },
  { id: "terrace-bridge", from: { island: "main", angleDeg: TERRACE_ANGLE }, to: { island: "terrace", angleDeg: TERRACE_ANGLE + 180 }, width: scale.bridgeWidth, arch: 0.35 },
];

const gate = (islandId: string, angleDeg: number): Vec2 => islandPoint(island(islandId), rad(angleDeg), GATE_INSET);

export const bridges: Bridge[] = bridgeDefs.map((def) => {
  const a = gate(def.from.island, def.from.angleDeg);
  const b = gate(def.to.island, def.to.angleDeg);
  return {
    ...def,
    start: [a[0], island(def.from.island).y + SURFACE_LIFT, a[1]],
    end: [b[0], island(def.to.island).y + SURFACE_LIFT, b[1]],
    length: Math.hypot(b[0] - a[0], b[1] - a[1]),
  };
});

/** Point on the bridge deck centre line, t in [0, 1]. */
export function bridgePoint(b: Bridge, t: number): Vec3 {
  return [
    b.start[0] + (b.end[0] - b.start[0]) * t,
    b.start[1] + (b.end[1] - b.start[1]) * t + b.arch * Math.sin(Math.PI * t),
    b.start[2] + (b.end[2] - b.start[2]) * t,
  ];
}

/** Steepest walking slope along the deck, in degrees. */
export function bridgeMaxSlopeDeg(b: Bridge) {
  let max = 0;
  const n = 64;
  for (let i = 0; i < n; i++) {
    const p = bridgePoint(b, i / n), q = bridgePoint(b, (i + 1) / n);
    max = Math.max(max, Math.abs(q[1] - p[1]) / Math.hypot(q[0] - p[0], q[2] - p[2]));
  }
  return (Math.atan(max) * 180) / Math.PI;
}

// ───────────────────────── arrival deck ─────────────────────────

export const docks: DockDef[] = [{ id: "arrival-deck", island: "main", angleDeg: DOCK_ANGLE, width: 9, length: 6.5 }];

// ───────────────────────── plazas ─────────────────────────

const g = garden.center, f = forest.center, t = terrace.center;

export const plazas: PlazaDef[] = [
  { id: "starlight-plaza", island: "main", center: [0, 0], radius: 12.5 },
  { id: "garden-forecourt", island: "garden", center: add(g, [7.6, 0.2]), radius: 3.9 },
  { id: "wish-clearing", island: "forest", center: add(f, [1.5, -1.5]), radius: 4.8 },
  { id: "wish-nook", island: "forest", center: add(f, [9.2, -7.4]), radius: 2.6 },
  { id: "terrace-deck", island: "terrace", center: add(t, [1.2, 0]), radius: 7.4 },
];

// ───────────────────────── paths ─────────────────────────

function catmullRom(pts: Vec2[], perSegment = 14): Vec2[] {
  if (pts.length < 3) return pts.slice();
  const out: Vec2[] = [];
  const at = (i: number) => pts[Math.min(pts.length - 1, Math.max(0, i))];
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = at(i - 1), p1 = at(i), p2 = at(i + 1), p3 = at(i + 2);
    for (let j = 0; j < perSegment; j++) {
      const u = j / perSegment, u2 = u * u, u3 = u2 * u;
      out.push([
        0.5 * (2 * p1[0] + (-p0[0] + p2[0]) * u + (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * u2 + (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * u3),
        0.5 * (2 * p1[1] + (-p0[1] + p2[1]) * u + (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * u2 + (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * u3),
      ]);
    }
  }
  out.push(pts[pts.length - 1]);
  return out;
}

function resample(pts: Vec2[], spacing: number): { points: Vec2[]; length: number } {
  let length = 0;
  for (let i = 1; i < pts.length; i++) length += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
  const steps = Math.max(1, Math.round(length / spacing));
  const step = length / steps;
  const out: Vec2[] = [pts[0]];
  let seg = 1, walked = 0;
  for (let i = 1; i < steps; i++) {
    const target = i * step;
    for (;;) {
      const d = Math.hypot(pts[seg][0] - pts[seg - 1][0], pts[seg][1] - pts[seg - 1][1]);
      if (walked + d >= target || seg === pts.length - 1) {
        const u = d > 0 ? Math.min(1, (target - walked) / d) : 0;
        out.push([pts[seg - 1][0] + (pts[seg][0] - pts[seg - 1][0]) * u, pts[seg - 1][1] + (pts[seg][1] - pts[seg - 1][1]) * u]);
        break;
      }
      walked += d;
      seg++;
    }
  }
  out.push(pts[pts.length - 1]);
  return { points: out, length };
}

function makePath(id: string, islandId: string, kind: PathKind, width: number, control: Vec2[]): Path {
  return { id, island: islandId, kind, width, ...resample(catmullRom(control), scale.stone) };
}

/** Point and unit tangent `distance` metres along a path. */
export function alongPath(path: Path, distance: number): { point: Vec2; tangent: Vec2 } {
  const i = Math.min(path.points.length - 2, Math.max(0, Math.round((distance / path.length) * (path.points.length - 1))));
  const a = path.points[i], b = path.points[i + 1];
  const d = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
  return { point: a, tangent: [(b[0] - a[0]) / d, (b[1] - a[1]) / d] };
}

const marketStreet = makePath("market-street", "main", "avenue", 5.6, [
  [11.5, 0.4], [21, 1.4], [31, 3.8], gate("main", TERRACE_ANGLE),
]);

// ───────────────────────── building lots ─────────────────────────

/** Front direction of a lot in world space. */
export const lotFront = (lot: LotDef): Vec2 => [Math.sin(lot.rotation), Math.cos(lot.rotation)];
/** World position of the middle of the lot's front edge (where the door is). */
export const lotDoor = (lot: LotDef): Vec2 => {
  const fr = lotFront(lot);
  return [lot.center[0] + fr[0] * lot.size[1] / 2, lot.center[1] + fr[1] * lot.size[1] / 2];
};

/** Market stalls line both sides of the market street, each facing it. */
const STALL: Vec2 = [3.8, 2.8];
const stallLots: LotDef[] = [7.5, 13.5, 19.5].flatMap((s, i) => {
  const { point, tangent } = alongPath(marketStreet, s);
  const normal: Vec2 = [-tangent[1], tangent[0]]; // points to the south side of the street
  // stall fronts stand right at the kerb so customers queue on the paving
  const offset = marketStreet.width / 2 + 0.45 + STALL[1] / 2;
  return ([1, -1] as const).map((side): LotDef => ({
    id: `market-stall-${i * 2 + (side === 1 ? 1 : 2)}`,
    zone: "candy-market",
    island: "main",
    center: [point[0] + normal[0] * offset * side, point[1] + normal[1] * offset * side],
    // face back towards the street
    rotation: Math.atan2(-normal[0] * side, -normal[1] * side),
    shape: "rect",
    size: STALL,
  }));
});

export const lots: LotDef[] = [
  { id: "invitation-house", zone: "invitation-house", island: "main", center: [-22.5, -13], rotation: 0.3, shape: "rect", size: [11, 8.5] },
  { id: "velvet-ballroom", zone: "velvet-ballroom", island: "main", center: [0, -23], rotation: 0, shape: "rect", size: [20, 9.5] },
  { id: "photo-garden", zone: "photo-garden", island: "garden", center: add(g, [-3, 0.2]), rotation: Math.PI / 2, shape: "rect", size: [8, 13] },
  { id: "wish-tree", zone: "wish-forest", island: "forest", center: add(f, [1.5, -1.5]), rotation: 0, shape: "round", size: [2.6, 2.6] },
  ...stallLots,
  { id: "moonlit-gazebo", zone: "moonlit-terrace", island: "terrace", center: add(t, [4.2, 0]), rotation: -Math.PI / 2, shape: "round", size: [6, 6] },
];

export const lotsOf = (zone: ZoneId) => lots.filter((l) => l.zone === zone);
const lot = (id: string) => lots.find((l) => l.id === id)!;

// ───────────────────────── path network ─────────────────────────

const dock = docks[0];
const invitationDoor = lotDoor(lot("invitation-house"));

export const paths: Path[] = [
  // Village island: five routes radiate from Starlight Plaza.
  makePath("south-avenue", "main", "avenue", 5, [[0, 11.5], [0, 22], islandPoint(main, rad(dock.angleDeg), 0.99)]),
  makePath("ballroom-forecourt", "main", "avenue", 7.5, [[0, -11.5], [0, -15], [0, -18.4]]),
  makePath("west-walk", "main", "walk", 4.2, [[-11.5, -0.8], [-20.5, -2.2], [-30.5, -3.4], gate("main", GARDEN_ANGLE)]),
  makePath("forest-walk", "main", "walk", 4.2, [[8.2, -8.6], [15.2, -18], gate("main", FOREST_ANGLE)]),
  marketStreet,
  makePath("invitation-apron", "main", "apron", 3, [invitationDoor, [-20.6, -5.5], [-20.3, -2.4]]),
  // Photo Garden island
  makePath("garden-walk", "garden", "walk", 4, [gate("garden", GARDEN_ANGLE + 180), add(g, [11, 0.9]), add(g, [7.6, 0.2])]),
  makePath("garden-apron", "garden", "apron", 3.2, [add(g, [7.6, 0.2]), lotDoor(lot("photo-garden"))]),
  // Wish Forest island: a winding trail to the clearing, then on to a hidden nook.
  makePath("forest-trail", "forest", "walk", 3.4, [gate("forest", FOREST_ANGLE + 180), add(f, [-6.8, 8.6]), add(f, [-5.2, 3]), add(f, [-1.4, 0.6])]),
  makePath("nook-trail", "forest", "walk", 3, [add(f, [4.6, -3.4]), add(f, [7.6, -4.4]), add(f, [9.2, -7.4])]),
  // Moonlit Terrace island
  makePath("terrace-walk", "terrace", "walk", 4, [gate("terrace", TERRACE_ANGLE + 180), add(t, [-8, -1.2]), add(t, [-5, -0.6])]),
];

// ───────────────────────── zones ─────────────────────────

export const zones: ZoneDef[] = [
  { id: "starlight-plaza", index: 1, name: "Starlight Plaza", nameKo: "중앙 크리스마스 광장", island: "main", focus: [0, 0], view: { distance: 62, azimuthDeg: 0, polarDeg: 60 } },
  { id: "invitation-house", index: 2, name: "Invitation House", nameKo: "크리스마스 우체국", island: "main", focus: lot("invitation-house").center, view: { distance: 40, azimuthDeg: 25, polarDeg: 66 } },
  { id: "velvet-ballroom", index: 3, name: "Velvet Ballroom", nameKo: "빈티지 파티 홀", island: "main", focus: lot("velvet-ballroom").center, view: { distance: 52, azimuthDeg: 0, polarDeg: 68 } },
  { id: "photo-garden", index: 4, name: "Editorial Photo Garden", nameKo: "유리온실 포토부스", island: "garden", focus: garden.center, view: { distance: 46, azimuthDeg: 20, polarDeg: 62 } },
  { id: "wish-forest", index: 5, name: "Secret Wish Forest", nameKo: "비밀의 소원 숲", island: "forest", focus: forest.center, view: { distance: 54, azimuthDeg: -25, polarDeg: 58 } },
  { id: "candy-market", index: 6, name: "Candy Market", nameKo: "크리스마스 마켓", island: "main", focus: alongPath(marketStreet, 13.5).point, view: { distance: 36, azimuthDeg: 12, polarDeg: 60 } },
  { id: "moonlit-terrace", index: 7, name: "Moonlit Terrace", nameKo: "구름 전망대", island: "terrace", focus: terrace.center, view: { distance: 42, azimuthDeg: -30, polarDeg: 62 } },
];

// ───────────────────────── spatial queries ─────────────────────────

function lotSdf(l: LotDef, x: number, z: number) {
  const dx = x - l.center[0], dz = z - l.center[1];
  if (l.shape === "round") return Math.hypot(dx, dz) - l.size[0] / 2;
  const c = Math.cos(l.rotation), s = Math.sin(l.rotation);
  const lx = Math.abs(dx * c - dz * s) - l.size[0] / 2;
  const lz = Math.abs(dx * s + dz * c) - l.size[1] / 2;
  return Math.hypot(Math.max(lx, 0), Math.max(lz, 0)) + Math.min(Math.max(lx, lz), 0);
}

function pathSdf(p: Path, x: number, z: number) {
  let best = Infinity;
  for (const q of p.points) best = Math.min(best, (x - q[0]) ** 2 + (z - q[1]) ** 2);
  return Math.sqrt(best) - p.width / 2;
}

const byIsland = <T extends { island: string }>(items: T[]) => {
  const map = new Map<string, T[]>();
  for (const it of items) map.set(it.island, [...(map.get(it.island) ?? []), it]);
  return map;
};
const plazasBy = byIsland(plazas), pathsBy = byIsland(paths), lotsBy = byIsland(lots);

/** Signed distance to the nearest paved walking surface on an island (negative = on it). */
export function distToWalkway(islandId: string, x: number, z: number) {
  let d = Infinity;
  for (const p of plazasBy.get(islandId) ?? []) d = Math.min(d, Math.hypot(x - p.center[0], z - p.center[1]) - p.radius);
  for (const p of pathsBy.get(islandId) ?? []) d = Math.min(d, pathSdf(p, x, z));
  return d;
}

/** Railing posts stand this far in from the edge of a bridge deck / the dock. */
export const RAIL_INSET = 0.12;
/** The dock railing starts this fraction of the way along the deck (where it leaves the cliff). */
export const DOCK_RAIL_START = 0.32;

/**
 * The first railing posts of every bridge / dock on an island. The cliff fence ties into these,
 * so the safety boundary is continuous from fence to railing.
 */
export function railAnchors(islandId: string): Vec3[] {
  const out: Vec3[] = [];
  for (const b of bridges) {
    const nx = -(b.end[2] - b.start[2]) / b.length, nz = (b.end[0] - b.start[0]) / b.length;
    const h = b.width / 2 - RAIL_INSET;
    for (const [end, id] of [[b.start, b.from.island], [b.end, b.to.island]] as const) {
      if (id === islandId) for (const s of [-1, 1]) out.push([end[0] + nx * h * s, end[1], end[2] + nz * h * s]);
    }
  }
  for (const d of docks) {
    if (d.island !== islandId) continue;
    const fr = dockFrame(d);
    const along = -fr.length / 2 + fr.length * DOCK_RAIL_START, across = fr.width / 2 - RAIL_INSET;
    for (const s of [-1, 1]) out.push([fr.center[0] + fr.dir[0] * along + fr.dir[1] * across * s, fr.y, fr.center[1] + fr.dir[1] * along - fr.dir[0] * across * s]);
  }
  return out;
}

/** Signed distance to the nearest building lot on an island. */
export function distToLot(islandId: string, x: number, z: number) {
  let d = Infinity;
  for (const l of lotsBy.get(islandId) ?? []) d = Math.min(d, lotSdf(l, x, z));
  return d;
}

/** Distance to anything that must stay clear of snow mounds, trees and decoration. */
export const distToBuilt = (islandId: string, x: number, z: number) => Math.min(distToWalkway(islandId, x, z), distToLot(islandId, x, z));

export interface Opening { angle: number; halfWidth: number }

/** Gaps in an island's snow bank and fence: one per bridge landing or dock. */
export function islandOpenings(islandId: string): Opening[] {
  const out: Opening[] = [];
  for (const b of bridges) {
    if (b.from.island === islandId) out.push({ angle: rad(b.from.angleDeg), halfWidth: b.width / 2 + 0.5 });
    if (b.to.island === islandId) out.push({ angle: rad(b.to.angleDeg), halfWidth: b.width / 2 + 0.5 });
  }
  for (const d of docks) if (d.island === islandId) out.push({ angle: rad(d.angleDeg), halfWidth: d.width / 2 + 0.3 });
  return out;
}

/** World-space outline corners of the dock: it starts just inside the cliff edge and projects outwards. */
export function dockFrame(d: DockDef) {
  const isl = island(d.island);
  const a = rad(d.angleDeg);
  const dir: Vec2 = [Math.cos(a), Math.sin(a)];
  const inner = islandRadius(isl, a) * 0.95;
  const mid = inner + (d.length + islandRadius(isl, a) * 0.05) / 2;
  return {
    center: [isl.center[0] + dir[0] * mid, isl.center[1] + dir[1] * mid] as Vec2,
    dir,
    length: d.length + islandRadius(isl, a) * 0.05,
    width: d.width,
    y: isl.y + SURFACE_LIFT,
    rotation: Math.atan2(dir[0], dir[1]),
  };
}

/** True if (x, z) is somewhere an avatar will be able to stand: plaza, path, bridge deck or dock. */
export function isWalkable(x: number, z: number) {
  for (const p of plazas) if (Math.hypot(x - p.center[0], z - p.center[1]) <= p.radius) return true;
  for (const p of paths) if (pathSdf(p, x, z) <= 0) return true;
  for (const b of bridges) {
    const ax = b.start[0], az = b.start[2], bx = b.end[0] - ax, bz = b.end[2] - az;
    const u = Math.min(1, Math.max(0, ((x - ax) * bx + (z - az) * bz) / (bx * bx + bz * bz)));
    if (Math.hypot(x - ax - bx * u, z - az - bz * u) <= b.width / 2) return true;
  }
  for (const d of docks) {
    const fr = dockFrame(d);
    const dx = x - fr.center[0], dz = z - fr.center[1];
    const along = dx * fr.dir[0] + dz * fr.dir[1], across = -dx * fr.dir[1] + dz * fr.dir[0];
    if (Math.abs(along) <= fr.length / 2 && Math.abs(across) <= fr.width / 2) return true;
  }
  return false;
}
