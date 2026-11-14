// The Grand Desert Temple comes alive: embers and smoke rise from its braziers, sand drifts across the platform,
// the wind picks up, and desert undead guard it (using creatures the game already has):
//   Desert Husk     = "husk"            (patrols the courtyard, walkways, and the sunken pits)
//   Temple Sentinel = "tomb_guardian"   (shielded; at the grand entrance and the pyramid's base)
//   Ancient Guardian= "ancient_sentinel"(rare and strong; a few chosen spots)
// Guards are never saved; they appear at their posts when you come near (never right in front of you), walk their
// routes, chase you, walk back afterwards, and return a while after they're beaten. Peaceful worlds have none.
const SPECIES = { husk: "husk", sentinel: "tomb_guardian", guardian: "ancient_sentinel" };
export const MONUMENT_LIFE = { range: 96, maxGuards: 8, respawn: { easy: 180, normal: 120, hard: 60 }, rareChance: 0.35 };

export function initMonumentLife({ G, L, ents, Sound, emitParticle, COLORS, roomForParticles }) {
  const S = { fx: 0, dust: 0, think: 0, groan: 20, guards: new Map(), cool: new Map(), wind: false };
  const A = {};
  const solid = (w, x, y, z) => { const id = w.id(x, y, z); return id && id !== 63; };
  function info() { return G.dim === "overworld" && G.world && L.monument ? L.monument() : null; }

  A.update = dt => {
    const m = info();
    if (!m) { S.wind = false; return; }
    const p = G.player.pos, lx = p.x - m.center.x, lz = p.z - m.center.z;
    const near = Math.abs(lx) < MONUMENT_LIFE.range && lz > -MONUMENT_LIFE.range && lz < MONUMENT_LIFE.range + 10;
    if (!near) { S.wind = false; clearGuards(); return; }
    effects(dt, m, p);
    if ((S.think -= dt) <= 0) { S.think = 1; guards(m, p); }
  };

  // ---------- fire, smoke, drifting sand, wind ----------
  function effects(dt, m, p) {
    const fancy = G.settings.quality === "fancy", calm = G.settings.reducedMotion;
    if ((S.fx -= dt) <= 0 && roomForParticles()) {
      S.fx = fancy ? 0.06 : 0.12;
      for (let n = 0; n < 3; n++) {
        const b = m.braziers[Math.floor(Math.random() * m.braziers.length)];
        const x = m.center.x + b.x + 0.5, y = b.y + 1.6, z = m.center.z + b.z + 0.5;
        if (Math.hypot(x - p.x, z - p.z) > 56 || !G.world.isLoaded(x, z)) continue;
        if (G.world.id(Math.floor(x), b.y + 1, Math.floor(z)) !== 63) continue;   // only where the fire still burns
        emitParticle(x + (Math.random() - 0.5) * 0.5, y, z + (Math.random() - 0.5) * 0.5, (Math.random() - 0.5) * 0.4, 1.6 + Math.random() * 1.2, (Math.random() - 0.5) * 0.4, 0.9 + Math.random() * 0.6, COLORS.ember, true);
        if (!calm) emitParticle(x + (Math.random() - 0.5) * 0.3, y + 0.6, z + (Math.random() - 0.5) * 0.3, 0.25, 0.7 + Math.random() * 0.4, 0.1, 2.4, COLORS.ash, true);   // a thin wisp of smoke
      }
    }
    // wind and drifting sand on the open platform (heavier in gusts; the sandstorm system adds its own on stormy days)
    const gust = Math.max(0, Math.sin(G.time * Math.PI * 22) * Math.sin(G.time * Math.PI * 7));
    const onTop = p.y >= m.top - 2;
    S.wind = onTop;   // main.js plays a light wind while this is on (a sandstorm plays its own, stronger one)
    if (!calm && (S.dust -= dt) <= 0 && roomForParticles()) {
      S.dust = fancy ? 0.05 : 0.1;
      if (Math.random() < 0.3 + gust * 0.7) emitParticle(p.x - 10 + Math.random() * 6, p.y + 0.2 + Math.random() * 2.2, p.z + (Math.random() - 0.5) * 18, 3 + gust * 4, -0.1, 0.4, 2.2, COLORS.crumb, true);
    }
    // now and then, a distant groan from somewhere in the ruins (more often at night)
    const night = G.time > 0.75 || G.time < 0.25;
    if ((S.groan -= dt) <= 0) { S.groan = (night ? 18 : 40) + Math.random() * 25; Sound.mob && Sound.mob("groan", 14 + Math.random() * 10); }
  }

  // ---------- guards ----------
  function clearGuards() {
    for (const [k, e] of S.guards) if (e && !e.dead && !e.gone) e.gone = true;   // they wander off when you leave (nothing is saved)
    S.guards.clear();
  }
  function guards(m, p) {
    const diff = (G.wset && G.wset.difficulty) || "normal";
    if (diff === "peaceful" || G.guest) return;
    const now = performance.now() / 1000, w = G.world;
    let alive = 0;
    for (const [k, e] of S.guards) {
      if (!e || e.dead || e.gone || !ents.list.includes(e)) { S.guards.delete(k); if (e && e.dead) S.cool.set(k, now + (MONUMENT_LIFE.respawn[diff] || 120)); continue; }
      alive++;
    }
    const order = m.posts.map((post, i) => [post, i]).sort((a, b) => (a[0].role === "husk") - (b[0].role === "husk"));   // sentinels and guardians first, then husks
    order.forEach(([post, i]) => {
      const k = "mg" + i;
      if (S.guards.has(k) || alive >= MONUMENT_LIFE.maxGuards || (S.cool.get(k) || 0) > now) return;
      const x = m.center.x + post.x, z = m.center.z + post.z, y = post.y, d = Math.hypot(x + 0.5 - p.x, z + 0.5 - p.z);
      if (d < 18 || d > 72 || !w.isLoaded(x, z)) return;   // not right in front of you, and only in loaded land
      if (!solid(w, x, y - 1, z) || w.id(x, y, z) || w.id(x, y + 1, z)) return;   // never inside a wall
      if (post.rare && Math.random() > MONUMENT_LIFE.rareChance * (diff === "easy" ? 0.5 : 1)) { S.cool.set(k, now + 60); return; }
      const e = ents.add(SPECIES[post.role], x + 0.5, y, z + 0.5);
      if (!e) return;
      e.persist = false; e.monumentPost = k;
      e.home = { x: x + 0.5, y, z: z + 0.5 };
      e.patrol = { pts: (post.patrol || [{ x: post.x, z: post.z }]).map(q => ({ x: m.center.x + q.x + 0.5, y, z: m.center.z + q.z + 0.5 })), i: 0, wait: Math.random() * 2 };
      S.guards.set(k, e); alive++;
    });
  }
  A.guards = () => [...S.guards.values()];
  A.windy = () => S.wind;
  A.reset = () => { clearGuards(); S.cool.clear(); };
  return A;
}
