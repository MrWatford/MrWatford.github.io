import { B, CHUNK, OPEN, TOP, make } from "./blocks.js";
import { VILLAGE_OVERHAUL_GEN } from "./village-overhaul.js";

const TIERS = ["Hamlet", "Market village", "Town", "Fortified town"];
const PROJECTS = [
  { name: "Community Pavilion", site: "garden", cost: [[B.PLANKS, 24], [B.WOOL, 8]],
    bounds: [5, 0, 9, 11, 5, 11], place: pavilion },
  { name: "Provision Hall", site: "garden", cost: [[B.PLANKS, 32], [B.STONE_BRICKS, 24], [B.GLASS, 8]],
    bounds: [4, 0, 3, 12, 7, 7], place: hall },
  { name: "Watch Gate", site: "plaza", cost: [[B.STONE_BRICKS, 48], [B.LOG, 12]],
    bounds: [0, 0, 0, 4, 7, 2], place: watchGate }
];
const COMPACT_WATCH_GATE = {
  ...PROJECTS[2], bounds: [3, 0, 6, 5, 7, 9],
  place(fill, stone) {
    // Turn the gate across the western approach, where the compact plaza has a level deck.
    watchGate((xa, ya, za, xb, yb, zb, block) => {
      fill(3 + za, ya, 6 + xa, 3 + zb, yb, 6 + xb, block);
    }, stone, 1);
  }
};

function pavilion(fill, stone) {
  fill(5, 1, 9, 11, 5, 11, B.AIR);
  fill(5, 0, 9, 11, 0, 11, stone);
  for (const x of [5, 11]) for (const z of [9, 11]) fill(x, 1, z, x, 3, z, B.OAK_FENCE);
  for (let x = 5; x <= 11; x++) fill(x, 4, 9, x, 4, 11, x % 2 ? B.CRIMSON_PLANKS : B.WOOL);
  fill(6, 1, 9, 7, 1, 9, B.STONE_STEP);
  fill(9, 1, 9, 10, 1, 9, B.STONE_STEP);
  fill(8, 1, 10, 8, 1, 10, B.TABLE);
  fill(6, 1, 10, 6, 1, 10, B.TORCH);
  fill(10, 1, 10, 10, 1, 10, B.TORCH);
}

function hall(fill, stone) {
  fill(4, 1, 3, 12, 7, 7, B.AIR);
  fill(4, 0, 3, 12, 0, 7, B.PLANKS);
  for (const x of [4, 12]) fill(x, 1, 3, x, 4, 7, stone);
  for (const z of [3, 7]) fill(5, 1, z, 11, 4, z, stone);
  for (const x of [6, 10]) for (const z of [3, 7]) fill(x, 2, z, x, 3, z, B.GLASS);
  fill(8, 1, 7, 8, 1, 7, make(B.DOOR, OPEN));
  fill(8, 2, 7, 8, 2, 7, make(B.DOOR, OPEN | TOP));
  fill(4, 5, 3, 12, 5, 7, B.ROOF_TILES);
  fill(5, 6, 4, 11, 6, 6, B.ROOF_TILES);
  fill(6, 7, 5, 10, 7, 5, B.ROOF_TILES);
  fill(5, 1, 4, 5, 1, 6, B.CHEST);
  fill(11, 1, 4, 11, 1, 6, B.HAY);
  fill(7, 1, 4, 7, 1, 4, B.TABLE);
  fill(10, 1, 4, 10, 1, 4, B.BOOKSHELF);
  fill(9, 2, 4, 9, 2, 4, B.TORCH);
}

function watchGate(fill, stone, facing = 0) {
  for (const x of [0, 3]) {
    fill(x, 1, 0, x, 4, 2, stone);
    fill(x, 5, 0, x, 5, 2, B.BRAZIER);
  }
  fill(0, 4, 0, 3, 4, 2, stone);
  fill(1, 1, 1, 2, 1, 1, make(B.OAK_GATE, OPEN | facing));
  fill(1, 5, 0, 2, 5, 2, B.DARKSLATE_BRICKS);
  fill(1, 6, 1, 2, 6, 1, B.LOG);
  fill(0, 3, 2, 0, 3, 2, make(B.CASTLE_BANNER, facing));
  fill(3, 3, 2, 3, 3, 2, make(B.CASTLE_BANNER, facing));
}

export function initVillageGrowth({ G, UI, Sound }) {
  function settlement(e) {
    const w = G.world, player = G.player;
    if (!w || !player || G.dim !== "overworld" || G.guest || G.spectator ||
        w.gen.version < VILLAGE_OVERHAUL_GEN || !e?.def.villager || e.dead || e.gone || !e.home ||
        Math.hypot(e.pos.x - player.pos.x, e.pos.y - player.pos.y, e.pos.z - player.pos.z) > 6) return null;
    const p = w.gen.villagePiece(Math.floor(e.home[0] / CHUNK), Math.floor(e.home[2] / CHUNK));
    if (!p?.detailed) return null;
    const [x, z] = p.center.map(n => Math.floor(n / CHUNK));
    const plaza = w.gen.villagePiece(x, z);
    if (!plaza?.detailed) return null;
    let garden;
    for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
      const plot = w.gen.villagePiece(x + dx, z + dz);
      if (plot?.detailed && plot.type === "garden") garden = plot;
    }
    if (!garden) return null;
    return { id: x + "," + z, x, z, plaza, garden };
  }

  function status(e) {
    const site = settlement(e);
    if (!site) return null;
    const record = G.story.villageGrowth?.[site.id];
    const tier = Number.isInteger(record?.tier) && record.tier >= 0 && record.tier < TIERS.length ? record.tier : 0;
    const project = tier === 2 && site.plaza.compact ? COMPACT_WATCH_GATE : PROJECTS[tier];
    if (!project) return { site, tier, title: TIERS[tier] };
    const plot = site[project.site];
    const cx = site.x + plot.dx, cz = site.z + plot.dz;
    const paid = project.cost.map(([, need], i) => {
      const n = record?.paid?.[i];
      return Number.isInteger(n) ? Math.max(0, Math.min(n, need)) : 0;
    });
    const funded = project.cost.every(([, need], i) => paid[i] === need);
    const [x, , z] = project.bounds;
    return { site, tier, title: TIERS[tier], project, plot, cx, cz, paid, funded,
      x: cx * CHUNK + x, z: cz * CHUNK + z };
  }

  function saveProgress(id, record) {
    G.story.villageGrowth = { ...G.story.villageGrowth, [id]: record };
    G.hudDirty = true;
    UI.refreshPanel();
    void G.saveNow(false);
  }

  function openTrade(e) {
    return G.state === "panel" && G.panelKind === "trade" && G.panelCtx === e?.uid;
  }

  function contribute(e) {
    if (!openTrade(e)) return;
    const s = status(e);
    if (!s?.project || s.funded) return;
    const amounts = s.project.cost.map(([id, need], i) => Math.min(need - s.paid[i], G.inv.count(id)));
    if (!amounts.some(Boolean)) return UI.toast("Bring materials listed for the project.", "bad");
    for (const [i, [id]] of s.project.cost.entries()) if (amounts[i]) G.inv.remove(id, amounts[i]);
    const paid = s.paid.map((value, i) => value + amounts[i]);
    saveProgress(s.site.id, { tier: s.tier, paid });
    Sound.craft();
  }

  function build(e) {
    if (!openTrade(e)) return;
    const s = status(e);
    if (!s?.funded) return;
    const w = G.world, x0 = s.cx * CHUNK, z0 = s.cz * CHUNK, y0 = s.plot.y;
    const c = w.chunks.get(s.cx + "," + s.cz);
    if (!c) return UI.toast("Move closer to the project plot and try again.", "bad");
    const [minX, minY, minZ, maxX, maxY, maxZ] = s.project.bounds;
    const inside = (x, y, z) => x >= x0 + minX && x <= x0 + maxX && y >= y0 + minY &&
      y <= y0 + maxY && z >= z0 + minZ && z <= z0 + maxZ;
    let original;
    const mods = w.mods.get(c.key);
    if (mods) for (const [i, value] of mods) {
      const x = x0 + i % CHUNK, z = z0 + Math.floor(i / CHUNK) % CHUNK, y = Math.floor(i / (CHUNK * CHUNK));
      if (inside(x, y, z)) {
        original ||= w.gen.generate(s.cx, s.cz);
        if (original[i] !== value) return UI.toast("Construction paused. The plot contains block changes.", "bad");
      }
    }
    for (const key of w.containers.keys()) {
      if (inside(...key.split(",").map(Number))) return UI.toast("Construction paused. A container is in the plot.", "bad");
    }
    const occupies = ([a, b, c, d, e, f]) => a < x0 + maxX + 1 && d > x0 + minX &&
      b < y0 + maxY + 1 && e > y0 + minY && c < z0 + maxZ + 1 && f > z0 + minZ;
    if (occupies(G.player.aabb()) || G.ents.list.some(ent => !ent.dead && !ent.gone && occupies(ent.aabb())) ||
        G.drops?.some(drop => inside(Math.floor(drop.x), Math.floor(drop.y), Math.floor(drop.z)))) {
      return UI.toast("Clear the construction plot and try again.", "bad");
    }
    const changes = new Map();
    const fill = (xa, ya, za, xb, yb, zb, block) => {
      for (let z = za; z <= zb; z++) for (let x = xa; x <= xb; x++) {
        for (let y = ya; y <= yb; y++) {
          const index = x + z * CHUNK + (y + y0) * CHUNK * CHUNK;
          changes.set(index, { x: x0 + x, y: y0 + y, z: z0 + z, block });
        }
      }
    };
    s.project.place(fill, s.plot.biome === "sandy" ? B.SANDSTONE : B.STONE_BRICKS);
    for (const { x, y, z, block } of changes.values()) if (w.get(x, y, z) !== block) w.set(x, y, z, block);
    saveProgress(s.site.id, { tier: s.tier + 1, paid: [] });
    Sound.craft();
    UI.toast(s.project.name + " complete. Settlement tier: " + TIERS[s.tier + 1] + ".", "good");
  }
  return { status, contribute, build };
}
