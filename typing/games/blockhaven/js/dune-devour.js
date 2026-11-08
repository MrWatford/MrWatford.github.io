import * as THREE from '../lib/three.module.min.js';

export const DUNE_DEVOUR_DURATION = 0.55;
export const DUNE_DEVOUR_GRACE = 0.12;
const axes = [new THREE.Vector3(1,0,0),new THREE.Vector3(0,1,0),new THREE.Vector3(0,0,1)];
const edge = new THREE.Vector3(), longitudinal = new THREE.Vector3(), axis = new THREE.Vector3(), origin = new THREE.Vector3();

// A convex twelve-sided funnel, not the surrounding head box. Include every
// side normal, cap normal and edge-cross axis: tapered edges are not parallel.
export function devourFunnelOverlaps(points, box) {
  const cx=(box[0]+box[3])/2,cy=(box[1]+box[4])/2,cz=(box[2]+box[5])/2;
  const hx=(box[3]-box[0])/2,hy=(box[4]-box[1])/2,hz=(box[5]-box[2])/2;
  const separated=a=>{
    if(a.lengthSq()<1e-16)return false;
    let lo=Infinity,hi=-Infinity;
    for(const p of points){const d=p.dot(a);lo=Math.min(lo,d);hi=Math.max(hi,d);}
    const mid=cx*a.x+cy*a.y+cz*a.z,r=hx*Math.abs(a.x)+hy*Math.abs(a.y)+hz*Math.abs(a.z);
    return hi<=mid-r+1e-7||lo>=mid+r-1e-7;
  };
  for(const a of axes)if(separated(a))return false;
  for(let i=0;i<12;i++){
    edge.subVectors(points[(i+1)%12],points[i]);longitudinal.subVectors(points[12+i],points[i]);
    axis.crossVectors(edge,longitudinal);if(separated(axis))return false;
    for(const a of axes){axis.crossVectors(edge,a);if(separated(axis))return false;axis.crossVectors(longitudinal,a);if(separated(axis))return false;}
  }
  edge.subVectors(points[1],points[0]);axis.subVectors(points[2],points[1]).cross(edge);
  return !separated(axis);
}
export class DuneDevour {
  constructor(actor) {
    this.volume=actor.hitVolumes?.find(v=>v.name==='head'&&v.positions.count===288&&v.mesh.geometry.userData.faceTiles?.length===288);
    this.local=[];
    if(this.volume){
      const b=this.volume.bounds,rx=b.max.x,ry=b.max.y,depth=b.max.z;
      if([rx,ry,depth].every(n=>Number.isFinite(n)&&n>0))for(const [radius,z]of[[.34,-depth*.8],[.78,depth+1]])for(let i=0;i<12;i++){
        const a=i*Math.PI/6;this.local.push(new THREE.Vector3(Math.sin(a)*rx*radius,Math.cos(a)*ry*radius,z));
      }
    }
    this.current=this.local.map(p=>p.clone());this.previous=this.local.map(p=>p.clone());this.points=this.local.map(p=>p.clone());
    this.age=0;this.released=false;this.spent=false;this.ready=false;this.visible=false;this.player=null;this.contact=null;
  }
  get active(){return !this.released||this.age<DUNE_DEVOUR_DURATION;}
  release(){this.released=true;this.age=0;}
  sample(actor,player,world,clearLine,dt,running){
    if(!running||this.local.length!==24)return false;
    const oldAge=this.age;
    if(this.released)this.age=Math.min(DUNE_DEVOUR_DURATION,this.age+Math.max(0,Math.min(.1,Number.isFinite(dt)?dt:0)));
    let visible=!!actor.emerged;
    for(let node=this.volume.mesh;node;node=node.parent)if(!node.visible)visible=false;
    this.visible=visible;
    let movement=0;
    for(let i=0;i<24;i++){
      this.previous[i].copy(this.current[i]);this.current[i].copy(this.local[i]).applyMatrix4(this.volume.mesh.matrixWorld);
      movement=Math.max(movement,this.previous[i].distanceTo(this.current[i]));
    }
    const p=player.pos,previousPlayer=this.player||p,height=player.height||1.8;
    const travel=Math.hypot(p.x-previousPlayer.x,p.y-previousPlayer.y,p.z-previousPlayer.z),wasReady=this.ready;
    if(!wasReady||!visible||movement>4||travel>4)for(let i=0;i<24;i++)this.previous[i].copy(this.current[i]);
    this.ready=visible;this.player={x:p.x,y:p.y,z:p.z};
    if(!wasReady||!visible||movement>4||travel>4||this.spent||!this.released||this.age<DUNE_DEVOUR_GRACE||oldAge>=DUNE_DEVOUR_DURATION||
      ![p.x,p.y,p.z].every(Number.isFinite)||player.flying||player.mount||player.boat||player.cart||!world.isLoaded(p.x,p.z))return false;
    const steps=Math.max(1,Math.min(32,Math.ceil((movement+travel)/.25)));
    for(let step=1;step<=steps;step++){
      const t=step/steps;if(oldAge+(this.age-oldAge)*t<DUNE_DEVOUR_GRACE)continue;
      for(let i=0;i<24;i++)this.points[i].lerpVectors(this.previous[i],this.current[i],t);
      const x=previousPlayer.x+(p.x-previousPlayer.x)*t,y=previousPlayer.y+(p.y-previousPlayer.y)*t,z=previousPlayer.z+(p.z-previousPlayer.z)*t;
      if(!devourFunnelOverlaps(this.points,[x-.3,y,z-.3,x+.3,y+height,z+.3]))continue;
      origin.set(0,0,0);for(let i=0;i<12;i++)origin.add(this.points[i]);origin.multiplyScalar(1/12);
      if(!world.isLoaded(origin.x,origin.z)||!clearLine(world,{x:origin.x,y:y+height*.5,z:origin.z},{x,y:y+height*.5,z}))continue;
      this.spent=true;this.contact={x:origin.x,y:y+height*.5,z:origin.z};return true;
    }
    return false;
  }
}
