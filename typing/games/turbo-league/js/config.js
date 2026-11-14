// Turbo League — every tunable number in one place.
// Units: meters, seconds, meters/second. "y" is up, the field runs along "z"
// (Blue defends the goal at -z, Orange defends +z), and "x" is across the field.
// The developer tuning panel (press ` or add ?dev=1) changes these live.

export const ARENA = {
  hx: 34,        // half the field width  (field is 68 m wide)
  hz: 46,        // half the field length (92 m goal line to goal line)
  h: 19,         // ceiling height
  cornerR: 10,   // how round the 4 vertical corners are
  edgeR: 4.5,    // how round the curve is where floor/ceiling meet the walls (the "ramps")
  goalW: 14,     // goal mouth width
  goalH: 6.4,    // goal mouth height
  goalD: 7,      // how deep the goal box is
};

export const PHYS = {
  hz: 120,       // physics steps per second (fixed, so every computer gets the same game)
  gravity: 6.5,  // lower than real gravity: cars and ball hang in the air longer
};

export const BALL = {
  r: 0.93,
  mass: 1 / 6,          // relative to a car (car = 1)
  restitution: 0.6,     // bounciness off walls and floor
  friction: 0.35,       // grip of the ball on surfaces (makes it spin and roll)
  drag: 0.03,           // air resistance per second
  maxSpeed: 60,
  maxSpin: 6,
};

export const CAR = {
  half: [0.42, 0.18, 0.6],     // hitbox half-size: width, height, length (same for every body = fair play)
  wheelX: 0.385, wheelY: -0.05, wheelFront: 0.43, wheelRear: -0.4,
  wheelR: 0.2,
  suspRest: 0.12,              // spring travel
  springK: 100, springC: 6.5,  // spring stiffness and damping (per wheel)
  inertia: [0.131, 0.179, 0.0697], // pitch, yaw, roll resistance (box of mass 1)

  maxSpeed: 23,                // absolute top speed (needs boost)
  throttleTop: 14.1,           // fastest you can go without boost
  throttleAccel: 16,           // push at a standstill; fades to 0 at throttleTop
  brakeAccel: 35,
  coastDecel: 5.25,
  reverseScale: 1,
  boostAccel: 9.9,
  boostUse: 33.3,              // boost units per second (meter is 0-100)
  supersonic: 22,

  grip: 28,                    // how fast sideways sliding is cancelled (per second)
  slideGrip: 2.6,              // the same while powersliding (handbrake)
  slideTurn: 1.35,             // extra turning while powersliding
  sticky: 3.25,                // pull toward the surface while on wheels (lets you drive up walls)
  steerRate: 18,               // how quickly the car's turn rate follows the stick

  jumpImpulse: 2.92,
  jumpHold: 14.6,              // extra lift per second while jump is held...
  jumpHoldTime: 0.2,           // ...for this long
  doubleJumpWindow: 1.25,      // time after the first jump when a second jump/dodge is allowed
  dodgeImpulse: 5.0,
  dodgeSpin: 5.5,              // flip speed (radians per second)
  dodgeTime: 0.65,
  dodgeDeadzone: 0.5,

  airPitch: 12.46, airYaw: 9.11, airRoll: 38.34,      // air control strength
  airDampPitch: 2.8, airDampYaw: 1.9, airDampRoll: 4.55,
  maxSpin: 5.5,

  bodyRestitution: 0.1, bodyFriction: 0.6,
};

// The "extra kick" the ball gets from a car hit, so shots feel powerful (scaled by impact speed).
export const HIT = { lowSpeed: 0.65, midSpeed: 0.66, highSpeed: 0.3, upFlatten: 0.35, forwardFlatten: 0.35 };

export const BOOST = { start: 33, smallAmount: 12, bigAmount: 100, smallRespawn: 4, bigRespawn: 10, smallR: 1.45, bigR: 2.1, height: 1.7 };

export const MATCH = { kickoffCountdown: 3, goalReplay: 3.2, length: 300 };

// Boost pad layout (x, z, big?) — mirrored in every competitive arena.
export function boostPads() {
  const A = ARENA, pads = [];
  const big = [[-(A.hx - 3.2), 0], [A.hx - 3.2, 0], [-(A.hx - 4.6), -(A.hz - 9)], [A.hx - 4.6, -(A.hz - 9)], [-(A.hx - 4.6), A.hz - 9], [A.hx - 4.6, A.hz - 9]];
  for (const [x, z] of big) pads.push({ x, z, big: true });
  const small = [
    [0, -(A.hz - 4)], [0, A.hz - 4], [-11, -(A.hz - 6)], [11, -(A.hz - 6)], [-11, A.hz - 6], [11, A.hz - 6],
    [0, -32], [0, 32], [-20, -30], [20, -30], [-20, 30], [20, 30],
    [-9, -20], [9, -20], [-9, 20], [9, 20], [0, -12], [0, 12],
    [-26, -14], [26, -14], [-26, 14], [26, 14], [-14, 0], [14, 0],
  ];
  for (const [x, z] of small) pads.push({ x, z, big: false });
  return pads;
}

// Kickoff spots for Blue (Orange uses the mirror image). Facing the ball.
export const KICKOFFS = [[-17, -23], [17, -23], [-2.2, -33], [2.2, -33], [0, -38]];
