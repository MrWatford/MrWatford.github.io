// Turbo League — the five arenas. Every arena uses the SAME field, walls, goals and boost pads
// (built in stadium.js from config.js, so the physics is identical and fair). Only the surroundings,
// light, weather and sound change here.
import * as THREE from "../lib/three.module.min.js";
import { ARENA } from "./config.js";
import { championshipDecor, addStands, centerBoard, skyDome, outline, canvas, ctex } from "./stadium.js";

const END_GAP = ARENA.goalD + 3.5;
const smoothEnd = (nz) => { const t = Math.min(1, Math.max(0, (Math.abs(nz) - 0.2) / 0.75)); return t * t * (3 - 2 * t); };
const ring = (off, step) => { // evenly spaced points around the stands (ends pushed back past the goals)
  const pts = outline(off), out = []; let acc = 0;
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1], b = pts[i], L = Math.hypot(b.x - a.x, b.z - a.z); acc += L;
    while (acc >= step) { acc -= step; const k = 1 - acc / L, e = END_GAP * smoothEnd(a.nz); out.push({ x: a.x + (b.x - a.x) * k + a.nx * e, z: a.z + (b.z - a.z) * k + a.nz * e, nx: a.nx, nz: a.nz }); }
  }
  return out;
};
let seed = 1; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
const scaleCount = (Q, n) => Math.max(8, Math.round(n * Math.min(1.3, Q.particles)));

// falling particles (rain streaks or snowflakes) that wrap around a box
function precipitation(root, Q, { count, box, speed, wind = [0, 0], streak = 0, color, size = 0.12, avoidR = 0 }) {
  const n = scaleCount(Q, count), P = new Float32Array(n * 3);
  const place = (i, yTop) => { let x, z; do { x = (rnd() - 0.5) * box[0]; z = (rnd() - 0.5) * box[2]; } while (avoidR && Math.hypot(x, z) < avoidR); P.set([x, yTop ? box[1] : rnd() * box[1], z], i * 3); };
  for (let i = 0; i < n; i++) place(i, false);
  let obj, upd;
  if (streak) {
    const L = new Float32Array(n * 6), g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.BufferAttribute(L, 3));
    obj = new THREE.LineSegments(g, new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.38, depthWrite: false }));
    upd = () => { for (let i = 0; i < n; i++) { const x = P[i * 3], y = P[i * 3 + 1], z = P[i * 3 + 2]; L.set([x, y, z, x - wind[0] * streak / speed, y + streak, z - wind[1] * streak / speed], i * 6); } g.attributes.position.needsUpdate = true; };
  } else {
    const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.BufferAttribute(P, 3));
    obj = new THREE.Points(g, new THREE.PointsMaterial({ color, size, transparent: true, opacity: 0.85, depthWrite: false, sizeAttenuation: true }));
    upd = () => { g.attributes.position.needsUpdate = true; };
  }
  obj.frustumCulled = false; root.add(obj);
  return (t, dt) => {
    for (let i = 0; i < n; i++) {
      P[i * 3 + 1] -= speed * dt; P[i * 3] += (wind[0] + Math.sin(t * 0.7 + i) * (streak ? 0 : 0.4)) * dt; P[i * 3 + 2] += wind[1] * dt;
      if (P[i * 3 + 1] < 0 || Math.abs(P[i * 3]) > box[0] / 2 || Math.abs(P[i * 3 + 2]) > box[2] / 2) place(i, true);
    }
    upd();
  };
}
function mountains(root, { count, rMin, rMax, hMin, hMax, low, high, snow = false }) {
  const geo = [], col = new THREE.Color(), cl = new THREE.Color(low), ch = new THREE.Color(high);
  for (let i = 0; i < count; i++) {
    const a = (i / count) * Math.PI * 2 + rnd() * 0.3, r = rMin + rnd() * (rMax - rMin), h = hMin + rnd() * (hMax - hMin), w = h * (snow ? 0.9 + rnd() * 0.8 : 1.7 + rnd() * 1.4);
    const g0 = new THREE.ConeGeometry(w, h, 9 + ((rnd() * 4) | 0), 4); const gp = g0.attributes.position;
    // rough up the slopes so they read as mountains, not pyramids
    for (let k = 0; k < gp.count; k++) { const y = gp.getY(k); if (y < h / 2 - 0.01) { const j = 0.75 + rnd() * 0.5; gp.setXYZ(k, gp.getX(k) * j, y + (rnd() - 0.5) * h * 0.08, gp.getZ(k) * j); } }
    const g = g0.toNonIndexed(); g0.dispose(); g.translate(Math.sin(a) * r, h / 2 - 2, Math.cos(a) * r);
    const p = g.attributes.position, c = new Float32Array(p.count * 3);
    for (let k = 0; k < p.count; k++) { const t = Math.min(1, Math.max(0, (p.getY(k) + 2) / h)); col.copy(cl).lerp(ch, snow ? (t > 0.55 ? 1 : t * 0.6) : t); c.set([col.r, col.g, col.b], k * 3); }
    g.setAttribute("color", new THREE.BufferAttribute(c, 3)); geo.push(g);
  }
  // merge into one mesh (one draw call)
  const total = geo.reduce((s, g) => s + g.attributes.position.count, 0), P = new Float32Array(total * 3), C = new Float32Array(total * 3); let o = 0;
  for (const g of geo) { P.set(g.attributes.position.array, o * 3); C.set(g.attributes.color.array, o * 3); o += g.attributes.position.count; g.dispose(); }
  const m = new THREE.BufferGeometry(); m.setAttribute("position", new THREE.BufferAttribute(P, 3)); m.setAttribute("color", new THREE.BufferAttribute(C, 3)); m.computeVertexNormals();
  root.add(new THREE.Mesh(m, new THREE.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 1 })));
}
function textTexture(text, { w = 1024, h = 256, color = "#ff3df2", font = "italic 900 150px system-ui, Arial", bg = "rgba(0,0,0,0)" } = {}) {
  const c = canvas(w, h), g = c.getContext("2d"); g.fillStyle = bg; g.fillRect(0, 0, w, h);
  g.font = font; g.textAlign = "center"; g.textBaseline = "middle"; g.shadowColor = color; g.shadowBlur = 30; g.fillStyle = color; g.fillText(text, w / 2, h / 2); g.shadowBlur = 0; g.fillStyle = "#fff"; g.globalAlpha = 0.55; g.fillText(text, w / 2, h / 2);
  return ctex(c);
}

// ================= NEON CITY ARENA =================
function neonDecor(root, st, Q) {
  seed = 101;
  skyDome(root, { top: 0x05010f, mid: 0x2b0d42, bottom: 0x070310 });
  addStands(root, st, Q, { rows: 16, tint: 0x9a8ac0 });
  // the skyline: one instanced draw for every tower; windows and neon roof strips are drawn by the shader
  const N = 170, geo = new THREE.BoxGeometry(1, 1, 1); geo.translate(0, 0.5, 0);
  const mat = new THREE.ShaderMaterial({ uniforms: { uTime: { value: 0 }, uFog: { value: new THREE.Color(0x1a0a2a) } },
    vertexShader: `varying vec3 vW; varying vec3 vN; varying float vH; varying float vSeed; varying float vD;
      void main(){ vec4 w = modelMatrix * instanceMatrix * vec4(position, 1.); vW = w.xyz; vN = normalize(mat3(modelMatrix * instanceMatrix) * normal);
        vH = length(instanceMatrix[1].xyz); vSeed = fract(sin(dot(instanceMatrix[3].xz, vec2(12.9898, 78.233))) * 43758.5);
        vec4 mv = viewMatrix * w; vD = -mv.z; gl_Position = projectionMatrix * mv; }`,
    fragmentShader: `uniform float uTime; uniform vec3 uFog; varying vec3 vW; varying vec3 vN; varying float vH; varying float vSeed; varying float vD;
      float h(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
      void main(){ vec3 base = vec3(0.02, 0.02, 0.05); vec3 c = base;
        if (abs(vN.y) < 0.5) { vec2 uv = vec2(abs(vN.x) > 0.5 ? vW.z : vW.x, vW.y); vec2 cell = floor(uv / vec2(1.6, 2.4));
          float win = step(0.35, fract(uv.x / 1.6)) * step(0.4, fract(uv.y / 2.4)) * step(1.5, vW.y);
          float lit = step(0.62 + vSeed * 0.25, h(cell + vSeed * 31.0)); vec3 wc = mix(vec3(1.0, 0.75, 0.45), vec3(0.55, 0.8, 1.2), step(0.5, h(cell * 1.7)));
          c += win * lit * wc * 0.75; }
        vec3 neon = vSeed < 0.33 ? vec3(3.0, 0.3, 2.4) : vSeed < 0.66 ? vec3(0.2, 2.4, 3.2) : vec3(1.8, 0.5, 3.4);
        c += neon * smoothstep(vH - 1.2, vH - 0.3, vW.y) * step(vW.y, vH) * (0.85 + 0.15 * sin(uTime * 3.0 + vSeed * 20.0));
        c = mix(c, uFog, 1.0 - exp(-vD * 0.0035)); gl_FragColor = vec4(c, 1.0); }` });
  const towers = new THREE.InstancedMesh(geo, mat, N), M = new THREE.Matrix4();
  for (let i = 0; i < N; i++) { const a = rnd() * Math.PI * 2, r = 95 + rnd() * 150, w = 10 + rnd() * 20, d = 10 + rnd() * 20, hgt = 25 + rnd() * 70 + (r - 95) * 0.6;
    M.compose(new THREE.Vector3(Math.sin(a) * r, -1, Math.cos(a) * r * 1.15), new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), rnd() * 0.6), new THREE.Vector3(w, hgt, d)); towers.setMatrixAt(i, M); }
  root.add(towers); st.anim.push((t) => { mat.uniforms.uTime.value = t; });
  // holographic billboards (flickering, scan-lined)
  const holo = (text, color, x, y, z, w, hh, ry) => {
    const tex = textTexture(text, { color });
    const m = new THREE.ShaderMaterial({ uniforms: { uTex: { value: tex }, uTime: { value: 0 } }, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
      vertexShader: "varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.); }",
      fragmentShader: "uniform sampler2D uTex; uniform float uTime; varying vec2 vUv; void main(){ vec4 t = texture2D(uTex, vUv + vec2(sin(vUv.y * 40. + uTime * 8.) * 0.002, 0.)); float scan = 0.75 + 0.25 * sin(vUv.y * 220. - uTime * 12.); float flick = 0.85 + 0.15 * step(0.97, fract(sin(floor(uTime * 12.)) * 999.)); gl_FragColor = vec4(t.rgb * 2.2 * scan * flick, t.a * scan); }" });
    const p = new THREE.Mesh(new THREE.PlaneGeometry(w, hh), m); p.position.set(x, y, z); p.rotation.y = ry; root.add(p); st.anim.push((t) => { m.uniforms.uTime.value = t; });
  };
  holo("TURBO LEAGUE", "#ff3df2", -70, 38, -40, 44, 11, Math.PI / 2.6);
  holo("NEON CITY", "#3ee8ff", 72, 34, 30, 40, 10, -Math.PI / 1.6);
  holo("BOOST UP!", "#ffd23a", 0, 42, 105, 46, 11.5, Math.PI);
  holo("MR. WATFORD'S ARCADE", "#7dff7a", 0, 36, -108, 60, 9, 0);
  // neon tube trims on the stands
  const tube = (off, y, col) => { const pts = ring(off, 1.5).map((p) => new THREE.Vector3(p.x, y, p.z)); pts.push(pts[0].clone());
    const c = new THREE.CatmullRomCurve3(pts, true); root.add(new THREE.Mesh(new THREE.TubeGeometry(c, pts.length * 2, 0.12, 6, true), new THREE.MeshBasicMaterial({ color: new THREE.Color(...col) }))); };
  tube(18.6, 10.6, [3, 0.4, 2.6]); tube(3.4, 1.62, [0.3, 2.6, 3.2]);
  centerBoard(root, st, new THREE.MeshStandardMaterial({ color: 0x120a1f, metalness: 0.8, roughness: 0.3, emissive: 0x5a1a80, emissiveIntensity: 0.6 }), 27);
  st.weather.push(precipitation(root, Q, { count: 1700, box: [150, 50, 170], speed: 30, wind: [2.5, 0], streak: 0.9, color: 0x9fb4ff }));
}

// ================= DESERT COLISEUM =================
function sandTexture() {
  const c = canvas(256, 256), g = c.getContext("2d"); g.fillStyle = "#cfa673"; g.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 3000; i++) { const v = 150 + rnd() * 70; g.fillStyle = `rgba(${v + 40},${v + 10},${v - 30},0.35)`; g.fillRect(rnd() * 256, rnd() * 256, 2, 2); }
  g.strokeStyle = "rgba(90,60,30,0.35)"; g.lineWidth = 2; for (let y = 0; y < 256; y += 32) { g.beginPath(); g.moveTo(0, y); g.lineTo(256, y); g.stroke(); for (let x = (y / 32) % 2 ? 0 : 32; x < 256; x += 64) { g.beginPath(); g.moveTo(x, y); g.lineTo(x, y + 32); g.stroke(); } }
  const t = ctex(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; return t;
}
function desertDecor(root, st, Q) {
  seed = 202;
  skyDome(root, { top: 0x241a4a, mid: 0xff8a3d, bottom: 0x4a2a16, sun: [0.78, 0.1, -0.62], sunColor: [1.6, 0.8, 0.35], sunSize: 0.0022 });
  const ground = new THREE.Mesh(new THREE.CircleGeometry(600, 48), new THREE.MeshStandardMaterial({ color: 0xc89a62, roughness: 1 })); ground.rotation.x = -Math.PI / 2; ground.position.y = -0.3; root.add(ground);
  mountains(root, { count: 18, rMin: 280, rMax: 420, hMin: 30, hMax: 85, low: 0x5a3550, high: 0xc0785a });
  addStands(root, st, Q, { rows: 18, tint: 0xf0d2a4 });
  // the coliseum wall: two tiers of sandstone arches all the way round
  const stone = new THREE.MeshStandardMaterial({ map: sandTexture(), color: 0xe0b98a, roughness: 0.95 });
  const sh = new THREE.Shape(); sh.moveTo(-3.3, 0); sh.lineTo(3.3, 0); sh.lineTo(3.3, 7.5); sh.lineTo(-3.3, 7.5); sh.closePath();
  const hole = new THREE.Path(); hole.moveTo(-2, 0); hole.lineTo(-2, 4); hole.absarc(0, 4, 2, Math.PI, 0, true); hole.lineTo(2, 0); hole.closePath(); sh.holes.push(hole);
  const arch = new THREE.ExtrudeGeometry(sh, { depth: 2.2, bevelEnabled: false, curveSegments: 10 }); arch.translate(0, 0, -1.1);
  const spots = ring(22.5, 6.6), inst = new THREE.InstancedMesh(arch, stone, spots.length * 2), M = new THREE.Matrix4();
  spots.forEach((p, i) => { const q = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.atan2(p.nx, p.nz)); for (let tier = 0; tier < 2; tier++) { M.compose(new THREE.Vector3(p.x, tier * 7.5, p.z), q, new THREE.Vector3(1, 1, 1)); inst.setMatrixAt(i * 2 + tier, M); } });
  root.add(inst);
  // banners on poles along the top of the wall, waving in the hot wind
  const bannerTex = (i) => { const c = canvas(128, 384), g = c.getContext("2d"); g.fillStyle = i % 2 ? "#a3162a" : "#d9a520"; g.fillRect(0, 0, 128, 384); g.fillStyle = i % 2 ? "#d9a520" : "#7a1020"; g.fillRect(0, 40, 128, 18); g.fillRect(0, 300, 128, 18); g.beginPath(); g.arc(64, 180, 34, 0, Math.PI * 2); g.fill(); return ctex(c); };
  spots.filter((_, i) => i % 5 === 0).forEach((p, i) => {
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 9, 6), stone); pole.position.set(p.x, 19.5, p.z); root.add(pole);
    const b = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 4.8), new THREE.MeshStandardMaterial({ map: bannerTex(i), side: THREE.DoubleSide, roughness: 0.9 }));
    b.position.set(p.x + p.nz * 0.85, 21.5, p.z - p.nx * 0.85); b.rotation.y = Math.atan2(p.nx, p.nz) + Math.PI / 2; root.add(b);
    st.anim.push((t) => { b.rotation.z = Math.sin(t * 2.2 + i) * 0.08; });
  });
  // braziers with flickering fire
  const fireMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(4, 1.7, 0.4) });
  spots.filter((_, i) => i % 7 === 3).forEach((p, i) => { const f = new THREE.Mesh(new THREE.ConeGeometry(0.6, 1.6, 8), fireMat); f.position.set(p.x, 15.8, p.z); root.add(f); st.anim.push((t) => { f.scale.y = 0.8 + 0.3 * Math.sin(t * 13 + i * 3); }); });
  centerBoard(root, st, stone, 28);
  st.weather.push(precipitation(root, Q, { count: 500, box: [260, 18, 260], speed: 0.3, wind: [5, 1.5], color: 0xe0b98a, size: 0.25 }));
}

// ================= ARCTIC DOME =================
function arcticDecor(root, st, Q) {
  seed = 303;
  skyDome(root, { top: 0x5f9cff, mid: 0xdcecff, bottom: 0xffffff, sun: [-0.3, 0.55, 0.6], sunColor: [1, 1, 0.9], sunSize: 0.002 });
  const ground = new THREE.Mesh(new THREE.CircleGeometry(600, 48), new THREE.MeshStandardMaterial({ color: 0xf4f8ff, roughness: 0.75 })); ground.rotation.x = -Math.PI / 2; ground.position.y = -0.3; root.add(ground);
  mountains(root, { count: 20, rMin: 260, rMax: 420, hMin: 70, hMax: 170, low: 0x6f84a6, high: 0xffffff, snow: true });
  addStands(root, st, Q, { rows: 20, tint: 0xd6e8ff });
  // the glass dome: transparent shell + steel ribs
  const glass = new THREE.MeshStandardMaterial({ color: 0xcfeaff, transparent: true, opacity: 0.08, roughness: 0.04, metalness: 0.3, envMapIntensity: 2, side: THREE.DoubleSide, depthWrite: false });
  const dome = new THREE.Mesh(new THREE.SphereGeometry(100, 48, 16, 0, Math.PI * 2, 0, Math.PI / 2), glass); dome.scale.set(1, 0.55, 1.18); dome.renderOrder = 3; root.add(dome);
  const steel = new THREE.MeshStandardMaterial({ color: 0xe8eef6, metalness: 0.7, roughness: 0.3 });
  for (let i = 0; i < 20; i++) { const a = (i / 20) * Math.PI * 2, pts = [];
    for (let k = 0; k <= 16; k++) { const ph = (k / 16) * Math.PI / 2; pts.push(new THREE.Vector3(Math.sin(a) * Math.cos(ph) * 100, Math.sin(ph) * 55, Math.cos(a) * Math.cos(ph) * 118)); }
    root.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 24, 0.45, 6), steel)); }
  for (const ph of [0.35, 0.75, 1.15]) { const tr = new THREE.Mesh(new THREE.TorusGeometry(100 * Math.cos(ph), 0.4, 6, 96), steel); tr.rotation.x = Math.PI / 2; tr.position.y = Math.sin(ph) * 55; tr.scale.set(1, 1.18, 1); root.add(tr); }
  // ice pillars around the top of the stands
  const ice = new THREE.MeshPhysicalMaterial({ color: 0x9fe3ff, transparent: true, opacity: 0.55, roughness: 0.08, metalness: 0, clearcoat: 1, emissive: 0x2a8fbf, emissiveIntensity: 0.35 });
  ring(23, 14).forEach((p) => { const c = new THREE.Mesh(new THREE.CylinderGeometry(1.3, 1.7, 24, 6), ice); c.position.set(p.x, 12, p.z); root.add(c); });
  centerBoard(root, st, steel, 29);
  st.weather.push(precipitation(root, Q, { count: 1400, box: [420, 90, 420], speed: 2.2, wind: [1.2, 0.4], color: 0xffffff, size: 0.45, avoidR: 125 }));
}

// ================= GALACTIC ARENA =================
function galacticDecor(root, st, Q) {
  seed = 404;
  skyDome(root, { top: 0x02010a, mid: 0x0b0624, bottom: 0x000000 });
  // stars (twinkling)
  { const n = 2600, P = new Float32Array(n * 3), S = new Float32Array(n);
    for (let i = 0; i < n; i++) { const u = rnd() * 2 - 1, a = rnd() * Math.PI * 2, r = 430; P.set([Math.sqrt(1 - u * u) * Math.cos(a) * r, u * r, Math.sqrt(1 - u * u) * Math.sin(a) * r], i * 3); S[i] = rnd(); }
    const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.BufferAttribute(P, 3)); g.setAttribute("seed", new THREE.BufferAttribute(S, 1));
    const m = new THREE.ShaderMaterial({ uniforms: { uTime: { value: 0 } }, transparent: true, depthWrite: false, fog: false,
      vertexShader: "attribute float seed; uniform float uTime; varying float vA; void main(){ vA = 0.5 + 0.5 * sin(uTime * (1.0 + seed * 3.0) + seed * 50.0); gl_PointSize = 1.5 + seed * 2.5; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }",
      fragmentShader: "varying float vA; void main(){ vec2 d = gl_PointCoord - .5; float a = smoothstep(.5, 0., length(d)); gl_FragColor = vec4(vec3(1.6, 1.6, 2.0) * a * (0.4 + vA), a); }" });
    const pts = new THREE.Points(g, m); pts.frustumCulled = false; root.add(pts); st.anim.push((t) => { m.uniforms.uTime.value = t; }); }
  // nebula glows
  const glowTex = (c1, c2) => { const c = canvas(256, 256), g = c.getContext("2d"), r = g.createRadialGradient(128, 128, 0, 128, 128, 128); r.addColorStop(0, c1); r.addColorStop(0.5, c2); r.addColorStop(1, "rgba(0,0,0,0)"); g.fillStyle = r; g.fillRect(0, 0, 256, 256); return ctex(c); };
  for (const [x, y, z, s, c1, c2] of [[200, 120, 300, 380, "rgba(170,60,255,.55)", "rgba(60,20,140,.25)"], [-320, 60, 160, 300, "rgba(40,140,255,.45)", "rgba(20,40,120,.2)"], [80, -40, -380, 340, "rgba(255,60,160,.35)", "rgba(90,20,90,.18)"]]) {
    const p = new THREE.Mesh(new THREE.PlaneGeometry(s, s), new THREE.MeshBasicMaterial({ map: glowTex(c1, c2), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false })); p.position.set(x, y, z); p.lookAt(0, 0, 0); root.add(p); }
  // ringed planet + moon
  const planet = new THREE.Mesh(new THREE.SphereGeometry(80, 48, 32), new THREE.ShaderMaterial({ fog: false, uniforms: { uL: { value: new THREE.Vector3(1, 0.4, 0.6).normalize() } },
    vertexShader: "varying vec3 vN; varying vec3 vP; void main(){ vN = normalize(mat3(modelMatrix) * normal); vP = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }",
    fragmentShader: "uniform vec3 uL; varying vec3 vN; varying vec3 vP; void main(){ float b = sin(vP.y * 0.22 + sin(vP.x * 0.05) * 2.0) * 0.5 + 0.5; vec3 c = mix(vec3(0.85, 0.45, 0.25), vec3(0.95, 0.8, 0.55), b); float l = max(dot(vN, uL), 0.0); gl_FragColor = vec4(c * (0.06 + 1.1 * l) + vec3(0.3, 0.4, 1.0) * pow(1.0 - abs(vN.z), 4.0) * 0.4, 1.); }" }));
  planet.position.set(-250, 110, -320); root.add(planet);
  { const c = canvas(512, 8), g = c.getContext("2d"), gr = g.createLinearGradient(0, 0, 512, 0); gr.addColorStop(0, "rgba(255,220,180,0)"); gr.addColorStop(0.2, "rgba(255,220,180,.5)"); gr.addColorStop(0.5, "rgba(200,160,120,.2)"); gr.addColorStop(0.7, "rgba(255,230,200,.55)"); gr.addColorStop(1, "rgba(255,220,180,0)"); g.fillStyle = gr; g.fillRect(0, 0, 512, 8);
    const rg = new THREE.RingGeometry(105, 175, 96, 1), uv = rg.attributes.uv, p = rg.attributes.position; for (let i = 0; i < uv.count; i++) uv.setXY(i, (Math.hypot(p.getX(i), p.getY(i)) - 105) / 70, 0.5);
    const rm = new THREE.Mesh(rg, new THREE.MeshBasicMaterial({ map: ctex(c), transparent: true, side: THREE.DoubleSide, depthWrite: false, fog: false })); rm.position.copy(planet.position); rm.rotation.set(1.25, 0.3, 0.2); root.add(rm); }
  const moon = new THREE.Mesh(new THREE.SphereGeometry(18, 24, 16), new THREE.MeshStandardMaterial({ color: 0xb8bcc8, roughness: 1 })); moon.position.set(260, 150, -260); root.add(moon);
  // floating platform under the stands, with a glowing edge
  const deck = new THREE.Mesh(new THREE.CylinderGeometry(78, 60, 8, 64), new THREE.MeshStandardMaterial({ color: 0x15182a, metalness: 0.8, roughness: 0.35 })); deck.scale.z = 1.25; deck.position.y = -4.4; root.add(deck);
  const edge = new THREE.Mesh(new THREE.TorusGeometry(78, 0.45, 8, 128), new THREE.MeshBasicMaterial({ color: new THREE.Color(0.3, 2.6, 3.4) })); edge.rotation.x = Math.PI / 2; edge.scale.y = 1.25; edge.position.y = -0.4; root.add(edge);
  addStands(root, st, Q, { rows: 18, tint: 0xa8b4e0 });
  // orbital station ring + spinning inner rings
  const hull = new THREE.MeshStandardMaterial({ color: 0x9aa4b8, metalness: 0.85, roughness: 0.3, emissive: 0x1a2a55, emissiveIntensity: 0.4 });
  const station = new THREE.Group(); station.position.y = 70; station.rotation.x = 0.12; root.add(station);
  station.add(new THREE.Mesh(new THREE.TorusGeometry(150, 4.5, 12, 160), hull));
  const lightsMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(3, 2.4, 1.2) });
  for (let i = 0; i < 48; i++) { const a = (i / 48) * Math.PI * 2, b = new THREE.Mesh(new THREE.BoxGeometry(2, 0.6, 0.6), lightsMat); b.position.set(Math.cos(a) * 150, -4.6, Math.sin(a) * 150); b.rotation.y = -a; station.add(b); }
  for (let i = 0; i < 4; i++) { const a = (i / 4) * Math.PI * 2, sp = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.2, 150, 8), hull); sp.position.set(Math.cos(a) * 75, 0, Math.sin(a) * 75); sp.rotation.set(0, -a, Math.PI / 2); station.add(sp); }
  st.anim.push((t, dt) => { station.rotation.y = t * 0.02; });
  // energy pylons: four pulsing beams rising from the corners
  const beamMat = new THREE.ShaderMaterial({ uniforms: { uTime: { value: 0 } }, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
    vertexShader: "varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }",
    fragmentShader: "uniform float uTime; varying vec2 vUv; void main(){ float s = 0.5 + 0.5 * sin(vUv.y * 60.0 - uTime * 9.0); float edge = 1.0 - abs(vUv.x - 0.5) * 2.0; float fade = smoothstep(1.0, 0.6, vUv.y); gl_FragColor = vec4(vec3(0.6, 1.4, 3.0) * (0.4 + s) * edge * fade, edge * fade * 0.8); }" });
  for (const [x, z] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) { const b = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 2.4, 70, 16, 1, true), beamMat); b.position.set(x * (ARENA.hx + 16), 35, z * (ARENA.hz + 22)); root.add(b);
    const base = new THREE.Mesh(new THREE.CylinderGeometry(3.2, 4, 3, 16), hull); base.position.set(x * (ARENA.hx + 16), 1.5, z * (ARENA.hz + 22)); root.add(base); }
  st.anim.push((t) => { beamMat.uniforms.uTime.value = t; });
  centerBoard(root, st, new THREE.MeshStandardMaterial({ color: 0x0c1020, metalness: 0.8, roughness: 0.3, emissive: 0x0a4a7a, emissiveIntensity: 0.7 }), 28);
}

// ================= the theme list =================
export const ARENA_LIST = ["championship", "neon", "desert", "arctic", "galactic"];
export const THEMES = {
  championship: { id: "championship", name: "Championship Stadium", about: "The flagship: a massive indoor stadium, packed to the roof.", sound: "stadium",
    turf: { a: "#2f7a34", b: "#38893c", tint: 0.2 }, ramp: 0xffffff, wall: 0x0e1726, wallGlow: 0.55, bg: 0x05070c, fog: [0x070a12, 0.0042],
    env: {}, hemi: [0xb8c8ff, 0x1a2a18, 0.55], key: [0xfff2e0, 2.6, [18, 40, 10]], rim: [0x9fb8ff, 0.7, [-20, 25, -30]], decor: championshipDecor },
  neon: { id: "neon", name: "Neon City Arena", about: "A rainy night downtown, surrounded by glowing skyscrapers.", sound: "city",
    turf: { a: "#1f5a3a", b: "#256a44", tint: 0.32 }, turfRough: 0.42, turfEnv: 1.1, ramp: 0x9a7ac0, rampRough: 0.3, wall: 0x1a0d2a, wallGlow: 0.85, bg: 0x070310, fog: [0x1a0a2a, 0.0035],
    env: { roof: [0.04, 0.01, 0.07], standsA: [0.4, 0.05, 0.4], standsB: [0.05, 0.3, 0.45], floor: [0.03, 0.06, 0.05], ring: [1.2, 0.2, 1.0], lamp: 0xff6ae6, lampK: 5, top: 0x6a9cff, topK: 0.8 },
    hemi: [0x8a6aff, 0x1a0a20, 0.45], key: [0xd6c8ff, 1.9, [-16, 38, 14]], rim: [0xff4fd8, 1.1, [24, 18, -30]], decor: neonDecor },
  desert: { id: "desert", name: "Desert Coliseum", about: "An ancient sandstone coliseum at sunset, wind and dust in the air.", sound: "desert",
    turf: { a: "#5d7a33", b: "#68873a", tint: 0.16 }, ramp: 0xe8c08a, wall: 0x2a1a10, wallGlow: 0.45, bg: 0x4a2a16, fog: [0x9a6038, 0.0024],
    env: { roof: [0.25, 0.15, 0.3], standsA: [0.6, 0.35, 0.15], standsB: [0.7, 0.4, 0.2], floor: [0.25, 0.18, 0.08], ring: [0.4, 0.2, 0.05], lamp: 0xffb070, lampK: 3, top: 0xffa060, topK: 1.4, sun: [60, 10, -48], sunK: 9, sunColor: 0xffa050 },
    hemi: [0xffb27a, 0x5a3a1a, 0.6], key: [0xffb070, 3.0, [62, 14, -48]], rim: [0x8a6aff, 0.6, [-40, 20, 40]], decor: desertDecor },
  arctic: { id: "arctic", name: "Arctic Dome", about: "A glass dome among snowy mountains. Bright, cold and crisp.", sound: "arctic",
    turf: { a: "#3a8a5a", b: "#43986a", tint: 0.14 }, ramp: 0xdfefff, wall: 0x1a2a3a, wallGlow: 0.5, bg: 0xdcecff, fog: [0xdcecff, 0.0018],
    env: { roof: [0.55, 0.7, 0.95], standsA: [0.5, 0.6, 0.8], standsB: [0.6, 0.65, 0.8], floor: [0.75, 0.8, 0.85], ring: [0.3, 0.6, 0.9], lamp: 0xffffff, lampK: 4, top: 0xeaf4ff, topK: 2.5 },
    hemi: [0xe6f2ff, 0xffffff, 0.95], key: [0xffffff, 2.3, [-20, 50, 30]], rim: [0x9fd0ff, 0.8, [30, 20, -30]], decor: arcticDecor },
  galactic: { id: "galactic", name: "Galactic Arena", about: "A floating arena in deep space, under a ringed planet.", sound: "space",
    turf: { a: "#1c5f6a", b: "#226e78", tint: 0.28 }, turfRough: 0.7, ramp: 0x8aa0ff, wall: 0x0a0a20, wallGlow: 1.0, bg: 0x02010a, fog: [0x05030f, 0.0012],
    env: { roof: [0.02, 0.01, 0.06], standsA: [0.15, 0.05, 0.4], standsB: [0.05, 0.25, 0.4], floor: [0.02, 0.05, 0.08], ring: [0.3, 0.9, 1.4], lamp: 0x9fd8ff, lampK: 5, top: 0xc8a0ff, topK: 1 },
    hemi: [0x8a7aff, 0x0a1030, 0.5], key: [0xe8f0ff, 2.3, [-30, 40, 20]], rim: [0xff5ad0, 0.9, [30, 15, -30]], decor: galacticDecor },
};
