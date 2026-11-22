// The "The World" journal tab (Milestone 18, Part D): how water, lava, sand, leaves, fire, and farmland behave.
// Written in Blockhaven's own words.
import { B, I, iconURL } from "./blocks.js";

const icon = id => `<img src="${iconURL(id)}" alt="" style="width:20px;height:20px;image-rendering:pixelated;vertical-align:middle">`;

const PAGES = {
  water: { title: "Water and lava", html: () => `
    <ul>
      <li>${icon(I.WATER_BUCKET)} <b>Water flows</b> up to 7 blocks across a floor, getting shallower, and pours straight down off edges. Take away its source and it slowly dries up.</li>
      <li>${icon(I.LAVA_BUCKET)} <b>Lava flows</b> only 3 blocks (7 in the Ember Depths), and more slowly.</li>
      <li><b>Endless water:</b> dig a hole 3 blocks long and pour water into both ends. The middle becomes a full block too, so you can scoop from it forever.</li>
      <li><b>Buckets</b> only scoop up full blocks, not flowing water or lava.</li>
      <li><b>Currents</b>: flowing water carries you (and you can swim against it).</li>
      <li>${icon(B.COBBLE)} <b>Water + lava</b>: flowing lava touched by water turns to cobblestone; a full block of lava turns to ${icon(B.OBSIDIAN)} obsidian; lava pouring onto water makes stone.</li>
    </ul>
    <p class="help">Water and lava in your world only start moving when a block next to them is broken or placed, a bucket is used, or something explodes. You can turn flowing off in World options.</p>` },
  falling: { title: "Sand, gravel, leaves", html: () => `
    <ul>
      <li>${icon(B.SAND)} ${icon(B.GRAVEL)} <b>Sand and gravel fall</b> when nothing holds them up. Torches and small plants they land on break off.</li>
      <li>${icon(B.LEAVES)} <b>Leaves drop away</b> a few seconds after you cut down their tree, dropping saplings and apples. Leaves you place yourself stay forever.</li>
      <li><b>Things that need support</b> pop off when it's gone: torches, flowers and crops (the block under them), signs and turtle eggs, cocoa pods (their log), lily pads (their water), and redstone parts (whatever they hang on).</li>
    </ul>` },
  fire: { title: "Fire", html: () => `
    <ul>
      <li>${icon(B.FIRE)} <b>Fire spreads</b> to things that burn: wood, leaves, wool, hay, bookshelves, dry plants. It burns them away for good.</li>
      <li>${icon(B.TNT)} Blast Blocks catch fire and go off.</li>
      <li>Lava can set things right beside it on fire.</li>
      <li>Chests, workbenches, furnaces and other things you use never burn.</li>
      <li>Water puts fire out. Turn off <b>Fire spreads</b> in World options to keep fire from spreading at all.</li>
    </ul>` },
  farm: { title: "Farmland and water", html: () => `
    <ul>
      <li>${icon(B.FARMLAND)} <b>Farmland needs water</b> within 4 blocks (at the same level or one up). Without it, it dries out and crops grow more slowly; bare dry farmland turns back into dirt.</li>
      <li><b>Don't jump on your farm:</b> landing on farmland can trample it back into dirt.</li>
      <li>${icon(B.OAK_FENCE)} <b>Water in blocks:</b> fences, gates, trapdoors and signs can hold water. Place one in a full block of water, or pour a Water Bucket onto it. An empty bucket scoops the water back out.</li>
    </ul>` }
};

export function worldGuideHTML(G) {
  const open = PAGES[G.worldGuide] ? G.worldGuide : "water";
  const menu = `<div class="swg-menu">${Object.entries(PAGES).map(([k, pg]) => `<button class="chip-btn ${open === k ? "on" : ""}" data-wdg="${k}">${pg.title}</button>`).join("")}</div>`;
  return `<div class="swg">${menu}<div class="swg-text"><h4>${PAGES[open].title}</h4>${PAGES[open].html()}</div></div>`;
}
export function bindWorldGuide(p, G, rerender, click) {
  p.querySelectorAll("[data-wdg]").forEach(btn => btn.onclick = () => { click(); G.worldGuide = btn.dataset.wdg; rerender(); });
}
