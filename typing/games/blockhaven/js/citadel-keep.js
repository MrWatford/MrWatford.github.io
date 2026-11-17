// THE ENDWATCH CITADEL, Stage 3: the Courtyard Battle, the barred keep door, guards in the keep's rooms, and the
// Ancient Tomes (the castle's story). Three waves fill the courtyard once you're inside the walls; when the last falls,
// the bars over the keep door lift. Some rooms hold guards (each room is cleared for good once they're beaten); others
// hold treasure, supplies, or a tome. Creative and Peaceful skip the fighting (the keep door opens as you walk up).
// Saved per castle in story.citadel.spots[i].keep. Guards themselves are never saved.
import { B } from "./blocks.js";
import { CITADEL, inset, toLocal, toWorld, citadelTomes } from "./citadel.js";

const F = CITADEL.ground + 1, F2 = F + 7, KZ1 = 24;
// where courtyard enemies appear (castle-local, ground level); always at least 12 blocks from you
const SPAWNS = [[-33, -15], [33, -15], [-33, 15], [33, 15], [0, -38], [-20, -36], [20, -36], [22, 30], [-31, 26], [36, 0], [-36, 0]];
const WAVES = [
  { name: "the gate guard", list: [["zombie", 4], ["spider", 2]] },
  { name: "the wall archers", list: [["skeleton", 3], ["zombie", 3], ["creeper", 1]] },
  { name: "the Castellan's sworn guard", list: [["vindicator", 3], ["skeleton", 2], ["zombie", 2]] }
];
// guards in the keep's rooms (castle-local x, y, z)
const ROOMS = {
  kitchen: { name: "the kitchens", guards: [["zombie", -15, F, -15], ["zombie", -12, F, -8]] },
  armory: { name: "the armory", guards: [["vindicator", 15, F, -15], ["vindicator", 12, F, -8]] },
  barracks: { name: "the barracks", guards: [["skeleton", -11, F2, -20], ["skeleton", -11, F2, -12], ["zombie", -17, F2, -5]] },
  storage: { name: "the storerooms", guards: [["spider", 15, F2, -16], ["spider", 18, F2, -10]] }
};
// The Ancient Tomes (original writing for Blockhaven)
export const TOMES = {
  hall: { title: "The Founding of Endwatch", text: "Long ago the Builders found a doorway beneath this hill: a ring of twelve stones that opened onto the Hollow, the pale islands at the edge of the world.\n\nThey did not break it. They built over it. Castellan Aldric raised these walls on the island, dug the lake around them, and swore that no one would pass the doorway unready.\n\nTonight the hall is empty, but the tables are still set." },
  seal: { title: "Warning at the Seal", text: "Beneath this floor is the way down to the Hollow.\n\nThe seal answers to the Castellan alone. While he keeps his watch, it will not open for pick or powder.\n\nWhoever would pass must face him in the throne room and prove they are ready." },
  library: { title: "The Keeper of the Library", text: "Every shelf here was copied by hand: maps of the three citadels, songs of the old wars, and the long list of everyone who ever tried the Hollow and came back.\n\nThe list is short.\n\n(Someone has underlined a line near the bottom: \"Not every wall in this room is a wall.\")" },
  lady: { title: "A Letter from Lady Maren", text: "Aldric, you have not slept in three days. The watch can keep itself for one night.\n\nYou built this place to protect people, not to stand guard over a door forever. Come down to supper. The children want to hear the story of the Wyrm again.\n\n— Maren" },
  captain: { title: "The Captain's Log", text: "Day 211. The lake is calm. No travellers on the bridge.\n\nDay 212. The Castellan walked the walls all night again. He says the Hollow is restless.\n\nDay 213. He has ordered the drawbridge raised for good, and the gate barred. We guard a door no one comes to." },
  oath: { title: "The Castellan's Oath", text: "\"I will keep this watch until someone strong enough to face the Hollow comes to relieve me.\"\n\nThat was his promise. He has kept it longer than anyone expected.\n\nIf you mean to go down, go to the throne room. He is waiting to see if you are the one." },
  prison: { title: "The Gaoler's Ledger", text: "Cells one to eight: empty since the war.\n\nThe Castellan ordered the cellar stair kept open, so the guard could reach the lower halls. Mind the darts in the long gallery: they spark before they fire, so watch the walls.\n\nLight the watchfires as you go. A guard who falls wakes by the last one he lit." },
  crypt: { title: "The Honoured Dead", text: "Here rest the knights of Endwatch, who kept the watch before us.\n\nWe lay them in stone with their swords at their sides, and we light candles for them at the turn of the year.\n\nBe quiet in this room." },
  sunken: { title: "The Sunken Library", text: "When the upper library grew too full, the scribes brought the oldest books down here, where it is cool and dry.\n\nThe treasury to the east was emptied long ago, they say. Its floor still shines.\n\nThe bridge beyond it is cracked. Cross it quickly." },
  lava: { title: "A Note Scratched on the Wall", text: "The way out is west, through the old stone door. It only opens from this hall: pull the lever at the far end.\n\nKeep to the walkway. The fire under the floor never goes out." },
  vault: { title: "The Royal Treasury", text: "The crown's treasure, kept safe behind the scholars' shelves.\n\nAldric took nothing from it for himself. He said it belonged to whoever would one day finish his watch.\n\nPerhaps that's you." },
  throne: { title: "The Castellan's Rule", text: "No one passes the Seal who has not faced the Castellan.\n\nHe will test you three ways: the sword, the shield, and the fury of a guardian who will not give up. Watch his blade rise before it falls. Strike when his shield is down. If he charges, step aside: the walls do not.\n\nWhen he kneels, the way is yours." },
  three: { title: "The Three Citadels", text: "There are three doorways to the Hollow in this land, and over each one stands a citadel like this: an island, a lake, a bridge, and a keep.\n\nAn Eye of the Void will find the nearest. The Explorer's Map shows all three.\n\nEach has its own guardian and its own seal. Beat one, and its way down is open." }
};

export function initCitadelKeep({ G, ents, UI, Sound, saveNow, puff }) {
  const A = {}, live = new Map(), fighting = new Set(), roomFight = new Map();   // (fights in progress are never saved)
  let hud = null, tick = 0, between = 0;
  const diff = () => (G.wset && G.wset.difficulty) || "normal";
  const fightOn = () => !G.creative && !G.spectator && diff() !== "peaceful";
  function castles() {
    const out = [], s = (G.story.citadel && G.story.citadel.spots) || {};
    if (!G.gen || !G.gen.strongholds) return out;
    G.gen.strongholds.forEach((sh, i) => { const d = s[i]; if (d && d.on) out.push({ i, cx: sh.x, cz: sh.z, rot: d.rot, d }); });
    return out;
  }
  const at = (c, u, v) => { const [x, z] = toWorld(u, v, c.rot); return [c.cx + x, c.cz + z]; };
  const local = (c, x, z) => toLocal(x - c.cx, z - c.cz, c.rot);
  const keep = c => c.d.keep || (c.d.keep = { wave: 0, won: false, rooms: {}, read: {} });
  const scale = n => Math.max(1, diff() === "easy" ? Math.round(n * 0.67) : diff() === "hard" ? n + 1 : n);

  // ---------- the keep door ----------
  function openDoor(c, quiet) {
    const w = G.world; let any = false;
    for (let x = -2; x <= 2; x++) for (let y = F; y <= F + 5; y++) { const [wx, wz] = at(c, x, KZ1 + 3); if (w.id(wx, y, wz) === B.PORTCULLIS) { w.set(wx, y, wz, 0); any = true; } }
    if (any && !quiet) { const [x, z] = at(c, 0, KZ1 + 3); Sound.tone(70, 0.9, "sawtooth", 0.12, -25); puff && puff(x + 0.5, F + 2, z + 0.5, "poof"); }
    return any;
  }

  // ---------- the Courtyard Battle ----------
  function inCourtyard(c, p) {
    const [u, v] = local(c, Math.floor(p.x), Math.floor(p.z));
    if (p.y < F - 2 || p.y > F + 6) return false;
    const inKeep = Math.abs(u) <= 25 && v >= -35 && v <= KZ1 + 4;
    return inset(u, v) > 3 && !inKeep;
  }
  function spawnWave(c, n) {
    const p = G.player.pos, w = G.world, list = [];
    for (const [sp, count] of WAVES[n].list) for (let k = 0; k < scale(count); k++) list.push(sp);
    let s = Math.floor(Math.random() * SPAWNS.length);
    for (const sp of list) {
      for (let tries = 0; tries < SPAWNS.length; tries++) {
        const [u, v] = SPAWNS[s++ % SPAWNS.length], [x, z] = at(c, u + Math.floor(Math.random() * 3) - 1, v + Math.floor(Math.random() * 3) - 1);
        if (Math.hypot(x - p.x, z - p.z) < 12 || !w.isLoaded(x, z) || w.id(x, F, z) || w.id(x, F + 1, z)) continue;
        const e = ents.add(sp, x + 0.5, F, z + 0.5); if (!e) break;
        e.persist = false; e.noBurn = true; e.citadelWave = c.i; e.angry = 60; e.alertT = 30;
        live.set("w" + c.i + ":" + live.size + ":" + Math.random(), e);
        break;
      }
    }
    Sound.mob && Sound.mob("groan", 4);
    UI.toast(n === 0 ? `The courtyard stirs. Wave 1 of ${WAVES.length}: ${WAVES[n].name}!` : `Wave ${n + 1} of ${WAVES.length}: ${WAVES[n].name}!`, "bad");
  }
  function courtyard(c) {
    const k = keep(c), p = G.player.pos;
    if (k.won) return null;
    if (!fightOn()) { if (Math.hypot(...(() => { const [x, z] = at(c, 0, KZ1 + 3); return [x - p.x, z - p.z]; })()) < 10 && openDoor(c)) { k.won = true; k.free = true; saveNow && saveNow(false); } return null; }
    const waveLive = [...live.entries()].filter(([key]) => key.startsWith("w" + c.i + ":"));
    for (const [key, e] of waveLive) if (e.dead || e.gone || !ents.list.includes(e)) live.delete(key);
    const left = [...live.keys()].filter(key => key.startsWith("w" + c.i + ":")).length;
    const inside = inCourtyard(c, p);
    if (!inside && left === 0 && !fighting.has(c.i)) return null;
    if (!inside) {   // you left mid-wave: the wave leaves too, and starts over when you come back
      if (Math.hypot(p.x - c.cx, p.z - c.cz) > 80) { for (const [key, e] of [...live]) if (key.startsWith("w" + c.i + ":")) { e.gone = true; live.delete(key); } fighting.delete(c.i); }
      return left ? c : null;
    }
    if (!fighting.has(c.i)) { fighting.add(c.i); between = 0; spawnWave(c, k.wave); return c; }
    if (left === 0) {
      if (between === 0) { between = 3; if (k.wave + 1 >= WAVES.length) { win(c); return null; } k.wave++; UI.toast(`Wave ${k.wave} is beaten. Catch your breath…`, "good"); saveNow && saveNow(false); }
      between -= 0.5; if (between <= 0) { between = 0; spawnWave(c, k.wave); }
    }
    return c;
  }
  function win(c) {
    const k = keep(c); k.won = true; fighting.delete(c.i); k.wonAt = Date.now();
    openDoor(c); Sound.levelUp();
    UI.toast("The courtyard is yours! The bars over the keep door lift.", "good");
    G.adv && G.adv("citadelcourt"); saveNow && saveNow(false);
  }

  // ---------- room guards ----------
  function rooms(c) {
    const k = keep(c), p = G.player.pos, w = G.world;
    for (const [id, R] of Object.entries(ROOMS)) {
      const rk = c.i + ":" + id, fight = roomFight.get(rk), mine = [...live.entries()].filter(([key]) => key.startsWith("r" + rk + ":"));
      for (const [key, e] of mine) {
        if (e.dead) { live.delete(key); if (fight) fight.dead++; }
        else if (e.gone || !ents.list.includes(e)) { live.delete(key); if (fight) fight.lost = true; }   // wandered off: this room's fight starts over
      }
      if (k.rooms[id]) continue;
      if (fight && fight.dead >= fight.n) { roomFight.delete(rk); k.rooms[id] = true; UI.toast(`You cleared ${R.name}.`, "good"); saveNow && saveNow(false); continue; }
      if (fight && fight.lost) { for (const [key, e] of [...live]) if (key.startsWith("r" + rk + ":")) { e.gone = true; live.delete(key); } roomFight.delete(rk); }
      const still = [...live.keys()].filter(key => key.startsWith("r" + rk + ":")).length;
      const near = R.guards.some(([, gx, gy, gz]) => { const [x, z] = at(c, gx, gz); return Math.hypot(x - p.x, z - p.z) < 16 && Math.abs(gy - p.y) < 4; });
      if (!near || still || roomFight.has(rk) || !fightOn()) continue;
      const nf = { n: 0, dead: 0 }; roomFight.set(rk, nf);
      R.guards.forEach(([sp, gx, gy, gz], j) => {
        const [x, z] = at(c, gx, gz); if (w.id(x, gy, z) || w.id(x, gy + 1, z)) return;
        const e = ents.add(sp, x + 0.5, gy, z + 0.5); if (!e) return;
        e.persist = false; e.noBurn = true; e.home = { x: x + 0.5, y: gy, z: z + 0.5 }; e.patrol = { pts: [e.home], i: 0, wait: 0 };
        live.set("r" + rk + ":" + j, e); nf.n++;
      });
    }
  }

  // ---------- the tomes ----------
  A.readTome = hit => {
    let best = null; for (const c of castles()) { const d = Math.hypot(hit.x - c.cx, hit.z - c.cz); if (!best || d < best.d) best = { c, d }; }
    if (!best) return;
    const c = best.c, [u, v] = local(c, hit.x, hit.z), t = citadelTomes().find(q => q.x === u && q.z === v && q.y === hit.y);
    const entry = t && TOMES[t.key]; if (!entry) { UI.toast("The pages are too faded to read."); return; }
    const k = keep(c), first = !k.read[t.key]; k.read[t.key] = true;
    UI.openNote(entry.title, entry.text, first);
    if (first) G.adv && G.adv("citadeltome", t.key);
  };

  // ---------- every half second ----------
  function showHud(c) {
    if (!hud) { hud = document.createElement("div"); hud.id = "courtHud"; hud.style.cssText = "position:absolute;left:50%;top:64px;transform:translateX(-50%);background:rgba(28,16,14,.85);color:#f4e2c8;border:2px solid #8a3a2a;border-radius:16px;padding:6px 14px;font:800 13px system-ui,sans-serif;pointer-events:none;z-index:5"; (document.querySelector(".bh") || document.body).appendChild(hud); }
    if (!c) { hud.hidden = true; return; }
    const k = keep(c), left = [...live.keys()].filter(key => key.startsWith("w" + c.i + ":")).length;
    hud.hidden = false; hud.textContent = `⚔ Courtyard Battle · Wave ${Math.min(k.wave + 1, WAVES.length)} of ${WAVES.length} · ${left} left`;
  }
  A.update = dt => {
    if ((tick -= dt) > 0) return; tick = 0.5;
    if (G.dim !== "overworld" || !G.world) { if (hud) hud.hidden = true; return; }
    let shown = null;
    for (const c of castles()) {
      if (Math.hypot(G.player.pos.x - c.cx, G.player.pos.z - c.cz) > 90) continue;
      const k = keep(c);
      if (k.won) openDoor(c, true);   // (after a reload the bars stay lifted)
      shown = courtyard(c) || shown;
      rooms(c);
    }
    showHud(shown);
  };
  A.reset = () => { for (const e of live.values()) e.gone = true; live.clear(); fighting.clear(); roomFight.clear(); if (hud) hud.hidden = true; between = 0; };
  A.state = i => { const c = castles().find(q => q.i === i); return c ? { ...keep(c), live: [...live.keys()].length } : null; };
  A.win = i => { const c = castles().find(q => q.i === i); if (c) win(c); };   // (testing)
  return A;
}
