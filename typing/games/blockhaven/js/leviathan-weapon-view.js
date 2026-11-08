import * as THREE from '../lib/three.module.min.js';
import { leviathanWeaponPixels } from './leviathan-weapon-art.js';

// Five existing item-render sizes, including creature-carried items: 15 entries.
const sizes = [0.13, 0.15, 0.16, 0.25, 0.32], cache = new Map();
function buildGeometry(style, size) {
  const pixels = leviathanWeaponPixels(style), positions = [], colors = [];
  const unit = size * 1.5 / 32, depth = size * 0.06;
  const xAt = x => (x - 7) * unit, yAt = y => (25 - y) * unit;
  function quad(points, hex, shade) {
    const rgb = [1,3,5].map(i => parseInt(hex.slice(i,i+2),16) / 255 * shade);
    for (const i of [0,1,2,0,2,3]) { positions.push(...points[i]); colors.push(...rgb); }
  }
  for (let y = 1; y < 31; y++) for (let x = 1; x < 31; x++) {
    const color = pixels[y][x]; if (!color) continue;
    // Merge front/back runs of identical colors. Sides exist only at the outline.
    if (pixels[y][x-1] !== color) {
      let end=x+1; while(end<31 && pixels[y][end]===color) end++;
      const a=xAt(x),b=xAt(end),lo=yAt(y+1),hi=yAt(y);
      quad([[a,lo,depth],[b,lo,depth],[b,hi,depth],[a,hi,depth]],color,1);
      quad([[b,lo,-depth],[a,lo,-depth],[a,hi,-depth],[b,hi,-depth]],color,.9);
    }
    const a=xAt(x),b=xAt(x+1),lo=yAt(y+1),hi=yAt(y);
    if(!pixels[y][x-1])quad([[a,lo,-depth],[a,lo,depth],[a,hi,depth],[a,hi,-depth]],color,.55);
    if(!pixels[y][x+1])quad([[b,lo,depth],[b,lo,-depth],[b,hi,-depth],[b,hi,depth]],color,.65);
    if(!pixels[y-1][x])quad([[a,hi,depth],[b,hi,depth],[b,hi,-depth],[a,hi,-depth]],color,.8);
    if(!pixels[y+1][x])quad([[a,lo,-depth],[b,lo,-depth],[b,lo,depth],[a,lo,depth]],color,.5);
  }
  const geometry=new THREE.BufferGeometry();
  geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
  geometry.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));
  geometry.computeVertexNormals(); geometry.computeBoundingBox(); geometry.computeBoundingSphere();
  return geometry;
}
export function createLeviathanWeaponMesh(style, size) {
  // Validate before allocating geometry/materials or extending the cache.
  if (!['fang','inferno','scepter'].includes(style) || !sizes.includes(size)) throw Error('Invalid legendary weapon view.');
  const key=style+':'+size;
  if(!cache.has(key))cache.set(key,buildGeometry(style,size));
  const mesh=new THREE.Mesh(cache.get(key),new THREE.MeshBasicMaterial({vertexColors:true}));
  mesh.userData.shared=true; mesh.userData.legendaryWeapon=style;
  return mesh;
}
