import { createServer } from "node:http";
import { Server } from "@colyseus/core";
import { WebSocketTransport } from "@colyseus/ws-transport";
import { ROOM_NAME, MAX_PLAYERS_PER_ROOM } from "@sky/shared";
import { PartyRoom } from "./PartyRoom";

const PORT = Number(process.env.PORT ?? 2567);

const httpServer = createServer((req, res) => {
  // Colyseus attaches its own matchmaking handler to this server; we only answer /health.
  if (req.url === "/health") {
    res.writeHead(200, { "content-type": "application/json", "access-control-allow-origin": "*" });
    res.end(JSON.stringify({ ok: true, room: ROOM_NAME, maxPlayers: MAX_PLAYERS_PER_ROOM }));
  }
});

const gameServer = new Server({
  transport: new WebSocketTransport({ server: httpServer, pingInterval: 5000, pingMaxRetries: 3 }),
});
gameServer.define(ROOM_NAME, PartyRoom);

await gameServer.listen(PORT);
console.log(`🎄 Sky Village server listening on ws://localhost:${PORT}  (health: http://localhost:${PORT}/health)`);
