import {random} from 'remotion';

export type Seed = string | number;

/** Deterministic pseudo-random in [a,b). */
export const rnd = (seed: Seed, a = 0, b = 1) => a + random(seed) * (b - a);

export const range = (n: number) => Array.from({length: n}, (_, i) => i);
