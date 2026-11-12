// Hero Clash — drawing: scene, camera, fighters, projectiles, particles.
// Reads the Match state every frame; never changes it.
import * as THREE from "../lib/three.module.min.js";
import { buildFighter } from "./models.js";
import { targetPose, applyPose, secondary, mix, POSE, STANCE, VICTORY, guard } from "./anim.js";
import { buildArena } from "./arenas.js";
import { STAGE } from "./combat.js";
import { cineFrame, introFrame } from "./ultimates.js";

export const EL = { power: 0xffd36a, gadget: 0xaab4dc, speed: 0xffe066, tech: 0x4ff0ff, electric: 0x9fd8ff, web: 0xf4fffb, cosmic: 0xffc04a,
  magic: 0xc58cff, ice: 0x9be8ff, beast: 0xffb347, arrow: 0x6dffa5, wind: 0xdff2ff, shadow: 0xb070ff, dark: 0xd04cff, mech: 0xff5a3a, fire: 0xff7a1a, math: 0x4fb8ff };

function canvasTex(size, draw) {
  const cv = document.createElement("canvas"); cv.width = cv.height = size; draw(cv.getContext("2d"), size);
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; return t;
}
const TEX = {};
function textures() {
  if (TEX.glow) return TEX;
  TEX.glow = canvasTex(64, (g, s) => { const r = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2); r.addColorStop(0, "rgba(255,255,255,1)"); r.addColorStop(0.25, "rgba(255,255,255,.7)"); r.addColorStop(1, "rgba(255,255,255,0)"); g.fillStyle = r; g.fillRect(0, 0, s, s); });
  TEX.ring = canvasTex(128, (g, s) => { g.strokeStyle = "#fff"; g.lineWidth = 9; g.beginPath(); g.arc(s / 2, s / 2, s / 2 - 10, 0, 7); g.stroke(); g.globalAlpha = 0.35; g.lineWidth = 18; g.stroke(); });
  TEX.star = canvasTex(128, (g, s) => { g.translate(s / 2, s / 2); g.fillStyle = "#fff"; for (let i = 0; i < 4; i++) { g.rotate(Math.PI / 4); g.beginPath(); g.moveTo(0, -s / 2 + 2); g.quadraticCurveTo(5, 0, 0, s / 2 - 2); g.quadraticCurveTo(-5, 0, 0, -s / 2 + 2); g.fill(); } });
  TEX.smoke = canvasTex(64, (g, s) => { for (let i = 0; i < 6; i++) { const x = s * (0.3 + 0.4 * ((i * 37) % 10) / 10), y = s * (0.3 + 0.4 * ((i * 53) % 10) / 10); const r = g.createRadialGradient(x, y, 0, x, y, s * 0.3); r.addColorStop(0, "rgba(255,255,255,.5)"); r.addColorStop(1, "rgba(255,255,255,0)"); g.fillStyle = r; g.fillRect(0, 0, s, s); } });
  TEX.shard = canvasTex(64, (g, s) => { g.fillStyle = "#fff"; g.beginPath(); g.moveTo(s / 2, 2); g.lineTo(s * 0.72, s / 2); g.lineTo(s / 2, s - 2); g.lineTo(s * 0.3, s / 2); g.closePath(); g.fill(); });
  TEX.bolt = canvasTex(128, (g, s) => { g.strokeStyle = "#fff"; g.lineWidth = 7; g.lineJoin = "round"; g.shadowColor = "#fff"; g.shadowBlur = 12; g.beginPath(); let x = s / 2; g.moveTo(x, 0); for (let y = 16; y <= s; y += 16) { x = s / 2 + (((y * 7919) % 50) - 25); g.lineTo(x, y); } g.stroke(); });
  TEX.shadow = canvasTex(64, (g, s) => { const r = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2); r.addColorStop(0, "rgba(0,0,0,.55)"); r.addColorStop(1, "rgba(0,0,0,0)"); g.fillStyle = r; g.fillRect(0, 0, s, s); });
  TEX.beam = canvasTex(64, (g, s) => { const r = g.createLinearGradient(0, 0, 0, s); r.addColorStop(0, "rgba(255,255,255,0)"); r.addColorStop(0.5, "rgba(255,255,255,1)"); r.addColorStop(1, "rgba(255,255,255,0)"); g.fillStyle = r; g.fillRect(0, 0, s, s); });
  TEX.sym = {};
  return TEX;
}
export function symTex(ch) {
  const T = textures();
  return T.sym[ch] || (T.sym[ch] = canvasTex(128, (g, s) => { g.font = "bold 84px Georgia, serif"; g.textAlign = "center"; g.textBaseline = "middle"; g.shadowColor = "#fff"; g.shadowBlur = 10; g.fillStyle = "#fff"; g.fillText(ch, s / 2, s / 2 + 4); }));
}

export class Stage {
  constructor(canvas, opts = {}) {
    this.canvas = canvas;
    this.q = opts.quality || "medium";
    this.reducedMotion = !!opts.reducedMotion; this.reducedFlash = !!opts.reducedFlash;
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: this.q !== "low", powerPreference: "high-performance", preserveDrawingBuffer: !!opts.preserve });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping; this.renderer.toneMappingExposure = 1.15;
    this.scale = this.q === "low" ? 0.75 : this.q === "medium" ? 1 : Math.min(window.devicePixelRatio || 1, 2);
    this.scene = new THREE.Scene();
    this.cam = new THREE.PerspectiveCamera(38, 16 / 9, 0.1, 400);
    this.camPos = new THREE.Vector3(0, 1.9, 9.5); this.camLook = new THREE.Vector3(0, 1.25, 0);
    this.hemi = new THREE.HemisphereLight(0xffffff, 0x334455, 1); this.scene.add(this.hemi);
    this.key = new THREE.DirectionalLight(0xffffff, 2); this.scene.add(this.key);
    this.rim = new THREE.DirectionalLight(0x88aaff, 1.2); this.scene.add(this.rim);
    this.fill = new THREE.DirectionalLight(0xffffff, 0.5); this.fill.position.set(0, 2, 10); this.scene.add(this.fill);
    this.rigs = [null, null]; this.pose = [{}, {}]; this.tp = {};
    this.arena = null; this.arenaId = null; this.zone = 0;
    this.time = 0; this.shake = 0; this.flash = 0; this.dark = 0; this.darkTarget = 0;
    this.projMap = new Map(); this.debug = false;
    const T = textures();
    // particles
    this.parts = []; const N = this.q === "low" ? 110 : 260;
    for (let i = 0; i < N; i++) {
      const m = new THREE.SpriteMaterial({ map: T.glow, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
      const s = new THREE.Sprite(m); s.visible = false; this.scene.add(s); this.parts.push({ s, life: 0 });
    }
    this.pi = 0;
    this.shadows = [0, 1].map(() => { const m = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 0.9), new THREE.MeshBasicMaterial({ map: T.shadow, transparent: true, depthWrite: false })); m.rotation.x = -Math.PI / 2; m.position.y = 0.012; this.scene.add(m); return m; });
    this.aura = [0, 1].map(() => { const g = new THREE.Group(); this.scene.add(g); return g; });
    this.fxGroup = new THREE.Group(); this.scene.add(this.fxGroup);   // cinematic props
    this.dbg = new THREE.Group(); this.scene.add(this.dbg);
    this.overlay = new THREE.Mesh(new THREE.PlaneGeometry(200, 80), new THREE.MeshBasicMaterial({ color: 0x000008, transparent: true, opacity: 0, depthWrite: false }));
    this.overlay.position.set(0, 10, -1.6); this.overlay.renderOrder = 1; this.scene.add(this.overlay);
    this.frameMs = 16; this.slowCount = 0;
    this.resize();
  }
  setOptions(o) { if (o.reducedMotion !== undefined) this.reducedMotion = o.reducedMotion; if (o.reducedFlash !== undefined) this.reducedFlash = o.reducedFlash; }
  resize() {
    const w = this.canvas.clientWidth || 960, h = this.canvas.clientHeight || 540;
    this.renderer.setPixelRatio(this.scale); this.renderer.setSize(w, h, false);
    this.cam.aspect = w / h; this.cam.fov = w / h < 1.2 ? 52 : 38; this.cam.updateProjectionMatrix();
  }

  setArena(id, zone = 0) {
    if (this.arena) { this.scene.remove(this.arena.group); this.arena.dispose(); }
    this.arenaId = id; this.zone = zone;
    const a = this.arena = buildArena(id, zone, { quality: this.q, reducedMotion: this.reducedMotion, reducedFlash: this.reducedFlash });
    this.scene.add(a.group);
    const L = a.lights;
    this.scene.background = new THREE.Color(L.sky); this.scene.fog = new THREE.Fog(L.fog[0], L.fog[1], L.fog[2]);
    this.hemi.color.set(L.ambient[0]); this.hemi.groundColor.set(L.ground); this.hemi.intensity = L.ambient[1] * 1.25;
    this.key.color.set(L.key[0]); this.key.intensity = L.key[1]; this.key.position.set(...L.key[2]);
    this.rim.color.set(L.rim[0]); this.rim.intensity = L.rim[1] * 1.3; this.rim.position.set(...L.rim[2]);
    this.baseLight = { hemi: this.hemi.intensity, key: this.key.intensity };
  }
  setFighter(i, def, costume = 0) {
    if (this.rigs[i]) { this.scene.remove(this.rigs[i].root); this.rigs[i].dispose(); }
    if (!def) { this.rigs[i] = null; this.shadows[i].visible = false; return; }
    const r = this.rigs[i] = buildFighter(def, costume); r.def = def;
    this.scene.add(r.root); this.shadows[i].visible = true;
    mix(STANCE[def.anim.stance] || guard, guard, 0, this.pose[i]);
    while (this.aura[i].children.length) this.aura[i].remove(this.aura[i].children[0]);
    r.fx = {};
  }
  clearFx() {
    for (const p of this.parts) { p.life = 0; p.s.visible = false; }
    for (const [, g] of this.projMap) this.scene.remove(g); this.projMap.clear();
    while (this.fxGroup.children.length) this.fxGroup.remove(this.fxGroup.children[0]);
    this.dark = this.darkTarget = 0; this.shake = 0; this.flash = 0; this.cineState = null;
  }

  // ---------- particles ----------
  emit(o) {
    const n = Math.max(1, Math.round((o.n || 1) * (this.q === "low" ? 0.5 : 1)));
    const T = textures();
    for (let i = 0; i < n; i++) {
      const p = this.parts[this.pi = (this.pi + 1) % this.parts.length];
      const a = Math.random() * Math.PI * 2, sp = (o.speed || 0) * (0.4 + Math.random() * 0.6);
      p.life = p.max = (o.life || 20) * (0.7 + Math.random() * 0.6);
      p.x = o.x + (Math.random() - 0.5) * (o.spread || 0); p.y = o.y + (Math.random() - 0.5) * (o.spreadY === undefined ? (o.spread || 0) : o.spreadY); p.z = (o.z || 0.3) + (Math.random() - 0.5) * (o.spread || 0) * 0.5;
      p.vx = Math.cos(a) * sp + (o.vx || 0); p.vy = Math.sin(a) * sp * (o.flat ? 0.2 : 1) + (o.vy || 0); p.vz = (Math.random() - 0.5) * sp * 0.5;
      p.g = o.g || 0; p.s0 = (o.size || 0.3) * (0.7 + Math.random() * 0.6); p.s1 = o.grow === undefined ? 0.2 : o.grow; p.drag = o.drag || 0.94;
      p.sx = o.sx || 1; p.rot = o.rot ? (Math.random() - 0.5) * o.rot : 0;
      const m = p.s.material; m.map = o.tex ? (typeof o.tex === "string" ? T[o.tex] : o.tex) : T.glow; m.color.set(o.color === undefined ? 0xffffff : o.color);
      m.blending = o.solid ? THREE.NormalBlending : THREE.AdditiveBlending; m.rotation = Math.random() * 6.28 * (o.spin === false ? 0 : 1); p.op = o.opacity || 1;
      p.s.visible = true;
    }
  }
  _parts() {
    for (const p of this.parts) {
      if (p.life <= 0) continue;
      p.life--; if (p.life <= 0) { p.s.visible = false; continue; }
      p.vy -= p.g; p.vx *= p.drag; p.vy *= p.drag; p.x += p.vx; p.y += p.vy; p.z += p.vz;
      const u = 1 - p.life / p.max, s = p.s0 * (1 + (p.s1 - 1) * u);
      p.s.position.set(p.x, p.y, p.z); p.s.scale.set(s * p.sx, s, 1); p.s.material.opacity = p.op * (1 - u * u); p.s.material.rotation += p.rot;
    }
  }
  burst(x, y, color, str = 1) {
    this.emit({ x, y, n: 6 + str * 5, color, speed: 0.07 + str * 0.035, life: 16 + str * 4, size: 0.16 + str * 0.05, g: 0.004 });
    this.emit({ x, y, n: 1, color: 0xffffff, tex: "star", size: 0.7 + str * 0.5, life: 9, grow: 1.6, spin: true });
    this.emit({ x, y, n: 1, color, tex: "ring", size: 0.3, life: 14, grow: 4 + str * 2 });
  }

  // ---------- events from the match ----------
  onEvents(events, match) {
    for (const e of events) {
      const f = e.who !== undefined ? match.f[e.who] : null;
      const col = f ? (EL[e.el || f.def.el] || 0xffffff) : 0xffffff;
      switch (e.type) {
        case "hit": this.burst(e.x, e.y, col, e.str); this.shake = Math.max(this.shake, e.str === 2 ? 0.16 : e.str === 1 ? 0.09 : 0.03); if (e.str === 2) this.flash = Math.max(this.flash, 0.22); break;
        case "block": this.emit({ x: e.x, y: e.y, n: 1, color: 0x9fd0ff, tex: "ring", size: 0.4, life: 10, grow: 3 }); this.emit({ x: e.x, y: e.y, n: 4, color: 0xcfe8ff, speed: 0.06, life: 10, size: 0.12 }); break;
        case "parry": case "counter": this.emit({ x: e.x, y: e.y, n: 1, color: 0xffffff, tex: "star", size: 1.6, life: 16, grow: 2 }); this.emit({ x: e.x, y: e.y, n: 2, color: 0xfff0a0, tex: "ring", size: 0.4, life: 18, grow: 6 }); this.flash = Math.max(this.flash, 0.3); break;
        case "guardBreak": case "breaker": this.emit({ x: e.x, y: e.y, n: 3, color: e.type === "breaker" ? 0x7dffb0 : 0xff8a5a, tex: "ring", size: 0.5, life: 22, grow: 8 }); this.shake = 0.14; break;
        case "absorb": this.emit({ x: e.x, y: e.y, n: 8, color: col, tex: "shard", speed: 0.09, life: 22, size: 0.2, g: 0.004 }); break;
        case "throw": this.burst(e.x, e.y, col, 2); this.shake = 0.14; break;
        case "tech": this.emit({ x: e.x, y: e.y, n: 2, color: 0xffffff, tex: "ring", size: 0.4, life: 14, grow: 5 }); break;
        case "jump": this.emit({ x: f.x, y: 0.08, n: 4, color: 0xcccccc, tex: "smoke", size: 0.4, life: 18, speed: 0.03, flat: true, solid: true, opacity: 0.5 }); break;
        case "land": case "knockdown": this.emit({ x: e.x === undefined ? f.x : e.x, y: 0.08, n: e.type === "land" ? 4 : 9, color: 0xcccccc, tex: "smoke", size: 0.5, life: 22, speed: 0.05, flat: true, solid: true, opacity: 0.5 }); if (e.type === "knockdown") this.shake = Math.max(this.shake, 0.06); break;
        case "dash": case "dodge": this.emit({ x: f.x, y: f.y + 0.9, n: 6, color: col, size: 0.5, life: 12, sx: 3, spread: 0.3, spreadY: 1.2, spin: false }); break;
        case "tele": this.emit({ x: e.x, y: e.y, n: 10, color: col, tex: "smoke", size: 0.9, life: 26, speed: 0.04, spread: 0.5 }); break;
        case "move": if (e.tier >= 3) this.emit({ x: f.x + f.facing * 0.3, y: f.y + 1.2, n: 8, color: col, speed: 0.05, life: 18, size: 0.22, spread: 0.5 }); break;
        case "charge": this.emit({ x: f.x, y: f.y + 1.1, n: 2, color: col, tex: "ring", size: 2.2, life: 14, grow: 0.2 }); break;
        case "buff": this.emit({ x: f.x, y: f.y + 1, n: 14, color: col, speed: 0.02, vy: 0.05, life: 30, size: 0.2, spread: 0.9 }); this.emit({ x: f.x, y: f.y + 1, n: 1, color: col, tex: "ring", size: 0.5, life: 20, grow: 5 }); break;
        case "freeze": this.emit({ x: f.x, y: f.y + 1, n: 10, color: 0xbfefff, tex: "shard", speed: 0.05, life: 26, size: 0.22 }); break;
        case "clash": this.burst(e.x, e.y, 0xffffff, 1); break;
        case "meterFull": this.emit({ x: f.x, y: f.y + 1, n: 2, color: col, tex: "ring", size: 0.4, life: 26, grow: 7 }); break;
        case "ko": this.flash = 0.6; this.shake = 0.2; break;
        case "ultStart": this.darkTarget = 0.6; this.emit({ x: f.x, y: f.y + 1.1, n: 3, color: col, tex: "ring", size: 3.5, life: 30, grow: 0.1 }); this.emit({ x: f.x, y: f.y + 1.1, n: 1, color: 0xffffff, tex: "star", size: 2.2, life: 26, grow: 1.5 }); break;
        case "cineStart": this.cineState = { seed: 0 }; break;
        case "cineBeat": this.burst(e.x, e.y, col, 2); this.shake = e.last ? 0.3 : 0.14; if (e.last) this.flash = 0.7; break;
        case "cineEnd": this.darkTarget = 0; this.cineState = null; while (this.fxGroup.children.length) this.fxGroup.remove(this.fxGroup.children[0]); break;
        case "transStart": this.flash = 0.5; this.shake = 0.25; break;
        case "zone": this.setArena(this.arenaId, e.zone); this.flash = 0.8; break;
      }
    }
    if (!match.cine && match.freeze === 0 && this.darkTarget > 0 && match.phase === "fight") {
      const anyUlt = match.f.some((f) => f.state === "atk" && f.move && f.move.tier === 4);
      if (!anyUlt) this.darkTarget = 0;
    }
  }

  // ---------- per-frame drawing ----------
  draw(match, dt) {
    this.time += dt; const time = this.time;
    if (this.arena) this.arena.update(time, dt);
    const F = match ? match.f : [];
    for (let i = 0; i < 2; i++) {
      const rig = this.rigs[i], f = F[i]; if (!rig || !f) continue;
      const tp = this.tp;
      let rate = targetPose(f, rig.def, time, tp);
      let x = f.x, y = f.y, face = f.facing, vis = true;
      if (match.cine) { const c = cineFrame(this, match, i, tp); if (c) { x = c.x; y = c.y; face = c.face; rate = 0.5; vis = c.vis !== false; } }
      else if (match.trans) { const c = this._transFrame(match, i, tp); x = c.x; y = c.y; rate = 0.5; }
      else if (match.phase === "intro") { const c = introFrame(this, match, i, tp); if (c) { x = c.x; y = c.y; vis = c.vis !== false; rate = 0.4; } }
      if (rate > 0) mix(this.pose[i], tp, this.reducedMotion ? Math.max(rate, 0.5) : rate, this.pose[i]);
      applyPose(rig, this.pose[i]);
      rig.root.position.set(x, y, 0); rig.joints.flip.scale.x = face; rig.root.visible = vis;
      secondary(rig, time, Math.abs(f.vx), !f.grounded);
      this.shadows[i].position.x = x; this.shadows[i].visible = vis; const sh = Math.max(0.3, 1 - y * 0.25); this.shadows[i].scale.set(sh, sh, 1);
      this._fighterFx(i, f, rig, match);
    }
    if (match) this._projs(match);
    this._parts();
    this._camera(match, dt);
    this.dark += (this.darkTarget - this.dark) * 0.15;
    this.overlay.material.opacity = this.dark * 0.8; this.overlay.position.x = this.camLook.x;
    this.hemi.intensity = this.baseLight ? this.baseLight.hemi * (1 - this.dark * 0.3) : 1;
    if (this.debug && match) this._debug(match); else if (this.dbg.children.length) this._clearDbg();
    this.renderer.render(this.scene, this.cam);
    if (this.flash > 0) this.flash = Math.max(0, this.flash - 0.05);
  }
  flashAmount() { return this.reducedFlash ? Math.min(this.flash, 0.15) : this.flash; }

  _fighterFx(i, f, rig, match) {
    const fx = rig.fx, g = this.aura[i], col = EL[f.def.el];
    const want = (key, on, make) => { if (on && !fx[key]) { fx[key] = make(); g.add(fx[key]); } if (fx[key]) fx[key].visible = !!on; return fx[key]; };
    g.position.set(rig.root.position.x, rig.root.position.y, 0);
    const ice = want("ice", f.state === "frozen", () => new THREE.Mesh(new THREE.BoxGeometry(1, 2.05, 0.9), new THREE.MeshStandardMaterial({ color: 0xbfefff, transparent: true, opacity: 0.5, roughness: 0.1, metalness: 0.2, emissive: 0x3a7fa8, emissiveIntensity: 0.4 })));
    if (ice) ice.position.y = 1.0;
    const sh = want("shield", f.shield > 0, () => new THREE.Mesh(new THREE.IcosahedronGeometry(1.15, 1), new THREE.MeshBasicMaterial({ color: col, wireframe: true, transparent: true, opacity: 0.5 })));
    if (sh) { sh.position.y = 1.0; sh.rotation.y = this.time * 1.5; sh.material.opacity = f.shield < 40 ? 0.2 + 0.3 * Math.abs(Math.sin(this.time * 12)) : 0.5; }
    const m = f.move, beamOn = f.state === "atk" && m && m.beam && f.mt >= m.s && f.mt < m.s + m.a && !match.cine;
    const beam = want("beam", beamOn, () => { const b = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: textures().beam, color: col, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide })); return b; });
    if (beam && beamOn) { const w = m.box[2]; beam.scale.set(w, 0.5 + Math.sin(this.time * 40) * 0.12, 1); beam.position.set(f.facing * (m.box[0] + w / 2), m.box[1] + m.box[3] / 2, 0.2); if (Math.random() < 0.5) this.emit({ x: f.x + f.facing * (m.box[0] + Math.random() * w), y: f.y + m.box[1] + 0.2, n: 1, color: col, speed: 0.03, life: 12, size: 0.2 }); }
    if (f.buffT > 0 && Math.random() < 0.4) this.emit({ x: f.x - f.facing * 0.2, y: f.y + 0.3 + Math.random() * 1.4, n: 1, color: col, size: 0.35, life: 10, sx: 3, vx: -f.vx * 0.5, spin: false });
    if (f.charged && Math.random() < 0.6) this.emit({ x: f.x, y: f.y + 1.2, n: 1, color: col, speed: 0.04, life: 12, size: 0.25, spread: 0.6 });
    if (f.meter >= 100 && Math.random() < 0.12 && !match.cine) this.emit({ x: f.x, y: f.y + 0.1, n: 1, color: col, vy: 0.04, life: 30, size: 0.14, spread: 0.7, spreadY: 0 });
    if (f.state === "atk" && m && m.tier >= 2 && f.mt >= m.s && f.mt < m.s + m.a && m.box && !m.beam && Math.random() < 0.7) this.emit({ x: f.x + f.facing * (m.box[0] + m.box[2] * 0.8), y: f.y + m.box[1] + m.box[3] / 2, n: 1, color: col, size: 0.3 + (m.tier - 2) * 0.2, life: 8, sx: 2.2, spin: false });
    if (f.state === "stagger" && Math.random() < 0.15) this.emit({ x: f.x, y: f.y + f.def.height + 0.15, n: 1, color: 0xfff0a0, tex: "star", size: 0.25, life: 20, speed: 0.02 });
    if (rig.look.extras.includes("embers") && Math.random() < 0.3) this.emit({ x: f.x, y: f.y + 1.2, n: 1, color: col, vy: 0.03, life: 24, size: 0.1, spread: 0.6 });
    rig.root.traverse === undefined;
    const ghost = f.state === "dodge" && f.st >= 3 && f.st <= 17;
    if (rig.ghost !== ghost) { rig.ghost = ghost; for (const mt of rig.mats) { if (mt.isSpriteMaterial || mt.map) continue; mt.transparent = ghost || mt.userData.t0 === true; if (mt.userData.o0 === undefined) { mt.userData.o0 = mt.opacity; } mt.opacity = ghost ? 0.4 : mt.userData.o0; mt.needsUpdate = true; } }
  }

  _projs(match) {
    const seen = new Set(), T = textures();
    for (const p of match.projs) {
      seen.add(p);
      let g = this.projMap.get(p);
      const col = EL[p.el] || 0xffffff;
      if (!g) {
        g = new THREE.Group(); this.projMap.set(p, g); this.scene.add(g);
        const spr = (tex, c, sx, sy, add = true) => { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, color: c, transparent: true, depthWrite: false, blending: add ? THREE.AdditiveBlending : THREE.NormalBlending })); s.scale.set(sx, sy, 1); g.add(s); return s; };
        const core = (geo, c, basic = true) => { const m = new THREE.Mesh(geo, basic ? new THREE.MeshBasicMaterial({ color: c }) : new THREE.MeshStandardMaterial({ color: c, roughness: 0.4, metalness: 0.5 })); g.add(m); return m; };
        switch (p.shape) {
          case "disc": case "star": g.userData.spin = core(new THREE.CylinderGeometry(0.13, 0.13, 0.03, p.shape === "star" ? 4 : 10), 0xd8dcec, false); g.userData.spin.rotation.x = Math.PI / 2; spr(T.glow, col, 0.5, 0.5); break;
          case "arrow": { const s = core(new THREE.CylinderGeometry(0.012, 0.012, 0.7, 5), 0xe8e0c0); s.rotation.z = Math.PI / 2; const h = core(new THREE.ConeGeometry(0.045, 0.14, 6), col); h.rotation.z = -Math.PI / 2 * p.dir; h.position.x = 0.38 * p.dir; spr(T.glow, col, p.strong ? 1.1 : 0.6, 0.35); g.userData.aim = true; break; }
          case "rocket": case "flask": { const s = core(p.shape === "flask" ? new THREE.SphereGeometry(0.13, 10, 8) : new THREE.CapsuleGeometry(0.06, 0.22, 2, 8), p.shape === "flask" ? col : 0xcfd4dc, p.shape === "flask"); s.rotation.z = Math.PI / 2; spr(T.glow, p.shape === "flask" ? 0x7dffb0 : 0xffa040, 0.6, 0.6); g.userData.aim = true; g.userData.trail = p.shape === "flask" ? 0xff8ad0 : 0xff9a40; break; }
          case "hook": { const s = core(new THREE.ConeGeometry(0.07, 0.2, 5), 0xd8dcec, false); s.rotation.z = -Math.PI / 2 * p.dir; const line = new THREE.Mesh(new THREE.PlaneGeometry(1, 0.025), new THREE.MeshBasicMaterial({ color: col, side: THREE.DoubleSide })); g.add(line); g.userData.line = line; break; }
          case "wave": spr(T.ring, col, p.w * 1.2, p.h * 1.3).material.rotation = 0; spr(T.glow, col, p.w * 2, p.h * 1.2); g.userData.trail = col; break;
          case "pillar": case "crush": case "portal": case "spike": {
            const warn = new THREE.Mesh(new THREE.RingGeometry(0.3, 0.45, 24), new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.8, side: THREE.DoubleSide, depthWrite: false })); warn.rotation.x = -Math.PI / 2; g.add(warn); g.userData.warn = warn;
            let col2;
            if (p.shape === "spike") { col2 = new THREE.Mesh(new THREE.ConeGeometry(0.4, 1.9, 5), new THREE.MeshStandardMaterial({ color: 0xcff4ff, transparent: true, opacity: 0.85, roughness: 0.1, emissive: 0x3a8fb8, emissiveIntensity: 0.5 })); }
            else { col2 = new THREE.Sprite(new THREE.SpriteMaterial({ map: p.shape === "pillar" ? T.bolt : T.beam, color: col, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, rotation: p.shape === "pillar" ? 0 : Math.PI / 2 })); col2.scale.set(p.shape === "pillar" ? 1.6 : 7, p.shape === "pillar" ? 7 : 1.3, 1); }
            g.add(col2); g.userData.col = col2; break;
          }
          case "tornado": { g.userData.rings = []; for (let i = 0; i < 6; i++) { const r = new THREE.Mesh(new THREE.TorusGeometry(0.2 + i * 0.09, 0.035, 5, 16), new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.55 })); r.rotation.x = Math.PI / 2; r.position.y = -0.9 + i * 0.36; g.add(r); g.userData.rings.push(r); } break; }
          case "gust": spr(T.smoke, col, p.w * 1.6, p.h * 1.3); g.userData.trail = col; break;
          case "web": spr(T.star, col, 0.8, 0.8); spr(T.ring, col, 0.5, 0.5); break;
          case "shard": { const s = core(new THREE.ConeGeometry(0.1, 0.5, 4), 0xcff4ff); s.rotation.z = -Math.PI / 2 * p.dir; spr(T.glow, col, 0.8, 0.5); g.userData.trail = col; break; }
          case "sym": { const s = spr(symTex(p.sym || "x"), col, 0.6, 0.6); s.material.blending = THREE.NormalBlending; spr(T.glow, col, 0.7, 0.7); break; }
          case "fire": spr(T.glow, 0xffe08a, 0.45, 0.45); spr(T.glow, col, 1.0, 0.8); g.userData.trail = col; break;
          case "bolt": spr(T.beam, col, 1.3, 0.45); spr(T.glow, 0xffffff, 0.4, 0.4); break;
          default: core(new THREE.SphereGeometry(Math.min(p.w, p.h) * 0.32, 12, 10), 0xffffff); spr(T.glow, col, p.w * 2.2, p.h * 2.2); g.userData.trail = col;
        }
      }
      const u = g.userData;
      g.position.set(p.x, p.y, 0.15);
      if (u.spin) u.spin.rotation.z += 0.5;
      if (u.aim) g.rotation.z = Math.atan2(p.vy, Math.abs(p.vx)) * p.dir;
      if (u.line) { const o = match.f[p.owner], x0 = o.x + o.facing * 0.5, len = Math.abs(p.x - x0); u.line.scale.x = len; u.line.position.x = -(p.x - x0) / 2; }
      if (u.trail !== undefined && Math.random() < 0.7) this.emit({ x: p.x, y: p.y, n: 1, color: u.trail, size: 0.3, life: 12, speed: 0.01 });
      if (u.rings) u.rings.forEach((r, i) => { r.position.x = Math.sin(this.time * 9 + i) * 0.1; r.rotation.z = this.time * 7; });
      if (u.warn) {
        const armed = p.arm <= 0;
        g.position.y = 0; u.warn.position.y = 0.03; u.warn.scale.setScalar(armed ? 1.6 : 1 + (p.arm % 8) / 8); u.warn.material.opacity = armed ? 0.3 : 0.9;
        u.col.visible = armed;
        if (armed) { if (p.shape === "spike") { u.col.position.y = Math.min(0.95, p.age * 0.0 + (30 - p.life) * 0.25); } else { u.col.position.y = p.shape === "portal" ? 1.2 : 3.4; if (p.shape === "portal") { u.col.material.rotation = Math.PI / 2; u.col.scale.set(2.6, 1.4, 1); } } if (!u.fired) { u.fired = true; this.emit({ x: p.x, y: 0.2, n: 10, color: col, speed: 0.08, life: 18, size: 0.25 }); if (p.shape === "pillar" && !this.reducedFlash) this.flash = Math.max(this.flash, 0.3); } }
      }
    }
    for (const [p, g] of this.projMap) if (!seen.has(p)) {
      if (p.shape !== "pillar" && p.shape !== "portal" && p.shape !== "spike" && p.shape !== "crush") this.emit({ x: p.x, y: p.y, n: p.boom ? 14 : 5, color: EL[p.el] || 0xffffff, speed: p.boom ? 0.12 : 0.05, life: 16, size: p.boom ? 0.4 : 0.2 });
      this.scene.remove(g); this.projMap.delete(p);
    }
  }

  _transFrame(match, i, tp) {
    const t = match.trans, u = t.t / t.len, f = match.f[i], isAtt = i === t.att, dir = t.dir;
    const half = u < 0.5, k = half ? u * 2 : (u - 0.5) * 2;
    let x, y = 0;
    if (!isAtt) {
      if (half) { x = f.x + dir * k * 6; y = 0.6 + Math.sin(k * 3.1) * 0.8; mix(POSE.air, POSE.air, 0, tp); tp.pitch = -1.2 - k * 5; tp.up = 0.3; }
      else { x = f.x - dir * (1 - k) * 5.5; y = Math.max(0, (1 - k * 1.6)) * 2.2; if (k < 0.62) { mix(POSE.air, POSE.air, 0, tp); tp.pitch = -1.2 - k * 6; tp.up = 0.3; } else mix(POSE.lying, POSE.lying, 0, tp); }
      if (Math.random() < 0.8 && (half ? k > 0.25 : k < 0.5)) this.emit({ x, y: y + 0.8, n: 2, color: this.arenaDebris || 0xd8c8a8, tex: "shard", speed: 0.08, life: 30, size: 0.22, g: 0.006, solid: true });
    } else {
      if (half) { x = f.x + dir * Math.max(0, k - 0.35) * 9; mix(STANCE.guard, k < 0.3 ? POSE.dashF : POSE.dashF, 1, tp); if (k < 0.3) { tp.ra = [1.5, 0, 0]; tp.re = 0; tp.twist = 0.7; tp.lean = 0.4; } }
      else { x = f.x - dir * (1 - k) * 7; y = Math.sin(Math.min(1, k * 1.3) * 3.14) * 1.4; if (k < 0.75) mix(POSE.jump, POSE.jump, 0, tp); else mix(STANCE[f.def.anim.stance] || guard, guard, 0, tp); }
    }
    if (Math.abs(u - 0.5) < 0.02) this.shake = 0.3;
    return { x, y };
  }

  _camera(match, dt) {
    let tx = 0, ty = 1.02, dist = 6.5, cy = 1.4;
    if (match) {
      const [a, b] = match.f, ra = this.rigs[0], rb = this.rigs[1];
      const ax = ra ? ra.root.position.x : a.x, bx = rb ? rb.root.position.x : b.x, ay = ra ? ra.root.position.y : a.y, by = rb ? rb.root.position.y : b.y;
      const sep = Math.abs(ax - bx);
      tx = (ax + bx) / 2; dist = Math.max(5.7, (sep + 2.7) / (1.224 * Math.min(1, this.cam.aspect / 1.777))); dist = Math.min(dist, 15);
      const lim = Math.max(0, STAGE + 1.6 - dist * 0.612 * Math.min(1, this.cam.aspect / 1.777)); tx = Math.max(-lim, Math.min(lim, tx));
      const top = Math.max(ay, by); ty = 1.02 + Math.min(2.5, top * 0.45); cy = 1.4 + Math.min(3, top * 0.5); dist += Math.min(3, top * 0.75);
      if (match.phase === "ko" && match.roundWinner >= 0 && !this.reducedMotion) { const l = match.f[1 - match.roundWinner]; tx = tx * 0.4 + l.x * 0.6; dist = Math.max(5.2, dist - 1.2); }
      if (match.phase === "outro" && match.roundWinner >= 0) { const w = match.f[match.roundWinner]; tx = w.x; dist = 5.0; ty = 1.1; cy = 1.3; }
      if (this.camOverride) { const o = this.camOverride; tx = o.x; ty = o.y; dist = o.d; cy = o.cy === undefined ? o.y + 0.4 : o.cy; }
    }
    const k = this.reducedMotion ? 0.3 : (this.camOverride ? 0.14 : 0.1);
    this.camLook.x += (tx - this.camLook.x) * k; this.camLook.y += (ty - this.camLook.y) * k;
    this.camPos.x += (tx + (this.camOverride ? this.camOverride.ox || 0 : 0) - this.camPos.x) * k; this.camPos.y += (cy - this.camPos.y) * k; this.camPos.z += (dist - this.camPos.z) * k;
    const sh = this.reducedMotion ? 0 : this.shake;
    this.cam.position.set(this.camPos.x + (Math.random() - 0.5) * sh, this.camPos.y + (Math.random() - 0.5) * sh, this.camPos.z);
    this.cam.lookAt(this.camLook.x, this.camLook.y, 0);
    this.shake *= 0.85; if (this.shake < 0.004) this.shake = 0;
    this.camOverride = null;
  }

  // Show hit boxes (red), body boxes (green) and projectiles (yellow): Training "developer view"
  _clearDbg() { while (this.dbg.children.length) { const c = this.dbg.children.pop(); c.geometry.dispose(); } }
  _debug(match) {
    this._clearDbg();
    const add = (b, color) => { const g = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(b[0], b[1], 0.6), new THREE.Vector3(b[2], b[1], 0.6), new THREE.Vector3(b[2], b[3], 0.6), new THREE.Vector3(b[0], b[3], 0.6)]); this.dbg.add(new THREE.LineLoop(g, this._dbgMat(color))); };
    for (const f of match.f) { add(f.hurt(), 0x40ff70); const h = f.hitbox(); if (h) add(h, 0xff4040); }
    for (const p of match.projs) if (p.arm <= 0) add([p.x - p.w / 2, p.y - p.h / 2, p.x + p.w / 2, p.y + p.h / 2], 0xffe040);
  }
  _dbgMat(c) { this._dm = this._dm || {}; return this._dm[c] || (this._dm[c] = new THREE.LineBasicMaterial({ color: c, depthTest: false })); }

  // Lower the drawing resolution if the device cannot keep up (called with the real frame time)
  adapt(ms) {
    this.frameMs += (ms - this.frameMs) * 0.05;
    if (this.frameMs > 24) { if (++this.slowCount > 120 && this.scale > 0.5) { this.scale = Math.max(0.5, this.scale - 0.15); this.slowCount = 0; this.frameMs = 16; this.resize(); return true; } } else this.slowCount = 0;
    return false;
  }
}

// ---------- portraits: render each fighter once to a small picture ----------
let pStage = null;
export function portrait(def, costume = 0, size = 256, full = false) {
  if (!pStage) {
    const cv = document.createElement("canvas"); cv.width = cv.height = 256;
    const r = new THREE.WebGLRenderer({ canvas: cv, antialias: true, alpha: true, preserveDrawingBuffer: true });
    r.outputColorSpace = THREE.SRGBColorSpace; r.toneMapping = THREE.ACESFilmicToneMapping; r.toneMappingExposure = 1.2;
    const scene = new THREE.Scene();
    scene.add(new THREE.HemisphereLight(0xffffff, 0x445566, 1.3));
    const k = new THREE.DirectionalLight(0xffffff, 2.4); k.position.set(2, 3, 4); scene.add(k);
    const rim = new THREE.DirectionalLight(0x88aaff, 2.0); rim.position.set(-3, 2, -3); scene.add(rim);
    pStage = { cv, r, scene, cam: new THREE.PerspectiveCamera(30, 1, 0.1, 50), rim };
  }
  const { cv, r, scene, cam, rim } = pStage;
  if (cv.width !== size) { r.setSize(size, size, false); }
  const rig = buildFighter(def, costume);
  const pose = {}; mix(STANCE[def.anim.stance] || guard, guard, 0, pose); pose.yaw = -0.55; pose.up = 0;
  applyPose(rig, pose); secondary(rig, 1, 0, false);
  rim.color.set(EL[def.el] || 0x88aaff);
  scene.add(rig.root);
  const h = rig.height;
  if (full) { cam.position.set(0.3, h * 0.55, h * 2.35); cam.lookAt(0, h * 0.5, 0); }
  else { cam.position.set(0.25, h * 0.86, 1.75); cam.lookAt(0.02, h * 0.83, 0); }
  r.render(scene, cam);
  const out = document.createElement("canvas"); out.width = out.height = size; out.getContext("2d").drawImage(cv, 0, 0, size, size);
  scene.remove(rig.root); rig.dispose();
  return out;
}
export { VICTORY };
