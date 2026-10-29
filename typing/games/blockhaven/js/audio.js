// Small sound effects made on the fly with the Web Audio API (no sound files needed).
let ctx = null, master = null, noiseBuf = null, volume = 0.6, muted = false;

export const Sound = {
  start() {   // must be called after a click or key press (browser rule)
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      ctx = new AC(); master = ctx.createGain(); master.connect(ctx.destination);
      noiseBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
      const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      this.setVolume(volume);
    }
    if (ctx.state === "suspended") ctx.resume();
  },
  pause() { if (ctx && ctx.state === "running") ctx.suspend(); },
  stop() { if (ctx) { ctx.close(); ctx = null; master = null; } },
  setVolume(v) { volume = v; if (master) master.gain.value = muted ? 0 : v * 0.5; },
  setMuted(m) { muted = m; this.setVolume(volume); },

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
  door(open) { this.tone(open ? 220 : 180, 0.12, "triangle", 0.12, open ? 60 : -40); this.noise(500, 0.1, 0.2); },
  // creature sounds, quieter the farther away they are
  mob(kind, dist = 0) {
    const k = Math.max(0, 1 - dist / 28);
    if (k <= 0.02 || !ctx || ctx.state !== "running") return;
    const g = (x) => x * k, r = () => 0.85 + Math.random() * 0.3;
    switch (kind) {
      case "groan": this.tone(110 * r(), 0.6, "sawtooth", g(0.08), -40); break;
      case "rattle": for (let i = 0; i < 4; i++) setTimeout(() => this.noise(2400, 0.04, g(0.25), 6), i * 60); break;
      case "hiss": case "fuse": this.noise(5000, kind === "fuse" ? 1.4 : 0.5, g(0.3), 0.7, "highpass"); break;
      case "chitter": for (let i = 0; i < 3; i++) setTimeout(() => this.tone(900 * r(), 0.05, "square", g(0.05), 300), i * 50); break;
      case "squish": this.tone(160 * r(), 0.18, "sine", g(0.2), 120); this.noise(600, 0.12, g(0.2), 2); break;
      case "warble": this.tone(300, 0.5, "sine", g(0.06), -200); break;
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
    }
  },
  explode(dist = 0) { const k = Math.max(0.15, 1 - dist / 60); this.noise(120, 1.2, 0.9 * k, 0.6, "lowpass"); this.noise(500, 0.5, 0.5 * k, 0.8); this.tone(60, 0.8, "sine", 0.4 * k, -30); },
  levelUp() { [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => this.tone(f, 0.15, "triangle", 0.1), i * 80)); },
  xp() { this.tone(1200 + Math.random() * 600, 0.06, "sine", 0.05); }
};
