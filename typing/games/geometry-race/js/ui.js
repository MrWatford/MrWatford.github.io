/* =========================================================
   Geometry Race — menus (level cards, How to Play, Customize,
   Settings). main.js decides which screen is showing; this file
   fills the screens in and wires up their buttons.
   ========================================================= */
(function () {
  "use strict";
  const GR = window.GR = window.GR || {};
  const Looks = GR.Looks, S = GR.Save;
  function $(id) { return document.getElementById(id); }
  function el(tag, attrs, kids) {
    const e = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(function (k) {
      if (k === "text") e.textContent = attrs[k];
      else if (k === "html") e.innerHTML = attrs[k];
      else if (k.startsWith("on")) e.addEventListener(k.slice(2), attrs[k]);
      else e.setAttribute(k, attrs[k]);
    });
    (kids || []).forEach(function (c) { if (c) e.appendChild(c); });
    return e;
  }
  function tokens(arr, runMask) {
    const t = el("span", { class: "tok", "aria-label": arr.filter(Boolean).length + " of 3 tokens" });
    for (let i = 0; i < 3; i++) t.appendChild(el("i", { class: arr[i] ? "on" : (runMask && (runMask >> i) & 1 ? "run" : "") }));
    return t;
  }
  function modesIn(def) {
    const set = [def.startMode || "cube"];
    def.objects.forEach(function (o) { if (o.t === "portal" && o.k === "mode" && set.indexOf(o.v) < 0) set.push(o.v); });
    return set;
  }

  // ---------- level select ----------
  // Two groups: the original six and the Beyond the Grid expansion (levels 7–12).
  let tab = "original", lastOnPlay = null;
  const previews = {};
  function setTab(t) { tab = t === "btg" ? "btg" : "original"; if (lastOnPlay) buildLevels(lastOnPlay); }
  function rewardText(def) {
    const r = def.reward; if (!r) return "";
    return r.name + (r.kind === "icon" ? " cube" : " trail") + (r.badge ? " + expansion badge" : "");
  }
  function rewardPreview(def) {
    const r = def.reward, c = el("canvas", { width: 64, height: 64, "aria-hidden": "true" });
    setTimeout(function () {
      const ctx = c.getContext("2d"), look = S.data.look;
      ctx.clearRect(0, 0, 64, 64);
      if (r.kind === "icon") {
        const i = Looks.ICONS.findIndex(function (ic) { return ic.name === r.name; });
        ctx.save(); ctx.translate(32, 32); Looks.drawIcon(ctx, { icon: Math.max(0, i), c1: look.c1, c2: look.c2 }, 40); ctx.restore();
      } else {
        // A little sample of the trail.
        const cols = r.name === "Bubbles" ? ["#bff6ff", "#7fe9ff"] : r.name === "Prismatic" ? ["#ff4fd8", "#ffe14d", "#2de2ff"] : ["#ffd23f", "#ff9a2e", "#ff4d1a"];
        for (let k = 0; k < 7; k++) {
          ctx.globalAlpha = 0.25 + k * 0.1;
          if (r.name === "Bubbles") { ctx.beginPath(); ctx.arc(8 + k * 7, 34 - Math.sin(k) * 8, 3 + k * 0.6, 0, 6.3); ctx.strokeStyle = cols[k % 2]; ctx.lineWidth = 2; ctx.stroke(); }
          else if (r.name === "Prismatic") cols.forEach(function (cc, j) { ctx.fillStyle = cc; ctx.fillRect(6 + k * 7, 26 + j * 5, 7, 3); });
          else { ctx.fillStyle = cols[k % 3]; ctx.fillRect(6 + k * 7, 32 - k, 7, 2 + k * 1.4); }
        }
        ctx.globalAlpha = 1;
        ctx.fillStyle = Looks.COLORS[look.c1].c; ctx.fillRect(54, 24, 14, 14);
      }
    }, 0);
    return c;
  }
  // A real picture of the level: drawn by the game's own renderer at a memorable moment.
  function drawLevelPicture(def, canvas) {
    if (previews[def.id] && previews[def.id].scn === !!(GR.Scenery && GR.Scenery[def.scenery])) {
      const img = previews[def.id].img, ctx = canvas.getContext("2d");
      canvas.width = img.width; canvas.height = img.height; ctx.drawImage(img, 0, 0); return;
    }
    try {
      const P = GR.Physics, L = P.compile(def), R = new GR.Renderer(canvas);
      R.fx = { low: false, reduced: true, shake: false };
      R.resize();
      R.scale = Math.min(R.cssH / 10, R.cssW / 17); R.viewW = R.cssW / R.scale; R.viewH = R.cssH / R.scale;
      R.setLevel(def, L);
      const s = P.newState(L), x = def.endX * (def.preview || 0.3);
      s.x = x; s.y = 1;
      const z = R.zoneAt(x); if (z) s.y = (z.lo + z.hi) / 2;
      R.cam.x = x - R.viewW * 0.3; R.cam.y = R.camTarget(s);
      const t = P.timeAtX(def, x);
      if (def.boss) s.bh = Math.max(0, Math.min(def.bossGates || 0, 2));
      R.render({ s: s, x: x, y: s.y, t: t, now: t, look: S.data.look, rot: 0, dead: true, beat: t * def.bpm / 60, energy: 0.7, noText: true });
      const img = document.createElement("canvas"); img.width = canvas.width; img.height = canvas.height; img.getContext("2d").drawImage(canvas, 0, 0);
      previews[def.id] = { img: img, scn: !!(GR.Scenery && GR.Scenery[def.scenery]) };
    } catch (e) { if (window.console) console.warn("preview", def.id, e); /* a preview is decoration only */ }
  }
  function drawBanner() {
    const c = $("btgBannerArt"); if (!c) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2), w = c.clientWidth, h = c.clientHeight;
    if (!w) return;
    c.width = Math.round(w * dpr); c.height = Math.round(h * dpr);
    const ctx = c.getContext("2d"); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const g = ctx.createLinearGradient(0, 0, w, h); g.addColorStop(0, "#04081c"); g.addColorStop(1, "#14104a");
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    const hy = h * 0.55;
    ctx.strokeStyle = "rgba(77,232,255,.35)"; ctx.lineWidth = 1; ctx.beginPath();
    for (let i = -14; i <= 14; i++) { ctx.moveTo(w / 2 + i * w * 0.015, hy); ctx.lineTo(w / 2 + i * w * 0.12, h); }
    for (let k = 1; k < 8; k++) { const y = hy + Math.pow(k / 8, 2) * (h - hy); ctx.moveTo(0, y); ctx.lineTo(w, y); }
    ctx.stroke();
    // The six level colors orbit the central machine.
    const cols = ["#2de2ff", "#2dffd8", "#ffc04a", "#e07bff", "#ff9a2e", "#ffd23f"];
    ctx.save(); ctx.translate(w / 2, hy - h * 0.12);
    for (let k = 0; k < 3; k++) { ctx.strokeStyle = k === 1 ? "rgba(255,210,63,.6)" : "rgba(77,232,255,.45)"; ctx.lineWidth = 2; ctx.beginPath(); for (let j = 0; j < 6; j++) { const a = j / 6 * Math.PI * 2 + k * 0.3; ctx.lineTo(Math.cos(a) * h * (0.16 + k * 0.08), Math.sin(a) * h * (0.16 + k * 0.08)); } ctx.closePath(); ctx.stroke(); }
    cols.forEach(function (cc, j) {
      const a = j / 6 * Math.PI * 2 - Math.PI / 2, r = h * 0.36, s = h * 0.09;
      ctx.save(); ctx.translate(Math.cos(a) * r * 1.6, Math.sin(a) * r * 0.7); ctx.rotate(0.3 * j);
      ctx.shadowColor = cc; ctx.shadowBlur = 12; ctx.fillStyle = cc; ctx.fillRect(-s / 2, -s / 2, s, s);
      ctx.shadowBlur = 0; ctx.fillStyle = "#060912"; ctx.fillRect(-s / 5, -s / 5, s / 2.5, s / 2.5); ctx.restore();
    });
    ctx.beginPath(); ctx.arc(0, 0, h * 0.07, 0, Math.PI * 2); ctx.fillStyle = "#ffd23f"; ctx.shadowColor = "#ffd23f"; ctx.shadowBlur = 18; ctx.fill();
    ctx.restore();
  }
  function btgStats() {
    const defs = GR.LEVELS.filter(function (d) { return d.pack === "btg"; });
    let done = 0, tok = 0;
    defs.forEach(function (d) { const r = S.level(d.id); if (r.completed) done++; r.tokens.forEach(function (t) { if (t) tok++; }); });
    return { done: done, levels: defs.length, tokens: tok, tokenMax: defs.length * 3 };
  }
  function buildLevels(onPlay) {
    lastOnPlay = onPlay;
    const list = $("levelList"), look = S.data.look, btg = tab === "btg";
    list.innerHTML = "";
    $("tabOrig").setAttribute("aria-selected", String(!btg)); $("tabBtg").setAttribute("aria-selected", String(btg));
    $("btgBanner").hidden = !btg;
    list.classList.toggle("btg-list", btg);
    $("lvlTitle").textContent = btg ? "Beyond the Grid" : "Choose a Level";
    if (btg) {
      const st = btgStats();
      $("btgLevels").textContent = st.done + "/" + st.levels + " levels completed";
      $("btgTokens").textContent = st.tokens + "/" + st.tokenMax + " tokens collected";
      const has = S.hasBadge("beyond-the-grid");
      $("btgBadge").textContent = has ? "🏅 Expansion badge earned: Grid Champion of Beyond the Grid!" : "🏅 Expansion badge: finish all six levels in Normal Mode";
      $("btgBadge").className = has ? "badge-on" : "badge-off";
      setTimeout(drawBanner, 0);
      if (GR.loadExpansion && !(GR.Scenery && GR.Scenery.neon)) GR.loadExpansion(function () { if (tab === "btg") buildLevels(onPlay); });
    }
    GR.LEVELS.forEach(function (def, i) {
      if ((def.pack === "btg") !== btg) return;
      const rec = S.level(def.id), p = def.palette;
      const modes = el("div", { class: "modes-used", "aria-label": "Modes: " + modesIn(def).join(", ") });
      modesIn(def).forEach(function (m) {
        const c = el("canvas", { width: 52, height: 52, title: m });
        modes.appendChild(c);
        requestAnimationFrame(function () { GR.Renderer.icon(c, "mode:" + m, look, 0); });
      });
      let extra = null, pic = null;
      if (btg) {
        pic = el("canvas", { class: "lvl-pic", "aria-label": "Preview of " + def.name });
        setTimeout(function () { drawLevelPicture(def, pic); }, 0);
        const hints = el("details", { class: "hints" }, [el("summary", { text: "Token hints" }), el("ol", null, (def.tokenHints || []).map(function (h, k) {
          return el("li", { class: rec.tokens[k] ? "got" : "" }, [document.createTextNode(h + (rec.tokens[k] ? " ✓" : ""))]);
        }))]);
        extra = el("div", { class: "reward" + (rec.completed ? " got" : "") }, [
          rewardPreview(def),
          el("span", null, [el("b", { text: rec.completed ? "Reward unlocked" : "Reward" }), document.createTextNode(rewardText(def) + (rec.completed ? " — find it in Customize" : " — finish in Normal Mode"))])
        ]);
        extra = el("div", { class: "btg-extra" }, [extra, hints]);
      }
      const card = el("article", { class: "lvl" + (btg ? " btg" : ""), style: "--a:" + p.sky2 + ";--b:" + p.sky1 + ";--c:" + p.glow }, [
        pic,
        el("div", { class: "meta" }, [
          el("span", { class: "diff", text: (i + 1) + " • " + def.difficulty }),
          el("span", { class: "stars", "aria-label": def.stars + " of 6 difficulty", text: "★".repeat(def.stars) + "☆".repeat(6 - def.stars) })
        ]),
        el("h3", { text: def.name }),
        el("p", { class: "blurb", text: def.blurb + " (" + Math.round(def.duration) + " s)" }),
        modes,
        extra,
        el("div", { class: "prog" }, [
          el("span", { text: "Best: " + rec.best + "%" + (rec.attempts ? "  •  " + rec.attempts + " attempt" + (rec.attempts === 1 ? "" : "s") : "") }),
          el("div", { class: "bar", "aria-hidden": "true" }, [el("i", { style: "width:" + rec.best + "%" })]),
          el("span", { text: "Practice: " + rec.practiceBest + "%" }),
          el("div", { class: "bar pr", "aria-hidden": "true" }, [el("i", { style: "width:" + rec.practiceBest + "%" })])
        ]),
        el("div", { class: "stats" }, [
          rec.completed ? el("span", { class: "done-badge", text: "✓ Completed" + (rec.completions > 1 ? " ×" + rec.completions : "") }) : el("span", { text: "Not finished yet" }),
          tokens(rec.tokens)
        ]),
        el("div", { class: "row" }, [
          el("button", { class: "btn go", type: "button", text: "▶ Normal", onclick: function () { onPlay(def, false); } }),
          el("button", { class: "btn alt", type: "button", text: "◆ Practice", onclick: function () { onPlay(def, true); } })
        ])
      ]);
      list.appendChild(card);
    });
    const total = GR.LEVELS.length * 3;
    $("tokenTotal").textContent = S.totalTokens() + " / " + total;
    if (btg) list.appendChild(el("p", { class: "saved-note btg-order", text: "Recommended order: 7 → 12. Every level is open, so play whichever you like." }));
  }

  // ---------- how to play ----------
  function buildHow() {
    const look = S.data.look;
    const modes = [
      ["cube", "Cube", "Press to jump. Hold to keep jumping each time you land."],
      ["ship", "Ship", "Hold to fly up, let go to glide down."],
      ["ball", "Ball", "Press to flip between floor and ceiling (only when touching one)."],
      ["ufo", "UFO", "Each tap is a little hop, even in midair."],
      ["wave", "Wave", "Hold to zoom diagonally up, let go to zoom down."],
      ["robot", "Robot", "Hold longer to jump higher. A quick tap is a small hop."]
    ];
    const objs = [
      ["spike", "Spikes", "Touching a spike ends the attempt."],
      ["block", "Blocks", "Land on top. Running into the side crashes you."],
      ["haz", "Red walls", "Striped red walls are dangerous on every side."],
      ["saw", "Saws", "Spinning saws. Some of them move."],
      ["pad", "Jump pads", "Launch you automatically. Pink pads are smaller boosts."],
      ["orb", "Jump orbs", "Press while touching an orb to jump in midair."],
      ["orb-blue", "Blue orbs and pads", "Flip gravity: up becomes down."],
      ["portal-ship", "Mode portals", "Turn you into a ship, ball, UFO, wave, robot, or cube."],
      ["portal-grav", "Gravity portals", "Yellow flips you upside down. Blue sets you right side up."],
      ["portal-speed", "Speed portals", "Arrows change your speed (1 to 4 arrows)."],
      ["portal-mini", "Size portals", "Pink makes you small. Green brings you back to normal."],
      ["token", "Tokens", "3 hidden in every level. They count when you finish in Normal Mode."],
      ["beam", "Energy beams (expansion)", "A dashed outline is harmless. It brightens as it charges, is dangerous while solid, then fades."],
      ["pulse", "Pulses (expansion)", "A ring appears first, then the pulse bursts on the beat."],
      ["mover", "Machinery (expansion)", "Moves on the beat. Its lamp turns amber just before it moves."],
      ["crys", "Crystal walls (expansion)", "Glowing edges are dangerous, just like red walls."],
      ["bgate", "Energy gates (finale)", "Fly through them to damage the Grid Guardian. They are always on the main path."]
    ];
    function fill(box, items, prefix) {
      box.innerHTML = "";
      items.forEach(function (it) {
        const c = el("canvas", { width: 92, height: 92, "aria-hidden": "true" });
        box.appendChild(el("div", { class: "how-item" }, [c, el("p", null, [el("b", { text: it[1] }), document.createTextNode(it[2])])]));
        requestAnimationFrame(function () { GR.Renderer.icon(c, prefix + it[0], look, 0.4); });
      });
    }
    fill($("howModes"), modes, "mode:");
    fill($("howObjects"), objs, "");
  }

  // ---------- customize ----------
  const preview = { mode: "cube", t: 0 };
  function buildLooks(onChange) {
    const look = S.data.look;
    $("looksTokens").textContent = "Tokens: " + S.totalTokens() + " / " + GR.LEVELS.length * 3;
    const ig = $("iconGrid"); ig.innerHTML = "";
    Looks.ICONS.forEach(function (ic, i) {
      const open = S.iconOpen(i), c = el("canvas", { width: 96, height: 96, "aria-hidden": "true" });
      const b = el("button", {
        class: "pick" + (open ? "" : " locked"), type: "button", "aria-pressed": String(look.icon === i),
        "aria-label": ic.name + (open ? "" : " (locked: " + Looks.unlockText(ic.unlock, GR.LEVELS) + ")"),
        title: open ? ic.name : "Locked: " + Looks.unlockText(ic.unlock, GR.LEVELS),
        onclick: function () { if (!open) { GR.Sound.sfx("nope"); return; } look.icon = i; S.save(); onChange(); buildLooks(onChange); }
      }, [c, open ? null : el("span", { class: "lock", text: "🔒 " + Looks.unlockText(ic.unlock, GR.LEVELS) })]);
      ig.appendChild(b);
      requestAnimationFrame(function () {
        const ctx = c.getContext("2d"); ctx.clearRect(0, 0, 96, 96); ctx.save(); ctx.translate(48, 48);
        Looks.drawIcon(ctx, { icon: i, c1: look.c1, c2: look.c2 }, 70); ctx.restore();
      });
    });
    function swatches(box, key) {
      box.innerHTML = "";
      Looks.COLORS.forEach(function (col, i) {
        box.appendChild(el("button", {
          class: "sw", type: "button", style: "background:" + col.c, "aria-label": col.name, title: col.name, "aria-pressed": String(look[key] === i),
          onclick: function () { look[key] = i; S.save(); onChange(); buildLooks(onChange); }
        }));
      });
    }
    swatches($("c1Grid"), "c1"); swatches($("c2Grid"), "c2");
    const tg = $("trailGrid"); tg.innerHTML = "";
    Looks.TRAILS.forEach(function (tr, i) {
      const open = S.trailOpen(i);
      const b = el("button", {
        type: "button", "aria-pressed": String(look.trail === i),
        onclick: function () { look.trail = i; S.save(); onChange(); buildLooks(onChange); }
      }, [document.createTextNode(tr.name), open ? null : el("small", { text: "🔒 " + Looks.unlockText(tr.unlock, GR.LEVELS) })]);
      if (!open) b.disabled = true;
      tg.appendChild(b);
    });
    const pm = $("previewModes"); pm.innerHTML = "";
    GR.Physics.MODE_NAMES.forEach(function (m) {
      pm.appendChild(el("button", { type: "button", "aria-pressed": String(preview.mode === m), text: m === "ufo" ? "UFO" : m[0].toUpperCase() + m.slice(1),
        onclick: function () { preview.mode = m; buildLooks(onChange); } }));
    });
  }
  // Animated preview: the character bouncing along a tiny floor with its trail.
  const trailPts = [];
  function drawPreview(dt) {
    const c = $("lookPreview"), look = S.data.look;
    const dpr = Math.min(window.devicePixelRatio || 1, 2), w = c.clientWidth, h = c.clientHeight;
    if (!w) return;
    if (c.width !== Math.round(w * dpr)) { c.width = Math.round(w * dpr); c.height = Math.round(h * dpr); }
    const ctx = c.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    preview.t += dt;
    const sc = h / 5, t = preview.t, m = preview.mode;
    const floorY = h * 0.78;
    ctx.fillStyle = "rgba(94,200,255,.9)"; ctx.fillRect(0, floorY, w, 3);
    ctx.fillStyle = "rgba(20,48,107,.9)"; ctx.fillRect(0, floorY + 3, w, h - floorY);
    let x = w * 0.5, y, rot = 0;
    const ph = (t * 1.25) % 1;
    if (m === "cube" || m === "robot") { y = floorY - sc / 2 - Math.max(0, Math.sin(ph * Math.PI)) * sc * 1.6; rot = m === "cube" ? ph * Math.PI : 0; }
    else if (m === "ball") { y = floorY - sc / 2; rot = t * 5; }
    else if (m === "wave") { const z = Math.abs(((t * 0.8) % 1) * 2 - 1); y = floorY - sc * (0.6 + z * 2.2); rot = ((t * 0.8) % 1) < 0.5 ? -Math.PI / 4 : Math.PI / 4; }
    else { y = floorY - sc * 2 - Math.sin(t * 2.4) * sc * 0.5; rot = m === "ship" ? -Math.cos(t * 2.4) * 0.35 : 0; }
    trailPts.push({ x: 0, y: y, t: t });
    while (trailPts.length && t - trailPts[0].t > (m === "wave" ? 1 : 0.35)) trailPts.shift();
    const c2 = Looks.COLORS[look.c2].c, style = Looks.TRAILS[look.trail].name;
    if ((style !== "Off" || m === "wave") && trailPts.length > 1) {
      for (let i = 1; i < trailPts.length; i++) {
        const k = i / trailPts.length, a = trailPts[i - 1], b = trailPts[i];
        ctx.beginPath(); ctx.moveTo(x - (t - a.t) * sc * 4, a.y); ctx.lineTo(x - (t - b.t) * sc * 4, b.y);
        ctx.strokeStyle = style === "Ribbon" ? "hsla(" + (i * 20 + t * 200) % 360 + ",100%,62%," + k + ")" : c2;
        ctx.globalAlpha = m === "wave" ? 0.9 : k * 0.8; ctx.lineWidth = m === "wave" ? sc * 0.3 : (style === "Comet" ? sc * 0.7 : sc * 0.3) * k;
        ctx.lineCap = "round"; ctx.stroke();
        if (style === "Dots" && i % 2 === 0 && m !== "wave") { ctx.beginPath(); ctx.arc(x - (t - b.t) * sc * 4, b.y, sc * 0.12 * k, 0, 6.3); ctx.fillStyle = c2; ctx.fill(); }
      }
      ctx.globalAlpha = 1;
    }
    ctx.save(); ctx.translate(x, y);
    const d = GR.Physics.MODE[m];
    Looks.drawPlayer(ctx, m, look, sc * d.w, sc * d.h, rot, t);
    ctx.restore();
  }

  // ---------- settings ----------
  function bindSettings(onChange) {
    const st = S.data.settings;
    function sync() {
      $("setMusic").value = Math.round(st.music * 100); $("outMusic").textContent = Math.round(st.music * 100);
      $("setSfx").value = Math.round(st.sfx * 100); $("outSfx").textContent = Math.round(st.sfx * 100);
      $("setMuted").checked = st.muted; $("setReduced").checked = st.reducedMotion; $("setLow").checked = st.lowFx; $("setShake").checked = st.shake;
      $("setAutoCp").checked = st.autoCp;
    }
    sync();
    $("setMusic").addEventListener("input", function (e) { st.music = e.target.value / 100; $("outMusic").textContent = e.target.value; S.save(); onChange(); });
    $("setSfx").addEventListener("input", function (e) { st.sfx = e.target.value / 100; $("outSfx").textContent = e.target.value; S.save(); onChange(); });
    $("setSfx").addEventListener("change", function () { GR.Sound.sfx("token"); });
    [["setMuted", "muted"], ["setReduced", "reducedMotion"], ["setLow", "lowFx"], ["setShake", "shake"], ["setAutoCp", "autoCp"]].forEach(function (p) {
      $(p[0]).addEventListener("change", function (e) { st[p[1]] = e.target.checked; S.save(); onChange(); });
    });
    if (!S.storageOk) $("storageNote").textContent = "This browser is blocking saved data (maybe a private window). You can still play, but progress will be lost when you close the page.";
    else if (S.damaged) $("storageNote").textContent = "Saved data in this browser was damaged, so it was started fresh. Progress is saved in this browser only.";
    return sync;
  }

  GR.UI = { buildLevels: buildLevels, setTab: setTab, get tab() { return tab; }, btgStats: btgStats, buildHow: buildHow, buildLooks: buildLooks, drawPreview: drawPreview, bindSettings: bindSettings, tokens: tokens };
})();
