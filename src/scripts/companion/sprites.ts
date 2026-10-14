// Pixel art for the background game. Frames are strings, one character per
// pixel, facing right. "." is transparent, and every other character keys into a
// palette. Rows get padded to equal width so mirrored frames line up.
export type Frame = string[];

const pad = (rows: Frame): Frame => {
  const w = Math.max(...rows.map((r) => r.length));
  return rows.map((r) => r.padEnd(w, "."));
};

// --- the two heroes ----------------------------------------------------------

export const WANDERER: Frame = pad([
  "...oooo.....",
  "...occCCo...",
  "..occccCCo..",
  "..occffffo..",
  "..occfefeo..",
  "..occffffo..",
  "..osssssso..",
  ".odcccccCCo.",
  ".odcccccCCo.",
  ".oddccccCCo.",
  ".oddcccccCo.",
  "oddddccccCo.",
  "oddddcccccco",
]);

// The professional: slicked hair, glasses, white collar, LinkedIn-blue tie, navy suit.
export const PRO: Frame = pad([
  "....oooo....",
  "...ohhhho...",
  "..ohhhhhho..",
  "..ohhkkkko..",
  "..ohkgkgko..",
  "..ohkkkkKo..",
  "...okkkKo...",
  ".oSswtwsSo..",
  "osSswtwsSSo.",
  "osSssttsSSo.",
  "osSssttsSSo.",
  "odSssstsSSo.",
  "odssssssSSo.",
]);

export const LEGS: Record<string, Frame> = {
  idle: pad([".....b.b....", ".....b.b....", ".....bb.bb.."]),
  stride: pad([".....b..b...", "....b....b..", "....bb...bb."]),
  pass: pad(["......b.....", "......b.....", "......bb...."]),
  run: pad(["....b....b..", "...b......b.", "..bb......bb"]),
  lunge: pad(["....b...b...", "...b.....b..", "..bb.....bb."]),
};

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
  pal: { o: "#080a16", c: "#2e3f74", C: "#5070b8", d: "#18203f", f: "#06070f", e: "#ffe08a", s: scarf, b: "#1e1418" },
  trail: [scarf, tip],
  trailLength: 11,
  weapon: "sword",
  weaponColor: "#d8e6ff",
});

const pro = (tie: string, keys: string): Omit<Look, "crown" | "aura"> => ({
  body: PRO,
  pal: { o: "#080a16", h: "#2a1d16", k: "#e0a37a", K: "#b9805c", g: "#0b0d18", w: "#f2efe8", t: tie, s: "#1f2a44", S: "#34466e", d: "#141b2e", b: "#141b2e" },
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

// --- minions ------------------------------------------------------------------

export const SLIME: Frame[] = [
  pad(["...oooo...", "..oGGGGo..", ".oGgGGGGo.", ".oGeGGeGo.", "oGGGGGGGGo", "oGGGGGGGgo", ".oooooooo."]),
  pad(["..........", "...oooo...", ".ooGGGGoo.", "oGgGeGGeGo", "oGGGGGGGGo", "oGGGGGGGgo", ".oooooooo."]),
];
export const BAT: Frame[] = [
  pad(["B.........B", "BB..ooo..BB", ".BBoRoRoBB.", "..BBoooBB..", "....o.o...."]),
  pad(["...........", "....ooo....", "..BoRoRoB..", ".BBBoooBBB.", "BB..o.o..BB"]),
];

// Daytime minions: the slime puts on sunglasses, and the bat gives way to a seagull.
export const SLIME_DAY: Frame[] = [
  pad(["...oooo...", "..oGGGGo..", ".oGgGGGGo.", ".oqqGqqGo.", "oGGGGGGGGo", "oGGGGGGGgo", ".oooooooo."]),
  pad(["..........", "...oooo...", ".ooGGGGoo.", "oGgqqGqqGo", "oGGGGGGGGo", "oGGGGGGGgo", ".oooooooo."]),
];
export const GULL: Frame[] = [
  pad(["WW.......WW", ".WW.....WW.", "..WWoooWW..", "....oYo....", ".....o....."]),
  pad(["...........", "....ooo....", "WWWWoYoWWWW", ".WW..o..WW.", "W.........W"]),
];
export const MINION_NIGHT: Record<string, string> = { o: "#0a0c18", G: "#6bd36b", g: "#b8f5a0", e: "#0a0c18", B: "#4a2f6b", R: "#ff4a4a" };
export const MINION_DAY: Record<string, string> = { o: "#2a2f3a", G: "#a6e05a", g: "#e6ffb0", q: "#14161f", W: "#fbfaf6", Y: "#f2b134" };

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

// --- mini-bosses: shared blob and wing bodies, plus three one-offs ---------------

const BLOB: Frame[] = [
  pad([
    ".....oooooo.....",
    "...ooAAAAAAoo...",
    "..oAAaAAAAAAAo..",
    ".oAAaAAAAAAAAAo.",
    ".oAAAwwAAAwwAAo.",
    "oAAAAwEAAAwEAAAo",
    "oAAAAAAAAAAAAAAo",
    "oAAAAAmmmmmAAAAo",
    "oAAAAAAAAAAAAAAo",
    ".oAAAAAAAAAAAAo.",
    "..oooooooooooo..",
  ]),
  pad([
    "................",
    "....oooooooo....",
    "..ooAAaAAAAAoo..",
    ".oAAaAAAAAAAAAo.",
    "oAAAAwwAAAAwwAAo",
    "oAAAAwEAAAAwEAAo",
    "oAAAAAAAAAAAAAAo",
    "oAAAAAmmmmmmAAAo",
    "oAAAAAAAAAAAAAAo",
    ".oAAAAAAAAAAAAAo",
    "..ooooooooooooo.",
  ]),
];

const WING: Frame[] = [
  pad([
    "W...............W",
    "WW.....ooo.....WW",
    "WWW...oAAAo...WWW",
    ".WWWWoAwAwAoWWWW.",
    "..WWWoAAAAAoWWW..",
    "....WoAmmmAoW....",
    "......oAAAo......",
    ".......o.o.......",
  ]),
  pad([
    ".................",
    ".......ooo.......",
    "......oAAAo......",
    "..WWWoAwAwAoWWW..",
    ".WWWWoAAAAAoWWWW.",
    "WWW.WoAmmmAoW.WWW",
    "WW....oAAAo....WW",
    "W......o.o......W",
  ]),
];

// Merge Conflict splits down a ======= seam, Hot Take is a shouting fireball,
// and Reviewer 2 is an academic with a red pen.
const SPLIT: Frame[] = [
  pad([
    "..oo....=....oo..",
    ".oAAoooo=ooooBBo.",
    "oAAAAAAo=oBBBBBBo",
    "oAaAAAAo=oBbBBBBo",
    "oAwwAAAo=oBBBwwBo",
    "oAwEAAAo=oBBBEwBo",
    "oAAAAAAo=oBBBBBBo",
    "oAAmmmAo=oBBmmmBo",
    "oAAAAAAo=oBBBBBBo",
    ".oAAAAAo=oBBBBBo.",
    "..ooooo.=.ooooo..",
    "...o.o.....o.o...",
  ]),
  pad([
    "..oo.........oo..",
    ".oAAoooo=ooooBBo.",
    "oAAAAAAo.oBBBBBBo",
    "oAaAAAAo=oBbBBBBo",
    "oAwwAAAo.oBBBwwBo",
    "oAwEAAAo=oBBBEwBo",
    "oAAAAAAo.oBBBBBBo",
    "oAmAmAmo=omBmBmBo",
    "oAAAAAAo.oBBBBBBo",
    ".oAAAAAo=oBBBBBo.",
    "..ooooo...ooooo..",
    "....o.o...o.o....",
  ]),
];

const FLAME: Frame[] = [
  pad([
    ".......Y.......",
    "......YY...Y...",
    "..Y..YAY..YY...",
    "..YY.YAAY.YAY..",
    ".YAY.YAAAYYAY..",
    ".YAAYAAaAAYAAY.",
    ".YAAoAaaaAoAAY.",
    "YAAAAwwAwwAAAAY",
    "YAAAAwEAEwAAAAY",
    "YAAAAAAAAAAAAAY",
    ".YAAAmmmmmAAAY.",
    ".YAAAmRRRmAAY..",
    "..YAAAmmmAAAY..",
    "...YYAAAAAYY...",
    ".....YYYYY.....",
  ]),
  pad([
    "......Y........",
    "...Y..YY..Y....",
    "..YY.YAY.YY....",
    ".YAY.YAAYYAY...",
    ".YAAYYAAAYAAY..",
    ".YAAYAAaAAYAAY.",
    ".YAAoAaaaAoAAY.",
    "YAAAAwwAwwAAAAY",
    "YAAAAwEAEwAAAAY",
    "YAAAAAAAAAAAAAY",
    ".YAAmmmmmmmAAY.",
    ".YAAmRRRRRmAY..",
    "..YAAmmmmmAAY..",
    "...YYAAAAAYY...",
    ".....YYYYY.....",
  ]),
];

const SCHOLAR: Frame[] = [
  pad([
    "....kkkkkkk....",
    "..kkkkkkkkkkk..",
    "....okkkkko.T..",
    "...oHHHHHHHo.T.",
    "..oAAAAAAAAAo..",
    "..oGGGGAGGGGo..",
    "..oGwEGAGwEGo..",
    "..oAAAAAAAAAo..",
    "..oAAAmmmAAAo..",
    "...oAmAAAmAo...",
    "..oCCCCCCCCCo..",
    ".oCCCCCCCCCCCoR",
    ".oCCCPPPPPCCoR.",
    ".oCCCPXPXPCCo..",
    "..oCCPPPPPCo...",
    "...oo.....oo...",
  ]),
  pad([
    "....kkkkkkk....",
    "..kkkkkkkkkkk..",
    "....okkkkko..T.",
    "...oHHHHHHHo.T.",
    "..oAAAAAAAAAo..",
    "..oGGGGAGGGGo..",
    "..oGEwGAGEwGo..",
    "..oAAAAAAAAAo..",
    "..oAAAmmmAAAo..",
    "...oAmAAAmAo...",
    "..oCCCCCCCCCoR.",
    ".oCCCCCCCCCCCoR",
    ".oCCCPPPPPCCo..",
    ".oCCCPPXPXCCo..",
    "..oCCPPPPPCo...",
    "...oo.....oo...",
  ]),
];

export type MiniBoss = { name: string; frames: Frame[]; pal: Record<string, string>; flying: boolean };

const mini = (name: string, frames: Frame[], body: string, hi: string, wing: string, iris: string, flying: boolean, extra: Record<string, string> = {}): MiniBoss => ({
  name,
  frames,
  flying,
  pal: { o: "#0a0c18", A: body, a: hi, W: wing, w: "#f4f1ea", E: iris, m: "#0a0c18", ...extra },
});

/** One mini-boss per section break, in page order. */
export const MINI_BOSSES: MiniBoss[] = [
  mini("Scope Creep", BLOB, "#4f9a45", "#9fd88a", "#4f9a45", "#0a0c18", false),
  mini("Imposter Syndrome", WING, "#7a5cc0", "#b7a2ec", "#4c3a86", "#ff4a8a", true),
  mini("Final Exam", BLOB, "#d9d2bd", "#ffffff", "#d9d2bd", "#c43b2f", false),
  mini("Stage Fright", WING, "#9fb7d8", "#e2ecf8", "#6f86a8", "#0a0c18", true),
  mini("Merge Conflict", SPLIT, "#d0453a", "#f08a7e", "#d0453a", "#0a0c18", false, { B: "#3fa35a", b: "#8fe0a0", "=": "#f4f1ea" }),
  mini("Hot Take", FLAME, "#e0542c", "#ffd36b", "#e0542c", "#0a0c18", true, { Y: "#ffb347", R: "#ff2e2e" }),
  mini("Reviewer 2", SCHOLAR, "#e8c39e", "#f6dcc0", "#e8c39e", "#0a0c18", false, { k: "#1a1a24", T: "#ffcf3f", H: "#a3a9b5", G: "#2a2f3a", C: "#7a6a58", P: "#f4f1ea", X: "#e5484d", R: "#e5484d" }),
];

// --- the final boss: the AI slop PR ----------------------------------------------
// AI slop code given a body. It wears a sparkle crown, has too many eyes and too
// many teeth, and its purple-to-blue gradient body is made of syntax-highlighted
// code lines over a +/- diff bar. Slop drips off the bottom.

export const SLOP_PR: Frame[] = [
  pad([
    "......Y..........Y..........Y...",
    ".....YYY....Y...YYY...Y....YYY..",
    "......Y....YYY...Y...YYY....Y...",
    "............Y.........Y.........",
    "........oooooooooooooooo........",
    "......ooPPPPPPPPPPPPPPPPoo......",
    ".....oPPppPPPPPPPPPPPPPPPPo.....",
    "....oPPoooPPPPPPPPooooPPPPPo....",
    "....oPowEwoPPPPPPowwwwoPPPPo....",
    "...oPPPoooPPPooPPowEEwoPPPPPo...",
    "...oPPPPPPPPowEoPowwwwoPPPPPo...",
    "...oPPPPPPPPPooPPooooooPPPPPo...",
    "..oPP11111111PPPPPP2222222PPPo..",
    "..oPPPP3333333333PPPPP444PPPPo..",
    "..oPkkkkkkkkkkkkkkkkkkkkkkkkPo..",
    "HHoPkTkTkTkTkTkTkTkTkTkTkTkTPoHH",
    "HHoPPkkkkkkkkkkkkkkkkkkkkkkPPoHH",
    ".HoPP55555555PPPPP1111111PPPPoH.",
    "...oBPPPP222222222222PPPPPPBo...",
    "...oBB444444BBBB333333333BBBo...",
    "...oBBBBBBBBGGGGGGXXXBBBBBBBo...",
    "...oBB1111111BBBBBB2222BBBBBo...",
    "....oBBBBBBBBBBBBBBBBBBBBBBo....",
    "......ooBBBBBBBBBBBBBBBBoo......",
    "........oBoooBoooBBoooBo........",
    "........oB...Bo...B..oB.........",
    ".........B....B...B...B.........",
    "..............B.........B.......",
  ]),
  pad([
    ".....Y............Y........Y....",
    "....YYY....Y.....YYY..Y...YYY...",
    ".....Y....YYY.....Y..YYY...Y....",
    "...........Y..........Y.........",
    "........oooooooooooooooo........",
    "......ooPPPPPPPPPPPPPPPPoo......",
    ".....oPPppPPPPPPPPPPPPPPPPo.....",
    "....oPPoooPPPPPPPPooooPPPPPo....",
    "....oPoEwwoPPPPPPowwwwoPPPPo....",
    "...oPPPoooPPPooPPoEEwwoPPPPPo...",
    "...oPPPPPPPPoEwoPowwwwoPPPPPo...",
    "...oPPPPPPPPPooPPooooooPPPPPo...",
    "..oPP1111111PPPPPPP22222222PPo..",
    "..oPPPPP333333333PPPPPP444PPPo..",
    "HHoPkkkkkkkkkkkkkkkkkkkkkkkkPoHH",
    "HHoPTkTkTkTkTkTkTkTkTkTkTkTkPoHH",
    "..oPPkkkkkkkkkkkkkkkkkkkkkkPPo..",
    "..oPP5555555PPPPPP11111111PPPo..",
    "...oBPPPP222222222222PPPPPPBo...",
    "...oBB44444BBBBB3333333333BBo...",
    "...oBBBBBBBBGGGGGGXXXBBBBBBBo...",
    "...oBBB111111BBBBBBB2222BBBBo...",
    "....oBBBBBBBBBBBBBBBBBBBBBBo....",
    "......ooBBBBBBBBBBBBBBBBoo......",
    "........oBoooBoooBBoooBo........",
    "........oB...Bo...B..oB.........",
    "..........B...B....B...B........",
    "..........B.............B.......",
  ]),
];

export const SLOP_PAL: Record<string, string> = {
  Y: "#ffe66b",
  o: "#0a0c18",
  P: "#7b5cff",
  p: "#b9a6ff",
  B: "#4f7cff",
  w: "#f4f1ea",
  E: "#ff4fd8",
  k: "#14101f",
  T: "#f4f1ea",
  H: "#9d86ff",
  "1": "#c792ea",
  "2": "#82aaff",
  "3": "#c3e88d",
  "4": "#f78c6c",
  "5": "#89ddff",
  G: "#3fb950",
  X: "#f85149",
};

/** Lines the boss says in speech bubbles over the page. */
export const SLOP_LINES = [
  "Great question! ✨",
  "You're absolutely right!",
  "Let me delve into that—",
  "LGTM 🚀",
  "I've refactored everything—",
  "Here's a comprehensive overview:",
  "As an AI, I can't merge myself.",
];

export const WHITE = (pal: Record<string, string>) => Object.fromEntries(Object.keys(pal).map((k) => [k, "#ffffff"]));
