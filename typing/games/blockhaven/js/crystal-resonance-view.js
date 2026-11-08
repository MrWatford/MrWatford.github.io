import * as THREE from '../lib/three.module.min.js';
import { CRYSTAL_WARNING,CRYSTAL_FLASH } from './crystal-resonance.js';

// One rune plane and eight instanced energy shards. No lights or particle actors.
export function createCrystalResonanceView(scene,site){
  const root=new THREE.Group();root.position.set(site.x,(site.viewY ?? site.y)+.08,site.z);scene.add(root);
  const geo=new THREE.PlaneGeometry(6,6),mat=new THREE.ShaderMaterial({transparent:true,depthWrite:false,side:THREE.DoubleSide,
    uniforms:{progress:{value:0},pulse:{value:0},fade:{value:0}},vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
    fragmentShader:`varying vec2 vUv;uniform float progress,pulse,fade;void main(){vec2 p=(vUv-.5)*6.;float r=length(p);float a=atan(p.y,p.x);float edge=1.-smoothstep(.025,.07,abs(r-2.5));float inner=(1.-smoothstep(.025,.06,abs(r-2.22)))*step((a+3.141593)/6.283186,progress);float marks=pow(.5+.5*cos(a*12.),14.)*(1.-smoothstep(.04,.13,abs(r-2.35)));float wave=(1.-smoothstep(.04,.13,abs(r-2.5*pulse)))*step(.001,pulse);float alpha=(edge*.6+inner*.9+marks*.65+wave*.8)*fade;if(alpha<.005)discard;gl_FragColor=vec4(mix(vec3(.33,.61,.95),vec3(.8,.92,1.),pulse),alpha);}`});
  const ring=new THREE.Mesh(geo,mat);ring.rotation.x=-Math.PI/2;root.add(ring);
  const shardGeo=new THREE.ConeGeometry(.12,1,4,1,true),shardMat=new THREE.MeshBasicMaterial({color:0xa9d8ff,transparent:true,depthWrite:false});
  const shards=new THREE.InstancedMesh(shardGeo,shardMat,8);shards.frustumCulled=false;root.add(shards);const transform=new THREE.Object3D();let disposed=false;
  return {update(age,reducedMotion){if(disposed)return;const t=age-CRYSTAL_WARNING,pulse=t>=0&&t<CRYSTAL_FLASH,fade=age<CRYSTAL_WARNING?Math.min(1,age/.2):pulse?Math.max(0,1-t/CRYSTAL_FLASH):0;
    root.visible=fade>0;mat.uniforms.fade.value=fade;mat.uniforms.progress.value=Math.min(1,age/CRYSTAL_WARNING);mat.uniforms.pulse.value=pulse?(reducedMotion?1:t/CRYSTAL_FLASH):0;
    shards.visible=pulse;shardMat.opacity=fade*.8;
    for(let i=0;i<8;i++){const a=i*Math.PI/4;const height=reducedMotion ? 0.35 : Math.max(.05,Math.sin(Math.min(1,Math.max(0,t/CRYSTAL_FLASH))*Math.PI)*.9);transform.position.set(Math.cos(a)*2.35,height/2,Math.sin(a)*2.35);transform.rotation.set(0,a,0);transform.scale.set(1,height,1);transform.updateMatrix();shards.setMatrixAt(i,transform.matrix);}shards.instanceMatrix.needsUpdate=true;
  },dispose(){if(disposed)return;disposed=true;scene.remove(root);shards.dispose();for(const g of [geo,shardGeo])g.dispose();for(const m of [mat,shardMat])m.dispose();}};
}
