// Aegis Frontier: the shared look. Procedural surface textures (made in code at load time, so there are
// no image downloads), a sky-reflection environment map, physically based materials, beveled shapes,
// and small shader add-ons for world-space surface detail and wind.
import * as THREE from "../lib/three.module.min.js";
import { rng, fbm } from "./util.js";

export const SHARED = { time: { value: 0 }, wind: { value: new THREE.Vector2(0.8, 0.45) } };

// sRGB color → linear THREE.Color (all hand-picked colors in this game are sRGB)
export function srgb(r, g, b) { return new THREE.Color().setRGB(r, g, b, THREE.SRGBColorSpace); }

// ---------------- procedural textures ----------------
function canvasTex(size, draw, color = true, repeat = true) {
  const c = document.createElement("canvas"); c.width = c.height = size;
  const g = c.getContext("2d");
  draw(g, size);
  const t = new THREE.CanvasTexture(c);
  if (color) t.colorSpace = THREE.SRGBColorSpace;
  if (repeat) t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = 4;
  t.generateMipmaps = true; t.minFilter = THREE.LinearMipmapLinearFilter;
  return t;
}
// Fills a canvas pixel by pixel with tileable noise (wraps cleanly at the edges).
function noiseFill(g, size, fn, seed) {
  const img = g.createImageData(size, size), d = img.data;
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const u = x / size, v = y / size;
    // tileable: blend 4 shifted samples
    const n = (s) => {
      const a = fbm(u * s, v * s, 4, seed), b = fbm((u - 1) * s, v * s, 4, seed), c = fbm(u * s, (v - 1) * s, 4, seed), e = fbm((u - 1) * s, (v - 1) * s, 4, seed);
      return (a * (1 - u) + b * u) * (1 - v) + (c * (1 - u) + e * u) * v;
    };
    const [r, gg, bb] = fn(n, u, v);
    const k = (y * size + x) * 4;
    d[k] = r; d[k + 1] = gg; d[k + 2] = bb; d[k + 3] = 255;
  }
  g.putImageData(img, 0, 0);
}
const clamp255 = (v) => Math.max(0, Math.min(255, v));

export function makeTextures(size = 512) {
  const R = rng(9001);
  const T = {};
  // Meadow grass: mixed fresh and dry tones with fine blade strokes
  T.grass = canvasTex(size, (g, s) => {
    noiseFill(g, s, (n) => { const a = n(6), b = n(22); const dry = Math.max(0, a * 1.6); return [clamp255(78 + b * 40 + dry * 70), clamp255(112 + b * 46 + dry * 30), clamp255(46 + b * 20)]; }, 11);
    for (let i = 0; i < s * 14; i++) {
      const x = R() * s, y = R() * s, l = 3 + R() * 7, a = -Math.PI / 2 + (R() - 0.5) * 0.9;
      const t = R();
      g.strokeStyle = t < 0.5 ? `rgba(150,180,80,${0.25 + R() * 0.3})` : t < 0.8 ? `rgba(40,70,25,${0.3 + R() * 0.3})` : `rgba(190,180,110,${0.3})`;
      g.lineWidth = 1; g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); g.stroke();
    }
  });
  // Dirt with small pebbles and ruts
  T.dirt = canvasTex(size, (g, s) => {
    noiseFill(g, s, (n) => { const a = n(5), b = n(28); return [clamp255(122 + a * 40 + b * 26), clamp255(98 + a * 34 + b * 22), clamp255(72 + a * 26 + b * 16)]; }, 21);
    for (let i = 0; i < s * 1.6; i++) {
      const x = R() * s, y = R() * s, r = 0.8 + R() * 2.6, l = 105 + R() * 70;
      g.fillStyle = `rgba(40,30,22,0.45)`; g.beginPath(); g.ellipse(x + 0.8, y + 0.9, r, r * 0.75, 0, 0, 7); g.fill();
      g.fillStyle = `rgb(${l},${l * 0.9},${l * 0.8})`; g.beginPath(); g.ellipse(x, y, r, r * 0.75, R() * 3, 0, 7); g.fill();
    }
  });
  // Cliff rock: layered grain, directional cracks, lichen
  T.rock = canvasTex(size, (g, s) => {
    noiseFill(g, s, (n, u, v) => { const a = n(4), b = n(18), strata = Math.sin((v + a * 0.15) * 40) * 0.5; return [clamp255(128 + a * 50 + b * 30 + strata * 10), clamp255(126 + a * 48 + b * 28 + strata * 10), clamp255(122 + a * 44 + b * 26 + strata * 9)]; }, 31);
    for (let i = 0; i < 70; i++) {
      let x = R() * s, y = R() * s; const ang = 0.3 + (R() - 0.5) * 0.8;
      g.strokeStyle = `rgba(30,30,32,${0.35 + R() * 0.3})`; g.lineWidth = 0.8 + R() * 1.4; g.beginPath(); g.moveTo(x, y);
      for (let k = 0; k < 6; k++) { x += Math.cos(ang + (R() - 0.5)) * 12; y += Math.sin(ang + (R() - 0.5)) * 12; g.lineTo(x, y); }
      g.stroke();
    }
    for (let i = 0; i < 260; i++) { g.fillStyle = `rgba(${150 + R() * 40},${160 + R() * 30},${90 + R() * 30},0.25)`; g.beginPath(); g.arc(R() * s, R() * s, 1 + R() * 4, 0, 7); g.fill(); }
  });
  // Gravel and small stones (paths, cliff bases, pads)
  T.gravel = canvasTex(size, (g, s) => {
    noiseFill(g, s, (n) => { const a = n(8); return [clamp255(118 + a * 30), clamp255(114 + a * 28), clamp255(106 + a * 26)]; }, 41);
    for (let i = 0; i < s * 6; i++) {
      const x = R() * s, y = R() * s, r = 1 + R() * 3.4, l = 90 + R() * 100;
      g.fillStyle = "rgba(25,25,25,0.4)"; g.beginPath(); g.ellipse(x + 1, y + 1.2, r, r * 0.8, 0, 0, 7); g.fill();
      g.fillStyle = `rgb(${l},${l * 0.97},${l * 0.92})`; g.beginPath(); g.ellipse(x, y, r, r * 0.8, R() * 3, 0, 7); g.fill();
    }
  });
  // Engineered panels for structures: plates, seams, bolts, light wear (grayscale; tinted by vertex color)
  T.panel = canvasTex(size, (g, s) => {
    noiseFill(g, s, (n) => { const a = n(10); const v = 205 + a * 30; return [clamp255(v), clamp255(v), clamp255(v)]; }, 51);
    const cell = s / 4;
    for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) {
      const x = i * cell, y = j * cell, split = R() < 0.35;
      g.strokeStyle = "rgba(40,44,52,0.85)"; g.lineWidth = 3; g.strokeRect(x + 1.5, y + 1.5, cell - 3, split ? cell / 2 - 3 : cell - 3);
      if (split) g.strokeRect(x + 1.5, y + cell / 2 + 1.5, cell - 3, cell / 2 - 3);
      g.strokeStyle = "rgba(255,255,255,0.35)"; g.lineWidth = 1; g.strokeRect(x + 4, y + 4, cell - 8, cell - 8);
      g.fillStyle = "rgba(50,55,60,0.8)";
      for (const [bx, by] of [[8, 8], [cell - 8, 8], [8, cell - 8], [cell - 8, cell - 8]]) { g.beginPath(); g.arc(x + bx, y + by, 2.2, 0, 7); g.fill(); }
      if (R() < 0.3) { g.fillStyle = "rgba(40,44,52,0.6)"; for (let k = 0; k < 5; k++) g.fillRect(x + cell * 0.3, y + cell * 0.3 + k * 7, cell * 0.4, 3); }
    }
    for (let i = 0; i < 400; i++) { g.fillStyle = `rgba(90,90,95,${R() * 0.25})`; g.fillRect(R() * s, R() * s, 1 + R() * 5, 1); }
  });
  // Bark: vertical furrows
  T.bark = canvasTex(256, (g, s) => {
    noiseFill(g, s, (n, u) => { const a = n(5), f = Math.abs(Math.sin(u * Math.PI * 14 + a * 3)); return [clamp255(90 + f * 50 + a * 20), clamp255(68 + f * 36 + a * 16), clamp255(50 + f * 24 + a * 12)]; }, 61);
  });
  // Water ripples (normal-ish height used for animated normals)
  T.water = canvasTex(256, (g, s) => { noiseFill(g, s, (n) => { const a = n(6) * 0.6 + n(14) * 0.4; const v = 128 + a * 120; return [clamp255(v), clamp255(v), clamp255(v)]; }, 71); }, false);
  // Soft cloud puff (alpha)
  T.cloud = canvasTex(128, (g, s) => {
    for (let i = 0; i < 14; i++) {
      const x = s * (0.25 + R() * 0.5), y = s * (0.4 + R() * 0.25), r = s * (0.12 + R() * 0.18);
      const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, "rgba(255,255,255,0.55)"); gr.addColorStop(1, "rgba(255,255,255,0)");
      g.fillStyle = gr; g.fillRect(0, 0, s, s);
    }
  }, true, false);
  return T;
}

// ---------------- environment (sky reflections) ----------------
export function makeEnvironment(renderer) {
  const scene = new THREE.Scene();
  const geo = new THREE.SphereGeometry(10, 32, 16);
  const mat = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    uniforms: { top: { value: srgb(0.32, 0.55, 0.88) }, horizon: { value: srgb(0.78, 0.86, 0.93) }, ground: { value: srgb(0.28, 0.32, 0.24) }, sun: { value: new THREE.Vector3(-0.42, 0.62, 0.35).normalize() } },
    vertexShader: "varying vec3 vD; void main(){ vD = normalize(position); gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); }",
    fragmentShader: `uniform vec3 top, horizon, ground, sun; varying vec3 vD;
      void main(){ float y = vD.y; vec3 c = y > 0.0 ? mix(horizon, top, pow(y, 0.6)) : mix(horizon, ground, pow(-y, 0.4));
        float s = max(dot(vD, sun), 0.0); c += vec3(1.0,0.92,0.75) * (pow(s, 600.0) * 40.0 + pow(s, 8.0) * 0.35);
        gl_FragColor = vec4(c, 1.0); }`,
  });
  scene.add(new THREE.Mesh(geo, mat));
  const pm = new THREE.PMREMGenerator(renderer);
  const rt = pm.fromScene(scene, 0.02);
  pm.dispose(); geo.dispose(); mat.dispose();
  return rt.texture;
}

// ---------------- beveled shapes ----------------
const bevelCache = new Map();
// A box with rounded/chamfered edges that catch light (centered on the origin).
export function bevelBox(w, h, d, r = 0.02, seg = 1) {
  const key = [w, h, d, r, seg].map((v) => v.toFixed(3)).join("|");
  if (bevelCache.has(key)) return bevelCache.get(key);
  r = Math.min(r, w / 2 - 1e-4, h / 2 - 1e-4, d / 2 - 1e-4);
  const sh = new THREE.Shape();
  const x0 = -w / 2 + r, x1 = w / 2 - r, y0 = -h / 2 + r, y1 = h / 2 - r;
  sh.moveTo(x0, -h / 2); sh.lineTo(x1, -h / 2); sh.quadraticCurveTo(w / 2, -h / 2, w / 2, y0);
  sh.lineTo(w / 2, y1); sh.quadraticCurveTo(w / 2, h / 2, x1, h / 2); sh.lineTo(x0, h / 2);
  sh.quadraticCurveTo(-w / 2, h / 2, -w / 2, y1); sh.lineTo(-w / 2, y0); sh.quadraticCurveTo(-w / 2, -h / 2, x0, -h / 2);
  const geo = new THREE.ExtrudeGeometry(sh, { depth: Math.max(1e-4, d - 2 * r), bevelEnabled: true, bevelThickness: r, bevelSize: 0, bevelSegments: seg, curveSegments: 2 });
  geo.translate(0, 0, -(d - 2 * r) / 2);
  geo.computeVertexNormals();
  bevelCache.set(key, geo);
  return geo;
}

// ---------------- material library ----------------
export const MAT = {};
export function buildMaterials(T, env) {
  const std = (o) => new THREE.MeshStandardMaterial({ envMap: env, ...o });
  MAT.armorBlue = std({ color: srgb(0.18, 0.4, 0.82), roughness: 0.42, metalness: 0.15 });
  MAT.armorWhite = std({ color: srgb(0.9, 0.92, 0.94), roughness: 0.45, metalness: 0.08 });
  MAT.armorOrange = std({ color: srgb(1, 0.52, 0.16), roughness: 0.4, metalness: 0.1 });
  MAT.undersuit = std({ color: srgb(0.12, 0.13, 0.15), roughness: 0.92, metalness: 0 });
  MAT.metal = std({ color: srgb(0.62, 0.64, 0.67), roughness: 0.32, metalness: 0.9 });
  MAT.darkMetal = std({ color: srgb(0.2, 0.22, 0.25), roughness: 0.45, metalness: 0.75 });
  MAT.rubber = std({ color: srgb(0.08, 0.08, 0.09), roughness: 0.95, metalness: 0 });
  MAT.visor = std({ color: srgb(0.95, 0.55, 0.12), roughness: 0.06, metalness: 0.85, envMapIntensity: 1.6 });
  MAT.glass = std({ color: srgb(0.6, 0.78, 0.9), roughness: 0.05, metalness: 0.6, transparent: true, opacity: 0.55 });
  MAT.robotBody = std({ color: srgb(0.21, 0.23, 0.27), roughness: 0.5, metalness: 0.55 });
  MAT.robotLight = std({ color: srgb(0.64, 0.67, 0.71), roughness: 0.4, metalness: 0.7 });
  MAT.robotTrim = std({ color: srgb(0.36, 0.29, 0.52), roughness: 0.45, metalness: 0.4 });
  MAT.robotGold = std({ color: srgb(0.78, 0.62, 0.18), roughness: 0.35, metalness: 0.85 });
  MAT.roverWhite = std({ color: srgb(0.92, 0.93, 0.94), roughness: 0.4, metalness: 0.1 });
    for (const k of ["robotBody", "robotLight", "robotTrim"]) addDetail(MAT[k], T.panel, { scale: 1.4, bump: 0.08, mix: 0.18 });
  MAT.glowTeal = new THREE.MeshStandardMaterial({ color: 0x000000, emissive: srgb(0.25, 0.95, 0.85), emissiveIntensity: 2.2 });
  MAT.glowAmber = new THREE.MeshStandardMaterial({ color: 0x000000, emissive: srgb(1, 0.66, 0.2), emissiveIntensity: 2.4 });
  MAT.glowViolet = new THREE.MeshStandardMaterial({ color: 0x000000, emissive: srgb(0.69, 0.42, 1), emissiveIntensity: 2.2 });
  MAT.light = new THREE.MeshStandardMaterial({ color: 0x000000, emissive: srgb(1, 0.95, 0.85), emissiveIntensity: 3 });
  return MAT;
}

// ---------------- shader add-ons ----------------
// World-space (triplanar) detail: multiplies albedo by a texture and adds a matching bump.
// Works with vertex colors, so one material can serve many differently tinted parts.
export function addDetail(material, tex, o = {}) {
  const scale = o.scale ?? 0.5, bump = o.bump ?? 0.6, mixAmt = o.mix ?? 1;
  material.onBeforeCompile = (sh) => {
    sh.uniforms.tDetail = { value: tex };
    sh.vertexShader = sh.vertexShader
      .replace("#include <common>", "#include <common>\nvarying vec3 vWPos; varying vec3 vWNrm;")
      .replace("#include <worldpos_vertex>", "#include <worldpos_vertex>\nvWPos = (modelMatrix * vec4(transformed, 1.0)).xyz;\n#ifdef USE_INSTANCING\nvWPos = (modelMatrix * instanceMatrix * vec4(transformed, 1.0)).xyz;\n#endif\nvWNrm = normalize(mat3(modelMatrix) * objectNormal);");
    sh.fragmentShader = sh.fragmentShader
      .replace("#include <common>", `#include <common>\nuniform sampler2D tDetail; varying vec3 vWPos; varying vec3 vWNrm;
        vec3 triDetail(vec3 p, vec3 n){ vec3 w = pow(abs(n), vec3(4.0)); w /= (w.x+w.y+w.z);
          return texture2D(tDetail, p.zy*${scale.toFixed(3)}).rgb*w.x + texture2D(tDetail, p.xz*${scale.toFixed(3)}).rgb*w.y + texture2D(tDetail, p.xy*${scale.toFixed(3)}).rgb*w.z; }`)
      .replace("#include <map_fragment>", `#include <map_fragment>\nvec3 dTex = triDetail(vWPos, normalize(vWNrm)); float dH = dot(dTex, vec3(0.333));\ndiffuseColor.rgb *= mix(vec3(1.0), dTex * 1.25, ${mixAmt.toFixed(3)});`)
      .replace("#include <normal_fragment_maps>", `#include <normal_fragment_maps>
        { vec3 dpx = dFdx(-vViewPosition), dpy = dFdy(-vViewPosition); float hx = dFdx(dH), hy = dFdy(dH);
          vec3 r1 = cross(dpy, normal), r2 = cross(normal, dpx); float det = dot(dpx, r1);
          vec3 gr = sign(det) * (hx * r1 + hy * r2) * ${bump.toFixed(3)}; normal = normalize(abs(det) * normal - gr); }`);
  };
  material.customProgramCacheKey = () => "detail" + scale + bump + mixAmt + (tex.uuid || "");
  return material;
}

// Wind sway for foliage: vertices move by their height above the instance base (uv.y holds 0 at root, 1 at tip).
export function addWind(material, strength = 0.18, freq = 1.6) {
  const prev = material.onBeforeCompile;
  material.onBeforeCompile = (sh, r) => {
    if (prev) prev(sh, r);
    sh.uniforms.uTime = SHARED.time; sh.uniforms.uWind = SHARED.wind;
    sh.vertexShader = sh.vertexShader
      .replace("#include <common>", "#include <common>\nuniform float uTime; uniform vec2 uWind; attribute float sway;")
      .replace("#include <begin_vertex>", `#include <begin_vertex>
        { vec4 ip = vec4(0.0,0.0,0.0,1.0);
          #ifdef USE_INSTANCING
          ip = instanceMatrix * vec4(0.0,0.0,0.0,1.0);
          #endif
          float ph = ip.x * 0.31 + ip.z * 0.23;
          float w = sin(uTime * ${freq.toFixed(2)} + ph) * 0.6 + sin(uTime * ${(freq * 2.7).toFixed(2)} + ph * 1.7) * 0.25 + 0.35;
          transformed.xz += uWind * w * sway * sway * ${strength.toFixed(3)}; }`);
  };
  material.customProgramCacheKey = () => "wind" + strength + freq + (prev ? "d" : "");
  return material;
}
