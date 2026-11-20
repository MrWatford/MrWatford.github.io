// Original calm background music, made on the fly with the Web Audio API (no sound files).
// Each piece is composed fresh from a random seed: a soft, echoing piano playing slow,
// peaceful chords with a few unhurried melody notes and plenty of space between them.
// Between pieces there is a long stretch of silence, so the music feels like part of the world.
// Driven by the game loop: update() is called every frame and schedules a little ahead.

const LOOKAHEAD = 0.6;          // seconds of notes scheduled ahead of the clock
const FIRST_WAIT = [6, 14];     // seconds before the first piece after entering a world
const GAP = [50, 140];          // seconds of silence between pieces
const MAX_VOICES = 18;          // notes ringing at once (each note is 2 strings + a hammer tap)

const MODES = {
  major:  [0, 2, 4, 5, 7, 9, 11],
  lydian: [0, 2, 4, 6, 7, 9, 11],
  dorian: [0, 2, 3, 5, 7, 9, 10]
};
// chord roots as scale degrees (0 = home chord); slow, gentle movement
const PROGRESSIONS = {
  major:  [[0, 3, 0, 3], [0, 5, 3, 0], [3, 0, 3, 4], [0, 2, 3, 0], [5, 3, 0, 0], [0, 3, 5, 3]],
  lydian: [[0, 1, 0, 1], [0, 1, 6, 0], [0, 5, 1, 0]],
  dorian: [[0, 3, 0, 3], [0, 6, 3, 0]]
};

function rng(seed) {   // small seeded random (mulberry32)
  let a = seed >>> 0;
  return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
const mtof = m => 440 * 2 ** ((m - 69) / 12);

// Build one piece as a list of note events { t, m, v, d, kind } (t in seconds from the start).
export function composePiece(seed) {
  const r = rng(seed), pick = a => a[Math.floor(r() * a.length)];
  const modeName = pick(["major", "major", "major", "major", "lydian", "lydian", "dorian"]);
  const scale = MODES[modeName];
  const root = 48 + pick([0, 2, 4, 5, 7]);                     // C3 .. G3
  const prog = pick(PROGRESSIONS[modeName]);
  const beat = 60 / (46 + r() * 14);                           // 46-60 beats per minute
  const bars = 4 * (3 + Math.floor(r() * 3));                  // 12, 16 or 20 bars
  const withPad = r() < 0.4;
  const deg = (d, oct = 0) => {                                // scale degree -> MIDI note
    const o = Math.floor(d / 7); d = ((d % 7) + 7) % 7;
    return root + scale[d] + 12 * (o + oct);
  };
  const events = [];
  const add = (t, m, v, d, kind = "piano") => events.push({ t: Math.max(0, t), m, v, d, kind });
  const human = () => (r() - 0.5) * 0.06;

  let mel = 9 + Math.floor(r() * 4);                           // a degree in the upper octave
  // where chord notes fall inside a 4-beat bar: mostly just one or two
  const shapes = [[0], [0, 2], [0, 1.5], [0, 2, 3], [0, 0.5, 1]];
  let t = 0;
  for (let b = 0; b < bars; b++) {
    const last = b === bars - 1;
    const slow = 1 + Math.max(0, b - (bars - 3)) * 0.15;       // gentle slowing at the end
    const bt = beat * slow, chordDeg = last ? 0 : prog[Math.floor(b / 2) % prog.length];   // each chord lasts 2 bars
    const sparse = b < 2 || last;                              // the opening only sets the mood
    // soft colour notes: add the 7th or 9th for a dreamy sound
    const tones = [0, 4, 2 + 7, r() < 0.5 ? 6 : 8].map(x => deg(chordDeg + x));
    const newChord = b % 2 === 0;
    if (newChord || last) add(t + human(), deg(chordDeg, -1), 0.42, bt * 7);   // low bass note
    if (last) tones.forEach((m, i) => add(t + i * 0.14, m, 0.28, bt * 7));     // a slowly rolled final chord
    else if (newChord || r() < 0.5) {
      const shape = pick(shapes);
      shape.forEach((s, i) => add(t + s * bt + human(), tones[i % tones.length], 0.2 + r() * 0.08, bt * 4));
    }
    // melody: a few notes, often resting for a whole bar
    if (!sparse && r() < 0.65) {
      const slots = pick([[0], [0, 2], [1], [0, 3], [2], [0, 1.5]]);
      for (const s of slots) {
        if (r() < 0.2) continue;                               // a breath
        if (s % 2 === 0 && r() < 0.6) {                        // strong beats lean on the chord
          const targets = [0, 2, 4].map(x => chordDeg + x + 7);
          mel = targets.reduce((a, c) => Math.abs(c - mel) < Math.abs(a - mel) ? c : a);
        } else mel += pick([-2, -1, -1, 1, 1, 2]);
        mel = Math.max(7, Math.min(15, mel));
        add(t + s * bt + human(), deg(mel), 0.3 + r() * 0.1, bt * 4);
      }
    }
    if (withPad && newChord) { add(t, deg(chordDeg), 0.035, bt * 8.6, "pad"); add(t, deg(chordDeg + 4), 0.025, bt * 8.6, "pad"); }
    t += bt * 4;
  }
  events.sort((a, b) => a.t - b.t);
  return { events, length: t + beat * 8, mode: modeName, root, bpm: Math.round(60 / beat), bars, withPad };
}

// A piano-like tone: many harmonics that fade from bright to mellow, like a real string.
function pianoWave(ctx) {
  const n = 14, re = new Float32Array(n + 1), im = new Float32Array(n + 1);
  for (let k = 1; k <= n; k++) im[k] = (1 / k ** 1.25) * (k % 7 === 0 ? 0.25 : 1) * (k === 2 ? 0.75 : 1);   // hammer near the string end mutes the 7th
  return ctx.createPeriodicWave(re, im);
}

export function createCalmScore(ctx, destination) {
  const out = ctx.createGain(); out.gain.value = 0;
  out.connect(destination);
  // a large soft hall made of decaying noise gives the piano its dreamy echo
  const verb = ctx.createConvolver(), wet = ctx.createGain(), dry = ctx.createGain(), tone = ctx.createBiquadFilter();
  const len = Math.floor(ctx.sampleRate * 4.5), ir = ctx.createBuffer(2, len, ctx.sampleRate);
  for (let c = 0; c < 2; c++) { const d = ir.getChannelData(c); let lp = 0;
    for (let i = 0; i < len; i++) { lp += ((Math.random() * 2 - 1) - lp) * 0.35; d[i] = lp * (1 - i / len) ** 2.2 * (i < 400 ? i / 400 : 1); } }
  verb.buffer = ir;
  tone.type = "lowpass"; tone.frequency.value = 3200; tone.Q.value = 0.3;
  wet.gain.value = 0.75; dry.gain.value = 0.6;
  tone.connect(dry); dry.connect(out);
  tone.connect(verb); verb.connect(wet); wet.connect(out);
  const wave = pianoWave(ctx);
  const thump = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.05), ctx.sampleRate);
  { const d = thump.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length) ** 3; }

  const voices = new Set();
  let level = 0.5, playing = false, piece = null, start = 0, idx = 0, nextAt = 0, disposed = false, count = 0;

  function voice(ev, when) {
    if (voices.size >= MAX_VOICES) return;
    const f = mtof(ev.m), g = ctx.createGain(), srcs = [];
    const pan = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
    if (pan) pan.pan.value = Math.max(-0.5, Math.min(0.5, (ev.m - 60) / 40));   // low notes left, high notes right
    const end = when + ev.d;
    let stopAt;
    if (ev.kind === "pad") {
      const o = ctx.createOscillator(), lp = ctx.createBiquadFilter();
      o.type = "triangle"; o.frequency.value = f; lp.type = "lowpass"; lp.frequency.value = 900;
      o.connect(lp); lp.connect(g); srcs.push(o);
      const fade = Math.min(3.5, ev.d * 0.4);
      g.gain.setValueAtTime(0.0001, when);
      g.gain.linearRampToValueAtTime(ev.v, when + fade);
      g.gain.setValueAtTime(ev.v, end - fade);
      g.gain.linearRampToValueAtTime(0.0001, end);
      stopAt = end + 0.05;
    } else {
      // two slightly out-of-tune strings, through a filter that closes as the note fades:
      // bright when struck, mellow as it rings (lower notes ring longer, like a real piano)
      const ring = 2.2 + 4.5 * (1 - Math.min(1, Math.max(0, (ev.m - 36) / 52)));
      const lp = ctx.createBiquadFilter(); lp.type = "lowpass"; lp.Q.value = 0.5;
      const bright = Math.min(7000, f * (4 + ev.v * 10));
      lp.frequency.setValueAtTime(bright, when);
      lp.frequency.exponentialRampToValueAtTime(Math.max(f * 1.6, 220), when + ring * 0.6);
      for (const cents of [-1.6, 1.6]) {
        const o = ctx.createOscillator(); o.setPeriodicWave(wave);
        o.frequency.value = f; o.detune.value = cents + (Math.random() - 0.5);
        o.connect(lp); srcs.push(o);
      }
      lp.connect(g);
      // the felt hammer: a tiny muffled tap at the start of the note
      const h = ctx.createBufferSource(), hf = ctx.createBiquadFilter(), hg = ctx.createGain();
      h.buffer = thump; hf.type = "lowpass"; hf.frequency.value = Math.min(2500, f * 3); hg.gain.value = ev.v * 0.05;
      h.connect(hf); hf.connect(hg); hg.connect(g); srcs.push(h);
      const peak = ev.v * 0.2;
      g.gain.setValueAtTime(0.0001, when);
      g.gain.linearRampToValueAtTime(peak, when + 0.006);
      g.gain.exponentialRampToValueAtTime(peak * 0.45, when + 0.35);   // the quick first drop of a struck string
      g.gain.exponentialRampToValueAtTime(0.0001, when + ring);        // then the long, slow fade
      stopAt = when + ring + 0.05;
    }
    if (pan) { g.connect(pan); pan.connect(tone); } else g.connect(tone);
    const item = { srcs, g, pan };
    voices.add(item);
    srcs[0].onended = () => { for (const s of srcs) s.disconnect(); g.disconnect(); pan?.disconnect(); voices.delete(item); };
    for (const s of srcs) { s.start(when); s.stop(stopAt); }
  }
  function silenceAll() {
    for (const { srcs, g, pan } of voices) { srcs[0].onended = null; for (const s of srcs) { try { s.stop(); } catch (e) { /* not started */ } s.disconnect(); } g.disconnect(); pan?.disconnect(); }
    voices.clear();
  }
  // after the fade-out, cut any long notes that are still ringing
  function silenceSoon() { setTimeout(() => { if (!playing && !disposed) silenceAll(); }, 3500); }
  const between = ([a, b]) => a + Math.random() * (b - a);

  return {
    setLevel(v) { level = v; if (playing) out.gain.setTargetAtTime(level * 2.4, ctx.currentTime, 0.4); },
    // on = should music be allowed right now (in a calm place, not paused, not in a boss fight)
    update(on) {
      if (disposed || ctx.state !== "running") return;
      const now = ctx.currentTime;
      if (!on || level <= 0) {
        if (playing) { playing = false; out.gain.setTargetAtTime(0, now, 0.8); if (piece) nextAt = now + between([12, 30]); piece = null; silenceSoon(); }
        return;
      }
      if (!playing) { playing = true; out.gain.setTargetAtTime(level * 2.4, now, 0.6); if (!nextAt) nextAt = now + between(FIRST_WAIT); }
      if (!piece) {
        if (now < nextAt) return;
        piece = composePiece((Math.random() * 2 ** 32) >>> 0); start = now + 0.1; idx = 0; count++;
      }
      const ev = piece.events;
      while (idx < ev.length && start + ev[idx].t < now + LOOKAHEAD) {
        const when = start + ev[idx].t;
        if (when > now - 0.1) voice(ev[idx], Math.max(now, when));   // skip notes a long hitch left behind
        idx++;
      }
      if (idx >= ev.length && now > start + piece.length) { piece = null; nextAt = now + between(GAP); }
    },
    // for testing: start the next piece right away
    playNow() { piece = null; nextAt = ctx.currentTime || 0.001; },
    review() {
      return { playing, level, voices: voices.size, pieces: count, inPiece: !!piece,
        secondsLeft: piece ? Math.max(0, Math.round(start + piece.length - ctx.currentTime)) : 0,
        nextIn: piece ? 0 : Math.max(0, Math.round(nextAt - ctx.currentTime)),
        piece: piece && { mode: piece.mode, root: piece.root, bpm: piece.bpm, bars: piece.bars, pad: piece.withPad } };
    },
    dispose() {
      if (disposed) return;
      disposed = true; silenceAll();
      out.gain.cancelScheduledValues(ctx.currentTime); out.gain.value = 0;
      out.disconnect(); tone.disconnect(); verb.disconnect(); wet.disconnect(); dry.disconnect();
    }
  };
}
