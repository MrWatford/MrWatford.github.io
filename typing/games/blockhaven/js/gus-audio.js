// Original synthesized cues for the teaser. Options default to the main game's audio preferences.
const cues = {
  raid: [[165, 0, .65, .32], [124, .21, .65, .26]],
  beacon: [[330, 0, .28, .2], [495, .12, .34, .15]],
  gate: [[96, 0, .26, .22], [57, .19, .74, .33]],
  reunion: [[196, 0, .65, .21], [294, .16, .64, .16], [392, .32, .81, .13]],
  ruins: [[103, 0, 1.62, .16], [139, .38, 1.33, .09], [92, .83, 1.2, .13]],
  discovery: [[164, 0.15, 1.12, .15], [220, .48, .88, .08]],
  footfall: [[78, 0, .31, .19], [101, .32, .27, .13], [76, .67, .34, .14]],
  rescue: [[147, 0, .94, .14], [196, .26, 1.05, .10], [247, .79, 1.1, .12]],
  forge: [[114, .18, .24, .22], [455, .18, .2, .14], [138, .72, .26, .2], [536, .72, .21, .13]],
  "story-forge": [[94, 1.12, .3, .23], [392, 1.14, .48, .16], [118, 2.10, .3, .24], [466, 2.12, .41, .13]],
  reforged: [[220, 0, .37, .23], [330, .12, .4, .17], [440, .26, .59, .15]],
  "guard-break": [[123, 0, .24, .22], [370, .035, .22, .2], [548, .085, .25, .13]],
  counterweights: [[180, 0, .35, .27], [342, .04, .24, .17], [223, .17, .32, .24], [451, .21, .22, .15]],
  "wagon-stop": [[105, 0, .32, .32], [237, .06, .32, .2], [142, .12, .27, .24]],
  freight: [[131, 0, .95, .17], [196, .24, .95, .14], [262, .51, 1.08, .12], [392, .85, .86, .11]]
};

export function createGusAudio(settings) {
  let context;
  let bus;

  function start() {
    try {
      const { muted, volume } = settings;
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
