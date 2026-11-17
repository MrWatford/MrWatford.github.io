// THE ENDWATCH CITADEL, Stage 2: the drawbridge, the portcullis, and the Outer Siege.
// Every castle generates closed: the drawbridge stands raised on its hinge row (open water in front of it) and iron
// bars fill the gate arch. Defenders hold the bridge (archers on the two shore watchtowers and the bridge, Groaners,
// Skitters, and a Siege Captain). Beat them all and the outer Gate Winch works: the portcullis grinds up, then the
// drawbridge swings down on its chains. Creative and Peaceful skip the siege; the inner winch always opens the gate,
// so nobody is ever shut in. Saved per castle in story.citadel.spots[i].gate; the blocks themselves are saved as changes.
import { B, make } from "./blocks.js";
import { CITADEL, GATE, toWorld } from "./citadel.js";

const G0 = CITADEL.ground, F = G0 + 1;
const LANDING = [0, 102];
// The defenders (castle-local u, v; y: a number, or "ground" = stand on the land there). drop: left out on Easy.
const POSTS = [
  { sp: "skeleton", u: -9, v: 106, y: GATE.towerTop + 1, role: "archer" },
  { sp: "skeleton", u: 9, v: 106, y: GATE.towerTop + 1, role: "archer", drop: true },
  { sp: "skeleton", u: -2, v: 80, y: F, role: "archer" },
  { sp: "skeleton", u: 2, v: 80, y: F, role: "archer" },
  { sp: "vindicator", u: 0, v: 86, y: F, role: "captain", patrol: [[0, 83], [0, 93]] },
  { sp: "zombie", u: -2, v: 90, y: F, patrol: [[-2, 88], [-2, 98]] },
  { sp: "zombie", u: 2, v: 95, y: F, patrol: [[2, 92], [2, 100]], drop: true },
  { sp: "zombie", u: 0, v: 99, y: F, patrol: [[0, 97], [0, 104]] },
  { sp: "spider", u: -6, v: 101, y: "ground", drop: true },
  { sp: "spider", u: 6, v: 109, y: "ground" },
  { sp: "zombie", u: -3, v: 104, y: "ground", hard: true },
  { sp: "zombie", u: 3, v: 104, y: "ground", hard: true },
  { sp: "zombie", u: 0, v: 110, y: "ground", hard: true }
];
const PORT_TIME = 3, DRAW_TIME = 4.5;

export function initCitadelGate({ G, ents, UI, Sound, scene, THREE, saveNow, puff }) {
  const A = {}, anims = [], chains = new Map();
  let hud = null, tick = 0;
  const spots = () => (G.story.citadel && G.story.citadel.spots) || {};
  function castles() {
    const out = [], s = spots();
    if (!G.gen || !G.gen.strongholds) return out;
    G.gen.strongholds.forEach((sh, i) => { const d = s[i]; if (d && d.on) out.push({ i, cx: sh.x, cz: sh.z, rot: d.rot, d }); });
    return out;
  }
  const at = (c, u, v) => { const [x, z] = toWorld(u, v, c.rot); return [c.cx + x, c.cz + z]; };
  const gate = c => c.d.gate || (c.d.gate = { open: false, down: {}, won: false });
  const diff = () => (G.wset && G.wset.difficulty) || "normal";
  const posts = () => POSTS.map((p, k) => ({ ...p, k })).filter(p => (diff() === "easy" ? !p.drop : true) && (p.hard ? diff() === "hard" : true));
  const nearest = (x, z) => { let b = null; for (const c of castles()) { const d = Math.hypot(c.cx - x, c.cz - z); if (!b || d < b.dist) b = { c, dist: d }; } return b; };
  const loud = (x, z) => Math.max(0, 1 - Math.hypot(G.player.pos.x - x, G.player.pos.z - z) / 60);

  // ---------- the blocks for each state ----------
  function setOpenBlocks(c, part) {
    const w = G.world;
    if (part !== "deck") for (let x = -3; x <= 3; x++) for (let y = F; y <= F + 9; y++) { const [wx, wz] = at(c, x, GATE.portZ); if ((w.id(wx, y, wz)) === B.PORTCULLIS) w.set(wx, y, wz, 0); }
    if (part !== "deck") for (let u = -GATE.half; u <= GATE.half; u++) for (let y = F; y <= G0 + GATE.panelTop; y++) { const [wx, wz] = at(c, u, GATE.hinge); const id = w.id(wx, y, wz); if (id === B.PLANKS || id === B.LOG) w.set(wx, y, wz, 0); }
    if (part !== "bars") for (let u = -GATE.half; u <= GATE.half; u++) for (let v = GATE.v0; v <= GATE.v1; v++) { const [wx, wz] = at(c, u, v); w.set(wx, G0, wz, Math.abs(u) === GATE.half ? B.LOG : B.PLANKS); }
  }
  const loaded = c => { const [a, b] = at(c, 0, GATE.v1), [e, f] = at(c, 0, GATE.portZ); return G.world.isLoaded(a, b) && G.world.isLoaded(e, f); };
  const deckDown = c => { const [x, z] = at(c, 0, Math.round((GATE.v0 + GATE.v1) / 2)); return G.world.id(x, G0, z) === B.PLANKS; };

  // ---------- the moving parts (drawn meshes while they move; real blocks before and after) ----------
  function castleGroup(c) { const g = new THREE.Group(); g.position.set(c.cx + 0.5, 0, c.cz + 0.5); g.rotation.y = -c.rot * Math.PI / 2; scene.add(g); return g; }
  const mat = col => new THREE.MeshBasicMaterial({ color: col });   // (the game's scene has no lamps; block colours are baked)
  function boxMesh(w, h, d, col, x, y, z) { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat(col)); m.position.set(x, y, z); return m; }
  function makeBars() {
    const g = new THREE.Group();
    for (let x = -3; x <= 3; x++) g.add(boxMesh(0.18, 10, 0.18, 0x3a3a42, x, 5, 0));
    for (let y = 1; y <= 9; y += 2) g.add(boxMesh(7.2, 0.18, 0.18, 0x2c2c34, 0, y, 0));
    for (let x = -3; x <= 3; x++) g.add(boxMesh(0.24, 0.5, 0.24, 0x8a8a94, x, -0.2, 0));   // the spikes
    return g;
  }
  function makeDeck() {
    const pivot = new THREE.Group(), w = GATE.half * 2 + 1, L = GATE.v1 - GATE.v0 + 1;
    pivot.add(boxMesh(w - 0.4, 0.9, L, 0x9c7442, 0, -0.45, L / 2));
    for (const x of [-GATE.half, GATE.half]) pivot.add(boxMesh(0.8, 1, L, 0x5a3d1f, x, -0.5, L / 2));
    for (const z of [1.5, L / 2, L - 1.5]) pivot.add(boxMesh(w, 0.2, 0.35, 0x3a3a42, 0, 0.02, z));   // iron straps
    return pivot;
  }
  function chainMesh() { return new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 1, 5), mat(0x2a2a30)); }
  function placeChain(m, a, b) {   // stretch a thin cylinder between two points (castle-local)
    const dx = b.x - a.x, dy = b.y - a.y, dz = b.z - a.z, L = Math.hypot(dx, dy, dz);
    m.position.set((a.x + b.x) / 2, (a.y + b.y) / 2, (a.z + b.z) / 2); m.scale.set(1, L, 1);
    m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(dx / L, dy / L, dz / L));
  }
  // chains from the deck's far corners up to the tops of the two gate posts (always shown near a castle)
  function chainEnds(angle) {   // angle: 0 = lowered, -PI/2 = raised
    const L = GATE.v1 - GATE.v0 + 1, s = Math.sin(-angle), co = Math.cos(-angle), out = [];
    for (const x of [-GATE.half, GATE.half]) out.push([{ x, y: G0 + 1 + L * s, z: GATE.v0 + L * co }, { x: Math.sign(x) * 4.5, y: G0 + 9.5, z: GATE.hinge + 0.5 }]);
    return out;
  }
  function updateChains(c, angle) {
    let ch = chains.get(c.i);
    if (!ch) { const g = castleGroup(c); ch = { g, m: [chainMesh(), chainMesh()] }; ch.m.forEach(m => g.add(m)); chains.set(c.i, ch); }
    chainEnds(angle).forEach(([a, b], k) => placeChain(ch.m[k], a, b));
  }
  function clearChains() { for (const ch of chains.values()) { scene.remove(ch.g); ch.g.traverse(o => { if (o.geometry) o.geometry.dispose(); if (o.material) o.material.dispose(); }); } chains.clear(); }

  // ---------- opening ----------
  function open(c, how) {
    const g = gate(c);
    if (g.open && deckDown(c)) { UI.toast("The gate is already open."); return; }
    g.open = true; g.openedAt = Date.now(); g.how = how;
    if (anims.some(a => a.c.i === c.i)) return;
    setOpenBlocks(c, "bars");   // the bars and the raised timbers become moving parts
    const grp = castleGroup(c), bars = makeBars(), deck = makeDeck();
    bars.position.set(0, F, GATE.portZ + 0.5); deck.position.set(0, G0 + 1, GATE.v0); deck.rotation.x = -Math.PI / 2;
    grp.add(bars, deck);
    anims.push({ c, grp, bars, deck, t: 0, snd: 0 });
    const [gx, gz] = at(c, 0, GATE.portZ);
    UI.toast(how === "inner" ? "You heave the inner winch. The portcullis grinds upward…" : "The winch turns. Chains groan, and the portcullis begins to rise…", "good");
    Sound.tone(90, 0.8, "sawtooth", 0.12 * loud(gx, gz) + 0.03, -20);
    saveNow && saveNow(false);
  }
  function step(a, dt) {
    a.t += dt; a.snd -= dt;
    const [px, pz] = at(a.c, 0, GATE.portZ), [dx, dz] = at(a.c, 0, GATE.v1), k = 1 - Math.max(0, Math.min(1, Math.hypot(G.player.pos.x - dx, G.player.pos.z - dz) / 70));
    if (a.t < PORT_TIME) {   // the portcullis rises into the gatehouse
      a.bars.position.y = F + 9.5 * (a.t / PORT_TIME) ** 1.2;
      if (a.snd <= 0) { a.snd = 0.14; Sound.tone(60 + Math.random() * 30, 0.12, "sawtooth", 0.07 * k + 0.005); }
      return false;
    }
    const t = Math.min(1, (a.t - PORT_TIME) / DRAW_TIME), e = 1 - (1 - t) * (1 - t);   // the drawbridge eases down
    a.bars.visible = false;
    const ang = -Math.PI / 2 * (1 - e); a.deck.rotation.x = ang; updateChains(a.c, ang);
    if (a.snd <= 0) { a.snd = 0.09; Sound.tone(700 + Math.random() * 500, 0.04, "square", 0.035 * k + 0.003); if (Math.random() < 0.3) Sound.tone(110, 0.2, "triangle", 0.05 * k); }
    if (t < 1) return false;
    setOpenBlocks(a.c, "deck");
    Sound.tone(52, 0.7, "sine", 0.4 * k + 0.02, -18);
    for (let v = GATE.v0; v <= GATE.v1; v += 2) { const [x, z] = at(a.c, 0, v); puff && puff(x + 0.5, G0 + 1.2, z + 0.5, "poof"); }
    UI.toast("The drawbridge thunders down. The Endwatch Citadel is open.", "good");
    G.adv && G.adv("citadelgate");
    saveNow && saveNow(false);
    return true;
  }

  // ---------- the winches ----------
  A.useWinch = hit => {
    const n = nearest(hit.x, hit.z); if (!n) return;
    const c = n.c, [ix, iz] = at(c, GATE.inner[0], GATE.inner[1]), inner = Math.hypot(hit.x - ix, hit.z - iz) < 3;
    if (inner) { open(c, "inner"); return; }
    const g = gate(c), free = G.creative || G.spectator || diff() === "peaceful";
    if (!g.won && !free) { const left = posts().filter(p => !g.down[p.k]).length; UI.toast(`The winch is chained fast. Defeat the Outer Siege first (${left} defender${left === 1 ? "" : "s"} left).`, "bad"); Sound.tone(150, 0.2, "square", 0.08); return; }
    open(c, "outer");
  };
  A.open = i => { const c = castles().find(q => q.i === i); if (c) open(c, "test"); };   // (testing)

  // ---------- the Outer Siege ----------
  const live = new Map();   // "castle:post" → entity
  function groundY(x, z) { const w = G.world; for (let y = 70; y > 10; y--) { const id = w.id(x, y, z); if (id && id !== B.TALL_GRASS && id !== B.WATER) return y + 1; } return null; }
  function siege(c) {
    const g = gate(c), p = G.player.pos, [lx, lz] = at(c, LANDING[0], LANDING[1]);
    const dLand = Math.hypot(p.x - lx, p.z - lz), inCastle = Math.hypot(p.x - c.cx, p.z - c.cz) < CITADEL.island;
    // tally the fallen
    for (const [key, e] of live) {
      if (!key.startsWith(c.i + ":")) continue;
      // archers hold their posts (their dodging would walk them off a watchtower): drift too far and they step back
      if (e.siegeArcher && !e.dead && Math.hypot(e.pos.x - e.home.x, e.pos.z - e.home.z) > 1.2) { e.pos.x = e.home.x; e.pos.y = e.home.y; e.pos.z = e.home.z; e.vel.x = e.vel.y = e.vel.z = 0; e.goal = null; e.path = null; }
      if (e.dead) { g.down[e.siegePost] = true; live.delete(key); if (!g.won && posts().every(q => g.down[q.k])) win(c); }
      else if (e.gone || !ents.list.includes(e)) live.delete(key);
    }
    const active = !g.won && !g.open && !G.creative && !G.spectator && diff() !== "peaceful" && G.dim === "overworld" && dLand < 70 && !inCastle;   // (once the gate is open, the siege no longer matters)
    showHud(active || (!g.won && !g.open && dLand < 90 && !inCastle && !G.creative && diff() !== "peaceful") ? c : null);
    if (!active) { if (dLand > 120) for (const [key, e] of live) if (key.startsWith(c.i + ":")) { e.gone = true; live.delete(key); } return; }
    for (const q of posts()) {
      const key = c.i + ":" + q.k; if (g.down[q.k] || live.has(key)) continue;
      const [x, z] = at(c, q.u, q.v); if (!G.world.isLoaded(x, z)) continue;
      const y = q.y === "ground" ? groundY(x, z) : q.y; if (y == null) continue;
      if (Math.hypot(x + 0.5 - p.x, z + 0.5 - p.z) < 7) continue;
      if (G.world.id(x, y, z) || G.world.id(x, y + 1, z)) continue;   // never inside a block
      const e = ents.add(q.sp, x + 0.5, y, z + 0.5); if (!e) continue;
      e.persist = false; e.noBurn = true; e.siegePost = q.k; e.home = { x: x + 0.5, y, z: z + 0.5 };
      e.patrol = { pts: (q.patrol || [[q.u, q.v]]).map(([u, v]) => { const [px2, pz2] = at(c, u, v); return { x: px2 + 0.5, y, z: pz2 + 0.5 }; }), i: 0, wait: 0 };
      if (q.role === "captain") { e.name = "Siege Captain"; e.persist = false; }
      if (q.role === "archer") e.siegeArcher = true;
      live.set(key, e);
    }
  }
  function win(c) {
    const g = gate(c); g.won = true; g.wonAt = Date.now();
    Sound.levelUp();
    UI.toast("The Outer Siege is broken! Turn the Gate Winch by the bridge to lower the drawbridge.", "good");
    G.adv && G.adv("citadelsiege");
    saveNow && saveNow(false);
  }
  function showHud(c) {
    if (!hud) { hud = document.createElement("div"); hud.id = "siegeHud"; hud.style.cssText = "position:absolute;left:50%;top:64px;transform:translateX(-50%);background:rgba(28,16,14,.85);color:#f4e2c8;border:2px solid #8a3a2a;border-radius:16px;padding:6px 14px;font:800 13px system-ui,sans-serif;display:flex;gap:10px;align-items:center;pointer-events:none;z-index:5"; hud.innerHTML = '<span>⚔ Outer Siege</span><span style="width:110px;height:8px;border-radius:4px;background:#3a1a14;overflow:hidden;display:inline-block"><i style="display:block;height:100%;background:#e0603a;width:0;transition:width .3s"></i></span><b></b>'; (document.querySelector(".bh") || document.body).appendChild(hud); }
    if (!c) { hud.hidden = true; return; }
    const g = gate(c), all = posts(), left = all.filter(q => !g.down[q.k]).length;
    hud.hidden = false; hud.querySelector("i").style.width = Math.round(100 * (all.length - left) / all.length) + "%"; hud.querySelector("b").textContent = `${left} defender${left === 1 ? "" : "s"} left`;
  }

  // ---------- every frame ----------
  A.update = dt => {
    for (let k = anims.length - 1; k >= 0; k--) { const a = anims[k]; if (step(a, dt)) { scene.remove(a.grp); a.grp.traverse(o => { if (o.geometry) o.geometry.dispose(); if (o.material) o.material.dispose(); }); anims.splice(k, 1); } }
    if ((tick -= dt) > 0) return; tick = 0.5;
    if (G.dim !== "overworld" || !G.world) { clearChains(); if (hud) hud.hidden = true; return; }
    let shown = false;
    for (const c of castles()) {
      const near = Math.hypot(G.player.pos.x - c.cx, G.player.pos.z - c.cz) < 190;
      if (!near) { const ch = chains.get(c.i); if (ch) { scene.remove(ch.g); chains.delete(c.i); } continue; }
      const g = gate(c), moving = anims.some(a => a.c.i === c.i);
      // after a reload (or if the deck was broken), put the open gate's blocks back in place
      if (g.open && !moving && loaded(c) && !deckDown(c)) setOpenBlocks(c, "all");
      if (!moving) updateChains(c, g.open ? 0 : -Math.PI / 2);
      if (!shown) { siege(c); shown = !!(hud && !hud.hidden); }
    }
    if (!shown && hud) hud.hidden = true;
  };
  A.reset = () => { for (const a of anims) scene.remove(a.grp); anims.length = 0; clearChains(); for (const e of live.values()) e.gone = true; live.clear(); if (hud) hud.hidden = true; };
  A.state = i => { const c = castles().find(q => q.i === i); return c ? { ...gate(c), posts: posts().length, live: [...live.keys()].filter(k => k.startsWith(i + ":")).length } : null; };
  return A;
}
