// Milestone 19, Part A: weather on the Surface. Rain, snow, and thunderstorms.
// The weather comes from the world's seed and clock, the same way the desert sandstorm does. A reloaded world
// keeps the same sky, and Play Together friends (who get the host's clock) see the same weather as the host.
// Sleeping through a storm clears it for a while (`G.meta.wxClear`, in world seconds).
import { hash3 } from "./noise.js";
import { B, BLOCKS, idOf } from "./blocks.js";

export const SPELL = 0.4;     // the sky can change every 0.4 days (about 5 minutes)
const FADE = 0.12;            // part of a spell spent fading in or out
const RAIN_CHANCE = 0.22, THUNDER_CHANCE = 0.35;
const clamp01 = v => v < 0 ? 0 : v > 1 ? 1 : v;

// 0 = clear, 1 = rain (or snow), 2 = thunderstorm, for one spell of the sky
function spellKind(seed, s) {
  if (s * SPELL < 2) return 0;   // the first day and a bit are always clear
  if (hash3(seed, s, 41, 7) >= RAIN_CHANCE) return 0;
  return hash3(seed, s, 43, 7) < THUNDER_CHANCE ? 2 : 1;
}
// How rainy and stormy the sky is (0-1 each) at a time in world seconds
export function weatherAt(seed, seconds, dayLength, clearUntil = 0, forced = null) {
  if (forced && seconds < forced.until) {   // Part D: a weather button in Creative
    const k = forced.kind === "thunder" ? 2 : forced.kind === "rain" ? 1 : 0;
    const ease = clamp01((seconds - forced.at) / 6);
    return { rain: (k ? 1 : 0) * ease, thunder: (k === 2 ? 1 : 0) * ease, kind: k };
  }
  const days = seconds / dayLength, f = days / SPELL, s = Math.floor(f), t = f - s;
  const cur = spellKind(seed, s);
  const lv = k => [k ? 1 : 0, k === 2 ? 1 : 0];
  let [rain, thunder] = lv(cur);
  if (t < FADE) { const [r0, t0] = lv(spellKind(seed, s - 1)), m = 0.5 + t / (2 * FADE); rain = r0 + (rain - r0) * m; thunder = t0 + (thunder - t0) * m; }
  else if (t > 1 - FADE) { const [r1, t1] = lv(spellKind(seed, s + 1)), m = (t - (1 - FADE)) / (2 * FADE); rain += (r1 - rain) * m; thunder += (t1 - thunder) * m; }
  if (clearUntil) { const k = clamp01((seconds - clearUntil) / 40); rain *= k; thunder *= k; }   // after sleeping it comes back slowly
  return { rain: smooth(rain), thunder: smooth(thunder), kind: cur };
}
const smooth = v => v * v * (3 - 2 * v);
// When the next rain or storm starts (world seconds), for the Journal and tests
export function nextWeather(seed, seconds, dayLength) {
  const s0 = Math.floor(seconds / dayLength / SPELL);
  for (let s = s0 + 1; s < s0 + 400; s++) { const k = spellKind(seed, s); if (k) return { at: s * SPELL * dayLength, kind: k }; }
  return null;
}

// What falls from the sky in a biome: 0 nothing (dry lands), 1 rain, 2 snow. High up, rain turns to snow.
const DRY = new Set(["sandy", "badlands", "savanna"]);
const COLD = new Set(["peak", "snowy_plains", "frozen_ocean"]);
export const SNOW_LINE = 60;
export function precipOf(biome, y) {
  if (DRY.has(biome)) return 0;
  return COLD.has(biome) || y >= SNOW_LINE ? 2 : 1;
}

// Does a block stop rain? Flowers, grass, torches, crops and fire don't.
const PASS = new Set(["cross", "torch", "crop"]);
function stopsRain(id) { if (id === B.AIR || id === B.FIRE) return false; const d = BLOCKS[id]; return !d || !PASS.has(d.shape); }

// A small per-column memory: the highest block that stops rain, and what falls there
export function makeSkyColumns(G) {
  const cache = new Map();
  let world = null, edits = -1;
  function at(x, z) {
    const w = G.world;
    if (w !== world || w.editCount !== edits || cache.size > 6000) { cache.clear(); world = w; edits = w.editCount; }
    const k = x * 100003 + z;
    let c = cache.get(k);
    if (c) return c;
    if (!w.isLoaded(x, z)) return { top: 999, kind: 0, off: true };
    let top = 0;
    for (let y = 79; y > 0; y--) if (stopsRain(idOf(w.get(x, y, z)))) { top = y; break; }
    const biome = w.biomeAt ? w.biomeAt(x, z) : w.gen.column(x, z).biome;
    c = { top, kind: precipOf(biome, top + 1), biome };
    cache.set(k, c);
    return c;
  }
  // Is a spot out in the open where rain (not snow) is falling?
  const rainedOn = (x, y, z) => { const c = at(Math.floor(x), Math.floor(z)); return c.kind === 1 && y >= c.top + 1; };
  const open = (x, y, z) => { const c = at(Math.floor(x), Math.floor(z)); return c.kind > 0 && y >= c.top + 1; };
  return { at, rainedOn, open, clear: () => cache.clear() };
}

// The falling rain and snow you see around you
export function createWeatherView(THREE, scene) {
  const N = 900;
  const drops = Array.from({ length: N }, () => ({ x: 0, y: 0, z: 0, vy: 0, kind: 0, floor: 0, wait: Math.random() * 0.5, sway: 0 }));
  const rainPos = new Float32Array(N * 6), snowPos = new Float32Array(N * 3);
  const rainGeo = new THREE.BufferGeometry(), snowGeo = new THREE.BufferGeometry();
  rainGeo.setAttribute("position", new THREE.BufferAttribute(rainPos, 3).setUsage(THREE.DynamicDrawUsage));
  snowGeo.setAttribute("position", new THREE.BufferAttribute(snowPos, 3).setUsage(THREE.DynamicDrawUsage));
  const rainMat = new THREE.LineBasicMaterial({ color: 0xa8bcd8, transparent: true, opacity: 0.5, depthWrite: false });
  const snowMat = new THREE.PointsMaterial({ color: 0xffffff, size: 0.15, transparent: true, opacity: 0.9, depthWrite: false });
  const rain = new THREE.LineSegments(rainGeo, rainMat), snow = new THREE.Points(snowGeo, snowMat);
  rain.frustumCulled = snow.frustumCulled = false;
  rain.renderOrder = snow.renderOrder = 3;
  scene.add(rain, snow);
  let shown = 0;
  return {
    // level: 0-1 how hard it's coming down; cols: makeSkyColumns(); max: how many drops this computer can afford
    update(dt, cam, level, cols, max, onSplash) {
      const R = 13, want = Math.round(max * level);
      let nr = 0, ns = 0;
      for (let i = 0; i < N; i++) {
        const d = drops[i];
        if (d.kind) {
          d.y += d.vy * dt;
          if (d.kind === 2) { d.sway += dt; d.x += Math.sin(d.sway * 1.7 + i) * 0.35 * dt; d.z += Math.cos(d.sway * 1.3 + i) * 0.35 * dt; }
          const far = Math.abs(d.x - cam.x) > R + 3 || Math.abs(d.z - cam.z) > R + 3;
          if (d.y <= d.floor || far || d.y < cam.y - 14) {
            if (d.kind === 1 && d.y <= d.floor && !far && onSplash && Math.random() < 0.06) onSplash(d.x, d.floor, d.z);
            d.kind = 0; d.wait = Math.random() * 0.15;
          }
        } else if (i < want && (d.wait -= dt) <= 0) {   // start a new drop somewhere above you
          const a = Math.random() * Math.PI * 2, r = 1 + R * Math.sqrt(Math.random());
          const x = cam.x + Math.cos(a) * r, z = cam.z + Math.sin(a) * r, c = cols.at(Math.floor(x), Math.floor(z));
          const y = c.kind === 2 ? cam.y - 3 + Math.random() * 14 : cam.y + 6 + Math.random() * 12;   // snow drifts all around you, rain comes from above
          if (!c.kind || c.top + 1 >= y) { d.wait = 0.2 + Math.random() * 0.3; continue; }
          d.kind = c.kind; d.x = x; d.z = z; d.y = y; d.floor = c.top + 1;
          d.vy = c.kind === 1 ? -(17 + Math.random() * 5) : -(1.6 + Math.random() * 1.2);
          d.sway = Math.random() * 6;
        }
        if (d.kind === 1) {
          const o = nr * 6, len = 0.55;
          rainPos[o] = d.x; rainPos[o + 1] = d.y + len; rainPos[o + 2] = d.z;
          rainPos[o + 3] = d.x; rainPos[o + 4] = Math.max(d.floor, d.y); rainPos[o + 5] = d.z;
          nr++;
        } else if (d.kind === 2) { const o = ns * 3; snowPos[o] = d.x; snowPos[o + 1] = d.y; snowPos[o + 2] = d.z; ns++; }
      }
      rainGeo.setDrawRange(0, nr * 2); snowGeo.setDrawRange(0, ns);
      rainGeo.attributes.position.needsUpdate = nr > 0; snowGeo.attributes.position.needsUpdate = ns > 0;
      rain.visible = nr > 0; snow.visible = ns > 0;
      shown = nr + ns;
      return { rain: nr, snow: ns };
    },
    hide() { for (const d of drops) d.kind = 0; rain.visible = snow.visible = false; shown = 0; },
    count: () => shown
  };
}
