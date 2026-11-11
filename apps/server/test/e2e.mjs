// Protocol-level end-to-end test. Run with the server up:  node test/e2e.mjs
import { Client } from "colyseus.js";
const URL = process.env.URL ?? "ws://localhost:2567";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let failed = 0;
const check = (name, ok, extra = "") => { console.log(`${ok ? "PASS" : "FAIL"}  ${name} ${extra}`); if (!ok) failed++; };

function track(room) {
  const s = { you: null, players: new Map(), joins: [], leaves: [], snaps: 0, resets: 0 };
  room.onMessage("welcome", (m) => { s.you = m.you; s.roomId = m.roomId; m.players.forEach((p) => s.players.set(p.id, { ...p })); });
  room.onMessage("join", (p) => { s.players.set(p.id, { ...p }); s.joins.push(p.id); });
  room.onMessage("leave", (id) => { s.players.delete(id); s.leaves.push(id); });
  room.onMessage("reset", () => s.resets++);
  room.onMessage("snap", (m) => { s.snaps++; for (const [id, x, z, ry, mv] of m.p) { const p = s.players.get(id); if (p) Object.assign(p, { x, z, ry, mv }); } });
  return s;
}

const a = await new Client(URL).joinOrCreate("party", { name: "Alice", color: 1 });
const A = track(a); await sleep(200);
const b = await new Client(URL).joinOrCreate("party", { name: "<b>Bob\u0000</b>", color: 99 });
const B = track(b); await sleep(300);

check("same room", A.roomId === B.roomId, A.roomId);
check("A sees B join", A.joins.includes(B.you));
check("B sees A in welcome", B.players.has(A.you));
check("name sanitised, colour clamped", B.players.get(B.you).name === "bBob/b" && B.players.get(B.you).color === 0, B.players.get(B.you).name);

// movement: A walks east (+x) for 1s
const start = { ...A.players.get(A.you) };
for (let i = 0; i < 15; i++) { a.send("input", { x: 1, z: 0 }); await sleep(66); }
a.send("input", { x: 0, z: 0 }); await sleep(400);
const aOnB = B.players.get(A.you);
const moved = aOnB.x - start.x;
check("B sees A moving east", moved > 2.5 && moved < 5.6, `Δx=${moved.toFixed(2)}`);
check("walking speed bounded (~4.6 u/s)", moved < 5.2, `Δx=${moved.toFixed(2)} in ~1s`);
check("A's facing = east", Math.abs(aOnB.ry - Math.PI / 2) < 0.05, aOnB.ry);
check("A reported stopped", aOnB.mv === 0);

// speed hack: huge vector must be clamped
const before = { ...B.players.get(B.you) };
for (let i = 0; i < 15; i++) { b.send("input", { x: -999, z: 0 }); await sleep(66); }
b.send("input", { x: 0, z: 0 }); await sleep(400);
const dxHack = Math.abs(A.players.get(B.you).x - before.x);
check("speed hack (x=-999) clamped", dxHack < 5.6, `Δx=${dxHack.toFixed(2)}`);

// garbage input must not crash or move
const g0 = { ...A.players.get(B.you) };
b.send("input", { x: NaN, z: "foo" }); b.send("input", null); b.send("input", { x: Infinity, z: 0 }); b.send("nonsense", {});
await sleep(400);
check("garbage ignored, still connected", b.connection.isOpen && A.players.get(B.you).x === g0.x);

// walk into the cliff for 12 s: must stay on island
for (let i = 0; i < 160; i++) { b.send("input", { x: 0, z: 1 }); await sleep(66); }
b.send("input", { x: 0, z: 0 }); await sleep(300);
const pb = A.players.get(B.you);
check("cliff edge holds (south run)", Math.hypot(pb.x, pb.z) <= 23 - 0.74, `r=${Math.hypot(pb.x, pb.z).toFixed(2)}`);

// flood: >40 msgs/s
let sent = 0; const t0 = Date.now();
while (Date.now() - t0 < 1000) { b.send("input", { x: 1, z: 0 }); sent++; await sleep(2); }
b.send("input", { x: 0, z: 0 }); await sleep(300);
check("flood tolerated", b.connection.isOpen, `sent ${sent}`);

// reconnection: drop A's socket abruptly
const token = a.reconnectionToken;
const posBefore = { ...A.players.get(A.you) };
a.connection.transport.ws.close(4001); // abnormal drop (4000 = consented leave)
await sleep(600);
check("B still sees A during reconnect window", B.players.has(A.you) && !B.leaves.includes(A.you));
const a2 = await new Client(URL).reconnect(token);
const A2 = track(a2); await sleep(400);
check("A reconnected with same session", A2.you === A.you, A2.you);
check("A position restored", Math.hypot(A2.players.get(A2.you).x - posBefore.x, A2.players.get(A2.you).z - posBefore.z) < 0.2);

// leave
a2.leave(); await sleep(400);
check("B sees A leave", B.leaves.includes(A.you));

// capacity: 16 per room, 17th goes to a new room
const rooms = [];
for (let i = 0; i < 16; i++) rooms.push(await new Client(URL).joinOrCreate("party", { name: "bot" + i, color: i % 6 }));
const ids = new Set(rooms.map((r) => r.roomId));
const extra = await new Client(URL).joinOrCreate("party", { name: "overflow", color: 0 });
check("rooms cap at 16 (17th+ in another room)", [...ids].every((id) => id) && rooms.filter((r) => r.roomId === b.roomId).length <= 15 && extra.roomId, `rooms=${ids.size}`);
// join by invite id
const inv = await new Client(URL).joinById(b.roomId, { name: "Invited", color: 2 }).catch((e) => e);
check("joinById works / full room rejects cleanly", inv?.roomId === b.roomId || /full|locked/i.test(String(inv?.message)), inv?.message ?? "joined");

for (const r of [...rooms, extra, b]) try { r.leave(); } catch {}
await sleep(300);
console.log(failed ? `\n${failed} FAILED` : "\nALL PASSED");
process.exit(failed ? 1 : 0);
