const OPTIONS_KEY = "blockhaven.gus.options";
const byId = (id) => document.getElementById(id);

function loadOverrides() {
  try {
    const saved = JSON.parse(localStorage.getItem(OPTIONS_KEY));
    const overrides = {};
    if (typeof saved?.muted === "boolean") overrides.muted = saved.muted;
    if (Number.isFinite(saved?.volume)) overrides.volume = Math.max(0, Math.min(1, saved.volume));
    if (typeof saved?.reducedMotion === "boolean") overrides.reducedMotion = saved.reducedMotion;
    return overrides;
  } catch {
    return {};
  }
}

export function createGusCampaignMenu(settings) {
  const menu = byId("campaignMenu");
  const play = byId("campaignPlay");
  const playLabel = byId("campaignPlayLabel");
  const launchStatus = byId("campaignLaunchStatus");
  const mute = byId("campaignMute");
  const volume = byId("campaignVolume");
  const volumeValue = byId("campaignVolumeValue");
  const motion = byId("campaignMotion");
  const optionsStatus = byId("campaignOptionsStatus");
  const overrides = loadOverrides();
  Object.assign(settings, overrides);

  function updateMotionPreference() {
    menu.classList.toggle("campaign-reduced-motion", settings.reducedMotion);
  }

  function saveOption(key, value) {
    settings[key] = overrides[key] = value;
    try {
      localStorage.setItem(OPTIONS_KEY, JSON.stringify(overrides));
      optionsStatus.hidden = true;
    } catch {
      optionsStatus.textContent = "Your options apply for this visit. The browser couldn’t save them.";
      optionsStatus.hidden = false;
    }
  }

  mute.checked = settings.muted;
  volume.value = Math.round(settings.volume * 100);
  volumeValue.value = volume.value + "%";
  motion.checked = settings.reducedMotion;
  updateMotionPreference();
  mute.addEventListener("change", () => saveOption("muted", mute.checked));
  volume.addEventListener("input", () => { volumeValue.value = volume.value + "%"; });
  volume.addEventListener("change", () => saveOption("volume", volume.valueAsNumber / 100));
  motion.addEventListener("change", () => {
    saveOption("reducedMotion", motion.checked);
    updateMotionPreference();
  });

  byId("campaignOptionsButton").addEventListener("click", () => byId("campaignOptions").showModal());
  byId("campaignExtrasButton").addEventListener("click", () => byId("campaignExtras").showModal());

  return {
    ready(source, { detail = "", complete = false, previews = [] } = {}) {
      playLabel.textContent = complete ? source.textContent : detail ? "Continue Campaign" : "Play Campaign";
      launchStatus.textContent = detail;
      play.disabled = false;
      play.addEventListener("click", () => source.click());
      for (const [card, chapter] of previews) {
        if (chapter.hidden) continue;
        const frame = byId(card);
        const status = frame.querySelector(".chapter-status");
        const button = document.createElement("button");
        button.type = "button";
        button.className = "campaign-secondary";
        button.textContent = chapter.textContent;
        button.addEventListener("click", () => chapter.click());
        status.replaceWith(button);
      }
    },
    hide() { menu.hidden = true; },
    unavailable() {
      play.disabled = true;
      play.dataset.unavailable = "";
      playLabel.textContent = "Campaign Unavailable";
      launchStatus.textContent = "Check that WebGL is available in your browser.";
    }
  };
}
