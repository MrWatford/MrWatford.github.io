import * as THREE from '../lib/three.module.min.js';
import { B } from './blocks.js';
import { DUNE_BURST_DURATION } from './dune-warning.js';
// At most 81 loaded columns and six vertical candidates per column. No writes.
export function createDuneWarningView(scene,world,cue,fast=false){
  const positions=[],uv=[],half=Math.ceil(cue.radius),span=half*2+1,base=Math.floor(cue.y)-1,bx=Math.floor(cue.x),bz=Math.floor(cue.z);
  for(let dz=-half;dz<=half;dz++)for(let dx=-half;dx<=half;dx++){
    const x=bx+dx,z=bz+dz;if(!world.isLoaded(x,z))continue;
    let floor=null;for(let y=base+2;y>=base-3;y--)if(world.id(x,y,z)===B.SAND&&world.id(x,y+1,z)===B.AIR){floor=y+1;break;}
    if(floor===null||Math.abs(floor-cue.y)>=2.5)continue;
    const corners=[[x-cue.x,z-cue.z],[x-cue.x,z+1-cue.z],[x+1-cue.x,z+1-cue.z],[x+1-cue.x,z-cue.z]];
    for(const i of [0,1,2,0,2,3]){const [px,pz]=corners[i];positions.push(px,floor-cue.y,pz);uv.push(px/span+.5,pz/span+.5);}
  }
  if(!positions.length)return null;
  const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geometry.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));geometry.computeBoundingSphere();
  const kind={eruption:0,sweep:1,vortex:2,devour:3,eruptionBurst:4}[cue.type];
  const material=new THREE.ShaderMaterial({transparent:true,depthWrite:false,side:THREE.DoubleSide,uniforms:{radius:{value:cue.radius},span:{value:span},kind:{value:kind},progress:{value:0},motion:{value:0}},
    vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
    fragmentShader:`varying vec2 vUv;uniform float radius,span,kind,progress,motion;void main(){vec2 p=(vUv-.5)*span;float r=length(p),a=atan(p.y,p.x),q=r/radius;float edge=1.-smoothstep(.025,.075,abs(r-radius));float arc=(1.-smoothstep(.025,.065,abs(r-radius*.9)))*step((a+3.141593)/6.283186,progress);float marks=0.;if(kind<.5){marks=pow(.5+.5*cos(a*8.),16.)*(1.-smoothstep(.35,.8,q));}else if(kind<1.5){marks=pow(.5+.5*cos(a*6.+q*9.),16.)*step(.55,q)*step(q,.8);}else if(kind<2.5){marks=pow(.5+.5*cos(a*3.+q*19.-motion),12.)*(1.-smoothstep(.6,.85,q));}else{float tooth=abs(fract((a/6.283186+.5)*12.)-.5);marks=step(tooth,clamp((q-.52)*1.3,0.,.3))*step(.52,q)*step(q,.8);}float alpha=edge*.85+arc*.8+marks*(.2+.35*progress)+(1.-smoothstep(.7,1.,q))*.035;if(kind>3.5){alpha=(1.-smoothstep(.04,.14,abs(r-radius*(.4+motion*.325))))*(1.-progress)*.8;}if(alpha<.005)discard;vec3 gold=mix(vec3(.85,.52,.17),vec3(1.,.83,.42),progress);if(kind>2.5)gold=mix(vec3(.95,.37,.12),vec3(1.,.72,.27),progress);gl_FragColor=vec4(gold,alpha);}`});
  const mesh=new THREE.Mesh(geometry,material);mesh.position.set(cue.x,cue.y+.04,cue.z);scene.add(mesh);let disposed=false;const burst=cue.type==="eruptionBurst",count=fast?8:16;let shards=null,shardGeo=null,shardMat=null;const transform=new THREE.Object3D();if(burst){shardGeo=new THREE.BoxGeometry(.18,.18,.18);shardMat=new THREE.MeshBasicMaterial({color:0xdea95d,transparent:true,depthWrite:false});shards=new THREE.InstancedMesh(shardGeo,shardMat,count);shards.frustumCulled=false;mesh.add(shards);}
  return {update(progress,reducedMotion){if(disposed)return;material.uniforms.progress.value=progress;material.uniforms.motion.value=reducedMotion?0:progress*2;if(shards){const t=progress*DUNE_BURST_DURATION;shardMat.opacity=(1.-progress)*.8;for(let i=0;i<count;i++){const a=i*Math.PI*2/count,r=reducedMotion?1.9:1+t*4,y=reducedMotion ? .35 : .3+(4+i%3)*t-5*t*t;transform.position.set(Math.cos(a)*r,y,Math.sin(a)*r);transform.rotation.set(reducedMotion?0:t*(i%3+1),a,0);transform.updateMatrix();shards.setMatrixAt(i,transform.matrix);}shards.instanceMatrix.needsUpdate=true;}},dispose(){if(disposed)return;disposed=true;scene.remove(mesh);shards?.dispose();shardGeo?.dispose();shardMat?.dispose();geometry.dispose();material.dispose();}};
}
