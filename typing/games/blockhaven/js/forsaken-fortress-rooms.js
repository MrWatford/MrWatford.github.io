// Room shells, circulation and fixed furnishings of the Forsaken Vale fortress.
import { B, I, HEAD, TOP, OPEN, make } from "./blocks.js";
import { newStack } from "./inventory.js";

const dark = B.BLACKSTONE_BRICKS, trim = B.DARKSLATE_BRICKS, rune = B.FORSAKEN_RUNE;
const stair = (direction, block = B.FORSAKEN_STAIRS) => make(block,direction);
const banner = direction => make(B.FORSAKEN_BANNER,direction);
const light = (hanging = false) => make(B.LANTERN,hanging ? 1 : 0);
const eye = make(B.FORSAKEN_EYE,1);

function containerItems(items) {
  const slots = Array(27).fill(null);
  for (const [index,[id,n]] of items.entries()) slots[index] = newStack(id,n);
  return { type: "chest", slots };
}
const frame = (id) => ({ type: "frame", slots: [newStack(id)], rot: 0 });
const painting = () => ({ type: "painting", art: "moon", rx: 0, rz: 1 });
const armoured = (boots = I.IRON_BOOTS) => ({
  type: "stand", slots: [I.IRON_HELMET,I.IRON_CHEST,I.IRON_LEGS,boots].map(id => newStack(id)),
});

export function buildFortressRooms(b) {
  keep(b);
  wings(b);
  underground(b);
}

function keep(b) {
  const { put, box, masonry, furnishing } = b;
  // Layered plinth and keep. The narrow upper edge carries the pitched roof over the nave.
  box(-16,16,-4,18,-24,17,masonry);
  box(-14,14,1,16,-22,15,B.AIR);
  box(-15,15,0,0,-23,17,dark);
  box(-6,6,1,8,16,19,B.AIR);
  box(-5,5,0,0,17,21,rune);
  for (let x=-17; x<=17; x++) {
    const height=28-Math.floor(Math.abs(x)*0.55);
    box(x,x,height,height,-24,18,x%4===0 ? dark : trim);
    if (x%2===0 && x!==0) {
      put(x,height,19,stair(x>0?3:1));
      put(x,height,-25,stair(x>0?3:1));
    }
    box(x,x,18,height-1,17,17,masonry);
    box(x,x,18,height-1,-24,-24,masonry);
  }
  box(-2,2,28,28,-24,18,dark);
  for (const z of [-21,-13,-5,3,11,17]) {
    put(0,29,z,B.FORSAKEN_WALL);
    if (z%3===2) put(0,30,z,B.CRIMSON_LAMP);
  }
  // Gothic ceiling ribs and a taller north-facing window. The side corridors frame the return path.
  for (const z of [14,5,-4,-13,-20]) {
    for (const side of [-1,1]) {
      const x=side*11;
      box(x-1,x+1,0,12,z,z+1,masonry);
      box(x-2,x+2,0,0,z-1,z+2,dark);
      put(x-side*2,3,z,banner(side>0?3:1));
      for (let i=0;i<11;i++) {
        const h=12+Math.floor(Math.sqrt(i+1)*1.5);
        box(side*(10-i),side*(10-i),h,h+1,z,z+1,i%3===0 ? dark : trim);
      }
      box(side*9,side*9,1,3,z,z,trim);
      put(side*9,3,z,B.CRIMSON_LAMP);
    }
    box(0,0,12,17,z,z,B.IRON_BARS);
    for (const x of [-2,0,2]) {
      put(x,11,z,dark); put(x,10,z,light(true));
    }
    box(-1,1,11,11,z,z,B.FORSAKEN_SLAB);
  }
  for (let x=-9;x<=9;x++) {
    const h=17-Math.floor(Math.abs(x)*0.9);
    box(x,x,8,h,-24,-22,B.AIR);
    box(x,x,h+1,h+1,-24,-22,trim);
    if (Math.abs(x)>=7) box(x,x,8,h,-23,-23,B.FORSAKEN_PANE);
  }
  for (const x of [-6,-3,0,3,6]) {
    box(x,x,10,13,17,17,B.RED_STAINED_GLASS);
    if (x!==0) put(x,8,18,banner(0));
  }
  // Entrance hall and paired guard rooms. The large openings let visitors see the room routes.
  box(-3,3,1,1,-7,15,B.RED_CARPET);
  for (const side of [-1,1]) {
    for (const z of [8,13]) {
      const x=side*7;
      put(x,1,z,trim);
      furnishing(x,2,z,make(B.ARMOR_STAND,0),armoured());
      put(x+side,2,z,banner(0));
    }
    const xmin=side<0?-20:12, xmax=side<0?-12:20;
    box(xmin,xmax,0,5,10,17,masonry);
    box(xmin+1,xmax-1,1,4,11,16,B.AIR);
    box(side*12,side*12,1,3,12,14,B.AIR);
    box(xmin,xmax,1,3,15,15,B.AIR);
    const stand=side*15;
    put(stand,1,11,B.TABLE); put(stand,2,11,light());
    put(stand,1,16,B.ANVIL);
    furnishing(side*17,1,11,B.BARREL,containerItems([[B.TORCH,12],[I.BREAD,4]]));
  }
  // Throne, surfaced steps, safe railed channels, and twin paths to the open arena.
  for (let i=0;i<4;i++) {
    const z=-7-i;
    box(-5,5,0,i,z,z,masonry);
    box(-5,5,i+1,i+1,z,z,stair(2));
  }
  box(-6,6,1,4,-18,-11,masonry);
  box(-5,5,4,4,-17,-11,B.RED_WOOL);
  for (const x of [-6,6]) box(x,x,4,4,-17,-11,rune);
  for (const x of [-4,4]) {
    put(x,5,-13,B.FORSAKEN_WALL);
    put(x,6,-13,B.CRIMSON_LAMP);
    box(x,x,8,12,-18,-18,B.RED_STAINED_GLASS);
    put(x,7,-18,B.VIOLET_LAMP);
  }
  box(-2,2,5,5,-16,-14,trim);
  box(-2,2,6,6,-16,-15,B.SCARLET_ORE);
  box(-2,2,7,10,-17,-17,dark);
  box(-1,1,10,11,-17,-17,masonry);
  put(0,10,-16,eye);
  put(0,11,-16,B.PALE_LAMP);
  put(-3,5,-15,rune); put(3,5,-15,rune);
  put(-3,6,-15,B.CRIMSON_LAMP); put(3,6,-15,B.CRIMSON_LAMP);
  put(-1,6,-13,B.RED_CARPET); put(1,6,-13,B.RED_CARPET);
  put(-2,7,-14,B.CRIMSON_LAMP); put(2,7,-14,B.CRIMSON_LAMP);
  put(9,1,-17,B.NOTE_STAND);
  for (const side of [-1,1]) {
    const lane=side*7, gallery=side*12;
    box(lane,lane,-3,-3,-17,-6,B.BASALT);
    box(lane,lane,-2,-2,-17,-6,B.LAVA);
    box(lane,lane,-1,0,-17,-6,B.AIR);
    for (const x of [lane-1,lane+1]) for (let z=-17;z<=-6;z++)
      if (Math.abs(x)!==6 || z<-10) put(x,1,z,B.FORSAKEN_WALL);
    box(gallery-3,gallery+3,7,7,-21,10,dark);
    box(gallery-side*3,gallery-side*3,8,8,-20,10,B.FORSAKEN_WALL);
    for (let k=0;k<7;k++) {
      const z=17-k;
      box(gallery-1,gallery+1,0,k,z,z,masonry);
      box(gallery-1,gallery+1,k+1,k+1,z,z,stair(2));
      box(gallery-1,gallery+1,k+2,k+4,z,z,B.AIR);
    }
    box(gallery-1,gallery+1,8,10,9,10,B.AIR);
    for (const z of [-18,-10,-2,6]) {
      put(gallery,8,z,light());
      put(gallery+side*2,9,z,make(B.FORSAKEN_PANE,0));
    }
    box(side*9-2,side*9+2,1,5,-27,-20,B.AIR);
    box(side*9-2,side*9+2,0,0,-28,-20,rune);
    box(Math.min(side*9,0)-2,Math.max(side*9,0)+2,0,0,-28,-27,rune);
  }
}

function wings(b) {
  const { box, put, masonry, furnishing }=b;
  for (const side of [-1,1]) {
    const midpoint=side*30, a=midpoint-9,c=midpoint+9;
    box(a,c,-3,11,-15,13,masonry);
    box(a+1,c-1,1,9,-14,12,B.AIR);
    box(a+1,c-1,0,0,-14,12,B.DEADWOOD_PLANKS);
    for (let x=a-1;x<=c+1;x++) {
      const h=18-Math.floor(Math.abs(x-midpoint)*0.65);
      box(x,x,h,h,-16,14,x%4===0 ? dark : trim);
      box(x,x,11,h-1,13,13,masonry);
      box(x,x,11,h-1,-15,-15,masonry);
      put(x,h,14,stair(x<midpoint?1:3));
    }
    const inside=midpoint-side*9;
    box(Math.min(inside,side*15),Math.max(inside,side*15),1,4,9,12,B.AIR);
    box(Math.min(inside,side*16),Math.max(inside,side*16),0,0,9,12,dark);
    box(midpoint-2,midpoint+2,1,4,13,13,B.AIR);
    box(midpoint-2,midpoint+2,0,0,13,18,rune);
    for (const z of [-9,-2,5]) {
      for (const x of [a,c]) {
        box(x,x,3,7,z,z+1,B.FORSAKEN_PANE);
        box(x,x,8,8,z-1,z+2,dark);
      }
    }
    for (const z of [-10,-3,4,11]) {
      put(midpoint,9,z,trim); put(midpoint,8,z,light(true));
    }
  }
  for (const x of [25,35]) {
    for (const z of [-10,-4,2,8]) {
      put(x,1,z,make(B.BED,0)); put(x,1,z+1,make(B.BED,HEAD));
      furnishing(x+(x===25?-1:1),1,z,B.BARREL,containerItems([[I.BREAD,3],[I.IRON_INGOT,2]]));
      put(x,1,z-2,B.DEADWOOD_PLANKS); put(x,2,z-2,light());
    }
    for (const z of [-9,-4,1]) furnishing(x,2,z,make(B.ITEM_FRAME,0),frame(z<0 ? I.IRON_SWORD : I.SHIELD));
  }
  box(26,34,0,0,-13,-10,trim);
  for (const x of [27,33]) furnishing(x,1,-12,make(B.ARMOR_STAND,0),armoured());
  put(30,1,-12,B.ANVIL);
  box(23,26,1,3,-13,-13,B.IRON_BARS);
  put(25,1,-13,make(B.IRON_DOOR,OPEN)); put(25,2,-13,make(B.IRON_DOOR,OPEN|TOP));
  put(34,1,10,B.TABLE); put(34,2,10,light());
  put(31,1,9,B.RED_CARPET);
  // Bookshelf bays, a connected reading mezzanine, and the hinged shelf in the north wall.
  box(-38,-22,0,0,-14,12,B.DEADWOOD_PLANKS);
  box(-38,-35,6,6,-12,8,B.DEADWOOD_PLANKS);
  box(-36,-25,6,6,-12,-9,B.DEADWOOD_PLANKS);
  box(-35,-35,7,7,-8,8,B.FORSAKEN_WALL);
  box(-34,-25,7,7,-9,-9,B.FORSAKEN_WALL);
  box(-38,-38,1,9,-12,8,B.BOOKSHELF);
  for (const z of [-10,-3,4]) {
    box(-25,-24,1,4,z-1,z+1,B.BOOKSHELF);
    box(-25,-24,5,5,z-1,z+1,B.DARK_OAK_SLAB);
    put(-26,4,z,light());
  }
  for (const z of [-6,2,8]) {
    for (const x of [-33,-28]) {
      put(x,1,z,stair(0,B.DARK_OAK_STAIRS));
      put(x,1,z+1,B.DEADWOOD_PLANKS);
      put(x,2,z+1,make(B.CANDLE,4));
      put(x,1,z+2,stair(2,B.DARK_OAK_STAIRS));
    }
  }
  box(-36,-36,1,6,9,9,make(B.LADDER,0));
  box(-36,-36,1,6,10,10,B.DEADWOOD_LOG);
  box(-35,-35,6,6,9,9,B.DEADWOOD_PLANKS);
  put(-33,7,-11,B.LECTERN); put(-32,7,-11,light());
  furnishing(-32,3,-12,make(B.PAINTING,2),painting());
  put(-28,1,-5,B.NOTE_STAND);
  box(-33,-27,1,5,-13,-13,B.BOOKSHELF);
  box(-32,-28,0,4,-20,-14,masonry);
  box(-31,-29,1,3,-20,-14,B.AIR);
  put(-29,2,-18,B.VIOLET_LAMP);
  // The lower archive hatch is visible from the corridor and climbs in both directions.
  box(-31,-29,-9,1,-20,-18,B.AIR);
  box(-30,-30,-9,1,-19,-19,make(B.LADDER,0));
  box(-30,-30,-9,1,-18,-18,trim);
  box(-31,-29,0,0,-17,-17,dark);
}

function underground(b) {
  const { box, put, masonry, furnishing }=b;
  box(-34,34,-10,-3,-14,12,masonry);
  box(-32,32,-9,-4,-12,10,B.AIR);
  box(-31,31,-10,-10,-12,10,trim);
  box(-32,32,-10,-10,4,7,rune);
  box(-33,-28,-10,-3,-21,-12,masonry);
  box(-32,-29,-9,-5,-21,-12,B.AIR);
  box(-30,-30,-9,1,-19,-19,make(B.LADDER,0));
  box(-30,-30,-9,-4,-18,-18,trim);
  // The public crypt steps descend from the west courtyard, clear of the wing foundations.
  box(-35,-32,-11,0,13,22,masonry);
  for (let t=0;t<=9;t++) {
    const z=13+t, h=t-9;
    box(-34,-33,h+1,h+4,z,z,B.AIR);
    box(-34,-33,h,h,z,z,stair(0));
  }
  box(-34,-31,-9,-6,10,12,B.AIR);
  box(-34,-31,-10,-10,10,13,rune);
  put(-35,1,22,B.PALE_LAMP); put(-32,1,22,B.PALE_LAMP);
  for (const x of [-27,-21,-16,-9,-4,4,9,14,23,29]) {
    box(x,x,-9,-4,2,2,masonry);
    put(x,-6,3,light(true));
    put(x,-6,-5,x>0 ? B.CRIMSON_LAMP : B.VIOLET_LAMP);
  }
  // Prison cells use real bar models and operable doors, with a walkable service corridor behind them.
  for (const x of [-25,-20,-15,-10]) {
    box(x,x+4,-9,-5,-9,-9,B.IRON_BARS);
    box(x,x,-9,-6,-10,-8,masonry);
    put(x+2,-9,-9,make(B.DOOR,0)); put(x+2,-8,-9,make(B.DOOR,TOP));
    put(x+3,-9,-11,stair(2));
    put(x+2,-9,-10,B.WHITE_CARPET);
    put(x+1,-5,-10,B.IRON_BARS); put(x+1,-6,-10,light(true));
    if (x===-20) put(x+1,-9,-12,B.SKULL);
  }
  box(-27,-7,-10,-10,-12,-12,dark);
  put(-9,-9,-10,B.PALE_LAMP);
  // The workshop is a working room. Its models are block-built, so no mobs tick inside display tanks.
  box(-6,7,-9,-4,-12,-12,masonry);
  for (const x of [-5,2]) {
    const lamp=x<0 ? B.VIOLET_LAMP : B.CRIMSON_LAMP;
    box(x,x+4,-10,-10,-10,-6,dark);
    box(x,x+4,-5,-5,-10,-6,dark);
    for (const z of [-10,-6]) box(x,x+4,-9,-6,z,z,B.GLASS_PANE);
    for (const dx of [0,4]) box(x+dx,x+dx,-9,-6,-9,-7,B.FORSAKEN_PANE);
    put(x+2,-9,-8,lamp);
    box(x+1,x+3,-8,-8,-8,-8,x<0 ? B.DARKSLATE : B.BASALT);
    // Two original carved specimens. No spawn data is attached to the displays.
    if (x<0) {
      put(x+1,-7,-8,B.GREEN_WOOL);
      put(x+2,-7,-8,B.GREEN_WOOL);
      put(x+3,-7,-8,B.GREEN_WOOL);
      put(x+2,-6,-8,eye);
    } else {
      put(x+2,-7,-8,B.OBSIDIAN);
      put(x+2,-8,-7,B.FORSAKEN_EYE);
      put(x+1,-8,-9,B.DARKSLATE);
      put(x+3,-8,-9,B.DARKSLATE);
    }
    put(x+2,-5,-8,lamp);
  }
  for (const x of [-4,0,4]) {
    put(x,-9,0,B.TABLE);
    put(x,-8,0,x===0 ? B.BREWING_STAND : make(B.CANDLE,5));
  }
  put(2,-9,1,make(B.CAULDRON,3)); put(-3,-9,5,B.NOTE_STAND);
  furnishing(5,-7,-11,make(B.ITEM_FRAME,2),frame(B.SCARLET_CLUSTER));
  furnishing(-4,-7,-11,make(B.ITEM_FRAME,2),frame(B.VIOLET_CLUSTER));
  // Vault and an independent eastern escape ladder behind its service aisle.
  box(12,30,-9,-4,-10,-10,masonry);
  box(12,12,-9,-4,-9,3,masonry);
  box(29,29,-9,-4,-9,3,masonry);
  box(12,29,-9,-4,3,3,masonry);
  box(17,21,-9,-6,3,3,B.AIR);
  box(29,29,-9,-6,-2,0,B.AIR);
  box(13,28,-10,-10,-9,2,dark);
  box(18,20,-9,-9,-9,6,B.RED_CARPET);
  for (const [x,item] of [[15,I.IRON_SWORD],[21,I.CROSSBOW],[26,I.SHIELD]]) {
    put(x,-9,-9,dark);
    furnishing(x,-7,-9,make(B.ITEM_FRAME,2),frame(item));
    put(x,-7,-8,light(true));
    put(x,-8,-9,B.OBSIDIAN);
    put(x+1,-9,-9,B.FORSAKEN_SLAB);
  }
  furnishing(15,-9,-6,make(B.CHEST,2),containerItems([[I.GOLD_INGOT,9],[B.VIOLET_CLUSTER,5],[I.ECHO_SHARD,2]]));
  furnishing(25,-9,-6,make(B.CHEST,2),containerItems([[I.JADE,2],[B.SCARLET_CLUSTER,5],[B.OBSIDIAN,8]]));
  furnishing(27,-9,-2,B.BARREL,containerItems([[I.BREAD,7],[B.PALE_LAMP,3],[I.ARROW,18]]));
  put(20,-9,8,B.NOTE_STAND);
  box(31,31,-9,1,9,9,make(B.LADDER,0));
  box(31,31,-9,1,10,10,trim);
  put(32,2,9,B.PALE_LAMP);
}
