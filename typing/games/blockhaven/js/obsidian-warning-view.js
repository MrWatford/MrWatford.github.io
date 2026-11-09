import * as THREE from '../lib/three.module.min.js';
import { B, SOLID } from './blocks.js';
import { createObsidianShrapnelView } from './obsidian-shrapnel-view.js';

// One draw batch, two disposable resources; <=169 columns, six floor candidates,
// <=338 triangles. Reads loaded terrain only; never stamps or flattens the Citadel.
export function createObsidianWarningView(scene, world, cue) {
  if (cue?.type === 'shrapnel') return createObsidianShrapnelView(scene, world, cue);
  if (!cue || ![cue.x, cue.y, cue.z, cue.radius].every(Number.isFinite) || cue.radius <= 0 || cue.radius > 6) return null;
  const positions = [], half = Math.ceil(cue.radius), bx = Math.floor(cue.x), bz = Math.floor(cue.z), base = Math.floor(cue.y) - 1;
  for (let dz = -half; dz <= half; dz++) for (let dx = -half; dx <= half; dx++) {
    const x = bx + dx, z = bz + dz;
    if (!world.isLoaded(x, z)) continue;
    let floor = null;
    for (let y = base + 2; y >= base - 3; y--) {
      if (SOLID[world.id(x, y, z)] && world.id(x, y + 1, z) === B.AIR) { floor = y + 1; break; }
    }
    if (floor === null || Math.abs(floor - cue.y) >= 2.5) continue;
    const corners = [[x, z], [x, z + 1], [x + 1, z + 1], [x + 1, z]];
    for (const i of [0, 1, 2, 0, 2, 3]) positions.push(corners[i][0] - cue.x, floor - cue.y, corners[i][1] - cue.z);
  }
  if (!positions.length) return null;
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3)); geometry.computeBoundingSphere();
  const material = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, side: THREE.DoubleSide,
    uniforms: { radius: { value: cue.radius }, roar: { value: cue.type === 'roar' ? 1 : 0 }, progress: { value: 0 }, motion: { value: 0 } },
    vertexShader: 'varying vec2 ground;void main(){ground=position.xz;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
    fragmentShader: `varying vec2 ground;uniform float radius,roar,progress,motion;
      void main(){float r=length(ground),q=r/radius,a=atan(ground.y,ground.x);
        if(r>radius+.075)discard;
        float edge=1.-smoothstep(.025,.075,abs(r-radius));
        float clock=(1.-smoothstep(.025,.065,abs(r-radius*.89)))*step((a+3.141593)/6.283186,progress);
        float cracks=pow(.5+.5*cos(a*7.+sin(q*11.+motion)*.5),22.)*smoothstep(.14,.3,q)*(1.-smoothstep(.72,.86,q));
        float waves=(1.-smoothstep(.025,.07,abs(q-.52)))*.65+(1.-smoothstep(.025,.07,abs(q-.7)))*.4;
        float marks=mix(cracks,waves,roar),fill=(1.-smoothstep(.75,1.,q))*(.025+.06*progress);
        float alpha=edge*.9+clock*.9+marks*(.18+.5*progress)+fill;
        if(alpha<.005)discard;
        vec3 color=mix(vec3(1.,.7,.28),vec3(1.,.31,.08),progress);
        gl_FragColor=vec4(color,min(alpha,.94));}` });
  const mesh = new THREE.Mesh(geometry, material); mesh.position.set(cue.x, cue.y + .045, cue.z); scene.add(mesh);
  let disposed = false;
  return { mesh, triangles: positions.length / 9,
    update(progress, reducedMotion) {
      if (disposed) return;
      material.uniforms.progress.value = progress;
      material.uniforms.motion.value = reducedMotion ? 0 : progress * .9;
    },
    dispose() {
      if (disposed) return; disposed = true; scene.remove(mesh); geometry.dispose(); material.dispose();
    }
  };
}
