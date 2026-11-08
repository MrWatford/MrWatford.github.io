import { B, CHUNK } from "./blocks.js";
import { idx } from "./worldgen.js";

export class ArenaFractures {
  constructor(world, player, arena) {
    this.world = world; this.player = player; this.arena = arena;
    this.cells = new Map(); this.internal = false;
    this.previous = world.onSet;
    this.listener = (...args) => {
      if (!this.internal) this.cells.delete(args.slice(0, 3).join(","));
      if (this.previous) this.previous(...args);
    };
    world.onSet = this.listener;
  }
  fracture(x, z) {
    const w = this.world, a = this.arena, y = a.y - 1;
    const containers = new Set([...w.containers.keys()].map(key => {
      const [x, , z] = key.split(","); return x + "," + z;
    }));
    for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
      if (this.cells.size >= 18) return;
      const bx = Math.floor(x) + dx, bz = Math.floor(z) + dz, radius = Math.hypot(bx - a.x, bz - a.z);
      if (radius < 9 || radius > 24 || Math.abs(bx - a.x) <= 2 || Math.abs(bz - a.z) <= 2) continue;
      const cx = Math.floor(bx / CHUNK), cz = Math.floor(bz / CHUNK), chunk = cx + "," + cz;
      const i = idx(bx - cx * CHUNK, y, bz - cz * CHUNK), key = [bx, y, bz].join(",");
      if (this.cells.has(key) || w.mods.get(chunk)?.has(i) || containers.has(bx + "," + bz) ||
          !w.isLoaded(bx, bz) || w.id(bx, y, bz) !== B.SAND ||
          w.id(bx, y - 1, bz) !== B.SANDSTONE || w.id(bx, y + 1, bz) !== B.AIR ||
          w.id(bx, y + 2, bz) !== B.AIR) continue;
      this.internal = true;
      try {
        if (w.set(bx, y, bz, B.AIR)) this.cells.set(key, { x: bx, y, z: bz, chunk, i, life: 6 });
      } finally { this.internal = false; }
    }
  }
  restore(key, cell) {
    const w = this.world;
    if (w.mods.get(cell.chunk)?.get(cell.i) === B.AIR) {
      const p = this.player;
      if (Math.abs(p.pos.x - cell.x - 0.5) < 0.8 && Math.abs(p.pos.z - cell.z - 0.5) < 0.8 &&
          p.pos.y < cell.y + 1 && p.pos.y > cell.y - 1) {
        if (p.collides(w, p.aabb(p.pos.x, cell.y + 1, p.pos.z))) {
          // A new ceiling can make lifting unsafe. Keep this shallow excavation
          // as a normal saved edit rather than restore a block through the player.
          this.cells.delete(key);
          return;
        }
        p.pos.y = cell.y + 1; p.vel.y = Math.max(0, p.vel.y); p.airTop = null;
      }
      this.internal = true;
      try { w.set(cell.x, cell.y, cell.z, B.SAND); } finally { this.internal = false; }
      const edits = w.mods.get(cell.chunk);
      edits?.delete(cell.i);
      if (edits && !edits.size) w.mods.delete(cell.chunk);
    }
    this.cells.delete(key);
  }
  update(dt) {
    for (const [key, cell] of this.cells) {
      cell.life -= dt;
      if (cell.life <= 0) this.restore(key, cell);
    }
  }
  clear() {
    for (const [key, cell] of this.cells) this.restore(key, cell);
    if (this.world.onSet === this.listener) this.world.onSet = this.previous;
  }
}
