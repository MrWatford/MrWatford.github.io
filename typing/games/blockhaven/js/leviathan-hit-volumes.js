import * as THREE from '../lib/three.module.min.js';
import { segmentBoxTime } from './projectile-collision.js';

// Shared scratch only; queries are synchronous and do not invoke game callbacks.
const start = new THREE.Vector3(), end = new THREE.Vector3();
const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3();
const point = new THREE.Vector3(), ray = new THREE.Ray();
const edge1 = new THREE.Vector3(), edge2 = new THREE.Vector3(), cross = new THREE.Vector3(), q = new THREE.Vector3();
const EDGE_EPS = 1e-8;
const areaOrigin = new THREE.Vector3(), areaClosest = new THREE.Vector3(), areaHit = new THREE.Vector3();
const areaTriangle = new THREE.Triangle(), areaBounds = new THREE.Box3();
const areaRay = new THREE.Ray(new THREE.Vector3(), new THREE.Vector3(.8731, .3917, .2893).normalize());
export const usesLeviathanHitVolumes = e => !!e.def?.segmentedLeviathan && !e.tame;

export function createLeviathanHitVolumes(e) {
  return ['head', 'jawLeft', 'jawRight', ...Array.from({ length: 10 }, (_, i) => 'segment' + i)].map(name => {
    const pivot = e.parts[name], mesh = pivot.children[0], geometry = mesh.geometry;
    if (!geometry.boundingBox) geometry.computeBoundingBox();
    return { name, pivot, mesh, inverse: new THREE.Matrix4(), bounds: geometry.boundingBox,
      positions: geometry.attributes.position, index: geometry.index };
  });
}

// Capture once after animation, rather than updating the scene for each arrow.
export function updateLeviathanHitVolumes(e) {
  e.mesh.updateMatrixWorld(true);
  for (const volume of e.hitVolumes) volume.inverse.copy(volume.mesh.matrixWorld).invert();
}

// Local-space broad boxes reject distant parts, then the existing low-poly
// triangles supply the real contact (including the recessed mouth and gaps).
// One authoritative creature receives the nearest contact, never one per part.
export function leviathanSegmentTime(e, x, y, z, nx, ny, nz) {
  if (!e.emerged || e.dead || e.gone || e.ridden || !e.mesh?.visible || !e.hitVolumes) return null;
  let best = Infinity;
  for (const v of e.hitVolumes) {
    let visible = true;
    for (let parent = v.mesh; parent; parent = parent.parent) if (!parent.visible) { visible = false; break; }
    if (!visible) continue;
    start.set(x, y, z).applyMatrix4(v.inverse);
    end.set(nx, ny, nz).applyMatrix4(v.inverse);
    const lo = v.bounds.min, hi = v.bounds.max;
    const broad = segmentBoxTime(start.x, start.y, start.z, end.x, end.y, end.z,
      lo.x - EDGE_EPS, lo.y - EDGE_EPS, lo.z - EDGE_EPS, hi.x + EDGE_EPS, hi.y + EDGE_EPS, hi.z + EDGE_EPS);
    if (broad === null || broad > best) continue;
    ray.origin.copy(start); ray.direction.subVectors(end, start);
    const length = ray.direction.length();
    if (length < 1e-8) continue;
    ray.direction.multiplyScalar(1 / length);
    const count = v.index ? v.index.count : v.positions.count;
    for (let i = 0; i < count; i += 3) {
      a.fromBufferAttribute(v.positions, v.index ? v.index.getX(i) : i);
      b.fromBufferAttribute(v.positions, v.index ? v.index.getX(i + 1) : i + 1);
      c.fromBufferAttribute(v.positions, v.index ? v.index.getX(i + 2) : i + 2);
      // Tolerate floating-point barycentric error on shared edges, so scaled
      // and turning rigs do not develop hairline gaps between their triangles.
      edge1.subVectors(b, a); edge2.subVectors(c, a); cross.crossVectors(ray.direction, edge2);
      const determinant = edge1.dot(cross);
      if (Math.abs(determinant) < 1e-12) continue;
      const inverse = 1 / determinant;
      point.subVectors(start, a);
      const u = point.dot(cross) * inverse;
      if (u < -EDGE_EPS || u > 1 + EDGE_EPS) continue;
      q.crossVectors(point, edge1);
      const baryV = ray.direction.dot(q) * inverse;
      if (baryV < -EDGE_EPS || u + baryV > 1 + EDGE_EPS) continue;
      const t = edge2.dot(q) * inverse / length;
      if (t >= -EDGE_EPS && t <= 1 + EDGE_EPS && t < best) best = Math.max(0, Math.min(1, t));
    }
  }
  return best === Infinity ? null : best;
}

// Area attacks query the existing animated surfaces in world space. This runs
// only when an attack pulses, never as a second per-frame collision pass.
// Signed ray crossings also recognize an origin inside solid mesh components,
// without treating the hollow mouth or gaps between segments as solid boxes.
export function leviathanAreaContact(e, x, y, z, radius, target) {
  if (!Number.isFinite(radius) || radius < 0 || ![x, y, z].every(Number.isFinite) ||
      !e.emerged || e.dead || e.gone || e.ridden || !e.mesh?.visible || !e.hitVolumes) return null;
  areaOrigin.set(x, y, z); areaRay.origin.copy(areaOrigin);
  let best = radius * radius, found = false;
  for (const v of e.hitVolumes) {
    let visible = true;
    for (let parent = v.mesh; parent; parent = parent.parent) if (!parent.visible) { visible = false; break; }
    if (!visible) continue;
    areaBounds.copy(v.bounds).applyMatrix4(v.mesh.matrixWorld);
    if (areaBounds.distanceToPoint(areaOrigin) ** 2 > best + EDGE_EPS) continue;
    const insideBounds = areaBounds.containsPoint(areaOrigin);
    let winding = 0;
    const count = v.index ? v.index.count : v.positions.count;
    for (let i = 0; i < count; i += 3) {
      a.fromBufferAttribute(v.positions, v.index ? v.index.getX(i) : i).applyMatrix4(v.mesh.matrixWorld);
      b.fromBufferAttribute(v.positions, v.index ? v.index.getX(i + 1) : i + 1).applyMatrix4(v.mesh.matrixWorld);
      c.fromBufferAttribute(v.positions, v.index ? v.index.getX(i + 2) : i + 2).applyMatrix4(v.mesh.matrixWorld);
      areaTriangle.set(a, b, c).closestPointToPoint(areaOrigin, areaClosest);
      const d2 = areaClosest.distanceToSquared(areaOrigin);
      if (d2 <= best) { best = d2; target.copy(areaClosest); found = true; }
      if (insideBounds && areaRay.intersectTriangle(a, b, c, false, areaHit) && areaHit.distanceToSquared(areaOrigin) > EDGE_EPS ** 2) {
        edge1.subVectors(b, a); edge2.subVectors(c, a); cross.crossVectors(edge1, edge2);
        winding += cross.dot(areaRay.direction) > 0 ? 1 : -1;
      }
    }
    if (winding !== 0) { target.copy(areaOrigin); return 0; }
  }
  return found ? Math.sqrt(best) : null;
}
