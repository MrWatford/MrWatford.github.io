import * as THREE from "../lib/three.module.min.js";
import { gusSurface } from "./gus-village.js?v=3";

const REFUGE_Z = 17.2;
const EVACUATION_TIME = 6;
const SAFE_DISTANCE = 3.7;
const NO_RAIDERS = [];
export const REFUGE = { x: -1, z: 13.9 };

export function createVillageWatch({ scene, box, makeVillager, face, markerPaint }) {
  const iron = new THREE.MeshStandardMaterial({ color: 0x555050, roughness: 0.9 });
  const brick = new THREE.MeshStandardMaterial({ color: 0x676963, roughness: 1 });
  const timber = new THREE.MeshStandardMaterial({ color: 0x613f32, roughness: 1 });
  const flag = new THREE.MeshStandardMaterial({ color: 0x962f24, roughness: 0.9 });
  const gold = new THREE.MeshStandardMaterial({ color: 0xca9c50, roughness: 0.87 });
  const fire = new THREE.MeshBasicMaterial({ color: 0xffb74a, toneMapped: false });
  const flameTips = new THREE.MeshBasicMaterial({ color: 0xff742d, toneMapped: false });
  const furniture = new THREE.MeshStandardMaterial({ color: 0x8f633e, map: gusSurface("wood"), roughness: 0.92 });
  const root = new THREE.Group();
  root.name = "Village watch";
  scene.add(root);
  const beacon = new THREE.Group();
  beacon.name = "Watch beacon";
  beacon.position.set(-7.6, 0, -6.9);
  root.add(beacon);
  box(beacon, brick, 0, 0.17, 0, 1.43, 0.34, 1.43);
  box(beacon, brick, 0, 0.98, 0, 0.82, 1.35, 0.82);
  box(beacon, timber, 0, 1.75, 0, 0.99, 0.21, 0.99);
  box(beacon, iron, 0, 1.91, 0, 1.22, 0.24, 1.22);
  for (const side of [-1, 1]) {
    box(beacon, iron, side * 0.51, 2.16, 0, 0.16, 0.31, 1.12);
    box(beacon, iron, 0, 2.16, side * 0.51, 0.96, 0.31, 0.16);
    const post = side * 1.4;
    box(beacon, brick, post, 0.14, 0.11, 0.49, 0.28, 0.49);
    box(beacon, timber, post, 1.54, 0.11, 0.17, 2.94, 0.18);
    box(beacon, timber, post, 2.86, 0.11, 0.73, 0.11, 0.13);
    box(beacon, flag, post, 2.47, 0.12, 0.58, 0.65, 0.055);
    box(beacon, gold, post, 2.55, 0.159, 0.12, 0.35, 0.029);
    box(beacon, gold, post, 2.55, 0.159, 0.33, 0.08, 0.028);
  }
  const glow = new THREE.Group();
  glow.name = "Beacon flame";
  glow.position.y = 2.07;
  beacon.add(glow);
  const flare = box(glow, fire, 0.04, 0.32, 0, 0.48, 0.67, 0.5);
  box(glow, flameTips, 0.25, 0.22, 0.21, 0.24, 0.42, 0.29);
  box(glow, flameTips, -0.26, 0.24, -0.17, 0.21, 0.46, 0.26);
  box(glow, fire, -0.12, 0.57, 0.11, 0.20, 0.42, 0.21);
  const light = new THREE.PointLight(0xff9347, 15, 8);
  light.position.y = 0.87;
  glow.add(light);
  const marker = new THREE.Mesh(new THREE.OctahedronGeometry(0.28), markerPaint);
  marker.position.y = 3.62;
  beacon.add(marker);

  for (const x of [-4.1, 4.1]) {
    box(root, brick, x, 0.15, 16.4, 0.62, 0.30, 0.62);
    box(root, timber, x, 1.31, 16.4, 0.17, 2.38, 0.17);
    box(root, iron, x, 2.54, 16.4, 0.43, 0.2, 0.43);
    box(root, fire, x, 2.72, 16.4, 0.32, 0.29, 0.32);
    box(root, iron, x, 2.9, 16.4, 0.45, 0.1, 0.45);
  }
  for (const [x, z, color] of [[-9.2, 1.5, 0x99644a], [-10.1, -2.6, 0x48785e]]) {
    for (const dx of [-0.72, 0.72]) for (const dz of [-0.82, 0.82]) {
      box(root, furniture, x + dx, 1.15, z + dz, 0.15, 2.3, 0.15);
    }
    box(root, furniture, x, 0.81, z, 1.67, 0.14, 1.76);
    const stripes = [new THREE.MeshStandardMaterial({color}), new THREE.MeshStandardMaterial({color: 0xd9bc88})];
    for (let i = 0; i < 6; i++) box(root, stripes[i % 2], x, 2.32, z + (i - 2.5) * 0.36, 1.95, 0.12, 0.36);
    for (const dx of [-0.48, 0, 0.48]) box(root, gold, x + dx, 0.95, z, 0.29, 0.13, 0.46);
  }
  for (const x of [-4.6, 3.7]) {
    box(root, brick, x, 0.19, 14.45, 1.16, 0.38, 0.58);
    box(root, furniture, x, 0.43, 14.45, 1.38, 0.14, 0.72);
    box(root, gold, x, 0.63, 14.45, 0.53, 0.28, 0.5);
  }

  const civilians = [
    { x: -3.9, z: 0.8, role: "baker", delay: 0, opening: "Save me a spot by the south lantern, Gus. I owe you a loaf.", safeLine: "That loaf survived the whole thing. It’s yours, Gus." },
    { x: -5.5, z: -0.1, role: "merchant", delay: 0.65, opening: "The new south passage is open. We can finally bring the handcart through.", safeLine: "I left the cart. Everyone made it, and that’s what matters." },
    { x: -6.6, z: 0.9, role: "farmer", delay: 1.2, opening: "Look at you, Gus. The flowers on your shoulder came back this year.", safeLine: "Your flowers are still there. We’ll find a smith for the rest." }
  ].map(({ x, z, role, delay, opening, safeLine }, index) => {
    const rig = makeVillager({ role, id: `gus-market-${role}`, district: "market" });
    rig.root.name = "Market villager";
    root.add(rig.root);
    return { ...rig, x, z, role, delay, opening, safeLine, index, progress: 0 };
  });

  let elapsed = 0;
  let age = 0;
  let flameAge = 0;
  let waiting = 0;
  function reset(visible, mission) {
    root.visible = visible;
    elapsed = age = 0;
    waiting = 0;
    const evacuated = mission !== "briefing" && mission !== "defense";
    for (const resident of civilians) resident.progress = Number(evacuated);
    flameAge = 0;
    flare.scale.y = 0.67;
  }

  function update(mission, dt, reducedMotion, enemies = NO_RAIDERS, player, conversing = null) {
    if (!root.visible) return;
    age += dt;
    const evacuating = mission === "defense";
    if (evacuating) elapsed += dt;
    waiting = 0;
    for (const resident of civilians) {
      const position = resident.root.position;
      if (mission === "report") {
        position.set(REFUGE.x - 2.8 + resident.index * 2.75, 0, REFUGE.z + 2.85 + (resident.index % 2) * 0.7);
        resident.root.visible = true;
        face(resident.root, (player?.x ?? 0) - position.x, (player?.z ?? REFUGE.z) - position.z, dt || 1);
        resident.pose(dt, { age, activity: conversing === resident ? "trade" : "idle", reducedMotion });
        continue;
      }
      resident.root.visible = resident.progress < 1;
      if (!resident.root.visible) continue;
      if (mission === "briefing") {
        const working = conversing !== resident && (age + resident.index * 1.7) % 9 < 4.5;
        const offset = reducedMotion || conversing === resident ? 0 : Math.sin(age * 0.65) * 0.24;
        position.set(resident.x, 0, resident.z + offset);
        face(resident.root, conversing === resident && player ? player.x - position.x : -2,
          conversing === resident && player ? player.z - position.z : 1 - resident.index, dt || 1);
        resident.pose(dt, {age, activity: conversing === resident ? "trade" : working ? "work" : "idle", reducedMotion});
        continue;
      }
      const ready = evacuating && elapsed >= resident.delay;
      const blocked = ready && enemies.some(enemy => enemy.health &&
        enemy.root.position.distanceToSquared(position) <= SAFE_DISTANCE ** 2);
      if (blocked) waiting++;
      if (ready && !blocked) resident.progress = Math.min(1, resident.progress + dt / EVACUATION_TIME);
      const destination = resident.x * 0.42;
      position.set(THREE.MathUtils.lerp(resident.x, destination, resident.progress), 0,
        THREE.MathUtils.lerp(resident.z, REFUGE_Z, resident.progress));
      resident.root.visible = resident.progress < 1;
      face(resident.root, destination - resident.x, REFUGE_Z - resident.z, dt);
      const fleeing = ready && !blocked;
      resident.pose(dt, { age, activity: fleeing ? "flee" : "idle", speed: fleeing ? 2.8 : 0, reducedMotion });
    }
    marker.visible = mission === "signal";
    glow.visible = mission === "gate-defense" || mission === "seal-road" || mission === "report";
    if (glow.visible) {
      flameAge += dt;
      flare.scale.y = 0.67 * (reducedMotion ? 1 : 1 + Math.sin(flameAge * 9) * 0.12);
    }
  }

  function nearestResident(position) {
    let nearest = null, best = Infinity;
    for (const resident of civilians) {
      if (resident.progress >= 1) continue;
      const other = resident.root.position;
      const distance = position.distanceToSquared(other);
      if (distance < best) {
        nearest = other;
        best = distance;
      }
    }
    return nearest;
  }

  return {
    reset, update, nearestResident, beacon: beacon.position,
    residentAt(position) {
      let nearest, best = 2.35 ** 2;
      for (const resident of civilians) {
        const distance = resident.root.position.distanceToSquared(position);
        if (resident.root.visible && distance < best) {
          nearest = resident;
          best = distance;
        }
      }
      return nearest;
    },
    get safe() { return civilians.reduce((count, resident) => count + Number(resident.progress >= 1), 0); },
    get total() { return civilians.length; },
    get waiting() { return waiting; }
  };
}
