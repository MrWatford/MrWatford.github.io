// Turbo League — the Garage showroom: your car on a turntable, four lighting setups, drag to spin,
// scroll/pinch to zoom, an optional "show hitbox" view, and your Cup trophy on a stand if you have won it.
// It is its own small 3D scene drawn with the same renderer and picture pipeline as the game.
import * as THREE from "../lib/three.module.min.js";
import { buildCar, HITBOX } from "./car-model.js";
import { buildTrophy } from "./trophy.js";

export const LIGHTS = {
  showroom: { name: "Showroom", top: 0x1a1d24, hor: 0x2a2f3a, bot: 0x0c0d10, floor: 0x15171c, ring: [0.6, 0.85, 1.6], key: 0xffffff, keyK: 2.6, keyPos: [3, 6, 4], rimA: 0x9cc4ff, rimB: 0xffffff, rimK: 18, hemi: 0.35, lamps: [[0xffffff, 6], [0xcfe0ff, 4]], exposure: 1.05 },
  sunset: { name: "Sunset", top: 0x2a1e4a, hor: 0xff8a4a, bot: 0x1a0f14, floor: 0x2a1c1c, ring: [1.6, 0.8, 0.3], key: 0xffb070, keyK: 3.2, keyPos: [-5, 2.2, 3], rimA: 0xff7040, rimB: 0x7a6cff, rimK: 16, hemi: 0.45, lamps: [[0xffa060, 7], [0x8070ff, 3]], exposure: 1.0 },
  neon: { name: "Neon", top: 0x07060e, hor: 0x1a0c2a, bot: 0x050407, floor: 0x0b0a12, ring: [1.8, 0.2, 1.4], key: 0xbfd0ff, keyK: 1.2, keyPos: [2, 6, 3], rimA: 0xff2aa0, rimB: 0x20d8ff, rimK: 34, hemi: 0.18, lamps: [[0xff3090, 8], [0x30d0ff, 8]], exposure: 1.1 },
  studio: { name: "Studio", top: 0xd8dce4, hor: 0xc4c8d0, bot: 0x9a9ea6, floor: 0xb8bcc4, ring: [1.0, 1.0, 1.0], key: 0xffffff, keyK: 2.2, keyPos: [2, 7, 5], rimA: 0xffffff, rimB: 0xffffff, rimK: 8, hemi: 0.9, lamps: [[0xffffff, 5], [0xffffff, 5]], exposure: 0.95 },
};

function gradientDome(L) {
  return new THREE.Mesh(new THREE.SphereGeometry(30, 32, 16), new THREE.ShaderMaterial({ side: THREE.BackSide, depthWrite: false,
    uniforms: { top: { value: new THREE.Color(L.top) }, hor: { value: new THREE.Color(L.hor) }, bot: { value: new THREE.Color(L.bot) } },
    vertexShader: "varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.); }",
    fragmentShader: "uniform vec3 top, hor, bot; varying vec3 vP; void main(){ float y = vP.y; vec3 c = y > 0. ? mix(hor, top, pow(clamp(y,0.,1.), .5)) : mix(hor, bot, pow(clamp(-y,0.,1.), .3)); gl_FragColor = vec4(c, 1.); }" }));
}
function envFor(renderer, L) { // reflections: the room colours plus big soft light panels
  const s = new THREE.Scene(); s.add(gradientDome(L));
  const lamp = (col, k, w, h, x, y, z) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: new THREE.Color(col).multiplyScalar(k), side: THREE.DoubleSide })); m.position.set(x, y, z); m.lookAt(0, 0, 0); s.add(m); };
  lamp(L.lamps[0][0], L.lamps[0][1], 12, 2, 0, 12, 0); lamp(L.lamps[0][0], L.lamps[0][1] * 0.6, 3, 10, 12, 4, 6);
  lamp(L.lamps[1][0], L.lamps[1][1], 3, 10, -12, 4, -6); lamp(L.lamps[1][0], L.lamps[1][1] * 0.5, 14, 1.5, 0, 3, -14);
  const pm = new THREE.PMREMGenerator(renderer); const rt = pm.fromScene(s, 0.04); pm.dispose();
  s.traverse((o) => { if (o.geometry) o.geometry.dispose(); if (o.material) o.material.dispose(); });
  rt.texture.userData.rt = rt; return rt.texture;
}

export class Garage {
  constructor(renderer, Q) {
    this.r = renderer; this.Q = Q;
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(36, 1, 0.05, 80);
    this.yaw = 0.75; this.pitch = 0.2; this.dist = 4.4; this.spin = 0; this.idle = 9; this.light = null;
    // floor + turntable with a glowing ring
    this.floorMat = new THREE.MeshStandardMaterial({ color: 0x15171c, roughness: 0.42, metalness: 0.05 });
    const floor = new THREE.Mesh(new THREE.CircleGeometry(14, 64), this.floorMat); floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; this.scene.add(floor);
    this.table = new THREE.Group(); this.scene.add(this.table);
    const disc = new THREE.Mesh(new THREE.CylinderGeometry(1.25, 1.3, 0.06, 64), new THREE.MeshPhysicalMaterial({ color: 0x1a1c22, metalness: 0.6, roughness: 0.25, clearcoat: 1, clearcoatRoughness: 0.05 }));
    disc.position.y = 0.03; disc.receiveShadow = true; this.table.add(disc);
    this.ringMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(0.6, 0.85, 1.6) });
    const ring = new THREE.Mesh(new THREE.TorusGeometry(1.29, 0.012, 8, 96), this.ringMat); ring.rotation.x = Math.PI / 2; ring.position.y = 0.05; this.scene.add(ring);
    for (let i = 0; i < 24; i++) { const a = i / 24 * Math.PI * 2, d = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.004, 0.012), this.ringMat); d.position.set(Math.sin(a) * 1.12, 0.062, Math.cos(a) * 1.12); d.rotation.y = a; this.table.add(d); }
    // soft contact shadow under the car (works even with shadows turned off)
    const c = document.createElement("canvas"); c.width = c.height = 128; const g = c.getContext("2d"); const rg = g.createRadialGradient(64, 64, 0, 64, 64, 64); rg.addColorStop(0, "rgba(0,0,0,0.8)"); rg.addColorStop(1, "rgba(0,0,0,0)"); g.fillStyle = rg; g.fillRect(0, 0, 128, 128);
    const blob = new THREE.Mesh(new THREE.PlaneGeometry(1.3, 1.9), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(c), transparent: true, depthWrite: false })); blob.rotation.x = -Math.PI / 2; blob.position.y = 0.062; this.table.add(blob);
    // lights
    this.hemi = new THREE.HemisphereLight(0xffffff, 0x202020, 0.35); this.scene.add(this.hemi);
    this.key = new THREE.DirectionalLight(0xffffff, 2.6); this.key.position.set(3, 6, 4); this.scene.add(this.key);
    if (Q.shadows) { this.key.castShadow = true; this.key.shadow.mapSize.set(1024, 1024); const sc = this.key.shadow.camera; sc.left = sc.bottom = -2.5; sc.right = sc.top = 2.5; sc.near = 1; sc.far = 20; this.key.shadow.bias = -0.0004; this.key.shadow.normalBias = 0.02; }
    this.rimA = new THREE.PointLight(0x9cc4ff, 18, 12, 2); this.rimA.position.set(-3, 1.6, -2.5); this.scene.add(this.rimA);
    this.rimB = new THREE.PointLight(0xffffff, 18, 12, 2); this.rimB.position.set(3, 1.2, -3); this.scene.add(this.rimB);
    // hitbox view (the same box for every body)
    const hb = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(HITBOX.half[0] * 2, HITBOX.half[1] * 2, HITBOX.half[2] * 2)), new THREE.LineBasicMaterial({ color: 0x5cff8a, depthTest: false, transparent: true }));
    hb.renderOrder = 10; hb.visible = false; this.hitbox = hb;
    this.trophy = null; this.car = null; this.dome = null; this.env = null;
    this.setLight("showroom");
    this._bind();
  }
  setLight(id) {
    const L = LIGHTS[id] || LIGHTS.showroom; if (this.light === id) return; this.light = id;
    if (this.dome) { this.scene.remove(this.dome); this.dome.geometry.dispose(); this.dome.material.dispose(); }
    this.dome = gradientDome(L); this.scene.add(this.dome);
    if (this.env) this.env.userData.rt.dispose();
    this.env = envFor(this.r, L); this.scene.environment = this.env;
    this.floorMat.color.set(L.floor); this.ringMat.color.setRGB(...L.ring);
    this.key.color.set(L.key); this.key.intensity = L.keyK; this.key.position.set(...L.keyPos);
    this.rimA.color.set(L.rimA); this.rimB.color.set(L.rimB); this.rimA.intensity = this.rimB.intensity = L.rimK;
    this.hemi.intensity = L.hemi; this.exposure = L.exposure;
  }
  // build (or rebuild) the car from a garage loadout
  setCar(opts) {
    if (this.car) { this.table.remove(this.car.group); this.car.dispose(); }
    this.car = buildCar({ ...opts, detail: Math.max(0.65, this.Q.carDetail ?? 1) });
    this.car.group.position.y = 0.06 + 0.353; // wheels resting on the turntable
    this.car.group.traverse((o) => { if (o.isMesh) o.castShadow = true; });
    this.car.group.add(this.hitbox);
    this.table.add(this.car.group);
  }
  showHitbox(on) { this.hitbox.visible = !!on; }
  setTrophy(on) {
    if (on && !this.trophy) {
      const t = new THREE.Group(), ped = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.36, 0.9, 32), new THREE.MeshPhysicalMaterial({ color: 0x0c0d12, metalness: 0.5, roughness: 0.3, clearcoat: 1 }));
      ped.position.y = 0.45; ped.castShadow = ped.receiveShadow = true; t.add(ped);
      const tr = buildTrophy(); tr.scale.setScalar(0.42); tr.position.y = 0.9; t.add(tr); this.trophyMesh = tr;
      t.position.set(-0.5, 0, -3.3); this.scene.add(t); this.trophy = t;
    }
    if (this.trophy) this.trophy.visible = !!on;
  }
  resize(w, h) { this.camera.aspect = w / h; if (w / h > 1.2 && w > 760) this.camera.setViewOffset(w, h, -Math.min(0.16 * w, 220), 0, w, h); else this.camera.clearViewOffset(); this.camera.updateProjectionMatrix(); }
  frame(dt) {
    this.idle += dt;
    if (this.idle > 2.5) this.spin += dt * 0.35; // turntable turns by itself until you grab it
    this.table.rotation.y = this.spin;
    if (this.trophyMesh) this.trophyMesh.rotation.y += dt * 0.4;
    if (this.car) this.car.animate(dt, this.idle > 2.5 ? 3 : 0);
    const narrow = this.camera.aspect < 1; // phones: back off so the whole car fits
    const d = this.dist * (narrow ? 1.5 : 1), cp = Math.cos(this.pitch);
    this.camera.position.set(Math.sin(this.yaw) * cp * d, 0.45 + Math.sin(this.pitch) * d, Math.cos(this.yaw) * cp * d);
    this.camera.lookAt(0, narrow ? -0.55 : 0.42, 0);
  }
  render(post, t) {
    if (post) { const prev = post.mComp.uniforms.exposure.value; post.mComp.uniforms.exposure.value = this.exposure; post.mComp.uniforms.flash.value = 0; post.render(this.scene, this.camera, t); post.mComp.uniforms.exposure.value = prev; }
    else this.r.render(this.scene, this.camera);
  }
  // drag to turn the car, scroll or pinch to zoom
  _bind() {
    const P = new Map(); let pinch = 0;
    this.onDown = (e) => { if (!this.active) return; P.set(e.pointerId, { x: e.clientX, y: e.clientY }); this.idle = 0; };
    this.onMove = (e) => {
      if (!this.active || !P.has(e.pointerId)) return; const p = P.get(e.pointerId), dx = e.clientX - p.x, dy = e.clientY - p.y; p.x = e.clientX; p.y = e.clientY; this.idle = 0;
      if (P.size === 1) { this.spin += dx * 0.01; this.pitch = THREE.MathUtils.clamp(this.pitch + dy * 0.005, 0.02, 1.1); }
      else if (P.size === 2) { const [a, b] = [...P.values()], d = Math.hypot(a.x - b.x, a.y - b.y); if (pinch) this.zoom(pinch / d); pinch = d; }
    };
    this.onUp = (e) => { P.delete(e.pointerId); if (P.size < 2) pinch = 0; };
    this.onWheel = (e) => { if (!this.active) return; e.preventDefault(); this.zoom(Math.exp(e.deltaY * 0.001)); this.idle = 0; };
  }
  zoom(k) { this.dist = THREE.MathUtils.clamp(this.dist * k, 2.4, 7.5); }
  attach(el) { this.active = true; this.el = el; el.addEventListener("pointerdown", this.onDown); addEventListener("pointermove", this.onMove); addEventListener("pointerup", this.onUp); addEventListener("pointercancel", this.onUp); el.addEventListener("wheel", this.onWheel, { passive: false }); }
  detach() { this.active = false; const el = this.el; if (!el) return; el.removeEventListener("pointerdown", this.onDown); removeEventListener("pointermove", this.onMove); removeEventListener("pointerup", this.onUp); removeEventListener("pointercancel", this.onUp); el.removeEventListener("wheel", this.onWheel); }
}
