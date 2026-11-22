// The "Farm & Gadgets" journal tab (Milestone 22, Part E): new crops, foods, gadgets, fireworks and music.
// Written in Blockhaven's own words.
import { B, I, iconURL } from "./blocks.js";

const icon = id => `<img src="${iconURL(id)}" alt="" style="width:20px;height:20px;image-rendering:pixelated;vertical-align:middle">`;

const PAGES = {
  crops: { title: "New crops", html: () => `
    <p>Break tall grass now and then to find ${icon(I.POTATO)} Potatoes, ${icon(I.BEETROOT_SEEDS)} Beetroot Seeds and ${icon(I.PUMPKIN_SEEDS)} Pumpkin Seeds. Plant them on farmland near water.</p>
    <ul>
      <li>${icon(I.POTATO)} <b>Potatoes</b>: a grown plant gives 1-4. Cook them into ${icon(I.BAKED_POTATO)} Baked Potatoes. Watch out for the odd ${icon(I.POISONOUS_POTATO)} Poisonous Potato!</li>
      <li>${icon(I.BEETROOT)} <b>Beetroot</b>: a grown plant gives a beetroot and more seeds. Beetroot also makes red dye.</li>
      <li>${icon(B.PUMPKIN)} <b>Pumpkins</b> grow on the ground beside a grown stem (leave a free spot of dirt or grass next to it). Use Shears on one to carve a face, then add a Torch for a glowing ${icon(B.JACK_O_LANTERN)} Jack o'Lantern.</li>
    </ul>` },
  food: { title: "Food", html: () => `
    <ul>
      <li>${icon(B.CAKE)} <b>Cake</b> (3 Milk, 2 Sugar, an Egg, 3 Wheat; you keep the buckets). Place it and right-click to eat a slice; 7 slices. Put a Candle on a whole cake and light it for a party!</li>
      <li>${icon(I.PUMPKIN_PIE)} <b>Pumpkin Pie</b>: Pumpkin + Sugar + Egg.</li>
      <li>${icon(I.BEETROOT_SOUP)} <b>Beetroot Soup</b>: 6 Beetroot + a Bowl.</li>
      <li>${icon(I.RABBIT_STEW)} <b>Rabbit Stew</b>: Cooked Rabbit, Carrot, Baked Potato, Brown Mushroom and a Bowl. The most filling food of all.</li>
      <li>${icon(I.ENCHANTED_GOLDEN_APPLE)} <b>Enchanted Golden Apple</b>: very rare treasure. It can't be made.</li>
    </ul>` },
  gadgets: { title: "Gadgets", html: () => `
    <ul>
      <li>${icon(I.CROSSBOW)} <b>Crossbow</b>: hold right-click to load an arrow, then right-click to fire. Enchant it with Quick Charge, Multishot or Piercing.</li>
      <li>${icon(I.SPYGLASS)} <b>Spyglass</b>: hold right-click to zoom in far.</li>
      <li>${icon(I.CLOCK)} <b>Clock</b>: hold it to see the time of day. It spins in the Ember Depths and the Hollow.</li>
    </ul>` },
  party: { title: "Fireworks and music", html: () => `
    <ul>
      <li>${icon(I.FIREWORK_ROCKET)} <b>Firework Rockets</b> (Paper + Boom Powder): right-click a block to launch one. While gliding, right-click one to zoom ahead. Hold one in your other hand to load it into a crossbow.</li>
      <li>${icon(B.JUKEBOX)} <b>Jukebox</b> (8 Planks + a Skyshard): put in a ${icon(I.DISC_SUNRISE)} Music Disc to play it.</li>
      <li>There are 5 discs to find in treasure chests, each with its own Blockhaven song: Sunrise Over Blockhaven, Lantern Waltz, Deep Cave Echoes, Sea Breeze, and Starlight.</li>
    </ul>
    <p class="help">Find everything from this chapter in the Creative tab "Farm & Gadgets".</p>` }
};

export function farmGuideHTML(G) {
  const open = PAGES[G.farmGuide] ? G.farmGuide : "crops";
  const menu = `<div class="swg-menu">${Object.entries(PAGES).map(([k, pg]) => `<button class="chip-btn ${open === k ? "on" : ""}" data-fmg="${k}">${pg.title}</button>`).join("")}</div>`;
  return `<div class="swg">${menu}<div class="swg-text"><h4>${PAGES[open].title}</h4>${PAGES[open].html()}</div></div>`;
}
export function bindFarmGuide(p, G, rerender, click) {
  p.querySelectorAll("[data-fmg]").forEach(btn => btn.onclick = () => { click(); G.farmGuide = btn.dataset.fmg; rerender(); });
}
