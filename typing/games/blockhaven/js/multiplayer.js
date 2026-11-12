// Play Together: one player hosts their world, friends join with a room code. No logins.
// The host's game runs the real world; the relay (blockhaven-relay on Cloudflare) only passes messages along.
// Stage 1: rooms, joining, seeing each other, the host's building shows up live.
// Stage 2: guests build too (the host's game checks each change), chests and furnaces go through the host,
//          quick messages with speech bubbles, and each guest's backpack is kept on their own computer.
// Full plan: MULTIPLAYER-PLAN.md.
import { randomName, randomCode, validName, tidyCode, CODE_RE } from "./mp-words.js";

export const MP_PROTOCOL = 2;      // raise when messages change, so old and new games don't mix
const RELAY = "wss://blockhaven-relay.watford-ai.workers.dev/ws";
const NAME_KEY = "blockhaven-mp-name";
const PACK_KEY = "blockhaven-mp-pack:";   // + the host's world id: a guest's backpack for that world
const SEND_EVERY = 0.1;            // seconds between position updates (only sent when you moved)
const ENV_EVERY = 5;               // seconds between time-of-day updates from the host
const REACH = 9;                   // how far (blocks) from a guest the host accepts their changes (play reach is 5, plus lag)
export const QUICK = ["Follow me!", "Over here!", "Nice build!", "Help!", "Thanks!", "Be right back"];
// things only the host can use while playing together (story pieces, machines with their own storage, sleeping)
const HOST_ONLY = new Set(["hopper", "dropper", "dispenser", "crafter", "beacon", "anchor", "anchorstation", "cinderaltar", "lodestone", "frame",
  "solkara_gate", "pedestal", "waystone", "wardstone", "wardaltar", "socket", "rune", "returngate", "resonator", "palealtar", "mural", "mirror",
  "lift", "checkpoint", "arenaward", "maptable", "hive", "bed"]);
const BOX_KINDS = new Set(["chest", "shellbox", "furnace"]);
const r2 = n => Math.round(n * 100) / 100;

export function initMultiplayer({ G, THREE, scene, UI, Sound, snapshot, makeModel, poseModel, disposeModel, World, CHUNK, HEIGHT, idx, chunkKey, version,
  openPanel, closePanel, breakBlock, prepareContainer, guestMayChange, validBlock, blockDef, itemDef, WATER, LAVA }) {
  const $ = id => document.getElementById(id);
  // a development copy can point at a relay running on this computer: ?relay=ws://localhost:8787/ws
  const asked = new URLSearchParams(location.search).get("relay");
  const relayURL = asked && /^ws:\/\/(localhost|127\.0\.0\.1)(:\d+)?\/ws$/.test(asked) ? asked : RELAY;

  let ws = null, role = null, code = null, myName = null, keepAlive = null;
  let phase = "idle";            // idle | connecting | waiting | loading | in   (guest) / idle | starting | hosting (host)
  let message = "", locked = false, hostPaused = false, worldName = "", hostWorld = null;
  let sendT = 0, envT = 0, blockT = 0, boxT = 0, packT = 0, last = null, sinceSend = 0, noteT = 0, triesLeft = 0, sayT = 0;
  let applying = false;          // true while applying the other side's block changes (so they aren't sent back)
  let quickOpen = false;
  const players = new Map();     // id → { id, name, skin, model, tag, bubble, bubbleT, cur, tgt, crouch, walk }
  const asks = new Map();        // id → { id, name, skin }
  const blocks = new Map();      // "x,y,z" → block value waiting to be sent (host: to everyone; guest: to the host)
  const locks = new Map();       // host: container key → guest id using it
  const sentBox = new Map();     // host: container key → last contents sent to the guest using it (furnaces keep cooking)
  let early = [];                // guest: block changes that arrived before the world was ready
  let wantBox = null, openBox = null, openBoxSent = "";   // guest: the container asked for / open now

  try { myName = localStorage.getItem(NAME_KEY); } catch (e) { /* storage blocked */ }
  if (!validName(myName)) newName();
  function newName() { myName = randomName(); try { localStorage.setItem(NAME_KEY, myName); } catch (e) { /* storage blocked */ } }

  // ---------- connection ----------
  function connect(params) {
    const u = new URL(relayURL);
    for (const [k, v] of Object.entries({ ...params, name: myName, skin: G.settings.skin || "explorer", v: version })) u.searchParams.set(k, v);
    let s;
    try { s = new WebSocket(u); } catch (e) { return null; }
    s.onmessage = e => { if (e.data === "pong") return; let m; try { m = JSON.parse(e.data); } catch (_) { return; } onMessage(m); };
    s.onclose = () => { if (s === ws) dropped(); };
    clearInterval(keepAlive);
    keepAlive = setInterval(() => { if (ws && ws.readyState === 1) ws.send("ping"); }, 30000);
    return s;
  }
  function send(m) { if (ws && ws.readyState === 1) ws.send(JSON.stringify(m)); }
  function close() {
    const s = ws; ws = null; clearInterval(keepAlive);
    if (s) { try { s.close(1000); } catch (e) { /* closed */ } }
  }

  // The connection ended. Work out what to tell the player.
  function dropped() {
    ws = null; clearInterval(keepAlive);
    const why = message || (role === "host" ? "Play Together stopped: the connection was lost." : phase === "connecting" ? "Couldn't reach Play Together. The school network may be blocking it, or it may be resting until tomorrow." : "The connection to the host was lost.");
    if (role === "host") { stopHosting(); UI.toast(why, "bad"); message = why; render(); return; }
    if (role === "guest") {
      // leave the world while still marked as a guest, so the host's world is never saved here (toTitle then resets us)
      if (G.guest) G.toTitle().then(() => { message = why; UI.show("together"); UI.toast(why, "bad"); });
      else { reset(); message = why; render(); }
    }
  }
  function reset() {
    if (role === "guest" && G.guest) savePack();
    role = null; code = null; phase = "idle"; locked = false; hostPaused = false; worldName = ""; hostWorld = null;
    asks.clear(); blocks.clear(); locks.clear(); sentBox.clear(); early = []; last = null; wantBox = openBox = null; openBoxSent = "";
    for (const id of [...players.keys()]) removePlayer(id);
    G.guest = null;
    showQuick(false); banner();
  }

  function onMessage(m) {
    if (m.t === "err") { message = m.text || "Play Together couldn't connect."; if (m.why === "taken" && role === "host" && triesLeft-- > 0) { message = ""; const s = ws; ws = null; try { s.close(); } catch (e) { /* closed */ } openHost(); } return; }
    if (m.t === "p") { movePlayer(m.from || "h", m); return; }
    if (m.t === "say") { heard(m.from || "h", m.n); return; }
    if (m.t === "join") { addPlayer(m); UI.toast(m.name + " joined the world.", "good"); render(); return; }
    if (m.t === "leave") { const p = players.get(m.id); if (p) UI.toast(p.name + " left the world."); removePlayer(m.id); freeLocks(m.id); render(); return; }
    if (role === "host") return hostMessage(m);
    if (role === "guest") return guestMessage(m);
  }

  // ---------- hosting ----------
  function hostProblem() {
    if (!G.world || !G.meta) return "Open one of your worlds first.";
    if (G.meta.campaign) return "Legacy Campaign worlds stay single-player.";
    if (G.meta.hardcore) return "Hardcore worlds stay single-player.";
    if (G.dim !== "overworld") return "Go back to the Surface first. Visiting other dimensions together comes in a later update.";
    if (!G.creative) return "For now, Play Together works in Creative mode. Switch this world to Creative under World options in the pause menu, then try again. (Survival together comes in a later update.)";
    return null;
  }
  function startHosting() {
    const problem = hostProblem();
    if (problem) { message = problem; render(); return; }
    role = "host"; phase = "starting"; message = ""; triesLeft = 5;
    openHost(); render();
  }
  function openHost() {
    code = randomCode();
    ws = connect({ room: code, role: "host" });
    if (!ws) { message = "This browser couldn't start a live connection."; reset(); render(); }
  }
  function stopHosting() {
    const was = role === "host";
    close(); reset();
    if (was) render();
  }
  function hostMessage(m) {
    if (m.t === "hosting") { phase = "hosting"; Sound.click(); UI.toast("You're hosting! Room code: " + code, "good"); render(); return; }
    if (m.t === "ask") {
      if (m.v !== version) { send({ t: "deny", id: m.id, text: "Your game and the host's game are different versions. Both of you: refresh the page (Ctrl+Shift+R), then try again." }); return; }
      asks.set(m.id, { id: m.id, name: m.name, skin: m.skin });
      Sound.click(); banner(); render();
      return;
    }
    if (m.t === "askgone") { asks.delete(m.id); banner(); render(); return; }
    if (m.t === "locked") { locked = m.on; render(); return; }
    const from = players.get(m.from);
    if (!from) return;
    if (m.t === "s") { guestChanges(from, m.l); return; }
    if (m.t === "open") { guestOpens(from, m); return; }
    if (m.t === "boxset") { guestBox(from, m); return; }
  }
  async function allow(id) {
    const a = asks.get(id); if (!a) return;
    asks.delete(id); banner(); render();
    send({ t: "allow", id });
    try {
      const data = await pack(guestSave());
      if (data.length > 7.5 * 1024 * 1024) { send({ t: "kick", id }); UI.toast("This world is too big to share right now.", "bad"); return; }
      send({ t: "welcome", to: id, data, wid: G.meta.id });
    } catch (e) { send({ t: "kick", id }); UI.toast("Sharing the world didn't work: " + e.message, "bad"); }
  }
  function deny(id) { asks.delete(id); send({ t: "deny", id }); banner(); render(); }
  function kick(id) { send({ t: "kick", id }); const p = players.get(id); if (p) UI.toast(p.name + " was removed."); removePlayer(id); freeLocks(id); render(); }

  // What a guest receives: the land (seed + every change), the story's building plans, and a Creative visitor's start.
  // Sign writing stays behind: nothing a student typed reaches another student.
  function guestSave() {
    const s = snapshot(), dim = G.dim, d = { ...s.dims[dim] }, p = G.player;
    delete d.entities; d.drops = []; d.signs = {};
    return {
      id: "guest-" + code, name: "", seed: s.seed, mode: "creative", hardcore: false, hardcoreOver: false,
      created: s.created, played: Date.now(), day: s.day, version: s.version, gen: s.gen, time: s.time,
      dims: { [dim]: d }, inventory: [], voidInv: [], adv: {}, story: s.story, tips: s.tips, stats: {}, settings: s.settings, campaign: null, xp: 0,
      player: { pos: { x: p.pos.x + 1.5, y: p.pos.y, z: p.pos.z + 1.5 }, yaw: p.yaw, pitch: 0, health: 20, hunger: 20, sat: 5, exhaust: 0, spawn: s.player.spawn, flying: true, dim, effects: {}, elv: {}, absorb: 0 }
    };
  }

  // A guest changed some blocks. Check each one, then make it happen in the real world (or put it back for them).
  function guestChanges(from, l) {
    const w = G.world;
    if (!Array.isArray(l) || !w || !from.tgt) return;
    const undo = [];
    for (let i = 0; i + 3 < l.length && i < 1200; i += 4) {
      const x = l[i], y = l[i + 1], z = l[i + 2], v = l[i + 3];
      if (![x, y, z, v].every(Number.isInteger) || y < 0 || y >= HEIGHT || v < 0 || v > 0xffff) continue;
      const old = w.get(x, y, z), t = from.tgt;
      if (old === v) continue;
      const far = Math.hypot(x + 0.5 - t.x, y + 0.5 - (t.y + 1), z + 0.5 - t.z) > REACH;
      if (far || !validBlock(v) || !guestMayChange(x, y, z, old, v)) { if (w.isLoaded(x, z)) undo.push(x, y, z, old); continue; }
      if (!w.isLoaded(x, z)) { setUnloaded(w, x, y, z, v); blocks.set(x + "," + y + "," + z, v); continue; }
      // the guest broke something: let the game do everything breaking does (doors, chests spilling, story pieces)
      const nid = v & 255, oid = old & 255;
      if ((nid === 0 || nid === WATER) && oid !== 0 && oid !== WATER && oid !== LAVA) breakBlock(x, y, z, false, true);
      else w.set(x, y, z, v);
    }
    if (undo.length) send({ t: "b", to: from.id, l: undo });
  }
  function setUnloaded(w, x, y, z, v) {
    const cx = Math.floor(x / CHUNK), cz = Math.floor(z / CHUNK), key = chunkKey(cx, cz);
    let mods = w.mods.get(key);
    if (!mods) { mods = new Map(); w.mods.set(key, mods); }
    mods.set(idx(x - cx * CHUNK, y, z - cz * CHUNK), v);
  }

  // A guest wants to open a chest or furnace. Only one person uses a container at a time.
  function guestOpens(from, m) {
    const { x, y, z } = m, k = x + "," + y + "," + z, w = G.world, t = from.tgt;
    const no = text => send({ t: "box", to: from.id, k, ok: false, text });
    if (![x, y, z].every(Number.isInteger) || !w || !t) return no("That didn't work. Try again.");
    if (Math.hypot(x + 0.5 - t.x, y + 0.5 - (t.y + 1), z + 0.5 - t.z) > REACH) return no("You're too far away from that.");
    if (G.panelCtx === k) return no("The host is using that right now.");
    const user = locks.get(k);
    if (user && user !== from.id) return no((players.get(user)?.name || "Someone") + " is using that right now.");
    if (!prepareContainer(x, y, z)) return no("That can't be opened.");
    locks.set(k, from.id);
    const box = w.containers.get(k);
    sentBox.set(k, JSON.stringify(box));
    send({ t: "box", to: from.id, k, ok: true, box });
  }
  // A guest moved items in the container they have open
  function guestBox(from, m) {
    const w = G.world, k = m.k;
    if (!w || locks.get(k) !== from.id) return;
    const box = w.containers.get(k), b = m.box;
    if (box && b && Array.isArray(b.slots) && b.slots.length === box.slots.length) {
      box.slots = b.slots.map(s => s && itemDef(s.id) && Number.isInteger(s.n) && s.n > 0 && s.n <= 64 ? { ...s } : null);
      if (box.type === "furnace") for (const f of ["burn", "burnMax", "prog"]) if (Number.isFinite(b[f])) box[f] = b[f];
      sentBox.set(k, JSON.stringify(box));
    }
    if (m.done) { locks.delete(k); sentBox.delete(k); }
  }
  function freeLocks(id) { for (const [k, u] of [...locks]) if (u === id) { locks.delete(k); sentBox.delete(k); } }
  // furnaces keep cooking on the host: show the guest using one how it's going
  function pushBoxes() {
    for (const [k, u] of locks) {
      const box = G.world.containers.get(k);
      if (!box) { send({ t: "box", to: u, k, gone: true }); locks.delete(k); sentBox.delete(k); continue; }
      const now = JSON.stringify(box);
      if (now !== sentBox.get(k)) { sentBox.set(k, now); send({ t: "box", to: u, k, ok: true, upd: true, box }); }
    }
  }

  // block changes, gathered and sent ten times a second (host → everyone, guest → host)
  World.onAnySet = (w, x, y, z, v) => {
    if (applying || w !== G.world) return;
    if ((role === "host" && players.size) || (role === "guest" && phase === "in")) blocks.set(x + "," + y + "," + z, v);
  };
  function flushBlocks() {
    if (!blocks.size) return;
    const l = [], max = role === "host" ? 8000 : 1200;
    for (const [k, v] of blocks) { const [x, y, z] = k.split(",").map(Number); l.push(x, y, z, v); if (l.length >= max) break; }
    for (let i = 0; i < l.length; i += 4) blocks.delete(l[i] + "," + l[i + 1] + "," + l[i + 2]);
    send({ t: role === "host" ? "b" : "s", l });
  }

  // ---------- joining ----------
  function join(text) {
    const c = tidyCode(text);
    if (!CODE_RE.test(c)) { message = "That room code doesn't look right. It's two words and a number, like MAPLE-OTTER-27."; render(); return; }
    close(); reset();
    role = "guest"; code = c; phase = "connecting"; message = "";
    ws = connect({ room: c, role: "guest" });
    if (!ws) { message = "This browser couldn't start a live connection."; reset(); }
    render();
  }
  function cancelJoin() { close(); reset(); message = ""; render(); }
  async function guestMessage(m) {
    if (m.t === "wait") { phase = "waiting"; render(); return; }
    if (m.t === "allowed") { phase = "loading"; for (const p of m.players || []) addPlayer(p); render(); return; }
    if (m.t === "welcome") {
      if (phase !== "loading") return;
      let save;
      try { save = await unpack(m.data); } catch (e) { message = "The world didn't arrive in one piece. Try joining again."; close(); reset(); render(); return; }
      if (role !== "guest") return;   // cancelled while unpacking
      const host = players.get("h");
      worldName = (host ? host.name : "The host") + "'s world";
      hostWorld = typeof m.wid === "string" ? m.wid.slice(0, 40) : null;
      save.name = worldName + " (visiting)";
      save.inventory = loadPack();
      G.guest = { code };
      await G.joinWorld(save);
      if (!G.world || !G.guest) { if (role === "guest") { message = "The world couldn't be opened."; close(); reset(); render(); } return; }
      phase = "in";
      for (const b of early) applyBlocks(b);
      early = [];
      UI.toast("You joined " + worldName + "! Build together, and press T for quick messages.", "good");
      return;
    }
    if (m.t === "b") { if (G.guest && G.world) applyBlocks(m.l); else early.push(m.l); return; }
    if (m.t === "box") { hostBox(m); return; }
    if (m.t === "env") { if (G.guest && typeof m.time === "number") { G.time = m.time; if (G.meta) G.meta.day = m.day || G.meta.day; } return; }
    if (m.t === "hp") { hostPaused = !!m.on; banner(); return; }
  }
  function applyBlocks(l) {
    const w = G.world;
    if (!Array.isArray(l) || !w) return;
    applying = true;
    try {
      for (let i = 0; i + 3 < l.length; i += 4) {
        const x = l[i], y = l[i + 1], z = l[i + 2], v = l[i + 3];
        if (![x, y, z, v].every(Number.isInteger) || y < 0 || y >= HEIGHT) continue;
        if (openBox === x + "," + y + "," + z && !BOX_KINDS.has(blockDef(v).interact)) { openBox = null; closePanel(); UI.toast("That was broken."); }
        if (!w.set(x, y, z, v)) setUnloaded(w, x, y, z, v);   // that land isn't loaded here yet: remember it for later
      }
    } finally { applying = false; }
  }
  // the host answered about a chest or furnace
  function hostBox(m) {
    const w = G.world; if (!w || !G.guest) return;
    if (m.gone) { if (openBox === m.k) { openBox = null; closePanel(); } return; }
    if (!m.ok) { if (wantBox === m.k) wantBox = null; UI.toast(m.text || "That can't be opened right now.", "bad"); return; }
    const box = m.box;
    if (!box || !Array.isArray(box.slots)) return;
    if (m.upd) {   // the furnace cooked a little more; only take it if I haven't moved anything since my last send
      const mine = w.containers.get(m.k);
      if (openBox !== m.k || !mine || JSON.stringify(mine) !== openBoxSent) return;
      Object.assign(mine, box); openBoxSent = JSON.stringify(mine); UI.refreshPanel();
      return;
    }
    if (wantBox !== m.k) { send({ t: "boxset", k: m.k, box, done: true }); return; }   // too late: give it back
    wantBox = null;
    w.containers.set(m.k, box);
    openBox = m.k; openBoxSent = JSON.stringify(box);
    Sound.door(true);
    openPanel(box.type === "furnace" ? "furnace" : "chest", m.k);
  }
  function watchBox() {
    if (!openBox) return;
    const box = G.world.containers.get(openBox), stillOpen = G.panelCtx === openBox;
    const now = box ? JSON.stringify(box) : "";
    if (box && (now !== openBoxSent || !stillOpen)) { send({ t: "boxset", k: openBox, box, done: !stillOpen }); openBoxSent = now; }
    if (!stillOpen) openBox = null;
  }

  // a guest's backpack, kept on their own computer for each world they visit
  function packKey() { return hostWorld ? PACK_KEY + hostWorld : null; }
  function loadPack() { try { const k = packKey(), t = k && localStorage.getItem(k); const a = t ? JSON.parse(t) : []; return Array.isArray(a) ? a : []; } catch (e) { return []; } }
  function savePack() { try { const k = packKey(); if (k && G.inv) localStorage.setItem(k, JSON.stringify(G.inv.toJSON())); } catch (e) { /* storage blocked or full */ } }
  window.addEventListener("pagehide", () => { if (role === "guest" && G.guest) savePack(); });

  // Guests: chests and furnaces go through the host, story pieces stay with the host, and signs can't be written.
  // Host: can't open a container a guest is using.
  function useBlock(hit, kind) {
    const k = hit.x + "," + hit.y + "," + hit.z;
    if (role === "host" && locks.has(k) && BOX_KINDS.has(kind)) { UI.toast((players.get(locks.get(k))?.name || "Someone") + " is using that right now."); return true; }
    if (!G.guest) return false;
    if (BOX_KINDS.has(kind)) {
      if (wantBox) return true;
      wantBox = k; send({ t: "open", x: hit.x, y: hit.y, z: hit.z });
      setTimeout(() => { if (wantBox === k) { wantBox = null; UI.toast("The host didn't answer. Try again.", "bad"); } }, 5000);
      return true;
    }
    if (kind === "sign") {
      const signs = G.dimData[G.dim]?.signs;
      if (signs && signs[k]) return false;   // reading is fine
      UI.toast("Signs can't be written while playing together.");
      return true;
    }
    if (HOST_ONLY.has(kind)) { note("Only the host can use that while playing together."); return true; }
    return false;
  }
  function note(text) { if (performance.now() - noteT > 2500) { noteT = performance.now(); UI.toast(text); } }

  // ---------- quick messages ----------
  function say(n) {
    if (!Number.isInteger(n) || n < 0 || n >= QUICK.length) return;
    if (performance.now() - sayT < 1500) { note("Wait a moment before the next message."); return; }
    sayT = performance.now();
    send({ t: "say", n });
    UI.toast("You: " + QUICK[n]);
  }
  function heard(id, n) {
    const p = players.get(id);
    if (!p || !Number.isInteger(n) || n < 0 || n >= QUICK.length) return;
    UI.toast(p.name + ": " + QUICK[n]);
    p.say = QUICK[n]; p.sayT = 5;
    if (p.bubble) { p.model.holder.remove(p.bubble); p.bubble.material.map.dispose(); p.bubble.material.dispose(); p.bubble = null; }
  }
  function showQuick(on) {
    quickOpen = on;
    const box = $("mpQuick"); if (!box) return;
    if (on) box.innerHTML = `<b>Quick message</b>` + QUICK.map((q, i) => `<div><kbd>${i + 1}</kbd> ${q}</div>`).join("") + `<small>T or Esc to close</small>`;
    box.hidden = !on;
  }

  // ---------- other players ----------
  function addPlayer(p) {
    if (!p || players.has(p.id)) return;
    players.set(p.id, { id: p.id, name: p.name, skin: p.skin, model: null, tag: null, bubble: null, say: null, sayT: 0, cur: null, tgt: null, crouch: false, walk: 0 });
  }
  function dropSprite(holder, s) { if (!s) return; holder.remove(s); s.material.map.dispose(); s.material.dispose(); }
  function removePlayer(id) {
    const p = players.get(id); if (!p) return;
    if (p.model) { dropSprite(p.model.holder, p.tag); dropSprite(p.model.holder, p.bubble); scene.remove(p.model.holder); disposeModel(p.model); }
    players.delete(id);
  }
  function movePlayer(id, m) {
    const p = players.get(id); if (!p) return;
    if (![m.x, m.y, m.z, m.yw, m.pt].every(Number.isFinite)) return;
    p.tgt = { x: m.x, y: m.y, z: m.z, yaw: m.yw, pitch: m.pt };
    if (!p.cur) p.cur = { ...p.tgt };
    p.crouch = !!m.c;
  }
  function label(text, bubble) {
    const c = document.createElement("canvas"); c.width = 256; c.height = 48;
    const x = c.getContext("2d");
    x.font = "bold 26px system-ui, sans-serif";
    const w = Math.min(248, x.measureText(text).width + 24);
    x.fillStyle = bubble ? "rgba(255,255,255,.92)" : "rgba(0,0,0,.5)"; x.fillRect((256 - w) / 2, 4, w, 40);
    x.fillStyle = bubble ? "#1d2433" : "#fff"; x.textAlign = "center"; x.textBaseline = "middle"; x.fillText(text, 128, 25);
    const tex = new THREE.CanvasTexture(c);
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false }));
    s.scale.set(1.6, 0.3, 1); s.position.y = bubble ? 2.5 : 2.15;
    return s;
  }
  function drawPlayers(dt) {
    const k = 1 - Math.exp(-dt * 12);
    for (const p of players.values()) {
      if (!p.tgt || !G.world) { if (p.model) p.model.holder.visible = false; continue; }
      if (!p.model) {
        p.model = makeModel(p.skin); p.tag = label(p.name, false);
        p.model.holder.add(p.tag); scene.add(p.model.holder);
      }
      if (p.say && !p.bubble) { p.bubble = label(p.say, true); p.model.holder.add(p.bubble); }
      if (p.sayT > 0 && (p.sayT -= dt) <= 0) { dropSprite(p.model.holder, p.bubble); p.bubble = null; p.say = null; }
      const c = p.cur, t = p.tgt, ox = c.x, oz = c.z;
      c.x += (t.x - c.x) * k; c.y += (t.y - c.y) * k; c.z += (t.z - c.z) * k; c.pitch += (t.pitch - c.pitch) * k;
      const dy = Math.atan2(Math.sin(t.yaw - c.yaw), Math.cos(t.yaw - c.yaw)); c.yaw += dy * k;
      const moved = Math.hypot(c.x - ox, c.z - oz);
      p.walk += moved * 2.2;
      p.model.holder.visible = true;
      p.model.holder.position.set(c.x, c.y, c.z);
      p.model.holder.rotation.y = c.yaw + Math.PI;
      poseModel(p.model, { walkPhase: p.walk, speed: dt > 0 ? moved / dt : 0, pitch: -c.pitch, crouch: p.crouch, swing: 0 });
    }
  }

  // ---------- every frame ----------
  function tick(dt) {
    drawPlayers(dt);
    if (!ws || !G.world || !G.player) return;
    const inWorld = role === "host" ? phase === "hosting" : phase === "in";
    if (!inWorld) return;
    if (role === "host") {
      const problem = hostProblem();
      if (problem) { stopHosting(); UI.toast("Play Together stopped. " + problem, "bad"); return; }
      if (players.size && (envT += dt) >= ENV_EVERY) { envT = 0; send({ t: "env", time: r2(G.time * 1e4) / 1e4, day: G.meta.day || 1 }); }
      if (locks.size && (boxT += dt) >= 0.5) { boxT = 0; pushBoxes(); }
    } else {
      if ((boxT += dt) >= 0.25) { boxT = 0; watchBox(); }
      if ((packT += dt) >= 30) { packT = 0; savePack(); }
    }
    if ((blockT += dt) >= 0.1) { blockT = 0; flushBlocks(); }
    // my position: only when I moved (and once every few seconds so a new arrival sees me)
    sendT += dt; sinceSend += dt;
    if (sendT < SEND_EVERY) return;
    sendT = 0;
    if (role === "host" && !players.size) return;
    const p = G.player, now = [r2(p.pos.x), r2(p.pos.y), r2(p.pos.z), r2(p.yaw), r2(p.pitch), p.crouch && !p.flying ? 1 : 0];
    if (last && sinceSend < 3 && now.every((v, i) => v === last[i])) return;
    last = now; sinceSend = 0;
    send({ t: "p", x: now[0], y: now[1], z: now[2], yw: now[3], pt: now[4], c: now[5] });
  }

  // tell guests when the host's tab is hidden (the host's world stops while it's in the background)
  document.addEventListener("visibilitychange", () => {
    if (role === "host" && phase === "hosting") send({ t: "hp", on: document.hidden });
    if (role === "host" && !document.hidden) last = null;   // send my position again right away
  });
  // T: quick messages (1–6 send one). Y: the host lets in the friend who's asking. Runs before the game's own keys.
  window.addEventListener("keydown", e => {
    const connected = (role === "host" && phase === "hosting") || (role === "guest" && phase === "in");
    if (quickOpen) {
      if (/^Digit[1-6]$/.test(e.code)) { e.preventDefault(); e.stopImmediatePropagation(); say(+e.code.slice(5) - 1); showQuick(false); return; }
      if (e.code === "KeyT" || e.code === "Escape" || G.state !== "play") { if (e.code !== "Escape") { e.preventDefault(); e.stopImmediatePropagation(); } showQuick(false); return; }
    }
    if (e.code === "KeyT" && connected && G.state === "play" && !e.repeat) { e.preventDefault(); e.stopImmediatePropagation(); showQuick(true); return; }
    if (e.code === "KeyY" && role === "host" && asks.size && G.state === "play") { e.preventDefault(); allow(asks.keys().next().value); }
    else if (e.code === "Escape" && UI.current === "together") { e.preventDefault(); back(); }
  }, true);

  // ---------- the banner at the top of the screen ----------
  function banner() {
    const b = $("mpBanner"); if (!b) return;
    let text = "";
    if (role === "host" && asks.size) { const a = asks.values().next().value; text = a.name + " wants to join! Press Y to let them in, or open the menu (Esc) to say no."; }
    else if (role === "guest" && hostPaused) text = "The host's game is paused. Waiting for them to come back…";
    b.textContent = text; b.hidden = !text;
  }

  // ---------- the Play Together screen ----------
  const esc = s => String(s).replace(/[&<>"']/g, ch => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch]));
  function playerRows(canKick) {
    const rows = [`<li><b>${esc(myName)}</b> <small>(you${role === "host" ? ", host" : ""})</small></li>`];
    for (const p of players.values()) rows.push(`<li><b>${esc(p.name)}</b>${p.id === "h" ? " <small>(host)</small>" : ""}${canKick ? ` <button class="btn small danger" data-kick="${esc(p.id)}">Remove</button>` : ""}</li>`);
    return `<ul class="mp-list">${rows.join("")}</ul>`;
  }
  const nameRow = (canChange) => `<div class="mp-name">Your name: <b>${esc(myName)}</b>${canChange ? ` <button class="btn small" data-act="rename" title="Pick another name">🎲 New name</button>` : ""}</div>`;
  const keysNote = `<p class="note">Press <b>T</b> while playing for quick messages (Follow me!, Nice build!…).</p>`;
  function render() {
    const body = $("mpBody"); if (!body) return;
    let html = message ? `<p class="warn">${esc(message)}</p>` : "";
    if (role === "guest" && phase === "in") {
      html += `<p class="note">You're visiting <b>${esc(worldName)}</b> (room <b>${esc(code)}</b>). The world stays on the host's computer. Your backpack is kept on this one for next time.</p>`;
      html += playerRows(false) + keysNote;
      html += `<div class="row"><button class="btn danger" data-act="leave">Leave this world</button></div>`;
    } else if (role === "guest") {
      html += `<p class="mp-status">${phase === "connecting" ? "Connecting…" : phase === "waiting" ? "Asking the host to let you in…" : "Getting the world from the host…"}</p>`;
      html += `<p class="note">Room <b>${esc(code)}</b></p><div class="row"><button class="btn" data-act="cancel">Cancel</button></div>`;
    } else if (role === "host") {
      if (phase !== "hosting") html += `<p class="mp-status">Starting…</p>`;
      else {
        html += `<p class="note">Tell your friends this room code. They choose <b>Play Together</b> on the title screen and type it in.</p><div class="mp-code">${esc(code)}</div>`;
        for (const a of asks.values()) html += `<div class="mp-ask"><span><b>${esc(a.name)}</b> wants to join.</span><span><button class="btn small primary" data-allow="${esc(a.id)}">Let in</button> <button class="btn small" data-deny="${esc(a.id)}">Say no</button></span></div>`;
        html += playerRows(true);
        html += `<label class="set"><span>Lock the world (nobody new can ask to join)</span><input type="checkbox" id="mpLock"${locked ? " checked" : ""}></label>`;
        html += `<p class="note">Your friends keep playing while you're in this menu. Keep this tab in front: if you switch tabs, the world pauses for everyone.</p>` + keysNote;
        html += `<div class="row"><button class="btn danger" data-act="stop">Stop hosting</button></div>`;
      }
    } else if (G.world && !G.guest) {
      const problem = hostProblem();
      html += `<p class="note">Let friends join this world and build with you. You'll get a room code to share. Up to 5 friends can join, and you choose who comes in. Everything they build is saved in your world.</p>`;
      html += nameRow(true);
      if (problem) html += `<p class="warn">${esc(problem)}</p>`;
      html += `<div class="row"><button class="btn primary" data-act="host"${problem ? " disabled" : ""}>Start hosting</button></div>`;
    } else {
      html += `<p class="note">Join a friend's world. Type the room code they tell you.</p>`;
      html += nameRow(true);
      html += `<label class="field">Room code <input class="text-in" id="mpCode" maxlength="24" placeholder="MAPLE-OTTER-27" autocomplete="off" spellcheck="false"></label>`;
      html += `<div class="row"><button class="btn primary" data-act="join">Join</button></div>`;
      html += `<p class="note">To host instead, open one of your Creative worlds, press Esc, and choose <b>Play Together</b>. There's no typed chat (just quick messages), and names are picked for you, so nobody shares their real name.</p>`;
    }
    body.innerHTML = html;
    body.querySelectorAll("[data-act]").forEach(b => b.onclick = () => act(b.dataset.act));
    body.querySelectorAll("[data-allow]").forEach(b => b.onclick = () => allow(b.dataset.allow));
    body.querySelectorAll("[data-deny]").forEach(b => b.onclick = () => deny(b.dataset.deny));
    body.querySelectorAll("[data-kick]").forEach(b => b.onclick = () => kick(b.dataset.kick));
    const lock = $("mpLock"); if (lock) lock.onchange = () => send({ t: "lock", on: lock.checked });
    const input = $("mpCode");
    if (input) { input.onkeydown = e => { if (e.key === "Enter") act("join"); }; setTimeout(() => input.focus(), 0); }
  }
  function act(a) {
    Sound.click();
    if (a === "rename") { newName(); message = ""; render(); }
    else if (a === "host") startHosting();
    else if (a === "stop") { stopHosting(); UI.toast("You stopped hosting. Your friends went back to their title screens."); }
    else if (a === "join") join($("mpCode")?.value);
    else if (a === "cancel") cancelJoin();
    else if (a === "leave") G.toTitle();
  }
  function back() {
    Sound.click();
    if (role === "guest" && phase !== "in") cancelJoin();
    message = "";
    UI.show(G.world ? "pause" : "title");
  }
  $("mpBack").onclick = back;

  // ---------- the pause menu while visiting ----------
  G.onShow = name => {
    if (name === "together") render();
    if (name !== "none") showQuick(false);
    if (name === "pause") {
      const visiting = !!G.guest;
      for (const id of ["btnSave", "btnExport", "worldOpts"]) { const el = $(id); if (el) el.hidden = visiting; }
      const t = $("btnTitle"); if (t) t.textContent = visiting ? "Leave this world" : "Save & return to title";
      const b = $("btnTogether2"); if (b) b.textContent = role === "host" && phase === "hosting" ? "👥 Play Together (hosting " + code + ")" : "👥 Play Together";
    }
  };

  return {
    open() { message = ""; UI.show("together"); },
    tick,
    useBlock,
    keepRunning: () => role === "host" && phase === "hosting" && players.size > 0,   // the host's pause menu doesn't freeze friends' world
    noPortals: () => role !== null,
    worldClosed() { if (role) { close(); reset(); } },
    // for tests
    _state: () => ({ role, phase, code, myName, worldName, players: [...players.values()].map(p => ({ id: p.id, name: p.name, at: p.cur && [r2(p.cur.x), r2(p.cur.y), r2(p.cur.z)], say: p.say })), asks: [...asks.keys()], locks: [...locks], openBox, message, locked, hostPaused }),
    _allow: allow, _join: join, _host: startHosting, _say: say,
  };
}

// ---------- packing the world for the trip (gzip, then text) ----------
async function pack(obj) {
  const stream = new Blob([JSON.stringify(obj)]).stream().pipeThrough(new CompressionStream("gzip"));
  const buf = new Uint8Array(await new Response(stream).arrayBuffer());
  let bin = "";
  for (let i = 0; i < buf.length; i += 0x8000) bin += String.fromCharCode.apply(null, buf.subarray(i, i + 0x8000));
  return btoa(bin);
}
async function unpack(b64) {
  const bin = atob(b64), u = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i);
  const stream = new Blob([u]).stream().pipeThrough(new DecompressionStream("gzip"));
  return JSON.parse(await new Response(stream).text());
}
