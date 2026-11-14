// Turbo League — the ball model and all visual effects
// (boost flame + exhaust particles, tire smoke, skid marks, hit sparks, goal explosion, confetti, fireworks).
import * as THREE from "../lib/three.module.min.js";
import { BALL } from "./config.js";

// ---------- the ball: 12 dark pentagons + 20 light hexagons, computed per pixel ----------
export function buildBall() {
  const phi = (1 + Math.sqrt(5)) / 2, C = [];
  for (const [a, b] of [[1, phi], [1, -phi], [-1, phi], [-1, -phi]]) C.push([0, a, b], [a, b, 0], [b, 0, a]);
  for (const x of [-1, 1]) for (const y of [-1, 1]) for (const z of [-1, 1]) C.push([x, y, z]);
  for (const [a, b] of [[1 / phi, phi], [1 / phi, -phi], [-1 / phi, phi], [-1 / phi, -phi]]) C.push([0, a, b], [a, b, 0], [b, 0, a]);
  const centers = C.map(([x, y, z]) => new THREE.Vector3(x, y, z).normalize());
  const mat = new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0.35, metalness: 0.1, clearcoat: 0.6, clearcoatRoughness: 0.15 });
  mat.onBeforeCompile = (sh) => {
    sh.uniforms.uC = { value: centers }; sh.uniforms.uGlow = mat.userData.glow = { value: 0 };
    sh.vertexShader = sh.vertexShader.replace("#include <common>", "#include <common>\nvarying vec3 vOP;").replace("#include <begin_vertex>", "#include <begin_vertex>\nvOP = normalize(position);");
    sh.fragmentShader = sh.fragmentShader.replace("#include <common>", "#include <common>\nvarying vec3 vOP; uniform vec3 uC[32]; uniform float uGlow;")
      .replace("#include <color_fragment>", `#include <color_fragment>
        float d1 = -2.0, d2 = -2.0; int k1 = 0;
        for (int i = 0; i < 32; i++) { float d = dot(vOP, uC[i]); if (d > d1) { d2 = d1; d1 = d; k1 = i; } else if (d > d2) d2 = d; }
        float seam = smoothstep(0.004, 0.018, d1 - d2);
        bool pent = (k1 < 12);
        vec3 base = pent ? vec3(0.06, 0.07, 0.09) : vec3(0.86, 0.88, 0.9);
        diffuseColor.rgb = base * mix(0.25, 1.0, seam);
        float edge = pent ? smoothstep(0.05, 0.02, d1 - d2) * seam : 0.0;`)
      .replace("#include <roughnessmap_fragment>", "#include <roughnessmap_fragment>\nroughnessFactor = mix(0.85, pent ? 0.28 : 0.4, seam);")
      .replace("#include <emissivemap_fragment>", "#include <emissivemap_fragment>\ntotalEmissiveRadiance += vec3(0.25, 0.75, 1.0) * edge * (1.2 + uGlow * 6.0);");
  };
  const m = new THREE.Mesh(new THREE.SphereGeometry(BALL.r, 96, 64), mat); m.castShadow = true;
  return m;
}

// ---------- particle pool (one draw call per pool) ----------
class Particles {
  constructor(scene, max, { additive = true, soft = false } = {}) {
    this.max = max; this.n = 0;
    this.p = new Float32Array(max * 3); this.v = new Float32Array(max * 3); this.c0 = new Float32Array(max * 3); this.c1 = new Float32Array(max * 3);
    this.life = new Float32Array(max); this.age = new Float32Array(max); this.size = new Float32Array(max * 2); this.drag = new Float32Array(max); this.grav = new Float32Array(max);
    const g = new THREE.BufferGeometry();
    this.aPos = new THREE.BufferAttribute(new Float32Array(max * 3), 3).setUsage(THREE.DynamicDrawUsage);
    this.aCol = new THREE.BufferAttribute(new Float32Array(max * 4), 4).setUsage(THREE.DynamicDrawUsage);
    this.aSize = new THREE.BufferAttribute(new Float32Array(max), 1).setUsage(THREE.DynamicDrawUsage);
    g.setAttribute("position", this.aPos); g.setAttribute("color", this.aCol); g.setAttribute("size", this.aSize);
    const mat = new THREE.ShaderMaterial({
      uniforms: { uScale: { value: 600 } }, transparent: true, depthWrite: false, blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending,
      vertexShader: "attribute float size; attribute vec4 color; uniform float uScale; varying vec4 vC; void main(){ vC = color; vec4 mv = modelViewMatrix * vec4(position,1.); gl_PointSize = size * uScale / max(0.1, -mv.z); gl_Position = projectionMatrix * mv; }",
      fragmentShader: `varying vec4 vC; void main(){ vec2 d = gl_PointCoord - 0.5; float r = dot(d,d) * 4.0; float a = ${soft ? "smoothstep(1.0, 0.0, r) * 0.9" : "exp(-r * 3.0)"}; gl_FragColor = vec4(vC.rgb, vC.a * a); }`,
    });
    this.mat = mat; this.points = new THREE.Points(g, mat); this.points.frustumCulled = false; this.points.renderOrder = 5; scene.add(this.points);
  }
  emit(pos, vel, { life = 1, c0 = [1, 1, 1], c1 = [0, 0, 0], s0 = 0.2, s1 = 0.05, drag = 1, grav = 0 } = {}) {
    let i = this.n < this.max ? this.n++ : (Math.random() * this.max) | 0;
    this.p.set([pos.x, pos.y, pos.z], i * 3); this.v.set([vel.x, vel.y, vel.z], i * 3);
    this.c0.set(c0, i * 3); this.c1.set(c1, i * 3); this.life[i] = life; this.age[i] = 0; this.size[i * 2] = s0; this.size[i * 2 + 1] = s1; this.drag[i] = drag; this.grav[i] = grav;
  }
  update(dt) {
    const P = this.aPos.array, Cc = this.aCol.array, S = this.aSize.array;
    for (let i = 0; i < this.n; i++) {
      this.age[i] += dt;
      if (this.age[i] >= this.life[i]) { // swap with the last one
        const j = --this.n;
        for (const [arr, k] of [[this.p, 3], [this.v, 3], [this.c0, 3], [this.c1, 3], [this.size, 2]]) for (let q = 0; q < k; q++) arr[i * k + q] = arr[j * k + q];
        this.life[i] = this.life[j]; this.age[i] = this.age[j]; this.drag[i] = this.drag[j]; this.grav[i] = this.grav[j]; i--; continue;
      }
      const d = Math.max(0, 1 - this.drag[i] * dt);
      this.v[i * 3] *= d; this.v[i * 3 + 1] = this.v[i * 3 + 1] * d - this.grav[i] * dt; this.v[i * 3 + 2] *= d;
      for (let q = 0; q < 3; q++) this.p[i * 3 + q] += this.v[i * 3 + q] * dt;
    }
    for (let i = 0; i < this.n; i++) {
      const t = this.age[i] / this.life[i];
      P[i * 3] = this.p[i * 3]; P[i * 3 + 1] = this.p[i * 3 + 1]; P[i * 3 + 2] = this.p[i * 3 + 2];
      for (let q = 0; q < 3; q++) Cc[i * 4 + q] = this.c0[i * 3 + q] + (this.c1[i * 3 + q] - this.c0[i * 3 + q]) * t;
      Cc[i * 4 + 3] = Math.min(1, (1 - t) * 1.6);
      S[i] = this.size[i * 2] + (this.size[i * 2 + 1] - this.size[i * 2]) * t;
    }
    this.points.geometry.setDrawRange(0, this.n);
    this.aPos.needsUpdate = this.aCol.needsUpdate = this.aSize.needsUpdate = true;
  }
}

// ---------- skid marks: dark ribbons that fade away ----------
class Skids {
  constructor(scene, max = 700) {
    this.max = max; this.i = 0; this.last = new Map();
    const g = new THREE.BufferGeometry();
    this.pos = new THREE.BufferAttribute(new Float32Array(max * 4 * 3), 3).setUsage(THREE.DynamicDrawUsage);
    this.birth = new THREE.BufferAttribute(new Float32Array(max * 4).fill(-999), 1).setUsage(THREE.DynamicDrawUsage);
    const idx = []; for (let k = 0; k < max; k++) idx.push(k * 4, k * 4 + 1, k * 4 + 2, k * 4 + 2, k * 4 + 1, k * 4 + 3);
    g.setAttribute("position", this.pos); g.setAttribute("birth", this.birth); g.setIndex(idx);
    this.mat = new THREE.ShaderMaterial({ uniforms: { uTime: { value: 0 } }, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2,
      vertexShader: "attribute float birth; uniform float uTime; varying float vA; void main(){ vA = clamp(1.0 - (uTime - birth) / 9.0, 0.0, 1.0) * 0.55; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.); }",
      fragmentShader: "varying float vA; void main(){ gl_FragColor = vec4(0.02, 0.02, 0.02, vA); }" });
    this.mesh = new THREE.Mesh(g, this.mat); this.mesh.frustumCulled = false; this.mesh.renderOrder = 1; scene.add(this.mesh);
  }
  add(w, p, side, n, t) { // w = wheel index 0/1, p = contact point, side = sideways vector
    const prev = this.last.get(w);
    const a = p.clone().addScaledVector(side, 0.075).addScaledVector(n, 0.02), b = p.clone().addScaledVector(side, -0.075).addScaledVector(n, 0.02);
    if (prev && prev.a.distanceTo(a) < 2) {
      const k = this.i++ % this.max, P = this.pos.array;
      P.set([prev.a.x, prev.a.y, prev.a.z, prev.b.x, prev.b.y, prev.b.z, a.x, a.y, a.z, b.x, b.y, b.z], k * 12);
      for (let q = 0; q < 4; q++) this.birth.array[k * 4 + q] = t;
      this.pos.needsUpdate = this.birth.needsUpdate = true;
    }
    this.last.set(w, { a, b });
  }
  cut(w) { this.last.delete(w); }
}

// ---------- ribbon trails (boost streaks, fast-ball streak): a strip that always faces the camera ----------
class Trail {
  constructor(scene, { max = 32, width = 0.2, color = [3, 1.4, 0.3], life = 0.38 } = {}) {
    this.max = max; this.width = width; this.life = life; this.pts = [];
    const g = new THREE.BufferGeometry();
    this.pos = new THREE.BufferAttribute(new Float32Array(max * 2 * 3), 3).setUsage(THREE.DynamicDrawUsage);
    this.alpha = new THREE.BufferAttribute(new Float32Array(max * 2), 1).setUsage(THREE.DynamicDrawUsage);
    const idx = []; for (let i = 0; i < max - 1; i++) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 2, a + 1, a + 3); }
    g.setAttribute("position", this.pos); g.setAttribute("alpha", this.alpha); g.setIndex(idx);
    this.mat = new THREE.ShaderMaterial({ uniforms: { uC: { value: new THREE.Vector3(...color) } }, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
      vertexShader: "attribute float alpha; varying float vA; void main(){ vA = alpha; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.); }",
      fragmentShader: "uniform vec3 uC; varying float vA; void main(){ gl_FragColor = vec4(uC * vA, vA); }" });
    this.mesh = new THREE.Mesh(g, this.mat); this.mesh.frustumCulled = false; this.mesh.renderOrder = 6; scene.add(this.mesh);
  }
  push(p, t) { const last = this.pts[this.pts.length - 1]; if (last && last.p.distanceToSquared(p) < 0.0004) { last.t = t; return; } this.pts.push({ p: p.clone(), t }); if (this.pts.length > this.max) this.pts.shift(); }
  update(t, camPos) {
    while (this.pts.length && t - this.pts[0].t > this.life) this.pts.shift();
    const n = this.pts.length, P = this.pos.array, A = this.alpha.array;
    const dir = new THREE.Vector3(), toCam = new THREE.Vector3(), side = new THREE.Vector3();
    for (let i = 0; i < this.max; i++) {
      if (i >= n) { A[i * 2] = A[i * 2 + 1] = 0; continue; }
      const q = this.pts[i], nb = this.pts[Math.min(n - 1, i + 1)], pb = this.pts[Math.max(0, i - 1)];
      dir.subVectors(nb.p, pb.p); toCam.subVectors(camPos, q.p); side.crossVectors(dir, toCam);
      if (side.lengthSq() < 1e-8) side.set(0, 1, 0); side.normalize();
      const k = 1 - (t - q.t) / this.life, w = this.width * (0.25 + 0.75 * k) * (i / Math.max(1, n - 1));
      P.set([q.p.x + side.x * w, q.p.y + side.y * w, q.p.z + side.z * w, q.p.x - side.x * w, q.p.y - side.y * w, q.p.z - side.z * w], i * 6);
      // fade out next to the camera, so a trail passing the lens never fills the screen
      const dc = toCam.length(), near = Math.min(1, Math.max(0, (dc - 2) / 6));
      A[i * 2] = A[i * 2 + 1] = Math.max(0, k) * (i / Math.max(1, n - 1)) * near;
    }
    this.mesh.geometry.setDrawRange(0, Math.max(0, n - 1) * 6);
    this.pos.needsUpdate = this.alpha.needsUpdate = true;
  }
  dispose() { this.mesh.parent && this.mesh.parent.remove(this.mesh); this.mesh.geometry.dispose(); this.mat.dispose(); }
}

// ---------- boost flame (attached to the car's nozzle) ----------
function flameMesh() {
  const g = new THREE.ConeGeometry(0.075, 0.6, 20, 6, true); g.translate(0, -0.3, 0); g.rotateX(-Math.PI / 2);
  const m = new THREE.ShaderMaterial({ uniforms: { uTime: { value: 0 }, uPow: { value: 0 } }, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
    vertexShader: "varying vec3 vP; uniform float uTime; uniform float uPow; void main(){ vP = position; vec3 p = position; float t = -p.z / 0.6; p.xy *= 1.0 + 0.25 * sin(uTime * 60.0 + t * 9.0) * t; p.z *= 0.35 + uPow * (0.85 + 0.15 * sin(uTime * 41.0)); gl_Position = projectionMatrix * modelViewMatrix * vec4(p,1.); }",
    fragmentShader: "varying vec3 vP; uniform float uPow; void main(){ float t = clamp(-vP.z / 0.6, 0.0, 1.0); vec3 hot = vec3(1.0, 0.95, 0.8), mid = vec3(1.0, 0.45, 0.08), cool = vec3(0.9, 0.12, 0.02); vec3 c = t < 0.3 ? mix(hot, mid, t / 0.3) : mix(mid, cool, (t - 0.3) / 0.7); gl_FragColor = vec4(c * 3.0, (1.0 - t) * uPow); }" });
  const o = new THREE.Mesh(g, m); o.renderOrder = 6; return o;
}

export class Effects {
  constructor(scene, quality) {
    this.scene = scene; this.q = quality; const pScale = quality.particles;
    this.glow = new Particles(scene, Math.round(1600 * pScale));
    this.smoke = new Particles(scene, Math.round(700 * pScale), { additive: false, soft: true });
    this.skids = new Skids(scene); this.time = 0; this.carFx = new Map();
    this.shake = 0; this.flash = 0;
    // confetti (instanced little paper squares)
    const N = Math.round(1400 * pScale); this.cfMax = N;
    const cg = new THREE.PlaneGeometry(0.22, 0.14);
    this.confetti = new THREE.InstancedMesh(cg, new THREE.MeshBasicMaterial({ side: THREE.DoubleSide }), N); this.confetti.frustumCulled = false; this.confetti.count = 0;
    this.cf = []; scene.add(this.confetti);
    this.shock = new THREE.Mesh(new THREE.SphereGeometry(1, 32, 16), new THREE.ShaderMaterial({ uniforms: { uC: { value: new THREE.Color() }, uA: { value: 0 } }, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      vertexShader: "varying vec3 vN; varying vec3 vV; void main(){ vN = normalize(normalMatrix * normal); vec4 mv = modelViewMatrix * vec4(position,1.); vV = normalize(-mv.xyz); gl_Position = projectionMatrix * mv; }",
      fragmentShader: "uniform vec3 uC; uniform float uA; varying vec3 vN; varying vec3 vV; void main(){ float f = pow(1.0 - abs(dot(vN, vV)), 2.5); gl_FragColor = vec4(uC * 3.0, f * uA); }" }));
    this.shock.visible = false; scene.add(this.shock); this.shockT = 9;
    this.ballTrail = new Trail(scene, { max: 40, width: 0.55, color: [0.9, 1.4, 2.2], life: 0.45 }); this.camPos = new THREE.Vector3(); this.ball = null;
  }
  attachCar(car, model) {
    const flame = flameMesh(); flame.position.copy(model.nozzle); model.group.add(flame);
    this.carFx.set(car, { model, flame, boostVis: 0, emitAcc: 0, smokeAcc: 0, sonicAcc: 0, trail: new Trail(this.scene, { width: 0.16 }) });
  }
  detachAll() { for (const [, fx] of this.carFx) { fx.trail.dispose(); fx.flame.parent && fx.flame.parent.remove(fx.flame); fx.flame.geometry.dispose(); fx.flame.material.dispose(); } this.carFx.clear(); this.skids.last.clear(); }
  update(dt, world, carStates) {
    this.time += dt; const t = this.time;
    if (this.pending && this.pending.length) { for (const p of this.pending) p.t -= dt; for (const p of this.pending.filter((q) => q.t <= 0)) this.firework(p.pos, p.color); this.pending = this.pending.filter((q) => q.t > 0); }
    this.skids.mat.uniforms.uTime.value = t;
    for (const [car, fx] of this.carFx) {
      const st = carStates.get(car); const g = fx.model.group;
      fx.boostVis += ((car.boosting ? 1 : 0) - fx.boostVis) * Math.min(1, dt * 18);
      fx.flame.material.uniforms.uTime.value = t; fx.flame.material.uniforms.uPow.value = fx.boostVis; fx.flame.visible = fx.boostVis > 0.02;
      const back = new THREE.Vector3(0, 0, -1).applyQuaternion(g.quaternion);
      const noz = fx.model.nozzle.clone().applyMatrix4(g.matrixWorld);
      if (car.boosting) fx.trail.push(noz.clone().addScaledVector(back, 0.15), t);
      fx.trail.update(t, this.camPos);
      if (car.boosting) {
        fx.emitAcc += dt * 140 * this.q.particles;
        while (fx.emitAcc > 1) { fx.emitAcc--; const j = () => (Math.random() - 0.5) * 1.2;
          this.glow.emit(noz.clone().addScaledVector(back, 0.25), back.clone().multiplyScalar(6 + Math.random() * 4).add(new THREE.Vector3(j(), j(), j())).add(st.vel.clone().multiplyScalar(0.6)), { life: 0.35 + Math.random() * 0.2, c0: [3, 1.4, 0.35], c1: [0.6, 0.05, 0.02], s0: 0.22, s1: 0.04, drag: 3 });
          if (Math.random() < 0.35) this.smoke.emit(noz.clone().addScaledVector(back, 0.5), back.clone().multiplyScalar(2).add(st.vel.clone().multiplyScalar(0.4)), { life: 1.0, c0: [0.35, 0.33, 0.32], c1: [0.12, 0.12, 0.13], s0: 0.25, s1: 1.1, drag: 2, grav: -0.6 });
        }
      }
      if (car.supersonic) {
        fx.sonicAcc += dt * 60 * this.q.particles;
        while (fx.sonicAcc > 1) { fx.sonicAcc--; for (const sx of [-1, 1]) { const p = new THREE.Vector3(sx * 0.45, 0.02, -0.55).applyMatrix4(g.matrixWorld); this.glow.emit(p, st.vel.clone().multiplyScalar(0.2), { life: 0.35, c0: [1.2, 1.5, 2.2], c1: [0, 0, 0], s0: 0.09, s1: 0.02, drag: 1 }); } }
      }
      // tire smoke + skid marks from the rear wheels while sliding
      const rear = [2, 3];
      rear.forEach((wi, k) => {
        const w = car.wheels[wi];
        if (car.sliding && w.contact && car.speed() > 3) {
          const p = new THREE.Vector3(w.point.x, w.point.y, w.point.z), n = new THREE.Vector3(w.normal.x, w.normal.y, w.normal.z);
          const left = new THREE.Vector3(1, 0, 0).applyQuaternion(g.quaternion);
          this.skids.add(car.id * 2 + k, p, left, n, t);
          fx.smokeAcc += dt * 30 * this.q.particles;
          while (fx.smokeAcc > 1) { fx.smokeAcc--; this.smoke.emit(p.clone().addScaledVector(n, 0.1), n.clone().multiplyScalar(0.8).add(new THREE.Vector3((Math.random() - 0.5), 0, (Math.random() - 0.5))), { life: 1.4, c0: [0.75, 0.75, 0.78], c1: [0.4, 0.4, 0.42], s0: 0.35, s1: 1.8, drag: 1.5, grav: -0.3 }); }
        } else this.skids.cut(car.id * 2 + k);
      });
    }
    this.glow.update(dt); this.smoke.update(dt);
    if (this.ball) { if (this.ball.speed > 28) this.ballTrail.push(this.ball.pos, t); this.ballTrail.update(t, this.camPos); }
    // shockwave
    this.shockT += dt;
    if (this.shockT < 1.2) { const k = this.shockT / 1.2; this.shock.visible = true; this.shock.scale.setScalar(1 + k * 22); this.shock.material.uniforms.uA.value = (1 - k) * 0.9; } else this.shock.visible = false;
    // confetti
    if (this.cf.length) {
      const M = new THREE.Matrix4(), Qn = new THREE.Quaternion(), E = new THREE.Euler(), S = new THREE.Vector3(1, 1, 1), Z0 = new THREE.Vector3(0, 0, 0);
      let n = 0;
      for (const c of this.cf) {
        c.age += dt; if (c.age > c.life) continue;
        if (c.drag && c.v.y > -1.6) { c.v.multiplyScalar(Math.max(0, 1 - 1.4 * dt)); c.v.y -= 7 * dt; } else c.v.y = Math.max(c.v.y - 4 * dt, -1.6); c.v.x += Math.sin(t * 3 + c.ph) * dt * 1.5; c.p.addScaledVector(c.v, dt);
        if (c.p.y < 0.02) { c.p.y = 0.02; c.v.set(0, 0, 0); }
        E.set(t * c.spin + c.ph, t * c.spin * 0.7, c.ph); Qn.setFromEuler(E);
        // pieces drifting right past the camera would look huge, so they are hidden
        if (n >= this.cfMax) continue; const nearCam = c.p.distanceToSquared(this.camPos) < 4;
        M.compose(c.p, Qn, nearCam ? Z0 : S); this.confetti.setMatrixAt(n, M); this.confetti.setColorAt(n, c.col); n++;
      }
      this.cf = this.cf.filter((c) => c.age <= c.life);
      this.confetti.count = n; this.confetti.instanceMatrix.needsUpdate = true; if (this.confetti.instanceColor) this.confetti.instanceColor.needsUpdate = true;
    }
    this.shake = Math.max(0, this.shake - dt * 2.2); this.flash = Math.max(0, this.flash - dt * 2.5);
  }
  hit(pos, strength) {
    const n = Math.round((8 + strength * 40) * this.q.particles);
    for (let i = 0; i < n; i++) { const v = new THREE.Vector3(Math.random() - 0.5, Math.random() - 0.3, Math.random() - 0.5).normalize().multiplyScalar(3 + Math.random() * 10 * strength);
      this.glow.emit(pos, v, { life: 0.25 + Math.random() * 0.3, c0: [2.5, 2.2, 1.6], c1: [1.2, 0.3, 0.05], s0: 0.12, s1: 0.02, drag: 4, grav: 6 }); }
    this.shake = Math.max(this.shake, strength * 0.35);
  }
  padPickup(pos, big) {
    const n = Math.round((big ? 60 : 16) * this.q.particles);
    for (let i = 0; i < n; i++) { const a = Math.random() * Math.PI * 2; this.glow.emit(new THREE.Vector3(pos.x, big ? 1 : 0.15, pos.z), new THREE.Vector3(Math.cos(a) * 3, 2 + Math.random() * 4, Math.sin(a) * 3), { life: 0.5, c0: [3, 2, 0.5], c1: [1, 0.3, 0], s0: big ? 0.25 : 0.14, s1: 0.02, drag: 3, grav: 4 }); }
  }
  // style: "classic" | "starburst" | "confetti" | "fireworks" | "galaxy" (chosen in the Garage)
  goal(pos, color, reducedFlash, style = "classic") {
    const c = new THREE.Color(color), Q = this.q.particles, gold = new THREE.Color(1, 0.82, 0.25);
    this.shock.position.copy(pos); this.shock.material.uniforms.uC.value.copy(style === "galaxy" ? new THREE.Color(0.6, 0.35, 1) : c); this.shockT = 0;
    const burst = (n, speed, opts = {}) => { for (let i = 0; i < n; i++) {
      const v = new THREE.Vector3(Math.random() - 0.5, Math.random() - 0.2, Math.random() - 0.5).normalize().multiplyScalar(speed[0] + Math.random() * speed[1]);
      const white = Math.random() < 0.25;
      this.glow.emit(pos, v, { life: 0.8 + Math.random() * 1.0, c0: white ? [3, 3, 3] : [c.r * 4, c.g * 4, c.b * 4], c1: [c.r * 0.3, c.g * 0.3, c.b * 0.3], s0: 0.35, s1: 0.05, drag: 1.4, grav: 3, ...opts }); } };
    let confetti = 900;
    if (style === "starburst") { // twelve straight spikes of light plus a bright core
      const dirs = 14, per = Math.round(40 * Q);
      for (let d = 0; d < dirs; d++) { const dir = new THREE.Vector3(Math.random() - 0.5, Math.random() * 0.8 - 0.1, Math.random() - 0.5).normalize();
        for (let i = 0; i < per; i++) { const sp = 4 + (i / per) * 30; this.glow.emit(pos, dir.clone().multiplyScalar(sp), { life: 0.9 + Math.random() * 0.3, c0: i % 3 ? [c.r * 4, c.g * 4, c.b * 4] : [3.5, 3.5, 3.2], c1: [c.r * 0.4, c.g * 0.4, c.b * 0.4], s0: 0.3, s1: 0.04, drag: 1.8, grav: 0.5 }); } }
      burst(Math.round(150 * Q), [2, 6], { c0: [4, 4, 3.6], life: 0.6 });
      confetti = 300;
    } else if (style === "confetti") { // a cannon of paper confetti straight out of the goal
      burst(Math.round(250 * Q), [5, 14]);
      const m = Math.round(1100 * Q), cols = [c, new THREE.Color(1, 1, 1), gold, new THREE.Color(0.3, 0.9, 0.5), new THREE.Color(1, 0.35, 0.6)];
      for (let i = 0; i < m; i++) { const v = new THREE.Vector3((Math.random() - 0.5) * 18, 8 + Math.random() * 16, -Math.sign(pos.z || 1) * (2 + Math.random() * 10)); this.cf.push({ p: pos.clone(), v, age: 0, life: 6 + Math.random() * 3, ph: Math.random() * 10, spin: 2 + Math.random() * 4, col: cols[i % cols.length], drag: true }); }
      confetti = 0;
    } else if (style === "fireworks") { // a smaller blast, then a volley of fireworks over the goal
      burst(Math.round(350 * Q), [5, 16]);
      if (!reducedFlash) { this.pending = this.pending || []; for (let i = 0; i < 9; i++) this.pending.push({ t: 0.25 + i * 0.22, pos: new THREE.Vector3(pos.x + (Math.random() - 0.5) * 30, 12 + Math.random() * 12, pos.z - Math.sign(pos.z || 1) * (4 + Math.random() * 10)), color: [c, gold, new THREE.Color(1, 1, 1)][i % 3] }); }
      confetti = 400;
    } else if (style === "galaxy") { // a swirling disc of purple and blue stars
      const n = Math.round(800 * Q), up = new THREE.Vector3(0, 1, 0);
      for (let i = 0; i < n; i++) { const a = Math.random() * Math.PI * 2, r = 0.3 + Math.random(), out = new THREE.Vector3(Math.cos(a), (Math.random() - 0.5) * 0.15, Math.sin(a));
        const v = out.clone().multiplyScalar(8 * r + 4).add(new THREE.Vector3().crossVectors(up, out).multiplyScalar(14 * (1.2 - r)));
        const star = Math.random() < 0.2, pal = [[1.6, 0.8, 4], [0.6, 1.4, 4], [3, 1, 3.4]][i % 3];
        this.glow.emit(pos, v, { life: 1.2 + Math.random() * 1.2, c0: star ? [4, 4, 4] : pal, c1: [0.3, 0.1, 0.6], s0: star ? 0.22 : 0.4, s1: 0.04, drag: 1.1, grav: -0.3 }); }
      burst(Math.round(120 * Q), [3, 8], { c0: [3.5, 3.5, 4] });
      confetti = 250;
    } else burst(Math.round(700 * Q), [6, 22]); // classic
    // confetti rains from above the goal end of the field
    const m = Math.round(confetti * Q), cols = [c, new THREE.Color(1, 1, 1), gold];
    for (let i = 0; i < m; i++) this.cf.push({ p: new THREE.Vector3((Math.random() - 0.5) * 50, 16 + Math.random() * 3, Math.max(-38, Math.min(38, pos.z * 0.6 + (Math.random() - 0.5) * 40))), v: new THREE.Vector3((Math.random() - 0.5) * 2, -Math.random(), (Math.random() - 0.5) * 2), age: 0, life: 7 + Math.random() * 3, ph: Math.random() * 10, spin: 2 + Math.random() * 4, col: cols[i % 3] });
    this.shake = reducedFlash ? 0.2 : 0.9; this.flash = reducedFlash ? 0 : 0.35;
  }
  firework(pos, color) {
    const c = new THREE.Color(color), n = Math.round(120 * this.q.particles);
    for (let i = 0; i < n; i++) { const v = new THREE.Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).normalize().multiplyScalar(7 + Math.random() * 2);
      this.glow.emit(pos, v, { life: 1.3 + Math.random() * 0.5, c0: [c.r * 4, c.g * 4, c.b * 4], c1: [c.r * 0.5, c.g * 0.2, 0.0], s0: 0.5, s1: 0.1, drag: 1.2, grav: 2.5 }); }
  }
}
