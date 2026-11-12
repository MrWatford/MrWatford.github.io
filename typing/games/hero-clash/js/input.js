// Hero Clash — keyboard, gamepad, and touch input. Everything ends up as the
// same simple "which buttons are down" object the combat engine reads.
import { blankInput } from "./combat.js";

export const ACTIONS = [
  ["l", "Move left"], ["r", "Move right"], ["u", "Jump"], ["d", "Crouch"],
  ["lp", "Light punch"], ["hp", "Heavy punch"], ["lk", "Light kick"], ["hk", "Heavy kick"],
  ["blk", "Block"], ["sp", "Special"], ["dash", "Dash / dodge"], ["ult", "Ultimate"], ["thr", "Throw"],
];
import { DEFAULT_KEYS, DEFAULT_PAD } from "./input-defaults.js";
export { DEFAULT_KEYS, DEFAULT_PAD };
export const PAD_NAMES = ["A / Cross", "B / Circle", "X / Square", "Y / Triangle", "LB / L1", "RB / R1", "LT / L2", "RT / R2", "Back", "Start", "L stick click", "R stick click", "D-pad up", "D-pad down", "D-pad left", "D-pad right"];

export function keyName(code) {
  if (!code) return "—";
  return code.replace(/^Key/, "").replace(/^Digit/, "").replace("ArrowLeft", "←").replace("ArrowRight", "→").replace("ArrowUp", "↑").replace("ArrowDown", "↓")
    .replace("ShiftLeft", "Left Shift").replace("ShiftRight", "Right Shift").replace("Semicolon", ";").replace("Period", ".").replace("Comma", ",").replace("Slash", "/")
    .replace("Space", "Space").replace("Numpad", "Num ").replace("ControlLeft", "Left Ctrl").replace("ControlRight", "Right Ctrl").replace("Quote", "'").replace("BracketLeft", "[").replace("BracketRight", "]").replace("Backslash", "\\").replace("Minus", "-").replace("Equal", "=");
}
// Two layouts clash if they share a key. Returns a list of the shared keys.
export function overlaps(a, b) { const s = new Set(Object.values(a)); return Object.values(b).filter((k) => s.has(k)); }
export function duplicates(m) { const seen = {}, out = []; for (const [a, k] of Object.entries(m)) { if (seen[k]) out.push(k); seen[k] = a; } return out; }

export class Input {
  constructor() {
    this.down = new Set(); this.touch = blankInput(); this.keys = JSON.parse(JSON.stringify(DEFAULT_KEYS)); this.pad = Object.assign({}, DEFAULT_PAD);
    this.menu = []; this.padPrev = [{}, {}]; this.capture = null; this.padSeen = 0;
    addEventListener("keydown", (e) => {
      if (this.capture) { e.preventDefault(); const c = this.capture; this.capture = null; c(e.code); return; }
      if (this.gameKeys && (this.gameKeys.has(e.code) || e.code === "Tab")) e.preventDefault();
      if (!e.repeat || e.code.startsWith("Arrow")) this.menuKey(e);
      this.down.add(e.code);
    });
    addEventListener("keyup", (e) => this.down.delete(e.code));
    addEventListener("blur", () => { this.down.clear(); this.touch = blankInput(); });
    this.setKeys(this.keys);
  }
  setKeys(k) { this.keys = k; this.gameKeys = new Set([...Object.values(k.solo), ...Object.values(k.p1), ...Object.values(k.p2), "Space", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"]); }
  menuKey(e) {
    const c = e.code, t = e.target && e.target.tagName;
    if (t === "INPUT" || t === "SELECT" || t === "TEXTAREA") { if (c === "Escape") this.menu.push("back"); return; }
    const m = c === "ArrowUp" || c === "KeyW" ? "up" : c === "ArrowDown" || c === "KeyS" ? "down" : c === "ArrowLeft" || c === "KeyA" ? "left" : c === "ArrowRight" || c === "KeyD" ? "right"
      : c === "Enter" || c === "Space" || c === "KeyJ" ? "ok" : c === "Escape" || c === "Backspace" ? "back" : c === "KeyP" ? "pause" : null;
    if (m) { this.menu.push(m); if (m !== "pause") e.preventDefault(); }
  }
  pads() { const p = navigator.getGamepads ? Array.from(navigator.getGamepads()).filter((g) => g && g.connected) : []; this.padSeen = p.length; return p; }
  // menu presses from gamepads (called once per frame)
  pollMenu() {
    this.pads().slice(0, 2).forEach((g, i) => {
      const prev = this.padPrev[i], now = { up: g.buttons[12]?.pressed || g.axes[1] < -0.6, down: g.buttons[13]?.pressed || g.axes[1] > 0.6, left: g.buttons[14]?.pressed || g.axes[0] < -0.6, right: g.buttons[15]?.pressed || g.axes[0] > 0.6, ok: g.buttons[0]?.pressed, back: g.buttons[1]?.pressed, pause: g.buttons[9]?.pressed };
      for (const k in now) if (now[k] && !prev[k]) this.menu.push(k);
      this.padPrev[i] = now;
    });
    const m = this.menu; this.menu = []; return m;
  }
  fromKeys(map) { const o = blankInput(); for (const a in map) if (this.down.has(map[a])) o[a] = true; return o; }
  fromPad(g) {
    const o = blankInput(); if (!g) return o;
    o.l = g.buttons[14]?.pressed || g.axes[0] < -0.45; o.r = g.buttons[15]?.pressed || g.axes[0] > 0.45;
    o.u = g.buttons[12]?.pressed || g.axes[1] < -0.6; o.d = g.buttons[13]?.pressed || g.axes[1] > 0.5;
    for (const a in this.pad) if (g.buttons[this.pad[a]]?.pressed) o[a] = true;
    return o;
  }
  // slot 0 / 1 → the buttons that player is holding. twoPlayer chooses the shared-keyboard layouts.
  read(slot, twoPlayer) {
    const pads = this.pads();
    let o;
    if (!twoPlayer) { o = this.fromKeys(this.keys.solo); merge(o, this.fromPad(pads[0])); merge(o, this.touch); }
    else {
      o = this.fromKeys(slot === 0 ? this.keys.p1 : this.keys.p2);
      // one gamepad → player 2 gets it (player 1 keeps the keyboard); two gamepads → one each
      const g = pads.length >= 2 ? pads[slot] : pads.length === 1 && slot === 1 ? pads[0] : null;
      merge(o, this.fromPad(g)); if (slot === 0) merge(o, this.touch);
    }
    if (o.l && o.r) o.l = o.r = false;
    return o;
  }
  anyPadButton() { for (const g of this.pads()) for (let i = 0; i < g.buttons.length; i++) if (g.buttons[i].pressed) return i; return -1; }
}
function merge(a, b) { for (const k in b) if (b[k]) a[k] = true; }

// ---------- touch controls ----------
export function buildTouch(root, input, prefs) {
  root.innerHTML = "";
  root.style.setProperty("--ts", prefs.touchSize || 1); root.style.setProperty("--to", prefs.touchOpacity === undefined ? 0.75 : prefs.touchOpacity);
  root.classList.toggle("swap", !!prefs.touchSwap);
  const pad = document.createElement("div"); pad.className = "t-pad"; pad.innerHTML = '<div class="t-knob"></div>'; root.appendChild(pad);
  const knob = pad.firstChild;
  const setDir = (x, y) => { const t = input.touch; t.l = x < -0.35; t.r = x > 0.35; t.u = y < -0.5; t.d = y > 0.45; knob.style.transform = `translate(${x * 34}%, ${y * 34}%)`; };
  let pid = null;
  const move = (e) => { const b = pad.getBoundingClientRect(); let x = (e.clientX - b.left) / b.width * 2 - 1, y = (e.clientY - b.top) / b.height * 2 - 1; const m = Math.hypot(x, y); if (m > 1) { x /= m; y /= m; } setDir(x, y); };
  pad.addEventListener("pointerdown", (e) => { pid = e.pointerId; pad.setPointerCapture(pid); move(e); e.preventDefault(); });
  pad.addEventListener("pointermove", (e) => { if (e.pointerId === pid) move(e); });
  const end = (e) => { if (e.pointerId === pid) { pid = null; setDir(0, 0); } };
  pad.addEventListener("pointerup", end); pad.addEventListener("pointercancel", end);
  const btns = document.createElement("div"); btns.className = "t-btns"; root.appendChild(btns);
  for (const [a, label, cls] of [["lp", "LP", "p"], ["hp", "HP", "p"], ["sp", "SP", "s"], ["lk", "LK", "k"], ["hk", "HK", "k"], ["blk", "BLOCK", "b"], ["thr", "THROW", "t"], ["dash", "DASH", "t"], ["ult", "ULT", "u"]]) {
    const b = document.createElement("button"); b.className = "t-btn " + cls; b.textContent = label; b.dataset.a = a; btns.appendChild(b);
    const on = (e) => { input.touch[a] = true; b.classList.add("on"); e.preventDefault(); try { b.setPointerCapture(e.pointerId); } catch (_) {} };
    const off = () => { input.touch[a] = false; b.classList.remove("on"); };
    b.addEventListener("pointerdown", on); b.addEventListener("pointerup", off); b.addEventListener("pointercancel", off); b.addEventListener("lostpointercapture", off);
    b.addEventListener("contextmenu", (e) => e.preventDefault());
  }
}
