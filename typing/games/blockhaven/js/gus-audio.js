// Original synthesized cues for the teaser. Use the main game's volume and mute preferences.
const cues = {
  raid: [[165, 0, .65, .32], [124, .21, .65, .26]],
  beacon: [[330, 0, .28, .2], [495, .12, .34, .15]],
  gate: [[96, 0, .26, .22], [57, .19, .74, .33]],
  reunion: [[196, 0, .65, .21], [294, .16, .64, .16], [392, .32, .81, .13]]
};

export function createGusAudio({ muted, volume }) {
  let context;
  let bus;

  function start() {
    try {
      const Context = window.AudioContext || window.webkitAudioContext;
      if (!Context || muted || !volume) return;
      if (!context) {
        context = new Context();
        bus = context.createGain();
        bus.connect(context.destination);
      }
      bus.gain.value = volume * 0.28;
      if (context.state !== "running") context.resume()?.catch(() => {});
    } catch {
      // The chapter remains playable when audio is unavailable.
    }
  }

  function play(cue) {
    if (context?.state !== "running") return;
    const now = context.currentTime;
    for (const [frequency, delay, duration, amplitude] of cues[cue]) {
      const time = now + delay;
      const voice = context.createOscillator();
      const envelope = context.createGain();
      voice.type = cue === "gate" ? "triangle" : "sine";
      voice.frequency.value = frequency;
      envelope.gain.setValueAtTime(.001, time);
      envelope.gain.exponentialRampToValueAtTime(amplitude, time + .035);
      envelope.gain.exponentialRampToValueAtTime(.001, time + duration);
      voice.connect(envelope).connect(bus);
      voice.onended = () => { voice.disconnect(); envelope.disconnect(); };
      voice.start(time);
      voice.stop(time + duration);
    }
  }

  function pause() {
    if (context?.state === "running") context.suspend()?.catch(() => {});
  }

  return { start, play, pause, close() { context?.close()?.catch(() => {}); } };
}
