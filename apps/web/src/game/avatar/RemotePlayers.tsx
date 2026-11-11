import { useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { groundHeight } from "@sky/shared";
import { INTERP_DELAY_MS, lerpAngle, net, sampleRemote, useRoster } from "../../net/client";
import { AvatarModel, specForColor, type AvatarAnim } from "./Avatar";

/** One remote visitor: samples the interpolation buffer each frame (decoupled from network cadence). */
function RemotePlayer({ id }: { id: string }) {
  const group = useRef<THREE.Group>(null);
  const anim = useRef<AvatarAnim>({ moving: false }).current;
  const out = useRef({ x: 0, z: 0, ry: 0, moving: false }).current;
  const first = useRef(true);
  const r = net.remotes.get(id);

  useFrame((_, dt) => {
    const rp = net.remotes.get(id);
    const g = group.current;
    if (!rp || !g) return;
    sampleRemote(rp, performance.now() - INTERP_DELAY_MS, out);
    const gy = groundHeight(out.x, out.z);
    if (first.current) {
      g.position.set(out.x, gy, out.z);
      g.rotation.y = out.ry;
      first.current = false;
    } else {
      g.position.x = out.x;
      g.position.z = out.z;
      g.position.y += (gy - g.position.y) * Math.min(1, dt * 14);
      g.rotation.y = lerpAngle(g.rotation.y, out.ry, Math.min(1, dt * 14));
    }
    anim.moving = out.moving;
  });

  if (!r) return null;
  return (
    <group ref={group}>
      <AvatarModel spec={specForColor(r.info.color)} anim={anim} name={r.info.name} />
    </group>
  );
}

export function RemotePlayers() {
  const ids = useRoster((s) => s.ids);
  return (
    <>
      {ids.map((id) => (
        <RemotePlayer key={id} id={id} />
      ))}
    </>
  );
}
