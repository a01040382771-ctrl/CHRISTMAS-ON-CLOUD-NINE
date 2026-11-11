/**
 * Village layout + collision, in 2D (x, z). North is -z.
 *
 * This module is the single source of truth for WHERE avatars may walk. The
 * server runs it to validate movement; the client runs the very same code for
 * prediction; the 3D scene reads the same data to place islands, bridges and
 * buildings so that what you see is exactly what you collide with.
 *
 * Units are metres. Avatar: radius 0.4, height 1.6.
 */
import { AVATAR_RADIUS, EDGE_MARGIN } from "./constants";

export interface Vec2 {
  x: number;
  z: number;
}

// ───────────────────────── walkable ground ─────────────────────────

export type WalkShape =
  | { kind: "circle"; id: string; x: number; z: number; r: number }
  | { kind: "rect"; id: string; x: number; z: number; hx: number; hz: number };

/** Main island (plaza + village ring). */
export const MAIN_ISLAND = { x: 0, z: 0, r: 23 };
/** East bridge, from main island rim to the small island. */
/**
 * x0..x1 is the walkable corridor and deliberately reaches well INTO both
 * islands (after the cliff margin is applied, the shapes must still overlap).
 * spanStart..spanEnd is the visible stretch between the two rims where the deck arches.
 */
export const BRIDGE = { x0: 19, x1: 36, z: 0, halfWidth: 1.9, arch: 0.55, spanStart: 22.2, spanEnd: 33.8 };
/** Small floating island across the bridge. */
export const SMALL_ISLAND = { x: 41.5, z: 0, r: 8.5 };
export const PLAZA_RADIUS = 13.4;
/** The rock body is wider than the walkable disc: a snowy, fenced rim sits outside the cliff margin. */
export const ISLAND_VISUAL_R = 25.5;
export const SMALL_ISLAND_VISUAL_R = 10.2;
/** Fence ring sits just beyond the walkable limit (radius 23 − 0.75 = 22.25). */
export const FENCE_RADIUS = 22.65;

export const WALKABLE: WalkShape[] = [
  { kind: "circle", id: "main", x: MAIN_ISLAND.x, z: MAIN_ISLAND.z, r: MAIN_ISLAND.r },
  {
    kind: "rect",
    id: "bridge",
    x: (BRIDGE.x0 + BRIDGE.x1) / 2,
    z: BRIDGE.z,
    hx: (BRIDGE.x1 - BRIDGE.x0) / 2,
    hz: BRIDGE.halfWidth,
  },
  { kind: "circle", id: "small", x: SMALL_ISLAND.x, z: SMALL_ISLAND.z, r: SMALL_ISLAND.r },
];

// ───────────────────────── solid obstacles ─────────────────────────

export type Obstacle =
  | { kind: "circle"; id: string; x: number; z: number; r: number }
  /** oriented box; `rot` = rotation around Y (radians), same convention as three.js */
  | { kind: "box"; id: string; x: number; z: number; hx: number; hz: number; rot: number };

/** Building placement shared with the renderer. `rot` makes the door (local +z) face the plaza. */
export interface BuildingSpec {
  id: string;
  x: number;
  z: number;
  rot: number;
}

/** Rotation so that local +z points from (x,z) toward (tx,tz). */
export function facing(x: number, z: number, tx: number, tz: number): number {
  return Math.atan2(tx - x, tz - z);
}

export const BUILDINGS = {
  invitation: { id: "invitation", x: 0, z: -16, rot: 0 },
  market: { id: "market", x: -13.6, z: -9.4, rot: facing(-13.6, -9.4, 0, 0) },
  ballroom: { id: "ballroom", x: 13.6, z: -9.4, rot: facing(13.6, -9.4, 0, 0) },
  tower: { id: "tower", x: -16.2, z: 3.4, rot: facing(-16.2, 3.4, 0, 0) },
  cottage: { id: "cottage", x: 43.6, z: -2.2, rot: facing(43.6, -2.2, 34, 0) },
} satisfies Record<string, BuildingSpec>;

/** Giant tree on the plaza. */
export const TREE = { x: 0, z: 0.5, r: 2.3 };
export const SMALL_TREE = { x: 39.2, z: 3.9, r: 0.9 };
export const STAGE = { x: -6.0, z: 6.4, r: 3.4, height: 0.32 };

export interface BenchSpec { x: number; z: number; rot: number }
export interface LampSpec { x: number; z: number; tall?: boolean }

export const BENCHES: BenchSpec[] = [
  { x: 6.9, z: 0.1, rot: facing(6.9, 0.1, TREE.x, TREE.z) },
  { x: 6.2, z: -3.3, rot: facing(6.2, -3.3, TREE.x, TREE.z) },
  { x: -6.9, z: 0.1, rot: facing(-6.9, 0.1, TREE.x, TREE.z) },
  { x: -6.2, z: -3.3, rot: facing(-6.2, -3.3, TREE.x, TREE.z) },
];

const LAMP_RING = 10.6;
export const LAMPS: LampSpec[] = [
  ...Array.from({ length: 8 }, (_, i) => {
    const a = (i / 8) * Math.PI * 2 + Math.PI / 8;
    return { x: Math.sin(a) * LAMP_RING, z: Math.cos(a) * LAMP_RING, tall: true } as LampSpec;
  }),
  // bridge lamps
  { x: 22.6, z: -1.9 }, { x: 22.6, z: 1.9 },
  { x: 33.4, z: -1.9 }, { x: 33.4, z: 1.9 },
];

/** Small pines scattered in the ring behind the plaza (collidable). */
export const PINES = [
  { x: -8.3, z: -12.9, s: 1.0 }, { x: 8.3, z: -12.9, s: 1.0 },
  { x: -14.8, z: 9.2, s: 1.15 }, { x: 15.0, z: 9.0, s: 1.1 },
  { x: -11.8, z: 15.0, s: 1.0 }, { x: 11.8, z: 15.0, s: 1.0 },
  { x: -3.5, z: 19.0, s: 0.9 }, { x: 3.5, z: 19.0, s: 0.9 },
];

export const SNOWMEN = [
  { x: -4.4, z: -6.6 },
  { x: 4.6, z: -6.4 },
];

/** Light-string poles flanking the stage, at the rear (away from the tree). */
export const STAGE_POLES = [-1, 1].map((side) => {
  const rear = Math.atan2(STAGE.x - TREE.x, STAGE.z - TREE.z); // direction tree → stage (as yaw)
  const a = rear + side * 0.95;
  return { x: STAGE.x + Math.sin(a) * (STAGE.r + 0.45), z: STAGE.z + Math.cos(a) * (STAGE.r + 0.45) };
});

export const OBSTACLES: Obstacle[] = [
  { kind: "circle", id: "tree", x: TREE.x, z: TREE.z, r: TREE.r },
  // Invitation House: round body
  { kind: "circle", id: "invitation", x: BUILDINGS.invitation.x, z: BUILDINGS.invitation.z, r: 4.15 },
  // Candy Market cottage 6 x 5
  { kind: "box", id: "market", x: BUILDINGS.market.x, z: BUILDINGS.market.z, hx: 3.1, hz: 2.6, rot: BUILDINGS.market.rot },
  // Velvet Ballroom: round hall
  { kind: "circle", id: "ballroom", x: BUILDINGS.ballroom.x, z: BUILDINGS.ballroom.z, r: 3.6 },
  { kind: "circle", id: "tower", x: BUILDINGS.tower.x, z: BUILDINGS.tower.z, r: 2.5 },
  // small island
  { kind: "box", id: "cottage", x: BUILDINGS.cottage.x, z: BUILDINGS.cottage.z, hx: 2.6, hz: 2.3, rot: BUILDINGS.cottage.rot },
  { kind: "circle", id: "small-tree", x: SMALL_TREE.x, z: SMALL_TREE.z, r: SMALL_TREE.r },
  ...BENCHES.map((b, i) => ({ kind: "box" as const, id: `bench-${i}`, x: b.x, z: b.z, hx: 0.95, hz: 0.38, rot: b.rot })),
  ...PINES.map((m, i) => ({ kind: "circle" as const, id: `pine-${i}`, x: m.x, z: m.z, r: 0.55 * m.s })),
  ...SNOWMEN.map((m, i) => ({ kind: "circle" as const, id: `snowman-${i}`, x: m.x, z: m.z, r: 0.5 })),
  ...STAGE_POLES.map((m, i) => ({ kind: "circle" as const, id: `pole-${i}`, x: m.x, z: m.z, r: 0.2 })),
  ...LAMPS.map((l, i) => ({ kind: "circle" as const, id: `lamp-${i}`, x: l.x, z: l.z, r: 0.22 })),
];

// ───────────────────────── ground height ─────────────────────────

/** Walking surface height: bridge arch and the low stage. Flat (0) elsewhere. */
export function groundHeight(x: number, z: number): number {
  if (x > BRIDGE.spanStart && x < BRIDGE.spanEnd && Math.abs(z - BRIDGE.z) < BRIDGE.halfWidth + 0.5) {
    const t = (x - BRIDGE.spanStart) / (BRIDGE.spanEnd - BRIDGE.spanStart);
    return Math.sin(t * Math.PI) * BRIDGE.arch;
  }
  const d = Math.hypot(x - STAGE.x, z - STAGE.z);
  if (d < STAGE.r) return STAGE.height;
  if (d < STAGE.r + 0.5) return STAGE.height * (1 - (d - STAGE.r) / 0.5);
  return 0;
}

// ───────────────────────── collision maths ─────────────────────────

function clamp(v: number, lo: number, hi: number) {
  return v < lo ? lo : v > hi ? hi : v;
}

function nearestInShape(s: WalkShape, px: number, pz: number, shrink: number, out: Vec2) {
  if (s.kind === "circle") {
    const r = Math.max(0.01, s.r - shrink);
    const dx = px - s.x;
    const dz = pz - s.z;
    const d = Math.hypot(dx, dz);
    if (d <= r) {
      out.x = px;
      out.z = pz;
    } else {
      out.x = s.x + (dx / d) * r;
      out.z = s.z + (dz / d) * r;
    }
  } else {
    const hx = Math.max(0.01, s.hx - shrink);
    const hz = Math.max(0.01, s.hz - shrink);
    out.x = clamp(px, s.x - hx, s.x + hx);
    out.z = clamp(pz, s.z - hz, s.z + hz);
  }
}

const _tmp: Vec2 = { x: 0, z: 0 };

/**
 * Pull a point back onto walkable ground. The walkable area is the union of
 * convex shapes, so the nearest valid point is the nearest among each shape's
 * nearest point. Sliding along cliffs falls out naturally.
 */
export function constrainToGround(p: Vec2, radius = AVATAR_RADIUS): void {
  const shrink = radius + EDGE_MARGIN;
  let bestD = Infinity;
  let bx = p.x;
  let bz = p.z;
  for (const s of WALKABLE) {
    nearestInShape(s, p.x, p.z, shrink, _tmp);
    const d = (_tmp.x - p.x) ** 2 + (_tmp.z - p.z) ** 2;
    if (d < bestD) {
      bestD = d;
      bx = _tmp.x;
      bz = _tmp.z;
      if (d === 0) break;
    }
  }
  p.x = bx;
  p.z = bz;
}

/** Push a point out of every obstacle (circle / OBB expanded by the avatar radius). */
export function pushOutOfObstacles(p: Vec2, radius = AVATAR_RADIUS): void {
  for (const o of OBSTACLES) {
    if (o.kind === "circle") {
      const dx = p.x - o.x;
      const dz = p.z - o.z;
      const min = o.r + radius;
      const d2 = dx * dx + dz * dz;
      if (d2 < min * min) {
        const d = Math.sqrt(d2) || 1e-4;
        p.x = o.x + (dx / d) * min;
        p.z = o.z + (dz / d) * min;
      }
    } else {
      // world → box-local: inverse rotation about Y
      const c = Math.cos(o.rot);
      const s = Math.sin(o.rot);
      const dx = p.x - o.x;
      const dz = p.z - o.z;
      const lx = dx * c - dz * s;
      const lz = dx * s + dz * c;
      const hx = o.hx + radius;
      const hz = o.hz + radius;
      if (Math.abs(lx) < hx && Math.abs(lz) < hz) {
        const px = hx - Math.abs(lx);
        const pz = hz - Math.abs(lz);
        let nx = lx;
        let nz = lz;
        if (px < pz) nx = (lx < 0 ? -1 : 1) * hx;
        else nz = (lz < 0 ? -1 : 1) * hz;
        // local → world
        p.x = o.x + nx * c + nz * s;
        p.z = o.z - nx * s + nz * c;
      }
    }
  }
}

/** True if a disc of `radius` at (x,z) overlaps any obstacle. */
export function overlapsObstacle(x: number, z: number, radius = 0): boolean {
  const p = { x, z };
  pushOutOfObstacles(p, radius);
  return Math.abs(p.x - x) > 1e-9 || Math.abs(p.z - z) > 1e-9;
}

export function isWalkable(x: number, z: number, radius = AVATAR_RADIUS): boolean {
  const p = { x, z };
  constrainToGround(p, radius);
  if (Math.abs(p.x - x) > 1e-6 || Math.abs(p.z - z) > 1e-6) return false;
  return !overlapsObstacle(x, z, radius);
}

/**
 * Integrate one movement step with full collision. Mutates `pos`.
 * Iterates ground/obstacle resolution so corners (cliff + building) settle.
 */
export function stepMovement(pos: Vec2, dx: number, dz: number, radius = AVATAR_RADIUS): void {
  pos.x += dx;
  pos.z += dz;
  for (let i = 0; i < 3; i++) {
    pushOutOfObstacles(pos, radius);
    constrainToGround(pos, radius);
  }
}

// ───────────────────────── spawn & zones ─────────────────────────

/** Visitors arrive on the south side of the plaza, looking toward the tree. */
export function pickSpawn(index: number): Vec2 {
  const ring = 6.6 + (index % 3) * 1.2;
  const a = ((index * 0.62) % 1.9) - 0.95; // arc around +z (south)
  const p = { x: Math.sin(a) * ring, z: Math.cos(a) * ring + 0.5 };
  for (let i = 0; i < 8 && !isWalkable(p.x, p.z); i++) {
    p.x *= 0.9;
    p.z *= 0.9;
  }
  return p;
}
export const DEFAULT_SPAWN: Vec2 = { x: 0, z: 8.5 };

export type ZoneStatus = "live" | "teaser" | "planned";
export interface ZoneSpec {
  id: string;
  name: string;
  ko: string;
  status: ZoneStatus;
  /** where the avatar stands to interact (the doorstep) */
  anchor: Vec2;
  radius: number;
}

/** The seven districts. Only positions + routes are fixed now; content comes in later phases. */
export const ZONES: ZoneSpec[] = [
  { id: "plaza", name: "Starlight Plaza", ko: "스타라이트 광장", status: "live", anchor: { x: 0, z: 8 }, radius: 6 },
  { id: "invitation", name: "Invitation House", ko: "초대장 우체국", status: "teaser", anchor: { x: 0, z: -10.4 }, radius: 2.6 },
  { id: "ballroom", name: "Velvet Ballroom", ko: "벨벳 볼룸", status: "teaser", anchor: { x: 9.5, z: -6.6 }, radius: 2.6 },
  { id: "market", name: "Candy Market", ko: "캔디 마켓", status: "teaser", anchor: { x: -10.0, z: -6.9 }, radius: 2.6 },
  { id: "moonlit", name: "Moonlit Terrace", ko: "달빛 전망대", status: "planned", anchor: { x: -12.1, z: 2.5 }, radius: 2.6 },
  { id: "wish-forest", name: "Secret Wish Forest", ko: "소원 숲", status: "teaser", anchor: { x: 38.4, z: 1.4 }, radius: 3.2 },
  { id: "photo-garden", name: "Editorial Photo Garden", ko: "포토부스 정원", status: "planned", anchor: { x: 0, z: 17 }, radius: 3 },
];

/**
 * Reserved sky-island slots for future districts: decorative for now, with the
 * planned bridge route so new zones plug in without reshuffling the layout.
 */
export const EXPANSION_SLOTS = [
  { id: "slot-west", zone: "photo-garden", x: -46, z: 8, r: 7, bridgeFrom: { x: -21.5, z: 0 } },
  { id: "slot-north-east", zone: "moonlit", x: 32, z: -36, r: 6, bridgeFrom: { x: 15.5, z: -16.5 } },
  { id: "slot-far-south", zone: "photo-garden", x: -8, z: 48, r: 7.5, bridgeFrom: { x: 0, z: 21.5 } },
];
