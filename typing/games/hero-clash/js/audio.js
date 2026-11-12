// Hero Clash: Ultimate Showdown - audio engine.
// Every sound here is synthesized live with the Web Audio API (no audio files),
// so all of it is original. Safe to import anywhere: nothing touches the
// browser until GameAudio.init() runs, and every call is a silent no-op when
// Web Audio is missing or init() has not happened yet.

const MAX_VOICES = 14;        // sfx playing at once before new ones are skipped
const SAME_SFX_GAP = 0.03;    // seconds between two copies of the same sfx
const MUSIC_LEVEL = 0.5;      // music sits under the sfx even at full volume
const LOOKAHEAD = 0.12;       // seconds of music scheduled ahead of the clock
const TICK_MS = 25;
const NOISE_LEN = 2;          // seconds of shared white noise
const PRIORITY = { ko: 1, ultBoom: 1, ultStart: 1, fight: 1, roundEnd: 1, victory: 1 };

let ctx = null;
let master = null, comp = null, musicBus = null, duckGain = null, sfxBus = null, voiceBus = null;
let noiseBuf = null;
let paused = false;
let activeVoices = 0;
const lastPlayed = Object.create(null);
const vols = { music: 0.6, sfx: 0.8, voice: 0.8, mute: false };

// "cur" is where the helper functions tone()/noise() send their sound.
let cur = { t: 0, pitch: 1, dest: null, end: 0 };

const clamp01 = (v, d) => (typeof v === 'number' && isFinite(v) ? Math.min(1, Math.max(0, v)) : d);
const clampF = (f) => Math.min(16000, Math.max(20, f));
const rnd = (a, b) => a + Math.random() * (b - a);
const midiHz = (m) => 440 * Math.pow(2, (m - 69) / 12);

function synth() {
  try { return typeof window !== 'undefined' && window.speechSynthesis ? window.speechSynthesis : null; }
  catch (e) { return null; }
}

function wake() {
  if (ctx && !paused && ctx.state === 'suspended') {
    try { const p = ctx.resume(); if (p && p.catch) p.catch(() => {}); } catch (e) { /* ignore */ }
  }
}

function applyVolumes() {
  if (!ctx) return;
  const t = ctx.currentTime;
  master.gain.setTargetAtTime(vols.mute ? 0 : 1, t, 0.02);
  musicBus.gain.setTargetAtTime(vols.music * MUSIC_LEVEL, t, 0.02);
  sfxBus.gain.setTargetAtTime(vols.sfx, t, 0.02);
  voiceBus.gain.setTargetAtTime(vols.voice, t, 0.02);
}

function buildGraph() {
  // sources -> sfx/music/voice bus -> compressor -> gentle lowpass -> master -> speakers
  master = ctx.createGain();
  const soften = ctx.createBiquadFilter();
  soften.type = 'lowpass';
  soften.frequency.value = 9000;
  soften.Q.value = 0.5;
  comp = ctx.createDynamicsCompressor();
  comp.threshold.value = -16;
  comp.knee.value = 18;
  comp.ratio.value = 6;
  comp.attack.value = 0.003;
  comp.release.value = 0.18;
  comp.connect(soften);
  soften.connect(master);
  master.connect(ctx.destination);

  sfxBus = ctx.createGain();
  voiceBus = ctx.createGain();
  musicBus = ctx.createGain();
  duckGain = ctx.createGain();
  sfxBus.connect(comp);
  voiceBus.connect(comp);
  duckGain.connect(musicBus);
  musicBus.connect(comp);

  const len = Math.floor(ctx.sampleRate * NOISE_LEN);
  noiseBuf = ctx.createBuffer(1, len, ctx.sampleRate);
  const data = noiseBuf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;

  master.gain.value = vols.mute ? 0 : 1;
  musicBus.gain.value = vols.music * MUSIC_LEVEL;
  sfxBus.gain.value = vols.sfx;
  voiceBus.gain.value = vols.voice;
}

// ---------------------------------------------------------------- helpers

function envelope(param, t, dur, peak, attack) {
  const a = Math.min(attack || 0.004, dur * 0.92);
  param.setValueAtTime(0.0001, t);
  param.linearRampToValueAtTime(Math.max(peak, 0.0002), t + a);
  param.exponentialRampToValueAtTime(0.0001, t + dur);
}

// One pitched voice. f0 -> f1 is a pitch slide. Extras: lp (lowpass cutoff),
// vib: { rate, depth } wobbles the pitch (depth in Hz).
function tone(o) {
  const t = cur.t + (o.delay || 0);
  const dur = o.dur || 0.1;
  const f0 = clampF((o.f0 || 440) * cur.pitch);
  const f1 = clampF((o.f1 || o.f0 || 440) * cur.pitch);
  const osc = ctx.createOscillator();
  osc.type = o.type || 'sine';
  osc.frequency.setValueAtTime(f0, t);
  if (f1 !== f0) osc.frequency.exponentialRampToValueAtTime(f1, t + dur);
  const g = ctx.createGain();
  envelope(g.gain, t, dur, o.gain == null ? 0.3 : o.gain, o.attack);
  let lfo = null;
  if (o.vib) {
    lfo = ctx.createOscillator();
    lfo.frequency.value = o.vib.rate;
    const lg = ctx.createGain();
    lg.gain.value = o.vib.depth;
    lfo.connect(lg);
    lg.connect(osc.frequency);
    lfo.start(t);
    lfo.stop(t + dur + 0.03);
  }
  if (o.lp) {
    const f = ctx.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.value = clampF(o.lp);
    osc.connect(f);
    f.connect(g);
  } else {
    osc.connect(g);
  }
  g.connect(cur.dest);
  osc.start(t);
  osc.stop(t + dur + 0.03);
  cur.end = Math.max(cur.end, (o.delay || 0) + dur);
}

// One filtered-noise voice. f0 -> f1 sweeps the filter.
function noise(o) {
  const t = cur.t + (o.delay || 0);
  const dur = o.dur || 0.1;
  const src = ctx.createBufferSource();
  src.buffer = noiseBuf;
  src.loop = true;
  const f = ctx.createBiquadFilter();
  f.type = o.filterType || 'lowpass';
  const f0 = clampF((o.f0 || 1000) * cur.pitch);
  const f1 = clampF((o.f1 || o.f0 || 1000) * cur.pitch);
  f.frequency.setValueAtTime(f0, t);
  if (f1 !== f0) f.frequency.exponentialRampToValueAtTime(f1, t + dur);
  f.Q.value = o.q || 0.7;
  const g = ctx.createGain();
  envelope(g.gain, t, dur, o.gain == null ? 0.3 : o.gain, o.attack);
  src.connect(f);
  f.connect(g);
  g.connect(cur.dest);
  src.start(t, Math.random() * (NOISE_LEN - 0.2));
  src.stop(t + dur + 0.03);
  cur.end = Math.max(cur.end, (o.delay || 0) + dur);
}

const T = tone, N = noise;
// Plays a list of notes one after another (used by jingles).
function run(type, freqs, gap, dur, gain) {
  freqs.forEach((f, i) => T({ type, f0: f, dur, gain, delay: i * gap }));
}

// ---------------------------------------------------------------- sound effects

const SFX = {
  // --- combat
  hitLight() {
    N({ dur: 0.06, gain: 0.35, filterType: 'bandpass', f0: 2200, f1: 900, q: 0.8 });
    T({ f0: 220, f1: 70, dur: 0.09, gain: 0.5 });
  },
  hitMedium() {
    N({ dur: 0.09, gain: 0.45, f0: 3000, f1: 600 });
    T({ f0: 180, f1: 55, dur: 0.14, gain: 0.6 });
    T({ type: 'square', f0: 300, f1: 90, dur: 0.05, gain: 0.1 });
  },
  hitHeavy() {
    N({ dur: 0.18, gain: 0.55, f0: 2600, f1: 300 });
    T({ f0: 150, f1: 38, dur: 0.28, gain: 0.75 });
    T({ type: 'triangle', f0: 90, f1: 45, dur: 0.3, gain: 0.3, delay: 0.02 });
    N({ dur: 0.25, gain: 0.15, filterType: 'bandpass', f0: 500, f1: 200, delay: 0.05 });
  },
  block() {
    T({ type: 'square', f0: 520, f1: 380, dur: 0.07, gain: 0.12 });
    T({ type: 'triangle', f0: 811, f1: 640, dur: 0.09, gain: 0.14 });
    N({ dur: 0.05, gain: 0.3, filterType: 'bandpass', f0: 1500, q: 2 });
    T({ f0: 140, f1: 90, dur: 0.08, gain: 0.3 });
  },
  parry() {
    T({ f0: 1568, dur: 0.24, gain: 0.28 });
    T({ f0: 2349, dur: 0.18, gain: 0.16 });
    T({ type: 'triangle', f0: 3136, f1: 2637, dur: 0.1, gain: 0.07 });
    N({ dur: 0.03, gain: 0.18, filterType: 'highpass', f0: 3000 });
  },
  guardBreak() {
    N({ dur: 0.3, gain: 0.5, f0: 4000, f1: 300 });
    T({ type: 'sawtooth', f0: 400, f1: 60, dur: 0.35, gain: 0.25 });
    T({ type: 'square', f0: 880, f1: 220, dur: 0.12, gain: 0.1 });
    T({ f0: 1200, f1: 500, dur: 0.2, gain: 0.12, delay: 0.05 });
  },
  whoosh() { N({ dur: 0.14, gain: 0.22, filterType: 'bandpass', f0: 600, f1: 2400, q: 1.2, attack: 0.04 }); },
  whooshHeavy() {
    N({ dur: 0.26, gain: 0.32, filterType: 'bandpass', f0: 300, f1: 1600, q: 1, attack: 0.08 });
    T({ f0: 120, f1: 60, dur: 0.2, gain: 0.15 });
  },
  jump() {
    T({ type: 'square', f0: 260, f1: 620, dur: 0.13, gain: 0.1 });
    N({ dur: 0.06, gain: 0.1, filterType: 'highpass', f0: 1500 });
  },
  land() {
    N({ dur: 0.09, gain: 0.3, f0: 500, f1: 150 });
    T({ f0: 110, f1: 50, dur: 0.1, gain: 0.35 });
  },
  dash() {
    N({ dur: 0.16, gain: 0.28, filterType: 'bandpass', f0: 900, f1: 3200, q: 1.5, attack: 0.02 });
    T({ type: 'sawtooth', f0: 200, f1: 500, dur: 0.1, gain: 0.05 });
  },
  dodge() {
    N({ dur: 0.12, gain: 0.18, filterType: 'highpass', f0: 1200, f1: 3500 });
    T({ f0: 700, f1: 1100, dur: 0.1, gain: 0.08 });
  },
  throw() {
    N({ dur: 0.2, gain: 0.25, filterType: 'bandpass', f0: 400, f1: 1400, attack: 0.1 });
    T({ f0: 160, f1: 50, dur: 0.16, gain: 0.55, delay: 0.2 });
    N({ dur: 0.1, gain: 0.4, f0: 1200, f1: 300, delay: 0.2 });
  },
  tech() {
    T({ type: 'square', f0: 660, f1: 990, dur: 0.07, gain: 0.12 });
    T({ type: 'square', f0: 990, f1: 1320, dur: 0.08, gain: 0.1, delay: 0.06 });
  },
  knockdown() {
    T({ f0: 100, f1: 40, dur: 0.3, gain: 0.6 });
    N({ dur: 0.22, gain: 0.4, f0: 700, f1: 150 });
    N({ dur: 0.12, gain: 0.15, f0: 400, delay: 0.18 });
    T({ f0: 80, f1: 40, dur: 0.12, gain: 0.3, delay: 0.18 });
  },
  ko() {
    T({ f0: 200, f1: 30, dur: 0.9, gain: 0.7 });
    N({ dur: 0.7, gain: 0.5, f0: 3000, f1: 100 });
    T({ type: 'sawtooth', f0: 440, f1: 55, dur: 0.8, gain: 0.18 });
    T({ type: 'square', f0: 110, f1: 55, dur: 0.5, gain: 0.12, delay: 0.1 });
  },
  breaker() {
    T({ type: 'sawtooth', f0: 300, f1: 1200, dur: 0.18, gain: 0.16 });
    N({ dur: 0.25, gain: 0.35, filterType: 'bandpass', f0: 800, f1: 3000 });
    T({ f0: 150, f1: 60, dur: 0.2, gain: 0.5, delay: 0.12 });
  },
  wallBreak() {
    N({ dur: 0.5, gain: 0.6, f0: 2500, f1: 200 });
    T({ f0: 90, f1: 30, dur: 0.45, gain: 0.7 });
    for (let i = 0; i < 5; i++) {
      N({ dur: 0.05, gain: 0.2, filterType: 'bandpass', f0: rnd(900, 2600), q: 2, delay: 0.1 + i * 0.07 + rnd(0, 0.03) });
    }
  },
  charge() {
    T({ type: 'sawtooth', f0: 110, f1: 440, dur: 0.6, gain: 0.1, attack: 0.3, lp: 1800 });
    T({ f0: 220, f1: 880, dur: 0.6, gain: 0.12, attack: 0.3 });
    N({ dur: 0.6, gain: 0.08, filterType: 'bandpass', f0: 500, f1: 3000, attack: 0.4 });
  },
  meterFull() { run('triangle', [659, 880], 0.08, 0.1, 0.2); T({ type: 'triangle', f0: 1319, dur: 0.28, gain: 0.22, delay: 0.16 }); },
  ultStart() {
    T({ type: 'sawtooth', f0: 80, f1: 640, dur: 0.7, gain: 0.18, attack: 0.4, lp: 2500 });
    N({ dur: 0.7, gain: 0.25, filterType: 'bandpass', f0: 300, f1: 4000, attack: 0.5 });
    T({ f0: 55, dur: 0.7, gain: 0.4, attack: 0.05 });
    T({ type: 'triangle', f0: 1320, dur: 0.3, gain: 0.12, delay: 0.65 });
  },
  ultBoom() {
    T({ f0: 120, f1: 25, dur: 1.1, gain: 0.9 });
    N({ dur: 1.0, gain: 0.7, f0: 5000, f1: 80 });
    T({ type: 'sawtooth', f0: 220, f1: 40, dur: 0.6, gain: 0.22 });
    N({ dur: 0.5, gain: 0.25, filterType: 'bandpass', f0: 2000, f1: 400, delay: 0.1 });
  },
  freeze() {
    T({ f0: 2093, dur: 0.4, gain: 0.12 });
    T({ f0: 3136, f1: 3100, dur: 0.35, gain: 0.06 });
    N({ dur: 0.15, gain: 0.18, filterType: 'highpass', f0: 5000 });
    T({ f0: 60, dur: 0.3, gain: 0.3 });
  },

  // --- menus and match flow
  uiMove() { T({ type: 'square', f0: 660, dur: 0.04, gain: 0.07 }); },
  uiSelect() { run('square', [784, 1047], 0.04, 0.06, 0.09); },
  uiConfirm() { run('triangle', [523, 784], 0.06, 0.08, 0.2); T({ type: 'triangle', f0: 1047, dur: 0.18, gain: 0.2, delay: 0.12 }); },
  uiBack() { T({ type: 'square', f0: 523, f1: 392, dur: 0.09, gain: 0.09 }); },
  uiLocked() { T({ type: 'square', f0: 150, dur: 0.08, gain: 0.11 }); T({ type: 'square', f0: 140, dur: 0.1, gain: 0.11, delay: 0.1 }); },
  unlock() {
    run('triangle', [523, 659, 784, 1047, 1319], 0.07, 0.16, 0.18);
    N({ dur: 0.4, gain: 0.05, filterType: 'highpass', f0: 5000, delay: 0.25, attack: 0.1 });
  },
  countdown() { T({ type: 'square', f0: 440, dur: 0.14, gain: 0.13 }); T({ f0: 880, dur: 0.14, gain: 0.1 }); },
  fight() {
    T({ type: 'sawtooth', f0: 220, f1: 440, dur: 0.35, gain: 0.18, lp: 3000 });
    T({ type: 'square', f0: 440, f1: 880, dur: 0.35, gain: 0.08 });
    N({ dur: 0.3, gain: 0.3, filterType: 'bandpass', f0: 1000, f1: 3000 });
    T({ f0: 110, f1: 55, dur: 0.3, gain: 0.4 });
  },
  roundEnd() {
    run('triangle', [784, 659], 0.14, 0.16, 0.2);
    T({ type: 'triangle', f0: 523, dur: 0.45, gain: 0.22, delay: 0.28 });
    T({ f0: 262, dur: 0.45, gain: 0.2, delay: 0.28 });
  },
  victory() {
    run('square', [523, 659, 784], 0.09, 0.1, 0.1);
    [1047, 784, 659].forEach((f, i) => T({ type: i ? 'triangle' : 'square', f0: f, dur: 0.6, gain: i ? 0.14 : 0.1, delay: 0.27 }));
    T({ f0: 131, dur: 0.6, gain: 0.3, delay: 0.27 });
  },
  cheer() {
    N({ dur: 1.4, gain: 0.28, filterType: 'bandpass', f0: 900, f1: 1500, q: 0.6, attack: 0.35 });
    N({ dur: 1.2, gain: 0.12, filterType: 'bandpass', f0: 2400, f1: 3000, q: 1, attack: 0.4, delay: 0.1 });
    for (let i = 0; i < 6; i++) {
      const f = rnd(450, 800);
      T({ f0: f, f1: f * rnd(1.3, 1.7), dur: rnd(0.15, 0.3), gain: 0.04, attack: 0.05, delay: rnd(0.1, 0.9) });
    }
  },

  // --- hero power sounds
  el_power() {
    T({ f0: 140, f1: 32, dur: 0.45, gain: 0.85 });
    N({ dur: 0.3, gain: 0.5, f0: 1800, f1: 150 });
    T({ type: 'triangle', f0: 70, f1: 35, dur: 0.5, gain: 0.3 });
  },
  el_gadget() {
    N({ dur: 0.015, gain: 0.4, filterType: 'highpass', f0: 3000 });
    T({ type: 'square', f0: 1800, dur: 0.02, gain: 0.1 });
    T({ type: 'sawtooth', f0: 400, f1: 2400, dur: 0.18, gain: 0.1, delay: 0.04 });
    T({ type: 'square', f0: 1245, dur: 0.15, gain: 0.04, delay: 0.04 });
    T({ type: 'triangle', f0: 2400, f1: 1200, dur: 0.12, gain: 0.08, delay: 0.2 });
  },
  el_speed() {
    N({ dur: 0.22, gain: 0.3, filterType: 'bandpass', f0: 500, f1: 6000, q: 2, attack: 0.12 });
    T({ type: 'sawtooth', f0: 200, f1: 2400, dur: 0.2, gain: 0.07, attack: 0.1 });
    N({ dur: 0.04, gain: 0.28, filterType: 'highpass', f0: 4000, delay: 0.2 });
  },
  el_tech() {
    T({ type: 'sawtooth', f0: 1800, f1: 300, dur: 0.22, gain: 0.14 });
    T({ type: 'square', f0: 900, f1: 150, dur: 0.22, gain: 0.07 });
    T({ f0: 1200, dur: 0.04, gain: 0.1, delay: 0.24 });
    T({ f0: 1200, dur: 0.04, gain: 0.08, delay: 0.3 });
  },
  el_electric() {
    for (let i = 0; i < 8; i++) {
      const d = i * 0.045 + rnd(0, 0.02);
      N({ dur: 0.03, gain: 0.3, filterType: 'bandpass', f0: rnd(2000, 6000), q: 3, delay: d });
      if (i % 2) T({ type: 'square', f0: rnd(800, 2400), f1: rnd(800, 2400), dur: 0.03, gain: 0.06, delay: d });
    }
    T({ type: 'sawtooth', f0: 110, f1: 90, dur: 0.4, gain: 0.13, vib: { rate: 55, depth: 60 } });
  },
  el_web() {
    T({ f0: 300, f1: 1500, dur: 0.12, gain: 0.2 });
    T({ type: 'triangle', f0: 1500, f1: 500, dur: 0.2, gain: 0.14, delay: 0.1, vib: { rate: 18, depth: 120 } });
    N({ dur: 0.1, gain: 0.2, filterType: 'bandpass', f0: 2500, f1: 5000, q: 4 });
  },
  el_cosmic() {
    [880, 1320, 1760].forEach((f, i) => T({ f0: f, dur: 0.65, gain: 0.12 - i * 0.03, attack: 0.15, vib: { rate: 9 + i, depth: 15 } }));
    N({ dur: 0.6, gain: 0.08, filterType: 'bandpass', f0: 4000, f1: 7000, q: 3, attack: 0.2 });
    T({ type: 'sawtooth', f0: 220, f1: 440, dur: 0.6, gain: 0.05, attack: 0.2, lp: 2000 });
  },
  el_magic() {
    [784, 988, 1175, 1568, 1976, 2349].forEach((f, i) => {
      T({ f0: f, dur: 0.28, gain: 0.12, delay: i * 0.05 });
      T({ type: 'triangle', f0: f * 2, dur: 0.12, gain: 0.03, delay: i * 0.05 });
    });
    N({ dur: 0.35, gain: 0.05, filterType: 'highpass', f0: 6000, attack: 0.1 });
  },
  el_ice() {
    N({ dur: 0.04, gain: 0.45, filterType: 'highpass', f0: 2500 });
    T({ f0: 2637, f1: 2600, dur: 0.3, gain: 0.1 });
    N({ dur: 0.2, gain: 0.14, filterType: 'bandpass', f0: 5000, q: 5, delay: 0.03 });
    for (let i = 0; i < 5; i++) T({ f0: rnd(3000, 5200), dur: 0.08, gain: 0.06, delay: 0.06 + i * 0.05 + rnd(0, 0.02) });
  },
  el_beast() {
    T({ type: 'sawtooth', f0: 95, f1: 60, dur: 0.4, gain: 0.28, vib: { rate: 38, depth: 30 } });
    T({ type: 'square', f0: 140, f1: 80, dur: 0.35, gain: 0.09, vib: { rate: 31, depth: 40 } });
    N({ dur: 0.3, gain: 0.35, filterType: 'bandpass', f0: 700, f1: 2200, q: 1.5 });
    N({ dur: 0.1, gain: 0.28, filterType: 'highpass', f0: 2500, f1: 5000, delay: 0.15 });
  },
  el_arrow() {
    T({ type: 'triangle', f0: 220, f1: 180, dur: 0.18, gain: 0.3, vib: { rate: 45, depth: 25 } });
    T({ type: 'sawtooth', f0: 440, f1: 330, dur: 0.06, gain: 0.08 });
    N({ dur: 0.3, gain: 0.2, filterType: 'bandpass', f0: 2500, f1: 4500, q: 8, delay: 0.05, attack: 0.05 });
    T({ f0: 2800, f1: 3400, dur: 0.28, gain: 0.03, delay: 0.05, attack: 0.05 });
  },
  el_wind() {
    N({ dur: 0.7, gain: 0.35, filterType: 'bandpass', f0: 300, f1: 1800, q: 1.2, attack: 0.3 });
    N({ dur: 0.6, gain: 0.15, filterType: 'bandpass', f0: 1200, f1: 600, q: 3, attack: 0.2, delay: 0.1 });
  },
  el_shadow() {
    N({ dur: 0.5, gain: 0.3, f0: 200, f1: 2500, attack: 0.45 });
    T({ f0: 90, f1: 180, dur: 0.5, gain: 0.2, attack: 0.45 });
  },
  el_dark() {
    for (let i = 0; i < 3; i++) T({ f0: 62, f1: 48, dur: 0.2, gain: 0.55, delay: i * 0.2, attack: 0.02 });
    T({ type: 'sawtooth', f0: 73, f1: 65, dur: 0.65, gain: 0.14, lp: 400, attack: 0.1 });
    N({ dur: 0.6, gain: 0.15, f0: 300, attack: 0.2 });
  },
  el_mech() {
    T({ type: 'sawtooth', f0: 180, f1: 520, dur: 0.2, gain: 0.09, vib: { rate: 60, depth: 20 } });
    T({ type: 'square', f0: 360, f1: 1040, dur: 0.2, gain: 0.035 });
    T({ f0: 120, f1: 40, dur: 0.18, gain: 0.6, delay: 0.22 });
    N({ dur: 0.1, gain: 0.4, f0: 1500, f1: 300, delay: 0.22 });
    T({ type: 'square', f0: 700, f1: 500, dur: 0.05, gain: 0.08, delay: 0.22 });
  },
  el_fire() {
    N({ dur: 0.65, gain: 0.45, filterType: 'bandpass', f0: 300, f1: 1500, q: 0.7, attack: 0.15 });
    N({ dur: 0.5, gain: 0.25, f0: 800, f1: 200, delay: 0.1 });
    T({ type: 'sawtooth', f0: 70, f1: 110, dur: 0.6, gain: 0.1, attack: 0.1, vib: { rate: 23, depth: 15 } });
    for (let i = 0; i < 5; i++) N({ dur: 0.02, gain: 0.14, filterType: 'highpass', f0: 3000, delay: rnd(0.05, 0.55) });
  },
  el_math() { run('square', [1047, 1319, 1568, 2093, 1568, 2093, 2637], 0.055, 0.05, 0.09); },
};

// Short brassy two-note stab used by the announcer.
function sting() {
  [[392, 0, 0.16], [587, 0.13, 0.42]].forEach(([f, d, dur]) => {
    T({ type: 'sawtooth', f0: f, dur, gain: 0.16, delay: d, attack: 0.02, lp: 2200 });
    T({ type: 'sawtooth', f0: f * 1.006, dur, gain: 0.12, delay: d, attack: 0.02, lp: 2200 });
    T({ type: 'square', f0: f / 2, dur, gain: 0.08, delay: d, attack: 0.02, lp: 1200 });
  });
}

// Runs one sound recipe into the given bus. Returns false if it was skipped.
function play(fn, bus, opts, key, priority) {
  if (!ctx || paused || typeof fn !== 'function') return false;
  wake();
  const now = ctx.currentTime;
  if (key) {
    if (now - (lastPlayed[key] == null ? -1 : lastPlayed[key]) < SAME_SFX_GAP) return false;
    if (!priority && activeVoices >= MAX_VOICES) return false;
    lastPlayed[key] = now;
  }
  const o = opts || {};
  const out = ctx.createGain();
  out.gain.value = clamp01(o.vol, 1);
  const pan = typeof o.pan === 'number' && isFinite(o.pan) ? Math.max(-1, Math.min(1, o.pan)) : 0;
  if (pan && ctx.createStereoPanner) {
    const p = ctx.createStereoPanner();
    p.pan.value = pan;
    out.connect(p);
    p.connect(bus);
  } else {
    out.connect(bus);
  }
  const pitch = typeof o.pitch === 'number' && o.pitch > 0 && isFinite(o.pitch) ? o.pitch : 1;
  cur = { t: now + 0.005, pitch, dest: out, end: 0 };
  fn();
  activeVoices++;
  setTimeout(() => {
    activeVoices = Math.max(0, activeVoices - 1);
    try { out.disconnect(); } catch (e) { /* ignore */ }
  }, cur.end * 1000 + 120);
  return true;
}

// ---------------------------------------------------------------- music
// Each track is a little 16-steps-per-bar sequencer pattern.
//   chords: one scale degree per bar (the chord built on that note of the scale)
//   lead:   one 16-character string per bar. 0-9 then a-e = scale notes going up,
//           '-' holds the note, '.' is a rest
//   bass:   '0' chord root, '4' fifth, '7' octave
//   arp:    '0'-'3' picks a note of the chord
//   kick / snare / hat: 'x' = hit

const MAJOR = [0, 2, 4, 5, 7, 9, 11];
const MINOR = [0, 2, 3, 5, 7, 8, 10];
const DORIAN = [0, 2, 3, 5, 7, 9, 10];
const PHRYGIAN = [0, 1, 3, 5, 7, 8, 10];

const TRACKS = {
  menu: {
    bpm: 110, key: 50, scale: MAJOR, loop: true, chords: [0, 0, 5, 5, 3, 3, 4, 4],
    lead: ['4---4-2-4---7---', '9---7-4-7-------', '5---5-4-5---9---', '8---7-5-7-------',
      '7---7-5-7---a---', '9---7-5-7-------', '8---8-6-8---b---', 'b-a-9-8-9---8---'],
    bass: '0...0.0.0...4.7.', arp: '0.1.2.1.3.1.2.1.',
    kick: 'x.......x.x.....', snare: '....x.......x...', hat: 'x.x.x.x.x.x.x.x.',
    leadType: 'square', bassType: 'triangle',
  },
  select: {
    bpm: 104, key: 55, scale: MAJOR, loop: true, chords: [0, 3, 0, 4, 5, 3, 4, 0],
    lead: ['2-.4-.7-..4-2-..', '3-.5-.7-..5-3-..', '4-.7-.9-..7-4-..', '4-.6-.8-..6-8-..',
      '9-.7-.5-..7-9-..', 'a-.7-.5-..7-5-..', '8-.6-.4-..6-8-..', '7-------........'],
    bass: '0.....0...4.....', arp: '0.2.1.3.2.1.2...',
    kick: 'x.........x.....', snare: '........x.......', hat: '..x...x...x...x.',
    leadType: 'triangle', bassType: 'triangle',
  },
  battle1: {
    bpm: 144, key: 52, scale: MINOR, loop: true, fill: true, chords: [0, 0, 5, 6, 0, 0, 3, 4],
    lead: ['7-7-4-7-9-7-4-2-', '4---..4-6-7-9---', '9-9-7-9-a-9-7-5-', '8---..8-a-b-a---',
      '7-7-4-7-9-7-4-2-', '4---..7-9-a-b---', 'a-a-7-a-c-a-7-5-', 'b-a-8-6-8-a-b-d-'],
    bass: '0.0.0.0.0.0.0.7.', arp: '0...2...1...3...',
    kick: 'x...x...x...x...', snare: '....x.......x...', hat: '..x...x...x...xx',
    leadType: 'square', bassType: 'sawtooth',
  },
  battle2: {
    bpm: 150, key: 57, scale: DORIAN, loop: true, fill: true, chords: [0, 0, 3, 3, 0, 0, 6, 4],
    lead: ['0-.2-.4-7-.4-.2-', '4-.7-.9-7---4-..', '3-.5-.7-a-.7-.5-', '7-.a-.c-a---7-..',
      '7-.9-.b-9-.7-.4-', '9-.7-.4-7---....', '8-.a-.d-a-.8-.6-', '8-.6-.8-b-b-b-d-'],
    bass: '0..0..0.0..0.47.', arp: '..01..12..23..12',
    kick: 'x..x..x.x..x....', snare: '....x.......x.x.', hat: 'x.x.x.x.x.x.x.x.',
    leadType: 'sawtooth', bassType: 'square',
  },
  battle3: {
    bpm: 155, key: 48, scale: MAJOR, loop: true, fill: true, chords: [0, 4, 5, 3, 0, 4, 3, 4],
    lead: ['7---4-7-9---7-4-', '8---6-8-b---8-6-', '9---7-9-c---9-7-', 'a-9-7-5-7---5-7-',
      '9---7-9-b---9-7-', 'b---8-b-d---b-8-', 'c-a-7-a-c-a-c-e-', 'd-b-8-b-d---b-d-'],
    bass: '0.7.0.7.0.7.4.7.', arp: '0123012301230123',
    kick: 'x...x...x...x.x.', snare: '....x.......x...', hat: 'x.xxx.xxx.xxx.xx',
    leadType: 'square', bassType: 'sawtooth',
  },
  boss: {
    bpm: 150, key: 54, scale: PHRYGIAN, loop: true, fill: true, chords: [0, 0, 1, 0, 0, 0, 5, 1],
    lead: ['0-0-1-0-4-0-1-0-', '0-0-1-0-7-4-2-1-', '1-1-3-1-5-1-3-1-', '0-2-4-7-8-7-4-2-',
      '7-7-8-7-b-7-8-7-', '7-7-8-7-e-b-9-8-', 'c---9---7---5---', '8---a---c---8-a-'],
    bass: '0.000.000.000.70', arp: '0..0..1.0..0..2.',
    kick: 'x.x...x.x.x...x.', snare: '....x.......x..x', hat: 'x.x.x.x.x.x.x.x.',
    leadType: 'sawtooth', bassType: 'sawtooth',
  },
  victory: {
    bpm: 132, key: 48, scale: MAJOR, loop: false, chords: [0, 3, 4, 0],
    lead: ['0-2-4-7---4-7---', '3-5-7-a---7-a---', '4-6-8-b---8-b-d-', 'e---------------'],
    bass: '0...0...0...0.0.', arp: '0123012301230123',
    kick: 'x...x...x...x...', snare: '....x.......xxxx', hat: '................',
    leadType: 'square', bassType: 'triangle',
  },
};

const seq = { name: null, def: null, gain: null, step: 0, nextTime: 0, timer: null };
let wanted = null; // the track the game last asked for (may be waiting for init)

function degSemis(scale, n) { return scale[((n % 7) + 7) % 7] + 12 * Math.floor(n / 7); }
function holdLen(str, i, ch, max) {
  let n = 1;
  while (i + n < 16 && str[i + n] === ch && n < max) n++;
  return n;
}

function scheduleStep(def, step, t, dest) {
  const sd = 60 / def.bpm / 4;
  const bar = Math.floor(step / 16), s = step % 16;
  const bars = def.lead.length;
  const chord = def.chords[bar % def.chords.length];
  const lastBar = bar === bars - 1;
  const ending = !def.loop && lastBar; // final held chord of a play-once track
  cur = { t, pitch: 1, dest, end: 0 };

  const lc = def.lead[bar][s];
  if (lc !== '.' && lc !== '-') {
    const d = parseInt(lc, 36);
    const len = holdLen(def.lead[bar], s, '-', 16);
    T({ type: def.leadType, f0: midiHz(def.key + 12 + degSemis(def.scale, d)), dur: len * sd * 0.95 + 0.04,
      gain: def.leadType === 'triangle' ? 0.2 : 0.085, attack: 0.008, lp: 3200 });
  }

  const bc = ending ? (s === 0 ? '0' : '.') : def.bass[s];
  if (bc !== '.') {
    const len = ending ? 14 : holdLen(def.bass, s, '.', 4);
    T({ type: def.bassType, f0: midiHz(def.key - 12 + degSemis(def.scale, chord + Number(bc))), dur: len * sd * 0.9 + 0.03,
      gain: def.bassType === 'triangle' ? 0.36 : 0.16, attack: 0.006, lp: 900 });
  }

  const ac = ending && s > 7 ? '.' : def.arp[s];
  if (ac !== '.') {
    const d = chord + [0, 2, 4, 7][Number(ac)];
    T({ type: 'triangle', f0: midiHz(def.key + 12 + degSemis(def.scale, d)), dur: sd * 1.4, gain: 0.07, attack: 0.005 });
  }

  if (ending) {
    if (s === 0) {
      T({ f0: 150, f1: 45, dur: 0.14, gain: 0.5 });
      N({ dur: 1.2, gain: 0.14, filterType: 'highpass', f0: 3500, f1: 2500 });
    }
    return;
  }
  if (def.kick[s] === 'x') T({ f0: 150, f1: 45, dur: 0.12, gain: 0.5 });
  const fill = def.fill && lastBar && s >= 12;
  if (def.snare[s] === 'x' || fill) {
    N({ dur: 0.1, gain: fill ? 0.12 + (s - 12) * 0.035 : 0.22, filterType: 'bandpass', f0: 1800, q: 0.8 });
    T({ type: 'triangle', f0: 200, f1: 140, dur: 0.06, gain: 0.12 });
  }
  if (def.hat[s] === 'x') N({ dur: 0.03, gain: 0.07, filterType: 'highpass', f0: 6000 });
}

function tick() {
  if (!ctx || !seq.def || paused || ctx.state !== 'running') return;
  const now = ctx.currentTime;
  // If the browser stalled us (slow tab), skip ahead instead of machine-gunning notes.
  if (seq.nextTime < now - 0.2) seq.nextTime = now + 0.05;
  while (seq.def && seq.nextTime < now + LOOKAHEAD) {
    const def = seq.def;
    try { scheduleStep(def, seq.step, seq.nextTime, seq.gain); } catch (e) { /* keep the beat going */ }
    seq.nextTime += 60 / def.bpm / 4;
    seq.step++;
    if (seq.step >= def.lead.length * 16) {
      if (def.loop) seq.step = 0;
      else { seq.def = null; stopTimer(); } // play-once track finished: go quiet
    }
  }
}

function startTimer() {
  if (seq.timer == null && seq.def && !paused) seq.timer = setInterval(tick, TICK_MS);
}
function stopTimer() {
  if (seq.timer != null) { clearInterval(seq.timer); seq.timer = null; }
}

function applyTrack() {
  if (!ctx || seq.name === wanted) return;
  const t = ctx.currentTime;
  const old = seq.gain;
  if (old) {
    old.gain.cancelScheduledValues(t);
    old.gain.setValueAtTime(old.gain.value, t);
    old.gain.linearRampToValueAtTime(0, t + 0.4);
    setTimeout(() => { try { old.disconnect(); } catch (e) { /* ignore */ } }, 700);
  }
  seq.name = wanted;
  seq.def = wanted ? TRACKS[wanted] : null;
  seq.gain = null;
  seq.step = 0;
  if (!seq.def) { stopTimer(); return; }
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.linearRampToValueAtTime(1, t + (old ? 0.4 : 0.08));
  g.connect(duckGain);
  seq.gain = g;
  seq.nextTime = t + 0.08;
  startTimer();
}

// ---------------------------------------------------------------- speech

function speak(text, pitch, rate, cancelFirst) {
  const s = synth();
  if (!s || text == null || text === '') return;
  if (cancelFirst) s.cancel();
  else if (s.pending) return; // do not let character lines pile up in a queue
  if (paused || vols.mute || vols.voice <= 0) return;
  if (typeof window.SpeechSynthesisUtterance !== 'function') return;
  const u = new window.SpeechSynthesisUtterance(String(text));
  u.rate = Math.min(2, Math.max(0.5, typeof rate === 'number' ? rate : 1));
  u.pitch = Math.min(2, Math.max(0, typeof pitch === 'number' ? pitch : 1));
  u.volume = vols.voice;
  s.speak(u);
}

// ---------------------------------------------------------------- public API

export const GameAudio = {
  init() {
    try {
      if (!ctx) {
        const AC = typeof window !== 'undefined' && (window.AudioContext || window.webkitAudioContext);
        if (!AC) return false;
        ctx = new AC();
        buildGraph();
      }
      wake();
      applyTrack();
      return true;
    } catch (e) {
      return false;
    }
  },

  setVolumes(v) {
    try {
      if (!v || typeof v !== 'object') return;
      vols.music = clamp01(v.music, vols.music);
      vols.sfx = clamp01(v.sfx, vols.sfx);
      vols.voice = clamp01(v.voice, vols.voice);
      if (typeof v.mute === 'boolean') vols.mute = v.mute;
      applyVolumes();
      if (vols.mute) { const s = synth(); if (s) s.cancel(); }
    } catch (e) { /* ignore */ }
  },

  sfx(name, opts) {
    try {
      if (!ctx || !Object.prototype.hasOwnProperty.call(SFX, name)) return;
      play(SFX[name], sfxBus, opts, name, PRIORITY[name]);
    } catch (e) { /* ignore */ }
  },

  music(track) {
    try {
      const want = track == null ? null : String(track);
      if (want && !Object.prototype.hasOwnProperty.call(TRACKS, want)) return;
      if (want === wanted) return;
      wanted = want;
      applyTrack();
    } catch (e) { /* ignore */ }
  },

  announce(text, opts) {
    try { play(sting, voiceBus, null, null, true); } catch (e) { /* ignore */ }
    try {
      if (opts && opts.speak === false) { const s = synth(); if (s) s.cancel(); return; }
      speak(text, 0.7, 0.95, true);
    } catch (e) { /* ignore */ }
  },

  say(text, opts) {
    try { speak(text, opts && opts.pitch, opts && opts.rate, false); } catch (e) { /* ignore */ }
  },

  pause() {
    try {
      paused = true;
      stopTimer();
      const s = synth();
      if (s) s.cancel();
      if (ctx && ctx.state === 'running') { const p = ctx.suspend(); if (p && p.catch) p.catch(() => {}); }
    } catch (e) { /* ignore */ }
  },

  resume() {
    try {
      paused = false;
      wake();
      startTimer(); // the audio clock froze while paused, so the beat picks up exactly where it stopped
    } catch (e) { /* ignore */ }
  },

  // amount = how much to turn the music down (0 = not at all, 1 = silent) for `seconds`.
  duck(amount, seconds) {
    try {
      if (!ctx) return;
      const target = Math.max(0.0001, 1 - clamp01(amount, 0.6));
      const hold = typeof seconds === 'number' && seconds > 0 && isFinite(seconds) ? seconds : 1.5;
      const t = ctx.currentTime, g = duckGain.gain;
      g.cancelScheduledValues(t);
      g.setValueAtTime(g.value, t);
      g.linearRampToValueAtTime(target, t + 0.08);
      g.setValueAtTime(target, t + Math.max(0.09, hold));
      g.linearRampToValueAtTime(1, t + Math.max(0.09, hold) + 0.35);
    } catch (e) { /* ignore */ }
  },
};

export default GameAudio;
