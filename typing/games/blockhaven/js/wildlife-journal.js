const entries = {
  grizzly_bear: {
    name: "Grizzly Bear", habitat: "Forests and birch woods", kind: "Territorial", color: "umber",
    note: "Give adults room. A bear that rears and roars is warning you to back away.",
    behavior: "Observed a warning or an attack. A charge commits to its direction, and a ground slam has a longer windup.",
    den: "Found an occupied den. Bears return to sheltered ground after dark.",
    young: "Spotted a cub. Cubs retreat to shelter, and adults defend them.",
    phases: ["roar", "chargeWindup", "charge", "swipe", "slam"]
  },
  great_white_shark: {
    name: "Great White Shark", habitat: "Deep open water", kind: "Predator", color: "slate",
    note: "Sharks hunt fish and sometimes stalk swimmers. Shallow water gives them less room to maneuver.",
    behavior: "Observed a hunt. The shark circles its target before accelerating into a lunge.",
    phases: ["circle", "lunge"]
  },
  bald_eagle: {
    name: "Bald Eagle", habitat: "Forests and mountains", kind: "Neutral", color: "ochre",
    note: "Look above the canopy and along mountain slopes to find soaring eagles.",
    behavior: "Observed a fishing dive. An eagle dives on fish near the surface and climbs back to its patrol height.",
    phases: ["dive"]
  },
  blue_whale: {
    name: "Blue Whale", habitat: "Deep open water", kind: "Peaceful", color: "slate",
    note: "Blue whales migrate through deep water alone or in pairs. Listen for their low calls.",
    behavior: "Observed surface breathing. Watch for a spout when a whale rises from its dive.",
    phases: ["surface"]
  },
  orca: {
    name: "Orca", habitat: "Deep open water", kind: "Predator", color: "stone",
    note: "Orcas hunt fish. Pod members stay near one another and approach prey from different sides.",
    behavior: "Observed a pod hunt. Orcas circle a shared target and make staggered rushes.",
    phases: ["herd", "rush"]
  },
  crocodile: {
    name: "Crocodile", habitat: "Riverbanks and shallow shorelines", kind: "Ambush predator", color: "ochre",
    note: "Look for eyes above the water near a bank. Crocodiles wait close to shore and lunge at fish and nearby players.",
    behavior: "Observed a river ambush. A crocodile lunges in a straight line, rolls after a hit in water, and pauses between attacks.",
    phases: ["lunge", "roll"]
  },
  hippopotamus: {
    name: "Hippopotamus", habitat: "Rivers and watering holes", kind: "Territorial", color: "stone",
    note: "Hippos spend their time in shallow water. They yawn and call before charging an intruder.",
    behavior: "Observed a territorial warning or charge. Move to the side as soon as the hippo opens its jaws.",
    phases: ["warning", "charge"]
  },
  octopus: {
    name: "Octopus", habitat: "Rocky seabeds and clay beds", kind: "Defensive", color: "umber",
    note: "Watch the seabed closely. Octopuses change color to match sand, stone, gravel, and clay.",
    behavior: "Observed camouflage or a jet of defensive ink. Octopuses use ink to get away from threats.",
    phases: ["camouflage", "escape"]
  },
  manta_ray: {
    name: "Manta Ray", habitat: "Open water above underwater shelves", kind: "Peaceful", color: "slate",
    note: "Manta rays glide over the seabed and sometimes approach divers.",
    behavior: "Observed a manta ray leading the way to an underwater shelf. Stay close to keep following it.",
    phases: ["guide"]
  },
  seal: {
    name: "Seal", habitat: "Cold beaches and rocky coasts", kind: "Peaceful", color: "slate",
    note: "Seals rest in small colonies and slide down smooth banks to hunt fish.",
    behavior: "Observed a shore slide or a dive for fish. Seals return to land to rest between trips.",
    phases: ["slide", "dive", "haulOut"]
  },
  walrus: {
    name: "Walrus", habitat: "Cold beaches and rocky coasts", kind: "Defensive", color: "umber",
    note: "Watch from a distance. Adults defend their colony when approached near a calf or when a member is hurt.",
    behavior: "Observed a warning or a tusk rush. A walrus faces an intruder and calls before moving.",
    young: "Spotted a walrus calf in a colony.",
    phases: ["warning", "defend"]
  },
  lion: {
    name: "Lion", habitat: "Warm, open grassland", kind: "Pride predator", color: "umber",
    note: "Lions rest in daylight and hunt zebras and rabbits. Prides can approach the same prey from different sides.",
    behavior: "Observed a pride hunt. A lion closes in quietly, then breaks into a chase when prey flees.",
    phases: ["stalk", "chase", "pounce"]
  },
  zebra: {
    name: "Zebra", habitat: "Warm, open grassland", kind: "Herd animal", color: "stone",
    note: "Zebras graze and travel as a herd. An alarm from one zebra can send the group running.",
    behavior: "Observed herd flight. Zebras run together when a predator is spotted or a member is attacked.",
    phases: ["flee"]
  },
  ancient_grizzly: {
    name: "Ancient Grizzly", habitat: "Sheltered forest dens", kind: "Rare encounter", color: "stone",
    note: "The silver-coated Ancient Grizzly is larger than an ordinary adult and starts using its ground slam sooner.",
    behavior: "Observed the Ancient Grizzly in combat. Its ground slam reaches farther than an ordinary grizzly's.",
    den: "Located an Ancient Grizzly defending a den.",
    phases: ["roar", "chargeWindup", "charge", "swipe", "slam"]
  }
};
const flags = ["behavior", "den", "young", "defeated"];

function wildlifeKey(e) {
  const key = e.sp === "grizzly_bear" && e.variant === 1 ? "ancient_grizzly" : e.sp;
  return Object.hasOwn(entries, key) ? key : null;
}

function validDay(day) {
  return Number.isSafeInteger(day) && day >= 1;
}

export function restoreWildlifeJournal(value) {
  const journal = {};
  if (!value || typeof value !== "object" || Array.isArray(value)) return journal;
  for (const [key, entry] of Object.entries(entries)) {
    const saved = Object.hasOwn(value, key) ? value[key] : null;
    if (!saved || !validDay(saved.firstDay)) continue;
    const record = { firstDay: saved.firstDay };
    for (const flag of flags) {
      if ((entry[flag] || flag === "defeated") && saved[flag] === true) record[flag] = true;
    }
    journal[key] = record;
  }
  return journal;
}

function record(story, key, found, day) {
  const old = story.wildlife?.[key];
  if (old && !found.some(flag => !old[flag])) return false;
  const next = { ...(old || { firstDay: validDay(day) ? day : 1 }) };
  for (const flag of found) next[flag] = true;
  story.wildlife = { ...story.wildlife, [key]: next };
  return !old;
}

export function observeWildlife(story, actors, eye, direction, day, visible) {
  const discoveries = [];
  for (const e of actors) {
    if (!e.def.wildlife || e.dead || e.gone || e.hp <= 0) continue;
    const key = wildlifeKey(e);
    if (!key) continue;
    const entry = entries[key];
    const target = { x: e.pos.x, y: e.pos.y + e.h * 0.6, z: e.pos.z };
    const dx = target.x - eye.x, dy = target.y - eye.y, dz = target.z - eye.z;
    const distance2 = dx * dx + dy * dy + dz * dz;
    const forward = dx * direction.x + dy * direction.y + dz * direction.z;
    if (distance2 > 28 ** 2 || forward <= 0 || forward * forward < 0.91 * distance2) continue;
    const found = [];
    if (entry.phases.includes(e.wild?.phase)) found.push("behavior");
    if (entry.young && e.baby) found.push("young");
    if (entry.den && e.den && e.home &&
        Math.hypot(target.x - e.home[0], e.pos.y - e.home[1], target.z - e.home[2]) <= 4.5) found.push("den");
    const old = story.wildlife?.[key];
    if (old && !found.some(flag => !old[flag])) continue;
    if (visible(target) && record(story, key, found, day)) discoveries.push(entry.name);
  }
  return discoveries;
}

export function markWildlifeDefeated(story, entity, day) {
  if (!entity.def.wildlife || entity.baby) return null;
  const key = wildlifeKey(entity);
  if (!key) return null;
  return record(story, key, ["defeated"], day) ? entries[key].name : null;
}

export function wildlifeJournalHTML(story) {
  const records = restoreWildlifeJournal(story.wildlife);
  const cards = Object.entries(entries).map(([key, entry]) => {
    const record = records[key];
    if (!record) return `<article class="wildlife-entry undiscovered" data-wildlife-entry="${key}">
      <h4>${entry.name}</h4><p>${entry.habitat}</p><small>Awaiting a sighting</small></article>`;
    const notes = ["behavior", "den", "young"].filter(flag => record[flag])
      .map(flag => `<li>${entry[flag]}</li>`).join("");
    return `<article class="wildlife-entry ${entry.color}" data-wildlife-entry="${key}">
      <h4>${entry.name}</h4>
      <p class="wildlife-habitat">${entry.habitat} · ${entry.kind}</p>
      <p>${entry.note}</p>
      ${notes ? `<ul>${notes}</ul>` : ""}
      <small>First recorded on day ${record.firstDay}${record.defeated ? " · Defeated" : ""}</small>
    </article>`;
  }).join("");
  return `<section class="wildlife-journal" aria-label="Wildlife field notes">
    <header><div><h4>Field Notes</h4><p>Watch wildlife from a clear line of sight in Survival to record it here.</p></div>
    <strong>${Object.keys(records).length} of ${Object.keys(entries).length} recorded</strong></header>
    <div class="wildlife-entries">${cards}</div>
  </section>`;
}
