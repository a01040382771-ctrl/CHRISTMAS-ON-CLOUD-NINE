/**
 * Cliff-fence geometry as pure data. The visible fence (CliffFence.tsx) and the invisible
 * collision barrier (world/collision) are both built from this, so they always line up.
 */
import { scale } from "../../design/scale";
import { distToWalkway, islandPoint, railAnchors, type IslandDef, type Vec3 } from "../layout";
import { groundY } from "../terrain/ground";

/** How far in from the cliff the safety fence stands (fraction of the island radius). */
export const FENCE_INSET = 0.905;

export interface FenceLayout {
  /** Base of every post (on the snow). */
  posts: Vec3[];
  /** Fence runs between two post bases; rails hang between them. */
  segments: [Vec3, Vec3][];
}

/**
 * Posts every ~2.4 m along the cliff, a gap wherever a walkway reaches the edge, and short tie-in
 * runs from the fence ends to the first railing posts of each bridge / the dock, so the safety
 * boundary is continuous.
 */
export function fenceLayout(def: IslandDef): FenceLayout {
  const meanR = (def.radiusX + def.radiusZ) / 2;
  const count = Math.round((Math.PI * 2 * meanR * FENCE_INSET) / 2.4);
  const spots = Array.from({ length: count }, (_, i) => {
    const [x, z] = islandPoint(def, (i / count) * Math.PI * 2, FENCE_INSET);
    return { p: [x, groundY(def, x, z) - 0.06, z] as Vec3, open: distToWalkway(def.id, x, z) < 0.5 };
  });
  const posts: Vec3[] = [];
  const segments: [Vec3, Vec3][] = [];
  spots.forEach((s, i) => {
    if (s.open) return;
    posts.push(s.p);
    const n = spots[(i + 1) % count];
    if (!n.open) segments.push([s.p, n.p]);
  });
  if (spots.every((s) => !s.open)) return { posts, segments };

  // Each gap (a run of open spots) is closed off by tying its two fence ends to the railing posts
  // of the bridge / deck that fills it — the counter-clockwise end to the counter-clockwise anchor.
  const anchors = railAnchors(def.id).map((p) => ({ p, a: Math.atan2(p[2] - def.center[1], p[0] - def.center[0]) }));
  const step = (Math.PI * 2) / count;
  const first = spots.findIndex((s) => !s.open);
  for (let k = 0; k < count; k++) {
    const i = (first + k) % count;
    if (spots[i].open || !spots[(i + 1) % count].open) continue;
    let j = (i + 1) % count;
    while (spots[j].open) j = (j + 1) % count;
    const gapWidth = ((j - i + count) % count) * step, mid = i * step + gapWidth / 2;
    // anchors around the gap (railings can stand a little wider than the opening itself)
    const inGap = anchors
      .map((an) => ({ ...an, rel: wrapSigned(an.a - mid) }))
      .filter((an) => Math.abs(an.rel) <= gapWidth / 2 + step * 1.5)
      .sort((x, y) => x.rel - y.rel);
    if (inGap.length === 0) { segments.push([spots[i].p, spots[j].p]); continue; }
    tie(spots[i].p, inGap[0].p, posts, segments);
    tie(spots[j].p, inGap[inGap.length - 1].p, posts, segments);
  }
  return { posts, segments };
}

const wrapSigned = (a: number) => Math.atan2(Math.sin(a), Math.cos(a));

function tie(end: Vec3, anchor: Vec3, posts: Vec3[], segments: [Vec3, Vec3][]) {
  const mid: Vec3 = [(end[0] + anchor[0]) / 2, (end[1] + anchor[1]) / 2, (end[2] + anchor[2]) / 2];
  posts.push(mid);
  segments.push([end, mid], [mid, anchor]);
}


/** Heights of the two rails above the post base. */
export const FENCE_RAILS = [scale.railingHeight - 0.08, 0.52] as const;
