// Cached 32px artwork shared by inventory, dropped and held items.
export function leviathanWeaponPixels(style) {
  const pixels=Array.from({length:32},()=>Array(32).fill(null));
  function poly(points,color){
    for(let y=1;y<31;y++)for(let x=1;x<31;x++){
      let inside=false;
      for(let i=0,j=points.length-1;i<points.length;j=i++){
        const [a,b]=points[i],[c,d]=points[j];
        if((b>y+.5)!==(d>y+.5)&&x+.5<(c-a)*(y+.5-b)/(d-b)+a)inside=!inside;
      }
      if(inside)pixels[y][x]=color;
    }
  }
  const gold='#c28a3d',light='#ffe5a0';
  poly([[3,26],[6,29],[13,22],[10,19]],'#5c3c30');
  for(let i=0;i<6;i++)poly([[5+i,25-i],[6+i,26-i],[8+i,24-i],[7+i,23-i]],i%2?gold:'#927058');
  poly([[2,27],[4,25],[7,28],[5,30]],gold);
  poly([[3,27],[4,26],[6,28],[5,29]],style==='inferno'?'#ff9b3d':style==='scepter'?'#a5eaff':light);
  if(style==='fang'){
    poly([[10,20],[12,15],[18,8],[29,2],[27,12],[21,17],[15,21]],gold);
    poly([[12,19],[14,15],[20,8],[27,4],[25,11],[20,15],[15,19]],'#f5dca3');
    poly([[14,16],[20,9],[27,4],[23,11],[18,15]],'#fff3d1');
    poly([[13,20],[17,17],[23,13],[21,16],[16,20]],'#9b6937');
    poly([[7,16],[9,15],[16,22],[15,25],[12,23]],gold);
    poly([[8,16],[10,17],[15,22],[14,23]],light);
    poly([[11,19],[13,18],[15,20],[13,22]],'#996733');pixels[19][13]='#fff6cb';
  }else if(style==='inferno'){
    poly([[10,19],[16,11],[23,3],[29,2],[29,8],[21,17],[14,23]],'#382d43');
    poly([[12,19],[18,11],[24,4],[28,3],[27,8],[20,16],[14,21]],'#83515b');
    poly([[13,18],[18,12],[20,12],[23,7],[27,4],[25,9],[23,10],[20,15],[18,15],[14,20]],'#ff7934');
    poly([[15,17],[19,13],[21,13],[24,8],[26,6],[24,10],[22,11],[20,15],[18,15]],'#ffd06b');
    poly([[23,3],[29,2],[29,4],[25,5],[18,13]],'#be7f68');
    poly([[7,15],[10,16],[17,23],[17,26],[14,25],[8,19]],'#382d43');
    poly([[8,16],[10,17],[15,22],[16,25],[14,23],[8,18]],gold);
    poly([[11,19],[13,18],[16,21],[14,23]],'#ff963d');pixels[20][13]='#ffe9a4';
  }else if(style==='scepter'){
    poly([[9,22],[21,10],[24,11],[12,24]],'#b9a0a2');
    poly([[10,22],[22,10],[23,11],[11,23]],'#f2dfbb');
    for(let i=0;i<3;i++)poly([[12+i*3,18-i*3],[14+i*3,20-i*3],[15+i*3,19-i*3],[13+i*3,17-i*3]],gold);
    poly([[16,12],[16,7],[18,5],[19,10],[23,14],[27,13],[28,15],[24,17],[20,16]],gold);
    poly([[19,9],[19,5],[24,1],[27,3],[29,7],[25,12],[22,12]],'#6b5888');
    poly([[20,8],[21,5],[24,3],[27,5],[27,8],[24,11]],'#71bce6');
    poly([[21,6],[24,3],[25,6],[24,9],[22,9]],'#d2f5ff');
    poly([[16,7],[17,4],[19,8],[23,12],[27,12],[30,10],[29,14],[24,15],[20,13]],'#e3c581');
    pixels[5][24]='#ffffff';pixels[15][21]='#a8e7ff';
  }else throw Error('Unknown legendary weapon art.');
  return pixels;
}
export function drawLeviathanWeapon(ctx, style) {
  const pixels = leviathanWeaponPixels(style);
  // Dark border preserves contrast over terrain and inventory backgrounds.
  ctx.fillStyle='#29232d';
  for(let y=1;y<31;y++)for(let x=1;x<31;x++)if(pixels[y][x])
    for(const [dx,dy]of[[-1,0],[1,0],[0,-1],[0,1]])if(!pixels[y+dy][x+dx])ctx.fillRect(x+dx,y+dy,1,1);
  for(let y=1;y<31;y++)for(let x=1;x<31;x++)if(pixels[y][x]){ctx.fillStyle=pixels[y][x];ctx.fillRect(x,y,1,1);}
}
