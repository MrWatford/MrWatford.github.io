import {
  GODZILLA_ANCHORS, GODZILLA_CALDERA, GODZILLA_SITE, GODZILLA_START, GODZILLA_TERMINAL,
  atCalderaSite, inCalderaArena
} from "./godzilla-caldera.js";
import {
  ANCHORS_READY, GODZILLA_HP, GODZILLA_ID, GODZILLA_NAME, GODZILLA_PHASES, activateGodzillaAnchor,
  godzillaDamage, godzillaPhase, inAtomicBreath, newGodzillaCycle, newGodzillaRecord, stepGodzillaCycle
} from "./godzilla-encounter.js";
import { createGodzillaView } from "./godzilla-view.js";

const phaseHint = [
  "Back away from the stomp. Strike when Godzilla is recovering.",
  "Move out of the marked fault rings.",
  "Activate all three arena anchors. Leave the blue lane before atomic breath fires.",
  "Move between the marked eruptions, then strike during recovery.",
  "Dodge atomic breath and strike while Godzilla recovers."
];

export function initGodzillaFight({ G, ents, scene, Sound, UI, saveNow, hurt }) {
  let cycle = newGodzillaCycle(), view = null, actor = null;
  const record = () => G.story?.caldera;
  const inArena = p => !!p && inCalderaArena(p.x, p.z) && Math.abs(p.y - GODZILLA_SITE.y) <= 11;
  const stage = n => {
    if (G.story.lostWorld) G.story.lostWorld = { ...G.story.lostWorld, stage: n };
  };
  function clear() {
    view?.dispose();
    view = null;
    actor = null;
    cycle = newGodzillaCycle();
  }
  function interact(hit) {
    const saved = record();
    if (atCalderaSite(hit, GODZILLA_TERMINAL)) {
      if (saved?.hp === 0) {
        UI.openNote("Godzilla defeated", "The caldera is secure. Open the expedition journal to return to jungle camp.", false);
      } else if (saved) {
        UI.openNote("Godzilla", phaseHint[godzillaPhase(saved.hp) - 1], false);
      } else if (!G.story.lostWorld || G.story.lostWorld.stage === GODZILLA_START) {
        G.story.caldera = newGodzillaRecord();
        stage(GODZILLA_START + 1);
        Sound.mob("roar", 9);
        UI.toast("Godzilla awakens. Enter the caldera to face him.", "bad");
        saveNow(false);
      }
      return true;
    }
    const index = GODZILLA_ANCHORS.findIndex(site => atCalderaSite(hit, site));
    if (index < 0) return false;
    if (!saved?.hp || godzillaPhase(saved.hp) !== 3) {
      UI.toast(saved?.anchors === ANCHORS_READY ? "The caldera anchors are grounded." : "This anchor responds during Broken Circuit.");
      return true;
    }
    const next = activateGodzillaAnchor(saved, index);
    if (next !== saved) {
      G.story.caldera = next;
      Sound.mob("crystal", 1);
      const count = [1, 2, 4].filter(bit => next.anchors & bit).length;
      UI.toast(count === 3 ? "All anchors grounded. Strike during Godzilla’s recovery!" : "Caldera anchors grounded " + count + "/3.", "good");
      saveNow(false);
    } else UI.toast("This anchor is already grounded.");
    return true;
  }
  function rings(event, e) {
    const phase = event.phase;
    const cancelled = () => e.gone || e.dead || !inArena(G.player.pos) || cycle.phase !== phase;
    const add = (x, z, radius, warn, damage, color) => {
      if (!inCalderaArena(x, z)) return;
      ents.addHazard(x, GODZILLA_SITE.y, z, radius, warn, damage, "Godzilla’s eruption caught you in the caldera.", 0.45,
        { color, particle: "ember", statusEffect: null, steadyWarning: true, cancelled });
    };
    if (event.attack === "shockwave") {
      add(GODZILLA_SITE.x, GODZILLA_SITE.z, 8.2, 2.1, 7, 0xffa049);
    } else if (event.attack === "faults") {
      for (const offset of [-4, 0, 4]) {
        add(cycle.x + cycle.dz * offset, cycle.z - cycle.dx * offset, 2.6,
          cycle.timer + Math.abs(offset) * 0.1, 8, 0xff7049);
      }
    } else if (event.attack === "ashfall") {
      for (const offset of [-5, 0, 5]) {
        add(cycle.x + offset, cycle.z, 3.1, cycle.timer + (offset + 5) * 0.06, 9, 0xe5b4ff);
      }
      add(cycle.x, cycle.z + 5, 2.65, cycle.timer + 0.4, 7, 0xffa15d);
    }
  }
  function tick(dt) {
    const saved = record(), player = G.player;
    if (G.dim !== GODZILLA_CALDERA || !saved?.hp || !player || G.guest) {
      if (actor) clear();
      return;
    }
    if (!G.world.isLoaded(GODZILLA_SITE.x, GODZILLA_SITE.z)) {
      if (actor) clear();
      return;
    }
    if (!actor || actor.gone || !ents.list.includes(actor)) {
      clear();
      actor = ents.add(GODZILLA_ID, GODZILLA_SITE.x, GODZILLA_SITE.y, GODZILLA_SITE.z, { hp: saved.hp, yaw: 0 });
    }
    if (!actor || actor.dead) return;
    const event = stepGodzillaCycle(cycle, saved, player.pos, dt);
    if (event?.type === "phase") UI.toast(`Godzilla · Phase ${event.phase} — ${GODZILLA_PHASES[event.phase - 1]}. ${phaseHint[event.phase - 1]}`);
    if (event?.type === "warning") {
      actor.yaw = Math.atan2(-cycle.dx, -cycle.dz);
      Sound.mob("roar", Math.hypot(player.pos.x - actor.pos.x, player.pos.z - actor.pos.z));
      if (event.attack === "breath") UI.toast("Atomic breath charging. Get out of the blue lane!", "bad");
      else rings(event, actor);
      if (event.phase === 5) rings({ ...event, attack: "ashfall" }, actor);
    }
    if (event?.type === "strike" && event.attack === "breath") {
      Sound.mob("fireshoot", Math.hypot(player.pos.x - actor.pos.x, player.pos.z - actor.pos.z));
    }
    const breath = cycle.attack === "breath";
    actor.atomicCharge = breath && cycle.mode === "warning";
    actor.atomicFiring = breath && cycle.mode === "strike";
    if (actor.atomicCharge || actor.atomicFiring || view) {
      (view ||= createGodzillaView(scene)).update(cycle, actor, G.settings.reducedMotion, G.settings.fx);
    }
    if (actor.atomicFiring && !cycle.hit && inAtomicBreath(cycle, player.pos)) {
      cycle.hit = true;
      const multiplier = { peaceful: 0, easy: 0.67, normal: 1, hard: 1.5 }[G.wset.difficulty] ?? 1;
      hurt(13 * multiplier, "Godzilla caught you with atomic breath!", null, false, "fire");
    }
  }
  function onFaint() {
    if (G.dim !== GODZILLA_CALDERA) return;
    if (actor) actor.atomicCharge = actor.atomicFiring = false;
    cycle = newGodzillaCycle();
    view?.dispose();
    view = null;
    ents.clearHazards();
  }
  function incomingDamage(e, amount) {
    if (e !== actor || G.dim !== GODZILLA_CALDERA || G.guest || !inArena(G.player.pos)) return 0;
    return godzillaDamage(record(), cycle, amount);
  }
  function damaged(e) {
    const prior = record();
    if (e !== actor || !prior?.hp) return;
    const hp = Math.max(0, e.hp);
    G.story.caldera = { ...prior, hp };
    if (hp <= 0) {
      stage(GODZILLA_START + 2);
      onFaint();
      UI.toast("Godzilla defeated. The caldera is secure. Return to camp from the expedition journal.", "good");
    }
    if (hp === 0 || godzillaPhase(prior.hp) !== godzillaPhase(hp)) {
      if (hp > 0) onFaint();
      saveNow(false);
    }
  }
  function bossInfo() {
    const saved = record();
    if (G.dim !== GODZILLA_CALDERA || !saved?.hp || !inArena(G.player.pos)) return null;
    const phase = godzillaPhase(saved.hp);
    const detail = phase === 3 && saved.anchors !== ANCHORS_READY ? " • Ground the three anchors" :
      actor?.atomicCharge ? " • Atomic breath charging" : cycle.mode === "recovery" ? " • Recovering" : "";
    return { label: `${GODZILLA_NAME} • Phase ${phase} — ${GODZILLA_PHASES[phase - 1]}${detail}`, frac: saved.hp / GODZILLA_HP };
  }
  return { clear, onFaint, interact, tick, incomingDamage, damaged, bossInfo };
}
