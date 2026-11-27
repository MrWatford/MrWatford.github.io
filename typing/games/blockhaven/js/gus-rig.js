import * as THREE from "../lib/three.module.min.js";
import { attachIronGuardian, updateIronGuardianSurface } from "./iron-guardian-model.js?v=ancient-guardian-2";

const HIP_HEIGHT = 1.64;

export function buildGusRig(scene, box) {
  const actor = { uid: "gus", pos: { x: 0, y: 0, z: 0 }, yaw: 0, hp: 100, maxHp: 100, age: 0, onGround: true };
  const view = attachIronGuardian(actor, scene);
  const { body, head, armR, armL, elbowR, elbowL, legR, legL, kneeR, kneeL, footR, footL } = actor.parts;
  for (const [name, part] of Object.entries(actor.parts)) part.name = name;
  actor.mesh.name = "Gus";
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

  const enamel = new THREE.MeshStandardMaterial({ color: 0x923b30, roughness: 0.83 });
  const brass = new THREE.MeshStandardMaterial({ color: 0xbd8d50, roughness: 0.65 });

  // Gus wears the village watch colors on one shoulder and above his spine.
  box(armR, enamel, -0.10, 0.184, 0.005, 0.45, 0.095, 0.65);
  box(armR, enamel, -0.10, 0.135, -0.335, 0.45, 0.18, 0.065);
  box(armR, brass, -0.10, 0.075, -0.375, 0.34, 0.045, 0.035);
  box(body, enamel, 0, 1.008, -0.374, 0.49, 0.12, 0.105);
  box(body, brass, 0, 1.008, -0.433, 0.19, 0.048, 0.022);

  const arms = [armR, armL], elbows = [elbowR, elbowL];
  const legs = [legR, legL], knees = [kneeR, kneeL], feet = [footR, footL];
  let stride = 0;

  function setForm(form) {
    actor.mat.color.setRGB(...(form === "damaged" ? [0.77, 0.70, 0.60] : [1, 1, 1]));
  }

  function updateWear(armor, dt, reducedMotion, striking) {
    actor.hp = armor;
    actor.age += dt;
    updateIronGuardianSurface(actor, 0, false, reducedMotion, Number(striking), 0);
  }

  function pose(speed, dt, reducedMotion) {
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
  }

  function reset() {
    stride = actor.age = 0;
    pose(0, 0, false);
  }

  return { root: actor.mesh, body, arms, elbows, setForm, updateWear, pose, reset };
}
