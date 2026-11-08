// A small camera footprint keeps the wider Leviathan view away from corners.
// Uses the game's existing block raycast, including its door checks.
export function leviathanCameraDistance(world, eye, direction, reach, raycast) {
  if (![eye.x, eye.y, eye.z, direction.x, direction.y, direction.z, reach].every(Number.isFinite) || reach <= 0) return 0;
  reach = Math.min(10, reach);
  const length = Math.hypot(direction.x, direction.y, direction.z);
  if (length < 0.001) return 0;
  const d = { x: direction.x / length, y: direction.y / length, z: direction.z / length };
  const horizontal = Math.hypot(d.x, d.z);
  const right = horizontal > 0.001 ? { x: d.z / horizontal, y: 0, z: -d.x / horizontal } : { x: 1, y: 0, z: 0 };
  const up = { x: right.y * d.z - right.z * d.y, y: right.z * d.x - right.x * d.z, z: right.x * d.y - right.y * d.x };
  let distance = reach;
  for (const rx of [-1, 0, 1]) for (const uy of [-1, 0, 1]) {
    const offset = { x: (right.x * rx + up.x * uy) * 0.25, y: (right.y * rx + up.y * uy) * 0.25, z: (right.z * rx + up.z * uy) * 0.25 };
    const from = { x: eye.x + offset.x, y: eye.y + offset.y, z: eye.z + offset.z };
    for (let step = 0; step <= Math.ceil(reach * 2); step++) {
      const t = Math.min(reach, step * 0.5);
      if (!world.isLoaded(from.x + d.x * t, from.z + d.z * t)) { distance = Math.min(distance, Math.max(0, t - 0.8)); break; }
    }
    const hit = raycast(world, from, d, reach + 0.2, false);
    if (hit && Number.isFinite(hit.dist)) distance = Math.min(distance, Math.max(0, hit.dist - 0.3));
  }
  return distance;
}
