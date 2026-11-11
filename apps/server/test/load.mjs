// Load test: N bots in ONE room, all walking randomly at the real input rate. Server must be running.
//   node test/load.mjs [bots=16] [seconds=20]
import { Client } from "colyseus.js";
const N = Number(process.argv[2] ?? 16), SECS = Number(process.argv[3] ?? 20), URL = process.env.URL ?? "ws://localhost:2567";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const bots = [];
let bytes = 0, msgs = 0;
for (let i = 0; i < N; i++) {
  const room = await new Client(URL).joinOrCreate("party", { name: "bot" + i, color: i % 6 });
  const bot = { room, seen: 0, lat: [] };
  room.connection.transport.ws.addEventListener("message", (ev) => { bytes += ev.data.byteLength ?? ev.data.length ?? 0; msgs++; });
  room.onMessage("snap", (m) => { bot.seen += m.p.length; });
  for (const t of ["welcome", "join", "leave", "reset"]) room.onMessage(t, () => {});
  bots.push(bot);
}
const roomIds = new Set(bots.map((b) => b.room.roomId));
console.log(`joined ${N} bots into ${roomIds.size} room(s)`);
const t0 = Date.now(); bytes = 0; msgs = 0;
const cpu0 = process.cpuUsage();
let sent = 0;
const timers = bots.map((b, i) => {
  let a = Math.random() * 6.28;
  return setInterval(() => {
    if (Math.random() < 0.05) a = Math.random() * 6.28;
    b.room.send("input", { x: Math.sin(a), z: Math.cos(a) }); sent++;
  }, 1000 / 15);
});
await sleep(SECS * 1000);
timers.forEach(clearInterval);
const secs = (Date.now() - t0) / 1000;
const per = bytes / N / secs;
console.log(`inputs sent: ${sent} (${(sent / secs / N).toFixed(1)}/s per bot)`);
console.log(`downstream per client: ${(per / 1024).toFixed(1)} KiB/s  (${(per * 8 / 1000).toFixed(0)} kbit/s), ${(msgs / N / secs).toFixed(1)} msgs/s`);
console.log(`total server→clients: ${(bytes / secs / 1024).toFixed(0)} KiB/s`);
const full = bots.every((b) => b.room.connection.isOpen);
console.log(`all ${N} connections still open: ${full}`);
for (const b of bots) b.room.leave();
await sleep(300);
process.exit(full && roomIds.size === 1 ? 0 : 1);
