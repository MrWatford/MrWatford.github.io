import { B, CHUNK, HEIGHT } from "./blocks.js";
import { protectedDesertFootprint } from "./leviathan-recall.js";

export const BURROW_RANGE = 24;
export const BURROW_MIN_RANGE = 8;
export const BURROW_SPEED = 10;
export const BURROW_DIVE_TIME = 0.7;
export const BURROW_RISE_TIME = 0.85;
const STEP = 0.5;
const natural = new Set([B.SAND, B.SANDSTONE, B.STONE, B.DIRT, B.GRAVEL, B.CLAY, B.COAL_ORE, B.IRON_ORE, B.SKY_ORE, B.JADE_ORE, B.SPARK_ORE]);

// Transient validation cache. Rebuilt on any terrain edit and discarded with
// the journey. Chunk availability, reservations and occupants stay live.
export function createBurrowClearance(world, gen, body) {
  let version = world.editCount;
  let disposed = false;
  const blocks = new Map(), chunks = new Map();
  const cachedWorld = {
    isLoaded(x, z) {
      const chunk = world.chunkAt(x, z), key = Math.floor(x / CHUNK) + "," + Math.floor(z / CHUNK);
      if (chunks.has(key) && chunks.get(key) !== chunk) blocks.clear();
      if (!disposed) { if (chunks.size >= 64 && !chunks.has(key)) { chunks.clear(); blocks.clear(); } chunks.set(key, chunk); }
      return !!chunk;
    },
    id(x, y, z) {
      if (disposed) return world.id(x, y, z);
      const key = x + "," + y + "," + z;
      if (!blocks.has(key)) {
        const id = world.id(x, y, z);
        if (blocks.size >= 8192) return id;
        blocks.set(key, id);
      }
      return blocks.get(key);
    }
  };
  return {
    safe(site, actors = []) {
      if (version !== world.editCount) { blocks.clear(); version = world.editCount; }
      if (![site.x, site.y, site.z, body.w, body.h].every(Number.isFinite) || !Number.isInteger(site.y) ||
          body.w < 1 || body.w > 10 || body.h < 1 || body.h > 10 ||
          gen.column(Math.floor(site.x), Math.floor(site.z)).biome !== "sandy" ||
          site.y < 8 || site.y + body.h + 2 >= HEIGHT || protectedDesertFootprint(world, gen, site, body)) return false;
      const r = body.w / 2 + 1;
      if (actors.some(e => !e.dead && !e.gone && e.pos && Math.abs(e.pos.y - site.y) < body.h + 2 + (e.h || 2) &&
          Math.abs(e.pos.x - site.x) < r + (e.w || 1) / 2 && Math.abs(e.pos.z - site.z) < r + (e.w || 1) / 2)) return false;
      for (let x = Math.floor(site.x - r); x <= Math.floor(site.x + r); x++) for (let z = Math.floor(site.z - r); z <= Math.floor(site.z + r); z++) {
        if (!cachedWorld.isLoaded(x, z)) return false;
        // A one-block dip is safe for the surface proxy and ordinary landing
        // physics. Higher ground, fluids and larger drops stop the route.
        const top = cachedWorld.id(x, site.y - 1, z);
        if (top !== B.SAND && (top !== B.AIR || cachedWorld.id(x, site.y - 2, z) !== B.SAND)) return false;
        for (let y = site.y; y < site.y + body.h + 2; y++) if (cachedWorld.id(x, y, z) !== B.AIR) return false;
        for (let y = site.y - 2; y >= site.y - 8; y--) if (!natural.has(cachedWorld.id(x, y, z))) return false;
      }
      return true;
    },
    dispose() { disposed = true; blocks.clear(); chunks.clear(); },
    get cachedBlocks() { return blocks.size; }
  };
}

// Surface anchors remain safe places to save or cancel. The later riding/view
// integration can submerge the artwork without saving a player inside blocks.
export function planLeviathanBurrow(world, gen, origin, yaw, body, actors = []) {
  if (![origin.x, origin.y, origin.z, yaw].every(Number.isFinite) || !Number.isInteger(origin.y)) return null;
  const clearance = createBurrowClearance(world, gen, body), points = [];
  try {
    for (let distance = 0; distance <= BURROW_RANGE; distance += STEP) {
      const site = { x: origin.x - Math.sin(yaw) * distance, y: origin.y, z: origin.z - Math.cos(yaw) * distance };
      if (!clearance.safe(site, actors)) break;
      points.push(site);
    }
    const distance = (points.length - 1) * STEP;
    return distance >= BURROW_MIN_RANGE ? { points, distance, yaw, origin: { ...origin }, end: { ...points.at(-1) } } : null;
  } finally { clearance.dispose(); }
}

export function createBurrowJourney(world, gen, plan, owner) {
  // Validate the supplied route again; consumers cannot bypass the planner
  // using an imported record or a malformed preview object.
  if (!owner || !Number.isFinite(owner.w) || !Number.isFinite(owner.h) || !plan || !Array.isArray(plan.points) || plan.points.length < 17 || plan.points.length > 49 ||
      !Number.isFinite(plan.yaw) || plan.distance !== (plan.points.length - 1) * STEP || plan.distance > BURROW_RANGE ||
      !plan.points[0] || plan.points.some((p, i) => !p || ![p.x, p.y, p.z].every(Number.isFinite) || !Number.isInteger(p.y) || p.y !== plan.points[0].y ||
        Math.abs(p.x - (plan.points[0].x - Math.sin(plan.yaw) * i * STEP)) > 0.00001 ||
        Math.abs(p.z - (plan.points[0].z - Math.cos(plan.yaw) * i * STEP)) > 0.00001)) return null;
  const points = plan.points.map(p => ({ ...p })), clearance = createBurrowClearance(world, gen, owner);
  if (!points.every(p => clearance.safe(p))) { clearance.dispose(); return null; }
  const distance = plan.distance, yaw = plan.yaw;
  const duration = BURROW_DIVE_TIME + distance / BURROW_SPEED + BURROW_RISE_TIME;
  const journey = {
    owner, elapsed: 0, distance: 0, stage: "diving", position: { ...points[0] }, depth: 0, reason: null,
    // These are safe surface positions, never underground player coordinates.
    get savePosition() { return clearance.safe(this.position) ? { ...this.position } : null; },
    cancel(reason = "canceled") { if (["complete", "canceled"].includes(this.stage)) return; this.stage = "canceled"; this.reason = reason; this.depth = 0; clearance.dispose(); },
    update(dt, context) {
      if (["complete", "canceled"].includes(this.stage)) return false;
      if (context.dim !== "overworld" || context.riding !== owner || !owner.ridden || !owner.tame || !owner.saddled ||
          owner.dead || owner.gone || owner.hp <= 0 || !context.entities.includes(owner)) { this.cancel("lifecycle"); return false; }
      if (!context.active) return true;
      if (!Number.isFinite(dt) || dt < 0) { this.cancel("invalid-time"); return false; }
      const nextElapsed = Math.min(duration, this.elapsed + Math.min(0.1, dt));
      const nextDistance = Math.min(distance, Math.max(0, nextElapsed - BURROW_DIVE_TIME) * BURROW_SPEED);
      const occupants = context.entities.filter(e => e !== owner);
      // Recheck the current anchor and every half-block crossed this tick.
      if (!clearance.safe(this.position, occupants)) {
        // A later integration must use its ordinary spawn fallback if even the
        // origin has become unsafe. savePosition explicitly returns null then.
        for (let i = Math.floor(this.distance / STEP); i >= 0; i--) if (clearance.safe(points[i], occupants)) { this.position = { ...points[i] }; break; }
        this.cancel("anchor-blocked"); return false;
      }
      for (let d = this.distance; d <= nextDistance + STEP; d += STEP) {
        const reach = Math.min(d, nextDistance), index = Math.min(points.length - 2, Math.floor(reach / STEP)), fraction = reach / STEP - index;
        const a = points[index], b = points[index + 1];
        const p = { x: a.x + (b.x - a.x) * fraction, y: a.y, z: a.z + (b.z - a.z) * fraction };
        if (!clearance.safe(p, occupants)) { this.cancel("route-blocked"); return false; }
      }
      this.elapsed = nextElapsed; this.distance = nextDistance;
      this.position = { x: points[0].x - Math.sin(yaw) * nextDistance, y: points[0].y, z: points[0].z - Math.cos(yaw) * nextDistance };
      const cruiseEnd = BURROW_DIVE_TIME + distance / BURROW_SPEED;
      this.stage = nextElapsed < BURROW_DIVE_TIME ? "diving" : nextElapsed < cruiseEnd ? "traveling" : "emerging";
      const t = nextElapsed < BURROW_DIVE_TIME ? nextElapsed / BURROW_DIVE_TIME : nextElapsed < cruiseEnd ? 1 : 1 - (nextElapsed - cruiseEnd) / BURROW_RISE_TIME;
      const smooth = Math.max(0, Math.min(1, t));
      this.depth = (owner.h + 3) * smooth * smooth * (3 - 2 * smooth);
      if (nextElapsed >= duration) { this.stage = "complete"; this.depth = 0; clearance.dispose(); return false; }
      return true;
    }
  };
  return journey;
}
