import { create } from "zustand";
import { detectQuality, saveQuality, type QualityLevel } from "./quality";

export type Phase = "entry" | "connecting" | "playing";
export type ConnStatus = "offline" | "connecting" | "online" | "reconnecting" | "lost";

export interface PromptInfo {
  id: string;
  title: string;
  hint: string;
}

interface UiState {
  phase: Phase;
  conn: ConnStatus;
  error: string | null;
  name: string;
  color: number;
  roomId: string | null;
  playerCount: number;
  maxPlayers: number;
  quality: QualityLevel;
  /** proximity prompt (doors, future NPCs…) */
  prompt: PromptInfo | null;
  toast: string | null;
  set: (p: Partial<UiState>) => void;
  setQuality: (q: QualityLevel) => void;
  showToast: (msg: string) => void;
}

let toastTimer: ReturnType<typeof setTimeout> | undefined;

export const useUi = create<UiState>((set) => ({
  phase: "entry",
  conn: "offline",
  error: null,
  name: "",
  color: 0,
  roomId: null,
  playerCount: 0,
  maxPlayers: 16,
  quality: detectQuality(),
  prompt: null,
  toast: null,
  set: (p) => set(p),
  setQuality: (q) => {
    saveQuality(q);
    set({ quality: q });
  },
  showToast: (msg) => {
    clearTimeout(toastTimer);
    set({ toast: msg });
    toastTimer = setTimeout(() => set({ toast: null }), 2600);
  },
}));
