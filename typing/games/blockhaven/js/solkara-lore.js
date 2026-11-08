import { SANDS_REGIONS } from "./hollow-sands.js";

export const SOLKARA_LIBRARY_RECORDS = [
  { id: "founding", title: "The Founding of Solkara", text: "The first families built where three caravan roads met. They raised no palace until the wells were lined and every traveler could draw water. The city seal was a cup beneath an open hand." },
  { id: "first_leviathan", title: "The First Leviathan", text: "The surveyor expected a fault in the rock. Instead, a plated back rose across the horizon. He set down his hammer. When the creature passed, the dune held the print of his knees." },
  { id: "sandcallers", title: "The Sandcallers", text: "Apprentices learned to hear before they learned to call. They laid a palm on the sand and counted the distant footfalls. The first lesson ended when they could tell a caravan from a creature moving below." },
  { id: "covenant", title: "The Golden Covenant", text: "The keepers carried three relics to the dunes. They sounded their horns only when the great creature rested. After the third answer, it lowered its head. That day the roads gained a guardian." },
  { id: "prophecy", title: "The Obsidian Prophecy", text: "Black glass washed into the eastern well. The masons followed the warm stones to a cavern beneath the Citadel. Its walls glowed with the same lines as the creature sleeping within." },
  { id: "burrowing", title: "The Great Burrowing", text: "When the northern pass closed, the sandcallers opened a road beneath the dunes. Each journey began and ended at a marked clearing. They refused every request to carry the creatures beneath a house." },
  { id: "discovery", title: "The Discovery of the Hollow Sands", text: "The sealed stair descended farther than the oldest mine. At its foot, the explorers found a second desert beneath a roof of stone. A green pool stood beside a city whose doors faced the darkness." },
  { id: "experiment", title: "The Royal Experiment", text: "The king asked the forge to strengthen the call. Twelve crystal amplifiers answered a single horn. The sound returned from beneath the city before the horn bearer had lowered the instrument." },
  { id: "sentinel_warning", title: "The Warning of the Sentinels", text: "The sentinels left their gates and stood facing the palace. Their lamps beat out the old warning rhythm. The royal scribe copied it three times, then wrote one final word: stop." }
].map((record, index) => ({
  ...record,
  position: { x: [-33, -31, -29][index % 3], y: 22, z: [40, 44, 50][Math.floor(index / 3)] }
}));

export const SOLKARA_RECORDS = [
  ...SOLKARA_LIBRARY_RECORDS,
  ...[
    ["The Shattering", "The forge crystals broke in the order they had been tuned. Each returning note struck a deeper seam beneath the city. When the last crystal fell silent, the palace floor opened along the old caravan road."],
    ["The Fall of Solkara", "The market families took their lamps and descended to the oasis. Behind them, sand filled the streets from the north wall to the wells. The keeper of names carried the census below so every missing neighbor could be sought."],
    ["The Sealed Gateway", "Three relics held the gate open while the last keepers crossed. They removed its Core and set it beneath the temple altar. The passage would answer again only to someone who had listened to the surviving records."],
    ["The Last Sandcaller", "She returned to the dunes with a cracked horn. The creature that had carried her family waited beside the ruined road. She set the horn down, rested a hand on its armor, and stayed until the tremors faded."],
    ["The Sleeping King", "The eldest creature settled beneath the empty court. Sand covered its crown while the sentinels took their places at the pillars. The keepers left six records scattered across the realm and closed the stair behind them."],
    ["The Awakening of the Ancient", "A keeper's final instruction names no heir to the crown. It asks the visitor to read what survived, approach the altar freely, and leave the court open behind them. The guardian beneath it still remembers the call."]
  ].map(([title, text], index) => ({
    id: "region_" + index, title, region: SANDS_REGIONS[index].name, text: text + "\n\n" + SANDS_REGIONS[index].lore
  }))
];

export function hasSolkaraRecord(state, record) {
  return !!state?.solkaraLore?.[record.id] || !!(record.region && state?.sandsLore?.[record.region]);
}

export function solkaraRecordAt(hit) {
  return SOLKARA_LIBRARY_RECORDS.find(record =>
    record.position.x === hit.x && record.position.y === hit.y && record.position.z === hit.z);
}
