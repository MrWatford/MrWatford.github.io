// Blockhaven: The Legacy Campaign (Milestone 13, Parts A and B).
// A campaign world is an ordinary world with meta.campaign set, a fixed seed, and Legacy Village stamped around the
// spawn point instead of the Starter Home. Everything the story remembers lives in G.story.campaign:
//   village  { cx, cz, g, v }   where the village stands (chosen once, before any land is made)
//   active   [quest ids]        quests in progress        done   { id: time }   finished quests
//   prog     { id: { i, n, seen } }  the current step of each active quest and its count
//   places   { id: true }       places found              spawned { id: true }  people and animals moved in
//   filled   true when the village chests got their supplies (exactly once)
// The game reports events with G.campaign.event(type, arg); quests move forward on their own.
import { B, I, CHUNK, SEA, itemDef } from "./blocks.js";
import { newStack } from "./inventory.js";
import { buildVillage, VSIZE, VC, VILLAGE_V } from "./campaign-village.js";
import { CAMPAIGN_SEED, CAMPAIGN_WORLD, INTRO, CHAPTERS, PLACES, NPCS, LOOT, START_KIT, SKIP_KIT, QUESTS, QUEST_ORDER } from "./campaign-data.js";
export { CAMPAIGN_SEED, CAMPAIGN_WORLD };

const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const k3 = (x, y, z) => x + "," + y + "," + z;

export function initCampaign(api) {
  const { G, UI, Sound, L, ents, openPanel, closePanel, giveXp } = api;
  const C = {};
  const on = () => !!(G.meta && G.meta.campaign);
  C.on = on;
  const fresh = () => ({ v: 1, chapter: 1, active: ["welcome"], done: {}, prog: {}, places: {}, spawned: {}, filled: false, track: true, intro: false, walked: 0, given: {}, flags: {} });
  const st = () => G.story.campaign || (G.story.campaign = fresh());

  // ---------- where the village goes ----------
  function findSite(gen) {
    const sp = gen.findSpawn();
    let best = null;
    const score = (x, z, r) => {
      for (const s of gen.strongholds || []) if (Math.hypot(s.x - x, s.z - z) < 120) return null;
      const hs = []; let water = 0, steep = 0;
      for (let dz = -60; dz <= 60; dz += 12) for (let dx = -60; dx <= 60; dx += 12) {
        const c = gen.column(x + dx, z + dz);
        if (c.h <= SEA) water++;
        if (c.biome === "peak" || c.biome === "mountain") steep++;
        hs.push(c.h);
      }
      hs.sort((a, b) => a - b);
      const spread = hs[Math.floor(hs.length * 0.9)] - hs[Math.floor(hs.length * 0.1)];
      return { x, z, s: spread + water * 2 + steep * 3 + r / 80, g: Math.max(SEA + 2, Math.min(SEA + 12, hs[Math.floor(hs.length / 2)])) };
    };
    for (let r = 0; r <= 400; r += 40) {
      const n = r ? Math.max(6, Math.round(Math.PI * 2 * r / 60)) : 1;
      for (let a = 0; a < n; a++) {
        const t = a / n * Math.PI * 2, x = Math.round(sp.x + Math.cos(t) * r), z = Math.round(sp.z + Math.sin(t) * r);
        const c = score(x, z, r);
        if (c && (!best || c.s < best.s)) best = c;
      }
      if (best && best.s <= 6) break;
    }
    best = best || { x: Math.round(sp.x), z: Math.round(sp.z), g: SEA + 4 };
    return { cx: best.x, cz: best.z, g: best.g, v: VILLAGE_V };
  }
  let built = null;   // { key, cells, info }
  function village(gen) {
    const v = st().village, key = [v.cx, v.cz, v.g, v.v].join(",");
    if (!built || built.key !== key) {
      const g0 = gen || G.world.gen;
      built = { key, ...buildVillage(v.g, (X, Z) => g0.column(v.cx + X, v.cz + Z).h) };
    }
    return built;
  }
  const at = (X, y, Z) => { const v = st().village; return { x: v.cx + X, y, z: v.cz + Z }; };
  C.info = () => (on() && st().village ? village().info : null);

  // Called from makeWorld for the Surface, before any land is made (in place of the Starter Home)
  C.plan = (gen, wdata) => {
    if (!on()) return false;
    const s = st();
    if (!s.village) s.village = findSite(gen);
    const v = s.village, b = village(gen);
    // no natural village inside Legacy Village (its villagers would move into our streets)
    if (gen.villagePiece && !gen._cpWrapped) {
      const vp = gen.villagePiece, x0 = v.cx - VC, z0 = v.cz - VC;
      gen.villagePiece = function (gx, gz) { if (gx * CHUNK < x0 + VSIZE && gx * CHUNK + CHUNK > x0 && gz * CHUNK < z0 + VSIZE && gz * CHUNK + CHUNK > z0) return null; return vp.call(this, gx, gz); };
      gen._cpWrapped = true;
    }
    // the signs keep their writing in the world's sign list
    if (!s.signs) {
      const signs = wdata.signs || (wdata.signs = {});
      for (const q of b.info.signs) { const p = at(q.X, q.y, q.Z); signs[k3(p.x, p.y, p.z)] = q.text; }
      s.signs = true;
    }
    // the temples and the excavation stay well away from the village
    L.avoid = [];
    for (const a of [-64, -32, 0, 32, 64]) for (const c of [-64, -32, 0, 32, 64]) L.avoid.push({ x: v.cx + a - 16, z: v.cz + c - 16 });
    // the Explorer's Map works as usual, with Legacy Village as "home"
    if (!G.story.starter) G.story.starter = { v: 1, fresh: true, house: null, campaign: true, waypoint: true, zoom: 2, granted: Date.now(), welcomed: true, mapGiven: true, dest: "home" };
    return true;
  };
  C.stamp = gen => {
    if (!on() || !st().village) return;
    const v = st().village, b = village(gen);
    gen.stamps = gen.stamps || [];
    gen.stamps.push({ x: v.cx - VC, z: v.cz - VC, size: VSIZE, cells: b.cells });
  };
  C.spawnPoint = () => {
    if (!on() || !st().village) return null;
    const sp = village().info.spawn, p = at(sp.X, sp.y, sp.Z);
    return { x: p.x + 0.5, y: p.y, z: p.z + 0.5, yaw: sp.yaw };
  };
  C.home = () => { const p = C.spawnPoint(); return p && { x: p.x, y: p.y, z: p.z }; };
  C.homeTitle = () => "Legacy Village";

  // ---------- one-time setup inside the world: chests, people, animals ----------
  function fillChests() {
    const s = st(), w = G.world, info = village().info;
    for (const c of info.chests) {
      const p = at(c.X, c.y, c.Z), key = k3(p.x, p.y, p.z);
      if (w.containers.has(key)) continue;
      const slots = new Array(27).fill(null);
      (LOOT[c.loot] || []).forEach(([id, n], j) => { if (j < 27 && id && itemDef(id)) slots[j] = newStack(id, n); });
      w.containers.set(key, { type: "chest", slots, label: c.label });
    }
    for (const c of info.crops) { const p = at(c.X, c.y, c.Z); w.crops.add(k3(p.x, p.y, p.z)); }
    // the starting kit
    for (const [id, n] of START_KIT) if (itemDef(id)) {
      if (id === I.EXPLORER_MAP) { const free = [...Array(9).keys()].find(i => !G.inv.slots[i]); if (free !== undefined) { G.inv.slots[free] = newStack(id, 1); continue; } }
      give(id, n);
    }
    s.filled = true; G.hudDirty = true;
  }
  function moveIn() {
    const s = st(), w = G.world, info = village().info;
    const loaded = (x, z) => w.chunks.has(Math.floor(x / CHUNK) + "," + Math.floor(z / CHUNK));
    for (const n of info.npcs) {
      if (s.spawned[n.id]) continue;
      const p = at(n.X, n.y, n.Z); if (!loaded(p.x, p.z)) continue;
      const d = NPCS[n.id];
      ents.add(d.prof, p.x + 0.5, p.y, p.z + 0.5, { name: d.name, npc: n.id, home: [p.x + 0.5, p.y, p.z + 0.5] });
      s.spawned[n.id] = true;
    }
    info.animals.forEach((a, i) => {
      const key = "a" + i; if (s.spawned[key]) return;
      const p = at(a.X, a.y, a.Z); if (!loaded(p.x, p.z)) return;
      ents.add(a.sp, p.x + 0.5, p.y, p.z + 0.5, {});
      s.spawned[key] = true;
    });
  }

  // ---------- quests ----------
  const prog = q => st().prog[q] || (st().prog[q] = { i: 0, n: 0, seen: [] });
  const stepOf = q => QUESTS[q] && QUESTS[q].steps[prog(q).i];
  C.active = () => (on() ? st().active.filter(q => QUESTS[q]) : []);
  function give(id, n) {
    if (!itemDef(id)) return;
    const left = G.inv.add(id, n);
    if (left) G.dropItem(id, left);
    G.hudDirty = true;
  }
  function start(q, quiet) {
    const s = st();
    if (!QUESTS[q] || s.done[q] || s.active.includes(q)) return;
    s.active.push(q); s.prog[q] = { i: 0, n: 0, seen: [] };
    if (!quiet) { UI.toast(`${QUESTS[q].side ? "Side quest" : "New quest"}: ${QUESTS[q].title}`, "good"); Sound.craft(); }
    stepStarted(q);
    summary();
  }
  function stepStarted(q) {
    const s = st(), step = stepOf(q), p = prog(q);
    if (!step) return;
    if (step.ev === "visit" && s.places[step.place]) return advance(q);
    if (step.ev === "places" && !step.high) { p.seen = step.list.filter(x => s.places[x]); if (p.seen.length >= step.n) return advance(q); }
    if (step.ev === "have") checkHave(q);
    hudDirty = true;
  }
  function advance(q) {
    const p = prog(q), def = QUESTS[q];
    p.i++; p.n = 0; p.seen = [];
    if (p.i >= def.steps.length) return complete(q);
    const step = stepOf(q);
    UI.toast("✔ Done! Next: " + step.text, "good"); Sound.click();
    stepStarted(q);
  }
  function complete(q) {
    const s = st(), def = QUESTS[q];
    s.active = s.active.filter(x => x !== q); s.done[q] = Date.now();
    if (def.reward) { if (def.reward.xp) giveXp(def.reward.xp); for (const [id, n] of def.reward.items || []) give(id, n); }
    UI.toast(`Quest complete: ${def.title}!${def.reward ? " Reward: " + def.reward.text + "." : ""}`, "good"); Sound.levelUp();
    G.adv && G.adv("cpquest", q);
    // what comes next
    if (q === "lessons") { start("village"); start("secrets", true); start("lookout", true); }
    if (q === "village") start("prepare");
    if (q === "prepare") start("rumors");
    hudDirty = true; summary();
  }
  function summary() {   // a short progress line for the campaign list on the title screen
    if (!G.meta || !G.meta.campaign) return;
    const s = st(), main = QUEST_ORDER.find(q => s.active.includes(q) && QUESTS[q].main);
    G.meta.campaign = { ...G.meta.campaign, chapter: s.chapter, done: Object.keys(s.done).length, quest: main ? QUESTS[main].title : "" };
  }
  function checkHave(q) {
    const step = stepOf(q); if (!step || step.ev !== "have") return;
    let n = 0; for (const sl of G.inv.slots) if (sl && step.ids.includes(sl.id)) n += sl.n;
    if (n >= step.n) advance(q);
  }
  function matches(step, type, arg) {
    switch (step.ev) {
      case "talk": return type === "talk" && arg === step.npc;
      case "visit": return type === "visit" && arg === step.place;
      case "places": return (type === (step.high ? "visitHigh" : "visit")) && step.list.includes(arg);
      case "break": case "craft": return type === step.ev && step.ids.includes(arg);
      case "panel": return type === "panel" && arg === step.kind;
      case "eat": case "trade": return type === step.ev;
      case "kill": return type === "kill" && (!step.sp || arg === step.sp);
      case "flag": return type === "flag" && arg === step.flag;
      case "walk": return type === "walk";
      default: return false;
    }
  }
  C.event = (type, arg) => {
    if (!on() || !G.story || !G.story.campaign) return;
    for (const q of [...st().active]) {
      const step = stepOf(q); if (!step || !matches(step, type, arg)) continue;
      const p = prog(q);
      if (step.ev === "places") { if (!p.seen.includes(arg)) { p.seen.push(arg); hudDirty = true; if (p.seen.length >= step.n) advance(q); } continue; }
      p.n += type === "walk" ? arg : 1; hudDirty = true;
      if (p.n >= (step.n || 1)) advance(q);
    }
  };
  C.blockBroken = (x, y, z, id) => C.event("break", id);
  C.panelOpened = kind => C.event("panel", kind);

  // ---------- talking to people ----------
  const findEnt = uid => ents.list.find(e => e.uid === uid && !e.dead);
  C.talk = e => {
    if (!on() || !e.npc || !NPCS[e.npc]) return false;
    C.event("talk", e.npc);
    openPanel("talk", e.uid);
    return true;
  };
  function lines(id) {
    const s = st(), d = NPCS[id], cur = q => (s.active.includes(q) ? prog(q).i : -1), opts = [];
    const tradeOpt = { label: "Trade", act: "trade" };
    let text = d.hello;
    if (id === "elder") {
      if (!s.done.welcome) {
        text = "So you're awake at last! Welcome to Legacy Village, traveler. I'm Maren, Elder of this village.\n\nStrange things have been happening across Blockhaven, and I think you arrived here for a reason. But first things first: do you know the ways of a builder? Chopping, crafting, farming, fighting?";
        opts.push({ label: "Teach me the basics", act: "lessons" }, { label: "I already know (skip the lessons)", act: "skip" });
        return { text, opts };
      }
      if (cur("lessons") >= 0) text = "Keep at your lessons, little builder. Right now: " + stepOf("lessons").text + ".";
      else if (cur("village") === 0) text = "Go and see our village! Meet the people, look inside the buildings. Every chest in Legacy Village is yours to use. Come back to me when you've seen it.";
      else if (cur("prepare") >= 0) text = s.flags.elderRelics ? "Smith Garrick's forge is just west of the fountain. Iron tools first, then we'll talk about the road ahead." : "You've seen our little kingdom, and it has seen you.\n\nNow listen. Long ago, the First Builders made all of this, and much more. When their greatest work went wrong, they hid their power in eight Relics to seal away something terrible: the Forgotten King.\n\nThe seals are weakening. I can feel it. Before you can help, you'll need better gear. Go and see Smith Garrick.";
      else if (cur("rumors") === 1) text = "A traveler came through last night, pale as milk. The watchtower on the road to Stonehaven was smashed to rubble in a single night, and nobody saw what did it.\n\nThe Desert Temple lies beyond Stonehaven. If the First Builders' first Relic is still there, we must find it before something else does.\n\n(The road to Stonehaven opens in the next campaign update. Until then, Blockhaven is yours to explore!)";
      if (cur("prepare") >= 0) s.flags.elderRelics = true;
    } else if (id === "smith") {
      if (cur("prepare") === 1 || cur("prepare") === 2) text = "Iron, that's what you need. There's iron ore in the Old Mine, north-east of here, down the stairs. Mine it with a stone pickaxe, smelt it in a furnace with coal, then make yourself something sharp.";
      else if (s.done.prepare && !s.flags.smithThanks) { text = "Ha! Look at that edge. You'd make a fine smith. Take this shield and helmet; they've been gathering dust on my wall. You'll need them where you're going."; s.flags.smithThanks = true; }
      opts.push(tradeOpt);
    } else if (id === "captain") {
      const sparStep = s.active.includes("lessons") && stepOf("lessons").ev === "kill";
      if (sparStep) {
        text = "So you want to spar? Good! I'll let a Gloop into the arena. Hit it with your sword (left-click) until it's gone. Gloops split when they're hit hard, so finish all the pieces!";
        opts.push({ label: "I'm ready to spar!", act: "spar" });
      } else text = d.hello + (s.done.lessons ? " If you want a job, climb a watchtower and tell me what you see." : "");
      opts.push(tradeOpt);
    } else if (id === "merchant") {
      if (s.active.includes("lessons") && stepOf("lessons").ev === "trade") {
        if (!s.given.jade) { give(I.JADE, 3); s.given.jade = true; text = "A new face! Here, take these 3 Jade. Jade is the money of Blockhaven. Now try buying something from me. Choose Trade below."; }
        else text = "Choose Trade below and pick something you can afford.";
      }
      opts.push(tradeOpt);
    } else if (id === "librarian") {
      text = d.hello + (s.active.includes("secrets") ? "\n\nThey say the old king hid two secrets close by: one behind the Great Hall, one under this very library. If you find them, I'd love to hear about it!" : "");
      opts.push(tradeOpt);
    } else opts.push(tradeOpt);
    return { text, opts };
  }
  C.talkHTML = uid => {
    const e = findEnt(uid);
    if (!e || !NPCS[e.npc]) return `<div class="inv-card note-card"><p class="note">They wandered off.</p></div>`;
    const d = NPCS[e.npc], { text, opts } = lines(e.npc);
    C._opts = opts; C._uid = uid;
    return `<div class="inv-card note-card cp-talk"><h3>${esc(d.name)} <span class="note" style="color:#444">${esc(d.role)}</span></h3><div class="note-text">${esc(text)}</div>
      <div class="row" style="flex-wrap:wrap;gap:8px;margin-top:10px">${opts.map((o, i) => `<button class="btn small ${i === 0 ? "primary" : ""}" data-cpo="${i}">${esc(o.label)}</button>`).join("")}<button class="btn small" data-cpo="x">Goodbye</button></div>
      <p class="help">Press Esc or E to close.</p></div>`;
  };
  C.mountTalk = panel => {
    panel.querySelectorAll("[data-cpo]").forEach(b => b.onclick = () => { Sound.click(); choose(b.dataset.cpo); });
  };
  function choose(i) {
    if (i === "x") { closePanel(); return; }
    const o = C._opts && C._opts[+i], s = st(), e = findEnt(C._uid);
    if (!o) return;
    if (o.act === "trade") { if (e) openPanel("trade", e.uid); return; }
    if (o.act === "lessons") { s.tutorial = "on"; C.event("flag", "chose"); start("lessons"); closePanel(); return; }
    if (o.act === "skip") {
      s.tutorial = "skipped"; C.event("flag", "chose");
      for (const [id, n] of SKIP_KIT) give(id, n);
      const q = QUESTS.lessons; if (q.reward) { giveXp(q.reward.xp); for (const [id, n] of q.reward.items) give(id, n); }
      s.done.lessons = Date.now();
      UI.toast("Lessons skipped. You got the lesson rewards and some basic tools.", "good");
      start("village"); start("secrets", true); start("lookout", true);
      closePanel(); return;
    }
    if (o.act === "spar") { spar(); closePanel(); return; }
  }
  function spar() {
    if (G.wset.difficulty === "peaceful") { UI.toast("Peaceful world: Captain Rowan shows you the moves instead of letting a monster in.", "good"); C.event("kill", "slime"); return; }
    const info = village().info, a = info.places.find(p => p.id === "arena"), p = at(a.X, info.spawn.y, a.Z);
    ents.add("slime", p.x + 0.5, p.y + 1, p.z + 0.5, { size: 2 });
    UI.toast("A Gloop bounces into the arena! Defeat it (and its pieces).", "");
  }
  C.skipTutorial = () => { const s = st(); if (!s.active.includes("lessons")) return; s.active = s.active.filter(q => q !== "lessons"); C._opts = [{ act: "skip" }]; choose(0); };

  // ---------- each frame ----------
  let placeT = 0, hudT = 0, introT = 0, last = null, hudDirty = true, introPending = false;
  C.tick = dt => {
    if (!on() || !G.world || !G.player) return;
    const s = st(), p = G.player;
    if (G.dim === "overworld" && s.village) {
      if (!s.filled && G.inv) fillChests();
      moveIn();
      if ((placeT -= dt) <= 0) {
        placeT = 0.4;
        const info = village().info, v = s.village;
        for (const pl of info.places) {
          const d = Math.hypot(p.pos.x - (v.cx + pl.X + 0.5), p.pos.z - (v.cz + pl.Z + 0.5));
          if (d > pl.r) continue;
          if (!s.places[pl.id]) {
            s.places[pl.id] = true;
            const P = PLACES[pl.id];
            if (P && !P.tower && pl.id !== "castleGate") UI.toast(`${P.secret ? "Secret found" : "Discovered"}: ${P.name}`, P.secret ? "good" : "");
          }
          C.event("visit", pl.id);
          if (PLACES[pl.id] && PLACES[pl.id].tower && p.pos.y >= v.g + 16) C.event("visitHigh", pl.id);
        }
        for (const q of s.active) checkHave(q);
      }
    }
    // walking (for the first lesson)
    if (last && G.state === "play") { const d = Math.hypot(p.pos.x - last.x, p.pos.z - last.z); if (d > 0.01 && d < 2) C.event("walk", d); }
    last = { x: p.pos.x, z: p.pos.z };
    // the opening: a chapter card, then the story so far
    if (!s.intro && G.state === "play") { introT += dt; if (introT > 0.8) { s.intro = true; titleCard(1, () => { introPending = true; }); } }
    if (introPending && G.state === "play" && !G.panelKind) { introPending = false; openPanel("note", { title: INTRO.title, text: INTRO.text + "\n\n(Your quest journal is on J. The current objective is shown at the top of the screen.)" }); }
    if ((hudT -= dt) <= 0 || hudDirty) { hudT = 0.25; hudDirty = false; drawHud(); }
  };

  // ---------- the objective tracker (top of the screen) ----------
  let hudEl = null;
  function drawHud() {
    if (!hudEl) {
      hudEl = document.createElement("div"); hudEl.id = "cpHud";
      hudEl.style.cssText = "position:absolute;left:50%;top:8px;transform:translateX(-50%);max-width:min(560px,92vw);background:rgba(20,16,10,.72);color:#fff;border:2px solid #c9a24a;border-radius:6px;padding:5px 12px;font:13px/1.35 system-ui,sans-serif;text-align:center;pointer-events:none;z-index:5";
      (document.getElementById("hud") || document.body).appendChild(hudEl);
    }
    const s = on() && G.story.campaign;
    if (!s || !s.track || G.state === "title") { hudEl.hidden = true; return; }
    const q = QUEST_ORDER.find(id => s.active.includes(id) && QUESTS[id].main) || s.active.find(id => QUESTS[id]);
    if (!q) { hudEl.hidden = true; return; }
    const step = stepOf(q), p = prog(q);
    let extra = "";
    if (step.ev === "places") extra = ` (${p.seen.length} of ${step.n})`;
    else if (step.ev === "walk") extra = ` (${Math.min(step.n, Math.floor(p.n))} of ${step.n})`;
    else if ((step.n || 1) > 1) extra = ` (${p.n} of ${step.n})`;
    const target = targetOf(step);
    if (target && G.dim === "overworld") {
      const dx = target.x - G.player.pos.x, dz = target.z - G.player.pos.z, d = Math.round(Math.hypot(dx, dz));
      if (d > 6) extra += ` • ${d} m ${dir8(dx, dz)}`;
    }
    hudEl.hidden = false;
    hudEl.innerHTML = `<b style="color:#f5d36a">${esc(QUESTS[q].title)}</b><br>▶ ${esc(step.text)}${esc(extra)}`;
  }
  function targetOf(step) {
    const s = st(); if (!s.village) return null;
    const info = village().info;
    const npcId = step.npc || step.talk;
    if (npcId) { const e = ents.list.find(x => x.npc === npcId && !x.dead); if (e) return { x: e.pos.x, z: e.pos.z }; }
    const pid = step.place || (step.ev === "places" && step.list.find(x => !(prog(QUEST_ORDER.find(q => s.active.includes(q) && stepOf(q) === step) || "").seen || []).includes(x)));
    const pl = pid && info.places.find(x => x.id === pid);
    return pl ? { x: s.village.cx + pl.X + 0.5, z: s.village.cz + pl.Z + 0.5 } : null;
  }
  const dir8 = (dx, dz) => ["east", "south-east", "south", "south-west", "west", "north-west", "north", "north-east"][((Math.round(Math.atan2(dz, dx) / (Math.PI / 4)) % 8) + 8) % 8];

  // ---------- the chapter title card ----------
  function titleCard(n, then) {
    const ch = CHAPTERS[n - 1], el = document.createElement("div");
    el.style.cssText = "position:fixed;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;background:rgba(0,0,0,.55);color:#fff;z-index:40;font-family:system-ui,sans-serif;text-align:center;transition:opacity .8s;opacity:0;cursor:pointer;padding:16px";
    el.innerHTML = `<div style="letter-spacing:.3em;font-size:14px;color:#f5d36a">BLOCKHAVEN: THE LEGACY CAMPAIGN</div><div style="font-size:clamp(28px,6vw,54px);font-weight:800;margin:10px 0;text-shadow:0 3px 0 #000">Chapter ${n}: ${esc(ch.title)}</div><div style="font-size:16px;opacity:.9">${esc(ch.blurb)}</div><div style="font-size:12px;opacity:.6;margin-top:18px">Click to continue</div>`;
    document.body.appendChild(el);
    requestAnimationFrame(() => { el.style.opacity = "1"; });
    let gone = false;
    const done = () => { if (gone) return; gone = true; el.style.opacity = "0"; setTimeout(() => el.remove(), 800); then && then(); };
    el.onclick = done; setTimeout(done, 4500);
  }

  // ---------- the journal's Campaign tab ----------
  C.journalHTML = () => {
    const s = st(), stepRow = (q) => QUESTS[q].steps.map((sp, i) => {
      const pi = s.done[q] ? 99 : prog(q).i;
      return `<li style="${i < pi ? "color:#4a7a2a" : i === pi ? "font-weight:700" : "color:#777"}">${i < pi ? "✔" : i === pi ? "▶" : "○"} ${esc(sp.text)}</li>`;
    }).join("");
    const card = q => `<div style="border:1px solid #c9b48a;border-radius:6px;padding:6px 10px;margin:6px 0;background:#fffaf0"><b>${esc(QUESTS[q].title)}</b> ${QUESTS[q].side ? '<span class="note" style="color:#7a5a20">side quest</span>' : ""}${s.done[q] ? ' <span style="color:#4a7a2a">✔ complete</span>' : ""}<div class="note" style="color:#444;margin:2px 0">${esc(QUESTS[q].text)}</div><ul style="margin:4px 0 0 0;padding-left:18px;list-style:none">${stepRow(q)}</ul>${QUESTS[q].reward ? `<div class="note" style="color:#7a5a20">Reward: ${esc(QUESTS[q].reward.text)}</div>` : ""}</div>`;
    const active = QUEST_ORDER.filter(q => s.active.includes(q)), done = QUEST_ORDER.filter(q => s.done[q] && !(q === "lessons" && s.tutorial === "skipped"));
    const chapters = CHAPTERS.map(c => `<li style="${c.n === s.chapter ? "font-weight:700" : c.n > s.chapter ? "color:#888" : ""}">${c.n > s.chapter ? "🔒" : c.n === s.chapter ? "▶" : "✔"} Chapter ${c.n}: ${esc(c.title)}${c.n <= s.chapter ? ` <span class="note" style="color:#555">${esc(c.where)}</span>` : ""}</li>`).join("");
    const relics = CHAPTERS.map(c => `<span title="${esc(c.relic)}" style="display:inline-block;width:30px;height:30px;line-height:30px;margin:2px;border-radius:50%;text-align:center;border:2px solid ${(s.relics || []).includes(c.n) ? "#c9a24a" : "#bbb"};background:${(s.relics || []).includes(c.n) ? "#f5d36a" : "#eee"}">${(s.relics || []).includes(c.n) ? "★" : "?"}</span>`).join("");
    const found = Object.keys(s.places).filter(k => PLACES[k] && !PLACES[k].tower && k !== "castleGate").map(k => esc(PLACES[k].name)).join(", ") || "None yet";
    return `<div style="color:#222">
      <h4 style="margin:4px 0">Chapter ${s.chapter}: ${esc(CHAPTERS[s.chapter - 1].title)}</h4>
      <p class="note" style="color:#444">${esc(CHAPTERS[s.chapter - 1].blurb)}</p>
      <h4>Current quests</h4>${active.length ? active.map(card).join("") : '<p class="note" style="color:#444">No quests right now. Talk to the people of Legacy Village.</p>'}
      <h4>Relics recovered (${(s.relics || []).length} of 8)</h4><div>${relics}</div>
      <h4>Chapters</h4><ul style="list-style:none;padding-left:4px;margin:4px 0">${chapters}</ul>
      <h4>Places found</h4><p class="note" style="color:#333">${found}</p>
      ${done.length ? `<details><summary><b>Finished quests (${done.length})</b></summary>${done.map(card).join("")}</details>` : ""}
      <h4>Options</h4><p class="note" style="color:#333"><button class="chip-btn" data-cp="track">${s.track ? "Hide" : "Show"} the objective at the top of the screen</button>
      ${s.active.includes("lessons") ? ' <button class="chip-btn" data-cp="skip">Skip the lessons</button>' : ""} <button class="chip-btn" data-cp="story">Read the story so far</button></p>
    </div>`;
  };
  C.journalAction = k => {
    const s = st();
    if (k === "track") { s.track = !s.track; hudDirty = true; }
    if (k === "skip") C.skipTutorial();
    if (k === "story") openPanel("note", { title: INTRO.title, text: INTRO.text });
  };
  C.resetSession = () => { last = null; introT = 0; built = null; hudDirty = true; if (hudEl) hudEl.hidden = true; };
  C.hideHud = () => { if (hudEl) hudEl.hidden = true; };
  return C;
}
