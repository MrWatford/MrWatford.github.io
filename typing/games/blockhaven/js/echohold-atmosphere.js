// Echohold Reborn, Phase 1: the Deep's atmosphere.
// - drifting hushmoss spores, slow dust, and water drips from the ceiling (they reuse the game's pooled particles)
// - soft glow halos around nearby glowing blocks (one small batch of points, Medium/High effects only)
// Nothing here changes blocks or saved data. Effects: G.settings.fx = "low" | "medium" | "high"; Reduced Motion
// keeps the halos still and stops the drifting. Only runs in the Deep and the Echo Expanse.
// Phase 2: the far-city skyline. The new Echohold map (deep-v2) lists its buildings (meta.skyline); they are drawn as
// dark shapes with a few lit windows, but only farther away than the fog, where the real blocks are no longer drawn.
// So from the Overlook (or anywhere in the city) the whole city shows, even at a short view distance.
import { B, EMIT, COOL, CHUNK, HEIGHT } from "./blocks.js";

const SPORE = [0.32, 0.92, 0.95], SPORE_DIM = [0.16, 0.5, 0.55], DUST = [0.2, 0.22, 0.27], DRIP = [0.45, 0.62, 0.8];
const WARM = [1, 0.62, 0.28], TEAL = [0.25, 0.85, 1];
const HALO_MAX = 96, SCAN_R = 18, SCAN_UP = 10, SCAN_DOWN = 8;

function haloTexture(THREE) {
  const c = document.createElement("canvas"); c.width = c.height = 32;
  const x = c.getContext("2d"), g = x.createRadialGradient(16, 16, 0, 16, 16, 16);
  g.addColorStop(0, "rgba(255,255,255,1)"); g.addColorStop(0.3, "rgba(255,255,255,0.55)"); g.addColorStop(0.6, "rgba(255,255,255,0.16)"); g.addColorStop(1, "rgba(255,255,255,0)");
  x.fillStyle = g; x.fillRect(0, 0, 32, 32);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.NoColorSpace;
  return t;
}

const SKY_VERT = `varying vec3 vW, vN; varying float vDist;
void main() { vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; vN = normal; vec4 mv = viewMatrix * w; vDist = length(mv.xyz); gl_Position = projectionMatrix * mv; }`;
const SKY_FRAG = `uniform vec3 fogColor; uniform float cut, glow; varying vec3 vW, vN; varying float vDist;
float h(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
void main() {
  if (vDist < cut + h(floor(vW.xz * 2.0) + floor(vW.y)) * 10.0) discard;   // nearer than the fog edge: the real blocks are drawn there
  vec3 col = fogColor * (vN.y > 1.5 ? 0.72 : vN.y > 0.5 ? 0.62 : 0.4);   // floor (normal.y 2), roofs, walls
  if (vN.y < 0.5) {   // lit windows on the walls
    float along = abs(vN.x) > 0.5 ? vW.z : vW.x;
    vec2 cell = vec2(floor(along / 3.0), floor(vW.y / 4.0));
    vec2 f = vec2(fract(along / 3.0), fract(vW.y / 4.0));
    if (vN.y < -0.5) col = fogColor; else if (f.x > 0.33 && f.x < 0.67 && f.y > 0.3 && f.y < 0.62 && h(cell + floor(vW.xz / 64.0)) > 0.8) col = (h(cell * 1.7) > 0.45 ? vec3(1.0, 0.68, 0.32) : vec3(0.3, 0.88, 1.0)) * glow;
  }
  col = mix(col, fogColor, smoothstep(cut + 60.0, cut + 330.0, vDist) * 0.85);
  gl_FragColor = vec4(col, 1.0);
}`;

export function createEchoholdAtmosphere({ THREE, scene, camera, G, emitParticle, fog }) {
  // ----- the far-city skyline (deep-v2 only) -----
  const skyMat = new THREE.ShaderMaterial({ uniforms: { fogColor: { value: new THREE.Color(0) }, cut: { value: 60 }, glow: { value: 0.8 } }, vertexShader: SKY_VERT, fragmentShader: SKY_FRAG, side: THREE.DoubleSide });
  let skyMesh = null, skyFor = null;
  function buildSkyline(list, floors) {
    const pos = [], nor = [], idx = [];
    const quad = (a, b, c, d, n) => { const i = pos.length / 3; for (const p of [a, b, c, d]) { pos.push(...p); nor.push(...n); } idx.push(i, i + 1, i + 2, i, i + 2, i + 3); };
    for (const [x0, z0, x1i, z1i, y0, y1] of list) {
      const x1 = x1i + 1, z1 = z1i + 1;
      quad([x0, y1, z0], [x0, y1, z1], [x1, y1, z1], [x1, y1, z0], [0, 1, 0]);
      quad([x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1], [0, 0, 1]);
      quad([x1, y0, z0], [x0, y0, z0], [x0, y1, z0], [x1, y1, z0], [0, 0, -1]);
      quad([x1, y0, z1], [x1, y0, z0], [x1, y1, z0], [x1, y1, z1], [1, 0, 0]);
      quad([x0, y0, z0], [x0, y0, z1], [x0, y1, z1], [x0, y1, z0], [-1, 0, 0]);
    }
    for (const [cx, cz, rad, y] of floors || []) {   // the cavern floor: a flat disc (its normal.y of 2 marks it as floor)
      const c = pos.length / 3; pos.push(cx, y, cz); nor.push(0, 2, 0);
      for (let k = 0; k <= 40; k++) { const a = k / 40 * Math.PI * 2; pos.push(cx + Math.cos(a) * rad, y, cz + Math.sin(a) * rad); nor.push(0, 2, 0); if (k) idx.push(c, c + k + 1, c + k); }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute("normal", new THREE.Float32BufferAttribute(nor, 3)); g.setIndex(idx);
    g.computeBoundingSphere();
    const m = new THREE.Mesh(g, skyMat); m.frustumCulled = false; scene.add(m);
    return m;
  }
  // ----- the Echo Expanse: slow rings of floating rubble far out in the violet sky, some of it glowing (Phase 7) -----
  let debris = null;
  function buildDebris() {
    const g = new THREE.Group(), box = new THREE.BoxGeometry(1, 1, 1), rnd = (() => { let s = 7741; return () => ((s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296); })();
    const rock = new THREE.InstancedMesh(box, new THREE.MeshBasicMaterial({ color: 0x1c1c3c, fog: false }), 140), glow = new THREE.InstancedMesh(box, new THREE.MeshBasicMaterial({ color: 0x5ae0d0, fog: false }), 60);
    const m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), v = new THREE.Vector3(), sc = new THREE.Vector3();
    for (let i = 0; i < 140; i++) { const a = rnd() * Math.PI * 2, r = 120 + rnd() * 110, sz = 2 + rnd() * 9; v.set(Math.cos(a) * r, 8 + rnd() * 80, Math.sin(a) * r); e.set(rnd() * 3, rnd() * 3, rnd() * 3); q.setFromEuler(e); sc.set(sz, sz * (0.5 + rnd()), sz * (0.6 + rnd() * 0.8)); m.compose(v, q, sc); rock.setMatrixAt(i, m);
      if (i < 60) { v.y += sz * 0.7; sc.set(0.6 + rnd(), 0.6 + rnd(), 0.6 + rnd()); m.compose(v, q, sc); glow.setMatrixAt(i, m); } }
    rock.frustumCulled = glow.frustumCulled = false; g.add(rock, glow); g.renderOrder = -1; scene.add(g);
    return g;
  }
  function updateDebris(fx, dt) {
    const want = G.dim === "expanse" && fx !== "low" && G.state !== "title";
    if (!want) { if (debris) debris.visible = false; return; }
    if (!debris) debris = buildDebris();
    debris.visible = true;
    if (!G.settings.reducedMotion) debris.rotation.y += dt * 0.006;
  }
  function updateSkyline(fx) {
    const list = G.lost && G.lost.skyline && G.lost.skyline();
    const want = fx !== "low" && G.state !== "title" && list;
    if (skyMesh && (!want || skyFor !== list)) { scene.remove(skyMesh); skyMesh.geometry.dispose(); skyMesh = null; skyFor = null; }
    if (!want) return;
    if (!skyMesh) { skyMesh = buildSkyline(list, G.lost.skyFloor && G.lost.skyFloor()); skyFor = list; }
    if (fog) { skyMat.uniforms.fogColor.value.copy(fog.fogColor.value); skyMat.uniforms.cut.value = fog.fogFar.value - 4; }
    skyMat.uniforms.glow.value = fx === "high" ? 1 : 0.8;
  }
  const base = new Float32Array(HALO_MAX * 3), pos = new Float32Array(HALO_MAX * 3), col = new Float32Array(HALO_MAX * 3);
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3).setUsage(THREE.DynamicDrawUsage));
  geo.setAttribute("color", new THREE.BufferAttribute(col, 3).setUsage(THREE.DynamicDrawUsage));
  geo.setDrawRange(0, 0);
  const mat = new THREE.PointsMaterial({ size: 3.2, map: haloTexture(THREE), vertexColors: true, transparent: true, depthWrite: false,
    blending: THREE.AdditiveBlending, fog: false, opacity: 0.6 });
  const halos = new THREE.Points(geo, mat);
  halos.frustumCulled = false; halos.visible = false; halos.renderOrder = 2;
  scene.add(halos);

  let scanT = 0, sporeT = 0, dripT = 0, lastKey = "", lastEdits = -1;
  const active = () => G.state === "play" && G.world && (G.dim === "deep" || G.dim === "expanse");

  // Find glowing blocks near the player (at most HALO_MAX, nearest first). Runs about once a second, not every frame.
  function scan() {
    const w = G.world, p = G.player, px = Math.floor(p.pos.x), py = Math.floor(p.pos.y), pz = Math.floor(p.pos.z);
    const found = [];
    for (let y = Math.max(1, py - SCAN_DOWN); y <= Math.min(HEIGHT - 2, py + SCAN_UP); y++)
      for (let z = pz - SCAN_R; z <= pz + SCAN_R; z++) for (let x = px - SCAN_R; x <= px + SCAN_R; x++) {
        const id = w.get(x, y, z) & 255;
        if (EMIT[id] < 9 && !(COOL[id] && EMIT[id] >= 4)) continue;
        const dx = x - px, dy = y - py, dz = z - pz;
        found.push([dx * dx + dy * dy + dz * dz, x, y, z, id]);
      }
    found.sort((a, b) => a[0] - b[0]);
    const n = Math.min(HALO_MAX, found.length);
    for (let i = 0; i < n; i++) {
      const [, x, y, z, id] = found[i], c = COOL[id] ? TEAL : WARM, k = Math.min(1, EMIT[id] / 13);
      base[i * 3] = x + 0.5; base[i * 3 + 1] = y + 0.5; base[i * 3 + 2] = z + 0.5;
      col[i * 3] = c[0] * k; col[i * 3 + 1] = c[1] * k; col[i * 3 + 2] = c[2] * k;
    }
    geo.setDrawRange(0, n);
    geo.attributes.color.needsUpdate = true;
  }
  // Each halo sits a little in front of its block (toward the camera), so the block itself does not hide it,
  // while walls between you and the light still do.
  function face(cam) {
    const n = geo.drawRange.count;
    for (let i = 0; i < n; i++) {
      const bx = base[i * 3], by = base[i * 3 + 1], bz = base[i * 3 + 2];
      let dx = cam.x - bx, dy = cam.y - by, dz = cam.z - bz; const d = Math.hypot(dx, dy, dz) || 1, k = Math.min(0.95, d * 0.5) / d;
      pos[i * 3] = bx + dx * k; pos[i * 3 + 1] = by + dy * k; pos[i * 3 + 2] = bz + dz * k;
    }
    geo.attributes.position.needsUpdate = true;
  }

  function particles(dt, fx) {
    const p = G.player, n = fx === "high" ? 2 : 1, still = G.settings.reducedMotion;
    if ((sporeT -= dt) <= 0) {
      sporeT = fx === "high" ? 0.12 : 0.22;
      for (let i = 0; i < n; i++) {
        const x = p.pos.x + (Math.random() - 0.5) * 22, y = p.pos.y - 1 + Math.random() * 7, z = p.pos.z + (Math.random() - 0.5) * 22;
        const spore = G.dim === "expanse" || Math.random() < 0.6;
        const drift = still ? 0 : 0.12;
        emitParticle(x, y, z, (Math.random() - 0.5) * drift, still ? 0 : spore ? 0.08 : -0.03, (Math.random() - 0.5) * drift, 4 + Math.random() * 3,
          spore ? (Math.random() < 0.5 ? SPORE : SPORE_DIM) : DUST, true);
      }
    }
    // water drips: find a ceiling a little above a random nearby spot and let a drop fall from it
    if (G.dim === "deep" && !still && (dripT -= dt) <= 0) {
      dripT = fx === "high" ? 0.6 : 1.1;
      const x = Math.floor(p.pos.x + (Math.random() - 0.5) * 16), z = Math.floor(p.pos.z + (Math.random() - 0.5) * 16);
      for (let y = Math.floor(p.pos.y) + 2; y < Math.min(HEIGHT - 1, Math.floor(p.pos.y) + 14); y++) {
        const id = G.world.get(x, y, z) & 255;
        if (id && id !== B.WATER) { emitParticle(x + 0.5, y - 0.05, z + 0.5, 0, -7, 0, 1.6, DRIP, false); break; }
      }
    }
  }

  return {
    mesh: halos,
    update(dt) {
      const fx = G.settings.fx || "medium";
      updateSkyline(fx); updateDebris(fx, dt);
      if (!active()) { halos.visible = false; lastKey = ""; return; }
      if (fx !== "low") particles(dt, fx);
      halos.visible = fx !== "low";
      if (!halos.visible) return;
      const key = G.dim + ":" + Math.floor(G.player.pos.x / 4) + "," + Math.floor(G.player.pos.y / 4) + "," + Math.floor(G.player.pos.z / 4);
      const edits = G.world.editCount || 0;
      if ((scanT -= dt) <= 0 || key !== lastKey || edits !== lastEdits) {
        if (scanT <= 0 || key !== lastKey || edits !== lastEdits) { scan(); scanT = 1.2; lastKey = key; lastEdits = edits; }
      }
      face(camera.position);
      const pulse = G.settings.reducedMotion ? 0 : Math.sin((G.clock || 0) * 1.3) * 0.12;
      mat.opacity = (fx === "high" ? 0.7 : 0.55) + pulse;
    },
    // a new world or dimension: forget the old glow positions right away
    stats() { return { visible: halos.visible, halos: geo.drawRange.count, opacity: +mat.opacity.toFixed(2), skyline: skyMesh ? skyFor.length : 0 }; },
    reset() { geo.setDrawRange(0, 0); halos.visible = false; lastKey = ""; scanT = 0; },
    dispose() { scene.remove(halos); geo.dispose(); mat.map.dispose(); mat.dispose(); }
  };
}
