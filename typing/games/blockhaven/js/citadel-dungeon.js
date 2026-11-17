// THE ENDWATCH CITADEL, Stage 4: the Forgotten Dungeons and the Royal Treasury.
// Levers (the stone door before the spiral stair; the shortcut hatch to the courtyard), the worn bookshelf that opens
// the hidden treasury, Watchfires (light one and you wake there if you fall down here), dart galleries (vents spark
// before they fire), the collapsing bridge (cracked tiles fall after a moment and grow back later), and ambushes in the
// prison, the crypt, and the lost treasury. Creative skips the fighting and the traps (the levers still work).
// Saved per castle in story.citadel.spots[i].dungeon; ambush fights in progress are never saved.
import { B, I, make, itemDef } from "./blocks.js";
import { CITADEL, toLocal, toWorld } from "./citadel.js";

const G0 = CITADEL.ground, DW = G0 + 1 - 14;   // dungeon walk height (y 22)
const DOOR = { x: 5, z0: -31, z1: -29 }, LEVER_DOOR = [41, -33], LEVER_HATCH = [39, 24], HATCH = [42, 26];
const SHELF = [22, 45, 19], SECRET = [20, 21, 22].flatMap(x => [[x, 43, 21], [x, 44, 21]]), VAULT_CHEST = [24, 44, 24];
const AMBUSH = {
  prison: { name: "the Prison Block", box: [-50, -40, -30, -24], list: [["skeleton", -46, -32], ["skeleton", -34, -32], ["zombie", -42, -31], ["zombie", -38, -33]] },
  crypt: { name: "the Crypt", box: [-50, 14, -30, 32], list: [["zombie", -45, 21], ["zombie", -35, 27], ["zombie", -40, 17], ["skeleton", -46, 30]] },
  treasury: { name: "the Lost Treasury", box: [30, 14, 46, 32], list: [["spider", 34, 28], ["spider", 44, 20], ["spider", 36, 19]] }
};
// dart galleries: vents (castle-local), the way their darts fly, and where you have to be for them to fire
const GALLERIES = [
  { vents: [-18, -14, -10, -6, -2, 2, 6, 10].map(z => [-43, z]), dir: [1, 0], zone: [-42, -23, -40, 13] },
  { vents: [18, 22, 26].map(x => [x, 21]), dir: [0, 1], zone: [23, 22, 27, 24] }   // (the hidden plates are in the floor here)
];
const BRIDGE = { x0: 39, x1: 41, z0: -6, z1: 6, y: DW - 1 };

export function initCitadelDungeon({ G, ents, UI, Sound, saveNow, puff }) {
  const A = {}, live = new Map(), fights = new Map(), cracks = new Map(), vents = new Map();
  let tick = 0;
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
  const dun = c => c.d.dungeon || (c.d.dungeon = { door: false, hatch: false, vault: false, cleared: {}, lit: {}, cp: null });
  const nearest = (x, z) => { let b = null; for (const c of castles()) { const d = Math.hypot(c.cx - x, c.cz - z); if (!b || d < b.d) b = { c, d }; } return b && b.d < 130 ? b.c : null; };
  const w = () => G.world;
  const clear = (c, u, y, v) => { const [x, z] = at(c, u, v); if (w().isLoaded(x, z) && w().id(x, y, z)) w().set(x, y, z, 0); };

  // ---------- the mechanisms ----------
  function openDoor(c, quiet) { for (let z = DOOR.z0; z <= DOOR.z1; z++) for (let y = DW; y <= DW + 2; y++) clear(c, DOOR.x, y, z); if (!quiet) { const [x, z] = at(c, DOOR.x, -30); Sound.tone(60, 1, "sawtooth", 0.1, -20); puff && puff(x + 0.5, DW + 1, z + 0.5, "poof"); } }
  function openHatch(c, quiet) { for (let dz = -2; dz <= 2; dz++) for (let dx = -2; dx <= 2; dx++) if (Math.hypot(dx, dz) <= 2.5) clear(c, HATCH[0] + dx, G0, HATCH[1] + dz); if (!quiet) Sound.tone(90, 0.6, "sawtooth", 0.1, -10); }
  function openShelf(c, quiet) {
    for (const [u, y, v] of SECRET) clear(c, u, y, v);
    const [x, z] = at(c, VAULT_CHEST[0], VAULT_CHEST[2]), key = x + "," + VAULT_CHEST[1] + "," + z, box = w().containers;
    const d = dun(c);
    if (!d.vaultFilled && !box.has(key)) {   // the royal chest (filled once, ever): fine things, but nothing that makes the rest of the game pointless
      const st = (id, n) => { const d = itemDef(id); return { id, n, ...(d && d.tool ? { dur: d.tool.dur } : {}) }; };
      const slots = Array.from({ length: 27 }, () => null);
      [st(I.SKY_SWORD, 1), st(I.GOLDEN_APPLE, 2), st(I.GOLD_INGOT, 10), st(I.SKYSHARD, 4), st(I.TOTEM, 1), st(B.GOLD_BLOCK, 2), st(I.ARROW, 16)].forEach((s, k) => { slots[k * 2] = s; });
      box.set(key, { type: "chest", slots });
    }
    d.vaultFilled = true;
    if (!quiet) { const [px, pz] = at(c, SECRET[0][0], SECRET[0][2]); Sound.tone(70, 1.2, "sawtooth", 0.09, -20); puff && puff(px + 0.5, SECRET[0][1] + 1, pz + 0.5, "crumb"); }
  }
  A.useLever = hit => {
    const c = nearest(hit.x, hit.z); if (!c) return;
    const [u, v] = local(c, hit.x, hit.z), d = dun(c);
    if (Math.hypot(u - LEVER_DOOR[0], v - LEVER_DOOR[1]) < 2) {
      if (d.door) { UI.toast("The lever is already down."); return; }
      d.door = true; openDoor(c); UI.toast("You haul the old lever down. Far to the west, stone grinds open.", "good"); saveNow && saveNow(false); return;
    }
    if (Math.hypot(u - LEVER_HATCH[0], v - LEVER_HATCH[1]) < 2) {
      if (d.hatch) { UI.toast("The hatch above is already open."); return; }
      d.hatch = true; openHatch(c); UI.toast("A hatch swings open to the courtyard above: a quick way back down here.", "good"); saveNow && saveNow(false); return;
    }
    UI.toast("The lever is rusted solid.");
  };
  A.useShelf = hit => {
    const c = nearest(hit.x, hit.z); if (!c) return;
    const d = dun(c); if (d.vault) { UI.toast("The hidden door already stands open."); return; }
    d.vault = true; openShelf(c); G.adv && G.adv("citadelvault");
    UI.toast("One book is loose… you pull it, and two shelves swing inward. A hidden room!", "good"); saveNow && saveNow(false);
  };
  A.useWatchfire = hit => {
    const c = nearest(hit.x, hit.z); if (!c) return;
    const d = dun(c), key = hit.x + "," + hit.y + "," + hit.z, wd = w();
    let spot = null;   // where you'll wake: a clear spot beside the fire
    for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, -1], [1, -1], [-1, 1]]) { const x = hit.x + dx, z = hit.z + dz; if (!wd.id(x, hit.y, z) && !wd.id(x, hit.y + 1, z) && wd.id(x, hit.y - 1, z)) { spot = { x: x + 0.5, y: hit.y, z: z + 0.5 }; break; } }
    if (!spot) { UI.toast("There's no room to rest by this fire."); return; }
    d.cp = spot; d.lit[key] = true; if (!wd.id(hit.x, hit.y + 1, hit.z)) wd.set(hit.x, hit.y + 1, hit.z, B.FIRE);
    Sound.tone(330, 0.3, "triangle", 0.08); UI.toast("You light the watchfire. If you fall in these dungeons, you'll wake here.", "good"); saveNow && saveNow(false);
  };
  // where to wake after falling in a citadel (null = the normal rules)
  A.respawnSpot = () => {
    if (G.dim !== "overworld" || !G.deathSpot) return null;
    const c = nearest(G.deathSpot.x, G.deathSpot.z); if (!c) return null;
    const d = dun(c); return d.cp && Math.hypot(G.deathSpot.x - c.cx, G.deathSpot.z - c.cz) < 110 ? { ...d.cp } : null;
  };

  // ---------- ambushes ----------
  function ambush(c, p, [u, v]) {
    const d = dun(c);
    for (const [id, R] of Object.entries(AMBUSH)) {
      const fk = c.i + ":" + id, fight = fights.get(fk);
      for (const [key, e] of [...live]) if (key.startsWith(fk + ":")) { if (e.dead) { live.delete(key); if (fight) fight.dead++; } else if (e.gone || !ents.list.includes(e)) { live.delete(key); if (fight) fight.lost = true; } }
      if (d.cleared[id]) continue;
      if (fight && fight.dead >= fight.n) { fights.delete(fk); d.cleared[id] = true; UI.toast(`You won the ambush in ${R.name}.`, "good"); saveNow && saveNow(false); continue; }
      if (fight && fight.lost) { for (const [key, e] of [...live]) if (key.startsWith(fk + ":")) { e.gone = true; live.delete(key); } fights.delete(fk); }
      const [x0, z0, x1, z1] = R.box, inside = u >= x0 && u <= x1 && v >= z0 && v <= z1 && p.y < DW + 6 && p.y > DW - 3;
      if (!inside || fights.has(fk) || !fightOn()) continue;
      const f = { n: 0, dead: 0 }; fights.set(fk, f);
      R.list.forEach(([sp, gu, gv], j) => {
        const [x, z] = at(c, gu, gv); if (w().id(x, DW, z) || w().id(x, DW + 1, z)) return;
        const e = ents.add(sp, x + 0.5, DW, z + 0.5); if (!e) return;
        e.persist = false; e.noBurn = true; e.alertT = 20; e.home = { x: x + 0.5, y: DW, z: z + 0.5 };
        live.set(fk + ":" + j, e); f.n++;
      });
      if (f.n) { UI.toast(`An ambush in ${R.name}!`, "bad"); Sound.mob && Sound.mob("groan", 3); }
    }
  }
  // ---------- dart galleries ----------
  function darts(c, p, [u, v], dt) {
    if (!fightOn()) return;
    for (const g of GALLERIES) {
      const [x0, z0, x1, z1] = g.zone; if (!(u >= x0 && u <= x1 && v >= z0 && v <= z1 && p.y < DW + 4)) continue;
      for (const [vu, vv] of g.vents) {
        const along = g.dir[0] ? Math.abs(vv - v) : Math.abs(vu - u); if (along > 3) continue;
        const k = c.i + ":" + vu + "," + vv, s = vents.get(k) || { cd: 0, warn: 0 };
        if (s.cd > 0 || s.warn > 0) continue;
        s.warn = 0.6; vents.set(k, s);
        const [x, z] = at(c, vu + g.dir[0] * 0.6, vv + g.dir[1] * 0.6);
        puff && puff(x + 0.5, DW + 1.5, z + 0.5, "spark"); Sound.tone(900, 0.05, "square", 0.05);
      }
    }
  }
  function ventTimers(dt) {
    for (const [k, s] of vents) {
      if (s.warn > 0) {
        s.warn -= dt;
        if (s.warn <= 0) {   // fire!
          const [ci, uv] = k.split(":"), [vu, vv] = uv.split(",").map(Number), c = castles().find(q => q.i === +ci); if (!c) continue;
          const g = GALLERIES.find(q => q.vents.some(([a, b]) => a === vu && b === vv)), [dx, dz] = toWorld(g.dir[0], g.dir[1], c.rot), [x, z] = at(c, vu, vv);
          const dmg = { easy: 1, normal: 2, hard: 3 }[diff()] || 2;
          ents.addProjectile("arrow", x + 0.5 + dx * 0.7, DW + 1.4, z + 0.5 + dz * 0.7, dx * 16, 0, dz * 16, { noGrav: true, dmg, owner: { def: { name: "Dart Trap", hostile: true }, gone: false } });
          Sound.tone(400, 0.08, "triangle", 0.05); s.cd = 2.2;
        }
      } else if (s.cd > 0) s.cd -= dt;
    }
  }
  // ---------- the collapsing bridge ----------
  function bridge(c, p, dt) {
    const wd = w(), fx = Math.floor(p.x), fz = Math.floor(p.z), fy = Math.floor(p.y - 0.05);
    if (!G.creative && !G.spectator && wd.id(fx, fy, fz) === B.CRACKED_FLOOR && !cracks.has(fx + "," + fz)) { cracks.set(fx + "," + fz, { t: 0.55, x: fx, y: fy, z: fz, gone: false }); Sound.tone(140, 0.15, "square", 0.05); }
    for (const [k, q] of cracks) {
      if (!q.gone) { q.t -= dt; if (Math.random() < 0.4) puff && puff(q.x + 0.5, q.y + 1.05, q.z + 0.5, "crumb"); if (q.t <= 0) { q.gone = true; q.back = 14; wd.set(q.x, q.y, q.z, 0); Sound.tone(80, 0.3, "sawtooth", 0.08, -10); } }
      else { q.back -= dt; if (q.back <= 0 && Math.hypot(p.x - q.x, p.z - q.z) > 5) { wd.set(q.x, q.y, q.z, B.CRACKED_FLOOR); cracks.delete(k); } }
    }
    // after a reload (or anything else), any missing bridge tiles grow back when nobody's near
    if (!cracks.size) for (let v = BRIDGE.z0; v <= BRIDGE.z1; v++) for (let u = BRIDGE.x0; u <= BRIDGE.x1; u++) { const [x, z] = at(c, u, v); if (wd.isLoaded(x, z) && wd.id(x, BRIDGE.y, z) === 0 && Math.hypot(p.x - x, p.z - z) > 6) wd.set(x, BRIDGE.y, z, B.CRACKED_FLOOR); }
  }

  // ---------- every frame (the traps) and every half second (everything else) ----------
  A.update = dt => {
    if (G.dim !== "overworld" || !G.world) return;
    ventTimers(dt);
    const p = G.player.pos, c = nearest(p.x, p.z); if (!c) return;
    const lu = local(c, Math.floor(p.x), Math.floor(p.z));
    bridge(c, p, dt);
    if ((tick -= dt) > 0) return; tick = 0.25;
    darts(c, p, lu, dt);
    ambush(c, p, lu);
    const d = dun(c);   // keep opened things open (after a reload)
    if (d.door) openDoor(c, true); if (d.hatch) openHatch(c, true); if (d.vault) openShelf(c, true);
  };
  A.reset = () => { for (const e of live.values()) e.gone = true; live.clear(); fights.clear(); cracks.clear(); vents.clear(); };
  A.state = i => { const c = castles().find(q => q.i === i); return c ? { ...dun(c), live: live.size, cracks: cracks.size } : null; };
  return A;
}
