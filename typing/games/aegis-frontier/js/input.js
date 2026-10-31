// Aegis Frontier: keyboard + mouse. Keys are read by name ("KeyW"), so layouts don't matter.
export class Input {
  constructor(canvas) {
    this.canvas = canvas;
    this.down = new Set();
    this.pressed = new Set();   // pressed since last frame
    this.mdx = 0; this.mdy = 0; this.wheel = 0;
    this.mouse = [false, false, false];
    this.mousePressed = [false, false, false];
    this.locked = false;
    this.enabled = false;
    this.ctrlCrouch = false;
    this.onLockChange = null;
    this.lockError = null;

    addEventListener("keydown", (e) => {
      if (!this.enabled) return;
      if (["Tab", "Space", "ArrowUp", "ArrowDown"].includes(e.code) || (e.code.startsWith("Digit") && this.locked)) e.preventDefault();
      if (!this.down.has(e.code)) this.pressed.add(e.code);
      this.down.add(e.code);
    });
    addEventListener("keyup", (e) => this.down.delete(e.code));
    addEventListener("blur", () => { this.down.clear(); this.mouse = [false, false, false]; });
    canvas.addEventListener("mousedown", (e) => {
      if (!this.enabled || !this.locked) return;
      this.mouse[e.button] = true; this.mousePressed[e.button] = true;
    });
    addEventListener("mouseup", (e) => { this.mouse[e.button] = false; });
    canvas.addEventListener("contextmenu", (e) => e.preventDefault());
    addEventListener("mousemove", (e) => {
      if (!this.locked) return;
      // ignore the occasional huge spike some browsers send right after locking
      if (Math.abs(e.movementX) > 400 || Math.abs(e.movementY) > 400) return;
      this.mdx += e.movementX; this.mdy += e.movementY;
    });
    addEventListener("wheel", (e) => { if (this.locked) { this.wheel += Math.sign(e.deltaY); } }, { passive: true });
    document.addEventListener("pointerlockchange", () => {
      this.locked = document.pointerLockElement === canvas;
      if (!this.locked) { this.down.clear(); this.mouse = [false, false, false]; }
      this.onLockChange && this.onLockChange(this.locked);
    });
    document.addEventListener("pointerlockerror", () => { this.lockError && this.lockError(); });
  }
  lock() {
    try {
      const p = this.canvas.requestPointerLock({ unadjustedMovement: false });
      if (p && p.catch) p.catch(() => this.lockError && this.lockError());
    } catch (e) { this.lockError && this.lockError(); }
  }
  unlock() { if (document.pointerLockElement) document.exitPointerLock(); }
  key(code) { return this.down.has(code); }
  hit(code) { return this.pressed.has(code); }
  get crouch() { return this.down.has("KeyC") || (this.ctrlCrouch && (this.down.has("ControlLeft") || this.down.has("ControlRight"))); }
  get crouchHit() { return this.pressed.has("KeyC") || (this.ctrlCrouch && (this.pressed.has("ControlLeft") || this.pressed.has("ControlRight"))); }
  endFrame() { this.pressed.clear(); this.mousePressed = [false, false, false]; this.mdx = 0; this.mdy = 0; this.wheel = 0; }
}
