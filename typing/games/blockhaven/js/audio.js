import { createAncientScore } from "./ancient-score.js";
import { createCalmScore } from "./calm-score.js";
import { createMenuTheme, createBossScore } from "./epic-score.js";
// Small sound effects made on the fly with the Web Audio API (no sound files needed).
let ctx = null, master = null, noiseBuf = null, volume = 0.6, muted = false;
let wind = null;
let rainLoop = null;   // Milestone 19: steady rain
let ancientScore = null;
let ancientMusicState = null;
let calmScore = null, musicLevel = 0.5, menuTheme = null, bossScore = null, lastError = "", musicBroken = false;   // after a music error, stop retrying every frame

export const Sound = {
  start() {   // must be called after a click or key press (browser rule)
    try {
      if (!ctx) {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) { lastError = "this browser has no Web Audio"; return; }
        ctx = new AC(); master = ctx.createGain(); master.connect(ctx.destination);
        noiseBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
        const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
        this.setVolume(volume);
      }
      // "suspended", or Safari's "interrupted": ask to run again (only works during a click or key press)
      if (ctx.state !== "running" && ctx.state !== "closed") {
        const p = ctx.resume(); if (p && p.catch) p.catch(e => { lastError = e.message || String(e); });
        // Safari: playing a tiny silent sound during the click unlocks audio
        const b = ctx.createBuffer(1, 1, ctx.sampleRate), src = ctx.createBufferSource();
        src.buffer = b; src.connect(ctx.destination); src.start(0);
      }
    } catch (e) { lastError = e.message || String(e); }
  },
  // for the title screen's sound note: is sound allowed, and did anything go wrong?
  status() { return { state: ctx ? ctx.state : "none", error: lastError }; },
  pause() { this.ancientMusic(null); if (ctx && ctx.state === "running") ctx.suspend(); },
  stop() { this.ancientMusic(null); calmScore?.dispose(); calmScore = null; menuTheme?.dispose(); menuTheme = null; bossScore?.dispose(); bossScore = null; if (ctx) { this.wind(0); ctx.close(); ctx = null; master = null; } },
  setVolume(v) { volume = v; if (master) master.gain.value = muted ? 0 : v * 0.5;
    if (muted || volume <= 0) this.ancientMusic(null); },
  // Background music (calm-score.js). on = the game says music fits right now.
  setMusicVolume(v) { musicLevel = v; calmScore?.setLevel(v); menuTheme?.setLevel(v); bossScore?.setLevel(v); },
  // true while a boss bar is up: monsters nearby growl louder and more often (entities.js)
  bossFight: false,
  // the title-screen theme (epic-score.js); on = we're on the menus with no world open
  menuMusic(on) { if (musicBroken) return; try { this._menu(on); } catch (e) { lastError = e.message || String(e); try { menuTheme?.dispose(); } catch (_) { /* already gone */ } menuTheme = null; musicBroken = true; } },
  _menu(on) {
    if (!ctx || ctx.state !== "running") return;
    const allowed = on && !muted && volume > 0 && musicLevel > 0;
    if (!menuTheme) { if (!allowed) return; menuTheme = createMenuTheme(ctx, master); menuTheme.setLevel(musicLevel); }
    menuTheme.update(allowed);
  },
  running() { return !!ctx && ctx.state === "running"; },
  menuMusicReview() { return menuTheme ? menuTheme.review() : { on: false, context: ctx?.state || "closed" }; },
  // boss battle music; frac = the boss's health left (0-1). The Buried King keeps its own score.
  bossMusic(on, frac = 1) { this.bossFight = !!on; if (musicBroken) return; try { this._boss(on, frac); } catch (e) { lastError = e.message || String(e); bossScore = null; musicBroken = true; } },
  _boss(on, frac) {
    if (!ctx || ctx.state !== "running") return;
    const allowed = on && !muted && volume > 0 && musicLevel > 0 && !ancientScore;
    if (!bossScore) { if (!allowed) return; bossScore = createBossScore(ctx, master); bossScore.setLevel(musicLevel); }
    bossScore.update(allowed, { frac });
  },
  bossMusicEnd() { this.bossFight = false; bossScore?.dispose(); bossScore = null; },
  bossMusicReview() { return bossScore ? bossScore.review() : { on: false, context: ctx?.state || "closed" }; },
  calmMusic(on) { if (musicBroken) return; try { this._calm(on); } catch (e) { lastError = e.message || String(e); calmScore = null; musicBroken = true; } },
  _calm(on) {
    if (!ctx || ctx.state !== "running") return;
    const allowed = on && !muted && volume > 0 && musicLevel > 0 && !ancientScore;
    if (!calmScore) { if (!allowed) return; calmScore = createCalmScore(ctx, master); calmScore.setLevel(musicLevel); }
    calmScore.update(allowed);
  },
  calmMusicEnd() { calmScore?.dispose(); calmScore = null; },   // leaving a world
  calmMusicNow() { if (!calmScore && ctx) { calmScore = createCalmScore(ctx, master); calmScore.setLevel(musicLevel); } calmScore?.playNow(); },
  calmMusicReview() { return calmScore ? calmScore.review() : { playing: false, context: ctx?.state || "closed" }; },
  setMuted(m) { muted = m; this.setVolume(volume); },

  ancientMusic(state) {
    if (!state || muted || volume <= 0) {
      ancientScore?.dispose(); ancientScore = null; ancientMusicState = null; return;
    }
    if (!ctx || ctx.state !== "running") return;
    ancientScore ||= createAncientScore(ctx, master);
    ancientScore.update(state);
    ancientMusicState = { ...state };
  },
  ancientMusicReview() { return { active: !!ancientScore, voices: ancientScore?.voiceCount || 0,
    context: ctx?.state || "closed", ...ancientMusicState }; },

  wind(stage) {
    if (!ctx) return;
    if (!stage) {
      if (!wind) return;
      wind.source.stop();
      wind.source.disconnect();
      wind.filter.disconnect();
      wind.gain.disconnect();
      wind = null;
      return;
    }
    if (ctx.state !== "running" || wind?.stage === stage) return;
    if (!wind) {
      const source = ctx.createBufferSource(), filter = ctx.createBiquadFilter(), gain = ctx.createGain();
      source.buffer = noiseBuf; source.loop = true;
      filter.type = "bandpass"; filter.Q.value = 0.65;
      gain.gain.value = 0;
      source.connect(filter); filter.connect(gain); gain.connect(master);
      source.start();
      wind = { source, filter, gain };
    }
    wind.stage = stage;
    wind.filter.frequency.setTargetAtTime(220 + stage * 130, ctx.currentTime, 0.18);
    wind.gain.gain.setTargetAtTime(0.025 + stage * 0.024, ctx.currentTime, 0.18);
  },

  // Milestone 19: rain on the ground around you (level 0-1). Indoors it sounds muffled.
  rain(level, muffled = false) {
    if (!ctx) return;
    if (level < 0.02) {
      if (!rainLoop) return;
      rainLoop.gain.gain.setTargetAtTime(0, ctx.currentTime, 0.3);
      const old = rainLoop; rainLoop = null;
      setTimeout(() => { try { old.source.stop(); old.source.disconnect(); old.filter.disconnect(); old.gain.disconnect(); } catch (e) { /* already stopped */ } }, 1500);
      return;
    }
    if (ctx.state !== "running") return;
    if (!rainLoop) {
      const source = ctx.createBufferSource(), filter = ctx.createBiquadFilter(), gain = ctx.createGain();
      source.buffer = noiseBuf; source.loop = true; source.playbackRate.value = 0.9;
      filter.type = "lowpass"; filter.Q.value = 0.4; filter.frequency.value = 3000;
      gain.gain.value = 0;
      source.connect(filter); filter.connect(gain); gain.connect(master);
      source.start();
      rainLoop = { source, filter, gain };
    }
    rainLoop.filter.frequency.setTargetAtTime(muffled ? 700 : 3200, ctx.currentTime, 0.25);
    rainLoop.gain.gain.setTargetAtTime(level * (muffled ? 0.05 : 0.085), ctx.currentTime, 0.25);
  },
  // a thunderclap: close ones crack first, far ones only rumble
  thunder(dist = 60) {
    const k = Math.max(0.25, 1 - dist / 220), delay = Math.min(2500, dist * 8);
    setTimeout(() => {
      if (dist < 40) this.noise(1800, 0.35, 0.5 * k, 0.5, "highpass");
      this.noise(70, 3.2, 0.9 * k, 0.6, "lowpass");
      setTimeout(() => this.noise(140, 2.4, 0.55 * k, 0.6, "lowpass"), 220);
    }, delay);
  },

  noise(freq, dur, gain = 0.5, q = 1, type = "bandpass") {
    if (!ctx || ctx.state !== "running") return;
    const src = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain(), t = ctx.currentTime;
    src.buffer = noiseBuf; src.playbackRate.value = 0.8 + Math.random() * 0.4;
    f.type = type; f.frequency.value = freq; f.Q.value = q;
    g.gain.setValueAtTime(gain, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    src.connect(f); f.connect(g); g.connect(master); src.start(t, Math.random() * 0.5); src.stop(t + dur + 0.02);
  },
  tone(freq, dur, type = "sine", gain = 0.2, slide = 0) {
    if (!ctx || ctx.state !== "running") return;
    const o = ctx.createOscillator(), g = ctx.createGain(), t = ctx.currentTime;
    o.type = type; o.frequency.setValueAtTime(freq, t); if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, freq + slide), t + dur);
    g.gain.setValueAtTime(gain, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(g); g.connect(master); o.start(t); o.stop(t + dur + 0.02);
  },
  leviathanWarning(family, strength) {
    if (!ctx || ctx.state !== "running" || muted || volume <= 0 || !Number.isFinite(strength) || strength <= 0) return;
    const gain = Math.min(1, strength);
    if (family === "dune") {
      this.noise(1350, .34, .21 * gain, .8, "bandpass");
      this.tone(214, .34, "triangle", .12 * gain, -106);
    } else if (family === "obsidian") {
      this.tone(312, .30, "triangle", .13 * gain, -42);
      this.tone(935, .24, "sine", .07 * gain, -90);
      this.noise(2250, .13, .08 * gain, 2);
    } else if (family === "ancient") {
      this.tone(247, .43, "sine", .17 * gain, 32);
      this.tone(370, .39, "triangle", .09 * gain, 48);
      this.tone(587, .23, "sine", .05 * gain);
    }
  },
  // material: "stone" | "wood" | "soft" | "sand" | "leaf" | "glass"
  dig(mat) { const f = { stone: 1800, wood: 700, soft: 380, sand: 1200, leaf: 2600, glass: 3000 }[mat] || 900; this.noise(f, 0.08, 0.35, 2); },
  breakBlock(mat) { const f = { stone: 1400, wood: 550, soft: 300, sand: 1000, leaf: 2200, glass: 3200 }[mat] || 800; this.noise(f, 0.22, 0.6, 1.2); if (mat === "glass") this.tone(2400, 0.15, "triangle", 0.08, 800); },
  place(mat) { this.dig(mat); this.tone(140, 0.06, "sine", 0.15); },
  step(mat) { this.noise(({ stone: 1300, wood: 600, sand: 900, leaf: 2000 }[mat]) || 420, 0.06, 0.12, 1.5); },
  pickup() { this.tone(880, 0.07, "triangle", 0.1, 400); },
  craft() { this.tone(523, 0.1, "triangle", 0.12); setTimeout(() => this.tone(784, 0.14, "triangle", 0.12), 70); },
  click() { this.tone(660, 0.04, "square", 0.05); },
  error() { this.tone(180, 0.15, "square", 0.08, -60); },
  hurt() { this.tone(300, 0.2, "sawtooth", 0.12, -180); this.noise(500, 0.15, 0.25); },
  eat() { for (let i = 0; i < 3; i++) setTimeout(() => this.noise(900, 0.06, 0.3, 3), i * 110); },
  splash() { this.noise(700, 0.35, 0.4, 0.6, "lowpass"); },
  // Lifeward Totem: a rising shimmer with a bright chord
  totem() { this.noise(3000, 0.6, 0.3, 0.8, "highpass"); [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => this.tone(f, 0.5, "triangle", 0.12, 200), i * 90)); },
  door(open) { this.tone(open ? 220 : 180, 0.12, "triangle", 0.12, open ? 60 : -40); this.noise(500, 0.1, 0.2); },
  // Ultra Hardcore uses short synthesized cues routed through the normal sound settings.
  ultraCue(event) {
    if (!ctx || ctx.state !== "running" || muted) return;
    if (event === "victory" || event === "reward") {
      const notes = event === "victory" ? [196, 294, 392, 494, 587, 784] : [392, 523, 659];
      notes.forEach((f, i) => setTimeout(() => this.tone(f, event === "victory" ? .9 : .45, "triangle", .10), 145 * i));
      return;
    }
    const ambience = event === "ambience";
    this.tone(ambience ? 44 : 57, ambience ? 4.5 : 2.4, "sine", ambience ? .10 : .26, -13);
    this.tone(event === "hunt" ? 102 : 81, 1.9, "triangle", ambience ? .035 : .10, -35);
    if (!ambience) this.noise(145, 2.5, .22, .8, "lowpass");
  },
  // creature sounds, quieter the farther away they are
  mob(kind, dist = 0) {
    const k = Math.max(0, 1 - dist / 28);
    if (k <= 0.02 || !ctx || ctx.state !== "running") return;
    const g = (x) => x * k, r = () => 0.85 + Math.random() * 0.3;
    switch (kind) {
      case "groan": this.tone(110 * r(), 0.6, "sawtooth", g(0.08), -40); break;
      case "rattle": for (let i = 0; i < 4; i++) setTimeout(() => this.noise(2400, 0.04, g(0.25), 6), i * 60); break;
      case "clank": this.tone(520 * r(), 0.09, "square", g(0.07)); this.tone(1310 * r(), 0.06, "triangle", g(0.05)); this.noise(3000, 0.05, g(0.12), 4); break;   // armor and shields (desert guardians, the Fallen Castellan)
      case "hiss": case "fuse": this.noise(5000, kind === "fuse" ? 1.4 : 0.5, g(0.3), 0.7, "highpass"); break;
      case "chitter": for (let i = 0; i < 3; i++) setTimeout(() => this.tone(900 * r(), 0.05, "square", g(0.05), 300), i * 50); break;
      case "squish": this.tone(160 * r(), 0.18, "sine", g(0.2), 120); this.noise(600, 0.12, g(0.2), 2); break;
      case "warble": this.tone(300, 0.5, "sine", g(0.06), -200); break;
      case "laser": this.tone(320, 0.35, "sawtooth", g(0.06), 900); this.tone(640, 0.3, "sine", g(0.05), 1200); break;   // Milestone 17: a Guardian fires
      case "trident": this.noise(2200, 0.28, g(0.22), 1.2, "highpass"); this.tone(500, 0.12, "triangle", g(0.05), -150); break;
      case "conduit": [392, 523, 659, 784].forEach((f, i) => setTimeout(() => this.tone(f, 0.5, "sine", g(0.07)), i * 120)); break;
      case "scream": this.tone(700, 0.6, "sawtooth", g(0.08), -400); this.tone(740, 0.6, "square", g(0.04), -420); break;
      case "teleport": this.tone(500, 0.25, "sine", g(0.1), 900); break;
      case "moo": this.tone(130 * r(), 0.7, "sawtooth", g(0.07), 30); break;
      case "baa": this.tone(380 * r(), 0.45, "square", g(0.05), -60); break;
      case "oink": this.tone(220 * r(), 0.18, "square", g(0.07), -80); setTimeout(() => this.tone(200, 0.14, "square", g(0.06), -60), 140); break;
      case "cluck": this.tone(700 * r(), 0.08, "square", g(0.05), -200); break;
      case "squeak": this.tone(1500 * r(), 0.08, "sine", g(0.06), 300); break;
      case "hurt": this.tone(240 * r(), 0.18, "sawtooth", g(0.1), -100); break;
      case "bow": this.noise(1400, 0.15, g(0.3), 1.5); this.tone(300, 0.1, "triangle", g(0.08), 200); break;
      case "arrowhit": this.noise(800, 0.08, g(0.25), 2); break;
      case "flare": this.noise(300, 0.4, g(0.25), 0.8, "lowpass"); this.tone(90, 0.3, "sawtooth", g(0.05)); break;
      case "wail": this.tone(520 * r(), 1.2, "sine", g(0.12), -260); this.tone(780 * r(), 1.0, "sine", g(0.05), -300); break;
      case "snort": this.noise(700, 0.15, g(0.3), 3); this.tone(150, 0.12, "square", g(0.05), -40); break;
      case "grunt": this.tone(120 * r(), 0.3, "sawtooth", g(0.07), -30); break;
      case "chirp": this.tone(1100 * r(), 0.1, "triangle", g(0.05), 400); break;
      case "bark": this.tone(330 * r(), 0.09, "square", g(0.07), -120); setTimeout(() => this.tone(300 * r(), 0.08, "square", g(0.06), -100), 120); break;
      case "meow": this.tone(600 * r(), 0.35, "triangle", g(0.06), 250); break;
      case "neigh": this.tone(500 * r(), 0.6, "sawtooth", g(0.05), -250); this.noise(900, 0.3, g(0.12), 2); break;
      case "fireshoot": this.noise(900, 0.3, g(0.35), 0.8); break;
      case "portal": this.tone(200, 2.5, "sine", g(0.08), 300); this.noise(1200, 2, g(0.06), 0.5); break;
      case "rumble": this.noise(80, 3, g(0.18), 0.5, "lowpass"); break;
      case "roar":
        this.noise(180, 1.15, g(.22), .7, "lowpass");
        this.tone(95 * r(), .95, "sawtooth", g(.055), -45);
        this.tone(142, .8, "triangle", g(.07), -60);
        break;
      case "grizzly":
        this.noise(310, 0.95, g(0.28), 0.9, "lowpass");
        this.tone(118 * r(), 0.85, "sawtooth", g(0.065), -46);
        this.tone(76, 0.75, "triangle", g(0.09), -21);
        break;
      case "ostrichalarm":
        this.noise(1170, 0.23, g(0.13), 1.4, "bandpass");
        this.tone(420 * r(), 0.28, "triangle", g(0.09), -160);
        break;
      case "ostrichboom":
        this.tone(140 * r(), 0.39, "triangle", g(0.14), -66);
        this.noise(280, 0.32, g(0.065), 1.1, "lowpass");
        break;
      case "giraffebrowse":
        this.noise(1280, 0.24, g(0.08), 1.3, "bandpass");
        break;
      case "giraffealarm":
        this.tone(215 * r(), 0.38, "triangle", g(0.11), -110);
        this.noise(720, 0.21, g(0.10), 1.1, "bandpass");
        break;
      case "rhinowarn":
        this.noise(465, 0.54, g(0.22), 1.2, "lowpass");
        this.tone(89 * r(), 0.48, "triangle", g(0.14), -35);
        break;
      case "moosewarn":
        this.tone(187 * r(), 0.79, "triangle", g(0.14), -63);
        this.tone(391, 0.46, "sawtooth", g(0.037), -118);
        this.noise(680, 0.39, g(0.088), 1.2, "lowpass");
        break;
      case "falconcall":
        this.tone(1480 * r(), 0.18, "triangle", g(0.105), -520);
        this.noise(2360, 0.16, g(0.048), 1.9, "bandpass");
        break;
      case "elephanttrumpet":
        this.tone(170 * r(), 0.75, "sawtooth", g(0.09), 180);
        this.tone(340 * r(), 0.62, "triangle", g(0.115), -130);
        this.noise(520, 0.63, g(0.10), 1.1, "bandpass");
        break;
      case "kangaroowarn":
        this.noise(410, 0.33, g(0.11), 1.25, "lowpass");
        this.tone(192 * r(), 0.28, "triangle", g(0.055), -84);
        break;
      case "flamingocall":
        this.tone(291 * r(), 0.46, "triangle", g(0.125), -107);
        this.tone(528 * r(), 0.31, "sawtooth", g(0.042), -80);
        this.noise(880, 0.29, g(0.042), 1.3, "bandpass");
        break;
      case "peacockcall":
        this.tone(690 * r(), 0.31, "sawtooth", g(0.065), 370);
        this.tone(1150 * r(), 0.46, "triangle", g(0.10), -530);
        this.noise(1650, 0.24, g(0.048), 1.6, "bandpass");
        break;
      case "peafowlalarm":
        this.tone(820 * r(), 0.21, "triangle", g(0.08), -310);
        this.noise(1360, 0.18, g(0.063), 1.2, "bandpass");
        break;
      case "koalacall":
        this.noise(430, 0.46, g(0.08), 0.85, "lowpass");
        this.tone(116 * r(), 0.46, "triangle", g(0.053), -36);
        break;
      case "slothcall":
        this.tone(640 * r(), 0.23, "sine", g(0.064), 310);
        this.noise(1810, 0.13, g(0.027), 1.35, "bandpass");
        break;
      case "pandachirp":
        this.tone(1220 * r(), 0.17, "triangle", g(0.055), -390);
        this.noise(1720, 0.1, g(0.05), 1.2, "bandpass");
        break;
      case "tigerwarn":
        this.noise(450, 0.64, g(0.17), 1, "lowpass");
        this.tone(118 * r(), 0.64, "triangle", g(0.10), -57);
        break;
      case "deeralarm":
        this.noise(1100, 0.2, g(0.10), 2.6, "bandpass");
        this.tone(390 * r(), 0.13, "triangle", g(0.05), -155);
        break;
      case "lionroar":
        this.tone(96 * r(), 1.05, "sawtooth", g(0.072), -53);
        this.tone(181, 0.82, "triangle", g(0.055), -93);
        this.noise(245, 1.05, g(0.22), 0.75, "lowpass");
        break;
      case "zebraalarm":
        this.tone(440 * r(), 0.20, "triangle", g(0.12), 190);
        this.tone(670, 0.35, "sawtooth", g(0.038), -310);
        break;
      case "sealcall":
        this.tone(330 * r(), 0.43, "triangle", g(0.12), -140);
        this.noise(830, 0.32, g(0.08), 2.2, "lowpass");
        break;
      case "walruswarn":
        this.tone(128 * r(), 0.64, "sawtooth", g(0.06), -43);
        this.noise(330, 0.7, g(0.16), 1.3, "lowpass");
        break;
      case "coastsplash":
        this.noise(670, 0.36, g(0.13), 0.65, "lowpass");
        break;
      case "octopusink":
        this.noise(560, 0.28, g(0.18), 0.5, "lowpass");
        this.tone(280, 0.14, "sine", g(0.06), -160);
        break;
      case "rayglide":
        this.noise(340, 0.58, g(0.11), 0.75, "lowpass");
        break;
      case "croclunge":
        this.noise(410, 0.31, g(0.22), 0.9, "lowpass");
        this.tone(74 * r(), 0.26, "sawtooth", g(0.05), -24);
        break;
      case "hippowarn":
        this.tone(106 * r(), 0.69, "triangle", g(0.13), -54);
        this.tone(210, 0.41, "sawtooth", g(0.042), -91);
        this.noise(380, 0.63, g(0.12), 1.7, "lowpass");
        break;
      case "whalesong":
        this.tone(52 * r(), 2.9, "sine", g(0.15), 18);
        this.tone(111, 2.2, "triangle", g(0.07), -29);
        this.tone(208, 1.7, "sine", g(0.035), -84);
        break;
      case "whalebreath":
        this.noise(570, 0.95, g(0.24), 0.85, "lowpass");
        break;
      case "orcacall":
        this.tone(790 * r(), 0.52, "sine", g(0.07), 630);
        this.tone(1770, 0.19, "triangle", g(0.035), -410);
        break;
      case "sharkrush":
        this.noise(340, 0.6, g(0.19), 0.65, "lowpass");
        this.tone(95, 0.32, "sine", g(0.065), -45);
        break;
      case "eagle":
        this.tone(1700 * r(), 0.22, "triangle", g(0.052), -620);
        this.tone(2850 * r(), 0.16, "sine", g(0.032), -900);
        break;
      case "blub": this.tone(260 * r(), 0.09, "sine", g(0.08), 220); break;
      case "buzz": this.tone(190 * r(), 0.5, "sawtooth", g(0.025), 15); break;
      case "yip": this.tone(900 * r(), 0.08, "triangle", g(0.06), 300); setTimeout(() => this.tone(1000 * r(), 0.07, "triangle", g(0.05), 200), 110); break;
      case "squawk": this.tone(1300 * r(), 0.14, "sawtooth", g(0.04), -500); break;
      case "click": for (let i = 0; i < 5; i++) setTimeout(() => this.tone(2400 * r(), 0.02, "square", g(0.04)), i * 45); this.tone(1800, 0.25, "sine", g(0.04), 900); break;
      case "cast": this.noise(2200, 0.25, g(0.25), 1.2); break;
    }
  },
  explode(dist = 0) { const k = Math.max(0.15, 1 - dist / 60); this.noise(120, 1.2, 0.9 * k, 0.6, "lowpass"); this.noise(500, 0.5, 0.5 * k, 0.8); this.tone(60, 0.8, "sine", 0.4 * k, -30); },
  // Sparkworks: lever/button/plate clicks, a burnt-out torch's fizz, and note block instruments
  switchClick(on, dist = 0, plate) {
    const k = Math.max(0, 1 - dist / 16); if (k <= 0.02) return;
    if (plate) { this.tone(on ? 140 : 110, 0.06, "square", 0.05 * k, -30); this.noise(on ? 900 : 700, 0.05, 0.15 * k, 3); return; }
    this.tone(on ? 900 : 700, 0.03, "square", 0.06 * k); this.noise(on ? 2600 : 2000, 0.04, 0.2 * k, 4);
  },
  piston(out, dist = 0) { const k = Math.max(0, 1 - dist / 20); if (k <= 0.02) return; this.noise(out ? 900 : 700, 0.18, 0.35 * k, 1.2); this.tone(out ? 120 : 95, 0.14, "square", 0.06 * k, out ? 40 : -30); },
  bell(dist = 0) {
    const k = Math.max(0, 1 - dist / 64);
    if (k <= 0.02 || !ctx || ctx.state !== "running") return;
    for (const [f, d, gn] of [[660, 2.6, 0.16], [1650, 1.6, 0.07], [2640, 1.0, 0.04], [990, 2.2, 0.06]]) this.tone(f, d, "sine", gn * k);
  },
  hush(dist = 0) { const k = Math.max(0, 1 - dist / 16); if (k <= 0.02) return; for (let i = 0; i < 3; i++) setTimeout(() => this.tone(1900 + i * 240, 0.05, "triangle", 0.04 * k), i * 40); },
  fizz(dist = 0) { const k = Math.max(0, 1 - dist / 16); if (k > 0.02) this.noise(4000, 0.35, 0.25 * k, 0.6, "highpass"); },
  // pitch 0-24 is F♯3 to F♯5 on the harp (Minecraft's two-octave range); other instruments shift octaves
  note(inst, pitch, dist = 0) {
    const k = Math.max(0, 1 - dist / 48);
    if (k <= 0.02 || !ctx || ctx.state !== "running") return;
    const oct = { bass: -2, didgeridoo: -2, guitar: -1, flute: 1, cow_bell: 1, bell: 2, chime: 2, xylophone: 2 }[inst] || 0;
    const f = 185 * Math.pow(2, pitch / 12 + oct), t = ctx.currentTime;
    if (inst === "basedrum") { this.tone(70 + pitch * 2, 0.25, "sine", 0.35 * k, -40); this.noise(150, 0.08, 0.3 * k, 1, "lowpass"); return; }
    if (inst === "snare") { this.noise(1800 + pitch * 40, 0.14, 0.4 * k, 0.8); this.tone(180, 0.06, "triangle", 0.1 * k); return; }
    if (inst === "hat") { this.noise(7000 + pitch * 100, 0.05, 0.3 * k, 1, "highpass"); return; }
    const voice = (freq, type, dur, gain, attack = 0.005) => {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = type; o.frequency.value = freq;
      g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(gain * k, t + attack); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g); g.connect(master); o.start(t); o.stop(t + dur + 0.05);
    };
    switch (inst) {
      case "bass": voice(f, "triangle", 0.5, 0.35); voice(f * 2, "sine", 0.3, 0.1); break;
      case "didgeridoo": voice(f, "sawtooth", 0.9, 0.12, 0.05); voice(f * 1.5, "sine", 0.9, 0.05, 0.05); break;
      case "guitar": voice(f, "sawtooth", 0.6, 0.08); voice(f * 2, "triangle", 0.4, 0.06); break;
      case "flute": voice(f, "sine", 0.7, 0.2, 0.06); voice(f * 2, "sine", 0.5, 0.03, 0.06); break;
      case "cow_bell": voice(f, "square", 0.3, 0.06); voice(f * 1.48, "square", 0.25, 0.05); break;
      case "bell": voice(f, "sine", 1.4, 0.18); voice(f * 2.76, "sine", 0.8, 0.06); voice(f * 5.4, "sine", 0.4, 0.03); break;
      case "chime": voice(f, "sine", 1.6, 0.14); voice(f * 3.01, "sine", 1.0, 0.06); break;
      case "xylophone": voice(f, "sine", 0.35, 0.22); voice(f * 3.9, "sine", 0.12, 0.08); break;
      case "iron_xylophone": voice(f, "triangle", 0.6, 0.18); voice(f * 4, "sine", 0.3, 0.05); break;
      case "bit": voice(f, "square", 0.35, 0.08); break;
      case "banjo": voice(f, "sawtooth", 0.35, 0.09); voice(f * 2, "square", 0.2, 0.04); break;
      case "pling": voice(f, "sine", 0.9, 0.18); voice(f * 2, "triangle", 0.6, 0.07); break;
      default: voice(f, "triangle", 0.8, 0.2); voice(f * 2, "sine", 0.5, 0.05);   // harp
    }
  },
  // a minecart rolling onto the next rail: a short clack, louder and higher the faster it goes
  railClack(speed, dist = 0) {
    const k = Math.max(0, 1 - dist / 20), s = Math.min(1, speed / 8);
    if (k <= 0.02) return;
    this.noise(260 + s * 260, 0.08, (0.06 + 0.12 * s) * k, 2.5);
    this.tone(90 + s * 40, 0.05, "triangle", 0.04 * k);
  },
  levelUp() { [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => this.tone(f, 0.15, "triangle", 0.1), i * 80)); },
  xp() { this.tone(1200 + Math.random() * 600, 0.06, "sine", 0.05); },
  // Milestone 15: enchanting sounds (all made from tones and noise, like the rest)
  enchant() { [784, 988, 1175, 1568, 1976].forEach((f, i) => setTimeout(() => { this.tone(f, 0.5, "sine", 0.06); this.tone(f * 1.5, 0.35, "sine", 0.025); }, i * 70)); this.noise(5000, 0.9, 0.12, 0.7, "highpass"); },
  pageTurn() { this.noise(2400, 0.12, 0.18, 0.8); setTimeout(() => this.noise(3200, 0.08, 0.12, 0.8), 90); },
  anvil(broke) {
    if (broke) { this.noise(300, 0.6, 0.6, 0.7, "lowpass"); this.tone(220, 0.5, "square", 0.08, -120); return; }
    this.tone(1250, 0.35, "square", 0.05, -30); this.tone(1870, 0.5, "sine", 0.06); this.tone(2650, 0.3, "sine", 0.03); this.noise(2500, 0.06, 0.35, 2);
  },
  grind() { for (let i = 0; i < 4; i++) setTimeout(() => this.noise(600 + i * 150, 0.18, 0.25, 0.9), i * 120); this.tone(110, 0.6, "sawtooth", 0.03); },
  frost() { const now = performance.now(); if (now - (this.frostAt || 0) < 300) return; this.frostAt = now; this.noise(4500, 0.07, 0.06, 2, "highpass"); },
  // Milestone 16: a brew finishing (bubbles and a soft chime), and drinking
  potionBreak(dist = 0) { const k = Math.max(0, 1 - dist / 24); if (k <= 0.02) return; this.noise(3800, 0.18, 0.35 * k, 1.2, "highpass"); this.tone(1600, 0.12, "triangle", 0.05 * k, -400); setTimeout(() => this.noise(2400, 0.25, 0.15 * k, 0.8), 60); },
  gulp() { this.tone(220 + Math.random() * 60, 0.12, "sine", 0.08, -90); this.noise(500, 0.08, 0.12, 2, "lowpass"); },
  brewDone() { for (let i = 0; i < 5; i++) setTimeout(() => this.tone(300 + Math.random() * 400, 0.08, "sine", 0.05, 200), i * 70); setTimeout(() => this.tone(1320, 0.3, "sine", 0.04), 380); }
};
