// Aasim's face in the HUD, drawn like a Doom status-bar face without the gore.
// It glances around while idle and squints with a red flash when the hero takes
// a hit. As hits pile up it picks up sweat, then a band-aid, then dizzy stars,
// and it heals after 15 quiet seconds. After a boss falls it wears sunglasses
// for a moment. It draws the first time After hours is on, so Serious visitors
// never download it.
import { batteredLevel, pixelSprite, toGrid, type Rgb } from "../portrait";

const SRC = "/images/portrait-cutout.webp";
// The square crop runs from the hairline to the chin of the 796×1100 cutout, so the eyes and mouth get most of the pixels.
const CROP = [215, 80, 360] as const;
// A glance slides the crop by this many cutout pixels, which reads as the head turning.
const GLANCE = 22;
const OUTLINE: Rgb = [10, 12, 28];

// The palette interpolates a warm skin ramp from shadow to highlight and adds cool greys for the shirt and the hair's sheen.
const hex = (h: string): Rgb => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16)) as Rgb;
const SKIN = ["#120f1e", "#2a1f2c", "#4a3437", "#6e4a40", "#94634f", "#b98265", "#d9a885", "#efd3bc", "#f8efe6"].map(hex);
const PALETTE: Rgb[] = [
  ...SKIN.flatMap((c, i) => {
    const next = SKIN[i + 1];
    if (!next) return [c];
    return [0, 0.25, 0.5, 0.75].map((t) => c.map((v, k) => Math.round(v + (next[k] - v) * t)) as Rgb);
  }),
  ...["#26252f", "#3a3946", "#504f5d", "#686775", "#82818e", "#9d9ca6", "#b9b8c0"].map(hex),
];

// Overlay features sit in cutout pixels, so they land on the same spot at any grid size.
const EYES = [
  [302, 224, 60, 24],
  [418, 219, 62, 24],
];
const LENSES = [
  [292, 212, 74, 40],
  [410, 208, 76, 40],
];
const BRIDGE = [364, 222, 48, 10];
const SWEAT = [[482, 138, 10, 8], [478, 146, 18, 14], [480, 160, 14, 8]];
const BANDAID = [274, 282, 70, 24];
const BANDAID_PAD = [298, 285, 22, 18];
const STARS = [
  [292, 112],
  [392, 100],
  [500, 116],
];

const box = document.querySelector<HTMLElement>(".hud-face");
const canvas = box?.querySelector("canvas");
const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
const bases: ImageData[] = [];
const hits: number[] = [];
let look = 0;
let hurtUntil = 0;
let shadesUntil = 0;
let started = false;

function render() {
  const ctx = canvas?.getContext("2d");
  if (!canvas || !ctx || bases.length < 3) return;
  const n = canvas.width;
  const crop = [CROP[0] + look * GLANCE, CROP[1], CROP[2]];
  const px = (rect: readonly number[], color: string) => {
    const [x, y, w, h] = toGrid(rect, crop, n);
    ctx.fillStyle = color;
    ctx.fillRect(x, y, w, h);
  };
  const now = performance.now();
  ctx.putImageData(bases[look + 1], 0, 0);
  const level = batteredLevel(hits, now);
  if (level >= 1) SWEAT.forEach((r, i) => px(r, i === 1 ? "#5fb8e8" : "#9ad8ff"));
  if (level >= 2) {
    px(BANDAID, "#e7c39a");
    px(BANDAID_PAD, "#c99a72");
  }
  if (level >= 3) {
    for (const [x, y] of STARS) {
      px([x - 12, y - 3, 24, 6], "#ffd84a");
      px([x - 3, y - 12, 6, 24], "#ffd84a");
    }
  }
  if (now < hurtUntil) {
    // A squint draws each eye as a shut line, which reads as a flinch.
    EYES.forEach(([x, y, w, h]) => px([x, y + h / 2 - 4, w, 8], "#2a1f2c"));
  } else if (now < shadesUntil) {
    LENSES.forEach((r) => px(r, "#0a0c1c"));
    px(BRIDGE, "#0a0c1c");
    LENSES.forEach(([x, y]) => px([x + 10, y + 7, 16, 7], "#ece4d4"));
  }
}

function start() {
  if (started || !canvas || document.documentElement.dataset.siteMode !== "afterhours") return;
  started = true;
  const img = new Image();
  img.src = SRC;
  img
    .decode()
    .then(() => {
      const n = canvas.width;
      const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
      ctx.imageSmoothingQuality = "high";
      for (const l of [-1, 0, 1]) {
        ctx.clearRect(0, 0, n, n);
        ctx.drawImage(img, CROP[0] + l * GLANCE, CROP[1], CROP[2], CROP[2], 0, 0, n, n);
        const d = ctx.getImageData(0, 0, n, n);
        pixelSprite(d.data, n, n, PALETTE, OUTLINE);
        bases.push(d);
      }
      render();
      // Every few seconds the face glances somewhere, and the same tick lets old hits heal.
      setInterval(() => {
        if (!reduce) look = [-1, 0, 0, 1][Math.floor(Math.random() * 4)];
        render();
      }, 2600);
    })
    .catch(() => box?.remove());
}
start();
addEventListener("site:mode", start);

let flash = 0;
addEventListener("world:hurt", () => {
  const now = performance.now();
  hits.push(now);
  while (hits.length > 20) hits.shift();
  hurtUntil = now + 420;
  box?.classList.add("hurt");
  clearTimeout(flash);
  flash = window.setTimeout(() => {
    box?.classList.remove("hurt");
    render();
  }, 440);
  render();
});

addEventListener("world:defeat", (e) => {
  const d = (e as CustomEvent<{ tier: string; quiet?: boolean }>).detail;
  if (d.quiet || d.tier === "minion") return;
  shadesUntil = performance.now() + 1800;
  render();
  setTimeout(render, 1850);
});
