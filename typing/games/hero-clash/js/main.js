// Hero Clash: Ultimate Showdown — menus and game flow.
import { Stage, portrait } from "./render.js";
import { Input, ACTIONS, DEFAULT_KEYS, DEFAULT_PAD, PAD_NAMES, keyName, overlaps, duplicates, buildTouch } from "./input.js";
import { Game } from "./game.js";
import { Match, blankInput } from "./combat.js";
import { ROSTER, MAIN_ROSTER, BY_ID, combosFor } from "./fighters.js";
import { COSTUMES } from "./models.js";
import { ARENAS, arenaThumb } from "./arenas.js";
import { CPU, LEVELS, LEVEL_ORDER } from "./ai.js";
import { GameAudio as AudioFx } from "./audio.js";
import * as PR from "./progress.js";
import { RIVALRIES, rivalryFor, rivalriesOf } from "./rivalries.js";
import * as TN from "./tournament.js";
import { VICTORY_NAMES } from "./anim.js";

const $ = (s) => document.querySelector(s);
function h(tag, attrs, ...kids) {
  const [t, ...cls] = tag.split("."); const e = document.createElement(t || "div"); if (cls.length) e.className = cls.join(" ");
  for (const k in attrs || {}) { const v = attrs[k]; if (k === "on") for (const ev in v) e.addEventListener(ev, v[ev]); else if (k === "text") e.textContent = v; else if (v === true) e.setAttribute(k, ""); else if (v !== false && v !== null && v !== undefined) e.setAttribute(k, v); }
  for (const k of kids.flat(9)) if (k !== null && k !== undefined && k !== false) e.appendChild(typeof k === "object" ? k : document.createTextNode(String(k)));
  return e;
}
const btn = (label, fn, cls = "") => h("button.btn" + (cls ? "." + cls.split(" ").join(".") : ""), { type: "button", on: { click: (e) => { AudioFx.init(); AudioFx.sfx("uiConfirm"); fn(e); } } }, h("span", { text: label }));

// ---------------------------------------------------------------- boot
let storage; try { storage = window.localStorage; storage.getItem("x"); } catch (e) { storage = { getItem: () => null, setItem: () => { throw new Error("blocked"); } }; }
const loaded = PR.load(storage); const save = loaded.save;
const persist = () => { if (!PR.store(storage, save) && !persist.warned) { persist.warned = true; toast("This browser is not saving progress (private mode or storage is full)."); } };
const input = new Input(); input.setKeys(save.keys); input.pad = save.pad;
const st = save.settings;
const lowDevice = (navigator.hardwareConcurrency || 4) <= 2 || (navigator.deviceMemory || 4) <= 2;
const quality = st.quality === "auto" ? (lowDevice ? "low" : "medium") : st.quality;
const stage = new Stage($("#gl"), { quality, reducedMotion: st.reducedMotion, reducedFlash: st.reducedFlash, preserve: new URLSearchParams(location.search).has("shot") });
const game = new Game(stage, input, save);
const screenEl = $("#screen"), veil = $("#veil"), hint = $("#hint");
function applySettings() {
  AudioFx.setVolumes({ music: st.music, sfx: st.sfx, voice: st.voice, mute: st.mute });
  document.body.classList.toggle("hc", st.highContrast); document.body.classList.toggle("calm", st.reducedMotion);
  stage.setOptions({ reducedMotion: st.reducedMotion, reducedFlash: st.reducedFlash });
  buildTouch($("#touch"), input, st);
}
function toast(text) { const d = h("div", { text }); $("#toast").appendChild(d); setTimeout(() => d.remove(), 4300); }
function news(list) { list.forEach((n, i) => setTimeout(() => { toast(n.text); AudioFx.sfx("unlock"); }, 500 + i * 700)); }

const pcache = new Map();
function pic(id, costume = 0, size = 128) {
  const key = id + ":" + costume + ":" + size; let c = pcache.get(key);
  if (!c) { c = portrait(BY_ID[id], costume, size); pcache.set(key, c); }
  const out = document.createElement("canvas"); out.width = out.height = size; out.getContext("2d").drawImage(c, 0, 0); return out;
}
const costumeOf = (id) => { const c = save.costume[id] | 0; return PR.costumeOpen(save, id, c) ? c : 0; };
const roster = () => (save.professor ? ROSTER : MAIN_ROSTER);
const randomId = (not) => { const r = roster().filter((f) => f.id !== not); return r[Math.floor(Math.random() * r.length)].id; };
const randomArena = () => ARENAS[Math.floor(Math.random() * ARENAS.length)].id;

// ---------------------------------------------------------------- background scene behind the menus
const bg = { match: null, cpu: null, mode: null, script: 0 };
function bgDemo() { // two CPU fighters sparring behind the main menu
  if (game.running) return;
  const a = BY_ID[randomId()], b = BY_ID[randomId(a.id)];
  stage.clearFx(); stage.setArena(randomArena(), 0); stage.setFighter(0, a, 0); stage.setFighter(1, b, 0);
  bg.match = new Match(a, b, { time: 0, rounds: 99, transitions: false, cine: "full" }); bg.match.training = { infHp: true };
  bg.cpu = [new CPU("normal", a, Date.now() % 9999), new CPU("normal", b, Date.now() % 7777)]; bg.mode = "demo";
}
function bgPreview(id, costume = 0, opts = {}) { // one fighter showing off their moves (select / customize screens)
  if (game.running) return;
  const def = BY_ID[id];
  if (bg.mode !== "preview" || !stage.arena) { stage.clearFx(); stage.setArena(opts.arena || "hall", 0); }
  stage.setFighter(0, def, costume); stage.setFighter(1, null);
  bg.match = new Match(def, BY_ID.titan, { time: 0, rounds: 99, transitions: false }); while (bg.match.phase !== "fight") bg.match.step(blankInput(), blankInput());
  bg.match.f[0].x = -1.2; bg.match.f[1].x = 7.2; bg.mode = "preview"; bg.script = 0; bg.still = !!opts.still; bg.spin = 0; bg.win = !!opts.win;
}
const DEMO = [[50, {}], [3, { lp: 1 }], [10, {}], [3, { lp: 1 }], [9, {}], [3, { hp: 1 }], [45, {}], [3, { lk: 1 }], [14, {}], [3, { hk: 1 }], [50, {}], [3, { sp: 1 }], [70, {}], [3, { sp: 1, r: 1 }], [70, {}], [3, { d: 1, hp: 1 }], [50, {}], [3, { sp: 1, d: 1 }], [70, {}], [8, { u: 1 }], [10, {}], [3, { hk: 1 }], [50, {}], [3, { sp: 1, l: 1 }], [70, {}]];
function bgFrame(ms) {
  const m = bg.match; if (!m) return;
  bg.acc = Math.min((bg.acc || 0) + ms, 80);
  while (bg.acc >= 1000 / 60) {
    bg.acc -= 1000 / 60;
    if (bg.mode === "demo") { m.step(bg.cpu[0].think(m, m.f[0]), bg.cpu[1].think(m, m.f[1])); stage.onEvents(m.events, m); }
    else {
      const f = m.f[0], o = m.f[1]; o.inv = 999; o.x = 7.2; m.f[0].meter = 0;
      let inp = blankInput();
      if (!bg.still) { let t = bg.script++ % DEMO.reduce((s, d) => s + d[0], 0); for (const [n, keys] of DEMO) { if (t < n) { Object.assign(inp, keys); break; } t -= n; } }
      if (Math.abs(f.x + 1.2) > 1.6 && f.state === "idle") { f.x = -1.2; }
      if (bg.win && f.state === "idle") { f.state = "win"; f.st = 0; }
      m.step(inp, blankInput()); stage.onEvents(m.events.filter((e) => e.who !== 1), m);
    }
  }
  if (bg.mode === "preview") { const f = m.f[0]; stage.camOverride = { x: -1.2 + (f.x + 1.2) * 0.3 + (innerWidth > 760 ? 0.75 : 0), y: innerWidth > 760 ? 0.72 : 1.0, d: 6.6, cy: 1.2 }; stage.pose[0].yaw = (stage.pose[0].yaw || 0); }
  stage.draw(m, ms / 1000);
}

// ---------------------------------------------------------------- screen manager
let cur = null;
function show(el, opts = {}) {
  screenEl.innerHTML = ""; if (el) screenEl.appendChild(el);
  cur = { el, back: opts.back || null };
  veil.classList.toggle("on", !!el && opts.veil !== false);
  hint.textContent = opts.hint === undefined ? (el ? "Arrow keys or WASD: move · Enter: choose · Esc: back" : "") : opts.hint;
  if (el) { const f = el.querySelector("[data-first]") || el.querySelector("button:not([disabled])"); if (f && !matchMedia("(pointer: coarse)").matches) f.focus({ preventScroll: true }); }
}
const scr = (cls, ...kids) => h("div.scr" + (cls ? "." + cls : ""), null, ...kids);
const head = (title, sub, back) => h("div.top", null, h("div", null, h("h1.disp", { text: title }), sub ? h("p.sub", { text: sub }) : null), back ? btn("◀ Back", back, "sm") : null);
function navMove(dir) {
  const items = [...screenEl.querySelectorAll("button:not([disabled]), select, input")].filter((e) => e.offsetParent !== null);
  if (!items.length) return;
  const a = document.activeElement; if (!items.includes(a)) { items[0].focus(); return; }
  const r = a.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2; let best = null, bd = 1e9;
  for (const e of items) {
    if (e === a) continue; const q = e.getBoundingClientRect(), x = q.left + q.width / 2, y = q.top + q.height / 2, dx = x - cx, dy = y - cy;
    const ok = dir === "left" ? dx < -4 : dir === "right" ? dx > 4 : dir === "up" ? dy < -4 : dy > 4; if (!ok) continue;
    const d = dir === "left" || dir === "right" ? Math.abs(dx) + Math.abs(dy) * 3 : Math.abs(dy) + Math.abs(dx) * 3;
    if (d < bd) { bd = d; best = e; }
  }
  if (best) { best.focus(); AudioFx.sfx("uiMove"); }
}
function menuInput() {
  for (const m of input.pollMenu()) {
    if (game.running && !game.paused && !cur.el) { if (m === "back" || m === "pause") pause(); else if (m === "ok") game.skip = true; continue; }
    if (m === "pause" && game.running && game.paused) { resume(); continue; }
    if (m === "up" || m === "down" || m === "left" || m === "right") { const t = document.activeElement && document.activeElement.tagName; if (t === "SELECT" && (m === "up" || m === "down")) continue; navMove(m); }
    else if (m === "ok") { const a = document.activeElement; if (a && screenEl.contains(a) && a.tagName === "BUTTON") a.click(); else navMove("down"); }
    else if (m === "back" && cur && cur.back) { AudioFx.sfx("uiBack"); cur.back(); }
  }
}

// ---------------------------------------------------------------- title
function title() {
  if (game.running) game.stop();
  if (bg.mode !== "demo") bgDemo();
  AudioFx.music("menu");
  const exam = PR.examReady(save);
  const items = [
    ["QUICK FIGHT", quickFight], ["TWO PLAYER", twoPlayer], ["ARCADE", arcadeStart], ["TOURNAMENT", tourneySetup], ["TRAINING", training], ["HERO CUSTOMIZATION", customize],
    ["CHARACTER MASTERY", mastery], ["RIVALRIES", rivalries], ["ACHIEVEMENTS", achievements], ["HOW TO PLAY", howTo], ["SETTINGS", settings],
  ];
  const menu = h("div.menu", null, items.map(([l, fn], i) => { const b = btn(l, fn); if (i === 0) b.setAttribute("data-first", ""); return b; }));
  if (exam) menu.appendChild(btn(save.professor ? "THE FINAL EXAM (REMATCH)" : "??? THE FINAL EXAM ???", examFight, "wide secret"));
  show(scr("title", h("h1.logo.disp", null, "Hero Clash", h("small", { text: "Ultimate Showdown" }), h("em", { text: "LEGENDS COLLIDE" })), menu,
    h("div.foot", null, "Lighthouse Baptist Academy • Mr. Watford · ", h("a", { href: "../../index.html", text: "Back to the Typing page" }))), { hint: "Arrow keys or WASD: move · Enter: choose · F: full screen" });
  if (!loaded.ok && !title.warned) { title.warned = true; toast(loaded.reason === "blocked" ? "This browser is blocking saved data, so progress will not be kept." : "Saved data could not be read, so the game started fresh."); }
}

// ---------------------------------------------------------------- fighter select
// slots: [{ label, cls }]  → onDone([{ id, costume }...])
function select(titleText, slots, onDone, back, extra) {
  const picks = []; let hover = null;
  const info = h("div.info"), who = h("span.who." + slots[0].cls, { text: slots[0].label + ": choose a fighter" });
  const go = btn("READY ▶", () => onDone(picks.map((p) => ({ id: p.id === "random" ? randomId() : p.id, costume: p.costume }))), "go"); go.disabled = true;
  const cells = [];
  const setInfo = (id) => {
    if (hover === id) return; hover = id; info.innerHTML = "";
    if (id === "random") { info.append(h("h2.disp", { text: "Random" }), h("p", { text: "Let fate decide. A fighter is picked for you when the match starts." })); return; }
    const f = BY_ID[id];
    if (f.secret && !save.professor) { info.append(h("h2.disp", { text: "? ? ?" }), h("div.ttl", { text: "Secret fighter" }), h("p", { text: "A mysterious challenger watches from the back of the classroom. Complete the hidden tasks to meet them:" }), h("div.list", null, PR.examTasks(save).map((t) => h("div.item" + (t.have >= t.need ? "" : ".locked"), null, h("span", { text: t.have >= t.need ? "✔" : "○" }), h("span", { text: t.text }), h("small", { text: t.have + " / " + t.need }))), h("div.item" + (save.professor ? "" : ".locked"), null, h("span", { text: "○" }), h("span", { text: "Defeat the secret boss" }), h("small", { text: "" })))); bgPreview("professor", 0, { still: true }); stage.rigs[0].root.visible = false; return; }
    const cs = costumeOf(id), lv = PR.levelOf(PR.charStats(save, id).mp);
    info.append(h("h2.disp", { text: f.name }), h("div.ttl", { text: f.title }),
      h("div.tags", null, h("span", { text: f.style }), h("span", { text: "Difficulty " + "★".repeat(f.diff) + "☆".repeat(5 - f.diff) }), h("span", { text: f.side === "villain" ? "Villain" : "Hero" }), h("span", { text: "Mastery " + lv })),
      h("div.stat", null, [["Power", f.stat.power], ["Speed", f.stat.speed], ["Defense", f.stat.defense], ["Range", f.stat.range]].map(([n, v]) => [h("span", { text: n }), h("i", null, h("b", { style: `width:${v * 10}%` }))])),
      h("p", { text: f.bio }), h("p", null, h("b", { text: "Specials: " }), ["sp1", "sp2", "sp3", "sp4", "sp5"].filter((k) => f.moves[k]).map((k) => f.moves[k].name).join(" · ")), h("p", null, h("b", { text: "Ultimate: " }), f.moves.ult.name));
    bgPreview(id, cs);
  };
  const choose = (id) => {
    if (id !== "random" && BY_ID[id].secret && !save.professor) { AudioFx.sfx("uiLocked"); return; }
    if (picks.length >= slots.length) { const last = picks.pop(); cells.forEach((c) => { if (c.dataset.id === last.id) c.classList.remove(slots[picks.length].cls); c.querySelectorAll(".tag").forEach((t) => { if (t.textContent === slots[picks.length].label) t.remove(); }); }); }
    const s = slots[picks.length]; picks.push({ id, costume: id === "random" ? 0 : costumeOf(id) });
    const c = cells.find((x) => x.dataset.id === id); c.classList.add(s.cls); c.appendChild(h("span.tag", { text: s.label }));
    AudioFx.sfx("uiSelect"); if (id !== "random") AudioFx.sfx("el_" + BY_ID[id].el, { vol: 0.5 });
    if (picks.length < slots.length) { who.className = "who " + slots[picks.length].cls; who.textContent = slots[picks.length].label + ": choose a fighter"; }
    else { who.textContent = "All set!"; go.disabled = false; go.focus(); }
  };
  const mk = (id, label, vil) => { const c = h("button.cell" + (vil ? ".vil" : ""), { type: "button", "data-id": id, "aria-label": label, on: { click: () => choose(id), mouseenter: () => setInfo(id), focus: () => setInfo(id) } }); cells.push(c); return c; };
  const grid = h("div.grid", null, MAIN_ROSTER.map((f) => { const c = mk(f.id, f.name, f.side === "villain"); c.append(pic(f.id, costumeOf(f.id)), h("span", { text: f.name })); return c; }));
  const pc = mk("professor", save.professor ? "The Professor" : "Secret fighter"); pc.append(pic("professor", costumeOf("professor")), save.professor ? h("span", { text: "The Professor" }) : h("span.q", { text: "?" })); if (!save.professor) pc.classList.add("lock"); grid.appendChild(pc);
  const rc = mk("random", "Random fighter"); rc.append(h("span.q", { text: "🎲" }), h("span", { text: "Random" })); grid.appendChild(rc);
  cells[0].setAttribute("data-first", "");
  show(scr("", head(titleText, null, back), h("div.row", null, who, extra || null),
    h("div.sel", null, info, h("div", { style: "display:flex;flex-direction:column;gap:10px;justify-content:center;min-height:0" }, grid, h("div.row", { style: "justify-content:flex-end" }, btn("Undo", () => { if (picks.length) { const last = picks.pop(); const c = cells.find((x) => x.dataset.id === last.id); c.classList.remove(slots[picks.length].cls); const t = [...c.querySelectorAll(".tag")].pop(); if (t) t.remove(); go.disabled = true; who.className = "who " + slots[picks.length].cls; who.textContent = slots[picks.length].label + ": choose a fighter"; } }, "sm"), go)))), { back, veil: false });
  setInfo(MAIN_ROSTER[0].id);
}
function levelPicker(get, set) {
  const row = h("div.row", null, h("b", { text: "CPU level:" }));
  const bs = LEVEL_ORDER.map((k) => { const b = btn(LEVELS[k].name, () => { set(k); bs.forEach((x, i) => x.classList.toggle("on", LEVEL_ORDER[i] === k)); }, "sm"); if (k === get()) b.classList.add("on"); return b; });
  row.append(...bs); return row;
}
function arenaSelect(onDone, back) {
  const tiles = ARENAS.map((a, i) => { const b = h("button.arena", { type: "button", on: { click: () => { AudioFx.sfx("uiConfirm"); onDone(a.id); } } }, arenaThumb(a.id, 320, 180), h("span", { text: a.name })); if (i === 0) b.setAttribute("data-first", ""); return b; });
  show(scr("", head("Choose an arena", "Every arena has a second area you can smash into with a heavy knockback near the right edge.", back), h("div.arenas", null, tiles), h("div.row", { style: "margin-top:12px" }, btn("🎲 Random arena", () => onDone(randomArena())))), { back });
}

// ---------------------------------------------------------------- modes
function quickFight() {
  select("Quick Fight", [{ label: "YOU", cls: "p1" }, { label: "CPU", cls: "p2" }], (p) => arenaSelect((arena) => fight({ mode: "quick", arena, p: [p[0], Object.assign(p[1], { cpu: true, level: st.difficulty })] }), quickFight), title,
    levelPicker(() => st.difficulty, (k) => { st.difficulty = k; persist(); }));
}
function twoPlayer() {
  const o = overlaps(save.keys.p1, save.keys.p2);
  select("Two Player", [{ label: "P1", cls: "p1" }, { label: "P2", cls: "p2" }], (p) => arenaSelect((arena) => fight({ mode: "versus", arena, twoPlayer: true, p }), twoPlayer), title,
    h("span", { style: "font-size:13px;color:var(--dim)", text: o.length ? "⚠ Player 1 and Player 2 share a key. Fix it in Settings › Controls." : input.padSeen ? "Gamepad found: Player 2 uses it." : "Player 1: WASD + F G R T · Player 2: arrows + K L I O (see How to Play)" }));
}
function fight(cfg) {
  show(null);
  const a = cfg.p[0].id, b = cfg.p[1].id;
  cfg.rivalry = cfg.rivalry || rivalryFor(a, b);
  const user = cfg.onEnd;
  cfg.onEnd = (r) => { game.lastResult = r; if (user) user(r); else results(cfg, r); };
  bg.match = null; bg.mode = null;
  game.start(cfg);
  hint.textContent = cfg.training ? "" : "Esc or P: pause";
}
// Save what a finished match earned. Only matches against the computer count toward unlocks.
function record(cfg, r, extra = {}) {
  if (cfg.training || cfg.twoPlayer || cfg.p[0].cpu) return [];
  const rv = cfg.rivalry && cfg.rivalry.n ? cfg.rivalry.n : 0;
  const out = PR.recordMatch(save, { me: cfg.p[0].id, foe: cfg.p[1].id, won: r.winner === 0, vsCpu: !!cfg.p[1].cpu, level: cfg.p[1].level, stats: r.stats[0], secs: r.secs, perfectRound: r.perfect[0], rivalry: rv, exam: !!cfg.exam && !extra.noExam });
  if (PR.costumesOpen(save, ROSTER.map((f) => f.id)) >= 10 && !save.ach.wardrobe) { save.ach.wardrobe = Date.now(); out.push({ kind: "ach", text: "Achievement: Wardrobe Upgrade" }); }
  persist(); return out;
}
function results(cfg, r, opts = {}) {
  const got = opts.news || record(cfg, r);
  const w = BY_ID[cfg.p[r.winner].id], rv = cfg.rivalry, quote = rv && rv.win[w.id] ? rv.win[w.id] : w.quote;
  const row = (label, f) => h("tr", null, h("td", { text: label }), h("td", { text: f(r.stats[0], 0) }), h("td", { text: f(r.stats[1], 1) }));
  const again = () => fight(Object.assign({}, cfg, { onEnd: null, rivalry: cfg.rivalry }));
  const buttons = opts.buttons || [btn("Rematch", again, "go"), btn("Change fighters", cfg.mode === "versus" ? twoPlayer : quickFight), btn("Main menu", title)];
  buttons[0].setAttribute("data-first", "");
  show(scr("center", h("h1.disp", { text: (cfg.p[r.winner].name ? cfg.p[r.winner].name + " · " : "") + w.name + " wins!" }), h("p.sub", { text: "“" + quote + "”" }),
    h("div.panel", { style: "min-width:min(520px,92vw)" }, h("table.moves", null, h("tr", null, h("th"), h("th", { text: BY_ID[cfg.p[0].id].name }), h("th", { text: BY_ID[cfg.p[1].id].name })),
      row("Rounds won", (s, i) => r.rounds[i]), row("Damage dealt", (s) => Math.round(s.dmg)), row("Longest combo", (s) => s.maxCombo + " hits"), row("Ultimate Moves", (s) => s.ults), row("Counters", (s) => s.counters), row("Throws", (s) => s.throws)),
      h("p", { style: "margin:8px 0 0;color:var(--dim);font-size:13px", text: "Match time: " + r.secs + " seconds" }),
      got.length ? h("div.list", { style: "margin-top:10px" }, got.map((n) => h("div.item", null, h("span", { text: n.kind === "costume" ? "👕" : n.kind === "ach" ? "🏅" : n.kind === "secret" ? "❓" : "⭐" }), h("b", { text: n.text }), h("span")))) : null),
    h("div.row", { style: "margin-top:14px;justify-content:center" }, buttons)), { back: title, veil: true });
  bgPreview(w.id, cfg.p[r.winner].costume || 0, { still: true, win: true, arena: cfg.arena });
  game.stop(); bgPreview(w.id, cfg.p[r.winner].costume || 0, { still: true, win: true, arena: cfg.arena });
  if (got.length) news(got);
}

// ----- Arcade: seven opponents that get tougher, then a final challenger -----
function arcadeStart() {
  const resume = save.arcade && BY_ID[save.arcade.me] ? btn("Continue ladder (" + BY_ID[save.arcade.me].name + ", fight " + (save.arcade.stage + 1) + " of 8)", arcadeLadder, "sm on") : null;
  select("Arcade", [{ label: "YOU", cls: "p1" }], (p) => {
    const pool = MAIN_ROSTER.filter((f) => f.id !== p[0].id).sort(() => Math.random() - 0.5), boss = p[0].id === "overlord" ? "titan" : "overlord";
    const foes = pool.filter((f) => f.id !== boss).slice(0, 7).map((f) => f.id); foes.push(boss);
    save.arcade = { me: p[0].id, costume: p[0].costume, level: st.difficulty, foes, stage: 0 }; persist(); arcadeLadder();
  }, title, h("div.row", null, levelPicker(() => st.difficulty, (k) => { st.difficulty = k; persist(); }), resume));
}
function arcadeLevel(a, i) { const b = LEVEL_ORDER.indexOf(a.level); return LEVEL_ORDER[Math.min(4, Math.max(0, b - 1 + Math.floor((i + 1) / 3)))]; }
function arcadeLadder() {
  const a = save.arcade; if (!a) return title();
  bgPreview(a.me, a.costume, { still: true });
  const rows = a.foes.map((id, i) => h("div.item" + (i < a.stage ? ".locked" : ""), i === a.stage ? { style: "border-color:var(--gold);box-shadow:0 0 14px rgba(255,200,80,.5)" } : null,
    h("div", { style: "width:46px;height:46px;border-radius:6px;overflow:hidden" }, pic(id, 0, 64)), h("div", null, h("b", { text: (i === 7 ? "FINAL CHALLENGER: " : "Fight " + (i + 1) + ": ") + BY_ID[id].name }), h("small", { text: LEVELS[arcadeLevel(a, i)].name + " · " + BY_ID[id].style })), h("span", { text: i < a.stage ? "✔ Won" : i === a.stage ? "▶ Next" : "" })));
  const go = btn("FIGHT ▶", () => {
    const i = a.stage, foe = a.foes[i];
    fight({ mode: "arcade", arena: ARENAS[(i * 3 + a.me.length) % ARENAS.length].id, p: [{ id: a.me, costume: a.costume }, { id: foe, cpu: true, level: arcadeLevel(a, i), tune: i === 7 ? { aggro: 0.9, special: 0.6 } : null }],
      onEnd: (r) => {
        const cfg = game.cfg, got = record(cfg, r);
        if (r.winner === 0) { a.stage++; if (a.stage >= a.foes.length) { save.arcade = null; got.push(...PR.recordClear(save, "arcade", a.me, ROSTER.map((f) => f.id))); persist(); return results(cfg, r, { news: got, buttons: [btn("Main menu", title, "go"), btn("New ladder", arcadeStart)] }); } persist(); results(cfg, r, { news: got, buttons: [btn("Next fight ▶", arcadeLadder, "go"), btn("Main menu", title)] }); }
        else results(cfg, r, { news: got, buttons: [btn("Try again", arcadeLadder, "go"), btn("Main menu", title)] });
      } });
  }, "go"); go.setAttribute("data-first", "");
  show(scr("", head("Arcade ladder", BY_ID[a.me].name + " · starting level " + LEVELS[a.level].name, title), h("div.cols", null, h("div"), h("div.panel", null, h("div.list", null, rows), h("div.row", { style: "margin-top:12px;justify-content:flex-end" }, btn("Quit ladder", () => { save.arcade = null; persist(); title(); }, "sm"), go)))), { back: title, veil: false });
}

// ----- Secret boss -----
function examFight() {
  select("The Final Exam", [{ label: "YOU", cls: "p1" }], (p) => fight({ mode: "exam", exam: true, arena: "hall", p: [p[0], { id: "professor", cpu: true, level: "hard", costume: 0, tune: { react: 10, block: 0.72, combo: 0.9, special: 0.6, ult: 0.95, slip: 0.04 } }],
    onEnd: (r) => { const cfg = game.cfg, first = !save.professor, got = record(cfg, r); results(cfg, r, { news: got, buttons: r.winner === 0 ? [btn(first ? "Meet The Professor" : "Main menu", first ? customize : title, "go"), btn("Main menu", title)] : [btn("Try again", examFight, "go"), btn("Main menu", title)] }); } }), title,
    h("span", { style: "font-size:13px;color:var(--cyan)", text: "The Professor is waiting. Beat him once to unlock him for good." }));
}

// ----- Training -----
function training() {
  select("Training", [{ label: "YOU", cls: "p1" }, { label: "DUMMY", cls: "p2" }], (p) => {
    fight({ mode: "training", training: true, arena: "hall", time: 0, rounds: 99, p });
    trainPanel();
  }, title);
}
function trainPanel() {
  const box = $("#train"); box.hidden = false; box.innerHTML = "";
  const m = game.match, f = m.f[0].def, K = save.keys.solo, k = (a) => h("kbd", { text: keyName(K[a]) });
  const tog = (label, get, set) => { const c = h("input", { type: "checkbox" }); c.checked = get(); c.addEventListener("change", () => { set(c.checked); c.blur(); }); return h("label.opt", null, label, c); };
  const dm = h("select", { on: { change: (e) => { game.dummy = e.target.value; e.target.blur(); } } }, [["stand", "Stands still"], ["crouch", "Crouches"], ["block", "Blocks everything"], ["jump", "Jumps"], ["attack", "Attacks now and then"], ["cpu", "Fights back (Normal CPU)"]].map(([v, t]) => h("option", { value: v, text: t })));
  const spIn = { sp1: [k("sp")], sp2: ["→ + ", k("sp")], sp3: ["↓ + ", k("sp")], sp4: ["← + ", k("sp")], sp5: [k("blk"), " + ", k("sp")] };
  const fd = (mv) => (st.frameData ? h("td", { text: mv.type === "throw" ? `${mv.s}/${mv.a}/${mv.r}` : `${mv.s}/${mv.a}/${mv.r} · ${mv.dmg || (mv.proj ? mv.proj.reduce((s, p) => s + p.dmg, 0) : 0)}` }) : null);
  const combos = combosFor(f);
  const render = () => {
    box.innerHTML = "";
    box.append(h("h3", { text: f.name + " · move list" }),
      h("table.moves", null, ["sp1", "sp2", "sp3", "sp4", "sp5"].filter((x) => f.moves[x]).map((x) => h("tr", null, h("td", null, spIn[x]), h("td", { text: f.moves[x].name }), fd(f.moves[x]))),
        h("tr", null, h("td", null, k("ult")), h("td", { text: f.moves.ult.name + " (full meter)" }), fd(f.moves.ult)),
        st.frameData ? [["5LP", "lp"], ["5HP", "hp"], ["5LK", "lk"], ["5HK", "hk"], ["2HP", "hp"], ["2HK", "hk"]].map(([id, a]) => h("tr", null, h("td", null, id[0] === "2" ? "↓ + " : "", k(a)), h("td", { text: f.moves[id].name }), fd(f.moves[id]))) : null),
      st.frameData ? h("p", { style: "color:var(--dim);margin:4px 0", text: "Frame data: startup / active / recovery · damage (60 frames = 1 second)" }) : null,
      h("h3", { style: "margin-top:10px", text: "Combo challenges" }), h("div", null, combos.map((c, i) => h("div" + (game.challenge[i] ? ".done" : ""), { style: "margin:3px 0" }, (game.challenge[i] ? "✔ " : "○ ") + c.name + ": " + c.text))),
      h("h3", { style: "margin-top:10px", text: "Practice options" }), h("label.opt", null, "Dummy", dm),
      tog("Unlimited health", () => m.training.infHp, (v) => (m.training.infHp = v)), tog("Ultimate always ready", () => m.training.infMeter, (v) => (m.training.infMeter = v)),
      tog("Show hit boxes (developer view)", () => stage.debug, (v) => (stage.debug = v)), tog("Show frame data", () => st.frameData, (v) => { st.frameData = v; persist(); render(); }),
      h("div.row", { style: "margin-top:8px" }, btn("Reset positions", () => game.resetTraining(), "sm"), btn("Exit", () => { stage.debug = false; title(); }, "sm")));
    dm.value = game.dummy;
  };
  game.onChallenge = () => { news(PR.recordClear(save, "training", f.id, ROSTER.map((x) => x.id)).filter((n, i) => i < 3)); persist(); render(); };
  render();
}

// ---------------------------------------------------------------- tournament / Classroom Championship
let bracket = null;
function tourneySetup() {
  bgDemo();
  const cfg = { size: 4, title: "Classroom Championship", room: "", bestOf: 1, shuffle: true };
  const list = h("div.list");
  const players = [];
  const rebuild = () => {
    while (players.length < cfg.size) { const i = players.length; players.push({ cpu: i >= 2, name: "", char: "random", level: st.difficulty }); }
    players.length = cfg.size; list.innerHTML = "";
    players.forEach((p, i) => {
      const nm = h("input", { type: "text", maxlength: 14, placeholder: p.cpu ? "CPU " + (i + 1) : TN.autoName(i), value: p.name, "aria-label": "Nickname for player " + (i + 1), on: { input: (e) => (p.name = e.target.value) } });
      const ch = h("select", { "aria-label": "Fighter", on: { change: (e) => (p.char = e.target.value) } }, h("option", { value: "random", text: "Random hero" }), roster().map((f) => h("option", { value: f.id, text: f.name }))); ch.value = p.char;
      const lv = h("select", { "aria-label": "CPU level", on: { change: (e) => (p.level = e.target.value) } }, LEVEL_ORDER.map((k) => h("option", { value: k, text: LEVELS[k].name }))); lv.value = p.level; lv.style.visibility = p.cpu ? "visible" : "hidden";
      const kind = btn(p.cpu ? "CPU" : "Human", () => { p.cpu = !p.cpu; rebuild(); }, "sm" + (p.cpu ? "" : " on"));
      list.appendChild(h("div.item", { style: "grid-template-columns:auto auto 1fr auto auto" }, h("b", { text: i + 1 + "." }), kind, nm, ch, lv));
    });
  };
  const sizeRow = h("div.row", null, h("b", { text: "Players:" }), [4, 8, 16].map((n) => { const b = btn(String(n), () => { cfg.size = n; sizeRow.querySelectorAll(".btn").forEach((x) => x.classList.toggle("on", x === b)); rebuild(); }, "sm" + (n === 4 ? " on" : "")); return b; }));
  const bo = h("input", { type: "checkbox", on: { change: (e) => (cfg.bestOf = e.target.checked ? 3 : 1) } }), sh = h("input", { type: "checkbox", checked: true, on: { change: (e) => (cfg.shuffle = e.target.checked) } });
  const tl = h("input", { type: "text", maxlength: 40, value: cfg.title, on: { input: (e) => (cfg.title = e.target.value) } }), rm = h("input", { type: "text", maxlength: 30, placeholder: "optional", on: { input: (e) => (cfg.room = e.target.value) } });
  rebuild();
  const start = btn("START TOURNAMENT ▶", () => {
    const taken = [];
    const ps = players.map((p, i) => { let name = TN.cleanName(p.name) || (p.cpu ? "CPU " + (i + 1) : TN.autoName(i, taken)); while (taken.includes(name)) name += "*"; taken.push(name); return { name, cpu: p.cpu, char: p.char === "random" ? randomId() : p.char, level: p.level }; });
    bracket = TN.makeBracket(ps, { title: TN.cleanName(cfg.title).slice(0, 40) || "Tournament", room: TN.cleanName(cfg.room), bestOf: cfg.bestOf, shuffle: cfg.shuffle }); bracket.display = false; bracketScreen();
  }, "go");
  show(scr("", head("Tournament setup", "A single-elimination bracket for the classroom. Nicknames only: nothing else is saved, and it all stays on this device.", title),
    h("div.cols", null, h("div.panel", null, h("label.opt", null, "Tournament title", tl), h("label.opt", null, "Class name", rm), sizeRow, h("label.opt", null, "Best-of-three series (first to win 2 matches moves on)", bo), h("label.opt", null, "Shuffle the bracket order", sh),
      h("p", { style: "font-size:13px;color:var(--dim)", text: "Two humans play on one device (shared keyboard or gamepads). With more students than controllers, players simply take turns at the keyboard when their match comes up." }), h("div.row", null, start, btn("Championship records", champRecords, "sm"))),
      h("div.panel", null, h("h3", { text: "Players" }), list))), { back: title });
}
function bracketScreen() {
  const b = bracket; if (!b) return title();
  if (b.champion !== null) return champion();
  if (bg.mode !== "demo") bgDemo();
  const nx = TN.nextMatch(b), P = b.players;
  const cols = b.rounds.map((round, r) => h("div.bround", null, h("h4", { text: TN.roundName(b, r) }), round.map((m, i) => {
    const line = (pi) => pi === null ? h("div", null, h("small", { text: "—" })) : h("div" + (m.winner === null ? "" : m.winner === pi ? ".w" : ".l"), null, h("span", { text: P[pi].name }), h("small", { text: BY_ID[P[pi].char].name }));
    return h("div.bm" + (nx && nx.r === r && nx.i === i ? ".next" : ""), null, line(m.a), line(m.b));
  })));
  const a = nx && P[nx.m.a], c = nx && P[nx.m.b];
  const play = btn("PLAY NEXT MATCH ▶", () => {
    const two = !a.cpu && !c.cpu;
    fight({ mode: "tourney", arena: randomArena(), twoPlayer: two, p: [{ id: a.char, costume: a.cpu ? 0 : costumeOf(a.char), cpu: a.cpu, level: a.level, name: a.name }, { id: c.char, costume: c.cpu ? 0 : costumeOf(c.char), cpu: c.cpu, level: c.level, name: c.name }],
      onEnd: (r) => {
        const res = TN.report(b, nx.r, nx.i, r.winner === 0 ? nx.m.a : nx.m.b, { combo: r.stats.map((s) => s.maxCombo), ults: r.stats.map((s) => s.ults), secs: r.secs });
        if (!res.ok) toast(res.why);
        [a, c].forEach((p, i) => { if (p.cpu) return; const row = save.champ.players[p.name] || (save.champ.players[p.name] = { w: 0, l: 0, titles: 0, combo: 0, ults: 0, fastest: 0, chars: {} }); if (r.winner === i) { row.w++; if (!row.fastest || r.secs < row.fastest) row.fastest = r.secs; } else row.l++; row.combo = Math.max(row.combo, r.stats[i].maxCombo); row.ults += r.stats[i].ults; row.chars[p.char] = (row.chars[p.char] || 0) + 1; });
        persist(); game.stop(); bracketScreen();
      } });
  }, "go"); play.setAttribute("data-first", "");
  const quick = nx && a.cpu && c.cpu ? btn("Quick result (skip CPU match)", () => { let res; do { res = TN.simulate(b, nx.r, nx.i); } while (res.ok && !res.done); bracketScreen(); }, "sm") : null;
  const series = b.series ? ` · Series: ${b.series.a}–${b.series.b}` : "";
  show(scr(b.display ? "display" : "", head(b.title, (b.room ? b.room + " · " : "") + (nx ? `Up next: ${a.name} (${BY_ID[a.char].name}) vs. ${c.name} (${BY_ID[c.char].name})` + series : ""), null),
    h("div.bracket", null, cols), h("div.row", { style: "margin-top:10px" }, play, quick, btn(b.display ? "Exit display mode" : "📽 Classroom display mode", () => { b.display = !b.display; if (b.display) fullscreen(true); bracketScreen(); }, "sm"), btn("End tournament", () => { bracket = null; title(); }, "sm"))), { back: null });
}
function champion() {
  const b = bracket, p = b.players[b.champion], f = BY_ID[p.char];
  let got = [];
  if (!b.recorded) {
    b.recorded = true; save.champ.titles++; save.champ.last = { title: b.title, room: b.room, name: p.name, char: p.char, size: b.size, when: new Date().toISOString().slice(0, 10) };
    if (!p.cpu) { const row = save.champ.players[p.name]; if (row) row.titles++; got = PR.recordClear(save, "champ", p.char, ROSTER.map((x) => x.id)); }
    persist(); AudioFx.music("victory"); AudioFx.sfx("cheer"); AudioFx.announce(p.name + " is the champion!", { speak: st.speech });
  }
  bgPreview(p.char, p.cpu ? 0 : costumeOf(p.char), { still: true, win: true });
  const aw = TN.awards(b);
  const cert = () => { const c = $("#cert"); c.innerHTML = ""; c.append(h("p", { text: b.room || "Lighthouse Baptist Academy" }), h("h1", { text: b.title }), h("p", { text: "This certifies that" }), h("h2", { text: p.name }), h("p", { text: "is the CHAMPION, fighting as " + f.name + " in a bracket of " + b.size + " players." }), h("p", { text: aw.map((a) => a[0] + ": " + a[1]).join("  •  ") }), h("p", { text: new Date().toLocaleDateString() + "   •   Hero Clash: Ultimate Showdown   •   Mr. Watford" })); window.print(); };
  show(scr("center" + (b.display ? ".display" : ""), h("div.trophy", { text: "🏆" }), h("h1.disp", { text: p.name + " is the champion!" }), h("p.sub", { text: b.title + (b.room ? " · " + b.room : "") + " · " + f.name }),
    h("div.panel", { style: "min-width:min(520px,92vw)" }, h("table.moves", null, h("tr", null, h("th", { text: "Player" }), h("th", { text: "Hero" }), h("th", { text: "Wins" }), h("th", { text: "Losses" })), b.players.slice().sort((x, y) => y.wins - x.wins).slice(0, 8).map((q) => h("tr", null, h("td", { text: q.name }), h("td", { text: BY_ID[q.char].name }), h("td", { text: q.wins }), h("td", { text: q.losses })))),
      aw.length ? h("div.list", { style: "margin-top:8px" }, aw.map((a) => h("div.item", null, h("span", { text: "⭐" }), h("b", { text: a[0] }), h("span", { text: a[1] })))) : null),
    h("div.row", { style: "margin-top:14px;justify-content:center" }, btn("🖨 Print certificate", cert), btn("New tournament", () => { bracket = null; tourneySetup(); }, "go"), btn("Main menu", () => { bracket = null; title(); }))), { back: null, veil: true });
  if (got.length) news(got);
}
function champRecords() {
  const rows = Object.entries(save.champ.players).sort((a, b) => b[1].w - a[1].w);
  show(scr("", head("Championship records", "Kept on this device only. Nicknames, wins, and losses: nothing personal.", tourneySetup),
    h("div.panel", null, rows.length ? h("table.moves", null, h("tr", null, ["Nickname", "Wins", "Losses", "Win %", "Titles", "Most-used hero", "Longest combo", "Ultimate Moves", "Fastest win"].map((t) => h("th", { text: t }))),
      rows.map(([n, r]) => { const top = Object.entries(r.chars).sort((a, b) => b[1] - a[1])[0]; return h("tr", null, [n, r.w, r.l, Math.round(100 * r.w / Math.max(1, r.w + r.l)) + "%", r.titles, top && BY_ID[top[0]] ? BY_ID[top[0]].name : "—", r.combo + " hits", r.ults, r.fastest ? r.fastest + " s" : "—"].map((t) => h("td", { text: t }))); })) : h("p", { text: "No tournament matches played yet." }),
      save.champ.last ? h("p", { style: "color:var(--dim)", text: `Last champion: ${save.champ.last.name} (${BY_ID[save.champ.last.char] ? BY_ID[save.champ.last.char].name : ""}), ${save.champ.last.title}, ${save.champ.last.when}` }) : null,
      h("div.row", { style: "margin-top:10px" }, btn("Reset championship records", () => { if (confirm("Erase all championship records on this device?")) { save.champ = { last: null, players: {}, titles: 0 }; persist(); champRecords(); } }, "sm")))), { back: tourneySetup });
}

// ---------------------------------------------------------------- customization, mastery, rivalries, achievements
function charStrip(curId, pickFn) {
  return h("div.grid", { style: "grid-template-columns:repeat(auto-fill,minmax(54px,1fr));margin-bottom:10px" }, roster().map((f) => { const c = h("button.cell" + (f.id === curId ? ".p1" : "") + (f.side === "villain" ? ".vil" : ""), { type: "button", "aria-label": f.name, on: { click: () => pickFn(f.id) } }, pic(f.id, costumeOf(f.id), 64)); if (f.id === curId) c.setAttribute("data-first", ""); return c; }));
}
function customize(id) {
  id = typeof id === "string" ? id : save.professor && !customize.seen ? "professor" : customize.last || "titan"; customize.last = id; if (id === "professor") customize.seen = true;
  const f = BY_ID[id], cs = PR.charStats(save, id), lv = PR.levelOf(cs.mp), sel = costumeOf(id);
  bgPreview(id, sel, { still: false });
  const cos = f.costumes.map((name, i) => { const open = PR.costumeOpen(save, id, i); return h("button.item" + (open ? "" : ".locked"), { type: "button", on: { click: () => { if (!open) { AudioFx.sfx("uiLocked"); return; } save.costume[id] = i; persist(); pcache.clear(); AudioFx.sfx("uiSelect"); customize(id); } } }, h("span", { text: open ? (i === sel ? "✔" : "👕") : "🔒" }), h("div", null, h("b", { text: name + (i === sel ? " (wearing)" : "") }), h("small", { text: i === 0 ? "Classic suit: always available" : open ? ["", "Elite suit", "Legendary suit", "Champion suit"][i] + ": unlocked" : PR.COSTUME_RULES[i].text })), h("span")); });
  const poseOpen = lv >= 15, poseSel = h("select", { on: { change: (e) => { save.pose[id] = e.target.value; persist(); applyPoses(); bgPreview(id, sel, { still: true, win: true }); } } }, h("option", { value: "", text: "Signature pose" }), VICTORY_NAMES.map((v) => h("option", { value: v, text: v.replace(/([A-Z])/g, " $1").toLowerCase() }))); poseSel.value = save.pose[id] || ""; poseSel.disabled = !poseOpen;
  show(scr("", head("Hero Customization", "Costumes are earned by playing. They change looks only, never strength.", title), charStrip(id, customize),
    h("div.cols", null, h("div"), h("div.panel", null, h("h3", { text: f.name + " · costumes" }), h("div.list", null, cos),
      h("label.opt", { style: "margin-top:10px" }, "Victory pose" + (poseOpen ? "" : " (mastery level 15)"), poseSel),
      h("div.row", { style: "margin-top:8px" }, btn("See victory pose", () => bgPreview(id, sel, { still: true, win: true }), "sm"), btn("See moves", () => bgPreview(id, sel), "sm")),
      h("p", { style: "font-size:13px;color:var(--dim)", text: `With ${f.name}: ${cs.wins} wins · ${cs.ults} Ultimate Moves · mastery level ${lv} (${PR.rankOf(lv)})` })))), { back: title, veil: false });
}
function applyPoses() { for (const f of ROSTER) { if (!f.anim.victory0) f.anim.victory0 = f.anim.victory; const lv = PR.levelOf(PR.charStats(save, f.id).mp); f.anim.victory = lv >= 15 && save.pose[f.id] && VICTORY_NAMES.includes(save.pose[f.id]) ? save.pose[f.id] : f.anim.victory0; } }
function mastery() {
  bgDemo();
  const rows = roster().map((f) => { const c = PR.charStats(save, f.id), lv = PR.levelOf(c.mp), into = lv >= PR.MAX_LEVEL ? 1 : (c.mp % PR.MP_PER_LEVEL) / PR.MP_PER_LEVEL, frame = lv >= 25 ? "3px solid #ffcf4a" : lv >= 10 ? "3px solid #cfd8e8" : "1px solid transparent";
    return h("div.item", null, h("div", { style: `width:52px;height:52px;border-radius:6px;overflow:hidden;border:${frame}` }, pic(f.id, costumeOf(f.id), 64)), h("div", null, h("b", { text: `${f.name} · Level ${lv} · ${PR.rankOf(lv)}` }), h("div.bar", { style: "margin:4px 0" }, h("b", { style: `width:${into * 100}%` })), h("small", { text: `${c.wins} wins · ${c.plays} matches · ` + (PR.MASTERY_REWARDS.find((r) => r[0] > lv) ? "Next reward at level " + PR.MASTERY_REWARDS.find((r) => r[0] > lv)[0] + ": " + PR.MASTERY_REWARDS.find((r) => r[0] > lv)[1] : "All rewards earned") })), h("span")); });
  show(scr("", head("Character Mastery", "Every finished match against the CPU earns mastery points for that fighter: 25 for a win, 10 for a loss, plus a little for each Ultimate Move. Rewards are cosmetic only.", title),
    h("div.cols", null, h("div.panel", null, h("div.list", null, rows.slice(0, Math.ceil(rows.length / 2)))), h("div.panel", null, h("div.list", null, rows.slice(Math.ceil(rows.length / 2)))))), { back: title });
}
function rivalries(n) {
  const list = RIVALRIES.filter((r) => r.ids[1] !== "*"), r = list[typeof n === "number" ? n : 0], [a, b] = r.ids.map((i) => BY_ID[i]);
  bgDemo();
  const items = list.map((x, i) => { const bt = h("button.item" + (x === r ? "" : ""), { type: "button", style: x === r ? "border-color:var(--gold)" : "", on: { click: () => rivalries(i) } }, h("span", { text: x.featured ? "⚔" : "•" }), h("div", null, h("b", { text: BY_ID[x.ids[0]].name + " vs. " + BY_ID[x.ids[1]].name }), h("small", { text: x.title + (x.n && save.ach["rival" + x.n] ? " · won ✔" : "") })), h("span")); if (x === r) bt.setAttribute("data-first", ""); return bt; });
  show(scr("", head("Rivalries", "Some fighters have history. Pick these match-ups in any mode to see their special introductions.", title),
    h("div.cols", null, h("div.panel", null, h("div.list", null, items)),
      h("div.panel", null, h("div.row", null, h("div", { style: "width:90px;border-radius:8px;overflow:hidden" }, pic(a.id, 0, 128)), h("h1.disp", { text: "VS" }), h("div", { style: "width:90px;border-radius:8px;overflow:hidden" }, pic(b.id, 0, 128))), h("h3", { style: "margin-top:8px", text: r.title }), h("p", { text: r.about }),
        h("div.list", null, r.lines.map(([id, t]) => h("div.item", null, h("b", { text: BY_ID[id].name }), h("span", { text: "“" + t + "”" }), h("span")))),
        h("div.row", { style: "margin-top:12px" }, btn("Play as " + a.name, () => fight({ mode: "quick", arena: randomArena(), p: [{ id: a.id, costume: costumeOf(a.id) }, { id: b.id, cpu: true, level: st.difficulty }] }), "go"), btn("Play as " + b.name, () => fight({ mode: "quick", arena: randomArena(), p: [{ id: b.id, costume: costumeOf(b.id) }, { id: a.id, cpu: true, level: st.difficulty }] })))))), { back: title });
}
function achievements() {
  bgDemo();
  const s = save.stats, top = Object.entries(s.byChar).sort((a, b) => b[1].plays - a[1].plays)[0];
  const stats = [["Matches played", s.matches], ["Wins", s.wins], ["Losses", s.losses], ["Win percentage", s.matches ? Math.round(100 * s.wins / s.matches) + "%" : "—"], ["Best win streak", s.bestStreak], ["Most-used hero", top && top[1].plays ? BY_ID[top[0]].name : "—"], ["Longest combo", s.maxCombo + " hits"], ["Ultimate Moves landed", s.ults], ["Fastest victory", s.fastest ? s.fastest + " seconds" : "—"], ["Tournaments won", s.tournaments], ["Arcade ladders finished", s.arcadeClears], ["Costumes unlocked", PR.costumesOpen(save, ROSTER.map((f) => f.id)) + " of " + ROSTER.length * 3]];
  show(scr("", head("Achievements", Object.keys(save.ach).length + " of " + PR.ACHIEVEMENTS.length + " earned", title),
    h("div.cols", null, h("div.panel", null, h("div.list", null, PR.ACHIEVEMENTS.map(([id, n, d]) => { const hidden = id === "exam" && !save.ach.exam; return h("div.item" + (save.ach[id] ? "" : ".locked"), null, h("span", { text: save.ach[id] ? "🏅" : "🔒" }), h("div", null, h("b", { text: hidden ? "? ? ?" : n }), h("small", { text: hidden ? "A secret." : d })), h("span")); }))),
      h("div.panel", null, h("h3", { text: "Your statistics" }), h("table.moves", null, stats.map(([a, b]) => h("tr", null, h("td", { text: a }), h("td", { text: b })))), h("p", { style: "font-size:13px;color:var(--dim)", text: "Statistics count matches against the computer. Everything is stored only in this browser." })))), { back: title });
}

// ---------------------------------------------------------------- how to play, settings, pause
function howTo() {
  bgDemo();
  const K = save.keys, kb = (m, a) => h("kbd", { text: keyName(m[a]) });
  const table = (m) => h("table.moves", null, ACTIONS.map(([a, n]) => h("tr", null, h("td", { text: n }), h("td", null, kb(m, a)))));
  show(scr("", head("How to Play", "Knock out your opponent's health bar to win a round. Win two rounds to win the match.", title),
    h("div.cols", null,
      h("div.panel", null, h("h3", { text: "The basics" }), h("ul", { style: "margin:0;padding-left:18px;line-height:1.5;font-size:14px" },
        ["Light attacks are fast. Heavy attacks hit harder but leave you open if they miss.", "Hold Block to stop attacks. Crouch + Block stops low attacks; stand to block jumping attacks.", "Press Block at the last moment for a COUNTER that staggers the attacker.", "Throws beat blocking. Press Throw (or Light Punch + Light Kick) when you are grabbed to escape.", "Dash/Dodge with a direction dashes. With no direction it side-steps through an attack (costs stamina, the green bar).", "Combos: Light → Light → Heavy → Special → Ultimate. Down + Heavy Punch launches; hold Up to chase for an air combo.", "Being comboed? Press Dash/Dodge to COMBO BREAK (needs 60% stamina).", "Hold Heavy Punch to charge it. A charged hit crushes a guard.", "Specials: Special alone, or with Forward, Down, or Back, gives four different powers.", "Fill the blue meter by fighting, then press Ultimate for your fighter's cinematic Ultimate Move.", "Knock an opponent hard into the right edge of an arena to smash through into a second area."].map((t) => h("li", { text: t })))),
      h("div.panel", null, h("h3", { text: "One player keyboard" }), table(K.solo)),
      h("div.panel", null, h("h3", { text: "Two players, one keyboard" }), h("div.cols", { style: "grid-template-columns:1fr 1fr" }, h("div", null, h("b", { text: "Player 1" }), table(K.p1)), h("div", null, h("b", { text: "Player 2" }), table(K.p2))), h("p", { style: "font-size:13px;color:var(--dim)", text: "Gamepads work too. Touch screens get on-screen buttons. Change any key in Settings." })))), { back: title });
}
function settings(tab) {
  if (!game.running) bgDemo();
  const back = game.running ? pause : title;
  const slider = (label, key) => { const r = h("input", { type: "range", min: 0, max: 1, step: 0.05, value: st[key], "aria-label": label, on: { input: (e) => { st[key] = +e.target.value; applySettings(); }, change: () => { persist(); AudioFx.sfx("uiSelect"); } } }); return h("label.opt", null, label, r); };
  const check = (label, key, after) => { const c = h("input", { type: "checkbox", on: { change: (e) => { st[key] = e.target.checked; applySettings(); persist(); if (after) after(); } } }); c.checked = !!st[key]; return h("label.opt", null, label, c); };
  const pickRow = (label, key, opts, after) => { const s = h("select", { on: { change: (e) => { const v = e.target.value; st[key] = isNaN(+v) || v === "" ? v : +v; applySettings(); persist(); if (after) after(); } } }, opts.map(([v, t]) => h("option", { value: v, text: t }))); s.value = String(st[key]); return h("label.opt", null, label, s); };
  const keyTable = (name, label) => h("div", null, h("b", { text: label }), h("table.moves", null, ACTIONS.map(([a, n]) => { const b = h("button.btn.sm", { type: "button", on: { click: () => { b.firstChild.textContent = "press a key…"; input.capture = (code) => { if (code !== "Escape") { save.keys[name][a] = code; input.setKeys(save.keys); persist(); } settings("controls"); }; } } }, h("span", { text: keyName(save.keys[name][a]) })); return h("tr", null, h("td", { text: n }), h("td", null, b)); })));
  const clash = overlaps(save.keys.p1, save.keys.p2), dup = [...duplicates(save.keys.solo), ...duplicates(save.keys.p1), ...duplicates(save.keys.p2)];
  const padRow = (a, n) => { const s = h("select", { on: { change: (e) => { save.pad[a] = +e.target.value; persist(); } } }, PAD_NAMES.slice(0, 12).map((t, i) => h("option", { value: i, text: t }))); s.value = save.pad[a]; return h("label.opt", null, n, s); };
  const body = tab === "controls"
    ? h("div.cols", null, h("div.panel", null, h("h3", { text: "Keyboard" }), clash.length ? h("p", { style: "color:#ff9a7a;font-weight:700", text: "⚠ Player 1 and Player 2 both use: " + clash.map(keyName).join(", ") + ". Change one so two-player matches work." }) : null, dup.length ? h("p", { style: "color:#ff9a7a;font-weight:700", text: "⚠ A layout uses the same key twice: " + [...new Set(dup)].map(keyName).join(", ") }) : null,
        h("div.cols", { style: "grid-template-columns:repeat(3,1fr)" }, keyTable("solo", "One player"), keyTable("p1", "Two player: P1"), keyTable("p2", "Two player: P2")), h("div.row", { style: "margin-top:8px" }, btn("Reset keys to default", () => { save.keys = JSON.parse(JSON.stringify(DEFAULT_KEYS)); input.setKeys(save.keys); persist(); settings("controls"); }, "sm"))),
        h("div.panel", null, h("h3", { text: "Gamepad buttons" }), ACTIONS.filter(([a]) => DEFAULT_PAD[a] !== undefined).map(([a, n]) => padRow(a, n)), h("p", { style: "font-size:13px;color:var(--dim)", text: "Move with the D-pad or left stick. " + (input.padSeen ? input.padSeen + " gamepad(s) connected." : "No gamepad detected yet: press a button on it.") }), btn("Reset gamepad", () => { save.pad = Object.assign({}, DEFAULT_PAD); input.pad = save.pad; persist(); settings("controls"); }, "sm"),
          h("h3", { style: "margin-top:14px", text: "Touch controls" }), pickRow("On-screen buttons", "touch", [["auto", "Automatic"], ["on", "Always on"], ["off", "Off"]]), h("label.opt", null, "Button size", h("input", { type: "range", min: 0.7, max: 1.5, step: 0.05, value: st.touchSize, on: { input: (e) => { st.touchSize = +e.target.value; applySettings(); persist(); } } })), h("label.opt", null, "Button visibility", h("input", { type: "range", min: 0.3, max: 1, step: 0.05, value: st.touchOpacity, on: { input: (e) => { st.touchOpacity = +e.target.value; applySettings(); persist(); } } })), check("Swap sides (buttons on the left)", "touchSwap")))
    : h("div.cols", null,
      h("div.panel", null, h("h3", { text: "Sound" }), slider("Music", "music"), slider("Sound effects", "sfx"), slider("Announcer and voices", "voice"), check("Mute everything (classroom quiet mode)", "mute"), check("Spoken lines (uses this device's built-in voice)", "speech"),
        h("h3", { style: "margin-top:14px", text: "Graphics" }), pickRow("Quality", "quality", [["auto", "Automatic"], ["low", "Low (older Chromebooks)"], ["medium", "Medium"], ["high", "High"]], () => { if (confirm("Reload the game now to apply the new graphics quality?")) location.reload(); }), h("div.row", { style: "margin-top:6px" }, btn("Full screen", () => fullscreen(), "sm"))),
      h("div.panel", null, h("h3", { text: "Match" }), pickRow("CPU difficulty", "difficulty", LEVEL_ORDER.map((k) => [k, LEVELS[k].name])), pickRow("Round timer", "time", [["60", "60 seconds"], ["99", "99 seconds"], ["0", "No timer"]]), pickRow("Rounds to win", "rounds", [["1", "1 (quick match)"], ["2", "2 (best of three)"], ["3", "3 (best of five)"]]), check("Arena transitions", "transitions"), check("Fighter and rivalry introductions", "intros"),
        h("h3", { style: "margin-top:14px", text: "Accessibility" }), check("Reduced motion (no camera shake, short Ultimate scenes)", "reducedMotion"), check("Reduced flashing", "reducedFlash"), check("High contrast menus and HUD", "highContrast")),
      h("div.panel", null, h("h3", { text: "Saved data" }), h("p", { style: "font-size:14px", text: "Settings, statistics, unlocks, and tournament records are stored only in this browser on this device. There are no accounts and nothing is sent anywhere." }), btn("Erase all Hero Clash progress", () => { if (confirm("Erase ALL Hero Clash progress, unlocks, and settings on this device? This cannot be undone.")) { try { storage.removeItem(PR.SAVE_KEY); } catch (e) {} location.reload(); } }, "sm")));
  show(scr("", head("Settings", null, back), h("div.row", { style: "margin-bottom:10px" }, btn("General", () => settings(), "sm" + (tab ? "" : " on")), btn("Controls", () => settings("controls"), "sm" + (tab === "controls" ? " on" : ""))), body), { back });
}
function fullscreen(force) { const d = document; if (!d.fullscreenElement) { const p = $("#app").requestFullscreen && $("#app").requestFullscreen(); if (p && p.catch) p.catch(() => {}); } else if (!force && d.exitFullscreen) d.exitFullscreen(); }
function pause() {
  if (!game.running || game.over) return;
  game.setPaused(true); $("#train").style.visibility = "hidden";
  const cfg = game.cfg, f = game.match.f[0].def, K = cfg.twoPlayer ? save.keys.p1 : save.keys.solo, k = (a) => h("kbd", { text: keyName(K[a]) });
  const quit = () => { const m = cfg.mode; game.setPaused(false); $("#train").style.visibility = ""; game.stop(); if (m === "tourney") bracketScreen(); else if (m === "arcade") arcadeLadder(); else title(); };
  show(scr("center", h("h1.disp", { text: "Paused" }),
    h("div.panel", { style: "text-align:left;max-width:560px" }, h("h3", { text: f.name + (cfg.twoPlayer ? " (Player 1)" : "") + " · specials" }), h("table.moves", null, ["sp1", "sp2", "sp3", "sp4", "sp5"].filter((x) => f.moves[x]).map((x) => h("tr", null, h("td", null, x === "sp2" ? "Forward + " : x === "sp3" ? "Down + " : x === "sp4" ? "Back + " : x === "sp5" ? "Block + " : "", k("sp")), h("td", { text: f.moves[x].name }))), h("tr", null, h("td", null, k("ult")), h("td", { text: f.moves.ult.name + " (full blue meter)" })))),
    h("div.row", { style: "margin-top:14px;justify-content:center" }, btn("Resume", resume, "go"), btn("Settings", () => settings()), cfg.mode === "tourney" ? null : btn("Restart match", () => { game.setPaused(false); $("#train").style.visibility = ""; const c = Object.assign({}, cfg); c.onEnd = cfg.userEnd || null; game.stop(); restart(cfg); }), btn(cfg.mode === "tourney" ? "Forfeit to bracket" : "Quit match", quit))), { back: resume });
}
function restart(cfg) { show(null); bg.match = null; game.start(cfg); if (cfg.training) trainPanel(); }
function resume() { if (!game.running) return; show(null); hint.textContent = "Esc or P: pause"; $("#train").style.visibility = ""; applySettings(); game.showTouch(); game.setPaused(false); }

// ---------------------------------------------------------------- start up
applySettings(); applyPoses();
$("#pausebtn").addEventListener("click", pause);
addEventListener("resize", () => stage.resize());
document.addEventListener("visibilitychange", () => { if (document.hidden) { if (game.running && !game.paused && !game.over) pause(); else AudioFx.pause(); } else if (!game.paused) AudioFx.resume(); });
addEventListener("keydown", (e) => { if (e.code === "KeyF" && !game.running && !/INPUT|SELECT/.test(e.target.tagName)) fullscreen(); });
for (const ev of ["pointerdown", "keydown"]) addEventListener(ev, () => { AudioFx.init(); }, { once: false, passive: true });
addEventListener("gamepadconnected", () => toast("Gamepad connected"));
let last = performance.now();
function loop(now) {
  requestAnimationFrame(loop);
  const ms = Math.min(100, now - last); last = now;
  menuInput();
  if (game.running) { game.frame(ms); if (st.quality === "auto" && !game.paused && stage.adapt(ms)) { /* resolution lowered to keep the game smooth */ } }
  else bgFrame(ms);
}
title();
requestAnimationFrame(loop);
window.__hc = { game, stage, save, input, fight, title, PR, bg, persist, BY_ID, ROSTER, loop, results };
