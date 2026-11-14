// Turbo League — the MR. WATFORD CHAMPIONSHIP CUP trophy (original design, built in code) and team emblems.
import * as THREE from "../lib/three.module.min.js";

const gold = () => new THREE.MeshPhysicalMaterial({ color: 0xffd86e, metalness: 1, roughness: 0.2, clearcoat: 0.5, clearcoatRoughness: 0.1, envMapIntensity: 2.2, emissive: 0x4a2c00, emissiveIntensity: 0.55 });
function plaqueTexture() {
  const c = document.createElement("canvas"); c.width = 1024; c.height = 256; const g = c.getContext("2d");
  const grd = g.createLinearGradient(0, 0, 0, 256); grd.addColorStop(0, "#1a1a1a"); grd.addColorStop(1, "#050505"); g.fillStyle = grd; g.fillRect(0, 0, 1024, 256);
  g.strokeStyle = "#d9b04a"; g.lineWidth = 10; g.strokeRect(14, 14, 996, 228);
  g.textAlign = "center"; g.textBaseline = "middle"; g.fillStyle = "#f2cf6a"; g.shadowColor = "rgba(0,0,0,.8)"; g.shadowOffsetY = 3;
  g.font = "900 78px Georgia, 'Times New Roman', serif"; g.fillText("MR. WATFORD", 512, 96);
  g.font = "700 54px Georgia, 'Times New Roman', serif"; g.fillText("CHAMPIONSHIP CUP", 512, 176);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t;
}
// returns a Group ~1.7 m tall (scale it up for the field)
export function buildTrophy() {
  const grp = new THREE.Group(), G = gold();
  const add = (geo, mat, y = 0) => { const m = new THREE.Mesh(geo, mat); m.position.y = y; m.castShadow = true; grp.add(m); return m; };
  // base: black stepped plinth with gold trim and the engraved plaque
  const black = new THREE.MeshPhysicalMaterial({ color: 0x0b0b0d, metalness: 0.3, roughness: 0.25, clearcoat: 1, clearcoatRoughness: 0.05 });
  add(new THREE.CylinderGeometry(0.42, 0.46, 0.16, 8), black, 0.08);
  add(new THREE.CylinderGeometry(0.47, 0.47, 0.025, 8), G, 0.165);
  add(new THREE.CylinderGeometry(0.34, 0.38, 0.2, 8), black, 0.28);
  add(new THREE.CylinderGeometry(0.39, 0.39, 0.02, 8), G, 0.39);
  const plaque = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.105), new THREE.MeshStandardMaterial({ map: plaqueTexture(), metalness: 0.4, roughness: 0.3 }));
  plaque.position.set(0, 0.08, 0.4); grp.add(plaque);
  const plaque2 = plaque.clone(); plaque2.position.z = -0.4; plaque2.rotation.y = Math.PI; grp.add(plaque2);
  // stem + flared cup (one smooth lathe profile)
  const P = [[0.16, 0.4], [0.12, 0.44], [0.06, 0.52], [0.05, 0.62], [0.07, 0.68], [0.05, 0.72], [0.06, 0.76], [0.12, 0.8], [0.2, 0.86], [0.27, 0.96], [0.31, 1.08], [0.32, 1.16], [0.335, 1.2], [0.31, 1.21], [0.29, 1.17]].map(([r, y]) => new THREE.Vector2(r, y));
  const cup = new THREE.Mesh(new THREE.LatheGeometry(P, 64), G); cup.castShadow = true; grp.add(cup);
  // a wheel-rim ring around the cup (the car part of the design)
  const rim = new THREE.Mesh(new THREE.TorusGeometry(0.29, 0.018, 12, 64), G); rim.rotation.x = Math.PI / 2; rim.position.y = 0.98; grp.add(rim);
  const rim2 = rim.clone(); rim2.position.y = 1.03; rim2.scale.setScalar(1.035); grp.add(rim2);
// two big curved handles that join the rim and the bowl
for (const sx of [-1, 1]) {
  const pts = [[0.3, 1.13], [0.44, 1.15], [0.53, 1.07], [0.52, 0.97], [0.42, 0.9], [0.25, 0.88]].map(([x, y]) => new THREE.Vector3(sx * x, y, 0));
  const h = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 40, 0.026, 12), G); h.castShadow = true; grp.add(h);
}
  // the ball on top, with swept-back "spoiler" fins on each side
  const ball = new THREE.Mesh(new THREE.IcosahedronGeometry(0.2, 3), new THREE.MeshPhysicalMaterial({ color: 0xffd36a, metalness: 1, roughness: 0.22, flatShading: true, clearcoat: 0.4, envMapIntensity: 1.6 }));
  ball.position.y = 1.42; ball.castShadow = true; grp.add(ball);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.205, 0.012, 8, 48), G); ring.position.y = 1.42; ring.rotation.x = Math.PI / 2; grp.add(ring);
  const fin = new THREE.Shape(); fin.moveTo(0, 0); fin.bezierCurveTo(0.12, 0.02, 0.26, 0.1, 0.36, 0.24); fin.lineTo(0.3, 0.25); fin.bezierCurveTo(0.2, 0.14, 0.1, 0.08, 0, 0.06); fin.closePath();
  const finG = new THREE.ExtrudeGeometry(fin, { depth: 0.03, bevelEnabled: true, bevelSize: 0.006, bevelThickness: 0.006, bevelSegments: 2 });
  for (const sx of [-1, 1]) { const f = new THREE.Mesh(finG, G); f.position.set(sx * 0.16, 1.36, -0.015); f.scale.x = sx; f.rotation.z = sx * -0.15; grp.add(f); }
  add(new THREE.CylinderGeometry(0.06, 0.1, 0.1, 24), G, 1.24);
  grp.userData.ball = ball;
  return grp;
}

// ---------- team emblems (drawn on a canvas; used in menus, brackets and the Hall of Champions) ----------
function glyphPath(g, glyph, s) {
  g.beginPath();
  const star = (n, r1, r2, rot = -Math.PI / 2) => { for (let i = 0; i <= n * 2; i++) { const r = i % 2 ? r2 : r1, a = rot + (i * Math.PI) / n; g[i ? "lineTo" : "moveTo"](Math.cos(a) * r * s, Math.sin(a) * r * s); } };
  switch (glyph) {
    case "bolt": g.moveTo(0.1 * s, -0.55 * s); g.lineTo(-0.3 * s, 0.08 * s); g.lineTo(-0.02 * s, 0.08 * s); g.lineTo(-0.12 * s, 0.55 * s); g.lineTo(0.3 * s, -0.1 * s); g.lineTo(0.02 * s, -0.1 * s); g.closePath(); break;
    case "star": star(5, 0.55, 0.23); break;
    case "sun": star(12, 0.55, 0.36, 0); break;
    case "snow": for (let i = 0; i < 6; i++) { const a = (i * Math.PI) / 3; g.moveTo(0, 0); g.lineTo(Math.cos(a) * 0.55 * s, Math.sin(a) * 0.55 * s); } break;
    case "flame": g.moveTo(0, 0.5 * s); g.bezierCurveTo(-0.45 * s, 0.4 * s, -0.35 * s, -0.1 * s, -0.05 * s, -0.55 * s); g.bezierCurveTo(0, -0.2 * s, 0.25 * s, -0.25 * s, 0.2 * s, -0.42 * s); g.bezierCurveTo(0.5 * s, -0.05 * s, 0.4 * s, 0.4 * s, 0, 0.5 * s); break;
    case "crown": g.moveTo(-0.5 * s, 0.35 * s); g.lineTo(-0.5 * s, -0.25 * s); g.lineTo(-0.25 * s, 0.05 * s); g.lineTo(0, -0.4 * s); g.lineTo(0.25 * s, 0.05 * s); g.lineTo(0.5 * s, -0.25 * s); g.lineTo(0.5 * s, 0.35 * s); g.closePath(); break;
    case "wing": g.moveTo(-0.55 * s, 0.1 * s); g.bezierCurveTo(-0.2 * s, -0.5 * s, 0.3 * s, -0.5 * s, 0.55 * s, -0.4 * s); g.bezierCurveTo(0.3 * s, -0.1 * s, 0.2 * s, 0.1 * s, -0.1 * s, 0.25 * s); g.lineTo(0.2 * s, 0.2 * s); g.bezierCurveTo(0, 0.4 * s, -0.3 * s, 0.4 * s, -0.55 * s, 0.1 * s); break;
    case "planet": g.arc(0, 0, 0.3 * s, 0, Math.PI * 2); g.moveTo(0.58 * s, -0.12 * s); g.ellipse(0, 0, 0.58 * s, 0.16 * s, -0.3, 0, Math.PI * 2); break;
    case "moon": g.arc(0, 0, 0.45 * s, 0.6, Math.PI * 2 - 0.6); g.arc(0.25 * s, 0, 0.32 * s, Math.PI * 2 - 1.1, 1.1, true); break;
    case "wave": for (let k = -1; k <= 1; k++) { g.moveTo(-0.5 * s, k * 0.22 * s); g.bezierCurveTo(-0.2 * s, k * 0.22 * s - 0.2 * s, 0.2 * s, k * 0.22 * s + 0.2 * s, 0.5 * s, k * 0.22 * s); } break;
    case "tower": g.moveTo(-0.35 * s, 0.5 * s); g.lineTo(-0.3 * s, -0.3 * s); g.lineTo(-0.4 * s, -0.3 * s); g.lineTo(-0.4 * s, -0.5 * s); g.lineTo(-0.2 * s, -0.5 * s); g.lineTo(-0.2 * s, -0.4 * s); g.lineTo(-0.05 * s, -0.4 * s); g.lineTo(-0.05 * s, -0.5 * s); g.lineTo(0.05 * s, -0.5 * s); g.lineTo(0.05 * s, -0.4 * s); g.lineTo(0.2 * s, -0.4 * s); g.lineTo(0.2 * s, -0.5 * s); g.lineTo(0.4 * s, -0.5 * s); g.lineTo(0.4 * s, -0.3 * s); g.lineTo(0.3 * s, -0.3 * s); g.lineTo(0.35 * s, 0.5 * s); g.closePath(); break;
    case "fang": g.moveTo(-0.45 * s, -0.4 * s); g.lineTo(0.45 * s, -0.4 * s); g.lineTo(0.3 * s, -0.25 * s); g.lineTo(0.12 * s, 0.5 * s); g.lineTo(0, -0.15 * s); g.lineTo(-0.12 * s, 0.5 * s); g.lineTo(-0.3 * s, -0.25 * s); g.closePath(); break;
    default: g.arc(0, 0, 0.4 * s, 0, Math.PI * 2);
  }
}
function shapePath(g, shape, s) {
  g.beginPath();
  if (shape === "circle") g.arc(0, 0, s, 0, Math.PI * 2);
  else if (shape === "hex") for (let i = 0; i <= 6; i++) { const a = (i * Math.PI) / 3 + Math.PI / 6; g[i ? "lineTo" : "moveTo"](Math.cos(a) * s, Math.sin(a) * s); }
  else if (shape === "diamond") { g.moveTo(0, -s); g.lineTo(s * 0.85, 0); g.lineTo(0, s); g.lineTo(-s * 0.85, 0); g.closePath(); }
  else if (shape === "wing") { g.moveTo(-s, -0.6 * s); g.lineTo(s, -0.6 * s); g.lineTo(0.7 * s, 0.4 * s); g.lineTo(0, s); g.lineTo(-0.7 * s, 0.4 * s); g.closePath(); }
  else if (shape === "star") for (let i = 0; i <= 10; i++) { const r = i % 2 ? s * 0.62 : s, a = -Math.PI / 2 + (i * Math.PI) / 5; g[i ? "lineTo" : "moveTo"](Math.cos(a) * r, Math.sin(a) * r); }
  else { g.moveTo(-0.85 * s, -0.85 * s); g.lineTo(0.85 * s, -0.85 * s); g.lineTo(0.85 * s, 0.1 * s); g.quadraticCurveTo(0.8 * s, 0.7 * s, 0, s); g.quadraticCurveTo(-0.8 * s, 0.7 * s, -0.85 * s, 0.1 * s); g.closePath(); }
}
const cache = new Map();
export function emblemURL(t, size = 128) {
  const key = `${t.shape}|${t.glyph}|${t.primary}|${t.accent}|${size}`; if (cache.has(key)) return cache.get(key);
  const c = document.createElement("canvas"); c.width = c.height = size; const g = c.getContext("2d"), s = size * 0.44;
  g.translate(size / 2, size / 2);
  shapePath(g, t.shape, s); g.fillStyle = t.primary; g.fill(); g.lineWidth = size * 0.06; g.strokeStyle = t.accent; g.stroke();
  shapePath(g, t.shape, s * 0.82); g.lineWidth = size * 0.015; g.strokeStyle = "rgba(255,255,255,.35)"; g.stroke();
  glyphPath(g, t.glyph, s * 0.95);
  const outline = ["snow", "wave"].includes(t.glyph);
  if (outline) { g.lineWidth = size * 0.07; g.lineCap = "round"; g.strokeStyle = t.accent; g.stroke(); }
  else { g.fillStyle = t.accent; g.fill(); g.lineWidth = size * 0.02; g.strokeStyle = "rgba(0,0,0,.25)"; g.stroke(); }
  const url = c.toDataURL(); cache.set(key, url); return url;
}
