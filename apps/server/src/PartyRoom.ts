import { Room, type Client } from "@colyseus/core";
import {
  C2S_INPUT, INPUT_TIMEOUT_MS, MAX_INPUT_MSGS_PER_SEC, MAX_PLAYERS_PER_ROOM, RECONNECT_WINDOW_SEC,
  S2C_JOIN, S2C_LEAVE, S2C_SNAPSHOT, S2C_WELCOME, S2C_RESET, SERVER_TICK_HZ, SNAPSHOT_HZ, WALK_SPEED,
  pickSpawn, sanitizeColor, sanitizeName, isWalkable, stepMovement, DEFAULT_SPAWN,
  type InputMsg, type JoinOptions, type PlayerInfo, type SnapRow, type SnapshotMsg, type WelcomeMsg,
} from "@sky/shared";

interface Player {
  id: string;
  name: string;
  color: number;
  x: number;
  z: number;
  ry: number;
  /** last validated movement intent (unit length or less, world space) */
  ix: number;
  iz: number;
  lastInputAt: number;
  moving: boolean;
  /** changed since last snapshot */
  dirty: boolean;
  /** input rate limiter */
  msgWindowStart: number;
  msgCount: number;
  connected: boolean;
}

/**
 * One party room = one copy of the village, up to 16 visitors.
 *
 * Authoritative model: clients send *intent* (a direction), never positions.
 * The server integrates movement with the same collision code the client uses,
 * so speed hacks, teleports and wall/cliff clipping are impossible by construction.
 * State is broadcast as compact delta snapshots (only players that moved).
 */
export class PartyRoom extends Room {
  maxClients = MAX_PLAYERS_PER_ROOM;
  private players = new Map<string, Player>();
  private spawnCounter = 0;
  private snapAccum = 0;

  onCreate() {
    this.setPatchRate(null as unknown as number); // no schema state; we send our own deltas
    this.setSimulationInterval((dtMs) => this.tick(dtMs), 1000 / SERVER_TICK_HZ);

    this.onMessage(C2S_INPUT, (client, msg: InputMsg) => this.onInput(client, msg));
    // unknown messages are ignored (Colyseus warns by default)
    if (process.env.ENABLE_DEBUG_TELEPORT === "1") {
      // test hook only: lets browser tests place an avatar (still validated against the walkable map)
      this.onMessage("debug_teleport", (client, m: { x: number; z: number }) => {
        const p = this.players.get(client.sessionId);
        if (p && Number.isFinite(m?.x) && Number.isFinite(m?.z) && isWalkable(m.x, m.z)) {
          p.x = m.x; p.z = m.z; p.dirty = true;
          client.send(S2C_RESET, { x: m.x, z: m.z });
        }
      });
    }
    this.onMessage("*", () => {});
  }

  onAuth(_client: Client, options: JoinOptions) {
    return { name: sanitizeName(options?.name), color: sanitizeColor(options?.color) };
  }

  onJoin(client: Client, _options: JoinOptions, auth: { name: string; color: number }) {
    const spawn = pickSpawn(this.spawnCounter++);
    const p: Player = {
      id: client.sessionId,
      name: auth.name,
      color: auth.color,
      x: spawn.x,
      z: spawn.z,
      ry: Math.PI, // face the plaza centre (north = -z)
      ix: 0,
      iz: 0,
      lastInputAt: 0,
      moving: false,
      dirty: false,
      msgWindowStart: Date.now(),
      msgCount: 0,
      connected: true,
    };
    this.players.set(p.id, p);
    this.sendWelcome(client);
    this.broadcast(S2C_JOIN, this.info(p), { except: client });
    this.updateMetadata();
    console.log(`[${this.roomId}] + ${p.name} (${p.id}) — ${this.players.size}/${this.maxClients}`);
  }

  async onLeave(client: Client, consented: boolean) {
    const p = this.players.get(client.sessionId);
    if (!p) return;
    if (!consented) {
      // Keep the avatar (frozen) so a dropped connection can resume where it was.
      p.connected = false;
      p.ix = p.iz = 0;
      p.moving = false;
      p.dirty = true;
      try {
        const rejoined = await this.allowReconnection(client, RECONNECT_WINDOW_SEC);
        p.connected = true;
        p.lastInputAt = 0;
        this.sendWelcome(rejoined);
        console.log(`[${this.roomId}] ↺ ${p.name} reconnected`);
        return;
      } catch {
        /* window expired or room closing — fall through and remove */
      }
    }
    this.removePlayer(p);
  }

  onDispose() {
    console.log(`[${this.roomId}] disposed`);
  }

  // ───────────── internals ─────────────

  private removePlayer(p: Player) {
    if (!this.players.delete(p.id)) return;
    this.broadcast(S2C_LEAVE, p.id);
    this.updateMetadata();
    console.log(`[${this.roomId}] - ${p.name} (${p.id}) — ${this.players.size}/${this.maxClients}`);
  }

  private updateMetadata() {
    void this.setMetadata({ players: this.players.size });
  }

  private info(p: Player): PlayerInfo {
    return { id: p.id, name: p.name, color: p.color, x: round2(p.x), z: round2(p.z), ry: round2(p.ry) };
  }

  private sendWelcome(client: Client) {
    const msg: WelcomeMsg = {
      you: client.sessionId,
      roomId: this.roomId,
      players: [...this.players.values()].map((p) => this.info(p)),
      maxPlayers: this.maxClients,
    };
    client.send(S2C_WELCOME, msg);
  }

  private onInput(client: Client, msg: InputMsg) {
    const p = this.players.get(client.sessionId);
    if (!p || !p.connected) return;
    const now = Date.now();

    // rate limit (drops excess silently; a flooding client only hurts itself)
    if (now - p.msgWindowStart >= 1000) {
      p.msgWindowStart = now;
      p.msgCount = 0;
    }
    if (++p.msgCount > MAX_INPUT_MSGS_PER_SEC) return;

    // validate payload shape
    if (!msg || typeof msg.x !== "number" || typeof msg.z !== "number") return;
    let { x, z } = msg;
    if (!Number.isFinite(x) || !Number.isFinite(z)) return;
    // intent magnitude can never exceed 1 → speed is bounded by WALK_SPEED
    const len = Math.hypot(x, z);
    if (len > 1) {
      x /= len;
      z /= len;
    }
    p.ix = x;
    p.iz = z;
    p.lastInputAt = now;
  }

  private tick(dtMs: number) {
    const dt = Math.min(dtMs, 100) / 1000; // clamp stalls so a lag spike can't fling anyone
    const now = Date.now();
    for (const p of this.players.values()) {
      let ix = p.ix;
      let iz = p.iz;
      if (!p.connected || now - p.lastInputAt > INPUT_TIMEOUT_MS) ix = iz = 0;

      const wasMoving = p.moving;
      const speed = Math.hypot(ix, iz);
      if (speed > 0.01) {
        const px = p.x;
        const pz = p.z;
        stepMovement(p, ix * WALK_SPEED * dt, iz * WALK_SPEED * dt);
        // facing follows *intended* direction; only count as moving if we actually progressed
        p.ry = Math.atan2(ix, iz);
        p.moving = Math.hypot(p.x - px, p.z - pz) > 1e-4;
        p.dirty = true;
      } else {
        p.moving = false;
        if (wasMoving) p.dirty = true; // one final "stopped" row
      }

      // abnormal-position recovery (should be unreachable, but never trust state)
      if (!Number.isFinite(p.x) || !Number.isFinite(p.z) || !isWalkable(p.x, p.z)) {
        p.x = DEFAULT_SPAWN.x;
        p.z = DEFAULT_SPAWN.z;
        p.dirty = true;
        const c = this.clients.find((c) => c.sessionId === p.id);
        c?.send(S2C_RESET, { x: p.x, z: p.z });
      }
    }

    this.snapAccum += dtMs;
    if (this.snapAccum >= 1000 / SNAPSHOT_HZ - 1) {
      this.snapAccum = 0;
      this.broadcastSnapshot();
    }
  }

  private broadcastSnapshot() {
    const rows: SnapRow[] = [];
    for (const p of this.players.values()) {
      if (!p.dirty) continue;
      p.dirty = false;
      rows.push([p.id, round2(p.x), round2(p.z), round2(p.ry), p.moving ? 1 : 0]);
    }
    if (rows.length === 0) return; // idle room → zero traffic
    const msg: SnapshotMsg = { t: Math.round(this.clock.elapsedTime), p: rows };
    this.broadcast(S2C_SNAPSHOT, msg);
  }
}

function round2(n: number) {
  return Math.round(n * 100) / 100;
}
