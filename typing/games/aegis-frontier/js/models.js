// Ringfall: detailed models built from beveled parts with separate materials
// (painted armor, dark undersuit, bare metal, rubber, glass, glowing energy parts).
// The Guardian, first-person hands and weapons, robots, and the rover live here.
import * as THREE from "../lib/three.module.min.js";
import { MAT, bevelBox, srgb } from "./materials.js";

function part(g, geo, mat, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, shadow = true) {
  const m = new THREE.Mesh(geo, mat);
  m.position.set(x, y, z); m.rotation.set(rx, ry, rz);
  m.castShadow = shadow; m.receiveShadow = true;
  g.add(m); return m;
}
const B = (w, h, d, r) => bevelBox(w, h, d, r ?? Math.min(w, h, d) * 0.18);
const cyl = (r1, r2, h, s = 12) => new THREE.CylinderGeometry(r1, r2, h, s);

// Painted materials are cloned per suit color set so the player's chosen colors apply.
export function suitMaterials(colors) {
  const a = MAT.armorBlue.clone(), b = MAT.armorWhite.clone(), c = MAT.armorOrange.clone();
  a.color.set(colors[0]); b.color.set(colors[1]); c.color.set(colors[2]);
  for (const m of [a, b, c]) { m.onBeforeCompile = MAT.armorBlue.onBeforeCompile; m.customProgramCacheKey = MAT.armorBlue.customProgramCacheKey; }
  return { main: a, light: b, accent: c };
}

// ---------------- the Guardian (about 1.9 m tall) ----------------
export function buildGuardian(colors, seated) {
  const S = suitMaterials(colors), g = new THREE.Group();
  const U = MAT.undersuit, M = MAT.darkMetal;
  // rounded shell piece (part of a squashed sphere) for shoulders, helmet, and knee caps
  const shell = (r, sx, sy, sz, phi = Math.PI * 2, theta = Math.PI / 2) => { const geo = new THREE.SphereGeometry(r, 16, 10, 0, phi, 0, theta); geo.scale(sx, sy, sz); return geo; };
  // ----- legs (in a hip group so the Guardian can sit) -----
  const legs = new THREE.Group(); legs.position.y = 0.98; g.add(legs);
  const lg = new THREE.Group(); lg.position.y = -0.98; legs.add(lg);
  if (seated) legs.rotation.x = -1.45;
  for (const sx of [-1, 1]) {
    const x = sx * 0.12;
    part(lg, cyl(0.075, 0.06, 0.88, 10), U, x, 0.52, 0);                          // undersuit leg
    part(lg, B(0.15, 0.3, 0.17, 0.05), S.main, x, 0.76, 0.03, 0.04);              // thigh plate
    part(lg, B(0.06, 0.22, 0.05, 0.02), S.accent, x + sx * 0.07, 0.76, 0.0);      // outer thigh stripe
    part(lg, shell(0.075, 1, 0.8, 1, Math.PI * 2, Math.PI * 0.6), S.light, x, 0.5, 0.06, -0.6);  // knee cap
    part(lg, B(0.13, 0.32, 0.12, 0.045), S.light, x, 0.29, 0.05);                  // shin guard
    part(lg, B(0.11, 0.24, 0.1, 0.04), M, x, 0.3, -0.04);                          // calf
    part(lg, B(0.06, 0.012, 0.02, 0.005), MAT.glowTeal, x, 0.36, 0.115, 0, 0, 0, false);
    part(lg, B(0.14, 0.09, 0.28, 0.035), M, x, 0.045, 0.04);                       // boot
    part(lg, B(0.13, 0.04, 0.12, 0.015), S.light, x, 0.1, 0.1);                    // toe cap
  }
  // ----- hips, waist, torso -----
  part(g, B(0.36, 0.13, 0.22, 0.05), M, 0, 0.98, 0);                              // belt
  part(g, B(0.16, 0.1, 0.04, 0.02), S.accent, 0, 0.97, 0.12);                     // buckle plate
  part(g, cyl(0.13, 0.15, 0.24, 12), U, 0, 1.15, 0);                              // flexible waist
  part(g, B(0.2, 0.1, 0.05, 0.03), S.light, 0, 1.15, 0.12, -0.1);                 // abdomen plate
  part(g, B(0.44, 0.22, 0.26, 0.07), S.light, 0, 1.38, 0.0);                      // chest (upper, widest)
  part(g, B(0.36, 0.1, 0.22, 0.04), S.light, 0, 1.25, 0.01);                      // lower ribs
  for (const sx of [-1, 1]) part(g, B(0.17, 0.14, 0.05, 0.03), S.main, sx * 0.1, 1.4, 0.13, -0.12, sx * 0.18, 0);  // chest plates
  part(g, B(0.06, 0.12, 0.03, 0.01), M, 0, 1.38, 0.14);                           // sternum seam
  for (let i = 0; i < 3; i++) part(g, B(0.06, 0.008, 0.008, 0.003), MAT.rubber, 0, 1.34 + i * 0.022, 0.157, 0, 0, 0, false);
  part(g, B(0.4, 0.34, 0.15, 0.05), S.main, 0, 1.33, -0.19);                      // back pack
  part(g, B(0.3, 0.04, 0.05, 0.015), S.accent, 0, 1.47, -0.27);
  part(g, cyl(0.035, 0.035, 0.22, 8), MAT.glowTeal, 0, 1.3, -0.27, 0, 0, Math.PI / 2, false);
  part(g, B(0.08, 0.16, 0.06, 0.02), M, -0.16, 1.28, -0.27); part(g, B(0.08, 0.16, 0.06, 0.02), M, 0.16, 1.28, -0.27);
  // emblem: an original hexagon with a rising star
  const em = new THREE.Mesh(new THREE.CircleGeometry(0.032, 6), MAT.glowAmber); em.position.set(0.11, 1.42, 0.161); em.rotation.y = 0.18; g.add(em);
  part(g, cyl(0.065, 0.075, 0.08, 10), U, 0, 1.53, 0);                            // collar
  part(g, B(0.3, 0.05, 0.2, 0.025), M, 0, 1.51, -0.02);
  // ----- shoulders and arms (each arm pivots at the shoulder, the forearm at the elbow) -----
  const arms = {};
  for (const sx of [-1, 1]) {
    const x = sx * 0.29;
    const arm = new THREE.Group(); arm.position.set(x, 1.46, 0); g.add(arm);
    const ay = (y) => y - 1.46;
    part(arm, shell(0.115, 1.15, 0.95, 1.05), S.main, 0, 0, 0, 0, 0, sx * -0.35);                 // rounded pauldron
    part(arm, shell(0.1, 1.1, 0.7, 1.0), S.light, sx * 0.03, -0.045, 0, 0, 0, sx * -0.5);         // layered lower plate
    part(arm, B(0.2, 0.03, 0.2, 0.012), S.accent, sx * 0.02, -0.02, 0, 0, 0, sx * -0.35);          // pauldron rim
    part(arm, B(0.03, 0.06, 0.11, 0.01), M, sx * 0.1, ay(1.48), 0, 0, 0, sx * -0.35);             // attachment point
    part(arm, cyl(0.055, 0.05, 0.46, 10), U, 0, ay(1.2), 0);                                       // undersuit arm
    part(arm, B(0.11, 0.16, 0.12, 0.04), S.light, 0, ay(1.29), 0.0);                               // bicep plate
    part(arm, B(0.112, 0.012, 0.122, 0.004), M, 0, ay(1.3), 0.0, 0, 0, 0, false);                  // seam
    const fore = new THREE.Group(); fore.position.set(0, ay(1.12), 0); arm.add(fore);
    const fy = (y) => y - 1.12;
    part(fore, shell(0.05, 1, 0.8, 1), M, 0, 0, -0.01, Math.PI);                                    // elbow
    part(fore, B(0.12, 0.22, 0.13, 0.045), S.main, 0, fy(0.99), 0.02);                             // gauntlet
    part(fore, B(0.13, 0.1, 0.06, 0.02), S.light, sx * 0.01, fy(1.03), 0.075);                     // forearm guard
    part(fore, B(0.125, 0.02, 0.135, 0.008), MAT.glowTeal, 0, fy(0.92), 0.02, 0, 0, 0, false);
    part(fore, B(0.085, 0.09, 0.09, 0.03), U, 0, fy(0.83), 0.03);                                  // glove
    part(fore, B(0.07, 0.025, 0.06, 0.01), S.light, 0, fy(0.86), 0.06);                            // knuckle plate
    arms[sx] = { arm, fore };
  }
  // ----- helmet: rounded shell, crest, cheek guards, side lights, wrap-around amber visor -----
  const head = new THREE.Group(); head.position.y = 1.59; g.add(head);
  const hy = 0.1;
  part(head, cyl(0.06, 0.07, 0.07, 10), U, 0, 0, 0);
  part(head, new THREE.SphereGeometry(0.14, 24, 16).scale(0.92, 1.0, 1.05), S.light, 0, hy, -0.01);
  part(head, shell(0.145, 0.95, 1.05, 1.08, Math.PI * 2, Math.PI * 0.34), S.main, 0, hy + 0.01, -0.01);   // top shell
  part(head, B(0.06, 0.05, 0.28, 0.02), S.accent, 0, hy + 0.15, -0.01);                      // crest ridge
  part(head, B(0.02, 0.03, 0.2, 0.008), M, 0, hy + 0.175, -0.02);                            // crest seam
  for (const sx of [-1, 1]) {
    part(head, B(0.04, 0.12, 0.15, 0.02), S.main, sx * 0.12, hy - 0.04, 0.03, 0, sx * 0.15, 0);   // cheek guards
    part(head, cyl(0.035, 0.035, 0.03, 12), M, sx * 0.135, hy + 0.02, -0.02, 0, 0, Math.PI / 2);  // ear module
    part(head, cyl(0.012, 0.012, 0.032, 8), MAT.glowTeal, sx * 0.137, hy + 0.02, -0.02, 0, 0, Math.PI / 2, false);
  }
  const visor = new THREE.SphereGeometry(0.15, 28, 12, -0.8 + Math.PI / 2, 1.6, Math.PI * 0.36, Math.PI * 0.21);
  part(head, visor.scale(0.95, 1, 1.12), MAT.visor, 0, hy, 0.0);
  part(head, B(0.11, 0.05, 0.05, 0.015), M, 0, hy - 0.09, 0.12);                              // breather
  for (const sx of [-1, 1]) part(head, B(0.025, 0.03, 0.02, 0.006), MAT.rubber, sx * 0.035, hy - 0.09, 0.148, 0, 0, 0, false);
  part(head, cyl(0.006, 0.006, 0.1, 4), MAT.metal, 0.11, hy + 0.14, -0.06);                    // antenna
  // extra seams and bands for close-up shots
  for (let i = 0; i < 3; i++) part(g, B(0.27, 0.012, 0.21, 0.005), M, 0, 1.08 + i * 0.05, 0, 0, 0, 0, false);   // abdomen bands
  part(g, B(0.44, 0.012, 0.262, 0.005), M, 0, 1.31, 0.0, 0, 0, 0, false);                                      // chest seam
  g.userData = { arms, head, legs };
  return g;
}

// Poses for still shots (the Guardian holding a carbine across the body, ready).
export function poseGuardian(g, pose, weapon) {
  const { arms, head } = g.userData;
  if (pose === "ready") {
    // character's right arm is on -x (it faces +z)
    arms[-1].arm.rotation.set(-0.55, 0.15, 0.12); arms[-1].fore.rotation.set(-1.35, 0.25, 0);
    arms[1].arm.rotation.set(-0.95, -0.55, -0.15); arms[1].fore.rotation.set(-1.0, -0.2, 0.15);
    head.rotation.set(0.05, -0.12, 0);
    if (weapon) {
      weapon.scale.setScalar(1.6);
      weapon.position.set(0.02, 1.08, 0.33);
      weapon.rotation.set(0.25, Math.PI + 0.75, 0.35, "YXZ");
      g.add(weapon);
    }
  }
}

// ---------------- first-person arm ----------------
// Gauntlet with the tether emitter, armored forearm, a dark glove with jointed fingers.
export function buildFPArm(colors, left) {
  const S = suitMaterials(colors), g = new THREE.Group(), U = MAT.undersuit;
  part(g, B(0.12, 0.12, 0.3, 0.03), S.main, 0.04, -0.15, 0.26, 0, 0, 0, false);       // forearm plate
  part(g, B(0.125, 0.03, 0.16), S.accent, 0.04, -0.09, 0.24, 0, 0, 0, false);
  part(g, B(0.13, 0.08, 0.12, 0.025), MAT.darkMetal, 0.04, -0.13, 0.11, 0, 0, 0, false); // gauntlet cuff
  const ring = part(g, new THREE.TorusGeometry(0.05, 0.012, 6, 14), MAT.glowTeal, 0.04, -0.09, 0.11, Math.PI / 2, 0, 0, false);
  part(g, B(0.1, 0.06, 0.1, 0.02), U, 0, -0.08, 0.04, 0, 0, 0, false);              // glove
  part(g, B(0.1, 0.03, 0.08, 0.012), S.light, 0, -0.045, 0.04, 0, 0, 0, false);       // back-of-hand plate
  const fingers = [];
  for (let i = 0; i < 4; i++) {
    const f = new THREE.Group(); f.position.set(-0.035 + i * 0.023, -0.07, -0.01); g.add(f);
    part(f, B(0.02, 0.022, 0.05, 0.007), U, 0, 0, -0.02, 0, 0, 0, false);
    const tip = part(f, B(0.018, 0.02, 0.04, 0.006), U, 0, -0.012, -0.05, 0.9, 0, 0, false);
    f.rotation.x = 0.6; fingers.push(f);
  }
  const thumb = part(g, B(0.022, 0.022, 0.06, 0.007), U, left ? 0.06 : -0.06, -0.09, 0.03, 0.2, left ? 0.6 : -0.6, 0, false);
  g.userData = { ring, fingers, thumb };
  return g;
}

// ---------------- first-person weapons ----------------
// Each has a distinct silhouette, materials, a glowing energy indicator (scaled by charge), and a cell
// part that moves during reloads.
export function buildWeapon(id) {
  const g = new THREE.Group(), W = MAT.armorWhite, D = MAT.darkMetal, Mt = MAT.metal, O = MAT.armorOrange, Ru = MAT.rubber;
  const glowMat = new THREE.MeshStandardMaterial({ color: 0x000000, emissive: srgb(0.4, 0.95, 1), emissiveIntensity: 2.4 });
  const P = (geo, mat, x, y, z, rx = 0, ry = 0, rz = 0) => part(g, geo, mat, x, y, z, rx, ry, rz, false);
  let cell, ind;
  const colorOf = { carbine: [0.45, 0.97, 1], pistol: [0.6, 0.8, 1], prism: [1, 1, 1], scatter: [1, 0.6, 0.25], flux: [0.45, 1, 0.65], beam: [1, 0.45, 0.85], shock: [1, 0.95, 0.45] }[id];
  glowMat.emissive.copy(srgb(...colorOf));
  if (id === "carbine") {
    P(B(0.1, 0.12, 0.46), W, 0, 0, -0.02); P(B(0.08, 0.06, 0.3), D, 0, 0.075, -0.06);
    P(cyl(0.022, 0.026, 0.22, 10), Mt, 0, 0.01, -0.34, Math.PI / 2); P(cyl(0.032, 0.032, 0.05, 10), D, 0, 0.01, -0.44, Math.PI / 2);
    P(B(0.05, 0.14, 0.07), Ru, 0, -0.11, 0.1, -0.25); P(B(0.104, 0.02, 0.2), O, 0, -0.035, -0.12);
    cell = P(B(0.05, 0.11, 0.07), D, 0, -0.1, -0.05); ind = P(B(0.012, 0.012, 0.16), glowMat, 0.052, 0.03, -0.06);
    P(B(0.03, 0.05, 0.06), D, 0, 0.12, 0.02); // rear sight
  } else if (id === "pistol") {
    P(B(0.07, 0.1, 0.26), W, 0, 0, 0); P(B(0.05, 0.13, 0.07), Ru, 0, -0.1, 0.07, -0.2);
    for (const z of [-0.06, -0.12]) P(new THREE.TorusGeometry(0.045, 0.01, 6, 14), glowMat, 0, 0, z);
    P(cyl(0.018, 0.018, 0.06, 8), Mt, 0, 0, -0.15, Math.PI / 2);
    cell = P(B(0.04, 0.06, 0.05), D, 0, -0.09, 0.06); ind = P(B(0.01, 0.01, 0.1), glowMat, 0.037, 0.035, 0.0);
  } else if (id === "prism") {
    P(B(0.07, 0.1, 0.8), W, 0, 0, -0.1); P(B(0.05, 0.14, 0.1), Ru, 0, -0.11, 0.15, -0.2);
    P(cyl(0.032, 0.032, 0.24, 12), D, 0, 0.1, -0.02, Math.PI / 2); P(new THREE.CircleGeometry(0.03, 12), MAT.glass, 0, 0.1, 0.101);
    P(new THREE.OctahedronGeometry(0.05), glowMat, 0, 0, -0.52); P(B(0.015, 0.02, 0.5), O, 0.04, 0.03, -0.1);
    cell = P(B(0.05, 0.08, 0.08), D, 0, -0.08, -0.08); ind = P(B(0.01, 0.01, 0.12), glowMat, -0.04, 0.03, -0.12);
  } else if (id === "scatter") {
    P(B(0.2, 0.11, 0.38), O, 0, 0, 0); P(B(0.13, 0.07, 0.2), W, 0, 0.08, 0.05); P(B(0.06, 0.14, 0.08), Ru, 0, -0.11, 0.1, -0.2);
    for (const x of [-0.06, 0, 0.06]) P(cyl(0.026, 0.03, 0.14, 8), Mt, x, 0, -0.25, Math.PI / 2);
    cell = P(B(0.12, 0.05, 0.08), D, 0, -0.07, -0.05); ind = P(B(0.12, 0.012, 0.012), glowMat, 0, 0.06, -0.18);
  } else if (id === "flux") {
    P(cyl(0.075, 0.075, 0.56, 14), W, 0, 0, 0, Math.PI / 2); P(cyl(0.08, 0.08, 0.06, 14), D, 0, 0, -0.2, Math.PI / 2);
    P(B(0.16, 0.035, 0.26), O, 0, 0.08, 0); P(B(0.06, 0.15, 0.09), Ru, 0, -0.13, 0.1, -0.2);
    cell = P(new THREE.SphereGeometry(0.065, 14, 10), glowMat, 0, 0, -0.31); ind = P(B(0.01, 0.01, 0.2), glowMat, 0.078, 0.02, 0);
  } else if (id === "beam") {
    P(B(0.09, 0.12, 0.42), D, 0, 0, 0); P(cyl(0.016, 0.02, 0.36, 8), Mt, 0, 0.02, -0.36, Math.PI / 2);
    const vents = [];
    for (const z of [-0.06, 0.02, 0.1]) { const v = P(B(0.12, 0.02, 0.03), glowMat, 0, 0.07, z); v.name = "vent"; vents.push(v); }
    P(B(0.06, 0.14, 0.09), Ru, 0, -0.12, 0.1, -0.2); P(B(0.092, 0.02, 0.16), W, 0, -0.045, -0.1);
    cell = P(B(0.05, 0.07, 0.06), Mt, 0, -0.08, -0.05); ind = vents[0];
  } else if (id === "shock") {
    P(B(0.11, 0.11, 0.28), W, 0, 0, 0);
    P(B(0.022, 0.022, 0.22), Mt, -0.035, 0.02, -0.24); P(B(0.022, 0.022, 0.22), Mt, 0.035, 0.02, -0.24);
    P(B(0.03, 0.03, 0.03), glowMat, -0.035, 0.02, -0.35); P(B(0.03, 0.03, 0.03), glowMat, 0.035, 0.02, -0.35);
    P(B(0.06, 0.14, 0.08), Ru, 0, -0.12, 0.1, -0.2);
    cell = P(cyl(0.045, 0.045, 0.13, 10), glowMat, 0, -0.07, 0.06); ind = cell;
  }
  g.userData = { cell, cellHome: cell ? cell.position.clone() : null, ind, glowMat };
  return g;
}

// Merges a group's non-moving child meshes into one mesh per material (fewer draw calls).
function mergeStatic(group, keep) {
  const buckets = new Map();
  for (const m of [...group.children]) {
    if (!m.isMesh || keep.has(m)) continue;
    m.updateMatrix();
    const g = (m.geometry.index ? m.geometry.toNonIndexed() : m.geometry.clone()).applyMatrix4(m.matrix);
    if (!buckets.has(m.material)) buckets.set(m.material, []);
    buckets.get(m.material).push(g);
    group.remove(m);
  }
  for (const [mat, list] of buckets) {
    let n = 0; for (const g of list) n += g.attributes.position.count;
    const pos = new Float32Array(n * 3), nor = new Float32Array(n * 3); let o = 0;
    for (const g of list) { pos.set(g.attributes.position.array, o * 3); nor.set(g.attributes.normal.array, o * 3); o += g.attributes.position.count; g.dispose(); }
    const geo = new THREE.BufferGeometry(); geo.setAttribute("position", new THREE.BufferAttribute(pos, 3)); geo.setAttribute("normal", new THREE.BufferAttribute(nor, 3)); geo.computeBoundingSphere();
    const mesh = new THREE.Mesh(geo, mat); mesh.castShadow = true; mesh.receiveShadow = true; group.add(mesh);
  }
}

// ---------------- robots ----------------
// Same proportions and weak-point layout as before, rebuilt with beveled armor, jointed legs,
// sensor lights, vents, and power components. "Front" is -z.
export function buildRobotModel(type, cmd) {
  const g = new THREE.Group(), body = new THREE.Group(); g.add(body);
  const eye = new THREE.MeshStandardMaterial({ color: 0x000000, emissive: srgb(1, 0.66, 0.2), emissiveIntensity: 2.5 });
  const glow = MAT.glowViolet;
  const A = MAT.robotBody, L = MAT.robotLight, Tm = cmd ? MAT.robotGold : MAT.robotTrim, Mt = MAT.darkMetal;
  const P = { eye, glow, body, legs: [] };
  const p = (geo, mat, x, y, z, rx, ry, rz, par = body) => part(par, geo, mat, x, y, z, rx || 0, ry || 0, rz || 0);
  // two-segment leg with a knee joint; returns the hip group (rotated for walking)
  const leg = (x, hipY, w, len, d) => {
    const hip = new THREE.Group(); hip.position.set(x, hipY, 0); body.add(hip);
    p(B(w, len * 0.5, d), L, 0, -len * 0.25, 0, 0, 0, 0, hip);
    p(new THREE.SphereGeometry(w * 0.45, 10, 8), Mt, 0, -len * 0.5, 0, 0, 0, 0, hip);
    p(B(w * 0.85, len * 0.5, d * 0.9), A, 0, -len * 0.75, 0.02, 0.1, 0, 0, hip);
    p(B(w * 1.1, 0.06, d * 1.3), Mt, 0, -len + 0.03, -0.03, 0, 0, 0, hip);
    P.legs.push(hip); return hip;
  };
  if (type === "scout") {
    p(B(0.7, 0.34, 0.9, 0.08), A, 0, 0.75, 0); p(B(0.5, 0.1, 0.6), Tm, 0, 0.96, 0);
    p(new THREE.SphereGeometry(0.12, 12, 10), eye, 0, 0.8, -0.47); p(cyl(0.15, 0.15, 0.06, 12), Mt, 0, 0.8, -0.44, Math.PI / 2);
    p(cyl(0.02, 0.02, 0.4, 6), Mt, 0.2, 1.1, 0.2); p(new THREE.SphereGeometry(0.05, 8, 6), glow, 0.2, 1.32, 0.2);
    for (const [x, z] of [[-0.35, -0.3], [0.35, -0.3], [-0.35, 0.3], [0.35, 0.3]]) { const h = leg(x, 0.64, 0.09, 0.62, 0.09); h.position.z = z; }
    P.weak = [0, 0.8, -0.45, 0.16];
  } else if (type === "sentry" || type === "engineer") {
    const eng = type === "engineer";
    p(B(0.72, 0.72, 0.44, 0.07), A, 0, 1.25, 0); p(B(0.5, 0.3, 0.4), L, 0, 0.84, 0);
    p(B(0.46, 0.32, 0.38, 0.08), eng ? L : A, 0, 1.78, 0); p(B(0.36, 0.07, 0.05, 0.02), eye, 0, 1.8, -0.2);
    p(B(0.62, 0.06, 0.48), Tm, 0, 1.6, 0); p(B(0.2, 0.25, 0.05), Mt, -0.15, 1.25, -0.23); p(B(0.2, 0.25, 0.05), Mt, 0.15, 1.25, -0.23);
    leg(-0.18, 0.78, 0.17, 0.76, 0.2); leg(0.18, 0.78, 0.17, 0.76, 0.2);
    P.arm = p(B(0.13, 0.13, 0.7), L, 0.45, 1.3, -0.3); p(cyl(0.05, 0.05, 0.12, 8), Mt, 0.45, 1.3, -0.7, Math.PI / 2); p(new THREE.SphereGeometry(0.055, 8, 6), glow, 0.45, 1.3, -0.77);
    if (eng) { p(B(0.5, 0.5, 0.3), Tm, 0, 1.3, 0.35); p(new THREE.SphereGeometry(0.1, 10, 8), new THREE.MeshStandardMaterial({ color: 0, emissive: srgb(0.45, 1, 0.65), emissiveIntensity: 2 }), -0.45, 1.3, -0.3); p(cyl(0.02, 0.02, 0.5, 6), Mt, -0.15, 2.05, 0.1); }
    P.weak = [0, 1.78, 0, 0.24];
  } else if (type === "bulwark") {
    p(B(1.1, 1.0, 0.8, 0.1), A, 0, 1.2, 0); p(B(0.6, 0.35, 0.5, 0.08), A, 0, 1.85, 0); p(B(0.4, 0.07, 0.05), eye, 0, 1.88, -0.26);
    p(B(1.15, 0.12, 0.85), Tm, 0, 1.55, 0);
    leg(-0.3, 0.8, 0.3, 0.8, 0.35); leg(0.3, 0.8, 0.3, 0.8, 0.35);
    const shield = new THREE.Mesh(B(1.5, 1.6, 0.1, 0.04), new THREE.MeshStandardMaterial({ color: srgb(0.5, 0.4, 0.9), emissive: srgb(0.35, 0.25, 0.8), emissiveIntensity: 0.9, transparent: true, opacity: 0.6, roughness: 0.2 }));
    shield.position.set(0, 1.15, -0.85); body.add(shield); P.shield = shield;
    p(B(0.5, 0.5, 0.25), Mt, 0, 1.3, 0.48);
    P.core = p(new THREE.SphereGeometry(0.22, 14, 10), new THREE.MeshStandardMaterial({ color: 0, emissive: srgb(1, 0.66, 0.2), emissiveIntensity: 2.5 }), 0, 1.3, 0.62);
    P.weak = [0, 1.3, 0.62, 0.3];
  } else if (type === "warden") {
    p(B(1.9, 1.5, 1.3, 0.15), A, 0, 2.2, 0); p(B(0.9, 0.5, 0.8, 0.1), A, 0, 3.1, 0); p(B(0.7, 0.09, 0.05), eye, 0, 3.1, -0.42);
    p(B(2.1, 0.12, 1.4), Tm, 0, 2.9, 0); for (const x of [-0.6, 0.6]) p(B(0.4, 0.5, 0.08), Mt, x, 2.3, -0.66);
    leg(-0.6, 1.5, 0.5, 1.5, 0.6); leg(0.6, 1.5, 0.5, 1.5, 0.6);
    P.arm = p(B(0.45, 1.4, 0.45), L, -1.25, 1.8, 0); P.arm2 = p(B(0.45, 1.4, 0.45), L, 1.25, 1.8, 0);
    P.core = p(new THREE.SphereGeometry(0.38, 16, 12), new THREE.MeshStandardMaterial({ color: 0, emissive: srgb(1, 0.66, 0.2), emissiveIntensity: 2.5 }), 0, 2.2, -0.68);
    P.weak = [0, 2.2, -0.68, 0.48];
  } else if (type === "skimmer") {
    p(B(1.2, 0.24, 0.7, 0.08), A, 0, 0, 0); p(B(0.5, 0.25, 0.9, 0.08), Tm, 0, 0.15, 0);
    p(new THREE.SphereGeometry(0.14, 12, 10), eye, 0, 0, -0.45);
    for (const x of [-0.75, 0.75]) { p(new THREE.TorusGeometry(0.3, 0.05, 6, 16), glow, x, 0.05, 0, Math.PI / 2); p(cyl(0.08, 0.08, 0.06, 10), Mt, x, 0.05, 0); }
    P.weak = [0, 0, -0.45, 0.2];
  } else if (type === "turret") {
    p(B(1.6, 0.6, 1.6, 0.1), A, 0, 0.3, 0); p(cyl(0.5, 0.6, 0.2, 14), Mt, 0, 0.7, 0);
    const head = new THREE.Group(); head.position.y = 1.0; body.add(head);
    p(B(1.0, 0.7, 1.0, 0.1), A, 0, 0.1, 0, 0, 0, 0, head);
    for (const x of [-0.22, 0.22]) { p(cyl(0.08, 0.09, 1.3, 10), L, x, 0.1, -0.7, Math.PI / 2, 0, 0, head); p(cyl(0.1, 0.1, 0.1, 10), Mt, x, 0.1, -1.3, Math.PI / 2, 0, 0, head); }
    p(new THREE.SphereGeometry(0.12, 10, 8), eye, 0, 0.3, -0.5, 0, 0, 0, head); P.head = head;
    p(B(0.4, 0.8, 0.4), Tm, 0, 0.5, 1.2);
    P.core = p(new THREE.SphereGeometry(0.28, 14, 10), new THREE.MeshStandardMaterial({ color: 0, emissive: srgb(1, 0.66, 0.2), emissiveIntensity: 2.5 }), 0, 1.05, 1.2);
    P.weak = null;
  }
  if (cmd) P.crest = p(B(0.1, 0.5, 0.6), MAT.robotGold, 0, type === "warden" ? 3.5 : type === "bulwark" ? 2.2 : 2.1, 0);
  const keep = new Set([P.shield, P.core].filter(Boolean));
  mergeStatic(body, keep);
  for (const h of P.legs) mergeStatic(h, keep);
  if (P.head) mergeStatic(P.head, keep);
  return { g, P };
}

// ---------------- the Trailrunner Rover ----------------
// Frame + body shell, roll cage, seats, lights, suspension arms, steerable wheels with treaded tires.
export function buildRover() {
  const g = new THREE.Group(), body = new THREE.Group(); g.add(body);
  const W = MAT.roverWhite, Bl = MAT.armorBlue, O = MAT.armorOrange, D = MAT.darkMetal, Mt = MAT.metal, Ru = MAT.rubber;
  const p = (geo, mat, x, y, z, rx, ry, rz, par = body) => part(par, geo, mat, x, y, z, rx || 0, ry || 0, rz || 0);
  p(B(1.7, 0.18, 3.9, 0.04), D, 0, 0.62, 0);                       // frame
  p(B(2.1, 0.42, 1.5, 0.12), W, 0, 0.92, -1.25);                   // hood
  p(B(2.05, 0.08, 1.2), Bl, 0, 1.15, -1.3);
  p(B(2.2, 0.38, 1.3, 0.1), W, 0, 0.9, 1.35);                      // rear bed
  p(B(0.08, 0.32, 3.6), O, -1.06, 0.9, 0); p(B(0.08, 0.32, 3.6), O, 1.06, 0.9, 0);
  p(B(1.8, 0.1, 0.35), D, 0, 0.6, -2.05); p(B(2.0, 0.14, 0.16), Mt, 0, 0.72, -2.15);  // bumper
  for (const x of [-0.75, 0.75]) { p(B(0.24, 0.12, 0.05), MAT.light, x, 0.95, -2.02); }
  for (const x of [-0.85, 0.85]) p(B(0.16, 0.08, 0.04), MAT.glowAmber, x, 0.95, 2.02);
  for (const x of [-0.45, 0.45]) { p(B(0.55, 0.12, 0.55), Ru, x, 0.88, 0.05); p(B(0.55, 0.6, 0.12), Ru, x, 1.18, 0.33, -0.15); }
  p(B(1.2, 0.3, 0.2), D, 0, 1.05, -0.55); p(B(0.3, 0.05, 0.05), MAT.glowTeal, 0, 1.22, -0.6);    // dashboard
  // roll cage
  const tube = (x1, y1, z1, x2, y2, z2) => {
    const a = new THREE.Vector3(x1, y1, z1), b = new THREE.Vector3(x2, y2, z2), L = a.distanceTo(b);
    const m = p(cyl(0.04, 0.04, L, 8), O, 0, 0, 0); m.position.copy(a).add(b).multiplyScalar(0.5);
    m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize());
  };
  tube(-0.9, 0.95, 0.5, -0.8, 1.95, 0.4); tube(0.9, 0.95, 0.5, 0.8, 1.95, 0.4); tube(-0.8, 1.95, 0.4, 0.8, 1.95, 0.4);
  tube(-0.9, 1.0, -0.6, -0.8, 1.95, 0.4); tube(0.9, 1.0, -0.6, 0.8, 1.95, 0.4);
  p(B(1.4, 0.06, 0.5), MAT.glass, 0, 1.45, -0.65, -0.7);
  // spare tire and storage
  p(cyl(0.38, 0.38, 0.22, 16), Ru, 0, 1.25, 1.75, Math.PI / 2); p(B(0.6, 0.35, 0.5), D, 0.6, 1.25, 1.3);
  // mounted projector (a ranger passenger runs it)
  const turret = new THREE.Group(); turret.position.set(0, 1.45, 1.25); body.add(turret);
  p(B(0.45, 0.32, 0.45), D, 0, 0, 0, 0, 0, 0, turret); p(cyl(0.06, 0.06, 0.9, 10), Mt, 0, 0.08, -0.5, Math.PI / 2, 0, 0, turret);
  p(cyl(0.065, 0.065, 0.05, 10), MAT.glowTeal, 0, 0.08, -0.96, Math.PI / 2, 0, 0, turret);
  // wheels: suspension arm + hub + treaded tire, each in its own group so it can steer and bounce
  const wheels = [];
  const tread = treadedTire(0.55, 0.42);
  for (const [x, z] of [[-1.15, -1.4], [1.15, -1.4], [-1.15, 1.4], [1.15, 1.4]]) {
    const w = new THREE.Group(); w.position.set(x, 0.55, z); g.add(w);
    const spin = new THREE.Group(); w.add(spin);
    const t = new THREE.Mesh(tread, Ru); t.castShadow = true; spin.add(t);
    part(spin, cyl(0.26, 0.26, 0.44, 12), Mt, 0, 0, 0, 0, 0, Math.PI / 2);
    part(spin, cyl(0.1, 0.1, 0.46, 6), D, 0, 0, 0, 0, 0, Math.PI / 2);
    const arm = part(g, B(0.5, 0.1, 0.14), D, x * 0.75, 0.62, z); arm.userData.wheel = w;
    w.userData = { spin, arm, x, z, front: z < 0 };
    wheels.push(w);
  }
  return { g, body, wheels, turret };
}
function treadedTire(r, w) {
  const geo = new THREE.CylinderGeometry(r, r, w, 28, 1);
  geo.rotateZ(Math.PI / 2);
  const pos = geo.attributes.position, v = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {   // alternating raised tread blocks around the tire
    v.fromBufferAttribute(pos, i);
    const a = Math.atan2(v.z, v.y), rr = Math.hypot(v.y, v.z);
    if (rr > r * 0.9) { const k = Math.cos(a * 14) > 0 ? 1.0 : 0.94; v.y *= k; v.z *= k; }
    pos.setXYZ(i, v.x, v.y, v.z);
  }
  geo.computeVertexNormals();
  return geo;
}
