import { B, CHUNK, HEIGHT, SEA, SOLID, I, make, metaOf } from "./blocks.js";
import { hash3, rng } from "./noise.js";

export const GATEWAY_LAYOUT = 1;
const RADIUS = 23;
const HALF_OPENING = 2;
const OPEN_HEIGHT = 8;
const ACTIVATION_MS = 2400;
const idx = (x, y, z) => x + CHUNK * z + y * CHUNK * CHUNK;
const overlaps = (a, b) => a.x0 <= b.x1 && a.x1 >= b.x0 && a.z0 <= b.z1 && a.z1 >= b.z0;
const chunk = c => Math.floor(c / CHUNK);
const chunkKey = (x, z) => x + "," + z;

export function protectedGatewayChunks(data) {
  const occupied = new Set([...(data.visited || []), ...Object.keys(data.mods || {}), ...Object.keys(data.entities || {})]);
  for (const [key] of data.containers || []) {
    const [x, , z] = String(key).split(",").map(Number);
    if (Number.isFinite(x) && Number.isFinite(z)) occupied.add(chunkKey(chunk(x), chunk(z)));
  }
  return occupied;
}

export function planGateway(gen, data, worldId) {
  const occupied = protectedGatewayChunks(data);
  const rand = rng(gen.seed ^ 0x349a6f6e);
  const spawn = gen.findSpawn();
  for (let attempt = 0; attempt < 240; attempt++) {
    const angle = rand() * Math.PI * 2;
    const distance = 200 + attempt * 4 + rand() * 150;
    const x = Math.round(spawn.x + Math.cos(angle) * distance);
    const z = Math.round(spawn.z + Math.sin(angle) * distance);
    const y = gen.column(x, z).h;
    if (y <= SEA + 2 || y > HEIGHT - 20) continue;
    const bounds = { x0: x - RADIUS, x1: x + RADIUS, z0: z - RADIUS, z1: z + RADIUS };
    if (gen.strongholds.some(s => Math.max(Math.abs(s.x - x), Math.abs(s.z - z)) < 105)) continue;
    const reservations = [...(gen.stamps || []), gen.grandCapital].filter(Boolean);
    if (reservations.some(s => overlaps(bounds, { x0: s.x - 5, z0: s.z - 5, x1: s.x + s.size + 4, z1: s.z + s.size + 4 }))) continue;
    if (gen.structuresNear(x, z).some(s => overlaps(bounds, { x0: s.x0, z0: s.z0, x1: s.x0 + s.w, z1: s.z0 + s.d }))) continue;
    let fits = true;
    for (let cx = chunk(bounds.x0); cx <= chunk(bounds.x1) && fits; cx++) for (let cz = chunk(bounds.z0); cz <= chunk(bounds.z1); cz++) {
      if (occupied.has(chunkKey(cx, cz)) || gen.villagePiece(cx, cz)) { fits = false; break; }
    }
    if (!fits) continue;
    for (let dx = -RADIUS; dx <= RADIUS && fits; dx += 6) for (let dz = -RADIUS; dz <= RADIUS; dz += 6) {
      const h = gen.column(x + dx, z + dz).h;
      if (h <= SEA - 3 || Math.abs(h - y) > 17) { fits = false; break; }
    }
    if (!fits) continue;
    return { layout: GATEWAY_LAYOUT, worldId, x, y, z, socketed: false };
  }
  return null;
}

export function validGateway(gate, worldId) {
  return !!gate && gate.layout === GATEWAY_LAYOUT && gate.worldId === worldId &&
    Number.isSafeInteger(gate.x) && Math.abs(gate.x) <= 100000 && Number.isSafeInteger(gate.z) && Math.abs(gate.z) <= 100000 &&
    Number.isInteger(gate.y) && gate.y > 20 && gate.y < HEIGHT - 13 && typeof gate.socketed === "boolean" &&
    (gate.opensAt === undefined || Number.isFinite(gate.opensAt) && gate.opensAt >= 0);
}

export function gatewayPoints({ x, y, z }) {
  return {
    arch: { x, y: y - 10, z: z - 8 },
    pedestal: { x: x + 5, y: y - 9, z: z - 2 },
    landing: { x: x + 0.5, y: y - 9, z: z - 3.5 },
    entrance: { x: x + 0.5, y: y + 1, z: z + 16.5 },
  };
}

function openingHalf(y) { return y === OPEN_HEIGHT ? HALF_OPENING - 1 : HALF_OPENING; }

function frameCells(arch) {
  const cells = [];
  for (let x = -HALF_OPENING; x <= HALF_OPENING; x++) cells.push([arch.x + x, arch.y, arch.z]);
  for (let y = 1; y <= OPEN_HEIGHT; y++) {
    const side = openingHalf(y) + 1;
    cells.push([arch.x - side, arch.y + y, arch.z], [arch.x + side, arch.y + y, arch.z]);
  }
  for (let x = -HALF_OPENING; x <= HALF_OPENING; x++) cells.push([arch.x + x, arch.y + OPEN_HEIGHT + 1, arch.z]);
  return cells;
}

export function gatewayFrameCell(arch,x,y,z) {
  return frameCells(arch).some(([a,b,c])=>x===a && y===b && z===c);
}

function openingCells(arch) {
  const cells = [];
  for (let y = 1; y <= OPEN_HEIGHT; y++) for (let x = -openingHalf(y); x <= openingHalf(y); x++) cells.push([arch.x + x, arch.y + y, arch.z]);
  return cells;
}

export function frameReady(world, arch) {
  return frameCells(arch).every(cell => world.id(...cell) === B.OBSIDIAN) &&
    openingCells(arch).every(cell => [B.AIR, B.FORSAKEN_VEIL].includes(world.id(...cell)));
}

export function atGateway(arch, x, y, z) {
  const height = y - arch.y;
  return z === arch.z && height >= 1 && height <= OPEN_HEIGHT && Math.abs(x - arch.x) <= openingHalf(height);
}

export function canArrive(world, { x, y, z }) {
  const bx = Math.floor(x), by = Math.floor(y), bz = Math.floor(z);
  if (!world.isLoaded(bx, bz) || !SOLID[world.id(bx, by - 1, bz)] || world.id(bx, by - 1, bz) === B.MAGMA) return false;
  for (const h of [by, by + 1]) {
    const id = world.id(bx, h, bz);
    if (SOLID[id] || [B.LAVA, B.WATER, B.FIRE, B.FORSAKEN_VEIL, B.PORTAL, B.END_PORTAL].includes(id)) return false;
  }
  return true;
}

export function nearbyLanding(world, center, radius) {
  if (canArrive(world, center)) return { x: center.x, y: center.y, z: center.z };
  for (let r = 1; r <= radius; r++) for (let dz = -r; dz <= r; dz++) for (let dx = -r; dx <= r; dx++) {
    if (Math.max(Math.abs(dx), Math.abs(dz)) !== r) continue;
    for (const dy of [0, 1, -1]) {
      const pos = { x: Math.floor(center.x) + dx + 0.5, y: Math.floor(center.y) + dy, z: Math.floor(center.z) + dz + 0.5 };
      if (canArrive(world, pos)) return pos;
    }
  }
  return null;
}

function archDetails(put, arch, active) {
  const { x, y, z } = arch;
  for (let dx = -6; dx <= 6; dx++) for (let h = 0; h <= 12; h++) {
    if (Math.abs(dx) + Math.max(0, h - 8) > 8 || h > 9 && Math.abs(dx) > 11 - h) continue;
    if (h >= 1 && h <= OPEN_HEIGHT && Math.abs(dx) <= openingHalf(h)) continue;
    const material = h <= 1 || Math.abs(dx) === 5 ? B.FORSAKEN_BRICKS : (dx + h) % 4 === 0 ? B.FORSAKEN_CRACKED : B.FORSAKEN_STONE;
    put(x + dx, y + h, z, material);
    if (Math.abs(dx) === 5 && h <= 6 || h === 9 && Math.abs(dx) <= 4) put(x + dx, y + h, z + 1, material);
  }
  for (const cell of frameCells(arch)) put(...cell, B.OBSIDIAN);
  for (const d of [-1, 1]) {
    for (let h = 1; h <= 7; h++) {
      put(x + d * 5, y + h, z + 2, h % 3 === 0 ? B.BLACKSTONE_BRICKS : B.FORSAKEN_BRICKS);
      if (h < 3 || h === 7) put(x + d * 6, y + h, z + 2, B.FORSAKEN_SLAB);
      if (h >= 3 && h <= 6) put(x + d * 7, y + h, z, B.IRON_BARS);
    }
    for (let h = 8; h <= 11; h++) {
      const shoulder = h === 11 ? 2 : h === 10 ? 3 : 4;
      put(x + d * shoulder, y + h, z + 1, B.FORSAKEN_RUNE);
      put(x + d * (shoulder + 1), y + h, z + 1, B.FORSAKEN_BRICKS);
    }
    put(x + d * 4, y + 11, z, B.SCARLET_CLUSTER);
  }
  for (const side of [-1, 1]) {
    for (let h = 2; h <= 6; h++) put(x + side * 6, y + h, z, B.BLACKSTONE_BRICKS);
    put(x + side * 6, y + 7, z, B.FORSAKEN_SLAB);
    put(x + side * 7, y + 1, z + 2, B.VIOLET_CLUSTER);
    put(x + side * 5, y + 6, z + 3, make(B.FORSAKEN_BANNER, 0));
  }
  put(x, y + 10, z + 1, make(B.FORSAKEN_EYE, Number(active)));
  if (active) for (const cell of openingCells(arch)) put(...cell, B.FORSAKEN_VEIL);
}

// Applies to the existing Generator's bounded stamp pass. All writes are clipped to
// their owning chunk. The ruin retains its original anchor when future wings are added.
export function strongholdStamp(site) {
  const { x, y, z } = site;
  const { arch, pedestal } = gatewayPoints(site);
  return {
    x: x - RADIUS, z: z - RADIUS, size: 2 * RADIUS + 1,
    apply(gen, data, x0, z0) {
      const active = gatewayOpen(site, Date.now());
      const put = (wx, yy, wz, value) => {
        if (wx >= x0 && wx < x0 + CHUNK && wz >= z0 && wz < z0 + CHUNK && yy > 0 && yy < HEIGHT - 1) data[idx(wx - x0, yy, wz - z0)] = value;
      };
      for (let lz = 0; lz < CHUNK; lz++) for (let lx = 0; lx < CHUNK; lx++) {
        const wx = x0 + lx, wz = z0 + lz, dx = wx - x, dz = wz - z;
        const ax = Math.abs(dx), az = Math.abs(dz), d = Math.max(ax, az);
        if (d > RADIUS) continue;
        const column = gen.column(wx, wz).h;
        const ground = Math.round(y + (column - y) * Math.max(0, (d - 16) / (RADIUS - 16)));
        const brick = (h, salt = 14) => hash3(gen.seed, wx, h + salt, wz) < 0.25 ? B.FORSAKEN_CRACKED : B.FORSAKEN_BRICKS;
        for (let h = Math.min(ground - 3, column - 2); h <= Math.max(column, ground) + 11; h++) {
          const top = ax <= 2 || az <= 2 ? (hash3(gen.seed, wx, 47, wz) < 0.22 ? B.FORSAKEN_RUNE : B.COBBLE)
            : hash3(gen.seed, wx, 19, wz) < 0.27 ? B.ASH_SOIL : B.GRASS;
          put(wx, h, wz, h > ground ? B.AIR : h === ground ? top : B.DIRT);
        }
        // Outer walls with missing stones, a tall open gate, and varied tower silhouettes.
        const tower = Math.abs(ax - 13) <= 3 && Math.abs(az - 12) <= 3;
        if (tower) {
          const wall = Math.abs(ax - 13) === 3 || Math.abs(az - 12) === 3;
          const height = dx * dz > 0 ? 12 : 9;
          for (let h = 1; h <= height + 1; h++) {
            const slit = h >= 4 && h <= 6 && (ax === 13 || az === 12);
            if (wall && !slit && (h <= height || (wx + wz) % 2 === 0) || h === height - 1 || h === 3 && !wall) put(wx, y + h, wz, brick(h));
          }
          const parapet = Math.max(Math.abs(ax - 13), Math.abs(az - 12));
          if (parapet === 3 && (dx + dz) % 2 === 0) put(wx, y + height + 2, wz, B.FORSAKEN_SLAB);
          if (parapet === 3 && ax === 13 && az === 15) put(wx, y + 7, wz + Math.sign(dz), make(B.FORSAKEN_BANNER, dz > 0 ? 0 : 2));
          if (parapet === 2 && (ax + az) % 2 === 0) put(wx, y + height, wz, B.LANTERN);
          if (wall && ax === 13 && az === 9) for (let h = 1; h <= 2; h++) put(wx, y + h, wz, B.AIR);
          if (!wall && ax === 14 && az === 13) for (let h = 1; h <= height; h++) put(wx, y + h, wz, make(B.LADDER, dx > 0 ? 1 : 3));
        } else if ((ax === 15 && az <= 12 || az === 13 && ax <= 13) && !(dz > 0 && ax < 3)) {
          const broken = hash3(gen.seed, wx, 77, wz);
          for (let h = 1; h <= 3 + Math.floor(broken * 4); h++) put(wx, y + h, wz, brick(h));
          if ((wx + wz) % 3 === 0) put(wx, y + 5, wz, B.FORSAKEN_WALL);
        }
        // The chapel, stair enclosure, and open-air entrance to the chamber.
        if (ax <= 7 && dz >= -12 && dz <= 7) {
          const edge = ax === 7 || dz === -12 || dz === 7;
          for (let h = 1; h <= 6; h++) {
            const doorway = dz === 7 && ax <= 2 && h <= 4;
            const window = ax === 7 && (dz + 14) % 4 === 0 && h >= 3 && h <= 5;
            if (edge && !doorway) put(wx, y + h, wz, window ? B.FORSAKEN_PANE : brick(h));
          }
          if (ax >= 4 || dz < -7) put(wx, y + 7 + Math.floor((7 - ax) / 2), wz, B.ROOF_TILES);
          if (ax === 5 && az % 4 === 0) put(wx, y + 1, wz, B.LANTERN);
        }
        // Eleven shallow steps reach the chamber from the chapel aisle. Undercut
        // their roof line so a standing player never climbs into the surface.
        const stair = ax <= 2 && dz >= -1 && dz <= 10;
        if (stair) {
          const h = Math.min(y, arch.y + Math.max(0, dz));
          for (let yy = h; yy <= y + 2; yy++) put(wx, yy, wz, yy === h ? brick(yy) : B.AIR);
          if (ax === 2 && dz % 3 === 0) put(wx, h + 1, wz, B.LANTERN);
        }
        if (ax <= 9 && dz >= -14 && dz <= 0) {
          const edge = ax === 9 || dz === -14 || dz === 0 && ax > 2;
          for (let h = -1; h <= 13; h++) {
            if (stair && h > 0) continue;
            const pillar = ax === 8 && dz % 4 === 0;
            let block = h === 0 ? (ax <= 2 && dz % 2 === 0 ? B.FORSAKEN_RUNE : brick(h))
              : edge || pillar || h < 0 || h >= 11 ? brick(h) : B.AIR;
            if (h === 1 && ax === 7 && dz % 4 === 0) block = dz % 8 === 0 ? B.VIOLET_LAMP : B.LANTERN;
            if (h === 1 && ax === 8 && (dz + 1) % 4 === 0) block = B.VIOLET_CLUSTER;
            put(wx, arch.y + h, wz, block);
          }
        }
        if (d >= 17 && d < 20 && hash3(gen.seed, wx, 81, wz) > 0.965) put(wx, ground + 1, wz, B.DEAD_BUSH);
      }
      archDetails(put, arch, active);
      put(pedestal.x, pedestal.y, pedestal.z, make(B.FORSAKEN_SOCKET, Number(active)));
    },
  };
}

export function illuminateGateway(world, arch, pedestal, active) {
  world.set(pedestal.x, pedestal.y, pedestal.z, make(B.FORSAKEN_SOCKET, Number(active)));
  world.set(arch.x, arch.y + 10, arch.z + 1, make(B.FORSAKEN_EYE, Number(active)));
  writeGatewayVeil(world,arch,active);
}
export function writeGatewayVeil(world,arch,active) {
  for (const cell of openingCells(arch)) {
    const id = world.id(...cell);
    if (active && id === B.AIR || !active && id === B.FORSAKEN_VEIL) world.set(...cell, active ? B.FORSAKEN_VEIL : B.AIR);
  }
}

export function socketGateway(world, gate, slot, now, creative) {
  const { arch, pedestal } = gatewayPoints(gate);
  if (world.id(pedestal.x, pedestal.y, pedestal.z) !== B.FORSAKEN_SOCKET || !frameReady(world, arch)) return "damaged";
  if (gate.socketed) return "active";
  if (!creative && (slot?.id !== I.PALE_LANTERN || slot.n < 1)) return "lantern";
  gate.socketed = true;
  gate.opensAt = now + ACTIVATION_MS;
  return "opening";
}

export function gatewayOpen(gate, now) { return gate.socketed && now >= (gate.opensAt || 0); }

export function gatewayLit(world, { x, y, z }) {
  return !!(metaOf(world.get(x, y, z)) & 1);
}

export function sanctuaryPoints({ x, y, z }) {
  return {
    arch: { x, y, z: z - 7 },
    landing: { x: x + 0.5, y: y + 1, z: z + 1.5, yaw: 0 },
    journal: { x: x - 7, y: y + 1, z: z + 4 },
    ward: { x, y: y + 1, z, r: 20 },
  };
}

export function buildSanctuary(put, site) {
  const { x, y, z } = site;
  const { arch, journal } = sanctuaryPoints(site);
  for (let dz = -10; dz <= 10; dz++) for (let dx = -12; dx <= 12; dx++) {
    const outer = Math.abs(dx) === 12 || Math.abs(dz) === 10;
    put(x + dx, y, z + dz, dx % 4 === 0 && dz % 4 === 0 ? B.FORSAKEN_RUNE : B.FORSAKEN_BRICKS);
    if (outer && Math.abs(dx) > 2 && (dx + dz) % 3 !== 0) put(x + dx, y + 1, z + dz, B.FORSAKEN_WALL);
    if (Math.abs(dx) === 10 && Math.abs(dz) === 8) {
      for (let h = 1; h <= 3; h++) put(x + dx, y + h, z + dz, B.FORSAKEN_CRACKED);
      put(x + dx, y + 4, z + dz, B.LANTERN);
    }
    if (dx < -4 && dx > -12 && dz >= 0 && dz <= 8) {
      const wall = dx === -11 || dx === -5 || dz === 0 || dz === 8;
      if (wall) for (let h = 1; h <= 4; h++) {
        if (dx === -5 && dz >= 3 && dz <= 5 && h < 4) continue;
        put(x + dx, y + h, z + dz, h === 3 && dz % 2 === 0 ? B.FORSAKEN_GLASS : B.DEADWOOD_PLANKS);
      }
      put(x + dx, y + 5 + (3 - Math.abs(dx + 8)), z + dz, B.ROOF_TILES);
      if (dz === 1 && dx <= -8) put(x + dx, y + 1, z + dz, B.BOOKSHELF);
    }
  }
  for (const d of [-1, 1]) {
    put(x + d * 6, y + 1, z - 3, B.SCARLET_CLUSTER);
    put(x + d * 7, y + 1, z - 5, B.VIOLET_CLUSTER);
    put(x + d * 8, y + 1, z - 1, B.CRIMSON_LAMP);
    put(x + d * 9, y + 1, z - 1, B.OAK_FENCE);
  }
  put(x - 9, y + 1, z + 6, B.TABLE);
  put(x - 8, y + 1, z + 6, B.MAP_TABLE);
  put(x - 10, y + 1, z + 3, B.PALE_LAMP);
  put(x - 10, y + 1, z + 7, B.RETURN_GATE);
  put(x + 6, y + 1, z + 3, B.WARD_STONE);
  put(journal.x, journal.y, journal.z, B.NOTE_STAND);
  archDetails(put, arch, true);
}
