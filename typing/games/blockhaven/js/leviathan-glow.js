import * as THREE from "../lib/three.module.min.js";

export function createLeviathanGlow(entity) {
  const color = entity.sp === "leviathan_ancient" ? 0x9fdcec : entity.sp === "leviathan_obsidian" ? 0xff883c : 0xffc36a;
  const cool = new THREE.Color(color);
  const hot = new THREE.Color(entity.sp === "leviathan_ancient" ? 0xe5f7ff : entity.sp === "leviathan_obsidian" ? 0xffcb87 : 0xffedb3);
  const geometry = new THREE.BoxGeometry(1, 0.035, 0.045);
  const material = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.72, depthWrite: false });
  const seams = [];
  for (const part of entity.def.model.parts) {
    const body = /^segment\d+$/.test(part.name);
    const collar = /^mawRim(0|3|6|9)$/.test(part.name);
    if (!body && !collar) continue;
    // Follow the two upper corners of the octagonal shell, clear of its ridge.
    for (const side of body ? [-1, 1] : [0]) {
      const transform = new THREE.Object3D();
      transform.scale.x = (body ? part.size[2] * 0.7 : part.size[0] * 0.65) / 16;
      transform.rotation.y = body ? Math.PI / 2 : 0;
      transform.position.set(body ? side * part.size[0] / 16 * 0.354 : 0,
        body ? part.size[1] / 16 * 0.354 + 0.025 : 0,
        body ? 0 : part.size[2] / 32 + 0.025);
      transform.updateMatrix();
      seams.push({ anchor: entity.parts[part.name].children[0], local: transform.matrix,
        row: body ? (Number(part.name.slice(7)) + 1) / 10 : 0 });
    }
  }
  const mesh = new THREE.InstancedMesh(geometry, material, seams.length);
  mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  // Instance bounds change with the articulated body. The entity and distance
  // checks handle visibility without a stale per-instance bounding sphere.
  mesh.frustumCulled = false;
  entity.root.add(mesh);
  const matrix = new THREE.Matrix4(), thickness = new THREE.Vector3();
  return {
    update(age, distanceSquared, attack, recovering, reducedMotion, fade=1) {
      const pulse = reducedMotion ? 0 : Math.sin(age * 1.4) * 0.045;
      const charge = Math.max(0, Math.min(1, Number(attack) || 0));
      material.color.lerpColors(cool, hot, charge * .75);
      material.opacity = (recovering ? 0.22 : 0.7 + pulse + (0.25 - pulse) * charge)*Math.max(0,Math.min(1,fade));
      mesh.visible = distanceSquared < 42 * 42 && fade>0;
      if (!mesh.visible) return;
      for (let i = 0; i < seams.length; i++) {
        const seam = seams[i];
        matrix.copy(seam.local);
        if (charge > 0) {
          // The brighter band moves toward the tail as charge builds. Reduced
          // motion widens the seams together, without a traveling highlight.
          const band = reducedMotion ? charge : Math.max(0, 1 - Math.abs(seam.row - charge) * 3.5);
          const width = 1 + charge * .4 + band * 1.6;
          matrix.scale(thickness.set(1, width, width));
        }
        for (let part = seam.anchor; part && part !== entity.root; part = part.parent) {
          part.updateMatrix(); matrix.premultiply(part.matrix);
        }
        mesh.setMatrixAt(i, matrix);
      }
      mesh.instanceMatrix.needsUpdate = true;
      mesh.boundingBox = null;
    },
    dispose() {
      mesh.parent?.remove(mesh); mesh.dispose();
      geometry.dispose(); material.dispose();
    }
  };
}
