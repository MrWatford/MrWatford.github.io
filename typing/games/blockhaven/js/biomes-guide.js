// The "Biomes" journal tab (Milestone 20, Part E): every biome, what grows and lives there, which ones you've found,
// and where you are right now. Written in Blockhaven's own words.
import { B, iconURL } from "./blocks.js";

const icon = id => `<img src="${iconURL(id)}" alt="" style="width:20px;height:20px;image-rendering:pixelated;vertical-align:middle">`;
// [key, name, map color, a block that stands for it, what you'll find]
const LIST = [
  ["plains", "Plains", "#7cbd56", B.TALL_GRASS, "Open grass, flowers, villages, horses"],
  ["forest", "Forest", "#3f8a2c", B.LOG, "Oak and birch trees, wolves (Scouts), foxes, bee nests"],
  ["birch", "Birch Forest", "#6aa84a", B.BIRCH_LOG, "Tall white birch trees"],
  ["sandy", "Desert", "#e2d39b", B.SAND, "Sand, cactus, dead bushes, camels, temples"],
  ["mountain", "Mountains", "#96988c", B.STONE, "Bare rock, Jade ore"],
  ["peak", "Snowy Peaks", "#f2f2f2", B.SNOW, "Snow caps high up, goats"],
  ["ocean", "Ocean", "#3c78dc", B.WATER, "Wide seas (new worlds), fish, squid, dolphins (Splashers)"],
  ["deep_ocean", "Deep Ocean", "#1e46a0", B.GRAVEL, "Seas up to about 20 blocks deep, glow squid"],
  ["frozen_ocean", "Frozen Ocean", "#e8eef2", B.ICE, "A frozen sea; polar bears on the ice"],
  ["snowy_plains", "Snowy Plains", "#e8eef2", B.SNOW_LAYER, "Snow cover, frozen lakes, a few spruces, polar bears, Strays at night"],
  ["taiga", "Taiga", "#3e6e4a", B.SPRUCE_LOG, "Spruce forests, berry bushes, wolves, foxes"],
  ["jungle", "Jungle", "#2e9628", B.JUNGLE_LOG, "Tall jungle trees with cocoa, bamboo, wild melons, pandas, ocelots, parrots"],
  ["savanna", "Savanna", "#b0ac58", B.ACACIA_LOG, "Leaning acacia trees, tall grass, horses, llamas, armadillos"],
  ["dark_forest", "Dark Forest", "#285a1e", B.DARK_OAK_LOG, "Thick dark oaks and giant mushrooms; Witches at night"],
  ["swamp", "Swamp", "#506e46", B.MANGROVE_LOG, "Mangroves on roots, mud, lily pads, frogs, slimes"],
  ["badlands", "Badlands", "#c46630", B.ORANGE_TERRACOTTA, "Red sand, striped terracotta, cactus, armadillos"],
  ["cherry_grove", "Cherry Grove", "#eca0c4", B.CHERRY_LOG, "Pink cherry trees and petals"],
  ["mushroom_fields", "Mushroom Fields", "#826e82", B.MYCELIUM, "Mycelium and giant mushrooms, Mooshrooms, and no monsters at all"],
  ["lush_caves", "Lush Caves", "#596e2d", B.MOSS_BLOCK, "Underground: moss, azaleas, glowing cave vines, spore blossoms"],
  ["dripstone_caves", "Dripstone Caves", "#7a6a5a", B.POINTED_DRIPSTONE, "Underground: dripstone, stalactites, stalagmites (don't fall on them!)"]
];

export function biomesGuideHTML(G) {
  const seen = new Set(G.story?.biomes || []), here = G.dim === "overworld" ? (G.currentBiome || G.world?.biomeAt?.(Math.floor(G.player.pos.x), Math.floor(G.player.pos.z))) : null;
  const name = k => (LIST.find(r => r[0] === k) || [, k])[1];
  return `<div class="swg"><div class="swg-text">
    <h4>Biomes</h4>
    <p>${here ? `You're in: <b>${name(here)}</b>.` : "Biomes are on the Surface."} You've found <b>${LIST.filter(r => seen.has(r[0])).length}</b> of ${LIST.length}. The Explorer's Map colors each biome.</p>
    <table class="ench-table"><thead><tr><th></th><th>Biome</th><th>What you'll find</th><th>Found</th></tr></thead><tbody>
      ${LIST.map(([k, n, color, id, what]) => `<tr><td><span style="display:inline-block;width:14px;height:14px;border-radius:3px;background:${color};border:1px solid #0004;vertical-align:middle"></span> ${icon(id)}</td><td><b>${n}</b></td><td>${what}</td><td>${seen.has(k) ? "✔" : ""}</td></tr>`).join("")}
    </tbody></table>
    <p class="help">Older worlds: the new biomes (and wide oceans in brand-new worlds only) appear in land nobody had visited yet, so you may need to travel to find them.</p>
  </div></div>`;
}
