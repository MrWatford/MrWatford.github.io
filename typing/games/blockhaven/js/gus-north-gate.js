import * as THREE from "../lib/three.module.min.js";
import { gusSurface } from "./gus-village.js?v=3";

const OPEN_HEIGHT = 4.9;
const CLOSED_HEIGHT = 0.1;
const LOWER_TIME = 0.9;

export function createNorthGate({ scene, box, markerPaint }) {
  const masonry = gusSurface("stone");
  const stone = new THREE.MeshStandardMaterial({ color: 0x888278, map: masonry, roughness: 0.95 });
  const cap = new THREE.MeshStandardMaterial({ color: 0xa9a194, map: masonry, roughness: 0.88 });
  const wood = new THREE.MeshStandardMaterial({ color: 0x795338, map: gusSurface("wood"), roughness: 0.91 });
  const iron = new THREE.MeshStandardMaterial({ color: 0x383a37, roughness: 0.75 });
  const brass = new THREE.MeshStandardMaterial({ color: 0xb28555, roughness: 0.65 });
  const lamp = new THREE.MeshBasicMaterial({ color: 0xffb85f });
  const root = new THREE.Group();
  root.name = "Chapter 1 north gate";
  root.position.z = -16.35;
  scene.add(root);

  for (const side of [-1, 1]) {
    const x = side * 4.48;
    box(root, stone, x, 2.65, 0, 1.52, 5.3, 2.45);
    for (const y of [0.22, 1.48, 3.08, 5.18]) {
      box(root, cap, x, y, 0, 1.67, 0.19, 2.59);
    }
    box(root, stone, x + side * 2.37, 1.88, -0.18, 3.28, 3.76, 1.8);
    for (const dx of [1.23, 2.29, 3.35]) box(root, cap, x + side * dx, 3.98, -0.18, 0.72, 0.45, 1.88);
    box(root, iron, side * 3.62, 2.67, 0, 0.16, 5.34, 0.83);
    box(root, iron, x, 3.55, 1.3, 0.53, 0.66, 0.23);
    box(root, lamp, x, 3.55, 1.43, 0.33, 0.38, 0.05);
    box(root, iron, x, 3.93, 1.42, 0.58, 0.13, 0.38);
  }
  box(root, stone, 0, 5.15, 0, 9.9, 0.98, 2.54);
  for (const side of [-1, 1]) box(root, stone, 0, 7.23, side * 0.83, 9.9, 3.22, 0.86);
  box(root, cap, 0, 8.94, 0, 10.14, 0.18, 2.7);
  for (let x = -4.5; x <= 4.5; x += 1.5) box(root, stone, x, 9.24, 0.76, 0.78, 0.5, 0.96);
  box(root, iron, 0, 4.84, 0, 7.35, 0.26, 0.98);

  const teeth = new THREE.Group();
  teeth.name = "North portcullis";
  root.add(teeth);
  for (let i = -4; i <= 4; i++) {
    const x = i * 0.79;
    box(teeth, wood, x, 2.14, 0, 0.42, 3.94, 0.41);
    box(teeth, iron, x, 0.16, 0, 0.31, 0.47, 0.33);
    box(teeth, brass, x, 0.91, 0.242, 0.12, 0.14, 0.1);
  }
  for (const y of [0.91, 2.3, 3.81]) box(teeth, iron, 0, y, 0.03, 6.98, 0.22, 0.52);
  // The gate moves on the inside face of the parapet.
  teeth.position.z = -0.2;

  const release = new THREE.Vector3(-3.9, 0, -13.05);
  const post = new THREE.Group();
  post.position.set(release.x, 0, release.z - root.position.z);
  root.add(post);
  box(post, stone, 0, 0.12, 0, 0.87, 0.24, 0.78);
  box(post, wood, 0, 0.73, 0, 0.49, 1.15, 0.48);
  box(post, iron, 0, 1.16, 0, 0.68, 0.32, 0.62);
  const lever = new THREE.Group();
  lever.position.y = 1.2;
  post.add(lever);
  box(lever, iron, 0, 0.29, 0, 0.11, 0.58, 0.11);
  box(lever, brass, 0, 0.58, 0, 0.25, 0.17, 0.18);
  const marker = new THREE.Mesh(new THREE.OctahedronGeometry(0.26), markerPaint);
  marker.position.y = 2.13;
  post.add(marker);

  let progress = 0;
  let lowering = false;
  function update(dt, reducedMotion) {
    if (!lowering) return false;
    progress = reducedMotion ? 1 : Math.min(1, progress + dt / LOWER_TIME);
    teeth.position.y = THREE.MathUtils.lerp(OPEN_HEIGHT, CLOSED_HEIGHT, progress * progress);
    lever.rotation.x = THREE.MathUtils.lerp(-0.53, 0.84, Math.min(1, progress * 2.3));
    if (progress < 1) return false;
    lowering = false;
    return true;
  }

  function reset(stage) {
    root.visible = ["briefing", "defense", "signal", "gate-defense", "seal-road", "report"].includes(stage);
    lowering = false;
    const closed = stage === "report";
    progress = Number(closed);
    teeth.position.y = closed ? CLOSED_HEIGHT : OPEN_HEIGHT;
    lever.rotation.x = closed ? 0.84 : -0.53;
    marker.visible = stage === "seal-road";
  }

  function lower() {
    lowering = true;
    marker.visible = false;
  }

  return { reset, update, lower, release,
    get lowering() { return lowering; },
    get progress() { return progress; } };
}
