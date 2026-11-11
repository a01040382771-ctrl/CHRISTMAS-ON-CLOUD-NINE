import * as THREE from "three";

/**
 * Nickname labels as plain DOM elements in a fixed overlay layer, positioned every frame
 * from the avatar's world position. No React portals (drei <Html> raised removeChild
 * errors in production builds when avatars unmount) and no per-label React updates.
 */
interface Tag {
  el: HTMLDivElement;
  obj: THREE.Object3D;
}
const tags = new Set<Tag>();
const v = new THREE.Vector3();

export function addTag(name: string, self: boolean, obj: THREE.Object3D): () => void {
  const layer = document.getElementById("nametag-layer");
  if (!layer) return () => {};
  const el = document.createElement("div");
  el.className = `nametag${self ? " self" : ""}`;
  el.textContent = name; // textContent: never parsed as HTML
  el.style.display = "none";
  layer.appendChild(el);
  const tag = { el, obj };
  tags.add(tag);
  return () => {
    tags.delete(tag);
    el.remove();
  };
}

export function projectTags(camera: THREE.Camera, width: number, height: number) {
  for (const t of tags) {
    t.obj.getWorldPosition(v);
    v.project(camera);
    if (v.z > 1 || v.z < -1 || Math.abs(v.x) > 1.2 || Math.abs(v.y) > 1.2) {
      t.el.style.display = "none";
      continue;
    }
    t.el.style.display = "block";
    t.el.style.transform = `translate(${((v.x + 1) / 2) * width}px, ${((1 - v.y) / 2) * height}px) translate(-50%, -50%)`;
  }
}
