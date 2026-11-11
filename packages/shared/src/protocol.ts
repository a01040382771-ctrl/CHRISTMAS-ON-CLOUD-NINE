/** Network messages between client and server (Colyseus room messages). */

export const C2S_INPUT = "input";
export const S2C_WELCOME = "welcome";
export const S2C_JOIN = "join";
export const S2C_LEAVE = "leave";
export const S2C_SNAPSHOT = "snap";
export const S2C_RESET = "reset";

export interface JoinOptions {
  name: string;
  color: number; // index into AVATAR_COLORS
}

/** Movement intent in WORLD space; the server clamps its length to 1. */
export interface InputMsg {
  x: number;
  z: number;
}

export interface PlayerInfo {
  id: string;
  name: string;
  color: number;
  x: number;
  z: number;
  ry: number;
}

export interface WelcomeMsg {
  you: string;
  roomId: string;
  players: PlayerInfo[];
  maxPlayers: number;
}

/** Compact snapshot row: [id, x, z, ry, moving(0|1)] */
export type SnapRow = [string, number, number, number, 0 | 1];
export interface SnapshotMsg {
  /** server time in ms (monotonic within a room) */
  t: number;
  p: SnapRow[];
}

export interface ResetMsg {
  x: number;
  z: number;
}
