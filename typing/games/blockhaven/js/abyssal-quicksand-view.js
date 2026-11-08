import * as THREE from '../lib/three.module.min.js';
import { sandsGroundGeometry } from './hollow-sands-ground-view.js';
// A shallow sand-flow projection; it never changes terrain or the player's height.
export function createQuicksandView(scene,site){
  const geometry=sandsGroundGeometry(site);
  const material=new THREE.ShaderMaterial({transparent:true,depthWrite:false,side:THREE.DoubleSide,uniforms:{time:{value:0},depth:{value:0}},
    vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
    fragmentShader:`varying vec2 vUv;uniform float time,depth;void main(){vec2 p=(vUv-.5)*4.2;float r=length(p);float a=atan(p.y,p.x);float rim=(1.-smoothstep(.025,.065,abs(r-1.8)))*(.55+.45*pow(.5+.5*cos(a*16.),4.));float flow=pow(.5+.5*sin(r*15.+a*3.-time*.7),8.)*(1.-smoothstep(.2,1.75,r));float center=(1.-smoothstep(0.,1.6,r))*.12;float alpha=rim*.65+flow*(.12+depth*.12)+center;if(alpha<.005)discard;gl_FragColor=vec4(mix(vec3(.67,.48,.24),vec3(.9,.68,.35),depth),alpha);}`});
  const mesh=new THREE.Mesh(geometry,material);mesh.position.set(site.x,site.y+.035,site.z);scene.add(mesh);let disposed=false;
  return {update(age,depth,reducedMotion){if(disposed)return;material.uniforms.time.value=reducedMotion?0:age;material.uniforms.depth.value=depth;},dispose(){if(disposed)return;disposed=true;scene.remove(mesh);geometry.dispose();material.dispose();}};
}
