// Hero Clash — builds each fighter as a jointed 3D figure from its "look" data.
// No art files: every costume is assembled from simple shapes, so costumes can
// be recolored and extended in code. Joints are named so anim.js can pose them.
import * as THREE from "../lib/three.module.min.js";

// Alternate costume palettes: [main, secondary, accent, glow] plus extra parts.
// Index 0 is always the fighter's own colors. Costumes never change stats.
export const COSTUMES = {
  titan: [null, { c: [0xd9a520, 0x8a1c1c, 0xfff1b0, 0xffe27a], add: ["pads"] }, { c: [0x1b1f4a, 0x6a3fd0, 0xbfd4ff, 0xa58bff], add: ["halo"] }, { c: [0x16233f, 0xd4a017, 0xfff3b0, 0xfff3b0], add: ["pads", "halo"] }],
  shadow: [null, { c: [0x30362c, 0x596650, 0xc9d1a8, 0x9dff7a], add: ["antenna"] }, { c: [0xdfe3ee, 0x8d93ad, 0x4b4f66, 0x9fd0ff] }, { c: [0x14141a, 0xb8922e, 0xf2d98a, 0xffd36a], add: ["halo"] }],
  velocity: [null, { c: [0x1c3f9c, 0x7fe3ff, 0xffffff, 0x7fe3ff] }, { c: [0x15151c, 0xff3fd0, 0x3fffd0, 0xff6fe0], add: ["pads"] }, { c: [0xf5f5f8, 0xe0b020, 0xd2202c, 0xfff0a0], add: ["halo"] }],
  sentinel: [null, { c: [0x23262d, 0x3b4250, 0x9aa4b8, 0xff4a3a] }, { c: [0x9aa7b5, 0x3c5a78, 0xe8f0f8, 0x9fe8ff], add: ["spikes"] }, { c: [0xf2f2f5, 0xc99a1e, 0x1f8f9c, 0xfff0a0], add: ["halo", "cape"] }],
  thunder: [null, { c: [0x1c3352, 0xb8c4d8, 0x7fd0ff, 0x7fd0ff], add: ["pads"] }, { c: [0x6d7785, 0xd9dee6, 0xf2d24a, 0xffffff], add: ["horns"] }, { c: [0xf0f0f4, 0xc99a1e, 0x2a4f9c, 0xfff0a0], add: ["pads", "halo"] }],
  web: [null, { c: [0x0e0f14, 0x8a4dff, 0xd9d9e6, 0xb48cff] }, { c: [0x101820, 0xff4fa3, 0x4ff0ff, 0xff7fc0] }, { c: [0xf4f4f8, 0xd4a017, 0x26c6a8, 0xfff0a0], add: ["cape", "halo"] }],
  solar: [null, { c: [0xf2a41c, 0xf4f1e6, 0xd9442b, 0xfff0a0], add: ["pads"] }, { c: [0x16141f, 0xd9442b, 0xf2a41c, 0xff7a3a] }, { c: [0xffffff, 0xe8c040, 0xf2a41c, 0xffffff], add: ["pads"] }],
  sage: [null, { c: [0x1c2f6e, 0x8a5fd0, 0xe8c56a, 0x8ab4ff], add: ["pads"] }, { c: [0x101428, 0x3a4f9c, 0xdfe8ff, 0xffffff], add: ["halo"] }, { c: [0xf5f0e6, 0xc99a1e, 0x5b2a86, 0xffe9a0], add: ["halo", "cape"] }],
  frost: [null, { c: [0x16395c, 0x7fd0ff, 0xe8f6ff, 0x7fe8ff], add: ["spikes"] }, { c: [0x2a2d5c, 0x6dffb5, 0xc58cff, 0x9dffd0] }, { c: [0xf4f8ff, 0xc9a23a, 0x2d6fa8, 0xffffff], add: ["cape", "halo"] }],
  wildclaw: [null, { c: [0x1c1c22, 0x3d3d48, 0xd9c27a, 0x7dff9a] }, { c: [0xeef2f5, 0x9aa7b5, 0x3a4a5c, 0xbfe6ff] }, { c: [0xd4a017, 0x3a2a1c, 0xffffff, 0xfff0a0], add: ["cape", "halo"] }],
  archer: [null, { c: [0x23302a, 0x56705c, 0xd9d9d0, 0x9dffb5], add: ["pads"] }, { c: [0x1c2440, 0x4a5f9c, 0xe6ecff, 0xbfd4ff] }, { c: [0xf2f5ee, 0xc99a1e, 0x1e7a4a, 0xfff0a0], add: ["cape", "halo"] }],
  storm: [null, { c: [0x24364f, 0x5f86b8, 0xdfe8f2, 0x7fd0ff], add: ["pads"] }, { c: [0x1a2338, 0x4fe0a0, 0xc58cff, 0x8fffd0] }, { c: [0xffffff, 0xc9a23a, 0x59687d, 0xffffff], add: ["pads"] }],
  ninja: [null, { c: [0x5c1418, 0x1a1a1f, 0xd9b36a, 0xff5a4a] }, { c: [0xf0f0f2, 0xb8bcc8, 0xd04a6a, 0xffc0d0] }, { c: [0x14141a, 0xc99a1e, 0x6c1d8f, 0xffd36a], add: ["cape", "halo"] }],
  overlord: [null, { c: [0x3a3d46, 0x8a1c1c, 0xd9d9e0, 0xff4a3a] }, { c: [0x0b0d1c, 0x1c2f6e, 0x9fb4ff, 0x6f8fff] }, { c: [0x1a1220, 0xd4a017, 0xf2e2a0, 0xffd36a], add: ["halo"] }],
  mecha: [null, { c: [0xc9ced6, 0x6f7785, 0x2a56c8, 0x4fb8ff] }, { c: [0xe0b020, 0x1c1c1f, 0xffffff, 0xffa51f] }, { c: [0x1c1c22, 0xd4a017, 0xff3b2f, 0xffd36a], add: ["cape", "halo"] }],
  inferno: [null, { c: [0x101a2e, 0x2a7fff, 0xbfe6ff, 0x4fa8ff], hair: 0x6fc0ff }, { c: [0x1c1210, 0xff3a1a, 0xffd36a, 0xff5a1a], add: ["spikes"] }, { c: [0xf5f0e6, 0xd4a017, 0xe2511a, 0xfff0a0], add: ["cape", "halo"] }],
  professor: [null, { c: [0x24364f, 0x7f8a99, 0x4ff0ff, 0x4ff0ff], add: ["pads", "antenna"], body: "armor" }, { c: [0x1c3f9c, 0xd4a017, 0xfff1b0, 0x8fd4ff], add: ["orbs", "pads"] }, { c: [0xf5f7fb, 0xd4a017, 0x1f4f9e, 0x8fd4ff], add: ["cape", "pads", "halo"], body: "armor" }],
};

export function lookFor(def, costume) {
  const L = def.look, alt = (COSTUMES[def.id] || [])[costume | 0];
  const look = Object.assign({}, L, { c: Object.assign({}, L.c), extras: L.extras.slice() });
  if (alt) {
    [look.c.main, look.c.sec, look.c.acc, look.c.glow] = alt.c;
    if (alt.hair) look.c.hair = alt.hair;
    if (alt.body) look.body = alt.body;
    for (const e of alt.add || []) if (!look.extras.includes(e)) look.extras.push(e);
  }
  return look;
}

const texCache = new Map();
function emblemTex(kind, color) {
  const key = kind + color; if (texCache.has(key)) return texCache.get(key);
  const cv = document.createElement("canvas"); cv.width = cv.height = 128;
  const g = cv.getContext("2d"); g.translate(64, 64);
  const col = "#" + color.toString(16).padStart(6, "0");
  g.fillStyle = col; g.strokeStyle = col; g.lineWidth = 10; g.lineJoin = "round"; g.lineCap = "round";
  const poly = (pts) => { g.beginPath(); pts.forEach((p, i) => (i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]))); g.closePath(); g.fill(); };
  switch (kind) {
    case "star": { const p = []; for (let i = 0; i < 10; i++) { const r = i % 2 ? 22 : 52, a = -Math.PI / 2 + i * Math.PI / 5; p.push([Math.cos(a) * r, Math.sin(a) * r]); } poly(p); break; }
    case "bolt": poly([[10, -56], [-30, 6], [-4, 6], [-14, 56], [30, -12], [4, -12]]); break;
    case "moon": g.beginPath(); g.arc(0, 0, 46, 0, 7); g.fill(); g.globalCompositeOperation = "destination-out"; g.beginPath(); g.arc(20, -10, 40, 0, 7); g.fill(); break;
    case "ring": g.lineWidth = 16; g.beginPath(); g.arc(0, 0, 38, 0, 7); g.stroke(); g.beginPath(); g.arc(0, 0, 10, 0, 7); g.fill(); break;
    case "diamond": poly([[0, -54], [36, 0], [0, 54], [-36, 0]]); break;
    case "sun": g.beginPath(); g.arc(0, 0, 24, 0, 7); g.fill(); for (let i = 0; i < 8; i++) { g.rotate(Math.PI / 4); g.beginPath(); g.moveTo(0, -34); g.lineTo(0, -54); g.stroke(); } break;
    case "eye": g.beginPath(); g.moveTo(-54, 0); g.quadraticCurveTo(0, -44, 54, 0); g.quadraticCurveTo(0, 44, -54, 0); g.stroke(); g.beginPath(); g.arc(0, 0, 14, 0, 7); g.fill(); break;
    case "snow": g.lineWidth = 8; for (let i = 0; i < 6; i++) { g.rotate(Math.PI / 3); g.beginPath(); g.moveTo(0, 0); g.lineTo(0, -52); g.moveTo(0, -32); g.lineTo(-12, -44); g.moveTo(0, -32); g.lineTo(12, -44); g.stroke(); } break;
    case "claw": g.lineWidth = 12; for (const x of [-28, 0, 28]) { g.beginPath(); g.moveTo(x - 10, -48); g.quadraticCurveTo(x + 14, 0, x - 6, 48); g.stroke(); } break;
    case "arrow": poly([[0, -56], [30, -14], [10, -14], [10, 54], [-10, 54], [-10, -14], [-30, -14]]); break;
    case "cloud": for (const [x, y, r] of [[-26, 10, 24], [4, -8, 30], [32, 12, 20]]) { g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); } g.fillRect(-26, 10, 58, 24); break;
    case "void": g.lineWidth = 9; for (let i = 0; i < 3; i++) { g.beginPath(); g.arc(0, 0, 18 + i * 15, i * 1.3, i * 1.3 + 4.4); g.stroke(); } break;
    case "gear": g.beginPath(); g.arc(0, 0, 34, 0, 7); g.fill(); for (let i = 0; i < 8; i++) { g.rotate(Math.PI / 4); g.fillRect(-9, -54, 18, 24); } g.globalCompositeOperation = "destination-out"; g.beginPath(); g.arc(0, 0, 13, 0, 7); g.fill(); break;
    case "flame": g.beginPath(); g.moveTo(0, -56); g.bezierCurveTo(44, -10, 40, 52, 0, 54); g.bezierCurveTo(-40, 52, -34, 6, -12, -10); g.bezierCurveTo(-10, 8, 4, 8, 0, -56); g.fill(); break;
    case "sigma": g.font = "bold 110px Georgia, serif"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText("Σ", 0, 6); break;
  }
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; texCache.set(key, t); return t;
}

// Shared geometry so 2 fighters + previews stay light on memory
const G = {};
const geo = (key, make) => G[key] || (G[key] = make());
const cap = (r, len) => geo(`cap${r.toFixed(3)}_${len.toFixed(3)}`, () => new THREE.CapsuleGeometry(r, len, 3, 10));
const box = (w, h, d) => geo(`box${w.toFixed(3)}_${h.toFixed(3)}_${d.toFixed(3)}`, () => new THREE.BoxGeometry(w, h, d));
const sph = (r) => geo(`sph${r.toFixed(3)}`, () => new THREE.SphereGeometry(r, 16, 12));
const cyl = (a, b, h, n = 12) => geo(`cyl${a.toFixed(3)}_${b.toFixed(3)}_${h.toFixed(3)}_${n}`, () => new THREE.CylinderGeometry(a, b, h, n));
const cone = (r, h, n = 8) => geo(`cone${r.toFixed(3)}_${h.toFixed(3)}_${n}`, () => new THREE.ConeGeometry(r, h, n));

// Returns { root, joints, mats, glowMats, extras, height, dispose() }
export function buildFighter(def, costume = 0, opts = {}) {
  const L = lookFor(def, costume), c = L.c, H = L.h, B = L.bulk, SH = L.sh;
  const has = (e) => L.extras.includes(e);
  const armor = L.body === "armor", robot = L.body === "robot", robe = L.body === "robe";
  const mats = [];
  const M = (color, o = {}) => { const m = new THREE.MeshStandardMaterial(Object.assign({ color, roughness: robot ? 0.38 : armor ? 0.45 : 0.62, metalness: robot ? 0.65 : armor ? 0.5 : 0.08 }, o)); mats.push(m); return m; };
  const mMain = M(c.main), mSec = M(c.sec), mAcc = M(c.acc, { metalness: 0.55, roughness: 0.35 });
  const mSkin = M(c.skin, { roughness: 0.7, metalness: robot ? 0.6 : 0 }), mHair = M(c.hair, { roughness: 0.8, metalness: 0 });
  const mDark = M(0x15161c, { roughness: 0.6, metalness: 0.2 });
  const mGlow = new THREE.MeshBasicMaterial({ color: c.glow }); mats.push(mGlow);
  const mGlowSoft = new THREE.MeshBasicMaterial({ color: c.glow, transparent: true, opacity: 0.45, depthWrite: false, side: THREE.DoubleSide }); mats.push(mGlowSoft);
  const mWhite = new THREE.MeshBasicMaterial({ color: 0xffffff }); mats.push(mWhite);

  const J = {};
  const grp = (name, parent, x = 0, y = 0, z = 0) => { const g = new THREE.Group(); g.position.set(x, y, z); parent.add(g); J[name] = g; return g; };
  const mesh = (g, mat, parent, x = 0, y = 0, z = 0, sx = 1, sy = 1, sz = 1) => { const m = new THREE.Mesh(g, mat); m.position.set(x, y, z); m.scale.set(sx, sy, sz); parent.add(m); return m; };

  const root = new THREE.Group();
  const flip = grp("flip", root);              // mirrored left/right by the renderer
  const body = grp("body", flip);              // turned to face the opponent, lifted for jumps/flips
  const TH = 0.45 * H, SHN = 0.43 * H, hipY = TH + SHN + 0.07 * H;
  const hips = grp("hips", body, 0, hipY, 0);
  const lr = 0.075 * B, ar = 0.058 * B;

  // ---- torso ----
  const waistW = 0.15 * (0.7 + 0.3 * B), chestW = 0.185 * SH;
  if (robot) {
    mesh(box(waistW * 2.1, 0.2 * H, 0.22 * B), mSec, hips, 0, 0.05 * H, 0);
    const spine = grp("spine", hips, 0, 0.12 * H, 0);
    mesh(box(waistW * 1.7, 0.16 * H, 0.18 * B), mDark, spine, 0, 0.07 * H, 0);
    const chest = grp("chest", spine, 0, 0.16 * H, 0);
    mesh(box(chestW * 2.5, 0.34 * H, 0.3 * B), mMain, chest, 0, 0.17 * H, 0);
    mesh(box(chestW * 1.5, 0.14 * H, 0.06), mSec, chest, 0, 0.2 * H, 0.15 * B);
  } else {
    mesh(cyl(waistW * 1.05, waistW * 0.95, 0.17 * H), robe ? mMain : mSec, hips, 0, 0.03 * H, 0, 1, 1, 0.68);
    const spine = grp("spine", hips, 0, 0.1 * H, 0);
    mesh(cyl(waistW * 1.1, waistW, 0.2 * H), mMain, spine, 0, 0.08 * H, 0, 1, 1, 0.66);
    const chest = grp("chest", spine, 0, 0.17 * H, 0);
    mesh(cyl(chestW * 1.22, waistW * 1.12, 0.3 * H), mMain, chest, 0, 0.14 * H, 0, 1, 1, 0.6 + 0.08 * B);
    mesh(sph(0.1), mMain, chest, 0, 0.27 * H, 0, chestW * 12, 0.9, 1.25 * B);     // shoulders cap
    if (armor) { mesh(box(chestW * 2.0, 0.17 * H, 0.08), mSec, chest, 0, 0.2 * H, 0.105 * B); mesh(box(chestW * 1.3, 0.1 * H, 0.07), mSec, chest, 0, 0.07 * H, 0.1 * B); }
  }
  const spine = J.spine, chest = J.chest;
  if (L.emblem && L.emblem !== "none") {
    const e = new THREE.Mesh(geo("embl", () => new THREE.PlaneGeometry(0.16, 0.16)), new THREE.MeshBasicMaterial({ map: emblemTex(L.emblem, robot || armor ? c.glow : c.acc), transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 }));
    mats.push(e.material); e.position.set(0, 0.19 * H, robot ? 0.15 * B + 0.034 : armor ? Math.max(0.105 * B + 0.043, chestW * 1.1 * (0.6 + 0.08 * B)) : chestW * 1.13 * (0.6 + 0.08 * B) + 0.004); e.scale.setScalar(H * (0.8 + 0.2 * SH)); chest.add(e);
  }
  if (has("belt")) { mesh(cyl(waistW * 1.12, waistW * 1.12, 0.045 * H), mAcc, hips, 0, 0.1 * H, 0, 1, 1, 0.7); mesh(box(0.06, 0.055 * H, 0.03), mGlow, hips, 0, 0.1 * H, waistW * 0.78); }
  if (has("sash")) mesh(box(waistW * 2.2, 0.05 * H, 0.2), mSec, hips, 0, 0.09 * H, 0);
  if (has("pipes")) for (const s of [-1, 1]) mesh(cyl(0.035, 0.035, 0.3 * H, 8), mAcc, chest, s * chestW * 0.8, 0.26 * H, -0.16 * B, 1, 1, 1).rotation.x = 0.4;

  // ---- head ----
  const neck = grp("neck", chest, 0, 0.32 * H, 0);
  mesh(cyl(0.05 * B, 0.058 * B, 0.07), L.mask === "none" || L.mask === "domino" ? mSkin : mMain, neck, 0, 0.02, 0);
  const head = grp("head", neck, 0, 0.065, 0);
  const hr = 0.142 * (L.head || 1) * (0.92 + 0.08 * H);
  const hc = hr * 0.95; // head center height above joint
  if (L.mask === "bot") {
    mesh(box(hr * 1.9, hr * 1.9, hr * 2.0), mMain, head, 0, hc, 0);
    mesh(box(hr * 1.5, hr * 0.34, 0.02), mGlow, head, 0, hc + hr * 0.15, hr * 1.0);
    mesh(box(hr * 2.0, hr * 0.5, hr * 1.3), mSec, head, 0, hc - hr * 0.75, 0.01);
  } else {
    mesh(sph(hr), L.mask === "full" || L.mask === "helm" || L.mask === "ninja" || L.mask === "crown" ? mMain : mSkin, head, 0, hc, 0, 0.92, 1.08, 1.0);
    const eyeY = hc + hr * 0.1, eyeZ = hr * 0.9, ex = hr * 0.4;
    const lens = (mat, w, h) => { for (const s of [-1, 1]) { const m = mesh(sph(0.02), mat, head, s * ex, eyeY, eyeZ, w, h, 0.35); m.rotation.z = -s * 0.25; } };
    if (L.mask === "none" || L.mask === "domino" || L.mask === "cowl" || L.mask === "ninja") {
      if (L.mask === "domino") mesh(box(hr * 1.75, hr * 0.42, 0.03), mSec, head, 0, eyeY, eyeZ - 0.012).geometry;
      if (L.mask === "cowl") { mesh(sph(hr * 1.04), mMain, head, 0, hc + hr * 0.14, -hr * 0.04, 0.95, 1.0, 1.02); lens(mWhite, 1.3, 0.75); }
      else if (L.mask === "ninja") { mesh(box(hr * 1.5, hr * 0.36, 0.02), mSkin, head, 0, eyeY, eyeZ - 0.004); lens(mDark, 0.9, 0.7); }
      else if (L.mask === "domino") lens(mWhite, 1.25, 0.7);
      else { lens(mWhite, 1.05, 0.8); for (const s of [-1, 1]) { mesh(sph(0.011), mDark, head, s * ex, eyeY, eyeZ + 0.007, 1, 1, 0.5); mesh(box(0.05, 0.012, 0.012), mHair, head, s * ex, eyeY + 0.04, eyeZ + 0.002).rotation.z = -s * 0.18; } }
      if (L.mask !== "ninja") mesh(box(0.045, 0.008, 0.01), mDark, head, 0, hc - hr * 0.48, eyeZ - 0.014);
    } else if (L.mask === "full") lens(mWhite, 1.6, 1.0);
    else if (L.mask === "helm") { mesh(box(hr * 1.5, hr * 0.2, 0.02), mGlow, head, 0, eyeY, eyeZ + 0.004); mesh(box(0.03, hr * 1.2, hr * 1.6), mSec, head, 0, hc + hr * 0.75, -0.01); for (const s of [-1, 1]) mesh(cone(0.028, 0.12, 4), mSec, head, s * hr * 0.7, hc + hr * 1.05, 0); }
    else if (L.mask === "visor") { mesh(box(hr * 1.7, hr * 0.32, 0.03), mGlow, head, 0, eyeY, eyeZ - 0.004); }
    else if (L.mask === "crown") { lens(mGlow, 1.3, 0.6); for (let i = 0; i < 5; i++) { const a = (i - 2) * 0.5; mesh(cone(0.024, 0.13 + (i === 2 ? 0.06 : 0), 4), mAcc, head, Math.sin(a) * hr * 0.9, hc + hr * 1.0, Math.cos(a) * hr * 0.6 - 0.02); } mesh(cyl(hr * 0.97, hr * 0.97, 0.035, 14), mAcc, head, 0, hc + hr * 0.62, 0); }
    // hair
    const hy = hc + hr * 0.42;
    if (L.hair === "short") mesh(sph(hr * 1.03), mHair, head, 0, hy, -hr * 0.12, 0.96, 0.82, 1.0);
    if (L.hair === "long" || L.hair === "longf" || L.hair === "pony" || L.hair === "bun" || L.hair === "wild") {
      mesh(sph(hr * 1.05), mHair, head, 0, hy, -hr * 0.14, 0.98, 0.85, 1.02);
      if (L.hair === "long") mesh(box(hr * 1.7, hr * 2.0, hr * 0.6), mHair, head, 0, hc - hr * 0.7, -hr * 0.75);
      if (L.hair === "longf") { const hb = grp("hairBack", head, 0, hc, -hr * 0.8); mesh(box(hr * 1.6, hr * 3.0, hr * 0.5), mHair, hb, 0, -hr * 1.4, 0); }
      if (L.hair === "pony") { const hb = grp("hairBack", head, 0, hc + hr * 0.5, -hr * 0.95); mesh(cap(0.035, 0.26), mHair, hb, 0, -0.16, -0.03).rotation.x = 0.3; }
      if (L.hair === "bun") mesh(sph(hr * 0.5), mHair, head, 0, hc + hr * 1.05, -hr * 0.45);
      if (L.hair === "wild") for (let i = 0; i < 7; i++) { const a = (i / 7) * Math.PI * 2; mesh(cone(0.04, 0.16, 5), mHair, head, Math.sin(a) * hr * 0.9, hy + 0.01, -hr * 0.2 + Math.cos(a) * hr * 0.9).rotation.set(Math.cos(a) * 1.1, 0, -Math.sin(a) * 1.1); }
    }
    if (L.hair === "spiky") for (let i = 0; i < 6; i++) mesh(cone(0.04, 0.15, 5), mHair, head, (i - 2.5) * hr * 0.33, hc + hr * 0.95, -hr * 0.1 + (i % 2) * 0.03).rotation.z = -(i - 2.5) * 0.22;
    if (L.hair === "flame") { const fl = grp("flameHair", head, 0, hc + hr * 0.7, -0.01); for (let i = 0; i < 5; i++) { const m = mesh(cone(0.05, 0.2 + (i === 2 ? 0.1 : 0), 6), i % 2 ? mGlow : mHair, fl, (i - 2) * hr * 0.4, 0.09, (i % 2) * 0.03); m.rotation.z = -(i - 2) * 0.2; } mHair.emissive = new THREE.Color(c.hair); mHair.emissiveIntensity = 0.9; }
    if (has("beard")) { mesh(sph(hr * 0.86), mHair, head, 0, hc - hr * 0.42, hr * 0.2, 0.98, 0.72, 0.98); }
    if (has("glasses")) { for (const s of [-1, 1]) { const r = new THREE.Mesh(geo("glassr", () => new THREE.TorusGeometry(0.03, 0.006, 6, 14)), mDark); r.position.set(s * ex, eyeY, eyeZ + 0.012); head.add(r); } mesh(box(0.03, 0.006, 0.006), mDark, head, 0, eyeY, eyeZ + 0.012); }
    if (has("ears")) for (const s of [-1, 1]) mesh(cone(0.04, 0.1, 4), mSec, head, s * hr * 0.6, hc + hr * 1.05, -0.01);
    if (has("horns")) for (const s of [-1, 1]) { const m = mesh(cone(0.03, 0.2, 6), mAcc, head, s * hr * 0.95, hc + hr * 0.8, 0); m.rotation.z = -s * 0.7; }
    if (has("fins")) for (const s of [-1, 1]) { const m = mesh(box(0.012, 0.05, 0.13), mSec, head, s * hr * 0.93, hc + hr * 0.25, -0.03); m.rotation.x = -0.5; }
    if (has("hood")) { mesh(sph(hr * 1.16), mSec, head, 0, hc + hr * 0.12, -hr * 0.2, 1, 1.02, 1.02); mesh(cone(hr * 0.6, hr * 0.9, 6), mSec, head, 0, hc + hr * 0.2, -hr * 1.25).rotation.x = -1.9; }
  }
  if (has("antenna")) { mesh(cyl(0.006, 0.006, 0.14, 5), mAcc, head, hr * 0.7, hc + hr * 1.3, -0.02); mesh(sph(0.016), mGlow, head, hr * 0.7, hc + hr * 1.3 + 0.08, -0.02); }
  if (has("halo")) { const h = new THREE.Mesh(geo("halo", () => new THREE.TorusGeometry(0.2, 0.012, 6, 28)), mGlow); h.position.set(0, hc + hr * 0.3, -hr * 1.3); head.add(h); J.halo = h; }
  if (has("collar")) { const m = mesh(cyl(0.13 * SH, 0.11 * SH, 0.12, 10), mSec, chest, 0, 0.34 * H, -0.035); m.scale.z = 0.8; }
  if (has("furcollar")) mesh(sph(0.1), mAcc, chest, 0, 0.3 * H, -0.01, chestW * 11, 0.7, 1.5);

  // ---- arms ----
  const UA = 0.29 * H, FA = 0.26 * H;
  for (const [s, n] of [[1, "l"], [-1, "r"]]) {
    const sh = grp(n + "Arm", chest, s * (chestW * 1.18), 0.265 * H, 0);
    if (robot) { mesh(box(ar * 2.3, UA, ar * 2.3), mSec, sh, 0, -UA / 2, 0); mesh(sph(ar * 1.5), mDark, sh, 0, 0, 0); }
    else { mesh(cap(ar * 1.1, UA - ar * 2), armor ? mSec : mMain, sh, 0, -UA / 2, 0); }
    if (has("pads")) { const p = mesh(sph(0.1), mAcc, sh, s * 0.02, 0.03, 0, 1.15 * B, 0.7, 1.25 * B); p.rotation.z = -s * 0.3; }
    if (has("spikes")) { const m = mesh(cone(0.035, 0.15, 5), mAcc, sh, s * 0.05, 0.1, 0); m.rotation.z = -s * 0.6; }
    if (has("crystals")) for (let i = 0; i < 2; i++) { const m = mesh(cone(0.04, 0.2 - i * 0.06, 4), mGlowSoft, sh, s * (0.03 + i * 0.06), 0.1, -0.03 * i); m.rotation.z = -s * (0.3 + i * 0.5); }
    const el = grp(n + "Elbow", sh, 0, -UA, 0);
    if (!robot) mesh(sph(ar * 1.12), armor ? mAcc : mMain, el, 0, 0, 0);
    const big = has("gaunt") ? 1.45 : 1;
    if (robot) mesh(box(ar * 2.6 * big * 0.85, FA, ar * 2.6 * big * 0.85), mMain, el, 0, -FA / 2, 0);
    else mesh(cap(ar * (has("gaunt") ? 1.35 : 0.95), FA - ar * 2), has("gaunt") || has("bracers") ? mSec : (L.mask === "none" && !armor && !robe && !has("coat") && L.body === "suit" && false ? mSkin : mMain), el, 0, -FA / 2, 0);
    if (has("bracers")) mesh(cyl(ar * 1.25, ar * 1.15, FA * 0.55, 10), mAcc, el, 0, -FA * 0.6, 0);
    if (has("gaunt")) mesh(cyl(ar * 1.6, ar * 1.5, 0.03, 10), mGlow, el, 0, -FA * 0.35, 0);
    const hand = grp(n + "Hand", el, 0, -FA, 0);
    mesh(sph(ar * (has("gaunt") ? 1.5 : 1.15)), has("gaunt") ? mSec : robot || armor || L.mask === "full" || L.mask === "ninja" ? mDark : (c.glove !== undefined ? M(c.glove) : mSec), hand, 0, -0.03, 0, 1, 1.15, 1);
    if (has("claws")) for (let i = -1; i <= 1; i++) { const m = mesh(cone(0.012, 0.13, 4), mGlow, hand, i * 0.025, -0.11, 0.02); m.rotation.x = Math.PI; }
    if (has("bow") && n === "l") {
      const bow = new THREE.Mesh(geo("bow", () => new THREE.TorusGeometry(0.34, 0.014, 6, 16, Math.PI * 0.9)), mAcc); bow.rotation.set(0, Math.PI / 2, -Math.PI * 0.45 + Math.PI / 2); bow.position.set(0, -0.03, 0.02); hand.add(bow);
      mesh(cyl(0.003, 0.003, 0.66, 4), mGlow, hand, 0, -0.03, -0.045).rotation.x = Math.PI / 2 + Math.PI / 2;
      J.bow = bow;
    }
  }
  // ---- legs ----
  const hipW = waistW * 0.62;
  for (const [s, n] of [[1, "l"], [-1, "r"]]) {
    const th = grp(n + "Leg", hips, s * hipW, 0, 0);
    if (robot) mesh(box(lr * 2.4, TH, lr * 2.4), mSec, th, 0, -TH / 2, 0);
    else mesh(cap(lr * 1.12, TH - lr * 2), robe ? mMain : armor ? mSec : mMain, th, 0, -TH / 2, 0);
    const kn = grp(n + "Knee", th, 0, -TH, 0);
    if (robot) { mesh(box(lr * 2.7, SHN, lr * 2.7), mMain, kn, 0, -SHN / 2, 0); mesh(sph(lr * 1.3), mDark, kn, 0, 0, 0); }
    else { mesh(sph(lr * 1.12), armor ? mAcc : robe ? mSec : mMain, kn, 0, 0, 0); mesh(cap(lr * 0.95, SHN - lr * 2), mSec, kn, 0, -SHN / 2, 0); if (armor) mesh(box(lr * 1.7, SHN * 0.5, lr * 1.2), mAcc, kn, 0, -SHN * 0.35, lr * 0.55); }
    const ft = grp(n + "Foot", kn, 0, -SHN, 0);
    if (robot) mesh(box(lr * 2.6, 0.085 * H, 0.26 * H), mDark, ft, 0, -0.03 * H, 0.05 * H);
    else { const fm = mesh(cap(lr * 0.9, 0.12 * H), mSec, ft, 0, -0.035 * H, 0.06 * H, 1, 1, 0.62); fm.rotation.x = Math.PI / 2; mesh(sph(lr * 1.0), mSec, ft, 0, 0, 0); }
  }
  if (robe || has("coat")) { // long skirt / coat tails that hang from the hips
    const n = robe ? 8 : 5, r0 = waistW * 1.15, len = robe ? 0.62 * H : 0.5 * H;
    const tails = grp("tails", hips, 0, 0.06 * H, 0);
    for (let i = 0; i < n; i++) {
      const a = robe ? (i / n) * Math.PI * 2 : Math.PI + (i - (n - 1) / 2) * 0.55;
      const t = new THREE.Group(); t.position.set(Math.sin(a) * r0, 0, Math.cos(a) * r0 * 0.7); t.rotation.y = a; tails.add(t);
      mesh(box(r0 * (robe ? 0.82 : 0.6), len, 0.018), robe ? mMain : mSec, t, 0, -len / 2, 0); t.userData.a = a;
    }
    if (has("coat")) { mesh(box(chestW * 2.5, 0.3 * H, 0.03), mSec, chest, 0, 0.13 * H, -0.085 * B - 0.02); for (const s of [-1, 1]) mesh(box(chestW * 0.75, 0.33 * H, 0.03), mSec, chest, s * chestW * 0.93, 0.13 * H, 0.1 * B).rotation.y = s * 0.5; }
  }
  // ---- back attachments ----
  if (has("cape")) {
    const cp = grp("cape", chest, 0, 0.3 * H, -0.1 * B - 0.02);
    const cm = M(costume === 3 ? c.acc : c.sec, { side: THREE.DoubleSide, roughness: 0.8, metalness: 0 });
    const w = chestW * 2.3, len = 0.52 * H;
    const upper = mesh(box(w, len, 0.015), cm, cp, 0, -len / 2, 0); upper.geometry;
    const c2 = grp("cape2", cp, 0, -len, 0); mesh(box(w * 1.14, len * 0.5, 0.015), cm, c2, 0, -len * 0.25, 0); const c3 = grp("cape3", c2, 0, -len * 0.5, 0); mesh(box(w * 1.26, len * 0.45, 0.015), cm, c3, 0, -len * 0.22, 0);
  }
  if (has("scarf")) { const sc = grp("scarf", chest, 0, 0.33 * H, -0.08); mesh(box(0.07, 0.4, 0.012), mGlow === null ? mSec : M(c.glow, { roughness: 0.8, metalness: 0, emissive: c.glow, emissiveIntensity: 0.35 }), sc, 0.03, -0.2, 0); mesh(cyl(0.075 * B, 0.07 * B, 0.05, 10), mats[mats.length - 1], chest, 0, 0.335 * H, 0); }
  if (has("jet")) { mesh(box(chestW * 1.5, 0.26 * H, 0.1), mSec, chest, 0, 0.16 * H, -0.2 * B); for (const s of [-1, 1]) mesh(cyl(0.035, 0.045, 0.08, 8), mGlow, chest, s * chestW * 0.5, 0.02 * H, -0.2 * B); }
  if (has("quiver")) { const q = mesh(cyl(0.05, 0.04, 0.42, 8), mSec, chest, -0.06, 0.2 * H, -0.14); q.rotation.z = 0.35; for (let i = 0; i < 3; i++) mesh(cyl(0.006, 0.006, 0.16, 4), mGlow, chest, -0.13 + i * 0.022, 0.42 * H, -0.14 + i * 0.01).rotation.z = 0.35; }
  if (has("blade")) { const b = mesh(box(0.03, 0.62, 0.012), mAcc, chest, 0, 0.14 * H, -0.13); b.rotation.z = -0.6; }
  if (has("tail")) { const t = grp("tail", hips, 0, 0.03, -0.1); mesh(cap(0.025, 0.42), mMain, t, 0, -0.1, -0.2).rotation.x = 1.0; }
  // ---- floating bits ----
  const orbit = new THREE.Group(); body.add(orbit); J.orbit = orbit; orbit.position.y = hipY + 0.2;
  if (has("orbs")) for (let i = 0; i < 3; i++) { const o = mesh(sph(0.035), mGlow, orbit, Math.cos(i * 2.09) * 0.42, 0.25 + i * 0.1, Math.sin(i * 2.09) * 0.42); o.userData.orb = i; }
  if (has("symbols") && !opts.simple) {
    for (const [i, ch] of ["π", "∑", "x²"].entries()) {
      const cv = document.createElement("canvas"); cv.width = cv.height = 64; const g = cv.getContext("2d");
      g.font = "bold 44px Georgia, serif"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillStyle = "#" + c.glow.toString(16).padStart(6, "0"); g.fillText(ch, 32, 34);
      const sm = new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(cv), transparent: true, opacity: 0.75, depthWrite: false }); mats.push(sm);
      const spn = new THREE.Sprite(sm); spn.scale.setScalar(0.16); spn.position.set(Math.cos(i * 2.09) * 0.5, 0.5 + i * 0.12, Math.sin(i * 2.09) * 0.5); spn.userData.orb = i; orbit.add(spn);
    }
  }
  root.traverse((o) => { if (o.isMesh) o.frustumCulled = false; });

  return {
    root, joints: J, mats, glow: mGlow, look: L, height: 1.8 * H, hipY,
    dispose() { for (const m of mats) { if (m.map && !texCache.has(m.map)) { /* shared emblem textures stay cached */ } m.dispose(); } },
  };
}

export function hexCss(n) { return "#" + n.toString(16).padStart(6, "0"); }
