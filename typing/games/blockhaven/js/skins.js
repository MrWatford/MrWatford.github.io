// Player skins: blocky player models, the skin chooser's pictures, and the first-person arm.
// Skins only change how you look. Every skin has the same body size, collision box, and abilities.
import * as THREE from "../lib/three.module.min.js";

// ---------- painting helpers (each box face is a 16×16 square of the skin picture) ----------
function seeded(seed) { let s = seed >>> 0 || 1; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }
function painter(ctx, ox, oy, r) {
  const P = {
    px(x, y, c) { if (x < 0 || y < 0 || x > 15 || y > 15) return; ctx.fillStyle = c; ctx.fillRect(ox + x, oy + y, 1, 1); },
    rect(x, y, w, h, c) { ctx.fillStyle = c; ctx.fillRect(ox + x, oy + y, w, h); },
    fill(pal) { for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) P.px(x, y, pal[Math.floor(r() * pal.length)]); },
    noise(x, y, w, h, pal) { for (let yy = y; yy < y + h; yy++) for (let xx = x; xx < x + w; xx++) P.px(xx, yy, pal[Math.floor(r() * pal.length)]); }
  };
  return P;
}
const shade = (hex, k) => { const n = parseInt(hex.slice(1), 16), c = v => Math.max(0, Math.min(255, Math.round(v * k))); return "#" + [c(n >> 16), c((n >> 8) & 255), c(n & 255)].map(v => v.toString(16).padStart(2, "0")).join(""); };
const pal = hex => [hex, shade(hex, 0.94), shade(hex, 1.05)];

// ---------- the skins ----------
// Each skin paints: head (face = front/back/left/right/top/bottom), body, arm (side = R/L), leg.
// c = colors: skin, hair, eye, shirt, pants, shoes
function standardHead(c, extra) {
  return (P, f) => {
    P.fill(pal(c.skin));
    if (f === "top") { P.fill(pal(c.hair)); return; }
    if (f === "back") { P.fill(pal(c.hair)); P.rect(0, 13, 16, 3, shade(c.hair, 0.85)); }
    if (f === "left" || f === "right") { P.rect(0, 0, 16, 5, c.hair); P.rect(f === "left" ? 0 : 10, 5, 6, 4, c.hair); }
    if (f === "front") {
      P.rect(0, 0, 16, 4, c.hair); P.rect(0, 4, 2, 2, c.hair); P.rect(14, 4, 2, 2, c.hair);
      P.rect(3, 7, 3, 2, "#ffffff"); P.rect(10, 7, 3, 2, "#ffffff"); P.rect(4, 7, 2, 2, c.eye); P.rect(10, 7, 2, 2, c.eye);
      P.rect(7, 9, 2, 2, shade(c.skin, 0.88)); P.rect(5, 12, 6, 1, shade(c.skin, 0.62));
    }
    if (extra) extra(P, f);
  };
}
const shirtBody = (c, extra) => (P, f) => { P.fill(pal(c.shirt)); if (f === "bottom") P.fill(pal(c.pants)); if (extra) extra(P, f); };
const sleeveArm = (c, long = 8) => (P, f) => { P.fill(pal(c.skin)); if (f === "top") { P.fill(pal(c.shirt)); return; } if (f === "bottom") return; P.rect(0, 0, 16, long, c.shirt); P.noise(0, 0, 16, long, pal(c.shirt)); };
const pantsLeg = c => (P, f) => { P.fill(pal(c.pants)); if (f === "bottom") { P.fill(pal(c.shoes)); return; } if (f !== "top") P.noise(0, 12, 16, 4, pal(c.shoes)); };

export const SKINS = [
  (() => { const c = { skin: "#e0ac80", hair: "#6a4424", eye: "#3a5a2a", shirt: "#a8925a", pants: "#6a5a3a", shoes: "#4a3424" };
    return { id: "explorer", name: "Explorer", desc: "Khaki outfit and a wide-brim hat", c,
      head: standardHead(c, (P, f) => { P.rect(0, 0, 16, 3, "#7a5a32"); if (f === "front") { P.rect(0, 3, 16, 1, "#5a4022"); } if (f === "top") { P.fill(pal("#8a6a3a")); P.rect(4, 4, 8, 8, "#7a5a32"); } }),
      body: shirtBody(c, (P, f) => { if (f === "front") { P.rect(2, 2, 4, 4, shade(c.shirt, 0.85)); P.rect(10, 2, 4, 4, shade(c.shirt, 0.85)); P.rect(0, 13, 16, 2, "#5a3a20"); P.rect(7, 13, 2, 2, "#d8b040"); } }),
      arm: sleeveArm(c, 6), leg: pantsLeg(c) }; })(),
  (() => { const c = { skin: "#c88a5a", hair: "#2a2018", eye: "#4a2a10", shirt: "#3a6ab0", pants: "#3a4a6a", shoes: "#5a3a1a" };
    return { id: "builder", name: "Builder", desc: "Hard hat and a bright safety vest", c,
      head: standardHead(c, (P, f) => { if (f === "top") P.fill(pal("#f0c020")); else { P.rect(0, 0, 16, 4, "#f0c020"); if (f === "front") P.rect(0, 4, 16, 1, "#c89a10"); } }),
      body: shirtBody(c, (P, f) => { if (f !== "top" && f !== "bottom") { P.noise(0, 0, 16, 16, pal("#f07a1a")); P.rect(0, 8, 16, 2, "#e8e8e8"); if (f === "front") { P.rect(6, 0, 4, 16, c.shirt); P.rect(0, 13, 16, 2, "#5a4020"); } } }),
      arm: sleeveArm(c, 16), leg: pantsLeg(c) }; })(),
  (() => { const c = { skin: "#e8b890", hair: "#3a3a3a", eye: "#2a4a8a", shirt: "#9aa0a8", pants: "#8a9098", shoes: "#5a5e64" };
    const steel = ["#a8aeb6", "#9aa0a8", "#b4bac2"];
    return { id: "knight", name: "Knight", desc: "Steel armor and a red tabard", c,
      head: (P, f) => { P.fill(steel); if (f === "front") { P.rect(2, 6, 12, 2, "#1a1a1a"); P.rect(7, 8, 2, 6, "#1a1a1a"); P.rect(3, 10, 2, 1, "#6a6e74"); P.rect(11, 10, 2, 1, "#6a6e74"); } if (f === "top") { P.rect(7, 2, 2, 12, "#c02a2a"); } },
      body: (P, f) => { P.fill(steel); if (f === "front" || f === "back") { P.rect(3, 0, 10, 16, "#b02a2a"); P.noise(3, 0, 10, 16, ["#b02a2a", "#a02424"]); P.rect(6, 3, 4, 7, "#f0d050"); P.rect(4, 5, 8, 2, "#f0d050"); } },
      arm: (P, f) => { P.fill(steel); if (f !== "top" && f !== "bottom") P.rect(0, 12, 16, 4, "#6a6e74"); },
      leg: (P, f) => { P.fill(steel); if (f !== "top" && f !== "bottom") { P.rect(0, 6, 16, 1, "#6a6e74"); P.rect(0, 13, 16, 3, "#5a5e64"); } } }; })(),
  (() => { const c = { skin: "#f0c8a0", hair: "#5a3a20", eye: "#2a2a2a", shirt: "#f0f0f0", pants: "#e8e8e8", shoes: "#8a8a8a" };
    const suit = ["#f4f4f4", "#e8e8ec", "#fafafa"];
    return { id: "astronaut", name: "Astronaut", desc: "Space suit with a gold visor", c,
      head: (P, f) => { P.fill(suit); if (f === "front") { P.rect(2, 3, 12, 9, "#d8a020"); P.rect(3, 4, 4, 2, "#ffe890"); P.rect(2, 12, 12, 1, "#9a9a9a"); } if (f === "left" || f === "right") P.rect(5, 6, 6, 5, "#c0c0c8"); },
      body: (P, f) => { P.fill(suit); if (f === "front") { P.rect(4, 3, 8, 6, "#c8ccd4"); P.rect(5, 4, 2, 2, "#e04030"); P.rect(9, 4, 2, 2, "#3a8ae0"); P.rect(5, 7, 6, 1, "#5a5e64"); P.rect(1, 1, 3, 2, "#3a5ad8"); } if (f === "back") { P.rect(2, 1, 12, 12, "#c0c4cc"); P.rect(4, 3, 3, 8, "#9aa0a8"); P.rect(9, 3, 3, 8, "#9aa0a8"); } },
      arm: (P, f) => { P.fill(suit); if (f !== "top" && f !== "bottom") { P.rect(0, 5, 16, 1, "#c0c4cc"); P.rect(0, 12, 16, 4, "#9aa0a8"); } },
      leg: (P, f) => { P.fill(suit); if (f !== "top" && f !== "bottom") { P.rect(0, 5, 16, 1, "#c0c4cc"); P.rect(0, 11, 16, 5, "#8a8e94"); } } }; })(),
  (() => { const c = { skin: "#8a96a4", hair: "#5a6674", eye: "#40e0ff", shirt: "#7a8694", pants: "#6a7684", shoes: "#4a5664" };
    const metal = ["#8a96a4", "#808c9a", "#96a2b0"];
    return { id: "robot", name: "Robot", desc: "Shiny metal with glowing eyes", c,
      head: (P, f) => { P.fill(metal); P.rect(0, 0, 16, 1, "#b4c0ce"); if (f === "front") { P.rect(2, 5, 5, 3, "#1a2a3a"); P.rect(9, 5, 5, 3, "#1a2a3a"); P.rect(3, 6, 3, 1, "#40e0ff"); P.rect(10, 6, 3, 1, "#40e0ff"); P.rect(4, 11, 8, 2, "#1a2a3a"); for (let x = 5; x < 12; x += 2) P.rect(x, 11, 1, 2, "#40e0ff"); } if (f === "top") { P.rect(7, 6, 2, 4, "#e04030"); } if (f === "left" || f === "right") P.rect(5, 5, 6, 6, "#5a6674"); },
      body: (P, f) => { P.fill(metal); if (f === "front") { P.rect(3, 2, 10, 8, "#5a6674"); P.rect(4, 3, 2, 2, "#40ff80"); P.rect(7, 3, 2, 2, "#f0c020"); P.rect(10, 3, 2, 2, "#e04030"); P.rect(4, 7, 8, 1, "#40e0ff"); } P.rect(0, 14, 16, 1, "#5a6674"); },
      arm: (P, f) => { P.fill(metal); if (f !== "top" && f !== "bottom") { P.rect(0, 4, 16, 1, "#5a6674"); P.rect(0, 9, 16, 1, "#5a6674"); P.rect(0, 13, 16, 3, "#5a6674"); } },
      leg: (P, f) => { P.fill(metal); if (f !== "top" && f !== "bottom") { P.rect(0, 6, 16, 1, "#5a6674"); P.rect(0, 13, 16, 3, "#4a5664"); } } }; })(),
  (() => { const c = { skin: "#d8a070", hair: "#c88a3a", eye: "#2a6a3a", shirt: "#3a8a3a", pants: "#7a5a32", shoes: "#4a3020" };
    return { id: "adventurer", name: "Adventurer", desc: "Green tunic, leather belt, and a satchel", c,
      head: standardHead(c, (P, f) => { if (f === "top") P.fill(pal("#2a6a2a")); else { P.rect(0, 0, 16, 2, "#2a6a2a"); } }),
      body: shirtBody(c, (P, f) => { if (f !== "top" && f !== "bottom") { P.rect(0, 11, 16, 2, "#5a3a1a"); if (f === "front") { P.rect(7, 11, 2, 2, "#d8b040"); for (let i = 0; i < 11; i++) P.px(2 + i, i, "#5a3a1a"); } } }),
      arm: sleeveArm(c, 5), leg: (P, f) => { pantsLeg(c)(P, f); if (f !== "top" && f !== "bottom") P.rect(0, 9, 16, 7, c.shoes); } }; })(),
  // Mr. Watford, based on the cartoon Mr. Watford from his class videos (images/mr-watford/face.png): short auburn hair,
  // a full ginger beard, blue eyes, fair skin with rosy cheeks, and a blue button-up shirt with a collar
  (() => { const c = { skin: "#f2c6a0", hair: "#b8642e", beard: "#c0703a", eye: "#3a7ad8", shirt: "#4a7ad8", pants: "#3a4250", shoes: "#4a3424" };
    return { id: "watford", name: "Mr. Watford", desc: "Your teacher! Auburn hair, ginger beard, and his blue button-up shirt", c,
      head: (P, f) => {
        P.fill(pal(c.skin));
        if (f === "top") { P.fill(pal(c.hair)); return; }
        if (f === "bottom") { P.fill(pal(c.beard)); return; }
        if (f === "back") { P.fill(pal(c.hair)); P.rect(0, 12, 16, 4, shade(c.hair, 0.9)); return; }
        if (f === "left" || f === "right") { P.rect(0, 0, 16, 5, c.hair); P.noise(0, 0, 16, 5, pal(c.hair)); P.rect(f === "left" ? 0 : 9, 5, 7, 2, c.hair); P.rect(f === "left" ? 8 : 4, 6, 3, 3, shade(c.skin, 0.9)); P.noise(0, 9, 16, 7, pal(c.beard)); P.rect(f === "left" ? 0 : 12, 8, 4, 2, c.beard); return; }
        // front: hair swept to one side, eyebrows, blue eyes, rosy cheeks, ginger beard with a smile
        P.noise(0, 0, 16, 4, pal(c.hair)); P.rect(9, 3, 7, 1, c.hair); P.rect(0, 4, 2, 2, c.hair); P.rect(14, 4, 2, 2, c.hair);
        P.rect(3, 5, 4, 1, "#7a3e1c"); P.rect(9, 5, 4, 1, "#7a3e1c");
        P.rect(3, 6, 4, 3, "#ffffff"); P.rect(9, 6, 4, 3, "#ffffff"); P.rect(4, 6, 2, 3, c.eye); P.rect(10, 6, 2, 3, c.eye); P.px(4, 7, "#1a2a4a"); P.px(10, 7, "#1a2a4a"); P.px(5, 6, "#d8e8ff"); P.px(11, 6, "#d8e8ff");
        P.rect(2, 9, 2, 2, "#f0a090"); P.rect(12, 9, 2, 2, "#f0a090");
        P.rect(7, 8, 2, 3, shade(c.skin, 0.88));
        P.noise(0, 10, 2, 6, pal(c.beard)); P.noise(14, 10, 2, 6, pal(c.beard)); P.noise(2, 11, 12, 5, pal(c.beard)); P.rect(4, 11, 8, 1, shade(c.beard, 0.9));
        P.rect(5, 12, 6, 2, "#8a2a2a"); P.rect(6, 12, 4, 1, "#ffffff");
        for (const [x, y] of [[3, 14], [11, 13], [8, 15], [13, 11]]) P.px(x, y, shade(c.beard, 0.8));
      },
      body: (P, f) => {
        P.fill(pal(c.shirt));
        if (f === "bottom") { P.fill(pal(c.pants)); return; }
        if (f === "front") { P.rect(5, 0, 6, 3, "#6a96e8"); P.rect(7, 0, 2, 4, shade(c.shirt, 0.8)); P.rect(7, 4, 2, 12, shade(c.shirt, 0.92)); for (const y of [5, 9, 13]) P.px(8, y, "#ffffff"); P.rect(3, 4, 3, 3, shade(c.shirt, 0.9)); P.rect(0, 15, 16, 1, "#3a2a1a"); }
        if (f === "top") P.rect(5, 0, 6, 16, "#6a96e8");
      },
      arm: (P, f) => { P.fill(pal(c.shirt)); if (f === "top") return; if (f === "bottom") { P.fill(pal(c.skin)); return; } P.rect(0, 12, 16, 4, c.skin); P.rect(0, 11, 16, 1, shade(c.shirt, 0.8)); },
      leg: pantsLeg(c) }; })()
];
export const skinById = id => SKINS.find(s => s.id === id) || SKINS[0];

// ---------- models ----------
// Parts in model units (16 = one block). The model is 32 units tall and drawn at 0.9 scale (1.8 blocks, like the player).
const PARTS = [
  { name: "head", size: [8, 8, 8], pivot: [0, 24, 0], off: [0, 4, 0], paint: "head" },
  { name: "body", size: [8, 12, 4], pivot: [0, 12, 0], off: [0, 6, 0], paint: "body" },
  { name: "armR", size: [4, 12, 4], pivot: [-6, 22, 0], off: [0, -4, 0], paint: "arm" },
  { name: "armL", size: [4, 12, 4], pivot: [6, 22, 0], off: [0, -4, 0], paint: "arm" },
  { name: "legR", size: [4, 12, 4], pivot: [-2, 12, 0], off: [0, -6, 0], paint: "leg" },
  { name: "legL", size: [4, 12, 4], pivot: [2, 12, 0], off: [0, -6, 0], paint: "leg" }
];
const FACES = ["right", "left", "top", "bottom", "front", "back"];   // BoxGeometry order: +x −x +y −y +z −z
const built = new Map();   // skin id → { tex, geos, canvas }
function buildSkin(skin) {
  if (built.has(skin.id)) return built.get(skin.id);
  const canvas = document.createElement("canvas"); canvas.width = canvas.height = 128;
  const ctx = canvas.getContext("2d"), r = seeded(skin.id.length * 977 + skin.id.charCodeAt(0));
  const geos = {}, tiles = {};
  PARTS.forEach((part, pi) => {
    const g = new THREE.BoxGeometry(part.size[0] / 16, part.size[1] / 16, part.size[2] / 16), uv = g.attributes.uv;
    FACES.forEach((face, f) => {
      const tile = pi * 6 + f, tx = (tile % 8) * 16, ty = Math.floor(tile / 8) * 16;
      skin[part.paint](painter(ctx, tx, ty, r), face, part.name.endsWith("R") ? "R" : "L");
      tiles[part.name + ":" + face] = [tx, ty];
      for (let k = 0; k < 4; k++) { const i = f * 4 + k, u = uv.getX(i), v = uv.getY(i); uv.setXY(i, (tx + 0.05 + u * 15.9) / 128, 1 - (ty + 0.05 + (1 - v) * 15.9) / 128); }
    });
    uv.needsUpdate = true; geos[part.name] = g;
  });
  const tex = new THREE.CanvasTexture(canvas); tex.magFilter = tex.minFilter = THREE.NearestFilter; tex.generateMipmaps = false;
  const b = { tex, geos, canvas, tiles };
  built.set(skin.id, b);
  return b;
}
// Armor worn over the model: [slot, part names, grow]
const ARMOR_FIT = [[0, ["head"], 1.2], [1, ["body", "armR", "armL"], 1], [2, ["legR", "legL"], 0.8], [3, ["legR", "legL"], 1]];
export function makeModel(skinId) {
  const skin = skinById(skinId), b = buildSkin(skin);
  const mat = new THREE.MeshBasicMaterial({ map: b.tex });
  const root = new THREE.Group(), parts = {};
  for (const p of PARTS) {
    const pivot = new THREE.Group(); pivot.position.set(p.pivot[0] / 16, p.pivot[1] / 16, p.pivot[2] / 16);
    const m = new THREE.Mesh(b.geos[p.name], mat); m.position.set(p.off[0] / 16, p.off[1] / 16, p.off[2] / 16);
    pivot.add(m); root.add(pivot); parts[p.name] = pivot;
  }
  root.scale.setScalar(0.9);
  const holder = new THREE.Group(); holder.add(root);
  return { holder, root, parts, mat, skinId: skin.id, armor: {}, held: {} };
}
// Show armor pieces (colors from the armor item) — rebuilt only when what you wear changes
export function dressModel(model, armorColors) {
  const key = armorColors.join("|");
  if (model.armorKey === key) return;
  model.armorKey = key;
  for (const list of Object.values(model.armor)) for (const m of list) { m.parent.remove(m); m.geometry.dispose(); for (const x of [].concat(m.material)) x.dispose(); }
  model.armor = {};
  ARMOR_FIT.forEach(([slot, names, grow]) => {
    const col = armorColors[slot];
    if (!col) return;
    model.armor[slot] = names.map(n => {
      const p = PARTS.find(q => q.name === n), sx = (p.size[0] + grow) / 16, sy = (slot === 2 ? 7 : slot === 3 ? 4.5 : p.size[1] + grow) / 16, sz = (p.size[2] + grow) / 16;
      const solid = new THREE.MeshBasicMaterial({ color: col });
      // helmets leave the face open (the front side of the box is see-through)
      const mat = slot === 0 ? [solid, solid, solid, solid, helmetFront(col), solid] : solid;
      const m = new THREE.Mesh(new THREE.BoxGeometry(sx, sy, sz), mat);
      const base = model.parts[n].children[0];
      m.position.copy(base.position);
      if (slot === 2) m.position.y += (p.size[1] - 7) / 32;        // leggings cover the top of the legs
      if (slot === 3) m.position.y -= (p.size[1] - 4.5) / 32;      // boots cover the bottom
      if (slot === 1 && n !== "body") { m.scale.y = 0.45; m.position.y += p.size[1] * 0.55 / 32; }   // chestplate shoulders
      model.parts[n].add(m);
      return m;
    });
  });
}
// The front of a helmet: a rim around an open face
const rimCache = new Map();
function helmetFront(col) {
  if (!rimCache.has(col)) {
    const c = document.createElement("canvas"); c.width = c.height = 16;
    const x = c.getContext("2d"); x.fillStyle = col; x.fillRect(0, 0, 16, 4); x.fillRect(0, 0, 2, 12); x.fillRect(14, 0, 2, 12);
    x.fillStyle = "rgba(0,0,0,.25)"; x.fillRect(0, 3, 16, 1);
    const t = new THREE.CanvasTexture(c); t.magFilter = t.minFilter = THREE.NearestFilter; t.generateMipmaps = false;
    rimCache.set(col, t);
  }
  return new THREE.MeshBasicMaterial({ map: rimCache.get(col), alphaTest: 0.5, transparent: true });
}
// Animate the model: walking, crouching, swinging, aiming, eating, blocking
export function poseModel(model, s) {
  const P = model.parts, walk = Math.sin(s.walkPhase) * Math.min(1, s.speed / 4) * 0.8;
  P.legR.rotation.x = walk; P.legL.rotation.x = -walk;
  P.armR.rotation.set(-walk * 0.8, 0, 0); P.armL.rotation.set(walk * 0.8, 0, 0);
  P.head.rotation.set(-s.pitch, 0, 0);
  model.root.position.y = 0; P.body.rotation.x = 0;
  if (s.crouch) { P.body.rotation.x = 0.45; P.head.position.z = 0.12; model.root.position.y = -0.12; P.armR.rotation.x += 0.4; P.armL.rotation.x += 0.4; } else P.head.position.z = 0;
  if (s.swing > 0) P.armR.rotation.x = -Math.sin(Math.min(1, s.swing) * Math.PI) * 1.6 - 0.3;
  if (s.eating === "R" || s.bow) P.armR.rotation.set(-1.3 - s.pitch, -0.3, 0);
  if (s.eating === "L" || s.bow) P.armL.rotation.set(-1.3 - s.pitch, 0.3, 0);
  if (s.blocking === "R") P.armR.rotation.set(-0.9, -0.5, 0);
  if (s.blocking === "L") P.armL.rotation.set(-0.9, 0.5, 0);
  if (s.riding) { P.legR.rotation.set(-1.4, 0.3, 0); P.legL.rotation.set(-1.4, -0.3, 0); }
}
// Put item meshes in the model's hands (made by the game, so they match the first-person view)
export function holdItems(model, mainMesh, offMesh) {
  for (const [side, mesh] of [["armR", mainMesh], ["armL", offMesh]]) {
    const cur = model.held[side];
    if (cur === mesh) continue;
    if (cur) model.parts[side].remove(cur);
    model.held[side] = mesh || null;
    // items stand upright in the fist, facing sideways (a shield's face points out from the arm)
    if (mesh) { mesh.position.set(0, -0.7, -0.12); mesh.scale.setScalar(mesh.userData.multi ? 2.6 : 1.7); mesh.rotation.set(0, 0, 0); if (mesh.geometry.type === "PlaneGeometry") mesh.rotation.z = side === "armR" ? Math.PI / 4 : -Math.PI / 4; model.parts[side].add(mesh); }
  }
}
export function disposeModel(model) {
  dressModel(model, []);
  model.mat.dispose();
}
// The first-person arm: a piece of the skin's own arm, so sleeves and hands match
export function firstPersonArm(skinId) {
  const b = buildSkin(skinById(skinId));
  const m = new THREE.Mesh(b.geos.armR, new THREE.MeshBasicMaterial({ map: b.tex }));
  m.rotation.set(-Math.PI / 2 + 0.2, 0, 0); m.scale.setScalar(0.55);
  return m;
}

// ---------- pictures for the chooser ----------
// A flat front view drawn from the skin's own face pictures
export function thumbnail(skinId, size = 96) {
  const b = buildSkin(skinById(skinId)), c = document.createElement("canvas");
  c.width = size; c.height = Math.round(size * 1.7);
  const x = c.getContext("2d"); x.imageSmoothingEnabled = false;
  const u = size / 20;   // one model unit
  const draw = (part, dx, dy, w, h) => { const [tx, ty] = b.tiles[part + ":front"]; x.drawImage(b.canvas, tx, ty, 16, 16, dx * u, dy * u, w * u, h * u); };
  const ox = 6;
  draw("head", ox, 1, 8, 8); draw("body", ox, 9, 8, 12); draw("armR", ox - 4, 9, 4, 12); draw("armL", ox + 8, 9, 4, 12); draw("legR", ox, 21, 4, 12); draw("legL", ox + 4, 21, 4, 12);
  return c;
}
