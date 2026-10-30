/* =========================================================
   Geometry Race — input
   Keyboard, mouse, and touch all feed one "action button".
   Every press and release is stamped with the time it happened,
   so the physics applies it on the exact tick (not "next frame").
   ========================================================= */
(function () {
  "use strict";
  const GR = window.GR = window.GR || {};

  const ACTION_KEYS = { Space: 1, ArrowUp: 1, KeyW: 1 };

  function stamp(e) {
    const now = performance.now();
    const t = e && e.timeStamp;
    return t && t > now - 1000 && t <= now + 5 ? t : now;
  }

  function Input(area) {
    this.area = area;
    this.down = new Set();      // sources currently held (keys and pointers)
    this.ignored = new Set();   // held sources that must be let go before they count again
    this.queue = [];            // [time, 1 = down / 0 = up]
    this.active = false;        // true while a level is being played (blocks page scrolling)
    this.handlers = {};         // name -> function (pause, restart, mute, checkpoint, removeCheckpoint, fullscreen)
    this.count = 0;             // how many counted sources are down
    this.lastPress = -1e9;
    const self = this;

    this.onKeyDown = function (e) {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const tag = e.target && e.target.tagName;
      const typing = tag === "INPUT" || tag === "SELECT" || tag === "TEXTAREA";
      if (ACTION_KEYS[e.code]) {
        if (!self.active) return;
        e.preventDefault();
        if (!e.repeat) self.press("k:" + e.code, stamp(e));
        return;
      }
      if (e.repeat || typing) return;
      const h = self.handlers;
      switch (e.code) {
        case "Escape": case "KeyP": if (h.pause) { if (self.active) e.preventDefault(); h.pause(); } break;
        case "KeyR": if (h.restart) h.restart(); break;
        case "KeyM": if (h.mute) h.mute(); break;
        case "KeyZ": if (h.checkpoint) h.checkpoint(); break;
        case "KeyX": case "Backspace": if (h.removeCheckpoint && self.active) { e.preventDefault(); h.removeCheckpoint(); } break;
        case "KeyF": if (h.fullscreen) h.fullscreen(); break;
      }
    };
    this.onKeyUp = function (e) {
      if (ACTION_KEYS[e.code]) { if (self.active) e.preventDefault(); self.release("k:" + e.code, stamp(e)); }
    };
    this.onPointerDown = function (e) {
      if (!self.active) return;
      if (e.pointerType === "mouse" && e.button !== 0) return;
      if (e.target.closest && e.target.closest("button, a, input, .no-tap")) return;
      e.preventDefault();
      try { area.setPointerCapture(e.pointerId); } catch (err) { /* older browsers */ }
      self.press("p:" + e.pointerId, stamp(e));
    };
    this.onPointerUp = function (e) { self.release("p:" + e.pointerId, stamp(e)); };
    this.onBlur = function () { self.clear(); if (self.handlers.blur) self.handlers.blur(); };

    window.addEventListener("keydown", this.onKeyDown);
    window.addEventListener("keyup", this.onKeyUp);
    area.addEventListener("pointerdown", this.onPointerDown);
    window.addEventListener("pointerup", this.onPointerUp);
    window.addEventListener("pointercancel", this.onPointerUp);
    area.addEventListener("contextmenu", function (e) { if (self.active) e.preventDefault(); });
    window.addEventListener("blur", this.onBlur);
  }

  Input.prototype.press = function (id, t) {
    if (this.down.has(id)) return;
    this.down.add(id);
    if (this.ignored.has(id)) return;
    this.count++;
    if (this.count === 1) { this.queue.push([t, 1]); this.lastPress = t; }
  };
  Input.prototype.release = function (id, t) {
    if (!this.down.has(id)) return;
    this.down.delete(id);
    if (this.ignored.has(id)) { this.ignored.delete(id); return; }
    this.count = Math.max(0, this.count - 1);
    if (this.count === 0) this.queue.push([t, 0]);
  };
  // Forget everything held right now: those keys/fingers must be lifted before they count again.
  Input.prototype.clear = function () {
    const self = this;
    this.down.forEach(function (id) { self.ignored.add(id); });
    this.count = 0;
    this.queue.length = 0;
    this.held = false;
  };
  // Collect the input for one physics tick that ends at real time t (ms).
  // Returns pressed (went down this tick), released (went up), and held (down at the end).
  Input.prototype.take = function (t, out) {
    out.press = false; out.release = false;
    const q = this.queue;
    while (q.length && q[0][0] <= t) {
      const e = q.shift();
      if (e[1]) { out.press = true; this.held = true; } else { out.release = true; this.held = false; }
    }
    out.held = !!this.held;
    return out;
  };

  GR.Input = Input;
})();
