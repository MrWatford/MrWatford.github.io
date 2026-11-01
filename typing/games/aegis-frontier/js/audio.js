// Ringfall: every sound is made on the fly with Web Audio (no sound files).
// Music is a gentle generated pad that adds a pulse layer during combat.
export class Audio {
  constructor() {
    this.ctx = null; this.sfxVol = 0.7; this.musicVol = 0.4; this.muted = false;
    this.last = {};
  }
  start() {
    if (this.ctx) { this.ctx.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    this.ctx = new AC();
    this.master = this.ctx.createGain(); this.master.connect(this.ctx.destination);
    this.sfx = this.ctx.createGain(); this.sfx.connect(this.master);
    this.mus = this.ctx.createGain(); this.mus.connect(this.master);
    this.noiseBuf = this.ctx.createBuffer(1, this.ctx.sampleRate, this.ctx.sampleRate);
    const d = this.noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    this.apply();
    this.startMusic();
  }
  apply() {
    if (!this.ctx) return;
    this.master.gain.value = this.muted ? 0 : 1;
    this.sfx.gain.value = this.sfxVol;
    this.mus.gain.value = this.musicVol * 0.5;
  }
  suspend() { this.ctx && this.ctx.suspend(); }
  resume() { this.ctx && this.ctx.resume(); }

  tone(type, f0, f1, dur, vol = 0.3, delay = 0, dest) {
    const c = this.ctx, t = c.currentTime + delay;
    const o = c.createOscillator(), g = c.createGain();
    o.type = type; o.frequency.setValueAtTime(f0, t);
    if (f1 !== f0) o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0008, t + dur);
    o.connect(g); g.connect(dest || this.sfx); o.start(t); o.stop(t + dur + 0.02);
  }
  noise(dur, vol = 0.2, freq = 1200, q = 1, type = "bandpass", delay = 0) {
    const c = this.ctx, t = c.currentTime + delay;
    const s = c.createBufferSource(); s.buffer = this.noiseBuf;
    const f = c.createBiquadFilter(); f.type = type; f.frequency.value = freq; f.Q.value = q;
    const g = c.createGain(); g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0008, t + dur);
    s.connect(f); f.connect(g); g.connect(this.sfx); s.start(t, Math.random() * 0.5); s.stop(t + dur + 0.02);
  }
  // play(name, volume scale) – throttled so 20 robots firing don't get deafening
  play(name, v = 1) {
    if (!this.ctx || this.muted) return;
    const now = this.ctx.currentTime;
    const gap = { ebolt: 0.05, hit: 0.03, step: 0.05, spark: 0.04 }[name] || 0.015;
    if (this.last[name] && now - this.last[name] < gap) return;
    this.last[name] = now;
    const S = SOUNDS[name];
    if (S) S(this, v);
  }

  startMusic() {
    const c = this.ctx;
    this.combat = 0;
    const chords = [[220, 277, 330], [196, 247, 294], [175, 220, 262], [196, 247, 330]];
    let step = 0;
    this.combatGain = c.createGain(); this.combatGain.gain.value = 0; this.combatGain.connect(this.mus);
    const pad = () => {
      if (!this.ctx) return;
      const ch = chords[step % 4], t = c.currentTime;
      for (const f of ch) {
        const o = c.createOscillator(), g = c.createGain(), lp = c.createBiquadFilter();
        o.type = "triangle"; o.frequency.value = f / 2;
        lp.type = "lowpass"; lp.frequency.value = 900;
        g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.05, t + 1.5); g.gain.linearRampToValueAtTime(0.0001, t + 6.2);
        o.connect(lp); lp.connect(g); g.connect(this.mus); o.start(t); o.stop(t + 6.4);
      }
      // a few soft bell notes
      for (let k = 0; k < 3; k++) if (Math.random() < 0.6) this.tone("sine", ch[k] * 2, ch[k] * 2, 1.6, 0.03, 1 + k * 1.5, this.mus);
      // combat pulse
      for (let b = 0; b < 12; b++) {
        const o = c.createOscillator(), g = c.createGain(), tt = t + b * 0.5;
        o.type = "square"; o.frequency.value = (b % 4 === 0 ? ch[0] : ch[1]) / 4;
        g.gain.setValueAtTime(0.06, tt); g.gain.exponentialRampToValueAtTime(0.001, tt + 0.25);
        o.connect(g); g.connect(this.combatGain); o.start(tt); o.stop(tt + 0.3);
      }
      step++;
    };
    pad();
    this.musicTimer = setInterval(pad, 6000);
  }
  setCombat(on) {
    if (!this.ctx) return;
    const target = on ? 1 : 0;
    this.combat += (target - this.combat) * 0.05;
    this.combatGain.gain.value = this.combat;
  }
  stop() { clearInterval(this.musicTimer); if (this.ctx) this.ctx.close(); this.ctx = null; }
}

const SOUNDS = {
  carbine: (a, v) => { a.tone("square", 900, 300, 0.08, 0.12 * v); a.noise(0.06, 0.1 * v, 2500); },
  pistol: (a, v) => { a.tone("sawtooth", 1300, 400, 0.1, 0.14 * v); },
  pistolCharge: (a, v) => { a.tone("sawtooth", 500, 1600, 0.12, 0.18 * v); a.noise(0.2, 0.15 * v, 3000); },
  prism: (a, v) => { a.tone("sine", 2200, 300, 0.35, 0.22 * v); a.noise(0.25, 0.14 * v, 5000, 4); },
  scatter: (a, v) => { a.noise(0.22, 0.3 * v, 900, 0.7); a.tone("square", 220, 80, 0.18, 0.15 * v); },
  flux: (a, v) => { a.tone("sine", 160, 420, 0.3, 0.25 * v); },
  fluxBoom: (a, v) => { a.noise(0.5, 0.35 * v, 500, 0.6, "lowpass"); a.tone("sine", 300, 60, 0.4, 0.25 * v); },
  beam: (a, v) => { a.tone("sawtooth", 140, 150, 0.12, 0.06 * v); a.noise(0.12, 0.05 * v, 4000); },
  shock: (a, v) => { a.noise(0.12, 0.22 * v, 6000, 2); a.tone("square", 1800, 600, 0.1, 0.07 * v); },
  reload: (a, v) => { a.tone("square", 300, 500, 0.06, 0.08 * v); a.tone("square", 500, 700, 0.06, 0.08 * v, 0.12); },
  empty: (a, v) => a.tone("square", 200, 180, 0.05, 0.08 * v),
  overheat: (a, v) => { a.noise(0.6, 0.2 * v, 3000, 1, "highpass"); },
  hit: (a, v) => a.tone("triangle", 1500, 1200, 0.05, 0.08 * v),
  weakHit: (a, v) => { a.tone("triangle", 2100, 1800, 0.07, 0.11 * v); },
  shieldHit: (a, v) => a.tone("sine", 700, 900, 0.06, 0.07 * v),
  takedown: (a, v) => { a.tone("sine", 600, 200, 0.4, 0.15 * v); a.tone("triangle", 1200, 1600, 0.15, 0.08 * v, 0.05); },
  ebolt: (a, v) => a.tone("square", 520, 260, 0.09, 0.05 * v),
  hurt: (a, v) => { a.noise(0.12, 0.22 * v, 700, 1); },
  shieldBreak: (a, v) => { a.tone("sawtooth", 900, 120, 0.45, 0.2 * v); a.noise(0.4, 0.2 * v, 2000, 0.5); },
  shieldCharge: (a, v) => a.tone("sine", 300, 1200, 0.6, 0.09 * v),
  jump: (a, v) => a.noise(0.08, 0.05 * v, 900),
  land: (a, v) => a.noise(0.1, 0.09 * v, 400, 0.8, "lowpass"),
  step: (a, v) => a.noise(0.05, 0.035 * v, 600 + Math.random() * 300, 1),
  tether: (a, v) => { a.tone("square", 300, 1400, 0.15, 0.1 * v); a.noise(0.12, 0.08 * v, 3500); },
  tetherHit: (a, v) => a.tone("triangle", 1800, 1500, 0.08, 0.1 * v),
  denied: (a, v) => { a.tone("square", 220, 200, 0.08, 0.08 * v); a.tone("square", 180, 170, 0.1, 0.08 * v, 0.09); },
  scan: (a, v) => { a.tone("sine", 400, 1600, 0.7, 0.12 * v); a.tone("sine", 800, 2400, 0.5, 0.05 * v, 0.1); },
  barrier: (a, v) => { a.tone("sawtooth", 120, 480, 0.4, 0.1 * v); },
  dash: (a, v) => { a.noise(0.18, 0.18 * v, 1800, 0.8); },
  repulse: (a, v) => { a.tone("sine", 600, 90, 0.3, 0.2 * v); a.noise(0.25, 0.2 * v, 900, 0.6); },
  throw: (a, v) => a.noise(0.1, 0.08 * v, 1500),
  emp: (a, v) => { a.tone("sine", 2000, 100, 0.6, 0.18 * v); a.noise(0.6, 0.18 * v, 5000, 0.5); },
  stasis: (a, v) => { a.tone("sine", 900, 300, 1.0, 0.12 * v); },
  alert: (a, v) => { a.tone("square", 880, 880, 0.08, 0.06 * v); a.tone("square", 1180, 1180, 0.1, 0.06 * v, 0.1); },
  powerdown: (a, v) => { a.tone("sawtooth", 500, 60, 0.7, 0.1 * v); },
  pickup: (a, v) => { a.tone("sine", 660, 660, 0.08, 0.1 * v); a.tone("sine", 990, 990, 0.12, 0.1 * v, 0.08); },
  core: (a, v) => { for (let k = 0; k < 4; k++) a.tone("sine", 523 * Math.pow(1.26, k), 523 * Math.pow(1.26, k), 0.25, 0.1 * v, k * 0.09); },
  objective: (a, v) => { a.tone("triangle", 523, 523, 0.18, 0.12 * v); a.tone("triangle", 784, 784, 0.3, 0.12 * v, 0.15); },
  mission: (a, v) => { [523, 659, 784, 1047].forEach((f, k) => a.tone("triangle", f, f, 0.5, 0.12 * v, k * 0.14)); },
  ui: (a, v) => a.tone("sine", 900, 900, 0.04, 0.05 * v),
  holdDone: (a, v) => { a.tone("sine", 700, 1400, 0.25, 0.12 * v); },
  engine: (a, v) => a.tone("sawtooth", 70 + v * 60, 70 + v * 60, 0.12, 0.03),
  crash: (a, v) => { a.noise(0.4, 0.3 * v, 300, 0.7, "lowpass"); },
  telegraph: (a, v) => { a.tone("sine", 300, 900, 0.5, 0.14 * v); },
  slam: (a, v) => { a.noise(0.6, 0.35 * v, 200, 0.7, "lowpass"); a.tone("sine", 120, 40, 0.5, 0.25 * v); },
  boss: (a, v) => { a.tone("sawtooth", 110, 55, 1.2, 0.18 * v); },
  deliver: (a, v) => { a.tone("sine", 200, 300, 1.2, 0.1 * v); a.noise(1.2, 0.08 * v, 800, 0.5); },
  spark: (a, v) => a.noise(0.06, 0.06 * v, 5000, 2),
};
