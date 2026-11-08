import * as THREE from '../lib/three.module.min.js';

export const DUNE_SWEEP_DURATION = 0.65;
export const DUNE_SWEEP_GRACE = 0.12;
const EPS = 1e-7, axes = [new THREE.Vector3(1,0,0),new THREE.Vector3(0,1,0),new THREE.Vector3(0,0,1)];
const edge = new THREE.Vector3(), length = new THREE.Vector3(), axis = new THREE.Vector3(), center = new THREE.Vector3();

// Convex octagonal body prisms against the player's actual upright box. Face,
// box and edge-cross axes are all required (a bounding box alone overhits corners).
export function sweepPrismOverlaps(points, box) {
  const c = [(box[0]+box[3])/2,(box[1]+box[4])/2,(box[2]+box[5])/2];
  const h = [(box[3]-box[0])/2,(box[4]-box[1])/2,(box[5]-box[2])/2];
  const separated = a => {
    if (a.lengthSq()<1e-16) return false;
    let lo=Infinity,hi=-Infinity;
    for(const p of points){const d=p.dot(a);lo=Math.min(lo,d);hi=Math.max(hi,d);}
    const mid=c[0]*a.x+c[1]*a.y+c[2]*a.z,r=h[0]*Math.abs(a.x)+h[1]*Math.abs(a.y)+h[2]*Math.abs(a.z);
    return hi<=mid-r+EPS||lo>=mid+r-EPS;
  };
  for(const a of axes)if(separated(a))return false;
  length.subVectors(points[8],points[0]);
  for(let i=0;i<8;i++){
    edge.subVectors(points[(i+1)%8],points[i]);axis.crossVectors(edge,length);
    if(separated(axis))return false;
    for(const a of axes){axis.crossVectors(edge,a);if(separated(axis))return false;}
  }
  edge.subVectors(points[1],points[0]);axis.subVectors(points[2],points[1]).cross(edge);
  if(separated(axis))return false;
  for(const a of axes){axis.crossVectors(length,a);if(separated(axis))return false;}
  return true;
}
function bodyPart(v) {
  const pos=v.positions, lo=v.bounds.min.z, ring=[];
  for(let i=0;i<pos.count;i++){
    const p=new THREE.Vector3().fromBufferAttribute(pos,i);
    if(Math.abs(p.z-lo)>1e-5||Math.hypot(p.x,p.y)<1e-5||ring.some(q=>q.distanceToSquared(p)<1e-10))continue;
    ring.push(p);
  }
  ring.sort((a,b)=>Math.atan2(a.y,a.x)-Math.atan2(b.y,b.x));
  if(ring.length!==8)return null; // Unsupported geometry never becomes an invisible approximation.
  const local=[...ring,...ring.map(p=>new THREE.Vector3(p.x,p.y,v.bounds.max.z))];
  return {volume:v,local,previous:local.map(p=>p.clone()),current:local.map(p=>p.clone()),sample:local.map(p=>p.clone()),ready:false,visible:false};
}
export class DuneSweep {
  constructor(actor) {
    this.parts=(actor.hitVolumes||[]).filter(v=>/^segment[1-9]$/.test(v.name)).map(bodyPart).filter(Boolean);
    this.age=0;this.released=false;this.spent=false;this.player=null;this.contact=null;
  }
  get active(){return !this.released||this.age<DUNE_SWEEP_DURATION;}
  release(){this.released=true;this.age=0;}
  sample(actor,player,world,clearLine,dt,running){
    if(!running)return false;
    const oldAge=this.age;if(this.released)this.age=Math.min(DUNE_SWEEP_DURATION,this.age+Math.max(0,Math.min(.1,Number.isFinite(dt)?dt:0)));
    const p=player.pos,previousPlayer=this.player||p,height=player.height||1.8;
    const validPlayer=[p.x,p.y,p.z].every(Number.isFinite)&&!player.flying&&!player.mount&&!player.boat&&!player.cart&&world.isLoaded(p.x,p.z);
    let hit=false;
    for(const part of this.parts){
      let visible=!!actor.emerged;
      for(let node=part.volume.mesh;node;node=node.parent)if(!node.visible)visible=false;
      part.visible=visible;
      let movement=0;const wasReady=part.ready;
      for(let i=0;i<16;i++){
        part.previous[i].copy(part.current[i]);part.current[i].copy(part.local[i]).applyMatrix4(part.volume.mesh.matrixWorld);
        movement=Math.max(movement,part.previous[i].distanceTo(part.current[i]));
      }
      const playerTravel=Math.hypot(p.x-previousPlayer.x,p.y-previousPlayer.y,p.z-previousPlayer.z);
      if(!wasReady||!visible||movement>4||playerTravel>4)for(let i=0;i<16;i++)part.previous[i].copy(part.current[i]);
      part.ready=visible;
      if(hit||!wasReady||!visible||movement>4||playerTravel>4||!validPlayer||this.spent||!this.released||this.age<DUNE_SWEEP_GRACE||oldAge>=DUNE_SWEEP_DURATION)continue;
      const steps=Math.max(1,Math.min(32,Math.ceil((movement+playerTravel)/.25)));
      for(let step=1;step<=steps;step++){
        const t=step/steps;
        if(oldAge+(this.age-oldAge)*t<DUNE_SWEEP_GRACE)continue;
        for(let i=0;i<16;i++)part.sample[i].lerpVectors(part.previous[i],part.current[i],t);
        const x=previousPlayer.x+(p.x-previousPlayer.x)*t,y=previousPlayer.y+(p.y-previousPlayer.y)*t,z=previousPlayer.z+(p.z-previousPlayer.z)*t;
        if(!sweepPrismOverlaps(part.sample,[x-.3,y,z-.3,x+.3,y+height,z+.3]))continue;
        center.set(0,0,0);for(const point of part.sample)center.add(point);center.multiplyScalar(1/16);
        if(world.isLoaded(center.x,center.z)&&clearLine(world,{x:center.x,y:y+height*.5,z:center.z},{x,y:y+height*.5,z})){this.contact={x:center.x,y:y+height*.5,z:center.z};hit=true;break;}
      }
    }
    this.player={x:p.x,y:p.y,z:p.z};
    if(hit)this.spent=true; // One encounter hit, even if a shield or invulnerability absorbs it.
    return hit;
  }
}
