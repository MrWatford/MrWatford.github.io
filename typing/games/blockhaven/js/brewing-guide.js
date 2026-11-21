// The "Brewing" journal tab (Milestone 16, Part C): how to start, every recipe, making potions stronger,
// throwing them, and where the ingredients come from. Written in Blockhaven's own words.
import { B, I, iconURL, TIPPED_KEYS } from "./blocks.js";
import { potionIconURL, potionLines, potionName } from "./potions.js";

const icon = id => `<img src="${iconURL(id)}" alt="" style="width:20px;height:20px;image-rendering:pixelated;vertical-align:middle">`;
const pot = (k, mod, id = I.POTION) => { const s = { id, n: 1, pot: k, ...(mod ? { mod } : {}) }; return `<img src="${potionIconURL(s)}" alt="" style="width:20px;height:20px;image-rendering:pixelated;vertical-align:middle">`; };
// [potion, ingredient added to an Awkward Potion (or another potion), what it does, longer?, stronger?]
const RECIPES = [
  ["swiftness", I.SUGAR, "Run faster", true, true],
  ["leaping", I.RABBIT_FOOT, "Jump higher, and falls hurt less", true, true],
  ["fire_resistance", I.MAGMA_CREAM, "Fire and lava can't hurt you", true, false],
  ["night_vision", I.GOLDEN_CARROT, "See in the dark", true, false],
  ["water_breathing", I.PUFFER, "Breathe underwater", true, false],
  ["healing", I.GLISTERING_MELON, "Heals 2 hearts right away (II: 4 hearts)", false, true],
  ["regeneration", I.WAILER_TEAR, "Heals a little every few seconds", true, true],
  ["strength", I.FLARE_POWDER, "Hit harder", true, true],
  ["poison", I.SPIDER_EYE, "Hurts over time, but never below half a heart", true, true],
  ["slow_falling", I.PHANTOM_MEMBRANE, "Float down gently, no fall damage", true, false],
  ["turtle_master", I.SHELL, "Much tougher, but very slow", true, true]
];
const FLIPS = [["invisibility", "night_vision", "Monsters only notice you up close (armor gives you away)"], ["slowness", "swiftness", "Walk slowly (also from Leaping)"],
  ["harming", "healing", "Hurts right away (also from Poison)"], ["weakness", "water", "Your hits do less (straight from a Water Bottle)"]];

const PAGES = {
  start: { title: "Getting started", html: () => `
    <ol>
      <li>${icon(B.BREWING_STAND)} <b>Make a Brewing Stand:</b> 1 Flare Rod + 3 cobblestone. Flare Rods come from Flares in Ember Depths fortresses.</li>
      <li>${icon(I.FLARE_POWDER)} <b>Heat it with Flare Powder</b> (1 Flare Rod = 2 powder). One powder lasts 20 brews.</li>
      <li>${pot("water")} <b>Get Water Bottles.</b> Make Glass Bottles (3 glass), then right-click water. A ${icon(B.CAULDRON)} Cauldron (7 iron ingots) holds 3 bottles of water.</li>
      <li>${icon(I.WART)} <b>Add Ember Wart</b> to make ${pot("awkward")} Awkward Potions. Ember Wart grows in Ember Depths fortresses; plant it on Wailing Sand.</li>
      <li><b>Add an ingredient</b> to the Awkward Potions to make a real potion. A brew takes 20 seconds and changes all 3 bottles.</li>
      <li><b>Drink it:</b> hold right-click, like eating. You keep the bottle.</li>
    </ol>
    <p class="help">Potions keep brewing while you're away, like a furnace. Milk clears every effect.</p>` },
  recipes: { title: "Every potion", html: () => `
    <p>Add these to an <b>Awkward Potion</b>:</p>
    <table class="ench-table"><thead><tr><th>Potion</th><th>Add</th><th>What it does</th><th>Longer / II</th></tr></thead><tbody>
    ${RECIPES.map(([k, ing, what, long, strong]) => `<tr><td>${pot(k)} <b>${potionName({ id: I.POTION, pot: k })}</b><br><small>${potionLines({ id: I.POTION, pot: k })[0]}</small></td><td>${icon(ing)}</td><td>${what}</td><td>${long ? icon(I.SPARKDUST) : "—"} ${strong ? icon(I.SHINE_DUST) : "—"}</td></tr>`).join("")}
    </tbody></table>
    <p>Add a ${icon(I.FERMENTED_EYE)} <b>Fermented Skitter Eye</b> to flip a potion into its opposite:</p>
    <table class="ench-table"><tbody>${FLIPS.map(([to, from, what]) => `<tr><td>${pot(from)} → ${pot(to)} <b>${potionName({ id: I.POTION, pot: to })}</b></td><td>${what}</td></tr>`).join("")}</tbody></table>` },
  stronger: { title: "Longer, stronger, throwable", html: () => `
    <ul>
      <li>${icon(I.SPARKDUST)} <b>Sparkdust</b>: the potion lasts longer (most go from 3 minutes to 8).</li>
      <li>${icon(I.SHINE_DUST)} <b>Shinestone dust</b>: level II, stronger but shorter. You can't have both.</li>
      <li>${icon(I.BOOM_POWDER)} <b>Boom Powder</b>: ${pot("healing", null, I.SPLASH_POTION)} a <b>splash potion</b>. Right-click to throw it; it touches everyone within 4 blocks.</li>
      <li>${icon(I.DRAGON_BREATH)} <b>Wyrm's Breath</b>: turns a splash potion into a ${pot("regeneration", null, I.LINGERING_POTION)} <b>lingering potion</b> that leaves a cloud for 30 seconds. Bottle the breath by holding a Glass Bottle in the Hollow Wyrm's purple clouds.</li>
      <li>${icon(I.TIPPED_ARROW + TIPPED_KEYS.indexOf("slowness"))} <b>Tipped arrows</b>: 8 arrows around 1 lingering potion at a workbench. Whatever the arrow hits gets a short dose.</li>
    </ul>
    <p class="help">On creatures, Healing and Harming work the other way round for the undead: Harming heals zombies and Rattlers, Healing hurts them. Poison doesn't work on them at all.</p>` },
  find: { title: "Finding ingredients", html: () => `
    <ul>
      <li>${icon(B.SUGAR_CANE)} <b>Sugar</b>: from sugar cane, which grows beside water.</li>
      <li>${icon(I.MELON_SEEDS)} <b>Melons</b>: seeds from Farmers, the Wanderer, or treasure chests. Plant on farmland; melons grow beside the stem. Glistering Melon = 1 slice + 8 gold nuggets.</li>
      <li>${icon(I.RABBIT_FOOT)} <b>Rabbit's Foot</b>: sometimes dropped by rabbits.</li>
      <li>${icon(I.PHANTOM_MEMBRANE)} <b>Phantom Membrane</b>: dropped by Phantoms (they fly at night).</li>
      <li>${icon(I.SPIDER_EYE)} <b>Skitter Eyes</b>: from Skitters. Ferment one with Sugar and Ember Wart.</li>
      <li>${icon(I.WAILER_TEAR)} ${icon(I.MAGMA_CREAM)} <b>Wailer Tears and Magma Cream</b>: from Wailers and Magma Gloops in the Ember Depths.</li>
      <li>${icon(I.PUFFER)} <b>Puffers</b>: catch them fishing. ${icon(I.SHELL)} <b>Sheller Shells</b>: from Shellers in the Hollow.</li>
      <li><b>Witches</b> drop bottles, sugar, Skitter eyes, Shinestone dust, Sparkdust, and Boom Powder. Watch out: they throw potions at you!</li>
      <li><b>Clerics</b> sell Glass Bottles and Potions of Healing; treasure chests sometimes hold potions.</li>
    </ul>` }
};

export function brewingGuideHTML(G) {
  const open = PAGES[G.brewGuide] ? G.brewGuide : "start";
  const menu = `<div class="swg-menu">${Object.entries(PAGES).map(([k, pg]) => `<button class="chip-btn ${open === k ? "on" : ""}" data-brg="${k}">${pg.title}</button>`).join("")}</div>`;
  return `<div class="swg">${menu}<div class="swg-text"><h4>${PAGES[open].title}</h4>${PAGES[open].html()}</div></div>`;
}
export function bindBrewingGuide(p, G, rerender, click) {
  p.querySelectorAll("[data-brg]").forEach(btn => btn.onclick = () => { click(); G.brewGuide = btn.dataset.brg; rerender(); });
}
