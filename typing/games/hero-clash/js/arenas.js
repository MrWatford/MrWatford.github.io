// Hero Clash: Ultimate Showdown - arenas.js
// Purely visual stage scenery. Nothing in this file affects gameplay.
// Each arena has two connected zones. Everything is built from simple
// three.js shapes plus pictures painted with the 2D canvas, so there are
// no image files to download.
import * as THREE from '../lib/three.module.min.js';

export const ARENAS = [
  { id: 'rooftops', name: 'Metro City Rooftops', blurb: 'A sunset showdown high above the city lights.', zones: ['Rooftop', 'Skyline Rail Platform'], transition: 'through the rooftop billboard', debris: 0x8a90a8 },
  { id: 'hall', name: 'Hall of Heroes', blurb: 'Marble columns, proud banners, and a place to train.', zones: ['Grand Hall', 'Simulator Chamber'], transition: 'through the training wall', debris: 0xd8cfc0 },
  { id: 'district', name: 'Gaslight District', blurb: 'Rainy cobblestones glowing under old street lamps.', zones: ['Rainy Street', 'Old Warehouse'], transition: 'through the breakaway storefront', debris: 0x8a5a44 },
  { id: 'cosmic', name: 'Cosmic Battlefield', blurb: 'A crater plain under a ringed planet and a sea of stars.', zones: ['Crater Plain', 'Floating Platform'], transition: 'onto a floating platform', debris: 0x9a86d8 },
  { id: 'lab', name: 'Underground Laboratory', blurb: 'Humming machines and glowing tubes deep below ground.', zones: ['Main Lab', 'Test Chamber'], transition: 'into the test chamber', debris: 0x9fb4b8 },
  { id: 'temple', name: 'Ancient Temple', blurb: 'Sunlit stone steps hidden in a quiet jungle.', zones: ['Temple Steps', 'Hidden Courtyard'], transition: 'through the crumbling wall', debris: 0xc8b078 },
  { id: 'volcano', name: 'Volcanic Fortress', blurb: 'A dark stone stronghold warmed by rivers of lava.', zones: ['Fortress Gate', 'Lava Bridge'], transition: 'through the ancient gateway', debris: 0x6a4038 },
  { id: 'frozen', name: 'Frozen Kingdom', blurb: 'A shining ice court beneath the northern lights.', zones: ['Ice Court', 'Crystal Cavern'], transition: 'through the icy barrier', debris: 0xbfe8ff },
];

/* ------------------------------------------------------------------ */
/* Small utilities                                                     */
/* ------------------------------------------------------------------ */
const TAU = Math.PI * 2;
const SEEDS = { rooftops: 1101, hall: 2202, district: 3303, cosmic: 4404, lab: 5505, temple: 6606, volcano: 7707, frozen: 8808 };

function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rr = (r, a, b) => a + (b - a) * r();
const pick = (r, arr) => arr[Math.floor(r() * arr.length) % arr.length];
const css = (hex, a = 1) => `rgba(${(hex >> 16) & 255},${(hex >> 8) & 255},${hex & 255},${a})`;

// World -> canvas coordinate helpers for the standard layers.
const MX = X => 512 + 16 * X;                       // mid backdrop + floor (64 units wide)
const MY = Y => 512 * (1 - (Y + 3) / 24);           // mid backdrop (y -3..21)
const FX = X => 512 + 9.31 * X;                     // far backdrop (110 units wide)
const FY = Y => 512 * (1 - (Y + 6) / 36);           // far backdrop (y -6..30)
const PZ = (Z, z0 = -13, z1 = 9) => (Z - z0) / (z1 - z0) * 512; // floor depth

/* ------------------------------------------------------------------ */
/* 2D painting helpers (shared by backdrops, floors, and thumbnails)   */
/* ------------------------------------------------------------------ */
function vgrad(g, x, y, w, h, stops) {
  const gr = g.createLinearGradient(0, y, 0, y + h);
  for (const s of stops) gr.addColorStop(s[0], s[1]);
  g.fillStyle = gr; g.fillRect(x, y, w, h);
}
function blob(g, x, y, r, hex, a) {
  const gr = g.createRadialGradient(x, y, 0, x, y, r);
  gr.addColorStop(0, css(hex, a)); gr.addColorStop(1, css(hex, 0));
  g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2);
}
function poly(g, pts, fill) {
  g.beginPath(); g.moveTo(pts[0], pts[1]);
  for (let i = 2; i < pts.length; i += 2) g.lineTo(pts[i], pts[i + 1]);
  g.closePath(); g.fillStyle = fill; g.fill();
}
function label(g, txt, x, y, size, col, weight = 'bold') {
  g.font = `${weight} ${size}px "Trebuchet MS", Verdana, sans-serif`;
  g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = col; g.fillText(txt, x, y);
}
function star5(g, x, y, R, fill, sx = 1) {
  g.beginPath();
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + i * Math.PI / 5, rad = i % 2 ? R * 0.45 : R;
    const px = x + Math.cos(a) * rad * sx, py = y + Math.sin(a) * rad;
    if (i) g.lineTo(px, py); else g.moveTo(px, py);
  }
  g.closePath(); g.fillStyle = fill; g.fill();
}
function pStars(g, w, yMax, r, n, hex = 0xffffff) {
  for (let i = 0; i < n; i++) {
    const y = r() * yMax, s = rr(r, 0.6, 1.9);
    g.fillStyle = css(hex, rr(r, 0.25, 1) * (1 - 0.6 * y / yMax));
    g.fillRect(r() * w, y, s, s);
  }
}
function pClouds(g, w, r, n, y0, y1, hex, a, size, wrap) {
  for (let i = 0; i < n; i++) {
    const cx = r() * w, cy = rr(r, y0, y1);
    for (let k = 0; k < 7; k++) {
      const bx = cx + rr(r, -1.8, 1.8) * size, by = cy + rr(r, -0.3, 0.3) * size, br = rr(r, 0.5, 1) * size;
      blob(g, bx, by, br, hex, a);
      if (wrap) { blob(g, bx - w, by, br, hex, a); blob(g, bx + w, by, br, hex, a); }
    }
  }
}
// Mountain / treeline silhouette. Frequencies are scaled so it looks the same at any canvas width.
function pRidge(g, w, h, baseY, amp, r, fill, jag = 0) {
  const k = 1024 / w, p = [r() * 9, r() * 9, r() * 9];
  const f = [rr(r, 0.004, 0.007) * k, rr(r, 0.011, 0.017) * k, rr(r, 0.03, 0.05) * k];
  g.beginPath(); g.moveTo(0, h);
  for (let x = 0; x <= w + 4; x += 4) {
    const y = baseY - amp * (0.55 * Math.abs(Math.sin(x * f[0] + p[0])) + 0.3 * Math.abs(Math.sin(x * f[1] + p[1])) + 0.15 * Math.sin(x * f[2] + p[2])) + jag * (r() - 0.5);
    g.lineTo(x, y);
  }
  g.lineTo(w, h); g.closePath(); g.fillStyle = fill; g.fill();
}
// Row of buildings with lit windows.
function pSkyline(g, w, baseY, r, o) {
  let x = -rr(r, 0, o.maxW);
  const bottom = o.bottom || baseY;
  while (x < w) {
    const bw = rr(r, o.minW, o.maxW), bh = rr(r, o.minH, o.maxH), top = baseY - bh, style = r();
    g.fillStyle = o.col; g.fillRect(x, top, bw, bottom - top);
    if (style < 0.3) { g.fillRect(x + bw * 0.2, top - bh * 0.07, bw * 0.6, bh * 0.07 + 1); g.fillRect(x + bw * 0.47, top - bh * 0.2, Math.max(1.5, bw * 0.05), bh * 0.15); }
    else if (style < 0.45) { g.beginPath(); g.moveTo(x, top + 1); g.lineTo(x + bw / 2, top - bw * 0.35); g.lineTo(x + bw, top + 1); g.fill(); }
    else if (style < 0.6) g.fillRect(x + bw * 0.1, top - 5, bw * 0.3, 6);
    if (o.edge) { g.fillStyle = o.edge; g.fillRect(x, top, bw, 2); g.fillRect(x, top, 2, bottom - top); }
    if (o.wins) {
      const cw = o.cell || 7, ch = cw * 1.25;
      for (let wy = top + ch * 0.7; wy < baseY - ch; wy += ch) {
        for (let wx = x + cw * 0.6; wx < x + bw - cw * 0.9; wx += cw) {
          if (r() < o.winP) { g.fillStyle = pick(r, o.wins); g.fillRect(wx, wy, cw * 0.55, ch * 0.5); }
        }
      }
    }
    x += bw + rr(r, 0, o.gap || 3);
  }
}
function pTiles(g, w, h, cw, ch, r, line, va = 0.05, stagger = 0) {
  let row = 0;
  for (let y = 0; y < h; y += ch, row++) {
    const ox = (row % 2) * cw * stagger;
    for (let x = -ox; x < w; x += cw) {
      const v = r();
      g.fillStyle = v < 0.5 ? `rgba(0,0,0,${va * (1 - v * 2)})` : `rgba(255,255,255,${va * (v - 0.5) * 2})`;
      g.fillRect(x, y, cw, ch);
    }
  }
  g.strokeStyle = line; g.lineWidth = 1.5; g.beginPath(); row = 0;
  for (let y = 0; y < h; y += ch, row++) {
    g.moveTo(0, y); g.lineTo(w, y);
    const ox = (row % 2) * cw * stagger;
    for (let x = -ox; x < w; x += cw) { g.moveTo(x, y); g.lineTo(x, y + ch); }
  }
  g.stroke();
}
function pSpecks(g, w, h, r, n, a = 0.08) {
  for (let i = 0; i < n; i++) {
    g.fillStyle = r() < 0.5 ? `rgba(0,0,0,${a})` : `rgba(255,255,255,${a})`;
    g.fillRect(r() * w, r() * h, rr(r, 1, 4), rr(r, 1, 3));
  }
}
// Circle lying on the floor (drawn as an ellipse because of the floor texture scale).
function floorRing(g, X, Z, R, z0 = -13, z1 = 9) {
  g.beginPath(); g.ellipse(MX(X), PZ(Z, z0, z1), 16 * R, 512 / (z1 - z0) * R, 0, 0, TAU);
}
function cracks(g, r, n, x0, y0, x1, y1, col, lw = 1.5, len = 60) {
  g.strokeStyle = col; g.lineWidth = lw;
  for (let i = 0; i < n; i++) {
    let x = rr(r, x0, x1), y = rr(r, y0, y1), a = r() * TAU;
    g.beginPath(); g.moveTo(x, y);
    for (let k = 0; k < 5; k++) { a += rr(r, -0.8, 0.8); x += Math.cos(a) * len / 5; y += Math.sin(a) * len / 10; g.lineTo(x, y); }
    g.stroke();
  }
}
function archPath(g, x, yBase, w, hgt) {
  const ry = Math.min(hgt * 0.45, w * 0.8);
  g.beginPath(); g.moveTo(x, yBase); g.lineTo(x, yBase - hgt + ry);
  g.ellipse(x + w / 2, yBase - hgt + ry, w / 2, ry, 0, Math.PI, TAU);
  g.lineTo(x + w, yBase); g.closePath();
}

/* ------------------------------------------------------------------ */
/* three.js build helpers                                              */
/* ------------------------------------------------------------------ */
function makeCtx(id, zone, opts) {
  const o = opts || {};
  const q = (o.quality === 'low' || o.quality === 'high') ? o.quality : 'medium';
  const c = {
    group: new THREE.Group(), q, low: q === 'low', high: q === 'high',
    rm: !!o.reducedMotion, rf: !!o.reducedFlash, ms: o.reducedMotion ? 0.25 : 1,
    rnd: mulberry32((SEEDS[id] || 99) * 2 + zone + 17),
    geos: new Set(), mats: [], texs: [], insts: [], ups: [], _glow: null, _plane: null,
  };
  c.group.name = `arena-${id}-${zone}`;
  return c;
}
function tex(c, w, h, paint, wrap) {
  const s = c.low ? 0.5 : 1;
  const cv = document.createElement('canvas');
  cv.width = Math.max(2, Math.round(w * s)); cv.height = Math.max(2, Math.round(h * s));
  const g = cv.getContext('2d'); g.scale(s, s);
  paint(g, w, h, c.rnd);
  const t = new THREE.CanvasTexture(cv);
  t.colorSpace = THREE.SRGBColorSpace;
  if (wrap) t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = c.low ? 1 : 4;
  c.texs.push(t); return t;
}
function std(c, color, o) {
  const m = new THREE.MeshStandardMaterial(Object.assign({ color, roughness: 0.85, metalness: 0.05 }, o));
  c.mats.push(m); return m;
}
const emis = (c, color, intensity = 1, o) => std(c, 0x111111, Object.assign({ emissive: color, emissiveIntensity: intensity }, o));
function bas(c, o) { const m = new THREE.MeshBasicMaterial(o); c.mats.push(m); return m; }
function add(c, g, m, x = 0, y = 0, z = 0, parent) {
  c.geos.add(g);
  const me = new THREE.Mesh(g, m); me.position.set(x, y, z);
  (parent || c.group).add(me); return me;
}
// y is the BOTTOM of the shape for these three.
const box = (c, w, h, d, m, x, y, z, parent) => add(c, new THREE.BoxGeometry(w, h, d), m, x, y + h / 2, z, parent);
const cyl = (c, rt, rb, h, seg, m, x, y, z, parent) => add(c, new THREE.CylinderGeometry(rt, rb, h, c.low ? Math.min(seg, 8) : seg), m, x, y + h / 2, z, parent);
const cone = (c, rad, h, seg, m, x, y, z, parent) => add(c, new THREE.ConeGeometry(rad, h, seg), m, x, y + h / 2, z, parent);
function sph(c, rad, m, x, y, z, sx = 1, sy = 1, sz = 1, parent) {
  const me = add(c, new THREE.SphereGeometry(rad, c.low ? 8 : 14, c.low ? 6 : 10), m, x, y, z, parent);
  me.scale.set(sx, sy, sz); return me;
}
function grp(c, x = 0, y = 0, z = 0, parent) { const g = new THREE.Group(); g.position.set(x, y, z); (parent || c.group).add(g); return g; }

const _d = new THREE.Object3D();
// list items: [x, y, z, sx, sy, sz, ry, rx, rz]
function inst(c, g, m, list) {
  c.geos.add(g);
  const im = new THREE.InstancedMesh(g, m, Math.max(1, list.length));
  list.forEach((p, i) => {
    _d.position.set(p[0], p[1], p[2]);
    _d.scale.set(p[3] ?? 1, p[4] ?? 1, p[5] ?? 1);
    _d.rotation.set(p[7] || 0, p[6] || 0, p[8] || 0);
    _d.updateMatrix(); im.setMatrixAt(i, _d.matrix);
  });
  im.count = list.length; im.instanceMatrix.needsUpdate = true; im.frustumCulled = false;
  c.insts.push(im); c.group.add(im); return im;
}
// Many boxes in one draw call. items: [x, yBottom, z, w, h, d, ry]
const iboxes = (c, m, items) => inst(c, new THREE.BoxGeometry(1, 1, 1), m, items.map(p => [p[0], p[1] + p[4] / 2, p[2], p[3], p[4], p[5], p[6] || 0]));
// Many cylinders. items: [x, yBottom, z, radius, height, ry]
const icyls = (c, m, items, seg = 10, topScale = 1) => inst(c, new THREE.CylinderGeometry(0.5 * topScale, 0.5, 1, c.low ? 6 : seg), m, items.map(p => [p[0], p[1] + p[4] / 2, p[2], p[3] * 2, p[4], p[3] * 2, p[5] || 0]));

// Painted flat picture standing upright. y is the bottom edge.
function backdrop(c, t, w, h, x, y, z, o = {}) {
  const see = !!(o.alpha || o.add || o.opacity !== undefined);
  const m = bas(c, {
    map: t, transparent: see, opacity: o.opacity ?? 1, fog: !!o.fog, depthWrite: !see,
    blending: o.add ? THREE.AdditiveBlending : THREE.NormalBlending, color: o.color ?? 0xffffff,
    side: o.double ? THREE.DoubleSide : THREE.FrontSide,
  });
  return add(c, new THREE.PlaneGeometry(w, h), m, x, y + h / 2, z, o.parent);
}
const far = (c, paint, o) => backdrop(c, tex(c, 1024, 512, paint), 110, 36, 0, -6, -28, o);
const mid = (c, paint, o) => backdrop(c, tex(c, 1024, 512, paint), 64, 24, 0, -3, -14, Object.assign({ alpha: true }, o));

function floor(c, paint, o = {}) {
  const z0 = o.z0 ?? -13, z1 = o.z1 ?? 9;
  const t = tex(c, 1024, 512, paint);
  const m = std(c, 0xffffff, { map: t, roughness: o.rough ?? 0.8, metalness: o.metal ?? 0.05 });
  if (o.glow) { m.emissive = new THREE.Color(0xffffff); m.emissiveMap = t; m.emissiveIntensity = o.glow; }
  const me = add(c, new THREE.PlaneGeometry(64, z1 - z0), m, 0, o.y ?? 0, (z0 + z1) / 2);
  me.rotation.x = -Math.PI / 2; return me;
}
function glowTex(c) {
  if (!c._glow) {
    c._glow = tex(c, 64, 64, g => {
      const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
      gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.35, 'rgba(255,255,255,.45)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
      g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
    });
  }
  return c._glow;
}
// Soft additive light blob. flat=true lays it on the floor as a decal.
function glow(c, color, w, h, x, y, z, opacity = 1, flat = false, parent) {
  if (!c._plane) c._plane = new THREE.PlaneGeometry(1, 1);
  const m = bas(c, { map: glowTex(c), color, transparent: true, opacity, blending: THREE.AdditiveBlending, depthWrite: false, fog: false });
  const me = add(c, c._plane, m, x, y, z, parent); me.scale.set(w, h, 1);
  if (flat) me.rotation.x = -Math.PI / 2;
  return me;
}
function pcount(c, n) {
  if (c.high) return Math.min(600, n);
  if (c.low) return Math.min(120, Math.floor(n * 0.2));
  return Math.min(300, Math.floor(n * 0.5));
}
// Drifting particle cloud. o: { box:[x0,x1,y0,y1,z0,z1], color, size, opacity, vel:[x,y,z], sway, twinkle, add }
function points(c, n, o) {
  n = pcount(c, n); if (n < 1) return null;
  const [x0, x1, y0, y1, z0, z1] = o.box, r = c.rnd;
  const pos = new Float32Array(n * 3), ph = new Float32Array(n);
  for (let i = 0; i < n; i++) { pos[i * 3] = rr(r, x0, x1); pos[i * 3 + 1] = rr(r, y0, y1); pos[i * 3 + 2] = rr(r, z0, z1); ph[i] = r() * TAU; }
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); c.geos.add(geo);
  const base = o.opacity ?? 0.8;
  const m = new THREE.PointsMaterial({ color: o.color, size: o.size || 0.08, map: glowTex(c), transparent: true, opacity: base, depthWrite: false, sizeAttenuation: true, fog: false, blending: o.add === false ? THREE.NormalBlending : THREE.AdditiveBlending });
  c.mats.push(m);
  const p = new THREE.Points(geo, m); p.frustumCulled = false; c.group.add(p);
  const [vx, vy, vz] = o.vel || [0, 0, 0], sway = o.sway || 0;
  if (vx || vy || vz || sway) {
    const X = x1 - x0, Y = y1 - y0, Z = z1 - z0;
    c.ups.push((t, dt) => {
      const k = c.ms * dt;
      for (let i = 0, j = 0; i < n; i++, j += 3) {
        let x = pos[j] + (vx + Math.sin(t * 0.7 + ph[i]) * sway) * k, y = pos[j + 1] + (vy + Math.cos(t * 0.5 + ph[i]) * sway * 0.4) * k, z = pos[j + 2] + vz * k;
        if (x > x1) x -= X; else if (x < x0) x += X;
        if (y > y1) y -= Y; else if (y < y0) y += Y;
        if (z > z1) z -= Z; else if (z < z0) z += Z;
        pos[j] = x; pos[j + 1] = y; pos[j + 2] = z;
      }
      geo.attributes.position.needsUpdate = true;
    });
  }
  if (o.twinkle) c.ups.push(t => { m.opacity = base * (0.7 + 0.3 * Math.sin(t * o.twinkle * (c.rf ? 0.5 : 1) + (o.phase || 0))); });
  return p;
}
// Falling rain streaks (thin lines).
function rain(c, n, color, bx, opacity = 0.35) {
  n = pcount(c, n); if (n < 1) return null;
  const [x0, x1, y0, y1, z0, z1] = bx, r = c.rnd, len = 0.55, slant = 0.18;
  const pos = new Float32Array(n * 6), d = new Float32Array(n * 4);
  for (let i = 0; i < n; i++) { d[i * 4] = rr(r, x0, x1); d[i * 4 + 1] = rr(r, y0, y1); d[i * 4 + 2] = rr(r, z0, z1); d[i * 4 + 3] = rr(r, 13, 19); }
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); c.geos.add(geo);
  const m = new THREE.LineBasicMaterial({ color, transparent: true, opacity, depthWrite: false, fog: false }); c.mats.push(m);
  const l = new THREE.LineSegments(geo, m); l.frustumCulled = false; c.group.add(l);
  const place = () => {
    for (let i = 0; i < n; i++) {
      const x = d[i * 4], y = d[i * 4 + 1], z = d[i * 4 + 2], sx = (y - y0) * slant;
      pos[i * 6] = x + sx; pos[i * 6 + 1] = y; pos[i * 6 + 2] = z;
      pos[i * 6 + 3] = x + sx + len * slant; pos[i * 6 + 4] = y + len; pos[i * 6 + 5] = z;
    }
    geo.attributes.position.needsUpdate = true;
  };
  place();
  c.ups.push((t, dt) => {
    const k = dt * c.ms;
    for (let i = 0; i < n; i++) { let y = d[i * 4 + 1] - d[i * 4 + 3] * k; if (y < y0) y += (y1 - y0); d[i * 4 + 1] = y; }
    place();
  });
  return l;
}
// Slow drifting cloud / smoke band (seamless scrolling texture).
function cloudLayer(c, hex, a, y, z, h, speed, o = {}) {
  const t = tex(c, 512, 128, (g, w, hh, r) => pClouds(g, w, r, o.n || 6, 40, 90, hex, a, o.size || 32, true), true);
  t.repeat.set(2, 1);
  const me = backdrop(c, t, 130, h, 0, y, z, { alpha: !o.add, add: !!o.add });
  c.ups.push(tm => { t.offset.x = tm * speed * c.ms; });
  return me;
}
const pulseE = (c, m, base, amp, speed, ph = 0) => c.ups.push(t => { m.emissiveIntensity = base + amp * Math.sin(t * speed + ph); });
const pulseO = (c, m, base, amp, speed, ph = 0) => c.ups.push(t => { m.opacity = base + amp * Math.sin(t * speed + ph); });
// Gentle lamp flicker; becomes a slow pulse when reducedFlash is on.
const flick = (c, t, ph) => c.rf ? 0.88 + 0.12 * Math.sin(t * 1.1 + ph) : 0.84 + 0.1 * Math.sin(t * 7 + ph) + 0.06 * Math.sin(t * 17.3 + ph * 2.1);
// Waterfall / lavafall strip texture that scrolls downward.
function fallTex(c, cols, speed) {
  const t = tex(c, 64, 256, (g, w, h, r) => {
    vgrad(g, 0, 0, w, h, [[0, cols[0]], [0.5, cols[1]], [1, cols[0]]]);
    for (let i = 0; i < 46; i++) { g.fillStyle = css(cols[2], rr(r, 0.15, 0.6)); const y = r() * h, l = rr(r, 20, 90), x = r() * w, ww = rr(r, 1, 4); g.fillRect(x, y, ww, l); g.fillRect(x, y - h, ww, l); }
  }, true);
  c.ups.push(tm => { t.offset.y = tm * speed * c.ms; });
  return t;
}

/* ------------------------------------------------------------------ */
/* Lighting moods                                                      */
/* ------------------------------------------------------------------ */
const LIGHTS = {
  rooftops: () => ({ sky: 0x0b1030, fog: [0x3a2a5e, 30, 95], ambient: [0x8a90d0, 0.9], ground: 0x3a2c40, key: [0xffd9b0, 1.9, [4, 9, 8]], rim: [0xff7a50, 1.2, [-8, 5, -8]] }),
  hall: () => ({ sky: 0x1a1626, fog: [0x2a2440, 35, 90], ambient: [0xfff2dc, 1.1], ground: 0x6a5a48, key: [0xfff0d0, 2.1, [-3, 10, 9]], rim: [0x6aa8ff, 1.1, [6, 6, -7]] }),
  district: () => ({ sky: 0x0c1418, fog: [0x1c2e30, 22, 70], ambient: [0x7fa0a8, 0.85], ground: 0x2a2620, key: [0xffd9a0, 1.7, [3, 8, 8]], rim: [0x40d0b0, 1.3, [-7, 5, -6]] }),
  cosmic: () => ({ sky: 0x07051a, fog: [0x1a0f3a, 40, 120], ambient: [0x9a8cff, 0.9], ground: 0x2a1a40, key: [0xe8e0ff, 1.9, [5, 10, 7]], rim: [0xff5ad0, 1.4, [-8, 4, -8]] }),
  lab: () => ({ sky: 0x0a1214, fog: [0x10262a, 30, 80], ambient: [0xc8f0e8, 0.95], ground: 0x263238, key: [0xf0fff8, 1.9, [2, 10, 8]], rim: [0x30ffa0, 1.2, [8, 5, -6]] }),
  temple: () => ({ sky: 0x8fd0d8, fog: [0xcfe0b8, 35, 110], ambient: [0xfff0c8, 1.15], ground: 0x5a6a3a, key: [0xffe2a8, 2.3, [6, 10, 7]], rim: [0x60e0c0, 0.9, [-8, 6, -7]] }),
  volcano: () => ({ sky: 0x1a0806, fog: [0x3a120a, 28, 85], ambient: [0xffb090, 0.8], ground: 0x401408, key: [0xffd0a0, 1.8, [-4, 9, 8]], rim: [0xff4a10, 1.8, [6, 3, -7]] }),
  frozen: () => ({ sky: 0x061428, fog: [0x1a3a5a, 32, 100], ambient: [0xbfe4ff, 1.05], ground: 0x4a6a8a, key: [0xeaf6ff, 2.0, [-5, 10, 8]], rim: [0x40e0ff, 1.3, [7, 5, -7]] }),
};

/* ------------------------------------------------------------------ */
/* Shared painters used by more than one zone                          */
/* ------------------------------------------------------------------ */
function paintDuskSky(g, w, h, r, moonX) {
  vgrad(g, 0, 0, w, h, [[0, '#0b1030'], [0.36, '#1d1b52'], [0.58, '#5a2f73'], [0.72, '#c05a6a'], [0.79, '#f2a262'], [1, '#f2a262']]);
  pStars(g, w, 320, r, 170);
  blob(g, moonX, 250, 95, 0xfff2cc, 0.3);
  g.fillStyle = '#fff4d8'; g.beginPath(); g.ellipse(moonX, 250, 15, 23, 0, 0, TAU); g.fill();
  pClouds(g, w, r, 7, 270, 370, 0xff9a7a, 0.1, 55);
  pSkyline(g, w, 404, r, { minW: 12, maxW: 30, minH: 22, maxH: 100, col: '#4a2f66', wins: ['#ffd98a', '#ffb070'], winP: 0.16, cell: 4, bottom: h });
  vgrad(g, 0, 330, w, 100, [[0, 'rgba(242,150,98,0)'], [1, 'rgba(242,150,98,.35)']]);
}
function paintCityMid(g, w, h, r, bridge) {
  pSkyline(g, w, MY(0), r, { minW: 46, maxW: 96, minH: 110, maxH: 215, col: '#27285a', wins: ['#ffe2a0', '#ffc070'], winP: 0.22, cell: 8, bottom: h, gap: 10, edge: 'rgba(255,150,120,.25)' });
  pSkyline(g, w, MY(0), r, { minW: 60, maxW: 120, minH: 50, maxH: 150, col: '#12152e', wins: ['#ffe2a0', '#8fe0ff', '#ffc070'], winP: 0.3, cell: 9, bottom: h, gap: 24, edge: 'rgba(255,170,130,.3)' });
  if (bridge) { // elevated rail viaduct in the distance
    g.fillStyle = '#0c0f22'; g.fillRect(0, MY(2.4), w, 9);
    for (let x = 20; x < w; x += 90) { g.fillRect(x, MY(2.4), 10, 90); g.beginPath(); g.ellipse(x + 50, MY(2.4) + 9, 40, 22, 0, Math.PI, TAU); g.rect(x + 10, MY(2.4) + 9, 0, 0); g.strokeStyle = '#0c0f22'; g.lineWidth = 5; g.stroke(); }
  }
}
function paintNebula(g, w, h, r, hexes, n) {
  for (let i = 0; i < n; i++) {
    const cx = rr(r, 0, w), cy = rr(r, 120, 420), hex = pick(r, hexes);
    for (let k = 0; k < 8; k++) blob(g, cx + rr(r, -120, 120), cy + rr(r, -60, 60), rr(r, 50, 130), hex, 0.07);
  }
}
function paintBrick(g, x, y, w, h, bw, bh, line) {
  g.strokeStyle = line; g.lineWidth = 1; g.beginPath();
  let row = 0;
  for (let yy = y; yy <= y + h; yy += bh, row++) {
    g.moveTo(x, yy); g.lineTo(x + w, yy);
    for (let xx = x + (row % 2) * bw / 2; xx < x + w; xx += bw) { g.moveTo(xx, yy); g.lineTo(xx, Math.min(yy + bh, y + h)); }
  }
  g.stroke();
}
function paintHexGrid(g, w, h, size, stroke, lw) {
  g.strokeStyle = stroke; g.lineWidth = lw; g.beginPath();
  const dx = size * 1.5, dy = size * 0.866;
  let col = 0;
  for (let x = 0; x < w + size; x += dx, col++) {
    for (let y = (col % 2) * dy; y < h + dy; y += dy * 2) {
      for (let i = 0; i <= 6; i++) { const a = i * Math.PI / 3, px = x + Math.cos(a) * size, py = y + Math.sin(a) * size * 0.866 / 0.866; if (i) g.lineTo(px, py); else g.moveTo(px, py); }
    }
  }
  g.stroke();
}
// A simple stone statue of a hero standing proud (3 merged-style instanced parts would be overkill; 4 meshes).
function statue(c, m, x, y, z, s = 1) {
  const gp = grp(c, x, y, z); gp.scale.setScalar(s);
  box(c, 1.3, 0.9, 1.1, m, 0, 0, 0, gp);
  box(c, 0.7, 1.5, 0.45, m, 0, 0.9, 0, gp);
  sph(c, 0.27, m, 0, 2.7, 0, 1, 1, 1, gp);
  const cape = cone(c, 0.62, 1.7, 4, m, 0, 0.9, -0.22, gp); cape.rotation.y = Math.PI / 4; cape.scale.z = 0.4;
  return gp;
}

/* ------------------------------------------------------------------ */
/* The arenas                                                          */
/* ------------------------------------------------------------------ */
const ZONES = {
  /* ============================ ROOFTOPS ============================ */
  rooftops: [
    c => {
      far(c, (g, w, h, r) => paintDuskSky(g, w, h, r, 690));
      cloudLayer(c, 0xe8a0b0, 0.15, 8, -24, 10, 0.004);
      mid(c, (g, w, h, r) => paintCityMid(g, w, h, r, false));
      floor(c, (g, w, h, r) => {
        g.fillStyle = '#666d80'; g.fillRect(0, 0, w, h);
        pTiles(g, w, h, 64, 46, r, 'rgba(20,24,44,.35)', 0.05);
        pSpecks(g, w, h, r, 500, 0.05);
        vgrad(g, 0, 0, w, PZ(-4), [[0, 'rgba(26,24,50,.55)'], [1, 'rgba(26,24,50,0)']]);
        g.fillStyle = 'rgba(255,205,90,.55)'; g.fillRect(0, PZ(-5.5), w, 5);
        g.strokeStyle = 'rgba(255,220,140,.4)'; g.lineWidth = 6; floorRing(g, 0, 0, 5.2); g.stroke();
        g.lineWidth = 2; floorRing(g, 0, 0, 4.6); g.stroke();
        blob(g, 512, PZ(0), 260, 0xffc890, 0.08);
      }, { rough: 0.9 });
      const conc = std(c, 0x5a6076), dark = std(c, 0x2a2e46), metal = std(c, 0x8f98ae, { metalness: 0.55, roughness: 0.45 });
      box(c, 64, 0.8, 0.6, conc, 0, 0, -6.2); box(c, 64, 0.12, 0.8, dark, 0, 0.8, -6.2);
      iboxes(c, metal, [[-5.5, 0, -4.7, 2.2, 1.2, 1.4], [4.6, 0, -4.9, 1.8, 1, 1.2], [13.6, 0, -4.4, 2.2, 1.3, 1.5], [-5.5, 1.2, -4.7, 1.5, 0.12, 1], [4.6, 1, -4.9, 1.2, 0.12, 0.9]]);
      const fans = [[-5.5, 1.36, -4.7], [4.6, 1.16, -4.9]].map(p => box(c, 1.3, 0.05, 0.16, dark, p[0], p[1], p[2]));
      c.ups.push(t => fans.forEach((f, i) => { f.rotation.y = t * (3 + i) * c.ms; }));
      // stairwell hut + water tank (left side)
      box(c, 3.2, 3, 2.6, conc, -12.4, 0, -4.2); box(c, 3.6, 0.2, 3, dark, -12.4, 3, -4.2);
      const door = emis(c, 0xffc070, 0.9); box(c, 0.9, 1.9, 0.06, door, -11.9, 0, -2.88);
      glow(c, 0xffb060, 3, 3, -11.9, 1.2, -2.8, 0.35);
      iboxes(c, dark, [[-9.3, 0, -5.3, 0.14, 1.5, 0.14], [-7.9, 0, -5.3, 0.14, 1.5, 0.14], [-9.3, 0, -4.3, 0.14, 1.5, 0.14], [-7.9, 0, -4.3, 0.14, 1.5, 0.14]]);
      cyl(c, 1.05, 1.05, 2.1, 12, std(c, 0x7a5a48), -8.6, 1.5, -4.8); cone(c, 1.25, 0.8, 12, dark, -8.6, 3.6, -4.8);
      // billboard (right side) - the thing fighters crash through
      const bt = tex(c, 512, 256, (g, w, h) => {
        vgrad(g, 0, 0, w, h, [[0, '#1c2f8a'], [1, '#b03a8a']]);
        g.save(); g.translate(130, 128); g.fillStyle = 'rgba(255,255,255,.12)';
        for (let i = 0; i < 12; i++) { g.rotate(TAU / 12); g.beginPath(); g.moveTo(0, 0); g.lineTo(400, -34); g.lineTo(400, 34); g.fill(); }
        g.restore();
        star5(g, 130, 128, 78, '#ffd84a'); star5(g, 130, 128, 48, '#fff6c8');
        label(g, 'METRO CITY', 340, 100, 46, '#ffffff'); label(g, 'HOME OF HEROES', 340, 160, 26, '#ffe27a');
        g.strokeStyle = '#ffe27a'; g.lineWidth = 8; g.strokeRect(6, 6, w - 12, h - 12);
      });
      const bm = std(c, 0xffffff, { map: bt, emissive: 0xffffff, emissiveMap: bt, emissiveIntensity: 0.55, roughness: 0.6 });
      box(c, 4.8, 2.5, 0.2, bm, 10.7, 2.3, -2.3); box(c, 5.1, 2.8, 0.14, dark, 10.7, 2.15, -2.45);
      iboxes(c, dark, [[9.2, 0, -2.5, 0.22, 2.3, 0.22], [12.2, 0, -2.5, 0.22, 2.3, 0.22], [10.7, 4.95, -2.2, 4.8, 0.08, 0.5]]);
      const bl = glow(c, 0xfff0c0, 6, 1.2, 10.7, 5, -2.1, 0.5); pulseO(c, bl.material, 0.45, 0.1, 1.4);
      // neighbour building + antenna towers
      box(c, 5, 10, 3, std(c, 0x343a5c), 15.8, 0, -5);
      const tw = [[-15, 10.5], [7.5, 12], [19.5, 9]];
      iboxes(c, dark, tw.map(p => [p[0], 0, -9.5, 0.3, p[1], 0.3]).concat(tw.map(p => [p[0], p[1] * 0.6, -9.5, 1.6, 0.1, 0.1])));
      const reds = tw.map(p => glow(c, 0xff3030, 1.6, 1.6, p[0], p[1] + 0.2, -9.4, 0.8));
      c.ups.push(t => reds.forEach((s, i) => { s.material.opacity = 0.35 + 0.5 * (0.5 + 0.5 * Math.sin(t * (c.rf ? 0.9 : 2.2) + i * 2.1)); }));
      if (!c.low) {
        const wn = [];
        for (let y = 1; y < 9; y += 1.3) for (let x = 13.9; x < 18; x += 1.1) if (c.rnd() < 0.6) wn.push([x, y, -3.47, 0.5, 0.7, 0.05]);
        iboxes(c, emis(c, 0xffd890, 0.9), wn);
        const pipe = cyl(c, 0.12, 0.12, 20, 8, metal, 2, 0.3, -5.6); pipe.rotation.z = Math.PI / 2; pipe.position.y = 0.3;
        box(c, 2.4, 0.35, 1.3, emis(c, 0x70d0ff, 0.5), -1.2, 0, -4.9);
      }
      // airship drifting far away
      const ship = grp(c, -30, 13.5, -21);
      sph(c, 1, std(c, 0x4a3a6a, { fog: false }), 0, 0, 0, 3.2, 0.9, 0.9, ship); box(c, 1.4, 0.4, 0.5, dark, 0, -1.3, 0, ship);
      const sl = glow(c, 0xfff0a0, 1.2, 1.2, 0, -1.2, 0.4, 0.9, false, ship);
      c.ups.push(t => { ship.position.x = c.rm ? -12 : ((t * 0.9 + 20) % 100) - 50; ship.position.y = 13.5 + Math.sin(t * 0.3) * 0.3 * c.ms; sl.material.opacity = 0.6 + 0.3 * Math.sin(t * 1.5); });
      points(c, 160, { box: [-18, 18, 0.5, 9, -9, 3], color: 0xffd0a0, size: 0.06, opacity: 0.5, vel: [0.5, 0.05, 0], sway: 0.25 });
      return LIGHTS.rooftops();
    },
    c => {
      far(c, (g, w, h, r) => paintDuskSky(g, w, h, r, 330));
      cloudLayer(c, 0xd890c0, 0.14, 9, -24, 10, -0.003);
      mid(c, (g, w, h, r) => paintCityMid(g, w, h, r, true));
      floor(c, (g, w, h, r) => {
        const z = Z => PZ(Z, -3.6, 9);
        g.fillStyle = '#6d7386'; g.fillRect(0, 0, w, h);
        pTiles(g, w, h, 48, 40, r, 'rgba(24,26,48,.3)', 0.05, 0.5);
        g.fillStyle = '#e8c040'; g.fillRect(0, z(-3.0), w, 9);
        g.fillStyle = 'rgba(30,30,50,.5)'; for (let x = 0; x < w; x += 14) g.fillRect(x, z(-2.75), 7, 7);
        g.fillStyle = 'rgba(255,255,255,.18)'; g.fillRect(0, z(-2.2), w, 3);
        pSpecks(g, w, h, r, 400, 0.05);
      }, { z0: -3.6, rough: 0.75 });
      const conc = std(c, 0x596078), dark = std(c, 0x262a42), metal = std(c, 0x98a2b8, { metalness: 0.6, roughness: 0.4 });
      box(c, 64, 0.9, 0.3, conc, 0, -0.9, -3.75);             // platform edge face
      box(c, 64, 0.2, 10, std(c, 0x2e2c38), 0, -1.1, -8.6);   // track bed
      iboxes(c, metal, [[0, -0.9, -5.3, 64, 0.14, 0.14], [0, -0.9, -6.9, 64, 0.14, 0.14]]);
      const sl = []; for (let x = -30; x <= 30; x += 1.5) sl.push([x, -0.92, -6.1, 0.35, 0.08, 2.4]);
      iboxes(c, std(c, 0x4a3a30), sl);
      // canopy
      icyls(c, metal, [-18, -12, -6, 0, 6, 12, 18].map(x => [x, 0, -3.1, 0.14, 5.6]));
      box(c, 64, 0.22, 4.2, dark, 0, 5.6, -4.6); box(c, 64, 0.5, 0.12, std(c, 0x3a5a9a), 0, 5.1, -2.5);
      const lampM = emis(c, 0xfff0c8, 1.2);
      iboxes(c, lampM, [-15, -9, -3, 3, 9, 15].map(x => [x, 5.5, -3.6, 1.6, 0.08, 0.3]));
      const st = tex(c, 256, 64, (g, w, h) => { g.fillStyle = '#16306a'; g.fillRect(0, 0, w, h); g.fillStyle = '#ffd84a'; g.fillRect(0, 0, 60, h); label(g, '2', 30, 34, 44, '#16306a'); label(g, 'SKYLINE RAIL', 156, 33, 24, '#ffffff'); });
      const sm = std(c, 0xffffff, { map: st, emissive: 0xffffff, emissiveMap: st, emissiveIntensity: 0.5 });
      box(c, 2.6, 0.65, 0.1, sm, -9, 4.3, -3.0); box(c, 2.6, 0.65, 0.1, sm, 9.4, 4.3, -3.0);
      // benches, bins
      if (!c.low) iboxes(c, std(c, 0x7a5a40), [[-3, 0.4, -2.9, 2.2, 0.1, 0.5], [3.2, 0.4, -2.9, 2.2, 0.1, 0.5], [-3.9, 0, -2.9, 0.1, 0.4, 0.5], [-2.1, 0, -2.9, 0.1, 0.4, 0.5], [2.3, 0, -2.9, 0.1, 0.4, 0.5], [4.1, 0, -2.9, 0.1, 0.4, 0.5]]);
      // side context: stair tower right, signal gantry left
      box(c, 3.4, 5.6, 2.6, conc, 12.6, 0, -4.2); box(c, 1.3, 2.2, 0.06, emis(c, 0xbfe6ff, 0.8), 12.2, 0, -2.88);
      iboxes(c, dark, [[-12.5, 0, -3.3, 0.2, 4.6, 0.2], [-12.5, 4.4, -4.3, 0.16, 0.16, 2.2]]);
      const sig = glow(c, 0x40ff80, 1.3, 1.3, -12.5, 4.2, -3.1, 0.9);
      c.ups.push(t => { sig.material.opacity = 0.55 + 0.35 * Math.sin(t * (c.rf ? 0.8 : 1.8)); });
      // train passing behind the platform
      const train = grp(c, -9, -0.75, -6.1);
      const body = std(c, 0xc8d0de, { metalness: 0.5, roughness: 0.4 }), win = emis(c, 0xffe6a8, 1.1), stripe = std(c, 0x2a56c0);
      for (let i = 0; i < 3; i++) {
        box(c, 8.6, 3.1, 2.2, body, i * 9, 0, 0, train); box(c, 7.6, 0.9, 0.06, win, i * 9, 1.6, 1.11, train); box(c, 8.6, 0.3, 0.06, stripe, i * 9, 0.9, 1.12, train);
      }
      glow(c, 0xfff4c0, 2.2, 2.2, 22.6, 1.2, 0.6, 0.9, false, train);
      c.ups.push(t => { train.position.x = c.rm ? -22 : ((t * 16) % 420) - 80; });
      points(c, 140, { box: [-18, 18, 0.5, 8, -8, 3], color: 0xffd0b0, size: 0.06, opacity: 0.45, vel: [-0.6, 0.04, 0], sway: 0.25 });
      const L = LIGHTS.rooftops(); L.rim = [0xff6a80, 1.2, [-8, 5, -8]]; L.key = [0xffe2c0, 2.0, [3, 9, 8]]; return L;
    },
  ],

  /* ============================== HALL ============================== */
  hall: [
    c => {
      // far wall with tall coloured-glass windows
      backdrop(c, tex(c, 1024, 512, (g, w, h, r) => {
        vgrad(g, 0, 0, w, h, [[0, '#141024'], [0.5, '#3a3050'], [1, '#5a4c60']]);
        const pal = ['#4aa0ff', '#ffd24a', '#ff6a6a', '#6ae0b0', '#b08aff', '#ffffff'];
        for (let i = 0, x = 26; x < w; x += 104, i++) {
          const ww = 62, yb = 458, hh = 215;
          archPath(g, x, yb, ww, hh); g.save(); g.clip();
          vgrad(g, x, yb - hh, ww, hh, [[0, '#9ad0ff'], [1, '#ffe6a8']]);
          for (let yy = yb - hh; yy < yb; yy += 15) for (let xx = x - ((yy / 15 | 0) % 2) * 6; xx < x + ww; xx += 12) { g.fillStyle = pick(r, pal); g.globalAlpha = rr(r, 0.35, 0.8); g.fillRect(xx, yy, 11, 14); }
          g.globalAlpha = 1;
          star5(g, x + ww / 2, yb - hh * 0.62, 24, 'rgba(255,255,255,.85)', 0.8); star5(g, x + ww / 2, yb - hh * 0.62, 13, i % 2 ? '#ffd24a' : '#4aa0ff', 0.8);
          g.strokeStyle = 'rgba(30,20,40,.7)'; g.lineWidth = 2; g.beginPath(); g.moveTo(x + ww / 2, yb - hh); g.lineTo(x + ww / 2, yb); g.moveTo(x, yb - hh * 0.3); g.lineTo(x + ww, yb - hh * 0.3); g.stroke();
          g.restore();
          archPath(g, x, yb, ww, hh); g.strokeStyle = '#c9a24a'; g.lineWidth = 4; g.stroke();
          blob(g, x + ww / 2, yb - hh / 2, 110, 0xbfdcff, 0.12);
        }
        g.fillStyle = '#c9a24a'; g.fillRect(0, 462, w, 4); g.fillStyle = '#2c2438'; g.fillRect(0, 466, w, 46);
      }), 80, 30, 0, -2, -16);
      // arcade wall with open arches (parallax in front of the windows)
      backdrop(c, tex(c, 1024, 512, (g, w, h, r) => {
        vgrad(g, 0, 0, w, h, [[0, '#4a4258'], [0.45, '#8a8090'], [1, '#6e6676']]);
        paintBrick(g, 0, 0, w, h, 46, 22, 'rgba(30,24,44,.18)');
        g.fillStyle = '#c9a24a'; g.fillRect(0, 232, w, 5); g.fillRect(0, 196, w, 3);
        g.fillStyle = '#2f4f9a'; g.fillRect(0, 201, w, 30);
        for (let x = 20; x < w; x += 40) star5(g, x, 216, 8, 'rgba(255,220,120,.8)', 0.75);
        g.globalCompositeOperation = 'destination-out';
        for (let x = 32; x < w; x += 120) { archPath(g, x, 470, 80, 205); g.fillStyle = '#000'; g.fill(); }
        g.globalCompositeOperation = 'source-over';
        for (let x = 32; x < w; x += 120) { archPath(g, x, 470, 80, 205); g.strokeStyle = '#d8b660'; g.lineWidth = 5; g.stroke(); }
      }), 64, 20, 0, -2, -9, { alpha: true, fog: true });
      floor(c, (g, w, h, r) => {
        g.fillStyle = '#928b86'; g.fillRect(0, 0, w, h);
        pTiles(g, w, h, 64, 46.5, r, 'rgba(60,50,60,.25)', 0.07);
        g.fillStyle = '#2c4a8c'; g.fillRect(0, PZ(-1.5), w, PZ(1.5) - PZ(-1.5));
        g.fillStyle = '#d8b660'; g.fillRect(0, PZ(-1.5) - 4, w, 4); g.fillRect(0, PZ(1.5), w, 4);
        g.strokeStyle = 'rgba(216,182,96,.6)'; g.lineWidth = 4; floorRing(g, 0, 0, 1.25); g.stroke();
        star5(g, 512, PZ(0), 20, 'rgba(216,182,96,.55)', 0.7);
        vgrad(g, 0, 0, w, PZ(-6), [[0, 'rgba(30,24,44,.5)'], [1, 'rgba(30,24,44,0)']]);
      }, { rough: 0.35, metal: 0.1 });
      const marble = std(c, 0xd8d0c4, { roughness: 0.4 }), gold = std(c, 0xd8b050, { metalness: 0.8, roughness: 0.3 }), stone = std(c, 0x9a94a0);
      const cx = [-19, -11.5, -4, 3.5, 11, 18.5];
      icyls(c, marble, cx.map(x => [x, 0.5, -4.6, 0.42, 8.5]), 14);
      iboxes(c, gold, cx.map(x => [x, 0, -4.6, 1.2, 0.5, 1.2]).concat(cx.map(x => [x, 9, -4.6, 1.3, 0.45, 1.3])));
      box(c, 64, 1.2, 1.4, stone, 0, 9.45, -4.6);
      [-7.75, 7.25, -15.2].forEach((x, i) => statue(c, stone, x, 0, -6.4, 1.15 + (i === 2 ? 0.1 : 0)));
      // banners that sway a little
      const bt = tex(c, 128, 256, (g, w, h) => {
        vgrad(g, 0, 0, w, h, [[0, '#3464c8'], [1, '#1c3a86']]);
        g.fillStyle = '#d8b660'; g.fillRect(0, 0, w, 10); g.fillRect(0, 0, 7, h); g.fillRect(w - 7, 0, 7, h);
        star5(g, 64, 110, 40, '#ffd84a'); star5(g, 64, 110, 22, '#fff6d0');
        poly(g, [0, h, 64, h - 44, w, h, w, h + 2, 0, h + 2], '#000'); g.globalCompositeOperation = 'destination-out'; poly(g, [0, h, 64, h - 44, w, h], '#000'); g.globalCompositeOperation = 'source-over';
      });
      const bm = std(c, 0xffffff, { map: bt, transparent: true, alphaTest: 0.5, side: THREE.DoubleSide, roughness: 0.9 });
      const bg = new THREE.PlaneGeometry(1.7, 3.6);
      const banners = [-7.75, -0.25, 7.25].map(x => { const p = grp(c, x, 8.6, -5.2); add(c, bg, bm, 0, -1.8, 0, p); return p; });
      c.ups.push(t => banners.forEach((b, i) => { b.rotation.z = Math.sin(t * 0.8 + i * 1.7) * 0.035 * c.ms; b.rotation.x = Math.sin(t * 0.6 + i) * 0.03 * c.ms; }));
      // hologram emblem
      const holo = grp(c, -0.25, 5.2, -7.4), hm = bas(c, { color: 0x7fe0ff, transparent: true, opacity: 0.75, blending: THREE.AdditiveBlending, depthWrite: false, fog: false });
      const ring = add(c, new THREE.TorusGeometry(1.2, 0.06, 6, 28), hm, 0, 0, 0, holo), ring2 = add(c, new THREE.TorusGeometry(0.85, 0.04, 6, 24), hm, 0, 0, 0, holo);
      const gem = add(c, new THREE.OctahedronGeometry(0.5), hm, 0, 0, 0, holo);
      glow(c, 0x60c8ff, 4.5, 4.5, -0.25, 5.2, -7.5, 0.35); cyl(c, 0.9, 1.1, 0.5, 12, gold, -0.25, 0, -7.4);
      c.ups.push(t => { ring.rotation.y = t * 0.7 * c.ms; ring2.rotation.x = t * 0.9 * c.ms; gem.rotation.y = -t * 0.5 * c.ms; holo.position.y = 5.2 + Math.sin(t * 0.9) * 0.12 * c.ms; hm.opacity = 0.65 + 0.12 * Math.sin(t * 1.3); });
      // training wall (right) with scanning light bars
      const wt = tex(c, 256, 256, (g, w, h) => {
        vgrad(g, 0, 0, w, h, [[0, '#56627a'], [1, '#3a4458']]);
        paintHexGrid(g, w, h, 22, 'rgba(160,220,255,.35)', 2);
        g.strokeStyle = '#7fe0ff'; g.lineWidth = 5; g.beginPath(); g.arc(128, 150, 70, 0, TAU); g.stroke();
        g.lineWidth = 2; g.beginPath(); g.arc(128, 150, 54, 0, TAU); g.stroke();
        g.fillStyle = '#1c2436'; g.fillRect(28, 14, 200, 44); label(g, 'TRAINING', 128, 37, 30, '#7fe0ff');
      });
      box(c, 4.6, 5.6, 0.5, std(c, 0xffffff, { map: wt, emissive: 0xffffff, emissiveMap: wt, emissiveIntensity: 0.3, roughness: 0.5, metalness: 0.3 }), 10.8, 0, -2.4);
      iboxes(c, gold, [[8.4, 0, -2.4, 0.3, 5.8, 0.6], [13.2, 0, -2.4, 0.3, 5.8, 0.6], [10.8, 5.6, -2.4, 5.1, 0.3, 0.6]]);
      const bar = box(c, 4.4, 0.07, 0.05, bas(c, { color: 0x9fecff, fog: false }), 10.8, 1, -2.12);
      c.ups.push(t => { bar.position.y = 2.8 + Math.sin(t * 0.8 * (c.rm ? 0.4 : 1)) * 2.4; });
      // trophy case (left)
      box(c, 3.4, 4.2, 1, std(c, 0x4a3a30), -12.4, 0, -3.4); box(c, 3, 3.4, 0.06, emis(c, 0xfff0c0, 0.5, { transparent: true, opacity: 0.6 }), -12.4, 0.5, -2.88);
      if (!c.low) iboxes(c, gold, [[-13.3, 1.2, -3.1, 0.3, 0.6, 0.3], [-12.4, 1.2, -3.1, 0.4, 0.9, 0.3], [-11.5, 1.2, -3.1, 0.3, 0.6, 0.3], [-12.9, 2.6, -3.1, 0.3, 0.5, 0.3], [-11.9, 2.6, -3.1, 0.3, 0.5, 0.3]]);
      // light shafts + dust
      [-9, 0, 9].forEach((x, i) => { const s = glow(c, 0xfff0d0, 5, 16, x, 6, -8.4, 0.16); s.rotation.z = 0.25; pulseO(c, s.material, 0.15, 0.05, 0.5, i); });
      points(c, 200, { box: [-16, 16, 0.5, 9, -8, -1], color: 0xffe6a8, size: 0.06, opacity: 0.6, vel: [0.05, 0.08, 0], sway: 0.2 });
      return LIGHTS.hall();
    },
    c => {
      backdrop(c, tex(c, 1024, 512, (g, w, h, r) => {
        vgrad(g, 0, 0, w, h, [[0, '#0c1020'], [0.6, '#1c2a48'], [1, '#243658']]);
        paintHexGrid(g, w, h, 30, 'rgba(90,200,255,.28)', 2);
        for (let i = 0; i < 26; i++) { g.fillStyle = css(pick(r, [0x5ad0ff, 0x7f9aff, 0xffd84a]), rr(r, 0.08, 0.25)); g.beginPath(); const x = r() * w, y = rr(r, 150, 470); g.arc(x, y, 24, 0, TAU); g.fill(); }
        g.strokeStyle = 'rgba(127,224,255,.8)'; g.lineWidth = 4; g.beginPath(); g.ellipse(512, 300, 78, 104, 0, 0, TAU); g.stroke();
        g.lineWidth = 2; g.beginPath(); g.ellipse(512, 300, 60, 80, 0, 0, TAU); g.stroke();
        star5(g, 512, 300, 52, 'rgba(127,224,255,.6)', 0.75);
        g.fillStyle = 'rgba(127,224,255,.5)'; for (let x = 0; x < w; x += 128) g.fillRect(x, 180, 3, 300);
        g.fillStyle = '#0a0e1a'; g.fillRect(0, 474, w, 38);
      }), 72, 28, 0, -2, -13);
      // holographic wireframe hills
      const hl = backdrop(c, tex(c, 1024, 256, (g, w, h, r) => {
        g.strokeStyle = 'rgba(90,220,255,.8)'; g.lineWidth = 1.5;
        for (let k = 0; k < 5; k++) { g.beginPath(); const p = r() * 9; for (let x = 0; x <= w; x += 8) { const y = 200 - k * 26 - 40 * Math.abs(Math.sin(x * 0.006 * (1 + k * 0.3) + p)) - 14 * Math.sin(x * 0.03 + p); if (x) g.lineTo(x, y); else g.moveTo(x, y); } g.stroke(); }
        for (let x = 0; x <= w; x += 48) { g.beginPath(); g.moveTo(x, 256); g.lineTo(512 + (x - 512) * 0.55, 96); g.stroke(); }
      }), 64, 9, 0, 0, -8.5, { add: true, opacity: 0.5 });
      pulseO(c, hl.material, 0.45, 0.12, 0.7);
      floor(c, (g, w, h, r) => {
        g.fillStyle = '#34425e'; g.fillRect(0, 0, w, h);
        pTiles(g, w, h, 128, 93, r, 'rgba(0,0,0,0)', 0.04);
        g.strokeStyle = 'rgba(110,220,255,.4)'; g.lineWidth = 2; g.beginPath();
        for (let x = 0; x <= w; x += 32) { g.moveTo(x, 0); g.lineTo(x, h); }
        for (let Z = -13; Z <= 9; Z += 2) { g.moveTo(0, PZ(Z)); g.lineTo(w, PZ(Z)); }
        g.stroke();
        g.strokeStyle = 'rgba(255,216,74,.55)'; g.lineWidth = 4; floorRing(g, 0, 0, 7.4); g.stroke();
        vgrad(g, 0, 0, w, PZ(-6), [[0, 'rgba(8,12,26,.6)'], [1, 'rgba(8,12,26,0)']]);
      }, { rough: 0.4, metal: 0.3, glow: 0.3 });
      const steel = std(c, 0x4a5a78, { metalness: 0.6, roughness: 0.4 }), cy = emis(c, 0x5ad8ff, 1.2), dark = std(c, 0x1c2438);
      const px = [-18, -12, -6, 0, 6, 12, 18];
      icyls(c, steel, px.map(x => [x, 0, -4.2, 0.3, 6.5]), 8);
      const rings = icyls(c, cy, px.flatMap(x => [[x, 1.2, -4.2, 0.36, 0.12], [x, 3.2, -4.2, 0.36, 0.12], [x, 5.2, -4.2, 0.36, 0.12]]), 8);
      pulseE(c, cy, 1.1, 0.4, 1.6);
      box(c, 64, 0.5, 2, dark, 0, 6.5, -4.4);
      iboxes(c, emis(c, 0xbfeaff, 1.1), [-15, -9, -3, 3, 9, 15].map(x => [x, 6.42, -3.6, 2.4, 0.08, 0.3]));
      // floating target drones
      const dm = std(c, 0xffb040, { emissive: 0xff8a20, emissiveIntensity: 0.6, metalness: 0.4, roughness: 0.4 }), dg = new THREE.OctahedronGeometry(0.45);
      const drones = [[-9, 5.6, -6.5], [-3, 6.6, -7.5], [4.5, 5.9, -6.8], [10, 6.4, -7.2]].map(p => add(c, dg, dm, p[0], p[1], p[2]));
      c.ups.push(t => drones.forEach((d, i) => { d.rotation.y = t * (0.6 + i * 0.15) * c.ms; d.position.y = [5.6, 6.6, 5.9, 6.4][i] + Math.sin(t * 0.8 + i * 1.4) * 0.3 * c.ms; }));
      // scanning light bars sweeping the back wall
      const scans = [0, 1].map(i => glow(c, 0x7fe0ff, 1.2, 16, 0, 6, -12.8 + i * 0.1, 0.35));
      c.ups.push(t => scans.forEach((s, i) => { s.position.x = Math.sin(t * 0.25 * (c.rm ? 0.4 : 1) + i * Math.PI) * 22; }));
      // control balcony (left), breach in the wall they came through; exit door (right)
      box(c, 4, 0.3, 2, steel, -12.2, 3, -3.6); box(c, 4, 0.9, 0.1, cy, -12.2, 3.3, -2.62); box(c, 0.4, 3, 0.4, steel, -12.2, 0, -3.6);
      if (!c.low) iboxes(c, emis(c, 0xffd84a, 0.9), [[-13.2, 3.9, -3.6, 0.7, 0.5, 0.1], [-12.2, 3.9, -3.6, 0.7, 0.5, 0.1], [-11.2, 3.9, -3.6, 0.7, 0.5, 0.1]]);
      box(c, 3.2, 4.6, 0.4, dark, 11.6, 0, -2.6); box(c, 2.4, 3.8, 0.06, emis(c, 0x5ad8ff, 0.5), 11.6, 0, -2.38);
      points(c, 220, { box: [-16, 16, 0.2, 9, -9, -1], color: 0x7fe0ff, size: 0.07, opacity: 0.7, vel: [0, 0.35, 0], sway: 0.1 });
      void rings;
      const L = LIGHTS.hall(); L.sky = 0x0c1020; L.fog = [0x16223c, 30, 85]; L.ambient = [0xcfe6ff, 1.0]; L.ground = 0x34425e; L.key = [0xeaf4ff, 2.0, [-3, 10, 9]]; L.rim = [0x40c8ff, 1.4, [6, 6, -7]]; return L;
    },
  ],

  /* ============================ DISTRICT ============================ */
  district: [
    c => {
      far(c, (g, w, h, r) => {
        vgrad(g, 0, 0, w, h, [[0, '#0a1216'], [0.5, '#16282c'], [0.74, '#2f4f48'], [0.8, '#5a6a50'], [1, '#5a6a50']]);
        pClouds(g, w, r, 10, 180, 360, 0x0a1418, 0.2, 70); pClouds(g, w, r, 5, 300, 380, 0x7fb0a0, 0.07, 60);
        pSkyline(g, w, 406, r, { minW: 14, maxW: 34, minH: 20, maxH: 80, col: '#14262a', wins: ['#ffd58a'], winP: 0.1, cell: 4, bottom: h });
        // clock tower
        g.fillStyle = '#0e1c20'; g.fillRect(596, 250, 30, 170); poly(g, [592, 252, 611, 205, 630, 252], '#0e1c20');
        blob(g, 611, 278, 40, 0xffe2a0, 0.4); g.fillStyle = '#ffe9b8'; g.beginPath(); g.ellipse(611, 278, 9, 13, 0, 0, TAU); g.fill();
        g.strokeStyle = '#3a2a1a'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(611, 278); g.lineTo(611, 268); g.moveTo(611, 278); g.lineTo(616, 281); g.stroke();
      });
      mid(c, (g, w, h, r) => {
        pSkyline(g, w, MY(0), r, { minW: 60, maxW: 120, minH: 150, maxH: 225, col: '#101c20', wins: ['#ffd58a', '#bfe8d8'], winP: 0.12, cell: 10, bottom: h, gap: 8, edge: 'rgba(90,200,170,.22)' });
        for (let i = 0; i < 4; i++) { const x = 140 + i * 250 + rr(r, -30, 30), y = MY(0) - rr(r, 215, 240); g.fillStyle = '#101c20'; g.fillRect(x, y, 34, 26); poly(g, [x - 3, y, x + 17, y - 14, x + 37, y], '#101c20'); g.fillRect(x + 4, y + 26, 3, 24); g.fillRect(x + 27, y + 26, 3, 24); }
      });
      // row of shopfronts
      const ft = tex(c, 1024, 256, (g, w, h, r) => {
        g.fillStyle = '#0c1214'; g.fillRect(0, 0, w, h);
        let x = 0;
        while (x < w) {
          const bw = rr(r, 105, 165), bh = rr(r, 160, 240), top = h - bh;
          g.fillStyle = pick(r, ['#4c3630', '#3e3c48', '#54463a', '#3a4848']); g.fillRect(x, top, bw, bh);
          paintBrick(g, x, top, bw, bh, 14, 6, 'rgba(0,0,0,.18)');
          g.fillStyle = 'rgba(255,255,255,.14)'; g.fillRect(x - 2, top, bw + 4, 5);
          for (let wy = top + 16; wy < h - 100; wy += 40) for (let wx = x + 12; wx < x + bw - 24; wx += 30) {
            g.fillStyle = r() < 0.45 ? pick(r, ['#ffd58a', '#ffbe6a', '#bfe8d8']) : '#141c22'; g.fillRect(wx, wy, 16, 24);
            g.strokeStyle = '#221c1a'; g.lineWidth = 2; g.strokeRect(wx, wy, 16, 24); g.beginPath(); g.moveTo(wx + 8, wy); g.lineTo(wx + 8, wy + 24); g.stroke();
          }
          g.fillStyle = '#1c1614'; g.fillRect(x + 6, h - 72, bw - 12, 72);
          vgrad(g, x + 12, h - 60, bw - 54, 46, [[0, '#ffd088'], [1, '#b8703a']]);
          g.fillStyle = '#3a2418'; g.fillRect(x + bw - 36, h - 60, 22, 60); g.fillStyle = '#ffd088'; g.fillRect(x + bw - 31, h - 54, 12, 16);
          x += bw + (r() < 0.25 ? rr(r, 12, 22) : 0);
        }
        vgrad(g, 0, 0, w, 120, [[0, 'rgba(8,14,16,.7)'], [1, 'rgba(8,14,16,0)']]);
      });
      backdrop(c, ft, 64, 12, 0, 0.15, -6.8, { fog: true });
      floor(c, (g, w, h, r) => {
        g.fillStyle = '#525a60'; g.fillRect(0, 0, w, h);
        pTiles(g, w, h, 22, 16, r, 'rgba(14,20,24,.4)', 0.08, 0.5);
        for (let i = 0; i < 9; i++) { // puddles
          const x = rr(r, 40, w - 40), y = i < 5 ? rr(r, PZ(-2.6), PZ(-1.2)) : rr(r, PZ(2.2), PZ(6)), rx = rr(r, 40, 90), ry = rr(r, 8, 16);
          g.save(); g.beginPath(); g.ellipse(x, y, rx, ry, 0, 0, TAU); g.clip();
          vgrad(g, x - rx, y - ry, rx * 2, ry * 2, [[0, 'rgba(255,200,120,.35)'], [1, 'rgba(70,150,140,.35)']]); g.restore();
        }
        g.fillStyle = 'rgba(160,220,200,.1)'; g.fillRect(0, PZ(-0.1), w, 3);
        vgrad(g, 0, 0, w, PZ(-3), [[0, 'rgba(10,16,18,.45)'], [1, 'rgba(10,16,18,0)']]);
      }, { rough: 0.35, metal: 0.25 });
      const stone = std(c, 0x5a6064, { roughness: 0.6 }), iron = std(c, 0x1e2426, { metalness: 0.6, roughness: 0.5 }), wood = std(c, 0x6a4a34);
      box(c, 64, 0.15, 4.2, stone, 0, 0, -4.9); // sidewalk
      // lamp posts
      const lx = [-13.5, -4.5, 4.5, 13.5];
      icyls(c, iron, lx.map(x => [x, 0.15, -3.1, 0.07, 4.2]).concat(lx.map(x => [x, 0.15, -3.1, 0.16, 0.5])), 8);
      iboxes(c, iron, lx.map(x => [x, 4.75, -3.1, 0.5, 0.08, 0.5]));
      const lampM = emis(c, 0xffd890, 1.6); iboxes(c, lampM, lx.map(x => [x, 4.35, -3.1, 0.34, 0.4, 0.34]));
      const lg = lx.map(x => glow(c, 0xffc070, 3.6, 3.6, x, 4.5, -3.0, 0.55));
      const pools = lx.map(x => glow(c, 0xffc070, 5, 2.4, x, 0.17, -3.2, 0.22, true));
      c.ups.push(t => lg.forEach((s, i) => { const f = flick(c, t, i * 2.3); s.material.opacity = 0.55 * f; pools[i].material.opacity = 0.22 * f; lampM.emissiveIntensity = 1.4 + 0.3 * flick(c, t, 0); }));
      // puddle shimmer decals on the street
      const sh = [[-6, 0.012, -1.9, 0x9fe0d0], [3, 0.012, -2.1, 0xffc890], [9.5, 0.012, 3.2, 0x9fe0d0], [-11, 0.012, 3.4, 0xffc890]].map(p => glow(c, p[3], 3.4, 1, p[0], p[1], p[2], 0.2, true));
      c.ups.push(t => sh.forEach((s, i) => { s.material.opacity = 0.14 + 0.08 * Math.sin(t * 1.6 + i * 1.9); }));
      // awnings + hanging sign
      const aw = [[-14, 0x7a2a2a], [-6.5, 0x2a5a4a], [1.5, 0x6a5a2a], [17, 0x2a4a6a]];
      aw.forEach(a => { const m = box(c, 5, 0.12, 1.5, std(c, a[1]), a[0], 3.5, -6.1); m.rotation.x = 0.35; });
      const sgn = grp(c, -2.2, 4.9, -5.6); box(c, 0.08, 0.08, 1.2, iron, 0, 0, -0.5, sgn);
      const sp = grp(c, 0, 0, 0, sgn); box(c, 1.3, 0.8, 0.08, wood, 0, -1, 0, sp); box(c, 1.0, 0.5, 0.1, emis(c, 0xffd890, 0.5), 0, -0.85, 0, sp);
      c.ups.push(t => { sp.rotation.z = Math.sin(t * 1.1) * 0.07 * c.ms; });
      // breakaway storefront (right)
      const st = tex(c, 512, 512, (g, w, h) => {
        g.fillStyle = '#5a3a30'; g.fillRect(0, 0, w, h); paintBrick(g, 0, 0, w, h, 32, 14, 'rgba(0,0,0,.22)');
        g.fillStyle = '#2a4a40'; g.fillRect(0, 0, w, 96); label(g, 'CORNER BAKERY', 256, 50, 46, '#ffe6b0');
        g.fillStyle = '#241a16'; g.fillRect(24, 130, 300, 300); vgrad(g, 36, 142, 276, 276, [[0, '#ffdc98'], [1, '#c8823e']]);
        g.strokeStyle = '#241a16'; g.lineWidth = 8; g.beginPath(); g.moveTo(174, 142); g.lineTo(174, 418); g.moveTo(36, 280); g.lineTo(312, 280); g.stroke();
        g.fillStyle = '#7a4a2a'; for (let i = 0; i < 4; i++) { g.beginPath(); g.ellipse(80 + i * 62, 396, 24, 14, 0, 0, TAU); g.fill(); }
        g.fillStyle = '#3a2418'; g.fillRect(360, 150, 120, 362); g.fillStyle = '#ffdc98'; g.fillRect(380, 172, 80, 130);
        for (let x = 0; x < w; x += 64) { g.fillStyle = (x / 64) % 2 ? '#f0e6d0' : '#a83a3a'; g.fillRect(x, 96, 64, 30); }
      });
      box(c, 4.8, 4.6, 0.6, std(c, 0xffffff, { map: st, emissive: 0xffffff, emissiveMap: st, emissiveIntensity: 0.4, roughness: 0.8 }), 10.9, 0, -2.5);
      glow(c, 0xffc070, 5, 4, 10.4, 1.8, -2.1, 0.22);
      // alley props (left)
      box(c, 3.2, 5.4, 1.2, std(c, 0x44322c), -12.6, 0, -3.4);
      iboxes(c, wood, [[-10.4, 0, -3, 1, 1, 1], [-10.2, 1, -3, 0.8, 0.8, 0.8, 0.3], [-9.3, 0, -3.2, 0.9, 0.9, 0.9, 0.2]]);
      if (!c.low) {
        icyls(c, std(c, 0xa83a30), [[7.3, 0.15, -3.3, 0.16, 0.6]], 8); icyls(c, std(c, 0x3a5a48, { metalness: 0.3 }), [[-7.6, 0.15, -3.4, 0.3, 0.8], [0.6, 0.15, -3.5, 0.3, 0.8]], 10);
        box(c, 0.7, 1.2, 0.5, std(c, 0x2a4a7a), 2.2, 0.15, -3.5);
      }
      rain(c, 420, 0xbfe6e0, [-17, 17, 0, 12, -8, 4]);
      points(c, 100, { box: [-2, 2, 0.2, 5, -4.4, -3.2], color: 0xcfe0dc, size: 0.3, opacity: 0.1, vel: [0.1, 0.5, 0], sway: 0.2, add: false });
      return LIGHTS.district();
    },
    c => {
      // brick back wall with tall many-paned windows
      backdrop(c, tex(c, 1024, 512, (g, w, h, r) => {
        g.fillStyle = '#3c2e2a'; g.fillRect(0, 0, w, h); paintBrick(g, 0, 0, w, h, 26, 10, 'rgba(0,0,0,.22)');
        vgrad(g, 0, 0, w, h, [[0, 'rgba(6,10,12,.75)'], [0.5, 'rgba(6,10,12,.1)'], [1, 'rgba(6,10,12,.4)']]);
        for (let x = 40; x < w; x += 164) {
          const wy = 190, ww = 96, wh = 190;
          vgrad(g, x, wy, ww, wh, [[0, '#28504c'], [1, '#6fb0a0']]);
          g.strokeStyle = 'rgba(200,240,230,.25)'; g.lineWidth = 1; for (let i = 0; i < 14; i++) { const rx = x + r() * ww, ry = wy + r() * wh; g.beginPath(); g.moveTo(rx, ry); g.lineTo(rx - 5, ry + 26); g.stroke(); }
          g.strokeStyle = '#18100e'; g.lineWidth = 3; for (let i = 0; i <= 4; i++) { g.beginPath(); g.moveTo(x + i * ww / 4, wy); g.lineTo(x + i * ww / 4, wy + wh); g.stroke(); }
          for (let i = 0; i <= 6; i++) { g.beginPath(); g.moveTo(x, wy + i * wh / 6); g.lineTo(x + ww, wy + i * wh / 6); g.stroke(); }
          blob(g, x + ww / 2, wy + wh / 2, 150, 0x6fd0b8, 0.1);
        }
        g.fillStyle = '#14100e'; g.fillRect(0, 468, w, 44);
      }), 76, 26, 0, -2, -12, { fog: true });
      // shelving and girders silhouette layer
      backdrop(c, tex(c, 1024, 512, (g, w, h, r) => {
        g.fillStyle = '#16191c';
        for (let x = 10; x < w; x += 210) {
          const sw = 130, top = 250;
          g.fillRect(x, top, 6, 262); g.fillRect(x + sw, top, 6, 262);
          for (let y = top; y < 480; y += 62) { g.fillRect(x, y, sw + 6, 6); for (let k = 0; k < 3; k++) if (r() < 0.75) { const bw = rr(r, 26, 40), bh = rr(r, 22, 46); g.fillStyle = pick(r, ['#2a2420', '#22282a', '#30281e']); g.fillRect(x + 10 + k * 40, y - bh, bw, bh); g.fillStyle = '#16191c'; } }
        }
        g.fillRect(0, 150, w, 12); for (let x = 0; x < w; x += 60) { g.beginPath(); g.moveTo(x, 162); g.lineTo(x + 30, 196); g.lineTo(x + 60, 162); g.lineWidth = 4; g.strokeStyle = '#16191c'; g.stroke(); } g.fillRect(0, 194, w, 6);
      }), 64, 20, 0, -2, -8, { alpha: true, fog: true });
      floor(c, (g, w, h, r) => {
        g.fillStyle = '#5c5a56'; g.fillRect(0, 0, w, h);
        pTiles(g, w, h, 128, 70, r, 'rgba(20,18,16,.3)', 0.06);
        pSpecks(g, w, h, r, 700, 0.05);
        g.fillStyle = 'rgba(232,192,64,.5)'; g.fillRect(0, PZ(-2.4), w, 5); g.fillRect(0, PZ(2.6), w, 5);
        g.fillStyle = 'rgba(232,192,64,.35)'; for (let x = 0; x < w; x += 40) poly(g, [x, PZ(-2.9), x + 14, PZ(-2.9), x + 26, PZ(-2.5), x + 12, PZ(-2.5)], 'rgba(232,192,64,.35)');
        for (let i = 0; i < 5; i++) blob(g, 112 + i * 200, PZ(-0.5), 150, 0xffd9a0, 0.09);
        vgrad(g, 0, 0, w, PZ(-5), [[0, 'rgba(8,10,10,.55)'], [1, 'rgba(8,10,10,0)']]);
      }, { rough: 0.7 });
      const steel = std(c, 0x3a4246, { metalness: 0.5, roughness: 0.5 }), wood = std(c, 0x7a5638), wood2 = std(c, 0x5e4630);
      iboxes(c, steel, [-18, -9, 0, 9, 18].map(x => [x, 0, -5.4, 0.4, 8, 0.4]).concat([[0, 7.6, -5.4, 64, 0.4, 0.5], [0, 7.6, -3.4, 64, 0.3, 0.3]]));
      const cr = [];
      [[-14, -4], [-11.6, -4.4], [-6.5, -6], [5.5, -6.2], [13, -4.2], [15.4, -4]].forEach(p => { const n = 1 + Math.floor(c.rnd() * 3); let y = 0; for (let i = 0; i < n; i++) { const s = rr(c.rnd, 1, 1.5) - i * 0.15; cr.push([p[0] + rr(c.rnd, -0.15, 0.15), y, p[1], s, s, s, rr(c.rnd, -0.3, 0.3)]); y += s; } });
      iboxes(c, wood, cr.filter((_, i) => i % 2 === 0)); iboxes(c, wood2, cr.filter((_, i) => i % 2 === 1));
      icyls(c, std(c, 0x3a5a6a, { metalness: 0.4, roughness: 0.5 }), [[-3.6, 0, -4.4, 0.42, 1.2], [-2.6, 0, -4.7, 0.42, 1.2], [8.6, 0, -4.2, 0.42, 1.2], [-9.2, 0, -3.4, 0.42, 1.2]], 12);
      // hanging lamps that sway
      const lampM = emis(c, 0xffe0a0, 1.5), shade = std(c, 0x2a3a34, { metalness: 0.4 });
      const lamps = [-12, -4, 4, 12].map((x, i) => {
        const p = grp(c, x, 7.5, -3.6);
        box(c, 0.04, 1.6, 0.04, steel, 0, -1.6, 0, p); cone(c, 0.55, 0.4, 12, shade, 0, -2.0, 0, p); sph(c, 0.16, lampM, 0, -2.0, 0, 1, 1, 1, p);
        const gl = glow(c, 0xffd090, 3.2, 3.2, 0, -2.1, 0.2, 0.5, false, p);
        const cn = glow(c, 0xffd090, 4.5, 6, 0, -5, 0.1, 0.12, false, p);
        return { p, gl, cn, i };
      });
      c.ups.push(t => lamps.forEach(l => { l.p.rotation.z = Math.sin(t * 0.9 + l.i * 1.3) * 0.05 * c.ms; const f = flick(c, t, l.i * 3.1); l.gl.material.opacity = 0.5 * f; l.cn.material.opacity = 0.12 * f; }));
      // big sliding door (right) and broken shopfront wall (left)
      box(c, 4.6, 5.2, 0.3, std(c, 0x4a5a58, { metalness: 0.4, roughness: 0.6 }), 11.2, 0, -2.7); iboxes(c, steel, [[11.2, 5.2, -2.7, 5.4, 0.25, 0.4], [11.2, 0, -2.52, 0.1, 5.2, 0.06]]);
      box(c, 3, 6, 0.8, std(c, 0x4a3630), -12.4, 3.4, -2.9); iboxes(c, std(c, 0x4a3630), [[-13.6, 0, -2.9, 0.9, 3.4, 0.8], [-11.2, 0, -2.9, 0.7, 1.2, 0.8], [-10.4, 0, -2.8, 0.6, 0.35, 0.5, 0.4], [-9.7, 0, -3.1, 0.4, 0.25, 0.4, 0.9]]);
      if (!c.low) { const ch = box(c, 0.06, 4, 0.06, steel, 7, 3.6, -6); const hk = box(c, 0.5, 0.3, 0.3, std(c, 0xe8c040), 7, 3.3, -6); c.ups.push(t => { hk.position.x = ch.position.x = 7 + Math.sin(t * 0.5) * 0.15 * c.ms; }); }
      points(c, 220, { box: [-16, 16, 0.3, 7, -7, 1], color: 0xffe6c0, size: 0.05, opacity: 0.5, vel: [0.04, -0.05, 0], sway: 0.15 });
      rain(c, 60, 0xbfe6e0, [-3, 3, 0, 7.4, -6.4, -5.6], 0.3);
      const L = LIGHTS.district(); L.sky = 0x0a0e0e; L.fog = [0x18201e, 24, 70]; L.ambient = [0x9aa8a0, 0.9]; L.key = [0xffdca8, 1.8, [2, 9, 8]]; return L;
    },
  ],

  /* ============================= COSMIC ============================= */
  cosmic: [
    c => cosmicCommon(c, 0),
    c => cosmicCommon(c, 1),
  ],

  /* =============================== LAB ============================== */
  lab: [
    c => {
      // far: huge reactor cavern seen through the windows
      backdrop(c, tex(c, 1024, 512, (g, w, h, r) => {
        vgrad(g, 0, 0, w, h, [[0, '#061012'], [0.6, '#0e2a2c'], [1, '#143a38']]);
        blob(g, 512, 330, 300, 0x30ffb0, 0.3); blob(g, 512, 330, 120, 0xd0fff0, 0.5);
        g.fillStyle = '#0a1c1e'; g.beginPath(); g.ellipse(512, 330, 44, 110, 0, 0, TAU); g.fill();
        g.strokeStyle = 'rgba(80,255,190,.7)'; g.lineWidth = 3; for (let i = 0; i < 4; i++) { g.beginPath(); g.ellipse(512, 250 + i * 54, 60 + i * 4, 12, 0, 0, TAU); g.stroke(); }
        g.fillStyle = '#081416'; for (let x = 0; x < w; x += 70) { const hh = rr(r, 80, 240); g.fillRect(x + rr(r, 0, 20), 512 - hh, rr(r, 14, 30), hh); }
        g.fillRect(0, 210, w, 8); g.fillRect(0, 150, w, 5);
        for (let i = 0; i < 60; i++) { g.fillStyle = css(pick(r, [0x50ffc0, 0xffd84a, 0xff6a50]), 0.8); g.fillRect(r() * w, rr(r, 200, 480), 3, 3); }
      }), 84, 30, 0, -4, -20);
      // wall with observation windows cut out
      backdrop(c, tex(c, 1024, 512, (g, w, h, r) => {
        vgrad(g, 0, 0, w, h, [[0, '#182428'], [0.5, '#3a4c52'], [1, '#2c3a40']]);
        pTiles(g, w, h, 64, 64, r, 'rgba(8,14,16,.5)', 0.05);
        g.fillStyle = '#e8b030'; g.fillRect(0, 232, w, 6); g.fillStyle = '#50ffc0'; g.fillRect(0, 244, w, 2);
        for (let x = 0; x < w; x += 256) { // screens between windows
          g.fillStyle = '#081416'; g.fillRect(x + 196, 300, 56, 80); g.strokeStyle = '#50ffc0'; g.lineWidth = 2; g.beginPath();
          for (let i = 0; i <= 10; i++) { const yy = 340 + Math.sin(i * 1.3 + x) * 22; if (i) g.lineTo(x + 200 + i * 4.8, yy); else g.moveTo(x + 200 + i * 4.8, yy); } g.stroke();
          g.fillStyle = '#ffd84a'; g.fillRect(x + 200, 388, 20, 4); g.fillStyle = '#ff6a50'; g.fillRect(x + 226, 388, 20, 4);
        }
        g.globalCompositeOperation = 'destination-out'; g.fillStyle = '#000';
        for (let x = 18; x < w; x += 256) g.fillRect(x, 262, 160, 150);
        g.globalCompositeOperation = 'source-over'; g.strokeStyle = '#7f949a'; g.lineWidth = 6;
        for (let x = 18; x < w; x += 256) { g.strokeRect(x, 262, 160, 150); g.fillStyle = 'rgba(160,255,230,.06)'; g.fillRect(x, 262, 160, 150); }
      }), 64, 20, 0, -2, -9, { alpha: true, fog: true });
      floor(c, (g, w, h, r) => {
        g.fillStyle = '#5c6a70'; g.fillRect(0, 0, w, h);
        pTiles(g, w, h, 64, 46.5, r, 'rgba(14,22,26,.45)', 0.05);
        for (let x = 0; x < w; x += 28) poly(g, [x, PZ(-3.1), x + 14, PZ(-3.1), x + 26, PZ(-2.6), x + 12, PZ(-2.6)], 'rgba(232,176,48,.6)');
        g.fillStyle = 'rgba(80,255,190,.55)'; g.fillRect(0, PZ(-2.4), w, 3); g.fillRect(0, PZ(2.6), w, 3);
        g.strokeStyle = 'rgba(200,240,235,.2)'; g.lineWidth = 3; floorRing(g, 0, 0, 3); g.stroke();
        vgrad(g, 0, 0, w, PZ(-6), [[0, 'rgba(6,14,16,.55)'], [1, 'rgba(6,14,16,0)']]);
      }, { rough: 0.45, metal: 0.4, glow: 0.12 });
      const steel = std(c, 0x6a7a82, { metalness: 0.6, roughness: 0.4 }), dark = std(c, 0x1c2a2e, { metalness: 0.4 });
      // glowing specimen tubes (plants, not creatures)
      const tx = [-14, -10.5, -7, 7.5, 14.5];
      const tubeA = std(c, 0x60ffc0, { transparent: true, opacity: 0.5, emissive: 0x20d090, emissiveIntensity: 0.8, roughness: 0.2 });
      icyls(c, tubeA, tx.map(x => [x, 0.5, -4.4, 0.6, 3.2]), 12); pulseE(c, tubeA, 0.8, 0.3, 1.3);
      icyls(c, steel, tx.flatMap(x => [[x, 0, -4.4, 0.75, 0.5], [x, 3.7, -4.4, 0.75, 0.4]]), 12);
      const tg = tx.map(x => glow(c, 0x40ffb0, 3, 5, x, 2.2, -4.2, 0.22)); c.ups.push(t => tg.forEach((s, i) => { s.material.opacity = 0.2 + 0.06 * Math.sin(t * 1.3 + i); }));
      // server racks with LEDs
      iboxes(c, dark, [[-3.5, 0, -5.6, 1.4, 3.4, 1], [-1.9, 0, -5.6, 1.4, 3.4, 1], [3.2, 0, -5.6, 1.4, 3.4, 1]]);
      if (!c.low) { const leds = []; [-3.5, -1.9, 3.2].forEach(x => { for (let y = 0.5; y < 3.2; y += 0.35) for (let k = -0.45; k < 0.5; k += 0.3) if (c.rnd() < 0.7) leds.push([x + k, y, -5.08, 0.1, 0.06, 0.04]); }); const lm = emis(c, 0x50ffc0, 1.4); iboxes(c, lm, leds); pulseE(c, lm, 1.2, 0.5, 2.2); }
      // conveyor with moving lights
      box(c, 64, 0.6, 1, steel, 0, 0, -3.2); box(c, 64, 0.06, 0.8, dark, 0, 0.6, -3.2);
      const cl = iboxes(c, emis(c, 0xffd84a, 1.4), Array.from({ length: 16 }, (_, i) => [-30 + i * 4, 0.2, -2.69, 0.5, 0.12, 0.04]));
      c.ups.push(t => { cl.position.x = (t * 1.2 * c.ms) % 4; });
      // wall fans + pipes
      const fanG = new THREE.BoxGeometry(2.2, 0.28, 0.06);
      const fans = [-10.5, 0, 10.5].map(x => { cyl(c, 1.3, 1.3, 0.3, 16, dark, x, 6.3, -8.4).rotation.x = Math.PI / 2; const p = grp(c, x, 6.45, -8.2); add(c, fanG, steel, 0, 0, 0, p); add(c, fanG, steel, 0, 0, 0, p).rotation.z = Math.PI / 2; return p; });
      c.ups.push(t => fans.forEach((f, i) => { f.rotation.z = t * (2 + i * 0.4) * c.ms; }));
      const p1 = cyl(c, 0.2, 0.2, 64, 8, std(c, 0xb86a3a, { metalness: 0.5 }), 0, 0, -7.6); p1.rotation.z = Math.PI / 2; p1.position.y = 5;
      const p2 = cyl(c, 0.14, 0.14, 64, 8, steel, 0, 0, -7.4); p2.rotation.z = Math.PI / 2; p2.position.y = 4.5;
      // robot arm (left) slowly moving
      const arm = grp(c, -11.8, 0, -3); box(c, 1, 0.5, 1, steel, 0, 0, 0, arm);
      const a1 = grp(c, 0, 0.5, 0, arm); box(c, 0.3, 2.2, 0.3, std(c, 0xe8b030), 0, 0, 0, a1);
      const a2 = grp(c, 0, 2.2, 0, a1); box(c, 0.24, 1.6, 0.24, std(c, 0xe8b030), 0, 0, 0, a2); sph(c, 0.2, emis(c, 0x50ffc0, 1), 0, 1.7, 0, 1, 1, 1, a2);
      c.ups.push(t => { a1.rotation.z = -0.3 + Math.sin(t * 0.5) * 0.2 * c.ms; a2.rotation.z = -0.9 + Math.sin(t * 0.7 + 1) * 0.3 * c.ms; });
      // test chamber door (right)
      const dt = tex(c, 256, 256, (g, w, h) => {
        vgrad(g, 0, 0, w, h, [[0, '#7a8a90'], [1, '#56666c']]);
        for (let x = -20; x < w; x += 36) poly(g, [x, 0, x + 18, 0, x + 40, 30, x + 22, 30], '#e8b030');
        for (let x = -20; x < w; x += 36) poly(g, [x, h - 24, x + 18, h - 24, x + 40, h, x + 22, h], '#e8b030');
        g.fillStyle = '#16262a'; g.fillRect(34, 44, 188, 40); label(g, 'TEST CHAMBER', 128, 65, 23, '#50ffc0');
        g.fillStyle = '#16262a'; g.beginPath(); g.arc(128, 150, 44, 0, TAU); g.fill(); g.fillStyle = '#8fffe0'; g.beginPath(); g.arc(128, 150, 34, 0, TAU); g.fill();
        g.strokeStyle = '#2c3a40'; g.lineWidth = 4; g.beginPath(); g.moveTo(128, 30); g.lineTo(128, 232); g.stroke();
      });
      box(c, 4.2, 4.8, 0.5, std(c, 0xffffff, { map: dt, emissive: 0xffffff, emissiveMap: dt, emissiveIntensity: 0.3, metalness: 0.4, roughness: 0.5 }), 10.9, 0, -2.5);
      iboxes(c, dark, [[8.6, 0, -2.5, 0.4, 5.2, 0.7], [13.2, 0, -2.5, 0.4, 5.2, 0.7], [10.9, 4.8, -2.5, 5, 0.5, 0.7]]);
      const wl = glow(c, 0xffb030, 1.6, 1.6, 10.9, 5.6, -2.2, 0.7); pulseO(c, wl.material, 0.5, 0.25, c.rf ? 0.9 : 2);
      points(c, 160, { box: [-15, 15, 0.5, 4, -4.9, -3.9], color: 0xa0ffe0, size: 0.07, opacity: 0.6, vel: [0, 0.5, 0], sway: 0.05 });
      points(c, 120, { box: [-16, 16, 0.3, 8, -8, 0], color: 0xd0fff0, size: 0.04, opacity: 0.35, vel: [0.05, 0.03, 0], sway: 0.15 });
      return LIGHTS.lab();
    },
    c => {
      backdrop(c, tex(c, 1024, 512, (g, w, h, r) => {
        vgrad(g, 0, 0, w, h, [[0, '#2a3438'], [0.5, '#8a989c'], [1, '#6a787c']]);
        pTiles(g, w, h, 96, 80, r, 'rgba(20,30,34,.45)', 0.05);
        g.fillStyle = '#0c1a1e'; g.fillRect(0, 232, w, 60); vgrad(g, 0, 238, w, 48, [[0, '#1c4a48'], [1, '#2f7a70']]);
        g.fillStyle = '#0c1a1e'; for (let x = 0; x < w; x += 120) g.fillRect(x, 232, 8, 60);
        g.fillStyle = 'rgba(160,255,230,.5)'; for (let x = 40; x < w; x += 120) g.fillRect(x, 244, 50, 3);
        label(g, '07', 512, 386, 110, 'rgba(232,140,48,.75)');
        g.fillStyle = '#e8902f'; g.fillRect(0, 300, w, 6); g.fillRect(0, 462, w, 6);
        g.fillStyle = '#1c282c'; g.fillRect(0, 468, w, 44);
      }), 72, 28, 0, -2, -11, { fog: true });
      backdrop(c, tex(c, 1024, 512, (g, w, h, r) => {
        g.fillStyle = '#1c282c';
        for (let x = 60; x < w; x += 226) { g.fillRect(x, 120, 26, 392); g.fillRect(x - 20, 120, 66, 14); g.fillStyle = '#e8902f'; g.fillRect(x + 4, 300, 18, 60); g.fillStyle = '#1c282c'; }
        g.fillRect(0, 120, w, 10); g.strokeStyle = '#1c282c'; g.lineWidth = 4;
        for (let x = 0; x < w; x += 113) { g.beginPath(); g.moveTo(x, 130); g.quadraticCurveTo(x + 56, 130 + rr(r, 30, 70), x + 113, 130); g.stroke(); }
      }), 64, 20, 0, -2, -7.5, { alpha: true, fog: true });
      floor(c, (g, w, h, r) => {
        g.fillStyle = '#7a868a'; g.fillRect(0, 0, w, h);
        pTiles(g, w, h, 96, 70, r, 'rgba(20,30,34,.4)', 0.05);
        g.strokeStyle = 'rgba(232,144,47,.6)'; g.lineWidth = 5; floorRing(g, 0, 0, 7.2); g.stroke();
        g.strokeStyle = 'rgba(80,255,190,.35)'; g.lineWidth = 3; floorRing(g, 0, 0, 2.2); g.stroke();
        g.fillStyle = 'rgba(232,144,47,.5)'; g.fillRect(0, PZ(-2.5), w, 4);
        vgrad(g, 0, 0, w, PZ(-6), [[0, 'rgba(10,18,20,.5)'], [1, 'rgba(10,18,20,0)']]);
      }, { rough: 0.5, metal: 0.3 });
      const steel = std(c, 0x8a989c, { metalness: 0.6, roughness: 0.4 }), dark = std(c, 0x1c282c, { metalness: 0.4 }), orange = std(c, 0xe8902f, { roughness: 0.6 });
      // emitter towers with pulsing rings
      const ex = [-13, -6.5, 0, 6.5, 13];
      icyls(c, steel, ex.map(x => [x, 0, -4.6, 0.45, 5]), 10, 0.6);
      const ringM = emis(c, 0x50ffc0, 1.3); icyls(c, ringM, ex.flatMap(x => [[x, 1.4, -4.6, 0.5, 0.14], [x, 3, -4.6, 0.42, 0.14]]), 10); pulseE(c, ringM, 1.2, 0.5, 1.5);
      const tips = ex.map(x => glow(c, 0x50ffc0, 1.8, 1.8, x, 5.2, -4.5, 0.6)); c.ups.push(t => tips.forEach((s, i) => { s.material.opacity = 0.45 + 0.2 * Math.sin(t * 1.5 + i * 1.2); }));
      // laser grid across the back
      const beamM = bas(c, { color: 0xff7a40, transparent: true, opacity: 0.6, blending: THREE.AdditiveBlending, depthWrite: false, fog: false });
      iboxes(c, beamM, [1.2, 2.4, 3.6].map(y => [0, y, -6.4, 64, 0.05, 0.05])); pulseO(c, beamM, 0.5, 0.2, 0.9);
      // ceiling turbine
      const turb = grp(c, 0, 8.2, -5); cyl(c, 2.6, 2.6, 0.4, 20, dark, 0, 8.3, -5);
      const blG = new THREE.BoxGeometry(4.8, 0.08, 0.6); for (let i = 0; i < 3; i++) add(c, blG, steel, 0, 0, 0, turb).rotation.y = i * Math.PI / 3;
      c.ups.push(t => { turb.rotation.y = t * 1.4 * c.ms; });
      glow(c, 0xd0fff0, 9, 3, 0, 7.8, -4.6, 0.3);
      // piston panels moving up and down
      const pist = [-9.8, -3.2, 3.2, 9.8].map(x => box(c, 2.2, 1.4, 0.8, orange, x, 0, -6.2));
      c.ups.push(t => pist.forEach((p, i) => { p.position.y = 0.7 + (0.5 + 0.5 * Math.sin(t * 0.6 + i * 1.5)) * 1.1 * (c.rm ? 0.3 : 1); }));
      iboxes(c, dark, [-9.8, -3.2, 3.2, 9.8].map(x => [x, 0, -6.2, 2.6, 0.3, 1.1]));
      // side walls: entry door (left), sealed hatch (right)
      box(c, 3.6, 5.4, 0.5, dark, -11.8, 0, -2.8); box(c, 2.6, 4.2, 0.06, emis(c, 0x50ffc0, 0.4), -11.8, 0, -2.52);
      box(c, 3.6, 5.4, 0.5, steel, 11.8, 0, -2.8); cyl(c, 1.2, 1.2, 0.2, 16, orange, 11.8, 1.6, -2.5).rotation.x = Math.PI / 2;
      points(c, 200, { box: [-16, 16, 0.3, 8, -8, 0], color: 0xd0fff0, size: 0.05, opacity: 0.4, vel: [0.04, 0.06, 0], sway: 0.15 });
      const L = LIGHTS.lab(); L.sky = 0x1a2428; L.fog = [0x2a3a3e, 30, 85]; L.ambient = [0xe6f6f2, 1.1]; L.ground = 0x4a565a; L.rim = [0xff9a40, 1.1, [8, 5, -6]]; return L;
    },
  ],

  /* ============================= TEMPLE ============================= */
  temple: [
    c => {
      far(c, (g, w, h, r) => {
        vgrad(g, 0, 0, w, h, [[0, '#4aa8c8'], [0.45, '#8fd0d8'], [0.7, '#ffe2a0'], [0.8, '#ffd088'], [1, '#ffd088']]);
        blob(g, 660, 300, 190, 0xfff4c0, 0.6); g.fillStyle = '#fffbe6'; g.beginPath(); g.ellipse(660, 300, 20, 30, 0, 0, TAU); g.fill();
        pClouds(g, w, r, 8, 200, 330, 0xffffff, 0.12, 60);
        pRidge(g, w, h, 392, 130, r, '#9cc8c0'); vgrad(g, 0, 300, w, 120, [[0, 'rgba(255,236,190,0)'], [1, 'rgba(255,236,190,.5)']]);
        pRidge(g, w, h, 410, 90, r, '#6fae98'); pRidge(g, w, h, 420, 50, r, '#4f9478', 6);
      });
      cloudLayer(c, 0xffffff, 0.14, 9, -24, 9, 0.003);
      mid(c, (g, w, h, r) => {
        // stepped temple pyramid in the trees
        const cx = 560, by = MY(0);
        for (let i = 0; i < 6; i++) { const ww = 330 - i * 50, y = by - 30 - i * 30; vgrad(g, cx - ww / 2, y, ww, 34, [[0, '#b8a878'], [1, '#8a7c5a']]); g.fillStyle = 'rgba(60,50,30,.3)'; g.fillRect(cx - ww / 2, y + 28, ww, 6); }
        g.fillStyle = '#6a5c40'; g.fillRect(cx - 26, by - 216, 52, 36); g.fillStyle = '#ffe9a8'; g.fillRect(cx - 9, by - 204, 18, 24);
        g.fillStyle = '#7a6c4a'; poly(g, [cx - 22, by, cx - 12, by - 180, cx + 12, by - 180, cx + 22, by], '#a09068');
        pRidge(g, w, h, by - 40, 110, r, '#2f6a4a', 22); pRidge(g, w, h, by - 10, 80, r, '#1f5038', 26);
        for (let i = 0; i < 9; i++) { const x = rr(r, 0, w), y = by - rr(r, 60, 150); if (Math.abs(x - cx) < 190) continue; g.strokeStyle = '#1a3a2a'; g.lineWidth = 5; g.beginPath(); g.moveTo(x, by); g.quadraticCurveTo(x + 8, y + 40, x + 4, y); g.stroke(); for (let k = 0; k < 7; k++) { const a = -Math.PI * (0.05 + k * 0.15); g.beginPath(); g.moveTo(x + 4, y); g.quadraticCurveTo(x + 4 + Math.cos(a) * 30, y + Math.sin(a) * 26 - 8, x + 4 + Math.cos(a) * 52, y + Math.sin(a) * 18 + 14); g.lineWidth = 4; g.strokeStyle = '#2a6a44'; g.stroke(); } }
      });
      floor(c, (g, w, h, r) => {
        g.fillStyle = '#a89a74'; g.fillRect(0, 0, w, h);
        pTiles(g, w, h, 58, 42, r, 'rgba(70,58,36,.4)', 0.07, 0.5);
        for (let i = 0; i < 40; i++) blob(g, r() * w, r() < 0.5 ? rr(r, 0, PZ(-2.4)) : rr(r, PZ(2.6), h), rr(r, 20, 50), 0x5a8a3a, 0.16);
        g.strokeStyle = 'rgba(110,84,40,.5)'; g.lineWidth = 5; floorRing(g, 0, 0, 2.2); g.stroke(); g.lineWidth = 2; floorRing(g, 0, 0, 1.7); g.stroke();
        g.save(); g.translate(512, PZ(0)); g.scale(1, 0.72); g.strokeStyle = 'rgba(110,84,40,.4)'; g.lineWidth = 3; for (let i = 0; i < 12; i++) { g.rotate(TAU / 12); g.beginPath(); g.moveTo(40, 0); g.lineTo(62, 0); g.stroke(); } g.restore();
        cracks(g, r, 10, 0, 0, w, h, 'rgba(60,48,28,.3)');
      }, { rough: 0.9 });
      const stone = std(c, 0xb8a87c), stone2 = std(c, 0x9a8c66), moss = std(c, 0x5f8a44);
      iboxes(c, stone, [0, 1, 2, 3].map(i => [0, 0, -3.6 - i * 1.1, 44, 0.45 * (i + 1), 1.1]).concat([[0, 0, -10.6, 64, 1.8, 5.2]]));
      const colx = [-16.5, -10.5, -4.5, 4.5, 10.5, 16.5];
      icyls(c, stone2, colx.map(x => [x, 1.8, -8.8, 0.5, 5.6]), 10);
      iboxes(c, stone, colx.map(x => [x, 7.4, -8.8, 1.4, 0.4, 1.4]).concat([[0, 7.8, -8.8, 64, 1, 1.5]]));
      // glowing glyph obelisks
      const gt = tex(c, 64, 256, (g, w, h, r) => {
        g.fillStyle = '#000'; g.fillRect(0, 0, w, h); g.strokeStyle = '#fff'; g.lineWidth = 4;
        for (let i = 0; i < 5; i++) { const y = 30 + i * 46; g.beginPath(); if (i % 3 === 0) g.arc(32, y, 13, 0, TAU); else if (i % 3 === 1) { g.moveTo(16, y + 12); g.lineTo(32, y - 14); g.lineTo(48, y + 12); g.closePath(); } else { g.moveTo(16, y - 10); g.lineTo(48, y - 10); g.moveTo(16, y); g.lineTo(48, y); g.moveTo(32, y - 10); g.lineTo(32, y + 14); } g.stroke(); }
      });
      const gm = std(c, 0xb0a074, { emissive: 0x40ffd0, emissiveMap: gt, emissiveIntensity: 1 }); pulseE(c, gm, 1.0, 0.5, 1.1);
      [-11.4, -6.6, 6.6].forEach(x => { box(c, 0.9, 3.6, 0.9, gm, x, x === -11.4 ? 0 : 1.8, x === -11.4 ? -3 : -7.6); });
      cone(c, 0.64, 0.7, 4, stone2, -11.4, 3.6, -3).rotation.y = Math.PI / 4;
      // waterfall on the left
      const wt = fallTex(c, ['#8fd8e0', '#d8f6f8', 0xffffff], 0.5);
      backdrop(c, wt, 3, 7.4, -13.4, 1.8, -9.4, { opacity: 0.9, fog: true }); box(c, 4, 0.5, 1.4, stone2, -13.4, 1.8, -9); glow(c, 0xe0ffff, 5, 2, -13.4, 2.5, -8.6, 0.3);
      // crumbling wall (right)
      const ct = tex(c, 256, 256, (g, w, h, r) => { g.fillStyle = '#a4946a'; g.fillRect(0, 0, w, h); pTiles(g, w, h, 64, 42, r, 'rgba(50,40,22,.55)', 0.1, 0.5); cracks(g, r, 12, 0, 0, w, h, 'rgba(40,30,16,.6)', 2.5, 130); for (let i = 0; i < 8; i++) blob(g, r() * w, r() * h, 34, 0x4f7a34, 0.3); });
      box(c, 4.4, 4.6, 0.7, std(c, 0xffffff, { map: ct }), 10.9, 0, -2.5);
      iboxes(c, stone2, [[9.2, 4.6, -2.5, 1, 0.6, 0.7], [11.6, 4.6, -2.5, 1.5, 0.9, 0.7], [8.4, 0, -2.6, 0.7, 0.5, 0.6, 0.4], [13.5, 0, -2.7, 0.8, 0.6, 0.7, 0.8], [13.9, 0.6, -2.7, 0.5, 0.4, 0.5, 0.2]]);
      if (!c.low) {
        iboxes(c, moss, [[-3, 0.45, -3.4, 3, 0.06, 0.5], [6, 0.9, -4.6, 4, 0.06, 0.6], [-8, 1.35, -5.7, 3.5, 0.06, 0.6], [10.9, 4.6, -2.3, 1.4, 0.12, 0.5]]);
        icyls(c, stone2, [[-9, 0, -3.1, 0.45, 0.8], [-8.1, 0, -2.9, 0.42, 0.35]], 10);
        const bowl = emis(c, 0xffb040, 1.2); [-2.4, 2.4].forEach(x => { cyl(c, 0.5, 0.25, 0.5, 10, stone2, x, 1.8, -7.4); sph(c, 0.3, bowl, x, 2.4, -7.4, 1, 0.7, 1); const f = glow(c, 0xffb040, 2, 2, x, 2.6, -7.2, 0.5); c.ups.push(t => { f.material.opacity = 0.5 * flick(c, t, x); }); });
      }
      points(c, 200, { box: [-16, 16, 0.4, 8, -8, 2], color: 0xfff0a0, size: 0.08, opacity: 0.7, vel: [0.08, 0.1, 0], sway: 0.3, twinkle: 1.2 });
      points(c, 80, { box: [-15, -11.8, 1.8, 4, -9.2, -8.2], color: 0xffffff, size: 0.12, opacity: 0.35, vel: [0.1, 0.3, 0], sway: 0.1 });
      return LIGHTS.temple();
    },
    c => {
      far(c, (g, w, h, r) => {
        vgrad(g, 0, 0, w, h, [[0, '#3a98b0'], [0.5, '#8fd0c8'], [0.78, '#e6f0b0'], [1, '#e6f0b0']]);
        blob(g, 380, 250, 220, 0xfff8d0, 0.5);
        g.save(); g.translate(380, 250); g.fillStyle = 'rgba(255,250,210,.1)'; for (let i = 0; i < 9; i++) { g.rotate(0.22); g.beginPath(); g.moveTo(0, 0); g.lineTo(700, 30); g.lineTo(700, -30); g.fill(); } g.restore();
        pRidge(g, w, h, 400, 120, r, '#5fa888', 10); pRidge(g, w, h, 420, 120, r, '#3a8060', 18);
      });
      // courtyard wall with niches, vines and glyphs
      const wallT = tex(c, 1024, 512, (g, w, h, r) => {
        g.clearRect(0, 0, w, h);
        const top = 250; vgrad(g, 0, top, w, h - top, [[0, '#b0a078'], [1, '#7a6e50']]);
        for (let x = 0; x < w; x += 64) g.clearRect(x + 40, top, 24, 22); // battlement notches
        paintBrick(g, 0, top + 22, w, h, 58, 26, 'rgba(50,40,22,.35)');
        for (let x = 36; x < w; x += 190) {
          archPath(g, x, 470, 74, 150); g.fillStyle = '#3a3424'; g.fill(); archPath(g, x, 470, 74, 150); g.strokeStyle = '#d0c090'; g.lineWidth = 4; g.stroke();
          blob(g, x + 37, 420, 50, 0x40ffd0, 0.35); g.fillStyle = '#8a7c58'; g.fillRect(x + 27, 420, 20, 50); g.beginPath(); g.ellipse(x + 37, 412, 13, 13, 0, 0, TAU); g.fill();
        }
        for (let i = 0; i < 26; i++) { const x = r() * w; g.strokeStyle = css(pick(r, [0x3f7a3a, 0x4f9044, 0x2f6030]), 0.9); g.lineWidth = rr(r, 2, 4); g.beginPath(); g.moveTo(x, top + 10); g.bezierCurveTo(x + rr(r, -20, 20), top + 60, x + rr(r, -20, 20), top + 100, x + rr(r, -14, 14), top + rr(r, 90, 190)); g.stroke(); }
        for (let i = 0; i < 60; i++) blob(g, r() * w, top + rr(r, 0, 30), rr(r, 10, 26), 0x4f9044, 0.4);
      });
      backdrop(c, wallT, 68, 22, 0, -3, -11.5, { alpha: true, fog: true });
      const glyphT = tex(c, 512, 32, (g, w, h, r) => { g.strokeStyle = '#fff'; g.lineWidth = 3; for (let x = 12; x < w; x += 30) { g.beginPath(); const k = (r() * 3) | 0; if (k === 0) g.arc(x, 16, 8, 0, TAU); else if (k === 1) { g.moveTo(x - 8, 24); g.lineTo(x, 6); g.lineTo(x + 8, 24); } else { g.moveTo(x - 8, 8); g.lineTo(x + 8, 8); g.moveTo(x, 8); g.lineTo(x, 26); } g.stroke(); } }, true);
      glyphT.repeat.set(3, 1);
      const gl = backdrop(c, glyphT, 68, 0.7, 0, 6.6, -11.45, { add: true, color: 0x60ffd8, opacity: 0.8 }); pulseO(c, gl.material, 0.6, 0.3, 0.9);
      floor(c, (g, w, h, r) => {
        g.fillStyle = '#93966e'; g.fillRect(0, 0, w, h);
        pTiles(g, w, h, 70, 52, r, 'rgba(50,60,34,.45)', 0.08, 0.5);
        for (let i = 0; i < 70; i++) blob(g, r() * w, r() < 0.6 ? rr(r, 0, PZ(-2.2)) : rr(r, PZ(2.4), h), rr(r, 18, 46), 0x4f8a3a, 0.2);
        cracks(g, r, 8, 0, 0, w, h, 'rgba(40,50,26,.3)');
        g.strokeStyle = 'rgba(64,255,208,.3)'; g.lineWidth = 4; floorRing(g, 0, 0, 3.2); g.stroke();
      }, { rough: 0.9 });
      const stone = std(c, 0xa89a72), stone2 = std(c, 0x8a7e5c), leaf = std(c, 0x3f7a3c, { roughness: 1 }), leaf2 = std(c, 0x58994a, { roughness: 1 });
      // reflecting pool + fountain
      box(c, 14, 0.35, 0.3, stone, 0, 0, -4.1); box(c, 14, 0.35, 0.3, stone, 0, 0, -7.9); iboxes(c, stone, [[-7, 0, -6, 0.3, 0.35, 4.1], [7, 0, -6, 0.3, 0.35, 4.1]]);
      const water = std(c, 0x3fb0b8, { roughness: 0.1, metalness: 0.4, emissive: 0x1a6a70, emissiveIntensity: 0.5 }); box(c, 13.6, 0.2, 3.6, water, 0, 0, -6); pulseE(c, water, 0.5, 0.15, 0.8);
      cyl(c, 0.5, 0.7, 1.6, 10, stone2, 0, 0.2, -6); cyl(c, 1.3, 0.4, 0.3, 14, stone, 0, 1.8, -6);
      const ft = fallTex(c, ['#9fe0e8', '#e8fbfc', 0xffffff], 0.6);
      [-0.9, 0.9].forEach(x => backdrop(c, ft, 0.5, 1.7, x, 0.2, -5.6, { opacity: 0.8, fog: true }));
      const shim = [-4, 3.5].map(x => glow(c, 0xc0ffff, 4, 1.2, x, 0.22, -5.4, 0.25, true)); c.ups.push(t => shim.forEach((s, i) => { s.material.opacity = 0.2 + 0.1 * Math.sin(t * 1.4 + i * 2); }));
      // big tree (left) and smaller tree (right)
      const trunk = std(c, 0x6a5038);
      cyl(c, 0.5, 0.8, 5.5, 8, trunk, -12.6, 0, -4.6); [[-12.6, 6.4, -4.6, 3], [-10.8, 5.6, -4.2, 2], [-14.2, 5.4, -4.9, 2.2], [-12, 7.6, -5, 2]].forEach((p, i) => sph(c, 1, i % 2 ? leaf2 : leaf, p[0], p[1], p[2], p[3], p[3] * 0.75, p[3] * 0.8));
      cyl(c, 0.3, 0.45, 3.6, 8, trunk, 13.2, 0, -5); sph(c, 1, leaf, 13.2, 4.6, -5, 2.2, 1.7, 1.8); sph(c, 1, leaf2, 12.2, 4, -4.6, 1.4, 1.1, 1.2);
      // stone lanterns
      const lx = [-8.6, 8.6, -3.6, 3.6];
      iboxes(c, stone2, lx.map(x => [x, 0, -3.2, 0.5, 1.1, 0.5]).concat(lx.map(x => [x, 1.5, -3.2, 0.8, 0.14, 0.8])));
      iboxes(c, emis(c, 0xffd070, 1.4), lx.map(x => [x, 1.1, -3.2, 0.4, 0.4, 0.4]));
      const lg = lx.map(x => glow(c, 0xffc860, 2.2, 2.2, x, 1.3, -3.0, 0.5)); c.ups.push(t => lg.forEach((s, i) => { s.material.opacity = 0.5 * flick(c, t, i * 1.7); }));
      // rubble from the wall they came through (left), sealed arch door (right)
      iboxes(c, stone2, [[-10.2, 0, -2.9, 0.9, 0.6, 0.7, 0.3], [-9.4, 0, -3.3, 0.6, 0.4, 0.6, 0.9], [-10.6, 0.6, -2.9, 0.5, 0.4, 0.5, 0.6]]);
      box(c, 3.6, 5, 0.6, stone, 11, 0, -2.7); box(c, 2, 3.6, 0.1, std(c, 0x5a4a30), 11, 0, -2.38);
      points(c, 260, { box: [-16, 16, 0.3, 7, -9, 2], color: 0xd8ff90, size: 0.09, opacity: 0.8, vel: [0.05, 0.04, 0], sway: 0.5, twinkle: 1.6 });
      const L = LIGHTS.temple(); L.sky = 0x6fbcc0; L.fog = [0xb8d8b0, 32, 100]; L.ambient = [0xf0ffd8, 1.1]; L.key = [0xfff0c0, 2.1, [-5, 10, 7]]; L.rim = [0x50ffc8, 1.1, [8, 6, -7]]; return L;
    },
  ],

  /* ============================= VOLCANO ============================ */
  volcano: [
    c => {
      far(c, (g, w, h, r) => {
        vgrad(g, 0, 0, w, h, [[0, '#120406'], [0.45, '#3a0c0a'], [0.7, '#8a2a10'], [0.8, '#d86a20'], [1, '#d86a20']]);
        blob(g, 470, 250, 200, 0xff7a20, 0.4);
        poly(g, [250, 420, 420, 232, 450, 240, 480, 228, 520, 236, 720, 420], '#1c0a0a');
        g.strokeStyle = '#ffb040'; g.lineWidth = 4; g.beginPath(); g.moveTo(462, 236); g.quadraticCurveTo(450, 300, 400, 340); g.quadraticCurveTo(380, 380, 330, 418); g.stroke();
        g.lineWidth = 3; g.beginPath(); g.moveTo(480, 232); g.quadraticCurveTo(520, 300, 560, 330); g.quadraticCurveTo(600, 380, 590, 420); g.stroke();
        blob(g, 470, 226, 46, 0xffe080, 0.9);
        pClouds(g, w, r, 9, 110, 230, 0x1a0808, 0.3, 70); pClouds(g, w, r, 4, 170, 230, 0xff6a20, 0.08, 60);
        pRidge(g, w, h, 412, 70, r, '#240c0a', 8);
      });
      cloudLayer(c, 0x2a1210, 0.3, 10, -22, 12, 0.005, { n: 7, size: 36 });
      mid(c, (g, w, h, r) => {
        pRidge(g, w, h, MY(0) - 30, 150, r, '#1c0c0c', 26);
        // fortress towers
        for (let i = 0; i < 5; i++) {
          const x = 60 + i * 215 + rr(r, -20, 20), tw = rr(r, 60, 90), th = rr(r, 150, 215), y = MY(0) - th;
          vgrad(g, x, y, tw, th + 80, [[0, '#2c1614'], [1, '#160a0a']]);
          for (let k = 0; k < 4; k++) g.fillRect(x - 6 + k * (tw + 12) / 4, y - 12, (tw + 12) / 8, 14);
          g.fillStyle = '#160a0a'; g.fillRect(x - 6, y, tw + 12, 8);
          for (let k = 0; k < 3; k++) { blob(g, x + tw / 2, y + 40 + k * 46, 22, 0xff7a20, 0.5); g.fillStyle = '#ffb050'; g.fillRect(x + tw / 2 - 4, y + 32 + k * 46, 8, 16); }
          g.fillStyle = 'rgba(255,110,40,.25)'; g.fillRect(x + tw - 3, y, 3, th);
        }
        g.fillStyle = '#160a0a'; g.fillRect(0, MY(0) - 70, w, 200);
      });
      floor(c, (g, w, h, r) => {
        g.fillStyle = '#5a4844'; g.fillRect(0, 0, w, h);
        pTiles(g, w, h, 80, 58, r, 'rgba(20,10,8,.5)', 0.07, 0.5);
        pSpecks(g, w, h, r, 500, 0.06);
        cracks(g, r, 9, 0, 0, w, PZ(-2.4), 'rgba(255,120,40,.5)', 2.5, 110); cracks(g, r, 6, 0, PZ(2.8), w, h, 'rgba(255,120,40,.4)', 2.5, 110);
        blob(g, 512, PZ(-5), 520, 0xff6a20, 0.14);
        vgrad(g, 0, 0, w, PZ(-6), [[0, 'rgba(20,6,4,.5)'], [1, 'rgba(20,6,4,0)']]);
      }, { rough: 0.85 });
      const rock = std(c, 0x3a2a28), rock2 = std(c, 0x2a1c1c), iron = std(c, 0x1a1414, { metalness: 0.6, roughness: 0.5 });
      // fortress wall
      const wt = tex(c, 512, 128, (g, w, h, r) => { g.fillStyle = '#4a3632'; g.fillRect(0, 0, w, h); pTiles(g, w, h, 40, 20, r, 'rgba(14,6,6,.6)', 0.1, 0.5); vgrad(g, 0, 0, w, h, [[0, 'rgba(0,0,0,.35)'], [1, 'rgba(255,90,20,.18)']]); }, true);
      wt.repeat.set(4, 1);
      box(c, 64, 8, 1, std(c, 0xffffff, { map: wt }), 0, 0, -7.6);
      const cren = []; for (let x = -31; x <= 31; x += 2) cren.push([x, 8, -7.6, 1, 0.8, 1]); iboxes(c, rock2, cren);
      // lava channel + lavafalls
      const lavaT = tex(c, 256, 256, (g, w, h, r) => { g.fillStyle = '#ff7a18'; g.fillRect(0, 0, w, h); for (let i = 0; i < 40; i++) blob(g, r() * w, r() * h, rr(r, 14, 40), 0xffe060, 0.5); for (let i = 0; i < 46; i++) { const x = r() * w, y = r() * h, rad = rr(r, 8, 26); for (const ox of [-w, 0, w]) for (const oy of [-h, 0, h]) blob(g, x + ox, y + oy, rad, 0x3a0c06, 0.75); } }, true);
      lavaT.repeat.set(12, 1);
      const lavaM = bas(c, { map: lavaT, fog: false });
      const lava = add(c, new THREE.PlaneGeometry(64, 1.5), lavaM, 0, 0.03, -5.2); lava.rotation.x = -Math.PI / 2;
      c.ups.push(t => { lavaT.offset.x = t * 0.02 * c.ms; lavaM.color.setScalar(0.85 + 0.15 * Math.sin(t * 0.9)); });
      iboxes(c, rock2, [[0, 0, -4.35, 64, 0.22, 0.2], [0, 0, -6.05, 64, 0.22, 0.2]]);
      const lg = glow(c, 0xff6a18, 64, 5, 0, 0.9, -5, 0.3); pulseO(c, lg.material, 0.28, 0.08, 0.9);
      const fall = fallTex(c, ['#ff6a10', '#ffd040', 0xfff0a0], 0.35);
      [-6, 6, -17, 17].forEach(x => { backdrop(c, fall, 1.5, 5.2, x, 0, -7.05, { fog: false }); box(c, 2.1, 0.7, 0.8, rock2, x, 5.2, -7.2); });
      // braziers
      const fire = emis(c, 0xff9a30, 1.6);
      [-8.3, 8.3, -14.5].forEach((x, i) => { cyl(c, 0.12, 0.3, 1.5, 8, iron, x, 0, -3.1); cyl(c, 0.5, 0.25, 0.4, 10, iron, x, 1.5, -3.1); cone(c, 0.34, 0.8, 8, fire, x, 1.8, -3.1); const f = glow(c, 0xff8a20, 2.8, 3.2, x, 2.3, -2.9, 0.6); c.ups.push(t => { f.material.opacity = 0.6 * flick(c, t, i * 2.6); f.scale.y = 3.2 * (0.95 + 0.05 * Math.sin(t * 3 + i)); }); });
      pulseE(c, fire, 1.5, 0.3, 2.1);
      // banners on the wall
      if (!c.low) { const bn = std(c, 0x8a1c14, { side: THREE.DoubleSide }); const bs = [-11.5, 0, 11.5].map(x => { const p = grp(c, x, 7.4, -7.0); add(c, new THREE.PlaneGeometry(1.6, 3.4), bn, 0, -1.7, 0, p); box(c, 0.9, 0.9, 0.02, emis(c, 0xffb040, 0.8), 0, -2.2, 0.03, p).rotation.z = Math.PI / 4; return p; }); c.ups.push(t => bs.forEach((b, i) => { b.rotation.x = Math.sin(t * 0.7 + i) * 0.04 * c.ms; })); }
      // ancient gateway (right)
      const rt = tex(c, 128, 128, (g, w, h) => { g.fillStyle = '#000'; g.fillRect(0, 0, w, h); g.strokeStyle = '#fff'; g.lineWidth = 5; g.beginPath(); for (let a = 0; a < 16; a += 0.2) { const rad = 4 + a * 3.2, x = 64 + Math.cos(a) * rad, y = 64 + Math.sin(a) * rad; if (a) g.lineTo(x, y); else g.moveTo(x, y); } g.stroke(); });
      iboxes(c, rock, [[9.1, 0, -2.4, 1, 4.8, 1], [12.7, 0, -2.4, 1, 4.8, 1], [10.9, 4.8, -2.4, 5.2, 1, 1.1], [10.9, 5.8, -2.4, 3, 0.5, 1]]);
      const gate = box(c, 2.7, 4.8, 0.1, std(c, 0x2a1410, { emissive: 0xff7a20, emissiveMap: rt, emissiveIntensity: 1.2 }), 10.9, 0, -2.7); pulseE(c, gate.material, 1.2, 0.5, 1.0);
      const gg = glow(c, 0xff7a20, 5, 6, 10.9, 2.4, -2.6, 0.3); pulseO(c, gg.material, 0.28, 0.1, 1.0);
      // rock spires left
      inst(c, new THREE.ConeGeometry(1, 1, 6), rock2, [[-12.4, 2.2, -4.2, 1.2, 4.4, 1.2, 0.3], [-11, 1.2, -3.6, 0.8, 2.4, 0.8, 1], [14.6, 1.8, -3.8, 1, 3.6, 1, 2]]);
      points(c, 300, { box: [-17, 17, 0, 10, -8, 3], color: 0xffa040, size: 0.07, opacity: 0.85, vel: [0.15, 0.9, 0], sway: 0.5, twinkle: 2 });
      return LIGHTS.volcano();
    },
    c => {
      far(c, (g, w, h, r) => {
        vgrad(g, 0, 0, w, h, [[0, '#0e0404'], [0.5, '#2a0a08'], [0.75, '#7a2410'], [0.84, '#e0701c'], [1, '#ffb040']]);
        for (let i = 0; i < 5; i++) { const x = 150 + i * 190 + rr(r, -30, 30); blob(g, x, 330, 90, 0xff6a18, 0.25); vgrad(g, x - 7, 190, 14, 240, [[0, '#ff8a20'], [0.5, '#ffd050'], [1, '#ff8a20']]); }
        pRidge(g, w, h, 300, 160, r, 'rgba(26,8,8,.75)', 14);
        g.save(); g.translate(0, 190); g.scale(1, -1); pRidge(g, w, 200, 60, 130, r, '#140606', 12); g.restore(); // stalactites
      });
      mid(c, (g, w, h, r) => {
        for (let i = 0; i < 7; i++) { const x = rr(r, 0, w), ww = rr(r, 50, 110), top = rr(r, 60, 240); vgrad(g, x, top, ww, h - top, [[0, '#1a0a0a'], [0.8, '#3a1410'], [1, '#7a2c10']]); poly(g, [x - 16, h, x, top + 40, x, h], '#1a0a0a'); poly(g, [x + ww, top + 40, x + ww + 16, h, x + ww, h], '#1a0a0a'); g.fillStyle = 'rgba(255,120,40,.3)'; g.fillRect(x + ww - 4, top, 4, h - top); }
        g.save(); g.translate(0, 235); g.scale(1, -1); pRidge(g, w, 240, 90, 120, r, '#120606', 18); g.restore();
      });
      // lava lake below the bridge
      const lavaT = tex(c, 256, 256, (g, w, h, r) => { g.fillStyle = '#ff7418'; g.fillRect(0, 0, w, h); for (let i = 0; i < 40; i++) blob(g, r() * w, r() * h, rr(r, 14, 40), 0xffe060, 0.5); for (let i = 0; i < 50; i++) { const x = r() * w, y = r() * h, rad = rr(r, 10, 30); for (const ox of [-w, 0, w]) for (const oy of [-h, 0, h]) blob(g, x + ox, y + oy, rad, 0x3a0c06, 0.8); } }, true);
      lavaT.repeat.set(8, 2);
      const lavaM = bas(c, { map: lavaT, fog: false });
      const lake = add(c, new THREE.PlaneGeometry(90, 14), lavaM, 0, -0.9, -9.6); lake.rotation.x = -Math.PI / 2;
      c.ups.push(t => { lavaT.offset.x = t * 0.012 * c.ms; lavaT.offset.y = t * 0.006 * c.ms; lavaM.color.setScalar(0.85 + 0.15 * Math.sin(t * 0.8)); });
      const hg = glow(c, 0xff6a18, 70, 9, 0, 1.2, -8, 0.3); pulseO(c, hg.material, 0.28, 0.08, 0.8);
      floor(c, (g, w, h, r) => {
        const z = Z => PZ(Z, -3.2, 9);
        g.fillStyle = '#62504a'; g.fillRect(0, 0, w, h);
        pTiles(g, w, h, 72, 60, r, 'rgba(20,10,8,.5)', 0.08, 0.5);
        g.fillStyle = 'rgba(30,14,10,.6)'; g.fillRect(0, 0, w, z(-2.7)); g.fillStyle = 'rgba(255,140,50,.5)'; g.fillRect(0, z(-2.7), w, 3);
        cracks(g, r, 6, 0, z(2.6), w, h, 'rgba(255,120,40,.4)', 2.5, 100);
        for (let x = 64; x < w; x += 256) { g.strokeStyle = 'rgba(255,170,80,.3)'; g.lineWidth = 3; g.beginPath(); g.ellipse(x, z(0), 40, 22, 0, 0, TAU); g.stroke(); }
        blob(g, 512, 0, 600, 0xff6a20, 0.16);
      }, { z0: -3.2, rough: 0.85 });
      const rock = std(c, 0x4a3632), rock2 = std(c, 0x2a1a18), iron = std(c, 0x1a1414, { metalness: 0.6, roughness: 0.5 });
      box(c, 64, 0.9, 0.3, rock, 0, -0.9, -3.35);
      // bridge railing
      const px = []; for (let x = -30; x <= 30; x += 3) px.push([x, 0, -2.95, 0.4, 1.1, 0.4]);
      iboxes(c, rock, px.concat([[0, 1.1, -2.95, 64, 0.2, 0.5]]));
      const caps = emis(c, 0xff9a30, 1.4); iboxes(c, caps, [-12, -6, 0, 6, 12].map(x => [x, 1.3, -2.95, 0.3, 0.3, 0.3])); pulseE(c, caps, 1.3, 0.4, 1.4);
      box(c, 64, 0.35, 0.4, rock2, 0, 0, 4.5); // low front curb (stays below y 0.5)
      // rock pillars rising from the lava
      inst(c, new THREE.CylinderGeometry(0.6, 1, 1, 7), rock2, [[-13, 2, -7, 1.6, 9, 1.6, 0.2], [-5, 0.6, -9, 1.3, 6, 1.3, 1], [4, 1.4, -6.5, 1.1, 7, 1.1, 2], [12, 2.6, -8.5, 1.9, 10, 1.9, 0.6], [19, 1, -6, 1.2, 6, 1.2, 0.9], [-20, 1, -6.4, 1.4, 7, 1.4, 0.4]]);
      const fall = fallTex(c, ['#ff6a10', '#ffd040', 0xfff0a0], 0.3);
      [[-9, 2.2], [8, 2.8]].forEach(p => backdrop(c, fall, p[1], 12, p[0], -0.9, -12.4, { fog: false }));
      // hanging chains + far bridge towers (sides)
      if (!c.low) { const ch = [-10.5, -3.5, 5.5, 13].map((x, i) => { const p = grp(c, x, 11, -4 - (i % 2)); box(c, 0.08, 5 + i % 3, 0.08, iron, 0, -(5 + i % 3), 0, p); return p; }); c.ups.push(t => ch.forEach((p, i) => { p.rotation.z = Math.sin(t * 0.6 + i * 1.3) * 0.04 * c.ms; })); }
      iboxes(c, rock, [[-12.2, 0, -3.6, 1.6, 6, 1.4], [12.2, 0, -3.6, 1.6, 6, 1.4], [-12.2, 6, -3.6, 2, 0.5, 1.8], [12.2, 6, -3.6, 2, 0.5, 1.8]]);
      [-12.2, 12.2].forEach((x, i) => { const f = glow(c, 0xff8a20, 2.6, 2.6, x, 4.4, -2.8, 0.6); box(c, 0.5, 0.6, 0.1, caps, x, 4.1, -2.88); c.ups.push(t => { f.material.opacity = 0.55 * flick(c, t, i * 3); }); });
      points(c, 340, { box: [-17, 17, -0.5, 10, -10, 3], color: 0xffa040, size: 0.07, opacity: 0.85, vel: [-0.1, 1.0, 0], sway: 0.5, twinkle: 2 });
      const L = LIGHTS.volcano(); L.sky = 0x0e0404; L.fog = [0x40140a, 26, 80]; L.ambient = [0xffb898, 0.85]; L.rim = [0xff5a14, 2.0, [4, 2, -8]]; return L;
    },
  ],

  /* ============================== FROZEN ============================ */
  frozen: [
    c => {
      far(c, (g, w, h, r) => {
        vgrad(g, 0, 0, w, h, [[0, '#040c20'], [0.45, '#0c2a4a'], [0.72, '#2a6a8a'], [0.8, '#7fc0d8'], [1, '#7fc0d8']]);
        pStars(g, w, 340, r, 200);
        for (let i = 0; i < 14; i++) blob(g, 150 + i * 56, 250 + Math.sin(i * 0.7) * 30, 80, i % 3 ? 0x40ffb0 : 0x8a7aff, 0.09);
        pRidge(g, w, h, 398, 150, r, '#8fb8d8', 10); pRidge(g, w, h, 398, 150 * 0.4, r, 'rgba(255,255,255,.35)', 6);
        pRidge(g, w, h, 414, 90, r, '#5a8ab8', 8); vgrad(g, 0, 340, w, 90, [[0, 'rgba(160,220,240,0)'], [1, 'rgba(160,220,240,.4)']]);
      });
      // aurora band scrolling slowly
      const at = tex(c, 512, 128, (g, w, h, r) => {
        for (let x = 0; x < w; x += 3) { const k = 0.5 + 0.5 * Math.sin(x / w * TAU * 3 + 1) * Math.sin(x / w * TAU * 5); const top = 20 + 30 * Math.sin(x / w * TAU * 2); const gr = g.createLinearGradient(0, top, 0, top + 90); gr.addColorStop(0, 'rgba(140,110,255,0)'); gr.addColorStop(0.35, `rgba(80,255,190,${0.1 + 0.3 * Math.abs(k)})`); gr.addColorStop(1, 'rgba(60,220,255,0)'); g.fillStyle = gr; g.fillRect(x, top, 3, 90); }
      }, true);
      at.repeat.set(2, 1);
      const au = backdrop(c, at, 120, 12, 0, 7, -27, { add: true, opacity: 0.8 });
      c.ups.push(t => { at.offset.x = t * 0.006 * c.ms; au.material.opacity = 0.65 + 0.15 * Math.sin(t * 0.4); });
      mid(c, (g, w, h, r) => {
        // ice castle
        const by = MY(0), cx = 470;
        const spire = (x, ww, hh) => { vgrad(g, x - ww / 2, by - hh, ww, hh + 80, [[0, '#bfe8ff'], [1, '#5a9ac8']]); poly(g, [x - ww / 2 - 4, by - hh, x, by - hh - ww * 1.5, x + ww / 2 + 4, by - hh], '#e6f8ff'); g.fillStyle = 'rgba(255,255,255,.35)'; g.fillRect(x - ww / 2, by - hh, 4, hh); g.fillStyle = '#ffe9a0'; for (let y = by - hh + 16; y < by - 20; y += 34) g.fillRect(x - 4, y, 8, 14); };
        spire(cx - 150, 40, 120); spire(cx + 150, 40, 130); spire(cx - 80, 50, 165); spire(cx + 80, 50, 175); spire(cx, 66, 205);
        vgrad(g, cx - 190, by - 70, 380, 150, [[0, '#9fd0f0'], [1, '#4a86b8']]); for (let x = cx - 190; x < cx + 190; x += 26) g.fillRect(x, by - 80, 13, 12);
        archPath(g, cx - 24, by, 48, 56); g.fillStyle = '#ffe9a0'; g.fill(); blob(g, cx, by - 30, 60, 0xffe9a0, 0.35);
        pRidge(g, w, h, by + 6, 46, r, '#e6f4ff', 4);
        for (let i = 0; i < 16; i++) { const x = rr(r, 0, w), s = rr(r, 0.7, 1.3); if (Math.abs(x - cx) < 210) continue; for (let k = 0; k < 4; k++) poly(g, [x - (34 - k * 7) * s, by - k * 24 * s, x, by - (46 + k * 24) * s, x + (34 - k * 7) * s, by - k * 24 * s], k % 2 ? '#2a5a6a' : '#1f4a5a'); for (let k = 0; k < 4; k++) poly(g, [x - (20 - k * 4) * s, by - (18 + k * 24) * s, x, by - (46 + k * 24) * s, x + (20 - k * 4) * s, by - (18 + k * 24) * s], 'rgba(240,250,255,.8)'); }
      });
      floor(c, (g, w, h, r) => {
        vgrad(g, 0, 0, w, h, [[0, '#7fa8c8'], [0.5, '#8fb8d4'], [1, '#7aa2c2']]);
        pTiles(g, w, h, 128, 93, r, 'rgba(255,255,255,.22)', 0.04);
        cracks(g, r, 12, 0, 0, w, h, 'rgba(255,255,255,.35)', 1.5, 120);
        for (let i = 0; i < 26; i++) blob(g, r() * w, r() < 0.6 ? rr(r, 0, PZ(-2.6)) : rr(r, PZ(3), h), rr(r, 30, 70), 0xffffff, 0.3);
        g.save(); g.translate(512, PZ(0)); g.scale(1, 0.72); g.strokeStyle = 'rgba(255,255,255,.4)'; g.lineWidth = 4;
        for (let i = 0; i < 6; i++) { g.rotate(TAU / 6); g.beginPath(); g.moveTo(0, 0); g.lineTo(84, 0); g.moveTo(50, 0); g.lineTo(66, 14); g.moveTo(50, 0); g.lineTo(66, -14); g.stroke(); }
        g.beginPath(); g.arc(0, 0, 100, 0, TAU); g.stroke(); g.restore();
      }, { rough: 0.25, metal: 0.2, glow: 0.08 });
      const ice = std(c, 0xa8dcff, { transparent: true, opacity: 0.8, roughness: 0.15, metalness: 0.2, emissive: 0x2a7ab8, emissiveIntensity: 0.5 }), snow = std(c, 0xf0f8ff, { roughness: 1 }), stone = std(c, 0x7a9ab8);
      // balustrade + pillars
      const bx = []; for (let x = -31; x <= 31; x += 1.6) bx.push([x, 0, -5.6, 0.25, 0.9, 0.25]);
      iboxes(c, stone, bx.concat([[0, 0.9, -5.6, 64, 0.18, 0.5]]));
      const plx = [-16, -9.5, -3.2, 3.2, 9.5, 16];
      icyls(c, ice, plx.map(x => [x, 0, -4.4, 0.45, 5.4]), 6); pulseE(c, ice, 0.5, 0.2, 0.8);
      iboxes(c, snow, plx.map(x => [x, 5.4, -4.4, 1.3, 0.3, 1.3]));
      const lant = plx.map(x => glow(c, 0x7fe8ff, 2.4, 2.4, x, 4.6, -4.0, 0.45)); c.ups.push(t => lant.forEach((s, i) => { s.material.opacity = 0.38 + 0.12 * Math.sin(t * 1.1 + i * 1.3); }));
      // frozen fountain
      cyl(c, 2, 2.2, 0.5, 14, stone, 0, 0, -7.6); cyl(c, 0.4, 0.5, 1.6, 8, stone, 0, 0.5, -7.6);
      inst(c, new THREE.ConeGeometry(0.5, 1, 5), ice, [[0, 3.1, -7.6, 1, 2.2, 1], [-0.8, 2.4, -7.6, 0.6, 1.4, 0.6, 0, 0, 0.5], [0.8, 2.4, -7.6, 0.6, 1.4, 0.6, 0, 0, -0.5], [-1.3, 1, -7.4, 0.5, 1.2, 0.5, 0, 0, 0.9], [1.3, 1, -7.4, 0.5, 1.2, 0.5, 0, 0, -0.9]]);
      // crystal clusters that shimmer
      const cry = std(c, 0xc8f0ff, { roughness: 0.1, metalness: 0.3, emissive: 0x40c8ff, emissiveIntensity: 0.8, flatShading: true }); pulseE(c, cry, 0.8, 0.4, 1.7);
      const cl = []; [[-12.6, -3.4], [-6.3, -3.2], [6.5, -3.3], [14, -3.6]].forEach(p => { for (let k = 0; k < (c.low ? 2 : 4); k++) { const s = rr(c.rnd, 0.25, 0.5), hh = rr(c.rnd, 0.9, 2.4); cl.push([p[0] + rr(c.rnd, -0.7, 0.7), hh / 2, p[1] + rr(c.rnd, -0.3, 0.3), s, hh, s, c.rnd() * 3, 0, rr(c.rnd, -0.35, 0.35)]); } });
      inst(c, new THREE.OctahedronGeometry(0.7), cry, cl);
      // snowdrifts
      [[-13, -5], [-4, -6.4], [8, -6.3], [15, -4.6], [-9, -6.6]].forEach(p => sph(c, 1, snow, p[0], 0, p[1], 2.6, 0.6, 1.2));
      // icy barrier (right)
      const it = tex(c, 256, 256, (g, w, h, r) => { vgrad(g, 0, 0, w, h, [[0, '#e6f8ff'], [1, '#6fb0e0']]); for (let i = 0; i < 16; i++) poly(g, [r() * w, 0, r() * w, h, r() * w + 30, h], css(pick(r, [0xffffff, 0x4a9ad8, 0xbfe8ff]), 0.28)); cracks(g, r, 10, 0, 0, w, h, 'rgba(255,255,255,.8)', 2, 130); });
      box(c, 4.6, 4.4, 0.6, std(c, 0xffffff, { map: it, transparent: true, opacity: 0.9, roughness: 0.15, emissive: 0x2a7ab8, emissiveIntensity: 0.4 }), 10.9, 0, -2.5);
      inst(c, new THREE.ConeGeometry(0.5, 1, 5), ice, [[8.9, 2.6, -2.6, 1.1, 5.2, 1.1, 0, 0, 0.08], [12.9, 3, -2.7, 1.3, 6, 1.3, 1, 0, -0.06], [10.2, 5.1, -2.5, 0.8, 1.6, 0.8], [11.5, 5.3, -2.5, 0.9, 2, 0.9, 2]]);
      glow(c, 0x7fe8ff, 6, 6, 10.9, 2.4, -2.3, 0.2);
      // gate tower left
      box(c, 3, 6.4, 1.6, stone, -12.6, 0, -4.6); cone(c, 2.2, 2.4, 4, ice, -12.6, 6.4, -4.6).rotation.y = Math.PI / 4; box(c, 0.8, 1.2, 0.06, emis(c, 0xffe9a0, 1), -12.6, 3.2, -3.78);
      points(c, 420, { box: [-18, 18, 0, 11, -9, 4], color: 0xffffff, size: 0.09, opacity: 0.85, vel: [-0.35, -0.9, 0], sway: 0.4, add: false });
      return LIGHTS.frozen();
    },
    c => {
      far(c, (g, w, h, r) => {
        vgrad(g, 0, 0, w, h, [[0, '#040a1c'], [0.5, '#0c2848'], [0.8, '#1c5a80'], [1, '#2a7aa0']]);
        for (let i = 0; i < 12; i++) blob(g, r() * w, rr(r, 200, 420), rr(r, 60, 140), pick(r, [0x40d0ff, 0x8a7aff, 0x40ffd0]), 0.14);
        g.strokeStyle = 'rgba(140,230,255,.6)'; g.lineWidth = 2; for (let i = 0; i < 16; i++) { let x = r() * w, y = rr(r, 180, 300); g.beginPath(); g.moveTo(x, y); for (let k = 0; k < 6; k++) { x += rr(r, -26, 26); y += rr(r, 14, 32); g.lineTo(x, y); } g.stroke(); }
        pRidge(g, w, h, 420, 150, r, 'rgba(10,30,56,.8)', 14);
        g.save(); g.translate(0, 200); g.scale(1, -1); pRidge(g, w, 210, 70, 140, r, '#061226', 12); g.restore();
      });
      mid(c, (g, w, h, r) => {
        const by = MY(0);
        for (let i = 0; i < 12; i++) { // big painted crystals
          const x = rr(r, 0, w), hh = rr(r, 90, 230), ww = rr(r, 24, 56), lean = rr(r, -40, 40), hex = pick(r, [0x5ad0ff, 0x8a8aff, 0x5affd8]);
          blob(g, x + lean / 2, by - hh / 2, hh * 0.7, hex, 0.14);
          poly(g, [x - ww / 2, by + 60, x + lean - ww / 4, by - hh * 0.8, x + lean, by - hh, x + lean + ww / 4, by - hh * 0.8, x + ww / 2, by + 60], css(hex, 0.75));
          poly(g, [x, by + 60, x + lean, by - hh, x + lean + ww / 4, by - hh * 0.8, x + ww / 2, by + 60], 'rgba(8,24,50,.4)');
          poly(g, [x - ww / 2, by + 60, x + lean - ww / 4, by - hh * 0.8, x + lean - ww / 4 + 5, by - hh * 0.8, x - ww / 2 + 7, by + 60], 'rgba(255,255,255,.5)');
        }
        pRidge(g, w, h, by + 14, 60, r, '#0c2444', 16);
        g.save(); g.translate(0, 240); g.scale(1, -1); pRidge(g, w, 250, 110, 120, r, '#081a34', 20); g.restore();
      });
      floor(c, (g, w, h, r) => {
        vgrad(g, 0, 0, w, h, [[0, '#4a7aa0'], [0.5, '#6a9cc0'], [1, '#5a8ab0']]);
        pSpecks(g, w, h, r, 500, 0.06);
        cracks(g, r, 16, 0, 0, w, h, 'rgba(220,245,255,.35)', 1.5, 130);
        for (let i = 0; i < 18; i++) blob(g, r() * w, r() < 0.6 ? rr(r, 0, PZ(-2.6)) : rr(r, PZ(3), h), rr(r, 30, 80), pick(r, [0x5ad0ff, 0x8a8aff]), 0.2);
        g.strokeStyle = 'rgba(200,240,255,.3)'; g.lineWidth = 3; floorRing(g, 0, 0, 6.5); g.stroke();
        vgrad(g, 0, 0, w, PZ(-6), [[0, 'rgba(6,16,36,.5)'], [1, 'rgba(6,16,36,0)']]);
      }, { rough: 0.3, metal: 0.2, glow: 0.14 });
      const rock = std(c, 0x34567a, { flatShading: true }), ice = std(c, 0xa8dcff, { transparent: true, opacity: 0.85, roughness: 0.15, emissive: 0x2a7ab8, emissiveIntensity: 0.5, flatShading: true });
      const cA = std(c, 0xbfeaff, { roughness: 0.1, metalness: 0.3, emissive: 0x30c0ff, emissiveIntensity: 1, flatShading: true }), cB = std(c, 0xd8c8ff, { roughness: 0.1, metalness: 0.3, emissive: 0x8a6aff, emissiveIntensity: 1, flatShading: true });
      pulseE(c, cA, 0.9, 0.4, 1.3); pulseE(c, cB, 0.9, 0.4, 1.0, 2);
      const og = new THREE.OctahedronGeometry(0.7), la = [], lb = [];
      [[-14, -4], [-9.5, -5.5], [-4, -6.8], [2.5, -7.2], [8, -5.6], [13.6, -4.2], [-12, -3.1], [11.4, -3]].forEach((p, i) => { const n = c.low ? 2 : 4; for (let k = 0; k < n; k++) { const s = rr(c.rnd, 0.4, 0.9), hh = rr(c.rnd, 1.6, 5); (i % 2 ? lb : la).push([p[0] + rr(c.rnd, -0.9, 0.9), hh * 0.45, p[1] + rr(c.rnd, -0.4, 0.4), s, hh, s, c.rnd() * 3, 0, rr(c.rnd, -0.4, 0.4)]); } });
      inst(c, og, cA, la); inst(c, og, cB, lb);
      const cg = [[-14, 0x40c8ff], [-4, 0x40c8ff], [8, 0x40c8ff], [-9.5, 0x8a6aff], [2.5, 0x8a6aff], [13.6, 0x8a6aff]].map(p => glow(c, p[1], 6, 6, p[0], 2, -4.5, 0.22));
      c.ups.push(t => cg.forEach((s, i) => { s.material.opacity = 0.2 + 0.08 * Math.sin(t * 1.2 + i * 1.1); }));
      // stalagmites + icicles
      const cg5 = new THREE.ConeGeometry(0.5, 1, 6), sl = [], ic = [];
      for (let i = 0; i < (c.low ? 8 : 16); i++) sl.push([rr(c.rnd, -20, 20), 0, rr(c.rnd, -9, -3.4), rr(c.rnd, 0.8, 1.8), rr(c.rnd, 1, 3.4), rr(c.rnd, 0.8, 1.8)]);
      inst(c, cg5, rock, sl.map(p => [p[0], p[4] / 2, p[2], p[3], p[4], p[5]]));
      for (let i = 0; i < (c.low ? 10 : 24); i++) { const hh = rr(c.rnd, 0.8, 3); ic.push([rr(c.rnd, -20, 20), 9 - hh / 2, rr(c.rnd, -8, -2.6), rr(c.rnd, 0.3, 0.7), hh, rr(c.rnd, 0.3, 0.7), 0, Math.PI]); }
      inst(c, cg5, ice, ic);
      box(c, 64, 1, 8, rock, 0, 9, -6);
      // frozen pool
      const pool = std(c, 0x7fd8ff, { roughness: 0.05, metalness: 0.5, emissive: 0x2090c0, emissiveIntensity: 0.6 }); const pm = cyl(c, 3.4, 3.4, 0.04, 20, pool, 0.5, 0, -5); pm.scale.z = 0.45; pulseE(c, pool, 0.6, 0.2, 0.7);
      // side walls: broken ice wall left (where they came in), cave wall right
      inst(c, cg5, ice, [[-11.6, 2, -2.9, 1.2, 4, 1.2, 0, 0, 0.15], [-13.4, 2.8, -3, 1.6, 5.6, 1.6, 1, 0, -0.1], [-10.3, 0.5, -2.8, 0.7, 1, 0.7, 2, 0, 0.6]]);
      inst(c, new THREE.DodecahedronGeometry(1), rock, [[12.4, 1.8, -3.4, 2, 2.6, 1.4, 0.4], [14.2, 4.2, -3.8, 2.2, 2.4, 1.6, 1.2], [11, 0.6, -3, 1, 0.8, 0.9, 2]]);
      [-7, 2, 9].forEach((x, i) => { const s = glow(c, 0xbfeaff, 3, 14, x, 5, -8.5, 0.12); s.rotation.z = -0.2; pulseO(c, s.material, 0.11, 0.04, 0.5, i * 2); });
      points(c, 300, { box: [-17, 17, 0.2, 8.5, -9, 3], color: 0xdff6ff, size: 0.08, opacity: 0.9, vel: [0.03, -0.12, 0], sway: 0.25, twinkle: 2.2 });
      const L = LIGHTS.frozen(); L.sky = 0x040a1c; L.fog = [0x10305a, 28, 90]; L.ambient = [0xb0d8ff, 1.0]; L.ground = 0x3a5a8a; L.rim = [0x8a7aff, 1.4, [7, 5, -7]]; return L;
    },
  ],
};

/* Cosmic Battlefield: both zones share the starfield, planet and spacecraft. */
function cosmicCommon(c, zone) {
  far(c, (g, w, h, r) => {
    vgrad(g, 0, 0, w, h, zone ? [[0, '#05051a'], [0.6, '#0c1a3c'], [1, '#1a3a5a']] : [[0, '#07051a'], [0.6, '#1c0c3c'], [1, '#3a1a5a']]);
    paintNebula(g, w, h, r, zone ? [0x30c0d0, 0x6a5aff, 0xff5ad0] : [0xb040ff, 0xff5ad0, 0x4060ff], 9);
    pStars(g, w, 460, r, 420); pStars(g, w, 460, r, 60, 0xffd0f0);
    for (let i = 0; i < 6; i++) blob(g, r() * w, rr(r, 180, 380), 9, 0xffffff, 0.8);
  });
  // twinkling star layers
  points(c, 130, { box: [-52, 52, 3, 28, -27.5, -27], color: 0xffffff, size: 0.34, opacity: 0.9, twinkle: 1.7 });
  points(c, 130, { box: [-52, 52, 3, 28, -27.5, -27], color: 0xd0c0ff, size: 0.3, opacity: 0.9, twinkle: 1.1, phase: 2 });
  // ringed planet
  const pt = tex(c, 512, 256, (g, w, h, r) => {
    const cols = zone ? ['#2f8a9a', '#6fd0c8', '#3a6ab0', '#a0e8e0', '#2a5a8a'] : ['#c85a8a', '#ffb070', '#8a3a9a', '#ffd8a0', '#a04a7a'];
    let y = 0; while (y < h) { const bh = rr(r, 8, 30); g.fillStyle = pick(r, cols); g.fillRect(0, y, w, bh); y += bh; }
    for (let i = 0; i < 30; i++) { const x = r() * w, yy = r() * h, rw = rr(r, 20, 60); for (const ox of [-w, 0, w]) { g.fillStyle = css(pick(r, [0xffffff, 0x201030]), 0.12); g.beginPath(); g.ellipse(x + ox, yy, rw, rr(r, 3, 8), 0, 0, TAU); g.fill(); } }
  }, true);
  const tilt = grp(c, zone ? 9 : -9, zone ? 8.5 : 10.5, -25); tilt.rotation.z = zone ? -0.35 : 0.3; tilt.rotation.x = 0.25;
  const pr = zone ? 6.2 : 4.6;
  const planet = add(c, new THREE.SphereGeometry(pr, c.low ? 16 : 28, c.low ? 10 : 18), std(c, 0xffffff, { map: pt, fog: false, roughness: 1, emissive: 0xffffff, emissiveMap: pt, emissiveIntensity: 0.25 }), 0, 0, 0, tilt);
  const rt = tex(c, 256, 16, (g, w, h, r) => { for (let x = 0; x < w; x++) { g.fillStyle = css(zone ? 0xa0e8ff : 0xffd0b0, 0.15 + 0.6 * Math.abs(Math.sin(x * 0.11) * Math.sin(x * 0.037 + 1))); g.fillRect(x, 0, 1, h); } });
  const rg = new THREE.RingGeometry(pr * 1.35, pr * 2.05, c.low ? 24 : 48, 1);
  { const p = rg.attributes.position, uv = rg.attributes.uv; for (let i = 0; i < p.count; i++) { const rad = Math.hypot(p.getX(i), p.getY(i)); uv.setXY(i, (rad - pr * 1.35) / (pr * 0.7), 0.5); } }
  const ring = add(c, rg, bas(c, { map: rt, transparent: true, side: THREE.DoubleSide, depthWrite: false, fog: false }), 0, 0, 0, tilt); ring.rotation.x = Math.PI / 2;
  glow(c, zone ? 0x40d0e0 : 0xff70c0, pr * 4.4, pr * 4.4, tilt.position.x, tilt.position.y, -25.6, 0.3);
  c.ups.push(t => { planet.rotation.y = t * 0.03 * c.ms; });
  // drifting spacecraft
  const ship = grp(c, -40, 12, -21), hull = std(c, 0xb8c0d8, { metalness: 0.6, roughness: 0.4, fog: false });
  const body = cone(c, 0.35, 1.8, 8, hull, 0, -0.9, 0, ship); body.rotation.z = -Math.PI / 2; body.position.set(0, 0, 0);
  box(c, 0.5, 0.06, 1.4, hull, -0.5, 0, 0, ship); const eg = glow(c, 0x70d0ff, 1.6, 0.8, -1.3, 0, 0, 0.8, false, ship);
  c.ups.push(t => { ship.position.x = c.rm ? 14 : ((t * 1.3 + 30) % 100) - 50; ship.position.y = (zone ? 14 : 12) + Math.sin(t * 0.4) * 0.3 * c.ms; eg.material.opacity = 0.65 + 0.2 * Math.sin(t * 2.3); });

  const rock = std(c, 0x5a4a7a, { flatShading: true }), rock2 = std(c, 0x3a2e5a, { flatShading: true });
  const cry = std(c, 0xe0b0ff, { roughness: 0.15, metalness: 0.3, emissive: 0xb040ff, emissiveIntensity: 1, flatShading: true }); pulseE(c, cry, 0.9, 0.4, 1.2);
  const dod = new THREE.DodecahedronGeometry(1, 0), cg = new THREE.ConeGeometry(0.5, 1, 5);

  if (zone === 0) {
    mid(c, (g, w, h, r) => {
      const by = MY(0);
      pRidge(g, w, h, by - 50, 170, r, '#2a1c50', 20);
      g.save(); g.globalCompositeOperation = 'source-atop'; vgrad(g, 0, by - 240, w, 300, [[0, 'rgba(255,110,210,.35)'], [0.5, 'rgba(255,110,210,0)']]); g.restore();
      pRidge(g, w, h, by - 10, 100, r, '#1a1238', 22);
      for (let i = 0; i < 5; i++) { const x = 100 + i * 210 + rr(r, -40, 40), hh = rr(r, 70, 150); blob(g, x, by - hh / 2, hh * 0.6, 0xb040ff, 0.2); poly(g, [x - 12, by + 30, x - 3, by - hh, x + 4, by - hh - 12, x + 14, by + 30], 'rgba(200,130,255,.8)'); }
    });
    floor(c, (g, w, h, r) => {
      g.fillStyle = '#6c6490'; g.fillRect(0, 0, w, h);
      pSpecks(g, w, h, r, 1200, 0.06);
      for (let i = 0; i < 16; i++) { // craters (kept away from the fight line)
        const Z = i < 9 ? rr(r, -12, -2.8) : rr(r, 2.8, 8), x = r() * w, y = PZ(Z), rx = rr(r, 22, 70), ry = rx * 0.4;
        g.fillStyle = 'rgba(30,20,60,.4)'; g.beginPath(); g.ellipse(x, y, rx, ry, 0, 0, TAU); g.fill();
        g.strokeStyle = 'rgba(210,190,255,.4)'; g.lineWidth = 3; g.beginPath(); g.ellipse(x, y + 2, rx, ry, 0, 0, Math.PI); g.stroke();
        g.strokeStyle = 'rgba(20,10,40,.4)'; g.beginPath(); g.ellipse(x, y - 1, rx, ry, 0, Math.PI, TAU); g.stroke();
      }
      g.strokeStyle = 'rgba(200,150,255,.25)'; g.lineWidth = 3; floorRing(g, 0, 0, 7.3); g.stroke();
      vgrad(g, 0, 0, w, PZ(-6), [[0, 'rgba(20,10,50,.5)'], [1, 'rgba(20,10,50,0)']]);
    }, { rough: 0.95, glow: 0.06 });
    const rk = []; for (let i = 0; i < (c.low ? 8 : 18); i++) { const s = rr(c.rnd, 0.4, 1.5); rk.push([rr(c.rnd, -20, 20), s * 0.35, rr(c.rnd, -10, -3.2), s * rr(c.rnd, 1, 1.6), s, s, c.rnd() * 3]); }
    inst(c, dod, rock, rk);
    inst(c, dod, rock2, [[-12.6, 2, -4.2, 2.4, 3.4, 1.8, 0.5], [-14.6, 4.6, -4.6, 1.6, 1.6, 1.4, 1.2], [-10.6, 0.8, -3.4, 1.1, 1, 1, 2], [15, 1.6, -4.8, 2, 2.6, 1.6, 0.9]]);
    const cr = []; [[-8, -4.2], [-2.5, -6], [4.5, -5], [13.2, -3.6], [-13.5, -3]].forEach(p => { for (let k = 0; k < (c.low ? 2 : 3); k++) { const hh = rr(c.rnd, 1, 3.2); cr.push([p[0] + rr(c.rnd, -0.5, 0.5), hh / 2, p[1] + rr(c.rnd, -0.3, 0.3), rr(c.rnd, 0.5, 0.9), hh, rr(c.rnd, 0.5, 0.9), c.rnd() * 3, 0, rr(c.rnd, -0.3, 0.3)]); } });
    inst(c, cg, cry, cr);
    [-8, -2.5, 4.5].forEach((x, i) => { const s = glow(c, 0xb040ff, 4, 4, x, 1.4, [-4, -5.8, -4.8][i], 0.25); pulseO(c, s.material, 0.22, 0.08, 1.2, i); });
    // lander probe
    if (!c.low) { cyl(c, 0.5, 0.8, 1, 8, std(c, 0xd8c890, { metalness: 0.5, roughness: 0.4 }), 8.2, 0.6, -6.6); iboxes(c, std(c, 0x8890a8, { metalness: 0.6 }), [[7.5, 0, -6.6, 0.08, 0.7, 0.08], [8.9, 0, -6.6, 0.08, 0.7, 0.08], [8.2, 0, -6, 0.08, 0.7, 0.08], [8.2, 1.6, -6.6, 0.05, 1, 0.05]]); const bl = glow(c, 0xff4060, 0.9, 0.9, 8.2, 2.7, -6.5, 0.8); c.ups.push(t => { bl.material.opacity = 0.4 + 0.4 * Math.sin(t * (c.rf ? 0.9 : 2)); }); }
    // the floating platform (right)
    const plat = grp(c, 10.9, 1.3, -2.6);
    cyl(c, 2.3, 2.3, 0.3, 6, std(c, 0x7a84a8, { metalness: 0.6, roughness: 0.35 }), 0, 0, 0, plat); cyl(c, 2.0, 1.2, 0.5, 6, rock2, 0, -0.5, 0, plat);
    const rim = cyl(c, 2.36, 2.36, 0.08, 6, emis(c, 0xb060ff, 1.4), 0, 0.1, 0, plat); pulseE(c, rim.material, 1.3, 0.5, 1.5);
    const ug = glow(c, 0xb060ff, 5, 2.6, 0, -1, 0.2, 0.45, false, plat);
    inst(c, dod, rock, [[9.2, 0.5, -3, 0.3, 0.3, 0.3], [12.8, 0.7, -2.8, 0.25, 0.25, 0.25, 1], [11.6, 0.35, -2.2, 0.2, 0.2, 0.2, 2]]);
    c.ups.push(t => { plat.position.y = 1.3 + Math.sin(t * 0.8) * 0.15 * c.ms; ug.material.opacity = 0.4 + 0.1 * Math.sin(t * 1.5); });
    points(c, 240, { box: [-17, 17, 0.2, 9, -9, 3], color: 0xd8b8ff, size: 0.07, opacity: 0.7, vel: [0.04, 0.12, 0], sway: 0.2 });
    return LIGHTS.cosmic();
  }

  // ---- zone 1: floating platform ----
  mid(c, (g, w, h, r) => {
    for (let i = 0; i < 22; i++) { // asteroid belt
      const x = r() * w, y = rr(r, 250, 470), rx = rr(r, 10, 46), ry = rx * rr(r, 0.5, 0.8);
      g.fillStyle = pick(r, ['#1a2a4a', '#22345a', '#16223e']); g.beginPath(); g.ellipse(x, y, rx, ry, rr(r, -0.5, 0.5), 0, TAU); g.fill();
      g.strokeStyle = 'rgba(110,220,230,.5)'; g.lineWidth = 2; g.beginPath(); g.ellipse(x, y, rx, ry, 0, Math.PI * 1.1, Math.PI * 1.8); g.stroke();
    }
  });
  floor(c, (g, w, h, r) => {
    const z = Z => PZ(Z, -5, 9);
    g.fillStyle = '#5c6890'; g.fillRect(0, 0, w, h);
    pTiles(g, w, h, 96, 73, r, 'rgba(16,20,48,.5)', 0.05, 0.5);
    g.fillStyle = 'rgba(20,24,56,.6)'; g.fillRect(0, 0, w, z(-4.4)); g.fillStyle = 'rgba(120,230,255,.7)'; g.fillRect(0, z(-4.4), w, 4);
    g.fillStyle = 'rgba(120,230,255,.4)'; g.fillRect(0, z(-2.4), w, 3); g.fillRect(0, z(2.6), w, 3);
    g.strokeStyle = 'rgba(190,150,255,.45)'; g.lineWidth = 5; g.beginPath(); g.ellipse(512, z(0), 16 * 5, 36.6 * 1.6, 0, 0, TAU); g.stroke();
    g.lineWidth = 2; g.beginPath(); g.ellipse(512, z(0), 16 * 6.4, 36.6 * 2, 0, 0, TAU); g.stroke();
  }, { z0: -5, rough: 0.4, metal: 0.45, glow: 0.14 });
  const steel = std(c, 0x6a78a0, { metalness: 0.6, roughness: 0.35 });
  box(c, 64, 1.2, 0.4, std(c, 0x3a4468, { metalness: 0.5 }), 0, -1.2, -5.2);
  const ug = glow(c, 0x60d0ff, 64, 4, 0, -1.4, -5.3, 0.3); pulseO(c, ug.material, 0.28, 0.08, 0.9);
  // energy pylons with beams between them
  const px = [-18, -12, -6, 0, 6, 12, 18];
  icyls(c, steel, px.map(x => [x, 0, -4.6, 0.22, 2.4]), 8);
  const orb = emis(c, 0x70e0ff, 1.5); inst(c, new THREE.OctahedronGeometry(0.3), orb, px.map(x => [x, 2.75, -4.6])); pulseE(c, orb, 1.4, 0.5, 1.6);
  const beam = bas(c, { color: 0x70e0ff, transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending, depthWrite: false, fog: false });
  iboxes(c, beam, [[0, 1.1, -4.6, 64, 0.05, 0.05], [0, 2, -4.6, 64, 0.05, 0.05]]); pulseO(c, beam, 0.45, 0.2, 1.1);
  const pg = px.map(x => glow(c, 0x70e0ff, 1.8, 1.8, x, 2.75, -4.5, 0.5)); c.ups.push(t => pg.forEach((s, i) => { s.material.opacity = 0.4 + 0.15 * Math.sin(t * 1.6 + i); }));
  // floating asteroid chunks
  const fl = grp(c, 0, 0, 0), chunks = [];
  for (let i = 0; i < (c.low ? 6 : 14); i++) { const s = rr(c.rnd, 0.5, 2.2); const m = add(c, dod, i % 2 ? rock : rock2, rr(c.rnd, -24, 24), rr(c.rnd, -1, 9), rr(c.rnd, -18, -7), fl); m.scale.set(s * rr(c.rnd, 1, 1.5), s, s); m.rotation.set(c.rnd() * 3, c.rnd() * 3, 0); chunks.push([m, m.position.y, c.rnd() * 6]); }
  c.ups.push(t => chunks.forEach(([m, y, ph], i) => { m.position.y = y + Math.sin(t * 0.4 + ph) * 0.35 * c.ms; m.rotation.y = ph + t * 0.05 * (i % 2 ? 1 : -1) * c.ms; }));
  const cr = []; [[-14.5, -7.5], [9, -8], [16, -6.5]].forEach(p => { for (let k = 0; k < 3; k++) { const hh = rr(c.rnd, 1, 2.6); cr.push([p[0] + rr(c.rnd, -0.6, 0.6), rr(c.rnd, 0, 3), p[1], 0.6, hh, 0.6, c.rnd() * 3, 0, rr(c.rnd, -0.5, 0.5)]); } });
  inst(c, cg, cry, cr);
  // docking arm (left, where they arrived) and beacon tower (right)
  box(c, 5, 0.3, 1.4, steel, -12.4, 0, -3.6); iboxes(c, steel, [[-14.4, 0.3, -3.6, 0.2, 2.6, 0.2], [-10.4, 0.3, -3.6, 0.2, 2.6, 0.2], [-12.4, 2.9, -3.6, 4.4, 0.2, 0.4]]);
  box(c, 1.4, 5.5, 1.4, steel, 12, 0, -3.6); const bc = glow(c, 0xff70d0, 2.6, 2.6, 12, 6, -3.2, 0.7); sph(c, 0.3, emis(c, 0xff70d0, 1.6), 12, 5.8, -3.6);
  c.ups.push(t => { bc.material.opacity = 0.4 + 0.3 * Math.sin(t * (c.rf ? 0.8 : 1.6)); });
  points(c, 240, { box: [-18, 18, -2, 10, -12, 3], color: 0xa8e8ff, size: 0.07, opacity: 0.7, vel: [0.1, 0.05, 0], sway: 0.2 });
  const L = LIGHTS.cosmic(); L.sky = 0x05051a; L.fog = [0x0c1a3c, 40, 120]; L.ambient = [0x90b8ff, 0.95]; L.ground = 0x1a2a50; L.rim = [0x50d8ff, 1.5, [-8, 4, -8]]; return L;
}

/* ------------------------------------------------------------------ */
/* Public API                                                          */
/* ------------------------------------------------------------------ */
export function buildArena(id, zone, opts) {
  const key = ZONES[id] ? id : 'rooftops';
  const z = zone === 1 ? 1 : 0;
  const c = makeCtx(key, z, opts);
  const lights = ZONES[key][z](c);
  let dead = false;
  return {
    group: c.group,
    lights,
    update(time, dt) {
      if (dead) return;
      const t = Number.isFinite(time) ? time : 0;
      const d = Number.isFinite(dt) ? Math.min(Math.max(dt, 0), 0.1) : 0;
      for (let i = 0; i < c.ups.length; i++) c.ups[i](t, d);
    },
    dispose() {
      if (dead) return; dead = true;
      c.ups.length = 0;
      if (c.group.parent) c.group.parent.remove(c.group);
      for (const im of c.insts) im.dispose();
      for (const g of c.geos) g.dispose();
      for (const m of c.mats) m.dispose();
      for (const t of c.texs) t.dispose();
      c.group.clear();
      c.geos.clear(); c.mats.length = 0; c.texs.length = 0; c.insts.length = 0;
    },
  };
}

/* ------------------------------------------------------------------ */
/* Thumbnails for the arena-select screen (plain 2D canvas)            */
/* All painters draw in a 320 x 180 space; the canvas is scaled to fit */
/* ------------------------------------------------------------------ */
const floorBand = (g, top, a, b) => { vgrad(g, 0, top, 320, 180 - top, [[0, a], [1, b]]); g.fillStyle = 'rgba(255,255,255,.18)'; g.fillRect(0, top, 320, 2); };
const THUMBS = {
  rooftops(g, r) {
    vgrad(g, 0, 0, 320, 180, [[0, '#0b1030'], [0.45, '#3a2466'], [0.7, '#c05a6a'], [0.85, '#f2a262']]);
    pStars(g, 320, 70, r, 40); blob(g, 232, 48, 34, 0xfff2cc, 0.4); g.fillStyle = '#fff4d8'; g.beginPath(); g.arc(232, 48, 9, 0, TAU); g.fill();
    pSkyline(g, 320, 132, r, { minW: 10, maxW: 22, minH: 20, maxH: 60, col: '#4a2f66', wins: ['#ffd98a'], winP: 0.2, cell: 4 });
    pSkyline(g, 320, 132, r, { minW: 22, maxW: 44, minH: 30, maxH: 92, col: '#12152e', wins: ['#ffe2a0', '#8fe0ff'], winP: 0.3, cell: 5, gap: 8 });
    floorBand(g, 130, '#6a7186', '#474c60');
    g.fillStyle = '#2a2e46'; g.fillRect(236, 96, 4, 36); g.fillRect(296, 96, 4, 36);
    vgrad(g, 228, 62, 80, 38, [[0, '#1c2f8a'], [1, '#b03a8a']]); star5(g, 246, 81, 11, '#ffd84a'); g.strokeStyle = '#ffe27a'; g.lineWidth = 2; g.strokeRect(228, 62, 80, 38);
  },
  hall(g, r) {
    vgrad(g, 0, 0, 320, 180, [[0, '#2a2440'], [0.6, '#8a8090'], [1, '#6e6676']]);
    for (let i = 0; i < 5; i++) { const x = 18 + i * 62; archPath(g, x, 128, 36, 96); g.save(); g.clip(); vgrad(g, x, 30, 36, 100, [[0, '#9ad0ff'], [1, '#ffe6a8']]); for (let k = 0; k < 30; k++) { g.fillStyle = css(pick(r, [0x4aa0ff, 0xffd24a, 0xff6a6a, 0x6ae0b0, 0xb08aff]), 0.6); g.fillRect(x + r() * 36, 30 + r() * 100, 7, 9); } g.restore(); archPath(g, x, 128, 36, 96); g.strokeStyle = '#c9a24a'; g.lineWidth = 2; g.stroke(); }
    floorBand(g, 128, '#a09a94', '#6e6862'); g.fillStyle = '#2c4a8c'; g.fillRect(0, 146, 320, 16); g.fillStyle = '#d8b660'; g.fillRect(0, 144, 320, 2); g.fillRect(0, 162, 320, 2);
    for (const x of [48, 110, 172, 234, 296]) { vgrad(g, x - 7, 14, 14, 116, [[0, '#f0e8dc'], [1, '#b8b0a4']]); g.fillStyle = '#d8b050'; g.fillRect(x - 10, 10, 20, 6); g.fillRect(x - 10, 124, 20, 6); }
    blob(g, 160, 70, 30, 0x7fe0ff, 0.6); star5(g, 160, 70, 12, '#bff0ff');
  },
  district(g, r) {
    vgrad(g, 0, 0, 320, 180, [[0, '#0a1216'], [0.6, '#1f3a3a'], [1, '#4a5a48']]);
    pSkyline(g, 320, 128, r, { minW: 26, maxW: 50, minH: 60, maxH: 108, col: '#101c20', wins: ['#ffd58a'], winP: 0.12, cell: 6 });
    pSkyline(g, 320, 128, r, { minW: 44, maxW: 70, minH: 36, maxH: 66, col: '#4a3630', wins: ['#ffd58a', '#ffbe6a'], winP: 0.5, cell: 9, gap: 2 });
    floorBand(g, 128, '#566066', '#30383c');
    for (let i = 0; i < 4; i++) { g.fillStyle = 'rgba(255,200,120,.3)'; g.beginPath(); g.ellipse(40 + i * 80, 152 + (i % 2) * 12, 26, 5, 0, 0, TAU); g.fill(); }
    for (const x of [70, 250]) { g.fillStyle = '#12181a'; g.fillRect(x - 1.5, 62, 3, 68); blob(g, x, 60, 30, 0xffc070, 0.7); g.fillStyle = '#ffe2a0'; g.fillRect(x - 4, 55, 8, 9); }
    g.strokeStyle = 'rgba(190,230,224,.35)'; g.lineWidth = 1; for (let i = 0; i < 70; i++) { const x = r() * 330, y = r() * 180; g.beginPath(); g.moveTo(x, y); g.lineTo(x - 3, y + 12); g.stroke(); }
  },
  cosmic(g, r) {
    vgrad(g, 0, 0, 320, 180, [[0, '#07051a'], [0.7, '#2a1050'], [1, '#3a1a5a']]);
    for (let i = 0; i < 8; i++) blob(g, r() * 320, r() * 110, rr(r, 30, 60), pick(r, [0xb040ff, 0xff5ad0, 0x4060ff]), 0.16);
    pStars(g, 320, 130, r, 110);
    g.save(); g.translate(92, 56); g.rotate(0.3); g.strokeStyle = 'rgba(255,208,176,.7)'; g.lineWidth = 5; g.beginPath(); g.ellipse(0, 0, 46, 10, 0, Math.PI, TAU); g.stroke();
    const pg = g.createLinearGradient(0, -26, 0, 26); pg.addColorStop(0, '#ffb070'); pg.addColorStop(0.5, '#c85a8a'); pg.addColorStop(1, '#6a2a7a'); g.fillStyle = pg; g.beginPath(); g.arc(0, 0, 26, 0, TAU); g.fill();
    g.beginPath(); g.ellipse(0, 0, 46, 10, 0, 0, Math.PI); g.stroke(); g.restore();
    pRidge(g, 320, 180, 126, 46, r, '#2a1c50', 6); pRidge(g, 320, 180, 132, 26, r, '#1a1238', 6);
    floorBand(g, 130, '#746c98', '#4a4270');
    for (let i = 0; i < 5; i++) { g.fillStyle = 'rgba(30,20,60,.4)'; g.beginPath(); g.ellipse(30 + i * 66, 148 + (i % 2) * 16, 18, 5, 0, 0, TAU); g.fill(); }
    for (const x of [44, 268, 284]) { blob(g, x, 112, 20, 0xb040ff, 0.5); poly(g, [x - 5, 132, x, 96, x + 5, 132], '#e0b0ff'); }
  },
  lab(g, r) {
    vgrad(g, 0, 0, 320, 180, [[0, '#182428'], [0.6, '#3a4c52'], [1, '#2c3a40']]);
    for (let x = 0; x < 320; x += 40) { g.strokeStyle = 'rgba(8,14,16,.5)'; g.lineWidth = 1; g.strokeRect(x, 0, 40, 40); g.strokeRect(x, 40, 40, 40); }
    g.fillStyle = '#e8b030'; g.fillRect(0, 46, 320, 3);
    for (const x of [16, 196]) { g.fillStyle = '#081416'; g.fillRect(x, 58, 108, 60); blob(g, x + 54, 92, 44, 0x30ffb0, 0.6); g.strokeStyle = '#7f949a'; g.lineWidth = 3; g.strokeRect(x, 58, 108, 60); }
    floorBand(g, 128, '#647278', '#3c484e'); g.fillStyle = 'rgba(80,255,190,.6)'; g.fillRect(0, 140, 320, 2);
    for (let x = 0; x < 320; x += 16) poly(g, [x, 130, x + 8, 130, x + 14, 136, x + 6, 136], 'rgba(232,176,48,.7)');
    for (const x of [140, 164, 300]) { blob(g, x, 96, 26, 0x40ffb0, 0.45); vgrad(g, x - 8, 66, 16, 62, [[0, '#a0ffe0'], [1, '#30c090']]); g.fillStyle = '#7f949a'; g.fillRect(x - 10, 62, 20, 6); g.fillRect(x - 10, 124, 20, 6); }
  },
  temple(g, r) {
    vgrad(g, 0, 0, 320, 180, [[0, '#4aa8c8'], [0.5, '#8fd0d8'], [0.8, '#ffe2a0']]);
    blob(g, 236, 52, 60, 0xfff4c0, 0.7); g.fillStyle = '#fffbe6'; g.beginPath(); g.arc(236, 52, 10, 0, TAU); g.fill();
    pRidge(g, 320, 180, 118, 56, r, '#9cc8c0'); pRidge(g, 320, 180, 126, 40, r, '#4f9478', 3);
    for (let i = 0; i < 5; i++) { const ww = 150 - i * 26; vgrad(g, 150 - ww / 2, 114 - i * 16, ww, 17, [[0, '#c8b888'], [1, '#8a7c5a']]); }
    g.fillStyle = '#ffe9a8'; g.fillRect(145, 38, 10, 12);
    pRidge(g, 320, 180, 134, 34, r, '#1f5038', 8);
    floorBand(g, 130, '#b4a680', '#7c7052');
    for (const x of [36, 284]) { g.fillStyle = '#9a8c66'; g.fillRect(x - 7, 84, 14, 48); blob(g, x, 104, 18, 0x40ffd0, 0.5); g.fillStyle = '#7fffe0'; g.fillRect(x - 2, 92, 4, 26); }
  },
  volcano(g, r) {
    vgrad(g, 0, 0, 320, 180, [[0, '#120406'], [0.5, '#4a100a'], [0.8, '#d86a20']]);
    blob(g, 150, 60, 70, 0xff7a20, 0.5); poly(g, [70, 130, 132, 48, 168, 48, 236, 130], '#1c0a0a'); blob(g, 150, 46, 18, 0xffe080, 0.9);
    g.strokeStyle = '#ffb040'; g.lineWidth = 2.5; g.beginPath(); g.moveTo(146, 50); g.quadraticCurveTo(134, 90, 108, 128); g.moveTo(156, 50); g.quadraticCurveTo(176, 90, 190, 128); g.stroke();
    for (const x of [14, 262]) { vgrad(g, x, 56, 44, 76, [[0, '#2c1614'], [1, '#160a0a']]); for (let k = 0; k < 4; k++) g.fillRect(x - 2 + k * 13, 50, 7, 7); blob(g, x + 22, 86, 12, 0xff7a20, 0.7); g.fillStyle = '#ffb050'; g.fillRect(x + 19, 80, 6, 12); }
    floorBand(g, 130, '#62504a', '#3a2a28'); vgrad(g, 0, 132, 320, 7, [[0, '#ffd040'], [1, '#ff6a10']]);
    for (let i = 0; i < 40; i++) { g.fillStyle = css(0xffa040, rr(r, 0.4, 1)); g.fillRect(r() * 320, r() * 150, 2, 2); }
  },
  frozen(g, r) {
    vgrad(g, 0, 0, 320, 180, [[0, '#040c20'], [0.5, '#0c2a4a'], [0.8, '#7fc0d8']]);
    pStars(g, 320, 90, r, 60); for (let i = 0; i < 10; i++) blob(g, 30 + i * 30, 44 + Math.sin(i * 0.8) * 12, 30, i % 3 ? 0x40ffb0 : 0x8a7aff, 0.16);
    pRidge(g, 320, 180, 122, 62, r, '#8fb8d8', 3); pRidge(g, 320, 180, 122, 24, r, 'rgba(255,255,255,.4)', 2);
    for (const [x, ww, hh] of [[120, 14, 44], [200, 14, 48], [140, 18, 62], [180, 18, 66], [160, 22, 82]]) { vgrad(g, x - ww / 2, 128 - hh, ww, hh, [[0, '#bfe8ff'], [1, '#5a9ac8']]); poly(g, [x - ww / 2 - 2, 128 - hh, x, 128 - hh - ww * 1.4, x + ww / 2 + 2, 128 - hh], '#e6f8ff'); g.fillStyle = '#ffe9a0'; g.fillRect(x - 1.5, 128 - hh + 10, 3, 6); }
    floorBand(g, 128, '#9cc4de', '#6a94b8');
    for (const x of [36, 60, 276]) { blob(g, x, 112, 20, 0x40c8ff, 0.45); poly(g, [x - 6, 132, x - 1, 92, x + 6, 132], '#c8f0ff'); }
    g.fillStyle = 'rgba(255,255,255,.85)'; for (let i = 0; i < 60; i++) g.fillRect(r() * 320, r() * 180, 2, 2);
  },
};

export function arenaThumb(id, w, h) {
  const cv = document.createElement('canvas');
  cv.width = Math.max(1, Math.round(w || 320)); cv.height = Math.max(1, Math.round(h || 180));
  const g = cv.getContext('2d');
  const key = THUMBS[id] ? id : 'rooftops';
  g.save();
  g.scale(cv.width / 320, cv.height / 180);
  THUMBS[key](g, mulberry32(SEEDS[key] + 5));
  const vg = g.createRadialGradient(160, 90, 70, 160, 90, 200);
  vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,.35)');
  g.fillStyle = vg; g.fillRect(0, 0, 320, 180);
  g.restore();
  return cv;
}
