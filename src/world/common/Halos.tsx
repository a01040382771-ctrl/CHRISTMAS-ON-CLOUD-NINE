import { useMemo } from "react";
import * as THREE from "three";
import { palette, textures } from "../../design";

interface Props {
  positions: [number, number, number][];
  /** Diameter of the glow in metres. */
  size?: number;
  color?: string;
  opacity?: number;
}

/** Soft additive glows around light sources: one draw call for any number of lights. */
export function Halos({ positions, size = 3.2, color = palette.glow, opacity = 0.55 }: Props) {
  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute(positions.flat(), 3));
    return geo;
  }, [positions]);
  const material = useMemo(
    () => new THREE.PointsMaterial({
      map: textures.halo, color, size, sizeAttenuation: true, transparent: true, opacity,
      blending: THREE.AdditiveBlending, depthWrite: false, fog: false,
    }),
    [size, color, opacity],
  );
  if (positions.length === 0) return null;
  return <points geometry={geometry} material={material} frustumCulled={false} />;
}
