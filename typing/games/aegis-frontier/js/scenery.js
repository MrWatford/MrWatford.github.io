// Aegis Frontier: trees, rocks, water, birds, and the sky (with the habitat ring arching overhead).
import * as THREE from "../lib/three.module.min.js";
import { SITES, WORLD_HALF, WATER_Y } from "./content.js";
import { rng, fbm, smoothstep } from "./util.js";
import { regionAt } from "./terrain.js";
import { MeshBuilder } from "./structures.js";

const GROUP = 160; // trees are grouped in 160 m squares so far groups can be hidden

function treeGeometry() {
  const mb = new MeshBuilder(), m = new THREE.Matrix4();
  m.makeTranslation(0, 1.2, 0); mb.addGeo(new THREE.CylinderGeometry(0.28, 0.4, 2.4, 6), m, 0x6b4a32);
  m.makeTranslation(0, 3.6, 0); mb.addGeo(new THREE.ConeGeometry(2.3, 3.6, 7), m, 0xffffff);
  m.makeTranslation(0, 5.6, 0); mb.addGeo(new THREE.ConeGeometry(1.7, 3.0, 7), m, 0xffffff);
  m.makeTranslation(0, 7.3, 0); mb.addGeo(new THREE.ConeGeometry(1.0, 2.2, 7), m, 0xffffff);
  // the trunk was tinted brown; foliage white so instance colors tint only... keep trunk by darkening later
  return mb.build();
}
function shrubGeometry() {
  const mb = new MeshBuilder(), m = new THREE.Matrix4();
  m.makeTranslation(0, 0.7, 0); mb.addGeo(new THREE.IcosahedronGeometry(1.1, 0), m, 0xffffff);
  m.makeTranslation(0.7, 0.5, 0.3); mb.addGeo(new THREE.IcosahedronGeometry(0.7, 0), m, 0xffffff);
  return mb.build();
}

export class Scenery {
  constructor(scene, terrain, col) {
    this.scene = scene; this.t = terrain; this.col = col;
    this.groups = [];
    this.birds = [];
  }

  nearSite(x, z, pad = 8) {
    for (const s of SITES) {
      const r = (s.r || 10) + pad;
      if (Math.abs(x - s.x) < r && Math.abs(z - s.z) < r && Math.hypot(x - s.x, z - s.z) < r) return true;
    }
    return false;
  }

  build(density) {
    const R = rng(4242), T = this.t;
    const treeGeo = treeGeometry(), shrubGeo = shrubGeometry(), rockGeo = new THREE.DodecahedronGeometry(1, 0);
    const treeMat = new THREE.MeshLambertMaterial({ vertexColors: true });
    const rockMat = new THREE.MeshLambertMaterial({ color: 0x8a8278, flatShading: true });
    const groups = new Map();
    const getG = (x, z) => {
      const gi = Math.floor((x + WORLD_HALF) / GROUP), gj = Math.floor((z + WORLD_HALF) / GROUP), k = gi * 100 + gj;
      let g = groups.get(k);
      if (!g) groups.set(k, (g = { trees: [], shrubs: [], rocks: [], cx: -WORLD_HALF + (gi + 0.5) * GROUP, cz: -WORLD_HALF + (gj + 0.5) * GROUP }));
      return g;
    };
    const n = new THREE.Vector3();
    const tries = Math.round(26000 * density);
    for (let k = 0; k < tries; k++) {
      const x = (R() * 2 - 1) * (WORLD_HALF - 30), z = (R() * 2 - 1) * (WORLD_HALF - 30);
      const y = T.heightAt(x, z);
      if (y < 1.2) continue;
      T.normalAt(x, z, n);
      const reg = regionAt(x, z).id;
      const f = fbm(x * 0.012, z * 0.012, 3, 99);
      const roadK = T.bilinear(T.roadW, x, z), padK = T.bilinear(T.padW, x, z);
      if (roadK > 0.05 || padK > 0.05 || this.nearSite(x, z)) continue;
      const pick = R();
      if (n.y > 0.82 && y < 82) {
        let chance = reg === "G" ? 0.55 + f : reg === "R" ? 0.45 + f : reg === "W" ? 0.25 + f : reg === "X" ? 0.08 : 0.03;
        if (pick < chance * 0.5) { getG(x, z).trees.push([x, y, z, 0.8 + R() * 0.7, R()]); continue; }
        if (pick < chance * 0.5 + 0.08) { getG(x, z).shrubs.push([x, y, z, 0.6 + R() * 0.8, R()]); continue; }
      }
      if (pick > 0.93) getG(x, z).rocks.push([x, y, z, 0.6 + R() * 2.2, R()]);
    }
    const m = new THREE.Matrix4(), q = new THREE.Quaternion(), s = new THREE.Vector3(), p = new THREE.Vector3(), c = new THREE.Color();
    for (const g of groups.values()) {
      const parts = [];
      if (g.trees.length) {
        const im = new THREE.InstancedMesh(treeGeo, treeMat, g.trees.length);
        g.trees.forEach(([x, y, z, sc, v], i) => {
          q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), v * 6.28);
          m.compose(p.set(x, y - 0.2, z), q, s.set(sc, sc * (0.9 + v * 0.3), sc));
          im.setMatrixAt(i, m);
          const reg = regionAt(x, z).id;
          if (reg === "R" && y > 50) c.setRGB(0.2, 0.42, 0.33); else c.setRGB(0.18 + v * 0.1, 0.45 + v * 0.15, 0.22);
          im.setColorAt(i, c);
          this.col.addCyl(x, z, 0.45 * sc, y - 1, y + 7 * sc, { tag: "tree" });
        });
        im.castShadow = true; parts.push(im);
      }
      if (g.shrubs.length) {
        const im = new THREE.InstancedMesh(shrubGeo, treeMat, g.shrubs.length);
        g.shrubs.forEach(([x, y, z, sc, v], i) => {
          q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), v * 6.28);
          m.compose(p.set(x, y - 0.1, z), q, s.set(sc, sc, sc)); im.setMatrixAt(i, m);
          const reg = regionAt(x, z).id;
          if (reg === "C") c.setRGB(0.55, 0.5, 0.3); else c.setRGB(0.3 + v * 0.1, 0.55, 0.28);
          im.setColorAt(i, c);
        });
        parts.push(im);
      }
      if (g.rocks.length) {
        const im = new THREE.InstancedMesh(rockGeo, rockMat, g.rocks.length);
        g.rocks.forEach(([x, y, z, sc, v], i) => {
          q.setFromEuler(new THREE.Euler(v * 3, v * 9, v * 5));
          m.compose(p.set(x, y + sc * 0.2, z), q, s.set(sc * 1.3, sc * 0.8, sc)); im.setMatrixAt(i, m);
          const reg = regionAt(x, z).id;
          if (reg === "C") c.setRGB(1.15, 0.8, 0.6); else c.setRGB(1, 1, 1);
          im.setColorAt(i, c);
          if (sc > 1.1) this.col.addCyl(x, z, sc * 0.9, y - 1, y + sc, { tag: "rock" });
        });
        im.castShadow = true; parts.push(im);
      }
      for (const im of parts) { im.computeBoundingSphere(); this.scene.add(im); }
      g.parts = parts;
      this.groups.push(g);
    }
  }

  buildWater() {
    const geo = new THREE.PlaneGeometry(WORLD_HALF * 2 + 400, WORLD_HALF * 2 + 400, 1, 1);
    geo.rotateX(-Math.PI / 2);
    this.waterMat = new THREE.MeshPhongMaterial({ color: 0x2c8fb0, transparent: true, opacity: 0.78, shininess: 90, specular: 0x88ccee });
    this.water = new THREE.Mesh(geo, this.waterMat);
    this.water.position.y = WATER_Y;
    this.scene.add(this.water);
  }

  buildBirds() {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute([-0.9, 0, 0.2, 0, 0, -0.3, 0, 0, 0.3, 0.9, 0, 0.2, 0, 0, 0.3, 0, 0, -0.3], 3));
    const mat = new THREE.MeshBasicMaterial({ color: 0x2b2b33, side: THREE.DoubleSide });
    const R = rng(77);
    for (let k = 0; k < 14; k++) {
      const b = new THREE.Mesh(geo, mat);
      const cx = (R() * 2 - 1) * 450, cz = (R() * 2 - 1) * 450;
      this.birds.push({ m: b, cx, cz, r: 20 + R() * 40, h: this.t.heightAt(cx, cz) + 25 + R() * 30, a: R() * 6, sp: 0.2 + R() * 0.2, f: R() * 6 });
      this.scene.add(b);
    }
  }

  update(dt, px, pz, viewDist) {
    for (const g of this.groups) {
      const vis = Math.hypot(g.cx - px, g.cz - pz) < viewDist + GROUP * 0.7;
      for (const p of g.parts) p.visible = vis;
    }
    for (const b of this.birds) {
      b.a += dt * b.sp; b.f += dt * 9;
      b.m.position.set(b.cx + Math.cos(b.a) * b.r, b.h + Math.sin(b.a * 2) * 2, b.cz + Math.sin(b.a) * b.r);
      b.m.rotation.y = -b.a;
      b.m.scale.set(1, 1 + Math.sin(b.f) * 0.5, 1);
      b.m.rotation.z = Math.sin(b.f) * 0.4;
    }
  }
}

// ---------------- Sky ----------------
// Drawn in its own scene with a far camera, then the world is drawn on top.
export class Sky {
  constructor() {
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(70, 1, 10, 60000);
    const skyGeo = new THREE.SphereGeometry(50000, 32, 16);
    this.uniforms = { top: { value: new THREE.Color(0x3f86d8) }, bottom: { value: new THREE.Color(0xcfe9f7) } };
    const skyMat = new THREE.ShaderMaterial({
      side: THREE.BackSide, depthWrite: false, uniforms: this.uniforms,
      vertexShader: "varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }",
      fragmentShader: "uniform vec3 top; uniform vec3 bottom; varying vec3 vP; void main(){ float h = clamp(vP.y*1.6+0.08,0.0,1.0); gl_FragColor = vec4(mix(bottom, top, pow(h,0.7)),1.0); }",
    });
    this.scene.add(new THREE.Mesh(skyGeo, skyMat));
    // sun
    const sun = new THREE.Mesh(new THREE.SphereGeometry(900, 16, 8), new THREE.MeshBasicMaterial({ color: 0xfff4d6 }));
    sun.position.set(-18000, 26000, 14000);
    this.scene.add(sun);
    this.buildRing();
    this.buildFloaters();
  }
  buildRing() {
    // The habitat ring: our land sits at the bottom; the rest of the ring rises east and west and arcs overhead.
    const R = 14000, W = 2600, segs = 240;
    const cv = document.createElement("canvas"); cv.width = 1024; cv.height = 64;
    const g = cv.getContext("2d");
    const R2 = rng(5);
    for (let x = 0; x < 1024; x += 4) {
      const t = R2();
      g.fillStyle = t < 0.5 ? `hsl(${100 + R2() * 30},35%,${38 + R2() * 12}%)` : t < 0.75 ? `hsl(200,45%,${45 + R2() * 10}%)` : t < 0.9 ? `hsl(30,30%,${48 + R2() * 10}%)` : "#dfe6ee";
      g.fillRect(x, 0, 4, 64);
    }
    g.fillStyle = "rgba(190,215,240,0.35)"; g.fillRect(0, 0, 1024, 64);
    g.fillStyle = "#e9eef5"; g.fillRect(0, 0, 1024, 5); g.fillRect(0, 59, 1024, 5);
    g.fillStyle = "rgba(120,240,230,0.9)"; for (let x = 0; x < 1024; x += 32) { g.fillRect(x, 4, 6, 2); g.fillRect(x, 58, 6, 2); }
    const tex = new THREE.CanvasTexture(cv);
    tex.wrapS = THREE.RepeatWrapping; tex.repeat.set(6, 1);
    const pos = [], uv = [];
    for (let i = 0; i <= segs; i++) {
      const a = 0.2 + (i / segs) * (Math.PI * 2 - 0.4);
      const x = Math.sin(a) * R, y = R - Math.cos(a) * R - 400;
      pos.push(x, y, -W / 2, x, y, W / 2);
      uv.push(i / segs, 0, i / segs, 1);
    }
    const idx = [];
    for (let i = 0; i < segs; i++) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    geo.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
    geo.setIndex(idx);
    const mat = new THREE.MeshBasicMaterial({ map: tex, side: THREE.DoubleSide, transparent: true, opacity: 0.92, fog: false });
    this.ring = new THREE.Mesh(geo, mat);
    this.ring.rotation.y = 0.35;
    this.scene.add(this.ring);
    // haze over the ring so it looks far away
    this.ringMat = mat;
  }
  buildFloaters() {
    const R = rng(11);
    const mat = new THREE.MeshBasicMaterial({ color: 0x8e99a6 });
    const light = new THREE.DirectionalLight(0xffffff, 1.2); light.position.set(-1, 2, 1);
    this.scene.add(light, new THREE.AmbientLight(0x8899aa, 1.1));
    for (let k = 0; k < 7; k++) {
      // suspended land sections: rock base + green top
      const gr = new THREE.Group();
      const base = new THREE.Mesh(new THREE.ConeGeometry(260, 420, 7), mat); base.rotation.x = Math.PI; base.position.y = -210;
      const top = new THREE.Mesh(new THREE.CylinderGeometry(270, 260, 40, 7), new THREE.MeshBasicMaterial({ color: 0x79b06a }));
      gr.add(base, top);
      const a = R() * Math.PI * 2, d = 6000 + R() * 5000;
      gr.position.set(Math.cos(a) * d, 1500 + R() * 2500, Math.sin(a) * d);
      gr.scale.setScalar(0.6 + R());
      this.scene.add(gr);
    }
    // immense support pylons at the horizon
    const pyl = new THREE.MeshBasicMaterial({ color: 0xaab8c8, fog: false });
    for (const [x, z] of [[-9000, -6000], [9000, -5000], [-7000, 8000], [8000, 9000], [0, -12000]]) {
      const m = new THREE.Mesh(new THREE.BoxGeometry(500, 9000, 500), pyl);
      m.position.set(x, 3800, z); this.scene.add(m);
      const g = new THREE.Mesh(new THREE.BoxGeometry(80, 8000, 520), new THREE.MeshBasicMaterial({ color: 0x7ff0e6 }));
      g.position.set(x, 3800, z); this.scene.add(g);
    }
  }
  setDaylight(top, bottom) { this.uniforms.top.value.set(top); this.uniforms.bottom.value.set(bottom); }
  render(renderer, mainCam) {
    this.camera.quaternion.copy(mainCam.quaternion);
    this.camera.fov = mainCam.fov; this.camera.aspect = mainCam.aspect; this.camera.updateProjectionMatrix();
    renderer.render(this.scene, this.camera);
  }
}
