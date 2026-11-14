// Turbo League — the car bodies, all built entirely in code (original designs).
// Each body is a smooth "loft": a cross-section shape swept from the tail to the nose, with its
// width/height following hand-tuned curves. Wheel arches are pressed into the sides, and the cabin is a
// second loft split into paint (roof, pillars) and glass (windows).
//
// FAIR PLAY: every body uses the SAME physics hitbox, wheel positions, mass and handling (config.js CAR).
// Only the drawing changes. Bodies are kept within a few centimetres of the same overall size so what
// you see matches what you hit (see FEATURES.md, "Hitboxes").
// Car space matches the physics: +z = forward, +x = left, +y = up, origin = hitbox center.
import * as THREE from "../lib/three.module.min.js";
import { CAR } from "./config.js";

const smooth = (pts) => (z) => { // smooth curve through [z, value] points (Hermite / Catmull-Rom style)
  if (z <= pts[0][0]) return pts[0][1];
  for (let i = 1; i < pts.length; i++) if (z <= pts[i][0]) {
    const [z0, a] = pts[i - 1], [z1, b] = pts[i];
    const m0 = i > 1 ? (b - pts[i - 2][1]) / (z1 - pts[i - 2][0]) : (b - a) / (z1 - z0);
    const m1 = i < pts.length - 1 ? (pts[i + 1][1] - a) / (pts[i + 1][0] - z0) : (b - a) / (z1 - z0);
    const t = (z - z0) / (z1 - z0), h = z1 - z0, t2 = t * t, t3 = t2 * t;
    return (2 * t3 - 3 * t2 + 1) * a + (t3 - 2 * t2 + t) * h * m0 + (-2 * t3 + 3 * t2) * b + (t3 - t2) * h * m1;
  }
  return pts[pts.length - 1][1];
};
const spow = (v, p) => Math.sign(v) * Math.pow(Math.abs(v), p);
const clamp01 = (v) => Math.min(1, Math.max(0, v));

// ---------------------------------------------------------------------------------------------
// BODY DESIGNS. Numbers are metres in car space. top/bot = upper/lower edge of the body along its
// length, halfw = half width, dip = how far the hood/deck sits below the fenders (negative = bulge).
// cabin.roof = height of the roof line; glass = which parts of the cabin are windows.
// ---------------------------------------------------------------------------------------------
export const BODIES = {
  striker: { name: "Striker", z0: -0.69, z1: 0.735,
    top: [[-0.69, 0.02], [-0.635, 0.1], [-0.56, 0.13], [-0.42, 0.148], [-0.3, 0.13], [-0.18, 0.112], [0.05, 0.104], [0.25, 0.112], [0.42, 0.128], [0.53, 0.105], [0.62, 0.035], [0.67, -0.04], [0.735, -0.1]],
    dip: [[-0.69, 0.0], [-0.6, 0.02], [-0.45, 0.04], [-0.32, 0.03], [-0.2, 0.0], [0.2, 0.0], [0.32, 0.035], [0.45, 0.05], [0.58, 0.035], [0.735, 0.0]],
    bot: [[-0.69, -0.19], [-0.62, -0.255], [-0.47, -0.272], [0.52, -0.272], [0.66, -0.25], [0.735, -0.2]],
    halfw: [[-0.69, 0.39], [-0.62, 0.45], [-0.5, 0.478], [-0.4, 0.486], [-0.27, 0.46], [-0.1, 0.432], [0.12, 0.432], [0.3, 0.452], [0.43, 0.47], [0.57, 0.452], [0.66, 0.405], [0.735, 0.3]],
    scoop: 0.055, crease: 0.018,
    cabin: { z0: -0.4, z1: 0.31, wt: 0.255, roof: [[-0.4, 0.0], [-0.33, 0.13], [-0.22, 0.175], [-0.08, 0.212], [0.0, 0.222], [0.08, 0.212], [0.17, 0.168], [0.25, 0.13], [0.31, 0.0]], glass: { side: [-0.27, 0.2], pillar: [-0.075, -0.05], front: 0.115, rear: -0.2 } },
    head: "capsule", tail: { y: 0.055, w: 0.76, z: -0.677 }, nozzle: [-0.095, -0.685], spoiler: "wing", exhaust: [0.2, -0.2] },
  sprite: { name: "Sprite", z0: -0.6, z1: 0.645,
    top: [[-0.6, 0.04], [-0.56, 0.13], [-0.47, 0.16], [-0.3, 0.165], [0.0, 0.155], [0.22, 0.14], [0.42, 0.11], [0.54, 0.075], [0.61, 0.0], [0.645, -0.07]],
    dip: [[-0.6, 0], [0.15, 0], [0.3, 0.015], [0.45, 0.022], [0.645, 0]],
    bot: [[-0.6, -0.19], [-0.53, -0.262], [0.5, -0.262], [0.6, -0.24], [0.645, -0.19]],
    halfw: [[-0.6, 0.39], [-0.53, 0.45], [-0.4, 0.468], [-0.25, 0.452], [0.0, 0.44], [0.3, 0.452], [0.45, 0.46], [0.56, 0.432], [0.62, 0.38], [0.645, 0.3]],
    nUp: 2.7, scoop: 0.03, crease: 0.02, fz: 0.0, rz: 0.0,
    cabin: { z0: -0.52, z1: 0.31, wt: 0.31, roof: [[-0.52, 0.0], [-0.49, 0.24], [-0.42, 0.295], [-0.25, 0.312], [0.0, 0.31], [0.12, 0.29], [0.22, 0.225], [0.31, 0.0]], glass: { side: [-0.44, 0.2], pillar: [-0.15, -0.12], front: 0.13, rear: -0.42 } },
    head: "round", headX: 0.66, tail: { y: 0.09, w: 0.0, z: -0.592, pair: 0.33, h: 0.1 }, nozzle: [-0.1, -0.595], spoiler: "roof", exhaust: [-0.25, -0.21] },
  hammer: { name: "Hammerhead", z0: -0.72, z1: 0.765,
    top: [[-0.72, 0.0], [-0.69, 0.11], [-0.62, 0.142], [-0.45, 0.152], [-0.3, 0.142], [0.0, 0.13], [0.3, 0.12], [0.62, 0.11], [0.71, 0.07], [0.745, 0.0], [0.765, -0.07]],
    dip: [[-0.72, 0], [-0.55, 0.0], [0.05, 0], [0.18, -0.03], [0.45, -0.036], [0.65, -0.02], [0.765, 0]],
    bot: [[-0.72, -0.17], [-0.665, -0.255], [0.67, -0.255], [0.745, -0.215], [0.765, -0.17]],
    halfw: [[-0.72, 0.4], [-0.665, 0.468], [-0.5, 0.492], [-0.35, 0.482], [-0.15, 0.455], [0.2, 0.448], [0.5, 0.458], [0.68, 0.448], [0.74, 0.42], [0.765, 0.36]],
    nUp: 3.6, nLow: 4.2, tumble: 0.05, scoop: 0, crease: 0.03, fz: 0.06, rz: -0.05,
    cabin: { z0: -0.52, z1: 0.13, wt: 0.27, roof: [[-0.52, 0.0], [-0.46, 0.19], [-0.33, 0.25], [-0.15, 0.264], [-0.02, 0.256], [0.07, 0.21], [0.13, 0.0]], glass: { side: [-0.41, 0.07], pillar: [-0.2, -0.17], front: 0.0, rear: -0.4 } },
    head: "round", headX: 0.7, headDY: 0.0, tail: { y: 0.065, w: 0.0, z: -0.712, pair: 0.3, h: 0.04, wide: 0.2 }, nozzle: [-0.1, -0.715], spoiler: "ducktail", exhaust: [0.3, -0.21], hoodScoop: true },
  trail: { name: "Trailblazer", z0: -0.67, z1: 0.705,
    top: [[-0.67, 0.05], [-0.635, 0.152], [-0.52, 0.172], [-0.3, 0.172], [0.0, 0.166], [0.3, 0.16], [0.55, 0.15], [0.655, 0.1], [0.705, 0.0]],
    dip: [[-0.67, 0], [0.705, 0]],
    bot: [[-0.67, -0.12], [-0.6, -0.2], [0.6, -0.2], [0.68, -0.15], [0.705, -0.1]],
    halfw: [[-0.67, 0.4], [-0.61, 0.452], [-0.4, 0.462], [0.0, 0.452], [0.4, 0.462], [0.6, 0.452], [0.68, 0.41], [0.705, 0.35]],
    nUp: 3.4, nLow: 4, tumble: 0.05, scoop: 0, crease: 0.012, wheelR: 0.225, wheelX: 0.43, fz: 0.0, rz: -0.02,
    cabin: { z0: -0.52, z1: 0.26, wt: 0.34, roof: [[-0.52, 0.0], [-0.5, 0.27], [-0.43, 0.315], [0.0, 0.32], [0.1, 0.315], [0.19, 0.275], [0.26, 0.0]], glass: { side: [-0.46, 0.17], pillar: [-0.17, -0.14], front: 0.13, rear: -0.47 } },
    head: "round", headX: 0.62, tail: { y: 0.09, w: 0.0, z: -0.662, pair: 0.36, h: 0.09 }, nozzle: [-0.07, -0.672], spoiler: "rack", exhaust: null },
  vortex: { name: "Vortex", z0: -0.725, z1: 0.765,
    top: [[-0.725, 0.0], [-0.69, 0.08], [-0.6, 0.112], [-0.45, 0.126], [-0.3, 0.11], [0.0, 0.072], [0.3, 0.062], [0.5, 0.042], [0.66, -0.02], [0.72, -0.08], [0.765, -0.135]],
    dip: [[-0.725, 0], [-0.55, 0.03], [-0.4, 0.042], [-0.25, 0.0], [0.2, 0], [0.4, 0.03], [0.6, 0.03], [0.765, 0]],
    bot: [[-0.725, -0.2], [-0.645, -0.27], [0.6, -0.276], [0.72, -0.25], [0.765, -0.21]],
    halfw: [[-0.725, 0.42], [-0.63, 0.49], [-0.45, 0.505], [-0.3, 0.48], [-0.05, 0.44], [0.2, 0.44], [0.42, 0.482], [0.56, 0.472], [0.68, 0.42], [0.765, 0.3]],
    nUp: 2.0, tumble: 0.12, scoop: 0.07, crease: 0.015, fz: 0.04, rz: -0.06,
    cabin: { z0: -0.33, z1: 0.39, wt: 0.22, wb: 0.8, roof: [[-0.33, 0.0], [-0.26, 0.12], [-0.15, 0.163], [0.0, 0.178], [0.12, 0.165], [0.25, 0.12], [0.39, 0.0]], glass: { side: [-0.2, 0.3], pillar: [9, 9], front: 0.13, rear: -0.18 } },
    head: "slit", headX: 0.7, tail: { y: 0.03, w: 0.82, z: -0.715 }, nozzle: [-0.11, -0.72], spoiler: "bigwing", exhaust: [0.3, -0.2] },
  nova: { name: "Nova-X", z0: -0.685, z1: 0.765,
    top: [[-0.685, 0.02], [-0.645, 0.13], [-0.55, 0.152], [-0.3, 0.142], [0.0, 0.102], [0.3, 0.062], [0.55, 0.022], [0.7, -0.04], [0.765, -0.1]],
    dip: [[-0.685, 0], [0.765, 0]],
    bot: [[-0.685, -0.18], [-0.62, -0.262], [0.62, -0.262], [0.72, -0.22], [0.765, -0.18]],
    halfw: [[-0.685, 0.42], [-0.6, 0.472], [-0.3, 0.472], [0.0, 0.452], [0.3, 0.442], [0.55, 0.422], [0.7, 0.36], [0.765, 0.28]],
    nUp: 5, nLow: 5, tumble: 0.15, scoop: 0, crease: 0.04, endR: 0.035,
    cabin: { z0: -0.37, z1: 0.33, wt: 0.2, wb: 0.82, roof: [[-0.37, 0.0], [-0.3, 0.17], [-0.1, 0.212], [0.05, 0.204], [0.2, 0.152], [0.33, 0.0]], glass: { side: [-0.31, 0.27], pillar: [9, 9], front: -0.02, rear: -0.26 } },
    head: "slit", headX: 0.66, tail: { y: 0.07, w: 0.84, z: -0.677 }, nozzle: [-0.09, -0.68], spoiler: "fin", exhaust: null, strips: true },
  bastion: { name: "Bastion", z0: -0.705, z1: 0.725,
    top: [[-0.705, 0.05], [-0.665, 0.142], [-0.5, 0.162], [0.0, 0.156], [0.4, 0.142], [0.6, 0.122], [0.685, 0.06], [0.725, -0.02]],
    dip: [[-0.705, 0], [0.725, 0]],
    bot: [[-0.705, -0.16], [-0.64, -0.25], [0.62, -0.25], [0.7, -0.19], [0.725, -0.14]],
    halfw: [[-0.705, 0.43], [-0.62, 0.48], [0.0, 0.482], [0.6, 0.472], [0.68, 0.44], [0.725, 0.38]],
    nUp: 4.5, nLow: 4.5, tumble: 0.06, scoop: 0, crease: 0.0, endR: 0.035,
    cabin: { z0: -0.43, z1: 0.26, wt: 0.3, roof: [[-0.43, 0.0], [-0.39, 0.25], [-0.31, 0.282], [0.1, 0.282], [0.19, 0.25], [0.26, 0.0]], glass: { side: [-0.31, 0.13], pillar: [-0.1, -0.06], front: 0.18, rear: -0.37, sill: 0.085 } },
    head: "square", headX: 0.66, tail: { y: 0.08, w: 0.0, z: -0.7, pair: 0.34, h: 0.05 }, nozzle: [-0.09, -0.705], spoiler: "armor", exhaust: null },
  apex: { name: "Apex F", z0: -0.72, z1: 0.79, open: true,
    top: [[-0.72, 0.04], [-0.6, 0.1], [-0.4, 0.125], [-0.15, 0.115], [0.1, 0.09], [0.3, 0.04], [0.5, -0.02], [0.7, -0.07], [0.79, -0.1]],
    dip: [[-0.72, 0], [0.79, 0]],
    bot: [[-0.72, -0.2], [-0.65, -0.26], [0.45, -0.26], [0.7, -0.21], [0.79, -0.18]],
    halfw: [[-0.72, 0.13], [-0.6, 0.2], [-0.42, 0.27], [-0.15, 0.285], [0.1, 0.22], [0.3, 0.15], [0.5, 0.11], [0.7, 0.085], [0.79, 0.05]],
    nUp: 2.5, nLow: 3, scoop: 0, crease: 0, wheelX: 0.44, wheelR: 0.2, fz: 0.02, rz: -0.03,
    cabin: null, head: null, tail: { y: -0.02, w: 0.0, z: -0.715, pair: 0.0, h: 0.05, rain: true }, nozzle: [-0.11, -0.715], spoiler: "formula", exhaust: null },
};

// derived numbers for one body (curves, wheel placement, roof point for toppers)
const SHAPES = {};
function shapeOf(id) {
  if (SHAPES[id]) return SHAPES[id];
  const d = BODIES[id] || BODIES.striker;
  const S = { ...d, TOP: smooth(d.top), DIP: smooth(d.dip), BOT: smooth(d.bot), HALFW: smooth(d.halfw) };
  S.nUp = d.nUp ?? 2.3; S.nLow = d.nLow ?? 3.2; S.tumble = d.tumble ?? 0.09; S.endR = d.endR ?? 0.05;
  S.wheelR = d.wheelR ?? 0.186; S.wheelX = d.wheelX ?? 0.405;
  S.drop = CAR.wheelR - S.wheelR; S.restY = CAR.wheelY - (CAR.suspRest - 0.017) - S.drop;
  S.frontZ = CAR.wheelFront + (d.fz ?? 0.035); S.rearZ = CAR.wheelRear + (d.rz ?? -0.045);
  S.archIn = S.wheelX - 0.105;
  if (d.cabin) {
    S.ROOF = smooth(d.cabin.roof);
    let best = [-1, 0]; for (let z = d.cabin.z0; z <= d.cabin.z1; z += 0.005) { const y = S.ROOF(z); if (y > best[0]) best = [y, z]; }
    S.roofPt = [best[0], best[1]];
  } else S.roofPt = [0.21, -0.12]; // formula: on top of the driver's helmet
  return (SHAPES[id] = S);
}

function buildBody(S, d = 1) { // d = detail (1 = full, 0.5 = half the triangles each way)
  const NZ = Math.round(220 * d), NR = Math.round(144 * d / 2) * 2, pos = [], uv = [], col = [], idx = [];
  const arches = S.open ? [] : [S.frontZ, S.rearZ];
  for (let i = 0; i <= NZ; i++) {
    const s = i / NZ, z = S.z0 + (S.z1 - S.z0) * (0.5 - 0.5 * Math.cos(Math.PI * s)); // denser at the ends
    const dd = Math.min(z - S.z0, S.z1 - z), u = 1 - dd / S.endR, e = dd >= S.endR ? 1 : Math.sqrt(Math.max(0, 1 - u * u));
    const top = S.TOP(z), bot = S.BOT(z);
    const cy = (top + bot) / 2, hh = (top - bot) / 2 * (0.25 + 0.75 * e), hw = S.HALFW(z) * e;
    for (let j = 0; j <= NR; j++) {
      const th = (j / NR) * Math.PI * 2, c = Math.cos(th), sn = Math.sin(th);
      const upper = sn > 0, n = upper ? S.nUp : S.nLow;
      let x = hw * spow(c, 2 / n) * (upper ? 1 - S.tumble * sn * sn : 1);
      let y = cy + hh * spow(sn, 2 / n);
      if (upper) y -= S.DIP(z) * Math.pow(Math.max(0, sn), 6) * e;
      if (upper && S.crease) x *= 1 + S.crease * Math.exp(-Math.pow((sn - 0.42) / 0.12, 2)); // shoulder line
      if (S.scoop) { const scoopZ = Math.exp(-Math.pow((z + 0.02) / 0.2, 4)), scoopY = Math.exp(-Math.pow((y + 0.09) / 0.075, 2)); x *= 1 - S.scoop * scoopZ * scoopY; }
      let shade = 1;
      for (const wz of arches) { // press the wheel arches into the body sides (smooth edges, rolled lip)
        const r = Math.hypot(z - wz, y - S.restY), R = S.wheelR + 0.034, band = 0.028;
        const side = clamp01((Math.abs(x) - (S.archIn - 0.01)) / 0.05);
        const k = side * (1 - clamp01((r - R) / band));
        if (k > 0) {
          const kk = k * k * (3 - 2 * k);
          x = Math.sign(x) * (Math.abs(x) * (1 - kk) + S.archIn * kk);
          shade = Math.min(shade, 1 - 0.94 * clamp01((R - 0.006 - r) / 0.012) * side);
        }
      }
      pos.push(x, y, z); uv.push(s, j / NR); col.push(shade, shade, shade);
    }
  }
  for (let i = 0; i < NZ; i++) for (let j = 0; j < NR; j++) { const a = i * (NR + 1) + j, b = a + NR + 1; idx.push(a, a + 1, b, b, a + 1, b + 1); }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  g.setAttribute("color", new THREE.Float32BufferAttribute(col, 3));
  g.setIndex(idx); g.computeVertexNormals();
  return g;
}

function buildCabin(S, d = 1) {
  const C = S.cabin, G = C.glass, sill = G.sill ?? 0.05, wbK = C.wb ?? 0.86;
  const NZ = Math.round(90 * d), NR = Math.round(48 * d / 2) * 2, pos = [], uv = [], groups = [[], []], rows = [];
  for (let i = 0; i <= NZ; i++) {
    const s = i / NZ, z = C.z0 + (C.z1 - C.z0) * s;
    const top = S.TOP(z) - S.DIP(z) * 0.5, base = top - 0.03, roofH = Math.max(0, S.ROOF(z) - top + 0.03), wb = S.HALFW(z) * wbK, wt = C.wt;
    const row = [];
    for (let j = 0; j <= NR; j++) {
      const th = (j / NR) * Math.PI, c = Math.cos(th), sn = Math.sin(th);
      const k = spow(sn, 2 / 3.2);
      const x = spow(c, 2 / 3.2) * (wb + (wt - wb) * k), y = base + roofH * k;
      pos.push(x, y, z); uv.push(s, j / NR); row.push({ th, y, base, z });
    }
    rows.push(row);
  }
  const idx = [];
  for (let i = 0; i < NZ; i++) for (let j = 0; j < NR; j++) {
    const a = i * (NR + 1) + j, b = a + NR + 1, p = rows[i][j], q = rows[i + 1][j + 1];
    const z = (p.z + q.z) / 2, th = (p.th + q.th) / 2, y = (p.y + q.y) / 2, base = (p.base + q.base) / 2;
    const side = th < 0.95 || th > Math.PI - 0.95;
    const glass = side ? z > G.side[0] && z < G.side[1] && y > base + sill && !(z > G.pillar[0] && z < G.pillar[1]) : (z > G.front) || (z < G.rear);
    groups[glass ? 1 : 0].push(a, a + 1, b, b, a + 1, b + 1);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex([...groups[0], ...groups[1]]);
  g.addGroup(0, groups[0].length, 0); g.addGroup(groups[0].length, groups[1].length, 1);
  g.computeVertexNormals();
  return g;
}

// ---- painted livery textures (u = tail→nose, v = around the body: 0/0.5 = the two sides, 0.25 = top) ----
function canvas(w, h) { const c = document.createElement("canvas"); c.width = w; c.height = h; return c; }
export const DECALS = ["stripes", "none", "number", "lightning", "flames", "checker", "split"];
function liveryTexture(primary, accent, number, decal = "stripes") {
  const c = canvas(1024, 512), g = c.getContext("2d");
  const P = "#" + new THREE.Color(primary).getHexString(), A = "#" + new THREE.Color(accent).getHexString();
  const X = (u) => u * 1024, Y = (v) => v * 512;
  g.fillStyle = P; g.fillRect(0, 0, 1024, 512);
  if (decal === "split") { g.fillStyle = A; g.fillRect(0, Y(0.1), 1024, Y(0.3)); g.fillStyle = "rgba(0,0,0,0.35)"; g.fillRect(0, Y(0.1) - 3, 1024, 6); g.fillRect(0, Y(0.4) - 3, 1024, 6); }
  g.fillStyle = "#16181c"; g.fillRect(0, Y(0.6), 1024, Y(0.33)); // dark lower body / underside
  g.fillStyle = A;
  if (decal === "stripes") {
    for (const v of [0.236, 0.264]) g.fillRect(0, Y(v - 0.008), 1024, Y(0.016));
    for (const v0 of [0.0, 0.5, 1.0]) { g.beginPath(); g.moveTo(X(0.36), Y(v0 - 0.035)); g.lineTo(X(0.66), Y(v0 - 0.05)); g.lineTo(X(0.7), Y(v0 - 0.035)); g.lineTo(X(0.42), Y(v0 - 0.02)); g.closePath(); g.fill(); }
  } else if (decal === "lightning") {
    for (const v0 of [0.03, 0.47]) { const s = v0 < 0.25 ? -1 : 1; g.beginPath(); g.moveTo(X(0.2), Y(v0)); g.lineTo(X(0.48), Y(v0 + s * 0.035)); g.lineTo(X(0.46), Y(v0 + s * 0.005)); g.lineTo(X(0.8), Y(v0 + s * 0.045)); g.lineTo(X(0.52), Y(v0 - s * 0.012)); g.lineTo(X(0.54), Y(v0 + s * 0.018)); g.closePath(); g.fill(); }
    g.fillRect(0, Y(0.244), 1024, Y(0.012));
  } else if (decal === "flames") { // flame tongues licking back from the nose along both sides and the hood
    const tongue = (v0, s, k, col) => { g.fillStyle = col; g.beginPath(); g.moveTo(X(1.0), Y(v0)); const n = 5;
      for (let i = 0; i < n; i++) { const tip = 0.94 - 0.38 * k * (0.55 + 0.45 * Math.sin(i * 2.1 + 1)), w = 0.11 * k / n, vA = v0 + s * w * i * 1.9, vB = v0 + s * w * (i * 1.9 + 1.9);
        g.quadraticCurveTo(X(tip + 0.12), Y(vA + s * w * 0.2), X(tip), Y(vA + s * w * 0.95)); g.quadraticCurveTo(X(tip + 0.14), Y(vA + s * w * 1.3), X(0.99), Y(vB)); }
      g.lineTo(X(1.0), Y(v0 + s * 0.2 * k)); g.closePath(); g.fill(); };
    for (const [v0, s] of [[0.0, 1], [0.5, -1], [0.5, 1], [1.0, -1]]) { tongue(v0, s, 1, A); tongue(v0, s, 0.62, "#ffe08a"); }
} else if (decal === "checker") {
    const sq = 0.02; for (let i = 0; i < 6; i++) for (let j = 0; j < 30; j++) if ((i + j) % 2 === 0) { g.fillStyle = (i + j) % 4 ? A : "#ffffff"; g.fillRect(X(0.06 + i * sq * 0.5), Y(j * sq), X(sq * 0.5), Y(sq)); g.fillRect(X(0.86 + i * sq * 0.5), Y(j * sq), X(sq * 0.5), Y(sq)); }
    g.fillStyle = A; g.fillRect(X(0.12), Y(0.0), X(0.015), Y(0.6)); g.fillRect(X(0.845), Y(0.0), X(0.015), Y(0.6));
  } else if (decal === "number") {
    g.save(); g.translate(X(0.79), Y(0.25)); g.rotate(-Math.PI / 2); g.scale(1, 1.25); g.font = "italic 900 92px system-ui, Arial"; g.textAlign = "center"; g.textBaseline = "middle";
    g.fillStyle = "#fff"; g.strokeStyle = A; g.lineWidth = 10; g.strokeText(number, 0, 0); g.fillText(number, 0, 0); g.restore();
    g.fillStyle = A; g.fillRect(X(0.42), Y(0.03), X(0.24), Y(0.012)); g.fillRect(X(0.42), Y(0.458), X(0.24), Y(0.012));
  }
  // panel lines (door cuts, hood, fuel flap)
  g.strokeStyle = "rgba(0,0,0,0.55)"; g.lineWidth = 2;
  for (const u of [0.43, 0.63]) for (const v0 of [0, 0.5]) { g.beginPath(); g.moveTo(X(u), Y(v0 - 0.09) + (v0 ? 0 : 512)); g.lineTo(X(u), Y(v0 + 0.09) + (v0 ? 0 : 512)); g.stroke(); g.beginPath(); g.moveTo(X(u), Y(v0 + 0.09)); g.lineTo(X(u), Math.max(0, Y(v0 - 0.09))); g.stroke(); }
  g.beginPath(); g.moveTo(X(0.78), Y(0.13)); g.lineTo(X(0.78), Y(0.37)); g.stroke();
  g.fillStyle = "#0b0c0e"; // side vents behind the doors
  for (const v0 of [0.035, 0.535]) for (let k = 0; k < 3; k++) g.fillRect(X(0.3 - k * 0.012), Y(v0 + k * 0.012), X(0.035), Y(0.006));
  if (decal !== "none") { // door number (drawn twice, once per side)
    g.font = "italic 900 58px system-ui, Arial"; g.textAlign = "center"; g.textBaseline = "middle";
    for (const [v0, flip] of [[0.97, true], [0.47, false]]) {
      g.save(); g.translate(X(0.53), Y(v0)); if (flip) g.scale(-1, 1); g.scale(1, 0.55);
      g.fillStyle = "#fff"; g.strokeStyle = A; g.lineWidth = 7; g.strokeText(number, 0, 0); g.fillText(number, 0, 0); g.restore();
    }
  }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; t.wrapT = THREE.RepeatWrapping; t.flipY = false;
  return t;
}
function treadTexture(kind) {
  const c = canvas(512, 128), g = c.getContext("2d");
  g.fillStyle = "#8080ff"; g.fillRect(0, 0, 512, 128);
  if (kind === "rugged") { // chunky blocks
    for (let i = 0; i < 24; i++) for (let r = 0; r < 3; r++) { const x = i * (512 / 24) + (r % 2) * 10, y = 18 + r * 32; g.fillStyle = "#b8b8ff"; g.fillRect(x, y, 14, 4); g.fillStyle = "#4848ff"; g.fillRect(x, y + 20, 14, 4); g.fillStyle = "#9a9aff"; g.fillRect(x, y + 4, 14, 16); }
  } else if (kind !== "slick") {
    for (let i = 0; i < 48; i++) { // chevron grooves, drawn as a normal map (tilted shading)
      const x = i * (512 / 48);
      g.strokeStyle = "#5050ff"; g.lineWidth = 3; g.beginPath(); g.moveTo(x, 40); g.lineTo(x + 6, 64); g.lineTo(x, 88); g.stroke();
      g.strokeStyle = "#b0b0ff"; g.lineWidth = 2; g.beginPath(); g.moveTo(x + 3, 40); g.lineTo(x + 9, 64); g.lineTo(x + 3, 88); g.stroke();
    }
    g.fillStyle = "#6060ff"; g.fillRect(0, 62, 512, 4);
  }
  const t = new THREE.CanvasTexture(c); t.wrapS = THREE.RepeatWrapping; return t;
}
const texCache = {};
function cachedTex(key, make) { return texCache[key] || (texCache[key] = make()); }
function carbon() {
  return cachedTex("carbon", () => {
    const c = canvas(128, 128), g = c.getContext("2d");
    for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) { const v = ((x + y) % 2) ? 34 : 22; g.fillStyle = `rgb(${v},${v + 1},${v + 4})`; g.fillRect(x * 8, y * 8, 8, 8); g.fillStyle = "rgba(255,255,255,0.05)"; g.fillRect(x * 8, y * 8, ((x + y) % 2) ? 8 : 2, ((x + y) % 2) ? 2 : 8); }
    const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(6, 6); t.colorSpace = THREE.SRGBColorSpace; return t;
  });
}

// ---- wheels: 5 rim designs, 4 tire types ----
export const RIMS = ["twin5", "star", "mesh", "turbine", "dish"];
function rimShape(style) {
  const s = new THREE.Shape(); s.absarc(0, 0, 0.138, 0, Math.PI * 2, false);
  const deg = Math.PI / 180;
  const hole = (a0, a1, r0, r1, twist = 0) => { // a window between two radii; twist curves it like a turbine blade
    const h = new THREE.Path(), N = 8;
    for (let i = 0; i <= N; i++) { const a = a0 + (a1 - a0) * i / N + twist; h[i ? "lineTo" : "moveTo"](Math.cos(a) * r1, Math.sin(a) * r1); }
    for (let i = N; i >= 0; i--) { const a = a0 + (a1 - a0) * i / N; h.lineTo(Math.cos(a) * r0, Math.sin(a) * r0); }
    h.closePath(); s.holes.push(h);
  };
  const circle = (x, y, r) => { const h = new THREE.Path(); h.absarc(x, y, r, 0, Math.PI * 2, true); s.holes.push(h); };
  if (style === "star") for (let i = 0; i < 5; i++) { const b = i * 72 * deg; hole(b + 9 * deg, b + 63 * deg, 0.045, 0.12); }
  else if (style === "mesh") for (let i = 0; i < 10; i++) { const b = i * 36 * deg; hole(b + 4 * deg, b + 30 * deg, 0.05, 0.082); hole(b + 22 * deg, b + 50 * deg, 0.09, 0.122); }
  else if (style === "turbine") for (let i = 0; i < 12; i++) { const b = i * 30 * deg; hole(b + 4 * deg, b + 20 * deg, 0.05, 0.122, 22 * deg); }
  else if (style === "dish") for (let i = 0; i < 8; i++) { const a = i * 45 * deg; circle(Math.cos(a) * 0.072, Math.sin(a) * 0.072, 0.017); }
  else for (let i = 0; i < 5; i++) { const b = i * 72 * deg; hole(b + 7 * deg, b + 14 * deg, 0.06, 0.112); hole(b + 21 * deg, b + 65 * deg, 0.052, 0.118); }
  const center = new THREE.Path(); center.absarc(0, 0, 0.018, 0, Math.PI * 2, true); s.holes.push(center);
  return s;
}
const geoCache = {};
const cachedGeo = (key, make) => geoCache[key] || (geoCache[key] = make());
const isCached = (g) => Object.values(geoCache).some((v) => v === g || (v && typeof v === "object" && !v.isBufferGeometry && Object.values(v).includes(g)));
function tireGeometry(kind) {
  return cachedGeo("tire-" + kind, () => {
    const R = 0.2, W = kind === "rugged" ? 0.088 : kind === "slick" ? 0.082 : 0.074, rr = kind === "rugged" ? 0.04 : 0.03, inner = kind === "rugged" ? 0.128 : 0.135, prof = [];
    prof.push(new THREE.Vector2(inner, -W));
    for (let i = 0; i <= 8; i++) { const a = -Math.PI / 2 + (i / 8) * (Math.PI / 2); prof.push(new THREE.Vector2(R - rr + Math.cos(a) * rr, -W + rr + Math.sin(a) * rr)); }
    for (let i = 0; i <= 8; i++) { const a = (i / 8) * (Math.PI / 2); prof.push(new THREE.Vector2(R - rr + Math.cos(a) * rr, W - rr + Math.sin(a) * rr)); }
    prof.push(new THREE.Vector2(inner, W));
    const g = new THREE.LatheGeometry(prof, 64); g.rotateZ(Math.PI / 2); return g;
  });
}
function wheelParts() {
  return cachedGeo("wheel", () => {
    const barrel = new THREE.CylinderGeometry(0.136, 0.136, 0.13, 40, 1, true); barrel.rotateZ(Math.PI / 2);
    const lip = new THREE.TorusGeometry(0.138, 0.007, 8, 48); lip.rotateY(Math.PI / 2); lip.translate(0.062, 0, 0);
    const disc = new THREE.CylinderGeometry(0.112, 0.112, 0.014, 40); disc.rotateZ(Math.PI / 2); disc.translate(-0.01, 0, 0);
    const hub = new THREE.CylinderGeometry(0.026, 0.03, 0.03, 16); hub.rotateZ(Math.PI / 2); hub.translate(0.06, 0, 0);
    const caliper = new THREE.BoxGeometry(0.04, 0.075, 0.05); caliper.translate(0.012, 0.075, -0.045);
    const wall = new THREE.RingGeometry(0.152, 0.172, 48); wall.rotateY(Math.PI / 2); wall.translate(0.0765, 0, 0);
    return { barrel, lip, disc, hub, caliper, wall };
  });
}
function rimGeometry(style) {
  return cachedGeo("rim-" + style, () => {
    const depth = style === "dish" ? 0.03 : 0.022;
    const g = new THREE.ExtrudeGeometry(rimShape(style), { depth, bevelEnabled: true, bevelThickness: 0.006, bevelSize: 0.004, bevelSegments: 2, curveSegments: 40 });
    g.rotateY(Math.PI / 2); g.translate(style === "dish" ? 0.022 : 0.035, 0, 0); return g;
  });
}

// ---- paint finishes ----
export const FINISHES = {
  gloss: { metalness: 0.1, roughness: 0.22, clearcoat: 1, clearcoatRoughness: 0.03 },
  metallic: { metalness: 0.5, roughness: 0.3, clearcoat: 1, clearcoatRoughness: 0.035 },
  matte: { metalness: 0.05, roughness: 0.72, clearcoat: 0, clearcoatRoughness: 0.5, envMapIntensity: 0.6 },
  pearl: { metalness: 0.35, roughness: 0.26, clearcoat: 1, clearcoatRoughness: 0.03, iridescence: 1, iridescenceIOR: 1.35, iridescenceThicknessRange: [180, 520] },
  gold: { metalness: 0.85, roughness: 0.22, clearcoat: 1, clearcoatRoughness: 0.04 },
};
const RIM_COLORS = { silver: 0xc4c8cf, black: 0x22252b, gold: 0xe9c25a };

// ---- the whole car ----
// opts: primary, accent, number, rimColor (number) or rimTone ("silver"|"black"|"accent"|"gold"),
//       body, finish, decal, rims, tires, topper, antenna, detail
export function buildCar(opts = {}) {
  const S = shapeOf(opts.body || "striker");
  let primary = opts.primary ?? 0x1d6dff, accent = opts.accent ?? 0xffc23a;
  const number = opts.number ?? "7", finish = FINISHES[opts.finish] ? opts.finish : "metallic";
  if (finish === "gold") { primary = 0xd1a32a; }
  const group = new THREE.Group(); group.name = "car";
  const F = FINISHES[finish], envI = F.envMapIntensity ?? 1.25;
  const paintOpts = { metalness: F.metalness, roughness: F.roughness, clearcoat: F.clearcoat, clearcoatRoughness: F.clearcoatRoughness, envMapIntensity: envI };
  if (F.iridescence) Object.assign(paintOpts, { iridescence: F.iridescence, iridescenceIOR: F.iridescenceIOR, iridescenceThicknessRange: F.iridescenceThicknessRange });
  const paint = new THREE.MeshPhysicalMaterial({ color: 0xffffff, map: liveryTexture(primary, accent, number, opts.decal || "stripes"), vertexColors: true, ...paintOpts });
  const paintPlain = new THREE.MeshPhysicalMaterial({ color: primary, ...paintOpts });
  const accentPaint = new THREE.MeshPhysicalMaterial({ color: accent, ...paintOpts });
  const glass = new THREE.MeshPhysicalMaterial({ color: 0x0f1a28, metalness: 0.35, roughness: 0.03, clearcoat: 1, clearcoatRoughness: 0.0, envMapIntensity: 2.4 });
  const carb = new THREE.MeshStandardMaterial({ color: 0xffffff, map: carbon(), metalness: 0.4, roughness: 0.42 });
  const black = new THREE.MeshStandardMaterial({ color: 0x0b0c0f, metalness: 0.3, roughness: 0.55 });
  const armor = new THREE.MeshStandardMaterial({ color: 0x2b2e34, metalness: 0.75, roughness: 0.42 });
  const chrome = new THREE.MeshStandardMaterial({ color: 0xdfe3ea, metalness: 1, roughness: 0.14 });
  const headMat = new THREE.MeshStandardMaterial({ color: 0x0c0f14, emissive: 0xd8f0ff, emissiveIntensity: 5.5, roughness: 0.2 });
  const tailMat = new THREE.MeshStandardMaterial({ color: 0x220405, emissive: 0xff1e2a, emissiveIntensity: 2.6, roughness: 0.3 });
  const accentGlow = new THREE.MeshStandardMaterial({ color: 0x111111, emissive: accent, emissiveIntensity: 2.2 });
  const nozzleGlow = new THREE.MeshBasicMaterial({ color: new THREE.Color(1.0, 0.45, 0.12) });
  const owned = []; // geometries made just for this car (disposed with it)

  const mesh = (g, m, cast = true, parent = group) => { const o = new THREE.Mesh(g, m); o.castShadow = cast; o.receiveShadow = false; parent.add(o); if (!isCached(g)) owned.push(g); return o; };
  const detail = opts.detail ?? 1, bid = opts.body || "striker"; mesh(cachedGeo(`body-${bid}-${detail}`, () => buildBody(S, detail)), paint);
  if (S.cabin) mesh(cachedGeo(`cabin-${bid}-${detail}`, () => buildCabin(S, Math.max(0.6, detail))), [paint, glass]);
  const box = (w, h, d, m, x, y, z, rx = 0, ry = 0, rz = 0, cast = true) => { const o = mesh(new THREE.BoxGeometry(w, h, d), m, cast); o.position.set(x, y, z); o.rotation.set(rx, ry, rz); return o; };
  const cyl = (r0, r1, h, m, x, y, z, rx = 0, ry = 0, rz = 0, seg = 16) => { const o = mesh(new THREE.CylinderGeometry(r0, r1, h, seg), m); o.position.set(x, y, z); o.rotation.set(rx, ry, rz); return o; };
  const surf = (z) => S.TOP(z) - S.DIP(z); // the hood/deck surface height down the middle

  // --- front: splitter, grille, lights ---
  const z1 = S.z1;
  if (!S.open) {
    box(0.66, 0.012, 0.07, carb, 0, S.BOT(z1 - 0.1) + 0.012, z1 - 0.1, -0.05);
    box(0.5, 0.055, 0.03, black, 0, (S.TOP(z1 - 0.03) + S.BOT(z1 - 0.03)) / 2 - 0.02, z1 - 0.015, -0.25);
  }
  const hz = z1 - 0.055, hx = S.HALFW(hz) * (S.headX ?? 0.66), hy = S.TOP(hz) - 0.018 + (S.headDY ?? 0);
  for (const sx of S.head ? [-1, 1] : []) {
    if (S.head === "capsule") { const hl = mesh(new THREE.CapsuleGeometry(0.018, 0.13, 4, 10), headMat, false); hl.position.set(sx * hx, hy, hz); hl.rotation.set(0, sx * 0.55, Math.PI / 2 + sx * 0.32); }
    else if (S.head === "round") for (const k of [0, 1]) { const hl = mesh(new THREE.CircleGeometry(0.03, 20), headMat, false); hl.position.set(sx * (hx - k * 0.075), hy - 0.005, hz + 0.02 + k * 0.006); }
    else if (S.head === "slit") { const hl = box(0.17, 0.014, 0.02, headMat, sx * hx, hy + 0.005, hz, 0, sx * 0.4, 0, false); hl.rotation.z = -sx * 0.12; }
    else if (S.head === "square") { box(0.09, 0.045, 0.02, headMat, sx * hx, hy - 0.01, hz + 0.01, 0, sx * 0.3, 0, false); box(0.11, 0.07, 0.012, black, sx * hx, hy - 0.01, hz + 0.004, 0, sx * 0.3, 0); }
    box(0.1, 0.008, 0.012, headMat, sx * hx * 0.72, hy - 0.04, hz + 0.03, -0.3, sx * 0.25, 0, false); // daytime light strip
  }
  // --- mirrors ---
  if (S.cabin) {
    const mz = S.cabin.glass.front + 0.07 > S.cabin.z1 ? S.cabin.z1 - 0.06 : S.cabin.glass.front + 0.07, mx = S.HALFW(mz) * 0.86 + 0.015, my = S.TOP(mz) + 0.03;
    for (const sx of [-1, 1]) { const mg = new THREE.SphereGeometry(1, 16, 10); mg.scale(0.032, 0.02, 0.03); const mir = mesh(mg, paintPlain); mir.position.set(sx * mx, my, mz); mir.rotation.y = -sx * 0.2; box(0.05, 0.01, 0.018, black, sx * (mx - 0.035), my - 0.005, mz); }
  }
  // --- rear: tail lights, diffuser, exhausts, boost nozzle ---
  const T = S.tail;
  if (T.w) box(T.w, 0.022, 0.012, tailMat, 0, T.y, T.z, 0, 0, 0, false);
  if (T.pair) for (const sx of [-1, 1]) box(T.wide ?? 0.11, T.h ?? 0.05, 0.012, tailMat, sx * T.pair, T.y - (T.w ? 0.01 : 0), T.z + 0.004, 0, 0, 0, false);
  if (T.rain) box(0.05, 0.05, 0.012, tailMat, 0, T.y + 0.09, T.z + 0.015, 0, 0, 0, false);
  if (!S.open) { const dz = S.z0 + 0.045; box(0.6, 0.05, 0.1, carb, 0, S.BOT(dz) + 0.005, dz, 0.35); for (let k = -2; k <= 2; k++) box(0.008, 0.06, 0.11, black, k * 0.11, S.BOT(dz) - 0.005, dz, 0.35); }
  if (S.exhaust) for (const sx of [-1, 1]) {
    const ex = cyl(0.03, 0.034, 0.08, chrome, sx * S.exhaust[0], S.exhaust[1], S.z0 + 0.025, Math.PI / 2, 0, 0, 18);
    const exi = mesh(new THREE.CircleGeometry(0.024, 18), black, false); exi.position.set(sx * S.exhaust[0], S.exhaust[1], S.z0 - 0.016); exi.rotation.y = Math.PI;
    if (S.exhaust[0] === 0) break;
  }
  const [ny, nz] = S.nozzle;
  const noz = mesh(new THREE.CylinderGeometry(0.075, 0.09, 0.09, 24, 1, true), new THREE.MeshStandardMaterial({ color: 0x2a2c31, metalness: 0.9, roughness: 0.35, side: THREE.DoubleSide })); noz.rotation.x = Math.PI / 2; noz.position.set(0, ny, nz);
  const nozIn = mesh(new THREE.CircleGeometry(0.07, 24), nozzleGlow, false); nozIn.position.set(0, ny, nz - 0.005); nozIn.rotation.y = Math.PI;
  const ring = mesh(new THREE.TorusGeometry(0.083, 0.008, 8, 32), accentGlow, false); ring.position.set(0, ny, nz - 0.045);
  if (!S.open) { const under = mesh(new THREE.PlaneGeometry(0.8, (S.z1 - S.z0) * 0.85), black, false); under.rotation.x = Math.PI / 2; under.position.y = -0.24; }

  // --- each design's own pieces ---
  const foil = (span, chord, m, x, y, z, rx = 0.12) => { // an airfoil wing
    const f = new THREE.Shape(); f.moveTo(0, 0); f.bezierCurveTo(chord * 0.18, 0.03, chord * 0.7, 0.022, chord, 0.004); f.lineTo(chord, -0.004); f.bezierCurveTo(chord * 0.6, 0.0, chord * 0.18, -0.012, 0, 0);
    const g = new THREE.ExtrudeGeometry(f, { depth: span, bevelEnabled: false, curveSegments: 16 }); g.translate(-chord / 2, 0, -span / 2); g.rotateY(Math.PI / 2);
    const o = mesh(g, m); o.position.set(x, y, z); o.rotation.x = rx; return o;
  };
  const sp = S.spoiler;
  if (sp === "wing") { // Striker: rear wing on carbon struts + hood vents
    foil(0.86, 0.17, paint, 0, 0.27, -0.6);
    for (const sx of [-1, 1]) { box(0.008, 0.06, 0.11, carb, sx * 0.43, 0.272, -0.6); box(0.018, 0.13, 0.04, carb, sx * 0.24, 0.2, -0.56, 0.25); for (let k = 0; k < 3; k++) box(0.1, 0.006, 0.05, black, sx * 0.15, surf(0.42 + k * 0.035) + 0.003, 0.36 + k * 0.035, -0.22); }
  } else if (sp === "roof") { // Sprite: roof spoiler over the hatch
    const rz = S.cabin.z0 + 0.04; foil(0.56, 0.12, paintPlain, 0, S.ROOF(rz + 0.05) - 0.005, rz, 0.18);
  } else if (sp === "ducktail") { // Hammerhead: flicked-up tail + hood scoop
    const dz = S.z0 + 0.06; const lip = box(0.78, 0.022, 0.09, paintPlain, 0, S.TOP(dz) + 0.012, dz, -0.32);
    const sg = new THREE.BoxGeometry(0.2, 0.05, 0.2); const sc = mesh(sg, paintPlain); sc.position.set(0, surf(0.42) + 0.03, 0.42); sc.rotation.x = 0.06;
    box(0.16, 0.034, 0.012, black, 0, surf(0.42) + 0.03, 0.522); void lip;
  } else if (sp === "rack") { // Trailblazer: roof rack + light bar, bull bar, skid plate, fender flares
    const ry = S.roofPt[0] + 0.035;
    for (const sx of [-1, 1]) box(0.012, 0.012, 0.6, black, sx * 0.24, ry, -0.12);
    for (const z of [-0.36, -0.2, -0.04, 0.12]) box(0.5, 0.01, 0.012, black, 0, ry, z);
    box(0.4, 0.035, 0.03, black, 0, ry + 0.02, 0.17); for (let k = -3; k <= 3; k++) mesh(new THREE.CircleGeometry(0.012, 12), headMat, false).position.set(k * 0.05, ry + 0.02, 0.186);
    for (const sx of [-1, 1]) box(0.022, 0.16, 0.022, chrome, sx * 0.22, S.BOT(z1) + 0.09, z1 + 0.02);
    box(0.5, 0.022, 0.022, chrome, 0, S.BOT(z1) + 0.15, z1 + 0.02); box(0.5, 0.022, 0.022, chrome, 0, S.BOT(z1) + 0.05, z1 + 0.025);
    box(0.5, 0.015, 0.2, armor, 0, S.BOT(0.6) + 0.005, 0.58, 0.25);
    for (const wz of [S.frontZ, S.rearZ]) for (const sx of [-1, 1]) { const fl = mesh(new THREE.TorusGeometry(S.wheelR + 0.04, 0.018, 6, 20, Math.PI), black); fl.position.set(sx * (S.archIn + 0.115), S.restY, wz); fl.rotation.y = Math.PI / 2; }
  } else if (sp === "bigwing") { // Vortex: tall swan-neck wing, side intakes, rear fins
    foil(0.92, 0.2, carb, 0, 0.3, -0.6, 0.16);
    for (const sx of [-1, 1]) { box(0.008, 0.09, 0.15, carb, sx * 0.46, 0.3, -0.6); box(0.014, 0.18, 0.05, carb, sx * 0.2, 0.2, -0.58, -0.3); box(0.012, 0.07, 0.2, black, sx * 0.465, -0.08, -0.18, 0, sx * 0.12); }
    for (let k = 0; k < 4; k++) box(0.5, 0.006, 0.03, black, 0, surf(-0.36 - k * 0.05) + 0.003, -0.36 - k * 0.05, 0.1);
  } else if (sp === "fin") { // Nova-X: tail fin
    const fs = new THREE.Shape(); fs.moveTo(0, 0); fs.lineTo(0.22, 0); fs.lineTo(0.06, 0.13); fs.lineTo(0, 0.13); fs.closePath();
    const fg = new THREE.ExtrudeGeometry(fs, { depth: 0.012, bevelEnabled: false }); fg.translate(0, 0, -0.006); fg.rotateY(-Math.PI / 2);
    const fin = mesh(fg, paintPlain); fin.position.set(0, S.TOP(-0.62) - 0.005, -0.64);
    box(0.012, 0.11, 0.004, accentGlow, 0, S.TOP(-0.62) + 0.055, -0.6, 0.48, 0, 0, false);
  } else if (sp === "armor") { // Bastion: armor plates, ram bumper, roof hatch, roof light
    for (const sx of [-1, 1]) {
      for (const [z, w] of [[-0.06, 0.34], [0.36, 0.14], [-0.5, 0.1]]) box(0.02, 0.1, w, armor, sx * (S.HALFW(z) + 0.006), -0.11, z);
      for (const z of [-0.2, -0.06, 0.08]) cyl(0.008, 0.008, 0.006, chrome, sx * (S.HALFW(z) + 0.017), -0.08, z, 0, 0, Math.PI / 2, 8);
    }
    box(0.7, 0.06, 0.05, armor, 0, -0.19, z1 + 0.005); box(0.62, 0.05, 0.045, armor, 0, -0.17, S.z0 - 0.005);
    box(0.18, 0.02, 0.18, armor, 0, S.roofPt[0] + 0.008, S.roofPt[1]);
    box(0.24, 0.02, 0.05, black, 0, S.roofPt[0] + 0.012, S.cabin.z1 - 0.11);
  } else if (sp === "formula") { // Apex F: open cockpit, halo, airbox, sidepods, wings, suspension arms
    const helm = mesh(new THREE.SphereGeometry(0.075, 20, 14), accentPaint); helm.position.set(0, 0.13, -0.12);
    const visor = mesh(new THREE.SphereGeometry(0.076, 20, 10, -0.9, 1.8, 1.2, 0.5), glass); visor.position.copy(helm.position); visor.rotation.y = 0;
    const cock = mesh(new THREE.CircleGeometry(1, 24), black, false); cock.scale.set(0.15, 0.2, 1); cock.rotation.x = -Math.PI / 2 + 0.06; cock.position.set(0, S.TOP(-0.1) + 0.006, -0.08);
    const halo = mesh(new THREE.TorusGeometry(0.13, 0.013, 8, 24, Math.PI), black); halo.rotation.set(-Math.PI / 2 + 0.25, 0, 0); halo.position.set(0, 0.2, -0.06);
    box(0.016, 0.1, 0.016, black, 0, 0.16, 0.08, 0.3);
    const ab = mesh(new THREE.CapsuleGeometry(0.06, 0.2, 4, 12), paintPlain); ab.rotation.x = Math.PI / 2 + 0.25; ab.scale.set(1, 1, 1.3); ab.position.set(0, 0.17, -0.32);
    for (const sx of [-1, 1]) { const pod = mesh(new THREE.CapsuleGeometry(0.075, 0.38, 4, 12), paintPlain); pod.rotation.x = Math.PI / 2; pod.scale.set(1.4, 1, 0.8); pod.position.set(sx * 0.26, -0.13, -0.2); }
    box(0.92, 0.012, 0.11, carb, 0, -0.235, z1 - 0.06, -0.06); box(0.86, 0.01, 0.06, paintPlain, 0, -0.205, z1 - 0.1, -0.2);
    for (const sx of [-1, 1]) { box(0.008, 0.07, 0.14, carb, sx * 0.46, -0.21, z1 - 0.07); box(0.008, 0.2, 0.2, carb, sx * 0.38, 0.12, -0.63); }
    foil(0.76, 0.16, paint, 0, 0.2, -0.63, 0.1); foil(0.76, 0.1, carb, 0, 0.12, -0.6, 0.25);
    for (const [wz, side] of [[S.frontZ, 1], [S.rearZ, -1]]) for (const sx of [-1, 1]) for (const dy of [0.04, -0.05]) {
      const len = S.wheelX - 0.12, arm = cyl(0.008, 0.008, len, black, sx * (0.12 + len / 2), S.restY + dy, wz + side * 0.01, 0, 0, Math.PI / 2, 6); void arm;
    }
  }
  if (S.strips) { // Nova-X glowing light strips
    for (const sx of [-1, 1]) { const st = mesh(new THREE.BoxGeometry(0.006, 0.008, 0.9), accentGlow, false); st.position.set(sx * (S.HALFW(0) + 0.002), -0.06, 0.02); }
    box(0.5, 0.008, 0.006, accentGlow, 0, S.TOP(z1 - 0.03) - 0.02, z1 - 0.012, 0, 0, 0, false);
  }

  // --- toppers (on the roof) and antennas ---
  const [roofY, roofZ] = S.roofPt;
  const anim = { prop: null, flag: null, sway: 0, swayV: 0, antenna: null, halo: null };
  const topper = opts.topper || "none";
  if (topper !== "none") {
    const tg = new THREE.Group(); tg.position.set(0, roofY, roofZ); group.add(tg);
    if (topper === "cap") { const dome = mesh(new THREE.SphereGeometry(0.085, 18, 10, 0, Math.PI * 2, 0, Math.PI / 2), accentPaint, true, tg); dome.scale.y = 0.7; const brim = mesh(new THREE.CylinderGeometry(0.075, 0.075, 0.008, 18, 1, false, -Math.PI / 2, Math.PI), accentPaint, true, tg); brim.position.set(0, 0.004, 0.06); brim.scale.z = 1.1; mesh(new THREE.SphereGeometry(0.012, 8, 6), paintPlain, false, tg).position.y = 0.06; }
    else if (topper === "cone") { const orange = new THREE.MeshStandardMaterial({ color: 0xff6a10, roughness: 0.5 }), white = new THREE.MeshStandardMaterial({ color: 0xf4f4f4, roughness: 0.4 }); const base = mesh(new THREE.BoxGeometry(0.15, 0.012, 0.15), orange, true, tg); base.position.y = 0.006; const cone = mesh(new THREE.ConeGeometry(0.06, 0.2, 18), orange, true, tg); cone.position.y = 0.11; const band = mesh(new THREE.CylinderGeometry(0.036, 0.043, 0.035, 18), white, false, tg); band.position.y = 0.11; }
    else if (topper === "propeller") { const dome = mesh(new THREE.SphereGeometry(0.08, 18, 10, 0, Math.PI * 2, 0, Math.PI / 2), accentPaint, true, tg); dome.scale.y = 0.6; const p = new THREE.Group(); p.position.y = 0.065; tg.add(p); mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.03, 6), chrome, false, tg).position.y = 0.05; for (const r of [0, Math.PI]) { const bl = mesh(new THREE.BoxGeometry(0.14, 0.004, 0.028), r ? paintPlain : accentPaint, false, p); bl.position.x = r ? -0.07 : 0.07; bl.rotation.x = r ? -0.25 : 0.25; } anim.prop = p; }
    else if (topper === "halo") { const h = mesh(new THREE.TorusGeometry(0.09, 0.012, 10, 32), new THREE.MeshStandardMaterial({ color: 0x332a10, emissive: 0xffd257, emissiveIntensity: 2.4 }), false, tg); h.rotation.x = Math.PI / 2; h.position.y = 0.15; anim.halo = h; }
    else if (topper === "graduate") { const blk = new THREE.MeshStandardMaterial({ color: 0x15161a, roughness: 0.6 }); const cap = mesh(new THREE.CylinderGeometry(0.06, 0.065, 0.05, 18), blk, true, tg); cap.position.y = 0.025; const board = mesh(new THREE.BoxGeometry(0.17, 0.008, 0.17), blk, true, tg); board.position.y = 0.054; board.rotation.y = Math.PI / 4; const tas = mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.07, 6), new THREE.MeshStandardMaterial({ color: 0xffc23a, emissive: 0x6a4a00 }), false, tg); tas.position.set(0.075, 0.025, 0.0); }
    else if (topper === "crown") { const gold = new THREE.MeshStandardMaterial({ color: 0xe9c25a, metalness: 1, roughness: 0.2 }); const band = mesh(new THREE.CylinderGeometry(0.07, 0.065, 0.045, 24, 1, true), gold, true, tg); band.material.side = THREE.DoubleSide; band.position.y = 0.025; for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3, pt = mesh(new THREE.ConeGeometry(0.018, 0.05, 8), gold, false, tg); pt.position.set(Math.cos(a) * 0.066, 0.07, Math.sin(a) * 0.066); const gem = mesh(new THREE.SphereGeometry(0.009, 8, 6), new THREE.MeshStandardMaterial({ color: 0x400010, emissive: 0xff2050, emissiveIntensity: 1.5 }), false, tg); gem.position.set(Math.cos(a) * 0.07, 0.03, Math.sin(a) * 0.07); } }
  }
  const antenna = opts.antenna || "none";
  if (antenna !== "none") {
    const az = S.cabin ? Math.max(S.cabin.z0 + 0.05, S.z0 + 0.12) : -0.62, ax = S.open ? 0.0 : 0.22, ay = S.cabin ? S.TOP(az) - S.DIP(az) * 0.5 : 0.24;
    const a = new THREE.Group(); a.position.set(-ax, ay, az); group.add(a); anim.antenna = a;
    const pole = mesh(new THREE.CylinderGeometry(0.003, 0.004, 0.32, 6), black, false, a); pole.position.y = 0.16;
    if (antenna === "flag") { const fg = new THREE.PlaneGeometry(0.11, 0.07, 6, 1); fg.translate(0.055, 0, 0); const fl = mesh(fg, new THREE.MeshStandardMaterial({ map: liveryFlag(primary, accent), side: THREE.DoubleSide, roughness: 0.8 }), false, a); fl.position.y = 0.28; fl.rotation.y = Math.PI / 2; anim.flag = fl; }
    else if (antenna === "ball") { const b = mesh(new THREE.SphereGeometry(0.03, 14, 10), new THREE.MeshStandardMaterial({ color: 0xf2f2f2, roughness: 0.4 }), false, a); b.position.y = 0.33; const ring2 = mesh(new THREE.TorusGeometry(0.031, 0.004, 6, 18), accentGlow, false, a); ring2.position.y = 0.33; }
    else if (antenna === "star") { const st = new THREE.Shape(); for (let i = 0; i < 10; i++) { const r = i % 2 ? 0.018 : 0.042, ang = Math.PI / 2 + i * Math.PI / 5; st[i ? "lineTo" : "moveTo"](Math.cos(ang) * r, Math.sin(ang) * r); } st.closePath(); const sg = new THREE.ExtrudeGeometry(st, { depth: 0.01, bevelEnabled: false }); sg.translate(0, 0, -0.005); const s = mesh(sg, new THREE.MeshStandardMaterial({ color: 0x3a2a00, emissive: 0xffd257, emissiveIntensity: 1.8 }), false, a); s.position.y = 0.33; s.rotation.y = Math.PI / 2; }
  }

  // --- wheels: pivot (steering + suspension) -> side (mirror for left/right) -> spin (rolling) ---
  const WP = wheelParts(), tireKind = opts.tires || "street", rimStyle = RIMS.includes(opts.rims) ? opts.rims : "twin5";
  const tireMat = new THREE.MeshStandardMaterial({ color: 0x141416, roughness: tireKind === "slick" ? 0.68 : 0.86, metalness: 0.0, normalMap: cachedTex("tread-" + tireKind, () => treadTexture(tireKind)), normalScale: new THREE.Vector2(tireKind === "rugged" ? 1.6 : 0.9, tireKind === "rugged" ? 1.6 : 0.9) });
  const rimCol = opts.rimColor ?? (opts.rimTone === "accent" ? accent : RIM_COLORS[opts.rimTone] ?? RIM_COLORS.silver);
  const rimMat = new THREE.MeshStandardMaterial({ color: rimCol, metalness: 1, roughness: 0.2 });
  const barrelMat = new THREE.MeshStandardMaterial({ color: 0x1a1b1f, metalness: 0.8, roughness: 0.4, side: THREE.DoubleSide });
  const discMat = new THREE.MeshStandardMaterial({ color: 0x77797e, metalness: 0.9, roughness: 0.38 });
  const calMat = new THREE.MeshStandardMaterial({ color: accent, metalness: 0.3, roughness: 0.35 });
  const wallMat = new THREE.MeshStandardMaterial({ color: 0xeeeeea, roughness: 0.6, side: THREE.DoubleSide });
  const TG = tireGeometry(tireKind), RG = rimGeometry(rimStyle), wheels = [];
  for (const [x, z] of [[1, S.frontZ], [-1, S.frontZ], [1, S.rearZ], [-1, S.rearZ]]) {
    const pivot = new THREE.Group(); pivot.position.set(x * S.wheelX, S.restY, z); group.add(pivot);
    const side = new THREE.Group(); side.scale.set(x * (tireKind === "rugged" ? 1.1 : 1), S.wheelR / 0.2, S.wheelR / 0.2); pivot.add(side);
    const spin = new THREE.Group(); side.add(spin);
    const parts = [[TG, tireMat], [RG, rimMat], [WP.barrel, barrelMat], [WP.lip, chrome], [WP.disc, discMat], [WP.hub, chrome]];
    if (tireKind === "whitewall") parts.push([WP.wall, wallMat]);
    for (const [g, m] of parts) { const o = new THREE.Mesh(g, m); o.castShadow = g === TG; spin.add(o); }
    side.add(new THREE.Mesh(WP.caliper, calMat));
    wheels.push({ pivot, spin, baseY: S.restY });
  }

  const tmpV = { x: 0, y: 0, z: 0 };
  return {
    group, wheels, paint, tailMat, headMat, nozzleGlow, body: opts.body || "striker",
    nozzle: new THREE.Vector3(0, ny, nz - 0.04),
    rearWheelsLocal: [new THREE.Vector3(S.wheelX, S.restY - S.wheelR, CAR.wheelRear), new THREE.Vector3(-S.wheelX, S.restY - S.wheelR, CAR.wheelRear)],
    // pose the wheels from the physics state (comp = spring squeeze, spin = roll angle, steer = turn)
    update(car, boostAmt, braking, dt = 1 / 60) {
      car.wheels.forEach((w, i) => {
        const v = wheels[i];
        v.pivot.position.y = CAR.wheelY - (CAR.suspRest - (w.contact ? w.comp : 0)) - S.drop;
        v.pivot.rotation.y = -w.steer; v.spin.rotation.x = w.spin;
      });
      tailMat.emissiveIntensity = braking ? 7 : 2.6;
      nozzleGlow.color.setRGB(1.0 * (0.5 + boostAmt * 3), 0.45 * (0.5 + boostAmt * 2.5), 0.12 * (0.5 + boostAmt));
      this.animate(dt, car.speed ? car.speed() : 0, car.vel ? car.vel : tmpV);
    },
    // little moving parts: propeller, flag, antenna sway (springy, driven by speed changes)
    animate(dt, speed = 0) {
      if (anim.prop) anim.prop.rotation.y += dt * (6 + speed * 1.5);
      if (anim.halo) anim.halo.rotation.z += dt * 1.5;
      if (anim.antenna) { const target = -Math.min(0.5, speed * 0.02); anim.swayV += ((target - anim.sway) * 60 - anim.swayV * 4) * dt; anim.sway += anim.swayV * dt; anim.antenna.rotation.x = anim.sway; }
      if (anim.flag) anim.flag.rotation.z = Math.sin(performance.now() / 120) * 0.12;
    },
    // replays: roll the wheels by an angle and set the front-wheel steer
    spinTo(delta, steer) { for (const v of wheels) v.spin.rotation.x += delta; wheels[0].pivot.rotation.y = wheels[1].pivot.rotation.y = -steer * 0.4; },
    dispose() {
      for (const g of owned) g.dispose();
      group.traverse((o) => { if (o.material) for (const m of [].concat(o.material)) { if (m.map && m.map !== carbon() && !Object.values(texCache).includes(m.map)) m.map.dispose(); m.dispose(); } });
    },
  };
}
function liveryFlag(primary, accent) {
  const c = canvas(64, 40), g = c.getContext("2d");
  g.fillStyle = "#" + new THREE.Color(primary).getHexString(); g.fillRect(0, 0, 64, 40);
  g.fillStyle = "#" + new THREE.Color(accent).getHexString(); g.beginPath(); g.moveTo(0, 0); g.lineTo(64, 20); g.lineTo(0, 40); g.closePath(); g.fill();
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
// the hitbox every body shares (for the garage's "show hitbox" view and FEATURES.md)
export const HITBOX = { half: CAR.half.slice() };
export const bodyIds = Object.keys(BODIES);
