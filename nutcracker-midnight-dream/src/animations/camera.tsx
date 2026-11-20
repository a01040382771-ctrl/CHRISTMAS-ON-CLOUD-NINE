import React from 'react';

export type Cam = {x: number; y: number; zoom: number; rot?: number};

export const W = 1080;
export const H = 1920;

/**
 * Parallax layer. `depth` 0 = infinitely far (static), 1 = the reference
 * plane, >1 = foreground that moves faster than the camera.
 */
export const Layer: React.FC<{
  cam: Cam;
  depth: number;
  children: React.ReactNode;
  style?: React.CSSProperties;
  filter?: string;
}> = ({cam, depth, children, filter}) => {
  const s = 1 + (cam.zoom - 1) * depth;
  const cx = W / 2 + (cam.x - W / 2) * depth;
  const cy = H / 2 + (cam.y - H / 2) * depth;
  const r = (cam.rot ?? 0) * depth;
  return (
    <g
      filter={filter}
      transform={`translate(${W / 2} ${H / 2}) rotate(${r}) scale(${s}) translate(${-cx} ${-cy})`}
    >
      {children}
    </g>
  );
};
