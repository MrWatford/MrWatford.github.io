// Menus, the on-screen HUD, and the inventory / crafting / chest / furnace screens.
import { B, I, ITEMS, BLOCKS, RECIPES, SMELT, FUEL, SMELT_TIME, TAGS, itemDef, iconURL, buildAtlas, TILE } from "./blocks.js";
import { TRADES } from "./entities.js";
import { maxStack, newStack, OFF } from "./inventory.js";
import { Adv, CATEGORIES } from "./advancements.js";
import { Sound } from "./audio.js";

const $ = id => document.getElementById(id);
let G = null;                       // the game (set in init)
const screens = ["title", "worlds", "newWorld", "loading", "pause", "settings", "controls", "death", "panel", "skins"];
let current = "title", backTo = "title", skinFrom = "title", skinPick = "explorer";
let cursor = null, hoverRef = null, panelKind = null, panelCtx = null, craftFilter = "can", craftSearch = "", creativeCat = "All", creativeSearch = "", advCat = CATEGORIES[0];

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
    $("btnSkins").onclick = () => this.openSkins("title");
    $("btnSkins2").onclick = () => this.openSkins("pause");
    $("skinApply").onclick = () => { G.applySkin(skinPick); Sound.craft(); this.closeSkins(); };
    $("skinCancel").onclick = () => { Sound.click(); this.closeSkins(); };
    $("btnControls2").onclick = () => { backTo = "pause"; this.show("controls"); };
    document.querySelectorAll("[data-back]").forEach(b => b.onclick = () => { Sound.click(); const s = b.closest(".screen").id; this.show(s === "settings" || s === "controls" ? backTo : "title"); });
    $("newForm").onsubmit = e => {
      e.preventDefault(); Sound.start();
      const mode = document.querySelector("input[name=mode]:checked").value;
      const settings = { difficulty: $("nwDiff").value, griefing: $("nwGrief").checked, keepInv: $("nwKeep").checked };
      const go = () => G.newWorld({ name: $("nwName").value.trim() || "My World", seed: $("nwSeed").value.trim() || String(Math.floor(Math.random() * 1e9)), mode, settings });
      if (mode === "hardcore") this.confirm("Start a Hardcore world?", "Hardcore is Survival on Hard difficulty with one life. If you faint, this world's adventure ends for good: you drop everything and can only look around as a Spectator afterward. The difficulty can't be changed.", go, "Start Hardcore");
      else go();
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
    $("pDiff").onchange = e => { if (G.meta && G.meta.hardcore) { e.target.value = "hard"; return; } G.wset.difficulty = e.target.value; this.toast("Difficulty: " + e.target.value); };
    $("btnAdv").onclick = () => { Sound.click(); G.openAdvancements(); };
    $("nwModes").onchange = () => { const hc = document.querySelector("input[name=mode]:checked").value === "hardcore"; $("nwDiff").disabled = $("nwKeep").disabled = hc; if (hc) { $("nwDiff").value = "hard"; $("nwKeep").checked = false; } };
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
    if (name === "pause" && G.wset) { const hc = !!(G.meta && G.meta.hardcore); $("pDiff").value = G.wset.difficulty; $("pGrief").checked = G.wset.griefing; $("pKeep").checked = G.wset.keepInv; $("pDiff").disabled = $("pKeep").disabled = hc; $("hcNote").hidden = !hc; }
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
      row.innerHTML = `<div><b></b><small>${w.hardcore ? (w.hardcoreOver ? "💀 Hardcore (ended)" : "💀 Hardcore") : w.mode === "creative" ? "Creative" : "Survival"} • Day ${w.day || 1} • Seed <span></span> • ${when}</small></div>
        <div class="acts"><button class="btn small primary" data-a="play">Play</button><button class="btn small" data-a="dl">Download</button><button class="btn small danger" data-a="del">Delete</button></div>`;
      row.querySelector("b").textContent = w.name; row.querySelector("small span").textContent = w.seed;
      row.querySelector("[data-a=play]").onclick = () => { Sound.click(); G.loadWorld(w.id); };
      row.querySelector("[data-a=dl]").onclick = () => G.exportWorld(w.id);
      row.querySelector("[data-a=del]").onclick = () => this.confirm(`Delete "${w.name}"?`, "This removes the world from this device for good. Download it first if you might want it later.", async () => { await G.deleteWorld(w.id); this.showWorlds(); });
      list.appendChild(row);
    }
  },
  confirm(title, text, yes, yesLabel = "Delete") {
    $("confirmTitle").textContent = title; $("confirmText").textContent = text; $("confirm").hidden = false; $("confirmYes").textContent = yesLabel;
    $("confirmYes").onclick = () => { $("confirm").hidden = true; yes(); };
    $("confirmNo").onclick = () => { $("confirm").hidden = true; };
    $("confirmNo").focus();
  },

  openNote(title, text, first) { G.openNoteRaw({ title, text, first }); },
  // ---------- skin chooser ----------
  openSkins(from) {
    skinFrom = from; skinPick = G.settings.skin; Sound.click();
    const grid = $("skinGrid"); grid.innerHTML = "";
    for (const s of G.skins) {
      const locked = s.locked && !(G.settings.unlocked || []).includes(s.id);
      const b = document.createElement("button"); b.className = "skin-card" + (locked ? " locked" : ""); b.type = "button"; b.dataset.skin = s.id;
      if (locked) { b.disabled = true; b.title = s.unlock; }
      b.setAttribute("aria-pressed", s.id === skinPick);
      b.appendChild(G.skinThumb(s.id));
      const n = document.createElement("span"); n.textContent = s.name; b.appendChild(n);
      b.onclick = () => { skinPick = s.id; Sound.click(); this.pickSkin(); };
      grid.appendChild(b);
    }
    this.show("skins");
    this.pickSkin();
  },
  pickSkin() {
    const s = G.skins.find(k => k.id === skinPick) || G.skins[0];
    document.querySelectorAll(".skin-card").forEach(b => b.setAttribute("aria-pressed", b.dataset.skin === s.id));
    $("skinName").textContent = s.name; $("skinDesc").textContent = s.desc;
    $("skinNote").hidden = s.id !== "watford";
    $("skinCurrent").textContent = s.id === G.settings.skin ? "You're wearing this skin." : "";
    if (!G.openSkinPreview($("skinPreview"), s.id)) $("skinPreview").replaceWith(G.skinThumb(s.id));
  },
  closeSkins() { G.closeSkinPreview(); this.show(skinFrom === "pause" ? "pause" : "title"); },
  setLoading(frac, text) { $("loadBar").style.width = Math.round(frac * 100) + "%"; if (text) $("loadText").textContent = text; },

  // ---------- settings ----------
  openSettings(from) { backTo = from; Sound.click(); this.syncSettings(); this.show("settings"); },
  syncSettings() {
    const s = G.settings;
    $("sSens").value = s.sensitivity; $("oSens").textContent = s.sensitivity.toFixed(1);
    $("sVol").value = s.volume; $("oVol").textContent = Math.round(s.volume * 100) + "%";
    $("sMute").checked = s.muted; $("sDist").value = s.renderDist; $("oDist").textContent = s.renderDist + " chunks";
    $("sQuality").value = s.quality; $("sFov").value = s.fov; $("oFov").textContent = s.fov + "°"; $("sMotion").checked = s.reducedMotion;
    $("sSwap").textContent = keyName(s.keySwap);
    $("sFwAmb").value = s.fwAmbient; $("oFwAmb").textContent = Math.round(s.fwAmbient * 100) + "%";
    $("sFwSud").value = s.fwSudden; $("oFwSud").textContent = Math.round(s.fwSudden * 100) + "%";
    $("sFwFx").checked = s.fwEffects !== false; $("sFwShake").checked = s.fwShake !== false; $("sFwWords").checked = s.fwWords !== false; $("sLostCalm").checked = !!s.lostReduced;
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
    $("sFwAmb").oninput = e => upd("fwAmbient", +e.target.value);
    $("sFwSud").oninput = e => upd("fwSudden", +e.target.value);
    $("sFwFx").onchange = e => upd("fwEffects", e.target.checked);
    $("sFwShake").onchange = e => upd("fwShake", e.target.checked);
    $("sFwWords").onchange = e => upd("fwWords", e.target.checked);
    $("sLostCalm").onchange = e => upd("lostReduced", e.target.checked);
    // pick the swap-hands key: click, then press a key (keys the game already uses aren't allowed)
    const TAKEN = ["KeyW", "KeyA", "KeyS", "KeyD", "KeyE", "KeyQ", "KeyC", "KeyR", "KeyF", "KeyL", "Space", "Escape", "ShiftLeft", "ShiftRight", "Tab", "F3", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"];
    $("sSwap").onclick = () => {
      $("sSwap").textContent = "Press a key…";
      const pick = e => {
        e.preventDefault(); e.stopPropagation(); window.removeEventListener("keydown", pick, true);
        if (TAKEN.includes(e.code) || /^Digit/.test(e.code)) { this.toast("That key is already used for something else.", "bad"); this.syncSettings(); return; }
        upd("keySwap", e.code);
      };
      window.addEventListener("keydown", pick, true);
    };
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
    fillSlot($("offslot"), inv.slots[OFF]); $("offslot").classList.toggle("empty", !inv.slots[OFF]);
    const survival = G.mode === "survival", p = G.player;
    $("bottom").hidden = G.mode === "spectator";
    $("stats").style.visibility = survival ? "visible" : "hidden";
    $("hearts").innerHTML = icons(p.health, "heart") + (G.absorb > 0 ? icons(G.absorb, "gold", false, Math.ceil(G.absorb / 2)) : "");
    $("food").innerHTML = icons(p.hunger, "food", true);
    $("air").innerHTML = survival && p.air < 10 ? icons(Math.ceil(p.air) * 2, "bubble") : "";
    let armor = 0; for (let i = 36; i < 40; i++) { const s = inv.slots[i]; if (s && itemDef(s.id).armor) armor += itemDef(s.id).armor.points; }
    $("armor").innerHTML = survival && armor ? icons(armor, "shield") : "";
    const lv = G.levelInfo(); $("xpbar").style.visibility = survival ? "visible" : "hidden";
    $("xpbar").querySelector("i").style.width = Math.round(lv.frac * 100) + "%"; $("xpbar").querySelector("b").textContent = lv.level ? lv.level : "";
    const names = { poison: "☠️ Poisoned", queasy: "🤢 Queasy", fire: "🔥 On fire", blight: "💀 Blighted", levitation: "🎈 Floating", regen: "💖 Regenerating", swift: "💨 Swift", dolphin: "🐬 Swift swimmer", absorb: "💛 Absorption", fireRes: "🧯 Fire Resistance", haste: "⛏️ Haste", resist: "🛡️ Resistance", jump: "🐇 Jump Boost", strength: "💪 Strength" };
    const roman = k => (G.elv[k] || 1) > 1 ? " " + ["", "I", "II", "III", "IV"][G.elv[k]] : "";
    $("effects").innerHTML = Object.keys(G.effects).map(k => `<span>${names[k] || k}${roman(k)} <small>${Math.ceil(G.effects[k])}s</small></span>`).join("");
    $("modeTag").textContent = G.mode === "spectator" ? "SPECTATOR • HARDCORE OVER" : survival ? (G.meta && G.meta.hardcore ? "HARDCORE" : "") : "CREATIVE" + (p.flying ? " • FLYING" : "");
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
  totem() {
    const t = $("totemPop"); t.innerHTML = `<img src="${iconURL(I.TOTEM)}" alt="">`; t.hidden = false;
    t.classList.remove("go"); void t.offsetWidth; t.classList.add("go");
    clearTimeout(t._t); t._t = setTimeout(() => { t.hidden = true; }, 1800);
  },
  death(hardcore) {
    $("deathTitle").textContent = hardcore ? "Game over!" : "You fainted!";
    $("deathNote").textContent = hardcore ? "This was a Hardcore world, so its adventure is over. You can still fly around it as a Spectator to look at what you built." : G.wset.keepInv ? "You'll wake up at your bed (or the starting spot), and you keep everything you were carrying." : "You'll wake up at your bed (or the starting spot). Your things were dropped where you fainted, so go back for them soon (dropped items vanish after 5 minutes).";
    $("btnRespawn").textContent = hardcore ? "Spectate this world" : "Wake up";
    $("btnDeathTitle").hidden = !hardcore;
    this.show("death");
  },
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
    const ghostSlot = (i, ghost, title) => { const s = G.inv.slots[i]; return `<div class="slot ${s ? "" : "empty-armor"}" data-ref="inv:${i}" title="${title}">${s ? stackInner(s) : `<span class="ghost">${ghost}</span>`}</div>`; };
    const armorCol = panelKind === "inventory" ? `<div class="armor-col">${[36, 37, 38, 39].map(i => ghostSlot(i, ["🪖", "👕", "👖", "👢"][i - 36], "Armor")).join("")}<div class="off-gap"></div>${ghostSlot(OFF, "✋", "Offhand")}</div>` : "";
    const inv = `<div class="inv-card"><h3>Inventory${G.mode === "survival" ? ` <span class="note" style="color:#444">Level ${G.levelInfo().level}</span>` : ""}</h3><div class="inv-row">${armorCol}<div><div class="grid9">${slots("inv", 9, 36)}</div><div class="grid9 hotrow">${slots("inv", 0, 9)}</div></div></div>
      <p class="help">Click: pick up / put down • Right-click: half / one • Shift-click: move across • Point + 1–9: swap to hotbar • Point + ${keyName(G.settings.keySwap)}: swap to offhand${armorCol ? " • Armor and the offhand (✋) are in the left column" : ""}</p></div>`;
    let left = "";
    if (panelKind === "trade") {
      const e = G.ents.list.find(o => o.uid === panelCtx);
      const JOBS = { farmer: "Composter", fletcher: "Fletching Table", shepherd: "Loom", cleric: "Healing Altar", smith: "Smithing Anvil" };
      const rows = e ? TRADES[e.def.prof].map((t, i) => {
        const can = t[0].every(([id, n]) => G.inv.count(id) >= n), sold = e.uses[i] >= t[2];
        const ins = t[0].map(([id, n]) => `<span class="${G.inv.count(id) >= n ? "" : "miss"}"><img src="${iconURL(id)}" alt="">${n} ${escapeAttr(itemDef(id).name)}</span>`).join(" + ");
        return `<div class="recipe ${can && !sold ? "ok" : ""}"><div class="out"><img src="${iconURL(t[1][0])}" alt="">${t[1][1] > 1 ? `<b>${t[1][1]}</b>` : ""}</div>
          <div><div class="name">${escapeAttr(itemDef(t[1][0]).name)}${t[1][1] > 1 ? " ×" + t[1][1] : ""}</div><div class="ins">${ins}</div>${sold ? `<div class="need">Sold out for now</div>` : `<div class="note" style="color:#555;font-size:11px">${t[2] - e.uses[i]} left</div>`}</div>
          <button class="btn small ${can && !sold ? "primary" : ""}" data-trade="${i}" ${can && !sold ? "" : "disabled"}>Trade</button></div>`;
      }).join("") : `<p class="note">They wandered off.</p>`;
      left = `<div class="inv-card"><h3>${e ? escapeAttr(e.def.name) : "Trading"} <span class="note" style="color:#444">Pay with Jade</span></h3><div class="recipes">${rows}</div>
        <p class="help">${e && JOBS[e.def.prof] ? `Sold-out trades come back while this villager works at their ${JOBS[e.def.prof]} (up to twice a day).` : "The Wanderer only stays for a few minutes!"} Shift-click Trade to trade as many times as you can.</p></div>`;
      p.innerHTML = `<div class="inv-wrap">${left}${inv}</div>`;
      p.querySelectorAll("[data-trade]").forEach(b => b.onclick = ev => G.trade(panelCtx, +b.dataset.trade, ev.shiftKey));
    } else if (panelKind === "journal") {
      // two adventures, one journal: a tab for each (it opens on the one you're in)
      if (!G.journalTab) G.journalTab = ["deep", "expanse"].includes(G.dim) || (G.story.lost && G.story.lost.visits && G.dim !== "forsaken") ? "lost" : "fw";
      const lost = G.journalTab === "lost";
      const tabs = `<span class="jtabs"><button class="chip-btn ${lost ? "" : "on"}" data-jtab="fw">Forsaken World</button><button class="chip-btn ${lost ? "on" : ""}" data-jtab="lost">Lost Civilization</button></span>`;
      p.innerHTML = `<div class="inv-card fw-card"><h3>Journal ${tabs} <span class="note" style="color:#444">Press J or Esc to close</span></h3>${lost ? G.lost.journalHTML() : G.forsaken.journalHTML()}</div>`;
      p.querySelectorAll("[data-jtab]").forEach(b => b.onclick = () => { Sound.click(); G.journalTab = b.dataset.jtab; this.renderPanel(); });
      if (!lost) G.forsaken.drawMap($("fwMap"));
      p.querySelectorAll("[data-note]").forEach(b => b.onclick = () => G.forsaken.readNote(b.dataset.note));
      p.querySelectorAll("[data-lore]").forEach(b => b.onclick = () => G.lost.readLore(b.dataset.lore));
      p.querySelectorAll("[data-fwt]").forEach(b => b.onclick = () => { Sound.click(); G.forsaken.testControl(b.dataset.fwt); this.renderPanel(); });
      p.querySelectorAll("[data-lt]").forEach(b => b.onclick = async () => { Sound.click(); await G.lost.testControl(b.dataset.lt); if (G.panelKind === "journal") this.renderPanel(); });
      return;
    } else if (panelKind === "note") {
      const n = panelCtx || {};
      p.innerHTML = `<div class="inv-card note-card"><h3></h3><div class="note-text"></div><p class="help">${n.first ? "Added to your journal (J). " : ""}Press Esc or E to close.</p><button class="btn small" id="noteClose">Close</button></div>`;
      p.querySelector("h3").textContent = n.title || ""; p.querySelector(".note-text").textContent = n.text || "";
      $("noteClose").onclick = () => G.closePanel();
      return;
    } else if (panelKind === "advancements") {
      p.innerHTML = `<div style="display:grid;gap:12px">${Adv.html(advCat)}</div>`;
      p.querySelectorAll("[data-advcat]").forEach(b => b.onclick = () => { advCat = b.dataset.advcat; Sound.click(); this.renderPanel(); });
      return;
    } else if (panelKind === "beacon") {
      const st = G.beaconState(panelCtx), c = st.c || {}, P = G.BEACON_POWERS;
      const pow = (k, d) => `<button class="chip-btn beacon-pow" data-pow="${k}" aria-pressed="${c.primary === k}" ${d.level > st.level ? "disabled" : ""}>${d.name}<small>${d.desc}${d.level > st.level ? ` • needs ${d.level} layers` : ""}</small></button>`;
      const status = !st.level ? "No pyramid yet: build a 3×3 layer of mineral blocks (iron, gold, Jade, Skyshard, or Duskmetal blocks) right under the Beacon. Up to 4 layers (9×9 at the bottom)." :
        `Pyramid: ${st.level} layer${st.level > 1 ? "s" : ""} • Range: ${st.range} blocks${st.open ? "" : " • ⚠️ The beam is blocked: clear everything above the Beacon"}`;
      const active = st.legacy ? "Old-style: Regeneration + Swiftness within 24 blocks" : c.primary ? "Active: " + P[c.primary].name + (c.secondary === "regen" ? " + Regeneration" : c.secondary ? " II" : "") : "No power chosen";
      left = `<div class="inv-card"><h3>Beacon <span class="note" style="color:#444">${active}</span></h3>
        <p class="help" style="margin-top:0">${status}</p>
        <div class="beacon-grid">${Object.entries(P).map(([k, d]) => pow(k, d)).join("")}</div>
        <div class="beacon-row"><label><input type="checkbox" id="bcSecond" ${c.secondary ? "checked" : ""} ${st.level < 4 ? "disabled" : ""}> With 4 layers, also add <select id="bcSecondKind" ${st.level < 4 ? "disabled" : ""}><option value="regen">Regeneration</option><option value="same" ${c.secondary && c.secondary !== "regen" ? "selected" : ""}>level II of the main power</option></select></label></div>
        <div class="beacon-row"><div><div class="label">Pay 1 of: iron ingot, gold ingot, Jade, Skyshard, or Duskmetal ingot</div>${slotHTML("box:0")}</div><button class="btn small primary" id="bcApply">Choose power</button></div>
        <p class="help">Effects reach players within the range and fade a few seconds after you leave it. Changing the pyramid changes the Beacon right away.</p></div>`;
      p.innerHTML = `<div class="inv-wrap">${left}${inv}</div>`;
      let pick = c.primary || null;
      p.querySelectorAll("[data-pow]").forEach(b => b.onclick = () => { pick = b.dataset.pow; p.querySelectorAll("[data-pow]").forEach(x => x.setAttribute("aria-pressed", x === b)); Sound.click(); });
      $("bcApply").onclick = () => {
        if (!pick) { this.toast("Pick a power first.", "bad"); return; }
        const sec = $("bcSecond").checked ? ($("bcSecondKind").value === "regen" ? "regen" : pick) : null;
        G.setBeaconPower(panelCtx, pick, sec);
      };
    } else if (panelKind === "voidchest") {
      left = `<div class="inv-card void-card"><h3>Void Chest <span class="note">Your personal storage</span></h3><div class="grid9">${slots("void", 0, 27)}</div><p class="help">Every Void Chest opens this same storage, on the Surface, in the Ember Depths, and in the Hollow. It belongs to you, not to the chest: breaking a Void Chest never spills it, and nothing here is shared with ordinary chests.</p></div>`;
      p.innerHTML = `<div style="display:grid;gap:12px">${left}${inv}</div>`;
    } else if (panelKind === "chest") {
      const shell = isShellBox();
      left = `<div class="inv-card"><h3>${shell ? "Shell Box" : "Chest"}</h3><div class="grid9">${slots("box", 0, 27)}</div><p class="help">${shell ? "A Shell Box keeps everything inside when you break it and carry it. Shell Boxes can't go inside other Shell Boxes." : "Things in a chest stay saved. Breaking the chest drops everything inside."}</p></div>`;
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
      const cats = ["All", "Building", "Nature", "Useful", "Mechanisms", "Village", "Tools", "Food", "Items", "Ember Depths", "The Hollow", "Creatures"];
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
    const line = text => { const sm = document.createElement("small"); sm.textContent = text; tip.append(sm); };
    if (d.kind === "food") {
      if (d.food) line(`Food +${d.food / 2} 🍗   Fullness +${(d.sat || 0).toFixed(1)}`);
      line(d.sat >= 9 ? "Very filling: keeps you healing for a long time" : d.sat >= 5 ? "Filling" : d.food ? "Not very filling: you'll be hungry again soon" : "Doesn't fill you up");
      const fx = { poison: "Makes you sick (poison)", queasy: "Often makes you queasy", cure: "Clears all effects", blink: "Teleports you a short way", puffer: "Poisonous! Don't eat it", honey: "Cures poison", golden: "Regeneration II (5 s) + 2 golden hearts (2 min)" }[d.sideEffect];
      if (fx) line(fx);
      if (s.id === I.RAW_CHICKEN) line("Raw: may make you sick. Cook it in a furnace");
      line("Hold right-click to eat (1.6 s)");
    }
    if (s.id === I.SHIELD) line("Hold right-click to raise it. Blocks hits from the front. Works in either hand: put it in your offhand with a sword in your main hand");
    if (s.id === I.TOTEM) line("Hold it in either hand. If a hit would make you faint, it breaks instead and saves you: 1 heart left, then Regeneration II, golden hearts, and Fire Resistance. Doesn't work against the void");
    if (s.id === B.VOID_CHEST) line("Opens your personal storage. Every Void Chest, in every dimension, holds the same items. Breaking it never spills them");
    const DIMS = { overworld: "the Surface", nether: "the Ember Depths", end: "the Hollow" };
    if (d.quest) line("A story item for the Forsaken World. It stays in your pack: it can't be dropped or stored, and you keep it if you faint");
    if (s.id === I.PALE_SHARD) line("Found in Ember Depths fortresses and on Blight Rattlers. 4 shards + Shinestone + 2 iron ingots make a Pale Lantern");
    if (s.id === I.PALE_LANTERN) line("Right-click on the Surface to enter the Forsaken World, Herobrine's optional adventure. It's never used up");
    if (s.id === I.WARD_LANTERN) line("Hold it in either hand and monsters won't form near you. (Ones already around can still attack.)");
    if (s.id === B.WARD_CANDLE) line("In the Forsaken World, a lit candle makes a small safe ring (5 blocks) for about 2 minutes. Elsewhere it's just a light");
    if (s.id === B.PALE_EFFIGY) line("A trophy from banishing Herobrine");
    if (s.id === I.CINDER_EYE) line("Throw it in the Ember Depths: it flies toward the Cinder Citadel. Place one in the Cinder Altar to wake Cindermaw");
    if (s.id === I.EMBER_HEART) line("Cindermaw's burning heart. Combine with a Duskmetal Helmet at a workbench for the Cinder Crown");
    if (s.id === I.CINDER_CROWN) line("Helmet (4 armor). While you wear it, fire and lava can't burn you");
    if (s.id === B.CINDER_EGG) line("A trophy from your first victory over Cindermaw");
    if (s.id === I.COMPASS) line(s.lode ? (s.lodeLost ? "Its Lodestone is gone" : `Points to a Lodestone at ${s.lode.x}, ${s.lode.y}, ${s.lode.z} (${DIMS[s.lode.dim] || s.lode.dim})`) : "Points to the Surface's starting spot. Right-click a Lodestone with it to point there instead");
    if (s.id === B.RESPAWN_ANCHOR) line("Ember Depths only. Charge it with Shinestone (up to 4), then right-click to set your respawn point. Each wake-up uses 1 charge. Explodes if used elsewhere");
    if (s.id === B.LODESTONE) line("Right-click it with a Compass to make the compass point here, even from far away");
    if (s.id === B.BEACON) line("Needs a pyramid of mineral blocks under it and open sky above. Right-click to choose a power");
    if (s.id === B.SHELL_BOX) line("Keeps its contents when broken. Can't go inside another Shell Box");
    if (s.contents) line(`Holds ${s.contents.filter(Boolean).length} stacks`);
    if (d.glider) line("Wear as a chestplate. Press Space while falling to glide");
    tip.hidden = false; tip.style.left = e.clientX + 16 + "px"; tip.style.top = e.clientY + 12 + "px";
  },
  // number keys while pointing at a slot swap it with that hotbar slot
  hotkey(n) {
    if (!hoverRef || !(hoverRef.startsWith("inv:") || hoverRef.startsWith("box:") || hoverRef.startsWith("fur:") || hoverRef.startsWith("void:"))) return false;
    const target = "inv:" + n, a = getSlot(hoverRef), b = getSlot(target);
    if (hoverRef === target) return true;
    if (b && !accepts(hoverRef, b)) { bad(hoverRef); return true; }
    if (a && !accepts(target, a)) { bad(target); return true; }
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
  if (kind === "void") return G.voidInv[n];
  const c = G.world.containers.get(panelCtx);
  return c ? c.slots[n] : null;
}
function setSlot(ref, s) {
  const [kind, i] = ref.split(":"), n = +i;
  if (kind === "inv") G.inv.slots[n] = s;
  else if (kind === "void") G.voidInv[n] = s;
  else { const c = G.world.containers.get(panelCtx); if (c) c.slots[n] = s; }
}
// Is the open container a Shell Box? (Shell Boxes can't hold other Shell Boxes, so nothing nests forever)
function isShellBox() {
  if (panelKind !== "chest" || !panelCtx) return false;
  const [x, y, z] = panelCtx.split(",").map(Number);
  return G.world.id(x, y, z) === B.SHELL_BOX;
}
function accepts(ref, s) {
  if (/^inv:3[6-9]$/.test(ref)) { const d = itemDef(s.id); return !!(d && d.armor && d.armor.slot === +ref.slice(4) - 36); }
  if (ref.startsWith("box:") && s.id === B.SHELL_BOX && isShellBox()) return false;
  if ((ref.startsWith("box:") || ref.startsWith("void:")) && itemDef(s.id).quest) return false;   // story items stay with you
  if (panelKind === "beacon" && ref === "box:0") return G.beaconPay.includes(s.id);
  if (ref === "fur:0") return SMELT[s.id] !== undefined;
  if (ref === "fur:1") return FUEL[s.id] !== undefined;
  if (ref === "fur:2") return false;
  return true;
}
function bad(ref) {
  Sound.error();
  UI.toast(cursor && itemDef(cursor.id).quest && !ref.startsWith("inv:") ? "Story items like sigils stay in your pack, so they can't get lost." : ref === "fur:0" ? "That can't be cooked in a furnace." : ref === "fur:1" ? "That won't burn. Try coal or wood." : ref.startsWith("box:") && isShellBox() ? "A Shell Box can't go inside another Shell Box." : "That can't go there.", "bad");
}
// Shift-click: send a stack to the other side
function quickMove(ref) {
  const s = getSlot(ref);
  if (!s) return;
  const [kind, i] = ref.split(":"), n = +i;
  let targets;
  if (kind === "inv") {
    if (panelKind === "beacon") targets = G.beaconPay.includes(s.id) ? ["box:0"] : [];
    else if (panelKind === "chest") { targets = range("box", 0, 27); if (s.id === B.SHELL_BOX && isShellBox()) targets = []; }
    else if (panelKind === "voidchest") targets = range("void", 0, 27);
    else if (panelKind === "furnace") targets = SMELT[s.id] !== undefined ? ["fur:0"] : FUEL[s.id] !== undefined ? ["fur:1"] : [];
    else if (n >= 36) targets = [...range("inv", 9, 36), ...range("inv", 0, 9)];
    else if (itemDef(s.id).armor && panelKind === "inventory" && !G.inv.slots[36 + itemDef(s.id).armor.slot]) targets = ["inv:" + (36 + itemDef(s.id).armor.slot)];
    else targets = n < 9 ? range("inv", 9, 36) : range("inv", 0, 9);
  } else targets = [...range("inv", 0, 9), ...range("inv", 9, 36)];
  if (!targets.length) { bad(panelKind === "chest" ? "box:0" : "fur:0"); return; }
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
  const color = { heart: ["#e0302a", "#ff8a80"], food: ["#c47a3a", "#f0b070"], bubble: ["#7fd0ff", "#ffffff"], shield: ["#b8c0c8", "#ffffff"], gold: ["#f0c020", "#fff2a0"] }[kind];
  (shapes[kind] || shapes.heart).forEach((row, y) => [...row].forEach((ch, xx) => {
    if (ch !== "1") return;
    const empty = part === 0 || (part === 1 && xx > 4);
    x.fillStyle = empty ? "rgba(30,30,30,.65)" : y < 2 && xx < 4 ? color[1] : color[0];
    x.fillRect(xx, y, 1, 1);
  }));
  return (iconCache[key] = c.toDataURL());
}
function icons(value, kind, _unused, count = 10) {
  let h = "";
  for (let i = 0; i < count; i++) { const v = value - i * 2, part = v >= 2 ? 2 : v >= 1 ? 1 : 0; h += `<i style="background-image:url(${iconImg(kind, part)})"></i>`; }
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

// readable name for a keyboard key code ("KeyX" → "X")
function keyName(code) { return !code ? "?" : code.startsWith("Key") ? code.slice(3) : code.startsWith("Digit") ? code.slice(5) : code.replace("Left", " (left)").replace("Right", " (right)"); }
