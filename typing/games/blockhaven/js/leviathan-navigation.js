import { DESERT_SITES } from "./desert-relic-sites.js";

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
          "Read the Observatory instrument for the next Leviathan Storm. During that storm, sprint across open desert sand to draw out the Dune Leviathan. Walking quietly or taking shelter avoids its notice." :
          def.key === "city" ?
            "Read the Last Market Ledger in the city's library for bearings to the Desert Shrine and Great Dune Observatory. Search the ruins and archive for more clues." :
            def.key === "citadel" ?
              "Explore the Citadel and read the Basalt Watch for directions to its inner court and the Obsidian Leviathan's rite. Prepare before entering the arena." :
              "Search this ruin for its ancient relic. Collecting a relic attunes it permanently; the Leviathan journal tracks your progress."
    }];
  });
}

export const LEVIATHAN_ROUTE_GUIDE = "Begin with the Desert Shrine bearing on the Explorer's Map (M). Other Solkara landmarks join the map when discovered. The Dune Leviathan has no fixed map marker: read the Great Dune Observatory to forecast its storm, then sprint across open desert sand during that storm. For Hollow Sands, explore the Solkara halls through the Desert Temple, or use Visit Solkara sanctuary below after reading the shrine. Solve the Chamber of Echoes, attune all three desert relics, claim the Ancient Desert Core at the Leviathan Altar, then interact with the Sealed Gateway to open it and again to cross. Hollow Sands is separate from the older Ancient City in the Deep.";
