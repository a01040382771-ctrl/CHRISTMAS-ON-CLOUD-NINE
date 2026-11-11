/** Graphics presets. Everything quality-dependent reads from here. */
export type QualityLevel = "high" | "medium" | "low";

export interface QualitySettings {
  dpr: [number, number];
  shadows: boolean;
  shadowMapSize: number;
  antialias: boolean;
  snowParticles: number;
  cloudPuffs: number;
  twinkleLights: boolean;
}

export const QUALITY: Record<QualityLevel, QualitySettings> = {
  high: { dpr: [1, 2], shadows: true, shadowMapSize: 2048, antialias: true, snowParticles: 1400, cloudPuffs: 1, twinkleLights: true },
  medium: { dpr: [1, 1.5], shadows: true, shadowMapSize: 1024, antialias: true, snowParticles: 700, cloudPuffs: 0.7, twinkleLights: true },
  low: { dpr: [1, 1], shadows: false, shadowMapSize: 512, antialias: false, snowParticles: 250, cloudPuffs: 0.45, twinkleLights: false },
};

const KEY = "sky-village:quality";

export function isTouchDevice(): boolean {
  return typeof window !== "undefined" && ("ontouchstart" in window || navigator.maxTouchPoints > 0) && window.matchMedia("(pointer: coarse)").matches;
}

export function detectQuality(): QualityLevel {
  try {
    const forced = new URLSearchParams(location.search).get("q");
    if (forced === "high" || forced === "medium" || forced === "low") return forced;
    const saved = localStorage.getItem(KEY);
    if (saved === "high" || saved === "medium" || saved === "low") return saved;
  } catch {
    /* storage unavailable */
  }
  if (isTouchDevice()) {
    const mem = (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 4;
    return mem <= 3 ? "low" : "medium";
  }
  return "high";
}

export function saveQuality(q: QualityLevel) {
  try {
    localStorage.setItem(KEY, q);
  } catch {
    /* ignore */
  }
}
