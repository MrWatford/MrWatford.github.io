// Ringfall: final image. When bloom is on, the frame is drawn into an off-screen buffer
// (with multisample antialiasing), bright energy parts get a soft glow, and tone mapping + color
// conversion happen exactly once in the final pass. When bloom is off, the renderer does it directly.
import * as THREE from "../lib/three.module.min.js";

const VERT = "varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }";

export class PostFX {
  constructor(renderer) {
    this.r = renderer;
    this.enabled = false; this.strength = 0.32; this.reducedFlash = false;
    this.scene = new THREE.Scene(); this.cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    this.quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2)); this.quad.frustumCulled = false; this.scene.add(this.quad);
    this.bright = new THREE.ShaderMaterial({
      uniforms: { t: { value: null }, threshold: { value: 1.4 } }, vertexShader: VERT, toneMapped: false,
      fragmentShader: "uniform sampler2D t; uniform float threshold; varying vec2 vUv; void main(){ vec3 c = texture2D(t, vUv).rgb; float l = max(max(c.r, c.g), c.b); gl_FragColor = vec4(c * smoothstep(threshold, threshold * 1.8, l), 1.0); }",
    });
    this.blur = new THREE.ShaderMaterial({
      uniforms: { t: { value: null }, dir: { value: new THREE.Vector2() } }, vertexShader: VERT, toneMapped: false,
      fragmentShader: `uniform sampler2D t; uniform vec2 dir; varying vec2 vUv;
        void main(){ vec3 c = texture2D(t, vUv).rgb * 0.227;
          c += (texture2D(t, vUv + dir * 1.385).rgb + texture2D(t, vUv - dir * 1.385).rgb) * 0.316;
          c += (texture2D(t, vUv + dir * 3.231).rgb + texture2D(t, vUv - dir * 3.231).rgb) * 0.07;
          gl_FragColor = vec4(c, 1.0); }`,
    });
    this.final = new THREE.ShaderMaterial({
      uniforms: { t: { value: null }, b: { value: null }, strength: { value: 0.32 } }, vertexShader: VERT,
      fragmentShader: `uniform sampler2D t, b; uniform float strength; varying vec2 vUv;
        void main(){ vec3 c = texture2D(t, vUv).rgb + texture2D(b, vUv).rgb * strength;
          // light grade: a touch warmer highlights, cooler shadows
          float l = dot(c, vec3(0.2126, 0.7152, 0.0722)); c *= mix(vec3(0.97, 1.0, 1.04), vec3(1.03, 1.0, 0.97), smoothstep(0.05, 0.8, l));
          gl_FragColor = vec4(c, 1.0);
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
        }`,
    });
  }
  setup(enabled, samples) {
    this.enabled = enabled; this.samples = samples;
    this.dispose();
    if (!enabled) return;
    const opt = { type: THREE.HalfFloatType, depthBuffer: true };
    this.main = new THREE.WebGLRenderTarget(4, 4, { ...opt, samples });
    this.a = new THREE.WebGLRenderTarget(4, 4, { type: THREE.HalfFloatType, depthBuffer: false });
    this.b = new THREE.WebGLRenderTarget(4, 4, { type: THREE.HalfFloatType, depthBuffer: false });
    this.size(1, 1);
  }
  size(w, h) {
    if (!this.main) return;
    const v = this.r.getDrawingBufferSize(new THREE.Vector2());
    this.main.setSize(v.x, v.y);
    const qw = Math.max(1, Math.floor(v.x / 4)), qh = Math.max(1, Math.floor(v.y / 4));
    this.a.setSize(qw, qh); this.b.setSize(qw, qh);
    this.texel = new THREE.Vector2(1 / qw, 1 / qh);
  }
  begin() { if (this.enabled) this.r.setRenderTarget(this.main); }
  end() {
    if (!this.enabled) return;
    const r = this.r;
    const pass = (mat, target) => { this.quad.material = mat; r.setRenderTarget(target); r.render(this.scene, this.cam); };
    this.bright.uniforms.t.value = this.main.texture; pass(this.bright, this.a);
    for (let i = 0; i < 2; i++) {
      this.blur.uniforms.t.value = this.a.texture; this.blur.uniforms.dir.value.set(this.texel.x * (i + 1), 0); pass(this.blur, this.b);
      this.blur.uniforms.t.value = this.b.texture; this.blur.uniforms.dir.value.set(0, this.texel.y * (i + 1)); pass(this.blur, this.a);
    }
    this.final.uniforms.t.value = this.main.texture; this.final.uniforms.b.value = this.a.texture;
    this.final.uniforms.strength.value = this.reducedFlash ? this.strength * 0.5 : this.strength;
    pass(this.final, null);
  }
  dispose() { for (const k of ["main", "a", "b"]) if (this[k]) { this[k].dispose(); this[k] = null; } }
}
