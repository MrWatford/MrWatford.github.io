import { GODZILLA_CALDERA, GODZILLA_START } from "./godzilla-caldera.js";
import { VOLCANIC_BADLANDS, BADLANDS_START, CALDERA_ANCHORS, calderaAnchorAt } from "./volcanic-badlands.js";
import { TYRANT_CANYON, TRACKS, EXPEDITION_BEACON } from "./tyrant-canyon.js";
import { AMBER_CAVERNS, SAMPLE, WINCH, SHORTCUT_REQUIRED_STAGE } from "./amber-caverns.js";
import { REDWOODS, OVERLOOK, RIDGE_STATION } from "./redwood-escarpment.js";
import { FERN_PLAINS, surveyPost } from "./fern-plains.js";
import { MANGROVE, PUMP, RELAY, atWetlandSite } from "./mangrove-wetlands.js";

// The expedition carries its progress as a journal entry, including after a death.
export const CAMP_TABLET = Object.freeze({ x: 2, y: 36, z: 3 });
export const FIELD_TABLET = Object.freeze({ x: -2, y: 36, z: 42 });

const canopy = [
  ["Expedition briefing", "Survey team, the outpost beyond Raptor Grove has gone quiet. Follow the gravel trail through the stone arch, recover its field log, and bring your findings back here. The grove's hunter calls before it strikes. Keep the trail behind you so you have room to retreat."],
  ["Report to camp", "The field log is in your journal. Follow the gravel trail back through the arch and read this briefing tablet to report your findings."],
  ["Chapter 1 complete", "The recovered log is on record. Open the expedition journal to travel to the Fern Plains for Chapter 2."]
];
const plains = [
  ["Survey the first herd crossing", "In the Fern Plains, follow the gravel track north and look for the torch-marked survey post west of the trail. Record the prints and which way the herd is moving."],
  ["Survey the upper meadow", "Follow the track uphill to the next torch-marked survey post. Compare the tracks at the second crossing to finish the migration map."],
  ["Chapter 2 complete", "Both crossings are mapped. The herd left the riverbank when the tremors began and moved to higher ground. The next lead is the silent river relay in the Mangrove Wetlands."]
];
const wetlands = [
  ["Recover a spare relay fuse", "Follow the Mangrove boardwalk to the pump station on the left. Check the service log for a working fuse. Giant mosquitoes gather around the docks."],
  ["Restore the river relay", "Carry the fuse across the boardwalk to the relay tower. The raised boardwalk keeps you above the Spinosaurus. Exposed water is its hunting ground."],
  ["Chapter 3 complete", "The relay is transmitting again. The recovered signal points to an abandoned station above the canopy in the Redwood Escarpment."]
];
const redwoods = [
  ["Reach the nesting overlook", "Follow the torch-marked climb. Jump up the short steps, then turn right onto the ridge bridge. Read the overlook log above the Brachiosaurus nesting meadow."],
  ["Find the abandoned station", "Cross the ridge bridge and follow the upper trail to the timber shelter. The station records may explain why the relay went silent."],
  ["Chapter 4 complete", "The station log records vibrations from deep below the ridge. The survey team marked an entrance in the Amber Caverns."]
];
const amber = [
  ["Recover an amber core sample", "Follow the warm ceiling lights straight down the gravel tunnel. Keep your distance when an Amber Prowler calls or a Snaproot opens its jaws. The sample station is in the broad chamber at the bottom."],
  ["Open the return passage", "The core sample is logged. Find the winch on the chamber’s right side and open the sealed stone-brick passage back to the entrance."],
  ["Chapter 5 complete", "The core sample carries traces from the Fern Plains canyon. The expedition beacon may still be there, inside the territory of a Tyrannosaurus."]
];
const canyon = [
  ["Read the tracker’s notes", "Follow the gravel trail to the torch on your left. The tracker recorded two ways to reach the missing beacon."],
  ["Recover the expedition beacon", "The main trail crosses Tyrannosaurus territory. For cover, turn right at the torches and follow the side trail between the rock walls. Crouch near the far opening, or cross the main trail and fight."],
  ["Chapter 6 complete", "The beacon is transmitting again. Its last readings put the source of the tremors beneath the Volcanic Badlands."]
];
const badlands = [
  ["Restore the Lower Anchor", "Follow the basalt causeway. Each vent pair erupts on alternating sides. When a ring lights up, take the other lane or wait before crossing. The Lower Anchor is on the first platform beyond the vents."],
  ["Restore the Ridge Anchor", "The lower vents have gone quiet. Cross the next pair and use the anchor on the right-hand platform."],
  ["Restore the Caldera Anchor", "Cross the last vent pair and use the anchor at the foot of the volcano."],
  ["Chapter 7 complete", "All three anchors are powered. The vents fall silent. Open the journal to enter the caldera and face Godzilla."]
];
const caldera = [
  ["Awaken Godzilla", "Take supplies from the chest by the entrance, then use the terminal on the left. Godzilla is vulnerable after each attack. Leave the blue lane before atomic breath fires."],
  ["Defeat Godzilla", "Dodge each attack and strike during recovery. During Broken Circuit, activate all three arena anchors."],
  ["Godzilla defeated", "The caldera is secure. Your expedition is complete. Use this journal to return to jungle camp or keep exploring."]
];
const chapters = [
  { title: "Chapter 1 · Through the Canopy", start: 0, objectives: canopy },
  { title: "Chapter 2 · Thunderplain", start: 2, dimension: FERN_PLAINS, objectives: plains },
  { title: "Chapter 3 · Blackwater Signal", start: 4, dimension: MANGROVE, objectives: wetlands },
  { title: "Chapter 4 · The Canopy Road", start: 6, dimension: REDWOODS, objectives: redwoods },
  { title: "Chapter 5 · Beneath the Amber", start: 8, dimension: AMBER_CAVERNS, objectives: amber },
  { title: "Chapter 6 · Territory of the King", start: 10, dimension: TYRANT_CANYON, objectives: canyon },
  { title: "Chapter 7 · The Mountain Wakes", start: BADLANDS_START, dimension: VOLCANIC_BADLANDS, objectives: badlands },
  { title: "Chapter 8 · Heart of the Caldera", start: GODZILLA_START, dimension: GODZILLA_CALDERA, objectives: caldera }
];
const fieldLog = "The herds moved east before dawn. A low tremor rolled under the jungle just before they scattered. The river relay went quiet a few minutes later. Route marked for the next team: follow the herds to the Fern Plains.";

export const expedition = () => ({ version: 1, stage: 0 });

export function validExpedition(record) {
  return record?.version === 1 && Number.isInteger(record.stage) && record.stage >= 0 && record.stage <= chapters.at(-1).start + chapters.at(-1).objectives.length - 1;
}

export function expeditionJournal(record, destinations, dimension) {
  const stage = record?.stage ?? 0;
  const chapter = chapters.findLast(ch => stage > ch.start || stage === ch.start && dimension === ch.dimension) || chapters[0];
  const heading = record ? chapter.title : "The Lost World";
  const [objective, instructions] = record ? chapter.objectives[stage - chapter.start] :
    ["Explore the Lost World", "Choose a region to explore. You can return from this journal." ];
  return `<section><h4>${heading}</h4><p><strong>${objective}</strong></p><p>${instructions}</p>
    ${destinations.map(({ dim, label }) => `<button type="button" class="btn small primary" data-expedition-travel="${dim}">${label}</button>`).join(" ")}
    ${record?.stage > 0 ? `<h4>Recovered field log</h4><p>${fieldLog}</p>` : ""}</section>`;
}

const at = (hit, tablet) => hit.x === tablet.x && hit.y === tablet.y && hit.z === tablet.z;

export const isExpeditionTablet = hit => at(hit, CAMP_TABLET) || at(hit, FIELD_TABLET);

export function readExpeditionTablet(record, hit) {
  if (at(hit, FIELD_TABLET)) {
    if (record.stage === 0) record.stage = 1;
    return ["Expedition field log", fieldLog + "\n\n" + (record.stage === 1 ? canopy[1][1] : "A copy is in your journal.")];
  }
  if (!at(hit, CAMP_TABLET)) return null;
  if (record.stage === 1) record.stage = 2;
  return canopy[Math.min(record.stage, 2)];
}

export function readSurveyPost(record, hit) {
  const post = surveyPost(hit);
  if (post < 0) return null;
  if (record.stage < 2) return ["Expedition survey post", "Report back to the jungle camp before surveying the migration route."];
  if (post === 1 && record.stage === 2) return ["Upper meadow survey post", "Start at the west post to establish the herd's direction."];
  if (post === 0) {
    if (record.stage === 2) record.stage = 3;
    return ["West crossing recorded", "The tracks lead away from the river. Follow the trail to the two torches at the upper meadow."];
  }
  if (record.stage === 3) record.stage = 4;
  return plains[2];
}

export const isWetlandTablet = hit => atWetlandSite(hit, PUMP) || atWetlandSite(hit, RELAY);

export function readWetlandTablet(record, hit) {
  if (record.stage < 4 || !isWetlandTablet(hit)) return null;
  if (atWetlandSite(hit, PUMP)) {
    if (record.stage === 4) record.stage = 5;
    return ["Relay fuse recovered", "The working fuse is logged in your journal. Follow the boardwalk to the relay tower."];
  }
  if (record.stage === 4) return ["River relay offline", "The fuse socket is empty. Find a spare at the pump station by the first dock."];
  if (record.stage === 5) record.stage = 6;
  return wetlands[2];
}

export function isCampaignLandmark(dimension, hit) {
  if (dimension === "lost_world") return isExpeditionTablet(hit);
  if (dimension === FERN_PLAINS) return surveyPost(hit) >= 0;
  if (dimension === MANGROVE) return isWetlandTablet(hit);
  if (dimension === REDWOODS) return at(hit, OVERLOOK) || at(hit, RIDGE_STATION);
  if (dimension === VOLCANIC_BADLANDS) return calderaAnchorAt(hit) >= 0;
  if (dimension === TYRANT_CANYON) return at(hit, TRACKS) || at(hit, EXPEDITION_BEACON);
  return dimension === AMBER_CAVERNS && (at(hit, SAMPLE) || at(hit, WINCH));
}

export function readCampaignLandmark(dimension, record, hit) {
  if (dimension === "lost_world") return readExpeditionTablet(record, hit);
  if (dimension === FERN_PLAINS) return readSurveyPost(record, hit);
  if (dimension === MANGROVE) return readWetlandTablet(record, hit);
  if (dimension === VOLCANIC_BADLANDS && record.stage >= BADLANDS_START) {
    const index = calderaAnchorAt(hit);
    if (index < 0) return null;
    const expected = record.stage - BADLANDS_START;
    const anchor = CALDERA_ANCHORS[index];
    if (index > expected) return [anchor.name, "Restore the " + CALDERA_ANCHORS[expected].name + " first."];
    if (index < expected) return [anchor.name + " online", "The vents below this anchor are quiet."];
    record.stage += 1;
    return index === CALDERA_ANCHORS.length - 1 ? badlands.at(-1) : [anchor.name + " restored", badlands[index + 1][1]];
  }
  if (dimension === TYRANT_CANYON && record.stage >= 10 && isCampaignLandmark(dimension, hit)) {
    if (at(hit, TRACKS)) {
      if (record.stage === 10) record.stage = 11;
      return ["Tracker’s notes", canyon[1][1]];
    }
    if (record.stage === 10) return ["Missing expedition beacon", "Read the tracker’s notes near the trail entrance before retrieving the beacon."];
    if (record.stage === 11) record.stage = 12;
    return canyon[2];
  }
  if (dimension === AMBER_CAVERNS && record.stage >= 8 && isCampaignLandmark(dimension, hit)) {
    if (at(hit, SAMPLE)) {
      if (record.stage === 8) record.stage = 9;
      return ["Amber core sample recovered", amber[1][1]];
    }
    if (record.stage === 8) return ["Passage winch", "Secure a core sample at the far end of the chamber before using the return passage."];
    if (record.stage === 9) record.stage = SHORTCUT_REQUIRED_STAGE;
    return amber[2];
  }
  if (dimension !== REDWOODS || record.stage < 6 || !isCampaignLandmark(dimension, hit)) return null;
  if (at(hit, OVERLOOK)) {
    if (record.stage === 6) record.stage = 7;
    return ["Nesting overlook recorded", redwoods[1][1]];
  }
  if (record.stage === 6) return ["Abandoned station", "Survey the nesting meadow from the lower overlook before recording the station log."];
  if (record.stage === 7) record.stage = 8;
  return redwoods[2];
}
