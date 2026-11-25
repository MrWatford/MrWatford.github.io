// Inventory slots: 9 hotbar slots + 27 backpack slots, then 4 armor slots (36 cap, 37 chest, 38 legs, 39 boots), then the offhand (40).
// Each slot is null or { id, n, dur? }.
import { itemDef, TAGS } from "./blocks.js";

export const maxStack = id => (itemDef(id) ? itemDef(id).stack : 64);
export const canStack = (a, b) => a.id === b.id && maxStack(a.id) > 1 && (a.name || "") === (b.name || "");
export const matches = (id, want) => (typeof want === "string" ? TAGS[want].includes(id) : id === want);
export function newStack(id, n = 1) {
  const d = itemDef(id), s = { id, n };
  if (d && d.tool) s.dur = d.tool.dur;
  if (d && d.armor) s.dur = d.armor.dur;
  return s;
}
export const MAIN = 36, OFF = 40;

export class Inventory {
  constructor(size = 41) { this.slots = new Array(size).fill(null); }

  // Adds items; returns how many did not fit
  add(id, n = 1, stack = null) {
    const max = maxStack(id), incoming = stack || newStack(id);
    if (max > 1) for (let i = 0; i < MAIN; i++) {
      const s = this.slots[i];
      if (s && canStack(s, incoming) && s.n < max) { const k = Math.min(n, max - s.n); s.n += k; n -= k; if (!n) return 0; }
    }
    for (let i = 0; i < MAIN && n > 0; i++) {
      if (!this.slots[i]) { const k = Math.min(n, max); this.slots[i] = { ...incoming, n: k }; n -= k; }
    }
    return n;
  }
  count(want) { let c = 0; for (let i = 0; i < MAIN; i++) { const s = this.slots[i]; if (s && matches(s.id, want)) c += s.n; } return c; }
  remove(want, n) {
    for (let i = MAIN - 1; i >= 0 && n > 0; i--) {
      const s = this.slots[i];
      if (s && matches(s.id, want)) { const k = Math.min(n, s.n); s.n -= k; n -= k; if (!s.n) this.slots[i] = null; }
    }
    return n === 0;
  }
  roomFor(id, n) {
    const max = maxStack(id); let room = 0;
    const incoming = { id };
    for (let i = 0; i < MAIN; i++) { const s = this.slots[i]; room += !s ? max : canStack(s, incoming) ? max - s.n : 0; }
    return room >= n;
  }
  toJSON() { return this.slots.map(s => (s ? { ...s } : null)); }
  load(arr) { this.slots = this.slots.map((_, i) => (arr && arr[i] && itemDef(arr[i].id) ? { ...arr[i] } : null)); }
}
