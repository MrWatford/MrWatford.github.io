// Turbo League -- picture pipeline (adapted from the Hero Clash HD pilot):
// scene in high dynamic range -> bloom (glow from bright lights) -> filmic tone mapping,
// vignette and grain -> optional FXAA edge smoothing for the optimized mode.
import * as THREE from "../lib/three.module.min.js";

const VS = "varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }";
const quad = (() => { const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute([-1, -1, 0, 3, -1, 0, -1, 3, 0], 3)); g.setAttribute("uv", new THREE.Float32BufferAttribute([0, 0, 2, 0, 0, 2], 2)); return g; })();
const pass = (frag, uniforms) => new THREE.ShaderMaterial({ vertexShader: VS, fragmentShader: frag, uniforms, depthTest: false, depthWrite: false, toneMapped: false });

const PREFILTER = `uniform sampler2D src; uniform vec2 texel; uniform float threshold; varying vec2 vUv;
vec3 s(vec2 o){ return texture2D(src, vUv + o * texel).rgb; }
void main(){
  vec3 c = (s(vec2(-1.,-1.)) + s(vec2(1.,-1.)) + s(vec2(-1.,1.)) + s(vec2(1.,1.))) * 0.25;
  c = (c.r == c.r && c.g == c.g && c.b == c.b) ? min(max(c, vec3(0.0)), vec3(60.0)) : vec3(0.0);
  float br = max(c.r, max(c.g, c.b)); float knee = threshold * 0.5;
  float soft = clamp(br - threshold + knee, 0.0, 2.0 * knee); soft = soft * soft / (4.0 * knee + 1e-4);
  float w = max(soft, br - threshold) / max(br, 1e-4);
  gl_FragColor = vec4(c * w, 1.0); }`;
const DOWN = `uniform sampler2D src; uniform vec2 texel; varying vec2 vUv;
vec3 s(float x, float y){ return texture2D(src, vUv + vec2(x, y) * texel).rgb; }
void main(){
  vec3 a = s(-2.,2.), b = s(0.,2.), c = s(2.,2.), d = s(-2.,0.), e = s(0.,0.), f = s(2.,0.), g = s(-2.,-2.), h = s(0.,-2.), i = s(2.,-2.);
  vec3 j = s(-1.,1.), k = s(1.,1.), l = s(-1.,-1.), m = s(1.,-1.);
  vec3 o = e * 0.125 + (a + c + g + i) * 0.03125 + (b + d + f + h) * 0.0625 + (j + k + l + m) * 0.125;
  gl_FragColor = vec4(o, 1.0); }`;
const UP = `uniform sampler2D src; uniform sampler2D base; uniform vec2 texel; uniform float radius; varying vec2 vUv;
vec3 s(float x, float y){ return texture2D(src, vUv + vec2(x, y) * texel * radius).rgb; }
void main(){
  vec3 o = s(0.,0.) * 4. + (s(-1.,0.) + s(1.,0.) + s(0.,-1.) + s(0.,1.)) * 2. + s(-1.,-1.) + s(1.,-1.) + s(-1.,1.) + s(1.,1.);
  gl_FragColor = vec4(texture2D(base, vUv).rgb + o / 16.0, 1.0); }`;
const COMPOSITE = `uniform sampler2D scene; uniform sampler2D bloom; uniform float bloomStr; uniform float exposure; uniform float time; uniform float vignette; uniform vec2 res; uniform float flash; varying vec2 vUv;
vec3 aces(vec3 x){ // fitted ACES filmic curve (Hill), applied in linear light
  const mat3 i = mat3(0.59719, 0.07600, 0.02840, 0.35458, 0.90834, 0.13383, 0.04823, 0.01566, 0.83777);
  const mat3 o = mat3(1.60475, -0.10208, -0.00327, -0.53108, 1.10813, -0.07276, -0.07367, -0.00605, 1.07602);
  x = i * x; vec3 a = x * (x + 0.0245786) - 0.000090537; vec3 b = x * (0.983729 * x + 0.4329510) + 0.238081; return clamp(o * (a / b), 0.0, 1.0); }
vec3 srgb(vec3 c){ return mix(c * 12.92, 1.055 * pow(c, vec3(1.0 / 2.4)) - 0.055, step(0.0031308, c)); }
float hash(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233)) + time) * 43758.5453); }
void main(){
  vec2 d = vUv - 0.5; float r2 = dot(d, d);
  // a touch of lens fringing toward the corners
  vec3 c; float ca = 0.0016 * r2 * 4.0;
  c.r = texture2D(scene, vUv - d * ca).r; c.g = texture2D(scene, vUv).g; c.b = texture2D(scene, vUv + d * ca).b;
  c = (c.r == c.r && c.g == c.g && c.b == c.b) ? max(c, vec3(0.0)) : vec3(0.0);
  c += texture2D(bloom, vUv).rgb * bloomStr;
  c *= exposure;
  c = aces(c);
  c *= mix(1.0, smoothstep(0.85, 0.2, r2 * 1.6), vignette);
  c = mix(c, vec3(1.0, 0.97, 0.9), flash);
  c = srgb(c);
  c += (hash(vUv * res) - 0.5) * 0.018;
  gl_FragColor = vec4(c, 1.0); }`;
const FXAA = `uniform sampler2D src; uniform vec2 texel; varying vec2 vUv;
float L(vec3 c){ return dot(c, vec3(0.299, 0.587, 0.114)); }
void main(){
  vec3 rgbM = texture2D(src, vUv).rgb;
  float lNW = L(texture2D(src, vUv + vec2(-1.,-1.) * texel).rgb), lNE = L(texture2D(src, vUv + vec2(1.,-1.) * texel).rgb);
  float lSW = L(texture2D(src, vUv + vec2(-1.,1.) * texel).rgb), lSE = L(texture2D(src, vUv + vec2(1.,1.) * texel).rgb), lM = L(rgbM);
  float lMin = min(lM, min(min(lNW, lNE), min(lSW, lSE))), lMax = max(lM, max(max(lNW, lNE), max(lSW, lSE)));
  vec2 dir = vec2(-((lNW + lNE) - (lSW + lSE)), ((lNW + lSW) - (lNE + lSE)));
  float red = max((lNW + lNE + lSW + lSE) * 0.03125, 1.0 / 128.0);
  float rcp = 1.0 / (min(abs(dir.x), abs(dir.y)) + red);
  dir = clamp(dir * rcp, vec2(-8.0), vec2(8.0)) * texel;
  vec3 a = 0.5 * (texture2D(src, vUv + dir * (1.0/3.0 - 0.5)).rgb + texture2D(src, vUv + dir * (2.0/3.0 - 0.5)).rgb);
  vec3 b = a * 0.5 + 0.25 * (texture2D(src, vUv + dir * -0.5).rgb + texture2D(src, vUv + dir * 0.5).rgb);
  float lB = L(b); gl_FragColor = vec4((lB < lMin || lB > lMax) ? a : b, 1.0); }`;

export class Post {
  constructor(renderer, cfg) {
    this.r = renderer; this.cfg = cfg;
    this.cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1); this.mesh = new THREE.Mesh(quad); this.mesh.frustumCulled = false; this.sc = new THREE.Scene(); this.sc.add(this.mesh);
    this.mPre = pass(PREFILTER, { src: { value: null }, texel: { value: new THREE.Vector2() }, threshold: { value: 1.0 } });
    this.mDown = pass(DOWN, { src: { value: null }, texel: { value: new THREE.Vector2() } });
    this.mUp = pass(UP, { src: { value: null }, base: { value: null }, texel: { value: new THREE.Vector2() }, radius: { value: 1 } });
    this.mComp = pass(COMPOSITE, { scene: { value: null }, bloom: { value: null }, bloomStr: { value: 0.09 }, exposure: { value: 1.05 }, time: { value: 0 }, vignette: { value: 0.55 }, res: { value: new THREE.Vector2() }, flash: { value: 0 } });
    this.mFx = pass(FXAA, { src: { value: null }, texel: { value: new THREE.Vector2() } });
    this.w = 0; this.h = 0; this.before = [];
  }
  rt(w, h, o = {}) { return new THREE.WebGLRenderTarget(Math.max(1, w), Math.max(1, h), Object.assign({ type: THREE.HalfFloatType, minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, depthBuffer: false }, o)); }
  size(w, h) {
    if (w === this.w && h === this.h) return; this.w = w; this.h = h;
    this.dispose(true);
    this.main = this.rt(w, h, { depthBuffer: true, samples: this.cfg.msaa });
    this.ldr = this.cfg.fxaa ? this.rt(w, h, { type: THREE.UnsignedByteType }) : null;
    const b0 = this.cfg.bloomHalf ? 4 : 2; this.down = []; this.up = [];
    for (let i = 0; i < this.cfg.bloomMips; i++) { const d = b0 * Math.pow(2, i); this.down.push(this.rt(Math.ceil(w / d), Math.ceil(h / d))); this.up.push(this.rt(Math.ceil(w / d), Math.ceil(h / d))); }
  }
  draw(mat, target) { this.mesh.material = mat; this.r.setRenderTarget(target); this.r.render(this.sc, this.cam); }
  // rect (optional, CSS pixels, origin bottom-left) draws into one part of the screen: used for split-screen
  render(scene, camera, time, rect) {
    const r = this.r, pr = r.getPixelRatio(), sz = rect ? new THREE.Vector2(Math.max(1, Math.round(rect.w * pr)), Math.max(1, Math.round(rect.h * pr))) : r.getDrawingBufferSize(new THREE.Vector2());
    this.size(sz.x, sz.y);
    for (const f of this.before) f(r, scene, camera);
    r.setRenderTarget(this.main); r.render(scene, camera);
    // bloom: prefilter -> blur down a chain of smaller pictures -> add them back up
    const D = this.down, U = this.up;
    this.mPre.uniforms.src.value = this.main.texture; this.mPre.uniforms.texel.value.set(1 / this.w, 1 / this.h); this.draw(this.mPre, D[0]);
    for (let i = 1; i < D.length; i++) { this.mDown.uniforms.src.value = D[i - 1].texture; this.mDown.uniforms.texel.value.set(1 / D[i - 1].width, 1 / D[i - 1].height); this.draw(this.mDown, D[i]); }
    let src = D[D.length - 1];
    for (let i = D.length - 2; i >= 0; i--) { const u = this.mUp.uniforms; u.src.value = src.texture; u.base.value = D[i].texture; u.texel.value.set(1 / src.width, 1 / src.height); u.radius.value = 1.0; this.draw(this.mUp, U[i]); src = U[i]; }
    const c = this.mComp.uniforms; c.scene.value = this.main.texture; c.bloom.value = src.texture; c.time.value = time % 100; c.res.value.set(this.w, this.h);
    if (rect) { r.setViewport(rect.x, rect.y, rect.w, rect.h); r.setScissor(rect.x, rect.y, rect.w, rect.h); r.setScissorTest(true); }
    if (this.ldr) { this.draw(this.mComp, this.ldr); this.mFx.uniforms.src.value = this.ldr.texture; this.mFx.uniforms.texel.value.set(1 / this.w, 1 / this.h); this.draw(this.mFx, null); }
    else this.draw(this.mComp, null);
    if (rect) { const full = r.getSize(new THREE.Vector2()); r.setViewport(0, 0, full.x, full.y); r.setScissorTest(false); }
  }
  dispose(keepMats) {
    for (const t of [this.main, this.ldr, ...(this.down || []), ...(this.up || [])]) if (t) t.dispose();
    if (!keepMats) for (const m of [this.mPre, this.mDown, this.mUp, this.mComp, this.mFx]) m.dispose();
  }
}

// Environment lighting (reflections on metal and glass) made from a small glowing "city" scene
export function cityEnvironment(renderer, opts = {}) {
  const s = new THREE.Scene();
  const sky = new THREE.Mesh(new THREE.SphereGeometry(50, 32, 16), new THREE.ShaderMaterial({ side: THREE.BackSide, depthWrite: false,
    uniforms: { top: { value: new THREE.Color(opts.top || 0x060b1e) }, hor: { value: new THREE.Color(opts.hor || 0x3a2c55) }, bot: { value: new THREE.Color(opts.bot || 0x120c10) } },
    vertexShader: "varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.); }",
    fragmentShader: "uniform vec3 top, hor, bot; varying vec3 vP; void main(){ float y = vP.y; vec3 c = y > 0. ? mix(hor, top, pow(y, .6)) : mix(hor, bot, pow(-y, .4)); gl_FragColor = vec4(c * 1.4, 1.); }" }));
  s.add(sky);
  const lamp = (col, w, h, x, y, z, k = 1) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: new THREE.Color(col).multiplyScalar(k), side: THREE.DoubleSide })); m.position.set(x, y, z); m.lookAt(0, 0, 0); s.add(m); };
  // big soft city glow around the horizon, a warm floodlight, cool moon, neon accents
  for (let i = 0; i < 14; i++) { const a = i / 14 * Math.PI * 2; lamp(i % 3 ? 0xffb070 : 0x80b0ff, 9, 2.5, Math.sin(a) * 30, -2 + (i % 2) * 2, Math.cos(a) * 30, 1.6); }
  lamp(opts.key || 0xfff0d8, 10, 10, 18, 22, 20, 5);
  lamp(0xa8c4ff, 8, 8, -20, 25, -25, 3);
  lamp(opts.neonA || 0xff3060, 14, 2, -28, 6, -10, 4); lamp(opts.neonB || 0x30d0ff, 14, 2, 28, 5, -14, 4);
  const pm = new THREE.PMREMGenerator(renderer); const rt = pm.fromScene(s, 0.02); pm.dispose();
  s.traverse((o) => { if (o.geometry) o.geometry.dispose(); if (o.material) o.material.dispose(); });
  return rt.texture;
}
