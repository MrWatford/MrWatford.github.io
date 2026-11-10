import * as THREE from '../lib/three.module.min.js';
import { B } from './blocks.js';
import { ancientAwakeningProgress } from './ancient-awakening.js';

const validSite = s => s && [s.x,s.y,s.z].every(Number.isSafeInteger);
// The 48-block footprint touches at most sixteen chunks. Never load a chunk.
export function ancientBuriedLoadedKey(world, site) {
  if (!validSite(site)) return 0;
  let key=0, bit=0;
  for(let cz=Math.floor((site.z-24)/16);cz<=Math.floor((site.z+23)/16);cz++)
    for(let cx=Math.floor((site.x-24)/16);cx<=Math.floor((site.x+23)/16);cx++,bit++)
      if(world.isLoaded(cx*16,cz*16))key|=1<<bit;
  return key;
}

// Static sand-only floor patches clip the animated shadow around pillars,
// stone, covered/removed tiles and unloaded terrain. One draw, no textures.
export function createAncientBuriedView(scene, world, site, fast=false) {
  if (!validSite(site)) return null;
  const positions=[],step=fast?2:1;
  for(let dz=-24;dz<24;dz+=step)for(let dx=-24;dx<24;dx+=step){
    let valid=true;
    for(let oz=0;oz<step&&valid;oz++)for(let ox=0;ox<step;ox++){
      const x=site.x+dx+ox,z=site.z+dz+oz;
      if(!world.isLoaded(x,z)||world.id(x,site.y-1,z)!==B.SAND||
        world.id(x,site.y,z)!==B.AIR||world.id(x,site.y+1,z)!==B.AIR){valid=false;break;}
    }
    if(valid)positions.push(dx,0,dz,dx,0,dz+step,dx+step,0,dz,
      dx+step,0,dz,dx,0,dz+step,dx+step,0,dz+step);
  }
  if(!positions.length)return null;
  const geometry=new THREE.BufferGeometry();
  geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
  const material=new THREE.ShaderMaterial({transparent:true,depthWrite:false,
    polygonOffset:true,polygonOffsetFactor:-1,polygonOffsetUnits:-1,
    uniforms:{progress:{value:0},opacity:{value:0},pixel:{value:fast?.5:.25}},
    vertexShader:`varying vec2 floorPoint;
      void main(){floorPoint=position.xz;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`,
    fragmentShader:`uniform float progress,opacity,pixel;varying vec2 floorPoint;
      float spine(float along){return 8.0+4.0*sin((along+5.0)*.12+progress*1.2);}
      void main(){
        vec2 q=floor(floorPoint/pixel)*pixel;
        q.y-=8.0-18.0*progress;
        float along=-q.y;
        float t=clamp((along+14.0)/27.0,0.0,1.0);
        float width=.25+2.45*sqrt(t);
        float body=max(abs(q.x-spine(along))-width,abs(along+.5)-13.5);
        vec2 head=vec2(q.x-spine(13.0),along-13.0);
        float jaw=length(head/vec2(1.0,1.15))-3.4;
        float edge=min(body,jaw);
        float coverage=1.0-smoothstep(-.15,.65,edge);
        if(coverage<.01)discard;
        float ribs=step(.22,abs(fract((along+14.0)/2.2)-.5));
        float rim=smoothstep(-.9,-.1,edge);
        vec3 color=mix(vec3(.025,.055,.085),vec3(.20,.32,.40),rim*.5);
        float grain=.88+.12*fract(sin(dot(floor(floorPoint*4.0),vec2(12.9898,78.233)))*43758.5453);
        gl_FragColor=vec4(color,opacity*coverage*mix(.76,1.0,ribs)*grain);
      }`});
  const mesh=new THREE.Mesh(geometry,material);mesh.position.set(site.x,site.y+.012,site.z);
  mesh.visible=false;scene.add(mesh);let disposed=false;
  return {mesh,tiles:positions.length/18,triangles:positions.length/9,
    update(progress,reducedMotion=false,available=true){
      if(disposed)return;
      const p=Number.isFinite(progress)?Math.max(0,Math.min(1,progress)):0;
      mesh.visible=available&&p>.06&&p<.94;
      material.uniforms.progress.value=reducedMotion?.45:p;
      material.uniforms.opacity.value=mesh.visible?.48*Math.min(1,(p-.06)/.15,(.94-p)/.18):0;
    },
    dispose(){if(disposed)return;disposed=true;scene.remove(mesh);geometry.dispose();material.dispose();}
  };
}

export function createAncientBuriedController(scene) {
  let record=null;
  const clear=()=>{record?.view?.dispose();record=null;};
  return {clear,
    update(actor,world,{fast=false,reducedMotion=false,now=0}={}){
      const p=ancientAwakeningProgress(actor),site=actor?.duneCycle?.site;
      if(p===null||p>=1||!world||!validSite(site)){clear();return;}
      const key=ancientBuriedLoadedKey(world,site),edits=world.editCount||0;
      const identity=!record||record.actor!==actor||record.world!==world||record.fast!==fast||
        record.x!==site.x||record.y!==site.y||record.z!==site.z;
      const changed=identity||record.key!==key||record.edits!==edits;
      if(changed&&(identity||now-record.builtAt>=.2)){
        clear();record={actor,world,fast,key,edits,x:site.x,y:site.y,z:site.z,builtAt:now,
          view:key?createAncientBuriedView(scene,world,site,fast):null};
      }
      // Hide stale geometry immediately while the bounded rebuild waits.
      record?.view?.update(p,reducedMotion,record.key===key&&record.edits===edits);
    },
    review(){return {active:!!record?.view,visible:!!record?.view?.mesh.visible,
      tiles:record?.view?.tiles||0,triangles:record?.view?.triangles||0,
      motionProgress:record?.view?.mesh.material.uniforms.progress.value??null};}
  };
}
