import * as THREE from "../lib/three.module.min.js";
import { B, SOLID } from "./blocks.js";

export const DUNE_MOUNT_COOLDOWN = 12;
export const DUNE_MOUNT_WINDUP = 0.85;
export const DUNE_MOUNT_DURATION = 1.45;

export function clearStrikeLine(world, a, b) {
  const dx = b.x - a.x, dy = b.y - a.y, dz = b.z - a.z;
  const steps = Math.ceil(Math.hypot(dx, dy, dz) * 4);
  for (let i = 0; i <= steps; i++) {
    const t = steps ? i / steps : 0, x = Math.floor(a.x + dx * t), z = Math.floor(a.z + dz * t);
    if (!world.isLoaded(x, z) || SOLID[world.id(x, Math.floor(a.y + dy * t), z)]) return false;
  }
  return true;
}

export function hostileMountedTarget(entity, owner) {
  return entity !== owner && !entity.dead && !entity.gone && !entity.tame && !entity.npc &&
    entity.def?.hostile && !entity.def.villager && !entity.def.object &&
    [entity.pos.x, entity.pos.y, entity.pos.z, entity.h].every(Number.isFinite);
}

export function mountedAttackRejection({ world, mount, riding, record, now, yaw, dim, spectator }, species) {
  if (spectator || dim !== "overworld" || !mount || mount.sp !== species || mount !== riding ||
      !mount.ridden || !mount.tame || !mount.saddled || !mount.emerged || !mount.onGround || mount.bondArrival ||
      mount.dead || mount.gone || mount.hp <= 0 || !record?.bonded || record.defeated ||
      !world.isLoaded(mount.pos.x, mount.pos.z)) return { status: "unavailable" };
  if (![now, yaw, mount.age, mount.pos.x, mount.pos.y, mount.pos.z].every(Number.isFinite) || now < 0) return { status: "unavailable" };
  if (mount.mountedCue || mount.burrowTravel) return { status: "pending" };
  if (now < (record.mountedReadyAt || 0)) return { status: "cooldown", remaining: Math.ceil(record.mountedReadyAt - now) };
  return null;
}

export function validMountedContext(world, mount, origin, dim, context) {
  return context.active && context.dim === dim && context.riding === mount && mount.ridden &&
    !mount.dead && !mount.gone && mount.hp > 0 && mount.tame && mount.saddled && mount.emerged &&
    context.entities.includes(mount) && world.isLoaded(origin.x, origin.z);
}

export function duneMountedTargets(world, origin, yaw, entities, owner) {
  const targets = [], seen = new Set(), forwardX = -Math.sin(yaw), forwardZ = -Math.cos(yaw);
  for (let i = 0; i < Math.min(120, entities.length); i++) {
    const entity = entities[i];
    if (seen.has(entity) || !hostileMountedTarget(entity, owner)) continue;
    seen.add(entity);
    const dx = entity.pos.x - origin.x, dz = entity.pos.z - origin.z, distance = Math.hypot(dx, dz);
    if (distance < 2 || distance > 10 || Math.abs(entity.pos.y - origin.y) > 3 ||
        (dx * forwardX + dz * forwardZ) / distance < Math.cos(0.6)) continue;
    const from = { x: origin.x, y: origin.y + 1, z: origin.z };
    const to = { x: entity.pos.x, y: entity.pos.y + Math.min(entity.h * 0.5, 1.5), z: entity.pos.z };
    if (!clearStrikeLine(world, from, to)) continue;
    targets.push({ entity, distance, x: dx / distance * 0.65, z: dz / distance * 0.65 });
  }
  return targets.sort((a, b) => a.distance - b.distance).slice(0, 6);
}

export function beginDuneMountedAttack(args) {
  const rejection = mountedAttackRejection(args, "leviathan_dune");
  if (rejection) return rejection;
  const { world, mount, record, now, yaw, dim } = args;
  record.mountedReadyAt = now + DUNE_MOUNT_COOLDOWN;
  const cue = { step: "surface", attack: { phase: 4 }, attackAt: mount.age + DUNE_MOUNT_WINDUP };
  mount.mountedCue = cue;
  const strike = {
    owner: mount, origin: { ...mount.pos }, yaw, elapsed: 0, resolved: false, canceled: false,
    cancel() { this.canceled = true; if (mount.mountedCue === cue) mount.mountedCue = null; },
    update(dt, context) {
      if (this.canceled) return false;
      if (!validMountedContext(world, mount, this.origin, dim, context)) { this.cancel(); return false; }
      this.elapsed += Math.max(0, dt);
      if (!this.resolved && this.elapsed >= DUNE_MOUNT_WINDUP) {
        this.resolved = true;
        for (const target of duneMountedTargets(world, this.origin, yaw, context.entities, mount)) {
          context.damage(target.entity, 6, "player", { x: target.x, z: target.z });
        }
        if (mount.mountedCue === cue) mount.mountedCue = null;
      }
      if (this.elapsed >= DUNE_MOUNT_DURATION) { this.cancel(); return false; }
      return true;
    }
  };
  return { status: "ready", strike };
}

export function createDuneMountedWave(scene, world, strike, reducedMotion, fast) {
  const positions = [], travel = [], edge = [], steps = fast ? 6 : 8;
  const origin = strike.origin;
  const sample = (angle, radius) => {
    const x = origin.x - Math.sin(angle) * radius, z = origin.z - Math.cos(angle) * radius;
    if (!world.isLoaded(Math.floor(x), Math.floor(z))) return null;
    const y = world.surfaceY(Math.floor(x), Math.floor(z)) + 1;
    if (Math.abs(y - origin.y) > 2 || world.id(Math.floor(x), y - 1, Math.floor(z)) === B.WATER) return null;
    if (!clearStrikeLine(world, { x: origin.x, y: origin.y + 1, z: origin.z }, { x, y: y + 1, z })) return null;
    return [x, y + 0.045, z];
  };
  const grid = [];
  for (let i = 0; i <= steps; i++) {
    const ray = [], angle = strike.yaw - 0.6 + i / steps * 1.2;
    let blocked = false;
    for (let j = 0; j <= steps; j++) {
      const point = blocked ? null : sample(angle, 2 + j / steps * 8);
      if (!point) blocked = true;
      ray.push(point);
    }
    grid.push(ray);
  }
  for (let i = 0; i < steps; i++) {
    for (let j = 0; j < steps; j++) {
      const r = 2 + j / steps * 8, s = 2 + (j + 1) / steps * 8;
      const points = [grid[i][j], grid[i + 1][j], grid[i + 1][j + 1], grid[i][j + 1]];
      if (points.some(point => !point)) break;
      for (const k of [0, 1, 2, 0, 2, 3]) {
        positions.push(...points[k]); travel.push(k < 2 ? r : s); edge.push((k === 0 || k === 3 ? i : i + 1) / steps);
      }
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute("travel", new THREE.Float32BufferAttribute(travel, 1));
  geometry.setAttribute("edge", new THREE.Float32BufferAttribute(edge, 1));
  const material = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, side: THREE.DoubleSide,
    uniforms: { age: { value: 0 }, reduced: { value: reducedMotion ? 1 : 0 } },
    vertexShader: "attribute float travel;attribute float edge;varying float distanceAlong;varying float side;void main(){distanceAlong=travel;side=edge;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}",
    fragmentShader: `uniform float age;uniform float reduced;varying float distanceAlong;varying float side;
      void main(){float border=max(smoothstep(9.35,9.65,distanceAlong),smoothstep(0.4,0.45,abs(side-0.5)));
      float crest=max(smoothstep(9.75,9.9,distanceAlong),smoothstep(0.47,0.49,abs(side-0.5)));
      float front=2.0+clamp((age-0.85)/0.6,0.0,1.0)*8.0;
      float wave=(1.0-smoothstep(0.1,1.2,abs(distanceAlong-front)))*0.65;
      float alpha=age<0.85?0.14+border*0.7:mix(wave,0.3,reduced)*(1.0-smoothstep(1.2,1.45,age));
      vec3 color=age<0.85?mix(vec3(0.22,0.11,0.035),vec3(1.0,0.75,0.36),crest):vec3(1.0,0.64,0.19);
      gl_FragColor=vec4(color,alpha);}` });
  const mesh = new THREE.Mesh(geometry, material); scene.add(mesh);
  let disposed = false;
  return {
    update(age, motion = reducedMotion) { material.uniforms.age.value = age; material.uniforms.reduced.value = motion ? 1 : 0; },
    dispose() { if (disposed) return; disposed = true; scene.remove(mesh); geometry.dispose(); material.dispose(); }
  };
}
