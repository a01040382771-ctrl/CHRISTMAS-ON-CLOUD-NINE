/**
 * Rapier kinematic character: a capsule moved with Rapier's character controller (slides along
 * walls, climbs small steps and gentle slopes, snaps to the ground). Framework-free so the same
 * code can run in tests or on a server.
 */
import type RAPIER from "@dimforge/rapier3d-compat";
import { scale } from "../design/scale";
import { GROUP_BITS, interactionGroups } from "../world/collision/shapes";

type Rapier = typeof RAPIER;
export type Vec3Like = { x: number; y: number; z: number };

export const CHARACTER = {
  radius: 0.3,
  height: scale.avatarHeight,
  /** Steps up to this height are climbed (foundation slabs, stone steps, the paving edge). */
  stepHeight: 0.38,
  maxSlopeDeg: 40,
  snapDistance: 0.4,
  gravity: 24,
  maxFallSpeed: 30,
};

const SOLIDS = GROUP_BITS.terrain | GROUP_BITS.building | GROUP_BITS.prop | GROUP_BITS.barrier;

export class CharacterMotor {
  readonly collider: RAPIER.Collider;
  readonly controller: RAPIER.KinematicCharacterController;
  /** Feet position. */
  readonly position = { x: 0, y: 0, z: 0 };
  verticalSpeed = 0;
  grounded = false;
  private readonly halfHeight = CHARACTER.height / 2 - CHARACTER.radius;
  private readonly filter = interactionGroups(GROUP_BITS.player, SOLIDS);

  constructor(private R: Rapier, private world: RAPIER.World, start: Vec3Like) {
    const desc = R.ColliderDesc.capsule(this.halfHeight, CHARACTER.radius).setCollisionGroups(interactionGroups(GROUP_BITS.player, SOLIDS));
    this.collider = world.createCollider(desc);
    this.controller = world.createCharacterController(0.02);
    this.controller.setUp({ x: 0, y: 1, z: 0 });
    this.controller.enableAutostep(CHARACTER.stepHeight, 0.15, false);
    this.controller.enableSnapToGround(CHARACTER.snapDistance);
    this.controller.setMaxSlopeClimbAngle((CHARACTER.maxSlopeDeg * Math.PI) / 180);
    this.controller.setMinSlopeSlideAngle(((CHARACTER.maxSlopeDeg + 5) * Math.PI) / 180);
    this.controller.setSlideEnabled(true);
    this.teleport(start);
  }

  teleport(p: Vec3Like) {
    this.position.x = p.x; this.position.y = p.y; this.position.z = p.z;
    this.verticalSpeed = 0;
    this.collider.setTranslation({ x: p.x, y: p.y + CHARACTER.height / 2 + 0.03, z: p.z });
  }

  /**
   * Move by a horizontal displacement for one fixed step, applying gravity.
   * Returns the horizontal distance actually travelled (less than asked when blocked).
   */
  step(dx: number, dz: number, dt: number) {
    const wasGrounded = this.grounded;
    this.verticalSpeed = wasGrounded ? -1 : Math.max(-CHARACTER.maxFallSpeed, this.verticalSpeed - CHARACTER.gravity * dt);
    const start = this.collider.translation();
    let moved = this.move(dx, this.verticalSpeed * dt, dz);
    this.grounded = this.controller.computedGrounded();

    // Step assist: Rapier's own autostep misses low steps when the character moves slowly, so if a
    // grounded walk was blocked, try "up, forward, down" and keep it if we land on top of a step.
    const wanted = Math.hypot(dx, dz);
    if (wasGrounded && wanted > 1e-4 && moved < wanted * 0.6) {
      const blocked = this.collider.translation();
      // reach far enough for the capsule to rest on the step (the view smooths out the small hop)
      const probe = Math.max(wanted, CHARACTER.radius * 0.75) / wanted;
      this.move(0, CHARACTER.stepHeight, 0);
      const ahead = this.move(dx * probe, 0, dz * probe);
      this.move(0, -(CHARACTER.stepHeight + 0.1), 0);
      const landed = this.controller.computedGrounded();
      const end = this.collider.translation();
      const rise = end.y - start.y;
      if (landed && ahead > wanted * probe * 0.5 && rise > -0.05 && rise <= CHARACTER.stepHeight + 0.02) {
        moved = Math.hypot(end.x - start.x, end.z - start.z);
        this.grounded = true;
      } else {
        this.collider.setTranslation(blocked);
      }
    }
    if (this.grounded && this.verticalSpeed < -1) this.verticalSpeed = -1;
    const t = this.collider.translation();
    this.position.x = t.x; this.position.y = t.y - CHARACTER.height / 2 - 0.03; this.position.z = t.z;
    return moved;
  }

  /** One controller query + apply. Returns the horizontal distance moved. */
  private move(dx: number, dy: number, dz: number) {
    this.controller.computeColliderMovement(this.collider, { x: dx, y: dy, z: dz }, undefined, this.filter);
    const m = this.controller.computedMovement();
    const t = this.collider.translation();
    this.collider.setTranslation({ x: t.x + m.x, y: t.y + m.y, z: t.z + m.z });
    return Math.hypot(m.x, m.z);
  }

  dispose() {
    this.world.removeCharacterController(this.controller);
    this.world.removeCollider(this.collider, false);
  }
}

/** Height of the walkable surface under (x, z), or null. Used for ground probes and safety checks. */
export function groundAt(R: Rapier, world: RAPIER.World, x: number, z: number, from = 60, groups = GROUP_BITS.terrain) {
  const hit = world.castRay(new R.Ray({ x, y: from, z }, { x: 0, y: -1, z: 0 }), 200, true, undefined, interactionGroups(0xffff, groups));
  return hit ? from - hit.timeOfImpact : null;
}
