import * as THREE from "../lib/three.module.min.js";
import { B, BLOCKS, SOLID } from "./blocks.js";
import { clearStrikeLine, hostileMountedTarget, mountedAttackRejection, validMountedContext } from "./leviathan-mounted-combat.js";

export const OBSIDIAN_MOUNT_COOLDOWN = 18;
export const OBSIDIAN_MOUNT_WINDUP = 1;
export const OBSIDIAN_MOUNT_INTERVAL = 0.2;
export const OBSIDIAN_MOUNT_DURATION = 2.3;

function clearEruptionSite(world, origin, point) {
  const x = Math.floor(point.x), z = Math.floor(point.z);
  if (!world.isLoaded(x, z)) return false;
  const floor = world.id(x, point.y - 1, z);
  return SOLID[floor] && BLOCKS[floor]?.shape === "cube" && floor !== B.BED && floor !== B.FARMLAND && floor !== B.WATER && floor !== B.LAVA &&
    ![0, 1, 2].some(dy => { const id = world.id(x, point.y + dy, z); return SOLID[id] || id === B.WATER || id === B.LAVA; }) &&
    clearStrikeLine(world, { x: origin.x, y: origin.y + 1, z: origin.z }, { x: point.x, y: point.y + 1, z: point.z });
}

export function planObsidianEruptions(world, origin, yaw) {
  const points = [];
  for (let distance = 2; distance <= 10; distance += 0.5) {
    const x = origin.x - Math.sin(yaw) * distance, z = origin.z - Math.cos(yaw) * distance;
    if (!world.isLoaded(Math.floor(x), Math.floor(z))) break;
    const y = world.surfaceY(Math.floor(x), Math.floor(z)) + 1, point = { x, y, z, triggered: false, blocked: false };
    if (Math.abs(y - origin.y) > 2 || !clearEruptionSite(world, origin, point)) break;
    if (distance === 4 || distance === 7 || distance === 10) points.push(point);
  }
  return points;
}

export function obsidianMountedTargets(world, origin, point, entities, owner, hit) {
  const targets = [], seen = new Set();
  for (let i = 0; i < Math.min(120, entities.length); i++) {
    const entity = entities[i];
    if (seen.has(entity) || hit.has(entity) || !hostileMountedTarget(entity, owner)) continue;
    seen.add(entity);
    const dx = entity.pos.x - point.x, dz = entity.pos.z - point.z, distance = Math.hypot(dx, dz);
    if (distance > 1.8 || Math.abs(entity.pos.y - point.y) > 2.5 ||
        !clearStrikeLine(world, { x: origin.x, y: origin.y + 1, z: origin.z },
          { x: entity.pos.x, y: entity.pos.y + Math.min(entity.h * 0.5, 1.5), z: entity.pos.z })) continue;
    targets.push({ entity, distance, x: dx / (distance || 1) * 0.5, z: dz / (distance || 1) * 0.5 });
  }
  return targets.sort((a, b) => a.distance - b.distance).slice(0, Math.max(0, 6 - hit.size));
}

export function beginObsidianMountedAttack(args) {
  const rejection = mountedAttackRejection(args, "leviathan_obsidian");
  if (rejection) return rejection;
  const { world, mount, record, now, yaw, dim } = args, origin = { ...mount.pos };
  const points = planObsidianEruptions(world, origin, yaw);
  if (!points.length) return { status: "unavailable" };
  record.mountedReadyAt = now + OBSIDIAN_MOUNT_COOLDOWN;
  const cue = { step: "shrapnel", attack: { phase: 4 }, attackAt: mount.age + OBSIDIAN_MOUNT_WINDUP };
  mount.mountedCue = cue;
  const hit = new Set();
  const strike = {
    owner: mount, origin, yaw, points, elapsed: 0, next: 0, canceled: false,
    cancel() { this.canceled = true; if (mount.mountedCue === cue) mount.mountedCue = null; },
    update(dt, context) {
      if (this.canceled) return false;
      if (!validMountedContext(world, mount, origin, dim, context)) { this.cancel(); return false; }
      this.elapsed += Math.max(0, dt);
      while (this.next < points.length && this.elapsed >= OBSIDIAN_MOUNT_WINDUP + this.next * OBSIDIAN_MOUNT_INTERVAL) {
        if (!validMountedContext(world, mount, origin, dim, context)) { this.cancel(); return false; }
        const point = points[this.next++];
        point.triggered = true; point.blocked = !clearEruptionSite(world, origin, point);
        if (!point.blocked) for (const target of obsidianMountedTargets(world, origin, point, context.entities, mount, hit)) {
          hit.add(target.entity); context.damage(target.entity, 7, "player", { x: target.x, z: target.z });
        }
        if (mount.mountedCue === cue) mount.mountedCue = null;
      }
      if (this.elapsed >= OBSIDIAN_MOUNT_DURATION) { this.cancel(); return false; }
      return true;
    }
  };
  return { status: "ready", strike };
}

export function createObsidianMountedEruptions(scene, strike, reducedMotion) {
  const points = strike.points, count = points.length, group = new THREE.Group();
  const geometry = new THREE.ConeGeometry(1, 1, 5);
  const tones = [], normals = geometry.attributes.normal;
  for (let i = 0; i < normals.count; i++) {
    const tone = 0.66 + 0.24 * Math.max(0, normals.getY(i)) + 0.1 * Math.max(0, normals.getX(i));
    tones.push(tone, tone, tone);
  }
  geometry.setAttribute("color", new THREE.Float32BufferAttribute(tones, 3));
  const basaltColor = new THREE.Color(0x342b36), emberColor = new THREE.Color(0xffa04b);
  if (!THREE.ColorManagement.enabled) { basaltColor.convertSRGBToLinear(); emberColor.convertSRGBToLinear(); }
  const basalt = new THREE.MeshBasicMaterial({ color: basaltColor, vertexColors: true });
  const ember = new THREE.MeshBasicMaterial({ color: emberColor });
  const spikes = new THREE.InstancedMesh(geometry, basalt, count), cores = new THREE.InstancedMesh(geometry, ember, count);
  for (const mesh of [spikes, cores]) { mesh.frustumCulled = false; mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage); group.add(mesh); }
  const ringGeometry = new THREE.PlaneGeometry(3.6, 3.6);
  ringGeometry.setAttribute("site", new THREE.InstancedBufferAttribute(Float32Array.from(points, (_, i) => i), 1));
  const enabled = new THREE.InstancedBufferAttribute(new Float32Array(count).fill(1), 1);
  ringGeometry.setAttribute("enabled", enabled);
  const ringMaterial = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, side: THREE.DoubleSide,
    uniforms: { age: { value: 0 } },
    vertexShader: "attribute float site;attribute float enabled;varying vec2 coord;varying float index;varying float visibleSite;void main(){coord=uv;index=site;visibleSite=enabled;gl_Position=projectionMatrix*modelViewMatrix*instanceMatrix*vec4(position,1.0);}",
    fragmentShader: `uniform float age;varying vec2 coord;varying float index;varying float visibleSite;
      void main(){vec2 d=coord*2.0-1.0;float r=length(d);float t=age-(1.0+index*0.2);
      float border=smoothstep(0.78,0.84,r)*(1.0-smoothstep(0.96,1.0,r));
      float rune=step(0.94,abs(sin(atan(d.y,d.x)*4.0)))*step(0.54,r)*step(r,0.72);
      float a=t<0.0?0.13*(1.0-step(0.78,r))+border*0.8+rune*0.65:(1.0-smoothstep(0.0,0.7,t))*(border*0.7+0.2*(1.0-step(0.78,r)));
      vec3 color=mix(vec3(0.19,0.06,0.025),vec3(1.0,0.38,0.08),max(border,rune));
      gl_FragColor=vec4(color,a*visibleSite);}` });
  const rings = new THREE.InstancedMesh(ringGeometry, ringMaterial, count); rings.frustumCulled = false; group.add(rings);
  const transform = new THREE.Object3D();
  points.forEach((point, i) => {
    transform.position.set(point.x, point.y + 0.045, point.z); transform.rotation.set(-Math.PI / 2, 0, 0); transform.scale.setScalar(1); transform.updateMatrix();
    rings.setMatrixAt(i, transform.matrix);
  });
  rings.instanceMatrix.needsUpdate = true;
  scene.add(group);
  let disposed = false;
  const view = {
    update(age, motion = reducedMotion) {
      if (disposed) return;
      ringMaterial.uniforms.age.value = age;
      points.forEach((point, i) => {
        const t = age - OBSIDIAN_MOUNT_WINDUP - i * OBSIDIAN_MOUNT_INTERVAL;
        const active = point.triggered && !point.blocked && t >= 0 && t < 0.7;
        const height = active ? motion ? 1 : Math.min(1, Math.max(0.02, t * 9), (0.7 - t) * 6) : 0;
        enabled.setX(i, point.blocked ? 0 : 1);
        transform.rotation.set(0, Math.PI / 4, 0);
        transform.position.set(point.x, point.y + height * 1.2, point.z); transform.scale.set(0.6 * height, 2.4 * height, 0.6 * height); transform.updateMatrix(); spikes.setMatrixAt(i, transform.matrix);
        transform.rotation.y += Math.PI / 5;
        transform.position.y = point.y + height * 1.4; transform.scale.set(0.52 * height, 2.8 * height, 0.52 * height); transform.updateMatrix(); cores.setMatrixAt(i, transform.matrix);
      });
      spikes.instanceMatrix.needsUpdate = cores.instanceMatrix.needsUpdate = enabled.needsUpdate = true;
    },
    dispose() {
      if (disposed) return; disposed = true; scene.remove(group);
      for (const mesh of [spikes, cores, rings]) mesh.dispose();
      for (const resource of [geometry, basalt, ember, ringGeometry, ringMaterial]) resource.dispose();
    }
  };
  view.update(0);
  return view;
}
