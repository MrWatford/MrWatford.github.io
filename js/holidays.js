/* =========================================================
   Holiday & Season Themes — the "brain"

   site.js loads this file on every website page. It:
   1. Works out today's date in Chicago time.
   2. Finds the holiday that is on today (or the season).
   3. Decorates the page: colors, header lights/garlands,
      a greeting ribbon, card decorations, footer art,
      falling snow/leaves/etc.
   4. On the home page, loads js/holiday-scenes.js for the
      big holiday scene (Christmas village, Easter garden…).

   Settings: js/holiday-settings.js (everyone) and the
   holidays.html page (this computer, previews, calendar).
   Try any theme on any page by adding ?holiday=christmas
   or ?holidayDate=2027-04-04 to the address.
   Nothing here collects or sends any information.
   ========================================================= */
(function () {
  "use strict";

  const ME = document.currentScript;
  const ROOT = ME ? ME.src.replace(/js\/holidays\.js.*$/, "") : "";
  const DAY = 864e5;

  /* ---------- 1. Date helpers (whole days, no time-zone surprises) ---------- */
  const dn = (y, m, d) => Math.round(Date.UTC(y, m - 1, d) / DAY);
  function ymd(n) {
    const t = new Date(n * DAY);
    return { y: t.getUTCFullYear(), m: t.getUTCMonth() + 1, d: t.getUTCDate(), w: t.getUTCDay() };
  }
  // The k-th weekday of a month (wd: 0 = Sunday … 6 = Saturday)
  function nth(y, m, wd, k) {
    const first = new Date(Date.UTC(y, m - 1, 1)).getUTCDay();
    return dn(y, m, 1 + ((wd - first + 7) % 7) + (k - 1) * 7);
  }
  function lastWeekday(y, m, wd) {
    const last = new Date(Date.UTC(y, m, 0));
    return dn(y, m, last.getUTCDate() - ((last.getUTCDay() - wd + 7) % 7));
  }
  // Easter Sunday (Western churches), works for any year
  function easter(y) {
    const a = y % 19, b = Math.floor(y / 100), c = y % 100, d = Math.floor(b / 4), e = b % 4;
    const f = Math.floor((b + 8) / 25), g = Math.floor((b - f + 1) / 3);
    const h = (19 * a + b - d - g + 15) % 30, i = Math.floor(c / 4), k = c % 4;
    const l = (32 + 2 * e + 2 * i - h - k) % 7, m = Math.floor((a + 11 * h + 22 * l) / 451);
    const month = Math.floor((h + l - 7 * m + 114) / 31), day = ((h + l - 7 * m + 114) % 31) + 1;
    return dn(y, month, day);
  }
  function chicagoToday() {
    try {
      const p = {};
      new Intl.DateTimeFormat("en-US", { timeZone: "America/Chicago", year: "numeric", month: "numeric", day: "numeric" })
        .formatToParts(new Date()).forEach((x) => { p[x.type] = x.value; });
      return dn(+p.year, +p.month, +p.day);
    } catch (e) {
      const t = new Date();
      return dn(t.getFullYear(), t.getMonth() + 1, t.getDate());
    }
  }
  function parseDate(s) {
    const m = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(String(s || "").trim());
    return m ? dn(+m[1], +m[2], +m[3]) : null;
  }
  const toISO = (n) => { const t = ymd(n); return t.y + "-" + String(t.m).padStart(2, "0") + "-" + String(t.d).padStart(2, "0"); };
  const fmt = (n, o) => new Date(n * DAY).toLocaleDateString("en-US", Object.assign({ timeZone: "UTC" }, o || { weekday: "short", month: "short", day: "numeric" }));

  /* ---------- 2. The holiday calendar ----------
     range(y) gives the first day, last day, and the holiday itself.
     prio breaks ties when two overlap (the holiday's own day also gets +50).
     kind: major = big home-page scene, solemn = quiet and respectful. */
  const HOLIDAYS = [
    { id: "newyear", name: "New Year's", kind: "minor", prio: 60, when: "Dec 31 – Jan 3",
      range: (y) => ({ start: dn(y - 1, 12, 31), end: dn(y, 1, 3), day: dn(y, 1, 1) }) },
    { id: "mlk", name: "Martin Luther King Jr. Day", kind: "solemn", prio: 70, when: "3 days before – 3rd Monday of January",
      range: (y) => { const d = nth(y, 1, 1, 3); return { start: d - 3, end: d, day: d }; } },
    { id: "valentine", name: "Valentine's Day", kind: "minor", prio: 55, when: "Feb 7 – 14",
      range: (y) => ({ start: dn(y, 2, 7), end: dn(y, 2, 14), day: dn(y, 2, 14) }) },
    { id: "presidents", name: "Presidents' Day", kind: "minor", prio: 50, when: "3 days before – 3rd Monday of February",
      range: (y) => { const d = nth(y, 2, 1, 3); return { start: d - 3, end: d, day: d }; } },
    { id: "stpatrick", name: "St. Patrick's Day", kind: "minor", prio: 50, when: "Mar 10 – 17",
      range: (y) => ({ start: dn(y, 3, 10), end: dn(y, 3, 17), day: dn(y, 3, 17) }) },
    { id: "goodfriday", name: "Good Friday", kind: "solemn", prio: 150, when: "2 days before Easter",
      range: (y) => { const d = easter(y) - 2; return { start: d, end: d, day: d }; } },
    { id: "easter", name: "Easter", kind: "major", prio: 105, when: "Palm Sunday – Easter Monday",
      range: (y) => { const e = easter(y); return { start: e - 7, end: e + 1, day: e }; } },
    { id: "mothers", name: "Mother's Day", kind: "minor", prio: 60, when: "3 days before – 2nd Sunday of May",
      range: (y) => { const d = nth(y, 5, 0, 2); return { start: d - 3, end: d, day: d }; } },
    { id: "memorial", name: "Memorial Day", kind: "solemn", prio: 80, when: "3 days before – last Monday of May",
      range: (y) => { const d = lastWeekday(y, 5, 1); return { start: d - 3, end: d, day: d }; } },
    { id: "flag", name: "Flag Day", kind: "minor", prio: 65, when: "Jun 14",
      range: (y) => ({ start: dn(y, 6, 14), end: dn(y, 6, 14), day: dn(y, 6, 14) }) },
    { id: "fathers", name: "Father's Day", kind: "minor", prio: 60, when: "3 days before – 3rd Sunday of June",
      range: (y) => { const d = nth(y, 6, 0, 3); return { start: d - 3, end: d, day: d }; } },
    { id: "independence", name: "Independence Day", kind: "major", prio: 75, when: "Jun 27 – Jul 5",
      range: (y) => ({ start: dn(y, 6, 27), end: dn(y, 7, 5), day: dn(y, 7, 4) }) },
    { id: "labor", name: "Labor Day", kind: "minor", prio: 60, when: "3 days before – 1st Monday of September",
      range: (y) => { const d = nth(y, 9, 1, 1); return { start: d - 3, end: d, day: d }; } },
    { id: "patriot", name: "Patriot Day", kind: "solemn", prio: 95, when: "Sep 11",
      range: (y) => ({ start: dn(y, 9, 11), end: dn(y, 9, 11), day: dn(y, 9, 11) }) },
    { id: "halloween", name: "Halloween (Fall Festival)", kind: "minor", prio: 55, when: "Oct 24 – 31",
      range: (y) => ({ start: dn(y, 10, 24), end: dn(y, 10, 31), day: dn(y, 10, 31) }) },
    { id: "veterans", name: "Veterans Day", kind: "solemn", prio: 80, when: "Nov 7 – 11",
      range: (y) => ({ start: dn(y, 11, 7), end: dn(y, 11, 11), day: dn(y, 11, 11) }) },
    { id: "thanksgiving", name: "Thanksgiving", kind: "major", prio: 75, when: "Nov 12 – Thanksgiving Day",
      range: (y) => { const d = nth(y, 11, 4, 4); return { start: dn(y, 11, 12), end: d, day: d }; } },
    { id: "christmas", name: "Christmas", kind: "major", prio: 85, when: "Day after Thanksgiving – Dec 30",
      range: (y) => ({ start: nth(y, 11, 4, 4) + 1, end: dn(y, 12, 30), day: dn(y, 12, 25) }) }
  ];
  const SEASONS = [
    { id: "spring", name: "Spring", kind: "season", when: "Mar 20 – Jun 20" },
    { id: "summer", name: "Summer", kind: "season", when: "Jun 21 – Sep 21" },
    { id: "fall", name: "Fall", kind: "season", when: "Sep 22 – Dec 20" },
    { id: "winter", name: "Winter", kind: "season", when: "Dec 21 – Mar 19" }
  ];
  const BY_ID = {};
  HOLIDAYS.concat(SEASONS).forEach((h) => { BY_ID[h.id] = h; });

  /* ---------- 3. Settings ---------- */
  const DEFAULTS = { auto: true, seasonal: true, animations: true, disabled: [], adjust: {}, force: "" };
  const DEVICE_KEY = "holiday-device-settings";
  const PREVIEW_KEY = "holiday-preview";
  const VISITOR_KEY = "holiday-visitor";
  function readJSON(store, key) { try { return JSON.parse(store.getItem(key)) || null; } catch (e) { return null; } }
  function writeJSON(store, key, val) { try { if (val == null) store.removeItem(key); else store.setItem(key, JSON.stringify(val)); } catch (e) { /* storage blocked */ } }
  function mergeSettings(base, extra) {
    if (!extra || typeof extra !== "object") return base;
    ["auto", "seasonal", "animations"].forEach((k) => { if (typeof extra[k] === "boolean") base[k] = extra[k]; });
    if (Array.isArray(extra.disabled)) base.disabled = extra.disabled.filter((id) => BY_ID[id]);
    if (extra.adjust && typeof extra.adjust === "object") {
      base.adjust = {};
      Object.keys(extra.adjust).forEach((id) => {
        const a = extra.adjust[id] || {};
        if (BY_ID[id]) base.adjust[id] = { before: Math.max(-30, Math.min(60, parseInt(a.before, 10) || 0)), after: Math.max(-30, Math.min(60, parseInt(a.after, 10) || 0)) };
      });
    }
    if (typeof extra.force === "string" && (extra.force === "" || extra.force === "none" || BY_ID[extra.force])) base.force = extra.force;
    return base;
  }
  const clone = (o) => JSON.parse(JSON.stringify(o));
  function siteSettings() { return mergeSettings(clone(DEFAULTS), window.HOLIDAY_SETTINGS); }
  function deviceSettings() { return readJSON(localStorage, DEVICE_KEY); }
  function settings() { return mergeSettings(siteSettings(), deviceSettings()); }

  // A preview from the address bar (?holiday=… / ?holidayDate=…) lasts for this browser tab.
  let urlRead = false;
  function readPreview() {
    let pv = readJSON(sessionStorage, PREVIEW_KEY);
    if (urlRead) return pv;
    urlRead = true;
    try {
      const q = new URLSearchParams(location.search);
      if (q.has("holiday") || q.has("holidayDate")) {
        const id = q.get("holiday"), date = q.get("holidayDate");
        if (id === "off" || id === "auto") pv = null;
        else pv = { id: (id && (BY_ID[id] || id === "none")) ? id : "", date: parseDate(date) ? date : "" };
        if (pv && !pv.id && !pv.date) pv = null;
        writeJSON(sessionStorage, PREVIEW_KEY, pv);
      }
    } catch (e) { /* old browser */ }
    return pv;
  }

  /* ---------- 4. Which theme is on? ---------- */
  function holidayRange(h, y, s) {
    const r = h.range(y), a = (s && s.adjust && s.adjust[h.id]) || {};
    return { start: r.start - (a.before || 0), end: r.end + (a.after || 0), day: r.day };
  }
  // Every holiday active on day n, best first.
  function holidaysOn(n, s, includeDisabled) {
    s = s || settings();
    const y = ymd(n).y, out = [];
    HOLIDAYS.forEach((h) => {
      if (!includeDisabled && s.disabled.indexOf(h.id) >= 0) return;
      for (let yy = y - 1; yy <= y + 1; yy++) {
        const r = holidayRange(h, yy, s);
        if (n >= r.start && n <= r.end) { out.push({ holiday: h, range: r, score: h.prio + (n === r.day ? 50 : 0) }); break; }
      }
    });
    return out.sort((a, b) => b.score - a.score);
  }
  function seasonOn(n) {
    const t = ymd(n), md = t.m * 100 + t.d;
    if (md >= 320 && md <= 620) return "spring";
    if (md >= 621 && md <= 921) return "summer";
    if (md >= 922 && md <= 1220) return "fall";
    return "winter";
  }
  // Main decision. Order: tab preview > forced theme > automatic holiday > season > nothing.
  function resolve(opts) {
    opts = opts || {};
    const s = opts.settings || settings();
    const pv = opts.preview === undefined ? readPreview() : opts.preview;
    const today = opts.date != null ? opts.date : (pv && pv.date ? parseDate(pv.date) : chicagoToday());
    const out = { date: today, settings: s, preview: pv, id: "", source: "standard", range: null };
    const pick = (id, source) => {
      out.id = id === "none" ? "" : id; out.source = source;
      const h = BY_ID[out.id];
      if (h && h.range) {
        const y = ymd(today).y;
        // the nearest copy of this holiday (this year, last year, or next)
        let best = null;
        for (let yy = y - 1; yy <= y + 1; yy++) {
          const r = holidayRange(h, yy, s);
          const dist = today < r.start ? r.start - today : today > r.end ? today - r.end : 0;
          if (!best || dist < best.dist) best = { r, dist };
        }
        out.range = best.r;
      }
      return out;
    };
    if (pv && pv.id) return pick(pv.id, "preview");
    if (s.force) return pick(s.force, "forced");
    if (s.auto) { const on = holidaysOn(today, s); if (on.length) return pick(on[0].holiday.id, "auto"); }
    if (s.seasonal) return pick(seasonOn(today), "season");
    return out;
  }
  // A full year's calendar (for the settings page and testing)
  function calendar(y, s) {
    s = s || settings();
    return HOLIDAYS.map((h) => ({ id: h.id, name: h.name, kind: h.kind, when: h.when, disabled: s.disabled.indexOf(h.id) >= 0, range: holidayRange(h, y, s), base: h.range(y) }));
  }

  /* ---------- 5. Little drawings used by the decorations ---------- */
  const svgURL = (svg) => 'url("data:image/svg+xml,' + encodeURIComponent(svg) + '")';
  const SVG = (w, h, body) => '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + w + " " + h + '" width="' + w + '" height="' + h + '">' + body + "</svg>";
  function starPts(cx, cy, R, r, n) {
    cx = +cx; cy = +cy; R = +R; r = +r; n = n || 5; let p = "";
    for (let i = 0; i < n * 2; i++) {
      const a = -Math.PI / 2 + (i * Math.PI) / n, rr = i % 2 ? r : R;
      p += (cx + Math.cos(a) * rr).toFixed(1) + "," + (cy + Math.sin(a) * rr).toFixed(1) + " ";
    }
    return p.trim();
  }
  const heartPath = (x, y, s) => (x = +x, y = +y, s = +s, "M" + x + " " + (y + s * 0.9) + "C" + (x - s * 1.3) + " " + (y) + " " + (x - s * 0.7) + " " + (y - s * 0.9) + " " + x + " " + (y - s * 0.25) + "C" + (x + s * 0.7) + " " + (y - s * 0.9) + " " + (x + s * 1.3) + " " + y + " " + x + " " + (y + s * 0.9) + "Z");
  const shamrock = (x, y, s, c) => (x = +x, y = +y, s = +s, 0) || '<g fill="' + c + '">' + heartPath(x, y - s * 0.75, s * 0.55).replace(/^/, '<path d="') + '"/>' +
    '<path d="' + heartPath(0, 0, s * 0.55) + '" transform="translate(' + (x - s * 0.62) + " " + (y + s * 0.2) + ') rotate(-120)"/>' +
    '<path d="' + heartPath(0, 0, s * 0.55) + '" transform="translate(' + (x + s * 0.62) + " " + (y + s * 0.2) + ') rotate(120)"/>' +
    '<path d="M' + x + " " + (y + s * 0.1) + "q" + s * 0.15 + " " + s * 0.7 + " " + s * 0.55 + " " + s * 1.1 + '" stroke="' + c + '" stroke-width="' + s * 0.16 + '" fill="none"/></g>';
  const leafPath = (x, y, s, rot, c) => '<path transform="translate(' + x + " " + y + ") rotate(" + rot + ") scale(" + s / 10 + ')" fill="' + c + '" d="M0-10L2.5-5.5 6.5-7.5 5.5-3 10-2 6 1.5 7.5 5 3 4 0 10-3 4-7.5 5-6 1.5-10-2-5.5-3-6.5-7.5-2.5-5.5Z"/>';
  const flower = (x, y, r, petal, mid) => {
    x = +x; y = +y; r = +r;
    let g = '<g fill="' + petal + '">';
    for (let i = 0; i < 5; i++) { const a = (i * 72 - 90) * Math.PI / 180; g += '<circle cx="' + (x + Math.cos(a) * r).toFixed(1) + '" cy="' + (y + Math.sin(a) * r).toFixed(1) + '" r="' + (r * 0.85).toFixed(1) + '"/>'; }
    return g + '</g><circle cx="' + x + '" cy="' + y + '" r="' + (r * 0.7).toFixed(1) + '" fill="' + mid + '"/>';
  };
  const pumpkin = (x, y, s) => '<g transform="translate(' + x + " " + y + ") scale(" + s + ')"><ellipse cx="-4" cy="0" rx="6" ry="7" fill="#e07a1f"/><ellipse cx="4" cy="0" rx="6" ry="7" fill="#e07a1f"/><ellipse cx="0" cy="0" rx="5" ry="7.4" fill="#f08c2a"/><path d="M0-7q1-3 3-4" stroke="#4f7a28" stroke-width="2" fill="none"/></g>';
  const cross = (x, y, s, c) => (x = +x, y = +y, s = +s, 0) || '<path fill="' + c + '" d="M' + (x - s * 0.12) + " " + (y - s) + "h" + s * 0.24 + "v" + s * 0.45 + "h" + s * 0.36 + "v" + s * 0.22 + "h" + -s * 0.36 + "v" + s * 1.33 + "h" + -s * 0.24 + "v" + -s * 1.33 + "h" + -s * 0.36 + "v" + -s * 0.22 + "h" + s * 0.36 + 'z"/>';
  const gear = (x, y, r, c) => {
    x = +x; y = +y; r = +r;
    let d = "";
    for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; d += '<rect x="' + (x - r * 0.18) + '" y="' + (y - r * 1.25) + '" width="' + r * 0.36 + '" height="' + r * 0.5 + '" transform="rotate(' + (i * 45) + " " + x + " " + y + ')"/>'; }
    return '<g fill="' + c + '">' + d + '<circle cx="' + x + '" cy="' + y + '" r="' + r + '"/></g><circle cx="' + x + '" cy="' + y + '" r="' + r * 0.4 + '" fill="#fff" opacity=".85"/>';
  };
  const ornament = (x, y, r, c) => (x = +x, y = +y, r = +r, 0) || '<path d="M' + x + " " + (y - r - 5) + 'v-4" stroke="#8a6d1d" stroke-width="1.5"/><rect x="' + (x - 3) + '" y="' + (y - r - 4) + '" width="6" height="4" rx="1" fill="#d9b13b"/><circle cx="' + x + '" cy="' + y + '" r="' + r + '" fill="' + c + '"/><circle cx="' + (x - r * 0.35) + '" cy="' + (y - r * 0.35) + '" r="' + r * 0.28 + '" fill="#fff" opacity=".55"/>';
  const snowflake = (x, y, r, c, w) => {
    x = +x; y = +y; r = +r;
    let d = "";
    for (let i = 0; i < 6; i++) {
      const a = i * Math.PI / 3, ex = x + Math.cos(a) * r, ey = y + Math.sin(a) * r;
      const mx = x + Math.cos(a) * r * 0.55, my = y + Math.sin(a) * r * 0.55;
      d += "M" + x + " " + y + "L" + ex.toFixed(1) + " " + ey.toFixed(1);
      d += "M" + mx.toFixed(1) + " " + my.toFixed(1) + "L" + (mx + Math.cos(a + 0.7) * r * 0.3).toFixed(1) + " " + (my + Math.sin(a + 0.7) * r * 0.3).toFixed(1);
      d += "M" + mx.toFixed(1) + " " + my.toFixed(1) + "L" + (mx + Math.cos(a - 0.7) * r * 0.3).toFixed(1) + " " + (my + Math.sin(a - 0.7) * r * 0.3).toFixed(1);
    }
    return '<path d="' + d + '" stroke="' + c + '" stroke-width="' + (w || 1.4) + '" stroke-linecap="round" fill="none"/>';
  };
  const flagMini = (x, y, w) => {
    x = +x; y = +y; w = +w;
    const h = w * 0.62, sh = h / 7; let s = '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" fill="#fff"/>';
    for (let i = 0; i < 7; i += 2) s += '<rect x="' + x + '" y="' + (y + i * sh).toFixed(1) + '" width="' + w + '" height="' + sh.toFixed(1) + '" fill="#b22234"/>';
    return s + '<rect x="' + x + '" y="' + y + '" width="' + w * 0.42 + '" height="' + sh * 4 + '" fill="#3c3b6e"/>';
  };
  const dove = (x, y, s, c) => '<path transform="translate(' + x + " " + y + ") scale(" + s + ')" fill="' + c + '" d="M-10 2c4-1 7-1 9 1l6-9c1 4 0 8-3 11l6 1c-4 3-10 4-14 2l-6 3 2-4c-1 0-1-1 0-5z"/>';
  const candyCorn = (x, y, s) => '<g transform="translate(' + x + " " + y + ") scale(" + s + ')"><path d="M-5 5L0-7 5 5Q0 7-5 5z" fill="#f6f1e1"/><path d="M-4 2.6L4 2.6 5 5Q0 7-5 5z" fill="#f08c2a"/><path d="M-2.4-1.5L2.4-1.5 4 2.6-4 2.6z" fill="#f7c331"/></g>';

  // Header trim tiles (a wire with lights, bunting, vines…). base = still layer, blink = twinkling layer.
  function trimTiles(id) {
    const W = 96, H = 26;
    const wire = '<path d="M0 3Q24 14 48 3T96 3" stroke="#2c3a2a" stroke-width="1.6" fill="none"/>';
    const bulbs = (cols) => cols.map((c, i) => { const x = 12 + i * 24, y = 3 + Math.sin((x / 96) * Math.PI * 2 - Math.PI / 2) * -5 + 6; return '<rect x="' + (x - 2) + '" y="' + (y - 3) + '" width="4" height="4" rx="1" fill="#3b3b3b"/><ellipse cx="' + x + '" cy="' + (y + 6) + '" rx="4" ry="6.5" fill="' + c + '"/><ellipse cx="' + (x - 1.3) + '" cy="' + (y + 4) + '" rx="1.2" ry="2.2" fill="#fff" opacity=".7"/>'; }).join("");
    const glow = (cols) => cols.map((c, i) => { const x = 12 + i * 24, y = 3 + Math.sin((x / 96) * Math.PI * 2 - Math.PI / 2) * -5 + 12; return '<circle cx="' + x + '" cy="' + y + '" r="10" fill="' + c + '" opacity=".35"/>'; }).join("");
    const vine = (c) => '<path d="M0 6Q24 16 48 6T96 6" stroke="' + c + '" stroke-width="2.2" fill="none"/>';
    switch (id) {
      case "christmas":
        return { h: H, base: SVG(W, H, wire + bulbs(["#e53935", "#1e88e5", "#fdd835", "#43a047"])), blink: SVG(W, H, glow(["#ff5a4f", "#4aa3ff", "#ffe45c", "#5fd36a"])) };
      case "newyear":
        return { h: H, base: SVG(W, H, '<path d="M0 4Q24 16 48 4T96 4" stroke="#d4af37" stroke-width="3" fill="none"/><path d="M0 7Q24 19 48 7T96 7" stroke="#c0c6d0" stroke-width="2" fill="none"/>' + '<polygon points="' + starPts(24, 17, 5, 2.2) + '" fill="#f3d36b"/><polygon points="' + starPts(72, 14, 4, 1.8) + '" fill="#e6e9ef"/>'), blink: SVG(W, H, '<polygon points="' + starPts(48, 12, 6, 1.5, 4) + '" fill="#fff6c8"/><polygon points="' + starPts(90, 18, 4, 1, 4) + '" fill="#fff"/>') };
      case "valentine":
        return { h: H, base: SVG(W, H, '<path d="M0 3Q24 12 48 3T96 3" stroke="#c2185b" stroke-width="1.4" fill="none"/>' + [12, 36, 60, 84].map((x, i) => '<path d="M' + x + ' 8v4" stroke="#c2185b" stroke-width="1"/><path d="' + heartPath(x, 16, i % 2 ? 5 : 6.5) + '" fill="' + ["#e91e63", "#f48fb1", "#d81b60", "#ff80ab"][i] + '"/>').join("")) };
      case "stpatrick":
        return { h: H, base: SVG(W, H, vine("#2f7d32") + shamrock(18, 14, 8, "#2e9e4a") + shamrock(66, 13, 7, "#1f7a38") + '<circle cx="42" cy="12" r="2.2" fill="#e3b83c"/><circle cx="90" cy="9" r="2" fill="#e3b83c"/>') };
      case "easter": case "spring": case "mothers": {
        const pal = id === "mothers" ? [["#e88aa8", "#fff2c4"], ["#c48ad8", "#fff"], ["#f4b6c8", "#f7d14a"]] : id === "easter" ? [["#fff", "#f4c542"], ["#c9a6ef", "#fff3b0"], ["#f7b8cf", "#f4c542"]] : [["#ffd1e1", "#f7c948"], ["#fff", "#f7c948"], ["#b7d8ff", "#fff"]];
        return { h: H, base: SVG(W, H, vine("#4f9a42") + leafPath(32, 12, 5, 40, "#5fae4c").replace(/M0-10L.*?Z/, "M0-10C6-6 6 4 0 10C-6 4-6-6 0-10Z") + leafPath(80, 10, 5, -40, "#5fae4c").replace(/M0-10L.*?Z/, "M0-10C6-6 6 4 0 10C-6 4-6-6 0-10Z") + flower(12, 12, 3.4, pal[0][0], pal[0][1]) + flower(56, 12, 4, pal[1][0], pal[1][1]) + flower(94, 10, 3, pal[2][0], pal[2][1])) };
      }
      case "goodfriday":
        return { h: 18, base: SVG(W, 18, '<path d="M0 0H96V6Q72 18 48 6Q24 18 0 6Z" fill="#4a2f63"/><path d="M0 6Q24 18 48 6Q72 18 96 6" stroke="#7d5a9c" stroke-width="1.5" fill="none"/>') };
      case "independence": case "flag": case "presidents": case "memorial": case "veterans": {
        const fan = '<path d="M0 0H96V2Q72 30 48 2Q24 30 0 2Z" fill="#b22234"/><path d="M4 2Q24 24 44 2Z" fill="#fff"/><path d="M52 2Q72 24 92 2Z" fill="#fff"/><path d="M10 2Q24 18 38 2Z" fill="#3c3b6e"/><path d="M58 2Q72 18 86 2Z" fill="#3c3b6e"/>' + '<polygon points="' + starPts(24, 6, 3, 1.3) + '" fill="#fff"/><polygon points="' + starPts(72, 6, 3, 1.3) + '" fill="#fff"/>';
        if (id === "memorial" || id === "veterans") return { h: 10, base: SVG(W, 10, '<rect width="96" height="4" fill="#3c3b6e"/><rect y="4" width="96" height="2" fill="#fff"/><rect y="6" width="96" height="2" fill="#b22234"/><polygon points="' + starPts(24, 2, 1.8, 0.8) + '" fill="#fff"/><polygon points="' + starPts(72, 2, 1.8, 0.8) + '" fill="#fff"/>') };
        return { h: 24, base: SVG(W, 24, fan) };
      }
      case "patriot":
        return { h: 8, base: SVG(W, 8, '<rect width="96" height="5" fill="#2d3440"/><rect y="5" width="96" height="1.5" fill="#b22234"/>') };
      case "mlk":
        return { h: 10, base: SVG(W, 10, '<rect width="96" height="5" fill="#3a4a6b"/><rect y="5" width="96" height="2" fill="#d9b44a"/>' + dove(48, 2.5, 0.22, "#fff")) };
      case "fathers":
        return { h: 12, base: SVG(W, 12, '<rect width="96" height="12" fill="#2f4f6f"/><path d="M0 4H96M0 8H96" stroke="#7aa3c9" stroke-width="1"/><path d="M12 0V12M36 0V12M60 0V12M84 0V12" stroke="#c9a061" stroke-width="1.4" opacity=".8"/>') };
      case "labor":
        return { h: 16, base: SVG(W, 16, '<rect width="96" height="6" fill="#2f5d8a"/>' + gear(24, 8, 4.5, "#f2b632") + gear(72, 7, 3.6, "#9fb3c8")) };
      case "thanksgiving": case "fall":
        return { h: H, base: SVG(W, H, '<path d="M0 4Q24 14 48 4T96 4" stroke="#6b4423" stroke-width="2" fill="none"/>' + leafPath(12, 13, 8, 15, "#d9622b") + leafPath(36, 15, 7, -20, "#e8a531") + leafPath(60, 12, 8, 30, "#b8361f") + leafPath(84, 14, 7, -10, "#c98a1b") + (id === "thanksgiving" ? '<ellipse cx="48" cy="11" rx="3" ry="3.6" fill="#8a5a2b"/><path d="M45 8.6h6" stroke="#5a3a1a" stroke-width="2"/>' : "")) };
      case "halloween":
        return { h: H, base: SVG(W, H, '<path d="M0 4Q24 14 48 4T96 4" stroke="#4f7a28" stroke-width="2" fill="none"/>' + pumpkin(16, 15, 0.9) + candyCorn(40, 14, 1) + pumpkin(64, 14, 1) + leafPath(86, 13, 6, 20, "#7b3fa0")), blink: null };
      case "summer":
        return { h: 12, base: SVG(W, 12, '<path d="M0 6Q12 0 24 6T48 6T72 6T96 6V12H0Z" fill="#3fa7d6" opacity=".75"/><path d="M0 9Q12 3 24 9T48 9T72 9T96 9V12H0Z" fill="#1f78a8" opacity=".8"/>') };
      case "winter":
        return { h: 20, base: SVG(W, 20, '<path d="M0 0H96V3H0Z" fill="#e8f3ff"/><path d="M6 3L9 15 12 3M22 3L24 10 26 3M40 3L43.5 18 47 3M60 3L62 9 64 3M76 3L79 14 82 3M88 3L90 8 92 3" fill="#dff0ff" stroke="#b5d6f2" stroke-width=".8"/>') };
      default: return null;
    }
  }

  // Bigger swag garland for page tops (the classroom wall and page "heroes")
  function garlandTile(id) {
    const W = 220, H = 58;
    const swag = (fill, extra) => '<path d="M0 4Q55 46 110 4Q165 46 220 4" stroke="' + fill + '" stroke-width="13" fill="none" stroke-linecap="round"/>' + (extra || "");
    switch (id) {
      case "christmas": {
        let g = swag("#1f5e33") + '<path d="M0 4Q55 46 110 4Q165 46 220 4" stroke="#2f7d45" stroke-width="7" stroke-dasharray="3 5" fill="none"/>';
        g += '<path d="M0 8Q55 50 110 8Q165 50 220 8" stroke="#d4af37" stroke-width="1.6" fill="none" stroke-dasharray="1 4"/>';
        [[110, 6], [0, 6], [220, 6]].forEach(([x, y]) => { g += '<path d="M' + x + " " + y + "l-10-6v12zM" + x + " " + y + 'l10-6v12z" fill="#c62828"/><path d="M' + x + " " + (y + 2) + "l-6 16M" + x + " " + (y + 2) + 'l6 16" stroke="#c62828" stroke-width="4" stroke-linecap="round"/><circle cx="' + x + '" cy="' + y + '" r="3.4" fill="#e53935"/>'; });
        [[55, 32, "#e53935"], [165, 32, "#d4af37"], [30, 22, "#1e88e5"], [190, 22, "#e53935"], [82, 24, "#fdd835"], [138, 24, "#43a047"]].forEach(([x, y, c]) => { g += ornament(x, y + 10, 5.2, c); });
        return { w: W, h: H + 10, svg: SVG(W, H + 10, g) };
      }
      case "easter": case "mothers": case "spring": {
        let g = swag("#4f9a42") + '<path d="M0 4Q55 46 110 4Q165 46 220 4" stroke="#7cc46a" stroke-width="5" stroke-dasharray="2 6" fill="none"/>';
        const cols = id === "mothers" ? ["#e88aa8", "#c48ad8", "#f4b6c8"] : id === "easter" ? ["#fff", "#c9a6ef", "#f7d14a"] : ["#ffd1e1", "#fff", "#b7d8ff"];
        [[20, 14], [55, 28], [90, 16], [130, 16], [165, 28], [200, 14], [110, 8]].forEach(([x, y], i) => { g += flower(x, y, 5.2, cols[i % 3], "#f4c542"); });
        return { w: W, h: H, svg: SVG(W, H, g) };
      }
      case "thanksgiving": case "fall": case "halloween": {
        let g = '<path d="M0 4Q55 46 110 4Q165 46 220 4" stroke="#7a5230" stroke-width="3" fill="none"/>';
        const cols = id === "halloween" ? ["#e07a1f", "#7b3fa0", "#f7b733", "#5c8a2b"] : ["#d9622b", "#e8a531", "#b8361f", "#c98a1b"];
        for (let i = 0; i <= 20; i++) { const t = i / 20, x = t * 220, y = 4 + Math.sin(t * Math.PI * 2 - Math.PI / 2) * -21 + 21 - 21; g += leafPath(x.toFixed(1), (4 + 42 * Math.pow(Math.sin(t * Math.PI * 2), 2) * 0.5 + 4).toFixed(1), 9, i * 37, cols[i % 4]); }
        g += id === "halloween" ? pumpkin(110, 12, 1.3) + pumpkin(55, 30, 1.1) + pumpkin(165, 30, 1.1) : pumpkin(110, 12, 1.2);
        return { w: W, h: H, svg: SVG(W, H, g) };
      }
      case "independence": case "flag": case "presidents": {
        let g = "";
        [0, 110].forEach((x0) => {
          g += '<path d="M' + x0 + " 2Q" + (x0 + 55) + " 60 " + (x0 + 110) + ' 2Z" fill="#b22234"/>';
          g += '<path d="M' + (x0 + 8) + " 2Q" + (x0 + 55) + " 48 " + (x0 + 102) + ' 2Z" fill="#fff"/>';
          g += '<path d="M' + (x0 + 18) + " 2Q" + (x0 + 55) + " 34 " + (x0 + 92) + ' 2Z" fill="#3c3b6e"/>';
          g += '<polygon points="' + starPts(x0 + 55, 10, 5, 2.1) + '" fill="#fff"/><polygon points="' + starPts(x0 + 40, 7, 2.6, 1.1) + '" fill="#fff"/><polygon points="' + starPts(x0 + 70, 7, 2.6, 1.1) + '" fill="#fff"/>';
        });
        g += '<circle cx="0" cy="3" r="5" fill="#d4af37"/><circle cx="110" cy="3" r="5" fill="#d4af37"/><circle cx="220" cy="3" r="5" fill="#d4af37"/>';
        return { w: W, h: H - 8, svg: SVG(W, H - 8, g) };
      }
      default: return null;
    }
  }

  // Small corner badge for card headers (white-friendly colors)
  function badgeSVG(id) {
    const b = (body) => SVG(24, 24, body);
    switch (id) {
      case "christmas": return b(ornament(12, 15, 6.5, "#e53935").replace(/#8a6d1d/, "#f3d36b"));
      case "easter": case "goodfriday": return b(cross(12, 9, 9, id === "easter" ? "#f6d365" : "#e9dff3"));
      case "independence": case "flag": case "presidents": case "veterans": case "memorial": return b('<polygon points="' + starPts(12, 12.5, 10, 4.2) + '" fill="#fff"/><polygon points="' + starPts(12, 12.5, 6, 2.5) + '" fill="#d94a4a"/>');
      case "thanksgiving": return b(leafPath(12, 12, 11, 10, "#f2a33a"));
      case "newyear": return b('<polygon points="' + starPts(12, 12, 11, 3, 4) + '" fill="#f3d36b"/>');
      case "valentine": return b('<path d="' + heartPath(12, 12, 9) + '" fill="#ffc2d6"/>');
      case "stpatrick": return b(shamrock(12, 11, 9, "#a9f0b4"));
      case "mothers": return b(flower(12, 12, 4.4, "#ffd1e1", "#f7c948"));
      case "fathers": return b('<path d="M9 3h6l-1.5 4 3 11L12 22l-4.5-4 3-11z" fill="#c9dcef"/>');
      case "labor": return b(gear(12, 12, 6.5, "#f2b632"));
      case "halloween": return b(pumpkin(12, 13, 1.25));
      case "mlk": return b(dove(12, 12, 0.9, "#fff"));
      default: return null;
    }
  }

  // Faint wallpaper pattern for the page background
  function patternSVG(id) {
    const t = (body) => SVG(160, 160, '<g opacity=".07">' + body + "</g>");
    switch (id) {
      case "christmas": return t(snowflake(30, 30, 11, "#2a5c8a", 1.6) + snowflake(110, 95, 8, "#2a5c8a", 1.4) + '<polygon points="' + starPts(120, 25, 6, 2.6) + '" fill="#b8860b"/>' + snowflake(45, 125, 6, "#2a5c8a"));
      case "easter": return t(flower(30, 30, 6, "#9b6fd1", "#d4a017") + cross(115, 100, 14, "#7a5c2e") + flower(60, 130, 4, "#e05d8c", "#d4a017"));
      case "independence": case "flag": return t('<polygon points="' + starPts(30, 30, 11, 4.5) + '" fill="#3c3b6e"/><polygon points="' + starPts(115, 100, 8, 3.3) + '" fill="#b22234"/><polygon points="' + starPts(50, 130, 5, 2) + '" fill="#3c3b6e"/>');
      case "thanksgiving": return t(leafPath(30, 30, 13, 20, "#b8361f") + leafPath(115, 95, 11, -30, "#c98a1b") + leafPath(55, 130, 8, 70, "#8a4b16"));
      case "valentine": return t('<path d="' + heartPath(30, 30, 10) + '" fill="#c2185b"/><path d="' + heartPath(115, 100, 7) + '" fill="#c2185b"/>');
      case "stpatrick": return t(shamrock(30, 30, 11, "#1f7a38") + shamrock(115, 100, 8, "#1f7a38"));
      case "newyear": return t('<polygon points="' + starPts(30, 30, 11, 3, 4) + '" fill="#8a6d1d"/><polygon points="' + starPts(115, 100, 7, 2, 4) + '" fill="#1c2541"/>');
      case "halloween": return t(pumpkin(30, 30, 2) + candyCorn(115, 100, 1.8) + leafPath(55, 130, 9, 30, "#6a3d9a"));
      case "mothers": return t(flower(30, 30, 6, "#9c3d6e", "#d4a017") + flower(115, 100, 4.5, "#9c3d6e", "#d4a017"));
      case "presidents": return t('<polygon points="' + starPts(30, 30, 10, 4) + '" fill="#233a6b"/><polygon points="' + starPts(115, 100, 7, 2.8) + '" fill="#233a6b"/>');
      case "labor": return t(gear(30, 30, 8, "#2f5d8a") + gear(115, 100, 6, "#2f5d8a"));
      case "fathers": return t('<path d="M27 15h8l-2 6 4 15-6 6-6-6 4-15z" fill="#2f4f6f"/><path d="M110 92h8l-2 5 3 11-5 5-5-5 3-11z" fill="#2f4f6f"/>');
      default: return null;
    }
  }

  // Silhouette strip across the top of the footer
  function footerArt(id) {
    const W = 1600, H = 70, rnd = seeded(id.length * 97 + 3);
    let s = "";
    const ground = (c) => '<path d="M0 70V58Q200 46 400 56T800 54T1200 56T1600 52V70Z" fill="' + c + '"/>';
    switch (id) {
      case "christmas": {
        for (let i = 0; i < 16; i++) {
          const x = i * 104 + rnd() * 30, w = 46 + rnd() * 30, h = 22 + rnd() * 16, y = 60 - h;
          s += '<rect x="' + x.toFixed(0) + '" y="' + y.toFixed(0) + '" width="' + w.toFixed(0) + '" height="' + h.toFixed(0) + '" fill="#0d2416"/><path d="M' + (x - 5).toFixed(0) + " " + y.toFixed(0) + "L" + (x + w / 2).toFixed(0) + " " + (y - 16).toFixed(0) + "L" + (x + w + 5).toFixed(0) + " " + y.toFixed(0) + 'Z" fill="#0d2416"/><path d="M' + (x - 5).toFixed(0) + " " + y.toFixed(0) + "L" + (x + w / 2).toFixed(0) + " " + (y - 16).toFixed(0) + "L" + (x + w + 5).toFixed(0) + " " + y.toFixed(0) + '" stroke="#f4f8ff" stroke-width="3" fill="none"/>';
          s += '<rect x="' + (x + 8).toFixed(0) + '" y="' + (y + 6).toFixed(0) + '" width="7" height="7" fill="#ffd27a"/><rect x="' + (x + w - 15).toFixed(0) + '" y="' + (y + 6).toFixed(0) + '" width="7" height="7" fill="#ffd27a"/>';
          const tx = x + w + 26;
          s += '<path d="M' + tx.toFixed(0) + " 30l12 30h-24z" + '" fill="#0f2c1b"/><path d="M' + (tx - 6).toFixed(0) + " 40l6-10 6 10" + '" stroke="#f4f8ff" stroke-width="2.4" fill="none"/>';
        }
        s += ground("#f4f8ff");
        s += '<polygon points="' + starPts(800, 12, 9, 3, 4) + '" fill="#fff3b0"/>';
        return SVG(W, H, s);
      }
      case "easter": case "goodfriday": {
        s += '<path d="M0 70V50Q300 30 560 44T1000 40T1600 46V70Z" fill="' + (id === "easter" ? "#1d4a2b" : "#1c1626") + '"/>';
        s += cross(760, 22, 16, "#0b1d10".replace("0b1d10", id === "easter" ? "0b1d10" : "000")) + cross(800, 14, 22, id === "easter" ? "#0b1d10" : "#000") + cross(840, 22, 16, id === "easter" ? "#0b1d10" : "#000");
        if (id === "easter") for (let i = 0; i < 70; i++) { const x = rnd() * 1600, y = 52 + rnd() * 14; s += flower(x.toFixed(0), y.toFixed(0), 2.6, ["#fff", "#f7b8cf", "#c9a6ef", "#f7d14a"][i % 4], "#f4c542"); }
        return SVG(W, H, s);
      }
      case "independence": case "flag": case "presidents": case "memorial": case "veterans": {
        for (let i = 0; i < 26; i++) { const x = 30 + i * 62; s += '<path d="M' + x + ' 64V22" stroke="#c9d3da" stroke-width="1.6"/>' + flagMini(x + 1, 22, 26); }
        if (id === "independence") for (let i = 0; i < 10; i++) { const x = 80 + rnd() * 1440, y = 8 + rnd() * 6; s += '<polygon points="' + starPts(x.toFixed(0), y.toFixed(0), 4, 1.6) + '" fill="' + ["#fff", "#ff8a80", "#90caf9"][i % 3] + '"/>'; }
        return SVG(W, H, s + ground("#0d2416"));
      }
      case "patriot": {
        s += '<path d="M770 70L760 0h12zM828 70L838 0h-12z" fill="#7fb2ff" opacity=".22"/>';
        let x = 0; while (x < 1600) { const w = 30 + rnd() * 40, h = 18 + rnd() * 34; s += '<rect x="' + x.toFixed(0) + '" y="' + (70 - h).toFixed(0) + '" width="' + w.toFixed(0) + '" height="' + h.toFixed(0) + '" fill="#0a1a10"/>'; x += w + 2; }
        return SVG(W, H, s);
      }
      case "thanksgiving": case "fall": case "halloween": {
        s += '<path d="M0 50H1600" stroke="#6b4423" stroke-width="3"/><path d="M0 40H1600" stroke="#6b4423" stroke-width="3"/>';
        for (let x = 20; x < 1600; x += 120) s += '<rect x="' + x + '" y="32" width="6" height="34" fill="#5a3a1a"/>';
        for (let i = 0; i < 22; i++) { const x = 20 + i * 74 + rnd() * 20; s += pumpkin(x.toFixed(0), (60 - rnd() * 3).toFixed(0), 1.3 + rnd() * 0.9); if (i % 4 === 1) s += '<rect x="' + (x + 18).toFixed(0) + '" y="48" width="34" height="18" rx="3" fill="#d9b25b"/><path d="M' + (x + 18).toFixed(0) + " 54h34M" + (x + 18).toFixed(0) + ' 60h34" stroke="#b58d3a"/>'; }
        return SVG(W, H, s + ground("#0d2416"));
      }
      case "valentine": case "mothers": case "spring": case "stpatrick": case "newyear": case "winter": case "summer": case "fathers": case "labor": case "mlk": {
        for (let i = 0; i < 40; i++) {
          const x = 20 + i * 40 + rnd() * 10, y = 54 + rnd() * 8;
          if (id === "valentine") s += '<path d="' + heartPath(x, y - 4, 5 + rnd() * 3) + '" fill="' + ["#e91e63", "#f48fb1", "#ff80ab"][i % 3] + '"/>';
          else if (id === "stpatrick") s += shamrock(x, y - 4, 7, ["#2e9e4a", "#43c463"][i % 2]);
          else if (id === "newyear") s += '<polygon points="' + starPts(x, y - 10 - rnd() * 30, 3 + rnd() * 3, 1.2, 4) + '" fill="' + ["#f3d36b", "#e6e9ef"][i % 2] + '"/>';
          else if (id === "winter") s += snowflake(x, y - 6 - rnd() * 30, 4 + rnd() * 4, "#dfefff");
          else if (id === "summer") s += '<path d="M' + x + " 66q2-14-6-24M" + x + " 66q3-12 12-18" + '" stroke="#5aa04f" stroke-width="2" fill="none"/>';
          else if (id === "labor") s += i % 3 === 0 ? gear(x, y - 6, 5, "#f2b632") : "";
          else if (id === "mlk") s += i % 6 === 0 ? dove(x, y - 20 - rnd() * 20, 0.8, "#e6edf7") : "";
          else if (id === "fathers") s += i % 5 === 0 ? '<path d="M' + x + ' 66l14-30" stroke="#c9a061" stroke-width="2"/>' : "";
          else s += flower(x, y, 3.2, (id === "mothers" ? ["#e88aa8", "#c48ad8"] : ["#ffd1e1", "#fff"])[i % 2], "#f7c948");
        }
        if (id === "summer") s += '<circle cx="1480" cy="22" r="14" fill="#ffd54f" opacity=".85"/>';
        return SVG(W, H, s + ground(id === "winter" ? "#eaf4ff" : "#0d2416"));
      }
      default: return null;
    }
  }

  function tryDraw(fn, id) { try { return fn(id); } catch (e) { if (window.console) console.warn("Holiday decoration skipped:", e); return null; } }
  function seeded(seed) { let a = seed >>> 0; return function () { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

  /* ---------- 6. Theme details: colors, greeting, Bible verse, effects ---------- */
  // head = card header color, btn = button color (both keep white text readable)
  const THEMES = {
    newyear:     { head: "#1c2541", head2: "#3a4a7a", btn: "#1c2541", accent: "#d4af37", top: "linear-gradient(90deg,#d4af37,#e6e9ef,#d4af37,#1c2541)", fx: ["confetti", 40],
      greet: "Happy New Year!", line: (c) => "Welcome to " + c.year + "! Thank you for learning with us.", verse: "His compassions fail not. They are new every morning: great is thy faithfulness.", ref: "Lamentations 3:22–23" },
    mlk:         { head: "#3a4a6b", head2: "#56688f", btn: "#3a4a6b", accent: "#d9b44a", top: "linear-gradient(90deg,#3a4a6b,#d9b44a,#3a4a6b)", fx: null,
      greet: "Martin Luther King Jr. Day", line: () => "Remembering Dr. King and his call for justice, peace, and equal dignity for every person God made.", verse: "What doth the LORD require of thee, but to do justly, and to love mercy, and to walk humbly with thy God?", ref: "Micah 6:8" },
    valentine:   { head: "#a51d4a", head2: "#c2185b", btn: "#b0204f", accent: "#ff80ab", top: "linear-gradient(90deg,#f48fb1,#c2185b,#ff80ab,#c2185b)", fx: ["hearts", 22],
      greet: "Happy Valentine's Day!", line: () => "The greatest love of all is God's love for us.", verse: "We love him, because he first loved us.", ref: "1 John 4:19" },
    presidents:  { head: "#233a6b", head2: "#36518f", btn: "#b22234", accent: "#d4af37", top: "linear-gradient(90deg,#b22234 0 33%,#fff 33% 66%,#233a6b 66%)", fx: ["stars", 14],
      greet: "Happy Presidents' Day!", line: () => "Honoring the leaders who have served our nation, and praying for those who lead it today.", verse: "I exhort therefore, that… prayers… be made… for kings, and for all that are in authority.", ref: "1 Timothy 2:1–2" },
    stpatrick:   { head: "#1b6b35", head2: "#2a8a47", btn: "#1b6b35", accent: "#e3b83c", top: "linear-gradient(90deg,#1b6b35,#43c463,#e3b83c,#1b6b35)", fx: ["shamrocks", 20],
      greet: "Happy St. Patrick's Day!", line: () => "Patrick was a missionary to Ireland. Tradition says he used the three-leaf shamrock to teach about the Trinity.", verse: "Go ye therefore, and teach all nations, baptizing them in the name of the Father, and of the Son, and of the Holy Ghost.", ref: "Matthew 28:19" },
    goodfriday:  { head: "#3e2c52", head2: "#5a4373", btn: "#3e2c52", accent: "#b9a3d0", top: "linear-gradient(90deg,#2a1f38,#5a4373,#2a1f38)", fx: null,
      greet: "Good Friday", line: () => "Remembering the day Jesus gave His life on the cross for us.", verse: "But he was wounded for our transgressions, he was bruised for our iniquities… and with his stripes we are healed.", ref: "Isaiah 53:5" },
    easter:      { head: "#5b4590", head2: "#7a5bb3", btn: "#5b4590", accent: "#f4c542", top: "linear-gradient(90deg,#f7d14a,#c9a6ef,#f7b8cf,#9ed99a,#f7d14a)", fx: ["petals", 24],
      greet: (c) => c.beforeDay ? "Hosanna! It's Holy Week" : "He Is Risen!", line: (c) => c.beforeDay ? "Easter Sunday is coming. Remember what Jesus did for us this week." : "Happy Easter! Jesus Christ is alive!", verse: (c) => c.beforeDay ? "Hosanna to the Son of David: Blessed is he that cometh in the name of the Lord." : "He is not here: for he is risen, as he said.", ref: (c) => c.beforeDay ? "Matthew 21:9" : "Matthew 28:6" },
    mothers:     { head: "#8c3563", head2: "#a8497b", btn: "#8c3563", accent: "#f4b6c8", top: "linear-gradient(90deg,#f4b6c8,#c48ad8,#e88aa8,#f4b6c8)", fx: ["petals", 20],
      greet: "Happy Mother's Day!", line: () => "Thank you, moms, for your love, your prayers, and everything you do!", verse: "Her children arise up, and call her blessed.", ref: "Proverbs 31:28" },
    memorial:    { head: "#2b3a55", head2: "#3d4f70", btn: "#2b3a55", accent: "#b22234", top: "linear-gradient(90deg,#3c3b6e,#fff,#b22234)", fx: null,
      greet: "Memorial Day", line: () => "Honoring the men and women who gave their lives while serving our country.", verse: "Greater love hath no man than this, that a man lay down his life for his friends.", ref: "John 15:13" },
    flag:        { head: "#233a6b", head2: "#36518f", btn: "#b22234", accent: "#d4af37", top: "linear-gradient(90deg,#b22234 0 33%,#fff 33% 66%,#233a6b 66%)", fx: ["stars", 14],
      greet: "Happy Flag Day!", line: () => "Celebrating the Stars and Stripes: 50 stars for 50 states, 13 stripes for the first 13 colonies.", verse: "In the name of our God we will set up our banners.", ref: "Psalm 20:5" },
    fathers:     { head: "#2f4f6f", head2: "#44698f", btn: "#2f4f6f", accent: "#c9a061", top: "linear-gradient(90deg,#2f4f6f,#c9a061,#2f4f6f)", fx: null,
      greet: "Happy Father's Day!", line: () => "Thank you, dads, for leading, loving, and working hard for your families!", verse: "The just man walketh in his integrity: his children are blessed after him.", ref: "Proverbs 20:7" },
    independence:{ head: "#1f3a6e", head2: "#2c4f91", btn: "#b22234", accent: "#d4af37", top: "linear-gradient(90deg,#b22234 0 33%,#fff 33% 66%,#1f3a6e 66%)", fx: ["sparkles", 30],
      greet: "Happy Independence Day!", line: (c) => "Celebrating " + c.america + " years of American freedom (1776–" + c.y + ").", verse: "Blessed is the nation whose God is the LORD.", ref: "Psalm 33:12" },
    labor:       { head: "#2f5d8a", head2: "#3f74a8", btn: "#2f5d8a", accent: "#f2b632", top: "linear-gradient(90deg,#2f5d8a,#f2b632,#2f5d8a)", fx: null,
      greet: "Happy Labor Day!", line: () => "Thank you to every hard worker who keeps our communities running.", verse: "And whatsoever ye do, do it heartily, as to the Lord.", ref: "Colossians 3:23" },
    patriot:     { head: "#2d3440", head2: "#424b5a", btn: "#2d3440", accent: "#7fb2ff", top: "linear-gradient(90deg,#2d3440,#b22234,#2d3440)", fx: null,
      greet: "Patriot Day: We Remember", line: () => "Remembering the lives lost on September 11, 2001, and honoring the heroes who helped.", verse: "God is our refuge and strength, a very present help in trouble.", ref: "Psalm 46:1" },
    halloween:   { head: "#5c3488", head2: "#74449f", btn: "#a84b00", accent: "#f7b733", top: "linear-gradient(90deg,#f08c2a,#7b3fa0,#f7b733,#7b3fa0,#f08c2a)", fx: ["candy", 24],
      greet: "Happy Fall Festival!", line: () => "Pumpkins, candy, and crisp autumn days. Enjoy the season God made!", verse: "This is the day which the LORD hath made; we will rejoice and be glad in it.", ref: "Psalm 118:24" },
    veterans:    { head: "#22396b", head2: "#30508f", btn: "#22396b", accent: "#b22234", top: "linear-gradient(90deg,#b22234 0 33%,#fff 33% 66%,#22396b 66%)", fx: null,
      greet: "Thank You, Veterans!", line: () => "Honoring everyone who has served in our nation's armed forces.", verse: "Also I heard the voice of the Lord, saying, Whom shall I send…? Then said I, Here am I; send me.", ref: "Isaiah 6:8" },
    thanksgiving:{ head: "#7f4413", head2: "#9a5519", btn: "#a8470f", accent: "#e8a531", top: "linear-gradient(90deg,#b8361f,#e8a531,#d9622b,#8a4b16)", fx: ["leaves", 30],
      greet: "Give Thanks!", line: () => "Happy Thanksgiving! Thank God for every blessing He has given.", verse: "O give thanks unto the LORD; for he is good: for his mercy endureth for ever.", ref: "Psalm 107:1" },
    christmas:   { head: "#14532d", head2: "#1d6b3c", btn: "#b3202a", accent: "#d4af37", top: "linear-gradient(90deg,#b3202a,#d4af37,#1d6b3c,#d4af37,#b3202a)", fx: ["snow", 60], snowcap: true,
      greet: "Merry Christmas!", line: (c) => "Celebrating the birth of Jesus Christ, our Savior.", verse: "For unto you is born this day in the city of David a Saviour, which is Christ the Lord.", ref: "Luke 2:11" },
    spring:      { season: true, accent: "#f4a6c0", top: "linear-gradient(90deg,#9ed99a,#ffd1e1,#fff3b0,#9ed99a)", fx: ["petals", 9] },
    summer:      { season: true, accent: "#3fa7d6", top: "linear-gradient(90deg,#3fa7d6,#ffd54f,#3fa7d6)", fx: ["fireflies", 10] },
    fall:        { season: true, accent: "#d9622b", top: "linear-gradient(90deg,#d9622b,#e8a531,#b8361f)", fx: ["leaves", 10] },
    winter:      { season: true, accent: "#8fc3ee", top: "linear-gradient(90deg,#b5d6f2,#ffffff,#8fc3ee)", fx: ["snow", 18], snowcap: true }
  };
  const COUNTDOWN = { christmas: "Christmas", easter: "Easter", thanksgiving: "Thanksgiving", independence: "the Fourth of July", newyear: "New Year's Day", valentine: "Valentine's Day", mothers: "Mother's Day", fathers: "Father's Day", stpatrick: "St. Patrick's Day", presidents: "Presidents' Day", labor: "Labor Day", halloween: "the Fall Festival" };

  /* ---------- 7. Falling things (one light canvas) ---------- */
  const PALETTES = {
    hearts: ["#e91e63", "#f48fb1", "#ff80ab", "#d81b60", "#fff"], shamrocks: ["#2e9e4a", "#43c463", "#1f7a38"],
    petals: ["#ffd1e1", "#ffffff", "#f7b8cf", "#e9d8ff", "#fff3b0"], leaves: ["#d9622b", "#e8a531", "#b8361f", "#c98a1b", "#8a4b16"],
    confetti: ["#d4af37", "#e6e9ef", "#f3d36b", "#7fa7ff", "#ff8a80"], stars: ["#ffffff", "#d4af37", "#ff8a80", "#90caf9"],
    sparkles: ["#ffffff", "#ff5a5a", "#6fa8ff", "#ffd54f"], candy: ["#e07a1f", "#f7b733", "#7b3fa0", "#d9622b"], fireflies: ["#fff59d"], snow: ["#ffffff"]
  };
  function Particles(canvas, kind, count, opts) {
    opts = opts || {};
    const ctx = canvas.getContext("2d");
    const cols = opts.colors || PALETTES[kind] || ["#fff"];
    let W = 0, H = 0, dpr = 1, raf = 0, last = 0, t0 = 0;
    const ps = [];
    function size() {
      const r = canvas.getBoundingClientRect();
      dpr = Math.min(1.5, window.devicePixelRatio || 1);
      W = r.width; H = r.height;
      canvas.width = Math.max(1, Math.round(W * dpr)); canvas.height = Math.max(1, Math.round(H * dpr));
    }
    function spawn(p, anywhere) {
      p.x = Math.random() * W;
      p.y = anywhere ? Math.random() * H : -20 - Math.random() * 40;
      p.c = cols[(Math.random() * cols.length) | 0];
      p.ph = Math.random() * 6.28; p.rot = Math.random() * 6.28; p.vr = (Math.random() - 0.5) * 2;
      const big = opts.scale || 1;
      switch (kind) {
        case "snow": p.s = (1.2 + Math.random() * 2.8) * big; p.vy = (18 + p.s * 9) * (opts.speed || 1); p.sw = 12 + Math.random() * 18; p.a = 0.55 + Math.random() * 0.4; break;
        case "fireflies": p.s = 1.6 + Math.random() * 1.6; p.vy = -4 - Math.random() * 6; p.sw = 30; p.a = 0; if (!anywhere) p.y = H + 10; break;
        case "sparkles": case "stars": p.s = (3 + Math.random() * 3.5) * big; p.vy = 14 + Math.random() * 16; p.sw = 10; p.a = 0.75; break;
        case "confetti": p.s = (4 + Math.random() * 3) * big; p.vy = 34 + Math.random() * 30; p.sw = 26; p.a = 0.9; break;
        default: p.s = (6 + Math.random() * 6) * big; p.vy = 26 + Math.random() * 26; p.sw = 30 + Math.random() * 30; p.a = 0.85;
      }
      if (kind === "candy") p.k = Math.random() < 0.45 ? "corn" : "leaf";
      return p;
    }
    function drawOne(p, t) {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.globalAlpha = p.a;
      ctx.fillStyle = p.c;
      const s = p.s;
      switch (kind) {
        case "snow": ctx.beginPath(); ctx.arc(0, 0, s, 0, 6.283); ctx.fill(); break;
        case "fireflies": {
          const g = ctx.createRadialGradient(0, 0, 0, 0, 0, s * 4); g.addColorStop(0, "rgba(255,245,157,.95)"); g.addColorStop(1, "rgba(255,245,157,0)");
          ctx.globalAlpha = 0.25 + 0.6 * Math.abs(Math.sin(t * 1.3 + p.ph)); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, s * 4, 0, 6.283); ctx.fill(); break;
        }
        case "hearts":
          ctx.rotate(Math.sin(t + p.ph) * 0.4); ctx.beginPath(); ctx.moveTo(0, s * 0.6);
          ctx.bezierCurveTo(-s * 1.1, -s * 0.1, -s * 0.55, -s * 0.95, 0, -s * 0.3); ctx.bezierCurveTo(s * 0.55, -s * 0.95, s * 1.1, -s * 0.1, 0, s * 0.6); ctx.fill(); break;
        case "shamrocks":
          ctx.rotate(p.rot); for (let i = 0; i < 3; i++) { ctx.rotate(2.094); ctx.beginPath(); ctx.arc(0, -s * 0.45, s * 0.42, 0, 6.283); ctx.fill(); }
          ctx.fillRect(-s * 0.06, 0, s * 0.12, s * 0.8); break;
        case "petals":
          ctx.rotate(p.rot); ctx.scale(1, 0.35 + 0.65 * Math.abs(Math.cos(t * 2 + p.ph))); ctx.beginPath(); ctx.ellipse(0, 0, s * 0.55, s * 0.32, 0, 0, 6.283); ctx.fill(); break;
        case "confetti":
          ctx.rotate(p.rot); ctx.scale(1, Math.cos(t * 4 + p.ph)); ctx.fillRect(-s / 2, -s / 4, s, s / 2); break;
        case "stars": case "sparkles": {
          ctx.rotate(p.rot); ctx.globalAlpha = 0.35 + 0.6 * Math.abs(Math.sin(t * 2 + p.ph)); ctx.beginPath();
          const n = kind === "stars" ? 5 : 4, inner = kind === "stars" ? 0.45 : 0.28;
          for (let i = 0; i < n * 2; i++) { const a = -1.5708 + i * Math.PI / n, r = i % 2 ? s * inner : s; ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r); }
          ctx.closePath(); ctx.fill(); break;
        }
        case "leaves": case "candy":
          ctx.rotate(p.rot); ctx.scale(0.4 + 0.6 * Math.abs(Math.cos(t * 1.6 + p.ph)), 1);
          if (p.k === "corn") {
            ctx.beginPath(); ctx.moveTo(-s * 0.45, s * 0.45); ctx.lineTo(0, -s * 0.6); ctx.lineTo(s * 0.45, s * 0.45); ctx.closePath(); ctx.fillStyle = "#f6f1e1"; ctx.fill();
            ctx.beginPath(); ctx.moveTo(-s * 0.36, s * 0.22); ctx.lineTo(s * 0.36, s * 0.22); ctx.lineTo(s * 0.45, s * 0.45); ctx.lineTo(-s * 0.45, s * 0.45); ctx.closePath(); ctx.fillStyle = "#f08c2a"; ctx.fill();
            ctx.beginPath(); ctx.moveTo(-s * 0.2, -s * 0.13); ctx.lineTo(s * 0.2, -s * 0.13); ctx.lineTo(s * 0.36, s * 0.22); ctx.lineTo(-s * 0.36, s * 0.22); ctx.closePath(); ctx.fillStyle = "#f7c331"; ctx.fill();
          } else {
            ctx.beginPath(); const r = s * 0.6;
            for (let i = 0; i < 10; i++) { const a = -1.5708 + i * 0.6283, rr = i % 2 ? r * 0.5 : r; ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); }
            ctx.closePath(); ctx.fill(); ctx.strokeStyle = "rgba(80,40,10,.45)"; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(0, -r * 0.8); ctx.lineTo(0, r * 1.2); ctx.stroke();
          }
          break;
      }
      ctx.restore();
    }
    function frame(now) {
      raf = requestAnimationFrame(frame);
      if (document.hidden) { last = now; return; }
      if (now - last < 32) return;               // about 30 frames a second is plenty
      const dt = Math.min(0.06, (now - last) / 1000 || 0.03); last = now;
      const t = (now - t0) / 1000;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);
      for (const p of ps) {
        p.y += p.vy * dt;
        p.x += Math.sin(t * 0.9 + p.ph) * p.sw * dt;
        p.rot += p.vr * dt;
        if (kind === "fireflies") { p.a = 1; if (p.y < -20) spawn(p, false); }
        else if (p.y > H + 24) spawn(p, false);
        if (p.x < -30) p.x = W + 20; else if (p.x > W + 30) p.x = -20;
        drawOne(p, t);
      }
    }
    size();
    for (let i = 0; i < count; i++) ps.push(spawn({}, true));
    const onResize = () => size();
    window.addEventListener("resize", onResize);
    return {
      start() { if (!raf) { last = performance.now(); t0 = t0 || last; raf = requestAnimationFrame(frame); } },
      stop() { cancelAnimationFrame(raf); raf = 0; },
      destroy() { cancelAnimationFrame(raf); raf = 0; window.removeEventListener("resize", onResize); ctx.clearRect(0, 0, canvas.width, canvas.height); }
    };
  }

  /* ---------- 8. Putting the decorations on the page ---------- */
  const reduceMotion = window.matchMedia ? window.matchMedia("(prefers-reduced-motion: reduce)") : { matches: false };
  const lowPower = (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 2) || (navigator.deviceMemory && navigator.deviceMemory <= 2);
  let current = null;          // what is showing now
  let fx = null;               // the falling-things canvas
  const added = [];            // elements to remove when the theme changes

  function visitor() { return readJSON(localStorage, VISITOR_KEY) || {}; }
  function setVisitor(v) { writeJSON(localStorage, VISITOR_KEY, v); }
  function motionOK(s) { return s.animations && !reduceMotion.matches && !visitor().still; }

  function el(tag, cls, html) { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
  function add(e, where, how) { if (!where) return null; where[how || "appendChild"](e); added.push(e); return e; }
  function esc(s) { return String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c])); }
  const val = (v, c) => (typeof v === "function" ? v(c) : v);

  function context(r) {
    const today = r.date, t = ymd(today), h = BY_ID[r.id], range = r.range;
    const c = { today, y: t.y, year: t.m === 12 ? t.y + 1 : t.y, america: t.y - 1776, name: h ? h.name : "", beforeDay: false, daysTo: 0 };
    if (range) { c.beforeDay = today < range.day; c.daysTo = range.day - today; c.dayYear = ymd(range.day).y; c.america = ymd(range.day).y - 1776; }
    return c;
  }

  function loadCSS() {
    if (document.getElementById("hol-css")) return;
    const l = document.createElement("link");
    l.id = "hol-css"; l.rel = "stylesheet"; l.href = ROOT + "css/holidays.css?v=1";
    document.head.appendChild(l);
  }

  function clear() {
    if (fx) { fx.destroy(); fx = null; }
    while (added.length) { const e = added.pop(); if (e.parentNode) e.parentNode.removeChild(e); }
    const root = document.documentElement;
    root.classList.remove("hol-on", "hol-still", "hol-season", "hol-solemn", "hol-major", "hol-snowcap");
    root.removeAttribute("data-holiday");
    ["--hol-head", "--hol-head2", "--hol-btn", "--hol-accent", "--hol-top", "--hol-badge", "--hol-pattern", "--hol-cap"].forEach((p) => root.style.removeProperty(p));
    current = null;
  }

  function apply(r) {
    clear();
    loadCSS();
    r = r || resolve();
    const s = r.settings, v = visitor(), root = document.documentElement;
    current = r;
    if (!r.id) return r;
    if (v.off && r.source !== "preview") { addRestore(r, v); return r; }

    const id = r.id, th = THEMES[id], h = BY_ID[id], c = context(r);
    const still = !motionOK(s);
    root.classList.add("hol-on");
    root.setAttribute("data-holiday", id);
    if (th.season) root.classList.add("hol-season");
    if (h.kind === "solemn") root.classList.add("hol-solemn");
    if (h.kind === "major") root.classList.add("hol-major");
    if (still || h.kind === "solemn") root.classList.add("hol-still");
    if (th.snowcap) root.classList.add("hol-snowcap");
    if (th.head) { root.style.setProperty("--hol-head", th.head); root.style.setProperty("--hol-head2", th.head2); root.style.setProperty("--hol-btn", th.btn); }
    root.style.setProperty("--hol-accent", th.accent);
    root.style.setProperty("--hol-top", th.top);
    const badge = tryDraw(badgeSVG, id); if (badge && !th.season) root.style.setProperty("--hol-badge", svgURL(badge));
    const pat = tryDraw(patternSVG, id); if (pat) root.style.setProperty("--hol-pattern", svgURL(pat));
    if (th.snowcap) root.style.setProperty("--hol-cap", svgURL(SVG(60, 12, '<path d="M0 0H60V5Q55 11 50 6T38 8 26 5 14 9 4 6 0 7Z" fill="#fff"/><path d="M0 5Q4 8 8 6" stroke="#dfeaf6" fill="none"/>')));

    // Header: lights / bunting / vine along the bottom edge
    const header = document.querySelector(".site-header");
    const tiles = tryDraw(trimTiles, id);
    if (header && tiles) {
      const trim = el("div", "hol-trim");
      trim.setAttribute("aria-hidden", "true");
      trim.style.height = tiles.h + "px";
      const a = el("span", "hol-trim-base"); a.style.backgroundImage = svgURL(tiles.base); trim.appendChild(a);
      if (tiles.blink) { const b = el("span", "hol-trim-blink hol-anim"); b.style.backgroundImage = svgURL(tiles.blink); trim.appendChild(b); }
      add(trim, header);
    }
    // Little hat or pin on Mr. Watford's picture in the header
    const brand = header && header.querySelector(".brand");
    const hats = {
      christmas: '<svg viewBox="0 0 40 34"><path d="M4 26C8 10 22 2 34 8l-4 6C24 10 16 16 14 26Z" fill="#c62828"/><path d="M2 24c8-3 16-3 24 1v6c-8-4-16-4-24-1Z" fill="#fff"/><circle cx="33" cy="9" r="5" fill="#fff"/></svg>',
      independence: '<svg viewBox="0 0 40 34"><path d="M8 32V4" stroke="#8a6d3b" stroke-width="2"/>' + flagMini(9, 4, 26) + "</svg>",
      flag: '<svg viewBox="0 0 40 34"><path d="M8 32V4" stroke="#8a6d3b" stroke-width="2"/>' + flagMini(9, 4, 26) + "</svg>",
      valentine: '<svg viewBox="0 0 40 34"><path d="' + heartPath(20, 16, 12) + '" fill="#e91e63"/></svg>',
      stpatrick: '<svg viewBox="0 0 40 34">' + shamrock(20, 14, 13, "#2e9e4a") + "</svg>",
      easter: '<svg viewBox="0 0 40 34">' + flower(20, 16, 6.5, "#c9a6ef", "#f4c542") + "</svg>",
      thanksgiving: '<svg viewBox="0 0 40 34">' + leafPath(20, 17, 15, 20, "#d9622b") + "</svg>",
      newyear: '<svg viewBox="0 0 40 34"><path d="M10 30L20 2 30 30Z" fill="#1c2541"/><path d="M14 20l12-4M12 26l16-5" stroke="#d4af37" stroke-width="2.5"/><circle cx="20" cy="3" r="3.5" fill="#d4af37"/></svg>',
      halloween: '<svg viewBox="0 0 40 34">' + pumpkin(20, 18, 2) + "</svg>"
    };
    if (brand && hats[id]) {
      brand.classList.add("hol-brand");
      const hat = add(el("span", "hol-hat hol-hat-" + id, hats[id]), brand);
      if (hat) hat.setAttribute("aria-hidden", "true");
    }

    // Greeting ribbon under the header (holidays only, not plain seasons)
    if (!th.season) {
      const chip = (h.kind !== "solemn" && c.daysTo > 0 && COUNTDOWN[id]) ? '<span class="hol-chip">' + (c.daysTo === 1 ? "1 day" : c.daysTo + " days") + " until " + COUNTDOWN[id] + "</span>" : "";
      const isHome = !!document.querySelector(".home-stage");
      const sceneLink = isHome ? '<a class="hol-btn hol-btn-scene" href="#holiday-scene">' + (h.kind === "major" ? "See the holiday scene ↓" : "See the banner ↓") + "</a>" : "";
      const pv = r.source === "preview" ? '<span class="hol-preview">Preview: ' + esc(h.name) + (r.preview && r.preview.date ? " on " + esc(fmt(r.date, { month: "short", day: "numeric", year: "numeric" })) : "") + ' <button type="button" class="hol-btn" data-hol="endpreview">End preview</button></span>' : "";
      const ribbon = el("div", "hol-ribbon",
        '<div class="container hol-ribbon-in">' +
          '<span class="hol-ribbon-ic" aria-hidden="true">' + (badge || "") + "</span>" +
          '<p class="hol-ribbon-text"><strong>' + esc(val(th.greet, c)) + "</strong> <span>" + esc(val(th.line, c)) + "</span>" +
          '<em class="hol-verse">“' + esc(val(th.verse, c)) + "” <b>" + esc(val(th.ref, c)) + "</b></em></p>" +
          '<span class="hol-ribbon-tools">' + chip + sceneLink + pv +
            (h.kind !== "solemn" && s.animations && !reduceMotion.matches ? '<button type="button" class="hol-btn" data-hol="still">' + (v.still ? "Play animations" : "Pause animations") + "</button>" : "") +
            '<button type="button" class="hol-btn" data-hol="hide">Hide decorations</button>' +
          "</span>" +
        "</div>");
      ribbon.setAttribute("role", "region");
      ribbon.setAttribute("aria-label", "Holiday greeting");
      if (header) add(ribbon, header, "after"); else add(ribbon, document.body, "prepend");
    }

    // Swag garland across the classroom wall and the top of each page "hero"
    const gt = th.season ? null : (tryDraw(garlandTile, id) || (tiles ? { w: 96, h: tiles.h, svg: tiles.base } : null));
    if (gt) {
      document.querySelectorAll(".classroom, .scene-hero.wall").forEach((host) => {
        const g = el("div", "hol-garland");
        g.setAttribute("aria-hidden", "true");
        g.style.backgroundImage = svgURL(gt.svg);
        g.style.setProperty("--gw", gt.w + "px"); g.style.setProperty("--gh", gt.h + "px");
        add(g, host);
      });
    }
    // A wreath on the classroom clock at Christmas
    const clock = document.querySelector(".classroom .clock");
    if (clock && id === "christmas") {
      let wr = '<svg viewBox="0 0 140 140"><circle cx="70" cy="70" r="58" fill="none" stroke="#1f5e33" stroke-width="20"/><circle cx="70" cy="70" r="58" fill="none" stroke="#2f7d45" stroke-width="10" stroke-dasharray="4 7"/>';
      for (let i = 0; i < 12; i++) { const a = i * Math.PI / 6; wr += '<circle cx="' + (70 + Math.cos(a) * 58).toFixed(1) + '" cy="' + (70 + Math.sin(a) * 58).toFixed(1) + '" r="4.5" fill="' + (i % 2 ? "#e53935" : "#d4af37") + '"/>'; }
      wr += '<path d="M70 124l-16-10v20zM70 124l16-10v20z" fill="#c62828"/><circle cx="70" cy="124" r="5" fill="#e53935"/></svg>';
      const w = add(el("div", "hol-wreath", wr), clock.parentNode);
      if (w) w.setAttribute("aria-hidden", "true");
    }

    // Footer: a little silhouette scene along the top edge
    const footer = document.querySelector(".site-footer");
    const fa = tryDraw(footerArt, id);
    if (footer && fa) {
      const f = el("div", "hol-footer-art");
      f.setAttribute("aria-hidden", "true");
      f.style.backgroundImage = svgURL(fa);
      add(f, footer, "prepend");
    }
    addRestore(r, v);

    // Falling snow / leaves / hearts…
    if (th.fx && !still && h.kind !== "solemn") {
      const cv = el("canvas", "hol-fx");
      cv.setAttribute("aria-hidden", "true");
      add(cv, document.body);
      let n = th.fx[1];
      if (window.innerWidth < 700) n = Math.round(n * 0.55);
      if (lowPower) n = Math.round(n * 0.5);
      fx = Particles(cv, th.fx[0], n);
      fx.start();
    }

    // The big home-page scene (Christmas village, Easter garden, …) or a smaller banner
    const stage = document.querySelector(".home-stage");
    if (stage && !th.season) loadScenes(() => {
      if (current !== r || !window.HolidayScenes) return;
      let node = null;
      try { node = window.HolidayScenes.render(id, { ctx: c, theme: th, still: still || h.kind === "solemn", lowPower, verse: val(th.verse, c), ref: val(th.ref, c), greet: val(th.greet, c), line: val(th.line, c), Particles, helpers: HELPERS }); } catch (e) { if (window.console) console.warn("Holiday scene skipped:", e); }
      if (node) { node.id = "holiday-scene"; add(node, stage, "after"); }
    });
    return r;
  }

  // A small "Show holiday decorations" button in the footer after a visitor hides them
  function addRestore(r, v) {
    if (!v.off) return;
    const footer = document.querySelector(".site-footer");
    if (!footer) return;
    const b = el("div", "hol-restore", '<button type="button" class="hol-btn" data-hol="show">✨ Show holiday decorations</button>');
    add(b, footer);
  }

  let scenesState = 0; const scenesWaiting = [];
  function loadScenes(cb) {
    if (window.HolidayScenes) return cb();
    scenesWaiting.push(cb);
    if (scenesState) return;
    scenesState = 1;
    const sc = document.createElement("script");
    sc.src = ROOT + "js/holiday-scenes.js?v=1";
    sc.onload = () => { while (scenesWaiting.length) scenesWaiting.shift()(); };
    document.head.appendChild(sc);
  }

  // Buttons in the ribbon / footer
  document.addEventListener("click", (e) => {
    const b = e.target.closest && e.target.closest("[data-hol]");
    if (!b) return;
    const what = b.getAttribute("data-hol"), v = visitor();
    if (what === "hide") { v.off = true; setVisitor(v); }
    else if (what === "show") { v.off = false; setVisitor(v); }
    else if (what === "still") { v.still = !v.still; setVisitor(v); }
    else if (what === "endpreview") { writeJSON(sessionStorage, PREVIEW_KEY, null); if (/[?&]holiday/.test(location.search)) { location.href = location.pathname; return; } }
    else return;
    apply(resolve());
  });

  /* ---------- 9. Keep it fresh: check the date every minute ---------- */
  let lastKey = "";
  function keyOf(r) { return r.id + "|" + r.source + "|" + (r.range ? r.range.day : "") + "|" + r.date; }
  function tick() {
    const r = resolve();
    const k = keyOf(r);
    if (k !== lastKey) { lastKey = k; apply(r); }
  }
  // Other tabs (like the settings page) can change things
  window.addEventListener("storage", (e) => { if (e.key === DEVICE_KEY || e.key === VISITOR_KEY) { lastKey = ""; tick(); } });
  document.addEventListener("visibilitychange", () => { if (!document.hidden) tick(); });
  if (reduceMotion.addEventListener) reduceMotion.addEventListener("change", () => { lastKey = ""; tick(); });

  const HELPERS = { starPts, heartPath, shamrock, leafPath, flower, pumpkin, cross, gear, ornament, snowflake, flagMini, dove, candyCorn, seeded };

  /* ---------- 10. Tools for the settings page and testing ---------- */
  window.HolidayThemes = {
    HOLIDAYS, SEASONS, BY_ID, THEMES, DEFAULTS,
    dn, ymd, toISO, fmt, parseDate, easter, chicagoToday,
    settings, siteSettings, deviceSettings, mergeSettings,
    saveDevice(s) { writeJSON(localStorage, DEVICE_KEY, s); lastKey = ""; tick(); },
    setPreview(pv) { writeJSON(sessionStorage, PREVIEW_KEY, pv); lastKey = ""; tick(); },
    holidaysOn, seasonOn, resolve, calendar, holidayRange,
    current: () => current, refresh: () => { lastKey = ""; tick(); },
    Particles
  };

  const start = () => { tick(); setInterval(tick, 60000); };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start); else start();
})();
