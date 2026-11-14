/* =========================================================
   Geometry Race: Beyond the Grid — expansion levels 7–12
   Same builder as the original six (see levels.js): positions are
   in blocks, b.X(beat) turns a music beat into a position, and
   b.J(beat) places a spike so a jump ON that beat clears it.
   Every moving part (machinery, beams, pulses, the boss) is tied
   to the level clock, so restarts and checkpoints always match.
   ========================================================= */
(function () {
  "use strict";
  const GR = window.GR;
  const make = GR.makeLevel;
  const BTG = [];

  // ---------- shared helpers ----------
  // A tunnel built from thin columns: floorFn(x) / ceilFn(x) give the opening. Columns are narrow
  // enough that sliding along a rising wall stays smooth (each step is below the landing snap).
  function corridor(b, x0, x1, step, floorFn, ceilFn, lo, hi, style) {
    for (let x = x0; x < x1 - 1e-6; x += step) {
      const xm = x + step / 2, f = floorFn(xm), c = ceilFn(xm);
      if (f > lo + 0.01) b.add({ t: "block", x: x, y: lo, w: step, h: f - lo, st: style });
      if (c < hi - 0.01) b.add({ t: "block", x: x, y: c, w: step, h: hi - c, st: style });
    }
  }
  // A beat-synced gate whose opening slides between two heights (holds, glides, holds, glides back).
  // The parts are solid and clipped to the zone [lo, hi] when drawn.
  function slideGate(b, x, w, lo, hi, gap, cA, cB, beats, phase, style) {
    const mid = (cA + cB) / 2, amp = (cB - cA) / 2, mv = b.mvs(0, amp, beats, phase, 0.2);
    b.add({ t: "block", x: x, y: lo - Math.abs(amp) - 1, w: w, h: mid - gap / 2 - (lo - Math.abs(amp) - 1), mv: mv, clip: [lo, hi], st: style });
    b.add({ t: "block", x: x, y: mid + gap / 2, w: w, h: hi + Math.abs(amp) + 1 - (mid + gap / 2), mv: mv, clip: [lo, hi], st: style });
  }
  function smooth(k) { k = Math.max(0, Math.min(1, k)); return k * k * (3 - 2 * k); }

  // =========================================================
  // 7. NEON OVERDRIVE — Medium. Cube, robot, speed changes.
  // 128 BPM. Normal → fast (beat 64) → very fast (beat 140).
  // =========================================================
  BTG.push(make({
    id: "neon-overdrive", name: "Neon Overdrive", pack: "btg", num: 7, preview: 0.42, difficulty: "Medium", stars: 3, bpm: 128, endBeat: 176,
    speeds: [[64, 2, 2], [140, 3, 4]], target: [75, 90],
    palette: { sky1: "#03061a", sky2: "#0b1846", ground: "#081233", line: "#2de2ff", block: "#0c1a4d", accent: "#ff4fd8", glow: "#2de2ff", far: "#3d7bff" },
    song: "overdrive", scenery: "neon",
    sections: [[0, "intro"], [4, "main"], [8, "build"], [16, "drop"], [25, "calm"], [29, "main"], [35, "climax"], [42, "outro"]],
    blurb: "Race across a glowing city. Robot jumps and two speed boosts.",
    reward: { kind: "icon", name: "Neon Circuit" },
    tokenHints: ["Take the high rooftops after the staircase", "A careful medium robot jump under the hanging spikes", "Hit the high orb before the last rooftops"]
  }, function (b) {
    const X = b.X.bind(b), J = b.J.bind(b);
    b.text(3, 3.6, "Neon Overdrive");
    // --- Opening: forgiving cube jumps on the beat to warm up.
    b.sp(J(8)); b.sp(J(11)); b.sp(J(13)); b.sps(J(15, 2), 2);
    // Staircase up to the rooftops.
    b.blk(X(17) + 2.6, 0, 5.2, 1);
    b.blk(X(18) + 2.6, 0, 5.2, 2);
    b.blk(X(19) + 2.6, 0, 5.4, 3);
    // Token 1 route: jump off the top step onto the high rooftops.
    b.blk(X(20) + 4.2, 4.2, 5.4, 0.6);
    b.blk(X(21) + 6.4, 4.2, 4.6, 0.6); b.small(X(21) + 7.6, 4.8);
    b.token(X(22) + 7.2, 6.0);
    // Main route underneath: steady jumps, then the rooftop runners drop back down here.
    b.sp(J(22)); b.sps(J(25, 2), 2);
    // Alternating short and long gaps.
    b.text(X(25) + 4, 3.4, "Short gap... long gap");
    b.pit(X(27) + 1.8, X(27) + 3.8);
    b.pit(X(29) + 1.4, X(29) + 4.6);
    b.pit(X(30) + 2.4, X(30) + 4.4);
    b.blk(X(31) + 2.8, 0, 3, 1);
    b.pit(X(32) + 0.9, X(32) + 4.1);
    b.sp(J(34));
    // --- Robot.
    b.text(X(34) + 3, 3.8, "Robot: hold longer to jump higher");
    b.mode(X(36) + 1, 1.5, "robot");
    b.blk(X(38) + 3, 0, 4, 1);
    b.blk(X(40) + 3, 0, 4.6, 3);                       // tall tower: hold all the way
    b.sps(X(41) + 2.6, 2);
    // Low ceiling: little taps only.
    b.blk(X(43) + 2, 2.4, X(47) - X(43), 0.6);
    b.small(J(44)); b.small(J(45)); b.small(J(46));
    b.blk(X(48) + 3, 0, 3, 2); b.blk(X(49) + 3, 0, 3, 3); b.sps(X(50) + 1.4, 2);
    // Token 2: a medium jump between the small spikes and the hanging spikes.
    b.blk(X(52) + 1, 4.4, 9, 0.6); b.csps(X(52) + 2, 7, 4.4);
    b.small(J(53)); b.token(X(53) + 2.3, 2.45); b.small(J(54));
    b.sps(J(56, 2), 2);
    b.blk(X(57) + 3, 0, 4, 2); b.sps(X(58) + 2.4, 2);
    // Runway, then the first speed boost (beat 64): the city lights switch on.
    b.text(X(60), 4.0, "Speed up!");
    // Fast robot.
    b.blk(X(67) + 2.6, 0, 6, 1); b.blk(X(68) + 2.6, 0, 6, 2); b.blk(X(69) + 2.6, 0, 6, 3);
    b.sps(X(70) + 2.6, 3);
    b.blk(X(72) + 2, 2.3, X(75) - X(72), 0.7); b.small(J(73)); b.small(J(74));
    b.pad(X(76) + 1); b.blk(X(76) + 5, 0, 5, 4); b.sps(X(77) + 4.2, 3);
    b.blk(X(79) + 2, 0, 3, 2); b.sps(X(79) + 5, 2); b.blk(X(80) + 2.4, 0, 3, 3);
    b.sps(X(81) + 1.4, 2);
    b.sp(J(83)); b.sps(J(84.5, 2), 2);
    b.blk(X(86) + 2, 0, 4, 1.5); b.blk(X(87) + 3, 0, 4, 3); b.sps(X(88) + 1.4, 3);
    b.small(J(90)); b.small(J(91)); b.sps(J(92, 2), 2);
    b.mode(X(95) + 1, 1.5, "cube");
    // --- Cube with pads and orbs (fast).
    b.sp(J(98)); b.sps(J(99, 2), 2);
    b.pad(X(101) + 1); b.blk(X(101) + 4.5, 0, 6, 3); b.sps(X(102) + 4.6, 2);
    b.pit(X(104) + 1.5, X(104) + 13); b.orb(X(104) + 6.2, 2.6);
    b.sps(J(107, 2), 2);
    b.pad(X(109) + 1, 0, "pink"); b.blk(X(109) + 3, 0, 3, 1.5);
    b.pad(X(110) + 2.4, 1.5, "pink"); b.blk(X(110) + 4.4, 0, 3, 2.5);
    b.sps(X(111) + 4.4, 3);
    b.orb(X(112) + 2.6, 2.8); b.sps(X(112) + 0.6, 5);
    b.sp(J(115)); b.sp(J(116));
    // Token 3: the optional high orb leads over a detour roof; the main route stays low.
    b.pad(X(118) + 1); b.pit(X(118) + 2.6, X(118) + 14);
    b.orb(X(118) + 7.4, 3.2);
    b.orb(X(119) + 4.2, 5.2);
    b.token(X(120) + 1.8, 7.5);
    b.blk(X(120) + 4.6, 6.0, 6, 0.6);
    b.sps(J(123, 2), 2); b.sp(J(124.5));
    b.blk(X(126) + 3, 0, 5, 1); b.blk(X(127) + 3, 0, 5, 2);
    b.sps(X(128) + 3, 3);
    b.sp(J(131)); b.sps(J(132, 2), 2);
    b.text(X(135), 4.2, "Top speed!");
    // --- Rooftop run (very fast from beat 140).
    let x = X(142) + 1;
    const roofs = [[7, 1], [6, 1.5], [8, 1], [5, 2], [7, 2], [6, 1], [9, 1.5], [6, 2.5], [7, 1.5]];
    roofs.forEach(function (r, i) {
      b.blk(x, 0, r[0], r[1]);
      if (i === 2 || i === 6) b.small(x + r[0] / 2, r[1]);
      x += r[0];
      b.pit(x, x + 3.2);
      x += 3.2;
    });
    b.sps(J(160, 2), 2); b.sp(J(161.5));
    // The final leap: a pad throws you through the giant gate.
    b.blk(X(164) + 2, 0, 8, 1); b.blk(X(165) + 3, 0, X(167) + 1.6 - (X(165) + 3), 2);
    b.pad(X(167) + 0.5, 2); b.pit(X(167) + 1.6, X(167) + 16);
    b.orb(X(167) + 7.2, 6.0);
  }));

  // =========================================================
  // 8. TIDAL CIRCUIT — Medium–Hard. Ship, UFO, gravity, moving gates.
  // 120 BPM (one beat = 5.2 blocks). Fast for the final ascent.
  // =========================================================
  BTG.push(make({
    id: "tidal-circuit", name: "Tidal Circuit", pack: "btg", num: 8, preview: 0.15, difficulty: "Medium–Hard", stars: 4, bpm: 120, endBeat: 176,
    startMode: "ship", speeds: [[140, 2, 5]], target: [80, 95],
    palette: { sky1: "#01142b", sky2: "#03365a", ground: "#032a3d", line: "#2dffd8", block: "#06405a", accent: "#9b7bff", glow: "#2dffd8", far: "#1a8fa6" },
    song: "tidal", scenery: "tidal",
    sections: [[0, "intro"], [3, "main"], [8, "drop"], [10, "calm"], [18, "main"], [26, "drop"], [35, "build"], [36, "climax"], [42, "outro"]],
    moments: { creature: [14, 40] },
    blurb: "Fly through glass tunnels under the sea. Ship, UFO, and flipped gravity.",
    reward: { kind: "trail", name: "Bubbles" },
    tokenHints: ["Squeeze into the upper ship passage", "Tap steadily through the high side chamber", "Dip low near a moving gate, then climb fast"]
  }, function (b) {
    const X = b.X.bind(b);
    // ===== Zone A: ship in a wide tunnel (floor 0, ceiling 10).
    b.zone(-40, X(41) + 2, 0, 10);
    b.text(3, 6.4, "Tidal Circuit");
    b.text(3, 5.2, "Ship: hold to rise, let go to sink");
    b.gate(X(6) + 2, 2, 0, 10, 3, 8);
    b.gate(X(8) + 2, 2, 0, 10, 4.5, 10);
    b.gate(X(10) + 2, 2, 0, 10, 0, 5.5);
    b.gate(X(12) + 2, 2, 0, 10, 2.5, 7.5, true);
    // Curved glass tunnel (the sea creature swims past behind it).
    const c0 = X(14) + 2, c1 = X(30);
    const cy = function (x) { const k = (x - c0) / (c1 - c0); return 5 + 2.4 * Math.sin(k * Math.PI * 3) * smooth(k * 4) * smooth((1 - k) * 4); };
    const gp = function (x) { const k = (x - c0) / (c1 - c0); return 4.6 - 0.8 * Math.sin(k * Math.PI); };
    corridor(b, c0, c1, 0.5, function (x) { return cy(x) - gp(x) / 2; }, function (x) { return cy(x) + gp(x) / 2; }, 0, 10, "glass");
    // Token 1: the upper passage (narrow, with saws) or the wide lower passage.
    b.blk(X(31) + 2, 5.6, X(38) - X(31), 1.2);
    b.sps(X(32) + 3, 2, 6.8); b.csps(X(33) + 2, 2, 10);
    b.saw(X(34) + 3, 8.4, 0.8, b.mv(0, 0.6, 2));
    b.token(X(35) + 3, 8.2);
    b.sps(X(36) + 3, 2, 6.8);
    b.gate(X(33) + 2, 1.5, 0, 5.6, 1.2, 4.6, true);
    b.saw(X(35) + 2, 1.2, 1.0);
    b.gate(X(37) + 1, 1.5, 0, 5.6, 1.6, 5.6, true);
    // Funnel down to the UFO portal.
    b.blk(X(38) + 3, 7.5, 3, 2.5); b.blk(X(38) + 6, 5.4, 3, 4.6); b.blk(X(39) + 4, 3.4, X(41) + 2 - (X(39) + 4), 6.6);
    b.mode(X(40) + 3, 1.6, "ufo");
    // ===== Zone B: UFO chamber of suspended platforms (floor 0, ceiling 10).
    b.zone(X(41) + 2, X(101) + 2, 0, 10);
    b.text(X(41) + 3, 6, "UFO: tap for each hop");
    b.sps(X(43), Math.floor(X(100) - X(43)));
    const plats = [[44, 2.4, 4], [46, 4.0, 3], [48, 2.8, 3], [50, 5.0, 4], [52, 3.2, 3], [54, 4.6, 3]];
    plats.forEach(function (p) { b.blk(X(p[0]) + 2, p[1], p[2], 0.6); });
    b.saw(X(47) + 1, 7.6, 1.0); b.saw(X(51) + 2, 8.2, 1.0); b.csps(X(53) + 1, 3, 10);
    // Token 2: a side chamber up top. Tap steadily to stay above its spiked floor.
    b.blk(X(56) + 3, 5.8, X(64) - X(56) - 3, 0.5); b.smalls(X(56) + 3, Math.floor(X(64) - X(56) - 3), 6.3);
    b.saw(X(58) + 3, 9.5, 0.55); b.saw(X(60) + 4, 9.5, 0.55);
    b.token(X(61) + 2, 8.0);
    b.gate(X(57) + 2, 1.5, 0, 5.8, 1.8, 5.4);
    b.gate(X(59) + 2, 1.5, 0, 5.8, 0.8, 4.4);
    b.gate(X(61) + 2, 1.5, 0, 5.8, 2.0, 5.6);
    b.gate(X(63) + 2, 1.5, 0, 5.8, 1.0, 4.6);
    b.blk(X(65) + 2, 3.2, 3, 0.6); b.saw(X(66) + 3, 7.4, 1.0);
    b.blk(X(67) + 2, 2.6, 3, 0.6); b.blk(X(69) + 1, 4.2, 3, 0.6);
    // Gravity reversals in roomy, clearly marked spaces.
    b.text(X(70) + 2, 6.4, "Gravity flips: taps hop you DOWN");
    b.grav(X(72) + 2, 5, "up");
    b.csps(X(74) + 2, 3, 10); b.blk(X(76) + 2, 5.6, 4, 0.6); b.csps(X(77) + 3, 3, 10);
    b.gate(X(79) + 2, 1.5, 3, 10, 4, 7.6);
    b.blk(X(81) + 2, 7.0, 3, 0.6); b.csps(X(82) + 2, 2, 10);
    b.gate(X(83) + 2, 1.5, 3, 10, 5.4, 9.0);
    b.grav(X(86) + 2, 5, "down");
    b.blk(X(88) + 2, 3.0, 4, 0.6); b.saw(X(89) + 2, 7.4, 0.9);
    b.gate(X(91) + 2, 1.5, 0, 10, 3.2, 7.0);
    b.blk(X(93) + 2, 4.0, 3, 0.6); b.gate(X(95) + 2, 1.5, 0, 10, 2.0, 5.8);
    // Funnel to the ship.
    b.blk(X(97) + 2, 7.5, 3, 2.5); b.blk(X(97) + 5, 5.4, 3, 4.6); b.blk(X(98) + 3, 3.4, X(101) + 2 - (X(98) + 3), 6.6);
    b.mode(X(100), 1.6, "ship");
    // ===== Zone C: ship through beat-synced moving gates (floor 0, ceiling 10).
    b.zone(X(101) + 2, X(141), 0, 10);
    b.text(X(101) + 2, 6.4, "Gates move on the beat. Watch, then go!");
    for (let i = 0; i < 6; i++) slideGate(b, X(106 + i * 2) + 2, 1.5, 0, 10, 3.6, 3, 7, 4, 0, "gate");
    b.saw(X(118) + 3, 5, 1.0, b.mv(0, 2.4, 4));
    // Token 3: dip under the low token, then climb through the gate as it rises.
    b.token(X(121) + 1.5, 1.6);
    slideGate(b, X(122) + 2, 1.5, 0, 10, 3.6, 3, 7, 4, 0, "gate");
    for (let i = 0; i < 4; i++) slideGate(b, X(124 + i * 2) + 2.5, 1.5, 0, 10, 3.4, 2.8, 7.2, 4, 0, "gate");
    b.blk(X(132) + 2, 0, X(136) - X(132), 2.6); b.blk(X(132) + 2, 7.2, X(136) - X(132), 2.8);
    b.saw(X(134) + 1, 4.9, 0.6, b.mv(2.2, 0, 2));
    b.text(X(137), 7.4, "Rise!");
    // ===== Zone D: the ocean shaft. Climb toward the light (fast from beat 140).
    b.zone(X(141), X(176) + 30, 0, 30);
    const s0 = X(141), s1 = X(170);
    const fl = function (x) { const k = (x - s0) / (s1 - s0); return 18 * smooth(k * 1.05) + 1.6 * Math.sin(k * Math.PI * 4) * smooth(k * 6); };
    corridor(b, s0, s1, 0.5, function (x) { return Math.max(0, fl(x)); }, function (x) { return fl(x) + 5.2 - 0.8 * Math.sin((x - s0) / (s1 - s0) * Math.PI); }, 0, 30, "glass");
    b.saw(X(150) + 2, fl(X(150) + 2) + 2.6, 0.7, b.mv(0, 1.2, 2));
    b.saw(X(158) + 2, fl(X(158) + 2) + 2.6, 0.7, b.mv(0, 1.2, 2, 0.5));
    b.saw(X(164) + 2, fl(X(164) + 2) + 2.6, 0.7, b.mv(0, 1.2, 2));
    b.blk(X(170), 0, X(176) + 30 - X(170), 16.6);
  }));

  // =========================================================
  // 9. CLOCKWORK CITADEL — Hard. Ball, cube, timed machinery.
  // 124 BPM (one beat ≈ 5.03 blocks). Fast inside the clock chamber.
  // All machinery moves on the beat and is tied to the level clock.
  // =========================================================
  BTG.push(make({
    id: "clockwork-citadel", name: "Clockwork Citadel", pack: "btg", num: 9, preview: 0.86, difficulty: "Hard", stars: 4, bpm: 124, endBeat: 200,
    speeds: [[144, 2, 2]], target: [90, 105],
    palette: { sky1: "#140a03", sky2: "#3a2208", ground: "#2a1a0c", line: "#ffc04a", block: "#3b2a18", accent: "#ffd27a", glow: "#ffb02e", far: "#a8732a" },
    song: "clockwork", scenery: "clock",
    sections: [[0, "intro"], [4, "main"], [12, "drop"], [24, "main"], [30, "calm"], [36, "build"], [38, "climax"], [48, "outro"]],
    moments: { clock: [140, 200] },
    blurb: "Pistons, pendulums, and gears that move on the beat. Cube and ball.",
    reward: { kind: "icon", name: "Clockwork" },
    tokenHints: ["Use the two orbs to reach the roof, then dodge the upper crushers", "Ride the ceiling past the spiked teeth", "Slip through the narrow gap in the final gears"]
  }, function (b) {
    const X = b.X.bind(b), J = b.J.bind(b);
    // A crusher hanging from a roof at roofY. It rests up (bottom at upB) or slams down (bottom at downB) on the beat.
    // state = where it is when you pass under it: "up" (jump freely) or "down" (stay low).
    function piston(x, w, roofY, upB, downB, state, beats) {
      beats = beats || 2;
      const amp = (upB - downB) / 2, mid = (upB + downB) / 2;
      const ph = b.phaseAt(x + w / 2, beats, state === "up" ? 0.69 : 0.19);
      // Only the 1-block head is dangerous; the shaft up to the roof is drawn but never collides.
      b.add({ t: "haz", x: x, y: mid, w: w, h: 1, mv: b.mvs(0, amp, beats, ph, 0.12), shaft: roofY, st: "piston" });
    }
    // A platform that rises and sinks on the beat; "hi" or "lo" is where it is when you reach its middle.
    function lift(x, w, top, amp, state, beats) {
      const ph = b.phaseAt(x + w / 2, beats, state === "hi" ? 0.65 : 0.15);
      b.mblk(x, top - 3.5, w, 3.5, b.mvs(0, amp, beats, ph, 0.2), "plat");
    }
    b.text(3, 3.6, "Clockwork Citadel");
    // --- Stone-and-metal platforms.
    b.sp(J(6)); b.sp(J(9)); b.sps(J(11, 2), 2);
    b.pit(X(13) + 1.2, X(21) + 1);
    for (let i = 0; i < 8; i++) b.blk(X(13 + i) + 3.1, -2, i % 3 === 2 ? 2.6 : 3, 3 + (i % 2 ? 0.5 : 0));
    b.sp(J(23)); b.sps(J(24.5, 2), 2);
    // --- Piston hall: crushers slam on the beat. Low crusher = stay on the ground.
    b.text(X(25) + 1, 5.9, "Crushers move on the beat. Don't jump under a low one!");
    const hall0 = X(27) - 1, hall1 = X(46);
    b.blk(hall0, 4.6, hall1 - hall0, 0.8);
    piston(X(28) + 2, 1.6, 4.6, 3.8, 1.6, "down");
    b.sp(J(30)); piston(X(31) + 1.4, 1.6, 4.6, 3.8, 1.6, "down");
    piston(X(32) + 1.2, 2.4, 4.6, 3.8, 1.6, "up"); b.sps(J(32.5, 2), 2);
    piston(X(34) + 0.6, 1.6, 4.6, 3.8, 1.6, "down");
    b.sp(J(35)); piston(X(36) + 1.4, 1.6, 4.6, 3.8, 1.6, "down");
    piston(X(37) + 1.6, 2.4, 4.6, 3.8, 1.6, "up"); b.sps(J(37.6, 2), 2);
    piston(X(39) + 1.6, 1.6, 4.6, 3.8, 1.6, "down");
    b.sps(J(40.5, 2), 2); piston(X(41) + 2.6, 1.6, 4.6, 3.8, 1.6, "down");
    piston(X(42) + 3, 2.4, 4.6, 3.8, 1.6, "up"); b.sp(J(43.2));
    b.sp(J(45)); b.sps(J(47, 2), 2);
    // Token 1: two orbs before the hall boost you onto the roof, under a second row of crushers.
    b.orb(X(25) + 2.4, 2.4); b.orb(X(26) + 0.6, 4.4);
    b.blk(hall0, 9.8, hall1 - hall0, 1);
    piston(X(30) + 1, 1.6, 9.8, 8.8, 6.6, "down");
    b.small(X(31) + 3, 5.4);
    piston(X(33) + 1, 1.6, 9.8, 8.8, 6.6, "down");
    b.smalls(X(35) + 1, 2, 5.4);
    piston(X(36) + 2, 1.6, 9.8, 8.8, 6.6, "up");
    piston(X(38) + 1, 2, 9.8, 8.8, 6.6, "down");
    b.small(X(39) + 2.4, 5.4);
    b.token(X(42) + 1, 6.4);
    piston(X(43) + 1, 1.6, 9.8, 8.8, 6.6, "down");
    // --- Ball between floor and ceiling (floor 0, ceiling 7).
    b.zone(X(49) + 2, X(99) + 4, 0, 7);
    b.text(X(48) + 1, 6.0, "Ball: press to switch floor ↔ ceiling");
    b.mode(X(51) + 1, 1.5, "ball");
    for (let k = 0; k < 6; k++) { const x = X(54 + k * 1.5) + 2; if (k % 2 === 0) b.sps(x, 3); else b.csps(x, 3, 7); }
    // Pendulums swing through the middle: stay against a wall while they pass.
    b.saw(X(64) + 2, 3.5, 0.7, b.pend(3.5, 0.9, 4, b.phaseAt(X(64) + 2, 4, 0.25)));
    b.add({ t: "deco", x: X(64) + 2, y: 7, kind: "pivot" });
    b.sps(X(65) + 2, 2); b.csps(X(66) + 2, 2, 7);
    b.saw(X(67) + 3, 3.5, 0.7, b.pend(3.5, 0.9, 4, b.phaseAt(X(67) + 3, 4, 0.75)));
    b.add({ t: "deco", x: X(67) + 3, y: 7, kind: "pivot" });
    // Moving gates: each pillar slides to block the floor half or the ceiling half. Take the open side.
    b.text(X(68) + 1, 3.5, "Gates slide on the beat: take the open side");
    for (let k = 0; k < 5; k++) {
      const x = X(70 + k * 2) + 2;
      b.mblk(x, 1.75, 2, 3.5, b.mvs(0, 1.75, 4, b.phaseAt(x + 1, 4, k % 2 ? 0.65 : 0.15), 0.2), "gear");
    }
    // Token 2: ride the ceiling between the spiked teeth (the floor route under the shelf is easy).
    b.blk(X(80) + 2, 3.0, X(85) - X(80), 0.6);
    b.csps(X(81) + 1, 2, 7); b.csps(X(82) + 3, 2, 7); b.sps(X(82) + 0, 2, 3.6);
    b.token(X(83) + 3.4, 6.3);
    b.csps(X(84) + 2, 2, 7);
    b.sps(X(86) + 2, 3); b.csps(X(87) + 3, 3, 7); b.sps(X(88) + 4, 3);
    b.blk(X(90) + 2, 0, 3, 3); b.blk(X(91) + 2, 4, 3, 3); b.blk(X(92) + 2, 0, 3, 3);
    // Funnel down to the cube.
    b.blk(X(94), 3.4, X(99) + 4 - X(94), 3.6);
    b.mode(X(96) + 1, 1.5, "cube");
    // --- Synchronized platforms over the abyss (cube).
    b.text(X(99), 4.0, "Hop the moving platforms");
    b.pit(X(101) + 0.5, X(108) + 6);
    for (let k = 0; k < 8; k++) lift(X(101 + k) + 1.4, 3.2, 1, 0.75, k % 2 ? "hi" : "lo", 4);
    b.sp(J(111)); b.sp(J(113)); b.sps(J(115, 2), 2);
    b.blk(X(118) + 2.6, 0, 5, 1); b.blk(X(119) + 2.6, 0, 5, 2);
    b.pit(X(120) + 3.4, X(121) + 2.2);
    b.saw(X(121) + 3, 6.0, 0.8, b.pend(2.4, 0.8, 2, b.phaseAt(X(121) + 3, 2, 0.75)));
    b.add({ t: "deco", x: X(121) + 3, y: 8, kind: "pivot" });
    b.sp(J(123)); b.sps(J(124, 2), 2);
    b.pit(X(126) + 0.5, X(132) + 6);
    for (let k = 0; k < 7; k++) lift(X(126 + k) + 1.2, 3.4, 1, 1.0, k % 2 ? "lo" : "hi", 4);
    b.sp(J(136)); b.sps(J(138, 2), 2);
    b.text(X(140), 4.6, "The great clock wakes up...");
    // --- The clock chamber (fast from beat 144).
    b.sps(J(147, 2), 2); b.sp(J(148.5));
    b.blk(X(150) + 2, 0, 4, 1); lift(X(151) + 2.6, 4, 2, 0.6, "hi", 2); b.sps(X(152) + 2.4, 2);
    b.saw(X(154) + 3, 4.6, 0.8, b.pend(3.0, 0.7, 2, b.phaseAt(X(154) + 3, 2, 0.25)));
    b.add({ t: "deco", x: X(154) + 3, y: 7.6, kind: "pivot" });
    b.pad(X(156) + 1); b.blk(X(156) + 4.6, 0, 6, 3); b.sps(X(157) + 4.6, 3);
    b.orb(X(158) + 4.2, 2.6); b.sps(X(158) + 2.4, 5);
    b.pit(X(161), X(168) + 6);
    for (let k = 0; k < 8; k++) lift(X(161 + k) + 0.8, 4.2, 1, 0.9, k % 2 ? "hi" : "lo", 2);
    // The final mechanism: two gears with a narrow gap up top (token 3); the main path stays low.
    b.sp(J(171.5));
    b.orb(X(171) + 3.4, 2.6); b.orb(X(172) + 1.6, 4.9);
    b.blk(X(172) + 4.2, 5.4, X(175) - (X(172) + 4.2), 0.6);
    b.saw(X(173) + 3.4, 9.1, 1.3); b.saw(X(174) + 2.6, 9.1, 1.3);
    b.small(X(173) + 0.4, 6.0);
    b.token(X(174) + 0.2, 6.6);
    b.sp(J(173)); b.sps(J(174.5, 2), 2);
    b.sps(J(177, 2), 2); b.sp(J(178.5));
    b.blk(X(180) + 2.6, 0, 6, 1); b.blk(X(181) + 2.6, 0, 6, 2); b.blk(X(182) + 2.6, 0, 5, 3);
    b.sps(X(183) + 1.4, 3);
    b.sps(J(186, 2), 2); b.sp(J(188)); b.sps(J(190, 3), 3);
    b.sp(J(193)); b.sp(J(194));
  }));

  // =========================================================
  // 10. PRISM PARADOX — Hard. Wave, gravity, size changes.
  // 136 BPM (one beat ≈ 4.59 blocks). Fast for the final prism run.
  // Crystal walls are exact triangles, so diagonal corridors are fair to the pixel.
  // =========================================================
  BTG.push(make({
    id: "prism-paradox", name: "Prism Paradox", pack: "btg", num: 10, preview: 0.22, difficulty: "Hard", stars: 5, bpm: 136, endBeat: 216,
    speeds: [[166, 2, 1.6]], target: [90, 105],
    palette: { sky1: "#0d0221", sky2: "#2a0a4a", ground: "#1c0838", line: "#e07bff", block: "#2a0f55", accent: "#4df3ff", glow: "#ff5fe0", far: "#8a5cff" },
    song: "prism2", scenery: "prism",
    sections: [[0, "intro"], [3, "main"], [10, "drop"], [18, "calm"], [24, "build"], [26, "drop"], [33, "main"], [42, "climax"], [52, "outro"]],
    moments: { split: [96, 120] },
    blurb: "Zigzag the wave through a crystal dimension. Mini size and gravity flips.",
    reward: { kind: "trail", name: "Prismatic" },
    tokenHints: ["Take the upper, longer wave corridor", "Shrink through the optional mini passage", "Catch the orb into the gravity alcove near the end"]
  }, function (b) {
    const X = b.X.bind(b), J = b.J.bind(b);
    // Wave paths from moves: ["u"|"d"|"f", beats]. k = slope (1 normal size, 2 mini).
    function path(beat0, y0, moves, k) {
      const pts = [[X(beat0), y0]];
      let bt = beat0, y = y0;
      moves.forEach(function (m) {
        const nb = bt + m[1], dx = X(nb) - X(bt);
        y += m[0] === "u" ? dx * k : m[0] === "d" ? -dx * k : 0;
        pts.push([X(nb), y]); bt = nb;
      });
      return pts;
    }
    // Crystal tunnel around a path: floor and ceiling polygons follow it, leaving an opening `gap` tall.
    function tunnel(pts, gap, lo, hi, skipFloor, skipCeil) {
      if (typeof process !== "undefined" && process.env.DBG) pts.forEach(function (p) {
        const g = typeof gap === "function" ? gap(p[0]) : gap;
        if (p[1] - g / 2 < lo - 0.01 || p[1] + g / 2 > hi + 0.01) console.log("tunnel out of bounds at x " + p[0].toFixed(1) + " y " + p[1].toFixed(2) + " beat " + b.beatAt(p[0]).toFixed(2));
      });
      for (let i = 0; i + 1 < pts.length; i++) {
        const a = pts[i], c = pts[i + 1], ga = typeof gap === "function" ? gap(a[0]) : gap, gc = typeof gap === "function" ? gap(c[0]) : gap;
        if (!skipFloor && Math.max(a[1] - ga / 2, c[1] - gc / 2) > lo + 0.01) b.crys([a[0], lo, c[0], lo, c[0], c[1] - gc / 2, a[0], a[1] - ga / 2]).o[b.o.length - 1].edge = 2;
        if (!skipCeil && Math.min(a[1] + ga / 2, c[1] + gc / 2) < hi - 0.01) b.crys([a[0], a[1] + ga / 2, c[0], c[1] + gc / 2, c[0], hi, a[0], hi]).o[b.o.length - 1].edge = 0;
      }
    }
    // A cursor that chains wave segments end to end so corridors always line up.
    const cur = { bt: 0, y: 0, lo: 0, hi: 9 };
    function at(beat, y, lo, hi) { cur.bt = beat; cur.y = y; cur.lo = lo; cur.hi = hi; }
    function seg(moves, gap, k) {
      const p = path(cur.bt, cur.y, moves, k || 1);
      tunnel(p, gap, cur.lo, cur.hi);
      moves.forEach(function (m) { cur.bt = Math.round((cur.bt + m[1]) * 1e6) / 1e6; });
      cur.y = p[p.length - 1][1];
      return p;
    }
    function to(y, gap) { const d = (y - cur.y) / (X(cur.bt + 1) - X(cur.bt)); return seg([[d > 0 ? "u" : "d", Math.abs(d)]], gap); }

    b.text(3, 3.6, "Prism Paradox");
    // --- Short cube introduction.
    b.sp(J(6)); b.sps(J(8, 2), 2); b.blk(X(9) + 2.6, 0, 4, 1); b.sp(J(11.5));
    b.blk(X(13) + 2.6, 0, 4.6, 1); b.blk(X(14) + 2.6, 0, 4.6, 2); b.sps(X(15) + 2.2, 2); b.sp(J(17));
    b.blk(X(16) + 2, 3.2, X(19) - X(16) - 2, 5.8);
    // --- Wave: wide diagonal corridors (floor 0, ceiling 9).
    b.zone(X(17), X(58), 0, 11);
    b.mode(X(18), 1.5, "wave");
    b.text(X(18) + 2, 6.4, "Wave: hold to go up, let go to go down");
    at(19, 1.6, 0, 9);
    seg([["f", 1], ["u", 1], ["d", 0.5], ["u", 0.5], ["d", 1], ["u", 0.5], ["f", 1]], 3.4);
    // Token 1: the corridor splits. Upper branch: narrow and twisty (token). Lower branch: wide and calm.
    const sb = cur.bt, sy = cur.y;
    const up = path(sb, sy, [["u", 0.5], ["d", 0.25], ["u", 0.5], ["d", 0.25], ["u", 0.25], ["d", 0.75], ["f", 0.5]], 1);
    const lowP = path(sb, sy, [["d", 0.4], ["f", 2.2], ["u", 0.4]], 1);
    tunnel(up, 2.0, 0, 9, true, false);
    tunnel(lowP, 2.6, 0, 9, false, true);
    const lowCeil = lowP[1][1] + 1.3;
    for (let i = 0; i + 1 < up.length; i++) {
      let a = up[i].slice(), c = up[i + 1].slice();
      if (a[1] - 1 <= lowCeil && c[1] - 1 <= lowCeil) continue;
      if (a[1] - 1 < lowCeil) { const k = (lowCeil + 1 - a[1]) / (c[1] - a[1]); a = [a[0] + (c[0] - a[0]) * k, lowCeil + 1]; }
      if (c[1] - 1 < lowCeil) { const k = (lowCeil + 1 - a[1]) / (c[1] - a[1]); c = [a[0] + (c[0] - a[0]) * k, lowCeil + 1]; }
      b.crys([a[0], lowCeil, c[0], lowCeil, c[0], c[1] - 1.0, a[0], a[1] - 1.0]);
    }
    b.token(up[3][0] + 0.4, up[3][1] - 0.3);
    cur.bt += 3;
    // Alternating zigzags.
    seg([["f", 0.5], ["u", 0.5], ["d", 0.5], ["u", 0.5], ["d", 0.5], ["u", 0.25], ["d", 0.25], ["u", 0.25], ["d", 0.25], ["u", 0.5], ["d", 0.5]], 3.0);
    seg([["u", 0.75], ["d", 0.25], ["u", 0.25], ["d", 0.75], ["u", 0.5], ["f", 0.5], ["d", 0.5], ["u", 0.25], ["d", 0.25]], 2.8);
    seg([["u", 0.5], ["d", 0.5], ["u", 0.5], ["d", 0.5], ["f", 0.5]], 2.8);
    // --- Mini wave: steeper and tighter. The pink portal sits in a calm stretch so the route ahead is visible.
    seg([["f", 0.5]], 3.0);
    to(4.6, 3.0); seg([["f", 0.75]], 3.0);
    b.size(X(cur.bt) - 1.2, cur.y, "mini");
    seg([["f", 1], ["u", 0.25], ["d", 0.25], ["d", 0.25], ["u", 0.25], ["u", 0.25], ["d", 0.25], ["f", 0.5]], 2.2, 2);
    b.size(X(cur.bt) - 1.4, cur.y, "normal");
    seg([["f", 1], ["d", 0.25], ["u", 0.5], ["d", 0.25], ["f", 0.5]], 3.0);
    // Token 2: an optional mini passage up top. Its walls slope at the mini angle, so only a mini wave fits.
    to(1.6, 3.0);
    const tb = cur.bt, x0 = X(tb) + 6;
    // Open room: rise to the pink portal if you want the token. The main route stays low.
    tunnel([[X(tb), 1.6], [x0, 1.6]], 2.6, 0.3, 11, false, true);
    b.size(x0 - 2.6, 4.2, "mini");
    // The slit climbs and drops at the mini wave's steeper angle: hold up, then let go at the top.
    tunnel([[x0, 1.6], [x0 + 5, 1.6]], 2.6, 0.3, 11, false, true);
    tunnel([[x0, 4.0], [x0 + 2.5, 9.0], [x0 + 5, 4.0]], 2.0, 2.9, 11);
    b.token(x0 + 2.5, 8.7);
    b.size(x0 + 6.2, 4.2, "normal");
    cur.bt = b.beatAt(x0 + 9);
    tunnel([[x0 + 5, 1.6], [X(cur.bt), 1.6]], 2.6, 0.3, 11, false, true);
    cur.y = 1.6;
    // Into the ball chamber.
    b.blk(X(cur.bt) + 1, 3.4, X(58) - X(cur.bt) - 1, 7.6);
    b.mode(X(cur.bt) + 3, 1.5, "ball");
    const ballA = cur.bt;
    // --- Short ball section (floor 0, ceiling 7).
    b.zone(X(58), X(ballA + 16), 0, 7);
    for (let k = 0; k < 6; k++) { const x = X(ballA + 3 + k * 1.5) + 1; if (k % 2 === 0) b.sps(x, 3); else b.csps(x, 3, 7); }
    b.blk(X(ballA + 12), 0, 3, 3); b.blk(X(ballA + 13), 4, 3, 3);
    b.blk(X(ballA + 14) + 2, 3.4, X(ballA + 16) - X(ballA + 14) - 2, 3.6);
    b.mode(X(ballA + 15), 1.5, "wave");
    // --- Wave: the background prisms split into mirrored patterns. (The controls never change.)
    const wB = ballA + 16;
    b.zone(X(wB), X(wB + 34), 0, 9);
    at(wB, 1.6, 0, 9);
    tunnel([[X(wB - 1) + 1, 1.6], [X(wB), 1.6]], 3.0, 0, 9);
    seg([["u", 1], ["d", 0.5], ["u", 0.5], ["d", 0.5], ["u", 0.5], ["d", 1]], 3.0);
    seg([["u", 0.25], ["d", 0.25], ["u", 0.5], ["d", 0.5], ["u", 0.75], ["d", 0.25], ["u", 0.25], ["d", 0.75], ["u", 0.5], ["d", 0.5], ["f", 0.5]], 2.7);
    to(4.6, 3.0); seg([["f", 0.75]], 3.0);
    b.size(X(cur.bt) - 1.2, cur.y, "mini");
    seg([["f", 1], ["u", 0.25], ["d", 0.25], ["d", 0.25], ["u", 0.25], ["f", 0.5]], 2.2, 2);
    b.size(X(cur.bt) - 1.4, cur.y, "normal");
    seg([["f", 1], ["u", 0.5], ["d", 0.5], ["u", 0.25], ["d", 0.25]], 3.0);
    // Mirror hall: each pattern is answered by its reflection, like the prisms behind you.
    to(4.5, 3.0);
    seg([["u", 0.5], ["d", 0.5], ["u", 0.25], ["d", 0.25], ["d", 0.25], ["u", 0.25], ["d", 0.5], ["u", 0.5]], 2.8);
    seg([["f", 0.5], ["u", 0.5], ["d", 0.25], ["d", 0.25], ["u", 0.5], ["d", 0.5], ["u", 0.25], ["u", 0.25], ["d", 0.5], ["f", 0.5]], 2.7);
    to(1.6, 3.0);
    seg([["f", 0.5]], 3.0);
    const cB = Math.ceil(cur.bt);
    b.blk(X(cur.bt), 3.4, X(cB + 2) - X(cur.bt), 5.6);
    b.mode(X(cur.bt) + 1.5, 1.5, "cube");
    // --- Gravity transition chamber (cube): up to the ceiling, then back down.
    b.zone(X(cB + 2), X(cB + 24), 0, 7);
    b.text(X(cB + 1), 5.0, "Gravity chamber");
    b.sp(J(cB + 3)); b.sps(J(cB + 4.5, 2), 2);
    b.grav(X(cB + 6) + 1, 1.5, "up");
    b.csps(J(cB + 9, 2), 2, 7); b.csp(J(cB + 10.5), 7);
    b.blk(X(cB + 11) + 2, 5.6, 4, 1.4); b.csps(X(cB + 12) + 2.4, 2, 7);
    b.grav(X(cB + 14) + 1, 5.5, "down");
    b.sp(J(cB + 16)); b.sps(J(cB + 17, 2), 2);
    b.orb(X(cB + 18) + 3, 2.4, "blue"); b.sps(X(cB + 18) + 1, 6);
    b.csps(X(cB + 19) + 4, 2, 7);
    b.pad(X(cB + 21) + 1, 0, "blue"); b.csps(X(cB + 22), 2, 7);
    b.grav(X(cB + 23) + 1, 5.5, "down");
    // --- Ball between the wave runs.
    const bC = cB + 24;
    b.zone(X(bC), X(bC + 12), 0, 7);
    b.blk(X(bC), 3.4, X(bC + 2) - X(bC), 3.6);
    b.mode(X(bC + 1), 1.5, "ball");
    b.sps(X(bC + 3) + 2, 3); b.csps(X(bC + 4) + 2, 3, 7); b.sps(X(bC + 5) + 2, 3); b.csps(X(bC + 6) + 2, 2, 7);
    b.blk(X(bC + 7) + 2, 0, 2, 3.2); b.blk(X(bC + 8) + 2, 3.8, 2, 3.2);
    b.blk(X(bC + 9) + 3, 3.4, X(bC + 12) - X(bC + 9) - 3, 3.6);
    b.mode(X(bC + 10) + 2, 1.5, "wave");
    // --- Wave: big alternating patterns.
    const wC = bC + 12;
    b.zone(X(wC), X(wC + 34), 0, 9);
    at(wC, 1.6, 0, 9);
    seg([["u", 1.25], ["d", 0.5], ["u", 0.5], ["d", 0.5], ["u", 0.25], ["d", 0.25], ["u", 0.25], ["d", 1], ["u", 0.5], ["d", 0.25], ["u", 0.25], ["d", 0.5]], 2.7);
    seg([["u", 0.5], ["d", 0.5], ["u", 1], ["d", 0.25], ["u", 0.25], ["d", 0.25], ["u", 0.25], ["d", 1], ["u", 0.5], ["d", 0.5], ["f", 0.5]], 2.6);
    to(4.6, 3.0); seg([["f", 0.75]], 3.0);
    b.size(X(cur.bt) - 1.2, cur.y, "mini");
    seg([["f", 1], ["u", 0.25], ["d", 0.25], ["f", 0.25], ["d", 0.25], ["u", 0.25], ["f", 0.5]], 2.3, 2);
    b.size(X(cur.bt) - 1.4, cur.y, "normal");
    seg([["f", 1], ["d", 0.25], ["u", 0.5]], 3.0);
    to(4.5, 3.0);
    seg([["u", 0.25], ["d", 0.5], ["u", 0.5], ["d", 0.25], ["f", 0.5], ["d", 0.25], ["u", 0.5], ["d", 0.5], ["u", 0.25], ["f", 0.5]], 2.6);
    to(1.6, 3.0);
    seg([["f", 0.5]], 3.0);
    const cD = Math.ceil(cur.bt);
    b.blk(X(cur.bt), 3.4, X(cD + 2) - X(cur.bt), 4.6);
    b.mode(X(cur.bt) + 1.5, 1.5, "cube");
    // --- Token 3: a blue orb flips you into the ceiling alcove; a portal drops you back down.
    b.zone(X(cD + 2), X(cD + 16), 0, 8);
    b.sps(J(cD + 4, 2), 2); b.sp(J(cD + 5.5));
    b.orb(X(cD + 6) + 2.4, 2.6, "blue");
    b.csps(X(cD + 6) + 6, 2, 8); b.token(X(cD + 7) + 4.6, 7.4); b.csps(X(cD + 8) + 3.4, 2, 8);
    b.grav(X(cD + 9) + 1.5, 6.4, "down");
    b.sps(J(cD + 7, 2), 2); b.sp(J(cD + 8.5)); b.sps(J(cD + 10, 2), 2); b.sp(J(cD + 12));
    b.blk(X(cD + 13), 3.4, X(cD + 16) - X(cD + 13), 4.6);
    b.mode(X(cD + 14), 1.5, "wave");
    // --- Finale: a wave run through a giant fractured prism.
    const wF = cD + 16;
    b.zone(X(wF), X(232), 0, 11);
    at(wF, 1.6, 0, 11);
    tunnel([[X(wF - 2) + 1, 1.6], [X(wF), 1.6]], 2.8, 0, 11);
    seg([["u", 0.5], ["d", 0.25], ["u", 0.5], ["d", 0.25], ["f", 0.75], ["u", 0.25], ["d", 0.5], ["u", 0.5], ["d", 0.25], ["u", 0.5], ["d", 0.25], ["u", 0.25], ["d", 0.5], ["u", 0.25], ["d", 0.25], ["u", 0.75], ["d", 0.5], ["f", 0.5]], 2.8);
    to(4.6, 3.0); seg([["f", 0.75]], 3.0);
    b.size(X(cur.bt) - 1.2, cur.y, "mini");
    seg([["f", 1], ["u", 0.25], ["d", 0.25], ["d", 0.25], ["u", 0.25], ["u", 0.25], ["d", 0.25], ["f", 0.5]], 2.5, 2);
    b.size(X(cur.bt) - 1.4, cur.y, "normal");
    seg([["f", 1], ["u", 0.5], ["d", 0.25], ["u", 0.25], ["d", 0.5], ["u", 0.5], ["d", 0.5], ["u", 0.25], ["d", 0.25], ["u", 0.75], ["d", 0.25], ["u", 0.25], ["d", 0.5], ["u", 0.25], ["d", 0.75], ["f", 1]], function (x) { return x < X(cur.bt + 6) ? 2.8 : 2.5; });
    seg([["u", 0.5], ["d", 0.5], ["u", 0.25], ["d", 0.25], ["u", 0.5], ["d", 0.25], ["u", 0.25], ["d", 0.5], ["u", 0.5], ["f", 1], ["d", 0.5], ["u", 0.25], ["d", 0.25]], 2.7);
    to(5.5, 2.8);
    seg([["u", 0.5], ["d", 0.25], ["u", 0.25], ["d", 0.75], ["u", 0.25], ["d", 0.25], ["u", 0.75], ["d", 0.25], ["u", 0.25], ["d", 0.5], ["f", 0.5], ["u", 0.5], ["d", 1], ["u", 0.5], ["d", 0.25], ["u", 0.25], ["d", 0.25], ["u", 0.25]], 2.6);
    to(5.5, 2.8);
    const fin = cur.bt;
    seg([["f", 1], ["u", 0.25], ["d", 0.25], ["u", 0.25], ["d", 0.25], ["u", 0.5], ["d", 0.5], ["f", 3]], function (x) { return 2.8 + Math.max(0, x - X(fin + 3)) * 0.5; });
    b.meta.endBeat = Math.ceil(cur.bt) + 2;
  }));

  // =========================================================
  // 11. SOLAR BREAKDOWN — Very hard. Robot, ship, cube, UFO, energy beams.
  // 140 BPM (one beat ≈ 4.46 blocks; fast ≈ 5.55 from beat 36).
  // Beams charge up (harmless, flickering outline), fire (dangerous), then cool down.
  // =========================================================
  BTG.push(make({
    id: "solar-breakdown", name: "Solar Breakdown", pack: "btg", num: 11, preview: 0.33, difficulty: "Very Hard", stars: 5, bpm: 140, endBeat: 236,
    startMode: "robot", speeds: [[36, 2, 1.5]], target: [95, 110],
    palette: { sky1: "#1a0503", sky2: "#5a1606", ground: "#2a1612", line: "#ff9a2e", block: "#3a2420", accent: "#ffd23f", glow: "#ff6a1a", far: "#c43a12" },
    song: "solar", scenery: "solar",
    sections: [[0, "intro"], [4, "main"], [9, "drop"], [20, "main"], [30, "calm"], [32, "build"], [40, "drop"], [49, "climax"], [57, "outro"]],
    moments: { flare: [36, 236], escape: [196, 236] },
    blurb: "Escape a failing space station. Charging beams, debris, and every kind of jump.",
    reward: { kind: "trail", name: "Solar Flare" },
    tokenHints: ["A full robot jump onto the high platform under the skylight", "Fly the upper debris field outside the station", "Hop around the charging beam in the upper chamber"]
  }, function (b) {
    const X = b.X.bind(b), J = b.J.bind(b);
    function rock(x, y, r, mv) { return b.add({ t: "saw", x: x, y: y, r: r, mv: mv, st: "rock" }); }
    function barrier(x, y, w, h) { return b.add({ t: "haz", x: x, y: y, w: w, h: h, st: "energy" }); }
    // A beam that is firing (on) or quiet (off) at the moment you pass its middle.
    // Firing beams charge for one beat first and fire for `len` beats.
    function tbeam(x, y, w, h, on, len) {
      const ba = b.beatAt(x + w / 2);
      if (on) b.beam(x, y, w, h, [[ba - (len || 1) / 2, ba + (len || 1) / 2]], 1);
      else b.beam(x, y, w, h, [[ba + 0.75, ba + 1.75]], 1);
    }
    // --- Reactor maintenance corridor (robot).
    b.text(3, 3.6, "Solar Breakdown");
    b.blk(X(4), 5.2, X(21) - X(4), 0.8);
    b.sp(J(6)); b.blk(X(7) + 3, 0, 4, 1);
    b.text(X(8) + 2, 4.3, "Energy barriers: small hops only");
    barrier(X(9) + 2, 2.4, X(13) - X(9) - 2, 0.5);
    b.small(J(10)); b.small(J(11)); b.small(J(12));
    b.blk(X(14) + 2.6, 0, 4, 3); b.sps(X(15) + 2.2, 2);
    barrier(X(17) + 2, 3.5, X(20) - X(17) - 2, 0.5);
    b.sps(J(18, 2), 2); b.blk(X(19) + 1.5, 0, 2, 1.2);
    // Token 1: under the skylight, a full jump off the tall block reaches the high platform.
    b.blk(X(22) + 2, 0, 4, 2.4); b.sps(X(22) + 6, 3);
    b.blk(X(22) + 8.6, 5.0, 6, 0.6); b.token(X(22) + 12.6, 6.2);
    b.sp(J(25.5)); b.sps(J(27, 2), 2);
    b.blk(X(28), 5.2, X(36) - X(28), 0.8);
    barrier(X(29) + 2, 2.4, X(32) - X(29) - 2, 0.5);
    b.small(J(30)); b.small(J(31));
    b.blk(X(32) + 3, 0, 4, 2); b.sps(X(33) + 2.6, 2);
    b.text(X(33) + 1, 4.3, "Outside! Ship next");
    b.mode(X(35) + 1, 1.5, "ship");
    // --- Outside the station (ship, fast). The star swells behind you.
    b.zone(X(36), X(80) + 4, 0, 10);
    for (let i = 0; i < 5; i++) rock(X(39) + 2 + i * 1.8, 8.4 - i * 1.3, 0.75);
    rock(X(41) + 3, 1.2, 0.9);
    for (let i = 0; i < 5; i++) rock(X(43) + 2 + i * 1.8, 1.6 + i * 1.3, 0.75);
    rock(X(45) + 2, 8.6, 0.9);
    rock(X(47) + 2, 3.0, 1.0); rock(X(47) + 2, 7.6, 1.0);
    rock(X(49) + 2, 5.0, 1.1, b.mv(0, 2.4, 4, b.phaseAt(X(49) + 2, 4, 0.25)));
    rock(X(51) + 1, 2.0, 0.9); rock(X(51) + 3.2, 8.0, 0.9);
    rock(X(53) + 2, 4.0, 0.8); rock(X(53) + 4.4, 6.6, 0.8);
    rock(X(55) + 2, 5.4, 1.2, b.mv(0, 2.6, 4, b.phaseAt(X(55) + 2, 4, 0.75)));
    // Token 2: the upper debris field (tight) or the open lower lane.
    b.blk(X(58) + 2, 5.0, X(66) - X(58) - 2, 0.6);
    rock(X(59) + 2, 7.8, 0.7); rock(X(60) + 1, 6.4, 0.6); rock(X(60) + 4, 8.8, 0.6);
    rock(X(61) + 3, 6.8, 0.7); b.token(X(62) + 2, 8.2); rock(X(63) + 1, 7.9, 0.6); rock(X(64) + 0.5, 6.2, 0.6); rock(X(64) + 3.5, 8.4, 0.7);
    rock(X(59) + 3, 1.0, 0.8); rock(X(61) + 2, 3.8, 0.8); rock(X(63) + 3, 1.2, 0.8); rock(X(65) + 1, 3.6, 0.7);
    rock(X(67) + 2, 6.0, 0.9); rock(X(68) + 3, 2.6, 0.9);
    rock(X(70) + 2, 5.0, 1.0, b.mv(0, 2.8, 2, b.phaseAt(X(70) + 2, 2, 0.75)));
    b.gate(X(72) + 2, 1.5, 0, 10, 2.6, 6.6, true);
    rock(X(74) + 2, 7.4, 0.8); rock(X(74) + 4.2, 2.4, 0.8);
    b.gate(X(76) + 2, 1.5, 0, 10, 3.6, 7.6, true);
    b.blk(X(78) + 1, 7.0, 3, 3); b.blk(X(78) + 4, 5.0, 3, 5); b.blk(X(79) + 2, 3.2, X(80) + 4 - (X(79) + 2), 6.8);
    b.mode(X(80), 1.5, "cube");
    // --- Back inside: cube with charging beams.
    b.text(X(80) + 4, 4.0, "Beams flicker to warn you before they fire");
    b.sp(J(83)); b.sps(J(84, 2), 2);
    tbeam(J(86) + 0.1, 0, 0.8, 0.7, true); tbeam(J(87) + 0.1, 0, 0.8, 0.7, false); tbeam(J(88) + 0.1, 0, 0.8, 0.7, true);
    b.blk(X(89) + 2, 1.8, X(91) - X(89), 0.4);
    tbeam(X(89) + 2, 1.2, X(91) - X(89), 0.6, true, 2);
    b.sp(J(92)); b.sps(J(93, 2), 2);
    b.pad(X(95) + 1); b.blk(X(95) + 4.4, 0, 6, 3); tbeam(X(96) + 4, 3, 1, 3, false);
    b.sps(X(96) + 4.6, 2); b.orb(X(97) + 3, 2.6); b.sps(X(97) + 1.2, 5);
    tbeam(J(100) + 0.1, 0, 0.8, 0.7, true); b.sp(J(101)); tbeam(J(102) + 0.1, 0, 0.8, 0.7, true); b.sps(J(103, 2), 2);
    b.blk(X(104) + 2.6, 0, 5, 1); b.blk(X(105) + 2.6, 0, 5, 2); tbeam(X(106) + 2.4, 2, 1.2, 0.7, true); b.sps(X(106) + 2, 2);
    b.sp(J(108)); b.sps(J(109.5, 2), 2);
    b.blk(X(111) + 2, 2.0, X(114) - X(111), 0.5); tbeam(X(111) + 2, 1.4, X(114) - X(111), 0.6, true, 3);
    b.sps(J(115, 2), 2);
    b.mode(X(117) + 1, 1.5, "ufo");
    // --- UFO through firing lanes (floor 0, ceiling 9). Get to the safe half before each lane fires.
    b.zone(X(118), X(160) + 4, 0, 9);
    b.text(X(117) + 3, 6.4, "Lanes fire on the beat: switch halves!");
    b.sps(X(119), Math.floor(X(158) - X(119)));
    b.beam(X(121), 4.6, X(126) - X(121), 4.4, [[122, 124]], 1.5);
    b.beam(X(121), 0.8, X(126) - X(121), 3.8, [[124.5, 126.5]], 1.5);
    b.blk(X(127) + 1, 3.0, 3, 0.6); b.saw(X(128) + 2, 7.4, 0.9);
    b.beam(X(130), 0.8, X(135) - X(130), 3.6, [[130.5, 132.5]], 1.5);
    b.beam(X(130), 5.0, X(135) - X(130), 4.0, [[133, 135]], 1.5);
    b.gate(X(136) + 1, 1.5, 0, 9, 2.4, 6.2);
    // Token 3: the upper chamber. A beam along its floor charges, then fires: hop up over it in time.
    b.blk(X(138) + 2, 5.2, X(147) - X(138) - 2, 0.6);
    b.beam(X(140), 5.8, X(144) - X(140), 1.0, [[141.25, 143]], 1.25);
    b.csps(X(141), 2, 9); b.token(X(145) + 0.5, 6.6);
    b.gate(X(139) + 2, 1.5, 0, 5.2, 1.6, 4.8); b.gate(X(141) + 2, 1.5, 0, 5.2, 0.8, 4.0); b.gate(X(143) + 2, 1.5, 0, 5.2, 1.6, 4.8); b.gate(X(145) + 2, 1.5, 0, 5.2, 0.8, 4.0);
    b.beam(X(148), 0.8, X(153) - X(148), 4.0, [[148.5, 150.5]], 1.5);
    b.beam(X(148), 5.4, X(153) - X(148), 3.6, [[151, 153]], 1.5);
    b.gate(X(154) + 1, 1.5, 0, 9, 3.4, 7.0);
    b.blk(X(156) + 2, 6.5, 3, 2.5); b.blk(X(157) + 1, 3.2, X(160) + 4 - (X(157) + 1), 5.8);
    b.mode(X(159), 1.5, "robot");
    // --- Mixed transitions: robot, then cube.
    b.blk(X(162) + 3, 0, 4, 3); b.sps(X(163) + 2.6, 2);
    barrier(X(165) + 2, 2.4, X(168) - X(165) - 2, 0.5); b.small(J(166)); b.small(J(167));
    tbeam(X(169) + 1, 0, 2.4, 0.7, true, 1); b.blk(X(170) + 4.4, 0, 3, 2.4);
    b.sps(X(171) + 2.2, 2);
    b.mode(X(173) + 1, 1.5, "cube");
    b.sp(J(175)); tbeam(J(176) + 0.1, 0, 0.8, 0.7, true); b.sps(J(177, 2), 2);
    b.pad(X(179) + 1); b.blk(X(179) + 4.4, 0, 5, 3); b.sps(X(180) + 3.4, 2);
    b.orb(X(181) + 2.6, 2.6); b.sps(X(181) + 0.8, 5);
    b.sp(J(184)); tbeam(J(185) + 0.1, 0, 0.8, 0.7, true); b.sp(J(186)); b.sps(J(187, 2), 2);
    b.blk(X(189) + 2, 2.0, X(191) - X(189), 0.5); tbeam(X(189) + 2, 1.4, X(191) - X(189), 0.6, true, 2);
    b.sp(J(192)); b.text(X(192) + 2, 4.2, "Get to the ship. GO!");
    b.mode(X(194) + 1, 1.5, "ship");
    // --- Escape through the collapsing dock (ship). Girders fall on the beat — always the same way.
    b.zone(X(195) + 2, X(236) + 30, 0, 10);
    const fall = [[198, 8.0, 3.0, 199], [201, 2.0, -3.0, 202], [204, 8.4, 3.4, 205], [207, 1.6, -3.6, 208], [210, 8.0, 3.2, 211]];
    fall.forEach(function (f) {
      // A girder drops out of the ceiling (or rises from the floor) about two beats before you reach it, then stays.
      const x = X(f[0]) + 2, d = Math.abs(f[2]), mv = b.once(0, f[2] > 0 ? -d / 2 : d / 2, f[3] - 2.5, 1);
      if (f[2] > 0) b.mblk(x, f[1] + d / 2, 2, 10 - f[1] + d, mv, "girder");
      else b.mblk(x, -d - 1, 2, f[1] + d / 2 + 1, mv, "girder");
    });
    rock(X(213) + 2, 5.0, 1.0, b.mv(0, 2.4, 2, b.phaseAt(X(213) + 2, 2, 0.25)));
    b.gate(X(215) + 2, 1.5, 0, 10, 2.4, 6.4, true); b.gate(X(216) + 3, 1.5, 0, 10, 4.0, 8.0, true);
    b.blk(X(218) + 2, 0, X(222) - X(218), 3.2); b.blk(X(218) + 2, 7.0, X(222) - X(218), 3.0);
    rock(X(220) + 1, 5.1, 0.6, b.mv(2.0, 0, 2));
    b.gate(X(223) + 2, 1.5, 0, 10, 2.0, 6.0, true); b.gate(X(224) + 3, 1.5, 0, 10, 4.2, 8.2, true); b.gate(X(225) + 4, 1.5, 0, 10, 2.4, 6.4, true);
    b.text(X(228), 6, "Clear of the station!");
  }));

  // =========================================================
  // 12. BEYOND THE GRID — Expert finale. All six modes and the Grid Guardian.
  // 144 BPM (one beat ≈ 4.33 blocks; fast ≈ 5.4 from beat 150, very fast ≈ 6.5 from beat 272).
  // Phase 1 System Entry (cube, robot) → Phase 2 Security Network (ball, UFO)
  // → Phase 3 The Grid Guardian (ship, wave) → Phase 4 Escape (cube, robot).
  // The Guardian lives in the background. Its attacks are ordinary timed hazards with
  // warning, active, and recovery states. Six energy gates on the main route damage it.
  // =========================================================
  BTG.push(make({
    id: "beyond-the-grid", name: "Beyond the Grid", pack: "btg", num: 12, preview: 0.62, difficulty: "Expert", stars: 6, bpm: 144, endBeat: 288,
    speeds: [[150, 2, 1.6], [272, 3, 1.5]], target: [110, 130],
    palette: { sky1: "#020615", sky2: "#0a1a44", ground: "#081233", line: "#e8f4ff", block: "#0d1d4e", accent: "#ffd23f", glow: "#4de8ff", far: "#3a6cff" },
    song: "finale", scenery: "grid",
    sections: [[0, "intro"], [4, "main"], [9, "drop"], [18, "main"], [26, "build"], [36, "drop"], [37, "climax"], [56, "calm"], [57, "climax2"], [69, "outro"]],
    phases: [[0, "System Entry"], [72, "Security Network"], [150, "The Grid Guardian"], [232, "Escape"]],
    boss: { name: "The Grid Guardian", enter: 140, fight: 150, down: 222 }, bossGates: 7,
    blurb: "The finale. Every mode, the Grid Guardian, and one last escape.",
    reward: { kind: "icon", name: "Grid Champion", badge: true },
    tokenHints: ["Climb the stairs to the high rooftops in System Entry", "Hop into the upper alcove while its gate is open", "Thread the narrow upper lane between the Guardian's pulses"]
  }, function (b) {
    const X = b.X.bind(b), J = b.J.bind(b);
    function barrier(x, y, w, h) { return b.add({ t: "haz", x: x, y: y, w: w, h: h, st: "energy" }); }
    function tbeam(x, y, w, h, on, len) {
      const ba = b.beatAt(x + w / 2);
      if (on) b.beam(x, y, w, h, [[ba - (len || 1) / 2, ba + (len || 1) / 2]], 1);
      else b.beam(x, y, w, h, [[ba + 0.75, ba + 1.75]], 1);
    }
    function wpath(beat0, y0, moves) {
      const pts = [[X(beat0), y0]]; let bt = beat0, y = y0;
      moves.forEach(function (m) { const nb = bt + m[1], dx = X(nb) - X(bt); y += m[0] === "u" ? dx : m[0] === "d" ? -dx : 0; pts.push([X(nb), y]); bt = nb; });
      return pts;
    }
    function wtunnel(pts, gap, lo, hi) {
      for (let i = 0; i + 1 < pts.length; i++) {
        const a = pts[i], c = pts[i + 1];
        if (Math.max(a[1], c[1]) - gap / 2 > lo + 0.01) b.crys([a[0], lo, c[0], lo, c[0], c[1] - gap / 2, a[0], a[1] - gap / 2], "grid").o[b.o.length - 1].edge = 2;
        if (Math.min(a[1], c[1]) + gap / 2 < hi - 0.01) b.crys([a[0], a[1] + gap / 2, c[0], c[1] + gap / 2, c[0], hi, a[0], hi], "grid").o[b.o.length - 1].edge = 0;
      }
    }
    // ================= PHASE 1: SYSTEM ENTRY (cube, robot) =================
    b.text(3, 4.0, "Beyond the Grid");
    b.text(3, 3.1, "Phase 1: System Entry");
    // The opening motif: four beats of spikes. It comes back, faster, in the escape.
    b.sp(J(8)); b.sp(J(10)); b.sps(J(12, 2), 2); b.sps(J(14, 3), 3);
    // Neon Overdrive's staircase and rooftops (token 1 up high).
    b.blk(X(16) + 2.6, 0, 4.6, 1); b.blk(X(17) + 2.6, 0, 4.6, 2); b.blk(X(18) + 2.6, 0, 4.8, 3);
    b.blk(X(19) + 4.0, 4.2, 4.4, 0.6); b.orb(X(20) + 4.0, 6.0);
    b.blk(X(21) + 4.6, 6.4, 4.2, 0.6); b.token(X(22) + 3.6, 8.0);
    b.sp(J(21)); b.sps(J(23, 2), 2);
    // Solar Breakdown's energy barrier: stay on the ground under it, then jump right after.
    b.text(X(24), 4.2, "Don't jump under the barrier");
    barrier(X(25) + 2, 2.3, X(28) - X(25) - 2, 0.5); b.sp(J(28.4));
    b.pad(X(30) + 1); b.blk(X(30) + 4.4, 0, 6, 3); b.sps(X(31) + 4.4, 2);
    b.orb(X(32) + 3, 2.6); b.sps(X(32) + 1.2, 4);
    b.sp(J(34.5));
    // Robot.
    b.mode(X(36) + 1, 1.5, "robot");
    b.blk(X(38) + 3, 0, 4, 3); b.sps(X(39) + 2.6, 2);
    barrier(X(41) + 2, 2.4, X(44) - X(41) - 2, 0.5); b.small(J(42)); b.small(J(43));
    tbeam(J(45) - 0.3, 0, 1.6, 0.7, true); b.blk(X(46) + 2.6, 0, 4, 2); b.sps(X(47) + 2, 2);
    b.blk(X(49) + 2, 2.3, X(52) - X(49), 0.7); b.small(J(50)); b.small(J(51));
    b.blk(X(53) + 3, 0, 3, 1.5); b.blk(X(54) + 3, 0, 3, 3); b.sps(X(55) + 2, 2);
    barrier(X(57) + 2, 3.4, X(60) - X(57) - 2, 0.5); b.sps(J(58, 2), 2);
    tbeam(J(61) - 0.3, 0, 1.6, 0.7, true); tbeam(J(62) - 0.3, 0, 1.6, 0.7, false); tbeam(J(63) - 0.3, 0, 1.6, 0.7, true);
    b.blk(X(65) + 3, 0, 4, 2.4); b.sps(X(66) + 2.4, 2);
    b.text(X(67), 4.4, "Phase 2: Security Network");
    // ================= PHASE 2: SECURITY NETWORK (ball, UFO) =================
    b.zone(X(70), X(106), 0, 7);
    b.mode(X(71), 1.5, "ball");
    for (let k = 0; k < 5; k++) { const x = X(74 + k * 1.5) + 1.5; if (k % 2 === 0) b.sps(x, 3); else b.csps(x, 3, 7); }
    // Timed gates: each pillar slides to the floor or ceiling half on the beat.
    for (let k = 0; k < 4; k++) { const x = X(82 + k * 2) + 2; b.mblk(x, 1.75, 2, 3.5, b.mvs(0, 1.75, 4, b.phaseAt(x + 1, 4, k % 2 ? 0.15 : 0.65), 0.2), "gate"); }
    b.grav(X(90) + 2, 3.5, "up");
    b.text(X(89), 5.6, "Gravity flip");
    b.sps(X(92) + 2, 3); b.csps(X(93) + 2, 3, 7);
    tbeam(X(94) + 1, 0, 3, 3, true, 1.5); b.csps(X(95) + 2, 2, 7);
    b.grav(X(97) + 2, 3.5, "down");
    b.sps(X(99) + 2, 3); b.csps(X(100) + 2, 2, 7);
    b.blk(X(102), 3.4, X(106) - X(102), 3.6);
    b.mode(X(104), 1.5, "ufo");
    b.zone(X(106), X(150), 0, 9);
    b.text(X(105) + 2, 6.6, "UFO: deliberate taps");
    b.sps(X(107), Math.floor(X(146) - X(107)));
    b.blk(X(108) + 2, 2.4, 3, 0.6); b.blk(X(110) + 1, 3.8, 3, 0.6);
    slideGate(b, X(112) + 2, 1.5, 0, 9, 3.4, 2.6, 6.2, 4, b.phaseAt(X(112) + 2.75, 4, 0.15), "gate");
    slideGate(b, X(114) + 2, 1.5, 0, 9, 3.4, 2.6, 6.2, 4, b.phaseAt(X(114) + 2.75, 4, 0.65), "gate");
    // Token 2: the upper alcove, behind its own sliding gate.
    b.blk(X(116) + 2, 5.6, X(124) - X(116) - 2, 0.5);
    slideGate(b, X(118) + 2, 1.2, 6.1, 9, 1.8, 6.9, 8.1, 4, b.phaseAt(X(118) + 2.6, 4, 0.65), "gate");
    b.token(X(121) + 1, 7.6);
    b.csps(X(122) + 1, 2, 9);
    b.gate(X(117) + 2, 1.5, 0, 5.6, 1.4, 4.6); b.gate(X(119) + 2, 1.5, 0, 5.6, 0.6, 3.8); b.gate(X(121) + 2, 1.5, 0, 5.6, 1.6, 4.8);
    // Security lasers switch on (the Guardian is waking).
    b.beam(X(125), 4.8, X(130) - X(125), 4.2, [[126, 128.5]], 1.5);
    b.beam(X(125), 0.8, X(130) - X(125), 3.4, [[128.5, 130.5]], 1.5);
    slideGate(b, X(131) + 2, 1.5, 0, 9, 3.4, 2.4, 6.4, 4, b.phaseAt(X(131) + 2.75, 4, 0.65), "gate");
    b.blk(X(133) + 2, 3.2, 3, 0.6); b.saw(X(134) + 3, 7.2, 0.9);
    slideGate(b, X(136) + 2, 1.5, 0, 9, 3.4, 2.4, 6.4, 4, b.phaseAt(X(136) + 2.75, 4, 0.15), "gate");
    b.beam(X(138), 4.6, X(142) - X(138), 4.4, [[138.5, 140.5]], 1.5);
    b.text(X(141), 6.6, "Something is coming...");
    b.blk(X(144) + 1, 6.5, 3, 2.5); b.blk(X(145) + 1, 3.2, X(150) - X(145) - 1, 5.8);
    b.mode(X(148), 1.5, "ship");
    // ================= PHASE 3: THE GRID GUARDIAN (ship, wave) — fast =================
    b.zone(X(150), X(196), 0, 10);
    b.text(X(150) + 2, 7.6, "Phase 3: The Grid Guardian");
    b.text(X(151), 6.6, "Fly through the gold gates to damage it!");
    // Attack 1: targeting beams. The lanes light up a beat early, then fire.
    b.beam(X(152), 5.2, X(156) - X(152), 4.8, [[152.5, 154.5]], 1, null, "boss");
    b.beam(X(152), 0, X(156) - X(152), 4.6, [[154.75, 156.5]], 1, null, "boss");
    b.bgate(X(157) + 2);
    // Attack 2: sweeping barriers. A bar sweeps up and down; pass while it is far from you.
    b.beam(X(159), 4.5, 1.2, 1.0, [[157, 166]], 1, b.mv(0, 3.6, 4, b.phaseAt(X(159) + 0.6, 4, 0.25)), "sweep");
    b.beam(X(161) + 2, 4.5, 1.2, 1.0, [[157, 166]], 1, b.mv(0, 3.6, 4, b.phaseAt(X(161) + 2.6, 4, 0.75)), "sweep");
    b.beam(X(163) + 3, 4.5, 1.2, 1.0, [[157, 168]], 1, b.mv(0, 3.6, 4, b.phaseAt(X(163) + 3.6, 4, 0.25)), "sweep");
    b.bgate(X(166) + 1);
    // Attack 3: moving openings.
    slideGate(b, X(168) + 2, 1.5, 0, 10, 3.6, 3.0, 7.0, 4, b.phaseAt(X(168) + 2.75, 4, 0.15), "boss");
    slideGate(b, X(170) + 2, 1.5, 0, 10, 3.6, 3.0, 7.0, 4, b.phaseAt(X(170) + 2.75, 4, 0.65), "boss");
    slideGate(b, X(172) + 2, 1.5, 0, 10, 3.6, 3.0, 7.0, 4, b.phaseAt(X(172) + 2.75, 4, 0.15), "boss");
    // Token 3: a narrow upper lane between pulses (well away from any portal).
    b.blk(X(174) + 2, 6.4, X(180) - X(174) - 2, 0.5);
    b.pulse(X(176), 8.2, 0.9, [[b.beatAt(X(176)) - 0.6, b.beatAt(X(176)) - 0.1]], 1);
    b.saw(X(177) + 2, 8.9, 0.7); b.token(X(178) + 1, 7.6); b.saw(X(179) + 0.5, 7.0, 0.5);
    // Attack 4: pulse patterns below. Each pulse rings a beat early, then bursts.
    for (let k = 0; k < 4; k++) {
      const x = X(175 + k * 1.25) + 1, y = k % 2 ? 4.6 : 1.8, ba = b.beatAt(x);
      b.pulse(x, y, 1.3, [[ba - 0.5, ba + 0.5]], 1);
    }
    b.bgate(X(181) + 1);
    b.beam(X(183), 0, X(187) - X(183), 4.4, [[183.5, 185.5]], 1, null, "boss");
    b.beam(X(183), 5.6, X(187) - X(183), 4.4, [[185.75, 187.5]], 1, null, "boss");
    b.blk(X(189) + 1, 6.5, 3, 3.5); b.blk(X(190) + 1, 3.2, X(196) - X(190) - 1, 6.8);
    b.mode(X(193), 1.5, "wave");
    // Wave under fire.
    b.zone(X(196), X(234), 0, 9);
    let p = wpath(196, 1.6, [["f", 1], ["u", 1], ["d", 0.5], ["u", 0.5], ["d", 1], ["u", 0.5], ["f", 0.5]]);
    wtunnel([[X(194) + 2, 1.6]].concat(p), 3.4, 0, 9);
    b.bgate(X(201) + 1);
    let y = p[p.length - 1][1];
    p = wpath(201, y, [["u", 0.5], ["d", 0.5], ["u", 0.5], ["f", 1], ["d", 0.5], ["u", 0.25], ["d", 0.25], ["f", 0.5]]);
    wtunnel(p, 3.2, 0, 9);
    for (let k = 0; k < 3; k++) { const pt = p[2 + k]; const ba = b.beatAt(pt[0]); if (k === 1) b.pulse(pt[0] + 0.5, pt[1] + 2.6, 0.6, [[ba - 0.5, ba + 0.5]], 1); }
    y = p[p.length - 1][1];
    // The Guardian's sweep through the wave corridor: an opening that slides with the beat.
    p = wpath(205, y, [["f", 3]]);
    wtunnel(p, 6.4, 0, 9);
    slideGate(b, X(206), 1.0, 0, 9, 2.8, y - 1.0, y + 1.0, 2, b.phaseAt(X(206) + 0.5, 2, 0.15), "boss");
    slideGate(b, X(207), 1.0, 0, 9, 2.8, y - 1.0, y + 1.0, 2, b.phaseAt(X(207) + 0.5, 2, 0.15), "boss");
    b.bgate(X(208) + 1);
    p = wpath(208, y, [["u", 0.5], ["d", 1], ["u", 0.5], ["u", 0.25], ["d", 0.5], ["u", 0.25], ["f", 0.5], ["d", 0.5], ["u", 0.5], ["f", 0.5]]);
    wtunnel(p, 3.0, 0, 9);
    y = p[p.length - 1][1];
    b.bgate(X(213) + 1.5);
    p = wpath(213, y, [["f", 0.5], ["u", 0.5], ["d", 0.25], ["u", 0.25], ["d", 0.75], ["u", 0.5], ["d", 0.25], ["u", 0.25], ["d", 0.25]]);
    wtunnel(p, 3.0, 0, 9);
    y = p[p.length - 1][1];
    p = wpath(216.5, y, [["f", 1], ["d", (y - 1.6) / X(1) * (X(1) / (X(218) - X(217)))], ["f", 1]]);
    wtunnel(p, 3.0, 0, 9);
    b.text(X(219), 6.2, "Final gate!");
    b.bgate(X(220) + 1);
    b.blk(X(222), 3.4, X(234) - X(222), 5.6);
    b.mode(X(223) + 1, 1.5, "cube");
    // ================= PHASE 4: ESCAPE AND VICTORY (cube, robot) =================
    b.text(X(225), 4.4, "The Guardian is down. ESCAPE!");
    // The opening motif again, faster and doubled.
    b.sp(J(228)); b.sp(J(229)); b.sps(J(230, 2), 2); b.sps(J(231, 3), 3);
    b.sp(J(233)); b.sp(J(234)); b.sps(J(235, 2), 2); b.sps(J(236, 3), 3);
    b.blk(X(238) + 2.6, 0, 5.4, 1); b.blk(X(239) + 2.6, 0, 5.4, 2); b.blk(X(240) + 2.6, 0, 5.4, 3);
    b.sps(X(241) + 2.2, 3);
    b.pad(X(243) + 1); b.blk(X(243) + 4.6, 0, 6, 3); b.sps(X(244) + 5, 2); b.orb(X(245) + 2.6, 2.6); b.sps(X(245) + 0.6, 5);
    b.sp(J(248)); b.sps(J(249, 2), 2);
    b.mode(X(251) + 1, 1.5, "robot");
    b.blk(X(253) + 3, 0, 4, 3); b.sps(X(254) + 2.6, 2);
    barrier(X(256) + 2, 2.4, X(259) - X(256) - 2, 0.5); b.small(J(257)); b.small(J(258));
    b.blk(X(260) + 3, 0, 3, 1.5); b.blk(X(261) + 3, 0, 3, 3); b.sps(X(262) + 2, 2);
    tbeam(J(264) - 0.3, 0, 1.6, 0.7, true); b.sps(J(265.5, 2), 2);
    b.mode(X(267) + 1, 1.5, "cube");
    b.sp(J(269)); b.sps(J(270, 2), 2);
    b.text(X(270), 4.6, "Top speed!");
    // Very fast from beat 272: rooftops, then the great gateway.
    let rx = X(274) + 1;
    [[8, 1], [7, 1.5], [9, 1], [7, 2], [8, 1]].forEach(function (r, i) { b.blk(rx, 0, r[0], r[1]); if (i === 2) b.small(rx + 4, r[1]); rx += r[0]; b.pit(rx, rx + 3.4); rx += 3.4; });
    b.blk(rx, 0, X(283) + 0.6 - rx, 2); b.pad(X(283) + 0.2, 2); b.pit(X(283) + 1.6, X(283) + 18);
    b.orb(X(283) + 8.0, 6.6);
  }));

  GR.BTG = BTG;
  BTG.forEach(function (d) { GR.LEVELS.push(d); });
})();
