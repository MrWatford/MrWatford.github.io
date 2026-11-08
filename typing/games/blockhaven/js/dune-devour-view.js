import * as THREE from '../lib/three.module.min.js';

// An open, translucent funnel preserves the maw silhouette and visible teeth.
// Two batches: 24 side triangles / 24 contour edges; four disposed resources.
export function createDuneDevourView(scene,record){
  if(record.local.length!==24)return null;
  const geometry=new THREE.BufferGeometry(),positions=new Float32Array(72),indices=[];
  geometry.setAttribute('position',new THREE.BufferAttribute(positions,3).setUsage(THREE.DynamicDrawUsage));
  for(let i=0;i<12;i++){const n=(i+1)%12;indices.push(i,n,12+n,i,12+n,12+i);}
  geometry.setIndex(indices);
  const material=new THREE.MeshBasicMaterial({color:0xffbb61,side:THREE.DoubleSide,forceSinglePass:true,transparent:true,opacity:.12,depthWrite:false});
  const shell=new THREE.Mesh(geometry,material);shell.frustumCulled=false;
  const edgeGeometry=new THREE.BufferGeometry(),edges=new Float32Array(144),pairs=[];
  edgeGeometry.setAttribute('position',new THREE.BufferAttribute(edges,3).setUsage(THREE.DynamicDrawUsage));
  for(let i=0;i<12;i++)pairs.push([i,(i+1)%12],[12+i,12+(i+1)%12]);
  const edgeMaterial=new THREE.LineBasicMaterial({color:0xffda85,transparent:true,opacity:.8,depthWrite:false});
  const lines=new THREE.LineSegments(edgeGeometry,edgeMaterial);lines.frustumCulled=false;scene.add(shell,lines);let disposed=false;
  return{update(progress,released){if(disposed)return;shell.visible=lines.visible=record.visible;
    for(let i=0;i<24;i++){const p=record.current[i];positions[i*3]=p.x;positions[i*3+1]=p.y;positions[i*3+2]=p.z;}
    let at=0;for(const pair of pairs)for(const i of pair){const p=record.current[i];edges[at++]=p.x;edges[at++]=p.y;edges[at++]=p.z;}
    geometry.attributes.position.needsUpdate=edgeGeometry.attributes.position.needsUpdate=true;
    material.color.setHex(released?0xff773b:0xffbb61);material.opacity=released?.22:.06+.1*progress;
    edgeMaterial.color.setHex(released?0xff9b4f:0xffda85);edgeMaterial.opacity=released?1:.6+.4*progress;
  },dispose(){if(disposed)return;disposed=true;scene.remove(shell,lines);geometry.dispose();material.dispose();edgeGeometry.dispose();edgeMaterial.dispose();}};
}
