import { createServer } from "node:http";
import { existsSync, readFileSync, statSync } from "node:fs";
import { extname, join, normalize, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { Server } from "@colyseus/core";
import { WebSocketTransport } from "@colyseus/ws-transport";
import { ROOM_NAME, MAX_PLAYERS_PER_ROOM } from "@sky/shared";
import { PartyRoom } from "./PartyRoom";

const PORT = Number(process.env.PORT ?? 2567);

// Optional: serve the built website (apps/web/dist) from the same port, so one URL = site + game server.
const WEB_DIST = resolve(fileURLToPath(new URL("../../web/dist", import.meta.url)));
const MIME: Record<string, string> = {
  ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".css": "text/css", ".svg": "image/svg+xml",
  ".png": "image/png", ".json": "application/json", ".ico": "image/x-icon", ".webp": "image/webp",
};

const httpServer = createServer((req, res) => {
  const url = (req.url ?? "/").split("?")[0];
  if (url === "/health") {
    res.writeHead(200, { "content-type": "application/json", "access-control-allow-origin": "*" });
    res.end(JSON.stringify({ ok: true, room: ROOM_NAME, maxPlayers: MAX_PLAYERS_PER_ROOM }));
    return;
  }
  // Colyseus attaches its own matchmaking handler; only answer plain GETs for site files.
  if (req.method !== "GET" || url.startsWith("/matchmake") || !existsSync(WEB_DIST)) return;
  let file = normalize(join(WEB_DIST, url === "/" ? "index.html" : url));
  if (!file.startsWith(WEB_DIST)) { res.writeHead(403); res.end("forbidden"); return; } // path traversal guard
  if (!existsSync(file) || !statSync(file).isFile()) file = join(WEB_DIST, "index.html");
  res.writeHead(200, { "content-type": MIME[extname(file)] ?? "application/octet-stream" });
  res.end(readFileSync(file));
});

const gameServer = new Server({
  transport: new WebSocketTransport({ server: httpServer, pingInterval: 5000, pingMaxRetries: 3 }),
});
gameServer.define(ROOM_NAME, PartyRoom);

await gameServer.listen(PORT);
console.log(`🎄 Sky Village server listening on ws://localhost:${PORT}  (health: http://localhost:${PORT}/health)`);
if (existsSync(WEB_DIST)) console.log(`🌐 Serving website from ${WEB_DIST} → http://localhost:${PORT}/`);
