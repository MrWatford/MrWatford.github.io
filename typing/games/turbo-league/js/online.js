// Turbo League — online play in the browser: the connection to the relay, the lobby screens, and the
// glue between the network rules (netcode.js) and the game (main.js).
// Uses the same relay as Blockhaven's "Play Together": room codes, the host lets people in, kid-safe random
// names, nothing saved on the server. The relay only passes messages along.
import { HostSession, GuestSession, NET_VERSION, randomName, validName, randomCode, cleanCode, CODE_RE, seatOrder, ZERO_IN } from "./netcode.js";
import { Bot } from "./ai.js";

const RELAY = "wss://blockhaven-relay.watford-ai.workers.dev/ws";
const NAME_KEY = "turbo-league-netname";
const ERR = { // our own words for the relay's reasons (its messages talk about Blockhaven "worlds")
  off: "Online play is turned off right now.", hours: "Online play is closed during class time.", code: "That code doesn't look right. It's two words and a number, like TURBO-OTTER-27.",
  taken: "That code is already in use — try creating the room again.", nohost: "Nobody is hosting with that code. Check it with your friend.", locked: "That room isn't letting anyone new in.",
  full: "That room is full.", denied: "The host said no this time.", kicked: "The host removed you from the room.", hostleft: "The host left, so the room closed.",
  expired: "This room was open for 4 hours, so it closed.", bad: "Something went wrong. Refresh the page and try again.",
};

export function initOnline(ctx) {
  const { $, esc } = ctx;
  const params = new URLSearchParams(location.search);
  const lagMs = Math.min(1000, +(params.get("netlag") || 0)); // testing: pretend the internet is slow
  const relayUrl = (() => { const r = params.get("relay"); return r && /^wss?:\/\/(localhost|127\.0\.0\.1)(:\d+)?\//.test(r) ? r : RELAY; })();
  let myName = (() => { try { const n = localStorage.getItem(NAME_KEY); if (validName(n)) return n; } catch (e) { /* ignore */ } return randomName(); })();
  const saveName = () => { try { localStorage.setItem(NAME_KEY, myName); } catch (e) { /* ignore */ } };
  const O = { mode: "1v1", arena: "championship", length: 180, level: 1 };

  let N = null; // the live connection: { role, ws, code, status, seats, asks, hs, gs, me, ... }
  const now = () => performance.now();

  // ---------- connection ----------
  function connect(role, code) {
    leave(true);
    const body = ctx.myBody();
    const url = `${relayUrl}?room=${encodeURIComponent(code)}&role=${role}&name=${encodeURIComponent(myName)}&skin=tl-${body}&v=${NET_VERSION}`;
    let ws; try { ws = new WebSocket(url); } catch (e) { return fail("Couldn't reach the game server. Check the internet connection."); }
    N = { role, ws, code, status: role === "host" ? "Opening the room…" : "Connecting…", seats: [], asks: [], inMatch: false, me: -1, ruleEvents: [], incoming: [], lastSnapAt: 0, ping: null, closedByUs: false, myId: null };
    ws.onopen = () => { N && N.ws === ws && (N.pinger = setInterval(() => { try { ws.send("ping"); } catch (e) { /* closed */ } if (N && N.role === "guest" && N.joined) send({ t: "pg", c: now() }); }, 2000)); };
    ws.onmessage = (ev) => { if (ev.data === "pong") return; let m; try { m = JSON.parse(ev.data); } catch (e) { return; } lagMs ? setTimeout(() => recv(m, ws), lagMs) : recv(m, ws); };
    ws.onclose = () => { if (!N || N.ws !== ws) return; if (!N.closedByUs && !N.failed) fail(N.inMatch ? "Lost the connection to the game server." : "The connection closed."); };
    ws.onerror = () => { if (N && N.ws === ws && !N.failed) fail("Couldn't reach the game server. Your school network may block it — ask Mr. Watford."); };
    show("lobby");
  }
  function send(m) { if (!N || !N.ws || N.ws.readyState !== 1) return; const txt = JSON.stringify(m); lagMs ? setTimeout(() => { try { N && N.ws.send(txt); } catch (e) { /* closed */ } }, lagMs) : N.ws.send(txt); }
  function fail(text) {
    if (!N) return; N.failed = true; clearInterval(N.pinger);
    const wasMatch = N.inMatch; try { N.ws.close(); } catch (e) { /* closed */ }
    N.status = text; N.dead = true; N.inMatch = false; N.hs = null; N.gs = null;
    if (wasMatch) ctx.endNetMatch(text);
    show("lobby");
  }
  function leave(silent) {
    if (!N) return; N.closedByUs = true; clearInterval(N.pinger); try { N.ws.close(1000, "bye"); } catch (e) { /* closed */ } N = null;
    if (!silent) render();
  }

  // ---------- messages ----------
  function recv(m, ws) {
    if (!N || N.ws !== ws) return;
    if (m.t === "err") { N.failed = true; return fail(ERR[m.why] || m.text || ERR.bad); }
    if (N.role === "host") hostRecv(m); else guestRecv(m);
  }
  function hostRecv(m) {
    if (m.t === "hosting") { N.status = "Room open! Tell your friends the code."; N.seats = makeSeats(); render(); return; }
    if (m.t === "ask") {
      if (m.v !== NET_VERSION || !/^tl-/.test(m.skin || "")) { send({ t: "deny", id: m.id, text: "That code belongs to a different game (or an older version of Turbo League — refresh the page)." }); return; }
      if (!freeSeat()) { send({ t: "deny", id: m.id, text: "The room is full." }); return; }
      N.asks.push({ id: m.id, name: m.name, body: m.skin.slice(3) }); ctx.sound(); render(); return;
    }
    if (m.t === "askgone") { N.asks = N.asks.filter((a) => a.id !== m.id); render(); return; }
    if (m.t === "leave") {
      const s = N.seats.find((x) => x.id === m.id); if (!s) return;
      if (N.inMatch && N.hs) { N.hs.removeRemote(s.idx); const p = ctx.M().players[s.idx]; p.human = false; p.level = O.level; p.bot = new Bot(ctx.M(), p, O.level, {}); p.name = "Computer"; ctx.toast(`${s.name} left — a computer player takes over`); }
      s.kind = "cpu"; s.id = null; s.name = "Computer"; broadcastLobby(); render(); return;
    }
    if (m.t === "i" && N.hs) { const s = N.seats.find((x) => x.id === m.from); if (s && s.kind === "guest") N.hs.onInput(s.idx, m, now()); return; }
    if (m.t === "pg") { send({ t: "po", c: m.c, to: m.from }); return; }
  }
  function guestRecv(m) {
    if (m.t === "wait") { N.myId = m.id; N.status = "Waiting for the host to let you in…"; render(); return; }
    if (m.t === "allowed") { N.myId = m.id; N.joined = true; N.status = "You're in! Waiting for the host to start the match."; ctx.sound(); render(); return; }
    if (m.t === "lobby") { N.seats = m.seats; N.opts = m.o; if (!N.inMatch) render(); return; }
    if (m.t === "start") { startGuestMatch(m); return; }
    if (m.t === "s") { N.incoming.push(m); N.lastSnapAt = now(); return; }
    if (m.t === "e") { N.incoming.push(m); return; }
    if (m.t === "po") { N.ping = Math.round(now() - m.c); return; }
    if (m.t === "toLobby") { N.inMatch = false; ctx.backToLobby(); show("lobby"); return; }
  }

  // ---------- seats (host) ----------
  function makeSeats() {
    const size = O.mode === "2v2" ? 2 : 1, seats = [];
    for (let idx = 0; idx < size * 2; idx++) seats.push({ idx, team: idx < size ? 0 : 1, kind: idx === 0 ? "host" : "cpu", name: idx === 0 ? myName : "Computer", id: idx === 0 ? "h" : null, body: idx === 0 ? ctx.myBody() : null });
    return seats;
  }
  const freeSeat = () => { const order = seatOrder(O.mode === "2v2" ? 2 : 1); for (const idx of order) { const s = N.seats.find((x) => x.idx === idx); if (s && s.kind === "cpu") return s; } return null; };
  function broadcastLobby() { if (N && N.role === "host") send({ t: "lobby", seats: N.seats, o: { ...O } }); }
  function allow(id) {
    const a = N.asks.find((x) => x.id === id); if (!a) return; const seat = freeSeat();
    N.asks = N.asks.filter((x) => x.id !== id);
    if (!seat) { send({ t: "deny", id, text: "The room is full." }); render(); return; }
    Object.assign(seat, { kind: "guest", id, name: a.name, body: a.body });
    send({ t: "allow", id }); setTimeout(broadcastLobby, 50); render();
  }
  function deny(id) { N.asks = N.asks.filter((x) => x.id !== id); send({ t: "deny", id }); render(); }
  function kick(id) { send({ t: "kick", id }); }

  // ---------- starting a match ----------
  function matchOpts() {
    const size = O.mode === "2v2" ? 2 : 1, humans = N.seats.filter((s) => s.kind !== "cpu").map((s) => s.idx), names = [];
    for (const s of N.seats) if (s.kind !== "cpu") names[s.idx] = s.name;
    return { size, length: O.length, seed: (Math.random() * 1e9) | 0, humans, names, blueLevel: O.level, orangeLevel: O.level, arena: O.arena, bodies: N.seats.map((s) => s.body) };
  }
  function hostStart() {
    if (!N || N.role !== "host" || !N.seats.some((s) => s.kind === "guest")) return;
    const o = matchOpts(); N.matchOpts = o;
    send({ t: "start", o, seats: N.seats });
    N.inMatch = true; hide();
    ctx.startMatch(o, 0);
    N.hs = new HostSession(ctx.M(), send);
    for (const s of N.seats) if (s.kind === "guest") N.hs.addRemote(s.idx, now());
  }
  function startGuestMatch(m) {
    const seat = m.seats.find((s) => s.id === N.myId); if (!seat) return;
    N.seats = m.seats; N.me = seat.idx; N.inMatch = true; N.incoming = []; N.matchOpts = m.o; hide();
    ctx.startMatch(m.o, seat.idx);
    N.gs = new GuestSession(ctx.M(), seat.idx, send);
    N.lastSnapAt = now();
  }
  // host: after the results screen, everyone goes back to the lobby for a rematch
  function toLobby() { if (!N) return; N.inMatch = false; N.hs = null; N.gs = null; if (N.role === "host") { send({ t: "toLobby" }); broadcastLobby(); } ctx.backToLobby(); show("lobby"); }

  // ---------- per-frame hooks used by main.js ----------
  const api = {
    get on() { return !!(N && N.inMatch); },
    get host() { return !!(N && N.inMatch && N.role === "host" && N.hs); },
    get guest() { return !!(N && N.inMatch && N.role === "guest" && N.gs); },
    get me() { return N && N.inMatch ? (N.role === "host" ? 0 : N.me) : null; },
    get ping() { return N && N.role === "guest" ? N.ping : null; },
    // guest: apply what arrived from the host (once per physics tick, before stepping)
    beforeStep() {
      if (!api.guest) return;
      for (const m of N.incoming.splice(0)) { if (m.t === "s") N.gs.onSnapshot(m, now()); else if (m.t === "e") N.ruleEvents.push(...N.gs.onEvents(m.ev)); }
    },
    hostInputs(local) { return N.hs.inputs(local, now()); },
    guestStep(input) { N.gs.step(input || ZERO_IN); },
    // the events main.js should show this tick
    events(M) {
      if (api.host) { const list = M.takeEvents(); N.hs.events(list); return list; }
      if (api.guest) { const local = M.world.takeEvents().filter((e) => e.type !== "goal"); const rule = N.ruleEvents.splice(0); return [...local, ...rule]; }
      return M.takeEvents();
    },
    afterFrame(dt) {
      if (api.host) N.hs.maybeSnapshot(now());
      if (api.guest) {
        N.gs.flush(now()); N.gs.decay(dt);
        const quiet = now() - N.lastSnapAt; ctx.netBanner(quiet > 1500 ? "Waiting for the host… (their game may be in a hidden tab or their connection dropped)" : "");
      }
    },
    err(i) { return api.guest ? N.gs.err[i] : null; },
    ballErr() { return api.guest ? N.gs.ballErr : null; },
    toLobby, leave: () => leave(),
    debug: () => N,
    open: () => show("online"),
  };

  // ---------- screens ----------
  let screen = null;
  function show(which) { screen = which; ctx.hideAll(); ctx.setScreen(which === "lobby" ? "lobby" : "online"); render(); }
  function hide() { screen = null; $("online").hidden = true; $("lobby").hidden = true; }
  function render() {
    if (screen === "online") {
      $("online").hidden = false; $("lobby").hidden = true;
      $("onName").textContent = myName;
      for (const el of document.querySelectorAll("[data-onl]")) { const [k, v] = el.dataset.onl.split(":"); el.classList.toggle("on", String(O[k]) === v); }
      $("onErr").textContent = N && N.dead ? N.status : "";
    } else if (screen === "lobby") {
      $("online").hidden = true; $("lobby").hidden = false;
      const host = N && N.role === "host";
      $("lbCode").textContent = N ? N.code : ""; $("lbCodeWrap").hidden = !host;
      $("lbStatus").textContent = N ? N.status : "Not connected.";
      const seats = (N && N.seats) || [];
      const team = (t) => seats.filter((s) => s.team === t).map((s) => `<div class="lbSeat ${s.kind}${N && s.id && (s.id === N.myId || (host && s.kind === "host")) ? " me" : ""}"><span>${s.kind === "cpu" ? "🤖 Computer" : (s.kind === "host" ? "⭐ " : "🎮 ") + esc(s.name)}</span>${host && s.kind === "guest" && !(N && N.inMatch) ? `<button data-lbkick="${s.id}">Remove</button>` : ""}</div>`).join("");
      $("lbBlue").innerHTML = team(0); $("lbOrange").innerHTML = team(1);
      $("lbAsks").innerHTML = host && N.asks.length ? N.asks.map((a) => `<div class="lbAsk"><b>${esc(a.name)}</b> wants to join <button class="on" data-lballow="${a.id}">Let in</button><button data-lbdeny="${a.id}">No</button></div>`).join("") : "";
      $("lbStart").hidden = !host; $("lbStart").disabled = !(host && seats.some((s) => s.kind === "guest") && !N.dead);
      const o = (N && (host ? O : N.opts)) || O;
      $("lbInfo").textContent = seats.length ? `${o.mode === "2v2" ? "2v2" : "1v1"} • ${ctx.arenaName(o.arena)} • ${o.length / 60} min${seats.some((s) => s.kind === "cpu") ? ` • empty seats: ${ctx.levelName(o.level)} computers` : ""}` : "";
      $("lbHint").textContent = host ? "Keep this tab open and in front while you play — your computer runs the match for everyone." : "";
    }
  }
  document.addEventListener("click", (e) => {
    const t = e.target.closest("button"); if (!t) return;
    if (t.dataset.onl) { const [k, v] = t.dataset.onl.split(":"); O[k] = ["length", "level"].includes(k) ? Number(v) : v; render(); }
    if (t.id === "onReroll") { myName = randomName(); saveName(); render(); }
    if (t.id === "onHost") { saveName(); connect("host", randomCode()); }
    if (t.id === "onJoin") { const c = cleanCode($("onCode").value); if (!CODE_RE.test(c)) { $("onErr").textContent = ERR.code; return; } saveName(); connect("guest", c); }
    if (t.id === "onBack") { leave(true); hide(); ctx.toTitle(); }
    if (t.dataset.lballow) allow(t.dataset.lballow);
    if (t.dataset.lbdeny) deny(t.dataset.lbdeny);
    if (t.dataset.lbkick) kick(t.dataset.lbkick);
    if (t.id === "lbStart") hostStart();
    if (t.id === "lbLeave") { leave(true); show("online"); }
  });
  document.addEventListener("keydown", (e) => { if (e.target && e.target.id === "onCode" && e.key === "Enter") $("onJoin").click(); });
  return api;
}
