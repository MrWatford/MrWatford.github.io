import { DESERT_SITES } from "./desert-relic-sites.js";
import { I, RECIPES, itemDef } from "./blocks.js";

// Read the real recipe and current inventory; guidance never grants items or progress.
export function sandcallerPreparation(G) {
  const recipe = RECIPES.find(r => r.out[0] === I.SANDCALLER_HORN);
  const ingredients = (recipe?.ins || []).map(([id, need]) => {
    const have = G?.inv?.count(id) || 0;
    return { id, name: itemDef(id).name, need, have, missing: Math.max(0, need - have) };
  });
  const owned = (G?.inv?.count(I.SANDCALLER_HORN) || 0) > 0;
  const ready = ingredients.length > 0 && ingredients.every(row => row.missing === 0);
  const materials = ingredients.map(row => `${row.need} × ${row.name}`).join(", ");
  const instructions = `At a Workbench, craft the Sandcaller Horn with ${materials}. Choose All recipes and search for Sandcaller Horn if it is not listed under Can make.`;
  const sources = "Relic caches contain bones and gold. Leather can drop from adult cows, or you can recover it from the old market supplies beneath the Abandoned Desert City's library. Bring a pickaxe to uncover the concealed cache.";
  const s = G?.story?.leviathan, city = s?.sites?.city;
  const bearing = s?.shrineRead && city && [city.x, city.z].every(Number.isFinite) ?
    `The keepers' supply route: Abandoned Desert City market stair near X ${city.x + 12}, Z ${city.z + 20}. Descend into the library and search its north wall for a cobblestone plug.` : "";
  const status = owned ? "Horn in your inventory · ready to carry on your journey." : ready ?
    "Materials ready · return to a Workbench to craft your horn." : s?.hornCrafted ?
      "No horn in this inventory · retrieve yours from storage or gather materials to craft another." :
      "Gather the missing materials before crafting your horn.";
  return { ingredients, owned, ready, materials, instructions, sources, bearing, status };
}

// Map bearings reference the saved structure plan; they never place or discover terrain.
export const LEVIATHAN_MAP_TYPES = Object.fromEntries(DESERT_SITES.map(def => ["solkara_" + def.key, {
  label: def.name, color: def.key === "citadel" ? "#ef8750" : "#eabf62",
  dark: "#664322", where: "Solkara · Surface desert"
}]));

export function leviathanShrineBearings(story) {
  if (!story?.leviathan?.shrineRead) return [];
  return DESERT_SITES.filter(def => ["graveyard", "tomb", "observatory"].includes(def.key)).flatMap(def => {
    const site = story.leviathan.sites?.[def.key];
    if (!site || ![site.x, site.z].every(Number.isFinite)) return [];
    const half = (def.size || 16) / 2;
    return [`${def.name} — X ${site.x + half}, Z ${site.z + half}.`];
  });
}

export function leviathanDestinations(story) {
  const expansion = story?.leviathan;
  if (!expansion) return [];
  return DESERT_SITES.flatMap(def => {
    const site = expansion.sites?.[def.key], discovered = !!expansion.discovered?.[def.key];
    if ((!discovered && def.key !== "shrine") || !site ||
        ![site.x, site.y, site.z].every(Number.isFinite)) return [];
    const half = (def.size || 16) / 2;
    return [{ kind: "solkara_" + def.key, title: def.name,
      name: discovered ? "Discovered landmark" : "Keeper's bearing · begin here",
      x: site.x + half, y: site.y, z: site.z + half, visited: discovered,
      guide: def.key === "shrine" ?
        "Follow this bearing to the Desert Shrine and read its inscription. Press J and choose Leviathan for your objectives. Explore the ruins for three relics and the Great Dune Observatory; its instrument forecasts Leviathan Storms. During a Leviathan Storm, sprint on open desert sand to draw the Dune Leviathan out. This bearing marks the shrine, not the creature." :
        def.key === "observatory" ?
        "Read the instrument for the next natural Leviathan Storm. With the shrine read, all three relics ready and a crafted horn, stand by the instrument and sound the horn to call a storm. Daytime sprinting and fights against several desert hostiles can also stir storms. During its strongest phase, sprint on open sand to draw out the Leviathan; walking quietly or sheltering avoids its notice." :
          def.key === "city" ?
            "Read the Last Market Ledger in the city's library for bearings to the Desert Shrine and Great Dune Observatory. Search the ruins and archive for more clues." :
            def.key === "citadel" ?
              "Explore the Citadel and read the Basalt Watch for directions to its inner court and the Obsidian Leviathan's rite. Prepare before entering the arena." :
              "Search this ruin for its ancient relic. Collecting a relic attunes it permanently; the Leviathan journal tracks your progress."
    }];
  });
}

export const LEVIATHAN_ROUTE_GUIDE = "Begin with the Desert Shrine bearing on the Explorer's Map (M). Other Solkara landmarks join the map when discovered. The Dune Leviathan has no fixed map marker: read the Great Dune Observatory to forecast its storm, then sprint across open desert sand during that storm. For Hollow Sands, explore the Solkara halls through the Desert Temple, or use Visit Solkara sanctuary below after reading the shrine. Solve the Chamber of Echoes, attune all three desert relics, claim the Ancient Desert Core at the Leviathan Altar, then interact with the Sealed Gateway to open it and again to cross. Hollow Sands is separate from the older Ancient City in the Deep.";
