import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { island, zones } from "../layout";

const HEIGHT: Record<string, number> = { "starlight-plaza": 18, "velvet-ballroom": 23, "invitation-house": 15, "photo-garden": 10, "wish-forest": 12, "candy-market": 7, "moonlit-terrace": 10 };
const anchors = zones.map((z) => ({ id: z.id, position: new THREE.Vector3(z.focus[0], island(z.island).y + (HEIGHT[z.id] ?? 10), z.focus[1]) }));
const v = new THREE.Vector3();

export const zoneLabelId = (zone: string) => `zone-label-${zone}`;

/**
 * Keeps the HTML zone tags (rendered by ui/Overlay) pinned to their zones: projects each anchor
 * to the screen every frame and moves the matching DOM element.
 */
export function ZoneLabelProjector() {
  useFrame(({ camera, size }) => {
    for (const a of anchors) {
      const el = document.getElementById(zoneLabelId(a.id));
      if (!el) continue;
      v.copy(a.position).project(camera);
      const visible = v.z < 1 && Math.abs(v.x) < 1.1 && Math.abs(v.y) < 1.1;
      el.style.opacity = visible ? "1" : "0";
      el.style.transform = `translate(-50%, -50%) translate(${((v.x + 1) / 2) * size.width}px, ${((1 - v.y) / 2) * size.height}px)`;
    }
  });
  return null;
}
