import * as THREE from "../lib/three.module.min.js";

function paintMural() {
  const canvas = document.createElement("canvas");
  canvas.width = 96; canvas.height = 96;
  const ctx = canvas.getContext("2d");
  const rect = (x, y, w, h, color) => { ctx.fillStyle = color; ctx.fillRect(x, y, w, h); };
  rect(0, 0, 96, 96, "#473534");
  rect(3, 3, 90, 90, "#ba966c");
  rect(5, 5, 86, 86, "#302831");
  rect(8, 8, 80, 80, "#785d4d");
  for (let y = 9; y < 88; y += 8) for (let x = 9; x < 88; x += 7) {
    if ((x * 13 + y * 19) % 17 < 7) rect(x, y, 3, 1, "#8c6c56");
  }

  const panels = [
    { x: 11, stone: "#d6a766", shade: "#94603f", glow: "#f5c16f", eye: "#ffe4a6", ground: "#b17848", crest: "sun" },
    { x: 36, stone: "#52404a", shade: "#332738", glow: "#f27a3c", eye: "#ffbc7c", ground: "#503944", crest: "fire" },
    { x: 61, stone: "#d0c4ad", shade: "#87798c", glow: "#7b9fd1", eye: "#cee9fc", ground: "#686582", crest: "star" }
  ];
  for (const { x, stone, shade, glow, eye, ground, crest } of panels) {
    rect(x, 20, 24, 56, "#332830");
    rect(x + 1, 21, 22, 54, "#58433d");
    rect(x + 1, 69, 22, 6, ground);
    rect(x + 3, 72, 17, 1, glow);
    // The segmented body rises behind the jaw. The three crests distinguish the beasts.
    const ribs = [[4, 64, 7, 6], [5, 57, 7, 7], [6, 49, 8, 8], [8, 42, 8, 8], [11, 37, 8, 7]];
    for (const [dx, y, w, h] of ribs) {
      rect(x + dx - 1, y + 1, w + 2, h, shade);
      rect(x + dx, y, w, h - 2, stone);
      rect(x + dx + 1, y + h - 3, w - 2, 1, glow);
    }
    rect(x + 12, 34, 8, 12, shade);
    rect(x + 13, 33, 7, 11, stone);
    rect(x + 16, 36, 5, 6, "#2a1e28");
    rect(x + 19, 36, 1, 2, eye);
    rect(x + 19, 40, 1, 2, eye);
    if (crest === "sun") {
      rect(x + 9, 25, 5, 5, glow); rect(x + 10, 24, 3, 7, eye);
    } else if (crest === "fire") {
      rect(x + 10, 26, 4, 5, glow); rect(x + 12, 23, 2, 7, eye);
      rect(x + 6, 44, 2, 4, glow); rect(x + 9, 38, 2, 4, glow);
    } else {
      rect(x + 9, 26, 7, 2, glow); rect(x + 12, 23, 1, 8, eye);
      rect(x + 12, 31, 2, 3, eye); rect(x + 16, 30, 2, 4, eye); rect(x + 19, 31, 2, 3, eye);
    }
    rect(x + 2, 78, 20, 1, "#c4a17a");
    for (const dx of [4, 10, 16]) { rect(x + dx, 81, 3, 1, glow); rect(x + dx + 1, 82, 1, 2, "#d0ad82"); }
  }
  rect(14, 13, 68, 2, "#c7a77d");
  for (const x of [12, 46, 80]) { rect(x, 11, 4, 6, "#d6b286"); rect(x + 1, 12, 2, 4, "#4d3940"); }
  return canvas;
}

export function createSolkaraMuralView(site) {
  const texture = new THREE.CanvasTexture(paintMural());
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.magFilter = THREE.NearestFilter;
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(0.99, 0.99),
    new THREE.MeshBasicMaterial({ map: texture }));
  mesh.position.set(site.x + 1.008, site.y + 0.5, site.z + 0.5);
  mesh.rotation.y = Math.PI / 2;
  return {
    mesh,
    dispose() { mesh.removeFromParent(); mesh.geometry.dispose(); mesh.material.dispose(); texture.dispose(); }
  };
}
