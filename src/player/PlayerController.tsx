import { useEffect, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useRapier } from "@react-three/rapier";
import * as THREE from "three";
import { CharacterMotor, groundAt } from "../physics/CharacterMotor";
import { SPAWN } from "../world/collision/buildCollision";
import { Avatar } from "./avatar/Avatar";
import type { AvatarPose } from "./avatar/animation";
import { devHandle } from "../devHandle";
import { input, readMove } from "./input";
import { localPlayer } from "./localPlayer";
import { MOVE, settle, steer, worldDirection } from "./movement";

/** Anything below this is a fall: return to the start point. */
export const FALL_LIMIT = -25;
/** Catch up at most this much simulation per rendered frame (avoids a spiral on very slow devices). */
const MAX_STEPS_PER_FRAME = 30;

/**
 * Local player: reads input, moves the Rapier character on a fixed 60 Hz step, writes PlayerState
 * and draws the avatar at the smoothed position. Input is ignored unless `controlsEnabled`.
 */
export function PlayerController({ controlsEnabled }: { controlsEnabled: boolean }) {
  const { world, rapier } = useRapier();
  const motor = useRef<CharacterMotor | null>(null);
  const group = useRef<THREE.Group>(null!);
  const acc = useRef(0);
  const respawnsSeen = useRef(localPlayer.respawnRequests);
  const enabled = useRef(controlsEnabled);
  enabled.current = controlsEnabled;

  useEffect(() => {
    const s = localPlayer.state;
    const m = new CharacterMotor(rapier, world, { x: s.x, y: s.y + 0.05, z: s.z });
    motor.current = m;
    if (import.meta.env.DEV) exposeDevHandle(m);
    return () => {
      motor.current = null;
      try { m.dispose(); } catch { /* world already freed */ }
    };
  }, [world, rapier]);

  const teleport = (x: number, y: number, z: number, yaw?: number) => {
    const s = localPlayer.state, v = localPlayer.view;
    motor.current?.teleport({ x, y: y + 0.05, z });
    Object.assign(s, { x, y, z, vx: 0, vz: 0, speed: 0, turnRate: 0, anim: "idle" });
    if (yaw !== undefined) s.yaw = yaw;
    Object.assign(v, { x, y, z, yaw: s.yaw });
    s.teleportCount++;
  };
  const respawn = () => {
    teleport(...SPAWN.position, SPAWN.yaw);
    localPlayer.cameraYaw = SPAWN.yaw + Math.PI;
  };

  useFrame((_, delta) => {
    const m = motor.current;
    if (!m) return;
    const s = localPlayer.state;
    if (localPlayer.respawnRequests !== respawnsSeen.current) {
      respawnsSeen.current = localPlayer.respawnRequests;
      respawn();
    }
    acc.current = Math.min(acc.current + delta, MOVE.fixedDt * MAX_STEPS_PER_FRAME);
    while (acc.current >= MOVE.fixedDt) {
      acc.current -= MOVE.fixedDt;
      const move = enabled.current ? readMove() : { forward: 0, right: 0, run: false };
      const [dx, dz] = steer(s, worldDirection(move, localPlayer.cameraYaw), move.run, MOVE.fixedDt);
      const travelled = m.step(dx, dz, MOVE.fixedDt);
      settle(s, travelled, MOVE.fixedDt);
      s.x = m.position.x; s.y = m.position.y; s.z = m.position.z;
      s.grounded = m.grounded;
      if (s.y < FALL_LIMIT) { respawn(); break; }
    }
    // draw slightly smoothed: hides the 60 Hz stepping and the small hop when stepping up
    const v = localPlayer.view, k = 1 - Math.exp(-delta * 30), ky = 1 - Math.exp(-delta * 16);
    v.x += (s.x - v.x) * k; v.z += (s.z - v.z) * k; v.y += (s.y - v.y) * ky;
    v.yaw += Math.atan2(Math.sin(s.yaw - v.yaw), Math.cos(s.yaw - v.yaw)) * k;
    group.current.position.set(v.x, v.y, v.z);
    group.current.rotation.y = v.yaw;
  });

  const pose = (): AvatarPose => localPlayer.state;

  // dev-only test hooks: teleport and ground probes
  function exposeDevHandle(m: CharacterMotor) {
    Object.assign(devHandle(), {
      player: {
        state: localPlayer.state,
        view: localPlayer.view,
        get cameraYaw() { return localPlayer.cameraYaw; },
        teleport: (x: number, z: number, yaw?: number) => teleport(x, groundAt(rapier, world, x, z) ?? 0, z, yaw),
        physicsGround: (x: number, z: number) => groundAt(rapier, world, x, z),
        motor: m,
        input,
      },
    });
  }

  return (
    <group ref={group} name="local-player">
      <Avatar appearance={localPlayer.appearance} pose={pose} />
    </group>
  );
}
