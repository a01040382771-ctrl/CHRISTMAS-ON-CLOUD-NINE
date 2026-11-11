import { Client, type Room } from "colyseus.js";
import { create } from "zustand";
import {
  C2S_INPUT, ROOM_NAME, S2C_JOIN, S2C_LEAVE, S2C_RESET, S2C_SNAPSHOT, S2C_WELCOME,
  type InputMsg, type JoinOptions, type PlayerInfo, type ResetMsg, type SnapshotMsg, type WelcomeMsg,
} from "@sky/shared";
import { useUi } from "../state/store";

/** Interpolation delay: remote avatars are drawn this far in the past so there is always a sample on each side. */
export const INTERP_DELAY_MS = 120;
const MAX_BUFFER = 24;

export interface Sample {
  t: number; // local receive time (performance.now)
  x: number;
  z: number;
  ry: number;
  mv: 0 | 1;
}
export interface RemotePlayer {
  info: PlayerInfo;
  buf: Sample[];
}

/** Roster ids live in a tiny store so React re-renders only on join/leave, never on movement. */
export const useRoster = create<{ ids: string[] }>(() => ({ ids: [] }));

class Net {
  room: Room | null = null;
  client: Client | null = null;
  selfId = "";
  remotes = new Map<string, RemotePlayer>();
  /** latest authoritative position of the local player + a flag set when it changed */
  selfServer = { x: 0, z: 0, fresh: false };
  /** server asked us to teleport (abnormal position recovery / reconnect) */
  pendingReset: { x: number; z: number } | null = null;
  private leaving = false;
  private joinOpts: JoinOptions | null = null;
  private lastSent = { x: 0, z: 0, at: 0 };

  url() {
    const env = import.meta.env.VITE_SERVER_URL as string | undefined;
    if (env) return env;
    const proto = location.protocol === "https:" ? "wss" : "ws";
    return `${proto}://${location.hostname}:2567`;
  }

  async join(opts: JoinOptions, inviteRoomId?: string | null) {
    const ui = useUi.getState();
    this.leaving = false;
    this.joinOpts = opts;
    ui.set({ conn: "connecting", error: null });
    this.client = new Client(this.url());
    let room: Room | undefined;
    if (inviteRoomId) {
      try {
        room = await this.client.joinById(inviteRoomId, opts);
      } catch (e) {
        ui.showToast("초대받은 파티룸에 들어갈 수 없어 새 방으로 입장해요 (가득 찼거나 닫혔어요)");
      }
    }
    room ??= await this.client.joinOrCreate(ROOM_NAME, opts);
    this.attach(room);
  }

  private attach(room: Room) {
    this.room = room;
    const ui = useUi.getState();
    this.selfId = room.sessionId;
    this.remotes.clear();
    useRoster.setState({ ids: [] });

    room.onMessage(S2C_WELCOME, (m: WelcomeMsg) => {
      this.selfId = m.you;
      this.remotes.clear();
      const now = performance.now();
      for (const p of m.players) {
        if (p.id === m.you) {
          this.pendingReset = { x: p.x, z: p.z };
          this.selfServer = { x: p.x, z: p.z, fresh: false };
        } else this.addRemote(p, now);
      }
      this.syncRoster();
      useUi.getState().set({ roomId: m.roomId, maxPlayers: m.maxPlayers, conn: "online", phase: "playing", error: null });
    });
    room.onMessage(S2C_JOIN, (p: PlayerInfo) => {
      if (p.id === this.selfId) return;
      this.addRemote(p, performance.now());
      this.syncRoster();
      useUi.getState().showToast(`${p.name} 님이 입장했어요 🎄`);
    });
    room.onMessage(S2C_LEAVE, (id: string) => {
      const r = this.remotes.get(id);
      this.remotes.delete(id);
      this.syncRoster();
      if (r) useUi.getState().showToast(`${r.info.name} 님이 떠났어요`);
    });
    room.onMessage(S2C_SNAPSHOT, (m: SnapshotMsg) => {
      const now = performance.now();
      for (const [id, x, z, ry, mv] of m.p) {
        if (id === this.selfId) {
          this.selfServer.x = x;
          this.selfServer.z = z;
          this.selfServer.fresh = true;
          continue;
        }
        const r = this.remotes.get(id);
        if (!r) continue;
        r.buf.push({ t: now, x, z, ry, mv });
        if (r.buf.length > MAX_BUFFER) r.buf.shift();
      }
    });
    room.onMessage(S2C_RESET, (m: ResetMsg) => {
      this.pendingReset = { x: m.x, z: m.z };
      useUi.getState().showToast("위치를 광장으로 되돌렸어요");
    });

    room.onLeave((code) => {
      if (this.room !== room) return; // stale
      if (this.leaving || code === 1000 || code === 4000) {
        useUi.getState().set({ conn: "offline" });
        return;
      }
      void this.recover(room.reconnectionToken);
    });
    room.onError((code, msg) => {
      console.warn("room error", code, msg);
    });
    ui.set({ conn: "online" });
  }

  /** Dropped connection → try to resume the same session (server keeps the avatar for ~20 s). */
  private async recover(token: string) {
    const ui = useUi.getState();
    ui.set({ conn: "reconnecting" });
    for (let attempt = 1; attempt <= 9 && !this.leaving; attempt++) {
      await new Promise((r) => setTimeout(r, 1500));
      try {
        const room = await this.client!.reconnect(token);
        this.attach(room);
        useUi.getState().showToast("다시 연결됐어요 ✨");
        return;
      } catch {
        /* keep trying until the server's reconnection window closes */
      }
    }
    if (!this.leaving) {
      this.room = null;
      useUi.getState().set({ conn: "lost" });
    }
  }

  /** After "lost": fresh join with the same identity. */
  async rejoin() {
    if (!this.joinOpts) return;
    try {
      await this.join(this.joinOpts, useUi.getState().roomId);
    } catch (e) {
      useUi.getState().set({ conn: "lost", error: errMsg(e) });
    }
  }

  leave() {
    this.leaving = true;
    try {
      void this.room?.leave(true);
    } catch {
      /* ignore */
    }
    this.room = null;
    this.remotes.clear();
    useRoster.setState({ ids: [] });
    useUi.getState().set({ conn: "offline", phase: "entry", roomId: null, playerCount: 0 });
  }

  /** Movement intent in world space. Throttled; zero is always sent immediately once. */
  sendInput(x: number, z: number, now: number, hz: number) {
    const room = this.room;
    if (!room || useUi.getState().conn !== "online") return;
    const l = this.lastSent;
    const stopped = x === 0 && z === 0;
    const wasStopped = l.x === 0 && l.z === 0;
    const changed = Math.hypot(x - l.x, z - l.z) > 0.03;
    const due = now - l.at >= 1000 / hz;
    const heartbeat = !stopped && now - l.at >= 160;
    if ((stopped && !wasStopped) || (changed && due) || heartbeat) {
      const msg: InputMsg = { x: round3(x), z: round3(z) };
      room.send(C2S_INPUT, msg);
      l.x = x;
      l.z = z;
      l.at = now;
    }
  }

  private addRemote(p: PlayerInfo, now: number) {
    this.remotes.set(p.id, { info: p, buf: [{ t: now, x: p.x, z: p.z, ry: p.ry, mv: 0 }] });
  }

  private syncRoster() {
    const ids = [...this.remotes.keys()];
    useRoster.setState({ ids });
    useUi.getState().set({ playerCount: ids.length + 1 });
  }
}

export const net = new Net();

export function errMsg(e: unknown): string {
  const m = e instanceof Error ? e.message : String(e);
  if (/failed to fetch|network|ECONNREFUSED|WebSocket/i.test(m)) return "서버에 연결할 수 없어요. 서버가 켜져 있는지 확인해 주세요.";
  if (/full|locked/i.test(m)) return "파티룸이 가득 찼어요. 잠시 후 다시 시도해 주세요.";
  return m;
}

const round3 = (n: number) => Math.round(n * 1000) / 1000;

/** Sample a remote player's buffered track at `renderTime` (performance.now()-based). */
export function sampleRemote(r: RemotePlayer, renderTime: number, out: { x: number; z: number; ry: number; moving: boolean }) {
  const b = r.buf;
  const last = b[b.length - 1];
  if (b.length === 1 || renderTime >= last.t) {
    out.x = last.x;
    out.z = last.z;
    out.ry = last.ry;
    // "moving" only while samples are still arriving; a final mv=0 row stops the walk cycle
    out.moving = last.mv === 1 && renderTime - last.t < 250;
    return;
  }
  let i = b.length - 2;
  while (i > 0 && b[i].t > renderTime) i--;
  const a = b[i];
  const c = b[i + 1];
  if (renderTime <= a.t) {
    out.x = a.x; out.z = a.z; out.ry = a.ry; out.moving = a.mv === 1;
    return;
  }
  const k = (renderTime - a.t) / (c.t - a.t);
  out.x = a.x + (c.x - a.x) * k;
  out.z = a.z + (c.z - a.z) * k;
  out.ry = lerpAngle(a.ry, c.ry, k);
  out.moving = c.mv === 1 || a.mv === 1;
}

export function lerpAngle(a: number, b: number, k: number) {
  let d = ((b - a + Math.PI) % (Math.PI * 2)) - Math.PI;
  if (d < -Math.PI) d += Math.PI * 2;
  return a + d * k;
}
