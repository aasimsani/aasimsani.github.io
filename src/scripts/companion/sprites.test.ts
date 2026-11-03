// Run with: npm run test
import { test } from "node:test";
import assert from "node:assert/strict";
import { BAT, GULL, LEGS, LOOKS, MINI_BOSSES, SLIME, SLIME_DAY, SLOP_PAL, SLOP_PR, dayPalette, type Frame } from "./sprites.ts";

// Every sprite the engine draws, with the palette it draws it in.
const SETS: [string, Frame[], Record<string, string>][] = [
  ...LOOKS.map((l, i): [string, Frame[], Record<string, string>] => [`look ${i}`, [l.body, ...Object.values(LEGS)], l.pal]),
  ["slime", SLIME.frames, SLIME.pal],
  ["bat", BAT.frames, BAT.pal],
  ["slime by day", SLIME_DAY.frames, SLIME_DAY.pal],
  ["gull", GULL.frames, GULL.pal],
  ...MINI_BOSSES.map((m): [string, Frame[], Record<string, string>] => [m.name, m.frames, m.pal]),
  ["slop PR", SLOP_PR, SLOP_PAL],
];

test("every frame is a rectangle, so mirrored frames line up", () => {
  for (const [name, frames] of SETS) {
    for (const f of frames) {
      const w = f[0].length;
      assert.ok(f.every((r) => r.length === w), `${name} has ragged rows`);
    }
  }
});

test("every pixel has a color in its palette", () => {
  for (const [name, frames, pal] of SETS) {
    for (const f of frames) for (const ch of f.join("")) if (ch !== ".") assert.ok(pal[ch], `${name} draws "${ch}" with no color`);
  }
});

test("the hero and his legs are drawn at twice the detail", () => {
  for (const l of LOOKS) {
    assert.equal(l.body.length, 26);
    assert.ok(l.body.every((r) => r.length === 24));
  }
  for (const f of Object.values(LEGS)) assert.deepEqual([f[0].length, f.length], [24, 6]);
});

test("the keys other code reads by name survive the redraw", () => {
  // Death sparks read the boss body and highlight; daytime turns eyes "w" into sunglasses.
  for (const m of MINI_BOSSES) assert.ok(m.pal.A && m.pal.a && m.pal.w && m.pal.o, `${m.name} lost a named key`);
  assert.ok(SLOP_PAL.E && SLOP_PAL.Y && SLOP_PAL.G);
  assert.equal(dayPalette(MINI_BOSSES[0].pal).w, "#14161f");
});
