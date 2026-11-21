// Original Blockhaven music made on the fly with the Web Audio API (no sound files):
//  - createMenuTheme: the title-screen theme, a fixed, memorable melody that grows from
//    a soft piano into strings and horns, then rests and plays again.
//  - createBossScore: driving battle music for boss fights (war drums, racing strings,
//    brass and choir), which gets fiercer when the boss is badly hurt.
// Both are driven by the game loop: update() is called every frame and schedules a bar ahead.

const mtof = m => 440 * 2 ** ((m - 69) / 12);

// shared instruments ------------------------------------------------------------------
function makeKit(ctx, destination, { verbSecs = 3, wet = 0.45, dry = 0.75, compress = false } = {}) {
  const out = ctx.createGain(); out.gain.value = 0;
  let tail = out;
  if (compress) {   // keeps the loud battle music from clipping
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -16; comp.ratio.value = 4; comp.attack.value = 0.01; comp.release.value = 0.25;
    out.connect(comp); tail = comp;
  }
  tail.connect(destination);
  const bus = ctx.createGain(), verb = ctx.createConvolver(), wg = ctx.createGain(), dg = ctx.createGain();
  const len = Math.floor(ctx.sampleRate * verbSecs), ir = ctx.createBuffer(2, len, ctx.sampleRate);
  for (let c = 0; c < 2; c++) { const d = ir.getChannelData(c); let lp = 0;
    for (let i = 0; i < len; i++) { lp += ((Math.random() * 2 - 1) - lp) * 0.4; d[i] = lp * (1 - i / len) ** 2.4; } }
  verb.buffer = ir; wg.gain.value = wet; dg.gain.value = dry;
  bus.connect(dg); dg.connect(out); bus.connect(verb); verb.connect(wg); wg.connect(out);
  const noise = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
  { const d = noise.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; }
  const pianoWave = (() => { const n = 14, re = new Float32Array(n + 1), im = new Float32Array(n + 1);
    for (let k = 1; k <= n; k++) im[k] = (1 / k ** 1.25) * (k % 7 === 0 ? 0.25 : 1) * (k === 2 ? 0.75 : 1);
    return ctx.createPeriodicWave(re, im); })();
  const live = new Set();
  let disposed = false;

  function track(nodes, src, stopAt) {
    const item = { nodes, src };
    live.add(item);
    src.onended = () => { for (const n of nodes) n.disconnect(); live.delete(item); };
    src.stop(stopAt);
  }
  // every instrument takes (time, midi note, volume, length in seconds, pan)
  const inst = {
    piano(t, m, v, d, pan = 0) {
      const f = mtof(m), ring = Math.min(d + 1.5, 2 + 4 * (1 - Math.min(1, Math.max(0, (m - 36) / 52))));
      const lp = ctx.createBiquadFilter(), g = ctx.createGain(), p = ctx.createStereoPanner();
      lp.type = "lowpass"; lp.frequency.setValueAtTime(Math.min(7000, f * (4 + v * 10)), t);
      lp.frequency.exponentialRampToValueAtTime(Math.max(f * 1.6, 220), t + ring * 0.6);
      const os = [-1.5, 1.5].map(c => { const o = ctx.createOscillator(); o.setPeriodicWave(pianoWave); o.frequency.value = f; o.detune.value = c; o.connect(lp); o.start(t); return o; });
      g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(v * 0.2, t + 0.006);
      g.gain.exponentialRampToValueAtTime(v * 0.09, t + 0.35); g.gain.exponentialRampToValueAtTime(0.0001, t + ring);
      p.pan.value = pan; lp.connect(g); g.connect(p); p.connect(bus);
      track([...os, lp, g, p], os[0], t + ring + 0.05); os[1].stop(t + ring + 0.05);
    },
    // bowed strings / horns / choir: detuned saws or triangles through a soft filter with a slow swell
    pad(t, m, v, d, pan = 0, { type = "sawtooth", cut = 1400, attack = 0.4, release = 0.6, vib = 0, voices = 2 } = {}) {
      const f = mtof(m), lp = ctx.createBiquadFilter(), g = ctx.createGain(), p = ctx.createStereoPanner();
      lp.type = "lowpass"; lp.Q.value = 0.7; lp.frequency.setValueAtTime(cut * 0.5, t); lp.frequency.linearRampToValueAtTime(cut, t + attack);
      const os = [];
      for (let i = 0; i < voices; i++) {
        const o = ctx.createOscillator(); o.type = type; o.frequency.value = f;
        o.detune.value = voices > 1 ? (i / (voices - 1) - 0.5) * 14 : 0; o.connect(lp); o.start(t); os.push(o);
      }
      let lfo = null, lg = null;
      if (vib) { lfo = ctx.createOscillator(); lg = ctx.createGain(); lfo.frequency.value = 5.2; lg.gain.value = vib; lfo.connect(lg); for (const o of os) lg.connect(o.detune); lfo.start(t); }
      const end = t + d;
      g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(v, t + attack);
      g.gain.setValueAtTime(v, Math.max(t + attack, end)); g.gain.linearRampToValueAtTime(0.0001, end + release);
      p.pan.value = pan; lp.connect(g); g.connect(p); p.connect(bus);
      const stopAt = end + release + 0.05;
      track([...os, lp, g, p, ...(lfo ? [lfo, lg] : [])], os[0], stopAt);
      for (const o of os.slice(1)) o.stop(stopAt); lfo?.stop(stopAt);
    },
    // short bowed note for the racing string figures
    stab(t, m, v, d, pan = 0) {
      const f = mtof(m), o = ctx.createOscillator(), lp = ctx.createBiquadFilter(), g = ctx.createGain(), p = ctx.createStereoPanner();
      o.type = "sawtooth"; o.frequency.value = f; lp.type = "lowpass"; lp.frequency.value = Math.min(3200, f * 6); lp.Q.value = 1;
      g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(v, t + 0.012); g.gain.exponentialRampToValueAtTime(0.0001, t + d);
      p.pan.value = pan; o.connect(lp); lp.connect(g); g.connect(p); p.connect(bus); o.start(t);
      track([o, lp, g, p], o, t + d + 0.05);
    },
    // big war drum: a falling low tone plus a thud of noise
    drum(t, v, pitch = 1) {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = "sine"; o.frequency.setValueAtTime(110 * pitch, t); o.frequency.exponentialRampToValueAtTime(42 * pitch, t + 0.35);
      g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(v, t + 0.005); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.9);
      o.connect(g); g.connect(out); o.start(t); track([o, g], o, t + 0.95);   // dry, so it punches
      const n = ctx.createBufferSource(), nf = ctx.createBiquadFilter(), ng = ctx.createGain();
      n.buffer = noise; nf.type = "lowpass"; nf.frequency.value = 600 * pitch;
      ng.gain.setValueAtTime(v * 0.6, t); ng.gain.exponentialRampToValueAtTime(0.0001, t + 0.18);
      n.connect(nf); nf.connect(ng); ng.connect(bus); n.start(t, Math.random() * 0.5); track([n, nf, ng], n, t + 0.2);
    },
    snare(t, v) {
      const n = ctx.createBufferSource(), nf = ctx.createBiquadFilter(), ng = ctx.createGain();
      n.buffer = noise; nf.type = "bandpass"; nf.frequency.value = 1900; nf.Q.value = 0.8;
      ng.gain.setValueAtTime(v, t); ng.gain.exponentialRampToValueAtTime(0.0001, t + 0.16);
      n.connect(nf); nf.connect(ng); ng.connect(bus); n.start(t, Math.random() * 0.5); track([n, nf, ng], n, t + 0.18);
    },
    cymbal(t, v, d = 2.5) {
      const n = ctx.createBufferSource(), nf = ctx.createBiquadFilter(), ng = ctx.createGain();
      n.buffer = noise; n.loop = true; nf.type = "highpass"; nf.frequency.value = 5500;
      ng.gain.setValueAtTime(0.0001, t); ng.gain.linearRampToValueAtTime(v, t + 0.01); ng.gain.exponentialRampToValueAtTime(0.0001, t + d);
      n.connect(nf); nf.connect(ng); ng.connect(bus); n.start(t); track([n, nf, ng], n, t + d + 0.05);
    },
    // a soft rising swell into a new section
    swell(t, d, v) {
      const n = ctx.createBufferSource(), nf = ctx.createBiquadFilter(), ng = ctx.createGain();
      n.buffer = noise; n.loop = true; nf.type = "bandpass"; nf.Q.value = 0.7;
      nf.frequency.setValueAtTime(400, t); nf.frequency.exponentialRampToValueAtTime(5000, t + d);
      ng.gain.setValueAtTime(0.0001, t); ng.gain.exponentialRampToValueAtTime(v, t + d); ng.gain.linearRampToValueAtTime(0.0001, t + d + 0.05);
      n.connect(nf); nf.connect(ng); ng.connect(bus); n.start(t); track([n, nf, ng], n, t + d + 0.1);
    }
  };
  return {
    ctx, out, inst,
    get voices() { return live.size; },
    fade(level, secs) { out.gain.cancelScheduledValues(ctx.currentTime); out.gain.setTargetAtTime(level, ctx.currentTime, secs); },
    silence() { for (const { nodes, src } of live) { src.onended = null; try { src.stop(); } catch (e) { /* not started */ } for (const n of nodes) n.disconnect(); } live.clear(); },
    dispose() { if (disposed) return; disposed = true; this.silence(); out.disconnect(); bus.disconnect(); verb.disconnect(); wg.disconnect(); dg.disconnect(); }
  };
}

// A bar-by-bar player. song(bar, t, beat, state) schedules one bar starting at time t.
function makePlayer(kit, { bpm, gain, rest = 0, fadeIn = 1.2, fadeOut = 2.5 }) {
  const { ctx } = kit;
  let on = false, bar = 0, barAt = 0, level = 0.5, state = {}, restUntil = 0, offT = null, bars = 0;
  const beat = 60 / bpm;
  return {
    setLevel(v) { level = v; if (on) kit.fade(level * gain, 0.4); },
    update(want, st, song, length) {
      if (ctx.state !== "running") return;
      const now = ctx.currentTime;
      state = st || state;
      if (!want || level <= 0) {
        if (on) { on = false; kit.fade(0, fadeOut / 3); offT = now + fadeOut; }
        if (offT && now > offT) { kit.silence(); offT = null; }
        return;
      }
      if (!on) { on = true; offT = null; kit.fade(level * gain, fadeIn / 3); if (barAt < now) { barAt = now + 0.15; bar = 0; } }
      while (barAt < now + 0.8) {
        if (barAt < restUntil) { barAt = restUntil; continue; }
        song(bar, barAt, beat, state); bars++;
        barAt += beat * 4; bar++;
        if (length && bar >= length) { bar = 0; if (rest) { restUntil = barAt + rest; } }
      }
    },
    review() { return { on, bar, bars, voices: kit.voices, resting: ctx.currentTime < restUntil }; },
    dispose() { kit.dispose(); }
  };
}

// ===== Title theme ====================================================================
// D major, 72 beats a minute. Melody notes are [midi, beats]; chords are midi roots per bar.
const A1 = [[[69, 1.5], [66, 0.5], [74, 2]], [[73, 1], [71, 1], [69, 2]], [[67, 1], [69, 1], [71, 1.5], [69, 0.5]], [[66, 4]]];
const A2 = [[[69, 1.5], [66, 0.5], [74, 2]], [[76, 1], [78, 1], [76, 2]], [[74, 1], [73, 1], [71, 1], [73, 1]], [[74, 4]]];
const B1 = [[[71, 2], [73, 1], [74, 1]], [[76, 3], [74, 1]], [[73, 2], [71, 1], [69, 1]], [[71, 4]]];
const B2 = [[[67, 2], [69, 1], [71, 1]], [[73, 3], [76, 1]], [[74, 2], [73, 1], [71, 1]], [[69, 4]]];
// chord per bar: [root, quality] (M major, m minor)
const CA1 = [[50, "M"], [57, "M"], [55, "M"], [50, "M"]];
const CA2 = [[50, "M"], [57, "M"], [55, "M"], [50, "M"]];
const CB1 = [[59, "m"], [57, "M"], [54, "m"], [59, "m"]];
const CB2 = [[55, "M"], [57, "M"], [59, "m"], [57, "M"]];
// form: 2 intro bars, A1 A2 (piano), B1 B2 (+strings), A1 A2 (full, horns), 2 ending bars
const MENU_FORM = [["intro"], ["intro"],
  ...A1.map((m, i) => ["a", m, CA1[i], 1]), ...A2.map((m, i) => ["a", m, CA2[i], 1]),
  ...B1.map((m, i) => ["b", m, CB1[i], 2]), ...B2.map((m, i) => ["b", m, CB2[i], 2]),
  ...A1.map((m, i) => ["a", m, CA1[i], 3]), ...A2.map((m, i) => ["a", m, CA2[i], 3]),
  ["end", null, [50, "M"], 3], ["end2", null, [50, "M"], 3]];
const triad = ([root, q]) => [root, root + (q === "m" ? 3 : 4), root + 7];

export function createMenuTheme(ctx, destination) {
  const kit = makeKit(ctx, destination, { verbSecs: 3.6, wet: 0.6, dry: 0.65 });
  const { inst } = kit;
  const player = makePlayer(kit, { bpm: 72, gain: 1.8, rest: 12, fadeIn: 2, fadeOut: 2.5 });
  function song(bar, t, beat) {
    const [kind, mel, chord, level] = MENU_FORM[bar];
    if (kind === "intro") {   // strings fade in on the home chord, a few piano notes
      if (bar === 0) for (const m of triad([50, "M"])) inst.pad(t, m, 0.03, beat * 7.5, 0, { cut: 900, attack: 3, release: 2 });
      inst.piano(t + beat * 2, 62, 0.25, beat * 2, -0.2); inst.piano(t + beat * 3, 69, 0.22, beat * 2, 0.2);
      return;
    }
    const tri = triad(chord), low = chord[0] - 12;
    if (kind === "end2") return;   // let the last chord ring
    // left hand: bass note and a rolling broken chord in eighth notes
    inst.piano(t, low, 0.36, beat * 4, -0.3);
    const roll = [tri[0], tri[1], tri[2], tri[1] + 12, tri[2], tri[1], tri[0] + 12, tri[2]];
    roll.forEach((m, i) => inst.piano(t + i * beat * 0.5, m, 0.13 + (i % 2 ? 0 : 0.04), beat * 1.5, -0.1 + (i % 4) * 0.08));
    if (kind === "end") {
      { for (const m of [...tri, tri[0] + 12, 74]) inst.piano(t + beat * 0.1 * (m % 5), m, 0.25, beat * 8, 0); inst.pad(t, 50, 0.04, beat * 6, 0, { cut: 900, attack: 1, release: 3 }); inst.pad(t, 57, 0.03, beat * 6, 0, { cut: 900, attack: 1, release: 3 }); }
      return;
    }
    // melody
    let at = t;
    for (const [m, b] of mel) {
      inst.piano(at, m, 0.4, beat * b + 0.4, 0.15);
      if (level >= 3) inst.pad(at, m, 0.022, beat * b * 0.95, 0.25, { cut: 2200, attack: 0.08, release: 0.3, vib: 9 });   // violins double the tune
      if (level >= 3) inst.pad(at, m - 12, 0.02, beat * b * 0.95, -0.25, { type: "sawtooth", cut: 900, attack: 0.1, release: 0.3, voices: 1 });   // and a horn below
      at += beat * b;
    }
    // strings hold the chord from the B section on
    if (level >= 2) for (const m of tri) inst.pad(t, m, level >= 3 ? 0.03 : 0.022, beat * 3.9, 0, { cut: 1200, attack: 0.8, release: 0.8 });
    // low drum swells start each 4-bar phrase in the big section
    if (level >= 2 && (bar - 2) % 4 === 0) { inst.drum(t, level >= 3 ? 0.35 : 0.22, 0.7); if (level >= 3) inst.cymbal(t, 0.03, 3); }
    if (bar === 9 || bar === 17) inst.swell(t + beat * 2, beat * 2, 0.05);   // lift into the next section
  }
  return {
    setLevel: v => player.setLevel(v),
    update: on => player.update(on, null, song, MENU_FORM.length),
    review: () => player.review(),
    dispose: () => player.dispose()
  };
}

// ===== Boss battle ====================================================================
// D minor, 132 beats a minute. Chords per bar: i - VI - iv - V, then i - VII - VI - V.
const BOSS_CHORDS = [[50, "m"], [46, "M"], [43, "m"], [45, "M"], [50, "m"], [48, "M"], [46, "M"], [45, "M"]];
// a heroic brass tune over 8 bars: [midi, beats]
const BOSS_TUNE = [[[74, 2], [69, 1], [70, 1]], [[72, 2], [70, 1], [69, 1]], [[67, 2], [69, 1], [70, 1]], [[69, 3], [73, 1]],
  [[74, 1.5], [76, 0.5], [77, 2]], [[76, 1.5], [74, 0.5], [72, 2]], [[74, 1], [72, 1], [70, 1], [67, 1]], [[69, 4]]];

export function createBossScore(ctx, destination) {
  const kit = makeKit(ctx, destination, { verbSecs: 2.2, wet: 0.35, dry: 0.85, compress: true });
  const { inst } = kit;
  const player = makePlayer(kit, { bpm: 132, gain: 0.9, fadeIn: 0.8, fadeOut: 3 });
  function song(bar, t, beat, st) {
    const fierce = (st.frac ?? 1) < 0.35;            // the boss is badly hurt: everything gets bigger
    const section = bar < 4 ? 0 : 1 + Math.floor((bar - 4) / 8) % 3;   // 0 intro, then 1 drums+strings, 2 +brass, 3 +tune and choir
    const ch = BOSS_CHORDS[bar % 8], tri = triad(ch), root = ch[0];
    // war drums
    const pattern = fierce ? [0, 0.75, 1.5, 2, 2.75, 3, 3.5] : section === 0 ? [0, 2] : [0, 1.5, 2, 3, 3.5];
    for (const b of pattern) inst.drum(t + b * beat, b === 0 || b === 2 ? 0.55 : 0.38, b === 0 ? 0.85 : 1);
    if (section >= 2 || fierce) { inst.snare(t + beat, 0.16); inst.snare(t + beat * 3, 0.16); }
    if (fierce) for (let i = 0; i < 4; i++) inst.snare(t + beat * (3.5 + i * 0.125), 0.05 + i * 0.03);
    if (bar % 8 === 0 && bar >= 4) inst.cymbal(t, 0.05);
    // racing strings: eighth notes (sixteenths when fierce) around the chord
    const step = fierce ? 0.25 : 0.5, fig = [0, 0, 7, 0, 3, 0, 7, 10].map(x => root + (ch[1] === "m" ? x : x === 3 ? 4 : x === 10 ? 12 : x));
    for (let i = 0, b = 0; b < 4; b += step, i++) inst.stab(t + b * beat, fig[i % fig.length] + 12, section === 0 ? 0.04 : 0.055, beat * step * 0.9, (i % 2) ? 0.3 : -0.3);
    // low strings hold the root
    inst.pad(t, root - 12, 0.05, beat * 3.8, 0, { cut: 500, attack: 0.05, release: 0.2 });
    // brass chords hit at the start of each bar
    if (section >= 2) for (const m of tri) inst.pad(t, m + 12, 0.035, beat * 1.6, 0, { cut: 1500, attack: 0.04, release: 0.25 });
    // the heroic tune
    if (section === 3 || (fierce && section >= 1)) {
      let at = t;
      for (const [m, b] of BOSS_TUNE[bar % 8]) { inst.pad(at, m, 0.05, beat * b * 0.92, 0.1, { cut: 2000, attack: 0.05, release: 0.2, vib: 6 }); at += beat * b; }
    }
    // choir "aah" on the chord
    if (section === 3 || fierce) for (const m of tri) inst.pad(t, m + 12, 0.025, beat * 3.9, -0.1, { type: "triangle", cut: 1100, attack: 0.5, release: 0.5, vib: 12, voices: 3 });
    if (bar % 8 === 7) inst.swell(t + beat * 2, beat * 2, 0.06);
  }
  return {
    setLevel: v => player.setLevel(v),
    update: (on, state) => player.update(on, state, song, 0),
    review: () => player.review(),
    dispose: () => player.dispose()
  };
}
