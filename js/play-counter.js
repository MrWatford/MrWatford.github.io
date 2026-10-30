/* =========================================================
   Mr. Watford's Website — game play counter
   Keeps one shared number per game ("played 1,284 times") on
   Abacus, a free counting service (abacus.jasoncameron.dev).
   Only "+1 for this game" is sent: no names, no initials, no
   scores, nothing about the student.

   In a game:        PlayCount.hit("word-rain")   when a round starts
   On a page:        <span class="play-count" data-play-count="word-rain"></span>
                     fills in with the total (stays hidden if the
                     service can't be reached).

   The service allows 30 requests every 10 seconds from one school
   network, so plays that don't go through wait on this device and
   are retried later, and totals are remembered for 10 minutes.
   ========================================================= */
(function () {
  const API = "https://abacus.jasoncameron.dev";
  // Testing on this computer uses a separate set of counters so the real totals stay honest.
  const NS = location.hostname === "mrwatford.github.io" ? "mrwatford.github.io" : "mrwatford-test";
  const FRESH_FOR = 10 * 60 * 1000;
  const CACHE_KEY = "playcount-cache", PENDING_KEY = "playcount-pending";

  function read(key) { try { return JSON.parse(localStorage.getItem(key)) || {}; } catch (e) { return {}; } }
  function write(key, obj) { try { localStorage.setItem(key, JSON.stringify(obj)); } catch (e) {} }
  function later(fn, min, max) { setTimeout(fn, min + Math.random() * (max - min)); }

  function remember(game, value) {
    const cache = read(CACHE_KEY);
    cache[game] = { v: value, t: Date.now() };
    write(CACHE_KEY, cache);
    show(game, value);
  }

  function call(path) {
    return fetch(API + path, { cache: "no-store" }).then(function (r) {
      if (r.status === 404) return { value: 0 };   // no plays yet
      if (!r.ok) throw new Error("status " + r.status);
      return r.json();
    });
  }

  // ---- counting a play ----
  function addPending(game, n) {
    const pending = read(PENDING_KEY);
    pending[game] = Math.min(20, (pending[game] || 0) + n);
    if (pending[game] <= 0) delete pending[game];
    write(PENDING_KEY, pending);
  }

  function send(game) {
    return call("/hit/" + NS + "/" + game).then(function (data) {
      remember(game, data.value);
      return true;
    }).catch(function () { return false; });
  }

  function hit(game) {
    send(game).then(function (ok) {
      if (!ok) { addPending(game, 1); later(flush, 15000, 45000); }
    });
  }

  // Sends plays that didn't go through last time, one at a time.
  let flushing = false;
  function flush() {
    if (flushing) return;
    const pending = read(PENDING_KEY), game = Object.keys(pending)[0];
    if (!game) return;
    flushing = true;
    addPending(game, -1);
    send(game).then(function (ok) {
      flushing = false;
      if (ok) later(flush, 500, 1500);
      else { addPending(game, 1); later(flush, 30000, 90000); }
    });
  }

  // ---- showing totals ----
  function show(game, value) {
    document.querySelectorAll('[data-play-count="' + game + '"]').forEach(function (el) {
      el.textContent = "🎮 Played " + Number(value).toLocaleString() + (value === 1 ? " time" : " times");
      el.hidden = false;
    });
  }

  function load(game, tries) {
    call("/get/" + NS + "/" + game).then(function (data) {
      remember(game, data.value);
    }).catch(function () {
      if (tries < 3) later(function () { load(game, tries + 1); }, 8000, 20000);
    });
  }

  function fillPage() {
    const cache = read(CACHE_KEY), now = Date.now(), seen = {};
    document.querySelectorAll("[data-play-count]").forEach(function (el) {
      const game = el.dataset.playCount;
      if (seen[game]) return;
      seen[game] = true;
      const c = cache[game];
      if (c) show(game, c.v); else el.hidden = true;
      // spread the requests out so a whole class opening the page at once stays under the limit
      if (!c || now - c.t > FRESH_FOR) later(function () { load(game, 0); }, 0, 4000);
    });
  }

  window.PlayCount = { hit: hit };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", fillPage); else fillPage();
  later(flush, 3000, 10000);
})();
