// Echohold Reborn, Phase 6: the city's secrets and the journal's city map (deep-v2; everything checks the map's meta,
// so worlds on the original deep-v1 map simply don't have these).
// - The Silent Bell: pull the rope and the whole city settles for 45 seconds: the alert meter empties, Stalkers forget you
//   and wander, Watchers close their eyes, and sounds don't carry. It can be rung again after 5 minutes.
// - The Empty Throne: stand on the throne's seat for a moment and a stair opens down to the Royal Treasury.
// - The Silent Trial: cross the long hall under the West Quarter without being heard. Three sounds and it resets (and
//   two Hush Crawlers come). Reach the far end in time and the reward room opens.
// - The City Awakens: after you've found 10 districts, the moss across the city flares for a few seconds, once.
// - The journal: a map of Echohold that fills in as you find districts (secrets appear only once found), and how much
//   of the city you've explored.

export function createSecrets({ G, ents, UI, Sound, puff, st, M, setBox, saveNow, giveXp, reduced }) {
  let trial = null, sitT = 0, wakeT = 0;
  const now = () => G.clock || 0;
  const calmUntil = () => st().bellCalm || 0;

  // ---------- the Silent Bell ----------
  function ringBell() {
    const s = st(), m = M();
    if (s.bellReady && now() < s.bellReady) { UI.toast(`The bell is still humming. It can ring again in ${Math.ceil((s.bellReady - now()) / 60)} minute(s).`); return; }
    s.bellReady = now() + 300; s.bellCalm = now() + 45; s.alert = 0;
    [98, 73, 49].forEach((f, i) => setTimeout(() => Sound.tone(f, 3.2, "sine", 0.09 * (G.settings.fwAmbient ?? 0.8), -4), i * 120));
    for (let k = 0; k < 14; k++) puff(m.bell.x + (Math.random() - 0.5) * 4, m.bell.y + 7 + Math.random() * 4, m.bell.z + (Math.random() - 0.5) * 4, "hush");
    for (const e of ents.list) {
      if (e.dead || e.gone || !e.def.echohold || e.def.boss) continue;
      e.alertT = 0; e.heard = null; if (e.sp === "stalker") { e.st = "wander"; e.stT = 0; e.anger = 0; } if (e.sp === "watcher") { e.charge = 0; e.cd = 45; }
    }
    UI.toast("BONGGG. The Silent Bell rolls through the city. Everything that listens goes still. For a little while, nothing will hear you.", "good");
    if (!s.bellRung) { s.bellRung = true; giveXp(30); }
    saveNow(false);
  }

  // ---------- the Silent Trial ----------
  const inHall = (h, p) => p.pos.x >= h.x0 && p.pos.x <= h.x1 + 1 && p.pos.z >= h.z0 && p.pos.z <= h.z1 + 1 && Math.abs(p.pos.y - h.y) < 3;
  function trialTick(dt) {
    const pz = M().puzzles.silentTrial, s = st(), p = G.player;
    if (!pz || s.puz.silentTrial === "solved") return;
    if (!trial && inHall(pz.hall, p) && p.pos.x < pz.startX && G.mode === "survival") {
      trial = { strikes: 0, t: 90 };
      UI.toast("The Silent Trial begins! Cross the hall without being heard: three sounds and it resets. You have 90 seconds.", "");
    }
    if (!trial) return;
    trial.t -= dt;
    if (!inHall(pz.hall, p)) { trial = null; UI.toast("You left the hall. The Silent Trial waits for you to start again.", ""); return; }
    if (trial.t <= 0) { trial = null; UI.toast("Time ran out. Go back to the start of the hall to try again.", "bad"); return; }
    if (p.pos.x > pz.endX) {
      trial = null; s.puz.silentTrial = "solved"; setBox(pz.door, 0); Sound.levelUp(); giveXp(40); G.adv("lostpuzzle", "silentTrial");
      for (let k = 0; k < 6; k++) puff(pz.door.x0 + 0.5, pz.door.y0 + k * 0.4, (pz.door.z0 + pz.door.z1) / 2 + 0.5, "pale");
      UI.toast("Not a sound. The trial is passed, and the door at the end of the hall slides open.", "good"); saveNow(false);
    }
  }
  function trialHeard(x, z) {
    const pz = M().puzzles.silentTrial; if (!trial || !pz) return;
    const h = pz.hall; if (x < h.x0 || x > h.x1 + 1 || z < h.z0 || z > h.z1 + 1) return;
    trial.strikes++; Sound.tone(1200 - trial.strikes * 250, 0.6, "triangle", 0.07, -300);
    if (trial.strikes < pz.strikes) { UI.toast(`The hall heard that (${trial.strikes} of ${pz.strikes}). Crouch, or keep to the soft path.`, "bad"); return; }
    trial = null;
    UI.toast("Three sounds: the trial resets, and something comes to see who's there! Go back to the start to try again.", "bad");
    if (!reduced()) for (let k = 0; k < 2; k++) { const e = ents.add("crawler", G.player.pos.x + (k ? 3 : -3), h.y, Math.min(h.z1, Math.max(h.z0, G.player.pos.z)) + 0.5); if (e) e.alertT = 8; }
  }

  // ---------- the Empty Throne ----------
  function throneTick(dt) {
    const pz = M().puzzles.throne, s = st(), p = G.player;
    if (!pz || s.puz.throne === "solved") return;
    const on = Math.abs(p.pos.x - pz.seat.x) < 0.7 && Math.abs(p.pos.z - pz.seat.z) < 0.7 && Math.abs(p.pos.y - pz.seat.y) < 0.4;
    sitT = on ? sitT + dt : 0;
    if (sitT > 0.3 && sitT - dt <= 0.3) UI.toast("You sit on the empty throne. The stone is cold…", "");
    if (sitT < 2) return;
    s.puz.throne = "solved"; setBox(pz.door, 0); Sound.tone(60, 2, "sine", 0.08, -10);
    for (let z = pz.door.z0; z <= pz.door.z1; z++) puff(pz.door.x0 + 0.5, pz.door.y0 + 1, z + 0.5, "pale");
    UI.toast("Somewhere to your right, stone grinds aside: a hidden stair opens in the floor, leading down under the throne.", "good"); saveNow(false);
  }

  // ---------- the City Awakens ----------
  function wakeTick(dt) {
    const s = st(), m = M();
    if (!s.awakened && m.skyline && Object.keys(s.districts).length >= 10 && G.dim === "deep" && G.state === "play") {
      s.awakened = true; wakeT = 6; saveNow(false);
      Sound.tone(55, 4, "sine", 0.08 * (G.settings.fwAmbient ?? 0.8), 30);
      UI.toast("Far across the city, the moss flares bright, ruin after ruin, as if Echohold were waking up to look at you. Then it fades.", "");
    }
    if (wakeT > 0) { wakeT -= dt; G.echoWake = reduced() || G.settings.reducedMotion ? 0 : Math.sin(Math.min(1, (6 - wakeT) / 6) * Math.PI); } else G.echoWake = 0;
  }

  // ---------- the journal: map + how much you've explored ----------
  function completion(m) {
    const s = st(); if (!m) return null;
    const lore = [...new Set(Object.values(m.lore))];
    const parts = [
      ["Districts", m.districts.filter(d => s.districts[d.id]).length, m.districts.length],
      ["Caches", Object.values(m.chests).filter(c => s.caches[c.id]).length, Object.keys(m.chests).length],
      ["Tablets", lore.filter(k => s.lore[k]).length, lore.length],
      ["Puzzles", Object.keys(m.puzzles).filter(k => s.puz[k] === "solved").length, Object.keys(m.puzzles).length],
      ["Secrets", m.secrets.filter(q => s.secrets[q.id]).length, m.secrets.length],
      ["Guardians", (s.warden === "defeated" ? 1 : 0) + (m.treasury ? (s.fallen === "defeated" ? 1 : 0) : 0), m.treasury ? 2 : 1]
    ];
    const done = parts.reduce((a, q) => a + q[1], 0), total = parts.reduce((a, q) => a + q[2], 0);
    return { pct: Math.round(done / total * 100), parts };
  }
  function mapHTML(meta, s) {
    const A = meta.area || { x0: -128, z0: -128, sx: 256, sz: 256 }, W = 320, H = Math.round(W * A.sz / A.sx), k = W / A.sx;
    const px = x => ((x - A.x0) * k).toFixed(1), pz = z => ((z - A.z0) * k).toFixed(1);
    const floors = (meta.skyFloor || [[0, 0, 100]]).map(([x, z, r]) => `<circle cx="${px(x)}" cy="${pz(z)}" r="${(r * k).toFixed(1)}" fill="#16262c" stroke="#2a4a52"/>`).join("");
    const found = meta.districts.filter(d => s.districts[d.id]);
    const dots = found.map(d => `<circle cx="${px(d.x)}" cy="${pz(d.z)}" r="3" fill="#7fe8ff"/><text x="${px(d.x)}" y="${(+pz(d.z) - 5).toFixed(1)}" font-size="7" fill="#d8e6ee" text-anchor="middle">${d.name.replace(/^the /, "")}</text>`).join("");
    const stars = meta.secrets.filter(q => s.secrets[q.id]).map(q => `<text x="${px(q.x)}" y="${(+pz(q.z) + 3).toFixed(1)}" font-size="9" fill="#ffd36a" text-anchor="middle">★</text>`).join("");
    const p = G.dim === "deep" ? `<circle cx="${px(G.player.pos.x)}" cy="${pz(G.player.pos.z)}" r="3.5" fill="#ff8a3a" stroke="#fff" stroke-width="1"/>` : "";
    return `<svg viewBox="0 0 ${W} ${H}" width="100%" style="max-width:${W}px;background:#0a1418;border-radius:8px" role="img" aria-label="Map of Echohold: ${found.length} of ${meta.districts.length} districts found">${floors}${dots}${stars}${p}</svg>
      <p class="note" style="color:#555">Blue: districts you've found (${found.length} of ${meta.districts.length}). ★ secrets you've found.${G.dim === "deep" ? " Orange: you." : ""}</p>`;
  }

  return {
    calm: () => now() < calmUntil(),
    useBlock(hit) {
      const m = M(); if (!m || !m.bell) return false;
      const b = m.bell.switch; if (hit.x !== b.x || hit.y !== b.y || hit.z !== b.z) return false;
      ringBell(); return true;
    },
    heard: (x, y, z, fromPlayer) => { if (fromPlayer) trialHeard(x, z); },
    tick(dt) { if (G.dim !== "deep" || !M()) return; trialTick(dt); throneTick(dt); wakeTick(dt); },
    completion,
    journal(meta, s) {
      if (!meta || !meta.skyline) return "";
      const c = completion(meta);
      return `<h4>Echohold explored: ${c.pct}%</h4><ul>${c.parts.map(([n, a, b]) => `<li class="${a === b ? "ok" : ""}">${n}: ${a} / ${b}</li>`).join("")}</ul><h4>City map</h4>${mapHTML(meta, s)}`;
    }
  };
}
