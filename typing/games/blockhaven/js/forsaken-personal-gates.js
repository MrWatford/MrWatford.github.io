import { B, HEIGHT, I, make } from "./blocks.js";
import { atGateway, frameReady, nearbyLanding, writeGatewayVeil } from "./forsaken-gateway.js";

export const PERSONAL_GATE_LIMIT = 12;
export const PERSONAL_GATE_GUIDE = "Build a north-facing Forsaken arch in the east–west plane. Lay five obsidian across the base, with a five-wide, eight-high opening. Narrow the eighth row to three blocks, then cap the arch with five obsidian. Place the Personal Forsaken Pedestal five blocks east, one up and six south of the base center. Use a Pale Lantern on it.";
export const personalGateKey = ({x,y,z}) => x+","+y+","+z;
export function personalGatePoints({x,y,z}) {
  const arch={x:x-5,y:y-1,z:z-6};
  return {arch,landing:{x:arch.x+.5,y:arch.y+1,z:arch.z+2.5}};
}
export function validPersonalGates(gates) {
  return Array.isArray(gates) && gates.length<=PERSONAL_GATE_LIMIT &&
    new Set(gates.map(g=>g&&personalGateKey(g))).size===gates.length &&
    gates.every(g=>g?.v===1 && Number.isSafeInteger(g.x) && Math.abs(g.x)<3e7 &&
      Number.isSafeInteger(g.z) && Math.abs(g.z)<3e7 && Number.isInteger(g.y) && g.y>=3 && g.y<HEIGHT-9 &&
      Number.isSafeInteger(g.lit) && g.lit>0) &&
    gates.every((g,i)=>!conflictsPersonalGate(personalGatePoints(g).arch,gates.slice(0,i)));
}
const overlap = (a,b)=>Math.abs(a.x-b.x)<=8 && Math.abs(a.z-b.z)<=2 && Math.abs(a.y-b.y)<=10;
export function conflictsPersonalGate(arch,gates,natural) {
  return !!natural && overlap(arch,natural) || gates.some(g=>overlap(arch,personalGatePoints(g).arch));
}
export function personalGateIntact(world, gate) {
  const {arch}=personalGatePoints(gate);
  return world.id(gate.x,gate.y,gate.z)===B.PERSONAL_FORSAKEN_SOCKET && frameReady(world,arch);
}
export function activatePersonalGate(world, gates, pedestal, slot, natural, now) {
  const gate=gates.find(g=>personalGateKey(g)===personalGateKey(pedestal));
  const proposal={...pedestal,v:1,lit:now};
  if (!validPersonalGates([proposal]) || !personalGateIntact(world,proposal)) return "frame";
  const {arch,landing}=personalGatePoints(proposal);
  if (!nearbyLanding(world,landing,3)) return "landing";
  if (!gate && (gates.length>=PERSONAL_GATE_LIMIT || conflictsPersonalGate(arch,gates,natural))) return "space";
  if (!gate && (slot?.id!==I.PALE_LANTERN || slot.n<1)) return "lantern";
  if (!gate) gates.push(proposal);
  writeGatewayVeil(world,arch,true);
  world.set(proposal.x,proposal.y,proposal.z,make(B.PERSONAL_FORSAKEN_SOCKET,1));
  return gate ? "relit" : "opened";
}
export function personalGateAt(gates,x,y,z) {
  return gates.find(g=>atGateway(personalGatePoints(g).arch,x,y,z));
}
