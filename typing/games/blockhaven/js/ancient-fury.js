export function createAncientFury(age,player,arena) {
  const x=Math.max(arena.x-12,Math.min(arena.x+12,player.x));
  const z=Math.max(arena.z-15,Math.min(arena.z+15,player.z));
  return {kind:'fury',from:age,strikes:[[0,0],[-8,5],[8,5]].map(([dx,dz],i)=>
    ({x:x+dx,y:arena.y,z:z+dz,r:3,from:age,at:age+1.8+i*.8,warned:false}))};
}

export function ancientFuryCues(e) {
  const c=e?.duneCycle,a=c?.attack;
  if(e?.sp!=='leviathan_ancient'||e.dead||e.gone||e.tame||!e.emerged||c?.preview||c?.step!=='fury'||a?.kind!=='fury'||
    ![e.age,e.hp,e.maxHp].every(Number.isFinite)||e.hp<=0||e.maxHp<=0||!Array.isArray(a.strikes)||a.strikes.length!==3||
    !Number.isInteger(c.furyIndex)||c.furyIndex<0||c.furyIndex>2)return [];
  return a.strikes.slice(c.furyIndex).filter(p=>p&&[p.x,p.y,p.z,p.r,p.from,p.at].every(Number.isFinite)&&
    p.r===3&&p.at>p.from&&p.at<=p.from+3.5&&e.age>=p.from).map(point=>
    ({point,type:'fury',x:point.x,y:point.y,z:point.z,radius:point.r,deadline:point.at,
      progress:Math.max(0,Math.min(1,(e.age-point.from)/(point.at-point.from)))}));
}
