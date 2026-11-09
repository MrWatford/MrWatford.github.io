import * as THREE from '../lib/three.module.min.js';
import { B, SOLID } from './blocks.js';

// One batch, two resources; <=529 loaded columns, six candidates/column,
// <=1058 triangles. No terrain writes, lights or particle allocation.
export function createAncientWarningView(scene, world, cue) {
  if (!cue || ![cue.x, cue.y, cue.z, cue.radius].every(Number.isFinite) || cue.radius <= 0 || cue.radius > 11) return null;
  const positions = [], half = Math.ceil(cue.radius), base = Math.floor(cue.y) - 1;
  for (let dz = -half; dz <= half; dz++) for (let dx = -half; dx <= half; dx++) {
    const x = Math.floor(cue.x) + dx, z = Math.floor(cue.z) + dz;
    if (!world.isLoaded(x, z)) continue;
    let floor = null;
    for (let y = base + 2; y >= base - 3; y--) {
      if (SOLID[world.id(x, y, z)] && world.id(x, y + 1, z) === B.AIR) { floor = y + 1; break; }
    }
    if (floor === null || Math.abs(floor - cue.y) >= 2.5) continue;
    const corners = [[x,z],[x,z+1],[x+1,z+1],[x+1,z]];
    for (const i of [0,1,2,0,2,3]) positions.push(corners[i][0]-cue.x, floor-cue.y, corners[i][1]-cue.z);
  }
  if (!positions.length) return null;
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3)); geometry.computeBoundingSphere();
  const material = new THREE.ShaderMaterial({transparent:true,depthWrite:false,side:THREE.DoubleSide,
    uniforms:{radius:{value:cue.radius},progress:{value:0},motion:{value:0},collapse:{value:cue.type==='collapse'?1:0},fury:{value:cue.type==='fury'?1:0}},
    vertexShader:'varying vec2 ground;void main(){ground=position.xz;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
    fragmentShader:`varying vec2 ground;uniform float radius,progress,motion,collapse,fury;
      void main(){float r=length(ground),q=r/radius,a=atan(ground.y,ground.x);
        if(r>radius+.08)discard;
        float edge=1.-smoothstep(.025,.08,abs(r-radius));
        float clock=(1.-smoothstep(.025,.07,abs(r-radius*.88)))*step((a+3.141593)/6.283186,progress);
        float cell=abs(fract((a+3.141593)/6.283186*16.)-.5);
        float runes=step(cell,.16)*step(.61,q)*step(q,.76);
        float cross=step(cell,.29)*(1.-smoothstep(.015,.035,abs(q-.685)));
        float inner=(1.-smoothstep(.02,.045,abs(q-.38)))*(.3+.3*progress);
        float pulse=(1.-smoothstep(.025,.055,abs(q-(.16+motion*.35))))*.18;
        float cracks=(1.-smoothstep(.025,.07,abs(ground.x-ground.y*.5)))+(1.-smoothstep(.025,.07,abs(ground.y+ground.x*.4)));
        float waves=(1.-smoothstep(.025,.06,abs(q-.5)))+(1.-smoothstep(.025,.06,abs(q-.7)));
        float alpha=edge*.92+clock*.9+mix(mix(runes+cross,cracks*step(q,.8),collapse),waves*.7,fury)*(.3+.45*progress)+inner+pulse+(1.-smoothstep(.75,1.,q))*.035;
        if(alpha<.005)discard;
        vec3 color=mix(mix(vec3(.14,.57,1.),vec3(.55,.38,.95),collapse),vec3(.72,.95,1.),progress);
        gl_FragColor=vec4(color,min(alpha,.95));}`});
  const mesh = new THREE.Mesh(geometry,material); mesh.position.set(cue.x,cue.y+.045,cue.z); scene.add(mesh);
  let disposed = false;
  return {mesh,triangles:positions.length/9,
    update(progress,reducedMotion){if(disposed)return;material.uniforms.progress.value=progress;material.uniforms.motion.value=reducedMotion?0:progress;},
    dispose(){if(disposed)return;disposed=true;scene.remove(mesh);geometry.dispose();material.dispose();}};
}
