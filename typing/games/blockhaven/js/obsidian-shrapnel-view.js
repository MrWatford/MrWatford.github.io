import * as THREE from '../lib/three.module.min.js';
import { traceObsidianVolley } from './obsidian-shrapnel.js';

// Five clipped trajectory rails and shard-shaped tips: one batch, <=20
// triangles, two disposable resources. No terrain writes, lights or particles.
export function createObsidianShrapnelView(scene, world, cue) {
  const paths = traceObsidianVolley(world, cue?.volley);
  if (!paths) return null;
  const positions = [], uv = [], root = cue.volley.origin;
  function triangle(a, b, c, tex) {
    for (const [i, p] of [a, b, c].entries()) { positions.push(p.x - root.x, p.y - root.y, p.z - root.z); uv.push(...tex[i]); }
  }
  for (const path of paths) {
    if (path.distance < .15) continue;
    const a = path.origin, b = path.end, dx = b.x - a.x, dz = b.z - a.z, n = Math.hypot(dx, dz) || 1;
    const side = { x: dz / n * .065, z: -dx / n * .065 };
    const offset = (p, s) => ({ x: p.x + side.x * s, y: p.y + .025, z: p.z + side.z * s });
    const p = [offset(a, -1), offset(a, 1), offset(b, 1), offset(b, -1)];
    triangle(p[0], p[1], p[2], [[0,0],[0,1],[1,1]]); triangle(p[0], p[2], p[3], [[0,0],[1,1],[1,0]]);
    const back = Math.min(.5 / path.distance, .4), middle = { x: b.x - dx * back, y: b.y - (b.y-a.y) * back, z: b.z - dz * back };
    triangle(b, offset(middle, 3), middle, [[1,0],[1,0],[1,0]]);
    triangle(b, middle, offset(middle, -3), [[1,0],[1,0],[1,0]]);
  }
  if (!positions.length) return null;
  const geometry = new THREE.BufferGeometry(); geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); geometry.computeBoundingSphere();
  const material = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, side: THREE.DoubleSide,
    uniforms: { progress: { value: 0 }, motion: { value: 0 } },
    vertexShader: 'varying vec2 rail;void main(){rail=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
    fragmentShader: `varying vec2 rail;uniform float progress,motion;void main(){
      float dash=smoothstep(.1,.25,fract(rail.x*12.-motion));
      float core=1.-smoothstep(.18,.5,abs(rail.y-.5));
      float alpha=(.35+.5*progress)*mix(.3,1.,dash)*mix(.4,1.,core);
      if(rail.x>.999)alpha=.75+.2*progress;
      gl_FragColor=vec4(mix(vec3(1.,.72,.3),vec3(1.,.32,.1),progress),alpha);}` });
  const mesh = new THREE.Mesh(geometry, material); mesh.position.set(root.x, root.y, root.z); scene.add(mesh);
  let disposed = false;
  return { mesh, paths, triangles: positions.length / 9,
    update(progress, reducedMotion) {
      if (disposed) return; material.uniforms.progress.value = progress;
      material.uniforms.motion.value = reducedMotion ? 0 : progress * 1.5;
    },
    dispose() { if (disposed) return; disposed = true; scene.remove(mesh); geometry.dispose(); material.dispose(); }
  };
}
