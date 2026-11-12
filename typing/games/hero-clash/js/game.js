// Hero Clash — runs one match: reads inputs, steps the combat engine 60 times a
// second, and turns what happened into pictures, sounds, and HUD updates.
import { Match, blankInput, FPS } from "./combat.js";
import { BY_ID, combosFor } from "./fighters.js";
import { CPU, dummyInput } from "./ai.js";
import { portrait, EL } from "./render.js";
import { ARENAS } from "./arenas.js";
import { GameAudio as AudioFx } from "./audio.js";

const $ = (s) => document.querySelector(s);
const STEP = 1000 / FPS;
const KEY_TO_MOVE = (keys) => { let air = false; const out = []; for (const k of keys) { if (k === "u") { air = true; continue; } if (k === "ult" || k.startsWith("sp")) { out.push(k); continue; } const parts = k.split("+"), b = parts[parts.length - 1].toUpperCase(); out.push((air ? "j" : parts[0] === "d" ? "2" : "5") + b); } return out; };

export class Game {
  constructor(stage, input, save) {
    this.stage = stage; this.input = input; this.save = save;
    this.match = null; this.cfg = null; this.paused = false; this.acc = 0; this.over = false;
    this.hud = { el: $("#hud"), side: [0, 1].map((i) => { const s = $("#s" + i); return { port: s.querySelector(".port"), hp: s.querySelector(".hp"), hpB: s.querySelector(".hp b"), hpI: s.querySelector(".hp i"), mt: s.querySelector(".mt"), mtB: s.querySelector(".mt b"), stm: s.querySelector(".stm"), stmB: s.querySelector(".stm b"), n: s.querySelector(".n"), pips: s.querySelector(".pips"), combo: $("#c" + i), note: $("#n" + i), last: {} }; }), timer: $("#timer") };
    this.msgEl = $("#msg"); this.subEl = $("#sub"); this.bannerEl = $("#banner"); this.flashEl = $("#flash");
  }
  get running() { return !!this.match; }

  // cfg: { p:[{id,costume,cpu,level,name,tune}], arena, mode, rounds, time, twoPlayer, training, rivalry, exam, onEnd }
  start(cfg) {
    const st = this.save.settings;
    this.cfg = cfg; this.over = false; this.paused = false; this.acc = 0; this.secs = 0; this.perfect = [false, false]; this.seq = []; this.challenge = cfg.training ? {} : null;
    const defs = cfg.p.map((p) => BY_ID[p.id]);
    this.stage.clearFx(); this.stage.introDone = {};
    this.stage.setOptions({ reducedMotion: st.reducedMotion, reducedFlash: st.reducedFlash });
    this.stage.setArena(cfg.arena, 0);
    this.stage.arenaDebris = (ARENAS.find((a) => a.id === cfg.arena) || {}).debris;
    cfg.p.forEach((p, i) => this.stage.setFighter(i, defs[i], p.costume || 0));
    const lines = cfg.rivalry && st.intros ? cfg.rivalry.lines : [];
    this.introLines = lines; this.lineLen = 95;
    const intro = cfg.training ? 0 : st.intros ? 150 + lines.length * this.lineLen + (cfg.exam ? 110 : 0) : 0;
    this.match = new Match(defs[0], defs[1], { rounds: cfg.rounds || st.rounds, time: cfg.time === undefined ? st.time : cfg.time, cine: st.reducedMotion ? "short" : "full", transitions: st.transitions && !cfg.training, intro });
    if (cfg.training) this.match.training = { infHp: true, infMeter: false };
    this.cpu = cfg.p.map((p, i) => (p.cpu ? new CPU(p.level || st.difficulty, defs[i], (Date.now() % 100000) + i * 17, { tune: p.tune }) : null));
    this.dummy = "stand";
    // HUD
    this.hud.el.hidden = false;
    this.hud.side.forEach((h, i) => {
      h.port.innerHTML = ""; h.port.appendChild(portrait(defs[i], cfg.p[i].costume || 0, 128));
      h.n.textContent = (cfg.p[i].name ? cfg.p[i].name + " · " : "") + defs[i].name; h.last = {};
      h.combo.classList.remove("on"); h.note.classList.remove("on");
    });
    this.showTouch();
    AudioFx.music(cfg.exam ? "boss" : ["battle1", "battle2", "battle3"][Math.abs(hash(cfg.arena)) % 3]);
    if (intro > 0 && cfg.rivalry) { this.banner(cfg.rivalry.title); AudioFx.announce(cfg.rivalry.announce, { speak: st.speech }); }
    if (cfg.exam) this.banner("THE PROFESSOR — FINAL EXAM BOSS");
    if (window.PlayCount && !cfg.training && !this.counted) { this.counted = true; try { window.PlayCount.hit("hero-clash"); } catch (e) {} }
    this.handle(this.match.events);
  }
  stop() { this.match = null; this.hud.el.hidden = true; this.hud.side.forEach((h) => { h.combo.classList.remove("on"); }); this.sub(""); $("#touch").classList.remove("show"); $("#train").hidden = true; this.stage.clearFx(); this.stage.setFighter(0, null); this.stage.setFighter(1, null); }
  showTouch() { const t = this.save.settings.touch; const on = t === "on" || (t === "auto" && (matchMedia("(pointer: coarse)").matches || navigator.maxTouchPoints > 0 && innerWidth < 1100)); $("#touch").classList.toggle("show", on && !this.cfg.p.every((p) => p.cpu)); }

  // ---------- messages ----------
  msg(text, small, secs = 1.3) { const m = this.msgEl; m.innerHTML = ""; m.textContent = text; if (small) { const s = document.createElement("small"); s.textContent = small; m.appendChild(s); } m.style.setProperty("--d", secs + "s"); m.classList.remove("on"); void m.offsetWidth; m.classList.add("on"); }
  banner(text) { const b = this.bannerEl; b.textContent = text; b.classList.remove("on"); void b.offsetWidth; b.classList.add("on"); }
  sub(text, who) { if (this.subText === text + who) return; this.subText = text + who; this.subEl.innerHTML = ""; if (!text) return; const d = document.createElement("div"); if (who) { const b = document.createElement("b"); b.textContent = who + ":"; d.appendChild(b); } d.appendChild(document.createTextNode(text)); this.subEl.appendChild(d); }
  note(i, text) { const n = this.hud.side[i].note; n.textContent = text; n.classList.remove("on"); void n.offsetWidth; n.classList.add("on"); }

  // ---------- main loop ----------
  frame(ms) {
    const m = this.match; if (!m) return;
    if (!this.paused) {
      this.acc = Math.min(this.acc + ms, STEP * 5);
      while (this.acc >= STEP) { this.acc -= STEP; this.tick(); if (!this.match) return; }
    }
    this.stage.draw(m, this.paused ? 0 : ms / 1000);
    this.drawHud();
    const fl = this.stage.flashAmount(); this.flashEl.style.opacity = fl > 0.01 ? fl : 0;
  }
  tick() {
    const m = this.match, cfg = this.cfg;
    if (m.phase === "ko" && m.pt < 60 && m.frame % 2 === 0 && !this.save.settings.reducedMotion) { m.frame++; return; }   // slow motion on a knockout
    const ins = [0, 1].map((i) => {
      if (this.cpu[i]) return this.cpu[i].think(m, m.f[i]);
      if (cfg.training && i === 1) return this.dummy === "cpu" ? (this.tcpu || (this.tcpu = new CPU("normal", m.f[1].def, 5))).think(m, m.f[1]) : dummyInput(this.dummy, m, m.f[1]);
      return this.input.read(i, !!cfg.twoPlayer);
    });
    if (m.phase === "intro") {
      const any = (o) => o.lp || o.hp || o.lk || o.hk || o.sp || o.blk || o.ult;
      if ((!this.cpu[0] && any(ins[0])) || (!this.cpu[1] && any(ins[1])) || this.skip) { this.skip = false; if (m.pt > 20) { m.skipIntro(); this.sub(""); } }
      this.introTick();
    }
    if (m.phase === "fight") this.secs += 1 / FPS;
    m.step(ins[0], ins[1]);
    this.handle(m.events);
    if (m.cine) { const line = this.stage.cineLine || ""; if (line !== this.cineLine) { this.cineLine = line; this.sub(line, line ? m.f[m.cine.att].def.name : ""); if (line && this.save.settings.speech) AudioFx.say(line, { pitch: 0.9, rate: 1 }); } }
  }
  introTick() {
    const m = this.match, L = this.introLines, t = m.pt - 150;
    if (t < 0 || !L.length) { if (this.cfg.exam && m.pt > 150) this.sub(BY_ID.professor.quote, "The Professor"); return; }
    const i = Math.floor(t / this.lineLen);
    if (i < L.length) {
      const [id, text] = L[i], who = m.f.findIndex((f) => f.def.id === id), f = m.f[Math.max(0, who)];
      this.sub(text, f.def.name);
      if (t % this.lineLen === 1 && this.save.settings.speech) AudioFx.say(text, { pitch: who === 0 ? 1 : 0.8, rate: 1.05 });
      this.stage.camOverride = { x: f.x * 0.55, y: 1.35, d: 6.6 };
      this.rivalFx(this.cfg.rivalry.fx, m, t);
    } else this.sub("");
  }
  rivalFx(kind, m, t) {
    const S = this.stage, [a, b] = m.f, ca = EL[a.def.el], cb = EL[b.def.el];
    if (kind === "energy") { for (const [f, c] of [[a, ca], [b, cb]]) S.emit({ x: f.x + f.facing * 0.4, y: 1.3, n: 1, color: c, size: 0.4, life: 16, vx: f.facing * 0.12, drag: 1, spread: 0.3 }); if (t % 6 === 0) S.emit({ x: 0, y: 1.3, n: 1, color: 0xffffff, tex: "ring", size: 0.4, life: 14, grow: 5 }); }
    else if (kind === "speedice") { S.emit({ x: a.x + Math.sin(t * 0.5) * 0.6, y: 0.4 + Math.random() * 1.4, n: 1, color: ca, size: 0.5, life: 10, sx: 4, spin: false }); if (t % 4 === 0) S.emit({ x: b.x + (Math.random() - 0.5) * 1.4, y: 0.2 + Math.random() * 1.8, n: 1, color: cb, tex: "shard", size: 0.22, life: 26, vy: 0.02 }); }
    else if (kind === "scan") { for (const [f, o, c] of [[a, b, ca], [b, a, cb]]) if (t % 3 === 0) S.emit({ x: o.x, y: ((t * 0.035 + (f === a ? 0 : 0.9)) % 1.9) + 0.1, n: 1, color: c, size: 1.3, life: 6, sx: 2.5, spin: false, opacity: 0.6 }); if (t % 30 === 0) AudioFx.sfx("el_tech", { vol: 0.4 }); }
    else if (kind === "storm") { if (t % 3 === 0) S.emit({ x: (Math.random() - 0.5) * 9, y: 0.4 + Math.random() * 3, n: 1, color: 0xdff2ff, tex: "smoke", size: 1.2, life: 18, vx: 0.12, opacity: 0.4 }); if (t % 40 === 5) { S.emit({ x: (Math.random() - 0.5) * 6, y: 3.5, n: 1, color: ca, tex: "bolt", size: 6, life: 7, spin: false, sx: 0.3 }); if (!this.save.settings.reducedFlash) S.flash = 0.25; AudioFx.sfx("el_electric", { vol: 0.5 }); } }
    else if (kind === "class" && t % 5 === 0) S.emit({ x: (Math.random() - 0.5) * 8, y: 0.3, n: 1, color: EL.math, size: 0.25, life: 50, vy: 0.04, drag: 1 });
  }

  handle(events) {
    const m = this.match, st = this.save.settings, cfg = this.cfg;
    this.stage.onEvents(events, m);
    for (const e of events) {
      const f = e.who !== undefined && e.who >= 0 ? m.f[e.who] : null, pan = f ? Math.max(-0.8, Math.min(0.8, f.x / 8)) : 0;
      switch (e.type) {
        case "round": this.msg(e.final ? "FINAL ROUND!" : "ROUND " + e.n, null, 1.1); AudioFx.sfx("countdown"); AudioFx.announce(e.final ? "Final round!" : "Round " + e.n, { speak: st.speech }); this.sub(""); break;
        case "fight": this.msg("FIGHT!", null, 0.8); AudioFx.sfx("fight"); AudioFx.announce("Fight!", { speak: st.speech }); break;
        case "hit": AudioFx.sfx(e.str === 2 ? "hitHeavy" : e.str === 1 ? "hitMedium" : "hitLight", { pan, pitch: 0.92 + Math.random() * 0.16 }); if (e.ch) this.note(e.who, "COUNTER HIT!"); break;
        case "block": AudioFx.sfx("block", { pan }); break;
        case "parry": case "counter": AudioFx.sfx("parry", { pan }); this.note(e.who, f.def.names && f.def.names.parry ? f.def.names.parry.toUpperCase() + "!" : "COUNTER!"); break;
        case "guardBreak": AudioFx.sfx("guardBreak", { pan }); this.note(1 - e.who, "GUARD BREAK!"); break;
        case "breaker": AudioFx.sfx("breaker", { pan }); this.note(e.who, "COMBO BREAKER!"); break;
        case "absorb": AudioFx.sfx("parry", { pan, pitch: 0.7 }); this.note(e.who, "SHIELDED!"); break;
        case "grab": AudioFx.sfx("whoosh", { pan }); break;
        case "throw": AudioFx.sfx("throw", { pan }); break;
        case "tech": AudioFx.sfx("tech"); this.note(0, "THROW ESCAPE!"); break;
        case "jump": AudioFx.sfx("jump", { pan, vol: 0.5 }); break;
        case "land": AudioFx.sfx("land", { pan, vol: 0.4 }); break;
        case "knockdown": AudioFx.sfx("knockdown", { pan }); break;
        case "dash": AudioFx.sfx("dash", { pan, vol: 0.6 }); break;
        case "dodge": AudioFx.sfx("dodge", { pan }); break;
        case "tele": AudioFx.sfx("el_shadow", { pan, vol: 0.7 }); break;
        case "freeze": AudioFx.sfx("freeze", { pan }); this.note(1 - e.who, "FROZEN!"); break;
        case "charge": AudioFx.sfx("charge", { pan }); break;
        case "buff": AudioFx.sfx("el_" + (e.el || f.def.el), { pan }); break;
        case "move": {
          const mv = f.def.moves[e.id];
          if (e.tier >= 3) { AudioFx.sfx("el_" + (e.el || f.def.el), { pan }); if (!this.cpu[e.who] || cfg.training) this.note(e.who, mv.name); if (mv.say) { this.sub(mv.say, f.def.name); if (st.speech) AudioFx.say(mv.say, { pitch: 0.9, rate: 1.1 }); clearTimeout(this.sayT); this.sayT = setTimeout(() => this.sub(""), 1400); } }
          else AudioFx.sfx(e.tier === 2 ? "whooshHeavy" : "whoosh", { pan, vol: 0.5 });
          if (this.challenge && e.who === 0) { const o = m.f[1]; if (f.combo === 0 && !["hstun", "launch", "frozen"].includes(o.state)) this.seq = []; this.seq.push(e.id); }
          break;
        }
        case "proj": break;
        case "meterFull": AudioFx.sfx("meterFull", { pan }); this.note(e.who, "ULTIMATE READY!"); break;
        case "ultStart": AudioFx.sfx("ultStart"); AudioFx.duck(0.6, 4); this.banner(f.def.moves.ult.name); if (this.challenge && e.who === 0) this.seq.push("ult"); break;
        case "cineBeat": AudioFx.sfx(e.last ? "ultBoom" : "hitHeavy"); if (!e.last) AudioFx.sfx("el_" + f.def.el, { vol: 0.6 }); break;
        case "cineEnd": { this.sub(""); this.cineLine = ""; const d = m.f[1 - e.who], rv = cfg.rivalry; if (rv && rv.react && rv.react[d.def.id] && d.hp > 0) { this.sub(rv.react[d.def.id], d.def.name); clearTimeout(this.sayT); this.sayT = setTimeout(() => this.sub(""), 1700); } break; }
        case "transStart": AudioFx.sfx("wallBreak"); this.banner("ARENA BREAK!"); break;
        case "zone": { const a = ARENAS.find((x) => x.id === cfg.arena); if (a) this.note(m.trans ? m.trans.att : 0, a.zones[e.zone].toUpperCase()); break; }
        case "comboEnd": if (this.challenge && e.who === 0) this.checkChallenge(e.n); break;
        case "ko": this.msg("KNOCKOUT!", null, 1.6); AudioFx.sfx("ko"); AudioFx.announce("Knockout!", { speak: st.speech }); break;
        case "timeUp": this.msg("TIME UP!", null, 1.4); AudioFx.sfx("roundEnd"); break;
        case "draw": this.msg("DRAW!", "Replay the round", 1.4); break;
        case "roundWin": if (e.perfect) { this.perfect[e.who] = true; this.msg("PERFECT!", m.f[e.who].def.name, 1.5); AudioFx.announce("Perfect!", { speak: st.speech }); } AudioFx.sfx("roundEnd"); break;
        case "matchEnd": this.finish(e.who); break;
      }
    }
  }
  checkChallenge(hits) {
    const def = this.match.f[0].def, list = combosFor(def);
    list.forEach((c, i) => {
      if (this.challenge[i]) return;
      const want = KEY_TO_MOVE(c.keys); let k = 0;
      for (const id of this.seq) if (id === want[k]) k++;
      if (k >= want.length && hits >= want.length) { this.challenge[i] = true; this.note(0, "COMBO COMPLETE!"); AudioFx.sfx("unlock"); if (this.onChallenge) this.onChallenge(i); }
    });
    this.seq = [];
  }
  finish(who) {
    const m = this.match, w = m.f[who].def;
    this.over = true;
    this.msg(w.side === "villain" ? "VILLAIN VICTORY!" : "HERO VICTORY!", (this.cfg.p[who].name ? this.cfg.p[who].name + " · " : "") + w.name + " wins", 2.6);
    AudioFx.music("victory"); AudioFx.sfx("victory"); AudioFx.sfx("cheer"); AudioFx.announce(w.name + " wins!", { speak: this.save.settings.speech });
    const result = { winner: who, secs: Math.round(this.secs), stats: m.f.map((f) => Object.assign({}, f.stats)), perfect: this.perfect.slice(), rounds: m.f.map((f) => f.wins) };
    setTimeout(() => { if (this.match === m && this.cfg.onEnd) this.cfg.onEnd(result); }, 3000);
  }

  drawHud() {
    const m = this.match;
    m.f.forEach((f, i) => {
      const h = this.hud.side[i], L = h.last;
      const hp = Math.max(0, Math.round(f.hp / f.def.hp * 1000) / 10);
      if (hp !== L.hp) { L.hp = hp; h.hpB.style.width = hp + "%"; h.hpI.style.width = hp + "%"; h.hp.classList.toggle("low", hp < 25); }
      const mt = Math.round(f.meter); if (mt !== L.mt) { L.mt = mt; h.mtB.style.width = mt + "%"; h.mt.classList.toggle("full", mt >= 100); }
      const sm = Math.round(f.stamina); if (sm !== L.sm) { L.sm = sm; h.stmB.style.width = sm + "%"; h.stm.classList.toggle("low", sm < 60); }
      const pk = f.wins + "/" + m.opts.rounds; if (pk !== L.pk) { L.pk = pk; h.pips.innerHTML = ""; if (m.opts.rounds < 10) for (let k = 0; k < m.opts.rounds; k++) { const u = document.createElement("u"); if (k < f.wins) u.className = "on"; h.pips.appendChild(u); } }
      if (f.combo >= 2) { if (f.combo !== L.cb) { L.cb = f.combo; h.combo.innerHTML = ""; h.combo.textContent = f.combo + " HITS"; const s = document.createElement("small"); s.textContent = Math.round(f.comboDmg / m.f[1 - i].def.hp * 100) + "% damage"; h.combo.appendChild(s); h.combo.classList.add("on"); h.combo.classList.remove("pop"); void h.combo.offsetWidth; h.combo.classList.add("pop"); L.cbT = performance.now(); } }
      else if (L.cb && performance.now() - L.cbT > 900) { L.cb = 0; h.combo.classList.remove("on"); }
    });
    const t = m.opts.time > 0 ? Math.ceil(m.timer / FPS) : "∞", key = t + "|" + m.round;
    if (key !== this.hud.tk) { this.hud.tk = key; this.hud.timer.firstChild.nodeValue = t; this.hud.timer.querySelector("small").textContent = this.cfg.training ? "TRAINING" : "ROUND " + m.round; }
  }
  setPaused(p) { if (!this.match || this.over) return; this.paused = p; if (p) AudioFx.pause(); else AudioFx.resume(); }
  resetTraining() { const m = this.match; m.f[0].reset(-1.5); m.f[1].reset(1.5); m.f[0].meter = 0; m.f[1].meter = 0; m.projs.length = 0; m.zone = 0; }
}
function hash(s) { let h = 0; for (const c of String(s)) h = (h * 31 + c.charCodeAt(0)) | 0; return h; }
