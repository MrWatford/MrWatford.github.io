import { UHC_SKINS } from "./ultra-hardcore.js";

const styles = [
  { outfit: "#78503a", trim: "#c19b71", hood: "", scarf: "#9d2e24", eyes: "#377ba1",
    desc: "Weathered leather, a red scarf and a trail pack.", gear: "pack" },
  { outfit: "#49463a", trim: "#b9ab93", hood: "#63594e", scarf: "#782a26", eyes: "#48703c",
    desc: "A fur mantle, wolf hood and a hunter’s quiver.", gear: "wolf" },
  { outfit: "#241f26", trim: "#65575e", hood: "#2b232d", scarf: "#8f2026", eyes: "#f05a49",
    desc: "Black and red armor, a heart crest and a scarlet cape.", gear: "champion" },
  { outfit: "#46552d", trim: "#b8a369", hood: "#4e602c", scarf: "#7d3126", eyes: "#75a552",
    desc: "An olive hood, face wrap and a pack with a trail lantern.", gear: "nomad" }
];

export function ultraSkins({ pal, standardHead, shirtBody, sleeveArm, pantsLeg }) {
  return UHC_SKINS.map((skin, i) => {
    const style = styles[i];
    const c = { skin: "#dca778", hair: "#39251f", eye: style.eyes, shirt: style.outfit,
      pants: i === 2 ? "#30272c" : "#493d35", shoes: "#312420" };
    const cap = standardHead(c);
    return {
      ...skin, c, gear: style.gear, desc: style.desc, locked: true,
      unlock: "Survive Day " + skin.day + " in Ultra Hardcore",
      head(P, f) {
        cap(P, f);
        if (style.hood && f !== "front") P.fill(pal(style.hood));
        if (f !== "front") return;
        if (style.hood) {
          P.noise(0, 0, 16, 4, pal(style.hood));
          P.rect(0, 4, 2, 12, style.hood); P.rect(14, 4, 2, 12, style.hood);
          P.rect(0, 3, 16, 1, i === 2 ? "#ae2829" : style.trim);
        }
        if (i === 2 || i === 3) {
          P.noise(2, 10, 12, 6, pal(style.scarf));
          P.rect(2, 13, 12, 1, "#51211d");
        } else if (i === 0) {
          for (let k = 0; k < 4; k++) P.px(5 - k, 8 + k, "#783d31");
        } else {
          P.rect(2, 1, 12, 3, style.trim); P.rect(5, 3, 6, 2, "#65594e");
        }
      },
      body: shirtBody(c, (P, f) => {
        if (f === "top" || f === "bottom") return;
        P.noise(0, 0, 16, 3, pal(style.scarf));
        P.rect(0, 12, 16, 3, "#553725"); P.rect(7, 12, 3, 3, style.trim);
        if (f === "front" && i !== 2) {
          for (let k = 0; k < 10; k++) P.rect(12 - k, 2 + k, 2, 1, style.trim);
          P.rect(10, 9, 4, 5, "#67452b");
        }
        if (f === "front" && i === 2) {
          P.rect(4, 4, 3, 3, "#f34735"); P.rect(9, 4, 3, 3, "#f34735");
          P.rect(4, 6, 8, 2, "#ff5946"); P.rect(5, 8, 6, 1, "#eb3125");
          P.rect(6, 9, 4, 1, "#cc241e"); P.rect(7, 10, 2, 1, "#be241c");
        }
      }),
      arm(P, f) {
        sleeveArm(c, 8)(P, f);
        if (f === "top" || f === "bottom") return;
        P.noise(0, 0, 16, 4, pal(style.trim));
        P.rect(0, 10, 16, 4, style.outfit); P.rect(4, 10, 3, 2, style.trim);
      },
      leg(P, f) {
        pantsLeg(c)(P, f);
        if (f === "top" || f === "bottom") return;
        P.rect(0, 7, 16, 2, style.trim); P.noise(0, 10, 16, 5, pal(c.shoes));
      }
    };
  });
}

export function skinAccessories(THREE, parts, gear) {
  const accessories = [];
  const add = (part, color, size, center) => {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(...size.map(n => n / 16)),
      new THREE.MeshBasicMaterial({ color }));
    mesh.position.set(...center.map(n => n / 16));
    parts[part].add(mesh);
    accessories.push(mesh);
    return mesh;
  };
  if (gear === "champion") {
    for (const x of [-3, 0, 3]) {
      add("body", x ? 0x952a29 : 0xbb292b, [3, x ? 14 : 16, .45], [x, 3, -3.2]);
    }
  } else {
    add("body", 0x583823, [6, 7, 2.5], [0, 6, -3.25]);
    add("body", 0x9b7b57, [7, 2.5, 2.3], [0, 10, -3.5]);
    add("body", 0x735238, [4, 3, .5], [0, 6, -4.7]);
    if (gear === "wolf") {
      for (const x of [-3, 3]) add("head", 0x7b6f60, [2, 2.5, 2], [x, 8.7, -.9]);
      add("head", 0x6f6355, [5, 2, 2], [0, 6.7, 4.6]);
      add("body", 0x543422, [1.6, 9, 1.6], [3.4, 9, -4.1]);
    } else {
      add("body", 0x5d3920, [1.8, 3.4, 1.8], [3.25, 4, -4.4]);
      add("body", gear === "nomad" ? 0xffcb58 : 0xc29244, [1.4, 1.9, 1.9], [3.25, 4, -4.4]);
    }
  }
  return accessories;
}
