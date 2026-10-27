// Run with: npm run test
import { test } from "node:test";
import assert from "node:assert/strict";
import { batteredLevel, pixelSprite, sampleFace, toGrid } from "./portrait.ts";

type Px = [number, number, number, number];
function image(w: number, h: number, fn: (x: number, y: number) => Px) {
  const data = new Uint8ClampedArray(w * h * 4);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) data.set(fn(x, y), (y * w + x) * 4);
  return data;
}

test("sampleFace skips transparent pixels and spreads tones across the ramp", () => {
  const data = image(10, 10, (x, y) => (x < 2 ? [0, 0, 0, 0] : [40 + y * 20, 40 + y * 20, 40 + y * 20, 255]));
  const cells = sampleFace(data, 10, 10, { rows: 10, tones: 5, fade: 0 });
  assert.equal(cells.length, 80, "the two transparent columns drop out");
  const tones = cells.map((c) => c.tone);
  assert.equal(Math.min(...tones), 0, "the darkest pixel takes the first tone");
  assert.equal(Math.max(...tones), 4, "the brightest pixel takes the last tone");
  for (const c of cells) {
    assert.ok(c.y >= -0.5 && c.y <= 0.5, `y=${c.y} leaves the unit height`);
    assert.ok(c.x >= -0.5 && c.x <= 0.5, `x=${c.x} leaves the image width`);
  }
});

test("sampleFace takes one row of cells per step", () => {
  const data = image(20, 20, () => [128, 128, 128, 255]);
  const cells = sampleFace(data, 20, 20, { rows: 5, tones: 3, fade: 0 });
  assert.equal(new Set(cells.map((c) => c.y)).size, 5);
  assert.equal(cells.length, 25, "a square image gets as many columns as rows");
});

test("sampleFace thins the bottom fade band and leaves the rest whole", () => {
  const data = image(40, 40, () => [128, 128, 128, 255]);
  const cells = sampleFace(data, 40, 40, { rows: 40, tones: 3, fade: 0.25 });
  const rowCount = (y: number) => cells.filter((c) => Math.abs(c.y - y) < 1e-9).length;
  const ys = [...new Set(cells.map((c) => c.y))].sort((a, b) => a - b);
  assert.equal(rowCount(ys[0]), 40, "the top row keeps every cell");
  assert.ok(rowCount(ys.at(-1)!) < 10, "the bottom row is mostly gone");
  assert.deepEqual(sampleFace(data, 40, 40, { rows: 40, tones: 3, fade: 0.25 }), cells, "the dither is deterministic");
});

test("pixelSprite snaps colors to the palette and outlines the silhouette", () => {
  const palette: [number, number, number][] = [
    [0, 0, 0],
    [200, 120, 90],
  ];
  const data = image(3, 3, (x, y) => (x === 1 && y === 1 ? [190, 125, 80, 255] : [255, 0, 255, 0]));
  pixelSprite(data, 3, 3, palette, [10, 12, 28]);
  const at = (x: number, y: number) => [...data.slice((y * 3 + x) * 4, (y * 3 + x) * 4 + 4)];
  assert.deepEqual(at(1, 1), [200, 120, 90, 255], "the body pixel snaps to the nearest palette color");
  assert.deepEqual(at(1, 0), [10, 12, 28, 255], "a side neighbour becomes outline");
  assert.deepEqual(at(0, 0)[3], 0, "a corner stays transparent");
});

test("batteredLevel climbs with recent hits and heals once they age out", () => {
  const now = 100_000;
  assert.equal(batteredLevel([], now), 0);
  assert.equal(batteredLevel([now - 1000], now), 0, "one hit leaves no mark");
  assert.equal(batteredLevel([now - 3000, now - 2000], now), 1);
  assert.equal(batteredLevel(Array.from({ length: 4 }, (_, i) => now - i * 500), now), 2);
  assert.equal(batteredLevel(Array.from({ length: 12 }, (_, i) => now - i * 500), now), 3, "the level caps at 3");
  assert.equal(batteredLevel([now - 20_000, now - 19_000, now - 18_000], now), 0, "hits older than 15s heal");
});

test("toGrid maps a rectangle in cutout pixels onto the sprite grid", () => {
  const crop = [100, 50, 200] as const;
  assert.deepEqual(toGrid([100, 50, 200, 200], crop, 40), [0, 0, 40, 40], "the whole crop fills the grid");
  assert.deepEqual(toGrid([150, 100, 50, 10], crop, 40), [10, 10, 10, 2]);
  assert.deepEqual(toGrid([150, 100, 1, 1], crop, 40), [10, 10, 1, 1], "tiny features keep at least one pixel");
});
