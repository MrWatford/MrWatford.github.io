// The "Oceans" journal tab (Milestone 17, Part E): the ocean floor, sunken treasure, Ocean Monuments, sea creatures,
// and tridents. Written in Blockhaven's own words.
import { B, I, iconURL } from "./blocks.js";

const icon = id => `<img src="${iconURL(id)}" alt="" style="width:20px;height:20px;image-rendering:pixelated;vertical-align:middle">`;

const PAGES = {
  floor: { title: "The ocean floor", html: () => `
    <p>Real seas only come in worlds made since the biomes update. Worlds made earlier keep their old land.</p>
    <ul>
      <li>${icon(B.KELP)} <b>Kelp</b> grows in forests in deeper water. Placed kelp grows up toward the surface. Cook it into ${icon(I.DRIED_KELP)} Dried Kelp; 9 make a Dried Kelp Block, a fuel that burns a long time.</li>
      <li>${icon(B.SEAGRASS)} <b>Seagrass</b> covers sandy floors. Only Shears pick it up.</li>
      <li>${icon(B.BRAIN_CORAL_BLOCK)} <b>Coral reefs</b> grow in the sunny, shallow <b>Warm Ocean</b>: tube, brain, bubble, fire and horn coral. A coral block dies (turns gray) if nothing watery touches it. Coral plants and fans only come with Silk Touch.</li>
      <li>${icon(B.SEA_PICKLE)} <b>Sea Pickles</b> glow on reefs. Stack up to 4 in one spot for more light.</li>
      <li>${icon(B.SPONGE)} <b>Sponges</b> soak up the water around them and turn into Wet Sponges. Dry them in a furnace. Find them in Ocean Monuments.</li>
      <li>${icon(B.BLUE_ICE)} <b>Icebergs</b> float in frozen seas. Blue Ice is the slipperiest block there is.</li>
      <li>Water plants count as water: you swim right through them, and breaking one leaves water behind.</li>
    </ul>` },
  treasure: { title: "Sunken treasure", html: () => `
    <ul>
      <li>${icon(B.SPRUCE_PLANKS)} <b>Shipwrecks</b> lie on the sea floor. Each has 3 chests: supplies in the front, treasure in the hold, and a map chest in the cabin at the back.</li>
      <li>${icon(B.MOSSY)} <b>Ocean ruins</b> are broken stone walls (sandstone in warm seas), often with a chest: Nautilus Shells, gold, sometimes a Treasure Map.</li>
      <li>${icon(I.TREASURE_MAP)} <b>Treasure Maps</b>: hold one and follow the arrow at the top of the screen to a beach. When it says <i>X marks the spot</i>, dig down.</li>
      <li>${icon(I.HEART_OF_THE_SEA)} <b>Buried treasure</b> always holds the Heart of the Sea, plus gold, iron, Jade and more.</li>
      <li>${icon(I.NAUTILUS_SHELL)} <b>Nautilus Shells</b>: fishing treasure, ruins, shipwrecks, Drowned, and the Wanderer.</li>
      <li>${icon(B.CONDUIT)} <b>The Conduit</b>: 8 Nautilus Shells around a Heart of the Sea. Put it in water with water all around it, and build up to 42 prismarine blocks in three rings around it (a 5 × 5 square ring in each direction). With 16 or more, swimmers nearby get <b>Conduit Power</b>: breathe underwater, see clearly, dig at full speed. With all 42 it also zaps monsters that swim close.</li>
    </ul>` },
  monument: { title: "Ocean Monuments", html: () => `
    <p>${icon(B.PRISMARINE_BRICKS)} Huge prismarine fortresses on the floor of big, deep seas, usually far from where you start.</p>
    <ul>
      <li>${icon(I.PRISMARINE_SHARD)} <b>Guardians</b> keep their distance and charge a laser. Watch the beam: when it turns bright yellow, it's about to hit. Get behind a wall to break its aim. They drop Prismarine Shards and Crystals.</li>
      <li>${icon(B.GOLD_BLOCK)} <b>Elder Guardians</b>: three in each monument, one in each front tower and one in the top chamber. They curse you with <b>Mining Fatigue</b> (digging is very slow) every minute while you're within 50 blocks. Each drops a Wet Sponge.</li>
      <li>Inside: a pillared hall, two sponge rooms, and a sealed gold vault in the middle (8 gold blocks).</li>
      <li>Bring a Turtle Shell, Water Breathing potions, or a Conduit to stay down longer.</li>
    </ul>` },
  creatures: { title: "Sea creatures", html: () => `
    <ul>
      <li>${icon(I.RAW_MINNOW)} <b>Fish</b>: Minnows, Salmon, Sunfins and Puffers. Catch them with a rod, or scoop one into a ${icon(I.WATER_BUCKET)} Water Bucket to carry it; empty the bucket to let it out. Axolotls and tadpoles fit in buckets too.</li>
      <li>${icon(B.TURTLE_EGG)} <b>Sea turtles</b>: feed two of them Seagrass and one lays eggs on the sand. Eggs hatch faster at night. A baby turtle drops a ${icon(I.SCUTE)} Scute when it grows up; 5 make a ${icon(I.TURTLE_HELMET)} Turtle Shell.</li>
      <li><b>Splashers</b> help you swim fast. Feed one a Minnow and it leads you to the nearest shipwreck, ruin, or buried treasure.</li>
      <li><b>Drowned</b> rise from the water at night. Some carry a trident and throw it.</li>
      <li><b>Bubble columns</b>: water over Wailing Sand pushes you up, water over Magma pulls you down.</li>
    </ul>` },
  trident: { title: "Tridents", html: () => `
    <p>${icon(I.TRIDENT)} Drowned that carry a trident sometimes drop it. It hits hard up close (9 damage).</p>
    <ul>
      <li><b>Throw it:</b> hold right-click, then let go (8 damage). Walk over it to pick it back up.</li>
      <li><b>Loyalty</b> makes it fly back to you.</li>
      <li><b>Riptide</b> launches <i>you</i> through the water instead of throwing it (only while you're in water).</li>
      <li><b>Impaling</b> adds damage against sea creatures.</li>
      <li><b>Channeling</b>: a thrown trident calls lightning down onto the creature it hits, during a thunderstorm, out under the open sky.</li>
    </ul>
    <p class="help">Loyalty and Riptide can't go on the same trident.</p>` }
};

export function oceansGuideHTML(G) {
  const open = PAGES[G.oceanGuide] ? G.oceanGuide : "floor";
  const menu = `<div class="swg-menu">${Object.entries(PAGES).map(([k, pg]) => `<button class="chip-btn ${open === k ? "on" : ""}" data-ocg="${k}">${pg.title}</button>`).join("")}</div>`;
  return `<div class="swg">${menu}<div class="swg-text"><h4>${PAGES[open].title}</h4>${PAGES[open].html()}</div></div>`;
}
export function bindOceansGuide(p, G, rerender, click) {
  p.querySelectorAll("[data-ocg]").forEach(btn => btn.onclick = () => { click(); G.oceanGuide = btn.dataset.ocg; rerender(); });
}
