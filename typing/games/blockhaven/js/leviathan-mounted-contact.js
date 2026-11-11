import * as THREE from "../lib/three.module.min.js";

const EPS = 1e-8;
// A triangle clipped by at most four planes has at most seven vertices.
const vertices = Array.from({ length: 7 }, () => new THREE.Vector3());
const scratch = Array.from({ length: 7 }, () => new THREE.Vector3());
const bounds = new THREE.Box3(), nearest = new THREE.Vector3(), candidate = new THREE.Vector3();

function clip(from, to, count, nx, ny, nz, limit) {
  let n = 0, a = from[count - 1], da = nx * a.x + ny * a.y + nz * a.z - limit;
  for (let i = 0; i < count; i++) {
    const b = from[i], db = nx * b.x + ny * b.y + nz * b.z - limit;
    if ((da < 0 && db > 0) || (da > 0 && db < 0)) to[n++].lerpVectors(a, b, da / (da - db));
    if (db <= 0) to[n++].copy(b);
    a = b; da = db;
  }
  return n;
}

// Closest horizontal point of the clipped polygon, retaining the surface Y.
// A vertical face projects to a line, handled by the edge pass.
function closestProjected(poly, count) {
  const a = poly[0];
  for (let i = 1; i + 1 < count; i++) {
    const b = poly[i], c = poly[i + 1], bx = b.x - a.x, bz = b.z - a.z, cx = c.x - a.x, cz = c.z - a.z;
    const det = bx * cz - bz * cx;
    if (Math.abs(det) <= EPS) continue;
    const u = (-a.x * cz + a.z * cx) / det, v = (-bx * a.z + bz * a.x) / det;
    if (u >= 0 && v >= 0 && u + v <= 1) {
      nearest.set(0, a.y + u * (b.y - a.y) + v * (c.y - a.y), 0);
      return 0;
    }
  }
  let best = Infinity;
  for (let i = 0; i < count; i++) {
    const a = poly[i], b = poly[(i + 1) % count], dx = b.x - a.x, dz = b.z - a.z, lengthSq = dx * dx + dz * dz;
    const dy = b.y - a.y;
    const t = Math.max(0, Math.min(1, lengthSq ? -(a.x * dx + a.z * dz) / lengthSq : dy ? (1 - a.y) / dy : 0));
    candidate.lerpVectors(a, b, t);
    const d2 = candidate.x * candidate.x + candidate.z * candidate.z;
    if (d2 < best || (d2 === best && Math.abs(candidate.y - 1) < Math.abs(nearest.y - 1))) { best = d2; nearest.copy(candidate); }
  }
  return best;
}

// Intersect the actual posed surfaces with a ground cylinder, or a sector
// with an inner dead zone. Clip height and angle first, then test radial
// limits exactly in XZ, rather than substituting a sphere or a body box.
// Only called at attack release; no new per-frame data or render geometry.
export function mountedBodyContact(entity, origin, radius, halfHeight, sector = null) {
  if (!entity.emerged || entity.dead || entity.gone || entity.ridden || !entity.mesh?.visible || !entity.hitVolumes) return null;
  const forwardX = sector ? -Math.sin(sector.yaw) : 0, forwardZ = sector ? -Math.cos(sector.yaw) : 1;
  const rightX = sector ? -forwardZ : 1, rightZ = sector ? forwardX : 0;
  const innerSq = sector ? sector.inner ** 2 : 0, tangent = sector ? Math.tan(sector.halfAngle) : 0;
  let best = radius * radius, result = null;
  for (const v of entity.hitVolumes) {
    let visible = true;
    for (let p = v.mesh; p; p = p.parent) if (!p.visible) { visible = false; break; }
    if (!visible) continue;
    bounds.copy(v.bounds).applyMatrix4(v.mesh.matrixWorld);
    const bx = Math.max(bounds.min.x - origin.x, origin.x - bounds.max.x, 0);
    const bz = Math.max(bounds.min.z - origin.z, origin.z - bounds.max.z, 0);
    if (bounds.min.y > origin.y + halfHeight || bounds.max.y < origin.y - halfHeight || bx * bx + bz * bz > best + EPS) continue;
    const count = v.index ? v.index.count : v.positions.count;
    for (let i = 0; i < count; i += 3) {
      for (let j = 0; j < 3; j++) {
        const p = vertices[j].fromBufferAttribute(v.positions, v.index ? v.index.getX(i + j) : i + j).applyMatrix4(v.mesh.matrixWorld);
        const x = p.x - origin.x, z = p.z - origin.z;
        p.set(x * rightX + z * rightZ, p.y - origin.y, x * forwardX + z * forwardZ);
      }
      let n = clip(vertices, scratch, 3, 0, 1, 0, halfHeight);
      if (n) n = clip(scratch, vertices, n, 0, -1, 0, halfHeight);
      if (sector && n) n = clip(vertices, scratch, n, 1, 0, -tangent, 0);
      if (sector && n) n = clip(scratch, vertices, n, -1, 0, -tangent, 0);
      if (!n) continue;
      let d2 = closestProjected(vertices, n);
      if (d2 > best + EPS) continue;
      if (d2 < innerSq) {
        let far = null, farSq = innerSq;
        for (let j = 0; j < n; j++) {
          const p = vertices[j], r2 = p.x * p.x + p.z * p.z;
          if (r2 >= farSq) { farSq = r2; far = p; }
        }
        if (!far) continue;
        const dx = far.x - nearest.x, dz = far.z - nearest.z, span = dx * dx + dz * dz;
        if (span <= EPS) continue;
        const dot = nearest.x * dx + nearest.z * dz;
        const t = (-dot + Math.sqrt(dot * dot + span * (innerSq - d2))) / span;
        nearest.lerp(far, Math.min(1, t)); d2 = innerSq;
      }
      // Equal horizontal contacts prefer the height of the strike's sight
      // line, so a lower face under the ground does not win a flat tie.
      if (result && d2 >= best - EPS && Math.abs(nearest.y - 1) >= Math.abs(result.y - origin.y - 1)) continue;
      best = d2;
      result ||= {};
      result.x = origin.x + nearest.x * rightX + nearest.z * forwardX;
      result.y = origin.y + nearest.y;
      result.z = origin.z + nearest.x * rightZ + nearest.z * forwardZ;
      result.distance = Math.sqrt(d2);
    }
  }
  return result;
}
