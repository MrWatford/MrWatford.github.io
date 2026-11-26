// The encounter and the two cosmetic skins share the same pixel-art vocabulary.
const PALETTES = [
  ["#af7c60","#3b251e","#26888c","#34346d","#46605f"],
  ["#9a726d","#342333","#29616e","#35305f","#c878ef"],
  ["#a67164","#31212c","#46384c","#30233b","#f3675e"],
  ["#302331","#1e1621","#29213b","#241930","#ac77dd"],
  ["#7c5378","#302139","#3f2a58","#36244f","#ec81df"],
];
const palette = index => PALETTES[index] || PALETTES[0];
export const reignPaint = (part, fixed) => (P,side,variant) => {
  const phase=fixed ?? variant ?? 0;
  const [skin,hair,shirt,pants,spark]=palette(phase);
  const field = part==="head" ? skin : part==="body" ? shirt : part==="arm" ? skin : pants;
  P.fill([field]);
  for (let y=0;y<16;y+=3) for (let x=(y*7)%5;x<16;x+=5) {
    P.rect(x,y,2,1,y%2 ? "#15101e22" : "#d4d9ec25");
  }
  if (part==="head") {
    if (side==="top" || side==="back") P.fill([hair]);
    else if (side!=="bottom") {
      P.rect(0,0,16,4,hair);
      P.rect(side==="right"?1:12,4,3,4,hair);
    }
    if (side==="front") {
      P.rect(2,6,4,2,"#fff"); P.rect(10,6,4,2,"#fff");
      P.rect(7,9,2,2,"#18121b44"); P.rect(5,12,6,1,"#21152258");
    }
  }
  if (part==="body" && side!=="top") {
    P.rect(0,13,16,3,pants);
    for (let x=0;x<16;x+=4) P.rect(x,11+(x%3),2,3,"#19232d70");
    if (side==="front") { P.rect(6,0,4,2,skin); P.rect(0,3,16,1,"#a1e4d22c"); }
    if (side==="back") P.rect(7,1,2,10,"#10141c38");
  }
  if (part==="arm" && side!=="bottom") {
    P.rect(0,0,16,side==="top"?16:5,shirt);
    if (side!=="top") for (let x=1;x<16;x+=4) P.rect(x,4,2,2+(x%3),"#19222c88");
  }
  if (part==="leg") P.rect(0,13,16,3,"#392d41");
  if (phase && side!=="bottom" && side!=="top") {
    const paths = {head:[[0,9],[1,10],[2,11],[2,12],[3,13]], body:[[3,3],[4,4],[4,6],[5,7],[6,8],[6,9],[7,10],[8,10],[9,11]],
      arm:[[5,6],[6,7],[7,8],[7,9],[8,10],[9,11],[8,12],[8,13]],leg:[[11,3],[10,4],[10,5],[9,6],[9,7],[8,8]]};
    for (const [i,[a,y]] of paths[part].entries()) {
      if (part==="leg" && phase<3) break;
      const x=side==="left"||side==="back"?15-a:a;
      P.rect(x-1,y,3,1,"#21152999");
      P.rect(x,y,1,1,i%3===1&&phase===4?"#ffd0ff":spark);
    }
    if (part==="body" && phase>1 && side==="front") {
      P.rect(2,2,2,10,spark); P.rect(12,2,2,10,spark); P.rect(7,6,2,3,"#dcb1df");
    }
  }
};

export function reignDetails() {
  const part=(name,parent,size,pivot,paint,extra={})=>({name,parent,size,pivot,off:[0,0,0],paint:{all:paint},...extra});
  const edge=(P,_,v)=> { const [,hair,,,spark]=palette(v); P.fill([hair]); P.rect(0,2,16,2,spark); };
  const hair=(P,_,v)=>P.fill([palette(v)[1]]);
  const eyes=P=>P.fill(["#ffffff"]);
  return [
    part("hairCap","head",[8.3,1.25,8.15],[0,3.6,-.05],hair),
    part("hairBack","head",[7.5,3.75,1],[0,1.9,-3.86],hair),
    part("eyeR","head",[2.02,1.02,.22],[-2, .51,4.02],eyes,{fullbright:true}),
    part("eyeL","head",[2.02,1.02,.22],[2, .51,4.02],eyes,{fullbright:true}),
    part("kingBand","head",[8.75,1.12,8.75],[0,3.62,0],edge,{reignCrown:true}),
    ...[-1,0,1].map(x=>part("kingPeak"+x,"head",[1.38,x?1.65:2.28,1],[x*3,4.72,4.3],edge,{reignCrown:true})),
    part("kingMantle","body",[8.8,11.8,.7],[0,0,-2.38],edge,{reignMantle:true}),
    ...["R","L"].map(s=>part("kingShoulder"+s,"arm"+s,[4.65,2.4,4.65],[0,4.3,0],edge,{reignMantle:true})),
  ];
}
