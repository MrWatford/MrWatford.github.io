import * as THREE from "../lib/three.module.min.js";

// One short-lived group and one geometry/material pair per cast.
export function createAncientSpikes(scene, points, strike, reducedMotion) {
  const group = new THREE.Group();
  const geometry = new THREE.ConeGeometry(0.28, 1.8, 4);
  const material = new THREE.MeshBasicMaterial({ color: 0xa9dcec, transparent: true });
  const spikes = points.map(p => {
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(p.x, p.y + 0.9, p.z);
    mesh.rotation.y = Math.PI / 4;
    mesh.visible = false;
    group.add(mesh);
    return mesh;
  });
  scene.add(group);
  let age = 0, next = 0, disposed = false;
  const dispose = () => {
    if (disposed) return;
    disposed = true;
    scene.remove(group); geometry.dispose(); material.dispose();
  };
  return {
    dispose,
    update(dt) {
      if (disposed) return false;
      age += dt;
      while (next < points.length && age >= next * 0.11) {
        strike(points[next]);
        next++;
      }
      spikes.forEach((mesh, i) => {
        const t = age - i * 0.11;
        mesh.visible = t >= 0 && t < 0.7;
        const height = reducedMotion ? 1 : Math.min(1, Math.max(0.02, t * 8));
        mesh.scale.y = height;
        mesh.position.y = points[i].y + height * 0.9;
      });
      material.opacity = Math.min(0.9, Math.max(0, (1.4 - age) * 2));
      if (age >= 1.4) { dispose(); return false; }
      return true;
    }
  };
}
