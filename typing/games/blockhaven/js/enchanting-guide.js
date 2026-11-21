// The "Enchanting" journal tab (Milestone 15, Part C): how to get started, the table, every enchantment,
// the Anvil, the Grindstone, and where enchanted books turn up. Written in Blockhaven's own words.
import { B, I, iconURL } from "./blocks.js";
import { ENCH, ENCH_KEYS, roman } from "./enchanting.js";

const ON = { armor: "Any armor", wearable: "Armor or Glider Wings", helmet: "Helmet", chest: "Chestplate", boots: "Boots", sword: "Sword",
  axe: "Axe", digger: "Pickaxe, shovel, axe, hoe", shears: "Shears", bow: "Bow", rod: "Fishing rod", durable: "Anything that wears out", any: "Anything that wears out" };
const icon = id => `<img src="${iconURL(id)}" alt="" style="width:20px;height:20px;image-rendering:pixelated;vertical-align:middle">`;
// The bookshelf ring, seen from above: T = table, B = bookshelf, . = must stay empty
const RING = ["B B B B B", "B . . . B", "B . T . B", "B . . . B", "B B . B B"];

const PAGES = {
  start: { title: "Getting started", html: () => `
    <p><b>Enchanting makes your gear stronger:</b> sharper swords, faster pickaxes, tougher armor, bows that never run out of arrows.</p>
    <ol>
      <li>${icon(I.LAPIS)} <b>Find Lapis.</b> Lapis Ore is deep underground (below level 30). Mine it with a stone pickaxe or better.</li>
      <li>${icon(B.SUGAR_CANE)} <b>Grow sugar cane</b> next to water. 3 cane make 3 Paper.</li>
      <li>${icon(I.BOOK)} <b>Make Books:</b> 3 Paper + 1 Leather.</li>
      <li>${icon(B.ENCH_TABLE)} <b>Make an Enchanting Table:</b> 4 Obsidian + 2 Skyshard + 1 Book, at a workbench.</li>
      <li><b>Earn levels.</b> Fight monsters, mine ores, smelt, fish, and trade. The green number above your hotbar is your level.</li>
    </ol>
    <p class="help">Enchanted items shimmer purple. Point at one to see its enchantments.</p>` },
  table: { title: "The Enchanting Table", html: () => `
    <p>Right-click the table. Put in <b>one</b> tool, weapon, armor piece, bow, fishing rod, or Book, and some Lapis. You'll see 3 offers:</p>
    <ul>
      <li>The <b>green number</b> is the level you need.</li>
      <li>Picking an offer only costs <b>1, 2, or 3 levels</b> and 1, 2, or 3 Lapis.</li>
      <li>The offer shows <b>one</b> enchantment you'll get. “. . . ?” means there are more surprises.</li>
    </ul>
    <p><b>Bookshelves make the offers stronger.</b> Put them 2 blocks away from the table, at the same level or one higher, with nothing in the space between. 15 bookshelves unlock level 30, the best.</p>
    <div class="swg-layers"><div class="swg-layer"><small>Seen from above (a second ring on top fits even more)</small>
      <div class="swg-grid" style="grid-template-columns:repeat(5,30px)">${RING.flatMap(r => r.split(" ")).map(c => c === "." ? `<span class="swg-cell empty" title="Empty space"></span>` :
        `<span class="swg-cell" title="${c === "T" ? "Enchanting Table" : "Bookshelf"}"><img src="${iconURL(c === "T" ? B.ENCH_TABLE : B.BOOKSHELF)}" alt=""></span>`).join("")}</div></div></div>
    <p class="help">The offers stay the same until you enchant something, so changing your mind is free. A Book becomes an Enchanted Book you can put on gear later with an Anvil.</p>` },
  list: { title: "Every enchantment", html: () => `
    <p>Roman numerals show the level: I = 1, II = 2, III = 3, IV = 4, V = 5. Enchantments in the same group (like the four Protections) can't go on one item together.</p>
    <table class="ench-table"><thead><tr><th>Enchantment</th><th>Goes on</th><th>Best</th><th>What it does</th></tr></thead><tbody>
    ${ENCH_KEYS.map(k => { const e = ENCH[k];
      return `<tr class="${e.curse ? "curse" : ""}"><td><b>${e.name}</b>${e.treasure ? ` <small>(treasure only)</small>` : ""}</td><td>${ON[e.on]}${e.anvil ? ` <small>(+ ${ON[e.anvil].toLowerCase()} with an Anvil)</small>` : ""}</td><td>${roman(e.max)}</td><td>${e.desc}</td></tr>`; }).join("")}
    </tbody></table>` },
  anvil: { title: "The Anvil", html: () => `
    <p>${icon(B.ANVIL)} <b>Make one:</b> 3 Blocks of Iron + 4 iron ingots. Put your item on the left, then on the right add:</p>
    <ul>
      <li><b>Its material</b> to repair it (iron for iron tools, Skyshard for Skyshard…). Each piece fixes a quarter.</li>
      <li><b>The same item</b> to join two worn ones into one, keeping both sets of enchantments.</li>
      <li><b>An Enchanted Book</b> to add its enchantment. Two of the same level make the next level up: Sharpness III + Sharpness III = Sharpness IV.</li>
    </ul>
    <p>Type in the <b>Name</b> box to give an item its own name.</p>
    <p><b>Watch the cost.</b> Each time an item goes through the Anvil, the next time costs more. At 40 levels it's “Too expensive!”. Plan your enchantments before you start adding them.</p>
    <p class="help">Anvils wear out: they chip, crack, and finally break.</p>` },
  grind: { title: "The Grindstone", html: () => `
    <p>${icon(B.GRINDSTONE)} <b>Make one:</b> 2 sticks + 1 stone + 2 planks.</p>
    <ul>
      <li>Put in an enchanted item to <b>remove its enchantments</b> and get some experience back. Enchanted Books turn back into Books.</li>
      <li><b>Curses never come off.</b></li>
      <li>Put in two worn copies of the same item to join them.</li>
      <li>It also resets how much the Anvil charges for that item.</li>
    </ul>` },
  find: { title: "Finding enchanted books", html: () => `
    <ul>
      <li><b>Treasure chests</b> in ruins and structures, the Ember Depths, and the Hollow. The Hollow has the strongest enchanted gear.</li>
      <li><b>Fishing</b>: a lucky catch can be an Enchanted Book. Luck of the Sea helps.</li>
      <li><b>Scribe villagers</b> sell one Enchanted Book each, for a Book and some Jade. Every Scribe has a different one.</li>
      <li><b>The Wanderer</b> sometimes has one too.</li>
    </ul>
    <p><b>Treasure enchantments</b> (Mending, Frost Walker, and the curses) never come from the table, only from books you find or buy.</p>
    <p class="help">Careful with treasure books: they can carry a <b>Curse of Binding</b> (armor stays on until it breaks or you faint) or a <b>Curse of Vanishing</b> (gone if you faint).</p>` }
};

export function enchantingGuideHTML(G) {
  const open = PAGES[G.enchGuide] ? G.enchGuide : "start";
  const menu = `<div class="swg-menu">${Object.entries(PAGES).map(([k, pg]) => `<button class="chip-btn ${open === k ? "on" : ""}" data-eng="${k}">${pg.title}</button>`).join("")}</div>`;
  return `<div class="swg">${menu}<div class="swg-text"><h4>${PAGES[open].title}</h4>${PAGES[open].html()}</div></div>`;
}
export function bindEnchantingGuide(p, G, rerender, click) {
  p.querySelectorAll("[data-eng]").forEach(btn => btn.onclick = () => { click(); G.enchGuide = btn.dataset.eng; rerender(); });
}
