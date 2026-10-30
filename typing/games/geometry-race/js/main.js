/* =========================================================
   Geometry Race — the game itself: one animation loop, the
   play/dead/win/pause states, attempts, practice checkpoints,
   saving results, and moving between menu screens.
   ========================================================= */
(function () {
  "use strict";
  const GR = window.GR;
  const P = GR.Physics, S = GR.Save, Sound = GR.Sound, Looks = GR.Looks, UI = GR.UI;
  const TICK_MS = P.TICK * 1000;
  const EV = P.EV;
  function $(id) { return document.getElementById(id); }

  S.load();
  S.refreshUnlocks();
  if (!S.iconOpen(S.data.look.icon)) S.data.look.icon = 0;      // never wear a look that isn't unlocked
  if (!S.trailOpen(S.data.look.trail)) S.data.look.trail = 0;
  const canvas = $("view"), stage = $("stage");
  const R = new GR.Renderer(canvas);
  const input = new GR.Input(stage);
  const compiled = {};
  function levelData(def) { return compiled[def.id] || (compiled[def.id] = P.compile(def)); }

  // state: menu | play | dead | win | paused | done
  const G = { state: "menu", screen: "main", back: [], run: null, demo: null, toastT: 0, inp: { press: false, release: false, held: false } };
  window.__gr = G;   // handy for testing in the browser console

  // ---------- settings ----------
  function applySettings() {
    const st = S.data.settings;
    R.fx.low = st.lowFx; R.fx.reduced = st.reducedMotion; R.fx.shake = st.shake;
    document.body.classList.toggle("reduce-motion", st.reducedMotion);
    Sound.setVolumes(st.music, st.sfx, st.muted);
    R.resize();
  }
  const syncSettings = UI.bindSettings(applySettings);
  applySettings();

  // ---------- screens ----------
  const SCREENS = { main: "scrMain", levels: "scrLevels", how: "scrHow", looks: "scrLooks", settings: "scrSettings", pause: "scrPause", done: "scrDone" };
  function show(name, remember) {
    if (remember && G.screen) G.back.push(G.screen);
    G.screen = name;
    Object.keys(SCREENS).forEach(function (k) { $(SCREENS[k]).classList.toggle("show", k === name); $(SCREENS[k]).setAttribute("aria-hidden", String(k !== name)); });
    if (name === "levels") UI.buildLevels(startLevel);
    if (name === "how") UI.buildHow();
    if (name === "looks") UI.buildLooks(function () { Sound.sfx("menu"); });
    if (name === "settings") syncSettings();
    if (name) {
      const first = $(SCREENS[name]).querySelector(".btn.go, .btn");
      if (first) setTimeout(function () { try { first.focus({ preventScroll: true }); } catch (e) { first.focus(); } }, 30);
    }
  }
  function hideScreens() { show(null); }
  function goBack() {
    const prev = G.back.pop() || (G.state === "paused" ? "pause" : "main");
    show(prev);
  }
  document.querySelectorAll("[data-go]").forEach(function (b) {
    b.addEventListener("click", function () {
      const to = b.getAttribute("data-go");
      Sound.sfx(to === "back" || to === "main" ? "back" : "select");
      if (to === "back") goBack();
      else if (to === "main") { G.back.length = 0; show("main"); }
      else show(to, true);
    });
  });

  // ---------- toast / big message ----------
  function toast(msg) { const t = $("toast"); t.textContent = msg; t.classList.add("show"); G.toastT = 2.2; }
  function bigMsg(msg) { const b = $("bigMsg"); b.textContent = msg; b.classList.remove("show"); void b.offsetWidth; b.classList.add("show"); }

  // ---------- starting a level ----------
  function startLevel(def, practice) {
    Sound.unlock();
    Sound.sfx("select");
    const L = levelData(def);
    G.auto = null;
    G.run = {
      def: def, L: L, practice: practice, attempt: 0, checkpoints: [], s: null, n: 0, base: 0,
      deadT: 0, winT: 0, rot: 0, nextAuto: 0, pending: false, best0: S.level(def.id).best
    };
    R.setLevel(def, L);
    if (window.PlayCount) PlayCount.hit("geometry-race");
    $("hudName").textContent = def.name;
    $("hudPractice").hidden = !practice;
    $("cpButtons").hidden = !practice;
    $("hud").classList.toggle("practice", practice);
    $("hud").hidden = false;
    G.back.length = 0;
    hideScreens();
    newAttempt();
    G.state = "play";
    input.active = true;
    if (practice) toast(matchMedia("(hover: none)").matches ? "Practice: tap ◆ Checkpoint to save your spot" : "Practice: press Z (or ◆) for a checkpoint, X to remove it");
    else if (innerHeight > innerWidth * 1.2) toast("Tip: turn your device sideways for a bigger view");
  }

  function sectionsFor(def) { return def.sections || [[0, "main"]]; }

  function newAttempt() {
    const run = G.run, def = run.def;
    run.attempt++;
    let s, cp = null;
    if (run.practice && run.checkpoints.length) {
      cp = run.checkpoints[run.checkpoints.length - 1];
      s = P.clone(cp.snap);
      R.clearFx();
      R.cam.x = cp.cam.x; R.cam.y = cp.cam.y;
      run.rot = cp.rot;
    } else {
      s = P.newState(run.L);
      R.clearFx();
      R.resetCam(s);
      run.rot = 0;
    }
    run.s = s; run.n = 0; run.base = performance.now(); run.pending = false;
    run.nextAuto = s.t + 2.5;
    run.attemptX = s.x + 3.2; run.attemptY = R.cam.y + 2.6;
    if (!run.practice) {
      const rec = S.level(def.id);
      rec.attempts++; S.data.totalAttempts++; S.save();
    }
    $("hudAttempt").textContent = "Attempt " + run.attempt;
    input.clear();   // a held button must be let go and pressed again
    Sound.playSong(def.song, def.bpm, sectionsFor(def), s.t);
    G.state = "play";
  }

  function pct(run) { return Math.max(0, Math.min(100, Math.floor(run.s.x / run.def.endX * 100))); }

  // ---------- the loop ----------
  let last = performance.now(), loopToken = 0;
  // Only one loop can ever run: an older loop stops as soon as a newer one starts.
  function startLoop() {
    const mine = ++loopToken;
    function tick(now) { if (mine !== loopToken) return; requestAnimationFrame(tick); frame(now); }
    requestAnimationFrame(tick);
  }
  G.restartLoop = startLoop;   // tests swap in a timer-based requestAnimationFrame and re-arm

  function frame(now) {
    let dt = (now - last) / 1000; last = now;
    if (dt > 0.1) dt = 0.1; if (dt < 0) dt = 0;
    const run = G.run;
    if (G.state === "play") simulate(now);
    else if (G.state === "dead") { run.deadT -= dt; if (run.deadT <= 0) newAttempt(); }
    else if (G.state === "win") { run.winT -= dt; if (run.winT <= 0) showDone(); }
    if (G.state === "menu") demoStep(dt);
    R.stepFx(dt);
    draw(now, dt);
    if (G.toastT > 0) { G.toastT -= dt; if (G.toastT <= 0) $("toast").classList.remove("show"); }
    if (G.screen === "looks") UI.drawPreview(dt);
    // Music follows the game clock.
    if (G.state === "play" && run) Sound.update(run.s.t + Math.max(0, now - (run.base + run.n * TICK_MS)) / 1000);
    else Sound.update(0);
  }

  function simulate(now) {
    const run = G.run, s = run.s, L = run.L;
    let target = Math.floor((now - run.base) / TICK_MS);
    if (target - run.n > 60) { run.base = now - run.n * TICK_MS; target = run.n; }   // the page hiccuped: don't fast-forward
    const inp = G.inp;
    while (run.n < target) {
      run.n++;
      input.take(run.base + run.n * TICK_MS, inp);
      if (G.auto) {   // test autoplay: inputs come from a solver run instead of the player
        const a = G.auto, i = Math.floor(s.tick / a.D), h = a.dec[i] || 0;
        inp.held = !!h; inp.press = s.tick % a.D === 0 && !!h && !(a.dec[i - 1] || 0);
      }
      const wasMode = s.mode, wasVy = s.vy;
      P.step(s, L, inp.press, inp.held);
      if (s.mode === "wave" && (wasMode !== "wave" || Math.sign(wasVy) !== Math.sign(s.vy) || run.n % 6 === 0)) R.pushWave(s.px, s.py, s.t);
      if (s.ev) events(s);
      if (s.dead) { die(); return; }
      if (s.won) { win(); return; }
      if (run.practice && S.data.settings.autoCp && s.t >= run.nextAuto) autoCheckpoint();
    }
  }

  // ---------- effects from physics events ----------
  function events(s) {
    const e = s.ev, look = S.data.look, d = P.dims(s);
    const c1 = Looks.COLORS[look.c1].c, c2 = Looks.COLORS[look.c2].c;
    const feet = s.y - s.gs * d.h / 2;
    if (e & EV.JUMP) { Sound.sfx("jump"); R.emit(5, s.x - 0.2, feet, { speed: 2.5, life: 0.3, size: 0.12, colors: [c2, "#ffffff"], dir: Math.PI, spread: 1.2 }); }
    if (e & EV.LAND) R.emit(6, s.x, feet, { speed: 2.5, life: 0.25, size: 0.12, colors: [c1, "#ffffff"], dir: s.gs > 0 ? Math.PI / 2 : -Math.PI / 2, spread: 2.6 });
    if (e & EV.ORB) { Sound.sfx("orb"); R.emit(12, s.x, s.y, { speed: 6, life: 0.35, size: 0.14, colors: ["#ffe14d", "#ffffff"], kind: 2 }); }
    if (e & EV.PAD) { Sound.sfx("pad"); R.emit(8, s.x, feet, { speed: 5, life: 0.35, size: 0.14, colors: ["#ffd23f", "#ffffff"], dir: s.gs > 0 ? Math.PI / 2 : -Math.PI / 2, spread: 1 }); }
    if (e & EV.PORTAL) { Sound.sfx("portal"); R.emit(14, s.x, s.y, { speed: 5, life: 0.4, size: 0.16, colors: [c1, c2, "#ffffff"] }); }
    if ((e & EV.FLIP) && !(e & (EV.PORTAL | EV.ORB | EV.PAD))) Sound.sfx("flip");
    if (e & EV.TOKEN) {
      Sound.sfx("token");
      const t = G.run.L.tokens[s.lastToken];
      R.emit(20, t.x, t.y, { speed: 6, life: 0.6, size: 0.18, colors: ["#ffd23f", "#fff6c9", "#ff9a2e"], kind: 2 });
      toast(G.run.practice ? "Token found! (Tokens only count in Normal Mode)" : "Token " + (s.lastToken + 1) + " found! Finish the level to keep it.");
    }
  }

  // ---------- crash ----------
  function die() {
    const run = G.run, s = run.s, look = S.data.look, p = pct(run);
    G.state = "dead";
    run.deadT = 0.5;
    Sound.stopSong();
    Sound.sfx("crash");
    R.burst(s.x, s.y, [Looks.COLORS[look.c1].c, Looks.COLORS[look.c2].c, "#ffffff"]);
    const rec = S.level(run.def.id);
    if (run.practice) { if (p > rec.practiceBest) rec.practiceBest = p; }
    else if (p > rec.best) { if (rec.best > 0 || p >= 10) toast("New best: " + p + "%!"); rec.best = p; }
    S.save();
  }

  // ---------- finish ----------
  function win() {
    const run = G.run, s = run.s, def = run.def, rec = S.level(def.id);
    G.state = "win";
    run.winT = 1.7;
    Sound.stopSong();
    Sound.sfx("finish");
    R.confetti(s.x, s.y);
    bigMsg(run.practice ? "PRACTICE CLEAR!" : "LEVEL COMPLETE!");
    run.result = { prevBest: run.practice ? rec.practiceBest : rec.best, newTokens: [], unlocks: [] };
    if (run.practice) { rec.practiceDone = true; rec.practiceBest = 100; }
    else {
      rec.completed = true; rec.best = 100; rec.completions++;
      for (let i = 0; i < 3; i++) if ((s.tk >> i) & 1 && !rec.tokens[i]) { rec.tokens[i] = true; run.result.newTokens.push(i); }
    }
    run.result.unlocks = S.refreshUnlocks();
    S.save();
    S.flush();
  }

  function showDone() {
    const run = G.run, def = run.def, rec = S.level(def.id), r = run.result;
    G.state = "done";
    input.active = false;
    $("hud").hidden = true;
    $("doneTitle").textContent = run.practice ? "Practice Complete!" : "Level Complete!";
    $("doneLevel").textContent = def.name + " • " + def.difficulty + (run.practice ? " • Practice Mode (doesn't count as finishing)" : "");
    $("doneAttempts").textContent = run.attempt;
    const tk = $("doneTokens"); tk.innerHTML = "";
    for (let i = 0; i < 3; i++) {
      const got = run.practice ? (run.s.tk >> i) & 1 : rec.tokens[i];
      const isNew = r.newTokens.indexOf(i) >= 0;
      const ii = document.createElement("i");
      ii.className = (got ? (run.practice ? "run" : "on") : "") + (isNew ? " new" : "");
      tk.appendChild(ii);
    }
    tk.title = run.practice ? "Tokens only count in Normal Mode" : "";
    $("doneBestLabel").textContent = run.practice ? "Practice best" : "Best progress";
    $("doneBest").textContent = (r.prevBest < 100 ? r.prevBest + "% → " : "") + "100%";
    const un = $("doneUnlocks");
    const extra = r.newTokens.length ? "New token" + (r.newTokens.length > 1 ? "s" : "") + " saved! " : "";
    if (r.unlocks.length || extra) { un.hidden = false; un.textContent = extra + (r.unlocks.length ? "Unlocked: " + r.unlocks.join(", ") + " (see Customize)" : ""); if (r.unlocks.length) Sound.sfx("unlock"); }
    else un.hidden = true;
    const idx = GR.LEVELS.indexOf(def);
    $("btnNext").hidden = idx >= GR.LEVELS.length - 1;
    $("btnNormal").hidden = !run.practice;
    show("done");
  }
  $("btnReplay").addEventListener("click", function () { startLevel(G.run.def, G.run.practice); });
  $("btnNormal").addEventListener("click", function () { startLevel(G.run.def, false); });
  $("btnNext").addEventListener("click", function () {
    const i = GR.LEVELS.indexOf(G.run.def);
    if (i < GR.LEVELS.length - 1) startLevel(GR.LEVELS[i + 1], false);
  });
  $("btnDoneLevels").addEventListener("click", function () { exitToLevels(); });

  function exitToLevels() {
    Sound.stopSong();
    Sound.sfx("back");
    G.state = "menu"; G.run = null; G.auto = null;
    input.active = false; input.clear();
    $("hud").hidden = true;
    R.setLevel(G.demo.def, G.demo.L); resetDemo();
    G.back = ["main"];
    show("levels");
    Sound.playMenu();
  }

  // ---------- pause ----------
  function pause() {
    if (G.state !== "play" && G.state !== "dead") return;
    G.run.pending = G.state === "dead";
    G.state = "paused";
    Sound.stopSong();
    input.clear(); input.active = false;
    const run = G.run;
    $("pauseInfo").textContent = run.def.name + " • " + pct(run) + "% • Attempt " + run.attempt + (run.practice ? " • Practice" : "");
    G.back.length = 0;
    show("pause");
  }
  function resume() {
    if (G.state !== "paused") return;
    const run = G.run;
    hideScreens();
    input.clear(); input.active = true;
    if (run.pending) { newAttempt(); return; }
    G.state = "play";
    run.base = performance.now() - run.n * TICK_MS;
    Sound.playSong(run.def.song, run.def.bpm, sectionsFor(run.def), run.s.t);
  }
  function restart() {
    if (!G.run || ["play", "dead", "paused"].indexOf(G.state) < 0) return;
    if (G.state === "paused") hideScreens();
    input.active = true;
    if (G.run.practice && G.run.checkpoints.length) { G.run.checkpoints.length = 0; toast("Restarted from the beginning (checkpoints cleared)"); }
    newAttempt();
  }
  $("btnPause").addEventListener("click", function () { Sound.sfx("menu"); pause(); });
  $("btnResume").addEventListener("click", function () { Sound.sfx("select"); resume(); });
  $("btnRestart").addEventListener("click", function () { Sound.sfx("select"); restart(); });
  $("btnExit").addEventListener("click", exitToLevels);

  // ---------- practice checkpoints ----------
  function tryCheckpoint(manual) {
    const run = G.run;
    if (!run || !run.practice || G.state !== "play") return false;
    const s = run.s;
    const snap = P.clone(s);
    snap.held = false; snap.pbuf = 0; snap.obuf = 0; snap.ev = 0;
    // Refuse spots where no input at all could survive the next second.
    const check = P.solve(run.L, snap, { D: 6, maxTicks: 240, budget: 40000 });
    if (!check.ok) {
      if (manual) { Sound.sfx("nope"); toast("Too dangerous here! Try a checkpoint somewhere safer."); }
      return false;
    }
    run.checkpoints.push({ snap: snap, cam: { x: R.cam.x, y: R.cam.y }, x: s.x, y: s.y, rot: run.rot });
    if (manual) { Sound.sfx("checkpoint"); toast("Checkpoint placed (" + run.checkpoints.length + ")"); }
    return true;
  }
  function autoCheckpoint() {
    const run = G.run, s = run.s;
    const steady = s.mode === "cube" || s.mode === "robot" || s.mode === "ball" ? s.grounded : true;
    if (steady && tryCheckpoint(false)) run.nextAuto = s.t + 3;
    else run.nextAuto = s.t + 0.25;
  }
  function removeCheckpoint() {
    const run = G.run;
    if (!run || !run.practice || ["play", "dead"].indexOf(G.state) < 0) return;
    if (!run.checkpoints.length) { toast("No checkpoints to remove"); return; }
    run.checkpoints.pop();
    Sound.sfx("back");
    toast(run.checkpoints.length ? "Checkpoint removed (" + run.checkpoints.length + " left)" : "Checkpoint removed — back to the start");
  }
  $("btnCpAdd").addEventListener("click", function () { tryCheckpoint(true); });
  $("btnCpDel").addEventListener("click", removeCheckpoint);

  // ---------- fullscreen ----------
  function toggleFullscreen() {
    const d = document, el = d.documentElement;
    const fs = d.fullscreenElement || d.webkitFullscreenElement;
    try {
      if (fs) (d.exitFullscreen || d.webkitExitFullscreen).call(d);
      else if (el.requestFullscreen) el.requestFullscreen().catch(function () {});
      else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen();
    } catch (e) { /* not supported (e.g. iPhone) */ }
  }
  $("btnFull").addEventListener("click", toggleFullscreen);
  if (!document.documentElement.requestFullscreen && !document.documentElement.webkitRequestFullscreen) $("btnFull").hidden = true;

  // ---------- keyboard shortcuts ----------
  input.handlers = {
    pause: function () {
      if (G.state === "play" || G.state === "dead") pause();
      else if (G.state === "paused" && G.screen === "pause") resume();
      else if (G.screen && G.screen !== "main" && G.screen !== "done") { Sound.sfx("back"); goBack(); }
    },
    restart: restart,
    mute: function () { const st = S.data.settings; st.muted = !st.muted; S.save(); applySettings(); syncSettings(); toast(st.muted ? "Muted (M to unmute)" : "Sound on"); },
    checkpoint: function () { tryCheckpoint(true); },
    removeCheckpoint: removeCheckpoint,
    fullscreen: toggleFullscreen,
    blur: function () { if ((G.state === "play" || G.state === "dead") && !G.testNoPause) pause(); }
  };
  document.addEventListener("visibilitychange", function () {
    if (document.hidden) { if ((G.state === "play" || G.state === "dead") && !G.testNoPause) pause(); input.clear(); Sound.suspend(); }
    else Sound.resume();
  });
  window.addEventListener("resize", function () { R.resize(); });
  document.addEventListener("fullscreenchange", function () { R.resize(); });

  // First tap/key anywhere turns sound on (browsers require a gesture).
  function firstGesture() {
    Sound.unlock();
    if (G.state === "menu") Sound.playMenu();
    window.removeEventListener("pointerdown", firstGesture, true);
    window.removeEventListener("keydown", firstGesture, true);
  }
  window.addEventListener("pointerdown", firstGesture, true);
  window.addEventListener("keydown", firstGesture, true);

  // Reset progress (with confirmation).
  $("btnReset").addEventListener("click", function () {
    const dlg = $("dlgReset");
    if (dlg.showModal) dlg.showModal();
    else if (window.confirm("Reset all progress? This can't be undone.")) { S.reset(); toast("Progress reset"); }
  });
  $("dlgReset").addEventListener("close", function () {
    if ($("dlgReset").returnValue === "reset") { S.reset(); Sound.sfx("back"); toast("Progress reset"); }
  });

  // ---------- drawing ----------
  function playerRot(run, s, dt) {
    const m = s.mode;
    if (m === "cube") {
      if (s.grounded) { const q = Math.round(run.rot / (Math.PI / 2)) * (Math.PI / 2); run.rot += (q - run.rot) * Math.min(1, dt * 22); }
      else run.rot += dt * 7.4 * (s.mini ? 1.2 : 1);
    } else if (m === "ship") run.rot = -Math.atan2(s.vy * s.gs, s.vx * 1.6);
    else if (m === "ball") run.rot += dt * s.vx / 0.5 * (s.gs > 0 ? 1 : -1);
    else if (m === "ufo") run.rot = -s.vy * s.gs * 0.015;
    else if (m === "wave") run.rot = -Math.atan2(s.vy * s.gs, s.vx);
    else run.rot = 0;
    return run.rot;
  }
  const ENERGY = { intro: 0.3, main: 0.55, drop: 0.95, calm: 0.3, outro: 0.7 };
  function energyAt(def, beat) {
    const secs = sectionsFor(def), bar = beat / 4;
    let name = secs[0][1];
    for (let i = 0; i < secs.length; i++) if (secs[i][0] <= bar) name = secs[i][1];
    return ENERGY[name] || 0.5;
  }

  function draw(now, dt) {
    const run = G.state === "menu" || !G.run ? null : G.run;
    const look = S.data.look;
    if (run) {
      const s = run.s;
      let a = (now - (run.base + run.n * TICK_MS)) / TICK_MS;
      if (G.state !== "play") a = 1;
      a = Math.max(0, Math.min(1, a));
      const x = s.px + (s.x - s.px) * a, y = s.py + (s.y - s.py) * a;
      if (G.state === "play") {
        R.updateCam(x, s, dt);
        playerRot(run, s, dt);
        R.pushTrail(x, y, now / 1000);
      }
      const t = s.t + (G.state === "play" ? a * P.TICK : 0);
      const beat = t * run.def.bpm / 60;
      R.render({
        s: s, x: x, y: y, t: t, now: now / 1000, look: look, rot: run.rot,
        dead: G.state === "dead" || G.state === "win" || G.state === "done", beat: beat, energy: energyAt(run.def, beat),
        attemptText: (run.practice ? "Practice • " : "") + "Attempt " + run.attempt, attemptX: run.attemptX, attemptY: run.attemptY,
        checkpoints: run.practice ? run.checkpoints : null, savedTokens: run.practice ? null : S.level(run.def.id).tokens
      });
      if (G.state === "play" || G.state === "dead") {
        const p = pct(run);
        $("hudBar").style.width = p + "%";
        $("hudPct").textContent = p + "%";
        const rec = S.level(run.def.id), ti = $("hudTokens").children;
        for (let i = 0; i < 3; i++) ti[i].className = (s.tk >> i) & 1 ? "run" : rec.tokens[i] && !run.practice ? "on" : "";
      }
    } else if (G.demo) {
      const d = G.demo, s = d.s;
      R.updateCam(s.x, s, dt);
      playerRot(d, s, dt);
      R.pushTrail(s.x, s.y, now / 1000);
      R.render({ s: s, x: s.x, y: s.y, t: s.t, now: now / 1000, look: look, rot: d.rot, dead: false, beat: s.t * d.def.bpm / 60, energy: 0.4, noText: true });
    }
  }

  // ---------- menu background: the first level playing itself ----------
  function setupDemo() {
    const def = GR.LEVELS[0], L = levelData(def);
    const sol = P.solve(L, null, { D: 8, budget: 2e6 });
    G.demo = { def: def, L: L, dec: sol.ok ? sol.decisions : [], s: null, i: 0, k: 0, acc: 0, prev: 0, rot: 0 };
    R.setLevel(def, L);
    resetDemo();
  }
  function resetDemo() {
    const d = G.demo;
    d.s = P.newState(d.L); d.i = 0; d.k = 0; d.acc = 0; d.prev = 0; d.rot = 0;
    R.clearFx(); R.resetCam(d.s);
  }
  function demoStep(dt) {
    const d = G.demo;
    if (!d) return;
    d.acc += dt;
    while (d.acc >= P.TICK) {
      d.acc -= P.TICK;
      const h = d.dec[d.i] || 0;
      P.step(d.s, d.L, d.k === 0 && h && !d.prev, !!h);
      if (d.s.mode === "wave") R.pushWave(d.s.x, d.s.y, d.s.t);
      if (++d.k >= 8) { d.k = 0; d.prev = h; d.i++; }
      if (d.s.dead || d.s.won) { resetDemo(); return; }
    }
  }

  // Testing helper: __grAuto("level-id") plays a level with a solver-found run.
  window.__grAuto = function (id, practice) {
    const def = GR.LEVELS.find(function (d) { return d.id === id; });
    const sol = P.solve(levelData(def), null, { D: 8, budget: 8e6 });
    if (!sol.ok) return "no solution found";
    startLevel(def, !!practice);
    G.auto = { dec: sol.decisions, D: 8 };
    return sol.decisions.length + " decisions";
  };
  G.R = R; G.P = P; G.input = input;

  // ---------- boot ----------
  setupDemo();
  show("main");
  startLoop();
})();
