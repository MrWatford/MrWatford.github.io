import * as THREE from '../lib/three.module.min.js';
import {B} from './blocks.js';
import {ancientAwakeningProgress} from './ancient-awakening.js';

const valid=s=>s&&[s.x,s.y,s.z].every(Number.isSafeInteger);
const floor=id=>id===B.SAND||id===B.KEEPER_STONE;
export function ancientOpeningLoadedKey(world,site){
  if(!valid(site))return 0;
  let key=0,bit=0;
  for(let cz=Math.floor((site.z-12)/16);cz<=Math.floor((site.z+11)/16);cz++)
    for(let cx=Math.floor((site.x-12)/16);cx<=Math.floor((site.x+11)/16);cx++,bit++)
      if(world.isLoaded(cx*16,cz*16))key|=1<<bit;
  return key;
}

// A visual opening, never a terrain cut. Only supported exposed arena floor is
// patched; existing rune warnings render above it. No new collision or lights.
export function createAncientOpeningView(scene,world,site,fast=false){
  if(!valid(site))return null;
  const positions=[],step=fast?2:1;
  for(let dz=-12;dz<12;dz+=step)for(let dx=-12;dx<12;dx+=step){
    let available=true;
    for(let oz=0;oz<step&&available;oz++)for(let ox=0;ox<step;ox++){
      const x=site.x+dx+ox,z=site.z+dz+oz;
      if(!world.isLoaded(x,z)||!floor(world.id(x,site.y-1,z))||
        world.id(x,site.y,z)!==B.AIR||world.id(x,site.y+1,z)!==B.AIR){available=false;break;}
    }
    if(available)positions.push(dx,0,dz,dx,0,dz+step,dx+step,0,dz,
      dx+step,0,dz,dx,0,dz+step,dx+step,0,dz+step);
  }
  if(!positions.length)return null;
  const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
  const material=new THREE.ShaderMaterial({transparent:true,depthWrite:false,
    polygonOffset:true,polygonOffsetFactor:-1,polygonOffsetUnits:-1,
    uniforms:{opening:{value:0},opacity:{value:0},pixel:{value:fast?.25:.125}},
    vertexShader:`varying vec2 floorPoint;
      void main(){floorPoint=position.xz;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`,
    fragmentShader:`varying vec2 floorPoint;uniform float opening,opacity,pixel;
      void main(){
        vec2 q=floor(floorPoint/pixel)*pixel;
        float radius=length(q);float angle=radius>.001?atan(q.y,q.x):0.0;
        float reach=10.5*opening;
        float bend=(abs(fract(radius*.55)-.5)-.25)*.9;
        float jagged=abs(sin(angle*3.0)*radius+bend);
        float width=.045+.20*opening;
        float end=1.0-smoothstep(max(0.0,reach-.35),reach+.05,radius);
        float seam=(1.0-smoothstep(width,width+.07,jagged))*end;
        float glow=(1.0-smoothstep(width+.14,width+.42,jagged))*end;
        float serration=.18*sin(angle*9.0)+.10*sin(angle*17.0);
        float hole=1.0-smoothstep(2.8*opening-.12,2.8*opening+.08,radius-serration);
        float coverage=max(hole,max(seam,glow*.5));
        if(coverage<.01)discard;
        vec3 dark=vec3(.012,.020,.035),blue=vec3(.18,.45,.63);
        vec3 color=mix(blue,dark,max(hole,seam));
        gl_FragColor=vec4(color,opacity*coverage);
      }`});
  const mesh=new THREE.Mesh(geometry,material);mesh.position.set(site.x,site.y+.008,site.z);
  mesh.renderOrder=-1;mesh.visible=false;scene.add(mesh);let disposed=false;
  return{mesh,tiles:positions.length/18,triangles:positions.length/9,
    update(progress,reducedMotion=false,available=true){
      if(disposed)return;
      const p=Number.isFinite(progress)?Math.max(0,Math.min(1,progress)):0;
      mesh.visible=available&&p>.22&&p<1;
      const t=Math.max(0,Math.min(1,(p-.22)/.66));
      material.uniforms.opening.value=reducedMotion?.72:t*t*(3-2*t);
      material.uniforms.opacity.value=mesh.visible?.9*Math.min(1,(p-.22)/.12,(1-p)/.08):0;
    },
    dispose(){if(disposed)return;disposed=true;scene.remove(mesh);geometry.dispose();material.dispose();}
  };
}

export function createAncientOpeningController(scene){
  let record=null;
  const clear=()=>{record?.view?.dispose();record=null;};
  return{clear,
    update(actor,world,{fast=false,reducedMotion=false,now=0}={}){
      const p=ancientAwakeningProgress(actor),site=actor?.duneCycle?.arrival;
      if(p===null||p>=1||!world||!valid(site)){clear();return;}
      const key=ancientOpeningLoadedKey(world,site),edits=world.editCount||0;
      const identity=!record||record.actor!==actor||record.world!==world||record.fast!==fast||
        record.x!==site.x||record.y!==site.y||record.z!==site.z;
      const dirty=identity||record.key!==key||record.edits!==edits;
      if(dirty&&(identity||now-record.builtAt>=.2)){
        clear();record={actor,world,fast,key,edits,x:site.x,y:site.y,z:site.z,builtAt:now,
          view:key?createAncientOpeningView(scene,world,site,fast):null};
      }
      record?.view?.update(p,reducedMotion,record.key===key&&record.edits===edits);
    },
    review(){return{active:!!record?.view,visible:!!record?.view?.mesh.visible,
      tiles:record?.view?.tiles||0,triangles:record?.view?.triangles||0,
      opening:record?.view?.mesh.material.uniforms.opening.value??null};}
  };
}
