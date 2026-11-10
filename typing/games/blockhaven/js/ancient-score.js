// Original procedural Buried King motif. Driven by encounter age, never timers.
// A dropped frame skips old beats rather than scheduling a burst of catch-up audio.
export function createAncientScore(ctx, destination) {
  const voices = new Set(), bus = ctx.createGain();
  bus.gain.value = .55;
  bus.connect(destination);
  let identity = null, beat = -1, disposed = false;
  const motif = [0, 7, 3, 10, 0, 5, 3, 7];
  function voice(frequency, duration, level, type = "sine", slide = 0) {
    if (disposed || voices.size >= 24) return;
    const oscillator = ctx.createOscillator(), gain = ctx.createGain(), now = ctx.currentTime;
    const item = { oscillator, gain };
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, now);
    if (slide) oscillator.frequency.exponentialRampToValueAtTime(frequency + slide, now + duration);
    gain.gain.setValueAtTime(.0001, now);
    gain.gain.linearRampToValueAtTime(level, now + .025);
    gain.gain.exponentialRampToValueAtTime(.0001, now + duration);
    oscillator.connect(gain); gain.connect(bus); voices.add(item);
    oscillator.onended = () => { oscillator.disconnect(); gain.disconnect(); voices.delete(item); };
    oscillator.start(now); oscillator.stop(now + duration + .02);
  }
  function clear() {
    for (const { oscillator, gain } of voices) {
      oscillator.onended = null;
      oscillator.stop(); oscillator.disconnect(); gain.disconnect();
    }
    voices.clear();
  }
  return {
    update(state) {
      if (disposed) return;
      if (!state || !Number.isFinite(state.age) || state.age < 0) {
        clear(); identity = null; beat = -1; return;
      }
      if (ctx.state !== "running") return;
      if (identity !== state.id) { clear(); identity = state.id; beat = -1; }
      const phase = Math.max(1, Math.min(5, Math.floor(state.phase) || 1));
      // The awakening holds a spacious low chord; combat tightens to 96 BPM.
      const step = Math.floor(state.age / .625);
      if (step === beat) return;
      if (step < beat) clear();
      beat = step;
      if (phase === 1) {
        if (step % 4 === 0) for (const semitone of [0, 7, 12])
          voice(55 * 2 ** (semitone / 12), .8, .045, "triangle");
        return;
      }
      const note = motif[step % motif.length];
      voice(110 * 2 ** (note / 12), .42, .045, "triangle");
      if (step % 2 === 0) {
        voice(55, .48, .065);
        voice(85, .16, .07, "sine", -45);
      }
      if (phase >= 3 && step % 4 === 2) voice(220 * 2 ** (note / 12), .65, .025);
      if (phase >= 4) voice(330 * 2 ** (note / 12), .19, .018, "triangle");
      if (phase === 5 && step % 4 === 0) voice(440, .7, .025);
    },
    dispose() {
      if (disposed) return;
      clear(); bus.disconnect(); disposed = true; identity = null;
    },
    get voiceCount() { return voices.size; }
  };
}
