// Run with: npm run test
import { test } from "node:test";
import assert from "node:assert/strict";
import { buildJourney, buildRoad, pointAt, roundCorners, scrollSpeed, spawnPlan, stopForValue, tAtY } from "./world.ts";

test("buildRoad zigzags down inside the margins", () => {
  const road = buildRoad(60, 600, 6, 8);
  assert.equal(road[0].y, 0);
  assert.equal(road.at(-1)!.y, 600);
  for (const p of road) {
    assert.ok(p.x >= 8 && p.x <= 52, `x=${p.x} escapes the margins`);
  }
  for (let i = 1; i < road.length; i++) {
    assert.ok(road[i].y >= road[i - 1].y, "road must only go downhill");
  }
  const xs = new Set(road.map((p) => p.x));
  assert.ok(xs.size > 1, "road should switch back, not run straight");
});

test("pointAt walks the road by arc length", () => {
  const road = [
    { x: 0, y: 0 },
    { x: 10, y: 0 },
    { x: 10, y: 10 },
  ];
  assert.deepEqual(pointAt(road, 0), { x: 0, y: 0, dir: 1 });
  assert.deepEqual(pointAt(road, 0.25), { x: 5, y: 0, dir: 1 });
  assert.deepEqual(pointAt(road, 0.75), { x: 10, y: 5, dir: 1 });
  assert.deepEqual(pointAt(road, 1), { x: 10, y: 10, dir: 1 });
  assert.deepEqual(pointAt(road, 2), { x: 10, y: 10, dir: 1 }, "clamps past the end");
});

test("pointAt reports facing direction on leftward segments", () => {
  const road = [
    { x: 10, y: 0 },
    { x: 0, y: 0 },
  ];
  assert.equal(pointAt(road, 0.5).dir, -1);
});

test("stopForValue snaps a 0..100 slider to the nearest stop", () => {
  assert.equal(stopForValue(0, 5), 0);
  assert.equal(stopForValue(12, 5), 0);
  assert.equal(stopForValue(13, 5), 1);
  assert.equal(stopForValue(50, 5), 2);
  assert.equal(stopForValue(100, 5), 4);
  assert.equal(stopForValue(140, 5), 4, "clamps above range");
});

test("buildRoad with a random source varies legs but keeps the invariants", () => {
  let seed = 3;
  const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  const road = buildRoad(60, 900, 20, 8, rand);
  assert.equal(road[0].y, 0);
  assert.equal(road.at(-1)!.y, 900);
  const drops = new Set<number>();
  for (let i = 1; i < road.length; i++) {
    assert.ok(road[i].y >= road[i - 1].y, "road must only go downhill");
    assert.ok(road[i].x >= 8 && road[i].x <= 52, `x=${road[i].x} escapes the margins`);
    drops.add(road[i].y - road[i - 1].y);
  }
  assert.ok(drops.size > 3, "legs should not all drop by the same amount");
});

test("buildJourney runs down a gutter and crosses at each section break", () => {
  const left: [number, number] = [4, 40];
  const right: [number, number] = [320, 356];
  const { road, crossings } = buildJourney({ top: 30, bottom: 2000, boundaries: [400, 900, 1500], left, right, leg: 26, cross: 8 });
  assert.equal(road[0].y, 30);
  assert.equal(road.at(-1)!.y, 2000);
  assert.equal(crossings.length, 3);
  for (let i = 1; i < road.length; i++) {
    assert.ok(road[i].y >= road[i - 1].y, "road must only go downhill");
  }
  // Every point sits in a lane. Only crossing legs pass over the content column.
  for (const p of road) {
    const inLane = (p.x >= left[0] && p.x <= left[1]) || (p.x >= right[0] && p.x <= right[1]);
    assert.ok(inLane, `point (${p.x}, ${p.y}) is outside both lanes`);
  }
  [400, 900, 1500].forEach((b, i) => {
    assert.ok(Math.abs(crossings[i].y - b) <= 8, `crossing ${i} at y=${crossings[i].y} drifts from its break at ${b}`);
  });
  // The first zone starts in the right lane, so the first crossing heads left.
  assert.ok(road[0].x >= right[0]);
});

test("buildJourney with a small sway keeps each lane nearly straight", () => {
  const left: [number, number] = [4, 64];
  const right: [number, number] = [300, 360];
  const sway = 0.3;
  let seed = 7;
  const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  const { road } = buildJourney({ top: 30, bottom: 3000, boundaries: [700, 1500, 2300], left, right, leg: 60, cross: 8, sway, rand });
  // Legs that stay inside one lane swing across at most the sway band.
  for (let i = 1; i < road.length; i++) {
    const a = road[i - 1], b = road[i];
    const lane = [left, right].find((l) => a.x >= l[0] && a.x <= l[1] && b.x >= l[0] && b.x <= l[1]);
    if (!lane || b.y === a.y) continue;
    const width = lane[1] - lane[0];
    assert.ok(Math.abs(b.x - a.x) <= width * sway + 1, `leg ${i} swings ${Math.abs(b.x - a.x)} across a ${width}-wide lane`);
  }
});

test("tAtY finds where the road reaches a height", () => {
  const road = [
    { x: 0, y: 0 },
    { x: 0, y: 10 },
    { x: 10, y: 10 },
    { x: 10, y: 20 },
  ];
  assert.equal(tAtY(road, -5), 0);
  assert.equal(tAtY(road, 5), 5 / 30);
  assert.equal(tAtY(road, 10), 10 / 30, "a flat leg resolves to where the road first reaches it");
  assert.equal(tAtY(road, 15), 25 / 30);
  assert.equal(tAtY(road, 99), 1);
});

test("spawnPlan spreads minions evenly through each zone, clear of its edges", () => {
  const zones: [number, number][] = [
    [0, 0.2],
    [0.2, 0.5],
    [0.5, 1],
  ];
  const plan = spawnPlan(zones, 3, 0.02);
  assert.equal(plan.length, 9);
  zones.forEach(([a, b], i) => {
    const mine = plan.filter((p) => p.zone === i);
    assert.equal(mine.length, 3, `zone ${i} should hold 3 minions`);
    for (const p of mine) assert.ok(p.t > a + 0.02 && p.t < b - 0.02, `minion at ${p.t} sits in zone ${i}'s margin`);
  });
  for (let i = 1; i < plan.length; i++) assert.ok(plan[i].t > plan[i - 1].t, "plan should be ordered along the road");
});

test("spawnPlan skips zones too short to fit a minion", () => {
  assert.equal(spawnPlan([[0, 0.03]], 4, 0.02).length, 0);
  assert.equal(spawnPlan([[0, 1]], 0, 0.02).length, 0);
});

test("scrollSpeed measures pixels per second across the sample window", () => {
  assert.equal(scrollSpeed([]), 0);
  assert.equal(scrollSpeed([{ t: 0, d: 0 }]), 0);
  assert.equal(scrollSpeed([{ t: 0, d: 0 }, { t: 100, d: 300 }]), 3000);
  assert.equal(scrollSpeed([{ t: 0, d: 0 }, { t: 50, d: 40 }, { t: 200, d: 100 }]), 500, "uses the first and last sample");
  assert.equal(scrollSpeed([{ t: 10, d: 5 }, { t: 10, d: 90 }]), 0, "a zero-length window has no speed");
});

test("roundCorners rounds each turn and keeps the ends and the downhill rule", () => {
  const road = [
    { x: 0, y: 0 },
    { x: 40, y: 40 },
    { x: 0, y: 80 },
    { x: 100, y: 84 },
  ];
  const out = roundCorners(road, 6, 5);
  assert.deepEqual(out[0], road[0]);
  assert.deepEqual(out.at(-1), road.at(-1));
  for (let i = 1; i < out.length; i++) assert.ok(out[i].y >= out[i - 1].y, "rounded road must still only go downhill");
  // The sharp corners themselves are cut off.
  for (const v of road.slice(1, -1)) assert.ok(!out.some((p) => p.x === v.x && p.y === v.y), `corner (${v.x}, ${v.y}) survived`);
  // A long leg keeps its middle, so crossings and bosses stay on the road.
  assert.ok(out.some((p) => p.x === 50 && p.y === 82) || out.some((p, i) => i > 0 && out[i - 1].x < 50 && p.x > 50));
});
