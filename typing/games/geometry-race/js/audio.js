/* =========================================================
   Geometry Race — music and sound effects
   All sound is made live with the Web Audio API (no music files).
   Each level has its own original song built from 16-step patterns.
   The song follows the GAME clock: restarting, pausing, or
   respawning at a checkpoint restarts the song from that exact
   moment, so music and obstacles can never drift apart.
   ========================================================= */
(function () {
  "use strict";
  const GR = window.GR = window.GR || {};

  const SCALES = { major: [0, 2, 4, 5, 7, 9, 11], minor: [0, 2, 3, 5, 7, 8, 10], dorian: [0, 2, 3, 5, 7, 9, 10], mixo: [0, 2, 4, 5, 7, 9, 10] };
  function freq(m) { return 440 * Math.pow(2, (m - 69) / 12); }

  // Drum and bass patterns (16 steps = one bar).
  const KICK = { four: "x...x...x...x...", half: "x.......x.......", drive: "x..x..x.x..x..x.", break: "x.........x.....", gallop: "x...x..xx...x..x" };
  const SNARE = { back: "....x.......x...", busy: "....x..x....x.x.", clap: "....x.......x..x" };
  const HAT = { off: "..x...x...x...x.", eighth: "x.x.x.x.x.x.x.x.", sixteen: "xxxxxxxxxxxxxxxx", shuffle: "x.xx.xx.x.xx.xxx" };
  // Bass: scale-degree offsets from the chord root (null = rest). 7 = octave up.
  const _ = null;
  const BASS = {
    whole: [0, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
    root8: [0, _, 0, _, 0, _, 0, _, 0, _, 0, _, 0, _, 0, _],
    octave: [0, _, 7, _, 0, _, 7, _, 0, _, 7, _, 0, _, 7, _],
    synco: [0, _, _, 0, _, _, 0, _, _, 0, _, _, 4, _, 7, _],
    walk: [0, _, 0, 2, _, 2, 4, _, 4, _, 2, _, 0, _, 4, _],
    pump: [0, 0, _, 0, 0, _, 0, 0, _, 0, 0, _, 0, _, 4, _]
  };
  const ARP = { up: [0, 1, 2, 3], updown: [0, 1, 2, 3, 2, 1], skip: [0, 2, 1, 3], low: [0, 1, 2] };

  // Lead melodies: 32 steps (two bars). Digits/letters are scale degrees above the root
  // (0-9, then a=10, b=11 ...); "." = rest, "-" = hold.
  // Sections: k kick, s snare, h hat, b bass, a arp, l lead (true/false), p pad, fill (drum roll into the next section)
  const SONGS = {
    menu: {
      root: 57, scale: "dorian", prog: [0, 3, 5, 4],
      lead: "4-.-2-.-0---.-.-5-.-4-.-2---1-0-",
      sections: { main: { k: "half", h: "off", b: "whole", a: "updown", p: true } }
    },
    flight: {
      root: 62, scale: "major", prog: [0, 4, 5, 3],
      lead: "4-4-5-4-2---0-2-4---7-5-4---2---",
      sections: {
        intro: { h: "off", b: "whole", a: "up", p: true },
        main: { k: "four", s: "back", h: "off", b: "root8", a: "up", p: true },
        drop: { k: "four", s: "back", h: "eighth", b: "octave", a: "updown", l: true, p: true },
        outro: { k: "half", h: "off", b: "whole", a: "up", l: true, p: true }
      }
    },
    neon: {
      root: 53, scale: "minor", prog: [0, 5, 2, 6],
      lead: "7-.-7-9-a-9-7-.-4-.-5-7---.-4-5",
      sections: {
        intro: { k: "half", h: "off", b: "whole", a: "skip", p: true },
        main: { k: "four", s: "clap", h: "eighth", b: "synco", a: "skip", p: true },
        drop: { k: "four", s: "clap", h: "sixteen", b: "pump", a: "updown", l: true, p: true },
        calm: { k: "break", h: "off", b: "walk", a: "low", l: true, p: true },
        outro: { k: "four", s: "back", h: "eighth", b: "octave", a: "updown", l: true, p: true }
      }
    },
    gravity: {
      root: 52, scale: "dorian", prog: [0, 3, 5, 4],
      lead: "0-2-4-5-7---5-4-.-4-5-4-2-0---.-",
      sections: {
        intro: { k: "half", h: "off", b: "whole", a: "low", p: true },
        main: { k: "four", s: "back", h: "off", b: "walk", a: "skip", p: true },
        drop: { k: "drive", s: "busy", h: "eighth", b: "octave", a: "updown", l: true, p: true },
        calm: { k: "half", h: "shuffle", b: "whole", a: "low", l: true, p: true },
        outro: { k: "four", s: "back", h: "eighth", b: "octave", a: "up", l: true, p: true }
      }
    },
    skyline: {
      root: 55, scale: "mixo", prog: [0, 6, 3, 4],
      lead: "7-.-9-7-4---2-4-.-7-.-9-b-9-7-4-",
      sections: {
        intro: { k: "half", h: "off", b: "whole", a: "up", p: true },
        main: { k: "four", s: "back", h: "eighth", b: "root8", a: "up", p: true },
        drop: { k: "four", s: "clap", h: "sixteen", b: "octave", a: "updown", l: true, p: true },
        calm: { k: "break", h: "off", b: "walk", a: "skip", l: true, p: true },
        outro: { k: "gallop", s: "back", h: "eighth", b: "pump", a: "updown", l: true, p: true }
      }
    },
    prism: {
      root: 49, scale: "minor", prog: [0, 6, 5, 6],
      lead: "4-4-.-4-6-.-7-6-4-.-3-4---.-.-.-",
      sections: {
        intro: { k: "half", h: "eighth", b: "whole", a: "skip", p: true },
        main: { k: "four", s: "clap", h: "eighth", b: "pump", a: "skip", p: true },
        drop: { k: "drive", s: "busy", h: "sixteen", b: "octave", a: "updown", l: true, p: true },
        calm: { k: "break", h: "shuffle", b: "whole", a: "low", l: true, p: true },
        outro: { k: "four", s: "busy", h: "sixteen", b: "pump", a: "updown", l: true, p: true }
      }
    },
    velocity: {
      root: 57, scale: "minor", prog: [0, 5, 6, 4],
      lead: "7-7-9-a-9-7-5-4-5---4-2-4---0-2-",
      sections: {
        intro: { k: "four", h: "eighth", b: "root8", a: "skip", p: true },
        main: { k: "four", s: "back", h: "sixteen", b: "pump", a: "updown", p: true },
        drop: { k: "gallop", s: "busy", h: "sixteen", b: "octave", a: "updown", l: true, p: true },
        calm: { k: "half", h: "shuffle", b: "walk", a: "low", l: true, p: true },
        outro: { k: "drive", s: "busy", h: "sixteen", b: "pump", a: "updown", l: true, p: true }
      }
    }
  };

  function Sound() {
    this.ctx = null; this.vol = { music: 0.7, sfx: 0.8, muted: false };
    this.song = null; this.bus = null; this.menu = false;
  }

  Sound.prototype.init = function () {
    if (this.ctx) return true;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return false;
    try { this.ctx = new AC(); } catch (e) { return false; }
    const c = this.ctx;
    this.master = c.createGain();
    const comp = c.createDynamicsCompressor();
    comp.threshold.value = -14; comp.ratio.value = 4;
    this.master.connect(comp); comp.connect(c.destination);
    this.musicGain = c.createGain(); this.musicGain.connect(this.master);
    this.sfxGain = c.createGain(); this.sfxGain.connect(this.master);
    const len = c.sampleRate;
    this.noise = c.createBuffer(1, len, c.sampleRate);
    const d = this.noise.getChannelData(0);
    let seed = 12345;
    for (let i = 0; i < len; i++) { seed = (seed * 1103515245 + 12345) & 0x7fffffff; d[i] = seed / 0x3fffffff - 1; }
    this.apply();
    return true;
  };
  // Must be called from a click/tap/key handler (browsers only allow sound after a user gesture).
  Sound.prototype.unlock = function () {
    if (!this.init()) return;
    if (this.ctx.state === "suspended") this.ctx.resume();
  };
  Sound.prototype.setVolumes = function (music, sfx, muted) {
    this.vol.music = music; this.vol.sfx = sfx; this.vol.muted = muted;
    this.apply();
  };
  Sound.prototype.apply = function () {
    if (!this.ctx) return;
    const t = this.ctx.currentTime, m = this.vol.muted ? 0 : 1;
    this.musicGain.gain.setTargetAtTime(this.vol.music * this.vol.music * 0.55 * m, t, 0.02);
    this.sfxGain.gain.setTargetAtTime(this.vol.sfx * this.vol.sfx * 0.7 * m, t, 0.02);
  };
  Sound.prototype.suspend = function () { if (this.ctx && this.ctx.state === "running") this.ctx.suspend(); };
  Sound.prototype.resume = function () { if (this.ctx && this.ctx.state === "suspended") this.ctx.resume(); };

  // ---------- song player ----------
  // sections: [[bar, name], ...]  from: song time in seconds
  Sound.prototype.playSong = function (id, bpm, sections, from) {
    this.stopSong();
    if (!this.ctx) return;
    const def = SONGS[id];
    if (!def) return;
    this.bus = this.ctx.createGain();
    this.bus.connect(this.musicGain);
    const stepDur = 60 / bpm / 4;
    this.song = { def: def, bpm: bpm, sections: sections, stepDur: stepDur, step: Math.max(0, Math.ceil(from / stepDur - 1e-6)) };
  };
  Sound.prototype.stopSong = function () {
    if (this.bus && this.ctx) {
      const b = this.bus, t = this.ctx.currentTime;
      b.gain.cancelScheduledValues(t); b.gain.setValueAtTime(b.gain.value, t); b.gain.linearRampToValueAtTime(0, t + 0.06);
      setTimeout(function () { try { b.disconnect(); } catch (e) { /* already gone */ } }, 400);
    }
    this.bus = null; this.song = null; this.menu = false;
  };
  Sound.prototype.playMenu = function () {
    if (!this.ctx || this.menu) return;
    this.playSong("menu", 100, [[0, "main"]], 0);
    this.menu = true; this.menuStart = this.ctx.currentTime + 0.05;
  };
  // Call every frame with the song position (seconds). Schedules a little ahead.
  Sound.prototype.update = function (songTime) {
    const sg = this.song;
    if (!sg || !this.ctx || this.ctx.state !== "running") return;
    if (this.menu) songTime = this.ctx.currentTime - this.menuStart;
    const now = this.ctx.currentTime, ahead = 0.14;
    let guard = 0;
    while (sg.step * sg.stepDur < songTime + ahead && guard++ < 64) {
      const when = now + (sg.step * sg.stepDur - songTime);
      if (when >= now - 0.03) this.scheduleStep(sg, sg.step, Math.max(now, when));
      sg.step++;
    }
  };
  Sound.prototype.sectionAt = function (sg, bar) {
    let name = sg.sections[0][1], next = null;
    for (let i = 0; i < sg.sections.length; i++) {
      if (sg.sections[i][0] <= bar) name = sg.sections[i][1];
      else { next = sg.sections[i]; break; }
    }
    return { pat: sg.def.sections[name] || sg.def.sections.main || {}, fill: next && next[0] === bar + 1 };
  };
  Sound.prototype.scheduleStep = function (sg, step, when) {
    const def = sg.def, bar = Math.floor(step / 16), s = step % 16;
    const sec = this.sectionAt(sg, bar), p = sec.pat, sc = SCALES[def.scale];
    const deg = def.prog[bar % def.prog.length];
    function note(d, oct) { const k = ((d % 7) + 7) % 7; return def.root + sc[k] + 12 * (Math.floor(d / 7) + (oct || 0)); }
    if (p.k && KICK[p.k][s] === "x") this.kick(when);
    if (p.s && SNARE[p.s][s] === "x") this.snare(when, 0.5);
    if (sec.fill && s >= 8 && s % 2 === 0) this.snare(when, 0.22 + (s - 8) * 0.04);
    if (p.h && HAT[p.h][s] === "x") this.hat(when, s % 4 === 2 ? 0.16 : 0.09);
    if (p.b) { const b = BASS[p.b][s]; if (b != null) this.bass(freq(note(deg + b, -1)), when, sg.stepDur * 1.6); }
    if (p.a) {
      const pat = ARP[p.a], idx = pat[s % pat.length];
      const chord = [note(deg), note(deg + 2), note(deg + 4), note(deg + 7)];
      this.pluck(freq(chord[idx] + 12), when, sg.stepDur * 0.9);
    }
    if (p.l) {
      const ch = def.lead[(bar % 2) * 16 + s];
      if (ch && ch !== "." && ch !== "-") {
        let len = 1;
        while (def.lead[(bar % 2) * 16 + s + len] === "-") len++;
        this.lead(freq(note(parseInt(ch, 36), 1)), when, sg.stepDur * len);
      }
    }
    if (p.p && s === 0) this.pad([note(deg), note(deg + 2), note(deg + 4)].map(freq), when, sg.stepDur * 16);
  };

  // ---------- instruments ----------
  function env(g, t, a, peak, dur) {
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(peak, t + a);
    g.gain.exponentialRampToValueAtTime(0.0001, t + a + dur);
  }
  Sound.prototype.out = function () { return this.bus || this.musicGain; };
  Sound.prototype.kick = function (t) {
    const c = this.ctx, o = c.createOscillator(), g = c.createGain();
    o.frequency.setValueAtTime(140, t); o.frequency.exponentialRampToValueAtTime(42, t + 0.14);
    env(g, t, 0.002, 0.9, 0.24);
    o.connect(g); g.connect(this.out()); o.start(t); o.stop(t + 0.3);
  };
  Sound.prototype.noiseHit = function (t, type, f, q, peak, dur, dest) {
    const c = this.ctx, n = c.createBufferSource(), fl = c.createBiquadFilter(), g = c.createGain();
    n.buffer = this.noise; fl.type = type; fl.frequency.value = f; fl.Q.value = q;
    env(g, t, 0.002, peak, dur);
    n.connect(fl); fl.connect(g); g.connect(dest || this.out());
    n.start(t, Math.random() * 0.5); n.stop(t + dur + 0.05);
  };
  Sound.prototype.snare = function (t, v) {
    this.noiseHit(t, "bandpass", 1900, 0.8, v, 0.16);
    const c = this.ctx, o = c.createOscillator(), g = c.createGain();
    o.type = "triangle"; o.frequency.setValueAtTime(220, t); o.frequency.exponentialRampToValueAtTime(140, t + 0.08);
    env(g, t, 0.002, v * 0.5, 0.09); o.connect(g); g.connect(this.out()); o.start(t); o.stop(t + 0.15);
  };
  Sound.prototype.hat = function (t, v) { this.noiseHit(t, "highpass", 7500, 0.7, v, 0.04); };
  Sound.prototype.bass = function (f, t, d) {
    const c = this.ctx, o = c.createOscillator(), fl = c.createBiquadFilter(), g = c.createGain();
    o.type = "sawtooth"; o.frequency.value = f;
    fl.type = "lowpass"; fl.frequency.setValueAtTime(900, t); fl.frequency.exponentialRampToValueAtTime(220, t + d); fl.Q.value = 4;
    env(g, t, 0.005, 0.32, d);
    o.connect(fl); fl.connect(g); g.connect(this.out()); o.start(t); o.stop(t + d + 0.05);
  };
  Sound.prototype.pluck = function (f, t, d) {
    const c = this.ctx, o = c.createOscillator(), g = c.createGain();
    o.type = "square"; o.frequency.value = f;
    env(g, t, 0.003, 0.05, d);
    o.connect(g); g.connect(this.out()); o.start(t); o.stop(t + d + 0.05);
  };
  Sound.prototype.lead = function (f, t, d) {
    const c = this.ctx, g = c.createGain(), fl = c.createBiquadFilter();
    fl.type = "lowpass"; fl.frequency.value = 3200;
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.12, t + 0.01);
    g.gain.setValueAtTime(0.1, t + Math.max(0.02, d - 0.04)); g.gain.exponentialRampToValueAtTime(0.0001, t + d + 0.08);
    fl.connect(g); g.connect(this.out());
    [-6, 6].forEach(function (det) {
      const o = c.createOscillator(); o.type = "sawtooth"; o.frequency.value = f; o.detune.value = det;
      o.connect(fl); o.start(t); o.stop(t + d + 0.12);
    });
  };
  Sound.prototype.pad = function (fs, t, d) {
    const c = this.ctx, g = c.createGain(), fl = c.createBiquadFilter();
    fl.type = "lowpass"; fl.frequency.value = 1100;
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.05, t + 0.25);
    g.gain.setValueAtTime(0.05, t + d * 0.7); g.gain.linearRampToValueAtTime(0.0001, t + d);
    fl.connect(g); g.connect(this.out());
    fs.forEach(function (f) {
      const o = c.createOscillator(); o.type = "sawtooth"; o.frequency.value = f; o.detune.value = (Math.random() - 0.5) * 14;
      o.connect(fl); o.start(t); o.stop(t + d + 0.05);
    });
  };

  // ---------- sound effects ----------
  Sound.prototype.tone = function (type, f0, f1, dur, peak, delay) {
    const c = this.ctx, t = c.currentTime + (delay || 0), o = c.createOscillator(), g = c.createGain();
    o.type = type; o.frequency.setValueAtTime(f0, t);
    if (f1 !== f0) o.frequency.exponentialRampToValueAtTime(f1, t + dur);
    env(g, t, 0.003, peak, dur);
    o.connect(g); g.connect(this.sfxGain); o.start(t); o.stop(t + dur + 0.05);
  };
  Sound.prototype.sfx = function (name) {
    if (!this.ctx || this.ctx.state !== "running") return;
    const self = this, t = this.ctx.currentTime;
    switch (name) {
      case "jump": this.tone("square", 330, 520, 0.06, 0.05); break;
      case "orb": this.tone("sine", 880, 1320, 0.12, 0.22); this.tone("triangle", 1320, 1760, 0.1, 0.1, 0.03); break;
      case "pad": this.tone("triangle", 260, 900, 0.16, 0.28); break;
      case "portal": this.noiseHit(t, "bandpass", 900, 2, 0.25, 0.22, this.sfxGain); this.tone("sine", 300, 700, 0.2, 0.18); break;
      case "flip": this.tone("sine", 700, 280, 0.14, 0.2); break;
      case "token": [988, 1319, 1976].forEach(function (f, i) { self.tone("square", f, f, 0.09, 0.09, i * 0.06); }); break;
      case "crash":
        this.noiseHit(t, "lowpass", 1600, 0.7, 0.75, 0.38, this.sfxGain);
        this.tone("sine", 160, 38, 0.3, 0.6); break;
      case "menu": this.tone("square", 660, 660, 0.03, 0.06); break;
      case "select": this.tone("square", 660, 990, 0.07, 0.08); break;
      case "back": this.tone("square", 520, 330, 0.07, 0.07); break;
      case "checkpoint": this.tone("sine", 740, 740, 0.08, 0.2); this.tone("sine", 990, 990, 0.12, 0.2, 0.07); break;
      case "nope": this.tone("square", 220, 160, 0.14, 0.1); break;
      case "unlock": [784, 988, 1175, 1568].forEach(function (f, i) { self.tone("triangle", f, f, 0.14, 0.14, i * 0.07); }); break;
      case "finish":
        [523, 659, 784, 1047, 1319, 1568].forEach(function (f, i) { self.tone("square", f, f, 0.16, 0.1, i * 0.08); });
        [523, 659, 784].forEach(function (f) { self.tone("sawtooth", f, f, 0.9, 0.06, 0.5); });
        break;
    }
  };

  GR.Sound = new Sound();
  GR.SONGS = SONGS;
})();
