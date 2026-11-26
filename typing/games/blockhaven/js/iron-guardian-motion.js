import { Sound } from "./audio.js";
import { updateIronGuardianSurface } from "./iron-guardian-model.js";

export const GUARDIAN_DEATH = 1.04;
export const GUARDIAN_STRIKE = .54;
const TAU = Math.PI * 2;
const UPPER = .72, LOWER = .67, STRIDE = .97;
const clamp = (value, lo, hi) => Math.max(lo, Math.min(hi, value));
const smooth = value => {
  const t = clamp(value, 0, 1);
  return t * t * (3 - 2 * t);
};

function poseLeg(parts, suffix, phase, stride, lowered) {
  const stance = phase < .5;
  const progress = phase * 2 - (stance ? 0 : 1);
  const z = (stance ? .25 - progress * .5 : -.25 + smooth(progress) * .5) * STRIDE * stride;
  const lift = stance ? 0 : Math.sin(progress * Math.PI) ** 2 * .175 * stride;
  const down = UPPER + LOWER - lowered - lift;
  const length = Math.min(UPPER + LOWER, Math.hypot(down, z));
  const hip = Math.atan2(-z, down) -
    Math.acos(clamp((UPPER ** 2 + length ** 2 - LOWER ** 2) / (2 * UPPER * length), -1, 1));
  const knee = Math.PI - Math.acos(clamp((UPPER ** 2 + LOWER ** 2 - length ** 2) / (2 * UPPER * LOWER), -1, 1));
  parts["leg" + suffix].rotation.x = hip;
  parts["knee" + suffix].rotation.x = knee;
  parts["foot" + suffix].rotation.x = -hip - knee;
}

function updateGaze(manager, e, dt, distanceSq, stride, reducedMotion) {
  const motion = e.guardianMotion, parts = e.parts, player = manager.ctx.player();
  if (distanceSq > 24 ** 2) {
    parts.head.rotation.x = parts.head.rotation.y = 0;
    return 0;
  }
  if (e.age >= motion.nextLook) {
    motion.nextLook = e.age + .68 + e.guardianView.variant * .07;
    let villager = null, best = 4.6 ** 2;
    for (const entity of manager.list) {
      if (!entity.def.villager || entity.dead || entity.gone) continue;
      const d = (entity.pos.x - e.pos.x) ** 2 + (entity.pos.y - e.pos.y) ** 2 + (entity.pos.z - e.pos.z) ** 2;
      if (d < best) { best = d; villager = entity; }
    }
    motion.villager = villager;
  }
  const phase = (e.age + e.guardianView.variant * 6.83) % 27;
  const villager = motion.villager;
  const companion = villager && !villager.dead && !villager.gone && phase < 10 ? villager : null;
  const target = e.guardianTarget || (distanceSq < 49 && !player?.spectator ? player : null) || companion;
  let yaw = reducedMotion ? 0 : Math.sin(e.age * .46 + e.guardianView.variant) * .31;
  let pitch = .035;
  if (target) {
    const dx = target.pos.x - e.pos.x, dz = target.pos.z - e.pos.z;
    const relative = Math.atan2(-dx, -dz) - e.yaw;
    yaw = clamp(Math.atan2(Math.sin(relative), Math.cos(relative)), -.83, .83);
    pitch = clamp(Math.atan2(e.pos.y + 3.1 - target.pos.y - (target.eye || (target.h || 1.9) * .82),
      Math.hypot(dx, dz)), -.35, .52);
  }
  const factor = 1 - Math.exp(-dt * 6);
  parts.head.rotation.y += (yaw - parts.head.rotation.y) * factor;
  parts.head.rotation.x += (pitch - parts.head.rotation.x) * factor;
  const offer = companion && !e.guardianTarget && !e.puppet && stride < .13 && phase < 3
    && Math.abs(yaw) < .74 && Math.hypot(companion.pos.x - e.pos.x, companion.pos.z - e.pos.z) < 3.2;
  return offer ? smooth(phase / .48) * smooth((3 - phase) / .62) : 0;
}

export function animateIronGuardian(manager, e, dt, distanceSq, daylight, dying = 0) {
  const parts = e.parts, { ctx } = manager;
  const reducedMotion = !!ctx.reducedMotion?.(), fast = !!ctx.fastGraphics?.();
  const motion = e.guardianMotion ||= { distance: 0, stride: 0, x: e.pos.x, z: e.pos.z, nextLook: 0, villager: null, wind: 0 };
  const moved = Math.hypot(e.pos.x - motion.x, e.pos.z - motion.z);
  motion.x = e.pos.x; motion.z = e.pos.z;
  const grounded = e.onGround || e.puppet;
  const speed = dt && moved < 1 ? moved / dt : 0;
  const walking = grounded && speed > .10 && !dying;
  motion.stride += ((walking ? Math.min(1, speed / 1.2) : 0) - motion.stride) * (1 - Math.exp(-dt * 10));
  const previous = motion.distance;
  if (walking) motion.distance += moved / STRIDE;
  const phase = motion.distance % 1, stride = motion.stride * (reducedMotion ? .55 : 1);
  const gait = Math.sin(TAU * phase), breath = reducedMotion ? 0 : Math.sin(e.age * 1.55) * .01;
  const drop = smooth(dying / .68);
  const lowered = Math.max(0, (.020 + Math.cos(phase * TAU * 2) * .012) * stride) + drop * .43;
  const attack = clamp((e.guardianStrike || 0) / GUARDIAN_STRIKE, 0, 1);
  const strikeTime = 1 - attack;
  const strike = attack ? smooth((strikeTime + .06) / .18) * smooth((1 - strikeTime) / .68) : 0;
  const closeToTarget = e.guardianTarget && Math.hypot(e.guardianTarget.pos.x - e.pos.x, e.guardianTarget.pos.z - e.pos.z) < 4.35;
  const wind = !e.dead && !attack && closeToTarget && e.attackCd < .42 ? 1 : 0;
  motion.wind += (wind - motion.wind) * (1 - Math.exp(-dt * 9));
  const flower = dying || attack ? 0 : updateGaze(manager, e, dt, distanceSq, stride, reducedMotion);
  e.guardianView.flower.visible = flower > .40 && distanceSq < 16 ** 2;
  const motionScale = reducedMotion ? .72 : 1;

  parts.legR.position.y = parts.legL.position.y = 1.64 - lowered;
  parts.body.position.y = 1.64 - lowered + breath;
  poseLeg(parts, "R", phase, stride * (1 - dying), lowered);
  poseLeg(parts, "L", (phase + .5) % 1, stride * (1 - dying), lowered);
  parts.body.rotation.set((.052 * stride + .13 * motion.wind - strike * .22 + drop * .48) * motionScale,
    gait * .075 * stride * (1 - strike), (gait * .027 * stride + smooth((dying - .51) / .49) * .23) * motionScale);
  parts.armR.rotation.x = (-gait * .30 * stride + motion.wind * .61 - strike * 1.94 + drop * -.30) * motionScale;
  parts.armL.rotation.x = (gait * .30 * stride + motion.wind * .55 - strike * 1.78 - flower * .59 + drop * -.5) * motionScale;
  parts.armR.rotation.z = (-.024 * (1 + gait * stride) - .075 * strike) * motionScale;
  parts.armL.rotation.z = (.024 * (1 - gait * stride) + .075 * strike) * motionScale;
  parts.elbowR.rotation.x = (-.09 - Math.max(0, gait) * .14 * stride - .46 * motion.wind - .36 * strike - drop * .43) * motionScale;
  parts.elbowL.rotation.x = (-.09 - Math.max(0, -gait) * .14 * stride - .46 * motion.wind - .31 * strike - flower * .65 - drop * .39) * motionScale;
  if (dying) {
    parts.head.rotation.x = drop * .38;
    parts.head.rotation.y *= 1 - drop;
  }
  if (!e.puppet && walking && Math.floor(previous * 2) !== Math.floor(motion.distance * 2) && distanceSq < 19 ** 2) {
    Sound.mob("guardianStep", Math.sqrt(distanceSq));
    if (!reducedMotion && !e.inWater && distanceSq < 11 ** 2) {
      const side = phase < .5 ? -.31 : .31, front = .21;
      const angle = e.mesh.rotation.y, sin = Math.sin(angle), cos = Math.cos(angle);
      ctx.particles?.(e.pos.x + cos * side + sin * front, e.pos.y + .02,
        e.pos.z - sin * side + cos * front, "guardianDust");
    }
  }
  updateIronGuardianSurface(e, distanceSq, fast, reducedMotion, Math.max(strike, motion.wind * .56), dying);
  const light = manager.world.lightAt(Math.floor(e.pos.x), Math.floor(e.pos.y + .95), Math.floor(e.pos.z));
  const sky = (light ? light[0] / 15 : 1) * daylight, lamp = light ? light[1] / 15 : 0;
  const ambient = manager.world.gen.isNether() ? .30 : .135;
  const brightness = ambient + (1 - ambient) * Math.max(sky, lamp) ** 1.35;
  const warm = Math.max(Math.max(0, lamp - sky), sky * (ctx.guardianTwilight?.() || 0));
  const cool = Math.max(0, .5 - daylight) * (1 - warm);
  const hurt = Math.max(0, e.hurtT * 2) * (1 - dying);
  e.mat.color.setRGB(brightness * (1 + .15 * warm + .18 * hurt - .12 * cool),
    brightness * (1 - .05 * warm - .36 * hurt), brightness * (1 - .24 * warm - .37 * hurt + .22 * cool));
}
