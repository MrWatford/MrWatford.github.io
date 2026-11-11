import { B, I, SOLID } from "./blocks.js";

import { DESERT_MOBS } from "./desert-mob-catalog.js";

const part = (name, size, pivot, off, paint) => ({ name, size, pivot, off, paint: { all: paint } });
export function installDesertMobs(species) {
  for (const [id, name, color, accent] of DESERT_MOBS) {
    const paint = P => {
      P.fill([color]); P.rect(0, 0, 16, 2, accent); P.rect(2, 6, 12, 1, "#554551");
      P.rect(6, 4, 2, 7, accent);
    };
    const face = P => { paint(P); P.rect(2, 5, 3, 2, accent); P.rect(11, 5, 3, 2, accent); P.rect(6, 10, 4, 1, "#453a41"); };
    const upright = ["ancient_sentinel", "tomb_guardian", "sand_wraith"].includes(id);
    const worm = id === "desert_burrower";
    const parts = upright ? [
      part("head", [9, 9, 8], [0, 25, 0], [0, 4, 0], face),
      part("body", [12, 13, 7], [0, 12, 0], [0, 6.5, 0], paint),
      ...[-1, 1].flatMap((side, i) => [
        part(i ? "armL" : "armR", [4, 14, 5], [side * 8, 23, 0], [0, -6, 0], paint),
        part(i ? "legL" : "legR", [5, 12, 5], [side * 3, 12, 0], [0, -6, 0], paint)
      ])
    ] : [
      part("body", [13, 7, 17], [0, 7, 0], [0, 0, 0], paint),
      part("head", [9, 5, 8], [0, 8, 8], [0, 0, 2], face),
      ...[-1, 1].flatMap(side => [0, 1, 2].map(i =>
        part("foot" + side + i, [6, 2, 2], [side * 7, 5, 6 - i * 5], [side * 2, -1, 0], paint)))
    ];
    if (worm) {
      parts.splice(2);
      for (let i = 0; i < 4; i++) parts.push(part("coil" + i, [11 - i, 6 - i * 0.5, 7], [0, 6, -10 - i * 6], [0, 0, 0], paint));
    }
    if (id === "tomb_guardian") {
      const shield = part("shield", [9, 13, 2], [0, -4, 3], [0, 0, 0], paint);
      shield.parent = "armL"; parts.push(shield);
    }
    const neutral = id === "dune_scarab", burrows = ["sand_stalker", "desert_burrower"].includes(id);
    species[id] = {
      name, desertMob: true, hostile: !neutral, neutral, ai: neutral ? "rotboar" : "zombie",
      hp: id === "ancient_sentinel" ? 36 : id === "tomb_guardian" ? 26 : 16,
      w: upright ? 0.85 : 1.2, h: upright ? 2.1 : 0.8,
      speed: id === "sand_stalker" ? 3.4 : id === "ancient_sentinel" ? 1.5 : 2.3,
      dmg: id === "ancient_sentinel" ? 5 : 3, reach: upright ? 1.8 : 1.5,
      burrows, hears: burrows, leash: 24, fireproof: id === "obsidian_crawler",
      shielded: id === "tomb_guardian",
      xp: 5, sound: upright ? "clank" : "chitter",
      drops: () => [[id === "obsidian_crawler" ? B.OBSIDIAN : id === "dune_scarab" ? I.GOLD_NUGGET : I.BONE, 1]],
      model: { type: upright ? "humanoid" : "desert_beetle", parts }
    };
  }
}

export function animateDesertMob(e) {
  if (!e.def.desertMob) return;
  if (e.sp === "sand_wraith") e.mesh.position.y += Math.sin(e.age * 2) * 0.12;
  if (e.sp === "dune_scarab") e.root.scale.y *= e.braced ? 0.72 : 1;
  if (e.desertWindup && e.parts.armR) e.parts.armR.rotation.x = -2.4;
  if (e.desertCast && e.parts.armR) {
    e.parts.armR.rotation.x = e.parts.armL.rotation.x = -1.3;
  }
  for (let i = 0; i < 4; i++) {
    const coil = e.parts["coil" + i];
    if (coil) { coil.position.x = Math.sin(e.walkPhase * 2 - i * 0.65) * 0.14; coil.rotation.y = Math.cos(e.walkPhase * 2 - i * 0.65) * 0.12; }
  }
  for (const p of e.def.model.parts) if (p.name.startsWith("foot")) {
    e.parts[p.name].rotation.y = Math.sin(e.walkPhase * 2 + p.pivot[2] + p.pivot[0]) * 0.28;
  }
}

export function thinkDesertMob(manager, e, distance, multiplier) {
  if (!e.def.desertMob) return false;
  const p = manager.ctx.player(), canSee = manager.targetable() && distance < 22 && manager.canSeePlayer(e);
  if (e.sp === "desert_burrower") {
    const w = manager.world;
    const now = e.age, phase = e.burrowPhase;
    if (!phase || (phase.step === "surface" && now >= phase.until)) {
      const x = Math.floor(e.pos.x), y = Math.floor(e.pos.y), z = Math.floor(e.pos.z);
      if (w.id(x, y - 1, z) !== B.SAND) { e.emerged = true; return false; }
      e.burrowPhase = { step: "hidden", until: now + 1.4 };
      e.emerged = false; e.goal = null; e.path = null;
      e.vel.x = e.vel.z = 0;
      manager.ctx.particles(e.pos.x, e.pos.y + 0.1, e.pos.z, "crumb");
      return true;
    }
    if (phase.step === "surface") return false;
    e.goal = null; e.path = null;
    if (now < phase.until) return true;
    if (phase.step === "hidden") {
      const dx = p.pos.x - e.pos.x, dz = p.pos.z - e.pos.z, length = Math.hypot(dx, dz);
      const advance = Math.max(0, Math.min(6, length - 2.5));
      const y = Math.floor(e.pos.y);
      let landing = { x: e.pos.x, y, z: e.pos.z };
      for (let step = 0.5; step <= advance; step += 0.5) {
        const x = e.pos.x + dx / length * step, z = e.pos.z + dz / length * step;
        let clear = true;
        for (const sx of [-0.6, 0.6]) for (const sz of [-0.6, 0.6]) {
          const bx = Math.floor(x + sx), bz = Math.floor(z + sz);
          if (!w.isLoaded(bx, bz) || w.id(bx, y - 1, bz) !== B.SAND ||
              w.id(bx, y, bz) !== B.AIR || w.id(bx, y + 1, bz) !== B.AIR) clear = false;
        }
        if (!clear) break;
        landing = { x, y, z };
      }
      Object.assign(e.pos, landing);
      e.burrowPhase = { step: "warning", until: now + 1 };
      manager.ctx.particles(e.pos.x, e.pos.y + 0.1, e.pos.z, "crumb");
    } else {
      e.emerged = true; e.alertT = 6;
      e.burrowPhase = { step: "surface", until: now + 4 };
      manager.ctx.particles(e.pos.x, e.pos.y + 0.2, e.pos.z, "crumb");
    }
    return true;
  }
  if (e.sp === "tomb_guardian") {
    e.home ||= { ...e.pos };
    const fromHome = Math.hypot(e.pos.x - e.home.x, e.pos.z - e.home.z);
    if (fromHome > 14) {
      e.angry = 0;
      manager.moveTo(e, e.home, e.def.speed, 1);
      return true;
    }
    if (!canSee || distance > 10) {
      e.patrolIndex ||= 0;
      const routes = [[3, 0], [0, 3], [-3, 0], [0, -3]];
      const [dx, dz] = routes[e.patrolIndex];
      const target = { x: e.home.x + dx, y: e.home.y, z: e.home.z + dz };
      if (Math.hypot(target.x - e.pos.x, target.z - e.pos.z) < 1) e.patrolIndex = (e.patrolIndex + 1) % routes.length;
      if (manager.world.isLoaded(target.x, target.z)) manager.moveTo(e, target, e.def.speed * 0.65, 0.8);
      else e.goal = null;
      return true;
    }
  }
  if (e.sp === "dune_scarab") {
    e.braced = !e.angry && distance < 5;
    if (e.braced) { e.goal = null; return true; }
    return false;
  }
  if (e.sp === "sand_wraith") {
    if (!canSee) { e.desertCast = null; return false; }
    e.yaw = Math.atan2(e.pos.x - p.pos.x, e.pos.z - p.pos.z);
    if (e.desertCast) {
      e.goal = null;
      if (e.age >= e.desertCast.until) {
        const aim = e.desertCast, y = e.eyeY - 0.1;
        const dx = aim.x - e.pos.x, dy = aim.y - y, dz = aim.z - e.pos.z;
        const length = Math.hypot(dx, dy, dz) || 1;
        manager.addProjectile("sandbolt", e.pos.x, y, e.pos.z, dx / length * 9, dy / length * 9, dz / length * 9,
          { owner: e, dmg: 3 * multiplier, noGrav: true });
        e.desertCast = null; e.attackCd = 3;
      }
      return true;
    }
    if (e.attackCd <= 0) {
      e.desertCast = { x: p.pos.x, y: p.pos.y + 1, z: p.pos.z, until: e.age + 0.9 };
      manager.ctx.particles(e.pos.x, e.eyeY, e.pos.z, "pale");
    } else if (distance < 5) {
      const dx = e.pos.x - p.pos.x, dz = e.pos.z - p.pos.z;
      e.goal = { x: e.pos.x + dx, z: e.pos.z + dz, speed: e.def.speed };
    } else if (distance > 12) manager.chase(e, p.pos);
    else e.goal = null;
    return true;
  }
  if (e.sp === "ancient_sentinel") {
    if (e.desertWindup) {
      e.goal = null;
      if (e.age >= e.desertWindup.until) {
        const a = e.desertWindup;
        if (manager.targetable() && Math.abs(p.pos.y - e.pos.y) < 2 &&
            Math.hypot(p.pos.x - a.x, p.pos.z - a.z) < 2.3 && manager.canSeePlayer(e)) {
          manager.ctx.hurtPlayer(6 * multiplier, "An Ancient Sentinel struck the marked ground.", e);
        }
        manager.ctx.particles(a.x, e.pos.y + 0.2, a.z, "crumb");
        e.desertWindup = null; e.attackCd = 2.6;
      }
      return true;
    }
    if (canSee && distance < 3.5 && e.attackCd <= 0) {
      e.desertWindup = { x: p.pos.x, z: p.pos.z, until: e.age + 1.1 };
      manager.ctx.particles(p.pos.x, p.pos.y + 0.1, p.pos.z, "crumb");
      e.goal = null;
      return true;
    }
  }
  if (["sand_stalker", "obsidian_crawler"].includes(e.sp) && (!e.def.burrows || e.emerged) &&
      canSee && distance > 2 && distance < 5 && e.onGround && e.attackCd <= 0) {
    const dx = p.pos.x - e.pos.x, dz = p.pos.z - e.pos.z, len = Math.hypot(dx, dz) || 1;
    e.vel.x = dx / len * 6; e.vel.z = dz / len * 6; e.vel.y = 4;
    e.knock = 0.45; e.attackCd = 1.2;
    manager.ctx.particles(e.pos.x, e.pos.y + 0.2, e.pos.z, e.sp === "obsidian_crawler" ? "ember" : "crumb");
  }
  return false;
}

function sandsRefuge(world, x, z) {
  return Math.hypot(x, z) < 12 || world.gen.stamps?.some(s => s.sandsLandmark === 5 &&
    x >= s.x && x < s.x + s.size && z >= s.z && z < s.z + s.size);
}

export function spawnDesertMobs(manager, dt) {
  manager.desertSpawnT = (manager.desertSpawnT || 0) - dt;
  if (manager.desertSpawnT > 0) return;
  manager.desertSpawnT = 6;
  const c = manager.ctx.desertContext(), p = manager.ctx.player(), w = manager.world;
  if (!["overworld", "desert", "hollow_sands"].includes(c.dim) || manager.ctx.settings().difficulty === "peaceful" ||
      manager.list.filter(e => !e.gone && !e.dead).length >= 120 ||
      manager.list.filter(e => e.def.desertMob && !e.gone && !e.dead).length >= 8) return;
  if (c.dim === "hollow_sands" && sandsRefuge(w, p.pos.x, p.pos.z)) return;
  const angle = p.yaw + Math.PI + (Math.random() - 0.5) * 1.5, r = 14 + Math.random() * 8;
  const x = Math.floor(p.pos.x - Math.sin(angle) * r), z = Math.floor(p.pos.z - Math.cos(angle) * r);
  if (!w.isLoaded(x, z)) return;
  let y, candidates;
  if (c.dim === "overworld") {
    if (w.gen.column(x, z).biome !== "sandy") return;
    y = w.surfaceY(x, z) + 1;
    if (Math.abs(y - p.pos.y) > 5) return;
    const near = key => { const s = c.sites?.[key]; return s && x >= s.x && x < s.x + (key === "citadel" ? 48 : key === "city" ? 32 : 16) && z >= s.z && z < s.z + (key === "citadel" ? 48 : key === "city" ? 32 : 16); };
    candidates = near("citadel") ? ["obsidian_crawler"] : near("tomb") || near("city") ? ["tomb_guardian", "sand_wraith"] :
      c.storm >= 3 ? ["sand_stalker", "sand_wraith", "desert_burrower"] : ["dune_scarab", "desert_burrower"];
  } else {
    y = Math.floor(p.pos.y);
    for (let n = 0; n < 3 && y > 2 && !SOLID[w.id(x, y - 1, z)]; n++) y--;
    if (c.dim === "hollow_sands" && sandsRefuge(w, x, z)) return;
    candidates = c.dim === "desert" ? ["ancient_sentinel", "tomb_guardian"] : ["ancient_sentinel", "desert_burrower", "sand_wraith"];
  }
  const floor = w.id(x, y - 1, z);
  if (!SOLID[floor] || floor === B.MAGMA || w.id(x, y, z) !== B.AIR || w.id(x, y + 1, z) !== B.AIR || w.id(x, y + 2, z) !== B.AIR) return;
  const sp = candidates[Math.floor(Math.random() * candidates.length)];
  manager.add(sp, x + 0.5, y, z + 0.5);
}
