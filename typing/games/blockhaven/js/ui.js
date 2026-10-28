// Menus, the on-screen HUD, and the inventory / crafting / chest / furnace screens.
import { B, I, ITEMS, BLOCKS, RECIPES, SMELT, FUEL, SMELT_TIME, TAGS, itemDef, iconURL, buildAtlas, TILE } from "./blocks.js";
import { maxStack, newStack } from "./inventory.js";
import { Sound } from "./audio.js";

const $ = id => document.getElementById(id);
let G = null;                       // the game (set in init)
const screens = ["title", "worlds", "newWorld", "loading", "pause", "settings", "controls", "death", "panel"];
let current = "title", backTo = "title";
let cursor = null, hoverRef = null, panelKind = null, panelCtx = null, craftFilter = "can", craftSearch = "", creativeCat = "All", creativeSearch = "";

export const UI = {
  init(game) {
    G = game;
    paintTitleScene();
    $("touchWarn").hidden = !(matchMedia("(pointer: coarse)").matches && !matchMedia("(any-pointer: fine)").matches);
    $("btnPlay").onclick = () => { Sound.start(); Sound.click(); this.showWorlds(); };
    $("btnNew").onclick = $("btnNew2").onclick = () => { Sound.start(); Sound.click(); this.show("newWorld"); $("nwName").select(); };
    $("btnSettings").onclick = () => this.openSettings("title");
    $("btnSettings2").onclick = () => this.openSettings("pause");
    $("btnControls").onclick = () => { backTo = "title"; this.show("controls"); };
    $("btnControls2").onclick = () => { backTo = "pause"; this.show("controls"); };
    document.querySelectorAll("[data-back]").forEach(b => b.onclick = () => { Sound.click(); const s = b.closest(".screen").id; this.show(s === "settings" || s === "controls" ? backTo : "title"); });
    $("newForm").onsubmit = e => {
      e.preventDefault(); Sound.start();
      const mode = document.querySelector("input[name=mode]:checked").value;
      const settings = { difficulty: $("nwDiff").value, griefing: $("nwGrief").checked, keepInv: $("nwKeep").checked };
      G.newWorld({ name: $("nwName").value.trim() || "My World", seed: $("nwSeed").value.trim() || String(Math.floor(Math.random() * 1e9)), mode, settings });
    };
    $("btnResume").onclick = () => G.resume();
    $("btnSave").onclick = () => G.saveNow(true);
    $("btnExport").onclick = () => G.exportCurrent();
    $("btnTitle").onclick = () => G.toTitle();
    $("btnRespawn").onclick = () => G.respawn();
    $("clickToPlay").onclick = () => G.resume();
    $("importFile").onchange = async e => {
      const f = e.target.files[0]; e.target.value = "";
      if (!f) return;
      try { await G.importWorld(f); this.toast("World loaded from file!", "good"); this.showWorlds(); }
      catch (err) { this.toast(err.message, "bad"); }
    };
    $("importFile").previousElementSibling.onkeydown = e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); $("importFile").click(); } };
    this.bindSettings();
    $("pDiff").onchange = e => { G.wset.difficulty = e.target.value; this.toast("Difficulty: " + e.target.value); };
    $("pGrief").onchange = e => { G.wset.griefing = e.target.checked; };
    $("pKeep").onchange = e => { G.wset.keepInv = e.target.checked; };
    // inventory screen mouse handling
    const panel = $("panel");
    panel.addEventListener("mousedown", e => this.slotMouse(e));
    panel.addEventListener("contextmenu", e => e.preventDefault());
    panel.addEventListener("mousemove", e => this.hover(e));
    panel.addEventListener("mouseleave", () => { hoverRef = null; $("tooltip").hidden = true; });
    document.addEventListener("mousemove", e => { const c = $("cursorItem"); c.style.left = e.clientX + "px"; c.style.top = e.clientY + "px"; });
  },

  show(name) {
    current = name;
    for (const s of screens) $(s).hidden = s !== name;
    $("hud").hidden = !(name === "none" || name === "panel" || name === "pause" || name === "death");
    if (name === "title") paintTitleScene();
    if (name === "pause" && G.wset) { $("pDiff").value = G.wset.difficulty; $("pGrief").checked = G.wset.griefing; $("pKeep").checked = G.wset.keepInv; }
  },
  get current() { return current; },

  async showWorlds() {
    this.show("worlds");
    const list = $("worldList"), worlds = await G.listWorlds();
    $("storageWarn").hidden = await G.storageOK();
    list.innerHTML = worlds.length ? "" : `<p class="empty">No worlds yet. Make your first one!</p>`;
    for (const w of worlds) {
      const row = document.createElement("div"); row.className = "world";
      const when = w.played ? new Date(w.played).toLocaleDateString() : "";
      row.innerHTML = `<div><b></b><small>${w.mode === "creative" ? "Creative" : "Survival"} • Day ${w.day || 1} • Seed <span></span> • ${when}</small></div>
        <div class="acts"><button class="btn small primary" data-a="play">Play</button><button class="btn small" data-a="dl">Download</button><button class="btn small danger" data-a="del">Delete</button></div>`;
      row.querySelector("b").textContent = w.name; row.querySelector("small span").textContent = w.seed;
      row.querySelector("[data-a=play]").onclick = () => { Sound.click(); G.loadWorld(w.id); };
      row.querySelector("[data-a=dl]").onclick = () => G.exportWorld(w.id);
      row.querySelector("[data-a=del]").onclick = () => this.confirm(`Delete "${w.name}"?`, "This removes the world from this device for good. Download it first if you might want it later.", async () => { await G.deleteWorld(w.id); this.showWorlds(); });
      list.appendChild(row);
    }
  },
  confirm(title, text, yes) {
    $("confirmTitle").textContent = title; $("confirmText").textContent = text; $("confirm").hidden = false;
    $("confirmYes").onclick = () => { $("confirm").hidden = true; yes(); };
    $("confirmNo").onclick = () => { $("confirm").hidden = true; };
    $("confirmNo").focus();
  },

  setLoading(frac, text) { $("loadBar").style.width = Math.round(frac * 100) + "%"; if (text) $("loadText").textContent = text; },

  // ---------- settings ----------
  openSettings(from) { backTo = from; Sound.click(); this.syncSettings(); this.show("settings"); },
  syncSettings() {
    const s = G.settings;
    $("sSens").value = s.sensitivity; $("oSens").textContent = s.sensitivity.toFixed(1);
    $("sVol").value = s.volume; $("oVol").textContent = Math.round(s.volume * 100) + "%";
    $("sMute").checked = s.muted; $("sDist").value = s.renderDist; $("oDist").textContent = s.renderDist + " chunks";
    $("sQuality").value = s.quality; $("sFov").value = s.fov; $("oFov").textContent = s.fov + "°"; $("sMotion").checked = s.reducedMotion;
  },
  bindSettings() {
    const upd = (k, v) => { G.settings[k] = v; G.applySettings(k); this.syncSettings(); };
    $("sSens").oninput = e => upd("sensitivity", +e.target.value);
    $("sVol").oninput = e => upd("volume", +e.target.value);
    $("sMute").onchange = e => upd("muted", e.target.checked);
    $("sDist").oninput = e => upd("renderDist", +e.target.value);
    $("sQuality").onchange = e => upd("quality", e.target.value);
    $("sFov").oninput = e => upd("fov", +e.target.value);
    $("sMotion").onchange = e => upd("reducedMotion", e.target.checked);
    const fsOK = document.fullscreenEnabled && document.documentElement.requestFullscreen;
    $("fsRow").hidden = !fsOK;
    $("btnFull").onclick = () => { if (document.fullscreenElement) document.exitFullscreen(); else document.documentElement.requestFullscreen().catch(() => this.toast("Full screen isn't allowed here.", "bad")); };
  },

  // ---------- HUD ----------
  hud() {
    const inv = G.inv, sel = G.selected;
    const bar = $("hotbar");
    if (bar.children.length !== 9) bar.innerHTML = Array.from({ length: 9 }, () => `<div class="slot"></div>`).join("");
    for (let i = 0; i < 9; i++) { fillSlot(bar.children[i], inv.slots[i]); bar.children[i].classList.toggle("sel", i === sel); }
    const survival = G.mode === "survival", p = G.player;
    $("stats").style.visibility = survival ? "visible" : "hidden";
    $("hearts").innerHTML = icons(p.health, "heart");
    $("food").innerHTML = icons(p.hunger, "food", true);
    $("air").innerHTML = survival && p.air < 10 ? icons(Math.ceil(p.air) * 2, "bubble") : "";
    let armor = 0; for (let i = 36; i < 40; i++) { const s = inv.slots[i]; if (s && itemDef(s.id).armor) armor += itemDef(s.id).armor.points; }
    $("armor").innerHTML = survival && armor ? icons(armor, "shield") : "";
    const lv = G.levelInfo(); $("xpbar").style.visibility = survival ? "visible" : "hidden";
    $("xpbar").querySelector("i").style.width = Math.round(lv.frac * 100) + "%"; $("xpbar").querySelector("b").textContent = lv.level ? lv.level : "";
    const names = { poison: "☠️ Poisoned", queasy: "🤢 Queasy", fire: "🔥 On fire" };
    $("effects").innerHTML = Object.keys(G.effects).map(k => `<span>${names[k] || k}</span>`).join("");
    $("modeTag").textContent = survival ? "" : "CREATIVE" + (p.flying ? " • FLYING" : "");
  },
  itemName(text) { const el = $("itemName"); el.textContent = text; el.style.opacity = 1; clearTimeout(el._t); el._t = setTimeout(() => el.style.opacity = 0, 1600); },
  toast(text, kind = "") {
    const box = $("toasts");
    while (box.children.length > 3) box.firstChild.remove();
    const t = document.createElement("div"); t.className = "toast " + kind; t.textContent = text; box.appendChild(t);
    setTimeout(() => t.remove(), 2700);
  },
  saved() { const d = $("saveDot"); d.classList.add("on"); clearTimeout(d._t); d._t = setTimeout(() => d.classList.remove("on"), 1500); },
  flash() { const f = $("flash"); f.classList.add("on"); requestAnimationFrame(() => requestAnimationFrame(() => f.classList.remove("on"))); },
  tip(html) { const t = $("tip"); if (!html) { t.hidden = true; return; } t.innerHTML = `<small>TIP</small>` + html; t.hidden = false; },

  // ---------- panels ----------
  get panelOpen() { return !!panelKind; },
  openPanel(kind, ctx = null) {
    panelKind = kind; panelCtx = ctx; cursor = null; craftSearch = ""; creativeSearch = "";
    this.show("panel"); this.renderPanel();
  },
  closePanel() {
    if (cursor) { const left = G.inv.add(cursor.id, cursor.n, cursor); if (left) G.dropItem(cursor.id, left, cursor); cursor = null; }
    panelKind = null; panelCtx = null; $("cursorItem").hidden = true; $("tooltip").hidden = true;
    this.hud();
  },
  refreshPanel() { if (panelKind) this.renderPanel(true); },

  renderPanel(soft) {
    const p = $("panel");
    const scroll = p.querySelector(".recipes, .palette");
    const keep = scroll ? scroll.scrollTop : 0;
    const focusId = document.activeElement && document.activeElement.id;
    const armorCol = panelKind === "inventory" ? `<div class="armor-col" title="Armor">${[36, 37, 38, 39].map(i => { const s = G.inv.slots[i]; return `<div class="slot ${s ? "" : "empty-armor"}" data-ref="inv:${i}">${s ? stackInner(s) : `<span class="ghost">${["🪖", "👕", "👖", "👢"][i - 36]}</span>`}</div>`; }).join("")}</div>` : "";
    const inv = `<div class="inv-card"><h3>Inventory${G.mode === "survival" ? ` <span class="note" style="color:#444">Level ${G.levelInfo().level}</span>` : ""}</h3><div class="inv-row">${armorCol}<div><div class="grid9">${slots("inv", 9, 36)}</div><div class="grid9 hotrow">${slots("inv", 0, 9)}</div></div></div>
      <p class="help">Click: pick up / put down • Right-click: half / one • Shift-click: move across • Point + 1–9: swap to hotbar${armorCol ? " • Armor goes in the left column" : ""}</p></div>`;
    let left = "";
    if (panelKind === "chest") {
      left = `<div class="inv-card"><h3>Chest</h3><div class="grid9">${slots("box", 0, 27)}</div><p class="help">Things in a chest stay saved. Breaking the chest drops everything inside.</p></div>`;
      p.innerHTML = `<div style="display:grid;gap:12px">${left}${inv}</div>`;
    } else if (panelKind === "furnace") {
      const f = G.world.containers.get(panelCtx);
      const prog = f ? f.prog / SMELT_TIME : 0, burn = f && f.burnMax ? f.burn / f.burnMax : 0;
      left = `<div class="inv-card"><h3>Furnace</h3>
        <div class="furnace">
          <div><div class="label">Cook this</div>${slotHTML("fur:0")}</div>
          <div class="arrow" title="Progress"><i style="width:${Math.round(prog * 100)}%"></i></div>
          <div><div class="label">Result</div>${slotHTML("fur:2")}</div>
          <div><div class="flame" title="Fuel left"><i style="height:${Math.round(burn * 100)}%"></i></div><div class="label">Fuel</div>${slotHTML("fur:1")}</div>
        </div>
        <p class="help">Put ore, sand, cobblestone, clay, or logs on top and fuel (coal, wood, planks, sticks) below. The furnace keeps working while you explore.</p></div>`;
      p.innerHTML = `<div style="display:grid;gap:12px">${left}${inv}</div>`;
    } else if (G.mode === "creative") {
      const cats = ["All", "Building", "Nature", "Useful", "Tools", "Food", "Items", "Creatures"];
      const list = Object.values(ITEMS).filter(d => (creativeCat === "All" || d.category === creativeCat) && d.name.toLowerCase().includes(creativeSearch.toLowerCase()));
      left = `<div class="inv-card"><h3>Every block <span class="note" style="color:#444">Click to grab a stack</span></h3>
        <div class="filters"><input id="cSearch" placeholder="Search blocks…" value="${escapeAttr(creativeSearch)}">${cats.map(c => `<button class="chip-btn" data-cat="${c}" aria-pressed="${c === creativeCat}">${c}</button>`).join("")}</div>
        <div class="palette">${list.map(d => `<div class="slot" data-ref="new:${d.id}" title="${escapeAttr(d.name)}"><img src="${iconURL(d.id)}" alt=""></div>`).join("")}</div>
        <div class="grid9" style="margin-top:8px">${`<div class="slot trash" data-ref="trash" title="Drop an item here to delete it">🗑️</div>`}</div></div>`;
      p.innerHTML = `<div class="inv-wrap">${left}${inv}</div>`;
      const cs = $("cSearch");
      cs.oninput = e => { creativeSearch = e.target.value; this.renderPanel(); };
      p.querySelectorAll("[data-cat]").forEach(b => b.onclick = () => { creativeCat = b.dataset.cat; this.renderPanel(); });
    } else {
      const atTable = panelKind === "table";
      left = `<div class="inv-card"><h3>${atTable ? "Workbench crafting" : "Crafting"} <span class="note" style="color:#444">${atTable ? "All recipes" : "Use a Workbench for more"}</span></h3>
        <div class="filters"><input id="rSearch" placeholder="Search recipes…" value="${escapeAttr(craftSearch)}">
          <button class="chip-btn" data-f="can" aria-pressed="${craftFilter === "can"}">Can make</button><button class="chip-btn" data-f="all" aria-pressed="${craftFilter === "all"}">All recipes</button></div>
        <div class="recipes">${recipeRows(atTable)}</div>
        <p class="help">Click <b>Make</b> to craft once. Shift-click <b>Make</b> to craft as many as you can.</p></div>`;
      p.innerHTML = `<div class="inv-wrap">${left}${inv}</div>`;
      $("rSearch").oninput = e => { craftSearch = e.target.value; this.renderPanel(); };
      p.querySelectorAll("[data-f]").forEach(b => b.onclick = () => { craftFilter = b.dataset.f; Sound.click(); this.renderPanel(); });
      p.querySelectorAll("[data-craft]").forEach(b => b.onclick = e => { G.craft(RECIPES[+b.dataset.craft], e.shiftKey); });
    }
    const sc = p.querySelector(".recipes, .palette"); if (sc) sc.scrollTop = keep;
    if (focusId && $(focusId) && !soft) { const el = $(focusId); el.focus(); if (el.setSelectionRange) el.setSelectionRange(el.value.length, el.value.length); }
    else if (focusId && $(focusId)) $(focusId).focus();
    drawCursor();
  },

  // Mouse button on a slot
  slotMouse(e) {
    const el = e.target.closest("[data-ref]");
    if (!el) return;
    e.preventDefault();
    const ref = el.dataset.ref, right = e.button === 2;
    if (ref.startsWith("new:")) {   // creative palette
      const id = +ref.slice(4);
      if (e.shiftKey) { G.inv.add(id, maxStack(id)); }
      else cursor = cursor && cursor.id === id && !right ? { ...cursor, n: maxStack(id) } : newStack(id, right ? 1 : maxStack(id));
      Sound.click(); this.renderPanel(true); this.hud(); return;
    }
    if (ref === "trash") { cursor = null; Sound.click(); this.renderPanel(true); return; }
    if (e.shiftKey && !right) { quickMove(ref); }
    else {
      const s = getSlot(ref), max = cursor ? maxStack(cursor.id) : 0;
      if (ref === "fur:2") {   // furnace output: take only
        if (s && (!cursor || (cursor.id === s.id && cursor.n + s.n <= maxStack(s.id)))) { cursor = cursor ? { ...cursor, n: cursor.n + s.n } : s; setSlot(ref, null); G.onTakeSmelted(s); }
      } else if (!right) {
        if (!cursor) { if (s) { cursor = s; setSlot(ref, null); } }
        else if (!s) { if (accepts(ref, cursor)) { setSlot(ref, cursor); cursor = null; } else bad(ref); }
        else if (s.id === cursor.id && max > 1) { const k = Math.min(cursor.n, max - s.n); s.n += k; cursor.n -= k; if (!cursor.n) cursor = null; }
        else if (accepts(ref, cursor)) { setSlot(ref, cursor); cursor = s; } else bad(ref);
      } else {
        if (!cursor && s) { const half = Math.ceil(s.n / 2); cursor = { ...s, n: half }; s.n -= half; if (!s.n) setSlot(ref, null); }
        else if (cursor && accepts(ref, cursor)) {
          if (!s) { setSlot(ref, { ...cursor, n: 1 }); cursor.n--; }
          else if (s.id === cursor.id && s.n < maxStack(s.id)) { s.n++; cursor.n--; }
          if (cursor.n <= 0) cursor = null;
        }
      }
    }
    Sound.click(); G.inventoryChanged(); this.renderPanel(true); this.hud();
  },
  hover(e) {
    const el = e.target.closest("[data-ref]"), tip = $("tooltip");
    hoverRef = el ? el.dataset.ref : null;
    let s = null;
    if (hoverRef && hoverRef.startsWith("new:")) s = { id: +hoverRef.slice(4), n: 1 };
    else if (hoverRef && hoverRef !== "trash") s = getSlot(hoverRef);
    if (!s || cursor) { tip.hidden = true; return; }
    const d = itemDef(s.id);
    tip.innerHTML = ""; tip.append(d.name);
    if (d.tool) { const sm = document.createElement("small"); sm.textContent = `Uses left: ${s.dur ?? d.tool.dur} / ${d.tool.dur}`; tip.append(sm); }
    if (d.food) { const sm = document.createElement("small"); sm.textContent = "Right-click while holding it to eat"; tip.append(sm); }
    tip.hidden = false; tip.style.left = e.clientX + 16 + "px"; tip.style.top = e.clientY + 12 + "px";
  },
  // number keys while pointing at a slot swap it with that hotbar slot
  hotkey(n) {
    if (!hoverRef || !(hoverRef.startsWith("inv:") || hoverRef.startsWith("box:") || hoverRef.startsWith("fur:"))) return false;
    const target = "inv:" + n, a = getSlot(hoverRef), b = getSlot(target);
    if (hoverRef === target) return true;
    if (b && !accepts(hoverRef, b)) return true;
    if (hoverRef === "fur:2" && b) return true;
    setSlot(target, a); setSlot(hoverRef, b);
    Sound.click(); G.inventoryChanged(); this.renderPanel(true); this.hud();
    return true;
  }
};

// ---------- slot helpers ----------
function getSlot(ref) {
  const [kind, i] = ref.split(":"), n = +i;
  if (kind === "inv") return G.inv.slots[n];
  const c = G.world.containers.get(panelCtx);
  return c ? c.slots[n] : null;
}
function setSlot(ref, s) {
  const [kind, i] = ref.split(":"), n = +i;
  if (kind === "inv") G.inv.slots[n] = s;
  else { const c = G.world.containers.get(panelCtx); if (c) c.slots[n] = s; }
}
function accepts(ref, s) {
  if (/^inv:3[6-9]$/.test(ref)) { const d = itemDef(s.id); return !!(d && d.armor && d.armor.slot === +ref.slice(4) - 36); }
  if (ref === "fur:0") return SMELT[s.id] !== undefined;
  if (ref === "fur:1") return FUEL[s.id] !== undefined;
  if (ref === "fur:2") return false;
  return true;
}
function bad(ref) {
  Sound.error();
  UI.toast(ref === "fur:0" ? "That can't be cooked in a furnace." : ref === "fur:1" ? "That won't burn. Try coal or wood." : "That can't go there.", "bad");
}
// Shift-click: send a stack to the other side
function quickMove(ref) {
  const s = getSlot(ref);
  if (!s) return;
  const [kind, i] = ref.split(":"), n = +i;
  let targets;
  if (kind === "inv") {
    if (panelKind === "chest") targets = range("box", 0, 27);
    else if (panelKind === "furnace") targets = SMELT[s.id] !== undefined ? ["fur:0"] : FUEL[s.id] !== undefined ? ["fur:1"] : [];
    else if (n >= 36) targets = [...range("inv", 9, 36), ...range("inv", 0, 9)];
    else if (itemDef(s.id).armor && panelKind === "inventory" && !G.inv.slots[36 + itemDef(s.id).armor.slot]) targets = ["inv:" + (36 + itemDef(s.id).armor.slot)];
    else targets = n < 9 ? range("inv", 9, 36) : range("inv", 0, 9);
  } else targets = [...range("inv", 0, 9), ...range("inv", 9, 36)];
  if (!targets.length) { bad("fur:0"); return; }
  const max = maxStack(s.id);
  for (const t of targets) { const d = getSlot(t); if (d && d.id === s.id && d.n < max) { const k = Math.min(s.n, max - d.n); d.n += k; s.n -= k; if (!s.n) break; } }
  for (const t of targets) { if (!s.n) break; if (!getSlot(t) && accepts(t, s)) { setSlot(t, { ...s }); s.n = 0; } }
  if (!s.n) setSlot(ref, null);
  if (ref === "fur:2") G.onTakeSmelted(s);
}
const range = (k, a, b) => Array.from({ length: b - a }, (_, i) => k + ":" + (a + i));

function slots(kind, a, b) { return range(kind, a, b).map(slotHTML).join(""); }
function slotHTML(ref) {
  const s = getSlot(ref);
  return `<div class="slot" data-ref="${ref}">${stackInner(s)}</div>`;
}
function stackInner(s) {
  if (!s) return "";
  const d = itemDef(s.id);
  let h = `<img src="${iconURL(s.id)}" alt="">`;
  if (s.n > 1) h += `<b>${s.n}</b>`;
  if (d && d.tool && s.dur < d.tool.dur) { const f = s.dur / d.tool.dur; h += `<span class="dur"><i style="width:${Math.round(f * 100)}%;background:${f > 0.5 ? "#5fd35f" : f > 0.2 ? "#f5c431" : "#e0453a"}"></i></span>`; }
  return h;
}
function fillSlot(el, s) { el.innerHTML = stackInner(s); }
function drawCursor() {
  const c = $("cursorItem");
  c.hidden = !cursor; c.innerHTML = cursor ? stackInner(cursor).replace(/<span class="dur">.*<\/span>/, "") : "";
}
const escapeAttr = s => String(s).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");

function recipeRows(atTable) {
  const q = craftSearch.toLowerCase(), rows = [];
  RECIPES.forEach((r, i) => {
    const out = itemDef(r.out[0]);
    if (q && !out.name.toLowerCase().includes(q)) return;
    const have = r.ins.map(([id, n]) => [id, n, G.inv.count(id)]);
    const enough = have.every(([, n, h]) => h >= n), place = !r.table || atTable, ok = enough && place;
    if (craftFilter === "can" && !ok) return;
    const ins = have.map(([id, n, h]) => {
      const shown = typeof id === "string" ? TAGS[id][0] : id, label = typeof id === "string" ? "any " + id : itemDef(id).name;
      return `<span class="${h >= n ? "" : "miss"}" title="${escapeAttr(label)}"><img src="${iconURL(shown)}" alt="">${Math.min(h, 999)}/${n}</span>`;
    }).join("");
    rows.push({ ok, html: `<div class="recipe ${ok ? "ok" : ""}"><div class="out"><img src="${iconURL(r.out[0])}" alt="">${r.out[1] > 1 ? `<b>${r.out[1]}</b>` : ""}</div>
      <div><div class="name">${escapeAttr(out.name)}${r.out[1] > 1 ? " ×" + r.out[1] : ""}</div><div class="ins">${ins}</div>${!place ? `<div class="need">Needs a Workbench</div>` : ""}</div>
      <button class="btn small ${ok ? "primary" : ""}" data-craft="${i}" ${ok ? "" : "disabled"}>Make</button></div>` });
  });
  rows.sort((a, b) => b.ok - a.ok);
  if (!rows.length) return `<p class="note" style="color:#444">${craftFilter === "can" ? "Nothing you can make yet. Chop a tree (hold left click on a log) to get started, or press <b>All recipes</b>." : "No recipes match."}</p>`;
  return rows.map(r => r.html).join("");
}

// ---------- little icons for health, food, and air ----------
const iconCache = {};
function iconImg(kind, part) {
  const key = kind + part;
  if (iconCache[key]) return iconCache[key];
  const c = document.createElement("canvas"); c.width = c.height = 9; const x = c.getContext("2d");
  const shapes = {
    heart: ["011000110", "111101111", "111111111", "111111111", "011111110", "001111100", "000111000", "000010000"],
    food: ["000001100", "000011110", "000111110", "001111110", "011111100", "111111000", "011110000", "001000000"],
    bubble: ["001111100", "010000010", "100100001", "100000001", "100000001", "010000010", "001111100"],
    shield: ["111111111", "111111111", "111111111", "111111111", "011111110", "001111100", "000111000", "000010000"]
  };
  const color = { heart: ["#e0302a", "#ff8a80"], food: ["#c47a3a", "#f0b070"], bubble: ["#7fd0ff", "#ffffff"], shield: ["#b8c0c8", "#ffffff"] }[kind];
  shapes[kind].forEach((row, y) => [...row].forEach((ch, xx) => {
    if (ch !== "1") return;
    const empty = part === 0 || (part === 1 && xx > 4);
    x.fillStyle = empty ? "rgba(30,30,30,.65)" : y < 2 && xx < 4 ? color[1] : color[0];
    x.fillRect(xx, y, 1, 1);
  }));
  return (iconCache[key] = c.toDataURL());
}
function icons(value, kind) {
  let h = "";
  for (let i = 0; i < 10; i++) { const v = value - i * 2, part = v >= 2 ? 2 : v >= 1 ? 1 : 0; h += `<i style="background-image:url(${iconImg(kind, part)})"></i>`; }
  return h;
}

// ---------- title screen landscape (drawn from the block textures) ----------
function paintTitleScene() {
  const c = $("titleScene"), x = c.getContext("2d"), atlas = buildAtlas();
  x.imageSmoothingEnabled = false; x.clearRect(0, 0, c.width, c.height);
  const tile = (name, gx, gy) => x.drawImage(atlas, (TILE[name] % 16) * 16, Math.floor(TILE[name] / 16) * 16, 16, 16, gx * 16, gy * 16, 16, 16);
  const heights = [5, 5, 4, 4, 4, 5, 5, 6, 6, 5, 4, 3, 3, 4, 4, 5, 5, 4, 4, 5];
  heights.forEach((h, gx) => {
    for (let gy = 9; gy >= 0; gy--) {
      const depth = 9 - gy;
      if (depth > h) continue;
      tile(depth === h ? "grass_side" : depth > h - 3 ? "dirt" : "stone", gx, gy);
    }
  });
  const tree = (gx, base) => { for (let k = 1; k <= 3; k++) tile("log_side", gx, base - k); for (const [dx, dy] of [[-1, -4], [0, -4], [1, -4], [-1, -5], [0, -5], [1, -5], [0, -6]]) tile("leaves", gx + dx, base + dy); };
  tree(3, 9 - heights[3]); tree(15, 9 - heights[15]); tile("flower_red", 8, 9 - heights[8] - 1); tile("tall_grass", 11, 9 - heights[11] - 1); tile("flower_yellow", 18, 9 - heights[18] - 1);
  tile("table_side", 6, 9 - heights[6] - 1); tile("torch", 13, 9 - heights[13] - 1);
}
