import * as THREE from '../lib/three.module.min.js';
import {B,SOLID,HEIGHT}from'./blocks.js';

// One instanced batch, shared geometry/material. At most 24 loaded columns
// and HEIGHT ceiling probes/column, once per build. No terrain writes.
export function createAncientAwakeningView(scene,world,cue,fast=false) {
  if(cue?.type!=='awakening'||![cue.x,cue.y,cue.z].every(Number.isFinite))return null;
  const columns=[],count=fast?12:24;
  for(let i=0;i<count;i++){
    const angle=i*Math.PI*2/count,radius=6+(i%3)*.55;
    const x=Math.floor(cue.x+Math.cos(angle)*radius),z=Math.floor(cue.z+Math.sin(angle)*radius),y=Math.floor(cue.y);
    if(!world.isLoaded(x,z)||!SOLID[world.id(x,y-1,z)]||[0,1,2].some(d=>world.id(x,y+d,z)!==B.AIR))continue;
    let ceiling=null;
    for(let cy=y+4;cy<HEIGHT;cy++)if(SOLID[world.id(x,cy,z)]){ceiling=cy;break;}
    if(ceiling===null)continue;
    columns.push({x:x+.5,z:z+.5,floor:y+.2,ceiling:ceiling-.25,phase:i/count,size:.09+(i%3)*.035});
  }
  if(!columns.length)return null;
  const geometry=new THREE.BoxGeometry(1,1,1),material=new THREE.MeshBasicMaterial({color:0xd0bea2,transparent:true,opacity:0,depthWrite:false});
  const grains=columns.length*4;
  const mesh=new THREE.InstancedMesh(geometry,material,grains);mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  mesh.frustumCulled=false;scene.add(mesh);
  const transform=new THREE.Object3D();let disposed=false;
  return {mesh,columns:columns.length,grains,triangles:grains*12,
    update(progress,reducedMotion){
      if(disposed)return;
      const p=Math.max(0,Math.min(1,Number.isFinite(progress)?progress:0));
      mesh.visible=!reducedMotion&&p>0&&p<1;
      if(!mesh.visible)return;
      material.opacity=Math.sin(p*Math.PI)*.55;
      for(let i=0;i<grains;i++){
        const c=columns[Math.floor(i/4)],fall=(p*7/2.4+c.phase+(i%4)*.25)%1;
        transform.position.set(c.x+Math.sin(p*3+i)*.1,c.ceiling-(c.ceiling-c.floor)*fall,c.z);
        transform.scale.set(c.size,c.size*1.4,c.size);transform.rotation.set(0,i*.7,0);transform.updateMatrix();
        mesh.setMatrixAt(i,transform.matrix);
      }
      mesh.instanceMatrix.needsUpdate=true;
    },
    dispose(){if(disposed)return;disposed=true;scene.remove(mesh);mesh.dispose();geometry.dispose();material.dispose();}};
}
