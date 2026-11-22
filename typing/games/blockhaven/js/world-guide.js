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
    </ul>` },
  // Milestone 19, Part D
  weather: { title: "Weather", html: () => `
    <ul>
      <li>${icon(I.WATER_BUCKET)} <b>Rain</b> comes and goes on the Surface. The sky can change about every 5 minutes, and the first day is always clear.</li>
      <li>${icon(B.SNOW_LAYER)} <b>Snow</b> falls instead of rain in Snowy Plains, Snowy Peaks, Frozen Oceans, and anywhere high up (above height 60).</li>
      <li>${icon(B.SAND)} <b>Deserts, Badlands and Savannas</b> stay dry, but the sky still turns gray.</li>
      <li><b>Thunderstorms</b> are dark enough for monsters to come out in the daytime.</li>
      <li>Rain puts out fires and anything that's burning. Zombies and other undead don't burn in the sun while it rains on them.</li>
      <li>${icon(B.BED)} You can sleep during a thunderstorm, even in the day. Waking up clears the sky for a while.</li>
    </ul>
    <p class="help">Turn off <b>Weather changes</b> in World options to keep the sky clear. In Creative, World options also has buttons to make it clear, rainy, or stormy.</p>` },
  lightning: { title: "Lightning", html: () => `
    <ul>
      <li>Lightning strikes during thunderstorms, only where rain is falling. It hurts and sets things on fire (on Normal and Hard it can start a fire on the ground).</li>
      <li><b>Lightning changes creatures:</b> a Pig becomes a Rotboar, a Villager becomes a Witch, and a Hisser becomes a <b>charged Hisser</b> that glows blue and blasts twice as far.</li>
      <li>${icon(B.LIGHTNING_ROD)} <b>Lightning Rod</b> (3 Iron Ingots): any strike within 32 blocks hits the rod instead, with no fire. Put one on your roof!</li>
      <li>${icon(I.TRIDENT)} <b>Channeling</b>: a thrown trident calls lightning onto the creature it hits during a thunderstorm.</li>
      <li>Stay under a roof during storms to be safe.</li>
    </ul>` },
  snow: { title: "Snow and ice", html: () => `
    <ul>
      <li>${icon(B.SNOW_LAYER)} While it snows, a thin layer of snow covers open ground, roofs and treetops in cold places.</li>
      <li>${icon(B.ICE)} Open water in cold places freezes over into ice, starting at the edges.</li>
      <li>${icon(B.TORCH)} Ice and snow next to a torch, lantern or other bright light melt. Packed Ice, Blue Ice and Snow blocks don't.</li>
      <li>${icon(B.CAULDRON)} A cauldron out in the rain slowly fills with water.</li>
      <li>${icon(B.FARMLAND)} Rain keeps farmland wet, even far from water.</li>
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
