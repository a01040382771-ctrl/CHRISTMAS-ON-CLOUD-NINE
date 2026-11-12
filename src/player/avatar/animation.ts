/**
 * Procedural animation for the avatar rig: idle, walk, run and turn, blended by weights that ease
 * in and out so changes of state never pop. Swap this for an AnimationMixer when a skinned GLB
 * character arrives — the inputs (AvatarPose) stay the same.
 */
import type * as THREE from "three";
import type { AnimState } from "../state";

export interface AvatarPose {
  speed: number;
  turnRate: number;
  anim: AnimState;
  grounded: boolean;
}

export interface AvatarRig {
  /** Moves up/down with the gait and leans into turns. */
  bob: THREE.Group;
  /** Pivot at the hips: forward lean and twist. */
  torso: THREE.Group;
  head: THREE.Group;
  legL: THREE.Group;
  legR: THREE.Group;
  armL: THREE.Group;
  armR: THREE.Group;
}

const ease = (current: number, target: number, rate: number, dt: number) => current + (target - current) * (1 - Math.exp(-rate * dt));
const smooth = (a: number, b: number, x: number) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

export class AvatarAnimator {
  private phase = 0;
  private time = 0;
  private walk = 0;
  private run = 0;
  private turn = 0;
  private lean = 0;

  update(rig: AvatarRig, pose: AvatarPose, dt: number) {
    this.time += dt;
    const moving = smooth(0.15, 1.2, pose.speed);
    this.run = ease(this.run, smooth(4.2, 5.8, pose.speed), 8, dt);
    this.walk = ease(this.walk, moving * (1 - smooth(4.2, 5.8, pose.speed)), 10, dt);
    this.turn = ease(this.turn, pose.anim === "turn" ? 1 : 0, 10, dt);
    const idle = Math.max(0, 1 - this.walk - this.run);
    const gait = this.walk + this.run;

    // feet stay planted: the cycle advances with distance travelled (one cycle = two steps)
    const stride = 1.15 + this.run * 0.85;
    this.phase += (pose.speed / stride) * Math.PI * 2 * dt + this.turn * Math.PI * 2 * 1.7 * dt;
    const s = Math.sin(this.phase), c = Math.cos(this.phase);

    const legSwing = s * (0.55 * this.walk + 0.95 * this.run + 0.22 * this.turn);
    rig.legL.rotation.x = legSwing;
    rig.legR.rotation.x = -legSwing;
    const armSwing = s * (0.5 * this.walk + 0.85 * this.run);
    rig.armL.rotation.x = -armSwing - this.run * 0.35;
    rig.armR.rotation.x = armSwing - this.run * 0.35;
    const breathe = Math.sin(this.time * 2.1);
    rig.armL.rotation.z = -(0.13 + idle * 0.02 * breathe + this.run * 0.1);
    rig.armR.rotation.z = 0.13 + idle * 0.02 * breathe + this.run * 0.1;

    rig.bob.position.y = Math.abs(c) * (0.035 * this.walk + 0.075 * this.run) + this.turn * 0.015 * Math.abs(s);
    this.lean = ease(this.lean, Math.max(-0.16, Math.min(0.16, -pose.turnRate * 0.03 * (0.4 + gait))), 8, dt);
    rig.bob.rotation.z = this.lean;

    rig.torso.rotation.x = 0.05 * this.walk + 0.2 * this.run;
    rig.torso.rotation.y = s * 0.08 * gait;
    rig.torso.scale.y = 1 + breathe * 0.012 * idle;

    // idle: an occasional look around; walking: keep the gaze steady
    rig.head.rotation.y = -s * 0.07 * gait + idle * Math.sin(this.time * 0.45) * 0.28 * (0.5 + 0.5 * Math.sin(this.time * 0.17));
    rig.head.rotation.x = -0.12 * this.run + idle * Math.sin(this.time * 0.6) * 0.04;
    rig.head.rotation.z = idle * Math.sin(this.time * 0.33) * 0.05;
  }
}
