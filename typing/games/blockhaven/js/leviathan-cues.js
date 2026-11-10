const clamp = value => Math.max(0, Math.min(1, value));

// Reads encounter deadlines; never schedules damage or changes encounter state.
export class LeviathanCues {
  constructor() {
    this.attack = null; this.deadline = Infinity; this.releasedAt = -Infinity;
    this.value = { spread: 0.12, pitch: -0.12, tooth: 0.15, charge: 0, recovering: false };
  }

  sample(cycle, age, emerged, reducedMotion) {
    const step = cycle?.step;
    const pending = cycle?.attack && (step === "surface" || step === "attack" || step === "shrapnel" || step === "judgment" || step === "fury");
    const recovering = step === "recover";
    if (this.attack && !pending && age >= this.deadline && (recovering || step === "surface")) this.releasedAt = age;
    this.attack = pending ? cycle.attack : null;
    this.deadline = pending ? cycle.attackAt : Infinity;
    const awakening=step==="awakening"&&[cycle.arrivalFrom,cycle.until,age].every(Number.isFinite)&&cycle.until>cycle.arrivalFrom;
    const awakenCharge=awakening?clamp((age-cycle.arrivalFrom)/(cycle.until-cycle.arrivalFrom)):0;
    const roarAt=Number.isFinite(cycle?.introCircle?.roaredAt)?cycle.introCircle.roaredAt:cycle?.awakenedAt;
    const roar=step==="recover"&&Number.isFinite(roarAt)&&age>=roarAt&&age<roarAt+1.2;
    const roarCharge=roar?1-(age-roarAt)/1.2:0;
    const charge = awakening ? awakenCharge*.75 : roar ? roarCharge*.75 : pending ? Number.isFinite(cycle.attackAt) ? clamp(1 - (cycle.attackAt - age) / 1.25) : 1 : 0;
    const recoilTime = (age - this.releasedAt) / 0.35;
    const recoil = !reducedMotion && recoilTime >= 0 && recoilTime < 1 ? Math.sin(recoilTime * Math.PI) : 0;
    const warning = step === "warning" ? 0.55 : 0.12;
    const value = this.value;
    value.spread = awakening ? .18+awakenCharge*.4 : roar ? .12+roarCharge*.58 : pending ? 0.2 + charge * 0.58 : warning + recoil * 0.16;
    value.pitch = (emerged || step === "rising" ? -0.12 : 0.24) - charge * 0.18 + recoil * 0.25;
    value.tooth = 0.15 - charge * 0.27;
    value.charge = charge;
    value.recovering = recovering;
    return value;
  }
}
