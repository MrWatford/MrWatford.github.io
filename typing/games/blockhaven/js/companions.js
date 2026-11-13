// Milestone 14 ("smaller gaps"): leads, name tags, Trotter armor, pet breeding,
// Hogbeasts and Boarkin turning rotten on the Surface, and creatures (and your mount) traveling through portals.
// Rules follow Minecraft Java Edition 1.20.1 where Blockhaven has the matching pieces.
import { B, I, CHUNK, idOf, isFence, itemDef } from "./blocks.js";

const MEATS = [I.RAW_BEEF, I.STEAK, I.RAW_PORK, I.COOKED_PORK, I.RAW_CHICKEN, I.COOKED_CHICKEN, I.RAW_MUTTON, I.COOKED_MUTTON, I.RAW_RABBIT, I.COOKED_RABBIT, I.ROTTEN_FLESH];
const FISH = [I.RAW_MINNOW, I.COOKED_MINNOW, I.SUNFIN];
const LEASH_MAX = 10;          // a lead snaps past 10 blocks (Java)
const ROT = { hogbeast: "zoglin", boarkin: "rotboar", brute: "rotboar" };   // what they turn into outside the Ember Depths
const ROT_TIME = 15;           // seconds (Java: 300 ticks)
const PORTAL_TIME = 3;         // seconds a creature stands in a portal before it goes through
const PORTAL_REST = 15;        // after arriving, it can't go back for a while

export function initCompanions(ctx) {
  const { G, THREE, scene, ents, UI, Sound } = ctx;
  const lines = [], knots = [], labels = new Map();
  let slow = 0;

  const canLeash = e => { const d = e.def; return !d.hostile && !d.villager && !d.boss && !d.object && !d.cart && !d.boat && !e.npc && !d.segmentedLeviathan && !d.noSave && !e.dead; };
  const take = () => { if (G.creative) return; const s = G.inv.slots[G.useSlot]; if (s && --s.n <= 0) G.inv.slots[G.useSlot] = null; G.hudDirty = true; };
  const hearts = e => { for (let k = 0; k < 3; k++) ctx.puff(e.pos.x + (Math.random() - 0.5) * 0.8, e.pos.y + e.h + Math.random() * 0.4, e.pos.z + (Math.random() - 0.5) * 0.8, "heart"); };
  const playerLeashed = () => ents.list.filter(e => e.leash === "player" && !e.dead && !e.gone);
  const label = e => e.def.name;

  // ---------- right-clicking a creature ----------
  function interact(e, slot) {
    if (G.guest) return false;
    const id = slot ? slot.id : 0;
    // a creature on your lead: right-click it again to take the lead off
    if (e.leash === "player" && id !== I.LEAD) { e.leash = null; ctx.giveItem(I.LEAD, 1); Sound.place("wood"); return true; }
    if (id === I.LEAD) {
      if (!canLeash(e)) { UI.toast(`You can't put a lead on a ${label(e)}.`); return true; }
      if (e.leash === "player") return true;
      if (e.leash) ctx.spawnDrop(I.LEAD, 1, e.pos.x, e.pos.y + 1, e.pos.z);   // it was tied to a fence; that lead pops off
      e.leash = "player"; take(); Sound.place("wood"); ctx.adv("lead");
      if (!G.tips.lead) { G.tips.lead = true; UI.toast("On the lead! It follows you. Right-click a fence to tie it up, or right-click it to let go.", "good"); }
      return true;
    }
    if (id === I.NAME_TAG) {
      if (e.def.boss || e.npc || e.def.object || e.def.cart || e.def.segmentedLeviathan) { UI.toast("That can't wear a name tag."); return true; }
      const s = G.inv.slots[G.useSlot];
      if (s && s.label) { applyName(e, s.label); take(); return true; }
      ctx.openPanel("nametag", e);
      return true;
    }
    if (itemDef(id)?.horseArmor) {
      if (e.sp !== "trotter") { UI.toast("Only Trotters can wear Trotter armor."); return true; }
      if (!e.tame || e.baby) { UI.toast("Tame the Trotter first (ride it until it trusts you)."); return true; }
      if (e.harmor) ctx.giveItem(e.harmor, 1);
      e.harmor = id; take(); Sound.place("stone"); ctx.adv("harmor");
      UI.toast(`Your Trotter is wearing ${itemDef(id).name}. Crouch and right-click it with an empty hand to take it off.`, "good");
      return true;
    }
    if (e.sp === "trotter" && e.harmor && !slot && ctx.crouching()) {
      ctx.giveItem(e.harmor, 1); UI.toast(`You took off the ${itemDef(e.harmor).name}.`); e.harmor = 0; Sound.place("stone");
      return true;
    }
    // tame pets breed (Scouts with meat, Whiskers with fish) once they're at full health
    const petFood = e.sp === "scout" ? MEATS : e.sp === "whisker" ? FISH : null;
    if (petFood && petFood.includes(id) && e.tame && !e.baby) {
      if (e.hp < e.maxHp) { e.hp = Math.min(e.maxHp, e.hp + 4); take(); hearts(e); return true; }
      if (e.breedCd <= 0 && !(e.love > 0)) { e.love = 30; e.sitting = false; take(); hearts(e); Sound.mob(e.def.sound, 2); return true; }
      UI.toast(`Your ${label(e)} isn't ready for another baby yet.`); return true;
    }
    if (e.sp === "whisker" && FISH.includes(id) && !e.tame) {   // Java cats tame with fish too
      take();
      if (Math.random() < 0.34) { e.tame = true; e.hp = e.maxHp; hearts(e); ctx.adv && ctx.adv("tame", e.sp); UI.toast("You tamed a Whisker! It will follow you.", "good"); }
      else ctx.puff(e.pos.x, e.pos.y + e.h, e.pos.z, "poof");
      return true;
    }
    return false;
  }
  function applyName(e, name) {
    name = String(name).trim().slice(0, 24);
    if (!name) return;
    e.name = name; e.persist = true;
    if (labels.has(e.uid)) { dropLabel(e.uid); }
    ctx.adv("named"); Sound.craft(); UI.toast(`Named it “${name}”. Named creatures never wander off for good.`, "good");
  }

  // ---------- right-clicking a block ----------
  function useOnBlock(hit) {
    if (G.guest || !hit || !isFence(idOf(hit.v))) return false;
    const mine = playerLeashed().filter(e => Math.hypot(e.pos.x - G.player.pos.x, e.pos.z - G.player.pos.z) <= LEASH_MAX);
    if (!mine.length) return false;
    for (const e of mine) e.leash = { x: hit.x, y: hit.y, z: hit.z };
    Sound.place("wood"); UI.toast(mine.length === 1 ? "Tied to the fence." : `Tied ${mine.length} creatures to the fence.`);
    return true;
  }

  // ---------- the name tag panel ----------
  function nameTagHTML(e) {
    return `<div class="inv-card" style="max-width:360px"><h3>Name Tag</h3>
      <p class="help">Type a name for this ${e ? label(e) : "creature"}. It shows above its head, and named creatures never wander off for good.</p>
      <input id="ntName" maxlength="24" autocomplete="off" style="width:100%;font-size:16px;padding:6px;box-sizing:border-box" value="${e && e.name ? String(e.name).replace(/"/g, "&quot;") : ""}">
      <div style="margin-top:10px;display:flex;gap:8px"><button class="btn small primary" id="ntOk">Name it</button><button class="btn small" id="ntCancel">Cancel</button></div></div>`;
  }
  function mountNameTag(p, e) {
    const input = p.querySelector("#ntName");
    setTimeout(() => input && input.focus(), 50);
    const ok = () => { const s = G.inv.slots[G.useSlot]; if (e && !e.dead && s && s.id === I.NAME_TAG && input.value.trim()) { applyName(e, input.value); take(); } ctx.closePanel(); };
    p.querySelector("#ntOk").onclick = ok;
    p.querySelector("#ntCancel").onclick = () => ctx.closePanel();
    input.onkeydown = ev => { ev.stopPropagation(); if (ev.key === "Enter") ok(); if (ev.key === "Escape") ctx.closePanel(); };
  }

  // ---------- drawing: lead ropes, fence knots, name labels ----------
  const ropeMat = new THREE.LineBasicMaterial({ color: 0x6a4a28 });
  const knotGeo = new THREE.BoxGeometry(0.22, 0.25, 0.22), knotMat = new THREE.MeshBasicMaterial({ color: 0x8a6a3a });
  function rope(i) {
    if (!lines[i]) { const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(9 * 3), 3)); lines[i] = new THREE.Line(g, ropeMat); lines[i].frustumCulled = false; scene.add(lines[i]); }
    return lines[i];
  }
  function knot(i) { if (!knots[i]) { knots[i] = new THREE.Mesh(knotGeo, knotMat); scene.add(knots[i]); } return knots[i]; }
  function makeLabel(text) {
    const c = document.createElement("canvas"); c.width = 256; c.height = 48;
    const g = c.getContext("2d"); g.font = "bold 28px sans-serif"; const w = Math.min(250, g.measureText(text).width + 20);
    g.fillStyle = "rgba(0,0,0,0.45)"; g.fillRect((256 - w) / 2, 4, w, 40); g.fillStyle = "#fff"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText(text, 128, 25);
    const tex = new THREE.CanvasTexture(c), s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, depthTest: true, transparent: true }));
    s.scale.set(1.6, 0.3, 1); scene.add(s); return s;
  }
  function dropLabel(uid) { const s = labels.get(uid); if (s) { scene.remove(s); s.material.map.dispose(); s.material.dispose(); labels.delete(uid); } }
  function draw() {
    const p = G.player, hand = { x: p.pos.x, y: p.pos.y + 1.1, z: p.pos.z };
    let li = 0, ki = 0;
    for (const e of ents.list) {
      if (!e.leash || e.dead || e.gone || !e.mesh) continue;
      const to = e.leash === "player" ? hand : { x: e.leash.x + 0.5, y: e.leash.y + 0.6, z: e.leash.z + 0.5 };
      const from = { x: e.pos.x, y: e.pos.y + e.h * 0.75, z: e.pos.z };
      const L = rope(li++), a = L.geometry.attributes.position, len = Math.hypot(to.x - from.x, to.y - from.y, to.z - from.z);
      for (let k = 0; k < 9; k++) { const t = k / 8, sag = Math.sin(t * Math.PI) * Math.max(0, 1.2 - len * 0.12); a.setXYZ(k, from.x + (to.x - from.x) * t, from.y + (to.y - from.y) * t - sag, from.z + (to.z - from.z) * t); }
      a.needsUpdate = true; L.visible = true;
      if (e.leash !== "player") { const K = knot(ki++); K.position.set(to.x, to.y, to.z); K.visible = true; }
    }
    for (let i = li; i < lines.length; i++) lines[i].visible = false;
    for (let i = ki; i < knots.length; i++) knots[i].visible = false;
    // name labels for named creatures near you (at most 16)
    const near = ents.list.filter(e => e.name && !e.npc && !e.dead && !e.gone && e.mesh && Math.hypot(e.pos.x - p.pos.x, e.pos.y - p.pos.y, e.pos.z - p.pos.z) < 14).slice(0, 16);
    const keep = new Set(near.map(e => e.uid));
    for (const uid of [...labels.keys()]) if (!keep.has(uid)) dropLabel(uid);
    for (const e of near) { let s = labels.get(e.uid); if (!s) { s = makeLabel(e.name); labels.set(e.uid, s); } s.position.set(e.pos.x, e.pos.y + e.h + 0.8, e.pos.z); /* e.h already shrinks for babies */ }
  }

  // ---------- every frame ----------
  function tick(dt) {
    if (!G.world || G.guest) { draw(); return; }
    const p = G.player, w = G.world;
    for (const e of ents.list) {
      if (e.portalCd > 0) e.portalCd -= dt;
      if (!e.leash || e.dead || e.gone) continue;
      let hx, hy, hz;
      if (e.leash === "player") { hx = p.pos.x; hy = p.pos.y; hz = p.pos.z; }
      else {
        const k = e.leash;
        if (w.isLoaded(k.x, k.z) && !isFence(w.id(k.x, k.y, k.z))) { snap(e); continue; }   // the fence was broken
        hx = k.x + 0.5; hy = k.y; hz = k.z + 0.5;
      }
      const dx = hx - e.pos.x, dy = hy - e.pos.y, dz = hz - e.pos.z, d = Math.hypot(dx, dy, dz);
      if (d > LEASH_MAX + (e.leash === "player" && G.riding ? 4 : 0)) { snap(e); continue; }
      if (e.ridden) continue;
      if (d > 4) { e.goal = { x: hx, z: hz, speed: e.def.speed * 1.4 }; e.sitting = false; }
      if (d > 6) { const pull = (d - 6) * 6 * dt; e.vel.x += dx / d * pull; e.vel.z += dz / d * pull; if (e.def.flies || e.def.swims) e.vel.y += dy / d * pull; }
    }
    if ((slow += dt) >= 0.25) { tickSlow(slow); slow = 0; }
    draw();
  }
  function snap(e) {
    e.leash = null; ctx.spawnDrop(I.LEAD, 1, e.pos.x, e.pos.y + 0.6, e.pos.z);
    Sound.place("wood");
  }
  function tickSlow(dt) {
    const w = G.world;
    for (const e of ents.list) {
      if (e.dead || e.gone) continue;
      // Hogbeasts and Boarkin can't stand the air outside the Ember Depths
      const into = ROT[e.sp];
      if (into && G.dim !== "nether" && !e.def.boss) {
        e.rotT = (e.rotT || 0) + dt;
        if (Math.random() < 0.5) ctx.puff(e.pos.x, e.pos.y + e.h * 0.8, e.pos.z, "poof");
        if (e.rotT >= ROT_TIME) {
          const n = ents.add(into, e.pos.x, e.pos.y, e.pos.z, { yaw: e.yaw, baby: e.baby, name: e.name || undefined, persist: e.persist });
          if (n) n.hp = Math.max(1, Math.round(n.maxHp * e.hp / e.maxHp));
          e.gone = true; ctx.puff(e.pos.x, e.pos.y + 1, e.pos.z, "poof"); Sound.mob("snort", ents.dist(e));
          continue;
        }
      }
      // walking into a lit portal: after a few seconds it comes out of the linked portal on the other side
      if ((G.dim === "overworld" || G.dim === "nether") && !(e.portalCd > 0) && portalSafe(e)) {
        const x = Math.floor(e.pos.x), y = Math.floor(e.pos.y + 0.2), z = Math.floor(e.pos.z);
        if (w.id(x, y, z) === B.PORTAL || w.id(x, y + 1, z) === B.PORTAL) {
          e.portalT = (e.portalT || 0) + dt;
          if (e.portalT >= PORTAL_TIME) sendThrough(e, x, w.id(x, y, z) === B.PORTAL ? y : y + 1, z);
        } else e.portalT = 0;
      }
    }
  }
  const portalSafe = e => !e.def.boss && !e.def.object && !e.def.cart && !e.def.boat && !e.ridden && !e.npc && !e.def.noSave && !e.def.segmentedLeviathan && e.leash !== "player" && !(e.def.pet && e.tame && !e.sitting);
  function sendThrough(e, x, y, z) {
    e.portalT = 0;
    const from = ctx.portalAt(x, y, z), links = (G.dimData[G.dim] || {}).links || {};
    const link = from && links[ctx.portalKey(from)];
    if (!link || !G.dimData[link.dim]) { e.portalCd = 10; return; }   // you haven't used this portal yet, so it doesn't lead anywhere
    const tx = (link.axis === 0 ? link.x + (link.w > 1 ? 1 : 0) : link.x) + 0.5, tz = (link.axis === 0 ? link.z : link.z + (link.w > 1 ? 1 : 0)) + 0.5;
    if (e.leash) { ctx.spawnDrop(I.LEAD, 1, e.pos.x, e.pos.y + 0.6, e.pos.z); e.leash = null; }
    const data = { ...e.toJSON(), x: +tx.toFixed(2), y: link.y, z: +tz.toFixed(2), portalCd: PORTAL_REST, persist: true };
    const store = G.dimData[link.dim].entities || (G.dimData[link.dim].entities = {});
    const key = Math.floor(tx / CHUNK) + "," + Math.floor(tz / CHUNK);
    (store[key] = store[key] || []).push(data);
    ctx.puff(e.pos.x, e.pos.y + 1, e.pos.z, "portal");
    e.gone = true;
  }

  // ---------- your mount comes through a portal with you ----------
  function takeMount() {
    const e = G.riding;
    if (!e || !e.def.mount || e.def.segmentedLeviathan || e.def.airMount || e.dead) return null;
    const data = { ...e.toJSON(), leash: null };
    ctx.dismount(true); e.gone = true;
    const i = ents.list.indexOf(e); if (i >= 0) { ents.remove(e); ents.list.splice(i, 1); }
    return data;
  }
  function bringMount(data) {
    if (!data) return;
    const p = G.player, e = ents.add(data.sp, p.pos.x, p.pos.y, p.pos.z, { ...data, portalCd: PORTAL_REST });
    if (e) { e.persist = true; ctx.mount(e); }
  }

  function clear() { for (const uid of [...labels.keys()]) dropLabel(uid); for (const l of lines) l.visible = false; for (const k of knots) k.visible = false; }

  return { interact, useOnBlock, nameTagHTML, mountNameTag, tick, takeMount, bringMount, clear, applyName };
}
