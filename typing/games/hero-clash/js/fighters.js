// Hero Clash — fighter definitions.
// Every fighter is plain data: stats, moves (with frame data and hit boxes),
// looks, and text. To add a fighter, add one entry to ROSTER below; the combat
// engine, CPU, menus, and training screens all read from this list.
//
// Frame data words:  s = startup frames, a = active frames, r = recovery frames,
// box = [forward offset, bottom, width, height], lvl = mid | low | over(head),
// hs / bs = hit stun / block stun, kb = knockback, launch = pop-up speed.

const base = {
  "5LP": { name: "Jab", s: 4, a: 3, r: 9, dmg: 3, hs: 16, bs: 10, kb: 0.03, box: [0.2, 1.05, 0.72, 0.4], tier: 1, anim: "jab" },
  "5HP": { name: "Heavy Punch", s: 9, a: 4, r: 18, dmg: 8, hs: 22, bs: 15, kb: 0.07, box: [0.2, 0.95, 0.9, 0.5], tier: 2, charge: "hp", anim: "heavy", mv: [0.035, 0, 2, 9] },
  "5LK": { name: "Quick Kick", s: 6, a: 3, r: 12, dmg: 4, hs: 17, bs: 11, kb: 0.035, box: [0.2, 0.5, 0.98, 0.45], tier: 1, anim: "lkick" },
  "5HK": { name: "Heavy Kick", s: 12, a: 4, r: 21, dmg: 9, hs: 22, bs: 16, kb: 0.17, box: [0.2, 0.85, 1.1, 0.55], tier: 2, wb: true, anim: "hkick", mv: [0.03, 0, 3, 12] },
  "2LP": { name: "Low Jab", s: 5, a: 3, r: 9, dmg: 2.5, hs: 14, bs: 9, kb: 0.03, box: [0.2, 0.5, 0.66, 0.35], tier: 1, crouch: true, anim: "cjab" },
  "2HP": { name: "Uppercut (launcher)", s: 8, a: 5, r: 23, dmg: 8, hs: 20, bs: 14, kb: 0.02, launch: 0.25, box: [0.1, 0.7, 0.72, 1.5], tier: 2, crouch: true, jc: true, anim: "upper" },
  "2LK": { name: "Shin Kick (low)", s: 6, a: 3, r: 11, dmg: 3, hs: 15, bs: 10, kb: 0.03, lvl: "low", box: [0.2, 0, 0.95, 0.32], tier: 1, crouch: true, anim: "clkick" },
  "2HK": { name: "Sweep (low)", s: 11, a: 4, r: 25, dmg: 7, hs: 20, bs: 14, kb: 0.08, lvl: "low", kd: true, box: [0.2, 0, 1.2, 0.36], tier: 2, crouch: true, anim: "sweep" },
  "jLP": { name: "Air Jab", s: 4, a: 8, r: 6, dmg: 4, hs: 16, bs: 10, kb: 0.04, lvl: "over", box: [0.05, 0.35, 0.68, 0.55], tier: 1, air: true, anim: "ajab" },
  "jHP": { name: "Air Smash", s: 7, a: 6, r: 8, dmg: 8, hs: 21, bs: 14, kb: 0.08, lvl: "over", box: [0.05, 0.0, 0.8, 0.8], tier: 2, air: true, anim: "asmash" },
  "jLK": { name: "Air Kick", s: 5, a: 10, r: 6, dmg: 4.5, hs: 17, bs: 11, kb: 0.05, lvl: "over", box: [0.1, 0.1, 0.85, 0.5], tier: 1, air: true, anim: "akick" },
  "jHK": { name: "Dive Kick", s: 8, a: 7, r: 8, dmg: 8.5, hs: 21, bs: 14, kb: 0.12, lvl: "over", box: [0.1, -0.15, 0.95, 0.65], tier: 2, air: true, anim: "adive" },
  dashAtk: { name: "Dash Strike", s: 6, a: 5, r: 20, dmg: 7, hs: 20, bs: 14, kb: 0.16, box: [0.15, 0.6, 0.95, 0.8], tier: 2, mv: [0.13, 0, 0, 11], wb: true, anim: "dashatk" },
  throw: { name: "Throw", type: "throw", s: 5, a: 2, r: 24, dmg: 11, range: 0.5, tier: 2, anim: "throw" },
};

const sp = (name, o) => Object.assign({ name, tier: 3, hs: 22, bs: 16, kb: 0.1, anim: "cast" }, o);
const shot = (o) => Object.assign({ t: 10, shape: "orb", vx: 0.2, dmg: 7, hs: 20, bs: 14, kb: 0.08, w: 0.5, h: 0.45, life: 110 }, o);
const ult = (name, o) => Object.assign({ name, tier: 4, s: 8, a: 6, r: 34, dmg: 34, hs: 30, bs: 20, kb: 0.1,
  box: [0.1, 0.1, 1.7, 1.7], mv: [0.17, 0, 2, 14], anim: "ultgo" }, o);
const beats = (len, n) => { // n damage beats spread through the cinematic, the last one biggest
  const b = []; for (let i = 0; i < n; i++) b.push({ t: Math.round(len * (0.3 + 0.6 * i / (n - 1))), w: i === n - 1 ? 3 : 1 });
  return { len, beats: b };
};

// ---------------------------------------------------------------- roster
// stats shown on the select screen are 1-10. "diff" is 1 (easy) to 5 (advanced).
const R = [];

R.push({
  id: "titan", name: "Titan Prime", title: "The Unbreakable Guardian", el: "power", ai: "grappler", side: "hero",
  style: "Heavy powerhouse", diff: 2, stat: { power: 9, speed: 4, defense: 8, range: 4 },
  bio: "Raised under a distant star, Titan Prime stands between Metro City and anything that threatens it. Slow to anger, impossible to move.",
  quote: "Stand down. Nobody has to get hurt today.",
  hp: 112, power: 1.12, walk: 0.047, dashV: 0.15, jumpV: 0.245, frame: 1.12, reach: 1.08, weight: 1.15,
  sp: {
    sp1: sp("Power Punch", { s: 14, a: 5, r: 24, dmg: 13, kb: 0.24, wb: true, armor: [4, 19], mv: [0.11, 0, 6, 19], box: [0.2, 0.8, 1.1, 0.8], anim: "bigpunch" }),
    sp2: sp("Heroic Leap", { s: 22, a: 5, r: 22, dmg: 12, lvl: "over", kd: true, hop: [0.115, 0.26, 4], box: [0.0, 0.0, 1.0, 1.0], anim: "leap", float: false }),
    sp3: sp("Ground Slam", { s: 15, a: 4, r: 26, dmg: 10, lvl: "low", launch: 0.27, kb: 0.02, box: [0.2, 0, 2.3, 0.5], anim: "slam", groundOnly: true }),
    sp4: sp("Shockwave", { s: 13, a: 2, r: 26, dmg: 0, anim: "clap", proj: [shot({ t: 13, shape: "wave", vx: 0.16, w: 0.7, h: 1.5, y: 0.9, dmg: 8, life: 34, kb: 0.16, strong: true })] }),
  },
  ult: ult("Meteor Impact", { cine: beats(300, 3) }),
  look: { h: 1.08, bulk: 1.3, sh: 1.3, body: "suit", mask: "none", hair: "short", emblem: "star", extras: ["cape", "belt", "bracers"],
    c: { main: 0xe9ecf2, sec: 0x1b3f8f, acc: 0xe8b830, glow: 0x7fc4ff, skin: 0xb07a52, hair: 0x1c1410 } },
  costumes: ["Classic Guardian", "Golden Titan", "Cosmic Defender", "Ultimate Champion"],
  anim: { stance: "proud", punch: "hammer", kick: "stomp", victory: "armsCrossed", intro: "flyIn" },
});

R.push({
  id: "shadow", name: "Shadow Knight", title: "Watcher of the Night", el: "gadget", ai: "balanced", side: "hero",
  style: "Martial arts expert", diff: 3, stat: { power: 6, speed: 7, defense: 7, range: 6 },
  bio: "No powers. Just training, planning, and a belt full of inventions. Shadow Knight has a counter ready for everything.",
  quote: "I planned for this an hour ago.",
  hp: 98, power: 1.0, walk: 0.056, dashV: 0.175, jumpV: 0.255, frame: 0.97, reach: 1.0, weight: 1,
  sp: {
    sp1: sp("Gadget Barrage", { s: 11, a: 2, r: 26, dmg: 0, anim: "throwing", proj: [
      shot({ t: 11, shape: "disc", vx: 0.24, dmg: 3.5, y: 1.25, w: 0.35, h: 0.3, hs: 16 }), shot({ t: 17, shape: "disc", vx: 0.24, dmg: 3.5, y: 0.95, w: 0.35, h: 0.3, hs: 16 }), shot({ t: 23, shape: "disc", vx: 0.24, dmg: 3.5, y: 1.25, w: 0.35, h: 0.3, hs: 18 })] }),
    sp2: sp("Grapple Strike", { s: 12, a: 2, r: 30, dmg: 0, anim: "point", proj: [shot({ t: 12, shape: "hook", vx: 0.3, dmg: 6, y: 1.15, w: 0.4, h: 0.3, life: 20, eff: "pull", hs: 30, kb: 0 })] }),
    sp3: sp("Smoke Escape", { s: 6, a: 1, r: 16, dmg: 0, anim: "vanish", inv: [3, 18], tele: { t: 7, to: 3.2 } }),
    sp4: sp("Shadow Counter", { type: "counter", s: 3, a: 22, r: 16, dmg: 0, anim: "counter", ret: { id: "shadowRet", tier: 3, dmg: 12, hs: 26, kb: 0.1, launch: 0.24, el: "gadget" } }),
  },
  ult: ult("Midnight Takedown", { cine: beats(310, 6) }),
  look: { h: 1.0, bulk: 1.05, sh: 1.1, body: "armor", mask: "helm", emblem: "moon", extras: ["cape", "pads", "belt", "gaunt"],
    c: { main: 0x2b2f3d, sec: 0x4a4f66, acc: 0x9aa4c8, glow: 0x8f7bff, skin: 0xd9a37c, hair: 0x111111 } },
  costumes: ["Midnight Armor", "Tactical Shadow", "Phantom Knight", "Dark Champion"],
  anim: { stance: "guard", punch: "karate", kick: "round", victory: "capeSweep", intro: "dropIn" },
});

R.push({
  id: "velocity", name: "Velocity", title: "The Scarlet Streak", el: "speed", ai: "aggressive", side: "hero",
  style: "Speedster", diff: 3, stat: { power: 4, speed: 10, defense: 4, range: 4 },
  bio: "A lab accident, a lightning storm, and a pair of worn-out sneakers. Velocity hits lightly, but she hits a lot.",
  quote: "Blink and you'll miss the whole match.",
  hp: 90, power: 0.86, walk: 0.075, dashV: 0.23, jumpV: 0.26, frame: 0.82, reach: 0.95, weight: 0.92, airDash: true,
  sp: {
    sp1: sp("Rapid Punch Combo", { s: 6, a: 22, r: 16, dmg: 2.4, hits: 6, gap: 4, hs: 14, kb: 0.012, box: [0.2, 0.7, 0.85, 0.8], anim: "flurry", mv: [0.012, 0, 6, 28] }),
    sp2: sp("Speed Dash", { s: 7, a: 8, r: 20, dmg: 9, kb: 0.05, thru: true, mv: [0.34, 0, 7, 15], box: [-0.3, 0.4, 0.9, 1.0], anim: "blur" }),
    sp3: sp("Lightning Charge", { s: 16, a: 1, r: 12, dmg: 0, buff: "haste", buffT: 330, anim: "powerup" }),
    sp4: sp("Afterimage Counter", { type: "counter", s: 2, a: 18, r: 18, dmg: 0, anim: "counter", ret: { id: "velRet", tier: 3, dmg: 10, hs: 28, kb: 0.06, tele: true, el: "speed" } }),
  },
  ult: ult("Hyperdrive Rush", { mv: [0.3, 0, 2, 14], cine: beats(280, 8) }),
  look: { h: 0.95, bulk: 0.85, sh: 0.95, body: "suit", mask: "cowl", emblem: "bolt", extras: ["fins", "belt"],
    c: { main: 0xd2202c, sec: 0xf7c531, acc: 0xffffff, glow: 0xffe066, skin: 0xc98c66, hair: 0x5a2d16 } },
  costumes: ["Classic Speedster", "Electric Velocity", "Neon Rush", "Lightning Champion"],
  anim: { stance: "runner", punch: "boxer", kick: "snap", victory: "jog", intro: "zoomIn" },
});

R.push({
  id: "sentinel", name: "Iron Sentinel", title: "The Flying Fortress", el: "tech", ai: "ranged", side: "hero",
  style: "Armored fighter", diff: 2, stat: { power: 7, speed: 5, defense: 8, range: 9 },
  bio: "An engineer who built a suit of armor in a garage and never stopped upgrading it. Version 41 has a cup holder.",
  quote: "Systems green. Let's make this quick.",
  hp: 106, power: 1.06, walk: 0.052, dashV: 0.16, jumpV: 0.25, frame: 1.02, reach: 1.0, weight: 1.1, airDash: true,
  sp: {
    sp1: sp("Energy Blast", { s: 12, a: 2, r: 24, dmg: 0, anim: "palm", proj: [shot({ t: 12, shape: "bolt", vx: 0.3, dmg: 8, y: 1.2, w: 0.7, h: 0.35 })] }),
    sp2: sp("Flight Strike", { s: 12, a: 12, r: 20, dmg: 11, kb: 0.2, wb: true, hop: [0.2, 0.12, 6], float: true, box: [0.1, 0.2, 0.95, 0.9], anim: "flykick", air: true }),
    sp3: sp("Rocket Barrage", { s: 14, a: 2, r: 30, dmg: 0, anim: "shoulder", proj: [
      shot({ t: 14, shape: "rocket", vx: 0.11, vy: 0.21, g: 0.011, dmg: 6, y: 1.6, lvl: "over", launch: 0.2 }), shot({ t: 22, shape: "rocket", vx: 0.16, vy: 0.21, g: 0.011, dmg: 6, y: 1.6, lvl: "over", launch: 0.2 })] }),
    sp4: sp("Energy Shield", { s: 8, a: 1, r: 14, dmg: 0, buff: "shield", buffT: 170, anim: "powerup" }),
  },
  ult: ult("Maximum Overdrive", { box: [0.1, 0.3, 6.5, 1.2], mv: null, s: 12, cine: beats(300, 5) }),
  look: { h: 1.03, bulk: 1.15, sh: 1.2, body: "robot", mask: "bot", emblem: "ring", extras: ["pads", "gaunt", "jet", "antenna"],
    c: { main: 0xe6e9ef, sec: 0x1f8f9c, acc: 0xff8a2a, glow: 0x4ff0ff, skin: 0xe6e9ef, hair: 0x000000 } },
  costumes: ["Original Armor", "Stealth Armor", "Titanium Elite", "Omega Armor"],
  anim: { stance: "hover", punch: "robot", kick: "stomp", victory: "salute", intro: "jetLand" },
});

R.push({
  id: "thunder", name: "Thunderfist", title: "Voice of the Storm", el: "electric", ai: "balanced", side: "hero",
  style: "Elemental warrior", diff: 2, stat: { power: 8, speed: 6, defense: 6, range: 6 },
  bio: "A mountain rescue worker struck by lightning nine times in one night. Now the lightning asks his permission first.",
  quote: "You hear that rumble? That's your warning.",
  hp: 100, power: 1.02, walk: 0.054, dashV: 0.17, jumpV: 0.25, frame: 1.02, reach: 1.02, weight: 1.05,
  sp: {
    sp1: sp("Lightning Bolt", { s: 14, a: 2, r: 26, dmg: 0, anim: "raise", proj: [shot({ t: 14, shape: "pillar", at: "opp", arm: 22, vx: 0, y: 1.6, w: 0.8, h: 3.4, life: 30, dmg: 9, lvl: "over", hs: 24, noClash: true })] }),
    sp2: sp("Thunder Punch", { s: 11, a: 5, r: 22, dmg: 11, kb: 0.2, wb: true, mv: [0.15, 0, 4, 16], box: [0.2, 0.8, 1.0, 0.7], anim: "bigpunch" }),
    sp3: sp("Static Field", { s: 9, a: 16, r: 18, dmg: 3, hits: 4, gap: 4, hs: 16, kb: 0.02, launch: 0, box: [-0.9, 0, 1.8, 1.9], anim: "powerup" }),
    sp4: sp("Rising Thunder", { s: 6, a: 8, r: 26, dmg: 10, launch: 0.3, kb: 0.03, inv: [1, 9], hop: [0.04, 0.2, 5], box: [0.1, 0.6, 0.8, 1.6], anim: "rising" }),
  },
  ult: ult("Storm of Justice", { cine: beats(300, 5) }),
  look: { h: 1.05, bulk: 1.2, sh: 1.25, body: "armor", mask: "none", hair: "long", emblem: "bolt", extras: ["cape", "bracers", "belt", "beard"],
    c: { main: 0x39424f, sec: 0x8a6d1d, acc: 0xf2d24a, glow: 0x9fd8ff, skin: 0xd8a47c, hair: 0xd9b35a } },
  costumes: ["Storm Warrior", "Voltage Elite", "Skyforged", "Thunder Champion"],
  anim: { stance: "proud", punch: "hammer", kick: "round", victory: "fistSky", intro: "boltIn" },
});

R.push({
  id: "web", name: "Web Phantom", title: "The Friendly Ghost of Midtown", el: "web", ai: "aggressive", side: "hero",
  style: "Agile acrobat", diff: 3, stat: { power: 5, speed: 8, defense: 5, range: 6 },
  bio: "A science-fair project on spider silk went a little too well. Web Phantom jokes the whole fight and never stands still.",
  quote: "Anybody order a thread count of one million?",
  hp: 94, power: 0.93, walk: 0.064, dashV: 0.19, jumpV: 0.275, frame: 0.9, reach: 0.98, weight: 0.9, airJumps: 1, wallJump: true, airDash: true,
  sp: {
    sp1: sp("Silk Shot", { s: 10, a: 2, r: 22, dmg: 0, air: true, anim: "point", proj: [shot({ t: 10, shape: "web", vx: 0.22, dmg: 5, eff: "slow", y: 1.2 })] }),
    sp2: sp("Swing Kick", { s: 10, a: 12, r: 16, dmg: 10, kb: 0.16, hop: [0.16, 0.17, 3], box: [0.1, 0.1, 0.95, 0.8], anim: "flykick", air: true, wb: true }),
    sp3: sp("Trip Line", { s: 11, a: 2, r: 24, dmg: 0, anim: "lowpoint", proj: [shot({ t: 11, shape: "web", vx: 0.24, dmg: 5, y: 0.2, h: 0.3, lvl: "low", eff: "pull", hs: 28, kb: 0, life: 22 })] }),
    sp4: sp("Phantom Flip", { s: 4, a: 10, r: 14, dmg: 7, launch: 0.26, kb: 0.02, inv: [1, 10], hop: [-0.09, 0.2, 3], box: [0.0, 0.3, 0.8, 1.2], anim: "backflip" }),
  },
  ult: ult("Phantom Web Storm", { cine: beats(290, 6) }),
  look: { h: 0.96, bulk: 0.88, sh: 0.98, body: "suit", mask: "full", emblem: "diamond", extras: ["hood", "bracers", "scarf"],
    c: { main: 0x1b2a3a, sec: 0x26c6a8, acc: 0xf4f7fb, glow: 0x7dffe0, skin: 0x1b2a3a, hair: 0x000000 } },
  costumes: ["Classic Phantom", "Night Thread", "Neon Weaver", "Silk Champion"],
  anim: { stance: "low", punch: "boxer", kick: "flip", victory: "handstand", intro: "swingIn" },
});

R.push({
  id: "solar", name: "Solar Guardian", title: "Light of a Thousand Suns", el: "cosmic", ai: "balanced", side: "hero",
  style: "Cosmic powerhouse", diff: 3, stat: { power: 8, speed: 6, defense: 6, range: 8 },
  bio: "A test pilot who flew through a solar flare and came back glowing. She is still getting used to the indoor lighting.",
  quote: "Careful. I'm brighter than I look.",
  hp: 100, power: 1.05, walk: 0.055, dashV: 0.17, jumpV: 0.26, frame: 1.0, reach: 1.0, weight: 1, airDash: true, airJumps: 1,
  sp: {
    sp1: sp("Heat Beam", { s: 14, a: 16, r: 22, dmg: 3, hits: 4, gap: 4, hs: 16, kb: 0.03, box: [0.3, 1.0, 5.2, 0.4], anim: "eyebeam", beam: true }),
    sp2: sp("Nova Strike", { s: 10, a: 6, r: 22, dmg: 11, kb: 0.2, wb: true, mv: [0.17, 0, 4, 16], box: [0.2, 0.6, 1.0, 0.9], anim: "bigpunch" }),
    sp3: sp("Solar Flare", { s: 9, a: 5, r: 26, dmg: 9, launch: 0.29, kb: 0.03, box: [-1.0, 0, 2.0, 2.0], anim: "burst" }),
    sp4: sp("Sunfall", { s: 13, a: 2, r: 26, dmg: 0, anim: "raise", air: true, proj: [shot({ t: 13, shape: "orb", vx: 0.12, vy: 0.2, g: 0.011, y: 2.0, dmg: 9, lvl: "over", w: 0.7, h: 0.7, launch: 0.2 })] }),
  },
  ult: ult("Supernova", { cine: beats(300, 4) }),
  look: { h: 1.02, bulk: 0.98, sh: 1.05, body: "suit", mask: "domino", hair: "longf", emblem: "sun", extras: ["cape", "bracers", "halo"],
    c: { main: 0xf4f1e6, sec: 0xf2a41c, acc: 0xd9442b, glow: 0xffd36a, skin: 0x8c5a3c, hair: 0x1a1210 } },
  costumes: ["Dawn Patrol", "Solar Elite", "Eclipse", "Radiant Champion"],
  anim: { stance: "hover", punch: "palm", kick: "snap", victory: "floatGlow", intro: "flyIn" },
});

R.push({
  id: "sage", name: "Mystic Sage", title: "Keeper of the Ninth Door", el: "magic", ai: "ranged", side: "hero",
  style: "Magical fighter", diff: 4, stat: { power: 6, speed: 5, defense: 5, range: 10 },
  bio: "Librarian by day. By night, also a librarian, but of a much stranger library. Fights with portals, wards, and patience.",
  quote: "The doors are open. Do mind the step.",
  hp: 97, power: 1.06, walk: 0.052, dashV: 0.16, jumpV: 0.25, frame: 1.0, reach: 1.0, weight: 0.95,
  sp: {
    sp1: sp("Arcane Bolt", { s: 12, a: 2, r: 24, dmg: 0, anim: "palm", air: true, proj: [shot({ t: 12, shape: "orb", vx: 0.15, dmg: 8, y: 1.3, homing: 0.004, life: 150 })] }),
    sp2: sp("Portal Step", { s: 9, a: 4, r: 18, dmg: 7, kb: 0.1, inv: [4, 13], tele: { t: 10, to: "behind" }, s2: 1, box: [0.1, 0.6, 0.9, 0.8], anim: "vanish", sA: 14 }),
    sp3: sp("Rune Shield", { s: 8, a: 1, r: 14, dmg: 0, buff: "shield", buffT: 200, anim: "powerup" }),
    sp4: sp("Astral Gate", { s: 14, a: 2, r: 26, dmg: 0, anim: "raise", proj: [shot({ t: 14, shape: "portal", at: "opp", arm: 24, vx: 0, y: 0.7, w: 0.9, h: 1.6, life: 32, dmg: 9, launch: 0.29, kb: 0.01, noClash: true })] }),
  },
  ult: ult("Grand Conjunction", { box: [0.1, 0.2, 5.5, 1.5], mv: null, s: 12, cine: beats(310, 5) }),
  look: { h: 1.0, bulk: 0.9, sh: 1.0, body: "robe", mask: "none", hair: "bun", emblem: "eye", extras: ["collar", "scarf", "bracers", "orbs"],
    c: { main: 0x5b2a86, sec: 0x1c8a8a, acc: 0xe8c56a, glow: 0xc58cff, skin: 0xb9805a, hair: 0xdedede } },
  costumes: ["Keeper's Robes", "Arcane Elite", "Starbound", "Sage Champion"],
  anim: { stance: "caster", punch: "palm", kick: "snap", victory: "levitate", intro: "portalIn" },
});

R.push({
  id: "frost", name: "Frostbite", title: "The Winter Warden", el: "ice", ai: "defensive", side: "hero",
  style: "Ice specialist", diff: 3, stat: { power: 6, speed: 5, defense: 8, range: 7 },
  bio: "An Arctic researcher who got locked out of the station for one very long night. He keeps his cool. Everyone else's, too.",
  quote: "Chill. I insist.",
  hp: 104, power: 0.98, walk: 0.05, dashV: 0.165, jumpV: 0.245, frame: 1.05, reach: 1.02, weight: 1.05,
  sp: {
    sp1: sp("Ice Blast", { s: 13, a: 2, r: 26, dmg: 0, anim: "palm", proj: [shot({ t: 13, shape: "shard", vx: 0.19, dmg: 5, eff: "freeze", y: 1.15 })] }),
    sp2: sp("Ice Slide", { s: 8, a: 12, r: 20, dmg: 8, lvl: "low", kd: true, kb: 0.1, crouch: true, mv: [0.2, 0, 6, 20], box: [0.1, 0, 0.95, 0.4], anim: "slide" }),
    sp3: sp("Glacier Spike", { s: 13, a: 2, r: 26, dmg: 0, anim: "slam", proj: [shot({ t: 13, shape: "spike", at: "opp", arm: 20, vx: 0, y: 0.8, w: 0.8, h: 1.7, life: 28, dmg: 9, launch: 0.28, kb: 0.01, noClash: true })] }),
    sp4: sp("Ice Wall", { s: 8, a: 1, r: 14, dmg: 0, buff: "shield", buffT: 190, anim: "powerup" }),
  },
  ult: ult("Absolute Zero", { cine: beats(290, 4) }),
  look: { h: 1.04, bulk: 1.15, sh: 1.2, body: "armor", mask: "visor", hair: "spiky", emblem: "snow", extras: ["pads", "crystals", "gaunt", "collar"],
    c: { main: 0x2d6fa8, sec: 0xbfe6ff, acc: 0xffffff, glow: 0x9be8ff, skin: 0xc9d9e8, hair: 0xe8f6ff } },
  costumes: ["Polar Gear", "Glacier Elite", "Aurora", "Frost Champion"],
  anim: { stance: "guard", punch: "hammer", kick: "stomp", victory: "iceThrone", intro: "freezeIn" },
});

R.push({
  id: "wildclaw", name: "Wildclaw", title: "Heart of the Jungle", el: "beast", ai: "aggressive", side: "hero",
  style: "Animal-inspired brawler", diff: 2, stat: { power: 7, speed: 8, defense: 5, range: 3 },
  bio: "A wildlife ranger who can borrow the strength of any animal she has ever protected. She has protected a lot of animals.",
  quote: "The jungle sends its regards.",
  hp: 98, power: 1.0, walk: 0.066, dashV: 0.2, jumpV: 0.27, frame: 0.9, reach: 0.95, weight: 0.95, airJumps: 1,
  sp: {
    sp1: sp("Claw Flurry", { s: 7, a: 18, r: 18, dmg: 2.8, hits: 5, gap: 4, hs: 15, kb: 0.015, box: [0.2, 0.6, 0.9, 0.9], anim: "flurry", mv: [0.02, 0, 7, 25] }),
    sp2: sp("Pounce", { s: 9, a: 14, r: 16, dmg: 10, lvl: "over", kd: true, hop: [0.17, 0.2, 3], box: [0.1, 0.0, 0.9, 0.9], anim: "pounce", air: true }),
    sp3: sp("Rising Claw", { s: 5, a: 8, r: 26, dmg: 10, launch: 0.3, kb: 0.03, inv: [1, 8], hop: [0.04, 0.21, 4], box: [0.1, 0.6, 0.8, 1.6], anim: "rising" }),
    sp4: sp("Feral Roll", { s: 7, a: 12, r: 18, dmg: 7, lvl: "low", kb: 0.06, thru: true, crouch: true, projInv: true, mv: [0.21, 0, 5, 19], box: [-0.2, 0, 0.9, 0.6], anim: "roll" }),
  },
  ult: ult("Primal Fury", { cine: beats(280, 7) }),
  look: { h: 0.98, bulk: 1.05, sh: 1.05, body: "suit", mask: "domino", hair: "wild", emblem: "claw", extras: ["ears", "tail", "claws", "furcollar"],
    c: { main: 0xc8761a, sec: 0x3a2a1c, acc: 0xf1e2c4, glow: 0xffb347, skin: 0x9a643f, hair: 0x2a1a10 } },
  costumes: ["Ranger Stripes", "Night Prowler", "Snow Stalker", "Apex Champion"],
  anim: { stance: "low", punch: "claw", kick: "flip", victory: "roar", intro: "leapIn" },
});

R.push({
  id: "archer", name: "Jade Archer", title: "Never Misses Twice", el: "arrow", ai: "ranged", side: "hero",
  style: "Ranged fighter", diff: 4, stat: { power: 6, speed: 6, defense: 4, range: 10 },
  bio: "County-fair archery champion six years running. Her quiver holds forty arrows and at least twelve bad ideas.",
  quote: "Hold still. Actually, don't. More fun that way.",
  hp: 97, power: 1.05, walk: 0.058, dashV: 0.18, jumpV: 0.26, frame: 0.96, reach: 0.98, weight: 0.95,
  sp: {
    sp1: sp("Quick Shot", { s: 10, a: 2, r: 20, dmg: 0, anim: "bow", air: true, proj: [shot({ t: 10, shape: "arrow", vx: 0.34, dmg: 6, y: 1.25, w: 0.6, h: 0.25 })] }),
    sp2: sp("Blast Arrow", { s: 17, a: 2, r: 26, dmg: 0, anim: "bow", proj: [shot({ t: 17, shape: "arrow", vx: 0.26, dmg: 10, y: 1.2, w: 0.6, h: 0.3, launch: 0.25, strong: true, boom: true })] }),
    sp3: sp("Sky Volley", { s: 14, a: 2, r: 28, dmg: 0, anim: "bowup", proj: [
      shot({ t: 14, shape: "arrow", vx: 0.09, vy: 0.26, g: 0.012, dmg: 4, y: 1.7, lvl: "over", w: 0.4 }), shot({ t: 17, shape: "arrow", vx: 0.135, vy: 0.26, g: 0.012, dmg: 4, y: 1.7, lvl: "over", w: 0.4 }), shot({ t: 20, shape: "arrow", vx: 0.18, vy: 0.26, g: 0.012, dmg: 4, y: 1.7, lvl: "over", w: 0.4 })] }),
    sp4: sp("Vault Shot", { s: 6, a: 2, r: 20, dmg: 0, anim: "backflip", inv: [2, 9], hop: [-0.11, 0.21, 3], proj: [shot({ t: 14, shape: "arrow", vx: 0.26, vy: -0.1, dmg: 6, y: 1.0, w: 0.5, h: 0.3 })] }),
  },
  ult: ult("Hundred-Arrow Rain", { box: [0.1, 0.3, 6.5, 1.2], mv: null, s: 12, cine: beats(290, 6) }),
  look: { h: 0.98, bulk: 0.9, sh: 1.0, body: "suit", mask: "domino", hair: "pony", emblem: "arrow", extras: ["hood", "quiver", "bow", "bracers", "belt"],
    c: { main: 0x1e7a4a, sec: 0x2b3a2e, acc: 0xd9c27a, glow: 0x6dffa5, skin: 0xe0b08e, hair: 0xb0502a } },
  costumes: ["Forest Greens", "Marksman Elite", "Moonlit Hunter", "Jade Champion"],
  anim: { stance: "archer", punch: "karate", kick: "snap", victory: "bowSpin", intro: "dropIn" },
});

R.push({
  id: "storm", name: "Stormcaller", title: "Mistress of the Four Winds", el: "wind", ai: "ranged", side: "hero",
  style: "Weather fighter", diff: 3, stat: { power: 6, speed: 6, defense: 5, range: 9 },
  bio: "A TV weather forecaster who got tired of being wrong and decided to take over the job from the sky itself.",
  quote: "Today's forecast: you, flying backward.",
  hp: 95, power: 1.0, walk: 0.055, dashV: 0.18, jumpV: 0.265, frame: 1.0, reach: 1.0, weight: 0.9, airJumps: 1, airDash: true,
  sp: {
    sp1: sp("Gale Force", { s: 11, a: 2, r: 22, dmg: 0, anim: "palm", air: true, proj: [shot({ t: 11, shape: "gust", vx: 0.21, dmg: 4, y: 1.0, w: 0.8, h: 1.2, kb: 0.3, life: 60 })] }),
    sp2: sp("Cyclone", { s: 15, a: 2, r: 26, dmg: 0, anim: "raise", proj: [shot({ t: 15, shape: "tornado", vx: 0.07, dmg: 3, y: 1.0, w: 0.9, h: 2.0, pierce: 3, gap: 9, launch: 0.2, kb: 0.0, life: 110, strong: true })] }),
    sp3: sp("Updraft", { s: 7, a: 6, r: 24, dmg: 8, launch: 0.31, kb: 0.02, box: [-0.6, 0, 1.6, 1.8], anim: "burst", inv: [1, 6] }),
    sp4: sp("Sky Bolt", { s: 14, a: 2, r: 26, dmg: 0, anim: "raise", proj: [shot({ t: 14, shape: "pillar", at: "opp", arm: 22, vx: 0, y: 1.6, w: 0.8, h: 3.4, life: 30, dmg: 9, lvl: "over", hs: 24, noClash: true, el: "electric" })] }),
  },
  ult: ult("Eye of the Storm", { cine: beats(300, 6) }),
  look: { h: 1.0, bulk: 0.92, sh: 1.0, body: "suit", mask: "none", hair: "longf", emblem: "cloud", extras: ["cape", "bracers", "collar", "halo"],
    c: { main: 0x59687d, sec: 0xdfe8f2, acc: 0x78d0ff, glow: 0xc9ecff, skin: 0x6e4630, hair: 0xf2f2f2 } },
  costumes: ["Cloud Walker", "Monsoon Elite", "Northern Lights", "Storm Champion"],
  anim: { stance: "hover", punch: "palm", kick: "round", victory: "windSpin", intro: "flyIn" },
});

R.push({
  id: "ninja", name: "Phantom Ninja", title: "The Unseen Blade", el: "shadow", ai: "aggressive", side: "villain",
  style: "Stealth specialist", diff: 4, stat: { power: 6, speed: 9, defense: 4, range: 5 },
  bio: "Nobody knows who trained the Phantom Ninja. Several people have asked. None of them saw where the answer came from.",
  quote: "You were looking the wrong way.",
  hp: 94, power: 1.0, walk: 0.068, dashV: 0.21, jumpV: 0.27, frame: 0.88, reach: 0.97, weight: 0.92, airJumps: 1,
  sp: {
    sp1: sp("Shadow Star", { s: 9, a: 2, r: 20, dmg: 0, anim: "throwing", air: true, proj: [shot({ t: 9, shape: "star", vx: 0.32, dmg: 5, y: 1.2, w: 0.35, h: 0.3 })] }),
    sp2: sp("Shadow Strike", { s: 14, a: 5, r: 20, dmg: 9, kb: 0.1, inv: [4, 12], tele: { t: 10, to: "behind" }, box: [0.1, 0.6, 0.95, 0.8], anim: "vanish" }),
    sp3: sp("Smoke Veil", { s: 6, a: 1, r: 8, dmg: 0, inv: [3, 14], tele: { t: 7, to: "above" }, anim: "vanish" }),
    sp4: sp("Vanish Counter", { type: "counter", s: 2, a: 20, r: 16, dmg: 0, anim: "counter", ret: { id: "ninjaRet", tier: 3, dmg: 11, hs: 26, kb: 0.08, tele: true, el: "shadow" } }),
  },
  ult: ult("Thousand Shadows", { mv: [0.26, 0, 2, 14], cine: beats(290, 8) }),
  look: { h: 0.97, bulk: 0.9, sh: 1.0, body: "suit", mask: "ninja", emblem: "none", extras: ["scarf", "bracers", "belt", "sash", "blade"],
    c: { main: 0x20222b, sec: 0x6c1d8f, acc: 0xb8bcc8, glow: 0xb070ff, skin: 0xd6a880, hair: 0x000000 } },
  costumes: ["Night Wraps", "Crimson Shade", "White Lotus", "Shadow Champion"],
  anim: { stance: "ninja", punch: "karate", kick: "flip", victory: "vanishPose", intro: "smokeIn" },
});

R.push({
  id: "overlord", name: "Dark Overlord", title: "Emperor of the Void", el: "dark", ai: "defensive", side: "villain",
  style: "Powerful villain", diff: 3, stat: { power: 9, speed: 3, defense: 8, range: 8 },
  bio: "He conquered one world out of boredom and seven more out of habit. Earth is next on a very long list.",
  quote: "Kneel, and I may remember your name.",
  hp: 110, power: 1.1, walk: 0.044, dashV: 0.15, jumpV: 0.24, frame: 1.14, reach: 1.1, weight: 1.15,
  sp: {
    sp1: sp("Dark Orb", { s: 15, a: 2, r: 26, dmg: 0, anim: "palm", proj: [shot({ t: 15, shape: "orb", vx: 0.12, dmg: 10, y: 1.2, w: 0.85, h: 0.85, strong: true, life: 160 })] }),
    sp2: sp("Gravity Crush", { s: 15, a: 2, r: 28, dmg: 0, anim: "raise", proj: [shot({ t: 15, shape: "crush", at: "opp", arm: 24, vx: 0, y: 1.2, w: 1.0, h: 2.6, life: 30, dmg: 10, lvl: "over", kd: true, noClash: true })] }),
    sp3: sp("Void Pull", { s: 13, a: 2, r: 28, dmg: 0, anim: "point", proj: [shot({ t: 13, shape: "hook", vx: 0.28, dmg: 5, y: 1.15, w: 0.5, h: 0.5, life: 24, eff: "pull", hs: 32, kb: 0 })] }),
    sp4: sp("Dread Smash", { s: 16, a: 5, r: 26, dmg: 14, kb: 0.24, wb: true, armor: [3, 21], mv: [0.09, 0, 8, 21], box: [0.2, 0.3, 1.2, 1.4], anim: "bigpunch" }),
  },
  ult: ult("Event Horizon", { box: [0.1, 0.2, 5.0, 1.6], mv: null, s: 14, cine: beats(310, 4) }),
  look: { h: 1.12, bulk: 1.3, sh: 1.35, body: "armor", mask: "crown", emblem: "void", extras: ["cape", "pads", "horns", "gaunt", "spikes"],
    c: { main: 0x231629, sec: 0x5a1a7a, acc: 0xc9a23a, glow: 0xd04cff, skin: 0x8c8fa8, hair: 0x000000 } },
  costumes: ["Void Regalia", "Conqueror's Plate", "Starless Night", "Overlord Supreme"],
  anim: { stance: "regal", punch: "palm", kick: "stomp", victory: "throne", intro: "riseIn" },
});

R.push({
  id: "mecha", name: "Mecha Destroyer", title: "Unit Zero", el: "mech", ai: "grappler", side: "villain",
  style: "Robotic villain", diff: 2, stat: { power: 10, speed: 3, defense: 9, range: 7 },
  bio: "Built to demolish buildings, then accidentally given an opinion. Its opinion is that everything is a building.",
  quote: "TARGET ACQUIRED. PLEASE REMAIN STATIONARY.",
  hp: 116, power: 1.14, walk: 0.042, dashV: 0.145, jumpV: 0.235, frame: 1.18, reach: 1.12, weight: 1.25,
  sp: {
    sp1: sp("Laser Sweep", { s: 16, a: 14, r: 24, dmg: 3.2, hits: 4, gap: 4, hs: 16, kb: 0.03, box: [0.3, 0.9, 5.0, 0.4], anim: "eyebeam", beam: true }),
    sp2: sp("Piston Charge", { s: 15, a: 8, r: 26, dmg: 13, kb: 0.25, wb: true, armor: [3, 23], mv: [0.13, 0, 6, 23], box: [0.2, 0.3, 1.0, 1.3], anim: "shoulder" }),
    sp3: sp("Rocket Salvo", { s: 16, a: 2, r: 32, dmg: 0, anim: "shoulder", proj: [
      shot({ t: 16, shape: "rocket", vx: 0.09, vy: 0.24, g: 0.011, dmg: 6, y: 1.9, lvl: "over", launch: 0.2 }), shot({ t: 22, shape: "rocket", vx: 0.13, vy: 0.24, g: 0.011, dmg: 6, y: 1.9, lvl: "over", launch: 0.2 }), shot({ t: 28, shape: "rocket", vx: 0.17, vy: 0.24, g: 0.011, dmg: 6, y: 1.9, lvl: "over", launch: 0.2 })] }),
    sp4: sp("Scrap Grab", { s: 9, a: 4, r: 30, dmg: 14, unblock: true, groundOnly: true, kd: true, launch: 0.25, kb: 0.14, box: [0.15, 0.3, 0.75, 1.2], anim: "grab" }),
  },
  ult: ult("Total Demolition", { cine: beats(300, 5) }),
  look: { h: 1.15, bulk: 1.45, sh: 1.45, body: "robot", mask: "bot", emblem: "gear", extras: ["pads", "gaunt", "antenna", "pipes", "spikes"],
    c: { main: 0x6b2a22, sec: 0x30343c, acc: 0xf2b22a, glow: 0xff3b2f, skin: 0x30343c, hair: 0x000000 } },
  costumes: ["Factory Finish", "Chrome Crusher", "Hazard Stripe", "Destroyer Prime"],
  anim: { stance: "robot", punch: "robot", kick: "stomp", victory: "steamVent", intro: "bootUp" },
});

R.push({
  id: "inferno", name: "Inferno", title: "The Living Wildfire", el: "fire", ai: "aggressive", side: "villain",
  style: "Fire-powered villain", diff: 2, stat: { power: 8, speed: 7, defense: 4, range: 7 },
  bio: "A stunt performer whose biggest trick went wrong and never went out. Loves an audience. Hates sprinklers.",
  quote: "Is it warm in here, or is it just me? It's me.",
  hp: 94, power: 1.07, walk: 0.06, dashV: 0.19, jumpV: 0.26, frame: 0.96, reach: 1.0, weight: 0.95,
  sp: {
    sp1: sp("Fireball", { s: 11, a: 2, r: 22, dmg: 0, anim: "palm", air: true, proj: [shot({ t: 11, shape: "fire", vx: 0.22, dmg: 8, y: 1.15 })] }),
    sp2: sp("Flame Dash", { s: 8, a: 10, r: 22, dmg: 10, kb: 0.12, thru: true, mv: [0.26, 0, 6, 18], box: [-0.2, 0.3, 1.0, 1.1], anim: "blur" }),
    sp3: sp("Fire Shockwave", { s: 14, a: 2, r: 26, dmg: 0, anim: "slam", proj: [shot({ t: 14, shape: "wave", vx: 0.18, dmg: 8, y: 0.3, w: 0.8, h: 0.6, lvl: "low", kd: true, life: 40 })] }),
    sp4: sp("Rising Blaze", { s: 5, a: 9, r: 26, dmg: 10, launch: 0.3, kb: 0.03, inv: [1, 8], hop: [0.05, 0.21, 4], box: [0.1, 0.6, 0.8, 1.6], anim: "rising" }),
  },
  ult: ult("Inferno Unleashed", { cine: beats(290, 5) }),
  look: { h: 1.0, bulk: 1.0, sh: 1.08, body: "suit", mask: "none", hair: "flame", emblem: "flame", extras: ["bracers", "belt", "embers", "collar"],
    c: { main: 0x2a1512, sec: 0xe2511a, acc: 0xffc247, glow: 0xff7a1a, skin: 0xc4532a, hair: 0xffa51f } },
  costumes: ["Stage Leathers", "Blue Flame", "Magma Core", "Wildfire Supreme"],
  anim: { stance: "boxer", punch: "boxer", kick: "round", victory: "flameBow", intro: "fireIn" },
});

// ----- Secret fighter: The Professor (locked until earned; see progress.js) -----
R.push({
  id: "professor", name: "The Professor", title: "Master of Math and Science", el: "math", ai: "balanced", side: "hero", secret: true,
  style: "Tactical genius", diff: 5, stat: { power: 7, speed: 7, defense: 8, range: 8 },
  bio: "By day he teaches math and science. By night... he grades papers. But when the bell rings for battle, class is in session.",
  quote: "You've passed every test so far. Let's see how you handle mine.",
  hp: 100, power: 0.98, walk: 0.058, dashV: 0.185, jumpV: 0.255, frame: 0.96, reach: 1.02, weight: 1,
  names: { "5LP": "Calculated Jab", "5HP": "Scientific Strike", "5HK": "Geometry Kick", dashAtk: "Pop Quiz Dash", parry: "Equation Counter" },
  sp: {
    sp1: sp("Algebra Assault", { s: 11, a: 2, r: 26, dmg: 0, anim: "palm", proj: [
      shot({ t: 11, shape: "sym", sym: "x²", vx: 0.23, dmg: 3.5, y: 1.3, w: 0.45, hs: 16 }), shot({ t: 17, shape: "sym", sym: "π", vx: 0.23, dmg: 3.5, y: 0.95, w: 0.45, hs: 16 }), shot({ t: 23, shape: "sym", sym: "√", vx: 0.23, dmg: 3.5, y: 1.3, w: 0.45, hs: 18 })] }),
    sp2: sp("Detention Dash", { s: 10, a: 7, r: 24, dmg: 11, kb: 0.24, wb: true, mv: [0.2, 0, 5, 17], box: [0.15, 0.4, 1.0, 1.1], anim: "blur", say: "You're staying after class!" }),
    sp3: sp("Gravity Experiment", { s: 11, a: 5, r: 24, dmg: 8, launch: 0.32, kb: 0.01, box: [0.2, 0, 1.5, 1.6], anim: "device", jc: true }),
    sp4: sp("Geometric Barrier", { s: 6, a: 1, r: 12, dmg: 0, buff: "shield", buffT: 150, anim: "powerup" }),
    sp5: sp("Chemistry Reaction", { s: 13, a: 2, r: 26, dmg: 0, anim: "throwing", proj: [shot({ t: 13, shape: "flask", vx: 0.13, vy: 0.17, g: 0.012, dmg: 9, y: 1.5, w: 0.8, h: 0.8, lvl: "over", launch: 0.22, boom: true })] }),
  },
  ult: ult("FINAL EXAM!", { box: [0.1, 0.2, 4.5, 1.6], mv: null, s: 12, cine: beats(340, 6) }),
  look: { h: 1.02, bulk: 1.05, sh: 1.12, body: "suit", mask: "none", hair: "short", emblem: "sigma", extras: ["coat", "glasses", "beard", "gaunt", "belt", "symbols"],
    c: { main: 0x1f4f9e, sec: 0xc3ccd9, acc: 0x8fd4ff, glow: 0x4fb8ff, skin: 0xe6b594, hair: 0xb5541f } },
  costumes: ["Classroom Classic", "Science Commander", "Mathematical Master", "Legendary Professor"],
  anim: { stance: "teacher", punch: "karate", kick: "round", victory: "straighten", intro: "classIn" },
});

// ---------------------------------------------------------------- build
const SP_INPUT = { sp1: "Special", sp2: "Forward + Special", sp3: "Down + Special", sp4: "Back + Special", sp5: "Block + Special" };
const scaleFrames = (m, k) => { m.s = Math.max(2, Math.round(m.s * k)); m.r = Math.max(4, Math.round(m.r * k)); };

function build(c) {
  const moves = {};
  for (const [id, b] of Object.entries(base)) {
    const m = Object.assign({ id, lvl: "mid", el: c.el }, b);
    if (m.box) { m.box = m.box.slice(); m.box[2] *= c.reach; m.box[1] *= c.look.h; m.box[3] *= c.look.h; }
    if (m.mv) m.mv = m.mv.slice();
    if (m.type === "throw") m.range *= c.reach;
    scaleFrames(m, c.frame);
    if (c.names && c.names[id]) m.name = c.names[id];
    moves[id] = m;
  }
  for (const [id, s] of Object.entries(c.sp)) {
    const m = Object.assign({ id, lvl: "mid", el: c.el, a: 2, input: SP_INPUT[id] }, s);
    if (m.proj) for (const p of m.proj) { p.el = p.el || c.el; p.lvl = p.lvl || "mid"; }
    if (m.ret) m.ret.lvl = "mid";
    moves[id] = m;
  }
  moves.ult = Object.assign({ id: "ult", lvl: "mid", el: c.el, input: "Ultimate (full meter)" }, c.ult);
  if (moves.ult.mv === null) delete moves.ult.mv;
  return Object.assign({
    width: 0.36 * (0.85 + 0.15 * c.look.sh), height: 1.8 * c.look.h, dashLen: 14, jumpX: 0.062 + c.walk * 0.25,
    links: { "5HP": ["5HK"], "2LP": ["2LK", "5LP"], "2LK": ["2LP"], "jLP": ["jLK"], "jLK": ["jLP"] },
  }, c, { moves });
}

export const ROSTER = R.map(build);
export const BY_ID = Object.fromEntries(ROSTER.map((f) => [f.id, f]));
export const MAIN_ROSTER = ROSTER.filter((f) => !f.secret);

// Combos every fighter can do (shown in Training). Each fighter's specials are added on the end.
export function combosFor(f) {
  const M = f.moves;
  const list = [
    { name: "Two-hit starter", keys: ["lp", "hp"], text: "Light Punch, Heavy Punch" },
    { name: "Three-hit string", keys: ["lp", "lp", "hp"], text: "Light Punch, Light Punch, Heavy Punch" },
    { name: "Four-hit string", keys: ["lp", "lp", "lk", "hp"], text: "Light Punch, Light Punch, Light Kick, Heavy Punch" },
    { name: "Five-hit finisher", keys: ["lp", "lp", "lk", "hp", "hk"], text: "Light Punch ×2, Light Kick, Heavy Punch, Heavy Kick" },
    { name: "Launcher juggle", keys: ["lp", "d+hp", "u", "hp"], text: "Light Punch, Down + Heavy Punch (launch), hold Up to follow them into the air, Heavy Punch (Air Smash)" },
  ];
  const ender = ["sp2", "sp1", "sp4", "sp3"].map((k) => M[k]).filter((m) => m && m.box && m.type !== "counter" && !m.tele && !m.hop && !m.unblock).sort((a, b) => a.s - b.s)[0];
  if (ender) list.push({ name: "Special ender", keys: ["lp", "lk", "hp", ender.id], text: `Light Punch, Light Kick, Heavy Punch, then ${ender.input} (${ender.name})` });
  list.push({ name: "Ultimate combo", keys: ["lp", "hp", "ult"], text: "Light Punch, Heavy Punch, then Ultimate (needs a full meter)" });
  return list;
}
