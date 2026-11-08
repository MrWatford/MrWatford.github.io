import * as THREE from '../lib/three.module.min.js';
import { sandsGroundGeometry } from './hollow-sands-ground-view.js';
import { HEAT_GRACE } from './forgotten-heat.js';
// One terrain-following crack mesh and four instanced transparent heat wisps.
export function createHeatView(scene,site){
  const root=new THREE.Group();root.position.set(site.x,site.y+.035,site.z);scene.add(root);
  const groundGeometry=sandsGroundGeometry(site),groundMaterial=new THREE.ShaderMaterial({transparent:true,depthWrite:false,side:THREE.DoubleSide,uniforms:{cue:{value:0}},
    vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
    fragmentShader:`varying vec2 vUv;uniform float cue;void main(){vec2 p=(vUv-.5)*4.2;float r=length(p);float a=atan(p.y,p.x);vec2 q=floor(p*24.)/24.;float seam=min(abs(q.x+.12*sin(q.y*5.)),abs(q.y+.15*sin(q.x*5.)));float crack=(1.-smoothstep(.025,.065,seam))*(1.-smoothstep(1.2,1.8,r));float rim=1.-smoothstep(.025,.065,abs(r-1.8));float arc=(1.-smoothstep(.025,.06,abs(r-1.62)))*step((a+3.141593)/6.283186,cue);float alpha=crack*(.3+.25*cue)+rim*.5+arc*.8;if(alpha<.005)discard;gl_FragColor=vec4(mix(vec3(.85,.26,.055),vec3(1.,.65,.2),cue),alpha);}`});
  root.add(new THREE.Mesh(groundGeometry,groundMaterial));
  const wispGeometry=new THREE.PlaneGeometry(.55,.8),wispMaterial=new THREE.ShaderMaterial({transparent:true,depthWrite:false,side:THREE.DoubleSide,uniforms:{time:{value:0},cue:{value:0}},
    vertexShader:`varying vec2 vUv;void main(){vUv=uv;vec4 p=vec4(position,1.);
#ifdef USE_INSTANCING
p=instanceMatrix*p;
#endif
gl_Position=projectionMatrix*modelViewMatrix*p;}`,
    fragmentShader:`varying vec2 vUv;uniform float time,cue;void main(){float center=.5+sin(vUv.y*6.-time*.8)*.12;float width=(1.-vUv.y)*.22+.025;float shape=(1.-smoothstep(width*.3,width,abs(vUv.x-center)))*sin(vUv.y*3.141593);float alpha=shape*(.1+.12*cue);if(alpha<.004)discard;gl_FragColor=vec4(1.,.58,.22,alpha);}`});
  const wisps=new THREE.InstancedMesh(wispGeometry,wispMaterial,4);wisps.frustumCulled=false;root.add(wisps);const transform=new THREE.Object3D();
  for(let i=0;i<4;i++){const a=i*Math.PI/2,x=Math.cos(a)*.9,z=Math.sin(a)*.9,floor=site.floors.find(f=>f[0]===Math.round(x)&&f[1]===Math.round(z));transform.position.set(x,(floor?.[2]??site.y)-site.y+.4,z);transform.rotation.y=a;transform.updateMatrix();wisps.setMatrixAt(i,transform.matrix);}wisps.instanceMatrix.needsUpdate=true;
  let disposed=false;return {update(age,elapsed,reducedMotion){if(disposed)return;const cue=Math.min(1,elapsed/HEAT_GRACE);groundMaterial.uniforms.cue.value=cue;wispMaterial.uniforms.cue.value=cue;wispMaterial.uniforms.time.value=reducedMotion?0:age;},dispose(){if(disposed)return;disposed=true;scene.remove(root);wisps.dispose();groundGeometry.dispose();wispGeometry.dispose();groundMaterial.dispose();wispMaterial.dispose();}};
}
