import { UHC_DAY, UHC_END, UHC_SKINS, UHC_ACHIEVEMENT, bloodMoon, challengeDay } from "./ultra-hardcore.js";

const $ = id => document.getElementById(id);
const playTime = seconds => {
  const left = Math.max(0, Math.ceil(seconds));
  return `${Math.floor(left / 60)}:${String(left % 60).padStart(2, "0")}`;
};

export function challengeHUD(run, dim) {
  const hud = $("ultraHud");
  if (!hud) return;
  hud.hidden = run?.status !== "active";
  if (hud.hidden) return;
  $("ultraDay").textContent = bloodMoon(run) ? "THE FINAL HUNT" : `DAY ${challengeDay(run)} / 3`;
  $("ultraTime").textContent = dim === "overworld" ? `${playTime(UHC_END - run.elapsed)} UNTIL THE LAST DAWN` : "RETURN TO THE SURFACE TO ADVANCE";
  $("ultraFatigue").value = run.fatigue;
  hud.classList.toggle("blood", bloodMoon(run));
}

export function challengeHistory(records) {
  const history = $("ultraHistory");
  if (!history) return;
  history.hidden = !records.length;
  const items = records.sort((a, b) => b.played - a.played).map(run => {
    const item = document.createElement("li");
    const result = run.status === "completed" ? UHC_ACHIEVEMENT : "Run ended";
    item.textContent = `${run.name} · ${result} · ${playTime(run.elapsed)} survived · ${run.meals} meals${run.cause ? " · " + run.cause : ""}`;
    return item;
  });
  history.querySelector("ul").replaceChildren(...items);
}

export function challengeCue(event, run, game) {
  const box = $("ultraCue");
  if (!box) return;
  const cues = {
    day1: ["DAY 1 COMPLETE", "The wilderness has awakened. You are being hunted."],
    day2: ["DAY 2 COMPLETE", "The final day has begun. Prepare before sunset."],
    dusk: ["THE SUN IS SETTING", "Find shelter. The Blood Moon is rising."],
    moon: ["THE FINAL HUNT", "Survive the Blood Moon until sunrise."]
  };
  if (event === "victory") {
    $("ultraVictory").classList.toggle("ultra-reduced", game.settings.reducedMotion);
    $("ultraVictorySkins").replaceChildren(...UHC_SKINS.map(skin => skinCard(skin, game)));
    $("ultraVictoryStats").textContent = `${playTime(run.elapsed)} survived · ${run.meals} substantial meals · ${game.stats?.kills || 0} creatures defeated · ${Math.floor(game.stats?.walked || 0)} blocks walked`;
    return;
  }
  const [title, message] = cues[event];
  box.querySelector("b").textContent = title;
  box.querySelector("p").textContent = message;
  box.querySelector(".ultra-skins").replaceChildren(...UHC_SKINS
    .filter(skin => event === "day" + skin.day).map(skin => skinCard(skin, game)));
  box.hidden = false;
}

function skinCard(skin, game) {
  const card = document.createElement("figure");
  const image = game.skinThumb(skin.id);
  const caption = document.createElement("figcaption");
  caption.textContent = skin.name;
  card.append(image, caption);
  return card;
}

export const challengeTime = playTime;
