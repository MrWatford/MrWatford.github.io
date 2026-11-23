// The "Villages" journal tab (Milestone 23, Part E): jobs, levels and families, zombie villagers, outposts and raids.
// Written in Blockhaven's own words.
import { B, I, iconURL } from "./blocks.js";

const icon = id => `<img src="${iconURL(id)}" alt="" style="width:20px;height:20px;image-rendering:pixelated;vertical-align:middle">`;
const JOBS = [[B.COMPOSTER, "Farmer"], [B.FLETCH_TABLE, "Fletcher"], [B.LOOM, "Shepherd"], [B.ALTAR, "Cleric"], [B.SMITH_TABLE, "Smith"], [B.LECTERN, "Scribe"],
  [B.BEEHIVE, "Beekeeper"], [B.SMOKER, "Butcher"], [B.BLAST_FURNACE, "Armorer"], [B.BARREL, "Fisherman"], [B.STONECUTTER, "Mason"], [B.CAULDRON, "Leatherworker"]];

const PAGES = {
  jobs: { title: "Jobs", html: () => `
    <p>Every villager's job comes from a job block. A villager with <b>no job</b> takes any job block you place within 16 blocks of it:</p>
    <table class="ench-table"><tbody>${JOBS.map(([id, n]) => `<tr><td>${icon(id)}</td><td>${n}</td></tr>`).join("")}</tbody></table>
    <p class="help">If you break the job block of a villager nobody has traded with, it loses its job (and can take a new one). Trade with it once and it keeps its job forever.</p>
    <ul><li>${icon(B.SMOKER)} The Smoker cooks food and the ${icon(B.BLAST_FURNACE)} Blast Furnace smelts ores, both twice as fast as a Furnace.</li>
      <li>${icon(B.STONECUTTER)} The Stonecutter turns one stone block into 2 slabs, a stair or a wall, with nothing wasted.</li></ul>` },
  levels: { title: "Levels and families", html: () => `
    <ul>
      <li>Every trade gives the villager experience: <b>Novice → Apprentice → Journeyman → Expert → Master</b>. Each new level opens a bonus trade (a Master Armorer sells Skyshard armor!). No trade is ever locked.</li>
      <li>${icon(B.BED)} <b>Families:</b> in the daytime, two villagers together may have a child if the village has more beds than villagers. Place extra beds to help a village grow. Children grow up in about 20 minutes and then take a job.</li>
    </ul>` },
  zombies: { title: "Zombie villagers", html: () => `
    <ul>
      <li>On Normal and Hard, zombies hunt villagers at night. A villager they catch may become a <b>zombie villager</b> (always on Hard, half the time on Normal). On Easy, zombies leave villagers alone.</li>
      <li>${icon(I.GOLDEN_APPLE)} <b>Cure it:</b> throw a Splash Potion of Weakness at it, then right-click it with a Golden Apple. Keep it out of the sun for about a minute.</li>
      <li>A cured villager keeps its old job and level and sells everything for <b>half the Jade</b>.</li>
    </ul>` },
  raids: { title: "Outposts and raids", html: () => `
    <ul>
      <li><b>Pillager Outposts</b> are dark wooden watchtowers on open land, guarded by pillagers and a <b>Pillager Captain</b>. The lookout has a loot chest.</li>
      <li><b>Witch Huts</b> stand on stilts in swamps. <b>Woodland Mansions</b> hide deep in dark forests, full of treasure and dangerous guards.</li>
      <li>Defeat a Captain and you get <b>Bad Omen</b>. Walk into a village with it and raiders attack in waves (3 on Easy, 4 on Normal, 5 on Hard).</li>
      <li>Win the raid to become the <b>Hero of the Village</b>: everything is cheaper for an hour.</li>
    </ul>
    <p class="help">Brand-new worlds have these buildings everywhere. Older worlds get them only in land nobody has visited yet.</p>` }
};

export function villagesGuideHTML(G) {
  const open = PAGES[G.villGuide] ? G.villGuide : "jobs";
  const menu = `<div class="swg-menu">${Object.entries(PAGES).map(([k, pg]) => `<button class="chip-btn ${open === k ? "on" : ""}" data-vlg="${k}">${pg.title}</button>`).join("")}</div>`;
  return `<div class="swg">${menu}<div class="swg-text"><h4>${PAGES[open].title}</h4>${PAGES[open].html()}</div></div>`;
}
export function bindVillagesGuide(p, G, rerender, click) {
  p.querySelectorAll("[data-vlg]").forEach(btn => btn.onclick = () => { click(); G.villGuide = btn.dataset.vlg; rerender(); });
}
