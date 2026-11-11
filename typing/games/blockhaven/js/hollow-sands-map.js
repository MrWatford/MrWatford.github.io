import { SANDS_RETURN, SANDS_TABLETS } from "./hollow-sands.js";
import { SANDS_LANDMARK_LAYOUT, sandsLandmarkClue, sandsLandmarkName } from "./hollow-sands-landmarks.js";
import { THRONE_TABLET } from "./buried-throne.js";
import { SOLKARA_SCENERY, SOLKARA_SCENERY_LAYOUT } from "./solkara-scenery.js";

const destinations = [
  ...SANDS_TABLETS.map(({ x, z, region }, zone) => ({ x, z, region: region.name, zone, marker: zone + 1 })),
  { x: SANDS_RETURN.x, z: SANDS_RETURN.z, title: "Return Gate", marker: "G" },
  { x: THRONE_TABLET.x, z: THRONE_TABLET.z, title: "Buried Throne", marker: "T" }
];
const chartPosition = (x, z) => `--map-x:${50 + x * 0.30}%;--map-y:${(z + 112) * 0.28}%`;
const titleOf = (place, layout) => place.title || (layout ? sandsLandmarkName(place.zone) : place.region + " tablet");
const stopsFor = G => G.dimData.hollow_sands?.solkaraScenery === SOLKARA_SCENERY_LAYOUT ?
  [...destinations, ...SOLKARA_SCENERY] : destinations;

export function hollowSandsMapHTML(G) {
  const layout = G.dimData.hollow_sands?.sandsLandmarks === SANDS_LANDMARK_LAYOUT;
  const lore = G.story.leviathan?.sandsLore;
  const total = SANDS_TABLETS.filter(t => lore?.[t.region.name]).length;
  const { x, z } = G.player.pos;
  const onChart = Math.abs(x) < 150 && z > -105 && z < 235;
  const selected = G.sandsWaypointHidden ? null : G.sandsWaypoint?.marker;
  const stops = stopsFor(G);
  return `<section class="inv-card sands-map">
    <header><h3>Hollow Sands survey</h3><p>${total}/6 records read · You are at X ${Math.floor(x)}, Z ${Math.floor(z)}.</p></header>
    <div class="sands-map-body">
      <div class="sands-chart" aria-hidden="true">
        <span class="sands-north">↑ N</span>
        ${stops.map(d => `<span class="sands-pin ${selected === d.marker ? "selected" : ""}" style="${chartPosition(d.x,d.z)}">${d.marker}</span>`).join("")}
        ${onChart ? `<span class="sands-you" style="${chartPosition(x,z)}"></span>` : ""}
        <span class="sands-chart-key">● You</span>
      </div>
      <div class="sands-stops">
        ${stops.map((place, index) => {
          const detail = place.region ? `${place.region} · ${lore?.[place.region] ? "Read" : "Unread"}` :
            place.clue ? "Optional ruins" : place.marker === "G" ? "Back to the Solkara halls" : "Six records and Core attunement needed";
          const clue = place.clue || (layout && place.region ? sandsLandmarkClue(place.zone) : "");
          return `<button type="button" class="sands-stop" data-sands-stop="${index}" aria-pressed="${selected === place.marker}">
            <span class="sands-stop-marker">${place.marker}</span><span><strong>${titleOf(place, layout)}</strong>
            <small>${detail} · X ${place.x}, Z ${place.z}</small>
            ${clue ? `<small class="sands-stop-clue">${clue}</small>` : ""}</span>
          </button>`;
        }).join("")}
      </div>
    </div>
    <p class="help">Choose a destination and follow the arrow around obstacles. Press N to hide or show it. Open the survey from shelter when enemies are nearby.</p>
    <button type="button" class="btn small" data-sands-close>Back to game</button>
  </section>`;
}

export function mountHollowSandsMap(panel, G, refresh) {
  const layout = G.dimData.hollow_sands?.sandsLandmarks === SANDS_LANDMARK_LAYOUT;
  const stops = stopsFor(G);
  panel.querySelector("[data-sands-close]").onclick = () => G.closePanel();
  panel.querySelectorAll("[data-sands-stop]").forEach(button => {
    button.onclick = () => {
      const place = stops[Number(button.dataset.sandsStop)];
      G.sandsWaypoint = { ...place, title: titleOf(place, layout) };
      G.sandsWaypointHidden = false;
      refresh();
      panel.querySelector(`[data-sands-stop="${button.dataset.sandsStop}"]`)?.focus();
    };
  });
}
