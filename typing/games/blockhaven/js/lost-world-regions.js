import { FERN_PLAINS, FERN_LAYOUT, FernPlainsGenerator, PLAINS_ARRIVAL } from "./fern-plains.js";
import { LOST_WORLD } from "./lost-world.js";
import { MANGROVE, MANGROVE_LAYOUT, MangroveGenerator, MANGROVE_ARRIVAL } from "./mangrove-wetlands.js";

import { REDWOODS, REDWOOD_LAYOUT, RedwoodGenerator, REDWOOD_ARRIVAL } from "./redwood-escarpment.js";

import { AMBER_CAVERNS, AMBER_LAYOUT, AmberCavernsGenerator, AMBER_ARRIVAL } from "./amber-caverns.js";

import { TYRANT_CANYON, CANYON_LAYOUT, TyrantCanyonGenerator, CANYON_ARRIVAL } from "./tyrant-canyon.js";

import { VOLCANIC_BADLANDS, BADLANDS_LAYOUT, VolcanicBadlandsGenerator, BADLANDS_ARRIVAL, BADLANDS_START } from "./volcanic-badlands.js";

import { GODZILLA_CALDERA, CALDERA_LAYOUT, GodzillaCalderaGenerator, CALDERA_ARRIVAL, GODZILLA_START } from "./godzilla-caldera.js";

export const LOST_WORLD_REGIONS = {
  [FERN_PLAINS]: { name: "the Fern Plains", from: "Travel to the Fern Plains", stage: 2, layout: FERN_LAYOUT, Generator: FernPlainsGenerator, arrival: PLAINS_ARRIVAL },
  [MANGROVE]: { name: "the Mangrove Wetlands", from: "Travel to the Mangrove Wetlands", stage: 4, layout: MANGROVE_LAYOUT, Generator: MangroveGenerator, arrival: MANGROVE_ARRIVAL },
  [REDWOODS]: { name: "the Redwood Escarpment", from: "Travel to the Redwood Escarpment", stage: 6, layout: REDWOOD_LAYOUT, Generator: RedwoodGenerator, arrival: REDWOOD_ARRIVAL },
  [AMBER_CAVERNS]: { name: "the Amber Caverns", from: "Travel to the Amber Caverns", stage: 8, layout: AMBER_LAYOUT, Generator: AmberCavernsGenerator, arrival: AMBER_ARRIVAL },
  [TYRANT_CANYON]: { name: "Tyrant Canyon", from: "Travel to Tyrant Canyon", stage: 10, layout: CANYON_LAYOUT, Generator: TyrantCanyonGenerator, arrival: CANYON_ARRIVAL },
  [VOLCANIC_BADLANDS]: { name: "the Volcanic Badlands", from: "Travel to the Volcanic Badlands", stage: BADLANDS_START, layout: BADLANDS_LAYOUT, Generator: VolcanicBadlandsGenerator, arrival: BADLANDS_ARRIVAL },
  [GODZILLA_CALDERA]: { name: "the Caldera", from: "Travel to the Caldera", stage: GODZILLA_START, layout: CALDERA_LAYOUT, Generator: GodzillaCalderaGenerator, arrival: CALDERA_ARRIVAL }
};
export const isLostWorldRegion = dim => Object.hasOwn(LOST_WORLD_REGIONS, dim);
export const isLostWorldDimension = dim => dim === LOST_WORLD || isLostWorldRegion(dim);
