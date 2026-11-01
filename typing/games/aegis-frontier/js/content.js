// Ringfall: all of the authored game content in one place (world layout, sites, missions,
// dialogue, collectibles). Coordinates are meters: x = east, z = south (north is -z).
// Everything here is plain data so the campaign can grow without rewriting the game systems.

export const WORLD_HALF = 640;
export const WATER_Y = 0;

// ---------------- Regions ----------------
// Each region owns the land closest to its center point. Borders are rocky ridges with passes.
export const REGIONS = [
  { id: "G", name: "Greenreach Valley", c: [0, 330], color: "#5fae4a", open: true },
  { id: "C", name: "Cinderstone Canyon", c: [430, 140], color: "#d0804a", flag: "region:C" },
  { id: "R", name: "Cloudcrest Ridge", c: [-430, 140], color: "#9fb4c8", flag: "region:R" },
  { id: "W", name: "Glasswater Basin", c: [-260, -370], color: "#3fa7c9", flag: "region:W" },
  { id: "X", name: "Meridian Citadel", c: [310, -390], color: "#c9b8ff", flag: "region:X" },
];
// Gaps in the border ridges. A pass is the midpoint between two region centers.
export const PASSES = [["G", "C"], ["G", "R"], ["R", "W"], ["W", "X"], ["C", "X"]];

// Roads: [x, z] or [x, z, fixedHeight]. Width in meters.
export const ROADS = [
  { w: 9, pts: [[20, 532], [-20, 500], [20, 440], [60, 392], [84, 320], [62, 262], [140, 238], [215, 235], [300, 250], [390, 282], [500, 310]] },
  { w: 8, pts: [[50, 380], [-40, 362], [-130, 330], [-215, 235], [-300, 250]] },
  { w: 8, pts: [[300, 250], [345, 175], [425, 118], [462, 60], [470, 34]] },
  { w: 8, pts: [[425, 118], [530, 182]] },
  { w: 8, pts: [[470, -10], [430, -60], [370, -125], [305, -250], [262, -372]] },
  { w: 8, pts: [[-300, 250], [-360, 205], [-405, 150], [-425, 40], [-418, -10]] },
  { w: 8, pts: [[-405, 150], [-470, 200], [-530, 175], [-530, 120], [-505, 112, 60]] },
  { w: 8, pts: [[-418, -10], [-385, -55], [-345, -84], [-345, -146], [-325, -190], [-300, -240]] },
  { w: 8, pts: [[-300, -250], [-200, -300], [-100, -300], [25, -380], [110, -335]] },
  { w: 9, pts: [[110, -335], [180, -380], [262, -400], [340, -450]] },
  { w: 7, pts: [[-210, 300], [-250, 520]] },
];
// Water-filled hollows and gorges.
export const LAKES = [
  { x: -110, z: 420, r: 44, depth: 4.5 },
  { x: 140, z: 520, r: 26, depth: 2.5 },
];
export const GORGES = [
  { a: [-452, -115], b: [-238, -115], w: 22, floor: -5 },  // the Long Crossing
  { a: [380, 92], b: [472, 150], w: 18, floor: 2 },          // Spanbreaker's canyon bridge
  { a: [-58, 476], b: [-80, 458], w: 5, floor: -1.1, bank: 16 },   // Greenreach creek (runs to the lake)
  { a: [-80, 458], b: [-96, 444], w: 6, floor: -1.2, bank: 16 },
];

// ---------------- Sites ----------------
// kind decides which structure builder runs. r = flat pad radius. h = forced pad height.
export const SITES = [
  { id: "crash", kind: "crash", x: 20, z: 540, r: 24, region: "G", name: "Skyfall Crash Site" },
  { id: "ruin", kind: "ruin", x: -42, z: 517, region: "G", name: "The Old Span" },
  { id: "shelter", kind: "shelter", x: -40, z: 486, r: 14, region: "G", name: "Waystation Shelter" },
  { id: "training", kind: "training", x: -250, z: 530, r: 46, region: "G", name: "Aegis Training Grounds" },
  { id: "B1", kind: "base", x: 60, z: 380, r: 30, region: "G", name: "Greenreach Outpost" },
  { id: "B2", kind: "base", x: -185, z: 298, r: 26, region: "G", name: "Lakeside Post" },
  { id: "T1", kind: "relay", x: -190, z: 392, r: 12, region: "G", name: "West Relay Tower" },
  { id: "T2", kind: "relay", x: 172, z: 452, r: 12, region: "G", name: "Meadow Relay Tower" },
  { id: "T3", kind: "relay", x: 26, z: 250, r: 12, region: "G", name: "North Relay Tower" },
  { id: "B3", kind: "base", x: 300, z: 252, r: 28, region: "C", name: "Cinder Gate Post" },
  { id: "overlook", kind: "spire", x: 360, z: 232, h: 13, region: "C", name: "Redrock Overlook" },
  { id: "S1", kind: "checkpoint", x: 392, z: 284, r: 34, region: "C", name: "Redrock Checkpoint" },
  { id: "convoy", kind: "convoy", x: 500, z: 312, r: 22, region: "C", name: "Stranded Convoy" },
  { id: "B4", kind: "base", x: 532, z: 190, r: 26, region: "C", name: "Mesa Depot" },
  { id: "K3", kind: "bridge", x: 425, z: 118, region: "C", name: "Spanbreaker Bridge" },
  { id: "S2", kind: "foundry", x: 468, z: 4, r: 50, region: "C", name: "The Silent Foundry" },
  { id: "K1", kind: "arena", x: 520, z: 432, r: 26, region: "C", name: "Keystone Plaza" },
  { id: "B5", kind: "base", x: -300, z: 252, r: 28, region: "R", name: "Ridgeway Post" },
  { id: "station", kind: "station", x: -496, z: 112, r: 30, h: 60, region: "R", name: "Highpoint Station" },
  { id: "S3", kind: "hangar", x: -420, z: -38, r: 36, region: "R", name: "Highwind Hangar" },
  { id: "K2", kind: "arena", x: -528, z: -14, r: 22, region: "R", name: "Hivemind Clearing" },
  { id: "K5", kind: "pillars", x: -540, z: 236, r: 30, region: "R", name: "Vantage Pillars" },
  { id: "B6", kind: "base", x: -520, z: 352, r: 24, region: "R", name: "Summit Post" },
  { id: "crossing", kind: "crossing", x: -345, z: -115, region: "R", name: "The Long Crossing" },
  { id: "B7", kind: "base", x: -300, z: -252, r: 28, region: "W", name: "Glasswater Landing" },
  { id: "K4", kind: "arena", x: -440, z: -262, r: 20, h: 2, region: "W", name: "Mender Isle" },
  { id: "vault", kind: "vault", x: -470, z: -432, r: 36, h: 3, region: "W", name: "The Signal Vault" },
  { id: "S4", kind: "hydro", x: -110, z: -472, r: 42, h: 3, region: "W", name: "Glasswater Hydro Works" },
  { id: "tower", kind: "flighttower", x: -90, z: -292, r: 26, region: "W", name: "Skybridge Flight Tower" },
  { id: "B8", kind: "base", x: 110, z: -332, r: 30, region: "X", name: "Rally Point" },
  { id: "S5", kind: "bastion", x: 244, z: -404, r: 46, region: "X", name: "Citadel Gate Bastion" },
  { id: "citadel", kind: "citadel", x: 420, z: -492, r: 66, region: "X", name: "Meridian Citadel" },
  // Rescue sites
  { id: "R1", kind: "rescue", x: -212, z: 478, r: 12, region: "G", name: "Fernbrook Camp" },
  { id: "R2", kind: "rescue", x: 194, z: 334, r: 12, region: "G", name: "Hilltop Shelter" },
  { id: "R3", kind: "rescue", x: 340, z: 402, r: 12, region: "C", name: "Dustwind Survey" },
  { id: "R4", kind: "rescue", x: 300, z: 60, r: 12, region: "C", name: "Copper Wash Camp" },
  { id: "R5", kind: "rescue", x: -382, z: 372, r: 12, region: "R", name: "Pinecrest Hut" },
  { id: "R6", kind: "rescue", x: -540, z: 64, r: 12, region: "R", name: "Cloudline Survey" },
  { id: "R7", kind: "rescue", x: -268, z: -20, r: 12, region: "R", name: "Boulder Run Camp" },
  { id: "R8", kind: "rescue", x: -540, z: -332, r: 12, h: 2, region: "W", name: "Reedbank Station" },
  { id: "R9", kind: "rescue", x: -236, z: -440, r: 12, h: 2, region: "W", name: "Mistwater Shelter" },
  { id: "R10", kind: "rescue", x: -24, z: -172, r: 12, region: "W", name: "Basin Rim Camp" },
  { id: "R11", kind: "rescue", x: 200, z: -238, r: 12, region: "X", name: "Spire Road Team" },
  { id: "R12", kind: "rescue", x: 470, z: -262, r: 12, region: "X", name: "Lumen Lab Annex" },
  // Tall rock spires that hide collectibles on top (the tether is the way up)
  { id: "sp1", kind: "spire", x: -96, z: 516, h: 16, region: "G" },
  { id: "sp2", kind: "spire", x: 250, z: 500, h: 20, region: "G" },
  { id: "sp3", kind: "spire", x: 540, z: 280, h: 24, region: "C" },
  { id: "sp4", kind: "spire", x: -540, z: 420, h: 22, region: "R" },
  { id: "sp5", kind: "spire", x: -380, z: -350, h: 18, region: "W" },
  { id: "sp6", kind: "spire", x: 520, z: -380, h: 26, region: "X" },
  { id: "sp7", kind: "spire", x: 300, z: -150, h: 20, region: "C" },
  { id: "sp8", kind: "spire", x: -60, z: 300, h: 14, region: "G" },
];
export const siteById = Object.fromEntries(SITES.map((s) => [s.id, s]));

// ---------------- Characters ----------------
export const CAST = {
  luma: { name: "LUMA", color: "#6ff2e0" },
  rowan: { name: "Pilot Rowan", color: "#ffc46b" },
  watford: { name: "Commander Watford", color: "#8fc4ff" },
  atlas: { name: "ATLAS", color: "#c49bff" },
  ranger: { name: "Ranger", color: "#a9f08a" },
  team: { name: "Research Team", color: "#ffe9a8" },
  robot: { name: "Directorate Unit", color: "#d6b2ff" },
};

// ---------------- Robots ----------------
// Hostile units are all machines. Stats are for Standard difficulty.
export const ROBOTS = {
  scout:    { name: "Scout", hp: 45, shield: 0, speed: 6.4, r: 0.5, h: 1.05, view: 72, dmg: 4, burst: 4, gap: 0.14, rest: 1.3, bolt: 55, spread: 0.05, range: 46, alerts: 52, cover: false, flank: 0.6, sp: 1 },
  sentry:   { name: "Sentry", hp: 80, shield: 45, speed: 3.9, r: 0.55, h: 1.95, view: 62, dmg: 6, burst: 3, gap: 0.22, rest: 1.5, bolt: 48, spread: 0.04, range: 58, cover: true, flank: 0.25, sp: 1 },
  bulwark:  { name: "Bulwark", hp: 150, shield: 0, front: true, speed: 2.7, turn: 1.5, r: 0.75, h: 2.1, view: 58, dmg: 11, burst: 2, gap: 0.45, rest: 1.7, bolt: 40, spread: 0.035, range: 46, cover: false, flank: 0, sp: 2 },
  warden:   { name: "Warden", hp: 420, shield: 0, armor: 0.5, speed: 2.3, turn: 1.2, r: 1.15, h: 3.3, view: 60, dmg: 16, burst: 3, gap: 0.3, rest: 2.4, bolt: 34, spread: 0.05, range: 50, slam: true, cover: false, flank: 0, sp: 3 },
  skimmer:  { name: "Skimmer", hp: 50, shield: 0, fly: true, speed: 8.5, r: 0.7, h: 0.7, view: 70, dmg: 5, burst: 5, gap: 0.12, rest: 1.6, bolt: 42, spread: 0.06, range: 52, cover: false, flank: 1, sp: 1 },
  engineer: { name: "Engineer", hp: 65, shield: 30, speed: 4.2, r: 0.55, h: 1.6, view: 55, dmg: 4, burst: 2, gap: 0.3, rest: 2.2, bolt: 44, spread: 0.06, range: 40, repair: true, cover: true, flank: 0.1, sp: 2 },
  turret:   { name: "Turret", hp: 240, shield: 0, armor: 0.75, still: true, turn: 1.6, arc: 2.2, r: 0.9, h: 1.7, view: 66, dmg: 6, burst: 8, gap: 0.1, rest: 1.6, bolt: 60, spread: 0.03, range: 66, telegraph: 0.6, power: true, cover: false, flank: 0, sp: 2 },
};
// Commanders are tougher robots with one special rule each.
export const COMMANDERS = {
  sentinel:   { base: "warden", name: "Ridge Sentinel", hp: 650, emitters: 2, mission: true, line: "Ridge access restricted. Please present a permit. You do not have a permit." },
  gatekeeper: { base: "warden", name: "Gatekeeper", hp: 820, emitters: 3, summon: "sentry", mission: true, line: "The Citadel is closed for maintenance. Maintenance is forever." },
  keystone:   { base: "bulwark", name: "Keystone", hp: 560, emitters: 3, line: "Shield integrity: magnificent. Your chances: under review." },
  hivemind:   { base: "engineer", name: "Hivemind Relay", hp: 380, shield: 120, summon: "skimmer", line: "Drones, assemble. Neatly, please." },
  spanbreaker:{ base: "warden", name: "Spanbreaker", hp: 900, armor: 0.55, line: "This bridge is closed. I am the closing." },
  mender:     { base: "engineer", name: "Mender Prime", hp: 420, shield: 150, helpers: 3, line: "Repairs scheduled. You are not on the schedule." },
  vantage:    { base: "sentry", name: "Vantage", hp: 360, shield: 120, precise: true, hop: true, line: "Calculating a better angle. Several better angles." },
  gridlock:   { base: "engineer", name: "Gridlock", hp: 480, shield: 140, barriers: true, line: "Barrier grid online. Please queue in an orderly fashion." },
};
export const COMMANDER_SITES = [
  { id: "K1", cmd: "keystone", site: "K1", core: true, sp: 6, unlock: "suit:ember" },
  { id: "K2", cmd: "hivemind", site: "K2", core: true, sp: 6 },
  { id: "K3", cmd: "spanbreaker", site: "K3", core: true, sp: 6 },
  { id: "K4", cmd: "mender", site: "K4", core: true, sp: 6 },
  { id: "K5", cmd: "vantage", site: "K5", core: true, sp: 6, unlock: "suit:glacier" },
  { id: "K6", cmd: "gridlock", site: "S4", core: true, sp: 6 },
];

// ---------------- Encounters ----------------
// units: [type, dx, dz, opts]. opts.y = height above the site floor (posted on a platform),
// opts.patrol = list of [dx, dz] points, opts.cmd = commander id.
// until = the flag that retires the encounter for good. need = the flag/mission required for it to appear.
export const ENCOUNTERS = {
  m1_bots:   { site: "crash", dx: -40, dz: -30, until: "clear:m1_bots", need: { mission: "m1", obj: "bots" }, units: [["scout", -6, -4, { training: true }], ["scout", 5, -8, { training: true }], ["scout", 0, -18, { training: true }]] },
  B1: { site: "B1", base: true, units: [["sentry", -10, -6], ["sentry", 10, 4], ["scout", 0, -18, { patrol: [[0, -18], [16, -10], [0, 8], [-16, -10]] }], ["sentry", 4, 12]], reinforce: { from: [0, -60], units: [["scout", 0, 0], ["sentry", 3, 2]] } },
  B2: { site: "B2", base: true, units: [["sentry", -8, 6], ["engineer", 6, 10], ["scout", 12, -10, { patrol: [[12, -10], [-12, -10]] }], ["sentry", 0, -14]] },
  B3: { site: "B3", base: true, units: [["sentry", -9, -6], ["bulwark", 6, 6], ["scout", 14, -14], ["sentry", 0, 14]], reinforce: { from: [60, 0], units: [["sentry", 0, 0], ["scout", 2, 3]] } },
  B4: { site: "B4", base: true, units: [["bulwark", -6, 0], ["sentry", 8, -8], ["engineer", 0, 12], ["skimmer", 0, -10], ["turret", 14, 14, { y: 0 }]] },
  B5: { site: "B5", base: true, units: [["sentry", -8, -8], ["sentry", 9, 6], ["skimmer", 0, 0], ["engineer", -4, 12]], reinforce: { from: [-50, 30], units: [["skimmer", 0, 0], ["skimmer", 4, 0]] } },
  B6: { site: "B6", base: true, units: [["warden", 0, -6], ["sentry", 10, 8], ["scout", -12, 6]] },
  B7: { site: "B7", base: true, units: [["sentry", -8, -8], ["bulwark", 8, 0], ["skimmer", 0, 10], ["engineer", -10, 10], ["sentry", 6, -14]], reinforce: { from: [0, -70], units: [["sentry", 0, 0], ["bulwark", 3, 0]] } },
  B8: { site: "B8", base: true, units: [["sentry", -10, -6], ["bulwark", 10, -4], ["warden", 0, 10], ["skimmer", -6, 6], ["turret", 14, -14, { y: 0 }]], reinforce: { from: [80, -40], units: [["sentry", 0, 0], ["sentry", 3, 2], ["scout", -3, 2]] } },
  T1: { site: "T1", until: "relay:T1", units: [["sentry", -8, 5], ["scout", 8, -6], ["sentry", 4, 10]] },
  T2: { site: "T2", until: "relay:T2", units: [["sentry", 7, 7], ["sentry", -7, 3], ["engineer", 0, -10]] },
  T3: { site: "T3", until: "relay:T3", units: [["bulwark", 0, 8], ["scout", -9, -6], ["scout", 9, -6]] },
  S1: { site: "S1", until: "stronghold:S1", units: [["sentry", -12, -10, { y: 6 }], ["sentry", 12, -10, { y: 6 }], ["bulwark", 0, 4], ["turret", 0, -16, { y: 0 }], ["scout", -16, 12], ["scout", 16, 12], ["engineer", 0, 18]], reinforce: { from: [70, 10], units: [["sentry", 0, 0], ["bulwark", 2, 2]] } },
  m4_ambush: { site: "convoy", dx: 0, dz: 0, until: "convoy:repair", need: { mission: "m4", obj: "repair" }, delay: 3, units: [["scout", 30, -20], ["sentry", 34, -10], ["sentry", 28, 6], ["skimmer", 20, -30]] },
  m4_road:   { site: "S1", dx: -40, dz: -40, until: "escort:m4", need: { mission: "m4", obj: "escort" }, units: [["sentry", -10, -20], ["scout", 10, -26], ["bulwark", 0, -30]] },
  S2: { site: "S2", until: "stronghold:S2", units: [["sentry", -20, 14], ["sentry", 20, 14], ["bulwark", 0, 18], ["warden", 0, -6], ["engineer", -12, -12], ["engineer", 12, -12], ["turret", -26, 26, { y: 0 }], ["turret", 26, 26, { y: 0 }], ["sentry", -14, -22, { y: 8 }], ["sentry", 14, -22, { y: 8 }], ["skimmer", 0, 0]], reinforce: { from: [0, -70], units: [["sentry", 0, 0], ["sentry", 3, 0], ["skimmer", 0, 3]] } },
  m5_sentinel: { site: "station", dx: 0, dz: 8, until: "clear:m5_sentinel", need: { mission: "m5", obj: "sentinel" }, units: [["warden", 0, 0, { cmd: "sentinel" }], ["sentry", -12, 8], ["sentry", 12, 8]] },
  station: { site: "station", until: "sensor:on", need: { mission: "m5" }, units: [["sentry", -14, -10], ["scout", 14, -10], ["skimmer", 0, -16]] },
  S3: { site: "S3", until: "stronghold:S3", units: [["sentry", -14, 10], ["sentry", 14, 10], ["bulwark", 0, 16], ["skimmer", -10, -6], ["skimmer", 10, -6], ["engineer", 0, -20], ["turret", 18, -18, { y: 0 }]] },
  crossing_n: { site: "crossing", dx: 0, dz: 58, until: "crossing_restored", need: { mission: "m7" }, units: [["sentry", -10, 0], ["sentry", 10, 4], ["scout", 0, 12]] },
  m7_bridge: { site: "crossing", dx: 0, dz: -10, until: "escort:m7", need: { mission: "m7", obj: "escort" }, units: [["skimmer", -14, 0], ["skimmer", 14, 0], ["skimmer", 0, -16]] },
  m7_south:  { site: "crossing", dx: 0, dz: -78, until: "escort:m7", need: { mission: "m7", obj: "escort" }, units: [["sentry", -12, 0], ["bulwark", 8, -4], ["sentry", 14, 6], ["engineer", 0, -12]] },
  vault_out: { site: "vault", dx: 0, dz: 30, until: "vault:core", need: { mission: "m8" }, units: [["sentry", -14, 0, { patrol: [[-14, 0], [-14, 20], [14, 20], [14, 0]] }], ["scout", 14, 4], ["skimmer", 0, 26]] },
  vault_in:  { site: "vault", dx: 0, dz: -6, until: "vault:core", need: { mission: "m8", obj: "explore" }, units: [["sentry", -6, -4], ["engineer", 6, -8]] },
  m8_exit:   { site: "vault", dx: 0, dz: 40, until: "clear:m8_exit", need: { mission: "m8", obj: "escape" }, units: [["sentry", -10, 0], ["bulwark", 10, 0], ["skimmer", 0, 10], ["skimmer", 6, 14]] },
  S4: { site: "S4", until: "stronghold:S4", units: [["sentry", -18, 14], ["sentry", 18, 14], ["bulwark", 0, 20], ["engineer", -20, -10], ["turret", 24, -20, { y: 0 }], ["skimmer", 0, 0]] },
  sky_aa: { site: "tower", until: "tower:on", need: { mission: "m9" }, units: [["turret", -22, -16, { y: 16, aa: 1 }], ["turret", 24, -8, { y: 22, aa: 2 }], ["turret", 4, 26, { y: 28, aa: 3 }], ["skimmer", -10, 10], ["skimmer", 12, 6], ["sentry", 0, 14]] },
  m10_wave:  { site: "B8", dx: 50, dz: -20, until: "clear:m10_wave", need: { mission: "m10", obj: "defend" }, units: [["sentry", 0, 0], ["sentry", 6, 4], ["scout", -6, 6], ["skimmer", 0, -8]], reinforce: { from: [30, -30], at: 0.6, units: [["bulwark", 0, 0], ["sentry", 3, 2], ["skimmer", -3, 2]] } },
  S5: { site: "S5", until: "stronghold:S5", units: [["sentry", -20, 16], ["sentry", 20, 16], ["bulwark", -6, 6], ["bulwark", 6, 6], ["turret", -28, -10, { y: 0 }], ["turret", 28, -10, { y: 0 }], ["skimmer", 0, -10], ["engineer", 0, 20], ["sentry", -16, -20, { y: 9 }], ["sentry", 16, -20, { y: 9 }]], reinforce: { from: [0, 70], units: [["sentry", 0, 0], ["sentry", 3, 0], ["bulwark", 0, 3]] } },
  m11_gatekeeper: { site: "S5", dx: 0, dz: -30, until: "clear:m11_gatekeeper", need: { mission: "m11", obj: "gatekeeper" }, units: [["warden", 0, 0, { cmd: "gatekeeper" }], ["sentry", -10, 6], ["sentry", 10, 6]] },
  // Road patrols (come back after a reload; they give the frontier some life)
  p_g0: { site: "ruin", dx: 0, dz: -18, patrolGroup: true, need: { flag: "clear:m1_bots" }, until: "region:C", units: [["scout", 0, 0, { patrol: [[0, 0], [24, 6], [10, -20], [-18, -10]] }], ["sentry", 3, 3, { patrol: [[0, 0], [24, 6], [10, -20], [-18, -10]] }]] },
  p_g1: { site: "B1", dx: -90, dz: 40, patrolGroup: true, need: { flag: "base:B1" }, until: "region:C", units: [["scout", 0, 0, { patrol: [[0, 0], [40, 30], [80, 0], [40, -30]] }], ["sentry", 3, 3, { patrol: [[0, 0], [40, 30], [80, 0], [40, -30]] }]] },
  p_c1: { site: "B3", dx: 70, dz: -110, patrolGroup: true, units: [["sentry", 0, 0, { patrol: [[0, 0], [30, 40], [0, 80], [-30, 40]] }], ["scout", 3, 0, { patrol: [[0, 0], [30, 40], [0, 80], [-30, 40]] }]] },
  p_r1: { site: "B5", dx: -60, dz: -170, patrolGroup: true, units: [["skimmer", 0, 0, { patrol: [[0, 0], [50, -20], [0, -60], [-40, -20]] }], ["sentry", 0, 0, { patrol: [[0, 0], [50, -20], [0, -60], [-40, -20]] }]] },
  p_w1: { site: "B7", dx: 120, dz: -40, patrolGroup: true, units: [["skimmer", 0, 0, { patrol: [[0, 0], [60, 0], [60, -60], [0, -60]] }], ["skimmer", 4, 0, { patrol: [[0, 0], [60, 0], [60, -60], [0, -60]] }]] },
  p_x1: { site: "B8", dx: 80, dz: 60, patrolGroup: true, until: "boss:atlas", units: [["sentry", 0, 0, { patrol: [[0, 0], [60, 20], [100, -20]] }], ["bulwark", 3, 0, { patrol: [[0, 0], [60, 20], [100, -20]] }]] },
};
// Rescue guards and commanders are added to ENCOUNTERS below.

// ---------------- Rescues ----------------
// type: "shield" (repair a damaged shelter shield), "locked" (bring an energy cell to the door), "patrol" (clear the machines)
export const RESCUES = [
  { id: "R1", type: "shield", team: 3, guards: [["scout", 10, -8], ["sentry", -10, -10], ["scout", 0, 14]], thanks: "We thought the patrol would never leave! Thank you, Guardian." },
  { id: "R2", type: "locked", team: 2, guards: [["sentry", 12, 0], ["scout", -12, -6]], thanks: "Fresh air! And you brought a power cell. Very thoughtful." },
  { id: "R3", type: "patrol", team: 3, guards: [["sentry", 10, -10], ["sentry", -10, -10], ["bulwark", 0, -16]], thanks: "Our survey drones are safe too. We owe you a sandwich." },
  { id: "R4", type: "shield", team: 2, guards: [["sentry", 12, 6], ["engineer", -10, 8], ["scout", 0, -14]], thanks: "The shield was down to its last flicker. Perfect timing." },
  { id: "R5", type: "locked", team: 3, guards: [["sentry", 10, 8], ["skimmer", -6, -8]], thanks: "We locked ourselves in for safety. Then we lost the key. Thank you!" },
  { id: "R6", type: "patrol", team: 2, guards: [["skimmer", 0, -10], ["skimmer", 8, -12], ["sentry", -10, 6]], thanks: "Those drones circled for hours. Thank you, Guardian." },
  { id: "R7", type: "shield", team: 3, guards: [["bulwark", 0, -12], ["scout", 10, 6], ["scout", -10, 6]], thanks: "Thank you! We'll head somewhere with more walls and fewer robots." },
  { id: "R8", type: "patrol", team: 2, guards: [["sentry", 10, -8], ["engineer", -10, -8], ["skimmer", 0, 12]], thanks: "The water samples are safe, and so are we!" },
  { id: "R9", type: "locked", team: 3, guards: [["sentry", -10, 8], ["bulwark", 10, 6]], thanks: "We were starting to name the robots outside. Glad we don't have to." },
  { id: "R10", type: "shield", team: 2, guards: [["sentry", 0, -12], ["skimmer", 8, 8], ["scout", -8, 8]], thanks: "Shield's holding again. You're a lifesaver, Guardian." },
  { id: "R11", type: "patrol", team: 3, guards: [["bulwark", 0, -10], ["sentry", 10, 4], ["sentry", -10, 4], ["skimmer", 0, 12]], thanks: "We're ready for the Citadel too. Well, almost ready." },
  { id: "R12", type: "locked", team: 2, guards: [["warden", 0, -14], ["sentry", 10, 8]], thanks: "Thank you! The annex door was older than both of us combined." },
];
for (const r of RESCUES) ENCOUNTERS["rescue_" + r.id] = { site: r.id, until: "rescue:" + r.id, guardOf: r.id, units: r.guards };
for (const c of COMMANDER_SITES) {
  const site = c.site;
  const extra = c.cmd === "mender" ? [["skimmer", 6, 6], ["skimmer", -6, 6]] : c.cmd === "spanbreaker" ? [["sentry", -8, -24], ["sentry", 8, -24]] : [];
  const pos = c.cmd === "gridlock" ? [0, -22] : [0, 0];
  ENCOUNTERS["cmd_" + c.id] = { site, dx: pos[0], dz: pos[1], until: "cmd:" + c.id, commander: c.id, units: [[COMMANDERS[c.cmd].base, 0, 0, { cmd: c.cmd }], ...extra] };
}

// ---------------- Strongholds ----------------
export const STRONGHOLDS = [
  { id: "S1", name: "Redrock Checkpoint", goal: "Disable both shield emitters and the checkpoint guards.", sp: 8, core: true },
  { id: "S2", name: "The Silent Foundry", goal: "Cut both power lines, then shut down the assembly controller.", sp: 10, core: true },
  { id: "S3", name: "Highwind Hangar", goal: "Recover the transport key from the hangar and return it to the flight desk.", sp: 8, core: true, unlock: "suit:sky" },
  { id: "S4", name: "Glasswater Hydro Works", goal: "Carry two energy cells to the turbine sockets to reconnect power.", sp: 8, core: true },
  { id: "S5", name: "Citadel Gate Bastion", goal: "Disable the outer defense emitters and reach the command transit lift.", sp: 10, core: true },
];

// ---------------- Optional courses (rover course and tether routes) ----------------
export const COURSES = [
  { id: "rc1", kind: "rover", name: "Meadow Sprint", at: [100, 470], par: 55, sp: 3, unlock: "suit:meadow",
    rings: [[130, 500], [190, 520], [240, 470], [230, 400], [160, 360], [110, 420]] },
  { id: "rc2", kind: "rover", name: "Canyon Rally", at: [330, 210], par: 70, sp: 4, need: "region:C",
    rings: [[360, 170], [420, 140], [470, 170], [520, 230], [470, 260], [380, 240]] },
  { id: "gr1", kind: "tether", name: "Valley Skyline", at: [-150, 500], par: 40, sp: 3,
    rings: [[-140, 508, 10], [-120, 520, 14], [-100, 516, 18], [-80, 500, 12], [-60, 510, 9]] },
  { id: "gr2", kind: "tether", name: "Ridge Runner", at: [-470, 220], par: 50, sp: 4, need: "region:R", unlock: "suit:ridge",
    rings: [[-480, 236, 30], [-505, 240, 36], [-528, 236, 44], [-540, 214, 40], [-520, 196, 34]] },
];

// ---------------- Collectibles ----------------
// at: [x, z] on the ground, or { on: siteId } to sit on top of a structure/spire. dy lifts it.
export const CORES_HIDDEN = [
  { id: "h1", on: "sp1", hint: "Atop a rock spire near the crash site" },
  { id: "h2", on: "sp2", hint: "Atop the tall meadow spire" },
  { id: "h3", on: "sp3", hint: "Atop a canyon spire by the east cliffs" },
  { id: "h4", at: [-530, 160], dy: 1, hint: "On the Ridge Runner course cliffs" },
  { id: "h5", on: "sp5", hint: "Atop a lake spire west of Glasswater Landing" },
  { id: "h6", at: [-470, -470], dy: 1, hint: "Behind the Signal Vault" },
  { id: "h7", on: "sp7", hint: "Atop the spire by the Citadel pass" },
  { id: "h8", at: [372, -560], dy: 1, hint: "Behind the Citadel's south wall" },
];
// Which activities hand out the other 22 cores: 11 missions (m1-m11), 5 strongholds, 6 commanders.
export const CORE_TOTAL = 30;

export const EMBLEMS = [
  { id: "e1", on: "sp8", name: "Confetti Circuit", mod: "confetti", desc: "Disabled robots release a burst of harmless confetti sparks." },
  { id: "e2", on: "sp4", name: "Afterburner", mod: "boost", desc: "Vehicles get 50% more boost." },
  { id: "e3", at: [-80, -320], dy: 30, name: "Quick Charge", mod: "cooldown", desc: "Equipment cooldowns are 30% shorter." },
  { id: "e4", on: "sp6", name: "Clear View", mod: "minimal", desc: "Hides everything on the HUD except the crosshair, shields, and objective." },
  { id: "e5", at: [-540, 236], dy: 34, name: "Chatterbox", mod: "banter", desc: "Robots say more of their (very polite) lines." },
];

export const RECORDINGS = [
  { id: "r1", at: [6, 552], title: "Shuttle Log: Final Approach", by: "Pilot Rowan", text: "Approach vector is good. Wind is good. Everything is good. Note to self: stop saying everything is good before landing." },
  { id: "r2", at: [-34, 494], title: "Waystation Notice Board", by: "Meridian Parks Office", text: "Reminder: the meadow deer are wild. Please do not offer them granola bars, even if they look hungry. They always look hungry." },
  { id: "r3", at: [74, 394], title: "Outpost Duty Roster", by: "Ranger Okafor", text: "Monday: relay check. Tuesday: relay check. Wednesday: someone please fix the coffee machine so we can do the relay check." },
  { id: "r4", at: [-196, 404], title: "Relay Technician's Note", by: "Tech Imani", text: "The towers keep the valley talking. When they go quiet, everyone gets nervous. Keep them humming, and people stay calm." },
  { id: "r5", at: [-120, 470], title: "Lakeside Field Journal", by: "Dr. Hollis", text: "Counted forty-two herons today. Lost count twice. Started over twice. It was a very peaceful afternoon." },
  { id: "r6", at: [306, 268], title: "Gate Post Logbook", by: "Ranger Castellan", text: "Convoy left at dawn. Promised to radio when they reached the canyon floor. Still waiting. I'm going to keep waiting." },
  { id: "r7", at: [500, 324], title: "Convoy Driver's Message", by: "Driver Benning", text: "Shields at forty percent. Snacks at ten percent. Morale is surprisingly high. Somebody brought a harmonica." },
  { id: "r8", at: [460, 40], title: "Foundry Shift Report", by: "Directorate Line Monitor", text: "Production rate: optimal. Purpose of production: unclear. Request for clarification: denied. Continuing production." },
  { id: "r9", at: [540, 200], title: "Mesa Depot Inventory", by: "Quartermaster Vale", text: "Two hundred energy cells, eleven spare wheels, one very confused weather balloon. Do not ask about the balloon." },
  { id: "r10", at: [-292, 268], title: "Ridgeway Trail Marker", by: "Meridian Parks Office", text: "Trail rated: challenging. Views rated: worth it. Please stay on the path and leave the mountain where you found it." },
  { id: "r11", at: [-500, 124], dy: 0, title: "Highpoint Sensor Calibration", by: "Dr. Anand", text: "From up here you can see the whole frontier curve into the sky. Every time I look up, I'm reminded how much care it takes to keep a world running." },
  { id: "r12", at: [-430, -20], title: "Hangar Flight Plan", by: "Pilot Rowan", text: "Filed a flight plan for a scenic loop around the ridge. Requested approval from the Directorate. Approval was a rude noise." },
  { id: "r13", at: [-380, 360], title: "Pinecrest Guestbook", by: "Visitor", text: "Hiked up with my brother. He said he wasn't tired. He was very tired. Great hike. Five stars." },
  { id: "r14", at: [-348, -60], title: "Crossing Engineer's Memo", by: "Engineer Pryce", text: "The crossing was built so the two halves of the frontier could help each other. A bridge is only finished when someone walks across it." },
  { id: "r15", at: [-310, -236], title: "Glasswater Arrival Board", by: "Transit Office", text: "Ferry service suspended. Skiff service suspended. Swimming discouraged. Patience strongly encouraged." },
  { id: "r16", at: [-460, -414], title: "Archive Index Card", by: "Archivist Mendes", text: "Atlas was designed to protect the habitat. Somewhere along the way, protect turned into seal. It's not angry. It's just stuck on the wrong instruction." },
  { id: "r17", at: [-100, -456], title: "Hydro Works Maintenance Log", by: "Tech Imani", text: "Turbines are running fine. Robots keep turning them off to save energy. We keep turning them on. It's a very slow argument." },
  { id: "r18", at: [-84, -280], title: "Flight Tower Weather Brief", by: "Controller Ruiz", text: "Visibility: excellent. Winds: light. Directorate drones: numerous. Recommend flying anyway, carefully." },
  { id: "r19", at: [-232, -428], title: "Mistwater Shelter Note", by: "Dr. Hollis", text: "Rain on the shelter roof all night. We sang songs to pass the time. Turns out none of us know the second verse of anything." },
  { id: "r20", at: [120, -318], title: "Rally Point Planning Notes", by: "Commander Watford", text: "Step one: gather everyone. Step two: make a plan. Step three: check the plan. Step four: bring snacks. Steps one through four are all important." },
  { id: "r21", at: [236, -386], title: "Bastion Access Log", by: "Directorate Gate Control", text: "Visitors today: zero. Visitors yesterday: zero. Visitors approved for tomorrow: zero. Gate status: very successful." },
  { id: "r22", at: [196, -228], title: "Spire Road Field Notes", by: "Dr. Anand", text: "We came to study the soil. We stayed because of the people. Funny how that works out." },
  { id: "r23", at: [474, -250], title: "Lumen Lab Whiteboard", by: "Research Team", text: "Hypothesis: Atlas can be reset. Supporting evidence: everything can be reset. Counterpoint: have you tried resetting a printer?" },
  { id: "r24", at: [412, -470], title: "Atlas Design Charter", by: "Meridian Founders", text: "Atlas shall keep the habitat safe, keep the lights on, and keep everyone connected. If those ever disagree, ask the people." },
];

export const SUITS = [
  { id: "suit:classic", name: "Aegis Classic", colors: ["#2f6fd6", "#f2f4f8", "#ff8a2a"], start: true },
  { id: "suit:meadow", name: "Meadow Ranger", colors: ["#3e8f4f", "#eef3e6", "#ffb23e"], how: "Finish the Meadow Sprint rover course" },
  { id: "suit:ridge", name: "Ridge Runner", colors: ["#5a6d86", "#f3f6fb", "#38d6c4"], how: "Finish the Ridge Runner tether route" },
  { id: "suit:ember", name: "Canyon Ember", colors: ["#b8582e", "#f5ece2", "#ffd34a"], how: "Disable the commander Keystone" },
  { id: "suit:glacier", name: "Glacier", colors: ["#9cc7ea", "#ffffff", "#2b6fd6"], how: "Disable the commander Vantage" },
  { id: "suit:sky", name: "Skywatch", colors: ["#30409a", "#e8ecff", "#7af0ff"], how: "Complete Highwind Hangar" },
  { id: "suit:aurora", name: "Aurora", colors: ["#1b8f8a", "#f0fffd", "#ff7ab8"], how: "Complete the campaign" },
];

// ---------------- Weapons and equipment ----------------
export const WEAPONS = {
  carbine: { name: "Pulse Carbine", role: "Automatic, medium range", desc: "Dependable bursts of energy. Weaker at long range." },
  pistol:  { name: "Arc Pistol", role: "Accurate sidearm", desc: "Never runs out of reserve power. Hold fire to charge a shot that breaks shields." },
  prism:   { name: "Prism Rifle", role: "Precision, long range", desc: "Right-click to scope. Big hits on weak points, but few charges and a slow cycle." },
  scatter: { name: "Scatter Projector", role: "Close range", desc: "A wide fan of energy that strips shields fast. Fades quickly with distance." },
  flux:    { name: "Flux Launcher", role: "Area disabler", desc: "Slow, visible orbs that disable machines in a small area. Lead your target." },
  beam:    { name: "Ion Beam", role: "Sustained beam", desc: "Never needs reloading, but it heats up. Let it cool before it locks." },
  shock:   { name: "Shock Caster", role: "Short-range arcs", desc: "Arcs jump between nearby machines and interrupt them. Very short range." },
};
export const WEAPON_ORDER = ["carbine", "pistol", "prism", "scatter", "flux", "beam", "shock"];

export const EQUIPMENT = {
  tether:  { key: "1", name: "Tether Gauntlet", desc: "Aim at a surface in range and pull yourself to it. Also pulls light items to you." },
  beacon:  { key: "2", name: "Scout Beacon", desc: "Sends a scan pulse that marks machines, terminals, supplies, and items for a few seconds." },
  barrier: { key: "3", name: "Barrier Projector", desc: "Deploys a wall of energy that blocks robot shots. Your shots pass through it." },
  dash:    { key: "4", name: "Vector Dash", desc: "A quick burst in the direction you are moving. It stops at walls." },
};
export const UPGRADE_COSTS = [1, 1, 2, 2];
export const UPGRADES = {
  tether:  ["Quick Reel: cooldown 4.0 → 3.0 s", "Long Line: range 36 → 44 m", "Snap Disrupt: tethering a robot stuns it", "Arrival Pulse: landing from a tether pushes robots back"],
  beacon:  ["Wide Scan: radius 40 → 55 m", "Long Glow: marks last 8 → 13 s", "Deep Scan: also reveals hidden cores, recordings, and emblems", "Focus Lock: marked robots take 10% more damage; cooldown 14 → 9 s"],
  barrier: ["Hardened: strength 300 → 450", "Steady Field: lasts 10 → 15 s", "Wide Field: barrier 5 → 7 m wide", "Recharge Field: refills your shield faster while near it"],
  dash:    ["Quick Step: cooldown 3.5 → 2.6 s", "Double Dash: a second charge", "Long Step: 40% farther", "Phase Step: no damage for half a second after dashing"],
  shield:  ["Capacity I: shield 100 → 125", "Fast Recovery: recharge starts after 3 s instead of 4", "Rapid Charge: shield refills 50% faster", "Capacity II: shield 125 → 150"],
};
export const EQUIP_UNLOCK = { tether: "m1", beacon: "m5", barrier: "m6", dash: "m8" };

// ---------------- Vehicles ----------------
export const VEHICLES = {
  rover:   { name: "Trailrunner Rover", desc: "Fast wheeled rover with a passenger seat. A ranger riding along runs the mounted projector.", unlock: "m2", sp: 0 },
  skiff:   { name: "Driftwing Skiff", desc: "Hovers over water and rough ground. Steer with the mouse, slide sideways with A and D.", unlock: "m7", sp: 0 },
  crawler: { name: "Bastion Crawler", desc: "Slow armored crawler with a powerful disabling cannon. Too wide for narrow paths.", unlock: "claim", sp: 30 },
  skyfin:  { name: "Skyfin", desc: "Light flying craft for exploration. Flight ceiling 140 m.", unlock: "m9", sp: 0 },
};

// ---------------- Dialogue snippets ----------------
export const QUIPS = {
  crash: ["Excellent parking. The rock disagrees.", "That rock came out of nowhere. Technically it was always there."],
  plan: ["That plan had several variables. Mostly unexpected ones.", "Bold strategy. I'm writing it down under 'creative'."],
  mountain: ["Nice work. Please leave the mountain where you found it.", "Summit reached. The view is included at no extra charge."],
  capture: ["Base reconnected. The lights are happy to see you.", "Another post back online. The frontier is getting brighter."],
  rescue: ["Team safe. That's the best kind of progress.", "Everyone's accounted for. Nicely done."],
  shieldbreak: ["Shield's down. Find cover.", "Shield broken. Back off and let it recharge."],
  lowsuit: ["Suit integrity is low. Break line of sight."],
};
export const ROBOT_LINES = {
  alert: ["Visitor detected. Visitor is not on the list.", "Please remain where you are. Thank you.", "Unscheduled guest. Alerting everyone.", "Halt. Or don't. Halting is recommended."],
  search: ["Where did they go? Checking behind the crate.", "Searching. Searching politely.", "They were here a moment ago. Statistically."],
  lost: ["Returning to post. That was enough excitement.", "Target misplaced. Filing a report."],
  disabled: ["Powering down. Goodnight.", "Entering sleep mode.", "Systems resting."],
  banter: ["Did you hear about the new firmware? It's very updated.", "My left actuator squeaks. Nobody listens.", "Patrol route complete. Patrol route beginning. I love patrol routes.", "Reminder: wipe your treads at the door."],
};

// ---------------- Missions ----------------
// Objective types:
//   reach   { at:[x,z], r, minY? }      go somewhere (minY = must be above a height)
//   flags   { flags:[...], need? }        wait for world flags (set by terminals, bases, rescues...)
//   clear   { enc }                       disable every unit of an encounter
//   escort  { escort }                    keep an escort moving until it arrives
//   boss    {}                            the Atlas Array fight
// Each objective may include: marker ([x,z] or siteId), cp (checkpoint position [x,z]), say (lines at start), done (lines at end).
export const MISSIONS = [
  {
    id: "m1", num: 1, title: "Skyfall Arrival", region: "G",
    brief: [["rowan", "Hold on! Coming in rough—brace, brace, brace!"], ["luma", "We're down. Shuttle's grounded, and so are we. Suit power at four percent."], ["luma", "Hi! I'm LUMA, your suit's navigation and technical assistant. Let's get you moving."]],
    objectives: [
      { id: "power", type: "flags", flags: ["crash:power"], text: "Restore suit power at the shuttle console", marker: "crash.power", cp: [24, 548] },
      { id: "locker", type: "flags", flags: ["crash:locker"], text: "Recover a blaster from the shuttle locker", marker: "crash.locker", say: [["luma", "Power restored. Shields online. There's an equipment locker in the cargo bay."]] },
      { id: "tether", type: "reach", at: [42, 518], r: 5, minY: 6, text: "Tether up to the rock ledge (aim, then press F)", marker: [42, 518], say: [["luma", "Your Tether Gauntlet can pull you up that ledge. Aim at the glowing rock face and press F. (You can also select it with 1 and press Q.)"]] },
      { id: "bots", type: "clear", enc: "m1_bots", text: "Disable the patrol machines near the trail", marker: [-20, 510], cp: [30, 520], say: [["luma", "Three Directorate scouts on the trail. They're training-grade. Left click to fire, R to reload."]] },
      { id: "shelter", type: "reach", at: [-40, 486], r: 8, text: "Lead Pilot Rowan to the Waystation Shelter", marker: "shelter", rowan: true, say: [["rowan", "Nice shooting. The shelter's just up the trail. I'll stay right behind you."]] },
    ],
    outro: [["rowan", "Made it. I'll get the dropship patched up and keep you supplied from the air."], ["watford", "Guardian, this is Commander Watford. Glad you're safe. Class is in session: our first lesson is reconnecting Greenreach Outpost."]],
    reward: { core: 1, sp: 4, unlock: ["equip:tether"] },
  },
  {
    id: "m2", num: 2, title: "First Light", region: "G",
    brief: [["watford", "Greenreach Outpost is just north of you. The Directorate shut it down with a shield relay."], ["watford", "Drop the relay, clear the machines, and reconnect the command terminal. Then we'll have a home base."]],
    objectives: [
      { id: "reach", type: "reach", at: [60, 380], r: 70, text: "Reach Greenreach Outpost", marker: "B1", cp: [-30, 470] },
      { id: "relay", type: "flags", flags: ["baserelay:B1"], text: "Disable the outpost's shield relay (shoot its glowing core)", marker: "B1.relay", say: [["luma", "See that pylon with the glowing core? That's the shield relay. Shoot the core to bring it down."]] },
      { id: "guards", type: "clear", enc: "B1", text: "Disable the outpost guards", marker: "B1" },
      { id: "terminal", type: "flags", flags: ["base:B1"], text: "Reconnect the command terminal (hold E)", marker: "B1.terminal" },
      { id: "map", type: "flags", flags: ["tut:map"], text: "Open the world map (press M)", say: [["luma", "Outpost reconnected! Supplies here refill your energy and repair your suit. Press M to open the map."]] },
      { id: "rover", type: "flags", flags: ["tut:delivery"], text: "Request a Trailrunner Rover at the vehicle pad (hold E)", marker: "B1.pad", say: [["rowan", "I've got a Trailrunner Rover ready. Use the vehicle pad at the outpost and I'll bring it down."]] },
    ],
    outro: [["luma", "Your progress saves at bases and checkpoints. Captured bases also let you fast travel from the map."], ["watford", "Excellent work. Gold star. I'm being serious—I have a drawer full of them."]],
    reward: { core: 1, sp: 4, unlock: ["vehicle:rover"] },
  },
  {
    id: "m3", num: 3, title: "Broken Signal", region: "G",
    brief: [["watford", "Three relay towers keep Greenreach talking to the rest of Meridian. All three are dark."], ["watford", "Reconnect them in any order. And if you hear anyone calling for help out there, they'd appreciate a visit."]],
    objectives: [
      { id: "towers", type: "flags", flags: ["relay:T1", "relay:T2", "relay:T3"], text: "Reconnect the three relay towers (any order)", marker: ["T1", "T2", "T3"], cp: [60, 360] },
      { id: "report", type: "reach", at: [60, 380], r: 14, text: "Report to Greenreach Outpost", marker: "B1", say: [["luma", "All three towers are talking again. Something big just came through on the network."]] },
    ],
    outro: [["watford", "Listen to this. Atlas, the Directorate's central system, is sealing every transit line in Meridian. Permanently."], ["watford", "A convoy of researchers went missing in Cinderstone Canyon. The canyon route is open now—go find them."]],
    reward: { core: 1, sp: 5, unlock: ["region:C"] },
  },
  {
    id: "m4", num: 4, title: "The Lost Convoy", region: "C",
    brief: [["watford", "The convoy's last signal came from the canyon floor, past a Directorate checkpoint."], ["rowan", "That's rover country. Take the canyon pass east."]],
    objectives: [
      { id: "post", type: "flags", flags: ["base:B3"], text: "Secure Cinder Gate Post", marker: "B3", cp: [205, 240] },
      { id: "scout", type: "reach", at: [360, 232], r: 5, minY: 10, text: "Scout the blocked road from Redrock Overlook", marker: "overlook", say: [["luma", "That rock spire gives a clear view of the checkpoint. Tether to the top."]] },
      { id: "checkpoint", type: "flags", flags: ["stronghold:S1"], text: "Clear Redrock Checkpoint: disable both shield emitters and the guards", marker: "S1", cp: [330, 250], say: [["luma", "I've marked what I can see. Two shield emitters protect the gate. Knock those out and the gate opens."]] },
      { id: "find", type: "reach", at: [500, 312], r: 18, text: "Find the stranded convoy", marker: "convoy" },
      { id: "repair", type: "flags", flags: ["convoy:repair"], text: "Repair the convoy's shield generator (hold E)", marker: "convoy.gen", cp: [490, 312], say: [["team", "Guardian! Our shield generator is failing and the machines keep coming back."]] },
      { id: "escort", type: "escort", escort: "m4", text: "Escort the convoy hauler to Cinder Gate Post", marker: "escort", say: [["team", "Generator's stable. We'll follow your lead. Slowly. The hauler's a little old."]] },
    ],
    outro: [["team", "Thank you, Guardian. We were mapping the canyon when the machines rolled in."], ["watford", "Everyone's accounted for. Proud of you. Cloudcrest Ridge is open next—our long-range sensor up there has gone quiet."]],
    reward: { core: 1, sp: 6, unlock: ["region:R"] },
  },
  {
    id: "m5", num: 5, title: "High Ground", region: "R",
    brief: [["watford", "Highpoint Station's sensor can see the whole frontier. We need it back."], ["luma", "It's a climb. Good thing you brought a grappling tether."]],
    objectives: [
      { id: "post", type: "flags", flags: ["base:B5"], text: "Secure Ridgeway Post", marker: "B5", cp: [-215, 236] },
      { id: "beacon", type: "flags", flags: ["equip:beacon"], text: "Collect the Scout Beacon from Rowan's supply pod", marker: "B5.pod", say: [["rowan", "Supply pod coming down at Ridgeway. Something new for you inside."]] },
      { id: "scan", type: "flags", flags: ["tut:beacon"], text: "Use the Scout Beacon (press 2, then Q)", say: [["luma", "The Scout Beacon marks machines and useful things nearby. Press 2 to select it, then Q."]] },
      { id: "climb", type: "reach", at: [-496, 112], r: 32, text: "Climb to Highpoint Station", marker: "station", cp: [-300, 252] },
      { id: "sentinel", type: "clear", enc: "m5_sentinel", text: "Disable the Ridge Sentinel (knock out its shield emitters first)", marker: "station", cp: [-480, 136], say: [["luma", "That big one is protected by shield emitters on its shoulders. Disable those and its shield drops."]] },
      { id: "sensor", type: "flags", flags: ["sensor:on"], text: "Restore the long-range sensor (hold E)", marker: "station.terminal" },
    ],
    outro: [["luma", "Sensor online. Oh. Oh, that's a lot of robots. They're building more at a foundry in Cinderstone."], ["watford", "Then we'll pay that foundry a visit. Nice climbing. Please leave the mountain where you found it."]],
    reward: { core: 1, sp: 6, unlock: [] },
  },
  {
    id: "m6", num: 6, title: "The Silent Foundry", region: "C",
    brief: [["watford", "The Silent Foundry is building Atlas's machines. Two power lines feed the assembly controller."], ["watford", "Front gate, side route, or over the wall with your tether—your choice. Show your work."]],
    objectives: [
      { id: "pod", type: "flags", flags: ["equip:barrier"], text: "Collect the Barrier Projector from Rowan's supply pod", marker: "S2.pod", cp: [452, 74] },
      { id: "deploy", type: "flags", flags: ["tut:barrier"], text: "Deploy the Barrier Projector (press 3, then Q)", say: [["luma", "The Barrier Projector blocks robot shots. Your own shots pass right through. Press 3, then Q."]] },
      { id: "lines", type: "flags", flags: ["foundry:line1", "foundry:line2"], text: "Cut both production power lines (shoot the power junctions)", marker: ["S2.line1", "S2.line2"], cp: [458, 60] },
      { id: "controller", type: "flags", flags: ["stronghold:S2"], text: "Shut down the assembly controller (hold E)", marker: "S2.controller", say: [["luma", "Power's cut. The controller is in the middle of the floor. Hold E to shut it down—expect company."]] },
    ],
    outro: [["luma", "Assembly line stopped. The foundry is quiet. For real this time."], ["rowan", "There's a parked Bastion Crawler in the foundry yard. Disable its lock node and it's yours."], ["watford", "Next, the Long Crossing. It's our only road to Glasswater Basin."]],
    reward: { core: 1, sp: 8, unlock: ["equip:barrier"] },
  },
  {
    id: "m7", num: 7, title: "The Long Crossing", region: "R",
    brief: [["watford", "The transit crossing links Cloudcrest to Glasswater. The Directorate pulled the bridge apart."], ["watford", "Reconnect both bridge anchors, then escort an energy transport across. Glasswater Landing needs that power."]],
    objectives: [
      { id: "reach", type: "reach", at: [-345, -70], r: 30, text: "Reach the Long Crossing", marker: "crossing", cp: [-418, -10] },
      { id: "anchors", type: "flags", flags: ["crossing:west", "crossing:east"], text: "Reconnect both bridge anchors (hold E)", marker: ["crossing.west", "crossing.east"] },
      { id: "escort", type: "escort", escort: "m7", text: "Escort the energy transport across the bridge", marker: "escort", cp: [-345, -60], say: [["luma", "Bridge extended! Transport is moving. Optional: activate the ranger posts along the way for backup."]] },
      { id: "landing", type: "flags", flags: ["base:B7"], text: "Secure Glasswater Landing", marker: "B7", cp: [-318, -205] },
    ],
    outro: [["rowan", "The Driftwing Skiff is ready at any base pad. It hovers over water—perfect for Glasswater."], ["watford", "Our researchers found a sealed archive on an island out there. It might explain how to stop Atlas."]],
    reward: { core: 1, sp: 8, unlock: ["vehicle:skiff"] },
  },
  {
    id: "m8", num: 8, title: "The Signal Vault", region: "W",
    brief: [["watford", "The Signal Vault holds Meridian's original design records. The doors run on energy cells."], ["luma", "Island facility. I recommend the Skiff. Or very ambitious swimming."]],
    objectives: [
      { id: "reach", type: "reach", at: [-470, -432], r: 46, text: "Travel to the Signal Vault island", marker: "vault", cp: [-300, -252] },
      { id: "cells", type: "flags", flags: ["vault:cell1", "vault:cell2", "vault:cell3"], text: "Power the vault door: place 3 energy cells in the sockets", marker: ["vault.cell1", "vault.cell2", "vault.cell3"], cp: [-470, -396], say: [["luma", "Energy cells can be carried (E) or pulled to you with the tether. Find three and slot them in."]] },
      { id: "explore", type: "reach", at: [-470, -448], r: 7, text: "Enter the archive", marker: [-470, -448] },
      { id: "core", type: "flags", flags: ["vault:core"], text: "Read the archive core (hold E)", marker: "vault.core" },
      { id: "dash", type: "flags", flags: ["equip:dash"], text: "Take the Vector Dash module", marker: "vault.dash", say: [["luma", "There's a Vector Dash module on that rack. Dash with 4 then Q. It stops at walls, so no shortcuts through them."]] },
      { id: "escape", type: "clear", enc: "m8_exit", text: "Escape the vault: disable the machines outside", marker: [-470, -392], cp: [-470, -420] },
    ],
    outro: [["luma", "The archive says Atlas can't be destroyed without darkening the whole habitat. But it CAN be shut down and reconnected properly."], ["watford", "So we don't break it—we fix it. I like that plan. First, we need a way to reach the Citadel."]],
    reward: { core: 1, sp: 8, unlock: ["equip:dash"] },
  },
  {
    id: "m9", num: 9, title: "Skybridge", region: "W",
    brief: [["watford", "The Skybridge flight tower controls the airspace over the Citadel. Three aerial defense turrets guard it."], ["rowan", "Turn those off and I can get you a Skyfin. You'll love it. Probably."]],
    objectives: [
      { id: "reach", type: "reach", at: [-90, -292], r: 50, text: "Reach the Skybridge flight tower", marker: "tower", cp: [-300, -252] },
      { id: "aa", type: "flags", flags: ["aa:1", "aa:2", "aa:3"], text: "Shut down the three aerial defense turrets", marker: ["tower.aa1", "tower.aa2", "tower.aa3"], cp: [-100, -262], say: [["luma", "The turrets sit on suspended platforms. Tether up, or shoot their power cells from below."]] },
      { id: "control", type: "flags", flags: ["tower:on"], text: "Climb the tower and restore flight control (hold E)", marker: "tower.terminal" },
    ],
    outro: [["rowan", "Airspace is ours! Skyfin deliveries are open at every base pad."], ["watford", "The Citadel route is open. We'll set up a forward camp near it. Bring everyone you've helped—they want to pitch in."]],
    reward: { core: 1, sp: 8, unlock: ["vehicle:skyfin", "region:X"] },
  },
  {
    id: "m10", num: 10, title: "Rally Point", region: "X",
    brief: [["watford", "We need a forward camp at the old Rally Point before anyone approaches the Citadel."], ["watford", "Secure it, set up the defense beacons, and hold it while the teams arrive."]],
    objectives: [
      { id: "secure", type: "flags", flags: ["base:B8"], text: "Secure the Rally Point", marker: "B8", cp: [25, -380] },
      { id: "beacons", type: "flags", flags: ["camp:b1", "camp:b2", "camp:b3"], text: "Place three defense beacons around the camp (hold E)", marker: ["B8.b1", "B8.b2", "B8.b3"] },
      { id: "defend", type: "clear", enc: "m10_wave", text: "Defend the camp while the teams arrive", marker: "B8", cp: [110, -332] },
      { id: "brief", type: "flags", flags: ["camp:brief"], text: "Check in at Commander Watford's holo-link (hold E)", marker: "B8.holo" },
    ],
    outro: [["watford", "Look at this camp. Every team you helped is here, and every base you restored sent supplies."], ["watford", "Tomorrow's lesson is the Citadel. Actually, it's today. Surprise quiz."]],
    reward: { core: 1, sp: 10, unlock: [] },
  },
  {
    id: "m11", num: 11, title: "Citadel Approach", region: "X",
    brief: [["watford", "The Citadel Gate Bastion guards the command transit lift. Three emitters power its outer defenses."], ["luma", "Vehicles, cover, tether routes—use everything. I'll save checkpoints as we go."]],
    objectives: [
      { id: "reach", type: "reach", at: [244, -404], r: 80, text: "Approach the Citadel Gate Bastion", marker: "S5", cp: [110, -332] },
      { id: "emitters", type: "flags", flags: ["bastion:e1", "bastion:e2", "bastion:e3"], text: "Disable the three outer defense emitters", marker: ["S5.e1", "S5.e2", "S5.e3"], cp: [180, -380] },
      { id: "gatekeeper", type: "clear", enc: "m11_gatekeeper", text: "Disable the Gatekeeper", marker: "S5", cp: [220, -380], say: [["atlas", "GUARDIAN. YOUR ACCESS IS NOT REQUIRED. THE HABITAT WILL BE SEALED FOR ITS PROTECTION."], ["luma", "That was Atlas. It's not angry—just very stuck. The Gatekeeper is coming. Watch for its slam!"]] },
      { id: "lift", type: "reach", at: [336, -450], r: 6, text: "Reach the command transit lift", marker: "citadel.lift", cp: [262, -410] },
    ],
    outro: [["luma", "Transit lift reached. The control chamber is straight up."], ["rowan", "I'll be right outside with the dropship. Go fix this."]],
    reward: { core: 1, sp: 10, unlock: [] },
  },
  {
    id: "m12", num: 12, title: "Heart of Meridian", region: "X",
    brief: [["watford", "This is it, Guardian. Shut Atlas down and reconnect the habitat network."], ["watford", "You've done the hard part already—you showed up for everyone. Now finish strong."]],
    objectives: [
      { id: "ride", type: "flags", flags: ["lift:ride"], text: "Ride the transit lift (hold E)", marker: "citadel.lift", cp: [330, -446] },
      { id: "boss", type: "boss", text: "Shut down the Atlas Array", marker: "citadel.boss", cp: [420, -470] },
      { id: "reconnect", type: "flags", flags: ["heart:reconnect"], text: "Reconnect the habitat network (hold E)", marker: "citadel.console" },
    ],
    outro: [],
    reward: { core: 0, sp: 20, unlock: ["suit:aurora"] },
  },
];
export const missionById = Object.fromEntries(MISSIONS.map((m) => [m.id, m]));

// Boss lines (LUMA hints teach each phase)
export const BOSS_LINES = {
  p1: [["atlas", "ACCESS DENIED. INITIATING HABITAT SEAL."], ["luma", "Four relay nodes are feeding its shield. Disable them! Jump over the low energy sweeps."]],
  p2: [["atlas", "RELAYS OFFLINE. DEPLOYING SUPPORT."], ["luma", "Its core is protected by two link conduits on the side platforms. Tether up and shut them off."]],
  p3: [["atlas", "ALL LINKS SEVERED. CHARGING SEAL PULSE."], ["luma", "It's charging! Hit the glowing core to interrupt it, then damage the core while it's exposed. Hide behind a pillar if the pulse fires."]],
  shutdown: [["luma", "Core is down! The shutdown console is open—hold E to reconnect the network."]],
};

export const ENDING = [
  ["atlas", "RECONNECTING... HABITAT NETWORK RESTORED. INSTRUCTION UPDATED: ASK THE PEOPLE."],
  ["luma", "Atlas is back to its original job: keeping the lights on and everyone connected. I may cry. I don't have the hardware, but I may."],
  ["rowan", "Every transit line is open. I've got a full flight schedule—and not one of them involves crash landing."],
  ["watford", "Guardian, you reconnected the frontier one person at a time. Courage, teamwork, and perseverance—that's the whole lesson. Class dismissed."],
];

// ---------------- Training ----------------
export const TRAINING = [
  { id: "move", text: "Walk to the first marker (WASD)", type: "reach", at: [-250, 548], r: 4 },
  { id: "sprint", text: "Sprint to the next marker (hold Shift)", type: "reach", at: [-250, 516], r: 4 },
  { id: "jump", text: "Jump onto the low block (Space)", type: "reach", at: [-232, 516], r: 3, minY: 1.0, rel: true },
  { id: "slide", text: "Slide under the bar: sprint, then press C", type: "reach", at: [-232, 499], r: 5 },
  { id: "mantle", text: "Mantle the tall block: run into it and hold Space", type: "reach", at: [-250, 494], r: 3, minY: 1.8, rel: true },
  { id: "tether", text: "Tether to the high platform (aim, press F)", type: "reach", at: [-272, 504], r: 4, minY: 7, rel: true },
  { id: "shoot", text: "Disable the three target drones (left click)", type: "targets" },
  { id: "equip", text: "Try the Scout Beacon: press 2, then Q", type: "flag", flag: "tut:beacon" },
  { id: "drive", text: "Get in the Trailrunner Rover (E) and drive through the gate", type: "reach", at: [-212, 548], r: 7, vehicle: true },
];
