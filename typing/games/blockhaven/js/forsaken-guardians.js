import { B, I, make, metaOf, itemDef } from "./blocks.js";
import { FALLEN_SITES, LAIRS, fallenPoints } from "./forsaken-fallen.js";
import { REACHES } from "./forsaken-reaches.js";

export const guardianEncounter = id => "kingdom-lair-" + id;
export const guardianDone = (story, id) => story?.fw?.mutants?.enc?.[guardianEncounter(id)]?.done === true;
export const earnedGuardianKeys = story => Object.keys(LAIRS).filter(id => guardianDone(story, id));

export function reconcileLegacyGuardian(story, sites, id) {
  if (!Object.hasOwn(LAIRS, id) || sites?.[id] !== null) return false;
  const area = REACHES.find(q => q.kind === LAIRS[id].mutant);
  const encounters = story?.fw?.mutants?.enc;
  const previous = encounters?.["reach-" + area.key];
  if (previous?.done !== true) return false;
  encounters[guardianEncounter(id)] ??= { done: true, at: previous.at, legacy: area.key };
  return guardianDone(story, id);
}

export function claimGuardianReward(inventory, progress, id, completed) {
  if (!completed || !Object.hasOwn(LAIRS, id)) return { key: false, trophy: false, room: true };
  const def = LAIRS[id], key = I[def.key], trophy = I[def.trophy];
  const keyPresent = inventory.slots.some(s => s?.id === key && s.guardianSerial === progress.keySerial);
  let keyClaimed = false, trophyClaimed = false, room = true;
  if (!keyPresent) {
    if (inventory.roomFor(key, 1)) {
      progress.keySerial = (progress.keySerial || 0) + 1;
      inventory.add(key, 1, { id: key, n: 1, guardianSerial: progress.keySerial });
      keyClaimed = true;
    } else room = false;
  }
  if (!progress.trophy) {
    if (inventory.roomFor(trophy, 1)) {
      inventory.add(trophy, 1);
      progress.trophy = true;
      trophyClaimed = true;
    } else room = false;
  }
  return { key: keyClaimed, trophy: trophyClaimed, room };
}

export function initFallenExploration({ G, UI, Sound, puff, saveNow }) {
  const terrain = () => G.world?.gen?.kingdom?.fallen;
  const record = () => (G.story.fw ||= {}).fallen ||= {};
  const permitted = () => !G.guest && !G.spectator && !G.creative;
  let surveyT = 0;
  function updateSite(state, id, reveal = false) {
    const slot = state[id] ||= {};
    if (reveal) slot.hinted = true;
    return slot;
  }
  const sites = () => G.dimData.forsaken?.fallen?.sites;

  function collect(place, id) {
    const def = LAIRS[id];
    const { key, trophy, room } = claimGuardianReward(G.inv, place, id, true);
    if (key || trophy) {
      G.hudDirty = true;
      Sound.pickup();
      const names = [key && itemDef(I[def.key]).name, trophy && itemDef(I[def.trophy]).name].filter(Boolean);
      UI.toast("Recovered " + names.join(" and ") + ".", "good");
      saveNow(false);
    }
    if (!room) UI.toast("Make space in your inventory to collect the reward.");
    else if (!key && !trophy) UI.toast("The guardian's reward has been claimed. Its key is recorded in your journal.");
  }

  const detail = {
    tick(dt) {
      if (!terrain() || G.guest || (surveyT -= dt) > 0) return;
      surveyT = 0.5;
      const p = G.player.pos, state = record();
      for (const s of Object.values(terrain().sites)) {
        if (!s || Math.hypot(s.x - p.x, s.z - p.z) > FALLEN_SITES[s.id].r + 5) continue;
        const q = updateSite(state, s.id);
        if (q.seen) continue;
        q.seen = true;
        UI.toast("Discovered: " + FALLEN_SITES[s.id].name);
      }
    },

    interact(hit, kind) {
      if (G.guest || !terrain()) return false;
      const interaction = terrain().at(hit);
      if (!interaction || ({ journal: "note", seal: "fallenSeal", node: "fallenNode" })[interaction.kind] !== kind) return false;
      const { id, index } = interaction, def = FALLEN_SITES[id], state = record(), place = updateSite(state, id);
      if (interaction.kind === "journal") {
        const reveal = ["market", "watch"].includes(id) ? Object.keys(LAIRS) : id === "hamlet" ? ["bastion", "crypt"] : [id];
        for (const key of reveal) if (sites()?.[key]) updateSite(state, key, true);
        const directions = reveal.filter(key => key !== id && sites()?.[key]).map(key => {
          const { entry } = fallenPoints(sites()[key]);
          return `${FALLEN_SITES[key].name} · X ${entry.x}, Z ${entry.z}`;
        });
        UI.openNote(def.name, [def.lore, ...directions].join("\n\n"), !place.read);
        place.read = true;
        saveNow(false);
        return true;
      }
      if (!permitted()) {
        UI.toast("Guardian progression is available in Survival.");
        return true;
      }
      if (interaction.kind === "node") {
        const bit = 1 << index;
        place.nodes ||= 0;
        if (place.nodes & bit) {
          UI.toast("This seal is already quiet.");
          return true;
        }
        place.nodes |= bit;
        const w = G.world, meta = metaOf(w.get(hit.x, hit.y, hit.z));
        w.set(hit.x, hit.y, hit.z, make(B.LAIR_NODE, meta | 16));
        Sound.tone(310 + 90 * index, 0.26, "triangle", 0.06, -70);
        if (!G.settings.reducedMotion) puff(hit.x + 0.5, hit.y + 0.9, hit.z + 0.5, "portal");
        const left = def.nodes - [1, 2, 4].filter(n => place.nodes & n).length;
        UI.toast(left ? `${left} seals remain.` : "The guardian seal answers. Use it when ready.");
        saveNow(false);
        return true;
      }
      const complete = guardianDone(G.story, id);
      if (complete) {
        collect(place, id);
        return true;
      }
      if (def.nodes && place.nodes !== (1 << def.nodes) - 1) {
        UI.toast("Quiet the three seals around the chamber first.");
        return true;
      }
      const result = G.mutants.beginGuardian(id, def.mutant, terrain().sites[id], fallenPoints(terrain().sites[id]));
      UI.toast({
        started: "The guardian answers the seal.",
        blocked: "The guardian's chamber needs clear ground.",
        disabled: "Enable Forsaken Mutants and use a difficulty above Peaceful.",
        active: "A Forsaken mutant is already active nearby. Clear the area and try again.",
        unsafe: "Step back from the centre of the guardian chamber.",
      }[result]);
      return true;
    },

    claimAlternative(id) {
      if (!terrain() || !permitted() || !reconcileLegacyGuardian(G.story, terrain().sites, id)) return;
      collect(updateSite(record(), id), id);
    },

    alternatives() {
      if (!terrain()) return [];
      return Object.keys(LAIRS).flatMap(id => {
        if (terrain().sites[id] !== null) return [];
        const area = REACHES.find(q => q.kind === LAIRS[id].mutant);
        const proof = G.story.fw?.mutants?.enc?.["reach-" + area.key]?.done === true;
        return [{ id, name: LAIRS[id].name, x: area.x, z: area.z, where: area.name, claim: proof && permitted() }];
      });
    },

    markers() {
      const state = G.story.fw?.fallen;
      if (!state) return [];
      return Object.entries(sites() || {}).flatMap(([id, s]) => {
        if (!s || !Object.hasOwn(FALLEN_SITES, id) || !(state[id]?.seen || state[id]?.hinted)) return [];
        const { entry } = fallenPoints(s);
        return [{ id, ...entry, name: FALLEN_SITES[id].name, seen: !!state[id].seen, cleared: guardianDone(G.story, id) }];
      });
    },
  };
  return detail;
}
