// Milestone 21, Part D: paintings (12 original pictures painted here, 16 pixels per block) and the things item frames
// and armor stands hold. The blocks themselves are thin wooden backs (blocks.js); this file draws what's on them.
// What each one holds is saved with the world's chests: "x,y,z" → { type: "frame" | "stand" | "painting" | "paintpart" }.
import { DIR } from "./shapes.js";

const sky = (P, top, bottom, h) => { for (let y = 0; y < h; y++) { const t = y / Math.max(1, h - 1); P.rect(0, y, P.w, 1, mix(top, bottom, t)); } };
function mix(a, b, t) { const x = parseInt(a.slice(1), 16), y = parseInt(b.slice(1), 16); return "#" + [16, 8, 0].map(s => Math.round(((x >> s) & 255) * (1 - t) + ((y >> s) & 255) * t).toString(16).padStart(2, "0")).join(""); }
const hills = (P, y0, amp, freq, phase, color) => { for (let x = 0; x < P.w; x++) { const y = Math.round(y0 + Math.sin(x * freq + phase) * amp); P.rect(x, y, 1, P.h - y, color); } };

// [key, name, width, height (blocks), paint(P)]  P: { w, h, rect(x, y, w, h, color) } in pixels
export const PAINTINGS = [
  ["apple", "Red Apple", 1, 1, P => { P.rect(0, 0, 16, 16, "#e8dcc0"); P.rect(4, 6, 8, 7, "#c0302a"); P.rect(5, 5, 6, 9, "#c0302a"); P.rect(6, 6, 2, 2, "#e86a5a"); P.rect(8, 2, 1, 4, "#5a3a1a"); P.rect(9, 3, 3, 2, "#4a9a3a"); P.rect(0, 14, 16, 2, "#a08a6a"); }],
  ["cottage", "Little Cottage", 1, 1, P => { sky(P, "#7ec0f0", "#cfe8f8", 10); P.rect(0, 10, 16, 6, "#5a9a3a"); P.rect(4, 7, 8, 6, "#e8d8b8"); for (let i = 0; i < 5; i++) P.rect(3 + i, 7 - i, 10 - i * 2, 1, "#a8402a"); P.rect(7, 10, 2, 3, "#6a4428"); P.rect(10, 8, 2, 2, "#8cc8f0"); }],
  ["moon", "Crescent Moon", 1, 1, P => { P.rect(0, 0, 16, 16, "#141a3a"); P.rect(5, 3, 7, 10, "#f2e8b0"); P.rect(4, 5, 1, 6, "#f2e8b0"); P.rect(8, 3, 5, 9, "#141a3a"); for (const [x, y] of [[2, 2], [13, 4], [11, 13], [3, 12], [14, 9]]) P.rect(x, y, 1, 1, "#ffffff"); }],
  ["flowers", "Flower Pot", 1, 1, P => { P.rect(0, 0, 16, 16, "#d8e4ec"); P.rect(5, 10, 6, 5, "#b06a3a"); P.rect(4, 10, 8, 1, "#c27a48"); P.rect(7, 5, 1, 5, "#3a8a2a"); P.rect(10, 6, 1, 4, "#3a8a2a"); P.rect(6, 3, 3, 3, "#e84a6a"); P.rect(9, 4, 3, 3, "#f0c030"); P.rect(7, 4, 1, 1, "#ffe080"); }],
  ["sunset", "Sunset Hills", 2, 1, P => { sky(P, "#f08a3a", "#f8d070", 12); P.rect(20, 5, 6, 6, "#fff0a0"); hills(P, 10, 2, 0.25, 0, "#7a4a6a"); hills(P, 12, 1.5, 0.4, 2, "#4a3050"); }],
  ["sailboat", "Sailboat", 2, 1, P => { sky(P, "#6ab0e8", "#c8e6f8", 10); P.rect(0, 10, 32, 6, "#2a6ab0"); for (let x = 0; x < 32; x += 5) P.rect(x, 12 + (x % 2), 3, 1, "#5a9ad8"); P.rect(13, 9, 10, 2, "#8a5a30"); P.rect(17, 2, 1, 7, "#5a3a1a"); for (let i = 0; i < 6; i++) P.rect(11 + i, 3 + i, 6 - i, 1, "#f8f8f0"); P.rect(26, 3, 2, 2, "#ffffff"); }],
  ["dunes", "Desert Dunes", 2, 1, P => { sky(P, "#f8e0a0", "#f0b868", 8); P.rect(24, 2, 4, 4, "#fff4c8"); hills(P, 9, 2, 0.2, 1, "#e0b870"); hills(P, 12, 1.5, 0.3, 3, "#c89850"); P.rect(6, 4, 1, 6, "#5a8a3a"); P.rect(5, 6, 3, 1, "#5a8a3a"); }],
  ["waterfall", "Waterfall", 1, 2, P => { P.rect(0, 0, 16, 32, "#6a6a62"); P.rect(0, 0, 16, 3, "#7ec0f0"); P.rect(5, 3, 6, 23, "#8ad0f8"); for (let y = 4; y < 26; y += 3) P.rect(6 + (y % 4), y, 1, 2, "#e0f4ff"); P.rect(0, 25, 16, 7, "#2a7ab8"); P.rect(3, 26, 10, 2, "#c8ecff"); P.rect(0, 3, 4, 6, "#4a8a3a"); P.rect(12, 5, 4, 5, "#4a8a3a"); }],
  ["pine", "Tall Pine", 1, 2, P => { sky(P, "#a8d8f8", "#e8f4f8", 26); P.rect(0, 26, 16, 6, "#e8eef2"); for (let i = 0; i < 10; i++) P.rect(8 - i * 0.6 | 0, 3 + i * 2, Math.max(2, i * 1.2 | 0) + 1, 2, i % 2 ? "#2a6a3a" : "#336f42"); P.rect(7, 23, 2, 4, "#5a3a1a"); }],
  ["lake", "Mountain Lake", 2, 2, P => { sky(P, "#5aa0e8", "#bfe0f8", 16); for (let i = 0; i < 12; i++) { P.rect(4 + i, 16 - i, 22 - i * 2, 1, i > 8 ? "#f4f4f4" : "#7a7f8a"); } hills(P, 18, 1.5, 0.3, 0, "#3a7a3a"); P.rect(0, 22, 32, 10, "#2a70b0"); for (let x = 2; x < 30; x += 6) P.rect(x, 25 + (x % 3), 4, 1, "#6aa8e0"); }],
  ["castle", "Castle on a Hill", 2, 2, P => { sky(P, "#7ab8f0", "#d8ecf8", 20); hills(P, 22, 2, 0.15, 0.5, "#4a8a3a"); P.rect(9, 10, 14, 12, "#9a9a96"); for (let x = 9; x < 23; x += 3) P.rect(x, 8, 2, 2, "#9a9a96"); P.rect(6, 6, 5, 16, "#8a8a86"); P.rect(21, 6, 5, 16, "#8a8a86"); P.rect(6, 4, 5, 2, "#b03a2a"); P.rect(21, 4, 5, 2, "#b03a2a"); P.rect(14, 15, 4, 7, "#4a3020"); P.rect(15, 2, 1, 8, "#5a3a1a"); P.rect(16, 2, 4, 3, "#3a6ad0"); }],
  ["village", "Night Village", 2, 2, P => { P.rect(0, 0, 32, 32, "#101838"); for (const [x, y] of [[3, 3], [9, 6], [17, 2], [26, 5], [29, 11], [13, 10], [22, 9]]) P.rect(x, y, 1, 1, "#ffffff"); P.rect(24, 3, 4, 4, "#f4ecc0"); hills(P, 22, 1, 0.2, 0, "#1e3a22");
    for (const [x, w, h] of [[3, 7, 7], [13, 6, 9], [22, 7, 6]]) { P.rect(x, 26 - h, w, h, "#4a3a2a"); P.rect(x - 1, 25 - h, w + 2, 2, "#2a2020"); P.rect(x + 2, 28 - h, 2, 2, "#f8c45a"); } P.rect(0, 26, 32, 6, "#16301c"); }]
];
export const PAINTING_BY_KEY = Object.fromEntries(PAINTINGS.map(r => [r[0], r]));

export function createDecor({ THREE, scene, G, itemMesh, disposeItemMesh }) {
  const shown = new Map();   // "x,y,z" → { obj, sig, meshes }
  const textures = new Map();
  let t = 0, world = null;
  function artTexture(key) {
    if (textures.has(key)) return textures.get(key);
    const [, , w, h, paint] = PAINTING_BY_KEY[key] || PAINTINGS[0];
    const c = document.createElement("canvas"); c.width = w * 16; c.height = h * 16;
    const ctx = c.getContext("2d");
    const P = { w: w * 16, h: h * 16, rect(x, y, ww, hh, col) { ctx.fillStyle = col; ctx.fillRect(Math.floor(x), Math.floor(y), Math.ceil(ww), Math.ceil(hh)); } };
    paint(P);
    ctx.strokeStyle = "#6a4626"; ctx.lineWidth = 2; ctx.strokeRect(1, 1, c.width - 2, c.height - 2);   // a wooden frame
    const tex = new THREE.CanvasTexture(c); tex.magFilter = tex.minFilter = THREE.NearestFilter; tex.colorSpace = THREE.SRGBColorSpace;
    textures.set(key, tex);
    return tex;
  }
  function clear(key) { const s = shown.get(key); if (!s) return; scene.remove(s.obj); for (const m of s.meshes) m.userData.painting ? (m.geometry.dispose(), m.material.dispose()) : disposeItemMesh(m); shown.delete(key); }
  function item(id, size) { const m = itemMesh(id, size); m.userData.shared = m.userData.shared || m.geometry.type !== "PlaneGeometry"; return m; }
  function build(key, c, x, y, z, v) {
    const obj = new THREE.Group(), meshes = [], f = (v >> 8) & 3, [dx, dz] = DIR[f];
    obj.position.set(x + 0.5, y, z + 0.5);
    if (c.type === "frame") {   // the item sits just off the wall, facing out
      const s = c.slots[0];
      if (s) { const m = item(s.id, 0.36); m.rotation.z = -(c.rot || 0) * Math.PI / 4; const g = new THREE.Group(); g.add(m); g.position.set(dx * 0.4, 0.5, dz * 0.4); g.rotation.y = Math.atan2(-dx, -dz); obj.add(g); meshes.push(m); }
    } else if (c.type === "stand") {   // armor hangs where a body would wear it
      const yaw = Math.atan2(dx, dz);
      [1.3, 0.95, 0.6, 0.2].forEach((h, i) => { const s = c.slots[i]; if (!s) return; const m = item(s.id, i === 3 ? 0.3 : 0.34); m.position.y = h; m.rotation.y = yaw; obj.add(m); meshes.push(m); });
    } else if (c.type === "painting") {
      const r = PAINTING_BY_KEY[c.art] || PAINTINGS[0], w = r[2], h = r[3];
      const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: artTexture(r[0]) }));
      m.userData.painting = true;
      // (x, y, z) is the bottom-left cell; the picture spreads along c.rx/c.rz and up
      m.position.set(c.rx * (w - 1) / 2 + dx * 0.44, h / 2, c.rz * (w - 1) / 2 + dz * 0.44);
      m.rotation.y = Math.atan2(-dx, -dz);
      obj.add(m); meshes.push(m);
    }
    scene.add(obj);
    shown.set(key, { obj, sig: sigOf(c), meshes, x, y, z });
  }
  const sigOf = c => c.type + ":" + (c.slots ? c.slots.map(s => s ? s.id : 0).join(",") : "") + ":" + (c.rot || 0) + ":" + (c.art || "");
  return {
    update(dt, daylight) {
      const w = G.world;
      if (w !== world) { for (const k of [...shown.keys()]) clear(k); world = w; }
      if (!w) return;
      if ((t -= dt) <= 0) {
        t = 0.25;
        const p = G.player.pos, R = (G.settings.renderDist || 4) * 16, seen = new Set();
        for (const [key, c] of w.containers) {
          if (c.type !== "frame" && c.type !== "stand" && c.type !== "painting") continue;
          const [x, y, z] = key.split(",").map(Number);
          if (Math.abs(x - p.x) > R || Math.abs(z - p.z) > R || !w.isLoaded(x, z)) continue;
          seen.add(key);
          const s = shown.get(key);
          if (s && s.sig === sigOf(c)) continue;
          clear(key); build(key, c, x, y, z, w.get(x, y, z));
        }
        for (const k of [...shown.keys()]) if (!seen.has(k)) clear(k);
      }
      for (const s of shown.values()) {   // as bright as the spot they're in
        const L = w.lightAt(s.x, s.y, s.z), b = L ? Math.max(L[0] / 15 * daylight, L[1] / 15) : daylight, k = 0.25 + 0.75 * b;
        for (const m of s.meshes) for (const mat of Array.isArray(m.material) ? m.material : [m.material]) mat.color.setScalar(k);
      }
    },
    count: () => shown.size
  };
}
