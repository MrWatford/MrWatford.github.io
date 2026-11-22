// The "Building" journal tab (Milestone 21, Part E): slabs and stairs, colors and dyes, light and climbing, decorations.
// Written in Blockhaven's own words.
import { B, I, iconURL } from "./blocks.js";

const icon = id => `<img src="${iconURL(id)}" alt="" style="width:20px;height:20px;image-rendering:pixelated;vertical-align:middle">`;

const PAGES = {
  shapes: { title: "Slabs, stairs, walls", html: () => `
    <ul>
      <li>${icon(B.OAK_SLAB)} <b>Slabs</b>: 3 blocks make 6 (in 20 woods and stones). Click the top of a block for a low slab, or the underside (or the top half of a side) for a high one. Put a second slab on the empty half to make a double slab.</li>
      <li>${icon(B.STONE_BRICK_STAIRS)} <b>Stairs</b>: 6 blocks make 4. They climb away from you. Place them on the underside of a block for upside-down stairs, good for roofs.</li>
      <li>${icon(B.COBBLE_WALL)} <b>Walls</b>: 6 stone blocks make 6 (8 kinds). They join each other and are too tall to jump over, like fences.</li>
      <li>You walk right up slabs and stairs without jumping.</li>
    </ul>` },
  colors: { title: "Colors and dyes", html: () => `
    <ul>
      <li>${icon(I.RED_DYE)} <b>Dyes from nature</b>: Red Poppy (red), Sunbell (yellow), Pink Petals (pink), Lapis (blue), Cocoa Beans (brown), Ink Sac (black), Bone Meal (white). Cook Cactus for green and a Sea Pickle for lime.</li>
      <li>${icon(I.PURPLE_DYE)} <b>Mix two dyes</b>: red + yellow = orange, blue + white = light blue, blue + green = cyan, red + blue = purple, purple + pink = magenta, black + white = gray, gray + white = light gray, green + white = lime, red + white = pink.</li>
      <li>${icon(B.ORANGE_WOOL)} <b>Wool</b>: White Wool + a dye. 2 wool make 3 ${icon(B.ORANGE_CARPET)} carpets.</li>
      <li>${icon(B.CYAN_STAINED_GLASS)} <b>Stained glass</b> and ${icon(B.MAGENTA_TERRACOTTA)} <b>terracotta</b>: 8 of them + a dye make 8.</li>
      <li>${icon(B.LIME_CONCRETE_POWDER)} <b>Concrete</b>: 4 Sand + 4 Gravel + a dye make 8 Concrete Powder. It falls like sand. Pour water on it (or drop it in water) and it sets into smooth ${icon(B.LIME_CONCRETE)} Concrete.</li>
    </ul>` },
  light: { title: "Light and climbing", html: () => `
    <ul>
      <li>${icon(B.LADDER)} <b>Ladders</b> go on walls. Walk into one to climb, crouch to hold still, let go to slide down. No fall damage!</li>
      <li>${icon(B.SCAFFOLDING)} <b>Scaffolding</b> (bamboo + string): jump inside to climb up, stand on top, crouch to go down. Break the bottom one and the whole tower comes down, so it's easy to clean up.</li>
      <li>${icon(B.LANTERN)} <b>Lanterns</b> stand on a block or hang underneath one.</li>
      <li>${icon(B.YELLOW_CANDLE)} <b>Candles</b>: up to 4 in one spot. Light them with Flint and Steel; right-click with an empty hand to blow them out. More candles, more light.</li>
      <li>${icon(B.GLASS_PANE)} <b>Glass panes</b> and ${icon(B.IRON_BARS)} <b>iron bars</b> are thin and join up into windows and fences.</li>
    </ul>` },
  decor: { title: "Decorations", html: () => `
    <ul>
      <li>${icon(B.PAINTING)} <b>Paintings</b>: click a wall and the biggest picture that fits is hung there. There are 12 to find, from a red apple to a castle on a hill.</li>
      <li>${icon(B.ITEM_FRAME)} <b>Item frames</b>: right-click with anything to show it off, right-click again to turn it, hit the frame to take it back.</li>
      <li>${icon(B.ARMOR_STAND)} <b>Armor stands</b>: right-click with armor to put it on; right-click with an empty hand to take a piece back.</li>
      <li>${icon(B.RED_BANNER)} <b>Banners</b> (6 wool + a stick) stand on the ground or hang on a wall.</li>
    </ul>
    <p class="help">Find every new block in the Creative tab "Decor".</p>` }
};

export function buildingGuideHTML(G) {
  const open = PAGES[G.buildGuide] ? G.buildGuide : "shapes";
  const menu = `<div class="swg-menu">${Object.entries(PAGES).map(([k, pg]) => `<button class="chip-btn ${open === k ? "on" : ""}" data-bdg="${k}">${pg.title}</button>`).join("")}</div>`;
  return `<div class="swg">${menu}<div class="swg-text"><h4>${PAGES[open].title}</h4>${PAGES[open].html()}</div></div>`;
}
export function bindBuildingGuide(p, G, rerender, click) {
  p.querySelectorAll("[data-bdg]").forEach(btn => btn.onclick = () => { click(); G.buildGuide = btn.dataset.bdg; rerender(); });
}
