import * as THREE from "three";
import type { LotDef } from "../layout";

/** Height of the stone foundation slab above the snow. Buildings are modelled from its top (+0.05 bevel). */
export const FOUNDATION = 0.2;
/** Local y of the floor buildings are modelled on (top of the slab including its bevel). */
export const FLOOR = FOUNDATION + 0.05;

/** Rounded slab marking the plot, in lot-local space. Also the slab's collision surface. */
export function foundationGeometry(lot: LotDef) {
  const [w, d] = lot.size;
  const shape = new THREE.Shape();
  if (lot.shape === "round") shape.absarc(0, 0, w / 2, 0, Math.PI * 2, false);
  else {
    const r = Math.min(1.1, w / 4, d / 4), x = w / 2, y = d / 2;
    shape.moveTo(-x + r, -y);
    shape.lineTo(x - r, -y); shape.quadraticCurveTo(x, -y, x, -y + r);
    shape.lineTo(x, y - r); shape.quadraticCurveTo(x, y, x - r, y);
    shape.lineTo(-x + r, y); shape.quadraticCurveTo(-x, y, -x, y - r);
    shape.lineTo(-x, -y + r); shape.quadraticCurveTo(-x, -y, -x + r, -y);
  }
  const geo = new THREE.ExtrudeGeometry(shape, { depth: FOUNDATION + 0.3, bevelEnabled: true, bevelSize: 0.05, bevelThickness: 0.05, bevelSegments: 2, curveSegments: 20 });
  geo.rotateX(-Math.PI / 2); // extrude upwards; shape y becomes -z
  geo.translate(0, -0.3, 0);
  return geo;
}
