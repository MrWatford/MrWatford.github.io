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
  door(open) { this.tone(open ? 220 : 180, 0.12, "triangle", 0.12, open ? 60 : -40); this.noise(500, 0.1, 0.2); }
};
