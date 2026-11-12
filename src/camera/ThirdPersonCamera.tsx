import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { useRapier } from "@react-three/rapier";
import * as THREE from "three";
import { groundAt } from "../physics/CharacterMotor";
import { input } from "../player/input";
import { localPlayer } from "../player/localPlayer";
import { GROUP_BITS, interactionGroups } from "../world/collision/shapes";

export const FOLLOW = {
  /** Look-at point above the feet (upper chest). */
  targetHeight: 1.35,
  distance: 8,
  minDistance: 2.5,
  maxDistance: 16,
  /** Elevation of the camera above the horizon, radians. */
  pitch: 0.4,
  minPitch: -0.05,
  maxPitch: 1.2,
  /** Seconds without manual look input before the camera eases back behind a moving avatar. */
  recenterDelay: 1.6,
};

const OCCLUDERS = interactionGroups(0xffff, GROUP_BITS.terrain | GROUP_BITS.building);
const wrap = (a: number) => Math.atan2(Math.sin(a), Math.cos(a));

/**
 * Third-person follow camera: orbits the avatar with drag / one-finger drag, zooms with the wheel /
 * pinch, eases back behind the avatar while walking, and pulls in when a building or the ground
 * would come between it and the avatar.
 */
export function ThirdPersonCamera() {
  const camera = useThree((s) => s.camera);
  const gl = useThree((s) => s.gl);
  const { world, rapier } = useRapier();
  // portrait phones see less to the sides: start a little further back and higher
  const portrait = useThree((s) => s.size.width < s.size.height);
  const c = useRef({
    yaw: localPlayer.cameraYaw,
    pitch: FOLLOW.pitch + (portrait ? 0.08 : 0),
    distance: FOLLOW.distance * (portrait ? 1.25 : 1),
    actual: FOLLOW.distance * (portrait ? 1.25 : 1),
    target: new THREE.Vector3(localPlayer.view.x, localPlayer.view.y + FOLLOW.targetHeight, localPlayer.view.z),
    enteredAt: performance.now(),
    teleports: localPlayer.state.teleportCount,
  });

  useEffect(() => {
    const el = gl.domElement;
    const pointers = new Map<number, { x: number; y: number }>();
    let pinch = 0;
    const spread = () => { const [a, b] = [...pointers.values()]; return Math.hypot(a.x - b.x, a.y - b.y); };
    const down = (e: PointerEvent) => {
      el.setPointerCapture(e.pointerId);
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (pointers.size === 2) pinch = spread();
    };
    const move = (e: PointerEvent) => {
      const p = pointers.get(e.pointerId);
      if (!p) return;
      const dx = e.clientX - p.x, dy = e.clientY - p.y;
      p.x = e.clientX; p.y = e.clientY;
      if (pointers.size === 1) {
        const k = e.pointerType === "touch" ? 0.0075 : 0.0055;
        input.lookYaw -= dx * k;
        input.lookPitch += dy * k * 0.8;
        input.lastLookAt = performance.now();
      } else if (pointers.size === 2) {
        const d = spread();
        if (pinch > 0 && d > 0) input.zoom *= pinch / d;
        pinch = d;
      }
    };
    const up = (e: PointerEvent) => { pointers.delete(e.pointerId); pinch = pointers.size === 2 ? spread() : 0; };
    const wheel = (e: WheelEvent) => { e.preventDefault(); input.zoom *= Math.exp(e.deltaY * 0.0012); };
    const menu = (e: Event) => e.preventDefault();
    el.addEventListener("pointerdown", down);
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerup", up);
    el.addEventListener("pointercancel", up);
    el.addEventListener("wheel", wheel, { passive: false });
    el.addEventListener("contextmenu", menu);
    return () => {
      el.removeEventListener("pointerdown", down);
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerup", up);
      el.removeEventListener("pointercancel", up);
      el.removeEventListener("wheel", wheel);
      el.removeEventListener("contextmenu", menu);
    };
  }, [gl]);

  const ray = useRef(new rapier.Ray({ x: 0, y: 0, z: 0 }, { x: 0, y: 0, z: 1 }));
  const want = useRef(new THREE.Vector3());
  const dir = useRef(new THREE.Vector3());

  useFrame((_, delta) => {
    const cam = c.current, s = localPlayer.state, v = localPlayer.view;
    const dt = Math.min(delta, 0.1);

    // manual input
    cam.yaw = wrap(cam.yaw + input.lookYaw);
    cam.pitch = THREE.MathUtils.clamp(cam.pitch + input.lookPitch, FOLLOW.minPitch, FOLLOW.maxPitch);
    cam.distance = THREE.MathUtils.clamp(cam.distance * input.zoom, FOLLOW.minDistance, FOLLOW.maxDistance);
    input.lookYaw = input.lookPitch = 0;
    input.zoom = 1;

    // ease back behind the avatar while it walks (never swings round when walking towards the camera)
    if (s.speed > 0.5 && performance.now() - input.lastLookAt > FOLLOW.recenterDelay * 1000) {
      const diff = wrap(s.yaw + Math.PI - cam.yaw);
      if (Math.abs(diff) < 2.2) cam.yaw = wrap(cam.yaw + diff * (1 - Math.exp(-dt * 0.9 * Math.min(1.6, s.speed / 3))));
    }
    localPlayer.cameraYaw = cam.yaw;

    const teleported = s.teleportCount !== cam.teleports;
    cam.teleports = s.teleportCount;
    want.current.set(v.x, v.y + FOLLOW.targetHeight, v.z);
    if (teleported) cam.target.copy(want.current);
    else cam.target.lerp(want.current, 1 - Math.exp(-dt * 14));

    // keep buildings and terrain out from between camera and avatar
    const d = dir.current.set(Math.sin(cam.yaw) * Math.cos(cam.pitch), Math.sin(cam.pitch), Math.cos(cam.yaw) * Math.cos(cam.pitch));
    ray.current.origin = { x: cam.target.x, y: cam.target.y, z: cam.target.z };
    ray.current.dir = { x: d.x, y: d.y, z: d.z };
    const hit = world.castRay(ray.current, cam.distance + 0.4, true, undefined, OCCLUDERS);
    const allowed = hit ? Math.max(0.9, hit.timeOfImpact - 0.4) : cam.distance;
    cam.actual = allowed < cam.actual || teleported ? allowed : cam.actual + (allowed - cam.actual) * (1 - Math.exp(-dt * 3));

    const pos = want.current.copy(cam.target).addScaledVector(d, cam.actual);
    const ground = groundAt(rapier, world, pos.x, pos.z, pos.y + 2);
    if (ground !== null) pos.y = Math.max(pos.y, ground + 0.45);

    // glide in from wherever the camera was when exploring started
    const since = (performance.now() - cam.enteredAt) / 1000;
    if (since < 1.6 && !teleported) camera.position.lerp(pos, 1 - Math.exp(-dt * (2 + since * 6)));
    else camera.position.copy(pos);
    camera.lookAt(cam.target);
  });

  return null;
}
