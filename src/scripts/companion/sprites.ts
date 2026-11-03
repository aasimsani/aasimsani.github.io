// Pixel art for the background game. Frames are strings, one character per pixel, facing right. "." is
// transparent, and every other character keys into a palette. The sprites are drawn at twice the detail of
// the world: Scale2x doubled the original art, and each material carries a five-step shading ramp.
//
// A palette lists base colors only. Each frame set's SHADES table maps its extra keys to a material and a
// step, and withShades() computes those colors at load, so a new scarf or tie color reshades itself.
export type Frame = string[];
type Step = -2 | -1 | 1 | 2 | "sel";
type Shades = Record<string, [string, Step]>;
export type SpriteSet = { frames: Frame[]; pal: Record<string, string> };

// --- shading ------------------------------------------------------------------------

const hexRgb = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const rgbHex = (c: number[]) => "#" + c.map((v) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, "0")).join("");
function toHsl([r, g, b]: number[]): [number, number, number] {
  r /= 255; g /= 255; b /= 255;
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2;
  if (mx === mn) return [0, 0, l];
  const d = mx - mn, s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn);
  const h = mx === r ? (g - b) / d + (g < b ? 6 : 0) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return [h * 60, s, l];
}
function fromHsl([h, s, l]: [number, number, number]): number[] {
  h = ((((h % 360) + 360) % 360) / 360);
  if (!s) return [l * 255, l * 255, l * 255];
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s, p = 2 * l - q;
  const f = (t: number) => { t = (t + 1) % 1; return t < 1 / 6 ? p + (q - p) * 6 * t : t < 1 / 2 ? q : t < 2 / 3 ? p + (q - p) * (2 / 3 - t) * 6 : p; };
  return [f(h + 1 / 3) * 255, f(h) * 255, f(h - 1 / 3) * 255];
}
// Shadows drift toward violet and highlights toward warm gold, so a ramp reads as light on the material.
const toward = (h: number, target: number, k: number) => h + ((((target - h) % 360) + 540) % 360 - 180) * k;
function shade(hex: string, step: Step): string {
  const [h, s, l] = toHsl(hexRgb(hex));
  const at = (dl: number, ds: number, target: number, k: number) => rgbHex(fromHsl([toward(h, target, k), Math.max(0, Math.min(1, s + ds)), Math.max(0.04, Math.min(0.97, l + dl))]));
  if (step === -2) return at(-0.26, 0.05, 255, 0.28);
  if (step === -1) return at(-0.13, 0.04, 255, 0.14);
  if (step === 1) return at(0.1, 0.02, 50, 0.12);
  if (step === 2) return at(0.22, -0.08, 55, 0.22);
  // A selective outline: the material's deepest step, darkened again, over edges that face the light.
  return rgbHex(hexRgb(at(-0.26, 0.05, 255, 0.28)).map((v) => v * 0.62));
}
/** The palette plus a color for every shading key in `shades`. */
export function withShades(pal: Record<string, string>, shades: Shades): Record<string, string> {
  const out = { ...pal };
  for (const [k, [material, step]] of Object.entries(shades)) if (pal[material]) out[k] = shade(pal[material], step);
  return out;
}

// --- the two heroes ----------------------------------------------------------------

export const WANDERER: Frame = [
  "........0000000.........",
  "......001cccCC00........",
  ".....01ccccccCCC0.......",
  ".....01c1ccc1CCCCoo.....",
  ".....o1ccccccCCCCCo.....",
  "....01ccccccc1CCCCCo....",
  "....o1cccccffffffffo....",
  "....o1ccccfffffffffo....",
  "....o1ccccffeeffeeeo....",
  "....o1ccccffeeffeeeo....",
  "....o1ccccfffffffffo....",
  "....o1ccccfffffffffo....",
  "....o34444444444443o....",
  "...ooo4ssssssssss3ooo...",
  "...odd1111111111CCCCo...",
  "..oddd1cccccccccCCCCCo..",
  "..oddd1cccccccccCCCCCo..",
  "..odddd1ccccccccCCCCCo..",
  "..odddd1ccccccccCCCCCo..",
  "..odddddc2222222cCCCCo..",
  "..odddddc22222222CCCCo..",
  ".odddddddc2222222cCCCo..",
  ".odddddddc22222222CCCo..",
  "odddddddddc2222222cCooo.",
  "odddddddddc22222222c5ooo",
  ".odddddddd555555555555oo",
];
const WANDERER_SHADES: Shades = { "0": ["c", "sel"], "1": ["c", 1], "2": ["c", -1], "3": ["s", -1], "4": ["s", 1], "5": ["c", -2] };

// The professional: slicked hair, glasses, white collar, LinkedIn-blue tie, navy suit.
export const PRO: Frame = [
  ".........000000.........",
  ".......o01111120o.......",
  ".......o1hhhhhh2o.......",
  ".....o01hhhhhhhh20o.....",
  ".....o1hhhhhhhhhh2o.....",
  "....01hhhhhhhhhhhh2o....",
  "....o1hhhhh33333334o....",
  "....o1hhh33kkkkkkk4o....",
  "....o1hhh3gg3kgg3k4o....",
  "....o1hh3kgg3kgg3k4o....",
  "....o2hh3k33kk33kKKo....",
  ".....o223kkkkkkKKKo.....",
  ".....ooo3kkkkkkKKo......",
  "......o3kkkkkkKKKo......",
  "...oSS5566776655SSo.....",
  ".o8SSS5s6w7t6w5sSSSoo...",
  ".o55SS5s6w7t6w5sSSSSo...",
  "85ssSS5s567t765sSSSSSo..",
  "o5ssSS5ss57tt75sSSSSSo..",
  "os99SSs999t!!!s9SSSSSo..",
  "os99SSs999t!!!s9SSSSSo..",
  "os99SSs999st!!s9SSSSSo..",
  "odddSSs9999t!!s9SSSSSo..",
  "odddSs99999st!s9SSSSSo..",
  "oddds9999999ss99SSSSSo..",
  ".odd############SSSSo...",
];
const PRO_SHADES: Shades = { "0": ["h", "sel"], "1": ["h", 1], "2": ["h", -1], "3": ["k", 1], "4": ["k", -1], "5": ["s", 1], "6": ["w", 1], "7": ["t", 1], "8": ["s", "sel"], "9": ["s", -1], "!": ["t", -1], "#": ["s", -2] };

const LEG_FRAMES: Frame[] = [
  [
    "..........bb..bb........",
    "..........bb..bb........",
    "..........bb..bb........",
    "..........bb..bbb.......",
    "..........bbbb..bbbb....",
    "...........bbb..bbbb....",
  ],
  [
    "..........bb....bb......",
    ".........bbb....bbb.....",
    "........bb.......bbb....",
    "........bb........bbb...",
    "........bbbb......bbbb..",
    ".........bbb.......bbb..",
  ],
  [
    "............bb..........",
    "............bb..........",
    "............bb..........",
    "............bbb.........",
    "............bbbb........",
    ".............bbb........",
  ],
  [
    "........bb........bb....",
    ".......bbb........bbb...",
    "......bbb..........bbb..",
    ".....bbb............bbb.",
    "....bbbb............bbbb",
    "....bbb..............bbb",
  ],
  [
    "........bb......bb......",
    ".......bbb......bbb.....",
    "......bbb........bbb....",
    ".....bbb..........bbb...",
    "....bbbb..........bbbb..",
    "....bbb............bbb..",
  ],
];
export const LEGS: Record<string, Frame> = { idle: LEG_FRAMES[0], stride: LEG_FRAMES[1], pass: LEG_FRAMES[2], run: LEG_FRAMES[3], lunge: LEG_FRAMES[4] };

export type Look = {
  body: Frame;
  pal: Record<string, string>;
  /** Colors of the trailing cloth: the wanderer's scarf, or the professional's tie. */
  trail: [string, string];
  trailLength: number;
  weapon: "sword" | "keyboard";
  weaponColor: string;
  crown: boolean;
  aura: number;
};

const wanderer = (scarf: string, tip: string): Omit<Look, "crown" | "aura"> => ({
  body: WANDERER,
  pal: withShades({ o: "#080a16", c: "#2e3f74", C: "#5070b8", d: "#18203f", f: "#06070f", e: "#ffe08a", s: scarf, b: "#1e1418" }, WANDERER_SHADES),
  trail: [scarf, tip],
  trailLength: 11,
  weapon: "sword",
  weaponColor: "#d8e6ff",
});

const pro = (tie: string, keys: string): Omit<Look, "crown" | "aura"> => ({
  body: PRO,
  pal: withShades({ o: "#080a16", h: "#2a1d16", k: "#e0a37a", K: "#b9805c", g: "#0b0d18", w: "#f2efe8", t: tie, s: "#1f2a44", S: "#34466e", d: "#141b2e", b: "#141b2e" }, PRO_SHADES),
  trail: [tie, tie],
  trailLength: 6,
  weapon: "keyboard",
  weaponColor: keys,
});

/** One look per hype stop: touch grass, normal human, hireable, thought leader, agree?. */
export const LOOKS: Look[] = [
  { ...wanderer("#5f8f6a", "#8fc392"), crown: false, aura: 0 },
  { ...wanderer("#d4364f", "#ff7070"), crown: false, aura: 0 },
  { ...wanderer("#0a66c2", "#4d9be6"), crown: false, aura: 0.1 },
  { ...pro("#0a66c2", "#c9ced8"), crown: false, aura: 0.18 },
  { ...pro("#ffcf6b", "#ffcf6b"), crown: true, aura: 0.32 },
];

// --- minions --------------------------------------------------------------------------
// By day the slime puts on sunglasses, and the bat gives way to a seagull.

const NIGHT = { o: "#0a0c18", G: "#6bd36b", g: "#b8f5a0", e: "#0a0c18", B: "#4a2f6b", R: "#ff4a4a" };
const DAY = { o: "#2a2f3a", G: "#a6e05a", g: "#e6ffb0", q: "#14161f", W: "#fbfaf6", Y: "#f2b134" };
export const SLIME: SpriteSet = { frames: [
    [
      ".......000000.......",
      ".....o01111120o.....",
      ".....o1GGGGGG2o.....",
      "...o01GGGGGGGG20o...",
      "...o1G331GGGGGG2o...",
      "..01GG331GGGGGGG2o..",
      "..o1GGee1GGGee1G2o..",
      ".01GGGee1GGGee1GG2o.",
      ".o1GGG11GGGG11GGG2o.",
      "0G22222222222222224o",
      "o422222222222222233o",
      ".o4222222222222233o.",
      ".oo44444444444443oo.",
      "...oooooooooooooo...",
    ],
    [
      "....................",
      "....................",
      ".......000000.......",
      ".....o01111120o.....",
      "...0oo1GGGGGG2oo0...",
      ".o013o1GGGGGG2oe20o.",
      ".o1G331Gee1GGGee12o.",
      "01GG331Gee1GGGee1G2o",
      "o1GG11GG11GGGG11GG2o",
      "o1GGGGGGGGGGGGGGGG2o",
      "o422222222222222233o",
      ".o4222222222222233o.",
      ".oo44444444444443oo.",
      "...oooooooooooooo...",
    ],
  ], pal: withShades(NIGHT, { "0": ["G", "sel"], "1": ["G", 1], "2": ["G", -1], "3": ["G", 2], "4": ["G", -2] }) };
export const BAT: SpriteSet = { frames: [
    [
      "01..................01",
      "0B1................0B1",
      "1B1......oooo......0B1",
      ".0B01..ooRooRoo..00B1.",
      ".11BB1oRRRooRRRo0BB11.",
      "...0BB1oRRooRRo0BB1...",
      "...2212ooooooooB122...",
      ".....2222oooo2222.....",
      "........oo..oo........",
      "........oo..oo........",
    ],
    [
      "......................",
      "......................",
      ".........oooo.........",
      ".......ooRooRoo.......",
      ".....1oRRRooRRRo1.....",
      "...00B1oRRooRRo0B01...",
      "...0BB1oooooooo0BB1...",
      ".00BB1111oooo1111BB01.",
      "B1122...oo..oo...22112",
      "222.....oo..oo.....222",
    ],
  ], pal: withShades(NIGHT, { "0": ["B", 1], "1": ["B", -1], "2": ["B", -2] }) };
export const SLIME_DAY: SpriteSet = { frames: [
    [
      ".......000000.......",
      ".....o01111120o.....",
      ".....o1GGGGGG2o.....",
      "...o01GGGGGGGG20o...",
      "...o1G331GGGGGG2o...",
      "..01GG331GGGGGGG2o..",
      "..oqqqqq1Gqqqq1G2o..",
      ".oooqqq1GGqqqq1GG2o.",
      ".o11111GGG1111GGG2o.",
      "0G22222222222222224o",
      "o422222222222222233o",
      ".o4222222222222233o.",
      ".oo44444444444443oo.",
      "...oooooooooooooo...",
    ],
    [
      "....................",
      "....................",
      ".......000000.......",
      ".....o01111120o.....",
      "...0oo1GGGGGG2oo0...",
      ".o013o1GGGGGG2oq20o.",
      ".o1G33qqqq1Gqqqq12o.",
      "01GG13qqqq1Gqqq1GG2o",
      "o1GGG11111GG111GGG2o",
      "o1GGGGGGGGGGGGGGGG2o",
      "o422222222222222233o",
      ".o4222222222222233o.",
      ".oo44444444444443oo.",
      "...oooooooooooooo...",
    ],
  ], pal: withShades(DAY, { "0": ["G", "sel"], "1": ["G", 1], "2": ["G", -1], "3": ["G", 2], "4": ["G", -2] }) };
export const GULL: SpriteSet = { frames: [
    [
      "001................001",
      "1WW01............00WW1",
      ".11W1............0W11.",
      "...0W01........00W1...",
      "...11WW1oooooo0WW11...",
      ".....1111oYYo1111.....",
      "........oYYYYo........",
      ".........oYYo.........",
      ".........oYYo.........",
      "..........oo..........",
    ],
    [
      "......................",
      "......................",
      ".........oooo.........",
      "........ooYYoo........",
      "000000001oYYo100000001",
      "11WWWWW1oYYYYo1WWWWW11",
      "..1WW11..oYYo..11WW1..",
      "...11.....oo.....11...",
      "WW2................2W2",
      "22..................22",
    ],
  ], pal: withShades(DAY, { "0": ["W", 1], "1": ["W", -1], "2": ["W", -2] }) };

/** Daytime bosses brighten and swap their eyes for sunglasses. */
export function dayPalette(pal: Record<string, string>): Record<string, string> {
  const lift = (hex: string) => {
    const v = hex.replace("#", "");
    const ch = [0, 2, 4].map((i) => Math.round(parseInt(v.slice(i, i + 2), 16) * 0.72 + 255 * 0.28));
    return "#" + ch.map((c) => c.toString(16).padStart(2, "0")).join("");
  };
  const out: Record<string, string> = {};
  for (const [k, c] of Object.entries(pal)) out[k] = k === "o" || k === "k" || k === "m" ? c : lift(c);
  if (out.w) out.w = "#14161f";
  if (out.E) out.E = "#3a3f4c";
  if (out.e) out.e = "#ffffff";
  return out;
}

// --- mini-bosses: shared blob and wing bodies, plus three one-offs ---------------------
// Merge Conflict splits down a ======= seam, Hot Take is a shouting fireball,
// and Reviewer 2 is an academic with a red pen.

const BLOB: Frame[] = [
  [
    "...........0000000000...........",
    ".........00111111111200.........",
    ".......0011AAAAAAAAAA1200.......",
    ".....o011AAAAAAAAAAAAAA120o.....",
    ".....o1AAA331AAAAAAAAAAAA2o.....",
    "...o01AAA3331AAAAAAAAAAAAA20o...",
    "...o1AAA3331AAAAAAAAAAAAAAA2o...",
    "..01AAAA331AAAAAAAAAAAAAAAAA2o..",
    "..o1AAAA11Aww1AAAAAAAww1AAAA2o..",
    ".01AAAAAAAwwww1AAAAAwwww1AAAA2o.",
    ".o1AAAAAAAwwwE1AAAAAwwwE1AAAA2o.",
    "01AAAAAAAA1wE1AAAAAA1wE1AAAAAA2o",
    "o1AAAAAAAAA11AAAAAAAA11AAAAAAA2o",
    "o1AAAAAAAAAAAAAAAAAAAAAAAAAAAA2o",
    "o1AAAAAAAAAAmmmmmmmmmm1AAAAAAA2o",
    "oA2222222222mmmmmmmmmmA22222224o",
    "o42222222222AAAAAAAAAA222222224o",
    ".o4222222222222222222222222224o.",
    ".oo42222222222222222222222224oo.",
    "...o422222222222222222222224o...",
    "...oo4444444444444444444444oo...",
    ".....oooooooooooooooooooooo.....",
  ],
  [
    "................................",
    "................................",
    ".........000oo000000000.........",
    ".......001113311111111200.......",
    ".....0011AAA331AAAAAAAA1200.....",
    "...o011AAAAA331AAAAAAAAAA120o...",
    "...o1AAA331A11AAAAAAAAAAAAA2o...",
    ".o01AAAA331AAAAAAAAAAAAAAAAA20o.",
    ".o1AAAAA11Aww1AAAAAAAAAww1AAA2o.",
    "01AAAAAAAAwwww1AAAAAAAwwww1AAA2o",
    "o1AAAAAAAAwwwE1AAAAAAAwwwE1AAA2o",
    "o1AAAAAAAA1wE1AAAAAAAA1wE1AAAA2o",
    "o1AAAAAAAAA11AAAAAAAAAA11AAAAA2o",
    "o1AAAAAAAAAAAAAAAAAAAAAAAAAAAA2o",
    "o1AAAAAAAAAAmmmmmmmmmmmm1AAAAA2o",
    "o1AAAAAAAAAAmmmmmmmmmmmm1AAAAA2o",
    "o42222222222AAAAAAAAAAAA2222224o",
    ".o42222222222222222222222222224o",
    ".oo4222222222222222222222222224o",
    "...o42222222222222222222222224o.",
    "...oo444444444444444444444444oo.",
    ".....oooooooooooooooooooooooo...",
  ],
];
const BLOB_SHADES: Shades = { "0": ["A", "sel"], "1": ["A", 1], "2": ["A", -1], "3": ["A", 2], "4": ["A", -2] };
const WING: Frame[] = [
  [
    "01..............................01",
    "0W1............................0W1",
    "0W1............2222............0W1",
    "0WW01........o233342o........00WW1",
    "1WWW1........o3AAAA4o........0WWW1",
    ".0WWW01....o23AAAAAA42o....00WWW1.",
    ".11WWWW0015o3Aww3Aww34o5000WWWW11.",
    "...0WWWWWW1o3Aww3Aww34o1WWWWWW1...",
    "...11WWWW1oo3A33AA33A4oo0WWWW11...",
    ".....11WW1oo3AAAAAAAA4oo0WW11.....",
    ".......6616oA4mmmmmmA7o6166.......",
    ".........6oo74mmmmmmA7oo6.........",
    "...........oo7AAAAAA7oo...........",
    ".............o777777o.............",
    ".............ooo..ooo.............",
    "..............oo..oo..............",
  ],
  [
    "..................................",
    "..................................",
    "...............2222...............",
    ".............o233342o.............",
    ".............o3AAAA4o.............",
    "...........o23AAAAAA42o...........",
    ".....000015o3Aww3Aww34o500001.....",
    "...00WWWWW1o3Aww3Aww34o1WWWWW01...",
    "...0WWWWW1oo3A33AA33A4oo0WWWWW1...",
    ".00WWW11W1oo3AAAAAAAA4oo0W11WWW01.",
    ".0WWW1..1W1o3Ammmmmm34o1W1..1WWW1.",
    "0WWW1....1oo4Ammmmmm34oo1....0WWW1",
    "W1166......oo7AAAAAA7oo......66116",
    "W16..........o777777o..........W16",
    "W16..........ooo..ooo..........616",
    "66............oo..oo............66",
  ],
];
const WING_SHADES: Shades = { "0": ["W", 1], "1": ["W", -1], "2": ["A", "sel"], "3": ["A", 1], "4": ["A", -1], "5": ["W", "sel"], "6": ["W", -2], "7": ["A", -2] };
const SPLIT: Frame[] = [
  [
    ".....00.........==.........11.....",
    "...o02300.......==.......11451o...",
    "...o2AA230000ooo==ooo111144BB5o...",
    ".o02AAAAA2223oo====oo4444BBBBB51o.",
    ".o2AAAAAAAAA3ooo==ooo4BBBBBBBBB5o.",
    "02AAAAAAAAAAA3oo==oo4BBBBBBBBBBB5o",
    "o2AA662AAAAAA3oo==oo4B774BBBBBBB5o",
    "o2AA662AAAAAA3oo==oo4B774BBBBBBB5o",
    "o2AAwww2AAAAA3oo==oo4B44BBBww4BB5o",
    "o2AAwwww2AAAA3oo==oo4BBBBBwwww4B5o",
    "o2AAwwwE2AAAA3oo==oo4BBBBBEwww4B5o",
    "o2AA2wE2AAAAA3oo==oo4BBBBB4Ew4BB5o",
    "o2AAA22AAAAAA3oo==oo4BBBBBB44BBB5o",
    "o2AAAAAAAAAAA3oo==oo4BBBBBBBBBBB5o",
    "o2AAAAmmmmmm23oo==oo4BBBmmmmmm4B5o",
    "o2AAAAmmmmmm23oo==oo4BBBmmmmmm4B5o",
    "o83333AAAAAA38oo==ooB555BBBBBB559o",
    ".o833333333338oo==ooB55555555559o.",
    ".oo83333333338o====oB5555555559oo.",
    "...o8388338838oo==oo9599559959o...",
    "...oo8oo88oo8oo.==.oo9oo99oo9oo...",
    ".....oooooooo...==...oooooooo.....",
    ".....ooo..ooo........ooo..ooo.....",
    "......oo..oo..........oo..oo......",
  ],
  [
    ".....00....................11.....",
    "...o02300................11451o...",
    "...o2AA230000ooo==ooo111144BB5o...",
    ".o02AAAAA2223oo====oo4444BBBBB51o.",
    ".o2AAAAAAAAA3ooo..ooo4BBBBBBBBB5o.",
    "02AAAAAAAAAAA23o..o54BBBBBBBBBBB5o",
    "o2AA662AAAAAA3o====o4B774BBBBBBB5o",
    "o2AA662AAAAAA3o====o4B774BBBBBBB5o",
    "o2AAwww2AAAAAA3o..o4BB44BBBww4BB5o",
    "o2AAwwww2AAAAA3o..o5BBBBBBwwww4B5o",
    "o2AAwwwE2AAAA3o====o4BBBBBEwww4B5o",
    "o2AA2wE2AAAAA3o====o4BBBBB4Ew4BB5o",
    "o2AAA22AAAAAAA3o..o4BBBBBBB44BBB5o",
    "o2AAAAAAAAAAAA3o..o5BBBBBBBBBBBB5o",
    "o2AAmm2Amm2Ammo====omm4Bmm4Bmm4B5o",
    "oA33mmA3mmA3mmo====ommB5mmB5mmB59o",
    "o833AA33AA33AA8o..oBBB55BB55BB559o",
    ".o8333333333338o..o9555555555559o.",
    ".oo83333333338o====o95555555559oo.",
    "...o833888338ooo==ooo955999559o...",
    "...oo88ooo88ooo....ooo99ooo99oo...",
    ".....ooooooooo......ooooooooo.....",
    ".......ooo..oo......oo..ooo.......",
    "........oo..oo......oo..oo........",
  ],
];
const SPLIT_SHADES: Shades = { "0": ["A", "sel"], "1": ["B", "sel"], "2": ["A", 1], "3": ["A", -1], "4": ["B", 1], "5": ["B", -1], "6": ["A", 2], "7": ["B", 2], "8": ["A", -2], "9": ["B", -2] };
const FLAME: Frame[] = [
  [
    "..............01..............",
    ".............0Y1..............",
    ".............0Y1......01......",
    "...........00YY1.....0Y1......",
    "....01.....02201.....0Y1......",
    "....0Y1...0Y2A201...0YYY1.....",
    "....0Y1...0Y2AA01...0Y221.....",
    "...0YYY1..0Y2AA221..0Y2A01....",
    "...02201..0Y2AAAA000YY2A01....",
    "..0Y2A21..02AAAAA220YY2A201...",
    "..0Y2AA000Y2AA332AA0YY2AA01...",
    "..0Y2AA2112AA33332A2112AA201..",
    "..0Y2AA4oo2AA33332A4oo2AAA01..",
    ".0Y2AAA4oo2A33333324oo2AAA201.",
    ".0Y2AAAA22Awww22www222AAAAA01.",
    "0Y2AAAAAAAwwww2Awwww2AAAAAA201",
    "0Y2AAAAAAAwwwE2AEwww2AAAAAAA01",
    "0Y2AAAAAAA2wE2AA2Ew2AAAAAAAA01",
    "1Y2AAAAAAAA22AAAA22AAAAAAAAA01",
    ".002AAAAAAAAAAAAAAAAAAAAAAA01.",
    ".1Y2AAAAAAAmmmmmmmm2AAAAAAA11.",
    "..YYA44444mmmmmmmmmmA4444Y5...",
    "..51A44444mmRRRRRRmmA4444Y5...",
    "...YYA4444AmRRRRRRmA4444Y5....",
    "...55A44444mmmmmmmmA4444Y5....",
    ".....YYA444AAmmmmAA4444Y5.....",
    ".....55YYA444AAAA4444YY55.....",
    ".......55YYA4444444YY55.......",
    ".........55YYYYYYYY55.........",
    "...........55555555...........",
  ],
  [
    "............01................",
    "............0Y1...............",
    "......01....0Y1.....01........",
    ".....0Y1...0YYY1...0Y1........",
    ".....0Y1...02201...0Y1........",
    "...00YY1..0Y2A21..0YYY1.......",
    "...02201..0Y2AA000YY221.......",
    "..0Y2A21..0Y2AA220YY2A201.....",
    "..0Y2AA000YY2AAAA0YY2AA01.....",
    "..0Y2AA20YY2AAAAA20Y02A2201...",
    "..0Y2AAA0YY2AA332A20Y02AA01...",
    "..0Y2AAA112AA33332A2112AA201..",
    "..0Y2AA4oo2AA33332A4oo2AAA01..",
    ".0Y2AAA4oo2A33333324oo2AAA201.",
    ".0Y2AAAA22Awww22www222AAAAA01.",
    "0Y2AAAAAAAwwww2Awwww2AAAAAA201",
    "0Y2AAAAAAAwwwE2AEwww2AAAAAAA01",
    "0Y2AAAAAAA2wE2AA2Ew2AAAAAAAA01",
    "1Y2AAAAAAAA22AAAA22AAAAAAAAA01",
    ".002AAAAAAAAAAAAAAAAAAAAAAA01.",
    ".1Y2AAAAAmmmmmmmmmmmm2AAAAA11.",
    "..YYA444mmmmmmmmmmmmmmA44Y5...",
    "..51A444mmRRRRRRRRRRmmA44Y5...",
    "...YYA44AmRRRRRRRRRRmA44Y5....",
    "...55A444mmmmmmmmmmmmA44Y5....",
    ".....YYA4AAmmmmmmmmAA44Y5.....",
    ".....55YYA4AAAAAAAA44YY55.....",
    ".......55YYA4444444YY55.......",
    ".........55YYYYYYYY55.........",
    "...........55555555...........",
  ],
];
const FLAME_SHADES: Shades = { "0": ["Y", 1], "1": ["Y", -1], "2": ["A", 1], "3": ["A", 2], "4": ["A", -1], "5": ["Y", -2] };
const SCHOLAR: Frame[] = [
  [
    ".........kkkkkkkkkkkk.........",
    ".......kkkkkkkkkkkkkkkk.......",
    "....kkkkkkkkkkkkkkkkkkkkk.....",
    "....kkkkkkkkkkkkkkkkkkkkkk....",
    "........okkkkkkkkkkkko..TT....",
    ".......oookkkkkkkkkkooo.TTT...",
    ".......oHHHHHHHHHHHHHHo..TTT..",
    ".....o0HHHHHHHHHHHHHHH10o.TT..",
    ".....o2222222222222222A1o.....",
    "....02AAAAAAAAAAAAAAAAAA1o....",
    "....oGGGGGGGG2AAAGGGGGGGGo....",
    "....oGGGGGGGGG2AGGGGGGGGGo....",
    "....oGGGGwEGGG2AGGGwEGGGGo....",
    "....oGGGwwEEG2AA2GwwEEGGGo....",
    "....o22222222AAAA22222221o....",
    "....o2AAAAAAAAAAAAAAAAAA1o....",
    "....o1AAAAAAmmmmmm2AAAAA1o....",
    ".....o1AAAAmmmmmmmm2AAA1o.....",
    "......o2AAmmm2222mmm2A1o......",
    "......o2AAmm2AAAA2mm2A1o......",
    ".....34444444444444444453.....",
    "...o34CCCCCCCCCCCCCCCCCC533...",
    "...oC55555555555555555555C6oRR",
    "..3C5555555555555555555556oRRR",
    "..oC5555555PPPPPPPPC55556ooRR.",
    "..oC555555PPPPPPPPPPC556oRR...",
    "..o6555555PPXXPPXXPPC5556o....",
    "...o655555PPXXPPXXPPC556o.....",
    "...oo65555PPPPPPPPPPC656o.....",
    ".....o6556PPPPPPPPPP6o6o......",
    ".....oo66o..........oooo......",
    ".......oo............oo.......",
  ],
  [
    ".........kkkkkkkkkkkk.........",
    ".......kkkkkkkkkkkkkkkk.......",
    "....kkkkkkkkkkkkkkkkkkkkkk....",
    "....kkkkkkkkkkkkkkkkkkkkkk....",
    "........okkkkkkkkkkkko....TT..",
    ".......oookkkkkkkkkkooo...TT..",
    ".......oHHHHHHHHHHHHHHo...TT..",
    ".....o0HHHHHHHHHHHHHHH10o.TT..",
    ".....o2222222222222222A1o.....",
    "....02AAAAAAAAAAAAAAAAAA1o....",
    "....oGGGGGGGG2AAAGGGGGGGGo....",
    "....oGGGGGGGGG2AGGGGGGGGGo....",
    "....oGGGGEwGGG2AGGGEwGGGGo....",
    "....oGGGEEwwG2AA2GEEwwGGGo....",
    "....o22222222AAAA22222221o....",
    "....o2AAAAAAAAAAAAAAAAAA1o....",
    "....o1AAAAAAmmmmmm2AAAAA1o....",
    ".....o1AAAAmmmmmmmm2AAA1o.....",
    "......o2AAmmm2222mmm2A1o......",
    "......o2AAmm2AAAA2mm2A1o......",
    ".....344444444444444444533R...",
    "...o34CCCCCCCCCCCCCCCCCC45oRR.",
    "...oC555555555555555555556oRRR",
    "..3C55555555555555555555556oRR",
    "..oC5555555PPPPPPPPC555556o...",
    "..oC555555PPPPPPPPPPC5556o....",
    "..o6555555PPPPXXPPXXC5556o....",
    "...o655555PPPPXXPPXXC556o.....",
    "...oo65555PPPPPPPPPPC656o.....",
    ".....o6556PPPPPPPPPP6o6o......",
    ".....oo66o..........oooo......",
    ".......oo............oo.......",
  ],
];
const SCHOLAR_SHADES: Shades = { "0": ["A", "sel"], "1": ["A", -1], "2": ["A", 1], "3": ["C", "sel"], "4": ["C", 1], "5": ["C", -1], "6": ["C", -2] };

export type MiniBoss = { name: string; frames: Frame[]; pal: Record<string, string>; flying: boolean };

const mini = (name: string, frames: Frame[], shades: Shades, body: string, hi: string, wing: string, iris: string, flying: boolean, extra: Record<string, string> = {}): MiniBoss => ({
  name,
  frames,
  flying,
  pal: withShades({ o: "#0a0c18", A: body, a: hi, W: wing, w: "#f4f1ea", E: iris, m: "#0a0c18", ...extra }, shades),
});

/** One mini-boss per section break, in page order. */
export const MINI_BOSSES: MiniBoss[] = [
  mini("Scope Creep", BLOB, BLOB_SHADES, "#4f9a45", "#9fd88a", "#4f9a45", "#0a0c18", false),
  mini("Imposter Syndrome", WING, WING_SHADES, "#7a5cc0", "#b7a2ec", "#4c3a86", "#ff4a8a", true),
  mini("Final Exam", BLOB, BLOB_SHADES, "#d9d2bd", "#ffffff", "#d9d2bd", "#c43b2f", false),
  mini("Stage Fright", WING, WING_SHADES, "#9fb7d8", "#e2ecf8", "#6f86a8", "#0a0c18", true),
  mini("Merge Conflict", SPLIT, SPLIT_SHADES, "#d0453a", "#f08a7e", "#d0453a", "#0a0c18", false, { B: "#3fa35a", b: "#8fe0a0", "=": "#f4f1ea" }),
  mini("Hot Take", FLAME, FLAME_SHADES, "#e0542c", "#ffd36b", "#e0542c", "#0a0c18", true, { Y: "#ffb347", R: "#ff2e2e" }),
  mini("Reviewer 2", SCHOLAR, SCHOLAR_SHADES, "#e8c39e", "#f6dcc0", "#e8c39e", "#0a0c18", false, { k: "#1a1a24", T: "#ffcf3f", H: "#a3a9b5", G: "#2a2f3a", C: "#7a6a58", P: "#f4f1ea", X: "#e5484d", R: "#e5484d" }),
];

// --- the final boss: the AI slop PR ------------------------------------------------------
// AI slop code given a body. It wears a sparkle crown, has too many eyes and too
// many teeth, and its purple-to-blue gradient body is made of syntax-highlighted
// code lines over a +/- diff bar. Slop drips off the bottom.

export const SLOP_PR: Frame[] = [
  [
    "............YY....................YY....................YY......",
    "...........YYYY..................YYYY..................YYYY.....",
    "..........YYYYYY........YY......YYYYYY......YY........YYYYYY....",
    "..........YYYYYY.......YYYY.....YYYYYY.....YYYY.......YYYYYY....",
    "...........YYYY.......YYYYYY.....YYYY.....YYYYYY.......YYYY.....",
    "............YY........YYYYYY......YY......YYYYYY........YY......",
    ".......................YYYY................YYYY.................",
    "........................YY..................YY..................",
    ".................0000000YY000000000000000000YY0.................",
    "...............006666667oo666666666666666667oo700...............",
    ".............0066PPPPPPP66PPPPPPPPPPPPPPPPPP66P6700.............",
    "...........o066PPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPP670o...........",
    "...........o6PPPP886PPPPPPPPPPPPPPPPPPPPPPPPPPPPPPP7o...........",
    ".........o06PPP788886PPPPPPPPPPPPPPPP777777PPPPPPPPP70o.........",
    ".........o6PP77ooooo7PPPPPPPPPPPPPP77oooooo77PPPPPPPP7o.........",
    "........06PP7oooooooo7PPPPPPPPPPPP7oooooooooo6PPPPPPPP7o........",
    "........o6P7oowwEEwwoo6PPPPPPPPPPP7oowwwwwwoo7PPPPPPPP7o........",
    ".......06PP7oowwEEwwoo6PPPP77PPPP7oowwwwwwwwoo6PPPPPPPP7o.......",
    ".......o6PPP7oooooooo6PPP77oo77PP7oowwEEEEwwoo6PPPPPPPP7o.......",
    "......06PPPPP67oooo66PPP7oooooo7P7oowwEEEEwwoo6PPPPPPPPP7o......",
    "......o6PPPPPPP6666PPPP7oowwEEoo67oowwwwwwwwoo6PPPPPPPPP7o......",
    "......o6PPPPPPPPPPPPPPP7oowwEEoo67ooowwwwwwooo6PPPPPPPPP7o......",
    "......o6PPPPPPPPPPPPPPPP7oooooo6P7oooooooooooo6PPPPPPPPP7o......",
    ".....06PPPPPPPPPPPPPPPPPP67oo66PPP7ooooooooooo6PPPPPPPPPP7o.....",
    ".....o6PPP1111111111111116P66PPPPPP666222222222222226PPPP7o.....",
    "....06PPPP11111111111111116PPPPPPPPPPP622222222222226PPPPP7o....",
    "....o6PPPP666633333333333333333336PPPPP6666644444466PPPPPP7o....",
    "....o6PPPPPPPP333333333333333333336PPPPPPPPP4444446PPPPPPP7o....",
    "....o6PPPkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk6PP7o....",
    "....o7PPkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk6P7o....",
    ".999!o6PkkTTkkTTkkTTkkTTkkTTkkTTkkTTkkTTkkTTkkTTkkTTkkkT67o!99!.",
    "9HH!oo6P6kTTkkTTkkTTkkTTkkTTkkTTkkTTkkTTkkTTkkTTkkTTkkT6P7oo9HH!",
    "!HH!oo6PPkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk6PP7oo9HH!",
    ".9H!oo6PP6kkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk6PPP7oo9H!.",
    ".!!H!o7PPP5555555555555555666666666611111111111111666PPPP7o!H!!.",
    "...!ooo7PP65555555555555556PPPPPPPPP11111111111116PPPPPP7ooo!...",
    ".....ooo#6P66666662222222222222222222222226666666PPPPPP$ooo.....",
    "......o#B##6PPPPPP2222222222222222222222226PPPPPPPPPP##B$o......",
    "......o#BBB#444444444444########333333333333333333###BBB$o......",
    "......o#BBBB#4444444444#BBBBBBBB33333333333333333#BBBBBB$o......",
    "......oB$$$$$BBBBBBBBBB$$GGGGGGGGGGGXXXXXXBBBBBBB$$$$$$$%o......",
    "......oB$$$$$$$$$$$$$$$$GGGGGGGGGGGGXXXXXXB$$$$$$$$$$$$$%o......",
    "......o%$$$$11111111111111BBBBBBBBBBBB22222222B$$$$$$$$$%o......",
    ".......o%$$$1111111111111B$$$$$$$$$$$$B2222222B$$$$$$$$%o.......",
    ".......oo%$$BBBBBBBBBBBBB$$$$$$$$$$$$$$BBBBBBB$$$$$$$$%oo.......",
    ".........o%%%$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$%%%o.........",
    "............o%%$%$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$%%o............",
    ".............oo%oB$$$$$$$$$$$%%$$$$$$$$$$%%$$$$%%oo.............",
    "...............o%$$$%%%%%%$$%oo%%%$$$$%%%oo%$$%oo...............",
    "................oB$%ooooooB%oooooo%$$%ooooooB%o.................",
    "................o%$%......%%ooo....%$%...oo%$%..................",
    ".................oB%.......B%o......B%.....oB%..................",
    "..................B%.......%$%......B%......B%..................",
    "..................%%........B%......%%......%%..................",
    "............................B%..................B%..............",
    "............................%%..................%%..............",
  ],
  [
    "..........YY........................YY................YY........",
    ".........YYYY......................YYYY..............YYYY.......",
    "........YYYYYY........YY..........YYYYYY....YY......YYYYYY......",
    "........YYYYYY.......YYYY.........YYYYYY...YYYY.....YYYYYY......",
    ".........YYYY.......YYYYYY.........YYYY...YYYYYY.....YYYY.......",
    "..........YY........YYYYYY..........YY....YYYYYY......YY........",
    ".....................YYYY..................YYYY.................",
    "......................YY....................YY..................",
    ".................00000YY00000000000000000000YY0.................",
    "...............0066667oo66666666666666666667oo700...............",
    ".............0066PPPPP66PPPPPPPPPPPPPPPPPPPP66P6700.............",
    "...........o066PPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPP670o...........",
    "...........o6PPPP886PPPPPPPPPPPPPPPPPPPPPPPPPPPPPPP7o...........",
    ".........o06PPP788886PPPPPPPPPPPPPPPP777777PPPPPPPPP70o.........",
    ".........o6PP77ooooo7PPPPPPPPPPPPPP77oooooo77PPPPPPPP7o.........",
    "........06PP7oooooooo7PPPPPPPPPPPP7oooooooooo6PPPPPPPP7o........",
    "........o6P7ooEEwwwwoo6PPPPPPPPPPP7oowwwwwwoo7PPPPPPPP7o........",
    ".......06PP7ooEEwwwwoo6PPPP77PPPP7oowwwwwwwwoo6PPPPPPPP7o.......",
    ".......o6PPP7oooooooo6PPP77oo77PP7ooEEEEwwwwoo6PPPPPPPP7o.......",
    "......06PPPPP67oooo66PPP7oooooo7P7ooEEEEwwwwoo6PPPPPPPPP7o......",
    "......o6PPPPPPP6666PPPP7ooEEwwoo67oowwwwwwwwoo6PPPPPPPPP7o......",
    "......o6PPPPPPPPPPPPPPP7ooEEwwoo67ooowwwwwwooo6PPPPPPPPP7o......",
    "......o6PPPPPPPPPPPPPPPP7oooooo6P7oooooooooooo6PPPPPPPPP7o......",
    ".....06PPPPPPPPPPPPPPPPPP67oo66PPP7ooooooooooo6PPPPPPPPPP7o.....",
    ".....o6PPP11111111111116PPP66PPPPPP66622222222222222226PP7o.....",
    "....06PPPP111111111111116PPPPPPPPPPPPP62222222222222226PPP7o....",
    "....o6PPPP666666333333333333333336PPPPP666666644444466PPPP7o....",
    "....o7PPPPPPPPPP3333333333333333336PPPPPPPPPPP4444446PPPPP7o....",
    ".999!o6PPkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk6P7o!99!.",
    "9HH!oo6Pkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk67oo9HH!",
    "!HH!oo6PTkkkTTkkTTkkTTkkTTkkTTkkTTkkTTkkTTkkTTkkTTkkTTkk67oo9HH!",
    ".!!!!o6P6TkkTTkkTTkkTTkkTTkkTTkkTTkkTTkkTTkkTTkkTTkkTTk6P7o!!!!.",
    "....o6PPP6kkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk6PP7o....",
    "....o6PPPPkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk66PPP7o....",
    "....o7PPPP5555555555555566666666666611111111111111116PPPPP7o....",
    ".....o77PP655555555555556PPPPPPPPPPP1111111111111116PPPP77o.....",
    ".....ooo#6P6666666222222222222222222222222666666666PPPP$ooo.....",
    "......o#B##6PPPPPP2222222222222222222222226PPPPPPPPPP##B$o......",
    "......o#BBB#4444444444##########33333333333333333333#BBB$o......",
    "......o#BBBB#44444444#BBBBBBBBBB3333333333333333333#BBBB$o......",
    "......oB$$$$$BBBBBBBB$$$$GGGGGGGGGGGXXXXXXBBBBBBBBB$$$$$%o......",
    "......oB$$$$$$$$$$$$$$$$GGGGGGGGGGGGXXXXXXB$$$$$$$$$$$$$%o......",
    "......o%$$$$$$111111111111BBBBBBBBBBBBBB22222222B$$$$$$$%o......",
    ".......o%$$$$$11111111111B$$$$$$$$$$$$$$B2222222B$$$$$$%o.......",
    ".......oo%$$$$BBBBBBBBBBB$$$$$$$$$$$$$$$$BBBBBBB$$$$$$%oo.......",
    ".........o%%%$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$%%%o.........",
    "............o%%$%$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$%%o............",
    ".............oo%oB$$$$$$$$$$$%%$$$$$$$$$$%%$$$$%%oo.............",
    "...............o%$$$%%%%%%$$%oo%%%$$$$%%%oo%$$%oo...............",
    "................oB$%ooooooB%oooooo%$$%ooooooB%o.................",
    "................o%$%......%%ooo....%$%...oo%$%..................",
    ".................o%.%......B%o......%$%....o%.%.................",
    "...................%$%.....%$%.......%$%.....%$%................",
    "....................B%......%%........%%......%$%...............",
    "....................B%.........................%$%..............",
    "....................%%..........................%%..............",
  ],
];

export const SLOP_PAL: Record<string, string> = withShades({"1":"#c792ea","2":"#82aaff","3":"#c3e88d","4":"#f78c6c","5":"#89ddff","Y":"#ffe66b","o":"#0a0c18","P":"#7b5cff","p":"#b9a6ff","B":"#4f7cff","w":"#f4f1ea","E":"#ff4fd8","k":"#14101f","T":"#f4f1ea","H":"#9d86ff","G":"#3fb950","X":"#f85149"}, { "0": ["P", "sel"], "6": ["P", 1], "7": ["P", -1], "8": ["P", 2], "9": ["H", 1], "!": ["H", -1], "#": ["B", 1], "$": ["B", -1], "%": ["B", -2] });

/** Lines the boss says in speech bubbles over the page. */
export const SLOP_LINES = [
  "Great question! ✨",
  "You're absolutely right!",
  "Let me delve into that—",
  "LGTM 🚀",
  "I've refactored everything—",
  "Here's a comprehensive overview:",
  "As an AI, I can't merge myself."
];

export const WHITE = (pal: Record<string, string>) => Object.fromEntries(Object.keys(pal).map((k) => [k, "#ffffff"]));
