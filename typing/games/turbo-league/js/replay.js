// Turbo League — instant replays.
// The recorder keeps the last few seconds of the match as tiny "snapshots" (where each car and the
// ball were, and whether each car was boosting). No video is stored, so it costs almost nothing.
// The director then plays a goal back with three camera shots and slow motion near the end.

const CAR_STRIDE = 9; // x y z, qx qy qz qw, flags (1 = boosting, 2 = supersonic), steer

export class Recorder {
  constructor(seconds = 7, hz = 60) { this.max = Math.round(seconds * hz); this.frames = []; this.every = Math.round(120 / hz); }
  clear() { this.frames.length = 0; }
  // called after every physics step; keeps every 2nd one (60 per second)
  record(world, ballQ) {
    if (world.tick % this.every) return;
    const cars = new Float32Array(world.cars.length * CAR_STRIDE);
    world.cars.forEach((c, i) => {
      const o = i * CAR_STRIDE;
      cars[o] = c.pos.x; cars[o + 1] = c.pos.y; cars[o + 2] = c.pos.z;
      cars[o + 3] = c.q.x; cars[o + 4] = c.q.y; cars[o + 5] = c.q.z; cars[o + 6] = c.q.w;
      cars[o + 7] = (c.boosting ? 1 : 0) | (c.supersonic ? 2 : 0);
      cars[o + 8] = c.input ? c.input.steer || 0 : 0;
    });
    const b = world.ball;
    this.frames.push({ t: world.time, cars, ball: new Float32Array([b.pos.x, b.pos.y, b.pos.z, ballQ.x, ballQ.y, ballQ.z, ballQ.w]) });
    if (this.frames.length > this.max) this.frames.shift();
  }
  slice(t0, t1) { return this.frames.filter((f) => f.t >= t0 && f.t <= t1); }
}

// Finds the two snapshots around time t and how far between them we are.
export function sample(frames, t) {
  if (!frames.length) return null;
  if (t <= frames[0].t) return { a: frames[0], b: frames[0], k: 0 };
  const last = frames[frames.length - 1];
  if (t >= last.t) return { a: last, b: last, k: 0 };
  let lo = 0, hi = frames.length - 1;
  while (hi - lo > 1) { const mid = (lo + hi) >> 1; if (frames[mid].t <= t) lo = mid; else hi = mid; }
  const a = frames[lo], b = frames[hi];
  return { a, b, k: (t - a.t) / Math.max(1e-6, b.t - a.t) };
}
export const STRIDE = CAR_STRIDE;

// The replay plan for one goal: which part of the recording, which camera when, and how fast.
export function planReplay(frames, goal) {
  const tGoal = goal.time;
  const start = Math.max(frames[0].t, tGoal - 5.2), end = Math.min(frames[frames.length - 1].t, tGoal + 0.9);
  return {
    frames, start, end, tGoal, t: start,
    // [from, to, camera, speed]
    shots: [
      [start, tGoal - 2.0, "chase", 0.85],
      [tGoal - 2.0, tGoal - 0.9, "tv", 0.6],
      [tGoal - 0.9, end, "goal", 0.33],
    ],
  };
}
export function shotAt(plan, t) { for (const s of plan.shots) if (t < s[1]) return s; return plan.shots[plan.shots.length - 1]; }
