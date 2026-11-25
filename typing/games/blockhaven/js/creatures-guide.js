// The "Creatures" journal tab (Milestone 24, Part E): what the creatures from Milestone 24 do, and what they give you.
// Written in Blockhaven's own words.
import { B, I, iconURL } from "./blocks.js";

const icon = id => `<img src="${iconURL(id)}" alt="" style="width:20px;height:20px;image-rendering:pixelated;vertical-align:middle">`;

const PAGES = {
  night: { title: "Night and magic", html: () => `
    <ul>
      <li>${icon(I.PHANTOM_MEMBRANE)} <b>Phantoms</b> only come for players who skip sleep. After 3 or more days without sleeping, they may swoop down at night when you're under the open sky. Sleep in a bed (or have a roof over your head) to keep them away.</li>
      <li>${icon(I.TOTEM)} <b>Evokers</b> live in Woodland Mansions and join raids. They keep their distance and cast spells: a line of snapping fangs along the ground (a ring of fangs if you get close), or a swarm of Vexes. Defeat one for a Lifeward Totem.</li>
      <li><b>Vexes</b> fly straight through walls and dart in to strike. They fade away after a minute or two.</li>
    </ul>
    <p class="help">Tip: watch the ground in front of an Evoker. Step sideways out of the line of fangs.</p>` },
  snow: { title: "Mountains and snow", html: () => `
    <ul>
      <li>${icon(I.GOAT_HORN)} <b>Goats</b> leap high and sometimes lower their heads and charge. A goat that rams into stone, ore, logs or ice drops a <b>Goat Horn</b>; right-click it to sound it. Use a Bucket on a goat for milk.</li>
      <li>${icon(B.CARVED_PUMPKIN)} <b>Snow Golems</b>: stack 2 Snow blocks and put a Carved Pumpkin or Jack o'Lantern on top. They throw snowballs that push monsters back, leave snow in cool places, and melt in hot places and in the rain. Shears take the pumpkin off.</li>
      <li><b>Polar bears</b> get angry if you come close to their cubs.</li>
      <li><b>Strays</b> shoot arrows that slow you, <b>Parched</b> arrows weaken you, and a <b>Husk</b>'s hit makes you hungry.</li>
    </ul>` },
  wind: { title: "Wind and the wild", html: () => `
    <ul>
      <li>${icon(I.BREEZE_ROD)} <b>The Breeze</b> bounces around and fires gusts of wind. Defeat it for Breeze Rods.</li>
      <li>${icon(I.WIND_CHARGE)} <b>Wind Charges</b>: 1 Breeze Rod makes 4. Throw one and it bursts into a gust that pushes everything away. Throw one at your feet to leap high (you only take fall damage for falling below where it burst).</li>
      <li><b>Bats</b> hang upside down under ceilings to rest, and wake up when you come near.</li>
      <li>${icon(B.BAMBOO)} <b>Pandas</b> each have a mood: lazy ones nap, playful ones roll over, worried ones hide in thunderstorms, weak ones sneeze, and aggressive ones fight back. They love Bamboo.</li>
      <li>${icon(I.RAW_MINNOW)} <b>Ocelots</b> are shy. Feed them raw fish to win their trust. They hunt chickens, and Hissers keep away from them.</li>
    </ul>` },
  water: { title: "Water friends", html: () => `
    <ul>
      <li><b>Axolotls</b> fight Drowned and Guardians. When their foe is defeated near you, you get Regeneration and lose Mining Fatigue. A hurt Axolotl may play dead for a while.</li>
      <li>${icon(I.GLOW_INK_SAC)} <b>Glow Squid</b> go dark when hurt and drop Glow Ink Sacs. Use one on an Item Frame to make what's inside glow.</li>
      <li><b>Allays</b> fetch items for you, and dance while a Jukebox plays nearby.</li>
    </ul>` },
  diggers: { title: "Diggers and pests", html: () => `
    <ul>
      <li>${icon(I.TORCHFLOWER_SEEDS)} <b>Sniffers</b> sniff out ancient seeds: Torchflower Seeds and Pitcher Pods. Plant them on farmland to grow a ${icon(B.TORCHFLOWER)} Torchflower or a ${icon(B.PITCHER_PLANT)} Pitcher Plant (both make dye).</li>
      <li>${icon(B.INFESTED_STONE)} <b>Silverfish</b> hide inside stone when nobody is near. That stone looks normal, but a silverfish comes out when you break it. Hurt one and its friends come out too!</li>
      <li><b>Endermites</b> sometimes come with a thrown Void Pearl. They leave after 2 minutes.</li>
      <li>${icon(I.SHIELD)} <b>Ravagers</b> trample leaves and crops. Block a bite with your shield to stun one, but stand back: it roars right after.</li>
      <li><b>Zoglins</b> attack any creature they can reach, not just you.</li>
    </ul>
    <p class="help">Find everything from this chapter in the Creative tab "Creature Finds".</p>` }
};

export function creaturesGuideHTML(G) {
  const open = PAGES[G.creaGuide] ? G.creaGuide : "night";
  const menu = `<div class="swg-menu">${Object.entries(PAGES).map(([k, pg]) => `<button class="chip-btn ${open === k ? "on" : ""}" data-crg="${k}">${pg.title}</button>`).join("")}</div>`;
  return `<div class="swg">${menu}<div class="swg-text"><h4>${PAGES[open].title}</h4>${PAGES[open].html()}</div></div>`;
}
export function bindCreaturesGuide(p, G, rerender, click) {
  p.querySelectorAll("[data-crg]").forEach(btn => btn.onclick = () => { click(); G.creaGuide = btn.dataset.crg; rerender(); });
}
