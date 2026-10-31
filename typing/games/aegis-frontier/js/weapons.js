// Aegis Frontier: the seven energy tools, their first-person models, ammo/charge/heat rules,
// and the shared "what did this shot hit?" logic.
import * as THREE from "../lib/three.module.min.js";
import { WEAPONS, WEAPON_ORDER } from "./content.js";
import { clamp, lerp } from "./util.js";

export const WDEF = {
  carbine: { auto: true, rate: 9, dmg: 8, mag: 36, reserve: 216, reload: 1.8, spread: 0.012, range: 140, fall: [45, 90, 0.65], color: 0x7ff7ff, ads: 0.8, kick: 0.012, snd: "carbine" },
  pistol: { auto: false, rate: 5, dmg: 15, mag: 12, reserve: Infinity, reload: 1.1, spread: 0.004, range: 120, color: 0x9fd2ff, ads: 0.8, kick: 0.02, charge: 0.8, snd: "pistol" },
  prism: { auto: false, rate: 1.1, dmg: 62, weak: 2.2, mag: 5, reserve: 20, reload: 2.2, spread: 0, range: 320, color: 0xffffff, ads: 0.33, kick: 0.05, snd: "prism" },
  scatter: { auto: false, rate: 1.2, dmg: 8, pellets: 9, shieldMul: 1.6, mag: 6, reserve: 36, reload: 2.0, spread: 0.075, range: 30, fall: [9, 26, 0], color: 0xffa94d, ads: 0.85, kick: 0.06, snd: "scatter" },
  flux: { auto: false, rate: 0.9, mag: 3, reserve: 12, reload: 2.4, proj: true, color: 0x7dffb0, ads: 0.85, kick: 0.05, snd: "flux" },
  beam: { beam: true, dps: 58, range: 32, heat: 0.34, cool: 0.45, lock: 2.4, color: 0xff7ad9, ads: 0.85, snd: "beam" },
  shock: { auto: true, rate: 3.2, dmg: 17, chain: 3, range: 14, mag: 40, reserve: 160, reload: 2.0, stun: 0.35, color: 0xfff27a, ads: 0.9, kick: 0.01, snd: "shock" },
};

const _v = new THREE.Vector3(), _f = new THREE.Vector3(), _r = new THREE.Vector3(), _u = new THREE.Vector3();

// Finds the nearest thing a shot from the player's team hits: world, robots, shootables, boss parts.
// Enemy barriers block player shots; the player's own barrier does not.
export function castShot(G, ox, oy, oz, dx, dy, dz, maxT) {
  let best = null;
  const w = G.col.raycast(ox, oy, oz, dx, dy, dz, maxT, { water: true });
  if (w) best = { t: w.t, x: w.x, y: w.y, z: w.z, world: w };
  for (const prov of G.targets) {
    const h = prov.rayHit(ox, oy, oz, dx, dy, dz, best ? best.t : maxT);
    if (h && (!best || h.t < best.t)) best = h;
  }
  const b = G.robots.barrierHit(ox, oy, oz, dx, dy, dz, best ? best.t : maxT);
  if (b && (!best || b.t < best.t)) best = { t: b.t, x: ox + dx * b.t, y: oy + dy * b.t, z: oz + dz * b.t, enemyBarrier: b.barrier };
  return best;
}

function part(geo, color, emissive) {
  const m = new THREE.Mesh(geo, emissive ? new THREE.MeshBasicMaterial({ color }) : new THREE.MeshLambertMaterial({ color }));
  return m;
}
function buildModel(id) {
  const g = new THREE.Group();
  const W = 0xf1f3f6, D = 0x39414e, O = 0xff8a2a;
  const B = (w, h, d, c, x, y, z, e) => { const m = part(new THREE.BoxGeometry(w, h, d), c, e); m.position.set(x, y, z); g.add(m); return m; };
  const C = (r, len, c, x, y, z, e, seg = 10) => { const m = part(new THREE.CylinderGeometry(r, r, len, seg), c, e); m.rotation.x = Math.PI / 2; m.position.set(x, y, z); g.add(m); return m; };
  if (id === "carbine") {
    B(0.11, 0.13, 0.55, W, 0, 0, 0); B(0.06, 0.16, 0.12, O, 0, -0.12, 0.06); B(0.04, 0.05, 0.22, D, 0, 0.09, -0.02);
    C(0.025, 0.25, 0x7ff7ff, 0, 0.0, -0.36, true); B(0.12, 0.02, 0.3, 0x7ff7ff, 0, 0.066, -0.05, true);
  } else if (id === "pistol") {
    B(0.08, 0.12, 0.28, W, 0, 0, 0); B(0.06, 0.16, 0.08, D, 0, -0.12, 0.08);
    for (const z of [-0.08, -0.15]) { const t = part(new THREE.TorusGeometry(0.05, 0.012, 6, 14), 0x9fd2ff, true); t.position.set(0, 0, z); g.add(t); }
  } else if (id === "prism") {
    B(0.08, 0.11, 0.9, W, 0, 0, -0.1); B(0.06, 0.15, 0.12, D, 0, -0.12, 0.15); C(0.035, 0.22, D, 0, 0.11, 0.0);
    const p = part(new THREE.OctahedronGeometry(0.06), 0xffffff, true); p.position.set(0, 0, -0.5); g.add(p); B(0.02, 0.02, 0.5, O, 0.045, 0.03, -0.1);
  } else if (id === "scatter") {
    B(0.22, 0.12, 0.42, O, 0, 0, 0); B(0.14, 0.08, 0.2, W, 0, 0.09, 0.05); B(0.07, 0.15, 0.1, D, 0, -0.12, 0.1);
    for (const x of [-0.07, 0, 0.07]) C(0.03, 0.14, 0xffa94d, x, 0, -0.27, true, 8);
  } else if (id === "flux") {
    C(0.08, 0.6, W, 0, 0, 0, false, 12); B(0.07, 0.16, 0.1, D, 0, -0.14, 0.1); B(0.17, 0.04, 0.3, O, 0, 0.08, 0);
    const o = part(new THREE.SphereGeometry(0.07, 12, 8), 0x7dffb0, true); o.position.set(0, 0, -0.34); g.add(o);
  } else if (id === "beam") {
    B(0.1, 0.13, 0.45, D, 0, 0, 0); C(0.018, 0.4, W, 0, 0.02, -0.38);
    for (const z of [-0.05, 0.05, 0.15]) B(0.13, 0.02, 0.03, 0xff7ad9, 0, 0.075, z, true).name = "vent";
    B(0.06, 0.15, 0.1, W, 0, -0.12, 0.1);
  } else if (id === "shock") {
    B(0.12, 0.12, 0.3, W, 0, 0, 0); B(0.025, 0.025, 0.24, D, -0.04, 0.02, -0.25); B(0.025, 0.025, 0.24, D, 0.04, 0.02, -0.25);
    C(0.05, 0.14, 0xfff27a, 0, -0.08, 0.08, true); B(0.06, 0.14, 0.08, D, 0, -0.13, 0.12);
  }
  return g;
}
function buildArm() {
  const g = new THREE.Group();
  const sleeve = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.12, 0.3), new THREE.MeshLambertMaterial({ color: 0x2f6fd6 }));
  sleeve.position.set(0.04, -0.15, 0.24); g.add(sleeve);
  const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.135, 0.03, 0.2), new THREE.MeshLambertMaterial({ color: 0xff8a2a }));
  stripe.position.set(0.04, -0.09, 0.22); g.add(stripe);
  const hand = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 0.12), new THREE.MeshLambertMaterial({ color: 0xf1f3f6 }));
  hand.position.set(0, -0.09, 0.07); g.add(hand);
  const gaunt = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.06, 0.14), new THREE.MeshBasicMaterial({ color: 0x6ff2e0 }));
  gaunt.position.set(0.04, -0.14, 0.12); g.add(gaunt);
  g.userData.sleeve = sleeve; g.userData.stripe = stripe;
  return g;
}

export class Weapons {
  constructor(G) {
    this.G = G;
    this.vmScene = new THREE.Scene();
    this.vmCam = new THREE.PerspectiveCamera(60, 1, 0.01, 10);
    this.vmScene.add(new THREE.HemisphereLight(0xffffff, 0x445566, 3.4));
    const d = new THREE.DirectionalLight(0xffffff, 2.6); d.position.set(0.5, 1, 0.3); this.vmScene.add(d);
    this.rig = new THREE.Group(); this.rig.scale.setScalar(0.85); this.vmScene.add(this.rig);
    this.models = {};
    for (const id of WEAPON_ORDER) { const m = buildModel(id); m.visible = false; this.rig.add(m); this.models[id] = m; }
    this.arm = buildArm(); this.rig.add(this.arm);
    this.leftArm = buildArm(); this.leftArm.position.set(-0.36, -0.02, -0.15); this.leftArm.visible = false; this.vmScene.add(this.leftArm);
    this.cur = 0; this.fireT = 0; this.reloadT = 0; this.switchT = 0; this.charge = 0; this.heat = 0; this.locked = 0;
    this.recoil = 0; this.ads = false; this.adsT = 0; this.adsFactor = 1; this.punchT = 0;
    this.beamOn = false; this.hitMarkT = 0;
  }
  get S() { return this.G.state; }
  get id() { return this.S.loadout[this.cur] || this.S.loadout[0]; }
  get def() { return WDEF[this.id]; }
  ammo(id = this.id) { return this.S.ammo[id] || (this.S.ammo[id] = [WDEF[id].mag || 0, WDEF[id].reserve === Infinity ? 0 : WDEF[id].reserve]); }

  give(id, silent) {
    const S = this.S;
    if (!S.weapons.includes(id)) S.weapons.push(id);
    const def = WDEF[id];
    S.ammo[id] = [def.mag || 0, def.reserve === Infinity ? 0 : def.reserve];
    if (S.loadout.includes(id)) { this.cur = S.loadout.indexOf(id); }
    else if (!S.loadout[1]) { S.loadout[1] = id; this.cur = 1; }
    else { S.loadout[this.cur] = id; }
    this.switchT = 0.35;
    if (!silent) this.G.ui.toast(`Picked up ${WEAPONS[id].name}: ${WEAPONS[id].role}.`);
  }
  swap() {
    if (!this.S.loadout[1]) return;
    this.cur = 1 - this.cur; this.switchT = 0.35; this.reloadT = 0; this.charge = 0; this.G.audio.play("ui");
  }
  refill(frac = 1) {
    for (const id of this.S.weapons) {
      const d = WDEF[id], a = this.ammo(id);
      if (d.reserve === Infinity || d.beam) continue;
      a[1] = Math.min(d.reserve, a[1] + Math.ceil(d.reserve * frac));
      if (frac >= 1) a[0] = d.mag;
    }
  }
  punch() { this.punchT = 0.3; }

  startReload() {
    const d = this.def, a = this.ammo();
    if (d.beam || this.reloadT > 0 || a[0] >= d.mag) return;
    if (d.reserve !== Infinity && a[1] <= 0) return;
    this.reloadT = d.reload; this.G.audio.play("reload");
  }

  update(dt, firing, aiming, canFire) {
    const G = this.G, d = this.def, a = this.ammo();
    this.fireT -= dt; this.switchT = Math.max(0, this.switchT - dt); this.hitMarkT = Math.max(0, this.hitMarkT - dt);
    this.recoil = lerp(this.recoil, 0, Math.min(1, dt * 10)); this.punchT = Math.max(0, this.punchT - dt);
    if (this.reloadT > 0) {
      this.reloadT -= dt;
      if (this.reloadT <= 0) {
        const need = d.mag - a[0];
        if (d.reserve === Infinity) a[0] = d.mag;
        else { const take = Math.min(need, a[1]); a[0] += take; a[1] -= take; }
      }
    }
    // heat for the Ion Beam
    if (this.locked > 0) { this.locked -= dt; if (this.locked <= 0) this.heat = 0.3; }
    this.ads = aiming && canFire && this.switchT <= 0;
    this.adsT = clamp(this.adsT + (this.ads ? dt : -dt) * 6, 0, 1);
    this.adsFactor = lerp(1, d.ads, this.adsT);
    this.beamOn = false;
    if (!canFire || this.switchT > 0) { this.charge = 0; this.coolHeat(dt); return; }

    if (d.beam) {
      if (firing && this.locked <= 0) {
        this.beamOn = true;
        this.heat += d.heat * dt;
        this.fireBeam(dt);
        if (this.heat >= 1) { this.heat = 1; this.locked = d.lock; G.audio.play("overheat"); G.ui.toast("Ion Beam overheated: cooling down."); }
      } else this.coolHeat(dt);
      return;
    }
    if (this.reloadT > 0) return;
    // an empty magazine reloads by itself
    if (a[0] <= 0 && (d.reserve === Infinity || a[1] > 0)) { this.startReload(); return; }
    if (d.charge) {
      // Arc Pistol: tap for quick shots, hold to charge
      if (firing) { this.charge += dt; if (this.charge >= d.charge && !this.chargeCue) { this.chargeCue = true; G.audio.play("ui"); } }
      else if (this.charge > 0) {
        if (this.fireT <= 0 && a[0] > 0) {
          if (this.charge >= d.charge && a[0] >= 3) this.fire(true); else this.fire(false);
        }
        this.charge = 0; this.chargeCue = false;
      }
      if (a[0] <= 0 && this.reloadT <= 0) this.startReload();
      return;
    }
    const want = d.auto ? firing : (firing && this.G.input.mousePressed[0]);
    if (want && this.fireT <= 0) {
      if (a[0] <= 0) {
        G.audio.play("empty"); this.fireT = 0.25; this.startReload();
        if (a[1] <= 0 && d.reserve !== Infinity) {
          const other = this.S.loadout[1 - this.cur];
          if (other) { this.swap(); G.ui.toast(`${WEAPONS[this.id].name} is out of energy. Switched weapons. Supply stations and energy packs refill it.`); }
          else G.ui.toast("Out of energy for this weapon. Find a supply station or energy packs.");
        }
        return;
      }
      this.fire(false);
    }
  }
  coolHeat(dt) { if (this.locked <= 0) this.heat = Math.max(0, this.heat - WDEF.beam.cool * dt); }

  // Ray from the eye with spread and optional aim assist.
  aimDir(spread) {
    const G = this.G, p = G.player;
    p.eye(_v); p.forward(_f);
    if (G.aimAssist) {
      const t = G.robots.assistTarget(_v, _f, 0.045, 80);
      if (t) _f.lerp(t, 0.6).normalize();
    }
    if (spread) {
      _r.set(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).multiplyScalar(spread * 2);
      _f.add(_r).normalize();
    }
    return _f;
  }
  muzzle(out) {
    const cam = this.G.camera;
    _u.set(0.22, -0.18, -0.7).applyQuaternion(cam.quaternion);
    return out.copy(cam.position).add(_u);
  }

  fire(charged) {
    const G = this.G, d = this.def, a = this.ammo(), id = this.id;
    this.fireT = 1 / d.rate;
    a[0] -= charged ? 3 : 1;
    this.recoil += d.kick * (charged ? 2 : 1) * 8;
    G.player.pitch += (G.settings.reduceMotion ? 0.3 : 1) * d.kick * (this.ads ? 0.5 : 1);
    G.audio.play(charged ? "pistolCharge" : d.snd);
    G.noise(G.player.pos, 45);
    const eye = G.player.eye(new THREE.Vector3()), muz = this.muzzle(new THREE.Vector3());
    if (d.proj) {
      const f = this.aimDir(0).clone();
      G.projectiles.spawnFlux(muz.x, muz.y, muz.z, f.x * 32, f.y * 32 + 1.5, f.z * 32);
      return;
    }
    if (id === "shock") return this.fireShock(eye, muz);
    const pellets = d.pellets || 1;
    for (let k = 0; k < pellets; k++) {
      const spread = (d.spread || 0) * (this.ads ? 0.5 : 1) * (G.player.speed2d > 6 ? 1.6 : 1);
      const f = this.aimDir(spread);
      const hit = castShot(G, eye.x, eye.y, eye.z, f.x, f.y, f.z, d.range);
      const end = hit ? hit : { x: eye.x + f.x * d.range, y: eye.y + f.y * d.range, z: eye.z + f.z * d.range };
      G.fx.tracer(muz.x, muz.y, muz.z, end.x, end.y, end.z, charged ? 0xc8e8ff : d.color, id === "prism" ? 0.18 : 0.06);
      if (!hit) continue;
      let dmg = charged ? 34 : d.dmg;
      if (d.fall) { const [f0, f1, m] = d.fall; dmg *= lerp(1, m, clamp((hit.t - f0) / (f1 - f0), 0, 1)); }
      this.applyHit(hit, dmg, { shieldMul: charged ? 3 : d.shieldMul || 1, weakMul: d.weak || 1.6, color: d.color });
    }
  }
  applyHit(hit, dmg, o) {
    const G = this.G;
    if (hit.target) {
      const r = hit.target.hurt(dmg, { ...o, part: hit.part, x: hit.x, y: hit.y, z: hit.z });
      if (r) {
        this.hitMarkT = 0.15; this.hitKind = r.weak ? "weak" : r.blocked ? "blocked" : "hit";
        G.audio.play(r.blocked ? "shieldHit" : r.weak ? "weakHit" : "hit");
        G.fx.burst(hit.x, hit.y, hit.z, r.blocked ? 0x77bbff : r.shield ? 0x88ddff : r.weak ? 0xffffff : 0xffb347, 5, 4, 0.07, 0.3, 6);
        if (r.killed) G.ui.takedown();
      }
    } else if (hit.enemyBarrier) {
      hit.enemyBarrier.hp -= dmg;
      G.fx.burst(hit.x, hit.y, hit.z, 0xc49bff, 4, 3, 0.06, 0.25, 0);
    } else {
      G.fx.burst(hit.x, hit.y, hit.z, o.color || 0xffffff, 3, 2.5, 0.05, 0.25, 4);
      if (hit.world && hit.world.c && hit.world.c.volatile) G.combat.volatileHit(hit.world.c);
    }
  }
  fireBeam(dt) {
    const G = this.G, d = this.def, eye = G.player.eye(new THREE.Vector3()), muz = this.muzzle(new THREE.Vector3());
    const f = this.aimDir(0);
    const hit = castShot(G, eye.x, eye.y, eye.z, f.x, f.y, f.z, d.range);
    const end = hit || { x: eye.x + f.x * d.range, y: eye.y + f.y * d.range, z: eye.z + f.z * d.range };
    G.fx.beam(muz.x, muz.y, muz.z, end.x, end.y, end.z, d.color, 0.06);
    G.audio.play("beam");
    G.noise(G.player.pos, 30);
    if (hit) {
      this.beamTick = (this.beamTick || 0) + dt;
      if (this.beamTick >= 0.1) { this.applyHit(hit, d.dps * this.beamTick, { shieldMul: 1, weakMul: 1.3, color: d.color }); this.beamTick = 0; }
      else G.fx.burst(end.x, end.y, end.z, d.color, 1, 2, 0.05, 0.15, 0);
    }
  }
  fireShock(eye, muz) {
    const G = this.G, d = this.def;
    const f = this.aimDir(0);
    const targets = G.robots.coneTargets(eye, f, d.range, 0.42, d.chain);
    if (!targets.length) {
      const hit = castShot(G, eye.x, eye.y, eye.z, f.x, f.y, f.z, d.range);
      const end = hit || { x: eye.x + f.x * d.range, y: eye.y + f.y * d.range, z: eye.z + f.z * d.range };
      this.arc(muz, end);
      if (hit) this.applyHit(hit, d.dmg, { shieldMul: 1.2, weakMul: 1.2, color: d.color, stun: d.stun, interrupt: true });
      return;
    }
    let from = muz;
    for (const r of targets) {
      const to = { x: r.pos.x, y: r.pos.y + r.def.h * 0.55, z: r.pos.z };
      this.arc(from, to);
      const res = r.hurt(d.dmg, { shieldMul: 1.2, weakMul: 1, stun: d.stun, interrupt: true, x: to.x, y: to.y, z: to.z });
      if (res) { this.hitMarkT = 0.15; this.hitKind = "hit"; if (res.killed) G.ui.takedown(); }
      from = to;
    }
  }
  arc(a, b) {
    const G = this.G;
    let px = a.x, py = a.y, pz = a.z;
    for (let k = 1; k <= 5; k++) {
      const t = k / 5, j = k < 5 ? 0.35 : 0;
      const x = lerp(a.x, b.x, t) + (Math.random() - 0.5) * j, y = lerp(a.y, b.y, t) + (Math.random() - 0.5) * j, z = lerp(a.z, b.z, t) + (Math.random() - 0.5) * j;
      G.fx.tracer(px, py, pz, x, y, z, 0xfff27a, 0.08);
      px = x; py = y; pz = z;
    }
  }

  // ---------- first-person model ----------
  updateView(dt, cam) {
    const G = this.G, p = G.player, S = G.settings;
    this.vmCam.aspect = cam.aspect; this.vmCam.updateProjectionMatrix();
    for (const id in this.models) this.models[id].visible = false;
    const carrying = !!p.carry;
    const m = this.models[this.id];
    if (m && !carrying) m.visible = true;
    // suit colors on the arm
    const suit = G.suitColors();
    this.arm.userData.sleeve.material.color.set(suit[0]); this.arm.userData.stripe.material.color.set(suit[2]);
    this.leftArm.userData.sleeve.material.color.set(suit[0]); this.leftArm.userData.stripe.material.color.set(suit[2]);
    const bobOn = S.headBob && !S.reduceMotion;
    const sp = p.grounded ? Math.min(1, p.speed2d / 8) : 0;
    const bx = bobOn ? Math.sin(p.bob) * 0.012 * sp : 0, by = bobOn ? Math.abs(Math.cos(p.bob)) * 0.012 * sp : 0;
    const ads = this.adsT;
    let x = lerp(0.2, 0.0, ads), y = lerp(-0.19, -0.12, ads), z = lerp(-0.42, -0.32, ads);
    let rx = 0, ry = 0, rz = 0;
    if (p.sprinting) { rx = -0.25; ry = 0.5; x += 0.04; }
    if (this.reloadT > 0) { rx = -0.6; y -= 0.06; rz = 0.3; }
    if (this.switchT > 0) y -= this.switchT * 0.8;
    if (carrying) y -= 0.5;
    z += this.recoil * 0.05; rx += this.recoil * 0.4;
    if (this.id === "prism" && ads > 0.9) { y -= 0.4; } // scoped: hide the model
    this.rig.position.set(x + bx, y - by, z);
    this.rig.rotation.set(rx, ry, rz);
    this.arm.position.set(0, 0, 0);
    // left arm: shows for tether / repulse / carrying
    const showLeft = carrying || !!p.tether || this.punchT > 0;
    this.leftArm.visible = showLeft;
    if (showLeft) this.leftArm.position.set(-0.3, -0.2 + (this.punchT > 0 ? 0.05 : 0), -0.3 - (this.punchT > 0 ? Math.sin(this.punchT * 10) * 0.2 : 0));
    // heat glow on the ion beam
    if (this.id === "beam") m.children.forEach((c) => { if (c.name === "vent") c.material.color.setHSL(0.9 - this.heat * 0.9, 1, 0.5 + this.heat * 0.2); });
  }
  render(renderer) {
    renderer.clearDepth();
    renderer.render(this.vmScene, this.vmCam);
  }
}
