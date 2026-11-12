// Default control layouts (kept separate so saved-progress code can load without a browser).
// solo = one player on the keyboard. p1 / p2 = two players sharing one keyboard.
export const DEFAULT_KEYS = {
  solo: { l: "KeyA", r: "KeyD", u: "KeyW", d: "KeyS", lp: "KeyJ", hp: "KeyK", lk: "KeyU", hk: "KeyI", blk: "KeyL", sp: "KeyO", dash: "ShiftLeft", ult: "Space", thr: "KeyH" },
  p1: { l: "KeyA", r: "KeyD", u: "KeyW", d: "KeyS", lp: "KeyF", hp: "KeyG", lk: "KeyR", hk: "KeyT", blk: "KeyQ", sp: "KeyE", dash: "ShiftLeft", ult: "KeyC", thr: "KeyV" },
  p2: { l: "ArrowLeft", r: "ArrowRight", u: "ArrowUp", d: "ArrowDown", lp: "KeyK", hp: "KeyL", lk: "KeyI", hk: "KeyO", blk: "Semicolon", sp: "KeyP", dash: "ShiftRight", ult: "Enter", thr: "Period" },
};
export const DEFAULT_PAD = { lp: 2, hp: 3, lk: 0, hk: 1, blk: 5, sp: 7, dash: 4, ult: 6, thr: 10 };
