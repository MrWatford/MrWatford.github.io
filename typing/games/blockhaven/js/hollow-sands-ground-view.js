import * as THREE from '../lib/three.module.min.js';
// Shared projected surface mesh for natural five-by-five hazard footprints.
export function sandsGroundGeometry(site){
  const positions=[],uv=[];
  for(const [dx,dz,y] of site.floors){
    const corners=[[dx-.5,dz-.5],[dx-.5,dz+.5],[dx+.5,dz+.5],[dx+.5,dz-.5]];
    for(const i of [0,1,2,0,2,3]){const [x,z]=corners[i];positions.push(x,y-site.y,z);uv.push(x/4.2+.5,z/4.2+.5);}
  }
  const geometry=new THREE.BufferGeometry();
  geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
  geometry.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));
  geometry.computeBoundingSphere();return geometry;
}
