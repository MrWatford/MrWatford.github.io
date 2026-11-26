import { B, CHUNK, HEIGHT, idOf } from "./blocks.js";
import { FALLEN_SITES, LAIRS, fallenPoints } from "./forsaken-fallen.js";
import { fortressPoints } from "./forsaken-fortress.js";
import { sanctuaryPoints } from "./forsaken-gateway.js";
import { KINGDOM_BIOMES, KINGDOM_EDGE } from "./forsaken-kingdom.js";

const TERRAIN = {
  woods: "#60536a", wastelands: "#984e55", kingdom: "#777060",
  caverns: "#524a7c", shattered: "#7b5d85", vale: "#5a4153",
  core: "#626572", road: "#c5a28c", void: "#1d1728",
};
const MARKER = { refuge: "#86d0ef", lair: "#f5b4d7", fortress: "#ff9a86", settlement: "#f2cf9f", legacy: "#d6cedf" };
const SIZE = 192;
const MARKER_OFFSETS = [[0, 0], [0, -25], [25, 0], [0, 25], [-25, 0], [25, -25], [-25, 25], [-25, -25], [25, 25]];
const terrainCache = new WeakMap();

export function realmMapLocations(gen, data, alternatives = []) {
  const locations = [];
  const add = (id, title, point, kind, note = "") => {
    if (point) locations.push({ id, title, x: point.x, z: point.z, color: MARKER[kind], note });
  };
  const sanctuary = gen.kingdom?.layout.sanctuary;
  if (sanctuary) add("sanctuary", "Lantern Ward", sanctuaryPoints(sanctuary).arch, "refuge", "Return gateway");
  if (data?.fortress?.site) add("fortress", "Forsaken Fortress", fortressPoints(data.fortress.site).approach, "fortress", "Bridge entrance");
  for (const [id, def] of Object.entries(LAIRS)) {
    const site = data?.fallen?.sites?.[id];
    const alternate = alternatives.find(place => place.id === id);
    if (site) add(id, def.name, fallenPoints(site).entry, "lair", "Guardian lair entrance");
    else if (alternate) add(id, alternate.where, alternate, "lair", def.name + " alternative");
  }
  for (const [id, site] of Object.entries(data?.fallen?.sites || {})) {
    if (site && Object.hasOwn(FALLEN_SITES, id) && !Object.hasOwn(LAIRS, id)) {
      add(id, FALLEN_SITES[id].name, fallenPoints(site).entry, "settlement", "Settlement entrance");
    }
  }
  for (const place of gen.t.meta.landmarks) add("core-" + place.key, place.name, place, place.key === "refuge" ? "refuge" : "legacy");
  return locations;
}

function terrainColor(gen, x, z) {
  const cx = Math.floor(x / CHUNK), cz = Math.floor(z / CHUNK);
  if (gen.kingdom?.contains(cx, cz)) {
    const column = gen.kingdom.sample(x, z);
    if (column.isRoad) return TERRAIN.road;
    if (column.top < 0) return TERRAIN.void;
    return TERRAIN[column.biome.id];
  }
  const blocks = gen.t.chunks.get(cx + "," + cz);
  if (blocks) {
    const i = x - cx * CHUNK + (z - cz * CHUNK) * CHUNK;
    for (let y = HEIGHT - 1; y >= 0; y--) {
      const id = idOf(blocks[i + y * CHUNK * CHUNK]);
      if (!id) continue;
      if (id === B.GRAVEL) return TERRAIN.road;
      if (id === B.WATER) return "#34465d";
      return y > 48 ? "#797281" : TERRAIN.core;
    }
  }
  return Math.max(Math.abs(x), Math.abs(z)) < 128 ? TERRAIN.core : TERRAIN.void;
}

function background(gen) {
  let terrain = terrainCache.get(gen);
  if (terrain) return terrain;
  terrain = document.createElement("canvas");
  terrain.width = terrain.height = SIZE;
  const ctx = terrain.getContext("2d");
  const step = KINGDOM_EDGE * 2 / SIZE;
  for (let row = 0; row < SIZE; row++) {
    for (let col = 0; col < SIZE; col++) {
      ctx.fillStyle = terrainColor(gen, (col + 0.5) * step - KINGDOM_EDGE, (row + 0.5) * step - KINGDOM_EDGE);
      ctx.fillRect(col, row, 1, 1);
    }
  }
  terrainCache.set(gen, terrain);
  return terrain;
}

function draw(canvas, gen, locations, player, selected) {
  const ctx = canvas.getContext("2d"), size = canvas.width;
  const pixel = coordinate => (coordinate + KINGDOM_EDGE) * size / (2 * KINGDOM_EDGE);
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(background(gen), 0, 0, size, size);
  ctx.strokeStyle = "#eadbe54d";
  ctx.beginPath();
  for (let coordinate = -256; coordinate <= 256; coordinate += 128) {
    const i = pixel(coordinate);
    ctx.moveTo(i, 0); ctx.lineTo(i, size);
    ctx.moveTo(0, i); ctx.lineTo(size, i);
  }
  ctx.stroke();
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = "bold 21px system-ui";
  ctx.fillStyle = "#fff";
  ctx.fillText("▲ N", size / 2, 19);
  ctx.font = "bold 14px system-ui";
  const occupied = [];
  for (const [index, place] of locations.entries()) {
    const x = pixel(place.x), z = pixel(place.z);
    const [dx, dz] = MARKER_OFFSETS.find(([a, b]) => occupied.every(p => Math.hypot(p.x - x - a, p.z - z - b) >= 23)) || MARKER_OFFSETS[0];
    const px = x + dx, pz = z + dz;
    occupied.push({ x: px, z: pz });
    ctx.strokeStyle = "#21202a";
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(x, z); ctx.lineTo(px, pz); ctx.stroke();
    ctx.fillStyle = place.id === selected ? "#fff4a8" : place.color;
    ctx.beginPath(); ctx.arc(px, pz, 11, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = "#241b29";
    ctx.fillText(index + 1, px, pz + 1);
  }
  ctx.save();
  ctx.translate(pixel(player.pos.x), pixel(player.pos.z));
  ctx.rotate(-player.yaw);
  ctx.fillStyle = "#fff7bc";
  ctx.strokeStyle = "#21202a";
  ctx.beginPath(); ctx.moveTo(0, -14); ctx.lineTo(8, 9); ctx.lineTo(0, 5); ctx.lineTo(-8, 9); ctx.closePath();
  ctx.fill(); ctx.stroke(); ctx.restore();
}

export function mountRealmMap(panel, G, click) {
  const gen = G.world.gen;
  const locations = realmMapLocations(gen, G.dimData.forsaken, G.forsaken.fallen.alternatives());
  const canvas = panel.querySelector("canvas");
  panel.querySelector("[data-realm-position]").textContent = `You · X ${Math.floor(G.player.pos.x)}, Z ${Math.floor(G.player.pos.z)}`;
  const legend = panel.querySelector("[data-realm-legend]");
  const swatches = Object.entries(KINGDOM_BIOMES).map(([id, biome]) => [biome.name, TERRAIN[id]]);
  for (const [name, color] of [...swatches, ["Paved roads", TERRAIN.road], ["Void", TERRAIN.void]]) {
    const label = document.createElement("span"), swatch = document.createElement("i");
    swatch.className = "xm-sw";
    swatch.style.background = color;
    label.append(swatch, name);
    legend.append(label);
  }
  const list = panel.querySelector("[data-realm-locations]");
  const buttons = locations.map((place, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "xm-dest";
    const number = document.createElement("b"), label = document.createElement("span"), details = document.createElement("small");
    number.textContent = index + 1;
    details.textContent = `X ${Math.floor(place.x)}, Z ${Math.floor(place.z)}` + (place.note ? " · " + place.note : "");
    label.append(place.title, details);
    button.append(number, label);
    button.onclick = () => {
      G.realmWaypoint = { ...place, hidden: false };
      click();
      render();
    };
    list.append(button);
    return button;
  });
  function render() {
    const selected = G.realmWaypoint?.id;
    buttons.forEach((button, index) => {
      const active = locations[index].id === selected;
      button.classList.toggle("on", active);
      button.setAttribute("aria-pressed", String(active));
    });
    draw(canvas, gen, locations, G.player, selected);
  }
  render();
}
