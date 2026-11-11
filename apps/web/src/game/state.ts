import * as THREE from "three";

/** Live local-player state read by camera, snow, HUD and debug hooks. Mutated every frame; never React state. */
export const localPlayer = {
  x: 0,
  y: 0,
  z: 0,
  ry: Math.PI,
  moving: false,
  ready: false,
};

/** Snow volume follows this point. */
export const snowTarget = { current: new THREE.Vector3() };
