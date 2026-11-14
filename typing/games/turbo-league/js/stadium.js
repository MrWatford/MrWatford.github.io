// Turbo League — Championship Stadium (the flagship arena), built in code.
// The playing surface is generated from the SAME numbers the physics uses (config.js ARENA),
// so what you see is exactly what the ball and cars bounce off.
import * as THREE from "../lib/three.module.min.js";
import { ARENA, BOOST, boostPads } from "./config.js";
import { goalBox } from "./physics.js";
import { THEMES } from "./arenas.js";

export const TEAM = [new THREE.Color(0x2a7bff), new THREE.Color(0xff7a1a)];
export const canvas = (w, h) => { const c = document.createElement("canvas"); c.width = w; c.height = h; return c; };
export const ctex = (c, srgb = true) => { const t = new THREE.CanvasTexture(c); if (srgb) t.colorSpace = THREE.SRGBColorSpace; return t; };

// Adds a world-position varying + team tint (blue on -z half, orange on +z half) to a standard material.
function teamTint(mat, { emissiveTint = true, colorTint = 0 } = {}) {
  mat.onBeforeCompile = (sh) => {
    sh.uniforms.uBlue = { value: TEAM[0] }; sh.uniforms.uOrange = { value: TEAM[1] }; sh.uniforms.uTime = mat.userData.time || { value: 0 };
    sh.vertexShader = sh.vertexShader.replace("#include <common>", "#include <common>\nvarying vec3 vWPos;").replace("#include <worldpos_vertex>", "#include <worldpos_vertex>\nvWPos = (modelMatrix * vec4(transformed, 1.0)).xyz;");
    sh.fragmentShader = sh.fragmentShader.replace("#include <common>", "#include <common>\nvarying vec3 vWPos; uniform vec3 uBlue; uniform vec3 uOrange; uniform float uTime;");
    const tint = "vec3 teamC = mix(uBlue, uOrange, smoothstep(-8.0, 8.0, vWPos.z));";
    if (colorTint) sh.fragmentShader = sh.fragmentShader.replace("#include <color_fragment>", `#include <color_fragment>\n${tint.replace("teamC", "teamC0")}\ndiffuseColor.rgb = mix(diffuseColor.rgb, diffuseColor.rgb * teamC0 * 2.2, ${colorTint.toFixed(2)});`);
    if (emissiveTint) sh.fragmentShader = sh.fragmentShader.replace("#include <emissivemap_fragment>", `#include <emissivemap_fragment>\n${tint}\ntotalEmissiveRadiance *= teamC;`);
  };
  return mat;
}

// ---------- the turf ----------
function turfTexture(T) {
  const TF = (T && T.turf) || { a: "#2f7a34", b: "#38893c", tint: 0.2 };
  const A = ARENA, ppm = 16, W = Math.round(A.hx * 2 * ppm), L = Math.round((A.hz + A.goalD) * 2 * ppm);
  const c = canvas(W, L), g = c.getContext("2d");
  const X = (x) => (x + A.hx) * ppm, Z = (z) => (z + A.hz + A.goalD) * ppm;
  // grass with mowing stripes, each half tinted toward its team
  for (let i = 0; i < 24; i++) {
    const z0 = -A.hz - A.goalD + i * ((A.hz + A.goalD) * 2 / 24), z1 = z0 + (A.hz + A.goalD) * 2 / 24;
    g.fillStyle = i % 2 ? TF.a : TF.b; g.fillRect(0, Z(z0), W, Z(z1) - Z(z0));
  }
  const grd = g.createLinearGradient(0, Z(-A.hz), 0, Z(A.hz));
  grd.addColorStop(0, `rgba(40,110,255,${TF.tint})`); grd.addColorStop(0.45, "rgba(40,110,255,0.0)"); grd.addColorStop(0.55, "rgba(255,120,30,0.0)"); grd.addColorStop(1, `rgba(255,120,30,${TF.tint})`);
  g.fillStyle = grd; g.fillRect(0, 0, W, L);
  // fine grass noise
  const img = g.getImageData(0, 0, W, L), d = img.data;
  let seed = 9; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  for (let i = 0; i < d.length; i += 4) { const n = (rnd() - 0.5) * 18; d[i] += n; d[i + 1] += n * 1.2; d[i + 2] += n * 0.6; }
  g.putImageData(img, 0, 0);
  // field markings
  g.strokeStyle = "rgba(255,255,255,0.82)"; g.lineWidth = 0.32 * ppm; g.lineJoin = "round";
  const rr = (x0, z0, x1, z1, r) => { g.beginPath(); g.roundRect(X(x0), Z(z0), X(x1) - X(x0), Z(z1) - Z(z0), r * ppm); g.stroke(); };
  rr(-A.hx + 5.5, -A.hz + 5.5, A.hx - 5.5, A.hz - 5.5, A.cornerR - 5);
  g.beginPath(); g.moveTo(X(-A.hx + 5.5), Z(0)); g.lineTo(X(A.hx - 5.5), Z(0)); g.stroke();
  g.beginPath(); g.arc(X(0), Z(0), 9 * ppm, 0, Math.PI * 2); g.stroke();
  g.fillStyle = "rgba(255,255,255,0.85)"; g.beginPath(); g.arc(X(0), Z(0), 0.6 * ppm, 0, Math.PI * 2); g.fill();
  for (const s of [-1, 1]) {
    const gl = s * (A.hz - 5.5);
    g.strokeRect(X(-12), Math.min(Z(gl), Z(gl - s * 10)), 24 * ppm, 10 * ppm);
    g.beginPath(); g.arc(X(0), Z(gl - s * 10), 5 * ppm, s > 0 ? Math.PI : 0, s > 0 ? Math.PI * 2 : Math.PI); g.stroke();
    // goal crease glow in team colour
    g.fillStyle = s < 0 ? "rgba(60,140,255,0.28)" : "rgba(255,140,40,0.28)";
    g.fillRect(X(-A.goalW / 2), Math.min(Z(s * A.hz), Z(s * (A.hz - 4))), A.goalW * ppm, 4 * ppm);
    // goal floor: darker turf with a hex pattern
    g.fillStyle = "rgba(0,0,0,0.35)"; g.fillRect(X(-A.goalW / 2), Math.min(Z(s * A.hz), Z(s * (A.hz + A.goalD))), A.goalW * ppm, A.goalD * ppm);
  }
  // centre emblem
  g.save(); g.translate(X(0), Z(0));
  g.strokeStyle = "rgba(255,255,255,0.35)"; g.lineWidth = 0.18 * ppm; g.beginPath(); g.arc(0, 0, 6.8 * ppm, 0, Math.PI * 2); g.stroke();
  g.fillStyle = "rgba(255,255,255,0.30)"; g.font = `italic 900 ${2.4 * ppm}px system-ui, Arial`; g.textAlign = "center"; g.textBaseline = "middle";
  g.rotate(Math.PI / 2); g.fillText("TURBO", 0, -1.4 * ppm); g.fillText("LEAGUE", 0, 1.4 * ppm); g.restore();
  // boost pad rings
  for (const p of boostPads()) { g.strokeStyle = p.big ? "rgba(255,200,60,0.6)" : "rgba(255,200,60,0.35)"; g.lineWidth = 0.2 * ppm; g.beginPath(); g.arc(X(p.x), Z(p.z), (p.big ? BOOST.bigR : BOOST.smallR) * ppm * 0.9, 0, Math.PI * 2); g.stroke(); }
  return ctex(c);
}
function grassDetail() {
  const c = canvas(256, 256), g = c.getContext("2d"); g.fillStyle = "#808080"; g.fillRect(0, 0, 256, 256);
  let seed = 3; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  for (let i = 0; i < 9000; i++) { const v = 90 + rnd() * 90; g.fillStyle = `rgb(${v},${v},${v})`; g.fillRect(rnd() * 256, rnd() * 256, 1, 2 + rnd() * 3); }
  const t = ctex(c, false); t.wrapS = t.wrapT = THREE.RepeatWrapping; return t;
}
function buildFloor(renderer, T) {
  const A = ARENA, e = A.edgeR, shape = new THREE.Shape();
  const hx = A.hx - e, hz = A.hz - e, r = A.cornerR - e;
  shape.moveTo(-hx + r, -hz); shape.lineTo(hx - r, -hz); shape.absarc(hx - r, -hz + r, r, -Math.PI / 2, 0); shape.lineTo(hx, hz - r); shape.absarc(hx - r, hz - r, r, 0, Math.PI / 2);
  shape.lineTo(-hx + r, hz); shape.absarc(-hx + r, hz - r, r, Math.PI / 2, Math.PI); shape.lineTo(-hx, -hz + r); shape.absarc(-hx + r, -hz + r, r, Math.PI, Math.PI * 1.5);
  const geos = [new THREE.ShapeGeometry(shape, 24)];
  for (const s of [-1, 1]) { const p = new THREE.PlaneGeometry(A.goalW, A.goalD + e); p.translate(0, -s * (A.hz + A.goalD / 2 - e / 2), 0); geos.push(p); }
  const meshes = [];
  const tex = turfTexture(T); tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
  const detail = grassDetail();
  const mat = new THREE.MeshStandardMaterial({ map: tex, roughness: (T && T.turfRough) ?? 0.92, metalness: 0, envMapIntensity: (T && T.turfEnv) ?? 0.35 });
  mat.userData.extraTex = [detail];
  mat.onBeforeCompile = (sh) => {
    sh.uniforms.uDetail = { value: detail };
    sh.vertexShader = sh.vertexShader.replace("#include <common>", "#include <common>\nvarying vec2 vWXZ;").replace("#include <worldpos_vertex>", "#include <worldpos_vertex>\nvWXZ = (modelMatrix * vec4(transformed, 1.0)).xz;");
    sh.fragmentShader = sh.fragmentShader.replace("#include <common>", "#include <common>\nvarying vec2 vWXZ; uniform sampler2D uDetail;")
      .replace("#include <map_fragment>", "#include <map_fragment>\nfloat dt = texture2D(uDetail, vWXZ * 0.9).r * 0.6 + texture2D(uDetail, vWXZ * 0.13).r * 0.4;\ndiffuseColor.rgb *= mix(0.78, 1.2, dt);");
  };
  for (const g of geos) {
    g.rotateX(-Math.PI / 2);
    const p = g.attributes.position, uv = new Float32Array(p.count * 2);
    for (let i = 0; i < p.count; i++) { uv[i * 2] = (p.getX(i) + A.hx) / (2 * A.hx); uv[i * 2 + 1] = 1 - (p.getZ(i) + A.hz + A.goalD) / (2 * (A.hz + A.goalD)); }
    g.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
    const m = new THREE.Mesh(g, mat); m.receiveShadow = true; meshes.push(m);
  }
  // shapes are in x/y; after rotateX(-90°) shape-y becomes -z, so check orientation of the goal floors
  return meshes;
}

// ---------- the curved ramps, glass walls and ceiling ----------
export function outline(off) { // points around a rounded rectangle (the arena outline pushed out by `off`)
  const A = ARENA, e = A.edgeR, hx = A.hx - e, hz = A.hz - e, r = A.cornerR - e, pts = [];
  const straight = (x0, z0, x1, z1, nx, nz, extra) => {
    const L = Math.hypot(x1 - x0, z1 - z0), n = Math.max(2, Math.ceil(L / 0.6)), ts = new Set();
    for (let i = 0; i < n; i++) ts.add(i / n);
    for (const v of extra) { const t = Math.abs(x1 - x0) > 1e-6 ? (v - x0) / (x1 - x0) : -1; if (t > 0 && t < 1) ts.add(t); }
    for (const t of [...ts].sort((a, b) => a - b)) pts.push({ x: x0 + (x1 - x0) * t + nx * off, z: z0 + (z1 - z0) * t + nz * off, nx, nz });
  };
  const arc = (cx, cz, a0) => { for (let i = 0; i < 16; i++) { const a = a0 + (i / 16) * Math.PI / 2, nx = Math.cos(a), nz = Math.sin(a); pts.push({ x: cx + nx * (r + off), z: cz + nz * (r + off), nx, nz }); } };
  const gx = [-ARENA.goalW / 2, ARENA.goalW / 2];
  straight(-hx + r, -hz, hx - r, -hz, 0, -1, gx); arc(hx - r, -hz + r, -Math.PI / 2);
  straight(hx, -hz + r, hx, hz - r, 1, 0, []); arc(hx - r, hz - r, 0);
  straight(hx - r, hz, -hx + r, hz, 0, 1, gx); arc(-hx + r, hz - r, Math.PI / 2);
  straight(-hx, hz - r, -hx, -hz + r, -1, 0, []); arc(-hx + r, -hz + r, Math.PI);
  pts.push({ ...pts[0] });
  return pts;
}
function profile() { // cross-section of the wall: [outward offset, height, region]
  const A = ARENA, e = A.edgeR, rows = [];
  for (let i = 0; i <= 10; i++) { const p = (i / 10) * Math.PI / 2; rows.push([e * Math.sin(p), e - e * Math.cos(p), 0]); }
  const ys = new Set([A.goalH]); for (let y = e + 1; y < A.h - e; y += 1.2) ys.add(y);
  for (const y of [...ys].sort((a, b) => a - b)) if (y > e && y < A.h - e) rows.push([e, y, 1]);
  for (let i = 0; i <= 8; i++) { const p = Math.PI / 2 - (i / 8) * Math.PI / 2; rows.push([e * Math.sin(p), A.h - e + e * Math.cos(p), 2]); }
  return rows;
}
function hexLines(g, R, cols, rows, lw) { // flat-top hexagons that tile seamlessly
  const H = R * Math.sqrt(3); g.lineWidth = lw;
  for (let col = -1; col <= cols * 2; col++) for (let row = -1; row <= rows; row++) {
    const cx = col * R * 1.5, cy = row * H + (col & 1 ? H / 2 : 0);
    g.beginPath(); for (let i = 0; i <= 6; i++) { const a = i * Math.PI / 3; g[i ? "lineTo" : "moveTo"](cx + R * Math.cos(a), cy + R * Math.sin(a)); } g.stroke();
  }
}
export function hexTexture(line = "rgba(255,255,255,0.9)") {
  const R = 48, c = canvas(R * 6, Math.round(R * Math.sqrt(3) * 2)), g = c.getContext("2d");
  g.strokeStyle = line; hexLines(g, R, 2, 2, 3);
  const t = ctex(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; return t;
}
function buildShell() {
  const A = ARENA, ring = outline(0), prof = profile();
  const pos = [], uv = [], groups = [[], [], []];
  let s = 0;
  for (let i = 0; i < ring.length; i++) {
    if (i) s += Math.hypot(ring[i].x - ring[i - 1].x, ring[i].z - ring[i - 1].z);
    let v = 0;
    for (let j = 0; j < prof.length; j++) {
      if (j) v += Math.hypot(prof[j][0] - prof[j - 1][0], prof[j][1] - prof[j - 1][1]);
      const [o, y] = prof[j], p = ring[i];
      pos.push(p.x + p.nx * o, y, p.z + p.nz * o); uv.push(s / 6, v / 6);
    }
  }
  const P = prof.length, gb = [goalBox(1), goalBox(-1)];
  const inGoal = (x, y, z) => gb.some((b) => Math.abs(x - b.cx) < b.bx - 0.01 && Math.abs(y - b.cy) < b.by - 0.01 && Math.abs(z - b.cz) < b.bz + 0.01);
  for (let i = 0; i < ring.length - 1; i++) for (let j = 0; j < P - 1; j++) {
    const a = i * P + j, b = (i + 1) * P + j;
    const cx = (pos[a * 3] + pos[(b + 1) * 3]) / 2, cy = (pos[a * 3 + 1] + pos[(b + 1) * 3 + 1]) / 2, cz = (pos[a * 3 + 2] + pos[(b + 1) * 3 + 2]) / 2;
    if (inGoal(cx, cy, cz)) continue;
    groups[prof[j][2] === 2 || prof[j + 1][2] === 2 ? 2 : prof[j + 1][2] === 0 ? 0 : 1].push(a, b, a + 1, a + 1, b, b + 1);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex([...groups[0], ...groups[1], ...groups[2]]);
  g.addGroup(0, groups[0].length, 0); g.addGroup(groups[0].length, groups[1].length, 1); g.addGroup(groups[0].length + groups[1].length, groups[2].length, 2);
  g.computeVertexNormals();
  return g;
}
function rampTexture() {
  const c = canvas(512, 512), g = c.getContext("2d");
  const grd = g.createLinearGradient(0, 0, 0, 512); grd.addColorStop(0, "#1a2a24"); grd.addColorStop(1, "#141a22"); g.fillStyle = grd; g.fillRect(0, 0, 512, 512);
  g.strokeStyle = "rgba(255,255,255,0.06)"; g.lineWidth = 2; for (let x = 0; x <= 512; x += 64) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, 512); g.stroke(); }
  const t = ctex(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; return t;
}

function trimLine() { // glowing strip where the floor ramp meets the glass (skips the goal mouths)
  const A = ARENA, e = A.edgeR, ring = outline(e - 0.04), pos = [], idx = [];
  for (let i = 0; i < ring.length; i++) { const p = ring[i]; pos.push(p.x, e - 0.06, p.z, p.x, e + 0.14, p.z); }
  for (let i = 1; i < ring.length; i++) {
    const p = ring[i - 1], q = ring[i];
    if (Math.abs(p.nz) > 0.9 && Math.abs((p.x + q.x) / 2) < A.goalW / 2) continue;
    const a = (i - 1) * 2; idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3);
  }
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx);
  return new THREE.Mesh(g, teamTint(new THREE.MeshStandardMaterial({ color: 0x000000, emissive: 0xffffff, emissiveIntensity: 2.6, side: THREE.DoubleSide })));
}

// ---------- goals ----------
function netTexture() {
  const R = 24, c = canvas(R * 6, Math.round(R * Math.sqrt(3) * 2)), g = c.getContext("2d");
  g.strokeStyle = "rgba(255,255,255,0.95)"; hexLines(g, R, 2, 2, 3);
  const t = ctex(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; return t;
}
function buildGoal(sign, team) {
  const A = ARENA, grp = new THREE.Group(), col = TEAM[team];
  const frameMat = new THREE.MeshStandardMaterial({ color: 0x15181d, emissive: col, emissiveIntensity: 3.2, roughness: 0.3, metalness: 0.6 });
  const darkMat = new THREE.MeshStandardMaterial({ color: 0x23262d, metalness: 0.8, roughness: 0.35 });
  const z = sign * A.hz, t = 0.32;
  const bar = (w, h, d, x, y, zz, m = frameMat) => { const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); b.position.set(x, y, zz); b.castShadow = true; grp.add(b); return b; };
  bar(A.goalW + t * 2, t, t, 0, A.goalH + t / 2, z + sign * t / 2);
  for (const sx of [-1, 1]) bar(t, A.goalH, t, sx * (A.goalW / 2 + t / 2), A.goalH / 2, z + sign * t / 2);
  // fill the cut ends of the floor ramps beside the goal mouth (same look as the ramps, with a team-colour glow)
  const capMat = new THREE.MeshStandardMaterial({ color: 0x1c2a2e, roughness: 0.6, metalness: 0.2, emissive: col, emissiveIntensity: 0.12, side: THREE.DoubleSide });
  const e = A.edgeR;
  const sh = new THREE.Shape(); sh.moveTo(0, 0);
  for (let i = 0; i <= 12; i++) { const p = (i / 12) * Math.PI / 2; sh.lineTo(e * Math.sin(p), e - e * Math.cos(p)); }
  sh.lineTo(e, 0); sh.closePath();
  for (const sx of [-1, 1]) {
    const m = new THREE.Mesh(new THREE.ShapeGeometry(sh), capMat);
    m.rotation.y = sign > 0 ? -Math.PI / 2 : Math.PI / 2; m.position.set(sx * A.goalW / 2, 0, sign * (A.hz - e)); grp.add(m);
  }
  // net box (sides, roof, back) + glowing back panel
  const net = netTexture();
  const netMat = new THREE.MeshStandardMaterial({ color: 0xdfe6ef, map: net, alphaMap: net, transparent: true, emissive: col, emissiveIntensity: 0.25, emissiveMap: net, side: THREE.DoubleSide, depthWrite: false, roughness: 0.6 });
  const panel = (w, h, x, y, zz, ry, rx = 0, rep = [w / 3, h / 3]) => { const g = new THREE.PlaneGeometry(w, h); const tx = net.clone(); const m = netMat.clone(); m.map = m.alphaMap = m.emissiveMap = tx; tx.repeat.set(rep[0], rep[1]); tx.needsUpdate = true; const o = new THREE.Mesh(g, m); o.position.set(x, y, zz); o.rotation.set(rx, ry, 0); grp.add(o); };
  const zb = sign * (A.hz + A.goalD);
  panel(A.goalW, A.goalH, 0, A.goalH / 2, zb - sign * 0.05, 0);
  panel(A.goalD, A.goalH, -A.goalW / 2, A.goalH / 2, sign * (A.hz + A.goalD / 2), Math.PI / 2);
  panel(A.goalD, A.goalH, A.goalW / 2, A.goalH / 2, sign * (A.hz + A.goalD / 2), Math.PI / 2);
  panel(A.goalW, A.goalD, 0, A.goalH, sign * (A.hz + A.goalD / 2), 0, Math.PI / 2);
  const back = new THREE.Mesh(new THREE.PlaneGeometry(A.goalW + 0.4, A.goalH + 0.4), new THREE.MeshStandardMaterial({ color: 0x050608, emissive: col, emissiveIntensity: 0.35, roughness: 0.8 }));
  back.position.set(0, A.goalH / 2, zb + sign * 0.6); back.rotation.y = sign > 0 ? Math.PI : 0; grp.add(back);
  // goal box outer frame edges
  for (const sx of [-1, 1]) bar(0.14, 0.14, A.goalD, sx * A.goalW / 2, A.goalH, sign * (A.hz + A.goalD / 2), darkMat);
  bar(A.goalW, 0.14, 0.14, 0, A.goalH, zb, darkMat);
  // light strip on the goal floor line
  const line = new THREE.Mesh(new THREE.PlaneGeometry(A.goalW, 0.25), new THREE.MeshBasicMaterial({ color: col.clone().multiplyScalar(2.5) }));
  line.rotation.x = -Math.PI / 2; line.position.set(0, 0.012, sign * A.hz); grp.add(line);
  grp.userData.frameMat = frameMat;
  return grp;
}

// ---------- stands, crowd, roof, screens ----------
export function standRing(off, y0, y1, depth) { // a loop of stepped seating along an outline
  const ring = outline(off), pos = [], idx = [];
  for (let i = 0; i < ring.length; i++) {
    const p = ring[i];
    pos.push(p.x, y0, p.z, p.x, y1, p.z, p.x + p.nx * depth, y1, p.z + p.nz * depth);
  }
  for (let i = 0; i < ring.length - 1; i++) { const a = i * 3, b = a + 3; idx.push(a, b, a + 1, a + 1, b, b + 1, a + 1, b + 1, a + 2, a + 2, b + 1, b + 2); }
  return { pos, idx };
}
const smoothEnd = (nz) => { const t = Math.min(1, Math.max(0, (Math.abs(nz) - 0.2) / 0.75)); return t * t * (3 - 2 * t); };
export function seating(rows, off0, y0, rowD, rowH, endExtra) {
  const pos = [], idx = [], col = [], seats = [];
  for (let k = 0; k < rows; k++) {
    const off = off0 + k * rowD, y = y0 + k * rowH;
    const ring = outline(off);
    const base = pos.length / 3;
    for (let i = 0; i < ring.length; i++) {
      const p = ring[i], ext = endExtra * smoothEnd(p.nz);
      const x = p.x + p.nx * ext, z = p.z + p.nz * ext;
      pos.push(x, y - rowH, z, x, y, z, x + p.nx * rowD, y, z + p.nz * rowD);
      const sh = 0.5 + 0.5 * (k % 2);
      const c = z < 0 ? [0.12, 0.2, 0.42] : [0.42, 0.2, 0.1];
      col.push(0.05, 0.055, 0.065, c[0] * sh, c[1] * sh, c[2] * sh, c[0] * sh, c[1] * sh, c[2] * sh);
      if (i < ring.length - 1) { const a = base + i * 3, b = a + 3; idx.push(a, b, a + 1, a + 1, b, b + 1, a + 1, b + 1, a + 2, a + 2, b + 1, b + 2); }
    }
    // seat spots for spectators along this row
    let acc = 0;
    for (let i = 1; i < ring.length; i++) {
      const p0 = ring[i - 1], p1 = ring[i], L = Math.hypot(p1.x - p0.x, p1.z - p0.z); acc += L;
      while (acc > 0.72) { acc -= 0.72; const t = 1 - acc / L, ext = endExtra * smoothEnd(p0.nz);
        seats.push([p0.x + (p1.x - p0.x) * t + p0.nx * (ext + rowD * 0.55), y, p0.z + (p1.z - p0.z) * t + p0.nz * (ext + rowD * 0.55), Math.atan2(-p0.nx, -p0.nz)]); }
    }
  }
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute("color", new THREE.Float32BufferAttribute(col, 3)); g.setIndex(idx); g.computeVertexNormals();
  return { geo: g, seats };
}
function personGeometry() {
  const torso = new THREE.BoxGeometry(0.4, 0.5, 0.26); torso.translate(0, 0.25, 0);
  const head = new THREE.SphereGeometry(0.12, 6, 4); head.translate(0, 0.64, 0);
  const armL = new THREE.BoxGeometry(0.09, 0.42, 0.09); armL.translate(0, 0.2, 0);
  const parts = [[torso, 0], [head, 1], [armL.clone().translate(0.25, 0.05, 0), 2], [armL.clone().translate(-0.25, 0.05, 0), 3]];
  const pos = [], nor = [], part = [], idx = [];
  for (const [g, k] of parts) { const gi = g.toNonIndexed(), base = pos.length / 3; pos.push(...gi.attributes.position.array); nor.push(...gi.attributes.normal.array); for (let i = 0; i < gi.attributes.position.count; i++) part.push(k); }
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute("normal", new THREE.Float32BufferAttribute(nor, 3)); g.setAttribute("part", new THREE.Float32BufferAttribute(part, 1));
  return g;
}
export function buildCrowd(seats, density) {
  let seed = 11; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const chosen = seats.filter(() => rnd() < density);
  const n = chosen.length, geo = personGeometry();
  const ig = new THREE.InstancedBufferGeometry(); ig.index = null;
  for (const k of ["position", "normal", "part"]) ig.setAttribute(k, geo.attributes[k]);
  const off = new Float32Array(n * 4), shirt = new Float32Array(n * 3), skin = new Float32Array(n * 3), ph = new Float32Array(n);
  const skins = [[0.95, 0.78, 0.65], [0.85, 0.64, 0.5], [0.62, 0.43, 0.3], [0.42, 0.28, 0.2], [0.98, 0.85, 0.74]];
  chosen.forEach(([x, y, z, rot], i) => {
    off.set([x, y, z, rot], i * 4);
    const home = z < 0 ? TEAM[0] : TEAM[1], r = rnd();
    const c = r < 0.62 ? home : r < 0.75 ? new THREE.Color(0.92, 0.92, 0.95) : r < 0.85 ? new THREE.Color(0.08, 0.09, 0.1) : new THREE.Color().setHSL(rnd(), 0.5, 0.45);
    shirt.set([c.r, c.g, c.b], i * 3); skin.set(skins[(rnd() * skins.length) | 0], i * 3); ph[i] = rnd() * 100;
  });
  ig.setAttribute("aOff", new THREE.InstancedBufferAttribute(off, 4)); ig.setAttribute("aShirt", new THREE.InstancedBufferAttribute(shirt, 3));
  ig.setAttribute("aSkin", new THREE.InstancedBufferAttribute(skin, 3)); ig.setAttribute("aPh", new THREE.InstancedBufferAttribute(ph, 1));
  ig.instanceCount = n;
  const mat = new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uExcite: { value: 0.15 }, uFog: { value: new THREE.Color(0x070a12) } },
    vertexShader: `attribute vec4 aOff; attribute vec3 aShirt; attribute vec3 aSkin; attribute float aPh; attribute float part;
      uniform float uTime; uniform float uExcite; varying vec3 vC; varying float vL; varying float vD;
      void main(){
        vec3 p = position;
        float cheer = uExcite * step(0.35, fract(aPh * 0.37));
        float bob = max(0.0, sin(uTime * (5.0 + fract(aPh) * 3.0) + aPh)) * (0.05 + cheer * 0.3);
        if (part > 1.5) { // arms swing up when the crowd cheers
          float up = clamp(cheer * 1.6 + 0.08 * sin(uTime * 2.0 + aPh), 0.0, 1.0) * (0.6 + 0.4 * sin(uTime * 7.0 + aPh * 3.0));
          float side = part > 2.5 ? -1.0 : 1.0; float a = up * 2.8 * side;
          vec2 r = vec2(p.x - side * 0.25, p.y - 0.45); float c = cos(a), s = sin(a);
          p.xy = vec2(c * r.x - s * r.y, s * r.x + c * r.y) + vec2(side * 0.25, 0.45);
        }
        p.y += bob;
        float c = cos(aOff.w), s = sin(aOff.w);
        p = vec3(c * p.x + s * p.z, p.y, -s * p.x + c * p.z) + aOff.xyz;
        vec3 n = normalize(vec3(c * normal.x + s * normal.z, normal.y, -s * normal.x + c * normal.z));
        vC = part > 0.5 && part < 1.5 ? aSkin : aShirt;
        vL = 0.35 + 0.65 * max(dot(n, normalize(vec3(0.2, 1.0, 0.1))), 0.0);
        vec4 mv = modelViewMatrix * vec4(p, 1.0); vD = -mv.z; gl_Position = projectionMatrix * mv; }`,
    fragmentShader: `uniform vec3 uFog; varying vec3 vC; varying float vL; varying float vD;
      void main(){ vec3 c = vC * vL * 0.55; c = mix(c, uFog, 1.0 - exp(-vD * vD * 0.000012)); gl_FragColor = vec4(c, 1.0); }`,
  });
  const m = new THREE.Mesh(ig, mat); m.frustumCulled = false;
  return { mesh: m, mat, count: n };
}
function ledGoalTexture() {
  const c = canvas(2048, 64), g = c.getContext("2d");
  g.fillStyle = "#000"; g.fillRect(0, 0, 2048, 64);
  g.font = "italic 900 48px system-ui, Arial"; g.textBaseline = "middle";
  let x = 10; let k = 0; while (x < 2048) { g.fillStyle = k++ % 2 ? "#ffc23a" : "#ffffff"; g.fillText("GOAL!", x, 34); x += g.measureText("GOAL!").width + 60; }
  g.fillStyle = "rgba(0,0,0,0.45)"; for (let y = 0; y < 64; y += 4) g.fillRect(0, y, 2048, 1); for (let xx = 0; xx < 2048; xx += 4) g.fillRect(xx, 0, 1, 64);
  const t = ctex(c); t.wrapS = THREE.RepeatWrapping; return t;
}
export function ledTexture() {
  const c = canvas(2048, 64), g = c.getContext("2d");
  g.fillStyle = "#000"; g.fillRect(0, 0, 2048, 64);
  const items = [["TURBO LEAGUE", "#ffffff"], ["MR. WATFORD'S ARCADE", "#ffc23a"], ["ROCKET SOCCER", "#4aa3ff"], ["BOOST UP!", "#ff8a2a"], ["PLAY FAIR • HAVE FUN", "#9cf0b0"]];
  g.font = "italic 900 40px system-ui, Arial"; g.textBaseline = "middle";
  let x = 20; for (let k = 0; k < 2; k++) for (const [t, col] of items) { g.fillStyle = col; g.fillText(t, x, 34); x += g.measureText(t).width + 70; g.fillStyle = "#555"; g.fillText("◆", x - 48, 34); }
  // LED dot grid
  g.fillStyle = "rgba(0,0,0,0.45)"; for (let y = 0; y < 64; y += 4) g.fillRect(0, y, 2048, 1); for (let xx = 0; xx < 2048; xx += 4) g.fillRect(xx, 0, 1, 64);
  const t = ctex(c); t.wrapS = THREE.RepeatWrapping; return t;
}
export function ribbon(off, y0, y1, tex, intensity, endExtra = 0) {
  const ring = outline(off), pos = [], uv = [], idx = []; let s = 0;
  for (let i = 0; i < ring.length; i++) {
    const p = ring[i], ext = endExtra * smoothEnd(p.nz); if (i) s += Math.hypot(p.x - ring[i - 1].x, p.z - ring[i - 1].z);
    pos.push(p.x + p.nx * ext, y0, p.z + p.nz * ext, p.x + p.nx * ext, y1, p.z + p.nz * ext); uv.push(s / 40, 0, s / 40, 1);
    if (i) { const a = (i - 1) * 2; idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3); }
  }
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx);
  const m = new THREE.MeshBasicMaterial({ map: tex, color: new THREE.Color(intensity, intensity, intensity), side: THREE.DoubleSide });
  return new THREE.Mesh(g, m);
}
export function screenCanvas() { return canvas(1024, 512); }
export function drawScreen(c, { score = [0, 0], clock = "5:00", title = "TURBO LEAGUE", sub = "CHAMPIONSHIP STADIUM", flash = null } = {}) {
  const g = c.getContext("2d"), W = c.width, H = c.height;
  const grd = g.createLinearGradient(0, 0, W, H); grd.addColorStop(0, "#081428"); grd.addColorStop(1, "#1a0c06"); g.fillStyle = grd; g.fillRect(0, 0, W, H);
  g.fillStyle = "#1f6dff"; g.fillRect(0, 0, W / 2, 14); g.fillStyle = "#ff7a1a"; g.fillRect(W / 2, 0, W / 2, 14);
  g.textAlign = "center"; g.textBaseline = "middle";
  if (flash) {
    g.fillStyle = flash.color; g.font = "italic 900 200px system-ui, Arial"; g.fillText(flash.text, W / 2, H * 0.47);
    g.fillStyle = "#fff"; g.font = "800 46px system-ui, Arial"; g.fillText(flash.sub || "", W / 2, H * 0.82);
  } else {
    g.fillStyle = "#fff"; g.font = "italic 900 64px system-ui, Arial"; g.fillText(title, W / 2, 80);
    g.font = "900 190px system-ui, Arial"; g.fillStyle = "#5aa0ff"; g.fillText(score[0], W * 0.26, H * 0.56); g.fillStyle = "#ff9a4a"; g.fillText(score[1], W * 0.74, H * 0.56);
    g.fillStyle = "#fff"; g.font = "800 88px system-ui, Arial"; g.fillText(clock, W / 2, H * 0.56);
    g.fillStyle = "rgba(255,255,255,0.7)"; g.font = "700 34px system-ui, Arial"; g.fillText(sub, W / 2, H * 0.88);
  }
  g.fillStyle = "rgba(0,0,0,0.25)"; for (let y = 0; y < H; y += 3) g.fillRect(0, y, W, 1);
}
function bannerTexture(i) {
  const c = canvas(256, 640), g = c.getContext("2d");
  const team = i % 2, base = team ? "#7a2c06" : "#0d2a6e", hi = team ? "#ff8a2a" : "#4aa3ff";
  g.fillStyle = base; g.fillRect(0, 0, 256, 640);
  g.beginPath(); g.moveTo(0, 560); g.lineTo(128, 640); g.lineTo(256, 560); g.lineTo(256, 640); g.lineTo(0, 640); g.fillStyle = "#000"; g.fill();
  g.strokeStyle = "#ffd257"; g.lineWidth = 8; g.strokeRect(14, 14, 228, 530);
  // simple trophy emblem
  g.fillStyle = "#ffd257"; g.beginPath(); g.moveTo(78, 120); g.lineTo(178, 120); g.quadraticCurveTo(178, 230, 128, 250); g.quadraticCurveTo(78, 230, 78, 120); g.fill();
  g.fillRect(118, 250, 20, 40); g.fillRect(90, 290, 76, 16);
  g.fillStyle = hi; g.font = "italic 900 34px system-ui, Arial"; g.textAlign = "center";
  g.fillText("TURBO", 128, 370); g.fillText("LEAGUE", 128, 410);
  g.fillStyle = "#fff"; g.font = "800 30px system-ui, Arial"; g.fillText("CHAMPIONS", 128, 470); g.fillText(String(2019 + i), 128, 510);
  const t = ctex(c); return t;
}

// ---------- boost pads ----------
function buildPads() {
  const grp = new THREE.Group(), list = [];
  const baseMat = new THREE.MeshStandardMaterial({ color: 0x2a2d33, metalness: 0.85, roughness: 0.35 });
  const glowSmall = new THREE.MeshBasicMaterial({ color: new THREE.Color(2.4, 1.5, 0.35) });
  const orbMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(4.0, 2.4, 0.5) });
  const haloMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(2.2, 1.2, 0.25), transparent: true, opacity: 0.6, blending: THREE.AdditiveBlending, depthWrite: false });
  for (const p of boostPads()) {
    const g = new THREE.Group(); g.position.set(p.x, 0, p.z); grp.add(g);
    const R = p.big ? 1.2 : 0.62;
    const base = new THREE.Mesh(new THREE.CylinderGeometry(R, R + 0.12, 0.08, 32), baseMat); base.position.y = 0.04; base.receiveShadow = true; g.add(base);
    const glow = new THREE.Mesh(new THREE.CircleGeometry(R * 0.78, 32), glowSmall.clone()); glow.rotation.x = -Math.PI / 2; glow.position.y = 0.085; g.add(glow);
    let orb = null, halo = null;
    if (p.big) {
      orb = new THREE.Mesh(new THREE.IcosahedronGeometry(0.42, 2), orbMat.clone()); orb.position.y = 1.0; g.add(orb);
      halo = new THREE.Mesh(new THREE.TorusGeometry(0.75, 0.04, 8, 48), haloMat.clone()); halo.position.y = 1.0; halo.rotation.x = Math.PI / 2; g.add(halo);
    }
    list.push({ pad: p, glow, orb, halo, group: g });
  }
  return { group: grp, list };
}

// ---------- environment (what shiny things reflect) ----------
function stadiumEnvironment(renderer, E = {}) {
  const v3 = (a, d) => `vec3(${(a || d).map((x) => x.toFixed(3)).join(",")})`;
  const s = new THREE.Scene();
  const sky = new THREE.Mesh(new THREE.SphereGeometry(50, 32, 16), new THREE.ShaderMaterial({ side: THREE.BackSide, depthWrite: false,
    vertexShader: "varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.); }",
    fragmentShader: `varying vec3 vP; void main(){ float y = vP.y;
      vec3 roof = ${v3(E.roof, [0.03, 0.035, 0.05])}, stands = mix(${v3(E.standsA, [0.05, 0.08, 0.2])}, ${v3(E.standsB, [0.2, 0.09, 0.04])}, smoothstep(-0.3,0.3,vP.z)), floorC = ${v3(E.floor, [0.04, 0.09, 0.04])};
      vec3 c = y > 0.18 ? mix(stands*1.4, roof, smoothstep(0.18, 0.6, y)) : y > -0.05 ? stands * 1.6 : floorC;
      c += ${v3(E.ring, [0.9, 0.5, 0.15])} * smoothstep(0.02, 0.0, abs(y - 0.12)) * 0.9; // LED ring
      gl_FragColor = vec4(c, 1.); }` }));
  s.add(sky);
  const lamp = (w, h, x, y, z, k, col = 0xfff4e0) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: new THREE.Color(col).multiplyScalar(k), side: THREE.DoubleSide })); m.position.set(x, y, z); m.lookAt(0, 0, 0); s.add(m); };
  for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; lamp(6, 2.2, Math.sin(a) * 26, 24, Math.cos(a) * 26, E.lampK ?? 9, E.lamp ?? 0xfff4e0); }
  lamp(14, 14, 0, 40, 0, E.topK ?? 1.2, E.top ?? 0xc8d4ff);
  if (E.sun) lamp(18, 18, ...E.sun, E.sunK ?? 6, E.sunColor ?? 0xffb070);
  lamp(30, 3, 0, 4, -38, 2.5, 0x3a7bff); lamp(30, 3, 0, 4, 38, 2.5, 0xff7a1a);
  const pm = new THREE.PMREMGenerator(renderer); const rt = pm.fromScene(s, 0.03); pm.dispose();
  s.traverse((o) => { if (o.geometry) o.geometry.dispose(); if (o.material) o.material.dispose(); });
  rt.texture.userData.rt = rt; // so the arena can free the whole render target later
  return rt.texture;
}

// ---------- shared pieces every arena can use ----------
// stands + crowd + front ad board + crowd camera flashes. Returns the seat list.
export function addStands(root, st, Q, { rows = 24, upperRows = 0, tint = 0xffffff, density = Q.crowd } = {}) {
  const END_GAP = ARENA.goalD + 3.5;
  const concrete = new THREE.MeshStandardMaterial({ color: tint, vertexColors: true, roughness: 0.85, metalness: 0.05 });
  const lower = seating(rows, 3.2, 2.0, 0.95, 0.52, END_GAP); root.add(new THREE.Mesh(lower.geo, concrete));
  let seats = [...lower.seats];
  const adBoard = ribbon(3.2, 0, 1.5, st.led, 2.2, END_GAP); root.add(adBoard); st.ledMats.push(adBoard.material);
  if (upperRows) {
    const upper = seating(upperRows, 28.5, 18.5, 0.95, 0.66, END_GAP); root.add(new THREE.Mesh(upper.geo, concrete)); seats = seats.concat(upper.seats);
    const fascia = ribbon(26.0, 13.8, 16.2, st.led, 2.6, END_GAP); root.add(fascia); st.ledMats.push(fascia.material);
    const bowlDark = new THREE.MeshStandardMaterial({ color: 0x0d0f14, roughness: 0.9, side: THREE.DoubleSide });
    const { pos, idx } = standRing(26.0, 14.5, 18.5, 2.5); const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals(); root.add(new THREE.Mesh(g, bowlDark));
  }
  const crowd = buildCrowd(seats, density); root.add(crowd.mesh); st.crowd = crowd;
  { const N = 160, pos = new Float32Array(N * 3), life = new Float32Array(N);
    const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.BufferAttribute(pos, 3)); g.setAttribute("life", new THREE.BufferAttribute(life, 1));
    const m = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      vertexShader: "attribute float life; varying float vL; void main(){ vL = life; vec4 mv = modelViewMatrix * vec4(position,1.); gl_PointSize = 900.0 * life / max(1.0, -mv.z); gl_Position = projectionMatrix * mv; }",
      fragmentShader: "varying float vL; void main(){ vec2 d = gl_PointCoord - .5; float a = exp(-dot(d,d) * 22.0) * vL; gl_FragColor = vec4(vec3(6.0, 6.0, 5.5) * a, a); }" });
    const pts = new THREE.Points(g, m); pts.frustumCulled = false; root.add(pts);
    st.flash = { all: seats, pos, life, g, rate: 0.6, until: 0, acc: 0, i: 0 }; }
  return seats;
}
// the four-sided video board hanging over centre field (shows the score, GOAL!, REPLAY...)
export function centerBoard(root, st, frameMat, y = 29) {
  const sc = screenCanvas(); drawScreen(sc); const scTex = ctex(sc); st.screen = { canvas: sc, tex: scTex };
  const scMat = new THREE.MeshBasicMaterial({ map: scTex, color: new THREE.Color(1.6, 1.6, 1.6) }); st.screenMat = scMat;
  const board = new THREE.Group(); board.position.set(0, y, 0); root.add(board);
  board.add(new THREE.Mesh(new THREE.BoxGeometry(13.4, 7.2, 13.4), frameMat));
  for (let i = 0; i < 4; i++) { const f = new THREE.Mesh(new THREE.PlaneGeometry(12.6, 6.3), scMat); const a = i * Math.PI / 2; f.position.set(Math.sin(a) * 6.75, 0, Math.cos(a) * 6.75); f.rotation.y = a; board.add(f); }
  const ringB = new THREE.Mesh(new THREE.CylinderGeometry(7.6, 7.6, 0.8, 48, 1, true), new THREE.MeshBasicMaterial({ map: st.led, color: new THREE.Color(2, 2, 2), side: THREE.DoubleSide })); ringB.position.y = -4.2; board.add(ringB);
  return board;
}
// a big gradient sky dome (optionally with a glowing sun) for the outdoor arenas
export function skyDome(root, { top, mid, bottom, sun = null, sunColor = [1, 0.6, 0.3], sunSize = 0.02 }) {
  const mat = new THREE.ShaderMaterial({ side: THREE.BackSide, depthWrite: false, fog: false,
    uniforms: { uTop: { value: new THREE.Color(top) }, uMid: { value: new THREE.Color(mid) }, uBot: { value: new THREE.Color(bottom) }, uSun: { value: sun ? new THREE.Vector3(...sun).normalize() : new THREE.Vector3(0, -1, 0) }, uSunC: { value: new THREE.Vector3(...sunColor) }, uSunK: { value: sun ? 1 : 0 }, uSize: { value: sunSize } },
    vertexShader: "varying vec3 vD; void main(){ vD = normalize(position); vec4 p = projectionMatrix * modelViewMatrix * vec4(position, 1.); gl_Position = p.xyww; }",
    fragmentShader: `uniform vec3 uTop, uMid, uBot, uSun, uSunC; uniform float uSunK, uSize; varying vec3 vD;
      void main(){ float y = vD.y; vec3 c = y > 0. ? mix(uMid, uTop, pow(clamp(y, 0., 1.), .55)) : mix(uMid, uBot, pow(clamp(-y, 0., 1.), .4));
        float d = 1. - dot(vD, uSun); c += uSunC * uSunK * (smoothstep(uSize, 0., d) * 6. + exp(-d * 18.) * 0.6);
        gl_FragColor = vec4(c, 1.); }` });
  const m = new THREE.Mesh(new THREE.SphereGeometry(500, 48, 24), mat); m.renderOrder = -10; m.frustumCulled = false; root.add(m); return m;
}

// ---------- put it all together ----------
export function buildStadium(renderer, scene, Q, themeId = "championship") {
  const T = THEMES[themeId] || THEMES.championship;
  const A = ARENA, st = { anim: [], id: T.id, theme: T, ledMats: [], frameFlash: { 1: 0, [-1]: 0 }, ledGoalT: 0, camPos: new THREE.Vector3(), weather: [] };
  const root = new THREE.Group(); root.name = "arena-" + T.id; scene.add(root); st.root = root;
  scene.background = new THREE.Color(T.bg);
  scene.fog = new THREE.FogExp2(T.fog[0], T.fog[1]);
  const env = stadiumEnvironment(renderer, T.env); scene.environment = env;
  for (const m of buildFloor(renderer, T)) root.add(m);
  // ramps (solid), glass walls (team-tinted hex lines), ceiling (faint)
  const rampMat = teamTint(new THREE.MeshStandardMaterial({ map: rampTexture(), color: T.ramp, roughness: T.rampRough ?? 0.55, metalness: 0.2, emissive: 0xffffff, emissiveIntensity: 0.05, side: THREE.DoubleSide }), { colorTint: 0.12 });
  const hex = hexTexture(); hex.repeat.set(2.4, 2.4);
  const wallMat = teamTint(new THREE.MeshStandardMaterial({ color: T.wall, transparent: true, opacity: 0.2, roughness: 0.08, metalness: 0.4, emissive: 0xffffff, emissiveMap: hex, emissiveIntensity: T.wallGlow, side: THREE.DoubleSide, depthWrite: false }));
  const topMat = teamTint(new THREE.MeshStandardMaterial({ color: T.wall, transparent: true, opacity: 0.1, roughness: 0.1, metalness: 0.3, emissive: 0xffffff, emissiveMap: hex, emissiveIntensity: T.wallGlow * 0.4, side: THREE.DoubleSide, depthWrite: false }));
  const shell = new THREE.Mesh(buildShell(), [rampMat, wallMat, topMat]); shell.receiveShadow = true; shell.renderOrder = 2; root.add(shell);
  root.add(trimLine());
  { const e = A.edgeR, sh = new THREE.Shape(), hx = A.hx - e, hz = A.hz - e, r = A.cornerR - e;
    sh.moveTo(-hx + r, -hz); sh.lineTo(hx - r, -hz); sh.absarc(hx - r, -hz + r, r, -Math.PI / 2, 0); sh.lineTo(hx, hz - r); sh.absarc(hx - r, hz - r, r, 0, Math.PI / 2); sh.lineTo(-hx + r, hz); sh.absarc(-hx + r, hz - r, r, Math.PI / 2, Math.PI); sh.lineTo(-hx, -hz + r); sh.absarc(-hx + r, -hz + r, r, Math.PI, Math.PI * 1.5);
    const g = new THREE.ShapeGeometry(sh, 16); g.rotateX(Math.PI / 2); g.translate(0, A.h, 0);
    const uv = g.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) / 6, uv.getY(i) / 6);
    const c = new THREE.Mesh(g, topMat); c.renderOrder = 2; root.add(c); }
  const gPlus = buildGoal(1, 1), gMinus = buildGoal(-1, 0); root.add(gPlus, gMinus);
  st.frames = { 1: gPlus.userData.frameMat, [-1]: gMinus.userData.frameMat };
  const pads = buildPads(); root.add(pads.group); st.pads = pads.list;
  st.led = ledTexture(); st.ledGoalTex = ledGoalTexture();
  // the arena's own surroundings (stands, skyline, coliseum, dome, space...)
  T.decor(root, st, Q, renderer, scene);
  // ---- lights
  const hemi = new THREE.HemisphereLight(T.hemi[0], T.hemi[1], T.hemi[2]); root.add(hemi);
  const key = new THREE.DirectionalLight(T.key[0], T.key[1]); const kd = new THREE.Vector3(...T.key[2]); key.position.copy(kd);
  if (Q.shadows) {
    key.castShadow = true; key.shadow.mapSize.set(Q.shadows, Q.shadows);
    const sc2 = key.shadow.camera; sc2.left = -26; sc2.right = 26; sc2.top = 26; sc2.bottom = -26; sc2.near = 1; sc2.far = 120;
    key.shadow.bias = -0.0004; key.shadow.normalBias = 0.03; key.shadow.radius = 3;
  }
  root.add(key, key.target); st.key = key;
  const rimL = new THREE.DirectionalLight(T.rim[0], T.rim[1]); rimL.position.set(...T.rim[2]); root.add(rimL);
  st.update = (t, dt, excite) => {
    st.led.offset.x = (st.led.offset.x + dt * 0.05) % 1;
    if (st.crowd) { st.crowd.mat.uniforms.uTime.value = t; st.crowd.mat.uniforms.uExcite.value += (excite - st.crowd.mat.uniforms.uExcite.value) * Math.min(1, dt * 3); }
    for (const f of st.anim) f(t, dt);
    for (const w of st.weather) w(t, dt);
    for (const k of [1, -1]) { st.frameFlash[k] = Math.max(0, st.frameFlash[k] - dt); const f = st.frameFlash[k]; st.frames[k].emissiveIntensity = 3.2 + (f > 0 ? (6 + 4 * Math.sin(t * 18)) * Math.min(1, f) : 0); }
    if (st.ledGoalT > 0) { st.ledGoalT -= dt; if (st.ledGoalT <= 0) for (const m of st.ledMats) m.map = st.led; }
    st.ledGoalTex.offset.x = (st.ledGoalTex.offset.x + dt * 0.25) % 1;
    const F = st.flash; if (F) {
      F.acc += dt * (t < F.until ? 70 : F.rate + excite * 4);
      for (let i = 0; i < F.life.length; i++) F.life[i] = Math.max(0, F.life[i] - dt * 9);
      while (F.acc > 1) { F.acc--; const s = F.all[(Math.random() * F.all.length) | 0], i = F.i++ % F.life.length; F.pos.set([s[0], s[1] + 0.7, s[2]], i * 3); F.life[i] = 1; }
      F.g.attributes.position.needsUpdate = F.g.attributes.life.needsUpdate = true;
    }
  };
  st.setPad = (i, active, t) => {
    const p = st.pads[i]; const k = active ? 1 : 0.08;
    p.glow.material.color.setRGB(2.4 * k, 1.5 * k, 0.35 * k);
    if (p.orb) { p.orb.visible = active; p.halo.visible = active; p.orb.position.y = 1.0 + Math.sin(t * 2.4 + i) * 0.12; p.orb.rotation.y = t * 1.5; p.halo.rotation.z = t; p.halo.scale.setScalar(1 + 0.08 * Math.sin(t * 4 + i)); }
  };
  st.celebrate = (sign, t, reducedFlash) => {
    st.frameFlash[sign] = 3.5;
    st.ledGoalT = 4; for (const m of st.ledMats) m.map = st.ledGoalTex;
    if (!reducedFlash && st.flash) st.flash.until = t + 3;
  };
  st.followShadow = (x, z) => { key.target.position.set(x, 0, z); key.position.set(x + kd.x * 0.45, kd.y, z + kd.z * 0.45); };
  st.dispose = () => {
    scene.remove(root);
    root.traverse((o) => {
      if (o.geometry) o.geometry.dispose();
      const ms = Array.isArray(o.material) ? o.material : o.material ? [o.material] : [];
      for (const m of ms) { for (const k of ["map", "emissiveMap", "alphaMap", "normalMap"]) if (m[k]) m[k].dispose(); for (const x of m.userData.extraTex || []) x.dispose(); if (m.uniforms) for (const u of Object.values(m.uniforms)) if (u && u.value && u.value.isTexture) u.value.dispose(); m.dispose(); }
    });
    key.dispose(); // frees the shadow map too
    if (env.userData.rt) env.userData.rt.dispose(); else env.dispose(); st.led.dispose(); st.ledGoalTex.dispose();
  };
  return st;
}

// ---------- the Championship Stadium's own surroundings (the flagship) ----------
export function championshipDecor(root, st, Q) {
  const A = ARENA;
  addStands(root, st, Q, { rows: 24, upperRows: 20 });
  const roofY = 36;
  const roof = new THREE.Mesh(new THREE.PlaneGeometry(260, 260), new THREE.MeshStandardMaterial({ color: 0x06070a, roughness: 1 })); roof.rotation.x = Math.PI / 2; roof.position.y = roofY + 1; root.add(roof);
  const trussMat = new THREE.MeshStandardMaterial({ color: 0x2a2e36, metalness: 0.7, roughness: 0.5 });
  const trusses = []; for (let i = -6; i <= 6; i++) trusses.push([i * 9, 0, 1, 130]); for (let i = -4; i <= 4; i++) trusses.push([0, i * 11, 100, 1]);
  const tm = new THREE.InstancedMesh(new THREE.BoxGeometry(0.5, 0.8, 1), trussMat, trusses.length); const M = new THREE.Matrix4();
  trusses.forEach(([x, z, sx, sz], i) => { M.compose(new THREE.Vector3(x, roofY, z), new THREE.Quaternion(), new THREE.Vector3(sx > 1 ? sx : 1, 1, sz > 1 ? sz : 1)); tm.setMatrixAt(i, M); }); root.add(tm);
  const lampPos = []; const ringL = outline(17); for (let i = 0; i < ringL.length - 1; i += 3) for (let k = 0; k < 3; k++) lampPos.push([ringL[i].x + ringL[i].nx * k * 1.3, roofY - 2.2, ringL[i].z + ringL[i].nz * k * 1.3, Math.atan2(ringL[i].nx, ringL[i].nz)]);
  const lm = new THREE.InstancedMesh(new THREE.BoxGeometry(1.1, 0.25, 0.7), new THREE.MeshBasicMaterial({ color: new THREE.Color(9, 8.6, 7.8) }), lampPos.length);
  const lh = new THREE.InstancedMesh(new THREE.BoxGeometry(1.3, 0.5, 0.9), trussMat, lampPos.length);
  lampPos.forEach(([x, y, z, r], i) => { const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(0.5, r, 0, "YXZ")); M.compose(new THREE.Vector3(x, y, z), q, new THREE.Vector3(1, 1, 1)); lm.setMatrixAt(i, M); M.compose(new THREE.Vector3(x, y + 0.32, z), q, new THREE.Vector3(1, 1, 1)); lh.setMatrixAt(i, M); });
  root.add(lm, lh);
  centerBoard(root, st, trussMat, 29);
  for (const s of [-1, 1]) {
    const scr = new THREE.Mesh(new THREE.PlaneGeometry(26, 13), st.screenMat); scr.position.set(0, 25, s * (A.hz + 6.5 + 26)); scr.rotation.y = s > 0 ? Math.PI : 0; root.add(scr);
    const fr = new THREE.Mesh(new THREE.BoxGeometry(27.5, 14.5, 0.6), trussMat); fr.position.set(0, 25, s * (A.hz + 6.5 + 26.4)); root.add(fr);
  }
  for (let i = 0; i < 8; i++) {
    const s = i < 4 ? -1 : 1, k = i % 4;
    const b = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 8), new THREE.MeshStandardMaterial({ map: bannerTexture(i), side: THREE.DoubleSide, roughness: 0.9 }));
    b.position.set(s * (A.hx + 24), 30, -21 + k * 14); b.rotation.y = s * Math.PI / 2 * -1; root.add(b); st.anim.push((t) => { b.rotation.z = Math.sin(t * 0.7 + i) * 0.02; });
  }
}
