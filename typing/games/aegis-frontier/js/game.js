// Ringfall: progress and rules. World flags (saved) drive everything: missions read them,
// terminals/bases/rescues set them, and nothing can be rewarded twice because rewards are keyed by id.
import * as THREE from "../lib/three.module.min.js";
import { MISSIONS, missionById, ENCOUNTERS, RESCUES, STRONGHOLDS, COMMANDER_SITES, COMMANDERS, COURSES, SITES, siteById,
  CORES_HIDDEN, EMBLEMS, RECORDINGS, SUITS, QUIPS, ENDING, TRAINING, EQUIP_UNLOCK, VEHICLES, CAST, REGIONS, WEAPONS } from "./content.js";
import { Saves, newState } from "./save.js";
import { WDEF } from "./weapons.js";
import { regionAt } from "./terrain.js";
import { clamp, dist2 } from "./util.js";

export const DIFFS = {
  explorer: { name: "Explorer", dmgTaken: 0.55, enemyDmg: 1, enemyHp: 0.85, maxAttackers: 2, reaction: 0.95, spread: 1.5, flank: 0.5, suitRegenCap: 100, shieldRegen: 1.2, dropChance: 0.45, reinforce: false, aim: true },
  standard: { name: "Standard", dmgTaken: 1, enemyDmg: 1, enemyHp: 1, maxAttackers: 3, reaction: 0.6, spread: 1, flank: 1, suitRegenCap: 60, shieldRegen: 1, dropChance: 0.35, reinforce: true, aim: false },
  veteran: { name: "Veteran", dmgTaken: 1.35, enemyDmg: 1, enemyHp: 1.15, maxAttackers: 5, reaction: 0.4, spread: 0.75, flank: 1.6, suitRegenCap: 40, shieldRegen: 0.9, dropChance: 0.25, reinforce: true, aim: false },
};
const STRONG_REQ = {
  S1: ["s1:e1", "s1:e2", "clear:S1"],
  S4: ["s4:t1", "s4:t2"],
  S5: ["bastion:e1", "bastion:e2", "bastion:e3", "clear:m11_gatekeeper"],
};
const BASE_IDS = SITES.filter((s) => s.kind === "base").map((s) => s.id);

export const Logic = {
  // ---------------- flags ----------------
  flag(f) { return this.flagSet.has(f); },
  setFlag(f) {
    if (this.flagSet.has(f)) return false;
    this.flagSet.add(f); this.state.flags.push(f);
    this.onFlag(f);
    this.world.refreshToggles(false);
    this.dirty = true;
    return true;
  },
  onFlag(f) {
    const S = this.state;
    const [kind, id] = f.split(":");
    if (kind === "stronghold") this.strongholdDone(id);
    if (kind === "rfix") this.rescueStart(id);
    if (kind === "aa") this.ui.toast(`Aerial defense ${id} offline.`);
    if (kind === "equip") { this.ui.toast(`New equipment: ${{ tether: "Tether Gauntlet", beacon: "Scout Beacon", barrier: "Barrier Projector", dash: "Vector Dash" }[id]} (press ${{ tether: 1, beacon: 2, barrier: 3, dash: 4 }[id]}, then Q).`); this.player.equipSel = id; }
    if (kind === "region") { const r = REGIONS.find((q) => q.id === id); if (r) this.ui.banner(`${r.name} is open`, "The barrier field has dropped."); }
    if (kind === "crossing_restored") {}
    if (f === "crossing:west" || f === "crossing:east") { if (this.flag("crossing:west") && this.flag("crossing:east")) { this.setFlag("crossing_restored"); this.setFlag("region:W"); } }
    if (f === "claim:crawler") { this.ui.toast("Bastion Crawler claimed! It's yours now, and Rowan can deliver it to base pads."); this.spawnClaimedCrawler(); }
    if (f === "lift:ride") this.rideLift(true);
    if (f === "heart:reconnect") this.beginEnding();
    if (f === "crash:power") this.setFlag("equip:tether");
    if (f === "base:B1") this.setFlag("vehicle:rover");
    if (f === "s3:key") this.ui.toast("Transport key recovered. Return it to the flight desk outside.");
    if (f === "camp:brief") this.campBriefing();
    if (kind === "base") this.baseCaptured(id);
    if (kind === "relay") { this.giveSP(3, "relay " + id); this.ui.toast("Relay tower reconnected!"); this.audio.play("objective"); }
    for (const sid in STRONG_REQ) if (!this.flag("stronghold:" + sid) && STRONG_REQ[sid].every((q) => this.flagSet.has(q))) this.setFlag("stronghold:" + sid);
  },
  // permanent rewards are keyed so they can only happen once (and never in replay/training)
  giveCore(key) {
    const S = this.state;
    if (this.noRewards() || S.coreIds.includes(key) || S.coreIds.length >= 30) return false;
    S.coreIds.push(key); S.cores++;
    this.audio.play("core");
    this.ui.toast("Upgrade core collected! Spend it in the Upgrades tab (Tab).");
    return true;
  },
  giveSP(n, why) { if (this.noRewards()) return; this.state.sp += n; this.ui.spPop(n); },
  noRewards() { return this.state.mode === "replay" || this.state.mode === "training"; },
  unlock(u) {
    const S = this.state;
    if (u.startsWith("suit:")) { if (!S.unlockedSuits.includes(u)) { S.unlockedSuits.push(u); this.ui.toast(`New suit colors: ${SUITS.find((s) => s.id === u).name}`); } }
    else if (u.startsWith("vehicle:") || u.startsWith("region:") || u.startsWith("equip:")) this.setFlag(u);
  },

  // ---------------- missions ----------------
  mission() { return missionById[this.state.mission]; },
  objective() { const m = this.mission(); return m ? m.objectives[this.state.obj] : null; },
  missionActive(id, objId) {
    if (this.state.mode === "training") return false;
    if (this.state.mission !== id) return false;
    if (!objId) return true;
    const m = this.mission();
    const idx = m.objectives.findIndex((o) => o.id === objId);
    return this.state.obj >= idx;
  },
  startObjective(silent) {
    const o = this.objective();
    if (!o) return;
    this.objT = 0;
    if (o.cp) this.setCheckpoint(o.cp[0], o.cp[1]);
    if (!silent && o.say) this.sayLines(o.say);
    this.hook("start", o);
    this.ui.objective(o.text);
    this.saveSoon();
  },
  objectiveDone(o) {
    if (o.type === "reach") {
      const p = this.player.vehicle ? this.player.vehicle.pos : this.player.pos;
      if (dist2(p.x, p.z, o.at[0], o.at[1]) > o.r) return false;
      if (o.minY && p.y < this.terrain.heightAt(o.at[0], o.at[1]) + o.minY) return false;
      if (o.rowan && this.rowan && this.rowan.pos.distanceTo(p) > 18) return false;
      return true;
    }
    if (o.type === "flags") return o.flags.filter((f) => this.flag(f)).length >= (o.need || o.flags.length);
    if (o.type === "clear") return this.flag("clear:" + o.enc);
    if (o.type === "escort") return this.flag("escort:" + o.escort);
    if (o.type === "boss") return this.flag("boss:atlas");
    return false;
  },
  tickMission(dt) {
    if (this.state.mode === "training") return this.tickTraining(dt);
    const m = this.mission(), o = this.objective();
    if (!m || !o || this.ending) return;
    this.objT = (this.objT || 0) + dt;
    this.hook("update", o, dt);
    if (this.objectiveDone(o)) {
      this.hook("end", o);
      if (o.done) this.sayLines(o.done);
      this.state.obj++;
      this.audio.play("objective");
      if (this.state.obj >= m.objectives.length) this.completeMission(m);
      else { this.ui.objectiveDone(); this.startObjective(); }
    }
  },
  completeMission(m) {
    const S = this.state;
    const replay = S.mode === "replay";
    if (!replay && !S.completed.includes(m.id)) {
      S.completed.push(m.id);
      if (m.reward.core) this.giveCore(m.id);
      this.giveSP(m.reward.sp, "mission");
      for (const u of m.reward.unlock) this.unlock(u);
    }
    this.audio.play("mission");
    this.ui.banner(`Mission ${m.num} complete`, m.title);
    if (m.outro.length) this.sayLines(m.outro);
    if (replay) { setTimeout(() => this.ui.replayDone(m), 5000); return; }
    const idx = MISSIONS.indexOf(m);
    const next = MISSIONS[idx + 1];
    if (next) {
      S.mission = next.id; S.obj = 0;
      setTimeout(() => { if (this.state === S && S.mission === next.id) this.showBriefing(next); }, 6500 + m.outro.length * 2500);
    } else { S.mission = "done"; S.obj = 0; }
    this.saveNow();
  },
  showBriefing(m) {
    if (!m) return;
    this.ui.briefing(m, () => { this.startObjective(false); });
    if (m.brief) this.sayLines(m.brief, true);
  },

  // mission-specific setup that isn't plain data
  hook(phase, o, dt) {
    const id = this.state.mission + "." + o.id;
    const H = MISSION_HOOKS[id];
    if (H && H[phase]) H[phase].call(this, o, dt);
  },

  // ---------------- encounters ----------------
  encReady(def, id) {
    if (this.flag("clear:" + id) && !def.patrolGroup) return false;
    if (def.until && this.flag(def.until)) return false;
    if (def.base && this.flag("base:" + def.site)) return false;
    if (def.need) {
      if (def.need.flag && !this.flag(def.need.flag)) return false;
      if (def.need.mission && !this.missionActive(def.need.mission, def.need.obj)) return false;
    }
    if (this.state.mode === "training") return false;
    const site = siteById[def.site];
    if (this.world.regionLocked(site.region) && !def.need) return false;
    return true;
  },
  tickEncounters() {
    const P = this.player.vehicle ? this.player.vehicle.pos : this.player.pos;
    for (const id in ENCOUNTERS) {
      const def = ENCOUNTERS[id];
      let E = this.encs[id];
      const site = siteById[def.site];
      const ox = site.x + (def.dx || 0), oz = site.z + (def.dz || 0);
      const d = dist2(P.x, P.z, ox, oz);
      const ready = this.encReady(def, id);
      if (!E && ready && d < (def.units.length > 6 ? 200 : 165)) {
        if (def.delay) { def._wait = (def._wait || 0) + 0.5; if (def._wait < def.delay) continue; def._wait = 0; }
        E = this.encs[id] = { id, def, ox, oz, oy: site.y, units: [], reinforced: false };
        for (const u of def.units) {
          const [type, dx, dz, opts = {}] = u;
          let y = site.y;
          if (opts.y !== undefined && opts.y > 0.5) y = this.col.groundAt(ox + dx, oz + dz, site.y + opts.y + 0.6);
          const r = this.robots.spawn(type, ox + dx, y, oz + dz, { ...opts, y: opts.y || 0, yaw: Math.atan2(dx, dz) + (Math.random() - 0.5) }, E);
          if (this.state.difficulty === "veteran" && type === "sentry" && Math.random() < 0.25) r.def = { ...r.def, flank: 0.6 };
          E.units.push(r);
        }
        if (this.state.difficulty === "veteran" && def.units.length >= 4 && !def.commander) {
          E.units.push(this.robots.spawn("scout", ox + 4, site.y, oz - 6, {}, E));
        }
        if (def.commander && !this.flag("seen:" + def.commander)) { this.setFlag("seen:" + def.commander); const c = COMMANDERS[COMMANDER_SITES.find((q) => q.id === def.commander).cmd]; this.ui.banner(`Commander: ${c.name}`, "Optional challenge"); this.say("robot", c.line, { name: c.name }); }
        continue;
      }
      if (!E) continue;
      const alive = E.units.filter((r) => r.alive).length;
      const engaged = E.units.some((r) => r.alive && (r.state === "engage" || r.state === "alert"));
      if ((!ready && !E.cleared) || (d > 300 && !engaged)) { this.despawn(E); continue; }
      // reinforcements
      const R = def.reinforce;
      if (R && !E.reinforced && this.diff.reinforce && E.units.length && (E.units.length - alive) / E.units.length >= (R.at || 0.5)) {
        E.reinforced = true;
        const fx = ox + R.from[0] * 0.3, fz = oz + R.from[1] * 0.3;
        const q = this.nav.nearestOk(fx, fz, 15) || [ox, oz];
        this.robots.dropship(E, q[0], q[1], R.units.map((u) => [...u]), null);
      }
      if (alive === 0 && !this.robots.ships.some((s) => s.enc === E && !s.dropped) && !E.cleared) {
        E.cleared = true;
        if (!def.patrolGroup) this.setFlag("clear:" + id);
        this.encounterCleared(id, def, E);
      }
      if (E.cleared && d > 120) this.despawn(E);
    }
  },
  despawn(E) {
    for (const r of E.units) if (!r.removed) { r.alive = false; r.remove(); r.releaseToken(); }
    delete this.encs[E.id];
  },
  resetEncounters() {
    for (const id in this.encs) this.despawn(this.encs[id]);
    this.robots.clearAll();
  },
  encounterCleared(id, def, E) {
    if (def.commander) {
      const c = COMMANDER_SITES.find((q) => q.id === def.commander);
      if (this.setFlag("cmd:" + c.id) && !this.noRewards()) {
        this.state.stats.commanders++;
        this.giveCore("K" + c.id.slice(1)); this.giveSP(c.sp);
        if (c.unlock) this.unlock(c.unlock);
        this.ui.banner("Commander disabled", COMMANDERS[c.cmd].name);
      }
    }
    if (def.base) { this.ui.toast("Guards disabled. Reconnect the command terminal."); }
    if (id.startsWith("rescue_")) this.ui.toast("Area clear. Help the team!");
  },
  onRobotDisabled(r) {
    if (!this.noRewards()) this.state.stats.takedowns++;
    if (r.opts.aa) this.setFlag("aa:" + r.opts.aa);
    if (this.state.mode === "training" && r.opts.dummy) this.trainTargets = (this.trainTargets || 0) + 1;
  },
  onAllyTakedown() { if (!this.noRewards()) this.state.stats.takedowns++; },

  // ---------------- bases ----------------
  baseCaptured(id) {
    const S = this.state;
    if (!this.noRewards()) { S.stats.bases++; this.giveSP(5, "base"); }
    this.audio.play("mission");
    this.ui.banner("Base reconnected", siteById[id].name);
    if (Math.random() < 0.6) this.say("luma", QUIPS.capture[Math.floor(Math.random() * 2)], { quip: true });
    const s = siteById[id];
    this.discoverNear(s.x, s.z, 260);
    const a = this.world.anchors.get(id + ".padspot");
    this.setCheckpoint(s.x, s.z + 6);
    this.spawnBaseLife(id);
    this.saveNow();
  },
  spawnBaseLife(id) {
    if (this.allies.byTag("base:" + id).length) return;
    const A = (n) => this.world.anchors.get(id + "." + n);
    for (const n of ["ally1", "ally2"]) { const a = A(n); this.allies.add("ranger", a.x, a.z, { tag: "base:" + id, wander: true, k: 0 }); }
    const people = Math.min(3, 1 + Math.floor(this.state.stats.rescues / 3));
    for (let k = 0; k < people; k++) { const a = A(k % 2 ? "ally3" : "ally4"); this.allies.add("civ", a.x + k, a.z, { tag: "base:" + id, wander: true, k }); }
  },
  discoverNear(x, z, R) {
    for (const s of SITES) if (dist2(s.x, s.z, x, z) < R && !this.state.discovered.includes(s.id)) this.state.discovered.push(s.id);
  },
  capturedBases() { return BASE_IDS.filter((b) => this.flag("base:" + b)); },

  // ---------------- strongholds, rescues ----------------
  strongholdDone(id) {
    const st = STRONGHOLDS.find((s) => s.id === id);
    if (!st) return;
    if (!this.noRewards()) { this.state.stats.strongholds++; this.giveSP(st.sp); if (st.core) this.giveCore(id); if (st.unlock) this.unlock(st.unlock); }
    this.ui.banner("Stronghold complete", st.name);
    this.audio.play("mission");
    this.saveSoon();
  },
  rescueStart(id) {
    const r = RESCUES.find((q) => q.id === id);
    if (!r) return;
    const team = this.allies.byTag("rescue:" + id);
    const evac = this.world.anchors.get(id + ".evac");
    for (const a of team) { a.mode = "goto"; a.dest = [evac.x + (Math.random() - 0.5) * 4, evac.z + (Math.random() - 0.5) * 4]; a.speed = 3.5; }
    this.say("team", r.thanks);
    this.allies.dropship.add({ x: evac.x, z: evac.z, hover: 10, at: () => { for (const a of this.allies.byTag("rescue:" + id)) { this.fx.burst(a.pos.x, a.pos.y + 1, a.pos.z, 0x6ff2e0, 10, 2, 0.08, 0.6, -3); a.remove(); } } });
    if (this.setFlag("rescue:" + id) && !this.noRewards()) {
      this.state.stats.rescues++; this.giveSP(3, "rescue");
      if (Math.random() < 0.5) setTimeout(() => this.say("luma", QUIPS.rescue[Math.floor(Math.random() * 2)], { quip: true }), 4000);
    }
    this.saveSoon();
  },
  tickRescueTeams() {
    const P = this.player.pos;
    for (const r of RESCUES) {
      const s = siteById[r.id];
      const near = dist2(P.x, P.z, s.x, s.z) < 150;
      const has = this.allies.byTag("rescue:" + r.id).length > 0;
      if (near && !has && !this.flag("rescue:" + r.id) && !this.world.regionLocked(s.region)) {
        for (let k = 0; k < r.team; k++) this.allies.add("civ", s.x - 1.5 + k * 1.5, s.z - 0.5, { tag: "rescue:" + r.id, k, yaw: Math.PI });
      } else if (!near && has && !this.flag("rfix:" + r.id)) this.allies.removeTag("rescue:" + r.id);
    }
  },

  // ---------------- interactions ----------------
  canUse(it) {
    const need = it.need ? (Array.isArray(it.need) ? it.need : [it.need]) : [];
    const missing = need.filter((f) => !this.flag(f));
    const clr = (it.needClear || []).filter((e) => !this.flag("clear:" + e));
    switch (it.kind) {
      case "baseTerminal":
        if (this.flag("base:" + it.base)) return { no: true };
        if (!this.flag("baserelay:" + it.base)) return { msg: "The shield relay protects this terminal. Shoot the relay's glowing core first." };
        if (!this.flag("clear:" + it.base)) return { msg: "Disable the outpost guards first." };
        return { text: "Reconnect the command terminal", hold: 2.5 };
      case "relayTerminal":
        if (this.flag(it.flag)) return { no: true };
        if (!this.flag("clear:" + it.enc)) return { msg: "Clear the machines guarding this tower first." };
        return { text: "Reconnect the relay tower", hold: 2.5 };
      case "supply": case "armory": case "vehiclePad":
        if (!this.flag("base:" + it.base)) return { no: true };
        if (it.kind === "supply") return { text: "Use supply station (refill + repair)", hold: 0.6 };
        if (it.kind === "armory") return { text: "Open the armory (swap weapons)", hold: 0.3 };
        return { text: "Request a vehicle", hold: 0.3 };
      case "pod": {
        const want = this.podEquip(it);
        if (!want) return { no: true };
        return { text: "Open Rowan's supply pod", hold: 1 };
      }
      case "socket":
        if (this.flag(it.flag)) return { no: true };
        if (!this.player.carry) return { msg: "This socket needs an energy cell. Find one nearby (the Scout Beacon can mark them)." };
        return { text: "Insert the energy cell", hold: 0.5 };
      case "campBeacon":
        if (this.flag(it.flag) || !this.missionActive("m10", "beacons")) return { no: true };
        return { text: "Place a defense beacon", hold: 1.5 };
      case "holo":
        if (this.flag("camp:brief") || !this.missionActive("m10", "brief")) return { no: true };
        return { text: "Talk to Commander Watford", hold: 0.5 };
      case "assist":
        if (this.flag(it.flag) || !this.missionActive("m7")) return { no: true };
        return { text: "Activate the ranger post (backup)", hold: 1 };
      case "lift":
        if (missing.length) return { msg: "The maintenance lift has no power while the aerial defenses are online." };
        return { text: it.text, hold: 1 };
      case "transitLift":
        if (this.flag("lift:ride") && this.state.mission !== "m12") return { text: "Ride the lift to the control chamber", hold: 1 };
        if (!this.missionActive("m12") ) return { msg: missing.length ? "The transit lift is sealed. Clear the Citadel Gate Bastion first." : "The control chamber opens during the final mission." };
        return { text: it.text, hold: it.hold };
      case "exitLift": return { text: it.text, hold: 1 };
      case "conduit":
        if (!this.boss || this.boss.phase !== 2 || !this.boss.conduits[it.k].on) return { no: true };
        return { text: it.text, hold: it.hold };
      case "bossSupply":
        if (this.time < (it.ready || 0)) return { msg: `Supply locker recharging (${Math.ceil(it.ready - this.time)} s)` };
        return { text: "Grab supplies", hold: 0.4 };
      case "heartConsole":
        if (this.flag(it.flag)) return { no: true };
        if (missing.length) return { msg: "The console is locked while the Atlas Array is active." };
        return { text: "Reconnect the habitat network", hold: it.hold };
      case "lockNode":
        if (this.flag(it.flag)) return { no: true };
        if (missing.length) return { msg: "The crawler's lock node is guarded by the foundry's systems. Shut down the foundry first." };
        return { text: "Disable the lock node (claim the Bastion Crawler)", hold: it.hold };
      case "keyPickup": case "flagUse": case "convoyGen": case "controller": case "rescueFix": case "equipPickup":
        if (this.flag(it.flag) || (it.equip && this.flag("equip:" + it.equip))) return { no: true };
        if (it.kind === "convoyGen" && !this.missionActive("m4", "repair")) return { no: true };
        if (it.kind === "rescueFix" && !this.flag("clear:rescue_" + it.rescue)) return { msg: "Disable the machines around the shelter first." };
        if (it.kind === "convoyGen" && !this.flag("clear:m4_ambush")) return { msg: "Hold off the attacking machines first!" };
        if (missing.length || clr.length) return { msg: this.needMsg(it, missing, clr) };
        return { text: it.text || (it.kind === "equipPickup" ? "Take the Vector Dash module" : it.kind === "controller" ? "Shut down the assembly controller" : it.kind === "convoyGen" ? "Repair the shield generator" : "Use"), hold: it.hold || 1 };
    }
    return { no: true };
  },
  needMsg(it, missing, clr) {
    if (clr.length) return "Clear the machines nearby first.";
    const f = missing[0] || "";
    if (f.startsWith("foundry:line")) return "Cut both power lines first (shoot the power junctions).";
    if (f.startsWith("aa:")) return "Shut down all three aerial defense turrets first.";
    if (f === "crash:power") return "Restore suit power at the console first.";
    if (f === "s3:key") return "You need the transport key from inside the hangar.";
    if (f.startsWith("clear:")) return "Clear the machines guarding this area first.";
    if (f === "vault:core") return "Read the archive core first.";
    return "Not ready yet.";
  },
  podEquip(it) {
    if (it.id === "B5.pod" && this.missionActive("m5", "beacon") && !this.flag("equip:beacon")) return "beacon";
    if (it.id === "S2.pod" && this.missionActive("m6") && !this.flag("equip:barrier")) return "barrier";
    return null;
  },
  useInteract(it) {
    const P = this.player;
    this.audio.play("holdDone");
    switch (it.kind) {
      case "baseTerminal": this.setFlag("base:" + it.base); break;
      case "relayTerminal": this.setFlag(it.flag); break;
      case "supply":
        this.weapons.refill(this.state.difficulty === "veteran" ? 0.7 : 1);
        P.throwables.emp = Math.max(P.throwables.emp, this.state.difficulty === "veteran" ? 1 : 2); P.throwables.stasis = Math.max(P.throwables.stasis, this.state.difficulty === "veteran" ? 1 : 2);
        P.heal(true); this.setCheckpoint(P.pos.x, P.pos.z); this.ui.toast("Energy refilled, suit repaired, checkpoint saved."); this.saveNow(); break;
      case "armory": this.ui.armory(); break;
      case "vehiclePad": this.ui.vehicleMenu(it.base); break;
      case "pod": { const e = this.podEquip(it); if (e) this.setFlag("equip:" + e); break; }
      case "socket": this.items.insertCarry(it); break;
      case "campBeacon": this.setFlag(it.flag); this.fx.ring(it.x, it.y - 1, it.z, 0x6ff2e0, 12, 1); break;
      case "holo": this.setFlag("camp:brief"); break;
      case "assist": {
        this.setFlag(it.flag);
        for (let k = 0; k < 2; k++) { const a = this.allies.add("ranger", it.x + k * 2, it.z + 2, { tag: "assist" }); a.mode = "follow"; }
        this.say("ranger", "Ranger post active. We've got your back on the crossing!");
        break;
      }
      case "lift": P.place(it.to[0] + siteById.tower.x, siteById.tower.y + it.to[1] + 0.1, it.to[2] + siteById.tower.z); this.fx.flash(P.pos.x, P.pos.y + 1, P.pos.z, 0x6ff2e0, 2, 0.3); break;
      case "transitLift": if (!this.flag("lift:ride")) this.setFlag("lift:ride"); else this.rideLift(false); break;
      case "exitLift": { const a = this.world.anchors.get("citadel.lift"); P.place(a.x, a.y + 0.5, a.z - 3, Math.PI); this.ui.fade(); break; }
      case "conduit": this.boss.useConduit(it); break;
      case "bossSupply": it.ready = this.time + 25; this.weapons.refill(0.6); P.throwables.emp = Math.max(P.throwables.emp, 1); P.throwables.stasis = Math.max(P.throwables.stasis, 1); this.ui.toast("Supplies grabbed."); break;
      case "equipPickup": this.setFlag("equip:" + it.equip); break;
      case "keyPickup": case "flagUse": case "convoyGen": case "controller": case "rescueFix": case "heartConsole": case "lockNode":
        if (it.gives) { this.weapons.give(it.gives); }
        this.setFlag(it.flag);
        break;
    }
    this.dirty = true;
  },

  // ---------------- collectibles & upgrades ----------------
  collect(c) {
    const S = this.state;
    if (S.collected.includes(c.id)) return;
    if (this.state.mode === "training") return;
    c.m.visible = false;
    this.fx.burst(c.x, c.y, c.z, c.kind === "core" ? 0x6ff2e0 : c.kind === "emblem" ? 0xffd34a : 0xffb347, 16, 3, 0.08, 0.6, -1);
    if (this.noRewards()) { this.ui.toast("(Replay: collectibles are already tracked in your campaign.)"); return; }
    S.collected.push(c.id);
    if (c.kind === "core") this.giveCore(c.id);
    else if (c.kind === "emblem") { this.audio.play("core"); this.ui.banner("Challenge emblem found", `${c.def.name}: ${c.def.desc}`); this.giveSP(2); }
    else { this.audio.play("pickup"); this.giveSP(1); this.ui.toast(`Recording found: "${c.def.title}" (read it in the Journal, Tab)`); }
    this.saveSoon();
  },
  buyUpgrade(track) {
    const S = this.state, tier = S.upgrades[track];
    if (tier >= 4) return false;
    const cost = [1, 1, 2, 2][tier];
    if (S.cores < cost) return false;
    if (track !== "shield" && !this.flag("equip:" + track)) return false;
    S.cores -= cost; S.upgrades[track]++;
    this.audio.play("core");
    this.saveNow();
    return true;
  },
  suitColors() { const s = SUITS.find((q) => q.id === this.state.suit) || SUITS[0]; return s.colors; },

  // ---------------- checkpoints, saving, defeat ----------------
  setCheckpoint(x, z) {
    let y = this.col.groundAt(x, z, this.terrain.heightAt(x, z) + 3);
    const q = this.nav.nearestOk(x, z, 10);
    if (q) { x = q[0]; z = q[1]; y = this.col.groundAt(x, z, this.terrain.heightAt(x, z) + 3); }
    this.state.checkpoint = { x, y: y + 0.05, z, yaw: this.player.yaw };
  },
  checkpointHere() { const p = this.player.lastSafe; this.state.checkpoint = { x: p.x, y: p.y, z: p.z, yaw: this.player.yaw }; this.saveSoon(); },
  saveSoon() { this.saveT = Math.min(this.saveT ?? 2, 2); },
  saveNow() {
    if (this.state.mode === "replay" || this.state.mode === "training" || !this.slot) return;
    this.state.ammo = this.state.ammo || {};
    if (Saves.write(this.slot, this.state)) this.ui.saved(); else this.ui.toast("Couldn't save (browser storage is full or blocked).");
    this.dirty = false;
  },
  tickSave(dt) {
    this.state.playtime += dt;
    if (this.saveT !== undefined && this.saveT !== null) { this.saveT -= dt; if (this.saveT <= 0) { this.saveT = null; this.saveNow(); } }
    this.autoT = (this.autoT || 60) - dt;
    if (this.autoT <= 0) {
      this.autoT = 60;
      const calm = this.robots.engagedCount() === 0 && this.player.grounded && !this.player.vehicle;
      if (calm && !this.boss.active) { this.checkpointHere(); this.saveNow(); }
    }
  },
  respawnSafe() {
    const c = this.state.checkpoint;
    const P = this.player;
    const okRegion = c && !this.world.regionLocked(regionAt(c.x, c.z).id);
    // re-ground the saved spot, so saves from before a terrain update still land on the surface
    if (c && okRegion) { const g = this.col.groundAt(c.x, c.z, Math.max(c.y, this.terrain.heightAt(c.x, c.z)) + 0.6); if (Math.abs(g - c.y) < 15) c.y = g; }
    if (c && okRegion && !this.col.inside(c.x, c.y + 0.9, c.z)) P.place(c.x, c.y, c.z, c.yaw);
    else { const s = siteById.crash; const a = this.world.anchors.get("crash.start"); P.place(a.x, a.y, a.z, 0); }
  },
  onDefeat() {
    if (this.mode === "recovery") return;
    if (!this.noRewards()) this.state.stats.deaths++;
    if (this.player.vehicle) this.vehicles.exit(true);
    this.mode = "recovery";
    this.input.unlock();
    this.audio.play("powerdown");
    this.ui.recovery();
  },
  retryCheckpoint() {
    const P = this.player;
    this.resetEncounters();
    this.projectiles.clear();
    this.allies.clearEscorts();
    this.boss.reset();
    this.ui.bossBar(false);
    if (P.carry) this.items.dropCarry();
    P.barrier = null; P.barrierMesh.visible = false;
    this.respawnSafe();
    P.heal(true); P.lastHit = -99;
    const o = this.objective();
    if (o) this.hook("retry", o);
    this.items.spawnCells();
    this.mode = "play";
  },
  onEscortFail(e) {
    if (this.escortFailing) return;
    this.escortFailing = true;
    this.ui.toast("The transport's shield collapsed and it stalled. Returning to the checkpoint.");
    setTimeout(() => { this.escortFailing = false; this.retryCheckpoint(); this.ui.toast("Try again: clear threats before the transport rolls into them."); }, 1500);
  },
  onEscortArrive(e) {
    this.setFlag("escort:" + e.def.id);
    this.say("team", e.def.thanks);
    setTimeout(() => { if (this.allies.escorts.includes(e)) { e.remove(); this.allies.escorts = this.allies.escorts.filter((q) => q !== e); } }, 8000);
  },

  // ---------------- vehicles ----------------
  vehicleUnlocked(t) {
    if (t === "crawler") return this.flag("claim:crawler");
    return this.flag("vehicle:" + t);
  },
  requestVehicle(type, baseId) {
    if (!this.vehicleUnlocked(type)) { this.ui.toast(`${VEHICLES[type].name} isn't available yet.`); return; }
    if (this.allies.dropship.busy()) { this.ui.toast("Rowan is already on a delivery run. One moment!"); return; }
    const old = this.vehicles.ofType(type);
    if (old && old.driver) { this.ui.toast("You're already driving that one!"); return; }
    let spot = null;
    for (const n of ["padspot", "padspot2", "padspot3"]) {
      const a = this.world.anchors.get(baseId + "." + n);
      if (!a) continue;
      const clear = !this.vehicles.list.some((v) => v !== old && v.pos.distanceTo(a) < 6) && this.player.pos.distanceTo(a) > 4 && !this.col.inside(a.x, a.y + 1, a.z);
      if (clear) { spot = a; break; }
    }
    if (!spot) { this.ui.toast("The pad is blocked. Move clear of it and try again."); return; }
    if (old) this.vehicles.remove(old);
    if (type === "rover") this.setFlag("tut:delivery");
    this.say("rowan", `${VEHICLES[type].name}, coming right up. Stand clear of the pad!`, { short: true });
    this.allies.dropship.add({ x: spot.x, z: spot.z, cargo: true, at: () => { this.vehicles.spawn(type, spot.x, spot.z, Math.PI); } });
  },
  spawnClaimedCrawler() {
    const a = this.world.anchors.get("S2.crawler");
    if (!this.vehicles.ofType("crawler")) this.vehicles.spawn("crawler", a.x, a.z, 0);
  },

  // ---------------- fast travel ----------------
  canFastTravel() {
    if (this.state.mode !== "campaign") return "Fast travel is off in replay and training.";
    if (this.robots.engagedCount() > 0) return "You can't fast travel while machines are engaging you.";
    if (this.player.carry) return "Set down the energy cell first.";
    if (this.allies.escorts.length) return "Stay with the escort!";
    if (this.boss.active) return "Not during the final encounter!";
    return null;
  },
  fastTravel(baseId) {
    const why = this.canFastTravel();
    if (why) { this.ui.toast(why); return false; }
    if (!this.flag("base:" + baseId)) return false;
    if (this.player.vehicle) this.vehicles.exit(true);
    const s = siteById[baseId];
    this.setCheckpoint(s.x, s.z + 6);
    this.respawnSafe();
    this.player.lastAllowed = null;
    this.ui.fade();
    this.saveNow();
    return true;
  },

  // ---------------- story beats ----------------
  rideLift(first) {
    const a = this.world.anchors.get("citadel.arrive");
    this.ui.fade();
    if (this.player.vehicle) this.vehicles.exit(true);
    this.player.place(a.x, a.y + 0.1, a.z, 0);
    this.player.lastAllowed = null;
    this.setCheckpoint(a.x, a.z);
  },
  campBriefing() {
    const S = this.state;
    const rescued = S.stats.rescues, bases = this.capturedBases().length;
    this.sayLines([["watford", `Status report: ${rescued} research team${rescued === 1 ? "" : "s"} rescued and ${bases} base${bases === 1 ? "" : "s"} reconnected.`],
      ["watford", rescued >= 4 ? "Those teams are running supply lines for us right now. That's your doing." : "Every team we bring home makes the next step easier. Optional, but it matters."]]);
    // rescued teams and captured bases show up at camp
    const b = this.world.anchors.get("B8.ally1");
    for (let k = 0; k < Math.min(6, rescued); k++) this.allies.add("civ", b.x + (k % 3) * 2, b.z + 4 + Math.floor(k / 3) * 2, { tag: "camp", wander: true, k });
    for (let k = 0; k < Math.min(4, bases); k++) this.allies.add("ranger", b.x - 4 - k * 2, b.z - 2, { tag: "camp", wander: true });
  },
  beginEnding() {
    if (this.ending) return;
    this.ending = true;
    const S = this.state;
    if (S.mode === "campaign") {
      if (!S.completed.includes("m12")) { S.completed.push("m12"); this.giveSP(20); this.unlock("suit:aurora"); }
      S.campaignDone = true; S.mission = "done"; S.obj = 0;
      this.saveNow();
    }
    setTimeout(() => this.ui.ending(ENDING, this.endStats()), 2500);
  },
  endStats() {
    const S = this.state;
    return {
      missions: S.completed.length, bases: this.capturedBases().length, strongholds: STRONGHOLDS.filter((s) => this.flag("stronghold:" + s.id)).length,
      rescues: RESCUES.filter((r) => this.flag("rescue:" + r.id)).length, commanders: COMMANDER_SITES.filter((c) => this.flag("cmd:" + c.id)).length,
      cores: S.coreIds.length, recordings: RECORDINGS.filter((r) => S.collected.includes(r.id)).length, emblems: EMBLEMS.filter((e) => S.collected.includes(e.id)).length,
      takedowns: S.stats.takedowns, time: S.playtime, recoveries: S.stats.deaths,
    };
  },

  // ---------------- training ----------------
  tickTraining(dt) {
    const step = TRAINING[this.trainStep];
    if (!step) return;
    const P = this.player;
    let done = false;
    if (step.type === "reach") {
      const p = P.vehicle ? P.vehicle.pos : P.pos;
      done = dist2(p.x, p.z, step.at[0], step.at[1]) < step.r && (!step.minY || p.y >= this.terrain.heightAt(step.at[0], step.at[1]) + step.minY) && (!step.vehicle || !!P.vehicle);
    } else if (step.type === "targets") done = (this.trainTargets || 0) >= 3;
    else if (step.type === "flag") done = this.flag(step.flag);
    if (done) {
      this.trainStep++;
      this.audio.play("objective");
      const next = TRAINING[this.trainStep];
      if (next) { this.ui.objective(next.text); if (next.type === "targets") this.spawnTrainingTargets(); }
      else { this.ui.banner("Training complete", "You're ready for the frontier!"); setTimeout(() => this.ui.trainingDone(), 3500); }
    }
  },
  spawnTrainingTargets() {
    const s = siteById.training;
    for (const [x, z] of [[-24, 8], [-30, 14], [-20, 18]]) {
      const r = this.robots.spawn("skimmer", s.x + x, s.y + 3, s.z + z, { dummy: true, training: true }, null);
      r.alt = 3; r.home.set(s.x + x, s.y + 3, s.z + z);
    }
  },
};

// ---------------- mission hooks ----------------
const MISSION_HOOKS = {
  "m1.power": {
    start() { this.ensureRowan(); },
    retry() { this.ensureRowan(); },
  },
  "m1.shelter": {
    start() { this.ensureRowan(); },
    retry() { this.ensureRowan(); },
    end() { if (this.rowan) { const s = siteById.shelter; this.rowan.mode = "goto"; this.rowan.dest = [s.x, s.z - 2]; this.rowan.onArrive = (a) => { a.remove(); }; this.rowan = null; } },
  },
  "m4.escort": {
    start() { this.startEscort("m4"); }, retry() { this.startEscort("m4"); },
  },
  "m5.beacon": { start() { this.dropPod("B5.pod"); }, retry() { this.dropPod("B5.pod"); } },
  "m6.pod": { start() { this.dropPod("S2.pod"); }, retry() { this.dropPod("S2.pod"); } },
  "m7.escort": { start() { this.startEscort("m7"); }, retry() { this.startEscort("m7"); } },
  "m12.boss": {
    update() { if (this.boss.inArena && !this.boss.active && !this.boss.done) this.boss.start(); },
    retry() { this.boss.reset(); },
  },
};
const ESCORTS = {
  m4: { id: "m4", path: [[492, 318], [470, 314], [440, 300], [390, 282], [345, 266], [306, 256]], hp: 700, speed: 4.5, thanks: "Cinder Gate Post! Hot food and working shields. Thank you, Guardian!" },
  m7: { id: "m7", hover: true, path: [[-350, -52], [-345, -84], [-345, -146], [-332, -178], [-318, -205], [-306, -232]], hp: 650, speed: 4, thanks: "Power transfer complete. Glasswater has the lights on again!" },
};
Object.assign(Logic, {
  ensureRowan() {
    if (this.rowan && !this.rowan.removed) return;
    const P = this.player.pos;
    this.rowan = this.allies.add("rowan", P.x + 2, P.z + 2, { tag: "rowan" });
    this.rowan.mode = "follow"; this.rowan.slot = 3.4;
  },
  startEscort(id) {
    this.allies.clearEscorts();
    if (this.flag("escort:" + id)) return;
    const def = ESCORTS[id];
    this.allies.addEscort(def);
  },
  escortPos() { const e = this.allies.escorts[0]; return e ? e.pos : null; },
  dropPod(anchorId) {
    const a = this.world.anchors.get(anchorId);
    if (!a || this.podMesh) return;
    const m = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 1, 2, 8), new THREE.MeshLambertMaterial({ color: 0xff8a2a }));
    const y = this.col.groundAt(a.x, a.z, this.terrain.heightAt(a.x, a.z) + 2);
    m.position.set(a.x, y + 60, a.z); this.scene.add(m);
    this.podMesh = m; this.podY = y + 1;
    const it = this.world.interacts.find((i) => i.id === anchorId);
    if (it) it.y = y + 1.1;
  },
  tickPod(dt) {
    const m = this.podMesh;
    if (!m) return;
    if (m.position.y > this.podY) { m.position.y = Math.max(this.podY, m.position.y - dt * 30); if (m.position.y === this.podY) { this.audio.play("land"); this.fx.burst(m.position.x, this.podY - 1, m.position.z, 0xd9c7a4, 14, 4, 0.12, 0.6, 6); } }
    if (this.flag("equip:beacon") && this.flag("equip:barrier") || (!this.missionActive("m5", "beacon") && !this.missionActive("m6", "pod")) || (this.missionActive("m5", "beacon") && this.flag("equip:beacon")) || (this.state.mission === "m6" && this.flag("equip:barrier"))) {
      this.scene.remove(m); this.podMesh = null;
    }
  },
});
export { ESCORTS };
