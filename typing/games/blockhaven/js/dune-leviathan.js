// One head controls the encounter. Body segments only follow its sampled trail.
export const DUNE_SEGMENTS = 10;
const STEP = 0.5;

export class DuneTrail {
  constructor(x, y, z, yaw, spacing = 4, curled = false) {
    this.spacing = spacing;
    this.yaw = yaw;
    this.curled = curled;
    this.capacity = DUNE_SEGMENTS * spacing / STEP + 2;
    this.points = Array.from({ length: this.capacity }, () => ({ x: 0, y: 0, z: 0 }));
    this.samples = Array.from({ length: DUNE_SEGMENTS }, () => ({ x: 0, y: 0, z: 0 }));
    this.reset(x, y, z, yaw);
  }

  reset(x, y, z, yaw = this.yaw) {
    this.yaw = yaw;
    this.head = 0; this.fraction = 0;
    for (let i = 0; i < this.capacity; i++) {
      const distance = ((this.capacity - i) % this.capacity) * STEP;
      const progress = Math.min(1, distance / (DUNE_SEGMENTS * this.spacing));
      const side = this.curled ? Math.sin(progress * Math.PI) * Math.min(14, this.spacing * 2.5) : 0;
      const point = this.points[i];
      point.x = x + Math.sin(yaw) * distance + Math.cos(yaw) * side;
      point.y = y - (this.curled ? 7 * progress ** 1.15 : 0);
      point.z = z + Math.cos(yaw) * distance - Math.sin(yaw) * side;
    }
  }

  follow(x, y, z, yaw = this.yaw) {
    this.yaw = yaw;
    let point = this.points[this.head];
    let distance = Math.hypot(x - point.x, y - point.y, z - point.z);
    if (distance > this.capacity * STEP) {
      this.reset(x, y, z, yaw);
      return;
    }
    while (distance >= STEP) {
      const fraction = STEP / distance;
      const next = this.points[(this.head + 1) % this.capacity];
      next.x = point.x + (x - point.x) * fraction;
      next.y = point.y + (y - point.y) * fraction;
      next.z = point.z + (z - point.z) * fraction;
      this.head = (this.head + 1) % this.capacity;
      point = next;
      distance = Math.hypot(x - point.x, y - point.y, z - point.z);
    }
    this.fraction = distance / STEP;
  }

  segment(index) {
    const offset = (index + 1) * this.spacing / STEP;
    const i = (this.head + this.capacity - offset) % this.capacity;
    const a = this.points[i], b = this.points[(i + 1) % this.capacity], out = this.samples[index];
    out.x = a.x + (b.x - a.x) * this.fraction;
    out.y = a.y + (b.y - a.y) * this.fraction;
    out.z = a.z + (b.z - a.z) * this.fraction;
    return out;
  }
}

// Transient visual state: never used for encounter decisions or saved progress.
export class DunePose {
  constructor(x, y, z, yaw, resting) {
    this.yaw = yaw; this.resting = resting;
    this.head = { x, y, z };
    this.points = Array.from({ length: DUNE_SEGMENTS }, () => ({ x: 0, y: 0, z: 0, ready: false }));
  }

  update(x, y, z, yaw, resting, dt, jumpDistance) {
    const jumped = Math.hypot(x - this.head.x, y - this.head.y, z - this.head.z) > jumpDistance;
    if (jumped) {
      this.yaw = yaw; this.resting = resting;
      for (const point of this.points) point.ready = false;
    } else {
      const turn = Math.atan2(Math.sin(yaw - this.yaw), Math.cos(yaw - this.yaw));
      this.yaw += turn * (1 - Math.exp(-8 * dt));
      this.resting += (resting - this.resting) * (1 - Math.exp(-5 * dt));
    }
    this.head.x = x; this.head.y = y; this.head.z = z;
    return jumped;
  }

  segment(index, x, y, z, previousX, previousY, previousZ, limit, dt) {
    const point = this.points[index];
    const blend = point.ready ? 1 - Math.exp(-10 * dt) : 1;
    point.x += (x - point.x) * blend;
    point.y += (y - point.y) * blend;
    point.z += (z - point.z) * blend;
    // Preserve neck clearance while the visual heading catches up with a turn.
    const backX = Math.sin(this.yaw), backZ = Math.cos(this.yaw);
    const back = (point.x - this.head.x) * backX + (point.z - this.head.z) * backZ;
    const clearance = limit * 0.9;
    if (back < clearance) { point.x += (clearance - back) * backX; point.z += (clearance - back) * backZ; }
    if (index === 0) {
      const axial = Math.min(limit, Math.max(clearance, back));
      const side = (point.x - this.head.x) * backZ - (point.z - this.head.z) * backX;
      const dy = point.y - this.head.y, radius = Math.hypot(side, dy);
      const available = Math.sqrt(Math.max(0, limit * limit - axial * axial));
      const ratio = radius > available ? available / radius : 1;
      point.x = this.head.x + axial * backX + side * ratio * backZ;
      point.y = this.head.y + dy * ratio;
      point.z = this.head.z + axial * backZ - side * ratio * backX;
    }
    const dx = point.x - previousX, dy = point.y - previousY, dz = point.z - previousZ;
    const length = Math.hypot(dx, dy, dz);
    if (length > limit) {
      const ratio = limit / length;
      point.x = previousX + dx * ratio;
      point.y = previousY + dy * ratio;
      point.z = previousZ + dz * ratio;
    }
    point.ready = true;
    return point;
  }
}

export function dunePhase(hp, maxHp) {
  return hp > maxHp * 0.75 ? 1 : hp > maxHp * 0.5 ? 2 : hp > maxHp * 0.25 ? 3 : 4;
}

export function duneRitualWindow(cycle, age) {
  return cycle.step === "surface" && age >= cycle.ritualFrom && age < cycle.ritualUntil && !cycle.ritualUsed;
}
