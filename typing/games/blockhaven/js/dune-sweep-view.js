import * as THREE from '../lib/three.module.min.js';

// Two batches: at most nine prisms / 252 wash triangles and 216 outline edges.
// Both follow actual posed shells; decorative surfaces do not add hit volume.
export function createDuneSweepView(scene,record){
  if(!record.parts.length)return null;
  const geometry=new THREE.BufferGeometry(),positions=new Float32Array(record.parts.length*24*2*3);
  geometry.setAttribute('position',new THREE.BufferAttribute(positions,3).setUsage(THREE.DynamicDrawUsage));
  const material=new THREE.LineBasicMaterial({color:0xffce70,transparent:true,opacity:.8,depthWrite:false});
  const mesh=new THREE.LineSegments(geometry,material);mesh.frustumCulled=false;
  const shellGeometry=new THREE.BufferGeometry(),shellPositions=new Float32Array(record.parts.length*16*3),indices=[];
  for(let n=0;n<record.parts.length;n++){
    const base=n*16;
    for(let i=0;i<8;i++){const next=(i+1)%8;indices.push(base+i,base+next,base+8+next,base+i,base+8+next,base+8+i);}
    for(let i=1;i<7;i++)indices.push(base,base+i+1,base+i,base+8,base+8+i,base+8+i+1);
  }
  shellGeometry.setAttribute('position',new THREE.BufferAttribute(shellPositions,3).setUsage(THREE.DynamicDrawUsage));shellGeometry.setIndex(indices);
  const shellMaterial=new THREE.MeshBasicMaterial({color:0xffb342,side:THREE.DoubleSide,forceSinglePass:true,transparent:true,opacity:.15,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-1,polygonOffsetUnits:-1});
  const shell=new THREE.Mesh(shellGeometry,shellMaterial);shell.frustumCulled=false;scene.add(shell,mesh);const center=new THREE.Vector3(),edgePairs=[];for(let i=0;i<8;i++)edgePairs.push([i,(i+1)%8],[8+i,8+(i+1)%8],[i,8+i]);let disposed=false;
  return{update(progress,released){if(disposed)return;let at=0,count=0;
    for(const part of record.parts)if(part.visible){
      center.set(0,0,0);for(const p of part.current)center.add(p);center.multiplyScalar(1/16);
      for(let i=0;i<16;i++){const p=part.current[i],base=count*48+i*3;shellPositions[base]=p.x;shellPositions[base+1]=p.y;shellPositions[base+2]=p.z;}
      for(const pair of edgePairs)for(const n of pair){const p=part.current[n];positions[at++]=center.x+(p.x-center.x)*1.008;positions[at++]=center.y+(p.y-center.y)*1.008;positions[at++]=center.z+(p.z-center.z)*1.008;}
      count++;
    }
    geometry.setDrawRange(0,at/3);geometry.attributes.position.needsUpdate=true;
    shellGeometry.setDrawRange(0,count*84);shellGeometry.attributes.position.needsUpdate=true;
    material.color.setHex(released?0xff8a35:0xffce70);material.opacity=released?1:.6+.4*progress;
    shellMaterial.color.setHex(released?0xff8a35:0xffb342);shellMaterial.opacity=released?.24:.08+.12*progress;
  },dispose(){if(disposed)return;disposed=true;scene.remove(mesh,shell);geometry.dispose();material.dispose();shellGeometry.dispose();shellMaterial.dispose();}};
}
