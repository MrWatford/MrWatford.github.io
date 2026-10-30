/* =========================================================
   Geometry Race — saving progress in this browser (localStorage)
   No accounts and nothing about the student: just level progress,
   tokens, attempts, looks, and settings. If storage is blocked
   (private window, school policy) the game still works; progress
   just lasts until the page is closed.
   ========================================================= */
(function () {
  "use strict";
  const GR = window.GR = window.GR || {};
  const KEY = "geometry-race-save";

  let storageOk = false;
  try { const k = "__gr_test"; localStorage.setItem(k, "1"); localStorage.removeItem(k); storageOk = true; } catch (e) { storageOk = false; }

  function prefersReduced() {
    try { return window.matchMedia("(prefers-reduced-motion: reduce)").matches; } catch (e) { return false; }
  }
  function defaults() {
    return {
      v: 1,
      levels: {},
      look: { icon: 0, c1: 0, c2: 1, trail: 0 },
      unlocked: { icons: [], trails: [] },
      settings: { music: 0.7, sfx: 0.8, muted: false, reducedMotion: prefersReduced(), lowFx: false, shake: true, autoCp: true },
      totalAttempts: 0
    };
  }
  function levelDefaults() {
    return { best: 0, practiceBest: 0, completed: false, practiceDone: false, attempts: 0, completions: 0, tokens: [false, false, false] };
  }

  function num(v, lo, hi, d) { return typeof v === "number" && isFinite(v) ? Math.min(hi, Math.max(lo, v)) : d; }
  function int(v, lo, hi, d) { return Math.round(num(v, lo, hi, d)); }
  function bool(v, d) { return typeof v === "boolean" ? v : d; }

  // Accept only the fields and types we expect; anything odd falls back to defaults.
  function clean(raw) {
    const d = defaults();
    if (!raw || typeof raw !== "object") return d;
    if (raw.levels && typeof raw.levels === "object") {
      Object.keys(raw.levels).forEach(function (id) {
        if (!/^[a-z0-9-]{1,40}$/.test(id)) return;
        const r = raw.levels[id], l = levelDefaults();
        if (!r || typeof r !== "object") return;
        l.best = int(r.best, 0, 100, 0);
        l.practiceBest = int(r.practiceBest, 0, 100, 0);
        l.completed = bool(r.completed, false);
        l.practiceDone = bool(r.practiceDone, false);
        l.attempts = int(r.attempts, 0, 1e7, 0);
        l.completions = int(r.completions, 0, 1e6, 0);
        if (Array.isArray(r.tokens)) l.tokens = [0, 1, 2].map(function (i) { return r.tokens[i] === true; });
        if (l.completed) l.best = 100;
        d.levels[id] = l;
      });
    }
    const lk = raw.look || {};
    d.look.icon = int(lk.icon, 0, GR.Looks.ICONS.length - 1, 0);
    d.look.c1 = int(lk.c1, 0, GR.Looks.COLORS.length - 1, 0);
    d.look.c2 = int(lk.c2, 0, GR.Looks.COLORS.length - 1, 1);
    d.look.trail = int(lk.trail, 0, GR.Looks.TRAILS.length - 1, 0);
    const un = raw.unlocked || {};
    if (Array.isArray(un.icons)) d.unlocked.icons = un.icons.filter(function (n) { return Number.isInteger(n) && n >= 0 && n < GR.Looks.ICONS.length; });
    if (Array.isArray(un.trails)) d.unlocked.trails = un.trails.filter(function (n) { return Number.isInteger(n) && n >= 0 && n < GR.Looks.TRAILS.length; });
    const st = raw.settings || {};
    d.settings.music = num(st.music, 0, 1, 0.7);
    d.settings.sfx = num(st.sfx, 0, 1, 0.8);
    d.settings.muted = bool(st.muted, false);
    d.settings.reducedMotion = bool(st.reducedMotion, d.settings.reducedMotion);
    d.settings.lowFx = bool(st.lowFx, false);
    d.settings.shake = bool(st.shake, true);
    d.settings.autoCp = bool(st.autoCp, true);
    d.totalAttempts = int(raw.totalAttempts, 0, 1e8, 0);
    return d;
  }

  let data = defaults(), damaged = false, timer = null;
  function load() {
    if (!storageOk) { data = defaults(); return data; }
    let text = null;
    try { text = localStorage.getItem(KEY); } catch (e) { text = null; }
    if (text) {
      try { data = clean(JSON.parse(text)); }
      catch (e) { damaged = true; data = defaults(); }
    } else data = defaults();
    return data;
  }
  function writeNow() {
    timer = null;
    if (!storageOk) return;
    try { localStorage.setItem(KEY, JSON.stringify(data)); } catch (e) { /* storage full or blocked: keep playing */ }
  }
  function save() { if (!timer) timer = setTimeout(writeNow, 150); }
  function flush() { if (timer) { clearTimeout(timer); writeNow(); } }
  function level(id) { return data.levels[id] || (data.levels[id] = levelDefaults()); }
  function reset() {
    const keepSettings = data.settings;
    data = defaults(); data.settings = keepSettings;
    if (storageOk) { try { localStorage.removeItem(KEY); } catch (e) { /* ignore */ } }
    writeNow();
  }
  function totalTokens() {
    let n = 0;
    Object.keys(data.levels).forEach(function (id) { data.levels[id].tokens.forEach(function (t) { if (t) n++; }); });
    return n;
  }
  function isUnlocked(rule) {
    if (!rule) return true;
    if (rule.level) return !!(data.levels[rule.level] && data.levels[rule.level].completed);
    if (rule.tokens) return totalTokens() >= rule.tokens;
    return false;
  }
  // Look for newly earned looks; returns their names so the game can announce them.
  function refreshUnlocks() {
    const fresh = [];
    GR.Looks.ICONS.forEach(function (ic, i) {
      if (ic.unlock && isUnlocked(ic.unlock) && data.unlocked.icons.indexOf(i) < 0) { data.unlocked.icons.push(i); fresh.push(ic.name + " cube"); }
    });
    GR.Looks.TRAILS.forEach(function (tr, i) {
      if (tr.unlock && isUnlocked(tr.unlock) && data.unlocked.trails.indexOf(i) < 0) { data.unlocked.trails.push(i); fresh.push(tr.name + " trail"); }
    });
    if (fresh.length) save();
    return fresh;
  }
  function iconOpen(i) { return !GR.Looks.ICONS[i].unlock || data.unlocked.icons.indexOf(i) >= 0; }
  function trailOpen(i) { return !GR.Looks.TRAILS[i].unlock || data.unlocked.trails.indexOf(i) >= 0; }

  window.addEventListener("pagehide", flush);

  GR.Save = {
    load: load, save: save, flush: flush, level: level, reset: reset, totalTokens: totalTokens,
    refreshUnlocks: refreshUnlocks, iconOpen: iconOpen, trailOpen: trailOpen,
    get data() { return data; }, get storageOk() { return storageOk; }, get damaged() { return damaged; }
  };
})();
