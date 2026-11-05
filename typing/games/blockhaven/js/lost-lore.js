// The Lost Civilization's story: tablets, murals, and memories. Original writing for Blockhaven.
// Each entry: title, who wrote it, where it's found, and the text. `step` is which of the 7 discoveries it belongs to.
export const LORE = {
  camp_pell: { step: 0, title: "A Note Pinned to the Map Table", by: "Expedition leader Rosalind Pell", where: "the Abandoned Expedition Camp",
    text: "We came down the Keeper lift with nine lanterns and good boots. We're leaving with four lanterns and better manners.\n\nThe city below listens. Stone carries every step; the dark moss repeats it. Walk on the soft carpets where you can, crouch near the glowing nodes, and if you need something to go look elsewhere, throw an Echo Shard and let it make the noise for you.\n\nThe Sanctuary past the market stays quiet. Rest there." },
  ilyan_gate: { step: 1, title: "The Promise of the Gate", by: "Chief Engineer Ilyan", where: "the Gate of Whispers",
    text: "Today the Council approved the First Gate. Our sea temple, our green temple, our sun temple, and this capital will be joined, and through the gate, perhaps places farther still.\n\nNo more month-long crossings. No settlement left alone through a hard winter. If a village rings, we will hear it, and we will come." },
  bazaar_ledger: { step: 1, title: "Merchant's Ledger, Last Page", by: "Dalla, lamp-seller of the Bazaar", where: "the Silent Bazaar",
    text: "Sold 40 lamps to the Terraces, 12 to the Archive, 3 to a very polite child who paid in buttons.\n\nTrade has never been better. Everyone wants a lamp now that the deep streets are full of visitors from the gate works. Note to self: order more copper before the festival." },
  child_hush: { step: 0, title: "A Card from the Schoolroom", by: "Wren, age nine", where: "the Residential Terraces",
    text: "My favorite game is Hush-and-Seek. The seeker closes their eyes and you have to cross the courtyard without making a sound. I always win because I walk on the carpet.\n\nI built a model of the whole city out of blocks. I put a secret door in it, behind the kitchen, just like the real one. Don't tell." },
  mara_voice: { step: 2, title: "Scout's Report, First Crossing", by: "Scout Mara", where: "the Great Archive",
    text: "The other side is beautiful. Floating stone, rivers of light, a ring of pale rock across the sky.\n\nBut it hums. Every time our machines pulse, the hum answers, a little louder, a little closer to our own rhythm. It isn't an echo. Echoes don't learn." },
  ilyan_worry: { step: 2, title: "Engineering Journal, Day 212", by: "Chief Engineer Ilyan", where: "the Great Archive",
    text: "The first gate carried a voice before it carried a traveler. We should have asked whose voice it was.\n\nThe resonance from beyond matches our network more closely each day. I've asked the Council to pause the expansion. They've asked me for a faster schedule." },
  foundry_log: { step: 3, title: "Foundry Shift Log", by: "Foreman Coss", where: "the Resonance Foundry",
    text: "Amplifier 9 is repeating signals we never sent. Amplifier 10 is repeating Amplifier 9.\n\nThe dark moss has grown over the east pipes again. It sits still until someone drops a wrench, then the whole wall glows, and the nodes down the street pick it up and pass it along. We scraped it off twice. It came back thicker." },
  council_order: { step: 4, title: "Council Order 77", by: "The Keeper Council", where: "the Watcher Bridges",
    text: "By order of the Council: all amplifiers are to run at double strength to drown out the foreign resonance.\n\nEngineers who disagree may put their objections in writing. Work will continue while their objections are considered." },
  tovin_evac: { step: 5, title: "Evacuation Notice", by: "Archivist Tovin", where: "the Sunken Aqueduct",
    text: "If the streets go quiet, use the lower aqueduct. Leave the lamps burning for those behind you.\n\nThe guardian will hold the citadel and keep the gate shut until the last family is through. It has been told we will come back for it. I hope one of us does." },
  warden_order: { step: 5, title: "The Guardian's Standing Order", by: "Engraved on the Citadel wall", where: "the Warden's Citadel",
    text: "PROTECT THE EVACUATION. KEEP THE FIRST GATE SEALED. ANY SOUND IN THE EMPTY CITY IS A THREAT.\n\nUnderneath, scratched by hand: \"The guardian still obeys. That is the trouble. No one remains to tell it we are safe.\"" },
  last_procedure: { step: 6, title: "The Stabilization Procedure", by: "Chief Engineer Ilyan, last entry", where: "the First Gate Archive",
    text: "For whoever comes after us: the gate can be made safe. Fill the four sockets: three stabilizers (the true relics from our temples, or the copies we left in the Archive, the Foundry, and the Gardens) and the guardian's own core.\n\nThen wake them as we first learned them: the SEA that carried us, the GREEN that fed us, the SUN that guided us, and last the ECHO that undid us. Do not make the signal louder. Make it whole." },
  mara_crown: { step: 7, title: "Scout's Report, Last Crossing", by: "Scout Mara", where: "the Memory Gardens",
    text: "There's something at the center of the other realm. Huge. A crown of floating stone above it, turning in time with our machines.\n\nIt's tangled in our network, the way a kite gets tangled in a tree. Every amplifier we built made it stronger. If anyone ever goes back, don't fight the noise with more noise. Find the anchors and quiet them, one at a time." },
  sanctuary_plaque: { step: 0, title: "Plaque at the Sanctuary Door", by: "Keeper builders", where: "the Sanctuary of Silence",
    text: "These walls are lined with hush-stone and soft carpet. No sound passes in or out. Rest here, traveler. Nothing that hunts by hearing will cross this threshold." },
  garden_keeper: { step: 0, title: "Gardener's Chalkboard", by: "Head Gardener Ophel", where: "the Memory Gardens",
    text: "Seeds from beyond the gate: pale roots, light-trees, glass moss. They only grow when the water, the light, and the warmth are all just right.\n\nThree switches run the garden: WATER, LIGHT, WARMTH. If the trees ever go dark, wake all three." },
  expanse_camp: { step: 7, title: "Scout Camp Diary", by: "Scout Mara", where: "the Echo Expanse",
    text: "Day one on the other side. Built a little camp by the gate. The fields pulse every few seconds; some bridges only feel solid on the beat. Count the pulses before you cross." },
  forge_plaque: { step: 7, title: "The Resonance Forge", by: "Chief Engineer Ilyan", where: "the Echo Expanse",
    text: "Our control network reached even here. Three anchors hold the crowned one's link to our city. Quiet an anchor and its armor loosens. Quiet all three and its crown will come apart when struck." },
  citadel_answer: { step: 7, title: "The Answer", by: "Carved in the Crownless Citadel", where: "the Echo Expanse",
    text: "It was never evil. It was loud, because we were loud.\n\nWhen its heart opens, bring the anchors into one rhythm. A single, whole note. Then the noise will have nothing left to repeat." }
};
// Murals: four big pictures in the city. Each has a caption as readable text.
export const MURALS = {
  m_founding: { title: "Mural: The Founding of Echohold", where: "the Gate of Whispers", text: "Keepers carve a great cavern city by lamplight. Four roads lead out to four temples: a wave, a leaf, a sun, and an echo." },
  m_voice: { title: "Mural: The First Voice", where: "the Great Archive", text: "Engineers gather around a glowing ring. Through it, pale rings of sound ripple back toward them, larger than the ones they sent." },
  m_hush: { title: "Mural: The Spreading Hush", where: "the Resonance Foundry", text: "Dark moss climbs the pipes of the city. Every lamp it touches flickers in the same rhythm. People cover their ears." },
  m_sealing: { title: "Mural: The Sealing", where: "the First Gate", text: "A towering guardian stands before the gate with arms spread wide while families walk away down a lamp-lit aqueduct." }
};
// Short optional memories: replayable from the journal; you're safe while they play.
export const MEMORIES = {
  mem_control: { title: "Memory: The Control Room", where: "the First Gate Archive", lines: ["The gate control room hums with light. Engineers lean over a glowing table.", "\"Sea… green… sun… echo,\" Ilyan reads aloud, tapping four symbols in order. \"Whole, not louder.\"", "The ring brightens evenly, and for a moment the hum goes perfectly still."] },
  mem_evac: { title: "Memory: The Evacuation", where: "the Sunken Aqueduct", lines: ["Light-shapes of families walk single file along the aqueduct, lamps in hand.", "A child stops to straighten a lamp on a ledge, then hurries after the others.", "Behind them, the great guardian lowers itself across the citadel door and goes still."] },
  mem_apartment: { title: "Memory: Before the Silence", where: "a quiet apartment", lines: ["Through the window, Echohold glows gold and blue. Bridges full of people. Music from the Bazaar.", "Someone is laughing in the courtyard below. A bell rings for the evening market.", "Then the window shows the dark city again. But you saw it. It was real."] }
};
export const LORE_STEPS = ["", "The city was proud of its gate.", "Something answered from the other side.", "The amplifiers spread the answer through the city.", "Rushing made it worse.", "The guardian was left to protect the evacuation.", "The engineers left a way to fix it.", "The crowned one is tied to the same network."];
// The three temples: outposts the Keepers built to hold the gate's relics. Each has an arrival record, a puzzle clue,
// a piece of history, and the relic's own inscription. (step 0: extra reading, not one of the city's seven discoveries)
export const TEMPLE_LORE = {
  sea_arrival: { step: 0, title: "Harbor Log of the Drowned Citadel", by: "Harbormaster Nell", where: "the Drowned Citadel",
    text: "The Citadel was built on a reef, and the sea came up to meet it. We sealed the lower halls with thick glass so the keepers could still work below the waves.\n\nThe Tidal Heart sleeps in the vault under the Tide Hall. The Regent guards it. It was built to test visitors, not to harm them, but it does not hold back." },
  sea_clue: { step: 0, title: "Bell-Ringer's Rhyme", by: "Scratched beside four switches", where: "the Drowned Citadel",
    text: "First the PEARL that sleeps below,\nthen the WAVE that comes and goes,\nthen the STAR above the foam,\nand the SHELL to bring you home." },
  sea_history: { step: 0, title: "Why the Halls Flooded", by: "Engineer Caro", where: "the Drowned Citadel",
    text: "Every sluice in this place drains toward the low pipe. When the city went quiet, nobody was left to open them, and the lower treasury filled to the ceiling.\n\nIf you find the sluice lever, pull it. The water will go where it always should have." },
  sea_relic: { step: 0, title: "Inscription: The Tidal Heart", by: "Carved on the pedestal", where: "the Drowned Citadel", text: "THE TIDAL HEART. It remembers the rhythm of the sea, and lends that steadiness to the First Gate's SEA socket." },
  jungle_arrival: { step: 0, title: "The Gardener-Keepers' Welcome", by: "Painted on a wooden board", where: "the Verdant Labyrinth",
    text: "This valley was our greenhouse. The light-trees grow without sun, the streams never freeze, and the labyrinth keeps the careless out of the inner grove.\n\nMap tip: keep one hand on the wall. Every dead end has something worth finding." },
  jungle_clue: { step: 0, title: "The Grove of Bells", by: "Gardener Tamsin", where: "the Verdant Labyrinth",
    text: "The Root Gate only opens to a chord. Ring all three bells in the grove within eight heartbeats of each other. Run if you have to; the bells don't mind." },
  jungle_history: { step: 0, title: "Notes on the Colossus", by: "Gardener Tamsin", where: "the Verdant Labyrinth",
    text: "We grew the Colossus from rootwood and stone to guard the Lens. Three bloom-levers feed it strength when it's hurt. Close them and its bark goes soft.\n\nWatch the ground: roots always glow before they rise." },
  jungle_relic: { step: 0, title: "Inscription: The Verdant Lens", by: "Carved on the pedestal", where: "the Verdant Labyrinth", text: "THE VERDANT LENS. Look through it and everything green seems to lean toward the light. It steadies the First Gate's GREEN socket." },
  desert_arrival: { step: 0, title: "Expedition Notes: Aurelis", by: "Rosalind Pell", where: "the Sunken Pyramid of Aurelis",
    text: "The sand swallowed most of the pyramid long ago, but the Keepers' rooms inside are perfectly dry. Sunlight still reaches the deepest hall through a shaft of mirrors.\n\nCaution: the floors with cracks in them do not hold weight for long. There's always a way back up." },
  desert_clue: { step: 0, title: "The Order of the Glyphs", by: "Painted under a sunrise mural", where: "the Sunken Pyramid of Aurelis",
    text: "The day begins when the SUN rises, the EYE opens, the RIVER flows, and the STAR fades. Press the glyph-switches in the order of the day." },
  desert_history: { step: 0, title: "The Solar Colossus", by: "Keeper Ardo", where: "the Sunken Pyramid of Aurelis",
    text: "The Colossus stands under the light shaft and drinks the sun. Turn the three great mirrors and their light will dazzle it, and its stone will crack.\n\nWhen it raises its disk, a beam follows. Step sideways out of the glowing line." },
  desert_relic: { step: 0, title: "Inscription: The Solar Seal", by: "Carved on the pedestal", where: "the Sunken Pyramid of Aurelis", text: "THE SOLAR SEAL. Warm to the touch, even here in the dark. It steadies the First Gate's SUN socket." }
};
