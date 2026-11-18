import { B, I, CHUNK, SOLID } from "./blocks.js";
import { KINGDOMS_GEN, LANTERN_VALE_SEED } from "./lantern-vale.js";

import { VILLAGE_OVERHAUL_GEN } from "./village-overhaul.js";
import { stonehavenCovers } from "./stonehaven.js";

const FESTIVALS = [
  { name: "Spring Blossom Fair", colors: [0xee8bab, 0xffebba, 0x79bc82], item: I.HONEY_BOTTLE, quantity: 2, price: 1 },
  { name: "Summer Sun Market", colors: [0xffcd50, 0x40a6ad, 0xffeee0], item: I.COOKED_MINNOW, quantity: 5, price: 1 },
  { name: "Autumn Harvest Festival", colors: [0xe47c32, 0xb34537, 0xffce60], item: I.BREAD, quantity: 8, price: 1 },
  { name: "Winter Lantern Festival", colors: [0xc1deff, 0x536ac8, 0xffdb7e], item: B.TORCH, quantity: 24, price: 1 }
];
const DAYS_PER_SEASON = 4;
const STOCK = 4;

function schedule(day) {
  if (!Number.isSafeInteger(day) || day < 1) day = 1;
  const season = Math.floor((day - 1) / DAYS_PER_SEASON);
  const active = day % DAYS_PER_SEASON === 2;
  const nextDay = day + ((2 - day % DAYS_PER_SEASON + DAYS_PER_SEASON) % DAYS_PER_SEASON);
  const upcoming = FESTIVALS[Math.floor((nextDay - 1) / DAYS_PER_SEASON) % FESTIVALS.length];
  return { day, active, event: FESTIVALS[season % FESTIVALS.length], nextDay, upcoming };
}

export function initSettlementFestivals({ THREE, scene, G, UI, Sound }) {
  let world = null, sites = [], stands = new Map(), view = null, lastKey = "", lastDay, announced = "", scan = 0;
  const enabled = () => G.meta?.gen >= VILLAGE_OVERHAUL_GEN || (G.meta?.gen === KINGDOMS_GEN && G.meta.seed === LANTERN_VALE_SEED);
  const current = () => schedule(G.meta?.day);
  const clearView = () => {
    if (!view) return;
    scene.remove(view);
    view.traverse(object => { object.geometry?.dispose(); object.material?.dispose(); });
    view = null;
  };
  function clear() {
    clearView();
    world = null;
    sites = [];
    stands = new Map();
    lastKey = announced = "";
    lastDay = undefined;
    scan = 0;
  }
  function resolveSites() {
    if (world === G.world) return;
    clear();
    world = G.world;
    const village = world.gen.villagePiece?.(33, -3);
    if (village?.lanternVale) sites.push({
      id: "lanternVale", name: "Lantern Vale", x: village.center[0], y: village.y,
      z: village.center[1] + 5, radius: 26, span: 6, width: 2
    });
    const city = world.gen.stonehaven;
    if (city) sites.push({
      id: "stonehaven", name: "Stonehaven", x: Math.floor(city.x), y: city.y - 1,
      z: Math.floor(city.z) - 12, radius: 43, span: 7, width: 6
    });
  }
  const nearby = (x, z) => sites.find(s => Math.abs(x - s.x) < s.radius && Math.abs(z - s.z) < s.radius);
  function regularSite(x, z) {
    if (world.gen.version < VILLAGE_OVERHAUL_GEN) return null;
    const piece = world.gen.villagePiece(Math.floor(x / CHUNK), Math.floor(z / CHUNK));
    if (!piece?.detailed) return null;
    const [cx, cz] = piece.center;
    const plaza = world.gen.villagePiece(Math.floor(cx / CHUNK), Math.floor(cz / CHUNK));
    if (!plaza?.detailed || plaza.type !== "plaza") return null;
    return { id: "village:" + cx + "," + cz, name: "the village", x: cx, y: plaza.y, z: cz + 5, radius: 27, span: 6, width: 2 };
  }
  function merchantSite(e) {
    if (!enabled() || G.dim !== "overworld" || G.guest || G.spectator ||
        !e?.def.villager || e.dead || e.gone || !e.home || !G.player || !G.world) return null;
    resolveSites();
    const [x, , z] = e.home;
    if (stonehavenCovers(world.gen, x, z)) return sites.find(s => s.id === "stonehaven");
    return nearby(x, z) || regularSite(x, z);
  }
  function offer(e) {
    const site = merchantSite(e);
    if (!site || (site.id === "stonehaven" ? !stonehavenCovers(world.gen, e.pos.x, e.pos.z) :
      Math.abs(e.pos.x - site.x) >= site.radius || Math.abs(e.pos.z - site.z) >= site.radius)) return null;
    const { day, active, event } = current();
    if (!active || Math.hypot(e.pos.x - G.player.pos.x, e.pos.y - G.player.pos.y, e.pos.z - G.player.pos.z) > 6) return null;
    const record = G.story.festivals?.[site.id];
    const used = record?.day === day && Number.isInteger(record.used) ? Math.max(0, Math.min(STOCK, record.used)) : 0;
    return { site, day, ...event, remaining: STOCK - used };
  }
  function buy(e) {
    if (G.panelKind !== "trade" || G.panelCtx !== e?.uid) return;
    const sale = offer(e);
    if (!sale) { UI.refreshPanel(); return; }
    const { inv } = G;
    const error = !sale.remaining ? "The festival market is sold out today." :
      inv.count(I.JADE) < sale.price ? "You need Jade for the festival offer." :
      !inv.roomFor(sale.item, sale.quantity) ? "Make room in your inventory first." : "";
    if (error) { Sound.error(); UI.toast(error, "bad"); return; }
    inv.remove(I.JADE, sale.price);
    inv.add(sale.item, sale.quantity);
    if (!G.story.festivals || typeof G.story.festivals !== "object" || Array.isArray(G.story.festivals)) G.story.festivals = {};
    G.story.festivals[sale.site.id] = { day: sale.day, used: STOCK - sale.remaining + 1 };
    G.hudDirty = true;
    Sound.craft();
    UI.refreshPanel();
  }
  function gatheringPoint(e) {
    const site = merchantSite(e);
    if (!site || !current().active || G.time > .52) return null;
    const ring = stands.get(site.id);
    if (!ring?.length) return null;
    const hash = Math.abs(Math.floor(e.home[0]) * 31 + Math.floor(e.home[2]));
    return ring[hash % ring.length];
  }
  function air(x, y, z) {
    return world.isLoaded(x, z) && world.id(x, y, z) === B.AIR;
  }
  function ground(x, y, z) {
    return world.isLoaded(x, z) && SOLID[world.id(x, y, z)] === 1;
  }
  function calculateStands(site) {
    const points = [];
    for (const dz of [-1, 0, 1]) for (const dx of [-site.width, 0, site.width]) {
      const x = site.x + dx, z = site.z + dz;
      if (ground(x, site.y, z) && air(x, site.y + 1, z) && air(x, site.y + 2, z)) {
        points.push({ x: x + .5, y: site.y + 1, z: z + .5 });
      }
    }
    return points;
  }
  function clearSpace(site) {
    const { x, y, z, span } = site;
    if (![-span, span].every(dx => ground(x + dx, y, z))) return false;
    for (let dx = -span; dx <= span; dx++) {
      if (!air(x + dx, y + 3, z) || !air(x + dx, y + 4, z)) return false;
    }
    for (const dx of [-span, span]) {
      if (!air(x + dx, y + 1, z) || !air(x + dx, y + 2, z)) return false;
    }
    return true;
  }
  function buildView(site, event) {
    const { x, y, z, span } = site;
    view = new THREE.Group();
    view.name = "settlement-festival";
    function box(w, h, d, color, x, y, z) {
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshBasicMaterial({ color }));
      mesh.position.set(x, y, z);
      view.add(mesh);
    }
    for (const dx of [-span, span]) box(.12, 3.65, .12, 0x614231, x + dx + .5, y + 2.83, z + .5);
    box(span * 2, .035, .035, 0x785d40, x + .5, y + 4.5, z + .5);
    const pennants = new THREE.BufferGeometry();
    const vertices = [], colors = [], color = new THREE.Color();
    for (let i = 0; i < span * 2 - 1; i++) {
      const left = x - span + 1 + i;
      vertices.push(left + .12, y + 4.47, z + .5, left + .88, y + 4.47, z + .5, left + .5, y + 3.85, z + .5);
      color.setHex(event.colors[i % event.colors.length]);
      for (let v = 0; v < 3; v++) colors.push(color.r, color.g, color.b);
    }
    pennants.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
    pennants.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
    view.add(new THREE.Mesh(pennants, new THREE.MeshBasicMaterial({ side: THREE.DoubleSide, vertexColors: true })));
    scene.add(view);
  }
  function update(dt) {
    if (!enabled() || G.dim !== "overworld" || !G.world || !G.player || G.guest) {
      if (world) clear();
      return;
    }
    resolveSites();
    const { day, active, event } = current();
    if (day !== lastDay) {
      lastDay = day;
      scan = 0;
      if (G.panelKind === "trade" || G.panelKind === "xmap") UI.refreshPanel();
    }
    if ((scan -= dt) > 0) return;
    scan = .25;
    const p = G.player.pos;
    const local = active && (nearby(p.x, p.z) || regularSite(p.x, p.z));
    const site = local || sites.find(s => Math.hypot(p.x - s.x, p.z - s.z) < 55);
    const key = active && site && clearSpace(site) ? site.id + ":" + day : "";
    if (key !== lastKey) {
      lastKey = key;
      clearView();
      if (key) buildView(site, event);
    }
    stands.clear();
    if (active && site) stands.set(site.id, calculateStands(site));
    if (local && announced !== local.id + day && G.state === "play") {
      announced = local.id + day;
      UI.toast(event.name + " at " + local.name, "good");
    }
  }
  function calendar() {
    if (!enabled()) return "";
    const { active, event, upcoming, nextDay } = current();
    return active ? event.name + " is open today." : upcoming.name + " opens on day " + nextDay + ".";
  }
  return { update, clear, calendar, offer, buy, gatheringPoint };
}
