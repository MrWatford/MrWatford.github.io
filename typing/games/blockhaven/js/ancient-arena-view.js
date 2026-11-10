import * as THREE from '../lib/three.module.min.js';
import {B} from './blocks.js';

const directions=Array.from({length:16},(_,i)=>({x:Math.cos(i*Math.PI/8),z:Math.sin(i*Math.PI/8),angle:i*Math.PI/8}));
const strokes=[[-.22,0,.035,.58,0],[.22,0,.035,.58,0],[0,-.27,.44,.035,0],
  [0,0,.32,.04,0],[0,.27,.44,.035,0],[0,-.12,.035,.3,Math.PI/4]];
const valid=site=>site&&[site.x,site.y,site.z].every(Number.isFinite);

// A sixteen-bit loaded-column signature; no generation or terrain sampling.
export function ancientArenaLoadedKey(world,site,fast=false) {
  if(!valid(site))return 0;
  let key=0;
  for(let i=0;i<16;i+=fast?2:1){const d=directions[i];
    if(world.isLoaded(Math.floor(site.x+d.x*18.8),Math.floor(site.z+d.z*18.8)))key|=1<<i;}
  return key;
}

// Only existing exposed glyph tiles receive a decorative overlay. No map edits.
export function createAncientArenaView(scene,world,site,fast=false) {
  if(!valid(site))return null;
  const tiles=[];
  for(let i=0;i<16;i+=fast?2:1){const d=directions[i],x=Math.floor(site.x+d.x*18.8),z=Math.floor(site.z+d.z*18.8);
    if(world.isLoaded(x,z)&&world.id(x,site.y-1,z)===B.SUN_GLYPH&&world.id(x,site.y,z)===B.AIR)
      tiles.push({x:x+.5,z:z+.5,angle:d.angle});}
  if(!tiles.length)return null;
  const geometry=new THREE.PlaneGeometry(1,1),material=new THREE.MeshBasicMaterial({color:0x76b9dd,
    transparent:true,opacity:0,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-1,polygonOffsetUnits:-1});
  const mesh=new THREE.InstancedMesh(geometry,material,tiles.length*strokes.length),transform=new THREE.Object3D();
  let index=0;
  for(const tile of tiles)for(const [x,z,width,length,angle] of strokes){
    const c=Math.cos(tile.angle),s=Math.sin(tile.angle);
    transform.position.set(tile.x+x*c-z*s,site.y+.026,tile.z+x*s+z*c);
    transform.rotation.set(-Math.PI/2,0,tile.angle+angle);transform.scale.set(width,length,1);transform.updateMatrix();
    mesh.setMatrixAt(index++,transform.matrix);
  }
  mesh.instanceMatrix.needsUpdate=true;mesh.frustumCulled=false;scene.add(mesh);
  const cold=new THREE.Color(0x568ebc),charged=new THREE.Color(0xc6f0ff);let disposed=false;
  return {mesh,glyphs:tiles.length,triangles:index*2,
    update(progress,reducedMotion=false,loaded=true){
      if(disposed)return;
      const p=Math.max(0,Math.min(1,Number.isFinite(progress)?progress:0));
      mesh.visible=loaded&&p>0&&p<1;
      if(!mesh.visible)return;
      // One slow charge/fade, with fixed glyph positions in both motion settings.
      const fade=Math.min(1,p/.15,(1-p)/.1);
      material.opacity=fade*(.25+.45*p);
      material.color.copy(cold).lerp(charged,p);
    },
    dispose(){if(disposed)return;disposed=true;scene.remove(mesh);mesh.dispose();geometry.dispose();material.dispose();}
  };
}
