// Hero Clash — poses and animation.
// A pose is a small set of joint angles (radians). Each frame we choose a target
// pose from the fighter's combat state and blend toward it, so moves start
// instantly (responsive) but still flow into each other.
//
// Pose channels: y (hip height), lean, twist, roll (hips), sp [pitch,yaw,roll] spine,
// hd head, la/ra arm [forward, out, twist], le/re elbow bend, ll/rl leg [forward, out],
// lk/rk knee bend, lf/rf foot, pitch/yaw/spin (whole body), up (lift), dz (step into the screen).
// "l" is the lead side (far from camera), "r" the rear/power side (near the camera).

const Z = { y: 0, lean: 0, twist: 0, roll: 0, sp: [0, 0, 0], hd: [0, 0, 0], la: [0, 0.08, 0], le: 0.1, ra: [0, 0.08, 0], re: 0.1,
  ll: [0, 0.03], lk: 0, rl: [0, 0.03], rk: 0, lf: 0, rf: 0, pitch: 0, yaw: 0, spin: 0, up: 0, dz: 0 };
const P = (b, o) => Object.assign({}, b, o);
const lerp = (a, b, t) => a + (b - a) * t;
export function mix(a, b, t, out = {}) {
  for (const k in Z) {
    const x = a[k] === undefined ? Z[k] : a[k], y = b[k] === undefined ? Z[k] : b[k];
    if (typeof x === "number") out[k] = lerp(x, y, t);
    else { const o = out[k] || (out[k] = []); for (let i = 0; i < x.length; i++) o[i] = lerp(x[i], y[i] === undefined ? 0 : y[i], t); }
  }
  return out;
}
const ease = (t) => t * t * (3 - 2 * t), clamp01 = (t) => (t < 0 ? 0 : t > 1 ? 1 : t);

// ---------------------------------------------------------------- stances
const guard = P(Z, { y: -0.03, twist: -0.5, sp: [0.1, 0.15, 0], hd: [0, 0.35, 0], la: [1.0, 0.15, 0], le: 1.9, ra: [0.55, 0.25, 0], re: 2.15, ll: [0.36, 0.08], lk: 0.32, rl: [-0.3, 0.1], rk: 0.36 });
export const STANCE = {
  guard,
  boxer: P(guard, { y: -0.05, la: [1.15, 0.2, 0], le: 2.2, ra: [0.8, 0.3, 0], re: 2.3, sp: [0.2, 0.15, 0] }),
  proud: P(guard, { y: -0.01, twist: -0.3, sp: [-0.06, 0.1, 0], la: [0.35, 0.3, 0], le: 1.1, ra: [0.3, 0.32, 0], re: 1.2, ll: [0.2, 0.1], lk: 0.12, rl: [-0.18, 0.12], rk: 0.2, hd: [0, 0.25, 0] }),
  runner: P(guard, { y: -0.08, lean: 0.3, la: [0.7, 0.1, 0], le: 1.7, ra: [-0.5, 0.15, 0], re: 1.6, ll: [0.6, 0.05], lk: 0.6, rl: [-0.45, 0.05], rk: 0.5 }),
  hover: P(guard, { y: 0, up: 0.1, twist: -0.3, sp: [-0.05, 0.1, 0], la: [0.4, 0.45, 0], le: 0.7, ra: [0.3, 0.5, 0], re: 0.8, ll: [0.15, 0.04], lk: 0.5, rl: [-0.1, 0.04], rk: 0.25, lf: 0.6, rf: 0.6 }),
  low: P(guard, { y: -0.2, lean: 0.35, la: [1.0, 0.5, 0], le: 1.3, ra: [0.6, 0.55, 0], re: 1.5, ll: [0.75, 0.3], lk: 1.0, rl: [-0.2, 0.3], rk: 1.0 }),
  caster: P(guard, { y: -0.01, twist: -0.4, la: [1.2, 0.3, 0], le: 0.9, ra: [0.2, 0.6, 0], re: 1.4, ll: [0.25, 0.05], lk: 0.2, rl: [-0.2, 0.08], rk: 0.25 }),
  archer: P(guard, { twist: -0.9, la: [1.25, 0.1, 0], le: 0.3, ra: [0.9, 0.5, 0], re: 2.2, hd: [0, 0.7, 0], sp: [0, 0.1, 0] }),
  ninja: P(guard, { y: -0.14, twist: -0.8, la: [1.2, 0.1, 0], le: 0.9, ra: [-0.3, 0.3, 0], re: 1.6, ll: [0.6, 0.15], lk: 0.75, rl: [-0.4, 0.2], rk: 0.8, hd: [0, 0.6, 0] }),
  regal: P(guard, { y: 0, twist: -0.2, sp: [-0.1, 0.05, 0], la: [0.25, 0.25, 0], le: 0.5, ra: [0.9, 0.4, 0], re: 1.6, ll: [0.12, 0.1], lk: 0.05, rl: [-0.1, 0.12], rk: 0.1, hd: [-0.1, 0.2, 0] }),
  robot: P(guard, { y: -0.04, twist: -0.15, sp: [0.1, 0, 0], la: [0.5, 0.35, 0], le: 1.3, ra: [0.5, 0.35, 0], re: 1.3, ll: [0.25, 0.2], lk: 0.3, rl: [-0.15, 0.2], rk: 0.3, hd: [0, 0.15, 0] }),
  teacher: P(guard, { y: -0.02, twist: -0.45, la: [1.1, 0.1, 0], le: 1.4, ra: [0.1, 0.3, 0], re: 1.9, sp: [0, 0.15, 0] }),
};

// ---------------------------------------------------------------- shared poses
const crouch = P(guard, { y: -0.4, lean: 0.25, ll: [1.25, 0.15], lk: 2.05, rl: [1.0, 0.18], rk: 2.0, la: [1.0, 0.2, 0], le: 2.0, ra: [0.7, 0.3, 0], re: 2.1 });
const POSE = {
  crouch,
  blockHi: P(guard, { y: -0.06, lean: -0.05, twist: -0.3, la: [1.5, 0.1, 0.6], le: 2.2, ra: [1.4, 0.05, -0.6], re: 2.2, hd: [0.2, 0.3, 0] }),
  blockLo: P(crouch, { la: [1.3, 0.1, 0.5], le: 2.0, ra: [1.2, 0.05, -0.5], re: 2.0, hd: [0.3, 0.3, 0] }),
  jump: P(guard, { y: 0, lean: 0.1, ll: [1.1, 0.1], lk: 1.7, rl: [0.5, 0.1], rk: 1.5, la: [0.3, 0.6, 0], le: 0.8, ra: [0.2, 0.6, 0], re: 0.8 }),
  fall: P(guard, { y: 0, lean: -0.05, ll: [0.5, 0.15], lk: 0.6, rl: [-0.2, 0.15], rk: 0.9, la: [0.9, 0.9, 0], le: 0.4, ra: [0.7, 0.9, 0], re: 0.4 }),
  dashF: P(guard, { y: -0.1, lean: 0.55, ll: [1.0, 0], lk: 0.9, rl: [-0.8, 0], rk: 0.4, la: [-0.6, 0.2, 0], le: 0.9, ra: [1.0, 0.2, 0], re: 1.4 }),
  dashB: P(guard, { y: -0.06, lean: -0.3, ll: [0.6, 0.1], lk: 0.2, rl: [-0.5, 0.1], rk: 0.9, la: [0.9, 0.4, 0], le: 1.2, ra: [0.7, 0.4, 0], re: 1.2 }),
  dodge: P(guard, { y: -0.12, lean: -0.1, twist: -1.3, dz: -0.55, sp: [0.1, -0.3, 0.25], la: [0.4, 0.5, 0], le: 1.4, ra: [0.2, 0.4, 0], re: 1.6, hd: [0, 1.0, 0] }),
  hitHi: P(guard, { y: -0.02, lean: -0.35, sp: [-0.3, 0.3, 0.1], hd: [-0.45, -0.3, 0.2], la: [0.3, 0.6, 0], le: 0.9, ra: [-0.2, 0.6, 0], re: 0.8, ll: [0.2, 0.1], lk: 0.3, rl: [-0.45, 0.1], rk: 0.4 }),
  hitLo: P(guard, { y: -0.1, lean: 0.55, sp: [0.4, 0, 0], hd: [0.3, 0.2, 0], la: [0.9, 0.3, 0.4], le: 1.9, ra: [0.9, 0.3, -0.4], re: 1.9, ll: [0.5, 0.1], lk: 0.6, rl: [-0.2, 0.1], rk: 0.6 }),
  stagger: P(guard, { y: -0.08, lean: 0.15, sp: [0.2, 0, 0.2], hd: [0.35, 0, 0.3], la: [0.1, 0.35, 0], le: 0.3, ra: [0.1, 0.3, 0], re: 0.3, ll: [0.2, 0.2], lk: 0.4, rl: [-0.1, 0.2], rk: 0.45 }),
  air: P(guard, { y: 0, lean: -0.5, sp: [-0.3, 0, 0], hd: [-0.3, 0, 0], la: [1.2, 0.9, 0], le: 0.3, ra: [1.0, 0.9, 0], re: 0.3, ll: [0.9, 0.2], lk: 0.5, rl: [0.4, 0.2], rk: 0.8 }),
  lying: P(Z, { pitch: -1.5, up: 0.17, la: [0.2, 1.0, 0], le: 0.3, ra: [0.1, 0.9, 0], re: 0.4, ll: [0.25, 0.15], lk: 0.3, rl: [-0.05, 0.2], rk: 0.1, hd: [-0.1, 0.4, 0] }),
  getup: P(crouch, { lean: 0.6, la: [0.9, 0.3, 0], le: 0.4, ra: [0.9, 0.3, 0], re: 0.4, hd: [0.3, 0, 0] }),
  lose: P(guard, { y: -0.3, lean: 0.6, sp: [0.4, 0, 0], hd: [0.6, 0, 0], la: [0.6, 0.15, 0], le: 0.3, ra: [0.6, 0.15, 0], re: 0.3, ll: [1.1, 0.1], lk: 1.9, rl: [0.3, 0.1], rk: 1.9, twist: -0.2 }),
  held: P(guard, { y: 0, up: 0.12, lean: -0.3, la: [0.2, 0.7, 0], le: 0.5, ra: [0.2, 0.7, 0], re: 0.5, ll: [0.2, 0.2], lk: 0.6, rl: [-0.2, 0.2], rk: 0.7, hd: [-0.3, 0, 0.2] }),
};

// Attacks: w = wind-up pose, h = hit pose, h2 = alternate hit (for rapid moves), fx = whole-body motion
const A = {};
const atk = (name, w, h, extra) => { A[name] = Object.assign({ w: P(guard, w), h: P(guard, h) }, extra); };
const PUNCH = {
  boxer: { jab: [{ twist: -0.6, la: [1.0, 0.1, 0], le: 2.2 }, { twist: -0.95, lean: 0.12, la: [1.52, 0.02, 0], le: 0.03 }],
    heavy: [{ twist: -0.9, ra: [0.2, 0.4, 0], re: 2.4, lean: -0.05 }, { twist: 0.55, lean: 0.25, ra: [1.5, 0.0, 0], re: 0.05, la: [0.4, 0.3, 0], le: 2.2, ll: [0.55, 0.08], lk: 0.6, hd: [0, -0.4, 0] }] },
  karate: { jab: [{ twist: -0.5, la: [0.8, 0.0, 0], le: 2.3 }, { y: -0.1, twist: -1.0, la: [1.5, 0, 0], le: 0, ra: [-0.3, 0.2, 0], re: 2.3, ll: [0.6, 0.1], lk: 0.7 }],
    heavy: [{ y: -0.1, twist: -1.0, ra: [-0.4, 0.2, 0], re: 2.3 }, { y: -0.16, twist: 0.6, lean: 0.15, ra: [1.48, 0, 0], re: 0, la: [-0.3, 0.2, 0], le: 2.3, ll: [0.75, 0.1], lk: 0.85, rl: [-0.55, 0.1], rk: 0.2, hd: [0, -0.45, 0] }] },
  hammer: { jab: [{ twist: -0.2, la: [0.6, 0.9, 0], le: 1.6 }, { twist: -1.0, lean: 0.1, la: [1.4, 0.35, 0], le: 1.1 }],
    heavy: [{ lean: -0.25, ra: [2.9, 0.1, 0], re: 0.7, la: [1.0, 0.3, 0], le: 1.0 }, { y: -0.12, lean: 0.55, twist: 0.4, ra: [0.95, 0, 0], re: 0.15, la: [-0.4, 0.3, 0], le: 0.8, ll: [0.6, 0.1], lk: 0.7, hd: [0.2, -0.3, 0] }] },
  claw: { jab: [{ twist: -0.2, la: [1.6, 1.0, 0], le: 0.9 }, { twist: -1.1, lean: 0.25, la: [1.3, -0.3, 0], le: 0.5, y: -0.1 }],
    heavy: [{ lean: -0.2, ra: [2.4, 0.5, 0], re: 0.8, la: [2.4, 0.5, 0], le: 0.8 }, { y: -0.18, lean: 0.6, ra: [1.1, -0.1, 0], re: 0.3, la: [1.1, -0.1, 0], le: 0.3, ll: [0.8, 0.2], lk: 0.9 }] },
  palm: { jab: [{ twist: -0.5, la: [0.7, 0.1, 0], le: 2.3 }, { twist: -0.9, la: [1.5, 0, 0], le: 0.15, ra: [0.2, 0.5, 0], re: 1.0 }],
    heavy: [{ lean: -0.15, twist: -0.1, la: [0.6, 0.3, 0], le: 2.3, ra: [0.6, 0.3, 0], re: 2.3 }, { lean: 0.3, twist: -0.1, la: [1.5, 0.12, 0], le: 0.1, ra: [1.5, 0.12, 0], re: 0.1, ll: [0.6, 0.1], lk: 0.6, hd: [0, 0.1, 0] }] },
  robot: { jab: [{ twist: -0.1, la: [0.9, 0.2, 0], le: 1.9 }, { twist: -0.35, la: [1.55, 0.05, 0], le: 0 }],
    heavy: [{ twist: -0.5, ra: [0.1, 0.25, 0], re: 2.0, lean: -0.1 }, { twist: 0.35, lean: 0.3, ra: [1.55, 0, 0], re: 0, ll: [0.5, 0.15], lk: 0.5, hd: [0, -0.2, 0] }] },
};
const KICK = {
  snap: { lkick: [{ rl: [0.9, 0.1], rk: 1.8, lean: -0.1 }, { rl: [1.25, 0.05], rk: 0.05, lean: -0.25, twist: -0.3, rf: -0.5 }],
    hkick: [{ rl: [1.2, 0.1], rk: 2.0, lean: -0.15 }, { rl: [1.95, 0.05], rk: 0, lean: -0.5, twist: -0.3, rf: -0.6, la: [0.3, 0.7, 0], ra: [-0.3, 0.6, 0] }] },
  round: { lkick: [{ twist: -0.9, rl: [0.5, 0.8], rk: 1.7 }, { twist: -1.5, rl: [1.05, 0.25], rk: 0.1, lean: -0.2, roll: 0.15, hd: [0, 1.1, 0] }],
    hkick: [{ twist: -1.0, rl: [0.6, 1.0], rk: 1.9, lean: -0.1 }, { twist: -1.75, rl: [1.6, 0.3], rk: 0.05, lean: -0.45, roll: 0.3, hd: [0, 1.3, 0], la: [0.5, 0.8, 0], ra: [-0.4, 0.7, 0] }] },
  stomp: { lkick: [{ rl: [1.1, 0.1], rk: 1.9 }, { rl: [1.15, 0.05], rk: 0, lean: -0.15, rf: 0.5 }],
    hkick: [{ rl: [1.5, 0.1], rk: 2.1, lean: -0.2 }, { rl: [1.5, 0.05], rk: 0, lean: -0.45, rf: 0.6, la: [0.8, 0.6, 0], ra: [0.5, 0.6, 0] }] },
  flip: { lkick: [{ twist: -1.0, rl: [0.3, 0.6], rk: 1.6 }, { twist: -2.0, rl: [1.1, 0.4], rk: 0, lean: -0.25, hd: [0, 1.5, 0] }],
    hkick: [{ y: -0.15, rl: [0.6, 0.1], rk: 1.6, lean: 0.2 }, { rl: [1.7, 0.05], rk: 0, ll: [0.6, 0.1], lk: 1.4, lean: -0.3, up: 0.35, la: [0.6, 1.0, 0], ra: [0.6, 1.0, 0] }, { flip: -1 }] },
};
// crouching + air + shared moves (same skeleton for every style, sped up/slowed by frame data)
A.cjab = { w: P(crouch, { la: [0.8, 0.1, 0], le: 2.2 }), h: P(crouch, { twist: -0.9, la: [1.35, 0, 0], le: 0.05 }) };
A.upper = { w: P(crouch, { y: -0.45, twist: -0.7, ra: [-0.2, 0.2, 0], re: 1.8 }), h: P(guard, { y: 0.02, up: 0.08, twist: 0.5, lean: -0.2, ra: [2.75, 0, 0], re: 0.5, la: [-0.3, 0.3, 0], le: 1.5, ll: [0.3, 0.1], lk: 0.1, rl: [-0.3, 0.1], rk: 0.1, hd: [-0.3, -0.3, 0] }) };
A.clkick = { w: P(crouch, { rl: [1.2, 0.1], rk: 2.2 }), h: P(crouch, { twist: -0.4, rl: [1.5, 0.05], rk: 0.05, lean: -0.1 }) };
A.sweep = { w: P(crouch, { twist: -0.6, rl: [0.9, 0.8], rk: 1.0 }), h: P(crouch, { y: -0.48, twist: -1.7, rl: [1.5, 0.15], rk: 0, lean: -0.15, la: [0.2, 0.9, 0], le: 0.3, hd: [0, 1.4, 0] }) };
A.ajab = { w: P(POSE.jump, { la: [0.8, 0.1, 0], le: 2.2 }), h: P(POSE.jump, { twist: -0.8, la: [1.9, 0, 0], le: 0.05, lean: 0.3 }) };
A.asmash = { w: P(POSE.jump, { ra: [2.9, 0.1, 0], re: 0.5, la: [2.9, 0.1, 0], le: 0.5, lean: -0.3 }), h: P(POSE.jump, { ra: [1.0, -0.1, 0], re: 0.1, la: [1.0, -0.1, 0], le: 0.1, lean: 0.6 }) };
A.akick = { w: P(POSE.jump, {}), h: P(POSE.jump, { rl: [1.3, 0], rk: 0, ll: [0.7, 0.1], lk: 1.9, lean: -0.35 }) };
A.adive = { w: P(POSE.jump, { rl: [1.0, 0], rk: 1.6 }), h: P(POSE.jump, { rl: [0.75, 0], rk: 0, rf: -0.5, ll: [1.0, 0.2], lk: 2.1, lean: -0.6, la: [0.4, 1.0, 0], ra: [0.2, 1.0, 0] }) };
A.dashatk = { w: P(POSE.dashF, {}), h: P(guard, { y: -0.12, lean: 0.6, twist: 0.5, ra: [1.5, 0, 0], re: 0, ll: [0.9, 0], lk: 0.9, rl: [-0.8, 0], rk: 0.3 }) };
A.throw = { w: P(guard, { lean: 0.2, la: [1.3, 0.4, 0], le: 0.6, ra: [1.3, 0.4, 0], re: 0.6 }), h: P(guard, { lean: 0.3, la: [1.4, 0.1, 0], le: 0.9, ra: [1.4, 0.1, 0], re: 0.9, y: -0.08 }) };
A.cast = { w: P(guard, { ra: [0.3, 0.5, 0], re: 2.0 }), h: P(guard, { twist: 0.3, ra: [1.5, 0.1, 0], re: 0.1 }) };
A.palm = { w: P(guard, { twist: -0.6, ra: [0.2, 0.4, 0], re: 2.3, lean: -0.1 }), h: P(guard, { twist: 0.45, lean: 0.15, ra: [1.5, 0, 0], re: 0.05, la: [0.3, 0.5, 0], le: 1.2, ll: [0.5, 0.1], lk: 0.5 }) };
A.point = { w: P(guard, { la: [0.8, 0.2, 0], le: 2.0 }), h: P(guard, { twist: -1.0, la: [1.52, 0, 0], le: 0, ra: [-0.3, 0.3, 0], re: 1.2 }) };
A.lowpoint = { w: P(crouch, { la: [0.8, 0.2, 0], le: 2.0 }), h: P(crouch, { twist: -1.0, la: [1.2, 0, 0], le: 0, lean: 0.35 }) };
A.throwing = { w: P(guard, { twist: -0.8, ra: [2.3, 0.4, 0], re: 1.6, lean: -0.15 }), h: P(guard, { twist: 0.6, lean: 0.3, ra: [1.2, -0.1, 0], re: 0.2, ll: [0.55, 0.1], lk: 0.55 }), h2: P(guard, { twist: -0.9, lean: 0.2, la: [1.3, -0.1, 0], le: 0.2 }) };
A.bigpunch = { w: P(guard, { y: -0.14, twist: -1.1, lean: -0.1, ra: [-0.7, 0.3, 0], re: 2.2, la: [1.3, 0.2, 0], le: 0.8 }), h: P(guard, { y: -0.12, twist: 0.75, lean: 0.4, ra: [1.5, 0, 0], re: 0, la: [-0.5, 0.3, 0], le: 1.6, ll: [0.85, 0.05], lk: 0.9, rl: [-0.7, 0.05], rk: 0.25, hd: [0, -0.5, 0] }) };
A.leap = { w: P(POSE.jump, { ra: [2.9, 0.2, 0], re: 0.4, la: [2.9, 0.2, 0], le: 0.4, lean: -0.2 }), h: P(crouch, { y: -0.3, lean: 0.6, ra: [0.9, 0, 0], re: 0.1, la: [0.9, 0, 0], le: 0.1 }) };
A.slam = { w: P(guard, { lean: -0.3, up: 0.1, ra: [2.9, 0.2, 0], re: 0.5, la: [2.9, 0.2, 0], le: 0.5 }), h: P(crouch, { y: -0.36, lean: 0.75, ra: [0.75, 0.05, 0], re: 0, la: [0.75, 0.05, 0], le: 0, hd: [0.2, 0, 0] }) };
A.clap = { w: P(guard, { twist: -0.1, la: [1.3, 1.2, 0], le: 0.2, ra: [1.3, 1.2, 0], re: 0.2, lean: -0.15 }), h: P(guard, { twist: -0.1, lean: 0.25, la: [1.5, -0.15, 0], le: 0.15, ra: [1.5, -0.15, 0], re: 0.15 }) };
A.vanish = { w: P(crouch, { y: -0.25, la: [1.4, 0.2, 0.8], le: 2.2, ra: [1.4, 0.2, -0.8], re: 2.2 }), h: P(guard, { twist: 0.6, lean: 0.25, ra: [1.45, 0, 0], re: 0.1 }) };
A.counter = { w: P(guard, { y: -0.1, twist: -0.9, la: [1.3, 0, 0.3], le: 1.3, ra: [0.2, 0.3, 0], re: 2.2, hd: [0, 0.7, 0] }), h: P(guard, { y: -0.1, twist: -0.9, la: [1.35, 0, 0.3], le: 1.2, ra: [0.2, 0.3, 0], re: 2.2, hd: [0, 0.7, 0] }) };
A.flurry = { w: P(guard, { twist: -0.6, y: -0.08 }), h: P(guard, { y: -0.08, twist: -1.0, lean: 0.2, la: [1.5, 0, 0], le: 0.05, ra: [0.5, 0.2, 0], re: 2.3 }), h2: P(guard, { y: -0.08, twist: 0.5, lean: 0.2, ra: [1.5, 0, 0], re: 0.05, la: [0.5, 0.2, 0], le: 2.3 }) };
A.blur = { w: P(POSE.dashF, { y: -0.16 }), h: P(POSE.dashF, { y: -0.14, lean: 0.75, ra: [1.5, 0, 0], re: 0, la: [-1.0, 0.2, 0], le: 0.3 }) };
A.powerup = { w: P(crouch, { y: -0.2, la: [0.6, 0.3, 0], le: 2.3, ra: [0.6, 0.3, 0], re: 2.3 }), h: P(guard, { y: 0, lean: -0.2, twist: -0.1, la: [0.5, 0.9, 0], le: 1.5, ra: [0.5, 0.9, 0], re: 1.5, hd: [-0.3, 0, 0], ll: [0.1, 0.25], lk: 0.1, rl: [-0.05, 0.25], rk: 0.1 }) };
A.flykick = { w: P(POSE.jump, {}), h: P(POSE.jump, { pitch: -0.5, rl: [1.5, 0], rk: 0, ll: [0.9, 0.1], lk: 2.0, la: [-0.5, 0.6, 0], ra: [-0.5, 0.6, 0], lean: -0.1 }) };
A.shoulder = { w: P(guard, { y: -0.15, lean: 0.2, twist: -0.4 }), h: P(guard, { y: -0.18, lean: 0.55, twist: 0.9, ra: [0.3, 0.2, 0], re: 2.3, la: [-0.4, 0.3, 0], le: 1.0, ll: [0.9, 0.1], lk: 0.9, rl: [-0.6, 0.1], rk: 0.3 }) };
A.raise = { w: P(guard, { ra: [0.6, 0.3, 0], re: 1.8 }), h: P(guard, { twist: -0.1, lean: -0.15, ra: [2.9, 0.15, 0], re: 0.1, la: [0.3, 0.5, 0], le: 0.9, hd: [-0.3, 0.1, 0] }) };
A.rising = { w: P(crouch, { y: -0.45, ra: [-0.3, 0.2, 0], re: 1.8 }), h: P(POSE.jump, { twist: 0.6, ra: [2.9, 0, 0], re: 0.2, la: [-0.4, 0.3, 0], le: 1.4, ll: [0.2, 0.1], lk: 0.2, rl: [0.9, 0.1], rk: 1.8, lean: -0.15 }), fx: { spin: 1 } };
A.eyebeam = { w: P(guard, { lean: -0.15, hd: [-0.2, 0.4, 0] }), h: P(guard, { twist: -0.3, lean: 0.12, la: [0.5, 0.7, 0], le: 1.0, ra: [0.4, 0.7, 0], re: 1.0, hd: [0.05, 0.3, 0], ll: [0.45, 0.15], lk: 0.4 }) };
A.burst = { w: P(crouch, { y: -0.3, la: [1.0, 0.1, 0.9], le: 2.3, ra: [1.0, 0.1, -0.9], re: 2.3 }), h: P(guard, { y: 0, up: 0.15, lean: -0.25, la: [0.6, 1.3, 0], le: 0.1, ra: [0.6, 1.3, 0], re: 0.1, ll: [0.1, 0.35], lk: 0.2, rl: [-0.1, 0.35], rk: 0.2, hd: [-0.4, 0, 0] }) };
A.backflip = { w: P(crouch, { y: -0.3 }), h: P(POSE.jump, { ll: [1.4, 0.1], lk: 2.0, rl: [1.4, 0.1], rk: 2.0, la: [1.0, 0.3, 0], le: 1.5, ra: [1.0, 0.3, 0], re: 1.5 }), fx: { flip: 1 } };
A.pounce = { w: P(crouch, { y: -0.35, lean: 0.5 }), h: P(POSE.jump, { pitch: 0.7, la: [2.2, 0.3, 0], le: 0.4, ra: [2.2, 0.3, 0], re: 0.4, ll: [-0.3, 0.2], lk: 0.9, rl: [-0.5, 0.2], rk: 1.1 }) };
A.roll = { w: P(crouch, {}), h: P(crouch, { y: -0.5, lean: 0.9, ll: [1.7, 0.1], lk: 2.3, rl: [1.7, 0.1], rk: 2.3, la: [1.3, 0.1, 0], le: 2.2, ra: [1.3, 0.1, 0], re: 2.2, hd: [0.6, 0, 0] }), fx: { flip: -2 } };
A.slide = { w: P(crouch, {}), h: P(crouch, { y: -0.52, lean: -0.75, rl: [1.5, 0.05], rk: 0, ll: [1.2, 0.1], lk: 1.2, la: [-0.5, 0.5, 0], le: 0.3, ra: [-0.3, 0.4, 0], re: 0.4, hd: [0.5, 0.2, 0] }) };
A.bow = { w: P(STANCE.archer, { ra: [1.2, 0.4, 0], re: 1.6 }), h: P(STANCE.archer, { twist: -1.1, la: [1.52, 0, 0], le: 0, ra: [1.35, 0.9, 0], re: 2.3, hd: [0, 0.9, 0] }) };
A.bowup = { w: P(STANCE.archer, {}), h: P(STANCE.archer, { twist: -1.1, lean: -0.35, la: [2.3, 0, 0], le: 0, ra: [2.0, 0.9, 0], re: 2.3, hd: [-0.5, 0.9, 0] }) };
A.grab = { w: P(guard, { la: [1.2, 0.9, 0], le: 0.5, ra: [1.2, 0.9, 0], re: 0.5, lean: 0.15 }), h: P(guard, { y: -0.1, lean: 0.4, la: [1.45, 0.05, 0], le: 0.5, ra: [1.45, 0.05, 0], re: 0.5 }) };
A.device = { w: P(guard, { la: [0.9, 0.1, 0], le: 1.9, ra: [0.9, 0.1, 0], re: 1.9, hd: [0.3, 0.2, 0] }), h: P(guard, { twist: -0.6, y: -0.1, la: [1.2, 0.1, 0], le: 0.3, ra: [0.2, 0.3, 0], re: 1.0, lean: 0.2 }) };
A.ultgo = { w: P(crouch, { y: -0.25, la: [0.5, 0.5, 0], le: 2.2, ra: [0.5, 0.5, 0], re: 2.2 }), h: P(guard, { y: -0.1, lean: 0.5, twist: 0.6, ra: [1.5, 0, 0], re: 0, la: [-0.6, 0.3, 0], le: 0.6, ll: [0.9, 0], lk: 0.9, rl: [-0.8, 0], rk: 0.3 }) };

const VICTORY = {
  armsCrossed: P(Z, { yaw: -0.9, sp: [-0.08, 0, 0], la: [0.9, -0.35, 0], le: 2.0, ra: [0.9, -0.35, 0], re: 2.0, ll: [0, 0.14], rl: [0, 0.14], hd: [-0.1, 0, 0] }),
  capeSweep: P(Z, { yaw: -0.5, twist: -0.4, la: [0.3, 1.3, 0], le: 0.3, ra: [0.2, 0.2, 0], re: 1.7, ll: [0.2, 0.1], rl: [-0.1, 0.1], hd: [0, 0.4, 0] }),
  jog: P(Z, { yaw: -0.9, la: [0.6, 0.1, 0], le: 1.6, ra: [-0.4, 0.1, 0], re: 1.6, ll: [0.5, 0.05], lk: 0.9, rl: [-0.1, 0.05], rk: 0.2, bob: 1 }),
  salute: P(Z, { yaw: -0.9, ra: [1.2, 0.9, 0.3], re: 2.3, la: [0, 0.1, 0], ll: [0, 0.08], rl: [0, 0.08] }),
  fistSky: P(Z, { yaw: -0.8, lean: -0.1, ra: [2.95, 0.05, 0], re: 0.05, la: [0.2, 0.3, 0], le: 1.2, ll: [0.1, 0.15], rl: [-0.05, 0.15], hd: [-0.35, 0, 0] }),
  handstand: P(Z, { yaw: -0.9, pitch: 3.14, up: 1.75, la: [3.0, 0.15, 0], le: 0, ra: [3.0, 0.15, 0], re: 0, ll: [0.5, 0.1], lk: 0.9, rl: [-0.4, 0.1], rk: 0.3 }),
  floatGlow: P(Z, { yaw: -0.9, up: 0.5, la: [0.2, 0.9, 0], le: 0.2, ra: [0.2, 0.9, 0], re: 0.2, ll: [0.2, 0.05], lk: 0.6, rl: [0, 0.05], rk: 0.2, hd: [-0.25, 0, 0], lf: 0.6, rf: 0.6 }),
  levitate: P(Z, { yaw: -0.9, up: 0.45, la: [0.9, 0.5, 0], le: 1.6, ra: [0.9, 0.5, 0], re: 1.6, ll: [1.3, 0.5], lk: 2.3, rl: [1.3, 0.5], rk: 2.3 }),
  iceThrone: P(Z, { yaw: -0.9, y: -0.3, ll: [1.4, 0.2], lk: 1.5, rl: [1.4, 0.2], rk: 1.5, la: [0.5, 0.4, 0], le: 1.2, ra: [1.0, 0.2, 0], re: 2.2, lean: -0.15 }),
  roar: P(Z, { yaw: -0.8, y: -0.1, lean: -0.3, la: [0.6, 1.0, 0], le: 1.2, ra: [0.6, 1.0, 0], re: 1.2, ll: [0.3, 0.3], lk: 0.4, rl: [-0.1, 0.3], rk: 0.4, hd: [-0.5, 0, 0] }),
  bowSpin: P(Z, { yaw: -0.7, la: [2.6, 0.3, 0], le: 0.1, ra: [0.1, 0.5, 0], re: 1.7, ll: [0.15, 0.1], rl: [-0.1, 0.1], hd: [-0.2, 0, 0] }),
  windSpin: P(Z, { yaw: -0.9, up: 0.35, la: [1.4, 1.3, 0], le: 0.1, ra: [1.4, 1.3, 0], re: 0.1, ll: [0.1, 0.05], lk: 0.4, rl: [0, 0.05], rk: 0.1, lf: 0.6, rf: 0.6, turn: 1 }),
  vanishPose: P(Z, { yaw: -0.4, y: -0.35, lean: 0.2, ll: [1.3, 0.2], lk: 2.1, rl: [0.2, 0.3], rk: 1.9, la: [1.4, 0, 0.6], le: 2.2, ra: [-0.3, 0.3, 0], re: 0.4, hd: [0.2, 0.3, 0] }),
  throne: P(Z, { yaw: -0.9, la: [0.4, 0.9, 0], le: 0.6, ra: [1.5, 0.3, 0], re: 1.9, ll: [0, 0.18], rl: [0, 0.18], hd: [-0.2, 0, 0], sp: [-0.12, 0, 0] }),
  steamVent: P(Z, { yaw: -0.9, la: [0.3, 0.7, 0], le: 1.9, ra: [0.3, 0.7, 0], re: 1.9, ll: [0, 0.25], rl: [0, 0.25], sp: [-0.1, 0, 0] }),
  flameBow: P(Z, { yaw: -0.9, lean: 0.5, la: [0.3, 1.2, 0], le: 0.2, ra: [1.0, 0.3, 0], re: 2.0, ll: [0.3, 0.1], rl: [-0.3, 0.1], rk: 0.4, hd: [-0.4, 0, 0] }),
  straighten: P(Z, { yaw: -0.9, la: [0.75, -0.1, 0], le: 1.9, ra: [0.75, -0.1, 0], re: 1.9, ll: [0, 0.1], rl: [0, 0.1], hd: [0.1, 0, 0], sp: [-0.05, 0, 0] }),
};

// Blend target for an attack, by how far through the move we are
function attackPose(f, def, stance, out) {
  const m = f.move, t = f.mt, an = def.anim;
  let a = A[m.anim];
  const ps = PUNCH[an.punch] || PUNCH.boxer, ks = KICK[an.kick] || KICK.snap;
  let extra = null;
  if (m.anim === "jab" || m.anim === "heavy") { const k = ps[m.anim]; a = { w: P(stance, k[0]), h: P(stance, k[1]) }; }
  else if (m.anim === "lkick" || m.anim === "hkick") { const k = ks[m.anim]; a = { w: P(stance, k[0]), h: P(stance, k[1]) }; extra = k[2]; }
  if (!a) a = A.cast;
  const fx = extra || a.fx;
  let p;
  if (t < m.s) { const u = t / m.s; p = u < 0.55 ? mix(stance, a.w, ease(u / 0.55), out) : mix(a.w, a.h, Math.pow((u - 0.55) / 0.45, 2), out); if (f.chargeT > 0) { out.y -= 0.04; out.twist += Math.sin(f.chargeT * 1.3) * 0.03; } }
  else if (t < m.s + m.a) {
    if (a.h2 && (m.hits || m.proj)) { const k = Math.floor((t - m.s) / 4); const u = ((t - m.s) % 4) / 4; p = mix(k % 2 ? a.h : a.h2, k % 2 ? a.h2 : a.h, ease(u), out); if ((t - m.s) < 4) mix(a.w, a.h, 1, out); }
    else p = mix(a.h, a.h, 0, out);
  } else {
    const u = clamp01((t - m.s - m.a) / m.r);
    if (a.h2 && m.proj && t < m.s + 16) { const k = Math.floor((t - m.s) / 6); p = mix(k % 2 ? a.h2 : a.h, k % 2 ? a.h2 : a.h, 0, out); }
    else p = mix(a.h, m.air || !f.grounded ? POSE.fall : m.crouch ? crouch : stance, ease(u), out);
  }
  if (fx) {
    const total = m.s + m.a + m.r, u = clamp01((t - m.s * 0.5) / (m.a + m.s * 0.5 + m.r * 0.3));
    if (fx.flip) out.pitch += fx.flip * Math.PI * 2 * ease(u) * (u < 1 ? 1 : 0);
    if (fx.spin) out.yaw += fx.spin * Math.PI * 2 * ease(clamp01(t / (total * 0.7)));
    if (fx.flip) out.up += Math.sin(u * Math.PI) * 0.25;
  }
  return p;
}

const tmpA = {}, tmpB = {};
// Decide this frame's target pose for a fighter. Returns blend speed (0..1 per frame).
export function targetPose(f, def, time, out) {
  const stance = STANCE[def.anim.stance] || guard;
  const breathe = Math.sin(time * 2.2 + f.idx * 1.7);
  let rate = 0.3;
  switch (f.state) {
    case "idle": mix(stance, stance, 0, out); out.y += breathe * 0.012; out.sp[0] += breathe * 0.02; out.la[0] += breathe * 0.03; out.ra[0] -= breathe * 0.03;
      if (def.anim.stance === "hover") out.up += 0.06 + breathe * 0.04;
      if (def.anim.stance === "runner" || def.anim.stance === "boxer") { const b = Math.abs(Math.sin(time * 6)); out.y -= b * 0.03; }
      break;
    case "walk": {
      const ph = f.x * 5.5, s = Math.sin(ph), c = Math.cos(ph);
      mix(stance, stance, 0, out);
      if (def.anim.stance === "hover") { out.up += 0.1; out.lean += f.vx * f.facing > 0 ? 0.25 : -0.2; }
      else { out.ll[0] = 0.15 + s * 0.55; out.rl[0] = -0.05 - s * 0.55; out.lk = 0.25 + Math.max(0, -c) * 0.8; out.rk = 0.25 + Math.max(0, c) * 0.8; out.y -= 0.02 + Math.abs(c) * 0.025; out.la[0] -= s * 0.15; out.ra[0] += s * 0.15; out.lean += f.vx * f.facing > 0 ? 0.08 : -0.06; }
      rate = 0.45; break;
    }
    case "crouch": mix(crouch, crouch, 0, out); out.y += breathe * 0.008; rate = 0.4; break;
    case "block": case "bstun": {
      const b = f.low ? POSE.blockLo : POSE.blockHi; mix(b, b, 0, out);
      if (f.state === "bstun") { out.lean -= 0.12; out.sp[0] -= 0.08; }
      rate = 0.6; break;
    }
    case "air":
      if (f.vy > 0.02) mix(POSE.jump, POSE.jump, 0, out); else mix(POSE.fall, POSE.fall, 0, out);
      if (def.airJumps && f.airJumps > 0 && f.st < 16) out.pitch = -Math.PI * 2 * (f.st / 16);
      rate = 0.3; break;
    case "dash": { const p = f.dashDir > 0 ? POSE.dashF : POSE.dashB; mix(p, p, 0, out); rate = 0.6; break; }
    case "dodge": { const u = f.st < 17 ? 1 : 1 - (f.st - 17) / 7; mix(stance, POSE.dodge, ease(clamp01(Math.min(f.st / 4, u))), out); rate = 0.7; break; }
    case "atk": attackPose(f, def, stance, out); rate = 0.75; break;
    case "throwing": {
      const u = f.st / 40;
      if (u < 0.45) mix(A.throw.h, P(A.throw.h, { twist: -1.2 * f.throwDir, lean: -0.1, y: -0.15 }), ease(u / 0.45), out);
      else mix(P(guard, { twist: 0.9, lean: 0.5, la: [1.4, 0.2, 0], le: 0.1, ra: [1.5, 0.2, 0], re: 0.1, y: -0.12 }), stance, ease((u - 0.45) / 0.55), out);
      rate = 0.6; break;
    }
    case "thrown": mix(POSE.held, POSE.held, 0, out); out.pitch = -0.4; rate = 0.5; break;
    case "hstun": { const b = f.hitHigh ? POSE.hitHi : POSE.hitLo; mix(b, b, 0, out); rate = 0.7; break; }
    case "stagger": mix(POSE.stagger, POSE.stagger, 0, out); out.roll = Math.sin(time * 7) * 0.12; out.sp[2] += Math.sin(time * 7 + 1) * 0.15; rate = 0.4; break;
    case "frozen": return 0;
    case "launch": mix(POSE.air, POSE.air, 0, out); out.pitch = -0.9 - Math.min(0.9, f.st * 0.03) + (f.vy < 0 ? -0.3 : 0); out.up = 0.25; rate = 0.5; break;
    case "kd": case "ko": mix(POSE.lying, POSE.lying, 0, out); rate = 0.55; break;
    case "getup": { const u = f.st / 18; if (u < 0.5) mix(POSE.lying, POSE.getup, ease(u * 2), out); else mix(POSE.getup, stance, ease(u * 2 - 1), out); if (f.getupDir) out.pitch += -f.getupDir * Math.PI * 2 * ease(u) * 0; rate = 0.7; break; }
    case "lag": mix(stance, crouch, 0.3, out); rate = 0.4; break;
    case "win": {
      const v = VICTORY[def.anim.victory] || VICTORY.armsCrossed, u = ease(clamp01(f.st / 26));
      mix(stance, v, u, out);
      if (v.bob) { const s = Math.sin(time * 9); out.ll[0] = 0.25 + s * 0.5; out.rl[0] = 0.25 - s * 0.5; out.lk = 0.6 + s * 0.4; out.rk = 0.6 - s * 0.4; out.la[0] = -s * 0.5; out.ra[0] = s * 0.5; out.y -= Math.abs(Math.cos(time * 9)) * 0.04; }
      if (v.turn) out.yaw += time * 2.4 * u;
      out.up += (v.up ? Math.sin(time * 2) * 0.05 : 0); out.sp[0] += breathe * 0.02;
      rate = 0.25; break;
    }
    case "lose": mix(POSE.lose, POSE.lose, 0, out); rate = 0.12; break;
    default: mix(stance, stance, 0, out);
  }
  return rate;
}

export const BASE_YAW = 1.12;   // how far fighters turn away from the camera to face each other
// Write a pose onto a built model (see models.js for the joints)
export function applyPose(rig, p) {
  const J = rig.joints, H = rig.look.h;
  J.body.rotation.order = "YXZ";
  J.body.rotation.set(p.pitch, BASE_YAW + p.yaw, p.spin || 0);
  J.body.position.set(0, p.up * H, p.dz);
  // pivot whole-body flips around the waist instead of the feet
  if (Math.abs(p.pitch) > 0.01) { const c = rig.hipY, s = Math.sin(p.pitch), co = Math.cos(p.pitch); J.body.position.y += c - c * co; J.body.position.addScaledVector(TMPV.set(Math.sin(BASE_YAW + p.yaw), 0, Math.cos(BASE_YAW + p.yaw)), -c * s); }
  J.hips.position.y = rig.hipY + p.y * H;
  J.hips.rotation.set(p.lean * 0.4, p.twist, p.roll);
  J.spine.rotation.set(p.lean * 0.6 + p.sp[0], p.sp[1], p.sp[2]);
  J.chest.rotation.set(p.sp[0] * 0.5, p.sp[1] * 0.6 - p.twist * 0.25, p.sp[2] * 0.5);
  J.head.rotation.set(p.hd[0], p.hd[1], p.hd[2]);
  J.lArm.rotation.set(-p.la[0], p.la[2], p.la[1]); J.lElbow.rotation.x = -p.le;
  J.rArm.rotation.set(-p.ra[0], -p.ra[2], -p.ra[1]); J.rElbow.rotation.x = -p.re;
  const comp = p.lean * 0.4;
  J.lLeg.rotation.set(-p.ll[0] - comp, 0, p.ll[1]); J.lKnee.rotation.x = p.lk; J.lFoot.rotation.x = p.lf + (p.ll[0] - p.lk) * 0.6;
  J.rLeg.rotation.set(-p.rl[0] - comp, 0, -p.rl[1]); J.rKnee.rotation.x = p.rk; J.rFoot.rotation.x = p.rf + (p.rl[0] - p.rk) * 0.6;
}
import { Vector3 } from "../lib/three.module.min.js";
const TMPV = new Vector3();

// Capes, coat tails, hair, floating bits: simple follow-through motion
export function secondary(rig, time, speed, airborne) {
  const J = rig.joints, sw = Math.sin(time * 3.1) * 0.05;
  const drag = Math.max(-0.2, Math.min(1.2, speed * 9)) + (airborne ? 0.5 : 0);
  if (J.cape) { J.cape.rotation.x = -0.12 - drag * 0.7 + sw; J.cape2.rotation.x = -0.1 - drag * 0.4 + Math.sin(time * 3.1 + 1) * 0.08; J.cape3.rotation.x = -0.08 - drag * 0.3 + Math.sin(time * 3.1 + 2) * 0.1; }
  if (J.tails) for (const t of J.tails.children) { t.rotation.x = (Math.cos(t.userData.a) < 0 ? -1 : 0.4) * (0.12 + drag * 0.5) + Math.sin(time * 2.7 + t.userData.a) * 0.04; }
  if (J.scarf) { J.scarf.rotation.x = -0.5 - drag * 0.9 + sw * 2; J.scarf.rotation.z = Math.sin(time * 4) * 0.15; }
  if (J.hairBack) J.hairBack.rotation.x = -0.1 - drag * 0.5 + sw;
  if (J.tail) J.tail.rotation.y = Math.sin(time * 2.5) * 0.5;
  if (J.flameHair) { J.flameHair.scale.y = 1 + Math.sin(time * 17) * 0.12; J.flameHair.rotation.x = -drag * 0.5; }
  if (J.orbit) { J.orbit.rotation.y = time * 1.3; for (const o of J.orbit.children) o.position.y += Math.sin(time * 2 + o.userData.orb * 2) * 0.0015; }
  if (J.halo) J.halo.rotation.z = time * 0.6;
}

export const VICTORY_NAMES = Object.keys(VICTORY);
export { POSE, VICTORY, guard, A as ATK, crouch };
