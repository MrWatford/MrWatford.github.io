// Milestone 22, Part D: Blockhaven's own music discs, played by a Jukebox with the note-block instruments (audio.js).
// Every tune here was written for Blockhaven. Pitches use the note-block scale: 0 = F#3 … 24 = F#5
// (6 = C4, 8 = D4, 10 = E4, 11 = F4, 13 = G4, 15 = A4, 17 = B4, 18 = C5, 20 = D5, 22 = E5).

// "13 1, 15 .5, r 2" → [[pitch | null, beats], …]
const seq = text => text.trim().split(/\s*,\s*/).map(tok => { const [p, d] = tok.trim().split(/\s+/); return [p === "r" ? null : +p, +d]; });
const times = (s, n) => Array(n).fill(s).join(", ");
// broken chords: each root plays the offsets one after another, `step` beats apart, for `beats` beats
const arp = (roots, offsets, step, beats) => roots.map(r => Array.from({ length: Math.round(beats / step) }, (_, i) => `${r + offsets[i % offsets.length]} ${step}`).join(", ")).join(", ");
const held = (roots, beats) => roots.map(r => `${r} ${beats}`).join(", ");

const sunriseA = "6 1, 10 1, 13 1, 18 2, 17 1, 15 2, 11 1, 15 1, 18 1, 20 2, 18 1, 17 2, 13 1, 15 1, 17 1, 18 1, 20 1, 22 1, 20 2, 18 1, 15 1, 13 1, 10 1, 6 4";
const sunriseB = "18 2, 17 1, 15 1, 13 2, 15 2, 17 2, 15 1, 13 1, 11 2, 10 2, 8 1, 10 1, 11 1, 13 1, 15 2, 13 2, 10 2, 8 2, 6 4";
const waltz = "15 2, 18 1, 22 2, 20 1, 18 2, 17 1, 15 3, 13 2, 15 1, 17 2, 18 1, 20 3, 17 3, 15 2, 18 1, 22 2, 23 1, 22 2, 20 1, 18 3, 17 2, 15 1, 13 2, 17 1, 15 6";
const caves = "10 2, r 1, 13 1, 17 3, r 1, 15 2, 13 2, 10 4, 8 2, r 1, 10 1, 13 3, r 1, 11 2, 8 2, 6 4";
const breeze = "13 1, 17 1, 20 2, 22 1, 20 1, 17 2, 15 1, 17 1, 13 2, 10 2, 8 2, 13 1, 17 1, 20 2, 24 1, 22 1, 20 2, 17 1, 15 1, 13 2, 13 4";
const starlight = "22 1, 20 1, 17 1, 13 1, 15 2, 17 2, 22 1, 24 1, 22 1, 20 1, 17 4, 13 1, 15 1, 17 1, 20 1, 22 2, 20 2, 17 1, 15 1, 13 1, 10 1, 10 4";

// [key, title, label color, beats per minute, parts]
export const DISCS = [
  ["sunrise", "Sunrise Over Blockhaven", "#f0a030", 104, [
    ["harp", times(sunriseA, 1) + ", " + sunriseB + ", " + sunriseA],
    ["bass", held([6, 6, 11, 11, 13, 13, 6, 6, 13, 13, 11, 11, 8, 8, 13, 6, 6, 6, 11, 11, 13, 13, 6, 6], 4)]]],
  ["waltz", "Lantern Waltz", "#e04a3a", 132, [
    ["flute", times(waltz, 2)],
    ["guitar", times(arp([3, 3, 11, 3, 1, 1, 8, 3, 3, 11, 6, 3, 1, 8, 3, 3], [0, 7, 12], 1, 3), 2)]]],
  ["caves", "Deep Cave Echoes", "#4a6ad8", 70, [
    ["bell", times(caves, 2)],
    ["didgeridoo", times(held([3, 1, 3, 0], 8), 2)]]],
  ["breeze", "Sea Breeze", "#2ab0a0", 120, [
    ["chime", times(breeze, 3)],
    ["banjo", times(arp([1, 1, 6, 8, 1, 1, 6, 1], [0, 7, 12, 7], 0.5, 4), 3)]]],
  ["starlight", "Starlight", "#a050e0", 140, [
    ["bit", times(starlight, 3)],
    ["pling", times(arp([10, 6, 13, 8], [0, 7, 12, 7], 0.5, 8), 3)]]]
].map(([key, title, color, bpm, parts]) => ({ key, title, color, bpm, parts: parts.map(([inst, s]) => ({ inst, notes: seq(s) })) }));

// A song turned into timed notes: [[seconds, instrument, pitch], …] (sorted), and how long it lasts
export function scoreOf(disc) {
  const out = [], beat = 60 / disc.bpm;
  let len = 0;
  for (const part of disc.parts) {
    let t = 0;
    for (const [p, d] of part.notes) { if (p !== null && p >= 0 && p <= 24) out.push([t * beat, part.inst, p]); t += d; }
    len = Math.max(len, t * beat);
  }
  out.sort((a, b) => a[0] - b[0]);
  return { notes: out, length: len };
}
