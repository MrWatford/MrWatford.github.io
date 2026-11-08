const clamp = n => Math.max(0, Math.min(1, n));
export const DUNE_ATTACK_RECOVERY = 0.8;

// Presentation only. The AI owns targets, deadlines, movement and damage.
export class DuneAttackMotion {
  constructor() {
    this.pending = null;
    this.deadline = Infinity;
    this.phase = 0;
    this.releasedAt = -Infinity;
    this.value = { tail: 0, lift: 0, roll: 0, pitch: 0 };
  }

  sample(cycle, age, reducedMotion = false) {
    const out = this.value;
    out.tail = out.lift = out.roll = out.pitch = 0;
    if (!Number.isFinite(age) || cycle?.step !== 'surface') {
      this.pending = null; this.releasedAt = -Infinity;
      return out;
    }
    const attack = cycle.attack;
    const valid = attack && [2, 3, 4].includes(attack.phase);
    if (valid) {
      this.pending = attack; this.deadline = cycle.attackAt;
      this.phase = attack.phase; this.releasedAt = -Infinity;
    } else if (this.pending) {
      // Early cancellation is not a strike. Never manufacture a release on dive.
      if (age >= this.deadline) this.releasedAt = age;
      this.pending = null;
    }
    const from = Number.isFinite(attack?.from) ? attack.from : this.deadline - 1.25;
    const charge = valid ? Number.isFinite(this.deadline) && this.deadline > from
      ? clamp((age - from) / (this.deadline - from)) : 1 : 0;
    const recovery = (age - this.releasedAt) / DUNE_ATTACK_RECOVERY;
    const strike = recovery >= 0 && recovery < 1 ? Math.sin(Math.PI * recovery) : 0;
    const ease = charge * charge * (3 - 2 * charge);
    const scale = reducedMotion ? 0.2 : 1;
    if (this.phase === 2) {
      out.tail = (-1.8 * ease + 2.8 * strike) * scale;
      out.roll = (-0.08 * ease + 0.12 * strike) * scale;
    } else if (this.phase === 3) {
      out.tail = (1.2 * ease - 1.2 * strike) * scale;
      out.lift = (0.65 * ease + 0.35 * strike) * scale;
      out.pitch = -0.1 * ease * scale;
    } else if (this.phase === 4) {
      out.lift = (0.35 * ease - 0.5 * strike) * scale;
      out.pitch = (-0.18 * ease + 0.3 * strike) * scale;
      out.roll = 0.04 * ease * scale;
    }
    return out;
  }
}
