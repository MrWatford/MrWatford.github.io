// The Ironwarden's atlas and rigid meshes are shared across all live guardians.
import * as THREE from "../lib/three.module.min.js";

const SIZE = 256, TILE = 64;
const METAL = 0, PALE = 1, EDGE = 2, DARK = 3, RUST = 4, MOSS = 5, LEAF = 6, LIME = 7;
const CREAM = 8, GOLD = 9, RED = 10, GROOVE = 11, SOIL = 12, LIGHT = 13, EMBER = 14, BRONZE = 15;
const COLORS = [
  [189, 185, 176], [217, 213, 202], [155, 149, 138], [72, 66, 59], [125, 84, 60],
  [58, 72, 35], [84, 102, 43], [119, 135, 58], [245, 236, 194], [240, 179, 57],
  [174, 61, 47], [44, 36, 32], [98, 83, 53], [255, 223, 125], [236, 129, 47], [166, 113, 63]
];
const FACE_LIGHT = [0.80, 0.89, 1, 0.53, 0.97, 0.76];
const rig = {
  body: [null, 0, 1.64, 0], head: ["body", 0, 1.14, -0.035],
  armR: ["body", -0.76, 0.86, 0], elbowR: ["armR", 0, -0.63, 0],
  armL: ["body", 0.76, 0.86, 0], elbowL: ["armL", 0, -0.63, 0],
  legR: [null, -0.32, 1.64, 0], kneeR: ["legR", 0, -0.72, 0], footR: ["kneeR", 0, -0.67, 0],
  legL: [null, 0.32, 1.64, 0], kneeL: ["legL", 0, -0.72, 0], footL: ["kneeL", 0, -0.67, 0]
};
let assets;

function randomFrom(seed) {
  return () => {
    seed = (Math.imul(1664525, seed) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
}

function appearance(uid) {
  let hash = 2166136261;
  for (const c of String(uid)) hash = Math.imul(hash ^ c.charCodeAt(0), 16777619);
  return (hash ^ hash >>> 16) & 3;
}

function makeAtlas() {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = SIZE;
  const ctx = canvas.getContext("2d"), image = ctx.createImageData(SIZE, SIZE);
  for (const [tile, rgb] of COLORS.entries()) {
    const bx = tile % 4 * TILE, by = (tile >> 2) * TILE;
    const rand = randomFrom(835 + tile * 583);
    const pock = Array.from({ length: 18 }, () => [rand() * 56 + 4, rand() * 56 + 4, .8 + rand() * 2.65]);
    const mottles = Array.from({ length: 64 }, () => rand() * 18 - 9);
    for (let y = 0; y < TILE; y++) for (let x = 0; x < TILE; x++) {
      const sx = Math.max(2, Math.min(61, x)), sy = Math.max(2, Math.min(61, y));
      const edge = Math.min(sx - 2, sy - 2, 61 - sx, 61 - sy);
      const weather = tile <= RUST || tile === BRONZE;
      let grain = rand() * 12 - 6 + mottles[(sy >> 3) * 8 + (sx >> 3)] * (weather ? 0.44 : 1.1);
      let oxide = 0;
      if (weather) {
        grain += (32 - sy) * 0.13;
        if (edge === 0) grain += (sx < 30 || sy < 30 ? 17 : -25) + rand() * 10;
        else if (edge === 1 && sy > 40) grain -= 12;
        for (const [px, py, r] of pock) {
          const dx = sx - px, dy = sy - py;
          if (dx * dx + dy * dy < r * r) {
            grain -= sx + sy > px + py ? 8 : 18;
            oxide = Math.max(oxide, 0.07 + r * 0.039);
          }
        }
        if ((sx + sy * 7 + tile * 23) % 149 === 1 && sx > 8 && sx < 44) grain -= 17;
        if ((sx + sy * 7 + tile * 23) % 149 === 2 && sx > 8 && sx < 44) grain += 9;
        if (sy > 45 && Math.sin(sx * .53 + tile) > .72) oxide += (sy - 45) * .006;
      } else if (tile === LIGHT || tile === EMBER) {
        grain *= 0.25;
        grain += 13 * (1 - Math.min(1, Math.hypot(sx - 31.5, sy - 31.5) / 36));
      }
      const index = ((by + y) * SIZE + bx + x) * 4;
      for (let c = 0; c < 3; c++) image.data[index + c] = rgb[c] + grain + ([126, 76, 43][c] - rgb[c]) * oxide;
      image.data[index + 3] = 255;
    }
  }
  ctx.putImageData(image, 0, 0);
  const texture = new THREE.CanvasTexture(canvas);
  // BlockHaven displays its voxel palettes in linear output. Store the atlas in the same space.
  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  return texture;
}

function makeShadow() {
  const size = 32, data = new Uint8Array(size * size * 4);
  for (let z = 0; z < size; z++) for (let x = 0; x < size; x++) {
    const radius = Math.hypot((x + 0.5) / 16 - 1, (z + 0.5) / 16 - 1);
    data[(z * size + x) * 4 + 3] = Math.round(Math.max(0, 1 - radius) ** 1.5 * 125);
  }
  const texture = new THREE.DataTexture(data, size, size);
  texture.magFilter = THREE.LinearFilter; texture.minFilter = THREE.LinearFilter;
  texture.needsUpdate = true;
  return new THREE.MeshBasicMaterial({ map: texture, transparent: true, depthWrite: false,
    polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 });
}

// Collect intersecting voxel plates into one indexed mesh per articulated segment.
function geometry(boxes, unitBox, coarse = false) {
  const pos = [], uv = [], col = [], indices = [];
  const p = unitBox.attributes.position, t = unitBox.attributes.uv, index = unitBox.index;
  for (const [x, y, z, w, h, d, tile, yaw, pitch, roll, detail] of boxes) {
    if (coarse && detail) continue;
    const base = pos.length / 3;
    const rotation = yaw || pitch || roll ? new THREE.Matrix4().makeRotationFromEuler(new THREE.Euler(pitch, yaw, roll)) : null;
    const v = new THREE.Vector3();
    for (let i = 0; i < p.count; i++) {
      v.set(p.getX(i) * w, p.getY(i) * h, p.getZ(i) * d);
      if (rotation) v.applyMatrix4(rotation);
      pos.push(v.x + x, v.y + y, v.z + z);
      const face = i >> 2, tint = tile === LIGHT || tile === EMBER ? 1 : FACE_LIGHT[face];
      const reflect = ((Math.round((x + y + z) * 214) + face) & 1) === 1;
      const u = reflect ? 1 - t.getX(i) : t.getX(i);
      uv.push(((tile % 4) * TILE + 2.5 + u * 59) / SIZE,
        1 - (((tile >> 2) * TILE) + 61.5 - t.getY(i) * 59) / SIZE);
      col.push(tint, tint, tint);
    }
    for (let i = 0; i < index.count; i++) indices.push(base + index.getX(i));
  }
  if (!indices.length) return null;
  const mesh = new THREE.BufferGeometry();
  mesh.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  mesh.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  mesh.setAttribute("color", new THREE.Float32BufferAttribute(col, 3));
  mesh.setIndex(indices); mesh.computeBoundingSphere();
  return mesh;
}

function design(variant) {
  const shell = Object.fromEntries(Object.keys(rig).map(name => [name, []]));
  const damage = new Map(), glow = { body: [], head: [] };
  const rand = randomFrom(4303 + variant * 905);
  const iron = variant === 2 ? EDGE : METAL;
  const box = (name, x, y, z, w, h, d, tile = iron, detail = false, yaw = 0, pitch = 0, roll = 0) =>
    shell[name].push([x, y, z, w, h, d, tile, yaw, pitch, roll, detail]);
  const chest = (...args) => box("body", ...args);
  const head = (...args) => box("head", ...args);
  const rivet = (name, x, y, z, facing = 1) => {
    box(name, x, y, z, .049, .048, .030, DARK, true);
    box(name, x, y + .004, z + .014 * facing, .032, .034, .018, BRONZE, true);
  };
  const spiral = (target, x, y, z, scale, tile, detail = false, side = 0) => {
    const points = [[-3,-3],[3,-3],[3,3],[-3,3],[-3,-1],[1,-1],[1,1],[-1,1]];
    for (let i = 1; i < points.length; i++) {
      const [ax, ay] = points[i - 1], [bx, by] = points[i];
      const u = (ax + bx) / 2 * scale, v = (ay + by) / 2 * scale;
      const width = (Math.abs(ax - bx) + .64) * scale, height = (Math.abs(ay - by) + .64) * scale;
      target.push([x + (side ? 0 : u), y + v, z + (side ? u * side : 0),
        side ? .015 : width, height, side ? width : .016, tile, 0, 0, 0, detail]);
    }
  };

  // Cuirass, collar, split breastplate, floating abdominal lames and rear spine.
  chest(0, .62, 0, 1.24, .88, .66, DARK);
  chest(0, .03, -.01, .65, .25, .48, DARK);
  chest(0, .22, .025, .72, .22, .57, EDGE);
  chest(0, .242, -.304, .62, .154, .086, METAL);
  chest(0, .088, -.273, .54, .113, .093, EDGE);
  chest(0, .35, .292, .57, .15, .14, METAL);
  chest(0, .186, .269, .52, .13, .13, PALE);
  chest(0, .052, .238, .59, .087, .115, EDGE);
  chest(0, 1.025, -.026, .86, .17, .62, EDGE);
  chest(0, 1.099, -.035, .42, .14, .39, DARK);
  chest(0, .838, .365, .64, .22, .183, PALE);
  chest(0, .632, .407, .46, .375, .159, EDGE);
  chest(0, .632, .496, .333, .297, .039, DARK);
  chest(0, .632, .518, .270, .250, .021, BRONZE);
  chest(0, .632, .528, .220, .212, .012, GROOVE);
  spiral(glow.body, 0, .632, .538, .027, LIGHT);
  chest(0, .402, .405, .48, .098, .115, PALE);
  chest(0, .692, -.352, 1.08, .65, .120, EDGE);
  chest(0, .696, -.434, .35, .68, .112, DARK);
  for (let i = 0; i < 5; i++) chest(0, .423 + i * .127, -.510 - i * .008, .244 + i * .023, .101, .093, i % 2 ? METAL : PALE, i % 2 === 0);
  for (const side of [-1, 1]) {
    chest(side * .433, .696, .328, .325, .47, .216, iron);
    chest(side * .484, .884, .393, .298, .107, .183, PALE);
    chest(side * .479, .545, .414, .235, .163, .103, METAL);
    chest(side * .58, .636, .053, .15, .58, .642, EDGE);
    chest(side * .423, .70, -.412, .315, .512, .120, iron);
    chest(side * .457, .931, -.428, .368, .102, .161, PALE);
    chest(side * .252, .725, -.473, .042, .436, .031, BRONZE, true);
    spiral(shell.body, side * .438, .699, -.479, .024, GROOVE, true);
    rivet("body", side * .548, .839, .492);
    rivet("body", side * .376, .52, .477);
    rivet("body", side * .55, .52, -.48, -1);
  }

  // Brow, recessed eye sockets, cheeks and the stand-off bridge of the nose.
  head(0, .355, 0, .614, .687, .57, EDGE);
  head(0, .616, .014, .678, .209, .636, PALE);
  head(0, .515, .046, .68, .103, .60, METAL);
  head(0, .436, .306, .685, .09, .157, DARK);
  head(0, .101, .024, .572, .152, .579, METAL);
  head(0, .250, .340, .153, .35, .231, EDGE);
  head(0, .257, .439, .117, .334, .064, METAL);
  head(0, .155, .473, .107, .113, .025, PALE, true);
  head(0, .105, -.266, .436, .125, .083, PALE, true);
  for (const side of [-1, 1]) {
    head(side * .199, .326, .313, .239, .159, .093, GROOVE);
    head(side * .179, .331, .365, .136, .081, .026, EMBER);
    glow.head.push([side * .179, .331, .382, .094, .050, .012, LIGHT]);
    head(side * .211, .202, .336, .224, .164, .137, iron);
    head(side * .280, .323, .323, .082, .165, .132, EDGE);
    head(side * .176, .414, .381, .296, .058, .077, DARK, false, 0, 0, side * -.036);
    head(side * .313, .378, -.043, .07, .331, .407, METAL, true);
  }
  head(-.245, .706, .032, .105, .032, .390, METAL, true);
  head(.303, .647, .233, .081, .089, .142, EDGE, true);

  for (const [suffix, side] of [["R", -1], ["L", 1]]) {
    const arm = "arm" + suffix, elbow = "elbow" + suffix;
    const leg = "leg" + suffix, knee = "knee" + suffix, foot = "foot" + suffix;
    box(arm, -side * .118, -.006, 0, .34, .33, .39, DARK);
    box(arm, side * .03, -.003, 0, .51, .427, .566, EDGE);
    box(arm, side * .035, .144, -.003, .57, .160, .65, PALE);
    box(arm, side * .092, -.012, .047, .469, .319, .569, iron);
    box(arm, side * .08, -.092, .342, .325, .22, .06, PALE);
    box(arm, side * .065, -.092, -.289, .345, .22, .067, METAL);
    box(arm, side * .32, .035, -.014, .049, .261, .315, DARK);
    box(arm, side * .351, .035, -.014, .025, .200, .252, BRONZE, true);
    spiral(shell[arm], side * .368, .035, -.014, .025, GROOVE, true, side);
    box(arm, side * .036, -.33, .008, .347, .44, .374, METAL);
    box(arm, side * .229, .165, .30, .15, .105, .09, EDGE, true);
    box(arm, side * .229, .208, .29, .117, .027, .11, METAL, true);
    box(arm, side * .047, -.356, .178, .251, .364, .083, PALE, true);
    box(arm, side * .078, -.487, -.01, .343, .148, .353, EDGE);
    rivet(arm, side * .18, -.03, .375);
    box(elbow, side * .04, 0, 0, .333, .24, .345, DARK);
    box(elbow, side * .04, -.087, .027, .459, .14, .486, EDGE);
    box(elbow, side * .052, -.343, .025, .49, .47, .51, iron);
    box(elbow, side * .054, -.238, .291, .408, .168, .085, PALE);
    box(elbow, side * .057, -.428, .294, .398, .258, .083, EDGE);
    box(elbow, side * .055, -.434, .342, .252, .219, .035, METAL, true);
    spiral(shell[elbow], side * .055, -.434, .363, .028, GROOVE, true);
    box(elbow, side * .284, -.291, -.016, .048, .304, .405, PALE, true);
    box(elbow, side * .061, -.419, -.247, .397, .322, .079, EDGE, true);
    box(elbow, side * .05, -.626, .051, .423, .19, .397, DARK);
    for (let f = 0; f < 3; f++) box(elbow, side * .05 + (f - 1) * .133, -.690 + .021 * Math.abs(f - 1),
      .112, .12, .192, .343, f === 1 ? iron : EDGE);
    box(elbow, -side * .173, -.607, .017, .117, .172, .259, EDGE);
    rivet(elbow, side * .194, -.244, .34);
    rivet(elbow, -side * .092, -.520, .341);
    box(leg, 0, -.312, -.003, .474, .68, .481, DARK);
    box(leg, 0, -.256, .019, .574, .479, .53, iron);
    box(leg, 0, -.182, .274, .506, .278, .151, PALE);
    box(leg, side * .081, -.424, .269, .348, .211, .115, METAL);
    box(leg, side * .255, -.236, -.013, .121, .434, .452, EDGE);
    box(leg, 0, -.399, -.255, .405, .338, .081, EDGE);
    rivet(leg, -side * .177, -.158, .358);
    box(knee, 0, .028, 0, .449, .233, .44, DARK);
    box(knee, 0, .023, .257, .341, .201, .107, EDGE);
    box(knee, 0, .060, .310, .283, .106, .048, METAL);
    box(knee, 0, -.346, -.005, .546, .523, .524, iron);
    box(knee, 0, -.269, .267, .473, .306, .136, PALE);
    box(knee, 0, -.446, .275, .483, .162, .112, METAL);
    box(knee, side * .226, -.322, -.014, .107, .375, .469, EDGE, true);
    box(knee, 0, -.398, -.262, .425, .35, .083, EDGE);
    box(knee, 0, -.585, -.016, .451, .157, .445, DARK);
    rivet(knee, side * .15, -.403, .34);
    box(foot, 0, -.139, .119, .632, .214, .749, SOIL);
    box(foot, 0, -.079, .109, .63, .235, .747, EDGE);
    box(foot, 0, -.054, .327, .577, .17, .319, METAL);
    box(foot, 0, -.147, .464, .589, .075, .071, DARK);
    box(foot, -side * .186, -.021, .388, .165, .087, .238, PALE, true);
    box(foot, side * .196, -.044, .401, .166, .097, .224, SOIL, true);
  }

  function vine(name, x, y, z, length, facing, flower) {
    const count = Math.ceil(length / .076);
    const center = x;
    for (let i = 0; i < count; i++) {
      const yy = y - length * i / count;
      x = center + Math.sin(i * .63 + center * 5) * .058;
      box(name, x, yy, z, .035, length / count + .019, .032, MOSS);
      if (i % 2 === 0 || rand() < .33) {
        const s = i % 3 ? -1 : 1, w = .071 + rand() * .058;
        box(name, x + s * .038, yy - .018, z + facing * .016, w, .065, .034, rand() < .33 ? LIME : LEAF,
          i > 2, (rand() - .5) * .6, .11, s * -.44);
      }
    }
    if (flower) {
      const fy = y - length * .20, fz = z + facing * .034, petal = flower === 2 ? RED : CREAM;
      for (const [dx, dy] of [[-.039,0],[.039,0],[0,.036],[0,-.036]]) {
        box(name, center + dx, fy + dy, fz, .045, .046, .025, petal, true, 0, 0, dx * 8);
      }
      box(name, center, fy, fz + facing * .016, .032, .034, .018, GOLD, true);
    }
  }
  function moss(name, x, y, z, facing, count, spread) {
    for (let i = 0; i < count; i++) {
      const dx = (rand() - .5) * spread, dy = (rand() - .5) * spread * .55;
      box(name, x + dx, y + dy, z + facing * rand() * .018, .056 + rand() * .105, .033 + rand() * .066,
        .036, rand() < .25 ? LIME : rand() < .52 ? MOSS : LEAF, i > 2);
    }
  }
  const side = variant & 1 ? 1 : -1;
  vine("body", side * .453, .996, .5, .63, 1, 1);
  vine("body", -side * .51, .994, .505, variant === 2 ? .56 : .36, 1, variant === 3 ? 2 : 0);
  vine("body", -side * .39, .99, -.496, .59, -1, 1);
  vine("body", side * .52, .91, -.49, .369, -1, 0);
  moss("head", side * .245, .604, .346, 1, 8, .155);
  moss("head", -side * .243, .42, -.3, -1, 7, .155);
  for (const suffix of ["R", "L"]) {
    const s = suffix === "L" ? 1 : -1, arm = "arm" + suffix, elbow = "elbow" + suffix;
    vine(arm, s * .128, .19, .348, s === side ? .38 : .24, 1, s === side ? 1 : 0);
    vine(elbow, s * .177, -.135, .34, s === side ? .35 : .27, 1, 0);
    moss(arm, s * .115, .152, -.33, -1, 8, .25);
    for (let i = 0; i < 11; i++) {
      const x = s * .12 + (rand() - .5) * .28, z = .28 - rand() * .41;
      box(arm, x, .232 + rand() * .028, z, .066 + rand() * .082, .034, .051 + rand() * .073,
        i % 3 ? MOSS : LEAF, i > 4, (rand() - .5) * .8);
    }
    moss(elbow, -s * .079, -.26, -.293, -1, 6, .237);
    vine(s === side ? "leg" + suffix : "knee" + suffix, s * .133, -.093, .344, .378, 1, s === side ? 0 : 1);
    moss("knee" + suffix, -s * .122, -.47, -.30, -1, 10, .28);
    moss("foot" + suffix, s * .173, -.051, .493, 1, 14, .25);
    moss("foot" + suffix, -s * .146, -.098, -.273, -1, 10, .29);
    for (let i = 0; i < 6; i++) box("foot" + suffix, s * .16 + (rand() - .5) * .22,
      .05 + rand() * .046, .291 + rand() * .117, .05 + rand() * .062, .029, .062 + rand() * .072, MOSS, true);
  }

  function crack(name, stage, x, y, z, facing, length, slope) {
    const key = name + stage;
    if (!damage.has(key)) damage.set(key, { name, stage, boxes: [] });
    const boxes = damage.get(key).boxes;
    for (const [branch, steps] of [[0, 5], [1, 3]]) {
      let px = x + branch * slope * length * .28, py = y - branch * length * .40;
      for (let i = 0; i < steps; i++) {
        const bend = i === 2 || i === 4 ? -.40 : 1;
        const dx = (branch ? -slope : slope) * bend * length * (.08 + rand() * .17);
        const dy = -length * (.07 + rand() * .16);
        const tilt = Math.atan2(-dx, dy), width = (stage * .0027 + .006) * (1 - branch * .32);
        const run = Math.hypot(dx, dy) + .009;
        boxes.push([px + dx / 2 + .004, py + dy / 2, z, width * 1.72, run, .002, RUST, 0, 0, tilt]);
        boxes.push([px + dx / 2, py + dy / 2, z + facing * .0015, width, run, .002, GROOVE, 0, 0, tilt]);
        px += dx; py += dy;
      }
    }
  }
  crack("body", 1, side * .563, .811, .437, 1, .185, -side);
  crack("elbowL", 1, -.111, -.163, .335, 1, .104, 1);
  crack("body", 2, -side * .407, .830, .437, 1, .255, -side);
  crack("body", 2, side * .501, .875, -.473, -1, .274, -side);
  crack("head", 2, -.204, .704, .333, 1, .115, 1);
  crack("head", 3, .112, .707, .333, 1, .179, .92);
  crack("elbowR", 3, -.162, -.264, .338, 1, .269, .79);
  crack("kneeL", 3, .132, -.150, .337, 1, .211, -.84);
  crack("body", 3, .273, .939, .458, 1, .166, -.93);
  return { shell, damage: [...damage.values()], glow };
}

function library() {
  if (assets) return assets;
  const variants = new Map(), texture = makeAtlas(), shadowMaterial = makeShadow();
  const unitBox = new THREE.BoxGeometry(1, 1, 1);
  const flower = geometry([
    [-.05, -.63, .329, .025, .30, .025, MOSS, 0, .18, -.39],
    [-.105, -.595, .347, .100, .045, .025, LEAF, 0, 0, .43],
    [-.018, -.536, .365, .084, .038, .025, LIME, 0, 0, -.44],
    [-.107, -.471, .355, .141, .060, .040, RED],
    [-.107, -.471, .356, .065, .139, .043, RED],
    [-.107, -.471, .386, .043, .044, .026, GOLD]
  ], unitBox);
  unitBox.dispose();
  const shadowGeometry = new THREE.PlaneGeometry(1.72, 1.20).rotateX(-Math.PI / 2);
  assets = { variants, texture, shadowMaterial, shadowGeometry, flower, useCount: 0 };
  return assets;
}

function geometryFor(cache, variant) {
  if (cache.variants.has(variant)) return cache.variants.get(variant);
  const { shell, damage, glow } = design(variant), unitBox = new THREE.BoxGeometry(1, 1, 1);
  const distanceShell = { body: shell.body, head: shell.head };
  for (const side of ["R", "L"]) {
    const arm = "arm" + side, elbow = "elbow" + side;
    const leg = "leg" + side, knee = "knee" + side, foot = "foot" + side;
    const lower = (name, offset) => shell[name].map(([x, y, z, ...dimensions]) => [x, y + offset, z, ...dimensions]);
    distanceShell[arm] = [...shell[arm], ...lower(elbow, rig[elbow][2])];
    distanceShell[leg] = [...shell[leg], ...lower(knee, rig[knee][2]), ...lower(foot, rig[knee][2] + rig[foot][2])];
  }
  const meshes = {
    shell: Object.entries(shell).map(([name, boxes]) => ({
      name, near: geometry(boxes, unitBox), far: distanceShell[name] ? geometry(distanceShell[name], unitBox, true) : null
    })),
    damage: damage.map(({ name, stage, boxes }) => ({ name, stage, geo: geometry(boxes, unitBox) })),
    glow: Object.entries(glow).map(([name, boxes]) => ({ name, geo: geometry(boxes, unitBox) }))
  };
  unitBox.dispose();
  cache.variants.set(variant, meshes);
  return meshes;
}

export function guardianDamageStage(hp, maxHp) {
  const ratio = hp / maxHp;
  return ratio > .75 ? 0 : ratio > .50 ? 1 : ratio > .25 ? 2 : 3;
}

export function attachIronGuardian(e, scene) {
  const cache = library(), variant = appearance(e.uid), meshes = geometryFor(cache, variant);
  cache.useCount++;
  const holder = new THREE.Group(), root = new THREE.Group(), parts = {};
  holder.add(root);
  holder.position.set(e.pos.x, e.pos.y, e.pos.z);
  holder.rotation.y = e.yaw + Math.PI;
  const material = new THREE.MeshBasicMaterial({ map: cache.texture, vertexColors: true });
  const eye = new THREE.MeshBasicMaterial({ map: cache.texture, toneMapped: false });
  const badge = eye.clone();
  for (const [name, [parent, x, y, z]] of Object.entries(rig)) {
    const part = parts[name] = new THREE.Group();
    part.position.set(x, y, z);
    (parent ? parts[parent] : root).add(part);
  }
  const addMesh = (parent, geo, mat) => {
    const mesh = new THREE.Mesh(geo, mat);
    parent.add(mesh);
    return mesh;
  };
  const armor = meshes.shell.map(({ name, near, far }) => ({ mesh: addMesh(parts[name], near, material), near, far }));
  const cracks = meshes.damage.map(({ name, stage, geo }) => ({ mesh: addMesh(parts[name], geo, material), stage }));
  for (const { name, geo } of meshes.glow) addMesh(parts[name], geo, name === "head" ? eye : badge);
  const flower = addMesh(parts.elbowL, cache.flower, material);
  flower.visible = false;
  const shadow = addMesh(holder, cache.shadowGeometry, cache.shadowMaterial);
  shadow.position.y = .018; shadow.visible = false;
  const view = e.guardianView = {
    variant, armor, cracks, eye, badge, shadow, flower, coarse: false, stage: -1, eyeLevel: 1, badgeLevel: 1,
    dispose() {
      eye.dispose(); badge.dispose();
      if (--cache.useCount !== 0) return;
      cache.texture.dispose(); cache.shadowGeometry.dispose(); cache.flower.dispose();
      cache.shadowMaterial.map.dispose(); cache.shadowMaterial.dispose();
      for (const built of cache.variants.values()) {
        for (const p of built.shell) { p.near.dispose(); p.far?.dispose(); }
        for (const p of [...built.glow, ...built.damage]) p.geo.dispose();
      }
      assets = undefined;
    }
  };
  Object.assign(e, { mesh: holder, root, parts, mat: material });
  scene.add(holder);
  updateIronGuardianSurface(e, 0, false, false, 0, 0);
  return view;
}

export function updateIronGuardianSurface(e, distanceSq, fast, reducedMotion, combat, dying) {
  const view = e.guardianView, stage = guardianDamageStage(e.hp, e.maxHp);
  const coarse = distanceSq > (fast ? 16 ** 2 : 27 ** 2);
  if (coarse !== view.coarse) {
    view.coarse = coarse;
    for (const p of view.armor) {
      p.mesh.visible = !coarse || p.far !== null;
      if (p.mesh.visible) p.mesh.geometry = coarse ? p.far : p.near;
    }
    view.stage = -1;
  }
  if (stage !== view.stage) {
    view.stage = stage;
    for (const p of view.cracks) p.mesh.visible = !coarse && p.stage <= stage;
  }
  const flicker = stage === 3 && !reducedMotion && Math.sin(e.age * 2.2 + view.variant) > .91
    ? .84 + .11 * Math.sin(e.age * 36) : 1;
  view.eyeLevel = (.89 + .14 * combat) * flicker * (1 - Math.min(1, dying * 1.72));
  view.badgeLevel = (stage < 2 ? .85 : stage === 2 ? .62 : .46) * flicker * (1 - dying);
  view.eye.color.setScalar(view.eyeLevel);
  view.badge.color.setScalar(view.badgeLevel);
  view.shadow.visible = e.onGround && !e.inWater && !coarse;
}
