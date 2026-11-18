import * as THREE from "../lib/three.module.min.js";
import { GODZILLA_SITE } from "./godzilla-caldera.js";

const UP = new THREE.Vector3(0, 1, 0);
const SKY_BLUE = 0x47bfff;

export function createGodzillaView(scene) {
  const material = (color, opacity) => new THREE.MeshBasicMaterial({
    color, opacity, transparent: true, side: THREE.DoubleSide, depthWrite: false, fog: false
  });
  const band = new THREE.Mesh(new THREE.PlaneGeometry(4.3, 28), material(SKY_BLUE, 0.29));
  const cylinder = new THREE.CylinderGeometry(1, 1, 1, 10, 1);
  const beam = new THREE.Mesh(cylinder, material(SKY_BLUE, 0.72));
  const core = new THREE.Mesh(cylinder, material(0xe1fcff, 0.94));
  const ground = new THREE.Mesh(cylinder, material(0x35b7ff, 0.62));
  const halo = new THREE.Mesh(cylinder, material(SKY_BLUE, 0.11));
  halo.material.blending = THREE.AdditiveBlending;
  const meshes = [band, beam, core, ground, halo];
  for (const m of meshes) { m.visible = false; m.renderOrder = 12; scene.add(m); }
  const start = new THREE.Vector3(), elbow = new THREE.Vector3(), end = new THREE.Vector3(), direction = new THREE.Vector3();
  const orient = (mesh, a, b, radius) => {
    direction.subVectors(b, a);
    mesh.scale.set(radius, direction.length(), radius);
    mesh.position.copy(a).lerp(b, 0.5);
    mesh.quaternion.setFromUnitVectors(UP, direction.normalize());
  };
  return {
    update(cycle, e, reducedMotion, effects) {
      const breath = cycle?.attack === "breath";
      const warning = breath && cycle.mode === "warning";
      const active = breath && cycle.mode === "strike";
      band.visible = warning || active;
      beam.visible = core.visible = ground.visible = active;
      halo.visible = active && effects !== "low";
      if (!band.visible) return;
      const { x, y, z } = GODZILLA_SITE, { dx, dz } = cycle;
      band.position.set(x + dx * 14, y + 0.032, z + dz * 14);
      band.rotation.set(-Math.PI / 2, 0, Math.atan2(dx, dz), "YXZ");
      band.material.opacity = active ? 0.67 : reducedMotion ? 0.37 : 0.27 + Math.sin(cycle.timer * 7) * 0.08;
      if (!active) return;
      e.parts.mouth.children[0].getWorldPosition(start);
      elbow.set(x + dx * 9, y + 0.48, z + dz * 9);
      end.set(x + dx * 28, y + 0.48, z + dz * 28);
      orient(beam, start, elbow, 1.03);
      orient(core, start, elbow, 0.48);
      if (halo.visible) orient(halo, start, elbow, 1.7);
      orient(ground, elbow, end, 0.74);
    },
    dispose() {
      for (const m of meshes) { scene.remove(m); m.material.dispose(); }
      band.geometry.dispose();
      cylinder.dispose();
    }
  };
}
