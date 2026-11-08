import { I } from "./blocks.js";
import { DESERT_SITES, RELIC_SITES } from "./desert-relic-sites.js";
import { SANDS_REGIONS } from "./hollow-sands.js";
import { SOLKARA_RECORDS, hasSolkaraRecord } from "./solkara-lore.js";
import { LEVIATHAN_BONDS } from "./leviathan-bonds.js";

const escapeBondText = value => String(value).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

export function leviathanBondCardsHTML(G) {
  const records = G.story.leviathan || {};
  return Object.entries(LEVIATHAN_BONDS).filter(([key]) => records[key]?.bonded && !records[key].defeated).map(([key, def]) => {
    const record = records[key], command = record.command || "wait";
    return `<section><h4>${escapeBondText(record.name || def.label)}</h4>
      <p>${def.label} · Health ${Math.ceil(record.hp)}/${def.hp} · ${escapeBondText(G.leviathanBondStatus?.(key) || "Resting beneath the sands")}</p>
      <label for="bond-name-${key}">Name (up to 24 characters)</label>
      <input id="bond-name-${key}" data-bond-name="${key}" value="${escapeBondText(record.name || "")}" maxlength="48" autocomplete="off">
      <button type="button" class="chip-btn" data-bond-key="${key}" data-bond-action="name">Save name</button>
      <p><button type="button" class="chip-btn ${command === "follow" ? "on" : ""}" aria-pressed="${command === "follow"}" data-bond-key="${key}" data-bond-action="follow">Follow</button>
      <button type="button" class="chip-btn ${command === "wait" ? "on" : ""}" aria-pressed="${command === "wait"}" data-bond-key="${key}" data-bond-action="wait">Wait</button></p></section>`;
  }).join("");
}

export function bindLeviathanBondControls(panel, G, refresh, click = () => {}) {
  panel.querySelectorAll("[data-bond-action]").forEach(button => button.onclick = () => {
    const key = button.dataset.bondKey, action = button.dataset.bondAction;
    const input = [...panel.querySelectorAll("[data-bond-name]")].find(field => field.dataset.bondName === key);
    if (G.setLeviathanBond(key, action, action === "name" ? input?.value : undefined)) { click(); refresh(); }
  });
}

export function hasDesertRelic(G, def) {
  return !!G.story.leviathan?.relics?.[def.key] || G.inv.count(def.item) > 0;
}

export function recordLeviathanDiscovery(G, storm) {
  if (G.creative || G.spectator) return;
  const s = G.story.leviathan ||= {};
  s.discovered ||= {};
  if (G.dim === "overworld") {
    for (const def of DESERT_SITES) {
      const site = s.sites?.[def.key], half = (def.size || 16) / 2;
      if (site && Math.hypot(G.player.pos.x - site.x - half, G.player.pos.z - site.z - half) < half + 8 &&
          Math.abs(G.player.pos.y - site.y) < 12) s.discovered[def.key] = true;
    }
    if (storm >= 2) s.stormWitnessed = true;
  }
  s.relics ||= {};
  if (G.inv.count(I.SANDCALLER_HORN)) s.hornCrafted = true;
  for (const def of RELIC_SITES) if (G.inv.count(def.item)) s.relics[def.key] = true;
}

export function leviathanQuests(G) {
  const s = G.story.leviathan || {}, found = s.discovered || {}, lore = s.sandsLore || {}, regions = s.sandsRegions || {};
  const relics = RELIC_SITES.filter(def => s.relics?.[def.key] || G.inv.count(def.item)).length;
  const resolved = s.dune?.defeated || s.dune?.bonded;
  return [
    ["Whispers Beneath the Dunes", Object.keys(found).length > 0 || !!s.dune, "Explore the desert and discover a Solkara landmark."],
    ["The First Sandstorm", !!s.stormWitnessed, "Witness an active storm outside in the desert."],
    ["The Desert Shrine", !!s.shrineRead, "Find the Desert Shrine and read its inscription."],
    ["The Call of the Sands", !!s.hornCrafted || !!G.inv.count(I.SANDCALLER_HORN) || !!s.dune?.bonded, "Craft the Sandcaller Horn at a workbench."],
    ["The Leviathan's Choice", !!resolved, "Defeat the Dune Leviathan or complete its three-surfacing bonding rite."],
    ["The Lost City of Solkara", !!found.city, "Explore the Abandoned Desert City and its buried archive."],
    ["The Three Ancient Relics", relics === 3, `Recover the shrine, graveyard and tomb relics (${relics}/3).`],
    ["Heart of the Inferno", !!s.obsidian?.bonded, "Earn the Dune bond, offer volcanic materials and answer four recovery windows."],
    ["The Obsidian Citadel", !!s.obsidian?.defeated || !!s.obsidian?.bonded, "Defeat or bond with the Obsidian Leviathan."],
    ["The Gate of the Forgotten", !!s.annex?.gateOpen, "Solve the Chamber of Echoes and bring the Ancient Desert Core to the gateway."],
    ["Into the Hollow Sands", Object.keys(regions).length > 0, "Cross the Sealed Gateway and explore the arrival sanctuary."],
    ["The Forgotten Kingdom", !!regions["Forgotten Kingdom"], "Find the ruins of the Forgotten Kingdom."],
    ["The Bone Fields", !!regions["Bone Fields"], "Discover the Bone Fields."],
    ["The Last Sandcaller", SANDS_REGIONS.every(r => lore[r.name]), `Read all six Solkara region tablets (${SANDS_REGIONS.filter(r => lore[r.name]).length}/6).`],
    ["The Throne of the Buried King", !!s.ancient?.defeated, "Bring the Core to the Throne altar and defeat the Ancient Leviathan."]
  ];
}

export function leviathanJournalHTML(G) {
  const s = G.story.leviathan || {};
  const quests = leviathanQuests(G);
  const sites = DESERT_SITES.flatMap(def => {
    const site = s.sites?.[def.key];
    if (!site || !s.discovered?.[def.key]) return [];
    const half = (def.size || 16) / 2;
    return [`<li>${def.name} · X ${site.x + half}, Z ${site.z + half}</li>`];
  }).join("");
  const records = SOLKARA_RECORDS.map((r, index) => hasSolkaraRecord(s, r) ?
    `<li><button class="chip-btn" data-solkara-record="${index}">${r.title}</button></li>` :
    `<li>${r.title} · ${r.region || "Forgotten Library"}</li>`).join("");
  return `<div class="fw-journal leviathan-journal"><h4>Secrets Beneath the Sands</h4>
    <p>Choose combat or bonding for the first two Leviathans. The journal records both paths.</p>
    <p>${quests.filter(q => q[1]).length} of ${quests.length} objectives complete.</p>
    <h4>Your Leviathan bonds</h4><div class="leviathan-bonds">${leviathanBondCardsHTML(G) || "<p>Complete a bonding rite to unlock names and commands.</p>"}</div>
    <p>Follow uses clear surface routes and stops at obstacles. The horn summons or dismisses a bond; names and commands remain saved. On open desert sand, use the horn normally for Dune, or crouch + use for your bonded Obsidian Leviathan. Near the Citadel's inner court, the horn selects Obsidian. Both recalls need clear footing and space; step back from the court's center. Recall and dismissal share a 12-second settling cooldown for each bond.</p>
    <p>While riding a Dune Leviathan on solid ground, press G for Sandbreaker: a forward shockwave with a 12-second cooldown. Dismounting cancels its wind-up.</p>
    <p>On an Obsidian Leviathan, G releases Cinder Lance: up to three warned volcanic eruptions along a clear surface route, with an 18-second cooldown. Each enemy can be hit once per cast.</p>
    <p>On either bonded mount, B starts a short burrow through clear, flat desert sand, with a 20-second cooldown. B or C cancels to the surface; press C again to dismount. Health damage interrupts the burrow and brings you back up. The camera follows above the dunes. Attacks and item use wait until emergence. Alt+B works when B is your offhand-swap key.</p>
    <ol>${quests.map(([title, done, objective]) => `<li><strong>${done ? "✓ " : ""}${title}</strong><p>${objective}</p></li>`).join("")}</ol>
    <h4>Discovered landmarks</h4><ul>${sites || "<li>Explore the desert to record its landmarks.</li>"}</ul>
    ${s.shrineRead ? '<p>If the original temple halls are blocked, the shrine inscription can guide you to a separate Solkara sanctuary.</p><button class="btn small" data-solkara-sanctuary>Visit Solkara sanctuary</button>' : ""}
    <h4>Solkara records · ${SOLKARA_RECORDS.filter(r => hasSolkaraRecord(s, r)).length}/15</h4><ol>${records}</ol>
    <p>Opening a relic cache attunes its relic to you. Attunements remain available to the bonding rite and altar after an item is lost. Once claimed, the Ancient Desert Core keeps the gateway and Throne accessible.</p>
    <p>Legendary armor abilities use crouch + use with an empty main hand. The horn and weapon tooltips explain their controls.</p></div>`;
}
