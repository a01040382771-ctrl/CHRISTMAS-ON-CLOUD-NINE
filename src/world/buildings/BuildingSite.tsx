import { useMemo, type ReactNode } from "react";
import * as THREE from "three";
import { materials } from "../../design";
import { island, type LotDef } from "../layout";

/** Height of the stone foundation slab above the snow. Buildings are modelled from its top. */
export const FOUNDATION = 0.2;

function foundationGeometry(lot: LotDef) {
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

/**
 * A building lot: places its children at the lot's position/rotation on the right island and
 * draws the stone foundation that marks the plot. Children are modelled in local space with
 * y = 0 at the top of the foundation and +z facing the door side.
 */
export function BuildingSite({ lot, children }: { lot: LotDef; children?: ReactNode }) {
  const geometry = useMemo(() => foundationGeometry(lot), [lot]);
  const y = island(lot.island).y;
  return (
    <group name={`lot:${lot.id}`} position={[lot.center[0], y, lot.center[1]]} rotation={[0, lot.rotation, 0]}>
      <mesh geometry={geometry} material={materials.pad} receiveShadow castShadow />
      <group position={[0, FOUNDATION + 0.05, 0]}>{children}</group>
    </group>
  );
}
