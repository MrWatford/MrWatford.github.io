import { B, I, CHUNK, SOLID } from "./blocks.js";
import { stonehavenCovers } from "./stonehaven.js";
import { grandCapitalSiege } from "./stonehaven-grand.js";
import { VILLAGE_OVERHAUL_GEN } from "./village-overhaul.js";

const VILLAGE_WAVES = [
  ["pillager", "vindicator", "pillager"],
  ["vindicator", "ravager", "pillager", "vindicator"]
];
const CAPITAL_WAVES = [
  ["vindicator", "pillager", "vindicator", "pillager"],
  ["pillager", "ravager", "vindicator", "pillager", "vindicator"],
  ["ravager", "vindicator", "pillager", "ravager", "vindicator", "pillager"]
];

export function initSettlementRaids({ G, UI, Sound, SPECIES, hud, closePanel }) {
  const live = new Map();
  let session = null, warning = 0, scan = 0;
  const ledger = () => G.story?.settlementRaids;
  const record = id => ledger()?.sites?.[id];
  function write(id, value, active = ledger()?.active ?? null) {
    G.story.settlementRaids = { active, sites: { ...ledger()?.sites, [id]: value } };
  }
  function site(id) {
    if (G.dim !== "overworld" || !G.world || G.guest) return null;
    const gen = G.world.gen;
    if (id === "stonehaven") {
      const gate = gen.stonehaven;
      return gate && {
        id, title: "Great Siege of Stonehaven", waves: CAPITAL_WAVES, reward: 24,
        anchor: { x: gate.x, y: gate.y, z: gate.z - 9 },
        rally: { x: gate.x + 5, y: gate.y, z: gate.z - 19 },
        ...(gen.grandCapital ? grandCapitalSiege(gen.stonehavenSite) : {})
      };
    }
    const match = /^village:(-?\d+),(-?\d+)$/.exec(id ?? "");
    if (!match || gen.version < VILLAGE_OVERHAUL_GEN) return null;
    const cx = Number(match[1]), cz = Number(match[2]);
    if (!Number.isSafeInteger(cx) || !Number.isSafeInteger(cz)) return null;
    const p = gen.villagePiece(cx, cz);
    if (!p?.detailed || p.type !== "plaza") return null;
    const [x, z] = p.center, [rx, ry, rz] = p.home;
    return { id, title: "Village Defense", waves: VILLAGE_WAVES, reward: 8,
      anchor: { x, y: p.y + 1, z }, rally: { x: rx, y: ry, z: rz } };
  }
  function localSite(e) {
    const w = G.world, p = G.player?.pos;
    if (!w || !p || G.dim !== "overworld" || G.guest || !e?.def.villager || !e.home || e.dead || e.gone ||
        Math.hypot(e.pos.x - p.x, e.pos.y - p.y, e.pos.z - p.z) > 6) return null;
    const [x, , z] = e.home;
    if (stonehavenCovers(w.gen, x, z)) return site("stonehaven");
    if (w.gen.version < VILLAGE_OVERHAUL_GEN) return null;
    const plot = w.gen.villagePiece(Math.floor(x / CHUNK), Math.floor(z / CHUNK));
    if (!plot?.detailed) return null;
    return site("village:" + plot.center.map(n => Math.floor(n / CHUNK)).join(","));
  }
  const canFight = () => G.mode === "survival" && G.wset.difficulty !== "peaceful";
  function offer(e) {
    const nearby = localSite(e);
    if (!nearby) return null;
    const r = record(nearby.id);
    if (r?.state === "won") return { title: nearby.title, text: nearby.reward + " Jade for defending the settlement.", action: "Claim reward" };
    if (r?.state === "claimed") return { title: nearby.title, text: "The settlement is safe. Reward claimed." };
    if (r?.state === "active") return { title: nearby.title, text: "Wave " + (r.wave + 1) + " of " + nearby.waves.length + ". Stay near the settlement to defend it." };
    if (ledger()?.active) return { title: nearby.title, text: "Another settlement still needs your help." };
    if (!canFight()) return { title: nearby.title, text: "Available in Survival above Peaceful difficulty." };
    return { title: nearby.title, text: "Optional defense · " + nearby.waves.length + " waves",
      action: nearby.id === "stonehaven" ? "Start siege" : "Start defense" };
  }
  function interact(e) {
    if (G.state !== "panel" || G.panelKind !== "trade" || G.panelCtx !== e?.uid) return;
    const nearby = localSite(e);
    if (!nearby) return;
    const { id, reward, title } = nearby;
    const r = record(id);
    if (r?.state === "won") {
      if (G.spectator || !G.inv.roomFor(I.JADE, reward)) {
        UI.toast("Make space for your reward before claiming it.", "bad");
        return;
      }
      G.inv.add(I.JADE, reward);
      write(id, { state: "claimed" });
      G.hudDirty = true;
      UI.refreshPanel();
      Sound.levelUp();
      void G.saveNow(false);
      return;
    }
    if (r || ledger()?.active || !canFight()) return;
    write(id, { state: "active", wave: 0, hp: [] }, id);
    closePanel();
    UI.toast(title + " begins in six seconds. Prepare to defend the square!", "bad");
    Sound.mob("roar", 10);
    void G.saveNow(false);
  }
  function challengeStart() {
    if (ledger()?.active || !canFight()) return false;
    const p = G.player.pos;
    const nearby = G.ents.near(p.x, p.y, p.z, 36, e => e.def.villager && !e.dead && !e.gone && e.home);
    for (const e of nearby) {
      const [x, , z] = e.home;
      const plot = G.world.gen.villagePiece(Math.floor(x / CHUNK), Math.floor(z / CHUNK));
      const id = stonehavenCovers(G.world.gen, x, z) ? "stonehaven" :
        plot?.detailed ? "village:" + plot.center.map(n => Math.floor(n / CHUNK)).join(",") : null;
      const area = site(id);
      if (!area || record(id)) continue;
      write(id, { state: "active", wave: 0, hp: [] }, id);
      UI.toast(area.title + " begins in six seconds. Defend the settlement or retreat.", "bad");
      Sound.mob("roar", 10);
      void G.saveNow(false);
      return true;
    }
    return false;
  }
  function capture() {
    if (!session || !live.size) return;
    const r = record(session.id);
    if (r?.state !== "active") return;
    const hp = [...r.hp];
    let changed = false;
    for (const [i, e] of live) if (!e.dead && e.hp > 0 && hp[i] !== e.hp) {
      hp[i] = e.hp;
      changed = true;
    }
    if (changed) write(session.id, { ...r, hp });
  }
  function show(text = "") {
    if (!hud) return;
    if (hud.textContent !== text) hud.textContent = text;
    hud.hidden = !text;
  }
  function clear() {
    capture();
    for (const e of live.values()) e.gone = true;
    for (const p of G.ents?.projectiles || []) if (p.owner?.settlementRaid) p.gone = true;
    live.clear();
    session = null;
    warning = scan = 0;
    show();
  }
  function defeated(e) {
    const tag = e.settlementRaid;
    if (!session || !tag || live.get(tag.index) !== e) return;
    const r = record(session.id);
    if (r?.state !== "active") return;
    const hp = [...r.hp];
    hp[tag.index] = 0;
    live.delete(tag.index);
    write(session.id, { ...r, hp });
  }
  function spawnPosition(area, def, i) {
    const w = G.world, p = G.player.pos;
    const width = def.w > 1 ? 1 : 0, height = Math.ceil(def.h);
    const clear = (x,y,z) => {
      if (!w.isLoaded(x - width,z - width) || !w.isLoaded(x + width,z + width) ||
          Math.hypot(x + .5 - p.x,z + .5 - p.z) < 6 || !SOLID[w.id(x,y-1,z)] ||
          G.ents.list.some(e=>!e.dead&&!e.gone&&Math.hypot(e.pos.x-x-.5,e.pos.z-z-.5)<2.4)) return false;
      for (let az=-width;az<=width;az++) for(let ax=-width;ax<=width;ax++){
        if(width&&!SOLID[w.id(x+ax,y-1,z+az)])return false;
        for(let ay=0;ay<height;ay++){
          const id=w.id(x+ax,y+ay,z+az);
          if(id!==B.AIR&&id!==B.TALL_GRASS&&id!==B.FLOWER_RED&&id!==B.FLOWER_YELLOW)return false;
        }
      }
      return true;
    };
    if (area.spawns) {
      for(let a=0;a<area.spawns.length;a++){
        const q=area.spawns[(a+i*3)%area.spawns.length];
        if(clear(Math.floor(q.x),q.y,Math.floor(q.z)))return [q.x,q.y,q.z];
      }
      return null;
    }
    const radii = area.id === "stonehaven" ? [8, 12, 17, 21] : [15, 19, 12, 24, 8];
    for (const radius of radii) for (let a = 0; a < 16; a++) {
      const theta = (a + i * 5) * Math.PI / 8;
      const x = Math.floor(area.anchor.x + Math.cos(theta) * radius);
      const z = Math.floor(area.anchor.z + Math.sin(theta) * radius);
      if (!w.isLoaded(x - width, z - width) || !w.isLoaded(x + width, z + width)) continue;
      if (Math.hypot(x + .5 - p.x, z + .5 - p.z) < 6) continue;
      if (G.ents.list.some(e => !e.dead && !e.gone && Math.hypot(e.pos.x - x - .5, e.pos.z - z - .5) < 2.4)) continue;
      for (let y = area.anchor.y + 3; y >= area.anchor.y - 6; y--) {
        if (clear(x,y,z)) return [x + .5, y, z + .5];
      }
    }
    return null;
  }
  function update(dt) {
    const id = ledger()?.active;
    if (!id || G.dim !== "overworld" || G.guest || G.state === "dead" || !canFight()) {
      if (session) clear();
      return;
    }
    const area = session || site(id);
    const r = record(id);
    const wave = area?.waves[r?.wave];
    if (!area || r?.state !== "active" || !Array.isArray(r.hp) || !wave) return;
    const p = G.player.pos;
    if (Math.hypot(p.x - area.anchor.x, p.z - area.anchor.z) > 66 || Math.abs(p.y - area.anchor.y) > 24) {
      if (session) { clear(); UI.toast("Defense paused. Return to the settlement to resume."); }
      return;
    }
    if (!session) { session = area; warning = 6; scan = 0; }
    if (warning > 0) {
      warning -= dt;
      show(area.title + " · Wave " + (r.wave + 1) + " in " + Math.max(1, Math.ceil(warning)) + "s");
      return;
    }
    const left = wave.filter((_, i) => r.hp[i] !== 0).length;
    if (!left) {
      live.clear();
      if (r.wave + 1 === area.waves.length) {
        write(id, { state: "won" }, null);
        clear();
        Sound.levelUp();
        UI.toast(area.title + " complete. Speak with a villager to claim your reward.", "good");
      } else {
        write(id, { state: "active", wave: r.wave + 1, hp: [] });
        warning = 6;
        Sound.mob("roar", 10);
      }
      void G.saveNow(false);
      return;
    }
    if ((scan -= dt) <= 0) {
      scan = .75;
      capture();
      for (const [i, e] of live) {
        if (e.gone || Math.hypot(e.pos.x - area.anchor.x, e.pos.z - area.anchor.z) > 72) {
          e.gone = true;
          live.delete(i);
        }
      }
      const saved = record(id);
      for (const [i, species] of wave.entries()) {
        if (live.has(i) || saved.hp[i] === 0) continue;
        const def = SPECIES[species], spot = spawnPosition(area, def, i);
        if (!spot) continue;
        const hp = Number.isFinite(saved.hp[i]) ? Math.max(.1, Math.min(def.hp, saved.hp[i])) : def.hp;
        const e = G.ents.add(species, ...spot, { hp, persist: false });
        e.settlementRaid = { index: i, rally: area.rally };
        e.persist = false;
        e.angry = 120;
        live.set(i, e);
      }
    }
    show(area.title + " · Wave " + (r.wave + 1) + "/" + area.waves.length +
      " · " + left + " remaining" + (live.size < left ? " · Reinforcements approaching" : ""));
  }
  return { offer, interact, update, defeated, capture, clear, challengeStart };
}
