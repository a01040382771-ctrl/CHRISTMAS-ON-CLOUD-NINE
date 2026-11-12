import { Suspense, useMemo, type ReactNode } from "react";
import { useGLTF } from "@react-three/drei";
import type { ThreeElements } from "@react-three/fiber";

type Props = ThreeElements["group"] & {
  /** Path under /public, e.g. "/models/velvet-ballroom.glb". */
  url: string;
  /** Shown while the model loads — usually the procedural placeholder. */
  fallback?: ReactNode;
};

function Model({ url, ...group }: Props) {
  const { scene } = useGLTF(url);
  const model = useMemo(() => {
    const clone = scene.clone(true);
    clone.traverse((o) => { o.castShadow = true; o.receiveShadow = true; });
    return clone;
  }, [scene]);
  return <group {...group}><primitive object={model} /></group>;
}

/**
 * Extension point for hand-modelled assets. Any procedural building can later be swapped for
 * `<GlbAsset url="/models/x.glb" fallback={<Placeholder />} />` without touching the layout.
 * Not used in Phase 1.
 */
export function GlbAsset({ fallback = null, ...props }: Props) {
  return <Suspense fallback={fallback}><Model {...props} /></Suspense>;
}
