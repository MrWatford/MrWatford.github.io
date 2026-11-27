export function readGusSettings() {
  try {
    const value = JSON.parse(window.localStorage.getItem("blockhaven-settings") || "{}");
    return {
      quality: value?.quality === "fast" ? "fast" : "fancy",
      reducedMotion: value?.reducedMotion === true,
      muted: value?.muted === true,
      volume: Number.isFinite(value?.volume) ? Math.min(1, Math.max(0, value.volume)) : 0.6
    };
  } catch {
    return { quality: "fancy", reducedMotion: false, muted: false, volume: 0.6 };
  }
}
