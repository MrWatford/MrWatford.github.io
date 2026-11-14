// Turbo League: Rocket Soccer — sound effects.
// Every sound here is made by the browser's Web Audio system from scratch
// (oscillators = simple tones, noise = static hiss). No sound files at all.
//
// How it is wired:  sound -> bus (sfx / music / crowd) -> master -> compressor -> speakers
// Each bus has its own volume knob so the settings menu can change them separately.
// Every public function first checks "is audio ready?" and quietly does nothing if not,
// so the game can call them any time without crashing.

let ctx = null;          // the AudioContext (made on the first click/key press)
let bus = null;          // { master, sfx, music, crowd } volume knobs (GainNodes)
let noiseBuf = null;     // 2 seconds of white noise, shared by every noisy sound
// four engine voices for the Garage: oscillator shapes, detune (cents), pitch curve, filter, loudness
export const ENGINES = {
  classic: { osc: [['sawtooth', 0], ['square', 7], ['sine', -1200]], base: 45, k: 3.2, push: 12, f0: 250, fk: 35, fp: 250, gain: 1 },
  turbo: { osc: [['sawtooth', 0], ['sawtooth', 9], ['triangle', 1900]], base: 52, k: 3.9, push: 18, f0: 380, fk: 55, fp: 380, gain: 0.95 },
  electric: { osc: [['sine', 0], ['triangle', 1200], ['sine', 1902]], base: 110, k: 9, push: 25, f0: 900, fk: 90, fp: 500, gain: 0.85 },
  rally: { osc: [['square', 0], ['sawtooth', -6], ['square', -1200]], base: 36, k: 2.7, push: 15, f0: 210, fk: 26, fp: 320, gain: 1.1 },
};
let eng = ENGINES.classic;
let loops = null;        // the always-running sounds (engine, boost, crowd...)
const vols = { master: 0.8, sfx: 0.9, music: 0.6, crowd: 0.5 };
let hitTimes = [];       // when recent hits/bounces played (to stop sound spam)
let wasBoosting = false;
let crowdTimer = 0;
let music = { mode: null, gain: null, next: 0, bar: 0 }; // background music state
let ambMode = 'stadium'; // which arena soundscape is playing

// ---------- small helpers ----------

const clamp01 = (v) => Math.min(1, Math.max(0, Number(v) || 0));
const now = () => ctx.currentTime;

// Smoothly slide a setting toward a new value (no pops or clicks).
function glide(param, value, smooth = 0.08) {
  param.setTargetAtTime(value, now(), smooth);
}

// Run a sound function only when audio is ready; never let a sound error break the game.
function safe(fn) {
  if (!ctx || !bus) return;
  try { fn(); } catch (e) { /* ignore sound problems */ }
}

// Allow at most about 20 hit/bounce sounds per second.
function allowHit() {
  const t = now();
  hitTimes = hitTimes.filter((x) => t - x < 1);
  if (hitTimes.length >= 20) return false;
  hitTimes.push(t);
  return true;
}

// Play one short tone. freqEnd lets the pitch slide (for whooshes and blips).
function tone(freq, { type = 'sine', dur = 0.15, vol = 0.2, freqEnd = null, attack = 0.005, at = 0, dest = bus.sfx } = {}) {
  const t = now() + at;
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  if (freqEnd) osc.frequency.exponentialRampToValueAtTime(Math.max(20, freqEnd), t + dur);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(Math.max(0.0002, vol), t + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  osc.connect(g).connect(dest);
  osc.start(t);
  osc.stop(t + dur + 0.05);
}

// Play one short burst of filtered noise (thuds, clicks, whooshes).
function noiseBurst({ dur = 0.2, vol = 0.2, filter = 'lowpass', freq = 1000, freqEnd = null, Q = 1, at = 0, dest = bus.sfx } = {}) {
  const t = now() + at;
  const src = ctx.createBufferSource();
  src.buffer = noiseBuf;
  const f = ctx.createBiquadFilter();
  f.type = filter;
  f.Q.value = Q;
  f.frequency.setValueAtTime(freq, t);
  if (freqEnd) f.frequency.exponentialRampToValueAtTime(Math.max(20, freqEnd), t + dur);
  const g = ctx.createGain();
  g.gain.setValueAtTime(Math.max(0.0002, vol), t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  src.connect(f).connect(g).connect(dest);
  src.start(t, Math.random() * 1.5);
  src.stop(t + dur + 0.05);
}

// A never-ending noise layer that starts silent; update() fades it in and out.
function noiseLoop(filter, freq, Q, dest) {
  const src = ctx.createBufferSource();
  src.buffer = noiseBuf;
  src.loop = true;
  const f = ctx.createBiquadFilter();
  f.type = filter;
  f.frequency.value = freq;
  f.Q.value = Q;
  const g = ctx.createGain();
  g.gain.value = 0;
  src.connect(f).connect(g).connect(dest);
  src.start(0, Math.random() * 1.9); // random start so layers don't sound identical
  return { src, f, g };
}

// ---------- building the always-on sounds ----------

function buildLoops() {
  // Engine: two slightly out-of-tune buzzy tones plus a low hum, softened by a lowpass filter.
  const engFilter = ctx.createBiquadFilter();
  engFilter.type = 'lowpass';
  engFilter.frequency.value = 300;
  engFilter.Q.value = 2;
  const engGain = ctx.createGain();
  engGain.gain.value = 0;
  engFilter.connect(engGain).connect(bus.sfx);
  const engOsc = eng.osc.map(([type, detune]) => {
    const o = ctx.createOscillator();
    o.type = type;
    o.frequency.value = 45;
    o.detune.value = detune; // -1200 cents = one octave lower (the hum)
    o.connect(engFilter);
    o.start();
    return o;
  });

  return {
    engOsc, engFilter, engGain,
    boostLow: noiseLoop('lowpass', 400, 1, bus.sfx),    // boost rumble
    boostHiss: noiseLoop('bandpass', 2500, 1, bus.sfx), // boost hiss
    sonic: noiseLoop('highpass', 5000, 0.7, bus.sfx),   // airy supersonic layer
    skid: noiseLoop('bandpass', 1800, 4, bus.sfx),      // tire squeal/scrub
    // Crowd: three murmur layers (low, middle, high voices) that swell at random.
    crowd: [400, 900, 1700].map((fr) => ({ ...noiseLoop('bandpass', fr, 0.8, bus.crowd), swell: 1 })),
  roar: noiseLoop('bandpass', 700, 0.6, bus.crowd),   // big goal roar (used by goal())
  // arena soundscapes (all start silent; update() fades in the one for the current arena)
  amb: {
    rumble: noiseLoop('lowpass', 140, 0.7, bus.crowd),     // city traffic rumble
    rain: noiseLoop('highpass', 3500, 0.5, bus.crowd),     // rain hiss
    rainMid: noiseLoop('bandpass', 1100, 0.6, bus.crowd),  // rain patter
    wind: noiseLoop('bandpass', 500, 0.7, bus.crowd),      // desert / arctic wind
    whistle: noiseLoop('bandpass', 1600, 7, bus.crowd),    // icy wind whistle
    shimmer: noiseLoop('highpass', 6500, 0.5, bus.crowd),  // space shimmer
    drone: (() => { const g = ctx.createGain(); g.gain.value = 0; const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 400; f.connect(g).connect(bus.crowd);
      const os = [55, 82.4, 110.2].map((fr, i) => { const o = ctx.createOscillator(); o.type = i === 2 ? 'triangle' : 'sine'; o.frequency.value = fr; o.connect(f); o.start(); return o; }); return { g, os }; })(),
  },
};
}

function applyVolumes() {
  if (!bus) return;
  glide(bus.master.gain, vols.master, 0.05);
  glide(bus.sfx.gain, vols.sfx, 0.05);
  glide(bus.music.gain, vols.music, 0.05);
  glide(bus.crowd.gain, vols.crowd, 0.05);
}

// ---------- music (all original, made from simple synth parts) ----------
// Menu theme: 118 beats per minute, an 8-bar loop of four chords with pad, bass, arpeggio and drums.
const N = (semis) => 220 * Math.pow(2, semis / 12); // note helper: semitones from A3
const MENU_CHORDS = [[0, 3, 7], [-4, 0, 3], [3, 7, 10], [-2, 2, 5], [0, 3, 7], [-4, 0, 3], [-7, -4, 0], [-2, 2, 5]]; // A minor feel
const BEAT = 60 / 118, BAR = BEAT * 4;
function note(dest, freq, t, dur, { type = 'sawtooth', vol = 0.05, attack = 0.01, release = 0.08, cutoff = 2000, detune = 0 } = {}) {
  const o = ctx.createOscillator(), g = ctx.createGain(), f = ctx.createBiquadFilter();
  o.type = type; o.frequency.value = freq; o.detune.value = detune; f.type = 'lowpass'; f.frequency.value = cutoff;
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + attack);
  g.gain.setValueAtTime(vol, Math.max(t + attack, t + dur - release)); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(f).connect(g).connect(dest); o.start(t); o.stop(t + dur + 0.05);
}
function drum(dest, kind, t) {
  if (kind === 'kick') { const o = ctx.createOscillator(), g = ctx.createGain(); o.frequency.setValueAtTime(130, t); o.frequency.exponentialRampToValueAtTime(42, t + 0.14); g.gain.setValueAtTime(0.32, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.2); o.connect(g).connect(dest); o.start(t); o.stop(t + 0.25); return; }
  const src = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain(); src.buffer = noiseBuf;
  const hat = kind === 'hat'; f.type = hat ? 'highpass' : 'bandpass'; f.frequency.value = hat ? 7000 : 1800; f.Q.value = hat ? 0.7 : 0.9;
  const v = hat ? 0.035 : 0.14, d = hat ? 0.04 : 0.13; g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(0.0001, t + d);
  src.connect(f).connect(g).connect(dest); src.start(t, Math.random() * 1.5); src.stop(t + d + 0.02);
}
function menuBar(dest, bar, t) {
  const ch = MENU_CHORDS[bar % MENU_CHORDS.length];
  for (const n of ch) for (const d of [-7, 7]) note(dest, N(n), t, BAR, { vol: 0.022, attack: 0.25, release: 0.4, cutoff: 1300, detune: d }); // pad
  for (let i = 0; i < 8; i++) note(dest, N(ch[0] - 12), t + i * BEAT / 2, BEAT / 2 * 0.9, { type: 'triangle', vol: 0.11, cutoff: 500, release: 0.05 }); // bass
  const arp = [ch[0] + 12, ch[1] + 12, ch[2] + 12, ch[1] + 12];
  if (bar >= 2) for (let i = 0; i < 16; i++) note(dest, N(arp[i % 4]), t + i * BEAT / 4, BEAT / 4 * 0.8, { type: 'square', vol: 0.016, cutoff: 2600, release: 0.06 }); // arpeggio
  for (let b = 0; b < 4; b++) { drum(dest, b % 2 ? 'snare' : 'kick', t + b * BEAT); if (bar % 4 === 3 && b === 3) drum(dest, 'kick', t + (b + 0.5) * BEAT); }
  for (let i = 0; i < 8; i++) drum(dest, 'hat', t + i * BEAT / 2);
}
function victoryJingle(dest, t) {
  const rise = [0, 4, 7, 12, 16], step = 0.14; // a major arpeggio going up
  rise.forEach((n, i) => { note(dest, N(n + 3), t + i * step, 0.3, { vol: 0.07, cutoff: 2400 }); note(dest, N(n + 3), t + i * step, 0.3, { vol: 0.04, cutoff: 2400, detune: 9 }); });
  const end = t + rise.length * step;
  for (const n of [15, 19, 22, 27]) for (const d of [-8, 8]) note(dest, N(n), end, 2.4, { vol: 0.045, attack: 0.04, release: 1.2, cutoff: 3000, detune: d }); // big final chord
  note(dest, N(3 - 12), end, 2.4, { type: 'triangle', vol: 0.14, cutoff: 600, release: 1 });
  [0, 0.5, 0.75, 1].forEach((k) => drum(dest, 'kick', end + k * 0.4));
}
function scheduleMusic() {
  if (!ctx || !music.mode || music.mode !== 'menu' || !music.gain) return;
  while (music.next < now() + 1.2) { menuBar(music.gain, music.bar++, music.next); music.next += BAR; }
}

// ---------- the public API the game uses ----------

export const Audio = {
  // Call on the first click or key press (browsers block sound before that).
  init(ctxIn) {
    try {
      if (ctxIn) { ctx = null; bus = null; loops = null; hitTimes = []; music = { mode: null, gain: null, next: 0, bar: 0 }; }
      if (ctx) {
        if (ctx.state === 'suspended') ctx.resume();
        return;
      }
      if (ctxIn) ctx = ctxIn;
      else {
        if (typeof window === 'undefined') return;
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return;
        ctx = new AC();
      }

      // Gentle compressor keeps loud moments (goal horn + roar) from distorting.
      const comp = ctx.createDynamicsCompressor();
      comp.threshold.value = -18;
      comp.knee.value = 12;
      comp.ratio.value = 4;
      comp.attack.value = 0.01;
      comp.release.value = 0.25;
      comp.connect(ctx.destination);

      const master = ctx.createGain();
      master.connect(comp);
      bus = { master };
      for (const name of ['sfx', 'music', 'crowd']) {
        bus[name] = ctx.createGain();
        bus[name].connect(master);
      }
      for (const name in bus) bus[name].gain.value = vols[name];

      // Fill the shared noise buffer with random values (white noise).
      noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
      const data = noiseBuf.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;

      loops = buildLoops();
      if (!ctxIn && ctx.state === 'suspended') ctx.resume();
      if (music.mode) { const m = music.mode; music.mode = null; Audio.music(m); }
    } catch (e) {
      ctx = null; bus = null; loops = null; // no sound, but the game keeps working
    }
  },

  // Each value 0..1. Saved even before init() so the menu settings still apply later.
  setVolumes({ master, sfx, music, crowd } = {}) {
    if (master !== undefined) vols.master = clamp01(master);
    if (sfx !== undefined) vols.sfx = clamp01(sfx);
    if (music !== undefined) vols.music = clamp01(music);
    if (crowd !== undefined) vols.crowd = clamp01(crowd);
    safe(applyVolumes);
  },

  // Called every frame with the player's car state; fades the continuous sounds.
  update(dt, s = {}) {
    safe(() => {
      if (!loops) return;
      scheduleMusic();
      const menu = !!s.musicOnly;
      const speed = Math.min(23, Math.max(0, Number(s.speed) || 0));
      const throttle = Math.max(-1, Math.min(1, Number(s.throttle) || 0));
      const push = Math.abs(throttle);
      const sp = speed / 23; // 0 = stopped, 1 = top speed

      // Engine pitch and brightness rise with speed and gas pedal. Quiet at idle.
      const pitch = eng.base + speed * eng.k + push * eng.push;
      for (const o of loops.engOsc) glide(o.frequency, pitch, 0.1);
      glide(loops.engFilter.frequency, eng.f0 + speed * eng.fk + push * eng.fp, 0.1);
      glide(loops.engGain.gain, menu && !s.engineDemo ? 0 : (0.035 + sp * 0.05 + push * 0.02) * eng.gain, 0.15);

      // Boost: rumble + hiss, plus a low "whoomp" the moment boosting starts.
      const boosting = !!s.boosting;
      if (boosting && !wasBoosting) tone(90, { freqEnd: 40, dur: 0.35, vol: 0.25, attack: 0.02 });
      wasBoosting = boosting;
      glide(loops.boostLow.g.gain, boosting ? 0.16 : 0, 0.06);
      glide(loops.boostHiss.g.gain, boosting ? 0.045 : 0, 0.06);

      glide(loops.sonic.g.gain, s.supersonic ? 0.03 : 0, 0.2);
      glide(loops.skid.g.gain, s.sliding && s.onGround ? 0.07 * Math.min(1, speed / 8) : 0, 0.05);

      // Crowd: every so often each voice layer picks a new random loudness (slow swells).
      const excite = clamp01(s.crowdExcite);
      crowdTimer -= Number(dt) || 0;
      if (crowdTimer <= 0) {
        crowdTimer = 0.6 + Math.random() * 1.2;
        for (const layer of loops.crowd) layer.swell = 0.6 + Math.random() * 0.8;
      }
for (const layer of loops.crowd) glide(layer.g.gain, (menu ? 0.015 : 0.05 + excite * 0.12) * layer.swell, 0.6);
// arena soundscape, with slow gusts and swells
const A = loops.amb, t = now(), k = menu ? 0.5 : 1, m = ambMode;
glide(A.rumble.g.gain, m === 'city' ? 0.4 * k : 0, 0.8);
glide(A.rain.g.gain, m === 'city' ? 0.16 * k : 0, 0.8);
glide(A.rainMid.g.gain, m === 'city' ? 0.12 * k : 0, 0.8);
const gust = 0.5 + 0.5 * Math.sin(t * 0.31) * Math.sin(t * 0.13 + 1);
glide(A.wind.g.gain, (m === 'desert' ? 0.55 + 0.5 * gust : m === 'arctic' ? 0.6 + 0.45 * gust : 0) * k, 0.5);
glide(A.wind.f.frequency, m === 'arctic' ? 700 + 500 * gust : 380 + 320 * gust, 0.5);
glide(A.whistle.g.gain, m === 'arctic' ? (0.03 + 0.04 * gust) * k : 0, 0.6);
glide(A.whistle.f.frequency, 1300 + 600 * Math.sin(t * 0.21), 0.6);
glide(A.shimmer.g.gain, m === 'space' ? 0.04 * k : 0, 0.8);
glide(A.drone.g.gain, m === 'space' ? (0.11 + 0.03 * Math.sin(t * 0.4)) * k : 0, 0.8);
if (m === 'space') A.drone.os.forEach((o, i) => glide(o.detune, Math.sin(t * (0.07 + i * 0.03)) * 12, 0.5));
    });
  },

  // Car hits the ball: deep thump + bright click. Stronger hit = louder and brighter.
  ballHit(strength = 0.5) {
    safe(() => {
      if (!allowHit()) return;
      const k = clamp01(strength);
      tone(120 + k * 60, { freqEnd: 50, dur: 0.18, vol: 0.2 + k * 0.3 });
      noiseBurst({ dur: 0.06, vol: 0.08 + k * 0.2, filter: 'bandpass', freq: 2500 + k * 3000, Q: 1.5 });
    });
  },

  // Ball hits floor or wall: softer, duller thud.
  bounce(strength = 0.5) {
    safe(() => {
      if (!allowHit()) return;
      const k = clamp01(strength);
      if (k < 0.03) return;
      tone(80 + k * 30, { freqEnd: 45, dur: 0.15, vol: 0.08 + k * 0.18 });
      noiseBurst({ dur: 0.1, vol: 0.04 + k * 0.08, filter: 'lowpass', freq: 600 });
    });
  },

  // Car body hits a wall or lands on the ground.
  carBump(strength = 0.5) {
    safe(() => {
      if (!allowHit()) return;
      const k = clamp01(strength);
      if (k < 0.03) return;
      noiseBurst({ dur: 0.2, vol: 0.08 + k * 0.2, filter: 'lowpass', freq: 900, freqEnd: 200 });
      tone(65, { freqEnd: 40, dur: 0.2, vol: 0.06 + k * 0.15 });
    });
  },

  // Short whooshes: noise whose filter sweeps upward.
  jump() {
    safe(() => noiseBurst({ dur: 0.22, vol: 0.55, filter: 'bandpass', freq: 500, freqEnd: 1800, Q: 0.9 }));
  },
  dodge() {
    safe(() => noiseBurst({ dur: 0.3, vol: 0.6, filter: 'bandpass', freq: 700, freqEnd: 3000, Q: 1 }));
  },

  // Small pad: quick blip. Big pad: rising sparkly chime (three notes going up).
  boostPickup(big = false) {
    safe(() => {
      if (!big) {
        tone(880, { freqEnd: 1320, dur: 0.1, vol: 0.22, type: 'triangle' });
        return;
      }
      [660, 880, 1320].forEach((f, i) => {
        tone(f, { type: 'triangle', dur: 0.35, vol: 0.12, at: i * 0.06 });
        tone(f * 2.01, { dur: 0.3, vol: 0.04, at: i * 0.06 }); // shimmer on top
      });
    });
  },

  // 3, 2, 1 = short beep. 0 = "GO" (higher and longer).
  countdown(n) {
    safe(() => {
      if (n > 0) tone(660, { type: 'square', dur: 0.18, vol: 0.18, attack: 0.01 });
      else tone(1320, { type: 'square', dur: 0.6, vol: 0.2, attack: 0.01 });
    });
  },

  // Goal! Stadium horn (a chord of slightly out-of-tune buzzy notes) + crowd roar.
  goal(teamIndex = 0) {
    safe(() => {
      const t = now();
      // Blue = A major chord, Orange = B-flat major chord (a little higher).
      const chord = teamIndex === 1 ? [233.08, 293.66, 349.23] : [220, 277.18, 329.63];
      const lp = ctx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.value = 1800;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.12, t + 0.06);
      g.gain.setValueAtTime(0.12, t + 1.9);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 2.2);
      lp.connect(g).connect(bus.sfx);
      for (const f of chord) {
        for (const cents of [-8, 8]) {
          const o = ctx.createOscillator();
          o.type = 'sawtooth';
          o.frequency.value = f;
          o.detune.value = cents;
          o.connect(lp);
          o.start(t);
          o.stop(t + 2.3);
        }
      }
      // Crowd roar: swell up fast, hold, then fade over about 3-4 seconds.
      if (loops) {
        const rg = loops.roar.g.gain;
        rg.cancelScheduledValues(t);
        rg.setValueAtTime(rg.value, t);
        rg.linearRampToValueAtTime(0.45, t + 0.4);
        rg.setValueAtTime(0.45, t + 1.6);
        rg.setTargetAtTime(0, t + 1.6, 0.6);
      }
    });
  },

  // Referee-style two-tone blip (end of match).
  whistle() {
    safe(() => {
      tone(2200, { dur: 0.14, vol: 0.1, attack: 0.01 });
      tone(1800, { dur: 0.3, vol: 0.1, attack: 0.01, at: 0.16 });
    });
  },

// Background music: 'menu' (looping theme), 'victory' (one fanfare), or null (silence).
music(mode) {
  if (mode === music.mode && music.gain) return;
  music.mode = mode;
  safe(() => {
    if (music.gain) { const old = music.gain; old.gain.setTargetAtTime(0.0001, now(), 0.25); setTimeout(() => { try { old.disconnect(); } catch (e) { /* gone */ } }, 1500); music.gain = null; }
    if (!mode) return;
    const g = ctx.createGain(); g.gain.value = 1; g.connect(bus.music); music.gain = g;
    if (mode === 'menu') { music.next = now() + 0.05; music.bar = 0; scheduleMusic(); if (music.next < now() + 2 * BAR) { menuBar(g, music.bar++, music.next); music.next += BAR; } }
    if (mode === 'victory') victoryJingle(g, now() + 0.05);
  });
},
  // which arena soundscape plays: 'stadium' | 'city' | 'desert' | 'arctic' | 'space'
  ambience(mode) { ambMode = mode || 'stadium'; },
  // pick the engine voice (Garage); safe to call before sound has started
  setEngine(id) {
    eng = ENGINES[id] || ENGINES.classic;
    safe(() => { if (loops) loops.engOsc.forEach((o, i) => { o.type = eng.osc[i][0]; o.detune.value = eng.osc[i][1]; }); });
  },
  // replay start/end: quick airy swoosh
whoosh() { safe(() => noiseBurst({ dur: 0.45, vol: 0.5, filter: 'bandpass', freq: 400, freqEnd: 4000, Q: 0.7 })); },
  // Menu sounds: tiny and quiet.
  uiClick() {
    safe(() => tone(1000, { type: 'triangle', freqEnd: 700, dur: 0.06, vol: 0.08 }));
  },
  uiHover() {
    safe(() => tone(1500, { dur: 0.04, vol: 0.03 }));
  },
};
