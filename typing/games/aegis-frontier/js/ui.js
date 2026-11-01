// Ringfall: HUD, menus, map, journal, upgrades, subtitles. Fast-changing numbers are written
// straight into existing elements (no full re-render); menus are rebuilt only when opened.
import * as THREE from "../lib/three.module.min.js";
import { MISSIONS, missionById, CAST, WEAPONS, WEAPON_ORDER, EQUIPMENT, UPGRADES, UPGRADE_COSTS, VEHICLES, SUITS, RECORDINGS, EMBLEMS,
  CORES_HIDDEN, SITES, siteById, RESCUES, STRONGHOLDS, COMMANDER_SITES, COMMANDERS, REGIONS, WORLD_HALF, COURSES } from "./content.js";
import { WDEF } from "./weapons.js";
import { DIFFS } from "./game.js";
import { Saves } from "./save.js";
import { fmtDist, fmtTime, clamp } from "./util.js";
import { regionAt } from "./terrain.js";

const $ = (s) => document.querySelector(s);
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

// Original illustrated portraits (simple helmeted icons; no likeness of any real person).
export const PORTRAIT = {
  luma: `<svg viewBox="0 0 48 48"><circle cx="24" cy="24" r="20" fill="#0f3a3a"/><circle cx="24" cy="24" r="14" fill="#6ff2e0"/><circle cx="24" cy="24" r="6" fill="#0f3a3a"/><circle cx="26" cy="22" r="2" fill="#fff"/></svg>`,
  rowan: `<svg viewBox="0 0 48 48"><rect width="48" height="48" rx="10" fill="#3a2a1a"/><path d="M8 30 Q8 8 24 8 Q40 8 40 30 L40 40 L8 40Z" fill="#ff8a2a"/><rect x="12" y="20" width="24" height="10" rx="5" fill="#9fd8ff"/><rect x="8" y="34" width="32" height="6" fill="#fff"/></svg>`,
  watford: `<svg viewBox="0 0 48 48"><rect width="48" height="48" rx="10" fill="#1b2a44"/><path d="M8 32 Q8 8 24 8 Q40 8 40 32 L40 42 L8 42Z" fill="#2f6fd6"/><rect x="22" y="8" width="4" height="14" fill="#ffd34a"/><rect x="11" y="21" width="26" height="10" rx="4" fill="#cfe9ff"/><circle cx="18" cy="26" r="3" fill="none" stroke="#1b2a44" stroke-width="1.6"/><circle cx="30" cy="26" r="3" fill="none" stroke="#1b2a44" stroke-width="1.6"/><path d="M21 26h6" stroke="#1b2a44" stroke-width="1.6"/></svg>`,
  atlas: `<svg viewBox="0 0 48 48"><rect width="48" height="48" rx="10" fill="#1d1430"/><polygon points="24,6 40,15 40,33 24,42 8,33 8,15" fill="#5b4a82"/><circle cx="24" cy="24" r="8" fill="#c49bff"/><circle cx="24" cy="24" r="3" fill="#fff"/></svg>`,
  ranger: `<svg viewBox="0 0 48 48"><rect width="48" height="48" rx="10" fill="#1d2d22"/><path d="M8 32 Q8 8 24 8 Q40 8 40 32 L40 42 L8 42Z" fill="#3e8f4f"/><rect x="11" y="20" width="26" height="9" rx="4" fill="#6ff2e0"/></svg>`,
  team: `<svg viewBox="0 0 48 48"><rect width="48" height="48" rx="10" fill="#3a3220"/><path d="M10 22 Q10 10 24 10 Q38 10 38 22Z" fill="#f0c35a"/><rect x="8" y="21" width="32" height="4" fill="#d9a83a"/><circle cx="24" cy="32" r="9" fill="#e8c9a0"/></svg>`,
  robot: `<svg viewBox="0 0 48 48"><rect width="48" height="48" rx="10" fill="#22252c"/><rect x="10" y="12" width="28" height="24" rx="4" fill="#353a44"/><rect x="14" y="20" width="20" height="5" fill="#ffb347"/><rect x="22" y="6" width="4" height="7" fill="#5b4a82"/></svg>`,
};

export class UI {
  constructor(G) {
    this.G = G;
    this.subs = []; this.subT = 0; this.toasts = []; this.hudT = 0;
    this.mapView = { cx: 0, cz: 0, zoom: 1, filters: { missions: true, bases: true, strongholds: true, rescues: true, commanders: true, collectibles: true } };
    this.fxc = $("#fxc"); this.fx2 = this.fxc.getContext("2d");
    this._v = new THREE.Vector3();
    this.bindStatic();
  }
  bindStatic() {
    addEventListener("resize", () => this.resize());
    this.resize();
  }
  resize() { this.fxc.width = innerWidth; this.fxc.height = innerHeight; }
  show(id) { for (const el of document.querySelectorAll(".screen")) el.hidden = el.id !== id; this.cur = id; }
  hideScreens() { for (const el of document.querySelectorAll(".screen")) el.hidden = true; this.cur = null; }
  hud(on) { $("#hud").hidden = !on; this.fxc.hidden = !on; }

  // ---------------- messages ----------------
  toast(text) {
    const el = document.createElement("div"); el.className = "toast"; el.textContent = text;
    const box = $("#toasts"); box.appendChild(el);
    while (box.children.length > 4) box.firstChild.remove();
    setTimeout(() => el.classList.add("out"), 4200); setTimeout(() => el.remove(), 4800);
  }
  banner(title, sub) {
    const b = $("#banner"); b.innerHTML = `<b>${esc(title)}</b><span>${esc(sub || "")}</span>`;
    b.classList.remove("show"); void b.offsetWidth; b.classList.add("show");
  }
  spPop(n) { this.toast(`+${n} Service Points`); }
  saved() { const s = $("#savedIcon"); s.classList.remove("show"); void s.offsetWidth; s.classList.add("show"); }
  fade() { const f = $("#fade"); f.classList.remove("go"); void f.offsetWidth; f.classList.add("go"); }
  takedown() { this.G.audio.play("takedown"); const h = $("#hitmark"); h.className = "hitmark kill"; clearTimeout(this.hmT); this.hmT = setTimeout(() => (h.className = "hitmark"), 260); }
  shieldBreak() { const e = $("#shieldFlash"); e.classList.toggle("soft", !!this.G.settings.reducedFlash); e.classList.remove("go"); void e.offsetWidth; e.classList.add("go"); }
  flashTether() { const t = $("#tetherInd"); t.classList.add("bad"); setTimeout(() => t.classList.remove("bad"), 300); }
  objective(text) { $("#objText").textContent = text; $("#objBox").classList.remove("done"); }
  objectiveDone() { const b = $("#objBox"); b.classList.add("done"); setTimeout(() => b.classList.remove("done"), 900); }

  // subtitles queue (important lines are never interrupted by quips)
  say(who, text, o = {}) {
    if (o.quip && this.subs.some((s) => !s.quip)) return;
    if (o.quip && this.subs.length > 1) return;
    this.subs.push({ who, text, quip: !!o.quip, name: o.name, dur: o.short ? 3 : Math.max(3.2, text.length * 0.055) });
  }
  tickSubs(dt) {
    const box = $("#subs");
    if (!this.subs.length) { box.hidden = true; return; }
    const s = this.subs[0];
    if (!s.shown) {
      s.shown = true; this.subT = s.dur;
      const c = CAST[s.who] || CAST.luma;
      box.innerHTML = `<div class="por">${PORTRAIT[s.who] || ""}</div><div><b style="color:${c.color}">${esc(s.name || c.name)}</b><p>${esc(s.text)}</p></div>`;
      box.hidden = !this.G.settings.subtitles && s.who !== "luma" && false;
      box.hidden = false;
      if (!this.G.settings.subtitles) box.classList.add("min"); else box.classList.remove("min");
    }
    this.subT -= dt;
    if (this.subT <= 0) this.subs.shift();
  }
  skipSub() { if (this.subs.length) this.subs.shift(); }

  // ---------------- HUD ----------------
  updateHUD(dt) {
    const G = this.G, P = G.player, W = G.weapons, S = G.state;
    this.tickSubs(dt);
    for (const d of P.hitDirs) d.t -= dt * 0.8;
    P.hitDirs = P.hitDirs.filter((d) => d.t > 0);
    const min = G.mods.minimal;
    document.body.classList.toggle("minimal", !!min);
    // bars (cheap: transforms only)
    const sm = P.shieldMax;
    $("#shieldFill").style.transform = `scaleX(${P.shield / sm})`;
    $("#suitFill").style.transform = `scaleX(${P.suit / 100})`;
    $("#shieldBar").classList.toggle("broken", P.shield <= 0);
    $("#suitBar").classList.toggle("low", P.suit < 30);
    $("#lowSuit").style.opacity = P.suit < 30 ? 0.5 + Math.sin(G.time * 5) * 0.2 : 0;
    // reticle
    const ch = $("#cross");
    const scoped = W.id === "prism" && W.adsT > 0.9 && !P.vehicle;
    $("#scope").hidden = !scoped;
    ch.classList.toggle("ads", W.adsT > 0.5);
    $("#hitmark").classList.toggle("on", W.hitMarkT > 0);
    if (W.hitMarkT > 0) $("#hitmark").dataset.k = W.hitKind;
    // slower text updates
    this.hudT -= dt;
    if (this.hudT > 0) { this.drawOverlay(); return; }
    this.hudT = 0.08;
    $("#shieldNum").textContent = Math.ceil(P.shield);
    $("#suitNum").textContent = Math.ceil(P.suit);
    const veh = P.vehicle;
    $("#vehHud").hidden = !veh;
    $("#weapon").hidden = !!veh; $("#equip").hidden = !!veh;
    if (veh) {
      $("#vehName").textContent = veh.name;
      $("#vehFill").style.transform = `scaleX(${Math.max(0, veh.hp / veh.T.hp)})`;
      $("#boostFill").style.transform = `scaleX(${veh.boostMeter})`;
    } else {
      const d = W.def, a = W.ammo();
      $("#wName").textContent = WEAPONS[W.id].name;
      let ammo;
      if (d.beam) ammo = W.locked > 0 ? "COOLING" : `HEAT ${Math.round(W.heat * 100)}%`;
      else if (d.reserve === Infinity) ammo = `${a[0]} / ∞`;
      else ammo = `${a[0]} / ${a[1]}`;
      if (W.reloadT > 0) ammo = "RELOADING…";
      if (d.charge && W.charge > 0) ammo = W.charge >= d.charge ? "CHARGED!" : `charging ${Math.round((W.charge / d.charge) * 100)}%`;
      $("#wAmmo").textContent = ammo;
      $("#heatFill").style.transform = `scaleX(${d.beam ? W.heat : 0})`;
      $("#heatBar").hidden = !d.beam;
      const other = S.loadout[1 - W.cur];
      $("#wOther").textContent = other ? `Other: ${WEAPONS[other].name} (wheel or X)` : "Second slot empty";
      $("#throwInfo").textContent = `G: ${P.throwSel === "emp" ? "EMP Orb" : "Stasis Disc"} ×${P.throwables[P.throwSel]}  ·  T to switch`;
    }
    // equipment slots
    let html = "";
    for (const k of ["tether", "beacon", "barrier", "dash"]) {
      const on = G.flag("equip:" + k), sel = P.equipSel === k;
      const cd = k === "dash" ? (P.dashCharges > 0 ? 0 : P.cd.dash / P.dashCD()) : P.cd[k] / ({ tether: P.tetherCD(), beacon: P.beaconCD(), barrier: P.barrierCD() }[k]);
      const extra = k === "dash" && P.tier("dash") >= 2 ? `<i class="chg">${P.dashCharges}</i>` : "";
      html += `<div class="eq ${sel ? "sel" : ""} ${on ? "" : "off"}" title="${esc(EQUIPMENT[k].name)}"><span class="key">${EQUIPMENT[k].key}</span><span class="nm">${on ? EQUIPMENT[k].name.split(" ")[0] : "Locked"}</span>${extra}<span class="cd" style="transform:scaleY(${clamp(cd || 0, 0, 1)})"></span></div>`;
    }
    html += `<div class="eq ${P.cd.repulse > 0 ? "" : "ready"}"><span class="key">V</span><span class="nm">Repulse</span><span class="cd" style="transform:scaleY(${P.cd.repulse / 4.5})"></span></div>`;
    if (this.eqHtml !== html) { $("#equip").innerHTML = html; this.eqHtml = html; }
    // objective distance
    const mk = G.objectiveMarker();
    const p = veh ? veh.pos : P.pos;
    $("#objDist").textContent = mk ? fmtDist(Math.hypot(mk.x - p.x, mk.z - p.z)) : "";
    const m = G.mission();
    $("#objMission").textContent = G.state.mode === "training" ? "Training" : m ? `Mission ${m.num}: ${m.title}${G.state.mode === "replay" ? " (Replay)" : ""}` : "Free exploration";
    if (!m && G.state.mode === "campaign") $("#objText").textContent = "Explore Meridian Reach. Optional activities are on the map (M).";
    // carry & tether hint
    $("#carry").hidden = !P.carry;
    const tInd = $("#tetherInd");
    const showT = (P.equipSel === "tether" || G.input.key("KeyF")) && G.flag("equip:tether") && !veh && P.cd.tether <= 0;
    if (showT) { const pr = P.tetherProbe(); tInd.hidden = false; tInd.classList.toggle("ok", !!pr); } else tInd.hidden = true;
    this.compass();
    this.drawOverlay();
  }
  compass() {
    const G = this.G, P = G.player;
    const yaw = P.vehicle ? G.vehicles.camYaw : P.yaw;
    const w = 360, items = [];
    const heading = ((-yaw * 180) / Math.PI + 360) % 360;
    for (const [lab, deg] of [["N", 0], ["E", 90], ["S", 180], ["W", 270], ["NE", 45], ["SE", 135], ["SW", 225], ["NW", 315]]) items.push([lab, deg, lab.length > 1 ? "minor" : "major"]);
    const mk = G.objectiveMarker();
    const p = P.vehicle ? P.vehicle.pos : P.pos;
    if (mk) items.push(["◆", (Math.atan2(mk.x - p.x, -(mk.z - p.z)) * 180) / Math.PI, "obj"]);
    let html = "";
    for (const [lab, deg, cls] of items) {
      let d = ((deg - heading + 540) % 360) - 180;
      if (Math.abs(d) > 75) continue;
      html += `<span class="${cls}" style="left:${50 + (d / 75) * 50}%">${lab}</span>`;
    }
    $("#compass").innerHTML = html;
  }
  // World markers, damage direction, and scan marks on the 2D overlay canvas.
  drawOverlay() {
    const G = this.G, c = this.fx2, W = this.fxc.width, H = this.fxc.height, P = G.player, cam = G.camera;
    c.clearRect(0, 0, W, H);
    const proj = (x, y, z) => {
      this._v.set(x, y, z).project(cam);
      if (this._v.z > 1) return null;
      return [(this._v.x * 0.5 + 0.5) * W, (-this._v.y * 0.5 + 0.5) * H];
    };
    const scale = G.settings.textScale;
    c.font = `700 ${Math.round(13 * scale)}px "Nunito Sans", system-ui, sans-serif`;
    c.textAlign = "center";
    // objective marker
    const mk = G.objectiveMarker();
    const p = P.vehicle ? P.vehicle.pos : P.pos;
    if (mk && G.mode === "play") {
      let s = proj(mk.x, mk.y, mk.z);
      const behind = !s;
      if (behind) { this._v.set(mk.x, mk.y, mk.z).project(cam); s = [(-this._v.x * 0.5 + 0.5) * W, H * 0.8]; }
      const x = clamp(s[0], 40, W - 40), y = clamp(s[1], 70, H - 90);
      c.fillStyle = "#ffd34a"; c.strokeStyle = "#1a1a1a"; c.lineWidth = 3;
      c.beginPath(); c.moveTo(x, y - 11); c.lineTo(x + 9, y); c.lineTo(x, y + 11); c.lineTo(x - 9, y); c.closePath(); c.stroke(); c.fill();
      const dtext = fmtDist(Math.hypot(mk.x - p.x, mk.z - p.z));
      c.lineWidth = 4; c.strokeText(dtext, x, y + 28); c.fillStyle = "#fff"; c.fillText(dtext, x, y + 28);
    }
    // scan marks: shape tells the category (not only color)
    const now = G.time;
    for (const r of G.robots.list) {
      if (!r.alive) continue;
      const near = r.pos.distanceTo(p) < 28 && r.state === "engage";
      if (r.markT <= 0 && !r.cmd && !(r.alertMark > 0)) continue;
      const s = proj(r.pos.x, r.pos.y + r.def.h + 0.7, r.pos.z);
      if (!s) continue;
      if (r.alertMark > 0) { c.fillStyle = "#ffb347"; c.strokeStyle = "#000"; c.lineWidth = 4; c.font = `900 ${Math.round(22 * scale)}px system-ui`; c.strokeText("!", s[0], s[1]); c.fillText("!", s[0], s[1]); c.font = `700 ${Math.round(13 * scale)}px "Nunito Sans", system-ui`; }
      if (r.markT > 0) {
        c.strokeStyle = r.cmd ? "#ffd34a" : "#ff9a3c"; c.lineWidth = 2.5;
        c.beginPath(); c.moveTo(s[0], s[1] - 7); c.lineTo(s[0] + 7, s[1]); c.lineTo(s[0], s[1] + 7); c.lineTo(s[0] - 7, s[1]); c.closePath(); c.stroke();
      }
      if (r.cmd && r.pos.distanceTo(p) < 70) {
        const w = 70, frac = r.hp / r.maxHp;
        c.fillStyle = "rgba(0,0,0,.6)"; c.fillRect(s[0] - w / 2, s[1] - 22, w, 6);
        c.fillStyle = r.emittersUp ? "#7af0ff" : "#ffd34a"; c.fillRect(s[0] - w / 2, s[1] - 22, w * frac, 6);
        c.fillStyle = "#fff"; c.fillText(r.cmd.name + (r.emittersUp ? " (shielded)" : ""), s[0], s[1] - 28);
      }
    }
    for (const m of G.scanMarks) {
      if (m.until < now) continue;
      const s = proj(m.x, m.y + 0.8, m.z);
      if (!s) continue;
      c.lineWidth = 2.5; c.strokeStyle = m.color; c.fillStyle = m.color;
      const [x, y] = s;
      c.beginPath();
      if (m.shape === "square") c.rect(x - 6, y - 6, 12, 12);
      else if (m.shape === "circle") c.arc(x, y, 7, 0, 7);
      else if (m.shape === "hex") for (let k = 0; k <= 6; k++) { const a = (k / 6) * Math.PI * 2; k ? c.lineTo(x + Math.cos(a) * 7, y + Math.sin(a) * 7) : c.moveTo(x + 7, y); }
      else if (m.shape === "star") for (let k = 0; k <= 10; k++) { const a = (k / 10) * Math.PI * 2 - Math.PI / 2, rr = k % 2 ? 3.5 : 8; k ? c.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr) : c.moveTo(x, y - 8); }
      else { c.moveTo(x, y - 7); c.lineTo(x + 7, y + 6); c.lineTo(x - 7, y + 6); c.closePath(); }
      c.stroke();
      if (m.label && Math.hypot(m.x - p.x, m.z - p.z) < 25) { c.fillStyle = "#fff"; c.fillText(m.label, x, y + 22); }
    }
    // allies & vehicles nearby (small chevrons)
    if (!G.mods.minimal) {
      for (const a of G.allies.list) {
        if (a.seated || a.pos.distanceTo(p) > 60 || a.pos.distanceTo(p) < 3) continue;
        const s = proj(a.pos.x, a.pos.y + 2.3, a.pos.z);
        if (!s) continue;
        c.fillStyle = a.kind === "ranger" ? (a.recoverT > 0 ? "#8fb3a0" : "#7affc8") : a.kind === "rowan" ? "#ffc46b" : "#ffe9a8";
        c.beginPath(); c.moveTo(s[0] - 5, s[1] - 4); c.lineTo(s[0], s[1] + 3); c.lineTo(s[0] + 5, s[1] - 4); c.fill();
        if (a.mode === "follow" && a.pos.distanceTo(p) < 25) { c.fillStyle = "#fff"; c.fillText(a.kind === "rowan" ? "Rowan" : a.recoverT > 0 ? "Recharging" : "Ranger", s[0], s[1] - 8); }
      }
      for (const e of G.allies.escorts) {
        const s = proj(e.pos.x, e.pos.y + 4, e.pos.z);
        if (!s) continue;
        const w = 80;
        c.fillStyle = "rgba(0,0,0,.6)"; c.fillRect(s[0] - w / 2, s[1], w, 6); c.fillStyle = "#6ff2e0"; c.fillRect(s[0] - w / 2, s[1], (w * e.hp) / e.max, 6);
        c.fillStyle = "#fff"; c.fillText(e.blocked ? "Waiting: machines nearby" : e.waiting ? "Waiting for you" : "Transport", s[0], s[1] - 6);
      }
      for (const v of G.vehicles.list) {
        if (v.driver || v.pos.distanceTo(p) > 80) continue;
        const s = proj(v.pos.x, v.pos.y + 3, v.pos.z);
        if (s) { c.fillStyle = "#9fd8ff"; c.fillText("▣ " + v.name.split(" ").pop(), s[0], s[1]); }
      }
    }
    // damage direction arcs (blue-white, never red)
    const yaw = P.vehicle ? G.vehicles.camYaw : P.yaw;
    for (const d of P.hitDirs) {
      const a = d.a - yaw;   // 0 = in front
      const ang = -a - Math.PI / 2;
      c.strokeStyle = `rgba(255,214,140,${d.t})`; c.lineWidth = 7;
      c.beginPath(); c.arc(W / 2, H / 2, 110, ang + Math.PI - 0.35, ang + Math.PI + 0.35); c.stroke();
    }
    // tether rope
    if (P.tether) {
      const e = P.eye(this._v.clone()), T = P.tether;
      const len = T.state === "fly" ? T.t : 1e9;
      const dx = T.x - T.sx, dy = T.y - T.sy, dz = T.z - T.sz, L = Math.hypot(dx, dy, dz);
      const k = Math.min(1, len / L);
      const hand = G.weapons.muzzle(new THREE.Vector3()); hand.x -= 0.0;
      G.fx.line(hand.x, hand.y, hand.z, T.state === "fly" ? T.sx + dx * k : T.x, T.state === "fly" ? T.sy + dy * k : T.y, T.state === "fly" ? T.sz + dz * k : T.z, 0x6ff2e0);
    }
  }

  // ---------------- interaction prompt ----------------
  prompt(text, prog, gray) {
    const el = $("#prompt");
    if (!text) { el.hidden = true; return; }
    el.hidden = false;
    el.classList.toggle("gray", !!gray);
    el.innerHTML = gray ? esc(text) : `<kbd>E</kbd> ${prog !== undefined ? "Hold: " : ""}${esc(text)}${prog !== undefined ? `<i class="prog"><i style="transform:scaleX(${prog})"></i></i>` : ""}`;
  }

  // ---------------- boss ----------------
  bossBar(on) { $("#bossBar").hidden = !on; }
  bossUpdate(s) { $("#bossPhase").textContent = s.phase; $("#bossFill").style.transform = `scaleX(${s.frac})`; $("#bossHint").textContent = s.hint; }

  // ---------------- screens ----------------
  title() {
    const G = this.G;
    const slots = [1, 2, 3].map((n) => Saves.read(n));
    const latest = slots.map((s, i) => ({ s, i: i + 1 })).filter((q) => q.s.state).sort((a, b) => b.s.state.saved - a.s.state.saved)[0];
    $("#btnContinue").hidden = !latest;
    if (latest) $("#btnContinue").dataset.slot = latest.i;
    $("#continueInfo").textContent = latest ? `Slot ${latest.i} · ${this.slotSummary(latest.s.state)}` : "";
    $("#storageNote").hidden = Saves.available();
    this.show("title");
  }
  slotSummary(st) {
    const m = missionById[st.mission];
    return `${st.campaignDone ? "Campaign complete" : m ? `Mission ${m.num}: ${m.title}` : "Exploring"} · ${DIFFS[st.difficulty].name} · ${fmtTime(st.playtime)}`;
  }
  slots(purpose) {
    const G = this.G;
    this.slotPurpose = purpose;
    $("#slotTitle").textContent = purpose === "new" ? "Choose a save slot for your new campaign" : "Save slots";
    let html = "";
    for (const n of [1, 2, 3]) {
      const r = Saves.read(n);
      let info, acts = "";
      if (r.empty) { info = `<b>Slot ${n}</b><small>Empty</small>`; acts = purpose === "new" ? `<button class="btn small primary" data-act="new" data-n="${n}">Start here</button>` : ""; }
      else if (r.corrupt) { info = `<b>Slot ${n}</b><small class="warn">This save couldn't be read (${esc(r.error)}). You can delete it or import a backup.</small>`; acts = `<button class="btn small danger" data-act="del" data-n="${n}">Delete</button>`; }
      else {
        const st = r.state;
        info = `<b>Slot ${n}</b><small>${esc(this.slotSummary(st))}<br>Saved ${new Date(st.saved).toLocaleString()}</small>`;
        acts = purpose === "new" ? `<button class="btn small danger" data-act="new" data-n="${n}">Overwrite</button>` :
          `<button class="btn small primary" data-act="play" data-n="${n}">Play</button><button class="btn small" data-act="exp" data-n="${n}">Export</button><button class="btn small danger" data-act="del" data-n="${n}">Delete</button>`;
      }
      html += `<div class="slot">${info}<div class="acts">${acts}${purpose !== "new" ? `<button class="btn small" data-act="imp" data-n="${n}">Import</button>` : ""}</div></div>`;
    }
    $("#slotList").innerHTML = html;
    this.show("slots");
  }
  difficulty(cb) {
    this.diffCb = cb;
    this.show("diff");
  }
  settings(back) {
    const S = this.G.settings;
    this.settingsBack = back;
    const row = (label, inner, note = "") => `<label class="set"><span>${label}${note ? `<small>${note}</small>` : ""}</span>${inner}</label>`;
    const rng = (k, min, max, step, fmt = (v) => v) => `<span><input type="range" data-set="${k}" min="${min}" max="${max}" step="${step}" value="${S[k]}"><output>${fmt(S[k])}</output></span>`;
    const chk = (k) => `<input type="checkbox" data-set="${k}" ${S[k] ? "checked" : ""}>`;
    const emb = EMBLEMS.filter((e) => this.G.state && this.G.state.collected && this.G.state.collected.includes(e.id));
    $("#settingsBody").innerHTML =
      `<h3>Controls</h3>` +
      row("Mouse sensitivity", rng("sens", 0.2, 3, 0.05, (v) => (+v).toFixed(2))) +
      row("Invert look (up/down)", chk("invert")) +
      row("Field of view", rng("fov", 60, 100, 1, (v) => v + "°")) +
      row("Also crouch with Ctrl", chk("ctrlCrouch"), "Off by default: on Chromebooks, Ctrl+W closes the tab!") +
      row("Aim assistance", chk("aimAssist"), "Gently nudges shots toward robots. Always on in Explorer.") +
      `<h3>Sound</h3>` +
      row("Music volume", rng("music", 0, 1, 0.05, (v) => Math.round(v * 100) + "%")) +
      row("Effects volume", rng("sfx", 0, 1, 0.05, (v) => Math.round(v * 100) + "%")) +
      row("Mute everything (classroom mode)", chk("mute")) +
      `<h3>Display & comfort</h3>` +
      row("Graphics quality", `<select data-set="quality"><option value="low">Low (school laptops)</option><option value="medium">Medium (balanced)</option><option value="high">High (detailed)</option></select>`, "Low: 720p, short grass distance, no glow. Medium: 900p, soft glow. High: 1080p, sharper shadows, more grass, smoother edges. Tree density and texture detail update the next time the game loads.") +
      `<div class="row"><button class="btn small" id="btnGfxReset">Reset graphics to recommended</button></div>` +
      row("Text size", rng("textScale", 0.9, 1.5, 0.05, (v) => Math.round(v * 100) + "%")) +
      row("Subtitles for all dialogue", chk("subtitles")) +
      row("Reduce flashes", chk("reducedFlash"), "Softer glow, smaller bursts, gentler shield-break flash.") +
      row("Show performance", chk("showPerf"), "Frame rate and frame time in the corner (for testing).") +
      row("Reduce motion", chk("reduceMotion"), "Turns off head bob, camera shake, and slide tilt.") +
      row("Head bob", chk("headBob")) +
      row("Camera shake", rng("shake", 0, 1, 0.1, (v) => Math.round(v * 100) + "%")) +
      `<h3>Challenge emblem modifiers</h3>` +
      (emb.length ? emb.map((e) => row(e.name, `<input type="checkbox" data-mod="${e.mod}" ${S.mods[e.mod] ? "checked" : ""}>`, e.desc)).join("") : `<p class="note">Find challenge emblems in the world to unlock optional modifiers. They never change your campaign progress.</p>`) +
      `<div class="row"><button class="btn small" id="btnFull">Toggle fullscreen</button></div>`;
    $("#settingsBody select").value = S.quality;
    this.show("settings");
  }
  controls(back) { this.controlsBack = back; this.show("controls"); }
  pause() {
    const G = this.G;
    $("#pauseDiff").innerHTML = Object.entries(DIFFS).map(([k, d]) => `<button class="btn small ${G.state.difficulty === k ? "primary" : ""}" data-diff="${k}">${d.name}</button>`).join("");
    $("#pauseInfo").textContent = G.state.mode === "replay" ? "Mission replay: progress here is not saved." : G.state.mode === "training" ? "Training: nothing here is saved." : `Slot ${G.slot} · progress saves at bases, checkpoints, and when you exit.`;
    this.show("pause");
  }
  recovery() {
    const G = this.G;
    $("#recDiff").innerHTML = Object.entries(DIFFS).map(([k, d]) => `<button class="btn small ${G.state.difficulty === k ? "primary" : ""}" data-diff="${k}">${d.name}</button>`).join("");
    this.show("recover");
  }
  briefing(m, done) {
    this.briefDone = done;
    $("#briefNum").textContent = `Mission ${m.num} of 12 · ${REGIONS.find((r) => r.id === m.region).name}`;
    $("#briefTitle").textContent = m.title;
    $("#briefLines").innerHTML = m.brief.map(([w, t]) => `<div class="line"><div class="por">${PORTRAIT[w]}</div><div><b style="color:${CAST[w].color}">${esc(CAST[w].name)}</b><p>${esc(t)}</p></div></div>`).join("");
    this.G.mode = "briefing";
    this.G.input.unlock();
    this.show("brief");
  }
  replayDone(m) {
    this.G.mode = "menu"; this.G.input.unlock();
    $("#infoTitle").textContent = "Replay complete";
    $("#infoText").textContent = `You finished "${m.title}" again. Your campaign save was not changed.`;
    this.infoBack = "title"; this.show("info");
  }
  trainingDone() {
    this.G.mode = "menu"; this.G.input.unlock();
    $("#infoTitle").textContent = "Training complete";
    $("#infoText").textContent = "Nice work, Guardian! Start a New Campaign when you're ready. Training is always here if you want more practice.";
    this.infoBack = "title"; this.show("info");
  }
  armory() {
    const G = this.G, S = G.state;
    G.openMenu("armory");
    $("#armoryList").innerHTML = WEAPON_ORDER.map((id) => {
      const have = S.weapons.includes(id), w = WEAPONS[id];
      return `<div class="item ${have ? "" : "locked"}"><div><b>${esc(w.name)}</b><small>${esc(w.role)}. ${esc(w.desc)}</small></div>
        <div class="acts">${have ? `<button class="btn small" data-arm="${id}" data-slot="0" ${S.loadout[0] === id ? "disabled" : ""}>Slot 1</button><button class="btn small" data-arm="${id}" data-slot="1" ${S.loadout[1] === id ? "disabled" : ""}>Slot 2</button>` : `<small>Not found yet</small>`}</div></div>`;
    }).join("");
  }
  vehicleMenu(base) {
    const G = this.G;
    this.vehBase = base;
    G.openMenu("vehicles");
    $("#vehicleList").innerHTML = Object.entries(VEHICLES).map(([k, v]) => {
      const ok = G.vehicleUnlocked(k);
      const how = k === "rover" ? "Unlocks when Greenreach Outpost is reconnected" : k === "skiff" ? "Unlocks after Mission 7" : k === "skyfin" ? "Unlocks after Mission 9" : "Claim the parked crawler at the Silent Foundry";
      return `<div class="item ${ok ? "" : "locked"}"><div><b>${esc(v.name)}</b><small>${esc(v.desc)}</small></div><div class="acts">${ok ? `<button class="btn small primary" data-veh="${k}">Deliver</button>` : `<small>${how}</small>`}</div></div>`;
    }).join("");
  }

  // ---------------- journal ----------------
  journal(tab = "obj") {
    const G = this.G;
    this.jtab = tab;
    G.openMenu("journal");
    for (const b of document.querySelectorAll("#jtabs button")) b.classList.toggle("on", b.dataset.tab === tab);
    $("#journalBody").innerHTML = this["j_" + tab]();
  }
  j_obj() {
    const G = this.G, m = G.mission(), o = G.objective();
    if (G.state.mode === "training") return `<p>Follow the markers to learn the basics.</p>`;
    if (!m) return `<h3>Free exploration</h3><p>The campaign is complete. Meridian Reach is yours to explore: finish optional rescues, strongholds, commanders, courses, and collectibles. Replay missions from the Missions tab.</p>`;
    const steps = m.objectives.map((q, i) => `<li class="${i < G.state.obj ? "done" : i === G.state.obj ? "cur" : ""}">${i < G.state.obj ? "✔" : i === G.state.obj ? "➤" : "•"} ${esc(q.text)}</li>`).join("");
    return `<h3>Mission ${m.num}: ${esc(m.title)}</h3><p class="note">Next story step: <b>${esc(o ? o.text : "")}</b>. Optional activities never block the story.</p><ul class="steps">${steps}</ul>`;
  }
  j_missions() {
    const G = this.G, S = G.state;
    return `<p class="note">Completed missions can be replayed. Replays never change your campaign save or give rewards twice.</p>` + MISSIONS.map((m) => {
      const done = S.completed.includes(m.id), cur = S.mission === m.id;
      return `<div class="item ${done || cur ? "" : "locked"}"><div><b>${m.num}. ${esc(m.title)}</b><small>${done ? esc(m.objectives.map((o) => o.text).slice(0, 3).join(" · ")) : cur ? "In progress" : "Not reached yet"}</small></div><div class="acts">${done && S.mode === "campaign" ? `<button class="btn small" data-replay="${m.id}">Replay</button>` : ""}</div></div>`;
    }).join("");
  }
  j_rec() {
    const S = this.G.state;
    const got = RECORDINGS.filter((r) => S.collected.includes(r.id));
    if (!got.length) return `<p>No recordings found yet. Look for small orange holo-cubes near bases, camps, and landmarks.</p>`;
    return `<p class="note">${got.length} of ${RECORDINGS.length} recordings found.</p>` + got.map((r) => `<details class="rec" data-rec="${r.id}"><summary>${S.read.includes(r.id) ? "" : "● "}${esc(r.title)} <small>— ${esc(r.by)}</small></summary><p>${esc(r.text)}</p></details>`).join("");
  }
  j_upg() {
    const G = this.G, S = G.state;
    let html = `<p class="note"><b>${S.cores}</b> upgrade core${S.cores === 1 ? "" : "s"} to spend · ${S.coreIds.length} of 30 found · ${S.sp} Service Points</p>`;
    const names = { tether: "Tether Gauntlet", beacon: "Scout Beacon", barrier: "Barrier Projector", dash: "Vector Dash", shield: "Aegis Shield (passive)" };
    for (const k of ["tether", "beacon", "barrier", "dash", "shield"]) {
      const t = S.upgrades[k], avail = k === "shield" || G.flag("equip:" + k);
      html += `<div class="upg"><h4>${names[k]} ${avail ? "" : "<small>(not found yet)</small>"}</h4><p class="small">${esc(k === "shield" ? "Your suit's energy shield." : EQUIPMENT[k].desc)}</p><ol>`;
      UPGRADES[k].forEach((u, i) => {
        const owned = i < t, next = i === t;
        html += `<li class="${owned ? "own" : ""}">${owned ? "✔" : "○"} ${esc(u)} ${next && avail ? `<button class="btn small ${S.cores >= UPGRADE_COSTS[i] ? "primary" : ""}" data-up="${k}" ${S.cores >= UPGRADE_COSTS[i] ? "" : "disabled"}>Upgrade (${UPGRADE_COSTS[i]} core${UPGRADE_COSTS[i] > 1 ? "s" : ""})</button>` : ""}</li>`;
      });
      html += `</ol></div>`;
    }
    return html;
  }
  j_equip() {
    const G = this.G, S = G.state;
    let h = `<h3>Equipment</h3>`;
    for (const k in EQUIPMENT) h += `<p><b>${esc(EQUIPMENT[k].name)}</b> (${EQUIPMENT[k].key}, then Q) ${G.flag("equip:" + k) ? "" : "<small>— not found yet</small>"}<br>${esc(EQUIPMENT[k].desc)}</p>`;
    h += `<p><b>Energy Repulse</b> (V): a short push that knocks robots back and briefly disables them.</p><p><b>Throwables</b> (G to throw, T to switch): EMP Orb stuns machines and breaks shields; Stasis Disc slows machines and their shots.</p>`;
    h += `<h3>Weapons found</h3>` + S.weapons.map((w) => `<p><b>${esc(WEAPONS[w].name)}</b>: ${esc(WEAPONS[w].desc)}</p>`).join("");
    h += `<h3>Suit colors</h3><div class="suits">` + SUITS.map((s) => {
      const ok = S.unlockedSuits.includes(s.id);
      return `<button class="suit ${S.suit === s.id ? "on" : ""}" ${ok ? `data-suit="${s.id}"` : "disabled"} title="${esc(ok ? s.name : s.how)}"><i style="background:${s.colors[0]}"></i><i style="background:${s.colors[1]}"></i><i style="background:${s.colors[2]}"></i><span>${esc(ok ? s.name : "Locked: " + s.how)}</span></button>`;
    }).join("") + `</div>`;
    return h;
  }
  j_col() {
    const G = this.G, S = G.state, f = (x) => G.flag(x);
    const rows = [
      ["Story missions", S.completed.length, 12],
      ["Support bases", SITES.filter((s) => s.kind === "base" && f("base:" + s.id)).length, 8],
      ["Strongholds", STRONGHOLDS.filter((s) => f("stronghold:" + s.id)).length, 5],
      ["Rescues", RESCUES.filter((r) => f("rescue:" + r.id)).length, 12],
      ["Commanders", COMMANDER_SITES.filter((c) => f("cmd:" + c.id)).length, 6],
      ["Upgrade cores", S.coreIds.length, 30],
      ["Recordings", RECORDINGS.filter((r) => S.collected.includes(r.id)).length, 24],
      ["Challenge emblems", EMBLEMS.filter((e) => S.collected.includes(e.id)).length, 5],
      ["Courses finished", COURSES.filter((c) => f("course:" + c.id)).length, COURSES.length],
    ];
    let h = `<table class="col">` + rows.map(([a, n, t]) => `<tr><td>${a}</td><td><b>${n}</b> / ${t}</td><td><i class="bar"><i style="width:${(n / t) * 100}%"></i></i></td></tr>`).join("") + `</table>`;
    h += `<h3>Stats</h3><p>Play time ${fmtTime(S.playtime)} · Robots disabled ${S.stats.takedowns} · Safe recalls ${S.stats.deaths}</p>`;
    h += `<h3>Where cores come from</h3><p class="small">11 from story missions, 5 from strongholds, 6 from commanders, and 8 hidden in the world (often on top of tall rock spires — bring your tether).</p>`;
    h += `<h3>Courses</h3>` + COURSES.map((c) => `<p class="small"><b>${esc(c.name)}</b> (${c.kind === "rover" ? "Trailrunner Rover" : "Tether route"}) — par ${c.par} s${S.courses[c.id] ? ` · best ${S.courses[c.id].toFixed(1)} s` : ""}</p>`).join("");
    return h;
  }

  // ---------------- map ----------------
  buildMapImage() {
    const T = this.G.terrain, N = 320, cv = document.createElement("canvas");
    cv.width = cv.height = N;
    const g = cv.getContext("2d"), img = g.createImageData(N, N);
    for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
      const x = -WORLD_HALF + (i / N) * WORLD_HALF * 2, z = -WORLD_HALF + (j / N) * WORLD_HALF * 2;
      const h = T.heightAt(x, z), k = (j * N + i) * 4;
      let r, gg, b;
      if (h < 0) { r = 40; gg = 120 + h * 4; b = 170 + h * 3; }
      else {
        const reg = regionAt(x, z).id;
        const base = { G: [96, 160, 80], C: [196, 140, 92], R: [130, 150, 140], W: [100, 165, 120], X: [150, 148, 160] }[reg];
        const sh = 0.75 + Math.min(0.45, h / 160) + (T.heightAt(x - 3, z - 3) - h) * 0.03;
        r = base[0] * sh; gg = base[1] * sh; b = base[2] * sh;
        if (h > 80) { r = gg = b = 235; }
        const rw = T.bilinear(T.roadW, x, z); if (rw > 0.5) { r = 170; gg = 150; b = 120; }
      }
      img.data[k] = r; img.data[k + 1] = gg; img.data[k + 2] = b; img.data[k + 3] = 255;
    }
    g.putImageData(img, 0, 0);
    this.mapImg = cv;
  }
  openMap() {
    const G = this.G;
    G.openMenu("map");
    if (!this.mapImg) this.buildMapImage();
    const p = G.player.vehicle ? G.player.vehicle.pos : G.player.pos;
    this.mapView.cx = p.x; this.mapView.cz = p.z;
    $("#mapFilters").innerHTML = Object.keys(this.mapView.filters).map((k) => `<label><input type="checkbox" data-filter="${k}" ${this.mapView.filters[k] ? "checked" : ""}> ${k[0].toUpperCase() + k.slice(1)}</label>`).join("");
    G.setFlag("tut:map");
    this.drawMap();
  }
  mapItems() {
    const G = this.G, S = G.state, out = [], f = this.mapView.filters;
    const disc = (id) => S.discovered.includes(id) || G.flag("sensor:on");
    for (const s of SITES) {
      if (s.kind === "base" && f.bases) out.push({ x: s.x, z: s.z, shape: "base", done: G.flag("base:" + s.id), label: s.name, base: s.id, show: true });
      else if (["checkpoint", "foundry", "hangar", "hydro", "bastion"].includes(s.kind) && f.strongholds) { const id = { checkpoint: "S1", foundry: "S2", hangar: "S3", hydro: "S4", bastion: "S5" }[s.kind]; out.push({ x: s.x, z: s.z, shape: "fort", done: G.flag("stronghold:" + id), label: s.name, show: disc(s.id) || G.flag("region:" + s.region) || s.region === "G" }); }
      else if (s.kind === "rescue" && f.rescues) out.push({ x: s.x, z: s.z, shape: "rescue", done: G.flag("rescue:" + s.id), label: s.name + " (rescue)", show: disc(s.id) || G.flag("sensor:on") || this.nearBase(s) });
    }
    if (f.commanders) for (const c of COMMANDER_SITES) { const s = siteById[c.site]; out.push({ x: s.x + (c.cmd === "gridlock" ? 0 : 0), z: s.z + (c.cmd === "gridlock" ? -22 : 0), shape: "cmd", done: G.flag("cmd:" + c.id), label: COMMANDERS[c.cmd].name + " (commander)", show: G.flag("seen:" + c.id) || disc(s.id) }); }
    if (f.collectibles) {
      const deep = G.player.tier("beacon") >= 3;
      for (const c of G.items.collectibles) if (!S.collected.includes(c.id) && (deep && G.scanMarks.some((m) => m.ref === c))) out.push({ x: c.x, z: c.z, shape: c.kind, label: c.kind === "core" ? "Upgrade core" : c.kind === "rec" ? c.def.title : c.def.name, show: true });
      for (const c of COURSES) out.push({ x: c.at[0], z: c.at[1], shape: "course", done: G.flag("course:" + c.id), label: c.name + (c.kind === "rover" ? " (rover course)" : " (tether route)"), show: !c.need || G.flag(c.need) });
    }
    if (f.missions) { const mk = G.objectiveMarker(); if (mk) out.push({ x: mk.x, z: mk.z, shape: "obj", label: "Objective: " + (G.objective() ? G.objective().text : ""), show: true }); }
    if (G.customWaypoint) out.push({ x: G.customWaypoint.x, z: G.customWaypoint.z, shape: "pin", label: "Your waypoint (right-click to clear)", show: true });
    return out.filter((o) => o.show);
  }
  nearBase(s) { return this.G.capturedBases().some((b) => Math.hypot(siteById[b].x - s.x, siteById[b].z - s.z) < 260); }
  drawMap() {
    const G = this.G, cv = $("#mapCanvas"), V = this.mapView;
    cv.width = cv.clientWidth; cv.height = cv.clientHeight;
    const g = cv.getContext("2d"), W = cv.width, H = cv.height;
    const scale = (Math.min(W, H) / (WORLD_HALF * 2)) * V.zoom;
    const toS = (x, z) => [W / 2 + (x - V.cx) * scale, H / 2 + (z - V.cz) * scale];
    this.mapToWorld = (sx, sy) => [V.cx + (sx - W / 2) / scale, V.cz + (sy - H / 2) / scale];
    g.fillStyle = "#0c1418"; g.fillRect(0, 0, W, H);
    const [x0, y0] = toS(-WORLD_HALF, -WORLD_HALF);
    g.imageSmoothingEnabled = true;
    g.drawImage(this.mapImg, x0, y0, WORLD_HALF * 2 * scale, WORLD_HALF * 2 * scale);
    // locked regions are shaded (a small mask image scaled up)
    const mask = document.createElement("canvas"); mask.width = mask.height = 64;
    const mg = mask.getContext("2d"), mi = mg.createImageData(64, 64);
    for (let j = 0; j < 64; j++) for (let i = 0; i < 64; i++) {
      const x = -WORLD_HALF + (i + 0.5) * 20, z = -WORLD_HALF + (j + 0.5) * 20;
      if (G.world.regionLocked(regionAt(x, z).id)) { const k = (j * 64 + i) * 4; mi.data[k] = 60; mi.data[k + 1] = 30; mi.data[k + 2] = 90; mi.data[k + 3] = 150; }
    }
    mg.putImageData(mi, 0, 0);
    g.drawImage(mask, x0, y0, WORLD_HALF * 2 * scale, WORLD_HALF * 2 * scale);
    g.font = `800 ${Math.round(13 * G.settings.textScale)}px "Nunito Sans", system-ui`; g.textAlign = "center";
    for (const r of REGIONS) { const [sx, sy] = toS(r.c[0], r.c[1] - 60); g.fillStyle = "rgba(255,255,255,.85)"; g.fillText(r.name.toUpperCase() + (G.world.regionLocked(r.id) ? " (locked)" : ""), sx, sy); }
    this.mapHits = [];
    for (const it of this.mapItems()) {
      const [sx, sy] = toS(it.x, it.z);
      this.drawIcon(g, it.shape, sx, sy, it.done);
      this.mapHits.push({ ...it, sx, sy });
    }
    // player arrow
    const P = G.player, p = P.vehicle ? P.vehicle.pos : P.pos, yaw = P.vehicle ? P.vehicle.yaw : P.yaw;
    const [px, py] = toS(p.x, p.z);
    g.save(); g.translate(px, py); g.rotate(-yaw);
    g.fillStyle = "#fff"; g.strokeStyle = "#000"; g.lineWidth = 2;
    g.beginPath(); g.moveTo(0, -11); g.lineTo(7, 8); g.lineTo(0, 4); g.lineTo(-7, 8); g.closePath(); g.stroke(); g.fill();
    g.restore();
    const S = G.state, f = (x) => G.flag(x);
    $("#mapCounts").textContent = `Bases ${SITES.filter((s) => s.kind === "base" && f("base:" + s.id)).length}/8 · Strongholds ${STRONGHOLDS.filter((s) => f("stronghold:" + s.id)).length}/5 · Rescues ${RESCUES.filter((r) => f("rescue:" + r.id)).length}/12 · Commanders ${COMMANDER_SITES.filter((c) => f("cmd:" + c.id)).length}/6 · Cores ${S.coreIds.length}/30`;
  }
  drawIcon(g, shape, x, y, done) {
    g.lineWidth = 2; g.strokeStyle = "#111";
    const fill = done ? "#6ff2e0" : { base: "#b06cff", fort: "#ff8a5c", rescue: "#ffe27a", cmd: "#ffd34a", core: "#6ff2e0", rec: "#ffb347", emblem: "#ffd34a", obj: "#ffd34a", course: "#9fd8ff", pin: "#ffffff" }[shape];
    g.fillStyle = fill;
    g.beginPath();
    if (shape === "base") { g.moveTo(x, y - 9); g.lineTo(x + 8, y - 2); g.lineTo(x + 8, y + 7); g.lineTo(x - 8, y + 7); g.lineTo(x - 8, y - 2); g.closePath(); }
    else if (shape === "fort") { g.rect(x - 8, y - 6, 16, 12); }
    else if (shape === "rescue") { g.arc(x, y, 7, 0, 7); }
    else if (shape === "cmd") { for (let k = 0; k <= 10; k++) { const a = (k / 10) * Math.PI * 2 - Math.PI / 2, r = k % 2 ? 4 : 9; k ? g.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r) : g.moveTo(x, y - 9); } }
    else if (shape === "obj") { g.moveTo(x, y - 10); g.lineTo(x + 9, y); g.lineTo(x, y + 10); g.lineTo(x - 9, y); g.closePath(); }
    else if (shape === "course") { g.arc(x, y, 7, 0, 7); g.moveTo(x + 3, y); g.arc(x, y, 3, 0, 7); }
    else if (shape === "pin") { g.arc(x, y - 6, 5, 0, 7); g.moveTo(x, y); g.lineTo(x, y - 2); }
    else { g.moveTo(x, y - 7); g.lineTo(x + 7, y + 6); g.lineTo(x - 7, y + 6); g.closePath(); }
    g.fill(); g.stroke();
    if (done) { g.fillStyle = "#111"; g.font = "900 10px system-ui"; g.fillText("✔", x, y + 4); }
  }
  mapClick(sx, sy, right) {
    const G = this.G;
    if (right) { G.customWaypoint = null; this.drawMap(); return; }
    const hit = (this.mapHits || []).find((h) => Math.hypot(h.sx - sx, h.sy - sy) < 12);
    if (hit && hit.shape === "base" && hit.done) {
      $("#mapInfo").innerHTML = `<b>${esc(hit.label)}</b> <button class="btn small primary" data-travel="${hit.base}">Fast travel here</button>`;
      return;
    }
    if (hit) { $("#mapInfo").innerHTML = `<b>${esc(hit.label)}</b>${hit.done ? " ✔ complete" : ""}`; return; }
    const [x, z] = this.mapToWorld(sx, sy);
    G.customWaypoint = { x, z, y: G.terrain.heightAt(x, z) + 2 };
    $("#mapInfo").textContent = "Waypoint set. It shows on your compass when no objective is active (right-click to clear).";
    this.drawMap();
  }

  // ---------------- ending ----------------
  ending(lines, st) {
    const G = this.G;
    G.mode = "ending"; G.input.unlock(); this.hud(false);
    let i = 0;
    const next = () => {
      if (i < lines.length) {
        const [w, t] = lines[i++];
        $("#endLine").innerHTML = `<div class="por big">${PORTRAIT[w]}</div><b style="color:${CAST[w].color}">${esc(CAST[w].name)}</b><p>${esc(t)}</p><small>Click or press Enter to continue</small>`;
        $("#endStats").hidden = true; $("#endLine").hidden = false;
      } else {
        $("#endLine").hidden = true; $("#endStats").hidden = false;
        $("#endTable").innerHTML = [["Missions", `${st.missions} / 12`], ["Bases reconnected", `${st.bases} / 8`], ["Strongholds", `${st.strongholds} / 5`], ["Rescues", `${st.rescues} / 12`], ["Commanders", `${st.commanders} / 6`], ["Upgrade cores", `${st.cores} / 30`], ["Recordings", `${st.recordings} / 24`], ["Emblems", `${st.emblems} / 5`], ["Robots disabled", st.takedowns], ["Safe recalls", st.recoveries], ["Play time", fmtTime(st.time)]].map(([a, b]) => `<tr><td>${a}</td><td><b>${b}</b></td></tr>`).join("");
        $("#endReplay").hidden = G.state.mode !== "campaign";
      }
    };
    this.endNext = next;
    next();
    this.show("ending");
  }
}
