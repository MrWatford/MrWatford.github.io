/* =========================================================
   Geometry Race: Beyond the Grid — original music for levels 7–12
   Played by the same live Web Audio synth as the original songs
   (see audio.js). Loaded on demand with the expansion scenery.
   Lead lines: digits/letters are scale degrees ("." rest, "-" hold);
   16 characters = one bar. Each section picks its drums, bass, arp,
   lead line, and can change key, scale, or chord progression.
   ========================================================= */
(function () {
  "use strict";
  const GR = window.GR;
  const SONGS = {
    // 7. Neon Overdrive — bright four-on-the-floor, a hooky square-wave chorus.
    overdrive: {
      root: 53, scale: "minor", prog: [0, 5, 3, 6], voice: { lead: "saw", arp: "square" },
      leads: {
        a: "7.7.9.a.9-7-5---7.7.9.c.a-9-7---",
        b: "c-a-9-7-9-a-c---e-c-a-9-a---7---"
      },
      sections: {
        intro: { k: "half", h: "off", b: "whole", a: "up", p: true },
        main: { k: "four", s: "clap", h: "eighth", b: "synco", a: "skip", l: "a", p: true },
        build: { k: "four", s: "busy", h: "sixteen", b: "pump", a: "updown", r: true },
        drop: { k: "four", s: "clap", h: "sixteen", b: "octave", a: "updown", l: "b", p: true },
        calm: { k: "break", h: "off", b: "walk", a: "low", l: "a", p: true },
        climax: { k: "drive", s: "busy", h: "sixteen", b: "pump", a: "updown", l: "b", p: true },
        outro: { k: "four", s: "back", h: "eighth", b: "octave", a: "up", l: "a", p: true }
      }
    },
    // 8. Tidal Circuit — flowing dorian arps and soft bell melodies over a rolling beat.
    tidal: {
      root: 50, scale: "dorian", prog: [0, 3, 4, 3], voice: { lead: "bell", arp: "sine", bass: "sub" },
      leads: {
        a: "4---2-0-2-4-7---5-4-2---0-2-4---",
        b: "7-9-a-9-7---4-5-7-5-4---2-4-5---"
      },
      sections: {
        intro: { h: "shuffle", b: "whole", a: "updown", p: true },
        main: { k: "four", s: "back", h: "shuffle", b: "walk", a: "updown", l: "a", p: true },
        drop: { k: "drive", s: "clap", h: "eighth", b: "octave", a: "updown", l: "b", p: true },
        calm: { k: "half", h: "off", b: "whole", a: "low", l: "a", p: true },
        build: { k: "four", s: "busy", h: "sixteen", b: "pump", a: "updown", r: true, p: true },
        climax: { k: "four", s: "clap", h: "sixteen", b: "octave", a: "updown", l: "b", p: true },
        outro: { k: "half", h: "shuffle", b: "whole", a: "up", l: "a", p: true }
      }
    },
    // 9. Clockwork Citadel — ticking percussion, galloping kicks, and a square-wave theme.
    clockwork: {
      root: 45, scale: "minor", prog: [0, 5, 6, 4], voice: { lead: "square", arp: "tri", bass: "square" },
      leads: {
        a: "0-4-7-4-9-7-4-7-0-4-7-4-b-9-7---",
        b: "e-c-b-9-b-c-e---c-b-9-7-9---7---"
      },
      sections: {
        intro: { t: "eighth", b: "whole", a: "low", p: true },
        main: { k: "four", s: "back", t: "eighth", b: "octave", a: "skip", l: "a", p: true },
        drop: { k: "gallop", s: "busy", t: "sixteen", h: "off", b: "pump", a: "updown", l: "b", p: true },
        calm: { k: "half", t: "off", b: "walk", a: "low", l: "a", p: true },
        build: { k: "four", s: "busy", t: "sixteen", b: "pump", r: true },
        climax: { k: "gallop", s: "busy", t: "sixteen", h: "eighth", b: "octave", a: "updown", l: "b", p: true },
        outro: { k: "four", s: "back", t: "eighth", b: "octave", a: "up", l: "a", p: true }
      }
    },
    // 10. Prism Paradox — crisp major bells that change color between sections.
    prism2: {
      root: 52, scale: "major", prog: [0, 3, 5, 4], voice: { lead: "bell", arp: "square" },
      leads: {
        a: "7-.-b-.-9-7-4---7-.-b-.-e-c-b---",
        b: "e-e-c-b-c---9-7-9-b-c-e-c-b-9---"
      },
      sections: {
        intro: { h: "eighth", b: "whole", a: "skip", p: true },
        main: { k: "four", s: "clap", h: "eighth", b: "synco", a: "skip", l: "a", p: true },
        drop: { k: "drive", s: "busy", h: "sixteen", b: "octave", a: "updown", l: "b", p: true },
        calm: { k: "break", h: "shuffle", b: "whole", a: "low", l: "a", p: true, scale: "minor", key: -3 },
        build: { k: "four", s: "busy", h: "sixteen", b: "pump", a: "updown", r: true },
        climax: { k: "drive", s: "busy", h: "sixteen", b: "pump", a: "updown", l: "b", p: true },
        outro: { k: "four", s: "back", h: "eighth", b: "octave", a: "up", l: "a", p: true }
      }
    },
    // 11. Solar Breakdown — driving minor-key alarm theme that keeps rising toward the escape.
    solar: {
      root: 48, scale: "minor", prog: [0, 6, 5, 6], voice: { lead: "saw", arp: "saw" },
      leads: {
        a: "0-0-3-.-5-.-7-5-3-.-0-.-3-5---.-",
        b: "7-7-a-9-7-5-7---a-a-c-a-9-7-a---"
      },
      sections: {
        intro: { k: "half", h: "eighth", b: "root8", a: "low", p: true },
        main: { k: "four", s: "back", h: "eighth", b: "pump", a: "skip", l: "a", p: true },
        drop: { k: "drive", s: "busy", h: "sixteen", b: "octave", a: "updown", l: "b", p: true },
        calm: { k: "break", h: "off", b: "whole", a: "low", l: "a", p: true },
        build: { k: "four", s: "busy", h: "sixteen", b: "pump", a: "updown", r: true, l: "a" },
        climax: { k: "gallop", s: "busy", h: "sixteen", b: "pump", a: "updown", l: "b", p: true, key: 2 },
        outro: { k: "drive", s: "busy", h: "sixteen", b: "octave", a: "updown", l: "b", p: true, key: 2 }
      }
    },
    // 12. Beyond the Grid — the opening motif, a boss theme, and a victory in a major key.
    finale: {
      root: 47, scale: "minor", prog: [0, 5, 3, 6], voice: { lead: "saw", arp: "square" },
      leads: {
        a: "0-.-0-.-3-.-0-.-5-.-5-.-3-.-0---7-.-7-.-9-.-7-.-a-.-9-.-7-------",
        boss: "7-7-a-.-9-7-5-7-a-c-a-9-7---5---",
        v: "4-5-7---7-9-b-9-7-5-4---2-4-0---"
      },
      sections: {
        intro: { k: "half", h: "off", b: "whole", a: "up", p: true },
        main: { k: "four", s: "back", h: "eighth", b: "synco", a: "skip", l: "a", p: true },
        drop: { k: "four", s: "clap", h: "sixteen", b: "octave", a: "updown", l: "a", p: true },
        build: { k: "four", s: "busy", h: "sixteen", b: "pump", a: "updown", r: true },
        climax: { k: "drive", s: "busy", h: "sixteen", b: "pump", a: "updown", l: "boss", p: true },
        calm: { h: "off", b: "whole", a: "low", p: true, scale: "major", prog: [0, 4, 5, 3] },
        climax2: { k: "gallop", s: "busy", h: "sixteen", b: "octave", a: "updown", l: "a", p: true, key: 2 },
        outro: { k: "four", s: "clap", h: "eighth", b: "octave", a: "up", l: "v", p: true, scale: "major", prog: [0, 4, 5, 3] }
      }
    }
  };
  Object.keys(SONGS).forEach(function (k) { GR.SONGS[k] = SONGS[k]; });
})();
