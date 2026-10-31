// Aegis Frontier: pooled visual effects (sparks, holographic particles, tracers, beams, rings, flashes).
import * as THREE from "../lib/three.module.min.js";

const MAXP = 700, MAXL = 160, MAXR = 16, MAXF = 24;

export class FX {
  constructor(scene) {
    this.scene = scene;
    this.scale = 1; this.reducedFlash = false;
    // particles
    const geo = new THREE.BoxGeometry(1, 1, 1);
    this.pm = new THREE.InstancedMesh(geo, new THREE.MeshBasicMaterial({ color: 0xffffff }), MAXP);
    this.pm.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.pm.frustumCulled = false;
    this.pm.count = 0;
    scene.add(this.pm);
    this.parts = [];
    // lines (tracers persist briefly; "now" lines last one frame)
    this.lpos = new Float32Array(MAXL * 6); this.lcol = new Float32Array(MAXL * 6);
    const lg = new THREE.BufferGeometry();
    lg.setAttribute("position", new THREE.BufferAttribute(this.lpos, 3).setUsage(THREE.DynamicDrawUsage));
    lg.setAttribute("color", new THREE.BufferAttribute(this.lcol, 3).setUsage(THREE.DynamicDrawUsage));
    this.lines = new THREE.LineSegments(lg, new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.95 }));
    this.lines.frustumCulled = false;
    scene.add(this.lines);
    this.tracers = []; this.nowLines = [];
    // thick beams are thin boxes
    this.beams = [];
    for (let i = 0; i < 12; i++) {
      const m = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.85, depthWrite: false }));
      m.visible = false; m.frustumCulled = false; scene.add(m); this.beams.push(m);
    }
    this.beamUsed = 0;
    // rings
    this.rings = [];
    const rg = new THREE.RingGeometry(0.92, 1, 48); rg.rotateX(-Math.PI / 2);
    for (let i = 0; i < MAXR; i++) {
      const m = new THREE.Mesh(rg, new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, side: THREE.DoubleSide, depthWrite: false }));
      m.visible = false; scene.add(m); this.rings.push({ m, life: 0 });
    }
    // flashes / glowing spheres
    this.flashes = [];
    const sg = new THREE.SphereGeometry(1, 12, 8);
    for (let i = 0; i < MAXF; i++) {
      const m = new THREE.Mesh(sg, new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, depthWrite: false }));
      m.visible = false; scene.add(m); this.flashes.push({ m, life: 0 });
    }
    this._m = new THREE.Matrix4(); this._c = new THREE.Color(); this._q = new THREE.Quaternion(); this._s = new THREE.Vector3(); this._p = new THREE.Vector3();
  }

  burst(x, y, z, color, count = 8, speed = 4, size = 0.12, life = 0.5, grav = 6, up = 0) {
    count = Math.max(1, Math.round(count * this.scale));
    const c = new THREE.Color(color);
    for (let i = 0; i < count; i++) {
      if (this.parts.length >= MAXP) this.parts.shift();
      const a = Math.random() * 6.283, b = Math.random() * 2 - 1, s = speed * (0.4 + Math.random() * 0.6), r = Math.sqrt(1 - b * b);
      this.parts.push({ x, y, z, vx: Math.cos(a) * r * s, vy: b * s + up, vz: Math.sin(a) * r * s, life, max: life, size: size * (0.6 + Math.random() * 0.8), c, g: grav, rot: Math.random() * 3 });
    }
  }
  tracer(ax, ay, az, bx, by, bz, color, life = 0.06) { this.tracers.push({ a: [ax, ay, az], b: [bx, by, bz], c: new THREE.Color(color).multiplyScalar(2), life, max: life }); }
  line(ax, ay, az, bx, by, bz, color) { this.nowLines.push({ a: [ax, ay, az], b: [bx, by, bz], c: new THREE.Color(color) }); }
  beam(ax, ay, az, bx, by, bz, color, width = 0.08) {
    if (this.beamUsed >= this.beams.length) return;
    const m = this.beams[this.beamUsed++];
    const dx = bx - ax, dy = by - ay, dz = bz - az, L = Math.hypot(dx, dy, dz);
    m.position.set((ax + bx) / 2, (ay + by) / 2, (az + bz) / 2);
    m.scale.set(width, width, L);
    m.lookAt(bx, by, bz);
    m.material.color.set(color).multiplyScalar(this.reducedFlash ? 1.4 : 2.6);   // bright enough to glow
    m.visible = true;
  }
  ring(x, y, z, color, radius, life = 0.6, vertical = false) {
    const r = this.rings.find((q) => q.life <= 0) || this.rings[0];
    r.m.position.set(x, y, z); r.m.material.color.set(color); r.m.visible = true;
    r.m.rotation.set(vertical ? Math.PI / 2 : 0, 0, 0);
    r.life = life; r.max = life; r.radius = radius;
  }
  flash(x, y, z, color, size = 1, life = 0.15) {
    const f = this.flashes.find((q) => q.life <= 0) || this.flashes[0];
    f.m.position.set(x, y, z); f.m.material.color.set(color).multiplyScalar(this.reducedFlash ? 1 : 2.2); f.m.visible = true;
    if (this.reducedFlash) size *= 0.6;
    f.life = life; f.max = life; f.size = size;
  }

  update(dt) {
    // particles
    let n = 0;
    for (let i = this.parts.length - 1; i >= 0; i--) {
      const p = this.parts[i];
      p.life -= dt;
      if (p.life <= 0) { this.parts.splice(i, 1); continue; }
      p.vy -= p.g * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt; p.rot += dt * 5;
    }
    for (const p of this.parts) {
      const s = p.size * Math.min(1, (p.life / p.max) * 2);
      this._q.setFromAxisAngle(this._p.set(0.6, 0.8, 0).normalize(), p.rot);
      this._m.compose(this._p.set(p.x, p.y, p.z), this._q, this._s.set(s, s, s));
      this.pm.setMatrixAt(n, this._m); this.pm.setColorAt(n, p.c); n++;
    }
    this.pm.count = n;
    this.pm.instanceMatrix.needsUpdate = true;
    if (this.pm.instanceColor) this.pm.instanceColor.needsUpdate = true;
    // lines
    let k = 0;
    const put = (L, fade) => {
      if (k >= MAXL) return;
      this.lpos.set(L.a, k * 6); this.lpos.set(L.b, k * 6 + 3);
      const r = L.c.r * fade, g = L.c.g * fade, b = L.c.b * fade;
      this.lcol[k * 6] = r; this.lcol[k * 6 + 1] = g; this.lcol[k * 6 + 2] = b; this.lcol[k * 6 + 3] = r; this.lcol[k * 6 + 4] = g; this.lcol[k * 6 + 5] = b;
      k++;
    };
    for (let i = this.tracers.length - 1; i >= 0; i--) {
      const t = this.tracers[i];
      t.life -= dt;
      if (t.life <= 0) { this.tracers.splice(i, 1); continue; }
      put(t, t.life / t.max);
    }
    for (const L of this.nowLines) put(L, 1);
    this.nowLines.length = 0;
    this.lines.geometry.setDrawRange(0, k * 2);
    this.lines.geometry.attributes.position.needsUpdate = true;
    this.lines.geometry.attributes.color.needsUpdate = true;
    for (const r of this.rings) {
      if (r.life <= 0) { r.m.visible = false; continue; }
      r.life -= dt;
      const t = 1 - r.life / r.max;
      const s = r.radius * (0.15 + 0.85 * t);
      r.m.scale.set(s, s, s);
      r.m.material.opacity = 0.8 * (1 - t);
    }
    for (const f of this.flashes) {
      if (f.life <= 0) { f.m.visible = false; continue; }
      f.life -= dt;
      const t = f.life / f.max;
      f.m.scale.setScalar(f.size * (1.2 - t * 0.4));
      f.m.material.opacity = t;
    }
  }
  // beams last one frame; call before adding this frame's beams
  clearBeams() { for (let i = 0; i < this.beamUsed; i++) this.beams[i].visible = false; this.beamUsed = 0; }
}
