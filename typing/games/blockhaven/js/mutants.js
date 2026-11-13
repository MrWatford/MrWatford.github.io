// The Forsaken Mutants: Herobrine's five elite servants in the Forsaken World (plan: FORSAKEN-MUTANTS.md).
// Slice 1 adds the shared mutant rules and the first mutant, the Forsaken Groaner.
//   installMutants(SPECIES)  adds the species (models, health, drops) to the creature list (called by entities.js)
//   animateMutant / mutantDying  move their bodies every frame (called by entities.js)
//   initMutants(api)         runs their fights and decides where and when they appear (called by main.js)
// Fair-fight rules for every mutant: each big attack warns first (a glowing ring, a raised arm, a sound), helpers are
// capped, the comeback happens once, and nothing forms inside a ward, near the refuge, or right after you arrive.
import { B, I, SOLID, iconURL, itemDef } from "./blocks.js";
import { NOTES } from "./forsaken-author.js";
import { REACHES, REACHES_VERSION, applyReaches, reachNotes } from "./forsaken-reaches.js";

const rand = (a, b) => a + Math.random() * (b - a), randi = (a, b) => Math.floor(rand(a, b + 1));

// ---------- settings you can change ----------
export const MUTANT_CONFIG = {
  graceFirst: 150, graceReturn: 45,          // seconds of quiet after arriving (first visit / later visits)
  ambientEvery: 80, ambientChance: 0.3,      // every so often a wandering mutant may appear (seconds between tries, chance per try)
  maxAlive: 1,                               // mutants alive at once
  minFromRefuge: 30,                         // never this close to the Arrival Refuge
  despawnFar: 64, despawnAfter: 20,          // a mutant this far away for this long goes back into the mist
  hpMul: { easy: 3.5, normal: 5, hard: 6 },  // health compared with the ordinary creature
  maxHelpers: 3                              // ordinary creatures a mutant can have called at once
};

// the lore notes found in the Outer Reaches (added to the Forsaken World's notes)
const REACH_NOTES = {
  reach_camp: { title: "Wayfarer's Last Entry", text: "Third night at the old road camp. Something huge walked through the fence like it was paper. It looked like a Groaner once, but one arm was as big as a barrel and its eyes were pale, just like HIS.\n\nWe hid in the hut with the black roof. It pounded the ground and the whole camp shook. It heals if you leave it alone. Whatever you do, keep hitting it.\n\nWe're leaving at dawn. Don't follow the road north." },
  reach_graves: { title: "Gravekeeper's Ledger", text: "Graves disturbed again. The bones were gathered up, not scattered. Someone wanted them.\n\nLast night a skeleton taller than the tower door came out of the mist with a bow as long as a cart. It never missed. When it fires many arrows at once it has to stop and reload. That is the only time I dared to run.\n\nThe pale man stood on the arch with the skull and watched it, like a farmer watching his best hound." },
  reach_crater: { title: "Research Note 9", text: "Samples from the crater: a green sludge that hisses when the wind blows. A Hisser that wandered in came out different: bigger, four-legged, with a core in its chest that pulses like it is counting.\n\nWhen it falls, it does not simply go quiet. It flashes and the rings spread out three times. Run past the last ring, or strike the core until it goes dark.\n\nHe was standing on the rim when we left. He did not follow. He did not need to." },
  reach_silk: { title: "Scratched on a Mine Beam", text: "SILK OVER THE MINE MOUTH. DON'T GO IN.\n\nThe big one has red eyes all over its face and cracks that glow like coals. It spits webs, and if one lands on you, your legs turn to stone for a moment. It leaps where the red ring shows.\n\nWhen it curls up and glows, HIT IT. If you don't, the little ones hatch.\n\nWe sealed the egg clusters with fire. There were more the next morning." },
  reach_gate: { title: "The Five", text: "The gate in the ruins leads nowhere, but things come through it anyway.\n\nThe tallest of them has four arms and walks without footsteps. Before it appears, purple sparks gather where it will stand. Its shadows look like it, but you can see through them. The solid one is the real one.\n\nThe circles of dark stone are the same everywhere: the camp, the graves, the crater, the woods, and here. Five marks. Five servants. He calls them his Five, and he made them out of the creatures we used to laugh at.\n\nThe wards still hold. Remember that." }
};

// ---------- models ----------
const GREEN = ["#5d8a3a", "#527d33", "#679844", "#4c742f"], DARKG = ["#3e5f27", "#36552226"], CLOTH = ["#2f6f93", "#2a6385", "#367ba2"], PANTS = ["#3b3566", "#332e5a", "#433d72"];
const GLOW = "#a8ff5a", EYE = "#f0fff0";
const spk = (P, n, c) => { for (let i = 0; i < n; i++) P.px(Math.floor(Math.random() * 16), Math.floor(Math.random() * 16), c[i % c.length]); };
const skin = (seed = 0) => P => {
  P.fill(GREEN); spk(P, 7, ["#3e6326", "#78aa52", "#466b2c"]);
  P.rect(2 + seed % 6, 4, 1, 5, "#2f4a1f"); P.rect(3 + seed % 6, 8, 1, 3, "#2f4a1f");   // cracks in the skin
  if (seed % 3 === 1) P.rect(10, 11, 3, 2, "#5a2a2e");                                 // an old dark scar
};
const shirt = torn => P => {
  P.fill(CLOTH); spk(P, 6, ["#24577a", "#4a8db5"]);
  if (torn) for (let x = 0; x < 16; x++) { const cut = (x * 7) % 5; for (let y = 16 - cut; y < 16; y++) P.px(x, y, GREEN[(x + y) % 4]); }
  P.rect(5, 3, 2, 4, GREEN[0]); P.rect(11, 6, 3, 2, GREEN[2]);                           // holes torn in the cloth
};
const pants = P => { P.fill(PANTS); spk(P, 5, ["#2a2548", "#544c88"]); P.rect(3, 12, 4, 4, GREEN[1]); };
const glowPaint = P => { P.fill([GLOW]); P.rect(0, 0, 16, 16, GLOW); };
const eyePaint = P => { P.fill([EYE]); P.rect(4, 4, 8, 8, "#ffffff"); };
const bone = P => { P.fill(["#d8d2bc", "#c8c0a8", "#e4dec8"]); P.rect(0, 0, 16, 3, "#a8a08a"); };
const pt = (name, size, pivot, off, paint, extra = {}) => ({ name, size, pivot, off, paint: typeof paint === "function" ? { all: paint } : paint, ...extra });

// The Forsaken Groaner: a huge, lopsided green brute. One arm is far bigger than the other, its shirt hangs in rags,
// pale eyes glow under a heavy brow, bone shards jut from its back, and green cracks of Herobrine's power glow in its skin.
function groanerParts() {
  return [
    pt("legR", [11, 16, 11], [-8, 16, 0], [0, -8, 0], { all: pants, bottom: skin(2) }),
    pt("legL", [12, 15, 12], [8, 15, 1], [0, -7.5, 0], { all: pants, bottom: skin(3) }),
    pt("hips", [26, 9, 16], [0, 20, 0], [0, 0, 0], pants),
    // a hunched, barrel-chested body that leans forward over its legs
    pt("body", [34, 26, 20], [0, 23, 0], [0, 13, 0], { all: shirt(true), top: skin(1), back: P => { shirt(true)(P); P.rect(6, 2, 4, 9, GREEN[2]); P.rect(1, 9, 3, 5, GREEN[0]); } }, { rotation: [0.35, 0, 0.04] }),
    pt("rag", [20, 7, 1], [2, -15, 10.2], [0, 0, 0], { all: P => { P.clear(); for (let x = 0; x < 16; x++) { const len = 6 + (x * 5) % 9; for (let y = 0; y < len; y++) P.px(x, y, CLOTH[(x + y) % 3]); } } }, { parent: "body" }),
    pt("crackA", [2, 13, 1], [7, 1, 10.3], [0, 0, 0], glowPaint, { parent: "body", glow: true }),
    pt("crackB", [8, 2, 1], [-8, -5, 10.3], [0, 0, 0], glowPaint, { parent: "body", glow: true }),
    pt("crackC", [1, 10, 2], [-17.2, 3, -2], [0, 0, 0], glowPaint, { parent: "body", glow: true }),
    pt("crackD", [2, 8, 1], [-5, 6, -10.3], [0, 0, 0], glowPaint, { parent: "body", glow: true }),
    pt("spine0", [4, 11, 4], [-8, 10, -8], [0, 4, 0], bone, { parent: "body", rotation: [-0.7, 0, -0.35] }),
    pt("spine1", [4, 14, 4], [1, 11, -8], [0, 5, 0], bone, { parent: "body", rotation: [-0.8, 0, 0.1] }),
    pt("spine2", [3, 9, 3], [10, 9, -8], [0, 3, 0], bone, { parent: "body", rotation: [-0.6, 0, 0.45] }),
    pt("spine3", [3, 8, 3], [-3, 2, -10], [0, 3, 0], bone, { parent: "body", rotation: [-1.1, 0, 0] }),
    // a small head sunk low between the shoulders
    pt("head", [14, 13, 13], [1, 8, 10], [0, 2, 3], { all: skin(4), front: P => { skin(0)(P); P.rect(0, 3, 16, 3, "#3e6326"); P.rect(2, 6, 4, 3, "#1c2a14"); P.rect(10, 6, 4, 3, "#1c2a14"); P.rect(4, 11, 8, 2, "#1c2a14"); } }, { parent: "body", rotation: [-0.35, 0, 0] }),
    pt("eyeR", [3, 2, 1], [-3.8, 3.5, 6.6], [0, 0, 0], eyePaint, { parent: "head", glow: true }),
    pt("eyeL", [3, 2, 1], [3.8, 3.5, 6.6], [0, 0, 0], eyePaint, { parent: "head", glow: true }),
    pt("jaw", [12, 4, 10], [0, -5.5, 2], [0, -1.5, 2.5], { all: skin(5), front: P => { skin(5)(P); for (let x = 1; x < 16; x += 3) P.rect(x, 0, 1, 3, "#e4dec8"); } }, { parent: "head" }),
    // the huge right arm (shoulder hump, upper arm, forearm, fist) and the smaller left one
    pt("armR", [15, 22, 15], [-23, 44, 6], [0, -9, 0], { all: skin(1), top: shirt(false) }),
    pt("padR", [20, 13, 20], [0, 9, 0], [0, 0, 0], { all: P => { shirt(true)(P); P.rect(0, 10, 16, 6, GREEN[0]); }, top: skin(2) }, { parent: "armR" }),
    pt("foreR", [14, 16, 14], [0, -11, 0], [0, -7, 0], skin(2), { parent: "armR" }),
    pt("fistR", [20, 15, 20], [0, -9, 0], [0, 0, 0], { all: skin(3), bottom: P => { skin(3)(P); P.rect(0, 0, 16, 4, "#3e5f27"); } }, { parent: "foreR" }),
    pt("crackR", [1, 11, 2], [-7.6, 2, 3], [0, 0, 0], glowPaint, { parent: "armR", glow: true }),
    pt("crackR2", [2, 1, 10], [0, 7.6, 2], [0, 0, 0], glowPaint, { parent: "fistR", glow: true }),
    pt("armL", [11, 19, 11], [20, 43, 6], [0, -8, 0], { all: skin(5), top: shirt(false) }),
    pt("padL", [14, 10, 14], [0, 8, 0], [0, 0, 0], { all: shirt(true), top: skin(4) }, { parent: "armL" }),
    pt("foreL", [10, 14, 10], [0, -9, 0], [0, -6, 0], skin(0), { parent: "armL" }),
    pt("fistL", [14, 12, 14], [0, -8, 0], [0, 0, 0], skin(4), { parent: "foreL" })
  ];
}

// The Forsaken Rattler: a towering, angular skeleton archer. A reinforced rib cage you can see through (with a pale
// glowing heart inside), long oversized arms, a bone blade on its right forearm, bone spikes on its shoulders and
// back, white glowing eyes, a big dark bow with bone tips and a glowing string, and a quiver on its back.
const BONE = ["#d8d2bc", "#c8c0a8", "#e4dec8", "#cfc8b2"], PALE = "#e8f4ff";
const boneP = P => { P.fill(BONE); spk(P, 5, ["#a8a08a", "#f0ecdc"]); P.rect(0, 0, 16, 1, "#a8a08a"); P.rect(0, 15, 16, 1, "#a8a08a"); };
const crackedBone = P => { boneP(P); P.rect(4, 3, 1, 6, "#8a8270"); P.rect(5, 8, 1, 4, "#8a8270"); P.rect(10, 10, 3, 1, "#8a8270"); };
const ribsP = P => { P.clear(); for (let y = 0; y < 16; y += 3) P.rect(0, y, 16, 2, BONE[y % 4]); P.rect(7, 0, 2, 16, "#c8c0a8"); spk(P, 4, ["#a8a08a"]); };
const paleGlow = P => { P.fill([PALE]); P.rect(0, 0, 16, 16, PALE); };
const wood = P => { P.fill(["#3a2a24", "#2e221e", "#463228"]); P.rect(0, 0, 16, 2, "#5a4232"); };
function rattlerParts() {
  const parts = [
    pt("pelvis", [16, 6, 8], [0, 35, 0], [0, 0, 0], crackedBone),
    pt("spine", [5, 13, 5], [0, 37, -1], [0, 6.5, 0], boneP),
    pt("ribs", [25, 17, 13], [0, 48, 0], [0, 8, 0], { all: ribsP, top: crackedBone, bottom: crackedBone }, { rotation: [0.14, 0, 0] }),
    pt("heart", [5, 5, 4], [0, 1, 0], [0, 0, 0], paleGlow, { parent: "ribs", glow: true }),
    pt("spikeR", [4, 13, 4], [-11, 7, 0], [0, 4, 0], crackedBone, { parent: "ribs", rotation: [0, 0, 0.55] }),
    pt("spikeL", [4, 13, 4], [11, 7, 0], [0, 4, 0], crackedBone, { parent: "ribs", rotation: [0, 0, -0.55] }),
    pt("back0", [2, 9, 2], [-3, 3, -5.5], [0, 3, 0], boneP, { parent: "ribs", rotation: [-0.8, 0, 0] }),
    pt("back1", [2, 7, 2], [3, -2, -5.5], [0, 3, 0], boneP, { parent: "ribs", rotation: [-0.9, 0, 0] }),
    pt("quiver", [6, 17, 5], [5, -1, -8], [0, 0, 0], { all: wood, top: P => { P.fill(["#2e221e"]); P.rect(2, 2, 3, 3, PALE); P.rect(9, 6, 3, 3, PALE); P.rect(5, 10, 3, 3, PALE); } }, { parent: "ribs", rotation: [0, 0, 0.35] }),
    pt("head", [13, 13, 13], [0, 9.5, 1], [0, 6.5, 1], { all: crackedBone, front: P => { crackedBone(P); P.rect(2, 5, 5, 4, "#1a1814"); P.rect(9, 5, 5, 4, "#1a1814"); P.rect(7, 9, 2, 2, "#1a1814"); P.rect(3, 13, 10, 1, "#1a1814"); } }, { parent: "ribs", rotation: [-0.14, 0, 0] }),
    pt("crest", [2, 5, 9], [0, 6.5, -1], [0, 2, 0], crackedBone, { parent: "head" }),
    pt("eyeR", [3, 2, 1], [-3.5, 0.8, 6.6], [0, 0, 0], paleGlow, { parent: "head", glow: true }),
    pt("eyeL", [3, 2, 1], [3.5, 0.8, 6.6], [0, 0, 0], paleGlow, { parent: "head", glow: true }),
    pt("jaw", [11, 3, 9], [0, -6.5, 1.5], [0, -1.5, 1.5], { all: boneP, front: P => { boneP(P); for (let x = 1; x < 16; x += 3) P.rect(x, 0, 1, 4, "#f4f0e4"); } }, { parent: "head" })
  ];
  for (const [s, sign] of [["R", -1], ["L", 1]]) parts.push(
    pt("leg" + s, [5, 16, 5], [sign * 5, 34, 0], [0, -8, 0], crackedBone),
    pt("shin" + s, [5, 17, 5], [0, -8, 0], [0, -8.5, 0], boneP, { parent: "leg" + s }),
    pt("foot" + s, [6, 2, 8], [0, -8.5, 1], [0, 0, 1], boneP, { parent: "shin" + s }),
    pt("arm" + s, [6, 22, 6], [sign * 16, 64, 0], [0, -10, 0], crackedBone),
    pt("pad" + s, [10, 7, 10], [0, 9, 0], [0, 0, 0], crackedBone, { parent: "arm" + s }),
    pt("fore" + s, [5, 20, 5], [0, -10, 0], [0, -9, 0], boneP, { parent: "arm" + s }),
    pt("hand" + s, [6, 6, 6], [0, -9.5, 0], [0, -2, 0], boneP, { parent: "fore" + s }));
  parts.push(
    pt("blade", [2, 14, 3], [-2.5, -3, 0], [0, -5, 0], crackedBone, { parent: "foreR", rotation: [0, 0, 0.12] }),
    // the bow (held in the left hand; its limbs run along the hand's z so it stands upright when aimed)
    pt("bowU", [2, 3, 20], [0, -2, 0], [0, 0, 10], wood, { parent: "handL", rotation: [0.18, 0, 0] }),
    pt("bowD", [2, 3, 20], [0, -2, 0], [0, 0, -10], wood, { parent: "handL", rotation: [-0.18, 0, 0] }),
    pt("tipU", [3, 3, 4], [0, 0, 10], [0, 0, 1], boneP, { parent: "bowU" }),
    pt("tipD", [3, 3, 4], [0, 0, -10], [0, 0, -1], boneP, { parent: "bowD" }),
    pt("string", [1, 1, 38], [0, 2.5, 0], [0, 0, 0], paleGlow, { parent: "handL", glow: true }));
  return parts;
}

// The Forsaken Skitter: an enormous black and charcoal spider. A jagged armored abdomen raised behind it with
// crimson glowing fissures, spikes and plates, six red glowing eyes, curved fangs, eight thick jointed legs, and
// silk strands trailing from its spinnerets.
const CHAR = ["#33333b", "#3b3b44", "#2a2a31", "#44444d"], CRIM = "#ff3040";
const shell = P => { P.fill(CHAR); spk(P, 8, ["#18181c", "#44444c"]); };
const plates = P => { shell(P); P.rect(0, 5, 16, 1, "#141418"); P.rect(0, 11, 16, 1, "#141418"); P.rect(5, 0, 1, 16, "#141418"); };
const redGlow = P => { P.fill([CRIM]); P.rect(0, 0, 16, 16, CRIM); };
const silkP = P => { P.fill(["#e8e8f0"]); P.rect(0, 0, 16, 16, "#f0f0f8"); };
function skitterParts() {
  const parts = [
    pt("thorax", [18, 12, 16], [0, 14, 4], [0, 0, 0], plates),
    pt("head", [14, 10, 10], [0, 1, 8], [0, 0, 5], { all: shell, front: P => { shell(P); P.rect(0, 0, 16, 2, "#141418"); } }, { parent: "thorax" }),
    pt("fangR", [2, 7, 2], [-3, -4, 4.5], [0, -3, 0], { all: P => { P.fill(["#2a2a30"]); P.rect(0, 10, 16, 6, "#c8c0b0"); } }, { parent: "head", rotation: [0.2, 0, 0.15] }),
    pt("fangL", [2, 7, 2], [3, -4, 4.5], [0, -3, 0], { all: P => { P.fill(["#2a2a30"]); P.rect(0, 10, 16, 6, "#c8c0b0"); } }, { parent: "head", rotation: [0.2, 0, -0.15] }),
    pt("abdomen", [26, 18, 30], [0, 17, -4], [0, 2, -15], { all: plates, top: P => { plates(P); P.rect(7, 0, 2, 16, "#141418"); } }, { rotation: [-0.25, 0, 0] }),
    pt("plateA", [22, 3, 9], [0, 10.5, 4], [0, 0, 0], plates, { parent: "abdomen" }),
    pt("plateB", [20, 3, 9], [0, 10.5, -6], [0, 0, 0], plates, { parent: "abdomen" }),
    pt("fis0", [2, 1, 26], [0, 12.1, -1], [0, 0, 0], redGlow, { parent: "abdomen", glow: true }),
    pt("fis1", [16, 1, 2], [0, 12.1, -1], [0, 0, 0], redGlow, { parent: "abdomen", glow: true }),
    pt("fis2", [1, 12, 1], [-13.2, 0, 4], [0, 0, 0], redGlow, { parent: "abdomen", glow: true }),
    pt("fis3", [1, 10, 1], [13.2, 1, -6], [0, 0, 0], redGlow, { parent: "abdomen", glow: true }),
    pt("fis4", [10, 1, 1], [-3, -3, -15.2], [0, 0, 0], redGlow, { parent: "abdomen", glow: true }),
    pt("fis5", [1, 1, 12], [-8, 12.1, 3], [0, 0, 0], redGlow, { parent: "abdomen", glow: true, rotation: [0, 0.5, 0] }),
    pt("fis6", [1, 1, 12], [8, 12.1, -6], [0, 0, 0], redGlow, { parent: "abdomen", glow: true, rotation: [0, -0.5, 0] }),
    pt("fis7", [8, 1, 1], [0, 2, 8.2], [0, 0, 0], redGlow, { parent: "thorax", glow: true }),
    pt("spin", [6, 4, 4], [0, -4, -16], [0, 0, 0], shell, { parent: "abdomen" })
  ];
  for (let i = 0; i < 4; i++) parts.push(pt("spk" + i, [3, 7, 3], [(i % 2 ? 6 : -6), 12, 9 - i * 6], [0, 2, 0], { all: P => { P.fill(["#1a1a1e"]); P.rect(0, 0, 16, 5, "#4a1a20"); } }, { parent: "abdomen", rotation: [-0.4, 0, i % 2 ? -0.3 : 0.3] }));
  for (let i = 0; i < 3; i++) parts.push(pt("silk" + i, [1, 12, 1], [-3 + i * 3, -2, -16], [0, -6, 0], silkP, { parent: "abdomen", glow: true }));
  for (const [ex, ey, sz] of [[-4, 2, 3], [4, 2, 3], [-2, 3.8, 2], [2, 3.8, 2], [-5.6, 0, 2], [5.6, 0, 2]]) parts.push(pt("eye" + ex + "_" + ey, [sz, sz, 1], [ex, ey, 5.3], [0, 0, 0], redGlow, { parent: "head", glow: true }));
  for (const s of [-1, 1]) for (let i = 0; i < 4; i++) {
    const up = "lu" + (s > 0 ? "L" : "R") + i, lo = "ll" + (s > 0 ? "L" : "R") + i;
    parts.push(pt(up, [24, 5, 5], [s * 8, 14, 9 - i * 5], [s * 12, 0, 0], { all: plates, top: P => { plates(P); P.rect(0, 7, 16, 1, "#4a1a20"); } }, { rotation: [0, -s * (0.7 - i * 0.45), s * 0.55], leg: { s, i } }),
      pt(lo, [4, 27, 4], [s * 12, 0, 0], [0, -12, 0], { all: shell, bottom: P => { P.fill(["#141418"]); } }, { parent: up, rotation: [0, 0, -s * 0.3] }));
  }
  return parts;
}

// The Forsaken Hisser: a huge, four-legged mutated Hisser. A jagged green body cracked with glowing green fissures,
// an unstable pulsing core in its chest, blackened legs, stone-like spikes, a hollow-eyed face, and toxic drips.
const HG = ["#4f8a32", "#5c9a3a", "#447a2a", "#68a844"], TOX = "#9cff3a";
const hissSkin = seed => P => { P.fill(HG); spk(P, 10, ["#2e5a1c", "#78b850", "#3a6a24"]); P.rect(2 + seed % 7, 2, 1, 7, "#24401a"); P.rect(9 - seed % 4, 9, 4, 1, "#24401a"); };
const charred = P => { P.fill(["#1c1f1a", "#252a22", "#161914"]); spk(P, 5, ["#2e3a26", "#0e100c"]); };
const toxGlow = P => { P.fill([TOX]); P.rect(0, 0, 16, 16, TOX); };
function hisserParts() {
  const parts = [
    pt("body", [24, 22, 20], [0, 12, 0], [0, 11, 0], { all: hissSkin(1), front: hissSkin(4), back: hissSkin(6) }),
    pt("core", [9, 9, 2], [0, 1, 10.2], [0, 0, 0], { all: P => { P.fill(["#c8ff6a"]); P.rect(3, 3, 10, 10, "#f0ffc0"); P.rect(6, 6, 4, 4, "#ffffff"); } }, { parent: "body", glow: true }),
    pt("fisA", [1, 18, 1], [-8, 1, 10.2], [0, 0, 0], toxGlow, { parent: "body", glow: true }),
    pt("fisB", [1, 14, 1], [7.5, -3, 10.2], [0, 0, 0], toxGlow, { parent: "body", glow: true }),
    pt("fisC", [1, 16, 1], [12.2, 0, 2], [0, 0, 0], toxGlow, { parent: "body", glow: true }),
    pt("fisD", [1, 12, 1], [-12.2, 3, -3], [0, 0, 0], toxGlow, { parent: "body", glow: true }),
    pt("fisE", [12, 1, 1], [0, 6, -10.2], [0, 0, 0], toxGlow, { parent: "body", glow: true }),
    pt("head", [18, 16, 16], [0, 10, 3], [0, 8, 1], { all: hissSkin(3), front: P => { hissSkin(2)(P); P.rect(2, 3, 4, 5, "#0c1408"); P.rect(10, 3, 4, 5, "#0c1408"); P.rect(6, 8, 4, 3, "#0c1408"); P.rect(4, 11, 2, 3, "#0c1408"); P.rect(10, 11, 2, 3, "#0c1408"); P.rect(6, 12, 4, 2, "#0c1408"); } }, { parent: "body" }),
    pt("eyeR", [3, 3, 1], [-4.5, 4, 8.2], [0, 0, 0], toxGlow, { parent: "head", glow: true }),
    pt("eyeL", [3, 3, 1], [4.5, 4, 8.2], [0, 0, 0], toxGlow, { parent: "head", glow: true })
  ];
  for (let i = 0; i < 3; i++) parts.push(pt("drip" + i, [2, 5, 2], [-5 + i * 5, -8, 7.5], [0, -2.5, 0], toxGlow, { parent: "head", glow: true }));
  const jag = [[-8, 10, -4, 0.4, 0.3], [7, 10, 3, -0.3, -0.4], [0, 10, -7, -0.5, 0], [10, 4, -8, -0.6, -0.6], [-10, 0, -8, -0.6, 0.6], [-4, 10, 4, 0.2, 0.3]];
  jag.forEach(([x, y, z, rx, rz], i) => parts.push(pt("jag" + i, [5, 11, 5], [x, y, z], [0, 3, 0], charred, { parent: i < 4 ? "body" : "head", rotation: [rx, 0, rz] })));
  for (const [n, x, z] of [["legFR", -10, 7], ["legFL", 10, 7], ["legBR", -10, -7], ["legBL", 10, -7]])
    parts.push(pt(n, [9, 14, 9], [x, 13, z], [0, -6.5, 0], { all: charred, top: hissSkin(5) }, { rotation: [z > 0 ? -0.3 : 0.3, 0, x > 0 ? -0.32 : 0.32] }));
  return parts;
}

// The Forsaken Voidwalker: an exceptionally tall, four-armed shadow creature. Angular black armor with purple energy
// cracks, violet glowing eyes under a crested head, long upper arms and a second, shorter pair of arms below them.
const VB = ["#141018", "#1a1520", "#100c14", "#201a28"], VIO = "#c060ff";
const armorV = P => { P.fill(VB); spk(P, 6, ["#2a2234", "#0a080c"]); P.rect(0, 0, 16, 1, "#2e2638"); };
const vGlow = P => { P.fill([VIO]); P.rect(0, 0, 16, 16, VIO); };
function voidwalkerParts() {
  const parts = [
    pt("hips", [12, 6, 7], [0, 42, 0], [0, 0, 0], armorV),
    pt("body", [17, 26, 10], [0, 44, 0], [0, 13, 0], { all: armorV, front: P => { armorV(P); P.rect(7, 0, 2, 16, "#2a2234"); P.rect(2, 4, 12, 1, "#2a2234"); } }),
    pt("crackA", [1, 16, 1], [-3, 2, 5.2], [0, 0, 0], vGlow, { parent: "body", glow: true, rotation: [0, 0, 0.25] }),
    pt("crackB", [1, 12, 1], [4, -5, 5.2], [0, 0, 0], vGlow, { parent: "body", glow: true, rotation: [0, 0, -0.3] }),
    pt("crackC", [6, 1, 1], [0, 8, 5.2], [0, 0, 0], vGlow, { parent: "body", glow: true }),
    pt("crackD", [1, 14, 1], [0, 0, -5.2], [0, 0, 0], vGlow, { parent: "body", glow: true }),
    pt("plateR", [11, 6, 12], [-11, 11, 0], [0, 0, 0], armorV, { parent: "body", rotation: [0, 0, 0.3] }),
    pt("plateL", [11, 6, 12], [11, 11, 0], [0, 0, 0], armorV, { parent: "body", rotation: [0, 0, -0.3] }),
    pt("head", [10, 11, 10], [0, 13, 0], [0, 5.5, 0], { all: armorV, front: P => { armorV(P); P.rect(1, 9, 14, 1, "#2e2638"); } }, { parent: "body" }),
    pt("crest", [2, 7, 9], [0, 11, -1], [0, 2, 0], armorV, { parent: "head", rotation: [-0.3, 0, 0] }),
    pt("eyeR", [3, 1, 1], [-2.5, 6, 5.2], [0, 0, 0], vGlow, { parent: "head", glow: true }),
    pt("eyeL", [3, 1, 1], [2.5, 6, 5.2], [0, 0, 0], vGlow, { parent: "head", glow: true })
  ];
  for (const [s, sign] of [["R", -1], ["L", 1]]) parts.push(
    pt("leg" + s, [5, 42, 5], [sign * 4, 42, 0], [0, -21, 0], armorV),
    pt("arm" + s, [5, 36, 5], [sign * 11, 68, 0], [0, -17, 0], armorV, { rotation: [0, 0, sign * -0.08] }),
    pt("claw" + s, [6, 7, 6], [0, -18, 0], [0, -3, 0], { all: armorV, bottom: vGlow }, { parent: "arm" + s }),
    pt("low" + s, [4, 28, 4], [sign * 10, 58, 2], [0, -13, 0], armorV, { rotation: [-0.25, 0, sign * -0.55] }),
    pt("lowClaw" + s, [5, 5, 5], [0, -14, 0], [0, -2, 0], { all: armorV, bottom: vGlow }, { parent: "low" + s }),
    pt("armCrack" + s, [1, 20, 1], [sign * 2.6, -2, 0], [0, 0, 0], vGlow, { parent: "arm" + s, glow: true }));
  return parts;
}

// ---------- the species ----------
const LOOT = {
  groaner: e => [[I.CORRUPTED_FLESH, randi(2, 4)], [I.FORSAKEN_SHARD, 1], ...(e.trophy || Math.random() < 0.2 ? [[I.GROANER_TROPHY, 1]] : [])],
  rattler: e => [[I.FORSAKEN_BONE, randi(2, 4)], [I.FORSAKEN_SHARD, 1], ...(Math.random() < 0.5 ? [[I.BOW_LIMB, 1]] : []), ...(e.trophy || Math.random() < 0.2 ? [[I.RATTLER_TROPHY, 1]] : [])],
  skitter: e => [[I.CORRUPTED_SILK, randi(2, 4)], [I.FORSAKEN_SHARD, 1], ...(Math.random() < 0.5 ? [[I.VENOM_FANG, 1]] : []), ...(e.trophy || Math.random() < 0.2 ? [[I.SKITTER_TROPHY, 1]] : [])],
  hisser: e => [[I.VOLATILE_MUTAGEN, randi(1, 2)], [I.FORSAKEN_SHARD, 1], ...(Math.random() < 0.5 ? [[I.BLAST_CORE, 1]] : []), ...(e.trophy || Math.random() < 0.2 ? [[I.HISSER_TROPHY, 1]] : [])],
  voidwalker: e => [[I.VOID_ESSENCE, randi(2, 3)], [I.FORSAKEN_PEARL, 1], [I.FORSAKEN_SHARD, 1], ...(e.trophy || Math.random() < 0.2 ? [[I.VOIDWALKER_TROPHY, 1]] : [])]
};
let trophyHook = null;
export const setTrophyHook = fn => { trophyHook = fn; };
const TROPHIES = () => [I.GROANER_TROPHY, I.RATTLER_TROPHY, I.SKITTER_TROPHY, I.HISSER_TROPHY, I.VOIDWALKER_TROPHY];
const drops = e => { const list = (LOOT[e.def.mutant] || (() => []))(e); if (trophyHook && list.some(d => TROPHIES().includes(d[0]))) trophyHook(e); return list; };
export function installMutants(species) {
  species.fs_rattler = { name: "Forsaken Rattler", mutant: "rattler", base: "skeleton", baseHp: 20, puff: "pale", dieTint: [0.9, 0.95, 1.1], hostile: true, noSave: true, hp: 100, speed: 2.4, w: 1.4, h: 5.2, scale: 1.15,
    ai: "mutant", dmg: 5, reach: 3.5, xp: 40, sound: "rattle", deathPuff: "pale", drops, model: { type: "mutant", parts: rattlerParts() } };
  species.fs_hisser = { name: "Forsaken Hisser", mutant: "hisser", base: "creeper", baseHp: 20, puff: "totemGreen", dieTint: [0.75, 1, 0.6], finale: true, hostile: true, noSave: true, hp: 100, speed: 2.6, w: 2.4, h: 4.1, scale: 1.35,
    ai: "mutant", dmg: 5, reach: 3, xp: 40, sound: "hiss", deathPuff: "totemGreen", drops, model: { type: "mutant", parts: hisserParts() } };
  const vwParts = voidwalkerParts();
  species.fs_voidwalker = { name: "Forsaken Voidwalker", mutant: "voidwalker", base: "voidwalker", baseHp: 28, puff: "portal", dieTint: [0.85, 0.6, 1.1], enrage: true, enrageAt: 0.35, hostile: true, noSave: true, hp: 140, speed: 2.8, w: 1, h: 5.6, scale: 1.15,
    ai: "mutant", dmg: 6, reach: 3.8, xp: 50, sound: "warble", deathPuff: "portal", drops, model: { type: "mutant", parts: vwParts } };
  species.fs_shadow = { name: "Shadow Clone", mutant: "shadow", clone: true, translucent: true, puff: "portal", dieTint: [0.6, 0.4, 0.9], hostile: true, noSave: true, hp: 12, speed: 3.1, w: 1, h: 5.6, scale: 1.15,
    ai: "mutant", dmg: 3, reach: 3.4, xp: 0, sound: "warble", deathPuff: "portal", drops: () => [], model: { type: "mutant", parts: vwParts } };
  species.fs_skitter = { name: "Forsaken Skitter", mutant: "skitter", base: "spider", baseHp: 16, puff: "spark", dieTint: [1, 0.5, 0.5], hostile: true, noSave: true, hp: 80, speed: 3.4, w: 3.4, h: 2.4, scale: 1.35, climbs: true,
    ai: "mutant", dmg: 5, reach: 3.4, xp: 40, sound: "chitter", deathPuff: "spark", drops, model: { type: "mutant", parts: skitterParts() } };
  species.fs_groaner = { name: "Forsaken Groaner", mutant: "groaner", base: "zombie", baseHp: 20, puff: "totemGreen", dieTint: [0.7, 1, 0.7], comeback: true, enrage: true, hostile: true, noSave: true, hp: 100, speed: 2.1, w: 1.8, h: 4.6, scale: 1.2,
    ai: "mutant", dmg: 7, reach: 3, xp: 40, sound: "groan", deathPuff: "totemGreen", drops,
    model: { type: "mutant", parts: groanerParts() } };
}

// small helpers for smooth poses
const ease = (dt, rate = 12) => 1 - Math.exp(-rate * dt);
const toward = (obj, axis, target, k) => { obj.rotation[axis] += (target - obj.rotation[axis]) * k; };
function baseRot(e) {   // remember each part's starting rotation once
  if (e.baseRot) return e.baseRot;
  e.baseRot = {};
  for (const q of e.def.model.parts) e.baseRot[q.name] = q.rotation ? { x: q.rotation[0], y: q.rotation[1], z: q.rotation[2] } : { x: 0, y: 0, z: 0 };
  return e.baseRot;
}
function animateRattler(e, dt) {
  const P = e.parts, m = e.mut || {}, st = m.st || "idle", atk = m.atk, k = ease(dt);
  const speed = Math.hypot(e.vel.x, e.vel.z), walk = Math.sin(e.walkPhase * 1.6) * Math.min(1, speed / 2) * 0.6;
  toward(P.legR, "x", walk, k); toward(P.legL, "x", -walk, k);
  toward(P.shinR, "x", Math.max(0, -walk) * 0.7, k); toward(P.shinL, "x", Math.max(0, walk) * 0.7, k);
  const aiming = (st === "wind" && (atk === "shot" || atk === "volley" || atk === "bomb")) || st === "volley";
  let armL = -0.55 + walk * 0.15, armR = -walk * 0.4, foreR = -0.15, foreL = -0.1, ribs = 0.14 + Math.sin(e.age * 1.4) * 0.03, jaw = 0.05 + Math.sin(e.age * 2.1) * 0.04, head = -0.14;
  if (aiming) { armL = -1.55; foreL = 0; armR = -1.45; foreR = -1.35; head = -0.05; }
  if (st === "wind" && atk === "club") { armR = -2.7; foreR = -0.5; jaw = 0.4; }
  if (st === "strike" && atk === "club") { armR = 0.4; foreR = -0.1; ribs = 0.4; }
  if (st === "wind" && atk === "call") { armR = armL = -2.9; jaw = 0.7; head = -0.5; }
  if (st === "notice") { jaw = 0.7; head = -0.45; armR = -0.6; }
  if (st === "reload") { armL = -0.2; armR = 0.1; ribs = 0.45; jaw = 0.35; head = 0.15; }
  if (st === "stagger") { ribs = 0.5; jaw = 0.5; armL = 0.1; e.root.rotation.z = Math.sin(e.age * 9) * 0.08; } else e.root.rotation.z *= 0.8;
  toward(P.armL, "x", armL, k); toward(P.armR, "x", armR, k); toward(P.foreR, "x", foreR, k); toward(P.foreL, "x", foreL, k);
  toward(P.ribs, "x", ribs, k); toward(P.jaw, "x", jaw, k); toward(P.head, "x", head, k);
  // the bowstring and eyes glow; brighter while it draws, brightest during a volley
  let g = 0.8 + Math.sin(e.age * 2.5) * 0.1;
  if (aiming) g = 1.05 + Math.min(1, m.t || 0) * 0.5 + (atk === "volley" || st === "volley" ? Math.sin(e.age * 20) * 0.25 : 0);
  if (st === "reload") g = 0.5;
  e.glowMat.color.setRGB(g * 0.92, g * 0.98, g * 1.1);
  if (st === "stagger" && !(e.hurtT > 0)) e.mat.color.multiplyScalar(0.85);
}
function animateSkitter(e, dt) {
  const P = e.parts, m = e.mut || {}, st = m.st || "idle", atk = m.atk, k = ease(dt), base = baseRot(e);
  const speed = Math.hypot(e.vel.x, e.vel.z), amt = Math.min(1, speed / 2.5);
  const rear = (st === "wind" && atk === "bite") || st === "notice", crouch = st === "wind" && atk === "leap", air = st === "leap";
  for (const q of e.def.model.parts) {
    if (!q.leg) continue;
    const g = P[q.name], b = base[q.name], { s, i } = q.leg, ph = e.walkPhase * 2.4 + i * Math.PI / 2 + (s > 0 ? Math.PI : 0);
    let z = b.z + s * Math.max(0, Math.sin(ph)) * 0.3 * amt, y = b.y + Math.cos(ph) * 0.25 * amt;
    if (rear && i < 2) z += s * 0.75;
    if (crouch) z -= s * 0.2;
    if (air) z += s * 0.25;
    if (st === "down" || st === "stagger") z += s * Math.sin(e.age * 14 + i) * 0.15;
    toward(g, "z", z, k); toward(g, "y", y, k);
  }
  let rx = rear ? -0.45 : air ? -0.2 : 0, ry = crouch ? -0.3 : 0;
  if (!e.onGround && e.vel.y > 0.8 && !air) rx = -1.1;   // climbing a wall
  toward(e.root, "x", rx, k); e.root.position.y += (ry - e.root.position.y) * k;
  toward(P.abdomen, "x", -0.25 + Math.sin(e.age * 2) * 0.04 + (st === "wind" && atk === "web" ? -0.45 : 0), k);
  const pulse = st === "brood" ? 1 + Math.sin(e.age * 9) * 0.08 : 1; P.abdomen.scale.set(pulse, pulse, pulse);
  const fang = st === "wind" && atk === "bite" ? 0.7 : rear ? 0.45 : 0.15 + Math.sin(e.age * 3) * 0.05;
  toward(P.fangR, "z", fang, k); toward(P.fangL, "z", -fang, k);
  for (let i = 0; i < 3; i++) { P["silk" + i].rotation.x = Math.sin(e.age * 1.5 + i) * 0.3; P["silk" + i].rotation.z = Math.sin(e.age * 1.1 + i * 2) * 0.2; }
  let g = 0.8 + Math.sin(e.age * 2) * 0.12;
  if (st === "wind" || st === "leap") g = 1.1 + Math.sin(e.age * 16) * 0.25;
  if (st === "brood") g = 1.2 + Math.sin(e.age * 9) * 0.4;
  if (m.nest) g += 0.15;
  e.glowMat.color.setRGB(g, g * 0.95, g * 0.95);
}
function animateHisser(e, dt) {
  const P = e.parts, m = e.mut || {}, st = m.st || "idle", atk = m.atk, k = ease(dt), base = baseRot(e);
  const speed = Math.hypot(e.vel.x, e.vel.z), sw = Math.sin(e.walkPhase * 2) * Math.min(1, speed / 2) * 0.5;
  toward(P.legFR, "x", base.legFR.x + sw, k); toward(P.legBL, "x", base.legBL.x + sw, k);
  toward(P.legFL, "x", base.legFL.x - sw, k); toward(P.legBR, "x", base.legBR.x - sw, k);
  let lean = Math.sin(e.age * 1.6) * 0.03, crouch = 0, headX = 0;
  if (st === "wind" && atk === "leap") { lean = 0.35; crouch = -0.35; }
  if (st === "wind" && atk === "burst") { lean = -0.15; headX = -0.3; }
  if (st === "wind" && atk === "blasts") { headX = -0.4; }
  if (st === "leap") lean = 0.25;
  if (st === "retreat") { lean = -0.1; headX = 0.25; }
  if (st === "unstable") { lean = Math.sin(e.age * 30) * 0.06; e.root.rotation.z = Math.sin(e.age * 26) * 0.05; } else e.root.rotation.z *= 0.8;
  if (st === "stagger") { headX = 0.4; e.root.rotation.z = Math.sin(e.age * 9) * 0.08; }
  toward(e.root, "x", lean, k); e.root.position.y += (crouch - e.root.position.y) * k; toward(P.head, "x", headX, k);
  // the core swells and pulses: faster as it charges, wild when it's about to blow
  const fast = st === "wind" || st === "leap" ? 14 : st === "unstable" ? 26 : st === "retreat" ? 2 : 4;
  const swell = (st === "wind" && atk === "burst" ? 0.35 * Math.min(1, (m.t || 0) / (m.dur || 1)) : 0) + (st === "unstable" ? 0.5 : 0);
  P.core.scale.setScalar(1 + swell + Math.sin(e.age * fast) * 0.12);
  for (let i = 0; i < 3; i++) P["drip" + i].scale.y = 0.6 + ((e.age * 0.8 + i * 0.37) % 1) * 0.8;
  let g = st === "retreat" ? 0.45 : 0.85 + Math.sin(e.age * fast) * 0.15;
  if (st === "wind" || st === "unstable") g = 1.15 + Math.sin(e.age * fast) * 0.35;
  e.glowMat.color.setRGB(g, g, g);
  if (st === "unstable" && Math.sin(e.age * 24) > 0.3 && !(e.hurtT > 0)) e.mat.color.setRGB(1, 1, 1);   // flashing white, like an ordinary Hisser's fuse
}
function animateVoidwalker(e, dt) {
  const P = e.parts, m = e.mut || {}, st = m.st || "idle", atk = m.atk, k = ease(dt), base = baseRot(e);
  const speed = Math.hypot(e.vel.x, e.vel.z), sw = Math.sin(e.walkPhase * 1.3) * Math.min(1, speed / 2) * 0.45;
  toward(P.legR, "x", sw, k); toward(P.legL, "x", -sw, k);
  let armR = -sw * 0.4, armL = sw * 0.4, lowR = base.lowR.x + sw * 0.3 + Math.sin(e.age * 2.3) * 0.15, lowL = base.lowL.x - sw * 0.3 + Math.sin(e.age * 2.1 + 1) * 0.15, spread = 0, head = Math.sin(e.age * 0.9) * 0.05;
  if (st === "wind" && atk === "strike") { armR = armL = -2.6; lowR = lowL = -1.6; }
  if (st === "strike") { armR = armL = 0.5; lowR = lowL = 0.4; }
  if (st === "wind" && atk === "pull" || st === "pull") { armR = armL = -1.5; lowR = lowL = -1.2; spread = 0.7; }
  if (st === "wind" && (atk === "call" || atk === "slash")) { armR = armL = -1.1; spread = 0.4; head = -0.3; }
  if (st === "tired") { armR = armL = 0.15; lowR = lowL = 0.2; head = 0.45; }
  if (st === "notice") { head = -0.35; spread = 0.5; armR = armL = -0.6; }
  toward(P.armR, "x", armR, k); toward(P.armL, "x", armL, k); toward(P.lowR, "x", lowR, k); toward(P.lowL, "x", lowL, k);
  toward(P.armR, "z", base.armR.z - spread, k); toward(P.armL, "z", base.armL.z + spread, k);
  toward(P.lowR, "z", base.lowR.z - spread * 1.5, k); toward(P.lowL, "z", base.lowL.z + spread * 1.5, k);
  toward(P.head, "x", head, k);
  if (st === "tired") toward(P.body, "x", 0.25, k); else toward(P.body, "x", 0, k);
  let g = 0.85 + Math.sin(e.age * 2) * 0.12;
  if (st === "wind" || st === "pull") g = 1.2 + Math.sin(e.age * 16) * 0.3;
  if (st === "tired") g = 0.4;
  if (m.enrageT > 0) g = 1.5 + Math.sin(e.age * 10) * 0.35;
  e.glowMat.color.setRGB(g, g, g);
  if (e.def.clone) {   // shadow clones are see-through, with dim eyes: the real one is solid
    e.mat.opacity = 0.5; e.mat.transparent = true; e.glowMat.opacity = 0.35; e.glowMat.transparent = true;
    e.glowMat.color.multiplyScalar(0.55);
  } else if (m.enrageT > 0 && !(e.hurtT > 0)) { const c = e.mat.color; e.mat.color.setRGB(Math.min(1, c.r * 1.3 + 0.08), c.g, Math.min(1, c.b * 1.4 + 0.12)); }
}
// ---------- animation (every frame, after the game has set its light level) ----------
export function animateMutant(e, dt) {
  if (!e.def.mutant) return;
  const P = e.parts, m = e.mut || {};
  if (!e.glowMat) {   // the eyes and cracks use their own material, so they glow even in the dark mist
    e.glowMat = e.mat.clone(); e.glowMat.color.setScalar(1);
    for (const q of e.def.model.parts) if (q.glow && P[q.name]) P[q.name].children[0].material = e.glowMat;
  }
  if (e.def.mutant === "rattler") return animateRattler(e, dt);
  if (e.def.mutant === "skitter") return animateSkitter(e, dt);
  if (e.def.mutant === "hisser") return animateHisser(e, dt);
  if (e.def.mutant === "voidwalker" || e.def.mutant === "shadow") return animateVoidwalker(e, dt);
  const speed = Math.hypot(e.vel.x, e.vel.z), walk = Math.sin(e.walkPhase * 1.4) * Math.min(1, speed / 2) * 0.7;
  const st = m.st || "idle", k = m.t || 0;
  // legs and a heavy side-to-side sway
  P.legR.rotation.x = walk; P.legL.rotation.x = -walk;
  e.root.rotation.z = Math.sin(e.walkPhase * 1.4) * 0.05 * Math.min(1, speed / 2);
  let armR = -walk * 0.6 - 0.15, armL = walk * 0.5 - 0.1, jaw = 0.08 + Math.sin(e.age * 1.7) * 0.04, bodyX = 0.35 + Math.sin(e.age * 1.3) * 0.03, rootY = 0;
  if (st === "wind" && m.atk === "swing") { armR = -2.4; jaw = 0.3; }
  if (st === "wind" && m.atk === "slam") { armR = armL = -2.8; bodyX = 0.05; jaw = 0.45; }
  if (st === "wind" && m.atk === "charge") { bodyX = 0.75; armR = armL = 0.4; rootY = -0.25; jaw = 0.35; }
  if (st === "strike") { armR = m.atk === "slam" ? 0.4 : 0.6; armL = m.atk === "slam" ? 0.4 : armL; bodyX = 0.55; }
  if (st === "dash") { bodyX = 0.8; armR = armL = 0.5; jaw = 0.4; }
  if (st === "notice" || st === "howl") { armR = armL = -1.2; jaw = 0.6; bodyX = -0.05; }
  if (st === "stagger") { bodyX = 0.15; armR = 0.2; armL = -0.2; jaw = 0.5; e.root.rotation.z = Math.sin(e.age * 9) * 0.08; }
  if (st === "down") { bodyX = 1.2; rootY = -1.2; armR = armL = -0.4; jaw = 0.5; e.root.rotation.z = 0.3; }
  if (st === "rise") { const r = Math.min(1, k / 1.4); bodyX = 1.2 - r * 0.9; rootY = -1.2 * (1 - r); armR = armL = -1.4 * r; jaw = 0.6; }
  const ease = 1 - Math.exp(-12 * dt);
  P.armR.rotation.x += (armR - P.armR.rotation.x) * ease; P.armL.rotation.x += (armL - P.armL.rotation.x) * ease;
  P.body.rotation.x += (bodyX - P.body.rotation.x) * ease; P.jaw.rotation.x += (jaw - P.jaw.rotation.x) * ease;
  e.root.position.y += (rootY - e.root.position.y) * ease;
  // glow: brighter while it winds up, while healing, while down, and while angry
  let g = 0.75 + Math.sin(e.age * 3) * 0.1;
  if (st === "wind" || st === "dash") g = 1 + Math.sin(e.age * 18) * 0.2;
  if (m.regen) g = 0.9 + Math.sin(e.age * 8) * 0.25;
  if (st === "down") g = 0.6 + Math.abs(Math.sin(e.age * 5)) * 0.8;
  if (m.enrageT > 0) g = 1.3 + Math.sin(e.age * 12) * 0.3;   // enraged: its eyes and cracks blaze
  e.glowMat.color.setRGB(g, Math.min(1.6, g * 1.05), g * (m.enrageT > 0 ? 0.6 : 1));
  if (st === "stagger" && !(e.hurtT > 0)) { const c = e.mat.color; e.mat.color.setRGB(c.r * 0.85, c.g * 0.85, Math.min(1, c.b * 1.3 + 0.1)); }
}
// A mutant's fall: it sinks to its knees, topples forward, and breaks into green mist.
export function mutantDying(E, e, dt) {
  e.dead -= dt;
  const k = Math.min(1, (2.6 - e.dead) / 1.6);
  if (e.def.mutant === "skitter") { e.root.rotation.z = k * 2.7; e.root.position.y = k * 0.9; }   // it flips over, legs curling
  else if (e.def.mutant === "voidwalker" || e.def.clone) e.root.scale.setScalar((e.def.scale || 1) * (1 - k * 0.85));   // it folds into the void
  else { e.root.rotation.x = k * 1.35; e.root.position.y = -k * 0.6; }
  const tint = e.def.dieTint || [0.7, 1, 0.7], f = 0.85 + Math.sin(e.dead * 20) * 0.15;
  e.mat.color.setRGB(tint[0] * f, tint[1] * f, tint[2] * f);
  if (e.glowMat) e.glowMat.color.setScalar(1 + Math.sin(e.dead * 25) * 0.4);
  if (Math.random() < (E.ctx.settings().quality === "fast" ? 0.2 : 0.5)) E.ctx.particles(e.pos.x + rand(-1, 1), e.pos.y + rand(0.5, 3), e.pos.z + rand(-1, 1), e.def.deathPuff || "totemGreen");
  e.mesh.position.set(e.pos.x, e.pos.y, e.pos.z);
  if (e.dead <= 0) { e.gone = true; for (let i = 0; i < 4; i++) E.ctx.particles(e.pos.x, e.pos.y + 1 + i * 0.7, e.pos.z, "poof"); }
}

// ---------- the fights and the spawning (runs only in the Forsaken World) ----------
export function initMutants(api) {
  const { G, ents, UI, Sound, puff, F, THREE, scene } = api;
  const MU = {};
  const reduced = () => !!(G.settings && G.settings.reducedMotion), fast = () => G.settings && G.settings.quality === "fast";
  const data = () => {
    const fw = G.story.fw || (G.story.fw = {});
    const s = fw.mutants || (fw.mutants = {});
    s.seen = s.seen || {}; s.kills = s.kills || {}; s.enc = s.enc || {}; s.tips = s.tips || {};
    return s;
  };
  MU.data = data;
  const alive = () => ents.list.filter(e => e.def.mutant && !e.def.clone && !e.dead && !e.gone);
  const NAMES = { groaner: "Forsaken Groaner", rattler: "Forsaken Rattler", skitter: "Forsaken Skitter", hisser: "Forsaken Hisser", voidwalker: "Forsaken Voidwalker" };
  const NOTICE = { groaner: "roar", rattler: "clack", skitter: "shriek", hisser: "fuse", voidwalker: "scream" };
  const tip = (key, text, kind = "") => { const s = data(); if (s.tips[key]) return; s.tips[key] = 1; UI.toast(text, kind); };
  const warded = (x, z) => !!(F.warded && F.warded(x, z));

  // ---------- sounds (made by code, quieter with distance; the rings and glow carry the same warnings without sound) ----------
  function say(kind, d) {
    const k = Math.max(0, 1 - d / 30); if (k <= 0.03) return;
    const g = x => x * k;
    switch (kind) {
      case "growl": Sound.tone(62 + Math.random() * 10, 1.2, "sawtooth", g(0.06), -18); break;
      case "roar": Sound.tone(95, 1.1, "sawtooth", g(0.12), -55); Sound.tone(70, 1.2, "square", g(0.05), -30); Sound.noise(320, 0.9, g(0.18), 0.6, "lowpass"); break;
      case "step": Sound.noise(150, 0.16, g(0.3), 1, "lowpass"); break;
      case "rise": Sound.tone(120, 0.9, "sawtooth", g(0.09), 220); break;                  // the warning before a big attack
      case "impact": Sound.noise(130, 0.6, g(0.45), 0.6, "lowpass"); Sound.tone(55, 0.5, "sine", g(0.2), -20); break;
      case "hurt": Sound.tone(150, 0.25, "square", g(0.06), -70); break;
      case "heal": Sound.tone(420, 0.35, "triangle", g(0.05), 180); break;
      case "heart": Sound.tone(58, 0.18, "sine", g(0.3), -10); setTimeout(() => Sound.tone(52, 0.2, "sine", g(0.25), -10), 220); break;
      case "clack": for (let i = 0; i < 5; i++) setTimeout(() => Sound.noise(2600, 0.05, g(0.3), 5), i * 55); Sound.tone(180, 0.4, "square", g(0.04), -60); break;
      case "draw": Sound.tone(220, 0.8, "triangle", g(0.07), 260); Sound.noise(1800, 0.5, g(0.08), 2); break;
      case "boom": Sound.noise(110, 0.8, g(0.5), 0.5, "lowpass"); Sound.tone(70, 0.6, "sine", g(0.25), -30); break;
      case "shriek": Sound.tone(1400, 0.5, "sawtooth", g(0.05), -700); Sound.noise(5200, 0.6, g(0.2), 0.8, "highpass"); break;
      case "hiss": Sound.noise(5600, 0.45, g(0.25), 0.8, "highpass"); break;
      case "chitter": for (let i = 0; i < 3; i++) setTimeout(() => Sound.tone(700 + Math.random() * 300, 0.04, "square", g(0.04), 250), i * 45); break;
      case "spit": Sound.noise(900, 0.25, g(0.25), 1.2); Sound.tone(500, 0.2, "sine", g(0.05), -200); break;
      case "thud": Sound.noise(160, 0.35, g(0.4), 0.8, "lowpass"); break;
      case "tick": Sound.tone(1800, 0.05, "square", g(0.06), 0); break;
      case "fuse": Sound.noise(4800, 1.1, g(0.25), 0.7, "highpass"); Sound.tone(260, 1, "sawtooth", g(0.04), 400); break;
      case "fizz": Sound.noise(3000, 0.6, g(0.2), 1, "bandpass"); break;
      case "warp": Sound.tone(420, 0.3, "sine", g(0.12), 900); Sound.tone(900, 0.3, "sine", g(0.06), -600); break;
      case "scream": Sound.tone(620, 0.7, "sawtooth", g(0.07), -380); Sound.tone(660, 0.7, "square", g(0.04), -400); break;
      case "slash": Sound.noise(2400, 0.25, g(0.35), 1.5); Sound.tone(300, 0.2, "sawtooth", g(0.06), -150); break;
      case "die": Sound.tone(110, 2.2, "sawtooth", g(0.12), -80); Sound.noise(260, 1.6, g(0.2), 0.5, "lowpass"); break;
    }
  }

  // ---------- finding a safe place to appear ----------
  function standable(x, y, z, tall) {
    const w = G.world, bad = id => id === B.LAVA || id === B.WATER || id === B.FIRE;
    if (!SOLID[w.id(x, y - 1, z)] || bad(w.id(x, y - 1, z))) return false;
    for (let k = 0; k < tall; k++) if (SOLID[w.id(x, y + k, z)] || bad(w.id(x, y + k, z))) return false;
    return true;
  }
  function findSpot(cx, cz, rmin, rmax, opts = {}) {
    const p = G.player, w = G.world, tpl = F.template && F.template();
    const refuge = tpl && tpl.meta.landmarks.find(l => l.key === "refuge");
    for (let t = 0; t < 30; t++) {
      const a = Math.random() * Math.PI * 2, r = rand(rmin, rmax), x = Math.floor(cx + Math.cos(a) * r), z = Math.floor(cz + Math.sin(a) * r);
      if (!w.isLoaded(x, z) || !w.isLoaded(x + 1, z + 1) || !w.isLoaded(x - 1, z - 1)) continue;
      if (Math.hypot(x - p.pos.x, z - p.pos.z) < (opts.minFromPlayer || 10)) continue;
      if (warded(x + 0.5, z + 0.5) || warded(x + 4, z) || warded(x - 4, z) || warded(x, z + 4) || warded(x, z - 4)) continue;
      if (refuge && Math.hypot(x - refuge.x, z - refuge.z) < MUTANT_CONFIG.minFromRefuge) continue;
      const y = w.surfaceY(x, z) + 1;
      const tall = opts.tall || 5;
      if (!standable(x, y, z, tall) || !standable(x + 1, y, z, tall) || !standable(x, y, z + 1, tall)) continue;
      return { x: x + 0.5, y, z: z + 0.5 };
    }
    return null;
  }
  function spawn(kind, spot, opts = {}) {
    const e = ents.add("fs_" + kind, spot.x, spot.y, spot.z, {}); if (!e) return null;
    const mul = MUTANT_CONFIG.hpMul[G.wset.difficulty] || MUTANT_CONFIG.hpMul.normal;
    e.mutHp = Math.round((e.def.baseHp || 20) * mul); e.hp = e.mutHp;
    const CD = { groaner: { swing: 0, slam: 3, charge: 5 }, rattler: { shot: 1, volley: 4, bomb: 7, club: 0 }, skitter: { bite: 0, web: 3, leap: 4 }, hisser: { burst: 0, leap: 3, blasts: 5 }, voidwalker: { strike: 0, slash: 3, pull: 6, blink: 4 } };
    e.mut = { st: "idle", t: 0, cd: { ...(CD[kind] || {}) }, lastHurt: -99, calls: 0, howls: 0, far: 0, lost: 0, home: { x: spot.x, z: spot.z }, enc: opts.enc || null };
    if (opts.enc) e.trophy = !data().kills[kind];   // the first one you ever defeat always leaves its trophy
    for (let i = 0; i < (fast() ? 4 : 10); i++) puff(spot.x + rand(-1, 1), spot.y + rand(0, 3), spot.z + rand(-1, 1), e.def.puff || "totemGreen");
    const s = data(); s.seen[kind] = (s.seen[kind] || 0) + 1;
    return e;
  }

  // ---------- the brain ----------
  function setSt(e, st, t = 0) { e.mut.st = st; e.mut.t = 0; e.mut.dur = t; }
  const face = (e, x, z) => { e.yaw = Math.atan2(-(x - e.pos.x), -(z - e.pos.z)); };
  MU.think = (E, e, d, dmgMul) => {
    const m = e.mut; if (!m) { e.gone = true; return; }
    if (!e.def.clone && d < 32) noteAbility(e);
    if (e.def.mutant === "groaner") return thinkGroaner(E, e, d, dmgMul);
    if (e.def.mutant === "rattler") return thinkRattler(E, e, d, dmgMul);
    if (e.def.mutant === "skitter") return thinkSkitter(E, e, d, dmgMul);
    if (e.def.mutant === "hisser") return thinkHisser(E, e, d, dmgMul);
    if (e.def.mutant === "voidwalker") return thinkVoidwalker(E, e, d, dmgMul);
    if (e.def.mutant === "shadow") return thinkShadow(E, e, d, dmgMul);
  };
  function thinkGroaner(E, e, d, dmgMul) {
    const m = e.mut, p = G.player, step = Math.min(0.6, e.age - (m.lastAge ?? e.age)); m.lastAge = e.age;
    m.t += step; for (const k in m.cd) m.cd[k] -= step;
    if (m.enrageT > 0) { m.enrageT -= step; if (Math.random() < (fast() ? 0.25 : 0.6)) puff(e.pos.x + rand(-1.2, 1.2), e.pos.y + rand(2.5, 4.2), e.pos.z + rand(-1.2, 1.2), "totemGreen"); }
    const can = E.targetable() && !G.spectator, safe = warded(p.pos.x, p.pos.z);
    // footsteps: heavy thuds you can hear coming
    if (Math.hypot(e.vel.x, e.vel.z) > 0.5 && (m.stepT = (m.stepT || 0) - step) <= 0) { m.stepT = m.enrageT > 0 ? 0.45 : 0.6; say("step", d); }
    if (m.st !== "idle" && d < 24 && (m.growlT = (m.growlT ?? 4) - step) <= 0) { m.growlT = rand(6, 10); say("growl", d); }
    if (m.st === "down") return thinkDown(E, e, d);
    if (m.st === "rise") { e.goal = null; if (m.t >= 1.4) { setSt(e, "chase"); m.enrageT = 8; UI.toast("The Forsaken Groaner is back up, and furious!", "bad"); } return; }
    if (m.st === "stagger") { e.goal = null; if (Math.random() < 0.5) puff(e.pos.x + rand(-0.6, 0.6), e.pos.y + 4.4, e.pos.z + rand(-0.6, 0.6), "pale"); if (m.t >= m.dur) setSt(e, "chase"); return; }
    // healing: when nothing has hit it for a while, it knits itself back together (any hit stops it)
    m.regen = m.st !== "idle" && G.clock - m.lastHurt > 4 && e.hp < e.mutHp && !(m.noRegen > G.clock);
    if (m.regen) {
      e.hp = Math.min(e.mutHp, e.hp + e.mutHp * 0.02 * step);
      if (Math.random() < (fast() ? 0.15 : 0.4)) puff(e.pos.x + rand(-0.8, 0.8), e.pos.y + rand(1, 4), e.pos.z + rand(-0.8, 0.8), "totemGreen");
      if ((m.healT = (m.healT || 0) - step) <= 0) { m.healT = 1.2; say("heal", d); }
      if (d < 26) tip("groanerRegen", "The Forsaken Groaner is healing (green sparkles)! Hit it to stop the healing.");
    }
    // waiting for you to come close
    if (m.st === "idle") {
      if (can && !safe && (d < 9 || (d < 22 && E.canSeePlayer(e)) || e.angry > 0)) { setSt(e, "notice"); face(e, p.pos.x, p.pos.z); say("roar", d); data().seen.groaner = data().seen.groaner || 1; return; }
      if (!e.goal && Math.random() < 0.12) { const a = Math.random() * Math.PI * 2, gx = m.home.x + Math.cos(a) * 6, gz = m.home.z + Math.sin(a) * 6; if (!warded(gx, gz)) e.goal = { x: gx, z: gz, speed: 1.1 }; }
      return;
    }
    if (m.st === "notice") { e.goal = null; face(e, p.pos.x, p.pos.z); if (m.t >= 1.1) { setSt(e, "chase"); if (d < 30) tip("groanerMeet", "A Forsaken Groaner! Watch its arms: a raised fist means a punch, both arms up means a ground slam, crouching low means a charge.", "bad"); } return; }
    // you got away, or you're safe inside a ward: it stops at the edge, roars, and wanders back
    if (!can || d > 40 || safe) {
      m.lost += step; e.goal = null; face(e, p.pos.x, p.pos.z);
      if (safe && m.lost < step * 1.5 && d < 30) tip("groanerWard", "The Forsaken Groaner can't step into a ward. It will give up soon.", "good");
      if (m.lost > (safe ? 6 : 8)) { setSt(e, "idle"); m.lost = 0; e.goal = { x: m.home.x, z: m.home.z, speed: 1.4 }; }
      return;
    }
    m.lost = 0;
    if (m.st === "wind") return windUp(E, e, d, dmgMul);
    if (m.st === "strike") { e.goal = null; if (m.t >= m.dur) setSt(e, "recover", m.atk === "slam" ? 1.2 : 0.8); return; }
    if (m.st === "recover") { e.goal = null; if (m.t >= m.dur) setSt(e, "chase"); return; }
    if (m.st === "dash") return dash(E, e, d, dmgMul);
    if (m.st === "howl") { e.goal = null; face(e, p.pos.x, p.pos.z); if (m.t >= 1.3) { callHelpers(e, 2, "zombie"); setSt(e, "recover", 0.6); } return; }
    // chasing: pick an attack
    const frac = e.hp / e.mutHp, sees = E.canSeePlayer(e);
    if ((frac < 0.66 && m.howls < 1) || (frac < 0.33 && m.howls < 2)) { m.howls++; setSt(e, "howl"); say("roar", d); UI.toast("The Forsaken Groaner howls for help! Ordinary Groaners climb out of the ground.", "bad"); return; }
    const flatY = Math.abs(p.pos.y - e.pos.y) < 2;
    if (d < e.def.reach + 0.6 && flatY && m.cd.swing <= 0) return startWind(e, "swing", 0.75 * (reduced() ? 1.35 : 1), d);
    if (d < 6.5 && flatY && m.cd.slam <= 0) return startWind(e, "slam", 1.25 * (reduced() ? 1.35 : 1), d, E);
    if (d > 7 && d < 17 && sees && flatY && m.cd.charge <= 0) return startWind(e, "charge", 1.0 * (reduced() ? 1.35 : 1), d);
    E.chase(e, p.pos);
    if (e.goal) e.goal.speed = e.def.speed * (m.enrageT > 0 ? 1.4 : 1);
    unstick(e, step);
  }
  function startWind(e, atk, t, d, E) {
    const m = e.mut, p = G.player;
    setSt(e, "wind", t); m.atk = atk; e.goal = null; e.path = null; face(e, p.pos.x, p.pos.z); say("rise", d);
    if (atk === "slam") {   // the ring shows exactly where the slam will land, for the whole wind-up
      E.addHazard(e.pos.x, e.pos.y, e.pos.z, 4.6, t + 0.12, 6, "The Forsaken Groaner's ground slam hit you. When both arms go up, get out of the green ring!", 0, { owner: e, color: 0x8aff3a, particle: "totemGreen", statusEffect: null });
      m.slamAt = { x: e.pos.x, y: e.pos.y, z: e.pos.z };
    }
    if (atk === "charge") { const dx = p.pos.x - e.pos.x, dz = p.pos.z - e.pos.z, l = Math.hypot(dx, dz) || 1; m.dir = { x: dx / l, z: dz / l }; }
  }
  function windUp(E, e, d, dmgMul) {
    const m = e.mut, p = G.player;
    e.goal = null;
    if (warded(p.pos.x, p.pos.z)) {   // you reached a ward: the attack fizzles (wards always keep you safe)
      for (const h of E.hazards || []) if (h.owner === e) h.gone = true;
      setSt(e, "recover", 0.6); return;
    }
    if (m.atk !== "charge") face(e, p.pos.x, p.pos.z);
    else { if (Math.random() < 0.5) puff(e.pos.x, e.pos.y + 0.3, e.pos.z, "crumb"); }
    if (m.t < m.dur) return;
    if (m.atk === "swing") {   // a huge hook punch: steps back out of reach to dodge it
      if (d < e.def.reach + 0.8 && Math.abs(p.pos.y - e.pos.y) < 2.4 && E.targetable() && !warded(p.pos.x, p.pos.z)) {
        E.ctx.hurtPlayer(e.def.dmg * dmgMul, "The Forsaken Groaner's fist hit you. When it raises its big arm, step back!", e);
        const dx = p.pos.x - e.pos.x, dz = p.pos.z - e.pos.z, l = Math.hypot(dx, dz) || 1; E.ctx.push(dx / l * 7, 5, dz / l * 7);
      }
      say("impact", d); m.cd.swing = 1.6 * (m.enrageT > 0 ? 0.7 : 1); setSt(e, "strike", 0.35); return;
    }
    if (m.atk === "slam") {   // the slam lands (the ring hurts on its own), then a shockwave crawls along the ground toward where you were
      say("impact", d); E.ctx.shake && E.ctx.shake(0.25);
      const a = m.slamAt || e.pos, dx = p.pos.x - a.x, dz = p.pos.z - a.z, l = Math.hypot(dx, dz) || 1;
      for (let k = 1; k <= 4; k++) E.addHazard(a.x + dx / l * (3.5 + k * 2.2), a.y, a.z + dz / l * (3.5 + k * 2.2), 1.5, 0.45 + k * 0.18, 4, "The slam's shockwave caught you. Step sideways out of its path!", 0, { owner: e, color: 0x8aff3a, particle: "totemGreen", statusEffect: null });
      for (let i = 0; i < (fast() ? 4 : 10); i++) { const ang = i / 10 * Math.PI * 2; puff(a.x + Math.cos(ang) * 3, a.y + 0.3, a.z + Math.sin(ang) * 3, "crumb"); }
      m.cd.slam = 6 * (m.enrageT > 0 ? 0.75 : 1); m.cd.swing = Math.max(m.cd.swing, 1); setSt(e, "strike", 0.5); return;
    }
    if (m.atk === "charge") { say("roar", d); m.dashHit = false; m.dashFrom = { x: e.pos.x, z: e.pos.z }; m.moved = { x: e.pos.x, z: e.pos.z, t: 0 }; setSt(e, "dash", 1.3); return; }
  }
  function dash(E, e, d, dmgMul) {
    const m = e.mut, p = G.player;
    e.goal = { x: e.pos.x + m.dir.x * 4, z: e.pos.z + m.dir.z * 4, speed: 9 }; e.path = null; face(e, e.pos.x + m.dir.x, e.pos.z + m.dir.z);
    if (!m.dashHit && d < 2.6 && Math.abs(p.pos.y - e.pos.y) < 2.4 && E.targetable() && !warded(p.pos.x, p.pos.z)) {
      m.dashHit = true; E.ctx.hurtPlayer(6 * dmgMul, "The Forsaken Groaner's charge ran you over. When it crouches low, sidestep!", e);
      E.ctx.push(m.dir.x * 9, 6, m.dir.z * 9); say("impact", d);
      m.cd.charge = 7; setSt(e, "recover", 1); e.goal = null; return;
    }
    // slammed into a wall? it's dazed for a moment (a great time to hit it)
    if (m.t > 0.35) {
      const moved = Math.hypot(e.pos.x - m.moved.x, e.pos.z - m.moved.z);
      if (moved < 0.15) { e.goal = null; setSt(e, "stagger", 2.2); m.cd.charge = 7; say("impact", d); for (let i = 0; i < 6; i++) puff(e.pos.x + m.dir.x, e.pos.y + rand(1, 3), e.pos.z + m.dir.z, "crumb"); UI.toast("It crashed into something and is dazed! Hit it now (extra damage)!", "good"); return; }
    }
    m.moved = { x: e.pos.x, z: e.pos.z };
    if (m.t >= m.dur) { e.goal = null; m.cd.charge = 7; setSt(e, "recover", 1.1); }
  }
  function callHelpers(e, n, sp = "zombie") {
    const m = e.mut, have = ents.list.filter(o => o.mutCaller === e && !o.dead && !o.gone).length;
    for (let k = 0; k < Math.min(n, MUTANT_CONFIG.maxHelpers - have); k++) {
      const s = findSpot(e.pos.x, e.pos.z, 3, 7, { minFromPlayer: 4 }); if (!s) continue;
      const h = ents.add(sp, s.x, s.y, s.z, {}); if (!h) continue;
      h.mutCaller = e; h.angry = 60; m.calls++;
      for (let i = 0; i < 6; i++) puff(s.x + rand(-0.5, 0.5), s.y + rand(0, 1.5), s.z + rand(-0.5, 0.5), e.def.puff || "totemGreen");
    }
  }
  // The one comeback: it collapses with its heart thumping. Hit it hard while it's down and it stays down.
  function thinkDown(E, e, d) {
    const m = e.mut; e.goal = null;
    if ((m.beatT = (m.beatT || 0) - 0.15) <= 0) { m.beatT = 0.9; say("heart", d); }
    if (Math.random() < (fast() ? 0.2 : 0.5)) puff(e.pos.x + rand(-1, 1), e.pos.y + rand(0.2, 1.5), e.pos.z + rand(-1, 1), "totemGreen");
    if (m.t >= m.dur) { e.hp = Math.round(e.mutHp * 0.4); setSt(e, "rise", 1.4); say("rise", d); say("roar", d); }
  }
  // When it gets stuck chasing you, it tears through leaves and plants in its way (never stone, wood, or anything you built)
  const SOFT = new Set([B.LEAVES, B.BIRCH_LEAVES, B.TALL_GRASS, B.FLOWER_RED, B.FLOWER_YELLOW, B.SPRUCE_LEAVES, B.WEB, B.COBWEB].filter(v => typeof v === "number"));
  function unstick(e, step) {
    const m = e.mut;
    if (!m.stuck) m.stuck = { x: e.pos.x, z: e.pos.z, t: 0 };
    if (Math.hypot(e.pos.x - m.stuck.x, e.pos.z - m.stuck.z) > 0.6) { m.stuck = { x: e.pos.x, z: e.pos.z, t: 0 }; return; }
    m.stuck.t += step; if (m.stuck.t < 1.5 || (m.smashed || 0) >= 16) return;
    m.stuck.t = 0;
    const fx = -Math.sin(e.yaw), fz = -Math.cos(e.yaw), w = G.world;
    for (let dy = 0; dy < 4; dy++) for (const s of [-1, 0, 1]) {
      const x = Math.floor(e.pos.x + fx * 1.6 - fz * s), z = Math.floor(e.pos.z + fz * 1.6 + fx * s), y = Math.floor(e.pos.y) + dy;
      if (!SOFT.has(w.id(x, y, z)) || warded(x, z)) continue;
      w.set(x, y, z, B.AIR); puff(x + 0.5, y + 0.5, z + 0.5, "crumb"); m.smashed = (m.smashed || 0) + 1;
    }
  }

  // ---------- shared for the Rattler and Skitter: noticing you, losing you, and wards ----------
  const MEET = {
    rattler: "A Forsaken Rattler! Hide behind blocks to break its aim. A glowing bow means a volley, and after it, it must reload: hit it then! A pale ring on the ground marks an exploding arrow.",
    hisser: "A Forsaken Hisser! When its core swells, get away or hit it to crack the core. A green ring under you means it's about to land there. When it falls, it starts to blow up in three rings: run, or keep hitting it to smother the core.",
    voidwalker: "A Forsaken Voidwalker! Purple sparks show where it's about to appear. When it spreads its arms it pulls you in, then a purple ring bursts: run out, then hit it while it's worn out.",
    skitter: "A Forsaken Skitter! A red ring shows where it will leap. Dodge the white web globs. When it curls up and glows, hit it hard to stop the spiderlings."
  };
  function awareness(E, e, d, step) {   // returns true when this tick is used up
    const m = e.mut, p = G.player, can = E.targetable() && !G.spectator, safe = warded(p.pos.x, p.pos.z), kind = e.def.mutant;
    if (m.st === "idle") {
      if (can && !safe && (d < 9 || (d < 22 && E.canSeePlayer(e)) || e.angry > 0)) { setSt(e, "notice"); face(e, p.pos.x, p.pos.z); say(NOTICE[kind] || "clack", d); return true; }
      if (!e.goal && Math.random() < 0.12) { const a = Math.random() * Math.PI * 2, gx = m.home.x + Math.cos(a) * 6, gz = m.home.z + Math.sin(a) * 6; if (!warded(gx, gz)) e.goal = { x: gx, z: gz, speed: e.def.speed * 0.5 }; }
      return true;
    }
    if (m.st === "notice") { e.goal = null; face(e, p.pos.x, p.pos.z); if (m.t >= 1) { setSt(e, "chase"); if (d < 30) tip(kind + "Meet", MEET[kind], "bad"); } return true; }
    if (!can || d > 40 || safe) {
      m.lost += step; e.goal = null; face(e, p.pos.x, p.pos.z);
      if (safe && d < 30) tip(kind + "Ward", `The ${NAMES[kind]} can't reach you inside a ward. It will give up soon.`, "good");
      if (m.lost > (safe ? 6 : 8)) { setSt(e, "idle"); m.lost = 0; e.goal = { x: m.home.x, z: m.home.z, speed: e.def.speed * 0.6 }; }
      return true;
    }
    m.lost = 0;
    return false;
  }
  function callCheck(e) {   // two calls for help: below 2/3 and below 1/3 health
    const m = e.mut, frac = e.hp / e.mutHp;
    if ((frac < 0.66 && m.howls < 1) || (frac < 0.33 && m.howls < 2)) { m.howls++; return true; }
    return false;
  }

  // ---------- things in flight (exploding arrows, web globs) and web patches ----------
  const fx = [], webs = [];
  function lob(from, to, dur, color, size, onLand) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(size, size, size), new THREE.MeshBasicMaterial({ color, fog: false }));
    mesh.position.set(from.x, from.y, from.z); scene.add(mesh);
    fx.push({ mesh, from, to, dur, t: 0, onLand, color });
  }
  function tickFx(dt) {
    for (const f of fx) {
      f.t += dt; const k = Math.min(1, f.t / f.dur), arc = Math.sin(k * Math.PI) * Math.min(4, f.dur * 5);
      f.mesh.position.set(f.from.x + (f.to.x - f.from.x) * k, f.from.y + (f.to.y - f.from.y) * k + arc, f.from.z + (f.to.z - f.from.z) * k);
      f.mesh.rotation.x += dt * 8; f.mesh.rotation.y += dt * 6;
      if (Math.random() < (fast() ? 0.2 : 0.5)) puff(f.mesh.position.x, f.mesh.position.y, f.mesh.position.z, f.color === 0xf4f4ff ? "poof" : "pale");
      if (k >= 1) { f.done = true; f.onLand(); }
    }
    for (const f of fx.filter(q => q.done)) { scene.remove(f.mesh); f.mesh.geometry.dispose(); f.mesh.material.dispose(); }
    for (let i = fx.length - 1; i >= 0; i--) if (fx[i].done) fx.splice(i, 1);
  }
  function addWeb(x, y, z) {   // a sticky patch of silk on the ground (walk out of it; it fades after 6 seconds)
    if (webs.length >= 4) { const old = webs.shift(); disposeWeb(old); }
    const mat = new THREE.MeshBasicMaterial({ color: 0xf4f4ff, transparent: true, opacity: 0.45, side: THREE.DoubleSide, depthWrite: false });
    const disc = new THREE.Mesh(new THREE.CircleGeometry(2.2, 16), mat); disc.rotation.x = -Math.PI / 2; disc.position.set(x, y + 0.04, z); scene.add(disc);
    webs.push({ x, y, z, r: 2.2, t: 6, mesh: disc });
  }
  function disposeWeb(w) { scene.remove(w.mesh); w.mesh.geometry.dispose(); w.mesh.material.dispose(); }
  let webbedT = 0, webImmuneT = 0;
  function tickWebs(dt) {
    const p = G.player;
    for (const w of webs) { w.t -= dt; w.mesh.material.opacity = Math.min(0.45, w.t * 0.3); }
    for (const w of webs.filter(q => q.t <= 0)) disposeWeb(w);
    for (let i = webs.length - 1; i >= 0; i--) if (webs[i].t <= 0) webs.splice(i, 1);
    if (webbedT > 0) { webbedT -= dt; if (webbedT <= 0) webImmuneT = 3; if (Math.random() < 0.3) puff(p.pos.x + rand(-0.4, 0.4), p.pos.y + rand(0.2, 1.6), p.pos.z + rand(-0.4, 0.4), "poof"); }
    else if (webImmuneT > 0) webImmuneT -= dt;
  }
  function catchInWeb() {
    if (webbedT > 0 || webImmuneT > 0 || G.creative || G.spectator) return;
    webbedT = reduced() ? 1.8 : 2.4;
    tip("webbed", "You're stuck in a web! You'll slow down for a moment. You can't be webbed again right away.", "bad");
  }
  MU.slow = () => {
    if (webbedT > 0) return 0.3;
    const p = G.player;
    return webs.some(w => Math.hypot(p.pos.x - w.x, p.pos.z - w.z) < w.r && Math.abs(p.pos.y - w.y) < 2) ? 0.55 : 1;
  };
  function clearFx() { clearPools(); clearFxOnly(); }
  function clearFxOnly() { for (const f of fx) { scene.remove(f.mesh); f.mesh.geometry.dispose(); f.mesh.material.dispose(); } fx.length = 0; for (const w of webs) disposeWeb(w); webs.length = 0; webbedT = 0; }

  // ---------- the Forsaken Rattler: keeps its distance and shoots ----------
  function aimArrow(e, dmg, spread) {
    const p = G.player, cx = p.pos.x - e.pos.x, cz = p.pos.z - e.pos.z, c = Math.hypot(cx, cz) || 0.01;
    const sx = e.pos.x - cz / c * 0.6 + cx / c * 0.8, sy = e.pos.y + 4, sz = e.pos.z + cx / c * 0.6 + cz / c * 0.8;   // from the bow, a little in front of it
    const dx = p.pos.x - sx, dz = p.pos.z - sz, horiz = Math.hypot(dx, dz) || 0.01, speed = 24, t = Math.max(0.1, horiz / speed);
    const vy = (p.pos.y + 1.1 - sy) / t + 0.5 * 20 * t;
    ents.addProjectile("arrow", sx, sy, sz, dx / horiz * speed + rand(-1, 1) * spread * speed, vy + rand(-1, 1) * spread * speed, dz / horiz * speed + rand(-1, 1) * spread * speed, { owner: e, dmg });
    Sound.mob("bow", Math.hypot(dx, dz));
  }
  function thinkRattler(E, e, d, dmgMul) {
    const m = e.mut, p = G.player, step = Math.min(0.6, e.age - (m.lastAge ?? e.age)); m.lastAge = e.age;
    m.t += step; for (const k in m.cd) m.cd[k] -= step;
    if (m.st !== "idle" && d < 24 && (m.growlT = (m.growlT ?? 3) - step) <= 0) { m.growlT = rand(5, 9); say("clack", d); }
    if (Math.random() < (fast() ? 0.05 : 0.15)) puff(e.pos.x + rand(-0.8, 0.8), e.pos.y + rand(1.5, 4), e.pos.z + rand(-0.8, 0.8), "pale");
    if (m.st === "stagger") { e.goal = null; if (m.t >= m.dur) setSt(e, "chase"); return; }
    if (awareness(E, e, d, step)) return;
    const spread = { easy: 0.08, normal: 0.045, hard: 0.03 }[G.wset.difficulty] ?? 0.05, sees = E.canSeePlayer(e);
    if (m.st === "reload") { e.goal = null; if (Math.random() < 0.4) puff(e.pos.x, e.pos.y + 3.6, e.pos.z, "pale"); if (m.t >= m.dur) setSt(e, "chase"); return; }
    if (m.st === "recover") { e.goal = null; if (m.t >= m.dur) setSt(e, "chase"); return; }
    if (m.st === "strike") { e.goal = null; if (m.t >= m.dur) { setSt(e, "retreat", 1.6); } return; }
    if (m.st === "retreat") {   // after a bone strike it backs away to get room to shoot again
      const dx = e.pos.x - p.pos.x, dz = e.pos.z - p.pos.z, l = Math.hypot(dx, dz) || 1;
      e.goal = { x: e.pos.x + dx / l * 4, z: e.pos.z + dz / l * 4, speed: e.def.speed * 1.2 }; e.path = null; face(e, p.pos.x, p.pos.z);
      if (m.t >= m.dur) setSt(e, "chase"); return;
    }
    if (m.st === "volley") {   // four quick arrows, about half a second apart (so each one can land)
      e.goal = null; face(e, p.pos.x, p.pos.z);
      if (m.t < (m.shots || 0) * 0.55) return;
      if (sees && E.targetable() && !warded(p.pos.x, p.pos.z)) aimArrow(e, 3 * dmgMul, spread);
      if (++m.shots >= 4) { setSt(e, "reload", reduced() ? 2.8 : 2.3); m.cd.volley = 9; tip("rattlerReload", "It's reloading! Rush in and hit it (extra damage).", "good"); }
      return;
    }
    if (m.st === "wind") {
      e.goal = null; face(e, p.pos.x, p.pos.z);
      if (warded(p.pos.x, p.pos.z)) { for (const h of ents.hazards || []) if (h.owner === e) h.gone = true; setSt(e, "recover", 0.6); return; }
      if (m.t < m.dur) return;
      if (m.atk === "shot") { if (sees) aimArrow(e, 4.5 * dmgMul, spread); m.cd.shot = 2.2; setSt(e, "recover", 0.5); return; }
      if (m.atk === "volley") { m.shots = 0; setSt(e, "volley", 9); return; }
      if (m.atk === "bomb") {   // the exploding arrow flies to the ring it marked; the blast never breaks blocks
        const at = m.bombAt, from = { x: e.pos.x, y: e.pos.y + 3.4, z: e.pos.z };
        lob(from, at, 0.6, 0xd8ecff, 0.3, () => { say("boom", Math.hypot(at.x - G.player.pos.x, at.z - G.player.pos.z)); for (let i = 0; i < (fast() ? 4 : 10); i++) puff(at.x + rand(-2, 2), at.y + rand(0.2, 1.5), at.z + rand(-2, 2), "pale"); });
        Sound.mob("bow", d); m.cd.bomb = 8; setSt(e, "recover", 0.8); return;
      }
      if (m.atk === "club") {
        if (d < 4.3 && Math.abs(p.pos.y - e.pos.y) < 2.5 && E.targetable()) { E.ctx.hurtPlayer(5 * dmgMul, "The Forsaken Rattler's bone blade hit you. When it raises its bladed arm, back off!", e); const dx = p.pos.x - e.pos.x, dz = p.pos.z - e.pos.z, l = Math.hypot(dx, dz) || 1; E.ctx.push(dx / l * 9, 5, dz / l * 9); }
        say("clack", d); m.cd.club = 3; setSt(e, "strike", 0.4); return;
      }
      if (m.atk === "call") { callHelpers(e, 2, "skeleton"); setSt(e, "recover", 0.6); return; }
    }
    // choosing: help, bone strike up close, otherwise shoot from a distance
    if (callCheck(e)) { setSt(e, "wind", 1.2); m.atk = "call"; say("clack", d); UI.toast("The Forsaken Rattler raises its arms... ordinary Rattlers rise from the ground!", "bad"); return; }
    const wind = (atk, t) => { setSt(e, "wind", t * (reduced() ? 1.35 : 1)); m.atk = atk; e.goal = null; e.path = null; face(e, p.pos.x, p.pos.z); };
    if (d < 4 && m.cd.club <= 0) { wind("club", 0.6); say("draw", d); return; }
    if (sees && d < 22 && d >= 4) {
      if (m.cd.volley <= 0 && d > 5) { wind("volley", 1.1); say("draw", d); return; }
      if (m.cd.bomb <= 0 && d > 6) {
        wind("bomb", 1.0); say("draw", d);
        m.bombAt = { x: p.pos.x, y: p.pos.y, z: p.pos.z };
        ents.addHazard(p.pos.x, p.pos.y, p.pos.z, 3, (reduced() ? 1.35 : 1) * 1.0 + 0.6, 6, "The Forsaken Rattler's exploding arrow hit you. Step out of the pale ring!", 0, { owner: e, color: 0xd8ecff, particle: "pale", statusEffect: null });
        return;
      }
      if (m.cd.shot <= 0) { wind("shot", 0.7); return; }
      // keep a comfortable distance and sidestep
      const ax = (p.pos.x - e.pos.x) / d, az = (p.pos.z - e.pos.z) / d, want = d < 9 ? -1 : d > 15 ? 1 : 0, side = Math.sin(e.age * 0.6) > 0 ? 1 : -1;
      e.goal = { x: e.pos.x + ax * want * 2.5 - az * side * 1.5, z: e.pos.z + az * want * 2.5 + ax * side * 1.5, speed: e.def.speed * 0.85 }; e.path = null; face(e, p.pos.x, p.pos.z);
      return;
    }
    E.chase(e, p.pos);   // no clear shot: go find one
  }

  // ---------- the Forsaken Skitter: ambushes, webs, leaps, and spiderlings ----------
  function thinkSkitter(E, e, d, dmgMul) {
    const m = e.mut, p = G.player, step = Math.min(0.6, e.age - (m.lastAge ?? e.age)); m.lastAge = e.age;
    m.t += step; for (const k in m.cd) m.cd[k] -= step;
    m.nest = Math.hypot(e.pos.x - m.home.x, e.pos.z - m.home.z) < 14 && !!m.enc;   // stronger near its nest
    const mul = dmgMul * (m.nest ? 1.2 : 1);
    if (Math.hypot(e.vel.x, e.vel.z) > 0.8 && (m.stepT = (m.stepT || 0) - step) <= 0) { m.stepT = 0.35; say("chitter", d); }
    if (m.st === "stagger") { e.goal = null; if (m.t >= m.dur) setSt(e, "chase"); return; }
    if (m.st === "leap") {
      if ((m.t > 0.25 && e.onGround) || m.t > 1.4) { e.vel.x = e.vel.z = 0; say("thud", d); setSt(e, "recover", 0.9); }
      return;
    }
    if (awareness(E, e, d, step)) return;
    if (m.st === "recover") { e.goal = null; if (m.t >= m.dur) setSt(e, "chase"); return; }
    if (m.st === "brood") {   // curled up, glowing: if it isn't hurt enough, spiderlings hatch
      e.goal = null;
      if (m.t >= m.dur) { callHelpers(e, 3, "cave_spider"); UI.toast("Spiderlings hatch around the Forsaken Skitter!", "bad"); setSt(e, "recover", 0.6); }
      return;
    }
    if (m.st === "wind") {
      e.goal = null; if (m.atk !== "leap") face(e, p.pos.x, p.pos.z);
      if (warded(p.pos.x, p.pos.z)) { for (const h of ents.hazards || []) if (h.owner === e) h.gone = true; setSt(e, "recover", 0.6); return; }
      if (m.t < m.dur) return;
      if (m.atk === "bite") {
        if (d < 3.6 && Math.abs(p.pos.y - e.pos.y) < 2 && E.targetable()) {
          E.ctx.hurtPlayer(5 * mul, "The Forsaken Skitter's venom bite got you. When it rears up, back away!", e);
          E.ctx.effect(G.wset.difficulty === "easy" ? "poison" : "blight", G.wset.difficulty === "hard" ? 5 : 3);
        }
        say("hiss", d); m.cd.bite = 1.8; setSt(e, "recover", 0.6); return;
      }
      if (m.atk === "web") {
        const at = m.webAt, from = { x: e.pos.x, y: e.pos.y + 2, z: e.pos.z };
        lob(from, at, 0.55, 0xf4f4ff, 0.45, () => {
          const q = G.player; addWeb(at.x, at.y, at.z);
          if (Math.hypot(q.pos.x - at.x, q.pos.z - at.z) < 2.2 && Math.abs(q.pos.y - at.y) < 2 && E.targetable()) catchInWeb();
        });
        say("spit", d); m.cd.web = 6; setSt(e, "recover", 0.5); return;
      }
      if (m.atk === "leap") {
        const at = m.leapAt, dx = at.x - e.pos.x, dz = at.z - e.pos.z, l = Math.hypot(dx, dz) || 1, v = Math.min(14, l / 0.6);
        e.vel.x = dx / l * v; e.vel.z = dz / l * v; e.vel.y = 7.5; e.goal = null; e.path = null; e.knock = 0.8;
        say("hiss", d); m.cd.leap = 7; setSt(e, "leap", 1.4); return;
      }
    }
    // choosing
    if (callCheck(e)) { setSt(e, "brood", reduced() ? 2.2 : 1.7); m.broodDmg = 0; say("shriek", d); UI.toast("The Forsaken Skitter curls up and glows red! Hit it hard to stop its eggs from hatching!", "bad"); return; }
    const wind = (atk, t) => { setSt(e, "wind", t * (reduced() ? 1.35 : 1)); m.atk = atk; e.goal = null; e.path = null; };
    const flat = Math.abs(p.pos.y - e.pos.y) < 2.5, sees = E.canSeePlayer(e);
    if (d < 3.4 && flat && m.cd.bite <= 0) { wind("bite", 0.55); face(e, p.pos.x, p.pos.z); say("hiss", d); return; }
    if (d > 6 && d < 13 && flat && sees && e.onGround && m.cd.leap <= 0) {
      wind("leap", 0.85); face(e, p.pos.x, p.pos.z);
      m.leapAt = { x: p.pos.x, y: p.pos.y, z: p.pos.z };
      ents.addHazard(p.pos.x, p.pos.y, p.pos.z, 2.6, (reduced() ? 1.35 : 1) * 0.85 + 0.6, 6 * (m.nest ? 1.2 : 1), "The Forsaken Skitter landed on you. When a red ring appears under you, move!", 0, { owner: e, color: 0xff3040, particle: "spark", statusEffect: null });
      return;
    }
    if (d > 5 && d < 18 && sees && m.cd.web <= 0) { wind("web", 0.6); face(e, p.pos.x, p.pos.z); m.webAt = { x: p.pos.x, y: p.pos.y, z: p.pos.z }; return; }
    E.chase(e, p.pos);
    if (e.goal) e.goal.speed = e.def.speed * (m.nest ? 1.15 : 1);
  }

  // ---------- toxic pools (the Hisser leaves them behind; they sting and poison while you stand in them) ----------
  const pools = [];
  function addPool(x, y, z, dmg) {
    if (pools.length >= 4) disposeWeb(pools.shift());
    const mat = new THREE.MeshBasicMaterial({ color: 0x8aff3a, transparent: true, opacity: 0.4, side: THREE.DoubleSide, depthWrite: false });
    const disc = new THREE.Mesh(new THREE.CircleGeometry(2, 16), mat); disc.rotation.x = -Math.PI / 2; disc.position.set(x, y + 0.05, z); scene.add(disc);
    pools.push({ x, y, z, r: 2, t: 6, mesh: disc, dmg, hitT: 0.5 });
  }
  function tickPools(dt) {
    const p = G.player;
    for (const q of pools) {
      q.t -= dt; q.mesh.material.opacity = Math.min(0.4, q.t * 0.25);
      if (Math.random() < (fast() ? 0.1 : 0.3)) puff(q.x + rand(-1.5, 1.5), q.y + 0.3, q.z + rand(-1.5, 1.5), "totemGreen");
      const inside = Math.hypot(p.pos.x - q.x, p.pos.z - q.z) < q.r && Math.abs(p.pos.y - q.y) < 2;
      if (inside && ents.targetable() && !warded(p.pos.x, p.pos.z) && (q.hitT -= dt) <= 0) {
        q.hitT = 1; ents.ctx.hurtPlayer(q.dmg, "You stood in a toxic pool. Step out of the green puddles!", null); ents.ctx.effect("poison", 2);
        tip("pool", "Toxic pools sting and poison you. Step out of the green puddles; they fade after a few seconds.", "bad");
      }
    }
    for (const q of pools.filter(o => o.t <= 0)) disposeWeb(q);
    for (let i = pools.length - 1; i >= 0; i--) if (pools[i].t <= 0) pools.splice(i, 1);
  }
  function clearPools() { for (const q of pools) disposeWeb(q); pools.length = 0; }
  const hazOwnedGone = e => { for (const h of ents.hazards || []) if (h.owner === e) h.gone = true; };

  // ---------- the Forsaken Hisser: stalks, circles, bursts, leaps, and goes out with a bang you can escape ----------
  function thinkHisser(E, e, d, dmgMul) {
    const m = e.mut, p = G.player, step = Math.min(0.6, e.age - (m.lastAge ?? e.age)); m.lastAge = e.age;
    m.t += step; for (const k in m.cd) m.cd[k] -= step;
    if (Math.random() < (fast() ? 0.08 : 0.25)) puff(e.pos.x + rand(-0.6, 0.6), e.pos.y + rand(2.5, 3.5), e.pos.z + rand(-0.6, 0.6), "totemGreen");   // dripping toxins
    if (m.st === "unstable") {   // the final blast, in three rings: run, or smother the core
      e.goal = null; e.vel.x = e.vel.z = 0;
      if ((m.tickT = (m.tickT || 0) - step) <= 0) { m.tickT = Math.max(0.12, 0.5 - m.t * 0.12); say("tick", d); }
      if (m.t >= m.dur) {
        m.boom = true; say("boom", d); say("boom", d);
        for (let i = 0; i < (fast() ? 8 : 20); i++) { const a = Math.random() * Math.PI * 2, r = rand(0, 7); puff(e.pos.x + Math.cos(a) * r, e.pos.y + rand(0.2, 3), e.pos.z + Math.sin(a) * r, i % 2 ? "totemGreen" : "poof"); }
        addPool(e.pos.x, e.pos.y, e.pos.z, 1 * dmgMul);
        e.iframes = 0; ents.damage(e, 9999, "player");
      }
      return;
    }
    if (m.st === "stagger") { e.goal = null; if (m.t >= m.dur) setSt(e, "chase"); return; }
    if (m.st === "leap") {
      if ((m.t > 0.25 && e.onGround) || m.t > 1.4) {
        e.vel.x = e.vel.z = 0; say("boom", d);
        for (let i = 0; i < (fast() ? 4 : 10); i++) puff(e.pos.x + rand(-2.5, 2.5), e.pos.y + rand(0.2, 1.5), e.pos.z + rand(-2.5, 2.5), "totemGreen");
        addPool(e.pos.x, e.pos.y, e.pos.z, 1 * dmgMul); setSt(e, "recover", 1.1);
      }
      return;
    }
    if (awareness(E, e, d, step)) return;
    if (m.st === "recover" || m.st === "strike") { e.goal = null; if (m.t >= m.dur) setSt(e, "chase"); return; }
    if (m.st === "retreat") {   // backs off with a dim core while it recharges
      const dx = e.pos.x - p.pos.x, dz = e.pos.z - p.pos.z, l = Math.hypot(dx, dz) || 1;
      e.goal = { x: e.pos.x + dx / l * 4, z: e.pos.z + dz / l * 4, speed: e.def.speed }; e.path = null; face(e, p.pos.x, p.pos.z);
      if (m.t >= m.dur) setSt(e, "chase"); return;
    }
    if (m.st === "wind") {
      e.goal = null; if (m.atk !== "leap") face(e, p.pos.x, p.pos.z);
      if (warded(p.pos.x, p.pos.z)) { hazOwnedGone(e); setSt(e, "recover", 0.6); return; }
      if (m.t < m.dur) return;
      if (m.atk === "burst") {
        say("boom", d); for (let i = 0; i < (fast() ? 6 : 14); i++) { const a = i / 14 * Math.PI * 2; puff(e.pos.x + Math.cos(a) * 3.5, e.pos.y + 0.6, e.pos.z + Math.sin(a) * 3.5, "totemGreen"); }
        addPool(e.pos.x, e.pos.y, e.pos.z, 1 * dmgMul); m.cd.burst = 7; setSt(e, "retreat", 2.2);
        tip("hisserRetreat", "It's backing off to recharge (its core is dim). Chase it down and hit it!", "good"); return;
      }
      if (m.atk === "leap") {
        const at = m.leapAt, dx = at.x - e.pos.x, dz = at.z - e.pos.z, l = Math.hypot(dx, dz) || 1, v = Math.min(13, l / 0.65);
        e.vel.x = dx / l * v; e.vel.z = dz / l * v; e.vel.y = 8; e.goal = null; e.path = null; e.knock = 0.8;
        say("hiss", d); m.cd.leap = 8; setSt(e, "leap", 1.4); return;
      }
      if (m.atk === "blasts") {   // small blasts ring around you, one after another
        for (let k = 0; k < 4; k++) { const a = Math.random() * Math.PI * 2, r = k ? rand(2.2, 4.5) : 0; ents.addHazard(p.pos.x + Math.cos(a) * r, p.pos.y, p.pos.z + Math.sin(a) * r, 1.8, 1 + k * 0.3, 4, "A toxic blast went off under you. Step out of the green rings!", 0, { owner: e, color: 0x8aff3a, particle: "totemGreen", statusEffect: null }); }
        say("fizz", d); m.cd.blasts = 7; setSt(e, "recover", 0.7); return;
      }
    }
    const wind = (atk, t) => { setSt(e, "wind", t * (reduced() ? 1.35 : 1)); m.atk = atk; e.goal = null; e.path = null; m.coreDmg = 0; };
    const flat = Math.abs(p.pos.y - e.pos.y) < 2.5, sees = E.canSeePlayer(e);
    if (d < 5 && flat && m.cd.burst <= 0) {
      wind("burst", 1); say("fuse", d);
      ents.addHazard(e.pos.x, e.pos.y, e.pos.z, 4.5, m.dur + 0.1, 5, "The Forsaken Hisser's toxic burst hit you. When its core swells, get away, or hit it to crack the core!", 0, { owner: e, color: 0x8aff3a, particle: "totemGreen", statusEffect: "poison" });
      return;
    }
    if (d > 6 && d < 14 && flat && sees && e.onGround && m.cd.leap <= 0) {
      wind("leap", 1); face(e, p.pos.x, p.pos.z); say("fuse", d); m.leapAt = { x: p.pos.x, y: p.pos.y, z: p.pos.z };
      ents.addHazard(p.pos.x, p.pos.y, p.pos.z, 3.5, m.dur + 0.6, 7, "The Forsaken Hisser landed on you with a blast. When a green ring appears under you, move!", 0, { owner: e, color: 0x8aff3a, particle: "totemGreen", statusEffect: null });
      return;
    }
    if (d > 5 && d < 16 && sees && m.cd.blasts <= 0) { wind("blasts", 0.8); say("fuse", d); return; }
    // stalk and circle: close in from far away, keep a little room up close
    if (d > 11 || !sees) { E.chase(e, p.pos); return; }
    const ax = (p.pos.x - e.pos.x) / d, az = (p.pos.z - e.pos.z) / d, want = d < 6 ? -1 : 0, side = Math.sin(e.age * 0.5) > 0 ? 1 : -1;
    e.goal = { x: e.pos.x + ax * want * 2 - az * side * 2, z: e.pos.z + az * want * 2 + ax * side * 2, speed: e.def.speed * 0.9 }; e.path = null; face(e, p.pos.x, p.pos.z);
  }

  // ---------- the Forsaken Voidwalker: teleports (with a warning), four arms, gravity, and shadow clones ----------
  function blinkTo(e, spot, delay) { if (!spot) return false; e.mut.blink = { x: spot.x, y: spot.y, z: spot.z, t: delay }; setSt(e, "blink", delay); e.goal = null; e.path = null; return true; }
  function tickBlink(e, step, d) {   // purple sparks gather where it's about to appear, then it's there
    const b = e.mut.blink; if (!b) return false;
    b.t -= step; for (let i = 0; i < (fast() ? 1 : 3); i++) puff(b.x + rand(-0.6, 0.6), b.y + rand(0.2, 5), b.z + rand(-0.6, 0.6), "portal");
    if (b.t > 0) return false;
    for (let i = 0; i < (fast() ? 3 : 8); i++) puff(e.pos.x + rand(-0.6, 0.6), e.pos.y + rand(0.2, 5), e.pos.z + rand(-0.6, 0.6), "portal");
    Object.assign(e.pos, { x: b.x, y: b.y, z: b.z }); e.vel.x = e.vel.y = e.vel.z = 0; e.goal = null; e.path = null; e.mut.blink = null;
    say("warp", d); return true;
  }
  function spawnClones(e, n) {
    const have = ents.list.filter(o => o.def.clone && o.mutCaller === e && !o.dead && !o.gone).length;
    for (let k = 0; k < Math.min(n, 2 - have); k++) {
      const s = findSpot(e.pos.x, e.pos.z, 3, 6, { minFromPlayer: 4, tall: 6 }); if (!s) continue;
      const c = ents.add("fs_shadow", s.x, s.y, s.z, {}); if (!c) continue;
      c.mutCaller = e; c.mut = { st: "chase", t: 0, cd: { strike: 1 }, life: 12, lost: 0, far: 0, howls: 9, home: { x: s.x, z: s.z } };
      for (let i = 0; i < 8; i++) puff(s.x + rand(-0.5, 0.5), s.y + rand(0, 5), s.z + rand(-0.5, 0.5), "portal");
    }
  }
  function thinkVoidwalker(E, e, d, dmgMul) {
    const m = e.mut, p = G.player, step = Math.min(0.6, e.age - (m.lastAge ?? e.age)); m.lastAge = e.age;
    m.t += step; const cdk = m.enrageT > 0 ? 1.6 : 1; for (const k in m.cd) m.cd[k] -= step * cdk;
    if (m.enrageT > 0) m.enrageT -= step;
    if (Math.random() < (fast() ? 0.1 : 0.3)) puff(e.pos.x + rand(-1, 1), e.pos.y + rand(0.5, 6), e.pos.z + rand(-1, 1), "portal");   // drifting void sparks
    if (m.st === "stagger") { e.goal = null; if (m.t >= m.dur) setSt(e, "chase"); return; }
    if (m.st === "blink") { e.goal = null; if (tickBlink(e, step, d)) { face(e, p.pos.x, p.pos.z); if (m.after === "slash") { m.after = null; setSt(e, "strike", 0.5); say("slash", d); } else setSt(e, "chase"); } return; }
    if (awareness(E, e, d, step)) return;
    if (m.st === "recover" || m.st === "strike") { e.goal = null; if (m.t >= m.dur) setSt(e, "chase"); return; }
    if (m.st === "tired") { e.goal = null; if (Math.random() < 0.3) puff(e.pos.x, e.pos.y + 5.5, e.pos.z, "pale"); if (m.t >= m.dur) setSt(e, "chase"); return; }
    if (m.st === "pull") {   // its arms spread and the void drags you toward it
      e.goal = null; face(e, p.pos.x, p.pos.z);
      if (Math.random() < 0.6) puff(p.pos.x, p.pos.y + 1, p.pos.z, "portal");
      if (d > 3 && E.targetable() && !warded(p.pos.x, p.pos.z)) {   // you slide toward it (only through open space)
        const dx = e.pos.x - p.pos.x, dz = e.pos.z - p.pos.z, l = Math.hypot(dx, dz) || 1, mv = Math.min(0.8, d - 3), w = G.world;
        const nx = p.pos.x + dx / l * mv, nz = p.pos.z + dz / l * mv, open = y => !SOLID[w.id(Math.floor(nx), Math.floor(p.pos.y + y), Math.floor(nz))];
        if (open(0.1) && open(1) && open(1.7) && !warded(nx, nz)) { p.pos.x = nx; p.pos.z = nz; }
      }
      if (m.t >= m.dur) {
        ents.addHazard(e.pos.x, e.pos.y, e.pos.z, 4.6, reduced() ? 1.35 : 1, 6, "The Forsaken Voidwalker's energy burst hit you. After it pulls you in, run out of the purple ring!", 0, { owner: e, color: 0xc060ff, particle: "portal", statusEffect: null });
        say("rise", d); setSt(e, "burst", reduced() ? 1.45 : 1.1);
      }
      return;
    }
    if (m.st === "burst") { e.goal = null; if (m.t >= m.dur) { say("warp", d); setSt(e, "tired", 2.2); m.cd.pull = 11; tip("voidTired", "The Forsaken Voidwalker is worn out after its gravity pull. Hit it now (extra damage)!", "good"); } return; }
    if (m.st === "wind") {
      e.goal = null; face(e, p.pos.x, p.pos.z);
      if (warded(p.pos.x, p.pos.z)) { hazOwnedGone(e); setSt(e, "recover", 0.6); return; }
      if (m.t < m.dur) return;
      if (m.atk === "strike") {
        if (d < 4.4 && Math.abs(p.pos.y - e.pos.y) < 3 && E.targetable()) { E.ctx.hurtPlayer(5 * dmgMul, "The Forsaken Voidwalker's four arms struck you. When all its arms rise, back away!", e); const dx = p.pos.x - e.pos.x, dz = p.pos.z - e.pos.z, l = Math.hypot(dx, dz) || 1; E.ctx.push(dx / l * 7, 4, dz / l * 7); }
        say("slash", d); m.cd.strike = 2.2; setSt(e, "strike", 0.45); return;
      }
      if (m.atk === "slash") {   // it vanishes and appears at the edge of the purple ring it marked
        const at = m.slashAt, dx = e.pos.x - at.x, dz = e.pos.z - at.z, l = Math.hypot(dx, dz) || 1;
        const y = G.world.surfaceY(Math.floor(at.x + dx / l * 1.6), Math.floor(at.z + dz / l * 1.6)) + 1;
        m.after = "slash"; m.cd.slash = 7; blinkTo(e, { x: at.x + dx / l * 1.6, y: Math.abs(y - at.y) < 3 ? y : at.y, z: at.z + dz / l * 1.6 }, 0.25); return;
      }
      if (m.atk === "pull") { say("rise", d); m.tug = 0; setSt(e, "pull", 1); return; }
      if (m.atk === "call") { spawnClones(e, 2); say("warp", d); setSt(e, "recover", 0.6); return; }
    }
    const wind = (atk, t) => { setSt(e, "wind", t * (reduced() ? 1.35 : 1)); m.atk = atk; e.goal = null; e.path = null; };
    const sees = E.canSeePlayer(e);
    if (callCheck(e)) { wind("call", 1.2); say("scream", d); UI.toast("The Forsaken Voidwalker splits its shadow! The see-through ones are clones: the solid one is real.", "bad"); return; }
    if (d < 3.8 && m.cd.strike <= 0) { wind("strike", 0.7); say("rise", d); return; }
    if (sees && d > 5 && d < 14 && m.cd.pull <= 0) { wind("pull", 0.8); say("scream", d); return; }
    if (sees && d < 18 && m.cd.slash <= 0) {
      wind("slash", 1); m.slashAt = { x: p.pos.x, y: p.pos.y, z: p.pos.z };
      ents.addHazard(p.pos.x, p.pos.y, p.pos.z, 2.4, m.dur + 0.3, 6, "The Forsaken Voidwalker teleported in and slashed you. When a purple ring appears under you, move out!", 0, { owner: e, color: 0xc060ff, particle: "portal", statusEffect: null });
      return;
    }
    if ((d > 14 || !sees) && m.cd.blink <= 0) {   // stalking: it reappears behind you (watch for purple sparks)
      const bx = p.pos.x + Math.sin(p.yaw) * 7, bz = p.pos.z + Math.cos(p.yaw) * 7;
      if (blinkTo(e, findSpot(bx, bz, 0, 3, { minFromPlayer: 4, tall: 6 }), reduced() ? 0.9 : 0.6)) { m.cd.blink = 6; return; }
    }
    E.chase(e, p.pos);
    if (e.goal) e.goal.speed = e.def.speed * (m.enrageT > 0 ? 1.3 : 1);
  }
  function thinkShadow(E, e, d, dmgMul) {   // a shadow clone: weak, fades after a while or when the real one falls
    const m = e.mut, p = G.player, step = Math.min(0.6, e.age - (m.lastAge ?? e.age)); m.lastAge = e.age;
    m.t += step; m.life -= step; for (const k in m.cd) m.cd[k] -= step;
    const o = e.mutCaller;
    if (m.life <= 0 || !o || o.gone || o.dead) { for (let i = 0; i < 6; i++) puff(e.pos.x + rand(-0.5, 0.5), e.pos.y + rand(0, 5), e.pos.z + rand(-0.5, 0.5), "portal"); e.gone = true; return; }
    if (m.st === "wind") { e.goal = null; face(e, p.pos.x, p.pos.z); if (m.t >= m.dur) { if (d < 4 && E.targetable() && !warded(p.pos.x, p.pos.z)) E.ctx.hurtPlayer(2 * dmgMul, "A shadow clone struck you. Clones are see-through; the solid one is the real Voidwalker.", e); m.cd.strike = 2; setSt(e, "recover", 0.4); } return; }
    if (m.st === "recover") { e.goal = null; if (m.t >= m.dur) setSt(e, "chase"); return; }
    if (warded(p.pos.x, p.pos.z) || !E.targetable()) { e.goal = null; return; }
    if (d < 3.4 && m.cd.strike <= 0) { setSt(e, "wind", 0.7); m.atk = "strike"; return; }
    E.chase(e, p.pos);
  }

  // ---------- damage rules ----------
  MU.hit = (E, e, n, attacker) => {
    const m = e.mut; if (!m) return n;
    if (attacker === "explosion") n *= 0.5;
    if (m.st === "stagger") n *= 1.5;
    if (m.st === "reload") n *= 1.3;   // a Rattler caught reloading
    if (m.st === "brood") {   // hurting a brooding Skitter enough stops the spiderlings
      m.broodDmg = (m.broodDmg || 0) + n;
      if (m.broodDmg >= e.mutHp * 0.08) { setSt(e, "stagger", 1.2); UI.toast("You broke its focus! No spiderlings this time.", "good"); }
    }
    if (m.st === "unstable") {   // a Hisser about to blow: enough damage smothers its core
      if (m.boom) return e.hp + 1;
      m.defuse = (m.defuse || 0) + n; e.iframes = 0.35; e.hurtT = 0.3;
      if (m.defuse >= e.mutHp * 0.12) { m.defused = true; hazOwnedGone(e); UI.toast("You smothered its core! The Forsaken Hisser fizzles out.", "good"); return e.hp + 1; }
      return 0;
    }
    if (m.st === "wind" && m.atk === "burst") {   // cracking the core during the wind-up stops the burst
      m.coreDmg = (m.coreDmg || 0) + n;
      if (m.coreDmg >= e.mutHp * 0.06) { hazOwnedGone(e); setSt(e, "stagger", 1.4); UI.toast("You cracked its core! The burst fizzles.", "good"); }
    }
    if (m.st === "tired") n *= 1.3;   // a Voidwalker worn out after its gravity pull
    if (e.def.mutant === "voidwalker" && m.st === "chase" && !m.blink && m.cd.blink <= 0) {   // sometimes it teleports out of the way
      const shot = !!(attacker && attacker.projectile), p = G.player, a = Math.random() * Math.PI * 2;
      if (Math.random() < (shot ? 0.35 : 0.15) && blinkTo(e, findSpot(p.pos.x + Math.cos(a) * 7, p.pos.z + Math.sin(a) * 7, 0, 3, { minFromPlayer: 4, tall: 6 }), 0.35)) {
        m.cd.blink = 4;
        if (shot) { tip("voidDodge", "It teleported away from your arrow! Arrows only land some of the time.", ""); return 0; }
      }
    }
    m.lastHurt = G.clock;
    if (m.regen) { m.regen = false; m.noRegen = G.clock + 5; UI.toast("You stopped it healing!", "good"); }
    if (m.st === "idle" && attacker === "player") { setSt(e, "notice"); say(NOTICE[e.def.mutant] || "clack", E.dist(e)); }
    say("hurt", E.dist(e));
    if (m.st === "down") {   // hitting it while it's down: enough damage and it stays down for good
      m.downDmg = (m.downDmg || 0) + n; e.iframes = 0.4; e.hurtT = 0.3;
      if (m.downDmg >= e.mutHp * 0.15) { m.finished = true; UI.toast("You kept it down! The Forsaken Groaner is finished.", "good"); return e.hp + 1; }
      return 0;
    }
    if (m.st === "rise") return n * 0.5;
    if (e.hp - n <= 0 && !m.revived && e.def.comeback) {   // its one comeback
      m.revived = true; setSt(e, "down", reduced() ? 6 : 5); m.downDmg = 0; e.goal = null;
      UI.toast("The Forsaken Groaner collapses... but its heart is still beating! Hit it hard before it gets back up!", "bad");
      return Math.max(0, e.hp - 1);
    }
    if (e.hp - n <= 0 && e.def.finale && !m.finale) {   // the Hisser's last blast: three growing rings, so you can always get away
      m.finale = true; setSt(e, "unstable", reduced() ? 4 : 3.3); m.defuse = 0; e.goal = null; hazOwnedGone(e);
      const R = reduced() ? 1.2 : 1;
      for (const [r, t, dmg] of [[3, 1.1, 2], [5.5, 2.1, 3], [8, 3.1, 4]]) ents.addHazard(e.pos.x, e.pos.y, e.pos.z, r, t * R, dmg, "The Forsaken Hisser's final blast caught you. When it starts flashing, run past the last green ring!", 0, { owner: e, color: 0x8aff3a, particle: "totemGreen", statusEffect: null });
      UI.toast("The Forsaken Hisser is about to blow! Run past the green rings, or keep hitting it to smother its core!", "bad");
      return Math.max(0, e.hp - 1);
    }
    if (e.def.enrage && !m.enraged && (e.hp - n) / e.mutHp < (e.def.enrageAt || 0.5)) { m.enraged = true; m.enrageT = 8; const vw = e.def.mutant === "voidwalker"; say(vw ? "scream" : "roar", E.dist(e)); if (vw) for (let i = 0; i < 12; i++) puff(e.pos.x + rand(-1.5, 1.5), e.pos.y + rand(0, 6), e.pos.z + rand(-1.5, 1.5), "portal"); UI.toast(vw ? "The Forsaken Voidwalker is enraged! Purple light pours from it: it attacks and teleports faster for a few seconds." : "The Forsaken Groaner is enraged! It moves faster for a few seconds. Keep your distance.", "bad"); }
    return n;
  };
  MU.killed = (E, e, attacker) => {
    if (e.def.clone) { e.dead = 0.9; say("warp", E.dist(e)); return; }   // a shadow clone just fades
    const s = data(), kind = e.def.mutant;
    e.dead = 2.6; say("die", E.dist(e));
    if (attacker === "player" || e.mut?.finished) {
      s.kills[kind] = (s.kills[kind] || 0) + 1;
      if (e.mut?.enc) s.enc[e.mut.enc] = { done: true, at: Date.now() };
      UI.toast(`You defeated the ${NAMES[kind]}!${e.trophy ? " It left a trophy behind." : ""}`, "good");
      if (G.adv) G.adv("mutant", kind);
    }
    for (const o of ents.list) if (o.mutCaller === e && !o.dead) { if (o.def.clone) o.gone = true; else o.mutCaller = null; }   // clones vanish with it
  };

  // ---------- where and when they appear ----------
  const ENCOUNTERS = [
    { id: "village-brute", kind: "groaner", at: "village", trigger: 26, near: [8, 14] },
    { id: "tower-archer", kind: "rattler", at: "tower", trigger: 28, near: [10, 16] },
    { id: "grove-nest", kind: "skitter", at: "forest", trigger: 24, near: [6, 12] },
    { id: "mine-nest", kind: "skitter", at: "mine", trigger: 22, near: [6, 11] },
    { id: "outpost-lab", kind: "hisser", at: "outpost", trigger: 26, near: [9, 15] },
    { id: "citadel-watch", kind: "voidwalker", at: "citadel", trigger: 40, near: [24, 32], tall: 6 },
    ...REACHES.map(a => ({ id: "reach-" + a.key, kind: a.kind, at: a, trigger: a.r + 10, near: [3, a.r - 3], tall: a.kind === "voidwalker" ? 6 : 5 }))
  ];
  let wasIn = false, lastWorld = null, ambientT = MUTANT_CONFIG.ambientEvery;
  MU.tick = dt => {
    const inFw = G.dim === "forsaken" && !!(F.template && F.template());
    if (G.world !== lastWorld) { lastWorld = G.world; wasIn = false; clearFx(); }   // a new world (or a reload): no leftover webs, pools, or flying bits   // a different world (or a reload) counts as a fresh arrival
    if (!inFw) { if (wasIn) { wasIn = false; } if (fx.length || webs.length || pools.length || webbedT > 0) clearFx(); return; }
    const s = data(), p = G.player;
    if (!wasIn) { registerNotes(); wasIn = true; s.grace = (s.visited ? MUTANT_CONFIG.graceReturn : MUTANT_CONFIG.graceFirst); s.visited = true; ambientT = MUTANT_CONFIG.ambientEvery; }
    if (G.state !== "play") return;
    tickFx(dt); tickWebs(dt); tickPools(dt); tickReaches(dt);
    if (G.respawnGuard > 0) s.grace = Math.max(s.grace || 0, 20);   // a quiet moment after you wake up from fainting
    s.grace = Math.max(0, (s.grace || 0) - dt);
    const list = alive();
    // far-away mutants slip back into the mist (they'll be back another time)
    for (const e of list) {
      const d = Math.hypot(e.pos.x - p.pos.x, e.pos.z - p.pos.z);
      e.mut.far = d > MUTANT_CONFIG.despawnFar ? e.mut.far + dt : 0;
      if (e.mut.far > MUTANT_CONFIG.despawnAfter) { e.gone = true; for (const o of ents.list) if (o.mutCaller === e) o.gone = true; }
    }
    if (F.arenaPhase && F.arenaPhase() > 0 && list.length) for (const e of list) { e.gone = true; puff(e.pos.x, e.pos.y + 2, e.pos.z, "poof"); for (const o of ents.list) if (o.mutCaller === e) o.gone = true; }   // Herobrine's own fight clears the field
    const often = G.settings.fwMutants || "normal";   // Settings: Forsaken Mutants (normal / rare / off)
    if (often === "off") { for (const e of list) e.gone = true; for (const o of ents.list) if (o.mutCaller && !o.mutCaller.dead) o.gone = true; return; }
    if (s.grace > 0 || G.creative || G.spectator || G.wset.difficulty === "peaceful") return;
    const st = F.state && F.state();
    if (st === "hunting" || st === "confrontation" || (F.arenaPhase && F.arenaPhase() > 0)) return;   // never on top of Herobrine's own scares
    if (list.length >= MUTANT_CONFIG.maxAlive || warded(p.pos.x, p.pos.z)) return;
    const tpl = F.template(), L = key => tpl.meta.landmarks.find(l => l.key === key);
    for (const enc of ENCOUNTERS) {
      if (s.enc[enc.id] && s.enc[enc.id].done) continue;
      const lm = typeof enc.at === "string" ? L(enc.at) : enc.at; if (!lm || Math.hypot(p.pos.x - lm.x, p.pos.z - lm.z) > enc.trigger) continue;
      const spot = findSpot(lm.x, lm.z, enc.near[0], enc.near[1], { minFromPlayer: 9, tall: enc.tall });
      if (spot && spawn(enc.kind, spot, { enc: enc.id })) return;
    }
    if ((ambientT -= dt) > 0) return;
    ambientT = MUTANT_CONFIG.ambientEvery;
    if (Math.random() > MUTANT_CONFIG.ambientChance * (often === "rare" ? 0.33 : 1)) return;
    const spot = findSpot(p.pos.x, p.pos.z, 24, 34, { minFromPlayer: 22, tall: 6 });
    if (!spot) return;
    let best = null, bd = 60;   // a wandering mutant belongs to the nearest haunt; far from all of them, any kind
    for (const enc of ENCOUNTERS) { const lm = typeof enc.at === "string" ? L(enc.at) : enc.at; if (!lm) continue; const d = Math.hypot(spot.x - lm.x, spot.z - lm.z); if (d < bd) { bd = d; best = enc.kind; } }
    const kinds = ["groaner", "rattler", "skitter", "hisser", "voidwalker"];
    spawn(best || kinds[Math.floor(Math.random() * kinds.length)], spot);
  };
  MU.clear = () => { for (const e of alive()) e.gone = true; clearFx(); };
  MU.bossInfo = () => {
    const p = G.player; let best = null, bd = 30;
    for (const e of alive()) { if (!e.mut || e.mut.st === "idle") continue; const d = Math.hypot(e.pos.x - p.pos.x, e.pos.z - p.pos.z); if (d < bd) { bd = d; best = e; } }
    if (!best) return null;
    const m = best.mut, note = m.st === "down" ? " • DOWN: hit it hard!" : m.st === "stagger" ? " • Dazed!" : m.st === "reload" ? " • Reloading: hit it!" : m.st === "brood" ? " • Brooding: hit it to stop the eggs!" : m.st === "unstable" ? " • ABOUT TO BLOW: run, or hit it!" : m.st === "tired" ? " • Worn out: hit it!" : m.st === "retreat" && best.def.mutant === "hisser" ? " • Recharging" : m.regen ? " • Healing" : m.enrageT > 0 ? " • Enraged" : m.nest ? " • Guarding its nest" : "";
    return { e: best, label: best.def.name + note, frac: best.hp / best.mutHp, mutant: true };
  };
  // test helpers (Creative test controls and browser tests)
  MU._test = {
    spawn: (kind = "groaner", r = 12) => { const p = G.player, a = G.player.yaw; const spot = findSpot(p.pos.x - Math.sin(a) * r, p.pos.z - Math.cos(a) * r, 0, 4, { minFromPlayer: 4 }) || { x: p.pos.x - Math.sin(a) * r, y: p.pos.y, z: p.pos.z - Math.cos(a) * r }; return spawn(kind, spot); },
    alive, ENCOUNTERS, ambientNow: () => { ambientT = 0; }, fx, webs, webbed: () => webbedT
  };

  // ---------- the Outer Reaches: discovery, lore notes, and faint traces of Herobrine's power ----------
  MU.prepareReaches = (gen, data) => {   // called by main.js before the Forsaken World's land is made
    if (!data.reachesV) {   // first visit since this update: ring chunks you already changed keep their old shape
      const lo = -5, hi = 4;   // the packaged map's chunks (−80…79)
      data.reachesSkip = Object.keys(data.mods || {}).filter(k => { const [cx, cz] = k.split(",").map(Number); return cx < lo || cx > hi || cz < lo || cz > hi; });
      data.reachesV = REACHES_VERSION;
    }
    gen.reaches = applyReaches; gen.reachesSkip = new Set(data.reachesSkip || []);
  };
  for (const [k, n] of Object.entries(REACH_NOTES)) if (!NOTES[k]) NOTES[k] = n;
  function registerNotes() {
    const fw = G.story.fw || (G.story.fw = {}), ex = fw.extraNotes || (fw.extraNotes = {});
    for (const n of reachNotes()) ex[n.pos.x + "," + n.pos.y + "," + n.pos.z] = n.key;
  }
  const TRACE = { groaner: "totemGreen", rattler: "pale", skitter: "spark", hisser: "totemGreen", voidwalker: "portal" };
  function tickReaches(dt) {
    const s = data(), p = G.player; s.reach = s.reach || {};
    for (const a of REACHES) {
      const d = Math.hypot(p.pos.x - a.x, p.pos.z - a.z);
      if (d < a.r + 4 && !s.reach[a.key]) { s.reach[a.key] = Date.now(); UI.toast(`Discovered: ${a.name}`, "good"); if (G.adv) G.adv("reach", a.key); }
      if (d < 40 && Math.random() < dt * (fast() ? 1 : 3)) {   // faint traces of his power drift over each place
        const t = Math.random() * Math.PI * 2, r = Math.random() * a.r, y = G.world.surfaceY(Math.floor(a.x + Math.cos(t) * r), Math.floor(a.z + Math.sin(t) * r));
        puff(a.x + Math.cos(t) * r, y + 1.2 + Math.random() * 2, a.z + Math.sin(t) * r, TRACE[a.kind]);
      }
    }
  }

  // ---------- the Mutants page in the Forsaken journal ----------
  const ABIL = {
    groaner: { swing: "Heavy punch (raised fist)", slam: "Ground slam and shockwave (both arms up)", charge: "Charge (crouches low)", dash: "Charge (crouches low)", howl: "Calls ordinary Groaners", regen: "Heals when left alone", down: "Gets back up once" },
    rattler: { shot: "Aimed arrows", volley: "Rapid volley, then a reload", reload: "Rapid volley, then a reload", bomb: "Exploding arrows (pale ring)", club: "Bone blade up close", call: "Calls ordinary Rattlers" },
    skitter: { bite: "Venom bite (rears up)", web: "Web shots and sticky patches", leap: "Leap (red ring)", brood: "Spiderlings (curls up and glows)", nest: "Stronger near its nest" },
    hisser: { burst: "Toxic burst (core swells)", leap: "Explosive leap (green ring)", blasts: "Ring blasts", retreat: "Backs off to recharge", unstable: "Final explosion in three rings" },
    voidwalker: { strike: "Four-arm strike", slash: "Teleport slash (purple ring)", pull: "Gravity pull, then a burst", blink: "Teleports (purple sparks first)", call: "Shadow clones (see-through)", enrage: "Rage" }
  };
  const BASE = { groaner: "Groaner", rattler: "Rattler", skitter: "Skitter", hisser: "Hisser", voidwalker: "Voidwalker" };
  const REWARD = {
    groaner: [I.CORRUPTED_FLESH, I.FORSAKEN_SHARD, I.GROANER_TROPHY], rattler: [I.FORSAKEN_BONE, I.BOW_LIMB, I.RATTLER_TROPHY], skitter: [I.CORRUPTED_SILK, I.VENOM_FANG, I.SKITTER_TROPHY],
    hisser: [I.VOLATILE_MUTAGEN, I.BLAST_CORE, I.HISSER_TROPHY], voidwalker: [I.VOID_ESSENCE, I.FORSAKEN_PEARL, I.VOIDWALKER_TROPHY]
  };
  const HOME = { groaner: "Hollowmere Village, Wayfarer's Rest", rattler: "the Watchtower, the Hollow Graves", skitter: "Pale Wood Grove, Deepvein Mine, Silkwood Hollow", hisser: "the Research Outpost, the Blight Crater", voidwalker: "the Pale Citadel's outskirts, the Sundered Gate" };
  function noteAbility(e) {   // the journal fills in as you see each attack
    const m = e.mut, kind = e.def.mutant; if (!m || !ABIL[kind]) return;
    const keys = [m.st === "wind" ? m.atk : m.st]; if (m.regen) keys.push("regen"); if (m.nest) keys.push("nest"); if (m.enrageT > 0) keys.push("enrage");
    const s = data(), a = (s.abil = s.abil || {})[kind] || (s.abil[kind] = {});
    for (const k of keys) if (ABIL[kind][k] && !a[k]) a[k] = 1;
  }
  setTrophyHook(e => { const s = data(); (s.trophies = s.trophies || {})[e.def.mutant] = (s.trophies[e.def.mutant] || 0) + 1; if (G.adv) G.adv("fstrophy", e.def.mutant); });
  MU.bestiaryHTML = () => {
    const s = data(), cards = Object.keys(BASE).map(kind => {
      const seen = !!s.seen[kind], kills = s.kills[kind] || 0, a = (s.abil || {})[kind] || {};
      const abil = [...new Set(Object.keys(a).map(k => ABIL[kind][k]))].filter(Boolean);
      const name = seen ? NAMES[kind] : "???";
      const rewards = kills ? REWARD[kind].map(id => `<img src="${iconURL(id)}" alt="" title="${itemDef(id).name}" style="width:20px;height:20px;image-rendering:pixelated;vertical-align:middle;margin-right:2px">`).join("") + (s.trophies && s.trophies[kind] ? " <b style='color:#3a7a1a'>trophy found</b>" : " trophy not found yet") : "Defeat one to learn what it leaves behind.";
      return `<div style="border:2px solid ${seen ? "#556" : "#aaa"};border-radius:8px;padding:8px;background:${kills ? "#eef6e6" : seen ? "#f2f2f6" : "#f6f6f6"}">
        <b>${name}</b>${seen ? ` <span class="note" style="color:#555">(a mutated ${BASE[kind]})</span>` : ""}<br>
        <span class="note" style="color:#444">${seen ? "Haunts: " + HOME[kind] : "Not seen yet."}</span><br>
        <span class="note" style="color:#333">Defeated: ${kills}</span>
        ${seen ? `<ul style="margin:4px 0 4px 18px;padding:0">${abil.length ? abil.map(t => `<li>${t}</li>`).join("") : "<li>Watch it fight to learn its moves.</li>"}</ul>` : ""}
        <div class="note" style="color:#333">${rewards}</div></div>`;
    }).join("");
    const done = Object.keys(BASE).filter(k => s.kills[k]).length;
    return `<div class="fw-mutants" style="margin-top:12px"><h4>Forsaken Mutants (${done}/5 defeated)</h4>
      <p class="note" style="color:#333">Herobrine's five elite servants. Every big attack warns you first, and none of them can follow you into a ward.</p>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:8px">${cards}</div></div>`;
  };
  if (F.journalHTML && !F.journalHTML.mutants) { const base = F.journalHTML; F.journalHTML = () => base() + MU.bestiaryHTML(); F.journalHTML.mutants = true; }

  ents.bossAI = ents.bossAI || {};
  ents.bossAI.mutant = MU.think;
  ents.mutantHit = MU.hit;
  ents.mutantKilled = MU.killed;
  return MU;
}
