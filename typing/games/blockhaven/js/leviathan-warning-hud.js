import { DUNE_VORTEX_RADIUS } from "./dune-vortex.js";

// Presentation only. Read the existing cues, including the Dune eruption when
// its world-space ring has no mesh yet.
const labels = {
  eruption: ["dune", "Sand eruption", "Clear the rising dust."],
  sweep: ["dune", "Tail sweep", "Get clear of the glowing body segments."],
  vortex: ["dune", "Sand vortex", "Leave the amber ring or take cover."],
  devour: ["dune", "Devouring strike", "Sidestep the glowing jaws."],
  magma: ["obsidian", "Magma eruption", "Leave the marked ground."],
  shrapnel: ["obsidian", "Obsidian shrapnel", "Move sideways or take cover."],
  roar: ["obsidian", "Inferno Roar", "Get beyond the ember ring."],
  awakening: ["ancient", "The Buried King awakens", "Leave the center of the court."],
  guardian: ["ancient", "Guardian summons", "Keep clear of the small blue circles."],
  shockwave: ["ancient", "Ancient shockwave", "Leave the blue ring."],
  fracture: ["ancient", "Fracturing ground", "Leave the blue target ring."],
  judgment: ["ancient", "Final Judgment", "Leave the target ring and violet cracks."],
  fury: ["ancient", "Ancient Fury", "Leave the marked circles."],
};
const clamp = value => Math.max(0, Math.min(1, value));

export function selectLeviathanWarning(pos, effects) {
  const { dune, sweep, devour, vortex, obsidian, ancient, arrival, fury } = effects;
  let best = null, priority = Infinity;
  function consider(type, fx, point, distanceLimit, active = false) {
    const label = labels[type];
    if (!label || !fx?.actor || (!fx.view && type !== "eruption") || fx.actor.gone || fx.actor.dead || fx.actor.tame ||
        !point || ![point.x, point.y, point.z].every(Number.isFinite)) return;
    const distance = Math.hypot(point.x - pos.x, point.z - pos.z);
    if (distance > distanceLimit || Math.abs(point.y - pos.y) > 9) return;
    if (!active && ![point.deadline, point.progress].every(Number.isFinite)) return;
    const score = Math.max(0, distance - (point.radius || 0));
    if (score >= priority) return;
    priority = score;
    const [family, title, advice] = label;
    const instruction = type === "fury" ? `Strike ${fx.actor.duneCycle.furyIndex + 1} of 3. ${advice}` : advice;
    best = {
      actor: fx.actor, type, family, title, instruction, active, deadline: point.deadline,
      progress: active ? 1 : clamp(point.progress), volume: clamp(1 - score / distanceLimit)
    };
  }
  function contact(type, fx, range) {
    if (!fx?.record.active) return;
    const { actor, record } = fx, deadline = actor.duneCycle.attackAt;
    const from = actor.duneCycle.attack?.from;
    consider(type, fx, { ...actor.pos, deadline, progress: (actor.age - from) / (deadline - from) }, range, record.released);
  }
  if (dune?.cue.type === "eruption" || dune?.cue.type === "vortex") consider(dune.cue.type, dune, dune.cue, 27);
  contact("sweep", sweep, 43);
  contact("devour", devour, 20);
  if (vortex?.inside) consider("vortex", vortex, { ...vortex.record.site, radius: DUNE_VORTEX_RADIUS }, 24, true);
  if (obsidian) {
    const type = obsidian.cue.type === "eruption" ? "magma" : obsidian.cue.type;
    consider(type, obsidian, obsidian.cue, type === "shrapnel" ? 32 : 28);
  }
  if (ancient) {
    const phase = ancient.attack.phase;
    const type = phase === 5 ? "judgment" : phase === 3 ? "fracture" : "shockwave";
    const closest = ancient.collapses.reduce((point, fx) => fx.view &&
      Math.hypot(pos.x - fx.cue.x, pos.z - fx.cue.z) < Math.hypot(pos.x - point.x, pos.z - point.z) ? fx.cue : point, ancient.cue);
    consider(type, ancient, closest, 35);
  }
  // Later rings are still drawn in-world. The rail follows the next strike.
  const strike = fury[0];
  if (strike) consider("fury", strike, strike.cue, 35);
  for (const fx of arrival) consider(fx.cue.type, fx, fx.cue, 34);
  return best;
}

export function createLeviathanWarningHUD(element, playSound) {
  const title = element.querySelector("b"), instruction = element.querySelector("small");
  const fill = element.querySelector("i");
  let heard = new WeakMap(), lastType = null, lastInstruction = "", lastCharge = -1, wasActive = false;
  return {
    update(cue, allowSound) {
      if (!cue) {
        if (!element.hidden) element.hidden = true;
        return;
      }
      if (lastType !== cue.type || wasActive !== cue.active || lastInstruction !== cue.instruction) {
        lastType = cue.type;
        lastInstruction = cue.instruction;
        wasActive = cue.active;
        element.dataset.family = cue.family;
        element.dataset.stage = cue.active ? "impact" : "charge";
        title.textContent = cue.title;
        instruction.textContent = cue.instruction;
      }
      if (element.hidden) element.hidden = false;
      const charge = Math.round(cue.progress * 100);
      if (charge !== lastCharge) {
        lastCharge = charge;
        fill.style.transform = `scaleX(${charge / 100})`;
      }
      if (!allowSound || cue.active) return;
      let events = heard.get(cue.actor);
      if (!events) { events = new Map(); heard.set(cue.actor, events); }
      if (events.get(cue.type) === cue.deadline) return;
      events.set(cue.type, cue.deadline);
      playSound(cue.family, cue.volume);
    },
    clear() {
      heard = new WeakMap();
      element.hidden = true;
    }
  };
}
