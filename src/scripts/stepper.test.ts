// Run with: npm run test
import { test } from "node:test";
import assert from "node:assert/strict";
import { stepTo } from "./stepper.ts";

test("a step never leaves the first or the last position", () => {
  assert.equal(stepTo(1, 1, 4), 2);
  assert.equal(stepTo(0, -1, 4), 0, "Back on the first step stays there");
  assert.equal(stepTo(3, 1, 4), 3, "Next on the last step stays there");
});
