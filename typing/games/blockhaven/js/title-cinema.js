// Cinematic title-screen slideshow: full-screen scene pictures that crossfade every 8 seconds,
// with a slow camera drift, light CSS particles, a scene caption, and a scene accent color.
// It only runs while the title screen is showing and the tab is visible. It never touches saves.
//
// To add or replace a picture: put "<id>-1920.webp", "<id>-1280.webp" and "<id>-1280.jpg" in img/title/
// (tools/title-capture.js and tools/title-convert.html make them) and list the id in `art` below.

const DIR = "img/title/";
const HOLD = 8000;          // start-to-start time for each scene (includes the fade)
const FADE = 1800;          // crossfade length

// status "live" = playable now; "planned" = artwork for an idea that isn't in the game yet (caption says so).
// art: picture ids to try in order (artwork first, in-game capture as a backup). Scenes with no art are skipped.
export const SCENES = [
  { id: "overworld", name: "The Surface", line: "Where every adventure begins.", accent: "#f5c431", fx: "pollen", focus: "50% 60%", art: ["overworld-castle", "overworld"], status: "live" },
  { id: "village", name: "Legacy Village", line: "The castle at the heart of the Legacy Campaign.", accent: "#4a7fe0", fx: "dust", focus: "50% 45%", art: ["legacy-village"], status: "live" },
  { id: "gus", name: "Gus, the Iron Golem", line: "A three-chapter story campaign.", accent: "#ffb040", fx: "sparks", focus: "100% 50%", art: ["gus-iron-golem"], status: "planned" },
  { id: "echohold", name: "Echohold", line: "A lost city sleeps beneath the world.", accent: "#2fd3d6", fx: "motes", focus: "50% 50%", art: ["echohold"], status: "live" },
  { id: "forsaken", name: "The Forsaken World", line: "Enter the realm of Herobrine.", accent: "#c0262c", fx: "embersRed", focus: "50% 30%", art: ["forsaken-world"], status: "live", herobrine: true },
  { id: "mutants", name: "The Forsaken Mutants", line: "Five twisted guardians of Herobrine's realm.", accent: "#b0182a", fx: "embersRed", focus: "50% 22%", art: ["forsaken-mutants"], status: "planned" },
  { id: "embers", name: "The Ember Depths", line: "Cindermaw waits in its citadel.", accent: "#ff7a1a", fx: "embers", focus: "50% 50%", art: [] /* waiting for ember-depths art */, status: "live" },
  { id: "hollow", name: "The Hollow", line: "Face the Hollow Wyrm.", accent: "#9a5cf0", fx: "void", focus: "50% 45%", art: [] /* waiting for hollow art */, status: "live" },
  { id: "leviathan", name: "The Leviathan Desert", line: "Titans move beneath the sands.", accent: "#f0a030", fx: "sand", focus: "55% 45%", art: ["leviathan"], status: "live" },
  { id: "jurassic", name: "The Lost World", line: "A prehistoric land, waiting to be discovered.", accent: "#4caf50", fx: "ash", focus: "60% 35%", art: ["jurassic"], status: "planned" },
  { id: "furious", name: "The Fall of the Furious Four", line: "Four heroes stand against a rising storm.", accent: "#b44cff", fx: "storm", focus: "50% 40%", art: ["furious-four"], status: "planned" },
  { id: "tempest", name: "The Blight Tempest", line: "The Blightking's storm rises over the citadel.", accent: "#a040ff", fx: "storm", focus: "50% 30%", art: ["blight-citadel"], status: "live" },
  { id: "colosseum", name: "The Grand Colosseum", line: "Every legend begins with training.", accent: "#cd7f32", fx: "dust", focus: "50% 35%", art: ["colosseum"], status: "planned" },
  { id: "wildlife", name: "The Wild", line: "A living world full of creatures.", accent: "#2ecc71", fx: "leaves", focus: "40% 60%", art: ["wildlife"], status: "live" },
  { id: "grizzly", name: "The Grizzly", line: "A rare giant of the deep forest.", accent: "#c8782e", fx: "leaves", focus: "40% 45%", art: ["grizzly"], status: "planned" },
  { id: "castle", name: "Victory at the Castle", line: "Every legend comes home.", accent: "#ffd34d", fx: "sparks", focus: "50% 40%", art: [] /* waiting for castle art */, status: "live" }
];

// particle looks: [count, color(s), direction, size px, speed s]
const FX = {
  pollen: [14, ["#fff6c0", "#ffe27a"], "drift", 3, 16], dust: [12, ["#f2e6c8"], "drift", 2, 18],
  motes: [16, ["#5ff0ff", "#9bfcff"], "rise", 3, 14], embers: [18, ["#ffb040", "#ff6a10"], "rise", 3, 9],
  embersRed: [14, ["#ff3a3a", "#ff8080"], "rise", 3, 12], void: [16, ["#c79bff", "#8a4ae0"], "rise", 3, 15],
  sand: [20, ["#f6d48e", "#e8b860"], "wind", 2, 7], ash: [14, ["#cfcfcf", "#8a8a8a"], "fall", 3, 14],
  storm: [14, ["#c060ff", "#e0b0ff"], "rise", 3, 10], leaves: [10, ["#7ed957", "#e0c040"], "fall", 4, 15],
  sparks: [18, ["#ffe680", "#ff9ad5", "#9ad8ff"], "rise", 3, 9]
};

const ok = new Map();       // picture id → resolved URL, or false if it failed
let root = null, layers = [], cap = null, parts = null, egg = null;
let order = [], idx = -1, front = 0, timer = 0, running = false, settings = {}, sceneStart = 0, eggTimer = 0;
const mq = matchMedia("(prefers-reduced-motion: reduce)");

// Which files each picture has in img/title/. Pictures not listed have all three of the usual files.
// Every picture has "-1280.jpg", the safe fallback. Listing only real files keeps the page from asking for missing ones.
const STD = ["1920.webp", "1280.webp", "1280.jpg"];
const FILES = {
  "overworld-castle": ["1280.jpg"], echohold: ["1920.jpg", "1280.jpg"], "forsaken-world": ["1920.jpg", "1280.jpg"], jurassic: ["1280.jpg"],
  leviathan: ["1920.jpg", "1280.jpg"], "furious-four": ["1920.jpg", "1280.jpg"], grizzly: ["1280.jpg"],
  "gus-iron-golem": ["1920.jpg", "1280.jpg"]
};
const canWebp = document.createElement("canvas").toDataURL("image/webp").startsWith("data:image/webp");
// best size for this screen first, then smaller/plainer ones
function candidates(id) {
  const big = innerWidth * (devicePixelRatio || 1) > 1400, have = FILES[id] || STD;
  const pref = (big ? ["1920.webp", "1920.jpg"] : []).concat(["1280.webp", "1280.jpg"]);
  return pref.filter(f => have.includes(f) && (canWebp || !f.endsWith("webp"))).map(f => DIR + id + "-" + f);
}
// load + decode one picture before it's shown, so a fade never reveals a blank frame
function load(id) {
  if (ok.has(id)) return Promise.resolve(ok.get(id));
  const urls = candidates(id);
  const one = url => new Promise(res => {
    const im = new Image(); im.decoding = "async";
    im.onload = () => (im.decode ? im.decode().catch(() => {}) : Promise.resolve()).then(() => res(url));
    im.onerror = () => res(false);
    im.src = url;
  });
  return (async () => {
    for (const url of urls) { const u = await one(url); if (u) { ok.set(id, u); return u; } }
    ok.set(id, false); return false;
  })();
}
async function pictureFor(scene) {
  for (const id of scene.art) { const u = await load(id); if (u) return u; }
  return false;
}

const reduced = () => settings.titleReduce === "on" || (settings.titleReduce !== "off" && (mq.matches || !!settings.reducedMotion));

export const Cinema = {
  init(el, s) {
    root = el; settings = s || {};
    root.innerHTML = `<div class="tc-layer"></div><div class="tc-layer"></div><div class="tc-shade"></div><div class="tc-parts" aria-hidden="true"></div><div class="tc-egg" aria-hidden="true"><i></i></div><p class="tc-cap" aria-live="off"><b></b><span></span></p>`;
    layers = [...root.querySelectorAll(".tc-layer")]; parts = root.querySelector(".tc-parts");
    cap = root.querySelector(".tc-cap"); egg = root.querySelector(".tc-egg");
    order = SCENES.map((_, i) => i);
    document.addEventListener("visibilitychange", () => this.setActive(this.wanted));
    mq.addEventListener?.("change", () => this.apply(settings));
    this.apply(settings);
  },
  wanted: false,
  apply(s) {
    settings = s || settings;
    if (!root) return;
    const on = settings.titleCinema !== false;
    document.body.classList.toggle("tc-on", on);
    root.hidden = !on;
    root.classList.toggle("tc-still", reduced() || settings.titleMotion === false);
    cap.hidden = settings.titleCaptions === false;
    if (!on) { this.stop(); return; }
    this.makeParticles(SCENES[order[idx]]);
    this.setActive(this.wanted);
  },
  setActive(want) {
    this.wanted = want;
    const go = want && !document.hidden && settings.titleCinema !== false && root;
    if (go && !running) this.start();
    else if (!go && running) this.stop();
  },
  async start() {
    running = true;
    root.classList.add("tc-run");
    if (idx < 0) await this.next(true);
    else { const left = HOLD - (performance.now() - sceneStart); this.schedule(Math.max(600, left)); }
  },
  stop() {
    running = false; clearTimeout(timer); clearTimeout(eggTimer); timer = 0;
    root?.classList.remove("tc-run"); egg?.classList.remove("on");
  },
  schedule(ms) { clearTimeout(timer); timer = setTimeout(() => this.next(false), ms); },
  // show the next scene that has a picture; scenes whose pictures fail are skipped
  async next(first) {
    if (!running) return;
    for (let tries = 0; tries < order.length; tries++) {
      const n = (idx + 1 + tries) % order.length, scene = SCENES[order[n]], url = await pictureFor(scene);
      if (!running) return;
      if (!url) continue;
      idx = n; this.show(scene, url, first);
      sceneStart = performance.now();
      this.schedule(HOLD);
      // decode the one after this while this one is on screen
      for (let k = 1; k < order.length; k++) { const s2 = SCENES[order[(idx + k) % order.length]]; if (s2.art.some(id => ok.get(id) !== false)) { pictureFor(s2); break; } }
      return;
    }
    // no pictures at all: keep the plain sky background and stop trying
    this.stop(); root.classList.add("tc-empty"); document.body.classList.remove("tc-on");
  },
  show(scene, url, first) {
    const nextLayer = layers[1 - front], old = layers[front];
    nextLayer.style.backgroundImage = `url("${url}")`;
    nextLayer.style.backgroundPosition = scene.focus;
    nextLayer.classList.remove("zoom"); void nextLayer.offsetWidth; nextLayer.classList.add("zoom");
    // the new picture fades in ON TOP of the old one (which stays fully visible), so there's never a dark dip
    nextLayer.style.zIndex = 2; old.style.zIndex = 1;
    nextLayer.classList.add("on");
    clearTimeout(old._off); old._off = setTimeout(() => { if (layers[front] !== old) { old.classList.remove("on", "zoom"); } }, first ? 0 : FADE + 100);
    front = 1 - front;
    root.style.setProperty("--tc-accent", scene.accent);
    document.getElementById("title")?.style.setProperty("--tc-accent", scene.accent);
    cap.classList.remove("show");
    setTimeout(() => {
      cap.querySelector("b").textContent = scene.name;
      cap.querySelector("span").textContent = scene.status === "planned" ? scene.line + " (Planned for a future update.)" : scene.line;
      cap.classList.add("show");
    }, first ? 200 : FADE * 0.6);
    this.makeParticles(scene);
    // rare Herobrine at the edge of the Forsaken scene: about 1 visit in 5, gone before the fade
    clearTimeout(eggTimer); egg.classList.remove("on");
    if (scene.herobrine && !reduced() && Math.random() < 0.2) {
      eggTimer = setTimeout(() => { egg.classList.add("on"); eggTimer = setTimeout(() => egg.classList.remove("on"), 3200); }, 2600);
    }
  },
  makeParticles(scene) {
    if (!parts) return;
    parts.textContent = "";
    if (!scene || settings.titleParticles === false || reduced()) return;
    const [count, colors, dir, size, speed] = FX[scene.fx] || FX.dust;
    const small = innerWidth < 700 || (navigator.hardwareConcurrency || 4) <= 4;
    const n = Math.round(count * (small ? 0.5 : 1));
    for (let i = 0; i < n; i++) {
      const p = document.createElement("i");
      p.className = "tc-p " + dir;
      const s = size * (0.6 + Math.random() * 0.9);
      p.style.cssText = `left:${(Math.random() * 100).toFixed(1)}%;top:${(Math.random() * 100).toFixed(1)}%;width:${s.toFixed(1)}px;height:${s.toFixed(1)}px;background:${colors[i % colors.length]};animation-duration:${(speed * (0.7 + Math.random() * 0.6)).toFixed(1)}s;animation-delay:-${(Math.random() * speed).toFixed(1)}s`;
      parts.append(p);
    }
  },
  // test helpers
  _state: () => ({ running, idx, scene: SCENES[order[idx]]?.id, front, loaded: Object.fromEntries(ok), particles: parts?.childElementCount || 0, still: root?.classList.contains("tc-still") }),
  _next: () => Cinema.next(false)
};
