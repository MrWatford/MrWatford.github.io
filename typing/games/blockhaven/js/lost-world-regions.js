import { FERN_PLAINS, FERN_LAYOUT, FernPlainsGenerator, PLAINS_ARRIVAL } from "./fern-plains.js";
import { LOST_WORLD } from "./lost-world.js";
import { MANGROVE, MANGROVE_LAYOUT, MangroveGenerator, MANGROVE_ARRIVAL } from "./mangrove-wetlands.js";

import { REDWOODS, REDWOOD_LAYOUT, RedwoodGenerator, REDWOOD_ARRIVAL } from "./redwood-escarpment.js";

export const LOST_WORLD_REGIONS = {
  [FERN_PLAINS]: { name: "the Fern Plains", from: "Travel to the Fern Plains", stage: 2, layout: FERN_LAYOUT, Generator: FernPlainsGenerator, arrival: PLAINS_ARRIVAL },
  [MANGROVE]: { name: "the Mangrove Wetlands", from: "Travel to the Mangrove Wetlands", stage: 4, layout: MANGROVE_LAYOUT, Generator: MangroveGenerator, arrival: MANGROVE_ARRIVAL },
  [REDWOODS]: { name: "the Redwood Escarpment", from: "Travel to the Redwood Escarpment", stage: 6, layout: REDWOOD_LAYOUT, Generator: RedwoodGenerator, arrival: REDWOOD_ARRIVAL }
};
export const isLostWorldRegion = dim => Object.hasOwn(LOST_WORLD_REGIONS, dim);
export const isLostWorldDimension = dim => dim === LOST_WORLD || isLostWorldRegion(dim);
