// A read-only terrain chart. Sampling columns never loads chunks or changes terrain.
import { SEA } from "./blocks.js";
import { LOST_WORLD, LostWorldGenerator } from "./lost-world.js";
import { LOST_WORLD_REGIONS, isLostWorldDimension } from "./lost-world-regions.js";
import { CAMP_TABLET, FIELD_TABLET } from "./lost-world-campaign.js";
import { SURVEY_POSTS } from "./fern-plains.js";
import { PUMP, RELAY } from "./mangrove-wetlands.js";
import { OVERLOOK, RIDGE_STATION, redwoodDeck } from "./redwood-escarpment.js";
import { SAMPLE, WINCH, amberFloor } from "./amber-caverns.js";
import { TRACKS, EXPEDITION_BEACON, REX_HOME, isCoverRoute } from "./tyrant-canyon.js";
import { CALDERA_ANCHORS } from "./volcanic-badlands.js";
import { GODZILLA_SITE, GODZILLA_TERMINAL, GODZILLA_ANCHORS, CALDERA_CACHE } from "./godzilla-caldera.js";

const point = (id, title, site, note, danger = false) => ({ id, title, ...site, note, danger });
export const LOST_WORLD_CHART = [
  { dim: LOST_WORLD, title: "Primeval Jungle", color: "#508654", center: [0, 21], span: 92, start: 0,
    note: "Jungle camp, the stone arch, and the trail through Raptor Grove.", points: [
      point("camp", "Jungle Camp", CAMP_TABLET, "Berries and wood surround the arrival clearing. The briefing tablet is here during the expedition."),
      point("grove", "Raptor Grove", { x: 2, z: 34 }, "Raptor habitat beside the gravel trail. Animals can move away from this location.", true),
      point("outpost", "Field Outpost", FIELD_TABLET, "The expedition field log lies beyond the grove.")
    ] },
  { dim: "fern_plains", title: "Fern Plains", color: "#89a657", center: [0, 19], span: 98, start: 2,
    note: "Open herd country, riverbanks, and the two migration survey posts.", points: [
      point("west", "West Herd Crossing", SURVEY_POSTS[0], "The first migration survey site, west of the trail."),
      point("upper", "Upper Meadow", SURVEY_POSTS[1], "The second herd crossing above the meadow.")
    ] },
  { dim: "mangrove_wetlands", title: "Mangrove Wetlands", color: "#438d98", center: [0, 15], span: 82, start: 4,
    note: "A raised boardwalk connects the pump station and river relay.", points: [
      point("pump", "Pump Station", PUMP, "Service platform near the first dock. Giant mosquitoes gather around the water."),
      point("relay", "River Relay", RELAY, "Relay tower on the far platform. Stay on the boardwalk to avoid the Spinosaurus.")
    ] },
  { dim: "redwood_escarpment", title: "Redwood Escarpment", color: "#9d7953", center: [7, 26], span: 104, start: 6,
    note: "The torch-marked climb reaches a nesting overlook and an abandoned ridge station.", points: [
      point("overlook", "Nesting Overlook", OVERLOOK, "Look out over the Brachiosaurus meadow. The ridge bridge continues east."),
      point("station", "Ridge Station", RIDGE_STATION, "Timber shelter at the top of the climbing trail.")
    ] },
  { dim: "amber_caverns", title: "Amber Caverns", color: "#c39540", center: [5, 18], span: 76, start: 8,
    note: "An underground floor plan of the descending tunnels and sample chamber.", points: [
      point("sample", "Amber Sample Chamber", SAMPLE, "The core sample station is in the broad chamber at the bottom of the tunnel."),
      point("winch", "Return Passage Winch", WINCH, "The sealed passage is opened here during Chapter 5.")
    ] },
  { dim: "tyrant_canyon", title: "Tyrant Canyon", color: "#ac7453", center: [4, 17], span: 82, start: 10,
    note: "Rock walls shelter a side trail around Tyrannosaurus territory.", points: [
      point("tracks", "Tracker’s Camp", TRACKS, "Read the tracker’s notes near the trail entrance."),
      point("territory", "T. rex Territory", { x: REX_HOME[0], z: REX_HOME[2] }, "The Tyrannosaurus patrols this area. Its live position is not tracked.", true),
      point("beacon", "Expedition Beacon", EXPEDITION_BEACON, "The missing beacon stands on the far perch. The sheltered side trail approaches from the east.")
    ] },
  { dim: "volcanic_badlands", title: "Volcanic Badlands", color: "#b55a43", center: [0, 33], span: 128, start: 12,
    note: "Basalt causeways lead through alternating vents to the volcano.", points: [
      ...CALDERA_ANCHORS.map((site, i) => point("anchor" + i, site.name, site, "An expedition power anchor along the causeway. Watch the alternating vent lanes.")),
      point("volcano", "Volcano Summit", { x: 0, z: 76 }, "The volcanic peak beyond the final anchor. Enter the caldera through the expedition journal.", true)
    ] },
  { dim: "godzilla_caldera", title: "Godzilla’s Caldera", color: "#598fba", center: [0, 24], span: 102, start: 15,
    note: "The final arena, supply cache, awakening terminal, and three shield anchors.", points: [
      point("supplies", "Supply Cache", CALDERA_CACHE, "Equipment and food by the arena entrance. Supplies already taken remain consumed."),
      point("terminal", "Awakening Terminal", GODZILLA_TERMINAL, "Use this terminal to awaken Godzilla when you are ready."),
      point("godzilla", "Godzilla Arena", GODZILLA_SITE, "Godzilla’s arena. The blue atomic-breath lane must be cleared before it fires.", true),
      ...GODZILLA_ANCHORS.map((site, i) => point("shield" + i, ["West Shield Anchor", "East Shield Anchor", "Rear Shield Anchor"][i], site, "Activate during Broken Circuit to remove Godzilla’s shield."))
    ] }
];

export const chartRegion = dim => LOST_WORLD_CHART.find(r => r.dim === dim);
export function chartPoints(G, dim) {
  const region = chartRegion(dim);
  if (!region) return [];
  const arrival = dim === LOST_WORLD ? { x: 0, z: 0 } : LOST_WORLD_REGIONS[dim].arrival;
  const points = dim === LOST_WORLD ? region.points : [point("arrival", "Region Arrival", arrival, "Arrival point from the expedition journal."), ...region.points];
  return G.story.lostWorld || dim !== LOST_WORLD ? points : points.filter(p => p.id !== "outpost");
}

// Optional navigation preferences are replaced immutably so pending saves stay independent.
function preferences(G, patch) {
  const old = G.story.lostWorldMap;
  G.story.lostWorldMap = { v: 1, ...(old?.v === 1 ? old : {}), ...patch };
}
export function selectLostWorldWaypoint(G, dim, id) {
  if (!isLostWorldDimension(G.dim) || !chartPoints(G, dim).some(p => p.id === id)) return false;
  const old = G.story.lostWorldMap;
  preferences(G, { destinations: { ...(old?.v === 1 ? old.destinations : {}), [dim]: id }, hidden: false });
  return true;
}
export function lostWorldWaypoint(G) {
  const saved = G.story?.lostWorldMap;
  if (!isLostWorldDimension(G.dim) || saved?.v !== 1 || saved.hidden) return null;
  const region = chartRegion(G.dim), id = saved.destinations?.[G.dim];
  const p = chartPoints(G, G.dim).find(p => p.id === id);
  return p ? { ...p, color: region.color } : null;
}
export function toggleLostWorldWaypoint(G) {
  if (!isLostWorldDimension(G.dim) || !G.story.lostWorldMap?.destinations?.[G.dim]) return null;
  preferences(G, { hidden: !G.story.lostWorldMap.hidden });
  return !G.story.lostWorldMap.hidden;
}

const views = new WeakMap();
function viewFor(G) {
  let view = views.get(G.world);
  if (!view) { view = { dim: G.dim, overview: false, zoom: 1, center: [...chartRegion(G.dim).center], terrain: null }; views.set(G.world, view); }
  return view;
}
export function lostWorldMapHTML() {
  return `<section class="inv-card xmap lw-map" aria-label="Lost World map">
    <h3>Lost World Explorer’s Map <button type="button" class="chip-btn" data-lw-close>Close</button></h3>
    <p class="lw-map-intro">Choose a region, then select a landmark to set your waypoint.</p>
    <nav class="lw-map-regions" aria-label="Lost World regions"></nav>
    <div class="xm-body"><div><div class="xm-wrap"><canvas id="lwMapCanvas" width="480" height="480" role="img" aria-label="Lost World terrain and landmarks"></canvas>
      <div class="xm-zoom"><button type="button" class="btn small" data-lw-zoom="in" title="Zoom in" aria-label="Zoom in">+</button><button type="button" class="btn small" data-lw-zoom="out" title="Zoom out" aria-label="Zoom out">−</button><button type="button" class="btn small" data-lw-zoom="you" title="Center on you" aria-label="Center on you">◎</button><button type="button" class="btn small" data-lw-zoom="fit" title="Fit region" aria-label="Fit region">Fit</button></div></div>
      <p class="lw-map-key"><span>▲ You</span><span>● Landmark</span><span>◆ Danger</span><span>⋯ Bearing</span></p>
      <p class="help" data-lw-map-caption></p></div>
    <div><h4 data-lw-map-title></h4><div class="xm-list" data-lw-map-list></div><div class="xm-info" data-lw-map-info></div>
      <button type="button" class="btn small" data-lw-waypoint>Waypoint</button><p class="xm-coords" data-lw-coords></p><p class="help">M or Esc closes the map. Drag to pan. Use + / − to zoom. N toggles your waypoint while exploring.</p></div></div></section>`;
}

const text = (ctx, label, x, y, color = "#fff3cb", size = 12) => {
  ctx.font = `bold ${size}px system-ui, sans-serif`; ctx.textAlign = "center"; ctx.lineWidth = 4; ctx.strokeStyle = "#17271d"; ctx.fillStyle = color;
  ctx.strokeText(label, x, y); ctx.fillText(label, x, y);
};
const shade = (base, h, slope) => {
  const k = Math.max(.62, Math.min(1.28, .88 + h / 250 + slope * .04));
  return `rgb(${base.map(c => Math.round(Math.min(255, c * k))).join(",")})`;
};

export function mountLostWorldMap(root, G, click = () => {}) {
  const view = viewFor(G), cv = root.querySelector("#lwMapCanvas"), ctx = cv.getContext("2d"), W = cv.width;
  const nav = root.querySelector(".lw-map-regions"), list = root.querySelector("[data-lw-map-list]");
  let alive = true, hits = [], drag = null, lastPosition = "";
  const selected = () => G.story.lostWorldMap?.v === 1 ? G.story.lostWorldMap.destinations?.[view.dim] : null;
  const bpp = () => chartRegion(view.dim).span / W / view.zoom;
  const pixel = (x, z) => ({ x: (x - view.center[0]) / bpp() + W / 2, y: (z - view.center[1]) / bpp() + W / 2 });
  const available = region => !G.story.lostWorld || G.story.lostWorld.stage >= region.start || G.dim === region.dim;
  const status = region => G.dim === region.dim ? "You are here" : available(region) ? "Available in journal" : "Chapter " + (LOST_WORLD_CHART.indexOf(region) + 1);
  function regionPick(dim) {
    const region = chartRegion(dim); if (!region) return;
    click(); view.dim = dim; view.overview = false; view.zoom = 1; view.center = [...region.center]; view.terrain = null; render();
  }
  function pick(id) {
    if (!selectLostWorldWaypoint(G, view.dim, id)) return;
    click(); render();
  }
  function drawTerrain() {
    const region = chartRegion(view.dim), key = [view.dim, ...view.center, view.zoom].join(",");
    if (view.terrain?.key === key) return;
    const off = document.createElement("canvas"); off.width = off.height = W; const c = off.getContext("2d");
    const gen = view.dim === G.dim ? G.world.gen : view.dim === LOST_WORLD ? new LostWorldGenerator(G.meta.seed, G.meta.lostWorldGen || 1, !!G.story.lostWorld) : new LOST_WORLD_REGIONS[view.dim].Generator(G.meta.seed, !!G.story.lostWorld);
    const step = bpp() * 4;
    const bases = { lost_world: [53, 110, 61], fern_plains: [126, 155, 73], mangrove_wetlands: [58, 102, 79], redwood_escarpment: [78, 105, 66], amber_caverns: [78, 66, 52], tyrant_canyon: [150, 107, 73], volcanic_badlands: [91, 79, 75], godzilla_caldera: [89, 94, 99] };
    for (let py = 0; py < W; py += 4) for (let px = 0; px < W; px += 4) {
      const x = Math.floor(view.center[0] + (px - W / 2) * bpp()), z = Math.floor(view.center[1] + (py - W / 2) * bpp());
      const col = gen.column(x, z), west = gen.column(x - step, z);
      let color = shade(bases[view.dim], col.h, col.h - west.h);
      if (view.dim === "amber_caverns") color = amberFloor(x, z) === null ? "#302c28" : shade([151, 117, 67], amberFloor(x, z), 0);
      else if (col.h < SEA && !["tyrant_canyon", "volcanic_badlands", "godzilla_caldera"].includes(view.dim)) color = "#397c9c";
      if (view.dim === "redwood_escarpment" && redwoodDeck(x, z) !== null) color = "#c0a778";
      if (view.dim === "tyrant_canyon" && isCoverRoute(x, z)) color = "#c6b286";
      c.fillStyle = color; c.fillRect(px, py, 4, 4);
    }
    view.terrain = { key, image: off };
  }
  function drawOverview() {
    ctx.fillStyle = "#203e32"; ctx.fillRect(0, 0, W, W);
    ctx.strokeStyle = "#bdd19b22"; ctx.lineWidth = 1;
    for (let n = 0; n <= W; n += 24) { ctx.beginPath(); ctx.moveTo(n, 0); ctx.lineTo(n, W); ctx.moveTo(0, n); ctx.lineTo(W, n); ctx.stroke(); }
    const positions = [[112, 77], [345, 77], [345, 180], [112, 180], [112, 283], [345, 283], [345, 386], [112, 386]];
    ctx.strokeStyle = "#d9c892"; ctx.lineWidth = 3; ctx.setLineDash([6, 6]); ctx.beginPath();
    positions.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.stroke(); ctx.setLineDash([]);
    hits = LOST_WORLD_CHART.map((r, i) => {
      const [x, y] = positions[i]; ctx.fillStyle = available(r) ? r.color : "#46514b"; ctx.strokeStyle = r.dim === G.dim ? "#fff5a8" : "#14271f"; ctx.lineWidth = r.dim === G.dim ? 4 : 2;
      ctx.fillRect(x - 33, y - 29, 66, 52); ctx.strokeRect(x - 33, y - 29, 66, 52); text(ctx, String(i + 1), x, y + 3, "#fff6d6", 23);
      text(ctx, r.title, x, y + 42, r.dim === G.dim ? "#fff5a8" : "#fff3cb", 12);
      return { x, y, region: r.dim };
    });
    text(ctx, "EXPEDITION ROUTE", W / 2, 24, "#f2e5b7", 15);
    text(ctx, "Separate regions · travel through your journal", W / 2, 468, "#d2dfc0", 11);
  }
  function draw() {
    if (view.overview) { drawOverview(); return; }
    drawTerrain(); ctx.drawImage(view.terrain.image, 0, 0); hits = [];
    ctx.save(); ctx.strokeStyle = "#fff3cb22"; ctx.lineWidth = 1;
    const span = W * bpp(), grid = span > 180 ? 50 : 10, left = view.center[0] - span / 2, top = view.center[1] - span / 2;
    for (let x = Math.ceil(left / grid) * grid; x < left + span; x += grid) { const p = pixel(x, 0); ctx.beginPath(); ctx.moveTo(p.x, 0); ctx.lineTo(p.x, W); ctx.stroke(); }
    for (let z = Math.ceil(top / grid) * grid; z < top + span; z += grid) { const p = pixel(0, z); ctx.beginPath(); ctx.moveTo(0, p.y); ctx.lineTo(W, p.y); ctx.stroke(); }
    const here = G.dim === view.dim, dest = chartPoints(G, view.dim).find(p => p.id === selected());
    if (here && dest) {
      const a = pixel(G.player.pos.x, G.player.pos.z), b = pixel(dest.x, dest.z);
      ctx.strokeStyle = "#fff0a0"; ctx.lineWidth = 2; ctx.setLineDash([6, 5]); ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke(); ctx.setLineDash([]);
    }
    const labels = [];
    for (const [i, p] of chartPoints(G, view.dim).entries()) {
      const q = pixel(p.x, p.z); if (q.x < 14 || q.y < 25 || q.x > W - 14 || q.y > W - 32) continue;
      const on = p.id === selected();
      ctx.fillStyle = p.danger ? "#c76043" : "#efe3b5"; ctx.strokeStyle = on ? "#fff474" : "#18251a"; ctx.lineWidth = on ? 4 : 2;
      ctx.beginPath(); if (p.danger) { ctx.moveTo(q.x, q.y - 12); ctx.lineTo(q.x + 12, q.y); ctx.lineTo(q.x, q.y + 12); ctx.lineTo(q.x - 12, q.y); ctx.closePath(); } else ctx.arc(q.x, q.y, 11, 0, Math.PI * 2);
      ctx.fill(); ctx.stroke(); text(ctx, String(i + 1), q.x, q.y + 4, "#fff", 11);
      hits.push({ ...q, id: p.id });
      // Numbered pins always have an accessible list entry. Reserve the selected caption first.
      labels.push({ p, q, on });
    }
    const boxes = [];
    for (const { p, q, on } of labels.sort((a, b) => Number(b.on) - Number(a.on))) {
      const width = ctx.measureText(p.title).width + 12, x = Math.max(width / 2 + 4, Math.min(W - width / 2 - 4, q.x));
      const y = q.y - 20, box = [x - width / 2, y - 12, x + width / 2, y + 4];
      if (!on && boxes.some(b => box[0] < b[2] && box[2] > b[0] && box[1] < b[3] && box[3] > b[1])) continue;
      boxes.push(box); text(ctx, p.title, x, y, on ? "#fff474" : "#fff3cb");
    }
    if (here) {
      const q = pixel(G.player.pos.x, G.player.pos.z);
      if (q.x >= 0 && q.x <= W && q.y >= 0 && q.y <= W) {
        ctx.translate(q.x, q.y); ctx.rotate(-G.player.yaw); ctx.fillStyle = "#fff"; ctx.strokeStyle = "#132b26"; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(0, -12); ctx.lineTo(8, 8); ctx.lineTo(0, 4); ctx.lineTo(-8, 8); ctx.closePath(); ctx.fill(); ctx.stroke();
      }
    }
    ctx.restore(); text(ctx, "N", 22, 24, "#fff", 15);
    const bar = span > 180 ? 50 : 10;
    ctx.fillStyle = "#16281ed9"; ctx.fillRect(10, W - 35, bar / bpp() + 14, 25); ctx.fillStyle = "#fff3cb"; ctx.fillRect(17, W - 14, bar / bpp(), 3);
    text(ctx, bar + " blocks", 17 + bar / bpp() / 2, W - 20, "#fff3cb", 11);
  }
  function render() {
    const scrollTop = list.scrollTop, focus = document.activeElement;
    const focusSelector = list.contains(focus) && focus?.dataset.lwPoint ? `[data-lw-point="${focus.dataset.lwPoint}"]` :
      list.contains(focus) && focus?.dataset.lwRegion ? `[data-lw-map-list] [data-lw-region="${focus.dataset.lwRegion}"]` :
      nav.contains(focus) && focus?.dataset.lwRegion ? `.lw-map-regions [data-lw-region="${focus.dataset.lwRegion}"]` :
      nav.contains(focus) && focus?.hasAttribute("data-lw-overview") ? "[data-lw-overview]" : null;
    const region = chartRegion(view.dim);
    nav.innerHTML = `<button type="button" class="chip-btn ${view.overview ? "on" : ""}" aria-pressed="${view.overview}" data-lw-overview>Expedition route</button>` + LOST_WORLD_CHART.map((r, i) => `<button type="button" class="chip-btn ${!view.overview && r.dim === view.dim ? "on" : ""}" aria-pressed="${!view.overview && r.dim === view.dim}" data-lw-region="${r.dim}" title="${status(r)}">${i + 1}. ${r.title}${r.dim === G.dim ? " · You" : ""}</button>`).join("");
    nav.querySelector("[data-lw-overview]").onclick = () => { click(); view.overview = true; render(); };
    nav.querySelectorAll("[data-lw-region]").forEach(b => b.onclick = () => regionPick(b.dataset.lwRegion));
    root.querySelector("[data-lw-map-title]").textContent = view.overview ? "Expedition destinations" : region.title;
    root.querySelector("[data-lw-map-caption]").textContent = view.overview ? "The route shows chapter order. Each region has its own map and coordinates." : region.note + " Terrain is a survey of the region; player builds are not shown. The dotted bearing is a direction, not a safe path.";
    cv.setAttribute("aria-label", view.overview ? "Eight expedition regions in chapter order. Select a region using the destination list." : region.title + " terrain with numbered landmarks and your facing direction. Select landmarks using the destination list.");
    root.querySelector(".xm-zoom").hidden = view.overview;
    if (view.overview) {
      list.innerHTML = LOST_WORLD_CHART.map((r, i) => `<button type="button" class="xm-dest" data-lw-region="${r.dim}"><b>${i + 1}</b><span><b>${r.title}</b><small>${status(r)}</small></span><em>Map ›</em></button>`).join("");
      list.querySelectorAll("[data-lw-region]").forEach(b => b.onclick = () => regionPick(b.dataset.lwRegion));
    } else {
      list.innerHTML = chartPoints(G, view.dim).map((p, i) => `<button type="button" class="xm-dest ${selected() === p.id ? "on" : ""}" aria-pressed="${selected() === p.id}" data-lw-point="${p.id}"><b>${i + 1}</b><span><b>${p.title}</b><small>${p.danger ? "Danger · " : ""}X ${p.x}, Z ${p.z}</small></span><em>${G.dim === view.dim ? Math.round(Math.hypot(p.x - G.player.pos.x, p.z - G.player.pos.z)) + " blocks" : "Region"}</em></button>`).join("");
      list.querySelectorAll("[data-lw-point]").forEach(b => b.onclick = () => pick(b.dataset.lwPoint));
    }
    const info = root.querySelector("[data-lw-map-info]"), p = chartPoints(G, view.dim).find(p => p.id === selected());
    info.textContent = view.overview ? "Open your expedition journal (J) to travel to an available region." : p ? p.note + (G.dim !== view.dim ? " Your waypoint will appear when you enter this region." : "") : "Select a numbered landmark to set your waypoint.";
    const way = root.querySelector("[data-lw-waypoint]"); way.hidden = view.overview; way.disabled = !p;
    way.textContent = "Waypoint " + (G.story.lostWorldMap?.hidden ? "OFF" : "ON") + " (N)";
    root.querySelector("[data-lw-coords]").textContent = "You: " + chartRegion(G.dim).title + " · X " + Math.floor(G.player.pos.x) + ", Y " + Math.floor(G.player.pos.y) + ", Z " + Math.floor(G.player.pos.z);
    list.scrollTop = scrollTop;
    if (focusSelector) root.querySelector(focusSelector)?.focus({ preventScroll: true });
    draw();
  }
  root.querySelector("[data-lw-close]").onclick = () => G.closePanel();
  root.querySelector("[data-lw-waypoint]").onclick = () => { if (selected()) { preferences(G, { hidden: !G.story.lostWorldMap?.hidden }); click(); render(); } };
  function zoom(action) {
    if (view.overview) return;
    if (action === "fit") { view.zoom = 1; view.center = [...chartRegion(view.dim).center]; }
    else if (action === "you") { view.dim = G.dim; view.center = [G.player.pos.x, G.player.pos.z]; }
    else view.zoom = Math.max(.5, Math.min(4, view.zoom * (action === "in" ? 2 : .5)));
    view.terrain = null; render();
  }
  root.querySelectorAll("[data-lw-zoom]").forEach(b => b.onclick = () => { click(); zoom(b.dataset.lwZoom); });
  cv.onwheel = e => { e.preventDefault(); zoom(e.deltaY < 0 ? "in" : "out"); };
  cv.onpointerdown = e => { drag = { x: e.clientX, y: e.clientY, center: [...view.center], moved: false }; cv.setPointerCapture(e.pointerId); };
  cv.onpointermove = e => {
    if (!drag || view.overview) return;
    const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
    if (Math.hypot(dx, dy) > 4) drag.moved = true;
    if (drag.moved) { const scale = bpp() * W / cv.getBoundingClientRect().width; view.center = [drag.center[0] - dx * scale, drag.center[1] - dy * scale]; draw(); }
  };
  cv.onpointerup = e => {
    if (drag && !drag.moved) {
      const r = cv.getBoundingClientRect(), x = (e.clientX - r.left) * W / r.width, y = (e.clientY - r.top) * W / r.height;
      const hit = hits.map(h => ({ ...h, distance: Math.hypot(h.x - x, h.y - y) })).filter(h => h.distance < (view.overview ? 38 : 18)).sort((a, b) => a.distance - b.distance)[0];
      if (hit?.region) regionPick(hit.region); else if (hit?.id) pick(hit.id);
    }
    drag = null;
  };
  cv.onpointercancel = cv.onlostpointercapture = () => { drag = null; };
  render();
  lastPosition = [G.player.pos.x, G.player.pos.y, G.player.pos.z, G.player.yaw, G.story.lostWorldMap?.hidden].join(",");
  const timer = setInterval(() => {
    if (!alive || !cv.isConnected || G.world !== viewWorld || G.panelKind !== "xmap" || G.state !== "panel") { dispose(); return; }
    const position = [G.player.pos.x, G.player.pos.y, G.player.pos.z, G.player.yaw, G.story.lostWorldMap?.hidden].join(",");
    if (position !== lastPosition) { lastPosition = position; render(); }
  }, 400);
  const viewWorld = G.world;
  function dispose() { alive = false; clearInterval(timer); view.terrain = null; }
  return dispose;
}
