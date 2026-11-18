import assert from "node:assert/strict";
import { LOST_WORLD_CHART, chartPoints, chartRegion, selectLostWorldWaypoint, lostWorldWaypoint, toggleLostWorldWaypoint } from "../js/lost-world-map.js";
import { LOST_WORLD_REGIONS } from "../js/lost-world-regions.js";
import { GODZILLA_ANCHORS, GODZILLA_SITE } from "../js/godzilla-caldera.js";

assert.deepEqual(LOST_WORLD_CHART.map(r => r.dim), ["lost_world", ...Object.keys(LOST_WORLD_REGIONS)]);
const G = { dim: "lost_world", story: { lostWorld: { version: 1, stage: 0 } } };
const progress = JSON.stringify(G.story.lostWorld);
for (const region of LOST_WORLD_CHART) {
  const points = chartPoints(G, region.dim);
  assert.equal(new Set(points.map(p => p.id)).size, points.length, "Unique landmark IDs");
  for (const p of points) {
    assert(Number.isFinite(p.x) && Number.isFinite(p.z), "Finite coordinates");
    assert(Math.abs(p.x - region.center[0]) < region.span / 2 - 4, "Landmark inside fitted map");
    assert(Math.abs(p.z - region.center[1]) < region.span / 2 - 4, "Landmark inside fitted map");
  }
}
assert.equal(lostWorldWaypoint(G), null, "Old saves start without an unsolicited waypoint");
assert(selectLostWorldWaypoint(G, "lost_world", "grove"));
const checkpoint = G.story.lostWorldMap, checkpointJSON = JSON.stringify(checkpoint);
assert.equal(lostWorldWaypoint(G).title, "Raptor Grove");
assert(selectLostWorldWaypoint(G, "godzilla_caldera", "godzilla"));
assert.equal(lostWorldWaypoint(G).id, "grove", "A different region cannot redirect the current waypoint");
assert.equal(JSON.stringify(checkpoint), checkpointJSON, "A pending save keeps independent navigation preferences");
G.dim = "godzilla_caldera";
assert.equal(lostWorldWaypoint(G).x, GODZILLA_SITE.x);
for (const [i, site] of GODZILLA_ANCHORS.entries()) {
  const pin = chartPoints(G, G.dim).find(p => p.id === "shield" + i);
  assert.equal(pin.x, site.x); assert.equal(pin.z, site.z);
}
assert.equal(toggleLostWorldWaypoint(G), false);
assert.equal(lostWorldWaypoint(G), null);
assert.equal(toggleLostWorldWaypoint(G), true);
assert(!selectLostWorldWaypoint(G, G.dim, "unknown"));
G.story = JSON.parse(JSON.stringify(G.story));
assert.equal(lostWorldWaypoint(G).id, "godzilla", "Navigation survives JSON round trip");
assert.equal(JSON.stringify(G.story.lostWorld), progress, "Navigation never advances the campaign");
G.dim = "overworld";
assert.equal(lostWorldWaypoint(G), null, "Jurassic waypoints never leak onto the Surface");
assert.equal(toggleLostWorldWaypoint(G), null);
assert(!selectLostWorldWaypoint(G, "lost_world", "camp"));
G.dim = "lost_world"; G.story = {};
assert(!chartPoints(G, G.dim).some(p => p.id === "outpost"), "Sandbox does not advertise the expedition-only ruin");
assert.equal(chartRegion("unknown"), undefined);
console.log("Eight-region chart, authored anchors, fit bounds, save isolation, waypoint routing and sandbox checks passed.");
