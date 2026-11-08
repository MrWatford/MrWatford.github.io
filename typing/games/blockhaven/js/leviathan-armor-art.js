import { LEVIATHAN_ARMOR_STYLE } from './leviathan-armor-style.js';
// Hand-authored 32px silhouettes, with the same plates, trim and seals as the rig.
export function drawLeviathanArmor(ctx,style,slot){
  const p=LEVIATHAN_ARMOR_STYLE[style];if(!p||!Number.isInteger(slot)||slot<0||slot>3)throw Error('Unknown legendary armor artwork.');
  const rect=(x,y,w,h,c)=>{ctx.fillStyle=c;ctx.fillRect(x,y,w,h);};
  const plate=(x,y,w,h)=>{rect(x,y,w,h,p.edge);rect(x+1,y+1,w-2,h-2,p.base);rect(x+1,y+1,w-2,1,p.light);rect(x+w-3,y+2,2,h-3,p.dark);};
  function seal(x,y){
    if(style==='ancient'){rect(x+1,y,2,7,p.glow);rect(x-1,y+2,6,1,p.glow);rect(x,y+5,4,1,p.glow);rect(x+1,y+1,1,2,'#effaff');}
    else if(style==='obsidian'){rect(x,y,2,3,p.glow);rect(x+1,y+2,3,2,p.glow);rect(x+3,y+3,1,4,p.glow);rect(x+1,y+2,1,1,'#ffe6ab');}
    else {rect(x+1,y,2,1,p.trim);rect(x,y+1,4,4,p.glow);rect(x+1,y+5,2,1,p.trim);rect(x+1,y+1,1,2,p.light);}
  }
  if(slot===0){
    plate(5,8,22,17);ctx.clearRect(10,17,12,8);
    for(const [x,h]of[[7,style==='sand'?3:5],[14,style==='ancient'?7:4],[23,style==='sand'?3:5]]){rect(x,9-h,3,h,p.edge);rect(x+1,10-h,1,h-1,p.trim);}
    rect(6,12,20,3,p.trim);rect(7,12,18,1,p.light);
    rect(7,17,3,7,p.trim);rect(22,17,3,7,p.trim);seal(14,10);
  }else if(slot===1){
    plate(7,7,18,22);plate(1,6,9,11);plate(22,6,9,11);ctx.clearRect(12,7,8,5);
    for(const y of [14,20,25]){rect(9,y,14,2,p.trim);rect(9,y+2,14,1,p.dark);}
    rect(2,9,7,2,p.dark);rect(23,9,7,2,p.dark);rect(3,12,5,1,p.trim);rect(24,12,5,1,p.trim);seal(14,13);
  }else if(slot===2){
    plate(7,4,18,9);plate(7,11,9,18);plate(17,11,8,18);
    rect(8,8,16,3,p.dark);rect(14,7,4,3,p.trim);
    for(const x of [9,19]){rect(x,13,4,2,p.trim);rect(x,24,4,2,p.trim);rect(x+1,17,2,5,p.glow);rect(x+1,17,1,1,p.light);}
  }else{
    plate(4,9,10,17);plate(18,9,10,17);plate(2,23,13,7);plate(17,23,13,7);
    for(const x of [5,19]){rect(x,12,8,2,p.trim);rect(x+2,16,2,5,p.glow);rect(x+2,16,1,2,p.light);rect(x-2,27,11,2,p.dark);rect(x,24,7,1,p.trim);}
  }
}
