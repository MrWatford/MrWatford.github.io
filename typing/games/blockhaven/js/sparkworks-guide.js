// The "Sparkworks" journal tab (Milestone 12 Part E): how power works, plus 12 example builds with drawn diagrams.
// Every build here was built block by block in a test world and checked working (2026-11-12, see FEATURES.md).
import { B, I, iconURL } from "./blocks.js";

// One letter per grid square. Arrows show which way a part points (its front).
const KEY = {
  S: { id: B.STONE, name: "Any solid block" },
  D: { id: I.SPARKDUST, name: "Sparkdust" },
  T: { id: B.SPARK_TORCH, name: "Spark Torch" },
  L: { id: B.LEVER, name: "Lever" },
  b: { id: B.STONE_BUTTON, name: "Button" },
  P: { id: B.STONE_PLATE, name: "Pressure plate" },
  M: { id: B.SPARK_LAMP, name: "Spark Lamp" },
  N: { id: B.NOTE_BLOCK, name: "Note Block" },
  G: { id: B.GLOOP_BLOCK, name: "Gloop Block" },
  H: { id: B.HOPPER, name: "Hopper" },
  X: { id: B.CHEST, name: "Chest" },
  F: { id: B.FURNACE, name: "Furnace" },
  w: { id: B.TRIPWIRE_HOOK, name: "Tripwire Hook" },
  s: { id: I.STRING, name: "String (tripwire)" },
  r: { id: B.RAIL, name: "Rail" },
  p: { id: B.POWERED_RAIL, name: "Powered Rail" },
  W: { id: B.WHEAT, name: "Wheat (planted on farmland)" },
  g: { id: B.GLASS, name: "Glass (doesn't carry power)" },
};
const ARROW = { n: "▲", e: "▶", s: "▼", w: "◀", u: "⬆", d: "⬇" };
const WORD = { n: "north (up the picture)", e: "east (right)", s: "south (down the picture)", w: "west (left)", u: "up", d: "down" };

// Cells: "." empty, a KEY letter, or a letter + direction: "R>" style is written as "Re" (repeater facing east).
// Directional parts: R repeater, C comparator, K piston, Y sticky piston, O observer (its face looks this way), U dropper, Z dispenser.
const DIRKEY = {
  R: { id: B.REPEATER, name: "Repeater" }, C: { id: B.COMPARATOR, name: "Comparator" }, K: { id: B.PISTON, name: "Piston" },
  Y: { id: B.STICKY_PISTON, name: "Sticky Piston" }, O: { id: B.OBSERVER, name: "Observer (face looks this way)" },
  U: { id: B.DROPPER, name: "Dropper" }, Z: { id: B.DISPENSER, name: "Dispenser" },
};
const cellOf = tok => {
  if (!tok || tok === ".") return null;
  if (tok.length === 2 && ARROW[tok[1]] && (DIRKEY[tok[0]] || KEY[tok[0]])) return { ...(DIRKEY[tok[0]] || KEY[tok[0]]), dir: tok[1] };   // e.g. "Hs" = Hopper pointing south
  return KEY[tok] ? { ...KEY[tok] } : null;
};

// Each build: title, what it does, layers (a picture each), and steps.
// Rows are written left (west) to right (east), top row = north. Tokens are separated by spaces.
export const BUILDS = [
  { id: "not", title: "1. The NOT gate (an inverter)", what: "The lamp is on when the lever is off, and off when the lever is on. A Spark Torch on the side of a block does this: power the block and the torch goes out.",
    layers: [{ label: "Seen from above", rows: ["L D S T D M"] }],
    steps: ["Put a lever on the ground, then Sparkdust leading into a solid block.", "Stick a Spark Torch on the far side of that block.", "Run Sparkdust from the torch to a Spark Lamp.", "Flip the lever. The torch goes dark, and so does the lamp."] },
  { id: "clock", title: "2. A blinking clock", what: "A loop of Repeaters passes a signal round and round forever, so the lamp blinks on and off.",
    layers: [{ label: "On top (the loop)", rows: ["D Re D", "Rn . Rs", "D Rw D"] }, { label: "Floor underneath", rows: ["M S S", "S . S", "S S S"] }],
    steps: ["Build the loop on a floor of solid blocks: Sparkdust in the corners, 4 Repeaters pointing around the loop the same way.", "Swap the floor block under the top-left dust for a Spark Lamp (Sparkdust powers the block it sits on).", "Right-click each Repeater 3 times so all 4 are on the slowest setting. The loop has to be slower than the button's press, or the whole loop just stays on.", "Put a stone block with a button on it so it touches a corner dust, and press the button once. The lamp blinks from now on.", "To stop it, break any piece of the loop."] },
  { id: "latch", title: "3. A memory latch (an ON button and an OFF button)", what: "Press ON and the lamp stays on, even after the button pops back out. Press OFF and it stays off. Two Spark Torches keep each other in check, so the circuit remembers the last button you pressed.",
    layers: [{ label: "Ground layer, from above", rows: ["b S T Re S", ". D . . T", ". D . . Rs", ". D D D D"] }, { label: "One block up", rows: [". . M . b", ". . . . .", ". . . . .", ". . . . ."] }],
    steps: ["Place block A, a Spark Torch on its east side, a Repeater pointing east, and block B.", "Put a second Spark Torch on B's south side, then a Repeater pointing south.", "Run Sparkdust from that Repeater west and back north, so it ends pointing into block A.", "Put a Spark Lamp right on top of the first torch, so it shows that torch's state.", "The OFF button goes on A's west side. The ON button goes on top of B.", "Each torch turns the other one off through its block, so only one of them can be on at a time, and the circuit stays the way you left it."] },
  { id: "door", title: "4. A 2-by-2 piston door", what: "Four Sticky Pistons push stone into a doorway 2 blocks wide and 2 tall, and pull it back out.",
    layers: [{ label: "Top row, seen from the side", rows: ["L Ye S . . S Yw L"] }, { label: "Bottom row, seen from the side", rows: ["S Ye S . . S Yw S"] }],
    steps: ["On each side of a 2-wide, 2-tall doorway, stack two Sticky Pistons facing the doorway.", "Put one stone (or any block you like) in front of each piston. These are the door.", "Behind each pair, put a solid block at the bottom, and a lever standing on top of it. That lever touches the top piston and powers the block under it, so it runs both pistons.", "Flip both levers on: the door closes. Off: it opens."] },
  { id: "hatch", title: "5. A secret floor hatch", what: "A floor block drops out of the way when you flip a lever. The start of a hidden stairway!",
    layers: [{ label: "Seen from the side", rows: ["S S S S .", "S . S S .", "S Yu T S L"] }],
    steps: ["Dig a hole 2 deep in your floor. Place a Sticky Piston facing up at the bottom of the hole.", "Put your floor block back in the hole, right on top of the piston.", "Beside the piston, put a solid block with a Spark Torch on its side, touching the piston. The torch powers the piston, which pushes the floor block back up level with the floor.", "Put a lever on the far side of the torch's block. Flip it: the torch goes out, the piston pulls the floor block down, and a hole opens. Dig your stairs down from there.", "Flip the lever back and the floor closes again."] },
  { id: "sorter", title: "6. An item sorter", what: "Items flow along a line of Hoppers. Only the kind you pick drops into the chest below; everything else keeps going.",
    layers: [
      { label: "Top layer: the item line", rows: [". Hs . . . . . .", ". Hs . . . . . .", ". Hs . . . . . .", ". Hs . . . . . .", ". X . . . . . ."] },
      { label: "Middle layer", rows: [". He Ce D D D S T", ". . . . . . . D", ". D D D D D D D", ". . . . . . . .", ". . . . . . . ."] },
      { label: "Bottom layer", rows: ["X Hw g g g g . .", ". D . . . . . g", ". g g g g g g g", ". . . . . . . .", ". . . . . . . ."] }],
    steps: ["Top: a line of Hoppers pointing south carries items to an overflow chest.", "Middle: under the second Hopper of the line, put the filter Hopper pointing east into a Comparator (facing east).", "Fill the filter Hopper: 41 of the item you want to sort in the first slot, and 1 each of 4 different other things (that never travel the line) in the other slots. The Comparator now reads 2.", "Run 3 Sparkdust from the Comparator into a solid block, with a Spark Torch on that block's far side. Lead Sparkdust from the torch back around to the bottom layer, ending right beside the bottom Hopper. Put glass under the dust: glass doesn't carry power, so the dust can't power the wrong blocks.", "Bottom: under the filter Hopper, a Hopper pointing west into a chest. The torch's power keeps it locked.", "When one more of your item arrives, the Comparator reads 3, the signal reaches the block, the torch turns off for a moment, and the bottom Hopper pulls exactly one item into the chest."] },
  { id: "smelter", title: "7. An auto-smelter", what: "Drop ore in the top chest and fuel in the side Hopper; cooked items pile up in the bottom chest.",
    layers: [{ label: "Seen from the side", rows: ["X .", "Hd X", "F Hw", "Hd .", "X ."] }],
    steps: ["Put a chest on top of a Hopper pointing down into a Furnace's top (that's where things to cook go).", "Put a Hopper pointing sideways into the Furnace's side (that's where fuel goes), with a chest of coal on top of it.", "Put a Hopper under the Furnace pointing down into a chest. It pulls out whatever is done.", "No power needed. Hoppers move one item every 0.4 seconds."] },
  { id: "alarm", title: "8. A crop-growth alarm (Observer)", what: "An Observer watches your wheat and rings a Note Block each time it grows a stage. (The full observer auto-farm comes with sugar cane in the brewing milestone.)",
    layers: [{ label: "Seen from above", rows: ["W Ow N"] }],
    steps: ["Plant wheat on farmland.", "Place an Observer right next to it with its face looking at the wheat.", "Put a Note Block behind the Observer.", "Every time the wheat grows, the Observer sends a quick pulse and the Note Block plays."] },
  { id: "song", title: "9. A note block song", what: "A chain of Repeaters plays Note Blocks one after another, like a music box.",
    layers: [{ label: "Seen from above (one long line)", rows: ["b", "Rs", "N", "Rs", "N", "Rs", "N"] }],
    steps: ["Start with a solid block with a button on top.", "Then a straight chain: Repeater, Note Block, Repeater, Note Block, and so on, all pointing the same way. A powered Note Block plays, then passes the signal to the next Repeater.", "Right-click each Note Block to tune it (25 pitches). The block underneath picks the instrument: wood is a bass, sand is a drum, stone is a bass drum, gold is a bell, and so on.", "Repeater delays are your rhythm: more clicks = a longer wait before the next note.", "Sparkdust running past the side of a Note Block does not play it. The power has to point into it."] },
  { id: "trip", title: "10. A tripwire trap", what: "Walk through the string and a Dispenser fires.",
    layers: [{ label: "Seen from above", rows: ["S w s s w S", ". D . . . .", ". Ze . . . ."] }],
    steps: ["Put two Tripwire Hooks facing each other on the sides of blocks, up to 40 blocks apart.", "Fill the space between them with string. They click when connected.", "Run Sparkdust from one hook to a Dispenser aimed at the path. Load it with arrows, snowballs, or a water bucket.", "Anyone who steps on the string sets it off. Use shears to break string without setting it off."] },
  { id: "station", title: "11. A minecart station", what: "Your cart waits at the end of the track until you press the button, then shoots off.",
    layers: [{ label: "Seen from above", rows: ["S p r r r r", ". b . . . ."] }],
    steps: ["End your track against a solid block, with the last rail a Powered Rail.", "When it isn't powered, a Powered Rail works like a brake, so arriving carts stop there.", "Right beside the Powered Rail, put a solid block with a button on top.", "Get in, press the button: the rail turns on and pushes you away from the wall at full speed."] },
  { id: "fly", title: "12. A flying machine", what: "Two Observers and two pistons push each other along, carrying the whole machine across the sky until it hits something.",
    layers: [{ label: "Bottom layer, from above (it moves east ▶)", rows: [". . G", "G Ke G", "G Os ."] }, { label: "Top layer, from above", rows: [". . On", "G G Yw", ". . ."] }],
    steps: ["Build it high in the air; it travels east until it hits something it can't push.", "Bottom layer: a Piston facing east with Gloop Blocks as shown. South of the piston, an Observer whose face looks south (away from the piston), so its back powers the piston.", "Top layer: a Sticky Piston facing west, right above the Gloop Block in front of the bottom piston. North of it, an Observer whose face looks north, so its back powers the Sticky Piston. Add the two Gloop Blocks on the west end.", "Start it: place a block in front of the bottom Observer's face, then break it. The two pistons take turns, and each move sets off the other Observer.", "Gloop Blocks stick to everything next to them, so the whole thing moves together. Don't stand in its way!"] },
];

function grid(rows) {
  const cells = rows.map(r => r.trim().split(/\s+/));
  const cols = Math.max(...cells.map(r => r.length));
  let html = `<div class="swg-grid" style="grid-template-columns:repeat(${cols},30px)">`;
  for (const r of cells) for (let i = 0; i < cols; i++) {
    const c = cellOf(r[i]);
    html += c ? `<span class="swg-cell" title="${c.name}${c.dir ? ", pointing " + WORD[c.dir] : ""}"><img src="${iconURL(c.id)}" alt="${c.name}">${c.dir ? `<i>${ARROW[c.dir]}</i>` : ""}</span>` : `<span class="swg-cell empty"></span>`;
  }
  return html + "</div>";
}
function legend(build) {
  const seen = new Map();
  for (const l of build.layers) for (const r of l.rows) for (const t of r.trim().split(/\s+/)) { const c = cellOf(t); if (c && !seen.has(c.name)) seen.set(c.name, c); }
  return `<div class="swg-legend">${[...seen.values()].map(c => `<span><img src="${iconURL(c.id)}" alt="">${c.name}</span>`).join("")}</div>`;
}

export function sparkworksGuideHTML(G) {
  const open = G.sparkGuide || "basics";
  const menu = `<div class="swg-menu"><button class="chip-btn ${open === "basics" ? "on" : ""}" data-swg="basics">How power works</button>${BUILDS.map(b => `<button class="chip-btn ${open === b.id ? "on" : ""}" data-swg="${b.id}">${b.title.replace(/^\d+\. /, "")}</button>`).join("")}</div>`;
  let body;
  if (open === "basics") body = `<div class="swg-text">
    <h4>How power works</h4>
    <p><b>Power sources</b> make a signal: levers (on until you flip them), buttons (a short press), pressure plates (while something stands on them), Spark Torches, Blocks of Sparkdust, daylight sensors, tripwire, Observers, and targets.</p>
    <p><b>Sparkdust</b> carries the signal. It starts at strength 15 and gets 1 weaker for every dust block, so it reaches 15 blocks. Dust powers the block it sits on and whatever it points into.</p>
    <p><b>Repeaters</b> boost a signal back to 15, let it go only one way, and add a delay (right-click: 1 to 4 clicks). Power one from the side with another Repeater and it locks.</p>
    <p><b>Spark Torches</b> are always on, unless the block they're stuck to gets power. Then they turn off. That's how you flip a signal around (see the NOT gate).</p>
    <p><b>Comparators</b> read how full a chest, Hopper, or Furnace is, keep a signal, compare two signals, or (right-click) subtract one from the other.</p>
    <p><b>Solid blocks</b> pass power along: a block with a lever on it, a torch under it, or dust on it can power the parts touching it.</p>
    <p><b>Safety limit:</b> a machine that changes too fast gets paused for a moment so the game never freezes. If you see that message, slow your clock down.</p>
    <p class="note">Pick a build at the top to see a picture of it. Arrows on a part show the way it points. Hover a square to see its name.</p></div>`;
  else {
    const b = BUILDS.find(x => x.id === open) || BUILDS[0];
    body = `<div class="swg-text"><h4>${b.title}</h4><p>${b.what}</p>
      <div class="swg-layers">${b.layers.map(l => `<div class="swg-layer"><small>${l.label}</small>${grid(l.rows)}</div>`).join("")}</div>
      ${legend(b)}
      <ol>${b.steps.map(s => `<li>${s}</li>`).join("")}</ol></div>`;
  }
  return `<div class="swg">${menu}${body}</div>`;
}
export function bindSparkworksGuide(p, G, rerender, click) {
  p.querySelectorAll("[data-swg]").forEach(btn => btn.onclick = () => { click(); G.sparkGuide = btn.dataset.swg; rerender(); });
}
