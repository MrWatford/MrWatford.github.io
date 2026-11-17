// THE ENDWATCH CITADEL, Stage 6: atmosphere. Wind up on the walls and towers, fires that crackle when you're close,
// now-and-then noises from somewhere deeper in the dungeons, and a low hum with drifting sparks around the Hollow portal
// (violet once it's lit). Cheap: a small block scan every two seconds, a few sounds and particles; reduced motion skips
// the particles. Nothing here is saved.
import { B } from "./blocks.js";
import { CITADEL } from "./citadel.js";

export function initCitadelAmbience({ G, Sound, puff }) {
  const A = {};
  let scanT = 0, crackleT = 0, deepT = 10, humT = 0, sparkT = 0, fires = 0, nearFire = 99, windy = false;
  const castle = () => {
    const s = (G.story.citadel && G.story.citadel.spots) || {}, p = G.player.pos; let best = null;
    if (!G.gen || !G.gen.strongholds) return null;
    G.gen.strongholds.forEach((sh, i) => { const d = s[i]; if (!d || !d.on) return; const dist = Math.hypot(p.x - sh.x, p.z - sh.z); if (dist < 140 && (!best || dist < best.dist)) best = { sh, dist }; });
    return best;
  };
  A.update = dt => {
    windy = false;
    if (G.dim !== "overworld" || !G.world) return;
    const c = castle(); if (!c) return;
    const p = G.player.pos, w = G.world, calm = G.settings.reducedMotion;
    windy = p.y >= CITADEL.wallTop && c.dist < 72;   // up on the walls, towers, and keep roof (main.js plays the wind)
    // fires within a few blocks: a soft crackle
    if ((scanT -= dt) <= 0) {
      scanT = 2; fires = 0; nearFire = 99;
      const x0 = Math.floor(p.x), y0 = Math.floor(p.y), z0 = Math.floor(p.z);
      for (let y = y0 - 2; y <= y0 + 4; y++) for (let z = z0 - 5; z <= z0 + 5; z++) for (let x = x0 - 5; x <= x0 + 5; x++) if (w.id(x, y, z) === B.FIRE) { fires++; nearFire = Math.min(nearFire, Math.hypot(x - p.x, y - p.y, z - p.z)); }
    }
    if (fires && (crackleT -= dt) <= 0) {
      crackleT = 0.18 + Math.random() * 0.5;
      const k = Math.max(0, 1 - nearFire / 7) * Math.min(1, 0.5 + fires * 0.15);
      if (k > 0.03) { if (Sound.noise) Sound.noise(1600 + Math.random() * 1800, 0.025, 0.05 * k, 5); else Sound.tone(2000 + Math.random() * 1500, 0.02, "square", 0.012 * k); }
    }
    // the dungeons: something moves, far off
    if (p.y < CITADEL.ground - 4 && c.dist < 80 && (deepT -= dt) <= 0) {
      deepT = 14 + Math.random() * 16;
      Sound.mob(["groan", "rattle", "chitter"][Math.floor(Math.random() * 3)], 16 + Math.random() * 10);
    }
    // the portal chamber: a low hum and drifting sparks around the frame
    const dp = Math.hypot(p.x - (c.sh.x + 0.5), p.z - (c.sh.z + 0.5));
    if (dp < 14 && p.y > CITADEL.portalY - 4 && p.y < CITADEL.ground) {
      const lit = w.id(c.sh.x, CITADEL.portalY, c.sh.z) === B.END_PORTAL;
      if ((humT -= dt) <= 0) { humT = 2.6; Sound.tone(lit ? 62 : 48, 2.8, "sine", (lit ? 0.07 : 0.04) * Math.max(0.2, 1 - dp / 14)); }
      if (!calm && puff && (sparkT -= dt) <= 0) {
        sparkT = lit ? 0.12 : 0.35;
        const a = Math.random() * Math.PI * 2, r = 1.5 + Math.random() * 2.5;
        puff(c.sh.x + 0.5 + Math.cos(a) * r, CITADEL.portalY + 0.5 + Math.random() * 2, c.sh.z + 0.5 + Math.sin(a) * r, lit ? "portal" : "pale");
      }
    }
  };
  A.windy = () => windy;
  return A;
}
