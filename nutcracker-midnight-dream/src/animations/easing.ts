import {Easing, interpolate} from 'remotion';

export const smooth = Easing.bezier(0.45, 0, 0.25, 1);
export const gentle = Easing.bezier(0.33, 0, 0.2, 1);
export const outBack = Easing.bezier(0.34, 1.45, 0.64, 1);

/** Clamped interpolate with a soft storybook ease by default. */
export const ease = (
  f: number,
  range: [number, number],
  out: [number, number],
  easing: (t: number) => number = smooth,
) =>
  interpolate(f, range, out, {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing,
  });

/** Multi-keyframe clamped interpolate: keys = [[frame, value], ...]. */
export const keys = (
  f: number,
  k: Array<[number, number]>,
  easing: (t: number) => number = smooth,
) =>
  interpolate(
    f,
    k.map((p) => p[0]),
    k.map((p) => p[1]),
    {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing},
  );

/** Sine oscillation helper. period in frames. */
export const osc = (f: number, period: number, amp = 1, phase = 0) =>
  Math.sin(((f / period) * 2 + phase) * Math.PI) * amp;

/** 0→1 progress inside a window. */
export const prog = (f: number, a: number, b: number) =>
  Math.max(0, Math.min(1, (f - a) / (b - a)));

/** Smooth blink: returns eyelid closure 0..1 around frame `at`. */
export const blinkAt = (f: number, at: number, len = 7) => {
  const d = Math.abs(f - at);
  return d > len / 2 ? 0 : Math.cos((d / (len / 2)) * (Math.PI / 2));
};

/** Combine several blink moments. */
export const blinks = (f: number, at: number[], len = 7) =>
  Math.max(0, ...at.map((a) => blinkAt(f, a, len)));
