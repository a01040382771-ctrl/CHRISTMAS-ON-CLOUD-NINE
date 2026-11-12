import type { AvatarPose } from "./animation";
import type { AvatarAppearance } from "./appearance";
import { ProceduralAvatar } from "./ProceduralAvatar";

export interface AvatarProps {
  appearance: AvatarAppearance;
  /** Read every frame — from the local player today, from network interpolation for remote players later. */
  pose: () => AvatarPose;
}

/**
 * The avatar as seen by everyone. Only knows how to look and animate — not where it is or who
 * controls it (the parent group places it). To use a hand-modelled character later, render a GLB
 * model with an AnimationMixer here, mapping AvatarPose.anim to clips.
 */
export function Avatar(props: AvatarProps) {
  return <ProceduralAvatar {...props} />;
}
