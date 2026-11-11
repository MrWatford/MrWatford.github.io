import { ancientRewardPending } from './ancient-victory.js';
import { I, iconURL, itemDef } from "./blocks.js";
import { DESERT_SITES, RELIC_SITES } from "./desert-relic-sites.js";
import { HOLLOW_SANDS, SANDS_REGIONS } from "./hollow-sands.js";
import { SOLKARA_SANCTUARY } from "./solkara-annex.js";
import { SOLKARA_RECORDS, hasSolkaraRecord } from "./solkara-lore.js";
import { LEVIATHAN_BONDS } from "./leviathan-bonds.js";
import { LEVIATHAN_ROUTE_GUIDE, leviathanShrineBearings, sandcallerPreparation } from "./leviathan-navigation.js";
import { OBSIDIAN_OFFERING_TEXT } from "./obsidian-rite.js";
import { STORM_ACTIVITY_GUIDE } from "./leviathan-storm.js";

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
    ["Heart of the Inferno", !!s.obsidian?.bonded, s.obsidian?.bonded ? "The Obsidian Leviathan's bond is yours. Use its journal controls to name and command it." :
      s.obsidian?.ritualOffered ? "Offering accepted. Sound the horn once in each of four fresh recoveries while nearby with a clear view. Each answer intensifies the trial. Striking it resets the sequence; your offering stays accepted across retries and reloads." :
        `Earn the Dune bond, bring ${OBSIDIAN_OFFERING_TEXT}, then offer them with the horn near the awakened Obsidian Leviathan on the arena floor. Answer the next four recovery windows without striking it.`],
    ["The Obsidian Citadel", !!s.obsidian?.defeated || !!s.obsidian?.bonded, "Defeat or bond with the Obsidian Leviathan."],
    ["The Gate of the Forgotten", !!s.annex?.gateOpen, "Solve the Chamber of Echoes and bring the Ancient Desert Core to the gateway."],
    ["Into the Hollow Sands", Object.keys(regions).length > 0, "Cross the Sealed Gateway and explore the arrival sanctuary."],
    ["The Forgotten Kingdom", !!regions["Forgotten Kingdom"], "Find the ruins of the Forgotten Kingdom."],
    ["The Bone Fields", !!regions["Bone Fields"], "Discover the Bone Fields."],
    ["The Last Sandcaller", SANDS_REGIONS.every(r => lore[r.name]), `Read all six Solkara region tablets (${SANDS_REGIONS.filter(r => lore[r.name]).length}/6). In Hollow Sands, press M to find the unread records and the Return Gate.`],
    ["The Throne of the Buried King", !!s.ancient?.defeated, ancientRewardPending(s.ancient) ? "Victory is saved. Return to the Throne altar with backpack space to claim the full treasure set and 350 experience. Your unclaimed rewards remain safe across reloads." : s.ancient?.defeated ? "The Buried King is defeated and its treasures have been granted. Use the companion relic to call Runecrest." : "Bring the Core to the Throne altar and defeat the Ancient Leviathan. Newly entered combat phases are saved; return to the altar after victory for its treasures."]
  ];
}

export function leviathanJournalHTML(G) {
  if (G.creative) return `<div class="fw-journal leviathan-journal">
    <h4>Leviathan Creative previews</h4>
    <p>Open the Creative inventory (E) and search for Leviathan spawn eggs. Use an egg on top of a solid block in a wide open area. Each new preview replaces the previous one.</p>
    ${G.dim === "overworld" ? `<h4>Practice riding</h4><p>Dune and Obsidian eggs hatch with a saddle on the Surface. Right-click near the head with an empty hand. Steer with W A S D, press B to burrow through clear desert sand, G to practice the mounted attack, and C to get off. Practice strikes mark their targets without hurting them.</p>
      <p>See a peak sandstorm for 45 seconds while above ground in a desert.</p>
      <p><button type="button" class="btn small" data-leviathan-storm-preview="start">Preview sandstorm</button>
      <button type="button" class="btn small" data-leviathan-storm-preview="stop">End preview</button></p>
      <h4>Explore Hollow Sands</h4><p>Visit Solkara sanctuary and use the glowing gateway inside the halls.</p>
      <button type="button" class="btn small" data-solkara-sanctuary>Visit Solkara sanctuary</button>` : ""}
    ${G.dim === SOLKARA_SANCTUARY ? "<p>Use the glowing gateway deeper in the halls to explore Hollow Sands. The gate near the sanctuary entrance returns to the Surface.</p>" : ""}
    ${G.dim === HOLLOW_SANDS ? '<p>Use the survey to find the six regions and the Return Gate.</p><button type="button" class="btn small" data-hollow-sands-map>Open Hollow Sands survey</button>' : ""}
    <p>Earn bonds, boss victories and their rewards in Survival.</p></div>`;
  const s = G.story.leviathan || {};
  const quests = leviathanQuests(G);
  const prep = sandcallerPreparation(G);
  const readyRelics = RELIC_SITES.filter(def => hasDesertRelic(G, def)).length;
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
    ${G.dim === HOLLOW_SANDS ? '<button type="button" class="btn small" data-hollow-sands-map>Open Hollow Sands survey</button>' : ""}
    <h4>Your route into Solkara</h4><p>${LEVIATHAN_ROUTE_GUIDE}</p>
    <section class="leviathan-preparation" aria-label="Sandcaller Horn preparation">
      <h4><img src="${iconURL(I.SANDCALLER_HORN)}" alt="">Prepare the Sandcaller Horn</h4>
      <p class="preparation-status">${prep.status}</p>
      <details class="preparation-recipe" ${prep.owned ? "" : "open"}><summary>${prep.owned ? "Recipe and sources for a spare horn" : "Recipe and material sources"}</summary>
      <ul class="leviathan-ingredients">${prep.ingredients.map(row => `<li class="${row.missing ? "missing" : "ready"}">
        <img src="${iconURL(row.id)}" alt=""><span>${row.name}<small>${row.missing ? `Need ${row.missing} more` : "Enough collected"}</small></span>
        <strong aria-label="${row.name}: ${row.have} held, ${row.need} required">${row.have} / ${row.need}</strong></li>`).join("")}</ul>
      <p>${prep.instructions}</p><p>${prep.sources}</p>${prep.bearing ? `<p class="preparation-bearing">${prep.bearing}</p>` : ""}
      </details>
      <p>Crafting the horn does not spend your relics. Read the shrine and attune all three relics before attempting the Dune bonding rite.</p>
    </section>
    <section class="leviathan-preparation" aria-label="Ancient relic preparations">
      <h4>Three ancient relics · ${readyRelics}/3 ready</h4>
      <p>${s.shrineRead ? "✓ Shrine inscription read. Its bearings remain below." : "Read the Desert Shrine inscription before attempting the bonding rite. Its starting bearing is on the Explorer's Map (M)."}</p>
      <ul class="leviathan-ingredients leviathan-relics">${RELIC_SITES.map(def => {
        const attuned = !!s.relics?.[def.key], held = G.inv.count(def.item) > 0;
        return `<li class="${attuned || held ? "ready" : "missing"}"><img src="${iconURL(def.item)}" alt="">
          <span>${itemDef(def.item).name}<small>${def.name}</small></span><b>${attuned ? "✓ Attuned" : held ? "Relic held" : "Not found"}</b></li>`;
      }).join("")}</ul>
      <p>${s.dune?.bonded ? "Your Dune bond is complete. These relic attunements also answer the Solkara altar; you do not need to collect them again." : s.dune?.defeated ? "The Dune Leviathan has been defeated. Keep these relic attunements for the Ancient Desert Core and gateway route." : readyRelics === 3 ? "All three relics are ready. Take your Sandcaller Horn to the Great Dune Observatory to forecast or call a Leviathan Storm, then follow its warnings into the open desert." : "Open each ruin's relic cache to attune its relic. Attunements remain yours even when the physical relic is stored or lost; the journal uses either an attunement or a relic you carry."}</p>
      <p>${STORM_ACTIVITY_GUIDE}</p>
      <p>During the rite, dodge without striking the Leviathan. Sound the horn once as the dust settles at each of three fresh surfacings. Striking it resets the sequence.</p>
    </section>
    ${s.shrineRead ? `<h4>Bearings from the Desert Shrine</h4><p>Search the shrine's cache for its relic. The keepers' other bearings remain here for your journey; landmarks join the map when you reach them.</p><ul>${leviathanShrineBearings(G.story).map(text => `<li>${text}</li>`).join("")}</ul>` : ""}
    <p>Choose combat or bonding for the first two Leviathans. The journal records both paths.</p>
    <p>${quests.filter(q => q[1]).length} of ${quests.length} objectives complete.</p>
    <h4>Your Leviathan bonds</h4><div class="leviathan-bonds">${leviathanBondCardsHTML(G) || "<p>Complete a bonding rite to unlock names and commands.</p>"}</div>
    <p>Craft one Saddle per mount at a workbench using five leather and one iron ingot. Let your Leviathan finish emerging, then right-click near its head with the saddle. Right-click with an empty hand to climb aboard.</p>
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
