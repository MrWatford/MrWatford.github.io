import * as THREE from "../lib/three.module.min.js";
import { attachIronGuardian, updateIronGuardianSurface } from "./iron-guardian-model.js?v=ancient-guardian-2";

const HIP_HEIGHT = 1.64;

export function buildGusRig(scene, box, { name = "Gus", uid = "gus", watchColor = 0x923b30 } = {}) {
  const actor = { uid, pos: { x: 0, y: 0, z: 0 }, yaw: 0, hp: 100, maxHp: 100, age: 0, onGround: true };
  const view = attachIronGuardian(actor, scene);
  const { body, head, armR, armL, elbowR, elbowL, legR, legL, kneeR, kneeL, footR, footL } = actor.parts;
  for (const [name, part] of Object.entries(actor.parts)) part.name = name;
  actor.mesh.name = name;
  actor.mesh.rotation.y = 0;
  actor.root.rotation.y = Math.PI; // The campaign controller faces -Z and the Ironwarden model faces +Z.
  for (const { mesh } of view.armor) mesh.castShadow = true;
  // The town renderer uses linear output. Interpret its atlas as sRGB in the campaign renderer.
  const atlas = actor.mat.map.clone();
  atlas.colorSpace = THREE.SRGBColorSpace;
  atlas.needsUpdate = true;
  for (const paint of [actor.mat, view.eye, view.badge]) {
    paint.map = atlas;
    paint.toneMapped = false;
  }

  const enamel = new THREE.MeshStandardMaterial({ color: watchColor, roughness: 0.83 });
  const brass = new THREE.MeshStandardMaterial({ color: 0xbd8d50, roughness: 0.65 });
  const steel = new THREE.MeshStandardMaterial({ color: 0x394e57, roughness: 0.72 });
  const glow = new THREE.MeshBasicMaterial({ color: 0x6eefdb });

  // Gus wears the village watch colors on one shoulder and above his spine.
  box(armR, enamel, -0.10, 0.184, 0.005, 0.45, 0.095, 0.65);
  box(armR, enamel, -0.10, 0.135, -0.335, 0.45, 0.18, 0.065);
  box(armR, brass, -0.10, 0.075, -0.375, 0.34, 0.045, 0.035);
  box(body, enamel, 0, 1.008, -0.374, 0.49, 0.12, 0.105);
  box(body, brass, 0, 1.008, -0.433, 0.19, 0.048, 0.022);

  const forgePlates = new THREE.Group();
  forgePlates.name = "Reforged spine";
  body.add(forgePlates);
  const forgeBraces = [elbowR, elbowL].map((elbow, index) => {
    const side = index === 0 ? -1 : 1;
    const brace = new THREE.Group();
    elbow.add(brace);
    box(brace, steel, side * 0.053, -0.24, -0.312, 0.43, 0.30, 0.11);
    box(brace, steel, side * 0.302, -0.24, 0.037, 0.11, 0.30, 0.57);
    box(brace, steel, side * 0.053, -0.24, 0.35, 0.43, 0.30, 0.10);
    box(brace, glow, side * 0.367, -0.24, 0.037, 0.027, 0.055, 0.39);
    box(brace, glow, side * 0.053, -0.24, -0.378, 0.31, 0.055, 0.025);
    box(brace, glow, side * 0.053, -0.24, 0.412, 0.31, 0.055, 0.025);
    box(forgePlates, steel, side * 0.237, 0.72, -0.532, 0.095, 0.42, 0.13);
    box(forgePlates, glow, side * 0.237, 0.72, -0.606, 0.040, 0.31, 0.025);
    return brace;
  });
  const arms = [armR, armL], elbows = [elbowR, elbowL];
  const legs = [legR, legL], knees = [kneeR, kneeL], feet = [footR, footL];
  let stride = 0;

  function setForm(form) {
    const repaired = form === "reforged";
    actor.mat.color.setRGB(...(form === "damaged" ? [0.77, 0.70, 0.60] : [1, 1, 1]));
    forgePlates.visible = repaired;
    for (const brace of forgeBraces) brace.visible = repaired;
  }

  function updateWear(armor, dt, reducedMotion, striking) {
    actor.hp = armor;
    actor.age += dt;
    updateIronGuardianSurface(actor, 0, false, reducedMotion, Number(striking), 0);
  }

  function pose(speed, dt, reducedMotion, injured = false) {
    stride = (stride + dt * speed * 3) % (2 * Math.PI);
    const swing = Math.sin(stride) * Math.min(0.44, speed * (reducedMotion ? 0.082 : 0.15));
    body.position.y = HIP_HEIGHT - Math.abs(swing) * 0.055;
    body.rotation.set(speed * 0.024, swing * 0.15, swing * 0.08);
    head.rotation.set(-body.rotation.x * 0.65, -body.rotation.y * 0.55, 0);
    for (let i = 0; i < legs.length; i++) {
      const step = i === 0 ? swing : -swing;
      const bend = Math.max(0, step) * 1.35;
      legs[i].rotation.x = -step - bend * 0.35;
      knees[i].rotation.x = bend;
      feet[i].rotation.x = -legs[i].rotation.x - bend;
      arms[i].rotation.set(-step * 0.66, 0, i === 0 ? -0.09 : 0.09);
      elbows[i].rotation.x = -0.11 - Math.max(0, step) * 0.5;
    }
    if (injured) {
      body.position.y -= 0.11 + Math.max(0, -swing) * 0.14;
      body.rotation.x += 0.16;
      body.rotation.z -= 0.13;
      head.rotation.x -= 0.11;
      arms[0].rotation.x += 0.22;
      arms[1].rotation.x -= 0.35;
      elbows[1].rotation.x -= 0.48;
    }
  }

  function reset() {
    stride = actor.age = 0;
    pose(0, 0, false);
  }

  return { root: actor.mesh, body, arms, elbows, setForm, updateWear, pose, reset };
}
