import * as THREE from "../lib/three.module.min.js";
import { bakeCharacterBoxes, characterAtlas } from "./character-voxel.js?v=living-kingdom-1";
import { raiderAppearance, raiderModel } from "./raider-models.js?v=living-kingdom-1";

const { lerp, clamp } = THREE.MathUtils;
const down = new THREE.Vector3(0, -1, 0);
const cache = new Map();
const activeEffects = new Set();
const EFFECT_LIMIT = 12;
const LEG_KEYS = ["legFR", "legFL", "legBR", "legBL"];
const NEAR_LIMIT = { enter: 19 ** 2, exit: 23 ** 2 };
let spellGeometry, dustGeometry, boltGeometry;

const effectBox = (at, size, pigment) => ({ at, size, pigment, surface: "ink" });
function effectGeometry(spell) {
  if (spell && spellGeometry) return spellGeometry;
  if (!spell && dustGeometry) return dustGeometry;
  if (!spell) {
    dustGeometry = bakeCharacterBoxes([
      effectBox([-1.3,.23,0],[.48,.42,.48],0xa28d71), effectBox([-2.1,.5,-.8],[.36,.36,.36],0xbcaa8c),
      effectBox([.3,.41,1.3],[.52,.50,.52],0xb9a082), effectBox([2.1,.58,-2.3],[.28,.26,.28],0x9b8069),
      effectBox([1.2,.29,-1.4],[.35,.32,.35],0xba9f7e)
    ]);
    return dustGeometry;
  }
  const boxes = [];
  for (const [x,y,w,h] of [[0,2.3,5,.42],[-2.3,0,.42,4.5],[0,-2.3,5,.42],[2.3,.1,.42,4.6],
    [0,1.1,2.6,.3],[-1.2,0,.30,2.1],[.2,-1.0,2.5,.31],[1.1,-.15,.30,1.5]]) {
    boxes.push(effectBox([x,y,0],[w,h,.36],0xc175ff));
  }
  for (let i = 0; i < 6; i++) {
    const angle = i * Math.PI / 3;
    boxes.push(effectBox([Math.cos(angle)*3.9,Math.sin(angle)*3.9, i % 2 ? .7 : -1],
      [.47,.47,.47], i % 2 ? 0xe0afff : 0x9d56e2));
  }
  spellGeometry = bakeCharacterBoxes(boxes);
  return spellGeometry;
}

function materialFor(sceneLighting) {
  const options = { vertexColors: true, map: characterAtlas() };
  if (sceneLighting) return new THREE.MeshStandardMaterial({ ...options, roughness: .92 });
  const material = new THREE.MeshBasicMaterial(options);
  // Match the world renderer's display-space lighting, as in the villager rig.
  material.onBeforeCompile = shader => {
    shader.vertexShader = shader.vertexShader.replace("#include <color_vertex>",
      "#include <color_vertex>\nvColor.rgb = pow(vColor.rgb, vec3(0.455));");
  };
  return material;
}
function variantGeometry(a) {
  let entry = cache.get(a.key);
  if (entry) return entry;
  entry = { parts: {}, refs: 0 };
  for (const [name, { at, parent, local, core, detail }] of Object.entries(raiderModel(a))) {
    const origin = local ? undefined : at;
    const compact = bakeCharacterBoxes(core, origin);
    const full = detail.length ? bakeCharacterBoxes([...core, ...detail], origin) : compact;
    entry.parts[name] = { at, parent, compact, full };
  }
  cache.set(a.key, entry);
  return entry;
}
export function trimRaiderGeometryCache() {
  for (const [key, entry] of cache) {
    if (entry.refs !== 0) continue;
    for (const { compact, full } of Object.values(entry.parts)) {
      compact.dispose();
      if (full !== compact) full.dispose();
    }
    cache.delete(key);
  }
}

export function createRaiderBolt() {
  boltGeometry ||= bakeCharacterBoxes([
    { at: [0,0,0], size: [.63,.63,6.5], pigment: 0xb37a49, surface: "wood" },
    { at: [0,0,-3.29], size: [1.18,1.09,1.5], pigment: 0xb2b1a7, surface: "iron" },
    { at: [0,0,2.61], size: [1.55,.25,1.34], pigment: 0x9d4b59, surface: "wool" },
    { at: [0,0,2.61], size: [.25,1.55,1.34], pigment: 0xd5c5a8, surface: "linen" }
  ]);
  return new THREE.Mesh(boltGeometry.clone(), materialFor(false));
}

export function createRaiderRig(type, uid, rank, { sceneLighting = false } = {}) {
  const look = raiderAppearance(type, uid, rank);
  if (!look) return null;
  const entry = variantGeometry(look);
  entry.refs++;
  const material = materialFor(sceneLighting);
  const root = new THREE.Group(), motion = new THREE.Group(), joints = {};
  const meshes = [];
  root.name = type + " rig";
  root.add(motion);
  for (const [name, def] of Object.entries(entry.parts)) {
    const joint = new THREE.Group(), mesh = new THREE.Mesh(def.full, material);
    joint.name = name;
    const parent = def.parent && entry.parts[def.parent]?.at;
    joint.position.set(...def.at.map((n, axis) => (n - (parent?.[axis] || 0)) / 16));
    mesh.castShadow = sceneLighting;
    mesh.receiveShadow = sceneLighting;
    joint.add(mesh);
    (joints[def.parent] || motion).add(joint);
    joints[name] = joint;
    meshes.push({ joint, mesh, def, name });
  }

  const beast = type === "ravager", caster = type === "evoker", marksman = type === "pillager";
  let effect, bolt;
  if (caster || beast) {
    effect = new THREE.Mesh(effectGeometry(caster), new THREE.MeshBasicMaterial({
      vertexColors: true, transparent: true, depthWrite: false, toneMapped: false,
      blending: caster ? THREE.AdditiveBlending : THREE.NormalBlending
    }));
    if (!sceneLighting) effect.material.onBeforeCompile = material.onBeforeCompile;
    effect.name = caster ? "Cast sigil" : "Hoof dust";
    effect.visible = false;
    motion.add(effect);
  }
  if (marksman) {
    bolt = createRaiderBolt();
    bolt.name = "Nocked bolt";
    bolt.position.set(0, 1.49 / 16, 2.31 / 16);
    bolt.rotation.y = Math.PI;
    bolt.material.dispose();
    bolt.material = material;
    joints.weapon.add(bolt);
  }
  const arm = new THREE.Vector3(), bend = new THREE.Vector3(), elbow = new THREE.Vector3();
  const right = new THREE.Vector3(), left = new THREE.Vector3(), offset = new THREE.Vector3();
  const desired = new THREE.Quaternion(), mountAngles = new THREE.Euler(0, 0, 0, "YXZ");
  const legs = beast ? LEG_KEYS.map(name => joints[name]) : [joints.legR, joints.legL];
  const shoulders = [joints.armR, joints.armL], forearms = [joints.foreR, joints.foreL];
  const limbLength = 4 / 16;
  let near = true, elapsed = 0, stride = 0, walk = 0, aim = 0, ready = 0, initialized = false;
  let hoofStep, dustAge = Infinity, disposed = false;

  function hideEffects() {
    if (!effect) return;
    effect.visible = false;
    activeEffects.delete(effect);
  }
  function showEffect(opacity) {
    if (!activeEffects.has(effect)) {
      if (activeEffects.size >= EFFECT_LIMIT) return;
      activeEffects.add(effect);
    }
    effect.visible = true;
    effect.material.opacity = opacity;
  }
  function fitArm(i, wrist) {
    const shoulder = shoulders[i], forearm = forearms[i];
    arm.copy(wrist).sub(shoulder.position);
    const length = Math.max(.001, arm.length());
    arm.multiplyScalar(1 / length);
    const distance = Math.min(length, 2 * limbLength - .001);
    wrist.copy(shoulder.position).addScaledVector(arm, distance);
    bend.set(i === 0 ? -.43 : .43, -1, -.20);
    bend.addScaledVector(arm, -bend.dot(arm)).normalize();
    elbow.copy(shoulder.position).addScaledVector(arm, distance / 2)
      .addScaledVector(bend, Math.sqrt(Math.max(0, limbLength ** 2 - (distance / 2) ** 2)));
    shoulder.quaternion.setFromUnitVectors(down, arm.copy(elbow).sub(shoulder.position).normalize());
    forearm.position.copy(elbow);
    forearm.quaternion.setFromUnitVectors(down, arm.copy(wrist).sub(elbow).normalize());
  }
  function holdWeapon(pitch, yaw, roll) {
    const weapon = joints.weapon;
    desired.setFromEuler(mountAngles.set(pitch, yaw, roll));
    weapon.position.set(0, -limbLength, 0);
    weapon.quaternion.copy(forearms[0].quaternion).invert().multiply(desired);
  }
  function pose(dt, state) {
    const { age = 0, speed = 0, target = false, draw = 0, releaseAge = Infinity, discharge = "",
      impactAge = Infinity, prep = false, windup = 0, gaze = 0, pitch = 0, distanceSq = 0, fast = false,
      reducedMotion = false, grounded = false, dusty = false, summonX = .76, summonY = 1.82, summonZ = .12 } = state;
    const high = !fast && distanceSq <= (near ? NEAR_LIMIT.exit : NEAR_LIMIT.enter);
    const changed = high !== near;
    if (changed) {
      near = high;
      for (const { mesh, def, name, joint } of meshes) {
        mesh.geometry = high ? def.full : def.compact;
        // The cape is still part of each close silhouette. The far shell and tabard carry faction color.
        if (name === "tail") joint.visible = high;
        if (name === "cape") joint.visible = high || look.rank === "banner";
      }
    }
    stride += dt * Math.max(0, speed) * (beast ? 5.2 : 7.6);
    elapsed += dt;
    if (!changed && initialized && !near && elapsed < 1 / 22) return;
    const step = elapsed, blend = initialized ? 1 - Math.exp(-13 * step) : 1;
    elapsed = 0;
    initialized = true;
    if (effect && !near) hideEffects();
    const motionScale = reducedMotion ? .6 : 1;
    const time = age + look.phase * 4.1;
    walk += (clamp((speed - .12) / 2.3, 0, 1) - walk) * blend;
    aim += ((target ? .65 + .35 * clamp(draw, 0, 1) : 0) - aim) * blend;
    ready += ((prep || target ? 1 : 0) - ready) * blend;
    const gait = Math.sin(stride) * walk * (beast ? .43 : .50) * motionScale;
    const recovery = Math.max(0, 1 - impactAge / .36);
    motion.position.y = Math.abs(gait) * .055 + (reducedMotion ? 0 : .006 * Math.sin(time * 2.3));
    joints.head.rotation.y += (clamp(gaze, -.62, .62) * (beast ? .74 : .85) - joints.head.rotation.y) * blend;
    if (beast) {
      for (let i = 0; i < legs.length; i++) legs[i].rotation.x = i === 0 || i === 3 ? gait : -gait;
      const roar = discharge === "roar" ? Math.max(0, 1 - releaseAge / .48) : 0;
      const bite = recovery * motionScale;
      const brace = prep ? .11 * motionScale : 0;
      joints.body.rotation.x = walk * .04 - bite * .09;
      joints.neck.rotation.x = walk * .05 - bite * .13 - .16 * roar + brace;
      joints.head.rotation.x = walk * .075 - bite * .26 + pitch * .22 - .2 * roar + brace;
      joints.head.position.z = (10.2 + bite * 1.1) / 16;
      // Head-relative hinge opens the lower jaw on the existing melee contact.
      joints.jaw.rotation.x = .06 + Math.max(bite * .45, roar * .55);
      joints.tail.rotation.x = .08 + gait * .48;
      joints.tail.rotation.y = Math.sin(time * 2.7) * .12 * motionScale;
      const currentStep = Math.floor(stride / Math.PI);
      if (currentStep !== hoofStep) {
        if (hoofStep !== undefined && grounded && dusty && walk > .42 && near && !reducedMotion) {
          dustAge = 0;
          effect.position.set((currentStep % 2 ? 5.4 : -5.4) / 16, .027, .45);
        }
        hoofStep = currentStep;
      }
      dustAge += step;
      if (near && !reducedMotion && dusty && dustAge < .24) {
        effect.scale.setScalar(.67 + dustAge * 3.1);
        showEffect(.46 * (1 - dustAge / .24));
      } else hideEffects();
      return;
    }
    legs[0].rotation.x = gait;
    legs[1].rotation.x = -gait;
    joints.cape.rotation.x = -walk * .17 - Math.sin(time * 4) * walk * .075 * motionScale;
    joints.head.rotation.x = pitch * .35 + recovery * .11;
    const wristY = .93 + Math.abs(gait) * .16;
    if (marksman) {
      const recoil = Math.max(0, 1 - releaseAge / .22) * motionScale;
      right.set(lerp(-.23,-.091,aim), lerp(1.01,1.38,aim), lerp(.12,.31,aim) - recoil * .105);
      fitArm(0, right);
      holdWeapon(lerp(.39, -pitch, aim) - recoil * .32, lerp(.22, gaze * .35, aim), lerp(.25,.02,aim));
      offset.set(.041, -.032, .166).applyQuaternion(desired);
      left.copy(right).add(offset);
      if (aim < .75) left.lerp(offset.set(.26,wristY,.03 - gait*.27), (.75-aim)*.83);
      fitArm(1, left);
      bolt.visible = draw > .55 && target && releaseAge > .25;
    } else if (caster) {
      const cast = releaseAge < .65 ? (1 - releaseAge / .65) ** .58 : 0;
      const lift = Math.max(ready * .38, cast);
      right.set(-.28 - lift * .19, lerp(wristY,1.56,lift), .09 + lift * .22 + gait * .21);
      left.set(.29 + lift * .18, lerp(wristY,1.64,lift), .08 + lift * .22 - gait * .22);
      fitArm(0, right);
      fitArm(1, left);
      const active = near && releaseAge < (reducedMotion ? .32 : .58) && Boolean(discharge);
      if (active) {
        if (discharge === "summon") effect.position.set(summonX, summonY, summonZ);
        else effect.position.copy(right).add(offset.set(-.05,.13,.14));
        effect.rotation.z = reducedMotion ? 0 : releaseAge * -.82;
        effect.scale.setScalar(reducedMotion ? .85 : .77 + releaseAge * .9);
        showEffect(reducedMotion ? .57 : .9 * (1 - releaseAge / .67));
      } else hideEffects();
    } else {
      const follow = recovery * motionScale;
      const lift = clamp(windup, 0, 1) * motionScale;
      right.set(-.35 + follow * .24 - lift * .14, wristY + ready * .13 + follow * .14 + lift * .51,
        .07 + ready * .20 + follow * .27 - lift * .37);
      left.set(.31, wristY + ready * .14, .07 - gait * .21);
      fitArm(0, right);
      fitArm(1, left);
      holdWeapon(.18 + ready * .15 + follow * 1.16 - lift * 1.27, follow * -.46, -.16 + follow * .78 + lift * .48);
    }
  }

  function dispose() {
    if (disposed) return;
    disposed = true;
    hideEffects();
    root.removeFromParent();
    material.dispose();
    effect?.material.dispose();
    bolt?.geometry.dispose();
    entry.refs--;
  }
  function resetPose() {
    elapsed = stride = walk = aim = ready = 0;
    initialized = false;
    hoofStep = undefined;
    dustAge = Infinity;
    hideEffects();
    pose(0, {});
  }
  resetPose();
  return { root, material, parts: joints, look, pose, resetPose, hideEffects, dispose };
}
