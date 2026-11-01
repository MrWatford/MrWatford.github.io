// Ringfall: small math helpers, seeded random numbers, and noise used by every other file.

export const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
export const lerp = (a, b, t) => a + (b - a) * t;
export const smoothstep = (a, b, x) => {
  const t = clamp((x - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
};
export const dist2 = (ax, az, bx, bz) => Math.hypot(ax - bx, az - bz);
export const angleWrap = (a) => {
  while (a > Math.PI) a -= Math.PI * 2;
  while (a < -Math.PI) a += Math.PI * 2;
  return a;
};
export const approach = (v, target, step) => (v < target ? Math.min(target, v + step) : Math.max(target, v - step));

// Seeded random numbers (mulberry32) so the world is the same every time it loads.
export function rng(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Value noise on a hashed lattice, smooth enough for terrain.
function hash(ix, iz, seed) {
  let h = (ix * 374761393 + iz * 668265263 + seed * 2147483647) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return ((h >>> 0) / 4294967295) * 2 - 1;
}
export function noise2(x, z, seed = 0) {
  const ix = Math.floor(x), iz = Math.floor(z);
  const fx = x - ix, fz = z - iz;
  const ux = fx * fx * (3 - 2 * fx), uz = fz * fz * (3 - 2 * fz);
  const a = hash(ix, iz, seed), b = hash(ix + 1, iz, seed), c = hash(ix, iz + 1, seed), d = hash(ix + 1, iz + 1, seed);
  return lerp(lerp(a, b, ux), lerp(c, d, ux), uz);
}
export function fbm(x, z, oct = 4, seed = 1) {
  let s = 0, amp = 0.5, f = 1, norm = 0;
  for (let i = 0; i < oct; i++) {
    s += amp * noise2(x * f, z * f, seed + i * 17);
    norm += amp; amp *= 0.5; f *= 2.03;
  }
  return s / norm;
}
export function ridged(x, z, oct = 4, seed = 7) {
  let s = 0, amp = 0.5, f = 1, norm = 0;
  for (let i = 0; i < oct; i++) {
    const n = 1 - Math.abs(noise2(x * f, z * f, seed + i * 31));
    s += amp * n * n;
    norm += amp; amp *= 0.5; f *= 2.1;
  }
  return s / norm;
}

// Distance from point to a 2D segment, plus where along it (0..1).
export function segDist(px, pz, ax, az, bx, bz) {
  const dx = bx - ax, dz = bz - az;
  const L = dx * dx + dz * dz || 1;
  const t = clamp(((px - ax) * dx + (pz - az) * dz) / L, 0, 1);
  return [Math.hypot(px - (ax + dx * t), pz - (az + dz * t)), t];
}

export function fmtDist(m) {
  return m >= 1000 ? (m / 1000).toFixed(1) + " km" : Math.round(m) + " m";
}
export function fmtTime(sec) {
  sec = Math.floor(sec);
  const h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60), s = sec % 60;
  return h ? `${h}h ${String(m).padStart(2, "0")}m` : `${m}m ${String(s).padStart(2, "0")}s`;
}
