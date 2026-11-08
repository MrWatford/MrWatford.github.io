import * as THREE from "../lib/three.module.min.js";

const VERTEX = `
varying vec2 gateUV;
void main() {
  gateUV = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`;

const FRAGMENT = `
varying vec2 gateUV;
uniform float clock;
uniform float visibility;
uniform vec3 innerColor;
uniform vec3 rimColor;

void main() {
  vec2 uv = floor(gateUV * 100.0) / 100.0;
  vec2 p = uv * 2.0 - 1.0;
  float radius = length(p);
  float angle = atan(p.y, p.x + 0.0001);
  float field = 1.0 - smoothstep(0.8, 1.0, radius);
  float spiral = 0.5 + 0.5 * sin(angle * 4.0 - radius * 19.0 + clock * 1.5);
  float ribbon = smoothstep(0.52, 0.96, spiral) * field * smoothstep(0.06, 0.3, radius);
  float rim = smoothstep(0.68, 0.83, radius) * (1.0 - smoothstep(0.85, 0.98, radius));
  float runes = step(0.72, cos(angle * 18.0 - clock * 0.65)) * rim;
  float core = 1.0 - smoothstep(0.0, 0.44, radius);
  vec3 light = mix(innerColor * (0.35 + core * 0.45), rimColor, clamp(rim + runes * 0.6, 0.0, 1.0));
  light += ribbon * innerColor * 0.75;
  gl_FragColor = vec4(light, (field * 0.55 + rim * 0.2 + runes * 0.15) * visibility);
}`;

export function makeSolkaraGateView(returnGate) {
  const geometry = new THREE.PlaneGeometry(returnGate ? 2.85 : 4.65, returnGate ? 3.6 : 2.85);
  const material = new THREE.ShaderMaterial({
    vertexShader: VERTEX,
    fragmentShader: FRAGMENT,
    uniforms: {
      clock: { value: 0 },
      visibility: { value: 1 },
      innerColor: { value: new THREE.Color(returnGate ? 0x69dac8 : 0x69bfe8) },
      rimColor: { value: new THREE.Color(0xf4b868) }
    },
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.renderOrder = 2;
  if (!returnGate) mesh.rotation.y = Math.PI / 2;
  return mesh;
}
