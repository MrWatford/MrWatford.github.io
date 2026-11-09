export const ANCIENT_FINALE_SECONDS = 4;
const smooth = t => t*t*(3-2*t);

export function ancientFinalePose(progress,reducedMotion=false) {
  const p = Number.isFinite(progress)?Math.max(0,Math.min(1,progress)):0;
  return {sink:reducedMotion?0:smooth(Math.max(0,(p-.12)/.88)),
    lean:reducedMotion?0:Math.sin(p*Math.PI)*.11,
    opacity:1-smooth(Math.max(0,(p-.5)*2)),glow:1-p,
    red:1-p*.32,green:1-p*.18,blue:1-p*.08};
}

// The existing entity owns/disposes its model and glow. No extra resources,
// terrain writes, particles, camera shake, reward grants or save fields.
export function stepAncientFinale(e,dt,reducedMotion=false) {
  if (e.sp!=='leviathan_ancient' || e.gone || !Number.isFinite(dt) || dt<=0) return false;
  const f = e.ancientFinale ||= {elapsed:0,originY:e.pos.y,finished:false};
  if (f.finished) return false;
  f.elapsed = Math.min(ANCIENT_FINALE_SECONDS,f.elapsed+Math.min(dt,.1));
  e.dead = Math.max(0,ANCIENT_FINALE_SECONDS-f.elapsed);
  const pose = ancientFinalePose(f.elapsed/ANCIENT_FINALE_SECONDS,reducedMotion);
  e.pos.y = Math.min(e.pos.y,f.originY-pose.sink*Math.max(16,e.h*e.scale+12));
  e.root.rotation.z = pose.lean;
  if (!e.mat.transparent) {e.mat.transparent=true;e.mat.alphaTest=0;e.mat.depthWrite=false;e.mat.needsUpdate=true;}
  e.mat.opacity = pose.opacity; e.mat.color.setRGB(pose.red,pose.green,pose.blue);
  e.mesh.position.set(e.pos.x,e.pos.y,e.pos.z);
  e.glow?.update(f.elapsed,0,0,true,reducedMotion,pose.glow);
  if (f.elapsed>=ANCIENT_FINALE_SECONDS-1e-8) {
    f.finished=true;e.dead=0;e.mesh.visible=false;return true;
  }
  return false;
}
