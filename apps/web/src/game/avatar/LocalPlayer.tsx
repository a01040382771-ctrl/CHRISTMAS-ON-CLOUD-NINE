import { useEffect, useRef } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { DEFAULT_SPAWN, INPUT_SEND_HZ, SNAP_DISTANCE, SOFT_CORRECT_DISTANCE, WALK_SPEED, groundHeight, isWalkable, stepMovement } from "@sky/shared";
import { net } from "../../net/client";
import { useUi } from "../../state/store";
import { input, readMoveIntent, toWorldDir } from "../controls/input";
import { resetCamera, updateCamera } from "../controls/cameraRig";
import { allInteractables, emit } from "../events";
import { localPlayer, snowTarget } from "../state";
import { AvatarModel, specForColor, type AvatarAnim } from "./Avatar";

/**
 * The visitor's own avatar.
 *
 * Client-side prediction: we run the *same* collision/movement code as the server
 * (@sky/shared) so the avatar responds instantly. The server remains authoritative:
 * it integrates the intent we send and we only snap if it disagrees by a lot.
 */
export function LocalPlayer() {
  const group = useRef<THREE.Group>(null);
  const anim = useRef<AvatarAnim>({ moving: false }).current;
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const name = useUi((s) => s.name);
  const color = useUi((s) => s.color);
  const pos = useRef({ x: DEFAULT_SPAWN.x, z: DEFAULT_SPAWN.z }).current;
  const lastPrompt = useRef<string | null>(null);

  useEffect(() => {
    resetCamera();
    input.yaw = 0;
    return () => {
      localPlayer.ready = false;
      useUi.getState().set({ prompt: null });
    };
  }, []);

  useFrame((_, rawDt) => {
    // Cap one frame at 250 ms (tab was hidden), but simulate in ≤50 ms sub-steps so a slow device
    // still walks at WALK_SPEED (same as the server) and never tunnels through thin colliders.
    const dt = Math.min(rawDt, 0.25);
    const g = group.current;
    if (!g) return;
    const now = performance.now();

    // server-driven teleports (spawn, reconnect, recovery)
    if (net.pendingReset) {
      pos.x = net.pendingReset.x;
      pos.z = net.pendingReset.z;
      net.pendingReset = null;
      if (!localPlayer.ready) {
        g.position.set(pos.x, groundHeight(pos.x, pos.z), pos.z);
        resetCamera();
      }
    }
    // (re)initialise after mount; robust against StrictMode effect re-runs
    localPlayer.ready = true;

    // intent (camera space) → world direction
    const it = readMoveIntent();
    const dir = toWorldDir(it.x, it.y, input.yaw);
    const mag = Math.hypot(dir.x, dir.z);
    const moving = mag > 0.05;

    if (moving) {
      const px = pos.x;
      const pz = pos.z;
      const steps = Math.ceil(dt / 0.05);
      const h = dt / steps;
      for (let i = 0; i < steps; i++) stepMovement(pos, dir.x * WALK_SPEED * h, dir.z * WALK_SPEED * h);
      anim.moving = Math.hypot(pos.x - px, pos.z - pz) > 1e-4;
      // smooth turn toward the intended heading
      const target = Math.atan2(dir.x, dir.z);
      let d = ((target - g.rotation.y + Math.PI) % (Math.PI * 2)) - Math.PI;
      if (d < -Math.PI) d += Math.PI * 2;
      g.rotation.y += d * Math.min(1, dt * 14);
    } else {
      anim.moving = false;
    }
    net.sendInput(moving ? dir.x : 0, moving ? dir.z : 0, now, INPUT_SEND_HZ);

    // reconcile with the authoritative position
    if (net.selfServer.fresh) {
      net.selfServer.fresh = false;
      const err = Math.hypot(net.selfServer.x - pos.x, net.selfServer.z - pos.z);
      if (err > SNAP_DISTANCE) {
        pos.x = net.selfServer.x;
        pos.z = net.selfServer.z;
      } else if (err > SOFT_CORRECT_DISTANCE) {
        // moderate drift (slow device / burst loss): ease toward the server instead of popping
        pos.x += (net.selfServer.x - pos.x) * 0.3;
        pos.z += (net.selfServer.z - pos.z) * 0.3;
      }
    }
    if (!isWalkable(pos.x, pos.z)) {
      // abnormal position safety net (should be unreachable)
      stepMovement(pos, 0, 0);
    }

    const gy = groundHeight(pos.x, pos.z);
    g.position.x = pos.x;
    g.position.z = pos.z;
    g.position.y += (gy - g.position.y) * Math.min(1, dt * 18);

    localPlayer.x = pos.x;
    localPlayer.y = g.position.y;
    localPlayer.z = pos.z;
    localPlayer.ry = g.rotation.y;
    localPlayer.moving = anim.moving;

    // proximity prompts + E to interact
    let best: { id: string; title: string; hint: string; d: number } | null = null;
    for (const it2 of allInteractables()) {
      const d = Math.hypot(it2.x - pos.x, it2.z - pos.z);
      if (d < it2.radius && (!best || d < best.d)) best = { id: it2.id, title: it2.title, hint: it2.hint, d };
    }
    const bid = best?.id ?? null;
    if (bid !== lastPrompt.current) {
      lastPrompt.current = bid;
      useUi.getState().set({ prompt: best ? { id: best.id, title: best.title, hint: best.hint } : null });
    }
    if (input.interactPressed) {
      input.interactPressed = false;
      if (bid) emit("interact", { id: bid });
    }

    updateCamera(camera, pos.x, g.position.y, pos.z, input.yaw, input.pitch, input.dist, dt);
    snowTarget.current.set(camera.position.x, 0, camera.position.z);
  });

  return (
    <group ref={group} rotation={[0, Math.PI, 0]}>
      <AvatarModel spec={specForColor(color)} anim={anim} name={name || "Guest"} self />
    </group>
  );
}
