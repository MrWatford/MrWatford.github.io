// Hero Clash — Ultimate Move cinematics and fighter entrances.
// These only decide where the fighters, camera, and effects are drawn while the
// combat engine has both fighters locked. Damage is applied by combat.js on its
// own beat timings, so nothing here can change the result of a match.
import * as THREE from "../lib/three.module.min.js";
import { mix, POSE, STANCE, VICTORY, guard, ATK, crouch } from "./anim.js";
import { EL, symTex } from "./render.js";

const ease = (t) => (t <= 0 ? 0 : t >= 1 ? 1 : t * t * (3 - 2 * t));
// value along a track of [time, value] points
function tr(u, pts) {
  if (u <= pts[0][0]) return pts[0][1];
  for (let i = 1; i < pts.length; i++) if (u <= pts[i][0]) { const a = pts[i - 1], b = pts[i]; return a[1] + (b[1] - a[1]) * ease((u - a[0]) / (b[0] - a[0])); }
  return pts[pts.length - 1][1];
}
const seg = (u, pts) => { let p = pts[0][1]; for (const q of pts) if (u >= q[0]) p = q[1]; return p; };
const set = (tp, pose, extra) => { mix(pose, pose, 0, tp); if (extra) Object.assign(tp, extra); };

function prop(stage, name, make) {
  const st = stage.cineState; st.props = st.props || {};
  if (!st.props[name]) { st.props[name] = make(); stage.fxGroup.add(st.props[name]); }
  return st.props[name];
}
const glowSprite = (color, s) => { const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: stage_glow(), color, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending })); sp.scale.setScalar(s); return sp; };
let _glow = null;
function stage_glow() {
  if (_glow) return _glow;
  const cv = document.createElement("canvas"); cv.width = cv.height = 64; const g = cv.getContext("2d");
  const r = g.createRadialGradient(32, 32, 0, 32, 32, 32); r.addColorStop(0, "rgba(255,255,255,1)"); r.addColorStop(0.3, "rgba(255,255,255,.6)"); r.addColorStop(1, "rgba(255,255,255,0)"); g.fillStyle = r; g.fillRect(0, 0, 64, 64);
  return (_glow = new THREE.CanvasTexture(cv));
}
function orb(stage, name, color, core = 0xffffff) {
  return prop(stage, name, () => { const g = new THREE.Group(); g.add(new THREE.Mesh(new THREE.SphereGeometry(0.5, 20, 14), new THREE.MeshBasicMaterial({ color: core }))); g.add(glowSprite(color, 3)); return g; });
}
function textSprite(stage, name, text, color, w = 5) {
  return prop(stage, name, () => {
    const cv = document.createElement("canvas"); cv.width = 1024; cv.height = 192; const g = cv.getContext("2d");
    g.font = "bold 120px Georgia, serif"; g.textAlign = "center"; g.textBaseline = "middle"; g.shadowColor = "#fff"; g.shadowBlur = 18; g.fillStyle = "#fff"; g.fillText(text, 512, 100, 1000);
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(cv), color, transparent: true, depthWrite: false })); sp.scale.set(w, w * 0.1875, 1); return sp;
  });
}
function beamProp(stage, name, color) {
  return prop(stage, name, () => { const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: stage_beam(), color, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide })); return m; });
}
let _beam = null;
function stage_beam() {
  if (_beam) return _beam;
  const cv = document.createElement("canvas"); cv.width = cv.height = 64; const g = cv.getContext("2d");
  const r = g.createLinearGradient(0, 0, 0, 64); r.addColorStop(0, "rgba(255,255,255,0)"); r.addColorStop(0.5, "rgba(255,255,255,1)"); r.addColorStop(1, "rgba(255,255,255,0)"); g.fillStyle = r; g.fillRect(0, 0, 64, 64);
  return (_beam = new THREE.CanvasTexture(cv));
}
// place a beam between two points
function aim(b, x0, y0, x1, y1, thick) { const dx = x1 - x0, dy = y1 - y0, len = Math.hypot(dx, dy) || 0.01; b.position.set((x0 + x1) / 2, (y0 + y1) / 2, 0.25); b.rotation.z = Math.atan2(dy, dx); b.scale.set(len, thick, 1); }
// run fn once when the cinematic passes time u0
function once(stage, key, u, u0, fn) { const st = stage.cineState; st.done = st.done || {}; if (u >= u0 && !st.done[key]) { st.done[key] = true; fn(); } }

// ---------------------------------------------------------------- choreography
// Each returns { ax, ay, dx, dy } offsets from the cinematic's centre (x toward the defender is +),
// sets the two poses, the camera, and spawns effects. u runs 0 -> 1.
const flurryPose = (tp, t) => { const k = Math.floor(t / 4) % 2; set(tp, k ? ATK.flurry.h : ATK.flurry.h2); };
const hurtPose = (tp, t, extra) => { set(tp, Math.floor(t / 6) % 2 ? POSE.hitHi : POSE.hitLo, extra); };
const floatPose = (tp, t) => { set(tp, POSE.held, { pitch: -0.3 + Math.sin(t * 0.08) * 0.2, yaw: t * 0.05 }); };

const CH = {
  // Titan Prime: launch, leap after them, drive them down like a meteor
  meteor(S, u, t, col, A, D, o) {
    const ay = tr(u, [[0.36, 0], [0.5, 7.4], [0.6, 7.4], [0.88, 0.05]]), dy = tr(u, [[0.28, 0], [0.5, 6.4], [0.6, 6.5], [0.88, 0]]);
    const ax = tr(u, [[0, -0.9], [0.5, -0.6], [0.88, 0.2]]), dx = tr(u, [[0, 0.6], [0.6, 0.6], [0.88, 0.9]]);
    if (u < 0.2) set(A, ATK.upper.w); else if (u < 0.36) set(A, ATK.upper.h); else if (u < 0.5) set(A, ATK.rising.h); else if (u < 0.6) set(A, ATK.slam.w); else if (u < 0.9) set(A, ATK.slam.h, { pitch: 0.5 }); else set(A, VICTORY.armsCrossed, { yaw: 0 });
    if (u < 0.28) hurtPose(D, t); else if (u < 0.9) set(D, POSE.air, { pitch: -1 - t * 0.12, up: 0.3 }); else set(D, POSE.lying);
    S.camOverride = { x: o.c + o.s * 0.2, y: Math.max(1.3, (ay + dy) / 2 + 0.6), d: u > 0.5 && u < 0.6 ? 5.5 : 8.5 };
    if (u > 0.5 && u < 0.6) S.emit({ x: o.c + o.s * ax, y: ay + 1.4, n: 2, color: col, tex: "ring", size: 2.5, life: 10, grow: 0.2 });
    if (u > 0.6 && u < 0.88) S.emit({ x: o.c + o.s * dx, y: dy + 1.5, n: 3, color: col, size: 0.7, life: 16, vy: 0.1, spread: 0.5 });
    once(S, "boom", u, 0.88, () => { for (let i = 0; i < 3; i++) S.emit({ x: o.c + o.s * dx, y: 0.15, n: 2, color: i ? col : 0xffffff, tex: "ring", size: 0.6, life: 26 + i * 8, grow: 14 + i * 5 }); S.emit({ x: o.c + o.s * dx, y: 0.2, n: 26, color: 0xd8c8a8, tex: "smoke", speed: 0.16, life: 40, size: 0.9, flat: true, solid: true, opacity: 0.6 }); S.shake = 0.45; });
    return { ax, ay, dx, dy };
  },
  // Speedsters / brawlers: blur back and forth through the opponent, then one big finish
  rush(S, u, t, col, A, D, o) {
    const fast = u > 0.22 && u < 0.84, w = o.p.w || 2.4, f = o.p.f || 26;
    const ax = fast ? Math.sin((u - 0.22) * f) * w + 0.5 : u < 0.22 ? tr(u, [[0, -1], [0.22, -2.6]]) : tr(u, [[0.84, -1.2], [0.92, 0.1], [1, -0.7]]);
    const dy = tr(u, [[0.25, 0], [0.5, 0.9], [0.84, 1.3], [0.93, 2.6], [1, 0.3]]), dx = tr(u, [[0, 0.5], [0.9, 0.5], [1, 2.2]]);
    if (u < 0.22) set(A, ATK.blur.w); else if (fast) { set(A, ATK.blur.h); A.yaw = Math.cos((u - 0.22) * f) > 0 ? 0 : -2.2; } else if (u < 0.92) set(A, ATK.bigpunch.h); else set(A, STANCE[o.a.def.anim.stance] || guard);
    if (u < 0.9) hurtPose(D, t, { up: 0.1 }); else set(D, POSE.air, { pitch: -1.6, up: 0.3 });
    const ay = fast ? Math.max(0, Math.sin((u - 0.22) * f * 0.5)) * (o.p.hop || 0.5) : 0;
    if (fast) { S.emit({ x: o.c + o.s * ax, y: ay + 1, n: 2, color: col, size: 0.8, life: 14, sx: 4, spreadY: 1.3, spread: 0.2, spin: false }); if (t % 5 === 0) S.burst(o.c + o.s * dx + (Math.random() - 0.5) * 0.6, dy + 0.6 + Math.random() * 0.9, col, 1); }
    S.camOverride = { x: o.c + o.s * 0.4, y: 1.4 + dy * 0.3, d: fast ? 7.5 : 6.2 };
    return { ax, ay, dx, dy, avis: !(o.p.blink && fast && t % 6 < 2) };
  },
  // Storm callers: rise, darken the sky, and bring bolts down
  storm(S, u, t, col, A, D, o) {
    const ay = tr(u, [[0.05, 0], [0.25, 2.2], [0.88, 2.2], [1, 0]]), ax = -2.6, dx = 0.9, dy = tr(u, [[0.3, 0], [0.5, 0.5], [0.9, 0.5], [0.95, 0]]);
    if (u < 0.9) set(A, ATK.raise.h, { up: 0.1, yaw: -0.3 }); else set(A, VICTORY[o.a.def.anim.victory] || guard, { up: 0 });
    if (u < 0.92) hurtPose(D, t); else set(D, POSE.lying);
    S.darkTarget = 0.85;
    const X = o.c + o.s * dx;
    for (const b of o.c_beats) once(S, "b" + b, u, b - 0.01, () => {
      const bolt = beamProp(S, "bolt" + b, col); aim(bolt, X + (Math.random() - 0.5), 14, X, 0.2, b > 0.85 ? 3.2 : 1.2); bolt.userData.die = t + (b > 0.85 ? 16 : 8);
      S.emit({ x: X, y: 0.3, n: 14, color: col, speed: 0.14, life: 20, size: 0.3 }); S.emit({ x: X, y: 0.2, n: 2, color: 0xffffff, tex: "ring", size: 0.5, life: 22, grow: 10 });
      if (!S.reducedFlash) S.flash = Math.max(S.flash, 0.5);
    });
    for (const k in S.cineState.props) { const b = S.cineState.props[k]; if (b.userData.die) b.visible = t < b.userData.die && (S.reducedFlash || t % 2 === 0); }
    if (o.p.wind) for (let i = 0; i < 2; i++) S.emit({ x: X + Math.sin(t * 0.5 + i * 3) * (1.6 - u), y: 0.3 + ((t * 0.07 + i) % 3), n: 1, color: 0xdff2ff, tex: "smoke", size: 1.0, life: 14, opacity: 0.5 });
    if (t % 3 === 0) S.emit({ x: o.c + o.s * ax, y: ay + 1.8, n: 1, color: col, speed: 0.06, life: 14, size: 0.3 });
    S.camOverride = { x: o.c - o.s * 0.6, y: 2.3, d: 10 };
    return { ax, ay, dx, dy };
  },
  // Ranged fighters: back off, open fire from long range, finish with one huge shot
  barrage(S, u, t, col, A, D, o) {
    const ay = tr(u, [[0.05, 0], [0.22, o.p.fly ? 2.4 : 0], [0.9, o.p.fly ? 2.4 : 0], [1, 0]]), ax = tr(u, [[0, -1], [0.22, -3.6]]), dx = 1.6, dy = tr(u, [[0.8, 0], [0.9, 1.6], [1, 0.2]]);
    const fin = u > 0.78;
    if (u < 0.2) set(A, ATK.powerup.w); else if (!fin) set(A, t % 10 < 5 ? (ATK[o.p.pose] || ATK.palm).h : (ATK[o.p.pose] || ATK.palm).w, { up: 0.05 }); else if (u < 0.92) set(A, ATK.palm.h, { lean: -0.2 }); else set(A, VICTORY[o.a.def.anim.victory] || guard);
    if (u < 0.86) hurtPose(D, t); else set(D, POSE.air, { pitch: -1.4, up: 0.3 });
    const x0 = o.c + o.s * (ax + 0.6), y0 = ay + 1.3, x1 = o.c + o.s * dx, y1 = dy + 1.0;
    if (u > 0.22 && !fin && t % (o.p.rate || 5) === 0) {
      const b = beamProp(S, "sh" + (t % 20), col); aim(b, x0, y0 + (Math.random() - 0.5) * 0.5, x1, y1 + (Math.random() - 0.5) * 1.2, o.p.thick || 0.25); b.userData.die = t + 4; b.visible = true;
      S.emit({ x: x1, y: y1 + (Math.random() - 0.5), n: 4, color: col, speed: 0.08, life: 14, size: 0.25 });
      if (o.p.rain) S.emit({ x: x1 + (Math.random() - 0.5) * 2, y: 6, n: 2, color: col, size: 0.5, life: 16, vy: -0.36, sx: 0.25, drag: 1, spin: false });
    }
    for (const k in (S.cineState.props || {})) { const b = S.cineState.props[k]; if (b.userData.die) b.visible = t < b.userData.die; }
    if (fin && u < 0.92) { const b = beamProp(S, "big", col); aim(b, x0, y0, x1 + o.s * 6, y1, 1.6 + Math.sin(t) * 0.3); b.visible = true; S.emit({ x: x1, y: y1, n: 3, color: 0xffffff, speed: 0.12, life: 14, size: 0.4 }); S.shake = Math.max(S.shake, 0.1); }
    else if (S.cineState.props && S.cineState.props.big) S.cineState.props.big.visible = false;
    S.camOverride = { x: o.c - o.s * 0.9, y: 1.6 + ay * 0.3, d: fin ? 8 : 10.5 };
    return { ax, ay, dx, dy };
  },
  // Shadow Knight / Phantom Ninja style: smoke, strikes from both sides, drop from above
  takedown(S, u, t, col, A, D, o) {
    const step = Math.floor(u * 10), hitting = u > 0.2 && u < 0.8;
    const sideNow = step % 2 ? 1 : -1;
    const ax = hitting ? 0.6 + sideNow * 1.0 : u <= 0.2 ? -1 : tr(u, [[0.8, 0.5], [0.9, 0.5], [1, -0.8]]);
    const ay = u >= 0.8 && u < 0.9 ? tr(u, [[0.8, 4.5], [0.9, 0.2]]) : 0;
    const dx = 0.6, dy = tr(u, [[0.7, 0], [0.8, 1.2], [0.9, 0], [1, 0]]);
    const k = (u * 10) % 1;
    if (u <= 0.2) set(A, ATK.throwing.w); else if (hitting) set(A, step % 3 === 0 ? ATK.bigpunch.h : step % 3 === 1 ? ATK.flykick.h : ATK.palm.h, { yaw: sideNow > 0 ? -2.2 : 0 }); else if (u < 0.9) set(A, ATK.adive.h); else set(A, VICTORY[o.a.def.anim.victory] || guard);
    if (u < 0.88) hurtPose(D, t); else set(D, POSE.lying);
    if (hitting && k < 0.12) S.emit({ x: o.c + o.s * ax, y: 1, n: 5, color: o.p.smoke || 0x8088a0, tex: "smoke", size: 1.1, life: 22, speed: 0.04, spread: 0.6, solid: true, opacity: 0.7 });
    once(S, "smoke", u, 0.1, () => S.emit({ x: o.c + o.s * 0.2, y: 0.8, n: 18, color: o.p.smoke || 0x8088a0, tex: "smoke", size: 1.6, life: 50, speed: 0.07, spread: 2.5, solid: true, opacity: 0.75 }));
    S.camOverride = { x: o.c + o.s * 0.6, y: 1.4 + ay * 0.2, d: 6.4 };
    return { ax, ay, dx, dy, avis: !(hitting && k > 0.78) };
  },
  // Energy masters: hold the opponent in the air, build a giant sphere, release it
  cosmic(S, u, t, col, A, D, o) {
    const ax = -2.4, ay = o.p.fly ? tr(u, [[0.1, 0], [0.3, 1.5], [0.9, 1.5], [1, 0]]) : 0, dx = 1.2, dy = tr(u, [[0.12, 0], [0.3, 1.5], [0.82, 1.7], [0.9, 2.4], [1, 0.2]]);
    if (u < 0.78) set(A, ATK.raise.h, { lean: -0.2 }); else if (u < 0.92) set(A, ATK.slam.h, { y: -0.1 }); else set(A, VICTORY[o.a.def.anim.victory] || guard);
    if (u < 0.9) floatPose(D, t); else set(D, POSE.air, { pitch: -1.5, up: 0.3 });
    const ob = orb(S, "orb", col, o.p.core === undefined ? 0xffffff : o.p.core);
    const grow = tr(u, [[0.1, 0.1], [0.72, o.p.size || 2.6]]);
    const ox = tr(u, [[0.76, o.c + o.s * (ax + 0.3)], [0.88, o.c + o.s * dx]]), oy = tr(u, [[0.76, ay + 3.4 + grow * 0.4], [0.88, dy + 1]]);
    ob.position.set(ox, oy, 0); ob.scale.setScalar(u < 0.89 ? grow * (1 + Math.sin(t * 0.6) * 0.04) : 0.001); ob.visible = u < 0.9;
    if (u < 0.76) { const a = Math.random() * 6.28; S.emit({ x: ox + Math.cos(a) * grow * 1.3, y: oy + Math.sin(a) * grow * 1.3, n: 1, color: col, size: 0.25, life: 12, vx: -Math.cos(a) * 0.1, vy: -Math.sin(a) * 0.1, drag: 1 }); }
    if (o.p.hold && u > 0.25 && u < 0.88 && t % 4 === 0) S.emit({ x: o.c + o.s * dx, y: dy + 1, n: 1, color: col, tex: o.p.hold, size: 1.8, life: 12, grow: 0.3 });
    once(S, "boom", u, 0.89, () => { const X = o.c + o.s * dx; for (let i = 0; i < 4; i++) S.emit({ x: X, y: dy + 1, n: 2, color: i % 2 ? col : 0xffffff, tex: "ring", size: 0.8, life: 24 + i * 6, grow: 10 + i * 4 }); S.emit({ x: X, y: dy + 1, n: 30, color: col, tex: o.p.shard ? "shard" : undefined, speed: 0.22, life: 34, size: 0.4, g: o.p.shard ? 0.006 : 0 }); S.shake = 0.4; });
    S.darkTarget = 0.8;
    S.camOverride = { x: o.c - o.s * 0.4, y: 2.2 + grow * 0.25, d: 9.5 + grow * 0.5 };
    return { ax, ay, dx, dy };
  },
  // The Professor: FINAL EXAM! (announcement, equations, machine, the final answer, extra credit)
  exam(S, u, t, col, A, D, o) {
    const ax = -2.6, dx = 1.3, dy = tr(u, [[0.34, 0], [0.5, 1.2], [0.84, 1.4], [0.9, 2.2], [1, 0.2]]);
    if (u < 0.16) set(A, STANCE.teacher, { ra: [1.25, 0.9, 0.3], re: 2.3, yaw: -0.5 });                // adjusts glasses
    else if (u < 0.5) set(A, t % 12 < 6 ? ATK.palm.h : ATK.throwing.h);                                  // equation barrage
    else if (u < 0.72) set(A, ATK.device.h);                                                             // the machine
    else if (u < 0.9) set(A, ATK.point.h, { lean: -0.1 });                                               // "TIME'S UP!"
    else set(A, VICTORY.straighten);
    if (u < 0.34) hurtPose(D, t); else if (u < 0.9) floatPose(D, t); else set(D, POSE.air, { pitch: -1.5, up: 0.3 });
    S.darkTarget = 0.9;
    const X = o.c + o.s * dx, Y = dy + 1;
    // virtual classroom: glowing grid floor and drifting symbols
    const grid = prop(S, "grid", () => { const g = new THREE.GridHelper(40, 40, col, col); g.material.transparent = true; g.material.opacity = 0.5; g.position.y = 0.03; return g; });
    grid.position.x = o.c; grid.material.opacity = 0.5 * ease(u * 6) * (u > 0.94 ? (1 - u) * 16 : 1);
    if (u > 0.1 && u < 0.9 && t % 3 === 0) { const s = ["π", "∑", "√", "x²", "∞", "÷", "△", "θ", "≠", "7", "+"]; S.emit({ x: o.c + (Math.random() - 0.5) * 14, y: 0.3, n: 1, color: col, tex: symTex(s[t % s.length]), size: 0.5, life: 70, vy: 0.035, drag: 1, solid: true, opacity: 0.7, spin: false }); }
    if (u > 0.16 && u < 0.5 && t % 6 === 0) { const x0 = o.c + o.s * (ax + 0.6); const sy = ["x²", "π", "√", "∑"][(t / 6) % 4 | 0]; S.emit({ x: x0, y: 1.3, n: 1, color: 0xffffff, tex: symTex(sy), size: 0.7, life: 12, vx: o.s * (X - x0) * o.s / 12, vy: (Y - 1.3) / 12, drag: 1, solid: true, spin: false, grow: 1 }); S.emit({ x: X, y: Y + (Math.random() - 0.5), n: 5, color: col, speed: 0.09, life: 14, size: 0.25 }); }
    if (u > 0.5 && u < 0.9) { // the science machine: three spinning rings around the opponent
      const m = prop(S, "machine", () => { const g = new THREE.Group(); for (let i = 0; i < 3; i++) { const r = new THREE.Mesh(new THREE.TorusGeometry(1.25 + i * 0.22, 0.035, 6, 40), new THREE.MeshBasicMaterial({ color: i === 1 ? 0xffffff : col })); g.add(r); } return g; });
      m.position.set(X, Y, 0); m.children.forEach((r, i) => { r.rotation.set(t * 0.07 * (i + 1), t * 0.05 * (3 - i), i); }); m.visible = true; m.scale.setScalar(ease((u - 0.5) * 8));
      if (t % 2 === 0) { const a = t * 0.4; S.emit({ x: X + Math.cos(a) * 1.4, y: Y + Math.sin(a) * 1.4, n: 1, color: col, size: 0.3, life: 14 }); }
    } else if (S.cineState.props.machine) S.cineState.props.machine.visible = false;
    if (u > 0.68 && u < 0.9) { const eq = textSprite(S, "eq", "E = mc²  ∴  x = ∞", col, 9); eq.position.set(o.c, 5.2 - (u > 0.84 ? (u - 0.84) * 40 : 0), -0.5); eq.scale.set(9 * ease((u - 0.68) * 9), 9 * 0.1875, 1); eq.visible = u < 0.885; }
    else if (S.cineState.props.eq) S.cineState.props.eq.visible = false;
    once(S, "boom", u, 0.885, () => { for (let i = 0; i < 4; i++) S.emit({ x: X, y: Y, n: 2, color: i % 2 ? col : 0xffffff, tex: "ring", size: 0.8, life: 26 + i * 6, grow: 11 + i * 4 }); const s = ["π", "∑", "√", "x²", "∞", "+", "="]; for (let i = 0; i < 16; i++) S.emit({ x: X, y: Y, n: 1, color: col, tex: symTex(s[i % s.length]), speed: 0.2, life: 40, size: 0.6, solid: true, spin: false, g: 0.004 }); S.shake = 0.4; });
    const lines = [[0.02, "Class, it's time for your FINAL EXAM!"], [0.72, "TIME'S UP!"], [0.93, "Looks like somebody needs extra credit."]];
    S.cineLine = seg(u, [[0, ""], ...lines.map(([a, s]) => [a, s]), [0.2, u < 0.2 ? lines[0][1] : ""], [0.72, u >= 0.72 && u < 0.9 ? lines[1][1] : u >= 0.93 ? lines[2][1] : ""]]);
    S.cineLine = u < 0.2 ? lines[0][1] : u >= 0.72 && u < 0.9 ? lines[1][1] : u >= 0.93 ? lines[2][1] : "";
    S.camOverride = u < 0.16 ? { x: o.c + o.s * ax, y: 1.5, d: 4.2 } : u > 0.92 ? { x: o.c + o.s * ax, y: 1.4, d: 4.6 } : { x: o.c - o.s * 0.5, y: 2.2, d: 10.5 };
    return { ax, ay: 0, dx, dy };
  },
};

// Which choreography each fighter uses, with its own settings
const PLAN = {
  titan: ["meteor", {}], velocity: ["rush", { f: 30, w: 2.8 }], wildclaw: ["rush", { f: 20, w: 1.8, hop: 1.6 }], web: ["rush", { f: 14, w: 2.6, hop: 2.6 }],
  ninja: ["takedown", { smoke: 0x4a3a66 }], shadow: ["takedown", { smoke: 0x7a8098 }],
  thunder: ["storm", {}], storm: ["storm", { wind: true }],
  sentinel: ["barrage", { fly: true, pose: "palm", rate: 4, thick: 0.35 }], archer: ["barrage", { pose: "bowup", rate: 3, thick: 0.08, rain: true }], mecha: ["barrage", { pose: "shoulder", rate: 5, thick: 0.5 }],
  solar: ["cosmic", { fly: true, size: 3.0 }], sage: ["cosmic", { hold: "ring", size: 2.2 }], frost: ["cosmic", { core: 0xdff6ff, shard: true, hold: "shard", size: 2.2 }],
  overlord: ["cosmic", { core: 0x120018, size: 3.0, hold: "ring" }], inferno: ["cosmic", { core: 0xfff0a0, size: 2.8, fly: true }],
  professor: ["exam", {}],
};

// Called by the renderer for each fighter while match.cine is active
export function cineFrame(S, match, i, tp) {
  const c = match.cine; if (!S.cineState) S.cineState = {};
  const a = match.f[c.att], d = match.f[1 - c.att], s = a.facing, u = c.t / c.len;
  const st = S.cineState;
  if (st.frame !== match.frame) {   // work both fighters out once per frame
    st.frame = match.frame; st.A = st.A || {}; st.D = st.D || {};
    const [kind, p] = PLAN[a.def.id] || ["rush", {}];
    const sum = c.beats.reduce((x, b) => x + 1, 0);
    S.cineLine = "";
    st.r = CH[kind](S, u, c.t, EL[a.def.el], st.A, st.D, { c: c.x, s, a, d, p, c_beats: c.beats.map((b) => (b.t * c.k) / c.len), sum });
  }
  const r = st.r, mine = i === c.att;
  mix(mine ? st.A : st.D, mine ? st.A : st.D, 0, tp);
  return { x: c.x + s * (mine ? r.ax : r.dx), y: mine ? r.ay : r.dy, face: mine ? s : -s, vis: mine ? r.avis !== false : true };
}

// ---------------------------------------------------------------- entrances
const INTRO = { flyIn: "drop", dropIn: "drop", jetLand: "drop", leapIn: "drop", zoomIn: "side", swingIn: "side", classIn: "walk",
  boltIn: "appear", portalIn: "appear", freezeIn: "appear", smokeIn: "appear", fireIn: "appear", riseIn: "rise", bootUp: "boot" };
export function introFrame(S, match, i, tp) {
  const total = match.opts.intro, f = match.f[i], def = f.def, col = EL[def.el];
  const u = i === 0 ? match.pt / 70 : (match.pt - 75) / 70;   // fighter 1 enters first, then fighter 2
  const stance = STANCE[def.anim.stance] || guard, kind = INTRO[def.anim.intro] || "appear";
  const home = f.x, from = home - f.facing * 7;
  if (u > 0 && u < 1.04) S.camOverride = { x: home, y: 1.35, d: 5.6 };
  if (u <= 0) { mix(stance, stance, 0, tp); return { x: home, y: 0, vis: i === 0 ? false : kind !== "boot" ? false : true }; }
  let x = home, y = 0, vis = true;
  const done = u >= 0.7, k = Math.min(1, u / 0.7);
  if (done) { mix(stance, ATK.powerup.h, Math.sin(Math.min(1, (u - 0.7) / 0.3) * Math.PI) * 0.6, tp); return { x, y, vis }; }
  const key = "in" + i; S.introDone = S.introDone || {};
  const pop = (fn) => { if (!S.introDone[key + match.round]) { S.introDone[key + match.round] = true; fn(); } };
  if (kind === "drop") { y = (1 - ease(k)) * 9; mix(k < 0.85 ? POSE.fall : crouch, crouch, 0, tp); if (def.anim.intro === "jetLand" || def.anim.intro === "flyIn") { mix(STANCE.hover, STANCE.hover, 0, tp); S.emit({ x, y: y + 0.1, n: 1, color: col, size: 0.4, life: 12, vy: -0.05 }); } if (k > 0.97) pop(() => { S.emit({ x, y: 0.1, n: 10, color: 0xcccccc, tex: "smoke", size: 0.7, life: 26, speed: 0.08, flat: true, solid: true, opacity: 0.6 }); S.shake = 0.12; }); }
  else if (kind === "side") { x = from + (home - from) * ease(k); if (def.anim.intro === "swingIn") { y = Math.sin(k * Math.PI) * 2.2; mix(ATK.flykick.h, ATK.flykick.h, 0, tp); } else { mix(ATK.blur.h, ATK.blur.h, 0, tp); S.emit({ x, y: 1, n: 2, color: col, size: 0.8, life: 12, sx: 4, spreadY: 1.2, spin: false }); } }
  else if (kind === "walk") { x = home - f.facing * 3 * (1 - k); const s = Math.sin(k * 16); mix(VICTORY.straighten, VICTORY.straighten, 0, tp); tp.yaw = 0; tp.ll = [s * 0.5, 0.05]; tp.rl = [-s * 0.5, 0.05]; tp.lk = 0.3 + Math.max(0, -s) * 0.5; tp.rk = 0.3 + Math.max(0, s) * 0.5; }
  else if (kind === "rise") { y = -2.2 * (1 - ease(k)); mix(VICTORY.throne, VICTORY.throne, 0, tp); tp.yaw = 0; if (Math.random() < 0.6) S.emit({ x, y: 0.1, n: 1, color: col, tex: "smoke", size: 1.0, life: 24, speed: 0.03, spread: 1 }); }
  else if (kind === "boot") { mix(POSE.lose, stance, ease(k), tp); if (k > 0.4) pop(() => S.emit({ x, y: 1.5, n: 2, color: col, tex: "ring", size: 0.3, life: 20, grow: 6 })); }
  else { vis = k > 0.35; mix(ATK.powerup.w, ATK.powerup.h, ease((k - 0.35) / 0.65), tp); if (k < 0.35 && Math.random() < 0.7) S.emit({ x: x + (Math.random() - 0.5), y: 0.2 + Math.random() * 1.8, n: 1, color: col, size: 0.3, life: 14, speed: 0.02 }); if (vis) pop(() => { S.burst(x, 1.1, col, 2); S.emit({ x, y: 1, n: 14, color: col, tex: def.anim.intro === "freezeIn" ? "shard" : def.anim.intro === "smokeIn" ? "smoke" : undefined, speed: 0.1, life: 26, size: 0.4 }); }); }
  return { x, y, vis };
}
