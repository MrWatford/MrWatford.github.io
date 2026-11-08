import * as THREE from "../lib/three.module.min.js";

// Two batches, at most 194 triangles; no textures, lights or particle actors.
export function createBurrowView(scene, owner, fast = false) {
  const root = new THREE.Group(); scene.add(root);
  const count = fast ? 8 : 16, geometry = new THREE.BoxGeometry(1, 1, 1);
  const material = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const grains = new THREE.InstancedMesh(geometry, material, count);
  const color = new THREE.Color(), transform = new THREE.Object3D();
  for (let i = 0; i < count; i++) {
    color.setHex([0xe8bc73, 0xc39050, 0xf4d698, 0xa97843][i % 4]);
    if (!THREE.ColorManagement.enabled) color.convertSRGBToLinear();
    grains.setColorAt(i, color);
  }
  grains.frustumCulled = false; root.add(grains);
  const plane = new THREE.PlaneGeometry(owner.w + 7, 16);
  const wakeMaterial = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, side: THREE.DoubleSide,
    uniforms: { time: { value: 0 }, strength: { value: 0 }, tint: { value: new THREE.Color(0xc99b59) } },
    vertexShader: `varying vec2 vUv; void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
    fragmentShader: `varying vec2 vUv;uniform float time;uniform float strength;uniform vec3 tint;
      void main(){vec2 p=(vUv-.5)*2.;float edge=1.-smoothstep(.45,1.,abs(p.x));
      float fan=1.-smoothstep(.25,1.,abs(p.y));float ridge=pow(.5+.5*sin(p.y*26.+abs(p.x)*8.-time*4.),7.);
      float broken=.65+.35*sin(p.x*34.+p.y*13.);float a=(.12+.4*ridge)*edge*fan*broken*strength;
      if(a<.008)discard;gl_FragColor=vec4(tint,a);}`
  });
  if (!THREE.ColorManagement.enabled) wakeMaterial.uniforms.tint.value.convertSRGBToLinear();
  const wake = new THREE.Mesh(plane, wakeMaterial); wake.rotation.x = -Math.PI / 2; wake.position.set(0, 0.045, 2); root.add(wake);
  let disposed = false;
  const view = {
    update(journey, reducedMotion = false) {
      if (disposed) return;
      const depth = Math.max(0, Math.min(1, journey.depth / (owner.h + 3)));
      root.visible = !["complete", "canceled"].includes(journey.stage);
      root.position.set(journey.position.x, journey.position.y, journey.position.z); root.rotation.y = owner.yaw;
      wakeMaterial.uniforms.time.value = reducedMotion ? 0 : journey.elapsed;
      wakeMaterial.uniforms.strength.value = Math.min(1, depth * 3);
      for (let i = 0; i < count; i++) {
        const side = i % 2 ? 1 : -1, lane = Math.floor(i / 2) / (count / 2), cycle = reducedMotion ? lane : (lane + journey.elapsed * 0.7) % 1;
        const burst = journey.stage === "traveling" ? 0.45 : 1;
        transform.position.set(side * (owner.w * 0.3 + cycle * 2), 0.15 + Math.sin(cycle * Math.PI) * 1.5 * burst, -2 + lane * 9);
        transform.rotation.set(reducedMotion ? 0 : cycle * 2, i * 1.7, reducedMotion ? 0 : cycle * side);
        const s = (0.16 + (i % 3) * 0.08) * Math.min(1, depth * 4) * (1 - cycle * 0.6);
        transform.scale.set(s, s * 0.6, s); transform.updateMatrix(); grains.setMatrixAt(i, transform.matrix);
      }
      grains.instanceMatrix.needsUpdate = true;
    },
    dispose() { if (disposed) return; disposed = true; scene.remove(root); grains.dispose(); geometry.dispose(); material.dispose(); plane.dispose(); wakeMaterial.dispose(); }
  };
  root.visible = false;
  return view;
}
