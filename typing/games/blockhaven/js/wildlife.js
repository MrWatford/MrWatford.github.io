import { B, I, HEIGHT, SOLID } from "./blocks.js";
import { Sound } from "./audio.js";
import { WILDLIFE_EGGS } from "./wildlife-catalog.js";
import { findGrizzlyDen, grizzlyDenRoom } from "./wildlife-dens.js";
import { LION, ZEBRA, canSpawnGrassland, spawnGrasslandGroup, thinkGrassland } from "./wildlife-grassland.js";
import { SEAL, WALRUS, coastalSpawnSite, spawnCoastalColony, thinkCoastWildlife } from "./wildlife-coast.js";
import { OCTOPUS, MANTA, reefSpawnSite, thinkReefWildlife } from "./wildlife-reef.js";
import { CROC, HIPPO, thinkWetland, wetlandSpawnSite } from "./wildlife-wetlands.js";
import { WHALE, ORCA, spawnMarine, thinkMarine } from "./wildlife-ocean.js";
import { WILDLIFE_MODELS } from "./wildlife-models.js";

const BEAR = "grizzly_bear", SHARK = "great_white_shark", EAGLE = "bald_eagle";
const fish = new Set(["minnow", "sunfin", "salmon"]);
const forest = new Set(["forest", "birch"]);
const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
const clamp = (v, low, high) => Math.max(low, Math.min(v, high));
const cell = (w, x, y, z) => w.id(Math.floor(x), Math.floor(y), Math.floor(z));
const speciesStats = {
  [BEAR]: { w: 2.75, h: 2.2, hp: 250, speed: 3.15, xp: 24, sound: "grizzly", variants: ["brown", "ancient"],
    drops: e => e.baby ? [] : [[I.LEATHER, e.variant === 1 ? 6 : 3]] },
  [SHARK]: { w: 2.9, h: 2.15, hp: 54, speed: 4.6, xp: 7, swims: true, sound: "sharkrush" },
  [WHALE]: { w: 2.8, h: 3, length: 6.4, scale: 1.85, hp: 95, speed: 2.6, swims: true, cetacean: true, dryTime: 18, sound: "whalesong" },
  [ORCA]: { w: 1.7, h: 2.5, length: 3.8, scale: 1.1, hp: 46, speed: 4.4, swims: true, cetacean: true, sound: "orcacall" },
  [CROC]: { w: 1.55, h: 1.08, length: 2.75, scale: 1.2, hp: 36, speed: 2.6, xp: 4, amphibious: true, sound: "croclunge" },
  [HIPPO]: { w: 2.35, h: 2.58, length: 3.25, scale: 1.43, hp: 80, speed: 2.9, amphibious: true, sound: "hippowarn" },
  [OCTOPUS]: { w: 1.35, h: 1.65, hp: 16, speed: 2.35, swims: true, reefDweller: true, xp: 3, sound: "octopusink",
    variants: [0, 1, 2, 3], defaultVariant: 0, drops: () => [[I.INK_SAC, 2]] },
  [MANTA]: { w: 1.65, h: 0.95, length: 2.5, finSpan: 4.35, scale: 1.13, hp: 24, speed: 3.25, swims: true, reefDweller: true, sound: "rayglide" },
  [SEAL]: { w: 1.25, h: 1.13, length: 2.1, scale: 1.06, hp: 18, speed: 2.5, amphibious: true, coastal: true, sound: "sealcall", variants: [0, 1] },
  [WALRUS]: { w: 2.1, h: 2.02, length: 3.2, scale: 1.32, hp: 62, babyHp: 24, speed: 2.3, amphibious: true, coastal: true, sound: "walruswarn" },
  [LION]: { w: 1.3, h: 1.75, length: 2.35, scale: 1.12, hp: 36, speed: 3.2, xp: 8, grassland: true, variants: [0, 1], sound: "lionroar" },
  [ZEBRA]: { w: 1.24, h: 2.55, length: 2.48, scale: 1.06, hp: 22, speed: 2.8, xp: 3, grassland: true, sound: "zebraalarm" },
  [EAGLE]: { w: 0.8, h: 1.05, hp: 16, speed: 6, flies: true, sound: "eagle" }
};

export function installWildlife(species) {
  for (const [id, name] of WILDLIFE_EGGS) {
    if (Object.hasOwn(species, id)) throw new Error("Duplicate wildlife species " + id);
    species[id] = { name, ai: "wildlife", wildlife: true, food: [], drops: () => [],
      persist: true, model: WILDLIFE_MODELS[id](), ...speciesStats[id] };
  }
}

function live(e) {
  return !e.dead && !e.gone && e.hp > 0;
}

function face(e, target) {
  e.yaw = Math.atan2(e.pos.x - target.x, e.pos.z - target.z);
}

function strike(manager, e, damage, label) {
  manager.ctx.hurtPlayer(damage, label, e);
}

function sameGrizzlyFamily(a, b) {
  return b.sp === BEAR && a.home.every((v, i) => v === b.home[i]);
}

export function alertGrizzlyFamily(manager, cub) {
  if (cub.sp !== BEAR || !cub.baby) return;
  for (const adult of manager.near(cub.pos.x, cub.pos.y, cub.pos.z, 18, other =>
    !other.baby && sameGrizzlyFamily(cub, other))) adult.angry = Math.max(adult.angry, 20);
}

function bearThink(manager, e, p, d, multiplier, daylight) {
  const ctx = manager.ctx, s = e.wild, home = { x: e.home[0], y: e.home[1], z: e.home[2] };
  const fromHome = distance(e.pos, home);
  const playerThreat = manager.targetable();
  if (e.den && manager.world.isLoaded(Math.floor(home.x), Math.floor(home.z)) &&
      s.denCheck !== manager.world.editCount) {
    s.denCheck = manager.world.editCount;
    e.den = grizzlyDenRoom(manager.world, Math.floor(home.x), home.y, Math.floor(home.z));
  }
  if (e.baby) {
    const adult = manager.near(e.pos.x, e.pos.y, e.pos.z, 18, o =>
      !o.baby && sameGrizzlyFamily(e, o))[0];
    const retreat = e.den && (daylight < 0.35 || playerThreat && (e.angry > 0 || (d < 5 && manager.canSeePlayer(e))));
    const follow = retreat ? home : adult?.pos || home;
    if (distance(e.pos, follow) > (retreat ? 0.75 : 3)) {
      s.phase = "patrol";
      manager.moveTo(e, follow, retreat ? 3 : 2.15, retreat ? 0.65 : 2);
    } else if (retreat) {
      e.goal = e.path = null;
      s.phase = "rest";
    } else {
      s.phase = "patrol";
      manager.wander(e);
    }
    return;
  }
  const outOfTerritory = fromHome > 23;
  const ancient = e.variant === 1;
  const seen = d < 22 && manager.targetable() && manager.canSeePlayer(e);
  const cubNearby = seen && d < 12 && manager.near(p.pos.x, p.pos.y, p.pos.z, 4.75,
    o => o.baby && sameGrizzlyFamily(e, o)).length > 0;
  const denIntrusion = e.den && distance(p.pos, home) < 4.5;
  if (seen && (d < (p.crouch ? 3.25 : 5.5) || cubNearby || denIntrusion)) e.angry = Math.max(e.angry, 8);
  if (outOfTerritory || !manager.targetable() || d > 24 || e.angry <= 0) {
    s.phase = "patrol";
    if (outOfTerritory) e.angry = 0;
    if (e.den && daylight < 0.35) {
      if (fromHome > 1.2) manager.moveTo(e, home, 2.2, 0.95);
      else {
        e.goal = e.path = null;
        s.phase = "rest";
      }
    } else if (fromHome > 10) manager.moveTo(e, home, 2.2, 2);
    else manager.wander(e);
    return;
  }
  const now = e.age;
  if (s.phase === "patrol" || s.phase === "rest") {
    s.phase = "roar";
    s.until = now + 1.05;
    e.path = null;
    Sound.mob("grizzly", d);
  }
  if (s.phase === "roar" || s.phase === "swipe" || s.phase === "slam") {
    e.goal = null;
    face(e, p.pos);
    if (now < s.until) return;
    const slam = s.phase === "slam";
    if (s.phase !== "roar" && seen && d < (slam ? (ancient ? 4.65 : 4.1) : 2.8) && Math.abs(p.pos.y - e.pos.y) < 2) {
      strike(manager, e, (slam ? 18 : 12) * (ancient ? 1.25 : 1) * multiplier,
        slam ? "The grizzly's ground slam caught you." : "The grizzly struck with its claws.");
      if (slam) {
        const dx = p.pos.x - e.pos.x, dz = p.pos.z - e.pos.z, length = Math.hypot(dx, dz) || 1;
        ctx.push(dx / length * 5.5, 3, dz / length * 5.5);
      }
    }
    if (slam) ctx.particles(e.pos.x, e.pos.y + 0.15, e.pos.z, "poof");
    s.until = now + (s.phase === "roar" ? 0 : 1.1);
    s.phase = "recover";
    return;
  }
  if (s.phase === "charge") {
    const dx = p.pos.x - e.pos.x, dz = p.pos.z - e.pos.z, dir = s.charge;
    if (seen && d < 2.65 && dx * dir.x + dz * dir.z > -0.15 && Math.abs(p.pos.y - e.pos.y) < 1.8) {
      strike(manager, e, (ancient ? 19 : 15) * multiplier, "The grizzly charged into you.");
      ctx.push(dir.x * 6, 2.8, dir.z * 6);
      s.until = now;
    }
    if (now >= s.until || !e.goal) {
      e.goal = null;
      s.phase = "recover";
      s.until = now + 1.3;
    }
    return;
  }
  if (s.phase === "chargeWindup") {
    e.goal = null;
    if (now >= s.until) {
      s.phase = "charge";
      s.until = now + 0.95;
      e.goal = { x: e.pos.x + s.charge.x * 7, z: e.pos.z + s.charge.z * 7, speed: 6.8 };
    }
    return;
  }
  if (now < s.until) return;
  if (seen && d < 3.1) {
    e.goal = e.path = null;
    s.phase = e.hp <= e.maxHp * (ancient ? 0.8 : 0.6) && s.lastAttack !== "slam" ? "slam" : "swipe";
    s.until = now + (s.phase === "slam" ? 0.9 : 0.45);
    s.lastAttack = s.phase;
    if (s.phase === "slam") Sound.mob("grizzly", d);
  } else if (seen && d >= 4 && d < 8 && Math.abs(p.pos.y - e.pos.y) < 1.15) {
    face(e, p.pos);
    s.charge = { x: -Math.sin(e.yaw), z: -Math.cos(e.yaw) };
    e.goal = e.path = null;
    s.phase = "chargeWindup";
    s.until = now + 0.65;
    Sound.mob("snort", d);
  } else manager.moveTo(e, p.pos, e.def.speed, 2.3);
}

export function sharkWater(w, x, y, z) {
  return w.isLoaded(Math.floor(x), Math.floor(z)) &&
    cell(w, x, y + 0.3, z) === B.WATER && cell(w, x, y + 2.05, z) === B.WATER;
}

function fishTarget(manager, e, radius, canReach) {
  let best = null, closest = radius;
  for (const item of manager.list) {
    if (!fish.has(item.sp) || !live(item) || !item.inWater) continue;
    const d = distance(e.pos, item.pos);
    if (d >= closest || !canReach(item.pos)) continue;
    best = item;
    closest = d;
  }
  return best;
}

function sharkThink(manager, e, p, d, multiplier, clearPath) {
  const w = manager.world, s = e.wild, now = e.age;
  if (!e.inWater) { s.phase = "patrol"; s.prey = null; return; }
  if (now >= (s.orcaScanAt ?? 0)) {
    s.orcaScanAt = now + 1;
    const orca = manager.near(e.pos.x, e.pos.y, e.pos.z, 7, other =>
      other.sp === ORCA && other.inWater && clearPath(other.pos))[0];
    if (orca) {
      const dx = e.pos.x - orca.pos.x, dz = e.pos.z - orca.pos.z;
      const separation = Math.hypot(dx, dz);
      s.prey = null;
      s.phase = "avoid";
      s.until = now + 2;
      e.goal = null;
      if (separation > 0.1) manager.waterGoal(e, 7, e.def.speed * 1.2, { x: dx / separation, z: dz / separation });
    }
  }
  if (s.phase === "avoid" && now < s.until) return;
  const suitable = pos => sharkWater(w, pos.x, pos.y - 0.8, pos.z) && clearPath(pos);
  if (!s.prey && now >= (s.scanAt ?? 0)) {
    s.scanAt = now + 1;
    if (s.phase !== "recover" || now >= s.until) {
      if (manager.targetable() && p.inWater && d < 14 && suitable(p.pos) && (e.angry > 0 || Math.random() < 0.07)) {
        s.prey = "player";
        s.playerId = p.mpId ?? null;
      } else s.prey = fishTarget(manager, e, 14, suitable);
      if (s.prey) {
        s.phase = "circle";
        s.until = now + 2.2;
      } else s.phase = "patrol";
    }
  }
  const target = s.prey === "player" ? p : s.prey;
  if (target && (!target.inWater || (s.prey === "player" ? !manager.targetable() || s.playerId !== (p.mpId ?? null) : !live(target)) ||
      distance(e.pos, target.pos) > 18 || !suitable(target.pos))) {
    s.prey = null;
    s.phase = "recover";
    s.until = now + 2;
  }
  if (!s.prey) {
    if (!e.goal) manager.waterGoal(e, 8, e.def.speed * 0.67);
    return;
  }
  const t = target.pos, y = t.y - 0.8;
  if (s.phase === "circle") {
    const angle = Math.atan2(e.pos.z - t.z, e.pos.x - t.x) + 0.85;
    const x = t.x + Math.cos(angle) * 4.7, z = t.z + Math.sin(angle) * 4.7;
    const orbit = sharkWater(w, x, y, z);
    e.goal = { x: orbit ? x : t.x, y, z: orbit ? z : t.z, speed: 3.3 };
    if (now < s.until) return;
    s.phase = "lunge";
    s.until = now + 1.05;
    Sound.mob("sharkrush", d);
  }
  const contact = distance(e.pos, { x: t.x, y, z: t.z }) < 2.05;
  if (contact || now >= s.until) {
    if (contact) {
      if (s.prey === "player") strike(manager, e, 9 * multiplier, "A Great White Shark lunged at you.");
      else manager.damage(target, 9, e);
    }
    s.prey = null;
    s.phase = "recover";
    s.until = now + 5.5;
    e.goal = null;
  } else e.goal = { x: t.x, y, z: t.z, speed: 8.6 };
}

function eagleThink(manager, e, d, clearPath) {
  const s = e.wild, w = manager.world, now = e.age;
  if (s.phase === "dive") {
    const prey = s.prey;
    if (live(prey) && now < s.until) {
      const target = { x: prey.pos.x, y: prey.pos.y + 1, z: prey.pos.z };
      if (distance(e.pos, target) < 1.25 && clearPath(prey.pos)) manager.damage(prey, 5, e);
      else { e.goal = { ...target, speed: 9 }; return; }
    }
    s.prey = null;
    s.phase = "climb";
    s.until = now + 3;
  }
  if (now >= (s.scanAt ?? 0) && now >= (s.until ?? 0)) {
    s.scanAt = now + 2.5;
    const prey = fishTarget(manager, e, 19, pos =>
      e.pos.y > pos.y + 2 && w.surfaceY(Math.floor(pos.x), Math.floor(pos.z)) - pos.y < 1.4 && clearPath(pos));
    if (prey) {
      s.phase = "dive";
      s.until = now + 4.5;
      s.prey = prey;
      Sound.mob("eagle", d);
      return;
    }
  }
  if (d < 28 && now >= (s.callAt ?? 0)) {
    Sound.mob("eagle", d);
    s.callAt = now + 18 + Math.random() * 18;
  }
  const [hx, hy, hz] = e.home;
  if (!e.goal || now >= (s.routeAt ?? 0)) {
    const angle = Math.atan2(e.pos.z - hz, e.pos.x - hx) + 0.8;
    const x = hx + Math.cos(angle) * 12, z = hz + Math.sin(angle) * 12;
    if (!w.isLoaded(Math.floor(x), Math.floor(z))) { e.goal = null; return; }
    const floor = w.surfaceY(Math.floor(x), Math.floor(z));
    e.goal = { x, z, y: clamp(Math.max(hy, floor + 5) + Math.sin(angle) * 2, 3, HEIGHT - 2), speed: 5.2 };
    s.routeAt = now + 2.2;
    if (s.phase !== "climb" || now >= s.until) s.phase = "soar";
  }
}

export function thinkWildlife(manager, e, d, multiplier, clearPath, daylight) {
  e.angry = Math.max(0, e.angry - (e.thinkT || 0.15));
  if (e.sp === BEAR) bearThink(manager, e, manager.ctx.player(), d, multiplier, daylight);
  else if (e.sp === SHARK) sharkThink(manager, e, manager.ctx.player(), d, multiplier, clearPath);
  else if (e.def.grassland) thinkGrassland(manager, e, d, multiplier, daylight, clearPath);
  else if (e.def.reefDweller) thinkReefWildlife(manager, e, clearPath);
  else if (e.def.coastal) thinkCoastWildlife(manager, e, multiplier, clearPath);
  else if (e.def.amphibious) thinkWetland(manager, e, d, multiplier, clearPath);
  else if (e.def.cetacean) thinkMarine(manager, e, d, clearPath);
  else eagleThink(manager, e, d, clearPath);
}

export function animateWildlife(e, dt, d2, reducedMotion) {
  const P = e.parts, s = e.wild, phase = s.phase;
  const speed = Math.hypot(e.vel.x, e.vel.z);
  const blend = 1 - Math.exp(-dt * 10);
  const to = (axis, key, target) => { axis[key] += (target - axis[key]) * blend; };
  const t = e.age;
  const near = d2 < 26 ** 2;
  if (s.detail !== near) {
    for (const part of e.def.model.parts) {
      if (part.detail) P[part.name].children[0].visible = near;
    }
    s.detail = near;
  }
  if (e.sp === BEAR) {
    const rear = phase === "roar" || phase === "slam", resting = phase === "rest";
    const stride = Math.sin(e.walkPhase * 2.2) * Math.min(0.65, speed * 0.16);
    to(e.root.rotation, "x", rear ? -0.65 : 0);
    to(e.root.position, "y", rear ? 0.64 * e.scale : resting ? -0.36 * e.scale : 0);
    to(P.jaw.rotation, "x", rear ? 0.82 : phase === "chargeWindup" ? 0.28 : 0.03);
    to(P.head.rotation, "x", rear ? 0.44 : resting ? 0.3 : (reducedMotion ? 0 : Math.sin(t * 2) * 0.054));
    for (const sign of [-1, 1]) {
      to(P["fore" + sign].rotation, "x", phase === "swipe" && sign === 1 ? -1.1 : rear ? 0.48 : resting ? -0.9 : stride * sign);
      to(P["hind" + sign].rotation, "x", rear ? 0.35 : resting ? 0.85 : -stride * sign);
    }
  } else if (e.sp === SHARK) {
    const wave = reducedMotion ? 0.12 : 0.28;
    to(P.tail.rotation, "y", Math.sin(e.walkPhase) * wave);
    to(P.tailTip.rotation, "y", Math.sin(e.walkPhase - 0.8) * wave * 1.4);
    to(P.jaw.rotation, "x", phase === "lunge" ? 0.48 : 0.025);
    to(e.root.rotation, "x", clamp(-e.vel.y * 0.065, -0.20, 0.20));
  } else if (e.sp === OCTOPUS) {
    const escape = phase === "escape", resting = phase === "camouflage";
    e.mat.map = e.def.texs[escape ? 0 : s.skin ?? 0] || e.def.tex;
    const rhythm = t * (escape ? 10 : 4.1);
    const effort = reducedMotion ? 0.11 : resting ? 0.12 : 0.26;
    for (let arm = 0; arm < 8; arm++) {
      const bearing = arm / 8 * Math.PI * 2, name = "arm" + arm;
      const wave = Math.sin(rhythm - arm * 0.9);
      to(P[name].rotation, "x", (escape ? 0.3 : 0.22) + wave * effort);
      to(P[name].rotation, "y", bearing + (escape ? wave * 0.15 : 0));
      to(P[name + "Mid"].rotation, "x", -0.24 - wave * effort * 0.85);
      to(P[name + "Mid"].rotation, "y", Math.sin(arm * 2.7 + t * 0.65) * (escape ? 0.12 : 0.25));
      to(P[name + "Tip"].rotation, "x", 0.16 + wave * effort * 1.2);
      to(P[name + "Tip"].rotation, "y", Math.sin(arm * 2.7 + t * 0.65) * (escape ? 0.06 : 0.34));
    }
    to(P.mantle.scale, "y", escape ? 1 + Math.sin(rhythm) * 0.045 : 1);
    to(e.root.rotation, "x", escape ? clamp(-e.vel.y * 0.1, -0.24, 0.24) : 0);
  } else if (e.sp === MANTA) {
    const glide = Math.sin(t * 0.65) > 0.34;
    const stroke = glide ? 0.075 : Math.sin(t * 3.45) * (reducedMotion ? 0.16 : 0.37);
    const delta = Math.atan2(Math.sin(e.yaw - (s.lastYaw ?? e.yaw)), Math.cos(e.yaw - (s.lastYaw ?? e.yaw)));
    s.lastYaw = e.yaw;
    to(e.root.rotation, "z", clamp(delta * 4.4, -0.33, 0.33));
    to(e.root.rotation, "x", clamp(-e.vel.y * 0.15, -0.24, 0.24));
    to(P.tail.rotation, "y", Math.sin(t * 2.25) * 0.12);
    to(P.tailTip.rotation, "y", Math.sin(t * 2.25 - 0.85) * 0.17);
    for (const sign of [-1, 1]) {
      to(P["fin" + sign].rotation, "z", sign * stroke);
      to(P["finMid" + sign].rotation, "z", sign * (glide ? 0.055 : Math.sin(t * 3.45 - 0.55) * 0.2));
      to(P["finOuter" + sign].rotation, "z", sign * (glide ? 0.06 : Math.sin(t * 3.45 - 1.05) * 0.15));
    }
  } else if (e.def.grassland) {
    const lion = e.sp === LION, sprint = phase === "chase" || phase === "flee";
    const low = phase === "stalk", sleep = phase === "sleep";
    const stride = Math.sin(e.walkPhase * (sprint ? 2.55 : 1.8)) * Math.min(sprint ? 0.82 : 0.44, speed * 0.15);
    const bob = !reducedMotion && sprint ? Math.sin(e.walkPhase * 5.1) * 0.048 : 0;
    to(e.root.position, "y", sleep ? -0.42 * e.scale : low ? -0.15 * e.scale : bob);
    to(e.root.rotation, "x", sleep ? 0.05 : low ? 0.08 : -bob);
    to(P.tail.rotation, "y", Math.sin(t * (sprint ? 4.5 : 2.3)) * (reducedMotion ? 0.095 : 0.28));
    to(P.tail.rotation, "x", lion ? (sprint ? -0.18 : 0.18) : sprint ? -0.32 : -0.72);
    if (lion) {
      P.mane.visible = e.variant === 0 && !e.baby;
      to(P.tailTip.rotation, "y", Math.sin(t * 2.3 - 0.55) * 0.32);
      to(P.head.rotation, "x", sleep ? 0.22 : phase === "warnPlayer" ? -0.24 : 0);
      to(P.jaw.rotation, "x", phase === "warnPlayer" ? 0.62 : phase === "pounce" ? 0.38 : 0.035);
    } else {
      to(P.neck.rotation, "x", phase === "graze" ? 1.10 : phase === "flee" ? 0.22 : 0.33);
      to(P.head.rotation, "x", phase === "graze" ? 0.24 : -0.07);
    }
    for (const side of [-1, 1]) for (const end of [-1, 1]) {
      const name = "leg" + side + "_" + end;
      const swing = stride * side * end;
      to(P[name].rotation, "x", sleep ? end * 1.05 : low ? swing * 0.5 : swing);
      if (!lion) to(P[name + "Shin"].rotation, "x", Math.max(0, swing * (sprint ? 0.65 : 0.30)));
    }
  } else if (e.def.coastal) {
    const seal = e.sp === SEAL, slide = phase === "slide", warning = phase === "warning";
    const motion = speed > 0.2 ? Math.sin(t * (seal ? 5.7 : 3.3)) : 0;
    const sweep = motion * (reducedMotion ? 0.16 : e.inWater ? 0.44 : 0.31);
    const twist = e.inWater ? clamp(-e.vel.y * 0.15, -0.28, 0.26) : warning ? -0.12 : slide ? 0.10 : 0;
    to(e.root.rotation, "x", twist);
    to(e.root.position, "y", !e.inWater && !slide && !reducedMotion ? Math.abs(sweep) * 0.09 : 0);
    to(P.head.rotation, "x", warning ? -0.40 : slide ? 0.12 : -sweep * 0.22);
    to(P.tail.rotation, "x", e.inWater ? sweep * 0.85 : -sweep * 0.23);
    to(P.tail.rotation, "y", e.inWater ? sweep * 0.55 : sweep * 0.28);
    for (const side of [-1, 1]) {
      const f = P["flipper" + side].rotation, aft = P["rearFin" + side].rotation;
      to(f, "y", side * (slide ? 0.87 : sweep * 0.65));
      to(f, "z", side * (slide ? 0.13 : sweep * 0.48));
      to(aft, "y", side * (e.inWater ? 0.16 + sweep * 0.55 : 0.02));
      if (!seal) {
        P["tusk" + side].visible = !e.baby;
        to(P.jaw.rotation, "x", warning ? 0.49 : phase === "defend" ? 0.20 : 0.015);
      }
    }
  } else if (e.def.amphibious) {
    const crocodile = e.sp === CROC;
    const stride = Math.sin(e.walkPhase * 2.1) * Math.min(0.58, speed * 0.16);
    const striking = phase === "lunge" || phase === "charge" || phase === "roll";
    const opening = phase === "warning" ? 0.93 : striking ? crocodile ? 0.52 : 0.35 : 0;
    const wave = Math.sin(e.age * 4 + e.walkPhase) * Math.min(0.35, speed * 0.13);
    to(P.jaw.rotation, "x", opening);
    to(P.head.rotation, "x", phase === "warning" ? -0.28 : striking && crocodile ? -0.09 : 0);
    to(P.tail.rotation, "y", crocodile && e.inWater ? wave : wave * 0.35);
    if (crocodile) {
      const progress = phase === "roll" ? clamp((t - s.rollAt) / 0.55, 0, 1) : 0;
      e.root.rotation.z = reducedMotion ? Math.sin(progress * Math.PI) * 0.25 : progress * 2 * Math.PI;
      to(P.tailMid.rotation, "y", e.inWater ? wave * 1.2 : wave * 0.35);
      to(P.tailTip.rotation, "y", e.inWater ? wave * 1.4 : wave * 0.45);
    }
    for (const sign of [-1, 1]) for (const end of [-1, 1]) {
      const leg = P["leg" + sign + "_" + end].rotation;
      to(leg, "x", sign * end * stride * (e.inWater ? 0.46 : 1));
      if (crocodile) to(leg, "z", e.inWater ? -sign * 0.28 : 0);
    }
    to(e.root.rotation, "x", e.inWater ? clamp(-e.vel.y * 0.1, -0.18, 0.18) : 0);
  } else if (e.def.cetacean) {
    const orca = e.sp === ORCA, effort = phase === "rush" ? 1.45 : 1;
    const wave = (reducedMotion ? 0.09 : orca ? 0.25 : 0.18) * effort;
    const rhythm = t * (orca ? 4.2 : 2.35) + e.walkPhase * 0.13;
    to(P.tail.rotation, "x", Math.sin(rhythm) * wave);
    to(P.tailTip.rotation, "x", Math.sin(rhythm - 0.85) * wave);
    to(P.jaw.rotation, "x", phase === "rush" ? 0.34 : 0.015);
    to(e.root.rotation, "x", clamp(-e.vel.y * 0.13, -0.28, 0.24));
    for (const sign of [-1, 1]) {
      to(P["flipper" + sign].rotation, "z", sign * (-0.16 + Math.sin(rhythm - 0.8) * wave * 0.43));
    }
  } else {
    const diving = phase === "dive";
    const glide = Math.sin(t * 0.7) > 0.1 && !diving && phase !== "climb";
    const stroke = Math.sin(t * 9.5) * (reducedMotion ? 0.23 : 0.64);
    const yawDelta = Math.atan2(Math.sin(e.yaw - (s.lastYaw ?? e.yaw)), Math.cos(e.yaw - (s.lastYaw ?? e.yaw)));
    s.lastYaw = e.yaw;
    to(e.root.rotation, "z", clamp(yawDelta * 4.5, -0.48, 0.48));
    to(e.root.rotation, "x", diving ? 0.31 : clamp(-e.vel.y * 0.12, -0.23, 0.23));
    for (const sign of [-1, 1]) {
      to(P["wing" + sign].rotation, "z", sign * (diving ? -0.25 : glide ? 0.09 : stroke));
      to(P["wing" + sign].rotation, "y", sign * (diving ? 0.63 : 0.03));
      to(P["wrist" + sign].rotation, "z", sign * (glide || diving ? 0.02 : stroke * 0.37));
      to(P["leg" + sign].rotation, "x", diving ? -0.15 : 0.92);
    }
  }
  e.mat.color.setRGB(1, e.hurtT > 0 ? 0.53 : 1, e.hurtT > 0 ? 0.46 : 1);
}

function groundRoom(w, x, y, z, radius) {
  for (let dz = -radius; dz <= radius; dz++) for (let dx = -radius; dx <= radius; dx++) {
    if (!w.isLoaded(x + dx, z + dz) || !SOLID[w.id(x + dx, y - 1, z + dz)]) return false;
    for (let dy = 0; dy < 3; dy++) {
      const id = w.id(x + dx, y + dy, z + dz);
      if (SOLID[id] || id === B.WATER || id === B.LAVA) return false;
    }
  }
  return true;
}

export function spawnWildlife(manager, dt, daylight, random = Math.random) {
  manager.wildlifeSpawnT = (manager.wildlifeSpawnT ?? 0) - dt;
  if (manager.wildlifeSpawnT > 0) return;
  manager.wildlifeSpawnT = 7;
  const w = manager.world, ctx = manager.ctx, p = ctx.player();
  if (w.gen.isNether() || w.gen.isEnd?.() || w.gen.isForsaken || w.gen.isMap?.() ||
      ctx.creative() || !ctx.alive() || daylight < 0.38 || manager.list.length >= 110) return;
  const angle = random() * Math.PI * 2, radius = 28 + random() * 12;
  const x = Math.floor(p.pos.x + Math.cos(angle) * radius), z = Math.floor(p.pos.z + Math.sin(angle) * radius);
  if (!w.isLoaded(x, z)) return;
  const surface = w.surfaceY(x, z), sx = x + 0.5, sz = z + 0.5;
  if (p.pos.y < surface - 13) return;
  const col = w.gen.column(x, z);
  const count = id => manager.list.filter(e => e.sp === id && live(e)).length;
  const roll = random();
  if (w.id(x, surface, z) === B.WATER) {
    if (roll >= 0.385 && roll < 0.49) {
      const species = roll < 0.445 ? OCTOPUS : MANTA;
      const site = count(species) < 2 && reefSpawnSite(w, speciesStats[species], sx, surface, sz, angle);
      if (site) manager.add(species, site.x, site.y, site.z, { yaw: site.yaw, ambient: true });
      return;
    }
    if (roll >= 0.268 && roll < 0.385 && ctx.settings().difficulty !== "peaceful" &&
        !(w.gen.villagePiece?.(Math.floor(x / 16), Math.floor(z / 16)))) {
      const species = roll < 0.33 ? CROC : HIPPO;
      const site = count(species) < 2 && wetlandSpawnSite(w, x, surface, z, speciesStats[species]);
      if (site) manager.add(species, site.x, site.y, site.z, { yaw: site.yaw, ambient: true });
      return;
    }
    if (manager.list.length <= 108 && roll >= 0.23 && roll < 0.268) {
      const species = roll < 0.253 ? ORCA : WHALE;
      if (!count(species)) spawnMarine(manager, species, speciesStats[species], sx, surface, sz, angle, random);
      return;
    }
    if (count(SHARK) >= 2 || roll >= 0.23 || ctx.settings().difficulty === "peaceful") return;
    const y = surface - 4;
    for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
      if (!sharkWater(w, sx + dx, y - 0.6, sz + dz)) return;
    }
    manager.add(SHARK, sx, y, sz, { yaw: angle, ambient: true });
    return;
  }
  if (roll >= 0.25 && roll < 0.45 && col.biome === "plains" && col.temperature >= 0.08 && col.moisture <= 0.12) {
    const species = roll < 0.405 ? ZEBRA : LION;
    const def = speciesStats[species], y = surface + 1;
    if (!count(species) && (species !== LION || ctx.settings().difficulty !== "peaceful") &&
        !w.gen.villagePiece?.(Math.floor(x / 16), Math.floor(z / 16)) &&
        canSpawnGrassland(w, def, sx, y, sz)) {
      const size = species === LION ? 2 + Number(random() < 0.27) : 3 + Number(random() < 0.6);
      spawnGrasslandGroup(manager, species, def, sx, y, sz, angle, Math.min(size, 110 - manager.list.length), random);
    }
    return;
  }
  if (roll >= 0.14 && roll < 0.24 && (col.temperature <= -0.18 || col.biome === "birch" || w.id(x, surface, z) === B.SNOW)) {
    const species = roll < 0.205 ? SEAL : WALRUS;
    if (!count(species) && !w.gen.villagePiece?.(Math.floor(x / 16), Math.floor(z / 16))) {
      const def = speciesStats[species], site = coastalSpawnSite(w, def, x, surface, z);
      if (site) spawnCoastalColony(manager, species, def, site, Math.min(3, 110 - manager.list.length), random);
    }
    return;
  }
  if (forest.has(col.biome) && roll < 0.04 && count(BEAR) === 0 && ctx.settings().difficulty !== "peaceful" &&
      w.id(x, surface, z) === B.GRASS && groundRoom(w, x, surface + 1, z, 1) &&
      !w.gen.villagePiece?.(Math.floor(x / 16), Math.floor(z / 16))) {
    const y = surface + 1;
    const den = findGrizzlyDen(w, x, y, z);
    const home = den || [sx, y, sz];
    const variant = den && random() < 0.08 ? 1 : 0;
    manager.add(BEAR, sx, y, sz, { home, den: !!den, variant, yaw: angle });
    if (!variant && random() < (den ? 0.65 : 0.22)) {
      const [cx, cy, cz] = den || [sx + 3, y, sz];
      if (den || groundRoom(w, x + 3, y, z, 0)) {
        manager.add(BEAR, cx, cy, cz, { baby: true, growT: 1800, home, den: !!den, yaw: angle });
      }
    }
    return;
  }
  if (roll < 0.13 && count(EAGLE) < 2 && (forest.has(col.biome) || col.biome === "peak" || col.biome === "mountain") && surface + 8 < HEIGHT) {
    manager.add(EAGLE, sx, surface + 7, sz, { yaw: angle, ambient: true });
  }
}
